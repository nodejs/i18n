# Cluster

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stabile

Una singola istanza di Node.js viene eseguita in un singolo thread. Per sfruttare i sistemi multi-core, a volte l'utente ha la necessità di avviare un cluster di processi Node.js per gestirne il carico.

Il modulo cluster consente una facile creazione di processi child che condividono tutte le porte del server.

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

```txt
$ node server.js
Master 3596 is running
Worker 4324 started
Worker 4520 started
Worker 6056 started
Worker 5644 started
```

Da notare che su Windows non è ancora possibile impostare un pipe server con nome all'interno di un worker.

## Come Funziona

<!--type=misc-->

I processi worker vengono generati utilizzando il metodo [`child_process.fork()`][], in modo che possano comunicare con il parent tramite IPC e passare i server handle avanti e indietro.

Il modulo cluster supporta due metodi di distribuzione delle connessioni in entrata.

Il primo (quello predefinito su tutte le piattaforme eccetto Windows), è l'approccio round-robin, in cui il processo master esegue il listening su una porta, accetta nuove connessioni e le distribuisce tra gli worker in modalità round-robin, con intelligenza integrata per evitare il sovraccarico del processo di un worker.

Il secondo approccio consiste nel processo master che crea il listen socket e lo invia agli worker interessati. Gli worker accettano quindi direttamente le connessioni in entrata.

Il secondo approccio dovrebbe, in teoria, fornire le migliori prestazioni. Tuttavia in pratica, la distribuzione tende ad essere molto sbilanciata a causa dei capricci dello scheduler del sistema operativo. Sono stati osservati carichi nei quali oltre il 70% di tutte le connessioni è finito in soli due processi, su un totale di otto.

Poiché `server.listen()` distribuisce la maggior parte del lavoro al processo master, ci sono tre casi in cui il comportamento tra un normale processo Node.js e un cluster worker è diverso:

1. `server.listen({fd: 7})` Poiché il messaggio viene passato al master, il file descriptor 7 **all'interno del parent** verrà ascoltato (listening) e l'handle passerà al worker, anziché ascoltare l'idea del worker di ciò che fa riferimento al file descriptor numero 7.
2. `server.listen(handle)` Ascoltare gli handle in modo esplicito farà sì che il worker utilizzi l'handle fornito, anziché parlare con il processo master.
3. `server.listen(0)` Normalmente, questo causerà l'ascolto dei server su una porta casuale. Tuttavia, in un cluster, ogni worker riceverà la stessa porta "casuale" ogni volta che eseguirà `listen(0)`. In sostanza, la porta è casuale la prima volta, ma successivamente è prevedibile. Per l'ascolto su una porta univoca, genera un numero di porta in base al worker ID del cluster.

Node.js non fornisce la logica di routing. È quindi importante progettare un'applicazione in modo che non si basi troppo sui data object in memoria per cose come sessioni e login.

Poiché gli worker sono tutti processi separati, possono essere arrestati o rigenerati a seconda delle esigenze di un programma, senza intaccare altri worker. Il server continuerà ad accettare connessioni finché ci saranno ancora degli worker in funzione. Se non c'è più nessun worker in funzione, le connessioni esistenti verranno eliminate e le nuove connessioni saranno rifiutate. Tuttavia Node.js non gestisce automaticamente il numero di worker. È una responsabilità dell'applicazione gestire il worker pool in base alle proprie esigenze.

Sebbene il modulo `cluster` sia usato principalmente nel networking, può essere utilizzato anche in altri casi che richiedono processi worker.

## Class: Worker

<!-- YAML
added: v0.7.0
-->

Un `Worker` object contiene tutte le informazioni pubbliche e il metodo riguardanti un worker. Nel master può essere ottenuto utilizzando `cluster.workers`. In un worker può essere ottenuto utilizzando `cluster.worker`.

### Event: 'disconnect'

<!-- YAML
added: v0.7.7
-->

Simile all'evento `cluster.on('disconnect')`, ma specifico per questo worker.

```js
cluster.fork().on('disconnect', () => {
  // Il worker si è disconnesso
});
```

### Event: 'error'

<!-- YAML
added: v0.7.3
-->

Questo evento è uguale a quello fornito da [`child_process.fork()`][].

All'interno di un worker, potrebbe essere utilizzato anche `process.on('error')`.

### Event: 'exit'

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

