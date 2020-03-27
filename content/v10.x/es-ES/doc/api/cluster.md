# Clúster

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

Una sola instancia de Node.js corre en un solo hilo. To take advantage of multi-core systems, the user will sometimes want to launch a cluster of Node.js processes to handle the load.

The cluster module allows easy creation of child processes that all share server ports.

```js
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Bifurcar workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  // Los workers pueden compartir cualquier conexión TCP
  // En este caso es un servidor HTTP
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end('hello world\n');
  }).listen(8000);

  console.log(`Worker ${process.pid} started`);
}
```

Ejecutar Node.js ahora compartirá el puerto 8000 entre los workers:

```txt
$ node server.js
Master 3596 se está ejecutando
Worker 4324 iniciado
Worker 4520 iniciado
Worker 6056 iniciado
Worker 5644 iniciado
```

Please note that on Windows, it is not yet possible to set up a named pipe server in a worker.

## Cómo Funciona

<!--type=misc-->

The worker processes are spawned using the [`child_process.fork()`][] method, so that they can communicate with the parent via IPC and pass server handles back and forth.

The cluster module supports two methods of distributing incoming connections.

The first one (and the default one on all platforms except Windows), is the round-robin approach, where the master process listens on a port, accepts new connections and distributes them across the workers in a round-robin fashion, with some built-in smarts to avoid overloading a worker process.

The second approach is where the master process creates the listen socket and sends it to interested workers. The workers then accept incoming connections directly.

El segundo método debería, en teoría, dar el mejor rendimiento. In practice however, distribution tends to be very unbalanced due to operating system scheduler vagaries. Loads have been observed where over 70% of all connections ended up in just two processes, out of a total of eight.

Because `server.listen()` hands off most of the work to the master process, there are three cases where the behavior between a normal Node.js process and a cluster worker differs:

1. `server.listen({fd: 7})` Porque el mensaje es pasado al maestro, el descriptor del archivo 7 **en el proceso primario** va a ser escuchado, y el handle será pasado al worker, en vez de escuchar la idea del worker de aquello a lo que hace referencia el descriptor del archivo número 7.
2. `server.listen(handle)` Listening on handles explicitly will cause the worker to use the supplied handle, rather than talk to the master process.
3. `server.listen(0)` Normally, this will cause servers to listen on a random port. However, in a cluster, each worker will receive the same "random" port each time they do `listen(0)`. In essence, the port is random the first time, but predictable thereafter. To listen on a unique port, generate a port number based on the cluster worker ID.

Node.js no provee lógica de enrutación. It is, therefore important to design an application such that it does not rely too heavily on in-memory data objects for things like sessions and login.

Because workers are all separate processes, they can be killed or re-spawned depending on a program's needs, without affecting other workers. As long as there are some workers still alive, the server will continue to accept connections. If no workers are alive, existing connections will be dropped and new connections will be refused. Node.js does not automatically manage the number of workers, however. It is the application's responsibility to manage the worker pool based on its own needs.

Although a primary use case for the `cluster` module is networking, it can also be used for other use cases requiring worker processes.

## Clase: Worker

<!-- YAML
added: v0.7.0
-->

Un objeto `Worker` contiene toda la información pública y el método sobre un worker. En el maestro, puede ser obtenido usando `cluster.workers`. In a worker it can be obtained using `cluster.worker`.

### Evento: 'disconnect'

<!-- YAML
added: v0.7.7
-->

Similar al evento `cluster.on('disconnect')`, pero especifico a este worker.

```js
cluster.fork().on('disconnect', () => {
  // Worker se ha desconectado
});
```

### Evento: 'error'

<!-- YAML
added: v0.7.3
-->

Este evento es igual que el proporcionado por [`child_process.fork()`][].

Dentro de un worker, `process.on('error')` también pudiera ser usado.

### Evento: 'exit'

<!-- YAML
added: v0.11.2
-->

* `code`{number} El código de salida, si se cerró de manera normal.
* `signal` {string} The name of the signal (e.g. `'SIGHUP'`) that caused the process to be killed.

Similar al evento `cluster.on('exit')`, pero especifico a este worker.

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

### Evento: 'listening'

<!-- YAML
added: v0.7.0
-->

* `address` {Object}

Similar al evento `cluster.on('listening')`, pero especifico a este worker.

```js
cluster.fork().on('listening', (address) => {
  // Worker está listening
});
```

