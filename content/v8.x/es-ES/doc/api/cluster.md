# Cluster

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

Una sola instancia de Node.js se ejecuta en un solo hilo. Para tomar ventaja de de sistemas multi-núcleos, el usuario en algunas ocasiones querrá ejecutar un clúster de procesos Node.js para manejar la carga.

El módulo clúster permite la creación fácil de procesos secundarios que todos compartan puertos del servidor.

```js
const cluster = require ('cluster');
const http = require ('http');
const numCPUs = require ('os'). cpus (). length;

if (cluster.isMaster) {
   console.log (`Master ${process.pid} está en ejecución`);

   // Bifucar workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
// Los workers pueden compartir cualquier conexión TCP
   // En este caso es un servidor HTTP.
   http.createServer ((req, res) = > {
     res.writeHead (200);
     res.end ('hello world\n');
   }).listen(8000);

   console.log (`Worker ${process.pid} started`);
}
```

La ejecución de Node.js ahora compartirá el puerto 8000 entre los workers:

```txt
$ node server.js
Master 3596 se está ejecutando
Worker 4324 iniciado
Worker 4520 iniciado
Worker 6056 iniciado
Worker 5644 iniciado
```

Por favor, tenga en cuenta que en Windows, todavía no es posible establecer un servidor pipe en un worker.

## Cómo funciona

<!--type=misc-->

Los procesos de trabajo son generados usando el método [` child_process.fork () `] [], para que puedan comunicarse con su proceso primario vía IPC y pasar los handles del servidor de un lado a otro.

El módulo de clúster soporta dos métodos de distribución de conexiones entrantes conexiones.

El primer método (y el predeterminado en todas las plataformas menos Windows), es la planificación round-robin, donde el proceso maestro escucha en un puerto, acepta nuevas conexiones y las distribuye a través de los workers de una manera round-robin, con mecanismos incorporados para evitar sobrecargar un proceso worker.

El segundo método es donde el proceso maestro crea el conector listen y lo envía a los trabajadores interesados. Los workers, entonces, aceptan las conexiones entrantes directamente.

El segundo método debería, en teoría, dar el mejor rendimiento. En la práctica, sin embargo, la distribución tiende a ser muy desequilibrada debido a a las divagancias del planificador del sistema operativo. Se han observado cargas donde más del 70% de todas las conexiones terminaron en solo dos procesos, de ocho en total.

Porque `server.listen ()` delega la mayoría del trabajo al proceso maestro, hay tres casos en los que el comportamiento entre un proceso Node.js y un clúster difieren:

1. `server.listen({fd: 7})` Because the message is passed to the master, file descriptor 7 **in the parent** will be listened on, and the handle passed to the worker, rather than listening to the worker's idea of what the number 7 file descriptor references.
2. `server.listen(handle)` Listening on handles explicitly will cause the worker to use the supplied handle, rather than talk to the master process.
3. `server.listen(0)` Normally, this will cause servers to listen on a random port. However, in a cluster, each worker will receive the same "random" port each time they do `listen(0)`. In essence, the port is random the first time, but predictable thereafter. To listen on a unique port, generate a port number based on the cluster worker ID.

*Note*: Node.js does not provide routing logic. It is, therefore important to design an application such that it does not rely too heavily on in-memory data objects for things like sessions and login.

Porque los workers son todos procesos separados, pueden ser eliminados o regenerados dependiendo de las necesidades del programa, sin afectar a los otros workers. Mientras todavía haya algunos workers vivos, el servidor continuará aceptando conexiones. Si ningún worker sigue vivo, las conexiones existentes van a ser perdidas y las nuevas conexiones serán rechazadas. Sin embargo, Node.js no maneja automáticamente el número de workers. Es responsabilidad de la aplicación manejar el grupo de workers, basándose en sus propias necesidades.

Aunque un caso de uso primario para el módulo `clúster` es la creación de redes, también puede ser utilizado para otros casos que requieren procesos workers.

