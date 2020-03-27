# Stream

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

Un stream es una interfaz abstracta para trabajar con datos de streaming en Node.js. The `stream` module provides an API for implementing the stream interface.

Existen muchos objetos de stream proporcionados por Node.js. Por ejemplo, una [solicitud a un servidor HTTP](http.html#http_class_http_incomingmessage) y un [`process.stdout`][] son instancias de stream.

Los streams pueden ser legible, escribibles, o ambos. Todos los streams son instancias de [`EventEmitter`][].

To access the `stream` module:

```js
const stream = require('stream');
```

The `stream` module is useful for creating new types of stream instances. It is usually not necessary to use the `stream` module to consume streams.

## Organización de este Documento

This document contains two primary sections and a third section for notes. The first section explains how to use existing streams within an application. The second section explains how to create new types of streams.

## Tipos de Streams

Existen cuatro tipos fundamentales de stream en Node.js:

* [`Writable`][]: streams to which data can be written (for example, [`fs.createWriteStream()`][]).
* [`Readable`][]: streams from which data can be read (for example, [`fs.createReadStream()`][]).
* [`Duplex`][]: streams that are both `Readable` and `Writable` (for example, [`net.Socket`][]).
* [`Transform`][]: `Duplex` streams that can modify or transform the data as it is written and read (for example, [`zlib.createDeflate()`][]).

Additionally, this module includes the utility functions [`stream.pipeline()`][], [`stream.finished()`][] and [`stream.Readable.from()`][].

### Modo Objeto

All streams created by Node.js APIs operate exclusively on strings and `Buffer` (or `Uint8Array`) objects. It is possible, however, for stream implementations to work with other types of JavaScript values (with the exception of `null`, which serves a special purpose within streams). Such streams are considered to operate in "object mode".

Las instancias de stream se cambian al modo objeto utilizando la opción `objectMode` cuando se crea el stream. Intentar cambiar un stream existente al modo objeto, no es seguro.

### Almacenamiento en Buffer

<!--type=misc-->

Both [`Writable`][] and [`Readable`][] streams will store data in an internal buffer that can be retrieved using `writable.writableBuffer` or `readable.readableBuffer`, respectively.

The amount of data potentially buffered depends on the `highWaterMark` option passed into the stream's constructor. For normal streams, the `highWaterMark` option specifies a [total number of bytes](#stream_highwatermark_discrepancy_after_calling_readable_setencoding). Para los streams que operan en modo objeto, `highWaterMark` especifica un número total de objetos.

Data is buffered in `Readable` streams when the implementation calls [`stream.push(chunk)`](#stream_readable_push_chunk_encoding). Si el consumidor del Stream no llama a [`stream.read()`](#stream_readable_read_size), los datos se quedarán en la cola interna hasta que se consumen.

Una vez que el tamaño total del buffer de lectura interno alcanza el límite especificado por `highWaterMark`, el stream parará temporalmente de leer los datos desde el recurso subyacente, hasta que los datos almacenados en buffer actualmente se puedan consumir (es decir, el stream parará de llamar al método `readable._read()` interno que se utiliza para llenar el buffer de lectura).

Data is buffered in `Writable` streams when the [`writable.write(chunk)`](#stream_writable_write_chunk_encoding_callback) method is called repeatedly. Mientras el tamaño total del buffer de escritura interno sea inferior al límite establecido por `highWaterMark`, las llamadas a `writable.write()` devolverán `true`. Una vez el tamaño del buffer interno alcanza o excede el `highWaterMark`, se devolverá `false`.

A key goal of the `stream` API, particularly the [`stream.pipe()`][] method, is to limit the buffering of data to acceptable levels such that sources and destinations of differing speeds will not overwhelm the available memory.

Because [`Duplex`][] and [`Transform`][] streams are both `Readable` and `Writable`, each maintains *two* separate internal buffers used for reading and writing, allowing each side to operate independently of the other while maintaining an appropriate and efficient flow of data. For example, [`net.Socket`][] instances are [`Duplex`][] streams whose `Readable` side allows consumption of data received *from* the socket and whose `Writable` side allows writing data *to* the socket. Because data may be written to the socket at a faster or slower rate than data is received, each side should operate (and buffer) independently of the other.

## API para los Consumidores de Stream

<!--type=misc-->

Casi todas las aplicaciones de Node.js, no importa lo simples que sean, utilizan streams de alguna manera. El siguiente, es un ejemplo del uso de streams en una aplicación de Node.js que implementa un servidor HTTP:

```js
const http = require('http');

const server = http.createServer((req, res) => {
  // `req` is an http.IncomingMessage, which is a Readable Stream.
  // `res` is an http.ServerResponse, which is a Writable Stream.

  let body = '';
  // Get the data as utf8 strings.
  // Si no se establece una codificación, se recibirán los objetos de Buffer.
  req.setEncoding('utf8');

  // Readable streams emit 'data' events once a listener is added.
  req.on('data', (chunk) => {
    body += chunk;
  });

  // The 'end' event indicates that the entire body has been received.
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      // Write back something interesting to the user:
      res.write(typeof data);
      res.end();
    } catch (er) {
      // uh oh! ¡json malo!
      res.statusCode = 400;
      return res.end(`error: ${er.message}`);
    }
  });
});

server.listen(1337);

// $ curl localhost:1337 -d "{}"
// objeto
// $ curl localhost:1337 -d "\"foo\""
// string
// $ curl localhost:1337 -d "not json"
// error: Token o inesperado en JSON en la posición 1
```

[`Writable`][] streams (such as `res` in the example) expose methods such as `write()` and `end()` that are used to write data onto the stream.

[`Readable`][] streams use the [`EventEmitter`][] API for notifying application code when data is available to be read off the stream. Esos datos disponibles pueden leerse del stream de múltiples maneras.

Both [`Writable`][] and [`Readable`][] streams use the [`EventEmitter`][] API in various ways to communicate the current state of the stream.

[`Duplex`][] and [`Transform`][] streams are both [`Writable`][] and [`Readable`][].

Las aplicaciones que escriben o consumen datos de un stream no requieren implementar interfaces de stream directamente y, por lo general, no tendrán razones para llamar a `require('stream')`.

Los desarrolladores que deseen implementar nuevos tipos de streams deben consultar la sección [API para Implementadores de Stream](#stream_api_for_stream_implementers).

### Streams Escribibles

Writable streams are an abstraction for a *destination* to which data is written.

Ejemplos de streams [`Writable`][] streams incluyen:

* [solicitudes HTTP, en el cliente](http.html#http_class_http_clientrequest)
* [respuestas HTTP, en el servidor](http.html#http_class_http_serverresponse)
* [streams de escritura del fs](fs.html#fs_class_fs_writestream)
* [streams zlib](zlib.html)
* [streams crypto](crypto.html)
* [sockets TCP](net.html#net_class_net_socket)
* [stdin de proceso secundario](child_process.html#child_process_subprocess_stdin)
* [`process.stdout`][], [`process.stderr`][]

Some of these examples are actually [`Duplex`][] streams that implement the [`Writable`][] interface.

All [`Writable`][] streams implement the interface defined by the `stream.Writable` class.

While specific instances of [`Writable`][] streams may differ in various ways, all `Writable` streams follow the same fundamental usage pattern as illustrated in the example below:

```js
const myStream = getWritableStreamSomehow();
myStream.write('some data');
myStream.write('some more data');
myStream.end('done writing data');
```

#### Class: `stream.Writable`
<!-- YAML
added: v0.9.4
-->

<!--type=class-->

##### Event: `'close'`
<!-- YAML
added: v0.9.4
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18438
    description: Add `emitClose` option to specify if `'close'` is emitted on
                 destroy.
-->

El evento `'close'` se emite cuando el stream y cualquiera de sus recursos subyacentes (un descriptor de archivo, por ejemplo) se han cerrado. El evento indica que no se emitirán más eventos, y no se realizarán más cálculos.

A [`Writable`][] stream will always emit the `'close'` event if it is created with the `emitClose` option.

##### Event: `'drain'`
<!-- YAML
added: v0.9.4
-->

Si una llamada a [`stream.write(chunk)`](#stream_writable_write_chunk_encoding_callback) devuelve `false`, el evento de `'drain'` se emitirá cuando sea apropiado reanudar la escritura de datos en el stream.

```js
// Escribe los datos en el stream escribible suministrado un millón de veces.
// Esté atento a la contrapresión.
function writeOneMillionTimes(writer, data, encoding, callback) {
  let i = 1000000;
  write();
  function write() {
    let ok = true;
    do {
      i--;
      if (i === 0) {
        // Last time!
        writer.write(data, encoding, callback);
      } else {
        // See if we should continue, or wait.
        // Don't pass the callback, because we're not done yet.
        ok = writer.write(data, encoding);
      }
    } while (i > 0 && ok);
    if (i > 0) {
      // Had to stop early!
      // Write some more once it drains.
      writer.once('drain', write);
    }
  }
}
```

##### Event: `'error'`
<!-- YAML
added: v0.9.4
-->

* {Error}

El evento de `'error'` se emite si un error se produjo mientras se escribían o canalizaban datos. El callback listener pasa un solo argumento de `Error` cuando se llama.

The stream is not closed when the `'error'` event is emitted unless the [`autoDestroy`](#stream_constructor_new_stream_writable_options) option was set to `true` when creating the stream.

##### Event: `'finish'`
<!-- YAML
added: v0.9.4
-->

El evento `'finish'` es emitido después que el método [`stream.end()`](#stream_writable_end_chunk_encoding_callback) ha sido llamado, y todos los datos han sido vaciados al sistema subyacente.

```js
const writer = getWritableStreamSomehow();
for (let i = 0; i < 100; i++) {
  writer.write(`hello, #${i}!\n`);
}
writer.on('finish', () => {
  console.log('All writes are now complete.');
});
writer.end('This is the end\n');
```

##### Event: `'pipe'`
<!-- YAML
added: v0.9.4
-->

* `src` {stream.Readable} el stream fuente que está haciendo piping a este escribible

El evento `'pipe'` se emite cuando el método [`stream.pipe()`][] es llamado en un stream legible, añadiendo este elemento escribible a su conjunto de destinos.

```js
const writer = getWritableStreamSomehow();
const reader = getReadableStreamSomehow();
writer.on('pipe', (src) => {
  console.log('Something is piping into the writer.');
  assert.equal(src, reader);
});
reader.pipe(writer);
```

##### Event: `'unpipe'`
<!-- YAML
added: v0.9.4
-->

* `src` {stream.Readable} El stream fuente que hizo [unpiped][`stream.unpipe()`] en este escribible

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

##### `writable.cork()`
<!-- YAML
added: v0.11.2
-->

El método `writable.cork()` fuerza a que todos los datos escribibles sean almacenados en la memoria. Los datos almacenados en buffer se vaciarán cuando se llamen los métodos [`stream.uncork()`][] o [`stream.end()`](#stream_writable_end_chunk_encoding_callback).

The primary intent of `writable.cork()` is to accommodate a situation in which several small chunks are written to the stream in rapid succession. Instead of immediately forwarding them to the underlying destination, `writable.cork()` buffers all the chunks until `writable.uncork()` is called, which will pass them all to `writable._writev()`, if present. This prevents a head-of-line blocking situation where data is being buffered while waiting for the first small chunk to be processed. However, use of `writable.cork()` without implementing `writable._writev()` may have an adverse effect on throughput.

See also: [`writable.uncork()`][], [`writable._writev()`](#stream_writable_writev_chunks_callback).

##### `writable.destroy([error])`
<!-- YAML
added: v8.0.0
-->

* `error` {Error} Optional, an error to emit with `'error'` event.
* Devuelve: {this}

Destroy the stream. Optionally emit an `'error'` event, and emit a `'close'` event (unless `emitClose` is set to `false`). After this call, the writable stream has ended and subsequent calls to `write()` or `end()` will result in an `ERR_STREAM_DESTROYED` error. This is a destructive and immediate way to destroy a stream. Previous calls to `write()` may not have drained, and may trigger an `ERR_STREAM_DESTROYED` error. Use `end()` instead of destroy if data should flush before close, or wait for the `'drain'` event before destroying the stream. Implementors should not override this method, but instead implement [`writable._destroy()`](#stream_writable_destroy_err_callback).

##### `writable.destroyed`
<!-- YAML
added: v8.0.0
-->

* {boolean}

Is `true` after [`writable.destroy()`](#stream_writable_destroy_error) has been called.

##### `writable.end([chunk[, encoding]][, callback])`
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

* `chunk` {string|Buffer|Uint8Array|any} Datos opcionales para escribir. For streams not operating in object mode, `chunk` must be a string, `Buffer` or `Uint8Array`. For object mode streams, `chunk` may be any JavaScript value other than `null`.
* `encoding` {string} The encoding if `chunk` is a string
* `callback` {Function} Callback opcional para cuando el stream se finalice
* Devuelve: {this}

Calling the `writable.end()` method signals that no more data will be written to the [`Writable`][]. Los argumentos `chunk` y `encoding` opcionales permiten escribir una última pieza adicional de datos inmediatamente antes de cerrar el stream. Si se proporciona, la función `callback` opcional se adjunta como un listener para el evento de [`'finish'`][].

Llamar al método [`stream.write()`](#stream_writable_write_chunk_encoding_callback) después de llamar a [`stream.end()`](#stream_writable_end_chunk_encoding_callback) levantará un error.

```js
// Write 'hello, ' and then end with 'world!'.
const fs = require('fs');
const file = fs.createWriteStream('example.txt');
file.write('hello, ');
file.end('world!');
// Writing more now is not allowed!
```

##### `writable.setDefaultEncoding(encoding)`
<!-- YAML
added: v0.11.15
changes:
  - version: v6.1.0
    pr-url: https://github.com/nodejs/node/pull/5040
    description: This method now returns a reference to `writable`.
-->

* `encoding` {string} La nueva codificación predeterminada
* Devuelve: {this}

The `writable.setDefaultEncoding()` method sets the default `encoding` for a [`Writable`][] stream.

##### `writable.uncork()`
<!-- YAML
added: v0.11.2
-->

El método `writable.uncork()` vacía todos los datos almacenados en el buffer desde que [`stream.cork()`][] se llamó.

Cuando se utilizan [`writable.cork()`][] y `writable.uncork()` para administrar el almacenamiento en buffer de las escrituras en un stream, se recomienda que las llamadas a `writable.uncork()` se difieran utilizando `process.nextTick()`. Al hacerlo, se permite procesar por lotes todas las llamadas `writable.write()` que ocurren dentro de una fase de bucle de eventos de Node.js dada.

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
  // Los datos no se vaciarán hasta que se llame a uncork() por segunda vez.
  stream.uncork();
});
```

Vea también: [`writable.cork()`][].

##### `writable.writable`
<!-- YAML
added: v11.4.0
-->

* {boolean}

Is `true` if it is safe to call [`writable.write()`](#stream_writable_write_chunk_encoding_callback).

##### `writable.writableEnded`
<!-- YAML
added: v12.9.0
-->

* {boolean}

Is `true` after [`writable.end()`][] has been called. This property does not indicate whether the data has been flushed, for this use [`writable.writableFinished`][] instead.

##### `writable.writableCorked`
<!-- YAML
added: v12.16.0
-->

* {integer}

Number of times [`writable.uncork()`](#stream_writable_uncork) needs to be called in order to fully uncork the stream.

##### `writable.writableFinished`
<!-- YAML
added: v12.6.0
-->

* {boolean}

Is set to `true` immediately before the [`'finish'`][] event is emitted.

##### `writable.writableHighWaterMark`
<!-- YAML
added: v9.3.0
-->

* {number}

Return the value of `highWaterMark` passed when constructing this `Writable`.

##### `writable.writableLength`
<!-- YAML
added: v9.4.0
-->

* {number}

This property contains the number of bytes (or objects) in the queue ready to be written. The value provides introspection data regarding the status of the `highWaterMark`.

##### `writable.writableObjectMode`
<!-- YAML
added: v12.3.0
-->

* {boolean}

Getter for the property `objectMode` of a given `Writable` stream.

##### `writable.write(chunk[, encoding][, callback])`
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

* `chunk` {string|Buffer|Uint8Array|any} Datos opcionales para escribir. For streams not operating in object mode, `chunk` must be a string, `Buffer` or `Uint8Array`. For object mode streams, `chunk` may be any JavaScript value other than `null`.
* `encoding` {string} La codificación si `chunk` es un string
* `callback` {Function} Callback para cuando esta pieza de datos se vacíe
* Devuelve: {boolean} `false` si el stream desea que el código de llamada espere a que se emita el evento de `'drain'` antes de continuar escribiendo datos adicionales; de lo contrarió es `true`.

El método `writable.write()` escribe algunos datos en el stream, y llama al `callback` suministrado una vez que los datos se han manejado completamente. If an error occurs, the `callback` *may or may not* be called with the error as its first argument. Para detectar confiablemente errores de escritura, agregue un listener para el evento de `'error'`.

El valor devuelto es `true` si el buffer interno es menor que el `highWaterMark` configurado cuando se creó el stream después de admitir el `chunk`. Si se devuelve `false`, los intentos adicionales para escribir datos en el stream deberían detenerse hasta que el evento de [`'drain'`][] se emita.

Mientras que un stream no esté draining, llamadas a `write()` almacenaran `chunk`, y devolverán false. Una vez que todos los fragmentos almacenados son vaciados (aceptado para entrega por el sistema operativo), el evento `'drain'` será emitido. It is recommended that once `write()` returns false, no more chunks be written until the `'drain'` event is emitted. Mientras se llame `write()` en un stream donde el vaciado no está permitido, Node.js va a almacenar todos los fragmentos escritos hasta que el uso máximo de la memoria ocurra, en ese punto se anulará incondicionalmente. Incluso antes de que se anule, alto uso de la memoria causará un pobre desempeño del colector de basura, y un RSS alto (que no es típicamente liberado de vuelta al sistema, incluso después que la memoria ya no es requerida). Dado que los sockets TCP no pueden ser drenados si el peer remoto no lee los datos, escribir un socket que no se está vaciando puede llevar a vulnerabilidad explotable remota.

Writing data while the stream is not draining is particularly problematic for a [`Transform`][], because the `Transform` streams are paused by default until they are piped or a `'data'` or `'readable'` event handler is added.

If the data to be written can be generated or fetched on demand, it is recommended to encapsulate the logic into a [`Readable`][] and use [`stream.pipe()`][]. Sin embargo, si se prefiere llamar a `write()`, es posible respetar la contrapresión y evitar problemas de memoria usando el evento [`'drain'`][]:

```js
function write(data, cb) {
  if (!stream.write(data)) {
    stream.once('drain', cb);
  } else {
    process.nextTick(cb);
  }
}

// Espera que se llame cb antes de escribir algo más.
write('hello', () => {
  console.log('Write completed, do more writes now.');
});
```

Un stream `Writable` en modo objeto siempre ignorará el argumento `encoding`.

### Streams Legibles

Readable streams are an abstraction for a *source* from which data is consumed.

Ejemplos de streams `Readable` inlcuyen:

* [respuestas HTTP, en el cliente](http.html#http_class_http_incomingmessage)
* [solicitudes HTTP, en el servidor](http.html#http_class_http_incomingmessage)
* [streams de lectura del fs](fs.html#fs_class_fs_readstream)
* [streams zlib](zlib.html)
* [streams crypto](crypto.html)
* [sockets TCP](net.html#net_class_net_socket)
* [procesos secundarios stdout y stderr](child_process.html#child_process_subprocess_stdout)
* [`process.stdin`][]

All [`Readable`][] streams implement the interface defined by the `stream.Readable` class.

#### Two Reading Modes

`Readable` streams effectively operate in one of two modes: flowing and paused. These modes are separate from [object mode](#stream_object_mode). A [`Readable`][] stream can be in object mode or not, regardless of whether it is in flowing mode or paused mode.

* In flowing mode, data is read from the underlying system automatically and provided to an application as quickly as possible using events via the [`EventEmitter`][] interface.

* En el modo pausado, el método [`stream.read()`](#stream_readable_read_size) debe ser llamado explícitamente para leer piezas de datos desde el stream.

All [`Readable`][] streams begin in paused mode but can be switched to flowing mode in one of the following ways:

* Agregar un manejador de eventos de [`'data'`][].
* Llamar al método de [`stream.resume()`](#stream_readable_resume).
* Llamar al método [`stream.pipe()`][] para enviar los datos a un [`Writable`][].

El `Readable` puede ser cambiado de vuelta al modo pausado usando alguno de los siguientes:

* Si no existen destinos pipe, al llamar al método [`stream.pause()`](#stream_readable_pause).
* Si existen destinos pipe, al remover todos los destinos pipe. Multiple pipe destinations may be removed by calling the [`stream.unpipe()`][] method.

The important concept to remember is that a `Readable` will not generate data until a mechanism for either consuming or ignoring that data is provided. If the consuming mechanism is disabled or taken away, the `Readable` will *attempt* to stop generating the data.

For backward compatibility reasons, removing [`'data'`][] event handlers will **not** automatically pause the stream. Also, if there are piped destinations, then calling [`stream.pause()`](#stream_readable_pause) will not guarantee that the stream will *remain* paused once those destinations drain and ask for more data.

If a [`Readable`][] is switched into flowing mode and there are no consumers available to handle the data, that data will be lost. This can occur, for instance, when the `readable.resume()` method is called without a listener attached to the `'data'` event, or when a `'data'` event handler is removed from the stream.

Adding a [`'readable'`][] event handler automatically make the stream to stop flowing, and the data to be consumed via [`readable.read()`](#stream_readable_read_size). If the [`'readable'`][] event handler is removed, then the stream will start flowing again if there is a [`'data'`][] event handler.

#### Tres Estados

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
// readableFlowing is now false.

pass.on('data', (chunk) => { console.log(chunk.toString()); });
pass.write('ok');  // Will not emit 'data'.
pass.resume();     // Must be called to make stream emit 'data'.
```

While `readable.readableFlowing` is `false`, data may be accumulating within the stream's internal buffer.

#### Choose One API Style

The `Readable` stream API evolved across multiple Node.js versions and provides multiple methods of consuming stream data. In general, developers should choose *one* of the methods of consuming data and *should never* use multiple methods to consume data from a single stream. Specifically, using a combination of `on('data')`, `on('readable')`, `pipe()`, or async iterators could lead to unintuitive behavior.

Para la mayoría de los usuarios se recomienda utilizar el método `readable.pipe()`, ya que se ha implementado para proporcionar la manera más sencilla de consumir datos de stream. Developers that require more fine-grained control over the transfer and generation of data can use the [`EventEmitter`][] and `readable.on('readable')`/`readable.read()` or the `readable.pause()`/`readable.resume()` APIs.

#### Class: `stream.Readable`
<!-- YAML
added: v0.9.4
-->

<!--type=class-->

##### Event: `'close'`
<!-- YAML
added: v0.9.4
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18438
    description: Add `emitClose` option to specify if `'close'` is emitted on
                 destroy.
-->

El evento `'close'` se emite cuando el stream y cualquiera de sus recursos subyacentes (un descriptor de archivo, por ejemplo) se han cerrado. El evento indica que no se emitirán más eventos, y no se realizarán más cálculos.

A [`Readable`][] stream will always emit the `'close'` event if it is created with the `emitClose` option.

##### Event: `'data'`
<!-- YAML
added: v0.9.4
-->

* `chunk` {Buffer|string|any} La pieza de datos. Para streams que no están operando en el modo objeto, la pieza será una cadena o un `Buffer`. Para streams que están en el modo objeto, la pieza puede ser cualquier valor JavaScript diferente a `null`.

El evento de `'data'` se emite cuando el stream está cediendo la propiedad de una pieza de datos a un consumidor. Esto puede ocurrir cada vez que el stream se cambie al modo fluido para llamar a `readable.pipe()`, `readable.resume()`, o al adjuntar un callback del listener al evento de `'data'`. El evento de `'data'` también se emitirá siempre que el método `readable.read()` sea llamado y una pieza de datos esté disponible para ser devuelta.

Adjuntar un listener del evento de `'data'` a un stream que no ha sido pausado explícitamente cambiará el stream al modo fluido. Entonces, los datos se pasarán tan pronto como estén disponibles.

El callback del listener se pasará a la pieza de datos como una cadena si una codificación predeterminada se ha especificado para el stream utilizando el método `readable.setEncoding()`; de lo contrario, los datos serán pasados como un `Buffer`.

```js
const readable = getReadableStreamSomehow();
readable.on('data', (chunk) => {
  console.log(`Received ${chunk.length} bytes of data.`);
});
```

##### Event: `'end'`
<!-- YAML
added: v0.9.4
-->

El evento `'end'` se emite cuando no hay más datos para ser consumidos del stream.

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

##### Event: `'error'`
<!-- YAML
added: v0.9.4
-->

* {Error}

El evento `'error'` puede ser emitido por una implementación de `Readable` en cualquier momento. En general, esto puede suceder si el stream subyacente es incapaz de generar datos debido a un fallo interno subyacente, o cuando una implementación del stream intenta enviar una pieza de datos inválida.

Al callback del listener se le pasará un solo objeto de `Error`.

##### Event: `'pause'`
<!-- YAML
added: v0.9.4
-->

The `'pause'` event is emitted when [`stream.pause()`](#stream_readable_pause) is called and `readableFlowing` is not `false`.

##### Event: `'readable'`
<!-- YAML
added: v0.9.4
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17979
    description: The `'readable'` is always emitted in the next tick after
                 `.push()` is called.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18994
    description: Using `'readable'` requires calling `.read()`.
-->

El evento `'readable'` se emite cuando hay datos disponibles para leerse desde el stream. En algunos casos, adjuntar un listener a un evento `'readable'` causará que cierta cantidad de datos se lea en un buffer interno.

```javascript
const readable = getReadableStreamSomehow();
readable.on('readable', function() {
  // There is some data to read now.
  let data;

  while (data = this.read()) {
    console.log(data);
  }
});
```

El evento `'readable'` también se emitirá una vez que se haya alcanzado el final de los datos del stream, pero antes de que se emita el evento `'end'`.

Efectivamente, el evento `'readable'` indica que el stream tiene nueva información: ya sean nuevos datos disponibles o que se ha alcanzado el final del stream. En el primer caso, [`stream.read()`](#stream_readable_read_size) devolverá los datos disponibles. En el último caso, [`stream.read()`](#stream_readable_read_size) devolverá `null`. Por ejemplo, en el siguiente caso, `foo.txt` es un archivo vacío:

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

El output de la ejecución de este script es:

```console
$ node test.js
readable: null
end
```

In general, the `readable.pipe()` and `'data'` event mechanisms are easier to understand than the `'readable'` event. However, handling `'readable'` might result in increased throughput.

If both `'readable'` and [`'data'`][] are used at the same time, `'readable'` takes precedence in controlling the flow, i.e. `'data'` will be emitted only when [`stream.read()`](#stream_readable_read_size) is called. The `readableFlowing` property would become `false`. If there are `'data'` listeners when `'readable'` is removed, the stream will start flowing, i.e. `'data'` events will be emitted without calling `.resume()`.

##### Event: `'resume'`
<!-- YAML
added: v0.9.4
-->

The `'resume'` event is emitted when [`stream.resume()`](#stream_readable_resume) is called and `readableFlowing` is not `true`.

##### `readable.destroy([error])`
<!-- YAML
added: v8.0.0
-->

* `error` {Error} Error que será pasado como una carga en el evento `'error'`
* Devuelve: {this}

Destroy the stream. Optionally emit an `'error'` event, and emit a `'close'` event (unless `emitClose` is set to `false`). After this call, the readable stream will release any internal resources and subsequent calls to `push()` will be ignored. Implementors should not override this method, but instead implement [`readable._destroy()`](#stream_readable_destroy_err_callback).

##### `readable.destroyed`
<!-- YAML
added: v8.0.0
-->

* {boolean}

Is `true` after [`readable.destroy()`](#stream_readable_destroy_error) has been called.

##### `readable.isPaused()`
<!-- YAML
added: v0.11.14
-->

* Devuelve: {boolean}

The `readable.isPaused()` method returns the current operating state of the `Readable`. Esto es utilizado principalmente por el mecanismo subyacente al método `readable.pipe()`. En la mayorías de los casos típicos, no habrá razones para utilizar este método directamente.

```js
const readable = new stream.Readable();

readable.isPaused(); // === false
readable.pause();
readable.isPaused(); // === true
readable.resume();
readable.isPaused(); // === false
```

##### `readable.pause()`
<!-- YAML
added: v0.9.4
-->

* Devuelve: {this}

El método `readable.pause()` causará que un stream en el modo fluido detenga la emisión de eventos de [`'data'`][], y salga del modo fluido. Todos los datos que estén disponibles permanecerán en el buffer interno.

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

##### `readable.pipe(destination[, options])`
<!-- YAML
added: v0.9.4
-->

* `destination` {stream.Writable} El destino para escribir datos
* `options` {Object} Pipe options
  * `end` {boolean} Finaliza el escritor cuando termina el lector. **Default:** `true`.
* Returns: {stream.Writable} The *destination*, allowing for a chain of pipes if it is a [`Duplex`][] or a [`Transform`][] stream

The `readable.pipe()` method attaches a [`Writable`][] stream to the `readable`, causing it to switch automatically into flowing mode and push all of its data to the attached [`Writable`][]. The flow of data will be automatically managed so that the destination `Writable` stream is not overwhelmed by a faster `Readable` stream.

El siguiente ejemplo hace pipe en todos los datos del `readable` a un archivo llamado `file.txt`:

```js
const fs = require('fs');
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// All the data from readable goes into 'file.txt'.
readable.pipe(writable);
```

It is possible to attach multiple `Writable` streams to a single `Readable` stream.

The `readable.pipe()` method returns a reference to the *destination* stream making it possible to set up chains of piped streams:

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

One important caveat is that if the `Readable` stream emits an error during processing, the `Writable` destination *is not closed* automatically. If an error occurs, it will be necessary to *manually* close each stream in order to prevent memory leaks.

The [`process.stderr`][] and [`process.stdout`][] `Writable` streams are never closed until the Node.js process exits, regardless of the specified options.

##### `readable.read([size])`
<!-- YAML
added: v0.9.4
-->

* `size` {number} Argumento opcional para especificar la cantidad de datos a leer.
* Devuelve: {string|Buffer|null|any}

El método `readable.read()` saca algunos datos del buffer interno y los devuelve. Si no hay datos disponibles para leer, se devuelve `null`. Por defecto, los datos se devolverán como un objeto de `Buffer`, a menos que se haya especificado una codificación utilizando el método `readable.setEncoding()` o el stream se opere en el modo objeto.

El argumento opcional `size` especifica un número determinado de bytes a leer. If `size` bytes are not available to be read, `null` will be returned *unless* the stream has ended, in which case all of the data remaining in the internal buffer will be returned.

Si el argumento `size` no se especifica, se devolverán todos los datos en el buffer interno.

The `size` argument must be less than or equal to 1 GB.

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

The `while` loop is necessary when processing data with `readable.read()`. Only after `readable.read()` returns `null`, [`'readable'`][] will be emitted.

A `Readable` stream in object mode will always return a single item from a call to [`readable.read(size)`](#stream_readable_read_size), regardless of the value of the `size` argument.

If the `readable.read()` method returns a chunk of data, a `'data'` event will also be emitted.

Calling [`stream.read([size])`](#stream_readable_read_size) after the [`'end'`][] event has been emitted will return `null`. No se levantará ningún error runtime.

##### `readable.readable`
<!-- YAML
added: v11.4.0
-->

* {boolean}

Is `true` if it is safe to call [`readable.read()`](#stream_readable_read_size).

##### `readable.readableEncoding`
<!-- YAML
added: v12.7.0
-->

* {null|string}

Getter for the property `encoding` of a given `Readable` stream. The `encoding` property can be set using the [`readable.setEncoding()`][] method.

##### `readable.readableEnded`
<!-- YAML
added: v12.9.0
-->

* {boolean}

Becomes `true` when [`'end'`][] event is emitted.

##### `readable.readableFlowing`
<!-- YAML
added: v9.4.0
-->

* {boolean}

This property reflects the current state of a `Readable` stream as described in the [Stream Three States](#stream_three_states) section.

##### `readable.readableHighWaterMark`
<!-- YAML
added: v9.3.0
-->

* {number}

Returns the value of `highWaterMark` passed when constructing this `Readable`.

##### `readable.readableLength`
<!-- YAML
added: v9.4.0
-->

* {number}

This property contains the number of bytes (or objects) in the queue ready to be read. The value provides introspection data regarding the status of the `highWaterMark`.

##### `readable.readableObjectMode`
<!-- YAML
added: v12.3.0
-->

* {boolean}

Getter for the property `objectMode` of a given `Readable` stream.

##### `readable.resume()`
<!-- YAML
added: v0.9.4
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18994
    description: The `resume()` has no effect if there is a `'readable'` event
                 listening.
-->

* Devuelve: {this}

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

##### `readable.setEncoding(encoding)`
<!-- YAML
added: v0.9.4
-->

* `encoding` {string} La codificación a usar.
* Devuelve: {this}

The `readable.setEncoding()` method sets the character encoding for data read from the `Readable` stream.

De manera predeterminada, no se asigna ninguna codificación y los datos del stream se van a devolver como objetos `Buffer`. Establecer una codificación causa que los datos del stream sean devueltos como strings de la codificación especificada en vez de un objeto `Buffer`. Por ejemplo, llamar a `readable.setEncoding('utf8')` causará que la salida de datos sea interpretada como datos UTF.8, y sean pasados como strings. Llamar a `readable.setEncoding('hex')` causará que los datos sean codificados en un formato string hexadecimal.

The `Readable` stream will properly handle multi-byte characters delivered through the stream that would otherwise become improperly decoded if simply pulled from the stream as `Buffer` objects.

```js
const readable = getReadableStreamSomehow();
readable.setEncoding('utf8');
readable.on('data', (chunk) => {
  assert.equal(typeof chunk, 'string');
  console.log('Got %d characters of string data:', chunk.length);
});
```

##### `readable.unpipe([destination])`
<!-- YAML
added: v0.9.4
-->

* `destination` {stream.Writable} Stream específico opcional para no hacer pipe
* Devuelve: {this}

The `readable.unpipe()` method detaches a `Writable` stream previously attached using the [`stream.pipe()`][] method.

If the `destination` is not specified, then *all* pipes are detached.

Si el `destination` es especificado, pero no se configura ningún pipe para él. entonces el método no hace nada.

```js
const fs = require('fs');
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// All the data from readable goes into 'file.txt',
// but only for the first second.
readable.pipe(writable);
setTimeout(() => {
  console.log('Stop writing to file.txt.');
  readable.unpipe(writable);
  console.log('Manually close the file stream.');
  writable.end();
}, 1000);
```

##### `readable.unshift(chunk[, encoding])`
<!-- YAML
added: v0.9.11
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->

* `chunk` {Buffer|Uint8Array|string|null|any} Chunk of data to unshift onto the read queue. For streams not operating in object mode, `chunk` must be a string, `Buffer`, `Uint8Array` or `null`. For object mode streams, `chunk` may be any JavaScript value.
* `encoding` {string} Codificación de los fragmentos string. Must be a valid `Buffer` encoding, such as `'utf8'` or `'ascii'`.

Passing `chunk` as `null` signals the end of the stream (EOF) and behaves the same as `readable.push(null)`, after which no more data can be written. The EOF signal is put at the end of the buffer and any buffered data will still be flushed.

El método `readable.unshift()` empuja un fragmento de datos de vuelta al búfer interno. Esto es útil en ciertas situaciones, cuando un stream está siendo consumido por código que necesita "no-consumir" alguna cantidad de datos que ha sido sacada de forma optimista de la fuente, para que los datos puedan ser pasados a otra parte.

The `stream.unshift(chunk)` method cannot be called after the [`'end'`][] event has been emitted or a runtime error will be thrown.

Developers using `stream.unshift()` often should consider switching to use of a [`Transform`][] stream instead. Vea la sección [API para los Implementadores de Stream](#stream_api_for_stream_implementers) para más información.

```js
// Pull off a header delimited by \n\n.
// Use unshift() if we get too much.
// Call the callback with (error, header, stream).
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
        // Found the header boundary.
        const split = str.split(/\n\n/);
        header += split.shift();
        const remaining = split.join('\n\n');
        const buf = Buffer.from(remaining, 'utf8');
        stream.removeListener('error', callback);
        // Remove the 'readable' listener before unshifting.
        stream.removeListener('readable', onReadable);
        if (buf.length)
          stream.unshift(buf);
        // Now the body of the message can be read from the stream.
        callback(null, header, stream);
      } else {
        // Still reading the header.
        header += str;
      }
    }
  }
}
```

Unlike [`stream.push(chunk)`](#stream_readable_push_chunk_encoding), `stream.unshift(chunk)` will not end the reading process by resetting the internal reading state of the stream. This can cause unexpected results if `readable.unshift()` is called during a read (i.e. from within a [`stream._read()`](#stream_readable_read_size_1) implementation on a custom stream). Following the call to `readable.unshift()` with an immediate [`stream.push('')`](#stream_readable_push_chunk_encoding) will reset the reading state appropriately, however it is best to simply avoid calling `readable.unshift()` while in the process of performing a read.

##### `readable.wrap(stream)`
<!-- YAML
added: v0.9.4
-->

* `stream` {Stream} Un stream legible de "viejo estilo"
* Devuelve: {this}

Prior to Node.js 0.10, streams did not implement the entire `stream` module API as it is currently defined. (See [Compatibility](#stream_compatibility_with_older_node_js_versions) for more information.)

When using an older Node.js library that emits [`'data'`][] events and has a [`stream.pause()`](#stream_readable_pause) method that is advisory only, the `readable.wrap()` method can be used to create a [`Readable`][] stream that uses the old stream as its data source.

Rara vez será necesario usar `readable.wrap()` pero el método ha sido proporcionado como una conveniencia para interactuar con aplicaciones y bibliotecas más viejas.

```js
const { OldReader } = require('./old-api-module.js');
const { Readable } = require('stream');
const oreader = new OldReader();
const myReader = new Readable().wrap(oreader);

myReader.on('readable', () => {
  myReader.read(); // etc.
});
```

##### `readable[Symbol.asyncIterator]()`
<!-- YAML
added: v10.0.0
changes:
  - version: v11.14.0
    pr-url: https://github.com/nodejs/node/pull/26989
    description: Symbol.asyncIterator support is no longer experimental.
-->

* Returns: {AsyncIterator} to fully consume the stream.

```js
const fs = require('fs');

async function print(readable) {
  readable.setEncoding('utf8');
  let data = '';
  for await (const chunk of readable) {
    data += chunk;
  }
  console.log(data);
}

print(fs.createReadStream('file')).catch(console.error);
```

If the loop terminates with a `break` or a `throw`, the stream will be destroyed. In other terms, iterating over a stream will consume the stream fully. The stream will be read in chunks of size equal to the `highWaterMark` option. In the code example above, data will be in a single chunk if the file has less then 64kb of data because no `highWaterMark` option is provided to [`fs.createReadStream()`][].

### Streams Duplex y de Transformación

#### Class: `stream.Duplex`
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

* [sockets TCP](net.html#net_class_net_socket)
* [streams zlib](zlib.html)
* [streams crypto](crypto.html)

#### Class: `stream.Transform`
<!-- YAML
added: v0.9.4
-->

<!--type=class-->

Transform streams are [`Duplex`][] streams where the output is in some way related to the input. Like all [`Duplex`][] streams, `Transform` streams implement both the [`Readable`][] and [`Writable`][] interfaces.

Examples of `Transform` streams include:

* [streams zlib](zlib.html)
* [streams crypto](crypto.html)

##### `transform.destroy([error])`
<!-- YAML
added: v8.0.0
-->

* `error` {Error}

Destroy the stream, and optionally emit an `'error'` event. After this call, the transform stream would release any internal resources. Implementors should not override this method, but instead implement [`readable._destroy()`](#stream_readable_destroy_err_callback). The default implementation of `_destroy()` for `Transform` also emit `'close'` unless `emitClose` is set in false.

### `stream.finished(stream[, options], callback)`
<!-- YAML
added: v10.0.0
-->

* `stream` {Stream} A readable and/or writable stream.
* `options` {Object}
  * `error` {boolean} If set to `false`, then a call to `emit('error', err)` is not treated as finished. **Default**: `true`.
  * `readable` {boolean} When set to `false`, the callback will be called when the stream ends even though the stream might still be readable. **Default**: `true`.
  * `writable` {boolean} When set to `false`, the callback will be called when the stream ends even though the stream might still be writable. **Default**: `true`.
* `callback` {Function} A callback function that takes an optional error argument.
* Returns: {Function} A cleanup function which removes all registered listeners.

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

rs.resume(); // Drain the stream.
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
rs.resume(); // Drain the stream.
```

`stream.finished()` leaves dangling event listeners (in particular `'error'`, `'end'`, `'finish'` and `'close'`) after `callback` has been invoked. The reason for this is so that unexpected `'error'` events (due to incorrect stream implementations) do not cause unexpected crashes. If this is unwanted behavior then the returned cleanup function needs to be invoked in the callback:

```js
const cleanup = finished(rs, (err) => {
  cleanup();
  // ...
});
```

### `stream.pipeline(...streams, callback)`
<!-- YAML
added: v10.0.0
-->

* `...streams` {Stream} Two or more streams to pipe between.
* `callback` {Function} Called when the pipeline is fully done.
  * `err` {Error}

A module method to pipe between streams forwarding errors and properly cleaning up and provide a callback when the pipeline is complete.

```js
const { pipeline } = require('stream');
const fs = require('fs');
const zlib = require('zlib');

// Usa el API pipeline para hacer fácilmente pipe a una serie de streams 
// juntos y ser notificado cuando el pipeline sea completado.

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

`stream.pipeline()` will call `stream.destroy(err)` on all streams except:
* `Readable` streams which have emitted `'end'` or `'close'`.
* `Writable` streams which have emitted `'finish'` or `'close'`.

`stream.pipeline()` leaves dangling event listeners on the streams after the `callback` has been invoked. In the case of reuse of streams after failure, this can cause event listener leaks and swallowed errors.

### `stream.Readable.from(iterable, [options])`
<!-- YAML
added: v12.3.0
-->

* `iterable` {Iterable} Object implementing the `Symbol.asyncIterator` or `Symbol.iterator` iterable protocol.
* `options` {Object} Options provided to `new stream.Readable([options])`. By default, `Readable.from()` will set `options.objectMode` to `true`, unless this is explicitly opted out by setting `options.objectMode` to `false`.
* Returns: {stream.Readable}

A utility method for creating Readable Streams out of iterators.

```js
const { Readable } = require('stream');

async function * generate() {
  yield 'hello';
  yield 'streams';
}

const readable = Readable.from(generate());

readable.on('data', (chunk) => {
  console.log(chunk);
});
```

Calling `Readable.from(string)` or `Readable.from(buffer)` will not have the strings or buffers be iterated to match the other streams semantics for performance reasons.

## Api para Implementadores de Streams

<!--type=misc-->

El API del módulo `stream` ha sido diseñado para hacer posible implementar fácilmente streams usando el modelo prototipo heredado de JavaScript.

Primero, un desarrollador de stream declararía una nueva clase JavaScript que extiende una de las 4 clases de stream básicas (`stream.Writable`, `stream.Readable`, `stream.Duplex`, o `stream.Transform`), asegurándose que llamen el constructor de clase primaria apropiado:
```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor({ highWaterMark, ...options }) {
    super({
      highWaterMark,
      autoDestroy: true,
      emitClose: true
    });
    // ...
  }
}
```

When extending streams, keep in mind what options the user can and should provide before forwarding these to the base constructor. For example, if the implementation makes assumptions in regard to the `autoDestroy` and `emitClose` options, do not allow the user to override these. Be explicit about what options are forwarded instead of implicitly forwarding all options.

La nueva clase stream entonces debe implementar una o métodos más específicos, dependiendo del tipo de stream siendo creado, como es detallado en el siguiente gráfico:

| Casos de uso                                    | Clase           | Método(s) a implementar                                                                                                                                                                                          |
| ----------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Solo lectura                                    | [`Readable`][]  | [`_read()`](#stream_readable_read_size_1)                                                                                                                                                                        |
| Solo escritura                                  | [`Writable`][]  | [`_write()`](#stream_writable_write_chunk_encoding_callback_1), [`_writev()`](#stream_writable_writev_chunks_callback), [`_final()`](#stream_writable_final_callback)                                            |
| Lectura y escritura                             | [`Duplex`][]    | [`_read()`](#stream_readable_read_size_1), [`_write()`](#stream_writable_write_chunk_encoding_callback_1), [`_writev()`](#stream_writable_writev_chunks_callback), [`_final()`](#stream_writable_final_callback) |
| Opera en datos escritos, luego lee el resultado | [`Transform`][] | [`_transform()`](#stream_transform_transform_chunk_encoding_callback), [`_flush()`](#stream_transform_flush_callback), [`_final()`](#stream_writable_final_callback)                                             |

The implementation code for a stream should *never* call the "public" methods of a stream that are intended for use by consumers (as described in the [API for Stream Consumers](#stream_api_for_stream_consumers) section). Doing so may lead to adverse side effects in application code consuming the stream.

Avoid overriding public methods such as `write()`, `end()`, `cork()`, `uncork()`, `read()` and `destroy()`, or emitting internal events such as `'error'`, `'data'`, `'end'`, `'finish'` and `'close'` through `.emit()`. Doing so can break current and future stream invariants leading to behavior and/or compatibility issues with other streams, stream utilities, and user expectations.

### Construcción Simplificada<!-- YAML
added: v1.2.0
-->Para muchos casos simples, es imposible construir un stream sin depender de la herencia. Esto puede ser logrado al crear instancias directamente de los objetos `stream.Writable`, `stream.Readable`, `stream.Duplex` o `stream.Transform` y pasar métodos apropiados como opciones de constructor.

```js
const { Writable } = require('stream');

const myWritable = new Writable({
  write(chunk, encoding, callback) {
    // ...
  }
});
```

### Implementando un Stream Writable

The `stream.Writable` class is extended to implement a [`Writable`][] stream.

Custom `Writable` streams *must* call the `new stream.Writable([options])` constructor and implement the `writable._write()` and/or `writable._writev()` method.

#### Constructor: `new stream.Writable([options])`<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18438
    description: Add `emitClose` option to specify if `'close'` is emitted on
                 destroy.
  - version: v11.2.0
    pr-url: https://github.com/nodejs/node/pull/22795
    description: Add `autoDestroy` option to automatically `destroy()` the
                 stream when it emits `'finish'` or errors.
-->* `options` {Object}
  * `highWaterMark` {number} Nivel del búfer cuando [`stream.write()`](#stream_writable_write_chunk_encoding_callback) empieza a devolver `false`. **Default:** `16384` (16kb), or `16` for `objectMode` streams.
  * `decodeStrings` {boolean} Whether to encode `string`s passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback) to `Buffer`s (with the encoding specified in the [`stream.write()`](#stream_writable_write_chunk_encoding_callback) call) before passing them to [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1). Other types of data are not converted (i.e. `Buffer`s are not decoded into `string`s). Setting to false will prevent `string`s from being converted.  **Default:** `true`.
  * `defaultEncoding` {string} The default encoding that is used when no encoding is specified as an argument to [`stream.write()`](#stream_writable_write_chunk_encoding_callback). **Default:** `'utf8'`.
  * `objectMode` {boolean} Ya sea [`stream.write(anyObj)`](#stream_writable_write_chunk_encoding_callback) una operación válida o no. When set, it becomes possible to write JavaScript values other than string, `Buffer` or `Uint8Array` if supported by the stream implementation. **Default:** `false`.
  * `emitClose` {boolean} Whether or not the stream should emit `'close'` after it has been destroyed. **Default:** `true`.
  * `write` {Function} Implementación para el método [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1).
  * `writev` {Function} Implementación para el método [`stream._writev()`](#stream_writable_writev_chunks_callback).
  * `destroy` {Function} Implementation for the [`stream._destroy()`](#stream_writable_destroy_err_callback) method.
  * `final` {Function} Implementation for the [`stream._final()`](#stream_writable_final_callback) method.
  * `autoDestroy` {boolean} Whether this stream should automatically call `.destroy()` on itself after ending. **Default:** `false`.
```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor(options) {
    // Calls the stream.Writable() constructor.
    super(options);
    // ...
  }
}
```

O cuando se usen constructores de estilo pre-ES6:

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

O cuando se use el enfoque del Constructor Simplificado:

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

#### `writable._write(chunk, encoding, callback)`<!-- YAML
changes:
  - version: v12.11.0
    pr-url: https://github.com/nodejs/node/pull/29639
    description: _write() is optional when providing _writev().
-->* `chunk` {Buffer|string|any} The `Buffer` to be written, converted from the `string` passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback). If the stream's `decodeStrings` option is `false` or the stream is operating in object mode, the chunk will not be converted & will be whatever was passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback).
* `encoding` {string} Si el fragmento es un string, entonces `encoding` es el codificador de carácter de ese string. Si el fragmento es un `Buffer`, o si el stream está operando en modo objeto, `encoding` pudiera ser ignorado.
* `callback` {Function} Llama esta función (opcionalmente con un argumento error) cuando el procesamiento es completado para el fragmento suministrado.

All `Writable` stream implementations must provide a [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1) and/or [`writable._writev()`](#stream_writable_writev_chunks_callback) method to send data to the underlying resource.

[`Transform`][] streams provide their own implementation of the [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1).

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Writable` class methods only.

El método `callback` debe ser llamado para señalar que la escritura se terminó con éxito o falló con un error. El primer argumento pasado al `callback` debe ser el objeto `Error` si la llamada falla, o `null` si la escritura tuvo éxito.

All calls to `writable.write()` that occur between the time `writable._write()` is called and the `callback` is called will cause the written data to be buffered. When the `callback` is invoked, the stream might emit a [`'drain'`][] event. If a stream implementation is capable of processing multiple chunks of data at once, the `writable._writev()` method should be implemented.

If the `decodeStrings` property is explicitly set to `false` in the constructor options, then `chunk` will remain the same object that is passed to `.write()`, and may be a string rather than a `Buffer`. This is to support implementations that have an optimized handling for certain string data encodings. In that case, the `encoding` argument will indicate the character encoding of the string. Otherwise, the `encoding` argument can be safely ignored.

El método `writable._write()` es ajustado con un subrayado porque es interno a la clase que lo define, y no debería ser llamado directamente por programas de usuario.

#### `writable._writev(chunks, callback)`

* `chunks` {Object[]} The chunks to be written. Cada fragmento tiene el siguiente formato: `{ chunk: ..., encoding: ... }`.
* `callback` {Function} Una función callback (opcionalmente con un argumento error) para ser invocada cuando el procesamiento de los fragmentos suministrados es completado.

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Writable` class methods only.

The `writable._writev()` method may be implemented in addition or alternatively to `writable._write()` in stream implementations that are capable of processing multiple chunks of data at once. Si es implementado, el método será llamado con todos los fragmentos de datos que están siendo almacenados en la cola de escritura.

El método `writable._writev()` es ajustado con un subrayado porque es interno a la clase que lo define, y no debería ser llamado directamente por programas de usuario.

#### `writable._destroy(err, callback)`<!-- YAML
added: v8.0.0
-->* `err` {Error} Un posible error.
* `callback` {Function} A callback function that takes an optional error argument.

El método `_destroy()` es llamado por [`writable.destroy()`](#stream_writable_destroy_error). It can be overridden by child classes but it **must not** be called directly.

#### `writable._final(callback)`<!-- YAML
added: v8.0.0
-->* `callback` {Function} Call this function (optionally with an error argument) when finished writing any remaining data.

The `_final()` method **must not** be called directly. It may be implemented by child classes, and if so, will be called by the internal `Writable` class methods only.

This optional function will be called before the stream closes, delaying the `'finish'` event until `callback` is called. This is useful to close resources or write buffered data before a stream ends.

#### Errores al Escribir

Errors occurring during the processing of the [`writable._write()`][], [`writable._writev()`][] and [`writable._final()`][] methods must be propagated by invoking the callback and passing the error as the first argument. Throwing an `Error` from within these methods or manually emitting an `'error'` event results in undefined behavior.

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

#### Un Stream Escribible de Ejemplo

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

#### Decodificación de Búferes en un Stream Escribible

La decodificación de búferes es una tarea común, por ejemplo, cuando se use tranformadores cuya entrada es un string. No es un proceso trivial cuando se use codificación de caracteres multi-byte, tal como UTF-8. The following example shows how to decode multi-byte strings using `StringDecoder` and [`Writable`][].

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

### Implementando un Stream Legible

The `stream.Readable` class is extended to implement a [`Readable`][] stream.

Custom `Readable` streams *must* call the `new stream.Readable([options])` constructor and implement the `readable._read()` method.

#### `new stream.Readable([options])`<!-- YAML
changes:
  - version: v11.2.0
    pr-url: https://github.com/nodejs/node/pull/22795
    description: Add `autoDestroy` option to automatically `destroy()` the
                 stream when it emits `'end'` or errors.
-->* `options` {Object}
  * `highWaterMark` {number} The maximum [number of bytes](#stream_highwatermark_discrepancy_after_calling_readable_setencoding) to store in the internal buffer before ceasing to read from the underlying resource. **Default:** `16384` (16kb), or `16` for `objectMode` streams.
  * `encoding` {string} Si es especificado, los búferes van a ser decodificados a strings usando la codificación especificada. **Default:** `null`.
  * `objectMode` {boolean} Si este stream debería comportarse como un stream de objetos, o no. Meaning that [`stream.read(n)`](#stream_readable_read_size) returns a single value instead of a `Buffer` of size `n`. **Default:** `false`.
  * `emitClose` {boolean} Whether or not the stream should emit `'close'` after it has been destroyed. **Default:** `true`.
  * `read` {Function} Implementación para el método [`stream._read()`](#stream_readable_read_size_1).
  * `destroy` {Function} Implementation for the [`stream._destroy()`](#stream_readable_destroy_err_callback) method.
  * `autoDestroy` {boolean} Whether this stream should automatically call `.destroy()` on itself after ending. **Default:** `false`.
```js
const { Readable } = require('stream');

class MyReadable extends Readable {
  constructor(options) {
    // Calls the stream.Readable(options) constructor.
    super(options);
    // ...
  }
}
```

O cuando se usen constructores de estilo pre-ES6:

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

O cuando se use el enfoque del Constructor Simplificado:

```js
const { Readable } = require('stream');

const myReadable = new Readable({
  read(size) {
    // ...
  }
});
```

#### `readable._read(size)`<!-- YAML
added: v0.9.4
-->* `size` {number} Números de bytes para ser leídos asincrónicamente

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Readable` class methods only.

All `Readable` stream implementations must provide an implementation of the `readable._read()` method to fetch data from the underlying resource.

Cuando `readable._read()` es llamado, si hay datos disponibles de la fuente, la implementación debería comenzar a enviar esos datos a dentro de la cola de lectura usando el método [`this.push(dataChunk)`](#stream_readable_push_chunk_encoding). `_read()` debería continuar leyendo del recurso y enviar datos hasta que `readable.push()` devuelva `false`. Solo cuando `_read()` es llamado otra vez después que se ha detenido debería continuar el envío de datos adicionales a la cola.

Once the `readable._read()` method has been called, it will not be called again until more data is pushed through the [`readable.push()`](#stream_readable_push_chunk_encoding) method. Empty data such as empty buffers and strings will not cause `readable._read()` to be called.

El argumento `size` es consultivo. Para implementaciones donde un "read" es una sola operación que devuelve datos, puede usar el argumento `size` para determinar cuántos datos recoger. Otras implementaciones pudieran ignorar este argumento y simplemente proporcionar los datos cuando estén disponibles. No hay que "esperar" hasta que los bytes de `size` estén disponibles antes de llamar a [`stream.push(chunk)`](#stream_readable_push_chunk_encoding).

El método `readable._read()` es ajustado con un subrayado porque es interno a la clase que lo define, y no debería ser llamado directamente por programas de usuario.

#### `readable._destroy(err, callback)`<!-- YAML
added: v8.0.0
-->* `err` {Error} Un posible error.
* `callback` {Function} A callback function that takes an optional error argument.

El método `_destroy()` es llamado por [`readable.destroy()`](#stream_readable_destroy_error). It can be overridden by child classes but it **must not** be called directly.

#### `readable.push(chunk[, encoding])`<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->* `chunk` {Buffer|Uint8Array|string|null|any} Chunk of data to push into the read queue. For streams not operating in object mode, `chunk` must be a string, `Buffer` or `Uint8Array`. For object mode streams, `chunk` may be any JavaScript value.
* `encoding` {string} Codificación de los fragmentos string. Must be a valid `Buffer` encoding, such as `'utf8'` or `'ascii'`.
* Returns: {boolean} `true` if additional chunks of data may continue to be pushed; `false` otherwise.

When `chunk` is a `Buffer`, `Uint8Array` or `string`, the `chunk` of data will be added to the internal queue for users of the stream to consume. Passing `chunk` as `null` signals the end of the stream (EOF), after which no more data can be written.

When the `Readable` is operating in paused mode, the data added with `readable.push()` can be read out by calling the [`readable.read()`](#stream_readable_read_size) method when the [`'readable'`][] event is emitted.

When the `Readable` is operating in flowing mode, the data added with `readable.push()` will be delivered by emitting a `'data'` event.

El método `readable.push()` está diseñado para ser tan flexible como sea posible. For example, when wrapping a lower-level source that provides some form of pause/resume mechanism, and a data callback, the low-level source can be wrapped by the custom `Readable` instance:

```js
// `_source` is an object with readStop() and readStart() methods,
// and an `ondata` member that gets called when it has data, and
// an `onend` member that gets called when the data is over.

class SourceWrapper extends Readable {
  constructor(options) {
    super(options);

    this._source = getLowLevelSourceObject();

    // Every time there's data, push it into the internal buffer.
    this._source.ondata = (chunk) => {
      // If push() returns false, then stop reading from source.
      if (!this.push(chunk))
        this._source.readStop();
    };

    // When the source ends, push the EOF-signaling `null` chunk.
    this._source.onend = () => {
      this.push(null);
    };
  }
  // _read() will be called when the stream wants to pull more data in.
  // The advisory size argument is ignored in this case.
  _read(size) {
    this._source.readStart();
  }
}
```

The `readable.push()` method is used to push the content into the internal buffer. It can be driven by the `readable._read()` method.

For streams not operating in object mode, if the `chunk` parameter of `readable.push()` is `undefined`, it will be treated as empty string or buffer. Vea [`readable.push('')`][] para más información.

#### Errores al Escribir

Errors occurring during processing of the [`readable._read()`][] must be propagated through the [`readable.destroy(err)`](#stream_readable_destroy_err_callback) method. Throwing an `Error` from within [`readable._read()`][] or manually emitting an `'error'` event results in undefined behavior.

```js
const { Readable } = require('stream');

const myReadable = new Readable({
  read(size) {
    const err = checkSomeErrorCondition();
    if (err) {
      this.destroy(err);
    } else {
      // Do some work.
    }
  }
});
```

#### Un Ejemplo de Conteo de Stream<!--type=example-->The following is a basic example of a `Readable` stream that emits the numerals from 1 to 1,000,000 in ascending order, and then ends.

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

### Implementando un Stream Dúplex

A [`Duplex`][] stream is one that implements both [`Readable`][] and [`Writable`][], such as a TCP socket connection.

Because JavaScript does not have support for multiple inheritance, the `stream.Duplex` class is extended to implement a [`Duplex`][] stream (as opposed to extending the `stream.Readable` *and* `stream.Writable` classes).

The `stream.Duplex` class prototypically inherits from `stream.Readable` and parasitically from `stream.Writable`, but `instanceof` will work properly for both base classes due to overriding [`Symbol.hasInstance`][] on `stream.Writable`.

Custom `Duplex` streams *must* call the `new stream.Duplex([options])` constructor and implement *both* the `readable._read()` and `writable._write()` methods.

#### `new stream.Duplex(options)`<!-- YAML
changes:
  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14636
    description: The `readableHighWaterMark` and `writableHighWaterMark` options
                 are supported now.
-->* `options` {Object} Passed to both `Writable` and `Readable` constructors. También tiene los siguientes campos:
  * `allowHalfOpen` {boolean} If set to `false`, then the stream will automatically end the writable side when the readable side ends. **Default:** `true`.
  * `readableObjectMode` {boolean} Sets `objectMode` for readable side of the stream. No tiene efecto si `objectMode` es `true`. **Default:** `false`.
  * `writableObjectMode` {boolean} Sets `objectMode` for writable side of the stream. No tiene efecto si `objectMode` es `true`. **Default:** `false`.
  * `readableHighWaterMark` {number} Sets `highWaterMark` for the readable side of the stream. No tiene efecto si se proporciona `highWaterMark`.
  * `writableHighWaterMark` {number} Sets `highWaterMark` for the writable side of the stream. No tiene efecto si se proporciona `highWaterMark`.
```js
const { Duplex } = require('stream');

class MyDuplex extends Duplex {
  constructor(options) {
    super(options);
    // ...
  }
}
```

O cuando se usen constructores de estilo pre-ES6:

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

O cuando se use el enfoque del Constructor Simplificado:

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

#### Un Ejemplo de Stream Dúplex

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
    // The underlying source only deals with strings.
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

#### Modo Objeto de Streams Dúplex

For `Duplex` streams, `objectMode` can be set exclusively for either the `Readable` or `Writable` side using the `readableObjectMode` and `writableObjectMode` options respectively.

In the following example, for instance, a new `Transform` stream (which is a type of [`Duplex`][] stream) is created that has an object mode `Writable` side that accepts JavaScript numbers that are converted to hexadecimal strings on the `Readable` side.

```js
const { Transform } = require('stream');

// All Transform streams are also Duplex Streams.
const myTransform = new Transform({
  writableObjectMode: true,

  transform(chunk, encoding, callback) {
    // Coerce the chunk to a number if necessary.
    chunk |= 0;

    // Transform the chunk into something else.
    const data = chunk.toString(16);

    // Empuja a los datos a la cola legible.
    callback(null, '0'.repeat(data.length % 2) + data);
  }
});

myTransform.setEncoding('ascii');
myTransform.on('data', (chunk) => console.log(chunk));

myTransform.write(1);
// Imprime: 01
myTransform.write(10);
// Imprime: 0a
myTransform.write(100);
// Imprime: 64
```

### Implementando un Stream de Transformación

A [`Transform`][] stream is a [`Duplex`][] stream where the output is computed in some way from the input. Los ejemplos incluyen streams [zlib](zlib.html) o streams [crypto](crypto.html) que comprimen, encriptan o descifran los datos.

There is no requirement that the output be the same size as the input, the same number of chunks, or arrive at the same time. For example, a `Hash` stream will only ever have a single chunk of output which is provided when the input is ended. A `zlib` stream will produce output that is either much smaller or much larger than its input.

The `stream.Transform` class is extended to implement a [`Transform`][] stream.

La clase `stream.Transform` hereda prototípicamente de `stream.Duplex` e implementa su propia versión de los métodos `writable._write()` y `readable._read()`. Custom `Transform` implementations *must* implement the [`transform._transform()`](#stream_transform_transform_chunk_encoding_callback) method and *may* also implement the [`transform._flush()`](#stream_transform_flush_callback) method.

Care must be taken when using `Transform` streams in that data written to the stream can cause the `Writable` side of the stream to become paused if the output on the `Readable` side is not consumed.

#### `new stream.Transform([options])`

* `options` {Object} Passed to both `Writable` and `Readable` constructors. También tiene los siguientes campos:
  * `transform` {Function} Implementación para el método [`stream._transform()`](#stream_transform_transform_chunk_encoding_callback).
  * `flush` {Function} Implementación para el método [`stream._flush()`](#stream_transform_flush_callback).
```js
const { Transform } = require('stream');

class MyTransform extends Transform {
  constructor(options) {
    super(options);
    // ...
  }
}
```

O cuando se usen constructores de estilo pre-ES6:

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

O cuando se use el enfoque del Constructor Simplificado:

```js
const { Transform } = require('stream');

const myTransform = new Transform({
  transform(chunk, encoding, callback) {
    // ...
  }
});
```

#### Events: `'finish'` and `'end'`

Los eventos [`'finish'`][] y [`'end'`][] son de las clases `stream.Writable` y `stream.Readable`, respectivamente. El evento `'finish'` es emitido después que se llama [`stream.end()`](#stream_writable_end_chunk_encoding_callback)y todos los fragmentos han sido procesados by [`stream._transform()`](#stream_transform_transform_chunk_encoding_callback). El evento`'end'` es emitido después que todos los datos han sido sacados, lo que ocurre luego de que se llamó la callback en [`transform._flush()`](#stream_transform_flush_callback).

#### `transform._flush(callback)`

* `callback` {Function} A callback function (optionally with an error argument and data) to be called when remaining data has been flushed.

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Readable` class methods only.

En algunos casos, una operación de transformación pudiera emitir un bit adicional de datos en el final del stream. Por ejemplo, un stream de compresión `zlib` va a almacenar una cantidad de estado interno usado para la compresión óptima de la salida. Cuando el stream termina, sin embargo, esos datos adicionales necesitan ser arrojados para que los datos comprimidos estén completos.

Custom [`Transform`][] implementations *may* implement the `transform._flush()` method. This will be called when there is no more written data to be consumed, but before the [`'end'`][] event is emitted signaling the end of the [`Readable`][] stream.

Dentro de la implementación `transform._flush()`, el método `readable.push()` puede ser llamado cero o más veces, según corresponda. La función `callback` debe ser llamada cuando la operación de descarga es completada.

El método `transform._flush()` es ajustado con un subrayado porque es interno a la clase que lo define, nunca debería ser llamado directamente por programas de usuario.

#### `transform._transform(chunk, encoding, callback)`

* `chunk` {Buffer|string|any} The `Buffer` to be transformed, converted from the `string` passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback). If the stream's `decodeStrings` option is `false` or the stream is operating in object mode, the chunk will not be converted & will be whatever was passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback).
* `encoding` {string} Si el fragmento es un string, entonces esto es el tipo de codificación. If chunk is a buffer, then this is the special value `'buffer'`. Ignore it in that case.
* `callback` {Function} Una función callback (opcionalmente con un argumento error y datos) a ser llamada después que el `chunk` proporcionado ha sido procesado.

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Readable` class methods only.

All `Transform` stream implementations must provide a `_transform()` method to accept input and produce output. La implementación `transform._transform()` maneja los bytes que están siendo escritos, computa una salida, luego pasa esa salida a la porción legible usando el método `readable.push()`.

El método `transform.push()` puede ser llamado cero o más veces para generar salida de un solo fragmento de entrada, dependiendo de cuanto hay para la salida como resultado del fragmento.

Es posible que ninguna salida sea generada de cualquier fragmento de datos de entrada.

La función `callback` debe ser llamada solo cuando el fragmento actual sea completamente consumido. El primer argumento pasado al `callback` debe ser un objeto `Error` si ocurre un error mientras se procesa la entrada, o de caso contrario `null`. Si un segundo argumento es pasado al `callback`, será reenviado al método `readable.push()`. In other words, the following are equivalent:

```js
transform.prototype._transform = function(data, encoding, callback) {
  this.push(data);
  callback();
};

transform.prototype._transform = function(data, encoding, callback) {
  callback(null, data);
};
```

El método `transform._transform()` es ajustado con un subrayado porque es interno a la clase que lo define, y no debería ser llamado directamente por programas de usuario.

`transform._transform()` no es llamado nunca en paralelo; los streams implementan una mecanismo de cola, y para recibir el siguiente fragmento, se debe llamar a `callback`, ya sea de manera sincrónica o asincrónicamente.

#### Class: `stream.PassThrough`

The `stream.PassThrough` class is a trivial implementation of a [`Transform`][] stream that simply passes the input bytes across to the output. Su propósito es principalmente para ejemplos y pruebas, pero hay algunos casos de uso donde `stream.PassThrough` es útil como un bloque de construcción para nuevos tipos de streams.

## Notas adicionales<!--type=misc-->### Streams Compatibility with Async Generators and Async Iterators

With the support of async generators and iterators in JavaScript, async generators are effectively a first-class language-level stream construct at this point.

Some common interop cases of using Node.js streams with async generators and async iterators are provided below.

#### Consuming Readable Streams with Async Iterators

```js
(async function() {
  for await (const chunk of readable) {
    console.log(chunk);
  }
})();
```

Async iterators register a permanent error handler on the stream to prevent any unhandled post-destroy errors.

#### Creating Readable Streams with Async Generators

We can construct a Node.js Readable Stream from an asynchronous generator using the `Readable.from()` utility method:

```js
const { Readable } = require('stream');

async function * generate() {
  yield 'a';
  yield 'b';
  yield 'c';
}

const readable = Readable.from(generate());

readable.on('data', (chunk) => {
  console.log(chunk);
});
```

#### Piping to Writable Streams from Async Iterators

In the scenario of writing to a writable stream from an async iterator, ensure the correct handling of backpressure and errors.

```js
const { once } = require('events');
const finished = util.promisify(stream.finished);

const writable = fs.createWriteStream('./file');

(async function() {
  for await (const chunk of iterator) {
    // Handle backpressure on write().
    if (!writable.write(chunk))
      await once(writable, 'drain');
  }
  writable.end();
  // Ensure completion without errors.
  await finished(writable);
})();
```

In the above, errors on `write()` would be caught and thrown by the `once()` listener for the `'drain'` event, since `once()` will also handle the `'error'` event. To ensure completion of the write stream without errors, it is safer to use the `finished()` method as above, instead of using the `once()` listener for the `'finish'` event. Under certain cases, an `'error'` event could be emitted by the writable stream after `'finish'` and as `once()` will release the `'error'` handler on handling the `'finish'` event, it could result in an unhandled error.

Alternatively, the readable stream could be wrapped with `Readable.from()` and then piped via `.pipe()`:

```js
const finished = util.promisify(stream.finished);

const writable = fs.createWriteStream('./file');

(async function() {
  const readable = Readable.from(iterator);
  readable.pipe(writable);
  // Ensure completion without errors.
  await finished(writable);
})();
```

Or, using `stream.pipeline()` to pipe streams:

```js
const pipeline = util.promisify(stream.pipeline);

const writable = fs.createWriteStream('./file');

(async function() {
  const readable = Readable.from(iterator);
  await pipeline(readable, writable);
})();
```<!--type=misc-->### Compatibilidad con las versiones anteriores de Node.js<!--type=misc-->Prior to Node.js 0.10, the `Readable` stream interface was simpler, but also less powerful and less useful.

* Rather than waiting for calls to the [`stream.read()`](#stream_readable_read_size) method, [`'data'`][] events would begin emitting immediately. Las aplicaciones que necesiten realizar cierta cantidad de trabajo para decidir cómo manejar los datos, fueron requeridas que almacenen los datos en los búferes para que los datos no se perdieran.
* El método [`stream.pause()`](#stream_readable_pause) era consultivo, en vez de garantizado. This meant that it was still necessary to be prepared to receive [`'data'`][] events *even when the stream was in a paused state*.

In Node.js 0.10, the [`Readable`][] class was added. For backward compatibility with older Node.js programs, `Readable` streams switch into "flowing mode" when a [`'data'`][] event handler is added, or when the [`stream.resume()`](#stream_readable_resume) method is called. El efecto es que, incluso cuando no se use el nuevo método [`stream.read()`](#stream_readable_read_size) y el evento [`'readable'`][], ya no será necesario preocuparse por la pérdida de fragmentos [`'data'`][].

Mientras que la mayoría de las aplicaciones continuarán funcionando con normalidad, esto introduce un caso extremo en las siguientes condiciones:

* Ningún listener de evento [`'data'`][] es añadido.
* El método [`stream.resume()`](#stream_readable_resume) nunca es llamado.
* El stream no hace pipe a ningún destino escribible.

Por ejemplo, considera el siguiente código:

```js
// ¡ADVERTENCIA!  ¡ROTO!
net.createServer((socket) => {

  // We add an 'end' listener, but never consume the data.
  socket.on('end', () => {
    // It will never get here.
    socket.end('The message was received but was not processed.\n');
  });

}).listen(1337);
```

Prior to Node.js 0.10, the incoming message data would be simply discarded. However, in Node.js 0.10 and beyond, the socket remains paused forever.

La solución alternativa en esta situación es llamar al método [`stream.resume()`](#stream_readable_resume) para iniciar el flujo de datos:

```js
// Workaround.
net.createServer((socket) => {
  socket.on('end', () => {
    socket.end('The message was received but was not processed.\n');
  });

  // Start the flow of data, discarding it.
  socket.resume();
}).listen(1337);
```

In addition to new `Readable` streams switching into flowing mode, pre-0.10 style streams can be wrapped in a `Readable` class using the [`readable.wrap()`][`stream.wrap()`] method.

### `readable.read(0)`

Hay algunos casos donde es necesario activar una actualización de los mecanismos de stream legible subyacente, sin realmente consumir datos. En tales casos, es posible llamar a `readable.read(0)`, que siempre devolverá `null`.

Si el búfer de lectura interno está por debajo de `highWaterMark`, y el stream no está actualmente leyendo, entonces llamar a `stream.read(0)` va a activar una llamada de [`stream._read()`](#stream_readable_read_size_1) de bajo-nivel.

While most applications will almost never need to do this, there are situations within Node.js where this is done, particularly in the `Readable` stream class internals.

### `readable.push('')`

No se recomienda el uso de `readable.push('')`.

Pushing a zero-byte string, `Buffer` or `Uint8Array` to a stream that is not in object mode has an interesting side effect. Because it *is* a call to [`readable.push()`](#stream_readable_push_chunk_encoding), the call will end the reading process. Sin embargo, ya que el argumento es un string vacío, no se añaden datos al búfer legible, entonces no hay nada para que un usuario consuma.

### `highWaterMark` discrepancia después de llamar a `readable.setEncoding()`

El uso de `readable.setEncoding()` cambiará el comportamiento de cómo opera `highWaterMark` en modo no-objeto.

Typically, the size of the current buffer is measured against the `highWaterMark` in _bytes_. However, after `setEncoding()` is called, the comparison function will begin to measure the buffer's size in _characters_.

Esto no es un problema en casos comunes con `latin1` o `ascii`. Pero es aconsejado ser consciente sobre este comportamiento cuando se trabaje con strings que pudieran contener caracteres multi-byte.