### Event: 'listening'

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

### Event: 'message'

<!-- YAML
added: v0.7.0
-->

* `message` {Object}
* `handle` {undefined|Object}

Simile all'evento `'message'` di `cluster`, ma specifico per questo worker.

All'interno di un worker, potrebbe essere utilizzato anche `process.on('message')`.

Vedi [`process` event: `'message'`][].

Ad esempio, ecco un cluster che tiene conto del numero di richieste nel processo master utilizzando il message system:

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

    // avvisa il master riguardo la richiesta
    process.send({ cmd: 'notifyRequest' });
  }).listen(8000);
}
```

### Event: 'online'

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

### worker.disconnect()

<!-- YAML
added: v0.7.7
changes:

  - version: v7.3.0
    pr-url: https://github.com/nodejs/node/pull/10019
    description: This method now returns a reference to `worker`.
-->

* Restituisce: {cluster.Worker} Un riferimento a `worker`.

In un worker, questa funzione chiuderà tutti i server, attenderà l'evento `'close'` su di essi e successivamente disconnetterà il canale IPC.

Nel master, viene inviato un messaggio interno al worker che lo porta a chiamare `.disconnect()` su se stesso.

Fa sì che venga impostato `.exitedAfterDisconnect`.

Da notare che dopo che un server è stato chiuso, questo non accetterà più nuove connessioni, però le connessioni potrebbero essere accettate da qualsiasi altro listening worker. Le connessioni esistenti avranno il permesso di chiudersi come al solito. Quando non ci sono più connessioni, vedi [`server.close()`][], il canale IPC collegato al worker si chiuderà permettendogli di arrestarsi lentamente.

Quanto detto sopra si applica *solo* alle connessioni ai server, le connessioni ai client non vengono automaticamente chiuse dagli worker e disconnect non attende la loro chiusura prima di concludersi.

Da notare che in un worker esiste `process.disconnect`, ma non è questa funzione, in quanto la funzione è [`disconnect`][].

Because long living server connections may block workers from disconnecting, it may be useful to send a message, so application specific actions may be taken to close them. It also may be useful to implement a timeout, killing a worker if the `'disconnect'` event has not been emitted after some time.

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
    // connections never end
  });

  server.listen(8000);

  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      // initiate graceful close of any connections to server
    }
  });
}
```

### worker.exitedAfterDisconnect

<!-- YAML
added: v6.0.0
-->

* {boolean}

Set by calling `.kill()` or `.disconnect()`. Until then, it is `undefined`.

The boolean [`worker.exitedAfterDisconnect`][] allows distinguishing between voluntary and accidental exit, the master may choose not to respawn a worker based on this value.

```js
cluster.on('exit', (worker, code, signal) => {
  if (worker.exitedAfterDisconnect === true) {
    console.log('Oh, it was just voluntary – no need to worry');
  }
});

// kill worker
worker.kill();
```

### worker.id

<!-- YAML
added: v0.8.0
-->

* {number}

Each new worker is given its own unique id, this id is stored in the `id`.

While a worker is alive, this is the key that indexes it in `cluster.workers`.

### worker.isConnected()

<!-- YAML
added: v0.11.14
-->

This function returns `true` if the worker is connected to its master via its IPC channel, `false` otherwise. A worker is connected to its master after it has been created. It is disconnected after the `'disconnect'` event is emitted.

### worker.isDead()

<!-- YAML
added: v0.11.14
-->

This function returns `true` if the worker's process has terminated (either because of exiting or being signaled). Otherwise, it returns `false`.

### worker.kill([signal='SIGTERM'])

<!-- YAML
added: v0.9.12
-->

* `signal` {string} Name of the kill signal to send to the worker process.

This function will kill the worker. In the master, it does this by disconnecting the `worker.process`, and once disconnected, killing with `signal`. In the worker, it does it by disconnecting the channel, and then exiting with code `0`.

Causes `.exitedAfterDisconnect` to be set.

This method is aliased as `worker.destroy()` for backwards compatibility.

Note that in a worker, `process.kill()` exists, but it is not this function, it is [`kill`][].

### worker.process

<!-- YAML
added: v0.7.0
-->

* {ChildProcess}

All workers are created using [`child_process.fork()`][], the returned object from this function is stored as `.process`. In a worker, the global `process` is stored.

