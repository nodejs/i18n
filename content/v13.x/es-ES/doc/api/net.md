# Net

<!--introduced_in=v0.10.0-->
<!--lint disable maximum-line-length-->

> Estability: 2 - Estable

The `net` module provides an asynchronous network API for creating stream-based TCP or [IPC](#net_ipc_support) servers ([`net.createServer()`][]) and clients ([`net.createConnection()`][]).

Se puede acceder al mismo utilizando:

```js
const net = require('net');
```

## Soporte IPC

The `net` module supports IPC with named pipes on Windows, and Unix domain sockets on other operating systems.

### Identificando las rutas para las conexiones IPC

[`net.connect()`][], [`net.createConnection()`][], [`server.listen()`][] and [`socket.connect()`][] take a `path` parameter to identify IPC endpoints.

On Unix, the local domain is also known as the Unix domain. The path is a filesystem pathname. It gets truncated to an OS-dependent length of `sizeof(sockaddr_un.sun_path) - 1`. Typical values are 107 bytes on Linux and 103 bytes on macOS. If a Node.js API abstraction creates the Unix domain socket, it will unlink the Unix domain socket as well. For example, [`net.createServer()`][] may create a Unix domain socket and [`server.close()`][] will unlink it. But if a user creates the Unix domain socket outside of these abstractions, the user will need to remove it. The same applies when a Node.js API creates a Unix domain socket but the program then crashes. In short, a Unix domain socket will be visible in the filesystem and will persist until unlinked.

En Windows, el dominio local se implementa mediante un pipe con nombre. The path *must* refer to an entry in ``\\?\pipe\` or``\\.\pipe\`. Se permite cualquier carácter, pero este último puede realizar algún procesamiento de nombres de pipes, como la resolución de las secuencias `..`. A pesar de como podría verse, el espacio de nombre pipe es plano. Pipes will *not persist*. Son removidos cuando la última referencia a ellos es cerrada. Unlike Unix domain sockets, Windows will close and remove the pipe when the owning process exits.

JavaScript string escaping requires paths to be specified with extra backslash escaping such as:

```js
net.createServer().listen(
  path.join('\\\\?\\pipe', process.cwd(), 'myctl'));
```

## Class: `net.Server`
<!-- YAML
added: v0.1.90
-->

* Extiende a: {EventEmitter}

Esta clase es usada para crear un servidor TCP o [IPC](#net_ipc_support).

### `new net.Server([options][, connectionListener])`

* `options` {Object} See [`net.createServer([options][, connectionListener])`][`net.createServer()`].
* `connectionListener` {Function} Automatically set as a listener for the [`'connection'`][] event.
* Devuelve: {net.Server}

`net.Server` es un [`EventEmitter`][] con los siguientes eventos:

### Event: `'close'`
<!-- YAML
added: v0.5.0
-->

Se emite cuando el servidor se cierra. If connections exist, this event is not emitted until all connections are ended.

### Event: `'connection'`
<!-- YAML
added: v0.1.90
-->

* {net.Socket} El objeto de conexión

Se emite cuando se hace una nueva conexión. `socket` es una instancia de `net.Socket`.

### Event: `'error'`
<!-- YAML
added: v0.1.90
-->

* {Error}

Se emite cuando ocurre un error. Unlike [`net.Socket`][], the [`'close'`][] event will **not** be emitted directly following this event unless [`server.close()`][] is manually called. See the example in discussion of [`server.listen()`][].

### Event: `'listening'`
<!-- YAML
added: v0.1.90
-->

Emitido cundo el servidor ha sido enlazado después de llamar a [`server.listen()`][].

### `server.address()`
<!-- YAML
added: v0.1.90
-->

* Devuelve: {Object|string}

Returns the bound `address`, the address `family` name, and `port` of the server as reported by the operating system if listening on an IP socket (useful to find which port was assigned when getting an OS-assigned address): `{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`.

For a server listening on a pipe or Unix domain socket, the name is returned as a string.

```js
const server = net.createServer((socket) => {
  socket.end('goodbye\n');
}).on('error', (err) => {
  // Handle errors here.
  throw err;
});

// Grab an arbitrary unused port.
server.listen(() => {
  console.log('opened server on', server.address());
});
```

No llame a `server.address()` hasta que el evento `'listening'` se haya emitido.

### `server.close([callback])`
<!-- YAML
added: v0.1.90
-->

* `callback` {Function} Called when the server is closed.
* Devuelve: {net.Server}

Evita que el servidor acepte nuevas conexiones y mantiene las conexiones existentes. This function is asynchronous, the server is finally closed when all connections are ended and the server emits a [`'close'`][] event. La `callback` opcional será llamada una vez que el evento `'close'` ocurra. Unlike that event, it will be called with an `Error` as its only argument if the server was not open when it was closed.

### `server.connections`
<!-- YAML
added: v0.2.0
deprecated: v0.9.7
-->

> Estabilidad: 0 - Desaprobado: Use [`server.getConnections()`][] en su lugar.

* {integer|null}

El número de conexiones simultáneas en el servidor.

Esto se convierte en `null` cuando se envía un socket a un proceso secundario con [`child_process.fork()`][]. To poll forks and get current number of active connections, use asynchronous [`server.getConnections()`][] instead.

### `server.getConnections(callback)`
<!-- YAML
added: v0.9.7
-->

* `callback` {Function}
* Devuelve: {net.Server}

Obtiene de forma asíncrona el número de conexiones simultáneas en el servidor. Funciona cuando los sockets han sido enviados a las bifurcaciones.

La callback debe tomar dos argumentos: `err` y `count`.

### `server.listen()`

Inicia un servidor escuchando conexiones. A `net.Server` can be a TCP or an [IPC](#net_ipc_support) server depending on what it listens to.

Firmas posibles:

* [`server.listen(handle[, backlog][, callback])`][`server.listen(handle)`]
* [`server.listen(options[, callback])`][`server.listen(options)`]
* [`server.listen(path[, backlog][, callback])`][`server.listen(path)`] for [IPC](#net_ipc_support) servers
* <a href="#net_server_listen_port_host_backlog_callback">
  <code>server.listen([port[, host[, backlog]]][, callback])</code></a>
for TCP servers

Esta función es asincrónica. When the server starts listening, the [`'listening'`][] event will be emitted. El último parámetro `callback` se agregará como un listener para el evento [`'listening'`][].

All `listen()` methods can take a `backlog` parameter to specify the maximum length of the queue of pending connections. The actual length will be determined by the OS through sysctl settings such as `tcp_max_syn_backlog` and `somaxconn` on Linux. El valor predeterminado de este parámetro es 511 (no 512).

All [`net.Socket`][] are set to `SO_REUSEADDR` (see [`socket(7)`][] for details).

The `server.listen()` method can be called again if and only if there was an error during the first `server.listen()` call or `server.close()` has been called. De lo contrario, un error `ERR_SERVER_ALREADY_LISTEN` será arrojado.

Uno de los errores más comunes cuando se escucha es `EADDRINUSE`. This happens when another server is already listening on the requested `port`/`path`/`handle`. One way to handle this would be to retry after a certain amount of time:

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

#### `server.listen(handle[, backlog][, callback])`
<!-- YAML
added: v0.5.10
-->

* `handle` {Object}
* `backlog` {number} Parámetro común de las funciones [`server.listen()`][]
* `callback` {Function}
* Devuelve: {net.Server}

Start a server listening for connections on a given `handle` that has already been bound to a port, a Unix domain socket, or a Windows named pipe.

The `handle` object can be either a server, a socket (anything with an underlying `_handle` member), or an object with an `fd` member that is a valid file descriptor.

Escuchar en un descriptor de archivo no es soportado en Windows.

#### `server.listen(options[, callback])`
<!-- YAML
added: v0.11.14
changes:
  - version: v11.4.0
    pr-url: https://github.com/nodejs/node/pull/23798
    description: The `ipv6Only` option is supported.
-->

* `options` {Object} Requerido. Soporta las siguientes propiedades:
  * `port` {number}
  * `host` {string}
  * `path` {string} Será ignorado si se especifica el `port`. See [Identifying paths for IPC connections](#net_identifying_paths_for_ipc_connections).
  * `backlog` {number} Common parameter of [`server.listen()`][] functions.
  * `exclusive` {boolean} **Default:** `false`
  * `readableAll` {boolean} For IPC servers makes the pipe readable for all users. **Default:** `false`.
  * `writableAll` {boolean} For IPC servers makes the pipe writable for all users. **Default:** `false`.
  * `ipv6Only` {boolean} For TCP servers, setting `ipv6Only` to `true` will disable dual-stack support, i.e., binding to host `::` won't make `0.0.0.0` be bound. **Default:** `false`.
* `callback` {Function}
functions.
* Devuelve: {net.Server}

If `port` is specified, it behaves the same as
<a href="#net_server_listen_port_host_backlog_callback">
<code>server.listen([port[, host[, backlog]]][, callback])</code></a>. Otherwise, if `path` is specified, it behaves the same as [`server.listen(path[, backlog][, callback])`][`server.listen(path)`]. Si ninguno es especificado, se producirá un error.

Si `exclusive` es `false` (predeterminado), los workers del clúster usarán el mismo identificador subyacente, lo que permitirá compartir las tareas de manejo de la conexión. Cuando `exclusive` es `true`, el manejador no se comparte y el intento de compartir el puerto produce un error. Un ejemplo que escucha en un puerto exclusivo es mostrado a continuación.

```js
server.listen({
  host: 'localhost',
  port: 80,
  exclusive: true
});
```

Starting an IPC server as root may cause the server path to be inaccessible for unprivileged users. Using `readableAll` and `writableAll` will make the server accessible for all users.

#### `server.listen(path[, backlog][, callback])`
<!-- YAML
added: v0.1.90
-->

* `path` {string} La ruta que el servidor debería escuchar. See [Identifying paths for IPC connections](#net_identifying_paths_for_ipc_connections).
* `backlog` {number} Párametro común de las funciones [`server.listen()`][].
* `callback` {Function}.
* Devuelve: {net.Server}

Inicia un servidor [IPC](#net_ipc_support) escuchando por conexiones en el `path` dado.

#### `server.listen([port[, host[, backlog]]][, callback])`
<!-- YAML
added: v0.1.90
-->

* `port` {number}
* `host` {string}
* `backlog` {number} Párametro común de las funciones [`server.listen()`][].
* `callback` {Function}.
* Devuelve: {net.Server}

Inicia un servidor TCP que escucha por conexiones en un `port` y `host` dados.

If `port` is omitted or is 0, the operating system will assign an arbitrary unused port, which can be retrieved by using `server.address().port` after the [`'listening'`][] event has been emitted.

If `host` is omitted, the server will accept connections on the [unspecified IPv6 address](https://en.wikipedia.org/wiki/IPv6_address#Unspecified_address) (`::`) when IPv6 is available, or the [unspecified IPv4 address](https://en.wikipedia.org/wiki/0.0.0.0) (`0.0.0.0`) otherwise.

In most operating systems, listening to the [unspecified IPv6 address](https://en.wikipedia.org/wiki/IPv6_address#Unspecified_address) (`::`) may cause the `net.Server` to also listen on the [unspecified IPv4 address](https://en.wikipedia.org/wiki/0.0.0.0) (`0.0.0.0`).

### `server.listening`
<!-- YAML
added: v5.7.0
-->

* {boolean} Indica si el servidor está escuchando a las conexiones o no.

### `server.maxConnections`
<!-- YAML
added: v0.2.0
-->

* {integer}

Establezca esta propiedad para rechazar las conexiones cuando el recuento de conexiones del servidor sea alto.

No se recomienda usar esta opción una vez que se haya enviado un socket a un proceso secundario con [`child_process.fork()`][].

### `server.ref()`
<!-- YAML
added: v0.9.1
-->

* Devuelve: {net.Server}

Opposite of `unref()`, calling `ref()` on a previously `unref`ed server will *not* let the program exit if it's the only server left (the default behavior). Si el servidor fue llamado `ref`, llamar a `ref()` otra vez no tendrá efecto.

### `server.unref()`
<!-- YAML
added: v0.9.1
-->

* Devuelve: {net.Server}

Calling `unref()` on a server will allow the program to exit if this is the only active server in the event system. If the server is already `unref`ed calling `unref()` again will have no effect.

## Class: `net.Socket`
<!-- YAML
added: v0.3.4
-->

* Extiende a: {stream.Duplex}

This class is an abstraction of a TCP socket or a streaming [IPC](#net_ipc_support) endpoint (uses named pipes on Windows, and Unix domain sockets otherwise). It is also an [`EventEmitter`][].

A `net.Socket` can be created by the user and used directly to interact with a server. For example, it is returned by [`net.createConnection()`][], so the user can use it to talk to the server.

It can also be created by Node.js and passed to the user when a connection is received. For example, it is passed to the listeners of a [`'connection'`][] event emitted on a [`net.Server`][], so the user can use it to interact with the client.

### `nuevo net.Socket([options])`
<!-- YAML
added: v0.3.4
-->

* `options` {Object} Available options are:
  * `fd` {number} If specified, wrap around an existing socket with the given file descriptor, otherwise a new socket will be created.
  * `allowHalfOpen` {boolean} Indicates whether half-opened TCP connections are allowed. See [`net.createServer()`][] and the [`'end'`][] event for details. **Default:** `false`.
  * `readable` {boolean} Allow reads on the socket when an `fd` is passed, otherwise ignored. **Default:** `false`.
  * `writable` {boolean} Allow writes on the socket when an `fd` is passed, otherwise ignored. **Default:** `false`.
* Devuelve: {net.Socket}

Crea un nuevo objeto socket.

The newly created socket can be either a TCP socket or a streaming [IPC](#net_ipc_support) endpoint, depending on what it [`connect()`][`socket.connect()`] to.

### Event: `'close'`
<!-- YAML
added: v0.1.90
-->

* `hadError` {boolean} `true` si el socket tiene un error de transmisión.

Se emite una vez que el socket está completamente cerrado. The argument `hadError` is a boolean which says if the socket was closed due to a transmission error.

### Event: `'connect'`
<!-- YAML
added: v0.1.90
-->

Se emite cuando la conexión del socket se establece de forma exitosa. Vea [`net.createConnection()`][].

### Event: `'data'`
<!-- YAML
added: v0.1.90
-->

* {Buffer|string}

Se emite cuando los datos son recibidos. El argumento `data` será un `Buffer` o `String`. La codificación de los datos es establecida por [`socket.setEncoding()`][].

The data will be lost if there is no listener when a `Socket` emits a `'data'` event.

### Event: `'drain'`
<!-- YAML
added: v0.1.90
-->

Se emite cuando el búfer de escritura se vacía. Se puede utilizar para acelerar las cargas.

Vea también: los valores de retorno de `socket.write()`.

### Event: `'end'`
<!-- YAML
added: v0.1.90
-->

Emitted when the other end of the socket sends a FIN packet, thus ending the readable side of the socket.

By default (`allowHalfOpen` is `false`) the socket will send a FIN packet back and destroy its file descriptor once it has written out its pending write queue. However, if `allowHalfOpen` is set to `true`, the socket will not automatically [`end()`][`socket.end()`] its writable side, allowing the user to write arbitrary amounts of data. The user must call [`end()`][`socket.end()`] explicitly to close the connection (i.e. sending a FIN packet back).

### Event: `'error'`
<!-- YAML
added: v0.1.90
-->

* {Error}

Se emite cuando ocurre un error. El evento `'close'` será llamado directamente siguiendo este evento.

### Event: `'lookup'`
<!-- YAML
added: v0.11.3
changes:
  - version: v5.10.0
    pr-url: https://github.com/nodejs/node/pull/5598
    description: The `host` parameter is supported now.
-->

Emitted after resolving the host name but before connecting. Not applicable to Unix sockets.

* `err` {Error|null} El objeto de error. Vea [`dns.lookup()`][].
* `address` {string} La dirección IP.
* `family` {string|null} El tipo de dirección. Vea [`dns.lookup()`][].
* `host` {string} The host name.

### Event: `'ready'`
<!-- YAML
added: v9.11.0
-->

Emitido cuando un socket está listo para ser utilizado.

Activado inmediatamente después de `'connect'`.

### Event: `'timeout'`
<!-- YAML
added: v0.1.90
-->

Se emite si el socket se desconecta por inactividad. Esto es solo para notificar que el socket ha estado inactivo. El usuario debe cerrar la conexión manualmente.

Vea también: [`socket.setTimeout()`][].

### `socket.address()`
<!-- YAML
added: v0.1.90
-->

* Devuelve: {Object}

Returns the bound `address`, the address `family` name and `port` of the socket as reported by the operating system: `{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`

### `socket.bufferSize`
<!-- YAML
added: v0.3.8
-->

* {integer}

This property shows the number of characters buffered for writing. The buffer may contain strings whose length after encoding is not yet known. So this number is only an approximation of the number of bytes in the buffer.

`net.Socket` tiene la propiedad de que `socket.write()` siempre funciona. Esto es para ayudar a los usuarios a ponerse en marcha rápidamente. The computer cannot always keep up with the amount of data that is written to a socket. The network connection simply might be too slow. Node.js internamente pondrá en cola los datos escritos en un socket y los enviará a través del cable cuando sea posible.

La consecuencia de este búfer interno es que la memoria puede aumentar. Users who experience large or growing `bufferSize` should attempt to "throttle" the data flows in their program with [`socket.pause()`][] and [`socket.resume()`][].

### `socket.bytesRead`
<!-- YAML
added: v0.5.3
-->

* {integer}

La cantidad de bytes recibidos.

### `socket.bytesWritten`
<!-- YAML
added: v0.5.3
-->

* {integer}

La cantidad de bytes enviados.

### `socket.connect()`

Inicia una conexión en un socket dado.

Firmas posibles:

* [`socket.connect(options[, connectListener])`][`socket.connect(options)`]
* [`socket.connect(path[, connectListener])`][`socket.connect(path)`] for [IPC](#net_ipc_support) connections.
* [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`] for TCP connections.
* Devuelve: {net.Socket} El socket en sí.

Esta función es asincrónica. When the connection is established, the [`'connect'`][] event will be emitted. If there is a problem connecting, instead of a [`'connect'`][] event, an [`'error'`][] event will be emitted with the error passed to the [`'error'`][] listener. The last parameter `connectListener`, if supplied, will be added as a listener for the [`'connect'`][] event **once**.

#### `socket.connect(options[, connectListener])`
<!-- YAML
added: v0.1.90
changes:
  - version: v12.10.0
    pr-url: https://github.com/nodejs/node/pull/25436
    description: Added `onread` option.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/6021
    description: The `hints` option defaults to `0` in all cases now.
                 Previously, in the absence of the `family` option it would
                 default to `dns.ADDRCONFIG | dns.V4MAPPED`.
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/6000
    description: The `hints` option is supported now.
-->

* `options` {Object}
* `connectListener` {Function} Common parameter of [`socket.connect()`][] methods. Será añadido una vez como un listener para el evento [`'connect'`][].
* Devuelve: {net.Socket} El socket en sí.

Inicia una conexión en un socket dado. Normally this method is not needed, the socket should be created and opened with [`net.createConnection()`][]. Use this only when implementing a custom Socket.

Para conexiones TCP, los `options` son:

* `port` {number} Requerido. El puerto al que el socket debería conectarse.
* `host` {string} Host al que el socket debería conectarse. **Default:** `'localhost'`.
* `localAddress` {string} Las direcciones locales a las que el socket debería conectarse.
* `localPort` {number} Puerto local al que el socket debería conectarse.
* `family` {number}: Version of IP stack. Must be `4`, `6`, or `0`. The value `0` indicates that both IPv4 and IPv6 addresses are allowed. **Default:** `0`.
* `hints` {number} [`dns.lookup()` hints][] Opcional.
* `lookup` {Function} Función de búsqueda personalizada. **Default:** [`dns.lookup()`][].

Para las conexiones [IPC](#net_ipc_support), los `options` disponibles son:

* `path` {string} Requerido. Rutas al que el cliente debe conectarse. Vea [Identificando rutas para conexiones ICP](#net_identifying_paths_for_ipc_connections). If provided, the TCP-specific options above are ignored.

For both types, available `options` include:

* `onread` {Object} If specified, incoming data is stored in a single `buffer` and passed to the supplied `callback` when data arrives on the socket. This will cause the streaming functionality to not provide any data. The socket will emit events like `'error'`, `'end'`, and `'close'` as usual. Methods like `pause()` and `resume()` will also behave as expected.
  * `buffer` {Buffer|Uint8Array|Function} Either a reusable chunk of memory to use for storing incoming data or a function that returns such.
  * `callback` {Function} This function is called for every chunk of incoming data. Two arguments are passed to it: the number of bytes written to `buffer` and a reference to `buffer`. Return `false` from this function to implicitly `pause()` the socket. This function will be executed in the global context.

Following is an example of a client using the `onread` option:

```js
const net = require('net');
net.connect({
  port: 80,
  onread: {
    // Reuses a 4KiB Buffer for every read from the socket.
    buffer: Buffer.alloc(4 * 1024),
    callback: function(nread, buf) {
      // Received data is available in `buf` from 0 to `nread`.
      console.log(buf.toString('utf8', 0, nread));
    }
  }
});
```

#### `socket.connect(path[, connectListener])`

* `path` {string} Ruta al que el cliente debe conectarse. See [Identifying paths for IPC connections](#net_identifying_paths_for_ipc_connections).
* `connectListener` {Function} Common parameter of [`socket.connect()`][] methods. Será añadido una vez como un listener para el evento [`'connect'`][].
* Devuelve: {net.Socket} El socket en sí.

Inicia una conexión [IPC](#net_ipc_support) en el socket dado.

Alias to [`socket.connect(options[, connectListener])`][`socket.connect(options)`] called with `{ path: path }` as `options`.

#### `socket.connect(port[, host][, connectListener])`
<!-- YAML
added: v0.1.90
-->

* `port` {number} Puerto al que el cliente debe conectarse.
* `host` {string} Servidor al que el cliente debe conectarse.
* `connectListener` {Function} Common parameter of [`socket.connect()`][] methods. Será añadido una vez como un listener para el evento [`'connect'`][].
* Devuelve: {net.Socket} El socket en sí.

Inicia una conexión TCP en el socket dado.

Alias to [`socket.connect(options[, connectListener])`][`socket.connect(options)`] called with `{port: port, host: host}` as `options`.

### `socket.connecting`
<!-- YAML
added: v6.1.0
-->

* {boolean}

If `true`, [`socket.connect(options[, connectListener])`][`socket.connect(options)`] was called and has not yet finished. It will stay `true` until the socket becomes connected, then it is set to `false` and the `'connect'` event is emitted.  Note that the [`socket.connect(options[, connectListener])`][`socket.connect(options)`] callback is a listener for the `'connect'` event.

### `socket.destroy([exception])`
<!-- YAML
added: v0.1.90
-->

* `exception` {Object}
* Devuelve: {net.Socket}

Asegura que no ocurra más actividad de I/O en este socket. Solo es necesario en caso de errores (error de análisis o algo así).

Si se especifica `exception`, se emitirá un evento [`'error'`][] y todos los listeners de ese evento recibirán `exception` como un argumento.

### `socket.destroyed`

* {boolean} Indica si la conexión es destruida o no. Una vez que se destruye una conexión, no se pueden transferir más datos al usarla.

### `socket.end([data[, encoding]][, callback])`
<!-- YAML
added: v0.1.90
-->

* `data` {string|Buffer|Uint8Array}
* `encoding` {string} Solo se usa cuando los datos son `string`. **Default:** `'utf8'`.
* `callback` {Function} Optional callback for when the socket is finished.
* Devuelve: {net.Socket} El socket en sí.

Cierra parcialmente el socket. es decir, envía un paquete FIN. Es posible que el servidor todavía envíe algunos datos.

If `data` is specified, it is equivalent to calling `socket.write(data, encoding)` followed by [`socket.end()`][].

### `socket.localAddress`
<!-- YAML
added: v0.9.6
-->

* {string}

La representación de string de la dirección IP local en la que se está conectando el cliente remoto. For example, in a server listening on `'0.0.0.0'`, if a client connects on `'192.168.1.1'`, the value of `socket.localAddress` would be `'192.168.1.1'`.

### `socket.localPort`
<!-- YAML
added: v0.9.6
-->

* {integer}

La representación numérica del puerto local. For example, `80` or `21`.

### `socket.pause()`

* Devuelve: {net.Socket} El socket en sí.

Pausa la lectura de datos. Es decir, los eventos [`'data'`][] no serán emitidos. Útil para acelerar una carga.

### `socket.pending`
<!-- YAML
added: v11.2.0
-->

* {boolean}

This is `true` if the socket is not connected yet, either because `.connect()` has not yet been called or because it is still in the process of connecting (see [`socket.connecting`][]).

### `socket.ref()`
<!-- YAML
added: v0.9.1
-->

* Devuelve: {net.Socket} El socket en sí.

Opposite of `unref()`, calling `ref()` on a previously `unref`ed socket will *not* let the program exit if it's the only socket left (the default behavior). El el socket fue llamado `ref`, llamar a `ref` denuevo no tendrá efecto.

### `socket.remoteAddress`
<!-- YAML
added: v0.5.10
-->

* {string}

La representación de la string de la dirección IP remota. Por ejemplo, `'74.125.127.100'` o `'2001:4860:a005::68'`. El valor puede ser `undefined` si el socket se destruye (por ejemplo, si el cliente se desconectó).

### `socket.remoteFamily`
<!-- YAML
added: v0.11.14
-->

* {string}

La representación de la string de la familia IP remota. `'IPv4'` o `'IPv6'`.

### `socket.remotePort`
<!-- YAML
added: v0.5.10
-->

* {integer}

La representación numérica del puerto remoto. For example, `80` or `21`.

### `socket.resume()`

* Devuelve: {net.Socket} El socket en sí.

Reanuda la lectura después de llamar a [`socket.pause()`][].

### `socket.setEncoding([encoding])`
<!-- YAML
added: v0.1.90
-->

* `encoding` {string}
* Devuelve: {net.Socket} El socket en sí.

Establece la codificación para el socket como [Stream Legible](stream.html#stream_class_stream_readable). See [`readable.setEncoding()`][] for more information.

### `socket.setKeepAlive([enable][, initialDelay])`
<!-- YAML
added: v0.1.92
-->

* `enable` {boolean} **Default:** `false`
* `initialDelay` {number} **Default:** `0`
* Devuelve: {net.Socket} El socket en sí.

Activa/desactiva la funcionalidad keep-alive y, opcionalmente, establece el retraso inicial antes de que la primera sonda keepalive se envíe en un socket inactivo.

Establece `initialDelay` (en milisegundos) para establecer el retraso entre el último paquete de datos recibido y la primera sonda de keepalive. Setting `0` for `initialDelay` will leave the value unchanged from the default (or previous) setting.

### `socket.setNoDelay([noDelay])`
<!-- YAML
added: v0.1.90
-->

* `noDelay` {boolean} **Default:** `true`
* Devuelve: {net.Socket} El socket en sí.

Enable/disable the use of Nagle's algorithm.

When a TCP connection is created, it will have Nagle's algorithm enabled.

Nagle's algorithm delays data before it is sent via the network. It attempts to optimize throughput at the expense of latency.

Passing `true` for `noDelay` or not passing an argument will disable Nagle's algorithm for the socket. Passing `false` for `noDelay` will enable Nagle's algorithm.

### `socket.setTimeout(timeout[, callback])`
<!-- YAML
added: v0.1.90
-->

* `timeout` {number}
* `callback` {Function}
* Devuelve: {net.Socket} El socket en sí.

Establece el socket en tiempo de espera después de `timeout` milisegundos de inactividad en el socket. Por defecto, `net.Socket` no tiene un tiempo de espera.

Cuando se desencadena un tiempo de espera inactivo, el socket recibirá un evento [`'timeout'`][] pero la conexión no se cortará. The user must manually call [`socket.end()`][] or [`socket.destroy()`][] to end the connection.

```js
socket.setTimeout(3000);
socket.on('timeout', () => {
  console.log('socket timeout');
  socket.end();
});
```

Si `timeout` es 0, entonces se deshabilita el tiempo de espera de inactividad existente.

El parámetro opcional `callback` se agregará como un listener de una sola vez para el evento [`'timeout'`][].

### `socket.unref()`
<!-- YAML
added: v0.9.1
-->

* Devuelve: {net.Socket} El socket en sí.

Calling `unref()` on a socket will allow the program to exit if this is the only active socket in the event system. If the socket is already `unref`ed calling `unref()` again will have no effect.

### `socket.write(data[, encoding][, callback])`
<!-- YAML
added: v0.1.90
-->

* `data` {string|Buffer|Uint8Array}
* `encoding` {string} Solo se usa cuando los datos son `string`. **Default:** `utf8`.
* `callback` {Function}
* Devuelve: {boolean}

Envía datos en el socket. El segundo parámetro especifica la codificación en el caso de una string — por defecto es la codificación UTF8.

Devuelve como `true` si todos los datos fueron arrojados con éxito al búfer del núcleo. Devuelve como `false` si todos o parte de los datos fueron puestos en cola en la memoria del usuario. [`'drain'`][] se emitirá cuando el búfer vuelva a estar libre.

The optional `callback` parameter will be executed when the data is finally written out, which may not be immediately.

See `Writable` stream [`write()`](stream.html#stream_writable_write_chunk_encoding_callback) method for more information.

## `net.connect()`

Aliases to [`net.createConnection()`][`net.createConnection()`].

Firmas posibles:

* [`net.connect(options[, connectListener])`][`net.connect(options)`]
* [`net.connect(path[, connectListener])`][`net.connect(path)`] for [IPC](#net_ipc_support) connections.
* [`net.connect(port[, host][, connectListener])`][`net.connect(port, host)`] for TCP connections.

### `net.connect(options[, connectListener])`
<!-- YAML
added: v0.7.0
-->

* `options` {Object}
* `connectListener` {Function}
* Devuelve: {net.Socket}

Alias to [`net.createConnection(options[, connectListener])`][`net.createConnection(options)`].

### `net.connect(path[, connectListener])`
<!-- YAML
added: v0.1.90
-->

* `path` {string}
* `connectListener` {Function}
* Devuelve: {net.Socket}

Alias to [`net.createConnection(path[, connectListener])`][`net.createConnection(path)`].

### `net.connect(port[, host][, connectListener])`
<!-- YAML
added: v0.1.90
-->

* `port` {number}
* `host` {string}
* `connectListener` {Function}
* Devuelve: {net.Socket}

Alias to [`net.createConnection(port[, host][, connectListener])`][`net.createConnection(port, host)`].

## `net.createConnection()`

A factory function, which creates a new [`net.Socket`][], immediately initiates connection with [`socket.connect()`][], then returns the `net.Socket` that starts the connection.

When the connection is established, a [`'connect'`][] event will be emitted on the returned socket. The last parameter `connectListener`, if supplied, will be added as a listener for the [`'connect'`][] event **once**.

Firmas posibles:

* [`net.createConnection(options[, connectListener])`][`net.createConnection(options)`]
* [`net.createConnection(path[, connectListener])`][`net.createConnection(path)`] for [IPC](#net_ipc_support) connections.
* [`net.createConnection(port[, host][, connectListener])`][`net.createConnection(port, host)`] for TCP connections.

La función [`net.connect()`][] es un alias de esta función.

### `net.createConnection(options[, connectListener])`
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
  // 'connect' listener.
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

To connect on the socket `/tmp/echo.sock` the second line would just be changed to:

```js
const client = net.createConnection({ path: '/tmp/echo.sock' });
```

### `net.createConnection(path[, connectListener])`
<!-- YAML
added: v0.1.90
-->

* `path` {string} Ruta a la que el socket debería conectarse. Will be passed to [`socket.connect(path[, connectListener])`][`socket.connect(path)`]. Vea [Identificando rutas para conexiones ICP](#net_identifying_paths_for_ipc_connections).
* `connectListener` {Function} Common parameter of the [`net.createConnection()`][] functions, an "once" listener for the `'connect'` event on the initiating socket. Will be passed to [`socket.connect(path[, connectListener])`][`socket.connect(path)`].
* Devuelve: {net.Socket} El socket recién creado usado para iniciar la conexión.

Inicia una conexión [IPC](#net_ipc_support).

This function creates a new [`net.Socket`][] with all options set to default, immediately initiates connection with [`socket.connect(path[, connectListener])`][`socket.connect(path)`], then returns the `net.Socket` that starts the connection.

### `net.createConnection(port[, host][, connectListener])`
<!-- YAML
added: v0.1.90
-->

* `port` {number} Puerto al que el socket debería conectarse. Will be passed to [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`].
* `host` {string} Host al que el socket debería conectarse. Will be passed to [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`]. **Default:** `'localhost'`.
* `connectListener` {Function} Common parameter of the [`net.createConnection()`][] functions, an "once" listener for the `'connect'` event on the initiating socket. Will be passed to [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`].
* Devuelve: {net.Socket} El socket recién creado usado para iniciar la conexión.

Inicia una conexión TCP.

This function creates a new [`net.Socket`][] with all options set to default, immediately initiates connection with [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`], then returns the `net.Socket` that starts the connection.

## `net.createServer([options][, connectionListener])`
<!-- YAML
added: v0.5.0
-->

* `options` {Object}
  * `allowHalfOpen` {boolean} Indicates whether half-opened TCP connections are allowed. **Default:** `false`.
  * `pauseOnConnect` {boolean} Indicates whether the socket should be paused on incoming connections. **Default:** `false`.
* `connectionListener` {Function} Automatically set as a listener for the [`'connection'`][] event.
* Devuelve: {net.Server}

Crea un nuevo servidor TCP o un servidor [IPC](#net_ipc_support).

If `allowHalfOpen` is set to `true`, when the other end of the socket sends a FIN packet, the server will only send a FIN packet back when [`socket.end()`][] is explicitly called, until then the connection is half-closed (non-readable but still writable). See [`'end'`][] event and [RFC 1122](https://tools.ietf.org/html/rfc1122) (section 4.2.2.13) for more information.

If `pauseOnConnect` is set to `true`, then the socket associated with each incoming connection will be paused, and no data will be read from its handle. This allows connections to be passed between processes without any data being read by the original process. To begin reading data from a paused socket, call [`socket.resume()`][].

The server can be a TCP server or an [IPC](#net_ipc_support) server, depending on what it [`listen()`][`server.listen()`] to.

Here is an example of an TCP echo server which listens for connections on port 8124:

```js
const net = require('net');
const server = net.createServer((c) => {
  // 'connection' listener.
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

To listen on the socket `/tmp/echo.sock` the third line from the last would just be changed to:

```js
server.listen('/tmp/echo.sock', () => {
  console.log('server bound');
});
```

Use `nc` to connect to a Unix domain socket server:

```console
$ nc -U /tmp/echo.sock
```

## `net.isIP(input)`
<!-- YAML
added: v0.3.0
-->

* `input` {string}
* Devuelve: {integer}

Comprueba si la entrada es una dirección IP. Returns `0` for invalid strings, returns `4` for IP version 4 addresses, and returns `6` for IP version 6 addresses.

## `net.isIPv4(input)`
<!-- YAML
added: v0.3.0
-->

* `input` {string}
* Devuelve: {boolean}

Devuelve `true` si lo introducido es una dirección IP versión 4, de otra manera devuelve `false`.

## `net.isIPv6(input)`
<!-- YAML
added: v0.3.0
-->

* `input` {string}
* Devuelve: {boolean}

Devuelve `true` si lo introducido es una dirección IP versión 6, de lo contrario devuelve `false`.
