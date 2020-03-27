# HTTP

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Per utilizzare il server HTTP ed il client è necessario chiamare `require('http')`.

Le interfacce HTTP in Node.js sono progettate per supportare numerose funzionalità del protocollo che tradizionalmente sono state difficili da utilizzare. In particolare, messaggi di grandi dimensioni, possibilmente codificati per il chunk. L'interfaccia fa attenzione a non bufferizzare intere richieste o risposte — l'utente è in grado di eseguire lo streaming dei dati.

Gli header dei messaggi HTTP sono rappresentati da un object come questo:
```js
{ 'content-length': '123',
  'content-type': 'text/plain',
  'connection': 'keep-alive',
  'host': 'mysite.com',
  'accept': '*/*' }
```

Le chiavi sono minuscole. I valori non vengono modificati.

Per supportare l'intera gamma di possibili applicazioni HTTP, l'API HTTP di Node.js è di livello molto basso. Si occupa esclusivamente della gestione dello stream e dell'analisi dei messaggi. Analizza un messaggio nelle intestazioni e nel corpo ma non analizza le intestazioni effettive o il corpo.

Vedere [` message.headers`][] per i dettagli su come vengono gestite le intestazioni duplicate.

Gli header grezzi così come sono stati ricevuti vengono mantenuti nella proprietà `rawHeaders`, che è un array di `[key, value, key2, value2, ...]`. Ad esempio, l'object dell'intestazione del messaggio precedente potrebbe avere un elenco `rawHeaders` simile al seguente:
```js
[ 'ConTent-Length', '123456',
  'content-LENGTH', '123',
  'content-type', 'text/plain',
  'CONNECTION', 'keep-alive',
  'Host', 'mysite.com',
  'accepT', '*/*' ]
```

## Class: `http.Agent`<!-- YAML
added: v0.3.4
-->Un `Agent` è responsabile della gestione della persistenza della connessione e del riutilizzo per i client HTTP. Mantiene una coda di richieste in sospeso per un host e una porta determinati, riutilizzando una singola connessione socket per ciascuna finché la coda non è vuota, momento in cui il socket viene distrutto o inserito in un pool in cui viene mantenuto per essere utilizzato nuovamente per le richieste allo stesso host e alla stessa porta. Se viene distrutto o inserito in un pool dipende dall'[opzione](#http_new_agent_options) `keepAlive`.

Le connessioni in pool dispongono di TCP Keep-Alive abilitato, ma i server potrebbero comunque chiudere le connessioni inattive, nel qual caso verranno rimosse dal pool e verrà creata una nuova connessione quando viene effettuata una nuova richiesta HTTP per quell'host e quella porta. I server possono anche rifiutare di consentire più richieste sulla stessa connessione, nel qual caso la connessione dovrà essere ricreata per ogni richiesta e non può essere inserita in un pool. L'`Agent` effettuerà comunque le richieste su quel server, ma ognuna si verificherà su una nuova connessione.

Quando una connessione viene chiusa dal client o dal server, viene rimossa dal pool. Tutti i socket inutilizzati nel pool verranno passati a unref per non mantenere in esecuzione il processo Node.js quando non sono presenti richieste in sospeso. (see [`socket.unref()`][]).

È buona prassi, eseguire [`destroy()`][] su un'istanza `Agent` quando non è più in uso, poiché i socket inutilizzati consumano risorse del sistema operativo.

Sockets are removed from an agent when the socket emits either a `'close'` event or an `'agentRemove'` event. When intending to keep one HTTP request open for a long time without keeping it in the agent, something like the following may be done:

```js
http.get(options, (res) => {
  // Fai operazione
}).on('socket', (socket) => {
  socket.emit('agentRemove');
});
```

Un agente può anche essere utilizzato per una singola richiesta. Fornendo `{agent: false}` come opzione per le funzioni `http.get()` o `http.request()`, verrà utilizzato un `Agent` una tantum con opzioni predefinite per la connessione client.

`agent:false`:

```js
http.get({
  hostname: 'localhost',
  port: 80,
  path: '/',
  agent: false  // Create a new agent just for this one request
}, (res) => {
  // Do stuff with response
});
```

### `new Agent([options])`<!-- YAML
added: v0.3.4
-->* `options` {Object} Set of configurable options to set on the agent. Può avere i seguenti campi:
  * `keepAlive` {boolean} Mantiene i socket attivi anche quando non ci sono richieste in sospeso, in modo che possano essere utilizzate per richieste future senza dover ristabilire una connessione TCP. Not to be confused with the `keep-alive` value of the `Connection` header. The `Connection: keep-alive` header is always sent when using an agent except when the `Connection` header is explicitly specified or when the `keepAlive` and `maxSockets` options are respectively set to `false` and `Infinity`, in which case `Connection: close` will be used. **Default:** `false`.
  * `keepAliveMsecs` {number} When using the `keepAlive` option, specifies the [initial delay](net.html#net_socket_setkeepalive_enable_initialdelay) for TCP Keep-Alive packets. Ignorato quando l'opzione `keepAlive` è `false` o `undefined`. **Default:** `1000`.
  * `maxSockets` {number} Numero massimo di socket da consentire per host. Each request will use a new socket until the maximum is reached. **Default:** `Infinity`.
  * `maxFreeSockets` {number} Numero massimo di socket da lasciare aperti in uno stato libero. Rilevante solo se `keepAlive` è impostato su `true`. **Default:** `256`.
  * `timeout` {number} Socket timeout in milliseconds. This will set the timeout when the socket is created.

`options` in [`socket.connect()`][] are also supported.

Il [`http.globalAgent`][] predefinito utilizzato da [`http.request()`][] ha tutti questi valori impostati sui rispettivi valori predefiniti.

Per configurarne uno qualsiasi, è necessario creare un'istanza [`http.Agent`][] personalizzata.

```js
const http = require('http');
const keepAliveAgent = new http.Agent({ keepAlive: true });
options.agent = keepAliveAgent;
http.request(options, onResponseCallback);
```

### `agent.createConnection(options[, callback])`<!-- YAML
added: v0.11.4
-->* `options` {Object} Opzioni contenenti i dettagli di connessione. Controllare [`net.createConnection(`][]) per il formato delle opzioni
* `callback` {Function} Funzione callback che riceve il socket creato
* Returns: {stream.Duplex}

Produce un socket/stream da utilizzare per le richieste HTTP.

Di default, questa funzione è la stessa di [`net.createConnection()`][]. Tuttavia, gli agenti personalizzati possono sovrascrivere questo metodo nel caso in cui si desideri una maggiore flessibilità.

Un socket/stream può essere fornito in due modi: restituendo il socket/stream da questa funzione, o passando il socket/stream al `callback`.

This method is guaranteed to return an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

`callback` ha una firma di `(err, stream)`.

### `agent.keepSocketAlive(socket)`<!-- YAML
added: v8.1.0
-->* `socket` {stream.Duplex}

Called when `socket` is detached from a request and could be persisted by the `Agent`. Il comportamento predefinito è:

```js
socket.setKeepAlive(true, this.keepAliveMsecs);
socket.unref();
return true;
```

Questo metodo può essere sovrascritto da una particolare sottoclasse di `Agent`. Se questo metodo restituisce un valore falso, il socket verrà distrutto anziché mantenuto per essere utilizzato con la richiesta successiva.

The `socket` argument can be an instance of {net.Socket}, a subclass of
{stream.Duplex}.

### `agent.reuseSocket(socket, request)`<!-- YAML
added: v8.1.0
-->* `socket` {stream.Duplex}
* `request` {http.ClientRequest}

Chiamato quando il `socket` è collegato alla `request` dopo essere stato mantenuto a causa delle opzioni keep-alive. Il comportamento predefinito è:

```js
socket.ref();
```

Questo metodo può essere sovrascritto da una particolare sottoclasse di `Agent`.

The `socket` argument can be an instance of {net.Socket}, a subclass of
{stream.Duplex}.

### `agent.destroy()`<!-- YAML
added: v0.11.4
-->Distruggi qualsiasi socket attualmente utilizzato dall'agente.

Solitamente non è necessario farlo. However, if using an agent with `keepAlive` enabled, then it is best to explicitly shut down the agent when it will no longer be used. In caso contrario, i socket potrebbero rimanere aperti per un periodo piuttosto lungo prima che il server li interrompa.

### `agent.freeSockets`<!-- YAML
added: v0.11.4
-->* {Object}

