# Hooks Asincrónicos

<!--introduced_in=v8.1.0-->

> Estabilidad: 1 - Experimental

El módulo de `async_hooks` proporciona una API para registrar los callbacks que rastrean el tiempo de vida de recursos asíncronos creados dentro de una aplicación de Node.js. Puede ser accedido utilizando:

```js
const async_hooks = require('async_hooks');
```

## Terminología

Un recurso asíncrono representa un objeto con un callback asociado. Este callback se puede llamar varias veces, por ejemplo, el evento `'connection'` en `net.createServer()`, o simplemente una sóla vez como en `fs.open()`. Un recurso también puede cerrarse antes de que se llame un callback. `AsyncHook` no distingue explícitamente entre estos casos diferentes, pero los representará como el concepto abstracto que es un recurso.

## API Pública

### Resumen

A continuación, está un simple resumen de la API pública.

```js
const async_hooks = require('async_hooks');

// Return the ID of the current execution context.
const eid = async_hooks.executionAsyncId();

// Return the ID of the handle responsible for triggering the callback of the
// current execution scope to call.
const tid = async_hooks.triggerAsyncId();

// Create a new AsyncHook instance. Todos estos callbacks son opcionales.
const asyncHook =
    async_hooks.createHook({ init, before, after, destroy, promiseResolve });

// Allow callbacks of this AsyncHook instance to call. This is not an implicit
// action after running the constructor, and must be explicitly run to begin
// executing callbacks.
asyncHook.enable();

// Disable listening for new asynchronous events.
asyncHook.disable();

//
// The following are the callbacks that can be passed to createHook().
//

// init is called during object construction. The resource may not have
// completed construction when this callback runs, therefore all fields of the
// resource referenced by "asyncId" may not have been populated.
function init(asyncId, type, triggerAsyncId, resource) { }

// before is called just before the resource's callback is called. It can be
// called 0-N times for handles (e.g. TCPWrap), and will be called exactly 1
// time for requests (e.g. FSReqWrap).
function before(asyncId) { }

// after is called just after the resource's callback has finished.
function after(asyncId) { }

// destroy is called when an AsyncWrap instance is destroyed.
function destroy(asyncId) { }

// promiseResolve is called only for promise resources, when the
// `resolve` function passed to the `Promise` constructor is invoked
// (either directly or through other means of resolving a promise).
function promiseResolve(asyncId) { }
```

#### async_hooks.createHook(callbacks)

<!-- YAML
added: v8.1.0
-->

