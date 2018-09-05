# Sockets de UDP / Datagrama

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Stable

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
// server listening 0.0.0.0:41234
```

## Clase: dgram.Socket

<!-- YAML
added: v0.1.99
-->

El objeto `dgram.Socket` es un [`EventEmitter`][] que encapsula la funcionalidad de datagrama.

Nuevas instancias de `dgram.Socket` se crean usando [`dgram.createSocket()`][]. La palabra clave `new` no debe ser utilizada para crear instancias `dgram.Socket`.

### Evento: 'close'

<!-- YAML
added: v0.1.99
-->

El evento `'close'` se emite luego de que un socket es cerrado con [`close()`][]. Una vez activado, no van a ser emitidos nuevos eventos `'message'` en este socket.

### Evento: 'error'

<!-- YAML
added: v0.1.99
-->

* `exception` {Error}

El evento `'error'` es emitido cuando ocurre cualquier error. La función de manejador de eventos es pasada en un solo objeto `Error`.

### Evento: 'listening'

<!-- YAML
added: v0.1.99
-->

El evento `'listening'` es emitido cuando un socket comienza a escuchar por mensajes de datagrama. Esto ocurre tan pronto los sockets UDP son creados.

### Evento: 'message'

<!-- YAML
added: v0.1.99
-->

El evento `'message'` es emitido cuando un nuevo datagrama está disponible en un socket. The event handler function is passed two arguments: `msg` and `rinfo`.

* `msg` {Buffer} El mensaje.
* `rinfo` {Object} Información de dirección remota. 
  * `address` {string} La dirección del transmisor.
  * `family` {string} La familia de direcciones (`'IPv4'` o `'IPv6'`).
  * `port` {number} El puerto del transmisor.
  * `size` {number} El tamaño del mensaje.

### socket.addMembership(multicastAddress[, multicastInterface])

<!-- YAML
added: v0.6.9
-->

* `multicastAddress` {string}
* `multicastInterface` {string}

Tells the kernel to join a multicast group at the given `multicastAddress` and `multicastInterface` using the `IP_ADD_MEMBERSHIP` socket option. If the `multicastInterface` argument is not specified, the operating system will choose one interface and will add membership to it. To add membership to every available interface, call `addMembership` multiple times, once per interface.

### socket.address()

<!-- YAML
added: v0.1.99
-->

* Devuelve: {Object}

Devuelve un objeto que contiene la información de la dirección para un socket. Para sockets UDP, este objeto va a contener `address`, `family` y propiedades de `port`.

### socket.bind(\[port\]\[, address\][, callback])

<!-- YAML
added: v0.1.99
-->

* `port` {integer}
* `address` {string}
* `callback` {Function} sin parámetros. Llamado cuando el enlace es completado.

Para sockets UDP, causa que `dgram.Socket` escuche por mensajes datagrama en un `port` llamado y `address` opcional. Si `port` no es especificado o es `0`, el sistema operativo intentará enlazarse a un puerto aleatorio. Si no se especifica el `address`, el sistema operativo va a intentar escuchar a todas las direcciones. Una vez que el enlace es completado, un evento `'listening'` es emitido y la función opcional `callback` es llamada.

Note that specifying both a `'listening'` event listener and passing a `callback` to the `socket.bind()` method is not harmful but not very useful.

Un socket de datagrama enlazado mantiene el proceso Node.js en marcha para recibir mensajes de datagrama.

Si el enlace falla, es generado un evento `'error'`. En casos raros (p. ej. intentar enlazar con un socket cerrado), un [`Error`][] puede ser arrojado.

Ejemplo de un servidor UDP escuchando en el puerto 41234:

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
// server listening 0.0.0.0:41234
```

### socket.bind(options[, callback])

<!-- YAML
added: v0.11.14
-->

* `opciones` {Object} Requerido. Soporta las siguientes propiedades: 
  * `port` {integer}
  * `address` {string}
  * `exclusive` {boolean}
* `callback` {Function}

Para sockets UDP, causa que el `dgram.Socket` escuche por mensajes de datagrama en un `port` cuyo nombre fue dado, y `address` opcionales que son pasadas como propiedades de un objeto `options` pasado en el primer argumento. Si `port` no es especificado o es `0`, el sistema operativo intentará enlazarse a un puerto aleatorio. Si la `address` no es especificada, el sistema operativo intentará escuchar a todas las direcciones. Una vez que el enlace es completado, un evento `'listening'` es emitido, y la función opcional `callback` es llamada.

Note that specifying both a `'listening'` event listener and passing a `callback` to the `socket.bind()` method is not harmful but not very useful.

