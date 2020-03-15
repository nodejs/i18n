# Stream

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

Un stream es una interfaz abstracta para trabajar con datos de streaming en Node.js. El módulo `stream` proporciona una API base que hace sencillo construir objetos que implementan la interfaz de stream.

Existen muchos objetos de stream proporcionados por Node.js. Por ejemplo, una [solicitud a un servidor HTTP](http.html#http_class_http_incomingmessage) y un [`process.stdout`][] son instancias de stream.

Los streams pueden ser legible, escribibles, o ambos. Todos los streams son instancias de [`EventEmitter`][].

Se puede acceder al módulo `stream` utilizando:

```js
const stream = require('stream');
```

Mientras es importante entender cómo los streams funcionan, el módulo `stream`, en sí mismo, es más útil para los desarrolladores que están creando nuevos tipos de instancias stream. Los desarrolladores que *consumen* primariamente objetos stream raramente necesitaran usar el módulo `stream` directamente.

## Organización de este Documento

Este documento está dividido en dos secciones principales, con una tercera sección para notas adicionales. La primera sección explica los elementos de la API de stream que se requieren para *utilizar* streams en una aplicación. La segunda sección explica los elementos de la API que se requieren para *implementar* nuevos tipos de streams.

## Tipos de Streams

Existen cuatro tipos fundamentales de stream en Node.js:

* [`Writable`][] - streams to which data can be written (for example, [`fs.createWriteStream()`][]).
* [`Readable`][] - streams from which data can be read (for example, [`fs.createReadStream()`][]).
* [`Duplex`][] - streams that are both `Readable` and `Writable` (for example, [`net.Socket`][]).
* [`Transform`][] - `Duplex` streams that can modify or transform the data as it is written and read (for example, [`zlib.createDeflate()`][]).

Additionally, this module includes the utility functions [pipeline](#stream_stream_pipeline_streams_callback) and [finished](#stream_stream_finished_stream_callback).

### Modo Objeto

Todos los streams que son creados por las APIs de Node.js operan exclusivamente en objetos strings y objetos `Buffer` (o `Uint8Array`). Si es posible, sin embargo, para implementaciones stream, trabajar con otros tipos de valores de JavaScript (con la excepción de `null`, que sirve un propósito especial con los streams). Tales streams son considerados para operar en "modo objeto".

Las instancias stream son cambiadas a modo objeto usando la opción `objectMode` cuando el stream es creado. No es seguro. intentar cambiar un stream existente a modo objeto.

### Almacenamiento en Buffer

<!--type=misc-->

Los streams [`Writable`][] y [`Readable`][] van a almacenar los datos en un búfer interno, que puede ser recuperado usando `writable.writableBuffer` o `readable.readableBuffer`, respectivamente.

The amount of data potentially buffered depends on the `highWaterMark` option passed into the stream's constructor. Para streams normales, la opción `highWaterMark` especifica un [número total de bytes](#stream_highwatermark_discrepancy_after_calling_readable_setencoding). Para operar stream en modo objeto, `highWaterMark` especifica un número total de objetos´.

Los datos son guardados en streams `Readable` cuando la implementación llama a [`stream.push(chunk)`](#stream_readable_push_chunk_encoding). Si el consumidor del stream no llama a [`stream.read()`](#stream_readable_read_size), los datos se quedarán en la cola interna hasta que se consumen.

Una vez que el tamaño total del búfer interno de lectura alcanza el límite especificado por `highWaterMark`, el stream va a dejar de leer datos de los recursos subyacentes temporalmente, hasta que los datos que están siendo almacenados puedan ser consumidos (es decir, el stream va a dejar de llamar el método interno `readable._read()` que es usado para llenar el búfer de lectura).

Los datos son almacenados en streams `Writable` cuando el método [`writable.write(chunk)`](#stream_writable_write_chunk_encoding_callback) es llamado repetidamente. Mientras que el tamaño total del búfer de escritura interno sea inferior al límite establecido por `highWaterMark`, las llamadas a `writable.write()` van a devolver `true`. Una vez que el tamaño del búfer interno alcanza o supera el `highWaterMark`, será devuelto `false`.

Un objetivo clave del API de `stream`, particularmente el método [`stream.pipe()`], es limitar el almacenamiento de datos a niveles aceptables, para que la fuentes y los destinos de diferentes velocidades no abrumen la memoria disponible.

Because [`Duplex`][] and [`Transform`][] streams are both `Readable` and `Writable`, each maintains *two* separate internal buffers used for reading and writing, allowing each side to operate independently of the other while maintaining an appropriate and efficient flow of data. For example, [`net.Socket`][] instances are [`Duplex`][] streams whose `Readable` side allows consumption of data received *from* the socket and whose `Writable` side allows writing data *to* the socket. Porque los datos pueden ser escritos al socket a una tasa más rápida o más lenta que los datos que son recibidos, es importante para cada lado operar (y almacenar) independientemente del otro.

## API para los Consumidores de Stream

<!--type=misc-->

Casi todas las aplicaciones Node.js, no importa que tan simple sea, usa streams de alguna manera/modo. Nota: se puede escoger, alguna de las dos. Lo siguiente es un ejemplo de uso de streams en una aplicación de Node.js que implemente un servidor HTTP:

```js
const http = require('http');

const server = http.createServer((req, res) => {
  // req es un http.IncomingMessage, el cual es un Stream Legible
  // res es un http.ServerResponse, el cual es un Strema Escribible

  let body = '';
  // Obtiene los datos como cadenas utf8.
  // Si no se establece una codificación, se recibirán los objetos de Buffer.
  req.setEncoding('utf8');

  // Los streams legibles emiten eventos "data" una vez que se añade un listener
  req.on('data', (chunk) => {
    body += chunk;
  });

  // el evento "end" indica que el cuerpo entero fue recibido
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      // escribe algo interesante al usuario:
      res.write(typeof data);
      res.end();
    } catch (er) {
      // ¡uh oh! ¡json malo!
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

Streams [`Writable`][] (tales como `res` en el ejemplo) expone métodos como`write()` y `end()` que son usados para escribir datos en el stream.

Los streams [`Readable`][] usan la API [`EventEmitter`][] para notificar al código de la aplicación cuando los datos estén listos para ser leídos del stream. Esos datos disponibles pueden ser leídos del stream de múltiples maneras.

Los streams [`Writable`][] y [`Readable`][] usan la API [`EventEmitter`][] de varias manera para comunicar el estado actual del stream.

Los streams [`Duplex`][] y [`Transform`][] son tanto [`Writable`][] como [`Readable`][].

Las aplicaciones que, o están escribiendo o consumiendo datos de un stream, no requieren implementar la interfaz stream directamente y generalmente no tendrán ninguna razón para llamar `require('stream')`.

Los desarrolladores que desean implementar nuevos tipos de stream deberían referirse a la sección [API para implementadores de stream](#stream_api_for_stream_implementers).

### Streams Escribibles

Los streams escribibles son una abstracción para un *destino* al que se le han escrito datos.

Ejemplos de streams [`Writable`][] streams incluyen:

* [solicitudes HTTP, en el cliente](http.html#http_class_http_clientrequest)
* [respuestas HTTP, en el servidor](http.html#http_class_http_serverresponse)
* [streams de escritura del fs](fs.html#fs_class_fs_writestream)
* [streams zlib](zlib.html)
* [streams crypto](crypto.html)
* [sockets TCP](net.html#net_class_net_socket)
* [stdin de proceso secundario](child_process.html#child_process_subprocess_stdin)
* [`process.stdout`][], [`process.stderr`][]

Algunos de estos ejemplos son en realidad streams [`Duplex`][] que implementan la interfaz [`Writable`][].

Todos los streams [`Writable`][] implementan la interfaz definida por la clase `stream.Writable`.

Mientras que instancias específicas de los streams [`Writable`][] pueden diferir en varias maneras, todos los streams `Writable` siguen el mismo patrón de uso fundamental como se ilustra en el siguiente ejemplo:

```js
const myStream = getWritableStreamSomehow();
myStream.write('some data');
myStream.write('some more data');
myStream.end('done writing data');
```

#### Clase: stream.Writable
<!-- YAML
added: v0.9.4
-->

<!--type=class-->

##### Evento: 'close'
<!-- YAML
added: v0.9.4
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18438
    description: Add `emitClose` option to specify if `'close'` is emitted on
                 destroy.
-->

El evento `'close'` es emitido cuando el stream y cualquiera de sus recursos subyacentes (por ejemplo, un descriptor de archivos) han sido cerrados. El evento indica que no se emitirán más eventos, y no se producirá ninguna computación adicional.

A [`Writable`][] stream will always emit the `'close'` event if it is created with the `emitClose` option.

##### Evento: 'drain'
<!-- YAML
added: v0.9.4
-->

Si una llamada a [`stream.write(chunk)`](#stream_writable_write_chunk_encoding_callback) devuelve `false`, el evento `'drain'` será emitido cuando sea apropiado renaudar la escritura de datos al stream.

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
        // ¡última vez!
        writer.write(data, encoding, callback);
      } else {
        // ver si deberíamos continuar o, esperar
        // no pase el callback, porque todavía no hemos terminado.
        ok = writer.write(data, encoding);
      }
    } while (i > 0 && ok);
    if (i > 0) {
      // ¡Tenía que parar temprano!
      // escribe un poco más una vez que se vacíe
      writer.once('drain', write);
    }
  }
}
```

##### Evento: 'error'
<!-- YAML
added: v0.9.4
-->

* {Error}

El evento `'error'` es emitido si ocurrió un error mientras se escribian datos o se les hacía piping. El callback listener pasa un solo argumento `Error` cuando se llama.

El stream no es cerrado cuando el evento `'error'` es emitido.

##### Evento: 'finish'
<!-- YAML
added: v0.9.4
-->

El evento `'finish'` es emitido después que el método [`stream.end()`](#stream_writable_end_chunk_encoding_callback) ha sido llamado, y todos los datos han sido arrojados al sistema subyacente.

```js
const writer = getWritableStreamSomehow();
for (let i = 0; i < 100; i++) {
  writer.write(`hello, #${i}!\n`);
}
writer.end('This is the end\n');
writer.on('finish', () => {
  console.log('All writes are now complete.');
});
```

##### Evento: 'pipe'
<!-- YAML
added: v0.9.4
-->

* `src` {stream.Readable} el stream fuente que está haciendo piping a este escribible

El evento `'pipe'` es emitido cuando el método [`stream.pipe()`][] es llamado en un stream legible, añadiendo este escribible a su conjunto de destinos.

```js
const writer = getWritableStreamSomehow();
const reader = getReadableStreamSomehow();
writer.on('pipe', (src) => {
  console.log('Something is piping into the writer.');
  assert.equal(src, reader);
});
reader.pipe(writer);
```

##### Evento: 'unpipe'
<!-- YAML
added: v0.9.4
-->

* `src` {stream.Readable} El stream fuente que hizo [unpiped][`stream.unpipe()`] en este escribible

El evento `'unpipe'` es emitido cuando es llamado el método [`stream.unpipe()`][] en un stream [`Readable`][], removiendo este [`Writable`][] de su conjunto de destinos.

Esto también es emitido en caso de que este stream [`Writable`][] emita un error cuando un stream [`Readable`][] realice pipe en él.

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

##### writable.cork()
<!-- YAML
added: v0.11.2
-->

El método `writable.cork()` forza que todos los datos escritos sean almacenados en la memoria. Los datos almacenados van a ser arrojados cuando se llame alguno de los métodos [`stream.uncork()`][] o [`stream.end()`](#stream_writable_end_chunk_encoding_callback).

La intención primordial de `writable.cork()` es evitar una situación donde escribir muchos fragmentos pequeños de datos en un stream no cause un respaldo en el búfer interno, eso tendría un impacto adverso en el desempeño. En tales situaciones, las implementaciones que implementen el método `writable._writev()` pueden ejecutar escrituras almacenadas de una manera más optimizada.

Vea también: [`writable.uncork()`][].

##### writable.destroy([error])
<!-- YAML
added: v8.0.0
-->

* `error` {Error}
* Devuelve: {this}

Destruye el stream, y emite el `'error'` pasado y un evento `'close'`. After this call, the writable stream has ended and subsequent calls to `write()` or `end()` will result in an `ERR_STREAM_DESTROYED` error. Los implementadores no deberían sobreescribir este método, pero implementa [`writable._destroy()`](#stream_writable_destroy_err_callback) en su lugar.

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

* `chunk` {string|Buffer|Uint8Array|any} Datos opcionales para escribir. Para streams que no operen en modo objeto, `chunk` debe ser un string, un `Buffer`o un `Uint8Array`. Para los streams en modo objeto, `chunk` puede ser cualquier valor de JavaScript, menos `null`.
* `encoding` {string} The encoding if `chunk` is a string
* `callback` {Function} Callback opcional cuando el stream esté terminado
* Devuelve: {this}

Llamar al método `writable.end()` señala que no se escribirán más datos en el [`Writable`][]. Los argumentos `chunk` y `encoding` opcionales permiten un último fragmento de datos adicional para ser escrito inmediatamente antes de cerrar el stream. Si es proporcionado, la función `callback` opcional es adjuntada como un listener para el evento [`'finish'`][].

Llamar el método [`stream.write()`](#stream_writable_write_chunk_encoding_callback) después de llamar a [`stream.end()`](#stream_writable_end_chunk_encoding_callback) va a provocar un error.

```js
// escribe "hello, " y luego termina con ''world!''
const fs = require('fs');
const file = fs.createWriteStream('example.txt');
file.write('hello, ');
file.end('world!');
// escribir más ahora ¡no está permitido!
```

##### writable.setDefaultEncoding(encoding)
<!-- YAML
added: v0.11.15
changes:
  - version: v6.1.0
    pr-url: https://github.com/nodejs/node/pull/5040
    description: This method now returns a reference to `writable`.
-->

* `encoding` {string} La nueva codificación predeterminada
* Devuelve: {this}

El método `writable.setDefaultEncoding()`establece el `encoding` predeterminado para un stream [`Writable`][].

##### writable.uncork()
<!-- YAML
added: v0.11.2
-->

El método `writable.uncork()` arroja todos los datos almacenados desde que [`stream.cork()`][] fue llamado.

Cuando se use [`writable.cork()`][] y `writable.uncork()` para manejar el almacenado de escritos a un stream, es recomendado que las llamadas a `writable.uncork()` sean diferidas usando `process.nextTick()`. Hacerlo permite la dosificación de todas las llamadas `writable.write()` que ocurren dentro una fase bucle de un evento Node.js dado.

```js
stream.cork();
stream.write('some ');
stream.write('data ');
process.nextTick(() => stream.uncork());
```

Si el método[`writable.cork()`][] es llamado en varias ocasiones en un stream, deben hacerse el mismo número de llamadas a `writable.uncork()` para arrojar los datos almacenados.

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

##### writable.writable
<!-- YAML
added: v0.8.0
-->

* {boolean}

Is `true` if it is safe to call [`writable.write()`][].

##### writable.writableHighWaterMark
<!-- YAML
added: v9.3.0
-->

* {number}

Devuelve el valor del `highWaterMark` pasado al construir este `Writable`.

##### writable.writableLength
<!-- YAML
added: v9.4.0
-->

Esta propiedad contiene el número de bytes (u objetos) en la cola a ser escritos. El valor proporciona datos de introspección con respecto al estatus de `highWaterMark`.

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

* `chunk` {string|Buffer|Uint8Array|any} Datos opcionales para escribir. Para streams que no operen en modo objeto, `chunk` debe ser un string, un `Buffer`o un `Uint8Array`. Para los streams en modo objeto, `chunk` puede ser cualquier valor de JavaScript, menos `null`.
* `encoding` {string} La codificación si `chunk` es un string
* `callback` {Function} Hace callback para cuando este fragmento de datos es arrojado
* Devuelve: {boolean} `false`si el stream desea por el código llamando a esperar por el evento `'drain'` sea emitido antes de continuar esperando escribir datos adicionales; de otra manera `true`.

El método `writable.write()` escribe algunos datos al stream, y llama al `callback` suministrado una vez que los datos han sido manejados completamente. Si ocurre un error, el `callback` *puede o no* ser llamado con el error como su primer argumento. Para detectar errores de escritura de manera fiable, añade un listener para el evento `'error'`.

El valor devuelto es `true` si el búfer interno es menor que el `highWaterMark` configurado cuando el stream fue creado después de admitir a `chunk`. Si es devuelto `false`, los siguientes intentos de escribir datos en el stream deberían detenerse hasta que el evento [`'drain'`][] es emitido.

Mientras que un stream no esté draining, llamadas a `write()` almacenaran `chunk`, y devolverán false. Una vez que todos los fragmentos almacenados son vaciados (aceptado para entrega por el sistema operativo), el evento `'drain'` será emitido. Es recomendado que una vez que `write()` devuelva false, no se escribirán más fragmentos hasta que sea emitido el evento `'drain'`. Mientras se llame `write()` en un stream donde el vaciado no está permitido, Node.js va a almacenar todos los fragmentos escritos hasta que el uso máximo de la memoria ocurra, en ese punto se anulará incondicionalmente. Incluso antes de que se anule, alto uso de la memoria causará un pobre desempeño del colector de basura, y un RSS alto (que no es típicamente liberado de vuelta al sistema, incluso después que la memoria ya no es requerida). Dado que los sockets TCP no pueden ser drenados si el peer remoto no lee los datos, escribir un socket que no se está vaciando puede llevar a vulnerabilidad explotable remota.

Writing data while the stream is not draining is particularly problematic for a [`Transform`][], because the `Transform` streams are paused by default until they are piped or a `'data'` or `'readable'` event handler is added.

Si los datos a ser escritos pueden ser generados o traídos cuando se requieren, es recomendado encapsular la lógica en un [`Readable`][] y usar [`stream.pipe()`][]. Sin embargo, si se prefiere llamar a `write()`, es posible respetar la contrapresión y evitar problemas de memoria usando el evento [`'drain'`][]:

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

Los streams legibles son una abstracción para un *source* donde los datos son consumidos.

Ejemplos de streams `Readable` inlcuyen:

* [Respuestas HTTP, en el cliente](http.html#http_class_http_incomingmessage)
* [Solicitud HTTP, en el servidor](http.html#http_class_http_incomingmessage)
* [streams read fs](fs.html#fs_class_fs_readstream)
* [streams zlib](zlib.html)
* [streams crypto](crypto.html)
* [sockets TCP](net.html#net_class_net_socket)
* [procesos secundarios stdout y stderr](child_process.html#child_process_subprocess_stdout)
* [`process.stdin`][]

Todos los streams [`Readable`][] implementan la interfaz definida por la clase `stream.Readable`.

#### Two Reading Modes

`Readable` streams effectively operate in one of two modes: flowing and paused. These modes are separate from [object mode](#stream_object_mode). A [`Readable`][] stream can be in object mode or not, regardless of whether it is in flowing mode or paused mode.

* In flowing mode, data is read from the underlying system automatically and provided to an application as quickly as possible using events via the [`EventEmitter`][] interface.

* En el modo pausado, el método [`stream.read()`](#stream_readable_read_size) debe ser llamado para leer explícitamente fragmentos de datos del stream.

Todos los streams [`Readable`][] comienzan en el modo pausado, pero pueden ser cambiados al modo fluido en una de las siguientes maneras:

* Añadiendo un manejador de eventos [`'data'`][].
* Llamar al método [`stream.resume()`](#stream_readable_resume).
* Llamar al método [`stream.pipe()`][] para enviar los datos a un [`Writable`][].

El `Readable` puede ser cambiado de vuelta al modo pausado usando alguno de los siguientes:

* Si no existen destinos pipe, al llamar al método [`stream.pause()`](#stream_readable_pause).
* Si existen destinos pipe, al remover todos los destinos pipe. Múltiples destinos pipe pueden ser eliminados al llamar el método [`stream.unpipe()`][].

El concepto importante a recordar es que un `Readable` no va a generar datos hasta que sea proporcionado un mecanismo para ya sea consumir o ignorar los datos. Si el mecanismo de consumir los datos está deshabilitado o es quitado, el `Readable` va a *intentar* de dejar de generar los datos.

For backward compatibility reasons, removing [`'data'`][] event handlers will **not** automatically pause the stream. También, si hay destinos que fueron pipe, entonces llamar a [`stream.pause()`](#stream_readable_pause) no va a garantizar que el stream va a *permanecer* pausado una vez que esos destinos se vacíen y pidan más datos.

Si un [`Readable`][] es cambiado al modo fluido y no hay consumidores disponibles para manejar los datos, los datos se perderán. Esto puede ocurrir, por ejemplo, cuando el método `readable.resume()` es llamado sin un listener adjunto al evento `'data'`, o cuando el manejador de evento `'data'` es eliminado del stream.

Adding a [`'readable'`][] event handler automatically make the stream to stop flowing, and the data to be consumed via [`readable.read()`](#stream_readable_read_size). If the [`'readable'`] event handler is removed, then the stream will start flowing again if there is a [`'data'`][] event handler.

#### Tres Estados

Los "dos modos" de operación para un stream `Readable` son una abstracción simplificada para el manejo del estado interno que es más complicado y está pasando en la implementación del stream `Readable`.

Específicamente, en cualquier momento dado, cada `Readable` está en uno de tres estados posibles:

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
// readableFlowing is now false

pass.on('data', (chunk) => { console.log(chunk.toString()); });
pass.write('ok');  // will not emit 'data'
pass.resume();     // must be called to make stream emit 'data'
```

While `readable.readableFlowing` is `false`, data may be accumulating within the stream's internal buffer.

#### Choose One API Style

El API del stream `Readable` ha evolucionado a través de de múltiples versiones de Node.js y ha proporcionado múltiples métodos de consumir los datos del stream. In general, developers should choose *one* of the methods of consuming data and *should never* use multiple methods to consume data from a single stream. Specifically, using a combination of `on('data')`, `on('readable')`, `pipe()`, or async iterators could lead to unintuitive behavior.

Es recomendado el uso del método `readable.pipe()` para la mayoría de los usuarios, como ha sido implementado para proporcionar la manera más sencilla de consumo de datos del stream. Developers that require more fine-grained control over the transfer and generation of data can use the [`EventEmitter`][] and `readable.on('readable')`/`readable.read()` or the `readable.pause()`/`readable.resume()` APIs.

#### Clase: stream.Readable
<!-- YAML
added: v0.9.4
-->

<!--type=class-->

##### Evento: 'close'
<!-- YAML
added: v0.9.4
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18438
    description: Add `emitClose` option to specify if `'close'` is emitted on
                 destroy.
-->

El evento `'close'` es emitido cuando el stream y cualquiera de sus recursos subyacentes (por ejemplo, un descriptor de archivos) han sido cerrados. El evento indica que no se emitirán más eventos, y no se producirá ninguna computación adicional.

A [`Readable`][] stream will always emit the `'close'` event if it is created with the `emitClose` option.

##### Evento: 'data'
<!-- YAML
added: v0.9.4
-->

* `chunk` {Buffer|string|any} El fragmento de datos. Para streams que no están operando en modo objeto, los fragmentos serán un string o un `Buffer`. Para los streams que están en modo objeto, los fragmentos pueden ser cualquier valor JavaScript, menos un `null`.

El evento `'data'` es emitido cada vez que el stream renuncié a la propiedad de un fragmento de datos a un consumidor. Esto puede ocurrir cuando el stream es cambiado a modo fluido al llamar `readable.pipe()`, `readable.resume()`, o al adjuntar un callback listener al evento `'data'`. El evento `'data'` también será emitido cada vez que el método `readable.read()` sea llamado y un fragmento de los datos estén disponibles para ser devueltos.

Adjuntar un listener del evento `'data'` a un stream que no ha sido pausado explícitamente cambiará el stream a modo fluido. Los datos serán pasados tan pronto como estén disponibles.

El callback del listener será pasado al fragmento de datos como un string si una codificación predeterminada ha sido especificada para el stream usando el método `readable.setEncoding()`; de otra manera los datos serán pasados como un `Buffer`.

```js
const readable = getReadableStreamSomehow();
readable.on('data', (chunk) => {
  console.log(`Received ${chunk.length} bytes of data.`);
});
```

##### Evento: 'end'
<!-- YAML
added: v0.9.4
-->

El evento `'end'` es emitido cuando no hay más datos a ser consumidos del stream.

El evento `'end'` **no será emitido** a menos que los datos sean completamente consumidos. Esto se puede lograr cambiando el stream a modo fluido, o al llamar repetidamente a [`stream.read()`](#stream_readable_read_size) hasta que los datos hayan sido consumidos.

```js
const readable = getReadableStreamSomehow();
readable.on('data', (chunk) => {
  console.log(`Received ${chunk.length} bytes of data.`);
});
readable.on('end', () => {
  console.log('There will be no more data.');
});
```

##### Evento: 'error'
<!-- YAML
added: v0.9.4
-->

* {Error}

El evento `'error'` puede ser emitido por una implementación de `Readable` en cualquier momento. De forma general, esto puede ocurrir si el stream subyacente no es capaz de generar datos debido a una falla interna subyacente, o cuando una implementación del stream intenta empujar un fragmento de datos inválido.

El callback del listener aprobará un solo objeto `Error`.

##### Evento: 'readable'
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

El evento `'readable'` es emitido cuando hay datos disponibles para ser leídos del stream. En algunos casos, adjuntar un listener para el evento `'readable'` va a causar que cierta cantidad de datos sean leídos en un búfer interno.

```javascript
const readable = getReadableStreamSomehow();
readable.on('readable', function() {
  // ahora hay algo de datos para ser leídos 
  let data;

  while (data = this.read()) {
    console.log(data);
  }
});
```

El evento `'readable'` también será emitido una vez que ha sido alcanzado el final de los datos del stream, pero antes de que se emita el evento `'end'`.

Efectivamente, el evento `'readable'` indica que el stream tiene nueva información: ya sea que nuevos datos están disponibles, o que el final del stream ha sido alcanzado. En el primer caso, [`stream.read()`](#stream_readable_read_size) devolverá los datos disponibles. En el segundo caso, [`stream.read()`](#stream_readable_read_size) devolverá `null`. Por ejemplo En el siguiente caso, `foo.txt` es un archivo vacío:

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

La salida de ejecutar este script es:

```txt
$ node test.js
readable: null
end
```

En general, los mecanismos de eventos `readable.pipe()` y `'data'` son más sencillos de entender que el evento `'readable'`. Sin embargo, manejar `'readable'` podría resultar en un aumento del rendimiento.

If both `'readable'` and [`'data'`][] are used at the same time, `'readable'` takes precedence in controlling the flow, i.e. `'data'` will be emitted only when [`stream.read()`](#stream_readable_read_size) is called. The `readableFlowing` property would become `false`. If there are `'data'` listeners when `'readable'` is removed, the stream will start flowing, i.e. `'data'` events will be emitted without calling `.resume()`.

##### readable.destroy([error])
<!-- YAML
added: v8.0.0
-->

* `error` {Error} Error que será pasado como una carga en el evento `'error'`
* Devuelve: {this}

Destruye el stream, luego emite `'error'` y `'close'`. Después de esta llamada, el stream legible liberará cualquier recurso interno y las llamadas posteriores a `push()` serán ignoradas. Los implementadores no deberían sobreescribir este método, en su lugar implementar [`readable._destroy()`](#stream_readable_destroy_err_callback).

##### readable.isPaused()
<!-- YAML
added: v0.11.14
-->

* Devuelve: {boolean}

El método `readable.isPaused()` devuelve el estado de operaciones actual del `Readable`. Esto es usado principalmente por el mecanismo que vuelve subyacente el método `readable.pipe()`. En la mayoría de los casos típicos, no existirá razón para usar este método directamente.

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

* Devuelve: {this}

El método `readable.pause()` causará que un stream en modo fluido detenga la emisión de los eventos [`'data'`][], saliendo del modo fluido. Todos los datos que se vuelvan disponibles permanecerán en el búfer interno.

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

El método `readable.pause()` no tiene efecto si existe un listener de evento `'readable'`.

##### readable.pipe(destination[, options])
<!-- YAML
added: v0.9.4
-->

* `destination` {stream.Writable} El destino para escribir datos
* `options` {Object} Pipe options
  * `end` {boolean} Finaliza el escritor cuando el lector termina. **Predeterminado:** `true`.
* Returns: {stream.Writable} The *destination*, allowing for a chain of pipes if it is a [`Duplex`][] or a [`Transform`][] stream

El método `readable.pipe()` adjunta un stream [`Writable`][] al `readable`, causando el cambio automático a modo fluido y empujando todos sus datos al [`Writable`][] adjunto. El flujo de datos será automáticamente manejado para que el stream `Writable` de destino no sea abrumado por un stream `Readable` más rápido.

El siguiente ejemplo hace pipe en todos los datos del `readable` a un archivo llamado `file.txt`:

```js
const fs = require('fs');
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// Todos los datos del legible van a ''file.txt''
readable.pipe(writable);
```
Es posible adjuntar múltiples streams `Writable` en un solo stream `Readable`.

El método `readable.pipe()` puede devolver una referencia al stream *destination*, haciendo posible establecer cadenas de streams piped:

```js
const fs = require('fs');
const r = fs.createReadStream('file.txt');
const z = zlib.createGzip();
const w = fs.createWriteStream('file.txt.gz');
r.pipe(z).pipe(w);
```

De manera predeterminada, [`stream.end()`](#stream_writable_end_chunk_encoding_callback) es llamado en el stream `Writable` de destino cuando el stream `Readable` fuente emite [`'end'`][], para que el destino no sea más escribible. To disable this default behavior, the `end` option can be passed as `false`, causing the destination stream to remain open:

```js
reader.pipe(writer, { end: false });
reader.on('end', () => {
  writer.end('Goodbye\n');
});
```

Una advertencia importante es que si el stream `Readable` emite un error durante el procesamiento, el destino `Writable` *no es cerrado* automáticamente. Si ocurre un error, será necesario de cerrar *manually* cada stream en orden, para prevenir fugas de memoria.

Los streams [`process.stderr`][] y [`process.stdout`][] `Writable` nunca son cerrados hasta que el proceso Node.js se cierra, independientemente de las opciones especificadas.

##### readable.read([size])
<!-- YAML
added: v0.9.4
-->

* `size` {number} Argumento opcional para especificar cuántos datos se van a leer.
* Devuelve: {string|Buffer|null|any}

El método `readable.read()` sustrae algunos datos del búfer interno y los devuelve. Si no hay datos disponibles para leer, se devuelve `null`. De manera predeterminada, los datos se devolverán como un objeto `Buffer`, a menos de que una codificación haya sido especificada usando el método `readable.setEncoding()`, o que el stream esté operando en modo objeto.

El argumento `size` opcional especifica un número de bytes para leer. Si el `size` de los bytes no están disponibles para ser leídos, `null` será devuelto *a menos que* el stream haya terminado, en tal caso todos los datos restantes en el búfer interno serán devueltos.

Si el `size` del argumento no es especificado, todos los datos que están en el búfer interno serán devueltos.

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

Note that the `while` loop is necessary when processing data with `readable.read()`. Only after `readable.read()` returns `null`, [`'readable'`]() will be emitted.

A `Readable` stream in object mode will always return a single item from a call to [`readable.read(size)`](#stream_readable_read_size), regardless of the value of the `size` argument.

If the `readable.read()` method returns a chunk of data, a `'data'` event will also be emitted.

Calling [`stream.read([size])`](#stream_readable_read_size) after the [`'end'`][] event has been emitted will return `null`. No se levantará ningún error runtime.

##### readable.readable
<!-- YAML
added: v0.8.0
-->

* {boolean}

Is `true` if it is safe to call [`readable.read()`][].

##### readable.readableHighWaterMark
<!-- YAML
added: v9.3.0
-->

* {number}

Returns the value of `highWaterMark` passed when constructing this `Readable`.

##### readable.readableLength
<!-- YAML
added: v9.4.0
-->

* {number}

This property contains the number of bytes (or objects) in the queue ready to be read. El valor proporciona datos de introspección con respecto al estatus de `highWaterMark`.

##### readable.resume()
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

##### readable.setEncoding(encoding)
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

##### readable.unpipe([destination])
<!-- YAML
added: v0.9.4
-->

* `destination` {stream.Writable} Stream específico opcional para no hacer pipe
* Devuelve: {this}

The `readable.unpipe()` method detaches a `Writable` stream previously attached using the [`stream.pipe()`][] method.

Si el `destination` no es especificado, entonces *todos* los pipes son separados.

Si el `destination` es especificado, pero no se configura ningún pipe para él. entonces el método no hace nada.

```js
const fs = require('fs');
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// All the data from readable goes into 'file.txt',
// but only for the first second
readable.pipe(writable);
setTimeout(() => {
  console.log('Stop writing to file.txt.');
  readable.unpipe(writable);
  console.log('Manually close the file stream.');
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

* `chunk` {Buffer|Uint8Array|string|any} Fragmento de datos para hacer unshift en la cola de lectura. Para streams que no operen en modo objeto, `chunk` debe ser un string, un `Buffer` o un `Uint8Array`. Para streams en modo objeto, `chunk` puede ser cualquier valor de JavaScript, menos `null`.

El método `readable.unshift()` empuja un fragmento de datos de vuelta al búfer interno. Esto es útil en ciertas situaciones, cuando un stream está siendo consumido por código que necesita "no-consumir" alguna cantidad de datos que ha sido sacada de forma optimista de la fuente, para que los datos puedan ser pasados a otra parte.

The `stream.unshift(chunk)` method cannot be called after the [`'end'`][] event has been emitted or a runtime error will be thrown.

Developers using `stream.unshift()` often should consider switching to use of a [`Transform`][] stream instead. Vea la sección [API para los Implementadores de Stream](#stream_api_for_stream_implementers) para más información.

```js
// Sustrae un encabezado delimitado por \n\n
// usa unshift() si obtenemos mucho
// Llama al callback (error, encabezado, stream)
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
        // límite del encabezado encontrado
        const split = str.split(/\n\n/);
        header += split.shift();
        const remaining = split.join('\n\n');
        const buf = Buffer.from(remaining, 'utf8');
        stream.removeListener('error', callback);
        // remueve el listener ''readable'' antes de hacer unshifting
        stream.removeListener('readable', onReadable);
        if (buf.length)
          stream.unshift(buf);
        // ahora el cuerpo del mensaje puede ser leído del stream.
        callback(null, encabezado, stream);
      } else {
        // aún está leyendo el encabezado.
        header += str;
      }
    }
  }
}
```

Unlike [`stream.push(chunk)`](#stream_readable_push_chunk_encoding), `stream.unshift(chunk)` will not end the reading process by resetting the internal reading state of the stream. This can cause unexpected results if `readable.unshift()` is called during a read (i.e. from within a [`stream._read()`](#stream_readable_read_size_1) implementation on a custom stream). Following the call to `readable.unshift()` with an immediate [`stream.push('')`](#stream_readable_push_chunk_encoding) will reset the reading state appropriately, however it is best to simply avoid calling `readable.unshift()` while in the process of performing a read.

##### readable.wrap(stream)
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

##### readable\[Symbol.asyncIterator\]()
<!-- YAML
added: v10.0.0
-->

> Estabilidad: 1 - Experimental

* Returns: {AsyncIterator} to fully consume the stream.

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

If the loop terminates with a `break` or a `throw`, the stream will be destroyed. In other terms, iterating over a stream will consume the stream fully. The stream will be read in chunks of size equal to the `highWaterMark` option. In the code example above, data will be in a single chunk if the file has less then 64kb of data because no `highWaterMark` option is provided to [`fs.createReadStream()`][].

### Streams Duplex y de Transformación

#### Clase: stream.Duplex
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

#### Clase: stream.Transform
<!-- YAML
added: v0.9.4
-->

<!--type=class-->

Transform streams are [`Duplex`][] streams where the output is in some way related to the input. Like all [`Duplex`][] streams, `Transform` streams implement both the [`Readable`][] and [`Writable`][] interfaces.

Examples of `Transform` streams include:

* [streams zlib](zlib.html)
* [streams crypto](crypto.html)

##### transform.destroy([error])
<!-- YAML
added: v8.0.0
-->
* `error` {Error}

Destruye el stream, luego emite `'error'`. Después de esta llamada, el stream de transformación liberaría cualquier recurso interno. Los implementadores no deberían sobreescribir este método, en su lugar implementar [`readable._destroy()`](#stream_readable_destroy_err_callback). The default implementation of `_destroy()` for `Transform` also emit `'close'`.

### stream.finished(stream, callback)
<!-- YAML
added: v10.0.0
-->

* `stream` {Stream} A readable and/or writable stream.
* `callback` {Function} Una función callback que toma un argumento error opcional.

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

rs.resume(); // drain the stream
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
rs.resume(); // drain the stream
```

### stream.pipeline(...streams[, callback])
<!-- YAML
added: v10.0.0
-->

* `...streams` {Stream} Two or more streams to pipe between.
* `callback` {Function} Una función callback que toma un argumento error opcional.

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

## Api para Implementadores de Streams

<!--type=misc-->

El API del módulo `stream` ha sido diseñado para hacer posible implementar fácilmente streams usando el modelo prototipo heredado de JavaScript.

Primero, un desarrollador de stream declararía una nueva clase JavaScript que extiende una de las 4 clases de stream básicas (`stream.Writable`, `stream.Readable`, `stream.Duplex`, o `stream.Transform`), asegurándose que llamen el constructor de clase primaria apropiado:
```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor(options) {
    super(options);
    // ...
  }
}
```

La nueva clase stream entonces debe implementar una o métodos más específicos, dependiendo del tipo de stream siendo creado, como es detallado en el siguiente gráfico:

| Casos de uso                                    | Clase         | Método(s) a implementar                                                                                 |
| ----------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------- |
| Solo lectura                                    | [`Readable`]  | <code>[_read][stream-_read]</code>                                                                               |
| Solo escritura                                  | [`Writable`]  | <code>[_write][stream-_write]</code>, <code>[_writev][stream-_writev]</code>, <code>[_final][stream-_final]</code>                           |
| Lectura y escritura                             | [`Duplex`]    | <code>[_read][stream-_read]</code>, <code>[_write][stream-_write]</code>, <code>[_writev][stream-_writev]</code>, <code>[_final][stream-_final]</code> |
| Opera en datos escritos, luego lee el resultado | [`Transform`] | <code>[_transform][stream-_transform]</code>, <code>[_flush][stream-_flush]</code>, <code>[_final][stream-_final]</code>                          |

The implementation code for a stream should *never* call the "public" methods of a stream that are intended for use by consumers (as described in the [API for Stream Consumers](#stream_api_for_stream_consumers) section). Doing so may lead to adverse side effects in application code consuming the stream.

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

Custom `Writable` streams *must* call the `new stream.Writable([options])` constructor and implement the `writable._write()` method. The `writable._writev()` method *may* also be implemented.

#### Constructor: new stream.Writable([options])<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18438
    description: >
      Add `emitClose` option to specify if `'close'` is emitted on destroy
  - version: v10.16.0
    pr-url: https://github.com/nodejs/node/pull/22795
    description: >
      Add `autoDestroy` option to automatically `destroy()` the stream
      when it emits `'finish'` or errors
-->* `opciones` {Object}
  * `highWaterMark` {number} Nivel del búfer cuando [`stream.write()`](#stream_writable_write_chunk_encoding_callback) empieza a devolver `false`. **Predeterminado:** `16384` (16kb), o `16` para streams `objectMode`.
  * `decodeStrings` {boolean} Whether to encode `string`s passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback) to `Buffer`s (with the encoding specified in the [`stream.write()`](#stream_writable_write_chunk_encoding_callback) call) before passing them to [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1). Other types of data are not converted (i.e. `Buffer`s are not decoded into `string`s). Setting to false will prevent `string`s from being converted.  **Predeterminado:** `true`.
  * `defaultEncoding` {string} The default encoding that is used when no encoding is specified as an argument to [`stream.write()`](#stream_writable_write_chunk_encoding_callback). **Predeterminado:** `'utf8'`.
  * `objectMode` {boolean} Ya sea [`stream.write(anyObj)`](#stream_writable_write_chunk_encoding_callback) una operación válida o no. Cuando es establecido, se hace posible escribir otros valores de JavaScript aparte de string, `Buffer` o `Uint8Array` si lo soporta la implementación del stream. **Predeterminado:** `false`.
  * `emitClose` {boolean} Whether or not the stream should emit `'close'` after it has been destroyed. **Predeterminado:** `true`.
  * `write` {Function} Implementación para el método [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1).
  * `writev` {Function} Implementación para el método [`stream._writev()`](#stream_writable_writev_chunks_callback).
  * `destroy` {Function} Implementación para el método [`stream._destroy()`](#stream_writable_destroy_err_callback).
  * `final` {Function} Implementación para el método [`stream._final()`](#stream_writable_final_callback).
  * `autoDestroy` {boolean} Whether this stream should automatically call `.destroy()` on itself after ending. **Predeterminado:** `false`.
```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor(options) {
    // Llama al constructor stream.Writable()
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

#### writable.\_write(chunk, encoding, callback)

* `chunk` {Buffer|string|any} The `Buffer` to be written, converted from the `string` passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback). If the stream's `decodeStrings` option is `false` or the stream is operating in object mode, the chunk will not be converted & will be whatever was passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback).
* `encoding` {string} Si el fragmento es un string, entonces `encoding` es el codificador de carácter de ese string. Si el fragmento es un `Buffer`, o si el stream está operando en modo objeto, `encoding` pudiera ser ignorado.
* `callback` {Function} Llama esta función (opcionalmente con un argumento error) cuando el procesamiento es completado para el fragmento suministrado.

All `Writable` stream implementations must provide a [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1) method to send data to the underlying resource.

[`Transform`][] streams provide their own implementation of the [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1).

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Writable` class methods only.

El método `callback` debe ser llamado para señalar que la escritura se terminó con éxito o falló con un error. El primer argumento pasado al `callback` debe ser el objeto `Error` si la llamada falla, o `null` si la escritura tuvo éxito.

Todas las llamadas a `writable.write()` que ocurren en el tiempo que `writable._write()` es llamado y el `callback` es llamado causará que los datos escritos sean almacenados en el búfer. Cuando el `callback` es invocado, el stream pudiera emitir un evento [`'drain'`][]. Si una implementación de stream es capaz de procesar múltiples fragmentos de datas al mismo tiempo, el método `writable._writev()` debería ser implementado.

If the `decodeStrings` property is explicitly set to `false` in the constructor options, then `chunk` will remain the same object that is passed to `.write()`, and may be a string rather than a `Buffer`. This is to support implementations that have an optimized handling for certain string data encodings. In that case, the `encoding` argument will indicate the character encoding of the string. Otherwise, the `encoding` argument can be safely ignored.

El método `writable._write()` es ajustado con un subrayado porque es interno a la clase que lo define, y no debería ser llamado directamente por programas de usuario.

#### writable.\_writev(chunks, callback)

* `chunks` {Object[]} The chunks to be written. Cada fragmento tiene el siguiente formato: `{ chunk: ..., encoding: ... }`.
* `callback` {Function} Una función callback (opcionalmente con un argumento error) para ser invocada cuando el procesamiento de los fragmentos suministrados es completado.

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Writable` class methods only.

El método `writable._writev()` puede ser implementado en conjunto con `writable._write()` en las implementaciones del steam que son capaces de procesar al mismo tiempo múltiples fragmentos de datos. Si es implementado, el método será llamado con todos los fragmentos de datos que están siendo almacenados en la cola de escritura.

El método `writable._writev()` es ajustado con un subrayado porque es interno a la clase que lo define, y no debería ser llamado directamente por programas de usuario.

#### writable.\_destroy(err, callback)<!-- YAML
added: v8.0.0
-->* `err` {Error} Un posible error.
* `callback` {Function} Una función callback que toma un argumento error opcional.

El método `_destroy()` es llamado por [`writable.destroy()`](#stream_writable_destroy_error). Puede ser sobrescrito por clases secundarias pero **no debe** ser llamado directamente.

#### writable.\_final(callback)<!-- YAML
added: v8.0.0
-->* `callback` {Function} Llama esta función (opcionalmente con un argumento error) cuando terminó de escribir los datos restantes.

El método `_final()` **no debe** ser llamado directamente. It may be implemented by child classes, and if so, will be called by the internal `Writable` class methods only.

This optional function will be called before the stream closes, delaying the `'finish'` event until `callback` is called. Esto es útil para cerrar recursos o escribir datos almacenados antes de que un stream termine.

#### Errores al Escribir

Es recomendado que ocurran errores durante el procesamiento de los métodos `writable._write()` y `writable._writev()` sean reportados al invocar el callback y pasar el error como el primer argumento. This will cause an `'error'` event to be emitted by the `Writable`. Throwing an `Error` from within `writable._write()` can result in unexpected and inconsistent behavior depending on how the stream is being used. Usar la callback asegura el manejo de errores consistente y predecible.

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

#### new stream.Readable([options])<!-- YAML
changes:
  - version: v10.16.0
    pr-url: https://github.com/nodejs/node/pull/22795
    description: >
      Add `autoDestroy` option to automatically `destroy()` the stream
      when it emits `'end'` or errors
-->* `opciones` {Object}
  * `highWaterMark` {number} El máximo [número de bytes](#stream_highwatermark_discrepancy_after_calling_readable_setencoding) para almacenar en el búfer interno antes de cesar la lectura desde el recurso subyacente. **Default:** `16384` (16kb), or `16` for `objectMode` streams.
  * `encoding` {string} Si es especificado, los búferes van a ser decodificados a strings usando la codificación especificada. **Predeterminado:** `null`.
  * `objectMode` {boolean} Si este stream debería comportarse como un stream de objetos, o no. Meaning that [`stream.read(n)`](#stream_readable_read_size) returns a single value instead of a `Buffer` of size `n`. **Predeterminado:** `false`.
  * `read` {Function} Implementación para el método [`stream._read()`](#stream_readable_read_size_1).
  * `destroy` {Function} Implementation for the [`stream._destroy()`](#stream_readable_destroy_err_callback) method.
  * `autoDestroy` {boolean} Whether this stream should automatically call `.destroy()` on itself after ending. **Predeterminado:** `false`.
```js
const { Readable } = require('stream');

class MyReadable extends Readable {
  constructor(options) {
    // Llama al constructor stream.Readable(options)
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

#### readable.\_read(size)<!-- YAML
added: v0.9.4
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17979
    description: call `_read()` only once per microtick
-->* `size` {number} Números de bytes para ser leídos asincrónicamente

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Readable` class methods only.

All `Readable` stream implementations must provide an implementation of the `readable._read()` method to fetch data from the underlying resource.

Cuando `readable._read()` es llamado, si hay datos disponibles de la fuente, la implementación debería comenzar a enviar esos datos a dentro de la cola de lectura usando el método [`this.push(dataChunk)`](#stream_readable_push_chunk_encoding). `_read()` debería continuar leyendo del recurso y enviar datos hasta que `readable.push()` devuelva `false`. Solo cuando `_read()` es llamado otra vez después que se ha detenido debería continuar el envío de datos adicionales a la cola.

Once the `readable._read()` method has been called, it will not be called again until the [`readable.push()`](#stream_readable_push_chunk_encoding) method is called. `readable._read()` is guaranteed to be called only once within a synchronous execution, i.e. a microtick.

El argumento `size` es consultivo. Para implementaciones donde un "read" es una sola operación que devuelve datos, puede usar el argumento `size` para determinar cuántos datos recoger. Otras implementaciones pudieran ignorar este argumento y simplemente proporcionar los datos cuando estén disponibles. No hay que "esperar" hasta que los bytes de `size` estén disponibles antes de llamar a [`stream.push(chunk)`](#stream_readable_push_chunk_encoding).

El método `readable._read()` es ajustado con un subrayado porque es interno a la clase que lo define, y no debería ser llamado directamente por programas de usuario.

#### readable.\_destroy(err, callback)<!-- YAML
added: v8.0.0
-->* `err` {Error} Un posible error.
* `callback` {Function} Una función callback que toma un argumento error opcional.

El método `_destroy()` es llamado por [`readable.destroy()`](#stream_readable_destroy_error). Puede ser sobrescrito por clases secundarias pero **no debe** ser llamado directamente.

#### readable.push(chunk[, encoding])<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->* `chunk` {Buffer|Uint8Array|string|null|any} Fragmento de datos a ser empujados en la cola de lectura. Para streams que no operen en modo objeto, `chunk` debe ser un string, un `Buffer` o un `Uint8Array`. Para streams en modo objeto, `chunk` puede ser cualquier valor JavaScript.
* `encoding` {string} Codificación de los fragmentos string. Must be a valid `Buffer` encoding, such as `'utf8'` or `'ascii'`.
* Returns: {boolean} `true` if additional chunks of data may continue to be pushed; `false` otherwise.

Cuando `chunk` es un `Buffer`, `Uint8Array` o un `string`, el `chunk` de datos será añadido a la cola interna para los usuarios del stream a consumir. Pasar `chunk` como `null` señala el final del stream (EOF), después que no se pueden escribir más datos.

When the `Readable` is operating in paused mode, the data added with `readable.push()` can be read out by calling the [`readable.read()`](#stream_readable_read_size) method when the [`'readable'`][] event is emitted.

When the `Readable` is operating in flowing mode, the data added with `readable.push()` will be delivered by emitting a `'data'` event.

El método `readable.push()` está diseñado para ser tan flexible como sea posible. For example, when wrapping a lower-level source that provides some form of pause/resume mechanism, and a data callback, the low-level source can be wrapped by the custom `Readable` instance:

```js
// la fuente es un objeto con métodos readStop() y readStart(),
// y un miembro `ondata` que es llamado cuando tiene datos, y
// un miembro `onend` que es llamado cuando se acaban los datos.

class SourceWrapper extends Readable {
  constructor(options) {
    super(options);

    this._source = getLowlevelSourceObject();

    // Cada vez que hay datos, los empuja al búfer interno.
    this._source.ondata = (chunk) => {
      // si push() devuelve false, entonces detiene la lectura de la fuente
      if (!this.push(chunk))
        this._source.readStop();
    };

    // Cuando la fuente se termina, empuja el  fragmento `null` señalador-EOF
    this._source.onend = () => {
      this.push(null);
    };
  }
  // _read será llamado cuando el stream quiera sustraer más datos
  // el argumento del tamaño consultivo es ignorado en este caso.
  _read(size) {
    this._source.readStart();
  }
}
```

The `readable.push()` method is intended be called only by `Readable` implementers, and only from within the `readable._read()` method.

Para streams que no estén operando en modo objeto, si el parámetro `chunk` de `readable.push()` es `undefined`, será tratado como un string vacío o un búfer. Vea [`readable.push('')`][] para más información.

#### Errores al Escribir

Es recomendado que los errores que ocurran durante el procesamiento del método `readable._read()` sean emitidos usando el evento `'error'` en vez de ser arrojados. Throwing an `Error` from within `readable._read()` can result in unexpected and inconsistent behavior depending on whether the stream is operating in flowing or paused mode. Usar el evento `'error'` asegura el manejo de errores consistente y predecible.
```js
const { Readable } = require('stream');

const myReadable = new Readable({
  read(size) {
    if (checkSomeErrorCondition()) {
      process.nextTick(() => this.emit('error', err));
      return;
    }
    // haz algo de trabajo
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

#### new stream.Duplex(options)<!-- YAML
changes:
  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14636
    description: The `readableHighWaterMark` and `writableHighWaterMark` options
                 are supported now.
-->* `options` {Object} Passed to both `Writable` and `Readable` constructors. También tiene los siguientes campos:
  * `allowHalfOpen` {boolean} Si se establece como `false`, entonces el stream va a terminar el lado escribible automáticamente cuando el lado legible termine. **Predeterminado:** `true`.
  * `readableObjectMode` {boolean} Establece `objectMode` para el lado legible del stream. No tiene efecto si `objectMode` es `true`. **Predeterminado:** `false`.
  * `writableObjectMode` {boolean} Establece `objectMode` para el lado escribible del stream. No tiene efecto si `objectMode` es `true`. **Predeterminado:** `false`.
  * `readableHighWaterMark` {number} Establece `highWaterMark` para el lado legible del stream. No tiene efecto si se proporciona `highWaterMark`.
  * `writableHighWaterMark` {number} Establece `highWaterMark` para el lado escribible del stream. No tiene efecto si se proporciona `highWaterMark`.
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

#### Modo Objeto de Streams Dúplex

For `Duplex` streams, `objectMode` can be set exclusively for either the `Readable` or `Writable` side using the `readableObjectMode` and `writableObjectMode` options respectively.

In the following example, for instance, a new `Transform` stream (which is a type of [`Duplex`][] stream) is created that has an object mode `Writable` side that accepts JavaScript numbers that are converted to hexadecimal strings on the `Readable` side.

```js
const { Transform } = require('stream');

// Todos los streams de Transformacion también son Streams Dúplex
const myTransform = new Transform({
  writableObjectMode: true,

  transform(chunk, encoding, callback) {
    // Obliga al fragmento a un número si es necesario
    chunk |= 0;

    // Transforma el fragmento a otra cosa.
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

#### new stream.Transform([options])

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

#### Eventos: 'finish' y 'end'

Los eventos [`'finish'`][] y [`'end'`][] son de las clases `stream.Writable` y `stream.Readable`, respectivamente. El evento `'finish'` es emitido después que se llama [`stream.end()`](#stream_writable_end_chunk_encoding_callback)y todos los fragmentos han sido procesados by [`stream._transform()`](#stream_transform_transform_chunk_encoding_callback). El evento`'end'` es emitido después que todos los datos han sido sacados, lo que ocurre luego de que se llamó la callback en [`transform._flush()`](#stream_transform_flush_callback).

#### transform.\_flush(callback)

* `callback` {Function} Una función callback (opcionalmente con un argumento error y datos) a ser llamada cuando los datos han sido arrojados.

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Readable` class methods only.

En algunos casos, una operación de transformación pudiera emitir un bit adicional de datos en el final del stream. Por ejemplo, un stream de compresión `zlib` va a almacenar una cantidad de estado interno usado para la compresión óptima de la salida. Cuando el stream termina, sin embargo, esos datos adicionales necesitan ser arrojados para que los datos comprimidos estén completos.

Custom [`Transform`][] implementations *may* implement the `transform._flush()` method. This will be called when there is no more written data to be consumed, but before the [`'end'`][] event is emitted signaling the end of the [`Readable`][] stream.

Dentro de la implementación `transform._flush()`, el método `readable.push()` puede ser llamado cero o más veces, según corresponda. La función `callback` debe ser llamada cuando la operación de descarga es completada.

El método `transform._flush()` es ajustado con un subrayado porque es interno a la clase que lo define, nunca debería ser llamado directamente por programas de usuario.

#### transform.\_transform(fragmento, codificación, callback)

* `chunk` {Buffer|string|any} The `Buffer` to be transformed, converted from the `string` passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback). If the stream's `decodeStrings` option is `false` or the stream is operating in object mode, the chunk will not be converted & will be whatever was passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback).
* `encoding` {string} Si el fragmento es un string, entonces esto es el tipo de codificación. Si el fragmento es un búfer, entonces este es el valor especial - 'buffer', ignóralo en este caso.
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

#### Clase: stream.PassThrough

The `stream.PassThrough` class is a trivial implementation of a [`Transform`][] stream that simply passes the input bytes across to the output. Su propósito es principalmente para ejemplos y pruebas, pero hay algunos casos de uso donde `stream.PassThrough` es útil como un bloque de construcción para nuevos tipos de streams.

## Notas adicionales<!--type=misc-->### Compatibilidad con las versiones anteriores de Node.js<!--type=misc-->Prior to Node.js 0.10, the `Readable` stream interface was simpler, but also less powerful and less useful.

* Rather than waiting for calls to the [`stream.read()`](#stream_readable_read_size) method, [`'data'`][] events would begin emitting immediately. Las aplicaciones que necesiten realizar cierta cantidad de trabajo para decidir cómo manejar los datos, fueron requeridas que almacenen los datos en los búferes para que los datos no se perdieran.
* El método [`stream.pause()`](#stream_readable_pause) era consultivo, en vez de garantizado. Esto significaba que era necesario estar preparado para recibir eventos [`'data'`][] *incluso cuando el stream estaba en estado pausado*.

In Node.js 0.10, the [`Readable`][] class was added. For backward compatibility with older Node.js programs, `Readable` streams switch into "flowing mode" when a [`'data'`][] event handler is added, or when the [`stream.resume()`](#stream_readable_resume) method is called. El efecto es que, incluso cuando no se use el nuevo método [`stream.read()`](#stream_readable_read_size) y el evento [`'readable'`][], ya no será necesario preocuparse por la pérdida de fragmentos [`'data'`][].

Mientras que la mayoría de las aplicaciones continuarán funcionando con normalidad, esto introduce un caso extremo en las siguientes condiciones:

* Ningún listener de evento [`'data'`][] es añadido.
* El método [`stream.resume()`](#stream_readable_resume) nunca es llamado.
* El stream no hace pipe a ningún destino escribible.

Por ejemplo, considera el siguiente código:

```js
// ¡ADVERTENCIA!  ¡ROTO!
net.createServer((socket) => {

  // we add an 'end' listener, but never consume the data
  socket.on('end', () => {
    // It will never get here.
    socket.end('The message was received but was not processed.\n');
  });

}).listen(1337);
```

Prior to Node.js 0.10, the incoming message data would be simply discarded. However, in Node.js 0.10 and beyond, the socket remains paused forever.

La solución alternativa en esta situación es llamar al método [`stream.resume()`](#stream_readable_resume) para iniciar el flujo de datos:

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

In addition to new `Readable` streams switching into flowing mode, pre-0.10 style streams can be wrapped in a `Readable` class using the [`readable.wrap()`][`stream.wrap()`] method.

### `readable.read(0)`

Hay algunos casos donde es necesario activar una actualización de los mecanismos de stream legible subyacente, sin realmente consumir datos. En tales casos, es posible llamar a `readable.read(0)`, que siempre devolverá `null`.

Si el búfer de lectura interno está por debajo de `highWaterMark`, y el stream no está actualmente leyendo, entonces llamar a `stream.read(0)` va a activar una llamada de [`stream._read()`](#stream_readable_read_size_1) de bajo-nivel.

While most applications will almost never need to do this, there are situations within Node.js where this is done, particularly in the `Readable` stream class internals.

### `readable.push('')`

No se recomienda el uso de `readable.push('')`.

Empujar un string de cero-bytes, un `Buffer` o un `Uint8Array` a un stream que no está en modo objeto tiene un efecto secundario interesante. Porque *es* una llamada a [`readable.push()`](#stream_readable_push_chunk_encoding), la llamada va a terminar el proceso de lectura. Sin embargo, ya que el argumento es un string vacío, no se añaden datos al búfer legible, entonces no hay nada para que un usuario consuma.

### `highWaterMark` discrepancia después de llamar a `readable.setEncoding()`

El uso de `readable.setEncoding()` cambiará el comportamiento de cómo opera `highWaterMark` en modo no-objeto.

Generalmente, el tamaño del búfer actual es medido contra `highWaterMark` en _bytes_. Sin embargo, después que se llama `setEncoding()`, la función de comparación empezará a medir el tamaño del búfer en _caracteres_.

Esto no es un problema en casos comunes con `latin1` o `ascii`. Pero es aconsejado ser consciente sobre este comportamiento cuando se trabaje con strings que pudieran contener caracteres multi-byte.
