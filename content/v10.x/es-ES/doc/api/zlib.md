# Zlib

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

El modulo `zlib` provee funcionalidad de compresión implementada utilizando Gzip y Deflate/Inflate. Puede ser accedido utilizando:

```js
const zlib = require('zlib');
```

Comprimir o descomprimir un stream (como un archivo) se puede lograr mediante el piping de los datos del stream original a través de un stream de `zlib` hacia un stream de destino:

```js
const gzip = zlib.createGzip();
const fs = require('fs');
const inp = fs.createReadStream('input.txt');
const out = fs.createWriteStream('input.txt.gz');

inp.pipe(gzip).pipe(out);
```

También es posible comprimir o descomprimir datos en un solo paso:

```js
const input = '.................................';
zlib.deflate(input, (err, buffer) => {
  if (!err) {
    console.log(buffer.toString('base64'));
  } else {
    // manejar el error
  }
});

const buffer = Buffer.from('eJzT0yMAAGTvBe8=', 'base64');
zlib.unzip(buffer, (err, buffer) => {
  if (!err) {
    console.log(buffer.toString());
  } else {
    // manejar el error
  }
});
```

## Uso de Threadpool

Notese que todas las API de zlib excepto aquellas que son explícitamente sincrónicas utilizan el threadpool de libuv, lo que puede tener efectos inesperados y negativos en el rendimiento de algunas aplicaciones. Para mas información, ver la documentación de [`UV_THREADPOOL_SIZE`][].

## Comprimiendo peticiones y respuestas HTTP

