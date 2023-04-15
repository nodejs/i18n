# Cluster

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Una singola istanza di Node.js viene eseguita in un singolo thread. Per sfruttare i sistemi multi-core, a volte l'utente ha la necessità di avviare un cluster di processi Node.js per gestirne il carico.

The cluster module allows easy creation of child processes that all share server ports.

```js
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // I Fork Worker.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  // Gli Worker possono condividere qualsiasi connessione TCP
  // In questo caso è un server HTTP
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end('hello world\n');
  }).listen(8000);

  console.log(`Worker ${process.pid} started`);
}
```

Adesso l'esecuzione di Node.js condividerà la porta 8000 tra gli worker:

```console
$ node server.js
Master 3596 is running
Worker 4324 started
Worker 4520 started
Worker 6056 started
Worker 5644 started
```

On Windows, it is not yet possible to set up a named pipe server in a worker.

## Come Funziona

<!--type=misc-->

I processi worker vengono generati utilizzando il metodo [`child_process.fork()`][], in modo che possano comunicare con il parent tramite IPC e passare i server handle avanti e indietro.

Il modulo cluster supporta due metodi di distribuzione delle connessioni in entrata.

Il primo (quello predefinito su tutte le piattaforme eccetto Windows), è l'approccio round-robin, in cui il processo master esegue il listening su una porta, accetta nuove connessioni e le distribuisce tra gli worker in modalità round-robin, con intelligenza integrata per evitare il sovraccarico del processo di un worker.

Il secondo approccio consiste nel processo master che crea il listen socket e lo invia agli worker interessati. Gli worker accettano quindi direttamente le connessioni in entrata.

Il secondo approccio dovrebbe, in teoria, fornire le migliori prestazioni. Tuttavia in pratica, la distribuzione tende ad essere molto sbilanciata a causa dei capricci dello scheduler del sistema operativo. Sono stati osservati carichi nei quali oltre il 70% di tutte le connessioni è finito in soli due processi, su un totale di otto.

Poiché `server.listen()` distribuisce la maggior parte del lavoro al processo master, ci sono tre casi in cui il comportamento tra un normale processo Node.js e un cluster worker è diverso:

1. `server.listen({fd: 7})` Because the message is passed to the master, file descriptor 7 **in the parent** will be listened on, and the handle passed to the worker, rather than listening to the worker's idea of what the number 7 file descriptor references.
2. `server.listen(handle)` Listening on handles explicitly will cause the worker to use the supplied handle, rather than talk to the master process.
3. `server.listen(0)` Normally, this will cause servers to listen on a random port. However, in a cluster, each worker will receive the same "random" port each time they do `listen(0)`. In essence, the port is random the first time, but predictable thereafter. To listen on a unique port, generate a port number based on the cluster worker ID.

Node.js non fornisce la logica di routing. It is, therefore important to design an application such that it does not rely too heavily on in-memory data objects for things like sessions and login.

Because workers are all separate processes, they can be killed or re-spawned depending on a program's needs, without affecting other workers. Il server continuerà ad accettare connessioni finché ci saranno ancora degli worker in funzione. Se non c'è più nessun worker in funzione, le connessioni esistenti verranno eliminate e le nuove connessioni saranno rifiutate. Node.js does not automatically manage the number of workers, however. It is the application's responsibility to manage the worker pool based on its own needs.

Sebbene il modulo `cluster` sia usato principalmente nel networking, può essere utilizzato anche in altri casi che richiedono processi worker.

## Class: `Worker`
<!-- YAML
added: v0.7.0
-->

* Estendendo: {EventEmitter}

Un `Worker` object contiene tutte le informazioni pubbliche e il metodo riguardanti un worker. Nel master può essere ottenuto utilizzando `cluster.workers`. In un worker può essere ottenuto utilizzando `cluster.worker`.

### Event: `'disconnect'`
<!-- YAML
added: v0.7.7
-->

Simile all'evento `cluster.on('disconnect')`, ma specifico per questo worker.

```js
cluster.fork().on('disconnect', () => {
  // Il worker si è disconnesso
});
```

