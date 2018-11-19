# Stream

<!--introduced_in=v0.10.0-->

> Stability: 2 - Stable

Un stream es una interfaz abstracta para trabajar con datos de streaming en Node.js. El módulo `stream` proporciona una API base que hace sencillo construir objetos que implementan la interfaz de stream.

Existen muchos objetos de stream proporcionados por Node.js. Por ejemplo, una [solicitud a un servidor HTTP](http.html#http_class_http_incomingmessage) y un [`process.stdout`][] son instancias de stream.

Los streams pueden ser legible, escribibles, o ambos. Todos los streams son instancias de [`EventEmitter`][].

Se puede acceder al módulo `stream` utilizando:

```js
const stream = require('stream');
```

Aunque es importante para todos los usuarios de Node.js entender cómo trabaja streams, el módulo `stream`, en sí, es más útil para los desarrolladores que crean nuevos tipos de instancias de stream. Los desarrolladores que *consumen* principalmente objetos de stream rara vez (o nunca) tienen la necesidad de utilizar el módulo `stream` directamente.

## Organización de este Documento

Este documento está dividido en dos secciones principales, con una tercera sección para notas adicionales. La primera sección explica los elementos de la API de stream que se requieren para *utilizar* streams en una aplicación. La segunda sección explica los elementos de la API que se requieren para *implementar* nuevos tipos de streams.

## Tipos de Streams

Existen cuatro tipos fundamentales de stream en Node.js:

* [Legible](#stream_class_stream_readable) - streams desde los cuales los datos se pueden leer (por ejemplo [`fs.createReadStream()`][]).
* [Escribible](#stream_class_stream_writable) - streams en los que se pueden escribir datos (por ejemplo [`fs.createWriteStream()`][]).
* [Dúplex](#stream_class_stream_duplex) - streams que son tanto Legibles como Escribibles (por ejemplo [`net.Socket`][]).
* [Transformador](#stream_class_stream_transform) - strems Dúplex que pueden modificar o transformar los datos mientras se escriben y leen (por ejemplo [`zlib.createDeflate()`][]).

### Modo Objeto

All streams created by Node.js APIs operate exclusively on strings and `Buffer` (or `Uint8Array`) objects. It is possible, however, for stream implementations to work with other types of JavaScript values (with the exception of `null`, which serves a special purpose within streams). Such streams are considered to operate in "object mode".

Las instancias de stream se cambian al modo objeto utilizando la opción `objectMode` cuando se crea el stream. Intentar cambiar un stream existente al modo objeto, no es seguro.

### Almacenamiento en Buffer

<!--type=misc-->

Tanto los streams [Escribibles](#stream_class_stream_writable) como [Legibles](#stream_class_stream_readable) almacenarán datos en un buffer interno, que puede ser recuperado utilizando `writable._writableState.getBuffer()` o `readable._readableState.buffer`, respectivamente.

La cantidad de datos almacenados potencialmente en buffer depende de la opción `highWaterMark` que se pasa al constructor de streams. For normal streams, the `highWaterMark` option specifies a [total number of bytes](#stream_highwatermark_discrepancy_after_calling_readable_setencoding). Para los streams que operan en modo objeto, `highWaterMark` especifica un número total de objetos.

Los datos son almacenados en Buffer en los streams Legibles cuando la implementación llama a [`stream.push(chunk)`](#stream_readable_push_chunk_encoding). Si el consumidor del Stream no llama a [`stream.read()`](#stream_readable_read_size), los datos se quedarán en la cola interna hasta que se consumen.

Una vez que el tamaño total del buffer de lectura interno alcanza el límite especificado por `highWaterMark`, el stream parará temporalmente de leer los datos desde el recurso subyacente, hasta que los datos almacenados en buffer actualmente se puedan consumir (es decir, el stream parará de llamar al método `readable._read()` interno que se utiliza para llenar el buffer de lectura).

Los datos se almacenan en buffer en streams Escribibles cuando el método [`writable.write(chunk)`](#stream_writable_write_chunk_encoding_callback) se llama repetidamente. Mientras el tamaño total del buffer de escritura interno sea inferior al límite establecido por `highWaterMark`, las llamadas a `writable.write()` devolverán `true`. Una vez el tamaño del buffer interno alcanza o excede el `highWaterMark`, se devolverá `false`.

Un objetivo clave de la API de `stream`, particularmente del método [`stream.pipe()`], es limitar el almacenamiento de datos en buffer a niveles aceptables, tales que las fuentes y destinatarios de diferentes velocidades no agoten la memoria disponible.

Debido a que los streams [Dúplex](#stream_class_stream_duplex) y [Transformador](#stream_class_stream_transform) son tanto Legibles como Escribibles, cada uno mantiene *dos* buffers internos separados utilizados para leer y escribir, lo que permite a cada lado operar independientemente del otro, mientras mantiene un apropiado y eficiente flujo de datos. Por ejemplo, las instancias [`net.Socket`][] son streams [Dúplex](#stream_class_stream_duplex) cuyo lado Legible permite el consumo de los datos recibidos *desde* el socket y cuyo lado Escribible permite escribir los datos *al* socket. Debido a que los datos se pueden escribir en el socket a una velocidad más rápida o más lenta que la de los datos recibidos, es importante para cada lado (y para el buffer) operar independientemente del otro.

## API para los Consumidores de Stream

<!--type=misc-->

Casi todas las aplicaciones de Node.js, no importa lo simples que sean, utilizan streams de alguna manera. El siguiente, es un ejemplo del uso de streams en una aplicación de Node.js que implementa un servidor HTTP:

```js
const http = require('http');

const server = http.createServer((req, res) => {
  // req es un http.IncomingMessage, el cual es un Stream Legible
  // res es un http.ServerResponse, el cual es un Strema Escribible

  let body = '';
  // Obtiene los datos como cadenas utf8.
  // Si no se establece una codificación, se recibirán los objetos de Buffer.
  req.setEncoding('utf8');

  // Los streams Legibles emiten eventos de 'data' una vez que se agrega un listener
  req.on('data', (chunk) => {
    body += chunk;
  });

  // el evento del final indica que todo el cuerpo se ha recibido
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      // escriba algo interesante para el usuario:
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
// object
// $ curl localhost:1337 -d "\"foo\""
// string
// $ curl localhost:1337 -d "not json"
// error: Unexpected token o in JSON at position 1
```

Los streams [Escribibles](#stream_class_stream_writable) (como `res` en el ejemplo) exponen métodos como `write()` y `end()` que se utilizan para escribir datos en el stream.

Los streams [Legibles](#stream_class_stream_readable) utilizan la API [`EventEmitter`][] para notificar al código de la aplicación cuando los datos estén disponibles para leerse fuera del stream. Esos datos disponibles pueden leerse del stream de múltiples maneras.

Tanto los streams [Escribibles](#stream_class_stream_writable) como los [Legibles](#stream_class_stream_readable) utilizan la API [`EventEmitter`][] de varias maneras para comunicar el estado actual del stream.

Los streams [Dúplex](#stream_class_stream_duplex) y [Transformadores](#stream_class_stream_transform) son tanto [Escribibles](#stream_class_stream_writable) como [Legibles](#stream_class_stream_readable).

Las aplicaciones que escriben o consumen datos de un stream no requieren implementar interfaces de stream directamente y, por lo general, no tendrán razones para llamar a `require('stream')`.

Los desarrolladores que deseen implementar nuevos tipos de streams deben consultar la sección [API para Implementadores de Stream](#stream_api_for_stream_implementers).

### Streams Escribibles

Los streams Escribibles son una abstracción para un *destino* en el que se escriben datos.

Los ejemplos de streams [Escribibles](#stream_class_stream_writable) incluyen:

* [solicitudes HTTP, en el cliente](http.html#http_class_http_clientrequest)
* [respuestas HTTP, en el servidor](http.html#http_class_http_serverresponse)
* [streams de escritura del fs](fs.html#fs_class_fs_writestream)
* [streams zlib](zlib.html)
* [streams crypto](crypto.html)
* [sockets TCP](net.html#net_class_net_socket)
* [stdin de proceso secundario](child_process.html#child_process_subprocess_stdin)
* [`process.stdout`][], [`process.stderr`][]

*Nota*: algunos de estos ejemplos realmente son streams [Dúplex](#stream_class_stream_duplex) que implementan la interfaz [Escribible](#stream_class_stream_writable).

Todos los streams [Escribibles](#stream_class_stream_writable) implementan la interfaz definida por la clase `stream.Writable`.

Mientras las instancias específicas de los streams [Escribibles](#stream_class_stream_writable) pueden diferir de varias maneras, todos los streams Escribibles siguen el mismo patrón de uso fundamental, como se ilustra en el siguiente ejemplo:

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

##### Event: 'close'

<!-- YAML
added: v0.9.4
-->

El evento `'close'` se emite cuando el stream y cualquiera de sus recursos subyacentes (un descriptor de archivo, por ejemplo) se han cerrado. El evento indica que no se emitirán más eventos, y no se realizarán más cálculos.

No todos los streams Escribibles emitirán el evento `'close'`.

##### Event: 'drain'

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

##### Event: 'error'

<!-- YAML
added: v0.9.4
-->

* {Error}

El evento de `'error'` se emite si un error se produjo mientras se escribían o canalizaban datos. El callback listener pasa un solo argumento de `Error` cuando se llama.

*Nota*: El stream no está cerrado cuando se emite el evento de `'error'`.

##### Event: 'finish'

<!-- YAML
added: v0.9.4
-->

El evento `'finish'` es emitido después que el método [`stream.end()`](#stream_writable_end_chunk_encoding_callback) ha sido llamado, y todos los datos han sido vaciados al sistema subyacente.

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

##### Evento: 'pipe'

<!-- YAML
added: v0.9.4
-->

* `src` {stream.Readable} source stream that is piping to this writable

The `'pipe'` event is emitted when the [`stream.pipe()`][] method is called on a readable stream, adding this writable to its set of destinations.

```js
const writer = getWritableStreamSomehow();
const reader = getReadableStreamSomehow();
writer.on('pipe', (src) => {
  console.error('something is piping into the writer');
  assert.equal(src, reader);
});
reader.pipe(writer);
```

##### Evento: 'unpipe'

<!-- YAML
added: v0.9.4
-->

* `src` {stream.Readable} The source stream that [unpiped][`stream.unpipe()`] this writable

El evento de `'unpipe'` se emite cuando el método [`stream.unpipe()`][] se llama en un stream [Legible](#stream_class_stream_readable), eliminando este [Escribible](#stream_class_stream_writable) de su conjunto de destinos.

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

El método `writable.cork()` fuerza a que todos los datos escribibles sean almacenados en la memoria. Los datos almacenados en buffer se vaciarán cuando se llamen los métodos [`stream.uncork()`][] o [`stream.end()`](#stream_writable_end_chunk_encoding_callback).

La intención principal de `writable.cork()` es evitar una situación en la que escribir muchas piezas pequeñas de datos al stream no cause una copia de seguridad en el buffer interno, eso tendría un impacto adverso en el rendimiento. En tales situaciones, las implementaciones que utilizan el método `writable._writev()` pueden realizar escrituras almacenadas en buffer de una manera más optimizada.

Vea también: [`writable.uncork()`][].

##### writable.end(\[chunk\]\[, encoding\][, callback])

<!-- YAML
added: v0.9.4
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->

* `chunk` {string|Buffer|Uint8Array|any} Optional data to write. For streams not operating in object mode, `chunk` must be a string, `Buffer` or `Uint8Array`. For object mode streams, `chunk` may be any JavaScript value other than `null`.
* `encoding` {string} The encoding, if `chunk` is a string
* `callback` {Function} Callback opcional para cuando el stream se finalice

Llamar al método `writable.end()` señala que no se escribirán más datos en el [Escribible](#stream_class_stream_writable). Los argumentos `chunk` y `encoding` opcionales permiten escribir una última pieza adicional de datos inmediatamente antes de cerrar el stream. Si se proporciona, la función `callback` opcional se adjunta como un listener para el evento de [`'finish'`][].

Llamar al método [`stream.write()`](#stream_writable_write_chunk_encoding_callback) después de llamar a [`stream.end()`](#stream_writable_end_chunk_encoding_callback) levantará un error.

```js
// escriba 'hello, ' y luego termine con 'world!'
const file = fs.createWriteStream('example.txt');
file.write('hello, ');
file.end('world!');
// ¡escribir más ahora no está permitido!
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
* Returns: `this`

El método `writable.setDefaultEncoding()` establece el `encoding` predeterminado para un stream [Escribible](#stream_class_stream_writable).

##### writable.uncork()

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

Si el método [`writable.cork()`][] se llama múltiples veces en un stream, deben hacerse el mismo número de llamadas a `writable.uncork()` para vaciar los datos almacenados en buffer.

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

##### writable.writableHighWaterMark

<!-- YAML
added: v8.10.0
-->

Return the value of `highWaterMark` passed when constructing this `Writable`.

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

* `chunk` {string|Buffer|Uint8Array|any} Optional data to write. For streams not operating in object mode, `chunk` must be a string, `Buffer` or `Uint8Array`. For object mode streams, `chunk` may be any JavaScript value other than `null`.
* `encoding` {string} The encoding, if `chunk` is a string
* `callback` {Function} Callback para cuando esta pieza de datos se vacíe
* Devuelve: {boolean} `false` si el stream desea que el código de llamada espere a que se emita el evento de `'drain'` antes de continuar escribiendo datos adicionales; de lo contrarió es `true`.

El método `writable.write()` escribe algunos datos en el stream, y llama al `callback` suministrado una vez que los datos se han manejado completamente. Si se produce un error, el `callback` *puede o no* ser llamado con el error como su primer argumento. Para detectar confiablemente errores de escritura, agregue un listener para el evento de `'error'`.

El valor devuelto es `true` si el buffer interno es menor que el `highWaterMark` configurado cuando se creó el stream después de admitir el `chunk`. Si se devuelve `false`, los intentos adicionales para escribir datos en el stream deberían detenerse hasta que el evento de [`'drain'`][] se emita.

While a stream is not draining, calls to `write()` will buffer `chunk`, and return false. Once all currently buffered chunks are drained (accepted for delivery by the operating system), the `'drain'` event will be emitted. Se recomienda que una vez que write() devuelva “false”, no se escriban más piezas hasta que se emita el evento de `'drain'`. While calling `write()` on a stream that is not draining is allowed, Node.js will buffer all written chunks until maximum memory usage occurs, at which point it will abort unconditionally. Even before it aborts, high memory usage will cause poor garbage collector performance and high RSS (which is not typically released back to the system, even after the memory is no longer required). Since TCP sockets may never drain if the remote peer does not read the data, writing a socket that is not draining may lead to a remotely exploitable vulnerability.

Writing data while the stream is not draining is particularly problematic for a [Transform](#stream_class_stream_transform), because the `Transform` streams are paused by default until they are piped or an `'data'` or `'readable'` event handler is added.

If the data to be written can be generated or fetched on demand, it is recommended to encapsulate the logic into a [Readable](#stream_class_stream_readable) and use [`stream.pipe()`][]. However, if calling `write()` is preferred, it is possible to respect backpressure and avoid memory issues using the [`'drain'`][] event:

```js
function write(data, cb) {
  if (!stream.write(data)) {
    stream.once('drain', cb);
  } else {
    process.nextTick(cb);
  }
}

// Wait for cb to be called before doing any other write.
write('hello', () => {
  console.log('write completed, do more writes now');
});
```

A Writable stream in object mode will always ignore the `encoding` argument.

##### writable.destroy([error])

<!-- YAML
added: v8.0.0
-->

* Returns: `this`

Destroy the stream, and emit the passed error. After this call, the writable stream has ended. Implementors should not override this method, but instead implement [`writable._destroy`](#stream_writable_destroy_err_callback).

### Streams Legibles

Los streams legibles son una abstracción para una *fuente* a partir de la cual se consumen los datos.

Los ejemplos de streams Legibles incluyen:

* [respuestas HTTP, en el cliente](http.html#http_class_http_incomingmessage)
* [solicitudes HTTP, en el servidor](http.html#http_class_http_incomingmessage)
* [streams de lectura del fs](fs.html#fs_class_fs_readstream)
* [streams zlib](zlib.html)
* [streams crypto](crypto.html)
* [sockets TCP](net.html#net_class_net_socket)
* [procesos secundarios stdout y stderr](child_process.html#child_process_subprocess_stdout)
* [`process.stdin`][]

Todos los streams [Legibles](#stream_class_stream_readable) implementan la interfaz definida por la clase `stream.Readable`.

#### Dos Modos

Los streams Legibles operan efectivamente en uno de dos modos: fluido y pausado.

Cuando está en modo fluido, los datos se leen desde el sistema subyacente de manera automática y se envían a una aplicación lo más rápido posible utilizando eventos a través de la interfaz [`EventEmitter`][].

En el modo pausado, el método [`stream.read()`](#stream_readable_read_size) debe ser llamado explícitamente para leer piezas de datos desde el stream.

Todos los streams [Legibles](#stream_class_stream_readable) comienzan en el modo pausado, pero pueden cambiarse al modo fluido de una de las siguientes maneras:

* Agregar un manejador de eventos de [`'data'`][].
* Llamar al método de [`stream.resume()`](#stream_readable_resume).
* Llamar al método de [`stream.pipe()`][] para enviar los datos a un [Escribible](#stream_class_stream_writable).

El Legible puede volver a cambiar al modo pausado utilizando uno de los siguientes:

* If there are no pipe destinations, by calling the [`stream.pause()`](#stream_readable_pause) method.
* If there are pipe destinations, by removing any [`'data'`][] event handlers, and removing all pipe destinations by calling the [`stream.unpipe()`][] method.

El concepto importante a recordar es que un Legible no generará datos hasta que se proporcione un mecanismo para consumir o ignorar esos datos. Si el mecanismo de consumo se desactiva o se retira, el Legible *intentará* detener la generación de los datos.

*Nota*: Por razones de compatibilidad con versiones anteriores, remover los manejadores de evento de [`'data'`][] **no** pausará automáticamente el stream. Also, if there are piped destinations, then calling [`stream.pause()`](#stream_readable_pause) will not guarantee that the stream will *remain* paused once those destinations drain and ask for more data.

*Nota*: si un [Legible](#stream_class_stream_readable) se cambia al modo fluido y y no hay consumidores disponibles para manejar los datos, esos datos se perderán. Esto puedo suceder, por ejemplo, cuando el método de `readable.resume()` se llama sin un listener adjunto al evento de `'data'`, o cuando un manejador del evento de `'data'` se elimina del stream.

#### Tres Estados

Los "dos modos" de operación para un stream Legible son una abstracción simplificada para la administración del estado interno más complicado que está ocurriendo dentro de la implementación del stream Legible.

Específicamente, en cualquier momento dado, cada Legible está en uno de los tres posibles estados:

* `readable._readableState.flowing = null`
* `readable._readableState.flowing = false`
* `readable._readableState.flowing = true`

Cuando `readable._readableState.flowing` es `null`, ningún mecanismo para consumir los datos de los streams se proporciona, así que el stream no generará sus datos. Mientras se encuentre en este estado, adjuntar un listener para el evento de `'data'`, llamar al método `readable.pipe()`, o llamar al método `readable.resume()` cambiará `readable._readableState.flowing` a `true`, causando que el Legible comience a emitir eventos activamente a medida que se generan los datos.

Llamar a `readable.pause()`, `readable.unpipe()`, o recibir "contrapresión" causará que el `readable._readableState.flowing` sea establecido como `false`, interrumpiendo temporalmente el flujo de eventos pero *no* deteniendo la generación de datos. Mientras se encuentre en este estado, adjuntar un listener para el evento de `'data'` no causaría que `readable._readableState.flowing` cambie a `true`.

```js
const { PassThrough, Writable } = require('stream');
const pass = new PassThrough();
const writable = new Writable();

pass.pipe(writable);
pass.unpipe(writable);
// el flujo ahora es "false"

pass.on('data', (chunk) => { console.log(chunk.toString()); });
pass.write('ok'); // no emitirá 'data'
pass.resume(); // debe llamarse para hacer que se emita 'data'
```

Aunque `readable._readableState.flowing` sea `false`, pueden acumularse datos dentro del buffer interno del stream.

#### Elegir Uno

La API del stream Legible ha evolucionado a través de varias versiones de Node.js y proporciona múltiples métodos para consumir datos de stream. En general, los desarrolladores deben elegir *uno* de los métodos para consumir datos y *nunca deberían* utilizar múltiples métodos para consumir datos desde un solo stream.

Para la mayoría de los usuarios se recomienda utilizar el método `readable.pipe()`, ya que se ha implementado para proporcionar la manera más sencilla de consumir datos de stream. Los desarrolladores que requieran un control más preciso sobre la transferencia y generación de datos pueden utilizar las APIs [`EventEmitter`][] y `readable.pause()`/`readable.resume()`.

#### Clase: stream.Readable

<!-- YAML
added: v0.9.4
-->

<!--type=class-->

##### Event: 'close'

<!-- YAML
added: v0.9.4
-->

El evento `'close'` se emite cuando el stream y cualquiera de sus recursos subyacentes (un descriptor de archivo, por ejemplo) se han cerrado. El evento indica que no se emitirán más eventos, y no se realizarán más cálculos.

No todos los streams [Legibles](#stream_class_stream_readable) emitirán el evento `'close'`.

##### Event: 'data'

<!-- YAML
added: v0.9.4
-->

* `chunk` {Buffer|string|any} La pieza de datos. Para streams que no están operando en el modo objeto, la pieza será una cadena o un `Buffer`. Para streams que están en el modo objeto, la pieza puede ser cualquier valor JavaScript diferente a `null`.

El evento de `'data'` se emite cuando el stream está cediendo la propiedad de una pieza de datos a un consumidor. Esto puede ocurrir cada vez que el stream se cambia al modo fluido para llamar a 0>readable.pipe()</code>, `readable.resume()`, o al adjuntar un callback del listener al evento de `'data'`. El evento de `'data'` también se emitirá siempre que el método `readable.read()` sea llamado y una pieza de datos esté disponible para ser devuelta.

Adjuntar un listener del evento de `'data'` a un stream que no ha sido pausado explícitamente cambiará el stream al modo fluido. Entonces, los datos se pasarán tan pronto estén disponibles.

El callback del listener se pasará a la pieza de datos como una cadena si una codificación predeterminada se ha especificado para el stream utilizando el método `readable.setEncoding()`; de lo contrario, los datos serán pasados como un `Buffer`.

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

El evento `'end'` se emite cuando no hay más datos para ser consumidos del stream.

*Nota*: El evento `'end'` **no se emitirá** a menos que los datos se consuman en su totalidad. Esto se puede lograr cambiando el stream al modo fluido, o al llamar a [`stream.read()`](#stream_readable_read_size) repetidamente hasta que todos los datos se consuman.

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

El evento de `'error'` puede emitirse por una implementación del Legible en cualquier momento. En general, esto puede suceder si el stream subyacente es incapaz de generar datos debido a un fallo interno subyacente, o cuando una implementación del stream intenta enviar una pieza de datos inválida.

Al callback del listener se le pasará un solo objeto de `Error`.

##### Evento: 'readable'

<!-- YAML
added: v0.9.4
-->

El evento `'readable'` se emite cuando hay datos disponibles para leerse desde el stream. En algunos casos, adjuntar un listener a un evento `'readable'` causará que cierta cantidad de datos se lea en un buffer interno.

```javascript
const readable = getReadableStreamSomehow();
readable.on('readable', () => {
  // hay algunos datos para leer ahora
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

La salida de ejecutar este script es:

```txt
$ node test.js
readable: null
end
```

*Nota*: En general, los mecanismos de evento de `readable.pipe()` y de `'data'` son más fáciles de entender que el evento `'readable'`. Sin embargo, el manejo de `'readable'` podría resultar en un aumento del rendimiento.

##### readable.isPaused()

<!-- YAML
added: v0.11.14
-->

* Devuelve: {boolean}

El método `readable.isPaused()` devuelve el estado operativo actual del Legible. Esto es utilizado principalmente por el mecanismo subyacente al método `readable.pipe()`. En la mayorías de los casos típicos, no habrá razones para utilizar este método directamente.

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

* Returns: `this`

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

##### readable.pipe(destination[, options])

<!-- YAML
added: v0.9.4
-->

* `destination` {stream.Writable} El destino para escribir datos
* `options` {Object} Pipe options 
  * `end` {boolean} Finaliza el escritor cuando termina el lector. Por defecto es `true`.

El método `readable.pipe()` adjunta un stream [Escribible](#stream_class_stream_writable) al `readable`, ocasionando el cambio automático al modo fluido y el envío de todos sus datos al adjunto [Escribible](#stream_class_stream_writable). El flujo de datos se gestionará automáticamente para que el stream Escribible de destino no se vea abrumado por un stream Legible más rápido.

The following example pipes all of the data from the `readable` into a file named `file.txt`:

```js
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// Todos los datos del legible van al 'file.txt'
readable.pipe(writable);
```

Es posible adjuntar múltiples streams Escribibles en un solo stream Legible.

El método `readable.pipe()` devuelve una referencia al stream de *destino*, haciendo posible configurar cadenas de streams canalizadas:

```js
const r = fs.createReadStream('file.txt');
const z = zlib.createGzip();
const w = fs.createWriteStream('file.txt.gz');
r.pipe(z).pipe(w);
```

Por defecto, [`stream.end()`](#stream_writable_end_chunk_encoding_callback) se llama en stream Escribible de destino cuando el stream Legible de origen emite [`'end'`][], así que el destino ya no es escribible. Para deshabilitar este comportamiento predeterminado, la opción `end` se puede pasar como `false`, causando que el stream de destino permanezca abierto, como se muestra en el siguiente ejemplo:

```js
reader.pipe(writer, { end: false });
reader.on('end', () => {
  writer.end('Goodbye\n');
});
```

Una advertencia importancia es que se el stream Legible emite un error durante el procesamiento, el destino del Escribible *no se cierra* automáticamente. Si ocurre un error, será necesario cerrar *manualmente* cada stream en orden, para evitar fugas de memoria.

*Nota*: Los streams Escribibles [`process.stderr`][] y [`process.stdout`][] nunca se cierran hasta que el proceso de Node.js se termina, sin importar las opciones especificadas.

##### readable.readableHighWaterMark

<!-- YAML
added: v8.10.0
-->

Return the value of `highWaterMark` passed when constructing this `Readable`.

##### readable.read([size])

<!-- YAML
added: v0.9.4
-->

* `size` {number} Argumento opcional para especificar la cantidad de datos a leer.
* Return {string|Buffer|null}

El método `readable.read()` saca algunos datos del buffer interno y los devuelve. Si no hay datos disponibles para leer, se devuelve `null`. Por defecto, los datos se devolverán como un objeto de `Buffer`, a menos que se haya especificado una codificación utilizando el método `readable.setEncoding()` o el stream se opere en el modo objeto.

El argumento opcional `size` especifica un número determinado de bytes a leer. Si los bytes de `size` no están disponibles para ser leídos, se devolverá `null` *a menos que* el stream haya terminado, en cuyo caso se devolverán los datos restantes en el buffer interno.

Si el argumento `size` no se especifica, se devolverán todos los datos en el buffer interno.

El método `readable.read()` solo debe llamarse en streams Legibles que operan en el modo pausado. In flowing mode, `readable.read()` is called automatically until the internal buffer is fully drained.

```js
const readable = getReadableStreamSomehow();
readable.on('readable', () => {
  let chunk;
  while (null !== (chunk = readable.read())) {
    console.log(`Received ${chunk.length} bytes of data.`);
  }
});
```

In general, it is recommended that developers avoid the use of the `'readable'` event and the `readable.read()` method in favor of using either `readable.pipe()` or the `'data'` event.

A Readable stream in object mode will always return a single item from a call to [`readable.read(size)`](#stream_readable_read_size), regardless of the value of the `size` argument.

*Note*: If the `readable.read()` method returns a chunk of data, a `'data'` event will also be emitted.

*Note*: Calling [`stream.read([size])`](#stream_readable_read_size) after the [`'end'`][] event has been emitted will return `null`. No runtime error will be raised.

##### readable.resume()

<!-- YAML
added: v0.9.4
-->

* Returns: `this`

The `readable.resume()` method causes an explicitly paused Readable stream to resume emitting [`'data'`][] events, switching the stream into flowing mode.

The `readable.resume()` method can be used to fully consume the data from a stream without actually processing any of that data as illustrated in the following example:

```js
getReadableStreamSomehow()
  .resume()
  .on('end', () => {
    console.log('Reached the end, but did not read anything.');
  });
```

##### readable.setEncoding(encoding)

<!-- YAML
added: v0.9.4
-->

* `encoding` {string} The encoding to use.
* Returns: `this`

The `readable.setEncoding()` method sets the character encoding for data read from the Readable stream.

By default, no encoding is assigned and stream data will be returned as `Buffer` objects. Setting an encoding causes the stream data to be returned as strings of the specified encoding rather than as `Buffer` objects. For instance, calling `readable.setEncoding('utf8')` will cause the output data to be interpreted as UTF-8 data, and passed as strings. Calling `readable.setEncoding('hex')` will cause the data to be encoded in hexadecimal string format.

The Readable stream will properly handle multi-byte characters delivered through the stream that would otherwise become improperly decoded if simply pulled from the stream as `Buffer` objects.

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

* `destination` {stream.Writable} Optional specific stream to unpipe

The `readable.unpipe()` method detaches a Writable stream previously attached using the [`stream.pipe()`][] method.

If the `destination` is not specified, then *all* pipes are detached.

If the `destination` is specified, but no pipe is set up for it, then the method does nothing.

```js
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// All the data from readable goes into 'file.txt',
// but only for the first second
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

* `chunk` {Buffer|Uint8Array|string|any} Chunk of data to unshift onto the read queue. For streams not operating in object mode, `chunk` must be a string, `Buffer` or `Uint8Array`. For object mode streams, `chunk` may be any JavaScript value other than `null`.

The `readable.unshift()` method pushes a chunk of data back into the internal buffer. This is useful in certain situations where a stream is being consumed by code that needs to "un-consume" some amount of data that it has optimistically pulled out of the source, so that the data can be passed on to some other party.

*Note*: The `stream.unshift(chunk)` method cannot be called after the [`'end'`][] event has been emitted or a runtime error will be thrown.

Developers using `stream.unshift()` often should consider switching to use of a [Transform](#stream_class_stream_transform) stream instead. See the [API for Stream Implementers](#stream_api_for_stream_implementers) section for more information.

```js
// Pull off a header delimited by \n\n
// use unshift() if we get too much
// Call the callback with (error, header, stream)
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
        // found the header boundary
        const split = str.split(/\n\n/);
        header += split.shift();
        const remaining = split.join('\n\n');
        const buf = Buffer.from(remaining, 'utf8');
        stream.removeListener('error', callback);
        // remove the readable listener before unshifting
        stream.removeListener('readable', onReadable);
        if (buf.length)
          stream.unshift(buf);
        // now the body of the message can be read from the stream.
        callback(null, header, stream);
      } else {
        // still reading the header.
        header += str;
      }
    }
  }
}
```

*Note*: Unlike [`stream.push(chunk)`](#stream_readable_push_chunk_encoding), `stream.unshift(chunk)` will not end the reading process by resetting the internal reading state of the stream. This can cause unexpected results if `readable.unshift()` is called during a read (i.e. from within a [`stream._read()`](#stream_readable_read_size_1) implementation on a custom stream). Following the call to `readable.unshift()` with an immediate [`stream.push('')`](#stream_readable_push_chunk_encoding) will reset the reading state appropriately, however it is best to simply avoid calling `readable.unshift()` while in the process of performing a read.

##### readable.wrap(stream)

<!-- YAML
added: v0.9.4
-->

* `stream` {Stream} An "old style" readable stream

Versions of Node.js prior to v0.10 had streams that did not implement the entire `stream` module API as it is currently defined. (See [Compatibility](#stream_compatibility_with_older_node_js_versions) for more information.)

When using an older Node.js library that emits [`'data'`][] events and has a [`stream.pause()`](#stream_readable_pause) method that is advisory only, the `readable.wrap()` method can be used to create a [Readable](#stream_class_stream_readable) stream that uses the old stream as its data source.

It will rarely be necessary to use `readable.wrap()` but the method has been provided as a convenience for interacting with older Node.js applications and libraries.

Por ejemplo:

```js
const { OldReader } = require('./old-api-module.js');
const { Readable } = require('stream');
const oreader = new OldReader();
const myReader = new Readable().wrap(oreader);

myReader.on('readable', () => {
  myReader.read(); // etc.
});
```

##### readable.destroy([error])

<!-- YAML
added: v8.0.0
-->

Destroy the stream, and emit `'error'`. After this call, the readable stream will release any internal resources. Implementors should not override this method, but instead implement [`readable._destroy`](#stream_readable_destroy_err_callback).

### Duplex and Transform Streams

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

Duplex streams are streams that implement both the [Readable](#stream_class_stream_readable) and [Writable](#stream_class_stream_writable) interfaces.

Examples of Duplex streams include:

* [sockets TCP](net.html#net_class_net_socket)
* [streams zlib](zlib.html)
* [streams crypto](crypto.html)

#### Class: stream.Transform

<!-- YAML
added: v0.9.4
-->

<!--type=class-->

Transform streams are [Duplex](#stream_class_stream_duplex) streams where the output is in some way related to the input. Like all [Duplex](#stream_class_stream_duplex) streams, Transform streams implement both the [Readable](#stream_class_stream_readable) and [Writable](#stream_class_stream_writable) interfaces.

Examples of Transform streams include:

* [streams zlib](zlib.html)
* [streams crypto](crypto.html)

##### transform.destroy([error])

<!-- YAML
added: v8.0.0
-->

Destroy the stream, and emit `'error'`. After this call, the transform stream would release any internal resources. implementors should not override this method, but instead implement [`readable._destroy`](#stream_readable_destroy_err_callback). The default implementation of `_destroy` for `Transform` also emit `'close'`.

## API for Stream Implementers

<!--type=misc-->

The `stream` module API has been designed to make it possible to easily implement streams using JavaScript's prototypal inheritance model.

First, a stream developer would declare a new JavaScript class that extends one of the four basic stream classes (`stream.Writable`, `stream.Readable`, `stream.Duplex`, or `stream.Transform`), making sure they call the appropriate parent class constructor:

```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor(options) {
    super(options);
    // ...
  }
}
```

The new stream class must then implement one or more specific methods, depending on the type of stream being created, as detailed in the chart below:

<table>
  <thead>
    <tr>
      <th>
        <p>Use-case</p>
      </th>
      <th>
        <p>Class</p>
      </th>
      <th>
        <p>Method(s) to implement</p>
      </th>
    </tr>
  </thead>
  <tr>
    <td>
      <p>Reading only</p>
    </td>
    <td>
      <p>[Readable](#stream_class_stream_readable)</p>
    </td>
    <td>
      <p><code>[_read][stream-_read]</code></p>
    </td>
  </tr>
  <tr>
    <td>
      <p>Writing only</p>
    </td>
    <td>
      <p>[Writable](#stream_class_stream_writable)</p>
    </td>
    <td>
      <p><code>[_write][stream-_write]</code>, <code>[_writev][stream-_writev]</code>,
      <code>[_final][stream-_final]</code></p>
    </td>
  </tr>
  <tr>
    <td>
      <p>Reading and writing</p>
    </td>
    <td>
      <p>[Duplex](#stream_class_stream_duplex)</p>
    </td>
    <td>
      <p><code>[_read][stream-_read]</code>, <code>[_write][stream-_write]</code>, <code>[_writev][stream-_writev]</code>,
      <code>[_final][stream-_final]</code></p>
    </td>
  </tr>
  <tr>
    <td>
      <p>Operate on written data, then read the result</p>
    </td>
    <td>
      <p>[Transform](#stream_class_stream_transform)</p>
    </td>
    <td>
      <p><code>[_transform][stream-_transform]</code>, <code>[_flush][stream-_flush]</code>,
      <code>[_final][stream-_final]</code></p>
    </td>
  </tr>
</table>

*Note*: The implementation code for a stream should *never* call the "public" methods of a stream that are intended for use by consumers (as described in the [API for Stream Consumers](#stream_api_for_stream_consumers) section). Doing so may lead to adverse side effects in application code consuming the stream.

### Simplified Construction

<!-- YAML
added: v1.2.0
-->

For many simple cases, it is possible to construct a stream without relying on inheritance. This can be accomplished by directly creating instances of the `stream.Writable`, `stream.Readable`, `stream.Duplex` or `stream.Transform` objects and passing appropriate methods as constructor options.

Por ejemplo:

```js
const { Writable } = require('stream');

const myWritable = new Writable({
  write(chunk, encoding, callback) {
    // ...
  }
});
```

### Implementing a Writable Stream

The `stream.Writable` class is extended to implement a [Writable](#stream_class_stream_writable) stream.

Custom Writable streams *must* call the `new stream.Writable([options])` constructor and implement the `writable._write()` method. The `writable._writev()` method *may* also be implemented.

#### Constructor: new stream.Writable([options])

* `options` {Object} 
  * `highWaterMark` {number} Buffer level when [`stream.write()`](#stream_writable_write_chunk_encoding_callback) starts returning `false`. Defaults to `16384` (16kb), or `16` for `objectMode` streams.
  * `decodeStrings` {boolean} Whether or not to decode strings into Buffers before passing them to [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1). Defaults to `true`
  * `objectMode` {boolean} Whether or not the [`stream.write(anyObj)`](#stream_writable_write_chunk_encoding_callback) is a valid operation. When set, it becomes possible to write JavaScript values other than string, `Buffer` or `Uint8Array` if supported by the stream implementation. Defaults to `false`
  * `write` {Function} Implementation for the [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1) method.
  * `writev` {Function} Implementation for the [`stream._writev()`](#stream_writable_writev_chunks_callback) method.
  * `destroy` {Function} Implementation for the [`stream._destroy()`](#stream_writable_destroy_err_callback) method.
  * `final` {Function} Implementation for the [`stream._final()`](#stream_writable_final_callback) method.

Por ejemplo:

```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor(options) {
    // Calls the stream.Writable() constructor
    super(options);
    // ...
  }
}
```

Or, when using pre-ES6 style constructors:

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

Or, using the Simplified Constructor approach:

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

* `chunk` {Buffer|string|any} The chunk to be written. Will **always** be a buffer unless the `decodeStrings` option was set to `false` or the stream is operating in object mode.
* `encoding` {string} If the chunk is a string, then `encoding` is the character encoding of that string. If chunk is a `Buffer`, or if the stream is operating in object mode, `encoding` may be ignored.
* `callback` {Function} Call this function (optionally with an error argument) when processing is complete for the supplied chunk.

All Writable stream implementations must provide a [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1) method to send data to the underlying resource.

*Note*: [Transform](#stream_class_stream_transform) streams provide their own implementation of the [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1).

*Note*: This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal Writable class methods only.

The `callback` method must be called to signal either that the write completed successfully or failed with an error. The first argument passed to the `callback` must be the `Error` object if the call failed or `null` if the write succeeded.

All calls to `writable.write()` that occur between the time `writable._write()` is called and the `callback` is called will cause the written data to be buffered. Once the `callback` is invoked, the stream will emit a [`'drain'`][] event. If a stream implementation is capable of processing multiple chunks of data at once, the `writable._writev()` method should be implemented.

If the `decodeStrings` property is set in the constructor options, then `chunk` may be a string rather than a Buffer, and `encoding` will indicate the character encoding of the string. This is to support implementations that have an optimized handling for certain string data encodings. If the `decodeStrings` property is explicitly set to `false`, the `encoding` argument can be safely ignored, and `chunk` will remain the same object that is passed to `.write()`.

The `writable._write()` method is prefixed with an underscore because it is internal to the class that defines it, and should never be called directly by user programs.

#### writable.\_writev(chunks, callback)

* `chunks` {Array} The chunks to be written. Each chunk has following format: `{ chunk: ..., encoding: ... }`.
* `callback` {Function} A callback function (optionally with an error argument) to be invoked when processing is complete for the supplied chunks.

*Note*: This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal Writable class methods only.

The `writable._writev()` method may be implemented in addition to `writable._write()` in stream implementations that are capable of processing multiple chunks of data at once. If implemented, the method will be called with all chunks of data currently buffered in the write queue.

The `writable._writev()` method is prefixed with an underscore because it is internal to the class that defines it, and should never be called directly by user programs.

#### writable.\_destroy(err, callback)

<!-- YAML
added: v8.0.0
-->

* `err` {Error} A possible error.
* `callback` {Function} A callback function that takes an optional error argument.

The `_destroy()` method is called by [`writable.destroy()`](#stream_writable_destroy_error). It can be overriden by child classes but it **must not** be called directly.

#### writable.\_final(callback)

<!-- YAML
added: v8.0.0
-->

* `callback` {Function} Call this function (optionally with an error argument) when finished writing any remaining data.

The `_final()` method **must not** be called directly. It may be implemented by child classes, and if so, will be called by the internal Writable class methods only.

This optional function will be called before the stream closes, delaying the `finish` event until `callback` is called. This is useful to close resources or write buffered data before a stream ends.

#### Errors While Writing

It is recommended that errors occurring during the processing of the `writable._write()` and `writable._writev()` methods are reported by invoking the callback and passing the error as the first argument. This will cause an `'error'` event to be emitted by the Writable. Throwing an Error from within `writable._write()` can result in unexpected and inconsistent behavior depending on how the stream is being used. Using the callback ensures consistent and predictable handling of errors.

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

#### An Example Writable Stream

The following illustrates a rather simplistic (and somewhat pointless) custom Writable stream implementation. While this specific Writable stream instance is not of any real particular usefulness, the example illustrates each of the required elements of a custom [Writable](#stream_class_stream_writable) stream instance:

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

#### Decoding buffers in a Writable Stream

Decoding buffers is a common task, for instance, when using transformers whose input is a string. This is not a trivial process when using multi-byte characters encoding, such as UTF-8. The following example shows how to decode multi-byte strings using `StringDecoder` and [Writable](#stream_class_stream_writable).

```js
const { Writable } = require('stream');
const { StringDecoder } = require('string_decoder');

class StringWritable extends Writable {
  constructor(options) {
    super(options);
    const state = this._writableState;
    this._decoder = new StringDecoder(state.defaultEncoding);
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

### Implementing a Readable Stream

The `stream.Readable` class is extended to implement a [Readable](#stream_class_stream_readable) stream.

Custom Readable streams *must* call the `new stream.Readable([options])` constructor and implement the `readable._read()` method.

#### new stream.Readable([options])

* `options` {Object} 
  * `highWaterMark` {number} The maximum [number of bytes](#stream_highwatermark_discrepancy_after_calling_readable_setencoding) to store in the internal buffer before ceasing to read from the underlying resource. Defaults to `16384` (16kb), or `16` for `objectMode` streams
  * `encoding` {string} If specified, then buffers will be decoded to strings using the specified encoding. Defaults to `null`
  * `objectMode` {boolean} Whether this stream should behave as a stream of objects. Meaning that [`stream.read(n)`](#stream_readable_read_size) returns a single value instead of a Buffer of size n. Defaults to `false`
  * `read` {Function} Implementation for the [`stream._read()`](#stream_readable_read_size_1) method.
  * `destroy` {Function} Implementation for the [`stream._destroy()`](#stream_readable_destroy_err_callback) method.

Por ejemplo:

```js
const { Readable } = require('stream');

class MyReadable extends Readable {
  constructor(options) {
    // Calls the stream.Readable(options) constructor
    super(options);
    // ...
  }
}
```

Or, when using pre-ES6 style constructors:

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

Or, using the Simplified Constructor approach:

```js
const { Readable } = require('stream');

const myReadable = new Readable({
  read(size) {
    // ...
  }
});
```

#### readable.\_read(size)

* `size` {number} Number of bytes to read asynchronously

*Note*: This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal Readable class methods only.

All Readable stream implementations must provide an implementation of the `readable._read()` method to fetch data from the underlying resource.

When `readable._read()` is called, if data is available from the resource, the implementation should begin pushing that data into the read queue using the [`this.push(dataChunk)`](#stream_readable_push_chunk_encoding) method. `_read()` should continue reading from the resource and pushing data until `readable.push()` returns `false`. Only when `_read()` is called again after it has stopped should it resume pushing additional data onto the queue.

*Note*: Once the `readable._read()` method has been called, it will not be called again until the [`readable.push()`](#stream_readable_push_chunk_encoding) method is called.

The `size` argument is advisory. For implementations where a "read" is a single operation that returns data can use the `size` argument to determine how much data to fetch. Other implementations may ignore this argument and simply provide data whenever it becomes available. There is no need to "wait" until `size` bytes are available before calling [`stream.push(chunk)`](#stream_readable_push_chunk_encoding).

The `readable._read()` method is prefixed with an underscore because it is internal to the class that defines it, and should never be called directly by user programs.

#### readable.\_destroy(err, callback)

<!-- YAML
added: v8.0.0
-->

* `err` {Error} A possible error.
* `callback` {Function} A callback function that takes an optional error argument.

The `_destroy()` method is called by [`readable.destroy()`](#stream_readable_destroy_error). It can be overriden by child classes but it **must not** be called directly.

#### readable.push(chunk[, encoding])

<!-- YAML
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->

* `chunk` {Buffer|Uint8Array|string|null|any} Chunk of data to push into the read queue. For streams not operating in object mode, `chunk` must be a string, `Buffer` or `Uint8Array`. For object mode streams, `chunk` may be any JavaScript value.
* `encoding` {string} Encoding of string chunks. Must be a valid Buffer encoding, such as `'utf8'` or `'ascii'`
* Returns: {boolean} `true` if additional chunks of data may continued to be pushed; `false` otherwise.

When `chunk` is a `Buffer`, `Uint8Array` or `string`, the `chunk` of data will be added to the internal queue for users of the stream to consume. Passing `chunk` as `null` signals the end of the stream (EOF), after which no more data can be written.

When the Readable is operating in paused mode, the data added with `readable.push()` can be read out by calling the [`readable.read()`](#stream_readable_read_size) method when the [`'readable'`][] event is emitted.

When the Readable is operating in flowing mode, the data added with `readable.push()` will be delivered by emitting a `'data'` event.

The `readable.push()` method is designed to be as flexible as possible. For example, when wrapping a lower-level source that provides some form of pause/resume mechanism, and a data callback, the low-level source can be wrapped by the custom Readable instance as illustrated in the following example:

```js
// source is an object with readStop() and readStart() methods,
// and an `ondata` member that gets called when it has data, and
// an `onend` member that gets called when the data is over.

class SourceWrapper extends Readable {
  constructor(options) {
    super(options);

    this._source = getLowlevelSourceObject();

    // Every time there's data, push it into the internal buffer.
    this._source.ondata = (chunk) => {
      // if push() returns false, then stop reading from source
      if (!this.push(chunk))
        this._source.readStop();
    };

    // When the source ends, push the EOF-signaling `null` chunk
    this._source.onend = () => {
      this.push(null);
    };
  }
  // _read will be called when the stream wants to pull more data in
  // the advisory size argument is ignored in this case.
  _read(size) {
    this._source.readStart();
  }
}
```

*Note*: The `readable.push()` method is intended be called only by Readable Implementers, and only from within the `readable._read()` method.

#### Errors While Reading

It is recommended that errors occurring during the processing of the `readable._read()` method are emitted using the `'error'` event rather than being thrown. Throwing an Error from within `readable._read()` can result in unexpected and inconsistent behavior depending on whether the stream is operating in flowing or paused mode. Using the `'error'` event ensures consistent and predictable handling of errors.

<!-- eslint-disable no-useless-return -->

```js
const { Readable } = require('stream');

const myReadable = new Readable({
  read(size) {
    if (checkSomeErrorCondition()) {
      process.nextTick(() => this.emit('error', err));
      return;
    }
    // do some work
  }
});
```

#### An Example Counting Stream

<!--type=example-->

The following is a basic example of a Readable stream that emits the numerals from 1 to 1,000,000 in ascending order, and then ends.

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
      const str = '' + i;
      const buf = Buffer.from(str, 'ascii');
      this.push(buf);
    }
  }
}
```

### Implementing a Duplex Stream

A [Duplex](#stream_class_stream_duplex) stream is one that implements both [Readable](#stream_class_stream_readable) and [Writable](#stream_class_stream_writable), such as a TCP socket connection.

Because JavaScript does not have support for multiple inheritance, the `stream.Duplex` class is extended to implement a [Duplex](#stream_class_stream_duplex) stream (as opposed to extending the `stream.Readable` *and* `stream.Writable` classes).

*Note*: The `stream.Duplex` class prototypically inherits from `stream.Readable` and parasitically from `stream.Writable`, but `instanceof` will work properly for both base classes due to overriding [`Symbol.hasInstance`][] on `stream.Writable`.

Custom Duplex streams *must* call the `new stream.Duplex([options])` constructor and implement *both* the `readable._read()` and `writable._write()` methods.

#### new stream.Duplex(options)

<!-- YAML
changes:

  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14636
    description: The `readableHighWaterMark` and `writableHighWaterMark` options
                 are supported now.
-->

* `options` {Object} Passed to both Writable and Readable constructors. Also has the following fields: 
  * `allowHalfOpen` {boolean} Defaults to `true`. If set to `false`, then the stream will automatically end the writable side when the readable side ends.
  * `readableObjectMode` {boolean} Defaults to `false`. Sets `objectMode` for readable side of the stream. Has no effect if `objectMode` is `true`.
  * `writableObjectMode` {boolean} Defaults to `false`. Sets `objectMode` for writable side of the stream. Has no effect if `objectMode` is `true`.
  * `readableHighWaterMark` {number} Sets `highWaterMark` for the readable side of the stream. Has no effect if `highWaterMark` is provided.
  * `writableHighWaterMark` {number} Sets `highWaterMark` for the writable side of the stream. Has no effect if `highWaterMark` is provided.

Por ejemplo:

```js
const { Duplex } = require('stream');

class MyDuplex extends Duplex {
  constructor(options) {
    super(options);
    // ...
  }
}
```

Or, when using pre-ES6 style constructors:

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

Or, using the Simplified Constructor approach:

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

#### An Example Duplex Stream

The following illustrates a simple example of a Duplex stream that wraps a hypothetical lower-level source object to which data can be written, and from which data can be read, albeit using an API that is not compatible with Node.js streams. The following illustrates a simple example of a Duplex stream that buffers incoming written data via the [Writable](#stream_class_stream_writable) interface that is read back out via the [Readable](#stream_class_stream_readable) interface.

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

The most important aspect of a Duplex stream is that the Readable and Writable sides operate independently of one another despite co-existing within a single object instance.

#### Object Mode Duplex Streams

For Duplex streams, `objectMode` can be set exclusively for either the Readable or Writable side using the `readableObjectMode` and `writableObjectMode` options respectively.

In the following example, for instance, a new Transform stream (which is a type of [Duplex](#stream_class_stream_duplex) stream) is created that has an object mode Writable side that accepts JavaScript numbers that are converted to hexadecimal strings on the Readable side.

```js
const { Transform } = require('stream');

// All Transform streams are also Duplex Streams
const myTransform = new Transform({
  writableObjectMode: true,

  transform(chunk, encoding, callback) {
    // Coerce the chunk to a number if necessary
    chunk |= 0;

    // Transform the chunk into something else.
    const data = chunk.toString(16);

    // Push the data onto the readable queue.
    callback(null, '0'.repeat(data.length % 2) + data);
  }
});

myTransform.setEncoding('ascii');
myTransform.on('data', (chunk) => console.log(chunk));

myTransform.write(1);
// Prints: 01
myTransform.write(10);
// Prints: 0a
myTransform.write(100);
// Prints: 64
```

### Implementing a Transform Stream

A [Transform](#stream_class_stream_transform) stream is a [Duplex](#stream_class_stream_duplex) stream where the output is computed in some way from the input. Examples include [zlib](zlib.html) streams or [crypto](crypto.html) streams that compress, encrypt, or decrypt data.

*Note*: There is no requirement that the output be the same size as the input, the same number of chunks, or arrive at the same time. For example, a Hash stream will only ever have a single chunk of output which is provided when the input is ended. A `zlib` stream will produce output that is either much smaller or much larger than its input.

The `stream.Transform` class is extended to implement a [Transform](#stream_class_stream_transform) stream.

The `stream.Transform` class prototypically inherits from `stream.Duplex` and implements its own versions of the `writable._write()` and `readable._read()` methods. Custom Transform implementations *must* implement the [`transform._transform()`](#stream_transform_transform_chunk_encoding_callback) method and *may* also implement the [`transform._flush()`](#stream_transform_flush_callback) method.

*Note*: Care must be taken when using Transform streams in that data written to the stream can cause the Writable side of the stream to become paused if the output on the Readable side is not consumed.

#### new stream.Transform([options])

* `options` {Object} Passed to both Writable and Readable constructors. Also has the following fields: 
  * `transform` {Function} Implementation for the [`stream._transform()`](#stream_transform_transform_chunk_encoding_callback) method.
  * `flush` {Function} Implementation for the [`stream._flush()`](#stream_transform_flush_callback) method.

Por ejemplo:

```js
const { Transform } = require('stream');

class MyTransform extends Transform {
  constructor(options) {
    super(options);
    // ...
  }
}
```

Or, when using pre-ES6 style constructors:

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

Or, using the Simplified Constructor approach:

```js
const { Transform } = require('stream');

const myTransform = new Transform({
  transform(chunk, encoding, callback) {
    // ...
  }
});
```

#### Events: 'finish' and 'end'

The [`'finish'`][] and [`'end'`][] events are from the `stream.Writable` and `stream.Readable` classes, respectively. The `'finish'` event is emitted after [`stream.end()`](#stream_writable_end_chunk_encoding_callback) is called and all chunks have been processed by [`stream._transform()`](#stream_transform_transform_chunk_encoding_callback). The `'end'` event is emitted after all data has been output, which occurs after the callback in [`transform._flush()`](#stream_transform_flush_callback) has been called.

#### transform.\_flush(callback)

* `callback` {Function} A callback function (optionally with an error argument and data) to be called when remaining data has been flushed.

*Note*: This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal Readable class methods only.

In some cases, a transform operation may need to emit an additional bit of data at the end of the stream. For example, a `zlib` compression stream will store an amount of internal state used to optimally compress the output. When the stream ends, however, that additional data needs to be flushed so that the compressed data will be complete.

Custom [Transform](#stream_class_stream_transform) implementations *may* implement the `transform._flush()` method. This will be called when there is no more written data to be consumed, but before the [`'end'`][] event is emitted signaling the end of the [Readable](#stream_class_stream_readable) stream.

Within the `transform._flush()` implementation, the `readable.push()` method may be called zero or more times, as appropriate. The `callback` function must be called when the flush operation is complete.

The `transform._flush()` method is prefixed with an underscore because it is internal to the class that defines it, and should never be called directly by user programs.

#### transform.\_transform(chunk, encoding, callback)

* `chunk` {Buffer|string|any} The chunk to be transformed. Will **always** be a buffer unless the `decodeStrings` option was set to `false` or the stream is operating in object mode.
* `encoding` {string} If the chunk is a string, then this is the encoding type. If chunk is a buffer, then this is the special value - 'buffer', ignore it in this case.
* `callback` {Function} A callback function (optionally with an error argument and data) to be called after the supplied `chunk` has been processed.

*Note*: This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal Readable class methods only.

All Transform stream implementations must provide a `_transform()` method to accept input and produce output. The `transform._transform()` implementation handles the bytes being written, computes an output, then passes that output off to the readable portion using the `readable.push()` method.

The `transform.push()` method may be called zero or more times to generate output from a single input chunk, depending on how much is to be output as a result of the chunk.

It is possible that no output is generated from any given chunk of input data.

The `callback` function must be called only when the current chunk is completely consumed. The first argument passed to the `callback` must be an `Error` object if an error occurred while processing the input or `null` otherwise. If a second argument is passed to the `callback`, it will be forwarded on to the `readable.push()` method. In other words the following are equivalent:

```js
transform.prototype._transform = function(data, encoding, callback) {
  this.push(data);
  callback();
};

transform.prototype._transform = function(data, encoding, callback) {
  callback(null, data);
};
```

The `transform._transform()` method is prefixed with an underscore because it is internal to the class that defines it, and should never be called directly by user programs.

`transform._transform()` is never called in parallel; streams implement a queue mechanism, and to receive the next chunk, `callback` must be called, either synchronously or asynchronously.

#### Class: stream.PassThrough

The `stream.PassThrough` class is a trivial implementation of a [Transform](#stream_class_stream_transform) stream that simply passes the input bytes across to the output. Its purpose is primarily for examples and testing, but there are some use cases where `stream.PassThrough` is useful as a building block for novel sorts of streams.

## Additional Notes

<!--type=misc-->

### Compatibility with Older Node.js Versions

<!--type=misc-->

In versions of Node.js prior to v0.10, the Readable stream interface was simpler, but also less powerful and less useful.

* Rather than waiting for calls the [`stream.read()`](#stream_readable_read_size) method, [`'data'`][] events would begin emitting immediately. Applications that would need to perform some amount of work to decide how to handle data were required to store read data into buffers so the data would not be lost.
* The [`stream.pause()`](#stream_readable_pause) method was advisory, rather than guaranteed. This meant that it was still necessary to be prepared to receive [`'data'`][] events *even when the stream was in a paused state*.

In Node.js v0.10, the [Readable](#stream_class_stream_readable) class was added. For backwards compatibility with older Node.js programs, Readable streams switch into "flowing mode" when a [`'data'`][] event handler is added, or when the [`stream.resume()`](#stream_readable_resume) method is called. The effect is that, even when not using the new [`stream.read()`](#stream_readable_read_size) method and [`'readable'`][] event, it is no longer necessary to worry about losing [`'data'`][] chunks.

While most applications will continue to function normally, this introduces an edge case in the following conditions:

* No [`'data'`][] event listener is added.
* The [`stream.resume()`](#stream_readable_resume) method is never called.
* The stream is not piped to any writable destination.

For example, consider the following code:

```js
// WARNING!  BROKEN!
net.createServer((socket) => {

  // we add an 'end' method, but never consume the data
  socket.on('end', () => {
    // It will never get here.
    socket.end('The message was received but was not processed.\n');
  });

}).listen(1337);
```

In versions of Node.js prior to v0.10, the incoming message data would be simply discarded. However, in Node.js v0.10 and beyond, the socket remains paused forever.

The workaround in this situation is to call the [`stream.resume()`](#stream_readable_resume) method to begin the flow of data:

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

In addition to new Readable streams switching into flowing mode, pre-v0.10 style streams can be wrapped in a Readable class using the [`readable.wrap()`][`stream.wrap()`] method.

### `readable.read(0)`

There are some cases where it is necessary to trigger a refresh of the underlying readable stream mechanisms, without actually consuming any data. In such cases, it is possible to call `readable.read(0)`, which will always return `null`.

If the internal read buffer is below the `highWaterMark`, and the stream is not currently reading, then calling `stream.read(0)` will trigger a low-level [`stream._read()`](#stream_readable_read_size_1) call.

While most applications will almost never need to do this, there are situations within Node.js where this is done, particularly in the Readable stream class internals.

### `readable.push('')`

Use of `readable.push('')` is not recommended.

Pushing a zero-byte string, `Buffer` or `Uint8Array` to a stream that is not in object mode has an interesting side effect. Because it *is* a call to [`readable.push()`](#stream_readable_push_chunk_encoding), the call will end the reading process. However, because the argument is an empty string, no data is added to the readable buffer so there is nothing for a user to consume.

### `highWaterMark` discrepancy after calling `readable.setEncoding()`

The use of `readable.setEncoding()` will change the behavior of how the `highWaterMark` operates in non-object mode.

Typically, the size of the current buffer is measured against the `highWaterMark` in *bytes*. However, after `setEncoding()` is called, the comparison function will begin to measure the buffer's size in *characters*.

This is not a problem in common cases with `latin1` or `ascii`. But it is advised to be mindful about this behavior when working with strings that could contain multi-byte characters.