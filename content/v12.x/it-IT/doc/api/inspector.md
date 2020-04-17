# Inspector

<!--introduced_in=v8.0.0-->

> Stabilità: 1 - Sperimentale

Il modulo `inspector` fornisce un'API per interagire con l'inspector di V8.

Ci si può accedere utilizzando:

```js
const inspector = require('inspector');
```

## `inspector.close()`

Disattiva l'inspector. Attende fino a che non ci sono connessioni attive.

## `inspector.console`

* {Object} An object to send messages to the remote inspector console.

```js
require('inspector').console.log('a message');
```

The inspector console does not have API parity with Node.js console.

## `inspector.open([port[, host[, wait]]])`

* `port` {number} Porta su cui eseguire il listening per le connessioni dell'inspector. Opzionale. **Default:** what was specified on the CLI.
* `host` {string} Host su cui eseguire il listening per le connessioni dell'inspector. Opzionale. **Default:** what was specified on the CLI.
* `wait` {boolean} Attende fino alla connessione di un client. Opzionale. **Default:** `false`.

Attiva l'inspector sull'host e sulla porta. Equivalent to `node
--inspect=[[host:]port]`, but can be done programmatically after node has started.

If wait is `true`, will block until a client has connected to the inspect port and flow control has been passed to the debugger client.

See the [security warning](cli.html#inspector_security) regarding the `host` parameter usage.

## `inspector.url()`

* Restituisce: {string|undefined}

Restituisce l'URL dell'inspector attivo, o `undefined` se non ce n'è nemmeno uno.

```console
$ node --inspect -p 'inspector.url()'
Debugger listening on ws://127.0.0.1:9229/166e272e-7a30-4d09-97ce-f1c012b43c34
For help see https://nodejs.org/en/docs/inspector
ws://127.0.0.1:9229/166e272e-7a30-4d09-97ce-f1c012b43c34

$ node --inspect=localhost:3000 -p 'inspector.url()'
Debugger listening on ws://localhost:3000/51cf8d0e-3c36-4c59-8efd-54519839e56a
For help see https://nodejs.org/en/docs/inspector
ws://localhost:3000/51cf8d0e-3c36-4c59-8efd-54519839e56a

$ node -p 'inspector.url()'
undefined
```

## `inspector.waitForDebugger()`
<!-- YAML
added: v12.7.0
-->

Blocks until a client (existing or connected later) has sent `Runtime.runIfWaitingForDebugger` command.

An exception will be thrown if there is no active inspector.

## Class: `inspector.Session`

* Estendendo: {EventEmitter}

The `inspector.Session` is used for dispatching messages to the V8 inspector back-end and receiving message responses and notifications.

### Constructor: `new inspector.Session()`
<!-- YAML
added: v8.0.0
-->

Crea una nuova istanza della classe `inspector.Session`. The inspector session needs to be connected through [`session.connect()`][] before the messages can be dispatched to the inspector backend.

### Event: `'inspectorNotification'`
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

### Event: `<inspector-protocol-method>`;
<!-- YAML
added: v8.0.0
-->

* {Object} L'object del messaggio di notifica

Emitted when an inspector notification is received that has its method field set to the `<inspector-protocol-method>` value.

The following snippet installs a listener on the [`'Debugger.paused'`][] event, and prints the reason for program suspension whenever program execution is suspended (through breakpoints, for example):

```js
session.on('Debugger.paused', ({ params }) => {
  console.log(params.hitBreakpoints);
});
// [ '/the/file/that/has/the/breakpoint.js:11:0' ]
```

### `session.connect()`
<!-- YAML
added: v8.0.0
-->

Connette una sessione al back-end dell'inspector.

### `session.connectToMainThread()`
<!-- YAML
added: v12.11.0
-->

Connects a session to the main thread inspector back-end. An exception will be thrown if this API was not called on a Worker thread.

### `session.disconnect()`
<!-- YAML
added: v8.0.0
-->

Chiude immediatamente la sessione. All pending message callbacks will be called with an error. [`session.connect()`][] will need to be called to be able to send messages again. Reconnected session will lose all inspector state, such as enabled agents or configured breakpoints.

### `session.post(method[, params][, callback])`
<!-- YAML
added: v8.0.0
-->

* `method` {string}
* `params` {Object}
* `callback` {Function}

Invia un messaggio al back-end dell'inspector. `callback` will be notified when a response is received. `callback` is a function that accepts two optional arguments: error and message-specific result.

```js
session.post('Runtime.evaluate', { expression: '2 + 2' },
             (error, { result }) => console.log(result));
// Output: { type: 'number', value: 4, description: '4' }
```

The latest version of the V8 inspector protocol is published on the [Chrome DevTools Protocol Viewer](https://chromedevtools.github.io/devtools-protocol/v8/).

Node.js inspector supports all the Chrome DevTools Protocol domains declared by V8. Chrome DevTools Protocol domain provides an interface for interacting with one of the runtime agents used to inspect the application state and listen to the run-time events.

## Esempio di utilizzo

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
    // Invoke business logic under measurement here...

    // qualche tempo dopo...
    session.post('Profiler.stop', (err, { profile }) => {
      // Write profile to disk, upload, etc.
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
  console.log('HeapProfiler.takeHeapSnapshot done:', err, r);
  session.disconnect();
  fs.closeSync(fd);
});
```
