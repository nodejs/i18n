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

* [`Readable`][] - stream de donde los datos pueden ser leídos (por ejemplo [`fs.createReadStream()`][]).
* [`Writable`][] - streams donde los datos pueden ser escritos (por ejemplo [`fs.createWriteStream()`][]).
* [`Duplex`][] - streams que son tanto `Readable` como `Writable` (por ejemplo [`net.Socket`][]).
* [`Transform`][] - `Duplex` streams que pueden modificar o transformar los datos mientras son escritos y leídos (por ejemplo [`zlib.createDeflate()`][]).

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

Porque ambos streams [`Duplex`][] y [`Transform`][] son `Readable` y `Writable`, cada uno mantiene *dos* búferes internos separados usados para leer y escribir, permitiendo cada lado operar independientemente del otro, mientras se mantiene un flujo de datos apropiado y eficiente. Por ejemplo, las instancias [`net.Socket`][] son streams [`Duplex`][] cuyo lado `Readable` permite el consumo de datos recibidos *del* socket y cuyo lado `Writable` permite escribir datos *al* socket. Porque los datos pueden ser escritos al socket a una tasa más rápida o más lenta que los datos que son recibidos, es importante para cada lado operar (y almacenar) independientemente del otro.

## API para los Consumidores de Stream

<!--type=misc-->

Casi todas las aplicaciones Node.js, no importa que tan simple sea, usa streams de alguna manera/modo. Nota: se puede escoger, alguna de las dos. Lo siguiente es un ejemplo de uso de streams en una aplicación de Node.js que implemente un servidor HTTP:

```js
const http = require('http');

const server = http.createServer((req, res) => {
  // req es un http.IncomingMessage, que es un Stream Legible
  // res es un http.ServerResponse, que es un Stream Escribible

  let body = '';
  // Obtiene los datos como strings utf8.
  // Si no se establece una codificación, los objetos Buffer van a ser recibidos.
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

* [Solicitudes HTTP, en el cliente](http.html#http_class_http_clientrequest)
* [Respuestas HTTP, en el servidor](http.html#http_class_http_serverresponse)
* [streams write fs](fs.html#fs_class_fs_writestream)
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
        // ¡última vez!
        writer.write(data, encoding, callback);
      } else {
        // ver si deberíamos continuar, o espera
        // no pases la callback, porque no hemos terminado aún.
        ok = writer.write(data, encoding);
      }
    } while (i > 0 && ok);
    if (i > 0) {
      // ¡tuve que parar temprano!
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
  // Los datos no serán arrojados hasta que uncork() sea llamado una segunda vez.
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

* `chunk` {string|Buffer|Uint8Array|any} Datos opcionales para escribir. Para los streams que no operen en modo objeto, `chunk` debe ser un string, un `Buffer` o un `Uint8Array`. Para los streams en modo objeto, `chunk` puede ser cualquier valor de JavaScript, menos `null`.
* `encoding` {string} La codificación si `chunk` es un string
* `callback` {Function} Hace callback para cuando este fragmento de datos es arrojado
* Devuelve: {boolean} `false`si el stream desea por el código llamando a esperar por el evento `'drain'` sea emitido antes de continuar esperando escribir datos adicionales; de otra manera `true`.

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

// Espera que se llame cb antes de escribir algo más.
write('hello', () => {
  console.log('write completed, do more writes now');
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
// readableFlowing ahora es false

pass.on('data', (chunk) => { console.log(chunk.toString()); });
pass.write('ok'); // no va a emitir 'data'
pass.resume(); // debe ser llamado para hacer que 'data' sea emitido
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

Si tanto `'readable'` y [`'data'`][] son usados al mismo tiempo, `'readable'` toma la prioridad de controlar el flujo, es decir, `'data'` será emitido solo cuando [`stream.read()`](#stream_readable_read_size) es llamado.

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

El método `readable.read()` solo debería ser llamado en los streams `Readable` operando en modo pausado. En modo fluido, `readable.read()` es llamado automáticamente hasta que el búfer interno es vaciado completamente.

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

* `destination` {stream.Writable} Stream específico opcional para no hacer pipe
* Devuelve: {this}

El método `readable.unpipe()` separa un stream `Writable` que fue adjuntado anteriormente usando el método [`stream.pipe()`][].

Si el `destination` no es especificado, entonces *todos* los pipes son separados.

Si el `destination` es especificado, pero no se configura ningún pipe para él. entonces el método no hace nada.

```js
const fs = require('fs');
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// Todos los datos del legible van a ''file.txt'',
// pero solo por el primer segundo
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