### Event: `'error'`
<!-- YAML
added: v0.7.3
-->

Questo evento è uguale a quello fornito da [`child_process.fork()`][].

All'interno di un worker, potrebbe essere utilizzato anche `process.on('error')`.

### Event: `'exit'`
<!-- YAML
added: v0.11.2
-->

* `code` {number} Il valore di uscita, se esce normalmente.
* `signal` {string} Il nome del segnale (ad es. `'SIGHUP'`) che ha causato l'arresto del processo.

Simile all'evento `cluster.on('exit')`, ma specifico per questo worker.

```js
const worker = cluster.fork();
worker.on('exit', (code, signal) => {
  if (signal) {
    console.log(`worker was killed by signal: ${signal}`);
  } else if (code !== 0) {
    console.log(`worker exited with error code: ${code}`);
  } else {
    console.log('worker success!');
  }
});
```

### Event: `'listening'`
<!-- YAML
added: v0.7.0
-->

* `address` {Object}

Simile all'evento `cluster.on('listening')`, ma specifico per questo worker.

```js
cluster.fork().on('listening', (address) => {
  // Il worker sta ascoltando (listening)
});
```

Non viene emesso all'interno del worker.

### Event: `'message'`
<!-- YAML
added: v0.7.0
-->

* `message` {Object}
* `handle` {undefined|Object}

Simile all'evento `'message'` di `cluster`, ma specifico per questo worker.

All'interno di un worker, potrebbe essere utilizzato anche `process.on('message')`.

Vedi [`process` event: `'message'`][].

Here is an example using the message system. It keeps a count in the master process of the number of HTTP requests received by the workers:

```js
const cluster = require('cluster');
const http = require('http');

if (cluster.isMaster) {

  // Tieni traccia delle richieste http
  let numReqs = 0;
  setInterval(() => {
    console.log(`numReqs = ${numReqs}`);
  }, 1000);

  // Conta le richieste
  function messageHandler(msg) {
    if (msg.cmd && msg.cmd === 'notifyRequest') {
      numReqs += 1;
    }
  }

  // Avvia gli worker ed ascolta (listening) i messaggi che contengono
notifyRequest
  const numCPUs = require('os').cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  for (const id in cluster.workers) {
    cluster.workers[id].on('message', messageHandler);
  }

} else {

  // I processi worker hanno un server http.
  http.Server((req, res) => {
    res.writeHead(200);
    res.end('hello world\n');

    // Notify master about the request
    process.send({ cmd: 'notifyRequest' });
  }).listen(8000);
}
```

### Event: `'online'`
<!-- YAML
added: v0.7.0
-->

Simile all'evento `cluster.on('online')`, ma specifico per questo worker.

```js
cluster.fork().on('online', () => {
  // Il worker è online
});
```

Non viene emesso all'interno del worker.

### `worker.disconnect()`
<!-- YAML
added: v0.7.7
changes:
  - version: v7.3.0
    pr-url: https://github.com/nodejs/node/pull/10019
    description: This method now returns a reference to `worker`.
-->

* Restituisce: {cluster.Worker} Un riferimento a `worker`.

In a worker, this function will close all servers, wait for the `'close'` event on those servers, and then disconnect the IPC channel.

Nel master, viene inviato un messaggio interno al worker che lo porta a chiamare `.disconnect()` su se stesso.

Fa sì che venga impostato `.exitedAfterDisconnect`.

After a server is closed, it will no longer accept new connections, but connections may be accepted by any other listening worker. Le connessioni esistenti avranno il permesso di chiudersi come al solito. When no more connections exist, see [`server.close()`][], the IPC channel to the worker will close allowing it to die gracefully.

The above applies *only* to server connections, client connections are not automatically closed by workers, and disconnect does not wait for them to close before exiting.

In a worker, `process.disconnect` exists, but it is not this function; it is [`disconnect()`][].

Poiché le connessioni ai server di lunga durata potrebbero impedire la disconnessione degli worker, potrebbe essere utile inviare un messaggio, così da intraprendere azioni specifiche per chiuderle. Potrebbe anche essere utile implementare un timeout, il quale arresta un worker se l'evento `'disconnect'` non è stato emesso dopo un determinato lasso di tempo.

