# Zlib

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Il modulo `zlib` fornisce funzionalità di compressione implementate utilizzando Gzip e Deflate/Inflate. Ci si può accedere utilizzando:

```js
const zlib = require('zlib');
```

Il comprimere o decomprimere uno stream (come un file) può essere compiuto collegando i dati del source stream attraverso uno `zlib` stream ad uno stream di destinazione:

```js
const gzip = zlib.createGzip();
const fs = require('fs');
const inp = fs.createReadStream('input.txt');
const out = fs.createWriteStream('input.txt.gz');

inp.pipe(gzip).pipe(out);
```

È inoltre possibile comprimere o decomprimere i dati in un unico step:

```js
const input = '.................................';
zlib.deflate(input, (err, buffer) => {
  if (!err) {
    console.log(buffer.toString('base64'));
  } else {
    // gestire l'errore
  }
});

const buffer = Buffer.from('eJzT0yMAAGTvBe8=', 'base64');
zlib.unzip(buffer, (err, buffer) => {
  if (!err) {
    console.log(buffer.toString());
  } else {
    // gestire l'errore
  }
});
```

## Utilizzo del Threadpool

Nota che tutte le API di zlib, eccetto quelle che sono esplicitamente sincrone, utilizzano il threadpool di libuv, il quale può avere implicazioni di prestazioni sorprendenti e negative per alcune applicazioni, vedi la documentazione [`UV_THREADPOOL_SIZE`][] per maggiori informazioni.

## Comprimere richieste HTTP e risposte

