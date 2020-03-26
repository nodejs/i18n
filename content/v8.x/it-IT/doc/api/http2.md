# HTTP/2
<!-- YAML
added: v8.4.0
changes:
  - version: v8.13.0
    pr-url: https://github.com/nodejs/node/pull/22466
    description: HTTP/2 is now Stable. Previously, it had been Experimental.
-->
<!--introduced_in=v8.4.0-->

> Stabilità: 2 - Stable

Il modulo `http2` fornisce un'implementazione del protocollo [HTTP/2](https://tools.ietf.org/html/rfc7540). Ci si può accedere utilizzando:

```js
const http2 = richiede('http2');
```

## Core API

L'API Core fornisce un'interfaccia di basso livello progettata specificatamente intorno al supporto per funzionalità del protocollo HTTP/2. È specificatamente *non* progettata per compatibilità con l'esistente API del modulo [HTTP/1](http.html). Tuttavia, l'[API di Compatibilità](#http2_compatibility_api) lo è.

Il Core API di `http2` è molto più simmetrico tra client e server rispetto all'API `http`. For instance, most events, like `error`, `connect` and `stream`, can be emitted either by client-side code or server-side code.

### Esempio sul lato server

Quanto segue illustra un semplice server HTTP/2 che utilizza l'API Core. Poiché non ci sono browser conosciuti che supportino [HTTP/2 non crittografato](https://http2.github.io/faq/#does-http2-require-encryption), l'uso di [`http2.createSecureServer()`] [] è necessario durante la comunicazione con i client browser.

```js
const http2 = require('http2');
const fs = require('fs');

const server = http2.createSecureServer({
  key: fs.readFileSync('localhost-privkey.pem'),
  cert: fs.readFileSync('localhost-cert.pem')
});
server.on('error', (err) => console.error(err));

server.on('stream', (stream, headers) => {
  // Lo stream è un "Duplex"
  stream.respond({
    'content-type': 'text/html',
    ':status': 200
  });
  stream.end('<h1>Hello World</h1>');
});

server.listen(8443);
```

Per generare il certificato e la chiave per questo esempio, eseguire:

```bash
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' \
  -keyout localhost-privkey.pem -out localhost-cert.pem
```

### Esempio sul lato client

Di seguito viene illustrato un client HTTP/2:

```js
const http2 = require('http2');
const fs = require('fs');
const client = http2.connect('https://localhost:8443', {
  ca: fs.readFileSync('localhost-cert.pem')
});
client.on('error', (err) => console.error(err));

const req = client.request({ ':path': '/' });

req.on('response', (headers, flags) => {
  for (const name in headers) {
    console.log(`${name}: ${headers[name]}`);
  }
});

req.setEncoding('utf8');
let data = '';
req.on('data', (chunk) => { data += chunk; });
req.on('end', () => {
  console.log(`\n${data}`);
  client.close();
});
req.end();
```

### Corso: Http2Session
<!-- YAML
added: v8.4.0
-->

* Estendendo: {EventEmitter}

Le istanze della classe `http2.Http2Session` rappresentano una sessione attiva di comunicazione tra un client HTTP/2 e un server. Le istanze di questa classe *non* sono progettate per essere costruite direttamente dal codice utente.

Ogni istanza `Http2Session` mostrerà comportamenti leggermente diversi a seconda che stia operando come server o come client. La proprietà di `http2session.type` può essere utilizzata per determinare la modalità in cui una `Http2Session` è in funzione. Sul lato server, il codice utente dovrebbe raramente avere l'occasione di lavorare direttamente con l'oggetto `Http2Session`, dato che la maggior parte delle azioni sono generalmente effettuate tramite interazioni con oggetti `Http2Server` o `Http2Stream`.

User code will not create `Http2Session` instances directly. Server-side `Http2Session` instances are created by the `Http2Server` instance when a new HTTP/2 connection is received. Client-side `Http2Session` instances are created using the `http2.connect()` method.

#### Http2Session ed i Socket

Ogni istanza `Http2Session` è associata esattamente ad una [`net.Socket`] [] o [`tls.TLSSocket`] [] quando viene creata. Quando o il `Socket` o la `Http2Session` vengono distrutti, entrambi verranno distrutti.

Visti i requisiti di serializzazione e di elaborazione specifici imposti dal protocollo HTTP/2, non è consigliato per il codice utente di leggere dati da o scrivere dati su un'istanza `Socket` associata a `Http2Session`. Facendo così si può mettere la sessione HTTP/2 in uno stato indeterminato, rendendo così inutilizzabili la sessione e il socket.

Una volta che un `Socket` è stato associato ad `"Http2Session"`, il codice utente deve fare affidamento esclusivamente sull'API di `Http2Session`.

#### Evento: 'close'
<!-- YAML
added: v8.4.0
-->

L'evento `'close'` viene emesso quando la `Http2Session` è stata distrutta. Il suo listener non si aspetta alcun argomento.

#### Evento: 'connect'
<!-- YAML
added: v8.4.0
-->

* `session` {Http2Session}
* `socket` {net.Socket}

L'evento `'connect'` viene emesso quando la `Http2Session` è stata correttamente collegata al peer remoto e può iniziare la comunicazione.

*Note*: User code will typically not listen for this event directly.

#### Evento: 'error'
<!-- YAML
added: v8.4.0
-->

* `error` {Error}

L'evento `'error'` viene emesso quando si verifica un errore durante l'elaborazione di una `Http2Session`.

#### Evento: 'frameError'
<!-- YAML
added: v8.4.0
-->

* `type` {integer} Il tipo di frame.
* `code` {integer} Il codice errore.
* `id` {integer} L'id dello stream (o `0` se il frame non è associato ad uno stream).

L'evento `'frameError'` viene emesso quando si verifica un errore durante il tentativo di inviare un frame sulla sessione. Se il frame che non è stato possibile inviare è associato ad uno specifico `Http2Stream`, viene eseguito un tentativo di emettere un evento `'frameError'` sul `Http2Stream`.

Se l'evento `'frameError'` è associato a uno stream, lo stream verrà rimosso e distrutto immediatamente dopo l'evento `'frameError'`. Se l'evento non è associato a uno stream, `Http2Session` verrà arrestato immediatamente dopo l'evento `'frameError'`.

#### Evento: 'goaway'
<!-- YAML
added: v8.4.0
-->

* `errorCode` {number} Il codice di errore HTTP/2 specificato nel frame `GOAWAY`.
* `lastStreamID` {number} L'ID dell'ultimo stream che il peer remoto ha elaborato correttamente (o `0` se non è specificato alcun ID).
* `opaqueData` {Buffer} Se sono stati inclusi ulteriori dati opachi nel frame `GOAWAY`, verrà passata un'istanza `Buffer` contenente tali dati.

L'evento `'goaway'` viene emesso quando viene ricevuto un frame `GOAWAY`.

L'istanza `Http2Session` verrà arrestata automaticamente quando viene emesso l'evento `'goaway'`.

#### Evento: 'localSettings'
<!-- YAML
added: v8.4.0
-->

* `settings` {HTTP/2 Settings Object} Una copia del frame `SETTINGS` ricevuto.

L'evento `'localSettings'` viene emesso quando è stato ricevuto un frame di conferma `SETTINGS`.

*Note*: When using `http2session.settings()` to submit new settings, the modified settings do not take effect until the `'localSettings'` event is emitted.

```js
session.settings({ enablePush: false });

session.on('localSettings', (settings) => {
  /** use the new settings **/
});
```

#### Event: 'ping'
<!-- YAML
added: v8.13.0
-->

* `payload` {Buffer} The `PING` frame 8-byte payload

The `'ping'` event is emitted whenever a `PING` frame is received from the connected peer.

#### Evento: 'remoteSettings'
<!-- YAML
added: v8.4.0
-->

* `settings` {HTTP/2 Settings Object} Una copia del frame `SETTINGS` ricevuto.

L'evento `'remoteSettings'` viene emesso quando viene ricevuto un nuovo frame `SETTINGS` dal peer connesso.

```js
session.on('remoteSettings', (settings) => {
  /** use the new settings **/
});
```

#### Evento: 'stream'
<!-- YAML
added: v8.4.0
-->

* `stream` {Http2Stream} Un riferimento allo stream
* `headers` {HTTP/2 Headers Object} Un oggetto che descrive le intestazioni
* `flags` {number} I flag numerici associati
* `rawHeaders` {Array} Un array contenente i nomi delle intestazioni grezze seguiti dai loro rispettivi valori.

L'evento `'stream'` viene emesso quando viene creato un nuovo `Http2Stream`.

```js
const http2 = require('http2');
session.on('stream', (stream, headers, flags) => {
  const method = headers[':method'];
  const path = headers[':path'];
  // ...
  stream.respond({
    ':status': 200,
    'content-type': 'text/plain'
  });
  stream.write('hello');
  stream.end('world');
});
```

Sul lato server, il codice utente tipicamente non esegue direttamente il listening su questo evento, e dovrebbe invece registrare un handler per l'evento `'stream'` emesso dalle istanze `net.Server` o `tls.Server` restituite da `http2.createServer()` e `http2.createSecureServer()`, rispettivamente, come nell'esempio seguente:

```js
const http2 = require('http2');

// Creare un server HTTP/2 non crittografato
const server = http2.createServer();

server.on('stream', (stream, headers) => {
  stream.respond({
    'content-type': 'text/html',
    ':status': 200
  });
  stream.end('<h1>Hello World</h1>');
});

server.listen(80);
```

#### Event: 'timeout'
<!-- YAML
added: v8.4.0
-->

Dopo che è stato usato il metodo `http2session.setTimeout()` per impostare il periodo di timeout per questa `Http2Session`, l'evento `'timeout'` viene emesso se non c'è attività su `Http2Session` dopo il numero configurato di millisecondi.

```js
session.setTimeout(2000);
session.on('timeout', () => { /** .. **/ });
```

#### http2session.alpnProtocol
<!-- YAML
added: v8.11.2
-->

* Value: {string|undefined}

Il valore sarà `undefined` se la `Http2Session` non è ancora connessa a un socket, `h2c` se la `Http2Session` non è collegata a un `TLSSocket`, o restituirà il valore della proprietà `alpnProtocol` del `TLSSocket` connesso.

#### http2session.close([callback])
<!-- YAML
added: v8.11.2
-->

* `callback` {Function}

Chiude con attenzione la `Http2Session`, consentendo a qualsiasi stream esistente di completarsi da solo e impedendo a nuove istanze `Http2Stream` di essere create. Una volta chiuso, `http2session.destroy()` *potrebbe* essere richiamato se non ci sono istanze `Http2Stream` aperte.

Se specificato, la funzione `callback` è registrata come gestore per l'evento `'close'`.

#### http2session.closed
<!-- YAML
added: v8.11.2
-->

* Value: {boolean}

Sarà `true` se questa istanza `Http2Session` è stata chiusa, altrimenti `false`.

#### http2session.connecting
<!-- YAML
added: v8.11.2
-->

* {boolean}

Sarà `true` se questa istanza `Http2Session` è ancora in connessione, sarà impostata su `false` prima di emettere l'evento `connect` e/o chiamare il callback `http2.connect`.

#### http2session.destroy(\[error,\]\[code\])
<!-- YAML
added: v8.4.0
-->

* `error` {Error} Un `Error` object se la `Http2Session` viene distrutta a causa di un errore.
* `code` {number} Il codice di errore HTTP/2 da inviare nel frame `GOAWAY` finale. Se non specificato, e `error` non è indefinito, il valore predefinito è `INTERNAL_ERROR`, altrimenti il valore predefinito è `NO_ERROR`.
* Restituisce: {undefined}

Termina immediatamente `Http2Session` e il `net.Socket` o `tls.TLSSocket` associati.

Una volta distrutto, `Http2Session` emetterà l'evento `'close'`. If `error` is not undefined, an `'error'` event will be emitted immediately after the `'close'` event.

Se sono rimasti aperti `Http2Streams` associati a `Http2Session`, anche quelli verranno distrutti.

#### http2session.destroyed
<!-- YAML
added: v8.4.0
-->

* Value: {boolean}

Sarà `true` se questa istanza `Http2Session` è stata distrutta e non deve più essere utilizzata, altrimenti `false`.

#### http2session.encrypted
<!-- YAML
added: v8.11.2
-->

* Value: {boolean|undefined}

Il valore è `undefined` se il socket di sessione `Http2Session` non è stato ancora connesso, sarà `true` se la `Http2Session` è connessa a un `TLSSocket` e `false` se la `Http2Session` è collegata a qualsiasi altro tipo di socket o stream.

#### http2session.goaway([code, [lastStreamID, [opaqueData]]])
<!-- YAML
added: v8.11.2
-->

* `code` {number} Un codice d'errore HTTP/2
* `lastStreamID` {number} L'ID numerico dell'ultimo `Http2Stream` elaborato
* `opaqueData` {Buffer|TypedArray|DataView} Un'istanza `TypedArray` o `DataView` contenente dati aggiuntivi da trasportare all'interno del frame `GOAWAY`.

Trasmette un frame `GOAWAY` al peer connesso *senza* spegnere la `Http2Session`.

#### http2session.localSettings
<!-- YAML
added: v8.4.0
-->

* Value: {HTTP/2 Settings Object}

Un oggetto senza prototipo che descrive le attuali impostazioni locali di `Http2Session`. Le impostazioni locali sono locali per *questa* istanza `Http2Session`.

#### http2session.originSet
<!-- YAML
added: v8.11.2
-->

* Value: {string[]|undefined}

If the `Http2Session` is connected to a `TLSSocket`, the `originSet` property will return an Array of origins for which the `Http2Session` may be considered authoritative.

The `originSet` property is only available when using a secure TLS connection.

#### http2session.pendingSettingsAck
<!-- YAML
added: v8.4.0
-->

* Value: {boolean}

Indica se `Http2Session` è attualmente in attesa di un riconoscimento per un frame `SETTINGS` inviato. Sarà `true` dopo aver chiamato il metodo `http2session.settings()`. Sarà `falso` una volta che tutti i frame SETTINGS inviati sono stati riconosciuti.

#### http2session.ping([payload, ]callback)
<!-- YAML
added: v8.9.3
-->

* `payload` {Buffer|TypedArray|DataView} Payload ping facoltativo.
* `callback` {Function}
* Restituisce: {boolean}

Invia un frame `PING` al peer HTTP/2 connesso. È necessario fornire una funzione `callback`. Il metodo restituirà `true` se è stato inviato il `PING`, altrimenti restituirà `false`.

Il numero massimo di ping in sospeso (non riconosciuti) è determinato dall'opzione di configurazione `maxOutstandingPings`. Il massimo di default è 10.

Se fornito, il `payload` deve essere un `Buffer`, `TypedArray` o `DataView` contenenti 8 byte di dati che saranno trasmessi con il `PING` e restituiti con il riconoscimento ping.

Il callback sarà invocato con tre argomenti: un argomento di errore che sarà `null` se il `PING` è stato riconosciuto con successo, un argomento `duration` che riporta il numero di millisecondi trascorsi da quando il ping è stato inviato e quando il riconoscimento è stato ricevuto ed un `Buffer` contenente il `PING` payload di 8 byte.

```js
session.ping(Buffer.from('abcdefgh'), (err, duration, payload) => {
  if (!err) {
    console.log(`Ping acknowledged in ${duration} milliseconds`);
    console.log(`With payload '${payload.toString()}`);
  }
});
```

Se l'argomento `payload` non è specificato, il payload predefinito sarà la marca temporale a 64-bit (little endian) che segna l'inizio della durata del `PING`.

#### http2session.ref()
<!-- YAML
added: v8.11.2
-->

Calls [`ref()`][`net.Socket.prototype.ref`] on this `Http2Session` instance's underlying [`net.Socket`].

#### http2session.remoteSettings
<!-- YAML
added: v8.4.0
-->

* Value: {HTTP/2 Settings Object}

Un oggetto senza prototipo che descrive le attuali impostazioni remote di `Http2Session`. Le impostazioni remote sono impostate dal peer HTTP/2 *connesso*.

#### http2session.setTimeout(msecs, callback)
<!-- YAML
added: v8.4.0
-->

* `msecs` {number}
* `callback` {Function}
* Restituisce: {undefined}

Utilizzato per impostare una funzione di callback quando non ci sono attività su `Http2Session` dopo `msecs` millisecondi. La `callback` fornita è registrata come listener sull'evento `'timeout'`.

#### http2session.socket
<!-- YAML
added: v8.4.0
-->

* Value: {net.Socket|tls.TLSSocket}

Restituisce un oggetto Proxy che funge da `net.Socket` (o `tls.TLSSocket`) ma limita i metodi disponibili a quelli sicuri da utilizzare con HTTP/2.

`destroy`, `emit`, `end`, `pause`, `read`, `resume` e `write` genereranno un errore con il codice `ERR_HTTP2_NO_SOCKET_MANIPULATION`. See [Http2Session and Sockets](#http2_http2session_and_sockets) for more information.

Il metodo `setTimeout` verrà chiamato su questa `Http2Session`.

Tutte le altre interazioni verranno indirizzate direttamente al socket.

#### http2session.state
<!-- YAML
added: v8.4.0
-->

Fornisce informazioni varie sullo stato attuale di `Http2Session`.

* Value: {Object}
  * `effectiveLocalWindowSize` {number} La dimensione della finestra di controllo del flusso locale (di ricezione) corrente per la `Http2Session`.
  * `effectiveRecvDataLength` {number} Il numero corrente di byte che sono stati ricevuti dall'ultimo controllo di flusso `WINDOW_UPDATE`.
  * `nextStreamID` {number} L'identificatore numerico da utilizzare la volta successiva che un nuovo `Http2Stream` viene creato da questa `Http2Session`.
  * `localWindowSize` {number} Il numero di byte che il peer remoto può inviare senza ricevere un `WINDOW_UPDATE`.
  * `lastProcStreamID` {number} L'ID numerico di `Http2Stream` per il quale è stato ricevuto di recente un frame `HEADERS` o `DATA`.
  * `remoteWindowSize` {number} Il numero di byte che questa `Http2Session` può inviare senza ricevere un `WINDOW_UPDATE`.
  * `outboundQueueSize` {number} Il numero di frame attualmente all'interno della coda in uscita per questa `Http2Session`.
  * `deflateDynamicTableSize` {number} La dimensione corrente in byte della tabella di stato della compressione dell'intestazione in uscita.
  * `inflateDynamicTableSize` {number} La dimensione corrente in byte della tabella di stato della compressione dell'intestazione in entrata.

Un oggetto che descrive lo stato corrente di questa `Http2Session`.

#### http2session.settings(settings)
<!-- YAML
added: v8.4.0
-->

* `settings` {HTTP/2 Settings Object}

Aggiorna le impostazioni locali correnti per questa `Http2Session` e invia un nuovo `SETTINGS` frame al peer HTTP/2 connesso.

Una volta chiamata, la proprietà `http2session.pendingSettingsAck` sarà `true` mentre la sessione è in attesa che il peer remoto riconosca le nuove impostazioni.

*Note*: The new settings will not become effective until the `SETTINGS` acknowledgment is received and the `'localSettings'` event is emitted. It is possible to send multiple `SETTINGS` frames while acknowledgment is still pending.

#### http2session.type
<!-- YAML
added: v8.4.0
-->

* Value: {number}

`http2session.type` sarà uguale a `http2.constants.NGHTTP2_SESSION_SERVER` se questa istanza `Http2Session` è un server e a `http2.constants.NGHTTP2_SESSION_CLIENT` se l'istanza è un client.

#### http2session.unref()
<!-- YAML
added: v8.11.2
-->

Calls [`unref()`][`net.Socket.prototype.unref`] on this `Http2Session` instance's underlying [`net.Socket`].

### Class: ServerHttp2Session
<!-- YAML
added: v8.4.0
-->

#### serverhttp2session.altsvc(alt, originOrStream)
<!-- YAML
added: v8.11.2
-->

* `alt` {string} Una descrizione della configurazione del servizio alternativo definita da [RFC 7838](https://tools.ietf.org/html/rfc7838).
* `originOrStream` {number|string|URL|Object} Either a URL string specifying the origin (or an Object with an `origin` property) or the numeric identifier of an active `Http2Stream` as given by the `http2stream.id` property.

Invia un frame `ALTSVC` (come definito da [RFC 7838](https://tools.ietf.org/html/rfc7838)) al client connesso.

```js
const http2 = require('http2');

