# UDP/Datagram Sockets

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

<!-- name=dgram -->

El módulo `dgram` proporciona una implementación de sockets de UDP Datagrama.

```js
const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
});

server.on('listening', () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(41234);
// Prints: server listening 0.0.0.0:41234
```

## Class: `dgram.Socket`
<!-- YAML
added: v0.1.99
-->

* Extiende a: {EventEmitter}

Encapsulates the datagram functionality.

Las nuevas instancias de `dgram.Socket` son creadas usando [`dgram.createSocket()`][]. La palabra clave `new` no debe ser usada para crear instancias `dgram.Socket`.

### Event: `'close'`
<!-- YAML
added: v0.1.99
-->

El evento `'close'` se emite luego de que un socket es cerrado con [`close()`][]. Una vez activado, no se emitirán nuevos eventos `'message'` en este socket.

### Event: `'connect'`
<!-- YAML
added: v12.0.0
-->

The `'connect'` event is emitted after a socket is associated to a remote address as a result of a successful [`connect()`][] call.

### Event: `'error'`
<!-- YAML
added: v0.1.99
-->

* `exception` {Error}

El evento `'error'` se emite cada vez que se produce un error. The event handler function is passed a single `Error` object.

### Event: `'listening'`
<!-- YAML
added: v0.1.99
-->

El evento ` 'listening' ` se emite cada vez que un socket comienza a escuchar Mensajes de datagramas. Esto ocurre tan pronto como sockets UDP son creados.

### Event: `'message'`
<!-- YAML
added: v0.1.99
-->

El evento `'message'` se emite cuando un nuevo datagrama está disponible en un socket. El evento función del controlador pasa con dos argumentos: `msg` y `rinfo`.

* `msg` {Buffer} El mensaje.
* `rinfo` {Object} Remote address information.
  * `address` {string} La dirección del remitente.
  * `family` {string} La familia de direcciones (` 'IPv4' ` o ` 'IPv6' `).
  * `port` {number} El puerto del remitente.
  * `size` {number} Tamaño del mensaje.

### `socket.añadir miembro(multicastAddress [, multicastInterface])`
<!-- YAML
added: v0.6.9
-->

* `multicastAddress` {string}
* `multicastInterface` {string}

Le dice al kernel que se una a un grupo multicast en las `multicastAddress` y `multicastInterface` dadas usando la opción del socket `IP_ADD_MEMBERSHIP`. Si el argumento `multicastInterface` no está especificado, el sistema operativo elegirá una interfaz y le agregará una membresía. Para agregar membresía a cada interfaz disponible llame a `addMembership` varias veces, una vez por interfaz.

When sharing a UDP socket across multiple `cluster` workers, the `socket.addMembership()` function must be called only once or an `EADDRINUSE` error will occur:

```js
const cluster = require('cluster');
const dgram = require('dgram');
if (cluster.isMaster) {
  cluster.fork(); // Works ok.
  cluster.fork(); // Fails with EADDRINUSE.
} else {
  const s = dgram.createSocket('udp4');
  s.bind(1234, () => {
    s.addMembership('224.0.0.114');
  });
}
```

### `socket.addSourceSpecificMembership(sourceAddress, groupAddress[, multicastInterface])`
<!-- YAML
added: v12.16.0
-->
* `sourceAddress` {string}
* `groupAddress` {string}
* `multicastInterface` {string}

Tells the kernel to join a source-specific multicast channel at the given `sourceAddress` and `groupAddress`, using the `multicastInterface` with the `IP_ADD_SOURCE_MEMBERSHIP` socket option. If the `multicastInterface` argument is not specified, the operating system will choose one interface and will add membership to it. To add membership to every available interface, call `socket.addSourceSpecificMembership()` multiple times, once per interface.

### `socket.address()`
<!-- YAML
added: v0.1.99
-->

* Devuelve: {Object}

Devuelve un objeto incluyendo la información de la dirección para un socket. Para sockets UDP, este objeto contendrá `address`, `family` y propiedades de `port`.

### `socket.bind([port][, address][, callback])`
<!-- YAML
added: v0.1.99
changes:
  - version: v0.10
    description: The method was changed to an asynchronous execution model.
                 Legacy code would need to be changed to pass a callback
                 function to the method call.
-->