El objeto `options` puede contener una propiedad `exclusive` adicional que es utilizada cuando se usan objetos `dgram.Socket` con el módulo [`cluster`]. Cuando `exclusive` es establecida como `false` (la manera predeterminada), los workers del clúster usan el mismo handle socket subyacente permitiendo que el manejo de los deberes de las conexiones sean compartidos. Cuando `exclusive` es `true`, sin embargo, el handle no es compartido y los intentos de compartir el puerto resulta en un error.

Un socket de datagrama enlazado mantiene el proceso Node.js en marcha para recibir mensajes de datagrama.

Si el enlace falla, es generado un evento `'error'`. En casos raros (p. ej. intentar enlazar con un socket cerrado), un [`Error`][] puede ser arrojado.

Un ejemplo de un socket escuchando a un puerto exclusivo es mostrado a continuación.

```js
socket.bind({
  address: 'localhost',
  port: 8000,
  exclusive: true
});
```

### socket.close([callback])

<!-- YAML
added: v0.1.99
-->

Cierra el socket subyacente y deja de escuchar por datos en él. Si se provee un callback, es añadido como un listener para el evento [`'close'`][].

### socket.dropMembership(multicastAddress[, multicastInterface])

<!-- YAML
added: v0.6.9
-->

* `multicastAddress` {string}
* `multicastInterface` {string}

Instructs the kernel to leave a multicast group at `multicastAddress` using the `IP_DROP_MEMBERSHIP` socket option. This method is automatically called by the kernel when the socket is closed or the process terminates, so most apps will never have reason to call this.

If `multicastInterface` is not specified, the operating system will attempt to drop membership on all valid interfaces.

### socket.getRecvBufferSize()

<!-- YAML
added: v8.7.0
-->

* Returns: {number} the `SO_RCVBUF` socket receive buffer size in bytes.

### socket.getSendBufferSize()

<!-- YAML
added: v8.7.0
-->

* Returns: {number} the `SO_SNDBUF` socket send buffer size in bytes.

### socket.ref()

<!-- YAML
added: v0.9.1
-->

De manera predeterminada, enlazar un socket causará que bloquee el proceso Node.js de salir mientras el socket esté abierto. The `socket.unref()` method can be used to exclude the socket from the reference counting that keeps the Node.js process active. El método `socket.ref()` añade el socket de vuelta a la cuenta de referencia y restaura el comportamiento predeterminado.

Llamar a `socket.ref()` multiples veces, no tendrá ningún efecto adicional.

El método `socket.ref()` devuelve una referencia al socket para que las llamadas puedan ser encadenadas.

### socket.send(msg, \[offset, length,] port [, address\] \[, callback\])

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
-->

* `msg` {Buffer|Uint8Array|string|Array} Mensaje para ser enviado.
* `offset` {integer} Offset in the buffer where the message starts.
* `length` {integer} Número de bytes en el mensaje.
* `port` {integer} Puerto de destino.
* `address` {string} Nombre de host de destino o dirección IP.
* `callback` {Function} Llamada cuando el mensaje ha sido enviado.

Broadcasts a datagram on the socket. The destination `port` and `address` must be specified.

