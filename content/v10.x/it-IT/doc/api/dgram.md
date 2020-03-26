# UDP/Datagram Sockets

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stabile

<!-- name=dgram -->

Il modulo `dgram` fornisce un'implementazione dei socket UDP Datagram.

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

## Class: dgram.Socket

<!-- YAML
added: v0.1.99
-->

The `dgram.Socket` object is an [`EventEmitter`][] that encapsulates the datagram functionality.

Le nuove istanze di `dgram.Socket` sono create utilizzando [`dgram.createSocket()`][]. La parola chiave `new` non dev'essere utilizzata per creare istanze `dgram.Socket`.

### Event: 'close'

<!-- YAML
added: v0.1.99
-->

L'evento `'close'` viene emesso dopo che un socket è stato chiuso con [`close()`][]. Una volta attivato, non verrà emesso nessun nuovo evento `'message'` su questo socket.

### Event: 'error'

<!-- YAML
added: v0.1.99
-->

* `exception` {Error}

L'evento `'error'` viene emesso ogni volta che si verifica un errore. The event handler function is passed a single `Error` object.

### Event: 'listening'

<!-- YAML
added: v0.1.99
-->

The `'listening'` event is emitted whenever a socket begins listening for datagram messages. Ciò si verifica non appena vengono creati i socket UDP.

### Event: 'message'

<!-- YAML
added: v0.1.99
-->

L'evento `'message'` viene emesso quando un nuovo datagram è disponibile su un socket. La funzione dell'event handler riceve due argomenti: `msg` e `rinfo`.

* `msg` {Buffer} Il messaggio.
* `rinfo` {Object} Informazioni sull'indirizzo remoto. 
  * `address` {string} L'indirizzo del mittente.
  * `family` {string} La famiglia di indirizzi (`'IPv4'` o `'IPv6'`).
  * `port` {number} La porta del mittente.
  * `size` {number} La dimensione del messaggio.

### socket.addMembership(multicastAddress[, multicastInterface])

<!-- YAML
added: v0.6.9
-->

* `multicastAddress` {string}
* `multicastInterface` {string}

Tells the kernel to join a multicast group at the given `multicastAddress` and `multicastInterface` using the `IP_ADD_MEMBERSHIP` socket option. If the `multicastInterface` argument is not specified, the operating system will choose one interface and will add membership to it. To add membership to every available interface, call `addMembership` multiple times, once per interface.

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

### socket.address()

<!-- YAML
added: v0.1.99
-->

* Restituisce: {Object}

Restituisce un object contenente le informazioni sull'indirizzo per un socket. For UDP sockets, this object will contain `address`, `family` and `port` properties.

### socket.bind(\[port\]\[, address\][, callback])

<!-- YAML
added: v0.1.99
-->

* `port` {integer}
* `address` {string}
* `callback` {Function} senza parametri. Chiamato quando il binding (collegamento) è completo.

For UDP sockets, causes the `dgram.Socket` to listen for datagram messages on a named `port` and optional `address`. If `port` is not specified or is `0`, the operating system will attempt to bind to a random port. If `address` is not specified, the operating system will attempt to listen on all addresses. Once binding is complete, a `'listening'` event is emitted and the optional `callback` function is called.

Note that specifying both a `'listening'` event listener and passing a `callback` to the `socket.bind()` method is not harmful but not very useful.

A bound datagram socket keeps the Node.js process running to receive datagram messages.

Se il binding fallisce, viene generato un evento `'error'`. In rare case (e.g. attempting to bind with a closed socket), an [`Error`][] may be thrown.

Esempio di un UDP server listening sulla porta 41234:

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

* `options` {Object} Obbligatorio. Supporta le seguenti proprietà: 
  * `port` {integer}
  * `address` {string}
  * `exclusive` {boolean}
* `callback` {Function}

For UDP sockets, causes the `dgram.Socket` to listen for datagram messages on a named `port` and optional `address` that are passed as properties of an `options` object passed as the first argument. If `port` is not specified or is `0`, the operating system will attempt to bind to a random port. If `address` is not specified, the operating system will attempt to listen on all addresses. Once binding is complete, a `'listening'` event is emitted and the optional `callback` function is called.