* `port` {integer}
* `address` {string}
* `callback` {Function} sin parámetros. Llamando cuando el enlace está completo.

Para sockets UDP, causa que `dgram.Socket` escuche por mensajes datagrama en un `port` llamado y `address` optional. Si `port` no es especificado o es `0`, el sistema operativo intentará enlazarse a un puerto aleatorio. Si `address` no es especificada, el sistema operativo intentará escuchar en todas las direcciones. Una vez que el enlace está completado, `'listening'` un evento es emitido y la función opcional `callback` es llamada.

Specifying both a `'listening'` event listener and passing a `callback` to the `socket.bind()` method is not harmful but not very useful.

Un socket de datagrama enlazado mantiene el proceso Node.js en ejecución para recibir mensajes de datagrama.

Si el enlace falla, se genera un evento `'error'`. En casos raros (por ejemplo, intentando enlazar con un socket cerrado), un [`Error`][] puede ser arrojado.

Ejemplo de un servidor UDP “listening” en el puerto 41234:

```js
const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
});

server.on('listening', () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(41234);
// Prints: server listening 0.0.0.0:41234
```

### `socket.bind(opciones[, callback])`
<!-- YAML
added: v0.11.14
-->

* `options` {Object} Requerido. Soporta las siguientes propiedades:
  * `port` {integer}
  * `address` {string}
  * `exclusivo` {boolean}
  * `fd`{integer}
* `callback` {Function}

Para sockets UDP, causa que `dgram.Socket` escuche por mensajes datagrama en un `port` nombrado y `address` opcional que son pasadas como propiedades de un objeto `options` pasado como el primer argumento. Si `port` no está especificado o es `0`, el sistema operativo intentará enlazar a un puerto aleatorio. Si`address` no es especificada, el sistema operativo intentará escuchar en todas las direcciones. Una vez que el enlace está completado, un evento `'listening'` es emitido y la función `callback` opcional es llamada.

The `options` object may contain a `fd` property. When a `fd` greater than `0` is set, it will wrap around an existing socket with the given file descriptor. In this case, the properties of `port` and `address` will be ignored.

Specifying both a `'listening'` event listener and passing a `callback` to the `socket.bind()` method is not harmful but not very useful.

The `options` object may contain an additional `exclusive` property that is used when using `dgram.Socket` objects with the [`cluster`][] module. Cuando `exclusive` es establecido como `false` (la manera predeterminada), los workers del clúster utilizarán el mismo handle del socket subyacente, permitiendo que las tareas del manejo de la conexión sean compartidas. Sin embargo, cuando `exclusive` es `true`, el handle no es compartido y los intentos de compartir el puerto resultan en un error.

Un socket de datagrama enlazado mantiene el proceso Node.js en ejecución para recibir mensajes de datagrama.

Si el enlace falla, se genera un evento `'error'`. En casos raros (por ejemplo, intentando enlazar con un socket cerrado), un [`Error`][] puede ser arrojado.

Un ejemplo de un socket escuchando a un puerto exclusivo es mostrado a continuación.

```js
socket.bind({
  address: 'localhost',
  port: 8000,
  exclusive: true
});
```

### `socket.close([callback])`
<!-- YAML
added: v0.1.99
-->

* `callback` {Function} Called when the socket has been closed.

Cierra el socket subyacente y deja de escuchar por datos en él. Si se provee un callback, es añadido como un listener para el evento [`'close'`][].

### `socket.connect(port[, address][, callback])`
<!-- YAML
added: v12.0.0
-->

* `port` {integer}
* `address` {string}
* `callback` {Function} Called when the connection is completed or on error.

Associates the `dgram.Socket` to a remote address and port. Every message sent by this handle is automatically sent to that destination. Also, the socket will only receive messages from that remote peer. Trying to call `connect()` on an already connected socket will result in an [`ERR_SOCKET_DGRAM_IS_CONNECTED`][] exception. If `address` is not provided, `'127.0.0.1'` (for `udp4` sockets) or `'::1'` (for `udp6` sockets) will be used by default. Once the connection is complete, a `'connect'` event is emitted and the optional `callback` function is called. In case of failure, the `callback` is called or, failing this, an `'error'` event is emitted.

### `socket.disconnect()`
<!-- YAML
added: v12.0.0
-->

