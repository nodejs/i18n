# UDP/Datagram Sockets

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

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
// Prints: server listening 0.0.0.0:41234
```

## Class: `dgram.Socket`
<!-- YAML
added: v0.1.99
-->

* Estendendo: {EventEmitter}

Encapsulates the datagram functionality.

Le nuove istanze di `dgram.Socket` sono create utilizzando [`dgram.createSocket()`][]. La parola chiave `new` non dev'essere utilizzata per creare istanze `dgram.Socket`.

### Event: `'close'`
<!-- YAML
added: v0.1.99
-->

L'evento `'close'` viene emesso dopo che un socket è stato chiuso con [`close()`][]. Una volta attivato, non verrà emesso nessun nuovo evento `'message'` su questo socket.

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

L'evento `'error'` viene emesso ogni volta che si verifica un errore. The event handler function is passed a single `Error` object.

### Event: `'listening'`
<!-- YAML
added: v0.1.99
-->

L'evento `'listening'` viene emesso ogni volta che un socket inizia ad ascoltare (listening) i messaggi del datagram. Ciò si verifica non appena vengono creati i socket UDP.

### Event: `'message'`
<!-- YAML
added: v0.1.99
-->

L'evento `'message'` viene emesso quando un nuovo datagram è disponibile su un socket. La funzione dell'event handler riceve due argomenti: `msg` e `rinfo`.

* `msg` {Buffer} Il messaggio.
* `rinfo` {Object} Remote address information.
  * `address` {string} L'indirizzo del mittente.
  * `family` {string} La famiglia di indirizzi (`'IPv4'` o `'IPv6'`).
  * `port` {number} La porta del mittente.
  * `size` {number} La dimensione del messaggio.

### `socket.addMembership(multicastAddress[, multicastInterface])`
<!-- YAML
added: v0.6.9
-->

* `multicastAddress` {string}
* `multicastInterface` {string}

Indica al kernel di unirsi a un gruppo multicast sul `multicastAddress` e sul `multicastInterface` specificati utilizzando l'opzione socket `IP_ADD_MEMBERSHIP`. Se l'argomento `multicastInterface` non è specificato, il sistema operativo sceglierà un'interfaccia e ne aggiungerà l'iscrizione. Per aggiungere l'iscrizione a ogni interfaccia disponibile, chiama più volte `addMembership`, una volta per ogni interfaccia.

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

* Restituisce: {Object}

Restituisce un object contenente le informazioni sull'indirizzo per un socket. Per i socket UDP, quest'object conterrà le proprietà `address`, `family` e `port`.

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
* `callback` {Function} senza parametri. Chiamato quando il binding (collegamento) è completo.

Per i socket UDP, fa sì che il `dgram.Socket` ascolti i messaggi dei datagram su una `port` denominata e sull'`address` facoltativo. Se `port` non è specificato oppure corrisponde a `0`, il sistema operativo tenterà il binding (collegamento) ad una porta casuale. Se `address` non è specificato, il sistema operativo tenterà di eseguire il listening (ascolto) su tutti gli indirizzi. Una volta completato il binding, viene emesso un evento `'listening'` e viene chiamata la funzione `callback` opzionale.

Specifying both a `'listening'` event listener and passing a `callback` to the `socket.bind()` method is not harmful but not very useful.

Un socket datagram che ha completato il binding mantiene il processo Node.js in esecuzione per ricevere i messaggi del datagram.

Se il binding fallisce, viene generato un evento `'error'`. In rari casi (ad esempio quando si tenta di eseguire il binding con un socket chiuso), potrebbe essere generato un [`Error`][].

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
// Prints: server listening 0.0.0.0:41234
```

### `socket.bind(options[, callback])`
<!-- YAML
added: v0.11.14
-->

* `options` {Object} Richiesto. Supporta le seguenti proprietà:
  * `port` {integer}
  * `address` {string}
  * `exclusive` {boolean}
  * `fd` {integer}
* `callback` {Function}

Per i socket UDP, fa sì che `dgram.Socket` ascolti i messaggi dei datagram su una `port` denominata e sull'`address` facoltativo che vengono passati come proprietà di un `options` object passato come primo argomento. Se `port` non è specificato oppure corrisponde a `0`, il sistema operativo tenterà il binding (collegamento) a una porta casuale. Se `address` non è specificato, il sistema operativo tenterà di eseguire il listening (ascolto) su tutti gli indirizzi. Una volta completato il binding, viene emesso un evento `'listening'` e viene chiamata la funzione `callback` opzionale.

The `options` object may contain a `fd` property. When a `fd` greater than `0` is set, it will wrap around an existing socket with the given file descriptor. In this case, the properties of `port` and `address` will be ignored.