El argumento `msg` contiene el mensaje que será enviado. Dependiendo de su tipo, se puede aplicar distintos comportamientos. If `msg` is a `Buffer` or `Uint8Array`, the `offset` and `length` specify the offset within the `Buffer` where the message begins and the number of bytes in the message, respectively. Si `msg` es un `String`, entonces se convierte automáticamente en un `Buffer` con codificación `'utf8'`. With messages that contain multi-byte characters, `offset` and `length` will be calculated with respect to [byte length](buffer.html#buffer_class_method_buffer_bytelength_string_encoding) and not the character position. If `msg` is an array, `offset` and `length` must not be specified.

The `address` argument is a string. If the value of `address` is a host name, DNS will be used to resolve the address of the host. Si la `address` no es proporcionada o de lo contrario, falsa, van a ser usados de manera predeterminada `'127.0.0.1'` (para sockets `udp4`) or `'::1'` (para sockets `udp6`).

Si el socket no ha sido anteriormente enlazado con un llamado a `bind`, el socket es asignado a un número de puerto aleatorio y es enlazado a la dirección de "todas las interfaces" (`'0.0.0.0'` para sockets `udp4`, `'::0'` para sockets `udp6`.)

Una función opcional `callback` puede ser especificada como una manera de reportar los errores DNS o para determinar cuando es seguro reutilizar el objeto `buf`. Note that DNS lookups delay the time to send for at least one tick of the Node.js event loop.

La única manera de saber con certeza que se ha enviado el datagrama es usando un `callback`. Si ocurre un error y se da un `callback`, el error será pasado como el primer argumento pare el `callback`. Si no se da un `callback`, el error es emitido como un evento `'error'` en el objeto `socket`.

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

Ejemplo de enviar un paquete UDP compuesto de múltiples búferes a un puerto en `127.0.0.1`;

```js
const dgram = require('dgram');
const buf1 = Buffer.from('Some ');
const buf2 = Buffer.from('bytes');
const client = dgram.createSocket('udp4');
client.send([buf1, buf2], 41234, (err) => {
  client.close();
});
```

Enviar múltiples búferes puede ser más rápido o más lento dependiendo de la aplicación y del sistema operativo. Es importante ejecutar pruebas de rendimiento para determinar la estrategia óptima en una base de caso por caso. En general, sin embargo, enviar múltiples búferes es más rápido.

**Una nota sobre el tamaño de datagrama UDP**

El tamaño máximo de un datagrama `IPv4/v6` depende del `MTU` (*Unidad Máxima de Transmisión*), y del tamaño del campo de `Payload Length`.

* The `Payload Length` field is `16 bits` wide, which means that a normal payload exceed 64K octets *including* the internet header and data (65,507 bytes = 65,535 − 8 bytes UDP header − 20 bytes IP header); this is generally true for loopback interfaces, but such long datagram messages are impractical for most hosts and networks.

* The `MTU` is the largest size a given link layer technology can support for datagram messages. For any link, `IPv4` mandates a minimum `MTU` of `68` octets, while the recommended `MTU` for IPv4 is `576` (typically recommended as the `MTU` for dial-up type applications), whether they arrive whole or in fragments.
  
  Para `IPv6`, el `MTU` mínimo es `1280` octets, sin embargo, el tamaño mínimo obligatorio del búfer del reensamblaje de fragmento es `1500` octets. The value of `68` octets is very small, since most current link layer technologies, like Ethernet, have a minimum `MTU` of `1500`.

Es imposible saber con anterioridad el MTU de cada enlace por medio del cual un paquete podría viajar. Enviar un datagrama mayor que el `MTU` del receptor no funcionará porque el paquete será abandonado silenciosamente sin informar a la fuente que los datos no llegaron al destinatario deseado.

### socket.setBroadcast(flag)

<!-- YAML
added: v0.6.9
-->

* `flag` {boolean}

Establece o borra la opción socket `SO_BROADCAST`. When set to `true`, UDP packets may be sent to a local interface's broadcast address.

### socket.setMulticastInterface(multicastInterface)

<!-- YAML
added: v8.6.0
-->

* `multicastInterface` {string}

*Note: All references to scope in this section are referring to [IPv6 Zone Indices](https://en.wikipedia.org/wiki/IPv6_address#Scoped_literal_IPv6_addresses), which are defined by [RFC 4007](https://tools.ietf.org/html/rfc4007). In string form, an IP with a scope index is written as `'IP%scope'` where scope is an interface name or interface number.*

Sets the default outgoing multicast interface of the socket to a chosen interface or back to system interface selection. The `multicastInterface` must be a valid string representation of an IP from the socket's family.

Para sockets IPv4, este debería ser el IP configurado para la interfaz física deseada. All packets sent to multicast on the socket will be sent on the interface determined by the most recent successful use of this call.

For IPv6 sockets, `multicastInterface` should include a scope to indicate the interface as in the examples that follow. In IPv6, individual `send` calls can also use explicit scope in addresses, so only packets sent to a multicast address without specifying an explicit scope are affected by the most recent successful use of this call.

#### Examples: IPv6 Outgoing Multicast Interface

On most systems, where scope format uses the interface name:

```js
const socket = dgram.createSocket('udp6');

socket.bind(1234, () => {
  socket.setMulticastInterface('::%eth1');
});
```

On Windows, where scope format uses an interface number:

```js
const socket = dgram.createSocket('udp6');

socket.bind(1234, () => {
  socket.setMulticastInterface('::%2');
});
```

#### Example: IPv4 Outgoing Multicast Interface

All systems use an IP of the host on the desired physical interface:

```js
const socket = dgram.createSocket('udp4');

socket.bind(1234, () => {
  socket.setMulticastInterface('10.0.0.2');
});
```

#### Call Results

A call on a socket that is not ready to send or no longer open may throw a *Not running* [`Error`][].

If `multicastInterface` can not be parsed into an IP then an *EINVAL* [`System Error`][] is thrown.

On IPv4, if `multicastInterface` is a valid address but does not match any interface, or if the address does not match the family then a [`System Error`][] such as `EADDRNOTAVAIL` or `EPROTONOSUP` is thrown.

On IPv6, most errors with specifying or omitting scope will result in the socket continuing to use (or returning to) the system's default interface selection.

A socket's address family's ANY address (IPv4 `'0.0.0.0'` or IPv6 `'::'`) can be used to return control of the sockets default outgoing interface to the system for future multicast packets.

### socket.setMulticastLoopback(flag)

<!-- YAML
added: v0.3.8
-->

* `flag` {boolean}

Sets or clears the `IP_MULTICAST_LOOP` socket option. When set to `true`, multicast packets will also be received on the local interface.

### socket.setMulticastTTL(ttl)

<!-- YAML
added: v0.3.8
-->

* `ttl` {integer}

Sets the `IP_MULTICAST_TTL` socket option. While TTL generally stands for "Time to Live", in this context it specifies the number of IP hops that a packet is allowed to travel through, specifically for multicast traffic. Each router or gateway that forwards a packet decrements the TTL. If the TTL is decremented to 0 by a router, it will not be forwarded.

The argument passed to `socket.setMulticastTTL()` is a number of hops between 0 and 255. The default on most systems is `1` but can vary.

### socket.setRecvBufferSize(size)

<!-- YAML
added: v8.7.0
-->

* `size` {integer}

Sets the `SO_RCVBUF` socket option. Sets the maximum socket receive buffer in bytes.

### socket.setSendBufferSize(size)

<!-- YAML
added: v8.7.0
-->

* `size` {integer}

Sets the `SO_SNDBUF` socket option. Sets the maximum socket send buffer in bytes.

### socket.setTTL(ttl)

<!-- YAML
added: v0.1.101
-->

* `ttl` {integer}

Sets the `IP_TTL` socket option. While TTL generally stands for "Time to Live", in this context it specifies the number of IP hops that a packet is allowed to travel through. Each router or gateway that forwards a packet decrements the TTL. If the TTL is decremented to 0 by a router, it will not be forwarded. Changing TTL values is typically done for network probes or when multicasting.

The argument to `socket.setTTL()` is a number of hops between 1 and 255. The default on most systems is 64 but can vary.

### socket.unref()

<!-- YAML
added: v0.9.1
-->

By default, binding a socket will cause it to block the Node.js process from exiting as long as the socket is open. The `socket.unref()` method can be used to exclude the socket from the reference counting that keeps the Node.js process active, allowing the process to exit even if the socket is still listening.

Calling `socket.unref()` multiple times will have no addition effect.

The `socket.unref()` method returns a reference to the socket so calls can be chained.

### Change to asynchronous `socket.bind()` behavior

As of Node.js v0.10, [`dgram.Socket#bind()`][] changed to an asynchronous execution model. Legacy code that assumes synchronous behavior, as in the following example:

```js
const s = dgram.createSocket('udp4');
s.bind(1234);
s.addMembership('224.0.0.114');
```

Must be changed to pass a callback function to the [`dgram.Socket#bind()`][] function:

```js
const s = dgram.createSocket('udp4');
s.bind(1234, () => {
  s.addMembership('224.0.0.114');
});
```

## `dgram` module functions

### dgram.createSocket(options[, callback])

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
-->

* `options` {Object} Available options are: 
  * `type` {string} The family of socket. Must be either `'udp4'` or `'udp6'`. Required.
  * `reuseAddr` {boolean} When `true` [`socket.bind()`][] will reuse the address, even if another process has already bound a socket on it. **Default:** `false`.
  * `recvBufferSize` {number} - Sets the `SO_RCVBUF` socket value.
  * `sendBufferSize` {number} - Sets the `SO_SNDBUF` socket value.
  * `lookup` {Function} Custom lookup function. **Default:** [`dns.lookup()`][].
* `callback` {Function} Attached as a listener for `'message'` events. Optional.
* Returns: {dgram.Socket}

Creates a `dgram.Socket` object. Once the socket is created, calling [`socket.bind()`][] will instruct the socket to begin listening for datagram messages. When `address` and `port` are not passed to [`socket.bind()`][] the method will bind the socket to the "all interfaces" address on a random port (it does the right thing for both `udp4` and `udp6` sockets). The bound address and port can be retrieved using [`socket.address().address`][] and [`socket.address().port`][].

### dgram.createSocket(type[, callback])

<!-- YAML
added: v0.1.99
-->

* `type` {string} - Either `'udp4'` or `'udp6'`.
* `callback` {Function} - Attached as a listener to `'message'` events.
* Returns: {dgram.Socket}

Creates a `dgram.Socket` object of the specified `type`. The `type` argument can be either `'udp4'` or `'udp6'`. An optional `callback` function can be passed which is added as a listener for `'message'` events.

Once the socket is created, calling [`socket.bind()`][] will instruct the socket to begin listening for datagram messages. When `address` and `port` are not passed to [`socket.bind()`][] the method will bind the socket to the "all interfaces" address on a random port (it does the right thing for both `udp4` and `udp6` sockets). The bound address and port can be retrieved using [`socket.address().address`][] and [`socket.address().port`][].