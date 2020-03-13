# Zlib

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

The `zlib` module provides compression functionality implemented using Gzip and Deflate/Inflate, as well as Brotli. Ci si può accedere utilizzando:

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

Note that all zlib APIs except those that are explicitly synchronous use libuv's threadpool. This can lead to surprising effects in some applications, such as subpar performance (which can be mitigated by adjusting the [pool size](cli.html#cli_uv_threadpool_size_size)) and/or unrecoverable and catastrophic memory fragmentation.

## Comprimere richieste HTTP e risposte

The `zlib` module can be used to implement support for the `gzip`, `deflate` and `br` content-encoding mechanisms defined by [HTTP](https://tools.ietf.org/html/rfc7230#section-4.2).

L'intestazione HTTP [`Accept-Encoding`][] viene utilizzata all'interno di una richiesta http per identificare le codifiche di compressione accettate dal client. L'intestazione [`Content-Encoding`][] viene utilizzata per identificare le codifiche di compressione effettivamente applicate a un messaggio.

Gli esempi riportati di seguito sono drasticamente semplificati per mostrare il concetto di base. Utilizzare la codifica `zlib` può essere dispendioso e i risultati dovrebbero essere memorizzati nella cache. Vedi l'[Ottimizzazione dell'Uso della Memoria](#zlib_memory_usage_tuning) per maggiori informazioni sui tradeoff di velocità/memoria/compressione coinvolti nell'utilizzo di `zlib`.

```js
// client request example
const zlib = require('zlib');
const http = require('http');
const fs = require('fs');
const request = http.get({ host: 'example.com',
                           path: '/',
                           port: 80,
                           headers: { 'Accept-Encoding': 'br,gzip,deflate' } });
request.on('response', (response) => {
  const output = fs.createWriteStream('example.com_index.html');

  switch (response.headers['content-encoding']) {
    case 'br':
      response.pipe(zlib.createBrotliDecompress()).pipe(output);
      break;
    // Or, just use zlib.createUnzip() to handle both of the following cases:
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
  // See https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
  if (/\bdeflate\b/.test(acceptEncoding)) {
    response.writeHead(200, { 'Content-Encoding': 'deflate' });
    raw.pipe(zlib.createDeflate()).pipe(response);
  } else if (/\bgzip\b/.test(acceptEncoding)) {
    response.writeHead(200, { 'Content-Encoding': 'gzip' });
    raw.pipe(zlib.createGzip()).pipe(response);
  } else if (/\bbr\b/.test(acceptEncoding)) {
    response.writeHead(200, { 'Content-Encoding': 'br' });
    raw.pipe(zlib.createBrotliCompress()).pipe(response);
  } else {
    response.writeHead(200, {});
    raw.pipe(response);
  }
}).listen(1337);
```

Di default, i metodi `zlib` genereranno un errore quando decomprimono dati troncati. Tuttavia, se è noto che i dati sono incompleti o l'intenzione è di controllare solo l'inizio di un file compresso, è possibile eliminare la gestione predefinita degli errori modificando il metodo di eliminazione che viene utilizzato per decomprimere l'ultimo chunk di dati di input:

```js
// This is a truncated version of the buffer from the above examples
const buffer = Buffer.from('eJzT0yMA', 'base64');

zlib.unzip(
  buffer,
  // For Brotli, the equivalent is zlib.constants.BROTLI_OPERATION_FLUSH.
  { finishFlush: zlib.constants.Z_SYNC_FLUSH },
  (err, buffer) => {
    if (!err) {
      console.log(buffer.toString());
    } else {
      // handle error
    }
  });
```

Questo non cambierà il comportamento in altre situazioni di generazione di errori, ad esempio quando i dati di input hanno un formato non valido. Utilizzando questo metodo, non sarà possibile determinare se l'input è terminato prematuramente o se manca dei controlli di integrità, rendendo necessario controllare manualmente che il risultato decompresso sia valido.

## Ottimizzazione dell'Utilizzo della Memoria

<!--type=misc-->

### For zlib-based streams

Da `zlib/zconf.h`, modificato per l'utilizzo di Node.js:

I requisiti di memoria per deflate sono (in byte):
```js
(1 << (windowBits + 2)) + (1 << (memLevel + 9))
```

Vale a dire: 128K per `windowBits` = 15 + 128K per `memLevel` = 8 (valori predefiniti) più qualche kilobyte per piccoli object.

Per esempio, per ridurre i requisiti di memoria predefiniti da 256K a 128K, le opzioni dovrebbero essere impostate su:

```js
const options = { windowBits: 14, memLevel: 7 };
```

Ciò, tuttavia, ridurrà la compressione in generale.

I requisiti di memoria per inflate sono (in byte) `1 << windowBits`. Vale a dire, 32K per `windowBits` = 15 (valore predefinito) più qualche kilobyte per piccoli object.

Questo è in aggiunta a un single internal output slab buffer di dimensione `chunkSize`, che di default è 16K.

La velocità della compressione `zlib` viene interessata radicalmente dall'impostazione `level`. Un livello superiore determinerà una migliore compressione, ma richiederà più tempo per finire. Un livello inferiore porterà ad una minore compressione, ma sarà molto più veloce.

In generale, maggiori opzioni di utilizzo della memoria indicheranno che Node.js deve effettuare meno chiamate a `zlib` poiché sarà in grado di elaborare più dati su ciascuna operazione `write`. Quindi, questo è un altro fattore che influisce sulla velocità, a discapito dell'utilizzo della memoria.

### For Brotli-based streams

There are equivalents to the zlib options for Brotli-based streams, although these options have different ranges than the zlib ones:

- zlib’s `level` option matches Brotli’s `BROTLI_PARAM_QUALITY` option.
- zlib’s `windowBits` option matches Brotli’s `BROTLI_PARAM_LGWIN` option.

See [below](#zlib_brotli_constants) for more details on Brotli-specific options.

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
--><!--type=misc-->### zlib constants

Tutte le costanti definite in `zlib.h` sono inoltre definite su `require('zlib').constants`. Nel normale corso delle operazioni, non sarà necessario utilizzare queste costanti. Sono documentate in modo che la loro presenza non sia inaspettata. Questa sezione viene presa quasi direttamente dalla [documentazione di zlib](https://zlib.net/manual.html#Constants). Vedi <https://zlib.net/manual.html#Constants> per ulteriori dettagli.

Previously, the constants were available directly from `require('zlib')`, for instance `zlib.Z_NO_FLUSH`. Accessing the constants directly from the module is currently still possible but is deprecated.

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

### Brotli constants<!-- YAML
added: v10.16.0
-->There are several options and other constants available for Brotli-based streams:

#### Flush operations

The following values are valid flush operations for Brotli-based streams:

* `zlib.constants.BROTLI_OPERATION_PROCESS` (default for all operations)
* `zlib.constants.BROTLI_OPERATION_FLUSH` (default when calling `.flush()`)
* `zlib.constants.BROTLI_OPERATION_FINISH` (default for the last chunk)
* `zlib.constants.BROTLI_OPERATION_EMIT_METADATA`
  * This particular operation may be hard to use in a Node.js context, as the streaming layer makes it hard to know which data will end up in this frame. Also, there is currently no way to consume this data through the Node.js API.

#### Compressor options

There are several options that can be set on Brotli encoders, affecting compression efficiency and speed. Both the keys and the values can be accessed as properties of the `zlib.constants` object.

The most important options are:

* `BROTLI_PARAM_MODE`
  * `BROTLI_MODE_GENERIC` (default)
  * `BROTLI_MODE_TEXT`, adjusted for UTF-8 text
  * `BROTLI_MODE_FONT`, adjusted for WOFF 2.0 fonts
* `BROTLI_PARAM_QUALITY`
  * Ranges from `BROTLI_MIN_QUALITY` to `BROTLI_MAX_QUALITY`, with a default of `BROTLI_DEFAULT_QUALITY`.
* `BROTLI_PARAM_SIZE_HINT`
  * Integer value representing the expected input size; defaults to `0` for an unknown input size.

The following flags can be set for advanced control over the compression algorithm and memory usage tuning:

* `BROTLI_PARAM_LGWIN`
  * Ranges from `BROTLI_MIN_WINDOW_BITS` to `BROTLI_MAX_WINDOW_BITS`, with a default of `BROTLI_DEFAULT_WINDOW`, or up to `BROTLI_LARGE_MAX_WINDOW_BITS` if the `BROTLI_PARAM_LARGE_WINDOW` flag is set.
* `BROTLI_PARAM_LGBLOCK`
  * Ranges from `BROTLI_MIN_INPUT_BLOCK_BITS` to `BROTLI_MAX_INPUT_BLOCK_BITS`.
* `BROTLI_PARAM_DISABLE_LITERAL_CONTEXT_MODELING`
  * Boolean flag that decreases compression ratio in favour of decompression speed.
* `BROTLI_PARAM_LARGE_WINDOW`
  * Boolean flag enabling “Large Window Brotli” mode (not compatible with the Brotli format as standardized in [RFC 7932](https://www.rfc-editor.org/rfc/rfc7932.txt)).
* `BROTLI_PARAM_NPOSTFIX`
  * Ranges from `0` to `BROTLI_MAX_NPOSTFIX`.
* `BROTLI_PARAM_NDIRECT`
  * Ranges from `0` to `15 << NPOSTFIX` in steps of `1 << NPOSTFIX`.

#### Decompressor options

These advanced options are available for controlling decompression:

* `BROTLI_DECODER_PARAM_DISABLE_RING_BUFFER_REALLOCATION`
  * Boolean flag that affects internal memory allocation patterns.
* `BROTLI_DECODER_PARAM_LARGE_WINDOW`
  * Boolean flag enabling “Large Window Brotli” mode (not compatible with the Brotli format as standardized in [RFC 7932](https://www.rfc-editor.org/rfc/rfc7932.txt)).

## Class: Options<!-- YAML
added: v0.11.1
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `dictionary` option can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `dictionary` option can be an `Uint8Array` now.
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/6069
    description: The `finishFlush` option is supported now.
--><!--type=misc-->Each zlib-based class takes an `options` object. Tutte le opzioni sono facoltative.

Nota che alcune opzioni sono rilevanti esclusivamente quando vengono compresse e sono ignorate dalle classi di decompressione.

* `flush` {integer} **Default:** `zlib.constants.Z_NO_FLUSH`
* `finishFlush` {integer} **Default:** `zlib.constants.Z_FINISH`
* `chunkSize` {integer} **Default:** `16 * 1024`
* `windowBits` {integer}
* `level` {integer} (solo compressione)
* `memLevel` {integer} (solo compressione)
* `strategy` {integer} (solo compressione)
* `dictionary` {Buffer|TypedArray|DataView|ArrayBuffer} (deflate/inflate only, empty dictionary by default)
* `info` {boolean} (If `true`, returns an object with `buffer` and `engine`.)

Vedi la descrizione di `deflateInit2` e `inflateInit2` su <https://zlib.net/manual.html#Advanced> per ulteriori informazioni su di essi.

## Class: BrotliOptions<!-- YAML
added: v10.16.0
--><!--type=misc-->Each Brotli-based class takes an `options` object. Tutte le opzioni sono facoltative.

* `flush` {integer} **Default:** `zlib.constants.BROTLI_OPERATION_PROCESS`
* `finishFlush` {integer} **Default:** `zlib.constants.BROTLI_OPERATION_FINISH`
* `chunkSize` {integer} **Default:** `16 * 1024`
* `params` {Object} Key-value object containing indexed [Brotli parameters](#zlib_brotli_constants).

Per esempio:

```js
const stream = zlib.createBrotliCompress({
  chunkSize: 32 * 1024,
  params: {
    [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
    [zlib.constants.BROTLI_PARAM_QUALITY]: 4,
    [zlib.constants.BROTLI_PARAM_SIZE_HINT]: fs.statSync(inputFile).size
  }
});
```

## Class: zlib.BrotliCompress<!-- YAML
added: v10.16.0
-->Compress data using the Brotli algorithm.

## Class: zlib.BrotliDecompress
<!-- YAML
added: v10.16.0
-->

Decompress data using the Brotli algorithm.

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
                 result in an `'error'` event.
  - version: v5.9.0
    pr-url: https://github.com/nodejs/node/pull/5120
    description: Multiple concatenated gzip file members are supported now.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `'error'` event.
-->Decomprimere un gzip stream.

## Class: zlib.Gzip<!-- YAML
added: v0.5.8
-->Comprimere i dati usando gzip.

## Class: zlib.Inflate<!-- YAML
added: v0.5.8
changes:
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `'error'` event.
-->Decomprimere un deflate stream.

## Class: zlib.InflateRaw<!-- YAML
added: v0.5.8
changes:
  - version: v6.8.0
    pr-url: https://github.com/nodejs/node/pull/8512
    description: Custom dictionaries are now supported by `InflateRaw`.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `'error'` event.
-->Decomprimere un raw deflate stream.

## Class: zlib.Unzip<!-- YAML
added: v0.5.8
-->Decomprimere uno stream compresso con Gzip o Deflate con il rilevamento automatico dell'intestazione.

## Class: zlib.ZlibBase<!-- YAML
added: v0.5.8
changes:
  - version: v10.16.0
    pr-url: https://github.com/nodejs/node/pull/24939
    description: This class was renamed from `Zlib` to `ZlibBase`.
-->Non esportato dal modulo `zlib`. È documentato qui perché è la classe di base delle classi compressore/decompressore.

This class inherits from [`stream.Transform`][], allowing `zlib` objects to be used in pipes and similar stream operations.

### zlib.bytesRead<!-- YAML
added: v8.1.0
deprecated: v10.0.0
-->> Stabilità: 0 - Deprecato: Utilizza [`zlib.bytesWritten`][] al suo posto.

* {number}

Deprecated alias for [`zlib.bytesWritten`][]. This original name was chosen because it also made sense to interpret the value as the number of bytes read by the engine, but is inconsistent with other streams in Node.js that expose values under these names.

### zlib.bytesWritten<!-- YAML
added: v10.0.0
-->* {number}

The `zlib.bytesWritten` property specifies the number of bytes written to the engine, before the bytes are processed (compressed or decompressed, as appropriate for the derived class).

### zlib.close([callback])<!-- YAML
added: v0.9.4
-->* `callback` {Function}

Chiudere l'handle sottostante.

### zlib.flush([kind, ]callback)<!-- YAML
added: v0.5.8
-->* `kind` **Default:** `zlib.constants.Z_FULL_FLUSH` for zlib-based streams, `zlib.constants.BROTLI_OPERATION_FLUSH` for Brotli-based streams.
* `callback` {Function}

Eliminare i dati in sospeso. Non considerarlo con superficialità, le eliminazioni premature influiscono negativamente sull'efficacia dell'algoritmo di compressione.

Considerando ciò, si eliminano esclusivamente i dati dallo stato interno `zlib` e non viene eseguito nessun tipo di eliminazione sui livelli di stream. Piuttosto, si comporta come una normale chiamata a `.write()`, ovvero verrà accodata dietro altre scritture in sospeso e produrrà esclusivamente output quando i dati vengono letti dallo stream.

### zlib.params(level, strategy, callback)<!-- YAML
added: v0.11.4
-->* `level` {integer}
* `strategy` {integer}
* `callback` {Function}

This function is only available for zlib-based streams, i.e. not Brotli.

Aggiornare dinamicamente il livello di compressione e la strategia di compressione. Applicabile esclusivamente all'algoritmo deflate.

### zlib.reset()<!-- YAML
added: v0.7.0
-->Reimpostare il compressore/decompressore sulle impostazioni di fabbrica. Applicabile esclusivamente agli algoritmi inflate e deflate.

## zlib.constants<!-- YAML
added: v7.0.0
-->Fornisce un object che enumera le costanti correlate a Zlib.

## zlib.createBrotliCompress([options])<!-- YAML
added: v10.16.0
-->* `options` {brotli options}

Creates and returns a new [`BrotliCompress`][] object.

## zlib.createBrotliDecompress([options])
<!-- YAML
added: v10.16.0
-->

* `options` {brotli options}

Creates and returns a new [`BrotliDecompress`][] object.

## zlib.createDeflate([options])<!-- YAML
added: v0.5.8
-->* `options` {Object}

Creates and returns a new [`Deflate`][] object.

## zlib.createDeflateRaw([options])
<!-- YAML
added: v0.5.8
-->

* `options` {Object}

Creates and returns a new [`DeflateRaw`][] object.

An upgrade of zlib from 1.2.8 to 1.2.11 changed behavior when `windowBits` is set to 8 for raw deflate streams. zlib would automatically set `windowBits` to 9 if was initially set to 8. Le versioni più recenti di zlib genereranno un'eccezione, così che Node.js ripristini il comportamento originale dell'aggiornamento di un valore da 8 a 9, dal momento che passando `windowBits = 9` a zlib risulta effettivamente in uno stream compresso che utilizza solamente una finestra a 8 bit in maniera efficace.

## zlib.createGunzip([options])
<!-- YAML
added: v0.5.8
-->

* `options` {Object}

Creates and returns a new [`Gunzip`][] object.

## zlib.createGzip([options])
<!-- YAML
added: v0.5.8
-->

* `options` {Object}

Creates and returns a new [`Gzip`][] object.

## zlib.createInflate([options])
<!-- YAML
added: v0.5.8
-->

* `options` {Object}

Creates and returns a new [`Inflate`][] object.

## zlib.createInflateRaw([options])
<!-- YAML
added: v0.5.8
-->

* `options` {Object}

Creates and returns a new [`InflateRaw`][] object.

## zlib.createUnzip([options])
<!-- YAML
added: v0.5.8
-->

* `options` {Object}

Creates and returns a new [`Unzip`][] object.

## Metodi di Convenienza<!--type=misc-->All of these take a [`Buffer`][], [`TypedArray`][], [`DataView`][], [`ArrayBuffer`][] or string as the first argument, an optional second argument to supply options to the `zlib` classes and will call the supplied callback with `callback(error, result)`.

Ogni metodo ha una controparte `*Sync` che accetta gli stessi argomenti, ma senza un callback.

### zlib.brotliCompress(buffer[, options], callback)<!-- YAML
added: v10.16.0
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {brotli options}
* `callback` {Function}

### zlib.brotliCompressSync(buffer[, options])
<!-- YAML
added: v10.16.0
-->
* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {brotli options}

Compress a chunk of data with [`BrotliCompress`][].

### zlib.brotliDecompress(buffer[, options], callback)
<!-- YAML
added: v10.16.0
-->
* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {brotli options}
* `callback` {Function}

### zlib.brotliDecompressSync(buffer[, options])
<!-- YAML
added: v10.16.0
-->
* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {brotli options}

Decompress a chunk of data with [`BrotliDecompress`][].

### zlib.deflate(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}
* `callback` {Function}

### zlib.deflateSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}

Compress a chunk of data with [`Deflate`][].

### zlib.deflateRaw(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}
* `callback` {Function}

### zlib.deflateRawSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}

Compress a chunk of data with [`DeflateRaw`][].

### zlib.gunzip(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}
* `callback` {Function}

### zlib.gunzipSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}

Decompress a chunk of data with [`Gunzip`][].

### zlib.gzip(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}
* `callback` {Function}

### zlib.gzipSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}

Compress a chunk of data with [`Gzip`][].

### zlib.inflate(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}
* `callback` {Function}

### zlib.inflateSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}

Decompress a chunk of data with [`Inflate`][].

### zlib.inflateRaw(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}
* `callback` {Function}

### zlib.inflateRawSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}

Decompress a chunk of data with [`InflateRaw`][].

### zlib.unzip(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}
* `callback` {Function}

### zlib.unzipSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}

Decompress a chunk of data with [`Unzip`][].
