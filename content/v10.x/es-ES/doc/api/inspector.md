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

También es posible suscribirse únicamente a notificaciones con el método específico:

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

Conecta una sesión al back-end del inspector. Se arrojará una excepción si ya hay una sesión conectada establecida a través del API o por un front-end conectado al puerto WebSocket del Inspector.

### session.post(method\[, params\]\[, callback\])

<!-- YAML
added: v8.0.0
-->

* `method` {string}
* `params` {Object}
* `callback` {Function}

Publica un mensaje al back-end del inspector. Se le notificará a `callback` cuando se reciba una respuesta. `callback` is a function that accepts two optional arguments - error and message-specific result.

```js
session.post('Runtime.evaluate', { expression: '2 + 2' },
             (error, { result }) => console.log(result));
// Output: { type: 'number', value: 4, description: '4' }
```

La última versión del protocolo del inspector V8 está publicada en el [Chrome DevTools Protocol Viewer](https://chromedevtools.github.io/devtools-protocol/v8/).

El inspector de Node soporta todos los dominios del Protocolo DevTools de Chrome declarados por V8. Chrome DevTools Protocol domain provides an interface for interacting with one of the runtime agents used to inspect the application state and listen to the run-time events.

### session.disconnect()

<!-- YAML
added: v8.0.0
-->

Cierra la sesión inmediatamente. All pending message callbacks will be called with an error. Se necesitará llamar a [`session.connect()`] para poder enviar mensajes de nuevo. Las sesiones reconectadas perderán todos los estados del inspector, como los agentes habilitados o los puntos de ruptura configurados.

## Ejemplo de uso

### CPU Profiler

Apart from the debugger, various V8 Profilers are available through the DevTools protocol. Aquí está un ejemplo sencillo que muestra cómo usar el [CPU profiler](https://chromedevtools.github.io/devtools-protocol/v8/Profiler):

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