Note that specifying both a `'listening'` event listener and passing a `callback` to the `socket.bind()` method is not harmful but not very useful.

The `options` object may contain an additional `exclusive` property that is use when using `dgram.Socket` objects with the [`cluster`] module. When `exclusive` is set to `false` (the default), cluster workers will use the same underlying socket handle allowing connection handling duties to be shared. When `exclusive` is `true`, however, the handle is not shared and attempted port sharing results in an error.

A bound datagram socket keeps the Node.js process running to receive datagram messages.

Se il binding fallisce, viene generato un evento `'error'`. In rare case (e.g. attempting to bind with a closed socket), an [`Error`][] may be thrown.

Di seguito viene mostrato un esempio di socket che esegue il listening su una porta esclusiva.

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

* `callback` {Function} Called when the socket has been closed.

Chiude il socket sottostante e interrompe il listening dei dati su di esso. If a callback is provided, it is added as a listener for the [`'close'`][] event.

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

* Restituisce: {number} il socket `SO_RCVBUF` riceve la dimensione del buffer in byte.

### socket.getSendBufferSize()

<!-- YAML
added: v8.7.0
-->

* Restituisce: {number} il socket `SO_SNDBUF` invia la dimensione del buffer in byte.

### socket.ref()

<!-- YAML
added: v0.9.1
-->

By default, binding a socket will cause it to block the Node.js process from exiting as long as the socket is open. The `socket.unref()` method can be used to exclude the socket from the reference counting that keeps the Node.js process active. The `socket.ref()` method adds the socket back to the reference counting and restores the default behavior.

Chiamare `socket.ref()` più volte non avrà nessun effetto aggiuntivo.

The `socket.ref()` method returns a reference to the socket so calls can be chained.

### socket.send(msg\[, offset, length], port[, address\]\[, callback\])

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

* `msg` {Buffer|Uint8Array|string|Array} Messaggio da inviare.
* `offset` {integer} Offset nel buffer in cui inizia il messaggio.
* `length` {integer} Numero di byte nel messaggio.
* `port` {integer} Porto di destinazione.
* `address` {string} Hostname di destinazione o indirizzo IP.
* `callback` {Function} Chiamato quando il messaggio è stato inviato.

Trasmette un datagram sul socket. The destination `port` and `address` must be specified.

L'argomento `msg` contiene il messaggio da inviare. A seconda del tipo, può essere applicato un comportamento diverso. If `msg` is a `Buffer` or `Uint8Array`, the `offset` and `length` specify the offset within the `Buffer` where the message begins and the number of bytes in the message, respectively. If `msg` is a `String`, then it is automatically converted to a `Buffer` with `'utf8'` encoding. With messages that contain multi-byte characters, `offset` and `length` will be calculated with respect to [byte length](buffer.html#buffer_class_method_buffer_bytelength_string_encoding) and not the character position. Se `msg` è un array, `offset` e `length` non devono essere specificati.

L'argomento `address` è una stringa. If the value of `address` is a host name, DNS will be used to resolve the address of the host. If `address` is not provided or otherwise falsy, `'127.0.0.1'` (for `udp4` sockets) or `'::1'` (for `udp6` sockets) will be used by default.

If the socket has not been previously bound with a call to `bind`, the socket is assigned a random port number and is bound to the "all interfaces" address (`'0.0.0.0'` for `udp4` sockets, `'::0'` for `udp6` sockets.)

An optional `callback` function may be specified to as a way of reporting DNS errors or for determining when it is safe to reuse the `buf` object. Note that DNS lookups delay the time to send for at least one tick of the Node.js event loop.

The only way to know for sure that the datagram has been sent is by using a `callback`. If an error occurs and a `callback` is given, the error will be passed as the first argument to the `callback`. If a `callback` is not given, the error is emitted as an `'error'` event on the `socket` object.

Offset e length sono facoltativi, ma *devono* essere impostati se vengono utilizzati entrambi. Sono supportati solo quando il primo argomento è un `Buffer` o un `Uint8Array`.

Esempio d'invio di un pacchetto UDP a una porta su `localhost`;

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

Sending multiple buffers might be faster or slower depending on the application and operating system. It is important to run benchmarks to determine the optimal strategy on a case-by-case basis. Generally speaking, however, sending multiple buffers is faster.