```js
if (cluster.isMaster) {
  const worker = cluster.fork();
  let timeout;

  worker.on('listening', (address) => {
    worker.send('shutdown');
    worker.disconnect();
    timeout = setTimeout(() => {
      worker.kill();
    }, 2000);
  });

  worker.on('disconnect', () => {
    clearTimeout(timeout);
  });

} else if (cluster.isWorker) {
  const net = require('net');
  const server = net.createServer((socket) => {
    // Connections never end
  });

  server.listen(8000);

  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      // Initiate graceful close of any connections to server
    }
  });
}
```

### `worker.exitedAfterDisconnect`
<!-- YAML
added: v6.0.0
-->

* {boolean}

This property is `true` if the worker exited due to `.kill()` or `.disconnect()`. If the worker exited any other way, it is `false`. If the worker has not exited, it is `undefined`.

The boolean [`worker.exitedAfterDisconnect`][] allows distinguishing between voluntary and accidental exit, the master may choose not to respawn a worker based on this value.

```js
cluster.on('exit', (worker, code, signal) => {
  if (worker.exitedAfterDisconnect === true) {
    console.log('Oh, it was just voluntary – no need to worry');
  }
});

// arresta il worker
worker.kill();
```

### `worker.id`
<!-- YAML
added: v0.8.0
-->

* {number}

Ad ogni nuovo worker viene assegnato un ID univoco personale, questo ID è memorizzato in `id`.

While a worker is alive, this is the key that indexes it in `cluster.workers`.

### `worker.isConnected()`
<!-- YAML
added: v0.11.14
-->

This function returns `true` if the worker is connected to its master via its IPC channel, `false` otherwise. A worker is connected to its master after it has been created. Viene disconnesso dopo aver emesso l'evento `'disconnect'`.

### `worker.isDead()`
<!-- YAML
added: v0.11.14
-->

