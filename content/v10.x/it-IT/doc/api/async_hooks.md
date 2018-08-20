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

Se vengono generati eventuali callback `AsyncHook`, l'applicazione stamperà lo stack trace ed uscirà. Il percorso di exit segue quello di uncaught exception (eccezione non rilevata), ma tutti i listener `'uncaughtException'` vengono rimossi, forzando così il processo di exit. Gli `'exit'` callback saranno ancora chiamati a meno che l'applicazione non venga eseguita con `--abort-on-uncaught-exception`, nel qual caso l'applicazione stamperà lo stack trace ed uscirà, lasciando un core file.

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

Quando un'operazione asincrona viene avviata (come ad esempio un server TCP che riceve una nuova connessione) oppure quando viene completata (come ad esempio la scrittura di dati su un disco) viene chiamato un callback per avvisare l'utente. Il `before` callback viene chiamato subito prima che venga eseguito il callback. `asyncId` è l'identificatore univoco assegnato alla risorsa che sta per eseguire il callback.

Il `before` callback sarà chiamato da 0 a N volte. In genera il `before` callback verrà chiamato 0 volte se l'operazione asincrona è stata annullata oppure, ad esempio, se un server TCP non ha ricevuto nessuna connessione. Le risorse asincrone persistenti, come ad esempio un server TCP, in genere chiameranno il `before` callback più volte, mentre altre operazioni, come `fs.open()`, lo chiameranno una sola volta.

##### after(asyncId)

* `asyncId` {number}

Chiamato immediatamente dopo il completamento del callback specificato in `before`.

Se si verifica una uncaught exception (eccezione non rilevata) durante l'esecuzione del callback, allora `after` verrà eseguito *dopo* che l'evento `'uncaughtException'` viene emesso oppure dopo che viene eseguito l'handler di un `domain`.

##### destroy(asyncId)

* `asyncId` {number}

Chiamato dopo che la risorsa corrispondente ad `asyncId` è stata distrutta. Viene anche chiamato in modo asincrono dall'embedder API `emitDestroy()`.

Alcune risorse dipendono dalla garbage collection per la pulizia, quindi se viene fatto un riferimento al `resource` object passato ad `init` è possibile che `destroy` non verrà mai chiamato, causando così un memory leak (una perdita di memoria) nell'applicazione. Se la risorsa non dipende dalla garbage collection, allora non sarà un problema.

##### promiseResolve(asyncId)

* `asyncId` {number}

Chiamato quando la funzione `resolve`, passata al constructor di `Promise`, viene invocata (direttamente oppure tramite altri mezzi per risolvere un promise).

Da notare che `resolve()` non esegue alcun lavoro sincrono visibile.

A questo punto il `Promise` non è necessariamente soddisfatto o respinto se è stato risolto assumendo lo stato di un altro `Promise`.

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

#### async_hooks.executionAsyncId()

<!-- YAML
added: v8.1.0
changes:

  - version: v8.2.0
    pr-url: https://github.com/nodejs/node/pull/13490
    description: Renamed from `currentId`
-->

* Restituisce: {number} L'`asyncId` dell'attuale execution context. Utile a tracciare quando qualcosa chiama.

```js
const async_hooks = require('async_hooks');

console.log(async_hooks.executionAsyncId());  // 1 - bootstrap
fs.open(path, 'r', (err, fd) => {
  console.log(async_hooks.executionAsyncId());  // 6 - open()
});
```

L'ID restituito da `executionAsyncId()` è correlato al tempo di execution, non alla causalità (che è coperta da `triggerAsyncId()`):

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