## Clase: Worker
<!-- YAML
added: v0.7.0
-->

Un objeto Worker contiene toda la información pública y el método sobre un worker. En el maestro, puede ser obtenido usando `cluster.workers`. En un worker, puede ser obtenido usando `cluster.worker`.

### Evento: 'disconnect'
<!-- YAML
added: v0.7.7
-->

Similar al evento `cluster.on('disconnect')` pero, específico a este worker.

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

* `code` {number} El código de salida, si se cerró de manera normal.
* `signal` {string} El nombre de la señal (e.g. `'SIGHUP'`) que causó que el proceso muriera.

Similar al evento `cluster.on('exit')` pero específico a este worker.

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

Similar al evento `cluster.on('listening')`, pero específico a este worker.

```js
cluster.fork().on('listening', (address) => {
  // Worker está escuchando
});
```

No está emitido en el worker.

### Event: 'message'
<!-- YAML
added: v0.7.0
-->

* `message` {Object}
* `handle` {undefined|Object}

Similar al evento `cluster.on('message')` pero, específico a este worker.

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

* Devuelve: {cluster.Worker} Una referencia para `worker`.

En un worker, esta función cierra todos los servidores, espera por el evento `'close'` en esos servidores, y luego desconecta el canal IPC.

En el maestro, un mensaje interno es enviado al worker causando que llame a `.disconnect()` en sí mismo.

Causa que se establezca `.exitedAfterDisconnect`.

Tenga en cuenta que, después de que un servidor es cerrado, no va a aceptar nuevas conexiones, pero conexiones pueden ser aceptadas por cualquier otro worker que esté escuchando. A las conexiones existentes se les permitirá cerrarse de manera usual. Cuando no existan más conexiones, ver [`server.close()`][], el canal IPC del worker cerrará permitiendo que muera con elegancia.

Lo anterior aplica *solamente* a las conexiones del servidor, las conexiones del cliente no son cerradas automáticamente por los workers, y la desconexión no espera a que ellos se cierren antes de salir.

Tenga en cuenta que, dentro de un worker, existe `process.disconnect`, pero no es esta función, es [`disconnect`][].

Ya que las conexiones de servidor de vida larga pueden bloquear a los workers de desconectarse, pudiera ser útil enviar un mensaje, de modo que acciones específicas de la aplicación puedan ser tomadas para cerrarlos. Pudiera ser útil implementar un tiempo de espera, matando a un worker si el evento `'disconnect'` no ha sido emitido después de un tiempo.

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
    // las conexiones nunca terminan
  });

  server.listen(8000);

  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      // iniciar el cierre elegante de cualquier conexión al servidor
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

The boolean `worker.exitedAfterDisconnect` allows distinguishing between voluntary and accidental exit, the master may choose not to respawn a worker based on this value.

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

Mientras un worker está vivo, esta es la clave que lo indexa en cluster.workers

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

* `signal` {string} Nombre de la señal que matará al proceso del worker.

Esta función matará al worker. En el maestro, lo hace al desconectar el `worker.process`, y una vez desconectado, matandolo con `signal`. En el worker, lo hace al desconectar el canal, y luego saliendo con el código `0`.

Causa que se establezca `.exitedAfterDisconnect`.

Este método tiene su alias como `worker.destroy()` para compatibilidad con versiones anteriores.

Ten en cuenta que dentro de un worker, existe `process.kill()`, pero no es esta función, es [`kill`][].

### worker.process
<!-- YAML
added: v0.7.0
-->

* {ChildProcess}

Todos los workers son creados usando [`child_process.fork()`][], el objeto devuelto de esta función se almacena como `.process`. En un worker, es guardado el `process` global.

