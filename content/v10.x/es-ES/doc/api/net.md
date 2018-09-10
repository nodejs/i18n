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

Esta clase es una abstracción de un socket TCP, o un terminal [IPC](#net_ipc_support) de transmición (usa pipes que ya tienen nombre en Windows, o sockets de dominio UNIX). Un `net.Socket` también es una [transmisión dúplex](stream.html#stream_class_stream_duplex), puede ser tanto como legible como escribible, también es un [`EventEmitter`][].

Un `net.Socket` puede ser creado por el usuario y ser usado directamente para interactuar con un servidor. Por ejemplo, es devuelto por [`net.createConnection()`][], para que el usuario pueda usarlo para hablar con el servidor.

También puede ser creado por Node.js y pasado al usuario cuando una conexión es recibida. Por ejemplo, es pasado a los listeners de un evento [`'connection'`][], emitido en un [`net.Server`][], para que el usuario pueda usarlo para interactuar con el cliente.

### new net.Socket([options])

<!-- YAML
added: v0.3.4
-->

Crea un nuevo objeto socket.

* `opciones` {Object} Las opciones disponibles son: 
  * `fd` {number} Si es especificado, se envuelve alrededor de un socket existente con el descriptor de archivos dado, de lo contrario un nuevo socket será creado.
  * `allowHalfOpen` {boolean} Indica si se permiten conexiones TCP entreabiertas. Vea [`net.createServer()`][] y el evento [`'end'`][], para detalles. **Predeterminado:** `false`.
  * `readable` {boolean} Permite la lectura en el socket cuando se pasa `fd`, de otra manera es ignorado. **Predeterminado:** `false`.
  * `writable` {boolean} Permite la escritura en el socket cuando se pasa `fd`, de otra manera es ignorado. **Predeterminado:** `false`.
* Devuelve: {net.Socket}

The newly created socket can be either a TCP socket or a streaming [IPC](#net_ipc_support) endpoint, depending on what it [`connect()`][`socket.connect()`] to.

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
* Devuelve: {net.Socket} El socket en sí mismo.

Esta función es asincrónica. Cuando la conexión es establecida, el evento [`'connect'`][] será emitido. Si existe un problema al conectar, en vez de un evento [`'connect'`][], se emitirá un evento [`'error'`][], con el error pasado por el listener [`'error'`][]. El último parámetro `connectListener`, si es suministrado, será añadido, **una sola vez**, con un listener para el evento [`'connect'`][].

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
* Devuelve: {net.Socket} El socket en sí mismo.

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
* Devuelve: {net.Socket} El socket en sí mismo.

Inicia una conexión [IPC](#net_ipc_support) en el socket dado.

Alias a [`socket.connect(options[, connectListener])`][`socket.connect(options)`] llamado con `{ path: path }` como un `options`.

#### socket.connect(port\[, host\]\[, connectListener\])

<!-- YAML
added: v0.1.90
-->

* `port` {number} Puerto al que el cliente debe conectarse.
* `host` {string} Host al que el cliente debe conectarse.
* `connectListener` {Function} Parámetro común de los métodos [`socket.connect()`][]. Será añadido una vez como un listener para el evento [`'connect'`][].
* Devuelve: {net.Socket} El socket en sí mismo.

Inicia una conexión TCP en el socket dado.

Alias a [`socket.connect(options[, connectListener])`][`socket.connect(options)`] llamado con `{port: port, host: host}` como un `options`.

### socket.connecting

<!-- YAML
added: v6.1.0
-->

Si es `true` - [`socket.connect(options[, connectListener])`][`socket.connect(options)`] fue llamado pero no ha finalizado aún. Será establecido como `false` antes de un evento `'connect'`, y/o llamando el callback de [`socket.connect(options[, connectListener])`][`socket.connect(options)`].

### socket.destroy([exception])

<!-- YAML
added: v0.1.90
-->

* Devuelve: {net.Socket}

Asegura que ninguna actividad I/O ocurra en este socket. Solo es necesario en caso de errores (como error de análisis u otros).

Si se especifica la `exception`, un evento[`'error'`][] será emitido y cualquier listener por ese evento recibirá un `exception` como un argumento.

### socket.destroyed

* {boolean} Indica si la conexión es destruida o no. Una vez que una conexión es destruida ningunos datos futuros pueden ser transferidos usandolo.

### socket.end(\[data\]\[, encoding\])

<!-- YAML
added: v0.1.90
-->

* Devuelve: {net.Socket} El socket en sí mismo.

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

La representación numérica del puerto local. Por ejemplo, `80` o `21`.

### socket.pause()

* Devuelve: {net.Socket} El socket en sí mismo.

Pausa los datos que se están leyendo. Es decir, los eventos [`'data'`][] no serán emitidos. Útil para acelerar una subida.

### socket.ref()

<!-- YAML
added: v0.9.1
-->

* Devuelve: {net.Socket} El socket en sí mismo.

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

La representación en string de la familia IP remota. `'IPv4'` o `'IPv6'`.

### socket.remotePort

<!-- YAML
added: v0.5.10
-->

La representación numérica del puerto remoto. For example, `80` o `21`.

### socket.resume()

* Devuelve: {net.Socket} El socket en sí mismo.

Reanuda la lectura después de llamar a [`socket.pause()`][].

### socket.setEncoding([encoding])

<!-- YAML
added: v0.1.90
-->

* Devuelve: {net.Socket} El socket en sí mismo.

Establece la codificación para el socket como una [Transmisión Legible](stream.html#stream_class_stream_readable). Vea [`readable.setEncoding()`][] para más información.

### socket.setKeepAlive(\[enable\]\[, initialDelay\])

<!-- YAML
added: v0.1.92
-->

* `enable` {boolean} **Predeterminado:** `false`
* `initialDelay` {number} **Predeterminado:** `0`
* Devuelve: {net.Socket} El socket en sí mismo.

Habilita/deshabilita la funcionalidad de mantener vivo y establecer opcionalmente el retraso antes de que la primera sonda keepalive sea enviada a un socket inactivo.

Establece `initialDelay` (en milisegundos) para establecer el retraso entre los últimos paquetes de datos recibidos y la primera sonda keepalive. Configurar a `0` para el `initialDelay` dejará sin cambiar el valor de la configuración predeterminada (o la previa).

### socket.setNoDelay([noDelay])

<!-- YAML
added: v0.1.90
-->

* `noDelay` {boolean} **Predeterminado:** `true`
* Devuelve: {net.Socket} El socket en sí mismo.

Desactiva el algoritmo Nagle. De manera predeterminada, las conexiones TCP usan el algoritmo Nagle, almacenan los datos antes de ser enviados. Establecer a `true` para `noDelay` va a disparar datos inmediatamente cada vez que `socket.write()` sea llamado.

### socket.setTimeout(timeout[, callback])

<!-- YAML
added: v0.1.90
-->

* Devuelve: {net.Socket} El socket en sí mismo.

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