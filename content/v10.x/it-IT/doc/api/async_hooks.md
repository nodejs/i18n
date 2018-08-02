# Async Hooks

<!--introduced_in=v8.1.0-->

> Stabilità: 1 - Sperimentale

Il modulo `async_hooks` fornisce un'API per registrare i callback che tracciano la durata delle risorse asincrone create all'interno di un'applicazione Node.js. Ci si può accedere utilizzando:

```js
const async_hooks = require('async_hooks');
```

## Terminologia

Una risorsa asincrona rappresenta un object con un callback associato. Questo callback può essere chiamato più volte, ad esempio, l'evento `'connection'` in `net.createServer()`, oppure una sola volta come in `fs.open()`. Una risorsa può anche essere chiusa prima che il callback venga chiamato. `AsyncHook` non distingue esplicitamente questi diversi casi ma li rappresenta come il concetto astratto che è una risorsa.

## API Pubblica

### Panoramica

Di seguito è riportata una semplice panoramica dell'API pubblica.

```js
const async_hooks = require('async_hooks');

// Restituisce l'ID dell'attuale execution context.
const eid = async_hooks.executionAsyncId();

// Restituisce l'ID dell'handle responsabile per l'attivazione del callback 
// dell'attuale execution scope da chiamare.
const tid = async_hooks.triggerAsyncId();

// Crea una nuova istanza AsyncHook. Tutti questi callback sono facoltativi.
const asyncHook =
    async_hooks.createHook({ init, before, after, destroy, promiseResolve });

// Permette ai callback, di questa istanza di AsyncHook, di chiamare. Dopo aver 
// eseguito il constructor questa non è un'azione implicita quindi dev'essere 
// eseguita esplicitamente per iniziare l'esecuzione dei callback.
asyncHook.enable();

// Disabilita l'ascolto di nuovi eventi asincroni.
asyncHook.disable();

//
// Di seguito sono riportati i callback che possono essere passati a createHook().
//

// init viene chiamato durante la costruzione dell'object. La risorsa potrebbe non aver ancora 
// completato la costruzione durante l'esecuzione di questo callback, pertanto tutti i campi
// della risorsa a cui fa riferimento "asyncId" potrebbero non essere stati compilati.
function init(asyncId, type, triggerAsyncId, resource) { }

// la funzione before viene chiamata subito prima che venga chiamato il callback della risorsa. Può essere 
// chiamata 0 volte per gli handle (es. TCPWrap), e verrà chiamato esattamente 
// 1 volta per le request (es. FSReqWrap).
function before(asyncId) { }

// la funzione after viene chiamata subito dopo la fine del callback della risorsa.
function after(asyncId) { }

// la funzione destroy viene chiamata quando un'istanza AsyncWrap viene distrutta.
function destroy(asyncId) { }

// la funzione promiseResolve viene chiamata solo per le risorse promise, quando la 
// funzione `resolve` passata al constructor `Promise` viene invocata 
// (direttamente oppure tramite altri mezzi per risolvere un promise).
function promiseResolve(asyncId) { }
```

#### async_hooks.createHook(callbacks)

<!-- YAML
added: v8.1.0
-->