Un object che contiene array di socket attualmente in attesa di utilizzo da parte dell'agente quando `keepAlive` è abilitato. Non modificare.

### `agent.getName(options)`
<!-- YAML
added: v0.11.4
-->

* `options` {Object} A set of options providing information for name generation
  * `host` {string} A domain name or IP address of the server to issue the request to
  * `port` {number} Porta del server remoto
  * `localAddress` {string} Interfaccia locale per eseguire il binding per le connessioni di rete durante l'emissione della richiesta
  * `family` {integer} Deve essere 4 o 6 se questo non è uguale a `undefined`.
* Restituisce: {string}

Ottenere un nome univoco per un set di opzioni di richiesta, per determinare se una connessione può essere riutilizzata. For an HTTP agent, this returns `host:port:localAddress` or `host:port:localAddress:family`. For an HTTPS agent, the name includes the CA, cert, ciphers, and other HTTPS/TLS-specific options that determine socket reusability.

### `agent.maxFreeSockets`<!-- YAML
added: v0.11.7
-->* {number}

Di default è impostato a 256. Per gli agenti con `keepAlive` abilitato, questo stabilisce il numero massimo di socket che verranno lasciati aperti nello stato libero.

### `agent.maxSockets`<!-- YAML
added: v0.3.6
-->* {number}

By default set to `Infinity`. Determina quanti socket simultanei l'agente può tenere aperti per origine. L'origine è il valore restituito di [`agent.getName()`][].

### `agent.requests`<!-- YAML
added: v0.5.9
-->* {Object}

Un object che contiene code di richieste che non sono ancora state assegnate ai socket. Non modificare.

### `agent.sockets`
<!-- YAML
added: v0.3.6
-->

* {Object}

Un object che contiene array di socket attualmente in uso dall'agente. Non modificare.

## Class: `http.ClientRequest`<!-- YAML
added: v0.1.17
-->* Extends: {Stream}

Questo object viene creato internamente e restituito da [`http.request()`][]. It represents an _in-progress_ request whose header has already been queued. The header is still mutable using the [`setHeader(name, value)`][], [`getHeader(name)`][], [`removeHeader(name)`][] API. The actual header will be sent along with the first data chunk or when calling [`request.end()`][].

Per ottenere la risposta, aggiungi un listener per [`'response'`][] all'object richiesta. [`'response'`][] verrà emessa dall'object richiesta una volta che le intestazioni di risposta siano state ricevute. L'evento [`'response'`][] viene eseguito con un argomento che è un'istanza di [`http.IncomingMessage`][].

Durante l'evento [`'response'`][], è possibile aggiungere altri listener all'object risposta; in particolare per sottoporre al listening l'evento `'data'`.

Se non viene aggiunto nessun [`'response'`][] handler, allora la risposta verrà completamente scartata. However, if a [`'response'`][] event handler is added, then the data from the response object **must** be consumed, either by calling `response.read()` whenever there is a `'readable'` event, or by adding a `'data'` handler, or by calling the `.resume()` method. Fino a quando i dati non vengono consumati, l'evento `'end'` non viene attivato. Inoltre, finché i dati non vengono letti, esso consumerà memoria che alla fine può portare a un errore di 'elaborazione insufficiente'.

Unlike the `request` object, if the response closes prematurely, the `response` object does not emit an `'error'` event but instead emits the `'aborted'` event.

Node.js does not check whether Content-Length and the length of the body which has been transmitted are equal or not.

### Event: `'abort'`<!-- YAML
added: v1.4.1
-->Emesso quando la richiesta è stata interrotta dal client. Questo evento viene emesso esclusivamente alla prima chiamata a `abort()`.

### Event: `'connect'`<!-- YAML
added: v0.7.0
-->* `response` {http.IncomingMessage}
* `socket` {stream.Duplex}
* `head` {Buffer}

Emesso ogni volta che un server risponde a una richiesta con un metodo `CONNECT`. If this event is not being listened for, clients receiving a `CONNECT` method will have their connections closed.

This event is guaranteed to be passed an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

Una coppia di client e server che dimostra come eseguire il listening dell'evento `'connect'`:

```js
const http = require('http');
const net = require('net');
const { URL } = require('url');

// Create an HTTP tunneling proxy
const proxy = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('okay');
});
proxy.on('connect', (req, clientSocket, head) => {
  // Connect to an origin server
  const { port, hostname } = new URL(`http://${req.url}`);
  const serverSocket = net.connect(port || 80, hostname, () => {
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                    'Proxy-agent: Node.js-Proxy\r\n' +
                    '\r\n');
    serverSocket.write(head);
    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });
});

// Now that proxy is running
proxy.listen(1337, '127.0.0.1', () => {

  // Make a request to a tunneling proxy
  const options = {
    port: 1337,
    host: '127.0.0.1',
    method: 'CONNECT',
    path: 'www.google.com:80'
  };

  const req = http.request(options);
  req.end();

  req.on('connect', (res, socket, head) => {
    console.log('got connected!');

    // Make a request over an HTTP tunnel
    socket.write('GET / HTTP/1.1\r\n' +
                 'Host: www.google.com:80\r\n' +
                 'Connection: close\r\n' +
                 '\r\n');
    socket.on('data', (chunk) => {
      console.log(chunk.toString());
    });
    socket.on('end', () => {
      proxy.close();
    });
  });
});
```

### Event: `'continue'`<!-- YAML
added: v0.3.2
-->Emesso quando il server invia una risposta HTTP '100 Continue', solitamente perché la richiesta conteneva 'Expect: 100-continue'. Questa è un'istruzione che il client dovrebbe inviare al corpo della richiesta.

### Event: `'information'`<!-- YAML
added: v10.0.0
-->* `info` {Object}
  * `httpVersion` {string}
  * `httpVersionMajor` {integer}
  * `httpVersionMinor` {integer}
  * `statusCode` {integer}
  * `statusMessage` {string}
  * `headers` {Object}
  * `rawHeaders` {string[]}

Emitted when the server sends a 1xx intermediate response (excluding 101 Upgrade). The listeners of this event will receive an object containing the HTTP version, status code, status message, key-value headers object, and array with the raw header names followed by their respective values.

```js
const http = require('http');

const options = {
  host: '127.0.0.1',
  port: 8080,
  path: '/length_request'
};

// Make a request
const req = http.request(options);
req.end();

req.on('information', (info) => {
  console.log(`Got information prior to main response: ${info.statusCode}`);
});
```

101 Upgrade statuses do not fire this event due to their break from the traditional HTTP request/response chain, such as web sockets, in-place TLS upgrades, or HTTP 2.0. To be notified of 101 Upgrade notices, listen for the [`'upgrade'`][] event instead.

### Event: `'response'`<!-- YAML
added: v0.1.0
-->* `response` {http.IncomingMessage}

Emesso quando viene ricevuta una risposta a questa richiesta. Questo evento viene emesso una volta sola.

### Event: `'socket'`<!-- YAML
added: v0.5.3
-->* `socket` {stream.Duplex}

This event is guaranteed to be passed an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

### Event: `'timeout'`<!-- YAML
added: v0.7.8
-->Emitted when the underlying socket times out from inactivity. This only notifies that the socket has been idle. La richiesta deve essere interrotta manualmente.

See also: [`request.setTimeout()`][].

### Event: `'upgrade'`<!-- YAML
added: v0.1.94
-->* `response` {http.IncomingMessage}
* `socket` {stream.Duplex}
* `head` {Buffer}

Emesso ogni volta che un server risponde ad una richiesta con un aggiornamento. If this event is not being listened for and the response status code is 101 Switching Protocols, clients receiving an upgrade header will have their connections closed.

This event is guaranteed to be passed an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

Una coppia di client e server che dimostra come eseguire il listening dell'evento `'upgrade'`.

```js
const http = require('http');

// Create an HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('okay');
});
server.on('upgrade', (req, socket, head) => {
  socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
               'Upgrade: WebSocket\r\n' +
               'Connection: Upgrade\r\n' +
               '\r\n');

  socket.pipe(socket); // echo back
});

