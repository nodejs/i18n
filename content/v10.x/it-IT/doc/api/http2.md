# HTTP/2

<!--introduced_in=v8.4.0-->

> Stabilità: 1 - Sperimentale

Il modulo `http2` fornisce un'implementazione del protocollo [HTTP/2](https://tools.ietf.org/html/rfc7540). Ci si può accedere utilizzando:

```js
const http2 = richiede('http2');
```

## Core API

L'API Core fornisce un'interfaccia di basso livello progettata specificatamente intorno al supporto per funzionalità del protocollo HTTP/2. È specificatamente *non* progettata per compatibilità con l'esistente API del modulo [HTTP/1](http.html). Tuttavia, la [Compatibilità API](#http2_compatibility_api) lo è.

Il Core API di `http2` è molto più simmetrico tra client e server rispetto all'API `http`. Ad esempio, la maggior parte degli eventi, come `'error'`, `'connect'` e `'stream'`, possono essere emessi sia dal codice del lato client che dal codice del lato server.

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

#### `Http2Session` ed i Socket

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

Il codice utente tipicamente non esegue direttamente il listening per questo evento.

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

Quando si utilizza `http2session.setting()` per inviare nuove impostazioni, le impostazioni modificate non hanno effetto finché non viene emesso l'evento `'localSettings'`.

```js
session.settings({ enablePush: false });

session.on('localSettings', (settings) => {
  /* Use the new settings */
});
```

#### Evento: 'remoteSettings'

<!-- YAML
added: v8.4.0
-->

* `settings` {HTTP/2 Settings Object} Una copia del frame `SETTINGS` ricevuto.

L'evento `'remoteSettings'` viene emesso quando viene ricevuto un nuovo frame `SETTINGS` dal peer connesso.

```js
session.on('remoteSettings', (settings) => {
  /* Use the new settings */
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

#### Evento: 'timeout'

<!-- YAML
added: v8.4.0
-->

Dopo che è stato usato il metodo `http2session.setTimeout()` per impostare il periodo di timeout per questa `Http2Session`, l'evento `'timeout'` viene emesso se non c'è attività su `Http2Session` dopo il numero configurato di millisecondi.

```js
session.setTimeout(2000);
session.on('timeout', () => { /* .. */ });
```

#### http2session.alpnProtocol

<!-- YAML
added: v9.4.0
-->

* {string|undefined}

Il valore sarà `undefined` se la `Http2Session` non è ancora connessa a un socket, `h2c` se la `Http2Session` non è collegata a un `TLSSocket`, o restituirà il valore della proprietà `alpnProtocol` del `TLSSocket` connesso.

#### http2session.close([callback])

<!-- YAML
added: v9.4.0
-->

* `callback` {Function}

Chiude con attenzione la `Http2Session`, consentendo a qualsiasi stream esistente di completarsi da solo e impedendo a nuove istanze `Http2Stream` di essere create. Una volta chiuso, `http2session.destroy()` *potrebbe* essere richiamato se non ci sono istanze `Http2Stream` aperte.

Se specificato, la funzione `callback` è registrata come gestore per l'evento `'close'`.

#### http2session.closed

<!-- YAML
added: v9.4.0
-->

* {boolean}

Sarà `true` se questa istanza `Http2Session` è stata chiusa, altrimenti `false`.

#### http2session.connecting

<!-- YAML
added: v10.0.0
-->

* {boolean}

Sarà `true` se questa istanza `Http2Session` è ancora in connessione, sarà impostata su `false` prima di emettere l'evento `connect` e/o chiamare il callback `http2.connect`.

#### http2session.destroy(\[error,\]\[code\])

<!-- YAML
added: v8.4.0
-->

* `error` {Error} Un `Error` object se la `Http2Session` viene distrutta a causa di un errore.
* `code` {number} Il codice di errore HTTP/2 da inviare nel frame `GOAWAY` finale. Se non specificato, e `error` non è indefinito, il valore predefinito è `INTERNAL_ERROR`, altrimenti il valore predefinito è `NO_ERROR`.

Termina immediatamente `Http2Session` e il `net.Socket` o `tls.TLSSocket` associati.

Una volta distrutto, `Http2Session` emetterà l'evento `'close'`. Se `error` non è indefinito, un evento `'error'` verrà emesso immediatamente prima dell'evento `'close'`.

Se sono rimasti aperti `Http2Streams` associati a `Http2Session`, anche quelli verranno distrutti.

#### http2session.destroyed

<!-- YAML
added: v8.4.0
-->

* {boolean}

Sarà `true` se questa istanza `Http2Session` è stata distrutta e non deve più essere utilizzata, altrimenti `false`.

#### http2session.encrypted

<!-- YAML
added: v9.4.0
-->

* {boolean|undefined}

Il valore è `undefined` se il socket di sessione `Http2Session` non è stato ancora connesso, sarà `true` se la `Http2Session` è connessa a un `TLSSocket` e `false` se la `Http2Session` è collegata a qualsiasi altro tipo di socket o stream.

#### http2session.goaway([code, [lastStreamID, [opaqueData]]])

<!-- YAML
added: v9.4.0
-->

* `code` {number} Un codice d'errore HTTP/2
* `lastStreamID` {number} L'ID numerico dell'ultimo `Http2Stream` elaborato
* `opaqueData` {Buffer|TypedArray|DataView} Un'istanza `"TypedArray"` o `"DataView"` contenente dati aggiuntivi da trasportare all'interno del frame `"GOAWAY"`.

Trasmette un frame `"GOAWAY"` al peer connesso *senza* spegnere la `"Http2Session"`.

#### http2session.localSettings

<!-- YAML
added: v8.4.0
-->

* {HTTP/2 Settings Object}

Un oggetto senza prototipo che descrive le attuali impostazioni locali di `"Http2Session"`. Le impostazioni locali sono locali per *questa* istanza `"Http2Session"`.

#### http2session.originSet

<!-- YAML
added: v9.4.0
-->

* {string[]|undefined}

Se `"Http2Session"` è connesso a `"TLSSocket"`, la proprietà `"originSet"` restituirà una `matrice` di origini per cui `"Http2Session"` può essere considerata autorevole.

#### http2session.pendingSettingsAck

<!-- YAML
added: v8.4.0
-->

* {boolean}

Indica se `"Http2Session"` è attualmente in attesa di un riconoscimento per un frame `"SETTINGS"` inviato. Sarà `"true"` dopo aver chiamato il metodo `"http2session.settings()"`. Sarà `falso` una volta che tutti i frame di IMPOSTAZIONI inviati sono stati riconosciuti.

#### http2session.ping([payload, ]callback)

<!-- YAML
added: v8.9.3
-->

* `payload` {Buffer|TypedArray|DataView} "Payload ping" facoltativo.
* `callback` {Function}
* Restituisce: {boolean}

Invia un frame `"PING"` al peer HTTP/2 connesso. È necessario fornire una funzione `"callback"`. Il metodo restituirà `"true"` se è stato inviato il `"PING"`, altrimenti restituirà `"false"`.

Il numero massimo di ping in sospeso (non riconosciuti) è determinato dall'opzione di configurazione `maxOutstandingPings`. Il massimo di default è 10.

Se fornito, il `"payload"` deve essere un `"Buffer"`, `"TypedArray"` o `"DataView"` contenenti 8 byte di dati che saranno trasmessi con il `"PING"` e restituiti con il riconoscimento ping.

Il "callback" sarà invocato con tre argomenti: un argomento di errore che sarà `"null"` se il `"PING"` è stato riconosciuto con successo, un argomento `"duration"` che riporta il numero di millisecondi trascorsi da quando il ping è stato inviato e quando il riconoscimento è stato ricevuto ed un `"Buffer"` contenente il payload di 8 byte `"PING"`.

```js
session.ping(Buffer.from('abcdefgh'), (err, duration, payload) => {
  if (!err) {
    console.log(`Ping acknowledged in ${duration} milliseconds`);
    console.log(`With payload '${payload.toString()}'`);
  }
});
```

Se l'argomento `"payload"` non è specificato, il payload predefinito sarà la marca temporale a 64-bit ("little endian") che segna l'inizio della durata del `"PING"`.

#### http2session.ref()

<!-- YAML
added: v9.4.0
-->

Chiama [`"ref()"`] [`"net.Socket.prototype.ref()"`] su questa istanza`"Http2Session"` sottostante a [`"net.Socket"`].

#### http2session.remoteSettings

<!-- YAML
added: v8.4.0
-->

* {HTTP/2 Settings Object}

Un oggetto senza prototipo che descrive le attuali impostazioni remote di `"Http2Session"`. Le impostazioni remote sono impostate dal peer HTTP/2 *connesso*.

#### http2session.setTimeout(msecs, callback)

<!-- YAML
added: v8.4.0
-->

* `msecs` {number}
* `callback` {Function}

Utilizzato per impostare una funzione di callback quando non ci sono attività su `Http2Session` dopo `"msecs"` millisecondi. La `callback` fornita è registrata come ascoltatore sull'evento `'timeout'`.

#### http2session.socket

<!-- YAML
added: v8.4.0
-->

* {net.Socket|tls.TLSSocket}

Restituisce un oggetto `Proxy` che funge da `net.Socket` (o `tls.TLSSocket`) ma limita i metodi disponibili a quelli sicuri da utilizzare con HTTP/2.

`destroy`, `emit`, `end`, `pause`, `read`, `resume`, and `write` genereranno un errore con il codice `ERR_HTTP2_NO_SOCKET_MANIPULATION`. Guardare [`Http2Session` ed i Socket][] per maggiori informazioni.

Il metodo `setTimeout` verrà chiamato su questa `Http2Session`.

Tutte le altre interazioni verranno indirizzate direttamente al socket.

#### http2session.state

<!-- YAML
added: v8.4.0
-->

Fornisce informazioni varie sullo stato attuale di `Http2Session`.

* {Object} 
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

Le nuove impostazioni non diventeranno effettive finché non viene ricevuto il riconoscimento `SETTINGS` e viene emesso l'evento `'localSettings'`. È possibile inviare più fotogrammi di `SETTINGS` mentre il riconoscimento è ancora in sospeso.

#### http2session.type

<!-- YAML
added: v8.4.0
-->

* {number}

`http2session.type` sarà uguale a `http2.constants.NGHTTP2_SESSION_SERVER` se questa istanza `Http2Session` è un server e `http2.constants.NGHTTP2_SESSION_CLIENT` se l'istanza è un client.

#### http2session.unref()

<!-- YAML
added: v9.4.0
-->

Chiama [`unref()`] [`net.Socket.prototype.unref()`] su questa istanza `Http2Session` sottostante a [`net.Socket`].

### Class: ServerHttp2Session

<!-- YAML
added: v8.4.0
-->

#### serverhttp2session.altsvc(alt, originOrStream)

<!-- YAML
added: v9.4.0
-->

* `alt` {string} Una descrizione della configurazione del servizio alternativo definita da [RFC 7838](https://tools.ietf.org/html/rfc7838).
* `originOrStream` {number|string|URL|Object} Può essere o una stringa URL che specifica l'origine (o un `Object` con una proprietà `origin`) o il valore numerico identificatore di un `Http2Stream` attivo come specificato dalla proprietà `http2stream.id`.

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

Un oggetto `URL`, o qualsiasi oggetto con una proprietà `origin`, può essere passato come `originOrStream`, nel qual caso il valore dell'`origin` sarà utilizzata. Il valore della proprietà `origin` *deve* essere un'origine ASCII correttamente serializzata.

#### Specifica di servizi alternativi

Il formato del parametro `alt` è rigorosamente definito da [RFC 7838](https://tools.ietf.org/html/rfc7838) come una stringa ASCII contenente un elenco delimitato da virgole di protocolli "alternativi" associati ad un host ed una porta specifici.

Ad esempio, il valore `'h2 = "example.org:81"'` indica che il protocollo HTTP/2 è disponibile sull'host `'example.org'` sulla porta TCP/IP 81. L'host e la porta *devono* essere contenuti all'interno di virgolette (`"`).

