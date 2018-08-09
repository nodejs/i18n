# Stream

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stabile

Uno stream è un'abstract interface per lavorare con gli streaming data in Node.js. Il modulo `stream` fornisce un'API di base che semplifica la creazione di objects che implementano la stream interface.

Esistono molti stream objects forniti da Node.js. Ad esempio, una [richiesta ad un server HTTP](http.html#http_class_http_incomingmessage) e [`process.stdout`][] sono tutti e due istanze di stream.

Gli stream possono essere readable (leggibiliI), writeable (scrivibili) oppure entrambi. Tutti gli stream sono istanze di [`EventEmitter`][].

È possibile accedere al modulo `stream` utilizzando:

```js
const stream = require('stream');
```

Mentre è importante capire come funzionano gli stream, il modulo `stream` è di per sé più utile per gli sviluppatori che stanno creando nuovi tipi di istanze di stream. Gli sviluppatori che *utilizzano* principalmente gli stream objects raramente hanno bisogno di utilizzare direttamente il modulo `stream`.

## Organizzazione di questo Documento

Questo documento è diviso in due sezioni principali con una terza sezione per le note aggiuntive. La prima sezione spiega gli elementi dello stream API richiesti per *utilizzare* gli stream all'interno di un'applicazione. La seconda sezione spiega gli elementi dell'API necessari per *implementare* nuovi tipi di stream.

## Tipi di Stream

Esistono quattro tipi fondamentali di stream all'interno di Node.js:

* [`Readable`][] - stream da cui è possibile leggere i dati (ad esempio [`fs.createReadStream()`][]).
* [`Writable`][] - stream su cui possono essere scritti i dati (ad esempio [`fs.createWriteStream()`][]).
* [`Duplex`][] - stream che sono sia `Readable` che `Writable` (ad esempio [`net.Socket`][]).
* [`Transform`][] - `Duplex` stream che possono modificare o trasformare i dati così come sono scritti e letti (ad esempio [`zlib.createDeflate()`][]).

Inoltre questo modulo include le funzioni di utility [pipeline](#stream_stream_pipeline_streams_callback) e [finished](#stream_stream_finished_stream_callback).

### Object Mode

Tutti gli stream creati dalle API di Node.js operano esclusivamente su stringhe e `Buffer` (o `Uint8Array`) objects. Tuttavia, è possibile che le implementazioni dello stream funzionino con altri tipi di valori JavaScript (ad eccezione di `null`, che ha uno scopo speciale all'interno degli stream). Tali stream sono considerati operanti in "object mode".

Le istanze di stream vengono trasformate in object mode utilizzando l'opzione `objectMode` quando viene creato lo stream. Provare a cambiare uno stream esistente in object mode non è sicuro.

### Buffering

<!--type=misc-->

Entrambi gli stream sia [`Writable`][] che [`Readable`][] memorizzeranno i dati in un buffer interno che può essere recuperato usando rispettivamente `writable.writableBuffer` oppure `readable.readableBuffer`.

La quantità di dati potenzialmente inseriti in un buffer dipende dall'opzione `highWaterMark` passata all'interno del constructor degli stream. Per gli stream normali, l'opzione `highWaterMark` specifica un [numero totale di bytes](#stream_highwatermark_discrepancy_after_calling_readable_setencoding). Per gli stream che operano in object mode, l'`highWaterMark` specifica un numero totale di objects.

I dati vengono memorizzati nel buffer nei `Readable` stream quando l'implementazione chiama [`stream.push(chunk)`](#stream_readable_push_chunk_encoding). Se il consumer dello Stream non chiama [`stream.read()`](#stream_readable_read_size), i dati si fermeranno nella queue interna fino a quando non verranno consumati/utilizzati.

Una volta che la dimensione totale del read buffer interno raggiunge la soglia specificata da `highWaterMark`, lo stream interromperà temporaneamente la lettura dei dati da parte della risorsa sottostante fino a quando i dati attualmente memorizzati nel buffer non potranno essere consumati (ovvero, lo stream si arresterà chiamando il metodo interno `readable._read()` utilizzato per riempire il read buffer).

I dati vengono memorizzati nel buffer nei `Writable` stream quando il metodo [`writable.write(chunk)`](#stream_writable_write_chunk_encoding_callback) viene chiamato ripetutamente. Quando la dimensione totale del write buffer interno è inferiore alla soglia impostata da `highWaterMark`, le chiamate a `writable.write()` restituiranno `true`. Quando invece la dimensione del buffer interno raggiunge o supera l'`highWaterMark`, verrà restituito `false`.

Un obiettivo chiave dello `stream` API, in particolare il metodo [`stream.pipe()`], è di limitare il buffering dei dati a livelli accettabili in modo che sorgenti e destinazioni di diverse velocità non sovraccarichino la memoria disponibile.

Poiché gli stream [`Duplex`][] e [`Transform`][] sono entrambi sia `Readable` che `Writable`, ciascuno di essi mantiene *due* buffer interni separati utilizzati per la lettura e la scrittura, consentendo a ciascuna parte di operare indipendentemente dall'altra mantenendo un flusso di dati appropriato ed efficiente. Ad esempio, le istanze di [`net.Socket`][] sono gli [`Duplex`][] stream di cui la parte `Readable` consente il consumo dei dati ricevuti *dal* socket e la parte `Writable` consente di scrivere i dati *sul* socket. Poiché i dati possono essere scritti sul socket ad una velocità maggiore o minore rispetto a quella dei dati ricevuti, è importante che ciascuna parte funzioni (ed esegua il buffer) indipendentemente dall'altra.

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
  // Se non è impostata una codifica, i Buffer objects verranno ricevuti.
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

Gli [`Readable`][] stream utilizzano l'API [`EventEmitter`][] per la notificare il codice dell'applicazione quando i dati sono disponibili per essere letti dallo stream. I dati disponibili possono essere letti dallo stream in diversi modi.

Entrambi gli stream sia [`Writable`][] che [`Readable`][], per comunicare lo stato attuale dello stream, utilizzano l'API [`EventEmitter`][] in vari modi.

Gli stream [`Duplex`][] e [`Transform`][] sono entrambi sia [`Writable`][] che [`Readable`][].

Le applicazioni che sono di "scrittura di dati a" oppure di "consumo di dati da" uno stream non sono necessarie per implementare direttamente le stream interface e generalmente non avranno alcun motivo per chiamare `require('stream')`.

Gli sviluppatori che desiderano implementare nuovi tipi di stream devono fare riferimento alla sezione [API per gli Stream Implementer](#stream_api_for_stream_implementers).

### Writable Streams

Gli writable stream sono un'abstraction per una *destinazione* nella quale vengono scritti i dati.

Gli esempi di [`Writable`][] stream includono:

* [Richieste HTTP, sul client](http.html#http_class_http_clientrequest)
* [Risposte HTTP, sul server](http.html#http_class_http_serverresponse)
* [fs write streams](fs.html#fs_class_fs_writestream)
* [zlib streams](zlib.html)
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
-->

L'evento `'close'` viene emesso quando lo stream ed una qualsiasi delle sue risorse sottostanti (ad esempio un file descriptor) sono stati chiusi. L'evento indica che non verrà emesso nessun altro evento e non si verificheranno ulteriori calcoli.

Non tutti gli `Writable` stream emetteranno l'evento `'close'`.

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

Lo stream non viene chiuso quando viene emesso l'evento `'error'`.

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
  console.error('All writes are now complete.');
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
  console.error('something is piping into the writer');
  assert.equal(src, reader);
});
reader.pipe(writer);
```

##### Event: 'unpipe'

<!-- YAML
added: v0.9.4
-->

* `src` {stream.Readable} Il source stream che esegue lo [unpiped][`stream.unpipe()`] su questo writable

L'evento `'unpipe'` viene emesso quando il metodo [`stream.unpipe()`][] viene chiamato su un [`Readable`][] stream, rimuovendo questo [`Writable`][] dal suo set di destinazioni.

Questo viene anche emesso nel caso in cui questo [`Writable`][] stream emetta un errore quando [`Readable`][] stream esegue il piping al suo interno.

```js
const writer = getWritableStreamSomehow();
const reader = getReadableStreamSomehow();
writer.on('unpipe', (src) => {
  console.error('Something has stopped piping into the writer.');
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

* Restituisce: {this}

Distrugge lo stream ed emette l'`'error'` passato ed un evento `'close'`. Dopo questa chiamata, il writable stream è terminato e le successive chiamate a `write()` / `end()` daranno un errore `ERR_STREAM_DESTROYED`. Gli implementors non dovrebbero sovrascrivere questo metodo, ma implementare [`writable._destroy()`](#stream_writable_destroy_err_callback).

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
* `encoding` {string} La codifica, se `chunk` è una stringa
* `callback` {Function} Callback opzionale per quando la conclusione dello stream
* Restituisce: {this}

Chiamando il metodo `writable.end()` si segnala che non verranno scritti più dati su [`Writable`][]. Gli argomenti facoltativi `chunk` ed `encoding` consentono di scrivere un'ultimo chuck di dati aggiuntivo immediatamente prima di chiudere lo stream. Se fornita, la funzione facoltativa `callback` è allegata come listener per l'evento [`'finish'`][].

Chiamando il metodo [`stream.write()`](#stream_writable_write_chunk_encoding_callback) dopo aver chiamato [`stream.end()`](#stream_writable_end_chunk_encoding_callback) genererà un errore.

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

Il metodo `writable.setDefaultEncoding()` imposta l'`encoding` predefinito per un [`Writable`][] stream.

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

Se il metodo [`writable.cork()`][] viene chiamato più volte su uno stream, lo stesso numero di chiamate a `writable.uncork()` deve essere chiamato per svuotare i dati memorizzati nel buffer.

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

Questa proprietà contiene il numero di bytes (od objects) nella queue pronti per essere scritti. Il valore fornisce dati di introspezione relativi allo status di `highWaterMark`.

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

Mentre uno stream non subisce il drain, le chiamate a `write()` eseguiranno il buffer di `chunk` e restituiranno false. Una volta che tutti gli attuali chunk memorizzati nel buffer hanno subito il drain (accettati per la consegna dal sistema operativo), verrà emesso l'evento `'drain'`. E' consigliato che, una volta che `write()` restituisce false, non vengano scritti più chunk finché non viene emesso l'evento `'drain'`. While calling `write()` on a stream that is not draining is allowed, Node.js will buffer all written chunks until maximum memory usage occurs, at which point it will abort unconditionally. Ancor prima che si interrompa, l'uso elevato della memoria causerà scarso rendimento del garbage collector ed alti livelli di RSS (che in genere non vengono ripristinati nel sistema, anche dopo che la memoria non è più necessaria). Poiché i socket TCP potrebbero non subire mai il drain se il peer remoto non legge i dati, scrivere un socket che non subisce mai il drain può portare ad una vulnerabilità sfruttabile da remoto.

Scrivere i dati mentre lo stream non subisce il drain è particolarmente problematico per un [`Transform`][], perché gli stream `Transform` sono messi in pausa per impostazione predefinita fino a quando non vengono reindirizzati (piping) oppure finchè non viene aggiunto un handler del evento `'data'` o del evento `'readable'`.

Se i dati da scrivere possono essere generati o scaricati su richiesta, si consiglia di incapsulare la logica in un [`Readable`][] ed utilizzare [`stream.pipe()`][]. Tuttavia, se è preferibile chiamare `write()`, è possibile rispettare il backpressure ed evitare problemi di memoria usando l'evento [`'drain'`][]:

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
  console.log('write completed, do more writes now');
});
```

Un `Writable` stream in object mode ignorerà sempre l'argomento `encoding`.

### Readable Streams

Gli readable stream sono un'abstraction per una *sorgente* da cui vengono utilizzati i dati.

Gli esempi di stream `Readable` stream includono:

* [Risposte HTTP, sul client](http.html#http_class_http_incomingmessage)
* [Richieste HTTP, sul server](http.html#http_class_http_incomingmessage)
* [fs read streams](fs.html#fs_class_fs_readstream)
* [zlib streams](zlib.html)
* [crypto streams](crypto.html)
* [TCP sockets](net.html#net_class_net_socket)
* [child process stdout ed stderr](child_process.html#child_process_subprocess_stdout)
* [`process.stdin`][]

Tutti gli [`Readable`][] stream implementano l'interface definita dalla classe `stream.Readable`.

#### Due Modalità

I `Readable` stream funzionano efficacemente in una delle due modalità: flowing (scorrevole) e paused (in pausa).

In flowing mode, i dati vengono letti automaticamente dal sistema sottostante e forniti ad un'applicazione il più rapidamente possibile utilizzando gli eventi tramite l'[`EventEmitter`][] interface.

In paused mode, il metodo [`stream.read()`](#stream_readable_read_size) deve essere chiamato esplicitamente per leggere chunk di dati dallo stream.

Tutti gli [`Readable`][] stream iniziano in paused mode ma possono essere passati alla flowing mode in uno dei seguenti modi:

* Aggiungendo un handler per gli eventi [`'data'`][].
* Chiamando il metodo [`stream.resume()`](#stream_readable_resume).
* Chiamando il metodo [`stream.pipe()`][] per inviare i dati ad un [`Writable`][].

Il `Readable` può tornare alla paused mode usando uno dei seguenti modi:

* Se non ci sono destinazioni pipe, chiamando il metodo [`stream.pause()`](#stream_readable_pause).
* Se ci sono destinazioni pipe, rimuovendole tutte. Le destinazioni pipe multiple possono essere rimosse chiamando il metodo [`stream.unpipe()`][].

Il concetto importante da ricordare è che un `Readable` non genererà dati finché non verrà fornito un meccanismo per consumare od ignorare tali dati. Se il meccanismo di consumo è disabilitato o tolto, il `Readable` *tenterà* di interrompere la generazione dei dati.

Per motivi di compatibilità con le versioni precedenti, la rimozione degli handler degli eventi [`'data'`][] **non** interromperà automaticamente lo stream. Inoltre, se ci sono destinazioni che hanno subito il piping, la chiamata di [`stream.pause()`](#stream_readable_pause) non garantisce che lo stream *rimarrà* in pausa una volta che tali destinazioni subiscono il drain e richiedono ulteriori dati.

Se un [`Readable`][] viene cambiato nella flowing mode e non ci sono consumer disponibili a gestire i dati, questi andranno persi. Ciò può verificarsi, ad esempio, quando il metodo `readable.resume()` viene chiamato senza un listener collegato all'evento `'data'` oppure quando un handler degli eventi `'data'` viene rimosso dallo stream.

#### Tre Stati

Le "due modalità" di operazione per un `Readable` stream sono un'abstraction semplificata per la gestione dello stato interno più complicato che avviene all'interno dell'implementazione del `Readable` stream.

In particolare, in qualsiasi momento specifico, ogni `Readable` si trova in uno qualsiasi tra questi tre possibili stati:

* `readable.readableFlowing = null`
* `readable.readableFlowing = false`
* `readable.readableFlowing = true`

Quando `readable.readableFlowing` è `null`, non viene fornito alcun meccanismo per consumare i dati degli stream in modo che lo stream non generi i suoi dati. In questo stato, associare un listener per l'evento `'data'`, chiamare il metodo `readable.pipe()` oppure chiamare il metodo `readable.resume()` farà sì che `readable.readableFlowing` passi a `true`, così che il `Readable` inizi a emettere attivamente gli eventi man mano che i dati vengono generati.

Chiamare `readable.pause()`, `readable.unpipe()`, oppure ricevere "back pressure", farà sì che `readable.readableFlowing` passi a `false`, interrompendo temporaneamente lo scorrere degli eventi ma *non* interrompendo la generazione di dati. In questo stato, associare un listener per l'evento `'data'` non farebbe sì che `readable.readableFlowing` passi a `true`.

```js
const { PassThrough, Writable } = require('stream');
const pass = new PassThrough();
const writable = new Writable();

pass.pipe(writable);
pass.unpipe(writable);
// readableFlowing è false ora

pass.on('data', (chunk) => { console.log(chunk.toString()); });
pass.write('ok'); // non emetterà 'data'
pass.resume(); // deve essere chiamato per far sì che 'data' venga emesso
```

Mentre `readable.readableFlowing` è `false`, i dati potrebbero accumularsi all'interno del buffer interno degli stream.

#### Scegline Uno

L'API del `Readable` stream si è evoluta in più versioni di Node.js e fornisce più metodi di consumo dei dati dello stream. In generale, gli sviluppatori dovrebbero scegliere *uno* dei metodi di consumo dei dati e *non utilizzare mai* più metodi per consumare i dati da un singolo stream.

L'uso del metodo `readable.pipe()` è consigliato per la maggior parte degli utenti poiché è stato implementato per fornire il modo più semplice di utilizzare i dati dello stream. Gli sviluppatori che richiedono un controllo più preciso sul trasferimento e sulla generazione dei dati possono utilizzare [`EventEmitter`][] e le API `readable.pause()`/`readable.resume()`.

#### Class: stream.Readable

<!-- YAML
added: v0.9.4
-->

<!--type=class-->

##### Event: 'close'

<!-- YAML
added: v0.9.4
-->

L'evento `'close'` viene emesso quando lo stream ed una qualsiasi delle sue risorse sottostanti (ad esempio un file descriptor) sono stati chiusi. L'evento indica che non verrà emesso nessun altro evento e non si verificheranno ulteriori calcoli.

Non tutti gli [`Readable`][] stream emetteranno l'evento `'close'`.

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

L'evento `'end'` **non verrà emesso** a meno che i dati non vengano completamente consumati. Questo può essere ottenuto passando lo stream alla flowing mode, oppure chiamando [`stream.read()`](#stream_readable_read_size) ripetutamente fino a quando tutti i dati non vengono consumati.

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

L'evento `'error'` può essere emesso da un'implementazione `Readable` in qualsiasi momento. In genere, ciò può verificarsi se lo stream sottostante non è in grado di generare dati a causa di un errore interno sottostante oppure quando un'implementazione di stream tenta di inviare un chunk di dati non valido.

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

In generale, i meccanismi degli eventi <`readable.pipe()` e `'data'` sono più facili da comprendere rispetto a quelli dell'evento `'readable'`. Tuttavia, la gestione di `'readable'` potrebbe comportare un aumento del throughput (velocità effettiva).

Se vengono utilizzati contemporaneamente sia `'readable'` che [`'data'`][], `'readable'` ha la precedenza nel controllo del flusso, quindi `'data'` verrà emesso solo quando viene chiamato [`stream.read()`](#stream_readable_read_size).

##### readable.destroy([error])

<!-- YAML
added: v8.0.0
-->

* `error` {Error} Errore che verrà passato come payload nell'evento `'error'`
* Restituisce: {this}

Distrugge lo stream ed emette l'`'error'` e l'evento `'close'`. Dopo questa chiamata, il readable stream rilascerà tutte le risorse interne e le successive chiamate a `push()` verranno ignorate. Gli implementors non dovrebbero sovrascrivere questo metodo, ma implementare [`readable._destroy()`](#stream_readable_destroy_err_callback).

##### readable.isPaused()

<!-- YAML
added: v0.11.14
-->

* Restituisce: {boolean}

Il metodo `readable.isPaused()` restituisce l'attuale stato operativo del `Readable`. Questo è usato principalmente dal meccanismo che sta alla base del metodo `readable.pipe()`. Nella maggior parte dei casi tipici, non ci sarà alcun motivo per utilizzare direttamente questo metodo.

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

##### readable.pipe(destination[, options])

<!-- YAML
added: v0.9.4
-->

* `destination` {stream.Writable} La destinazione per la quale scrivere i dati
* `options` {Object} Opzioni Pipe 
  * `end` {boolean} Termina il writer quando finisce il reader. **Default:** `true`.
* Restituisce: {stream.Writable} rendendo possibile l'installazione di catene di stream che sono stati sottoposti al piping

Il metodo `readable.pipe()` associa il [`Writable`][] stream al `readable`, provocando il passaggio automatico alla flowing mode ed il push di tutti i suoi dati sul [`Writable`][] associato. Il flusso di dati verrà gestito automaticamente in modo che il `Writable` stream di destinazione non sia sopraffatto da un `Readable` stream più veloce.

Nell'esempio seguente tutti i dati vengono sottoposti al piping conducendoli dal `readable` all'interno di un file chiamato `file.txt`:

```js
const fs = require('fs');
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// Tutti i dati dal readable vanno all'interno di 'file.txt'
readable.pipe(writable);
```

È possibile collegare molteplici `Writable` stream in un singolo `Readable` stream.

Il metodo `readable.pipe()` restituisce un riferimento allo stream di *destinazione* che consente di impostare catene di stream che sono stati sottoposti al piping:

```js
const fs = require('fs');
const r = fs.createReadStream('file.txt');
const z = zlib.createGzip();
const w = fs.createWriteStream('file.txt.gz');
r.pipe(z).pipe(w);
```

Per impostazione predefinita, [`stream.end()`](#stream_writable_end_chunk_encoding_callback) viene chiamato nel `Writable` stream di destinazione quando il `Readable` stream di origine emette [`'end'`][], in modo che la destinazione non sia più scrivibile. Per disattivare questo comportamento predefinito, l'opzione `end` può essere passata come `false`, facendo sì che lo stream di destinazione rimanga aperto, come mostrato nell'esempio seguente:

```js
reader.pipe(writer, { end: false });
reader.on('end', () => {
  writer.end('Goodbye\n');
});
```

Un avvertimento importante è che se il `Readable` stream emette un errore durante l'elaborazione, la destinazione `Writable` *non viene chiusa* automaticamente. Se si verifica un errore, sarà necessario chiudere *manualmente* ogni stream così da evitare perdite di memoria.

Gli `Writable` stream [`process.stderr`][] e [`process.stdout`][] non vengono mai chiusi fino alla chiusura del processo Node.js, indipendentemente dalle opzioni specificate.

##### readable.read([size])

<!-- YAML
added: v0.9.4
-->

* `size` {number} Argomento facoltativo per specificare la quantità di dati da leggere.
* Restituisce: {string|Buffer|null}

Il metodo `readable.read()` estrae alcuni dati dal buffer interno e li restituisce. Se non ci sono dati disponibili da leggere, viene restituito `null`. Per impostazione predefinita, i dati verranno restituiti come `Buffer` object a meno che non sia stato specificato un encoding utilizzando il metodo `readable.setEncoding()` o a meno che lo stream stia operando in object mode.

L'argomento facoltativo `size` specifica un numero specifico di bytes da leggere. Se i `size` bytes non sono disponibili per la lettura, sarà restituito `null` *a meno che* lo stream non sia terminato, in tal caso tutti i dati rimanenti nel buffer interno verranno restituiti.

Se l'argomento `size` non è specificato, verranno restituiti tutti i dati contenuti nel buffer interno.

Il metodo `readable.read()` deve essere richiamato solo sugli `Readable` stream che operano in paused mode. Nella flowing mode, `readable.read()` viene chiamato automaticamente fino a quando il buffer interno non viene sottoposto completamente al drain.

```js
const readable = getReadableStreamSomehow();
readable.on('readable', () => {
  let chunk;
  while (null !== (chunk = readable.read())) {
    console.log(`Received ${chunk.length} bytes of data.`);
  }
});
```

Un `Readable` stream in object mode restituirà sempre un singolo elemento da una chiamata a [`readable.read(size)`](#stream_readable_read_size), indipendentemente dal valore dell'argomento `size`.

Se il metodo `readable.read()` restituisce un chunk di dati, verrà emesso anche un evento `'data'`.

Chiamare [`stream.read([size])`](#stream_readable_read_size) dopo che l'evento [`'end'`][] è stato emesso restituirà `null`. Non verrà generato nessun errore di runtime.

##### readable.readableHighWaterMark

<!-- YAML
added: v9.3.0
-->

* Restituisce: {number}

Restituisce il valore di `highWaterMark` passato durante la costruzione di questo `Readable`.

##### readable.readableLength

<!-- YAML
added: v9.4.0
-->

* Restituisce: {number}

Questa proprietà contiene il numero di bytes (od objects) nella queue pronti per essere letti. Il valore fornisce dati di introspezione relativi allo status di `highWaterMark`.

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

Il metodo `readable.resume()` causa un `Readable` stream esplicitamente sospeso per riprendere l'emissione di eventi [`'data'`][], passando lo stream alla flowing mode.

Il metodo `readable.resume()` può essere utilizzato per consumare completamente i dati da uno stream senza effettivamente elaborare alcun dato come mostrato nel seguente esempio:

```js
getReadableStreamSomehow()
  .resume()
  .on('end', () => {
    console.log('Reached the end, but did not read anything.');
  });
```

Il metodo `readable.resume()` non ha effetto se esiste un listener di eventi `'readable'`.

##### readable.setEncoding(encoding)

<!-- YAML
added: v0.9.4
-->

* `encoding` {string} L'encoding da utilizzare.
* Restituisce: {this}

Il metodo `readable.setEncoding()` imposta l'encoding dei caratteri per i dati letti dagli `Readable` stream.

Per impostazione predefinita, non viene assegnato alcun encoding ed i dati dello stream verranno restituiti come `Buffer` objects. L'impostazione di un encoding fa sì che i dati dello stream vengano restituiti come stringhe dell'encoding specificato anziché come `Buffer` objects. Ad esempio, chiamare `readable.setEncoding('utf8')` farà in modo che i dati di output vengano interpretati come dati UTF-8 e successivamente passati come stringhe. Chiamare `readable.setEncoding('hex')` farà sì che i dati vengano codificati in formato stringa esadecimale.

Il `Readable` stream gestirà correttamente i caratteri multi-byte forniti attraverso lo stream che altrimenti verrebbero decodificati in modo errato se semplicemente estratti dallo stream come `Buffer` objects.

```js
const readable = getReadableStreamSomehow();
readable.setEncoding('utf8');
readable.on('data', (chunk) => {
  assert.equal(typeof chunk, 'string');
  console.log('got %d characters of string data', chunk.length);
});
```

##### readable.unpipe([destination])

<!-- YAML
added: v0.9.4
-->

* `destination` {stream.Writable} Stream specifico opzionale da sottoporre al unpiping
* Restituisce: {this}

Il metodo `readable.unpipe()` scollega un `Writable` stream precedentemente collegato utilizzando il metodo [`stream.pipe()`][].

Se la `destination` non è specificata, allora *tutti* i pipe vengono scollegati.

Se la `destination` è specificata, ma non è stata impostato alcun pipe per essa, il metodo non esegue nulla.

```js
const fs = require('fs');
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// Tutti i dati vanno da readable all'interno del 'file.txt', 
// ma solo per il primo secondo
readable.pipe(writable);
setTimeout(() => {
  console.log('Stop writing to file.txt');
  readable.unpipe(writable);
  console.log('Manually close the file stream');
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

Il metodo `stream.unshift(chunk)` non può essere chiamato dopo che è stato emesso l'evento [`'end'`][] altrimeni verrà generato un errore di runtime.

Gli sviluppatori che utilizzano `stream.unshift()` spesso dovrebbero prendere in considerazione di passare all'utilizzo di un [`Transform`][] stream. Vedi la sezione [API per gli Stream Implementer](#stream_api_for_stream_implementers) per maggiori informazioni.

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

A differenza di [`stream.push(chunk)`](#stream_readable_push_chunk_encoding), `stream.unshift(chunk)` non terminerà il processo di lettura reimpostando lo stato di lettura interna dello stream. Ciò può causare risultati imprevisti se `readable.unshift()` viene chiamato durante una lettura (ad esempio all'interno di un'implementazione [`stream._read()`](#stream_readable_read_size_1) su uno stream personalizzato). Facendo seguire la chiamata a `readable.unshift()` con uno [`stream.push('')`](#stream_readable_push_chunk_encoding) immediato farà sì che lo stato di lettura venga resettato in modo appropriato, tuttavia è semplicemente meglio evitare di chiamare `readable.unshift()` mentre si sta eseguendo una lettura.

##### readable.wrap(stream)

<!-- YAML
added: v0.9.4
-->

* `stream` {Stream} Un readable stream "vecchio stile"
* Restituisce: {this}

Le versioni di Node.js precedenti alla v0.10 avevano stream che non implementavano l'intera API del modulo `stream` così com'è attualmente definita. (Vedi [Compatibilità](#stream_compatibility_with_older_node_js_versions) per maggiori informazioni.)

Quando si utilizza una precedente libreria Node.js che emette eventi [`'data'`][] ed ha un metodo [`stream.pause()`](#stream_readable_pause) che è di sola consulenza, il metodo `readable.wrap()` può essere utilizzato per creare un [`Readable`][] stream che utilizza il vecchio stream come la sua sorgente dati.

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

> Stabilità: 1 - Sperimentale

* Restituisce: {AsyncIterator} per consumare completamente lo stream.

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

Se il ciclo termina con un `break` oppure un `throw`, lo stream verrà distrutto. In altre parole, l'iterazione su uno stream consumerà completamente lo stream stesso. The stream will be read in chunks of size equal to the `highWaterMark` option. In the code example above, data will be in a single chunk if the file has less then 64kb of data because no `highWaterMark` option is provided to [`fs.createReadStream()`][].

### Duplex and Transform Streams

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
* [zlib streams](zlib.html)
* [crypto streams](crypto.html)

#### Class: stream.Transform

<!-- YAML
added: v0.9.4
-->

<!--type=class-->

Transform streams are [`Duplex`][] streams where the output is in some way related to the input. Like all [`Duplex`][] streams, `Transform` streams implement both the [`Readable`][] and [`Writable`][] interfaces.

Examples of `Transform` streams include:

* [zlib streams](zlib.html)
* [crypto streams](crypto.html)

##### transform.destroy([error])

<!-- YAML
added: v8.0.0
-->

Destroy the stream, and emit `'error'`. After this call, the transform stream would release any internal resources. implementors should not override this method, but instead implement [`readable._destroy()`](#stream_readable_destroy_err_callback). The default implementation of `_destroy()` for `Transform` also emit `'close'`.

### stream.finished(stream, callback)

<!-- YAML
added: v10.0.0
-->

* `stream` {Stream} A readable and/or writable stream.
* `callback` {Function} A callback function that takes an optional error argument.

A function to get notified when a stream is no longer readable, writable or has experienced an error or a premature close event.

```js
const { finished } = require('stream');

const rs = fs.createReadStream('archive.tar');

finished(rs, (err) => {
  if (err) {
    console.error('Stream failed', err);
  } else {
    console.log('Stream is done reading');
  }
});

rs.resume(); // drain the stream
```

Especially useful in error handling scenarios where a stream is destroyed prematurely (like an aborted HTTP request), and will not emit `'end'` or `'finish'`.

The `finished` API is promisify'able as well;

```js
const finished = util.promisify(stream.finished);

const rs = fs.createReadStream('archive.tar');

async function run() {
  await finished(rs);
  console.log('Stream is done reading');
}

run().catch(console.error);
rs.resume(); // drain the stream
```

### stream.pipeline(...streams[, callback])

<!-- YAML
added: v10.0.0
-->

* `...streams` {Stream} Two or more streams to pipe between.
* `callback` {Function} A callback function that takes an optional error argument.

A module method to pipe between streams forwarding errors and properly cleaning up and provide a callback when the pipeline is complete.

```js
const { pipeline } = require('stream');
const fs = require('fs');
const zlib = require('zlib');

// Use the pipeline API to easily pipe a series of streams
// together and get notified when the pipeline is fully done.

// A pipeline to gzip a potentially huge tar file efficiently:

pipeline(
  fs.createReadStream('archive.tar'),
  zlib.createGzip(),
  fs.createWriteStream('archive.tar.gz'),
  (err) => {
    if (err) {
      console.error('Pipeline failed', err);
    } else {
      console.log('Pipeline succeeded');
    }
  }
);
```

The `pipeline` API is promisify'able as well:

```js
const pipeline = util.promisify(stream.pipeline);

async function run() {
  await pipeline(
    fs.createReadStream('archive.tar'),
    zlib.createGzip(),
    fs.createWriteStream('archive.tar.gz')
  );
  console.log('Pipeline succeeded');
}

run().catch(console.error);
```

## API for Stream Implementers

<!--type=misc-->

The `stream` module API has been designed to make it possible to easily implement streams using JavaScript's prototypal inheritance model.

First, a stream developer would declare a new JavaScript class that extends one of the four basic stream classes (`stream.Writable`, `stream.Readable`, `stream.Duplex`, or `stream.Transform`), making sure they call the appropriate parent class constructor:

```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor(options) {
    super(options);
    // ...
  }
}
```

The new stream class must then implement one or more specific methods, depending on the type of stream being created, as detailed in the chart below:

<table>
  <thead>
    <tr>
      <th>
        <p>Use-case</p>
      </th>
      <th>
        <p>Class</p>
      </th>
      <th>
        <p>Method(s) to implement</p>
      </th>
    </tr>
  </thead>
  <tr>
    <td>
      <p>Reading only</p>
    </td>
    <td>
      <p>[`Readable`](#stream_class_stream_readable)</p>
    </td>
    <td>
      <p><code>[_read][stream-_read]</code></p>
    </td>
  </tr>
  <tr>
    <td>
      <p>Writing only</p>
    </td>
    <td>
      <p>[`Writable`](#stream_class_stream_writable)</p>
    </td>
    <td>
      <p>
        <code>[_write][stream-_write]</code>,
        <code>[_writev][stream-_writev]</code>,
        <code>[_final][stream-_final]</code>
      </p>
    </td>
  </tr>
  <tr>
    <td>
      <p>Reading and writing</p>
    </td>
    <td>
      <p>[`Duplex`](#stream_class_stream_duplex)</p>
    </td>
    <td>
      <p>
        <code>[_read][stream-_read]</code>,
        <code>[_write][stream-_write]</code>,
        <code>[_writev][stream-_writev]</code>,
        <code>[_final][stream-_final]</code></p>
    </td>
  </tr>
  <tr>
    <td>
      <p>Operate on written data, then read the result</p>
    </td>
    <td>
      <p>[`Transform`](#stream_class_stream_transform)</p>
    </td>
    <td>
      <p>
        <code>[_transform][stream-_transform]</code>,
        <code>[_flush][stream-_flush]</code>,
        <code>[_final][stream-_final]</code>
      </p>
    </td>
  </tr>
</table>

The implementation code for a stream should *never* call the "public" methods of a stream that are intended for use by consumers (as described in the [API for Stream Consumers](#stream_api_for_stream_consumers) section). Doing so may lead to adverse side effects in application code consuming the stream.

### Simplified Construction

<!-- YAML
added: v1.2.0
-->

For many simple cases, it is possible to construct a stream without relying on inheritance. This can be accomplished by directly creating instances of the `stream.Writable`, `stream.Readable`, `stream.Duplex` or `stream.Transform` objects and passing appropriate methods as constructor options.

```js
const { Writable } = require('stream');

const myWritable = new Writable({
  write(chunk, encoding, callback) {
    // ...
  }
});
```

### Implementing a Writable Stream

The `stream.Writable` class is extended to implement a [`Writable`][] stream.

Custom `Writable` streams *must* call the `new stream.Writable([options])` constructor and implement the `writable._write()` method. The `writable._writev()` method *may* also be implemented.

#### Constructor: new stream.Writable([options])

<!-- YAML
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18438
    description: >
      Add `emitClose` option to specify if `'close'` is emitted on destroy
-->

* `options` {Object} 
  * `highWaterMark` {number} Buffer level when [`stream.write()`](#stream_writable_write_chunk_encoding_callback) starts returning `false`. **Default:** `16384` (16kb), or `16` for `objectMode` streams.
  * `decodeStrings` {boolean} Whether or not to decode strings into `Buffer`s before passing them to [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1). **Default:** `true`.
  * `objectMode` {boolean} Whether or not the [`stream.write(anyObj)`](#stream_writable_write_chunk_encoding_callback) is a valid operation. When set, it becomes possible to write JavaScript values other than string, `Buffer` or `Uint8Array` if supported by the stream implementation. **Default:** `false`.
  * `emitClose` {boolean} Whether or not the stream should emit `'close'` after it has been destroyed. **Default:** `true`.
  * `write` {Function} Implementation for the [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1) method.
  * `writev` {Function} Implementation for the [`stream._writev()`](#stream_writable_writev_chunks_callback) method.
  * `destroy` {Function} Implementation for the [`stream._destroy()`](#stream_writable_destroy_err_callback) method.
  * `final` {Function} Implementation for the [`stream._final()`](#stream_writable_final_callback) method.

```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor(options) {
    // Calls the stream.Writable() constructor
    super(options);
    // ...
  }
}
```

Or, when using pre-ES6 style constructors:

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

Or, using the Simplified Constructor approach:

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

* `chunk` {Buffer|string|any} The chunk to be written. Will **always** be a buffer unless the `decodeStrings` option was set to `false` or the stream is operating in object mode.
* `encoding` {string} If the chunk is a string, then `encoding` is the character encoding of that string. If chunk is a `Buffer`, or if the stream is operating in object mode, `encoding` may be ignored.
* `callback` {Function} Call this function (optionally with an error argument) when processing is complete for the supplied chunk.

All `Writable` stream implementations must provide a [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1) method to send data to the underlying resource.

[`Transform`][] streams provide their own implementation of the [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1).

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Writable` class methods only.

The `callback` method must be called to signal either that the write completed successfully or failed with an error. The first argument passed to the `callback` must be the `Error` object if the call failed or `null` if the write succeeded.

All calls to `writable.write()` that occur between the time `writable._write()` is called and the `callback` is called will cause the written data to be buffered. When the `callback` is invoked, the stream might emit a [`'drain'`][] event. If a stream implementation is capable of processing multiple chunks of data at once, the `writable._writev()` method should be implemented.

If the `decodeStrings` property is explicitly set to `false` in the constructor options, then `chunk` will remain the same object that is passed to `.write()`, and may be a string rather than a `Buffer`. This is to support implementations that have an optimized handling for certain string data encodings. In that case, the `encoding` argument will indicate the character encoding of the string. Otherwise, the `encoding` argument can be safely ignored.

The `writable._write()` method is prefixed with an underscore because it is internal to the class that defines it, and should never be called directly by user programs.

#### writable.\_writev(chunks, callback)

* `chunks` {Object[]} The chunks to be written. Each chunk has following format: `{ chunk: ..., encoding: ... }`.
* `callback` {Function} A callback function (optionally with an error argument) to be invoked when processing is complete for the supplied chunks.

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Writable` class methods only.

The `writable._writev()` method may be implemented in addition to `writable._write()` in stream implementations that are capable of processing multiple chunks of data at once. If implemented, the method will be called with all chunks of data currently buffered in the write queue.

The `writable._writev()` method is prefixed with an underscore because it is internal to the class that defines it, and should never be called directly by user programs.

#### writable.\_destroy(err, callback)

<!-- YAML
added: v8.0.0
-->

* `err` {Error} A possible error.
* `callback` {Function} A callback function that takes an optional error argument.

The `_destroy()` method is called by [`writable.destroy()`](#stream_writable_destroy_error). It can be overridden by child classes but it **must not** be called directly.

#### writable.\_final(callback)

<!-- YAML
added: v8.0.0
-->

* `callback` {Function} Call this function (optionally with an error argument) when finished writing any remaining data.

The `_final()` method **must not** be called directly. It may be implemented by child classes, and if so, will be called by the internal `Writable` class methods only.

This optional function will be called before the stream closes, delaying the `'finish'` event until `callback` is called. This is useful to close resources or write buffered data before a stream ends.

#### Errors While Writing

It is recommended that errors occurring during the processing of the `writable._write()` and `writable._writev()` methods are reported by invoking the callback and passing the error as the first argument. This will cause an `'error'` event to be emitted by the `Writable`. Throwing an `Error` from within `writable._write()` can result in unexpected and inconsistent behavior depending on how the stream is being used. Using the callback ensures consistent and predictable handling of errors.

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

#### An Example Writable Stream

The following illustrates a rather simplistic (and somewhat pointless) custom `Writable` stream implementation. While this specific `Writable` stream instance is not of any real particular usefulness, the example illustrates each of the required elements of a custom [`Writable`][] stream instance:

```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor(options) {
    super(options);
    // ...
  }

  _write(chunk, encoding, callback) {
    if (chunk.toString().indexOf('a') >= 0) {
      callback(new Error('chunk is invalid'));
    } else {
      callback();
    }
  }
}
```

#### Decoding buffers in a Writable Stream

Decoding buffers is a common task, for instance, when using transformers whose input is a string. This is not a trivial process when using multi-byte characters encoding, such as UTF-8. The following example shows how to decode multi-byte strings using `StringDecoder` and [`Writable`][].

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

### Implementing a Readable Stream

The `stream.Readable` class is extended to implement a [`Readable`][] stream.

Custom `Readable` streams *must* call the `new stream.Readable([options])` constructor and implement the `readable._read()` method.

#### new stream.Readable([options])

* `options` {Object} 
  * `highWaterMark` {number} The maximum [number of bytes](#stream_highwatermark_discrepancy_after_calling_readable_setencoding) to store in the internal buffer before ceasing to read from the underlying resource. **Default:** `16384` (16kb), or `16` for `objectMode` streams.
  * `encoding` {string} If specified, then buffers will be decoded to strings using the specified encoding. **Default:** `null`.
  * `objectMode` {boolean} Whether this stream should behave as a stream of objects. Meaning that [`stream.read(n)`](#stream_readable_read_size) returns a single value instead of a `Buffer` of size `n`. **Default:** `false`.
  * `read` {Function} Implementation for the [`stream._read()`](#stream_readable_read_size_1) method.
  * `destroy` {Function} Implementation for the [`stream._destroy()`](#stream_readable_destroy_err_callback) method.

```js
const { Readable } = require('stream');

class MyReadable extends Readable {
  constructor(options) {
    // Calls the stream.Readable(options) constructor
    super(options);
    // ...
  }
}
```

Or, when using pre-ES6 style constructors:

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

Or, using the Simplified Constructor approach:

```js
const { Readable } = require('stream');

const myReadable = new Readable({
  read(size) {
    // ...
  }
});
```

#### readable.\_read(size)

<!-- YAML
added: v0.9.4
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17979
    description: call `_read()` only once per microtick
-->

* `size` {number} Number of bytes to read asynchronously

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Readable` class methods only.

All `Readable` stream implementations must provide an implementation of the `readable._read()` method to fetch data from the underlying resource.

When `readable._read()` is called, if data is available from the resource, the implementation should begin pushing that data into the read queue using the [`this.push(dataChunk)`](#stream_readable_push_chunk_encoding) method. `_read()` should continue reading from the resource and pushing data until `readable.push()` returns `false`. Only when `_read()` is called again after it has stopped should it resume pushing additional data onto the queue.

Once the `readable._read()` method has been called, it will not be called again until the [`readable.push()`](#stream_readable_push_chunk_encoding) method is called. `readable._read()` is guaranteed to be called only once within a synchronous execution, i.e. a microtick.

The `size` argument is advisory. For implementations where a "read" is a single operation that returns data can use the `size` argument to determine how much data to fetch. Other implementations may ignore this argument and simply provide data whenever it becomes available. There is no need to "wait" until `size` bytes are available before calling [`stream.push(chunk)`](#stream_readable_push_chunk_encoding).

The `readable._read()` method is prefixed with an underscore because it is internal to the class that defines it, and should never be called directly by user programs.

#### readable.\_destroy(err, callback)

<!-- YAML
added: v8.0.0
-->

* `err` {Error} A possible error.
* `callback` {Function} A callback function that takes an optional error argument.

The `_destroy()` method is called by [`readable.destroy()`](#stream_readable_destroy_error). It can be overridden by child classes but it **must not** be called directly.

#### readable.push(chunk[, encoding])

<!-- YAML
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->

* `chunk` {Buffer|Uint8Array|string|null|any} Chunk of data to push into the read queue. For streams not operating in object mode, `chunk` must be a string, `Buffer` or `Uint8Array`. For object mode streams, `chunk` may be any JavaScript value.
* `encoding` {string} Encoding of string chunks. Must be a valid `Buffer` encoding, such as `'utf8'` or `'ascii'`.
* Returns: {boolean} `true` if additional chunks of data may continued to be pushed; `false` otherwise.

When `chunk` is a `Buffer`, `Uint8Array` or `string`, the `chunk` of data will be added to the internal queue for users of the stream to consume. Passing `chunk` as `null` signals the end of the stream (EOF), after which no more data can be written.

When the `Readable` is operating in paused mode, the data added with `readable.push()` can be read out by calling the [`readable.read()`](#stream_readable_read_size) method when the [`'readable'`][] event is emitted.

When the `Readable` is operating in flowing mode, the data added with `readable.push()` will be delivered by emitting a `'data'` event.

The `readable.push()` method is designed to be as flexible as possible. For example, when wrapping a lower-level source that provides some form of pause/resume mechanism, and a data callback, the low-level source can be wrapped by the custom `Readable` instance as illustrated in the following example:

```js
// source is an object with readStop() and readStart() methods,
// and an `ondata` member that gets called when it has data, and
// an `onend` member that gets called when the data is over.

class SourceWrapper extends Readable {
  constructor(options) {
    super(options);

    this._source = getLowlevelSourceObject();

    // Every time there's data, push it into the internal buffer.
    this._source.ondata = (chunk) => {
      // if push() returns false, then stop reading from source
      if (!this.push(chunk))
        this._source.readStop();
    };

    // When the source ends, push the EOF-signaling `null` chunk
    this._source.onend = () => {
      this.push(null);
    };
  }
  // _read will be called when the stream wants to pull more data in
  // the advisory size argument is ignored in this case.
  _read(size) {
    this._source.readStart();
  }
}
```

The `readable.push()` method is intended be called only by `Readable` implementers, and only from within the `readable._read()` method.

For streams not operating in object mode, if the `chunk` parameter of `readable.push()` is `undefined`, it will be treated as empty string or buffer. See [`readable.push('')`][] for more information.

#### Errors While Reading

It is recommended that errors occurring during the processing of the `readable._read()` method are emitted using the `'error'` event rather than being thrown. Throwing an `Error` from within `readable._read()` can result in unexpected and inconsistent behavior depending on whether the stream is operating in flowing or paused mode. Using the `'error'` event ensures consistent and predictable handling of errors.

<!-- eslint-disable no-useless-return -->

```js
const { Readable } = require('stream');

const myReadable = new Readable({
  read(size) {
    if (checkSomeErrorCondition()) {
      process.nextTick(() => this.emit('error', err));
      return;
    }
    // do some work
  }
});
```

#### An Example Counting Stream

<!--type=example-->

The following is a basic example of a `Readable` stream that emits the numerals from 1 to 1,000,000 in ascending order, and then ends.

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

### Implementing a Duplex Stream

A [`Duplex`][] stream is one that implements both [`Readable`][] and [`Writable`][], such as a TCP socket connection.

Because JavaScript does not have support for multiple inheritance, the `stream.Duplex` class is extended to implement a [`Duplex`][] stream (as opposed to extending the `stream.Readable` *and* `stream.Writable` classes).

The `stream.Duplex` class prototypically inherits from `stream.Readable` and parasitically from `stream.Writable`, but `instanceof` will work properly for both base classes due to overriding [`Symbol.hasInstance`][] on `stream.Writable`.

Custom `Duplex` streams *must* call the `new stream.Duplex([options])` constructor and implement *both* the `readable._read()` and `writable._write()` methods.

#### new stream.Duplex(options)

<!-- YAML
changes:

  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14636
    description: The `readableHighWaterMark` and `writableHighWaterMark` options
                 are supported now.
-->

* `options` {Object} Passed to both `Writable` and `Readable` constructors. Also has the following fields: 
  * `allowHalfOpen` {boolean} If set to `false`, then the stream will automatically end the writable side when the readable side ends. **Default:** `true`.
  * `readableObjectMode` {boolean} Sets `objectMode` for readable side of the stream. Has no effect if `objectMode` is `true`. **Default:** `false`.
  * `writableObjectMode` {boolean} Sets `objectMode` for writable side of the stream. Has no effect if `objectMode` is `true`. **Default:** `false`.
  * `readableHighWaterMark` {number} Sets `highWaterMark` for the readable side of the stream. Has no effect if `highWaterMark` is provided.
  * `writableHighWaterMark` {number} Sets `highWaterMark` for the writable side of the stream. Has no effect if `highWaterMark` is provided.

```js
const { Duplex } = require('stream');

class MyDuplex extends Duplex {
  constructor(options) {
    super(options);
    // ...
  }
}
```

Or, when using pre-ES6 style constructors:

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

Or, using the Simplified Constructor approach:

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

#### An Example Duplex Stream

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
    // The underlying source only deals with strings
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

#### Object Mode Duplex Streams

For `Duplex` streams, `objectMode` can be set exclusively for either the `Readable` or `Writable` side using the `readableObjectMode` and `writableObjectMode` options respectively.

In the following example, for instance, a new `Transform` stream (which is a type of [`Duplex`][] stream) is created that has an object mode `Writable` side that accepts JavaScript numbers that are converted to hexadecimal strings on the `Readable` side.

```js
const { Transform } = require('stream');

// All Transform streams are also Duplex Streams
const myTransform = new Transform({
  writableObjectMode: true,

  transform(chunk, encoding, callback) {
    // Coerce the chunk to a number if necessary
    chunk |= 0;

    // Transform the chunk into something else.
    const data = chunk.toString(16);

    // Push the data onto the readable queue.
    callback(null, '0'.repeat(data.length % 2) + data);
  }
});

myTransform.setEncoding('ascii');
myTransform.on('data', (chunk) => console.log(chunk));

myTransform.write(1);
// Prints: 01
myTransform.write(10);
// Prints: 0a
myTransform.write(100);
// Prints: 64
```

### Implementing a Transform Stream

A [`Transform`][] stream is a [`Duplex`][] stream where the output is computed in some way from the input. Examples include [zlib](zlib.html) streams or [crypto](crypto.html) streams that compress, encrypt, or decrypt data.

There is no requirement that the output be the same size as the input, the same number of chunks, or arrive at the same time. For example, a `Hash` stream will only ever have a single chunk of output which is provided when the input is ended. A `zlib` stream will produce output that is either much smaller or much larger than its input.

The `stream.Transform` class is extended to implement a [`Transform`][] stream.

The `stream.Transform` class prototypically inherits from `stream.Duplex` and implements its own versions of the `writable._write()` and `readable._read()` methods. Custom `Transform` implementations *must* implement the [`transform._transform()`](#stream_transform_transform_chunk_encoding_callback) method and *may* also implement the [`transform._flush()`](#stream_transform_flush_callback) method.

Care must be taken when using `Transform` streams in that data written to the stream can cause the `Writable` side of the stream to become paused if the output on the `Readable` side is not consumed.

#### new stream.Transform([options])

* `options` {Object} Passed to both `Writable` and `Readable` constructors. Also has the following fields: 
  * `transform` {Function} Implementation for the [`stream._transform()`](#stream_transform_transform_chunk_encoding_callback) method.
  * `flush` {Function} Implementation for the [`stream._flush()`](#stream_transform_flush_callback) method.

```js
const { Transform } = require('stream');

class MyTransform extends Transform {
  constructor(options) {
    super(options);
    // ...
  }
}
```

Or, when using pre-ES6 style constructors:

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

Or, using the Simplified Constructor approach:

```js
const { Transform } = require('stream');

const myTransform = new Transform({
  transform(chunk, encoding, callback) {
    // ...
  }
});
```

#### Events: 'finish' and 'end'

The [`'finish'`][] and [`'end'`][] events are from the `stream.Writable` and `stream.Readable` classes, respectively. The `'finish'` event is emitted after [`stream.end()`](#stream_writable_end_chunk_encoding_callback) is called and all chunks have been processed by [`stream._transform()`](#stream_transform_transform_chunk_encoding_callback). The `'end'` event is emitted after all data has been output, which occurs after the callback in [`transform._flush()`](#stream_transform_flush_callback) has been called.

#### transform.\_flush(callback)

* `callback` {Function} A callback function (optionally with an error argument and data) to be called when remaining data has been flushed.

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Readable` class methods only.

In some cases, a transform operation may need to emit an additional bit of data at the end of the stream. For example, a `zlib` compression stream will store an amount of internal state used to optimally compress the output. When the stream ends, however, that additional data needs to be flushed so that the compressed data will be complete.

Custom [`Transform`][] implementations *may* implement the `transform._flush()` method. This will be called when there is no more written data to be consumed, but before the [`'end'`][] event is emitted signaling the end of the [`Readable`][] stream.

Within the `transform._flush()` implementation, the `readable.push()` method may be called zero or more times, as appropriate. The `callback` function must be called when the flush operation is complete.

The `transform._flush()` method is prefixed with an underscore because it is internal to the class that defines it, and should never be called directly by user programs.

#### transform.\_transform(chunk, encoding, callback)

* `chunk` {Buffer|string|any} The chunk to be transformed. Will **always** be a buffer unless the `decodeStrings` option was set to `false` or the stream is operating in object mode.
* `encoding` {string} If the chunk is a string, then this is the encoding type. If chunk is a buffer, then this is the special value - 'buffer', ignore it in this case.
* `callback` {Function} A callback function (optionally with an error argument and data) to be called after the supplied `chunk` has been processed.

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Readable` class methods only.

All `Transform` stream implementations must provide a `_transform()` method to accept input and produce output. The `transform._transform()` implementation handles the bytes being written, computes an output, then passes that output off to the readable portion using the `readable.push()` method.

The `transform.push()` method may be called zero or more times to generate output from a single input chunk, depending on how much is to be output as a result of the chunk.

It is possible that no output is generated from any given chunk of input data.

The `callback` function must be called only when the current chunk is completely consumed. The first argument passed to the `callback` must be an `Error` object if an error occurred while processing the input or `null` otherwise. If a second argument is passed to the `callback`, it will be forwarded on to the `readable.push()` method. In other words the following are equivalent:

```js
transform.prototype._transform = function(data, encoding, callback) {
  this.push(data);
  callback();
};

transform.prototype._transform = function(data, encoding, callback) {
  callback(null, data);
};
```

The `transform._transform()` method is prefixed with an underscore because it is internal to the class that defines it, and should never be called directly by user programs.

`transform._transform()` is never called in parallel; streams implement a queue mechanism, and to receive the next chunk, `callback` must be called, either synchronously or asynchronously.

#### Class: stream.PassThrough

The `stream.PassThrough` class is a trivial implementation of a [`Transform`][] stream that simply passes the input bytes across to the output. Its purpose is primarily for examples and testing, but there are some use cases where `stream.PassThrough` is useful as a building block for novel sorts of streams.

## Additional Notes

<!--type=misc-->

### Compatibility with Older Node.js Versions

<!--type=misc-->

In versions of Node.js prior to v0.10, the `Readable` stream interface was simpler, but also less powerful and less useful.

* Rather than waiting for calls the [`stream.read()`](#stream_readable_read_size) method, [`'data'`][] events would begin emitting immediately. Applications that would need to perform some amount of work to decide how to handle data were required to store read data into buffers so the data would not be lost.
* The [`stream.pause()`](#stream_readable_pause) method was advisory, rather than guaranteed. This meant that it was still necessary to be prepared to receive [`'data'`][] events *even when the stream was in a paused state*.

In Node.js v0.10, the [`Readable`][] class was added. For backwards compatibility with older Node.js programs, `Readable` streams switch into "flowing mode" when a [`'data'`][] event handler is added, or when the [`stream.resume()`](#stream_readable_resume) method is called. The effect is that, even when not using the new [`stream.read()`](#stream_readable_read_size) method and [`'readable'`][] event, it is no longer necessary to worry about losing [`'data'`][] chunks.

While most applications will continue to function normally, this introduces an edge case in the following conditions:

* No [`'data'`][] event listener is added.
* The [`stream.resume()`](#stream_readable_resume) method is never called.
* The stream is not piped to any writable destination.

For example, consider the following code:

```js
// WARNING!  BROKEN!
net.createServer((socket) => {

  // we add an 'end' listener, but never consume the data
  socket.on('end', () => {
    // It will never get here.
    socket.end('The message was received but was not processed.\n');
  });

}).listen(1337);
```

In versions of Node.js prior to v0.10, the incoming message data would be simply discarded. However, in Node.js v0.10 and beyond, the socket remains paused forever.

The workaround in this situation is to call the [`stream.resume()`](#stream_readable_resume) method to begin the flow of data:

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

In addition to new `Readable` streams switching into flowing mode, pre-v0.10 style streams can be wrapped in a `Readable` class using the [`readable.wrap()`][`stream.wrap()`] method.

### `readable.read(0)`

There are some cases where it is necessary to trigger a refresh of the underlying readable stream mechanisms, without actually consuming any data. In such cases, it is possible to call `readable.read(0)`, which will always return `null`.

If the internal read buffer is below the `highWaterMark`, and the stream is not currently reading, then calling `stream.read(0)` will trigger a low-level [`stream._read()`](#stream_readable_read_size_1) call.

While most applications will almost never need to do this, there are situations within Node.js where this is done, particularly in the `Readable` stream class internals.

### `readable.push('')`

Use of `readable.push('')` is not recommended.

Pushing a zero-byte string, `Buffer` or `Uint8Array` to a stream that is not in object mode has an interesting side effect. Because it *is* a call to [`readable.push()`](#stream_readable_push_chunk_encoding), the call will end the reading process. However, because the argument is an empty string, no data is added to the readable buffer so there is nothing for a user to consume.

### `highWaterMark` discrepancy after calling `readable.setEncoding()`

The use of `readable.setEncoding()` will change the behavior of how the `highWaterMark` operates in non-object mode.

Typically, the size of the current buffer is measured against the `highWaterMark` in *bytes*. However, after `setEncoding()` is called, the comparison function will begin to measure the buffer's size in *characters*.

This is not a problem in common cases with `latin1` or `ascii`. But it is advised to be mindful about this behavior when working with strings that could contain multi-byte characters.