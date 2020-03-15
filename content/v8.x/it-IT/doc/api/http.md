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

## Class: http.Agent<!-- YAML
added: v0.3.4
-->Un `Agent` è responsabile della gestione della persistenza della connessione e del riutilizzo per i client HTTP. Mantiene una coda di richieste in sospeso per un host e una porta determinati, riutilizzando una singola connessione socket per ciascuna finché la coda non è vuota, momento in cui il socket viene distrutto o inserito in un pool in cui viene mantenuto per essere utilizzato nuovamente per le richieste allo stesso host e alla stessa porta. Se viene distrutto o inserito in un pool dipende dall'[opzione](#http_new_agent_options) `keepAlive`.

Le connessioni in pool dispongono di TCP Keep-Alive abilitato, ma i server potrebbero comunque chiudere le connessioni inattive, nel qual caso verranno rimosse dal pool e verrà creata una nuova connessione quando viene effettuata una nuova richiesta HTTP per quell'host e quella porta. I server possono anche rifiutare di consentire più richieste sulla stessa connessione, nel qual caso la connessione dovrà essere ricreata per ogni richiesta e non può essere inserita in un pool. L'`Agent` effettuerà comunque le richieste su quel server, ma ognuna si verificherà su una nuova connessione.

Quando una connessione viene chiusa dal client o dal server, viene rimossa dal pool. Tutti i socket inutilizzati nel pool verranno passati a unref per non mantenere in esecuzione il processo Node.js quando non sono presenti richieste in sospeso. (see [socket.unref()](net.html#net_socket_unref)).

È buona prassi, eseguire [`destroy()`][] su un'istanza `Agent` quando non è più in uso, poiché i socket inutilizzati consumano risorse del sistema operativo.

I socket vengono rimossi da un agente quando il socket emette un evento `'close'` o un evento `'agentRemove'`. Quando si intende mantenere una richiesta HTTP aperta per un lungo periodo senza tenerla nell'agente, si può fare qualcosa di simile a quanto segue:

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
  agent: false  // crea un nuovo agent solo per questa richiesta
}, (res) => {
  // Fai operazione con risposta
});
```

### new Agent([options])<!-- YAML
added: v0.3.4
-->* `options` {Object} Set of configurable options to set on the agent. Può avere i seguenti campi:
  * `keepAlive` {boolean} Mantiene i socket attivi anche quando non ci sono richieste in sospeso, in modo che possano essere utilizzate per richieste future senza dover ristabilire una connessione TCP. **Default:** `false`.
  * `keepAliveMsecs` {number} Quando si utilizza l'opzione `keepAlive`, specifica il [ritardo iniziale](net.html#net_socket_setkeepalive_enable_initialdelay) per i pacchetti Keep-alive TCP. Ignorato quando l'opzione `keepAlive` è `false` o `undefined`. **Default:** `1000`.
  * `maxSockets` {number} Numero massimo di socket da consentire per host. **Default:** `Infinity`.
  * `maxFreeSockets` {number} Numero massimo di socket da lasciare aperti in uno stato libero. Rilevante solo se `keepAlive` è impostato su `true`. **Default:** `256`.

Il [`http.globalAgent`][] predefinito utilizzato da [`http.request()`][] ha tutti questi valori impostati sui rispettivi valori predefiniti.

Per configurarne uno qualsiasi, è necessario creare un'istanza [`http.Agent`][] personalizzata.

```js
const http = require('http');
const keepAliveAgent = new http.Agent({ keepAlive: true });
options.agent = keepAliveAgent;
http.request(options, onResponseCallback);
```

### agent.createConnection(options[, callback])<!-- YAML
added: v0.11.4
-->* `options` {Object} Opzioni contenenti i dettagli di connessione. Controllare [`net.createConnection(`][]) per il formato delle opzioni
* `callback` {Function} Funzione callback che riceve il socket creato
* Restituisce: {net.Socket}

Produce un socket/stream da utilizzare per le richieste HTTP.

Di default, questa funzione è la stessa di [`net.createConnection()`][]. Tuttavia, gli agenti personalizzati possono sovrascrivere questo metodo nel caso in cui si desideri una maggiore flessibilità.

Un socket/stream può essere fornito in due modi: restituendo il socket/stream da questa funzione, o passando il socket/stream al `callback`.

`callback` ha una firma di `(err, stream)`.

### agent.keepSocketAlive(socket)<!-- YAML
added: v8.1.0
-->* `socket` {net.Socket}

Called when `socket` is detached from a request and could be persisted by the Agent. Il comportamento predefinito è:

```js
socket.setKeepAlive(true, this.keepAliveMsecs);
socket.unref();
return true;
```

Questo metodo può essere sovrascritto da una particolare sottoclasse di `Agent`. Se questo metodo restituisce un valore falso, il socket verrà distrutto anziché mantenuto per essere utilizzato con la richiesta successiva.

### agent.reuseSocket(socket, request)<!-- YAML
added: v8.1.0
-->* `socket` {net.Socket}
* `request` {http.ClientRequest}

Chiamato quando il `socket` è collegato alla `request` dopo essere stato mantenuto a causa delle opzioni keep-alive. Il comportamento predefinito è:

```js
socket.ref();
```

Questo metodo può essere sovrascritto da una particolare sottoclasse di `Agent`.

### agent.destroy()<!-- YAML
added: v0.11.4
-->Distruggi qualsiasi socket attualmente utilizzato dall'agente.

Solitamente non è necessario farlo. Tuttavia, se si utilizza un agente con `keepAlive` attivato, è preferibile arrestare esplicitamente l'agente quando non verrà più utilizzato. In caso contrario, i socket potrebbero rimanere aperti per un periodo piuttosto lungo prima che il server li interrompa.

### agent.freeSockets<!-- YAML
added: v0.11.4
-->* {Object}

Un object che contiene array di socket attualmente in attesa di utilizzo da parte dell'agente quando `keepAlive` è abilitato. Non modificare.

### agent.getName(options)
<!-- YAML
added: v0.11.4
-->

* `options` {Object} A set of options providing information for name generation
  * `host` {string} A domain name or IP address of the server to issue the request to
  * `port` {number} Porta del server remoto
  * `localAddress` {string} Interfaccia locale per eseguire il binding per le connessioni di rete durante l'emissione della richiesta
  * `family` {integer} Deve essere 4 o 6 se questo non è uguale a `undefined`.
* Restituisce: {string}

Ottenere un nome univoco per un set di opzioni di richiesta, per determinare se una connessione può essere riutilizzata. Per un agente HTTP, questo restituisce `host:port:localAddress` o `host:port:localAddress:family`. Per un agente HTTPS, il nome include CA, certificati, crittografie ed altre opzioni specifiche HTTPS/TLS che determinano la riusabilità del socket.

### agent.maxFreeSockets<!-- YAML
added: v0.11.7
-->* {number}

Di default è impostato a 256. Per gli agenti con `keepAlive` abilitato, questo stabilisce il numero massimo di socket che verranno lasciati aperti nello stato libero.

### agent.maxSockets<!-- YAML
added: v0.3.6
-->* {number}

Di default è impostato su Infinity. Determina quanti socket simultanei l'agente può tenere aperti per origine. L'origine è il valore restituito di [`agent.getName()`][].

### agent.requests<!-- YAML
added: v0.5.9
-->* {Object}

Un object che contiene code di richieste che non sono ancora state assegnate ai socket. Non modificare.

### agent.sockets
<!-- YAML
added: v0.3.6
-->

* {Object}

Un object che contiene array di socket attualmente in uso dall'agente. Non modificare.

## Class: http.ClientRequest<!-- YAML
added: v0.1.17
-->Questo object viene creato internamente e restituito da [`http.request()`][]. Rappresenta una richiesta _in corso_ il cui header è già stato inserito nella coda. L'intestazione può ancora essere modificata utilizzando le API [`setHeader(name, value)`][], [`getHeader(name)`][], [`removeHeader(name)`][]. L'intestazione effettiva verrà inviata insieme al primo chunk di dati o quando si chiama [`request.end()`][].

Per ottenere la risposta, aggiungi un listener per [`'response'`][] all'object richiesta. [`'response'`][] verrà emessa dall'object richiesta una volta che le intestazioni di risposta siano state ricevute. L'evento [`'response'`][] viene eseguito con un argomento che è un'istanza di [`http.IncomingMessage`][].

Durante l'evento [`'response'`][], è possibile aggiungere altri listener all'object risposta; in particolare per sottoporre al listening l'evento `'data'`.

Se non viene aggiunto nessun [`'response'`][] handler, allora la risposta verrà completamente scartata. Tuttavia, se viene aggiunto un handler di eventi [`'response'`][], allora i dati dell'object risposta **devono** essere consumati, chiamando `response.read()` ogni volta che si verifica un evento `'readable'`, o aggiungendo un `'data'` handler, oppure chiamando il metodo `.resume()`. Fino a quando i dati non vengono consumati, l'evento `'end'` non viene attivato. Inoltre, finché i dati non vengono letti, esso consumerà memoria che alla fine può portare a un errore di 'elaborazione insufficiente'.

*Note*: Node.js does not check whether Content-Length and the length of the body which has been transmitted are equal or not.

La richiesta implementa l'interfaccia [Writable Stream](stream.html#stream_class_stream_writable). Questo è un [`EventEmitter`][] con i seguenti eventi:

### Event: 'abort'<!-- YAML
added: v1.4.1
-->Emesso quando la richiesta è stata interrotta dal client. Questo evento viene emesso esclusivamente alla prima chiamata a `abort()`.

### Event: 'connect'<!-- YAML
added: v0.7.0
-->* `response` {http.IncomingMessage}
* `socket` {net.Socket}
* `head` {Buffer}

Emesso ogni volta che un server risponde a una richiesta con un metodo `CONNECT`. If this event is not being listened for, clients receiving a `CONNECT` method will have their connections closed.

Una coppia di client e server che dimostra come eseguire il listening dell'evento `'connect'`:

```js
const http = require('http');
const net = require('net');
const url = require('url');

// Crea un HTTP tunneling proxy
const proxy = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('okay');
});
proxy.on('connect', (req, cltSocket, head) => {
  // connetti ad un server di origine
  const srvUrl = url.parse(`http://${req.url}`);
  const srvSocket = net.connect(srvUrl.port, srvUrl.hostname, () => {
    cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                    'Proxy-agent: Node.js-Proxy\r\n' +
                    '\r\n');
    srvSocket.write(head);
    srvSocket.pipe(cltSocket);
    cltSocket.pipe(srvSocket);
  });
});

