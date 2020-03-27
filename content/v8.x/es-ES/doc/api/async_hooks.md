# Hooks Asincrónicos

<!--introduced_in=v8.1.0-->

> Estabilidad: 1 - Experimental

The `async_hooks` module provides an API to register callbacks tracking the lifetime of asynchronous resources created inside a Node.js application. Se puede acceder a él utilizando:

```js
const async_hooks = require('async_hooks');
```

## Terminología

Un recurso asincrónico representa un objeto con un callback asociado. This callback may be called multiple times, for example, the `connection` event in `net.createServer`, or just a single time like in `fs.open`. Un recurso también puede cerrarse antes de que se llame un callback. AsyncHook does not explicitly distinguish between these different cases but will represent them as the abstract concept that is a resource.

## API Pública

### Resumen

A continuación se muestra un simple resumen de la API pública.

```js
const async_hooks=require("async_hooks");
//Retorna el ID del contexto de la ejecución actual.
const eid = async_hooks.executionAsyncId();
//Retorna el ID del encargado responsable de lanzar el callback 
//del alcance de la ejecución actual de la llamada.
const tid = async_hooks.triggerAsyncId();
//Crea una nueva instancia AsyncHook. Todos estos callbacks son opcionales.
const asyncHook =
    async_hooks.createHook({ init, before, after, destroy, promiseResolve });
//Permite a los callbacks de la instancia AsyncHook ser llamados. // Acción después de ejecutar el constructor, y debe de estar correctamente //accionado para comenzar a ejecutar los callbacks.
asyncHook.enable();
//Inhabilita la escucha de nuevos eventos asíncronos.
asyncHook.disable();
//
//Los siguientes son los callbacks que se pueden pasar a createHook().
//

//init es llamado durante la construcción del objeto. El recurso puede no tener
//construcción completada cuando se ejecuta este callback, por lo tanto, todos los 
//campos del recurso al que hace referencia "asyncId" no se hayan rellenado.
function init(asyncId, type, triggerAsyncId, resource){ }
//esta función es llamada, justo antes de que los recursos del callback sean llamados. Se pueden
// llamar 0-N veces por los handles (e.g TCPWrap), y se llamará exactamente 1
//vez por solicitud(e.gFSReqWrap).
function before(asyncId){ }
//after es llamado justo después de que los recursos del callback han terminado.
function after(asyncId){ }

// destroy es llamada cuando una instancia de AsyncWrap es destruida.
function destroy(asyncId){ }

//promiseResolve es llamada solo por los recursos promesa, cuando la
//función `resolve` pasa a `Promise` y el constructor es invocado
// (Ya sea directamente o utilizando otros medios para resolver la promesa).
function promiseResolve(asyncId){ }
```

#### `async_hooks.createHook(callbacks)`

<!-- YAML
added: v8.1.0
-->