**Una Nota sulla dimensione del UDP Datagram**

The maximum size of an `IPv4/v6` datagram depends on the `MTU` (*Maximum Transmission Unit*) and on the `Payload Length` field size.

* The `Payload Length` field is `16 bits` wide, which means that a normal payload exceed 64K octets *including* the internet header and data (65,507 bytes = 65,535 − 8 bytes UDP header − 20 bytes IP header); this is generally true for loopback interfaces, but such long datagram messages are impractical for most hosts and networks.

* The `MTU` is the largest size a given link layer technology can support for datagram messages. For any link, `IPv4` mandates a minimum `MTU` of `68` octets, while the recommended `MTU` for IPv4 is `576` (typically recommended as the `MTU` for dial-up type applications), whether they arrive whole or in fragments.
  
  For `IPv6`, the minimum `MTU` is `1280` octets, however, the mandatory minimum fragment reassembly buffer size is `1500` octets. The value of `68` octets is very small, since most current link layer technologies, like Ethernet, have a minimum `MTU` of `1500`.

It is impossible to know in advance the MTU of each link through which a packet might travel. Sending a datagram greater than the receiver `MTU` will not work because the packet will get silently dropped without informing the source that the data did not reach its intended recipient.

### socket.setBroadcast(flag)

<!-- YAML
added: v0.6.9
-->

* `flag` {boolean}

Imposta o cancella l'opzione socket `SO_BROADCAST`. When set to `true`, UDP packets may be sent to a local interface's broadcast address.

### socket.setMulticastInterface(multicastInterface)

<!-- YAML
added: v8.6.0
-->

* `multicastInterface` {string}

