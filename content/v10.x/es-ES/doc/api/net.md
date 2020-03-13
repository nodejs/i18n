# Net

<!--introduced_in=v0.10.0-->
<!--lint disable maximum-line-length-->

> Estability: 2 - Estable

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

En Windows, el dominio local es implementado usando un pipe que ya tiene nombre. The path *must* refer to an entry in ``\\?\pipe\` or``\\.\pipe\`. Cualquier carácter es permitido, pero este último puede hacer algún procesamiento de nombres de pipes, tales como resolver secuencias `..`. A pesar de como podría verse, el espacio de nombre pipe es plano. Los pipes *no persestirán*. Son removidos cuando la última referencia a ellos es cerrada. A diferencia de los sockets de dominio UNIX, Windows cerrará y removerá el pipe cuando el proceso de posesión existe.

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

* `options` {Object} See [`net.createServer([options][, connectionListener])`][`net.createServer()`].
* `connectionListener` {Function} Se establece automáticamente como un listener para el evento [`'connection'`][].
* Devuelve: {net.Server}

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

* Devuelve: {Object|string}

Devuelve la `address` enlazada, el nombre de la dirección de la `family`, y el `port` del servidor como fue reportado por el sistema operativo si se estaba escuchando en un socket de IP (útil para encontrar cuál puerto fue asignado cuando se obtiene una dirección asignada por el sistema operativo): `{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`.

Para un servidor escuchando en un socket de dominio UNIX o pipe, el nombre es devuelto como un string.

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

* `callback` {Function} Called when the server is closed
* Devuelve: {net.Server}

Detiene al servidor de aceptar nuevas conexiones, y de mantener conexiones existentes. Esta función es asincrónica, el servidor es finalmente cerrado cuando todas las conexiones son terminadas, y el servidor emite un evento [`'close'`]. El `callback` opcional será llamado una vez el evento `'close'` ocurra. A diferencia de ese evento, será llamado con un `Error` como su único argumento si el servidor no fue abierto cuando estaba cerrado.

### server.connections
<!-- YAML
added: v0.2.0
deprecated: v0.9.7
-->

> Estabilidad: 0 - Desaprobado: Use [`server.getConnections()`][] en su lugar.

El número de conexiones simultáneas en el servidor.

Esto se convierte en `null` cuando se envía un socket a un proceso secundario con [`child_process.fork()`][]. To poll forks and get current number of active connections, use asynchronous [`server.getConnections()`][] instead.

### server.getConnections(callback)
<!-- YAML
added: v0.9.7
-->

* `callback` {Function}
* Devuelve: {net.Server}

Obtiene el número de conexiones simultáneas en el servidor de forma asincrónica. Funciona cuando los sockets fueron enviados a las bifurcaciones.

El callback debería tomar dos argumentos, `err` y `count`.

### server.listen()

Inicia un servidor escuchando conexiones. Un `net.Server` puede ser un servidor TCP o un servidor [IPC](#net_ipc_support), dependiendo de lo que escuche.

Firmas posibles:

* [`server.listen(handle[, backlog][, callback])`][`server.listen(handle)`]
* [`server.listen(options[, callback])`][`server.listen(options)`]
* [`server.listen(path[, backlog][, callback])`][`server.listen(path)`] para servidores [IPC](#net_ipc_support)
* <a href="#net_server_listen_port_host_backlog_callback">
  <code>server.listen([port[, host[, backlog]]][, callback])</code></a>
for TCP servers

Esta función es asíncrona. Cuando el servidor empieza a escuchar, el evento [`'listening'`][] es emitido. El último parámetro `callback` se agregará como un listener para el evento [`'listening'`][].

Todos los métodos `listen()` pueden tomar un parámetro `backlog` para especificar la longitud máxima de la cola de conexiones pendientes. La longitud real será determinada por el sistema operativo a través de configuraciones sysctl tales como `tcp_max_syn_backlog` y `somaxconn` en Linux. El valor predeterminado de este parámetro es 511 (no 512).

All [`net.Socket`][] are set to `SO_REUSEADDR` (see [`socket(7)`][] for details).

El método `server.listen()` puede ser llamado otra vez si, y solo si, hubo un error durante la primera llamada de `server.listen()`, o `server.close()` fue llamado. De lo contrario, un error `ERR_SERVER_ALREADY_LISTEN` será arrojado.

Uno de los errores más comunes cuando se escucha es `EADDRINUSE`. This happens when another server is already listening on the requested `port`/`path`/`handle`. Una manera de manejar esto sería intentar de nuevo luego de una cierta cantidad de tiempo:

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

* `options` {Object} Requerido. Soporta las siguientes propiedades:
  * `port` {number}
  * `host` {string}
  * `path` {string} Será ignorado si se especifica el `port`. Vea [Identificando rutas para conexiones IPC](#net_identifying_paths_for_ipc_connections).
  * `backlog` {number} Parámetro común de las funciones [`server.listen()`][].
  * `exclusive` {boolean} **Predeterminado:** `false`
  * `readableAll` {boolean} For IPC servers makes the pipe readable for all users. **Predeterminado:** `false`
  * `writableAll` {boolean} For IPC servers makes the pipe writable for all users. **Predeterminado:** `false`
* `callback` {Function} Parámetro común de las funciones [`server.listen()`][].
* Devuelve: {net.Server}

If `port` is specified, it behaves the same as
<a href="#net_server_listen_port_host_backlog_callback">
<code>server.listen([port[, host[, backlog]]][, callback])</code></a>. De otra manera, si se especifica `path`, se comporta de la misma manera que [`server.listen(path[, backlog][, callback])`][`server.listen(path)`]. Si ninguno es especificado, se producirá un error.

Si `exclusive` es `false` (forma predeterminada), entonces los workers del clúster usarán el mismo handle subyacente, permitiendo que las tareas del manejo de conexiones sean compartidas. Cuando `exclusive` es `true`, el handle no es compartido, e intentar compartir el puerto resultará en un error. Un ejemplo que escucha en un puerto exclusivo es mostrado a continuación.

```js
server.listen({
  host: 'localhost',
  port: 80,
  exclusive: true
});
```

Starting an IPC server as root may cause the server path to be inaccessible for unprivileged users. Using `readableAll` and `writableAll` will make the server accessible for all users.

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

De forma contraria a `unref()`, llamar a `ref()` en un servidor donde ha sido llamado `unref`, *no* va a dejar al programa salir si es el único servidor que queda (el comportamiento predeterminado). Si el servidor fue llamado `ref`, llamar a `ref()` otra vez no tendrá efecto.

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

Esta clase es una abstracción de un socket TCP, o un terminal [IPC](#net_ipc_support) de transmisión (usa pipes que ya tienen nombre en Windows, o sockets de dominio UNIX). Un `net.Socket` también es una [transmisión dúplex](stream.html#stream_class_stream_duplex), puede ser tanto como legible como escribible, también es un [`EventEmitter`][].

Un `net.Socket` puede ser creado por el usuario y ser usado directamente para interactuar con un servidor. Por ejemplo, es devuelto por [`net.createConnection()`][], para que el usuario pueda usarlo para hablar con el servidor.

También puede ser creado por Node.js y pasado al usuario cuando una conexión es recibida. Por ejemplo, es pasado a los listeners de un evento [`'connection'`][], emitido en un [`net.Server`][], para que el usuario pueda usarlo para interactuar con el cliente.

### new net.Socket([options])
<!-- YAML
added: v0.3.4
-->

* `options` {Object} Available options are:
  * `fd` {number} Si es especificado, se envuelve alrededor de un socket existente con el descriptor de archivos dado, de lo contrario un nuevo socket será creado.
  * `allowHalfOpen` {boolean} Indica si se permiten conexiones TCP entreabiertas. Vea [`net.createServer()`][] y el evento [`'end'`][], para detalles. **Predeterminado:** `false`.
  * `readable` {boolean} Permite la lectura en el socket cuando se pasa `fd`, de otra manera es ignorado. **Predeterminado:** `false`.
  * `writable` {boolean} Permite la escritura en el socket cuando se pasa `fd`, de otra manera es ignorado. **Predeterminado:** `false`.
* Devuelve: {net.Socket}

Crea un nuevo objeto socket.

El socket recién creado puede ser un socket TCP o un terminal [IPC](#net_ipc_support) en transmisión, dependiendo de donde conectó con [`connect()`][`socket.connect()`].

### Evento: 'close'
<!-- YAML
added: v0.1.90
-->

* `hadError` {boolean} `true` si el socket tiene un error de transmisión.

Emitido una vez que el socket esté completamente cerrado. El argumento `hadError` es un booleano que dice si el socket fue cerrado debido a un error de transmisión.

### Evento: 'connect'
<!-- YAML
added: v0.1.90
-->

Emitido cuando una conexión del socket es establecida con éxito. Vea [`net.createConnection()`][].

### Evento: 'data'
<!-- YAML
added: v0.1.90
-->

* {Buffer|string}

Emitido cuando los datos son recibidos. El argumento `data` será un `Buffer` o un `String`. La codificación de los datos es establecida por [`socket.setEncoding()`][].

Tenga en cuenta que **los datos se perderán** si no hay un listener cuando un `Socket` emite un evento`'data'`.

### Evento: 'drain'
<!-- YAML
added: v0.1.90
-->

Emitido cuando el búfer de escritura se vacía. Se puede usar para acelerar subidas.

Vea también: los valores de retorno de `socket.write()`.

### Evento: 'end'
<!-- YAML
added: v0.1.90
-->

Emitido cuando el otro extremo del socket envía un paquete FIN, acabando así con el lado legible del socket.

De manera predeterminada (`allowHalfOpen` es `false`) el socket enviará de vuelta un paquete FIN y destruirá el descriptor de archivos una vez que sea escrito la escritura que tenía pendiente. Sin embargo, si `allowHalfOpen` es establecido como `true`, el socket no va terminar [`end()`][`socket.end()`] su lado escribible, permitiendo al usuario escribir una cantidad de datos arbitraria. El usuario debe llamar explícitamente a [`end()`][`socket.end()`] para cerrar la conexión (p. ej. enviar de vuelta un paquete FIN).

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

### Evento: 'ready'
<!-- YAML
added: v9.11.0
-->

Emitido cuando un socket está listo para ser utilizado.

Activado inmediatamente después de `'connect'`.

### Evento: 'timeout'
<!-- YAML
added: v0.1.90
-->

Emitido si el socket agota el tiempo de espera por inactividad. Esto es solo para notificar que el socket ha estado inactivo. El usuario debe cerrar la conexión manualmente.

Vea también: [`socket.setTimeout()`][].

### socket.address()
<!-- YAML
added: v0.1.90
-->

* Devuelve: {Object}

Devuelve la `address` enlazada, el nombre de la `family` y el `port` del socket, como es reportado por el sistema operativo: `{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`

### socket.bufferSize
<!-- YAML
added: v0.3.8
-->

`net.Socket` tiene la propiedad que `socket.write()` siempre funciona. Esto es para ayudar a los usuarios para que se pongan en marcha rápidamente. La computadora no puede siempre seguir el paso con la cantidad de datos que están siendo escritos a un socket - la conexión de red puede ser que simplemente sea muy lenta. Node.js hará una cola internamente con los datos escritos a un socket y lo enviará sobre el cable cuando sea posible. (internamente está haciendo polling en el descriptor de archivos del socket por ser escibible).

La consecuencia de este búfer interno es que la memoria puede crecer. Esta propiedad muestra el número de caracteres que están siendo cargados para ser escritos. (El número de caracteres es aproximadamente igual al número de bytes por ser escritos, pero el búfer puede contener strings, y los strings son codificados perezosamente, entonces, el número exacto de bytes no es conocido.)

Los usuarios que experimentan un `bufferSize` grande o creciente deberían "acelerar" el flujo de datos en su programa, con [`socket.pause()`][] y [`socket.resume()`][].

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

* [`socket.connect(options[, connectListener])`][`socket.connect(options)`]
* [`socket.connect(path[, connectListener])`][`socket.connect(path)`] para conexiones [IPC](#net_ipc_support).
* [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`] para conexiones TCP.
* Devuelve: {net.Socket} El socket en sí.

Esta función es asíncrona. Cuando la conexión es establecida, el evento [`'connect'`][] será emitido. Si existe un problema al conectar, en vez de un evento [`'connect'`][], se emitirá un evento [`'error'`][], con el error pasado por el listener [`'error'`][]. El último parámetro `connectListener`, si es suministrado, será añadido, **una sola vez**, con un listener para el evento [`'connect'`][].

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
* `connectListener` {Function} Parámetro común de los métodos [`socket.connect()`][]. Será añadido una vez como un listener para el evento [`'connect'`][].
* Devuelve: {net.Socket} El socket en sí.

Inicia una conexión en un socket dado. Normalmente este método no es necesario, el socket debería ser creado y abierto con [`net.createConnection()`][]. Usa esto solo cuando se implemente un socket personalizado.

Para conexiones TCP, los `options` son:

* `port` {number} Requerido. El puerto al que el socket debería conectarse.
* `host` {string} El holst al que el socket debería conectarse. **Predeterminado:** `'localhost'`.
* `localAddress` {string} Las direcciones locales a las que el socket debería conectarse.
* `localPort` {number} Puerto local al que el socket debería conectarse.
* `family` {number}: Versión del IP stack, puede ser `4` o `6`. **Predeterminado:** `4`.
* `hints` {number} [`dns.lookup()` hints][] Opcional.
* `lookup` {Function} Función de búsqueda personalizada. **Predeterminado:** [`dns.lookup()`][].

Para las conexiones [IPC](#net_ipc_support), los `options` disponibles son:

* `path` {string} Requerido. Rutas al que el cliente debe conectarse. Vea [Identificando rutas para conexiones IPC](#net_identifying_paths_for_ipc_connections). Si son proporcionados, las opciones específicas de TCP anteriores son ignoradas.

#### socket.connect(path[, connectListener])

* `path` {string} Ruta al que el cliente debe conectarse. Vea [Identificando rutas para conexiones IPC](#net_identifying_paths_for_ipc_connections).
* `connectListener` {Function} Parámetro común de los métodos [`socket.connect()`][]. Será añadido una vez como un listener para el evento [`'connect'`][].
* Devuelve: {net.Socket} El socket en sí.

Inicia una conexión [IPC](#net_ipc_support) en el socket dado.

Alias a [`socket.connect(options[, connectListener])`][`socket.connect(options)`] llamado con `{ path: path }` como un `options`.

#### socket.connect(port\[, host\]\[, connectListener\])
<!-- YAML
added: v0.1.90
-->

* `port` {number} Puerto al que el cliente debe conectarse.
* `host` {string} Host al que el cliente debe conectarse.
* `connectListener` {Function} Parámetro común de los métodos [`socket.connect()`][]. Será añadido una vez como un listener para el evento [`'connect'`][].
* Devuelve: {net.Socket} El socket en sí.

Inicia una conexión TCP en el socket dado.

Alias a [`socket.connect(options[, connectListener])`][`socket.connect(options)`] llamado con `{port: port, host: host}` como un `options`.

### socket.connecting
<!-- YAML
added: v6.1.0
-->

If `true`, [`socket.connect(options[, connectListener])`][`socket.connect(options)`] was called and has not yet finished. It will stay `true` until the socket becomes connected, then it is set to `false` and the `'connect'` event is emitted.  Note that the [`socket.connect(options[, connectListener])`][`socket.connect(options)`] callback is a listener for the `'connect'` event.

### socket.destroy([exception])
<!-- YAML
added: v0.1.90
-->

* `exception` {Object}
* Devuelve: {net.Socket}

Asegura que ninguna actividad I/O ocurra en este socket. Solo es necesario en caso de errores (como error de análisis u otros).

Si se especifica la `exception`, un evento[`'error'`][] será emitido y cualquier listener por ese evento recibirá un `exception` como un argumento.

### socket.destroyed

* {boolean} Indica si la conexión es destruida o no. Una vez que una conexión es destruida ningunos datos futuros pueden ser transferidos usandolo.

### socket.end(\[data\]\[, encoding\][, callback])
<!-- YAML
added: v0.1.90
-->

* `data` {string|Buffer|Uint8Array}
* `encoding` {string} Solo se usa cuando los datos son `string`. **Predeterminado:** `'utf8'`.
* `callback` {Function} Optional callback for when the socket is finished.
* Devuelve: {net.Socket} El socket en sí.

Entrecierra el socket. p. ej., envía un paquete FIN. Es posible que el servidor envíe algo de datos.

Si se especifica la `data`, es equivalente a llamar `socket.write(data, encoding)`seguido de [`socket.end()`][].

### socket.localAddress
<!-- YAML
added: v0.9.6
-->

La representación en string de la dirección IP local a la que el cliente remoto se está conectando. Por ejemplo, en un servidor escuchando en `'0.0.0.0'`, si un cliente se conecta en `'192.168.1.1'`, el valor de `socket.localAddress` sería `'192.168.1.1'`.

### socket.localPort
<!-- YAML
added: v0.9.6
-->

La representación numérica del puerto local. For example, `80` or `21`.

### socket.pause()

* Devuelve: {net.Socket} El socket en sí.

Pausa los datos que se están leyendo. Es decir, los eventos [`'data'`][] no serán emitidos. Útil para acelerar una subida.

### socket.pending
<!-- YAML
added: v10.16.0
-->

* {boolean}

This is `true` if the socket is not connected yet, either because `.connect()` has not yet been called or because it is still in the process of connecting (see [`socket.connecting`][]).

### socket.ref()
<!-- YAML
added: v0.9.1
-->

* Devuelve: {net.Socket} El socket en sí.

De forma contraria a `unref()`, llamar a `ref()` en un socket donde ha sido llamado `unref` *no* dejará al programa salir si es el único socket que queda (el comportamiento predeterminado). El el socket fue llamado `ref`, llamar a `ref` denuevo no tendrá efecto.

### socket.remoteAddress
<!-- YAML
added: v0.5.10
-->

La representación en string de la dirección IP remota. Por ejemplo, `'74.125.127.100'` o `'2001:4860:a005::68'`. El valor puede estar `undefined` si el socket es destruido (por ejemplo, si el cliente se desconecta).

### socket.remoteFamily
<!-- YAML
added: v0.11.14
-->

La representación en string de la familia IP remota. `'IPv4'` or `'IPv6'`.

### socket.remotePort
<!-- YAML
added: v0.5.10
-->

La representación numérica del puerto remoto. For example, `80` or `21`.

### socket.resume()

* Devuelve: {net.Socket} El socket en sí.

Reanuda la lectura después de llamar a [`socket.pause()`][].

### socket.setEncoding([encoding])
<!-- YAML
added: v0.1.90
-->

* `encoding` {string}
* Devuelve: {net.Socket} El socket en sí.

Establece la codificación para el socket como una [Stream Legible](stream.html#stream_class_stream_readable). Vea [`readable.setEncoding()`][] para más información.

### socket.setKeepAlive(\[enable\]\[, initialDelay\])
<!-- YAML
added: v0.1.92
-->

* `enable` {boolean} **Predeterminado:** `false`
* `initialDelay` {number} **Predeterminado:** `0`
* Devuelve: {net.Socket} El socket en sí.

Habilitar/deshabilitar la funcionalidad keep-alive y establecer opcionalmente el retraso antes de que la primera sonda keepalive sea enviada a un socket inactivo.

Establece `initialDelay` (en milisegundos) para establecer el retraso entre los últimos paquetes de datos recibidos y la primera sonda keepalive. Configurar a `0` para el `initialDelay` dejará sin cambiar el valor de la configuración predeterminada (o la previa).

### socket.setNoDelay([noDelay])
<!-- YAML
added: v0.1.90
-->

* `noDelay` {boolean} **Predeterminado:** `true`
* Devuelve: {net.Socket} El socket en sí.

Desactiva el algoritmo Nagle. De manera predeterminada, las conexiones TCP usan el algoritmo Nagle, almacenan los datos antes de ser enviados. Establecer a `true` para `noDelay` va a disparar datos inmediatamente cada vez que `socket.write()` sea llamado.

### socket.setTimeout(timeout[, callback])
<!-- YAML
added: v0.1.90
-->

* `timeout` {number}
* `callback` {Function}
* Devuelve: {net.Socket} El socket en sí.

Establece el socket para que haga un timeout después de `timeout` milisegundos de inactividad en el socket. De manera predeterminada, el `net.Socket` no tiene un timeout.

Cuando un timeout en espera es activado, el socket recibirá un evento [`'timeout'`][], pero la conexión no será intenrrupida. El usuario debe llamar manualmente a [`socket.end()`][] o [`socket.destroy()`][] para finalizar la conexión.

```js
socket.setTimeout(3000);
socket.on('timeout', () => {
  console.log('socket timeout');
  socket.end();
});
```

Si el `timeout` es 0, el timeout existente en espera es desactivado.

El parámetro `callback` opcional será añadido como un listener de un solo uso para el evento [`'timeout'`][].

### socket.unref()
<!-- YAML
added: v0.9.1
-->

* Devuelve: {net.Socket} El socket en sí.

Llamar a `unref()` en un socket permitirá al programa salir si es el único socket activo en el sistema de eventos. Si el socket ya fue llamado `unref`, llamar a `unref()` de nuevo no tendrá ningún efecto.

### socket.write(data\[, encoding\]\[, callback\])
<!-- YAML
added: v0.1.90
-->

* `data` {string|Buffer|Uint8Array}
* `encoding` {string} Solo se usa cuando los datos son `string`. **Predeterminado:** `utf8`.
* `callback` {Function}
* Devuelve: {boolean}

Envía los datos en el scoket. El segundo parámetro especifica la codificación en el caso de un string — se vuelve por defecto la codificación UTF8.

Devuelve como `true` si todos los datos fueron arrojados con éxito al búfer del núcleo. Devuelve `false` si todos o parte de los datos fueron puestos en cola en la memoria del usuario. [`'drain'`][] será emitido cuando el búfer esté libre de nuevo.

El parámetro opcional `callback` será ejecutado cuando los datos son finalmente escritos - esto podría no ser inmediatamente.

Vea el método [`write()`](stream. html#stream_writable_write_chunk_encoding_callback) stream `Writable` para más información.

## net.connect()

Alias a [`net.createConnection()`][`net.createConnection()`].

Firmas posibles:

* [`net.connect(options[, connectListener])`][`net.connect(options)`]
* [`net.connect(path[, connectListener])`][`net.connect(path)`] for [IPC](#net_ipc_support) connections.
* [`net.connect(port[, host][, connectListener])`][`net.connect(port, host)`] para conexiones TCP.

### net.connect(options[, connectListener])
<!-- YAML
added: v0.7.0
-->
* `opciones` {Object}
* `connectListener` {Function}

Alias a [`net.createConnection(options[, connectListener])`][`net.createConnection(options)`].

### net.connect(path[, connectListener])
<!-- YAML
added: v0.1.90
-->
* `path` {string}
* `connectListener` {Function}

Alias a [`net.createConnection(path[, connectListener])`][`net.createConnection(path)`].

### net.connect(port\[, host\]\[, connectListener\])
<!-- YAML
added: v0.1.90
-->
* `port` {number}
* `host` {string}
* `connectListener` {Function}

Alias a [`net.createConnection(port[, host][, connectListener])`][`net.createConnection(port, host)`].

## net.createConnection()

Una función de fábrica que crea una nueva [`net.Socket`][], inmediatamente inicia conexión con [`socket.connect()`][], entonces devuelve el `net.Socket` que inicia la conexión.

Cuando la conexión es establecida, un evento [`'connect'`][] será emitido en el socket devuelto. El último parámetro, `connectListener`, si es suministrado, será añadido **una sola vez** como un listener para el evento [`'connect'`][].

Firmas posibles:

* [`net.createConnection(options[, connectListener])`][`net.createConnection(options)`]
* [`net.createConnection(path[, connectListener])`][`net.createConnection(path)`] para conexiones [IPC](#net_ipc_support).
* [`net.createConnection(port[, host][, connectListener])`][`net.createConnection(port, host)`] para conexiones TCP.

La función [`net.connect()`][] es un alias de esta función.

### net.createConnection(options[, connectListener])
<!-- YAML
added: v0.1.90
-->

* `options` {Object} Requerido. Será pasado tanto como por la llamada [`new net.Socket([options])`][`new net.Socket(options)`] y el método [`socket.connect(options[, connectListener])`][`socket.connect(options)`].
* `connectListener` {Function} Parámetro común de las funciones [`net.createConnection()`][]. Si es proporcionado, será añadido una vez como un listener para el evento [`'connect'`][] en el socket devuelto.
* Devuelve: {net.Socket} El socket recién creado usado para iniciar la conexión.

Para las opciones disponibles, vea [`new net.Socket([options])`][`new net.Socket(options)`] y [`socket.connect(options[, connectListener])`][`socket.connect(options)`].

Opciones adicionales:

* `timeout` {number} Si es establecido, será usado para llamar a [`socket.setTimeout(timeout)`][] después que el socket sea creado, pero antes de que se inicie la conexión.

A continuación, hay un ejemplo de un cliente en un servidor echo, descrito en la sección [`net.createServer()`][]:

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

Para conectar en el socket `/tmp/echo.sock`, la segunda línea sería cambiada a:

```js
const client = net.createConnection({ path: '/tmp/echo.sock' });
```

### net.createConnection(path[, connectListener])
<!-- YAML
added: v0.1.90
-->

* `path` {string} Ruta a la que el socket debería conectarse. Será pasado a [`socket.connect(path[, connectListener])`][`socket.connect(path)`]. Vea [Identificando rutas para conexiones ICP](#net_identifying_paths_for_ipc_connections).
* `connectListener` {Function} Parámetro común de las funciones [`net.createConnection()`][], un listener "una sola vez" para el evento `'connect'` en el socket que está iniciando. Será pasado a [`socket.connect(path[, connectListener])`][`socket.connect(path)`].
* Devuelve: {net.Socket} El socket recién creado usado para iniciar la conexión.

Inicia una conexión [IPC](#net_ipc_support).

Esta función crea un nuevo [`net.Socket`][] con todas las opciones en su manera predeterminada, inicia inmediatamente conexión con [`socket.connect(path[, connectListener])`][`socket.connect(path)`], entonces devuelve el `net.Socket` que inicia la conexión.

### net.createConnection(port\[, host\]\[, connectListener\])
<!-- YAML
added: v0.1.90
-->

* `port` {number} Puerto al que el socket debería conectarse. Será pasado a [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`].
* `host` {string} Host al que el socket debería conectarse. Será pasado a [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`]. **Predeterminado:** `'localhost'`.
* `connectListener` {Function} Parámetro común de las funciones [`net.createConnection()`][], un listener "una sola vez" para el evento `'connect'` en el socket que está iniciando. Será pasado a [`socket.connect(path[, connectListener])`][`socket.connect(port, host)`].
* Devuelve: {net.Socket} El socket recién creado usado para iniciar la conexión.

Inicia una conexión TCP.

Esta función crea un nuevo [`net.Socket`][] con todas las opciones en su manera predeterminada, inicia inmediatamente conexión con[`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`], entonces devuelve el `net.Socket` que inicia la conexión.

## net.createServer(\[options\]\[, connectionListener\])
<!-- YAML
added: v0.5.0
-->

* `opciones` {Object}
  * `allowHalfOpen` {boolean} Indica si las conexiones TCP entreabiertas están permitidas. **Predeterminado:** `false`.
  * `pauseOnConnect` {boolean} Indica si el socket debería ser pausado en conexiones entrantes. **Predeterminado:** `false`.
* `connectionListener` {Function} Se establece automáticamente como un listener para el evento [`'connection'`][].
* Devuelve: {net.Server}

Crea un nuevo servidor TCP o un servidor [IPC](#net_ipc_support).

Si `allowHalfOpen` es establecido como `true`, cuando el otro terminal del socket envíe un paquete FIN, el servidor solo enviará un paquete FIN de vuelta cuando [`socket.end()`][] sea llamado explícitamente, hasta entonces la conexión es entrecerrada (no es legible pero aún así es escribible). Vea el evento [`'end'`][] event y [RFC 1122](https://tools.ietf.org/html/rfc1122) (sección 4.2.2.13) para más información.

Si `pauseOnConnect` es establecido como `true`, entonces el socket asociado con cada conexión entrante será pausado, y no se leerán ningunos datos de su handle. Esto le permite a las conexiones que sean pasadas entre procesos sin que ningunos datos sean leídos por el proceso original. Para empezar a leer los datos de un socket pausado, llama a [`socket.resume()`][].

El servidor puede ser un servidor TCP o un servidor [IPC](#net_ipc_support), dependiendo de lo que ha sido pasado por [`listen()`][`server.listen()`].

Este es un ejemplo de un servidor echo TCP que escucha por conexiones en el puerto 8124:

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

Prueba esto usando `telnet`:

```console
$ telnet localhost 8124
```

Para escuchar en el socket `/tmp/echo.sock`, la tercera línea contado desde la última sería cambiada a:

```js
server.listen('/tmp/echo.sock', () => {
  console.log('server bound');
});
```

Usa `nc` para conectarse en un servidor de socket de dominio UNIX:

```console
$ nc -U /tmp/echo.sock
```

## net.isIP(input)
<!-- YAML
added: v0.3.0
-->

* `input` {string}
* Devuelve: {integer}

Prueba si lo introducido es una dirección IP. Devuelve `0` para los strings inválidos, devuelve `4` para versiones IP versión 4, y devuelve `6` para direcciones IP versión 6.

## net.isIPv4(input)
<!-- YAML
added: v0.3.0
-->

* `input` {string}
* Devuelve: {boolean}

Devuelve `true` si lo introducido es una dirección IP versión 4, de otra manera devuelve `false`.

## net.isIPv6(input)
<!-- YAML
added: v0.3.0
-->

* `input` {string}
* Devuelve: {boolean}

Devuelve `true` si lo introducido es una dirección IP versión 6, de lo contrario devuelve `false`.
