# Clúster

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

Una sola instancia de Node.js corre en un solo hilo. Para tomar ventaja de sistemas multi-núcleos, el usuario en algunas ocasiones querrá ejecutar un clúster de procesos Node.js para manejar la carga.

El módulo clúster permite la creación fácil de procesos secundarios que todos compartan puertos del servidor.

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
Master 3596 is running
Worker 4324 started
Worker 4520 started
Worker 6056 started
Worker 5644 started
```

Por favor, ten en cuenta que, en Windows, aún no es posible establecer un servidor pipe en un worker.

## Cómo Funciona

<!--type=misc-->

Los procesos worker son generados usando el método [`child_process.fork()`][], para que puedan comunicarse con su proceso primario vía IPC y pasar los handles del servidor de un lado a otro.

El módulo clúster soporta dos métodos de distribución de conexiones entrantes.

El primer método (y el predeterminado en todas las plataformas menos Windows) es la planificación round-robin, donde el proceso maestro escucha en un puerto, acepta las nuevas conexiones y las distribuye a través de los workers de una manera round-robin, con mecanismos incorporados para evitar sobrecargar un proceso worker.

El segundo método es donde el proceso maestro crea el conector listen y lo envía a los workers interesados. Los workers, entonces, aceptan las conexiones entrantes directamente.

El segundo método debería, en teoría, dar el mejor rendimiento. En la práctica sin embargo, la distribución tiende a ser muy desequilibrada debido a las divagancias del planificador del sistema operativo. Se han observado cargas donde más del 70% de todas las conexiones terminaron en solo dos procesos, de ocho en total.

Porque `server.listen()` delega la mayoría del trabajo al proceso maestro, hay tres casos en los que el comportamiento entre un proceso Node.js normal y un clúster difieren:

1. `server.listen({fd: 7})` Porque el mensaje es pasado al maestro, el descriptor del archivo 7 **en el padre** va a ser listened, y el handle pasado a el worker, en vez de hacer listening a la idea del worker de que hace referencia el descriptor del archivo número 7.
2. `server.listen(handle)` Usar Listen en los handles explícitamente causará que el worker use el handle suministrado, en vez de hablar con el proceso maestro.
3. `server.listen(0)` Normalmente, esto causará que los servidores escuchen a un puerto aleatorio. Sin embargo, en un clúster, cada trabajador recibirá el mismo puerto "aleatorio" cada vez que hagan `listen(0)`. En esencia, el puerto es aleatorio la primera vez, pero predecible después de eso. Para hacer listen en un puerto único, genera un número de puerto basado en el ID del worker en el clúster.

Node.js no provee lógica de enrutación. Es, por lo tanto importante diseñar una aplicación tal que no dependa mucho de objetos de data en la memoria para cosas como sesiones e inicios de sesiones.

Porque los workers son todos procesos separados, pueden ser eliminados o regenerados dependiendo de las necesidades del programa, sin afectar a los otros workers. Mientras que existan workers vivos, el servidor va a seguir aceptando conexiones. Si ningún worker sigue vivo, las conexiones existentes van a ser perdidas y las nuevas conexiones serán rechazadas. Sin embargo, Node.js no maneja automáticamente el número de workers. Es la responsabilidad de la aplicación de manejar el grupo de worker basado en sus propias necesidades.

Aunque un caso de uso primario del módulo `cluster` es la creación de redes, también puede ser usado para otros casos que requieran procesos worker.

## Clase: Worker

<!-- YAML
added: v0.7.0
-->

Un objeto `Worker` contiene toda la información pública y el método sonre un worker. En el maestro puede ser obtenido usando `cluster.workers`. En un worker puede ser obtenido usando `cluster.worker`.

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

* `code` {number} El código de salida, si se cerró por sí solo.
* `signal` {string} El nombre de la señal (p. ej. `'SIGHUP'`) que causó que el proceso muriera.

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

Como ejemplo, aquí está un clúster que mantiene la cuenta del número de solicitudes en el proceso maestro usando el sistema de mensaje:

```js
const cluster = require('cluster');
const http = require('http');

if (cluster.isMaster) {

  // Mantener un seguimiento de las solicitudes http
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

  // Comenzar los workers y listen para los mensakes que contengan notifyRequest
  const numCPUs = require('os').cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  for (const id in cluster.workers) {
    cluster.workers[id].on('message', messageHandler);
  }

} else {

  // Los procesos Worker tienen un servidor http.
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

En un worker, esta función cierra todos los servidores, espera por el evento `'close'` en esos servidores, y luego desconecta el canal IPC.

En el maestro, un mensaje interno es enviado al worker causando que llame a `.disconnect()` en si mismo.

Causa que se establezca `.exitedAfterDisconnect`.

Ten en cuenta que después que un servidor es cerrado, no va a aceptar nuevas conexiones, pero conexiones pueden ser aceptadas por cualquier otro worker que esté haciendo listening. Las conexiones existentes van permitir cerrarse de manera usual. Cuando no existan más conexiones, ver [`server.close()`][], el canal IPC del worker va a cerrarse permitiendo que muera con elegancia.

Lo anterior aplica *solamente* a las conexiones del servidor, las conexiones del cliente no son cerradas automáticamente por los workers, y al desconectar no espera a que ellos cierren antes de salir.

Ten en cuenta que dentro de un worker, existe `process.disconnect`, pero no es está función, es [`disconnect`][].

Porque las conexiones de servidor de vida larga pueden bloquear a los workers de desconectarse, pudiera ser útil enviar un mensaje, para que las acciones específicas de la aplicación pueda ser llevada a cerrarlos. Pudiera ser util implementar un tiempo de espera, matando a un worker si el evento `'disconnect'` no ha sido emitido después de un tiempo.

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

Establecido al llamar `.kill()` o `.disconnect()`. Hasta entonces, es `undefined`.

El booleano [`worker.exitedAfterDisconnect`][] permite distinguir entre salidas voluntarias y accidentales, el maestro puede escoger entre no regenerar un worker basado en este valor.

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

A cada nuevo worker se le da su identificador único, este identificador es almacenado en `id`.

Mientras un worker viva, esta es la llave que lo indica `cluster.workers`.

### worker.isConnected()

<!-- YAML
added: v0.11.14
-->

Esta función retorna `true` si el worker está conectado a su maestro via a su canal IPC, en caso contrario `false`. Un worker es conectado a su maestro después que se ha creado. Es desconectado después que el evento `'disconnect'` es emitido.

### worker.isDead()

<!-- YAML
added: v0.11.14
-->

La función retorna `true` si el proceso del worker ha terminado (ya sea porque se salió o está siendo señalado). De otra manera, retorna `false`.

### worker.kill([signal='SIGTERM'])

<!-- YAML
added: v0.9.12
-->

* `signal` {string} Nombre de la señar que matará al proceso del worker.

Esta función matará al worker. En el maestro, lo hace al desconectar el `worker.process`, y una vez desconectado, matandolo con `signal`. En el worker, lo hace al desconectar el canal, y luego saliendo con el código `0`.

Causa que se establezca `.exitedAfterDisconnect`.

This method is aliased as `worker.destroy()` for backwards compatibility.

Ten en cuenta que dentro de un worker, existe `process.kill()`, pero no es esta función, es [`kill`][].

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
  * `execArgv` {string[]} List of string arguments passed to the Node.js executable. **Predeterminado:** `process.execArgv`.
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