El método `stream.unshift(chunk)` no puede ser llamado después que el evento [`'end'`][] ha sido emitido, o se producirá un error runtime.

Los desarrolladores que usan `stream.unshift()` a menudo deberían considerar a cambiar a usar el stream [`Transform`][] en su lugar. Vea la sección [API para los Implementadores de Stream](#stream_api_for_stream_implementers) para más información.

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

A diferencia de [`stream.push(chunk)`](#stream_readable_push_chunk_encoding), `stream.unshift(chunk)` no va a terminar el proceso de lectura al resetear el estado de lectura interno del stream. Esto puede causar resultados inesperados si `readable.unshift()` es llamado durante una lectura (es decir desde una implementación [`stream._read()`](#stream_readable_read_size_1) en un stream personalizado). Siguiendo la llamada a `readable.unshift()` con un inmediato [`stream.push('')`](#stream_readable_push_chunk_encoding) va a restablecer el estado de la lectura de forma adecuada, sin embargo es mejor simplemente evitar llamar a `readable.unshift()` mientras en el proceso de realizar una lectura.

##### readable.wrap(stream)

<!-- YAML
added: v0.9.4
-->

* `stream` {Stream} Un stream legible de "viejo estilo"
* Devuelve: {this}

Versiones anteriores de v0.10 de Node.js tenían streams que no implementaban la API del módulo `stream` como está definido actualmente. (Vea [Compatibility](#stream_compatibility_with_older_node_js_versions) para más información.)

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

El API `finished` también es promisify'able;

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

* `...streams` {Stream} Dos o más streams para hacer pipe de por medio.
* `callback` {Function} Una función callback que toma un argumento error opcional.

Un método módulo para hacer pipe entre streams reenviando errores y limpiando correctamente y proporcionando un callback cuando el pipeline es completado.

```js
const { pipeline } = require('stream');
const fs = require('fs');
const zlib = require('zlib');

// Usa el API pipeline para hacer fácilmente pipe a una serie de streams 
// juntos y ser notificado cuando el pipeline sea completado.

// Un pipeline para hacer gzip eficientemente a un archivo tar potencialmente gigantesco :

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

El API `pipeline` también es promisify'able:

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

Para muchos casos simples, es imposible construir un stream sin depender de la herencia. Esto puede ser logrado al crear instancias directamente de los objetos `stream.Writable`, `stream.Readable`, `stream.Duplex` o `stream.Transform` y pasar métodos apropiados como opciones de constructor.

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

* `opciones` {Object} 
  * `highWaterMark` {number} Nivel del búfer cuando [`stream.write()`](#stream_writable_write_chunk_encoding_callback) empieza a devolver `false`. **Predeterminado:** `16384` (16kb), o `16` para streams `objectMode`.
  * `decodeStrings` {boolean} Si codificar o no los strings en `Buffer`es antes de pasarlos a [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1). **Predeterminado:** `true`.
  * `objectMode` {boolean} Ya sea [`stream.write(anyObj)`](#stream_writable_write_chunk_encoding_callback) una operación válida o no. Cuando es establecido, se hace posible escribir otros valores de JavaScript aparte de string, `Buffer` o `Uint8Array` si lo soporta la implementación del stream. **Predeterminado:** `false`.
  * `emitClose` {boolean} Si el stream debería emitir `'close'` después que ha sido destruido, o no. **Predeterminado:** `true`.
  * `write` {Function} Implementación para el método [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1).
  * `writev` {Function} Implementación para el método [`stream._writev()`](#stream_writable_writev_chunks_callback).
  * `destroy` {Function} Implementación para el método [`stream._destroy()`](#stream_writable_destroy_err_callback).
  * `final` {Function} Implementación para el método [`stream._final()`](#stream_writable_final_callback).

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

O se use el enfoque del Constructor Simplificado:

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

* `chunk` {Buffer|string|any} El fragmento a ser escrito. **Siempre** será un búfer a menos que la opción `decodeStrings` fue establecida como `false` o que el stream está operando en modo objeto.
* `encoding` {string} Si el fragmento es un string, entonces `encoding` es el codificador de carácter de ese string. Si el fragmento es un `Buffer`, o si el stream está operando en modo objeto, `encoding` pudiera ser ignorado.
* `callback` {Function} Llama esta función (opcionalmente con un argumento error) cuando el procesamiento es completado para el fragmento suministrado.

Todas las implementaciones de stream `Writable` deben proporcionar un método [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1) para enviar datos al recurso subyacente.

Los streams [`Transform`][] proporcionan su propia implementación de [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1).

Esta función NO DEBE ser llamada por aplicación de código directamente. Debería ser implementada por clases secundarias, y llamada solamente por métodos de la clase `Writable` interna.

El método `callback` debe ser llamado para señalar que la escritura se terminó con éxito o falló con un error. El primer argumento pasado al `callback` debe ser el objeto `Error` si la llamada falla, o `null` si la escritura tuvo éxito.

Todas las llamadas a `writable.write()` que ocurren en el tiempo que `writable._write()` es llamado y el `callback` es llamado causará que los datos escritos sean almacenados en el búfer. Cuando el `callback` es invocado, el stream pudiera emitir un evento [`'drain'`][]. Si una implementación de stream es capaz de procesar múltiples fragmentos de datas al mismo tiempo, el método `writable._writev()` debería ser implementado.

Si la propiedad `decodeStrings` es establecida explícitamente a `false` en las opciones del constructor, entonces `chunk` permanecerá como el mismo objeto que es pasado a `.write()`, y pudiera ser un string en vez de un `Buffer`. Esto es para soportar implementaciones que tienen un manejador optimizado para ciertas codificaciones de datos string. En ese caso, el argumento `encoding`, va a indicar la codificación de caracteres del string. De otra manera, el argumento `encoding` puede ser ignorado con seguridad.

El método `writable._write()` es ajustado con un subrayado porque es interno a la clase que lo define, y no debería ser llamado directamente por programas de usuario.

#### writable.\_writev(chunks, callback)

* `chunks` {Object[]} Los fragmentos a ser escritos. Cada fragmento tiene el siguiente formato: `{ chunk: ..., encoding: ... }`.
* `callback` {Function} Una función callback (opcionalmente con un argumento error) para ser invocada cuando el procesamiento de los fragmentos suministrados es completado.

Esta función NO DEBE ser llamada por aplicación de código directamente. Debería ser implementada por clases secundarias, y llamada solamente por métodos de la clase `Writable` interna.

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

El método `_final()` **no debe** ser llamado directamente. Puede ser implementado por clases secundarias, y si se hace, será llamado solamente por métodos de clase `Writable` internos.

Esta función opcional será llamada antes de que el stream cierre, demorando el evento `'finish'` hasta que `callback` es llamado. Esto es útil para cerrar recursos o escribir datos almacenados antes de que un stream termine.

#### Errores al Escribir

Es recomendado que ocurran errores durante el procesamiento de los métodos `writable._write()` y `writable._writev()` sean reportados al invocar el callback y pasar el error como el primer argumento. Esto causará que un evento `'error'` sea emitido por el `Writable`. Arrojar un `Error` desde dentro del `writable._write()` puede resultar en un comportamiento inesperado e inconsistente dependiendo de cómo se está usando el stream. Usar la callback asegura el manejo de errores consistente y predecible.

Si un stream `Readable` hace pipe en un stream `Writable` cuando `Writable` emite un error, no se le hará pipe al stream `Readable`.

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

Lo siguiente muestra una implementación de stream `Writable` personalizada algo simplista (y un poco inútil). Mientras esta instancia de stream `Writable` específica no es de ninguna utilidad real, el ejemplo ilustra cada uno de los elementos requeridos de una instancia de stream [`Writable`][] personalizada:

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

La decodificación de búferes es una tarea común, por ejemplo, cuando se use tranformadores cuya entrada es un string. No es un proceso trivial cuando se use codificación de caracteres multi-byte, tal como UTF-8. El siguiente ejemplo muestra cómo decodificar strings multi-byte usando `StringDecoder` y [`Writable`][].

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

La clase `stream.Readable` es extendida para implementar un stream [`Readable`][].

Streams `Readable` personalizados *deben* llamar el constructor `new stream.Readable([options])` e implementar el método `readable._read()`.

#### new stream.Readable([options])

* `opciones` {Object} 
  * `highWaterMark` {number} El máximo [número de bytes](#stream_highwatermark_discrepancy_after_calling_readable_setencoding) para almacenar en el búfer interno antes de cesar la lectura desde el recurso subyacente. **Predeterminado:** `16384` (16kb), o `16` para streams `objectMode`.
  * `encoding` {string} Si es especificado, los búferes van a ser decodificados a strings usando la codificación especificada. **Predeterminado:** `null`.
  * `objectMode` {boolean} Si este stream debería comportarse como un stream de objetos, o no. Significa que [`stream.read(n)`](#stream_readable_read_size) devuelve un solo valor en vez de un `Buffer` de tamaño `n`. **Predeterminado:** `false`.
  * `read` {Function} Implementación para el método [`stream._read()`](#stream_readable_read_size_1).
  * `destroy` {Function} Implementación para el método [`stream._destroy()`](#stream_readable_destroy_err_callback).

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

O cuando se use constructores de estilo pre-ES6:

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

<!-- YAML
added: v0.9.4
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17979
    description: call `_read()` only once per microtick
-->

* `size` {number} Números de bytes para ser leídos asincrónicamente

Esta función NO DEBE ser llamada por aplicación de código directamente. Debería ser implementado por clases secundarias, y llamado solamente por métodos de la clase `Readable` interna.

Todas las implementaciones de stream `Readable` deben proporcionar una implementación del método `readable._read()` para recoger datos del recurso subyacente.

Cuando `readable._read()` es llamado, si hay datos disponibles de la fuente, la implementación debería comenzar a enviar esos datos a dentro de la cola de lectura usando el método [`this.push(dataChunk)`](#stream_readable_push_chunk_encoding). `_read()` debería continuar leyendo del recurso y enviar datos hasta que `readable.push()` devuelva `false`. Solo cuando `_read()` es llamado otra vez después que se ha detenido debería continuar el envío de datos adicionales a la cola.

Una vez que el método `readable._read()` ha sido llamado, no será llamado de nuevo hasta que el método [`readable.push()`](#stream_readable_push_chunk_encoding) sea llamado. `readable._read()` está garantizado a ser llamado una sola vez dentro de una ejecución sincrónica, es decir un microtick.

El argumento `size` es consultivo. Para implementaciones donde un "read" es una sola operación que devuelve datos, puede usar el argumento `size` para determinar cuántos datos recoger. Otras implementaciones pudieran ignorar este argumento y simplemente proporcionar los datos cuando estén disponibles. No hay que "esperar" hasta que los bytes de `size` estén disponibles antes de llamar a [`stream.push(chunk)`](#stream_readable_push_chunk_encoding).

El método `readable._read()` es ajustado con un subrayado porque es interno a la clase que lo define, y no debería ser llamado directamente por programas de usuario.

#### readable.\_destroy(err, callback)

<!-- YAML
added: v8.0.0
-->

* `err` {Error} Un posible error.
* `callback` {Function} Una función callback que toma un argumento error adicional.

El método `_destroy()` es llamado por [`readable.destroy()`](#stream_readable_destroy_error). Puede ser sobrescrito por clases secundarias pero **no debe** ser llamado directamente.

#### readable.push(chunk[, encoding])

<!-- YAML
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->

* `chunk` {Buffer|Uint8Array|string|null|any} Fragmento de datos a ser empujados en la cola de lectura. Para los streams que no operen en modo objeto, `chunk` debe ser un string, un `Buffer` o un `Uint8Array`. Para streams en modo objeto, `chunk` puede ser cualquier valor JavaScript.
* `encoding` {string} Codificación de los fragmentos string. Debe ser una codificación `Buffer`, tales como `'utf8'` o `'ascii'`.
* Devuelve: {boolean} `true` si fragmentos de datos adicionales pueden seguir siendo empujados; de otra manera `false`.

Cuando `chunk` es un `Buffer`, `Uint8Array` o un `string`, el `chunk` de datos será añadido a la cola interna para los usuarios del stream a consumir. Pasar `chunk` como `null` señala el final del stream (EOF), después que no se pueden escribir más datos.

Cuando el `Readable` opera en modo pausado, los datos añadidos con `readable.push()` pueden ser leídos llamando el método [`readable.read()`](#stream_readable_read_size) cuando el evento [`'readable'`][] es emitido.

Cuando `Readable` está operando en modo fluido, los datos añadidos con `readable.push()`serán entregados al emitir un evento `'data'`.

El método `readable.push()` está diseñado para ser tan flexible como sea posible. Por ejemplo, cuando se envuelve una fuente de bajo-nivel que proporciona alguna forma de mecanismo de pausar/resumir, y una callback de datos, la fuente de bajo-nivel puede ser envuelta por la instancia `Readable` personalizada como se muestra en el siguiente ejemplo:

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

El método `readable.push()` está previsto ser llamado solo por implementadores `Readable`, y solo desde dentro del método `readable._read()`.

Para streams que no estén operando en modo objeto, si el parámetro `chunk` de `readable.push()` es `undefined`, será tratado como un string vacío o un búfer. Vea [`readable.push('')`][] para más información.

#### Errores al Escribir

Es recomendado que los errores que ocurran durante el procesamiento del método `readable._read()` sean emitidos usando el evento `'error'` en vez de ser arrojados. Arrojar un `Error` desde dentro del `readable._read()` puede resultar en un comportamiento inesperado e inconsistente dependiendo si el stream está operando en modo fluido o modo pausado. Usar el evento `'error'` asegura el manejo de errores consistente y predecible.

<!-- eslint-disable no-useless-return -->

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

#### Un Ejemplo de Conteo de Stream

<!--type=example-->

El siguiente es un ejemplo básico de un stream `Readable` que emite los numerales de 1 a 1,000,000 en orden ascendente y luego termina.

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

Un stream [`Duplex`][] es uno que implementa tanto [`Readable`][] como [`Writable`][], como una conexión de socket TCP.

Porque JavaScript no tiene soporte para múltiples herencias, la clase `stream.Duplex` es extendida para implementar un stream [`Duplex`][] (a diferencia de extender las clases `stream.Readable` *y* `stream.Writable`).

La clase `stream.Duplex` hereda prototípicamente de `stream.Readable` y parasitariamente de `stream.Writable`, pero `instanceof` va a funcionar de forma correcta para las ambas clases de base, debido a la anulación de [`Symbol.hasInstance`][] en `stream.Writable`.

Streams `Duplex` personalizados *deben* llamar el constructor `new stream.Duplex([options])` e implementar *ambos* métodos `readable._read()` y `writable._write()`.

#### new stream.Duplex(options)

<!-- YAML
changes:

  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14636
    description: The `readableHighWaterMark` and `writableHighWaterMark` options
                 are supported now.
-->

* `opciones` {Object} Pasado por los constructores `Writable` y `Readable`. También tiene los siguientes campos: 
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

Lo siguiente muestra un ejemplo simple de un stream `Duplex` que envuelve un objeto fuente de bajo-nivel hipotético donde se pueden escribir datos, y de donde esos datos pueden ser leídos, aunque usando un API que no es compatible con streams Node.js. Lo siguiente muestra un ejemplo simple de un stream `Duplex` que almacena datos ya escritos entrantes vía la interfaz [`Writable`][], que se vuelve a leer vía la interfaz [`Readable`][].

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

El aspecto más importante de un stream `Duplex` es que los lados `Readable` y `Writable` operan independientemente uno del otro, a pesar de coexistir dentro de una sola instancia objeto.

#### Modo Objeto de Streams Dúplex

Para los streams `Duplex`, el `objectMode` puede ser establecido exclusivamente para cualquiera de los dos lados `Readable` o `Writable` usando las opciones `readableObjectMode` y `writableObjectMode`, respectivamente.

Por ejemplo, en el siguiente ejemplar, un nuevo stream `Transform` (que es un tipo de stream [`Duplex`][]) es creado que tiene un lado `Writable` en modo objeto que acepta números JavaScript que son convertidos en strings hexadecimales en el lado `Readable`.

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

Un stream [`Transform`][] es un stream [`Duplex`][] donde la salida es computada de alguna manera desde la entrada. Los ejemplos incluyen streams [zlib](zlib.html) o streams [crypto](crypto.html) que comprimen, encriptan o descifran los datos.

No es requerido que la salida sea del mismo tamaño que la entrada, del mismo número de fragmentos, o que lleguen al mismo tiempo. Por ejemplo, un stream `Hash` solo tendrá un solo fragmento de salida, que es proporcionado cuando la entrada ha terminado. Un stream `zlib` producirá una salida que, o es mucho más pequeña o mucho más grande que su entrada.

La clase `stream.Transform` es extendida para implementar un stream [`Transform`][].

La clase `stream.Transform` hereda prototípicamente de `stream.Duplex` e implementa su propia versión de los métodos `writable._write()` y `readable._read()`. Implementaciones `Transform` personalizadas*deben* implementar el método [`transform._transform()`](#stream_transform_transform_chunk_encoding_callback) y también *pudieran* implementar el método [`transform._flush()`](#stream_transform_flush_callback).

Debe tenerse cuidado cuando se usen los streams `Transform` en esos datos escritos al stream, pueden causar que el lado `Writable` del stream se convierta en pausado si la salida en el lado `Readable` no es consumida.

#### new stream.Transform([options])

* `opciones` {Object} Pasado por los constructores `Writable` y `Readable`. También tiene los siguientes campos: 
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

Esta función NO DEBE ser llamada por aplicación de código directamente. Debería ser implementado por clases secundarias, y llamado solamente por métodos de la clase `Readable` interna.

En algunos casos, una operación de transformación pudiera emitir un bit adicional de datos en el final del stream. Por ejemplo, un stream de compresión `zlib` va a almacenar una cantidad de estado interno usado para la compresión óptima de la salida. Cuando el stream termina, sin embargo, esos datos adicionales necesitan ser arrojados para que los datos comprimidos estén completos.

Implementaciones [`Transform`][] personalizadas *pudieran* implementar el método `transform._flush()`. Esto será llamado cuando no hay más datos escritos para ser consumidos, pero antes de que el evento [`'end'`][] es emitido señalando el final del stream [`Readable`][].

Dentro de la implementación `transform._flush()`, el método `readable.push()` puede ser llamado cero o más veces, según corresponda. La función `callback` debe ser llamada cuando la operación de descarga es completada.

El método `transform._flush()` es ajustado con un subrayado porque es interno a la clase que lo define, nunca debería ser llamado directamente por programas de usuario.

#### transform.\_transform(fragmento, codificación, callback)

* `chunk` {Buffer|string|any} El fragmento a ser transformado. **Siempre** será un búfer a menos que la opción `decodeStrings` sea establecida como `false`, o que el stream esté operando en modo objeto.
* `encoding` {string} Si el fragmento es un string, entonces esto es el tipo de codificación. Si el fragmento es un búfer, entonces este es el valor especial - 'buffer', ignóralo en este caso.
* `callback` {Function} Una función callback (opcionalmente con un argumento error y datos) a ser llamada después que el `chunk` proporcionado ha sido procesado.

Esta función NO DEBE ser llamada por aplicación de código directamente. Debería ser implementado por clases secundarias, y llamado solamente por métodos de la clase `Readable` interna.

Todas las implementaciones de stream `Transform` deben proporcionar un método `_transform()` para aceptar la entrada y producir una salida. La implementación `transform._transform()` maneja los bytes que están siendo escritos, computa una salida, luego pasa esa salida a la porción legible usando el método `readable.push()`.

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

La clase `stream.PassThrough` es una implementación trivial de un stream [`Transform`][] que simplemente pasa los bytes de entrada a través de la salida. Su propósito es principalmente para ejemplos y pruebas, pero hay algunos casos de uso donde `stream.PassThrough` es útil como un bloque de construcción para nuevos tipos de streams.

## Notas Adicionales

<!--type=misc-->

### Compatibilidad con las versiones anteriores de Node.js

<!--type=misc-->

En las versiones anteriores de v0.10 de Node.js, la interfaz del stream `Readable` era más simple, pero también menos potente y menos útil.

* En vez de esperar por llamadas, el método [`stream.read()`](#stream_readable_read_size), eventos [`'data'`][] empezarían a emitirse inmediatamente. Las aplicaciones que necesiten realizar cierta cantidad de trabajo para decidir cómo manejar los datos, fueron requeridas que almacenen los datos en los búferes para que los datos no se perdieran.
* El método [`stream.pause()`](#stream_readable_pause) era consultivo, en vez de garantizado. Esto significaba que era necesario estar preparado para recibir eventos [`'data'`][] *incluso cuando el stream estaba en estado pausado*.

En Node.js v0.10, la clase [`Readable`][] fue añadida. Para compatibilidad con versiones anteriores con programas Node.js más viejos, los streams `Readable` cambian a "modo fluido" cuando un manejador de evento [`'data'`][] es añadido, o cuando el método [`stream.resume()`](#stream_readable_resume) es llamado. El efecto es que, incluso cuando no se use el nuevo método [`stream.read()`](#stream_readable_read_size) y el evento [`'readable'`][], ya no será necesario preocuparse por la pérdida de fragmentos [`'data'`][].

Mientras que la mayoría de las aplicaciones continuarán funcionando con normalidad, esto introduce un caso extremo en las siguientes condiciones:

* Ningún listener de evento [`'data'`][] es añadido.
* El método [`stream.resume()`](#stream_readable_resume) nunca es llamado.
* El stream no hace pipe a ningún destino escribible.

Por ejemplo, considera el siguiente código:

```js
// ¡ADVERTENCIA!  ¡ROTO!
net.createServer((socket) => {

  // añadimos un listener 'end', pero nunca consume los datos
  socket.on('end', () => {
    // Nunca llegará aquí.
    socket.end('The message was received but was not processed.\n');
  });

}).listen(1337);
```

En versiones anteriores de v0.10 de Node.js, los datos de mensajes entrantes serían simplemente descartados. Sin embargo, a partir de Node.js v0.10 y versiones posteriores, el socket permanece pausado para siempre.

La solución alternativa en esta situación es llamar al método [`stream.resume()`](#stream_readable_resume) para iniciar el flujo de datos:

```js
// Solución alternativa
net.createServer((socket) => {
  socket.on('end', () => {
    socket.end('The message was received but was not processed.\n');
  });

  // inicia el flujo de datos, descartándolo.
  socket.resume();
}).listen(1337);
```

Además de los nuevos streams `Readable` cambiando a modo fluido, los streams con un estilo pre-v0.10 pueden ser envueltos en una clase `Readable` usando el método [`readable.wrap()`][`stream.wrap()`].

### `readable.read(0)`

Hay algunos casos donde es necesario activar una actualización de los mecanismos de stream legible subyacente, sin realmente consumir datos. En tales casos, es posible llamar a `readable.read(0)`, que siempre devolverá `null`.

Si el búfer de lectura interno está por debajo de `highWaterMark`, y el stream no está actualmente leyendo, entonces llamar a `stream.read(0)` va a activar una llamada de [`stream._read()`](#stream_readable_read_size_1) de bajo-nivel.

Mientras que la mayoría de las aplicaciones casi nunca necesitan hacer esto, hay situaciones dentro de Node.js donde esto se hace, particularmente en la clase interna del stream `Readable`.

### `readable.push('')`

No se recomienda el uso de `readable.push('')`.

Empujar un string de cero-bytes, un `Buffer` o un `Uint8Array` a un stream que no está en modo objeto tiene un efecto secundario interesante. Porque *es* una llamada a [`readable.push()`](#stream_readable_push_chunk_encoding), la llamada va a terminar el proceso de lectura. Sin embargo, ya que el argumento es un string vacío, no se añaden datos al búfer legible, entonces no hay nada para que un usuario consuma.

### `highWaterMark` discrepancia después de llamar a `readable.setEncoding()`

El uso de `readable.setEncoding()` cambiará el comportamiento de cómo opera `highWaterMark` en modo no-objeto.

Generalmente, el tamaño del búfer actual es medido contra `highWaterMark` en *bytes*. Sin embargo, después que se llama `setEncoding()`, la función de comparación empezará a medir el tamaño del búfer en *caracteres*.

Esto no es un problema en casos comunes con `latin1` o `ascii`. Pero es aconsejado ser consciente sobre este comportamiento cuando se trabaje con strings que pudieran contener caracteres multi-byte.