const server = http2.createServer();
server.on('session', (session) => {
  // Imposta altsvc per originare https://example.org:80
  session.altsvc('h2=":8000"', 'https://example.org:80');
});

server.on('stream', (stream) => {
  // imposta altsvc per un flusso specifico
  stream.session.altsvc('h2=":8000"', stream.id);
});
```

Inviare un frame `ALTSVC` con un ID di flusso specifico indica che il servizio alternativo è associato all'origine del `Http2Stream` specificato.

L'`alt` e la stringa di origine *devono* contenere solo byte ASCII e sono interpretati rigorosamente come una sequenza di byte ASCII. Il valore speciale `'clear'` può essere passato per cancellare qualsiasi servizio alternativo precedentemente impostato per un dato dominio.

Quando una stringa viene passata per l'argomento `originOrStream`, verrà analizzata come un URL e l'origine verrà derivata. Ad esempio, l'origine dell'URL HTTP `'https://example.org/foo/bar'` è la stringa ASCII `'https://example.org'`. Un errore verrà generato se la stringa data non può essere analizzata come URL o se non è possibile derivare un'origine valida.

Un oggetto `URL`, o qualsiasi oggetto con una proprietà `origin`, può essere passato come `originOrStream`, nel qual caso il valore della proprietà `origin` sarà utilizzata. Il valore della proprietà `origin` *deve* essere un'origine ASCII correttamente serializzata.

#### Specifica di servizi alternativi

Il formato del parametro `alt` è rigorosamente definito da [RFC 7838](https://tools.ietf.org/html/rfc7838) come una stringa ASCII contenente un elenco delimitato da virgole di protocolli "alternativi" associati ad un host ed una porta specifici.

Ad esempio, il valore `'h2 = "example.org:81"'` indica che il protocollo HTTP/2 è disponibile sull'host `'example.org'` sulla porta TCP/IP 81. L'host e la porta *devono* essere contenuti all'interno di virgolette (`"`).

Possono essere specificate più alternative, ad esempio: `'h2="example.org:81",
h2=":82"'`

L'identificativo del protocollo (`'h2'` negli esempi) può essere qualsiasi [ID protocollo ALPN](https://www.iana.org/assignments/tls-extensiontype-values/tls-extensiontype-values.xhtml#alpn-protocol-ids) valido.

La sintassi di questi valori non è convalidata dall'implementazione Node.js e viene trasmessa come fornita dall'utente o ricevuta dal peer.

#### serverhttp2session.origin(...origins)
<!-- YAML
added: v8.13.0
-->

* `origins` { string | URL | Object } One or more URL Strings passed as separate arguments.