Possono essere specificate più alternative, ad esempio: `'h2="example.org:81",
h2=":82"'`.

L'identificativo del protocollo (`'h2'` negli esempi) può essere qualsiasi [ID protocollo ALPN](https://www.iana.org/assignments/tls-extensiontype-values/tls-extensiontype-values.xhtml#alpn-protocol-ids) valido.

La sintassi di questi valori non è convalidata dall'implementazione Node.js e viene trasmessa come fornita dall'utente o ricevuta dal peer.

### Corso: ClientHttp2Session

<!-- YAML
added: v8.4.0
-->

#### Evento: 'altsvc'

<!-- YAML
added: v9.4.0
-->

* `alt`: {string}
* `origin`: {string}
* `streamId`: {number}

L'evento `'altsvc'` viene emesso ogni volta che un frame `ALTSVC` viene ricevuto dal client. L'evento viene emesso con il valore `ALTSVC`, l'origine e l'ID del flusso. Se nessun `origin` è fornito nel frame `ALTSVC`, `origin` sarà una stringa vuota.

```js
const http2 = require('http2');
const client = http2.connect('https://example.org');

client.on('altsvc', (alt, origin, streamId) => {
  console.log(alt);
  console.log(origin);
  console.log(streamId);
});
```

#### clienthttp2session.request(headers[, options])

<!-- YAML
added: v8.4.0
-->

* `headers` {HTTP/2 Headers Object}
* `options` {Object}
  
  * `endStream` {boolean} Sarà `true` se il lato `Http2Stream` *scrivibile* dovrebbe essere chiuso inizialmente, ad esempio quando si invia una richiesta `GET` che non dovrebbe aspettarsi un corpo payload.
  * `exclusive` {boolean} Quando è `true` e `parent` identifica un flusso genitore, il flusso creato viene reso l'unica dipendenza diretta del genitore, e tutte le altre dipendenze esistenti sono rese dipendenti dal flusso appena creato. **Default:** `false`.
  * `parent` {number} Specifica l'identificatore numerico di un flusso dal quale il flusso appena creato dipende.
  * `weight` {number} Specifica la dipendenza relativa di un flusso in relazione ad altri flussi con lo stesso `parent`. Il valore è un numero che va da `1` a `256` (inclusi).
  * `waitForTrailers` {boolean} Quando è `true`, `Http2Stream` emetterà l'evento `'wantTrailers'` dopo che l'ultimo frame `DATA` è stato inviato.

* Restituisce: {ClientHttp2Stream}

Solo per istanze Client HTTP/2 `Http2Session`, l'`http2session.request()` crea e restituisce un'istanza `Http2Stream` che può essere utilizzata per inviare una richiesta HTTP/2 al server connesso.

Questo metodo è disponibile solo se `http2session.type` è uguale ad `http2.constants.NGHTTP2_SESSION_CLIENT`.

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
  req.on('data', (chunk) => { /* .. */ });
  req.on('end', () => { /* .. */ });
});
```

Quando l'opzione `options.waitForTrailers` è impostata, l'evento `'wantTrailers'` viene emesso immediatamente dopo aver accodato l'ultimo blocco di dati del payload da inviare. Il metodo `http2stream.sendTrailers()` può quindi essere chiamato per inviare intestazioni finali al peer.

È importante notare che quando è impostato `options.waitForTrailers`, `Http2Stream` *non* si chiuderà automaticamente quando il frame finale `DATA</0 > viene trasmesso. User code <em>must</em> call either <code>http2stream.sendTrailers()` or `http2stream.close()` to close the `Http2Stream`.

The `:method` and `:path` pseudo-headers are not specified within `headers`, they respectively default to:

* `:method` = `'GET'`
* `:path` = `/`

### Class: Http2Stream

<!-- YAML
added: v8.4.0
-->

* Extends: {stream.Duplex}

Each instance of the `Http2Stream` class represents a bidirectional HTTP/2 communications stream over an `Http2Session` instance. Any single `Http2Session` may have up to 2<sup>31</sup>-1 `Http2Stream` instances over its lifetime.

User code will not construct `Http2Stream` instances directly. Rather, these are created, managed, and provided to user code through the `Http2Session` instance. On the server, `Http2Stream` instances are created either in response to an incoming HTTP request (and handed off to user code via the `'stream'` event), or in response to a call to the `http2stream.pushStream()` method. On the client, `Http2Stream` instances are created and returned when either the `http2session.request()` method is called, or in response to an incoming `'push'` event.

The `Http2Stream` class is a base for the [`ServerHttp2Stream`][] and [`ClientHttp2Stream`][] classes, each of which is used specifically by either the Server or Client side, respectively.

All `Http2Stream` instances are [`Duplex`][] streams. The `Writable` side of the `Duplex` is used to send data to the connected peer, while the `Readable` side is used to receive data sent by the connected peer.

#### Http2Stream Lifecycle

##### Creation

On the server side, instances of [`ServerHttp2Stream`][] are created either when:

* A new HTTP/2 `HEADERS` frame with a previously unused stream ID is received;
* The `http2stream.pushStream()` method is called.

On the client side, instances of [`ClientHttp2Stream`][] are created when the `http2session.request()` method is called.

On the client, the `Http2Stream` instance returned by `http2session.request()` may not be immediately ready for use if the parent `Http2Session` has not yet been fully established. In such cases, operations called on the `Http2Stream` will be buffered until the `'ready'` event is emitted. User code should rarely, if ever, need to handle the `'ready'` event directly. The ready status of an `Http2Stream` can be determined by checking the value of `http2stream.id`. If the value is `undefined`, the stream is not yet ready for use.

##### Destruction

All [`Http2Stream`][] instances are destroyed either when:

* An `RST_STREAM` frame for the stream is received by the connected peer.
* The `http2stream.close()` method is called.
* The `http2stream.destroy()` or `http2session.destroy()` methods are called.

When an `Http2Stream` instance is destroyed, an attempt will be made to send an `RST_STREAM` frame will be sent to the connected peer.

When the `Http2Stream` instance is destroyed, the `'close'` event will be emitted. Because `Http2Stream` is an instance of `stream.Duplex`, the `'end'` event will also be emitted if the stream data is currently flowing. The `'error'` event may also be emitted if `http2stream.destroy()` was called with an `Error` passed as the first argument.

After the `Http2Stream` has been destroyed, the `http2stream.destroyed` property will be `true` and the `http2stream.rstCode` property will specify the `RST_STREAM` error code. The `Http2Stream` instance is no longer usable once destroyed.

#### Event: 'aborted'

<!-- YAML
added: v8.4.0
-->

The `'aborted'` event is emitted whenever a `Http2Stream` instance is abnormally aborted in mid-communication.

The `'aborted'` event will only be emitted if the `Http2Stream` writable side has not been ended.

#### Event: 'close'

<!-- YAML
added: v8.4.0
-->

The `'close'` event is emitted when the `Http2Stream` is destroyed. Once this event is emitted, the `Http2Stream` instance is no longer usable.

The HTTP/2 error code used when closing the stream can be retrieved using the `http2stream.rstCode` property. If the code is any value other than `NGHTTP2_NO_ERROR` (`0`), an `'error'` event will have also been emitted.

#### Event: 'error'

<!-- YAML
added: v8.4.0
-->

The `'error'` event is emitted when an error occurs during the processing of an `Http2Stream`.

#### Event: 'frameError'

<!-- YAML
added: v8.4.0
-->

The `'frameError'` event is emitted when an error occurs while attempting to send a frame. When invoked, the handler function will receive an integer argument identifying the frame type, and an integer argument identifying the error code. The `Http2Stream` instance will be destroyed immediately after the `'frameError'` event is emitted.

#### Event: 'timeout'

<!-- YAML
added: v8.4.0
-->

The `'timeout'` event is emitted after no activity is received for this `Http2Stream` within the number of milliseconds set using `http2stream.setTimeout()`.

#### Event: 'trailers'

<!-- YAML
added: v8.4.0
-->

The `'trailers'` event is emitted when a block of headers associated with trailing header fields is received. The listener callback is passed the [HTTP/2 Headers Object](#http2_headers_object) and flags associated with the headers.

```js
stream.on('trailers', (headers, flags) => {
  console.log(headers);
});
```

#### Event: 'wantTrailers'

<!-- YAML
added: v10.0.0
-->

The `'wantTrailers'` event is emitted when the `Http2Stream` has queued the final `DATA` frame to be sent on a frame and the `Http2Stream` is ready to send trailing headers. When initiating a request or response, the `waitForTrailers` option must be set for this event to be emitted.

#### http2stream.aborted

<!-- YAML
added: v8.4.0
-->

* {boolean}

Set to `true` if the `Http2Stream` instance was aborted abnormally. When set, the `'aborted'` event will have been emitted.

#### http2stream.close(code[, callback])

<!-- YAML
added: v8.4.0
-->

* `code` {number} Unsigned 32-bit integer identifying the error code. **Default:** `http2.constants.NGHTTP2_NO_ERROR` (`0x00`).
* `callback` {Function} An optional function registered to listen for the `'close'` event.

Closes the `Http2Stream` instance by sending an `RST_STREAM` frame to the connected HTTP/2 peer.

#### http2stream.closed

<!-- YAML
added: v9.4.0
-->

* {boolean}

Set to `true` if the `Http2Stream` instance has been closed.

#### http2stream.destroyed

<!-- YAML
added: v8.4.0
-->

* {boolean}

Set to `true` if the `Http2Stream` instance has been destroyed and is no longer usable.

#### http2stream.pending

<!-- YAML
added: v9.4.0
-->

* {boolean}

Set to `true` if the `Http2Stream` instance has not yet been assigned a numeric stream identifier.

#### http2stream.priority(options)

<!-- YAML
added: v8.4.0
-->

* `options` {Object} 
  * `exclusive` {boolean} When `true` and `parent` identifies a parent Stream, this stream is made the sole direct dependency of the parent, with all other existing dependents made a dependent of this stream. **Default:** `false`.
  * `parent` {number} Specifies the numeric identifier of a stream this stream is dependent on.
  * `weight` {number} Specifies the relative dependency of a stream in relation to other streams with the same `parent`. The value is a number between `1` and `256` (inclusive).
  * `silent` {boolean} When `true`, changes the priority locally without sending a `PRIORITY` frame to the connected peer.

Updates the priority for this `Http2Stream` instance.

#### http2stream.rstCode

<!-- YAML
added: v8.4.0
-->

* {number}

Set to the `RST_STREAM` [error code](#error_codes) reported when the `Http2Stream` is destroyed after either receiving an `RST_STREAM` frame from the connected peer, calling `http2stream.close()`, or `http2stream.destroy()`. Will be `undefined` if the `Http2Stream` has not been closed.

#### http2stream.sentHeaders

<!-- YAML
added: v9.5.0
-->

* {HTTP/2 Headers Object}

An object containing the outbound headers sent for this `Http2Stream`.

#### http2stream.sentInfoHeaders

<!-- YAML
added: v9.5.0
-->

* {HTTP/2 Headers Object[]}

An array of objects containing the outbound informational (additional) headers sent for this `Http2Stream`.

#### http2stream.sentTrailers

<!-- YAML
added: v9.5.0
-->

* {HTTP/2 Headers Object}

An object containing the outbound trailers sent for this this `HttpStream`.

#### http2stream.session

<!-- YAML
added: v8.4.0
-->

* {Http2Session}

A reference to the `Http2Session` instance that owns this `Http2Stream`. The value will be `undefined` after the `Http2Stream` instance is destroyed.

#### http2stream.setTimeout(msecs, callback)

<!-- YAML
added: v8.4.0
-->

* `msecs` {number}
* `callback` {Function}

```js
const http2 = require('http2');
const client = http2.connect('http://example.org:8000');
const { NGHTTP2_CANCEL } = http2.constants;
const req = client.request({ ':path': '/' });