Questa funzione restituisce `true` se il processo del worker si è concluso (a causa dell'uscita o della segnalazione). In caso contrario, restituisce `false`.

```js
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // I Fork Worker.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('fork', (worker) => {
    console.log('worker is dead:', worker.isDead());
  });

  cluster.on('exit', (worker, code, signal) => {
    console.log('worker is dead:', worker.isDead());
  });
} else {
  // Workers can share any TCP connection. In this case, it is an HTTP server.
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`Current process\n ${process.pid}`);
    process.kill(process.pid);
  }).listen(8000);
}
```

### `worker.kill([signal='SIGTERM'])`
<!-- YAML
added: v0.9.12
-->

* `signal` {string} Nome del segnale kill da inviare al processo worker.

Questa funzione arresta il worker. Nel master, lo fa disconnettendo `worker.process`, e una volta disconnesso, lo arresta con `signal`. Nel worker, lo fa disconnettendo il canale ed uscendo con il codice `0`.

Because `kill()` attempts to gracefully disconnect the worker process, it is susceptible to waiting indefinitely for the disconnect to complete. For example, if the worker enters an infinite loop, a graceful disconnect will never occur. If the graceful disconnect behavior is not needed, use `worker.process.kill()`.

Fa sì che venga impostato `.exitedAfterDisconnect`.

Questo metodo è conosciuto anche come `worker.destroy()` per l'utilizzo retrocompatibile.

In a worker, `process.kill()` exists, but it is not this function; it is [`kill()`][].

### `worker.process`
<!-- YAML
added: v0.7.0
-->

* {ChildProcess}

Tutti gli worker vengono creati utilizzando [`child_process.fork()`][], l'object restituito da questa funzione è memorizzato come `.process`. In un worker, viene memorizzato il `process` globale.

Vedi: [Modulo Child Process](child_process.html#child_process_child_process_fork_modulepath_args_options).

Workers will call `process.exit(0)` if the `'disconnect'` event occurs on `process` and `.exitedAfterDisconnect` is not `true`. Questo previene la disconnessione accidentale.

### `worker.send(message[, sendHandle[, options]][, callback])`
<!-- YAML
added: v0.7.0
changes:
  - version: v4.0.0
    pr-url: https://github.com/nodejs/node/pull/2620
    description: The `callback` parameter is supported now.
-->

* `message` {Object}
* `sendHandle` {Handle}
* `options` {Object} The `options` argument, if present, is an object used to parameterize the sending of certain types of handles. `options` supports the following properties:
  * `keepOpen` {boolean} A value that can be used when passing instances of `net.Socket`. Quando è `true`, il socket viene mantenuto aperto nel processo di invio. **Default:** `false`.
* `callback` {Function}
* Restituisce: {boolean}

Invia un messaggio ad un worker o un master, eventualmente con un handle.

Nel master invia un messaggio ad un specifico worker. E' identico a [`ChildProcess.send()`][].

In un worker invia un messaggio al master. E' identico a `process.send()`.

Questo esempio restituirà tutti i messaggi del master:

```js
if (cluster.isMaster) {
  const worker = cluster.fork();
  worker.send('hi there');

} else if (cluster.isWorker) {
  process.on('message', (msg) => {
    process.send(msg);
  });
}
```

## Event: `'disconnect'`
<!-- YAML
added: v0.7.9
-->

* `worker` {cluster.Worker}

Emesso dopo che il canale IPC del worker è stato disconnesso. This can occur when a worker exits gracefully, is killed, or is disconnected manually (such as with `worker.disconnect()`).

Potrebbe esserci un ritardo tra gli eventi `'disconnect'` ed `'exit'`. These events can be used to detect if the process is stuck in a cleanup or if there are long-living connections.

```js
cluster.on('disconnect', (worker) => {
  console.log(`The worker #${worker.id} has disconnected`);
});
```

## Event: `'exit'`
<!-- YAML
added: v0.7.9
-->

* `worker` {cluster.Worker}
* `code` {number} Il valore di uscita, se esce normalmente.
* `signal` {string} Il nome del segnale (ad es. `'SIGHUP'`) che ha causato l'arresto del processo.

Quando uno degli worker subisce l'arresto, il modulo cluster emetterà l'evento `'exit'`.

This can be used to restart the worker by calling [`.fork()`][] again.

```js
cluster.on('exit', (worker, code, signal) => {
  console.log('worker %d died (%s). restarting...',
              worker.process.pid, signal || code);
  cluster.fork();
});
```

Vedi [`child_process` event: `'exit'`][].

## Event: `'fork'`
<!-- YAML
added: v0.7.0
-->

* `worker` {cluster.Worker}

Quando un nuovo worker viene sottoposto al fork, il modulo cluster emetterà un evento `'fork'`. Questo può essere usato per registrare l'attività del worker e per creare un timeout personalizzato.

```js
const timeouts = [];
function errorMsg() {
  console.error('Something must be wrong with the connection ...');
}

