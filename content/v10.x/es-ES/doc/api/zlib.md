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

Esto es en adición a un buffer bloque de salida interno único con tamaño `chunkSize`, que por defecto se establece en 16K.

La velocidad de compresión de `zlib` se ve más drásticamente afectada por la opción `level`. Un level mas alto resultará en mejor compresion, pero tardará mas tiempo en ser completada. Un level más bajo resultará en menor compresión, pero se llevará a cabo mas rápidamente.

En general, operaciones con mayor utilización de memoria significaran que Node.js tiene que hacer menos llamados a `zlib` ya que podrá procesar mas datos en cada operación `write`. Entonces, este es otro factor que afecta la velocidad a costas del uso de memoria.

## Flushing/Vaciamiento

Invocar [`.flush()`][] en un stream de compresión hará que `zlib` retorne la mayor cantidad posible de contenido. Esto puede ocurrir a costa de compresión degradada, pero es útil cuando los datos deben estar disponibles lo antes posible.

En el siguiente ejemplo, `flush()` se utiliza para escribir una respuesta HTTP al cliente parcialmente comprimida:

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

## Constantes

<!-- YAML
added: v0.5.8
-->

<!--type=misc-->

Todas las constantes definidas en `zlib.h` se encuentran también definidas en `require('zlib').constants`. En el curso normal de operaciones, no debería ser necesario usar estas constantes. Se encuentran documentadas para que su presencia no resulte sorpresiva. Esta sección esta extraída casi directamente de la [documentación de zlib](https://zlib.net/manual.html#Constants). Ver <https://zlib.net/manual.html#Constants> para mas detalles.

Anteriormente, las constantes estaban directamente disponibles desde `require('zlib')`, por ejemplo `zlib.Z_NO_FLUSH`. Acceder a las constantes directamente desde el modulo aún es posible pero se encuentra deprecado.

Valores de flush permitidos.

- `zlib.constants.Z_NO_FLUSH`
- `zlib.constants.Z_PARTIAL_FLUSH`
- `zlib.constants.Z_SYNC_FLUSH`
- `zlib.constants.Z_FULL_FLUSH`
- `zlib.constants.Z_FINISH`
- `zlib.constants.Z_BLOCK`
- `zlib.constants.Z_TREES`

Códigos de retorno para las funciones de compresión/descompresión. Los valores negativos son errores, los valores positivos se utilizan para eventos especiales pero normales.

- `zlib.constants.Z_OK`
- `zlib.constants.Z_STREAM_END`
- `zlib.constants.Z_NEED_DICT`
- `zlib.constants.Z_ERRNO`
- `zlib.constants.Z_STREAM_ERROR`
- `zlib.constants.Z_DATA_ERROR`
- `zlib.constants.Z_MEM_ERROR`
- `zlib.constants.Z_BUF_ERROR`
- `zlib.constants.Z_VERSION_ERROR`

Niveles de compresión.

- `zlib.constants.Z_NO_COMPRESSION`
- `zlib.constants.Z_BEST_SPEED`
- `zlib.constants.Z_BEST_COMPRESSION`
- `zlib.constants.Z_DEFAULT_COMPRESSION`

Estrategia de compresión.

- `zlib.constants.Z_FILTERED`
- `zlib.constants.Z_HUFFMAN_ONLY`
- `zlib.constants.Z_RLE`
- `zlib.constants.Z_FIXED`
- `zlib.constants.Z_DEFAULT_STRATEGY`

## Clase: Opciones

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

Cada clase acepta un objeto `options`. Todas las opciones son opcionales.

Notar que algunas opciones solo son relevantes cuando se esta llevando a cabo una compresión, y son ignoradas por las clases de descompresión.

- `flush` {integer} **Por defecto:** `zlib.constants.Z_NO_FLUSH`
- `finishFlush` {integer} **Por defecto:** `zlib.constants.Z_FINISH`
- `chunkSize` {integer} **Por defecto:** `16 * 1024`
- `windowBits` {integer}
- `level` {integer} (solo compresión)
- `memLevel` {integer} (solo compresión)
- `strategy` {integer} (solo compresión)
- `dictionary` {Buffer|TypedArray|DataView|ArrayBuffer} (deflate/inflate solamente, diccionario vacío por defecto)
- `info` {boolean} (Si `true`, retorna un objecto con `buffer` y `engine`.)

Ver la descripción de `deflateInit2` y `inflateInit2` en <https://zlib.net/manual.html#Advanced> para mas información.

## Clase: zlib.Deflate

<!-- YAML
added: v0.5.8
-->

Comprimir datos usando deflate.

## Clase: zlib.DeflateRaw

<!-- YAML
added: v0.5.8
-->

Comprimir datos utilizando deflate, sin adjuntar un encabezado `zlib`.

## Clase: zlib.Gunzip

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

Descomprimir un stream gzip.

## Clase: zlib.Gzip

<!-- YAML
added: v0.5.8
-->

Comprimir datos usando gzip.

## Clase: zlib.Inflate

<!-- YAML
added: v0.5.8
changes:

  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `'error'` event.
-->

Descomprimir un stream deflate.

## Clase: zlib.InflateRaw

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

Descomprimir un deflate raw stream.

## Clase: zlib.Unzip

<!-- YAML
added: v0.5.8
-->

Descomprimir un stream comprimido con Gzip o Deflate, detectando automáticamente el encabezado.

## Clase: zlib.Zlib

<!-- YAML
added: v0.5.8
-->

No exportada por el módulo `zlib`. Se encuentra documentada aquí por que es la clase base de las clases de compresión/descompresión.

### zlib.bytesRead

<!-- YAML
added: v8.1.0
deprecated: v10.0.0
-->

> Estabilidad: 0 - Deprecada: Utilizar [`zlib.bytesWritten`][] en su lugar.

- {number}

Alias deprecado para [`zlib.bytesWritten`][]. Este nombre fue elegido originalmente porque tenía sentido interpretar el valor como el número de bytes que lee el motor, pero es inconsistente con otros streams en Node.js que exponen valores bajo estos mismos nombres.

### zlib.bytesWritten

<!-- YAML
added: v10.0.0
-->

- {number}

La propiedad `zlib.bytesWritten` especifica el número de bytes que se escriben al motor, antes que los bytes sean procesados (comprimidos o descomprimidos, lo que aplique a la clase derivada).

### zlib.close([callback])

<!-- YAML
added: v0.9.4
-->

Cierra el orquestador adyacente.

### zlib.flush([kind], callback)

<!-- YAML
added: v0.5.8
-->

- `kind` **Por defecto:** `zlib.constants.Z_FULL_FLUSH`

Desagota los datos pendientes. No utilizar generosamente, los flushes/vaciamientos de datos prematuros impactan negativamente en la efectividad del algoritmo de compresión.

Invocar este método solo vacía los datos contenidos en el estado interno de `zlib`, pero no se replica a ningún tipo de vaciamiento a nivel de los streams. Se comporta como una llamada normal a `.write()`, ej. se añadirá a la cola detrás de otros write pendientes y solo producirá datos de salida cuando los datos estén siendo leídos desde el stream.

### zlib.params(level, strategy, callback)

<!-- YAML
added: v0.11.4
-->

Modificar la estrategia de compresión y el nivel de compresión de manera dinámica. Solo aplica al algoritmo de deflate.

### zlib.reset()

<!-- YAML
added: v0.7.0
-->

Volver el compresor/descompresor a su estado de fábrica. Solo aplicable a los algoritmos de inflate y deflate.

## zlib.constants

<!-- YAML
added: v7.0.0
-->

Provee un objeto que enumera constantes relacionadas a Zlib.

## zlib.createDeflate([options])

<!-- YAML
added: v0.5.8
-->

Crea y retorna un nuevo objeto [`Deflate`][] con las [`options`][] suministradas.

## zlib.createDeflateRaw([options])

<!-- YAML
added: v0.5.8
-->

Crea y retorna un nuevo objeto [`DeflateRaw`][] con las [`options`][] suministradas.

Una actualización de zlib de 1.2.8 a 1.2.11 cambia el comportamiento cuando `windowBits` se establece en 8 para raw deflate streams. zlib establecía `windowBits` a 9 automáticamente si inicialmente se estableció en 8. Versiones mas nuevas de zlib arrojan una excepción, por lo que Node.js restauró el comportamiento original de actualizar el valor de 8 a 9, ya que suministrar `windowBits = 9` a zlib resulta en un stream comprimido que efectivamente usa una ventana de 8 bits.

## zlib.createGunzip([options])

<!-- YAML
added: v0.5.8
-->

Crea y retorna un nuevo objeto [`Gunzip`][] con las [`options`][] suministradas.

## zlib.createGzip([options])

<!-- YAML
added: v0.5.8
-->

Crea y retorna un nuevo objeto [`Gzip`][] con las [`options`][] suministradas.

## zlib.createInflate([options])

<!-- YAML
added: v0.5.8
-->

Crea y retorna un nuevo objeto [`Inflate`][] con las [`options`][] suministradas.

## zlib.createInflateRaw([options])

<!-- YAML
added: v0.5.8
-->

Crea y retorna un nuevo objeto [`InflateRaw`][] con las [`options`][] suministradas.

## zlib.createUnzip([options])

<!-- YAML
added: v0.5.8
-->

Crea y retorna un nuevo objeto [`Unzip`][] con las [`options`][] suministradas.

## Métodos de conveniencia

<!--type=misc-->

Todos estos aceptan un [`Buffer`][], [`TypedArray`][], [`DataView`][], [`ArrayBuffer`][] o string como el primer argumento, un segundo argumento opcional para suministrar opciones a las clases `zlib`, y un llamado al callback suministrado con `callback(error, result)`.

Cada método tiene una contraparte `*Sync` que acepta los mismos argumentos pero sin el llamado a un callback.

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

Comprime un fragmento de datos con [`Deflate`][].

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

Comprime un fragmento de datos con [`DeflateRaw`][].

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

Descomprime un fragmento de datos con [`Gunzip`][].

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

Comprime un fragmento de datos con [`Gzip`][].

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

Descomprime un fragmento de datos con [`Inflate`][].

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

Descomprime un fragmento de datos con [`InflateRaw`][].

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

Descomprime un fragmento de datos con [`Unzip`][].