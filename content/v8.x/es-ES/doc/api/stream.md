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

* [Legible](#stream_class_stream_readable) - streams desde los cuales los datos se pueden leer (por ejemplo [`fs.createReadStream()`][]).
* [Escribible](#stream_class_stream_writable) - streams en los que se pueden escribir datos (por ejemplo [`fs.createWriteStream()`][]).
* [Dúplex](#stream_class_stream_duplex) - streams que son tanto Legibles como Escribibles (por ejemplo [`net.Socket`][]).
* [Transformador](#stream_class_stream_transform) - strems Dúplex que pueden modificar o transformar los datos mientras se escriben y leen (por ejemplo [`zlib.createDeflate()`][]).

### Modo Objeto

Todos los streams que son creados por las APIs de Node.js operan exclusivamente en objetos strings y objetos `Buffer` (o `Uint8Array`). Si es posible, sin embargo, para implementaciones stream, trabajar con otros tipos de valores de JavaScript (con la excepción de `null`, que sirve un propósito especial con los streams). Tales streams son considerados para operar en "modo objeto".

Las instancias de stream se cambian al modo objeto utilizando la opción `objectMode` cuando se crea el stream. Intentar cambiar un stream existente al modo objeto, no es seguro.

### Almacenamiento en Buffer

<!--type=misc-->

Tanto los streams [Escribibles](#stream_class_stream_writable) como [Legibles](#stream_class_stream_readable) almacenarán datos en un buffer interno, que puede ser recuperado utilizando `writable._writableState.getBuffer()` o `readable._readableState.buffer`, respectivamente.

La cantidad de datos almacenados potencialmente en buffer depende de la opción `highWaterMark` que se pasa al constructor de streams. Para streams normales, la opción `highWaterMark` especifica un [número total de bytes](#stream_highwatermark_discrepancy_after_calling_readable_setencoding). Para los streams que operan en modo objeto, `highWaterMark` especifica un número total de objetos.

Los datos son almacenados en Buffer en los streams Legibles cuando la implementación llama a [`stream.push(chunk)`](#stream_readable_push_chunk_encoding). Si el consumidor del Stream no llama a [`stream.read()`](#stream_readable_read_size), los datos se quedarán en la cola interna hasta que se consumen.

Una vez que el tamaño total del buffer de lectura interno alcanza el límite especificado por `highWaterMark`, el stream parará temporalmente de leer los datos desde el recurso subyacente, hasta que los datos almacenados en buffer actualmente se puedan consumir (es decir, el stream parará de llamar al método `readable._read()` interno que se utiliza para llenar el buffer de lectura).

Los datos se almacenan en buffer en streams Escribibles cuando el método [`writable.write(chunk)`](#stream_writable_write_chunk_encoding_callback) se llama repetidamente. Mientras el tamaño total del buffer de escritura interno sea inferior al límite establecido por `highWaterMark`, las llamadas a `writable.write()` devolverán `true`. Una vez el tamaño del buffer interno alcanza o excede el `highWaterMark`, se devolverá `false`.

Un objetivo clave de la API de `stream`, particularmente del método [`stream.pipe()`], es limitar el almacenamiento de datos en buffer a niveles aceptables, tales que las fuentes y destinatarios de diferentes velocidades no agoten la memoria disponible.

Debido a que los streams [Dúplex](#stream_class_stream_duplex) y [Transformador](#stream_class_stream_transform) son tanto Legibles como Escribibles, cada uno mantiene *dos* buffers internos separados utilizados para leer y escribir, lo que permite a cada lado operar independientemente del otro, mientras mantiene un apropiado y eficiente flujo de datos. For example, [`net.Socket`][] instances are [Duplex](#stream_class_stream_duplex) streams whose Readable side allows consumption of data received *from* the socket and whose Writable side allows writing data *to* the socket. Debido a que los datos se pueden escribir en el socket a una velocidad más rápida o más lenta que la de los datos recibidos, es importante para cada lado (y para el buffer) operar independientemente del otro.

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
// objeto
// $ curl localhost:1337 -d "\"foo\""
// string
// $ curl localhost:1337 -d "not json"
// error: Token o inesperado en JSON en la posición 1
```

Los streams [Escribibles](#stream_class_stream_writable) (como `res` en el ejemplo) exponen métodos como `write()` y `end()` que se utilizan para escribir datos en el stream.

Los streams [Legibles](#stream_class_stream_readable) utilizan la API [`EventEmitter`][] para notificar al código de la aplicación cuando los datos estén disponibles para leerse fuera del stream. Esos datos disponibles pueden leerse del stream de múltiples maneras.

Tanto los streams [Escribibles](#stream_class_stream_writable) como los [Legibles](#stream_class_stream_readable) utilizan la API [`EventEmitter`][] de varias maneras para comunicar el estado actual del stream.

Los streams [Dúplex](#stream_class_stream_duplex) y [Transformadores](#stream_class_stream_transform) son tanto [Escribibles](#stream_class_stream_writable) como [Legibles](#stream_class_stream_readable).

Las aplicaciones que escriben o consumen datos de un stream no requieren implementar interfaces de stream directamente y, por lo general, no tendrán razones para llamar a `require('stream')`.

Los desarrolladores que deseen implementar nuevos tipos de streams deben consultar la sección [API para Implementadores de Stream](#stream_api_for_stream_implementers).

### Streams Escribibles

Los streams escribibles son una abstracción para un *destino* al que se le han escrito datos.

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

##### Evento: 'close'
<!-- YAML
added: v0.9.4
-->

El evento `'close'` es emitido cuando el stream y cualquiera de sus recursos subyacentes (por ejemplo, un descriptor de archivos) han sido cerrados. El evento indica que no se emitirán más eventos, y no se producirá ninguna computación adicional.

No todos los streams Escribibles emitirán el evento `'close'`.

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

*Nota*: El stream no está cerrado cuando se emite el evento de `'error'`.

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

El evento de `'unpipe'` se emite cuando el método [`stream.unpipe()`][] se llama en un stream [Legible](#stream_class_stream_readable), eliminando este [Escribible](#stream_class_stream_writable) de su conjunto de destinos.

This is also emitted in case this [Writable](#stream_class_stream_writable) stream emits an error when a [Readable](#stream_class_stream_readable) stream pipes into it.

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

##### writable.end(\[chunk\]\[, encoding\][, callback])
<!-- YAML
added: v0.9.4
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->

* `chunk` {string|Buffer|Uint8Array|any} Datos opcionales para escribir. Para streams que no operen en modo objeto, `chunk` debe ser un string, un `Buffer`o un `Uint8Array`. Para los streams en modo objeto, `chunk` puede ser cualquier valor de JavaScript, menos `null`.
* `encoding` {string} La codificación si `chunk` es un string
* `callback` {Function} Callback opcional para cuando el stream se finalice

Llamar al método `writable.end()` señala que no se escribirán más datos en el [Escribible](#stream_class_stream_writable). Los argumentos `chunk` y `encoding` opcionales permiten un último fragmento de datos adicional para ser escrito inmediatamente antes de cerrar el stream. Si es proporcionado, la función `callback` opcional es adjuntada como un listener para el evento [`'finish'`][].

Llamar el método [`stream.write()`](#stream_writable_write_chunk_encoding_callback) después de llamar a [`stream.end()`](#stream_writable_end_chunk_encoding_callback) va a provocar un error.

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
* Devuelve: {this}

El método `writable.setDefaultEncoding()` establece el `encoding` predeterminado para un stream [Escribible](#stream_class_stream_writable).

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

Devuelve el valor del `highWaterMark` pasado al construir este `Writable`.

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
* `callback` {Function} Callback para cuando esta pieza de datos se vacíe
* Devuelve: {boolean} `false` si el stream desea que el código de llamada espere a que se emita el evento de `'drain'` antes de continuar escribiendo datos adicionales; de lo contrarió es `true`.

El método `writable.write()` escribe algunos datos al stream, y llama al `callback` suministrado una vez que los datos han sido manejados completamente. Si ocurre un error, el `callback` *puede o no* ser llamado con el error como su primer argumento. Para detectar errores de escritura de manera fiable, añade un listener para el evento `'error'`.

El valor devuelto es `true` si el búfer interno es menor que el `highWaterMark` configurado cuando el stream fue creado después de admitir a `chunk`. Si es devuelto `false`, los siguientes intentos de escribir datos en el stream deberían detenerse hasta que el evento [`'drain'`][] es emitido.

Mientras que un stream no esté draining, llamadas a `write()` almacenaran `chunk`, y devolverán false. Una vez que todos los fragmentos almacenados son vaciados (aceptado para entrega por el sistema operativo), el evento `'drain'` será emitido. Se recomienda que una vez que write() devuelva “false”, no se escriban más piezas hasta que se emita el evento de `'drain'`. Mientras se llame `write()` en un stream donde el vaciado no está permitido, Node.js va a almacenar todos los fragmentos escritos hasta que el uso máximo de la memoria ocurra, en ese punto se anulará incondicionalmente. Incluso antes de que se anule, alto uso de la memoria causará un pobre desempeño del colector de basura, y un RSS alto (que no es típicamente liberado de vuelta al sistema, incluso después que la memoria ya no es requerida). Dado que los sockets TCP no pueden ser drenados si el peer remoto no lee los datos, escribir un socket que no se está vaciando puede llevar a vulnerabilidad explotable remota.

Writing data while the stream is not draining is particularly problematic for a [Transform](#stream_class_stream_transform), because the `Transform` streams are paused by default until they are piped or an `'data'` or `'readable'` event handler is added.

If the data to be written can be generated or fetched on demand, it is recommended to encapsulate the logic into a [Readable](#stream_class_stream_readable) and use [`stream.pipe()`][]. Sin embargo, si se prefiere llamar a `write()`, es posible respetar la contrapresión y evitar problemas de memoria usando el evento [`'drain'`][]:

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
  console.log('write completed, do more writes now');
});
```

Un stream Writable en modo objeto siempre ignorará el argumento `encoding`.

##### writable.destroy([error])
<!-- YAML
added: v8.0.0
-->

* Devuelve: {this}

Destroy the stream, and emit the passed error. After this call, the writable stream has ended. Implementors should not override this method, but instead implement [`writable._destroy`](#stream_writable_destroy_err_callback).

### Streams Legibles

Los streams legibles son una abstracción para un *source* donde los datos son consumidos.

Los ejemplos de streams Legibles incluyen:

* [Respuestas HTTP, en el cliente](http.html#http_class_http_incomingmessage)
* [Solicitud HTTP, en el servidor](http.html#http_class_http_incomingmessage)
* [streams read fs](fs.html#fs_class_fs_readstream)
* [streams zlib](zlib.html)
* [streams crypto](crypto.html)
* [sockets TCP](net.html#net_class_net_socket)
* [procesos secundarios stdout y stderr](child_process.html#child_process_subprocess_stdout)
* [`process.stdin`][]

Todos los streams [Legibles](#stream_class_stream_readable) implementan la interfaz definida por la clase `stream.Readable`.

#### Dos Modos

Los streams Legibles operan efectivamente en uno de dos modos: fluido y pausado.

Cuando sea el modo fluido, los datos son leídos del sistema subyacente automáticamente, y son proporcionados a una aplicación tan pronto como sea posible usando eventos a través de la interfaz [`EventEmitter`][].

En el modo pausado, el método [`stream.read()`](#stream_readable_read_size) debe ser llamado para leer explícitamente fragmentos de datos del stream.

Todos los streams [Legibles](#stream_class_stream_readable) comienzan en el modo pausado, pero pueden cambiarse al modo fluido de una de las siguientes maneras:

* Añadiendo un manejador de eventos [`'data'`][].
* Llamar al método [`stream.resume()`](#stream_readable_resume).
* Llamar al método de [`stream.pipe()`][] para enviar los datos a un [Escribible](#stream_class_stream_writable).

El Legible puede volver a cambiar al modo pausado utilizando uno de los siguientes:

* Si no existen destinos pipe, al llamar al método [`stream.pause()`](#stream_readable_pause).
* Si existen destinos pipe, al remover todos los destinos pipe. Múltiples destinos pipe pueden ser eliminados al llamar el método [`stream.unpipe()`][].

El concepto importante a recordar es que un Legible no generará datos hasta que se proporcione un mecanismo para consumir o ignorar esos datos. Si el mecanismo de consumo se desactiva o se retira, el Legible *intentará* detener la generación de los datos.

*Note*: For backwards compatibility reasons, removing [`'data'`][] event handlers will **not** automatically pause the stream. Also, if there are piped destinations, then calling [`stream.pause()`](#stream_readable_pause) will not guarantee that the stream will *remain* paused once those destinations drain and ask for more data.

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

La API del stream Legible ha evolucionado a través de varias versiones de Node.js y proporciona múltiples métodos para consumir datos de stream. In general, developers should choose *one* of the methods of consuming data and *should never* use multiple methods to consume data from a single stream.

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

No todos los streams [Legibles](#stream_class_stream_readable) emitirán el evento `'close'`.

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

##### Evento: 'error'
<!-- YAML
added: v0.9.4
-->

* {Error}

El evento `'error'` puede emitirse por una implementación del Legible en cualquier momento. De forma general, esto puede ocurrir si el stream subyacente no es capaz de generar datos debido a una falla interna subyacente, o cuando una implementación del stream intenta empujar un fragmento de datos inválido.

El callback del listener aprobará un solo objeto `Error`.

##### Evento: 'readable'
<!-- YAML
added: v0.9.4
-->

El evento `'readable'` es emitido cuando hay datos disponibles para ser leídos del stream. En algunos casos, adjuntar un listener para el evento `'readable'` va a causar que cierta cantidad de datos sean leídos en un búfer interno.

```javascript
const readable = getReadableStreamSomehow();
readable.on('readable', () => {
  // hay algunos datos para leer ahora
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

*Nota*: En general, los mecanismos de evento de `readable.pipe()` y de `'data'` son más fáciles de entender que el evento `'readable'`. Sin embargo, el manejo de `'readable'` podría resultar en un aumento del rendimiento.

##### readable.isPaused()
<!-- YAML
added: v0.11.14
-->

* Devuelve: {boolean}

El método `readable.isPaused()` devuelve el estado operativo actual del Legible. Esto es usado principalmente por el mecanismo que vuelve subyacente el método `readable.pipe()`. En la mayoría de los casos típicos, no existirá razón para usar este método directamente.

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
* `options` {Object} Pipe options
  * `end` {boolean} Finaliza el escritor cuando el lector termina. **Predeterminado:** `true`.

El método `readable.pipe()` adjunta un stream [Escribible](#stream_class_stream_writable) al `readable`, ocasionando el cambio automático al modo fluido y el envío de todos sus datos al [Escribible](#stream_class_stream_writable) adjunto. El flujo de datos se gestionará automáticamente para que el stream Escribible de destino no se vea sobrecargado por un stream Legible más rápido.

El siguiente ejemplo hace pipe en todos los datos del `readable` a un archivo llamado `file.txt`:

```js
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// Todos los datos del legible van al 'file.txt'
readable.pipe(writable);
```
Es posible adjuntar múltiples streams Escribibles en un solo stream Legible.

El método `readable.pipe()` puede devolver una referencia al stream *destination*, haciendo posible establecer cadenas de streams piped:

```js
const r = fs.createReadStream('file.txt');
const z = zlib.createGzip();
const w = fs.createWriteStream('file.txt.gz');
r.pipe(z).pipe(w);
```

Por defecto, [`stream.end()`](#stream_writable_end_chunk_encoding_callback) se llama en el stream Escribible de destino cuando el stream Legible de origen emite [`'end'`][], así que el destino ya no es escribible. Para desactivar este comportamiento predeterminado, la opción `end` puede ser pasada como `false`, causando que el stream de destino permanezca abierto, como se ilustra en el siguiente ejemplo:

```js
reader.pipe(writer, { end: false });
reader.on('end', () => {
  writer.end('Goodbye\n');
});
```

Una advertencia importante es que si el stream Legible emite un error durante el procesamiento, el destino del Escribible *no se cierra* automáticamente. Si ocurre un error, será necesario de cerrar *manually* cada stream en orden, para prevenir fugas de memoria.

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

* `size` {number} Argumento opcional para especificar cuántos datos se van a leer.
* Devuelve: {string|Buffer|null}

El método `readable.read()` sustrae algunos datos del búfer interno y los devuelve. Si no hay datos disponibles para leer, se devuelve `null`. De manera predeterminada, los datos se devolverán como un objeto `Buffer`, a menos de que una codificación haya sido especificada usando el método `readable.setEncoding()`, o que el stream esté operando en modo objeto.

El argumento `size` opcional especifica un número de bytes para leer. Si el `size` de los bytes no están disponibles para ser leídos, `null` será devuelto *a menos que* el stream haya terminado, en tal caso todos los datos restantes en el búfer interno serán devueltos.

Si el `size` del argumento no es especificado, todos los datos que están en el búfer interno serán devueltos.

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

A Readable stream in object mode will always return a single item from a call to [`readable.read(size)`](#stream_readable_read_size), regardless of the value of the `size` argument.

*Note*: If the `readable.read()` method returns a chunk of data, a `'data'` event will also be emitted.

*Note*: Calling [`stream.read([size])`](#stream_readable_read_size) after the [`'end'`][] event has been emitted will return `null`. No se levantará ningún error runtime.

##### readable.resume()
<!-- YAML
added: v0.9.4
-->

* Devuelve: {this}

The `readable.resume()` method causes an explicitly paused Readable stream to resume emitting [`'data'`][] events, switching the stream into flowing mode.

El método `readable.resume()` puede ser usado para consumir completamente los datos de un stream sin procesar ningunos de esos datos como es ilustrado en el siguiente ejemplo:

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

* `encoding` {string} La codificación a usar.
* Devuelve: {this}

The `readable.setEncoding()` method sets the character encoding for data read from the Readable stream.

De manera predeterminada, no se asigna ninguna codificación y los datos del stream se van a devolver como objetos `Buffer`. Establecer una codificación causa que los datos del stream sean devueltos como strings de la codificación especificada en vez de un objeto `Buffer`. Por ejemplo, llamar a `readable.setEncoding('utf8')` causará que la salida de datos sea interpretada como datos UTF.8, y sean pasados como strings. Llamar a `readable.setEncoding('hex')` causará que los datos sean codificados en un formato string hexadecimal.

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

* `destination` {stream.Writable} Stream específico opcional para no hacer pipe

The `readable.unpipe()` method detaches a Writable stream previously attached using the [`stream.pipe()`][] method.

Si el `destination` no es especificado, entonces *todos* los pipes son separados.

Si el `destination` es especificado, pero no se configura ningún pipe para él. entonces el método no hace nada.

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

* `chunk` {Buffer|Uint8Array|string|any} Fragmento de datos para hacer unshift en la cola de lectura. Para streams que no operen en modo objeto, `chunk` debe ser un string, un `Buffer` o un `Uint8Array`. Para streams en modo objeto, `chunk` puede ser cualquier valor de JavaScript, menos `null`.

El método `readable.unshift()` empuja un fragmento de datos de vuelta al búfer interno. Esto es útil en ciertas situaciones, cuando un stream está siendo consumido por código que necesita "no-consumir" alguna cantidad de datos que ha sido sacada de forma optimista de la fuente, para que los datos puedan ser pasados a otra parte.

*Note*: The `stream.unshift(chunk)` method cannot be called after the [`'end'`][] event has been emitted or a runtime error will be thrown.

Developers using `stream.unshift()` often should consider switching to use of a [Transform](#stream_class_stream_transform) stream instead. Vea la sección [API para los Implementadores de Stream](#stream_api_for_stream_implementers) para más información.

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
        callback(null, encabezado, stream);
      } else {
        // aún está leyendo el encabezado.
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

* `stream` {Stream} Un stream legible de "viejo estilo"

Versiones anteriores de v0.10 de Node.js tenían streams que no implementaban la API del módulo `stream` como está definido actualmente. (Vea [Compatibility](#stream_compatibility_with_older_node_js_versions) para más información.)

When using an older Node.js library that emits [`'data'`][] events and has a [`stream.pause()`](#stream_readable_pause) method that is advisory only, the `readable.wrap()` method can be used to create a [Readable](#stream_class_stream_readable) stream that uses the old stream as its data source.

Rara vez será necesario usar `readable.wrap()` pero el método ha sido proporcionado como una conveniencia para interactuar con aplicaciones y bibliotecas más viejas.

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

Destruye el stream, luego emite `'error'`. After this call, the readable stream will release any internal resources. Implementors should not override this method, but instead implement [`readable._destroy`](#stream_readable_destroy_err_callback).

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

Duplex streams are streams that implement both the [Readable](#stream_class_stream_readable) and [Writable](#stream_class_stream_writable) interfaces.

Examples of Duplex streams include:

* [sockets TCP](net.html#net_class_net_socket)
* [streams zlib](zlib.html)
* [streams crypto](crypto.html)

#### Clase: stream.Transform
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

Destruye el stream, luego emite `'error'`. Después de esta llamada, el stream de transformación liberaría cualquier recurso interno. implementors should not override this method, but instead implement [`readable._destroy`](#stream_readable_destroy_err_callback). The default implementation of `_destroy` for `Transform` also emit `'close'`.

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
      <p>[Readable](#stream_class_stream_readable)</p>
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
      <p>[Writable](#stream_class_stream_writable)</p>
    </td>
    <td>
      <p><code>[_write][stream-_write]</code>, <code>[_writev][stream-_writev]</code>,
      <code>[_final][stream-_final]</code></p>
    </td>
  </tr>
  <tr>
    <td>
      <p>Lectura y escritura</p>
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
      <p>Opera en datos escritos, luego lee el resultado</p>
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

### Construcción Simplificada
<!-- YAML
added: v1.2.0
-->

Para muchos casos simples, es imposible construir un stream sin depender de la herencia. Esto puede ser logrado al crear instancias directamente de los objetos `stream.Writable`, `stream.Readable`, `stream.Duplex` o `stream.Transform` y pasar métodos apropiados como opciones de constructor.

Por ejemplo:

```js
const { Writable } = require('stream');

const myWritable = new Writable({
  write(chunk, encoding, callback) {
    // ...
  }
});
```

### Implementando un Stream Writable

The `stream.Writable` class is extended to implement a [Writable](#stream_class_stream_writable) stream.

Custom Writable streams *must* call the `new stream.Writable([options])` constructor and implement the `writable._write()` method. The `writable._writev()` method *may* also be implemented.

#### Constructor: new stream.Writable([options])

* `opciones` {Object}
  * `highWaterMark` {number} Nivel del búfer cuando [`stream.write()`](#stream_writable_write_chunk_encoding_callback) empieza a devolver `false`. **Predeterminado:** `16384` (16kb), o `16` para streams `objectMode`.
  * `decodeStrings` {boolean} Whether or not to decode strings into Buffers before passing them to [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1). **Predeterminado:** `true`.
  * `objectMode` {boolean} Ya sea [`stream.write(anyObj)`](#stream_writable_write_chunk_encoding_callback) una operación válida o no. Cuando es establecido, se hace posible escribir otros valores de JavaScript aparte de string, `Buffer` o `Uint8Array` si lo soporta la implementación del stream. **Predeterminado:** `false`.
  * `write` {Function} Implementación para el método [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1).
  * `writev` {Function} Implementación para el método [`stream._writev()`](#stream_writable_writev_chunks_callback).
  * `destroy` {Function} Implementación para el método [`stream._destroy()`](#stream_writable_destroy_err_callback).
  * `final` {Function} Implementación para el método [`stream._final()`](#stream_writable_final_callback).

For example:

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

* `chunk` {Buffer|string|any} El fragmento a ser escrito. **Siempre** será un búfer a menos que la opción `decodeStrings` sea establecida como `false`, o que el stream esté operando en modo objeto.
* `encoding` {string} Si el fragmento es un string, entonces `encoding` es el codificador de carácter de ese string. Si el fragmento es un `Buffer`, o si el stream está operando en modo objeto, `encoding` pudiera ser ignorado.
* `callback` {Function} Llama esta función (opcionalmente con un argumento error) cuando el procesamiento es completado para el fragmento suministrado.

All Writable stream implementations must provide a [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1) method to send data to the underlying resource.

*Note*: [Transform](#stream_class_stream_transform) streams provide their own implementation of the [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1).

*Note*: This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal Writable class methods only.

El método `callback` debe ser llamado para señalar que la escritura se terminó con éxito o falló con un error. El primer argumento pasado al `callback` debe ser el objeto `Error` si la llamada falla, o `null` si la escritura tuvo éxito.

Todas las llamadas a `writable.write()` que ocurren en el tiempo que `writable._write()` es llamado y el `callback` es llamado causará que los datos escritos sean almacenados en el búfer. Cuando el `callback` es invocado, el stream pudiera emitir un evento [`'drain'`][]. Si una implementación de stream es capaz de procesar múltiples fragmentos de datas al mismo tiempo, el método `writable._writev()` debería ser implementado.

If the `decodeStrings` property is set in the constructor options, then `chunk` may be a string rather than a Buffer, and `encoding` will indicate the character encoding of the string. This is to support implementations that have an optimized handling for certain string data encodings. If the `decodeStrings` property is explicitly set to `false`, the `encoding` argument can be safely ignored, and `chunk` will remain the same object that is passed to `.write()`.

El método `writable._write()` es ajustado con un subrayado porque es interno a la clase que lo define, y no debería ser llamado directamente por programas de usuario.

#### writable.\_writev(chunks, callback)

* `chunks` {Array} The chunks to be written. Cada fragmento tiene el siguiente formato: `{ chunk: ..., encoding: ... }`.
* `callback` {Function} Una función callback (opcionalmente con un argumento error) para ser invocada cuando el procesamiento de los fragmentos suministrados es completado.

*Note*: This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal Writable class methods only.

El método `writable._writev()` puede ser implementado en conjunto con `writable._write()` en las implementaciones del steam que son capaces de procesar al mismo tiempo múltiples fragmentos de datos. Si es implementado, el método será llamado con todos los fragmentos de datos que están siendo almacenados en la cola de escritura.

El método `writable._writev()` es ajustado con un subrayado porque es interno a la clase que lo define, y no debería ser llamado directamente por programas de usuario.

#### writable.\_destroy(err, callback)
<!-- YAML
added: v8.0.0
-->

* `err` {Error} Un posible error.
* `callback` {Function} Una función callback que toma un argumento error opcional.

El método `_destroy()` es llamado por [`writable.destroy()`](#stream_writable_destroy_error). Puede ser sobrescrito por clases secundarias pero **no debe** ser llamado directamente.

#### writable.\_final(callback)
<!-- YAML
added: v8.0.0
-->

* `callback` {Function} Llama esta función (opcionalmente con un argumento error) cuando terminó de escribir los datos restantes.

El método `_final()` **no debe** ser llamado directamente. Puede ser implementado por clases secundarias, y si se hace, será llamado solamente por métodos de clase Writable internos.

This optional function will be called before the stream closes, delaying the `finish` event until `callback` is called. Esto es útil para cerrar recursos o escribir datos almacenados antes de que un stream termine.

#### Errores al Escribir

Es recomendado que ocurran errores durante el procesamiento de los métodos `writable._write()` y `writable._writev()` sean reportados al invocar el callback y pasar el error como el primer argumento. This will cause an `'error'` event to be emitted by the Writable. Arrojar un Error desde dentro del `writable._write()` puede resultar en un comportamiento inesperado e inconsistente dependiendo de cómo se está usando el stream. Usar la callback asegura el manejo de errores consistente y predecible.

If a Readable stream pipes into a Writable stream when Writable emits an error, the Readable stream will be unpiped.

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

Lo siguiente muestra una implementación de stream Writable personalizada algo simplista (y un poco inútil). While this specific Writable stream instance is not of any real particular usefulness, the example illustrates each of the required elements of a custom [Writable](#stream_class_stream_writable) stream instance:

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

#### Decodificación de Búferes en un Stream Escribible

La decodificación de búferes es una tarea común, por ejemplo, cuando se use tranformadores cuya entrada es un string. No es un proceso trivial cuando se use codificación de caracteres multi-byte, tal como UTF-8. The following example shows how to decode multi-byte strings using `StringDecoder` and [Writable](#stream_class_stream_writable).

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

### Implementando un Stream Legible

The `stream.Readable` class is extended to implement a [Readable](#stream_class_stream_readable) stream.

Custom Readable streams *must* call the `new stream.Readable([options])` constructor and implement the `readable._read()` method.

#### new stream.Readable([options])

* `opciones` {Object}
  * `highWaterMark` {number} El máximo [número de bytes](#stream_highwatermark_discrepancy_after_calling_readable_setencoding) para almacenar en el búfer interno antes de cesar la lectura desde el recurso subyacente. **Default:** `16384` (16kb), or `16` for `objectMode` streams.
  * `encoding` {string} Si es especificado, los búferes van a ser decodificados a strings usando la codificación especificada. **Predeterminado:** `null`.
  * `objectMode` {boolean} Si este stream debería comportarse como un stream de objetos, o no. Meaning that [`stream.read(n)`](#stream_readable_read_size) returns a single value instead of a Buffer of size n. **Predeterminado:** `false`.
  * `read` {Function} Implementación para el método [`stream._read()`](#stream_readable_read_size_1).
  * `destroy` {Function} Implementation for the [`stream._destroy()`](#stream_readable_destroy_err_callback) method.

Por ejemplo:

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

O se use el enfoque del Constructor Simplificado:

```js
const { Readable } = require('stream');

const myReadable = new Readable({
  read(size) {
    // ...
  }
});
```

#### readable.\_read(size)

* `size` {number} Números de bytes para ser leídos asincrónicamente

*Note*: This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal Readable class methods only.

Todas las implementaciones de stream Readable deben proporcionar una implementación del método `readable._read()` para recoger datos del recurso subyacente.

Cuando `readable._read()` es llamado, si hay datos disponibles de la fuente, la implementación debería comenzar a enviar esos datos a dentro de la cola de lectura usando el método [`this.push(dataChunk)`](#stream_readable_push_chunk_encoding). `_read()` debería continuar leyendo del recurso y enviar datos hasta que `readable.push()` devuelva `false`. Solo cuando `_read()` es llamado otra vez después que se ha detenido debería continuar el envío de datos adicionales a la cola.

*Note*: Once the `readable._read()` method has been called, it will not be called again until the [`readable.push()`](#stream_readable_push_chunk_encoding) method is called.

El argumento `size` es consultivo. Para implementaciones donde un "read" es una sola operación que devuelve datos, puede usar el argumento `size` para determinar cuántos datos recoger. Otras implementaciones pudieran ignorar este argumento y simplemente proporcionar los datos cuando estén disponibles. No hay que "esperar" hasta que los bytes de `size` estén disponibles antes de llamar a [`stream.push(chunk)`](#stream_readable_push_chunk_encoding).

El método `readable._read()` es ajustado con un subrayado porque es interno a la clase que lo define, y no debería ser llamado directamente por programas de usuario.

#### readable.\_destroy(err, callback)
<!-- YAML
added: v8.0.0
-->

* `err` {Error} Un posible error.
* `callback` {Function} Una función callback que toma un argumento error opcional.

El método `_destroy()` es llamado por [`readable.destroy()`](#stream_readable_destroy_error). Puede ser sobrescrito por clases secundarias pero **no debe** ser llamado directamente.

#### readable.push(chunk[, encoding])
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->

* `chunk` {Buffer|Uint8Array|string|null|any} Fragmento de datos a ser empujados en la cola de lectura. Para streams que no operen en modo objeto, `chunk` debe ser un string, un `Buffer` o un `Uint8Array`. Para streams en modo objeto, `chunk` puede ser cualquier valor JavaScript.
* `encoding` {string} Codificación de los fragmentos string. Debe ser una codificación Buffer, tales como `'utf8'` o `'ascii'`
* Devuelve: {boolean} `true` si fragmentos de datos adicionales pueden seguir siendo empujados; de otra manera `false`.

Cuando `chunk` es un `Buffer`, `Uint8Array` o un `string`, el `chunk` de datos será añadido a la cola interna para los usuarios del stream a consumir. Pasar `chunk` como `null` señala el final del stream (EOF), después que no se pueden escribir más datos.

When the Readable is operating in paused mode, the data added with `readable.push()` can be read out by calling the [`readable.read()`](#stream_readable_read_size) method when the [`'readable'`][] event is emitted.

Cuando Readable está operando en modo fluido, los datos añadidos con `readable.push()`serán entregados al emitir un evento `'data'`.

El método `readable.push()` está diseñado para ser tan flexible como sea posible. For example, when wrapping a lower-level source that provides some form of pause/resume mechanism, and a data callback, the low-level source can be wrapped by the custom Readable instance as illustrated in the following example:

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
*Note*: The `readable.push()` method is intended be called only by Readable Implementers, and only from within the `readable._read()` method.

Para streams que no estén operando en modo objeto, si el parámetro `chunk` de `readable.push()` es `undefined`, será tratado como un string vacío o un búfer. Vea [`readable.push('')`][] para más información.

#### Errores al Escribir

Es recomendado que los errores que ocurran durante el procesamiento del método `readable._read()` sean emitidos usando el evento `'error'` en vez de ser arrojados. Throwing an Error from within `readable._read()` can result in unexpected and inconsistent behavior depending on whether the stream is operating in flowing or paused mode. Usar el evento `'error'` asegura el manejo de errores consistente y predecible.
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

#### Un Ejemplo de Conteo de Stream<!--type=example-->El siguiente es un ejemplo básico de un stream Readable que emite los numerales de 1 a 1,000,000 en orden ascendente y luego termina.

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

### Implementando un Stream Dúplex

A [Duplex](#stream_class_stream_duplex) stream is one that implements both [Readable](#stream_class_stream_readable) and [Writable](#stream_class_stream_writable), such as a TCP socket connection.

Because JavaScript does not have support for multiple inheritance, the `stream.Duplex` class is extended to implement a [Duplex](#stream_class_stream_duplex) stream (as opposed to extending the `stream.Readable` *and* `stream.Writable` classes).

*Note*: The `stream.Duplex` class prototypically inherits from `stream.Readable` and parasitically from `stream.Writable`, but `instanceof` will work properly for both base classes due to overriding [`Symbol.hasInstance`][] on `stream.Writable`.

Custom Duplex streams *must* call the `new stream.Duplex([options])` constructor and implement *both* the `readable._read()` and `writable._write()` methods.

#### new stream.Duplex(options)<!-- YAML
changes:
  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14636
    description: The `readableHighWaterMark` and `writableHighWaterMark` options
                 are supported now.
-->* `options` {Object} Passed to both Writable and Readable constructors. También tiene los siguientes campos:
  * `allowHalfOpen` {boolean} Si se establece como `false`, entonces el stream va a terminar el lado escribible automáticamente cuando el lado legible termine. **Predeterminado:** `true`.
  * `readableObjectMode` {boolean} Establece `objectMode` para el lado legible del stream. No tiene efecto si `objectMode` es `true`. **Predeterminado:** `false`.
  * `writableObjectMode` {boolean} Establece `objectMode` para el lado escribible del stream. No tiene efecto si `objectMode` es `true`. **Predeterminado:** `false`.
  * `readableHighWaterMark` {number} Establece `highWaterMark` para el lado legible del stream. No tiene efecto si se proporciona `highWaterMark`.
  * `writableHighWaterMark` {number} Establece `highWaterMark` para el lado escribible del stream. No tiene efecto si se proporciona `highWaterMark`.

For example:

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

Lo siguiente muestra un ejemplo simple de un stream Duplex que envuelve un objeto fuente de bajo-nivel hipotético donde se pueden escribir datos, y de donde esos datos pueden ser leídos, aunque usando un API que no es compatible con streams Node.js. The following illustrates a simple example of a Duplex stream that buffers incoming written data via the [Writable](#stream_class_stream_writable) interface that is read back out via the [Readable](#stream_class_stream_readable) interface.

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

#### Modo Objeto de Streams Dúplex

For Duplex streams, `objectMode` can be set exclusively for either the Readable or Writable side using the `readableObjectMode` and `writableObjectMode` options respectively.

In the following example, for instance, a new Transform stream (which is a type of [Duplex](#stream_class_stream_duplex) stream) is created that has an object mode Writable side that accepts JavaScript numbers that are converted to hexadecimal strings on the Readable side.

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

A [Transform](#stream_class_stream_transform) stream is a [Duplex](#stream_class_stream_duplex) stream where the output is computed in some way from the input. Los ejemplos incluyen streams [zlib](zlib.html) o streams [crypto](crypto.html) que comprimen, encriptan o descifran los datos.

*Note*: There is no requirement that the output be the same size as the input, the same number of chunks, or arrive at the same time. For example, a Hash stream will only ever have a single chunk of output which is provided when the input is ended. A `zlib` stream will produce output that is either much smaller or much larger than its input.

The `stream.Transform` class is extended to implement a [Transform](#stream_class_stream_transform) stream.

La clase `stream.Transform` hereda prototípicamente de `stream.Duplex` e implementa su propia versión de los métodos `writable._write()` y `readable._read()`. Custom Transform implementations *must* implement the [`transform._transform()`](#stream_transform_transform_chunk_encoding_callback) method and *may* also implement the [`transform._flush()`](#stream_transform_flush_callback) method.

*Note*: Care must be taken when using Transform streams in that data written to the stream can cause the Writable side of the stream to become paused if the output on the Readable side is not consumed.

#### new stream.Transform([options])

* `options` {Object} Passed to both Writable and Readable constructors. También tiene los siguientes campos:
  * `transform` {Function} Implementación para el método [`stream._transform()`](#stream_transform_transform_chunk_encoding_callback).
  * `flush` {Function} Implementación para el método [`stream._flush()`](#stream_transform_flush_callback).

For example:

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

*Note*: This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal Readable class methods only.

En algunos casos, una operación de transformación pudiera emitir un bit adicional de datos en el final del stream. Por ejemplo, un stream de compresión `zlib` va a almacenar una cantidad de estado interno usado para la compresión óptima de la salida. Cuando el stream termina, sin embargo, esos datos adicionales necesitan ser arrojados para que los datos comprimidos estén completos.

Custom [Transform](#stream_class_stream_transform) implementations *may* implement the `transform._flush()` method. This will be called when there is no more written data to be consumed, but before the [`'end'`][] event is emitted signaling the end of the [Readable](#stream_class_stream_readable) stream.

Dentro de la implementación `transform._flush()`, el método `readable.push()` puede ser llamado cero o más veces, según corresponda. La función `callback` debe ser llamada cuando la operación de descarga es completada.

El método `transform._flush()` es ajustado con un subrayado porque es interno a la clase que lo define, nunca debería ser llamado directamente por programas de usuario.

#### transform.\_transform(fragmento, codificación, callback)

* `chunk` {Buffer|string|any} El fragmento a ser transformado. **Siempre** será un búfer a menos que la opción `decodeStrings` sea establecida como `false`, o que el stream esté operando en modo objeto.
* `encoding` {string} Si el fragmento es un string, entonces esto es el tipo de codificación. Si el fragmento es un búfer, entonces este es el valor especial - 'buffer', ignóralo en este caso.
* `callback` {Function} Una función callback (opcionalmente con un argumento error y datos) a ser llamada después que el `chunk` proporcionado ha sido procesado.

*Note*: This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal Readable class methods only.

Todas las implementaciones de stream Transform deben proporcionar un método `_transform()` para aceptar la entrada y producir una salida. La implementación `transform._transform()` maneja los bytes que están siendo escritos, computa una salida, luego pasa esa salida a la porción legible usando el método `readable.push()`.

El método `transform.push()` puede ser llamado cero o más veces para generar salida de un solo fragmento de entrada, dependiendo de cuanto hay para la salida como resultado del fragmento.

Es posible que ninguna salida sea generada de cualquier fragmento de datos de entrada.

La función `callback` debe ser llamada solo cuando el fragmento actual sea completamente consumido. El primer argumento pasado al `callback` debe ser un objeto `Error` si ocurre un error mientras se procesa la entrada, o de caso contrario `null`. Si un segundo argumento es pasado al `callback`, será reenviado al método `readable.push()`. En otras palabras los siguientes son equivalentes:

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

The `stream.PassThrough` class is a trivial implementation of a [Transform](#stream_class_stream_transform) stream that simply passes the input bytes across to the output. Su propósito es principalmente para ejemplos y pruebas, pero hay algunos casos de uso donde `stream.PassThrough` es útil como un bloque de construcción para nuevos tipos de streams.

## Notas adicionales<!--type=misc-->### Compatibilidad con las versiones anteriores de Node.js

<!--type=misc-->

En las versiones anteriores de v0.10 de Node.js, la interfaz del stream Readable era más simple, pero también menos potente y menos útil.

* En vez de esperar por llamadas, el método [`stream.read()`](#stream_readable_read_size), eventos [`'data'`][] empezarían a emitirse inmediatamente. Las aplicaciones que necesiten realizar cierta cantidad de trabajo para decidir cómo manejar los datos, fueron requeridas que almacenen los datos en los búferes para que los datos no se perdieran.
* El método [`stream.pause()`](#stream_readable_pause) era consultivo, en vez de garantizado. Esto significaba que era necesario estar preparado para recibir eventos [`'data'`][] *incluso cuando el stream estaba en estado pausado*.

In Node.js v0.10, the [Readable](#stream_class_stream_readable) class was added. For backwards compatibility with older Node.js programs, Readable streams switch into "flowing mode" when a [`'data'`][] event handler is added, or when the [`stream.resume()`](#stream_readable_resume) method is called. El efecto es que, incluso cuando no se use el nuevo método [`stream.read()`](#stream_readable_read_size) y el evento [`'readable'`][], ya no será necesario preocuparse por la pérdida de fragmentos [`'data'`][].

Mientras que la mayoría de las aplicaciones continuarán funcionando con normalidad, esto introduce un caso extremo en las siguientes condiciones:

* Ningún listener de evento [`'data'`][] es añadido.
* El método [`stream.resume()`](#stream_readable_resume) nunca es llamado.
* El stream no hace pipe a ningún destino escribible.

Por ejemplo, considera el siguiente código:

```js
// ¡ADVERTENCIA!  ¡ROTO!
net.createServer((socket) => {

  // we add an 'end' method, but never consume the data
  socket.on('end', () => {
    // It will never get here.
    socket.end('The message was received but was not processed.\n');
  });

}).listen(1337);
```

En versiones anteriores de v0.10 de Node.js, los datos de mensajes entrantes serían simplemente descartados. Sin embargo, a partir de Node.js v0.10 y versiones posteriores, el socket permanece pausado para siempre.

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

In addition to new Readable streams switching into flowing mode, pre-v0.10 style streams can be wrapped in a Readable class using the [`readable.wrap()`][`stream.wrap()`] method.


### `readable.read(0)`

Hay algunos casos donde es necesario activar una actualización de los mecanismos de stream legible subyacente, sin realmente consumir datos. En tales casos, es posible llamar a `readable.read(0)`, que siempre devolverá `null`.

Si el búfer de lectura interno está por debajo de `highWaterMark`, y el stream no está actualmente leyendo, entonces llamar a `stream.read(0)` va a activar una llamada de [`stream._read()`](#stream_readable_read_size_1) de bajo-nivel.

While most applications will almost never need to do this, there are situations within Node.js where this is done, particularly in the Readable stream class internals.

### `readable.push('')`

No se recomienda el uso de `readable.push('')`.

Empujar un string de cero-bytes, un `Buffer` o un `Uint8Array` a un stream que no está en modo objeto tiene un efecto secundario interesante. Porque *es* una llamada a [`readable.push()`](#stream_readable_push_chunk_encoding), la llamada va a terminar el proceso de lectura. Sin embargo, ya que el argumento es un string vacío, no se añaden datos al búfer legible, entonces no hay nada para que un usuario consuma.

### `highWaterMark` discrepancia después de llamar a `readable.setEncoding()`

El uso de `readable.setEncoding()` cambiará el comportamiento de cómo opera `highWaterMark` en modo no-objeto.

Generalmente, el tamaño del búfer actual es medido contra `highWaterMark` en _bytes_. Sin embargo, después que se llama `setEncoding()`, la función de comparación empezará a medir el tamaño del búfer en _caracteres_.

Esto no es un problema en casos comunes con `latin1` o `ascii`. Pero es aconsejado ser consciente sobre este comportamiento cuando se trabaje con strings que pudieran contener caracteres multi-byte.
