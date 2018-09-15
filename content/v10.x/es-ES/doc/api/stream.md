# Stream

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

Un stream es una interfaz abstracta para trabajar con transmisión de datos en Node.js. El módulo `stream` proporciona una API base que hace sencillo contruir objetos que implementan la interfaz stream.

Existen muchos objetos stream que son proporcionados por Node.js. Por ejemplo, [request to an HTTP server](http.html#http_class_http_incomingmessage) y [`process.stdout`][] ambos son instancias stream.

Los streams pueden ser legibles, escribibles o ambas. Todos los streams son instancias de [`EventEmitter`][].

El módulo `stream` puede ser accedido usando:

```js
const stream = require('stream');
```

Mientras es importante entender cómo los streams funcionan, el módulo `stream`, en sí mismo, es más útil para los desarrolladores que están creando nuevos tipos de instancias stream. Los desarrolladores que *consumen* primariamente objetos stream raramente necesitaran usar el módulo `stream` directamente.

## Organización de este Documento

Este documento está dividido en dos secciones principales, con una tercera sección para notas adicionales. La primera sección explica los elementos del API del stream que son requeridos para usar *usar* streams con una aplicación. La segunda sección explica los elementos de la API que son necesarios para *implementar* nuevos tipos de streams.

## Tipos de Streams

Existen cuatro tipo fundamentales de stream en Node.js:

* [`Readable`][] - streams from which data can be read (for example [`fs.createReadStream()`][]).
* [`Writable`][] - streams to which data can be written (for example [`fs.createWriteStream()`][]).
* [`Duplex`][] - streams that are both `Readable` and `Writable` (for example [`net.Socket`][]).
* [`Transform`][] - `Duplex` streams that can modify or transform the data as it is written and read (for example [`zlib.createDeflate()`][]).

Adicionalmente, este módulo incluye la funciones de utilidad [pipeline](#stream_stream_pipeline_streams_callback) y [finished](#stream_stream_finished_stream_callback).

### Modo Objeto

Todos los streams que son creados por las APIs de Node.js operan exclusivamente en objetos strings y objetos `Buffer` (o `Uint8Array`). Si es posible, sin embargo, para implementaciones stream, trabajar con otros tipos de valores de JavaScript (con la excepción de `null`, que sirve un propósito especial con los streams). Tales streams son considerados para operar en "modo objeto".

Las instancias stream son cambiadas a modo objeto usando la opción `objectMode` cuando el stream es creado. No es seguro. intentar cambiar un stream existente a modo objeto.

### Almacenamiento en búfer

<!--type=misc-->

Los streams [`Writable`][] y [`Readable`][] van a almacenar los datos en un búfer interno, que puede ser recuperado usando `writable.writableBuffer` o `readable.readableBuffer`, respectivamente.

La cantidad de datos potencialmente guardados en un búfer depende de la opción `highWaterMark` pasadas por el constructor de streams. Para streams normales, la opción `highWaterMark` especifica un [número total de bytes](#stream_highwatermark_discrepancy_after_calling_readable_setencoding). Para operar stream en modo objeto, `highWaterMark` especifica un número total de objetos´.

Los datos son guardados en streams `Readable` cuando la implementación llama a [`stream.push(chunk)`](#stream_readable_push_chunk_encoding). Si el consumidor del stream no llama a [`stream.read()`](#stream_readable_read_size), los datos se quedarán en la cola interna hasta que se consumen.

Una vez que el tamaño total del búfer interno de lectura alcanza el límite especificado por `highWaterMark`, el stream va a dejar de leer datos de los recursos subyacentes temporalmente, hasta que los datos que están siendo almacenados puedan ser consumidos (es decir, el stream va a dejar de llamar el método interno `readable._read()` que es usado para llenar el búfer de lectura).

Los datos son almacenados en streams `Writable` cuando el método [`writable.write(chunk)`](#stream_writable_write_chunk_encoding_callback) es llamado repetidamente. Mientras que el tamaño total del búfer de escritura interno sea inferior al límite establecido por `highWaterMark`, las llamadas a `writable.write()` van a devolver `true`. Una vez que el tamaño del búfer interno alcanza o supera el `highWaterMark`, será devuelto `false`.

Un objetivo clave del API de `stream`, particularmente el método [`stream.pipe()`], es limitar el almacenamiento de datos a niveles aceptables, para que la fuentes y los destinos de diferentes velocidades no abrumen la memoria disponible.

Porque ambos streams [`Duplex`][] y [`Transform`][] son `Readable` y `Writable`, cada uno mantiene *dos* búferes internos separados. usados para leer y escribir, permitiendo cada lado operar independientemente del otro, mientras mantiene se un flujo de datos apropiado y eficiente. Por ejemplo, las instancias [`net.Socket`][] son streams [`Duplex`][] cuyo lado `Readable` permite el consumo de datos recibidos *del* socket y cuyo lado `Writable` permite escribir datos *al* socket. Porque los datos pueden ser escritos al socket a una tasa más rápida o más lenta que los datos que son recibidos, es importante para cada lado operar (y almacenar) independientemente del otro.

## API para los Consumidores de Stream

<!--type=misc-->

Casi todas las aplicaciones Node.js, no importa que tan simple sea, usa streams de alguna manera/modo. Nota: se puede escoger, alguna de las dos. Lo siguiente es un ejemplo de uso de streams en una aplicación de Node.js que implemente un servidor HTTP:

```js
const http = require('http');

const server = http.createServer((req, res) => {
  // req is an http.IncomingMessage, which is a Readable Stream
  // res is an http.ServerResponse, which is a Writable Stream

  let body = '';
  // Get the data as utf8 strings.
  // If an encoding is not set, Buffer objects will be received.
  req.setEncoding('utf8');

  // Readable streams emit 'data' events once a listener is added
  req.on('data', (chunk) => {
    body += chunk;
  });

  // the 'end' event indicates that the entire body has been received
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      // write back something interesting to the user:
      res.write(typeof data);
      res.end();
    } catch (er) {
      // uh oh! bad json!
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

Streams [`Writable`][] (tales como `res` en el ejemplo) expone métodos como`write()` y `end()` que son usados para escribir datos en el stream.

Los streams [`Readable`][] usan la API [`EventEmitter`][] para notificar al código de la aplicación cuando los datos estén listos para ser leídos del stream. Esos datos disponibles pueden ser leídos del stream de múltiples maneras.

Los streams [`Writable`][] y [`Readable`][] usan la API [`EventEmitter`][] de varias manera para comunicar el estado actual del stream.

Los streams [`Duplex`][] y [`Transform`][] son tanto [`Writable`][] como [`Readable`][].

Las aplicaciones que, o están escribiendo o consumiendo datos de un stream, no requieren implementar la interfaz stream directamente y generalmente no tendrán ninguna razón para llamar `require('stream')`.

Los desarrolladores que desean implementar nuevos tipos de stream deberían referirse a la sección [API para implementadores de stream](#stream_api_for_stream_implementers).

### Streams Escribibles

Los streams escribibles son una abstracción para un *destino* al que se le han escrito datos.

Ejemplos de streams [`Writable`][] streams incluyen:

* [Solicitudes HTTP, en el cliente](http.html#http_class_http_clientrequest)
* [Respuestas HTTP, en el servidor](http.html#http_class_http_serverresponse)
* [fs write streams](fs.html#fs_class_fs_writestream)
* [streams zlib](zlib.html)
* [streams crypto](crypto.html)
* [sockets TCP](net.html#net_class_net_socket)
* [proceso secundario stdin](child_process.html#child_process_subprocess_stdin)
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
-->

El evento `'close'` es emitido cuando el stream y cualquiera de sus recursos subyacentes (por ejemplo, un descriptor de archivos) fueron cerrados. El evento indica que no se emitirán más eventos, y no ocurrirá ninguna computación adicional.

No todos los streams `Writable` emitirán el evento `'close'`.

##### Evento: 'drain'

<!-- YAML
added: v0.9.4
-->

Si una llamada a [`stream.write(chunk)`](#stream_writable_write_chunk_encoding_callback) devuelve `false`, el evento `'drain'` será emitido cuando sea apropiado renaudar la escritura de datos al stream.

```js
// Escribe los datos en el stream escribible suministrado un millón de veces.
// Está atento a la contrapresión.
function writeOneMillionTimes(writer, data, encoding, callback) {
  let i = 1000000;
  write();
  function write() {
    let ok = true;
    do {
      i--;
      if (i === 0) {
        // last time!
        writer.write(data, encoding, callback);
      } else {
        // see if we should continue, or wait
        // don't pass the callback, because we're not done yet.
        ok = writer.write(data, encoding);
      }
    } while (i > 0 && ok);
    if (i > 0) {
      // had to stop early!
      // write some more once it drains
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
  console.error('All writes are now complete.');
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
  console.error('something is piping into the writer');
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

El método `writable.cork()` forza que todos los datos escritos sean almacenados en la memoria. Los datos almacenados van a ser arrojados cuando se llame alguno de los métodos [`stream.uncork()`][] o [`stream.end()`](#stream_writable_end_chunk_encoding_callback).

La intención primordial de `writable.cork()` es evitar una situación donde escribir muchos fragmentos pequeños de datos en un stream no cause un respaldo en el búfer interno, eso tendría un impacto adverso en el desempeño. En tales situaciones, las implementaciones que implementen el método `writable._writev()` pueden ejecutar escrituras almacenadas de una manera más optimizada.

Vea también: [`writable.uncork()`][].

##### writable.destroy([error])

<!-- YAML
added: v8.0.0
-->

* Devuelve: {this}

Destruye el stream, y emite el `'error'` pasado y un evento `'close'`. Después de esta llamada, el stream escribible ha terminado, y llamadas posteriores al `write()` / `end()` darán un error `ERR_STREAM_DESTROYED`. Los implementadores no deberían sobreescribir este método, pero implementa [`writable._destroy()`](#stream_writable_destroy_err_callback) en su lugar.

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
* `encoding` {string} La codificación si `chunk` es un string
* `callback` {Function} Callback opcional cuando el stream está/esté terminado Nota: escoger alguno de los dos
* Devuelve: {this}

Llamar al método `writable.end()` señala que no se escribirán más datos en el [`Writable`][]. Los argumentos `chunk` y `encoding` opcionales permiten un último fragmento de datos para ser escritos inmediatamente antes de cerrar el stream. Si es proporcionado, la función `callback` opcional es adjuntada como un listener para el evento [`'finish'`][].

Llamar el método [`stream.write()`](#stream_writable_write_chunk_encoding_callback) después de llamar a [`stream.end()`](#stream_writable_end_chunk_encoding_callback) va a provocar un error.

```js
// write 'hello, ' and then end with 'world!'
const fs = require('fs');
const file = fs.createWriteStream('example.txt');
file.write('hello, ');
file.end('world!');
// writing more now is not allowed!
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

Cuando se use [`writable.cork()`][] y `writable.uncork()` para manejar el almacenado de escritos a un stream, es recomendado que las llamadas a `writable.uncork()` sean diferidas usando `process.nextTick()`. Doing so allows batching of all `writable.write()` calls that occur within a given Node.js event loop phase.

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
  // The data will not be flushed until uncork() is called a second time.
  stream.uncork();
});
```

Vea también: [`writable.cork()`][].

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

* `chunk` {string|Buffer|Uint8Array|any} Datos opcionales para escribir. For streams not operating in object mode, `chunk` must be a string, `Buffer` or `Uint8Array`. For object mode streams, `chunk` may be any JavaScript value other than `null`.
* `encoding` {string} The encoding, if `chunk` is a string
* `callback` {Function} Callback for when this chunk of data is flushed
* Returns: {boolean} `false` if the stream wishes for the calling code to wait for the `'drain'` event to be emitted before continuing to write additional data; otherwise `true`.

El método `writable.write()` escribe algunos datos al stream, y llama al `callback` suministrado una vez que los datos han sido manejados completamente. Si ocurre un error, el `callback` *puede o no* ser llamado con el error como su primer argumento. Para detectar errores de escritura de manera fiable, añade un listener para el evento `'error'`.

El valor devuelto es `true` si el búfer interno es menor que el `highWaterMark` configurado cuando el stream fue creado después de admitir a `chunk`. Si es devuelto `false`, los siguientes intentos de escribir datos en el stream deberían detenerse hasta que el evento [`'drain'`][] es emitido.

Mientras que un stream no esté draining, llamadas a `write()` almacenaran `chunk`, y devolverán false. Una vez que todos los fragmentos almacenados son vaciados (aceptado para entrega por el sistema operativo), el evento `'drain'` será emitido. Es recomendado que una vez que `write()` devuelva false, no se escribirán más fragmentos hasta que sea emitido el evento `'drain'`. Mientras se llame `write()` en un stream donde el vaciado no está permitido, Node.js va a almacenar todos los fragmentos escritos hasta que el uso máximo de la memoria ocurra, en ese punto se anulará incondicionalmente. Incluso antes de que se anule, alto uso de la memoria causará un pobre desempeño del colector de basura, y un RSS alto (que no es típicamente liberado de vuelta al sistema, incluso después que la memoria ya no es requerida). Dado que los sockets TCP no pueden ser drenados si el peer remoto no lee los datos, escribir un socket que no se está vaciando puede llevar a vulnerabilidad explotable remota.

Escribir datos mientras que el stream no está drenando es particularmente problemático para un [`Transform`][], porque los streams `Transform` son pausados de manera predeterminada hasta que se les realice pipe, o se añada `'data'`, o un manejador de eventos `'readable'`.

Si los datos a ser escritos pueden ser generados o traídos cuando se requieren, es recomendado encapsular la lógica en un [`Readable`][] y usar [`stream.pipe()`][]. Sin embargo, si se prefiere llamar a `write()`, es posible respetar la contrapresión y evitar problemas de memoria usando el evento [`'drain'`][]:

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

Un stream `Writable` en modo objeto siempre ignorará el argumento `encoding`.

### Streams Legibles

Los streams legibles son una abstracción para un *source* donde los datos son consumidos.

Ejemplos de streams `Readable` inlcuyen:

* [HTTP responses, on the client](http.html#http_class_http_incomingmessage)
* [HTTP requests, on the server](http.html#http_class_http_incomingmessage)
* [fs read streams](fs.html#fs_class_fs_readstream)
* [zlib streams](zlib.html)
* [crypto streams](crypto.html)
* [TCP sockets](net.html#net_class_net_socket)
* [child process stdout and stderr](child_process.html#child_process_subprocess_stdout)
* [`process.stdin`][]

Todos los streams [`Readable`][] implementan la interfaz definida por la clase `stream.Readable`.

#### Dos modos

Los streams `Readable` operan de forma efectiva en uno de dos modos: fluido y pausado.

Cuando sea el modo fluido, los datos son leídos del sistema subyacente automáticamente, y son proporcionados a una aplicación tan pronto como sea posible usando eventos a través de la interfaz [`EventEmitter`][].

En el modo pausado, el método [`stream.read()`](#stream_readable_read_size) debe ser llamado para leer explícitamente fragmentos de datos del stream.

Todos los streams [`Readable`][] comienzan en el modo pausado, pero pueden ser cambiados al modo fluido en una de las siguientes maneras:

* Añadiendo un manejador de eventos [`'data'`][].
* Llamar al método [`stream.resume()`](#stream_readable_resume).
* Llamar al método [`stream.pipe()`][] para enviar los datos a un [`Writable`][].

El `Readable` puede ser cambiado de vuelta al modo pausado usando alguno de los siguientes:

* Si no existen destinos pipe, al llamar al método [`stream.pause()`](#stream_readable_pause).
* Si existen destinos pipe, al remover todos los destinos pipe. Múltiples destinos pipe pueden ser eliminados al llamar el método [`stream.unpipe()`][].

El concepto importante a recordar es que un `Readable` no va a generar datos hasta que sea proporcionado un mecanismo para ya sea consumir o ignorar los datos. Si el mecanismo de consumir los datos está deshabilitado o es quitado, el `Readable` va a *intentar* de dejar de generar los datos.

Por razones de compatibilidad con versiones anteriores, quitar el manejador de eventos [`'data'`][], **no** va a pausar el stream automáticamente. También, si hay destinos que fueron pipe, entonces llamar a [`stream.pause()`](#stream_readable_pause) no va a garantizar que el stream va a *permanecer* pausado una vez que esos destinos se vacíen y pidan más datos.

Si un [`Readable`][] es cambiado al modo fluido y no hay consumidores disponibles para manejar los datos, los datos se perderán. Esto puede ocurrir, por ejemplo, cuando el método `readable.resume()` es llamado sin un listener adjunto al evento `'data'`, o cuando el manejador de evento `'data'` es eliminado del stream.

#### Tres Estados

Los "dos modos" de operación para un stream `Readable` son una abstracción simplificada para el manejo del estado interno que es más complicado y está pasando en la implementación del stream `Readable`.

Específicamente, en cualquier momento dado, cada `Readable` está en uno de tres estados posibles:

* `readable.readableFlowing = null`
* `readable.readableFlowing = false`
* `readable.readableFlowing = true`

Cuando `readable.readableFlowing` es `null`, ningún mecanismo para consumir los datos de los streams es proporcionado, entonces el stream no generará sus datos. Mientras se esté en este estado, adjuntar un listener para el evento `'data'`, llamar el método `readable.pipe()`, o llamar el método `readable.resume()`, cambiará `readable.readableFlowing` a `true`, causando que el `Readable` comience a emitir eventos activamente mientras los datos sean generados.

Llamar a `readable.pause()`, `readable.unpipe()`, o recibir una "contrapresión" causará que el `readable.readableFlowing` sea establecido como `false`, interrumpiendo temporalmente el flujo de los eventos pero *no* interrumpiendo la generación de datos. Mientras en este estado, adjuntar un listener para el evento `'data'` no causará que `readable.readableFlowing` cambie a `true`.

```js
const { PassThrough, Writable } = require('stream');
const pass = new PassThrough();
const writable = new Writable();

pass.pipe(writable);
pass.unpipe(writable);
// readableFlowing is now false

pass.on('data', (chunk) => { console.log(chunk.toString()); });
pass.write('ok'); // will not emit 'data'
pass.resume(); // must be called to make 'data' being emitted
```

Mientras `readable.readableFlowing` es `false`, los datos pueden ser que se esten acumulando dentro del búfer interno de los streams.

#### Escoge uno

El API del stream `Readable` ha evolucionado a través de de múltiples versiones de Node.js y ha proporcionado múltiples métodos de consumir los datos del stream. En general, los desarrolladores deberían elegir *uno* de estos métodos de consumir datos y *nunca deberían* usar varios métodos de consumo de datos de un solo stream.

Es recomendado el uso del método `readable.pipe()` para la mayoría de los usuarios, como ha sido implementado para proporcionar la manera más sencilla de consumo de datos del stream. Los desarrolladores que requieren un control más detallado sobre la transferencia y generación de datos pueden usar los APIS [`EventEmitter`][] y `readable.pause()`/`readable.resume()`.

#### Clase: stream.Readable

<!-- YAML
added: v0.9.4
-->

<!--type=class-->

##### Evento: 'close'

<!-- YAML
added: v0.9.4
-->

El evento `'close'` es emitido cuando el stream y cualquiera de sus recursos subyacentes (por ejemplo, un descriptor de archivos) han sido cerrados. El evento indica que no se emitirán más eventos, y no se producirá ninguna computación adicional.

No todos los streams [`Readable`][] emitirán el evento `'close'`.

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

El evento `'end'` **no será emitido** a menos que nos datos sean completamente consumidos. Esto se puede lograr cambiando el stream a modo fluido, o al llamar repetidamente a [`stream.read()`](#stream_readable_read_size) hasta que los datos han sido consumidos.

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

El callback del listener va a pasar un solo objeto `Error`.

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

El evento `'readable'` es emitido cuando hay datos disponibles para ser leídos del stream. En algunos casos, adjuntar un listener para el evento `'readable'` va a causar que cierta cantidad de datos sean leídos a un búfer interno.

```javascript
const readable = getReadableStreamSomehow();
readable.on('readable', function() {
  // there is some data to read now
  let data;

  while (data = this.read()) {
    console.log(data);
  }
});
```

El evento `'readable'` también será emitido una vez que ha sido alcanzado el final de los datos del stream, pero antes de que se emita el evento `'end'`.

Efectivamente, el evento `'readable'` indica que el stream tiene nueva información: ya sea que nuevos datos están disponibles, o que el final del stream ha sido alcanzado. En el primer caso, [`stream.read()`](#stream_readable_read_size) devolverá los datos disponibles. En el segundo caso, [`stream.read()`](#stream_readable_read_size) devolverá `null`. En el siguiente ejemplo `foo.txt` es un archivo vacío:

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

Si tanto `'readable'` y [`'data'`][] son usados al mismo tiempo, `'readable'` toma la prioridad de controlar el flujo, es decir, `'data'` será emitido solo cuando [`stream.read()`](#stream_readable_read_size) es llamado.

##### readable.destroy([error])

<!-- YAML
added: v8.0.0
-->

* `error` {Error} Error que será pasado como una carga en el evento `'error'`
* Devuelve: {this}

Destruye el stream, luego emite `'error'` y `'close'`. Después de esta llamada, el stream legible liberará cualquier recurso y las llamadas posteriores a `push()` serán ignoradas. Los implementadores no deberían sobreescribir este método, deberían implementar [`readable._destroy()`](#stream_readable_destroy_err_callback) en su lugar.

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

##### readable.pipe(destination[, options])

<!-- YAML
added: v0.9.4
-->

* `destination` {stream.Writable} El destino para escribir datos
* `opciones` {Object} Opciones pipe 
  * `end` {boolean} Finaliza el escritor cuando el lector termina. **Predeterminado:** `true`.
* Devuelve: {stream.Writable} haciendo posible preparar cadenas de piped streams

El método `readable.pipe()` adjunta un stream [`Writable`][] al `readable`, causando el cambio automático a modo fluido y empujando todos sus datos al [`Writable`][] adjunto. El flujo de datos será automáticamente manejado para que el stream `Writable` de destino no sea abrumado por un stream `Readable` más rápido.

El siguiente ejemplo hace pipe en todos los datos del `readable` a un archivo llamado `file.txt`:

```js
const fs = require('fs');
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// All the data from readable goes into 'file.txt'
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

De manera predeterminada, [`stream.end()`](#stream_writable_end_chunk_encoding_callback) es llamado en el stream `Writable` de destino cuando el stream `Readable` fuente emite [`'end'`][], para que el destino no sea más escribible. Para desactivar este comportamiento predeterminado, la opción `end` puede ser pasada como `false`, causando que el stream de destino permanezca abierto, como se ilustra en el siguiente ejemplo:

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
* Devuelve: {string|Buffer|null}

El método `readable.read()` sustrae algunos datos del búfer interno y los devuelve. Si no hay datos disponibles para leer, se devuelve `null`. De manera predeterminada, los datos se devolverán como un objeto `Buffer`, a menos de que una codificación haya sido especificada usando el método `readable.setEncoding()`, o que el stream esté operando en modo objeto.

El argumento `size` opcional especifica un número de bytes para leer. Si el `size` de los bytes no están disponibles para ser leídos, `null` será devuelto *a menos que* el stream haya terminado, en tal caso todos los datos restantes en el búfer interno serán devueltos.

Si el `size` del argumento no es especificado, todos los datos que están en el búfer interno serán devueltos.

El método `readable.read()` solo debería ser llamado en los streams `Readable` operando en modo pausado. En modo fluido, se llama `readable.read()` automáticamente hasta que el búfer interno es vaciado completamente.

```js
const readable = getReadableStreamSomehow();
readable.on('readable', () => {
  let chunk;
  while (null !== (chunk = readable.read())) {
    console.log(`Received ${chunk.length} bytes of data.`);
  }
});
```

Un stream `Readable` en modo objeto siempre devolverá un solo ítem de una llamada a [`readable.read(size)`](#stream_readable_read_size), sin importar el valor del argumento `size`.

Si el método `readable.read()` devuelve un fragmento de datos, un evento `'data'`también será emitido.

Llamar a [`stream.read([size])`](#stream_readable_read_size) después del evento [`'end'`][] ha sido emitido devolverá `null`. No se levantará ningún error runtime.

##### readable.readableHighWaterMark

<!-- YAML
added: v9.3.0
-->

* Devuelve: {number}

Devuelve el valor del `highWaterMark` pasado al construir este `Readable`.

##### readable.readableLength

<!-- YAML
added: v9.4.0
-->

* Devielve: {number}

Esta propiedad contiene el número de bytes (u objetos) en esta cola, listos para ser leídos. El valor proporciona datos de introspección con respecto al estatus de `highWaterMark`.

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

El método `readable.resume()` causa que un stream `Readable` explícitamente pausado se reanude la emisión de eventos [`'data'`][], cambiando el stream a modo fluido.

El método `readable.resume()` puede ser usado para consumir completamente los datos de un stream sin procesar ningunos de esos datos como es ilustrado en el siguiente ejemplo:

```js
getReadableStreamSomehow()
  .resume()
  .on('end', () => {
    console.log('Reached the end, but did not read anything.');
  });
```

El método `readable.resume()` no tiene efecto si existe un listener de evento `'readable'`.

##### readable.setEncoding(encoding)

<!-- YAML
added: v0.9.4
-->

* `encoding` {string} La codificación a usar.
* Devuelve: {this}

El método `readable.setEncoding()` establece la codificación de caracteres para los datos leídos del stream `Readable`.

De manera predeterminada, no se asigna ninguna codificación y los datos del stream se van a devolver como objetos `Buffer`. Establecer una codificación causa que los datos del stream sean devueltos como strings de la codificación especificada en vez de un objeto `Buffer`. Por ejemplo, llamar a `readable.setEncoding('utf8')` causará que la salida de datos sea interpretada como datos UTF.8, y sean pasados como strings. Llamar a `readable.setEncoding('hex')` causará que los datos sean codificados en un formato string hexadecimal.

El stream `Readable` va a manejar correctamente caracteres multi-byte entregados a través del stream que de lo contrario no es decodificado de manera correcta si se extrae del stream como objetos `Buffer`.

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
* Returns: {this}

El método `readable.unpipe()` separa un stream `Writable` que fue adjuntado anteriormente usando el método [`stream.pipe()`][].

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

El método `readable.unshift()` empuja un fragmento de datos de vuelta al búfer interno. Esto es útil en ciertas situaciones, cuando un stream está siendo consumido por código que necesita "no-consumir" alguna cantidad de datos que ha sido sacada de forma optimista de la fuente, para que los datos puedan ser pasados a otra parte.

El método `stream.unshift(chunk)` no puede ser llamado después que el evento [`'end'`][] ha sido emitido, o se producirá un error runtime.

Los desarrolladores que usan `stream.unshift()` a menudo deberían considerar a cambiar a usar el stream [`Transform`][] en su lugar. Vea la sección [API para los Implementadores de Stream](#stream_api_for_stream_implementers) para más información.

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
        // remove the 'readable' listener before unshifting
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

A diferencia de [`stream.push(chunk)`](#stream_readable_push_chunk_encoding), `stream.unshift(chunk)` no va a terminar el proceso de lectura al resetear el estado de lectura interno del stream. Esto puede causar resultados inesperados si `readable.unshift()` es llamado durante una lectura (es decir desde una implementación [`stream._read()`](#stream_readable_read_size_1) en un stream personalizado). Siguiendo la llamada a `readable.unshift()` con un inmediato [`stream.push('')`](#stream_readable_push_chunk_encoding) va a restablecer el estado de la lectura de forma adecuada, sin embargo es mejor simplemente evitar llamar a `readable.unshift()` mientras en el proceso de realizar una lectura.

##### readable.wrap(stream)

<!-- YAML
added: v0.9.4
-->

* `stream` {Stream} Un stream legible de "viejo estilo"
* Devuelve: {this}

Versiones anteriores de v0.10 de Node.js tenían streams que no implementan la API del módulo `stream` como está definido actualmente. (Vea [Compatibility](#stream_compatibility_with_older_node_js_versions) para más información.)

Cuando se use una librería de Node.js más vieja que emite eventos [`'data'`][] y tiene un método [`stream.pause()`](#stream_readable_pause) que solo es consultivo, el método `readable.wrap()` puede ser usado para crear un stream [`Readable`][] que usa el viejo stream y su fuente de datos.

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

* Devuelve: {AsyncIterator} para consumir completamente el stream.

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

Si el bucle termina con un `break` o un `throw`, el stream será destruido. En otros términos, iterar sobre una secuencia consumirá completamente el stream. El stream será leído en fragmentos de igual tamaño a la opción `highWaterMark`. En el ejemplo de código anterior, los datos van a estar en un solo fragmento si el archivo tiene menos que 64kb de datos porque no se proporciona ninguna opción `highWaterMark` a [`fs.createReadStream()`][].

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

Los streams dúplex son streams que implementan tanto la interfaz [`Readable`][] como la interfaz [`Writable`][].

Ejemplos de un stream `Duplex` incluyen:

* [sockets TCP](net.html#net_class_net_socket)
* [streams zlib](zlib.html)
* [streams crypto](crypto.html)

#### Clase: stream.Transform

<!-- YAML
added: v0.9.4
-->

<!--type=class-->

Los streams de transformación son streams [`Duplex`][] donde la salida es de alguna manera relacionada con la entrada. Como todos los streams [`Duplex`][], los streams `Transform` implementan tanto la interfaz [`Readable`][] como la interfaz [`Writable`][].

Ejemplos de streams `Transform` incluyen:

* [streams zlib](zlib.html)
* [streams crypto](crypto.html)

##### transform.destroy([error])

<!-- YAML
added: v8.0.0
-->

Destruye el stream, luego emite `'error'`. Después de esta llamada, el stream de transformación liberaría cualquier recurso interno. los implementadores no deberían sobreescribir este método, en su lugar implementa [`readable._destroy()`](#stream_readable_destroy_err_callback). La implementación predeterminada de `_destroy()` para `Transform` también emite `'close'`.

### stream.finished(stream, callback)

<!-- YAML
added: v10.0.0
-->

* `stream` {Stream} Un stream legible y/o escribible.
* `callback` {Function} Una función callback que toma un argumento error opcional.

Una función para ser notificado cuando un stream ya no es legible, escribible, ha experimentado un evento error o un evento de cierre prematuro.

```js
const { finished } = require('stream');

const rs = fs.createReadStream('archive.tar');

finished(rs, (err) => {
  if (err) {
    console.error('Stream failed', err);
  } else {
    console.log('Stream is done reading');
  }
});

rs.resume(); // drain the stream
```

Especialmente útil en escenarios de manejo de error donde un stream es destruido y prematuramente cerrado (como una solicitud HTTP abortada), y no emitirá `'end'` o `'finish'`.

The `finished` API is promisify'able as well;

```js
const finished = util.promisify(stream.finished);

const rs = fs.createReadStream('archive.tar');

async function run() {
  await finished(rs);
  console.log('Stream is done reading');
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

Un método módulo para hacer pipe entre streams reenviando errores y limpiando correctamente y proporcionando un callback cuando el pipeline es completado.

```js
const { pipeline } = require('stream');
const fs = require('fs');
const zlib = require('zlib');

// Use the pipeline API to easily pipe a series of streams
// together and get notified when the pipeline is fully done.

// A pipeline to gzip a potentially huge tar file efficiently:

pipeline(
  fs.createReadStream('archive.tar'),
  zlib.createGzip(),
  fs.createWriteStream('archive.tar.gz'),
  (err) => {
    if (err) {
      console.error('Pipeline failed', err);
    } else {
      console.log('Pipeline succeeded');
    }
  }
);
```

The `pipeline` API is promisify'able as well:

```js
const pipeline = util.promisify(stream.pipeline);

async function run() {
  await pipeline(
    fs.createReadStream('archive.tar'),
    zlib.createGzip(),
    fs.createWriteStream('archive.tar.gz')
  );
  console.log('Pipeline succeeded');
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

<table>
  <thead>
    <tr>
      <th>
        <p>Casos de uso</p>
      </th>
      <th>
        <p>Clase</p>
      </th>
      <th>
        <p>Método(s) a implementar</p>
      </th>
    </tr>
  </thead>
  <tr>
    <td>
      <p>Solo lectura</p>
    </td>
    <td>
      <p>[`Readable`](#stream_class_stream_readable)</p>
    </td>
    <td>
      <p><code>[_read][stream-_read]</code></p>
    </td>
  </tr>
  <tr>
    <td>
      <p>Solo escritura</p>
    </td>
    <td>
      <p>[`Writable`](#stream_class_stream_writable)</p>
    </td>
    <td>
      <p>
        <code>[_write][stream-_write]</code>,
        <code>[_writev][stream-_writev]</code>,
        <code>[_final][stream-_final]</code>
      </p>
    </td>
  </tr>
  <tr>
    <td>
      <p>Lectura y escritura</p>
    </td>
    <td>
      <p>[`Duplex`](#stream_class_stream_duplex)</p>
    </td>
    <td>
      <p>
        <code>[_read][stream-_read]</code>,
        <code>[_write][stream-_write]</code>,
        <code>[_writev][stream-_writev]</code>,
        <code>[_final][stream-_final]</code></p>
    </td>
  </tr>
  <tr>
    <td>
      <p>Opera en datos escritos, luego lee el resultado</p>
    </td>
    <td>
      <p>[`Transform`](#stream_class_stream_transform)</p>
    </td>
    <td>
      <p>
        <code>[_transform][stream-_transform]</code>,
        <code>[_flush][stream-_flush]</code>,
        <code>[_final][stream-_final]</code>
      </p>
    </td>
  </tr>
</table>

El código de implementación para un stream *nunca* debería llamar los métodos "públicos" de un stream que son destinados a ser utilizados por consumidores (tal como se describe en la sección [Api para Consumidores de Stream](#stream_api_for_stream_consumers)). Hacerlo puede provocar efectos secundarios en el código de la aplicación consumiendo el stream.

### Construcción Simplificada

<!-- YAML
added: v1.2.0
-->

Para muchos casos simples, es imposible construir un stream si depender de la herencia. Esto puede ser logrado al crear instancias directamente de los objetos `stream.Writable`, `stream.Readable`, `stream.Duplex` o `stream.Transform` y pasar métodos apropiados como opciones de constructor.

```js
const { Writable } = require('stream');

const myWritable = new Writable({
  write(chunk, encoding, callback) {
    // ...
  }
});
```

### Implementando un Stream Writable

La clase `stream.Writable` es extendida para implementar un stream [`Writable`][].

Streams `Writable` personalizados *deben* llamar el constructor `new stream.Writable([options])` e implementar el método `writable._write()`. El método `writable._writev()` también *pudiera* ser implementado.

#### Constructor: new stream.Writable([options])

<!-- YAML
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18438
    description: >
      Add `emitClose` option to specify if `'close'` is emitted on destroy
-->

* `options` {Object} 
  * `highWaterMark` {number} Buffer level when [`stream.write()`](#stream_writable_write_chunk_encoding_callback) starts returning `false`. **Default:** `16384` (16kb), or `16` for `objectMode` streams.
  * `decodeStrings` {boolean} Whether or not to decode strings into `Buffer`s before passing them to [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1). **Default:** `true`.
  * `objectMode` {boolean} Whether or not the [`stream.write(anyObj)`](#stream_writable_write_chunk_encoding_callback) is a valid operation. When set, it becomes possible to write JavaScript values other than string, `Buffer` or `Uint8Array` if supported by the stream implementation. **Default:** `false`.
  * `emitClose` {boolean} Whether or not the stream should emit `'close'` after it has been destroyed. **Default:** `true`.
  * `write` {Function} Implementation for the [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1) method.
  * `writev` {Function} Implementation for the [`stream._writev()`](#stream_writable_writev_chunks_callback) method.
  * `destroy` {Function} Implementation for the [`stream._destroy()`](#stream_writable_destroy_err_callback) method.
  * `final` {Function} Implementation for the [`stream._final()`](#stream_writable_final_callback) method.

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

Todas las implementaciones de stream `Writable` deben proporcionar un método [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1) para enviar datos al recurso subyacente.

[`Transform`][] streams provide their own implementation of the [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1).

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Writable` class methods only.

The `callback` method must be called to signal either that the write completed successfully or failed with an error. The first argument passed to the `callback` must be the `Error` object if the call failed or `null` if the write succeeded.

All calls to `writable.write()` that occur between the time `writable._write()` is called and the `callback` is called will cause the written data to be buffered. When the `callback` is invoked, the stream might emit a [`'drain'`][] event. If a stream implementation is capable of processing multiple chunks of data at once, the `writable._writev()` method should be implemented.

If the `decodeStrings` property is explicitly set to `false` in the constructor options, then `chunk` will remain the same object that is passed to `.write()`, and may be a string rather than a `Buffer`. This is to support implementations that have an optimized handling for certain string data encodings. In that case, the `encoding` argument will indicate the character encoding of the string. Otherwise, the `encoding` argument can be safely ignored.

The `writable._write()` method is prefixed with an underscore because it is internal to the class that defines it, and should never be called directly by user programs.

#### writable.\_writev(chunks, callback)

* `chunks` {Object[]} The chunks to be written. Each chunk has following format: `{ chunk: ..., encoding: ... }`.
* `callback` {Function} A callback function (optionally with an error argument) to be invoked when processing is complete for the supplied chunks.

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Writable` class methods only.

The `writable._writev()` method may be implemented in addition to `writable._write()` in stream implementations that are capable of processing multiple chunks of data at once. If implemented, the method will be called with all chunks of data currently buffered in the write queue.

The `writable._writev()` method is prefixed with an underscore because it is internal to the class that defines it, and should never be called directly by user programs.

#### writable.\_destroy(err, callback)

<!-- YAML
added: v8.0.0
-->

* `err` {Error} A possible error.
* `callback` {Function} A callback function that takes an optional error argument.

The `_destroy()` method is called by [`writable.destroy()`](#stream_writable_destroy_error). It can be overridden by child classes but it **must not** be called directly.

#### writable.\_final(callback)

<!-- YAML
added: v8.0.0
-->

* `callback` {Function} Call this function (optionally with an error argument) when finished writing any remaining data.

The `_final()` method **must not** be called directly. It may be implemented by child classes, and if so, will be called by the internal `Writable` class methods only.

This optional function will be called before the stream closes, delaying the `'finish'` event until `callback` is called. This is useful to close resources or write buffered data before a stream ends.

#### Errors While Writing

It is recommended that errors occurring during the processing of the `writable._write()` and `writable._writev()` methods are reported by invoking the callback and passing the error as the first argument. This will cause an `'error'` event to be emitted by the `Writable`. Throwing an `Error` from within `writable._write()` can result in unexpected and inconsistent behavior depending on how the stream is being used. Using the callback ensures consistent and predictable handling of errors.

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

#### An Example Writable Stream

The following illustrates a rather simplistic (and somewhat pointless) custom `Writable` stream implementation. While this specific `Writable` stream instance is not of any real particular usefulness, the example illustrates each of the required elements of a custom [`Writable`][] stream instance:

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

Decoding buffers is a common task, for instance, when using transformers whose input is a string. This is not a trivial process when using multi-byte characters encoding, such as UTF-8. The following example shows how to decode multi-byte strings using `StringDecoder` and [`Writable`][].

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

### Implementing a Readable Stream

The `stream.Readable` class is extended to implement a [`Readable`][] stream.

Custom `Readable` streams *must* call the `new stream.Readable([options])` constructor and implement the `readable._read()` method.

#### new stream.Readable([options])

* `options` {Object} 
  * `highWaterMark` {number} The maximum [number of bytes](#stream_highwatermark_discrepancy_after_calling_readable_setencoding) to store in the internal buffer before ceasing to read from the underlying resource. **Default:** `16384` (16kb), or `16` for `objectMode` streams.
  * `encoding` {string} If specified, then buffers will be decoded to strings using the specified encoding. **Predeterminado:** `null`.
  * `objectMode` {boolean} Whether this stream should behave as a stream of objects. Meaning that [`stream.read(n)`](#stream_readable_read_size) returns a single value instead of a `Buffer` of size `n`. **Default:** `false`.
  * `read` {Function} Implementation for the [`stream._read()`](#stream_readable_read_size_1) method.
  * `destroy` {Function} Implementation for the [`stream._destroy()`](#stream_readable_destroy_err_callback) method.

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

<!-- YAML
added: v0.9.4
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17979
    description: call `_read()` only once per microtick
-->

* `size` {number} Number of bytes to read asynchronously

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Readable` class methods only.

All `Readable` stream implementations must provide an implementation of the `readable._read()` method to fetch data from the underlying resource.

When `readable._read()` is called, if data is available from the resource, the implementation should begin pushing that data into the read queue using the [`this.push(dataChunk)`](#stream_readable_push_chunk_encoding) method. `_read()` should continue reading from the resource and pushing data until `readable.push()` returns `false`. Only when `_read()` is called again after it has stopped should it resume pushing additional data onto the queue.

Once the `readable._read()` method has been called, it will not be called again until the [`readable.push()`](#stream_readable_push_chunk_encoding) method is called. `readable._read()` is guaranteed to be called only once within a synchronous execution, i.e. a microtick.

The `size` argument is advisory. For implementations where a "read" is a single operation that returns data can use the `size` argument to determine how much data to fetch. Other implementations may ignore this argument and simply provide data whenever it becomes available. There is no need to "wait" until `size` bytes are available before calling [`stream.push(chunk)`](#stream_readable_push_chunk_encoding).

The `readable._read()` method is prefixed with an underscore because it is internal to the class that defines it, and should never be called directly by user programs.

#### readable.\_destroy(err, callback)

<!-- YAML
added: v8.0.0
-->

* `err` {Error} A possible error.
* `callback` {Function} A callback function that takes an optional error argument.

The `_destroy()` method is called by [`readable.destroy()`](#stream_readable_destroy_error). It can be overridden by child classes but it **must not** be called directly.

#### readable.push(chunk[, encoding])

<!-- YAML
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->

* `chunk` {Buffer|Uint8Array|string|null|any} Chunk of data to push into the read queue. For streams not operating in object mode, `chunk` must be a string, `Buffer` or `Uint8Array`. For object mode streams, `chunk` may be any JavaScript value.
* `encoding` {string} Encoding of string chunks. Must be a valid `Buffer` encoding, such as `'utf8'` or `'ascii'`.
* Returns: {boolean} `true` if additional chunks of data may continued to be pushed; `false` otherwise.

When `chunk` is a `Buffer`, `Uint8Array` or `string`, the `chunk` of data will be added to the internal queue for users of the stream to consume. Passing `chunk` as `null` signals the end of the stream (EOF), after which no more data can be written.

When the `Readable` is operating in paused mode, the data added with `readable.push()` can be read out by calling the [`readable.read()`](#stream_readable_read_size) method when the [`'readable'`][] event is emitted.

When the `Readable` is operating in flowing mode, the data added with `readable.push()` will be delivered by emitting a `'data'` event.

The `readable.push()` method is designed to be as flexible as possible. For example, when wrapping a lower-level source that provides some form of pause/resume mechanism, and a data callback, the low-level source can be wrapped by the custom `Readable` instance as illustrated in the following example:

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

The `readable.push()` method is intended be called only by `Readable` implementers, and only from within the `readable._read()` method.

For streams not operating in object mode, if the `chunk` parameter of `readable.push()` is `undefined`, it will be treated as empty string or buffer. See [`readable.push('')`][] for more information.

#### Errors While Reading

It is recommended that errors occurring during the processing of the `readable._read()` method are emitted using the `'error'` event rather than being thrown. Throwing an `Error` from within `readable._read()` can result in unexpected and inconsistent behavior depending on whether the stream is operating in flowing or paused mode. Using the `'error'` event ensures consistent and predictable handling of errors.

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

The following is a basic example of a `Readable` stream that emits the numerals from 1 to 1,000,000 in ascending order, and then ends.

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

### Implementing a Duplex Stream

A [`Duplex`][] stream is one that implements both [`Readable`][] and [`Writable`][], such as a TCP socket connection.

Because JavaScript does not have support for multiple inheritance, the `stream.Duplex` class is extended to implement a [`Duplex`][] stream (as opposed to extending the `stream.Readable` *and* `stream.Writable` classes).

The `stream.Duplex` class prototypically inherits from `stream.Readable` and parasitically from `stream.Writable`, but `instanceof` will work properly for both base classes due to overriding [`Symbol.hasInstance`][] on `stream.Writable`.

Custom `Duplex` streams *must* call the `new stream.Duplex([options])` constructor and implement *both* the `readable._read()` and `writable._write()` methods.

#### new stream.Duplex(options)

<!-- YAML
changes:

  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14636
    description: The `readableHighWaterMark` and `writableHighWaterMark` options
                 are supported now.
-->

* `options` {Object} Passed to both `Writable` and `Readable` constructors. Also has the following fields: 
  * `allowHalfOpen` {boolean} If set to `false`, then the stream will automatically end the writable side when the readable side ends. **Default:** `true`.
  * `readableObjectMode` {boolean} Sets `objectMode` for readable side of the stream. Has no effect if `objectMode` is `true`. **Default:** `false`.
  * `writableObjectMode` {boolean} Sets `objectMode` for writable side of the stream. Has no effect if `objectMode` is `true`. **Default:** `false`.
  * `readableHighWaterMark` {number} Sets `highWaterMark` for the readable side of the stream. Has no effect if `highWaterMark` is provided.
  * `writableHighWaterMark` {number} Sets `highWaterMark` for the writable side of the stream. Has no effect if `highWaterMark` is provided.

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

#### Object Mode Duplex Streams

For `Duplex` streams, `objectMode` can be set exclusively for either the `Readable` or `Writable` side using the `readableObjectMode` and `writableObjectMode` options respectively.

In the following example, for instance, a new `Transform` stream (which is a type of [`Duplex`][] stream) is created that has an object mode `Writable` side that accepts JavaScript numbers that are converted to hexadecimal strings on the `Readable` side.

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

A [`Transform`][] stream is a [`Duplex`][] stream where the output is computed in some way from the input. Examples include [zlib](zlib.html) streams or [crypto](crypto.html) streams that compress, encrypt, or decrypt data.

There is no requirement that the output be the same size as the input, the same number of chunks, or arrive at the same time. For example, a `Hash` stream will only ever have a single chunk of output which is provided when the input is ended. A `zlib` stream will produce output that is either much smaller or much larger than its input.

The `stream.Transform` class is extended to implement a [`Transform`][] stream.

The `stream.Transform` class prototypically inherits from `stream.Duplex` and implements its own versions of the `writable._write()` and `readable._read()` methods. Custom `Transform` implementations *must* implement the [`transform._transform()`](#stream_transform_transform_chunk_encoding_callback) method and *may* also implement the [`transform._flush()`](#stream_transform_flush_callback) method.

Care must be taken when using `Transform` streams in that data written to the stream can cause the `Writable` side of the stream to become paused if the output on the `Readable` side is not consumed.

#### new stream.Transform([options])

* `options` {Object} Passed to both `Writable` and `Readable` constructors. Also has the following fields: 
  * `transform` {Function} Implementation for the [`stream._transform()`](#stream_transform_transform_chunk_encoding_callback) method.
  * `flush` {Function} Implementation for the [`stream._flush()`](#stream_transform_flush_callback) method.

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

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Readable` class methods only.

In some cases, a transform operation may need to emit an additional bit of data at the end of the stream. For example, a `zlib` compression stream will store an amount of internal state used to optimally compress the output. When the stream ends, however, that additional data needs to be flushed so that the compressed data will be complete.

Custom [`Transform`][] implementations *may* implement the `transform._flush()` method. This will be called when there is no more written data to be consumed, but before the [`'end'`][] event is emitted signaling the end of the [`Readable`][] stream.

Within the `transform._flush()` implementation, the `readable.push()` method may be called zero or more times, as appropriate. The `callback` function must be called when the flush operation is complete.

The `transform._flush()` method is prefixed with an underscore because it is internal to the class that defines it, and should never be called directly by user programs.

#### transform.\_transform(chunk, encoding, callback)

* `chunk` {Buffer|string|any} The chunk to be transformed. Will **always** be a buffer unless the `decodeStrings` option was set to `false` or the stream is operating in object mode.
* `encoding` {string} If the chunk is a string, then this is the encoding type. If chunk is a buffer, then this is the special value - 'buffer', ignore it in this case.
* `callback` {Function} A callback function (optionally with an error argument and data) to be called after the supplied `chunk` has been processed.

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Readable` class methods only.

All `Transform` stream implementations must provide a `_transform()` method to accept input and produce output. The `transform._transform()` implementation handles the bytes being written, computes an output, then passes that output off to the readable portion using the `readable.push()` method.

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

The `stream.PassThrough` class is a trivial implementation of a [`Transform`][] stream that simply passes the input bytes across to the output. Its purpose is primarily for examples and testing, but there are some use cases where `stream.PassThrough` is useful as a building block for novel sorts of streams.

## Additional Notes

<!--type=misc-->

### Compatibility with Older Node.js Versions

<!--type=misc-->

In versions of Node.js prior to v0.10, the `Readable` stream interface was simpler, but also less powerful and less useful.

* Rather than waiting for calls the [`stream.read()`](#stream_readable_read_size) method, [`'data'`][] events would begin emitting immediately. Applications that would need to perform some amount of work to decide how to handle data were required to store read data into buffers so the data would not be lost.
* The [`stream.pause()`](#stream_readable_pause) method was advisory, rather than guaranteed. This meant that it was still necessary to be prepared to receive [`'data'`][] events *even when the stream was in a paused state*.

In Node.js v0.10, the [`Readable`][] class was added. For backwards compatibility with older Node.js programs, `Readable` streams switch into "flowing mode" when a [`'data'`][] event handler is added, or when the [`stream.resume()`](#stream_readable_resume) method is called. The effect is that, even when not using the new [`stream.read()`](#stream_readable_read_size) method and [`'readable'`][] event, it is no longer necessary to worry about losing [`'data'`][] chunks.

While most applications will continue to function normally, this introduces an edge case in the following conditions:

* No [`'data'`][] event listener is added.
* The [`stream.resume()`](#stream_readable_resume) method is never called.
* The stream is not piped to any writable destination.

For example, consider the following code:

```js
// WARNING!  BROKEN!
net.createServer((socket) => {

  // we add an 'end' listener, but never consume the data
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

In addition to new `Readable` streams switching into flowing mode, pre-v0.10 style streams can be wrapped in a `Readable` class using the [`readable.wrap()`][`stream.wrap()`] method.

### `readable.read(0)`

There are some cases where it is necessary to trigger a refresh of the underlying readable stream mechanisms, without actually consuming any data. In such cases, it is possible to call `readable.read(0)`, which will always return `null`.

If the internal read buffer is below the `highWaterMark`, and the stream is not currently reading, then calling `stream.read(0)` will trigger a low-level [`stream._read()`](#stream_readable_read_size_1) call.

While most applications will almost never need to do this, there are situations within Node.js where this is done, particularly in the `Readable` stream class internals.

### `readable.push('')`

Use of `readable.push('')` is not recommended.

Pushing a zero-byte string, `Buffer` or `Uint8Array` to a stream that is not in object mode has an interesting side effect. Because it *is* a call to [`readable.push()`](#stream_readable_push_chunk_encoding), the call will end the reading process. However, because the argument is an empty string, no data is added to the readable buffer so there is nothing for a user to consume.

### `highWaterMark` discrepancy after calling `readable.setEncoding()`

The use of `readable.setEncoding()` will change the behavior of how the `highWaterMark` operates in non-object mode.

Typically, the size of the current buffer is measured against the `highWaterMark` in *bytes*. However, after `setEncoding()` is called, the comparison function will begin to measure the buffer's size in *characters*.

This is not a problem in common cases with `latin1` or `ascii`. But it is advised to be mindful about this behavior when working with strings that could contain multi-byte characters.