* `callbacks` {Object} Gli [Hook Callbacks](#async_hooks_hook_callbacks) per la registrazione 
  * `init` {Function} L'[`init` callback][].
  * `before` {Function} Il [`before` callback][].
  * `after` {Function} L'[`after` callback][].
  * `destroy` {Function} Il [`destroy` callback][].
* Restituisce: L'istanza {AsyncHook} utilizzata per disabilitare ed abilitare gli hooks

Registra le funzioni da chiamare per gli eventi di diversa durata di ogni operazione asincrona.

I callback `init()`/`before()`/`after()`/`destroy()` vengono chiamati per i rispettivi eventi asincroni nel corso della durata di una risorsa.

Tutti i callback sono facoltativi. Ad esempio, se è necessario tenere traccia solo della pulizia delle risorse, allora bisogna passare solo il `destroy` callback. Le specifiche di tutte le funzioni che possono essere passate ai `callbacks` si trovano nella sezione [Hook Callbacks](#async_hooks_hook_callbacks).

```js
const async_hooks = require('async_hooks');

const asyncHook = async_hooks.createHook({
  init(asyncId, type, triggerAsyncId, resource) { },
  destroy(asyncId) { }
});
```

Da notare che i callback verranno tramandati tramite la prototype chain:

```js
class MyAsyncCallbacks {
  init(asyncId, type, triggerAsyncId, resource) { }
  destroy(asyncId) {}
}

class MyAddedCallbacks extends MyAsyncCallbacks {
  before(asyncId) { }
  after(asyncId) { }
}

const asyncHook = async_hooks.createHook(new MyAddedCallbacks());
```

##### Gestione degli Errori

Se vengono generati eventuali callback `AsyncHook`, l'applicazione stamperà lo stack trace ed uscirà. Il percorso di exit segue quello di uncaught exception (eccezione non rilevata), ma tutti i listener `'uncaughtException'` vengono rimossi, forzando così il processo di exit. Gli `'exit'` callback saranno ancora chiamati a meno che l'applicazione non venga eseguita con `--abort-on-uncaught-exception`, nel cui caso l'applicazione stamperà lo stack trace ed uscirà, lasciando un core file.

Il motivo di questo comportamento nella gestione degli errori è che questi callback sono in esecuzione in punti potenzialmente volatili nella durata di un object, ad esempio durante la costruzione e la distruzione della classe. Per questo motivo, si ritiene necessario concludere rapidamente il processo al fine di evitare, in futuro, un'interruzione involontaria. Inoltre in futuro questo sarà soggetto a modifiche se viene eseguita un'analisi completa per garantire che un'eccezione possa seguire il normale flusso di controllo senza effetti collaterali involontari.

##### Printing in AsyncHooks callbacks

Poiché il printing alla console è un'operazione asincrona, `console.log()` provocherà la chiamata degli AsyncHooks callbacks. L'utilizzo di `console.log()` od operazioni asincrone simili all'interno di una funzione AsyncHooks callback causerà una ricorsione infinita. Una soluzione semplice per questa cosa durante il debug consiste nell'utilizzare un'operazione di registrazione sincrona come `fs.writeSync(1, msg)`. Questa verrà stampata su stdout perché `1` è il file descriptor per stdout e non invocherà in modo ricorsivo AsyncHooks visto che è un'operazione sincrona.

```js
const fs = require('fs');
const util = require('util');

function debug(...args) {
  // utilizza una funzione come questa durante il debug all'interno di un AsyncHooks callback
  fs.writeSync(1, `${util.format(...args)}\n`);
}
```

Se per la registrazione è necessaria un'operazione asincrona, è possibile tenere traccia di ciò che ha causato l'operazione asincrona utilizzando le informazioni fornite da AsyncHooks stesso. Quindi la registrazione dovrebbe essere trascurata nel momento in cui è stata la registrazione stessa a causare la chiamata di AsyncHooks callback. Trascurando la registrazione, la ricorsione infinita viene interrotta.

#### asyncHook.enable()

* Restituisce: {AsyncHook} Un riferimento ad `asyncHook`.

Abilita i callback per una determinata istanza `AsyncHook`. Se non viene fornito alcun callback, l'abilitazione è un noop.

L'istanza `AsyncHook` è disabilitata di default. Se l'istanza `AsyncHook` deve essere abilitata immediatamente dopo la creazione, è possibile utilizzare il seguente modello.

```js
const async_hooks = require('async_hooks');

const hook = async_hooks.createHook(callbacks).enable();
```

#### asyncHook.disable()

* Restituisce {AsyncHook} Un riferimento ad `asyncHook`.

Disabilita i callback per una determinata istanza `AsyncHook` dal global pool degli `AsyncHook` callbacks da eseguire. Una volta che un hook è stato disabilitato, non verrà chiamato nuovamente fino a quando non verrà abilitato.

Per coerenza dell'API, `disable()` restituisce anche l'istanza `AsyncHook`.

#### Hook Callbacks

Gli eventi chiave nel corso degli eventi asincroni sono stati suddivisi in quattro aree: instantiation (creazione dell'istanza), ciò che succede prima e dopo la chiamata del callback, e quando l'istanza viene distrutta.

##### init(asyncId, type, triggerAsyncId, resource)

* `asyncId` {number} Un ID univoco per la risorsa asincrona.
* `type` {string} Il tipo della risorsa asincrona.
* `triggerAsyncId` {number} L'ID univoco della risorsa asincrona nel cui execution context è stata creata questa risorsa asincrona.
* `resource` {Object} Riferimento alla risorsa che rappresenta l'operazione asincrona, dev'essere rilasciato nel corso di *destroy*.

Chiamato quando viene costruita una classe che ha la *possibilità* di emettere un evento asincrono. Questo *non* significa che l'istanza deve chiamare `before`/`after` prima che venga chiamato `destroy`, ma solo che esiste la possibilità di farlo.

Questo comportamento può essere osservato facendo qualcosa come ad esempio aprire una risorsa e richiuderla prima che possa essere utilizzata. Il seguente frammento lo dimostra.

```js
require('net').createServer().listen(function() { this.close(); });
// OPPURE
clearTimeout(setTimeout(() => {}, 10));
```

Ad ogni nuova risorsa viene assegnato un ID che è unico nello scope del processo corrente.

###### `type`

Il `type` è una stringa che identifica il tipo di risorsa che ha causato la chiamata di `init`. Generalmente corrisponderà al nome del constructor della risorsa.

```text
FSEVENTWRAP, FSREQWRAP, GETADDRINFOREQWRAP, GETNAMEINFOREQWRAP, HTTPPARSER,
JSSTREAM, PIPECONNECTWRAP, PIPEWRAP, PROCESSWRAP, QUERYWRAP, SHUTDOWNWRAP,
SIGNALWRAP, STATWATCHER, TCPCONNECTWRAP, TCPSERVER, TCPWRAP, TIMERWRAP, TTYWRAP,
UDPSENDWRAP, UDPWRAP, WRITEWRAP, ZLIB, SSLCONNECTION, PBKDF2REQUEST,
RANDOMBYTESREQUEST, TLSWRAP, Timeout, Immediate, TickObject
```

Esiste anche il tipo di risorsa `PROMISE`, che viene utilizzato per tenere traccia delle istanze `Promise` e del lavoro asincrono da esse pianificato.

Gli utenti sono in grado di definire il proprio `type` quando utilizzano il public embedder API.

È possibile avere conflitti di type name. Gli embedders sono incoraggiati ad utilizzare prefissi univoci, come il nome del pacchetto npm, per evitare conflitti durante l'ascolto degli hooks.

###### `triggerAsyncId`

`triggerAsyncId` è l'`asyncId` della risorsa che ha causato (od "attivato") la nuova risorsa da inizializzare e l'`init` da chiamare. E' diverso da `async_hooks.executionAsyncId()` che mostra solo *quando* è stata creata una risorsa, infatti `triggerAsyncId` mostra *perché* una risorsa è stata creata.

Di seguito una semplice dimostrazione di `triggerAsyncId`:

```js
async_hooks.createHook({
  init(asyncId, type, triggerAsyncId) {
    const eid = async_hooks.executionAsyncId();
    fs.writeSync(
      1, `${type}(${asyncId}): trigger: ${triggerAsyncId} execution: ${eid}\n`);
  }
}).enable();

require('net').createServer((conn) => {}).listen(8080);
```

Output quando si colpisce il server con `nc localhost 8080`:

```console
TCPSERVERWRAP(2): trigger: 1 execution: 1
TCPWRAP(4): trigger: 2 execution: 0
```

Il `TCPSERVERWRAP` è il server che riceve le connessioni.

Il `TCPWRAP` è la nuova connessione ricevuta dal client. Quando viene effettuata una nuova connessione, viene immediatamente costruita l'istanza `TCPWrap`. Questo accade al di fuori di qualsiasi JavaScript stack. (Un `executionAsyncId()` di `0` significa che viene eseguito da C++ senza JavaScript stack su di esso.) Solo con queste informazioni, sarebbe impossibile collegare le risorse tra di loro in modo da capire cosa ha causato la loro creazione, quindi a `triggerAsyncId` viene assegnato il compito di propagare la risorsa responsabile dell'esistenza di una nuova risorsa.

###### `resource`

`resource` è un object che rappresenta la risorsa asincrona effettiva che è stata inizializzata. Questo può contenere informazioni utili che possono variare in base al valore di `type`. Ad esempio, per il tipo di risorsa `GETADDRINFOREQWRAP`, `resource` fornisce l'hostname utilizzato quando si cerca l'indirizzo IP per quell'hostname in `net.Server.listen()`. L'API per accedere a queste informazioni attualmente non è considerata pubblica, ma utilizzando l'Embedder API, gli utenti possono fornire e documentare i propri resource objects. Ad esempio, un resource object del genere potrebbe contenere la SQL query in esecuzione.

Nel caso di più Promise, il `resource` object avrà la proprietà `promise` che fa riferimento al `Promise` inizializzato, ed una proprietà `isChainedPromise`, impostata su `true` se il promise ha un parent promise e su `false` in caso contrario. Ad esempio, nel caso di `b = a.then(handler)`, `a` è considerato un parent `Promise` di `b`. Qui, `b` è considerato un chained promise (promise concatenato).

In alcuni casi il resource object viene riutilizzato per motivi di prestazioni, quindi non è sicuro utilizzarlo come chiave in una `WeakMap` od aggiungerci delle proprietà.

###### Esempio di Context Asincrono

Di seguito è riportato un esempio con informazioni aggiuntive sulle chiamate ad `init` tra le chiamate `before` ed `after`, in particolare come sarà il callback su `listen()`. La formattazione dell'output è leggermente più elaborata per facilitare la visione del context delle chiamate.

```js
let indent = 0;
async_hooks.createHook({
  init(asyncId, type, triggerAsyncId) {
    const eid = async_hooks.executionAsyncId();
    const indentStr = ' '.repeat(indent);
    fs.writeSync(
      1,
      `${indentStr}${type}(${asyncId}):` +
      ` trigger: ${triggerAsyncId} execution: ${eid}\n`);
  },
  before(asyncId) {
    const indentStr = ' '.repeat(indent);
    fs.writeSync(1, `${indentStr}before:  ${asyncId}\n`);
    indent += 2;
  },
  after(asyncId) {
    indent -= 2;
    const indentStr = ' '.repeat(indent);
    fs.writeSync(1, `${indentStr}after:   ${asyncId}\n`);
  },
  destroy(asyncId) {
    const indentStr = ' '.repeat(indent);
    fs.writeSync(1, `${indentStr}destroy: ${asyncId}\n`);
  },
}).enable();

require('net').createServer(() => {}).listen(8080, () => {
  // Aspetta 10 minuti prima di accedere al server avviato.
  setTimeout(() => {
    console.log('>>>', async_hooks.executionAsyncId());
  }, 10);
});
```

Output dal solo avvio del server:

```console
TCPSERVERWRAP(2): trigger: 1 execution: 1
TickObject(3): trigger: 2 execution: 1
before:  3
  Timeout(4): trigger: 3 execution: 3
  TIMERWRAP(5): trigger: 3 execution: 3
after:   3
destroy: 3
before:  5
  before:  4
    TTYWRAP(6): trigger: 4 execution: 4
    SIGNALWRAP(7): trigger: 4 execution: 4
    TTYWRAP(8): trigger: 4 execution: 4
>>> 4
    TickObject(9): trigger: 4 execution: 4
  after:   4
after:   5
before:  9
after:   9
destroy: 4
destroy: 9
destroy: 5
```

Come illustrato nell'esempio, `executionAsyncId()` ed `execution` specificano ciascuno il valore dell'execution context corrente; il quale è delineato dalle chiamate a `before` ed `after`.

Utilizzando solo `execution` per rappresentare graficamente l'allocazione delle risorse si ottiene quanto segue:

```console
TTYWRAP(6) -> Timeout(4) -> TIMERWRAP(5) -> TickObject(3) -> root(1)
```

Il `TCPSERVERWRAP` non fa parte di questo grafico, anche se era il motivo per cui veniva chiamato `console.log()`. Questo perché il binding ad una porta senza un hostname è un'operazione *sincrona*, ma per mantenere un'API completamente asincrona il callback dell'utente viene inserito in un `process.nextTick()`.

Il grafico mostra solo *quando* è stata creata una risorsa, non il *perché*, quindi per ottenere il *perché* utilizza `triggerAsyncId`.

##### before(asyncId)

* `asyncId` {number}

When an asynchronous operation is initiated (such as a TCP server receiving a new connection) or completes (such as writing data to disk) a callback is called to notify the user. The `before` callback is called just before said callback is executed. `asyncId` is the unique identifier assigned to the resource about to execute the callback.

The `before` callback will be called 0 to N times. The `before` callback will typically be called 0 times if the asynchronous operation was cancelled or, for example, if no connections are received by a TCP server. Persistent asynchronous resources like a TCP server will typically call the `before` callback multiple times, while other operations like `fs.open()` will call it only once.

##### after(asyncId)

* `asyncId` {number}

Called immediately after the callback specified in `before` is completed.

If an uncaught exception occurs during execution of the callback, then `after` will run *after* the `'uncaughtException'` event is emitted or a `domain`'s handler runs.

##### destroy(asyncId)

* `asyncId` {number}

Called after the resource corresponding to `asyncId` is destroyed. It is also called asynchronously from the embedder API `emitDestroy()`.

Some resources depend on garbage collection for cleanup, so if a reference is made to the `resource` object passed to `init` it is possible that `destroy` will never be called, causing a memory leak in the application. If the resource does not depend on garbage collection, then this will not be an issue.

##### promiseResolve(asyncId)

* `asyncId` {number}

Called when the `resolve` function passed to the `Promise` constructor is invoked (either directly or through other means of resolving a promise).

Note that `resolve()` does not do any observable synchronous work.

The `Promise` is not necessarily fulfilled or rejected at this point if the `Promise` was resolved by assuming the state of another `Promise`.

```js
new Promise((resolve) => resolve(true)).then((a) => {});
```

calls the following callbacks:

```text
init for PROMISE with id 5, trigger id: 1
  promise resolve 5      # corresponds to resolve(true)
init for PROMISE with id 6, trigger id: 5  # the Promise returned by then()
  before 6               # the then() callback is entered
  promise resolve 6      # the then() callback resolves the promise by returning
  after 6
```

#### async_hooks.executionAsyncId()

<!-- YAML
added: v8.1.0
changes:

  - version: v8.2.0
    pr-url: https://github.com/nodejs/node/pull/13490
    description: Renamed from `currentId`
-->

* Returns: {number} The `asyncId` of the current execution context. Useful to track when something calls.

```js
const async_hooks = require('async_hooks');

console.log(async_hooks.executionAsyncId());  // 1 - bootstrap
fs.open(path, 'r', (err, fd) => {
  console.log(async_hooks.executionAsyncId());  // 6 - open()
});
```

The ID returned from `executionAsyncId()` is related to execution timing, not causality (which is covered by `triggerAsyncId()`):

```js
const server = net.createServer(function onConnection(conn) {
  // Returns the ID of the server, not of the new connection, because the
  // onConnection callback runs in the execution scope of the server's
  // MakeCallback().
  async_hooks.executionAsyncId();

}).listen(port, function onListening() {
  // Returns the ID of a TickObject (i.e. process.nextTick()) because all
  // callbacks passed to .listen() are wrapped in a nextTick().
  async_hooks.executionAsyncId();
});
```

Note that promise contexts may not get precise `executionAsyncIds` by default. See the section on [promise execution tracking](#async_hooks_promise_execution_tracking).

#### async_hooks.triggerAsyncId()

* Returns: {number} The ID of the resource responsible for calling the callback that is currently being executed.

```js
const server = net.createServer((conn) => {
  // The resource that caused (or triggered) this callback to be called
  // was that of the new connection. Thus the return value of triggerAsyncId()
  // is the asyncId of "conn".
  async_hooks.triggerAsyncId();

}).listen(port, () => {
  // Even though all callbacks passed to .listen() are wrapped in a nextTick()
  // the callback itself exists because the call to the server's .listen()
  // was made. So the return value would be the ID of the server.
  async_hooks.triggerAsyncId();
});
```

Note that promise contexts may not get valid `triggerAsyncId`s by default. See the section on [promise execution tracking](#async_hooks_promise_execution_tracking).

## Promise execution tracking

By default, promise executions are not assigned `asyncId`s due to the relatively expensive nature of the [promise introspection API](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk) provided by V8. This means that programs using promises or `async`/`await` will not get correct execution and trigger ids for promise callback contexts by default.

Here's an example:

```js
const ah = require('async_hooks');
Promise.resolve(1729).then(() => {
  console.log(`eid ${ah.executionAsyncId()} tid ${ah.triggerAsyncId()}`);
});
// produces:
// eid 1 tid 0
```

Observe that the `then()` callback claims to have executed in the context of the outer scope even though there was an asynchronous hop involved. Also note that the `triggerAsyncId` value is `0`, which means that we are missing context about the resource that caused (triggered) the `then()` callback to be executed.

Installing async hooks via `async_hooks.createHook` enables promise execution tracking. Example:

```js
const ah = require('async_hooks');
ah.createHook({ init() {} }).enable(); // forces PromiseHooks to be enabled.
Promise.resolve(1729).then(() => {
  console.log(`eid ${ah.executionAsyncId()} tid ${ah.triggerAsyncId()}`);
});
// produces:
// eid 7 tid 6
```

In this example, adding any actual hook function enabled the tracking of promises. There are two promises in the example above; the promise created by `Promise.resolve()` and the promise returned by the call to `then()`. In the example above, the first promise got the `asyncId` `6` and the latter got `asyncId` `7`. During the execution of the `then()` callback, we are executing in the context of promise with `asyncId` `7`. This promise was triggered by async resource `6`.

Another subtlety with promises is that `before` and `after` callbacks are run only on chained promises. That means promises not created by `then()`/`catch()` will not have the `before` and `after` callbacks fired on them. For more details see the details of the V8 [PromiseHooks](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk) API.

## JavaScript Embedder API

Library developers that handle their own asynchronous resources performing tasks like I/O, connection pooling, or managing callback queues may use the `AsyncWrap` JavaScript API so that all the appropriate callbacks are called.

### Class: AsyncResource

The class `AsyncResource` is designed to be extended by the embedder's async resources. Using this, users can easily trigger the lifetime events of their own resources.

The `init` hook will trigger when an `AsyncResource` is instantiated.

The following is an overview of the `AsyncResource` API.

```js
const { AsyncResource, executionAsyncId } = require('async_hooks');

// AsyncResource() is meant to be extended. Instantiating a
// new AsyncResource() also triggers init. If triggerAsyncId is omitted then
// async_hook.executionAsyncId() is used.
const asyncResource = new AsyncResource(
  type, { triggerAsyncId: executionAsyncId(), requireManualDestroy: false }
);

// Run a function in the execution context of the resource. This will
// * establish the context of the resource
// * trigger the AsyncHooks before callbacks
// * call the provided function `fn` with the supplied arguments
// * trigger the AsyncHooks after callbacks
// * restore the original execution context
asyncResource.runInAsyncScope(fn, thisArg, ...args);

// Call AsyncHooks destroy callbacks.
asyncResource.emitDestroy();

// Return the unique ID assigned to the AsyncResource instance.
asyncResource.asyncId();

// Return the trigger ID for the AsyncResource instance.
asyncResource.triggerAsyncId();

// Call AsyncHooks before callbacks.
// Deprecated: Use asyncResource.runInAsyncScope instead.
asyncResource.emitBefore();

// Call AsyncHooks after callbacks.
// Deprecated: Use asyncResource.runInAsyncScope instead.
asyncResource.emitAfter();
```

#### new AsyncResource(type[, options])

* `type` {string} The type of async event.
* `options` {Object} 
  * `triggerAsyncId` {number} The ID of the execution context that created this async event. **Default:** `executionAsyncId()`.
  * `requireManualDestroy` {boolean} Disables automatic `emitDestroy` when the object is garbage collected. This usually does not need to be set (even if `emitDestroy` is called manually), unless the resource's `asyncId` is retrieved and the sensitive API's `emitDestroy` is called with it. **Default:** `false`.

Example usage:

```js
class DBQuery extends AsyncResource {
  constructor(db) {
    super('DBQuery');
    this.db = db;
  }

  getInfo(query, callback) {
    this.db.get(query, (err, data) => {
      this.runInAsyncScope(callback, null, err, data);
    });
  }

  close() {
    this.db = null;
    this.emitDestroy();
  }
}
```

#### asyncResource.runInAsyncScope(fn[, thisArg, ...args])

<!-- YAML
added: v9.6.0
-->

* `fn` {Function} The function to call in the execution context of this async resource.
* `thisArg` {any} The receiver to be used for the function call.
* `...args` {any} Optional arguments to pass to the function.

Call the provided function with the provided arguments in the execution context of the async resource. This will establish the context, trigger the AsyncHooks before callbacks, call the function, trigger the AsyncHooks after callbacks, and then restore the original execution context.

#### asyncResource.emitBefore()

<!-- YAML
deprecated: v9.6.0
-->

> Stability: 0 - Deprecated: Use [`asyncResource.runInAsyncScope()`][] instead.

Call all `before` callbacks to notify that a new asynchronous execution context is being entered. If nested calls to `emitBefore()` are made, the stack of `asyncId`s will be tracked and properly unwound.

`before` and `after` calls must be unwound in the same order that they are called. Otherwise, an unrecoverable exception will occur and the process will abort. For this reason, the `emitBefore` and `emitAfter` APIs are considered deprecated. Please use `runInAsyncScope`, as it provides a much safer alternative.

#### asyncResource.emitAfter()

<!-- YAML
deprecated: v9.6.0
-->

> Stability: 0 - Deprecated: Use [`asyncResource.runInAsyncScope()`][] instead.

Call all `after` callbacks. If nested calls to `emitBefore()` were made, then make sure the stack is unwound properly. Otherwise an error will be thrown.

If the user's callback throws an exception, `emitAfter()` will automatically be called for all `asyncId`s on the stack if the error is handled by a domain or `'uncaughtException'` handler.

`before` and `after` calls must be unwound in the same order that they are called. Otherwise, an unrecoverable exception will occur and the process will abort. For this reason, the `emitBefore` and `emitAfter` APIs are considered deprecated. Please use `runInAsyncScope`, as it provides a much safer alternative.

#### asyncResource.emitDestroy()

Call all `destroy` hooks. This should only ever be called once. An error will be thrown if it is called more than once. This **must** be manually called. If the resource is left to be collected by the GC then the `destroy` hooks will never be called.

#### asyncResource.asyncId()

* Returns: {number} The unique `asyncId` assigned to the resource.

#### asyncResource.triggerAsyncId()

* Returns: {number} The same `triggerAsyncId` that is passed to the `AsyncResource` constructor.