See: [Child Process module](child_process.html#child_process_child_process_fork_modulepath_args_options).

Note that workers will call `process.exit(0)` if the `'disconnect'` event occurs on `process` and `.exitedAfterDisconnect` is not `true`. This protects against accidental disconnection.

### worker.send(message\[, sendHandle\]\[, callback\])

<!-- YAML
added: v0.7.0
changes:

  - version: v4.0.0
    pr-url: https://github.com/nodejs/node/pull/2620
    description: The `callback` parameter is supported now.
-->

* `message` {Object}
* `sendHandle` {Handle}
* `callback` {Function}
* Returns: {boolean}

Send a message to a worker or master, optionally with a handle.

In the master this sends a message to a specific worker. It is identical to [`ChildProcess.send()`][].

In a worker this sends a message to the master. It is identical to `process.send()`.

This example will echo back all messages from the master:

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

## Event: 'disconnect'

<!-- YAML
added: v0.7.9
-->

* `worker` {cluster.Worker}

Emitted after the worker IPC channel has disconnected. This can occur when a worker exits gracefully, is killed, or is disconnected manually (such as with `worker.disconnect()`).

There may be a delay between the `'disconnect'` and `'exit'` events. These events can be used to detect if the process is stuck in a cleanup or if there are long-living connections.

```js
cluster.on('disconnect', (worker) => {
  console.log(`The worker #${worker.id} has disconnected`);
});
```

## Event: 'exit'

<!-- YAML
added: v0.7.9
-->

* `worker` {cluster.Worker}
* `code` {number} The exit code, if it exited normally.
* `signal` {string} The name of the signal (e.g. `'SIGHUP'`) that caused the process to be killed.

When any of the workers die the cluster module will emit the `'exit'` event.

This can be used to restart the worker by calling `.fork()` again.

```js
cluster.on('exit', (worker, code, signal) => {
  console.log('worker %d died (%s). restarting...',
              worker.process.pid, signal || code);
  cluster.fork();
});
```

See [`child_process` event: `'exit'`][].

## Event: 'fork'

<!-- YAML
added: v0.7.0
-->

* `worker` {cluster.Worker}

When a new worker is forked the cluster module will emit a `'fork'` event. This can be used to log worker activity, and create a custom timeout.

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

## Event: 'listening'

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

The `addressType` is one of:

* `4` (TCPv4)
* `6` (TCPv6)
* `-1` (unix domain socket)
* `'udp4'` or `'udp6'` (UDP v4 or v6)

## Event: 'message'

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

Emitted when the cluster master receives a message from any worker.

See [`child_process` event: `'message'`][].

Before Node.js v6.0, this event emitted only the message and the handle, but not the worker object, contrary to what the documentation stated.

If support for older versions is required but a worker object is not required, it is possible to work around the discrepancy by checking the number of arguments:

```js
cluster.on('message', (worker, message, handle) => {
  if (arguments.length === 2) {
    handle = message;
    message = worker;
    worker = undefined;
  }
  // ...
});
```

## Event: 'online'

<!-- YAML
added: v0.7.0
-->

* `worker` {cluster.Worker}

After forking a new worker, the worker should respond with an online message. When the master receives an online message it will emit this event. The difference between `'fork'` and `'online'` is that fork is emitted when the master forks a worker, and `'online'` is emitted when the worker is running.

```js
cluster.on('online', (worker) => {
  console.log('Yay, the worker responded after it was forked');
});
```

## Event: 'setup'

<!-- YAML
added: v0.7.1
-->

* `settings` {Object}

Emitted every time `.setupMaster()` is called.

The `settings` object is the `cluster.settings` object at the time `.setupMaster()` was called and is advisory only, since multiple calls to `.setupMaster()` can be made in a single tick.

If accuracy is important, use `cluster.settings`.

## cluster.disconnect([callback])

<!-- YAML
added: v0.7.7
-->

* `callback` {Function} Called when all workers are disconnected and handles are closed.

Calls `.disconnect()` on each worker in `cluster.workers`.

When they are disconnected all internal handles will be closed, allowing the master process to die gracefully if no other event is waiting.

The method takes an optional callback argument which will be called when finished.

This can only be called from the master process.

## cluster.fork([env])

<!-- YAML
added: v0.6.0
-->

* `env` {Object} Key/value pairs to add to worker process environment.
* Returns: {cluster.Worker}

Spawn a new worker process.

This can only be called from the master process.

## cluster.isMaster

<!-- YAML
added: v0.8.1
-->

* {boolean}

True if the process is a master. This is determined by the `process.env.NODE_UNIQUE_ID`. If `process.env.NODE_UNIQUE_ID` is undefined, then `isMaster` is `true`.

## cluster.isWorker

<!-- YAML
added: v0.6.0
-->

* {boolean}

True if the process is not a master (it is the negation of `cluster.isMaster`).

## cluster.schedulingPolicy

<!-- YAML
added: v0.11.2
-->

The scheduling policy, either `cluster.SCHED_RR` for round-robin or `cluster.SCHED_NONE` to leave it to the operating system. This is a global setting and effectively frozen once either the first worker is spawned, or `cluster.setupMaster()` is called, whichever comes first.

`SCHED_RR` is the default on all operating systems except Windows. Windows will change to `SCHED_RR` once libuv is able to effectively distribute IOCP handles without incurring a large performance hit.

`cluster.schedulingPolicy` can also be set through the `NODE_CLUSTER_SCHED_POLICY` environment variable. Valid values are `'rr'` and `'none'`.

## cluster.settings

<!-- YAML
added: v0.7.1
changes:

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
  * `exec` {string} File path to worker file. **Default:** `process.argv[1]`.
  * `args` {string[]} String arguments passed to worker. **Default:** `process.argv.slice(2)`.
  * `cwd` {string} Current working directory of the worker process. **Default:** `undefined` (inherits from parent process).
  * `silent` {boolean} Whether or not to send output to parent's stdio. **Default:** `false`.
  * `stdio` {Array} Configures the stdio of forked processes. Because the cluster module relies on IPC to function, this configuration must contain an `'ipc'` entry. When this option is provided, it overrides `silent`.
  * `uid` {number} Sets the user identity of the process. (See setuid(2).)
  * `gid` {number} Sets the group identity of the process. (See setgid(2).)
  * `inspectPort` {number|Function} Sets inspector port of worker. This can be a number, or a function that takes no arguments and returns a number. By default each worker gets its own port, incremented from the master's `process.debugPort`.
  * `windowsHide` {boolean} Hide the forked processes console window that would normally be created on Windows systems. **Default:** `false`.

After calling `.setupMaster()` (or `.fork()`) this settings object will contain the settings, including the default values.

This object is not intended to be changed or set manually.

## cluster.setupMaster([settings])

<!-- YAML
added: v0.7.1
changes:

  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7838
    description: The `stdio` option is supported now.
-->

* `settings` {Object} See [`cluster.settings`][].

`setupMaster` is used to change the default 'fork' behavior. Once called, the settings will be present in `cluster.settings`.

Note that:

* Any settings changes only affect future calls to `.fork()` and have no effect on workers that are already running.
* The *only* attribute of a worker that cannot be set via `.setupMaster()` is the `env` passed to `.fork()`.
* The defaults above apply to the first call only, the defaults for later calls is the current value at the time of `cluster.setupMaster()` is called.

Example:

```js
const cluster = require('cluster');
cluster.setupMaster({
  exec: 'worker.js',
  args: ['--use', 'https'],
  silent: true
});
cluster.fork(); // https worker
cluster.setupMaster({
  exec: 'worker.js',
  args: ['--use', 'http']
});
cluster.fork(); // http worker
```

This can only be called from the master process.

## cluster.worker

<!-- YAML
added: v0.7.0
-->

* {Object}

A reference to the current worker object. Not available in the master process.

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

## cluster.workers

<!-- YAML
added: v0.7.0
-->

* {Object}

A hash that stores the active worker objects, keyed by `id` field. Makes it easy to loop through all the workers. It is only available in the master process.

A worker is removed from `cluster.workers` after the worker has disconnected *and* exited. The order between these two events cannot be determined in advance. However, it is guaranteed that the removal from the `cluster.workers` list happens before last `'disconnect'` or `'exit'` event is emitted.

```js
// Go through all workers
function eachWorker(callback) {
  for (const id in cluster.workers) {
    callback(cluster.workers[id]);
  }
}
eachWorker((worker) => {
  worker.send('big announcement to all workers');
});
```

Using the worker's unique id is the easiest way to locate the worker.

```js
socket.on('data', (id) => {
  const worker = cluster.workers[id];
});
```