// Now that server is running
server.listen(1337, '127.0.0.1', () => {

  // make a request
  const options = {
    port: 1337,
    host: '127.0.0.1',
    headers: {
      'Connection': 'Upgrade',
      'Upgrade': 'websocket'
    }
  };

  const req = http.request(options);
  req.end();

  req.on('upgrade', (res, socket, upgradeHead) => {
    console.log('got upgraded!');
    socket.end();
    process.exit(0);
  });
});
```

### `request.abort()`<!-- YAML
added: v0.3.8
-->Contrassegna la richiesta come interrotta. Chiamarla causerà la caduta dei dati rimanenti nella risposta e la distruzione del socket.

### `request.aborted`<!-- YAML
added: v0.11.14
changes:
  - version: v11.0.0
    pr-url: https://github.com/nodejs/node/pull/20230
    description: The `aborted` property is no longer a timestamp number.
-->* {boolean}

The `request.aborted` property will be `true` if the request has been aborted.

### `request.connection`<!-- YAML
added: v0.3.0
deprecated: v13.0.0
-->> Stabilità: 0 - Obsoleto. Use [`request.socket`][].

* {stream.Duplex}

See [`request.socket`][].

### `request.end([data[, encoding]][, callback])`<!-- YAML
added: v0.1.90
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18780
    description: This method now returns a reference to `ClientRequest`.
-->* `data` {string|Buffer}
* `encoding` {string}
* `callback` {Function}
* Restituisce: {this}

Termina l'invio della richiesta. Se alcune parti del corpo non sono state inviate, le scaricherà nello stream. Se la richiesta è suddivisa in blocchi, verrà inviata la terminazione `'0\r\n\r\n'`.

Se `data` è specificato, è equivalente alla chiamata di [`request.write(data, encoding)`][] seguito da `request.end(callback)`.

Se il `callback` viene specificato, verrà chiamato al termine dello stream della richiesta.

### `request.finished`<!-- YAML
added: v0.0.1
deprecated: v13.4.0
-->> Stabilità: 0 - Obsoleto. Use [`request.writableEnded`][].

* {boolean}

The `request.finished` property will be `true` if [`request.end()`][] has been called. `request.end()` will automatically be called if the request was initiated via [`http.get()`][].

### `request.flushHeaders()`<!-- YAML
added: v1.6.0
-->Flushes the request headers.

For efficiency reasons, Node.js normally buffers the request headers until `request.end()` is called or the first chunk of request data is written. It then tries to pack the request headers and data into a single TCP packet.

That's usually desired (it saves a TCP round-trip), but not when the first data is not sent until possibly much later. `request.flushHeaders()` bypasses the optimization and kickstarts the request.

### `request.getHeader(name)`<!-- YAML
added: v1.6.0
-->* `name` {string}
* Returns: {any}

Legge un'intestazione sulla richiesta. The name is case-insensitive. The type of the return value depends on the arguments provided to [`request.setHeader()`][].

```js
request.setHeader('content-type', 'text/html');
request.setHeader('Content-Length', Buffer.byteLength(body));
request.setHeader('Cookie', ['type=ninja', 'language=javascript']);
const contentType = request.getHeader('Content-Type');
// 'contentType' is 'text/html'
const contentLength = request.getHeader('Content-Length');
// 'contentLength' is of type number
const cookie = request.getHeader('Cookie');
// 'cookie' is of type string[]
```

### `request.maxHeadersCount`

* {number} **Default:** `2000`

Limits maximum response headers count. If set to 0, no limit will be applied.

### `request.path`<!-- YAML
added: v0.4.0
-->* {string} The request path.

### `request.removeHeader(name)`
<!-- YAML
added: v1.6.0
-->

* `name` {string}

Rimuove un'intestazione già definita nell'object delle intestazioni.

```js
request.removeHeader('Content-Type');
```

### `request.reusedSocket`<!-- YAML
added: v13.0.0
-->* {boolean} Whether the request is send through a reused socket.

When sending request through a keep-alive enabled agent, the underlying socket might be reused. But if server closes connection at unfortunate time, client may run into a 'ECONNRESET' error.

```js
const http = require('http');

// Server has a 5 seconds keep-alive timeout by default
http
  .createServer((req, res) => {
    res.write('hello\n');
    res.end();
  })
  .listen(3000);

setInterval(() => {
  // Adapting a keep-alive agent
  http.get('http://localhost:3000', { agent }, (res) => {
    res.on('data', (data) => {
      // Do nothing
    });
  });
}, 5000); // Sending request on 5s interval so it's easy to hit idle timeout
```

By marking a request whether it reused socket or not, we can do automatic error retry base on it.

```js
const http = require('http');
const agent = new http.Agent({ keepAlive: true });

function retriableRequest() {
  const req = http
    .get('http://localhost:3000', { agent }, (res) => {
      // ...
    })
    .on('error', (err) => {
      // Check if retry is needed
      if (req.reusedSocket && err.code === 'ECONNRESET') {
        retriableRequest();
      }
    });
}

retriableRequest();
```

### `request.setHeader(name, value)`
<!-- YAML
added: v1.6.0
-->

* `name` {string}
* `value` {any}

Imposta un singolo valore di intestazione per l'object delle intestazioni. If this header already exists in the to-be-sent headers, its value will be replaced. Use an array of strings here to send multiple headers with the same name. Non-string values will be stored without modification. Therefore, [`request.getHeader()`][] may return non-string values. However, the non-string values will be converted to strings for network transmission.

```js
request.setHeader('Content-Type', 'application/json');
```

o

```js
request.setHeader('Cookie', ['type=ninja', 'language=javascript']);
```

### `request.setNoDelay([noDelay])`<!-- YAML
added: v0.5.9
-->* `noDelay` {boolean}

Una volta che un socket viene assegnato a questa richiesta ed è connesso, verrà chiamato [`socket.setNoDelay()`][].

### `request.setSocketKeepAlive([enable][, initialDelay])`<!-- YAML
added: v0.5.9
-->* `enable` {boolean}
* `initialDelay` {number}

Una volta che un socket viene assegnato a questa richiesta ed è connesso, verrà chiamato [`socket.setKeepAlive()`][].

### `request.setTimeout(timeout[, callback])`<!-- YAML
added: v0.5.9
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/8895
    description: Consistently set socket timeout only when the socket connects.
-->* `timeout` {number} Millisecondi prima della scadenza di una richiesta.
* `callback` {Function} Funzione facoltativa da chiamare quando si verifica un timeout. È uguale al binding dell'evento `'timeout'`.
* Restituisce: {http.ClientRequest}

Una volta che un socket viene assegnato a questa richiesta ed è connesso, verrà chiamato [`socket.setTimeout()`][].

### `request.socket`<!-- YAML
added: v0.3.0
-->* {stream.Duplex}

Riferimento al socket sottostante. Usually users will not want to access this property. In particular, the socket will not emit `'readable'` events because of how the protocol parser attaches to the socket. The `socket` may also be accessed via `request.connection`.

```js
const http = require('http');
const options = {
  host: 'www.google.com',
};
const req = http.get(options);
req.end();
req.once('response', (res) => {
  const ip = req.socket.localAddress;
  const port = req.socket.localPort;
  console.log(`Your IP address is ${ip} and your source port is ${port}.`);
  // Consume response object
});
```

This property is guaranteed to be an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specified a socket type other than {net.Socket}.

### `request.writableEnded`<!-- YAML
added: v12.9.0
-->* {boolean}

Is `true` after [`request.end()`][] has been called. This property does not indicate whether the data has been flushed, for this use [`request.writableFinished`][] instead.

### `request.writableFinished`<!-- YAML
added: v12.7.0
-->* {boolean}

Is `true` if all data has been flushed to the underlying system, immediately before the [`'finish'`][] event is emitted.

### `request.write(chunk[, encoding][, callback])`<!-- YAML
added: v0.1.29
-->* `chunk` {string|Buffer}
* `encoding` {string}
* `callback` {Function}
* Restituisce: {boolean}

Invia un pezzo del corpo. By calling this method many times, a request body can be sent to a server — in that case it is suggested to use the `['Transfer-Encoding', 'chunked']` header line when creating the request.

L'argomento `encoding` è facoltativo e si applica esclusivamente quando il `chunk` è una stringa. Il valore predefinito è `'utf8'`.

The `callback` argument is optional and will be called when this chunk of data is flushed, but only if the chunk is non-empty.

Restituisce `true ` se i dati interi sono stati scaricati con successo nel kernel buffer. Restituisce `false` se tutti o parte dei dati sono stati messi in coda nella memoria utente. `'drain'` verrà emesso quando il buffer è di nuovo libero.

When `write` function is called with empty string or buffer, it does nothing and waits for more input.

## Class: `http.Server`<!-- YAML
added: v0.1.17
-->* Estende: {net.Server}

### Event: `'checkContinue'`<!-- YAML
added: v0.3.0
-->* `request` {http.IncomingMessage}
* `response` {http.ServerResponse}

Emesso ogni volta che viene ricevuta una richiesta con un HTTP `Expect: 100-continue`. Se questo evento non viene sottoposto al listening, il server risponderà automaticamente con un `100 Continue` appropriato.

Handling this event involves calling [`response.writeContinue()`][] if the client should continue to send the request body, or generating an appropriate HTTP response (e.g. 400 Bad Request) if the client should not continue to send the request body.

When this event is emitted and handled, the [`'request'`][] event will not be emitted.

### Event: `'checkExpectation'`<!-- YAML
added: v5.5.0
-->* `request` {http.IncomingMessage}
* `response` {http.ServerResponse}

Emesso ogni volta che viene ricevuta una richiesta con un'intestazione HTTP `Expect`, in cui il valore non è `100-continue`. Se questo evento non viene sottoposto al listening, il server risponderà automaticamente con un `417 Expectation Failed` appropriato.

When this event is emitted and handled, the [`'request'`][] event will not be emitted.

### Event: `'clientError'`<!-- YAML
added: v0.1.94
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4557
    description: The default action of calling `.destroy()` on the `socket`
                 will no longer take place if there are listeners attached
                 for `'clientError'`.
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/17672
    description: The `rawPacket` is the current buffer that just parsed. Adding
                 this buffer to the error object of `'clientError'` event is to
                 make it possible that developers can log the broken packet.
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/25605
    description: The default behavior will return a 431 Request Header
                 Fields Too Large if a HPE_HEADER_OVERFLOW error occurs.
-->* `exception` {Error}
* `socket` {stream.Duplex}

Se una connessione client emette un evento `'error'`, questo verrà inoltrato qui. Il listener di questo evento è responsabile della chiusura/distruzione del socket sottostante. For example, one may wish to more gracefully close the socket with a custom HTTP response instead of abruptly severing the connection.

This event is guaranteed to be passed an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

Default behavior is to try close the socket with a HTTP '400 Bad Request', or a HTTP '431 Request Header Fields Too Large' in the case of a [`HPE_HEADER_OVERFLOW`][] error. If the socket is not writable it is immediately destroyed.

`socket` è il [`net.Socket`][] object da cui ha origine l'errore.

```js
const http = require('http');

