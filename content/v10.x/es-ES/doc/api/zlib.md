# Zlib

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

The `zlib` module provides compression functionality implemented using Gzip and Deflate/Inflate, as well as Brotli. Se puede acceder a él utilizando:

```js
const zlib = require('zlib');
```

Comprimir o descomprimir un stream (como un archivo) se puede lograr mediante el piping de los datos a través de un stream `zlib` hacia un stream de destino:

```js
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

Note that all zlib APIs except those that are explicitly synchronous use libuv's threadpool. This can lead to surprising effects in some applications, such as subpar performance (which can be mitigated by adjusting the [pool size](cli.html#cli_uv_threadpool_size_size)) and/or unrecoverable and catastrophic memory fragmentation.

## Comprimiendo peticiones y respuestas HTTP

The `zlib` module can be used to implement support for the `gzip`, `deflate` and `br` content-encoding mechanisms defined by [HTTP](https://tools.ietf.org/html/rfc7230#section-4.2).

La cabecera HTTP [`Accept-Encoding`][] se usa dentro de una solicitud http para identificar las codificaciones de compresión aceptadas por el cliente. La cabecera [`Content-Encoding`][] se utiliza para identificar las codificaciones de compresión realmente aplicadas a un mensaje.

Los ejemplos listados abajo están drásticamente simplificados para mostrar el concepto básico. Utilizar codificación basada en `zlib` puede resultar costosa y los resultados deberían ser almacenados en memoria. Ver [Ajustes en el Uso de Memoria](#zlib_memory_usage_tuning) para obtener más información sobre la eficiencia en velocidad/memoria/compresión involucrada en el uso de `zlib`.

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
// ejemplo de servidor
// Ejecutar una operación gzip en cada petición es bastante costoso.
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

Por defecto, los métodos de `zlib` van a arrojar un error al descomprimir datos truncados. De cualquier manera, si es sabido que los datos están incompletos, o se desea inspeccionar solo el principio de un archivo comprimido, es posible suprimir el manejo de error predeterminado cambiando el método que se utiliza para descomprimir el último fragmento de datos ingresado:

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

Esto no cambiará el comportamiento en otras situaciones que arrojen errores, p. ej., cuando los datos ingresados tienen un formato inválido. Usando este método, no será posible determinar si el ingreso de datos terminó prematuramente o si no posee validaciones de integridad, haciendo que sea necesaria la verificación manual de que el resultado de la descompresión es válido.

## Ajustes en el uso de Memoria

<!--type=misc-->

### For zlib-based streams

Fuente `zlib/zconf.h`, modificado para su uso en Node.js:

Los requisitos de memoria para deflación son (en bytes):
```js
(1 << (windowBits + 2)) + (1 << (memLevel + 9))
```

Esto es: 128K para `windowBits` = 15 + 128K para `memLevel` = 8 (valores por defecto) mas un par de kilobytes para objetos pequeños.

Por ejemplo, para reducir los requerimientos predeterminados de memoria de 256K a 128K, las opciones deberían ser configuradas de la siguiente manera:

```js
const options = { windowBits: 14, memLevel: 7 };
```

Sin embargo, esto generalmente degradará la compresión.

Los requerimientos de memoria para inflate son (en bytes) `1 << windowBits`. Esto es, 32K para `windowBits` = 15 (valor por defecto) más un par de kilobytes para objetos pequeños.

Esto es además de un único buffer interno de barra de salida de tamaño `chunkSize`, que por defecto es 16K.

La velocidad de compresión de `zlib` se ve drásticamente más afectada por la configuración de `level`. Un nivel más alto dará como resultado una mejor compresión, pero tardará más en completarse. Un nivel más bajo resultará en menos compresión, pero será mucho más rápido.

En general, mayores opciones de uso de la memoria significarán que Node.js debe hacer menos llamadas a `zlib` porque podrá procesar más datos en cada operación de `write`. Entonces, este es otro factor que afecta la velocidad, al costo del uso de la memoria.

### For Brotli-based streams

There are equivalents to the zlib options for Brotli-based streams, although these options have different ranges than the zlib ones:

- zlib’s `level` option matches Brotli’s `BROTLI_PARAM_QUALITY` option.
- zlib’s `windowBits` option matches Brotli’s `BROTLI_PARAM_LGWIN` option.

See [below](#zlib_brotli_constants) for more details on Brotli-specific options.

## Flushing

Invocar a [`.flush()`][] en un stream de compresión hará que `zlib` devuelva la mayor cantidad posible de contenido. Esto puede ocurrir a costa de una calidad de compresión degradada, pero puede ser útil cuando los datos deben estar disponibles tan pronto como sea posible.

En el siguiente ejemplo, `flush()` se utiliza para escribir una respuesta HTTP al cliente parcialmente comprimida:
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

## Constantes<!-- YAML
added: v0.5.8
--><!--type=misc-->### zlib constants

Todas las constantes definidas en `zlib.h` se encuentran también definidas en `require('zlib').constants`. En el curso normal de operaciones, no debería ser necesario usar estas constantes. Están documentadas para que su presencia no resulte sorpresiva. Esta sección está extraída casi directamente de la [documentación de zlib](https://zlib.net/manual.html#Constants). Vea <https://zlib.net/manual.html#Constants> para más detalles.

Anteriormente, las constantes estaban directamente disponibles desde `require('zlib')`, por ejemplo `zlib.Z_NO_FLUSH`. Acceder a las constantes directamente desde el modulo aún es posible pero se encuentra deprecado.

Valores de flush permitidos.

* `zlib.constants.Z_NO_FLUSH`
* `zlib.constants.Z_PARTIAL_FLUSH`
* `zlib.constants.Z_SYNC_FLUSH`
* `zlib.constants.Z_FULL_FLUSH`
* `zlib.constants.Z_FINISH`
* `zlib.constants.Z_BLOCK`
* `zlib.constants.Z_TREES`

Códigos de retorno para las funciones de compresión/descompresión. Los valores negativos son errores, los valores positivos se utilizan para eventos especiales pero normales.

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

## Clase: Opciones<!-- YAML
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
--><!--type=misc-->Each zlib-based class takes an `options` object. Todas las opciones son opcionales.

Tenga en cuenta que algunas opciones solo son relevantes cuando se esta llevando a cabo una compresión, y son ignoradas por las clases de descompresión.

* `flush` {integer} **Por defecto:** `zlib.constants.Z_NO_FLUSH`
* `finishFlush` {integer} **Por defecto:** `zlib.constants.Z_FINISH`
* `chunkSize` {integer} **Por defecto:** `16 * 1024`
* `windowBits` {integer}
* `level` {integer} (solo compresión)
* `memLevel` {integer} (solo compresión)
* `strategy` {integer} (solo compresión)
* `dictionary` {Buffer|TypedArray|DataView|ArrayBuffer} (deflate/inflate solamente, diccionario vacío por defecto)
* `info` {boolean} (Si `true`, retorna un objecto con `buffer` y `engine`.)

Vea la descripción de `deflateInit2` y `inflateInit2` en <https://zlib.net/manual.html#Advanced> para más información sobre estos.

## Class: BrotliOptions<!-- YAML
added: v10.16.0
--><!--type=misc-->Each Brotli-based class takes an `options` object. Todas las opciones son opcionales.

* `flush` {integer} **Por defecto:** `zlib.constants.BROTLI_OPERATION_PROCESS`
* `finishFlush` {integer} **Por defecto:** `zlib.constants.BROTLI_OPERATION_FINISH`
* `chunkSize` {integer} **Por defecto:** `16 * 1024`
* `params` {Object} Key-value object containing indexed [Brotli parameters](#zlib_brotli_constants).

For example:

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

## Clase: zlib.Deflate<!-- YAML
added: v0.5.8
-->Comprimir datos usando deflate.

## Clase: zlib.DeflateRaw
<!-- YAML
added: v0.5.8
-->

Comprimir datos usando deflate, sin añadir una cabecera de `zlib`.

## Clase: zlib.Gunzip<!-- YAML
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
-->Descomprimir un stream gzip.

## Clase: zlib.Gzip<!-- YAML
added: v0.5.8
-->Comprimir datos usando gzip.

## Clase: zlib.Inflate<!-- YAML
added: v0.5.8
changes:
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `'error'` event.
-->Descomprimir un stream deflate.

## Clase: zlib.InflateRaw<!-- YAML
added: v0.5.8
changes:
  - version: v6.8.0
    pr-url: https://github.com/nodejs/node/pull/8512
    description: Custom dictionaries are now supported by `InflateRaw`.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `'error'` event.
-->Descomprimir un stream deflate sin formato.

## Clase: zlib.Unzip<!-- YAML
added: v0.5.8
-->Descomprimir un stream comprimido con Gzip o Deflate, mediante la detección automática de la cabecera.

## Class: zlib.ZlibBase<!-- YAML
added: v0.5.8
changes:
  - version: v10.16.0
    pr-url: https://github.com/nodejs/node/pull/24939
    description: This class was renamed from `Zlib` to `ZlibBase`.
-->No exportada por el módulo `zlib`. Está documentada aquí porque es la clase base de las clases de compresión/descompresión.

This class inherits from [`stream.Transform`][], allowing `zlib` objects to be used in pipes and similar stream operations.

### zlib.bytesRead<!-- YAML
added: v8.1.0
deprecated: v10.0.0
-->> Estabilidad: 0 - Deprecada: Utilizar [`zlib.bytesWritten`][] en su lugar.

* {number}

Alias desaprobado para [`zlib.bytesWritten`][]. El nombre original fue elegido porque también tenía sentido interpretar el valor como el número de bytes leídos por el motor, pero es inconsistente con otros streams en Node.js que exponen valores bajo estos nombres.

### zlib.bytesWritten<!-- YAML
added: v10.0.0
-->* {number}

La propiedad `zlib.bytesWritten` especifica el número de bytes que se escriben al motor, antes que los bytes sean procesados (comprimidos o descomprimidos, lo que aplique a la clase derivada).

### zlib.close([callback])<!-- YAML
added: v0.9.4
-->* `callback` {Function}

Cierra el orquestador adyacente.

### zlib.flush([kind, ]callback)<!-- YAML
added: v0.5.8
-->* `kind` **Default:** `zlib.constants.Z_FULL_FLUSH` for zlib-based streams, `zlib.constants.BROTLI_OPERATION_FLUSH` for Brotli-based streams.
* `callback` {Function}

Vacía los datos pendientes. No lo invoque de forma frívola, los vaciamientos prematuros impactan negativamente en la efectividad del algoritmo de compresión.

Invocar este método solo vacía los datos del estado interno de `zlib`, y no realiza un vaciado de ningún tipo a nivel de los streams. Más bien, se comporta como una llamada normal a `.write()`, es decir, se añadirá a la cola detrás de otras escrituras pendientes y solo producirá un output cuando los datos estén siendo leídos desde el stream.

### zlib.params(level, strategy, callback)<!-- YAML
added: v0.11.4
-->* `level` {integer}
* `strategy` {integer}
* `callback` {Function}

This function is only available for zlib-based streams, i.e. not Brotli.

Actualiza dinámicamente el nivel y la estrategia de compresión. Solo aplica al algoritmo de deflate.

### zlib.reset()<!-- YAML
added: v0.7.0
-->Restablece el compresor/descompresor a sus valores predeterminados de fábrica. Solo aplicable a los algoritmos de inflate y deflate.

## zlib.constants<!-- YAML
added: v7.0.0
-->Provee un objeto que enumera constantes relacionadas a Zlib.

## zlib.createBrotliCompress([options])<!-- YAML
added: v10.16.0
-->* `opciones` {brotli options}

Creates and returns a new [`BrotliCompress`][] object.

## zlib.createBrotliDecompress([options])
<!-- YAML
added: v10.16.0
-->

* `opciones` {brotli options}

Creates and returns a new [`BrotliDecompress`][] object.

## zlib.createDeflate([options])<!-- YAML
added: v0.5.8
-->* `opciones` {Object}

Creates and returns a new [`Deflate`][] object.

## zlib.createDeflateRaw([options])
<!-- YAML
added: v0.5.8
-->

* `opciones` {Object}

Creates and returns a new [`DeflateRaw`][] object.

Una actualización de zlib de 1.2.8 a 1.2.11 cambia el comportamiento cuando `windowBits` se establece en 8 para raw deflate streams. zlib establecía `windowBits` a 9 automáticamente si inicialmente se estableció en 8. Las versiones más recientes de zlib arrojarán una excepción, por lo que Node.js restauró el comportamiento original de actualizar un valor de 8 a 9, ya que pasar `windowBits = 9` a zlib en realidad resulta en un stream comprimido que usa efectivamente solo una ventana de 8 bits.

## zlib.createGunzip([options])
<!-- YAML
added: v0.5.8
-->

* `opciones` {Object}

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

* `opciones` {Object}

Creates and returns a new [`Inflate`][] object.

## zlib.createInflateRaw([options])
<!-- YAML
added: v0.5.8
-->

* `opciones` {Object}

Creates and returns a new [`InflateRaw`][] object.

## zlib.createUnzip([options])
<!-- YAML
added: v0.5.8
-->

* `opciones` {Object}

Creates and returns a new [`Unzip`][] object.

## Métodos de conveniencia<!--type=misc-->Todos estos aceptan un [`Buffer`][], [`TypedArray`][], [`DataView`][], [`ArrayBuffer`][] o string como el primer argumento, un segundo argumento opcional para suministrar opciones a las clases `zlib`, y un llamado al callback suministrado con `callback(error, result)`.

Cada método tiene una contraparte `*Sync` que acepta los mismos argumentos, pero sin una callback.

### zlib.brotliCompress(buffer[, options], callback)<!-- YAML
added: v10.16.0
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `opciones` {brotli options}
* `callback` {Function}

### zlib.brotliCompressSync(buffer[, options])
<!-- YAML
added: v10.16.0
-->
* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `opciones` {brotli options}

Compress a chunk of data with [`BrotliCompress`][].

### zlib.brotliDecompress(buffer[, options], callback)
<!-- YAML
added: v10.16.0
-->
* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `opciones` {brotli options}
* `callback` {Function}

### zlib.brotliDecompressSync(buffer[, options])
<!-- YAML
added: v10.16.0
-->
* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `opciones` {brotli options}

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
* `opciones` {Object}
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
* `opciones` {Object}

Comprime un fragmento de datos con [`Deflate`][].

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
* `opciones` {Object}
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
* `opciones` {Object}

Comprime un fragmento de datos con [`DeflateRaw`][].

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
* `opciones` {Object}
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
* `opciones` {Object}

Descomprime un fragmento de datos con [`Gunzip`][].

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
* `opciones` {Object}
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
* `opciones` {Object}

Comprime un fragmento de datos con [`Gzip`][].

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
* `opciones` {Object}
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
* `opciones` {Object}

Descomprime un fragmento de datos con [`Inflate`][].

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
* `opciones` {Object}
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
* `opciones` {Object}

Descomprime un fragmento de datos con [`InflateRaw`][].

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
* `opciones` {Object}
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
* `opciones` {Object}

Descomprime un fragmento de datos con [`Unzip`][].