*All references to scope in this section are referring to [IPv6 Zone Indices](https://en.wikipedia.org/wiki/IPv6_address#Scoped_literal_IPv6_addresses), which are defined by [RFC 4007](https://tools.ietf.org/html/rfc4007). In string form, an IP with a scope index is written as `'IP%scope'` where scope is an interface name or interface number.*

Sets the default outgoing multicast interface of the socket to a chosen interface or back to system interface selection. The `multicastInterface` must be a valid string representation of an IP from the socket's family.

For IPv4 sockets, this should be the IP configured for the desired physical interface. All packets sent to multicast on the socket will be sent on the interface determined by the most recent successful use of this call.

For IPv6 sockets, `multicastInterface` should include a scope to indicate the interface as in the examples that follow. In IPv6, individual `send` calls can also use explicit scope in addresses, so only packets sent to a multicast address without specifying an explicit scope are affected by the most recent successful use of this call.

#### Esempi: Interfaccia Multicast In Uscita IPv6

Sulla maggior parte dei sistemi, in cui il formato dello scope utilizza il nome dell'interfaccia:

```js
const socket = dgram.createSocket('udp6');

socket.bind(1234, () => {
  socket.setMulticastInterface('::%eth1');
});
```

Su Windows, in cui il formato dello scope utilizza un numero dell'interfaccia:

```js
const socket = dgram.createSocket('udp6');

socket.bind(1234, () => {
  socket.setMulticastInterface('::%2');
});
```

#### Esempio: Interfaccia Multicast In Uscita IPv4

Tutti i sistemi utilizzano un IP dell'host sull'interfaccia fisica desiderata:

```js
const socket = dgram.createSocket('udp4');

socket.bind(1234, () => {
  socket.setMulticastInterface('10.0.0.2');
});
```

#### Risultati della Chiamata

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

Imposta o cancella l'opzione socket `IP_MULTICAST_LOOP`. When set to `true`, multicast packets will also be received on the local interface.

### socket.setMulticastTTL(ttl)

<!-- YAML
added: v0.3.8
-->

* `ttl` {integer}

Imposta l'opzione socket `IP_MULTICAST_TTL`. While TTL generally stands for "Time to Live", in this context it specifies the number of IP hops that a packet is allowed to travel through, specifically for multicast traffic. Each router or gateway that forwards a packet decrements the TTL. If the TTL is decremented to 0 by a router, it will not be forwarded.

The argument passed to `socket.setMulticastTTL()` is a number of hops between 0 and 255. L'impostazione predefinita sulla maggior parte dei sistemi è `1` ma può variare.

### socket.setRecvBufferSize(size)

<!-- YAML
added: v8.7.0
-->

* `size` {integer}

Imposta l'opzione socket `SO_RCVBUF`. Sets the maximum socket receive buffer in bytes.

### socket.setSendBufferSize(size)

<!-- YAML
added: v8.7.0
-->

* `size` {integer}

Imposta l'opzione socket `SO_SNDBUF`. Sets the maximum socket send buffer in bytes.

### socket.setTTL(ttl)

<!-- YAML
added: v0.1.101
-->

* `ttl` {integer}

Imposta l'opzione socket `IP_TTL`. While TTL generally stands for "Time to Live", in this context it specifies the number of IP hops that a packet is allowed to travel through. Each router or gateway that forwards a packet decrements the TTL. Se il TTL viene decrementato fino a 0 da un router, non verrà inoltrato. La modifica dei valori TTL viene in genere eseguita per sonde di rete o multicasting.

L'argomento passato a `socket.setTTL()` è un numero di hop compreso tra 1 e 255. L'impostazione predefinita sulla maggior parte dei sistemi è 64 ma può variare.

### socket.unref()

<!-- YAML
added: v0.9.1
-->

By default, binding a socket will cause it to block the Node.js process from exiting as long as the socket is open. The `socket.unref()` method can be used to exclude the socket from the reference counting that keeps the Node.js process active, allowing the process to exit even if the socket is still listening.

Chiamare `socket.unref()` più volte non avrà nessun effetto aggiuntivo.

The `socket.unref()` method returns a reference to the socket so calls can be chained.

### Passaggio al comportamento asincrono `socket.bind()`

As of Node.js v0.10, [`dgram.Socket#bind()`][] changed to an asynchronous execution model. Legacy code would use synchronous behavior:

```js
const s = dgram.createSocket('udp4');
s.bind(1234);
s.addMembership('224.0.0.114');
```

Such legacy code would need to be changed to pass a callback function to the [`dgram.Socket#bind()`][] function:

```js
const s = dgram.createSocket('udp4');
s.bind(1234, () => {
  s.addMembership('224.0.0.114');
});
```

## Funzioni del modulo `dgram`

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

* `options` {Object} Le opzioni disponibili sono: 
  * `type` {string} La famiglia del socket. Dev'essere `'udp4'` oppure `'udp6'`. Obbligatorio.
  * `reuseAddr` {boolean} When `true` [`socket.bind()`][] will reuse the address, even if another process has already bound a socket on it. **Default:** `false`.
  * `recvBufferSize` {number} - Imposta il valore socket `SO_RCVBUF`.
  * `sendBufferSize` {number} - Imposta il valore socket `SO_SNDBUF`.
  * `lookup` {Function} Funzione lookup (di ricerca) personalizzata. **Default:** [`dns.lookup()`][].
* `callback` {Function} Allegato come listener per gli eventi `'message'`. Opzionale.
* Restituisce: {dgram.Socket}

Crea un `dgram.Socket` object. Once the socket is created, calling [`socket.bind()`][] will instruct the socket to begin listening for datagram messages. When `address` and `port` are not passed to [`socket.bind()`][] the method will bind the socket to the "all interfaces" address on a random port (it does the right thing for both `udp4` and `udp6` sockets). The bound address and port can be retrieved using [`socket.address().address`][] and [`socket.address().port`][].

### dgram.createSocket(type[, callback])

<!-- YAML
added: v0.1.99
-->

* `type` {string} - `'udp4'` oppure `'udp6'`.
* `callback` {Function} - Allegato come listener per gli eventi `'message'`.
* Restituisce: {dgram.Socket}

Crea un `dgram.Socket` object del `type` specificato. The `type` argument can be either `'udp4'` or `'udp6'`. An optional `callback` function can be passed which is added as a listener for `'message'` events.

Once the socket is created, calling [`socket.bind()`][] will instruct the socket to begin listening for datagram messages. When `address` and `port` are not passed to [`socket.bind()`][] the method will bind the socket to the "all interfaces" address on a random port (it does the right thing for both `udp4` and `udp6` sockets). The bound address and port can be retrieved using [`socket.address().address`][] and [`socket.address().port`][].