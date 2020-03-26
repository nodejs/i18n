# Async Hooks

<!--introduced_in=v8.1.0-->

> Stabilità: 1 - Sperimentale

The `async_hooks` module provides an API to register callbacks tracking the lifetime of asynchronous resources created inside a Node.js application. Ci si può accedere utilizzando:

```js
const async_hooks = require('async_hooks');
```

## Terminologia

Una risorsa asincrona rappresenta un object con un callback associato. This callback may be called multiple times, for example, the `'connection'` event in `net.createServer()`, or just a single time like in `fs.open()`. Una risorsa può anche essere chiusa prima che il callback venga chiamato. `AsyncHook` does not explicitly distinguish between these different cases but will represent them as the abstract concept that is a resource.

If [`Worker`][]s are used, each thread has an independent `async_hooks` interface, and each thread will use a new set of async IDs.

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

Registers functions to be called for different lifetime events of each async operation.

The callbacks `init()`/`before()`/`after()`/`destroy()` are called for the respective asynchronous event during a resource's lifetime.

Tutti i callback sono facoltativi. For example, if only resource cleanup needs to be tracked, then only the `destroy` callback needs to be passed. The specifics of all functions that can be passed to `callbacks` is in the [Hook Callbacks](#async_hooks_hook_callbacks) section.

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

If any `AsyncHook` callbacks throw, the application will print the stack trace and exit. The exit path does follow that of an uncaught exception, but all `'uncaughtException'` listeners are removed, thus forcing the process to exit. The `'exit'` callbacks will still be called unless the application is run with `--abort-on-uncaught-exception`, in which case a stack trace will be printed and the application exits, leaving a core file.

The reason for this error handling behavior is that these callbacks are running at potentially volatile points in an object's lifetime, for example during class construction and destruction. Because of this, it is deemed necessary to bring down the process quickly in order to prevent an unintentional abort in the future. This is subject to change in the future if a comprehensive analysis is performed to ensure an exception can follow the normal control flow without unintentional side effects.

##### Printing in AsyncHooks callbacks

Because printing to the console is an asynchronous operation, `console.log()` will cause the AsyncHooks callbacks to be called. Using `console.log()` or similar asynchronous operations inside an AsyncHooks callback function will thus cause an infinite recursion. An easy solution to this when debugging is to use a synchronous logging operation such as `fs.writeFileSync(file, msg, flag)`. This will print to the file and will not invoke AsyncHooks recursively because it is synchronous.

```js
const fs = require('fs');
const util = require('util');

function debug(...args) {
  // use a function like this one when debugging inside an AsyncHooks callback
  fs.writeFileSync('log.out', `${util.format(...args)}\n`, { flag: 'a' });
}
```

If an asynchronous operation is needed for logging, it is possible to keep track of what caused the asynchronous operation using the information provided by AsyncHooks itself. The logging should then be skipped when it was the logging itself that caused AsyncHooks callback to call. By doing this the otherwise infinite recursion is broken.

#### asyncHook.enable()

* Restituisce: {AsyncHook} Un riferimento ad `asyncHook`.

Abilita i callback per una determinata istanza `AsyncHook`. If no callbacks are provided enabling is a noop.

L'istanza `AsyncHook` è disabilitata di default. If the `AsyncHook` instance should be enabled immediately after creation, the following pattern can be used.

```js
const async_hooks = require('async_hooks');

const hook = async_hooks.createHook(callbacks).enable();
```

#### asyncHook.disable()

* Restituisce {AsyncHook} Un riferimento ad `asyncHook`.

Disable the callbacks for a given `AsyncHook` instance from the global pool of `AsyncHook` callbacks to be executed. Once a hook has been disabled it will not be called again until enabled.

Per coerenza dell'API, `disable()` restituisce anche l'istanza `AsyncHook`.

#### Hook Callbacks

Key events in the lifetime of asynchronous events have been categorized into four areas: instantiation, before/after the callback is called, and when the instance is destroyed.

##### init(asyncId, type, triggerAsyncId, resource)

* `asyncId` {number} Un ID univoco per la risorsa asincrona.
* `type` {string} Il tipo della risorsa asincrona.
* `triggerAsyncId` {number} The unique ID of the async resource in whose execution context this async resource was created.
* `resource` {Object} Reference to the resource representing the async operation, needs to be released during *destroy*.

Called when a class is constructed that has the *possibility* to emit an asynchronous event. This *does not* mean the instance must call `before`/`after` before `destroy` is called, only that the possibility exists.

This behavior can be observed by doing something like opening a resource then closing it before the resource can be used. The following snippet demonstrates this.

```js
require('net').createServer().listen(function() { this.close(); });
// OPPURE
clearTimeout(setTimeout(() => {}, 10));
```

Every new resource is assigned an ID that is unique within the scope of the current Node.js instance.

###### `type`

The `type` is a string identifying the type of resource that caused `init` to be called. Generally, it will correspond to the name of the resource's constructor.

```text
FSEVENTWRAP, FSREQWRAP, GETADDRINFOREQWRAP, GETNAMEINFOREQWRAP, HTTPPARSER,
JSSTREAM, PIPECONNECTWRAP, PIPEWRAP, PROCESSWRAP, QUERYWRAP, SHUTDOWNWRAP,
SIGNALWRAP, STATWATCHER, TCPCONNECTWRAP, TCPSERVERWRAP, TCPWRAP, TIMERWRAP,
TTYWRAP, UDPSENDWRAP, UDPWRAP, WRITEWRAP, ZLIB, SSLCONNECTION, PBKDF2REQUEST,
RANDOMBYTESREQUEST, TLSWRAP, Timeout, Immediate, TickObject
```

There is also the `PROMISE` resource type, which is used to track `Promise` instances and asynchronous work scheduled by them.

Gli utenti sono in grado di definire il proprio `type` quando utilizzano il public embedder API.

È possibile avere conflitti di type name. Embedders are encouraged to use unique prefixes, such as the npm package name, to prevent collisions when listening to the hooks.

###### `triggerAsyncId`

`triggerAsyncId` is the `asyncId` of the resource that caused (or "triggered") the new resource to initialize and that caused `init` to call. This is different from `async_hooks.executionAsyncId()` that only shows *when* a resource was created, while `triggerAsyncId` shows *why* a resource was created.

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
TCPSERVERWRAP(5): trigger: 1 execution: 1
TCPWRAP(7): trigger: 5 execution: 0
```

Il `TCPSERVERWRAP` è il server che riceve le connessioni.

Il `TCPWRAP` è la nuova connessione ricevuta dal client. When a new connection is made, the `TCPWrap` instance is immediately constructed. This happens outside of any JavaScript stack. (An `executionAsyncId()` of `0` means that it is being executed from C++ with no JavaScript stack above it.) With only that information, it would be impossible to link resources together in terms of what caused them to be created, so `triggerAsyncId` is given the task of propagating what resource is responsible for the new resource's existence.

###### `resource`

`resource` is an object that represents the actual async resource that has been initialized. This can contain useful information that can vary based on the value of `type`. For instance, for the `GETADDRINFOREQWRAP` resource type, `resource` provides the hostname used when looking up the IP address for the host in `net.Server.listen()`. The API for accessing this information is currently not considered public, but using the Embedder API, users can provide and document their own resource objects. For example, such a resource object could contain the SQL query being executed.

In the case of Promises, the `resource` object will have `promise` property that refers to the `Promise` that is being initialized, and an `isChainedPromise` property, set to `true` if the promise has a parent promise, and `false` otherwise. For example, in the case of `b = a.then(handler)`, `a` is considered a parent `Promise` of `b`. Qui, `b` è considerato un chained promise (promise concatenato).

In some cases the resource object is reused for performance reasons, it is thus not safe to use it as a key in a `WeakMap` or add properties to it.

###### Esempio di Context Asincrono

The following is an example with additional information about the calls to `init` between the `before` and `after` calls, specifically what the callback to `listen()` will look like. The output formatting is slightly more elaborate to make calling context easier to see.

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
    fs.writeFileSync('log.out',
                     `${indentStr}before:  ${asyncId}\n`, { flag: 'a' });
    indent += 2;
  },
  after(asyncId) {
    indent -= 2;
    const indentStr = ' '.repeat(indent);
    fs.writeFileSync('log.out',
                     `${indentStr}after:  ${asyncId}\n`, { flag: 'a' });
  },
  destroy(asyncId) {
    const indentStr = ' '.repeat(indent);
    fs.writeFileSync('log.out',
                     `${indentStr}destroy:  ${asyncId}\n`, { flag: 'a' });
  },
}).enable();

require('net').createServer(() => {}).listen(8080, () => {
  // Let's wait 10ms before logging the server started.
  setTimeout(() => {
    console.log('>>>', async_hooks.executionAsyncId());
  }, 10);
});
```

Output dal solo avvio del server:

```console
TCPSERVERWRAP(5): trigger: 1 execution: 1
TickObject(6): trigger: 5 execution: 1
before:  6
  Timeout(7): trigger: 6 execution: 6
after:   6
destroy: 6
before:  7
>>> 7
  TickObject(8): trigger: 7 execution: 7
after:   7
before:  8
after:   8
```

As illustrated in the example, `executionAsyncId()` and `execution` each specify the value of the current execution context; which is delineated by calls to `before` and `after`.

Utilizzando solo `execution` per rappresentare graficamente l'allocazione delle risorse si ottiene quanto segue:

```console
Timeout(7) -> TickObject(6) -> root(1)
```

The `TCPSERVERWRAP` is not part of this graph, even though it was the reason for `console.log()` being called. This is because binding to a port without a hostname is a *synchronous* operation, but to maintain a completely asynchronous API the user's callback is placed in a `process.nextTick()`.

The graph only shows *when* a resource was created, not *why*, so to track the *why* use `triggerAsyncId`.

##### before(asyncId)

* `asyncId` {number}

When an asynchronous operation is initiated (such as a TCP server receiving a new connection) or completes (such as writing data to disk) a callback is called to notify the user. The `before` callback is called just before said callback is executed. `asyncId` is the unique identifier assigned to the resource about to execute the callback.

Il `before` callback sarà chiamato da 0 a N volte. The `before` callback will typically be called 0 times if the asynchronous operation was cancelled or, for example, if no connections are received by a TCP server. Persistent asynchronous resources like a TCP server will typically call the `before` callback multiple times, while other operations like `fs.open()` will call it only once.

##### after(asyncId)

* `asyncId` {number}

Chiamato immediatamente dopo il completamento del callback specificato in `before`.

If an uncaught exception occurs during execution of the callback, then `after` will run *after* the `'uncaughtException'` event is emitted or a `domain`'s handler runs.

##### destroy(asyncId)

* `asyncId` {number}

Chiamato dopo che la risorsa corrispondente ad `asyncId` è stata distrutta. It is also called asynchronously from the embedder API `emitDestroy()`.

Some resources depend on garbage collection for cleanup, so if a reference is made to the `resource` object passed to `init` it is possible that `destroy` will never be called, causing a memory leak in the application. If the resource does not depend on garbage collection, then this will not be an issue.

##### promiseResolve(asyncId)

* `asyncId` {number}

Called when the `resolve` function passed to the `Promise` constructor is invoked (either directly or through other means of resolving a promise).

Da notare che `resolve()` non esegue alcun lavoro sincrono visibile.

The `Promise` is not necessarily fulfilled or rejected at this point if the `Promise` was resolved by assuming the state of another `Promise`.

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

* Restituisce: {number} L'`asyncId` dell'attuale execution context. Useful to track when something calls.

```js
const async_hooks = require('async_hooks');

console.log(async_hooks.executionAsyncId());  // 1 - bootstrap
fs.open(path, 'r', (err, fd) => {
  console.log(async_hooks.executionAsyncId());  // 6 - open()
});
```

The ID returned from `executionAsyncId()` is related to execution timing, not causality (which is covered by `triggerAsyncId()`):

```js
const server = net.createServer((conn) => {
  // Returns the ID of the server, not of the new connection, because the
  // callback runs in the execution scope of the server's MakeCallback().
  async_hooks.executionAsyncId();

}).listen(port, () => {
  // Returns the ID of a TickObject (i.e. process.nextTick()) because all
  // callbacks passed to .listen() are wrapped in a nextTick().
  async_hooks.executionAsyncId();
});
```

Da notare che i promise context potrebbero non riuscire ad ottenere `executionAsyncIds` precisi in modo predefinito. Vedi la sezione sul [promise execution tracking](#async_hooks_promise_execution_tracking).

#### async_hooks.triggerAsyncId()

* Returns: {number} The ID of the resource responsible for calling the callback that is currently being executed.

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

By default, promise executions are not assigned `asyncId`s due to the relatively expensive nature of the [promise introspection API](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk/edit) provided by V8. This means that programs using promises or `async`/`await` will not get correct execution and trigger ids for promise callback contexts by default.

```js
const ah = require('async_hooks');
Promise.resolve(1729).then(() => {
  console.log(`eid ${ah.executionAsyncId()} tid ${ah.triggerAsyncId()}`);
});
// produce:
// eid 1 tid 0
```

Observe that the `then()` callback claims to have executed in the context of the outer scope even though there was an asynchronous hop involved. Also note that the `triggerAsyncId` value is `0`, which means that we are missing context about the resource that caused (triggered) the `then()` callback to be executed.

Installing async hooks via `async_hooks.createHook` enables promise execution tracking:

```js
const ah = require('async_hooks');
ah.createHook({ init() {} }).enable(); // forza PromiseHooks ad essere attivato.
Promise.resolve(1729).then(() => {
  console.log(`eid ${ah.executionAsyncId()} tid ${ah.triggerAsyncId()}`);
});
// produce:
// eid 7 tid 6
```

In this example, adding any actual hook function enabled the tracking of promises. There are two promises in the example above; the promise created by `Promise.resolve()` and the promise returned by the call to `then()`. In the example above, the first promise got the `asyncId` `6` and the latter got `asyncId` `7`. During the execution of the `then()` callback, we are executing in the context of promise with `asyncId` `7`. This promise was triggered by async resource `6`.

Another subtlety with promises is that `before` and `after` callbacks are run only on chained promises. That means promises not created by `then()`/`catch()` will not have the `before` and `after` callbacks fired on them. For more details see the details of the V8 [PromiseHooks](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk/edit) API.

## JavaScript Embedder API

Library developers that handle their own asynchronous resources performing tasks like I/O, connection pooling, or managing callback queues may use the `AsyncWrap` JavaScript API so that all the appropriate callbacks are called.

### Classe: AsyncResource

The class `AsyncResource` is designed to be extended by the embedder's async resources. Using this, users can easily trigger the lifetime events of their own resources.

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
```

#### new AsyncResource(type[, options])

* `type` {string} Il tipo di evento asincrono.
* `options` {Object} 
  * `triggerAsyncId` {number} The ID of the execution context that created this async event. **Default:** `executionAsyncId()`.
  * `requireManualDestroy` {boolean} Disables automatic `emitDestroy` when the object is garbage collected. This usually does not need to be set (even if `emitDestroy` is called manually), unless the resource's `asyncId` is retrieved and the sensitive API's `emitDestroy` is called with it. **Default:** `false`.

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

* `fn` {Function} The function to call in the execution context of this async resource.
* `thisArg` {any} Il receiver da utilizzare per la function call.
* `...args` {any} Argomenti opzionali da passare alla funzione.

Call the provided function with the provided arguments in the execution context of the async resource. This will establish the context, trigger the AsyncHooks before callbacks, call the function, trigger the AsyncHooks after callbacks, and then restore the original execution context.

#### asyncResource.emitBefore()

<!-- YAML
deprecated: v9.6.0
-->

> Stabilità: 0 - Obsoleto: Utilizza invece [`asyncResource.runInAsyncScope()`][].

Call all `before` callbacks to notify that a new asynchronous execution context is being entered. If nested calls to `emitBefore()` are made, the stack of `asyncId`s will be tracked and properly unwound.

`before` and `after` calls must be unwound in the same order that they are called. Otherwise, an unrecoverable exception will occur and the process will abort. For this reason, the `emitBefore` and `emitAfter` APIs are considered deprecated. Please use `runInAsyncScope`, as it provides a much safer alternative.

#### asyncResource.emitAfter()

<!-- YAML
deprecated: v9.6.0
-->

> Stabilità: 0 - Obsoleto: Utilizza invece [`asyncResource.runInAsyncScope()`][].

Chiama tutti gli `after` callbacks. If nested calls to `emitBefore()` were made, then make sure the stack is unwound properly. Altrimenti verrà generato un errore.

If the user's callback throws an exception, `emitAfter()` will automatically be called for all `asyncId`s on the stack if the error is handled by a domain or `'uncaughtException'` handler.

`before` and `after` calls must be unwound in the same order that they are called. Otherwise, an unrecoverable exception will occur and the process will abort. For this reason, the `emitBefore` and `emitAfter` APIs are considered deprecated. Please use `runInAsyncScope`, as it provides a much safer alternative.

#### asyncResource.emitDestroy()

* Returns: {AsyncResource} A reference to `asyncResource`.

Chiama tutti gli `destroy` hooks. Questo dovrebbe essere chiamato sempre una sola volta. An error will be thrown if it is called more than once. Quindi **deve** essere chiamato manualmente. If the resource is left to be collected by the GC then the `destroy` hooks will never be called.

#### asyncResource.asyncId()

* Restituisce: {number} L'`asyncId` univoco assegnato alla risorsa.

#### asyncResource.triggerAsyncId()

* Returns: {number} The same `triggerAsyncId` that is passed to the `AsyncResource` constructor.