* `callbacks` {Object} Los [Callbacks de Hook](#async_hooks_hook_callbacks) para registrar 
  * `init` {Function} The [`init` callback][].
  * `before` {Function} The [`before` callback][].
  * `after` {Function} The [`after` callback][].
  * `destroy` {Function} The [`destroy` callback][].
* Devoluciones: {AsyncHook} Instancia utilizada para inhabilitar y habilitar hooks

Registra funciones para que sean llamadas por diferentes eventos en el tiempo de vida de cada operación asincrónica.

Los callbacks `init()`/`before()`/`after()`/`destroy()` son llamados para el respectivo evento asincrónico durante el tiempo de vida de un recurso.

Todos los callbacks son opcionales. Por ejemplo, si solamente se necesita rastrear la limpieza de recursos, entonces sólo se necesitará pasar el callback `destroy` . Las especificaciones de todas las funciones que pueden ser pasadas a `callbacks` están en la sección [Hook Callbacks](#async_hooks_hook_callbacks) .

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

Si alguno de los callbacks de `AsyncHook` arrojan, la aplicación imprimirá el stack trace y saldrá. La ruta de salida sí sigue a una excepción no capturada, pero se eliminan todos los oyentes de `'uncaughtException'`, forzando la salida del proceso. Los callbacks de `'exit'` seguirán siendo llamados a menos que la aplicación se ejecute con `--abort-on-uncaught-exception`, en cuyo caso un stack trace será impreso y la aplicación saldrá, dejando un archivo principal.

El motivo de este comportamiento de manejo de error es que estos callbacks se ejecutan en puntos potencialmente volátiles en el tiempo de vida de un objeto, por ejemplo, durante la construcción y destrucción de una clase. Debido a esto, se considera necesario reducir el proceso rápidamente para evitar una anulación no intencionada en el futuro. Esto está sujeto a cambio en el futuro si un análisis comprensivo se realiza para asegurar que una excepción puede seguir el flujo de control normal sin efectos secundarios no intencionados.

##### Impresión en los Callbacks de AsyncHooks

Ya que imprimir hacia la consola es una operación asincrónica, `console.log()` causará que los callbacks de AsyncHooks sean llamados. Utilizar `console.log()` u operaciones asincrónicas similares dentro de una función de callback de AsyncHooks causará una recursión infinita. Una solución fácil para esto al momento de depurar es utilizar una operación de registro sincrónico tal como `fs.writeSync(1, msg)`. Esto imprimirá hacia stdout porque `1` es el descriptor de archivo para stdout y no invocará a AsyncHooks de manera recursiva porque es sincrónico.

```js
const fs = require('fs');
const util = require('util');

function debug(...args) {
  // use a function like this one when debugging inside an AsyncHooks callback
  fs.writeSync(1, `${util.format(...args)}\n`);
}
```

Si se necesita una operación asincrónica para registrarse, es posible realizar un seguimiento de lo que causó la operación asincrónica que utiliza la información proporcionada por AsyncHooks. El registro debe omitirse cuando era el registro en sí el que causaba que el callback de AsyncHooks llamara. Al hacer esto la recursión que sería infinita se rompe.

#### asyncHook.enable()

* Devuelve: {AsyncHook} Una referencia a `asyncHook`.

Habilita las callbacks para una instancia determinada de `AsyncHook` . Si no se proporcionan callbacks, habilitarlos sería un noop.

La instancia de `AsyncHook` está inhabilitada por defecto. Si la instancia de `AsyncHook` debe ser habilitada inmediatamente después de la creación, se puede utilizar el siguiente patrón.

```js
const async_hooks = require('async_hooks');

const hook = async_hooks.createHook(callbacks).enable();
```

#### asyncHook.disable()

* Devuelve: {AsyncHook} Una referencia a `asyncHook`.

Inhabilita los callbacks para una instancia dada de `AsyncHook`, desde el grupo global de callbacks de `AsyncHook` que serán ejecutados. Una vez que un hook haya sido inhabilitado, no volverá a ser llamado hasta que se habilite.

Para la consistencia de una API, `disable()` también devuelve la instancia de `AsyncHook` .

#### Callbacks de Hook

Los eventos clave en el tiempo de vida de eventos asincrónicos han sido categorizados en cuatro áreas: instanciación, antes/después de que un callback es llamado, y cuando la instancia es destruida.

##### init(asyncId, type, triggerAsyncId, resource)

* `asyncId` {number} Una identificación única para el recurso asincrónico.
* `type` {string} El tipo del recurso asincrónico.
* `triggerAsyncId` {number} La identificación única del recurso asincrónico en cuyo contexto de ejecución fue creado este recurso asincrónico.
* `resource` {Object} Referencia al recurso que representa la operación asincrónica, necesita ser liberada durante *destroy*.

Se llama cuando se construye una clase que tiene la *posibilidad* de emitir un evento asincrónico. Esto *no* significa que la instancia debe llamar a `before`/`after` antes de que `destroy` sea llamado, solo que la posibilidad existe.

Se puede observar este comportamiento al hacer algo como abrir un recurso, y después cerrarlo antes de que el recurso pueda ser utilizado. El siguiente fragmento demuestra esto.

```js
require('net').createServer().listen(function() { this.close(); });
// OR
clearTimeout(setTimeout(() => {}, 10));
```

A cada nuevo recurso se le asigna una identificación que es única dentro del scope del proceso actual.

###### `tipo`

El `type` es una string que identifica el tipo de recurso que causó que `init` fuese llamado. Generalmente, corresponderá al nombre del constructor del recurso.

```text
FSEVENTWRAP, FSREQWRAP, GETADDRINFOREQWRAP, GETNAMEINFOREQWRAP, HTTPPARSER,
JSSTREAM, PIPECONNECTWRAP, PIPEWRAP, PROCESSWRAP, QUERYWRAP, SHUTDOWNWRAP,
SIGNALWRAP, STATWATCHER, TCPCONNECTWRAP, TCPSERVER, TCPWRAP, TIMERWRAP, TTYWRAP,
UDPSENDWRAP, UDPWRAP, WRITEWRAP, ZLIB, SSLCONNECTION, PBKDF2REQUEST,
RANDOMBYTESREQUEST, TLSWRAP, Timeout, Immediate, TickObject
```

También está el tipo de recurso `PROMISE`, el cual se utiliza para rastrear las instancias `Promise` y el trabajo asincrónico programado por ellos.

Los usuarios son capaces de definir su propio `type` al usar la API pública del embebedor.

Es posible tener colisiones de nombres de tipo. A los embebedores se les anima a utilizar prefijos únicos, tales como el nombre de paquete del npm, para prevenir colisiones al escuchar a los hooks.

###### `triggerAsyncId`

`triggerAsyncId` es el `asyncId` del recurso que causó (o "activó") que el nuevo recurso se inicializara y que causó que `init` llamara. Esto es diferente a `async_hooks.executionAsyncId()`, el cual solamente muestra *cuándo* se creó un recurso, mientras que `triggerAsyncId` muestra *por qué* se creó un recurso.

La siguiente es una demostracion simple de `triggerAsyncId`:

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

El `TCPWRAP` es la nueva conexión desde el cliente. Cuando se crea una nueva conexión, se construye inmediatamente la instancia de `TCPWrap` . Esto ocurre fuera de cualquier stack de JavaScript. (Un `executionAsyncId()` de `0` significa que está siendo ejecutado desde C++ sin stacks de JavaScript sobre ello.) Con sólo esa información, sería imposible enlazar recursos en terminos de qué causó que fueran creados, por lo que a `triggerAsyncId` se le da la tarea de propagar qué recurso es responsable de la existencia del nuevo recurso.

###### `recurso`

`resource` es un objeto que representa el recurso asincrónico verdadero que ha sido inicializado. Esto puede contener información útil que puede variar con base en el valor de `type`. Por ejemplo, para el tipo de recurso `GETADDRINFOREQWRAP`, `resource` proporciona el nombre de host utilizado cuando se busca la dirección IP para el nombre de host en `net.Server.listen()`. La API para acceder a esta información actualmente no se considera como pública, pero al usar la API del Embebedor, los usuarios pueden proporcionar y documentar sus propios objetos de recurso. Por ejemplo, tal objeto de recurso podría contener la consulta SQL siendo ejecutada.

En el caso de las Promesas, el objeto de `resource` tendrá la propiedad de `promise` que se refiere a la `Promise` que está siendo inicializada, y una propiedad de `isChainedPromise`, establecida para `true` si la promesa tiene una promesa mayor, y `false` en caso contrario. Por ejemplo, en el caso de `b = a.then(handler)`, `a` es considerado como un `Promise` mayor de `b`. Aquí, `b` es considerado como una promesa encadenada.

En algunos casos, se reutiliza el objeto de recurso por motivos de rendimiento, por lo tanto, no es seguro utilizarlo como una clave en una `WeakMap` o agregarle propiedades.

###### Ejemplo de contexto asincrónico

Lo siguiente es un ejemplo con información adicional sobre las llamadas a `init` entre las llamadas `before` y `after`, específicamente cómo se verá el callback a `listen()` . El formateo de salida está un poco más elaborado para hacer que el contexto de llamada sea visto más fácilmente.

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

Como se ilustra en el ejemplo, `executionAsyncId()` y `execution` cada uno especifica el valor del contexto de ejecución actual; el cual está delineado por las llamadas a `before` y `after`.

Utilizar `execution` solamente para hacer un gráfico de la asignación de recursos tiene como resultado lo siguiente:

```console
TTYWRAP(6) -> Timeout(4) -> TIMERWRAP(5) -> TickObject(3) -> root(1)
```

El `TCPSERVERWRAP` no es parte de este gráfico, a pesar de que fue el motivo por el cual `console.log()` fue llamado. El motivo de esto es porque enlazar a un puerto sin un nombre de host es una operación *sincrónica*, pero para mantener una API completamente asincrónica, el callback del usuario se ubica en un `process.nextTick()`.

El gráfico sólo muestra *when* un recurso fue creado, no muestra *why*, así que para rastrear *why* utilice `triggerAsyncId`.

##### before(asyncId)

* `asyncId` {number}

Cuando una operación asincrónica es iniciada (tal como un servidor de TCP que reciba una nueva conexión) o completa (tal como escribir datos a un disco) un callback es llamado para notificar al usuario. El callback de `before` es llamado justo antes de que se ejecute dicho callback. `asyncId` es el único identificador asignado al recurso que está por ejecutar el callback.

El callback `before` será llamado de 0 a N veces. El callback `before` generalmente será llamado 0 veces si la operación asincrónica fue cancelada o, por ejemplo, si el servidor de TCP no recibe ninguna conexión. Recursos asincrónicos persistentes como un servidor TCP generalmente llamarán al callback de `before` varias veces, mientras que otras operaciones como `fs.open()` llamarán sólo una vez.

##### after(asyncId)

* `asyncId` {number}

Se llama inmediatamente después que el callback especificado en `before` se completa.

Si ocurre una excepción no capturada durante la ejecución del callback, entonces `after` se ejecutará *después* de que el evento de `'uncaughtException'` sea emitido o un handler de `domain` se ejecute.

##### destroy(asyncId)

* `asyncId` {number}

Se llama después de que se destruye el recurso correspondiente a `asyncId` . También es llamado de manera asincrónica desde la API del embebedor `emitDestroy()`.

Algunos recursos dependen de la recolección de basura para la limpieza, por lo que si una referencia se crea para el objeto de `resource` pasado a `init`, es posible que `destroy` nunca sea llamado, causando una pérdida de memoria en la aplicación. Si el recurso no depende de la recolección de basura, entonces esto no será un problema.

##### promiseResolve(asyncId)

* `asyncId` {number}

Se llama cuando la función de `resolve` pasada al constructor de `Promise` es invocada (directamente o a través de otros medios de resolución de una promesa).

Tenga en cuenta que `resolve()` no hace ningún trabajo sincrónico observable.

La `Promise` no necesariamente se cumple ni se rechaza en este punto si la `Promise` fue resuelta asumiendo el estado de otra `Promise`.

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

#### async_hooks.executionAsyncId()

<!-- YAML
added: v8.1.0
changes:

  - version: v8.2.0
    pr-url: https://github.com/nodejs/node/pull/13490
    description: Renamed from `currentId`
-->

* Devuelve: {number} El `asyncId` del contexto de ejecución actual. Útil para rastrear cuando algo llama.

```js
const async_hooks = require('async_hooks');

console.log(async_hooks.executionAsyncId());  // 1 - bootstrap
fs.open(path, 'r', (err, fd) => {
  console.log(async_hooks.executionAsyncId());  // 6 - open()
});
```

La identificación devuelta desde `executionAsyncId()` está relacionada al tiempo de ejecución, no a la casualidad (la cual está cubierta por `triggerAsyncId()`):

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

Tenga en cuenta que los contextos de promesa no podrán recibir `executionAsyncIds` precisos por defecto. Consulte la sección sobre [rastreo de ejecución de promesas](#async_hooks_promise_execution_tracking).

#### async_hooks.triggerAsyncId()

* Devuelve: {number} La ID del recurso responsable de llamar al callback que está siendo actualmente ejecutado.

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

Tenga en cuenta que los contextos de promesa no podrán recibir `triggerAsyncId`s válidos por defecto. Consulte la sección sobre [promise execution tracking](#async_hooks_promise_execution_tracking).

## Rastreo de ejecución de promises

Por defecto, a las ejecuciones de promesas no se les asignan `asyncId`s, debido a la relativamente costosa naturaleza de la [promise introspection API](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk) proporcionada por V8. Esto significa que los programas que utilizan promesas ó `async`/`await` no obtendrán una ejecución correcta y activarán identificaciones para contextos de callbacks de promesas por defecto.

Aquí tiene un ejemplo:

```js
const ah = require('async_hooks');
Promise.resolve(1729).then(() => {
  console.log(`eid ${ah.executionAsyncId()} tid ${ah.triggerAsyncId()}`);
});
// produces:
// eid 1 tid 0
```

Observe que el callback de `then()` reclama haber ejecutado en el contexto del ámbito externo a pesar de que hubo un salto asincrónico involucrado. También tenga en cuenta que el valor de `triggerAsyncId` es `0`, lo que significa que nos falta contexto sobre el recurso que causó (activó) que el callback `then()` fuese ejecutado.

Instalar hooks asincrónicos mediante `async_hooks.createHook` habilita el rastreo de ejecución de promises. Ejemplo:

```js
const ah = require('async_hooks');
ah.createHook({ init() {} }).enable(); // forces PromiseHooks to be enabled.
Promise.resolve(1729).then(() => {
  console.log(`eid ${ah.executionAsyncId()} tid ${ah.triggerAsyncId()}`);
});
// produces:
// eid 7 tid 6
```

En este ejemplo, agregar cualquier función real de un hook habilitó el rastreo de las promesas. Hay dos promesas en el ejemplo anterior; la promesa creada por `Promise.resolve()` y la promesa devuelta por la llamada a `then()`. En el ejemplo anterior, la primera promesa recibió el `asyncId` `6`, y la última recibió `asyncId` `7`. Durante la ejecución del callback de `then()`, estamos ejecutando en el contexto de la promesa con `asyncId` `7`. Esta promesa fue activada por el recurso asincrónico `6`.

Otra sutileza con las promises es que los callbacks de `before` y `after` se ejecutan sólo en promises encadenadas. Esto significa que las promesas no creadas por `then()`/`catch()` no tendrán los callbacks de `before` y `after` activadas en ellos. Para más detalles vea los detalles de la API [PromiseHooks](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk) de V8.

## API del Embebedor de JavaScript

Los desarrolladores de bibliotecas que manejan sus propios recursos asincrónicos que realizan tareas como E/S, agrupamiento de conexiones, o la administración de filas de callbacks pueden utilizar la API de JavaScript de `AsyncWrap` para que los callbacks apropiados sean llamados.

### Clase: AsyncResource

La clase `AsyncResource` está diseñada para extenderse por los registros asincrónicos del embebedor. Al usar esto, los usuarios podrán fácilmente activar los eventos del tiempo de vida de sus propios recursos.

El hook de `init` se activará cuando un `AsyncResource` sea instanciado.

A continuación, se muestra un resumen de la API `AsyncResource` .

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

* `type` {string} El tipo de evento asincrónico.
* `opciones` {Object} 
  * `triggerAsyncId` {number} La ID del contexto de ejecución que creó este evento asincrónico. **Predeterminado:** `executionAsyncId()`.
  * `requireManualDestroy` {boolean} Inhabilita la función automática de `emitDestroy` cuando el objeto es recolectado en la basura. Esto usualmente no necesita ser establecido (incluso si `emitDestroy` es llamado manualmente), a menos que el `asyncId` del recurso sea recuperado y las API´s sensibles de `emitDestroy` sean llamadas con ello. **Predeterminado:** `false`.

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

#### asyncResource.runInAsyncScope(fn[, thisArg, ...args])

<!-- YAML
added: v9.6.0
-->

* `fn` {Function} La función para llamar en el contexto de ejecución de este recurso asincrónico.
* `thisArg` {any} El receptor que será utilizado para la función de llamada.
* `...args` {any} Argumentos opcionales para pasar a la función.

Llama a la función proporcionada con los argumentos proporcionados en el contexto de ejecución del recurso asincrónico. Esto establecerá el contexto, activará el AsyncHooks antes de los callbacks, llamará la función, activará el AsyncHooks después de los callbacks, y después restaurará el contexto de ejecución original.

#### asyncResource.emitBefore()

<!-- YAML
deprecated: v9.6.0
-->

> Estabilidad: 0 - Obsoleto: Utilice [`asyncResource.runInAsyncScope()`][] en su lugar.

Llama a todos los callbacks de `before` para notificar que un nuevo contexto de ejecución asincrónico está siendo accedido. Si se realizan llamadas anidadas a `emitBefore()`, la pila de `asyncId`s será rastreada y desenrollada correctamente.

Las llamadas de `before` y `after` deben ser desenrolladas en el mismo orden en el cual son llamadas. De lo contrario, ocurrirá una excepción irrecuperable y se anulará el proceso. Por este motivo, las APIs de `emitBefore` y `emitAfter` se consideran obsoletas. Por favor utilice `runInAsyncScope`, ya que ofrece una alternativa mucha más segura.

#### asyncResource.emitAfter()

<!-- YAML
deprecated: v9.6.0
-->

> Estabilidad: 0 - Obsoleto: Utilice [`asyncResource.runInAsyncScope()`][] en su lugar.

Llama a todos los callbacks `after` . Si se realizaron llamadas anidadas a `emitBefore()`, entonces asegúrese de que el stack se desenrolle correctamente. De otra manera ocurrirá un error.

Si el callback del usuario arroja una excepción, `emitAfter()` será llamado automáticamente para todos los `asyncId`s en el stack si el error es manejado por un dominio o un handler de `'uncaughtException'` .

Las llamadas de `before` y `after` deben ser desenrolladas en el mismo orden en el cual son llamadas. De lo contrario, ocurrirá una excepción irrecuperable y se anulará el proceso. Por este motivo, las APIs de `emitBefore` y `emitAfter` se consideran obsoletas. Por favor, utilice `runInAsyncScope`, ya que ofrece una alternativa mucho más segura.

#### asyncResource.emitDestroy()

Llama a todos los hooks `destroy`. Esto sólo se debe llamar una vez. Ocurrirá un error si se llama más de una vez. Esto **must** se debe llamar manualmente. Si se deja el recurso para que sea recolectado por el GC, entonces los hooks `destroy` nunca serán llamados.

#### asyncResource.asyncId()

* Devuelve: {number} El único `asyncId` asignado al recurso.

#### asyncResource.triggerAsyncId()

* Devuelve: {number} El mismo `triggerAsyncId` que es pasado al constructor de `AsyncResource` .