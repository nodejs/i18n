# Rete

<!--introduced_in=v0.10.0-->
<!--lint disable maximum-line-length-->

> Stabilità: 2 - Stable

Il modulo di `rete` fornisce una API di rete asincrona per la creazione dei server basati sullo stream TCP o [IPC](#net_ipc_support) ([`net.createServer()`][]) e per i client ([`net.createConnection()`][]).

Ci si può accedere usando:

```js
const net = require('net');
```

## Supporto IPC

Il modulo di `rete` supporta IPC con pipe denominate su Windows e i socket di dominio UNIX su altri sistemi operativi.

### Identificazione dei percorsi per le connessioni IPC

[`net.connect()`][], [`net.createConnection()`][], [`server.listen()`][] e [`socket.connect()`][] prendi un parametro `path` per identificare gli endpoint IPC.

Su UNIX, il dominio locale è anche noto come il dominio UNIX. Il percorso è un pathname del filesystem. Esso viene troncato per `sizeof (sockaddr_un.sun_path) - 1`, che varia su diversi sistemi operativi compresi tra 91 e 107 byte. I valori tipici sono 107 su Linux e 103 su macOS. Il percorso è soggetto alle stesse convenzioni di denominazione e alle stesse verifiche dei permessi sulla creazione di file. Se il socket del dominio UNIX (che è visibile come un file system path) viene creato e utilizzato in combinazione con una delle astrazioni dell'API di Node.js come [`net.createServer()`][], sarà scollegato come parte del [`server.close()`][]. D'altra parte, se viene creato e utilizzato al di fuori di queste astrazioni, l'utente avrà bisogno di rimuoverlo manualmente. Lo stesso si applica quando il percorso è stato creato da una API Node.js ma il programma si interrompe bruscamente. In breve, un socket di dominio UNIX una volta creato con successo sarà visibile nel filesystem e perdurerà fino a quando non verrà scollegato.

Su Windows, il dominio locale viene implementato utilizzando una pipe denominata. The path *must* refer to an entry in ``\\?\pipe\` or``\\.\pipe\`. Qualsiasi carattere è permesso, ma quest'ultimo potrebbe eseguire alcune elaborazioni dei nomi del pipe, come la risoluzione di `..` sequenze. Nonostante quello che potrebbe sembrare, lo spazio dei nomi della pipe è flat. Pipes will *not persist*. Vengono rimosse quando viene chiuso l'ultimo riferimento ad esse. A differenza dei socket di dominio UNIX, Windows chiuderà e rimuoverà la pipe quando esce dal processo di proprietà.

L'escaping della stringa JavaScript richiede che i percorsi siano specificati con una barra rovesciata extra di escaping come:

```js
net.createServer().listen(
  path.join('\\\\?\\pipe', process.cwd(), 'myctl'));
```

## Classe: Server di rete
<!-- YAML
added: v0.1.90
-->

Questa classe viene utilizzata per creare un server TCP o [IPC](#net_ipc_support).

### nuovo Server di rete (\[options\]\[, connectionListener\])

* `options` {Object} See [`net.createServer([options][, connectionListener])`][`net.createServer()`].
* `connectionListener` {Function} Imposta automaticamente un listener per l'evento [`'connection'`][].
* Restituisce: {net.Server}

`net.Server` è un [`EventEmitter`][] con i seguenti eventi:

### Event: 'close'
<!-- YAML
added: v0.5.0
-->

Emesso quando il server si chiude. Tieni presente che se esistono connessioni, questo evento non viene emesso fino a quando tutte le connessioni non sono terminate.

### Event: 'connection'
<!-- YAML
added: v0.1.90
-->

* {net.Socket} L'object della connessione

Emesso quando viene effettuata una nuova connessione. `socket`è un'istanza di `net.socket`.

### Event: 'error'
<!-- YAML
added: v0.1.90
-->

* {Error}

Emesso quando si verifica un errore. A differenza di [`net.Socket`][], l'evento [`'close'`][] **non** sarà emesso direttamente in seguito a questo evento a meno che [`server.close ()`][] sia denominato manualmente. Vedi l'esempio nella discussione del [`server.listen()`][].

### Event: 'listening'
<!-- YAML
added: v0.1.90
-->

Emesso quando il server ha eseguito la funzione di binding dopo aver chiamato [` server.listen()`][].

### indirizzi del server()
<!-- YAML
added: v0.1.90
-->

* Returns: {Object|string}

Returns the bound `address`, the address `family` name, and `port` of the server as reported by the operating system if listening on an IP socket (useful to find which port was assigned when getting an OS-assigned address): `{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`.

Per un server in ascolto su una pipe o un socket di dominio UNIX, viene restituito il nome sotto forma di una stringa.

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

Impedisci al server di accettare nuove connessioni e mantiene le connessioni esistenti. This function is asynchronous, the server is finally closed when all connections are ended and the server emits a [`'close'`][] event. Il `callback` facoltativo verrà chiamato una volta che si verifica l'evento `'close'`. Unlike that event, it will be called with an `Error` as its only argument if the server was not open when it was closed.

### server.connections
<!-- YAML
added: v0.2.0
deprecated: v0.9.7
-->

> Stabilità: 0 - Deprecato: Utilizza invece [`server.getConnections()`][].

Il numero di connessioni simultanee sul server.

Questo diventa `null` quando si invia un socket a un child con [`child_process.fork()`][]. To poll forks and get current number of active connections, use asynchronous [`server.getConnections()`][] instead.

### server.getConnections(callback)
<!-- YAML
added: v0.9.7
-->

* `callback` {Function}
* Restituisce: {net.Server}

Assegnare asincronicamente il numero di connessioni simultanee sul server. Funziona quando i socket sono stati inviati ai fork.

La callback dovrebbe accettare due argomenti `err` e `count`.

### server.listen()

Avvia un server che esegue il listening per le connessioni. A `net.Server` can be a TCP or an [IPC](#net_ipc_support) server depending on what it listens to.

Possibili firme:

* [`server.listen(handle[, backlog][, callback])`][`server.listen(handle)`]
* [`server.listen(options[, callback])`][`server.listen(options)`]
* [`server.listen(path[, backlog][, callback])`][`server.listen(path)`] per i server [IPC](#net_ipc_support)
* <a href="#net_server_listen_port_host_backlog_callback">
  <code>server.listen([port[, host[, backlog]]][, callback])</code></a>
for TCP servers

Questa funzione è asincrona. Quando il server inizia ad eseguire il listening, il[`'listening'`][] verrà emesso. L'ultimo parametro `callback` verrà aggiunto come un listener per l'evento [`'listening'`][].

Tutti i metodi di `listen()` possono prendere un parametro `backlog` per specificare la massima lunghezza della coda delle connessioni in sospeso. La lunghezza effettiva sarà determinata dal sistema operativo attraverso le impostazioni di sysctl come `tcp_max_syn_backlog` e `somaxconn` su Linux. Il valore predefinito di questo parametro è 511 (non 512).

All [`net.Socket`][] are set to `SO_REUSEADDR` (see [`socket(7)`][] for details).

The `server.listen()` method can be called again if and only if there was an error during the first `server.listen()` call or `server.close()` has been called. Otherwise, an `ERR_SERVER_ALREADY_LISTEN` error will be thrown.

Uno degli errori più comuni generati durante il listening è `EADDRINUSE`. This happens when another server is already listening on the requested `port`/`path`/`handle`. Un modo per eseguire l'handle sarebbe quello di riprovare dopo un certo periodo di tempo:

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

Avvia un server che "ascolta" le connessioni su un determinato `handle` che è già stato associato a una porta, a un socket di dominio UNIX o a una pipe denominata Windows.

L'object `handle` può essere sia un server che un socket (qualsiasi cosa con un membro del `_handle ` sottostante), o un object con un membro `fd ` che è un descrittore di file valido.

Listening on a file descriptor is not supported on Windows.

#### server.listen(options[, callback])
<!-- YAML
added: v0.11.14
-->

* `options` {Object} Richiesto. Supporta le seguenti proprietà:
  * `port` {number}
  * `host`{string}
  * `path` {string} verrà ignorato se la `porta` è specificata. Vedi [Identificazione dei percorsi per le connessioni IPC](#net_identifying_paths_for_ipc_connections).
  * `backlog`{number} Parametro comune delle funzioni [`server.listen()`][].
  * `exclusive`{boolean}**Default** `false`
  * `readableAll` {boolean} For IPC servers makes the pipe readable for all users. **Default:** `false`
  * `writableAll` {boolean} For IPC servers makes the pipe writable for all users. **Default:** `false`
* `callback`{Function} Parametro comune delle funzioni [`server.listen()`][].
* Restituisce: {net.Server}

If `port` is specified, it behaves the same as
<a href="#net_server_listen_port_host_backlog_callback">
<code>server.listen([port[, host[, backlog]]][, callback])</code></a>. Altrimenti, se il `percorso` è specificato, si comporta come [`server.listen (path [, backlog] [, callback])`][`server.listen (path)`]. Se nessuno di essi viene specificato, verrà lanciato un errore.

Se `exclusive` è `false` (predefinito), i lavoratori del cluster, quindi, utilizzeranno lo stesso handle sottostante che consente di condividere i compiti di handling delle connessioni. Quando `exclusive` è `true`, l'handle non viene condiviso e il tentativo di condivisione della porta genera un errore. Un esempio che esegue il listening su una exclusive port è mostrato qui di seguito.

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

Start an [IPC](#net_ipc_support) server listening for connections on the given `path`.

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

Se la `porta` è omessa o è 0, il sistema operativo assegnerà arbitrariamente una porta non utilizzata, che può essere recuperata usando `server.address().port` dopo che l'evento [`'listening'`][] è stato emesso.

Se l'`host` viene omesso, il server accetterà connessioni su un [indirizzo IPv6 non specificato ](https://en.wikipedia.org/wiki/IPv6_address#Unspecified_address) (`::`) quando IPv6 è disponibile, oppure [l'indirizzo IPv4 non specificato ](https://en.wikipedia.org/wiki/0.0.0.0) o altrimenti su (` 0.0.0.0 `).

In most operating systems, listening to the [unspecified IPv6 address](https://en.wikipedia.org/wiki/IPv6_address#Unspecified_address) (`::`) may cause the `net.Server` to also listen on the [unspecified IPv4 address](https://en.wikipedia.org/wiki/0.0.0.0) (`0.0.0.0`).

### server.listening
<!-- YAML
added: v5.7.0
-->

* {boolean} Indica se il server "sta ascoltando" o meno le connessioni.

### server.maxConnections
<!-- YAML
added: v0.2.0
-->

Imposta questa proprietà per rifiutare le connessioni quando il conteggio della connessione del server diventa alto.

Non è consigliabile utilizzare questa opzione una volta che un socket è stato inviato a un child con [`child_process.fork()`][].

### server.ref()
<!-- YAML
added: v0.9.1
-->

* Restituisce: {net.Server}

Opposite of `unref()`, calling `ref()` on a previously `unref`ed server will *not* let the program exit if it's the only server left (the default behavior). If the server is `ref`ed calling `ref()` again will have no effect.

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

Questa classe è un'astrazione di un socket TCP o un endpoint di streaming [IPC](#net_ipc_support) (utilizza le pipe denominate su Windows e, in caso contrario, i socket UNIX del dominio). A `net.Socket` is also a [duplex stream](stream.html#stream_class_stream_duplex), so it can be both readable and writable, and it is also an [`EventEmitter`][].

Un `net.Socket` può essere creato dall'utente e utilizzato direttamente per interagire con un server. Per esempio, esso viene restituito da una [`net.createConnection()`][] in modo tale che l'utente possa utilizzarlo per comunicare con il server.

Esso può ache essere creato da Node.js e trasmesso all'utente quando una connessione viene ricevuta. Per esempio, esso viene trasmesso ai listener di un evento [`'connection'`][] emesso su un [`net.Server`][], in modo tale che l'utente possa utilizzarlo per interagire con il client.

### new net.Socket([options])
<!-- YAML
added: v0.3.4
-->

* `options` {Object} Available options are:
  * `fd`{number} Se specificato, rivesti un socket esistente con il descrittore di file specificato, altrimenti verrà creato un nuovo socket.
  * `allowHalfOpen`{boolean} Indica se sono consentite le connessioni TPC semi-aperte. Vedi [`net.createServer()`][] e l'evento [`'end'`][] per dettagli. **Default:** `false`.
  * `readable` {boolean} Consenti le letture sul socket quando viene passato un `fd`, altrimenti ignorato. **Default:** `false`.
  * `writable` {boolean} Consenti le scritture sul socket quando viene passato un `fd`, altrimenti ignorato. **Default:** `false`.
* Restituisce: {net.Socket}

Crea un nuovo socket object.

Il socket recentemente creato può essere un socket TCP o uno streaming [IPC](#net_ipc_support) endpoint, ciò dipende a che cosa esso (fa connettere) [`connect()`] il [`socket.connect()`].

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

Emesso quando i dati vengono ricevuti. L'argomento `data` sarà un `Buffer` o una `string`. Encoding of data is set by [`socket.setEncoding()`][].

Ricorda che i **dati andranno persi** se non ci sono listener quando un `Socket` emette un evento `"data"`.

### Event: 'drain'
<!-- YAML
added: v0.1.90
-->

Emesso quando il buffer di scrittura diventa vuoto. Può essere utilizzato per eseguire il throttling degli uploads.

See also: the return values of `socket.write()`.

### Event: 'end'
<!-- YAML
added: v0.1.90
-->

Emesso quando l'altra estremità del socket invia un pacchetto FIN, terminando così il lato leggibile del socket.

Per impostazione predefinita (`allowHalfOpen` è `false`) il socket invierà un pacchetto FIN indietro e distruggerà il suo descrittore di file una volta che ha scritto la sua coda di scrittura in sospeso. Tuttavia, se `allowHalfOpen` è impostato su `true`, il socket non [`end ()`][`socket.end()`] automaticamente il suo lato scrivibile, consentendo all'utente di scrivere una quantità arbitraria di dati. L'utente deve chiamare [`end()`][`socket.end ()`] esplicitamente per chiudere la connessione (cioè rinviando un pacchetto FIN).

### Event: 'error'
<!-- YAML
added: v0.1.90
-->

* {Error}

Emesso quando si verifica un errore. L'evento `'close'` sarà chiamato direttamente dopo questo evento.

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

### Evento: 'ready'
<!-- YAML
added: v9.11.0
-->

Emitted when a socket is ready to be used.

Triggered immediately after `'connect'`.

### Event: 'timeout'
<!-- YAML
added: v0.1.90
-->

Emesso se il socket scade dall'inattività. Questo è solo per informare che il socket è rimasto inattivo. L'utente deve chiudere manualmente la connessione.

See also: [`socket.setTimeout()`][].

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

`net.Socket` ha la proprietà che permette al `socket.write()` di funzionare sempre. Questo è per aiutare gli utenti ad essere operativi nell'immediato. Il computer non può sempre tenere il passo con la quantità di dati che viene scritta per un socket: la connessione di rete potrebbe essere semplicemente troppo lenta. Node.js accoderà internamente i dati scritti ad un socket e li invierà via cavo quando è possibile. (Internamente sta eseguendo il polling sul descrittore di file del socket per renderlo scrivibile).

La conseguenza di questo buffering interno è che la memoria può crescere. Questa proprietà mostra il numero di caratteri attualmente memorizzati nel buffer per essere scritti. (Il numero di caratteri è approssimativamente uguale al numero di byte da scrivere, ma il buffer può contenere stringhe e le stringhe sono codificate in modalità lazy, quindi il numero esatto di byte non è noto.)

Gli utenti che provano un `bufferSize` di grandi dimensioni o in crescita dovrebbero tentare di "accelerare" i flussi di dati nel loro programma con [`socket.pause()`][] e con [`socket.resume()`][].

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

Questa funzione è asincrona. Quando viene stabilita la connessione, verrà emesso l'evento [`'connect'`][]. Se c'è un problema di connessione, invece di un evento [`'connect'`][], verrà generato un evento [`'error'`][] con l'errore passato al listener dell' [`'error'`][]. L'ultimo parametro `connectListener`, se fornito, sarà aggiunto **una volta** come un listener per l'evento [`'connect'`][].

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
* `connectListener`{Function} Parametro comune dei metodi [`server.listen()`][]. Verrà aggiunto una volta come un listener per l'evento [`'connect'`][].
* Restituisce: {net.Socket} Il socket stesso.

Inizia una connessione su un socket indicato. Normalmente questo metodo non è necessario, il socket deve essere creato e aperto con [`net.createConnection()`][]. Utilizza questo solo quando si implementa un socket personalizzato.

Per le connessioni TPC, le `options` disponibili sono:

* `port` {number} Richiesto. Porta a cui il socket dovrebbe connettersi.
* `host`{string} Host a cui il socket dovrebbe connettersi. **Default:** `'localhost'`.
* `localAdress`{string} Indirizzo locale dal quale il socket dovrebbe connettersi.
* `localPort`{number} porta locale dalla quale dovrebbe connettersi il socket.
* `family` {number}: La versione dello stack IP può essere `4` o `6`. **Default:** `4`.
* `hints` {number} Facoltativo [`dns.lookup()` hints][].
* `lookup` {Function} Funzione lookup (di ricerca) personalizzata. **Default:** [`dns.lookup()`][].

Per le connessioni

IPC<0>, le `options` disponibili sono:</p> 

* `path` {string} Richiesto. Percorso a cui il client dovrebbe connettersi. Vedi [Identificazione dei percorsi per le connessioni IPC](#net_identifying_paths_for_ipc_connections). Se fornite, le opzioni specifiche TCP sopra vengono ignorate.



#### socket.connect(path[, connectListener])

* `path` {string} Percorso a cui il client dovrebbe connettersi. Vedi [Identificazione dei percorsi per le connessioni IPC](#net_identifying_paths_for_ipc_connections).

* `connectListener`{Function} Parametro comune dei metodi [`server.listen()`][]. Verrà aggiunto una volta come un listener per l'evento [`'connect'`][].

* Restituisce: {net.Socket} Il socket stesso.

Inizia una connessione [IPC](#net_ipc_support) sul socket indicato.

Pseudonimo per `socket.connect(options[, connectListener])`][`socket.connect(options)`] chiamati/e con`{ path: path }` come `options`.



#### socket.connect(port\[, host\]\[, connectListener\])
<!-- YAML
added: v0.1.90
-->

* `port` {number} Porta a cui il client dovrebbe connettersi.
* `host` {string} Host a cui il client dovrebbe connettersi.
* `connectListener`{Function} Parametro comune dei metodi [`server.listen()`][]. Verrà aggiunto una volta come un listener per l'evento [`'connect'`][].

* Restituisce: {net.Socket} Il socket stesso.

Inizia una connessione TPC sul socket indicato.

Pseudonimo per `socket.connect(options[, connectListener])`][`socket.connect(options)`] chiamati/e con`{port: port, host: host}` come `options`.



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
* Restituisce: {net.Socket}

Garantisce che non si verifichi più attività di I/O su questo socket. Solo necessario in caso di errori (errore di analisi o simili).

Se `exception` è specificata, verrà emesso un evento [`'error'`][] e tutti i listener per quell'evento riceveranno `exception` come argomento.



### socket.destroyed

* {boolean} Indica se la connessione è distrutta o meno. Una volta che una connessione è stata distrutta, non è possibile trasferire ulteriori dati utilizzandola.



### socket.end(\[data\]\[, encoding\][, callback])
<!-- YAML
added: v0.1.90
-->

* `data` {string|Buffer|Uint8Array}
* `encoding` {string} Only used when data is `string`. **Default:** `'utf8'`.
* `callback` {Function} Optional callback for when the socket is finished.
* Restituisce: {net.Socket} Il socket stesso.

Semi-chiude il socket. cioè, invia un pacchetto FIN. È possibile che il server invii ancora alcuni dati.

Se `data` è specificato, è equivalente alla chiamata `socket.write (data, encoding)` seguito da [` socket.end()`][].



### socket.localAddress
<!-- YAML
added: v0.9.6
-->

La rappresentazione della stringa dell'indirizzo IP locale sul quale si sta connettendo il client remoto. Ad esempio, in un server in ascolto su `'0.0.0.0'`, se un client si connette su `'192.168.1.1'`, il valore del `socket.localAddress ` sarebbe `'192.168.1.1'`.



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

Opposite of `unref()`, calling `ref()` on a previously `unref`ed socket will *not* let the program exit if it's the only socket left (the default behavior). If the socket is `ref`ed calling `ref` again will have no effect.



### socket.remoteAddress
<!-- YAML
added: v0.5.10
-->

La rappresentazione della stringa dell'indirizzo IP remoto. Ad esempio, `'74.125.127.100'` o `'2001:4860:a005::68'`. Il valore può essere `undefined` se il socket viene distrutto (ad esempio, se il client è disconnesso).



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

Abilita/disabilita la funzionalità keep-alive e opzionalmente imposta il ritardo iniziale prima che la prima indagine keepalive venga inviata su un socket inattivo.

Imposta `initialDelay` (in millisecondi) per impostare il ritardo tra l'ultimo pacchetto di dati ricevuto e la prima indagine di keepalive. Setting `0` for `initialDelay` will leave the value unchanged from the default (or previous) setting.



### socket.setNoDelay([noDelay])
<!-- YAML
added: v0.1.90
-->

* `noDelay` {boolean} **Default:** `true`
* Restituisce: {net.Socket} Il socket stesso.

Disabilità l'algoritmo di Nagle. Per impostazione predefinita, le connessioni TCP utilizzano l'algoritmo Nagle, memorizzano i dati prima di inviarli. Impostando `true` come `noDelay ` attiva immediatamente i dati ogni volta che viene chiamato` socket.write()`.



### socket.setTimeout(timeout[, callback])
<!-- YAML
added: v0.1.90
-->

* `timeout` {number}
* `callback` {Function}
* Restituisce: {net.Socket} Il socket stesso.

Imposta il socket perché entri in pausa dopo `timeout` in millisecondi di inattività sul socket. Come predefinito `net.Socket` non ha un timeout.

Quando viene attivato un timeout di inattività, il socket riceverà un evento[`'timeout'`][] ma la connessione non verrà interrotta. L'utente deve chiamare manualmente [`socket.end()`][] o [`socket.destroy()`][] per terminare la connessione.



```js
socket.setTimeout(3000);
socket.on('timeout', () => {
  console.log('socket timeout');
  socket.end();
});
```


Se il `timeout` è 0, il timeout di inattività esistente è disattivato.

Il parametro `callback` facoltativo verrà aggiunto come one-time listener per l'evento [`'timeout'`][].



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
* `encoding` {string} Only used when data is `string`. **Default:** `utf8`.
* `callback` {Function}
* Restituisce: {boolean}

Invia dati sul socket. Il secondo parametro specifica la codifica nel file in caso di una stringa - come predefinito per UTF8 encoding.

Restituisce `true ` se i dati interi sono stati scaricati con successo nel kernel buffer. Restituisce `false` se tutti o parte dei dati sono stati messi in coda nella memoria utente. [`'drain'`][] verrà emesso quando il buffer è di nuovo libero.

Il parametro facoltativo `callback` verrà eseguito quando i dati saranno finalmente scritti - questo potrebbe non essere immediato.

See `Writable` stream [`write()`](stream.html#stream_writable_write_chunk_encoding_callback) method for more information.



## net.connect()

Pseudomini per [`net.createConnection()`][`net.createConnection()`].

Possibili firme:

* [`net.connect(options[, connectListener])`][`net.connect(options)`]
* [`net.connect(path[, connectListener])`][`net.connect(path)`] per le connessioni [IPC](#net_ipc_support).

* [`net.connect(port[, host][, connectListener])`][`net.connect(port, host)`] per le connessioni TPC.



### net.connect(options[, connectListener])
<!-- YAML
added: v0.7.0
-->
* `options` {Object}
* `connectListener` {Function}

Pseudonimo per [`net.createConnection(options[, connectListener])`][`net.createConnection(options)`].



### net.connect(path[, connectListener])
<!-- YAML
added: v0.1.90
-->
* `path` {string}
* `connectListener` {Function}

Pseudonimo per [`net.createConnection(path[, connectListener])`][`net.createConnection(path)`].



### net.connect(port\[, host\]\[, connectListener\])
<!-- YAML
added: v0.1.90
-->
* `port` {number}
* `host`{string}
* `connectListener` {Function}

Pseudonimo per [`net.createConnection(port[, host][, connectListener])`][`net.createConnection(port, host)`].



## net.createConnection()

Una funzione factory, che crea un nuovo [`net.Socket`][], avvia immediatamente la connessione con [`socket.connect()`][], quindi restituisce il `net.Socket` che avvia la connessione.

Quando viene stabilita la connessione, verrà emesso un evento [`'connect'`][] sul socket restituito. L'ultimo parametro `connectListener`, se fornito, verrà aggiunto **una volta** come listener per l'evento [`'connect'`][].

Possibili firme:

* [`net.createConnection(options[, connectListener])`][`net.createConnection(options)`]
* [`net.createConnection(path[, connectListener])`][`net.createConnection(path)`] per le connessioni [IPC](#net_ipc_support).

* [`net.createConnection(port[, host][, connectListener])`][`net.createConnection(port, host)`] per le connessioni TPC.

The [`net.connect()`][] function is an alias to this function.



### net.createConnection(options[, connectListener])
<!-- YAML
added: v0.1.90
-->

* `options` {Object} Richiesto. Verrà passato sia alla chiamata [`new net.Socket([options])`][`new net.Socket(options)` che al metodo [`socket.connect(options[, connectListener])`][`socket.connect(options)`].

* `connectListener` {Function} Parametro comune delle funzioni [`net.createConnection()`][]. Se fornito, sarà aggiunto una volta come un listener per l'evento [`'connect'`][] sul socket restituito.

* Restituisce: {net.Socket} Il socket appena creato utilizzato per avviare la connessione.

Per le opzioni disponibili, vedi [`new net.Socket([options])`][`new net.Socket(options)`] e [`socket.connect(options[, connectListener])`][`socket.connect(options)`].

Opzioni aggiuntive:

* `timeout` {number} Se impostato, verrà utilizzato per chiamare [`socket.setTimeout (timeout)`][] dopo che il socket viene creato, ma prima che inizi la connessione.

Di seguito è riportato un esempio di un client del server echo descritto nella sezione [`net.createServer()`][]:



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

* `path` {string} Percorso a cui il socket dovrebbe connettersi. Sarà passato a [`socket.connect(path[, connectListener])`][`socket.connect(path)`]. Vedi [Identificazione dei percorsi per le connessioni IPC](#net_identifying_paths_for_ipc_connections).

* `connectListener` {Function} Parametro comune delle funzioni [`net.createConnection()`][], un listener "una tantum" per l'evento `'connect'` sul socket d'inizio. Sarà passato a [`socket.connect(path[, connectListener])`][`socket.connect(path)`].

* Restituisce: {net.Socket} Il socket appena creato utilizzato per avviare la connessione.

Inizia una connessione [IPC](#net_ipc_support).

Questa funzione crea un nuovo [`net.Socket`][] con tutte le opzioni impostate su default, avvia immediatamente la connessione con [`socket.connect(path[, connectListener])`] [` socket.connect (path)`], quindi restituisce il `net.Socket` che avvia la connessione.



### net.createConnection(port\[, host\]\[, connectListener\])
<!-- YAML
added: v0.1.90
-->

* `port`{number} Porta a cui il socket dovrebbe connettersi. Sarà passato a [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`].

* `host`{string} Host a cui il socket dovrebbe connettersi. Sarà passato a [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`]. **Default:** `'localhost'`.

* `connectListener` {Function} Parametro comune delle funzioni [`net.createConnection()`][], un listener "una tantum" per l'evento `'connect'` sul socket d'inizio. Sarà passato a [`socket.connect(path[, connectListener])`][`socket.connect(port, host)`].

* Restituisce: {net.Socket} Il socket appena creato utilizzato per avviare la connessione.

Inizia una connessione TPC.

Questa funzione crea un nuovo [`net.Socket`][] con tutte le opzioni impostate su default, avvia immediatamente la connessione con [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`], quindi restituisce il `net.Socket` che avvia la connessione.



## net.createServer(\[options\]\[, connectionListener\])
<!-- YAML
added: v0.5.0
-->

* `options` {Object}
 
    * `allowHalfOpen`{boolean} Indica se le connessioni TPC semi-aperte sono consentite. **Default:** `false`.
  * `pauseOnConnect` {boolean} indica se il socket dovrebbe essere messo in pausa sulle connessioni in entrata. **Default:** `false`.
* `connectionListener` {Function} Imposta automaticamente un listener per l'evento [`'connection'`][].

* Restituisce: {net.Server}

Crea un nuovo server TPC o [IPC](#net_ipc_support).

Se `allowHalfOpen` è impostato su `true`, quando l'altra estremità del socket invia un pacchetto FIN, il server invierà un pacchetto FIN solo quando [`socket.end()`][] viene chiamato esplicitamente, fino a quel momento la connessione è semichiusa (non leggibile ma ancora scrivibile). Per ulteriori informazioni, vedi gli eventi [`'end'`][] e [RFC 1122](https://tools.ietf.org/html/rfc1122) (section 4.2.2.13).

Se `pauseOnConnect` è impostato su `true`, il socket associato a ciascuna connessione in entrata verrà messo in pausa e nessun dato verrà letto dal suo handle. Questo permette alle connessioni di essere passate tra i processi senza che nessun dato venga letto dal processo originale. Per iniziare la lettura dei dati da un socket messo in pausa, chiamare [`socket.resume()`][].

The server can be a TCP server or an [IPC](#net_ipc_support) server, depending on what it [`listen()`][`server.listen()`] to.

Ecco un esempio di un server echo TCP che ascolta le connessioni sulla porta 8124:



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

Returns `true` if input is a version 4 IP address, otherwise returns `false`.



## net.isIPv6(input)
<!-- YAML
added: v0.3.0
-->

* `input` {string}
* Restituisce: {boolean}

Returns `true` if input is a version 6 IP address, otherwise returns `false`.