// Cancel the stream if there's no activity after 5 seconds
req.setTimeout(5000, () => req.close(NGHTTP2_CANCEL));
```

#### http2stream.state

<!-- YAML
added: v8.4.0
--> Provides miscellaneous information about the current state of the 

`Http2Stream`.

* {Object} 
  * `localWindowSize` {number} The number of bytes the connected peer may send for this `Http2Stream` without receiving a `WINDOW_UPDATE`.
  * `state` {number} A flag indicating the low-level current state of the `Http2Stream` as determined by `nghttp2`.
  * `localClose` {number} `true` if this `Http2Stream` has been closed locally.
  * `remoteClose` {number} `true` if this `Http2Stream` has been closed remotely.
  * `sumDependencyWeight` {number} The sum weight of all `Http2Stream` instances that depend on this `Http2Stream` as specified using `PRIORITY` frames.
  * `weight` {number} The priority weight of this `Http2Stream`.

A current state of this `Http2Stream`.

#### http2stream.sendTrailers(headers)

<!-- YAML
added: v10.0.0
-->

* `headers` {HTTP/2 Headers Object}

Sends a trailing `HEADERS` frame to the connected HTTP/2 peer. This method will cause the `Http2Stream` to be immediately closed and must only be called after the `'wantTrailers'` event has been emitted. When sending a request or sending a response, the `options.waitForTrailers` option must be set in order to keep the `Http2Stream` open after the final `DATA` frame so that trailers can be sent.

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

The HTTP/1 specification forbids trailers from containing HTTP/2 pseudo-header fields (e.g. `':method'`, `':path'`, etc).

### Class: ClientHttp2Stream

<!-- YAML
added: v8.4.0
-->

* Extends {Http2Stream}

The `ClientHttp2Stream` class is an extension of `Http2Stream` that is used exclusively on HTTP/2 Clients. `Http2Stream` instances on the client provide events such as `'response'` and `'push'` that are only relevant on the client.

#### Event: 'continue'

<!-- YAML
added: v8.5.0
-->

Emitted when the server sends a `100 Continue` status, usually because the request contained `Expect: 100-continue`. This is an instruction that the client should send the request body.

#### Event: 'headers'

<!-- YAML
added: v8.4.0
-->

The `'headers'` event is emitted when an additional block of headers is received for a stream, such as when a block of `1xx` informational headers is received. The listener callback is passed the [HTTP/2 Headers Object](#http2_headers_object) and flags associated with the headers.

```js
stream.on('headers', (headers, flags) => {
  console.log(headers);
});
```

#### Event: 'push'

<!-- YAML
added: v8.4.0
-->

The `'push'` event is emitted when response headers for a Server Push stream are received. The listener callback is passed the [HTTP/2 Headers Object](#http2_headers_object) and flags associated with the headers.

```js
stream.on('push', (headers, flags) => {
  console.log(headers);
});
```

#### Event: 'response'

<!-- YAML
added: v8.4.0
-->

The `'response'` event is emitted when a response `HEADERS` frame has been received for this stream from the connected HTTP/2 server. The listener is invoked with two arguments: an `Object` containing the received [HTTP/2 Headers Object](#http2_headers_object), and flags associated with the headers.

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

The `ServerHttp2Stream` class is an extension of [`Http2Stream`][] that is used exclusively on HTTP/2 Servers. `Http2Stream` instances on the server provide additional methods such as `http2stream.pushStream()` and `http2stream.respond()` that are only relevant on the server.

#### http2stream.additionalHeaders(headers)

<!-- YAML
added: v8.4.0
-->

* `headers` {HTTP/2 Headers Object}

Sends an additional informational `HEADERS` frame to the connected HTTP/2 peer.

#### http2stream.headersSent

<!-- YAML
added: v8.4.0
-->

* {boolean}

True if headers were sent, false otherwise (read-only).

#### http2stream.pushAllowed

<!-- YAML
added: v8.4.0
-->

* {boolean}

Read-only property mapped to the `SETTINGS_ENABLE_PUSH` flag of the remote client's most recent `SETTINGS` frame. Will be `true` if the remote peer accepts push streams, `false` otherwise. Settings are the same for every `Http2Stream` in the same `Http2Session`.

#### http2stream.pushStream(headers[, options], callback)

<!-- YAML
added: v8.4.0
-->

* `headers` {HTTP/2 Headers Object}
* `options` {Object} 
  * `exclusive` {boolean} When `true` and `parent` identifies a parent Stream, the created stream is made the sole direct dependency of the parent, with all other existing dependents made a dependent of the newly created stream. **Default:** `false`.
  * `parent` {number} Specifies the numeric identifier of a stream the newly created stream is dependent on.
* `callback` {Function} Callback that is called once the push stream has been initiated. 
  * `err` {Error}
  * `pushStream` {ServerHttp2Stream} The returned `pushStream` object.
  * `headers` {HTTP/2 Headers Object} Headers object the `pushStream` was initiated with.

Initiates a push stream. The callback is invoked with the new `Http2Stream` instance created for the push stream passed as the second argument, or an `Error` passed as the first argument.

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

Setting the weight of a push stream is not allowed in the `HEADERS` frame. Pass a `weight` value to `http2stream.priority` with the `silent` option set to `true` to enable server-side bandwidth balancing between concurrent streams.

#### http2stream.respond([headers[, options]])

<!-- YAML
added: v8.4.0
-->

* `headers` {HTTP/2 Headers Object}
* `options` {Object} 
  * `endStream` {boolean} Set to `true` to indicate that the response will not include payload data.
  * `waitForTrailers` {boolean} Quando è `true`, `Http2Stream` emetterà l'evento `'wantTrailers'` dopo che l'ultimo frame `DATA` è stato inviato.

```js
const http2 = require('http2');
const server = http2.createServer();
server.on('stream', (stream) => {
  stream.respond({ ':status': 200 });
  stream.end('some data');
});
```

When the `options.waitForTrailers` option is set, the `'wantTrailers'` event will be emitted immediately after queuing the last chunk of payload data to be sent. The `http2stream.sendTrailers()` method can then be used to sent trailing header fields to the peer.

È importante notare che quando è impostato `options.waitForTrailers`, `Http2Stream` *non* si chiuderà automaticamente quando il frame finale `DATA</0 > viene trasmesso. User code <em>must</em> call either <code>http2stream.sendTrailers()` or `http2stream.close()` to close the `Http2Stream`.

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
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18936
    description: Any readable file descriptor, not necessarily for a
                 regular file, is supported now.
-->

* `fd` {number} A readable file descriptor.
* `headers` {HTTP/2 Headers Object}
* `options` {Object} 
  * `statCheck` {Function}
  * `waitForTrailers` {boolean} Quando è `true`, `Http2Stream` emetterà l'evento `'wantTrailers'` dopo che l'ultimo frame `DATA` è stato inviato.
  * `offset` {number} The offset position at which to begin reading.
  * `length` {number} The amount of data from the fd to send.

Initiates a response whose data is read from the given file descriptor. No validation is performed on the given file descriptor. If an error occurs while attempting to read data using the file descriptor, the `Http2Stream` will be closed using an `RST_STREAM` frame using the standard `INTERNAL_ERROR` code.

When used, the `Http2Stream` object's `Duplex` interface will be closed automatically.

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

The optional `options.statCheck` function may be specified to give user code an opportunity to set additional content headers based on the `fs.Stat` details of the given fd. If the `statCheck` function is provided, the `http2stream.respondWithFD()` method will perform an `fs.fstat()` call to collect details on the provided file descriptor.

The `offset` and `length` options may be used to limit the response to a specific range subset. This can be used, for instance, to support HTTP Range requests.

The file descriptor is not closed when the stream is closed, so it will need to be closed manually once it is no longer needed. Note that using the same file descriptor concurrently for multiple streams is not supported and may result in data loss. Re-using a file descriptor after a stream has finished is supported.

When the `options.waitForTrailers` option is set, the `'wantTrailers'` event will be emitted immediately after queuing the last chunk of payload data to be sent. The `http2stream.sendTrailers()` method can then be used to sent trailing header fields to the peer.

È importante notare che quando è impostato `options.waitForTrailers`, `Http2Stream` *non* si chiuderà automaticamente quando il frame finale `DATA</0 > viene trasmesso. User code <em>must</em> call either <code>http2stream.sendTrailers()` or `http2stream.close()` to close the `Http2Stream`.

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
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18936
    description: Any readable file, not necessarily a
                 regular file, is supported now.
-->

* `path` {string|Buffer|URL}
* `headers` {HTTP/2 Headers Object}
* `options` {Object} 
  * `statCheck` {Function}
  * `onError` {Function} Callback function invoked in the case of an error before send.
  * `waitForTrailers` {boolean} Quando è `true`, `Http2Stream` emetterà l'evento `'wantTrailers'` dopo che l'ultimo frame `DATA` è stato inviato.
  * `offset` {number} The offset position at which to begin reading.
  * `length` {number} The amount of data from the fd to send.

Sends a regular file as the response. The `path` must specify a regular file or an `'error'` event will be emitted on the `Http2Stream` object.

When used, the `Http2Stream` object's `Duplex` interface will be closed automatically.

The optional `options.statCheck` function may be specified to give user code an opportunity to set additional content headers based on the `fs.Stat` details of the given file:

If an error occurs while attempting to read the file data, the `Http2Stream` will be closed using an `RST_STREAM` frame using the standard `INTERNAL_ERROR` code. If the `onError` callback is defined, then it will be called. Otherwise the stream will be destroyed.

Example using a file path:

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

The `options.statCheck` function may also be used to cancel the send operation by returning `false`. For instance, a conditional request may check the stat results to determine if the file has been modified to return an appropriate `304` response:

```js
const http2 = require('http2');
const server = http2.createServer();
server.on('stream', (stream) => {
  function statCheck(stat, headers) {
    // Check the stat here...
    stream.respond({ ':status': 304 });
    return false; // Cancel the send operation
  }
  stream.respondWithFile('/some/file',
                         { 'content-type': 'text/plain' },
                         { statCheck });
});
```

The `content-length` header field will be automatically set.

The `offset` and `length` options may be used to limit the response to a specific range subset. This can be used, for instance, to support HTTP Range requests.

The `options.onError` function may also be used to handle all the errors that could happen before the delivery of the file is initiated. The default behavior is to destroy the stream.

When the `options.waitForTrailers` option is set, the `'wantTrailers'` event will be emitted immediately after queuing the last chunk of payload data to be sent. The `http2stream.sendTrilers()` method can then be used to sent trailing header fields to the peer.

È importante notare che quando è impostato `options.waitForTrailers`, `Http2Stream` *non* si chiuderà automaticamente quando il frame finale `DATA</0 > viene trasmesso. User code <em>must</em> call either <code>http2stream.sendTrailers()` or `http2stream.close()` to close the `Http2Stream`.

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

* Extends: {net.Server}

In `Http2Server`, there are no `'clientError'` events as there are in HTTP1. However, there are `'sessionError'`, and `'streamError'` events for errors emitted on the socket, or from `Http2Session` or `Http2Stream` instances.

#### Event: 'checkContinue'

<!-- YAML
added: v8.5.0
-->

* `request` {http2.Http2ServerRequest}
* `response` {http2.Http2ServerResponse}

If a [`'request'`][] listener is registered or [`http2.createServer()`][] is supplied a callback function, the `'checkContinue'` event is emitted each time a request with an HTTP `Expect: 100-continue` is received. If this event is not listened for, the server will automatically respond with a status `100 Continue` as appropriate.

Handling this event involves calling [`response.writeContinue()`][] if the client should continue to send the request body, or generating an appropriate HTTP response (e.g. 400 Bad Request) if the client should not continue to send the request body.

Note that when this event is emitted and handled, the [`'request'`][] event will not be emitted.

#### Event: 'request'

<!-- YAML
added: v8.4.0
-->

* `request` {http2.Http2ServerRequest}
* `response` {http2.Http2ServerResponse}

Emitted each time there is a request. Note that there may be multiple requests per session. See the [Compatibility API](#http2_compatibility_api).

#### Event: 'session'

<!-- YAML
added: v8.4.0
-->

The `'session'` event is emitted when a new `Http2Session` is created by the `Http2Server`.

#### Event: 'sessionError'

<!-- YAML
added: v8.4.0
-->

The `'sessionError'` event is emitted when an `'error'` event is emitted by an `Http2Session` object associated with the `Http2Server`.

#### Event: 'streamError'

<!-- YAML
added: v8.5.0
-->

If a `ServerHttp2Stream` emits an `'error'` event, it will be forwarded here. The stream will already be destroyed when this event is triggered.

#### Event: 'stream'

<!-- YAML
added: v8.4.0
-->

The `'stream'` event is emitted when a `'stream'` event has been emitted by an `Http2Session` associated with the server.

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

The `'timeout'` event is emitted when there is no activity on the Server for a given number of milliseconds set using `http2server.setTimeout()`.

#### server.close([callback])

<!-- YAML
added: v8.4.0
-->

* `callback` {Function}

Stops the server from accepting new connections. See [`net.Server.close()`][].

Note that this is not analogous to restricting new requests since HTTP/2 connections are persistent. To achieve a similar graceful shutdown behavior, consider also using [`http2session.close()`] on active sessions.

### Class: Http2SecureServer

<!-- YAML
added: v8.4.0
-->

* Extends: {tls.Server}

#### Event: 'checkContinue'

<!-- YAML
added: v8.5.0
-->

* `request` {http2.Http2ServerRequest}
* `response` {http2.Http2ServerResponse}

If a [`'request'`][] listener is registered or [`http2.createSecureServer()`][] is supplied a callback function, the `'checkContinue'` event is emitted each time a request with an HTTP `Expect: 100-continue` is received. If this event is not listened for, the server will automatically respond with a status `100 Continue` as appropriate.

Handling this event involves calling [`response.writeContinue()`][] if the client should continue to send the request body, or generating an appropriate HTTP response (e.g. 400 Bad Request) if the client should not continue to send the request body.

Note that when this event is emitted and handled, the [`'request'`][] event will not be emitted.

#### Event: 'request'

<!-- YAML
added: v8.4.0
-->

* `request` {http2.Http2ServerRequest}
* `response` {http2.Http2ServerResponse}

Emitted each time there is a request. Note that there may be multiple requests per session. See the [Compatibility API](#http2_compatibility_api).

#### Event: 'session'

<!-- YAML
added: v8.4.0
-->

The `'session'` event is emitted when a new `Http2Session` is created by the `Http2SecureServer`.

#### Event: 'sessionError'

<!-- YAML
added: v8.4.0
-->

The `'sessionError'` event is emitted when an `'error'` event is emitted by an `Http2Session` object associated with the `Http2SecureServer`.

#### Event: 'stream'

<!-- YAML
added: v8.4.0
-->

The `'stream'` event is emitted when a `'stream'` event has been emitted by an `Http2Session` associated with the server.

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

The `'timeout'` event is emitted when there is no activity on the Server for a given number of milliseconds set using `http2secureServer.setTimeout()`.

#### Event: 'unknownProtocol'

<!-- YAML
added: v8.4.0
-->

The `'unknownProtocol'` event is emitted when a connecting client fails to negotiate an allowed protocol (i.e. HTTP/2 or HTTP/1.1). The event handler receives the socket for handling. If no listener is registered for this event, the connection is terminated. See the [Compatibility API](#http2_compatibility_api).

#### server.close([callback])

<!-- YAML
added: v8.4.0
-->

* `callback` {Function}

Stops the server from accepting new connections. See [`tls.Server.close()`][].

Note that this is not analogous to restricting new requests since HTTP/2 connections are persistent. To achieve a similar graceful shutdown behavior, consider also using [`http2session.close()`] on active sessions.

### http2.createServer(options[, onRequestHandler])

<!-- YAML
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
  - version: v9.6.0
    pr-url: https://github.com/nodejs/node/pull/15752
    description: Added the `Http1IncomingMessage` and `Http1ServerResponse`
                 option.
-->

* `options` {Object} 
  * `maxDeflateDynamicTableSize` {number} Sets the maximum dynamic table size for deflating header fields. **Default:** `4Kib`.
  * `maxSessionMemory`{number} Sets the maximum memory that the `Http2Session` is permitted to use. The value is expressed in terms of number of megabytes, e.g. `1` equal 1 megabyte. The minimum value allowed is `1`. This is a credit based limit, existing `Http2Stream`s may cause this limit to be exceeded, but new `Http2Stream` instances will be rejected while this limit is exceeded. The current number of `Http2Stream` sessions, the current memory use of the header compression tables, current data queued to be sent, and unacknowledged `PING` and `SETTINGS` frames are all counted towards the current limit. **Default:** `10`.
  * `maxHeaderListPairs` {number} Sets the maximum number of header entries. The minimum value is `4`. **Default:** `128`.
  * `maxOutstandingPings` {number} Sets the maximum number of outstanding, unacknowledged pings. **Default:** `10`.
  * `maxSendHeaderBlockLength` {number} Sets the maximum allowed size for a serialized, compressed block of headers. Attempts to send headers that exceed this limit will result in a `'frameError'` event being emitted and the stream being closed and destroyed.
  * `paddingStrategy` {number} Identifies the strategy used for determining the amount of padding to use for `HEADERS` and `DATA` frames. **Default:** `http2.constants.PADDING_STRATEGY_NONE`. Value may be one of: 
    * `http2.constants.PADDING_STRATEGY_NONE` - Specifies that no padding is to be applied.
    * `http2.constants.PADDING_STRATEGY_MAX` - Specifies that the maximum amount of padding, as determined by the internal implementation, is to be applied.
    * `http2.constants.PADDING_STRATEGY_CALLBACK` - Specifies that the user provided `options.selectPadding()` callback is to be used to determine the amount of padding.
    * `http2.constants.PADDING_STRATEGY_ALIGNED` - Will *attempt* to apply enough padding to ensure that the total frame length, including the 9-byte header, is a multiple of 8. For each frame, however, there is a maximum allowed number of padding bytes that is determined by current flow control state and settings. If this maximum is less than the calculated amount needed to ensure alignment, the maximum will be used and the total frame length will *not* necessarily be aligned at 8 bytes.
  * `peerMaxConcurrentStreams` {number} Sets the maximum number of concurrent streams for the remote peer as if a `SETTINGS` frame had been received. Will be overridden if the remote peer sets its own value for `maxConcurrentStreams`. **Default:** `100`.
  * `selectPadding` {Function} When `options.paddingStrategy` is equal to `http2.constants.PADDING_STRATEGY_CALLBACK`, provides the callback function used to determine the padding. See [Using `options.selectPadding()`][].
  * `settings` {HTTP/2 Settings Object} The initial settings to send to the remote peer upon connection.
  * `Http1IncomingMessage` {http.IncomingMessage} Specifies the `IncomingMessage` class to used for HTTP/1 fallback. Useful for extending the original `http.IncomingMessage`. **Default:** `http.IncomingMessage`.
  * `Http1ServerResponse` {http.ServerResponse} Specifies the `ServerResponse` class to used for HTTP/1 fallback. Useful for extending the original `http.ServerResponse`. **Default:** `http.ServerResponse`.
  * `Http2ServerRequest` {http2.Http2ServerRequest} Specifies the `Http2ServerRequest` class to use. Useful for extending the original `Http2ServerRequest`. **Default:** `Http2ServerRequest`.
  * `Http2ServerResponse` {http2.Http2ServerResponse} Specifies the `Http2ServerResponse` class to use. Useful for extending the original `Http2ServerResponse`. **Default:** `Http2ServerResponse`.
* `onRequestHandler` {Function} See [Compatibility API](#http2_compatibility_api)
* Returns: {Http2Server}

Returns a `net.Server` instance that creates and manages `Http2Session` instances.

Poiché non ci sono browser conosciuti che supportino [HTTP/2 non crittografato](https://http2.github.io/faq/#does-http2-require-encryption), l'uso di [`http2.createSecureServer()`] [] è necessario durante la comunicazione con i client browser.

```js
const http2 = require('http2');

