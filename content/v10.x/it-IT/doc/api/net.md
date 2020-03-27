# Rete

<!--introduced_in=v0.10.0-->

<!--lint disable maximum-line-length-->

> Stabilità: 2 - Stabile

The `net` module provides an asynchronous network API for creating stream-based TCP or [IPC](#net_ipc_support) servers ([`net.createServer()`][]) and clients ([`net.createConnection()`][]).

Ci si può accedere usando:

```js
const net = require('net');
```

## Supporto IPC

The `net` module supports IPC with named pipes on Windows, and UNIX domain sockets on other operating systems.

### Identificazione dei percorsi per le connessioni IPC

[`net.connect()`][], [`net.createConnection()`][], [`server.listen()`][] and [`socket.connect()`][] take a `path` parameter to identify IPC endpoints.

Su UNIX, il dominio locale è anche noto come il dominio UNIX. The path is a filesystem pathname. It gets truncated to `sizeof(sockaddr_un.sun_path) - 1`, which varies on different operating system between 91 and 107 bytes. I valori tipici sono 107 su Linux e 103 su macOS. The path is subject to the same naming conventions and permissions checks as would be done on file creation. If the UNIX domain socket (that is visible as a file system path) is created and used in conjunction with one of Node.js' API abstractions such as [`net.createServer()`][], it will be unlinked as part of [`server.close()`][]. On the other hand, if it is created and used outside of these abstractions, the user will need to manually remove it. The same applies when the path was created by a Node.js API but the program crashes abruptly. In short, a UNIX domain socket once successfully created will be visible in the filesystem, and will persist until unlinked.

Su Windows, il dominio locale viene implementato utilizzando una pipe denominata. The path *must* refer to an entry in ``\\?\pipe\` or``\\.\pipe`. Any characters are permitted, but the latter may do some processing of pipe names, such as resolving`..` sequences. Nonostante quello che potrebbe sembrare, lo spazio dei nomi della pipe è flat. Pipes will *not persist*. Vengono rimosse quando viene chiuso l'ultimo riferimento ad esse. Unlike UNIX domain sockets, Windows will close and remove the pipe when the owning process exits.

JavaScript string escaping requires paths to be specified with extra backslash escaping such as:

```js
net.createServer().listen(
  path.join('\\\\?\\pipe', process.cwd(), 'myctl'));
```

## Classe: Server di rete

<!-- YAML
added: v0.1.90
-->

Questa classe viene utilizzata per creare un server TCP o [IPC](#net_ipc_support).

### new net.Server(\[options\]\[, connectionListener\])

* `options` {Object} See [`net.createServer([options][, connectionListener])`][`net.createServer()`].
* `connectionListener` {Function} Automatically set as a listener for the [`'connection'`][] event.
* Restituisce: {net.Server}

`net.Server` è un [`EventEmitter`][] con i seguenti eventi:

### Event: 'close'

<!-- YAML
added: v0.5.0
-->

Emesso quando il server si chiude. Note that if connections exist, this event is not emitted until all connections are ended.

### Event: 'connection'

<!-- YAML
added: v0.1.90
-->

* {net.Socket} L'object della connessione

Emesso quando viene effettuata una nuova connessione. `socket` is an instance of `net.Socket`.

### Event: 'error'

<!-- YAML
added: v0.1.90
-->

* {Error}

Emesso quando si verifica un errore. Unlike [`net.Socket`][], the [`'close'`][] event will **not** be emitted directly following this event unless [`server.close()`][] is manually called. See the example in discussion of [`server.listen()`][].

### Event: 'listening'

<!-- YAML
added: v0.1.90
-->

Emesso quando il server ha eseguito la funzione di binding dopo aver chiamato [` server.listen()`][].

### server.address()

<!-- YAML
added: v0.1.90
-->

* Restituisce: {Object|string}

Returns the bound `address`, the address `family` name, and `port` of the server as reported by the operating system if listening on an IP socket (useful to find which port was assigned when getting an OS-assigned address): `{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`.

For a server listening on a pipe or UNIX domain socket, the name is returned as a string.

```js
const server = net.createServer ((socket) => {
   socket.end('goodbye\n');
}). on('error', (err) = > {
   // esegui l'handle degli errori qui
   throw err;
});

// prendi una porta inutilizzata arbitraria.
server.listen(() => {
   console.log ('opened server on', server.address ());
});
```

Non chiamare `server.address()` finché non è stato emesso l'evento `'listening'`.

### server.close([callback])

<!-- YAML
added: v0.1.90
-->

* `callback` {Function} Called when the server is closed
* Restituisce: {net.Server}

Stops the server from accepting new connections and keeps existing connections. This function is asynchronous, the server is finally closed when all connections are ended and the server emits a [`'close'`][] event. Il `callback` facoltativo verrà chiamato una volta che si verifica l'evento `'close'`. Unlike that event, it will be called with an `Error` as its only argument if the server was not open when it was closed.

### server.connections

<!-- YAML
added: v0.2.0
deprecated: v0.9.7
-->

> Stabilità: 0 - Deprecato: Utilizza invece [`server.getConnections()`][].

Il numero di connessioni simultanee sul server.

This becomes `null` when sending a socket to a child with [`child_process.fork()`][]. To poll forks and get current number of active connections, use asynchronous [`server.getConnections()`][] instead.

### server.getConnections(callback)

<!-- YAML
added: v0.9.7
-->

* `callback` {Function}
* Restituisce: {net.Server}

Assegnare asincronicamente il numero di connessioni simultanee sul server. Works when sockets were sent to forks.

La callback dovrebbe accettare due argomenti `err` e `count`.

### server.listen()

Avvia un server che esegue il listening per le connessioni. A `net.Server` can be a TCP or an [IPC](#net_ipc_support) server depending on what it listens to.

Possibili firme:

* [`server.listen(handle[, backlog][, callback])`][`server.listen(handle)`]
* [`server.listen(options[, callback])`][`server.listen(options)`]
* [`server.listen(path[, backlog][, callback])`][`server.listen(path)`] for [IPC](#net_ipc_support) servers
* [ `server.listen([port[, host[, backlog]]][, callback])`](#net_server_listen_port_host_backlog_callback) per i server TCP

Questa funzione è asincrona. When the server starts listening, the [`'listening'`][] event will be emitted. The last parameter `callback` will be added as a listener for the [`'listening'`][] event.

All `listen()` methods can take a `backlog` parameter to specify the maximum length of the queue of pending connections. The actual length will be determined by the OS through sysctl settings such as `tcp_max_syn_backlog` and `somaxconn` on Linux. Il valore predefinito di questo parametro è 511 (non 512).

All [`net.Socket`][] are set to `SO_REUSEADDR` (see [`socket(7)`][] for details).

The `server.listen()` method can be called again if and only if there was an error during the first `server.listen()` call or `server.close()` has been called. In caso contrario, verrà lanciato un errore `ERR_SERVER_ALREADY_LISTEN`.

Uno degli errori più comuni generati durante il listening è `EADDRINUSE`. This happens when another server is already listening on the requested `port`/`path`/`handle`. One way to handle this would be to retry after a certain amount of time:

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
* `backlog`{number} Parametro comune delle funzioni [`server.listen()`][]
* `callback`{Function} Parametro comune delle funzioni [`server.listen()`][]
* Restituisce: {net.Server}

Start a server listening for connections on a given `handle` that has already been bound to a port, a UNIX domain socket, or a Windows named pipe.

The `handle` object can be either a server, a socket (anything with an underlying `_handle` member), or an object with an `fd` member that is a valid file descriptor.

Il listening su un descrittore di file non è supportato su Windows.

#### server.listen(options[, callback])

<!-- YAML
added: v0.11.14
-->

* `options` {Object} Obbligatorio. Supporta le seguenti proprietà: 
  * `port` {number}
  * `host`{string}
  * `path` {string} verrà ignorato se la `porta` è specificata. Vedi [Identificazione dei percorsi per le connessioni IPC](#net_identifying_paths_for_ipc_connections).
  * `backlog`{number} Parametro comune delle funzioni [`server.listen()`][].
  * `exclusive`{boolean}**Default** `false`
  * `readableAll` {boolean} For IPC servers makes the pipe readable for all users. **Default:** `false`
  * `writableAll` {boolean} For IPC servers makes the pipe writable for all users. **Default:** `false`
* `callback`{Function} Parametro comune delle funzioni [`server.listen()`][].
* Restituisce: {net.Server}

Se è la `porta` è specificata, si comporta come
<a href="#net_server_listen_port_host_backlog_callback">
<code> server.listen([port [, host[, backlog]]][, callback])</code> </a>. Otherwise, if `path` is specified, it behaves the same as [`server.listen(path[, backlog][, callback])`][`server.listen(path)`]. Se nessuno di essi viene specificato, verrà lanciato un errore.

If `exclusive` is `false` (default), then cluster workers will use the same underlying handle, allowing connection handling duties to be shared. When `exclusive` is `true`, the handle is not shared, and attempted port sharing results in an error. An example which listens on an exclusive port is shown below.

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

* `path` {string} Percorso che il server deve ascoltare. Vedi [Identificazione dei percorsi per le connessioni IPC](#net_identifying_paths_for_ipc_connections).
* `backlog`{number} Parametro comune delle funzioni [`server.listen()`][].
* `callback`{Function} Parametro comune delle funzioni [`server.listen()`][].
* Restituisce: {net.Server}

Avvia un server [IPC](#net_ipc_support) che esegua il listening per le connessioni sul `path` indicato.

#### server.listen(\[port[, host[, backlog]]\]\[, callback\])

<!-- YAML
added: v0.1.90
-->

* `port` {number}
* `host`{string}
* `backlog`{number} Parametro comune delle funzioni [`server.listen()`][].
* `callback`{Function} Parametro comune delle funzioni [`server.listen()`][].
* Restituisce: {net.Server}

Avvia un server TCP che esegua il listening per le connessioni sulla `porta` e sull' `host`.

If `port` is omitted or is 0, the operating system will assign an arbitrary unused port, which can be retrieved by using `server.address().port` after the [`'listening'`][] event has been emitted.

If `host` is omitted, the server will accept connections on the [unspecified IPv6 address](https://en.wikipedia.org/wiki/IPv6_address#Unspecified_address) (`::`) when IPv6 is available, or the [unspecified IPv4 address](https://en.wikipedia.org/wiki/0.0.0.0) (`0.0.0.0`) otherwise.

In most operating systems, listening to the [unspecified IPv6 address](https://en.wikipedia.org/wiki/IPv6_address#Unspecified_address) (`::`) may cause the `net.Server` to also listen on the [unspecified IPv4 address](https://en.wikipedia.org/wiki/0.0.0.0) (`0.0.0.0`).

### server.listening

<!-- YAML
added: v5.7.0
-->

* {boolean} Indica se il server sta eseguendo il listening delle connessioni o no.

### server.maxConnections

<!-- YAML
added: v0.2.0
-->

Set this property to reject connections when the server's connection count gets high.

It is not recommended to use this option once a socket has been sent to a child with [`child_process.fork()`][].

### server.ref()

<!-- YAML
added: v0.9.1
-->

* Restituisce: {net.Server}

Opposite of `unref()`, calling `ref()` on a previously `unref`ed server will *not* let the program exit if it's the only server left (the default behavior). Se il server `ref`ed sta chiamando `ref()` di nuovo non avrà effetto.

### server.unref()

<!-- YAML
added: v0.9.1
-->

* Restituisce: {net.Server}

Calling `unref()` on a server will allow the program to exit if this is the only active server in the event system. If the server is already `unref`ed calling `unref()` again will have no effect.

## Classe: net.Socket

<!-- YAML
added: v0.3.4
-->

This class is an abstraction of a TCP socket or a streaming [IPC](#net_ipc_support) endpoint (uses named pipes on Windows, and UNIX domain sockets otherwise). A `net.Socket` is also a [duplex stream](stream.html#stream_class_stream_duplex), so it can be both readable and writable, and it is also an [`EventEmitter`][].

A `net.Socket` can be created by the user and used directly to interact with a server. For example, it is returned by [`net.createConnection()`][], so the user can use it to talk to the server.

It can also be created by Node.js and passed to the user when a connection is received. For example, it is passed to the listeners of a [`'connection'`][] event emitted on a [`net.Server`][], so the user can use it to interact with the client.

### new net.Socket([options])

<!-- YAML
added: v0.3.4
-->

* `options` {Object} Le opzioni disponibili sono: 
  * `fd` {number} If specified, wrap around an existing socket with the given file descriptor, otherwise a new socket will be created.
  * `allowHalfOpen` {boolean} Indicates whether half-opened TCP connections are allowed. See [`net.createServer()`][] and the [`'end'`][] event for details. **Default:** `false`.
  * `readable` {boolean} Allow reads on the socket when an `fd` is passed, otherwise ignored. **Default:** `false`.
  * `writable` {boolean} Allow writes on the socket when an `fd` is passed, otherwise ignored. **Default:** `false`.
* Restituisce: {net.Socket}

Crea un nuovo socket object.

The newly created socket can be either a TCP socket or a streaming [IPC](#net_ipc_support) endpoint, depending on what it [`connect()`][`socket.connect()`] to.

### Event: 'close'

<!-- YAML
added: v0.1.90
-->

* `hadError` {boolean} `true` se il socket ha avuto un errore di trasmissione.

Emesso quando il socket è completamente chiuso. The argument `hadError` is a boolean which says if the socket was closed due to a transmission error.

### Event: 'connect'

<!-- YAML
added: v0.1.90
-->

Emesso quando una connessione del socket è stabilita con successo. Vedi [`net.createConnection()`][].

### Event: 'data'

<!-- YAML
added: v0.1.90
-->

* {Buffer|string}

Emesso quando i dati vengono ricevuti. The argument `data` will be a `Buffer` or `String`. La codifica dei dati è impostata da [`socket.setEncoding()`][].

Note that the **data will be lost** if there is no listener when a `Socket` emits a `'data'` event.

### Event: 'drain'

<!-- YAML
added: v0.1.90
-->

Emesso quando il buffer di scrittura diventa vuoto. Può essere utilizzato per eseguire il throttling degli uploads.

Vedi inoltre: i valori restituiti del `socket.write()`.

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

Emesso quando si verifica un errore. The `'close'` event will be called directly following this event.

### Event: 'lookup'

<!-- YAML
added: v0.11.3
changes:

  - version: v5.10.0
    pr-url: https://github.com/nodejs/node/pull/5598
    description: The `host` parameter is supported now.
-->

Emesso dopo aver risolto l'hostname ma prima della connessione. Non applicabile ai socket UNIX.

* `err` {Error|null} L'object dell'errore. Vedi [`dns.lookup()`][].
* `address` {string} L'indirizzo IP.
* `family` {string|null} Il tipo di indirizzo. Vedi [`dns.lookup()`][].
* `host` {string} L'hostname.

### Event: 'ready'

<!-- YAML
added: v9.11.0
-->

Emesso quando un socket è pronto per essere utilizzato.

Attivato immediatamente dopo `'connect'`.

### Event: 'timeout'

<!-- YAML
added: v0.1.90
-->

Emesso se il socket scade dall'inattività. This is only to notify that the socket has been idle. L'utente deve chiudere manualmente la connessione.

Vedi anche: [`socket.setTimeout()`][].

### socket.address()

<!-- YAML
added: v0.1.90
-->

* Restituisce: {Object}

Returns the bound `address`, the address `family` name and `port` of the socket as reported by the operating system: `{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`

### socket.bufferSize

<!-- YAML
added: v0.3.8
-->

`net.Socket` ha la proprietà che permette al `socket.write()` di funzionare sempre. This is to help users get up and running quickly. The computer cannot always keep up with the amount of data that is written to a socket - the network connection simply might be too slow. Node.js will internally queue up the data written to a socket and send it out over the wire when it is possible. (Internally it is polling on the socket's file descriptor for being writable).

La conseguenza di questo buffering interno è che la memoria può crescere. This property shows the number of characters currently buffered to be written. (Number of characters is approximately equal to the number of bytes to be written, but the buffer may contain strings, and the strings are lazily encoded, so the exact number of bytes is not known.)

Users who experience large or growing `bufferSize` should attempt to "throttle" the data flows in their program with [`socket.pause()`][] and [`socket.resume()`][].

### socket.bytesRead

<!-- YAML
added: v0.5.3
-->

La quantità di byte ricevuti.

### socket.bytesWritten

<!-- YAML
added: v0.5.3
-->

La quantità di byte inviati.

### socket.connect()

Inizia una connessione su un socket indicato.

Possibili firme:

* [`socket.connect(options[, connectListener])`][`socket.connect(options)`]
* [`socket.connect(path[, connectListener])`][`socket.connect(path)`] for [IPC](#net_ipc_support) connections.
* [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`] for TCP connections.
* Restituisce: {net.Socket} Il socket stesso.

Questa funzione è asincrona. When the connection is established, the [`'connect'`][] event will be emitted. If there is a problem connecting, instead of a [`'connect'`][] event, an [`'error'`][] event will be emitted with the error passed to the [`'error'`][] listener. The last parameter `connectListener`, if supplied, will be added as a listener for the [`'connect'`][] event **once**.

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
* `connectListener` {Function} Common parameter of [`socket.connect()`][] methods. Verrà aggiunto una volta come un listener per l'evento [`'connect'`][].
* Restituisce: {net.Socket} Il socket stesso.

Inizia una connessione su un socket indicato. Normally this method is not needed, the socket should be created and opened with [`net.createConnection()`][]. Use this only when implementing a custom Socket.

Per le connessioni TPC, le `options` disponibili sono:

* `port` {number} Richiesto. Porta a cui il socket dovrebbe connettersi.
* `host`{string} Host a cui il socket dovrebbe connettersi. **Default:** `'localhost'`.
* `localAdress`{string} Indirizzo locale dal quale il socket dovrebbe connettersi.
* `localPort`{number} porta locale dalla quale dovrebbe connettersi il socket.
* `family` {number}: La versione dello stack IP può essere `4` o `6`. **Default:** `4`.
* `hints` {number} Facoltativo [`dns.lookup()` hints][].
* `lookup` {Function} Funzione lookup (di ricerca) personalizzata. **Default:** [`dns.lookup()`][].

Per le connessioni IPC<0>, le `options` disponibili sono:</p> 

* `path` {string} Richiesto. Percorso a cui il client dovrebbe connettersi. Vedi [Identificazione dei percorsi per le connessioni IPC](#net_identifying_paths_for_ipc_connections). If provided, the TCP-specific options above are ignored.

#### socket.connect(path[, connectListener])

* `path` {string} Percorso a cui il client dovrebbe connettersi. Vedi [Identificazione dei percorsi per le connessioni IPC](#net_identifying_paths_for_ipc_connections).
* `connectListener` {Function} Common parameter of [`socket.connect()`][] methods. Verrà aggiunto una volta come un listener per l'evento [`'connect'`][].
* Restituisce: {net.Socket} Il socket stesso.

Inizia una connessione [IPC](#net_ipc_support) sul socket indicato.

Alias to [`socket.connect(options[, connectListener])`][`socket.connect(options)`] called with `{ path: path }` as `options`.

#### socket.connect(port\[, host\]\[, connectListener\])

<!-- YAML
added: v0.1.90
-->

* `port` {number} La porta a cui il client si dovrebbe connettere.
* `host` {string} Il host a cui il client si dovrebbe connettere.
* `connectListener` {Function} Common parameter of [`socket.connect()`][] methods. Verrà aggiunto una volta come un listener per l'evento [`'connect'`][].
* Restituisce: {net.Socket} Il socket stesso.

Inizia una connessione TPC sul socket indicato.

Alias to [`socket.connect(options[, connectListener])`][`socket.connect(options)`] called with `{port: port, host: host}` as `options`.

### socket.connecting

<!-- YAML
added: v6.1.0
-->

If `true`, [`socket.connect(options[, connectListener])`][`socket.connect(options)`] was called and has not yet finished. It will stay `true` until the socket becomes connected, then it is set to `false` and the `'connect'` event is emitted. Note that the [`socket.connect(options[, connectListener])`][`socket.connect(options)`] callback is a listener for the `'connect'` event.

### socket.destroy([exception])

<!-- YAML
added: v0.1.90
-->

* `exception` {Object}
* Restituisce: {net.Socket}

Garantisce che non si verifichi più attività di I/O su questo socket. Only necessary in case of errors (parse error or so).

If `exception` is specified, an [`'error'`][] event will be emitted and any listeners for that event will receive `exception` as an argument.

### socket.destroyed

* {boolean} Indica se la connessione è distrutta o meno. Once a connection is destroyed no further data can be transferred using it.

### socket.end(\[data\]\[, encoding\][, callback])

<!-- YAML
added: v0.1.90
-->

* `data` {string|Buffer|Uint8Array}
* `encoding` {string} Usato solo quando il dato è `string`. **Default:** `'utf8'`.
* `callback` {Function} Optional callback for when the socket is finished.
* Restituisce: {net.Socket} Il socket stesso.

Semi-chiude il socket. cioè, invia un pacchetto FIN. It is possible the server will still send some data.

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

La rappresentazione numerica della porta locale. For example, `80` or `21`.

### socket.pause()

* Restituisce: {net.Socket} Il socket stesso.

Mette in pausa la lettura dei dati. Questo significa che gli eventi [`'data'`][] non verranno emessi. Utile per rallentare un caricamento.

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

* Restituisce: {net.Socket} Il socket stesso.

Opposite of `unref()`, calling `ref()` on a previously `unref`ed socket will *not* let the program exit if it's the only socket left (the default behavior). Se il socket `ref`ed sta chiamando `ref` di nuovo non avrà effetto.

### socket.remoteAddress

<!-- YAML
added: v0.5.10
-->

La rappresentazione della stringa dell'indirizzo IP remoto. For example, `'74.125.127.100'` or `'2001:4860:a005::68'`. Value may be `undefined` if the socket is destroyed (for example, if the client disconnected).

### socket.remoteFamily

<!-- YAML
added: v0.11.14
-->

La rappresentazione della stringa della famiglia IP remota. `'IPv4'` o `'IPv6'`.

### socket.remotePort

<!-- YAML
added: v0.5.10
-->

La rappresentazione numerica della porta remota. For example, `80` or `21`.

### socket.resume()

* Restituisce: {net.Socket} Il socket stesso.

Riprende la lettura dopo una chiamata a [`socket.pause()`][].

### socket.setEncoding([encoding])

<!-- YAML
added: v0.1.90
-->

* `encoding` {string}
* Restituisce: {net.Socket} Il socket stesso.

Imposta la codifica per il socket come un [Readable Stream](stream.html#stream_class_stream_readable). See [`readable.setEncoding()`][] for more information.

### socket.setKeepAlive(\[enable\]\[, initialDelay\])

<!-- YAML
added: v0.1.92
-->

* `enable` {boolean} **Default:** `false`
* `initialDelay` {number} **Default:** `0`
* Restituisce: {net.Socket} Il socket stesso.

Enable/disable keep-alive functionality, and optionally set the initial delay before the first keepalive probe is sent on an idle socket.

Set `initialDelay` (in milliseconds) to set the delay between the last data packet received and the first keepalive probe. Setting `0` for `initialDelay` will leave the value unchanged from the default (or previous) setting.

### socket.setNoDelay([noDelay])

<!-- YAML
added: v0.1.90
-->

* `noDelay` {boolean} **Default:** `true`
* Restituisce: {net.Socket} Il socket stesso.

Disabilità l'algoritmo di Nagle. By default TCP connections use the Nagle algorithm, they buffer data before sending it off. Setting `true` for `noDelay` will immediately fire off data each time `socket.write()` is called.

### socket.setTimeout(timeout[, callback])

<!-- YAML
added: v0.1.90
-->

* `timeout` {number}
* `callback` {Function}
* Restituisce: {net.Socket} Il socket stesso.

Sets the socket to timeout after `timeout` milliseconds of inactivity on the socket. Come predefinito `net.Socket` non ha un timeout.

When an idle timeout is triggered the socket will receive a [`'timeout'`][] event but the connection will not be severed. The user must manually call [`socket.end()`][] or [`socket.destroy()`][] to end the connection.

```js
socket.setTimeout(3000);
socket.on('timeout', () => {
  console.log('socket timeout');
  socket.end();
});
```

Se il `timeout` è 0, il timeout di inattività esistente è disattivato.

The optional `callback` parameter will be added as a one-time listener for the [`'timeout'`][] event.

### socket.unref()

<!-- YAML
added: v0.9.1
-->

* Restituisce: {net.Socket} Il socket stesso.

Calling `unref()` on a socket will allow the program to exit if this is the only active socket in the event system. If the socket is already `unref`ed calling `unref()` again will have no effect.

### socket.write(data\[, encoding\]\[, callback\])

<!-- YAML
added: v0.1.90
-->

* `data` {string|Buffer|Uint8Array}
* `encoding` {string} Usato solo quando il dato è `string`. **Default:** `utf8`.
* `callback` {Function}
* Restituisce: {boolean}

Invia dati sul socket. The second parameter specifies the encoding in the case of a string — it defaults to UTF8 encoding.

Returns `true` if the entire data was flushed successfully to the kernel buffer. Restituisce `false` se tutti i dati o una parte sono stati messi in coda nella memoria utente. [`'drain'`][] verrà emesso quando il buffer è di nuovo libero.

The optional `callback` parameter will be executed when the data is finally written out - this may not be immediately.

See `Writable` stream [`write()`](stream.html#stream_writable_write_chunk_encoding_callback) method for more information.

## net.connect()

Aliases to [`net.createConnection()`][`net.createConnection()`].

Possibili firme:

* [`net.connect(options[, connectListener])`][`net.connect(options)`]
* [`net.connect(path[, connectListener])`][`net.connect(path)`] for [IPC](#net_ipc_support) connections.
* [`net.connect(port[, host][, connectListener])`][`net.connect(port, host)`] for TCP connections.

### net.connect(options[, connectListener])

<!-- YAML
added: v0.7.0
-->

* `options` {Object}
* `connectListener` {Function}

Alias to [`net.createConnection(options[, connectListener])`][`net.createConnection(options)`].

### net.connect(path[, connectListener])

<!-- YAML
added: v0.1.90
-->

* `path` {string}
* `connectListener` {Function}

Alias to [`net.createConnection(path[, connectListener])`][`net.createConnection(path)`].

### net.connect(port\[, host\]\[, connectListener\])

<!-- YAML
added: v0.1.90
-->

* `port` {number}
* `host`{string}
* `connectListener` {Function}

Alias to [`net.createConnection(port[, host][, connectListener])`][`net.createConnection(port, host)`].

## net.createConnection()

A factory function, which creates a new [`net.Socket`][], immediately initiates connection with [`socket.connect()`][], then returns the `net.Socket` that starts the connection.

When the connection is established, a [`'connect'`][] event will be emitted on the returned socket. The last parameter `connectListener`, if supplied, will be added as a listener for the [`'connect'`][] event **once**.

Possibili firme:

* [`net.createConnection(options[, connectListener])`][`net.createConnection(options)`]
* [`net.createConnection(path[, connectListener])`][`net.createConnection(path)`] for [IPC](#net_ipc_support) connections.
* [`net.createConnection(port[, host][, connectListener])`][`net.createConnection(port, host)`] for TCP connections.

La funzione [`net.connect()`][] è uno pseudonimo di questa funzione.

### net.createConnection(options[, connectListener])

<!-- YAML
added: v0.1.90
-->

* `options` {Object} Richiesto. Will be passed to both the [`new net.Socket([options])`][`new net.Socket(options)`] call and the [`socket.connect(options[, connectListener])`][`socket.connect(options)`] method.
* `connectListener` {Function} Common parameter of the [`net.createConnection()`][] functions. If supplied, will be added as a listener for the [`'connect'`][] event on the returned socket once.
* Restituisce: {net.Socket} Il socket appena creato utilizzato per avviare la connessione.

For available options, see [`new net.Socket([options])`][`new net.Socket(options)`] and [`socket.connect(options[, connectListener])`][`socket.connect(options)`].

Opzioni aggiuntive:

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

* `path` {string} Percorso a cui il socket dovrebbe connettersi. Will be passed to [`socket.connect(path[, connectListener])`][`socket.connect(path)`]. Vedi [Identificazione dei percorsi per le connessioni IPC](#net_identifying_paths_for_ipc_connections).
* `connectListener` {Function} Common parameter of the [`net.createConnection()`][] functions, an "once" listener for the `'connect'` event on the initiating socket. Will be passed to [`socket.connect(path[, connectListener])`][`socket.connect(path)`].
* Restituisce: {net.Socket} Il socket appena creato utilizzato per avviare la connessione.

Inizia una connessione [IPC](#net_ipc_support).

This function creates a new [`net.Socket`][] with all options set to default, immediately initiates connection with [`socket.connect(path[, connectListener])`][`socket.connect(path)`], then returns the `net.Socket` that starts the connection.

### net.createConnection(port\[, host\]\[, connectListener\])

<!-- YAML
added: v0.1.90
-->

* `port`{number} Porta a cui il socket dovrebbe connettersi. Will be passed to [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`].
* `host`{string} Host a cui il socket dovrebbe connettersi. Will be passed to [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`]. **Default:** `'localhost'`.
* `connectListener` {Function} Common parameter of the [`net.createConnection()`][] functions, an "once" listener for the `'connect'` event on the initiating socket. Will be passed to [`socket.connect(path[, connectListener])`][`socket.connect(port, host)`].
* Restituisce: {net.Socket} Il socket appena creato utilizzato per avviare la connessione.

Inizia una connessione TPC.

This function creates a new [`net.Socket`][] with all options set to default, immediately initiates connection with [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`], then returns the `net.Socket` that starts the connection.

## net.createServer(\[options\]\[, connectionListener\])

<!-- YAML
added: v0.5.0
-->

* `options` {Object} 
  * `allowHalfOpen` {boolean} Indicates whether half-opened TCP connections are allowed. **Default:** `false`.
  * `pauseOnConnect` {boolean} Indicates whether the socket should be paused on incoming connections. **Default:** `false`.
* `connectionListener` {Function} Automatically set as a listener for the [`'connection'`][] event.
* Restituisce: {net.Server}

Crea un nuovo server TPC o [IPC](#net_ipc_support).

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

Provalo utilizzando `telnet`:

```console
$ telnet localhost 8124
```

To listen on the socket `/tmp/echo.sock` the third line from the last would just be changed to:

```js
server.listen('/tmp/echo.sock', () => {
  console.log('server bound');
});
```

Utilizza `nc` per connettersi a un server socket di dominio UNIX:

```console
$ nc -U /tmp/echo.sock
```

## net.isIP(input)

<!-- YAML
added: v0.3.0
-->

* `input` {string}
* Restituisce: {integer}

Verifica se l'input è un indirizzo IP. Returns `0` for invalid strings, returns `4` for IP version 4 addresses, and returns `6` for IP version 6 addresses.

## net.isIPv4(input)

<!-- YAML
added: v0.3.0
-->

* `input` {string}
* Restituisce: {boolean}

Restituisce `true` se l'input è un indirizzo IP versione 4, altrimenti restituisce `false`.

## net.isIPv6(input)

<!-- YAML
added: v0.3.0
-->

* `input` {string}
* Restituisce: {boolean}

Restituisce `true` se l'input è un indirizzo IP versione 6, altrimenti restituisce `false`.