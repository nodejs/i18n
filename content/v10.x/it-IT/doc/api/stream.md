# Stream

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stabile

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

* [`Readable`][] - stream da cui è possibile leggere i dati (ad esempio [`fs.createReadStream()`][]).
* [`Writable`][] - stream su cui possono essere scritti i dati (ad esempio [`fs.createWriteStream()`][]).
* [`Duplex`][] - stream che sono sia `Readable` che `Writable` (ad esempio [`net.Socket`][]).
* [`Transform`][] - `Duplex` stream che possono modificare o trasformare i dati così come sono scritti e letti (ad esempio [`zlib.createDeflate()`][]).

Inoltre questo modulo include le funzioni di utility [pipeline](#stream_stream_pipeline_streams_callback) e [finished](#stream_stream_finished_stream_callback).

### Object Mode

Tutti gli stream creati dalle API di Node.js operano esclusivamente su stringhe e `Buffer` (o `Uint8Array`) object. Tuttavia, è possibile che le implementazioni dello stream funzionino con altri tipi di valori JavaScript (ad eccezione di `null`, che ha uno scopo speciale all'interno degli stream). Tali stream sono considerati operanti in "object mode".

Le istanze di stream vengono trasformate in object mode utilizzando l'opzione `objectMode` quando viene creato lo stream. Provare a cambiare uno stream esistente in object mode non è sicuro.

### Buffering

<!--type=misc-->

Entrambi gli stream sia [`Writable`][] che [`Readable`][] memorizzeranno i dati in un buffer interno che può essere recuperato usando rispettivamente `writable.writableBuffer` oppure `readable.readableBuffer`.

La quantità di dati potenzialmente inseriti in un buffer dipende dall'opzione `highWaterMark` passata all'interno del constructor degli stream. Per gli stream normali, l'opzione `highWaterMark` specifica un [numero totale di bytes](#stream_highwatermark_discrepancy_after_calling_readable_setencoding). Per gli stream che operano in object mode, l'`highWaterMark` specifica un numero totale di object.

I dati vengono memorizzati nel buffer nei `Readable` stream quando l'implementazione chiama [`stream.push(chunk)`](#stream_readable_push_chunk_encoding). Se il consumer dello Stream non chiama [`stream.read()`](#stream_readable_read_size), i dati si fermeranno nella queue interna fino a quando non verranno consumati/utilizzati.

Una volta che la dimensione totale del read buffer interno raggiunge la soglia specificata da `highWaterMark`, lo stream interromperà temporaneamente la lettura dei dati da parte della risorsa sottostante fino a quando i dati attualmente memorizzati nel buffer non potranno essere consumati (ovvero, lo stream si arresterà chiamando il metodo interno `readable._read()` utilizzato per riempire il read buffer).

I dati vengono memorizzati nel buffer nei `Writable` stream quando il metodo [`writable.write(chunk)`](#stream_writable_write_chunk_encoding_callback) viene chiamato ripetutamente. Quando la dimensione totale del write buffer interno è inferiore alla soglia impostata da `highWaterMark`, le chiamate a `writable.write()` restituiranno `true`. Quando invece la dimensione del buffer interno raggiunge o supera l'`highWaterMark`, verrà restituito `false`.

Un obiettivo chiave dello `stream` API, in particolare il metodo [`stream.pipe()`], è di limitare il buffering dei dati a livelli accettabili in modo che sorgenti e destinazioni di diverse velocità non sovraccarichino la memoria disponibile.

Poiché gli stream [`Duplex`][] e [`Transform`][] sono entrambi sia `Readable` che `Writable`, ciascuno di essi mantiene *due* buffer interni separati utilizzati per la lettura e la scrittura, consentendo a ciascuna parte di operare indipendentemente dall'altra mantenendo un flusso di dati appropriato ed efficiente. Ad esempio, le istanze di [`net.Socket`][] sono i [`Duplex`][] stream di cui la parte `Readable` consente il consumo dei dati ricevuti *dal* socket e la parte `Writable` consente di scrivere i dati *sul* socket. Poiché i dati possono essere scritti sul socket ad una velocità maggiore o minore rispetto a quella dei dati ricevuti, è importante che ciascuna parte funzioni (ed esegua il buffer) indipendentemente dall'altra.

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

Questo viene emesso anche nel caso in cui questo [`Writable`][] stream emetta un errore quando [`Readable`][] stream esegue il piping al suo interno.

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
* `callback` {Function} Callback opzionale per quando lo stream si conclude
* Restituisce: {this}

Chiamando il metodo `writable.end()` si segnala che non verranno scritti più dati su [`Writable`][]. Gli argomenti facoltativi `chunk` ed `encoding` consentono di scrivere un'ultimo chuck di dati aggiuntivo immediatamente prima di chiudere lo stream. Se fornita, la funzione facoltativa `callback` è allegata come listener per l'evento [`'finish'`][].

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

Mentre uno stream non subisce il drain, le chiamate a `write()` eseguiranno il buffer di `chunk` e restituiranno false. Una volta che tutti gli attuali chunk memorizzati nel buffer hanno subito il drain (accettati per la consegna dal sistema operativo), verrà emesso l'evento `'drain'`. E' consigliato che, una volta che `write()` restituisce false, non vengano scritti più chunk finché non viene emesso l'evento `'drain'`. Quando è permesso chiamare `write()` su uno stream che non è sottoposto al drain, Node.js memorizzerà tramite il buffering tutti i chunk scritti finché non viene raggiunto l'utilizzo massimo della memoria, a quel punto si interromperà incondizionatamente. Ancor prima che si interrompa, l'uso elevato della memoria causerà scarso rendimento del garbage collector ed alti livelli di RSS (che in genere non vengono ripristinati nel sistema, anche dopo che la memoria non è più necessaria). Poiché i socket TCP potrebbero non subire mai il drain se il peer remoto non legge i dati, scrivere un socket che non subisce mai il drain può portare ad una vulnerabilità sfruttabile da remoto.

Scrivere i dati mentre lo stream non subisce il drain è particolarmente problematico per un [`Transform`][], perché gli stream `Transform` sono messi in pausa per impostazione predefinita fino a quando non vengono reindirizzati (piping) oppure finchè non viene aggiunto un handler dell’evento `'data'` o dell’evento `'readable'`.

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

### Readable Stream

Gli readable stream sono un'abstraction per una *sorgente* da cui vengono utilizzati i dati.

Gli esempi di stream `Readable` stream includono:

* [Risposte HTTP, sul client](http.html#http_class_http_incomingmessage)
* [Richieste HTTP, sul server](http.html#http_class_http_incomingmessage)
* [fs read stream](fs.html#fs_class_fs_readstream)
* [zlib stream](zlib.html)
* [crypto stream](crypto.html)
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

Il concetto importante da ricordare è che un `Readable` non genererà dati finché non verrà fornito un meccanismo per consumare o ignorare tali dati. Se il meccanismo di consumo è disabilitato o tolto, il `Readable` *tenterà* di interrompere la generazione dei dati.

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

Distrugge lo stream ed emette l'`'error'` e l'evento `'close'`. Dopo questa chiamata, il readable stream rilascerà tutte le risorse interne e le successive chiamate a `push()` verranno ignorate. Gli implementor non dovrebbero sovrascrivere questo metodo, ma implementare [`readable._destroy()`](#stream_readable_destroy_err_callback).

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
* `option` {Object} Opzioni Pipe 
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

* `destination` {stream.Writable} Stream specifico opzionale da sottoporre all’unpiping
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

Il metodo `stream.unshift(chunk)` non può essere chiamato dopo che è stato emesso l'evento [`'end'`][] altrimenti verrà generato un errore di runtime.

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

Quando si utilizza una precedente libreria Node.js che emette eventi [`'data'`][] ed ha un metodo [`stream.pause()`](#stream_readable_pause) che è di sola consulenza, il metodo `readable.wrap()` può essere utilizzato per creare un [`Readable`][] stream che utilizza il vecchio stream come sua sorgente dati.

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

Se il ciclo termina con un `break` oppure un `throw`, lo stream verrà distrutto. In altre parole, l'iterazione su uno stream consumerà completamente lo stream stesso. Lo stream verrà letto in chunk di dimensioni uguali all'opzione `highWaterMark`. Nell'esempio di codice sopracitato, se il file ha meno di 64kb di dati, questi saranno in un singolo chunk perché non viene fornita l'opzione `highWaterMark` per [`fs.createReadStream()`][].

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

I duplex stream sono stream che implementano sia la [`Readable`][] interface che la [`Writable`][] interface.

Gli esempi di `Duplex` stream includono:

* [TCP sockets](net.html#net_class_net_socket)
* [zlib streams](zlib.html)
* [crypto streams](crypto.html)

#### Class: stream.Transform

<!-- YAML
added: v0.9.4
-->

<!--type=class-->

I transform stream sono [`Duplex`][] stream in cui l'output è in qualche modo correlato all'input. Come tutti gli [`Duplex`][] stream, i `Transform` stream implementano sia la [`Readable`][] interface che la [`Writable`][] interface.

Gli esempi di `Transform` stream includono:

* [zlib streams](zlib.html)
* [crypto streams](crypto.html)

##### transform.destroy([error])

<!-- YAML
added: v8.0.0
-->

Distrugge lo stream ed emette `'error'`. Dopo questa chiamata, il transform stream rilascerebbe qualsiasi risorsa interna. gli implementors non dovrebbero sovrascrivere questo metodo, ma implementare [`readable._destroy()`](#stream_readable_destroy_err_callback). L'implementazione predefinita di `_destroy()` per `Transform` emette anche `'close'`.

### stream.finished(stream, callback)

<!-- YAML
added: v10.0.0
-->

* `stream` {Stream} Un readable stream e/o un writable stream.
* `callback` {Function} Una funzione di callback che accetta un argomento error opzionale.

Una funzione per ricevere una notifica quando uno stream non è più readable, writable oppure se ha subito un errore od un evento close prematuro.

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

rs.resume(); // lo stream viene sottoposto al drain
```

Particolarmente utile negli scenari di gestione degli errori in cui uno stream viene distrutto prematuramente (come una richiesta HTTP interrotta) e non emetterà `'end'` o `'finish'`.

L'API `finished` è anche promisify-able;

```js
const finished = util.promisify(stream.finished);

const rs = fs.createReadStream('archive.tar');

async function run() {
  await finished(rs);
  console.log('Stream is done reading');
}

run().catch(console.error);
rs.resume(); // lo stream viene sottoposto al drain
```

### stream.pipeline(...streams[, callback])

<!-- YAML
added: v10.0.0
-->

* `...streams` {Stream} Due o più stream da collegare tramite il piping.
* `callback` {Function} Una funzione di callback che accetta un argomento error opzionale.

Un metodo modulo per il piping tra gli stream che inoltrano gli errori ed eseguono una corretta pulizia e che forniscono un callback quando la pipeline è completa.

```js
const { pipeline } = require('stream');
const fs = require('fs');
const zlib = require('zlib');

// Utilizza la pipeline API per unire facilmente tramite il piping una serie
// di stream e ricevere notifiche quando la pipeline è completa.

// Una pipeline per eseguire il gzip di un file tar potenzialmente enorme in modo efficiente:

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

L'API `pipeline` è anche promisify-able:

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

<table>
  <thead>
    <tr>
      <th>
        <p>Caso d'utilizzo</p>
      </th>
      <th>
        <p>Classe</p>
      </th>
      <th>
        <p>Metodo(i) da implementare</p>
      </th>
    </tr>
  </thead>
  <tr>
    <td>
      <p>Solo lettura</p>
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
      <p>Solo scrittura</p>
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
      <p>Lettura e scrittura</p>
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
      <p>Operazione su dati scritti e lettura del risultato</p>
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

Il codice di implementazione per uno stream non deve *mai* chiamare i metodi "pubblici" di uno stream che sono destinati all'uso da parte dei consumer (come descritto nella sezione [API per gli Stream Consumer](#stream_api_for_stream_consumers)). Ciò potrebbe causare effetti collaterali negativi nel codice dell'applicazione che utilizza/consuma lo stream.

### Costruzione semplificata

<!-- YAML
added: v1.2.0
-->

Per molti semplici casi, è possibile costruire uno stream senza fare affidamento sull'ereditarietà. Questo può essere ottenuto creando direttamente istanze degli objects `stream.Writable`, `stream.Readable`, `stream.Duplex` oppure `stream.Transform` e passando metodi appropriati come opzioni di constructor.

```js
const { Writable } = require('stream');

const myWritable = new Writable({
  write(chunk, encoding, callback) {
    // ...
  }
});
```

### Implementazione di un Writable Stream

La classe `stream.Writable` viene estesa per implementare un [`Writable`][] stream.

Gli `Writable` stream personalizzati *devono* chiamare il nuovo constructor `new stream.Writable([options])` ed implementare il metodo `writable._write()`. Anche il metodo `writable._writev()` *potrebbe* essere implementato.

#### Constructor: new stream.Writable([options])

<!-- YAML
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18438
    description: >
      Add `emitClose` option to specify if `'close'` is emitted on destroy
-->

* `options` {Object} 
  * `highWaterMark` {number} Livello del buffer quando [`stream.write()`](#stream_writable_write_chunk_encoding_callback) inizia a restituire `false`. **Default:** `16384` (16kb), oppure `16` per gli stream `objectMode`.
  * `decodeStrings` {boolean} Decodifica o meno delle stringhe all'interno dei `Buffer` prima di passarle a [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1). **Default:** `true`.
  * `objectMode` {boolean} Indipendentemente dal fatto che [`stream.write(anyObj)`](#stream_writable_write_chunk_encoding_callback) sia un'operazione valida. Quando è impostato, diventa possibile scrivere valori JavaScript diversi da una stringa, un `Buffer` od un `Uint8Array` se supportati dall'implementazione dello stream. **Default:** `false`.
  * `emitClose` {boolean} Indipendentemente dal fatto che lo stream debba emettere `'close'` dopo esser stato distrutto. **Default:** `true`.
  * `write` {Function} Implementazione per il metodo [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1).
  * `writev` {Function} Implementazione per il metodo [`stream._writev()`](#stream_writable_writev_chunks_callback).
  * `destroy` {Function} Implementazione per il metodo [`stream._destroy()`](#stream_writable_destroy_err_callback).
  * `final` {Function} Implementazione per il metodo [`stream._final()`](#stream_writable_final_callback).

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

* `chunk` {Buffer|string|any} Il chunk da scrivere. Sarà **sempre** un buffer a meno che l'opzione `decodeStrings` sia impostata su `false` oppure che lo stream stia operando in object mode.
* `encoding` {string} Se il chunk è una stringa, allora `encoding` è l'encoding del carattere di quella stringa. Se il chunk è un `Buffer`, o se lo stream sta operando in object mode, l'`encoding` potrebbe essere ignorato.
* `callback` {Function} Chiama questa funzione (facoltativamente con un argomento error) quando l'elaborazione per il chunk fornito è completa.

Tutte le implementazioni di `Writable` stream devono fornire un metodo [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1) per inviare dati alla risorsa sottostante.

Gli [`Transform`][] stream forniscono la loro personale implementazione del [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1).

Questa funzione NON DEVE essere chiamata direttamente dal codice dell'applicazione. Dovrebbe essere implementata dalle child class e chiamata solo dai metodi della classe interna `Writable`.

Il metodo `callback` deve essere chiamato per segnalare che la scrittura è stata completata correttamente oppure che ha avuto esito negativo con un errore. Il primo argomento passato al `callback` deve essere l'`Error` object se la chiamata non è riuscita oppure `null` se la scrittura è andata a buon fine.

Tutte le chiamate a `writable.write()` che si verificano tra il momento in cui `writable._write()` viene chiamato ed il momento in cui il `callback` viene chiamato faranno sì che i dati scritti siano memorizzati in un buffer. Quando viene invocato il `callback`, lo stream potrebbe emettere un evento [`'drain'`][]. Se un'implementazione di stream è in grado di elaborare molteplici chunk di dati contemporaneamente, è necessario implementare il metodo `writable._writev()`.

Se la proprietà `decodeStrings` è impostata esplicitamente su `false` nelle opzioni del constructor, allora il `chunk` rimarrà lo stesso object passato a `.write()`, il quale potrebbe essere una stringa piuttosto che un `Buffer`. Questo è per supportare le implementazioni che hanno una gestione ottimizzata per determinati encoding degli string data. In tal caso, l'argomento `encoding` indicherà l'encoding del carattere della stringa. In caso contrario, l'argomento `encoding` può essere tranquillamente ignorato.

Il metodo `writable._write()` è preceduto da un trattino basso (underscore) perché è interno alla classe che lo definisce e non dovrebbe mai essere chiamato direttamente dai programmi utente.

#### writable.\_writev(chunks, callback)

* `chunks` {Object[]} Il chunk da scrivere. Ogni chunk ha il seguente formato: `{ chunk: ..., encoding: ... }`.
* `callback` {Function} Una funzione di callback (facoltativamente con un argomento error) da invocare quando l'elaborazione per i chunk forniti è completa.

Questa funzione NON DEVE essere chiamata direttamente dal codice dell'applicazione. Dovrebbe essere implementata dalle child class e chiamata solo dai metodi della classe interna `Writable`.

Il metodo `writable._writev()` può essere implementato in aggiunta a `writable._write()` nelle implementazioni di stream in grado di elaborare molteplici chunk di dati contemporaneamente. Se implementato, il metodo verrà chiamato con tutti i chunk di dati attualmente memorizzati tramite il buffering nella write queue.

Il metodo `writable._writev()` è preceduto da un trattino basso (underscore) perché è interno alla classe che lo definisce e non dovrebbe mai essere chiamato direttamente dai programmi utente.

#### writable.\_destroy(err, callback)

<!-- YAML
added: v8.0.0
-->

* `err` {Error} Un possibile errore.
* `callback` {Function} Una funzione di callback che accetta un argomento error opzionale.

Il metodo `_destroy()` è chiamato da [`writable.destroy()`](#stream_writable_destroy_error). Può essere sovrascritto dalle child class ma **non deve** essere chiamato direttamente.

#### writable.\_final(callback)

<!-- YAML
added: v8.0.0
-->

* `callback` {Function} Chiama questa funzione (facoltativamente con un argomento error) quando si è conclusa la scrittura di qualsiasi dato rimanente.

Il metodo `_final()` **non deve** essere chiamato direttamente. Può essere implementato dalle child class e, in tal caso, verrà chiamato solo dai metodi di classe interni `Writable`.

Questa funzione facoltativa verrà chiamata prima che lo stream si chiuda, ritardando l'evento `'finish'` fino a quando viene chiamato il `callback`. Questo è utile per chiudere le risorse o scrivere dati memorizzati nel buffer prima che uno stream finisca.

#### Errori Durante la Scrittura

Si raccomanda di segnalare gli errori che si verificano durante l'elaborazione dei metodi `writable._write()` e `writable._writev()` invocando il callback e passando l'errore come primo argomento. Ciò causerà un evento `'error'` che deve essere emesso dal `Writable`. Lanciare un `Error` da `writable._write()` può portare un comportamento inaspettato ed incoerente a seconda di come viene utilizzato lo stream. L'utilizzo del callback garantisce una gestione degli errori coerente e prevedibile.

Se un `Readable` stream esegue il piping in un `Writable` stream quando `Writable` emette un errore, il `Readable` stream sarà sottoposto all'unpiping.

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

Quanto segue mostra un'implementazione di `Writable` stream personalizzata piuttosto semplice (ed alquanto inutile). Sebbene questa specifica istanza di `Writable` stream non sia di alcuna particolare utilità, l'esempio mostra ognuno degli elementi richiesti di un'istanza di [`Writable`][] stream personalizzata:

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

#### Decodifica dei buffer in un Writable Stream

La decodifica dei buffer è un'attività comune, ad esempio, quando si usano dei transformer il cui input è una stringa. Non è un processo banale quando si utilizza la codifica di caratteri multi-byte, come ad esempio UTF-8. L'esempio seguente mostra come decodificare le stringhe multi-byte utilizzando `StringDecoder` e [`Writable`][].

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

console.log(w.data); // valuta: €
```

### Implementazione di un Readable Stream

La classe `stream.Readable` viene estesa per implementare un [`Readable`][] stream.

Gli `Readable` stream personalizzati *devono* chiamare il nuovo constructor `new stream.Readable([options])` ed implementare il metodo `readable._read()`.

#### new stream.Readable([options])

* `options` {Object} 
  * `highWaterMark` {number} Il massimo [numero di bytes](#stream_highwatermark_discrepancy_after_calling_readable_setencoding) da memorizzare nel buffer interno prima di interrompere la lettura dalla risorsa sottostante. **Default:** `16384` (16kb), oppure `16` per gli stream `objectMode`.
  * `encoding` {string} Se specificato, i buffer verranno decodificati in stringhe utilizzando tale encoding. **Default:** `null`.
  * `objectMode` {boolean} Se questo stream dovrebbe comportarsi come uno stream di objects. Il che significa che [`stream.read(n)`](#stream_readable_read_size) restituisce un singolo valore invece di un `Buffer` di dimensione `n`. **Default:** `false`.
  * `read` {Function} Implementazione per il metodo [`stream._read()`](#stream_readable_read_size_1).
  * `destroy` {Function} Implementazione per il metodo [`stream._destroy()`](#stream_readable_destroy_err_callback).

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

#### readable.\_read(size)

<!-- YAML
added: v0.9.4
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17979
    description: call `_read()` only once per microtick
-->

* `size` {number} Numero di bytes da leggere in modo asincrono

Questa funzione NON DEVE essere chiamata direttamente dal codice dell'applicazione. Dovrebbe essere implementata dalle child class e chiamata solo dai metodi della classe interna `Readable`.

Tutte le implementazioni di `Readable` stream devono fornire un metodo `readable._read()` per inviare dati alla risorsa sottostante.

Quando viene chiamato `readable._read()`, se i dati sono disponibili dalla risorsa, l'implementazione dovrebbe iniziare ad eseguire il push dei dati nella read queue utilizzando il metodo [`this.push(dataChunk)`](#stream_readable_push_chunk_encoding). `_read()` dovrebbe continuare la lettura dalla risorsa ed eseguire il push dei dati finché `readable.push()` restituisce `false`. Solo quando `_read()` viene chiamato ancora dopo essersi fermato, dovrebbe riprendere ad eseguire il push degli altri dati nella queue.

Una volta chiamato il metodo `readable._read()`, esso non verrà chiamato ancora fino a quando non viene chiamato il metodo [`readable.push()`](#stream_readable_push_chunk_encoding). E' sicuro che `readable._read()` venga chiamato solo una volta all'interno di un'esecuzione sincrona, cioè un microtick.

L'argomento `size` è di consulenza. Per le implementazioni in cui una "lettura" è una singola operazione che restituisce i dati, è possibile utilizzare l'argomento `size` per determinare la quantità di dati da recuperare. Altre implementazioni possono ignorare questo argomento e fornire dati semplicemente ogni volta che diventano disponibili. Non è necessario "attendere" che i `size` bytes siano disponibili prima di chiamare [`stream.push(chunk)`](#stream_readable_push_chunk_encoding).

Il metodo `readable._read()` è precedetuo da un trattino basso (underscore) perché è interno alla classe che lo definisce e non dovrebbe mai essere chiamato direttamente dai programmi utente.

#### readable.\_destroy(err, callback)

<!-- YAML
added: v8.0.0
-->

* `err` {Error} Un possibile errore.
* `callback` {Function} Una funzione di callback che accetta un argomento error opzionale.

Il metodo `_destroy()` è chiamato da [`readable.destroy()`](#stream_readable_destroy_error). Può essere sovrascritto dalle child class ma **non deve** essere chiamato direttamente.

#### readable.push(chunk[, encoding])

<!-- YAML
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->

* `chunk` {Buffer|Uint8Array|string|null|any} Chunk di dati da inserire tramite push nella read queue. Per gli stream che non funzionano in object mode, `chunk` deve essere una stringa, un `Buffer` oppure un `Uint8Array`. Per gli stream in object mode, `chunk` può essere qualsiasi valore JavaScript.
* `encoding` {string} Encoding degli string chunk. Deve essere una `Buffer` encoding valido, come ad esempio `'utf8'` oppure `'ascii'`.
* Restituisce: {boolean} `true` se è possibile continuare ad eseguire il push di ulteriori chunk di dati; in caso contrario `false`.

Quando `chunk` è un `Buffer`, un `Uint8Array` oppure una `string`, il `chunk` dei dati verrà aggiunto alla queue interna per gli utenti dello stream da consumare. Passare `chunk` come `null` segnala la fine dello stream (EOF), dopo di che non è più possibile scrivere dati.

Quando il `Readable` funziona in paused mode, i dati aggiunti con `readable.push()` possono essere letti chiamando il metodo [`readable.read()`](#stream_readable_read_size) quando viene emesso l'evento [`'readable'`][].

Quando il `Readable` funziona in flowing mode, i dati aggiunti con `readable.push()` verranno consegnati emettendo un evento `'data'`.

Il metodo `readable.push()` è progettato per essere il più flessibile possibile. Ad esempio, quando si esegue il wrapping di una sorgente di livello inferiore che fornisce una qualche forma di meccanismo di pausa/ripresa, ed un data callback, la sorgente di basso livello può essere sottoposta al wrapping dall'istanza personalizzata `Readable` come mostrato nel seguente esempio:

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

Il metodo `readable.push()` deve essere chiamato solo dai `Readable` implementer, e solo dal metodo `readable._read()`.

Per gli stream che non operano in object mode, se il parametro `chunk` di `readable.push()` è `undefined`, verrà considerato come stringa vuota o buffer. Vedi [`readable.push('')`][] per maggiori informazioni.

#### Errori Durante la Lettura

E' consigliato emettere gli errori, che si verificano durante l'elaborazione del metodo `readable._read()`, utilizzando l'evento `'error'` anziché lanciandoli. Lanciare un `Error` da `readable._read()` può portare un comportamento inaspettato ed incoerente a seconda che lo stream stia funzionando in flowing mode oppure in paused mode. L'utilizzo dell'evento `'error'` garantisce una gestione degli errori coerente e prevedibile.

<!-- eslint-disable no-useless-return -->

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

#### Un Esempio di Counting Stream

<!--type=example-->

Di seguito è riportato un esempio di base di un `Readable` stream che emette i numeri da 1 ad 1,000,000 in ordine ascendente, e successivamente termina.

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

Un [`Duplex`][] stream è uno stream che implementa sia [`Readable`][] che [`Writable`][], come ad esempio una connessione socket TCP.

Poiché JavaScript non supporta l'ereditarietà multipla, la classe `stream.Duplex` viene estesa per implementare un [`Duplex`][] stream (al contrario dell'estensione delle classi `stream.Readable` *e* `stream.Writable`).

La classe `stream.Duplex` eredita prototipicamente da `stream.Readable` e parassiticamente da `stream.Writable`, ma `instanceof` funzionerà correttamente per entrambe le classi di base a causa della sovrascrizione di [`Symbol.hasInstance`][] su `stream.Writable`.

I `Duplex` stream personalizzati *devono* chiamare il nuovo constructor `new stream.Duplex([options])` ed implementare *entrambi* i metodi sia `readable._read()` che `writable._write()`.

#### new stream.Duplex(options)

<!-- YAML
changes:

  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14636
    description: The `readableHighWaterMark` and `writableHighWaterMark` options
                 are supported now.
-->

* `options` {Object} Passato ad entrambi i constructor sia `Writable` che `Readable`. Inoltre ha le seguenti voci: 
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

Di seguito viene mostrato un semplice esempio di un `Duplex` stream che esegue il wrapping di un ipotetico source object di livello inferiore su cui è possibile scrivere dati e da cui è possibile leggerli, utilizzando un'API non compatibile con gli stream di Node.js. Di seguito viene mostrato un semplice esempio di un `Duplex` stream che memorizza tramite buffering i dati scritti in arrivo tramite la [`Writable`][] interface e che viene riletto tramite la [`Readable`][] interface.

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

L'aspetto più importante di un `Duplex` stream è che entrambe le parti sia `Readable` che `Writable` operano indipendentemente l'una dall'altra nonostante coesistano all'interno di una singola istanza di object.

#### Object Mode per i Duplex Stream

Per gli `Duplex` stream, l'`objectMode` può essere impostata esclusivamente o per la parte `Readable` oppure per la parte `Writable` utilizzando rispettivamente l'opzione `readableObjectMode` oppure l'opzione `writableObjectMode`.

Di seguito, ad esempio, viene creato un nuovo `Transform` stream (che è un tipo di [`Duplex`][] stream) con una object mode della parte `Writable` che accetta i numeri JavaScript che vengono convertiti in stringhe esadecimali nella parte `Readable`.

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

Un [`Transform`][] stream è un [`Duplex`][] stream in cui l'output viene calcolato in qualche modo dall'input. Gli esempi includono gli [zlib](zlib.html) stream oppure i [crypto](crypto.html) stream che comprimono, codificano o decodificano i dati.

Non è necessario che l'output abbia le stesse dimensioni dell'input, lo stesso numero di chunk o che arrivi nello stesso momento. Ad esempio, un `Hash` stream avrà sempre un singolo chunk di output il quale viene fornito quando l'input si conclude. Un `zlib` stream produrrà un output che è molto più piccolo oppure molto più grande del suo input.

La classe `stream.Transform` viene estesa per implementare un [`Transform`][] stream.

La classe `stream.Transform` eredita prototipicamente da `stream.Duplex` ed implementa le proprie versioni dei metodi `writable._write()` e `readable._read()`. Le implementazioni `Transform` personalizzate *devono* implementare il metodo [`transform._transform()`](#stream_transform_transform_chunk_encoding_callback) e *potrebbero* implementare anche il metodo [`transform._flush()`](#stream_transform_flush_callback).

È necessario prestare attenzione quando si utilizzano gli `Transform` stream in quei dati scritti nello stream che possono far sì che la parte `Writable` dello stream venga sospesa se non viene consumato l'output sulla parte `Readable`.

#### new stream.Transform([options])

* `options` {Object} Passato ad entrambi i constructor sia `Writable` che `Readable`. Inoltre ha le seguenti voci: 
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

Questa funzione NON DEVE essere chiamata direttamente dal codice dell'applicazione. Dovrebbe essere implementata dalle child class e chiamata solo dai metodi della classe interna `Readable`.

In alcuni casi, un'operazione transform potrebbe dover emettere un ulteriore bit di dati alla fine dello stream. Ad esempio, uno stream di compressione `zlib` memorizzerà una quantità di stato interno utilizzato per comprimere in modo ottimale l'output. Al termine dello stream, tuttavia, è necessario svuotare i dati aggiuntivi per completare i dati compressi.

Le implementazioni [`Transform`][] personalizzate *potrebbero* implementare il metodo `transform._flush()`. Questo verrà chiamato quando non ci sono più dati scritti da consumare, ma prima che l'evento [`'end'`][] venga emesso segnalando la fine del [`Readable`][] stream.

Nell'implementazione `transform._flush()`, il metodo `readable.push()` può essere chiamato zero o più volte, a seconda dei casi. La funzione `callback` deve essere chiamata quando l'operazione flush è completa.

Il metodo `transform._flush()` è preceduto da un trattino basso (underscore) perché è interno alla classe che lo definisce e non dovrebbe mai essere chiamato direttamente dai programmi utente.

#### transform.\_transform(chunk, encoding, callback)

* `chunk` {Buffer|string|any} Il chunk da trasformare. Sarà **sempre** un buffer a meno che l'opzione `decodeStrings` sia impostata su `false` oppure che lo stream stia operando in object mode.
* `encoding` {string} Se il chunk è una stringa, allora questo è il tipo di encoding. Se il chunk è un buffer, allora questo è il valore speciale - 'buffer', ignorarlo in questo caso.
* `callback` {Function} Una funzione di callback (facoltativamente con un argomento error e data) da chiamare dopo che il `chunk` fornito è stato elaborato.

Questa funzione NON DEVE essere chiamata direttamente dal codice dell'applicazione. Dovrebbe essere implementata dalle child class e chiamata solo dai metodi della classe interna `Readable`.

Tutte le implementazioni di `Transform` stream devono fornire un metodo `_transform()` per accettare l'input e produrre l'output. L'implementazione `transform._transform()` gestisce i byte scritti, calcola un output, e di conseguenza passa quell'output alla porzione readable utilizzando il metodo `readable.push()`.

Il metodo `transform.push()` può essere chiamato zero o più volte per generare l'output da un singolo input chunk, a seconda di quanto deve essere prodotto come risultato del chunk.

È possibile che nessun output sia generato da un determinato chunk di dati input.

La funzione `callback` deve essere chiamata solo quando il chunk attuale è completamente consumato. Il primo argomento passato al `callback` deve essere un `Error` object se si verifica un errore durante l'elaborazione dell'input oppure `null` in caso contrario. Se viene passato un secondo argomento al `callback`, esso verrà inoltrato al metodo `readable.push()`. In altre parole, i seguenti sono equivalenti:

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

La classe `stream.PassThrough` è un'implementazione banale di un [`Transform`][] stream che passa semplicemente i byte d'input all'output. E' utile principalmente per gli esempi e per il testing, ma ci sono alcuni casi d'uso in cui `stream.PassThrough` è utile anche come base per nuovi tipi di stream.

## Note aggiuntive

<!--type=misc-->

### Compatibilità con le Versioni Precedenti di Node.js

<!--type=misc-->

Nelle versioni Node.js precedenti alla v0.10, la `Readable` stream interface era più semplice, ma anche meno potente e meno utile.

* Anziché aspettare di chiamare il metodo [`stream.read()`](#stream_readable_read_size), gli eventi [`'data'`][] iniziavano ad emettere immediatamente. Le applicazioni che avevano bisogno di eseguire una certa quantità di lavoro per decidere come gestire i dati erano necessarie per memorizzare i read data all'interno dei buffer in modo che non andassero persi.
* Il metodo [`stream.pause()`](#stream_readable_pause) era di tipo consultivo, piuttosto che garantito. Ciò significava che era ancora necessario essere preparati a ricevere eventi [`'data'`][] *anche quando lo stream era in uno stato di pausa*.

In Node.js v0.10, è stata aggiunta la classe [`Readable`][]. Per la retro compatibilità con i programmi Node.js precedenti, gli `Readable` stream passano in "flowing mode" quando viene aggiunto un handler di eventi [`'data'`][] oppure quando viene chiamato il metodo [`stream.resume()`](#stream_readable_resume). L'effetto è che, anche quando non si utilizza il nuovo metodo [`stream.read()`](#stream_readable_read_size) e l'evento [`'readable'`][], non è più necessario preoccuparsi di perdere dei chunk di [`'data'`][].

Mentre la maggior parte delle applicazioni continueranno a funzionare normalmente, questo introduce un caso limite nelle seguenti condizioni:

* Non viene aggiunto nessun listener di eventi [`'data'`][].
* Il metodo [`stream.resume()`](#stream_readable_resume) non viene mai chiamato.
* Lo stream non è collegato tramite piping a nessuna destinazione writable.

Ad esempio, considera il seguente codice:

```js
// ATTENZIONE!  DANNEGGIATO!
net.createServer((socket) => {

  // aggiungiamo un 'end' listener, ma senza consumare i dati
  socket.on('end', () => {
    // Non arriverà mai qui.
    socket.end('The message was received but was not processed.\n');
  });

}).listen(1337);
```

Nelle versioni di Node.js precedenti alla v0.10, i dati dei messaggi in entrata venivano semplicemente scartati. Tuttavia, in Node.js v0.10 e nelle versioni successive, il socket rimane sospeso per sempre.

Il workaround (la soluzione) in questa situazione è chiamare il metodo [`stream.resume()`](#stream_readable_resume) per iniziare il flusso dei dati:

```js
// Workaround
net.createServer((socket) => {
  socket.on('end', () => {
    socket.end('The message was received but was not processed.\n');
  });

  // avvia il flusso di dati, scartandolo.
  socket.resume();
}).listen(1337);
```

Oltre ai nuovi `Readable` stream che passano alla flowing mode, gli stream di stile pre-v0.10 possono essere inclusi in una classe `Readable` utilizzando il metodo [`readable.wrap()`][`stream.wrap()`].

### `readable.read(0)`

Ci sono alcuni casi in cui è necessario ri-aggiornare i meccanismi sottostanti di readable stream, senza effettivamente consumare alcun dato. In questi casi, è possibile chiamare `readable.read(0)`, che restituirà sempre `null`.

Se il read buffer interno è inferiore all'`highWaterMark`, e lo stream non sta leggendo in quel momento, allora chiamare `stream.read(0)` attiverà la chiamata di un [`stream._read()`](#stream_readable_read_size_1) di livello inferiore.

Anche se la maggior parte delle applicazioni non avrà bisogno quasi mai di farlo, ci sono situazioni all'interno di Node.js dove questo viene fatto, in particolare nelle classi interne di `Readable` stream.

### `readable.push('')`

L'utilizzo di `readable.push('')` non è raccomandato.

Il push di una stringa, un `Buffer` oppure un `Uint8Array` di zero-byte in uno stream che non è in object mode ha un effetto collaterale interessante. Poiché *è* una chiamata a [`readable.push()`](#stream_readable_push_chunk_encoding), la chiamata terminerà il processo di lettura. Tuttavia, poiché l'argomento è una stringa vuota, non viene aggiunto nessun dato al readable buffer, perciò non c'è nulla che un utente possa consumare.

### discrepanza di `highWaterMark` dopo aver chiamato `readable.setEncoding()`

L'utilizzo di `readable.setEncoding()` cambierà il modo in cui `highWaterMark` opera al di fuori dell'object mode.

In genere, la dimensione del buffer attuale viene misurata rispetto all'`highWaterMark` in *bytes*. Tuttavia, dopo aver chiamato `setEncoding()`, la funzione di confronto inizierà a misurare la dimensione del buffer in *characters* (caratteri).

Questo non è un problema nei casi comuni con `latin1` oppure `ascii`. Ma si consiglia di essere consapevoli di tale comportamento quando si lavora con stringhe che potrebbero contenere caratteri multi-byte.