cluster.on('fork', (worker) => {
  timeouts[worker.id] = setTimeout(errorMsg, 2000);
});
cluster.on('listening', (worker, address) => {
  clearTimeout(timeouts[worker.id]);
});
cluster.on('exit', (worker, code, signal) => {
  clearTimeout(timeouts[worker.id]);
  errorMsg();
});
```

## Event: `'listening'`
<!-- YAML
added: v0.7.0
-->

* `worker` {cluster.Worker}
* `address` {Object}

After calling `listen()` from a worker, when the `'listening'` event is emitted on the server a `'listening'` event will also be emitted on `cluster` in the master.

The event handler is executed with two arguments, the `worker` contains the worker object and the `address` object contains the following connection properties: `address`, `port` and `addressType`. This is very useful if the worker is listening on more than one address.

```js
cluster.on('listening', (worker, address) => {
  console.log(
    `A worker is now connected to ${address.address}:${address.port}`);
});
```

L'`addressType` può essere:

* `4` (TCPv4)
* `6` (TCPv6)
* `-1` (Unix domain socket)
* `'udp4'` oppure `'udp6'` (UDP v4 oppure v6)

## Event: `'message'`
<!-- YAML
added: v2.5.0
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5361
    description: The `worker` parameter is passed now; see below for details.
-->

* `worker` {cluster.Worker}
* `message` {Object}
* `handle` {undefined|Object}

Emesso quando il cluster master riceve un messaggio da qualsiasi worker.

Vedi [`child_process` event: `'message'`][].

## Event: `'online'`
<!-- YAML
added: v0.7.0
-->

* `worker` {cluster.Worker}

Dopo aver ricavato il nuovo worker tramite il fork, il worker dovrebbe rispondere con un messaggio online. Quando il master riceverà un messaggio online, emetterà questo evento. The difference between `'fork'` and `'online'` is that fork is emitted when the master forks a worker, and `'online'` is emitted when the worker is running.

```js
cluster.on('online', (worker) => {
  console.log('Yay, the worker responded after it was forked');
});
```

## Event: `'setup'`
<!-- YAML
added: v0.7.1
-->

* `settings` {Object}

Emitted every time [`.setupMaster()`][] is called.

The `settings` object is the `cluster.settings` object at the time [`.setupMaster()`][] was called and is advisory only, since multiple calls to [`.setupMaster()`][] can be made in a single tick.

Se l'accuratezza ha un ruolo importante, utilizza `cluster.settings`.

## `cluster.disconnect([callback])`
<!-- YAML
added: v0.7.7
-->

* `callback` {Function} Chiamato quando tutti gli worker sono disconnessi e quando gli handle sono chiusi.

Chiama `.disconnect()` su ciascun worker all'interno di `cluster.workers`.

Quando gli worker vengono disconnessi, tutti gli handle interni verranno chiusi, permettendo il lento arresto del processo master se non c'è nessun altro evento in attesa.

The method takes an optional callback argument which will be called when finished.

Questo può essere chiamato solo dal processo master.

## `cluster.fork([env])`
<!-- YAML
added: v0.6.0
-->

* `env` {Object} Coppie key/value da aggiungere all'ambiente del processo worker.
* Restituisce: {cluster.Worker}

Genera un nuovo processo worker.

Questo può essere chiamato solo dal processo master.

## `cluster.isMaster`
<!-- YAML
added: v0.8.1
-->

* {boolean}

Vero se il processo è un master. Questo è determinato da `process.env.NODE_UNIQUE_ID`. Se `process.env.NODE_UNIQUE_ID` è undefined (indefinito), allora `isMaster` è `true`.

## `cluster.isWorker`
<!-- YAML
added: v0.6.0
-->

* {boolean}

Vero se il processo non è un master (è la negazione di `cluster.isMaster`).

## `cluster.schedulingPolicy`
<!-- YAML
added: v0.11.2
-->

La politica di scheduling, `cluster.SCHED_RR` per il round-robin oppure `cluster.SCHED_NONE` per lasciare la decisione al sistema operativo. This is a global setting and effectively frozen once either the first worker is spawned, or [`.setupMaster()`][] is called, whichever comes first.

`SCHED_RR` è l'impostazione predefinita su tutti i sistemi operativi eccetto Windows. Windows passerà a `SCHED_RR` solo quando libuv sarà in grado di distribuire efficacemente gli IOCP handle senza incorrere in un grande calo di prestazioni.

`cluster.schedulingPolicy` può essere impostato anche tramite la variabile di ambiente `NODE_CLUSTER_SCHED_POLICY`. I valori validi sono `'rr'` e `'none'`.

## `cluster.settings`
<!-- YAML
added: v0.7.1
changes:
  - version: v13.2.0
    pr-url: https://github.com/nodejs/node/pull/30162
    description: The `serialization` option is supported now.
  - version: v9.5.0
    pr-url: https://github.com/nodejs/node/pull/18399
    description: The `cwd` option is supported now.
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/17412
    description: The `windowsHide` option is supported now.
  - version: v8.2.0
    pr-url: https://github.com/nodejs/node/pull/14140
    description: The `inspectPort` option is supported now.
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7838
    description: The `stdio` option is supported now.
-->

* {Object}
  * `execArgv` {string[]} List of string arguments passed to the Node.js executable. **Default:** `process.execArgv`.
  * `exec` {string} Percorso file (file path) del file worker. **Default:** `process.argv[1]`.
  * `args` {string[]} Argomenti di string passati al worker. **Default:** `process.argv.slice(2)`.
  * `cwd` {string} Attuale directory di lavoro del processo worker. **Default:** `undefined` (inherits from parent process).
  * `serialization` {string} Specify the kind of serialization used for sending messages between processes. Possible values are `'json'` and `'advanced'`. See [Advanced Serialization for `child_process`][] for more details. **Default:** `false`.
  * `silent` {boolean} Se inviare o meno l'output allo stdio del parent. **Default:** `false`.
  * `stdio` {Array} Configura lo stdio dei processi sottoposti al fork. Poiché il modulo cluster si basa su IPC per funzionare, questa configurazione deve contenere una voce `'ipc'`. Quando viene fornita quest'opzione, esegue l'override di `silent`.
  * `uid` {number} Imposta l'identità dell'utente (user identity) del processo. (Vedi setuid(2).)
  * `gid` {number} Imposta l'identità di gruppo (group identity) del processo. (Vedi setgid(2).)
  * `inspectPort` {number|Function} Imposta l'inspector port del worker. This can be a number, or a function that takes no arguments and returns a number. By default each worker gets its own port, incremented from the master's `process.debugPort`.
  * `windowsHide` {boolean} Hide the forked processes console window that would normally be created on Windows systems. **Default:** `false`.

After calling [`.setupMaster()`][] (or [`.fork()`][]) this settings object will contain the settings, including the default values.

Quest'object non è predisposto ad essere modificato o impostato manualmente.

## `cluster.setupMaster([settings])`
<!-- YAML
added: v0.7.1
changes:
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7838
    description: The `stdio` option is supported now.
-->

* `settings` {Object} Vedi [`cluster.settings`][].

`setupMaster` viene utilizzato per modificare il comportamento predefinito di 'fork'. Una volta chiamato, le impostazioni saranno presenti all'interno di `cluster.settings`.

Any settings changes only affect future calls to [`.fork()`][] and have no effect on workers that are already running.

The only attribute of a worker that cannot be set via `.setupMaster()` is the `env` passed to [`.fork()`][].

The defaults above apply to the first call only; the defaults for later calls are the current values at the time of `cluster.setupMaster()` is called.

```js
const cluster = require('cluster');
cluster.setupMaster({
  exec: 'worker.js',
  args: ['--use', 'https'],
  silent: true
});
cluster.fork(); // worker https
cluster.setupMaster({
  exec: 'worker.js',
  args: ['--use', 'http']
});
cluster.fork(); // worker http
```

Questo può essere chiamato solo dal processo master.

## `cluster.worker`
<!-- YAML
added: v0.7.0
-->

* {Object}

Un riferimento all'attuale worker object. Non disponibile nel processo master.

```js
const cluster = require('cluster');

if (cluster.isMaster) {
  console.log('I am master');
  cluster.fork();
  cluster.fork();
} else if (cluster.isWorker) {
  console.log(`I am worker #${cluster.worker.id}`);
}
```

## `cluster.workers`
<!-- YAML
added: v0.7.0
-->

* {Object}

Un hash che memorizza gli worker object attivi, identificati tramite il campo `id`. Facilita l'accesso a tutti gli worker. E' disponibile solo nel processo master.

A worker is removed from `cluster.workers` after the worker has disconnected _and_ exited. The order between these two events cannot be determined in advance. However, it is guaranteed that the removal from the `cluster.workers` list happens before last `'disconnect'` or `'exit'` event is emitted.

```js
// Passa attraverso tutti gli worker
function eachWorker(callback) {
  for (const id in cluster.workers) {
    callback(cluster.workers[id]);
  }
}
eachWorker((worker) => {
  worker.send('big announcement to all workers');
});
```

Il modo più semplice per individuare la posizione degli worker è tramite l'utilizzo dell'ID univoco diverso per ognuno di essi.

```js
socket.on('data', (id) => {
  const worker = cluster.workers[id];
});
```