* `callbacks` {Object} Los [Callbacks de Hook](#async_hooks_hook_callbacks) para registrar 
  * `init` {Function} El [`init` callback][].
  * `before` {Function} El [`before` callback][].
  * `after` {Function} El [`after` callback][].
  * `destroy` {Function} El [`destroy` callback][].
* Devoluciones: {AsyncHook} Instancia utilizada para inhabilitar y habilitar hooks

Registers functions to be called for different lifetime events of each async operation.

The callbacks `init()`/`before()`/`after()`/`destroy()` are called for the respective asynchronous event during a resource's lifetime.

Todos los callbacks son opcionales. For example, if only resource cleanup needs to be tracked, then only the `destroy` callback needs to be passed. The specifics of all functions that can be passed to `callbacks` is in the [Hook Callbacks](#async_hooks_hook_callbacks) section.

```js
const async_hooks = require('async_hooks');

const asyncHook = async_hooks.createHook({
  init(asyncId, type, triggerAsyncId, resource) { },
  destroy(asyncId) { }
});
```

Tenga en cuenta que los callbacks serán heredados por medio de la cadena del prototipo:

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

##### Manejo de Errores

If any `AsyncHook` callbacks throw, the application will print the stack trace and exit. The exit path does follow that of an uncaught exception, but all `uncaughtException` listeners are removed, thus forcing the process to exit. The `'exit'` callbacks will still be called unless the application is run with `--abort-on-uncaught-exception`, in which case a stack trace will be printed and the application exits, leaving a core file.

The reason for this error handling behavior is that these callbacks are running at potentially volatile points in an object's lifetime, for example during class construction and destruction. Because of this, it is deemed necessary to bring down the process quickly in order to prevent an unintentional abort in the future. This is subject to change in the future if a comprehensive analysis is performed to ensure an exception can follow the normal control flow without unintentional side effects.

##### Impresión en los callbacks de AsyncHooks

Because printing to the console is an asynchronous operation, `console.log()` will cause the AsyncHooks callbacks to be called. Using `console.log()` or similar asynchronous operations inside an AsyncHooks callback function will thus cause an infinite recursion. An easy solution to this when debugging is to use a synchronous logging operation such as `fs.writeSync(1, msg)`. This will print to stdout because `1` is the file descriptor for stdout and will not invoke AsyncHooks recursively because it is synchronous.

```js
const fs = require('fs');
const util = require('util');

function debug(...args) {
  // use a function like this one when debugging inside an AsyncHooks callback
  fs.writeSync(1, `${util.format(...args)}\n`);
}
```

If an asynchronous operation is needed for logging, it is possible to keep track of what caused the asynchronous operation using the information provided by AsyncHooks itself. The logging should then be skipped when it was the logging itself that caused AsyncHooks callback to call. By doing this the otherwise infinite recursion is broken.

#### `asyncHook.enable()`

* Devuelve: {AsyncHook} Una referencia a `asyncHook`.

Habilita los callbacks para una instancia determinada de `AsyncHook` . If no callbacks are provided enabling is a noop.

La instancia `AsyncHook` está inhabilitada por defecto. If the `AsyncHook` instance should be enabled immediately after creation, the following pattern can be used.

```js
const async_hooks = require('async_hooks');

const hook = async_hooks.createHook(callbacks).enable();
```

#### `asyncHook.disable()`

* Devuelve: {AsyncHook} Una referencia a `asyncHook`.

Disable the callbacks for a given `AsyncHook` instance from the global pool of AsyncHook callbacks to be executed. Once a hook has been disabled it will not be called again until enabled.

Para la consistencia de APIs, `disable()` también devuelve la instancia `AsyncHook` .

#### Callbacks de Hooks

Key events in the lifetime of asynchronous events have been categorized into four areas: instantiation, before/after the callback is called, and when the instance is destroyed.

##### `init(asyncId, type, triggerAsyncId, resource)`

* `asyncId` {number} Una ID única para el recurso asincrónico.
* `type` {string} El tipo del recurso asincrónico.
* `triggerAsyncId` {number} The unique ID of the async resource in whose execution context this async resource was created.
* `resource` {Object} Reference to the resource representing the async operation, needs to be released during *destroy*.

Called when a class is constructed that has the *possibility* to emit an asynchronous event. This *does not* mean the instance must call `before`/`after` before `destroy` is called, only that the possibility exists.

This behavior can be observed by doing something like opening a resource then closing it before the resource can be used. The following snippet demonstrates this.

```js
require('net').createServer().listen(function() { this.close(); });
// OR
clearTimeout(setTimeout(() => {}, 10));
```

Every new resource is assigned an ID that is unique within the scope of the current process.

###### `tipo`

The `type` is a string identifying the type of resource that caused `init` to be called. Generally, it will correspond to the name of the resource's constructor.

```text
FSEVENTWRAP, FSREQWRAP, GETADDRINFOREQWRAP, GETNAMEINFOREQWRAP, HTTPPARSER,
JSSTREAM, PIPECONNECTWRAP, PIPEWRAP, PROCESSWRAP, QUERYWRAP, SHUTDOWNWRAP,
SIGNALWRAP, STATWATCHER, TCPCONNECTWRAP, TCPSERVERWRAP, TCPWRAP, TIMERWRAP,
TTYWRAP, UDPSENDWRAP, UDPWRAP, WRITEWRAP, ZLIB, SSLCONNECTION, PBKDF2REQUEST,
RANDOMBYTESREQUEST, TLSWRAP, Timeout, Immediate, TickObject
```

There is also the `PROMISE` resource type, which is used to track `Promise` instances and asynchronous work scheduled by them.

Los usuarios son capaces de definir su propio `type` al utilizar la API pública del embebedor.

*Nota:* Es posible tener colisiones de nombres de tipo. Embedders are encouraged to use unique prefixes, such as the npm package name, to prevent collisions when listening to the hooks.

###### `triggerId`

`triggerAsyncId` is the `asyncId` of the resource that caused (or "triggered") the new resource to initialize and that caused `init` to call. This is different from `async_hooks.executionAsyncId()` that only shows *when* a resource was created, while `triggerAsyncId` shows *why* a resource was created.

La siguiente es una demostración simple de `triggerAsyncId`:

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

Output when hitting the server with `nc localhost 8080`:

```console
TCPSERVERWRAP(2): trigger: 1 execution: 1
TCPWRAP(4): trigger: 2 execution: 0
```

El `TCPSERVERWRAP` es el servidor que recibe las conexiones.

El `TCPWRAP` es la nueva conexión del cliente. When a new connection is made the `TCPWrap` instance is immediately constructed. This happens outside of any JavaScript stack (side note: a `executionAsyncId()` of `0` means it's being executed from C++, with no JavaScript stack above it). With only that information, it would be impossible to link resources together in terms of what caused them to be created, so `triggerAsyncId` is given the task of propagating what resource is responsible for the new resource's existence.

###### `recurso`

`resource` is an object that represents the actual async resource that has been initialized. This can contain useful information that can vary based on the value of `type`. For instance, for the `GETADDRINFOREQWRAP` resource type, `resource` provides the hostname used when looking up the IP address for the hostname in `net.Server.listen()`. The API for accessing this information is currently not considered public, but using the Embedder API, users can provide and document their own resource objects. For example, such a resource object could contain the SQL query being executed.

In the case of Promises, the `resource` object will have `promise` property that refers to the Promise that is being initialized, and a `isChainedPromise` property, set to `true` if the promise has a parent promise, and `false` otherwise. For example, in the case of `b = a.then(handler)`, `a` is considered a parent Promise of `b`. Aquí, `b` es considerado como una promesa encadenada.

*Note*: In some cases the resource object is reused for performance reasons, it is thus not safe to use it as a key in a `WeakMap` or add properties to it.

###### Ejemplo de contexto asincrónico

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
  // Let's wait 10ms before logging the server started.
  setTimeout(() => {
    console.log('>>>', async_hooks.executionAsyncId());
  }, 10);
});
```

Output from only starting the server:

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

Utilizar `execution` solamente para hacer un gráfico de la asignación de recursos tiene como resultado lo siguiente:

```console
TTYWRAP(6) -> Timeout(4) -> TIMERWRAP(5) -> TickObject(3) -> root(1)
```

The `TCPSERVERWRAP` is not part of this graph, even though it was the reason for `console.log()` being called. This is because binding to a port without a hostname is a *synchronous* operation, but to maintain a completely asynchronous API the user's callback is placed in a `process.nextTick()`.

The graph only shows *when* a resource was created, not *why*, so to track the *why* use `triggerAsyncId`.

##### `before(asyncId)`

* `asyncId` {number}

When an asynchronous operation is initiated (such as a TCP server receiving a new connection) or completes (such as writing data to disk) a callback is called to notify the user. The `before` callback is called just before said callback is executed. `asyncId` is the unique identifier assigned to the resource about to execute the callback.

El callback `before` será llamado de 0 a N veces. The `before` callback will typically be called 0 times if the asynchronous operation was cancelled or, for example, if no connections are received by a TCP server. Persistent asynchronous resources like a TCP server will typically call the `before` callback multiple times, while other operations like `fs.open()` will call it only once.

##### `after(asyncId)`

* `asyncId` {number}

Se llama inmediatamente después que el callback especificado en `before` se completa.

*Note:* If an uncaught exception occurs during execution of the callback, then `after` will run *after* the `'uncaughtException'` event is emitted or a `domain`'s handler runs.

##### `destroy(asyncId)`

* `asyncId` {number}

Se llama después de que se destruye el recurso correspondiente a `asyncId` . It is also called asynchronously from the embedder API `emitDestroy()`.

*Note:* Some resources depend on garbage collection for cleanup, so if a reference is made to the `resource` object passed to `init` it is possible that `destroy` will never be called, causing a memory leak in the application. If the resource does not depend on garbage collection, then this will not be an issue.

##### `promiseResolve(asyncId)`

* `asyncId` {number}

Called when the `resolve` function passed to the `Promise` constructor is invoked (either directly or through other means of resolving a promise).

Tenga en cuenta que `resolve()` no hace ningún trabajo sincrónico observable.

*Note:* This does not necessarily mean that the `Promise` is fulfilled or rejected at this point, if the `Promise` was resolved by assuming the state of another `Promise`.

Por ejemplo:

```js
new Promise((resolve) => resolve(true)).then((a) => {});
```

llama a los siguientes callbacks:

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

* Devuelve: {number} El `asyncId` del contexto de ejecución actual. Useful to track when something calls.

Por ejemplo:

```js
const async_hooks = require('async_hooks');

console.log(async_hooks.executionAsyncId());  // llamada a 1 - bootstrap 
fs.open(path, 'r', (err, fd) => {
  console.log(async_hooks.executionAsyncId());  // llamada a 6 - open()
});
```

The ID returned from `executionAsyncId()` is related to execution timing, not causality (which is covered by `triggerAsyncId()`). Por ejemplo:

```js
const server = net.createServer(function onConnection(conn) {
  // Devuelve el ID del server, no de la nueva conexión, porque el
  // onConnection callback se ejecutan el ámbito de la función del server
  // MakeCallback().
  async_hooks.executionAsyncId();

}).listen(port, function onListening() {
  //Devuelve el ID de un TickObjetc (esto es process.netTick()) porque 
  //todos los callbacks pasados a .listen() están wrappeados en un nextTick().
  async_hooks.executionAsyncId();
}); 
```

Tenga en cuenta que los contextos de promesa no podrán recibir executionAsyncIds precisos por defecto. Consulte la sección sobre [rastreo de ejecución de promesas](#async_hooks_promise_execution_tracking).

#### `async_hooks.triggerAsyncId()`

* Returns: {number} The ID of the resource responsible for calling the callback that is currently being executed.

For example:

```js
const server = net.createServer((conn) => {
  // El recurso que causa (o dispara) que este callback se llame
  // fue el de la nueva conexión. Así el valor devuelto por triggerAsyncId()
  // es el asyncId de "conn".
  async_hooks.triggerAsyncId();

}).listen(port, () => {
  // Aunque todos los callbacks pasados a .listen() estén wrappeaddos en un nextTick()
  // el propio callback existe por que se hizo la  llamada al .listen() del server. Por lo tanto el valor devuelto sería el ID del server.
  async_hooks.triggerAsyncId();
});
```

Tenga en cuenta que los contextos de promesa no podrán recibir triggerAsyncIds válidos por defecto. Consulte la sección sobre [rastreo de ejecución de promesas](#async_hooks_promise_execution_tracking).

## Rastreo de ejecución de promises

By default, promise executions are not assigned asyncIds due to the relatively expensive nature of the [promise introspection API](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk) provided by V8. This means that programs using promises or `async`/`await` will not get correct execution and trigger ids for promise callback contexts by default.

Aquí tiene un ejemplo:

```js
const ah = require('async_hooks');
Promise.resolve(1729).then(() => {
  console.log(`eid ${ah.executionAsyncId()} tid ${ah.triggerAsyncId()}`);
});
// muestra:
// eid 1 tid 0
```

Observe that the `then` callback claims to have executed in the context of the outer scope even though there was an asynchronous hop involved. Also note that the triggerAsyncId value is 0, which means that we are missing context about the resource that caused (triggered) the `then` callback to be executed.

Installing async hooks via `async_hooks.createHook` enables promise execution tracking. Ejemplo:

```js
const ah = require('async_hooks');
ah.createHook({ init() {} }).enable(); // fuerza que PromiseHooks esté habilitado.
Promise.resolve(1729).then(() => {
  console.log(`eid ${ah.executionAsyncId()} tid ${ah.triggerAsyncId()}`);
});
// muestra:
// eid 7 tid 6
```

In this example, adding any actual hook function enabled the tracking of promises. There are two promises in the example above; the promise created by `Promise.resolve()` and the promise returned by the call to `then`. In the example above, the first promise got the asyncId 6 and the latter got asyncId 7. During the execution of the `then` callback, we are executing in the context of promise with asyncId 7. This promise was triggered by async resource 6.

Another subtlety with promises is that `before` and `after` callbacks are run only on chained promises. That means promises not created by `then`/`catch` will not have the `before` and `after` callbacks fired on them. For more details see the details of the V8 [PromiseHooks](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk) API.

## API del Embebedor de JavaScript

Library developers that handle their own asynchronous resources performing tasks like I/O, connection pooling, or managing callback queues may use the `AsyncWrap` JavaScript API so that all the appropriate callbacks are called.

### `clase AsyncResource()`

The class `AsyncResource` is designed to be extended by the embedder's async resources. Using this, users can easily trigger the lifetime events of their own resources.

El hook de `init` se activará cuando un `AsyncResource` sea instanciado.

A continuación, se muestra un resumen de la API `AsyncResource` .

```js
const { AsyncResource, executionAsyncId } = require('async_hooks');

// Se espera que se herende de AsyncResource(). Instanciar una 
// nueva AsyncResource() tambien dispara un init. Si se omite triggerAsyncId entonces
// se usa async_hook.executionAsyncId().
const asyncResource = new AsyncResource(
  type, { triggerAsyncId: executionAsyncId(), requireManualDestroy: false }
);

// Ejecuta una función en el contexto de ejecución del recurso. Esto permitirá
// * establecer el contexto de recurso 
// * disparar un AsyncHooks antes de los callbacks
// * llamar al proveedor de la función `fn` con los argumentos dados
// * disparar el AsyncHooks después de los callbacks
// * restaurar el contexto de ejecución original 
asyncResource.runInAsyncScope(fn, thisArg, ...args);

// La llamada a AsyncHooks destruye los callbacks.
asyncResource.emitDestroy();

// Devuelve el ID único asignado a la instancia de AsyncResource.
asyncResource.asyncId();

// Devuelve el ID del trigger para la instancia de AsyncResource.
asyncResource.triggerAsyncId();

// Invoca a AsyncHooks antes de los callbacks.
// Deprecado: sino usa asyncResource.runInAsyncScope.
asyncResource.emitBefore();

// Invoca a AsyncHooks después de los callbacks.
// Deprecado: sino usa asyncResource.runInAsyncScope.
asyncResource.emitAfter();
```

#### `AsyncResource(type[, options])`

* `type` {string} El tipo de evento asincrónico.
* `options` {Object} 
  * `triggerAsyncId` {number} The ID of the execution context that created this async event. **Predeterminado:** `executionAsyncId()`.
  * `requireManualDestroy` {boolean} Disables automatic `emitDestroy` when the object is garbage collected. This usually does not need to be set (even if `emitDestroy` is called manually), unless the resource's asyncId is retrieved and the sensitive API's `emitDestroy` is called with it. **Predeterminado:** `false`.

Ejemplo de uso:

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

* `fn` {Function} The function to call in the execution context of this async resource.
* `thisArg` {any} El receptor que será utilizado para la función de llamada.
* `...args` {any} Argumentos opcionales para pasar a la función.

Call the provided function with the provided arguments in the execution context of the async resource. This will establish the context, trigger the AsyncHooks before callbacks, call the function, trigger the AsyncHooks after callbacks, and then restore the original execution context.

#### `asyncResource.emitBefore()`

<!-- YAML
deprecated: v8.12.0
-->

> Estabilidad: 0 - Obsoleto: Utilice [`asyncResource.runInAsyncScope()`][] en su lugar.

* Devuelve: {undefined}

Call all `before` callbacks to notify that a new asynchronous execution context is being entered. If nested calls to `emitBefore()` are made, the stack of `asyncId`s will be tracked and properly unwound.

`before` and `after` calls must be unwound in the same order that they are called. Otherwise, an unrecoverable exception will occur and the process will abort. For this reason, the `emitBefore` and `emitAfter` APIs are considered deprecated. Please use `runInAsyncScope`, as it provides a much safer alternative.

#### `asyncResource.emitAfter()`

<!-- YAML
deprecated: v8.12.0
-->

> Estabilidad: 0 - Obsoleto: Utilice [`asyncResource.runInAsyncScope()`][] en su lugar.

* Devuelve: {undefined}

Llama a todos los callbacks `after` . If nested calls to `emitBefore()` were made, then make sure the stack is unwound properly. De otra manera ocurrirá un error.

If the user's callback throws an exception, `emitAfter()` will automatically be called for all `asyncId`s on the stack if the error is handled by a domain or `'uncaughtException'` handler.

`before` and `after` calls must be unwound in the same order that they are called. Otherwise, an unrecoverable exception will occur and the process will abort. For this reason, the `emitBefore` and `emitAfter` APIs are considered deprecated. Please use `runInAsyncScope`, as it provides a much safer alternative.

#### `asyncResource.emitDestroy()`

* Devuelve: {undefined}

Llama a todos los hooks `destroy`. Esto sólo se debe llamar una vez. An error will be thrown if it is called more than once. Esto **must** se debe llamar manualmente. If the resource is left to be collected by the GC then the `destroy` hooks will never be called.

#### `asyncResource.asyncId()`

* Devuelve: {number} El único `asyncId` asignado al recurso.

#### `asyncResource.triggerAsyncId()`

* Returns: {number} The same `triggerAsyncId` that is passed to the `AsyncResource` constructor.