// Create an unencrypted HTTP/2 server.
// Since there are no browsers known that support
// unencrypted HTTP/2, the use of `http2.createSecureServer()`
// is necessary when communicating with browser clients.
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

### http2.createSecureServer(options[, onRequestHandler])

<!-- YAML
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
-->

* `options` {Object} 
  * `allowHTTP1` {boolean} Incoming client connections that do not support HTTP/2 will be downgraded to HTTP/1.x when set to `true`. See the [`'unknownProtocol'`][] event. See [ALPN negotiation](#http2_alpn_negotiation). **Default:** `false`.
  * `maxDeflateDynamicTableSize` {number} Sets the maximum dynamic table size for deflating header fields. **Default:** `4Kib`.
  * `maxSessionMemory`{number} Sets the maximum memory that the `Http2Session` is permitted to use. The value is expressed in terms of number of megabytes, e.g. `1` equal 1 megabyte. The minimum value allowed is `1`. This is a credit based limit, existing `Http2Stream`s may cause this limit to be exceeded, but new `Http2Stream` instances will be rejected while this limit is exceeded. The current number of `Http2Stream` sessions, the current memory use of the header compression tables, current data queued to be sent, and unacknowledged `PING` and `SETTINGS` frames are all counted towards the current limit. **Default:** `10`.
  * `maxHeaderListPairs` {number} Sets the maximum number of header entries. The minimum value is `4`. **Default:** `128`.
  * `maxOutstandingPings` {number} Sets the maximum number of outstanding, unacknowledged pings. **Default:** `10`.
  * `maxSendHeaderBlockLength` {number} Sets the maximum allowed size for a serialized, compressed block of headers. Attempts to send headers that exceed this limit will result in a `'frameError'` event being emitted and the stream being closed and destroyed.
  * `paddingStrategy` {number} Identifies the strategy used for determining the amount of padding to use for `HEADERS` and `DATA` frames. **Default:** `http2.constants.PADDING_STRATEGY_NONE`. Value may be one of: 
    * `http2.constants.PADDING_STRATEGY_NONE` - Specifies that no padding is to be applied.
    * `http2.constants.PADDING_STRATEGY_MAX` - Specifies that the maximum amount of padding, as determined by the internal implementation, is to be applied.
    * `http2.constants.PADDING_STRATEGY_CALLBACK` - Specifies that the user provided `options.selectPadding()` callback is to be used to determine the amount of padding.
    * `http2.constants.PADDING_STRATEGY_ALIGNED` - Will *attempt* to apply enough padding to ensure that the total frame length, including the 9-byte header, is a multiple of 8. For each frame, however, there is a maximum allowed number of padding bytes that is determined by current flow control state and settings. If this maximum is less than the calculated amount needed to ensure alignment, the maximum will be used and the total frame length will *not* necessarily be aligned at 8 bytes.
  * `peerMaxConcurrentStreams` {number} Sets the maximum number of concurrent streams for the remote peer as if a `SETTINGS` frame had been received. Will be overridden if the remote peer sets its own value for `maxConcurrentStreams`. **Default:** `100`.
  * `selectPadding` {Function} When `options.paddingStrategy` is equal to `http2.constants.PADDING_STRATEGY_CALLBACK`, provides the callback function used to determine the padding. See [Using `options.selectPadding()`][].
  * `settings` {HTTP/2 Settings Object} The initial settings to send to the remote peer upon connection.
  * ...: Any [`tls.createServer()`][] options can be provided. For servers, the identity options (`pfx` or `key`/`cert`) are usually required.
* `onRequestHandler` {Function} See [Compatibility API](#http2_compatibility_api)
* Returns: {Http2SecureServer}

Returns a `tls.Server` instance that creates and manages `Http2Session` instances.

```js
const http2 = require('http2');

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

### http2.connect(authority\[, options\]\[, listener\])

<!-- YAML
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
-->

* `authority` {string|URL}
* `options` {Object} 
  * `maxDeflateDynamicTableSize` {number} Sets the maximum dynamic table size for deflating header fields. **Default:** `4Kib`.
  * `maxSessionMemory`{number} Sets the maximum memory that the `Http2Session` is permitted to use. The value is expressed in terms of number of megabytes, e.g. `1` equal 1 megabyte. The minimum value allowed is `1`. This is a credit based limit, existing `Http2Stream`s may cause this limit to be exceeded, but new `Http2Stream` instances will be rejected while this limit is exceeded. The current number of `Http2Stream` sessions, the current memory use of the header compression tables, current data queued to be sent, and unacknowledged `PING` and `SETTINGS` frames are all counted towards the current limit. **Default:** `10`.
  * `maxHeaderListPairs` {number} Sets the maximum number of header entries. The minimum value is `1`. **Default:** `128`.
  * `maxOutstandingPings` {number} Sets the maximum number of outstanding, unacknowledged pings. **Default:** `10`.
  * `maxReservedRemoteStreams` {number} Sets the maximum number of reserved push streams the client will accept at any given time. Once the current number of currently reserved push streams exceeds reaches this limit, new push streams sent by the server will be automatically rejected.
  * `maxSendHeaderBlockLength` {number} Sets the maximum allowed size for a serialized, compressed block of headers. Attempts to send headers that exceed this limit will result in a `'frameError'` event being emitted and the stream being closed and destroyed.
  * `paddingStrategy` {number} Identifies the strategy used for determining the amount of padding to use for `HEADERS` and `DATA` frames. **Default:** `http2.constants.PADDING_STRATEGY_NONE`. Value may be one of: 
    * `http2.constants.PADDING_STRATEGY_NONE` - Specifies that no padding is to be applied.
    * `http2.constants.PADDING_STRATEGY_MAX` - Specifies that the maximum amount of padding, as determined by the internal implementation, is to be applied.
    * `http2.constants.PADDING_STRATEGY_CALLBACK` - Specifies that the user provided `options.selectPadding()` callback is to be used to determine the amount of padding.
    * `http2.constants.PADDING_STRATEGY_ALIGNED` - Will *attempt* to apply enough padding to ensure that the total frame length, including the 9-byte header, is a multiple of 8. For each frame, however, there is a maximum allowed number of padding bytes that is determined by current flow control state and settings. If this maximum is less than the calculated amount needed to ensure alignment, the maximum will be used and the total frame length will *not* necessarily be aligned at 8 bytes.
  * `peerMaxConcurrentStreams` {number} Sets the maximum number of concurrent streams for the remote peer as if a `SETTINGS` frame had been received. Will be overridden if the remote peer sets its own value for `maxConcurrentStreams`. **Default:** `100`.
  * `selectPadding` {Function} When `options.paddingStrategy` is equal to `http2.constants.PADDING_STRATEGY_CALLBACK`, provides the callback function used to determine the padding. See [Using `options.selectPadding()`][].
  * `settings` {HTTP/2 Settings Object} The initial settings to send to the remote peer upon connection.
  * `createConnection` {Function} An optional callback that receives the `URL` instance passed to `connect` and the `options` object, and returns any [`Duplex`][] stream that is to be used as the connection for this session.
  * ...: Any [`net.connect()`][] or [`tls.connect()`][] options can be provided.
* `listener` {Function}
* Returns: {ClientHttp2Session}

Returns a `ClientHttp2Session` instance.

```js
const http2 = require('http2');
const client = http2.connect('https://localhost:1234');

/* Use the client */

client.close();
```

### http2.constants

<!-- YAML
added: v8.4.0
-->

#### Error Codes for RST_STREAM and GOAWAY

<a id="error_codes"></a>

| Value  | Name                | Constant                                      |
| ------ | ------------------- | --------------------------------------------- |
| `0x00` | No Error            | `http2.constants.NGHTTP2_NO_ERROR`            |
| `0x01` | Protocol Error      | `http2.constants.NGHTTP2_PROTOCOL_ERROR`      |
| `0x02` | Internal Error      | `http2.constants.NGHTTP2_INTERNAL_ERROR`      |
| `0x03` | Flow Control Error  | `http2.constants.NGHTTP2_FLOW_CONTROL_ERROR`  |
| `0x04` | Settings Timeout    | `http2.constants.NGHTTP2_SETTINGS_TIMEOUT`    |
| `0x05` | Stream Closed       | `http2.constants.NGHTTP2_STREAM_CLOSED`       |
| `0x06` | Frame Size Error    | `http2.constants.NGHTTP2_FRAME_SIZE_ERROR`    |
| `0x07` | Refused Stream      | `http2.constants.NGHTTP2_REFUSED_STREAM`      |
| `0x08` | Cancel              | `http2.constants.NGHTTP2_CANCEL`              |
| `0x09` | Compression Error   | `http2.constants.NGHTTP2_COMPRESSION_ERROR`   |
| `0x0a` | Connect Error       | `http2.constants.NGHTTP2_CONNECT_ERROR`       |
| `0x0b` | Enhance Your Calm   | `http2.constants.NGHTTP2_ENHANCE_YOUR_CALM`   |
| `0x0c` | Inadequate Security | `http2.constants.NGHTTP2_INADEQUATE_SECURITY` |
| `0x0d` | HTTP/1.1 Required   | `http2.constants.NGHTTP2_HTTP_1_1_REQUIRED`   |

The `'timeout'` event is emitted when there is no activity on the Server for a given number of milliseconds set using `http2server.setTimeout()`.

### http2.getDefaultSettings()

<!-- YAML
added: v8.4.0
-->

* Returns: {HTTP/2 Settings Object}

Returns an object containing the default settings for an `Http2Session` instance. This method returns a new object instance every time it is called so instances returned may be safely modified for use.

### http2.getPackedSettings(settings)

<!-- YAML
added: v8.4.0
-->

* `settings` {HTTP/2 Settings Object}
* Returns: {Buffer}

Returns a `Buffer` instance containing serialized representation of the given HTTP/2 settings as specified in the [HTTP/2](https://tools.ietf.org/html/rfc7540) specification. This is intended for use with the `HTTP2-Settings` header field.

```js
const http2 = require('http2');

const packed = http2.getPackedSettings({ enablePush: false });

console.log(packed.toString('base64'));
// Prints: AAIAAAAA
```

### http2.getUnpackedSettings(buf)

<!-- YAML
added: v8.4.0
-->

* `buf` {Buffer|Uint8Array} The packed settings.
* Returns: {HTTP/2 Settings Object}

Returns a [HTTP/2 Settings Object](#http2_settings_object) containing the deserialized settings from the given `Buffer` as generated by `http2.getPackedSettings()`.

### Headers Object

Headers are represented as own-properties on JavaScript objects. The property keys will be serialized to lower-case. Property values should be strings (if they are not they will be coerced to strings) or an `Array` of strings (in order to send more than one value per header field).

```js
const headers = {
  ':status': '200',
  'content-type': 'text-plain',
  'ABC': ['has', 'more', 'than', 'one', 'value']
};

stream.respond(headers);
```

Header objects passed to callback functions will have a `null` prototype. This means that normal JavaScript object methods such as `Object.prototype.toString()` and `Object.prototype.hasOwnProperty()` will not work.

```js
const http2 = require('http2');
const server = http2.createServer();
server.on('stream', (stream, headers) => {
  console.log(headers[':path']);
  console.log(headers.ABC);
});
```

### Settings Object

<!-- YAML
added: v8.4.0
changes:

  - version: v8.9.3
    pr-url: https://github.com/nodejs/node/pull/16676
    description: The `maxHeaderListSize` setting is now strictly enforced.
--> The 

`http2.getDefaultSettings()`, `http2.getPackedSettings()`, `http2.createServer()`, `http2.createSecureServer()`, `http2session.settings()`, `http2session.localSettings`, and `http2session.remoteSettings` APIs either return or receive as input an object that defines configuration settings for an `Http2Session` object. These objects are ordinary JavaScript objects containing the following properties.

* `headerTableSize` {number} Specifies the maximum number of bytes used for header compression. The minimum allowed value is 0. The maximum allowed value is 2<sup>32</sup>-1. **Default:** `4,096 octets`.
* `enablePush` {boolean} Specifies `true` if HTTP/2 Push Streams are to be permitted on the `Http2Session` instances.
* `initialWindowSize` {number} Specifies the *senders* initial window size for stream-level flow control. The minimum allowed value is 0. The maximum allowed value is 2<sup>32</sup>-1. **Default:** `65,535 bytes`.
* `maxFrameSize` {number} Specifies the size of the largest frame payload. The minimum allowed value is 16,384. The maximum allowed value is 2<sup>24</sup>-1. **Default:** `16,384 bytes`.
* `maxConcurrentStreams` {number} Specifies the maximum number of concurrent streams permitted on an `Http2Session`. There is no default value which implies, at least theoretically, 2<sup>31</sup>-1 streams may be open concurrently at any given time in an `Http2Session`. The minimum value is 0. The maximum allowed value is 2<sup>31</sup>-1.
* `maxHeaderListSize` {number} Specifies the maximum size (uncompressed octets) of header list that will be accepted. The minimum allowed value is 0. The maximum allowed value is 2<sup>32</sup>-1. **Default:** `65535`.

All additional properties on the settings object are ignored.

### Using `options.selectPadding()`

When `options.paddingStrategy` is equal to `http2.constants.PADDING_STRATEGY_CALLBACK`, the HTTP/2 implementation will consult the `options.selectPadding()` callback function, if provided, to determine the specific amount of padding to use per `HEADERS` and `DATA` frame.

The `options.selectPadding()` function receives two numeric arguments, `frameLen` and `maxFrameLen` and must return a number `N` such that `frameLen <= N <= maxFrameLen`.

```js
const http2 = require('http2');
const server = http2.createServer({
  paddingStrategy: http2.constants.PADDING_STRATEGY_CALLBACK,
  selectPadding(frameLen, maxFrameLen) {
    return maxFrameLen;
  }
});
```

The `options.selectPadding()` function is invoked once for *every* `HEADERS` and `DATA` frame. This has a definite noticeable impact on performance.

### Error Handling

There are several types of error conditions that may arise when using the `http2` module:

Validation errors occur when an incorrect argument, option, or setting value is passed in. These will always be reported by a synchronous `throw`.

State errors occur when an action is attempted at an incorrect time (for instance, attempting to send data on a stream after it has closed). These will be reported using either a synchronous `throw` or via an `'error'` event on the `Http2Stream`, `Http2Session` or HTTP/2 Server objects, depending on where and when the error occurs.

Internal errors occur when an HTTP/2 session fails unexpectedly. These will be reported via an `'error'` event on the `Http2Session` or HTTP/2 Server objects.

Protocol errors occur when various HTTP/2 protocol constraints are violated. These will be reported using either a synchronous `throw` or via an `'error'` event on the `Http2Stream`, `Http2Session` or HTTP/2 Server objects, depending on where and when the error occurs.

### Invalid character handling in header names and values

The HTTP/2 implementation applies stricter handling of invalid characters in HTTP header names and values than the HTTP/1 implementation.

Header field names are *case-insensitive* and are transmitted over the wire strictly as lower-case strings. The API provided by Node.js allows header names to be set as mixed-case strings (e.g. `Content-Type`) but will convert those to lower-case (e.g. `content-type`) upon transmission.

Header field-names *must only* contain one or more of the following ASCII characters: `a`-`z`, `A`-`Z`, `0`-`9`, `!`, `#`, `$`, `%`, `&`, `'`, `*`, `+`, `-`, `.`, `^`, `_`, `` ` `` (backtick), `|`, and `~`.

Using invalid characters within an HTTP header field name will cause the stream to be closed with a protocol error being reported.

Header field values are handled with more leniency but *should* not contain new-line or carriage return characters and *should* be limited to US-ASCII characters, per the requirements of the HTTP specification.

### Push streams on the client

To receive pushed streams on the client, set a listener for the `'stream'` event on the `ClientHttp2Session`:

```js
const http2 = require('http2');

const client = http2.connect('http://localhost');

client.on('stream', (pushedStream, requestHeaders) => {
  pushedStream.on('push', (responseHeaders) => {
    // process response headers
  });
  pushedStream.on('data', (chunk) => { /* handle pushed data */ });
});

const req = client.request({ ':path': '/' });
```

### Supporting the CONNECT method

The `CONNECT` method is used to allow an HTTP/2 server to be used as a proxy for TCP/IP connections.

A simple TCP Server:

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

An HTTP/2 CONNECT proxy:

```js
const http2 = require('http2');
const { NGHTTP2_REFUSED_STREAM } = http2.constants;
const net = require('net');

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

An HTTP/2 CONNECT client:

```js
const http2 = require('http2');

const client = http2.connect('http://localhost:8001');

// Must not specify the ':path' and ':scheme' headers
// for CONNECT requests or an error will be thrown.
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

## Compatibility API

The Compatibility API has the goal of providing a similar developer experience of HTTP/1 when using HTTP/2, making it possible to develop applications that support both [HTTP/1](http.html) and HTTP/2. This API targets only the **public API** of the [HTTP/1](http.html). However many modules use internal methods or state, and those *are not supported* as it is a completely different implementation.

The following example creates an HTTP/2 server using the compatibility API:

```js
const http2 = require('http2');
const server = http2.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

In order to create a mixed [HTTPS](https.html) and HTTP/2 server, refer to the [ALPN negotiation](#http2_alpn_negotiation) section. Upgrading from non-tls HTTP/1 servers is not supported.

The HTTP/2 compatibility API is composed of [`Http2ServerRequest`]() and [`Http2ServerResponse`](). They aim at API compatibility with HTTP/1, but they do not hide the differences between the protocols. As an example, the status message for HTTP codes is ignored.

### ALPN negotiation

ALPN negotiation allows supporting both [HTTPS](https.html) and HTTP/2 over the same socket. The `req` and `res` objects can be either HTTP/1 or HTTP/2, and an application **must** restrict itself to the public API of [HTTP/1](http.html), and detect if it is possible to use the more advanced features of HTTP/2.

The following example creates a server that supports both protocols:

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
  // detects if it is a HTTPS request or HTTP/2
  const { socket: { alpnProtocol } } = req.httpVersion === '2.0' ?
    req.stream.session : req;
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({
    alpnProtocol,
    httpVersion: req.httpVersion
  }));
}
```

The `'request'` event works identically on both [HTTPS](https.html) and HTTP/2.

### Class: http2.Http2ServerRequest

<!-- YAML
added: v8.4.0
-->

A `Http2ServerRequest` object is created by [`http2.Server`][] or [`http2.SecureServer`][] and passed as the first argument to the [`'request'`][] event. It may be used to access a request status, headers, and data.

It implements the [Readable Stream](stream.html#stream_class_stream_readable) interface, as well as the following additional events, methods, and properties.

#### Event: 'aborted'

<!-- YAML
added: v8.4.0
-->

The `'aborted'` event is emitted whenever a `Http2ServerRequest` instance is abnormally aborted in mid-communication.

The `'aborted'` event will only be emitted if the `Http2ServerRequest` writable side has not been ended.

#### Event: 'close'

<!-- YAML
added: v8.4.0
-->

Indicates that the underlying [`Http2Stream`][] was closed. Just like `'end'`, this event occurs only once per response.

#### request.aborted

<!-- YAML
added: v10.1.0
-->

* {boolean}

The `request.aborted` property will be `true` if the request has been aborted.

#### request.destroy([error])

<!-- YAML
added: v8.4.0
-->

* `error` {Error}

Calls `destroy()` on the [`Http2Stream`][] that received the [`Http2ServerRequest`][]. If `error` is provided, an `'error'` event is emitted and `error` is passed as an argument to any listeners on the event.

It does nothing if the stream was already destroyed.

#### request.headers

<!-- YAML
added: v8.4.0
-->

* {Object}

The request/response headers object.

Key-value pairs of header names and values. Header names are lower-cased. Example:

```js
// Prints something like:
//
// { 'user-agent': 'curl/7.22.0',
//   host: '127.0.0.1:8000',
//   accept: '*/*' }
console.log(request.headers);
```

See [HTTP/2 Headers Object](#http2_headers_object).

In HTTP/2, the request path, hostname, protocol, and method are represented as special headers prefixed with the `:` character (e.g. `':path'`). These special headers will be included in the `request.headers` object. Care must be taken not to inadvertently modify these special headers or errors may occur. For instance, removing all headers from the request will cause errors to occur:

```js
removeAllHeaders(request.headers);
assert(request.url);   // Fails because the :path header has been removed
```

#### request.httpVersion

<!-- YAML
added: v8.4.0
-->

* {string}

In case of server request, the HTTP version sent by the client. In the case of client response, the HTTP version of the connected-to server. Returns `'2.0'`.

Also `message.httpVersionMajor` is the first integer and `message.httpVersionMinor` is the second.

#### request.method

<!-- YAML
added: v8.4.0
-->

* {string}

The request method as a string. Read-only. Example: `'GET'`, `'DELETE'`.

#### request.rawHeaders

<!-- YAML
added: v8.4.0
-->

* {string[]}

The raw request/response headers list exactly as they were received.

Note that the keys and values are in the same list. It is *not* a list of tuples. So, the even-numbered offsets are key values, and the odd-numbered offsets are the associated values.

Header names are not lowercased, and duplicates are not merged.

```js
// Prints something like:
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

* {string[]}

The raw request/response trailer keys and values exactly as they were received. Only populated at the `'end'` event.

#### request.setTimeout(msecs, callback)

<!-- YAML
added: v8.4.0
-->

* `msecs` {number}
* `callback` {Function}
* Returns: {http2.Http2ServerRequest}

Sets the [`Http2Stream`]()'s timeout value to `msecs`. If a callback is provided, then it is added as a listener on the `'timeout'` event on the response object.

If no `'timeout'` listener is added to the request, the response, or the server, then [`Http2Stream`]()s are destroyed when they time out. If a handler is assigned to the request, the response, or the server's `'timeout'` events, timed out sockets must be handled explicitly.

#### request.socket

<!-- YAML
added: v8.4.0
-->

* {net.Socket|tls.TLSSocket}

Returns a `Proxy` object that acts as a `net.Socket` (or `tls.TLSSocket`) but applies getters, setters, and methods based on HTTP/2 logic.

`destroyed`, `readable`, and `writable` properties will be retrieved from and set on `request.stream`.

`destroy`, `emit`, `end`, `on` and `once` methods will be called on `request.stream`.

`setTimeout` method will be called on `request.stream.session`.

`pause`, `read`, `resume`, and `write` will throw an error with code `ERR_HTTP2_NO_SOCKET_MANIPULATION`. See [`Http2Session` and Sockets][] for more information.

All other interactions will be routed directly to the socket. With TLS support, use [`request.socket.getPeerCertificate()`][] to obtain the client's authentication details.

#### request.stream

<!-- YAML
added: v8.4.0
-->

* {Http2Stream}

The [`Http2Stream`][] object backing the request.

#### request.trailers

<!-- YAML
added: v8.4.0
-->

* {Object}

The request/response trailers object. Only populated at the `'end'` event.

#### request.url

<!-- YAML
added: v8.4.0
-->

* {string}

Request URL string. This contains only the URL that is present in the actual HTTP request. If the request is:

```txt
GET /status?name=ryan HTTP/1.1\r\n
Accept: text/plain\r\n
\r\n
```

Then `request.url` will be:

<!-- eslint-disable semi -->

```js
'/status?name=ryan'
```

To parse the url into its parts `require('url').parse(request.url)` can be used. Example:

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

To extract the parameters from the query string, the `require('querystring').parse` function can be used, or `true` can be passed as the second argument to `require('url').parse`. Example:

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

### Class: http2.Http2ServerResponse

<!-- YAML
added: v8.4.0
-->

This object is created internally by an HTTP server — not by the user. It is passed as the second parameter to the [`'request'`][] event.

The response implements, but does not inherit from, the [Writable Stream](stream.html#stream_writable_streams) interface. This is an [`EventEmitter`][] with the following events:

#### Event: 'close'

<!-- YAML
added: v8.4.0
-->

Indicates that the underlying [`Http2Stream`]() was terminated before [`response.end()`][] was called or able to flush.

#### Event: 'finish'

<!-- YAML
added: v8.4.0
-->

Emitted when the response has been sent. More specifically, this event is emitted when the last segment of the response headers and body have been handed off to the HTTP/2 multiplexing for transmission over the network. It does not imply that the client has received anything yet.

After this event, no more events will be emitted on the response object.

#### response.addTrailers(headers)

<!-- YAML
added: v8.4.0
-->

* `headers` {Object}

This method adds HTTP trailing headers (a header but at the end of the message) to the response.

Attempting to set a header field name or value that contains invalid characters will result in a [`TypeError`][] being thrown.

#### response.connection

<!-- YAML
added: v8.4.0
-->

* {net.Socket|tls.TLSSocket}

See [`response.socket`][].

#### response.end(\[data\]\[, encoding\][, callback])

<!-- YAML
added: v8.4.0
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18780
    description: This method now returns a reference to `ServerResponse`.
-->

* `data` {string|Buffer}
* `encoding` {string}
* `callback` {Function}
* Returns: {this}

This method signals to the server that all of the response headers and body have been sent; that server should consider this message complete. The method, `response.end()`, MUST be called on each response.

If `data` is specified, it is equivalent to calling [`response.write(data, encoding)`][] followed by `response.end(callback)`.

If `callback` is specified, it will be called when the response stream is finished.

#### response.finished

<!-- YAML
added: v8.4.0
-->

* {boolean}

Boolean value that indicates whether the response has completed. Starts as `false`. After [`response.end()`][] executes, the value will be `true`.

#### response.getHeader(name)

<!-- YAML
added: v8.4.0
-->

* `name` {string}
* Returns: {string}

Reads out a header that has already been queued but not sent to the client. Note that the name is case insensitive.

Example:

```js
const contentType = response.getHeader('content-type');
```

#### response.getHeaderNames()

<!-- YAML
added: v8.4.0
-->

* Restituisce: {string[]}

Returns an array containing the unique names of the current outgoing headers. All header names are lowercase.

Example:

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

* Returns: {Object}

Returns a shallow copy of the current outgoing headers. Since a shallow copy is used, array values may be mutated without additional calls to various header-related http module methods. The keys of the returned object are the header names and the values are the respective header values. All header names are lowercase.

The object returned by the `response.getHeaders()` method *does not* prototypically inherit from the JavaScript `Object`. This means that typical `Object` methods such as `obj.toString()`, `obj.hasOwnProperty()`, and others are not defined and *will not work*.

Example:

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
* Returns: {boolean}

Returns `true` if the header identified by `name` is currently set in the outgoing headers. Note that the header name matching is case-insensitive.

Example:

```js
const hasContentType = response.hasHeader('content-type');
```

#### response.headersSent

<!-- YAML
added: v8.4.0
-->

* {boolean}

True if headers were sent, false otherwise (read-only).

#### response.removeHeader(name)

<!-- YAML
added: v8.4.0
-->

* `name` {string}

Removes a header that has been queued for implicit sending.

Example:

```js
response.removeHeader('Content-Encoding');
```

#### response.sendDate

<!-- YAML
added: v8.4.0
-->

* {boolean}

When true, the Date header will be automatically generated and sent in the response if it is not already present in the headers. Defaults to true.

This should only be disabled for testing; HTTP requires the Date header in responses.

#### response.setHeader(name, value)

<!-- YAML
added: v8.4.0
-->

* `name` {string}
* `value` {string|string[]}

Sets a single header value for implicit headers. If this header already exists in the to-be-sent headers, its value will be replaced. Use an array of strings here to send multiple headers with the same name.

Example:

```js
response.setHeader('Content-Type', 'text/html');
```

or

```js
response.setHeader('Set-Cookie', ['type=ninja', 'language=javascript']);
```

Attempting to set a header field name or value that contains invalid characters will result in a [`TypeError`][] being thrown.

When headers have been set with [`response.setHeader()`][], they will be merged with any headers passed to [`response.writeHead()`][], with the headers passed to [`response.writeHead()`][] given precedence.

```js
// returns content-type = text/plain
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
* Returns: {http2.Http2ServerResponse}

Sets the [`Http2Stream`]()'s timeout value to `msecs`. If a callback is provided, then it is added as a listener on the `'timeout'` event on the response object.

If no `'timeout'` listener is added to the request, the response, or the server, then [`Http2Stream`]()s are destroyed when they time out. If a handler is assigned to the request, the response, or the server's `'timeout'` events, timed out sockets must be handled explicitly.

#### response.socket

<!-- YAML
added: v8.4.0
-->

* {net.Socket|tls.TLSSocket}

Returns a `Proxy` object that acts as a `net.Socket` (or `tls.TLSSocket`) but applies getters, setters, and methods based on HTTP/2 logic.

`destroyed`, `readable`, and `writable` properties will be retrieved from and set on `response.stream`.

`destroy`, `emit`, `end`, `on` and `once` methods will be called on `response.stream`.

`setTimeout` method will be called on `response.stream.session`.

`pause`, `read`, `resume`, and `write` will throw an error with code `ERR_HTTP2_NO_SOCKET_MANIPULATION`. See [`Http2Session` and Sockets][] for more information.

All other interactions will be routed directly to the socket.

Example:

```js
const http2 = require('http2');
const server = http2.createServer((req, res) => {
  const ip = req.socket.remoteAddress;
  const port = req.socket.remotePort;
  res.end(`Your IP address is ${ip} and your source port is ${port}.`);
}).listen(3000);
```

#### response.statusCode

<!-- YAML
added: v8.4.0
-->

* {number}

When using implicit headers (not calling [`response.writeHead()`][] explicitly), this property controls the status code that will be sent to the client when the headers get flushed.

Example:

```js
response.statusCode = 404;
```

After response header was sent to the client, this property indicates the status code which was sent out.

#### response.statusMessage

<!-- YAML
added: v8.4.0
-->

* {string}

Status message is not supported by HTTP/2 (RFC7540 8.1.2.4). It returns an empty string.

#### response.stream

<!-- YAML
added: v8.4.0
-->

* {Http2Stream}

The [`Http2Stream`][] object backing the response.

#### response.write(chunk\[, encoding\]\[, callback\])

<!-- YAML
added: v8.4.0
-->

* `chunk` {string|Buffer}
* `encoding` {string}
* `callback` {Function}
* Returns: {boolean}

If this method is called and [`response.writeHead()`][] has not been called, it will switch to implicit header mode and flush the implicit headers.

This sends a chunk of the response body. This method may be called multiple times to provide successive parts of the body.

Note that in the `http` module, the response body is omitted when the request is a HEAD request. Similarly, the `204` and `304` responses *must not* include a message body.

`chunk` can be a string or a buffer. If `chunk` is a string, the second parameter specifies how to encode it into a byte stream. By default the `encoding` is `'utf8'`. `callback` will be called when this chunk of data is flushed.

This is the raw HTTP body and has nothing to do with higher-level multi-part body encodings that may be used.

The first time [`response.write()`][] is called, it will send the buffered header information and the first chunk of the body to the client. The second time [`response.write()`][] is called, Node.js assumes data will be streamed, and sends the new data separately. That is, the response is buffered up to the first chunk of the body.

Returns `true` if the entire data was flushed successfully to the kernel buffer. Returns `false` if all or part of the data was queued in user memory. `'drain'` will be emitted when the buffer is free again.

#### response.writeContinue()

<!-- YAML
added: v8.4.0
-->

Sends a status `100 Continue` to the client, indicating that the request body should be sent. See the [`'checkContinue'`][] event on `Http2Server` and `Http2SecureServer`.

#### response.writeHead(statusCode\[, statusMessage\]\[, headers\])

<!-- YAML
added: v8.4.0
-->

* `statusCode` {number}
* `statusMessage` {string}
* `headers` {Object}

Sends a response header to the request. The status code is a 3-digit HTTP status code, like `404`. The last argument, `headers`, are the response headers.

For compatibility with [HTTP/1](http.html), a human-readable `statusMessage` may be passed as the second argument. However, because the `statusMessage` has no meaning within HTTP/2, the argument will have no effect and a process warning will be emitted.

Example:

```js
const body = 'hello world';
response.writeHead(200, {
  'Content-Length': Buffer.byteLength(body),
  'Content-Type': 'text/plain' });
```

Note that Content-Length is given in bytes not characters. The `Buffer.byteLength()` API may be used to determine the number of bytes in a given encoding. On outbound messages, Node.js does not check if Content-Length and the length of the body being transmitted are equal or not. However, when receiving messages, Node.js will automatically reject messages when the Content-Length does not match the actual payload size.

This method may be called at most one time on a message before [`response.end()`][] is called.

If [`response.write()`][] or [`response.end()`][] are called before calling this, the implicit/mutable headers will be calculated and call this function.

When headers have been set with [`response.setHeader()`][], they will be merged with any headers passed to [`response.writeHead()`][], with the headers passed to [`response.writeHead()`][] given precedence.

```js
// returns content-type = text/plain
const server = http2.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

Attempting to set a header field name or value that contains invalid characters will result in a [`TypeError`][] being thrown.

#### response.createPushResponse(headers, callback)

<!-- YAML
added: v8.4.0
-->

Call [`http2stream.pushStream()`][] with the given headers, and wraps the given newly created [`Http2Stream`] on `Http2ServerRespose`.

The callback will be called with an error with code `ERR_HTTP2_STREAM_CLOSED` if the stream is closed.

## Collecting HTTP/2 Performance Metrics

The [Performance Observer](perf_hooks.html) API can be used to collect basic performance metrics for each `Http2Session` and `Http2Stream` instance.

```js
const { PerformanceObserver } = require('perf_hooks');

const obs = new PerformanceObserver((items) => {
  const entry = items.getEntries()[0];
  console.log(entry.entryType);  // prints 'http2'
  if (entry.name === 'Http2Session') {
    // entry contains statistics about the Http2Session
  } else if (entry.name === 'Http2Stream') {
    // entry contains statistics about the Http2Stream
  }
});
obs.observe({ entryTypes: ['http2'] });
```

The `entryType` property of the `PerformanceEntry` will be equal to `'http2'`.

The `name` property of the `PerformanceEntry` will be equal to either `'Http2Stream'` or `'Http2Session'`.

If `name` is equal to `Http2Stream`, the `PerformanceEntry` will contain the following additional properties:

* `bytesRead` {number} The number of `DATA` frame bytes received for this `Http2Stream`.
* `bytesWritten` {number} The number of `DATA` frame bytes sent for this `Http2Stream`.
* `id` {number} The identifier of the associated `Http2Stream`
* `timeToFirstByte` {number} The number of milliseconds elapsed between the `PerformanceEntry` `startTime` and the reception of the first `DATA` frame.
* `timeToFirstByteSent` {number} The number of milliseconds elapsed between the `PerformanceEntry` `startTime` and sending of the first `DATA` frame.
* `timeToFirstHeader` {number} The number of milliseconds elapsed between the `PerformanceEntry` `startTime` and the reception of the first header.

If `name` is equal to `Http2Session`, the `PerformanceEntry` will contain the following additional properties:

* `bytesRead` {number} The number of bytes received for this `Http2Session`.
* `bytesWritten` {number} The number of bytes sent for this `Http2Session`.
* `framesReceived` {number} The number of HTTP/2 frames received by the `Http2Session`.
* `framesSent` {number} The number of HTTP/2 frames sent by the `Http2Session`.
* `maxConcurrentStreams` {number} The maximum number of streams concurrently open during the lifetime of the `Http2Session`.
* `pingRTT` {number} The number of milliseconds elapsed since the transmission of a `PING` frame and the reception of its acknowledgment. Only present if a `PING` frame has been sent on the `Http2Session`.
* `streamAverageDuration` {number} The average duration (in milliseconds) for all `Http2Stream` instances.
* `streamCount` {number} The number of `Http2Stream` instances processed by the `Http2Session`.
* `type` {string} Either `'server'` or `'client'` to identify the type of `Http2Session`.