const server = http.createServer((req, res) => {
  res.end();
});
server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(8000);
```

When the `'clientError'` event occurs, there is no `request` or `response` object, so any HTTP response sent, including response headers and payload, *must* be written directly to the `socket` object. È necessario prestare attenzione per garantire che la risposta sia un messaggio di risposta HTTP correttamente formattato.

`err` è un'istanza di `Error` con due colonne aggiuntive:

* `bytesParsed`: the bytes count of request packet that Node.js may have parsed correctly;
* `rawPacket`: il pacchetto grezzo della richiesta corrente.

### Event: `'close'`<!-- YAML
added: v0.1.4
-->Emesso quando il server si chiude.

### Event: `'connect'`<!-- YAML
added: v0.7.0
-->* `request` {http.IncomingMessage} Argomenti per la richiesta HTTP, così come è nell'evento [`'request'`][]
* `socket` {stream.Duplex} Network socket between the server and client
* `head` {Buffer} Il primo pacchetto del tunneling stream (potrebbe essere vuoto)

Emesso ogni volta che un client richiede un metodo HTTP `CONNECT`. Se questo evento non viene sottoposto al listening, le connessioni dei client che richiedono un metodo `CONNECT` verranno interrotte.

This event is guaranteed to be passed an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

After this event is emitted, the request's socket will not have a `'data'` event listener, meaning it will need to be bound in order to handle data sent to the server on that socket.

### Event: `'connection'`<!-- YAML
added: v0.1.0
-->* `socket` {stream.Duplex}

Questo evento viene emesso quando viene stabilito un nuovo stream TCP. `socket` is typically an object of type [`net.Socket`][]. Usually users will not want to access this event. In particular, the socket will not emit `'readable'` events because of how the protocol parser attaches to the socket. The `socket` can also be accessed at `request.connection`.

This event can also be explicitly emitted by users to inject connections into the HTTP server. In quel caso, qualsiasi stream [`Duplex`][] può essere passato.

If `socket.setTimeout()` is called here, the timeout will be replaced with `server.keepAliveTimeout` when the socket has served a request (if `server.keepAliveTimeout` is non-zero).

This event is guaranteed to be passed an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

### Event: `'request'`<!-- YAML
added: v0.1.0
-->* `request` {http.IncomingMessage}
* `response` {http.ServerResponse}

Emesso ogni volta che è presente una richiesta. There may be multiple requests per connection (in the case of HTTP Keep-Alive connections).

### Event: `'upgrade'`<!-- YAML
added: v0.1.94
changes:
  - version: v10.0.0
    pr-url: v10.0.0
    description: Not listening to this event no longer causes the socket
                 to be destroyed if a client sends an Upgrade header.
-->* `request` {http.IncomingMessage} Argomenti per la richiesta HTTP, così come è nell'evento [`'request'`][]
* `socket` {stream.Duplex} Network socket between the server and client
* `head` {Buffer} Il primo pacchetto dello stream aggiornato (potrebbe essere vuoto)

Emesso ogni volta che un client richiede un aggiornamento HTTP. Listening to this event is optional and clients cannot insist on a protocol change.

After this event is emitted, the request's socket will not have a `'data'` event listener, meaning it will need to be bound in order to handle data sent to the server on that socket.

This event is guaranteed to be passed an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

### `server.close([callback])`<!-- YAML
added: v0.1.90
-->* `callback` {Function}

Impedisce al server di accettare nuove connessioni. Vedi [`net.Server.close()`][].

### `server.headersTimeout`<!-- YAML
added: v11.3.0
-->* {number} **Default:** `60000`

Limit the amount of time the parser will wait to receive the complete HTTP headers.

In case of inactivity, the rules defined in [`server.timeout`][] apply. However, that inactivity based timeout would still allow the connection to be kept open if the headers are being sent very slowly (by default, up to a byte per 2 minutes). In order to prevent this, whenever header data arrives an additional check is made that more than `server.headersTimeout` milliseconds has not passed since the connection was established. If the check fails, a `'timeout'` event is emitted on the server object, and (by default) the socket is destroyed. See [`server.timeout`][] for more information on how timeout behavior can be customized.

### `server.listen()`

Avvia il server HTTP sottoposto al listening delle connessioni. Questo metodo è identico a [`server.listen()`][] da [`net.Server`][].

### `server.listening`<!-- YAML
added: v5.7.0
-->* {boolean} Indica se il server sta eseguendo il listening delle connessioni o no.

### `server.maxHeadersCount`<!-- YAML
added: v0.7.0
-->* {number} **Default:** `2000`

Limita il numero massimo di intestazioni in entrata. If set to 0, no limit will be applied.

### `server.setTimeout([msecs][, callback])`<!-- YAML
added: v0.9.12
changes:
  - version: v13.0.0
    pr-url: https://github.com/nodejs/node/pull/27558
    description: The default timeout changed from 120s to 0 (no timeout).
-->* `msecs` {number} **Default:** 0 (no timeout)
* `callback` {Function}
* Restituisce: {http.Server}

Imposta il valore di timeout per i socket ed emette un evento `'timeout'` sull'object Server, passando il socket come argomento, se si verifica un timeout.

Se esiste un listener di eventi `'timeout'` sull'object Server, allora questo verrà chiamato con il socket scaduto come argomento.

By default, the Server does not timeout sockets. However, if a callback is assigned to the Server's `'timeout'` event, timeouts must be handled explicitly.

### `server.timeout`<!-- YAML
added: v0.9.12
changes:
  - version: v13.0.0
    pr-url: https://github.com/nodejs/node/pull/27558
    description: The default timeout changed from 120s to 0 (no timeout).
-->* {number} Timeout in millisecondi. **Default:** 0 (no timeout)

Il tempo di inattività in millisecondi prima di presupporre che il socket è scaduto.

Un valore pari a `0` disabiliterà il comportamento di timeout sulle connessioni in entrata.

The socket timeout logic is set up on connection, so changing this value only affects new connections to the server, not any existing connections.

### `server.keepAliveTimeout`<!-- YAML
added: v8.0.0
-->* {number} Timeout in millisecondi. **Default:** `5000` (5 seconds).

The number of milliseconds of inactivity a server needs to wait for additional incoming data, after it has finished writing the last response, before a socket will be destroyed. If the server receives new data before the keep-alive timeout has fired, it will reset the regular inactivity timeout, i.e., [`server.timeout`][].

A value of `0` will disable the keep-alive timeout behavior on incoming connections. A value of `0` makes the http server behave similarly to Node.js versions prior to 8.0.0, which did not have a keep-alive timeout.

The socket timeout logic is set up on connection, so changing this value only affects new connections to the server, not any existing connections.

## Class: `http.ServerResponse`<!-- YAML
added: v0.1.17
-->* Extends: {Stream}

Questo object viene creato internamente da un server HTTP — non dall'utente. Viene trasmesso all'evento [`'request'`][] come secondo parametro.

### Event: `'close'`<!-- YAML
added: v0.6.7
-->Indicates that the underlying connection was terminated.

### Event: `'finish'`<!-- YAML
added: v0.3.6
-->Emesso nel momento in cui la risposta è stata inviata. Più specificamente, questo evento viene emesso quando l'ultimo segmento delle intestazioni di risposta ed il corpo sono stati trasferiti al sistema operativo per la trasmissione sulla rete. Ciò non implica che il client abbia ancora ricevuto qualcosa.

### `response.addTrailers(headers)`<!-- YAML
added: v0.3.0
-->* `headers` {Object}

Questo metodo aggiunge le intestazioni finali HTTP (un'intestazione ma alla fine del messaggio) alla risposta.

Trailers will **only** be emitted if chunked encoding is used for the response; if it is not (e.g. if the request was HTTP/1.0), they will be silently discarded.

HTTP requires the `Trailer` header to be sent in order to emit trailers, with a list of the header fields in its value. Ad esempio,

```js
response.writeHead(200, { 'Content-Type': 'text/plain',
                          'Trailer': 'Content-MD5' });
