# Inspector

<!--introduced_in=v8.0.0-->

> Estabilidad: 1 - Experimental

El módulo `inspector` expone una API para interactuar con el inspector de V8.

Puede ser accedido utilizando:

```js
const inspector = require('inspector');
```

## inspector.open([port[, host[, wait]]])

* `port` {number} Puerto en el cual escuchar para las conexiónes de inspector. Opcional. **Predeterminado:** lo que fue especificado en la CLI.
* `host` {string} Huésped en el cual escuchar para las conexiónes de inspector. Opcional. **Predeterminado:** lo que fue especificado en la CLI.
* `wait` {boolean} Bloquear hasta que un cliente se haya conectado. Opcional. **Predeterminado:** `false`.

Active el inspector en el host y en el puerto. Equivalente a `node
--inspect=[[host:]port]`, pero puede hacerse mediante programación después que el node haya iniciado.

Si la espera es `true`, se bloqueará hasta que un cliente se haya conectado al puerto de inspección y el control de flujo haya sido pasado al cliente depurador.

### inspector.close()

Desactivar el inspector. Bloquea hasta que no hayan conexiones activas.

### inspector.url()

* Devuelve: {string|undefined}

Devuelve el URL del inspector activo o `undefined` sin no hay ninguno.

## Clase: inspector.Session

La `inspector.Session` es utilizada para enviar mensajes al back-end del inspector V8 y para recibir respuestas y notificaciones de mensajes.

### Constructor: nueva inspector.Session()

<!-- YAML
added: v8.0.0
-->

Crea una nueva instancia de la clase `inspector.Session`. La sesión de inspector necesita ser conectada a través de [`session.connect()`][] antes de que los mensajes puedan ser enviados al backend del inspector.

`inspector.Session` is an [`EventEmitter`][] with the following events:

### Event: 'inspectorNotification'

<!-- YAML
added: v8.0.0
-->

* {Object} El objeto de mensaje de notificación

Emitido cuando se recibe cualquier notificación del Inspector V8.

```js
session.on('inspectorNotification', (message) => console.log(message.method));
// Debugger.paused
// Debugger.resumed
```

También es posible suscribirse únicamente a notificaciones con el método especifico:

### Event: &lt;inspector-protocol-method&gt;

<!-- YAML
added: v8.0.0
-->

* {Object} El objeto de mensaje de notificación

Emitido cuando se recibe una notificación del inspector que tiene su campo de método establecido al valor `<inspector-protocol-method>`.

El siguiente snippet instala un listener en el evento [`'Debugger.paused'`][] e imprime la razón para la suspensión del programa cada vez que se suspende la ejecución del programa (a través de puntos de ruptura, por ejemplo):

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

Connects a session to the inspector back-end. An exception will be thrown if there is already a connected session established either through the API or by a front-end connected to the Inspector WebSocket port.

### session.post(method\[, params\]\[, callback\])

<!-- YAML
added: v8.0.0
-->

* `method` {string}
* `params` {Object}
* `callback` {Function}

Posts a message to the inspector back-end. `callback` will be notified when a response is received. `callback` is a function that accepts two optional arguments - error and message-specific result.

```js
session.post('Runtime.evaluate', { expression: '2 + 2' },
             (error, { result }) => console.log(result));
// Output: { type: 'number', value: 4, description: '4' }
```

The latest version of the V8 inspector protocol is published on the [Chrome DevTools Protocol Viewer](https://chromedevtools.github.io/devtools-protocol/v8/).

Node inspector supports all the Chrome DevTools Protocol domains declared by V8. Chrome DevTools Protocol domain provides an interface for interacting with one of the runtime agents used to inspect the application state and listen to the run-time events.

### session.disconnect()

<!-- YAML
added: v8.0.0
-->

Immediately close the session. All pending message callbacks will be called with an error. [`session.connect()`] will need to be called to be able to send messages again. Reconnected session will lose all inspector state, such as enabled agents or configured breakpoints.

## Example usage

### CPU Profiler

Apart from the debugger, various V8 Profilers are available through the DevTools protocol. Here's a simple example showing how to use the [CPU profiler](https://chromedevtools.github.io/devtools-protocol/v8/Profiler):

```js
const inspector = require('inspector');
const fs = require('fs');
const session = new inspector.Session();
session.connect();

session.post('Profiler.enable', () => {
  session.post('Profiler.start', () => {
    // invoke business logic under measurement here...

    // some time later...
    session.post('Profiler.stop', (err, { profile }) => {
      // write profile to disk, upload, etc.
      if (!err) {
        fs.writeFileSync('./profile.cpuprofile', JSON.stringify(profile));
      }
    });
  });
});
```