Da notare che i promise context potrebbero non riuscire ad ottenere `executionAsyncIds` precisi in modo predefinito. Vedi la sezione sul [promise execution tracking](#async_hooks_promise_execution_tracking).

#### async_hooks.triggerAsyncId()

* Restituisce: {number} L'ID della risorsa responsabile della chiamata del callback attualmente in esecuzione.

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

Da notare che i promise context potrebbero non ottenere `triggerAsyncId` validi in modo predefinito. Vedi la sezione sul [promise execution tracking](#async_hooks_promise_execution_tracking).

## Promise execution tracking

Di default, le promise execution non sono assegnate agli `asyncId` a causa della natura relativamente costosa della [promise introspection API](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk) fornita da V8. Ciò significa che i programmi che utilizzano i promise oppure `async`/`await` non otterranno l'execution corretta e gli ID di attivazione per i promise callback context in modo predefinito.

Ecco un esempio:

```js
const ah = require('async_hooks');
Promise.resolve(1729).then(() => {
  console.log(`eid ${ah.executionAsyncId()} tid ${ah.triggerAsyncId()}`);
});
// produce:
// eid 1 tid 0
```

Osserva che il `then()` callback afferma di esser stato eseguito nel context dello scope esterno anche se era coinvolto un hop asincrono. Da notare inoltre che il valore di `triggerAsyncId` è `0`, il che significa che manca il context relativo alla risorsa che ha causato (attivato) il `then()` callback da eseguire.

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

In questo esempio, l'aggiunta di una funzione hook effettiva ha attivato il tracking dei promise. Ci sono due promise nell'esempio sopracitato; il promise creato da `Promise.resolve()` ed il promise restituito dalla chiamata a `then()`. Il primo promise ha ottenuto l'`asyncId` `6` ed il secondo ed ultimo promise ha ottenuto l'`asyncId` `7`. Durante l'execution del `then()` callback, stiamo facendo l'execution nel context del promise con `asyncId` `7`. Questo promise è stato attivato dalla risorsa asincrona `6`.

Un'altra sottigliezza dei promise è che i callback `before` ed `after` vengono eseguiti solo sui chained promise (promise concatenati). Ciò significa che i promise che non sono stati creati tramite `then()`/`catch()` non avranno i callback `before` ed `after` attivati su di essi. Per ulteriori informazioni vedi i dettagli del [PromiseHooks](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk) API di V8.

## JavaScript Embedder API

Gli sviluppatori delle library, che gestiscono le proprie risorse asincrone eseguendo attività come I/O, connection pooling oppure gestione delle callback queue, possono utilizzare l'API JavaScript `AsyncWrap` in modo che vengano chiamati tutti i callback appropriati.

### Classe: AsyncResource

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

#### new AsyncResource(type[, options])

* `type` {string} Il tipo di evento asincrono.
* `options` {Object} 
  * `triggerAsyncId` {number} L'ID dell'execution context che ha creato questo evento asincrono. **Default:** `executionAsyncId()`.
  * `requireManualDestroy` {boolean} Disattiva l'`emitDestroy` automatico quando l'object ha subito la garbage collection. Questo di solito non ha bisogno di essere impostato (anche se `emitDestroy` viene chiamato manualmente), a meno che l'`asyncId` della risorsa sia recuperato e l'`emitDestroy` dell'API sensibile sia chiamato con esso. **Default:** `false`.

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

#### asyncResource.runInAsyncScope(fn[, thisArg, ...args])

<!-- YAML
added: v9.6.0
-->

* `fn` {Function} La funzione per chiamare l'execution context di questa risorsa asincrona.
* `thisArg` {any} Il receiver da utilizzare per la function call.
* `...args` {any} Argomenti opzionali da passare alla funzione.

Chiama la funzione data con gli argomenti forniti nell'execution context della risorsa asincrona. Questo stabilirà il context, attiverà gli AsyncHooks before callbacks, chiamerà la funzione, attiverà gli AsyncHooks after callbacks e ripristinerà l'execution context originale.

#### asyncResource.emitBefore()

<!-- YAML
deprecated: v9.6.0
-->

> Stabilità: 0 - Obsoleto: Utilizza invece [`asyncResource.runInAsyncScope()`][].

Chiama tutti i `before` callbacks per notificare che viene inserito un nuovo execution context asincrono. Se vengono effettuate chiamate annidate verso `emitBefore()`, lo stack degli `asyncId` verrà tracciato e scomposto correttamente.

Le chiamate `before` ed `after` devono essere scomposte nello stesso ordine in cui vengono chiamate. Altrimenti, si verificherà un'eccezione irrecuperabile ed il processo si interromperà. Per questo motivo, le API `emitBefore` ed `emitAfter` sono considerate obsolete. Sei pregato di utilizzare `runInAsyncScope`, in quanto fornisce un'alternativa molto più sicura.

#### asyncResource.emitAfter()

<!-- YAML
deprecated: v9.6.0
-->

> Stabilità: 0 - Obsoleto: Utilizza invece [`asyncResource.runInAsyncScope()`][].

Chiama tutti gli `after` callbacks. Se sono state effettuate chiamate annidate verso `emitBefore()`, allora assicurati che lo stack sia scomposto correttamente. Altrimenti verrà generato un errore.

Se il callback dell'utente genera un'eccezione, `emitAfter()` verrà automaticamente chiamato per tutti gli `asyncId` sullo stack se l'errore viene gestito da un domain (dominio) oppure da un handler di `'uncaughtException'`.

Le chiamate `before` ed `after` devono essere scomposte nello stesso ordine in cui vengono chiamate. Altrimenti, si verificherà un'eccezione irrecuperabile ed il processo si interromperà. Per questo motivo, le API `emitBefore` ed `emitAfter` sono considerate obsolete. Sei pregato di utilizzare `runInAsyncScope`, in quanto fornisce un'alternativa molto più sicura.

#### asyncResource.emitDestroy()

Chiama tutti gli `destroy` hooks. Questo dovrebbe essere chiamato sempre una sola volta. Se viene chiamato più di una volta verrà generato un errore. Quindi **deve** essere chiamato manualmente. Se la risorsa viene lasciata per essere raccolta dal GC (Garbage Collector), allora gli `destroy` hooks non verranno mai chiamati.

#### asyncResource.asyncId()

* Restituisce: {number} L'`asyncId` univoco assegnato alla risorsa.

#### asyncResource.triggerAsyncId()

* Restituisce: {number} Lo stesso `triggerAsyncId` che viene passato dal constructor di `AsyncResource`.