response.write(fileData);
response.addTrailers({ 'Content-MD5': '7895bf4b8828b55ceaf47747b4bca667' });
response.end();
```

Se si tenta di impostare un nome o un valore di campo dell'intestazione che contiene caratteri non validi, verrà generato un [`TypeError`][].

### `response.connection`<!-- YAML
added: v0.3.0
deprecated: v13.0.0
-->> Stabilità: 0 - Obsoleto. Use [`response.socket`][].

* {stream.Duplex}

Vedi [`response.socket`][].

### `response.cork()`<!-- YAML
added: v13.2.0
-->See [`writable.cork()`][].

### `response.end([data[, encoding]][, callback])`<!-- YAML
added: v0.1.90
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18780
    description: This method now returns a reference to `ServerResponse`.
-->* `data` {string|Buffer}
* `encoding` {string}
* `callback` {Function}
* Restituisce: {this}

Questo metodo segnala al server che sono state inviate tutte le intestazioni e il corpo della risposta; quel server dovrebbe considerare questo messaggio completo. Il metodo, `response.end()`, DEVE essere chiamato su ogni risposta.

If `data` is specified, it is similar in effect to calling [`response.write(data, encoding)`][] followed by `response.end(callback)`.

Se `callback` viene specificato, verrà chiamato al termine dello stream della risposta.

### `response.finished`<!-- YAML
added: v0.0.2
deprecated: v13.4.0
-->> Stabilità: 0 - Obsoleto. Use [`response.writableEnded`][].

* {boolean}

The `response.finished` property will be `true` if [`response.end()`][] has been called.

### `response.flushHeaders()`<!-- YAML
added: v1.6.0
-->Flushes the response headers. See also: [`request.flushHeaders()`][].

### `response.getHeader(name)`<!-- YAML
added: v0.4.0
-->* `name` {string}
* Returns: {any}

Legge un'intestazione che è già stata accodata ma non inviata al client. The name is case-insensitive. The type of the return value depends on the arguments provided to [`response.setHeader()`][].

```js
response.setHeader('Content-Type', 'text/html');
response.setHeader('Content-Length', Buffer.byteLength(body));
response.setHeader('Set-Cookie', ['type=ninja', 'language=javascript']);
const contentType = response.getHeader('content-type');
// contentType è 'text/html'
const contentLength = response.getHeader('Content-Length');
// contentLength è di tipo number
const setCookie = response.getHeader('set-cookie');
// setCookie è di tipo string[]
```

### `response.getHeaderNames()`<!-- YAML
added: v7.7.0
-->* Restituisce: {string[]}

Restituisce un array contenente i nomi univoci delle intestazioni correnti in uscita. Tutti i nomi di intestazione sono in minuscolo.

```js
response.setHeader('Foo', 'bar');
response.setHeader('Set-Cookie', ['foo=bar', 'bar=baz']);

const headerNames = response.getHeaderNames();
// headerNames === ['foo', 'set-cookie']
```

### `response.getHeaders()`<!-- YAML
added: v7.7.0
-->* Restituisce: {Object}

Restituisce una copia superficiale delle intestazioni correnti in uscita. Since a shallow copy is used, array values may be mutated without additional calls to various header-related http module methods. The keys of the returned object are the header names and the values are the respective header values. All header names are lowercase.

The object returned by the `response.getHeaders()` method _does not_ prototypically inherit from the JavaScript `Object`. This means that typical `Object` methods such as `obj.toString()`, `obj.hasOwnProperty()`, and others are not defined and *will not work*.

```js
response.setHeader('Foo', 'bar');
response.setHeader('Set-Cookie', ['foo=bar', 'bar=baz']);

const headers = response.getHeaders();
// headers === { foo: 'bar', 'set-cookie': ['foo=bar', 'bar=baz'] }
```

### `response.hasHeader(name)`
<!-- YAML
added: v7.7.0
-->

* `name` {string}
* Restituisce: {boolean}

Returns `true` if the header identified by `name` is currently set in the outgoing headers. The header name matching is case-insensitive.

```js
const hasContentType = response.hasHeader('content-type');
```

### `response.headersSent`<!-- YAML
added: v0.9.3
-->* {boolean}

Boolean (sola lettura). True se le intestazioni sono state inviate, altrimenti false.

### `response.removeHeader(name)`<!-- YAML
added: v0.4.0
-->* `name` {string}

Rimuove un'intestazione che è in coda per l'invio implicito.

```js
response.removeHeader('Content-Encoding');
```

### `response.sendDate`<!-- YAML
added: v0.7.5
-->* {boolean}

Quando è true, l'intestazione Data verrà generata automaticamente e inviata nella risposta se non è già presente nelle intestazioni. Il valore predefinito è true.

Questo dovrebbe essere disabilitato solo per i test; HTTP richiede l'intestazione Data nelle risposte.

### `response.setHeader(name, value)`
<!-- YAML
added: v0.4.0
-->

* `name` {string}
* `value` {any}

Imposta un singolo valore di intestazione per intestazioni implicite. Se questa intestazione esiste già nelle intestazioni da inviare, il suo valore sarà sostituito. Use an array of strings here to send multiple headers with the same name. Non-string values will be stored without modification. Therefore, [`response.getHeader()`][] may return non-string values. However, the non-string values will be converted to strings for network transmission.

```js
response.setHeader('Content-Type', 'text/html');
```

o

```js
response.setHeader('Set-Cookie', ['type=ninja', 'language=javascript']);
```

Se si tenta di impostare un nome o un valore di campo dell'intestazione che contiene caratteri non validi, verrà generato un [`TypeError`][].

When headers have been set with [`response.setHeader()`][], they will be merged with any headers passed to [`response.writeHead()`][], with the headers passed to [`response.writeHead()`][] given precedence.

```js
// Returns content-type = text/plain
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

If [`response.writeHead()`][] method is called and this method has not been called, it will directly write the supplied header values onto the network channel without caching internally, and the [`response.getHeader()`][] on the header will not yield the expected result. If progressive population of headers is desired with potential future retrieval and modification, use [`response.setHeader()`][] instead of [`response.writeHead()`][].

### `response.setTimeout(msecs[, callback])`<!-- YAML
added: v0.9.12
-->* `msecs` {number}
* `callback` {Function}
* Restituisce: {http.ServerResponse}

Imposta il valore di timeout del Socket su `msecs`. Se viene fornito un callback, viene aggiunto come listener sull'evento `'timeout'` sull'object della risposta.

Se non viene aggiunto nessun listener `'timeout'` né alla richiesta, né alla risposta e neppure al server, allora i socket vengono distrutti nel momento in cui scadono. If a handler is assigned to the request, the response, or the server's `'timeout'` events, timed out sockets must be handled explicitly.