Ver: [Child Process module](child_process.html#child_process_child_process_fork_modulepath_args_options)

Tenga en cuenta que los workers van a llamar a `process.exit(0)` si el evento `'disconnect'` ocurre en `process`, y `.exitedAfterDisconnect` no es `true`. Esto protege contra desconexiones accidentales.

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

### worker.suicide
<!-- YAML
added: v0.7.0
deprecated: v6.0.0
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/3747
    description: Accessing this property will now emit a deprecation warning.
-->

> Estabilidad: 0 - Desaprobado: Utiliza [`worker.exitedAfterDisconnect`][] en su lugar.

Un alias para [`worker.exitedAfterDisconnect`][].

Establecido al llamar `.kill()` o `.disconnect()`. Hasta entonces, es `undefined`.

The boolean `worker.suicide` is used to distinguish between voluntary and accidental exit, the master may choose not to respawn a worker based on this value.

```js
cluster.on('exit', (worker, code, signal) => {
  if (worker.suicide === true) {
    console.log('Oh, it was just voluntary – no need to worry');
  }
});

// matar worker
worker.kill();
```

Este API solo existe para la compatibilidad con versiones anteriores y se eliminará en el futuro.

## Evento: 'disconnect'
<!-- YAML
added: v0.7.9
-->

* `worker` {cluster.Worker}

Emitido después que el canal IPC del worker ha sido desconectado. Esto puede occurrir cuando un worker se cierra con gracia, es matado, o es desconectado manualmente (por ejemplo worker.disconnect()).

Puede existir una demora entre los eventos `'disconnect'` y `'exit'`. Estos eventos pueden ser usados para detectar si el proceso está atascado en una limpieza, o si hay conexiones de vida larga.

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
* `signal`{string} El nombre de la señal (p. ej. `process`) que causó que el proceso muriera.

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

Ver [child_process event: 'exit'](child_process.html#child_process_event_exit).

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

Después de llamar `listen()` desde un worker, cuando el evento `'listening'` es emitido en el servidor, un evento `'listening'` también será emitido en el `cluster` en el maestro.

El manejador de eventos es ejecutado con dos argumentos, el `worker` contiene el objeto worker y el objeto `address` contiene las siguientes propiedades de conexión: `address`, `port` y `addressType`. Esto es muy útil si el worker está escuchando en más de una dirección.

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
* `'udp4'` or `'udp6'` (UDP v4 or v6)

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

Ver [evento child_process: 'message'](child_process.html#child_process_event_message).

Antes de Node.js v6.0, este evento emitía solo el mensaje y el handle, pero no el objeto worker, al contrario de lo que decía la documentación.

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

Después de bifurcar un nuevo worker, el worker debería responder con un mensaje en línea. Cuando el maestro reciba un mensaje en línea, va a emitir este evento. La diferencia entre `'fork'` y `'online'` es que el evento fork es emitido cuando el mestro bifurca un worker, y 'online' es emitido cuando el worker está ejecutado.

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

El objeto `settings` es el objeto `cluster.settings` al momento que `.setupMaster()` fue llamado y solo es consultivo, ya que pueden hacerse varias llamadas a `.setupMaster()` en un solo tic.

Si la precisión es importante, usa `cluster.settings`.

## cluster.disconnect([callback])
<!-- YAML
added: v0.7.7
-->

* `callback` {Function} Llame cuando todos los workers están desconectados y los handles están cerrados.

Llama a `.disconnect()` en cada worker en `cluster.workers`.

Cuando son desconectados, todos los handles internos serán cerrados, permitiendo al proceso maestro morir con gracia si ningún otro evento está esperando.

El método toma un argumento callback opcional que va a ser llamado cuando haya terminado.

Esto solo puede ser llamado del proceso maestro.

## cluster.fork([env])
<!-- YAML
added: v0.6.0
-->

* `env` {Object} Llave/valor conecta para añadir el ambiente del proceso.
* Devuelve: {cluster.Worker}

Genera un nuevo proceso worker.

Esto solo puede ser llamado del proceso maestro.

## cluster.isMaster
<!-- YAML
added: v0.8.1
-->

* {boolean}

Verdadero si el proceso es un maestro. Esto es determinado por `process.env.NODE_UNIQUE_ID`. Si `process.env.NODE_UNIQUE_ID` está sin definir, entonces `isMaster` es `true`.

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

`SCHED_RR` es el predeterminado en todos los sistemas operativos menos Windows. Windows cambiará a `SCHED_RR` una vez libuv sea capaz de distribuir handles IOCP, sin incurrir en golpes fuertes en el rendimiento.

`cluster.schedulingPolicy` también puede ser configurada a través de la variable de ambiente `NODE_CLUSTER_SCHED_POLICY`. Los valores válidos son `'rr'` y `'none'`.

## cluster.settings
<!-- YAML
added: v0.7.1
changes:
  - version: v8.12.0
    pr-url: https://github.com/nodejs/node/pull/18399
    description: The `cwd` option is supported now.
  - version: v8.12.0
    pr-url: https://github.com/nodejs/node/pull/17412
    description: The `windowsHide` option is supported now.
  - version: 8.2.0
    pr-url: https://github.com/nodejs/node/pull/14140
    description: The `inspectPort` option is supported now.
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7838
    description: The `stdio` option is supported now.
-->

* {Object}
  * `execArgv` {Array} List of string arguments passed to the Node.js executable. **Predeterminado:** `process.execArgv`.
  * `exec` {string} Ruta del archivo al archivo worker. **Predeterminado:** `process.argv[1]`.
  * `args` {Array} String arguments passed to worker. **Predeterminado:** `process.argv.slice(2)`.
  * `cwd` {string} Directorio del proceso worker actualmente operativo. **Default:** `undefined` (heredados del proceso primario).
  * `silent` {boolean} Sea enviar la salida a stdio secundario o no hacerlo. **Predeterminado:** `false`.
  * `stdio` {Array} Configura el stdio de procesos bifurcados. Porque el módulo clúster depende del IPC para funcionar, esta configuración debe contener una entrada `'ipc'`. Cuando se proporciona esta opción, se anula `silent`.
  * `uid` {number} Establece la identidad del usuario del proceso. (Ver setuid(2).)
  * `gid` {number} Establece la identidad del grupo del proceso. (Ver setgid(2).)
  * `inspectPort` {number|Function} Establece puerto inspector del worker. Esto puede ser un número o una función que no toma ningún argumento y devuelve un número. De manera predeterminada, cada worker tiene su propio puerto, incrementado desde el `process.debugPort` del maestro.
  * `windowsHide` {boolean} Oculta la ventana de consola de los procesos bifurcados que normalmente estaría creada en sistemas Windows. **Predeterminado:** `false`.

Después de llamar a `.setupMaster()` (o `.fork()`), este objeto de configuraciones contendrá las configuraciones, incluyendo los valores predeterminados.

Este objeto no está diseñado para ser cambiado o ajustado manualmente.

## cluster.setupMaster([settings])
<!-- YAML
added: v0.7.1
changes:
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7838
    description: The `stdio` option is supported now.
-->

* `settings` {Object} see [`cluster.settings`][]

`setupMaster` es usado para cambiar el comportamiento predeterminado de 'bifurcar'. Una vez llamado, las configuraciones estarán presentes en `cluster.settings`.

Tenga en cuenta que:

* Cualquier cambio en las configuraciones solo afecta a futuras llamadas a `.fork()` y no tiene ningún efecto en workers que ya estén en ejecución.
* El *único* atributo de un worker que no se puede establecer mediante `.setupMaster()` es el `env` pasado a `.fork()`.
* Los valores predeterminados anteriores aplican solo a la primera llamada, los predeterminados para llamadas posteriores son los valores en el momento que `cluster.setupMaster()` es llamado.

Ejemplo:

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

Esto solo puede ser llamado del proceso maestro.

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

Un worker es removido de cluster.workers después de que el worker se ha desconectado _y_ cerrado. El orden entre estos dos eventos no puede ser determinado de antemano. Sin embargo, se garantiza que la eliminación desde la lista cluster.workers ocurre antes de que el último evento `'disconnect'` o `'exit'` sea emitido.

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
