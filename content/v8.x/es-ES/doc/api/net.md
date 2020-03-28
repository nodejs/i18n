# Net

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

The `net` module provides an asynchronous network API for creating stream-based TCP or [IPC](#net_ipc_support) servers ([`net.createServer()`][]) and clients ([`net.createConnection()`][]).

Puede ser accedido utilizando:

```js
const net = require('net');
```

## Soporte IPC

The `net` module supports IPC with named pipes on Windows, and UNIX domain sockets on other operating systems.

### Identificando las rutas para las conexiones IPC

[`net.connect()`][], [`net.createConnection()`][], [`server.listen()`][] and [`socket.connect()`][] take a `path` parameter to identify IPC endpoints.

En UNIX, el dominio local es también conocido como el dominio UNIX. La ruta es un nombre de ruta del sistema de archivos. It gets truncated to `sizeof(sockaddr_un.sun_path) - 1`, which varies on different operating system between 91 and 107 bytes. Los valores típicos son 107 en Linux y 103 en macOS. The path is subject to the same naming conventions and permissions checks as would be done on file creation. It will be visible in the filesystem, and will *persist until unlinked*.

En Windows, el dominio local es implementado usando un pipe que ya tiene nombre. La ruta *debe* referir a una entrada en `\\?\pipe` o `\\.\pipe`. Se permite cualquier carácter, pero este último puede realizar algún procesamiento de nombres de pipes, como la resolución de las secuencias `..`. A pesar de las apariencias, el espacio del nombre de la pipe es plano. Las pipes *no persistirán*, se eliminan cuando se cierra la última referencia a ellos. No olvide que el escape de strings de JavaScript requiere que las rutas se especifiquen con doble barra diagonal inversa, como:

```js
net.createServer().listen(
  path.join('\\\\?\\pipe', process.cwd(), 'myctl'));
```

## Clase: net.Server

<!-- YAML
added: v0.1.90
-->

Esta clase es usada para crear un servidor TCP o [IPC](#net_ipc_support).

### new net.Server(\[options\]\[, connectionListener\])

* Devuelve: {net.Server}

Vea [`net.createServer([options][, connectionListener])`][`net.createServer()`].

`net.Server` es un [`EventEmitter`][] con los siguientes eventos:

### Evento: 'close'

<!-- YAML
added: v0.5.0
-->

Emitido cuando el servidor se cierra. Tenga en cuenta que si existen conexiones, este evento no se emitirá hasta que se terminen todas las conexiones.

### Evento: 'connection'

<!-- YAML
added: v0.1.90
-->

* {net.Socket} El objeto de conexión

Emitido cuando se hace una nueva conexión. `socket` es una instancia de `net.Socket`.

### Evento: 'error'

<!-- YAML
added: v0.1.90
-->

* {Error}

Emitido cuando ocurre un error. A diferencia de [`net.Socket`][], el evento [`'close'`][] **no** se emitirá directamente después de este evento a menos que [`server.close()`][] sea llamado manualmente. See the example in discussion of [`server.listen()`][].

### Evento: 'listening'

<!-- YAML
added: v0.1.90
-->

Emitido cundo el servidor ha sido enlazado después de llamar a [`server.listen()`][].

### server.address()

<!-- YAML
added: v0.1.90
-->

Devuelve la dirección enlazada, el nombre de la familia de la dirección y el puerto del servidor según lo informado por el sistema operativo si se escucha en un socket IP. Es útil para encontrar qué puerto se asignó al obtener una dirección asignada por el sistema operativo. Devuelve un objeto con las propiedades `port`, `family` y `address`: `{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`

Para un servidor que escucha en un pipe o un socket de dominio UNIX, el nombre se devuelve como una string.

Ejemplo:

```js
const server = net.createServer((socket) => {
  socket.end('goodbye\n');
}).on('error', (err) => {
  // errores del handle aquí
  throw err;
});

// agarra un puerto sin usar arbitrario.
server.listen(() => {
  console.log('opened server on', server.address());
});
```

No llames a `server.address()` hasta que el evento `'listening'` haya sido emitido.

### server.close([callback])

<!-- YAML
added: v0.1.90
-->

* Devuelve: {net.Server}

Evita que el servidor acepte nuevas conexiones y mantiene las conexiones existentes. Esta función es asíncrona, el servidor finalmente se cierra cuando todas las conexiones se terminan y el servidor emite un evento [`'close'`][]. El `callback` opcional será llamado una vez el evento `'close'` ocurra. A diferencia de ese evento, se llamará con un Error como su único argumento si el servidor no estaba abierto cuando se cerró.

Devuelve `server`.

### server.connections

<!-- YAML
added: v0.2.0
deprecated: v0.9.7
-->

> Estabilidad: 0 - Desaprobado: Use [`server.getConnections()`][] en su lugar.

El número de conexiones simultáneas en el servidor.

Esto se convierte en `null` cuando se envía un socket a un proceso secundario con [`child_process.fork()`][]. To poll forks and get current number of active connections use asynchronous [`server.getConnections()`][] instead.

### server.getConnections(callback)

<!-- YAML
added: v0.9.7
-->

* Devuelve: {net.Server}

Obtiene el número de conexiones simultáneas en el servidor de forma asincrónica. Funciona cuando los sockets han sido enviados a las bifurcaciones.

El callback debería tomar dos argumentos, `err` y `count`.

### server.listen()

Inicia un servidor escuchando conexiones. A `net.Server` can be a TCP or a [IPC](#net_ipc_support) server depending on what it listens to.

Firmas posibles:

* [`server.listen(handle[, backlog][, callback])`][`server.listen(handle)`]
* [`server.listen(options[, callback])`][`server.listen(options)`]
* [`server.listen(path[, backlog][, callback])`][`server.listen(path)`] for [IPC](#net_ipc_support) servers
* [`server.listen([port][, host][, backlog][, callback])`][`server.listen(port, host)`] for TCP servers

Esta función es asíncrona. When the server starts listening, the [`'listening'`][] event will be emitted. El último parámetro `callback` se agregará como un listener para el evento [`'listening'`][].

All `listen()` methods can take a `backlog` parameter to specify the maximum length of the queue of pending connections. The actual length will be determined by the OS through sysctl settings such as `tcp_max_syn_backlog` and `somaxconn` on Linux. El valor predeterminado de este parámetro es 511 (no 512).

*Nota*:

* All [`net.Socket`][] are set to `SO_REUSEADDR` (See [socket(7)](http://man7.org/linux/man-pages/man7/socket.7.html) for details).

* The `server.listen()` method may be called multiple times. Cada llamada subsiguiente *volverá a abrir* el servidor usando las opciones provistas.

Uno de los errores más comunes cuando se escucha es `EADDRINUSE`. This happens when another server is already listening on the requested `port` / `path` / `handle`. One way to handle this would be to retry after a certain amount of time:

```js
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log('Address in use, retrying...');
    setTimeout(() => {
      server.close();
      server.listen(PORT, HOST);
    }, 1000);
  }
});
```

#### server.listen(handle\[, backlog\]\[, callback\])

<!-- YAML
added: v0.5.10
-->

* `handle` {Object}
* `backlog` {number} Parámetro común de las funciones [`server.listen()`][]
* `callback` {Function} Parámetro común de las funciones [`server.listen()`][]
* Devuelve: {net.Server}

Start a server listening for connections on a given `handle` that has already been bound to a port, a UNIX domain socket, or a Windows named pipe.

The `handle` object can be either a server, a socket (anything with an underlying `_handle` member), or an object with an `fd` member that is a valid file descriptor.

*Note*: Listening on a file descriptor is not supported on Windows.

#### server.listen(options[, callback])

<!-- YAML
added: v0.11.14
-->

* `options` {Object} Requerido. Soporta las siguientes propiedades: 
  * `port` {number}
  * `host` {string}
  * `path` {string} Será ignorado si se especifica el `port`. See [Identifying paths for IPC connections](#net_identifying_paths_for_ipc_connections).
  * `backlog` {number} Common parameter of [`server.listen()`][] functions.
  * `exclusive` {boolean} **Predeterminado:** `false`
* `callback` {Function} Common parameter of [`server.listen()`][] functions.
* Devuelve: {net.Server}

If `port` is specified, it behaves the same as [`server.listen([port][, hostname][, backlog][, callback])`][`server.listen(port, host)`]. Otherwise, if `path` is specified, it behaves the same as [`server.listen(path[, backlog][, callback])`][`server.listen(path)`]. Si ninguno es especificado, se producirá un error.

Si `exclusive` es `false` (predeterminado), los workers del clúster usarán el mismo identificador subyacente, lo que permitirá compartir las tareas de manejo de la conexión. Cuando `exclusive` es `true`, el manejador no se comparte y el intento de compartir el puerto produce un error. Un ejemplo que escucha en un puerto exclusivo es mostrado a continuación.

```js
server.listen({
  host: 'localhost',
  port: 80,
  exclusive: true
});
```

#### server.listen(path\[, backlog\]\[, callback\])

<!-- YAML
added: v0.1.90
-->

* `path` {string} La ruta que el servidor debería escuchar. See [Identifying paths for IPC connections](#net_identifying_paths_for_ipc_connections).
* `backlog` {number} Párametro común de las funciones [`server.listen()`][].
* `callback` {Function} Parámetro común de las funciones [`server.listen()`][].
* Devuelve: {net.Server}

Start a [IPC](#net_ipc_support) server listening for connections on the given `path`.

#### server.listen(\[port\]\[, host\]\[, backlog\]\[, callback\])

<!-- YAML
added: v0.1.90
-->

* `port` {number}
* `host` {string}
* `backlog` {number} Parámetro común de las funciones [`server.listen()`][].
* `callback` {Function} Parámetro común de las funciones [`server.listen()`][].
* Devuelve: {net.Server}

Inicia un servidor TCP que escucha por conexiones en un `port` y `host` dados.

If `port` is omitted or is 0, the operating system will assign an arbitrary unused port, which can be retrieved by using `server.address().port` after the [`'listening'`][] event has been emitted.

If `host` is omitted, the server will accept connections on the [unspecified IPv6 address](https://en.wikipedia.org/wiki/IPv6_address#Unspecified_address) (`::`) when IPv6 is available, or the [unspecified IPv4 address](https://en.wikipedia.org/wiki/0.0.0.0) (`0.0.0.0`) otherwise.

*Note*: In most operating systems, listening to the [unspecified IPv6 address](https://en.wikipedia.org/wiki/IPv6_address#Unspecified_address) (`::`) may cause the `net.Server` to also listen on the [unspecified IPv4 address](https://en.wikipedia.org/wiki/0.0.0.0) (`0.0.0.0`).

### server.listening

<!-- YAML
added: v5.7.0
-->

Un Booleano que indica si el servidor está escuchando conexiones o no.

### server.maxConnections

<!-- YAML
added: v0.2.0
-->

Establezca esta propiedad para rechazar las conexiones cuando el recuento de conexiones del servidor sea alto.

No se recomienda usar esta opción una vez que se haya enviado un socket a un proceso secundario con [`child_process.fork()`][].

### server.ref()

<!-- YAML
added: v0.9.1
-->

* Devuelve: {net.Server}

Opuesto a `unref`, llamar a `ref` en un servidor de `unaref` previo *no* dejará que el programa salga si es el único servidor restante (el comportamiento predeterminado). Si el servidor es `ref`d, volver a llamar a `ref` no tendrá efecto.

### server.unref()

<!-- YAML
added: v0.9.1
-->

* Devuelve: {net.Server}

Llamar a `unref` en un servidor permitirá que el programa salga si este es el único servidor activo en el sistema de eventos. Si el servidor ya fue `unref`d llamar a `unref` nuevamente no tendrá efecto.

## Clase: net.Socket

<!-- YAML
added: v0.3.4
-->

This class is an abstraction of a TCP socket or a streaming [IPC](#net_ipc_support) endpoint (uses named pipes on Windows, and UNIX domain sockets otherwise). A `net.Socket` is also a [duplex stream](stream.html#stream_class_stream_duplex), so it can be both readable and writable, and it is also a [`EventEmitter`][].

A `net.Socket` can be created by the user and used directly to interact with a server. For example, it is returned by [`net.createConnection()`][], so the user can use it to talk to the server.

It can also be created by Node.js and passed to the user when a connection is received. For example, it is passed to the listeners of a [`'connection'`][] event emitted on a [`net.Server`][], so the user can use it to interact with the client.

### new net.Socket([options])

<!-- YAML
added: v0.3.4
-->

Crea un nuevo objeto socket.

* `options` {Object} Las opciones disponibles son: 
  * `fd`: {number} If specified, wrap around an existing socket with the given file descriptor, otherwise a new socket will be created.
  * `allowHalfOpen` {boolean} Indicates whether half-opened TCP connections are allowed. See [`net.createServer()`][] and the [`'end'`][] event for details. **Predeterminado:** `false`.
  * `readable` {boolean} Allow reads on the socket when an `fd` is passed, otherwise ignored. **Predeterminado:** `false`.
  * `writable` {boolean} Allow writes on the socket when an `fd` is passed, otherwise ignored. **Predeterminado:** `false`.
* Devuelve: {net.Socket}

The newly created socket can be either a TCP socket or a streaming [IPC](#net_ipc_support) endpoint, depending on what it [`connect()`][`socket.connect()`] to.

### Evento: 'close'

<!-- YAML
added: v0.1.90
-->

* `had_error` {boolean} `true` si el socket tiene un error de transmisión.

Emitido una vez que el socket esté completamente cerrado. El argumento `had_error` es un booleano que indica si el socket se cerró debido a un error de transmisión.

### Evento: 'connect'

<!-- YAML
added: v0.1.90
-->

Emitido cuando una conexión del socket es establecida con éxito. Vea [`net.createConnection()`][].

### Evento: 'data'

<!-- YAML
added: v0.1.90
-->

* {Buffer}

Emitido cuando los datos son recibidos. El argumento `data` será un `Buffer` o `String`. La codificación de los datos es establecida por `socket.setEncoding()`. (Consulte la sección [Stream Legible](stream.html#stream_class_stream_readable) para obtener más información.)

Tenga en cuenta que **se perderán datos** si no hay un listener cuando un `Socket` emita un evento `'data'`.

### Evento: 'drain'

<!-- YAML
added: v0.1.90
-->

Emitido cuando el búfer de escritura se vacía. Se puede usar para acelerar subidas.

Ver también: los valores de retorno de `socket.write()`

### Evento: 'end'

<!-- YAML
added: v0.1.90
-->

Emitted when the other end of the socket sends a FIN packet, thus ending the readable side of the socket.

By default (`allowHalfOpen` is `false`) the socket will send a FIN packet back and destroy its file descriptor once it has written out its pending write queue. However, if `allowHalfOpen` is set to `true`, the socket will not automatically [`end()`][`socket.end()`] its writable side, allowing the user to write arbitrary amounts of data. The user must call [`end()`][`socket.end()`] explicitly to close the connection (i.e. sending a FIN packet back).

### Evento: 'error'

<!-- YAML
added: v0.1.90
-->

* {Error}

Emitido cuando ocurre un error. El evento `'close'` será llamado directamente siguiendo este evento.

### Evento: 'lookup'

<!-- YAML
added: v0.11.3
changes:

  - version: v5.10.0
    pr-url: https://github.com/nodejs/node/pull/5598
    description: The `host` parameter is supported now.
-->

Emitido después de resolver el nombre del host pero antes de conectar. No es aplicable a sockets UNIX.

* `err` {Error|null} El objeto error. Vea [`dns.lookup()`][].
* `address` {string} La dirección IP.
* `family` {string|null} El tipo de dirección. Vea [`dns.lookup()`][].
* `host` {string} El nombre del host.

### Evento: 'timeout'

<!-- YAML
added: v0.1.90
-->

Emitido si el socket agota el tiempo de espera por inactividad. Esto es solo para notificar que el socket ha estado inactivo. El usuario debe cerrar la conexión manualmente.

Vea también: [`socket.setTimeout()`][]

### socket.address()

<!-- YAML
added: v0.1.90
-->

Devuelve la dirección enlazada, el nombre de la familia de la dirección y el puerto del socket según lo informado por el sistema operativo. Devuelve un objeto con tres propiedades, por ejemplo, `{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`

### socket.bufferSize

<!-- YAML
added: v0.3.8
-->

`net.Socket` tiene la propiedad que `socket.write()` siempre funciona. Esto es para ayudar a los usuarios a ponerse en marcha rápidamente. La computadora no siempre puede mantenerse al día con la cantidad de datos que se escriben en un socket - la conexión de red simplemente puede ser demasiado lenta. Node.js internamente pondrá en cola los datos escritos en un socket y los enviará a través del cable cuando sea posible. (Internamente, está sondeando en el descriptor de archivo del socket para que se pueda escribir).

La consecuencia de este búfer interno es que la memoria puede crecer. Esta propiedad muestra el número de caracteres actualmente almacenados para ser escritos. (El número de caracteres es aproximadamente igual al número de bytes que se escribirán, pero el búfer puede contener strings, y las strings están codificadas de forma perezosa, por lo que no se conoce el número exacto de bytes.)

Users who experience large or growing `bufferSize` should attempt to "throttle" the data flows in their program with [`socket.pause()`][] and [`socket.resume()`][].

### socket.bytesRead

<!-- YAML
added: v0.5.3
-->

La cantidad de bytes recibidos.

### socket.bytesWritten

<!-- YAML
added: v0.5.3
-->

La cantidad de bytes enviados.

### socket.connect()

Inicia una conexión en un socket dado.

Firmas posibles:

* [socket.connect(options[, connectListener])][`socket.connect(options)`]
* [socket.connect(path[, connectListener])][`socket.connect(path)`] for [IPC](#net_ipc_support) connections.
* \[socket.connect(port[, host\]\[, connectListener\])][`socket.connect(port, host)`] for TCP connections.
* Devuelve: {net.Socket} El socket en sí.

Esta función es asíncrona. When the connection is established, the [`'connect'`][] event will be emitted. If there is a problem connecting, instead of a [`'connect'`][] event, an [`'error'`][] event will be emitted with the error passed to the [`'error'`][] listener. The last parameter `connectListener`, if supplied, will be added as a listener for the [`'connect'`][] event **once**.

#### socket.connect(options[, connectListener])

<!-- YAML
added: v0.1.90
changes:

  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/6021
    description: The `hints` option defaults to `0` in all cases now.
                 Previously, in the absence of the `family` option it would
                 default to `dns.ADDRCONFIG | dns.V4MAPPED`.
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/6000
    description: The `hints` option is supported now.
-->

* `opciones` {Object}
* `connectListener` {Function} Common parameter of [`socket.connect()`][] methods. Será añadido una vez como un listener para el evento [`'connect'`][].
* Devuelve: {net.Socket} El socket en sí.

Inicia una conexión en un socket dado. Normally this method is not needed, the socket should be created and opened with [`net.createConnection()`][]. Use this only when implementing a custom Socket.

Para conexiones TCP, los `options` son:

* `port` {number} Requerido. El puerto al que el socket debería conectarse.
* `host` {string} Host al que el socket debería conectarse. **Predeterminado:** `'localhost'`.
* `localAddress` {string} Las direcciones locales a las que el socket debería conectarse.
* `localPort` {number} Puerto local al que el socket debería conectarse.
* `family` {number}: Versión del IP stack, puede ser `4` o `6`. **Predeterminado:** `4`.
* `hints` {number} [`dns.lookup()` hints][] Opcional.
* `lookup` {Function} Función de búsqueda personalizada. **Predeterminado:** [`dns.lookup()`][].

Para las conexiones [IPC](#net_ipc_support), los `options` disponibles son:

* `path` {string} Requerido. Rutas al que el cliente debe conectarse. Vea [Identificando rutas para conexiones ICP](#net_identifying_paths_for_ipc_connections). If provided, the TCP-specific options above are ignored.

Devuelve `socket`.

#### socket.connect(path[, connectListener])

* `path` {string} Ruta al que el cliente debe conectarse. See [Identifying paths for IPC connections](#net_identifying_paths_for_ipc_connections).
* `connectListener` {Function} Common parameter of [`socket.connect()`][] methods. Será añadido una vez como un listener para el evento [`'connect'`][].
* Devuelve: {net.Socket} El socket en sí.

Inicia una conexión [IPC](#net_ipc_support) en el socket dado.

Alias to [`socket.connect(options[, connectListener])`][`socket.connect(options)`] called with `{ path: path }` as `options`.

Devuelve `socket`.

#### socket.connect(port\[, host\]\[, connectListener\])

<!-- YAML
added: v0.1.90
-->

* `port` {number} Puerto al que el cliente debe conectarse.
* `host` {string} Servidor al que el cliente debe conectarse.
* `connectListener` {Function} Common parameter of [`socket.connect()`][] methods. Será añadido una vez como un listener para el evento [`'connect'`][].
* Devuelve: {net.Socket} El socket en sí.

Inicia una conexión TCP en el socket dado.

Alias to [`socket.connect(options[, connectListener])`][`socket.connect(options)`] called with `{port: port, host: host}` as `options`.

Devuelve `socket`.

### socket.connecting

<!-- YAML
added: v6.1.0
-->

If `true` - [`socket.connect(options[, connectListener])`][`socket.connect(options)`] was called and haven't yet finished. Will be set to `false` before emitting `connect` event and/or calling [`socket.connect(options[, connectListener])`][`socket.connect(options)`]'s callback.

### socket.destroy([exception])

<!-- YAML
added: v0.1.90
-->

* Devuelve: {net.Socket}

Asegura que ninguna actividad I/O ocurra en este socket. Solo es necesario en caso de errores (error de análisis o algo así).

Si se especifica `exception`, se emitirá un evento [`'error'`][] y todos los listeners de ese evento recibirán `exception` como un argumento.

### socket.destroyed

Un valor Booleano que indica si la conexión se destruye o no. Una vez que se destruye una conexión, no se pueden transferir más datos al usarla.

### socket.end(\[data\]\[, encoding\])

<!-- YAML
added: v0.1.90
-->

* Devuelve: {net.Socket} El socket en sí.

Entrecierra el socket. p. ej., envía un paquete FIN. Es posible que el servidor todavía envíe algunos datos.

If `data` is specified, it is equivalent to calling `socket.write(data, encoding)` followed by [`socket.end()`][].

### socket.localAddress

<!-- YAML
added: v0.9.6
-->

La representación de string de la dirección IP local en la que se está conectando el cliente remoto. For example, in a server listening on `'0.0.0.0'`, if a client connects on `'192.168.1.1'`, the value of `socket.localAddress` would be `'192.168.1.1'`.

### socket.localPort

<!-- YAML
added: v0.9.6
-->

La representación numérica del puerto local. Por ejemplo `80` o `21`.

### socket.pause()

* Devuelve: {net.Socket} El socket en sí.

Pausa los datos que se están leyendo. Es decir, los eventos [`'data'`][] no serán emitidos. Útil para acelerar una subida.

### socket.ref()

<!-- YAML
added: v0.9.1
-->

* Devuelve: {net.Socket} El socket en sí.

Al contrario de `unref`, llamar a `ref` en un socket `unref` anteriormente, *no* permitirá que el programa salga si es el único socket que queda (el comportamiento predeterminado). Si el socket es `ref`d, llamar a `ref` nuevamente no tendrá efecto.

### socket.remoteAddress

<!-- YAML
added: v0.5.10
-->

La representación en string de la dirección IP remota. Por ejemplo, `'74.125.127.100'` o `'2001:4860:a005::68'`. El valor puede ser `undefined` si el socket se destruye (por ejemplo, si el cliente se desconectó).

### socket.remoteFamily

<!-- YAML
added: v0.11.14
-->

La representación en string de la familia IP remota. `'IPv4'` or `'IPv6'`.

### socket.remotePort

<!-- YAML
added: v0.5.10
-->

La representación numérica del puerto remoto. Por ejemplo `80` o `21`.

### socket.resume()

* Devuelve: {net.Socket} El socket en sí.

Reanuda la lectura después de llamar a [`socket.pause()`][].

### socket.setEncoding([encoding])

<!-- YAML
added: v0.1.90
-->

* Devuelve: {net.Socket} El socket en sí.

Establece la codificación para el socket como una [Stream Legible](stream.html#stream_class_stream_readable). Vea [`stream.setEncoding()`][] para más información.

### socket.setKeepAlive(\[enable\]\[, initialDelay\])

<!-- YAML
added: v0.1.92
-->

* `enable` {boolean} **Predeterminado:** `false`
* `initialDelay` {number} **Predeterminado:** `0`
* Devuelve: {net.Socket} El socket en sí.

Activa/desactiva la funcionalidad keep-alive y, opcionalmente, establece el retraso inicial antes de que la primera sonda keepalive se envíe en un socket inactivo.

Establece `initialDelay` (en milisegundos) para establecer el retraso entre el último paquete de datos recibido y la primera sonda de keepalive. Configurar como 0 a initialDelay dejará el valor sin cambios de la configuración predeterminada (o anterior).

### socket.setNoDelay([noDelay])

<!-- YAML
added: v0.1.90
-->

* `noDelay` {boolean} **Predeterminado:** `true`
* Devuelve: {net.Socket} El socket en sí.

Desactiva el algoritmo Nagle. Por defecto, las conexiones TCP usan el algoritmo de Nagle, almacenan los datos antes de enviarlos. Configurar como `true` a `noDelay` disparará los datos inmediatamente cada vez que se llame a `socket.write()`.

### socket.setTimeout(timeout[, callback])

<!-- YAML
added: v0.1.90
-->

* Devuelve: {net.Socket} El socket en sí.

Establece el socket en tiempo de espera después de `timeout` milisegundos de inactividad en el socket. De manera predeterminada, el `net.Socket` no tiene un timeout.

Cuando se desencadena un tiempo de espera inactivo, el socket recibirá un evento [`'timeout'`][] pero la conexión no se cortará. The user must manually call [`socket.end()`][] or [`socket.destroy()`][] to end the connection.

```js
socket.setTimeout(3000);
socket.on('timeout', () => {
  console.log('socket timeout');
  socket.end();
});
```

Si el `timeout` es 0, el timeout existente en espera es desactivado.

El parámetro opcional `callback` se agregará como un listener de una sola vez para el evento [`'timeout'`][].

### socket.unref()

<!-- YAML
added: v0.9.1
-->

* Devuelve: {net.Socket} El socket en sí.

Llamar a `unref` en un socket permitirá que el programa salga si este es el único socket activo en el sistema de eventos. Si el socket ya está `unref`d llamando a `unref` de nuevo, no tendrá ningún efecto.

### socket.write(data\[, encoding\]\[, callback\])

<!-- YAML
added: v0.1.90
-->

Envía los datos en el scoket. El segundo parámetro especifica la codificación en el caso de una string — por defecto es la codificación UTF8.

Devuelve como `true` si todos los datos fueron arrojados con éxito al búfer del núcleo. Devuelve `false` si todos o parte de los datos fueron puestos en cola en la memoria del usuario. [`'drain'`][] será emitido cuando el búfer esté libre de nuevo.

El parámetro opcional `callback` se ejecutará cuando los datos finalmente se escriban - esto puede no ser inmediato.

## net.connect()

Aliases to [`net.createConnection()`][`net.createConnection()`].

Firmas posibles:

* [`net.connect(options[, connectListener])`][`net.connect(options)`]
* [`net.connect(path[, connectListener])`][`net.connect(path)`] for [IPC](#net_ipc_support) connections.
* [`net.connect(port[, host][, connectListener])`][`net.connect(port, host)`] for TCP connections.

### net.connect(options[, connectListener])

<!-- YAML
added: v0.7.0
--> Alias to [

`net.createConnection(options[, connectListener])`][`net.createConnection(options)`].

### net.connect(path[, connectListener])

<!-- YAML
added: v0.1.90
-->

Alias to [`net.createConnection(path[, connectListener])`][`net.createConnection(path)`].

### net.connect(port\[, host\]\[, connectListener\])

<!-- YAML
added: v0.1.90
-->

Alias to [`net.createConnection(port[, host][, connectListener])`][`net.createConnection(port, host)`].

## net.createConnection()

A factory function, which creates a new [`net.Socket`][], immediately initiates connection with [`socket.connect()`][], then returns the `net.Socket` that starts the connection.

When the connection is established, a [`'connect'`][] event will be emitted on the returned socket. The last parameter `connectListener`, if supplied, will be added as a listener for the [`'connect'`][] event **once**.

Firmas posibles:

* [`net.createConnection(options[, connectListener])`][`net.createConnection(options)`]
* [`net.createConnection(path[, connectListener])`][`net.createConnection(path)`] for [IPC](#net_ipc_support) connections.
* [`net.createConnection(port[, host][, connectListener])`][`net.createConnection(port, host)`] for TCP connections.

*Note*: The [`net.connect()`][] function is an alias to this function.

### net.createConnection(options[, connectListener])

<!-- YAML
added: v0.1.90
-->

* `options` {Object} Requerido. Will be passed to both the [`new net.Socket([options])`][`new net.Socket(options)`] call and the [`socket.connect(options[, connectListener])`][`socket.connect(options)`] method.
* `connectListener` {Function} Common parameter of the [`net.createConnection()`][] functions. If supplied, will be added as a listener for the [`'connect'`][] event on the returned socket once.
* Devuelve: {net.Socket} El socket recién creado usado para iniciar la conexión.

For available options, see [`new net.Socket([options])`][`new net.Socket(options)`] and [`socket.connect(options[, connectListener])`][`socket.connect(options)`].

Opciones adicionales:

* `timeout` {number} If set, will be used to call [`socket.setTimeout(timeout)`][] after the socket is created, but before it starts the connection.

A continuación se muestra un ejemplo de un cliente del servidor echo descrito en la sección [`net.createServer()`][]:

```js
const net = require('net');
const client = net.createConnection({ port: 8124 }, () => {
  //listener 'connect'
  console.log('connected to server!');
  client.write('world!\r\n');
});
client.on('data', (data) => {
  console.log(data.toString());
  client.end();
});
client.on('end', () => {
  console.log('disconnected from server');
});
```

Para conectar en el socket `/tmp/echo.sock`, la segunda línea se cambiará a

```js
const client = net.createConnection({ path: '/tmp/echo.sock' });
```

### net.createConnection(path[, connectListener])

<!-- YAML
added: v0.1.90
-->

* `path` {string} Ruta a la que el socket debería conectarse. Will be passed to [`socket.connect(path[, connectListener])`][`socket.connect(path)`]. Vea [Identificando rutas para conexiones ICP](#net_identifying_paths_for_ipc_connections).
* `connectListener` {Function} Common parameter of the [`net.createConnection()`][] functions, an "once" listener for the `'connect'` event on the initiating socket. Will be passed to [`socket.connect(path[, connectListener])`][`socket.connect(path)`].
* Devuelve: {net.Socket} El socket recién creado usado para iniciar la conexión.

Inicia una conexión [IPC](#net_ipc_support).

This function creates a new [`net.Socket`][] with all options set to default, immediately initiates connection with [`socket.connect(path[, connectListener])`][`socket.connect(path)`], then returns the `net.Socket` that starts the connection.

### net.createConnection(port\[, host\]\[, connectListener\])

<!-- YAML
added: v0.1.90
-->

* `port` {number} Puerto al que el socket debería conectarse. Will be passed to [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`].
* `host` {string} Host al que el socket debería conectarse. Will be passed to [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`]. **Predeterminado:** `'localhost'`.
* `connectListener` {Function} Common parameter of the [`net.createConnection()`][] functions, an "once" listener for the `'connect'` event on the initiating socket. Will be passed to [`socket.connect(path[, connectListener])`][`socket.connect(port, host)`].
* Devuelve: {net.Socket} El socket recién creado usado para iniciar la conexión.

Inicia una conexión TCP.

This function creates a new [`net.Socket`][] with all options set to default, immediately initiates connection with [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`], then returns the `net.Socket` that starts the connection.

## net.createServer(\[options\]\[, connectionListener\])

<!-- YAML
added: v0.5.0
-->

Crea un nuevo servidor TCP o un servidor [IPC](#net_ipc_support).

* `options` {Object} 
  * `allowHalfOpen` {boolean} Indicates whether half-opened TCP connections are allowed. **Predeterminado:** `false`.
  * `pauseOnConnect` {boolean} Indicates whether the socket should be paused on incoming connections. **Predeterminado:** `false`.
* `connectionListener` {Function} Automatically set as a listener for the [`'connection'`][] event.
* Devuelve: {net.Server}

If `allowHalfOpen` is set to `true`, when the other end of the socket sends a FIN packet, the server will only send a FIN packet back when [`socket.end()`][] is explicitly called, until then the connection is half-closed (non-readable but still writable). See [`'end'`][] event and [RFC 1122](https://tools.ietf.org/html/rfc1122) (section 4.2.2.13) for more information.

If `pauseOnConnect` is set to `true`, then the socket associated with each incoming connection will be paused, and no data will be read from its handle. This allows connections to be passed between processes without any data being read by the original process. To begin reading data from a paused socket, call [`socket.resume()`][].

The server can be a TCP server or a [IPC](#net_ipc_support) server, depending on what it [`listen()`][`server.listen()`] to.

Here is an example of an TCP echo server which listens for connections on port 8124:

```js
const net = require('net');
const server = net.createServer((c) => {
  // 'connection' listener
  console.log('client connected');
  c.on('end', () => {
    console.log('client disconnected');
  });
  c.write('hello\r\n');
  c.pipe(c);
});
server.on('error', (err) => {
  throw err;
});
server.listen(8124, () => {
  console.log('server bound');
});
```

Pruebe esto usando `telnet`:

```console
$ telnet localhost 8124
```

Para escuchar en el socket `/tmp/echo.sock`, la tercera línea de la última se cambiará a

```js
server.listen('/tmp/echo.sock', () => {
  console.log('server bound');
});
```

Use `nc` para conectarse a un servidor de socket de dominio UNIX:

```console
$ nc -U /tmp/echo.sock
```

## net.isIP(input)

<!-- YAML
added: v0.3.0
-->

Comprueba si la entrada es una dirección IP. Devuelve 0 para strings inválidas, devuelve 4 para direcciones IP versión 4 y devuelve 6 para direcciones IP versión 6.

## net.isIPv4(input)

<!-- YAML
added: v0.3.0
-->

Devuelve true si la entrada es una dirección IP de la versión 4; de lo contrario, devuelve false.

## net.isIPv6(input)

<!-- YAML
added: v0.3.0
-->

Devuelve true si la entrada es una dirección IP de la versión 6; de lo contrario, devuelve false.