### `response.socket`<!-- YAML
added: v0.3.0
-->* {stream.Duplex}

Riferimento al socket sottostante. Usually users will not want to access this property. In particular, the socket will not emit `'readable'` events because of how the protocol parser attaches to the socket. After `response.end()`, the property is nulled. The `socket` may also be accessed via `response.connection`.

```js
const http = require('http');
const server = http.createServer((req, res) => {
  const ip = res.socket.remoteAddress;
  const port = res.socket.remotePort;
  res.end(`Your IP address is ${ip} and your source port is ${port}.`);
}).listen(3000);
```

This property is guaranteed to be an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specified a socket type other than {net.Socket}.

### `response.statusCode`<!-- YAML
added: v0.4.0
-->* {number} **Default:** `200`

Quando si utilizzano intestazioni implicite (senza chiamare [`response.writeHead()`][] esplicitamente), questa proprietà controlla il codice di stato che verrà inviato al client nel momento in cui le intestazioni vengono scaricate.

```js
response.statusCode = 404;
```

Dopo che l'intestazione di risposta è stata inviata al client, questa proprietà indica il codice di stato che è stato inviato.

### `response.statusMessage`<!-- YAML
added: v0.11.8
-->* {string}

When using implicit headers (not calling [`response.writeHead()`][] explicitly), this property controls the status message that will be sent to the client when the headers get flushed. If this is left as `undefined` then the standard message for the status code will be used.

```js
response.statusMessage = 'Not found';
```

Dopo che l'intestazione di risposta è stata inviata al client, questa proprietà indica il messaggio di stato che è stato inviato.

### `response.uncork()`<!-- YAML
added: v13.2.0
-->See [`writable.uncork()`][].

### `response.writableEnded`<!-- YAML
added: v12.9.0
-->* {boolean}

Is `true` after [`response.end()`][] has been called. This property does not indicate whether the data has been flushed, for this use [`response.writableFinished`][] instead.

### `response.writableFinished`<!-- YAML
added: v12.7.0
-->* {boolean}

Is `true` if all data has been flushed to the underlying system, immediately before the [`'finish'`][] event is emitted.

### `response.write(chunk[, encoding][, callback])`<!-- YAML
added: v0.1.29
-->* `chunk` {string|Buffer}
* `encoding` {string} **Default:** `'utf8'`
* `callback` {Function}
* Restituisce: {boolean}

Se questo metodo viene chiamato e [`response.writeHead()`][] non è stato chiamato, passerà alla modalità dell'intestazione implicita e scaricherà le intestazioni implicite.

Questo invia un chunk del corpo della risposta. Questo metodo può essere chiamato più volte per fornire parti successive del corpo.

In the `http` module, the response body is omitted when the request is a HEAD request. Similarly, the `204` and `304` responses _must not_ include a message body.

Il `chunk` può essere una stringa o un buffer. Se `chunk` è una stringa, il secondo parametro specifica come codificarlo in uno stream di byte. Un `callback` verrà chiamato quando questo chunk di dati viene scaricato.

This is the raw HTTP body and has nothing to do with higher-level multi-part body encodings that may be used.

The first time [`response.write()`][] is called, it will send the buffered header information and the first chunk of the body to the client. The second time [`response.write()`][] is called, Node.js assumes data will be streamed, and sends the new data separately. That is, the response is buffered up to the first chunk of the body.

Restituisce `true ` se i dati interi sono stati scaricati con successo nel kernel buffer. Restituisce `false` se tutti o parte dei dati sono stati messi in coda nella memoria utente. `'drain'` verrà emesso quando il buffer è di nuovo libero.

### `response.writeContinue()`<!-- YAML
added: v0.3.0
-->Invia un messaggio HTTP/1.1 100 Continue al client, segnalando che il corpo della richiesta deve essere inviato. See the [`'checkContinue'`][] event on `Server`.

### `response.writeHead(statusCode[, statusMessage][, headers])`<!-- YAML
added: v0.1.30
changes:
  - version: v11.10.0
    pr-url: https://github.com/nodejs/node/pull/25974
    description: Return `this` from `writeHead()` to allow chaining with
                 `end()`.
  - version: v5.11.0, v4.4.5
    pr-url: https://github.com/nodejs/node/pull/6291
    description: A `RangeError` is thrown if `statusCode` is not a number in
                 the range `[100, 999]`.
-->* `statusCode` {number}
* `statusMessage` {string}
* `headers` {Object}
* Restituisce: {http.ServerResponse}

Invia un'intestazione di risposta alla richiesta. Lo status code è un codice di stato HTTP a 3 cifre, come `404`. L'ultimo argomento, `headers`, è composto dalle intestazioni di risposta. In opzione è possibile fornire uno `statusMessage` in forma leggibile come secondo argomento.

Returns a reference to the `ServerResponse`, so that calls can be chained.

```js
const body = 'hello world';
response
  .writeHead(200, {
    'Content-Length': Buffer.byteLength(body),
    'Content-Type': 'text/plain'
  })
  .end(body);
```

Questo metodo deve essere chiamato su un messaggio solo una volta e deve essere chiamato prima che [`response.end()`][] venga chiamato.

If [`response.write()`][] or [`response.end()`][] are called before calling this, the implicit/mutable headers will be calculated and call this function.

When headers have been set with [`response.setHeader()`][], they will be merged with any headers passed to [`response.writeHead()`][], with the headers passed to [`response.writeHead()`][] given precedence.

If this method is called and [`response.setHeader()`][] has not been called, it will directly write the supplied header values onto the network channel without caching internally, and the [`response.getHeader()`][] on the header will not yield the expected result. If progressive population of headers is desired with potential future retrieval and modification, use [`response.setHeader()`][] instead.

