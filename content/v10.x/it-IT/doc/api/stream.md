# Stream

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Uno stream è un'abstract interface per lavorare con gli streaming data in Node.js. Il modulo `stream` fornisce un'API di base che semplifica la creazione di object che implementano la stream interface.

Esistono molti stream object forniti da Node.js. Ad esempio, una [richiesta ad un server HTTP](http.html#http_class_http_incomingmessage) e [`process.stdout`][] sono tutti e due istanze di stream.

Gli stream possono essere readable (leggibiliI), writeable (scrivibili) oppure entrambi. Tutti gli stream sono istanze di [`EventEmitter`][].

È possibile accedere al modulo `stream` utilizzando:

```js
const stream = require('stream');
```

Mentre è importante capire come funzionano gli stream, il modulo `stream` è di per sé più utile per gli sviluppatori che stanno creando nuovi tipi di istanze di stream. Gli sviluppatori che *utilizzano* principalmente gli stream object raramente hanno bisogno di utilizzare direttamente il modulo `stream`.

## Organizzazione di questo Documento

Questo documento è diviso in due sezioni principali con una terza sezione per le note aggiuntive. La prima sezione spiega gli elementi dello stream API richiesti per *utilizzare* gli stream all'interno di un'applicazione. La seconda sezione spiega gli elementi dell'API necessari per *implementare* nuovi tipi di stream.

## Tipi di Stream

Esistono quattro tipi fondamentali di stream all'interno di Node.js:

* [`Writable`][] - streams to which data can be written (for example, [`fs.createWriteStream()`][]).
* [`Readable`][] - streams from which data can be read (for example, [`fs.createReadStream()`][]).
* [`Duplex`][] - streams that are both `Readable` and `Writable` (for example, [`net.Socket`][]).
* [`Transform`][] - `Duplex` streams that can modify or transform the data as it is written and read (for example, [`zlib.createDeflate()`][]).

Additionally, this module includes the utility functions [pipeline](#stream_stream_pipeline_streams_callback) and [finished](#stream_stream_finished_stream_callback).

### Object Mode

Tutti gli stream creati dalle API di Node.js operano esclusivamente su stringhe e `Buffer` (o `Uint8Array`) object. Tuttavia, è possibile che le implementazioni dello stream funzionino con altri tipi di valori JavaScript (ad eccezione di `null`, che ha uno scopo speciale all'interno degli stream). Tali stream sono considerati operanti in "object mode".

Le istanze di stream vengono trasformate in object mode utilizzando l'opzione `objectMode` quando viene creato lo stream. Provare a cambiare uno stream esistente in object mode non è sicuro.

### Buffering

<!--type=misc-->

Entrambi gli stream sia [`Writable`][] che [`Readable`][] memorizzeranno i dati in un buffer interno che può essere recuperato usando rispettivamente `writable.writableBuffer` oppure `readable.readableBuffer`.

The amount of data potentially buffered depends on the `highWaterMark` option passed into the stream's constructor. Per gli stream normali, l'opzione `highWaterMark` specifica un [numero totale di bytes](#stream_highwatermark_discrepancy_after_calling_readable_setencoding). Per gli stream che operano in object mode, l'`highWaterMark` specifica un numero totale di object.

I dati vengono memorizzati nel buffer nei `Readable` stream quando l'implementazione chiama [`stream.push(chunk)`](#stream_readable_push_chunk_encoding). Se il consumer dello Stream non chiama [`stream.read()`](#stream_readable_read_size), i dati si fermeranno nella queue interna fino a quando non verranno consumati/utilizzati.

Una volta che la dimensione totale del read buffer interno raggiunge la soglia specificata da `highWaterMark`, lo stream interromperà temporaneamente la lettura dei dati da parte della risorsa sottostante fino a quando i dati attualmente memorizzati nel buffer non potranno essere consumati (ovvero, lo stream si arresterà chiamando il metodo interno `readable._read()` utilizzato per riempire il read buffer).

I dati vengono memorizzati nel buffer nei `Writable` stream quando il metodo [`writable.write(chunk)`](#stream_writable_write_chunk_encoding_callback) viene chiamato ripetutamente. Quando la dimensione totale del write buffer interno è inferiore alla soglia impostata da `highWaterMark`, le chiamate a `writable.write()` restituiranno `true`. Quando invece la dimensione del buffer interno raggiunge o supera l'`highWaterMark`, verrà restituito `false`.

Un obiettivo chiave dello `stream` API, in particolare il metodo [`stream.pipe()`], è di limitare il buffering dei dati a livelli accettabili in modo che sorgenti e destinazioni di diverse velocità non sovraccarichino la memoria disponibile.

Because [`Duplex`][] and [`Transform`][] streams are both `Readable` and `Writable`, each maintains *two* separate internal buffers used for reading and writing, allowing each side to operate independently of the other while maintaining an appropriate and efficient flow of data. For example, [`net.Socket`][] instances are [`Duplex`][] streams whose `Readable` side allows consumption of data received *from* the socket and whose `Writable` side allows writing data *to* the socket. Poiché i dati possono essere scritti sul socket ad una velocità maggiore o minore rispetto a quella dei dati ricevuti, è importante che ciascuna parte funzioni (ed esegua il buffer) indipendentemente dall'altra.

## API per gli Stream Consumer

<!--type=misc-->

Quasi tutte le applicazioni Node.js, non importa quanto semplici, utilizzano in qualche modo gli stream. Di seguito è riportato un esempio dell'utilizzo degli stream in un'applicazione Node.js che implementa un server HTTP:

```js
const http = require('http');

const server = http.createServer((req, res) => {
  // req è un http.IncomingMessage, il quale è un Readable Stream
  // res è un http.ServerResponse, il quale è un Writable Stream

  let body = '';
  // Ottiene i dati come stringhe utf8.
  // Se non è impostata una codifica, i Buffer object verranno ricevuti.
  req.setEncoding('utf8');

  // Gli Readable stream emettono eventi 'data' una volta che viene aggiunto un listener
  req.on('data', (chunk) => {
    body += chunk;
  });

  // l'evento 'end' indica che l'intero body è stato ricevuto
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      // Risponde scrivendo qualcosa di interessante per l'utente:
      res.write(typeof data);
      res.end();
    } catch (er) {
      // uh oh! cattivo json!
      res.statusCode = 400;
      return res.end(`error: ${er.message}`);
    }
  });
});

server.listen(1337);

// $ curl localhost:1337 -d "{}"
// object
// $ curl localhost:1337 -d "\"foo\""
// string
// $ curl localhost:1337 -d "not json"
// error: Unexpected token o in JSON at position 1
```

Gli [`Writable`][] stream (come ad esempio `res`) espongono metodi come `write()` e `end()` che vengono utilizzati per scrivere dati nello stream.

Gli [`Readable`][] stream utilizzano l'API [`EventEmitter`][] per notificare il codice dell'applicazione quando i dati sono disponibili per essere letti dallo stream. I dati disponibili possono essere letti dallo stream in diversi modi.

Entrambi gli stream sia [`Writable`][] che [`Readable`][], per comunicare lo stato attuale dello stream, utilizzano l'API [`EventEmitter`][] in vari modi.

Gli stream [`Duplex`][] e [`Transform`][] sono entrambi sia [`Writable`][] che [`Readable`][].

Le applicazioni che sono di "scrittura di dati a" oppure di "consumo di dati da" uno stream non sono necessarie per implementare direttamente le stream interface e generalmente non avranno alcun motivo per chiamare `require('stream')`.

Gli sviluppatori che desiderano implementare nuovi tipi di stream devono fare riferimento alla sezione [API per gli Stream Implementer](#stream_api_for_stream_implementers).

### Writable Streams

Gli writable stream sono un'abstraction per una *destinazione* nella quale vengono scritti i dati.

Gli esempi di [`Writable`][] stream includono:

* [Richieste HTTP, sul client](http.html#http_class_http_clientrequest)
* [Risposte HTTP, sul server](http.html#http_class_http_serverresponse)
* [fs write stream](fs.html#fs_class_fs_writestream)
* [zlib stream](zlib.html)
* [crypto streams](crypto.html)
* [TCP sockets](net.html#net_class_net_socket)
* [child process stdin](child_process.html#child_process_subprocess_stdin)
* [`process.stdout`][], [`process.stderr`][]

Alcuni di questi esempi sono in realtà dei [`Duplex`][] stream che implementano la [`Writable`][] interface.

Tutti gli [`Writable`][] stream implementano l'interface definita dalla classe `stream.Writable`.

Mentre le istanze specifiche degli [`Writable`][] stream possono variare in diversi modi, tutti gli `Writable` stream seguono lo stesso schema di utilizzo fondamentale illustrato nell'esempio seguente:

```js
const myStream = getWritableStreamSomehow();
myStream.write('some data');
myStream.write('some more data');
myStream.end('done writing data');
```

#### Class: stream.Writable
<!-- YAML
added: v0.9.4
-->

<!--type=class-->

##### Event: 'close'
<!-- YAML
added: v0.9.4
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18438
    description: Add `emitClose` option to specify if `'close'` is emitted on
                 destroy.
-->

L'evento `'close'` viene emesso quando lo stream ed una qualsiasi delle sue risorse sottostanti (ad esempio un file descriptor) sono stati chiusi. L'evento indica che non verrà emesso nessun altro evento e non si verificheranno ulteriori calcoli.

A [`Writable`][] stream will always emit the `'close'` event if it is created with the `emitClose` option.

##### Event: 'drain'
<!-- YAML
added: v0.9.4
-->

Se una chiamata a [`stream.write(chunk)`](#stream_writable_write_chunk_encoding_callback) restituisce `false`, verrà emesso l'evento `'drain'` quando è opportuno riprendere la scrittura dei dati sullo stream.

```js
// Scrive i dati nel dato writable stream un milione di volte.
// Sta attento al back-pressure.
function writeOneMillionTimes(writer, data, encoding, callback) {
  let i = 1000000;
  write();
  function write() {
    let ok = true;
    do {
      i--;
      if (i === 0) {
        // ultima volta!
        writer.write(data, encoding, callback);
      } else {
        // vedi se si deve continuare, od aspettare
        // non passare il callback, perché non si è ancora finito.
        ok = writer.write(data, encoding);
      }
    } while (i > 0 && ok);
    if (i > 0) {
      // da fermare subito!
      // scrivi qualcosa in più quando esegue il drain
      writer.once('drain', write);
    }
  }
}
```

##### Event: 'error'
<!-- YAML
added: v0.9.4
-->

* {Error}

L'evento `'error'` viene emesso se si verifica un errore durante la scrittura od il piping dei dati. Il callback del listener riceve un singolo argomento `Error` quando chiamato.

The stream is not closed when the `'error'` event is emitted.

##### Event: 'finish'
<!-- YAML
added: v0.9.4
-->

L'evento `'finish'` viene emesso dopo che è stato chiamato il metodo [`stream.end()`](#stream_writable_end_chunk_encoding_callback) e tutti i dati sono stati svuotati sul sistema sottostante.

```js
const writer = getWritableStreamSomehow();
for (let i = 0; i < 100; i++) {
  writer.write(`hello, #${i}!\n`);
}
writer.end('This is the end\n');
writer.on('finish', () => {
  console.log('All writes are now complete.');
});
```

##### Event: 'pipe'
<!-- YAML
added: v0.9.4
-->

* `src` {stream.Readable} source stream che esegue il piping a questo writable

L'evento `'pipe'` viene emesso quando il metodo [`stream.pipe()`][] viene chiamato su un readable stream, aggiungendo questo writable al suo insieme di destinazioni.

```js
const writer = getWritableStreamSomehow();
const reader = getReadableStreamSomehow();
writer.on('pipe', (src) => {
  console.log('Something is piping into the writer.');
  assert.equal(src, reader);
});
reader.pipe(writer);
```

##### Event: 'unpipe'
<!-- YAML
added: v0.9.4
-->

* `src` {stream.Readable} Il source stream che esegue lo [unpiped][`stream.unpipe()`] su questo writable

The `'unpipe'` event is emitted when the [`stream.unpipe()`][] method is called on a [`Readable`][] stream, removing this [`Writable`][] from its set of destinations.

This is also emitted in case this [`Writable`][] stream emits an error when a [`Readable`][] stream pipes into it.

```js
const writer = getWritableStreamSomehow();
const reader = getReadableStreamSomehow();
writer.on('unpipe', (src) => {
  console.log('Something has stopped piping into the writer.');
  assert.equal(src, reader);
});
reader.pipe(writer);
reader.unpipe(writer);
```

##### writable.cork()
<!-- YAML
added: v0.11.2
-->

Il metodo `writable.cork()` forza tutti i dati scritti a subire il buffer all'interno della memoria. I dati che hanno subito il buffer verranno svuotati quando verrà chiamato il metodo [`stream.uncork()`][] oppure il metodo [`stream.end()`](#stream_writable_end_chunk_encoding_callback).

L'intento primario di `writable.cork()` è quello di evitare una situazione in cui la scrittura di molti piccoli chunk di dati in uno stream non causi un backup nel buffer interno il quale avrebbe un impatto negativo sulle prestazioni. In tali situazioni, le implementazioni del metodo `writable._writev()` possono eseguire scritture memorizzate nei buffer in un modo più ottimizzato.

Vedi anche: [`writable.uncork()`][].

##### writable.destroy([error])
<!-- YAML
added: v8.0.0
-->

* `error` {Error}
* Restituisce: {this}

Destroy the stream, and emit the passed `'error'` and a `'close'` event. After this call, the writable stream has ended and subsequent calls to `write()` or `end()` will result in an `ERR_STREAM_DESTROYED` error. Implementors should not override this method, but instead implement [`writable._destroy()`](#stream_writable_destroy_err_callback).

##### writable.end(\[chunk\]\[, encoding\][, callback])
<!-- YAML
added: v0.9.4
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18780
    description: This method now returns a reference to `writable`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->

* `chunk` {string|Buffer|Uint8Array|any} Dati opzionali da scrivere. Per gli stream che non funzionano in object mode, `chunk` deve essere una stringa, un `Buffer` oppure un `Uint8Array`. Per gli stream in object mode, `chunk` può essere qualsiasi valore JavaScript diverso da `null`.
* `encoding` {string} The encoding if `chunk` is a string
* `callback` {Function} Callback opzionale per quando lo stream si conclude
* Restituisce: {this}

Calling the `writable.end()` method signals that no more data will be written to the [`Writable`][]. Gli argomenti facoltativi `chunk` ed `encoding` consentono di scrivere un'ultimo chuck di dati aggiuntivo immediatamente prima di chiudere lo stream. Se fornita, la funzione facoltativa `callback` è allegata come listener per l'evento [`'finish'`][].

Chiamare il metodo [`stream.write()`](#stream_writable_write_chunk_encoding_callback) dopo aver chiamato [`stream.end()`](#stream_writable_end_chunk_encoding_callback) genererà un errore.

```js
// scrive 'hello, ' e poi termina con 'world!'
const fs = require('fs');
const file = fs.createWriteStream('example.txt');
file.write('hello, ');
file.end('world!');
// scrivere di più ora non è permesso!
```

##### writable.setDefaultEncoding(encoding)
<!-- YAML
added: v0.11.15
changes:
  - version: v6.1.0
    pr-url: https://github.com/nodejs/node/pull/5040
    description: This method now returns a reference to `writable`.
-->

* `encoding` {string} Il nuovo encoding predefinito
* Restituisce: {this}

The `writable.setDefaultEncoding()` method sets the default `encoding` for a [`Writable`][] stream.

##### writable.uncork()
<!-- YAML
added: v0.11.2
-->

Il metodo `writable.uncork()` svuota tutti i dati memorizzati nel buffer da quando è stato chiamato [`stream.cork()`][].

Quando si utilizzano [`writable.cork()`][] e `writable.uncork()` per gestire il buffering di ciò che viene scritto su uno stream, si consiglia di rinviare le chiamate a `writable.uncork()` utilizzando `process.nextTick()`. Ciò consente il dosaggio di tutte le chiamate `writable.write()` che si verificano all'interno di una determinata fase dell'event loop di Node.js.

```js
stream.cork();
stream.write('some ');
stream.write('data ');
process.nextTick(() => stream.uncork());
```

If the [`writable.cork()`][] method is called multiple times on a stream, the same number of calls to `writable.uncork()` must be called to flush the buffered data.

```js
stream.cork();
stream.write('some ');
stream.cork();
stream.write('data ');
process.nextTick(() => {
  stream.uncork();
  // I dati non verranno svuotati fino a quando uncork() non verrà chiamato una seconda volta.
  stream.uncork();
});
```

Vedi anche: [`writable.cork()`][].

##### writable.writable
<!-- YAML
added: v0.8.0
-->

* {boolean}

Is `true` if it is safe to call [`writable.write()`][].

##### writable.writableHighWaterMark
<!-- YAML
added: v9.3.0
-->

* {number}

Restituisce il valore di `highWaterMark` passato durante la costruzione di questo `Writable`.

##### writable.writableLength
<!-- YAML
added: v9.4.0
-->

This property contains the number of bytes (or objects) in the queue ready to be written. The value provides introspection data regarding the status of the `highWaterMark`.

##### writable.write(chunk\[, encoding\]\[, callback\])
<!-- YAML
added: v0.9.4
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/6170
    description: Passing `null` as the `chunk` parameter will always be
                 considered invalid now, even in object mode.
-->

* `chunk` {string|Buffer|Uint8Array|any} Dati opzionali da scrivere. Per gli stream che non funzionano in object mode, `chunk` deve essere una stringa, un `Buffer` oppure un `Uint8Array`. Per gli stream in object mode, `chunk` può essere qualsiasi valore JavaScript diverso da `null`.
* `encoding` {string} La codifica, se `chunk` è una stringa
* `callback` {Function} Callback per quando questo chunk di dati viene svuotato
* Restituisce: {boolean} `false` se lo stream desidera che il calling code attenda l'evento `'drain'` da emettere prima di continuare a scrivere dati aggiuntivi; in caso contrario `true`.

Il metodo `writable.write()` scrive alcuni dati nello stream e chiama il `callback` fornito una volta che i dati sono stati completamente gestiti. Se si verifica un errore, il `callback` *può o non può* essere chiamato con l'errore come suo primo argomento. Per rilevare in modo affidabile gli errori di scrittura, aggiungi un listener per l'evento `'error'`.

Il valore restituito è `true` se il buffer interno è inferiore all'`highWaterMark` configurato quando lo stream è stato creato in seguito all'ammissione del `chunk`. Se viene restituito `false`, è necessario interrompere ulteriori tentativi di scrittura dei dati nello stream fino a quando non viene emesso l'evento [`'drain'`][].

Mentre uno stream non subisce il drain, le chiamate a `write()` eseguiranno il buffer di `chunk` e restituiranno false. Una volta che tutti gli attuali chunk memorizzati nel buffer hanno subito il drain (accettati per la consegna dal sistema operativo), verrà emesso l'evento `'drain'`. It is recommended that once `write()` returns false, no more chunks be written until the `'drain'` event is emitted. Quando è permesso chiamare `write()` su uno stream che non è sottoposto al drain, Node.js memorizzerà tramite il buffering tutti i chunk scritti finché non viene raggiunto l'utilizzo massimo della memoria, a quel punto si interromperà incondizionatamente. Ancor prima che si interrompa, l'uso elevato della memoria causerà scarso rendimento del garbage collector ed alti livelli di RSS (che in genere non vengono ripristinati nel sistema, anche dopo che la memoria non è più necessaria). Poiché i socket TCP potrebbero non subire mai il drain se il peer remoto non legge i dati, scrivere un socket che non subisce mai il drain può portare ad una vulnerabilità sfruttabile da remoto.

Writing data while the stream is not draining is particularly problematic for a [`Transform`][], because the `Transform` streams are paused by default until they are piped or a `'data'` or `'readable'` event handler is added.

If the data to be written can be generated or fetched on demand, it is recommended to encapsulate the logic into a [`Readable`][] and use [`stream.pipe()`][]. Tuttavia, se è preferibile chiamare `write()`, è possibile rispettare il backpressure ed evitare problemi di memoria usando l'evento [`'drain'`][]:

```js
function write(data, cb) {
  if (!stream.write(data)) {
    stream.once('drain', cb);
  } else {
    process.nextTick(cb);
  }
}

// Aspetta che cb venga chiamato prima di fare qualsiasi altra scrittura.
write('hello', () => {
  console.log('Write completed, do more writes now.');
});
```

A `Writable` stream in object mode will always ignore the `encoding` argument.

### Readable Stream

Gli readable stream sono un'abstraction per una *sorgente* da cui vengono utilizzati i dati.

Examples of `Readable` streams include:

* [Risposte HTTP, sul client](http.html#http_class_http_incomingmessage)
* [Richieste HTTP, sul server](http.html#http_class_http_incomingmessage)
* [fs read stream](fs.html#fs_class_fs_readstream)
* [zlib stream](zlib.html)
* [crypto streams](crypto.html)
* [TCP sockets](net.html#net_class_net_socket)
* [child process stdout ed stderr](child_process.html#child_process_subprocess_stdout)
* [`process.stdin`][]

All [`Readable`][] streams implement the interface defined by the `stream.Readable` class.

#### Two Reading Modes

`Readable` streams effectively operate in one of two modes: flowing and paused. These modes are separate from [object mode](#stream_object_mode). A [`Readable`][] stream can be in object mode or not, regardless of whether it is in flowing mode or paused mode.

* In flowing mode, data is read from the underlying system automatically and provided to an application as quickly as possible using events via the [`EventEmitter`][] interface.

* In paused mode, il metodo [`stream.read()`](#stream_readable_read_size) deve essere chiamato esplicitamente per leggere chunk di dati dallo stream.

All [`Readable`][] streams begin in paused mode but can be switched to flowing mode in one of the following ways:

* Aggiungendo un handler per gli eventi [`'data'`][].
* Chiamando il metodo [`stream.resume()`](#stream_readable_resume).
* Calling the [`stream.pipe()`][] method to send the data to a [`Writable`][].

The `Readable` can switch back to paused mode using one of the following:

* Se non ci sono destinazioni pipe, chiamando il metodo [`stream.pause()`](#stream_readable_pause).
* Se ci sono destinazioni pipe, rimuovendole tutte. Le destinazioni pipe multiple possono essere rimosse chiamando il metodo [`stream.unpipe()`][].

The important concept to remember is that a `Readable` will not generate data until a mechanism for either consuming or ignoring that data is provided. If the consuming mechanism is disabled or taken away, the `Readable` will *attempt* to stop generating the data.

For backward compatibility reasons, removing [`'data'`][] event handlers will **not** automatically pause the stream. Also, if there are piped destinations, then calling [`stream.pause()`](#stream_readable_pause) will not guarantee that the stream will *remain* paused once those destinations drain and ask for more data.

If a [`Readable`][] is switched into flowing mode and there are no consumers available to handle the data, that data will be lost. This can occur, for instance, when the `readable.resume()` method is called without a listener attached to the `'data'` event, or when a `'data'` event handler is removed from the stream.

Adding a [`'readable'`][] event handler automatically make the stream to stop flowing, and the data to be consumed via [`readable.read()`](#stream_readable_read_size). If the [`'readable'`] event handler is removed, then the stream will start flowing again if there is a [`'data'`][] event handler.

#### Tre Stati

The "two modes" of operation for a `Readable` stream are a simplified abstraction for the more complicated internal state management that is happening within the `Readable` stream implementation.

Specifically, at any given point in time, every `Readable` is in one of three possible states:

* `readable.readableFlowing === null`
* `readable.readableFlowing === false`
* `readable.readableFlowing === true`

When `readable.readableFlowing` is `null`, no mechanism for consuming the stream's data is provided. Therefore, the stream will not generate data. While in this state, attaching a listener for the `'data'` event, calling the `readable.pipe()` method, or calling the `readable.resume()` method will switch `readable.readableFlowing` to `true`, causing the `Readable` to begin actively emitting events as data is generated.

Calling `readable.pause()`, `readable.unpipe()`, or receiving backpressure will cause the `readable.readableFlowing` to be set as `false`, temporarily halting the flowing of events but *not* halting the generation of data. While in this state, attaching a listener for the `'data'` event will not switch `readable.readableFlowing` to `true`.

```js
const { PassThrough, Writable } = require('stream');
const pass = new PassThrough();
const writable = new Writable();

pass.pipe(writable);
pass.unpipe(writable);
// readableFlowing is now false

pass.on('data', (chunk) => { console.log(chunk.toString()); });
pass.write('ok');  // will not emit 'data'
pass.resume();     // must be called to make stream emit 'data'
```

While `readable.readableFlowing` is `false`, data may be accumulating within the stream's internal buffer.

#### Choose One API Style

The `Readable` stream API evolved across multiple Node.js versions and provides multiple methods of consuming stream data. In general, developers should choose *one* of the methods of consuming data and *should never* use multiple methods to consume data from a single stream. Specifically, using a combination of `on('data')`, `on('readable')`, `pipe()`, or async iterators could lead to unintuitive behavior.

L'uso del metodo `readable.pipe()` è consigliato per la maggior parte degli utenti poiché è stato implementato per fornire il modo più semplice di utilizzare i dati dello stream. Developers that require more fine-grained control over the transfer and generation of data can use the [`EventEmitter`][] and `readable.on('readable')`/`readable.read()` or the `readable.pause()`/`readable.resume()` APIs.

#### Class: stream.Readable
<!-- YAML
added: v0.9.4
-->

<!--type=class-->

##### Event: 'close'
<!-- YAML
added: v0.9.4
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18438
    description: Add `emitClose` option to specify if `'close'` is emitted on
                 destroy.
-->

L'evento `'close'` viene emesso quando lo stream ed una qualsiasi delle sue risorse sottostanti (ad esempio un file descriptor) sono stati chiusi. L'evento indica che non verrà emesso nessun altro evento e non si verificheranno ulteriori calcoli.

A [`Readable`][] stream will always emit the `'close'` event if it is created with the `emitClose` option.

##### Event: 'data'
<!-- YAML
added: v0.9.4
-->

* `chunk` {Buffer|string|any} Il chunk di dati. Per gli stream che non funzionano in object mode, il chunk sarà una stringa od un `Buffer`. Per gli stream che sono in object mode, il chunk può essere qualsiasi valore JavaScript diverso da `null`.

L'evento `'data'` viene emesso ogni volta che lo stream sta cedendo il possesso di un chunk di dati ad un consumer. Ciò può verificarsi ogni volta che lo stream viene cambiato nella flowing mode chiamando `readable.pipe()`, `readable.resume()`, oppure collegando un listener callback ad un evento `'data'`. L'evento `'data'` verrà emesso anche ogni volta che viene chiamato il metodo `readable.read()` e che sarà disponibile un chunk di dati da restituire.

Collegare un listener di eventi `'data'` ad uno stream che non è stato sospeso in modo esplicito farà sì che lo stream passi alla flowing mode. I dati verranno quindi passati non appena saranno disponibili.

Il listener callback passerà il chunk di dati come una stringa se è stato specificato un encoding predefinito per lo stream utilizzando il metodo `readable.setEncoding()`; in caso contrario i dati verranno passati come un `Buffer`.

```js
const readable = getReadableStreamSomehow();
readable.on('data', (chunk) => {
  console.log(`Received ${chunk.length} bytes of data.`);
});
```

##### Event: 'end'
<!-- YAML
added: v0.9.4
-->

L'evento `'end'` viene emesso quando non ci sono più dati da consumare dallo stream.

The `'end'` event **will not be emitted** unless the data is completely consumed. This can be accomplished by switching the stream into flowing mode, or by calling [`stream.read()`](#stream_readable_read_size) repeatedly until all data has been consumed.

```js
const readable = getReadableStreamSomehow();
readable.on('data', (chunk) => {
  console.log(`Received ${chunk.length} bytes of data.`);
});
readable.on('end', () => {
  console.log('There will be no more data.');
});
```

##### Event: 'error'
<!-- YAML
added: v0.9.4
-->

* {Error}

The `'error'` event may be emitted by a `Readable` implementation at any time. In genere, ciò può verificarsi se lo stream sottostante non è in grado di generare dati a causa di un errore interno sottostante oppure quando un'implementazione di stream tenta di inviare un chunk di dati non valido.

Il listener callback riceverà un singolo `Error` object.

##### Event: 'readable'
<!-- YAML
added: v0.9.4
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17979
    description: >
      The `'readable'` is always emitted in the next tick after `.push()`
      is called
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18994
    description: Using `'readable'` requires calling `.read()`.
-->

L'evento `'readable'` viene emesso quando sono disponibili dati da leggere dallo stream. In alcuni casi, associare un listener per l'evento `'readable'` causerà la lettura di una certa quantità di dati in un buffer interno.

```javascript
const readable = getReadableStreamSomehow();
readable.on('readable', function() {
  // ci sono alcuni dati da leggere ora
  let data;

  while (data = this.read()) {
    console.log(data);
  }
});
```

L'evento `'readable'` verrà emesso anche una volta raggiunta la fine dei dati dello stream ma prima che venga emesso l'evento `'end'`.

In effetti, l'evento `'readable'` indica che lo stream ha nuove informazioni: sono disponibili nuovi dati oppure è stata raggiunta la fine dello stream. Nel primo caso, [`stream.read()`](#stream_readable_read_size) restituirà i dati disponibili. Nel secondo ed ultimo caso, [`stream.read()`](#stream_readable_read_size) restituirà `null`. Ad esempio, nel caso seguente, `foo.txt` è un file vuoto (empty file):

```js
const fs = require('fs');
const rr = fs.createReadStream('foo.txt');
rr.on('readable', () => {
  console.log(`readable: ${rr.read()}`);
});
rr.on('end', () => {
  console.log('end');
});
```

L'output dell'esecuzione di questo script è:

```txt
$ node test.js
readable: null
end
```

In general, the `readable.pipe()` and `'data'` event mechanisms are easier to understand than the `'readable'` event. However, handling `'readable'` might result in increased throughput.

If both `'readable'` and [`'data'`][] are used at the same time, `'readable'` takes precedence in controlling the flow, i.e. `'data'` will be emitted only when [`stream.read()`](#stream_readable_read_size) is called. The `readableFlowing` property would become `false`. If there are `'data'` listeners when `'readable'` is removed, the stream will start flowing, i.e. `'data'` events will be emitted without calling `.resume()`.

##### readable.destroy([error])
<!-- YAML
added: v8.0.0
-->

* `error` {Error} Error which will be passed as payload in `'error'` event
* Restituisce: {this}

Destroy the stream, and emit `'error'` and `'close'`. After this call, the readable stream will release any internal resources and subsequent calls to `push()` will be ignored. Implementors should not override this method, but instead implement [`readable._destroy()`](#stream_readable_destroy_err_callback).

##### readable.isPaused()
<!-- YAML
added: v0.11.14
-->

* Restituisce: {boolean}

The `readable.isPaused()` method returns the current operating state of the `Readable`. Questo è usato principalmente dal meccanismo che sta alla base del metodo `readable.pipe()`. Nella maggior parte dei casi tipici, non ci sarà alcun motivo per utilizzare direttamente questo metodo.

```js
const readable = new stream.Readable();

readable.isPaused(); // === false
readable.pause();
readable.isPaused(); // === true
readable.resume();
readable.isPaused(); // === false
```

##### readable.pause()
<!-- YAML
added: v0.9.4
-->

* Restituisce: {this}

Il metodo `readable.pause()` causerà uno stream in flowing mode per interrompere l'emissione degli eventi [`'data'`][] tramite l'uscita dalla flowing mode stessa. Tutti i dati che diventano disponibili rimarranno nel buffer interno.

```js
const readable = getReadableStreamSomehow();
readable.on('data', (chunk) => {
  console.log(`Received ${chunk.length} bytes of data.`);
  readable.pause();
  console.log('There will be no additional data for 1 second.');
  setTimeout(() => {
    console.log('Now data will start flowing again.');
    readable.resume();
  }, 1000);
});
```

The `readable.pause()` method has no effect if there is a `'readable'` event listener.

##### readable.pipe(destination[, options])
<!-- YAML
added: v0.9.4
-->

* `destination` {stream.Writable} La destinazione per la quale scrivere i dati
* `options` {Object} Pipe options
  * `end` {boolean} Termina il writer quando finisce il reader. **Default:** `true`.
* Returns: {stream.Writable} The *destination*, allowing for a chain of pipes if it is a [`Duplex`][] or a [`Transform`][] stream

The `readable.pipe()` method attaches a [`Writable`][] stream to the `readable`, causing it to switch automatically into flowing mode and push all of its data to the attached [`Writable`][]. The flow of data will be automatically managed so that the destination `Writable` stream is not overwhelmed by a faster `Readable` stream.

Nell'esempio seguente tutti i dati vengono sottoposti al piping conducendoli dal `readable` all'interno di un file chiamato `file.txt`:

```js
const fs = require('fs');
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// Tutti i dati dal readable vanno all'interno di 'file.txt'
readable.pipe(writable);
```
It is possible to attach multiple `Writable` streams to a single `Readable` stream.

Il metodo `readable.pipe()` restituisce un riferimento allo stream di *destinazione* che consente di impostare catene di stream che sono stati sottoposti al piping:

```js
const fs = require('fs');
const r = fs.createReadStream('file.txt');
const z = zlib.createGzip();
const w = fs.createWriteStream('file.txt.gz');
r.pipe(z).pipe(w);
```

By default, [`stream.end()`](#stream_writable_end_chunk_encoding_callback) is called on the destination `Writable` stream when the source `Readable` stream emits [`'end'`][], so that the destination is no longer writable. To disable this default behavior, the `end` option can be passed as `false`, causing the destination stream to remain open:

```js
reader.pipe(writer, { end: false });
reader.on('end', () => {
  writer.end('Goodbye\n');
});
```

One important caveat is that if the `Readable` stream emits an error during processing, the `Writable` destination *is not closed* automatically. Se si verifica un errore, sarà necessario chiudere *manualmente* ogni stream così da evitare perdite di memoria.

The [`process.stderr`][] and [`process.stdout`][] `Writable` streams are never closed until the Node.js process exits, regardless of the specified options.

##### readable.read([size])
<!-- YAML
added: v0.9.4
-->

* `size` {number} Argomento facoltativo per specificare la quantità di dati da leggere.
* Returns: {string|Buffer|null|any}

Il metodo `readable.read()` estrae alcuni dati dal buffer interno e li restituisce. Se non ci sono dati disponibili da leggere, viene restituito `null`. Per impostazione predefinita, i dati verranno restituiti come `Buffer` object a meno che non sia stato specificato un encoding utilizzando il metodo `readable.setEncoding()` o a meno che lo stream stia operando in object mode.

L'argomento facoltativo `size` specifica un numero specifico di bytes da leggere. Se i `size` bytes non sono disponibili per la lettura, sarà restituito `null` *a meno che* lo stream non sia terminato, in tal caso tutti i dati rimanenti nel buffer interno verranno restituiti.

Se l'argomento `size` non è specificato, verranno restituiti tutti i dati contenuti nel buffer interno.

The `readable.read()` method should only be called on `Readable` streams operating in paused mode. In flowing mode, `readable.read()` is called automatically until the internal buffer is fully drained.

```js
const readable = getReadableStreamSomehow();
readable.on('readable', () => {
  let chunk;
  while (null !== (chunk = readable.read())) {
    console.log(`Received ${chunk.length} bytes of data.`);
  }
});
```

Note that the `while` loop is necessary when processing data with `readable.read()`. Only after `readable.read()` returns `null`, [`'readable'`]() will be emitted.

A `Readable` stream in object mode will always return a single item from a call to [`readable.read(size)`](#stream_readable_read_size), regardless of the value of the `size` argument.

If the `readable.read()` method returns a chunk of data, a `'data'` event will also be emitted.

Calling [`stream.read([size])`](#stream_readable_read_size) after the [`'end'`][] event has been emitted will return `null`. Non verrà generato nessun errore di runtime.

##### readable.readable
<!-- YAML
added: v0.8.0
-->

* {boolean}

Is `true` if it is safe to call [`readable.read()`][].

##### readable.readableHighWaterMark
<!-- YAML
added: v9.3.0
-->

* {number}

Returns the value of `highWaterMark` passed when constructing this `Readable`.

##### readable.readableLength
<!-- YAML
added: v9.4.0
-->

* {number}

This property contains the number of bytes (or objects) in the queue ready to be read. The value provides introspection data regarding the status of the `highWaterMark`.

##### readable.resume()
<!-- YAML
added: v0.9.4
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18994
    description: The `resume()` has no effect if there is a `'readable'` event
                 listening.
-->

* Restituisce: {this}

The `readable.resume()` method causes an explicitly paused `Readable` stream to resume emitting [`'data'`][] events, switching the stream into flowing mode.

The `readable.resume()` method can be used to fully consume the data from a stream without actually processing any of that data:

```js
getReadableStreamSomehow()
  .resume()
  .on('end', () => {
    console.log('Reached the end, but did not read anything.');
  });
```

The `readable.resume()` method has no effect if there is a `'readable'` event listener.

##### readable.setEncoding(encoding)
<!-- YAML
added: v0.9.4
-->

* `encoding` {string} L'encoding da utilizzare.
* Restituisce: {this}

The `readable.setEncoding()` method sets the character encoding for data read from the `Readable` stream.

Per impostazione predefinita, non viene assegnato alcun encoding ed i dati dello stream verranno restituiti come `Buffer` objects. L'impostazione di un encoding fa sì che i dati dello stream vengano restituiti come stringhe dell'encoding specificato anziché come `Buffer` objects. Ad esempio, chiamare `readable.setEncoding('utf8')` farà in modo che i dati di output vengano interpretati come dati UTF-8 e successivamente passati come stringhe. Chiamare `readable.setEncoding('hex')` farà sì che i dati vengano codificati in formato stringa esadecimale.

The `Readable` stream will properly handle multi-byte characters delivered through the stream that would otherwise become improperly decoded if simply pulled from the stream as `Buffer` objects.

```js
const readable = getReadableStreamSomehow();
readable.setEncoding('utf8');
readable.on('data', (chunk) => {
  assert.equal(typeof chunk, 'string');
  console.log('Got %d characters of string data:', chunk.length);
});
```

##### readable.unpipe([destination])
<!-- YAML
added: v0.9.4
-->

* `destination` {stream.Writable} Stream specifico opzionale da sottoporre all’unpiping
* Restituisce: {this}

The `readable.unpipe()` method detaches a `Writable` stream previously attached using the [`stream.pipe()`][] method.

Se la `destination` non è specificata, allora *tutti* i pipe vengono scollegati.

Se la `destination` è specificata, ma non è stata impostato alcun pipe per essa, il metodo non esegue nulla.

```js
const fs = require('fs');
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// All the data from readable goes into 'file.txt',
// but only for the first second
readable.pipe(writable);
setTimeout(() => {
  console.log('Stop writing to file.txt.');
  readable.unpipe(writable);
  console.log('Manually close the file stream.');
  writable.end();
}, 1000);
```

##### readable.unshift(chunk)
<!-- YAML
added: v0.9.11
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->

* `chunk` {Buffer|Uint8Array|string|any} Chunk di dati da passare alla read queue. Per gli stream che non funzionano in object mode, `chunk` deve essere una stringa, un `Buffer` oppure un `Uint8Array`. Per gli stream in object mode, `chunk` può essere qualsiasi valore JavaScript diverso da `null`.

Il metodo `readable.unshift()` inserisce nuovamente un chunk di dati nel buffer interno. Ciò è utile in determinate situazioni nelle quali uno stream viene utilizzato/consumato dal codice che deve "non-consumare" una certa quantità di dati che è stata ottimisticamente estratta dalla sorgente, in modo che i dati possano essere trasmessi da un'altra parte.

The `stream.unshift(chunk)` method cannot be called after the [`'end'`][] event has been emitted or a runtime error will be thrown.

Developers using `stream.unshift()` often should consider switching to use of a [`Transform`][] stream instead. Vedi la sezione [API per gli Stream Implementer](#stream_api_for_stream_implementers) per maggiori informazioni.

```js
// Estrae un header delimitato da \n\n
// usa unshift() se otteniamo troppo
// Chiama il callback con (error, header, stream)
const { StringDecoder } = require('string_decoder');
function parseHeader(stream, callback) {
  stream.on('error', callback);
  stream.on('readable', onReadable);
  const decoder = new StringDecoder('utf8');
  let header = '';
  function onReadable() {
    let chunk;
    while (null !== (chunk = stream.read())) {
      const str = decoder.write(chunk);
      if (str.match(/\n\n/)) {
        // limite dell'header trovato
        const split = str.split(/\n\n/);
        header += split.shift();
        const remaining = split.join('\n\n');
        const buf = Buffer.from(remaining, 'utf8');
        stream.removeListener('error', callback);
        // rimuove il 'readable' listener prima dell'unshift
        stream.removeListener('readable', onReadable);
        if (buf.length)
          stream.unshift(buf);
        // now the body of the message can be read from the stream.
        callback(null, header, stream);
      } else {
        // sta ancora leggendo l'header.
        header += str;
      }
    }
  }
}
```

Unlike [`stream.push(chunk)`](#stream_readable_push_chunk_encoding), `stream.unshift(chunk)` will not end the reading process by resetting the internal reading state of the stream. This can cause unexpected results if `readable.unshift()` is called during a read (i.e. from within a [`stream._read()`](#stream_readable_read_size_1) implementation on a custom stream). Following the call to `readable.unshift()` with an immediate [`stream.push('')`](#stream_readable_push_chunk_encoding) will reset the reading state appropriately, however it is best to simply avoid calling `readable.unshift()` while in the process of performing a read.

##### readable.wrap(stream)
<!-- YAML
added: v0.9.4
-->

* `stream` {Stream} Un readable stream "vecchio stile"
* Restituisce: {this}

Prior to Node.js 0.10, streams did not implement the entire `stream` module API as it is currently defined. (See [Compatibility](#stream_compatibility_with_older_node_js_versions) for more information.)

When using an older Node.js library that emits [`'data'`][] events and has a [`stream.pause()`](#stream_readable_pause) method that is advisory only, the `readable.wrap()` method can be used to create a [`Readable`][] stream that uses the old stream as its data source.

Raramente sarà necessario utilizzare `readable.wrap()` ma questo metodo è stato fornito come soluzione per interagire con le applicazioni e librerie Node.js precedenti.

```js
const { OldReader } = require('./old-api-module.js');
const { Readable } = require('stream');
const oreader = new OldReader();
const myReader = new Readable().wrap(oreader);

myReader.on('readable', () => {
  myReader.read(); // ecc.
});
```

##### readable\[Symbol.asyncIterator\]()
<!-- YAML
added: v10.0.0
-->

> Stability: 1 - Experimental

* Returns: {AsyncIterator} to fully consume the stream.

```js
const fs = require('fs');

async function print(readable) {
  readable.setEncoding('utf8');
  let data = '';
  for await (const k of readable) {
    data += k;
  }
  console.log(data);
}

print(fs.createReadStream('file')).catch(console.log);
```

If the loop terminates with a `break` or a `throw`, the stream will be destroyed. In other terms, iterating over a stream will consume the stream fully. The stream will be read in chunks of size equal to the `highWaterMark` option. In the code example above, data will be in a single chunk if the file has less then 64kb of data because no `highWaterMark` option is provided to [`fs.createReadStream()`][].

### Duplex Stream e Transform Stream

#### Class: stream.Duplex
<!-- YAML
added: v0.9.4
changes:
  - version: v6.8.0
    pr-url: https://github.com/nodejs/node/pull/8834
    description: Instances of `Duplex` now return `true` when
                 checking `instanceof stream.Writable`.
-->

<!--type=class-->

Duplex streams are streams that implement both the [`Readable`][] and [`Writable`][] interfaces.

Examples of `Duplex` streams include:

* [TCP sockets](net.html#net_class_net_socket)
* [zlib stream](zlib.html)
* [crypto streams](crypto.html)

#### Class: stream.Transform
<!-- YAML
added: v0.9.4
-->

<!--type=class-->

Transform streams are [`Duplex`][] streams where the output is in some way related to the input. Like all [`Duplex`][] streams, `Transform` streams implement both the [`Readable`][] and [`Writable`][] interfaces.

Examples of `Transform` streams include:

* [zlib stream](zlib.html)
* [crypto streams](crypto.html)

##### transform.destroy([error])
<!-- YAML
added: v8.0.0
-->
* `error` {Error}

Distrugge lo stream ed emette `'error'`. Dopo questa chiamata, il transform stream rilascerebbe qualsiasi risorsa interna. Implementors should not override this method, but instead implement [`readable._destroy()`](#stream_readable_destroy_err_callback). The default implementation of `_destroy()` for `Transform` also emit `'close'`.

### stream.finished(stream, callback)
<!-- YAML
added: v10.0.0
-->

* `stream` {Stream} A readable and/or writable stream.
* `callback` {Function} Una funzione di callback che accetta un argomento error opzionale.

A function to get notified when a stream is no longer readable, writable or has experienced an error or a premature close event.

```js
const { finished } = require('stream');

const rs = fs.createReadStream('archive.tar');

finished(rs, (err) => {
  if (err) {
    console.error('Stream failed.', err);
  } else {
    console.log('Stream is done reading.');
  }
});

rs.resume(); // drain the stream
```

Especially useful in error handling scenarios where a stream is destroyed prematurely (like an aborted HTTP request), and will not emit `'end'` or `'finish'`.

The `finished` API is promisify-able as well;

```js
const finished = util.promisify(stream.finished);

const rs = fs.createReadStream('archive.tar');

async function run() {
  await finished(rs);
  console.log('Stream is done reading.');
}

run().catch(console.error);
rs.resume(); // drain the stream
```

### stream.pipeline(...streams[, callback])
<!-- YAML
added: v10.0.0
-->

* `...streams` {Stream} Two or more streams to pipe between.
* `callback` {Function} Una funzione di callback che accetta un argomento error opzionale.

A module method to pipe between streams forwarding errors and properly cleaning up and provide a callback when the pipeline is complete.

```js
const { pipeline } = require('stream');
const fs = require('fs');
const zlib = require('zlib');

// Utilizza la pipeline API per unire facilmente tramite il piping una serie
// di stream e ricevere notifiche quando la pipeline è completa.

// A pipeline to gzip a potentially huge tar file efficiently:

pipeline(
  fs.createReadStream('archive.tar'),
  zlib.createGzip(),
  fs.createWriteStream('archive.tar.gz'),
  (err) => {
    if (err) {
      console.error('Pipeline failed.', err);
    } else {
      console.log('Pipeline succeeded.');
    }
  }
);
```

The `pipeline` API is promisify-able as well:

```js
const pipeline = util.promisify(stream.pipeline);

async function run() {
  await pipeline(
    fs.createReadStream('archive.tar'),
    zlib.createGzip(),
    fs.createWriteStream('archive.tar.gz')
  );
  console.log('Pipeline succeeded.');
}

run().catch(console.error);
```

## API per gli Stream Implementer

<!--type=misc-->

L'API del modulo `stream` è stata progettata per rendere possibile la facile implementazione degli stream utilizzando il modello dell'ereditarietà prototipale di JavaScript.

Innanzitutto, uno sviluppatore di stream dichiarerebbe una nuova classe JavaScript che estende una delle quattro classi base dello stream (`stream.Writable`, `stream.Readable`, `stream.Duplex`, oppure `stream.Transform`), assicurandosi che chiamino l'appropriato constructor della parent class:
```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor(options) {
    super(options);
    // ...
  }
}
```

La nuova classe dello stream deve quindi implementare uno o più metodi specifici, in base al tipo di stream che viene creato, come descritto nel grafico seguente:

| Caso d'utilizzo                                    | Classe        | Metodo(i) da implementare                                                                               |
| -------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------- |
| Solo lettura                                       | [`Readable`]  | <code>[_read][stream-_read]</code>                                                                               |
| Solo scrittura                                     | [`Writable`]  | <code>[_write][stream-_write]</code>, <code>[_writev][stream-_writev]</code>, <code>[_final][stream-_final]</code>                           |
| Lettura e scrittura                                | [`Duplex`]    | <code>[_read][stream-_read]</code>, <code>[_write][stream-_write]</code>, <code>[_writev][stream-_writev]</code>, <code>[_final][stream-_final]</code> |
| Operazione su dati scritti e lettura del risultato | [`Transform`] | <code>[_transform][stream-_transform]</code>, <code>[_flush][stream-_flush]</code>, <code>[_final][stream-_final]</code>                          |

The implementation code for a stream should *never* call the "public" methods of a stream that are intended for use by consumers (as described in the [API for Stream Consumers](#stream_api_for_stream_consumers) section). Doing so may lead to adverse side effects in application code consuming the stream.

### Costruzione semplificata<!-- YAML
added: v1.2.0
-->Per molti semplici casi, è possibile costruire uno stream senza fare affidamento sull'ereditarietà. Questo può essere ottenuto creando direttamente istanze degli objects `stream.Writable`, `stream.Readable`, `stream.Duplex` oppure `stream.Transform` e passando metodi appropriati come opzioni di constructor.

```js
const { Writable } = require('stream');

const myWritable = new Writable({
  write(chunk, encoding, callback) {
    // ...
  }
});
```

### Implementazione di un Writable Stream

The `stream.Writable` class is extended to implement a [`Writable`][] stream.

Custom `Writable` streams *must* call the `new stream.Writable([options])` constructor and implement the `writable._write()` method. The `writable._writev()` method *may* also be implemented.

#### Constructor: new stream.Writable([options])<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18438
    description: >
      Add `emitClose` option to specify if `'close'` is emitted on destroy
  - version: v10.16.0
    pr-url: https://github.com/nodejs/node/pull/22795
    description: >
      Add `autoDestroy` option to automatically `destroy()` the stream
      when it emits `'finish'` or errors
-->* `options` {Object}
  * `highWaterMark` {number} Livello del buffer quando [`stream.write()`](#stream_writable_write_chunk_encoding_callback) inizia a restituire `false`. **Default:** `16384` (16kb), or `16` for `objectMode` streams.
  * `decodeStrings` {boolean} Whether to encode `string`s passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback) to `Buffer`s (with the encoding specified in the [`stream.write()`](#stream_writable_write_chunk_encoding_callback) call) before passing them to [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1). Other types of data are not converted (i.e. `Buffer`s are not decoded into `string`s). Setting to false will prevent `string`s from being converted.  **Default:** `true`.
  * `defaultEncoding` {string} The default encoding that is used when no encoding is specified as an argument to [`stream.write()`](#stream_writable_write_chunk_encoding_callback). **Default:** `'utf8'`.
  * `objectMode` {boolean} Indipendentemente dal fatto che [`stream.write(anyObj)`](#stream_writable_write_chunk_encoding_callback) sia un'operazione valida. Quando è impostato, diventa possibile scrivere valori JavaScript diversi da una stringa, un `Buffer` od un `Uint8Array` se supportati dall'implementazione dello stream. **Default:** `false`.
  * `emitClose` {boolean} Whether or not the stream should emit `'close'` after it has been destroyed. **Default:** `true`.
  * `write` {Function} Implementazione per il metodo [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1).
  * `writev` {Function} Implementazione per il metodo [`stream._writev()`](#stream_writable_writev_chunks_callback).
  * `destroy` {Function} Implementazione per il metodo [`stream._destroy()`](#stream_writable_destroy_err_callback).
  * `final` {Function} Implementazione per il metodo [`stream._final()`](#stream_writable_final_callback).
  * `autoDestroy` {boolean} Whether this stream should automatically call `.destroy()` on itself after ending. **Default:** `false`.
```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor(options) {
    // Chiama il constructor stream.Writable()
    super(options);
    // ...
  }
}
```

Oppure, quando si utilizzano constructor di stili pre-ES6:

```js
const { Writable } = require('stream');
const util = require('util');

function MyWritable(options) {
  if (!(this instanceof MyWritable))
    return new MyWritable(options);
  Writable.call(this, options);
}
util.inherits(MyWritable, Writable);
```

Oppure, utilizzando l'approccio del Constructor semplificato:

```js
const { Writable } = require('stream');

const myWritable = new Writable({
  write(chunk, encoding, callback) {
    // ...
  },
  writev(chunks, callback) {
    // ...
  }
});
```

#### writable.\_write(chunk, encoding, callback)

* `chunk` {Buffer|string|any} The `Buffer` to be written, converted from the `string` passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback). If the stream's `decodeStrings` option is `false` or the stream is operating in object mode, the chunk will not be converted & will be whatever was passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback).
* `encoding` {string} Se il chunk è una stringa, allora `encoding` è l'encoding del carattere di quella stringa. Se il chunk è un `Buffer`, o se lo stream sta operando in object mode, l'`encoding` potrebbe essere ignorato.
* `callback` {Function} Chiama questa funzione (facoltativamente con un argomento error) quando l'elaborazione per il chunk fornito è completa.

All `Writable` stream implementations must provide a [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1) method to send data to the underlying resource.

[`Transform`][] streams provide their own implementation of the [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1).

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Writable` class methods only.

Il metodo `callback` deve essere chiamato per segnalare che la scrittura è stata completata correttamente oppure che ha avuto esito negativo con un errore. Il primo argomento passato al `callback` deve essere l'`Error` object se la chiamata non è riuscita oppure `null` se la scrittura è andata a buon fine.

Tutte le chiamate a `writable.write()` che si verificano tra il momento in cui `writable._write()` viene chiamato ed il momento in cui il `callback` viene chiamato faranno sì che i dati scritti siano memorizzati in un buffer. Quando viene invocato il `callback`, lo stream potrebbe emettere un evento [`'drain'`][]. Se un'implementazione di stream è in grado di elaborare molteplici chunk di dati contemporaneamente, è necessario implementare il metodo `writable._writev()`.

If the `decodeStrings` property is explicitly set to `false` in the constructor options, then `chunk` will remain the same object that is passed to `.write()`, and may be a string rather than a `Buffer`. This is to support implementations that have an optimized handling for certain string data encodings. In that case, the `encoding` argument will indicate the character encoding of the string. Otherwise, the `encoding` argument can be safely ignored.

Il metodo `writable._write()` è preceduto da un trattino basso (underscore) perché è interno alla classe che lo definisce e non dovrebbe mai essere chiamato direttamente dai programmi utente.

#### writable.\_writev(chunks, callback)

* `chunks` {Object[]} The chunks to be written. Ogni chunk ha il seguente formato: `{ chunk: ..., encoding: ... }`.
* `callback` {Function} Una funzione di callback (facoltativamente con un argomento error) da invocare quando l'elaborazione per i chunk forniti è completa.

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Writable` class methods only.

Il metodo `writable._writev()` può essere implementato in aggiunta a `writable._write()` nelle implementazioni di stream in grado di elaborare molteplici chunk di dati contemporaneamente. Se implementato, il metodo verrà chiamato con tutti i chunk di dati attualmente memorizzati tramite il buffering nella write queue.

Il metodo `writable._writev()` è preceduto da un trattino basso (underscore) perché è interno alla classe che lo definisce e non dovrebbe mai essere chiamato direttamente dai programmi utente.

#### writable.\_destroy(err, callback)<!-- YAML
added: v8.0.0
-->* `err` {Error} Un possibile errore.
* `callback` {Function} Una funzione di callback che accetta un argomento error opzionale.

Il metodo `_destroy()` è chiamato da [`writable.destroy()`](#stream_writable_destroy_error). Può essere sovrascritto dalle child class ma **non deve** essere chiamato direttamente.

#### writable.\_final(callback)<!-- YAML
added: v8.0.0
-->* `callback` {Function} Chiama questa funzione (facoltativamente con un argomento error) quando si è conclusa la scrittura di qualsiasi dato rimanente.

Il metodo `_final()` **non deve** essere chiamato direttamente. It may be implemented by child classes, and if so, will be called by the internal `Writable` class methods only.

This optional function will be called before the stream closes, delaying the `'finish'` event until `callback` is called. Questo è utile per chiudere le risorse o scrivere dati memorizzati nel buffer prima che uno stream finisca.

#### Errori Durante la Scrittura

Si raccomanda di segnalare gli errori che si verificano durante l'elaborazione dei metodi `writable._write()` e `writable._writev()` invocando il callback e passando l'errore come primo argomento. This will cause an `'error'` event to be emitted by the `Writable`. Throwing an `Error` from within `writable._write()` can result in unexpected and inconsistent behavior depending on how the stream is being used. L'utilizzo del callback garantisce una gestione degli errori coerente e prevedibile.

If a `Readable` stream pipes into a `Writable` stream when `Writable` emits an error, the `Readable` stream will be unpiped.

```js
const { Writable } = require('stream');

const myWritable = new Writable({
  write(chunk, encoding, callback) {
    if (chunk.toString().indexOf('a') >= 0) {
      callback(new Error('chunk is invalid'));
    } else {
      callback();
    }
  }
});
```

#### Un Esempio di Writable Stream

The following illustrates a rather simplistic (and somewhat pointless) custom `Writable` stream implementation. While this specific `Writable` stream instance is not of any real particular usefulness, the example illustrates each of the required elements of a custom [`Writable`][] stream instance:

```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  _write(chunk, encoding, callback) {
    if (chunk.toString().indexOf('a') >= 0) {
      callback(new Error('chunk is invalid'));
    } else {
      callback();
    }
  }
}
```

#### Decodifica dei buffer in un Writable Stream

La decodifica dei buffer è un'attività comune, ad esempio, quando si usano dei transformer il cui input è una stringa. Non è un processo banale quando si utilizza la codifica di caratteri multi-byte, come ad esempio UTF-8. The following example shows how to decode multi-byte strings using `StringDecoder` and [`Writable`][].

```js
const { Writable } = require('stream');
const { StringDecoder } = require('string_decoder');

class StringWritable extends Writable {
  constructor(options) {
    super(options);
    this._decoder = new StringDecoder(options && options.defaultEncoding);
    this.data = '';
  }
  _write(chunk, encoding, callback) {
    if (encoding === 'buffer') {
      chunk = this._decoder.write(chunk);
    }
    this.data += chunk;
    callback();
  }
  _final(callback) {
    this.data += this._decoder.end();
    callback();
  }
}

const euro = [[0xE2, 0x82], [0xAC]].map(Buffer.from);
const w = new StringWritable();

w.write('currency: ');
w.write(euro[0]);
w.end(euro[1]);

console.log(w.data); // currency: €
```

### Implementazione di un Readable Stream

The `stream.Readable` class is extended to implement a [`Readable`][] stream.

Custom `Readable` streams *must* call the `new stream.Readable([options])` constructor and implement the `readable._read()` method.

#### new stream.Readable([options])<!-- YAML
changes:
  - version: v10.16.0
    pr-url: https://github.com/nodejs/node/pull/22795
    description: >
      Add `autoDestroy` option to automatically `destroy()` the stream
      when it emits `'end'` or errors
-->* `options` {Object}
  * `highWaterMark` {number} Il massimo [numero di bytes](#stream_highwatermark_discrepancy_after_calling_readable_setencoding) da memorizzare nel buffer interno prima di interrompere la lettura dalla risorsa sottostante. **Default:** `16384` (16kb), or `16` for `objectMode` streams.
  * `encoding` {string} Se specificato, i buffer verranno decodificati in stringhe utilizzando tale encoding. **Default:** `null`.
  * `objectMode` {boolean} Se questo stream dovrebbe comportarsi come uno stream di objects. Meaning that [`stream.read(n)`](#stream_readable_read_size) returns a single value instead of a `Buffer` of size `n`. **Default:** `false`.
  * `read` {Function} Implementazione per il metodo [`stream._read()`](#stream_readable_read_size_1).
  * `destroy` {Function} Implementation for the [`stream._destroy()`](#stream_readable_destroy_err_callback) method.
  * `autoDestroy` {boolean} Whether this stream should automatically call `.destroy()` on itself after ending. **Default:** `false`.
```js
const { Readable } = require('stream');

class MyReadable extends Readable {
  constructor(options) {
    // Chiama il constructor stream.Readable(options)
    super(options);
    // ...
  }
}
```

Oppure, quando si utilizzano constructor di stili pre-ES6:

```js
const { Readable } = require('stream');
const util = require('util');

function MyReadable(options) {
  if (!(this instanceof MyReadable))
    return new MyReadable(options);
  Readable.call(this, options);
}
util.inherits(MyReadable, Readable);
```

Oppure, utilizzando l'approccio del Constructor semplificato:

```js
const { Readable } = require('stream');

const myReadable = new Readable({
  read(size) {
    // ...
  }
});
```

#### readable.\_read(size)<!-- YAML
added: v0.9.4
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17979
    description: call `_read()` only once per microtick
-->* `size` {number} Numero di bytes da leggere in modo asincrono

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Readable` class methods only.

All `Readable` stream implementations must provide an implementation of the `readable._read()` method to fetch data from the underlying resource.

Quando viene chiamato `readable._read()`, se i dati sono disponibili dalla risorsa, l'implementazione dovrebbe iniziare ad eseguire il push dei dati nella read queue utilizzando il metodo [`this.push(dataChunk)`](#stream_readable_push_chunk_encoding). `_read()` dovrebbe continuare la lettura dalla risorsa ed eseguire il push dei dati finché `readable.push()` restituisce `false`. Solo quando `_read()` viene chiamato ancora dopo essersi fermato, dovrebbe riprendere ad eseguire il push degli altri dati nella queue.

Once the `readable._read()` method has been called, it will not be called again until the [`readable.push()`](#stream_readable_push_chunk_encoding) method is called. `readable._read()` is guaranteed to be called only once within a synchronous execution, i.e. a microtick.

L'argomento `size` è di consulenza. Per le implementazioni in cui una "lettura" è una singola operazione che restituisce i dati, è possibile utilizzare l'argomento `size` per determinare la quantità di dati da recuperare. Altre implementazioni possono ignorare questo argomento e fornire dati semplicemente ogni volta che diventano disponibili. Non è necessario "attendere" che i `size` bytes siano disponibili prima di chiamare [`stream.push(chunk)`](#stream_readable_push_chunk_encoding).

Il metodo `readable._read()` è precedetuo da un trattino basso (underscore) perché è interno alla classe che lo definisce e non dovrebbe mai essere chiamato direttamente dai programmi utente.

#### readable.\_destroy(err, callback)<!-- YAML
added: v8.0.0
-->* `err` {Error} Un possibile errore.
* `callback` {Function} Una funzione di callback che accetta un argomento error opzionale.

Il metodo `_destroy()` è chiamato da [`readable.destroy()`](#stream_readable_destroy_error). Può essere sovrascritto dalle child class ma **non deve** essere chiamato direttamente.

#### readable.push(chunk[, encoding])<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->* `chunk` {Buffer|Uint8Array|string|null|any} Chunk di dati da inserire tramite push nella read queue. Per gli stream che non funzionano in object mode, `chunk` deve essere una stringa, un `Buffer` oppure un `Uint8Array`. Per gli stream in object mode, `chunk` può essere qualsiasi valore JavaScript.
* `encoding` {string} Encoding degli string chunk. Must be a valid `Buffer` encoding, such as `'utf8'` or `'ascii'`.
* Returns: {boolean} `true` if additional chunks of data may continue to be pushed; `false` otherwise.

Quando `chunk` è un `Buffer`, un `Uint8Array` oppure una `string`, il `chunk` dei dati verrà aggiunto alla queue interna per gli utenti dello stream da consumare. Passare `chunk` come `null` segnala la fine dello stream (EOF), dopo di che non è più possibile scrivere dati.

When the `Readable` is operating in paused mode, the data added with `readable.push()` can be read out by calling the [`readable.read()`](#stream_readable_read_size) method when the [`'readable'`][] event is emitted.

When the `Readable` is operating in flowing mode, the data added with `readable.push()` will be delivered by emitting a `'data'` event.

Il metodo `readable.push()` è progettato per essere il più flessibile possibile. For example, when wrapping a lower-level source that provides some form of pause/resume mechanism, and a data callback, the low-level source can be wrapped by the custom `Readable` instance:

```js
// source (sorgente) è un object con i metodi readStop() e readStart(),
// ed un membro `ondata` che viene chiamato quando ha dati, 
// ed un membro `onend` che viene chiamato quando i dati sono finiti.

class SourceWrapper extends Readable {
  constructor(options) {
    super(options);

    this._source = getLowlevelSourceObject();

    // Ogni volta che ci sono dati, inserirli tramite il push nel buffer interno.
    this._source.ondata = (chunk) => {
      // se push() restituisce false, allora interrompe la lettura del source
      if (!this.push(chunk))
        this._source.readStop();
    };

    // Quando source finisce, esegue il push del chunk `null` di segnalazione EOF.
    this._source.onend = () => {
      this.push(null);
    };
  }
  //_read verrà chiamato quando lo stream vuole attirare più dati
  // l'argomento size di consulenza è ignorato in questo caso.
  _read(size) {
    this._source.readStart();
  }
}
```

The `readable.push()` method is intended be called only by `Readable` implementers, and only from within the `readable._read()` method.

Per gli stream che non operano in object mode, se il parametro `chunk` di `readable.push()` è `undefined`, verrà considerato come stringa vuota o buffer. Vedi [`readable.push('')`][] per maggiori informazioni.

#### Errori Durante la Lettura

E' consigliato emettere gli errori, che si verificano durante l'elaborazione del metodo `readable._read()`, utilizzando l'evento `'error'` anziché lanciandoli. Throwing an `Error` from within `readable._read()` can result in unexpected and inconsistent behavior depending on whether the stream is operating in flowing or paused mode. L'utilizzo dell'evento `'error'` garantisce una gestione degli errori coerente e prevedibile.
```js
const { Readable } = require('stream');

const myReadable = new Readable({
  read(size) {
    if (checkSomeErrorCondition()) {
      process.nextTick(() => this.emit('error', err));
      return;
    }
    // fa del lavoro
  }
});
```

#### Un Esempio di Counting Stream<!--type=example-->The following is a basic example of a `Readable` stream that emits the numerals from 1 to 1,000,000 in ascending order, and then ends.

```js
const { Readable } = require('stream');

class Counter extends Readable {
  constructor(opt) {
    super(opt);
    this._max = 1000000;
    this._index = 1;
  }

  _read() {
    const i = this._index++;
    if (i > this._max)
      this.push(null);
    else {
      const str = String(i);
      const buf = Buffer.from(str, 'ascii');
      this.push(buf);
    }
  }
}
```

### Implementazione di un Duplex Stream

A [`Duplex`][] stream is one that implements both [`Readable`][] and [`Writable`][], such as a TCP socket connection.

Because JavaScript does not have support for multiple inheritance, the `stream.Duplex` class is extended to implement a [`Duplex`][] stream (as opposed to extending the `stream.Readable` *and* `stream.Writable` classes).

The `stream.Duplex` class prototypically inherits from `stream.Readable` and parasitically from `stream.Writable`, but `instanceof` will work properly for both base classes due to overriding [`Symbol.hasInstance`][] on `stream.Writable`.

Custom `Duplex` streams *must* call the `new stream.Duplex([options])` constructor and implement *both* the `readable._read()` and `writable._write()` methods.

#### new stream.Duplex(options)<!-- YAML
changes:
  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14636
    description: The `readableHighWaterMark` and `writableHighWaterMark` options
                 are supported now.
-->* `options` {Object} Passed to both `Writable` and `Readable` constructors. Inoltre ha le seguenti voci:
  * `allowHalfOpen` {boolean} Se impostato su `false`, lo stream terminerà automaticamente la parte writable quando termina la parte readable. **Default:** `true`.
  * `readableObjectMode` {boolean} Imposta `objectMode` per la parte readable dello stream. Non ha effetto se `objectMode` è `true`. **Default:** `false`.
  * `writableObjectMode` {boolean} Imposta `objectMode` per la parte writable dello stream. Non ha effetto se `objectMode` è `true`. **Default:** `false`.
  * `readableHighWaterMark` {number} Imposta `highWaterMark` per la parte readable dello stream. Non ha effetto se `highWaterMark` viene fornito.
  * `writableHighWaterMark` {number} Imposta `highWaterMark` per la parte writable dello stream. Non ha effetto se `highWaterMark` viene fornito.
```js
const { Duplex } = require('stream');

class MyDuplex extends Duplex {
  constructor(options) {
    super(options);
    // ...
  }
}
```

Oppure, quando si utilizzano constructor di stili pre-ES6:

```js
const { Duplex } = require('stream');
const util = require('util');

function MyDuplex(options) {
  if (!(this instanceof MyDuplex))
    return new MyDuplex(options);
  Duplex.call(this, options);
}
util.inherits(MyDuplex, Duplex);
```

Oppure, utilizzando l'approccio del Constructor semplificato:

```js
const { Duplex } = require('stream');

const myDuplex = new Duplex({
  read(size) {
    // ...
  },
  write(chunk, encoding, callback) {
    // ...
  }
});
```

#### Un Esempio di Duplex Stream

The following illustrates a simple example of a `Duplex` stream that wraps a hypothetical lower-level source object to which data can be written, and from which data can be read, albeit using an API that is not compatible with Node.js streams. The following illustrates a simple example of a `Duplex` stream that buffers incoming written data via the [`Writable`][] interface that is read back out via the [`Readable`][] interface.

```js
const { Duplex } = require('stream');
const kSource = Symbol('source');

class MyDuplex extends Duplex {
  constructor(source, options) {
    super(options);
    this[kSource] = source;
  }

  _write(chunk, encoding, callback) {
    // Il source sottostante si occupa solo di stringhe
    if (Buffer.isBuffer(chunk))
      chunk = chunk.toString();
    this[kSource].writeSomeData(chunk);
    callback();
  }

  _read(size) {
    this[kSource].fetchSomeData(size, (data, encoding) => {
      this.push(Buffer.from(data, encoding));
    });
  }
}
```

The most important aspect of a `Duplex` stream is that the `Readable` and `Writable` sides operate independently of one another despite co-existing within a single object instance.

#### Object Mode per i Duplex Stream

For `Duplex` streams, `objectMode` can be set exclusively for either the `Readable` or `Writable` side using the `readableObjectMode` and `writableObjectMode` options respectively.

In the following example, for instance, a new `Transform` stream (which is a type of [`Duplex`][] stream) is created that has an object mode `Writable` side that accepts JavaScript numbers that are converted to hexadecimal strings on the `Readable` side.

```js
const { Transform } = require('stream');

// Tutti i Transform stream sono anche Duplex stream
const myTransform = new Transform({
  writableObjectMode: true,

  transform(chunk, encoding, callback) {
    // Attribuisce il chunk ad un numero se necessario
    chunk |= 0;

    // Trasforma il chunk in qualcos'altro.
    const data = chunk.toString(16);

    // Esegue il push dei dati all'interno della readable queue.
    callback(null, '0'.repeat(data.length % 2) + data);
  }
});

myTransform.setEncoding('ascii');
myTransform.on('data', (chunk) => console.log(chunk));

myTransform.write(1);
// Stampa: 01
myTransform.write(10);
// Stampa: 0a
myTransform.write(100);
// Stampa: 64
```

### Implementazione di un Transform Stream

A [`Transform`][] stream is a [`Duplex`][] stream where the output is computed in some way from the input. Gli esempi includono gli [zlib](zlib.html) stream oppure i [crypto](crypto.html) stream che comprimono, codificano o decodificano i dati.

There is no requirement that the output be the same size as the input, the same number of chunks, or arrive at the same time. For example, a `Hash` stream will only ever have a single chunk of output which is provided when the input is ended. A `zlib` stream will produce output that is either much smaller or much larger than its input.

The `stream.Transform` class is extended to implement a [`Transform`][] stream.

La classe `stream.Transform` eredita prototipicamente da `stream.Duplex` ed implementa le proprie versioni dei metodi `writable._write()` e `readable._read()`. Custom `Transform` implementations *must* implement the [`transform._transform()`](#stream_transform_transform_chunk_encoding_callback) method and *may* also implement the [`transform._flush()`](#stream_transform_flush_callback) method.

Care must be taken when using `Transform` streams in that data written to the stream can cause the `Writable` side of the stream to become paused if the output on the `Readable` side is not consumed.

#### new stream.Transform([options])

* `options` {Object} Passed to both `Writable` and `Readable` constructors. Inoltre ha le seguenti voci:
  * `transform` {Function} Implementazione per il metodo [`stream._transform()`](#stream_transform_transform_chunk_encoding_callback).
  * `flush` {Function} Implementazione per il metodo [`stream._flush()`](#stream_transform_flush_callback).
```js
const { Transform } = require('stream');

class MyTransform extends Transform {
  constructor(options) {
    super(options);
    // ...
  }
}
```

Oppure, quando si utilizzano constructor di stili pre-ES6:

```js
const { Transform } = require('stream');
const util = require('util');

function MyTransform(options) {
  if (!(this instanceof MyTransform))
    return new MyTransform(options);
  Transform.call(this, options);
}
util.inherits(MyTransform, Transform);
```

Oppure, utilizzando l'approccio del Constructor semplificato:

```js
const { Transform } = require('stream');

const myTransform = new Transform({
  transform(chunk, encoding, callback) {
    // ...
  }
});
```

#### Eventi: 'finish' ed 'end'

Gli eventi [`'finish'`][] ed [`'end'`][] provengono rispettivamente dalle classi `stream.Writable` e `stream.Readable`. L'evento `'finish'` viene emesso dopo che viene chiamato [`stream.end()`](#stream_writable_end_chunk_encoding_callback) e che tutti i chunk sono stati elaborati da [`stream._transform()`](#stream_transform_transform_chunk_encoding_callback). L'evento `'end'` viene emesso dopo l'emissione di tutti i dati, il che avviene dopo la chiamata del callback in [`transform._flush()`](#stream_transform_flush_callback).

#### transform.\_flush(callback)

* `callback` {Function} Una funzione di callback (facoltativamente con un argomento error e data) da chiamare quando i dati rimanenti sono stati svuotati.

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Readable` class methods only.

In alcuni casi, un'operazione transform potrebbe dover emettere un ulteriore bit di dati alla fine dello stream. Ad esempio, uno stream di compressione `zlib` memorizzerà una quantità di stato interno utilizzato per comprimere in modo ottimale l'output. Al termine dello stream, tuttavia, è necessario svuotare i dati aggiuntivi per completare i dati compressi.

Custom [`Transform`][] implementations *may* implement the `transform._flush()` method. This will be called when there is no more written data to be consumed, but before the [`'end'`][] event is emitted signaling the end of the [`Readable`][] stream.

Nell'implementazione `transform._flush()`, il metodo `readable.push()` può essere chiamato zero o più volte, a seconda dei casi. La funzione `callback` deve essere chiamata quando l'operazione flush è completa.

Il metodo `transform._flush()` è preceduto da un trattino basso (underscore) perché è interno alla classe che lo definisce e non dovrebbe mai essere chiamato direttamente dai programmi utente.

#### transform.\_transform(chunk, encoding, callback)

* `chunk` {Buffer|string|any} The `Buffer` to be transformed, converted from the `string` passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback). If the stream's `decodeStrings` option is `false` or the stream is operating in object mode, the chunk will not be converted & will be whatever was passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback).
* `encoding` {string} Se il chunk è una stringa, allora questo è il tipo di encoding. Se il chunk è un buffer, allora questo è il valore speciale - 'buffer', ignorarlo in questo caso.
* `callback` {Function} Una funzione di callback (facoltativamente con un argomento error e data) da chiamare dopo che il `chunk` fornito è stato elaborato.

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Readable` class methods only.

All `Transform` stream implementations must provide a `_transform()` method to accept input and produce output. L'implementazione `transform._transform()` gestisce i byte scritti, calcola un output, e di conseguenza passa quell'output alla porzione readable utilizzando il metodo `readable.push()`.

Il metodo `transform.push()` può essere chiamato zero o più volte per generare l'output da un singolo input chunk, a seconda di quanto deve essere prodotto come risultato del chunk.

È possibile che nessun output sia generato da un determinato chunk di dati input.

La funzione `callback` deve essere chiamata solo quando il chunk attuale è completamente consumato. Il primo argomento passato al `callback` deve essere un `Error` object se si verifica un errore durante l'elaborazione dell'input oppure `null` in caso contrario. Se viene passato un secondo argomento al `callback`, esso verrà inoltrato al metodo `readable.push()`. In other words, the following are equivalent:

```js
transform.prototype._transform = function(data, encoding, callback) {
  this.push(data);
  callback();
};

transform.prototype._transform = function(data, encoding, callback) {
  callback(null, data);
};
```

Il metodo `transform._transform()` è preceduto da un trattino basso (underscore) perché è interno alla classe che lo definisce e non dovrebbe mai essere chiamato direttamente dai programmi utente.

`transform._transform()` non viene mai chiamato in parallelo; gli stream implementano un meccanismo di queue, quindi per ricevere il chunk successivo è necessario chiamare `callback`, in modo sincrono oppure asincrono.

#### Class: stream.PassThrough

The `stream.PassThrough` class is a trivial implementation of a [`Transform`][] stream that simply passes the input bytes across to the output. E' utile principalmente per gli esempi e per il testing, ma ci sono alcuni casi d'uso in cui `stream.PassThrough` è utile anche come base per nuovi tipi di stream.

## Note aggiuntive<!--type=misc-->### Compatibilità con le Versioni Precedenti di Node.js<!--type=misc-->Prior to Node.js 0.10, the `Readable` stream interface was simpler, but also less powerful and less useful.

* Rather than waiting for calls to the [`stream.read()`](#stream_readable_read_size) method, [`'data'`][] events would begin emitting immediately. Le applicazioni che avevano bisogno di eseguire una certa quantità di lavoro per decidere come gestire i dati erano necessarie per memorizzare i read data all'interno dei buffer in modo che non andassero persi.
* Il metodo [`stream.pause()`](#stream_readable_pause) era di tipo consultivo, piuttosto che garantito. This meant that it was still necessary to be prepared to receive [`'data'`][] events *even when the stream was in a paused state*.

In Node.js 0.10, the [`Readable`][] class was added. For backward compatibility with older Node.js programs, `Readable` streams switch into "flowing mode" when a [`'data'`][] event handler is added, or when the [`stream.resume()`](#stream_readable_resume) method is called. L'effetto è che, anche quando non si utilizza il nuovo metodo [`stream.read()`](#stream_readable_read_size) e l'evento [`'readable'`][], non è più necessario preoccuparsi di perdere dei chunk di [`'data'`][].

Mentre la maggior parte delle applicazioni continueranno a funzionare normalmente, questo introduce un caso limite nelle seguenti condizioni:

* Non viene aggiunto nessun listener di eventi [`'data'`][].
* Il metodo [`stream.resume()`](#stream_readable_resume) non viene mai chiamato.
* Lo stream non è collegato tramite piping a nessuna destinazione writable.

Ad esempio, considera il seguente codice:

```js
// ATTENZIONE!  DANNEGGIATO!
net.createServer((socket) => {

  // we add an 'end' listener, but never consume the data
  socket.on('end', () => {
    // It will never get here.
    socket.end('The message was received but was not processed.\n');
  });

}).listen(1337);
```

Prior to Node.js 0.10, the incoming message data would be simply discarded. However, in Node.js 0.10 and beyond, the socket remains paused forever.

Il workaround (la soluzione) in questa situazione è chiamare il metodo [`stream.resume()`](#stream_readable_resume) per iniziare il flusso dei dati:

```js
// Workaround
net.createServer((socket) => {
  socket.on('end', () => {
    socket.end('The message was received but was not processed.\n');
  });

  // start the flow of data, discarding it.
  socket.resume();
}).listen(1337);
```

In addition to new `Readable` streams switching into flowing mode, pre-0.10 style streams can be wrapped in a `Readable` class using the [`readable.wrap()`][`stream.wrap()`] method.

### `readable.read(0)`

Ci sono alcuni casi in cui è necessario ri-aggiornare i meccanismi sottostanti di readable stream, senza effettivamente consumare alcun dato. In questi casi, è possibile chiamare `readable.read(0)`, che restituirà sempre `null`.

Se il read buffer interno è inferiore all'`highWaterMark`, e lo stream non sta leggendo in quel momento, allora chiamare `stream.read(0)` attiverà la chiamata di un [`stream._read()`](#stream_readable_read_size_1) di livello inferiore.

While most applications will almost never need to do this, there are situations within Node.js where this is done, particularly in the `Readable` stream class internals.

### `readable.push('')`

L'utilizzo di `readable.push('')` non è raccomandato.

Il push di una stringa, un `Buffer` oppure un `Uint8Array` di zero-byte in uno stream che non è in object mode ha un effetto collaterale interessante. Because it *is* a call to [`readable.push()`](#stream_readable_push_chunk_encoding), the call will end the reading process. Tuttavia, poiché l'argomento è una stringa vuota, non viene aggiunto nessun dato al readable buffer, perciò non c'è nulla che un utente possa consumare.

### discrepanza di `highWaterMark` dopo aver chiamato `readable.setEncoding()`

L'utilizzo di `readable.setEncoding()` cambierà il modo in cui `highWaterMark` opera al di fuori dell'object mode.

Typically, the size of the current buffer is measured against the `highWaterMark` in _bytes_. Tuttavia, dopo aver chiamato `setEncoding()`, la funzione di confronto inizierà a misurare la dimensione del buffer in _characters_ (caratteri).

Questo non è un problema nei casi comuni con `latin1` oppure `ascii`. Ma si consiglia di essere consapevoli di tale comportamento quando si lavora con stringhe che potrebbero contenere caratteri multi-byte.