Specifying both a `'listening'` event listener and passing a `callback` to the `socket.bind()` method is not harmful but not very useful.

The `options` object may contain an additional `exclusive` property that is used when using `dgram.Socket` objects with the [`cluster`][] module. Quando `exclusive` è impostato su `false` (valore predefinito), gli worker del cluster utilizzeranno lo stesso socket handle sottostante permettendo la condivisione dei compiti di gestione delle connessioni. Tuttavia quando `exclusive` è `true`, l'handle non è condiviso e il tentativo di condivisione della porta genera un errore.

Un socket datagram che ha completato il binding mantiene il processo Node.js in esecuzione per ricevere i messaggi del datagram.

Se il binding fallisce, viene generato un evento `'error'`. In rari casi (ad esempio quando si tenta di eseguire il binding con un socket chiuso), potrebbe essere generato un [`Error`][].

Di seguito viene mostrato un esempio di socket che esegue il listening su una porta esclusiva.

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

Chiude il socket sottostante e interrompe il listening dei dati su di esso. Se viene fornito un callback, quest'ultimo viene aggiunto come listener per l'evento [`'close'`][].

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

Dà istruzioni al kernel di lasciare un gruppo multicast su `multicastAddress` utilizzando l'opzione socket `IP_DROP_MEMBERSHIP`. Questo metodo viene chiamato automaticamente dal kernel quando viene chiuso il socket o termina il processo, quindi la maggior parte delle app non avrà mai motivo di chiamarlo.

Se `multicastInterface` non è specificato, il sistema operativo tenterà di eliminare l'iscrizione su tutte le interfacce valide.

### `socket.dropSourceSpecificMembership(sourceAddress, groupAddress[, multicastInterface])`
<!-- YAML
added: v12.16.0
-->

* `sourceAddress` {string}
* `groupAddress` {string}
* `multicastInterface` {string}

Instructs the kernel to leave a source-specific multicast channel at the given `sourceAddress` and `groupAddress` using the `IP_DROP_SOURCE_MEMBERSHIP` socket option. This method is automatically called by the kernel when the socket is closed or the process terminates, so most apps will never have reason to call this.

Se `multicastInterface` non è specificato, il sistema operativo tenterà di eliminare l'iscrizione su tutte le interfacce valide.

### `socket.getRecvBufferSize()`
<!-- YAML
added: v8.7.0
-->

* Restituisce: {number} il socket `SO_RCVBUF` riceve la dimensione del buffer in byte.

### `socket.getSendBufferSize()`
<!-- YAML
added: v8.7.0
-->

* Restituisce: {number} il socket `SO_SNDBUF` invia la dimensione del buffer in byte.

### `socket.ref()`
<!-- YAML
added: v0.9.1
-->

* Restituisce: {dgram.Socket}

Di default, il binding di un socket causerà il blocco della conclusione del processo Node.js finché il socket è aperto. Il metodo `socket.unref()` può essere utilizzato per escludere il socket dal reference count che mantiene attivo il processo Node.js. Il metodo `socket.ref()` aggiunge il socket al reference count e ripristina il comportamento predefinito.

Chiamare `socket.ref()` più volte non avrà nessun effetto aggiuntivo.

Il metodo `socket.ref()` restituisce un riferimento al socket in modo che le chiamate possano essere concatenate.

### `socket.remoteAddress()`
<!-- YAML
added: v12.0.0
-->

* Restituisce: {Object}

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

* `msg` {Buffer|Uint8Array|string|Array} Messaggio da inviare.
* `offset` {integer} Offset nel buffer in cui inizia il messaggio.
* `length` {integer} Numero di byte nel messaggio.
* `port` {integer} Porto di destinazione.
* `address` {string} Hostname di destinazione o indirizzo IP.
* `callback` {Function} Chiamato quando il messaggio è stato inviato.

Trasmette un datagram sul socket. For connectionless sockets, the destination `port` and `address` must be specified. Connected sockets, on the other hand, will use their associated remote endpoint, so the `port` and `address` arguments must not be set.

L'argomento `msg` contiene il messaggio da inviare. A seconda del tipo, può essere applicato un comportamento diverso. If `msg` is a `Buffer` or `Uint8Array`, the `offset` and `length` specify the offset within the `Buffer` where the message begins and the number of bytes in the message, respectively. Se `msg` è una `String`, allora viene automaticamente convertito in un `Buffer` con codifica `'utf8'`. With messages that contain multi-byte characters, `offset` and `length` will be calculated with respect to [byte length](buffer.html#buffer_class_method_buffer_bytelength_string_encoding) and not the character position. Se `msg` è un array, `offset` e `length` non devono essere specificati.