```js
// Returns content-type = text/plain
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

`Content-Length` is given in bytes not characters. L'esempio precedente funziona perché la stringa `'hello world'` contiene esclusivamente caratteri a byte singolo. Se il corpo contiene caratteri di codifica superiori, allora si dovrebbe utilizzare `Buffer.byteLength()` per determinare il numero di byte in una specifica codifica. And Node.js does not check whether `Content-Length` and the length of the body which has been transmitted are equal or not.

Se si tenta di impostare un nome o un valore di campo dell'intestazione che contiene caratteri non validi, verrà generato un [`TypeError`][].

### `response.writeProcessing()`<!-- YAML
added: v10.0.0
-->Sends a HTTP/1.1 102 Processing message to the client, indicating that the request body should be sent.

## Class: `http.IncomingMessage`<!-- YAML
added: v0.1.17
changes:
  - version: v13.1.0
    pr-url: https://github.com/nodejs/node/pull/30135
    description: The `readableHighWaterMark` value mirrors that of the socket.
-->* Extends: {stream.Readable}

Un `IncomingMessage` object viene creato da [`http.Server`][] o [`http.ClientRequest`][] e trasferito come primo argomento rispettivamente all'evento [`'request'`][] e all'evento [`'response'`][]. It may be used to access response status, headers and data.

### Event: `'aborted'`<!-- YAML
added: v0.3.8
-->Emitted when the request has been aborted.

### Event: `'close'`<!-- YAML
added: v0.4.2
-->Indica che la connessione sottostante è stata chiusa.

### `message.aborted`<!-- YAML
added: v10.1.0
-->* {boolean}

The `message.aborted` property will be `true` if the request has been aborted.

### `message.complete`<!-- YAML
added: v0.3.0
-->* {boolean}

The `message.complete` property will be `true` if a complete HTTP message has been received and successfully parsed.

This property is particularly useful as a means of determining if a client or server fully transmitted a message before a connection was terminated:

```js
const req = http.request({
  host: '127.0.0.1',
  port: 8080,
  method: 'POST'
}, (res) => {
  res.resume();
  res.on('end', () => {
    if (!res.complete)
      console.error(
        'The connection was terminated while the message was still being sent');
  });
});
```

### `message.destroy([error])`<!-- YAML
added: v0.3.0
-->* `error` {Error}

Chiama `destroy()` sul socket che ha ricevuto l'`IncomingMessage`. If `error` is provided, an `'error'` event is emitted on the socket and `error` is passed as an argument to any listeners on the event.

### `message.headers`<!-- YAML
added: v0.1.5
-->* {Object}

L'object delle intestazioni di richiesta/risposta.

Coppie di key-value di nomi e valori di intestazione. I nomi di intestazione sono in minuscolo.

```js
// Stampa qualcosa tipo:
//
// { 'user-agent': 'curl/7.22.0',
//   host: '127.0.0.1:8000',
//   accept: '*/*' }
console.log(request.headers);
```

I duplicati nelle intestazioni grezze vengono gestiti nei modi seguenti, a seconda del nome dell'intestazione:

* Duplicates of `age`, `authorization`, `content-length`, `content-type`, `etag`, `expires`, `from`, `host`, `if-modified-since`, `if-unmodified-since`, `last-modified`, `location`, `max-forwards`, `proxy-authorization`, `referer`, `retry-after`, `server`, or `user-agent` are discarded.
* `set-cookie` è sempre un array. I duplicati vengono aggiunti all'array.
* For duplicate `cookie` headers, the values are joined together with '; '.
* Per tutte le altre intestazioni, i valori vengono uniti con ', '.

### `message.httpVersion`<!-- YAML
added: v0.1.1
-->* {string}

In caso di richiesta del server, la versione HTTP inviata dal client. Nel caso di una risposta del client, la versione HTTP del server connesso. Probabilmente o `'1.1'` o `'1.0'`.

Inoltre `message.httpVersionMajor` è il primo integrale e `message.httpVersionMinor` è il secondo.

### `message.method`<!-- YAML
added: v0.1.1
-->* {string}

**Valido esclusivamente per richieste ottenute da [`http.Server`][].**

Il metodo di richiesta sotto forma di stringa. Solo lettura. Examples: `'GET'`, `'DELETE'`.

### `message.rawHeaders`<!-- YAML
added: v0.11.6
-->* {string[]}

L'elenco delle intestazioni di richiesta/risposta grezze esattamente come sono state ricevute.

The keys and values are in the same list. It is *not* a list of tuples. Pertanto, gli offset pari sono valori di chiave e gli offset dispari sono i valori associati.

I nomi delle intestazioni non sono in minuscolo e i duplicati non sono uniti.

```js
// Stampa qualcosa tipo:
//
// [ 'user-agent',
//   'this is invalid because there can be only one',
//   'User-Agent',
//   'curl/7.22.0',
//   'Host',
//   '127.0.0.1:8000',
//   'ACCEPT',
//   '*/*' ]
console.log(request.rawHeaders);
```

### `message.rawTrailers`<!-- YAML
added: v0.11.6
-->* {string[]}

Le chiavi ed i valori del trailer di richiesta/risposta raw, esattamente come sono stati ricevuti. Compilati esclusivamente nell'evento `'end'`.

### `message.setTimeout(msecs[, callback])`<!-- YAML
added: v0.5.9
-->* `msecs` {number}
* `callback` {Function}
* Restituisce: {http.IncomingMessage}

Chiama `message.connection.setTimeout(msecs, callback)`.

### `message.socket`<!-- YAML
added: v0.3.0
-->* {stream.Duplex}

L'object [`net.Socket`][] associato alla connessione.

Con il supporto HTTPS, utilizza [`request.socket.getPeerCertificate()`][] per ottenere i dettagli dell'autenticazione del client.

This property is guaranteed to be an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specified a socket type other than {net.Socket}.

### `message.statusCode`<!-- YAML
added: v0.1.1
-->* {number}

**Valido esclusivamente per risposte ottenute da [`http.ClientRequest`][].**

Il codice di stato a 3 cifre della risposta di HTTP. Per Esempio `404`.

### `message.statusMessage`<!-- YAML
added: v0.11.10
-->* {string}

**Valido esclusivamente per risposte ottenute da [`http.ClientRequest`][].**

Il messaggio di stato della risposta di HTTP (reason phrase). E.G. `OK` or `Internal Server
Error`.

### `message.trailers`<!-- YAML
added: v0.3.0
-->* {Object}

L'object dei trailer di richiesta/risposta. Compilati esclusivamente nell'evento `'end'`.

### `message.url`<!-- YAML
added: v0.1.90
-->* {string}

**Valido esclusivamente per richieste ottenute da [`http.Server`][].**

Stringa URL della richiesta. Contiene esclusivamente l'URL che è presente nella richiesta HTTP effettiva. Se la richiesta è:

```txt
GET /status?name=ryan HTTP/1.1\r\n
Accept: text/plain\r\n
\r\n
```

To parse the URL into its parts:

```js
new URL(request.url, `http://${request.headers.host}`);
```

When `request.url` is `'/status?name=ryan'` and `request.headers.host` is `'localhost:3000'`:

```console
$ node
> new URL(request.url, `http://${request.headers.host}`)
URL {
  href: 'http://localhost:3000/status?name=ryan',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  username: '',
  password: '',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/status',
  search: '?name=ryan',
  searchParams: URLSearchParams { 'name' => 'ryan' },
  hash: ''
}
```

## `http.METHODS`<!-- YAML
added: v0.11.8
-->* {string[]}

Un elenco dei metodi HTTP supportati dal parser.

## `http.STATUS_CODES`<!-- YAML
added: v0.1.22
-->* {Object}

Una raccolta di tutti gli status code standard delle risposte HTTP e la breve descrizione di ciascuno. Per esempio, `http.STATUS_CODES[404] === 'Not
Found'`.

## `http.createServer([options][, requestListener])`<!-- YAML
added: v0.1.13
changes:
  - version: v13.8.0
    pr-url: https://github.com/nodejs/node/pull/31448
    description: The `insecureHTTPParser` option is supported now.
  - version: v13.3.0
    pr-url: https://github.com/nodejs/node/pull/30570
    description: The `maxHeaderSize` option is supported now.
  - version: v9.6.0, v8.12.0
    pr-url: https://github.com/nodejs/node/pull/15752
    description: The `options` argument is supported now.
-->* `options` {Object}
  * `IncomingMessage` {http.IncomingMessage} Specifies the `IncomingMessage` class to be used. Utile per estendere l'`IncomingMessage` originale. **Default:** `IncomingMessage`.
  * `ServerResponse` {http.ServerResponse} Specifies the `ServerResponse` class to be used. Utile per estendere il `ServerResponse` originale. **Default:** `ServerResponse`.
  * `insecureHTTPParser` {boolean} Use an insecure HTTP parser that accepts invalid HTTP headers when `true`. Using the insecure parser should be avoided. See [`--insecure-http-parser`][] for more information. **Default:** `false`
  * `maxHeaderSize` {number} Optionally overrides the value of [`--max-http-header-size`][] for requests received by this server, i.e. the maximum length of request headers in bytes. **Default:** 8192 (8KB).
* `requestListener` {Function}

* Restituisce: {http.Server}

Restituisce una nuova istanza di [`http.Server`][].

La `requestListener` è una funzione che viene automaticamente aggiunta all'evento [`'request'`][].

## `http.get(options[, callback])`
## `http.get(url[, options][, callback])`<!-- YAML
added: v0.3.6
changes:
  - version: v10.9.0
    pr-url: https://github.com/nodejs/node/pull/21616
    description: The `url` parameter can now be passed along with a separate
                 `options` object.
  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->* `url` {string | URL}
* `options` {Object} Accepts the same `options` as [`http.request()`][], with the `method` always set to `GET`. Le proprietà ereditate dal prototipo vengono ignorate.
* `callback` {Function}
* Restituisce: {http.ClientRequest}

Poiché la maggior parte delle richieste sono richieste GET senza corpi, Node.js fornisce questo metodo di convenienza. L'unica differenza tra questo metodo e [`http.request()`][] è che imposta il metodo su GET e chiama `req.end()` automaticamente. The callback must take care to consume the response data for reasons stated in [`http.ClientRequest`][] section.

The `callback` is invoked with a single argument that is an instance of [`http.IncomingMessage`][].

JSON fetching example:

```js
http.get('http://nodejs.org/dist/index.json', (res) => {
  const { statusCode } = res;
  const contentType = res.headers['content-type'];

  let error;
  if (statusCode !== 200) {
    error = new Error('Request Failed.\n' +
                      `Status Code: ${statusCode}`);
  } else if (!/^application\/json/.test(contentType)) {
    error = new Error('Invalid content-type.\n' +
                      `Expected application/json but received ${contentType}`);
  }
  if (error) {
    console.error(error.message);
    // Consume response data to free up memory
    res.resume();
    return;
  }

  res.setEncoding('utf8');
  let rawData = '';
  res.on('data', (chunk) => { rawData += chunk; });
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(rawData);
      console.log(parsedData);
    } catch (e) {
      console.error(e.message);
    }
  });
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});
```

