# Inspector

<!--introduced_in=v8.0.0-->

> Stability: 1 - Experimental

Il modulo `inspector` fornisce un'API per interagire con l'inspector di V8.

Ci si può accedere utilizzando:

```js
const inspector = require('inspector');
```

## inspector.open([port[, host[, wait]]])

* `port` {number} Porta su cui eseguire il listening per le connessioni dell'inspector. Opzionale. **Default:** ciò che è stato specificato sul CLI.
* `host` {string} Host su cui eseguire il listening per le connessioni dell'inspector. Opzionale. **Default:** ciò che è stato specificato sul CLI.
* `wait` {boolean} Attende fino alla connessione di un client. Opzionale. **Default:** `false`.

Attiva l'inspector sull'host e sulla porta. Equivalent to `node
--inspect=[[host:]port]`, but can be done programmatically after node has started.

If wait is `true`, will block until a client has connected to the inspect port and flow control has been passed to the debugger client.

### inspector.close()

Disattiva l'inspector. Attende fino a che non ci sono connessioni attive.

### inspector.url()

Restituisce l'URL dell'inspector attivo, o `undefined` se non ce n'è nemmeno uno.

## Class: inspector.Session

The `inspector.Session` is used for dispatching messages to the V8 inspector back-end and receiving message responses and notifications.

### Constructor: new inspector.Session()

<!-- YAML
added: v8.0.0
-->

Crea una nuova istanza della classe `inspector.Session`. The inspector session needs to be connected through [`session.connect()`][] before the messages can be dispatched to the inspector backend.

`inspector.Session` è un [`EventEmitter`][] con i seguenti eventi:

### Event: 'inspectorNotification'

<!-- YAML
added: v8.0.0
-->

* {Object} L'object del messaggio di notifica

Emesso quando si riceve una qualsiasi notifica dall'ispettore V8.

```js
session.on('inspectorNotification', (message) => console.log(message.method));
// Debugger.paused
// Debugger.resumed
```

Inoltre è possibile sottoscrivere esclusivamente notifiche con metodo specifico:

### Event: &lt;inspector-protocol-method&gt;

<!-- YAML
added: v8.0.0
-->

* {Object} L'object del messaggio di notifica

Emitted when an inspector notification is received that has its method field set to the `<inspector-protocol-method>` value.

The following snippet installs a listener on the [`Debugger.paused`][] event, and prints the reason for program suspension whenever program execution is suspended (through breakpoints, for example):

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

Connette una sessione al back-end dell'inspector. An exception will be thrown if there is already a connected session established either through the API or by a front-end connected to the Inspector WebSocket port.

### session.post(method\[, params\]\[, callback\])

<!-- YAML
added: v8.0.0
-->

* method {string}
* params {Object}
* callback {Function}

Invia un messaggio al back-end dell'inspector. `callback` will be notified when a response is received. `callback` is a function that accepts two optional arguments - error and message-specific result.

```js
session.post('Runtime.evaluate', { expression: '2 + 2' },
             (error, { result }) => console.log(result));
// Output: { type: 'number', value: 4, description: '4' }
```

The latest version of the V8 inspector protocol is published on the [Chrome DevTools Protocol Viewer](https://chromedevtools.github.io/devtools-protocol/v8/).

Node.js inspector supports all the Chrome DevTools Protocol domains declared by V8. Chrome DevTools Protocol domain provides an interface for interacting with one of the runtime agents used to inspect the application state and listen to the run-time events.

### session.disconnect()

<!-- YAML
added: v8.0.0
-->

Chiude immediatamente la sessione. All pending message callbacks will be called with an error. [`session.connect()`] will need to be called to be able to send messages again. Reconnected session will lose all inspector state, such as enabled agents or configured breakpoints.

## Esempio di utilizzo

### CPU Profiler

Apart from the debugger, various V8 Profilers are available through the DevTools protocol. Ecco un semplice esempio che mostra come utilizzare il [Profiler della CPU](https://chromedevtools.github.io/devtools-protocol/v8/Profiler):

```js
const inspector = require('inspector');

const session = new inspector.Session();
session.connect();

session.post('Profiler.enable', () => {
  session.post('Profiler.start', () => {
    // invoke business logic under measurement here...

    // qualche tempo dopo...
    session.post('Profiler.stop', ({ profile }) => {
      // write profile to disk, upload, etc.
    });
  });
});
```