L'argomento `address` è una stringa. Se il valore di `address` è un hostname, verrà utilizzato il DNS per risolvere l'indirizzo dell'host. If `address` is not provided or otherwise falsy, `'127.0.0.1'` (for `udp4` sockets) or `'::1'` (for `udp6` sockets) will be used by default.

Se il socket non è stato precedentemente sottoposto al binding con una chiamata a `bind`, gli viene assegnato un numero di porta casuale e viene sottoposto al binding con l'indirizzo di "tutte le interfacce" (`'0.0.0.0'` per i socket `udp4`, `'::0'` per i socket `udp6`.)

An optional `callback` function may be specified to as a way of reporting DNS errors or for determining when it is safe to reuse the `buf` object. DNS lookups delay the time to send for at least one tick of the Node.js event loop.

L'unico modo per sapere con certezza che il datagram sia stato inviato è l'utilizzo di un `callback`. Se si verifica un errore e viene fornito un `callback`, l'errore verrà passato al `callback` come primo argomento. Se non viene fornito un `callback`, l'errore viene emesso come un evento `'error'` sul `socket` object.

Offset and length are optional but both *must* be set if either are used. Sono supportati solo quando il primo argomento è un `Buffer` o un `Uint8Array`.

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

* L'`MTU` è la dimensione più grande che una determinata tecnologia a livello di collegamento può supportare per i messaggi datagram. Per ogni collegamento, `IPv4` richiede un `MTU` minimo di `68` ottetti, mentre il `MTU` raccomandato per IPv4 è di `576` (in genere raccomandato come `MTU` per le applicazioni di tipo dial-up), sia che arrivino interi o in frammenti.

  Per `IPv6`, il `MTU` minimo è di `1280` ottetti, tuttavia, la dimensione obbligatoria del buffer di riassemblaggio del frammento è di `1500` ottetti. Il valore di `68` ottetti è molto piccolo, poiché la maggior parte delle tecnologie attuali a livello di collegamento, come l'Ethernet, hanno un `MTU` minimo di `1500`.

È impossibile sapere in anticipo il MTU di ciascun collegamento attraverso il quale un pacchetto potrebbe viaggiare. L'invio di un datagram maggiore del receiver `MTU` non funzionerà perché il pacchetto verrà rilasciato automaticamente senza informare la sorgente del fatto che i dati non hanno raggiunto il destinatario previsto.

### `socket.setBroadcast(flag)`
<!-- YAML
added: v0.6.9
-->

* `flag` {boolean}

Imposta o cancella l'opzione socket `SO_BROADCAST`. Se impostato su `true`, i pacchetti UDP potrebbero essere inviati all'indirizzo di trasmissione dell'interfaccia locale.

### `socket.setMulticastInterface(multicastInterface)`
<!-- YAML
added: v8.6.0
-->

* `multicastInterface` {string}

