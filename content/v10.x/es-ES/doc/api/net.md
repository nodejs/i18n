# Net

<!--introduced_in=v0.10.0-->

<!--lint disable maximum-line-length-->

> Estabilidad: 2 - Estable

El módulo `net` proporciona una red API asincrónica para crear una TCP basada en la transmisión, o servidores [IPC](#net_ipc_support) ([`net.createServer()`][]) y clientes ([`net.createConnection()`][]).

Puede ser accedido utilizando:

```js
const net = require('net');
```

## Soporte IPC

El módulo `net` soporta IPC con pipes ya nombrados en Windows, y en sockets con dominio UNIX en otro sistema operativo.

### Identificando las rutas para las conexiones IPC

[`net.connect()`][], [`net.createConnection()`][], [`server.listen()`][] y [`socket.connect()`][] toman un parámetro `path` para identificar los terminales IPC.

En UNIX, el dominio local es también conocido como el dominio UNIX. La ruta es un nombre de ruta del sistema de archivos. Es truncado a `sizeof(sockaddr_un.sun_path) - 1`, que varía en diferentes sistemas operativos, entre 91 y 107 bytes. Los valores típicos son 107 en Linux y 103 en macOS. La ruta está sujeta a las mismas convenciones para colocar nombres y verificar permisos, como se haría en la creación de archivos. Si el socket de dominio UNIX (que es visible como una ruta del sistema de archivo) es creado y usado en conjunción con una abstracción API de Node.js tal como [`net.createServer()`][], va a ser desenlazado como parte de [`server.close()`][]. Por otro lado, si es creado y usado fuera de estas abstracciones, el usuario tendrá que quitarlo manualmente. Lo mismo aplica cuando la ruta fue creada por una API de Node.js, pero el programa falla bruscamente. En resumen, un socket de dominio UNIX una vez creado exitosamente será visible en el sistema de archivos, y persistirá ahí hasta que sea desenlazado.

En windows, el dominio local es implementado usando un pipe que ya tiene nombre. La ruta *debe* referir a una entrada en `\\?\pipe` o `\\.\pipe`. Cualquier carácter es permitido, pero este último puede hacer algún procesamiento de nombres de pipes, tales como resolver secuencias `..`. A pesar de como podría verse, el espacio de nombre pipe es plano. Los pipes *no persestirán*. Son removidos cuando la última referencia a ellos es cerrada. A diferencia de los sockets de dominio UNIX, Windows cerrará y removerá el pipe cuando el proceso de posesión existe.

El escape de string de JavaScript requiere que las rutas sean especificadas con reacción extra, tal como:

```js
net.createServer().listen(
  path.join('\\\\?\\pipe', process.cwd(), 'myctl'));
```

## Clase: net.Server

<!-- YAML
added: v0.1.90
-->

Esta clase es usada para crear un servidor TCP o [IPC](#net_ipc_support).

### nuevo net.Server(\[options\]\[, connectionListener\])

* Devuelve: {net.Server}

Vea [`net.createServer([options][, connectionListener])`][`net.createServer()`].

`net.Server` es un [`EventEmitter`][] con los siguientes eventos:

### Evento: 'close'

<!-- YAML
added: v0.5.0
-->

Emitido cuando el servidor se cierra. Tenga en cuenta que si las conexiones existen, este evento no es emitido hasta que terminaron todas las conexiones.

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

Emitido cuando ocurre un error. A diferencia de [`net.Socket`][], el evento [`'close'`][] **no** será emitido directamente siguiendo este evento a menos que [`server.close()`][] sea llamado manualmente. Vea el ejemplo en discusión de [`server.listen()`][].

### Evento: 'listening'

<!-- YAML
added: v0.1.90
-->

Emitido cundo el servidor ha sido enlazado después de llamar a [`server.listen()`][].

### server.address()

<!-- YAML
added: v0.1.90
-->

* Devuelve: {Object}

Devuelve la `address` enlazada, el nombre de la dirección de la `family`, y el `port` del servidor como fue reportado por el sistema operativo si se estaba escuchando en un socket de IP (útil para encontrar cuál puerto fue asignado cuando se obtiene una dirección asignada por el sistema operativo): `{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`.

Para un servidor escuchando en un socket de dominio UNIX o pipe, el nombre es devuelto como un string.

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

No llames a `server.address()` hasta que el evento `'listening'` ha sido emitido.

### server.close([callback])

<!-- YAML
added: v0.1.90
-->

* Devuelve: {net.Server}

Detiene al servidor de aceptar nuevas conexiones, y de mantener conexiones existentes. Esta función es asincrónica, el servidor es finalmente cerrado cuando todas las conexiones son terminadas, y el servidor emite un evento [`'close'`]. El `callback` opcional será llamado una vez el evento `'close'` ocurra. A diferencia de ese evento, será llamado con un `Error` como su único argumento si el servidor no fue abierto cuando estaba cerrado.

### server.connections

<!-- YAML
added: v0.2.0
deprecated: v0.9.7
-->

> Estabilidad: 0 - Desaprobado: Usa en su lugar [`server.getConnections()`][].

El número de conexiones simultáneas en el servidor.

Esto se convierte en `null` cuando se envía un socket a un proceso secundario con [`child_process.fork()`][]. To poll forks and get current number of active connections use asynchronous [`server.getConnections()`][] instead.

### server.getConnections(callback)

<!-- YAML
added: v0.9.7
-->

* Devuelve: {net.Server}

Obtiene el número de conexiones simultáneas en el servidor de forma asincrónica. Funciona cuando los sockets fueron enviados a las bifurcaciones.

El callback debería tomar dos argumentos, `err` y `count`.

### server.listen()

Inicia un servidor escuchando conexiones. Un `net.Server` puede ser un servidor TCP o un servidor [IPC](#net_ipc_support), dependiendo de lo que escuche.

Firmas posibles:

* [`server.listen(handle[, backlog][, callback])`][`server.listen(handle)`]
* [`server.listen(options[, callback])`][`server.listen(options)`]
* [`server.listen(path[, backlog][, callback])`][`server.listen(path)`] para servidores [IPC](#net_ipc_support)
* [ `server.listen([port[, host[, backlog]]][, callback])`](#net_server_listen_port_host_backlog_callback) para servidores TCP

Esta función es asincrónica. Cuando el servidor empieza a escuchar, el evento [`'listening'`][] es emitido. El último parámetro `callback` será añadido como un listener para el evento [`'listening'`][].

All `listen()` methods can take a `backlog` parameter to specify the maximum length of the queue of pending connections. The actual length will be determined by the OS through sysctl settings such as `tcp_max_syn_backlog` and `somaxconn` on Linux. The default value of this parameter is 511 (not 512).

All [`net.Socket`][] are set to `SO_REUSEADDR` (See [socket(7)](http://man7.org/linux/man-pages/man7/socket.7.html) for details).

The `server.listen()` method can be called again if and only if there was an error during the first `server.listen()` call or `server.close()` has been called. Otherwise, an `ERR_SERVER_ALREADY_LISTEN` error will be thrown.

Uno de los errores más comunes cuando se escucha es `EADDRINUSE`. Esto ocurre cuando otro servidor está escuchando en el `port` / `path` / `handle` requerido. Una manera de manejar esto sería intentar de nuevo luego de una cierta cantidad de tiempo:

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

Inicia un servidor escuchando por conexiones en un `handle` dado que ya ha sido enlazado a un puerto, un socket de dominio UNIX, o un pipe que fue nombrado por Windows.

El objeto `handle` puede ser un servidor, un socket (cualquiera con un miembro `_handle` subyacente), o un objeto con un miembro `fd` que es un descriptor de archivos válido.

Escuchar en un descriptor de archivo no es soportado en Windows.

#### server.listen(options[, callback])

<!-- YAML
added: v0.11.14
-->

* `opciones` {Object} Requerido. Soporta las siguientes propiedades: 
  * `port` {number}
  * `host` {string}
  * `path` {string} Será ignorado si se especifica el `port`. Vea [Identificando rutas para conexiones IPC](#net_identifying_paths_for_ipc_connections).
  * `backlog` {number} Parámetro común de las funciones [`server.listen()`][].
  * `exclusive` {boolean} **Predeterminado:** `false`
* `callback` {Function} Parámetro común de las funciones [`server.listen()`][].
* Devuelve: {net.Server}

Si el `port` es especificado, se comporta de la misma manera que <a href="#net_server_listen_port_host_backlog_callback">
<code>server.listen([port[, host[, backlog]]][, callback])</code></a>. De otra manera, si se especifica `path`, se comporta de la misma manera que [`server.listen(path[, backlog][, callback])`][`server.listen(path)`]. Si ninguno es especificado, se arrojará un error.

Si `exclusive` es `false` (forma predeterminada), entonces los workers del clúster usarán el mismo handle subyacente, permitiendo que las tareas del manejo de conexiones sean compartidas. Cuando `exclusive` es `true`, el handle no es compartido, e intentar compartir el puerto resultará en un error. Un ejemplo que escucha en un puerto exclusivo es mostrado a continuación.

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

* `path` {string} La ruta que el servidor debería escuchar. Vea [Identificando rutas para conexiones IPC](#net_identifying_paths_for_ipc_connections).
* `backlog` {number} Párametro común de las funciones [`server.listen()`][].
* `callback` {Function} Parámetro común de las funciones [`server.listen()`][].
* Devuelve: {net.Server}

Inicia un servidor [IPC](#net_ipc_support) escuchando por conexiones en el `path` dado.

#### server.listen(\[port[, host[, backlog]]\]\[, callback\])

<!-- YAML
added: v0.1.90
-->

* `port` {number}
* `host` {string}
* `backlog` {number} Parámetro común de las funciones [`server.listen()`][].
* `callback` {Function} Parámetro común de las funciones [`server.listen()`][].
* Devuelve: {net.Server}

Inicia un servidor TCP que escucha por conexiones en un `port` y `host` dados.

Si es omitido `port` o es 0, el sistema operativo va a asignar un puerto sin usar arbitrario, que puede ser recuperado usando `server.address().port` después del evento [`'listening'`][] ha sido emitido.

Si el `host` es omitido, cuando esté disponible IPv6, el servidor aceptará conexiones en la [dirección IPv6 sin especificar](https://en.wikipedia.org/wiki/IPv6_address#Unspecified_address) (`::`), o de otra manera la [dirección IPv4 sin especificar](https://en.wikipedia.org/wiki/0.0.0.0) (`0.0.0.0`).

En la mayoría de los sistemas operativos, escuchar a la [dirección IPv6 sin especificar](https://en.wikipedia.org/wiki/IPv6_address#Unspecified_address) (`::`) puede causar que el `net.Server` tambien escuche en la [dirección IPv4 sin especificar](https://en.wikipedia.org/wiki/0.0.0.0) (`0.0.0.0`).

### server.listening

<!-- YAML
added: v5.7.0
-->

* {boolean} Indica si el servidor está o no está escuchando por conexiones.

### server.maxConnections

<!-- YAML
added: v0.2.0
-->

Establece esta propiedad para rechazar conexiones cuando la cuenta de la conexión del servidor se vuelva alta.

No es recomendado usar esta opción una vez un socket ha sido enviado a un proceso secundario con [`child_process.fork()`][].

### server.ref()

<!-- YAML
added: v0.9.1
-->

* Devuelve: {net.Server}

De forma contraria de `unref()`, llamar a `ref()` en un servidor donde ha sido llamado `unref`, *no* va a dejar al programa salir si es el único servidor que queda (el comportamiento predeterminado). Si el servidor fue llamado `ref`, llamar a `ref()` otra vez no tendrá efecto.

### server.unref()

<!-- YAML
added: v0.9.1
-->

* Devuelve: {net.Server}

Llamar a `unref()` en un servidor permitirá al programa salir si este es el único servidor activo en el sistema de eventos. Si en el servidor ya fue llamado `unref`, llamar de nuevo a `unref()` no tendrá ningún efecto.

## Clase: net.Socket

<!-- YAML
added: v0.3.4
-->

Esta clase es una abstracción de un socket TCP, o un terminal [IPC](#net_ipc_support) de transmición (usa pipes que ya tienen nombre en Windows, o sockets de dominio UNIX). Un `net.Socket` también es una [transmisión dúplex](stream.html#stream_class_stream_duplex), puede ser tanto como legible como escribible, también es un [`EventEmitter`][].

Un `net.Socket` puede ser creada por el usuario y ser usada directamente para interactuar con un servidor. For example, it is returned by [`net.createConnection()`][], so the user can use it to talk to the server.

It can also be created by Node.js and passed to the user when a connection is received. For example, it is passed to the listeners of a [`'connection'`][] event emitted on a [`net.Server`][], so the user can use it to interact with the client.

### new net.Socket([options])

<!-- YAML
added: v0.3.4
-->

Creates a new socket object.

* `options` {Object} Available options are: 
  * `fd` {number} If specified, wrap around an existing socket with the given file descriptor, otherwise a new socket will be created.
  * `allowHalfOpen` {boolean} Indicates whether half-opened TCP connections are allowed. See [`net.createServer()`][] and the [`'end'`][] event for details. **Default:** `false`.
  * `readable` {boolean} Allow reads on the socket when an `fd` is passed, otherwise ignored. **Default:** `false`.
  * `writable` {boolean} Allow writes on the socket when an `fd` is passed, otherwise ignored. **Default:** `false`.
* Returns: {net.Socket}

The newly created socket can be either a TCP socket or a streaming [IPC](#net_ipc_support) endpoint, depending on what it [`connect()`][`socket.connect()`] to.

### Event: 'close'

<!-- YAML
added: v0.1.90
-->

* `hadError` {boolean} `true` if the socket had a transmission error.

Emitted once the socket is fully closed. The argument `hadError` is a boolean which says if the socket was closed due to a transmission error.

### Event: 'connect'

<!-- YAML
added: v0.1.90
-->

Emitted when a socket connection is successfully established. See [`net.createConnection()`][].

### Event: 'data'

<!-- YAML
added: v0.1.90
-->

* {Buffer|string}

Emitted when data is received. The argument `data` will be a `Buffer` or `String`. Encoding of data is set by [`socket.setEncoding()`][].

Note that the **data will be lost** if there is no listener when a `Socket` emits a `'data'` event.

### Event: 'drain'

<!-- YAML
added: v0.1.90
-->

Emitted when the write buffer becomes empty. Can be used to throttle uploads.

See also: the return values of `socket.write()`.

### Event: 'end'

<!-- YAML
added: v0.1.90
-->

Emitted when the other end of the socket sends a FIN packet, thus ending the readable side of the socket.

By default (`allowHalfOpen` is `false`) the socket will send a FIN packet back and destroy its file descriptor once it has written out its pending write queue. However, if `allowHalfOpen` is set to `true`, the socket will not automatically [`end()`][`socket.end()`] its writable side, allowing the user to write arbitrary amounts of data. The user must call [`end()`][`socket.end()`] explicitly to close the connection (i.e. sending a FIN packet back).

### Event: 'error'

<!-- YAML
added: v0.1.90
-->

* {Error}

Emitted when an error occurs. The `'close'` event will be called directly following this event.

### Event: 'lookup'

<!-- YAML
added: v0.11.3
changes:

  - version: v5.10.0
    pr-url: https://github.com/nodejs/node/pull/5598
    description: The `host` parameter is supported now.
-->

Emitted after resolving the hostname but before connecting. Not applicable to UNIX sockets.

* `err` {Error|null} The error object. See [`dns.lookup()`][].
* `address` {string} The IP address.
* `family` {string|null} The address type. See [`dns.lookup()`][].
* `host` {string} The hostname.

### Event: 'ready'

<!-- YAML
added: v9.11.0
-->

Emitted when a socket is ready to be used.

Triggered immediately after `'connect'`.

### Event: 'timeout'

<!-- YAML
added: v0.1.90
-->

Emitted if the socket times out from inactivity. This is only to notify that the socket has been idle. The user must manually close the connection.

See also: [`socket.setTimeout()`][].

### socket.address()

<!-- YAML
added: v0.1.90
-->

* Returns: {Object}

Returns the bound `address`, the address `family` name and `port` of the socket as reported by the operating system: `{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`

### socket.bufferSize

<!-- YAML
added: v0.3.8
-->

`net.Socket` has the property that `socket.write()` always works. This is to help users get up and running quickly. The computer cannot always keep up with the amount of data that is written to a socket - the network connection simply might be too slow. Node.js will internally queue up the data written to a socket and send it out over the wire when it is possible. (Internally it is polling on the socket's file descriptor for being writable).

The consequence of this internal buffering is that memory may grow. This property shows the number of characters currently buffered to be written. (Number of characters is approximately equal to the number of bytes to be written, but the buffer may contain strings, and the strings are lazily encoded, so the exact number of bytes is not known.)

Users who experience large or growing `bufferSize` should attempt to "throttle" the data flows in their program with [`socket.pause()`][] and [`socket.resume()`][].

### socket.bytesRead

<!-- YAML
added: v0.5.3
-->

The amount of received bytes.

### socket.bytesWritten

<!-- YAML
added: v0.5.3
-->

The amount of bytes sent.

### socket.connect()

Initiate a connection on a given socket.

Possible signatures:

* [`socket.connect(options[, connectListener])`][`socket.connect(options)`]
* [`socket.connect(path[, connectListener])`][`socket.connect(path)`] for [IPC](#net_ipc_support) connections.
* [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`] for TCP connections.
* Returns: {net.Socket} The socket itself.

This function is asynchronous. When the connection is established, the [`'connect'`][] event will be emitted. If there is a problem connecting, instead of a [`'connect'`][] event, an [`'error'`][] event will be emitted with the error passed to the [`'error'`][] listener. The last parameter `connectListener`, if supplied, will be added as a listener for the [`'connect'`][] event **once**.

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

* `options` {Object}
* `connectListener` {Function} Common parameter of [`socket.connect()`][] methods. Will be added as a listener for the [`'connect'`][] event once.
* Returns: {net.Socket} The socket itself.

Initiate a connection on a given socket. Normally this method is not needed, the socket should be created and opened with [`net.createConnection()`][]. Use this only when implementing a custom Socket.

For TCP connections, available `options` are:

* `port` {number} Required. Port the socket should connect to.
* `host` {string} Host the socket should connect to. **Default:** `'localhost'`.
* `localAddress` {string} Local address the socket should connect from.
* `localPort` {number} Local port the socket should connect from.
* `family` {number}: Version of IP stack, can be either `4` or `6`. **Default:** `4`.
* `hints` {number} Optional [`dns.lookup()` hints][].
* `lookup` {Function} Custom lookup function. **Predeterminado:** [`dns.lookup()`][].

For [IPC](#net_ipc_support) connections, available `options` are:

* `path` {string} Required. Path the client should connect to. See [Identifying paths for IPC connections](#net_identifying_paths_for_ipc_connections). If provided, the TCP-specific options above are ignored.

#### socket.connect(path[, connectListener])

* `path` {string} Path the client should connect to. See [Identifying paths for IPC connections](#net_identifying_paths_for_ipc_connections).
* `connectListener` {Function} Common parameter of [`socket.connect()`][] methods. Will be added as a listener for the [`'connect'`][] event once.
* Returns: {net.Socket} The socket itself.

Initiate an [IPC](#net_ipc_support) connection on the given socket.

Alias to [`socket.connect(options[, connectListener])`][`socket.connect(options)`] called with `{ path: path }` as `options`.

#### socket.connect(port\[, host\]\[, connectListener\])

<!-- YAML
added: v0.1.90
-->

* `port` {number} Port the client should connect to.
* `host` {string} Host the client should connect to.
* `connectListener` {Function} Common parameter of [`socket.connect()`][] methods. Will be added as a listener for the [`'connect'`][] event once.
* Returns: {net.Socket} The socket itself.

Initiate a TCP connection on the given socket.

Alias to [`socket.connect(options[, connectListener])`][`socket.connect(options)`] called with `{port: port, host: host}` as `options`.

### socket.connecting

<!-- YAML
added: v6.1.0
-->

If `true` - [`socket.connect(options[, connectListener])`][`socket.connect(options)`] was called and haven't yet finished. Will be set to `false` before emitting `'connect'` event and/or calling [`socket.connect(options[, connectListener])`][`socket.connect(options)`]'s callback.

### socket.destroy([exception])

<!-- YAML
added: v0.1.90
-->

* Returns: {net.Socket}

Ensures that no more I/O activity happens on this socket. Only necessary in case of errors (parse error or so).

If `exception` is specified, an [`'error'`][] event will be emitted and any listeners for that event will receive `exception` as an argument.

### socket.destroyed

* {boolean} Indicates if the connection is destroyed or not. Once a connection is destroyed no further data can be transferred using it.

### socket.end(\[data\]\[, encoding\])

<!-- YAML
added: v0.1.90
-->

* Returns: {net.Socket} The socket itself.

Half-closes the socket. i.e., it sends a FIN packet. It is possible the server will still send some data.

If `data` is specified, it is equivalent to calling `socket.write(data, encoding)` followed by [`socket.end()`][].

### socket.localAddress

<!-- YAML
added: v0.9.6
-->

The string representation of the local IP address the remote client is connecting on. For example, in a server listening on `'0.0.0.0'`, if a client connects on `'192.168.1.1'`, the value of `socket.localAddress` would be `'192.168.1.1'`.

### socket.localPort

<!-- YAML
added: v0.9.6
-->

The numeric representation of the local port. For example, `80` or `21`.

### socket.pause()

* Returns: {net.Socket} The socket itself.

Pauses the reading of data. That is, [`'data'`][] events will not be emitted. Useful to throttle back an upload.

### socket.ref()

<!-- YAML
added: v0.9.1
-->

* Returns: {net.Socket} The socket itself.

Opposite of `unref()`, calling `ref()` on a previously `unref`ed socket will *not* let the program exit if it's the only socket left (the default behavior). If the socket is `ref`ed calling `ref` again will have no effect.

### socket.remoteAddress

<!-- YAML
added: v0.5.10
-->

The string representation of the remote IP address. For example, `'74.125.127.100'` or `'2001:4860:a005::68'`. Value may be `undefined` if the socket is destroyed (for example, if the client disconnected).

### socket.remoteFamily

<!-- YAML
added: v0.11.14
-->

The string representation of the remote IP family. `'IPv4'` or `'IPv6'`.

### socket.remotePort

<!-- YAML
added: v0.5.10
-->

The numeric representation of the remote port. For example, `80` or `21`.

### socket.resume()

* Returns: {net.Socket} The socket itself.

Resumes reading after a call to [`socket.pause()`][].

### socket.setEncoding([encoding])

<!-- YAML
added: v0.1.90
-->

* Returns: {net.Socket} The socket itself.

Set the encoding for the socket as a [Readable Stream](stream.html#stream_class_stream_readable). See [`readable.setEncoding()`][] for more information.

### socket.setKeepAlive(\[enable\]\[, initialDelay\])

<!-- YAML
added: v0.1.92
-->

* `enable` {boolean} **Default:** `false`
* `initialDelay` {number} **Default:** `0`
* Returns: {net.Socket} The socket itself.

Enable/disable keep-alive functionality, and optionally set the initial delay before the first keepalive probe is sent on an idle socket.

Set `initialDelay` (in milliseconds) to set the delay between the last data packet received and the first keepalive probe. Setting `0` for `initialDelay` will leave the value unchanged from the default (or previous) setting.

### socket.setNoDelay([noDelay])

<!-- YAML
added: v0.1.90
-->

* `noDelay` {boolean} **Default:** `true`
* Returns: {net.Socket} The socket itself.

Disables the Nagle algorithm. By default TCP connections use the Nagle algorithm, they buffer data before sending it off. Setting `true` for `noDelay` will immediately fire off data each time `socket.write()` is called.

### socket.setTimeout(timeout[, callback])

<!-- YAML
added: v0.1.90
-->

* Returns: {net.Socket} The socket itself.

Sets the socket to timeout after `timeout` milliseconds of inactivity on the socket. By default `net.Socket` do not have a timeout.

When an idle timeout is triggered the socket will receive a [`'timeout'`][] event but the connection will not be severed. The user must manually call [`socket.end()`][] or [`socket.destroy()`][] to end the connection.

```js
socket.setTimeout(3000);
socket.on('timeout', () => {
  console.log('socket timeout');
  socket.end();
});
```

If `timeout` is 0, then the existing idle timeout is disabled.

The optional `callback` parameter will be added as a one-time listener for the [`'timeout'`][] event.

### socket.unref()

<!-- YAML
added: v0.9.1
-->

* Returns: {net.Socket} The socket itself.

Calling `unref()` on a socket will allow the program to exit if this is the only active socket in the event system. If the socket is already `unref`ed calling `unref()` again will have no effect.

### socket.write(data\[, encoding\]\[, callback\])

<!-- YAML
added: v0.1.90
-->

* `data` {string|Buffer|Uint8Array}
* `encoding` {string} Only used when data is `string`. **Default:** `utf8`.
* `callback` {Function}
* Returns: {boolean}

Sends data on the socket. The second parameter specifies the encoding in the case of a string — it defaults to UTF8 encoding.

Returns `true` if the entire data was flushed successfully to the kernel buffer. Returns `false` if all or part of the data was queued in user memory. [`'drain'`][] will be emitted when the buffer is again free.

The optional `callback` parameter will be executed when the data is finally written out - this may not be immediately.

See `Writable` stream [`write()`](stream.html#stream_writable_write_chunk_encoding_callback) method for more information.

## net.connect()

Aliases to [`net.createConnection()`][`net.createConnection()`].

Possible signatures:

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

Possible signatures:

* [`net.createConnection(options[, connectListener])`][`net.createConnection(options)`]
* [`net.createConnection(path[, connectListener])`][`net.createConnection(path)`] for [IPC](#net_ipc_support) connections.
* [`net.createConnection(port[, host][, connectListener])`][`net.createConnection(port, host)`] for TCP connections.

The [`net.connect()`][] function is an alias to this function.

### net.createConnection(options[, connectListener])

<!-- YAML
added: v0.1.90
-->

* `options` {Object} Required. Will be passed to both the [`new net.Socket([options])`][`new net.Socket(options)`] call and the [`socket.connect(options[, connectListener])`][`socket.connect(options)`] method.
* `connectListener` {Function} Common parameter of the [`net.createConnection()`][] functions. If supplied, will be added as a listener for the [`'connect'`][] event on the returned socket once.
* Returns: {net.Socket} The newly created socket used to start the connection.

For available options, see [`new net.Socket([options])`][`new net.Socket(options)`] and [`socket.connect(options[, connectListener])`][`socket.connect(options)`].

Additional options:

* `timeout` {number} If set, will be used to call [`socket.setTimeout(timeout)`][] after the socket is created, but before it starts the connection.

Following is an example of a client of the echo server described in the [`net.createServer()`][] section:

```js
const net = require('net');
const client = net.createConnection({ port: 8124 }, () => {
  // 'connect' listener
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

### net.createConnection(path[, connectListener])

<!-- YAML
added: v0.1.90
-->

* `path` {string} Path the socket should connect to. Will be passed to [`socket.connect(path[, connectListener])`][`socket.connect(path)`]. See [Identifying paths for IPC connections](#net_identifying_paths_for_ipc_connections).
* `connectListener` {Function} Common parameter of the [`net.createConnection()`][] functions, an "once" listener for the `'connect'` event on the initiating socket. Will be passed to [`socket.connect(path[, connectListener])`][`socket.connect(path)`].
* Returns: {net.Socket} The newly created socket used to start the connection.

Initiates an [IPC](#net_ipc_support) connection.

This function creates a new [`net.Socket`][] with all options set to default, immediately initiates connection with [`socket.connect(path[, connectListener])`][`socket.connect(path)`], then returns the `net.Socket` that starts the connection.

### net.createConnection(port\[, host\]\[, connectListener\])

<!-- YAML
added: v0.1.90
-->

* `port` {number} Port the socket should connect to. Will be passed to [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`].
* `host` {string} Host the socket should connect to. Will be passed to [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`]. **Default:** `'localhost'`.
* `connectListener` {Function} Common parameter of the [`net.createConnection()`][] functions, an "once" listener for the `'connect'` event on the initiating socket. Will be passed to [`socket.connect(path[, connectListener])`][`socket.connect(port, host)`].
* Returns: {net.Socket} The newly created socket used to start the connection.

Initiates a TCP connection.

This function creates a new [`net.Socket`][] with all options set to default, immediately initiates connection with [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`], then returns the `net.Socket` that starts the connection.

## net.createServer(\[options\]\[, connectionListener\])

<!-- YAML
added: v0.5.0
-->

Creates a new TCP or [IPC](#net_ipc_support) server.

* `options` {Object} 
  * `allowHalfOpen` {boolean} Indicates whether half-opened TCP connections are allowed. **Default:** `false`.
  * `pauseOnConnect` {boolean} Indicates whether the socket should be paused on incoming connections. **Default:** `false`.
* `connectionListener` {Function} Automatically set as a listener for the [`'connection'`][] event.
* Returns: {net.Server}

If `allowHalfOpen` is set to `true`, when the other end of the socket sends a FIN packet, the server will only send a FIN packet back when [`socket.end()`][] is explicitly called, until then the connection is half-closed (non-readable but still writable). See [`'end'`][] event and [RFC 1122](https://tools.ietf.org/html/rfc1122) (section 4.2.2.13) for more information.

If `pauseOnConnect` is set to `true`, then the socket associated with each incoming connection will be paused, and no data will be read from its handle. This allows connections to be passed between processes without any data being read by the original process. To begin reading data from a paused socket, call [`socket.resume()`][].

The server can be a TCP server or an [IPC](#net_ipc_support) server, depending on what it [`listen()`][`server.listen()`] to.

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

Test this by using `telnet`:

```console
$ telnet localhost 8124
```

To listen on the socket `/tmp/echo.sock` the third line from the last would just be changed to:

```js
server.listen('/tmp/echo.sock', () => {
  console.log('server bound');
});
```

Use `nc` to connect to a UNIX domain socket server:

```console
$ nc -U /tmp/echo.sock
```

## net.isIP(input)

<!-- YAML
added: v0.3.0
-->

* Returns: {integer}

Tests if input is an IP address. Returns `0` for invalid strings, returns `4` for IP version 4 addresses, and returns `6` for IP version 6 addresses.

## net.isIPv4(input)

<!-- YAML
added: v0.3.0
-->

* Returns: {boolean}

Returns `true` if input is a version 4 IP address, otherwise returns `false`.

## net.isIPv6(input)

<!-- YAML
added: v0.3.0
-->

* Returns: {boolean}

Returns `true` if input is a version 6 IP address, otherwise returns `false`.