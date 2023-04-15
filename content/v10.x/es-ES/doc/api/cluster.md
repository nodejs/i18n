# Clúster

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

Una sola instancia de Node.js corre en un solo hilo. Para tomar ventaja de de sistemas multi-núcleos, el usuario en algunas ocasiones querrá ejecutar un clúster de procesos Node.js para manejar la carga.

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

Por favor, tenga en cuenta que en Windows, todavía no es posible establecer un servidor pipe en un worker.

## Cómo Funciona

<!--type=misc-->

Los procesos de trabajo son generados usando el método [` child_process.fork () `] [], para que puedan comunicarse con su proceso primario vía IPC y pasar los handles del servidor de un lado a otro.

El módulo de clúster soporta dos métodos de distribución de conexiones entrantes conexiones.

El primer método (y el predeterminado en todas las plataformas menos Windows), es la planificación round-robin, donde el proceso maestro escucha en un puerto, acepta nuevas conexiones y las distribuye a través de los workers de una manera round-robin, con mecanismos incorporados para evitar sobrecargar un proceso worker.

El segundo método es donde el proceso maestro crea el conector listen y lo envía a los trabajadores interesados. Los workers, entonces, aceptan las conexiones entrantes directamente.

El segundo método debería, en teoría, dar el mejor rendimiento. En la práctica, sin embargo, la distribución tiende a ser muy desequilibrada debido a a las divagancias del planificador del sistema operativo. Se han observado cargas donde más del 70% de todas las conexiones terminaron en solo dos procesos, de ocho en total.

Porque `server.listen ()` delega la mayoría del trabajo al proceso maestro, hay tres casos en los que el comportamiento entre un proceso Node.js y un clúster difieren:

1. `server.listen ({fd: 7})` Porque el mensaje es pasado al maestro, el descriptor de archivos 7 **en el proceso primario**, va a ser escuchado y el handle será pasado al worker, en vez de escuchar la idea del worker de aquello a lo que hace referen el descriptor de archivo número 7.
2. `server.listen(handle)` Usar Listen en los hadles causará explícitamente  que el worker use el handle suministrado, en vez de hablar con el proceso maestro.
3. `server.listen(0)` Normalmente, esto causará que los servidores escuchen a un puerto aleatorio. Sin embargo, en un clúster, cada trabajador recibirá el mismo puerto "aleatorio" cada vez que hagan `listen(0)`. En esencia, el puerto es aleatorio por primera vez, pero predecible después de eso. Para hacer listen en un puerto único, genera un número de puerto basado en el ID del worker en el clúster.

Node.js no provee lógica de enrutación. It is, therefore important to design an application such that it does not rely too heavily on in-memory data objects for things like sessions and login.

Because workers are all separate processes, they can be killed or re-spawned depending on a program's needs, without affecting other workers. Mientras todavía haya algunos workers vivos, el servidor continuará aceptando conexiones. Si ningún worker sigue vivo, las conexiones existentes van a ser perdidas y las nuevas conexiones serán rechazadas. Node.js does not automatically manage the number of workers, however. It is the application's responsibility to manage the worker pool based on its own needs.

Aunque un caso de uso primario para el módulo `clúster` es la creación de redes, también puede ser utilizado para otros casos que requieren procesos workers.

## Clase: Worker

<!-- YAML
added: v0.7.0
-->

Un objeto `Worker` contiene toda la información pública y el método sobre un worker. En el maestro, puede ser obtenido usando `cluster.workers`. En un worker, puede ser obtenido usando `cluster.worker`.

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
* `signal` {string} El nombre de la señal (e.g. `'SIGHUP'`) que causó que el proceso muriera.

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

En el maestro, un mensaje interno es enviado al worker causando que llame a `.disconnect()` en sí mismo.

Causa que se establezca `.exitedAfterDisconnect`.

Tenga en cuenta que, después de que un servidor es cerrado, no va a aceptar nuevas conexiones, pero las conexiones pueden ser aceptadas por cualquier otro worker que esté escuchando. A las conexiones existentes se les permitirá cerrarse de manera usual. When no more connections exist, see [`server.close()`][], the IPC channel to the worker will close allowing it to die gracefully.

Lo anterior aplica *solo* a las conexiones del servidor, las conexiones del cliente no son cerradas automáticamente por los workers, y la desconexión no espera a que ellos se cierren antes de salir.

Tenga en cuenta que, dentro de un worker, existe `process.disconnect`, pero no es esta función, es [`disconnect`][].

Ya que las conexiones de servidor de vida larga pueden bloquear a los workers de desconectarse, pudiera ser útil enviar un mensaje, de modo que acciones específicas de la aplicación puedan ser tomadas para cerrarlos. Puediera ser útil implementar un tiempo de espera, matando a un worker si el evento `'disconnect'` no ha sido emitido después de un tiempo.

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

A cada nuevo worker se le da su identificador único, este identificador es almacenado en `id`.

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

Esta función retorna `true` si el proceso del worker ha terminado (ya sea porque se salió o está siendo señalado). De otra manera, retorna `false`.

### worker.kill([signal='SIGTERM'])

<!-- YAML
added: v0.9.12
-->

* `signal` {string} Nombre de la señal que matará al proceso del worker.

Esta función matará al worker. En el maestro, lo hace al desconectar el `worker.process`, y una vez desconectado, matándolo con `signal`. En el worker, lo hace al desconectar el canal, y luego saliendo con el código `signal`.

