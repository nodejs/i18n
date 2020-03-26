# Inspector

<!--introduced_in=v8.0.0-->

> Estabilidad: 1 - Experimental

El módulo `inspector` proporciona una API para interactuar con el inspector de V8.

Puede ser accedido utilizando:

```js
const inspector = require('inspector');
```

## inspector.close()

Desactiva el inspector. Se bloquea hasta que no hayan conexiones activas.

## inspector.console

* {Object} An object to send messages to the remote inspector console.

```js
require('inspector').console.log('a message');
```

The inspector console does not have API parity with Node.js console.

## inspector.open([port[, host[, wait]]])

* `port` {number} Puerto en el cual escuchar para las conexiónes de inspector. Opcional. **Predeterminado:** lo que fue especificado en la CLI.
* `host` {string} Huésped en el cual escuchar para las conexiónes de inspector. Opcional. **Predeterminado:** lo que fue especificado en la CLI.
* `wait` {boolean} Bloquear hasta que un cliente se haya conectado. Opcional. **Predeterminado:** `false`.

Active el inspector en el host y en el puerto. Equivalent to `node
--inspect=[[host:]port]`, but can be done programmatically after node has started.

If wait is `true`, will block until a client has connected to the inspect port and flow control has been passed to the debugger client.

See the [security warning](cli.html#inspector_security) regarding the `host` parameter usage.

## inspector.url()

* Devuelve: {string|undefined}

Devuelve el URL del inspector activo o `undefined` si no hay ninguno.

## Clase: inspector.Session

The `inspector.Session` is used for dispatching messages to the V8 inspector back-end and receiving message responses and notifications.

### Constructor: nueva inspector.Session()

<!-- YAML
added: v8.0.0
-->

Crea una nueva instancia de la clase `inspector.Session`. The inspector session needs to be connected through [`session.connect()`][] before the messages can be dispatched to the inspector backend.

`inspector.Session` es un [`EventEmitter`][] con los siguientes eventos:

### Evento: 'inspectorNotification'

<!-- YAML
added: v8.0.0
-->

* {Object} El objeto de mensaje de notificación

Emitido cuando se recibe cualquier notificación del inspector de V8.

```js
session.on('inspectorNotification', (message) => console.log(message.method));
// Debugger.paused
// Debugger.resumed
```

También es posible suscribirse únicamente a notificaciones con método específico:

### Evento: &lt;inspector-protocol-method&gt;

<!-- YAML
added: v8.0.0
-->

* {Object} El objeto de mensaje de notificación

Emitted when an inspector notification is received that has its method field set to the `<inspector-protocol-method>` value.

The following snippet installs a listener on the [`'Debugger.paused'`][] event, and prints the reason for program suspension whenever program execution is suspended (through breakpoints, for example):

```js
session.on('Debugger.paused', ({ params }) => {
  console.log(params.hitBreakpoints);
});
// [ '/the/file/that/has/the/breakpoint.js:11:0' ]
```

### session.connect()

<!-- YAML
added: v8.0.0
-->

Conecta una sesión al back-end del inspector. An exception will be thrown if there is already a connected session established either through the API or by a front-end connected to the Inspector WebSocket port.

### session.disconnect()

<!-- YAML
added: v8.0.0
-->

Cierra la sesión inmediatamente. All pending message callbacks will be called with an error. [`session.connect()`] will need to be called to be able to send messages again. Reconnected session will lose all inspector state, such as enabled agents or configured breakpoints.

### session.post(method\[, params\]\[, callback\])

<!-- YAML
added: v8.0.0
-->

* `method` {string}
* `params` {Object}
* `callback` {Function}

Publica un mensaje al back-end del inspector. `callback` will be notified when a response is received. `callback` is a function that accepts two optional arguments - error and message-specific result.

```js
session.post('Runtime.evaluate', { expression: '2 + 2' },
             (error, { result }) => console.log(result));
// Salida: { type: 'number', value: 4, description: '4' }
```

The latest version of the V8 inspector protocol is published on the [Chrome DevTools Protocol Viewer](https://chromedevtools.github.io/devtools-protocol/v8/).

Node.js inspector supports all the Chrome DevTools Protocol domains declared by V8. Chrome DevTools Protocol domain provides an interface for interacting with one of the runtime agents used to inspect the application state and listen to the run-time events.

## Ejemplo de uso

Apart from the debugger, various V8 Profilers are available through the DevTools protocol.

### CPU Profiler

Here's an example showing how to use the [CPU Profiler](https://chromedevtools.github.io/devtools-protocol/v8/Profiler):

```js
const inspector = require('inspector');
const fs = require('fs');
const session = new inspector.Session();
session.connect();

session.post('Profiler.enable', () => {
  session.post('Profiler.start', () => {
    // invoque la lógica de negocio bajo medida aquí...

    // un tiempo después...
    session.post('Profiler.stop', (err, { profile }) => {
      // escribe el perfil al disco, subida, etc.
      if (!err) {
        fs.writeFileSync('./profile.cpuprofile', JSON.stringify(profile));
      }
    });
  });
});
```

### Heap Profiler

Here's an example showing how to use the [Heap Profiler](https://chromedevtools.github.io/devtools-protocol/v8/HeapProfiler):

```js
const inspector = require('inspector');
const fs = require('fs');
const session = new inspector.Session();

const fd = fs.openSync('profile.heapsnapshot', 'w');

session.connect();

session.on('HeapProfiler.addHeapSnapshotChunk', (m) => {
  fs.writeSync(fd, m.params.chunk);
});

session.post('HeapProfiler.takeHeapSnapshot', null, (err, r) => {
  console.log('Runtime.takeHeapSnapshot done:', err, r);
  session.disconnect();
  fs.closeSync(fd);
});
```