*All references to scope in this section are referring to [IPv6 Zone Indices](https://en.wikipedia.org/wiki/IPv6_address#Scoped_literal_IPv6_addresses), which are defined by [RFC 4007](https://tools.ietf.org/html/rfc4007). In string form, an IP with a scope index is written as `'IP%scope'` where scope is an interface name or interface number.*

Imposta l'interfaccia multicast in uscita predefinita del socket su un'interfaccia selezionata o torna alla selezione dell'interfaccia di sistema. Il `multicastInterface` dev'essere la valida rappresentazione della stringa di un IP dalla famiglia del socket.

Per i socket IPv4, questo dovrebbe essere l'IP configurato per l'interfaccia fisica desiderata. Tutti i pacchetti inviati al multicast sul socket verranno inviati all'interfaccia determinata dall’ultima volta che questa chiamata è stata utilizzata con successo.

Per i socket IPv6, `multicastInterface` dovrebbe includere uno scope per indicare l'interfaccia come negli esempi a seguire. In IPv6, le singole chiamate `send` possono anche utilizzare lo scope esplicito negli indirizzi, pertanto solo i pacchetti inviati ad un indirizzo multicast senza specificare uno scope esplicito sono interessati dall’ultima volta che questa chiamata è stata utilizzata con successo.

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

Su IPv4, se `multicastInterface` è un indirizzo valido ma non corrisponde a nessun'interfaccia o se l'indirizzo non corrisponde alla famiglia, verrà generato un [`System Error`][] come `EADDRNOTAVAIL` o `EPROTONOSUP`.

On IPv6, most errors with specifying or omitting scope will result in the socket continuing to use (or returning to) the system's default interface selection.

È possibile utilizzare QUALSIASI indirizzo di una famiglia di indirizzi socket (IPv4 `'0.0.0.0'` o IPv6 `'::'`) per restituire il controllo dell'interfaccia in uscita predefinita dei socket al sistema per futuri pacchetti multicast.

### `socket.setMulticastLoopback(flag)`
<!-- YAML
added: v0.3.8
-->

* `flag` {boolean}

Imposta o cancella l'opzione socket `IP_MULTICAST_LOOP`. Se impostato su `true`, verranno ricevuti nell'interfaccia locale anche i pacchetti multicast.

### `socket.setMulticastTTL(ttl)`
<!-- YAML
added: v0.3.8
-->

* `ttl` {integer}

Imposta l'opzione socket `IP_MULTICAST_TTL`. Mentre TTL solitamente sta per "Time to Live", in questo contesto specifica il numero di IP hop che un pacchetto può attraversare, in particolare per il traffico multicast. Ogni router o gateway che inoltra un pacchetto decrementa il TTL. Se il TTL viene decrementato fino a 0 da un router, non verrà inoltrato.

The `ttl` argument may be between 0 and 255. The default on most systems is `1`.

### `socket.setRecvBufferSize(size)`
<!-- YAML
added: v8.7.0
-->

* `size` {integer}

Imposta l'opzione socket `SO_RCVBUF`. Sets the maximum socket receive buffer in bytes.

### `socket.setSendBufferSize(size)`
<!-- YAML
added: v8.7.0
-->

* `size` {integer}

Imposta l'opzione socket `SO_SNDBUF`. Sets the maximum socket send buffer in bytes.

### `socket.setTTL(ttl)`
<!-- YAML
added: v0.1.101
-->

* `ttl` {integer}

Imposta l'opzione socket `IP_TTL`. Mentre TTL solitamente sta per "Time to Live", in questo contesto specifica il numero di IP hop che un pacchetto può attraversare. Ogni router o gateway che inoltra un pacchetto decrementa il TTL. Se il TTL viene decrementato fino a 0 da un router, non verrà inoltrato. La modifica dei valori TTL viene in genere eseguita per sonde di rete o multicasting.

The `ttl` argument may be between between 1 and 255. The default on most systems is 64.

### `socket.unref()`
<!-- YAML
added: v0.9.1
-->

* Restituisce: {dgram.Socket}

Di default, il binding di un socket causerà il blocco della conclusione del processo Node.js finché il socket è aperto. Il metodo `socket.unref()` può essere utilizzato per escludere il socket dal reference count che mantiene attivo il processo Node.js, consentendo la conclusione del processo anche se il socket è ancora in fase di listening (ascolto).

Chiamare `socket.unref()` più volte non avrà nessun effetto aggiuntivo.

Il metodo `socket.unref()` restituisce un riferimento al socket in modo che le chiamate possano essere concatenate.

## Funzioni del modulo `dgram`

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
  * `type` {string} La famiglia del socket. Dev'essere `'udp4'` oppure `'udp6'`. Obbligatorio.
  * `reuseAddr` {boolean} When `true` [`socket.bind()`][] will reuse the address, even if another process has already bound a socket on it. **Default:** `false`.
  * `ipv6Only` {boolean} Setting `ipv6Only` to `true` will disable dual-stack support, i.e., binding to address `::` won't make `0.0.0.0` be bound. **Default:** `false`.
  * `recvBufferSize` {number} Sets the `SO_RCVBUF` socket value.
  * `sendBufferSize` {number} Sets the `SO_SNDBUF` socket value.
  * `lookup` {Function} Funzione lookup (di ricerca) personalizzata. **Default:** [`dns.lookup()`][].
* `callback` {Function} Allegato come listener per gli eventi `'message'`. Opzionale.
* Restituisce: {dgram.Socket}

Crea un `dgram.Socket` object. Once the socket is created, calling [`socket.bind()`][] will instruct the socket to begin listening for datagram messages. When `address` and `port` are not passed to [`socket.bind()`][] the method will bind the socket to the "all interfaces" address on a random port (it does the right thing for both `udp4` and `udp6` sockets). The bound address and port can be retrieved using [`socket.address().address`][] and [`socket.address().port`][].

### `dgram.createSocket(type[, callback])`
<!-- YAML
added: v0.1.99
-->

* `type` {string} Either `'udp4'` or `'udp6'`.
* `callback` {Function} Attached as a listener to `'message'` events.
* Restituisce: {dgram.Socket}

Crea un `dgram.Socket` object del `type` specificato.

Una volta creato il socket, chiamare [`socket.bind()`][] darà istruzioni al socket d'iniziare il listening (ascolto) dei messaggi del datagram. When `address` and `port` are not passed to [`socket.bind()`][] the method will bind the socket to the "all interfaces" address on a random port (it does the right thing for both `udp4` and `udp6` sockets). L'indirizzo e la porta collegati tramite il binding possono essere recuperati utilizzando [`socket.address().address`][] e [`socket.address().port`][].