A synchronous function that disassociates a connected `dgram.Socket` from its remote address. Trying to call `disconnect()` on an already disconnected socket will result in an [`ERR_SOCKET_DGRAM_NOT_CONNECTED`][] exception.

### `socket.dropMembership(multicastAddress[, multicastInterface])`
<!-- YAML
added: v0.6.9
-->

* `multicastAddress` {string}
* `multicastInterface` {string}

Instruye al Kernel para que deje un grupo multicast en `multicastAddress` usando la opción del socket `IP_DROP_MEMBERSHIP`. Este método es llamado automáticamente por el kernel cuando el socket es cerrado o cuando el proceso termina, para que la mayoría de las aplicaciones nunca tengan una razón para llamar a este método.

Si `multicastInterface` no es especificada, el sistema operativo intentará abandonar la membresía en todas las interfaces válidas.

### `socket.dropSourceSpecificMembership(sourceAddress, groupAddress[, multicastInterface])`
<!-- YAML
added: v12.16.0
-->

* `sourceAddress` {string}
* `groupAddress` {string}
* `multicastInterface` {string}

Instructs the kernel to leave a source-specific multicast channel at the given `sourceAddress` and `groupAddress` using the `IP_DROP_SOURCE_MEMBERSHIP` socket option. This method is automatically called by the kernel when the socket is closed or the process terminates, so most apps will never have reason to call this.

Si `multicastInterface` no es especificada, el sistema operativo intentará abandonar la membresía en todas las interfaces válidas.

### `socket.getRecvBufferSize()`
<!-- YAML
added: v8.7.0
-->

* Devuelve: {number} el socket `SO_RCVBUF` recibe el tamaño del búfer en bytes.

### `socket.getSendBufferSize()`
<!-- YAML
added: v8.7.0
-->

* Devuelve: {number} el socket `SO_SNDBUF` envía el tamaño del búfer en bytes.

### `socket.ref()`
<!-- YAML
added: v0.9.1
-->

* Devuelve: {dgram.Socket}

De manera predeterminada, enlazar un socket causará que este bloquee el cierre del proceso Node.js mientras permanezca el socket abierto. El método `socket.unref()` puede ser usado para excluir el socket de la cuenta de referencia, que mantiene el proceso Node.js activo. El método `socket.ref()` añade el socket de vuelta a la cuenta de referencia y restaura el comportamiento predeterminado.

Llamar a `socket.ref()` múltiples veces, no tendrá ningún efecto adicional.

El método `socket.ref()` devuelve una referencia al socket para que las llamadas puedan ser encadenadas.

### `socket.remoteAddress()`
<!-- YAML
added: v12.0.0
-->

* Devuelve: {Object}

Returns an object containing the `address`, `family`, and `port` of the remote endpoint. It throws an [`ERR_SOCKET_DGRAM_NOT_CONNECTED`][] exception if the socket is not connected.

### `socket.send(msg[, offset, length][, port][, address][, callback])`
<!-- YAML
added: v0.1.99
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11985
    description: The `msg` parameter can be an `Uint8Array` now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10473
    description: The `address` parameter is always optional now.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5929
    description: On success, `callback` will now be called with an `error`
                 argument of `null` rather than `0`.
  - version: v5.7.0
    pr-url: https://github.com/nodejs/node/pull/4374
    description: The `msg` parameter can be an array now. Also, the `offset`
                 and `length` parameters are optional now.
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/26871
    description: Added support for sending data on connected sockets.
-->

* `msg` {Buffer|Uint8Array|string|Array} Mensaje para ser enviado.
* `offset` {integer} Offset en el búfer donde comienza el mensaje.
* `length` {integer} Número de bytes en el mensaje.
* `port` {integer} Puerto de destino.
* `address` {string} Nombre de host de destino o dirección IP.
* `callback` {Function} Llamado cuando el mensaje ha sido enviado.

Transmite un datagrama en el socket. For connectionless sockets, the destination `port` and `address` must be specified. Connected sockets, on the other hand, will use their associated remote endpoint, so the `port` and `address` arguments must not be set.