## `http.globalAgent`<!-- YAML
added: v0.5.9
-->* {http.Agent}

Istanza globale dell'`Agent` che viene utilizzata di default per tutte le richieste HTTP del client.

## `http.maxHeaderSize`<!-- YAML
added: v11.6.0
-->* {number}

Read-only property specifying the maximum allowed size of HTTP headers in bytes. Defaults to 8KB. Configurable using the [`--max-http-header-size`][] CLI option.

This can be overridden for servers and client requests by passing the `maxHeaderSize` option.

## `http.request(options[, callback])`
## `http.request(url[, options][, callback])`<!-- YAML
added: v0.3.6
changes:
  - version: v13.8.0
    pr-url: https://github.com/nodejs/node/pull/31448
    description: The `insecureHTTPParser` option is supported now.
  - version: v13.3.0
    pr-url: https://github.com/nodejs/node/pull/30570
    description: The `maxHeaderSize` option is supported now.
  - version: v10.9.0
    pr-url: https://github.com/nodejs/node/pull/21616
    description: The `url` parameter can now be passed along with a separate
                 `options` object.
  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->* `url` {string | URL}
* `options` {Object}
  * `agent` {http.Agent | boolean} Controls [`Agent`][] behavior. Possible values:
    * `undefined` (di default): utilizzo di [`http.globalAgent`][] per questo host e questa porta.
    * `Agent` object: utilizzo esplicito di ciò che è stato trasferito su `Agent`.
    * `false`: determina l'utilizzo di un nuovo `Agent` con i valori predefiniti.
  * `auth` {string} L'autenticazione di base, ovvero la `'user:password'` per calcolare un'intestazione di Authorization.
  * `createConnection` {Function} Una funzione che produce un socket/stream da utilizzare per la richiesta quando non viene utilizzata l'opzione `agent`. Ciò può essere utilizzato per evitare la creazione di una classe personalizzata di `Agent` esclusivamente per sovrascrivere la funzione predefinita `createConnection`. Vedi [`agent.createConnection()`][] per ulteriori dettagli. Qualsiasi stream di [`Duplex`][] è un valore di ritorno valido.
  * `defaultPort` {number} Default port for the protocol. **Default:** `agent.defaultPort` if an `Agent` is used, else `undefined`.
  * `family` {number} IP address family to use when resolving `host` or `hostname`. I valori validi sono `4` o `6`. Quando non viene specificato, verranno utilizzati sia IP v4 che v6.
  * `headers` {Object} Un object che contiene le intestazioni di richiesta.
  * `host` {string} Un nome di dominio o un indirizzo IP del server a cui inviare la richiesta. **Default:** `'localhost'`.
  * `hostname` {string} L'alias di `host`. To support [`url.parse()`][], `hostname` will be used if both `host` and `hostname` are specified.
  * `insecureHTTPParser` {boolean} Use an insecure HTTP parser that accepts invalid HTTP headers when `true`. Using the insecure parser should be avoided. See [`--insecure-http-parser`][] for more information. **Default:** `false`
  * `localAddress` {string} L' interfaccia locale per eseguire il binding per le connessioni di rete.
  * `lookup` {Function} Funzione lookup (di ricerca) personalizzata. **Default:** [`dns.lookup()`][].
  * `maxHeaderSize` {number} Optionally overrides the value of [`--max-http-header-size`][] for requests received from the server, i.e. the maximum length of response headers in bytes. **Default:** 8192 (8KB).
  * `method` {string} Una stringa che specifica il metodo di richiesta HTTP. **Default:** `'GET'`.
  * `path` {string} Il percorso della richiesta. Dovrebbe includere la stringa di query, se presente. Ad Esempio `'/index.html?page=12'`. An exception is thrown when the request path contains illegal characters. Currently, only spaces are rejected but that may change in the future. **Default:** `'/'`.
  * `port` {number} La porta del server remoto. **Default:** `defaultPort` if set, else `80`.
  * `protocol` {string} Il protocollo da utilizzare. **Default:** `'http:'`.
  * `setHost` {boolean}: Specifies whether or not to automatically add the `Host` header. Il valore predefinito è `true`.
  * `socketPath` {string} Unix Domain Socket (cannot be used if one of `host` or `port` is specified, those specify a TCP Socket).
  * `timeout` {number}: Un numero che specifica il timeout del socket in millisecondi. Imposterà il timeout prima che il socket venga connesso.
* `callback` {Function}
* Restituisce: {http.ClientRequest}

Node.js mantiene diverse connessioni per server per effettuare richieste HTTP. Questa funzione consente di inviare in modo trasparente le richieste.

`url` can be a string or a [`URL`][] object. If `url` is a string, it is automatically parsed with [`new URL()`][]. If it is a [`URL`][] object, it will be automatically converted to an ordinary `options` object.

If both `url` and `options` are specified, the objects are merged, with the `options` properties taking precedence.

Il parametro `callback` facoltativo verrà aggiunto come listener una tantum per l'evento [`'response'`][].

`http.request()` restituisce un'istanza della classe [`http.ClientRequest`][]. L'istanza `ClientRequest` è un writable stream. Se si ha necessità di caricare un file con una richiesta POST, scrivere all'object `ClientRequest`.

```js
const postData = querystring.stringify({
  'msg': 'Hello World!'
});

const options = {
  hostname: 'www.google.com',
  port: 80,
  path: '/upload',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
  res.on('end', () => {
    console.log('No more data in response.');
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();
```

In the example `req.end()` was called. With `http.request()` one must always call `req.end()` to signify the end of the request - even if there is no data being written to the request body.

Se si è verificato un qualunque errore durante la richiesta (che sia una risoluzione DNS, errori di livello TCP o errori di analisi su HTTP effettivi) viene emesso un evento `'error'` sull'object della richiesta di ritorno. Come con tutti gli eventi `'error'`, se non ci sono listener registrati, verrà generato l'errore.

Ci sono alcune intestazioni speciali che dovrebbero essere considerate.

* L'invio di un 'Connection: keep-alive' notificherà a Node.js che la connessione al server dovrebbe essere mantenuta fino alla richiesta successiva.

* L'invio di un'intestazione 'Content-Length' disabiliterà la codifica chunked predefinita.

* L'invio di un'intestazione 'Expect' invierà immediatamente le intestazioni di richiesta. Usually, when sending 'Expect: 100-continue', both a timeout and a listener for the `'continue'` event should be set. See RFC 2616 Section 8.2.3 for more information.

* L'invio di un'intestazione Authorization eseguirà l'override sull'utilizzo dell'opzione `auth` per calcolare l'autenticazione di base.

Esempio di utilizzo di un [`URL`][] come `options`:

```js
const options = new URL('http://abc:xyz@example.com');

const req = http.request(options, (res) => {
  // ...
});
```

In a successful request, the following events will be emitted in the following order:

* `'socket'`
* `'response'`
  * `'data'` any number of times, on the `res` object (`'data'` will not be emitted at all if the response body is empty, for instance, in most redirects)
  * `'end'` sul `res` object
* `'close'`

Nel caso di un errore di connessione, verranno emessi i seguenti eventi:

* `'socket'`
* `'error'`
* `'close'`

In the case of a premature connection close before the response is received, the following events will be emitted in the following order:

* `'socket'`
* `'error'` with an error with message `'Error: socket hang up'` and code `'ECONNRESET'`
* `'close'`

In the case of a premature connection close after the response is received, the following events will be emitted in the following order:

* `'socket'`
* `'response'`
  * `'data'` un numero qualsiasi di volte, sul `res` object
* (connection closed here)
* `'aborted'` sul `res` object
* `'close'`
* `'close'` sul `res` object

If `req.abort()` is called before the connection succeeds, the following events will be emitted in the following order:

* `'socket'`
* (`req.abort()` chiamato qui)
* `'abort'`
* `'error'` with an error with message `'Error: socket hang up'` and code `'ECONNRESET'`
* `'close'`

If `req.abort()` is called after the response is received, the following events will be emitted in the following order:

* `'socket'`
* `'response'`
  * `'data'` un numero qualsiasi di volte, sul `res` object
* (`req.abort()` chiamato qui)
* `'abort'`
* `'aborted'` sul `res` object
* `'close'`
* `'close'` sul `res` object

Setting the `timeout` option or using the `setTimeout()` function will not abort the request or do anything besides add a `'timeout'` event.
