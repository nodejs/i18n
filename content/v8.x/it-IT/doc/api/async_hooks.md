# Async Hooks

<!--introduced_in=v8.1.0-->

> Stability: 1 - Experimental

Il modulo `async_hooks` fornisce un'API per registrare i callback che tracciano la durata delle risorse asincrone create all'interno di un'applicazione Node.js. Ci si può accedere utilizzando:

```js
const async_hooks = require('async_hooks');
```

## Terminologia

Una risorsa asincrona rappresenta un object con un callback associato. This callback may be called multiple times, for example, the `connection` event in `net.createServer`, or just a single time like in `fs.open`. A resource can also be closed before the callback is called. AsyncHook does not explicitly distinguish between these different cases but will represent them as the abstract concept that is a resource.

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

#### `async_hooks.createHook(callbacks)`

<!-- YAML
added: v8.1.0
-->

* `callbacks` {Object} The [Hook Callbacks](#async_hooks_hook_callbacks) to register
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

Se vengono generati eventuali callback `AsyncHook`, l'applicazione stamperà lo stack trace ed uscirà. The exit path does follow that of an uncaught exception, but all `uncaughtException` listeners are removed, thus forcing the process to exit. Gli `'exit'` callback saranno ancora chiamati a meno che l'applicazione non venga eseguita con `--abort-on-uncaught-exception`, nel qual caso l'applicazione stamperà lo stack trace ed uscirà, lasciando un core file.

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

#### `asyncHook.enable()`

* Restituisce: {AsyncHook} Un riferimento ad `asyncHook`.

Abilita i callback per una determinata istanza `AsyncHook`. Se non viene fornito alcun callback, l'abilitazione è un noop.

L'istanza `AsyncHook` è disabilitata di default. Se l'istanza `AsyncHook` deve essere abilitata immediatamente dopo la creazione, è possibile utilizzare il seguente modello.

```js
const async_hooks = require('async_hooks');

const hook = async_hooks.createHook(callbacks).enable();
```

#### `asyncHook.disable()`

* Restituisce {AsyncHook} Un riferimento ad `asyncHook`.

Disable the callbacks for a given `AsyncHook` instance from the global pool of AsyncHook callbacks to be executed. Una volta che un hook è stato disabilitato, non verrà chiamato nuovamente fino a quando non verrà abilitato.

Per coerenza dell'API, `disable()` restituisce anche l'istanza `AsyncHook`.

#### Hook Callbacks

Gli eventi chiave nel corso degli eventi asincroni sono stati suddivisi in quattro aree: instantiation (creazione dell'istanza), ciò che succede prima e dopo la chiamata del callback, e quando l'istanza viene distrutta.

##### `init(asyncId, type, triggerAsyncId, resource)`

* `asyncId` {number} Un ID univoco per la risorsa asincrona.
* `type` {string} Il tipo della risorsa asincrona.
* `triggerAsyncId` {number} L'ID univoco della risorsa asincrona nel cui execution context è stata creata questa risorsa asincrona.
* `resource` {Object} Reference to the resource representing the async operation, needs to be released during _destroy_.

Chiamato quando viene costruita una classe che ha la _possibilità_ di emettere un evento asincrono. Questo _non_ significa che l'istanza deve chiamare `before`/`after` prima che venga chiamato `destroy`, ma solo che esiste la possibilità di farlo.

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
SIGNALWRAP, STATWATCHER, TCPCONNECTWRAP, TCPSERVERWRAP, TCPWRAP, TIMERWRAP,
TTYWRAP, UDPSENDWRAP, UDPWRAP, WRITEWRAP, ZLIB, SSLCONNECTION, PBKDF2REQUEST,
RANDOMBYTESREQUEST, TLSWRAP, Timeout, Immediate, TickObject
```

Esiste anche il tipo di risorsa `PROMISE`, che viene utilizzato per tenere traccia delle istanze `Promise` e del lavoro asincrono da esse pianificato.

Gli utenti sono in grado di definire il proprio `type` quando utilizzano il public embedder API.

*Note:* It is possible to have type name collisions. Embedders are encouraged to use unique prefixes, such as the npm package name, to prevent collisions when listening to the hooks.

###### `triggerId`

`triggerAsyncId` è l'`asyncId` della risorsa che ha causato (od "attivato") la nuova risorsa da inizializzare e l'`init` da chiamare. This is different from `async_hooks.executionAsyncId()` that only shows *when* a resource was created, while `triggerAsyncId` shows *why* a resource was created.


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

Il `TCPWRAP` è la nuova connessione ricevuta dal client. When a new connection is made the `TCPWrap` instance is immediately constructed. This happens outside of any JavaScript stack (side note: a `executionAsyncId()` of `0` means it's being executed from C++, with no JavaScript stack above it). With only that information, it would be impossible to link resources together in terms of what caused them to be created, so `triggerAsyncId` is given the task of propagating what resource is responsible for the new resource's existence.

###### `resource`

`resource` è un object che rappresenta la risorsa asincrona effettiva che è stata inizializzata. Questo può contenere informazioni utili che possono variare in base al valore di `type`. Ad esempio, per il tipo di risorsa `GETADDRINFOREQWRAP`, `resource` fornisce l'hostname utilizzato quando si cerca l'indirizzo IP per quell'hostname in `net.Server.listen()`. L'API per accedere a queste informazioni attualmente non è considerata pubblica, ma utilizzando l'Embedder API, gli utenti possono fornire e documentare i propri resource objects. Ad esempio, un resource object del genere potrebbe contenere la SQL query in esecuzione.

In the case of Promises, the `resource` object will have `promise` property that refers to the Promise that is being initialized, and a `isChainedPromise` property, set to `true` if the promise has a parent promise, and `false` otherwise. For example, in the case of `b = a.then(handler)`, `a` is considered a parent Promise of `b`. Qui, `b` è considerato un chained promise (promise concatenato).

*Note*: In some cases the resource object is reused for performance reasons, it is thus not safe to use it as a key in a `WeakMap` or add properties to it.

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

*Note*: As illustrated in the example, `executionAsyncId()` and `execution` each specify the value of the current execution context; which is delineated by calls to `before` and `after`.

Utilizzando solo `execution` per rappresentare graficamente l'allocazione delle risorse si ottiene quanto segue:

```console
TTYWRAP(6) -> Timeout(4) -> TIMERWRAP(5) -> TickObject(3) -> root(1)
```

Il `TCPSERVERWRAP` non fa parte di questo grafico, anche se era il motivo per cui veniva chiamato `console.log()`. Questo perché il binding ad una porta senza un hostname è un'operazione *sincrona*, ma per mantenere un'API completamente asincrona il callback dell'utente viene inserito in un `process.nextTick()`.

The graph only shows *when* a resource was created, not *why*, so to track the *why* use `triggerAsyncId`.


##### `before(asyncId)`

* `asyncId` {number}

Quando un'operazione asincrona viene avviata (come ad esempio un server TCP che riceve una nuova connessione) oppure quando viene completata (come ad esempio la scrittura di dati su un disco) viene chiamato un callback per avvisare l'utente. Il `before` callback viene chiamato subito prima che venga eseguito il callback. `asyncId` è l'identificatore univoco assegnato alla risorsa che sta per eseguire il callback.

Il `before` callback sarà chiamato da 0 a N volte. In genera il `before` callback verrà chiamato 0 volte se l'operazione asincrona è stata annullata oppure, ad esempio, se un server TCP non ha ricevuto nessuna connessione. Le risorse asincrone persistenti, come ad esempio un server TCP, in genere chiameranno il `before` callback più volte, mentre altre operazioni, come `fs.open()`, lo chiameranno una sola volta.


##### `after(asyncId)`

* `asyncId` {number}

Chiamato immediatamente dopo il completamento del callback specificato in `before`.

*Note:* If an uncaught exception occurs during execution of the callback, then `after` will run *after* the `'uncaughtException'` event is emitted or a `domain`'s handler runs.


##### `destroy(asyncId)`

* `asyncId` {number}

Chiamato dopo che la risorsa corrispondente ad `asyncId` è stata distrutta. Viene anche chiamato in modo asincrono dall'embedder API `emitDestroy()`.

*Note:* Some resources depend on garbage collection for cleanup, so if a reference is made to the `resource` object passed to `init` it is possible that `destroy` will never be called, causing a memory leak in the application. If the resource does not depend on garbage collection, then this will not be an issue.

##### `promiseResolve(asyncId)`

* `asyncId` {number}

Chiamato quando la funzione `resolve`, passata al constructor di `Promise`, viene invocata (direttamente oppure tramite altri mezzi per risolvere un promise).

Da notare che `resolve()` non esegue alcun lavoro sincrono visibile.

*Note:* This does not necessarily mean that the `Promise` is fulfilled or rejected at this point, if the `Promise` was resolved by assuming the state of another `Promise`.

Per esempio:

```js
new Promise((resolve) => resolve(true)).then((a) => {});
```

chiama i seguenti callback:

```text
init for PROMISE with id 5, trigger id: 1
  promise resolve 5      # corresponds to resolve(true)
init for PROMISE with id 6, trigger id: 5  # the Promise returned by then()
  before 6               # the then() callback is entered
  promise resolve 6      # the then() callback resolves the promise by returning
  after 6
```

#### `async_hooks.executionAsyncId()`

<!-- YAML
added: v8.1.0
changes:
  - version: v8.2.0
    pr-url: https://github.com/nodejs/node/pull/13490
    description: Renamed from currentId
-->

* Restituisce: {number} L'`asyncId` dell'attuale execution context. Utile a tracciare quando qualcosa chiama.

Per esempio:

```js
const async_hooks = require('async_hooks');

console.log(async_hooks.executionAsyncId());  // 1 - bootstrap
fs.open(path, 'r', (err, fd) => {
  console.log(async_hooks.executionAsyncId());  // 6 - open()
});
```

L'ID restituito da `executionAsyncId()` è correlato al tempo di execution, non alla causalità (che è coperta da `triggerAsyncId()`). Per esempio:

```js
const server = net.createServer(function onConnection(conn) {
  // Restituisce l'ID del server, non della nuova connessione, poiché 
  // l'onConnection callback viene eseguito nell'execution scope del 
  // MakeCallback() del server.
  async_hooks.executionAsyncId();

}).listen(port, function onListening() {
  // Restituisce l'ID di un TickObject (ad esempio process.nextTick()) poiché tutti
  // i callback passati a .listen() sono stati racchiusi con il wrapping all'interno di un nextTick().
  async_hooks.executionAsyncId();
});
```

Da notare che i promise context potrebbero non riuscire ad ottenere executionAsyncIds precisi in modo predefinito. Vedi la sezione sul [promise execution tracking](#async_hooks_promise_execution_tracking).

#### `async_hooks.triggerAsyncId()`

* Restituisce: {number} L'ID della risorsa responsabile della chiamata del callback attualmente in esecuzione.

Per esempio:

```js
const server = net.createServer((conn) => {
  // La risorsa che ha causato (od attivato) la chiamata di questo callback 
  // era quella della nuova connessione. Quindi il valore di ritorno di triggerAsyncId() 
  // è l'asyncId di "conn".
  async_hooks.triggerAsyncId();

}).listen(port, () => {
  // Anche se tutti i callback passati a .listen() sono racchiusi con  il wrapping 
  // in un nextTick() il callback stesso esiste perché è stata effettuata la chiamata 
  // al .listen() del server. Quindi il valore di ritorno sarebbe l'ID del server.
  async_hooks.triggerAsyncId();
});
```

Da notare che i promise context potrebbero non ottenere triggerAsyncId validi in modo predefinito. Vedi la sezione sul [promise execution tracking](#async_hooks_promise_execution_tracking).

## Promise execution tracking

By default, promise executions are not assigned asyncIds due to the relatively expensive nature of the [promise introspection API](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk) provided by V8. Ciò significa che i programmi che utilizzano i promise oppure `async`/`await` non otterranno l'execution corretta e gli ID di attivazione per i promise callback context in modo predefinito.

Ecco un esempio:

```js
const ah = require('async_hooks');
Promise.resolve(1729).then(() => {
  console.log(`eid ${ah.executionAsyncId()} tid ${ah.triggerAsyncId()}`);
});
// produce:
// eid 1 tid 0
```

Observe that the `then` callback claims to have executed in the context of the outer scope even though there was an asynchronous hop involved. Also note that the triggerAsyncId value is 0, which means that we are missing context about the resource that caused (triggered) the `then` callback to be executed.

L'installazione di async hooks tramite `async_hooks.createHook` attiva il promise execution tracking. Esempio:

```js
const ah = require('async_hooks');
ah.createHook({ init() {} }).enable(); // forza PromiseHooks ad essere attivato.
Promise.resolve(1729).then(() => {
  console.log(`eid ${ah.executionAsyncId()} tid ${ah.triggerAsyncId()}`);
});
// produce:
// eid 7 tid 6
```

In questo esempio, l'aggiunta di una funzione hook effettiva ha attivato il tracking dei promise. There are two promises in the example above; the promise created by `Promise.resolve()` and the promise returned by the call to `then`. In the example above, the first promise got the asyncId 6 and the latter got asyncId 7. During the execution of the `then` callback, we are executing in the context of promise with asyncId 7. This promise was triggered by async resource 6.

Un'altra sottigliezza dei promise è che i callback `before` ed `after` vengono eseguiti solo sui chained promise (promise concatenati). That means promises not created by `then`/`catch` will not have the `before` and `after` callbacks fired on them. For more details see the details of the V8 [PromiseHooks](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk) API.

## JavaScript Embedder API

Library developers that handle their own asynchronous resources performing tasks like I/O, connection pooling, or managing callback queues may use the `AsyncWrap` JavaScript API so that all the appropriate callbacks are called.

### `class AsyncResource()`

La classe `AsyncResource` è progettata per essere estesa tramite le risorse asincrone dell'embedder. Usandola, gli utenti possono facilmente attivare i lifestime events delle proprie risorse.

L'`init` hook si innesca quando viene creata un'istanza di `AsyncResource`.

Di seguito è riportata una panoramica dell'API `AsyncResource`.

```js
const { AsyncResource, executionAsyncId } = require('async_hooks');

// AsyncResource() è pensato per essere esteso. Anche la creazione 
// di un'istanza di un nuovo AsyncResource() attiva init. Se triggerAsyncId 
// viene omesso, allora viene utilizzato async_hook.executionAsyncId().
const asyncResource = new AsyncResource(
  type, { triggerAsyncId: executionAsyncId(), requireManualDestroy: false }
);

// Esegue una funzione nell'execution context della risorsa. Questo
// * stabilirà il context della risorsa
// * attiverà gli AsyncHooks before callbacks
// * chiamerà la funzione `fn` data con gli argomenti forniti
// * attiverà gli AsyncHooks after callbacks
// * ripristinerà l'execution context originale
asyncResource.runInAsyncScope(fn, thisArg, ...args);

// Chiama gli AsyncHooks destroy callbacks.
asyncResource.emitDestroy();

// Restituisce l'ID univoco assegnato all'istanza di AsyncResource.
asyncResource.asyncId();

// Restituisce l'ID di attivazione per l'istanza di AsyncResource.
asyncResource.triggerAsyncId();

// Chiama gli AsyncHooks before callbacks.
// Obsoleto: Utilizza invece asyncResource.runInAsyncScope.
asyncResource.emitBefore();

// Chiama gli AsyncHooks after callbacks.
// Obsoleto: Utilizza invece asyncResource.runInAsyncScope.
asyncResource.emitAfter();
```

#### `AsyncResource(type[, options])`

* `type` {string} Il tipo di evento asincrono.
* `options` {Object}
  * `triggerAsyncId` {number} L'ID dell'execution context che ha creato questo evento asincrono. **Default:** `executionAsyncId()`.
  * `requireManualDestroy` {boolean} Disattiva l'`emitDestroy` automatico quando l'object ha subito la garbage collection. This usually does not need to be set (even if `emitDestroy` is called manually), unless the resource's asyncId is retrieved and the sensitive API's `emitDestroy` is called with it. **Default:** `false`.

Esempio di utilizzo:

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

#### `asyncResource.runInAsyncScope(fn[, thisArg, ...args])`
<!-- YAML
added: v8.12.0
-->

* `fn` {Function} La funzione per chiamare l'execution context di questa risorsa asincrona.
* `thisArg` {any} Il receiver da utilizzare per la function call.
* `...args` {any} Argomenti opzionali da passare alla funzione.

Chiama la funzione data con gli argomenti forniti nell'execution context della risorsa asincrona. Questo stabilirà il context, attiverà gli AsyncHooks before callbacks, chiamerà la funzione, attiverà gli AsyncHooks after callbacks e ripristinerà l'execution context originale.

#### `asyncResource.emitBefore()`
<!-- YAML
deprecated: v8.12.0
-->
> Stabilità: 0 - Obsoleto: Utilizza invece [`asyncResource.runInAsyncScope()`][].

* Restituisce: {undefined}

Chiama tutti i `before` callbacks per notificare che viene inserito un nuovo execution context asincrono. Se vengono effettuate chiamate annidate verso `emitBefore()`, lo stack degli `asyncId` verrà tracciato e scomposto correttamente.

Le chiamate `before` ed `after` devono essere scomposte nello stesso ordine in cui vengono chiamate. Altrimenti, si verificherà un'eccezione irrecuperabile ed il processo si interromperà. Per questo motivo, le API `emitBefore` ed `emitAfter` sono considerate obsolete. Sei pregato di utilizzare `runInAsyncScope`, in quanto fornisce un'alternativa molto più sicura.

#### `asyncResource.emitAfter()`
<!-- YAML
deprecated: v8.12.0
-->
> Stabilità: 0 - Obsoleto: Utilizza invece [`asyncResource.runInAsyncScope()`][].

* Restituisce: {undefined}

Chiama tutti gli `after` callbacks. Se sono state effettuate chiamate annidate verso `emitBefore()`, allora assicurati che lo stack sia scomposto correttamente. Altrimenti verrà generato un errore.

Se il callback dell'utente genera un'eccezione, `emitAfter()` verrà automaticamente chiamato per tutti gli `asyncId` sullo stack se l'errore viene gestito da un domain (dominio) oppure da un handler di `'uncaughtException'`.

Le chiamate `before` ed `after` devono essere scomposte nello stesso ordine in cui vengono chiamate. Altrimenti, si verificherà un'eccezione irrecuperabile ed il processo si interromperà. Per questo motivo, le API `emitBefore` ed `emitAfter` sono considerate obsolete. Sei pregato di utilizzare `runInAsyncScope`, in quanto fornisce un'alternativa molto più sicura.

#### `asyncResource.emitDestroy()`

* Restituisce: {undefined}

Chiama tutti gli `destroy` hooks. Questo dovrebbe essere chiamato sempre una sola volta. Se viene chiamato più di una volta verrà generato un errore. Quindi **deve** essere chiamato manualmente. Se la risorsa viene lasciata per essere raccolta dal GC (Garbage Collector), allora gli `destroy` hooks non verranno mai chiamati.

#### `asyncResource.asyncId()`

* Restituisce: {number} L'`asyncId` univoco assegnato alla risorsa.

#### `asyncResource.triggerAsyncId()`

* Returns: {number} The same `triggerAsyncId` that is passed to the `AsyncResource` constructor.