Submits an `ORIGIN` frame (as defined by [RFC 8336](https://tools.ietf.org/html/rfc8336)) to the connected client to advertise the set of origins for which the server is capable of providing authoritative responses.

```js
const http2 = require('http2');
const options = getSecureOptionsSomehow();
const server = http2.createSecureServer(options);
server.on('stream', (stream) => {
  stream.respond();
  stream.end('ok');
});
server.on('session', (session) => {
  session.origin('https://example.com', 'https://example.org');
});
```

When a string is passed as an `origin`, it will be parsed as a URL and the origin will be derived. For instance, the origin for the HTTP URL `'https://example.org/foo/bar'` is the ASCII string `'https://example.org'`. Un errore verrà generato se la stringa data non può essere analizzata come URL o se non è possibile derivare un'origine valida.

A `URL` object, or any object with an `origin` property, may be passed as an `origin`, in which case the value of the `origin` property will be used. Il valore della proprietà `origin` *deve* essere un'origine ASCII correttamente serializzata.

Alternatively, the `origins` option may be used when creating a new HTTP/2 server using the `http2.createSecureServer()` method:

```js
const http2 = require('http2');
const options = getSecureOptionsSomehow();
options.origins = ['https://example.com', 'https://example.org'];
const server = http2.createSecureServer(options);
server.on('stream', (stream) => {
  stream.respond();
  stream.end('ok');
});
```

### Class: ClientHttp2Session
<!-- YAML
added: v8.4.0
-->

#### Evento: 'altsvc'
<!-- YAML
added: v8.11.2
-->

* `alt` {string}
* `origin` {string}
* `streamId` {number}

L'evento `'altsvc'` viene emesso ogni volta che un frame `ALTSVC` viene ricevuto dal client. L'evento viene emesso con il valore `ALTSVC`, l'origine e l'ID dello stream. Se nessun `origin` è fornito nel frame `ALTSVC`, `origin` sarà una stringa vuota.

```js
const http2 = require('http2');
const client = http2.connect('https://example.org');

client.on('altsvc', (alt, origin, streamId) => {
  console.log(alt);
  console.log(origin);
  console.log(streamId);
});
```

#### Event: 'origin'
<!-- YAML
added: v8.13.0
-->

* `origins` {string[]}

The `'origin'`  event is emitted whenever an `ORIGIN` frame is received by the client. The event is emitted with an array of `origin` strings. The `http2session.originSet` will be updated to include the received origins.

```js
const http2 = require('http2');
const client = http2.connect('https://example.org');

client.on('origin', (origins) => {
  for (let n = 0; n < origins.length; n++)
    console.log(origins[n]);
});
```

The `'origin'` event is only emitted when using a secure TLS connection.

#### clienthttp2session.request(headers[, options])
<!-- YAML
added: v8.4.0
-->

* `headers` {HTTP/2 Headers Object}
* `options` {Object}
  * `endStream` {boolean} Sarà `true` se il lato `Http2Stream` *writable* dovrebbe essere chiuso inizialmente, ad esempio quando si invia una richiesta `GET` che non dovrebbe aspettarsi un corpo payload.
  * `exclusive` {boolean} Quando `true` e `parent` identifica un flusso genitore, il flusso creato viene reso l'unica dipendenza diretta del genitore, con tutti gli altri dipendenti esistenti dipendenti dal flusso appena creato. **Default:** `false`.
  * `parent` {number} Specifica l'identificatore numerico di uno stream dal quale lo stream appena creato dipende.
  * `weight` {number} Specifica la dipendenza relativa di uno stream in relazione ad altri stream con lo stesso `parent`. Il valore è un numero che va da `1` a `256` (inclusi).
  * `waitForTrailers` {boolean} Quando è `true`, `Http2Stream` emetterà l'evento `'wantTrailers'` dopo che l'ultimo frame `DATA` è stato inviato.

* Restituisce: {ClientHttp2Stream}

Solo per istanze Client HTTP/2 `Http2Session`, `http2session.request()` crea e restituisce un'istanza `Http2Stream` che può essere utilizzata per inviare una richiesta HTTP/2 al server connesso.

Questo metodo è disponibile solo se `http2session.type` è uguale a `http2.constants.NGHTTP2_SESSION_CLIENT`.

```js
const http2 = require('http2');
const clientSession = http2.connect('https://localhost:1234');
const {
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_STATUS
} = http2.constants;

const req = clientSession.request({ [HTTP2_HEADER_PATH]: '/' });
req.on('response', (headers) => {
  console.log(headers[HTTP2_HEADER_STATUS]);
  req.on('data', (chunk) => { /** .. **/ });
  req.on('end', () => { /** .. **/ });
});
```

Quando l'opzione `options.waitForTrailers` è impostata, l'evento `'wantTrailers'` viene emesso immediatamente dopo aver accodato l'ultimo blocco di dati del payload da inviare. Il metodo `http2stream.sendTrailers()` può quindi essere chiamato per inviare intestazioni finali al peer.

When `options.waitForTrailers` is set, the `Http2Stream` will not automatically close when the final `DATA` frame is transmitted. User code must call either `http2stream.sendTrailers()` or `http2stream.close()` to close the `Http2Stream`.

Le pseudo-intestazioni `:method` e `:path` non sono specificate all'interno di `headers`, si definiscono rispettivamente di default in:

* `:method` = `'GET'`
* `:path` = `/`

### Class: Http2Stream
<!-- YAML
added: v8.4.0
-->

* Estendendo: {stream.Duplex}

Ogni istanza della classe `Http2Stream` rappresenta un flusso di comunicazione HTTP/2 bidirezionale su un'istanza `Http2Session`. Qualsiasi singola `Http2Session` può avere fino a 2 <sup>31</sup>-1 istanze `Http2Stream` nel corso della sua esistenza.

Il codice utente non costruirà direttamente le istanze `Http2Stream`. Piuttosto, queste vengono create, gestite e fornite al codice utente attraverso l'istanza `Http2Session`. Sul server, le istanze `Http2Stream` vengono create in risposta a una richiesta HTTP in entrata (e passate al codice utente tramite l'evento `'stream'`), oppure in risposta a una chiama al metodo `http2stream.pushStream()`. Sul client, le istanze `Http2Stream` vengono create e restituite quando viene chiamato il metodo `http2session.request()` o in risposta a un evento `'push'` in entrata.

*Note*: The `Http2Stream` class is a base for the [`ServerHttp2Stream`][] and [`ClientHttp2Stream`][] classes, each of which is used specifically by either the Server or Client side, respectively.

Tutte le istanze `Http2Stream` sono stream [`Duplex`][]. Il lato `Writable` del `Duplex` viene utilizzato per inviare dati al peer connesso, mentre il lato `Readable` viene utilizzato per ricevere i dati inviati dal peer connesso.

#### Il ciclo di vita di un Http2Stream

##### Creazione

Sul lato server, vengono create istanze di [`ServerHttp2Stream`][] quando:

* Viene ricevuto un nuovo frame HTTP/2 `HEADERS` con un ID di flusso precedentemente inutilizzato;
* Viene chiamato il metodo `http2stream.pushStream()`.

Sul lato client, le istanze di [`ClientHttp2Stream`][] vengono create quando viene chiamato il metodo `http2session.request()`.

*Note*: On the client, the `Http2Stream` instance returned by `http2session.request()` may not be immediately ready for use if the parent `Http2Session` has not yet been fully established. In such cases, operations called on the `Http2Stream` will be buffered until the `'ready'` event is emitted. User code should rarely, if ever, need to handle the `'ready'` event directly. The ready status of an `Http2Stream` can be determined by checking the value of `http2stream.id`. If the value is `undefined`, the stream is not yet ready for use.

##### Distruzione

Tutte le istanze [`Http2Stream`][] vengono eliminate quando:

* Un frame `RST_STREAM` per il flusso viene ricevuto dal peer connesso.
* Il metodo `http2stream.close()` viene chiamato.
* I metodi `http2stream.destroy()` o `http2session.destroy()` vengono chiamati.

Quando un'istanza `Http2Stream` viene distrutta, verrà effettuato un tentativo di inviare un frame `RST_STREAM` al peer connesso.

Quando l'istanza `Http2Stream` viene distrutta, verrà emesso l'evento `'close'`. Poiché `Http2Stream` è un'istanza di `stream.Duplex`, l'evento `'end'` verrà emesso anche se i dati del flusso stanno scorrendo. L'evento `'error'` può anche essere emesso se `http2stream.destroy()` è stato chiamato con un `Error` passato come primo argomento.

Dopo che l'`Http2Stream` è stato distrutto, la proprietà `http2stream.destroyed` sarà `true` e la proprietà `http2stream.rstCode` specificherà il codice di errore `RST_STREAM`. L'istanza `Http2Stream` non è più utilizzabile una volta distrutta.

#### Event: 'aborted'
<!-- YAML
added: v8.4.0
-->

L'evento `'aborted'` viene emesso ogni volta che un'istanza `Http2Stream` viene interrotta in modo anomalo nel mezzo della comunicazione.

*Note*: The `'aborted'` event will only be emitted if the `Http2Stream` writable side has not been ended.

#### Event: 'close'
<!-- YAML
added: v8.4.0
-->

L'evento `'close'` viene emesso quando l'`Http2Stream` viene distrutto. Una volta emesso questo evento, l'istanza `Http2Stream` non è più utilizzabile.

The listener callback is passed a single argument specifying the HTTP/2 error code specified when closing the stream. If the code is any value other than `NGHTTP2_NO_ERROR` (`0`), an `'error'` event will also be emitted.

#### Event: 'error'
<!-- YAML
added: v8.4.0
-->

* `error` {Error}

L'evento `'error'` viene emesso quando si verifica un errore durante l'elaborazione di `Http2Stream`.

#### Evento: 'frameError'
<!-- YAML
added: v8.4.0
-->

L'evento `'frameError'` viene emesso quando si verifica un errore durante il tentativo di inviare un frame. Quando viene invocato, la funzione del gestore riceverà un argomento di tipo numero intero che identifica il tipo di frame e un argomento di tipo numero intero che identifica il codice di errore. L'istanza `Http2Stream` verrà eliminata immediatamente dopo l'emissione dell'evento `'frameError'`.

#### Event: 'timeout'
<!-- YAML
added: v8.4.0
-->

The `'timeout'` event is emitted after no activity is received for this `'Http2Stream'` within the number of milliseconds set using `http2stream.setTimeout()`.

#### Event: 'trailers'
<!-- YAML
added: v8.4.0
-->

L'evento `'trailers'` viene emesso quando viene ricevuto un blocco di intestazioni associato ai campi dell'intestazione finale. Il callback del listener riceve l'[HTTP/2 Headers Object](#http2_headers_object) ed i flag associati alle intestazioni.

Note that this event might not be emitted if `http2stream.end()` is called before trailers are received and the incoming data is not being read or listened for.

```js
stream.on('trailers', (headers, flags) => {
  console.log(headers);
});
```

#### Event: 'wantTrailers'
<!-- YAML
added: v8.13.0
-->

L'evento `'wantTrailers'` viene emesso quando `Http2Stream` ha messo in coda il frame finale `DATA` da inviare su di un frame e l'`Http2Stream` è pronto per inviare intestazioni di trascinamento. Quando si avvia una richiesta o una risposta, l'opzione `waitForTrailers` deve essere impostata affinché venga emesso questo evento.

#### http2stream.aborted
<!-- YAML
added: v8.4.0
-->

* Value: {boolean}

Imposta su ` true ` se l'istanza ` Http2Stream ` è stata interrotta in modo anomalo. Quando impostato, l'evento `'aborted'` verrà emesso.

#### http2stream.close(code[, callback])
<!-- YAML
added: v8.4.0
-->

* code {number} Numero intero a 32 bit non firmato che identifica il codice di errore. **Default:** `http2.constants.NGHTTP2_NO_ERROR` (`0x00`).
* `callback` {Function} Una funzione opzionale registrata per ascoltare l'evento `'close'`.
* Restituisce: {undefined}

Chiude l'istanza ` Http2Stream ` inviando un frame ` RST_STREAM ` al connesso HTTP/2 peer.

#### http2stream.closed
<!-- YAML
added: v8.11.2
-->

* Value: {boolean}

È impostata su `true` se l'istanza `Http2Stream` è stata chiusa.

#### http2stream.destroyed
<!-- YAML
added: v8.4.0
-->

* Value: {boolean}

È impostata su `true` se l'istanza `Http2Stream` è stata distrutta e non è più utilizzabile.

#### http2stream.endAfterHeaders
<!-- YAML
added: v8.13.0
-->

* {boolean}

Set the `true` if the `END_STREAM` flag was set in the request or response HEADERS frame received, indicating that no additional data should be received and the readable side of the `Http2Stream` will be closed.

#### http2stream.pending
<!-- YAML
added: v8.11.2
-->

* Value: {boolean}

È impostata su `true` se all'istanza `Http2Stream` non è ancora stato assegnato un identificatore di flusso numerico.

#### http2stream.priority(options)
<!-- YAML
added: v8.4.0
-->

* `options` {Object}
  * `exclusive` {boolean} Quando è `true` e `parent` identifica un flusso principale, questo flusso viene reso l'unica dipendenza diretta del parent, e tutte le altre dipendenze esistenti rese dipendenti da questo flusso. **Default:** `false`.
  * `parent` {number} Specifica l'identificatore numerico di un flusso da cui questo flusso dipende.
  * `weight` {number} Specifica la dipendenza relativa di uno stream in relazione ad altri stream con lo stesso `parent`. Il valore è un numero che va da `1` a `256` (inclusi).
  * `silent` {boolean} Quando è `true`, cambia la priorità localmente senza mandare un frame `PRIORITY` al peer connesso.
* Restituisce: {undefined}

Aggiorna la priorità per questa istanza `Http2Stream`.

#### http2stream.rstCode
<!-- YAML
added: v8.4.0
-->

* Value: {number}

Impostato sull'`RST_STREAM` [error code](#error_codes) segnalato quando l'`Http2Stream` viene distrutto dopo aver ricevuto un frame `RST_STREAM` dal peer connesso, chiamando `http2stream.close()` o `http2stream.destroy()`. Sarà `undefined` se l'`Http2Stream` non è stato chiuso.

#### http2stream.sentHeaders
<!-- YAML
added: v8.11.2
-->

* Value: {HTTP/2 Headers Object}

Un oggetto contenente le intestazioni in uscita inviate per questo `Http2Stream`.

#### http2stream.sentInfoHeaders
<!-- YAML
added: v8.11.2
-->

* Value: {HTTP/2 Headers Object[]}

Una array di oggetti contenenti le intestazioni informative (aggiuntive) in uscita inviate per questo `Http2Stream`.

#### http2stream.sentTrailers
<!-- YAML
added: v8.11.2
-->

* Value: {HTTP/2 Headers Object}

Un oggetto contenente le intestazioni di coda in uscita inviati per questo `HttpStream`.

#### http2stream.session
<!-- YAML
added: v8.4.0
-->

* Value: {Http2Session}

Un riferimento all'istanza `Http2Session` che possiede questo `Http2Stream`. Il valore sarà `undefined` dopo che l'istanza `Http2Stream` è stata distrutta.

#### http2stream.setTimeout(msecs, callback)
<!-- YAML
added: v8.4.0
-->

* `msecs` {number}
* `callback` {Function}
* Restituisce: {undefined}

```js
const http2 = require('http2');
const client = http2.connect('http://example.org:8000');
const { NGHTTP2_CANCEL } = http2.constants;
const req = client.request({ ':path': '/' });

// Cancella il flusso se non c'è alcuna attività per 5 secondi
req.setTimeout(5000, () => req.close(NGHTTP2_CANCEL));
```

#### http2stream.state
<!-- YAML
added: v8.4.0
-->
Fornisce informazioni varie sullo stato corrente di 

`Http2Stream`.

* Value: {Object}
  * `localWindowSize` {number} Il numero di byte che il peer connesso può inviare per questo `Http2Stream` senza ricevere un `WINDOW_UPDATE`.
  * `state` {number} A flag indicating the low-level current state of the `Http2Stream` as determined by nghttp2.
  * `localClose` {number} È `true` se questo `Http2Stream` è stato chiuso localmente.
  * `remoteClose` {number} `true` se questo `Http2Stream` è stato chiuso da remoto.
  * `sumDependencyWeight` {number} Il peso totale di tutte le istanze `Http2Stream` che dipendono da questo `Http2Stream` specificato usando i frame `PRIORITY`.
  * `weight` {number} Il peso prioritario di questo `Http2Stream`.

Uno stato attuale di questo `Http2Stream`.

#### http2stream.sendTrailers(headers)
<!-- YAML
added: v8.13.0
-->

* `headers` {HTTP/2 Headers Object}

Invia un frame `HEADERS` di coda al peer HTTP/2 connesso. Questo metodo farà sì che il `Http2Stream` venga immediatamente chiuso e deve essere chiamato solo dopo che è stato emesso l'evento `'wantTrailers'`. Quando si invia una richiesta o si invia una risposta, è necessario impostare l'opzione `options.waitForTrailers` per mantenere `Http2Stream` aperto dopo il frame `DATA` di coda in modo che i rimorchi possano essere inviati.

```js
const http2 = require('http2');
const server = http2.createServer();
server.on('stream', (stream) => {
  stream.respond(undefined, { waitForTrailers: true });
  stream.on('wantTrailers', () => {
    stream.sendTrailers({ xyz: 'abc' });
  });
  stream.end('Hello World');
});
```

La specifica HTTP/1 vieta ai trailer di contenere campi di pseudo-intestazioni HTTP/2 (ad es. `':method'`, `':path'`, ecc.).

### Class: ClientHttp2Stream
<!-- YAML
added: v8.4.0
-->

* Estendendo {Http2Stream}

La classe `ClientHttp2Stream` è un'estensione di `Http2Stream` che viene utilizzata esclusivamente sui client HTTP/2. Le istanze `Http2Stream` sul client forniscono eventi come `'response'` e `'push'` che sono rilevanti solo sul client.

#### Event: 'continue'
<!-- YAML
added: v8.5.0
-->

Emesso quando il server invia uno stato `100 Continue`, solitamente perché la richiesta conteneva `Expect: 100-continue`. Questa è un'istruzione che il client dovrebbe inviare al corpo della richiesta.

#### Evento: 'headers'
<!-- YAML
added: v8.4.0
-->

L'evento `'headers'` viene emesso quando viene ricevuto un ulteriore blocco di intestazioni per un flusso, ad esempio quando viene ricevuto un blocco di intestazioni informative `1xx`. Il callback del listener è passato all' [HTTP/2 Headers object](#http2_headers_object) e ai flag associati alle intestazioni.

```js
stream.on('headers', (headers, flags) => {
  console.log(headers);
});
```

#### Evento: 'push'
<!-- YAML
added: v8.4.0
-->

L'evento `'push'` viene emesso quando vengono ricevute intestazioni di risposta per un flusso Server Push. Il callback del listener riceve l'[HTTP/2 Headers Object](#http2_headers_object) ed i flag associati alle intestazioni.

```js
stream.on('push', (headers, flags) => {
  console.log(headers);
});
```

#### Event: 'response'
<!-- YAML
added: v8.4.0
-->

L'evento `'response'` viene emesso quando un frame di risposta `HEADERS` è stato ricevuto per questo flusso dal server HTTP/2 connesso. The listener is invoked with two arguments: an Object containing the received [HTTP/2 Headers Object](#http2_headers_object), and flags associated with the headers.

Per esempio:

```js
const http2 = require('http2');
const client = http2.connect('https://localhost');
const req = client.request({ ':path': '/' });
req.on('response', (headers, flags) => {
  console.log(headers[':status']);
});
```

### Class: ServerHttp2Stream
<!-- YAML
added: v8.4.0
-->

* Extends: {Http2Stream}

La classe `ServerHttp2Stream` è un'estensione di [`Http2Stream`][] che viene utilizzata esclusivamente sui server HTTP/2. Le istanze `Http2Stream` sul server forniscono metodi aggiuntivi come `http2stream.pushStream()` e `http2stream.respond()` che sono rilevanti solo sul server.

#### http2stream.additionalHeaders(headers)
<!-- YAML
added: v8.4.0
-->

* `headers` {HTTP/2 Headers Object}

Invia un frame informativo aggiuntivo `HEADERS` al peer HTTP/2 connesso.

#### http2stream.headersSent
<!-- YAML
added: v8.4.0
-->

* Value: {boolean}

Boolean (sola lettura). True se le intestazioni sono state inviate, altrimenti false.

#### http2stream.pushAllowed
<!-- YAML
added: v8.4.0
-->

* Value: {boolean}

Proprietà di sola lettura mappata al flag `SETTINGS_ENABLE_PUSH` del frame `SETTINGS` del client remoto più recente. Sarà `true` se il peer remoto accetta flussi push, `false` in caso contrario. Le impostazioni sono le stesse per ogni `Http2Stream` nella stessa `Http2Session`.

#### http2stream.pushStream(headers[, options], callback)
<!-- YAML
added: v8.4.0
-->

* `headers` {HTTP/2 Headers Object}
* `options` {Object}
  * `exclusive` {boolean} Quando `true` e `parent` identifica un flusso genitore, il flusso creato viene reso l'unica dipendenza diretta del genitore, con tutti gli altri dipendenti esistenti dipendenti dal flusso appena creato. **Default:** `false`.
  * `parent` {number} Specifica l'identificatore numerico di uno stream dal quale lo stream appena creato dipende.
* `callback` {Function} Callback that is called once the push stream has been initiated.
  * `err` {Error}
  * `pushStream` {ServerHttp2Stream} The returned pushStream object.
  * `headers` {HTTP/2 Headers Object} Headers object the pushStream was initiated with.
* Restituisce: {undefined}

Inizia un flusso push. Il callback è invocato con la nuova istanza `Http2Stream` creata per il flusso push passato come secondo argomento, o un `Error` passato come primo argomento.

```js
const http2 = require('http2');
const server = http2.createServer();
server.on('stream', (stream) => {
  stream.respond({ ':status': 200 });
  stream.pushStream({ ':path': '/' }, (err, pushStream, headers) => {
    if (err) throw err;
    pushStream.respond({ ':status': 200 });
    pushStream.end('some pushed data');
  });
  stream.end('some data');
});
```

L'impostazione del peso di un flusso push non è consentita nel frame `HEADERS`. Passa un valore `weight` a `http2stream.priority` con l'opzione `silent` impostata su `true` per abilitare il bilanciamento della larghezza di banda sul lato server tra flussi simultanei.

Calling `http2stream.pushStream()` from within a pushed stream is not permitted and will throw an error.

#### http2stream.respond([headers[, options]])
<!-- YAML
added: v8.4.0
-->

* `headers` {HTTP/2 Headers Object}
* `options` {Object}
  * `endStream` {boolean} Impostata su `true` per indicare che la risposta non includerà i dati del payload.
  * `waitForTrailers` {boolean} Quando è `true`, `Http2Stream` emetterà l'evento `'wantTrailers'` dopo che l'ultimo frame `DATA` è stato inviato.

```js
const http2 = require('http2');
const server = http2.createServer();
server.on('stream', (stream) => {
  stream.respond({ ':status': 200 });
  stream.end('some data');
});
```

Quando è impostata l'opzione `options.waitForTrailers`, l'evento `'wantTrailers'` verrà emesso immediatamente dopo aver accodato l'ultimo blocco di dati del payload da inviare. Il metodo `http2stream.sendTrailers()` può quindi essere utilizzato per inviare i campi dell'intestazione finale al peer.

When `options.waitForTrailers` is set, the `Http2Stream` will not automatically close when the final `DATA` frame is transmitted. User code must call either `http2stream.sendTrailers()` or `http2stream.close()` to close the `Http2Stream`.

```js
const http2 = require('http2');
const server = http2.createServer();
server.on('stream', (stream) => {
  stream.respond({ ':status': 200 }, { waitForTrailers: true });
  stream.on('wantTrailers', () => {
    stream.sendTrailers({ ABC: 'some value to send' });
  });
  stream.end('some data');
});
```

#### http2stream.respondWithFD(fd[, headers[, options]])
<!-- YAML
added: v8.4.0
-->

* `fd` {number} Un descrittore di file leggibile.
* `headers` {HTTP/2 Headers Object}
* `options` {Object}
  * `statCheck` {Function}
  * `waitForTrailers` {boolean} Quando è `true`, `Http2Stream` emetterà l'evento `'wantTrailers'` dopo che l'ultimo frame `DATA` è stato inviato.
  * `offset` {number} La posizione di offset da cui iniziare a leggere.
  * `length` {number} La quantità di dati dal fd da inviare.

Avvia una risposta i cui dati vengono letti dal descrittore di file specificato. Nessuna convalida viene eseguita sul descrittore di file specificato. Se si verifica un errore durante il tentativo di leggere i dati utilizzando il descrittore di file, il `Http2Stream` verrà chiuso utilizzando un frame `RST_STREAM` utilizzando il codice standard `INTERNAL_ERROR`.

When used, the `Http2Stream` object's Duplex interface will be closed automatically.

```js
const http2 = require('http2');
const fs = require('fs');

const server = http2.createServer();
server.on('stream', (stream) => {
  const fd = fs.openSync('/some/file', 'r');

  const stat = fs.fstatSync(fd);
  const headers = {
    'content-length': stat.size,
    'last-modified': stat.mtime.toUTCString(),
    'content-type': 'text/plain'
  };
  stream.respondWithFD(fd, headers);
  stream.on('close', () => fs.closeSync(fd));
});
```

La funzione facoltativa `options.statCheck` può essere specificata per dare al codice utente un'opportunità di impostare intestazioni di contenuto aggiuntive in base ai dettagli `fs.Stat` del descrittore di file indicato. Se viene fornita la funzione `statCheck`, il metodo `http2stream.respondWithFD()` eseguirà una chiamata `fs.fstat()` per raccogliere dettagli sul descrittore di file fornito.

Le opzioni `offset` e `lenght` possono essere utilizzate per limitare la risposta a un sottoinsieme di intervallo specifico. Ciò può essere utilizzato, ad esempio, per supportare le richieste HTTP Range.

Il descrittore di file non è chiuso quando lo stream è chiuso, quindi bisognerà chiuderlo manualmente una volta che non è più necessario. Notare che l'utilizzo dello stesso descrittore di file simultaneamente per più stream non è supportato e può causare la perdita dei dati. Il riutilizzo di un descrittore di file dopo che si è concluso uno stream è supportato.

Quando è impostata l'opzione `options.waitForTrailers`, l'evento `'wantTrailers'` verrà emesso immediatamente dopo aver accodato l'ultimo blocco di dati del payload da inviare. Il metodo `http2stream.sendTrailers()` può quindi essere utilizzato per inviare i campi dell'intestazione finale al peer.

When `options.waitForTrailers` is set, the `Http2Stream` will not automatically close when the final `DATA` frame is transmitted. User code *must* call either `http2stream.sendTrailers()` or `http2stream.close()` to close the `Http2Stream`.

```js
const http2 = require('http2');
const fs = require('fs');

const server = http2.createServer();
server.on('stream', (stream) => {
  const fd = fs.openSync('/some/file', 'r');

  const stat = fs.fstatSync(fd);
  const headers = {
    'content-length': stat.size,
    'last-modified': stat.mtime.toUTCString(),
    'content-type': 'text/plain'
  };
  stream.respondWithFD(fd, headers, { waitForTrailers: true });
  stream.on('wantTrailers', () => {
    stream.sendTrailers({ ABC: 'some value to send' });
  });

  stream.on('close', () => fs.closeSync(fd));
});
```

#### http2stream.respondWithFile(path[, headers[, options]])
<!-- YAML
added: v8.4.0
-->

* `path` {string|Buffer|URL}
* `headers` {HTTP/2 Headers Object}
* `options` {Object}
  * `statCheck` {Function}
  * `onError` {Function} Callback function invoked in the case of an Error before send.
  * `waitForTrailers` {boolean} Quando è `true`, `Http2Stream` emetterà l'evento `'wantTrailers'` dopo che l'ultimo frame `DATA` è stato inviato.
  * `offset` {number} La posizione di offset da cui iniziare a leggere.
  * `length` {number} La quantità di dati dal fd da inviare.

Invia un file regolare come risposta. Il `path` deve specificare un file regolare o verrà emesso un evento `'error'` sul `Http2Stream` object.

When used, the `Http2Stream` object's Duplex interface will be closed automatically.

La funzione facoltativa `options.statCheck` può essere specificata per dare al codice utente un'opportunità di impostare intestazioni di contenuto aggiuntive in base ai dettagli `fs.Stat` del file indicato:

Se si verifica un errore durante il tentativo di leggere i dati del file, `Http2Stream` verrà chiuso utilizzando un frame `RST_STREAM` usando il codice standard `INTERNAL_ERROR`. Se il callback `onError` è specificato, allora verrà chiamato. Altrimenti lo stream verrà distrutto.

Esempio usando il percorso di un file:

```js
const http2 = require('http2');
const server = http2.createServer();
server.on('stream', (stream) => {
  function statCheck(stat, headers) {
    headers['last-modified'] = stat.mtime.toUTCString();
  }

  function onError(err) {
    if (err.code === 'ENOENT') {
      stream.respond({ ':status': 404 });
    } else {
      stream.respond({ ':status': 500 });
    }
    stream.end();
  }

  stream.respondWithFile('/some/file',
                         { 'content-type': 'text/plain' },
                         { statCheck, onError });
});
```

La funzione `options.statCheck` può essere utilizzata anche per annullare l'operazione di invio restituendo `false`. Per esempio, una richiesta condizionale può controllare i risultati dello stat per determinare se il file è stato modificato per restituire una risposta `304` appropriata:

```js
const http2 = require('http2');
const server = http2.createServer();
server.on('stream', (stream) => {
  function statCheck(stat, headers) {
    // Controlla lo stat qui...
    stream.respond({ ':status': 304 });
    return false; // Elimina l'operazione di invio
  }
  stream.respondWithFile('/some/file',
                         { 'content-type': 'text/plain' },
                         { statCheck });
});
```

Il campo dell'intestazione `content-length` verrà impostato automaticamente.

Le opzioni `offset` e `lenght` possono essere utilizzate per limitare la risposta a un sottoinsieme di intervallo specifico. Ciò può essere utilizzato, ad esempio, per supportare le richieste HTTP Range.

La funzione `options.onError` può essere utilizzata anche per gestire tutti gli errori che potrebbero verificarsi prima dell'inizio della consegna del file. Il comportamento predefinito è quello di distruggere lo stream.

Quando è impostata l'opzione `options.waitForTrailers`, l'evento `'wantTrailers'` verrà emesso immediatamente dopo aver accodato l'ultimo blocco di dati del payload da inviare. Il metodo `http2stream.sendTrilers()` può quindi essere utilizzato per inviare i campi dell'intestazione finale al peer.

When `options.waitForTrailers` is set, the `Http2Stream` will not automatically close when the final `DATA` frame is transmitted. User code must call either `http2stream.sendTrailers()` or `http2stream.close()` to close the `Http2Stream`.

```js
const http2 = require('http2');
const server = http2.createServer();
server.on('stream', (stream) => {
  stream.respondWithFile('/some/file',
                         { 'content-type': 'text/plain' },
                         { waitForTrailers: true });
  stream.on('wantTrailers', () => {
    stream.sendTrailers({ ABC: 'some value to send' });
  });
});
```

### Class: Http2Server
<!-- YAML
added: v8.4.0
-->

* Estende: {net.Server}

Instances of `Http2Server` are created using the `http2.createServer()` function. The `Http2Server` class is not exported directly by the `http2` module.

#### Event: 'checkContinue'
<!-- YAML
added: v8.5.0
-->

* `request` {http2.Http2ServerRequest}
* `response` {http2.Http2ServerResponse}

If a [`'request'`][] listener is registered or [`http2.createServer()`][] is supplied a callback function, the `'checkContinue'` event is emitted each time a request with an HTTP `Expect: 100-continue` is received. Se questo evento non viene sottoposto al listening, il server risponderà automaticamente con uno status `100 Continue` opportuno.

Handling this event involves calling [`response.writeContinue()`][] if the client should continue to send the request body, or generating an appropriate HTTP response (e.g. 400 Bad Request) if the client should not continue to send the request body.

Notare che in caso questo evento venga emesso e gestito, l'evento [`'request'`][] non verrà emesso.

#### Event: 'request'
<!-- YAML
added: v8.4.0
-->

* `request` {http2.Http2ServerRequest}
* `response` {http2.Http2ServerResponse}

Emesso ogni volta che è presente una richiesta. Notare che possono esserci richieste multiple per sessione. Vedi l'[API di Compatibilità](#http2_compatibility_api).

#### Event: 'session'
<!-- YAML
added: v8.4.0
-->

L'evento `'session'` viene emesso quando una nuova `Http2Session` viene creato dal `Http2Server`.

#### Event: 'sessionError'
<!-- YAML
added: v8.4.0
-->

L'evento `'sessionError'` viene emesso quando un evento `'error'` è emesso da un `Http2Session` object associato a `Http2Server`.

#### Evento: 'stream'
<!-- YAML
added: v8.4.0
-->

L'evento `'stream'` viene emesso quando un evento `'stream'` è stato emesso da un `Http2Session` associato al server.

```js
const http2 = require('http2');
const {
  HTTP2_HEADER_METHOD,
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_STATUS,
  HTTP2_HEADER_CONTENT_TYPE
} = http2.constants;

const server = http2.createServer();
server.on('stream', (stream, headers, flags) => {
  const method = headers[HTTP2_HEADER_METHOD];
  const path = headers[HTTP2_HEADER_PATH];
  // ...
  stream.respond({
    [HTTP2_HEADER_STATUS]: 200,
    [HTTP2_HEADER_CONTENT_TYPE]: 'text/plain'
  });
  stream.write('hello ');
  stream.end('world');
});
```

#### Event: 'timeout'
<!-- YAML
added: v8.4.0
-->

L'evento `'timeout'` viene emesso quando non c'è attività sul Server per un determinato numero di millisecondi impostato utilizzando `http2server.setTimeout()`. **Default:** 2 minutes.

#### server.close([callback])
<!-- YAML
added: v8.4.0
-->
- `callback` {Function}

Impedisce al server di accettare nuove connessioni.  Vedi [`net.Server.close()`][].

Notare che ciò non è analogo a limitare nuove richieste poiché le connessioni HTTP/2 sono persistenti. Per ottenere un comportamento simile a uno spegnimento regolare, considerare anche l'utilizzo di [`http2session.close()`] nelle sessioni attive.

#### server.setTimeout(\[msecs\]\[, callback\])
<!-- YAML
added: v8.4.0
-->

* `msecs` {number} **Default:** `120000` (2 minuti)
* `callback` {Function}
* Restituisce: {Http2Server}

Used to set the timeout value for http2 server requests, and sets a callback function that is called when there is no activity on the `Http2Server` after `msecs` milliseconds.

The given callback is registered as a listener on the `'timeout'` event.

In case of no callback function were assigned, a new `ERR_INVALID_CALLBACK` error will be thrown.

### Class: Http2SecureServer
<!-- YAML
added: v8.4.0
-->

* Estende: {tls.Server}

Instances of `Http2SecureServer` are created using the `http2.createSecureServer()` function. The `Http2SecureServer` class is not exported directly by the `http2` module.

#### Event: 'checkContinue'
<!-- YAML
added: v8.5.0
-->

* `request` {http2.Http2ServerRequest}
* `response` {http2.Http2ServerResponse}

Se un [`'request'`][] listener viene registrato o viene fornita una funzione di callback a [`http2.createSecureServer()`][], l'evento `'checkContinue'` viene emesso ogni volta che viene ricevuta una richiesta con un HTTP `Expect: 100-continue`. Se questo evento non viene sottoposto al listening, il server risponderà automaticamente con uno status `100 Continue` opportuno.

Handling this event involves calling [`response.writeContinue()`][] if the client should continue to send the request body, or generating an appropriate HTTP response (e.g. 400 Bad Request) if the client should not continue to send the request body.

Notare che in caso questo evento venga emesso e gestito, l'evento [`'request'`][] non verrà emesso.

#### Event: 'request'
<!-- YAML
added: v8.4.0
-->

* `request` {http2.Http2ServerRequest}
* `response` {http2.Http2ServerResponse}

Emesso ogni volta che è presente una richiesta. Notare che possono esserci richieste multiple per sessione. Vedi l'[API di Compatibilità](#http2_compatibility_api).

#### Event: 'session'
<!-- YAML
added: v8.4.0
-->

L'evento `'session'` viene emesso quando un nuovo `Http2Session` viene creato da `Http2SecureServer`.

#### Event: 'sessionError'
<!-- YAML
added: v8.4.0
-->

L'evento `'sessionError'` viene emesso quando un evento `'error'` è emesso da un `Http2Session` object associato al `Http2SecureServer`.

#### Evento: 'stream'
<!-- YAML
added: v8.4.0
-->

L'evento `'stream'` viene emesso quando un evento `'stream'` è stato emesso da un `Http2Session` associato al server.

```js
const http2 = require('http2');
const {
  HTTP2_HEADER_METHOD,
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_STATUS,
  HTTP2_HEADER_CONTENT_TYPE
} = http2.constants;

const options = getOptionsSomehow();

const server = http2.createSecureServer(options);
server.on('stream', (stream, headers, flags) => {
  const method = headers[HTTP2_HEADER_METHOD];
  const path = headers[HTTP2_HEADER_PATH];
  // ...
  stream.respond({
    [HTTP2_HEADER_STATUS]: 200,
    [HTTP2_HEADER_CONTENT_TYPE]: 'text/plain'
  });
  stream.write('hello ');
  stream.end('world');
});
```

#### Event: 'timeout'
<!-- YAML
added: v8.4.0
-->

L'evento `'timeout'` viene emesso quando non c'è attività sul Server per un determinato numero di millisecondi impostato utilizzando `http2secureServer.setTimeout()`. **Default:** 2 minutes.

#### Event: 'unknownProtocol'
<!-- YAML
added: v8.4.0
-->

L'evento `unknownProtocol` viene emesso quando un client in connessione non riesce a negoziare un protocollo consentito (cioè HTTP/2 o HTTP/1.1). L'event handler riceve il socket per la gestione. Se non è registrato nessun listener per questo evento, la connessione viene conclusa. Vedi l'[API di Compatibilità](#http2_compatibility_api).

#### server.close([callback])
<!-- YAML
added: v8.4.0
-->
- `callback` {Function}

Impedisce al server di accettare nuove connessioni.  Vedi [`tls.Server.close()`][].

Notare che ciò non è analogo a limitare nuove richieste poiché le connessioni HTTP/2 sono persistenti. Per ottenere un comportamento simile a uno spegnimento regolare, considerare anche l'utilizzo di [`http2session.close()`] nelle sessioni attive.

#### server.setTimeout(\[msecs\]\[, callback\])
<!-- YAML
added: v8.4.0
-->

* `msecs` {number} **Default:** `120000` (2 minuti)
* `callback` {Function}
* Restituisce: {Http2SecureServer}

Used to set the timeout value for http2 secure server requests, and sets a callback function that is called when there is no activity on the `Http2SecureServer` after `msecs` milliseconds.

The given callback is registered as a listener on the `'timeout'` event.

In case of no callback function were assigned, a new `ERR_INVALID_CALLBACK` error will be thrown.

### http2.createServer(options[, onRequestHandler])<!-- YAML
added: v8.4.0
changes:
  - version: v8.9.3
    pr-url: https://github.com/nodejs/node/pull/17105
    description: Added the `maxOutstandingPings` option with a default limit of
                 10. 
  - version: v8.9.3
    pr-url: https://github.com/nodejs/node/pull/16676
    description: Added the `maxHeaderListPairs` option with a default limit of
                 128 header pairs.
  - version: v8.12.0
    pr-url: https://github.com/nodejs/node/pull/15752
    description: Added the `Http1IncomingMessage` and `Http1ServerResponse`
                 option.
-->* `options` {Object}
  * `maxDeflateDynamicTableSize` {number} Imposta la dimensione massima della tabella dinamica per comprimere i campi dell'intestazione. **Default:** `4Kib`.
  * `maxSessionMemory`{number} Imposta la memoria massima che `Http2Session` ha il permesso di usare. Il valore è espresso in termini di numero di megabyte, ad esempio `1` uguale a 1 megabyte. Il valore minimo consentito è `1`. Questo è un limite basato su una stima, gli `Http2Stream` esistenti possono causare il superamento di questo limite, ma le nuove istanze `Http2Stream` verranno respinte quando questo limite viene superato. Il numero attuale di sessioni `Http2Stream`, l'utilizzo corrente della memoria delle tabelle di compressione dell'intestazione, i dati attuali in coda per essere inviati, i `PING` e i `SETTINGS` frame sono tutti conteggiati fino al limite attuale. **Default:** `10`.
  * `maxHeaderListPairs` {number} Imposta il numero massimo di voci di intestazione. Il valore minimo è `4`. **Default:** `128`.
  * `maxOutstandingPings` {number} Imposta il numero massimo di ping in sospeso, non riconosciuti. **Default:** `10`.
  * `maxSendHeaderBlockLength` {number} Imposta la dimensione massima consentita per un blocco di intestazioni serializzato e compresso. Tentativi di inviare intestazioni che superano questo limite comporteranno l'emissione di un evento `'frameError'` e la chiusura e la distruzione dello stream.
  * `paddingStrategy` {number} Identifies the strategy used for determining the amount of padding to use for `HEADERS` and `DATA` frames. **Default:** `http2.constants.PADDING_STRATEGY_NONE`. Il valore può essere uno tra:
     * `http2.constants.PADDING_STRATEGY_NONE` - Specifies that no padding is to be applied.
     * `http2.constants.PADDING_STRATEGY_MAX` - Specifies that the maximum amount of padding, as determined by the internal implementation, is to be applied.
     * `http2.constants.PADDING_STRATEGY_CALLBACK` - Specifies that the user provided `options.selectPadding` callback is to be used to determine the amount of padding.
     * `http2.constants.PADDING_STRATEGY_ALIGNED` - Will *attempt* to apply enough padding to ensure that the total frame length, including the 9-byte header, is a multiple of 8. For each frame, however, there is a maximum allowed number of padding bytes that is determined by current flow control state and settings. If this maximum is less than the calculated amount needed to ensure alignment, the maximum will be used and the total frame length will *not* necessarily be aligned at 8 bytes.
  * `peerMaxConcurrentStreams` {number} Imposta il numero massimo di stream simultanei per il peer remoto come se fosse stato ricevuto un `SETTINGS` frame. Verrà sovrascritto se il peer remoto imposta il proprio valore per `maxConcurrentStreams`. **Default:** `100`.
  * `selectPadding` {Function} Quando `options.paddingStrategy` è uguale a `http2.constants.PADDING_STRATEGY_CALLBACK`, fornisce la funzione callback utilizzata per determinare il padding. See [Using options.selectPadding](#http2_using_options_selectpadding).
  * `settings` {HTTP/2 Settings Object} Le impostazioni iniziali da inviare al peer remoto alla connessione.
  * `Http1IncomingMessage` {http.IncomingMessage} Specifies the IncomingMessage class to used for HTTP/1 fallback. Useful for extending the original `http.IncomingMessage`. **Default:** `http.IncomingMessage`.
  * `Http1ServerResponse` {http.ServerResponse} Specifies the ServerResponse class to used for HTTP/1 fallback. Utile per estendere il `http.ServerResponse` originale. **Default:** `http.ServerResponse`.
  * `Http2ServerRequest` {http2.Http2ServerRequest} Specifies the Http2ServerRequest class to use. Utile per estendere il `Http2ServerRequest` originale. **Default:** `Http2ServerRequest`.
  * `Http2ServerResponse` {http2.Http2ServerResponse} Specifies the Http2ServerResponse class to use. Utile per estendere il `Http2ServerResponse` originale. **Default:** `Http2ServerResponse`.
* `onRequestHandler` {Function} Vedi l'[API di Compatibilità](#http2_compatibility_api)
* Restituisce: {Http2Server}

Restituisce un'istanza `net.Server` che crea e gestisce le istanze `Http2Session`.

Poiché non ci sono browser conosciuti che supportino [HTTP/2 non crittografato](https://http2.github.io/faq/#does-http2-require-encryption), l'uso di [`http2.createSecureServer()`] [] è necessario durante la comunicazione con i client browser.

```js
const http2 = require('http2');

// Creare un HTTP/2 server non crittografato.
// Poiché non ci sono browser conosciuti che 
// supportino l'HTTP/2 non criptato, l'uso di 
// `http2.createSecureServer()` è necessario durante la comunicazione con i browser client.
const server = http2.createServer();

server.on('stream', (stream, headers) => {
  stream.respond({
    'content-type': 'text/html',
    ':status': 200
  });
  stream.end('<h1>Hello World</h1>');
});

server.listen(80);
```

### http2.createSecureServer(options[, onRequestHandler])<!-- YAML
added: v8.4.0
changes:
  - version: v8.13.0
    pr-url: https://github.com/nodejs/node/pull/22956
    description: Added the `origins` option to automatically send an `ORIGIN`
                 frame on `Http2Session` startup.
  - version: v8.9.3
    pr-url: https://github.com/nodejs/node/pull/17105
    description: Added the `maxOutstandingPings` option with a default limit of
                 10. 
  - version: v8.9.3
    pr-url: https://github.com/nodejs/node/pull/16676
    description: Added the `maxHeaderListPairs` option with a default limit of
                 128 header pairs.
-->* `options` {Object}
  * `allowHTTP1` {boolean} Le connessioni del client in entrata che non supportano HTTP/2 subiranno il downgrade a HTTP/1.x quando impostato su `true`. Vedi l'evento [`'unknownProtocol'`][]. Vedi [la negoziazione ALPN](#http2_alpn_negotiation). **Default:** `false`.
  * `maxDeflateDynamicTableSize` {number} Imposta la dimensione massima della tabella dinamica per comprimere i campi dell'intestazione. **Default:** `4Kib`.
  * `maxSessionMemory`{number} Imposta la memoria massima che `Http2Session` ha il permesso di usare. Il valore è espresso in termini di numero di megabyte, ad esempio `1` uguale a 1 megabyte. Il valore minimo consentito è `1`. Questo è un limite basato su una stima, gli `Http2Stream` esistenti possono causare il superamento di questo limite, ma le nuove istanze `Http2Stream` verranno respinte quando questo limite viene superato. Il numero attuale di sessioni `Http2Stream`, l'utilizzo corrente della memoria delle tabelle di compressione dell'intestazione, i dati attuali in coda per essere inviati, i `PING` e i `SETTINGS` frame sono tutti conteggiati fino al limite attuale. **Default:** `10`.
  * `maxHeaderListPairs` {number} Imposta il numero massimo di voci di intestazione. Il valore minimo è `4`. **Default:** `128`.
  * `maxOutstandingPings` {number} Imposta il numero massimo di ping in sospeso, non riconosciuti. **Default:** `10`.
  * `maxSendHeaderBlockLength` {number} Imposta la dimensione massima consentita per un blocco di intestazioni serializzato e compresso. Tentativi di inviare intestazioni che superano questo limite comporteranno l'emissione di un evento `'frameError'` e la chiusura e la distruzione dello stream.
  * `paddingStrategy` {number} Identifies the strategy used for determining the amount of padding to use for `HEADERS` and `DATA` frames. **Default:** `http2.constants.PADDING_STRATEGY_NONE`. Il valore può essere uno tra:
     * `http2.constants.PADDING_STRATEGY_NONE` - Specifies that no padding is to be applied.
     * `http2.constants.PADDING_STRATEGY_MAX` - Specifies that the maximum amount of padding, as determined by the internal implementation, is to be applied.
     * `http2.constants.PADDING_STRATEGY_CALLBACK` - Specifies that the user provided `options.selectPadding` callback is to be used to determine the amount of padding.
     * `http2.constants.PADDING_STRATEGY_ALIGNED` - Will *attempt* to apply enough padding to ensure that the total frame length, including the 9-byte header, is a multiple of 8. For each frame, however, there is a maximum allowed number of padding bytes that is determined by current flow control state and settings. If this maximum is less than the calculated amount needed to ensure alignment, the maximum will be used and the total frame length will *not* necessarily be aligned at 8 bytes.
  * `peerMaxConcurrentStreams` {number} Imposta il numero massimo di stream simultanei per il peer remoto come se fosse stato ricevuto un `SETTINGS` frame. Verrà sovrascritto se il peer remoto imposta il proprio valore per `maxConcurrentStreams`. **Default:** `100`.
  * `selectPadding` {Function} Quando `options.paddingStrategy` è uguale a `http2.constants.PADDING_STRATEGY_CALLBACK`, fornisce la funzione callback utilizzata per determinare il padding. See [Using options.selectPadding](#http2_using_options_selectpadding).
  * `settings` {HTTP/2 Settings Object} Le impostazioni iniziali da inviare al peer remoto alla connessione.
  * ...: Può essere fornita qualsiasi opzione di [`tls.createServer()`][]. Per i server, solitamente vengono richieste le opzioni di identità (`pfx` o `key`/`cert`).
  * `origins` {string[]} An array of origin strings to send within an `ORIGIN` frame immediately following creation of a new server `Http2Session`.
* `onRequestHandler` {Function} Vedi l'[API di Compatibilità](#http2_compatibility_api)
* Restituisce: {Http2SecureServer}

Restituisce un'istanza `tls.Server` che crea e gestisce le istanze `Http2Session`.

```js
const http2 = require('http2');
const fs = require('fs');

const options = {
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-cert.pem')
};

// Create a secure HTTP/2 server
const server = http2.createSecureServer(options);

server.on('stream', (stream, headers) => {
  stream.respond({
    'content-type': 'text/html',
    ':status': 200
  });
  stream.end('<h1>Hello World</h1>');
});

server.listen(80);
```

### http2.connect(authority\[, options\]\[, listener\])<!-- YAML
added: v8.4.0
changes:
  - version: v8.9.3
    pr-url: https://github.com/nodejs/node/pull/17105
    description: Added the `maxOutstandingPings` option with a default limit of
                 10. 
  - version: v8.9.3
    pr-url: https://github.com/nodejs/node/pull/16676
    description: Added the `maxHeaderListPairs` option with a default limit of
                 128 header pairs.
-->* `authority` {string|URL}
* `options` {Object}
  * `maxDeflateDynamicTableSize` {number} Imposta la dimensione massima della tabella dinamica per comprimere i campi dell'intestazione. **Default:** `4Kib`.
  * `maxSessionMemory`{number} Imposta la memoria massima che `Http2Session` ha il permesso di usare. Il valore è espresso in termini di numero di megabyte, ad esempio `1` uguale a 1 megabyte. Il valore minimo consentito è `1`. Questo è un limite basato su una stima, gli `Http2Stream` esistenti possono causare il superamento di questo limite, ma le nuove istanze `Http2Stream` verranno respinte quando questo limite viene superato. Il numero attuale di sessioni `Http2Stream`, l'utilizzo corrente della memoria delle tabelle di compressione dell'intestazione, i dati attuali in coda per essere inviati, i `PING` e i `SETTINGS` frame sono tutti conteggiati fino al limite attuale. **Default:** `10`.
  * `maxHeaderListPairs` {number} Imposta il numero massimo di voci di intestazione. Il valore minimo è `1`. **Default:** `128`.
  * `maxOutstandingPings` {number} Imposta il numero massimo di ping in sospeso, non riconosciuti. **Default:** `10`.
  * `maxReservedRemoteStreams` {number} Imposta il numero massimo di push stream riservati che il cliente accetterà in qualsiasi momento. Una volta che il numero corrente di push stream attualmente riservati raggiunge questo limite, nuovi push stream inviati dal server verranno automaticamente rifiutati.
  * `maxSendHeaderBlockLength` {number} Imposta la dimensione massima consentita per un blocco di intestazioni serializzato e compresso. Tentativi di inviare intestazioni che superano questo limite comporteranno l'emissione di un evento `'frameError'` e la chiusura e la distruzione dello stream.
  * `paddingStrategy` {number} Identifies the strategy used for determining the amount of padding to use for `HEADERS` and `DATA` frames. **Default:** `http2.constants.PADDING_STRATEGY_NONE`. Il valore può essere uno tra:
     * `http2.constants.PADDING_STRATEGY_NONE` - Specifies that no padding is to be applied.
     * `http2.constants.PADDING_STRATEGY_MAX` - Specifies that the maximum amount of padding, as determined by the internal implementation, is to be applied.
     * `http2.constants.PADDING_STRATEGY_CALLBACK` - Specifies that the user provided `options.selectPadding` callback is to be used to determine the amount of padding.
     * `http2.constants.PADDING_STRATEGY_ALIGNED` - Will *attempt* to apply enough padding to ensure that the total frame length, including the 9-byte header, is a multiple of 8. For each frame, however, there is a maximum allowed number of padding bytes that is determined by current flow control state and settings. If this maximum is less than the calculated amount needed to ensure alignment, the maximum will be used and the total frame length will *not* necessarily be aligned at 8 bytes.
  * `peerMaxConcurrentStreams` {number} Imposta il numero massimo di stream simultanei per il peer remoto come se fosse stato ricevuto un `SETTINGS` frame. Verrà sovrascritto se il peer remoto imposta il proprio valore per `maxConcurrentStreams`. **Default:** `100`.
  * `selectPadding` {Function} Quando `options.paddingStrategy` è uguale a `http2.constants.PADDING_STRATEGY_CALLBACK`, fornisce la funzione callback utilizzata per determinare il padding. See [Using options.selectPadding](#http2_using_options_selectpadding).
  * `settings` {HTTP/2 Settings Object} Le impostazioni iniziali da inviare al peer remoto alla connessione.
  * `createConnection` {Function} Un callback facoltativo che riceve l'istanza `URL` passata a `connect` e all'`options` object e restituisce qualsiasi [`Duplex`][] stream che deve essere utilizzato come connessione per questa sessione.
  * ...: Può essere fornita qualsiasi opzione [`net.connect()`][] o [`tls.connect()`][].
* `listener` {Function}
* Returns {ClientHttp2Session}

Restituisce un'istanza `ClientHttp2Session`.

```js
const http2 = require('http2');
const client = http2.connect('https://localhost:1234');

/** use the client **/

client.close();
```

### http2.constants
<!-- YAML
added: v8.4.0
-->

#### Codici di Errore per RST_STREAM e GOAWAY

<a id="error_codes"></a>

| Valore | Nome                | Costante                                      |
| ------ | ------------------- | --------------------------------------------- |
| 0x00   | No Error            | `http2.constants.NGHTTP2_NO_ERROR`            |
| 0x01   | Protocol Error      | `http2.constants.NGHTTP2_PROTOCOL_ERROR`      |
| 0x02   | Internal Error      | `http2.constants.NGHTTP2_INTERNAL_ERROR`      |
| 0x03   | Flow Control Error  | `http2.constants.NGHTTP2_FLOW_CONTROL_ERROR`  |
| 0x04   | Settings Timeout    | `http2.constants.NGHTTP2_SETTINGS_TIMEOUT`    |
| 0x05   | Stream Closed       | `http2.constants.NGHTTP2_STREAM_CLOSED`       |
| 0x06   | Frame Size Error    | `http2.constants.NGHTTP2_FRAME_SIZE_ERROR`    |
| 0x07   | Refused Stream      | `http2.constants.NGHTTP2_REFUSED_STREAM`      |
| 0x08   | Cancel              | `http2.constants.NGHTTP2_CANCEL`              |
| 0x09   | Compression Error   | `http2.constants.NGHTTP2_COMPRESSION_ERROR`   |
| 0x0a   | Connect Error       | `http2.constants.NGHTTP2_CONNECT_ERROR`       |
| 0x0b   | Enhance Your Calm   | `http2.constants.NGHTTP2_ENHANCE_YOUR_CALM`   |
| 0x0c   | Inadequate Security | `http2.constants.NGHTTP2_INADEQUATE_SECURITY` |
| 0x0d   | HTTP/1.1 Required   | `http2.constants.NGHTTP2_HTTP_1_1_REQUIRED`   |

L'evento `'timeout'` viene emesso quando non c'è attività sul Server per un determinato numero di millisecondi impostato utilizzando `http2server.setTimeout()`.

### http2.getDefaultSettings()
<!-- YAML
added: v8.4.0
-->

* Restituisce: {HTTP/2 Settings Object}

Restituisce un object contenente le impostazioni predefinite per un'istanza `Http2Session`. Questo metodo restituisce una nuova istanza dell'object ogni volta che viene chiamato così le istanze restituite possono essere modificate in modo sicuro per l'uso.

### http2.getPackedSettings(settings)
<!-- YAML
added: v8.4.0
-->

* `settings` {HTTP/2 Settings Object}
* Restituisce: {Buffer}

Restituisce un'istanza `Buffer` contenente la rappresentazione serializzata delle impostazioni HTTP/2 indicate come precisato nella specifica [HTTP/2](https://tools.ietf.org/html/rfc7540). Ciò è previsto per l'utilizzo con il campo dell'intestazione `HTTP2-Settings`.

```js
const http2 = require('http2');

const packed = http2.getPackedSettings({ enablePush: false });

console.log(packed.toString('base64'));
// Stampa: AAIAAAAA
```

### http2.getUnpackedSettings(buf)
<!-- YAML
added: v8.4.0
-->

* `buf` {Buffer|Uint8Array} Le impostazioni compresse.
* Restituisce: {HTTP/2 Settings Object}

Restituisce un [HTTP/2 Settings Object](#http2_settings_object) contenente le impostazioni deserializzate dal `Buffer` indicato generato da `http2.getPackedSettings()`.

### Object delle Intestazioni

Le intestazioni sono rappresentate come proprietà proprie sui JavaScript object. Le chiavi delle proprietà saranno serializzate in minuscolo. Property values should be strings (if they are not they will be coerced to strings) or an Array of strings (in order to send more than one value per header field).

Per esempio:

```js
const headers = {
  ':status': '200',
  'content-type': 'text-plain',
  'ABC': ['has', 'more', 'than', 'one', 'value']
};

stream.respond(headers);
```

*Note*: Header objects passed to callback functions will have a `null` prototype. This means that normal JavaScript object methods such as `Object.prototype.toString()` and `Object.prototype.hasOwnProperty()` will not work.

For incoming headers:
* The `:status` header is converted to `number`.
* Duplicates of `:status`, `:method`, `:authority`, `:scheme`, `:path`, `age`, `authorization`, `access-control-allow-credentials`, `access-control-max-age`, `access-control-request-method`, `content-encoding`, `content-language`, `content-length`, `content-location`, `content-md5`, `content-range`, `content-type`, `date`, `dnt`, `etag`, `expires`, `from`, `if-match`, `if-modified-since`, `if-none-match`, `if-range`, `if-unmodified-since`, `last-modified`, `location`, `max-forwards`, `proxy-authorization`, `range`, `referer`,`retry-after`, `tk`, `upgrade-insecure-requests`, `user-agent` or `x-content-type-options` are discarded.
* `set-cookie` è sempre un array. I duplicati vengono aggiunti all'array.
* `cookie`: the values are joined together with '; '.
* Per tutte le altre intestazioni, i valori vengono uniti con ', '.

```js
const http2 = require('http2');
const server = http2.createServer();
server.on('stream', (stream, headers) => {
  console.log(headers[':path']);
  console.log(headers.ABC);
});
```

### Object delle Impostazioni
<!-- YAML
added: v8.4.0
changes:
  - version: v8.9.3
    pr-url: https://github.com/nodejs/node/pull/16676
    description: The `maxHeaderListSize` setting is now strictly enforced.
-->
Le API 

`http2.getDefaultSettings()`, `http2.getPackedSettings()`, `http2.createServer()`, `http2.createSecureServer()`, `http2session.settings()`, `http2session.localSettings`, e `http2session.remoteSettings` restituiscono o ricevono come input un object che definisce le impostazioni di configurazione per un `Http2Session` object. Questi object sono JavaScript object ordinari che contengono le seguenti proprietà.

* `headerTableSize` {number} Specifica il numero massimo di byte utilizzati per la compressione dell'intestazione. Il valore minimo consentito è 0. Il valore massimo consentito è 2<sup>32</sup>-1. **Default:** `4,096 octets`.
* `enablePush` {boolean} Specifica `true` se gli HTTP/2 Push Stream devono essere consentiti sulle istanze `Http2Session`.
* `initialWindowSize` {number} Specifies the *senders* initial window size for stream-level flow control. Il valore minimo consentito è 0. Il valore massimo consentito è 2<sup>32</sup>-1. **Default:** `65,535 bytes`.
* `maxFrameSize` {number} Specifica la dimensione del più grande frame payload. Il valore minimo consentito è 16,384. Il valore massimo consentito è 2<sup>24</sup>-1. **Default:** `16,384 bytes`.
* `maxConcurrentStreams` {number} Specifica il numero massimo di stream simultanei consentiti su una `Http2Session`. Non c'è nessun valore predefinito il che implica, almeno teoricamente, che 2<sup>31</sup>-1 stream potrebbero essere aperti in forma simultanea in qualsiasi momento in una `Http2Session`. Il valore minimo è 0. Il valore massimo consentito è 2<sup>32</sup>-1.
* `maxHeaderListSize` {number} Specifica la dimensione massima (ottetti non compressi) dell'elenco di intestazioni che sarà accettata. Il valore minimo consentito è 0. Il valore massimo consentito è 2<sup>32</sup>-1. **Default:** `65535`.

Tutte le proprietà aggiuntive sull'object delle impostazioni vengono ignorate.

### Using `options.selectPadding`

When `options.paddingStrategy` is equal to `http2.constants.PADDING_STRATEGY_CALLBACK`, the HTTP/2 implementation will consult the `options.selectPadding` callback function, if provided, to determine the specific amount of padding to use per `HEADERS` and `DATA` frame.

The `options.selectPadding` function receives two numeric arguments, `frameLen` and `maxFrameLen` and must return a number `N` such that `frameLen <= N <= maxFrameLen`.

```js
const http2 = require('http2');
const server = http2.createServer({
  paddingStrategy: http2.constants.PADDING_STRATEGY_CALLBACK,
  selectPadding(frameLen, maxFrameLen) {
    return maxFrameLen;
  }
});
```

*Note*: The `options.selectPadding` function is invoked once for *every* `HEADERS` and `DATA` frame. This has a definite noticeable impact on performance.

### Gestione degli Errori

Ci sono diversi tipi di condizioni di errore che potrebbero presentarsi quando si utilizza il modulo `http2`:

Validation Errors occur when an incorrect argument, option, or setting value is passed in. Verranno sempre segnalati da un `throw` sincrono.

State Errors occur when an action is attempted at an incorrect time (for instance, attempting to send data on a stream after it has closed). Verranno segnalati utilizzando un `throw` sincrono o tramite un evento `'error'` sui Server object di `Http2Stream`, `Http2Session` o HTTP/2, a seconda di dove e quando si verifica l'errore.

Internal Errors occur when an HTTP/2 session fails unexpectedly. Verranno segnalati tramite un evento `'error'` sui Server object di `Http2Session` o HTTP/2.

Protocol Errors occur when various HTTP/2 protocol constraints are violated. Verranno segnalati utilizzando un `throw` sincrono o tramite un evento `'error'` sui Server object di `Http2Stream`, `Http2Session` o HTTP/2, a seconda di dove e quando si verifica l'errore.

### Gestione dei caratteri non validi nei nomi e nei valori dell'intestazione

L'implementazione HTTP/2 applica una gestione più rigorosa dei caratteri non validi nei nomi e nei valori dell'intestazione HTTP rispetto all'implementazione HTTP/1.

Header field names are *case-insensitive* and are transmitted over the wire strictly as lower-case strings. L'API fornita da Node.js consente di impostare i nomi dell'intestazione come stringhe con caratteri sia maiuscoli che minuscoli (es. `Content-Type`) ma li convertirà in minuscolo (es. `content-type`) al momento della trasmissione.

Header field-names *must only* contain one or more of the following ASCII characters: `a`-`z`, `A`-`Z`, `0`-`9`, `!`, `#`, `$`, `%`, `&`, `'`, `*`, `+`, `-`, `.`, `^`, `_`, `` ` `` (backtick), `|`, and `~`.

L'utilizzo di caratteri non validi all'interno del nome di un campo dell'intestazione HTTP causerà la chiusura dello stream con la segnalazione di un errore di protocollo.

Header field values are handled with more leniency but *should* not contain new-line or carriage return characters and *should* be limited to US-ASCII characters, per the requirements of the HTTP specification.

### Push stream sul client

Per ricevere stream sottoposti al push sul client, impostare un listener per l'evento `'stream'` sul `ClientHttp2Session`:

```js
const http2 = require('http2');

const client = http2.connect('http://localhost');

client.on('stream', (pushedStream, requestHeaders) => {
  pushedStream.on('push', (responseHeaders) => {
    // elabora le intestazioni di risposta
  });
  pushedStream.on('data', (chunk) => { /* handle pushed data */ });
});

const req = client.request({ ':path': '/' });
```

### Supportare il metodo CONNECT

Il metodo `CONNECT` viene usato per consentire l'utilizzo di un server HTTP/2 come proxy per connessioni TCP/IP.

Un semplice TCP Server:
```js
const net = require('net');

const server = net.createServer((socket) => {
  let name = '';
  socket.setEncoding('utf8');
  socket.on('data', (chunk) => name += chunk);
  socket.on('end', () => socket.end(`hello ${name}`));
});

server.listen(8000);
```

Un HTTP/2 CONNECT proxy:

```js
const http2 = require('http2');
const { NGHTTP2_REFUSED_STREAM } = http2.constants;
const net = require('net');
const { URL } = require('url');

const proxy = http2.createServer();
proxy.on('stream', (stream, headers) => {
  if (headers[':method'] !== 'CONNECT') {
    // Only accept CONNECT requests
    stream.close(NGHTTP2_REFUSED_STREAM);
    return;
  }
  const auth = new URL(`tcp://${headers[':authority']}`);
  // It's a very good idea to verify that hostname and port are
  // things this proxy should be connecting to.
  const socket = net.connect(auth.port, auth.hostname, () => {
    stream.respond();
    socket.pipe(stream);
    stream.pipe(socket);
  });
  socket.on('error', (error) => {
    stream.close(http2.constants.NGHTTP2_CONNECT_ERROR);
  });
});

proxy.listen(8001);
```

Un HTTP/2 CONNECT client:

```js
const http2 = require('http2');

const client = http2.connect('http://localhost:8001');

// Non deve specificare le intestazioni ':path' e ':scheme' 
// per le richieste CONNECT o verrà generato un errore.
const req = client.request({
  ':method': 'CONNECT',
  ':authority': `localhost:${port}`
});

req.on('response', (headers) => {
  console.log(headers[http2.constants.HTTP2_HEADER_STATUS]);
});
let data = '';
req.setEncoding('utf8');
req.on('data', (chunk) => data += chunk);
req.on('end', () => {
  console.log(`The server says: ${data}`);
  client.close();
});
req.end('Jane');
```

## API di Compatibilità

L'API di Compatibilità ha l'obiettivo di fornire un'esperienza di sviluppo simile a quella di HTTP/1 quando si utilizza HTTP/2, rendendo possibile sviluppare applicazioni che supportano sia [HTTP/1](http.html) sia HTTP/2. This API targets only the **public API** of the [HTTP/1](http.html). However many modules use internal methods or state, and those _are not supported_ as it is a completely different implementation.

Il seguente esempio crea un HTTP/2 server utilizzando l'API di compatibilità:

```js
const http2 = require('http2');
const server = http2.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

Per creare un server misto [HTTPS](https.html) e HTTP/2, fare riferimento alla sezione [negoziazione ALPN](#http2_alpn_negotiation). L'aggiornamento da server HTTP/1 non tls non è supportato.

L'API di compatibilità di HTTP/2 è composta da [`Http2ServerRequest`]() e [`Http2ServerResponse`](). Il loro scopo è la compatibilità dell'API con HTTP/1, tuttavia non nascondono le differenze tra i protocolli. Ad esempio, il messaggio di stato per i codici HTTP viene ignorato.

### Negoziazione ALPN

La negoziazione ALPN consente di supportare sia [HTTPS](https.html) che HTTP/2 sullo stesso socket. The `req` and `res` objects can be either HTTP/1 or HTTP/2, and an application **must** restrict itself to the public API of [HTTP/1](http.html), and detect if it is possible to use the more advanced features of HTTP/2.

L'esempio seguente crea un server che supporta entrambi i protocolli:

```js
const { createSecureServer } = require('http2');
const { readFileSync } = require('fs');

const cert = readFileSync('./cert.pem');
const key = readFileSync('./key.pem');

const server = createSecureServer(
  { cert, key, allowHTTP1: true },
  onRequest
).listen(4443);

function onRequest(req, res) {
  // rileva se è una richiesta HTTPS o HTTP/2
  const { socket: { alpnProtocol } } = req.httpVersion === '2.0' ?
    req.stream.session : req;
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({
    alpnProtocol,
    httpVersion: req.httpVersion
  }));
}
```

L'evento `'request'` funziona allo stesso modo sia su [HTTPS](https.html) che su HTTP/2.

### Class: http2.Http2ServerRequest
<!-- YAML
added: v8.4.0
-->

Un `Http2ServerRequest` object viene creato da [`http2.Server`][] o da [`http2.SecureServer`][] e viene trasmesso come primo argomento all'evento [`'request'`][]. Può essere utilizzato per accedere allo stato della richiesta, alle intestazioni e ai dati.

Implementa l'interfaccia [Readable Stream](stream.html#stream_class_stream_readable), come pure i seguenti eventi, metodi e proprietà aggiuntivi.

#### Event: 'aborted'
<!-- YAML
added: v8.4.0
-->

L'evento `'aborted'` viene emesso ogni volta che un'istanza `Http2ServerRequest` viene interrotta in modo anomalo nel mezzo della comunicazione.

*Note*: The `'aborted'` event will only be emitted if the `Http2ServerRequest` writable side has not been ended.

#### Event: 'close'
<!-- YAML
added: v8.4.0
-->

Indica che il [`Http2Stream`][] sottostante è stato chiuso. Proprio come `'end'`, questo evento si verifica una sola volta per ogni risposta.

#### request.aborted
<!-- YAML
added: v8.13.0
-->

* {boolean}

La proprietà `request.aborted` sarà `true` se la richiesta è stata interrotta.

#### request.destroy([error])
<!-- YAML
added: v8.4.0
-->

* `error` {Error}

Chiama `destroy()` sul [`Http2Stream`][] che ha ricevuto la [`Http2ServerRequest`][]. Se è previsto `error`, viene emesso un evento `'error'` ed `error` viene trasmesso come argomento a ogni listener dell'evento.

Non fa nulla se lo stream è già stato distrutto.

#### request.headers
<!-- YAML
added: v8.4.0
-->

* {Object}

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

Vedi [Object delle Intestazioni HTTP/2](#http2_headers_object).

*Note*: In HTTP/2, the request path, hostname, protocol, and method are represented as special headers prefixed with the `:` character (e.g. `':path'`). These special headers will be included in the `request.headers` object. Care must be taken not to inadvertently modify these special headers or errors may occur. For instance, removing all headers from the request will cause errors to occur:

```js
removeAllHeaders(request.headers);
assert(request.url);   // Fallisce perché l'intestazione :path è stata eliminata
```

#### request.httpVersion
<!-- YAML
added: v8.4.0
-->

* {string}

In caso di richiesta del server, la versione HTTP inviata dal client. Nel caso di una risposta del client, la versione HTTP del server connesso. Restituisce `'2.0'`.

Inoltre `message.httpVersionMajor` è il primo integrale e `message.httpVersionMinor` è il secondo.

#### request.method
<!-- YAML
added: v8.4.0
-->

* {string}

Il metodo di richiesta sotto forma di stringa. Solo lettura. Esempio: `'GET'`, `'DELETE'`.

#### request.rawHeaders
<!-- YAML
added: v8.4.0
-->

* {Array}

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

#### request.rawTrailers
<!-- YAML
added: v8.4.0
-->

* {Array}

Le chiavi ed i valori del trailer di richiesta/risposta raw, esattamente come sono stati ricevuti. Compilati esclusivamente nell'evento `'end'`.

#### request.setTimeout(msecs, callback)
<!-- YAML
added: v8.4.0
-->

* `msecs` {number}
* `callback` {Function}

Imposta il valore di timeout di [`Http2Stream`]() su `msecs`. Se viene fornito un callback, viene aggiunto come listener sull'evento `'timeout'` sull'object della risposta.

Se non viene aggiunto nessun listener `'timeout'` né alla richiesta, né alla risposta e neppure al server, allora gli [`Http2Stream`]() vengono distrutti nel momento in cui scadono. Se viene assegnato un handler agli eventi `'timeout'` della richiesta, della risposta o del server, i socket scaduti devono essere gestiti esplicitamente.

Returns `request`.

#### request.socket
<!-- YAML
added: v8.4.0
-->

* {net.Socket|tls.TLSSocket}

Returns a Proxy object that acts as a `net.Socket` (or `tls.TLSSocket`) but applies getters, setters, and methods based on HTTP/2 logic.

Le proprietà `destroyed`, `readable` e `writable` saranno recuperate e impostate su `request.stream`.

I metodi `destroy`, `emit`, `end`, `on` e `once` verranno chiamati su `request.stream`.

Il metodo `setTimeout` verrà chiamato su `request.stream.session`.

`pause`, `read`, `resume` e `write` genereranno un errore con codice `ERR_HTTP2_NO_SOCKET_MANIPULATION`. See [Http2Session and Sockets](#http2_http2session_and_sockets) for more information.

Tutte le altre interazioni verranno indirizzate direttamente al socket. Con il supporto TLS, utilizza [`request.socket.getPeerCertificate()`][] per ottenere i dettagli dell'autenticazione del client.

#### request.stream
<!-- YAML
added: v8.4.0
-->

* {http2.Http2Stream}

Il [`Http2Stream`][] object che supporta la richiesta.

#### request.trailers
<!-- YAML
added: v8.4.0
-->

* {Object}

L'object dei trailer di richiesta/risposta. Compilati esclusivamente nell'evento `'end'`.

#### request.url
<!-- YAML
added: v8.4.0
-->

* {string}

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

### Class: http2.Http2ServerResponse<!-- YAML
added: v8.4.0
-->Questo object viene creato internamente da un server HTTP — non dall'utente. Viene trasmesso all'evento [`'request'`][] come secondo parametro.

La risposta implementa, ma non eredita, l'interfaccia di [Writable Stream](stream.html#stream_writable_streams). Questo è un [`EventEmitter`][] con i seguenti eventi:

#### Event: 'close'
<!-- YAML
added: v8.4.0
-->

Indica che il [`Http2Stream`]() sottostante è stato interrotto prima che [`response.end()`][] venisse chiamato o potesse eseguire il flush.

#### Event: 'finish'
<!-- YAML
added: v8.4.0
-->

Emesso nel momento in cui la risposta è stata inviata. Più specificamente, questo evento viene emesso quando l'ultimo segmento delle intestazioni di risposta e il corpo sono stati consegnati al multiplexing di HTTP/2 per la trasmissione sulla rete. Ciò non implica che il client abbia ancora ricevuto qualcosa.

Dopo questo evento, nessun altro evento verrà emesso sull'object risposta.

#### response.addTrailers(headers)
<!-- YAML
added: v8.4.0
-->

* `headers` {Object}

Questo metodo aggiunge le intestazioni finali HTTP (un'intestazione ma alla fine del messaggio) alla risposta.

Se si tenta di impostare un nome o un valore di campo dell'intestazione che contiene caratteri non validi, verrà generato un [`TypeError`][].

#### response.connection
<!-- YAML
added: v8.4.0
-->

* {net.Socket|tls.TLSSocket}

Vedi [`response.socket`][].

#### response.end(\[data\]\[, encoding\][, callback])
<!-- YAML
added: v8.4.0
-->

* `data` {string|Buffer}
* `encoding` {string}
* `callback` {Function}

Questo metodo segnala al server che sono state inviate tutte le intestazioni e il corpo della risposta; quel server dovrebbe considerare questo messaggio completo. Il metodo, `response.end()`, DEVE essere chiamato su ogni risposta.

Se `data` è specificato, è equivalente alla chiamata di [`response.write(data, encoding)`][] seguito da `response.end(callback)`.

Se `callback` viene specificato, verrà chiamato al termine dello stream della risposta.

#### response.finished
<!-- YAML
added: v8.4.0
-->

* {boolean}

Valore booleano che indica se la risposta è stata completata. Inizia come `false`. Dopo che [`response.end()`][] viene eseguito, il valore sarà `true`.

#### response.getHeader(name)
<!-- YAML
added: v8.4.0
-->

* `name` {string}
* Restituisce: {string}

Legge un'intestazione che è già stata accodata ma non inviata al client. Notare che il nome è case insensitive.

Esempio:

```js
const contentType = response.getHeader('content-type');
```

#### response.getHeaderNames()
<!-- YAML
added: v8.4.0
-->

* Restituisce: {Array}

Restituisce un array contenente i nomi univoci delle intestazioni correnti in uscita. Tutti i nomi di intestazione sono in minuscolo.

Esempio:

```js
response.setHeader('Foo', 'bar');
response.setHeader('Set-Cookie', ['foo=bar', 'bar=baz']);

const headerNames = response.getHeaderNames();
// headerNames === ['foo', 'set-cookie']
```

#### response.getHeaders()
<!-- YAML
added: v8.4.0
-->

* Restituisce: {Object}

Restituisce una copia superficiale delle intestazioni correnti in uscita. Poiché viene utilizzata una copia superficiale, i valori dell'array possono essere mutati senza ulteriori chiamate a vari metodi del modulo http correlati all'intestazione. Le chiavi dell'object restituito sono i nomi delle intestazioni e i valori sono i rispettivi valori di intestazione. Tutti i nomi di intestazione sono in minuscolo.

*Note*: The object returned by the `response.getHeaders()` method _does not_ prototypically inherit from the JavaScript `Object`. Ciò significa che i tipici metodi `Object` come `obj.toString()`, `obj.hasOwnProperty()` e altri non vengono definiti e *non funzioneranno*.

Esempio:

```js
response.setHeader('Foo', 'bar');
response.setHeader('Set-Cookie', ['foo=bar', 'bar=baz']);

const headers = response.getHeaders();
// headers === { foo: 'bar', 'set-cookie': ['foo=bar', 'bar=baz'] }
```

#### response.hasHeader(name)
<!-- YAML
added: v8.4.0
-->

* `name` {string}
* Restituisce: {boolean}

Restituisce `true` se l'intestazione identificata dal `name` è attualmente impostata nelle intestazioni in uscita. Notare che la corrispondenza del nome dell'intestazione è case-insensitive.

Esempio:

```js
const hasContentType = response.hasHeader('content-type');
```

#### response.headersSent
<!-- YAML
added: v8.4.0
-->

* {boolean}

Boolean (sola lettura). True se le intestazioni sono state inviate, altrimenti false.

#### response.removeHeader(name)
<!-- YAML
added: v8.4.0
-->

* `name` {string}

Rimuove un'intestazione che è stata accodata per l'invio implicito.

Esempio:

```js
response.removeHeader('Content-Encoding');
```

#### response.sendDate
<!-- YAML
added: v8.4.0
-->

* {boolean}

Quando è true, l'intestazione Data verrà generata automaticamente e inviata nella risposta se non è già presente nelle intestazioni. Il valore predefinito è true.

Questo dovrebbe essere disabilitato solo per i test; HTTP richiede l'intestazione Data nelle risposte.

#### response.setHeader(name, value)
<!-- YAML
added: v8.4.0
-->

* `name` {string}
* `value` {string|string[]}

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

Quando le intestazioni sono state impostate con [`response.setHeader()`][], queste verranno unite a qualsiasi intestazione trasferita a [`response.writeHead()`][], dando la precedenza alle intestazioni trasferite a [`response.writeHead()`][].

```js
// restituisce content-type = text/plain
const server = http2.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

#### response.setTimeout(msecs[, callback])
<!-- YAML
added: v8.4.0
-->

* `msecs` {number}
* `callback` {Function}

Imposta il valore di timeout di [`Http2Stream`]() su `msecs`. Se viene fornito un callback, viene aggiunto come listener sull'evento `'timeout'` sull'object della risposta.

Se non viene aggiunto nessun listener `'timeout'` né alla richiesta, né alla risposta e neppure al server, allora gli [`Http2Stream`]() vengono distrutti nel momento in cui scadono. Se viene assegnato un handler agli eventi `'timeout'` della richiesta, della risposta o del server, i socket scaduti devono essere gestiti esplicitamente.

Returns `response`.

#### response.socket
<!-- YAML
added: v8.4.0
-->

* {net.Socket|tls.TLSSocket}

Returns a Proxy object that acts as a `net.Socket` (or `tls.TLSSocket`) but applies getters, setters, and methods based on HTTP/2 logic.

Le proprietà `destroyed`, `readable` e `writable` saranno recuperate e impostate su `response.stream`.

I metodi `destroy`, `emit`, `end`, `on` e `once` verranno chiamati su `response.stream`.

Il metodo `setTimeout` verrà chiamato su `response.stream.session`.

`pause`, `read`, `resume` e `write` genereranno un errore con codice `ERR_HTTP2_NO_SOCKET_MANIPULATION`. See [Http2Session and Sockets](#http2_http2session_and_sockets) for more information.

Tutte le altre interazioni verranno indirizzate direttamente al socket.

Esempio:

```js
const http2 = require('http2');
const server = http2.createServer((req, res) => {
  const ip = req.socket.remoteAddress;
  const port = req.socket.remotePort;
  res.end(`Il tuo indirizzo IP è ${ip} e la tua porta di origine è ${port}.`);
}).listen(3000);
```

#### response.statusCode
<!-- YAML
added: v8.4.0
-->

* {number}

Quando si utilizzano intestazioni implicite (senza chiamare [`response.writeHead()`][] esplicitamente), questa proprietà controlla il codice di stato che verrà inviato al client nel momento in cui le intestazioni vengono scaricate.

Esempio:

```js
response.statusCode = 404;
```

Dopo che l'intestazione di risposta è stata inviata al client, questa proprietà indica il codice di stato che è stato inviato.

#### response.statusMessage
<!-- YAML
added: v8.4.0
-->

* {string}

Il messaggio di stato non è supportato da HTTP/2 (RFC7540 8.1.2.4). Restituisce una stringa vuota.

#### response.stream
<!-- YAML
added: v8.4.0
-->

* {http2.Http2Stream}

Il [`Http2Stream`][] object che supporta la risposta.

#### response.write(chunk\[, encoding\]\[, callback\])
<!-- YAML
added: v8.4.0
-->

* `chunk` {string|Buffer}
* `encoding` {string}
* `callback` {Function}
* Restituisce: {boolean}

Se questo metodo viene chiamato e [`response.writeHead()`][] non è stato chiamato, passerà alla modalità dell'intestazione implicita e scaricherà le intestazioni implicite.

Questo invia un chunk del corpo della risposta. Questo metodo può essere chiamato più volte per fornire parti successive del corpo.

Da notare che nel modulo `http`, il corpo della risposta viene omesso quando la richiesta è una richiesta HEAD. Allo stesso modo, le risposte `204` e `304` _non devono_ includere un corpo del messaggio.

Il `chunk` può essere una stringa o un buffer. Se `chunk` è una stringa, il secondo parametro specifica come codificarlo in uno stream di byte. Di default l'`encoding` è `'utf8'`. `callback` verrà chiamato quando questo chunk di dati viene eliminato.

*Note*: This is the raw HTTP body and has nothing to do with higher-level multi-part body encodings that may be used.

La prima volta che [`response.write()`][] viene chiamato, invierà le informazioni dell'intestazione bufferizzate ed il primo chunk del corpo al client. La seconda volta in cui [`response.write()`][] viene chiamato, Node.js presuppone che verrà eseguito lo streaming dei dati, quindi invia i nuovi dati separatamente. Vale a dire, la risposta viene bufferizzata fino al primo chunk del corpo.

Restituisce `true ` se i dati interi sono stati scaricati con successo nel kernel buffer. Restituisce `false` se tutti o parte dei dati sono stati messi in coda nella memoria utente. `'drain'` verrà emesso quando il buffer è di nuovo libero.

#### response.writeContinue()
<!-- YAML
added: v8.4.0
-->

Invia uno stato `100 Continue` al client, il quale indica che il corpo della richiesta deve essere inviato. Vedi l'evento [`'checkContinue'`][] su `Http2Server` e `Http2SecureServer`.

#### response.writeHead(statusCode\[, statusMessage\]\[, headers\])
<!-- YAML
added: v8.4.0
-->

* `statusCode` {number}
* `statusMessage` {string}
* `headers` {Object}

Invia un'intestazione di risposta alla richiesta. Lo status code è un codice di stato HTTP a 3 cifre, come `404`. L'ultimo argomento, `headers`, è composto dalle intestazioni di risposta.

Per compatibilità con [HTTP/1](http.html), può essere trasmesso uno `statusMessage` leggibile come secondo argomento. Tuttavia, poiché lo `statusMessage` non ha significato all'interno di HTTP/2, l'argomento non avrà effetto e verrà emesso un avviso di processo.

Esempio:

```js
const body = 'hello world';
response.writeHead(200, {
  'Content-Length': Buffer.byteLength(body),
  'Content-Type': 'text/plain' });
```

Notare che il Content-Length è fornito in byte, non in caratteri. L'API di `Buffer.byteLength()` può essere utilizzata per determinare il numero di byte in una determinata codifica. Nei messaggi in uscita, Node.js non controlla se Content-Length e la lunghezza del corpo che viene trasmesso sono uguali o no. Tuttavia, quando riceve i messaggi, Node.js li rifiuterà automaticamente in caso la Content-Length non corrisponda alla dimensione del payload effettiva.

Questo metodo può essere chiamato su un messaggio al massimo una volta, prima che [`response.end()`][] venga chiamato.

Se [`response.write()`][] o [`response.end()`][] vengono chiamati prima della sua chiamata, verranno calcolate le intestazioni implicite/variabili e verrà chiamata questa funzione.

Quando le intestazioni sono state impostate con [`response.setHeader()`][], queste verranno unite a qualsiasi intestazione trasferita a [`response.writeHead()`][], dando la precedenza alle intestazioni trasferite a [`response.writeHead()`][].

```js
// restituisce content-type = text/plain
const server = http2.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

Se si tenta di impostare un nome o un valore di campo dell'intestazione che contiene caratteri non validi, verrà generato un [`TypeError`][].

#### response.createPushResponse(headers, callback)
<!-- YAML
added: v8.4.0
-->

* `headers` {HTTP/2 Headers Object} Un oggetto che descrive le intestazioni
* `callback` {Function} Called once `http2stream.pushStream()` is finished, or either when the attempt to create the pushed `Http2Stream` has failed or has been rejected, or the state of `Http2ServerRequest` is closed prior to calling the `http2stream.pushStream()` method
  * `err` {Error}
  * `stream` {ServerHttp2Stream} The newly-created `ServerHttp2Stream` object

Call [`http2stream.pushStream()`][] with the given headers, and wrap the given [`Http2Stream`] on a newly created `Http2ServerResponse` as the callback parameter if successful. When `Http2ServerRequest` is closed, the callback is called with an error `ERR_HTTP2_INVALID_STREAM`.

## Raccolta delle Metriche di Prestazione di HTTP/2

L'API del [Performance Observer](perf_hooks.html) può essere utilizzata per raccogliere le metriche delle prestazioni di base per ogni istanza `Http2Session` e `Http2Stream`.

```js
const { PerformanceObserver } = require('perf_hooks');

const obs = new PerformanceObserver((items) => {
  const entry = items.getEntries()[0];
  console.log(entry.entryType);  // prints 'http2'
  if (entry.name === 'Http2Session') {
    // entry contiene statistiche sul Http2Session
  } else if (entry.name === 'Http2Stream') {
    // entry contiene statistiche sul Http2Stream
  }
});
obs.observe({ entryTypes: ['http2'] });
```

La proprietà `entryType` della `PerformanceEntry` sarà uguale a `'http2'`.

La proprietà `name` della `PerformanceEntry` sarà uguale a `'Http2Stream'` o a `'Http2Session'`.

Se `name` è uguale a `Http2Stream`, la `PerformanceEntry` conterrà le seguenti proprietà aggiuntive:

* `bytesRead` {number} Il numero di byte del `DATA` frame ricevuti per questo `Http2Stream`.
* `bytesWritten` {number} Il numero di byte del `DATA` frame inviati per questo `Http2Stream`.
* `id` {number} L'identifier del `Http2Stream` associato
* `timeToFirstByte` {number} Il numero di millisecondi trascorsi tra la `PerformanceEntry` `startTime` e la ricezione del primo `DATA` frame.
* `timeToFirstByteSent` {number} Il numero di millisecondi trascorsi tra la `PerformanceEntry` `startTime` e l'invio del primo `DATA` frame.
* `timeToFirstHeader` {number} Il numero di millisecondi trascorsi tra la `PerformanceEntry` `startTime` e la ricezione della prima intestazione.

Se `name` è uguale a `Http2Session`, la `PerformanceEntry` conterrà le seguenti proprietà aggiuntive:

* `bytesRead` {number} Il numero di byte ricevuti per questa `Http2Session`.
* `bytesWritten` {number} Il numero di byte inviati per questa `Http2Session`.
* `framesReceived` {number} Il numero di HTTP/2 frame ricevuti da questa `Http2Session`.
* `framesSent` {number} Il numero di HTTP/2 frame inviati dalla `Http2Session`.
* `maxConcurrentStreams` {number} Il numero massimo di stream aperti simultaneamente durante la validità della `Http2Session`.
* `pingRTT` {number} Il numero di millisecondi trascorsi dalla trasmissione di un `PING` frame e dalla ricezione del suo riconoscimento. Solo presente se un `PING` frame è stato inviato sulla `Http2Session`.
* `streamAverageDuration` {number} La durata media (in millisecondi) per tutte le istanze `Http2Stream`.
* `streamCount` {number} Il numero di istanze `Http2Stream` processate dalla `Http2Session`.
* `type` {string} `'server'` o `'client'` per identificare il tipo di `Http2Session`.
