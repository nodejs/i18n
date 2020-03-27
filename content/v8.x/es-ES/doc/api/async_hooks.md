# Hooks Asincrónicos

<!--introduced_in=v8.1.0-->

> Estabilidad: 1 - Experimental

El módulo `async_hooks` proporciona una API para registrar los callbacks que rastrean el tiempo de vida de recursos asincrónicos creados dentro de una aplicación de Node.js. Se puede acceder a él utilizando:

```js
const async_hooks = require('async_hooks');
```

## Terminología

Un recurso asincrónico representa un objeto con un callback asociado. Este callback puede ser llamado varias veces, por ejemplo, el evento `connection` en `net.createServer`, o simplemente una sola vez como en `fs.open`. Un recurso también puede cerrarse antes de que un callback sea llamado. AsyncHook no distingue explícitamente entre estos casos diferentes, pero los representará como el concepto abstracto que es un recurso.

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

* `callbacks` {Object} The [Hook Callbacks](#async_hooks_hook_callbacks) to register
  * `init` {Function} El [`init` callback][].
  * `before` {Function} El [`before` callback][].
  * `after` {Function} El [`after` callback][].
  * `destroy` {Function} El [`destroy` callback][].
* Devoluciones: {AsyncHook} Instancia utilizada para inhabilitar y habilitar hooks

Registra funciones para que sean llamadas para diferentes eventos en el tiempo de vida de cada operación asincrónica.

Los callbacks `init()`/`before()`/`after()`/`destroy()` son llamados para el respectivo evento asincrónico durante el tiempo de vida de un recurso.

Todos los callbacks son opcionales. Por ejemplo, si solamente se necesita rastrear la limpieza de recursos, entonces solo será necesario pasar el callback `destroy` . Las especificaciones de todas las funciones que pueden ser pasadas a `callbacks` están en la sección [Callbacks de Hooks](#async_hooks_hook_callbacks) .

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

Si algún callback de `AsyncHook` arroja, la aplicación imprimirá el seguimiento de pilas y saldrá. La ruta de salida sí sigue a una excepción no capturada, pero se eliminan todos los listeners de `uncaughtException`, forzando la salida del proceso. Los callbacks de `'exit'` seguirán siendo llamados a menos que la aplicación se ejecute con `--abort-on-uncaught-exception`, en dado caso un seguimiento de pilas será impreso y la aplicación saldrá, dejando un archivo principal.

El motivo de este comportamiento de manejo de error es que estos callbacks se ejecutan en puntos potencialmente volátiles en el tiempo de vida de un objeto, por ejemplo, durante la construcción y destrucción de una clase. Debido a esto, se considera necesario reducir el proceso rápidamente para evitar una suspensión no intencionada en el futuro. Esto está sujeto a cambios en el futuro si se realiza un análisis comprensivo para asegurar que una excepción pueda seguir el flujo de control normal sin efectos secundarios no intencionados.


##### Impresión en los callbacks de AsyncHooks

Ya que imprimir hacia la consola es una operación asincrónica, `console.log()` causará que los callbacks de AsyncHooks sean llamados. Utilizar `console.log()` u operaciones asincrónicas similares dentro de una función de callback de AsyncHooks causará una recursión infinita. Una solución fácil para esto al momento de depurar es utilizar una operación de registro sincrónico tal como `fs.writeSync(1, msg)`. Esto imprimirá hacia stdout porque `1` es el descriptor de archivo para stdout y no invocará a AsyncHooks de manera recursiva porque es sincrónico.

```js
const fs = require('fs');
const util = require('util');

function debug(...args) {
  // use a function like this one when debugging inside an AsyncHooks callback
  fs.writeSync(1, `${util.format(...args)}\n`);
}
```

Si se necesita una operación asincrónica para registrarse, es posible mantener un seguimiento de lo que causó la operación asincrónica que utiliza la información proporcionada por AsyncHooks. Por lo tanto el registro debería ser omitido, cuando era el registro en sí lo que causó que el callback de AsyncHooks llamara. Al hacer esto, la recursión que sería infinita se rompe.

#### `asyncHook.enable()`

* Devuelve: {AsyncHook} Una referencia a `asyncHook`.

Habilita los callbacks para una instancia determinada de `AsyncHook` . Si no se proporcionan callbacks, habilitarlos sería un noop.

La instancia `AsyncHook` está inhabilitada por defecto. Si la instancia `AsyncHook` fuese habilitada inmediatamente después de la creación, se podría utilizar el siguiente patrón.

```js
const async_hooks = require('async_hooks');

const hook = async_hooks.createHook(callbacks).enable();
```

#### `asyncHook.disable()`

* Devuelve: {AsyncHook} Una referencia a `asyncHook`.

Inhabilita los callbacks para una instancia dada de `AsyncHook` del pool global de callbacks de AsyncHook que serán ejecutados. Una vez que un hook haya sido inhabilitado, no volverá a ser llamado hasta que vuelva a ser habilitado.

Para la consistencia de APIs, `disable()` también devuelve la instancia `AsyncHook` .

#### Callbacks de Hooks

Los eventos clave en el tiempo de vida de eventos asincrónicos han sido categorizados en cuatro áreas: instanciación, antes/después de que un callback es llamado, y cuando la instancia es destruida.

##### `init(asyncId, type, triggerAsyncId, resource)`

* `asyncId` {number} Una ID única para el recurso asincrónico.
* `type` {string} El tipo del recurso asincrónico.
* `triggerAsyncId` {number} La ID única del recurso asincrónico en cuyo contexto de ejecución fue creado este recurso asincrónico.
* `resource` {Object} Referencia al recurso que representa la operación asincrónica, necesita ser liberada durante _destroy_.

Se llama cuando se construye una clase que tiene la _posibilidad_ de emitir un evento asincrónico. Esto _no_ significa que la instancia debe llamar a `before`/`after` antes de que `destroy` sea llamado, solo que la posibilidad existe.

Se puede observar este comportamiento al hacer algo como abrir un recurso, y después cerrarlo antes de que el recurso pueda ser utilizado. El siguiente fragmento demuestra esto.

```js
require('net').createServer().listen(function() { this.close(); });
// OR
clearTimeout(setTimeout(() => {}, 10));
```

A cada recurso nuevo se le asigna una ID que es única dentro del ámbito del proceso actual.

###### `tipo`

El `type` es una string que identifica el tipo de recurso que causó que `init` fuese llamado. Generalmente, corresponderá al nombre del constructor del recurso.

```text
FSEVENTWRAP, FSREQWRAP, GETADDRINFOREQWRAP, GETNAMEINFOREQWRAP, HTTPPARSER,
JSSTREAM, PIPECONNECTWRAP, PIPEWRAP, PROCESSWRAP, QUERYWRAP, SHUTDOWNWRAP,
SIGNALWRAP, STATWATCHER, TCPCONNECTWRAP, TCPSERVERWRAP, TCPWRAP, TIMERWRAP,
TTYWRAP, UDPSENDWRAP, UDPWRAP, WRITEWRAP, ZLIB, SSLCONNECTION, PBKDF2REQUEST,
RANDOMBYTESREQUEST, TLSWRAP, Timeout, Immediate, TickObject
```

También está el tipo de recurso `PROMISE`, el cual se utiliza para rastrear las instancias de `Promise` y el trabajo asincrónico programado para esas instancias.

Los usuarios son capaces de definir su propio `type` al utilizar la API pública del embebedor.

*Nota:* Es posible tener colisiones de nombres de tipo. A los embebedores se les anima utilizar prefijos únicos, tales como el nombre del paquete del npm, para prevenir colisiones al escuchar los hooks.

###### `triggerId`

`triggerAsyncId` es el `asyncId` del recurso que causó (o "activó") que el nuevo recurso se inicializara y que causó que `init` llamara. This is different from `async_hooks.executionAsyncId()` that only shows *when* a resource was created, while `triggerAsyncId` shows *why* a resource was created.


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

El `TCPWRAP` es la nueva conexión del cliente. Cuando se crea una nueva conexión, se construye inmediatamente la instancia `TCPWrap` . Esto ocurre fuera de cualquier pila de JavaScript (nota: una `executionAsyncId()` de `0` significa que está siendo ejecutada desde C++, sin pilas de JavaScript sobre la misma). Con solo esa información, sería imposible vincular recursos en términos de lo que hizo que fuesen creados, así que a `triggerAsyncId` se le da la tarea de propagar cuál recurso es responsable de la existencia del nuevo recurso.

###### `recurso`

`resource` es un objeto que representa el recurso asincrónico verdadero que ha sido inicializado. Esto puede contener información útil que puede variar con base en el valor de `type`. Por ejemplo, para el tipo de recurso `GETADDRINFOREQWRAP`, `resource` proporciona el nombre de host utilizado cuando se busca la dirección IP para el nombre de host en `net.Server.listen()`. La API para acceder a esta información actualmente no se considera como pública, pero al utilizar la API del embebedor, los usuarios pueden proporcionar y documentar sus propios objetos de recurso. Por ejemplo, dicho objeto de recurso podría contener la consulta SQL que esté siendo ejecutada.

In the case of Promises, the `resource` object will have `promise` property that refers to the Promise that is being initialized, and a `isChainedPromise` property, set to `true` if the promise has a parent promise, and `false` otherwise. Por ejemplo, en el caso de `b = a.then(handler)`, `a` es considerada como la Promesa principal de `b`. Aquí, `b` es considerado como una promesa encadenada.

*Nota*: En algunos casos, se reutiliza el objeto de recurso por motivos de rendimiento, por lo tanto, no es seguro utilizarlo como una clave en un `WeakMap` o agregarle propiedades.

###### Ejemplo de contexto asincrónico

Lo siguiente es un ejemplo con información adicional sobre las llamadas a `init` entre las llamadas de `before` y `after`, específicamente cómo se verá el callback a `listen()` . El formateo de salida está un poco más elaborado para hacer que el contexto de llamada pueda ser visto más fácilmente.

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

*Nota*: Como se ilustra en el ejemplo, `executionAsyncId()` y `execution` especifican el valor del contexto de ejecución actual; el cual está delineado por las llamadas a `before` y `after`.

Utilizar solamente `execution` para hacer un gráfico de la asignación de recursos da como resultado lo siguiente:

```console
TTYWRAP(6) -> Timeout(4) -> TIMERWRAP(5) -> TickObject(3) -> root(1)
```

El `TCPSERVERWRAP` no es parte de este gráfico, a pesar de que fue el motivo por el cual `console.log()` fue llamado. El motivo de esto es porque enlazar a un puerto sin un nombre de host es una operación *sincrónica*, pero para mantener una API completamente asincrónica, se coloca el callback del usuario en un `process.nextTick()`.

The graph only shows *when* a resource was created, not *why*, so to track the *why* use `triggerAsyncId`.


##### `before(asyncId)`

* `asyncId` {number}

Cuando se inicia una operación asincrónica (así como un servidor de TCP que recibe una nueva conexión) o completa (así como escribir datos a un disco), un callback es llamado para notificar al usuario. El callback `before` es llamado justo antes de que se ejecute dicho callback. `asyncId` es el único identificador asignado al recurso que está por ejecutar el callback.

El callback `before` será llamado de 0 a N veces. El callback `before` generalmente será llamado 0 veces si la operación asincrónica fue cancelada o, por ejemplo, si el servidor de TCP no recibe ninguna conexión. Recursos asincrónicos persistentes como un servidor de TCP generalmente llamarán al callback `before` varias veces, mientras que otras operaciones como `fs.open()` llamarán una sola vez.


##### `after(asyncId)`

* `asyncId` {number}

Es llamado inmediatamente después de que se completa el callback especificado en `before` .

*Note:* If an uncaught exception occurs during execution of the callback, then `after` will run *after* the `'uncaughtException'` event is emitted or a `domain`'s handler runs.


##### `destroy(asyncId)`

* `asyncId` {number}

Es llamado después de que se destruye el recurso correspondiente a `asyncId`. También es llamado de manera asincrónica desde la API del embebedor `emitDestroy()`.

*Nota:* Algunos recursos dependen de la recolección de basura para la limpieza, por lo tanto si se crea un referencia para el objeto de `resource` pasado a `init`, es posible que `destroy` nunca sea llamado, causando una pérdida de memoria en la aplicación. Si el recurso no depende de la recolección de basura, entonces esto no será un problema.

##### `promiseResolve(asyncId)`

* `asyncId` {number}

Es llamado cuando la función de `resolve` pasada al constructor de `Promise` es invocada (ya sea de manera directa o a través de otros medios de resolución de una promesa).

Tenga en cuenta que `resolve()` no realiza ningún trabajo sincrónico observable.

*Nota:* Esto no significa necesariamente que la `Promise` se cumplirá o se rechazará en este punto, si la `Promise` fue resuelta asumiendo el estado de otra `Promise`.

Por ejemplo:

```js
new Promise((resolve) => resolve(true)).then((a) => {});
```

llama a los siguiente callbacks:

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

* Devuelve: {number} El `asyncId` del contexto de ejecución actual. Útil para rastrear cuando algo llama.

Por ejemplo:

```js
const async_hooks = require('async_hooks');

console.log(async_hooks.executionAsyncId());  // llamada a 1 - bootstrap 
fs.open(path, 'r', (err, fd) => {
  console.log(async_hooks.executionAsyncId());  // llamada a 6 - open()
});
```

La ID devuelta desde `executionAsyncId()` está relacionada con el tiempo de ejecución, no con la causalidad (la cual está cubierta por `triggerAsyncId()`). Por ejemplo:

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

* Devuelve: {number} La ID del recurso responsable de llamar al callback que está siendo actualmente ejecutado.

Por ejemplo:

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

Tenga en cuenta que los contextos de promesa no podrán recibir triggerAsyncIds válidos por defecto. Consulte la sección sobre [promise execution tracking](#async_hooks_promise_execution_tracking).

## Rastreo de ejecución de promises

By default, promise executions are not assigned asyncIds due to the relatively expensive nature of the [promise introspection API](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk) provided by V8. Esto significa que los programas que utilizan promesas ó `async`/`await` no obtendrán una ejecución correcta y activarán identificaciones para contextos de callbacks de promesas por defecto.

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

Instalar hooks asincrónicos mediante `async_hooks.createHook` habilita el rastreo de ejecución de promises. Ejemplo:

```js
const ah = require('async_hooks');
ah.createHook({ init() {} }).enable(); // fuerza que PromiseHooks esté habilitado.
Promise.resolve(1729).then(() => {
  console.log(`eid ${ah.executionAsyncId()} tid ${ah.triggerAsyncId()}`);
});
// muestra:
// eid 7 tid 6
```

En este ejemplo, agregar cualquier función real de un hook habilitó el rastreo de las promesas. There are two promises in the example above; the promise created by `Promise.resolve()` and the promise returned by the call to `then`. In the example above, the first promise got the asyncId 6 and the latter got asyncId 7. During the execution of the `then` callback, we are executing in the context of promise with asyncId 7. This promise was triggered by async resource 6.

Otra sutileza con las promises es que los callbacks de `before` y `after` se ejecutan sólo en promises encadenadas. That means promises not created by `then`/`catch` will not have the `before` and `after` callbacks fired on them. For more details see the details of the V8 [PromiseHooks](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk) API.

## API del Embebedor de JavaScript

Library developers that handle their own asynchronous resources performing tasks like I/O, connection pooling, or managing callback queues may use the `AsyncWrap` JavaScript API so that all the appropriate callbacks are called.

### `clase AsyncResource()`

La clase `AsyncResource` está diseñada para extenderse por los registros asincrónicos del embebedor. Al usar esto, los usuarios podrán fácilmente activar los eventos del tiempo de vida de sus propios recursos.

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
* `opciones` {Object}
  * `triggerAsyncId` {number} La ID del contexto de ejecución que creó este evento asincrónico. **Predeterminado:** `executionAsyncId()`.
  * `requireManualDestroy` {boolean} Inhabilita la función automática `emitDestroy` cuando el objeto es recolectado en la basura. Generalmente, esto no necesita ser establecido (incluso si `emitDestroy` es llamado manualmente), a menos que el asyncId del recurso sea recuperado y las API's sensibles de `emitDestroy` sean llamadas con ello. **Predeterminado:** `false`.

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

* `fn` {Function} La función para llamar en el contexto de ejecución de este recurso asincrónico.
* `thisArg` {any} El receptor que será utilizado para la función de llamada.
* `...args` {any} Argumentos opcionales para pasar a la función.

Llama a la función proporcionada con los argumentos proporcionados en el contexto de ejecución del recurso asincrónico. Esto establecerá el contexto, activará el AsyncHooks antes de los callbacks, llamará la función, activará el AsyncHooks después de los callbacks, y después restaurará el contexto de ejecución original.

#### `asyncResource.emitBefore()`
<!-- YAML
deprecated: v8.12.0
-->
> Estabilidad: 0 - Obsoleto: Utilice [`asyncResource.runInAsyncScope()`][] en su lugar.

* Devuelve: {undefined}

Llama a todos los callbacks de `before` para notificar que un nuevo contexto de ejecución asincrónico está siendo accedido. Si se realizan llamadas anidadas a `emitBefore()`, la pila de `asyncId`s será rastreada y desenrollada correctamente.

Las llamadas de `before` y `after` deben ser desenrolladas en el mismo orden en el cual son llamadas. De lo contrario, ocurrirá una excepción irrecuperable y se anulará el proceso. Por este motivo, las APIs de `emitBefore` y `emitAfter` se consideran obsoletas. Por favor utilice `runInAsyncScope`, ya que ofrece una alternativa mucha más segura.

#### `asyncResource.emitAfter()`
<!-- YAML
deprecated: v8.12.0
-->
> Estabilidad: 0 - Obsoleto: Utilice [`asyncResource.runInAsyncScope()`][] en su lugar.

* Devuelve: {undefined}

Llama a todos los callbacks `after` . Si se realizaron llamadas anidadas a `emitBefore()`, entonces asegúrese de que el stack se desenrolle correctamente. De otra manera ocurrirá un error.

Si el callback del usuario arroja una excepción, `emitAfter()` será llamado automáticamente para todos los `asyncId`s en el stack si el error es manejado por un dominio o un handler de `'uncaughtException'` .

Las llamadas de `before` y `after` deben ser desenrolladas en el mismo orden en el cual son llamadas. De lo contrario, ocurrirá una excepción irrecuperable y se anulará el proceso. Por este motivo, las APIs de `emitBefore` y `emitAfter` se consideran obsoletas. Por favor utilice `runInAsyncScope`, ya que ofrece una alternativa mucha más segura.

#### `asyncResource.emitDestroy()`

* Devuelve: {undefined}

Llama a todos los hooks `destroy`. Esto sólo se debe llamar una vez. Ocurrirá un error si se llama más de una vez. Esto **must** se debe llamar manualmente. Si se deja el recurso para que sea recolectado por el GC, entonces los hooks `destroy` nunca serán llamados.

#### `asyncResource.asyncId()`

* Devuelve: {number} El único `asyncId` asignado al recurso.

#### `asyncResource.triggerAsyncId()`

* Devuelve: {number} El mismo `triggerAsyncId` que es pasado al constructor de `AsyncResource` .