Because `kill()` attempts to gracefully disconnect the worker process, it is susceptible to waiting indefinitely for the disconnect to complete. For example, if the worker enters an infinite loop, a graceful disconnect will never occur. If the graceful disconnect behavior is not needed, use `worker.process.kill()`.

Causa que se establezca `.exitedAfterDisconnect`.

Este método tiene su alias como `worker.destroy()` para compatibilidad con versiones anteriores.

Ten en cuenta que dentro de un worker, existe `process.kill()`, pero no es esta función, es [`kill`][].

### worker.process

<!-- YAML
added: v0.7.0
-->

* {ChildProcess}

Todos los workers son creados usando [`child_process.fork()`][], el objeto devuelto de esta función se almacena como `.process`. En un worker, es guardado el `process` global.

Ver: [Módulo del Proceso secundario](child_process.html#child_process_child_process_fork_modulepath_args_options).

Tenga en cuenta que los workers van a llamar a `process.exit(0)` si el evento `'disconnect'` ocurre en `process` y `.exitedAfterDisconnect` no es `true`. Este protege contra desconexiones accidentales.

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

En el maestro, esto envía un mensaje a un worker específico. Es idéntico a [`ChildProcess.send()`][].

En un trabajador, esto envía un mensaje al maestro. Es idéntico a `process.send()`.

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
* `signal` {string} El nombre de la señal (e.g. `'SIGHUP'`) que causó que el proceso muriera.

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

Antes de Node.js v6.0 este evento emitía solo el mensaje y el handle, pero no el objeto worker, al contrario de lo que decía la documentación.

Si se requiere soporte para versiones anteriores, pero un objeto worker no es requerido, es posible evitar la discrepancia verificando los números de los argumentos:

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

El objeto `settings` es el objeto `cluster.settings` al momento que `.setupMaster()` fue llamado y solo es consultivo, ya que pueden hacerse múltiples llamadas a `.setupMaster()` en un solo tick.

Si la precisión es importante, usa `cluster.settings`.

## cluster.disconnect([callback])

<!-- YAML
added: v0.7.7
-->

* `callback` {Function} Llame cuando todos los workers están desconectados y los handles están cerrados.

Llama a `.disconnect()` en cada worker en `cluster.workers`.

Cuando están desconectados, todos los handles internos serán cerrados, lo que permitirá proceso maestro morir con gracia si no hay otro evento esperando.

The method takes an optional callback argument which will be called when finished.

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

Verdadero si el proceso es un maestro. Esto está determinado por `process.env.NODE_UNIQUE_ID`. Si `process.env.NODE_UNIQUE_ID` está indefinido, entonces `isMaster` es `true`.

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

La política de planificación, ya sea `cluster.SCHED_RR` para round-robin o `cluster.SCHED_NONE` para dejárselo al sistema operativo. Esto es una configuración global y es efectivamente detenida una vez que el primer worker es generado, o cuando `cluster.setupMaster()` es llamado, cualquiera que ocurra primero.

`SCHED_RR` es el predeterminado en todos los sistemas operativos menos Windows. Windows cambiará a `SCHED_RR` una vez que libuv sea capaz de distribuir handles IOCP, sin incurrir en golpes fuertes en el rendimiento.

`cluster.schedulingPolicy` también puede ser configurada a través del ámbito variable `NODE_CLUSTER_SCHED_POLICY`. Los valores válidos son `'rr'` and `'none'`.

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
  * `cwd` {string} Directorio del proceso worker actualmente operativo. **Default:** `undefined` (heredados del proceso primario).
  * `silent` {boolean} Sea enviar la salida a stdio secundario o no hacerlo. **Predeterminado:** `false`.
  * `stdio` {Array} Configura el stdio de procesos bifurcados. Porque el módulo clúster depende del IPC para funcionar, esta configuración debe contener una entrada `'ipc'`. Cuando se proporciona esta opción, se anula `silent`.
  * `uid` {number} Establece la identidad del usuario del proceso. (Ver setuid(2).)
  * `gid` {number} Establece la identidad del grupo del proceso. (Ver setgid(2).)
  * `inspectPort` {number|Function} Establece puerto inspector del worker. This can be a number, or a function that takes no arguments and returns a number. By default each worker gets its own port, incremented from the master's `process.debugPort`.
  * `windowsHide` {boolean} Hide the forked processes console window that would normally be created on Windows systems. **Predeterminado:** `false`.

Después de llamar a `.setupMaster()` (or `.fork()`) este objeto de configuraciones contendrá las configuraciones, incluyendo los valores predeterminados.

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

`setupMaster` es usado para cambiar el comportamiento predeterminado de 'bifurcar'. Una vez llamado, las configuraciones estarán presentes en `cluster.settings`.

Tenga en cuenta que:

* Cualquier cambio en las configuraciones solo afecta a futuras llamadas a `.fork()` y no tiene ningún efecto en workers que ya estén en ejecución.
* El *único* atributo de un worker que no se puede establecer mediante `.setupMaster()` es el `env` pasado a `.fork()`.
* Los valores predeterminados anteriores aplican solo a la primera llamada, los predeterminados para llamadas posteriores son los valores en el momento que `cluster.setupMaster()` es llamado.

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

Un hash que guarda los objetos del worker activo, escritos por el campo `id`. Hace fácil hacer un bucle a través de todos los workers. Solo está disponible en el proceso maestro.

A worker is removed from `cluster.workers` after the worker has disconnected *and* exited. The order between these two events cannot be determined in advance. However, it is guaranteed that the removal from the `cluster.workers` list happens before last `'disconnect'` or `'exit'` event is emitted.

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