// ora che il proxy è in esecuzione
proxy.listen(1337, '127.0.0.1', () => {

  // fai una richiesta ad un tunneling proxy
  const options = {
    port: 1337,
    hostname: '127.0.0.1',
    method: 'CONNECT',
    path: 'www.google.com:80'
  };

  const req = http.request(options);
  req.end();

  req.on('connect', (res, socket, head) => {
    console.log('got connected!');

    // fai una richiesta attraverso un tunnel HTTP
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

### Event: 'continue'<!-- YAML
added: v0.3.2
-->Emesso quando il server invia una risposta HTTP '100 Continue', solitamente perché la richiesta conteneva 'Expect: 100-continue'. Questa è un'istruzione che il client dovrebbe inviare al corpo della richiesta.

### Event: 'response'<!-- YAML
added: v0.1.0
-->* `response` {http.IncomingMessage}

Emesso quando viene ricevuta una risposta a questa richiesta. Questo evento viene emesso una volta sola.

### Event: 'socket'<!-- YAML
added: v0.5.3
-->* `socket` {net.Socket}

Emesso in seguito all'assegnazione di un socket a questa richiesta.

### Event: 'timeout'<!-- YAML
added: v0.7.8
-->Emesso quando il socket sottostante scade per inattività. Ciò notifica esclusivamente che il socket è rimasto inattivo. La richiesta deve essere interrotta manualmente.

Vedi anche: [`request.setTimeout()`][]

### Event: 'upgrade'<!-- YAML
added: v0.1.94
-->* `response` {http.IncomingMessage}
* `socket` {net.Socket}
* `head` {Buffer}

Emesso ogni volta che un server risponde ad una richiesta con un aggiornamento. If this event is not being listened for, clients receiving an upgrade header will have their connections closed.

Una coppia di client e server che dimostra come eseguire il listening dell'evento `'upgrade'`.

```js
const http = require('http');

// Crea un server HTTP 
const srv = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('okay');
});
srv.on('upgrade', (req, socket, head) => {
  socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
               'Upgrade: WebSocket\r\n' +
               'Connection: Upgrade\r\n' +
               '\r\n');

  socket.pipe(socket); // eco di ritorno
});

// ora che il server è in esecuzione
srv.listen(1337, '127.0.0.1', () => {

  // fai una richiesta
  const options = {
    port: 1337,
    hostname: '127.0.0.1',
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

### request.abort()<!-- YAML
added: v0.3.8
-->Contrassegna la richiesta come interrotta. Chiamarla causerà la caduta dei dati rimanenti nella risposta e la distruzione del socket.

### request.aborted<!-- YAML
added: v0.11.14
-->Se una richiesta è stata interrotta, questo valore è il tempo in cui la richiesta è stata interrotta, in millisecondi dal 1 gennaio 1970 alle 00:00:00 UTC.

### request.connection<!-- YAML
added: v0.3.0
-->* {net.Socket}

See [`request.socket`][]

### request.end(\[data[, encoding]\]\[, callback\])<!-- YAML
added: v0.1.90
-->* `data` {string|Buffer}
* `encoding` {string}
* `callback` {Function}

Termina l'invio della richiesta. Se alcune parti del corpo non sono state inviate, le scaricherà nello stream. Se la richiesta è suddivisa in blocchi, verrà inviata la terminazione `'0\r\n\r\n'`.

Se `data` è specificato, è equivalente alla chiamata di [`request.write(data, encoding)`][] seguito da `request.end(callback)`.

Se il `callback` viene specificato, verrà chiamato al termine dello stream della richiesta.

### request.flushHeaders()<!-- YAML
added: v1.6.0
-->Scarica le intestazioni della richiesta.

Per motivi di efficienza, Node.js normalmente bufferizza le intestazioni della richiesta finché `request.end()` viene chiamato o il primo chunk di dati della richiesta viene scritto. In seguito tenta di comprimere le intestazioni e i dati delle richieste in un singolo pacchetto TCP.

Ciò di solito è voluto (salva un round-trip TCP), ma non quando i primi dati non vengono magari inviati fino a molto tempo dopo. `request.flushHeaders()` ignora l'ottimizzazione e avvia la richiesta.

### request.getHeader(name)<!-- YAML
added: v1.6.0
-->* `name` {string}
* Restituisce: {string}

Legge un'intestazione sulla richiesta. Notare che il nome è case insensitive.

Esempio:
```js
const contentType = request.getHeader('Content-Type');
```

### request.removeHeader(name)
<!-- YAML
added: v1.6.0
-->

* `name` {string}

Rimuove un'intestazione già definita nell'object delle intestazioni.

Esempio:
```js
request.removeHeader('Content-Type');
```

### request.setHeader(name, value)
<!-- YAML
added: v1.6.0
-->

* `name` {string}
* `value` {string}

Imposta un singolo valore di intestazione per l'object delle intestazioni. Se questa intestazione esiste già nelle intestazioni da inviare, il suo valore sarà sostituito. Utilizza un array di stringhe per inviare più intestazioni con lo stesso nome.

Esempio:
```js
request.setHeader('Content-Type', 'application/json');
```

o

```js
request.setHeader('Set-Cookie', ['type=ninja', 'language=javascript']);
```

### request.setNoDelay([noDelay])<!-- YAML
added: v0.5.9
-->* `noDelay` {boolean}

Una volta che un socket viene assegnato a questa richiesta ed è connesso, verrà chiamato [`socket.setNoDelay()`][].

### request.setSocketKeepAlive(\[enable\]\[, initialDelay\])<!-- YAML
added: v0.5.9
-->* `enable` {boolean}
* `initialDelay` {number}

Una volta che un socket viene assegnato a questa richiesta ed è connesso, verrà chiamato [`socket.setKeepAlive()`][].

### request.setTimeout(timeout[, callback])
<!-- YAML
added: v0.5.9
-->

* `timeout` {number} Millisecondi prima della scadenza di una richiesta.
* `callback` {Function} Funzione facoltativa da chiamare quando si verifica un timeout. Same as binding to the `timeout` event.

If no socket is assigned to this request then [`socket.setTimeout()`][] will be called immediately. Otherwise [`socket.setTimeout()`][] will be called after the assigned socket is connected.

Returns `request`.

### request.socket<!-- YAML
added: v0.3.0
-->* {net.Socket}

Riferimento al socket sottostante. Di solito gli utenti non vogliono accedere a questa proprietà. In particolare, il socket non emetterà eventi `'readable'` a causa del modo in cui il parser del protocollo si collega al socket. Dopo `response.end()`, la proprietà viene annullata. Si può accedere al `socket` anche tramite `request.connection`.

Esempio:

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
  // utilizza l'object risposta
});
```

### request.write(chunk\[, encoding\]\[, callback\])<!-- YAML
added: v0.1.29
-->* `chunk` {string|Buffer}
* `encoding` {string}
* `callback` {Function}

Invia un pezzo del corpo. Chiamando questo metodo molte volte, un corpo di richiesta può essere inviato a un server — in tal caso si consiglia di utilizzare la riga di intestazione `['Transfer-Encoding', 'chunked']` durante la creazione della richiesta.

L'argomento `encoding` è facoltativo e si applica esclusivamente quando il `chunk` è una stringa. Il valore predefinito è `'utf8'`.

L'argomento `callback` è facoltativo e verrà chiamato nel momento in cui questo chunk di dati viene scaricato.

Restituisce `true ` se i dati interi sono stati scaricati con successo nel kernel buffer. Restituisce `false` se tutti o parte dei dati sono stati messi in coda nella memoria utente. `'drain'` verrà emesso quando il buffer è di nuovo libero.

## Class: http.Server<!-- YAML
added: v0.1.17
-->This class inherits from [`net.Server`][] and has the following additional events:

### Event: 'checkContinue'<!-- YAML
added: v0.3.0
-->* `request` {http.IncomingMessage}
* `response` {http.ServerResponse}

Emesso ogni volta che viene ricevuta una richiesta con un HTTP `Expect: 100-continue`. Se questo evento non viene sottoposto al listening, il server risponderà automaticamente con un `100 Continue` appropriato.

Handling this event involves calling [`response.writeContinue()`][] if the client should continue to send the request body, or generating an appropriate HTTP response (e.g. 400 Bad Request) if the client should not continue to send the request body.

Notare che in caso questo evento venga emesso e gestito, l'evento [`'request'`][] non verrà emesso.

### Event: 'checkExpectation'<!-- YAML
added: v5.5.0
-->* `request` {http.IncomingMessage}
* `response` {http.ServerResponse}

Emesso ogni volta che viene ricevuta una richiesta con un'intestazione HTTP `Expect`, in cui il valore non è `100-continue`. Se questo evento non viene sottoposto al listening, il server risponderà automaticamente con un `417 Expectation Failed` appropriato.

Notare che in caso questo evento venga emesso e gestito, l'evento [`'request'`][] non verrà emesso.

### Event: 'clientError'<!-- YAML
added: v0.1.94
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4557
    description: The default action of calling `.destroy()` on the `socket`
                 will no longer take place if there are listeners attached
                 for `clientError`.
  - version: v8.10.0
    pr-url: https://github.com/nodejs/node/pull/17672
    description: The rawPacket is the current buffer that just parsed. Adding
                 this buffer to the error object of clientError event is to make
                 it possible that developers can log the broken packet.
-->* `exception` {Error}
* `socket` {net.Socket}

Se una connessione client emette un evento `'error'`, questo verrà inoltrato qui. Il listener di questo evento è responsabile della chiusura/distruzione del socket sottostante. Ad esempio, si potrebbe desiderare di chiudere il socket con più grazia con una risposta HTTP personalizzata invece di interrompere bruscamente la connessione.

Il comportamento predefinito è quello di chiudere il socket con una risposta HTTP '400 Bad Request' se possibile, altrimenti il ​​socket viene immediatamente distrutto.

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

Quando si verifica l'evento `'clientError'`, non vi è alcun `request` o `response` object, quindi qualsiasi risposta HTTP inviata, comprese intestazioni di risposta e payload, *deve* essere scritta direttamente sul `socket` object. È necessario prestare attenzione per garantire che la risposta sia un messaggio di risposta HTTP correttamente formattato.

`err` è un'istanza di `Error` con due colonne aggiuntive:

+ `bytesParsed`: il numero di byte del pacchetto di richiesta che Node.js potrebbe aver analizzato correttamente tramite il parsing;
+ `rawPacket`: il pacchetto grezzo della richiesta corrente.

### Event: 'close'<!-- YAML
added: v0.1.4
-->Emesso quando il server si chiude.

### Event: 'connect'<!-- YAML
added: v0.7.0
-->* `request` {http.IncomingMessage} Argomenti per la richiesta HTTP, così come è nell'evento [`'request'`][]
* `socket` {net.Socket} Socket di rete tra server e client
* `head` {Buffer} Il primo pacchetto del tunneling stream (potrebbe essere vuoto)

Emesso ogni volta che un client richiede un metodo HTTP `CONNECT`. Se questo evento non viene sottoposto al listening, le connessioni dei client che richiedono un metodo `CONNECT` verranno interrotte.

Dopo l'emissione di questo evento, il socket della richiesta non avrà un listener di eventi `'data'`, il che significa che dovrà essere sottoposto al binding per gestire i dati inviati al server su quel socket.

### Event: 'connection'<!-- YAML
added: v0.1.0
-->* `socket` {net.Socket}

Questo evento viene emesso quando viene stabilito un nuovo stream TCP. `socket` è in genere un object di tipo [`net.Socket`][]. Di solito gli utenti non vogliono accedere a questo evento. In particolare, il socket non emetterà eventi `'readable'` a causa del modo in cui il parser del protocollo si collega al socket. Si può accedere al `socket` anche su `request.connection`.

*Note*: This event can also be explicitly emitted by users to inject connections into the HTTP server. In quel caso, qualsiasi stream [`Duplex`][] può essere passato.

### Event: 'request'<!-- YAML
added: v0.1.0
-->* `request` {http.IncomingMessage}
* `response` {http.ServerResponse}

Emesso ogni volta che è presente una richiesta. Da notare che potrebbero esserci più richieste per connessione (nel caso di connessioni HTTP Keep-Alive).

### Event: 'upgrade'<!-- YAML
added: v0.1.94
-->* `request` {http.IncomingMessage} Argomenti per la richiesta HTTP, così come è nell'evento [`'request'`][]
* `socket` {net.Socket} Socket di rete tra server e client
* `head` {Buffer} Il primo pacchetto dello stream aggiornato (potrebbe essere vuoto)

Emesso ogni volta che un client richiede un aggiornamento HTTP. If this event is not listened for, then clients requesting an upgrade will have their connections closed.

Dopo l'emissione di questo evento, il socket della richiesta non avrà un listener di eventi `'data'`, il che significa che dovrà essere sottoposto al binding per gestire i dati inviati al server su quel socket.

### server.close([callback])<!-- YAML
added: v0.1.90
-->* `callback` {Function}

Impedisce al server di accettare nuove connessioni. Vedi [`net.Server.close()`][].

### server.listen()

Avvia il server HTTP sottoposto al listening delle connessioni. Questo metodo è identico a [`server.listen()`][] da [`net.Server`][].

### server.listening<!-- YAML
added: v5.7.0
-->* {boolean}

A Boolean indicating whether or not the server is listening for connections.

### server.maxHeadersCount<!-- YAML
added: v0.7.0
-->* {number} **Default:** `2000`

Limita il numero massimo di intestazioni in entrata. If set to 0 - no limit will be applied.

### server.headersTimeout<!-- YAML
added: v8.14.0
-->* {number} **Default:** `40000`

Limit the amount of time the parser will wait to receive the complete HTTP headers.

In case of inactivity, the rules defined in \[server.timeout\]\[\] apply. However, that inactivity based timeout would still allow the connection to be kept open if the headers are being sent very slowly (by default, up to a byte per 2 minutes). In order to prevent this, whenever header data arrives an additional check is made that more than `server.headersTimeout` milliseconds has not passed since the connection was established. If the check fails, a `'timeout'` event is emitted on the server object, and (by default) the socket is destroyed. See \[server.timeout\]\[\] for more information on how timeout behaviour can be customised.

### server.setTimeout(\[msecs\]\[, callback\])<!-- YAML
added: v0.9.12
-->* `msecs` {number} **Default:** `120000` (2 minuti)
* `callback` {Function}

Imposta il valore di timeout per i socket ed emette un evento `'timeout'` sull'object Server, passando il socket come argomento, se si verifica un timeout.

Se esiste un listener di eventi `'timeout'` sull'object Server, allora questo verrà chiamato con il socket scaduto come argomento.

Per impostazione predefinita, il valore di timeout del Server è 2 minuti e i socket vengono distrutti automaticamente in caso di timeout. Tuttavia, se una funzione callback è assegnata all'evento di `'timeout'` del Server, i timeout devono essere gestiti in modo esplicito.

Returns `server`.

### server.timeout<!-- YAML
added: v0.9.12
-->* {number} Timeout in millisecondi. **Default:** `120000` (2 minuti).

Il tempo di inattività in millisecondi prima di presupporre che il socket è scaduto.

Un valore pari a `0` disabiliterà il comportamento di timeout sulle connessioni in entrata.

*Note*: The socket timeout logic is set up on connection, so changing this value only affects new connections to the server, not any existing connections.

### server.keepAliveTimeout<!-- YAML
added: v8.0.0
-->* {number} Timeout in millisecondi. **Default:** `5000` (5 secondi).

Il numero di millisecondi di inattività che un server deve attendere per l'entrata di ulteriori dati, dopo che ha terminato di scrivere l'ultima risposta, prima che un socket venga distrutto. Se il server riceve nuovi dati prima che il timeout keep-alive venga attivato, verrà ripristinato il timeout di inattività regolare, ovvero [`server.timeout`][].

A value of `0` will disable the keep-alive timeout behavior on incoming connections. A value of `0` makes the http server behave similarly to Node.js versions prior to 8.0.0, which did not have a keep-alive timeout.

*Note*: The socket timeout logic is set up on connection, so changing this value only affects new connections to the server, not any existing connections.

## Class: http.ServerResponse<!-- YAML
added: v0.1.17
-->Questo object viene creato internamente da un server HTTP — non dall'utente. Viene trasmesso all'evento [`'request'`][] come secondo parametro.

La risposta implementa, ma non eredita, l'interfaccia di [Writable Stream](stream.html#stream_class_stream_writable). Questo è un [`EventEmitter`][] con i seguenti eventi:

### Event: 'close'<!-- YAML
added: v0.6.7
-->Indica che la connessione sottostante è stata interrotta prima che [`response.end()`][] venisse chiamato o potesse eseguire il flush.

### Event: 'finish'<!-- YAML
added: v0.3.6
-->Emesso nel momento in cui la risposta è stata inviata. Più specificamente, questo evento viene emesso quando l'ultimo segmento delle intestazioni di risposta ed il corpo sono stati trasferiti al sistema operativo per la trasmissione sulla rete. Ciò non implica che il client abbia ancora ricevuto qualcosa.

Dopo questo evento, nessun altro evento verrà emesso sull'object risposta.

### response.addTrailers(headers)<!-- YAML
added: v0.3.0
-->* `headers` {Object}

Questo metodo aggiunge le intestazioni finali HTTP (un'intestazione ma alla fine del messaggio) alla risposta.

I trailer verranno emessi **esclusivamente** se per la risposta viene utilizzata la codifica chunked; se non lo è (ad esempio se la richiesta era HTTP/1.0), verranno scartati automaticamente.

Da notare che HTTP richiede l'invio dell'intestazione `Trailer` per emettere i trailer, con un elenco dei campi dell'intestazione nel suo valore. Ad esempio,

```js
response.writeHead(200, { 'Content-Type': 'text/plain',
                          'Trailer': 'Content-MD5' });
response.write(fileData);
response.addTrailers({ 'Content-MD5': '7895bf4b8828b55ceaf47747b4bca667' });
response.end();
```

Se si tenta di impostare un nome o un valore di campo dell'intestazione che contiene caratteri non validi, verrà generato un [`TypeError`][].


### response.connection<!-- YAML
added: v0.3.0
-->* {net.Socket}

Vedi [`response.socket`][].

### response.end(\[data\]\[, encoding\][, callback])<!-- YAML
added: v0.1.90
-->* `data` {string|Buffer}
* `encoding` {string}
* `callback` {Function}

Questo metodo segnala al server che sono state inviate tutte le intestazioni e il corpo della risposta; quel server dovrebbe considerare questo messaggio completo. Il metodo, `response.end()`, DEVE essere chiamato su ogni risposta.

Se `data` è specificato, è equivalente alla chiamata di [`response.write(data, encoding)`][] seguito da `response.end(callback)`.

Se `callback` viene specificato, verrà chiamato al termine dello stream della risposta.

### response.finished<!-- YAML
added: v0.0.2
-->* {boolean}

Valore booleano che indica se la risposta è stata completata. Inizia come `false`. Dopo che [`response.end()`][] viene eseguito, il valore sarà `true`.

### response.getHeader(name)<!-- YAML
added: v0.4.0
-->* `name` {string}
* Restituisce: {string}

Legge un'intestazione che è già stata accodata ma non inviata al client. Notare che il nome è case insensitive.

Esempio:

```js
const contentType = response.getHeader('content-type');
```

### response.getHeaderNames()<!-- YAML
added: v7.7.0
-->* Restituisce: {Array}

Restituisce un array contenente i nomi univoci delle intestazioni correnti in uscita. Tutti i nomi di intestazione sono in minuscolo.

Esempio:

```js
response.setHeader('Foo', 'bar');
response.setHeader('Set-Cookie', ['foo=bar', 'bar=baz']);

const headerNames = response.getHeaderNames();
// headerNames === ['foo', 'set-cookie']
```

### response.getHeaders()<!-- YAML
added: v7.7.0
-->* Restituisce: {Object}

Restituisce una copia superficiale delle intestazioni correnti in uscita. Poiché viene utilizzata una copia superficiale, i valori dell'array possono essere mutati senza ulteriori chiamate a vari metodi del modulo http correlati all'intestazione. Le chiavi dell'object restituito sono i nomi delle intestazioni e i valori sono i rispettivi valori di intestazione. Tutti i nomi di intestazione sono in minuscolo.

*Note*: The object returned by the `response.getHeaders()` method _does not_ prototypically inherit from the JavaScript `Object`. Ciò significa che i tipici metodi `Object` come `obj.toString()`, `obj.hasOwnProperty()` e altri non vengono definiti e *non funzioneranno*.

Esempio:

```js
response.setHeader('Foo', 'bar');
response.setHeader('Set-Cookie', ['foo=bar', 'bar=baz']);

const headers = response.getHeaders();
// headers === { foo: 'bar', 'set-cookie': ['foo=bar', 'bar=baz'] }
```

### response.hasHeader(name)
<!-- YAML
added: v7.7.0
-->

* `name` {string}
* Restituisce: {boolean}

Restituisce `true` se l'intestazione identificata dal `name` è attualmente impostata nelle intestazioni in uscita. Notare che la corrispondenza del nome dell'intestazione è case-insensitive.

Esempio:

```js
const hasContentType = response.hasHeader('content-type');
```

### response.headersSent<!-- YAML
added: v0.9.3
-->* {boolean}

Boolean (sola lettura). True se le intestazioni sono state inviate, altrimenti false.

### response.removeHeader(name)<!-- YAML
added: v0.4.0
-->* `name` {string}

Rimuove un'intestazione che è in coda per l'invio implicito.

Esempio:

```js
response.removeHeader('Content-Encoding');
```

### response.sendDate<!-- YAML
added: v0.7.5
-->* {boolean}

Quando è true, l'intestazione Data verrà generata automaticamente e inviata nella risposta se non è già presente nelle intestazioni. Il valore predefinito è true.

Questo dovrebbe essere disabilitato solo per i test; HTTP richiede l'intestazione Data nelle risposte.

### response.setHeader(name, value)
<!-- YAML
added: v0.4.0
-->

* `name` {string}
* `value` {string | string[]}

Imposta un singolo valore di intestazione per intestazioni implicite. Se questa intestazione esiste già nelle intestazioni da inviare, il suo valore sarà sostituito. Utilizza un array di stringhe per inviare più intestazioni con lo stesso nome.

Esempio:

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
// restituisce content-type = text/plain
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

### response.setTimeout(msecs[, callback])<!-- YAML
added: v0.9.12
-->* `msecs` {number}
* `callback` {Function}

Imposta il valore di timeout del Socket su `msecs`. Se viene fornito un callback, viene aggiunto come listener sull'evento `'timeout'` sull'object della risposta.

Se non viene aggiunto nessun listener `'timeout'` né alla richiesta, né alla risposta e neppure al server, allora i socket vengono distrutti nel momento in cui scadono. Se viene assegnato un handler agli eventi `timeout` della richiesta, della risposta o del server, i socket scaduti devono essere gestiti esplicitamente.

Returns `response`.

### response.socket<!-- YAML
added: v0.3.0
-->* {net.Socket}

Riferimento al socket sottostante. Di solito gli utenti non vogliono accedere a questa proprietà. In particolare, il socket non emetterà eventi `'readable'` a causa del modo in cui il parser del protocollo si collega al socket. Dopo `response.end()`, la proprietà viene annullata. Si può accedere al `socket` anche tramite `response.connection`.

Esempio:

```js
const http = require('http');
const server = http.createServer((req, res) => {
  const ip = res.socket.remoteAddress;
  const port = res.socket.remotePort;
  res.end(`Your IP address is ${ip} and your source port is ${port}.`);
}).listen(3000);
```

### response.statusCode<!-- YAML
added: v0.4.0
-->* {number}

Quando si utilizzano intestazioni implicite (senza chiamare [`response.writeHead()`][] esplicitamente), questa proprietà controlla il codice di stato che verrà inviato al client nel momento in cui le intestazioni vengono scaricate.

Esempio:

```js
response.statusCode = 404;
```

Dopo che l'intestazione di risposta è stata inviata al client, questa proprietà indica il codice di stato che è stato inviato.

### response.statusMessage<!-- YAML
added: v0.11.8
-->* {string}

When using implicit headers (not calling [`response.writeHead()`][] explicitly), this property controls the status message that will be sent to the client when the headers get flushed. If this is left as `undefined` then the standard message for the status code will be used.

Esempio:

```js
response.statusMessage = 'Not found';
```

Dopo che l'intestazione di risposta è stata inviata al client, questa proprietà indica il messaggio di stato che è stato inviato.

### response.write(chunk\[, encoding\]\[, callback\])<!-- YAML
added: v0.1.29
-->* `chunk` {string|Buffer}
* `encoding` {string} **Default:** `'utf8'`
* `callback` {Function}
* Restituisce: {boolean}

Se questo metodo viene chiamato e [`response.writeHead()`][] non è stato chiamato, passerà alla modalità dell'intestazione implicita e scaricherà le intestazioni implicite.

Questo invia un chunk del corpo della risposta. Questo metodo può essere chiamato più volte per fornire parti successive del corpo.

Da notare che nel modulo `http`, il corpo della risposta viene omesso quando la richiesta è una richiesta HEAD. Allo stesso modo, le risposte `204` e `304` _non devono_ includere un corpo del messaggio.

Il `chunk` può essere una stringa o un buffer. Se `chunk` è una stringa, il secondo parametro specifica come codificarlo in uno stream di byte. Un `callback` verrà chiamato quando questo chunk di dati viene scaricato.

*Note*: This is the raw HTTP body and has nothing to do with higher-level multi-part body encodings that may be used.

La prima volta che [`response.write()`][] viene chiamato, invierà le informazioni dell'intestazione bufferizzate ed il primo chunk del corpo al client. La seconda volta in cui [`response.write()`][] viene chiamato, Node.js presuppone che verrà eseguito lo streaming dei dati, quindi invia i nuovi dati separatamente. Vale a dire, la risposta viene bufferizzata fino al primo chunk del corpo.

Restituisce `true ` se i dati interi sono stati scaricati con successo nel kernel buffer. Restituisce `false` se tutti o parte dei dati sono stati messi in coda nella memoria utente. `'drain'` verrà emesso quando il buffer è di nuovo libero.

### response.writeContinue()<!-- YAML
added: v0.3.0
-->Invia un messaggio HTTP/1.1 100 Continue al client, segnalando che il corpo della richiesta deve essere inviato. See the [`'checkContinue'`][] event on `Server`.

### response.writeHead(statusCode\[, statusMessage\]\[, headers\])<!-- YAML
added: v0.1.30
changes:
  - version: v5.11.0, v4.4.5
    pr-url: https://github.com/nodejs/node/pull/6291
    description: A `RangeError` is thrown if `statusCode` is not a number in
                 the range `[100, 999]`.
-->* `statusCode` {number}
* `statusMessage` {string}
* `headers` {Object}

Invia un'intestazione di risposta alla richiesta. Lo status code è un codice di stato HTTP a 3 cifre, come `404`. L'ultimo argomento, `headers`, è composto dalle intestazioni di risposta. In opzione è possibile fornire uno `statusMessage` in forma leggibile come secondo argomento.

Esempio:

```js
const body = 'hello world';
response.writeHead(200, {
  'Content-Length': Buffer.byteLength(body),
  'Content-Type': 'text/plain' });
```

Questo metodo deve essere chiamato su un messaggio solo una volta e deve essere chiamato prima che [`response.end()`][] venga chiamato.

Se [`response.write()`][] o [`response.end()`][] vengono chiamati prima della sua chiamata, verranno calcolate le intestazioni implicite/variabili e verrà chiamata questa funzione.

When headers have been set with [`response.setHeader()`][], they will be merged with any headers passed to [`response.writeHead()`][], with the headers passed to [`response.writeHead()`][] given precedence.

```js
// restituisce content-type = text/plain
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

Notare che il Content-Length è fornito in byte, non in caratteri. L'esempio precedente funziona perché la stringa `'hello world'` contiene esclusivamente caratteri a byte singolo. Se il corpo contiene caratteri di codifica superiori, allora si dovrebbe utilizzare `Buffer.byteLength()` per determinare il numero di byte in una specifica codifica. Nemmeno Node.js controlla se Content-Length e la lunghezza del corpo che è stata trasmessa siano uguali o meno.

Se si tenta di impostare un nome o un valore di campo dell'intestazione che contiene caratteri non validi, verrà generato un [`TypeError`][].

## Class: http.IncomingMessage<!-- YAML
added: v0.1.17
-->Un `IncomingMessage` object viene creato da [`http.Server`][] o [`http.ClientRequest`][] e trasferito come primo argomento rispettivamente all'evento [`'request'`][] e all'evento [`'response'`][]. It may be used to access response status, headers and data.

Implementa l'interfaccia [Readable Stream](stream.html#stream_class_stream_readable), come pure i seguenti eventi, metodi e proprietà aggiuntivi.

### Event: 'aborted'<!-- YAML
added: v0.3.8
-->Emesso quando la richiesta è stata interrotta.

### Event: 'close'<!-- YAML
added: v0.4.2
-->Indica che la connessione sottostante è stata chiusa. Proprio come `'end'`, questo evento si verifica una sola volta per ogni risposta.

### message.aborted<!-- YAML
added: v8.13.0
-->* {boolean}

La proprietà `message.aborted` sarà `true` se la richiesta è stata interrotta.

### message.complete<!-- YAML
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

### message.destroy([error])<!-- YAML
added: v0.3.0
-->* `error` {Error}

Chiama `destroy()` sul socket che ha ricevuto l'`IncomingMessage`. Se è previsto `error`, un evento `'error'` viene emesso ed `error` viene trasferito come argomento ad ogni listener dell'evento.

### message.headers<!-- YAML
added: v0.1.5
-->* {Object}

L'object delle intestazioni di richiesta/risposta.

Coppie di key-value di nomi e valori di intestazione. I nomi di intestazione sono in minuscolo. Esempio:

```js
// Stampa qualcosa tipo:
//
// { 'user-agent': 'curl/7.22.0',
//   host: '127.0.0.1:8000',
//   accept: '*/*' }
console.log(request.headers);
```

I duplicati nelle intestazioni grezze vengono gestiti nei modi seguenti, a seconda del nome dell'intestazione:

* I duplicati di `age`, `authorization`, `content-length`, `content-type`, `etag`, `expires`, `from`, `host`, `if-modified-since`, `if-unmodified-since`, `last-modified`, `location`, `max-forwards`, `proxy-authorization`, `referer`, `retry-after`, o `user-agent` vengono scartati.
* `set-cookie` è sempre un array. I duplicati vengono aggiunti all'array.
* Per tutte le altre intestazioni, i valori vengono uniti con ', '.

### message.httpVersion<!-- YAML
added: v0.1.1
-->* {string}

In caso di richiesta del server, la versione HTTP inviata dal client. Nel caso di una risposta del client, la versione HTTP del server connesso. Probabilmente o `'1.1'` o `'1.0'`.

Inoltre `message.httpVersionMajor` è il primo integrale e `message.httpVersionMinor` è il secondo.

### message.method<!-- YAML
added: v0.1.1
-->* {string}

**Valido esclusivamente per richieste ottenute da [`http.Server`][].**

Il metodo di richiesta sotto forma di stringa. Solo lettura. Esempio: `'GET'`, `'DELETE'`.

### message.rawHeaders<!-- YAML
added: v0.11.6
-->* {Array}

L'elenco delle intestazioni di richiesta/risposta grezze esattamente come sono state ricevute.

Da notare che le chiavi ed i valori si trovano nello stesso elenco. *Non* è un elenco di tuple. Pertanto, gli offset pari sono valori di chiave e gli offset dispari sono i valori associati.

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

### message.rawTrailers<!-- YAML
added: v0.11.6
-->* {Array}

Le chiavi ed i valori del trailer di richiesta/risposta raw, esattamente come sono stati ricevuti. Compilati esclusivamente nell'evento `'end'`.

### message.setTimeout(msecs, callback)<!-- YAML
added: v0.5.9
-->* `msecs` {number}
* `callback` {Function}

Chiama `message.connection.setTimeout(msecs, callback)`.

Returns `message`.

### message.socket<!-- YAML
added: v0.3.0
-->* {net.Socket}

L'object [`net.Socket`][] associato alla connessione.

Con il supporto HTTPS, utilizza [`request.socket.getPeerCertificate()`][] per ottenere i dettagli dell'autenticazione del client.

### message.statusCode<!-- YAML
added: v0.1.1
-->* {number}

**Valido esclusivamente per risposte ottenute da [`http.ClientRequest`][].**

Il codice di stato a 3 cifre della risposta di HTTP. Per Esempio `404`.

### message.statusMessage<!-- YAML
added: v0.11.10
-->* {string}

**Valido esclusivamente per risposte ottenute da [`http.ClientRequest`][].**

Il messaggio di stato della risposta di HTTP (reason phrase). E.G. `OK` or `Internal Server Error`.

### message.trailers<!-- YAML
added: v0.3.0
-->* {Object}

L'object dei trailer di richiesta/risposta. Compilati esclusivamente nell'evento `'end'`.

### message.url<!-- YAML
added: v0.1.90
-->* {string}

**Valido esclusivamente per richieste ottenute da [`http.Server`][].**

Stringa URL della richiesta. Contiene esclusivamente l'URL che è presente nella richiesta HTTP effettiva. Se la richiesta è:

```txt
GET /status?name=ryan HTTP/1.1\r\n
Accept: text/plain\r\n
\r\n
```

Allora `request.url` sarà:
```js
'/status?name=ryan'
```

Per analizzare l'url nelle sue parti si può utilizzare `require('url').parse(request.url)`. Esempio:

```txt
$ node
> require('url').parse('/status?name=ryan')
Url {
  protocol: null,
  slashes: null,
  auth: null,
  host: null,
  port: null,
  hostname: null,
  hash: null,
  search: '?name=ryan',
  query: 'name=ryan',
  pathname: '/status',
  path: '/status?name=ryan',
  href: '/status?name=ryan' }
```

Per estrarre i parametri dalla stringa della query, può essere utilizzata la funzione `require('querystring').parse`, o si può trasferire `true` come secondo argomento a `require('url').parse`. Esempio:

```txt
$ node
> require('url').parse('/status?name=ryan', true)
Url {
  protocol: null,
  slashes: null,
  auth: null,
  host: null,
  port: null,
  hostname: null,
  hash: null,
  search: '?name=ryan',
  query: { name: 'ryan' },
  pathname: '/status',
  path: '/status?name=ryan',
  href: '/status?name=ryan' }
```

## http.METHODS<!-- YAML
added: v0.11.8
-->* {Array}

Un elenco dei metodi HTTP supportati dal parser.

## http.STATUS_CODES<!-- YAML
added: v0.1.22
-->* {Object}

Una raccolta di tutti gli status code standard delle risposte HTTP e la breve descrizione di ciascuno. Per esempio, `http.STATUS_CODES[404] === 'Not
Found'`.

## http.createServer([requestListener])<!-- YAML
added: v0.1.13
-->- `requestListener` {Function}

* Restituisce: {http.Server}

Restituisce una nuova istanza di [`http.Server`][].

La `requestListener` è una funzione che viene automaticamente aggiunta all'evento [`'request'`][].

## http.get(options[, callback])<!-- YAML
added: v0.3.6
changes:
  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->* `options` {Object | string | URL} Accetta la stessa `options` di [`http.request()`][], con il `method` sempre impostato su `GET`. Le proprietà ereditate dal prototipo vengono ignorate.
* `callback` {Function}
* Restituisce: {http.ClientRequest}

Poiché la maggior parte delle richieste sono richieste GET senza corpi, Node.js fornisce questo metodo di convenienza. L'unica differenza tra questo metodo e [`http.request()`][] è che imposta il metodo su GET e chiama `req.end()` automaticamente. Da notare che il callback deve fare attenzione a consumare i dati di risposta per le ragioni descritte nella sezione [`http.ClientRequest`][].

Il `callback` viene invocato con un singolo argomento che è un'istanza di [`http.IncomingMessage`][]

Esempio di recupero JSON:

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
    // consuma dati della risposta per liberare memoria
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

## http.globalAgent<!-- YAML
added: v0.5.9
-->* {http.Agent}

Istanza globale dell'`Agent` che viene utilizzata di default per tutte le richieste HTTP del client.

## http.maxHeaderSize<!-- YAML
added: v8.15.0
-->* {number}

Read-only property specifying the maximum allowed size of HTTP headers in bytes. Defaults to 8KB. Configurable using the [`--max-http-header-size`][] CLI option.

## http.request(options[, callback])
<!-- YAML
added: v0.3.6
changes:
  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->

* `options` {Object | string | URL}
  * `protocol` {string} Il protocollo da utilizzare. **Default:** `http:`.
  * `host` {string} Un nome di dominio o un indirizzo IP del server a cui inviare la richiesta. **Default:** `localhost`.
  * `hostname` {string} L'alias di `host`. Per supportare [`url.parse()`][], `hostname` viene preferito a `host`.
  * `family` {number} La famiglia di indirizzi IP da utilizzare per risolvere l'`host` e l'`hostname`. I valori validi sono `4` o `6`. Quando non viene specificato, verranno utilizzati sia IP v4 che v6.
  * `port` {number} La porta del server remoto. **Default:** `80`.
  * `localAddress` {string} L' interfaccia locale per eseguire il binding per le connessioni di rete.
  * `socketPath` {string} Unix Domain Socket (use one of host:port or socketPath).
  * `method` {string} Una stringa che specifica il metodo di richiesta HTTP. **Default:** `'GET'`.
  * `path` {string} Il percorso della richiesta. Dovrebbe includere la stringa di query, se presente. Ad Esempio `'/index.html?page=12'`. Quando il percorso della richiesta contiene caratteri non validi, viene generata un'eccezione. Attualmente, non vengono accettati esclusivamente gli spazi ma ciò potrebbe cambiare in futuro. **Default:** `'/'`.
  * `headers` {Object} Un object che contiene le intestazioni di richiesta.
  * `auth` {string} L'autenticazione di base, ovvero la `'user:password'` per calcolare un'intestazione di Authorization.
  * `agent` {http.Agent | boolean} Controls [`Agent`][] behavior. Possible values:
   * `undefined` (di default): utilizzo di [`http.globalAgent`][] per questo host e questa porta.
   * `Agent` object: utilizzo esplicito di ciò che è stato trasferito su `Agent`.
   * `false`: determina l'utilizzo di un nuovo `Agent` con i valori predefiniti.
  * `createConnection` {Function} Una funzione che produce un socket/stream da utilizzare per la richiesta quando non viene utilizzata l'opzione `agent`. Ciò può essere utilizzato per evitare la creazione di una classe personalizzata di `Agent` esclusivamente per sovrascrivere la funzione predefinita `createConnection`. Vedi [`agent.createConnection()`][] per ulteriori dettagli. Qualsiasi stream di [`Duplex`][] è un valore di ritorno valido.
  * `timeout` {number}: Un numero che specifica il timeout del socket in millisecondi. Imposterà il timeout prima che il socket venga connesso.
* `callback` {Function}
* Restituisce: {http.ClientRequest}

Node.js mantiene diverse connessioni per server per effettuare richieste HTTP. Questa funzione consente di inviare in modo trasparente le richieste.

`options` può essere un object, una stringa, o un [`URL`][] object. Se `options` è una stringa, viene analizzata automaticamente con [`url.parse()`][]. Se è un [`URL`][] object, verrà automaticamente convertito in un object `options` ordinario.

Il parametro `callback` facoltativo verrà aggiunto come listener una tantum per l'evento [`'response'`][].

`http.request()` restituisce un'istanza della classe [`http.ClientRequest`][]. L'istanza `ClientRequest` è un writable stream. Se si ha necessità di caricare un file con una richiesta POST, scrivere all'object `ClientRequest`.

Esempio:

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

// scrivi i dati al corpo della richiesta
req.write(postData);
req.end();
```

Da notare che nell'esempio è stato chiamato `req.end()`. Con `http.request()` si deve sempre chiamare `req.end()` per indicare la fine della richiesta - anche se non sono presenti dati scritti al corpo della richiesta.

Se si è verificato un qualunque errore durante la richiesta (che sia una risoluzione DNS, errori di livello TCP o errori di analisi su HTTP effettivi) viene emesso un evento `'error'` sull'object della richiesta di ritorno. Come con tutti gli eventi `'error'`, se non ci sono listener registrati, verrà generato l'errore.

Ci sono alcune intestazioni speciali che dovrebbero essere considerate.

* L'invio di un 'Connection: keep-alive' notificherà a Node.js che la connessione al server dovrebbe essere mantenuta fino alla richiesta successiva.

* L'invio di un'intestazione 'Content-Length' disabiliterà la codifica chunked predefinita.

* L'invio di un'intestazione 'Expect' invierà immediatamente le intestazioni di richiesta. Usually, when sending 'Expect: 100-continue', both a timeout and a listener for the `continue` event should be set. Vedi la Sezione RFC2616 8.2.3 per ulteriori informazioni.

* L'invio di un'intestazione Authorization eseguirà l'override sull'utilizzo dell'opzione `auth` per calcolare l'autenticazione di base.

Esempio di utilizzo di un [`URL`][] come `options`:

```js
const { URL } = require('url');

const options = new URL('http://abc:xyz@example.com');

const req = http.request(options, (res) => {
  // ...
});
```

In una richiesta avvenuta con successo, i seguenti eventi verranno emessi nell'ordine qui di seguito:

* `socket`
* `response`
  * `data` any number of times, on the `res` object (`data` will not be emitted at all if the response body is empty, for instance, in most redirects)
  * `end` on the `res` object
* `close`

Nel caso di un errore di connessione, verranno emessi i seguenti eventi:

* `socket`
* `error`
* `close`

Se viene chiamato `req.abort()` prima che la connessione sia avvenuta con successo, i seguenti eventi verranno emessi nell'ordine qui di seguito:

* `socket`
* (`req.abort()` chiamato qui)
* `abort`
* `close`
* `error` with an error with message `Error: socket hang up` and code `ECONNRESET`

Se viene chiamato `req.abort()` dopo la ricezione della risposta, i seguenti eventi verranno emessi nell'ordine qui di seguito:

* `socket`
* `response`
  * `data` any number of times, on the `res` object
* (`req.abort()` chiamato qui)
* `abort`
* `close`
  * `aborted` on the `res` object
  * `end` on the `res` object
  * `close` on the `res` object

Note that setting the `timeout` option or using the `setTimeout` function will not abort the request or do anything besides add a `timeout` event.