No está emitido en el worker.

### Event: 'message'

<!-- YAML
added: v0.7.0
-->

* `message` {Object}
* `handle` {undefined|Object}

Similar al evento `'message'` del `cluster`, pero específico a este worker.

Dentro de un worker, `process.on('message')` también pudiera ser usado.

Ve [`process` event: `'message'`][].

Here is an example using the message system. It keeps a count in the master process of the number of HTTP requests received by the workers:

```js
const cluster = require('cluster');
const http = require('http');

if (cluster.isMaster) {

  // Mantener un seguimiento de las solicitudes  http 
  let numReqs = 0;
  setInterval(() => {
    console.log(`numReqs = ${numReqs}`);
  }, 1000);

  // Contar solicitudes
  function messageHandler(msg) {
    if (msg.cmd && msg.cmd === 'notifyRequest') {
      numReqs += 1;
    }
  }

  // Dar inicio a los workers y escuchar atendiendo a mensajes que contengan notifyRequest
  const numCPUs = require('os').cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  for (const id in cluster.workers) {
    cluster.workers[id].on('message', messageHandler);
  }

} else {

  // Los procesos workers tienen un servidor http.
  http.Server((req, res) => {
    res.writeHead(200);
    res.end('hello world\n');

    // notificar al maestro sobre la solicitud
    process.send({ cmd: 'notifyRequest' });
  }).listen(8000);
}
```

### Evento: 'online'

<!-- YAML
added: v0.7.0
-->

Similar al evento `cluster.on('online')`, pero específico a este worker.

```js
cluster.fork().on('online', () => {
  // Worker está en línea
});
```

No está emitido en el worker.

### worker.disconnect()

<!-- YAML
added: v0.7.7
changes:

  - version: v7.3.0
    pr-url: https://github.com/nodejs/node/pull/10019
    description: This method now returns a reference to `worker`.
-->

* Retorna: {cluster.Worker} Una referencia a `worker`.

In a worker, this function will close all servers, wait for the `'close'` event on those servers, and then disconnect the IPC channel.

In the master, an internal message is sent to the worker causing it to call `.disconnect()` on itself.

Causa que se establezca `.exitedAfterDisconnect`.

Note that after a server is closed, it will no longer accept new connections, but connections may be accepted by any other listening worker. Existing connections will be allowed to close as usual. When no more connections exist, see [`server.close()`][], the IPC channel to the worker will close allowing it to die gracefully.

The above applies *only* to server connections, client connections are not automatically closed by workers, and disconnect does not wait for them to close before exiting.

Note that in a worker, `process.disconnect` exists, but it is not this function, it is [`disconnect`][].

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
    // conexiones nuncan terminan
  });

  server.listen(8000);

  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      // iniciar el elegante cierre de cualquier conexión al servidor
    }
  });
}
```

### worker.exitedAfterDisconnect

<!-- YAML
added: v6.0.0
-->

* {boolean}

Establecido al llamar `.kill()` o `.disconnect()`. Hasta entonces, es `undefined`.

The boolean [`worker.exitedAfterDisconnect`][] allows distinguishing between voluntary and accidental exit, the master may choose not to respawn a worker based on this value.

```js
cluster.on('exit', (worker, code, signal) => {
  if (worker.exitedAfterDisconnect === true) {
    console.log('Oh, it was just voluntary – no need to worry');
  }
});

// matar worker
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

This function returns `true` if the worker is connected to its master via its IPC channel, `false` otherwise. A worker is connected to its master after it has been created. Es desconectado después que el evento `'disconnect'` es emitido.

### worker.isDead()

<!-- YAML
added: v0.11.14
-->

This function returns `true` if the worker's process has terminated (either because of exiting or being signaled). De otra manera, retorna `false`.

### worker.kill([signal='SIGTERM'])

<!-- YAML
added: v0.9.12
-->

* `signal` {string} Name of the kill signal to send to the worker process.

Esta función matará al worker. In the master, it does this by disconnecting the `worker.process`, and once disconnected, killing with `signal`. In the worker, it does it by disconnecting the channel, and then exiting with code `0`.

Because `kill()` attempts to gracefully disconnect the worker process, it is susceptible to waiting indefinitely for the disconnect to complete. For example, if the worker enters an infinite loop, a graceful disconnect will never occur. If the graceful disconnect behavior is not needed, use `worker.process.kill()`.

