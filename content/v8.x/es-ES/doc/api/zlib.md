# Zlib

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

The `zlib` module provides compression functionality implemented using Gzip and Deflate/Inflate. Se puede acceder a él utilizando:

```js
const zlib = require('zlib');
```

Compressing or decompressing a stream (such as a file) can be accomplished by piping the source stream data through a `zlib` stream into a destination stream:

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

## Uso del Threadpool

Note that all zlib APIs except those that are explicitly synchronous use libuv's threadpool, which can have surprising and negative performance implications for some applications, see the [`UV_THREADPOOL_SIZE`][] documentation for more information.

## Comprimiendo peticiones y respuestas HTTP

The `zlib` module can be used to implement support for the `gzip` and `deflate` content-encoding mechanisms defined by [HTTP](https://tools.ietf.org/html/rfc7230#section-4.2).

The HTTP [`Accept-Encoding`][] header is used within an http request to identify the compression encodings accepted by the client. The [`Content-Encoding`][] header is used to identify the compression encodings actually applied to a message.

*Note*: the examples given below are drastically simplified to show the basic concept. Utilizar codificación basada en `zlib` puede resultar costosa y los resultados deberían ser almacenados en memoria. See [Memory Usage Tuning](#zlib_memory_usage_tuning) for more information on the speed/memory/compression tradeoffs involved in `zlib` usage.

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
// Sería mucho mas eficiente almacenar en caché el buffer comprimido.
const zlib = require('zlib');
const http = require('http');
const fs = require('fs');
http.createServer((request, response) => {
  const raw = fs.createReadStream('index.html');
  let acceptEncoding = request.headers['accept-encoding'];
  if (!acceptEncoding) {
    acceptEncoding = '';
  }

  // Nota: Este no es un analizador de codificación de aceptación conforme.
  // Vea https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
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

By default, the `zlib` methods will throw an error when decompressing truncated data. However, if it is known that the data is incomplete, or the desire is to inspect only the beginning of a compressed file, it is possible to suppress the default error handling by changing the flushing method that is used to decompress the last chunk of input data:

```js
// Esta es una versión truncada del buffer de los ejemplos anteriores.
const buffer = Buffer.from('eJzT0yMA', 'base64');

zlib.unzip(
  buffer,
  { finishFlush: zlib.constants.Z_SYNC_FLUSH },
  (err, buffer) => {
    if (!err) {
      console.log(buffer.toString());
    } else {
      // maneje el error
    }
  });
```

This will not change the behavior in other error-throwing situations, e.g. when the input data has an invalid format. Using this method, it will not be possible to determine whether the input ended prematurely or lacks the integrity checks, making it necessary to manually check that the decompressed result is valid.

## Ajustes en el uso de Memoria

<!--type=misc-->

Desde `zlib/zconf.h`, modificado para su uso en Node.js:

Los requisitos de memoria para deflación son (en bytes):

```js
(1 << (windowBits + 2)) + (1 << (memLevel + 9))
```

That is: 128K for windowBits = 15 + 128K for memLevel = 8 (default values) plus a few kilobytes for small objects.

For example, to reduce the default memory requirements from 256K to 128K, the options should be set to:

```js
const options = { windowBits: 14, memLevel: 7 };
```

Sin embargo, esto generalmente degradará la compresión.

Los requerimientos de memoria para inflate son (en bytes) `1 << windowBits`. That is, 32K for windowBits = 15 (default value) plus a few kilobytes for small objects.

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
  // En aras de la simplicidad, se omiten las comprobaciones de Accept-Encoding.
  response.writeHead(200, { 'content-encoding': 'gzip' });
  const output = zlib.createGzip();
  output.pipe(response);

  setInterval(() => {
    output.write(`The current time is ${Date()}\n`, () => {
      // Los datos se han pasado a zlib, pero el algoritmo de compresión puede
      // haber decidido almacenar los datos para una compresión más eficiente.
      // Invocar a .flush() hará que los datos estén disponibles tan pronto como el cliente
      // esté listo para recibirlos.
      output.flush();
    });
  }, 1000);
}).listen(1337);
```

## Constants<!-- YAML
added: v0.5.8
-->

<!--type=misc-->All of the constants defined in 

`zlib.h` are also defined on `require('zlib').constants`. In the normal course of operations, it will not be necessary to use these constants. Están documentadas para que su presencia no resulte sorpresiva. This section is taken almost directly from the [zlib documentation](https://zlib.net/manual.html#Constants). See <https://zlib.net/manual.html#Constants> for more details.

*Note*: Previously, the constants were available directly from `require('zlib')`, for instance `zlib.Z_NO_FLUSH`. Accessing the constants directly from the module is currently still possible but should be considered deprecated.

Valores de flush permitidos.

* `zlib.constants.Z_NO_FLUSH`
* `zlib.constants.Z_PARTIAL_FLUSH`
* `zlib.constants.Z_SYNC_FLUSH`
* `zlib.constants.Z_FULL_FLUSH`
* `zlib.constants.Z_FINISH`
* `zlib.constants.Z_BLOCK`
* `zlib.constants.Z_TREES`

Códigos de retorno para las funciones de compresión/descompresión. Negative values are errors, positive values are used for special but normal events.

* `zlib.constants.Z_OK`
* `zlib.constants.Z_STREAM_END`
* `zlib.constants.Z_NEED_DICT`
* `zlib.constants.Z_ERRNO`
* `zlib.constants.Z_STREAM_ERROR`
* `zlib.constants.Z_DATA_ERROR`
* `zlib.constants.Z_MEM_ERROR`
* `zlib.constants.Z_BUF_ERROR`
* `zlib.constants.Z_VERSION_ERROR`

Niveles de compresión.

* `zlib.constants.Z_NO_COMPRESSION`
* `zlib.constants.Z_BEST_SPEED`
* `zlib.constants.Z_BEST_COMPRESSION`
* `zlib.constants.Z_DEFAULT_COMPRESSION`

Estrategia de compresión.

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
-->

<!--type=misc-->Each class takes an 

`options` object. Todas las opciones son opcionales.

Note that some options are only relevant when compressing, and are ignored by the decompression classes.

* `flush` {integer} **Por defecto:** `zlib.constants.Z_NO_FLUSH`
* `finishFlush` {integer} **Por defecto:** `zlib.constants.Z_FINISH`
* `chunkSize` {integer} **Por defecto:** `16 * 1024`
* `windowBits` {integer}
* `level` {integer} (solo compresión)
* `memLevel` {integer} (solo compresión)
* `strategy` {integer} (solo compresión)
* `dictionary` {Buffer|TypedArray|DataView} (deflate/inflate only, empty dictionary by default)
* `info` {boolean} (Si es `true`, devuelve un objecto con `buffer` y `engine`)

See the description of `deflateInit2` and `inflateInit2` at <https://zlib.net/manual.html#Advanced> for more information on these.

## Class: zlib.Deflate<!-- YAML
added: v0.5.8
-->Compress data using deflate.

## Clase: zlib.DeflateRaw

<!-- YAML
added: v0.5.8
-->

Comprimir datos usando deflate, sin añadir una cabecera de `zlib`.

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
-->Descomprimir un stream gzip.

## Class: zlib.Gzip<!-- YAML
added: v0.5.8
-->Compress data using gzip.

## Class: zlib.Inflate<!-- YAML
added: v0.5.8
changes:

  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `error` event.
-->Descomprimir un stream deflate.

## Class: zlib.InflateRaw<!-- YAML
added: v0.5.8
changes:

  - version: v6.8.0
    pr-url: https://github.com/nodejs/node/pull/8512
    description: Custom dictionaries are now supported by `InflateRaw`.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `error` event.
-->Descomprimir un stream deflate sin formato.

## Class: zlib.Unzip<!-- YAML
added: v0.5.8
-->Decompress either a Gzip- or Deflate-compressed stream by auto-detecting the header.

## Clase: zlib.Zlib

<!-- YAML
added: v0.5.8
-->

No exportada por el módulo `zlib`. It is documented here because it is the base class of the compressor/decompressor classes.

### zlib.bytesRead<!-- YAML
added: v8.1.0
-->

* {number}

The `zlib.bytesRead` property specifies the number of bytes read by the engine before the bytes are processed (compressed or decompressed, as appropriate for the derived class).

### zlib.close([callback])<!-- YAML
added: v0.9.4
-->Close the underlying handle.

### zlib.flush([kind], callback)<!-- YAML
added: v0.5.8
-->

* `kind` **Por defecto:** `zlib.constants.Z_FULL_FLUSH`

Vacía los datos pendientes. Don't call this frivolously, premature flushes negatively impact the effectiveness of the compression algorithm.

Calling this only flushes data from the internal `zlib` state, and does not perform flushing of any kind on the streams level. Rather, it behaves like a normal call to `.write()`, i.e. it will be queued up behind other pending writes and will only produce output when data is being read from the stream.

### zlib.params(level, strategy, callback)<!-- YAML
added: v0.11.4
-->Dynamically update the compression level and compression strategy. Solo aplica al algoritmo de deflate.

### zlib.reset()<!-- YAML
added: v0.7.0
-->Reset the compressor/decompressor to factory defaults. Only applicable to the inflate and deflate algorithms.

## zlib.constants<!-- YAML
added: v7.0.0
-->Provides an object enumerating Zlib-related constants.

## zlib.createDeflate([options](#zlib_class_options))<!-- YAML
added: v0.5.8
-->Creates and returns a new 

[Deflate](#zlib_class_zlib_deflate) object with the given [options](#zlib_class_options).

## zlib.createDeflateRaw([options](#zlib_class_options))

<!-- YAML
added: v0.5.8
-->

Crea y devuelve un nuevo objeto [Deflate](#zlib_class_zlib_deflateraw) con las [options](#zlib_class_options) dadas.

*Note*: An upgrade of zlib from 1.2.8 to 1.2.11 changed behavior when windowBits is set to 8 for raw deflate streams. zlib would automatically set windowBits to 9 if was initially set to 8. Newer versions of zlib will throw an exception, so Node.js restored the original behavior of upgrading a value of 8 to 9, since passing `windowBits = 9` to zlib actually results in a compressed stream that effectively uses an 8-bit window only.

## zlib.createGunzip([options](#zlib_class_options))

<!-- YAML
added: v0.5.8
-->

Crea y devuelve un nuevo objeto [Gunzip](#zlib_class_zlib_gunzip) con las [options](#zlib_class_options) dadas.

## zlib.createGzip([options](#zlib_class_options))

<!-- YAML
added: v0.5.8
-->

Crea y devuelve un nuevo objeto [Gunzip](#zlib_class_zlib_gzip) con las [options](#zlib_class_options) dadas.

## zlib.createInflate([options](#zlib_class_options))

<!-- YAML
added: v0.5.8
-->

Crea y devuelve un nuevo objeto [Inflate](#zlib_class_zlib_inflate) con las [options](#zlib_class_options) dadas.

## zlib.createInflateRaw([options](#zlib_class_options))

<!-- YAML
added: v0.5.8
-->

Crea y devuelve un nuevo objeto [InflateRaw](#zlib_class_zlib_inflateraw) con las [options](#zlib_class_options) dadas.

## zlib.createUnzip([options](#zlib_class_options))

<!-- YAML
added: v0.5.8
-->

Crea y devuelve un nuevo objeto [Unzip](#zlib_class_zlib_unzip) con las [options](#zlib_class_options) dadas.

## Convenience Methods<!--type=misc-->All of these take a [

`Buffer`][], [`TypedArray`][], [`DataView`][], or string as the first argument, an optional second argument to supply options to the `zlib` classes and will call the supplied callback with `callback(error, result)`.

Every method has a `*Sync` counterpart, which accept the same arguments, but without a callback.

### zlib.deflate(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->### zlib.deflateSync(buffer[, options])

<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

* `buffer` {Buffer|TypedArray|DataView|string}

Comprimir un trozo de datos con [Deflate](#zlib_class_zlib_deflate).

### zlib.deflateRaw(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->### zlib.deflateRawSync(buffer[, options])

<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

* `buffer` {Buffer|TypedArray|DataView|string}

Comprimir un trozo de datos con [DeflateRaw](#zlib_class_zlib_deflateraw).

### zlib.gunzip(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->### zlib.gunzipSync(buffer[, options])

<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

* `buffer` {Buffer|TypedArray|DataView|string}

Descomprimir un trozo de datos con [Gunzip](#zlib_class_zlib_gunzip).

### zlib.gzip(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->### zlib.gzipSync(buffer[, options])

<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

* `buffer` {Buffer|TypedArray|DataView|string}

Comprimir un trozo de datos con [Gzip](#zlib_class_zlib_gzip).

### zlib.inflate(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->### zlib.inflateSync(buffer[, options])

<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

* `buffer` {Buffer|TypedArray|DataView|string}

Descomprimir un trozo de datos con [Inflate](#zlib_class_zlib_inflate).

### zlib.inflateRaw(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->### zlib.inflateRawSync(buffer[, options])

<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

* `buffer` {Buffer|TypedArray|DataView|string}

Descomprimir un trozo de datos con [InflateRaw](#zlib_class_zlib_inflateraw).

### zlib.unzip(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->### zlib.unzipSync(buffer[, options])

<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

* `buffer` {Buffer|TypedArray|DataView|string}

Descomprimir un trozo de datos con [Unzip](#zlib_class_zlib_unzip).