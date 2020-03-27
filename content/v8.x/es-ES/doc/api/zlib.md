# Zlib

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

El módulo `zlib` proporciona funcionalidad de comprensión implementada utilizando Gzip y Deflate/Inflate. Se puede acceder a él utilizando:

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

Tenga en cuenta que todas las API de zlib excepto aquellas que son explícitamente síncronas utilizan el threadpool de libuv, lo que puede tener implicaciones inesperadas y negativas en el rendimiento de algunas aplicaciones. Vea la documentación de [`UV_THREADPOOL_SIZE`][] para más información.

## Comprimiendo peticiones y respuestas HTTP

El módulo `zlib` puede ser utilizado para implementar soporte para los mecanismos de codificación de contenido `gzip` y `deflate`, definidos por [HTTP](https://tools.ietf.org/html/rfc7230#section-4.2).

La cabecera HTTP [`Accept-Encoding`][] se usa dentro de una solicitud http para identificar las codificaciones de compresión aceptadas por el cliente. La cabecera [`Content-Encoding`][] se utiliza para identificar las codificaciones de compresión realmente aplicadas a un mensaje.

*Nota*: los ejemplos que se indican a continuación se simplifican drásticamente para mostrar el concepto básico. Utilizar codificación basada en `zlib` puede resultar costosa y los resultados deben ser almacenados en caché. Vea [Ajustes en el Uso de Memoria](#zlib_memory_usage_tuning) para obtener más información sobre las operaciones en velocidad/memoria/compresión involucradas en el uso de `zlib`.

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
    // o, simplemente, usar zlib.createUnzip() para manejar ambos casos
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

Por defecto, los métodos de `zlib` van a arrojar un error al descomprimir datos truncados. De cualquier manera, si es sabido que los datos están incompletos, o se desea inspeccionar solo el principio de un archivo comprimido, es posible suprimir el manejo de error predeterminado cambiando el método que se utiliza para descomprimir el último fragmento de datos ingresado:

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

Esto no cambiará el comportamiento en otras situaciones que arrojen errores, p. ej., cuando los datos ingresados tienen un formato inválido. Usando este método, no será posible determinar si el ingreso de datos terminó prematuramente o si no posee validaciones de integridad, haciendo que sea necesaria la verificación manual de que el resultado de la descompresión es válido.

## Ajustes en el uso de Memoria

<!--type=misc-->

Desde `zlib/zconf.h`, modificado para su uso en Node.js:

Los requisitos de memoria para deflación son (en bytes):
```js
(1 << (windowBits + 2)) + (1 << (memLevel + 9))
```

Esto es: 128K para windowBits = 15 + 128K para memLevel = 8 (valores por defecto) más un par de kilobytes para objetos pequeños.

Por ejemplo, para reducir los requerimientos predeterminados de memoria de 256K a 128K, las opciones deberían ser configuradas de la siguiente manera:

```js
const options = { windowBits: 14, memLevel: 7 };
```

Sin embargo, esto generalmente degradará la compresión.

Los requerimientos de memoria para inflate son (en bytes) `1 << windowBits`. Esto es, 32K para windowBits = 15 (valor por defecto) más un par de kilobytes para objetos pequeños.

Esto es además de un único buffer interno de barra de salida de tamaño `chunkSize`, que por defecto es 16K.

La velocidad de compresión de `zlib` se ve drásticamente más afectada por la configuración de `level`. Un nivel más alto dará como resultado una mejor compresión, pero tardará más en completarse. Un nivel más bajo resultará en menos compresión, pero será mucho más rápido.

En general, mayores opciones de uso de la memoria significarán que Node.js debe hacer menos llamadas a `zlib` porque podrá procesar más datos en cada operación de `write`. Entonces, este es otro factor que afecta la velocidad, al costo del uso de la memoria.

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
--><!--type=misc-->Todas las constantes definidas en `zlib.h` se encuentran también definidas en `require('zlib').constants`. En el curso normal de operaciones, no debería ser necesario usar estas constantes. Están documentadas para que su presencia no resulte sorpresiva. Esta sección está extraída casi directamente de la [documentación de zlib](https://zlib.net/manual.html#Constants). Vea <https://zlib.net/manual.html#Constants> para más detalles.

*Nota*: Anteriormente, las constantes estaban disponibles directamente desde `require('zlib')`, por ejemplo `zlib.Z_NO_FLUSH`. Todavía es posible acceder a las constantes directamente desde el módulo, pero debe considerarse desaprobado.

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

## Clase: Options<!-- YAML
added: v0.11.1
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `dictionary` option can be an Uint8Array now.
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/6069
    description: The `finishFlush` option is supported now.
--><!--type=misc-->Cada clase toma un objeto `options`. Todas las opciones son opcionales.

Tenga en cuenta que algunas opciones solo son relevantes cuando se esta llevando a cabo una compresión, y son ignoradas por las clases de descompresión.

* `flush` {integer} **Por defecto:** `zlib.constants.Z_NO_FLUSH`
* `finishFlush` {integer} **Por defecto:** `zlib.constants.Z_FINISH`
* `chunkSize` {integer} **Por defecto:** `16 * 1024`
* `windowBits` {integer}
* `level` {integer} (solo compresión)
* `memLevel` {integer} (solo compresión)
* `strategy` {integer} (solo compresión)
* `dictionary` {Buffer|TypedArray|DataView} (únicamente deflate/inflate, diccionario vacío por defecto)
* `info` {boolean} (Si es `true`, devuelve un objecto con `buffer` y `engine`)

Vea la descripción de `deflateInit2` y `inflateInit2` en <https://zlib.net/manual.html#Advanced> para más información sobre estos.

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
                 result in an `error` event.
  - version: v5.9.0
    pr-url: https://github.com/nodejs/node/pull/5120
    description: Multiple concatenated gzip file members are supported now.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `error` event.
-->Descomprimir un stream gzip.

## Clase: zlib.Gzip<!-- YAML
added: v0.5.8
-->Comprimir datos usando gzip.

## Clase: zlib.Inflate<!-- YAML
added: v0.5.8
changes:
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `error` event.
-->Descomprimir un stream deflate.

## Clase: zlib.InflateRaw<!-- YAML
added: v0.5.8
changes:
  - version: v6.8.0
    pr-url: https://github.com/nodejs/node/pull/8512
    description: Custom dictionaries are now supported by `InflateRaw`.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `error` event.
-->Descomprimir un stream deflate sin formato.

## Clase: zlib.Unzip<!-- YAML
added: v0.5.8
-->Descomprimir un stream comprimido con Gzip o Deflate, mediante la detección automática de la cabecera.

## Clase: zlib.Zlib
<!-- YAML
added: v0.5.8
-->

No exportada por el módulo `zlib`. Está documentada aquí porque es la clase base de las clases de compresión/descompresión.

### zlib.bytesRead<!-- YAML
added: v8.1.0
-->* {number}

La propiedad `zlib.bytesRead` especifica el número de bytes leídos por el motor antes de que los bytes sean procesados (comprimidos o descomprimidos, lo que sea apropiado para la clase derivada).

### zlib.close([callback])<!-- YAML
added: v0.9.4
-->Cierra el orquestador adyacente.

### zlib.flush([kind], callback)<!-- YAML
added: v0.5.8
-->* `kind` **Por defecto:** `zlib.constants.Z_FULL_FLUSH`

Vacía los datos pendientes. No lo invoque de forma frívola, los vaciamientos prematuros impactan negativamente en la efectividad del algoritmo de compresión.

Invocar este método solo vacía los datos del estado interno de `zlib`, y no realiza un vaciado de ningún tipo a nivel de los streams. Más bien, se comporta como una llamada normal a `.write()`, es decir, se añadirá a la cola detrás de otras escrituras pendientes y solo producirá un output cuando los datos estén siendo leídos desde el stream.

### zlib.params(level, strategy, callback)<!-- YAML
added: v0.11.4
-->Actualiza dinámicamente el nivel y la estrategia de compresión. Solo aplica al algoritmo de deflate.

### zlib.reset()<!-- YAML
added: v0.7.0
-->Restablece el compresor/descompresor a sus valores predeterminados de fábrica. Solo aplicable a los algoritmos de inflate y deflate.

## zlib.constants<!-- YAML
added: v7.0.0
-->Provee un objeto que enumera constantes relacionadas a Zlib.

## zlib.createDeflate([options](#zlib_class_options))<!-- YAML
added: v0.5.8
-->Crea y devuelve un nuevo objeto [Deflate](#zlib_class_zlib_deflate) con las [options](#zlib_class_options) dadas.

## zlib.createDeflateRaw([options](#zlib_class_options))
<!-- YAML
added: v0.5.8
-->

Crea y devuelve un nuevo objeto [Deflate](#zlib_class_zlib_deflateraw) con las [options](#zlib_class_options) dadas.

*Nota*: Una actualización de zlib de 1.2.8 a 1.2.11 cambió el comportamiento cuando windowBits se establece en 8 para streams deflate sin formato. zlib establecería windowBits a 9 automáticamente si inicialmente se estableciera en 8. Las versiones más recientes de zlib arrojarán una excepción, por lo que Node.js restauró el comportamiento original de actualizar un valor de 8 a 9, ya que pasar `windowBits = 9` a zlib en realidad resulta en un stream comprimido que usa efectivamente solo una ventana de 8 bits.

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

## Métodos de conveniencia<!--type=misc-->Todos estos aceptan un [`Buffer`][], [`TypedArray`][], [`DataView`][], o string como el primer argumento, un segundo argumento opcional para suministrar opciones a las clases `zlib`, y llamará a la callback suministrada con `callback(error, result)`.

Cada método tiene una contraparte `*Sync` que acepta los mismos argumentos, pero sin una callback.

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

Descomprimir un trozo de datos con [Unzip](#zlib_class_zlib_unzip).
