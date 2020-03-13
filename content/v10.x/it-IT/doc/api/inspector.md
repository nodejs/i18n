# Inspector

<!--introduced_in=v8.0.0-->

> Stability: 1 - Experimental

Il modulo `inspector` fornisce un'API per interagire con l'inspector di V8.

Ci si può accedere utilizzando:

```js
const inspector = require('inspector');
```

## inspector.close()

Disattiva l'inspector. Attende fino a che non ci sono connessioni attive.

## inspector.console

* {Object} An object to send messages to the remote inspector console.

```js
require('inspector').console.log('a message');
```

The inspector console does not have API parity with Node.js console.

## inspector.open([port[, host[, wait]]])

* `port` {number} Porta su cui eseguire il listening per le connessioni dell'inspector. Opzionale. **Default:** ciò che è stato specificato sul CLI.
* `host` {string} Host su cui eseguire il listening per le connessioni dell'inspector. Opzionale. **Default:** ciò che è stato specificato sul CLI.
* `wait` {boolean} Attende fino alla connessione di un client. Opzionale. **Default:** `false`.

Attiva l'inspector sull'host e sulla porta. Equivalente a `node
--inspect=[[host:]port]`, tuttavia può essere fatto a livello di programmazione dopo l'avvio di node.

Se wait è `true`, attenderà fino a quando un client si connette alla porta dell'ispettore e passa il controllo del flusso al debugger client.

See the [security warning](cli.html#inspector_security) regarding the `host` parameter usage.

## inspector.url()

* Returns: {string|undefined}

Restituisce l'URL dell'inspector attivo, o `undefined` se non ce n'è nemmeno uno.

## Class: inspector.Session

L'`inspector.Session` viene utilizzata per inviare messaggi al back-end dell'inspector V8 e per ricevere risposte e notifiche di messaggi.

### Constructor: new inspector.Session()
<!-- YAML
added: v8.0.0
-->

Crea una nuova istanza della classe `inspector.Session`. È necessario connettere la sessione dell'inspector tramite [`session.connect()`][] prima che i messaggi possano essere inviati al backend dell'inspector.

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

Emesso quando si riceve una notifica dell'inspector avente il proprio campo metodo impostato sul valore `<inspector-protocol-method>`.

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

Connette una sessione al back-end dell'inspector. Verrà generata un'eccezione se esiste già una sessione connessa stabilita tramite l'API o da un front-end collegato alla porta WebSocket dell'Inspector.

### session.disconnect()
<!-- YAML
added: v8.0.0
-->

Chiude immediatamente la sessione. Tutti i callback di messaggi in attesa verranno chiamati con un errore. Sarà necessario chiamare [`session.connect()`] per poter inviare nuovamente messaggi. Le sessioni riconnesse perderanno completamente lo stato di inspector, come gli agenti abilitati o i breakpoint configurati.

### session.post(method\[, params\]\[, callback\])
<!-- YAML
added: v8.0.0
-->

* `method` {string}
* `params` {Object}
* `callback` {Function}

Invia un messaggio al back-end dell'inspector. Verrà notificato un `callback` nel momento in cui si riceve una risposta. `callback` è una funzione che accetta due argomenti opzionali: errore e risultato specifico del messaggio.

```js
session.post('Runtime.evaluate', { expression: '2 + 2' },
             (error, { result }) => console.log(result));
// Output: { type: 'number', value: 4, description: '4' }
```

L'ultima versione del protocollo dell'inspector V8 è pubblicata su [Chrome DevTools Protocol Viewer](https://chromedevtools.github.io/devtools-protocol/v8/).

Node.js inspector supports all the Chrome DevTools Protocol domains declared by V8. Il dominio Chrome DevTools Protocol fornisce un'interfaccia per interagire con uno degli agenti runtime utilizzati per controllare lo stato dell'applicazione e sottoporre al listening gli eventi run-time.

## Esempio di utilizzo

A parte il debugger, vari Profiler V8 sono disponibili tramite il protocollo DevTools.

### CPU Profiler

Here's an example showing how to use the [CPU Profiler](https://chromedevtools.github.io/devtools-protocol/v8/Profiler):

```js
const inspector = require('inspector');
const fs = require('fs');
const session = new inspector.Session();
session.connect();

session.post('Profiler.enable', () => {
  session.post('Profiler.start', () => {
    // invoke business logic under measurement here...

    // qualche tempo dopo...
    session.post('Profiler.stop', (err, { profile }) => {
      // write profile to disk, upload, etc.
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