Causa que se establezca `.exitedAfterDisconnect`.

Este método tiene su alias como `worker.destroy()` para compatibilidad con versiones anteriores.

Note that in a worker, `process.kill()` exists, but it is not this function, it is [`kill`][].

### worker.process

<!-- YAML
added: v0.7.0
-->

* {ChildProcess}

All workers are created using [`child_process.fork()`][], the returned object from this function is stored as `.process`. In a worker, the global `process` is stored.

Ver: [Módulo del Proceso secundario](child_process.html#child_process_child_process_fork_modulepath_args_options).

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
* Devuelve: {boolean}

Envía un mensaje a un worker o un maestro, opcionalmente con un handle.

En el maestro, esto envía un mensaje a un worker específico. It is identical to [`ChildProcess.send()`][].

En un trabajador, esto envía un mensaje al maestro. It is identical to `process.send()`.

Este ejemplo va a devolver todos los mensajes del maestro:

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

## Evento: 'disconnect'

<!-- YAML
added: v0.7.9
-->

* `worker` {cluster.Worker}

Emitido después que el canal IPC del worker ha sido desconectado. This can occur when a worker exits gracefully, is killed, or is disconnected manually (such as with `worker.disconnect()`).

Puede existir una demora entre los eventos `'disconnect'` y `'exit'`. These events can be used to detect if the process is stuck in a cleanup or if there are long-living connections.

```js
cluster.on('disconnect', (worker) => {
  console.log(`The worker #${worker.id} has disconnected`);
});
```

## Evento: 'exit'

<!-- YAML
added: v0.7.9
-->

* `worker` {cluster.Worker}
* `code`{number} El código de salida, si se cerró de manera normal.
* `signal` {string} The name of the signal (e.g. `'SIGHUP'`) that caused the process to be killed.

Cuando cualquiera de los workers muere, el módulo clúster va a emitir el evento `'exit'`.

Esto puede ser usado para reiniciar el worker llamando otra vez a `.fork()`.

```js
cluster.on('exit', (worker, code, signal) => {
  console.log('worker %d terminó (%s). reiniciando...',
                worker.process.pid, signal || code);
    cluster.fork();
  }
);
```

Ve [`child_process` event: `'exit'`][].

## Evento: 'fork'

<!-- YAML
added: v0.7.0
-->

* `worker` {cluster.Worker}

Cuando un nuevo worker es bifurcado, el módulo clúster va a emitir el evento `'fork'`. Esto puede ser usado para registrar la actividad de un worker, y crear un tiempo de desconexión personalizado.

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

## Evento: 'listening'

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

`addressType` es una de:

* `4` (TCPv4)
* `6` (TCPv6)
* `-1` (socket de dominio unix)
* `'udp4'` o `'udp6'` (UDP v4 or v6)

## Evento: 'message'

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

Emitido cuando el clúster maestro recibe un mensaje de cualquier worker.

Ve [`child_process` event: `'message'`][].

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

## Evento: 'online'

<!-- YAML
added: v0.7.0
-->

* `worker` {cluster.Worker}

Después de bifurcar un nuevo worker, el worker debería responder con un mensaje en línea. Cuando el maestro reciba un mensaje en línea, va a emitir este evento. The difference between `'fork'` and `'online'` is that fork is emitted when the master forks a worker, and `'online'` is emitted when the worker is running.

```js
cluster.on('online', (worker) => {
  console.log('Yay, the worker responded after it was forked');
});
```

## Evento: 'setup'

<!-- YAML
added: v0.7.1
-->

* `settings` {Object}

Emitido cada vez que se llama a `.setupMaster()`.

The `settings` object is the `cluster.settings` object at the time `.setupMaster()` was called and is advisory only, since multiple calls to `.setupMaster()` can be made in a single tick.

Si la precisión es importante, usa `cluster.settings`.

## cluster.disconnect([callback])

<!-- YAML
added: v0.7.7
-->

* `callback` {Function} Called when all workers are disconnected and handles are closed.

Llama a `.disconnect()` en cada worker en `cluster.workers`.

When they are disconnected all internal handles will be closed, allowing the master process to die gracefully if no other event is waiting.

El método toma un argumento callback opcional que va a ser llamado cuando haya terminado.

Esto solo puede ser llamado del proceso maestro.

## cluster.fork([env])

<!-- YAML
added: v0.6.0
-->

* `env` {Object} Llave/valor conecta para añadir el ambiente del proceso worker.
* Devuelve: {cluster.Worker}

Genera un nuevo proceso worker.

Esto solo puede ser llamado del proceso maestro.

## cluster.isMaster

<!-- YAML
added: v0.8.1
-->

* {boolean}

Verdadero si el proceso es un maestro. This is determined by the `process.env.NODE_UNIQUE_ID`. If `process.env.NODE_UNIQUE_ID` is undefined, then `isMaster` is `true`.

## cluster.isWorker

<!-- YAML
added: v0.6.0
-->

* {boolean}

Verdadero si el proceso no es maestro (es la negación de `cluster.isMaster`).

## cluster.schedulingPolicy

<!-- YAML
added: v0.11.2
-->

The scheduling policy, either `cluster.SCHED_RR` for round-robin or `cluster.SCHED_NONE` to leave it to the operating system. This is a global setting and effectively frozen once either the first worker is spawned, or `cluster.setupMaster()` is called, whichever comes first.

`SCHED_RR` es el predeterminado en todos los sistemas operativos menos Windows. Windows will change to `SCHED_RR` once libuv is able to effectively distribute IOCP handles without incurring a large performance hit.

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
  * `execArgv` {string[]} List of string arguments passed to the Node.js executable. **Predeterminado:** `process.execArgv`.
  * `exec` {string} Ruta del archivo al archivo worker. **Predeterminado:** `process.argv[1]`.
  * `args` {string[]} Argumentos strings pasados al worker. **Predeterminado:** `process.argv.slice(2)`.
  * `cwd` {string} Directorio del proceso worker actualmente operativo. **Default:** `undefined` (inherits from parent process).
  * `silent` {boolean} Sea enviar la salida a stdio secundario o no hacerlo. **Predeterminado:** `false`.
  * `stdio` {Array} Configura el stdio de procesos bifurcados. Because the cluster module relies on IPC to function, this configuration must contain an `'ipc'` entry. Cuando se proporciona esta opción, se anula `silent`.
  * `uid` {number} Establece la identidad del usuario del proceso. (Ver setuid(2).)
  * `gid` {number} Establece la identidad del grupo del proceso. (Ver setgid(2).)
  * `inspectPort` {number|Function} Establece puerto inspector del worker. This can be a number, or a function that takes no arguments and returns a number. By default each worker gets its own port, incremented from the master's `process.debugPort`.
  * `windowsHide` {boolean} Hide the forked processes console window that would normally be created on Windows systems. **Predeterminado:** `false`.

After calling `.setupMaster()` (or `.fork()`) this settings object will contain the settings, including the default values.

Este objeto no está diseñado para ser cambiado o ajustado manualmente.

## cluster.setupMaster([settings])

<!-- YAML
added: v0.7.1
changes:

  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7838
    description: The `stdio` option is supported now.
-->

* `settings` {Object} Ver [`cluster.settings`][].

`setupMaster` es usado para cambiar el comportamiento predeterminado de 'bifurcar'. Once called, the settings will be present in `cluster.settings`.

Tenga en cuenta que:

* Any settings changes only affect future calls to `.fork()` and have no effect on workers that are already running.
* The *only* attribute of a worker that cannot be set via `.setupMaster()` is the `env` passed to `.fork()`.
* The defaults above apply to the first call only, the defaults for later calls is the current value at the time of `cluster.setupMaster()` is called.

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

Esto solo puede ser llamado desde el proceso maestro.

## cluster.worker

<!-- YAML
added: v0.7.0
-->

* {Object}

Una referencia al objeto worker actual. No disponible en el proceso maestro.

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

Un hash que guarda los objetos del worker activo, escritos por el campo `id`. Makes it easy to loop through all the workers. It is only available in the master process.

A worker is removed from `cluster.workers` after the worker has disconnected *and* exited. El orden entre estos dos eventos no puede ser determinado de antemano. However, it is guaranteed that the removal from the `cluster.workers` list happens before last `'disconnect'` or `'exit'` event is emitted.

```js
// Pasar a través de todos los workers
function eachWorker(callback) {
  for (const id in cluster.workers) {
    callback(cluster.workers[id]);
  }
}
eachWorker((worker) => {
  worker.send('big announcement to all workers');
});
```

Usando la identificación única del worker es la manera más fácil de localizar el worker.

```js
socket.on('data', (id) => {
  const worker = cluster.workers[id];
});
```