El módulo `zlib` puede ser utilizado para implementar soporte para los mecanismos de codificación de contenido `gzip` y `deflate`, definidos por [HTTP](https://tools.ietf.org/html/rfc7230#section-4.2).

El encabezado HTTP [`Accept-Encoding`][] se usa en el contexto de una petición HTTP para identificar los cifrados de compresión aceptados por el cliente. El encabezado [`Content-Encoding`][] se utiliza para identificar los cifrados de compresión actualmente aplicados a un mensaje.

Los ejemplos listados abajo están drásticamente simplificados para mostrar el concepto básico. Utilizar codificación basada en `zlib` puede resultar costosa y los resultados deberían ser almacenados en memoria. Ver [Ajustes en el Uso de Memoria](#zlib_memory_usage_tuning) para obtener más información sobre la eficiencia en velocidad/memoria/compresión involucrada en el uso de `zlib`.

```js
// ejemplo de petición del cliente
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
    // o, simplemente usar zlib.createUnzip() para manejar ambos casos
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
// ejemplo de servidor
// Ejecutar una operacion gzip en cada petición es bastante costoso.
// Sería mucho mas eficiente almacenar en memoria el buffer comprimido.
const zlib = require('zlib');
const http = require('http');
const fs = require('fs');
http.createServer((request, response) => {
  const raw = fs.createReadStream('index.html');
  let acceptEncoding = request.headers['accept-encoding'];
  if (!acceptEncoding) {
    acceptEncoding = '';
  }

  // Note: This is not a conformant accept-encoding parser.
  // See https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
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

Por defecto, los métodos de `zlib` van a arrojar un error cuando se intente descomprimir data truncada. De cualquier manera, si es sabido que la data esta incompleta, o se desea inspeccionar solo el principio de un archivo comprimido, es posible suprimir el manejo de error predeterminado cambiando el método que se utiliza para descomprimir el ultimo fragmento de data ingresada:

```js
// This is a truncated version of the buffer from the above examples
const buffer = Buffer.from('eJzT0yMA', 'base64');

zlib.unzip(
  buffer,
  { finishFlush: zlib.constants.Z_SYNC_FLUSH },
  (err, buffer) => {
    if (!err) {
      console.log(buffer.toString());
    } else {
      // handle error
    }
  });
```

Esto no cambiará el comportamiento en otras situaciones que arrojen errores, ej. cuando la data ingresada tiene un formato inválido. Usando este método, no sera posible determinar si el ingreso de datos terminó prematuramente o si no posee validaciones de integridad, volviendo necesario que se verifique manualmente que el resultado de la descompresión es válido.

## Ajustes en el uso de Memoria

<!--type=misc-->

Fuente `zlib/zconf.h`, modificado para su uso en Node.js:

Los requerimientos de memoria para deflate son (en bytes):

<!-- eslint-disable semi -->

```js
(1 << (windowBits + 2)) + (1 << (memLevel + 9))
```

Esto es: 128K para `windowBits` = 15 + 128K para `memLevel` = 8 (valores por defecto) mas un par de kilobytes para objetos pequeños.

Por ejemplo, para reducir los requerimientos predeterminados de memoria de 256K a 128K, las opciones deberían ser configuradas de la siguiente manera:

```js
const options = { windowBits: 14, memLevel: 7 };
```

Esto, sin embargo, generalmente degradara la compresión.

Los requerimientos de memoria para inflate son (en bytes) `1 << windowBits`. Esto es, 32K para `windowBits` = 15 (valor por defecto) más un par de kilobytes para objetos pequeños.

This is in addition to a single internal output slab buffer of size `chunkSize`, which defaults to 16K.

The speed of `zlib` compression is affected most dramatically by the `level` setting. A higher level will result in better compression, but will take longer to complete. A lower level will result in less compression, but will be much faster.

In general, greater memory usage options will mean that Node.js has to make fewer calls to `zlib` because it will be able to process more data on each `write` operation. So, this is another factor that affects the speed, at the cost of memory usage.

## Flushing

Calling [`.flush()`][] on a compression stream will make `zlib` return as much output as currently possible. This may come at the cost of degraded compression quality, but can be useful when data needs to be available as soon as possible.

In the following example, `flush()` is used to write a compressed partial HTTP response to the client:

```js
const zlib = require('zlib');
const http = require('http');

http.createServer((request, response) => {
  // For the sake of simplicity, the Accept-Encoding checks are omitted.
  response.writeHead(200, { 'content-encoding': 'gzip' });
  const output = zlib.createGzip();
  output.pipe(response);

  setInterval(() => {
    output.write(`The current time is ${Date()}\n`, () => {
      // The data has been passed to zlib, but the compression algorithm may
      // have decided to buffer the data for more efficient compression.
      // Calling .flush() will make the data available as soon as the client
      // is ready to receive it.
      output.flush();
    });
  }, 1000);
}).listen(1337);
```

## Constants

<!-- YAML
added: v0.5.8
-->

<!--type=misc-->

All of the constants defined in `zlib.h` are also defined on `require('zlib').constants`. In the normal course of operations, it will not be necessary to use these constants. They are documented so that their presence is not surprising. This section is taken almost directly from the [zlib documentation](https://zlib.net/manual.html#Constants). See <https://zlib.net/manual.html#Constants> for more details.

Previously, the constants were available directly from `require('zlib')`, for instance `zlib.Z_NO_FLUSH`. Accessing the constants directly from the module is currently still possible but is deprecated.

Allowed flush values.

- `zlib.constants.Z_NO_FLUSH`
- `zlib.constants.Z_PARTIAL_FLUSH`
- `zlib.constants.Z_SYNC_FLUSH`
- `zlib.constants.Z_FULL_FLUSH`
- `zlib.constants.Z_FINISH`
- `zlib.constants.Z_BLOCK`
- `zlib.constants.Z_TREES`

Return codes for the compression/decompression functions. Negative values are errors, positive values are used for special but normal events.

- `zlib.constants.Z_OK`
- `zlib.constants.Z_STREAM_END`
- `zlib.constants.Z_NEED_DICT`
- `zlib.constants.Z_ERRNO`
- `zlib.constants.Z_STREAM_ERROR`
- `zlib.constants.Z_DATA_ERROR`
- `zlib.constants.Z_MEM_ERROR`
- `zlib.constants.Z_BUF_ERROR`
- `zlib.constants.Z_VERSION_ERROR`

Compression levels.

- `zlib.constants.Z_NO_COMPRESSION`
- `zlib.constants.Z_BEST_SPEED`
- `zlib.constants.Z_BEST_COMPRESSION`
- `zlib.constants.Z_DEFAULT_COMPRESSION`

Compression strategy.

- `zlib.constants.Z_FILTERED`
- `zlib.constants.Z_HUFFMAN_ONLY`
- `zlib.constants.Z_RLE`
- `zlib.constants.Z_FIXED`
- `zlib.constants.Z_DEFAULT_STRATEGY`

## Class: Options

<!-- YAML
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
-->

<!--type=misc-->

Each class takes an `options` object. All options are optional.

Note that some options are only relevant when compressing, and are ignored by the decompression classes.

- `flush` {integer} **Default:** `zlib.constants.Z_NO_FLUSH`
- `finishFlush` {integer} **Default:** `zlib.constants.Z_FINISH`
- `chunkSize` {integer} **Default:** `16 * 1024`
- `windowBits` {integer}
- `level` {integer} (compression only)
- `memLevel` {integer} (compression only)
- `strategy` {integer} (compression only)
- `dictionary` {Buffer|TypedArray|DataView|ArrayBuffer} (deflate/inflate only, empty dictionary by default)
- `info` {boolean} (If `true`, returns an object with `buffer` and `engine`.)

See the description of `deflateInit2` and `inflateInit2` at <https://zlib.net/manual.html#Advanced> for more information on these.

## Class: zlib.Deflate

<!-- YAML
added: v0.5.8
-->

Compress data using deflate.

## Class: zlib.DeflateRaw

<!-- YAML
added: v0.5.8
-->

Compress data using deflate, and do not append a `zlib` header.

## Class: zlib.Gunzip

<!-- YAML
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
-->

Decompress a gzip stream.

## Class: zlib.Gzip

<!-- YAML
added: v0.5.8
-->

Compress data using gzip.

## Class: zlib.Inflate

<!-- YAML
added: v0.5.8
changes:

  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `'error'` event.
-->

Decompress a deflate stream.

## Class: zlib.InflateRaw

<!-- YAML
added: v0.5.8
changes:

  - version: v6.8.0
    pr-url: https://github.com/nodejs/node/pull/8512
    description: Custom dictionaries are now supported by `InflateRaw`.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `'error'` event.
-->

Decompress a raw deflate stream.

## Class: zlib.Unzip

<!-- YAML
added: v0.5.8
-->

Decompress either a Gzip- or Deflate-compressed stream by auto-detecting the header.

## Class: zlib.Zlib

<!-- YAML
added: v0.5.8
-->

Not exported by the `zlib` module. It is documented here because it is the base class of the compressor/decompressor classes.

### zlib.bytesRead

<!-- YAML
added: v8.1.0
deprecated: v10.0.0
-->

> Stability: 0 - Deprecated: Use [`zlib.bytesWritten`][] instead.

- {number}

Deprecated alias for [`zlib.bytesWritten`][]. This original name was chosen because it also made sense to interpret the value as the number of bytes read by the engine, but is inconsistent with other streams in Node.js that expose values under these names.

### zlib.bytesWritten

<!-- YAML
added: v10.0.0
-->

- {number}

The `zlib.bytesWritten` property specifies the number of bytes written to the engine, before the bytes are processed (compressed or decompressed, as appropriate for the derived class).

### zlib.close([callback])

<!-- YAML
added: v0.9.4
-->

Close the underlying handle.

### zlib.flush([kind], callback)

<!-- YAML
added: v0.5.8
-->

- `kind` **Default:** `zlib.constants.Z_FULL_FLUSH`

Flush pending data. Don't call this frivolously, premature flushes negatively impact the effectiveness of the compression algorithm.

Calling this only flushes data from the internal `zlib` state, and does not perform flushing of any kind on the streams level. Rather, it behaves like a normal call to `.write()`, i.e. it will be queued up behind other pending writes and will only produce output when data is being read from the stream.

### zlib.params(level, strategy, callback)

<!-- YAML
added: v0.11.4
-->

Dynamically update the compression level and compression strategy. Only applicable to deflate algorithm.

### zlib.reset()

<!-- YAML
added: v0.7.0
-->

Reset the compressor/decompressor to factory defaults. Only applicable to the inflate and deflate algorithms.

## zlib.constants

<!-- YAML
added: v7.0.0
-->

Provides an object enumerating Zlib-related constants.

## zlib.createDeflate([options])

<!-- YAML
added: v0.5.8
-->

Creates and returns a new [`Deflate`][] object with the given [`options`][].

## zlib.createDeflateRaw([options])

<!-- YAML
added: v0.5.8
-->

Creates and returns a new [`DeflateRaw`][] object with the given [`options`][].

An upgrade of zlib from 1.2.8 to 1.2.11 changed behavior when `windowBits` is set to 8 for raw deflate streams. zlib would automatically set `windowBits` to 9 if was initially set to 8. Newer versions of zlib will throw an exception, so Node.js restored the original behavior of upgrading a value of 8 to 9, since passing `windowBits = 9` to zlib actually results in a compressed stream that effectively uses an 8-bit window only.

## zlib.createGunzip([options])

<!-- YAML
added: v0.5.8
-->

Creates and returns a new [`Gunzip`][] object with the given [`options`][].

## zlib.createGzip([options])

<!-- YAML
added: v0.5.8
-->

Creates and returns a new [`Gzip`][] object with the given [`options`][].

## zlib.createInflate([options])

<!-- YAML
added: v0.5.8
-->

Creates and returns a new [`Inflate`][] object with the given [`options`][].

## zlib.createInflateRaw([options])

<!-- YAML
added: v0.5.8
-->

Creates and returns a new [`InflateRaw`][] object with the given [`options`][].

## zlib.createUnzip([options])

<!-- YAML
added: v0.5.8
-->

Creates and returns a new [`Unzip`][] object with the given [`options`][].

## Convenience Methods

<!--type=misc-->

All of these take a [`Buffer`][], [`TypedArray`][], [`DataView`][], [`ArrayBuffer`][] or string as the first argument, an optional second argument to supply options to the `zlib` classes and will call the supplied callback with `callback(error, result)`.

Every method has a `*Sync` counterpart, which accept the same arguments, but without a callback.

### zlib.deflate(buffer[, options], callback)

<!-- YAML
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
-->

### zlib.deflateSync(buffer[, options])

<!-- YAML
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
-->

- `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}

Compress a chunk of data with [`Deflate`][].

### zlib.deflateRaw(buffer[, options], callback)

<!-- YAML
added: v0.6.0
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->

### zlib.deflateRawSync(buffer[, options])

<!-- YAML
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
-->

- `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}

Compress a chunk of data with [`DeflateRaw`][].

### zlib.gunzip(buffer[, options], callback)

<!-- YAML
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
-->

### zlib.gunzipSync(buffer[, options])

<!-- YAML
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
-->

- `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}

Decompress a chunk of data with [`Gunzip`][].

### zlib.gzip(buffer[, options], callback)

<!-- YAML
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
-->

### zlib.gzipSync(buffer[, options])

<!-- YAML
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
-->

- `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}

Compress a chunk of data with [`Gzip`][].

### zlib.inflate(buffer[, options], callback)

<!-- YAML
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
-->

### zlib.inflateSync(buffer[, options])

<!-- YAML
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
-->

- `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}

Decompress a chunk of data with [`Inflate`][].

### zlib.inflateRaw(buffer[, options], callback)

<!-- YAML
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
-->

### zlib.inflateRawSync(buffer[, options])

<!-- YAML
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
-->

- `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}

Decompress a chunk of data with [`InflateRaw`][].

### zlib.unzip(buffer[, options], callback)

<!-- YAML
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
-->

### zlib.unzipSync(buffer[, options])

<!-- YAML
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
-->

- `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}

Decompress a chunk of data with [`Unzip`][].