El argumento `msg` contiene el mensaje que será enviado. Dependiendo de su tipo, se pueden aplicar distintos comportamientos. If `msg` is a `Buffer` or `Uint8Array`, the `offset` and `length` specify the offset within the `Buffer` where the message begins and the number of bytes in the message, respectively. Si `msg` es un `String`, entonces se convierte automáticamente en un `Buffer` con codificación `'utf8'`. With messages that contain multi-byte characters, `offset` and `length` will be calculated with respect to [byte length](buffer.html#buffer_class_method_buffer_bytelength_string_encoding) and not the character position. Si `msg` es un array, `offset` y `length` no deben ser especificados.

El argumento `address` es un string. Si el valor de `address` es un nombre del host, el DNS será usado para resolver la dirección del host. If `address` is not provided or otherwise falsy, `'127.0.0.1'` (for `udp4` sockets) or `'::1'` (for `udp6` sockets) will be used by default.

Si el socket no ha sido anteriormente enlazado con un llamado a `bind`, el socket es asignado a un número de puerto aleatorio y es enlazado a la dirección de "todas las interfaces" (`'0.0.0.0'` para sockets `udp4`, `'::0'` para sockets `udp6`.)

An optional `callback` function may be specified to as a way of reporting DNS errors or for determining when it is safe to reuse the `buf` object. DNS lookups delay the time to send for at least one tick of the Node.js event loop.

La única manera de saber con certeza que se ha enviado el datagrama es usando un `callback`. Si ocurre un error y se da un `callback`, el error será pasado como el primer argumento para el `callback`. Si no se da un `callback`, el error es emitido como un evento `'error'` en el objeto `socket`.

Offset and length are optional but both *must* be set if either are used. Solo son soportados cuando el primer argumento es un `Buffer` o `Uint8Array`.

Ejemplo de enviar un paquete UDP a un puerto en `localhost`;

```js
const dgram = require('dgram');
const message = Buffer.from('Some bytes');
const client = dgram.createSocket('udp4');
client.send(message, 41234, 'localhost', (err) => {
  client.close();
});
```

Example of sending a UDP packet composed of multiple buffers to a port on `127.0.0.1`;

```js
const dgram = require('dgram');
const buf1 = Buffer.from('Some ');
const buf2 = Buffer.from('bytes');
const client = dgram.createSocket('udp4');
client.send([buf1, buf2], 41234, (err) => {
  client.close();
});
```

Sending multiple buffers might be faster or slower depending on the application and operating system. Run benchmarks to determine the optimal strategy on a case-by-case basis. Generally speaking, however, sending multiple buffers is faster.

Example of sending a UDP packet using a socket connected to a port on `localhost`:

```js
const dgram = require('dgram');
const message = Buffer.from('Some bytes');
const client = dgram.createSocket('udp4');
client.connect(41234, 'localhost', (err) => {
  client.send(message, (err) => {
    client.close();
  });
});
```

#### Note about UDP datagram size

The maximum size of an `IPv4/v6` datagram depends on the `MTU` (_Maximum Transmission Unit_) and on the `Payload Length` field size.

* The `Payload Length` field is `16 bits` wide, which means that a normal payload exceed 64K octets _including_ the internet header and data (65,507 bytes = 65,535 − 8 bytes UDP header − 20 bytes IP header); this is generally true for loopback interfaces, but such long datagram messages are impractical for most hosts and networks.

* El `MTU` es el tamaño más grande que una tecnología de capa de enlace puede soportar para mensajes de datagrama. Para cualquier enlace `IPv4` exige un `MTU` mínimo de `68` octets, mientras que el `MTU` para IPv4 es `576` (recomendado comúnmente como el `MTU` para aplicaciones con un tipo de conexión por línea conmutada), ya bien si llegan completos o en fragmentos.

  Para `IPv6`, el `MTU` mínimo es de `1280` octetos, sin embargo, el tamaño mínimo obligatorio del búfer del reensamblaje de fragmentos es de `1500` octetos. El valor de `68` octetos es muy pequeño, puesto que las tecnologías de capa de enlace más recientes, como Ethernet, tienen un `MTU` mínimo de `1500`.

Es imposible saber con anterioridad el MTU de cada enlace por medio del cual un paquete podría viajar. Enviar un datagrama mayor que el `MTU` del receptor no funcionará porque el paquete será abandonado silenciosamente sin informar a la fuente que los datos no llegaron al destinatario deseado.

### `socket.setBroadcast(flag)`
<!-- YAML
added: v0.6.9
-->

* `flag` {boolean}

Establece o borra la opción socket `SO_BROADCAST`. Cuando se establece como `true`, los paquetes UDP pudieran ser enviados a una dirección de transmisión de la interfaz local.

### `socket.setMulticastInterface(multicastInterface)`
<!-- YAML
added: v8.6.0
-->

* `multicastInterface` {string}

*All references to scope in this section are referring to [IPv6 Zone Indices](https://en.wikipedia.org/wiki/IPv6_address#Scoped_literal_IPv6_addresses), which are defined by [RFC 4007](https://tools.ietf.org/html/rfc4007). In string form, an IP with a scope index is written as `'IP%scope'` where scope is an interface name or interface number.*

Establece la interfaz de multidifusión saliente predeterminada del socket a una interfaz escogida, o devuelve al sistema de selección de interfaces. El `multicastInterface` debe ser una representación string válida de una IP, de la familia del socket.

Para sockets IPv4, este debería ser el IP configurado para la interfaz física deseada. Todos los paquetes enviados a hacer multidifusión en el socket serán enviados a la interfaz, determinado por el uso exitoso más reciente de esta llamada.

Para sockets IPv6, `multicastInterface` debería incluir un scope para indicar la interfaz como en el siguiente ejemplo. En IPv6, llamadas `send` individualmente también pueden usar scope explícito en las direcciones, para que solo los paquetes enviados a una dirección de multidifusión sin especificar un scope explícito sean afectadas por el uso exitoso más reciente de esta llamada.

#### Ejemplos: IPv6 Interfaz de Multidifusión Saliente

En la mayoría de los sistemas, donde el formato scope usa el nombre de la interfaz:

```js
const socket = dgram.createSocket('udp6');

socket.bind(1234, () => {
  socket.setMulticastInterface('::%eth1');
});
```

En Windows, donde el formato scope usa un número de interfaz:

```js
const socket = dgram.createSocket('udp6');

socket.bind(1234, () => {
  socket.setMulticastInterface('::%2');
});
```

#### Ejemplo: IPv4 Interfaz de Multidifusión Saliente
Todos los sistemas usan un IP del host en la interfaz física deseada:

```js
const socket = dgram.createSocket('udp4');

socket.bind(1234, () => {
  socket.setMulticastInterface('10.0.0.2');
});
```

#### Resultados de la Llamada

A call on a socket that is not ready to send or no longer open may throw a *Not running* [`Error`][].

If `multicastInterface` can not be parsed into an IP then an *EINVAL* [`System Error`][] is thrown.

En IPv4, si `multicastInterface` es una dirección válida, pero no coincide con ninguna interfaz, o si la dirección no coincide con la familia, entonces se arroja un [`System Error`][], tal como `EADDRNOTAVAIL` o `EPROTONOSUP`.

On IPv6, most errors with specifying or omitting scope will result in the socket continuing to use (or returning to) the system's default interface selection.

CUALQUIER dirección de la familia de la dirección de un socket (IPv4 `'0.0.0.0'` or IPv6 `'::'`) puede ser usada para devolver el control de interfaz saliente predeterminada de los sockets al sistema para futuros paquetes multidifusores.

### `socket.setMulticastLoopback(flag)`
<!-- YAML
added: v0.3.8
-->

* `flag` {boolean}

Establece o borra la opción del socket `IP_MULTICAST_LOOP`. Cuando se establece como `true`, los paquetes de multidifusión también serán recibidos en la interfaz local.

### `socket.setMulticastTTL(ttl)`
<!-- YAML
added: v0.3.8
-->

* `ttl` {integer}

Establece la opción del socket `IP_MULTICAST_TTL`. Mientras que TTL generalmente significa "Tiempo Para Vivir", en este contexto especifica el número de saltos IP que un paquete es permitido viajar, especificamente para tráfico de multidifusión. Cada router o puerta de enlace que reenvía un paquete disminuye el TTL. Si el TTL es disminuido a 0 por un router, no se reenviará.

The `ttl` argument may be between 0 and 255. The default on most systems is `1`.

### `socket.setRecvBufferSize(size)`
<!-- YAML
added: v8.7.0
-->

* `size` {integer}

Establece la opción del socket `SO_RCVBUF`. Sets the maximum socket receive buffer in bytes.

### `socket.setSendBufferSize(size)`
<!-- YAML
added: v8.7.0
-->

* `size` {integer}

Establece la opción del socket `SO_SNDBUF`. Sets the maximum socket send buffer in bytes.

### `socket.setTTL(ttl)`
<!-- YAML
added: v0.1.101
-->

* `ttl` {integer}

Establece la opción del socket `IP_TTL`. Aunque que TTL generalmente significa "Tiempo Para Vivir", en este contexto especifica el número de saltos de IP a través de los cuales un paquete tiene permitido viajar. Cada router o puerta de enlace que reenvía un paquete disminuye el TTL. Si el TTL es disminuido a 0 por un router, no se reenviará. Valores TTL cambiantes son hechos por sondeos de red o cuando se hace multidifusión.

The `ttl` argument may be between between 1 and 255. The default on most systems is 64.

### `socket.unref()`
<!-- YAML
added: v0.9.1
-->

* Devuelve: {dgram.Socket}

De manera predeterminada, enlazar un socket causará que este bloquee el cierre del proceso Node.js mientras permanezca el socket abierto. El método `socket.unref()` puede ser usado para excluir el socket de la referencia, teniendo en cuenta que mantiene el proceso Node.js activo, permitiendo al proceso salir incluso si el socket sigue escuchando.

Llamar a `socket.unref()` múltiples veces no tendrá ningún efecto.

El método `socket.unref()` devuelve una referencia al socket para que las llamadas puedan ser encadenadas.

## `dgram` funciones del módulo

### `dgram.createSocket(options[, callback])`
<!-- YAML
added: v0.11.13
changes:
  - version: v8.6.0
    pr-url: https://github.com/nodejs/node/pull/14560
    description: The `lookup` option is supported.
  - version: v8.7.0
    pr-url: https://github.com/nodejs/node/pull/13623
    description: The `recvBufferSize` and `sendBufferSize` options are
                 supported now.
  - version: v11.4.0
    pr-url: https://github.com/nodejs/node/pull/23798
    description: The `ipv6Only` option is supported.
-->

* `options` {Object} Available options are:
  * `type` {string} La familia del socket. Debe ser `'udp4'` o `'udp6'`. Requerido.
  * `reuseAddr` {boolean} When `true` [`socket.bind()`][] will reuse the address, even if another process has already bound a socket on it. **Default:** `false`.
  * `ipv6Only` {boolean} Setting `ipv6Only` to `true` will disable dual-stack support, i.e., binding to address `::` won't make `0.0.0.0` be bound. **Default:** `false`.
  * `recvBufferSize` {number} Sets the `SO_RCVBUF` socket value.
  * `sendBufferSize` {number} Sets the `SO_SNDBUF` socket value.
  * `lookup` {Function} Función de búsqueda personalizada. **Default:** [`dns.lookup()`][].
* `callback` {Function} Adjuntada como un listener para eventos `'message'`. Opcional.
* Devuelve: {dgram.Socket}

Crea un objeto `dgram.Socket`. Once the socket is created, calling [`socket.bind()`][] will instruct the socket to begin listening for datagram messages. When `address` and `port` are not passed to [`socket.bind()`][] the method will bind the socket to the "all interfaces" address on a random port (it does the right thing for both `udp4` and `udp6` sockets). The bound address and port can be retrieved using [`socket.address().address`][] and [`socket.address().port`][].

### `dgram.createSocket(type[, callback])`
<!-- YAML
added: v0.1.99
-->

* `type` {string} Either `'udp4'` or `'udp6'`.
* `callback` {Function} Adjuntada como un listener para los eventos `'message'`.
* Devuelve: {dgram.Socket}

Crea un objeto `dgram.Socket` del `type` especificado.

Una vez que el socket es creado, llamar a [`socket.bind()`][] le dirá al socket que empiece a escuchar los mensajes de datagrama. When `address` and `port` are not passed to [`socket.bind()`][] the method will bind the socket to the "all interfaces" address on a random port (it does the right thing for both `udp4` and `udp6` sockets). La dirección y puerto enlazados pueden ser recuperados usando [`socket.address().address`][] and [`socket.address().port`][].