Il modulo `zlib` può essere utilizzato per implementare il supporto per i meccanismi di codifica dei contenuti `gzip` e `deflate` definiti da [HTTP](https://tools.ietf.org/html/rfc7230#section-4.2).

L'intestazione HTTP [`Accept-Encoding`][] viene utilizzata all'interno di una richiesta http per identificare le codifiche di compressione accettate dal client. L'intestazione [`Content-Encoding`][] viene utilizzata per identificare le codifiche di compressione effettivamente applicate a un messaggio.

*Note*: the examples given below are drastically simplified to show the basic concept. Using `zlib` encoding can be expensive, and the results ought to be cached. See [Memory Usage Tuning](#zlib_memory_usage_tuning) for more information on the speed/memory/compression tradeoffs involved in `zlib` usage.

```js
// esempio di richiesta del client 
const zlib = require('zlib');
const http = require('http');
const fs = require('fs');
const request = http.get({ host: 'example.com',
                           path: '/',
                           port: 80,
                           headers: { 'Accept-Encoding': 'gzip,deflate' } });
request.on('response', (response) => {
  const output = fs.createWriteStream('example.com_index.html');

  switch (response.headers['content-encoding']) {
    // o basta utilizzare zlib.createUnzip() per gestire entrambi i casi
    case 'gzip':
      response.pipe(zlib.createGunzip()).pipe(output);
      break;
    case 'deflate':
      response.pipe(zlib.createInflate()).pipe(output);
      break;
    default:
      response.pipe(output);
      break;
  }
});
```

```js
// esempio del server 
// Eseguire un'operazione gzip su ogni richiesta è abbastanza dispendioso.
// Sarebbe molto più efficiente memorizzare nella cache il buffer compresso.
const zlib = require('zlib');
const http = require('http');
const fs = require('fs');
http.createServer((request, response) => {
  const raw = fs.createReadStream('index.html');
  let acceptEncoding = request.headers['accept-encoding'];
  if (!acceptEncoding) {
    acceptEncoding = '';
  }

  // Nota: Questo non è un parser accept-encoding conforme.
  // Vedi https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
  if (/\bdeflate\b/.test(acceptEncoding)) {
    response.writeHead(200, { 'Content-Encoding': 'deflate' });
    raw.pipe(zlib.createDeflate()).pipe(response);
  } else if (/\bgzip\b/.test(acceptEncoding)) {
    response.writeHead(200, { 'Content-Encoding': 'gzip' });
    raw.pipe(zlib.createGzip()).pipe(response);
  } else {
    response.writeHead(200, {});
    raw.pipe(response);
  }
}).listen(1337);
```

Di default, i metodi `zlib` genereranno un errore quando decomprimono dati troncati. Tuttavia, se è noto che i dati sono incompleti o l'intenzione è di controllare solo l'inizio di un file compresso, è possibile eliminare la gestione predefinita degli errori modificando il metodo di eliminazione che viene utilizzato per decomprimere l'ultimo chunk di dati di input:

```js
// Questa è una versione troncata del buffer dagli esempi precedenti
const buffer = Buffer.from('eJzT0yMA', 'base64');

zlib.unzip(
  buffer,
  { finishFlush: zlib.constants.Z_SYNC_FLUSH },
  (err, buffer) => {
    if (!err) {
      console.log(buffer.toString());
    } else {
      // gestire l'errore
    }
  });
```

Questo non cambierà il comportamento in altre situazioni di generazione di errori, ad esempio quando i dati di input hanno un formato non valido. Utilizzando questo metodo, non sarà possibile determinare se l'input è terminato prematuramente o se manca dei controlli di integrità, rendendo necessario controllare manualmente che il risultato decompresso sia valido.

## Ottimizzazione dell'Utilizzo della Memoria

<!--type=misc-->

From `zlib/zconf.h`, modified to node.js's usage:

I requisiti di memoria per deflate sono (in byte):
```js
(1 << (windowBits + 2)) + (1 << (memLevel + 9))
```

Vale a dire: 128K per windowBits = 15 + 128K per memLevel = 8 (valori predefiniti) più qualche kilobyte per piccoli object.

Per esempio, per ridurre i requisiti di memoria predefiniti da 256K a 128K, le opzioni dovrebbero essere impostate su:

```js
const options = { windowBits: 14, memLevel: 7 };
```

Ciò, tuttavia, ridurrà la compressione in generale.

I requisiti di memoria per inflate sono (in byte) `1 << windowBits`. Vale a dire, 32K per windowBits = 15 (valore predefinito) più qualche kilobyte per piccoli object.

Questo è in aggiunta a un single internal output slab buffer di dimensione `chunkSize`, che di default è 16K.

La velocità della compressione `zlib` viene interessata radicalmente dall'impostazione `level`. Un livello superiore determinerà una migliore compressione, ma richiederà più tempo per finire. Un livello inferiore porterà ad una minore compressione, ma sarà molto più veloce.

In generale, maggiori opzioni di utilizzo della memoria indicheranno che Node.js deve effettuare meno chiamate a `zlib` poiché sarà in grado di elaborare più dati su ciascuna operazione `write`. Quindi, questo è un altro fattore che influisce sulla velocità, a discapito dell'utilizzo della memoria.

## Flushing

Chiamare [`.flush()`][] su uno stream di compressione farà sì che `zlib` restituisca la maggior quantità di output possibile attualmente. Questo può avvenire a discapito della qualità della compressione degradata, ma può essere utile quando i dati necessitano di essere disponibili il prima possibile.

Nel seguente esempio, `flush()` è utilizzato per scrivere una parziale risposta HTTP compressa al client:
```js
const zlib = require('zlib');
const http = require('http');

http.createServer((request, response) => {
  // Per semplicità, i controlli Accept-Encoding vengono omessi.
  response.writeHead(200, { 'content-encoding': 'gzip' });
  const output = zlib.createGzip();
  output.pipe(response);

  setInterval(() => {
    output.write(`The current time is ${Date()}\n`, () => {
      // I dati sono stati passati a zlib, ma l'algoritmo di compressione può
      // aver deciso di bufferizzare i dati per una compressione più efficiente.
      // Chiamare .flush() renderà disponibili i dati non appena il client
      // è pronto a riceverli.
      output.flush();
    });
  }, 1000);
}).listen(1337);
```

## Costanti<!-- YAML
added: v0.5.8
--><!--type=misc-->Tutte le costanti definite in `zlib.h` sono inoltre definite su `require('zlib').constants`. Nel normale corso delle operazioni, non sarà necessario utilizzare queste costanti. Sono documentate in modo che la loro presenza non sia inaspettata. Questa sezione viene presa quasi direttamente dalla [documentazione di zlib](https://zlib.net/manual.html#Constants). Vedi <https://zlib.net/manual.html#Constants> per ulteriori dettagli.

*Note*: Previously, the constants were available directly from `require('zlib')`, for instance `zlib.Z_NO_FLUSH`. Accessing the constants directly from the module is currently still possible but should be considered deprecated.

Valori di eliminazione consentiti.

* `zlib.constants.Z_NO_FLUSH`
* `zlib.constants.Z_PARTIAL_FLUSH`
* `zlib.constants.Z_SYNC_FLUSH`
* `zlib.constants.Z_FULL_FLUSH`
* `zlib.constants.Z_FINISH`
* `zlib.constants.Z_BLOCK`
* `zlib.constants.Z_TREES`

Codici di ritorno per le funzioni di compressione/decompressione. I valori negativi sono errori, i valori positivi vengono utilizzati per eventi speciali ma normali.

* `zlib.constants.Z_OK`
* `zlib.constants.Z_STREAM_END`
* `zlib.constants.Z_NEED_DICT`
* `zlib.constants.Z_ERRNO`
* `zlib.constants.Z_STREAM_ERROR`
* `zlib.constants.Z_DATA_ERROR`
* `zlib.constants.Z_MEM_ERROR`
* `zlib.constants.Z_BUF_ERROR`
* `zlib.constants.Z_VERSION_ERROR`

Livelli di compressione.

* `zlib.constants.Z_NO_COMPRESSION`
* `zlib.constants.Z_BEST_SPEED`
* `zlib.constants.Z_BEST_COMPRESSION`
* `zlib.constants.Z_DEFAULT_COMPRESSION`

Strategia di compressione.

* `zlib.constants.Z_FILTERED`
* `zlib.constants.Z_HUFFMAN_ONLY`
* `zlib.constants.Z_RLE`
* `zlib.constants.Z_FIXED`
* `zlib.constants.Z_DEFAULT_STRATEGY`

## Class Options<!-- YAML
added: v0.11.1
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `dictionary` option can be an Uint8Array now.
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/6069
    description: The `finishFlush` option is supported now.
--><!--type=misc-->Ciascuna classe accetta un `options` object. Tutte le opzioni sono facoltative.

Nota che alcune opzioni sono rilevanti esclusivamente quando vengono compresse e sono ignorate dalle classi di decompressione.

* `flush` {integer} **Default:** `zlib.constants.Z_NO_FLUSH`
* `finishFlush` {integer} **Default:** `zlib.constants.Z_FINISH`
* `chunkSize` {integer} **Default:** `16 * 1024`
* `windowBits` {integer}
* `level` {integer} (solo compressione)
* `memLevel` {integer} (solo compressione)
* `strategy` {integer} (solo compressione)
* `dictionary` {Buffer|TypedArray|DataView} (deflate/inflate only, empty dictionary by default)
* `info` {boolean} (Se `true`, restituisce un object con `buffer` e `engine`)

Vedi la descrizione di `deflateInit2` e `inflateInit2` su <https://zlib.net/manual.html#Advanced> per ulteriori informazioni su di essi.

## Class: zlib.Deflate<!-- YAML
added: v0.5.8
-->Comprimere i dati usando deflate.

## Class: zlib.DeflateRaw
<!-- YAML
added: v0.5.8
-->

Comprimere i dati usando deflate e non aggiungere un'intestazione `zlib`.

## Class: zlib.Gunzip<!-- YAML
added: v0.5.8
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5883
    description: Trailing garbage at the end of the input stream will now
                 result in an `error` event.
  - version: v5.9.0
    pr-url: https://github.com/nodejs/node/pull/5120
    description: Multiple concatenated gzip file members are supported now.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `error` event.
-->Decomprimere un gzip stream.

## Class: zlib.Gzip<!-- YAML
added: v0.5.8
-->Comprimere i dati usando gzip.

## Class: zlib.Inflate<!-- YAML
added: v0.5.8
changes:
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `error` event.
-->Decomprimere un deflate stream.

## Class: zlib.InflateRaw<!-- YAML
added: v0.5.8
changes:
  - version: v6.8.0
    pr-url: https://github.com/nodejs/node/pull/8512
    description: Custom dictionaries are now supported by `InflateRaw`.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `error` event.
-->Decomprimere un raw deflate stream.

## Class: zlib.Unzip<!-- YAML
added: v0.5.8
-->Decomprimere uno stream compresso con Gzip o Deflate con il rilevamento automatico dell'intestazione.

## Class: zlib.Zlib
<!-- YAML
added: v0.5.8
-->

Non esportato dal modulo `zlib`. È documentato qui perché è la classe di base delle classi compressore/decompressore.

### zlib.bytesRead<!-- YAML
added: v8.1.0
-->* {number}

The `zlib.bytesRead` property specifies the number of bytes read by the engine before the bytes are processed (compressed or decompressed, as appropriate for the derived class).

### zlib.close([callback])<!-- YAML
added: v0.9.4
-->Chiudere l'handle sottostante.

### zlib.flush([kind], callback)<!-- YAML
added: v0.5.8
-->* `kind` **Default:** `zlib.constants.Z_FULL_FLUSH`

Eliminare i dati in sospeso. Non considerarlo con superficialità, le eliminazioni premature influiscono negativamente sull'efficacia dell'algoritmo di compressione.

Considerando ciò, si eliminano esclusivamente i dati dallo stato interno `zlib` e non viene eseguito nessun tipo di eliminazione sui livelli di stream. Piuttosto, si comporta come una normale chiamata a `.write()`, ovvero verrà accodata dietro altre scritture in sospeso e produrrà esclusivamente output quando i dati vengono letti dallo stream.

### zlib.params(level, strategy, callback)<!-- YAML
added: v0.11.4
-->Aggiornare dinamicamente il livello di compressione e la strategia di compressione. Applicabile esclusivamente all'algoritmo deflate.

### zlib.reset()<!-- YAML
added: v0.7.0
-->Reimpostare il compressore/decompressore sulle impostazioni di fabbrica. Applicabile esclusivamente agli algoritmi inflate e deflate.

## zlib.constants<!-- YAML
added: v7.0.0
-->Fornisce un object che enumera le costanti correlate a Zlib.

## zlib.createDeflate([options](#zlib_class_options))<!-- YAML
added: v0.5.8
-->Creates and returns a new [Deflate](#zlib_class_zlib_deflate) object with the given [options](#zlib_class_options).

## zlib.createDeflateRaw([options](#zlib_class_options))
<!-- YAML
added: v0.5.8
-->

Creates and returns a new [DeflateRaw](#zlib_class_zlib_deflateraw) object with the given [options](#zlib_class_options).

*Note*: An upgrade of zlib from 1.2.8 to 1.2.11 changed behavior when windowBits is set to 8 for raw deflate streams. zlib imposterebbe automaticamente windowBits su 9 se fosse inizialmente impostato su 8. Le versioni più recenti di zlib genereranno un'eccezione, così che Node.js ripristini il comportamento originale dell'aggiornamento di un valore da 8 a 9, dal momento che passando `windowBits = 9` a zlib risulta effettivamente in uno stream compresso che utilizza solamente una finestra a 8 bit in maniera efficace.

## zlib.createGunzip([options](#zlib_class_options))
<!-- YAML
added: v0.5.8
-->

Creates and returns a new [Gunzip](#zlib_class_zlib_gunzip) object with the given [options](#zlib_class_options).

## zlib.createGzip([options](#zlib_class_options))
<!-- YAML
added: v0.5.8
-->

Creates and returns a new [Gzip](#zlib_class_zlib_gzip) object with the given [options](#zlib_class_options).

## zlib.createInflate([options](#zlib_class_options))
<!-- YAML
added: v0.5.8
-->

Creates and returns a new [Inflate](#zlib_class_zlib_inflate) object with the given [options](#zlib_class_options).

## zlib.createInflateRaw([options](#zlib_class_options))
<!-- YAML
added: v0.5.8
-->

Creates and returns a new [InflateRaw](#zlib_class_zlib_inflateraw) object with the given [options](#zlib_class_options).

## zlib.createUnzip([options](#zlib_class_options))
<!-- YAML
added: v0.5.8
-->

Creates and returns a new [Unzip](#zlib_class_zlib_unzip) object with the given [options](#zlib_class_options).

## Metodi di Convenienza<!--type=misc-->All of these take a [`Buffer`][], [`TypedArray`][], [`DataView`][], or string as the first argument, an optional second argument to supply options to the `zlib` classes and will call the supplied callback with `callback(error, result)`.

Ogni metodo ha una controparte `*Sync` che accetta gli stessi argomenti, ma senza un callback.

### zlib.deflate(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->### zlib.deflateSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->- `buffer` {Buffer|TypedArray|DataView|string}

Compress a chunk of data with [Deflate](#zlib_class_zlib_deflate).

### zlib.deflateRaw(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->### zlib.deflateRawSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->- `buffer` {Buffer|TypedArray|DataView|string}

Compress a chunk of data with [DeflateRaw](#zlib_class_zlib_deflateraw).

### zlib.gunzip(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->### zlib.gunzipSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->- `buffer` {Buffer|TypedArray|DataView|string}

Decompress a chunk of data with [Gunzip](#zlib_class_zlib_gunzip).

### zlib.gzip(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->### zlib.gzipSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->- `buffer` {Buffer|TypedArray|DataView|string}

Compress a chunk of data with [Gzip](#zlib_class_zlib_gzip).

### zlib.inflate(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->### zlib.inflateSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->- `buffer` {Buffer|TypedArray|DataView|string}

Decompress a chunk of data with [Inflate](#zlib_class_zlib_inflate).

### zlib.inflateRaw(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->### zlib.inflateRawSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->- `buffer` {Buffer|TypedArray|DataView|string}

Decompress a chunk of data with [InflateRaw](#zlib_class_zlib_inflateraw).

### zlib.unzip(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->### zlib.unzipSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->- `buffer` {Buffer|TypedArray|DataView|string}

Decompress a chunk of data with [Unzip](#zlib_class_zlib_unzip).
