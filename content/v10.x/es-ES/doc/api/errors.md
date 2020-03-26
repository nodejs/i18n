# Errores

<!--introduced_in=v4.0.0-->
<!--type=misc-->

Las aplicaciones ejecutándose en Node.js experimentarán, generalmente, cuatro categorías de errores:

- Standard JavaScript errors such as {EvalError}, {SyntaxError}, {RangeError},
{ReferenceError}, {TypeError}, and {URIError}.
- System errors triggered by underlying operating system constraints such as attempting to open a file that does not exist or attempting to send data over a closed socket.
- User-specified errors triggered by application code.
- `AssertionError`s are a special class of error that can be triggered when Node.js detects an exceptional logic violation that should never occur. Estos son levantados típicamente por el módulo `assert`.

Todos los errores de JavaScript y de Sistema levantados por Node.js son heredados, o son instancias, de la clase {Error} de JavaScript estándar y se garantiza que proporcionen, *al menos*, las propiedades disponibles para dicha clase.

## Propagación e Intercepción de Errores

<!--type=misc-->

Node.js soporta varios mecanismos para la propagación y manejo de los errores que ocurran mientras una aplicación se está ejecutando. La manera en que estos errores se reportan y manejan depende completamente del tipo de `Error` y estilo de la API que sea llamada.

Todos los errores de JavaScript son manejados como excepciones que *inmediatamente* generan y arrojan un error utilizando el mecanismo estándar de JavaScript `throw`. These are handled using the [`try…catch` construct](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch) provided by the JavaScript language.

```js
// Throws with a ReferenceError because z is not defined.
try {
  const m = 1;
  const n = m + z;
} catch (err) {
  // Handle the error here.
}
```

Any use of the JavaScript `throw` mechanism will raise an exception that *must* be handled using `try…catch` or the Node.js process will exit immediately.

Con pocas excepciones, las APIs _Sincrónicas_ (cualquier método que no acepte una función `callback`, tal como [`fs.readFileSync`][]), utilizarán `throw` para reportar errores.

Los errores que ocurren dentro de _APIs Asíncronas_ pueden ser reportados de múltiples maneras:

- La mayoría de los métodos asíncronos que aceptan una función `callback` aceptarán un objeto de `Error` pasado como el primer argumento de dicha función. Si ese primer argumento no es `null` y es una instancia de `Error`, entonces ocurrió un error que debe ser manejado.
  ```js
  const fs = require('fs');
  fs.readFile('a file that does not exist', (err, data) => {
    if (err) {
      console.error('There was an error reading the file!', err);
      return;
    }
    // Otherwise handle the data
  });
  ```
- Cuando se llama a un método asincrónico en un objeto que es un [`EventEmitter`][], los errores pueden enrutarse al evento `'error'` de ese objeto.

  ```js
  const net = require('net');
  const connection = net.connect('localhost');

  // Adding an 'error' event handler to a stream:
  connection.on('error', (err) => {
    // If the connection is reset by the server, or if it can't
    // connect at all, or on any sort of error encountered by
    // the connection, the error will be sent here.
    console.error(err);
  });

  connection.pipe(process.stdout);
  ```

- A handful of typically asynchronous methods in the Node.js API may still use the `throw` mechanism to raise exceptions that must be handled using `try…catch`. No hay una lista comprensiva de estos métodos; por favor refiérase a la documentación de cada método para determinar el mecanismo de manejo apropiado que se requiere para cada uno.

El uso del mecanismo del evento `'error'` es más común para las APIs [basadas en streams](stream.html) y [basadas en emisores de eventos](events.html#events_class_eventemitter), las cuales representan series de operaciones asíncronas a lo largo del tiempo (a diferencia de operaciones sencillas que pueden pasar o fallar).

Para *todos* los objetos [`EventEmitter`][], si no se proporciona un manejador del evento `'error'`, se arrojará el error, causando que el proceso Node.js reporte una excepción no detectada y ocasione un fallo, a menos que: El módulo [`dominio`](domain.html) sea usado apropiadamente, o se haya registrado un manejador para el evento [`'uncaughtException'`][].

```js
const EventEmitter = require('events');
const ee = new EventEmitter();

setImmediate(() => {
  // Esto causará el colapso del proceso, debido a que no fue
  // añadido un manejador del evento 'error0.
  ee.emit('error', new Error('This will crash'));
});
```

Errors generated in this way *cannot* be intercepted using `try…catch` as they are thrown *after* the calling code has already exited.

Los desarrolladores deben referirse a la documentación de cada método para determinar exactamente cómo son propagados los errores levantados por cada uno de estos métodos.

### Callbacks de primero-error<!--type=misc-->Most asynchronous methods exposed by the Node.js core API follow an idiomatic pattern referred to as an _error-first callback_. With this pattern, a callback function is passed to the method as an argument. When the operation either completes or an error is raised, the callback function is called with the `Error` object (if any) passed as the first argument. Si no se levantó ningún error, el primer argumento será pasado como `null`.

```js
const fs = require('fs');

function errorFirstCallback(err, data) {
  if (err) {
    console.error('There was an error', err);
    return;
  }
  console.log(data);
}

fs.readFile('/some/file/that/does-not-exist', errorFirstCallback);
fs.readFile('/some/file/that/does-exist', errorFirstCallback);
```

The JavaScript `try…catch` mechanism **cannot** be used to intercept errors generated by asynchronous APIs. Un error común de principiantes es intentar utilizar `throw` dentro de un callback error-first:

```js
// ESTO NO FUNCIONARÁ
const fs = require('fs');

try {
  fs.readFile('/some/file/that/does-not-exist', (err, data) => {
    // asunción equivocada: arrojar aquí...
    if (err) {
      throw err;
    }
  });
} catch (err) {
  // ¡Esto no atrapará el lanzamiento!
  console.error(err);
}
```

Esto no funcionará, ya que la función pasada a `fs.readFile()` es llamada de manera asíncrona. Para el momento en el que se haya llamado al callback, el código circundante (incluyendo el bloque del mecanismo `try { } catch (err) { }`) ya se habrá cerrado. Arrojar un error dentro del callback **puede causar el colapso del proceso de Node.js** en la mayoría de los casos. Si los [dominios](domain.html) se encuentran habilitados, o se ha registrado un manejador con `process.on('uncaughtException')`, tales errores pueden ser interceptados.

## Clase: Error<!--type=class-->Un objeto de `Error` de JavaScript genérico que no denota ninguna circunstancia específica por la cual ocurrió el error. Los objetos de `Error` capturan un "stack trace" que detalla el punto del código en el cual fue instanciado el `Error`, y pueden proporcionar una descripción de texto del mismo.

Sólo para criptos, los objetos `Error` incluirán el stack de error de OpenSSL en una propiedad separada llamada `opensslErrorStack`, si está disponible cuando se arroja el error.

Todos los errores generados por Node.js, incluyendo todos los errores de Sistema y JavaScript, serán instancias de la clase `Error` o heredados de esta.

### new Error(message)

* `message` {string}

Crea un nuevo objeto de `Error` y establece la propiedad `error.message` al mensaje de texto proporcionado. Si un objeto es pasado como un `message`, dicho mensaje será generado al llamar a `message.toString()`. La propiedad `error.stack` representará el punto en el código en el cual el `new Error()` fue llamado. Los stack traces dependen de la [API de stack traces de V8](https://github.com/v8/v8/wiki/Stack-Trace-API). Los stack traces se extienden a (a) el inicio de la *ejecución sincrónica de código* o (b) el número de frames dados por la propiedad `Error.stackTraceLimit`, lo que sea más pequeño.

### Error.captureStackTrace(targetObject[, constructorOpt])

* `targetObject` {Object}
* `constructorOpt` {Function}

Crea una propiedad `.stack` en el `targetObject`, la cual al ser accedida devuelve una string que representa la ubicación en el código en la cual `Error.captureStackTrace()` fue llamado.

```js
const myObject = {};
Error.captureStackTrace(myObject);
myObject.stack;  // similar a `new Error().stack`
```

La primera línea de la traza tendrá como prefijo `${myObject.name}: ${myObject.message}`.

El argumento opcional `constructorOpt` acepta una función. Si es proporcionado, todos los frames anteriores a `constructorOpt`, incluyendo `constructorOpt`, serán omitidos del stack trace generado.

El argumento `constructorOpt` es útil para esconder de un usuario final detalles de implementación de la generación de errores. Por ejemplo:

```js
function MyError() {
  Error.captureStackTrace(this, MyError);
}

// Si no se pasa MyError al captureStackTrace, el frame de
// MyError se mostraría en la propiedad .stack. Al pasar
// el constructor, omitimos ese frame, y retenemos todos los frames después del él.
new MyError().stack;
```

### Error.stackTraceLimit

* {number}

La propiedad `Error.stackTraceLimit` especifica el número de stack frames recolectadas por un stack trace (ya sea que fue generado por `new Error().stack` o `Error.captureStackTrace(obj)`).

El valor por defecto es `10`, pero puede establecerse en cualquier número de JavaScript válido. Los cambos afectarán cualquier stack trace capturado *después* de que el valor haya sido cambiado.

Si se establece como un valor no-numérico, o un número negativo, los stack traces no capturarán ningún frame.

### error.code

* {string}

La propiedad `error.code` es una etiqueta de string que identifica el tipo de error. `error.code` is the most stable way to identify an error. It will only change between major versions of Node.js. In contrast, `error.message` strings may change between any versions of Node.js. See [Node.js Error Codes](#nodejs-error-codes) for details about specific codes.

### error.message

* {string}

La propiedad `error.message` es la descripción de string del error establecida al llamar a `new Error(message)`. El `message` pasado al constructor también aparecerá en la primera línea del stack trace del `Error`, sin embargo, cambiar esta propiedad después de creado el objeto `Error` *puede no* cambiar la primera línea del stack trace (por ejemplo, cuando `error.stack` es leído antes de que esta propiedad fuese cambiada).

```js
const err = new Error('The message');
console.error(err.message);
// Imprime: The message
```

### error.stack

* {string}

La propiedad `error.stack` es una string que describe el punto en el código en el cual el `Error` fue instanciado.

```txt
Error: ¡Siguen ocurriendo cosas!
   at /home/gbusey/file.js:525:2
   at Frobnicator.refrobulate (/home/gbusey/business-logic.js:424:21)
   at Actor.<anonymous> (/home/gbusey/actors.js:400:8)
   at increaseSynergy (/home/gbusey/actors.js:701:6)
```

La primera línea está formateada como `<error class name>: <error message>` y es seguida por una serie de stack frames (donde cada línea comienza con "at "). Cada frame describe un sitio de llamada dentro del código que conduce al error que está siendo generado. V8 intenta mostrar el nombre de cada función (por nombre de la variable, nombre de la función o nombre del método del objeto), pero ocasionalmente no podrá encontrar un nombre adecuado. Si V8 no puede determinar un nombre para la función, solo se mostrará información de ubicación para ese frame. En caso contrario, el nombre de la función determinado será mostrado con la información de ubicación adjunta entre paréntesis.

Los frames sólo son generados para funciones JavaScript. Si, por ejemplo, la ejecución pasa de manera sincrónica una función de complemento de C++ llamada `cheetahify`, la cual llama por sí misma a una función de JavaScript, el frame que representa la llamada a `cheetahify` no se encontrará presente en los stack traces:

```js
const cheetahify = require('./native-binding.node');

function makeFaster() {
  // cheetahify llama a speedy *sincrónicamente*.
  cheetahify(function speedy() {
    throw new Error('oh no!');
  });
}

makeFaster();
// arrojará
//   /home/gbusey/file.js:6
//       arrojar un new Error('oh no!');
//           ^
//   Error: oh no!
//       at speedy (/home/gbusey/file.js:6:11)
//       at makeFaster (/home/gbusey/file.js:5:3)
//       at Object.<anonymous> (/home/gbusey/file.js:10:1)
//       at Module._compile (module.js:456:26)
//       at Object.Module._extensions..js (module.js:474:10)
//       at Module.load (module.js:356:32)
//       at Function.Module._load (module.js:312:12)
//       at Function.Module.runMain (module.js:497:10)
//       at startup (node.js:119:16)
//       at node.js:906:3
```

La información de ubicación será una de estas:

* `native`, si el frame representa una llamada interna a V8 (como en `[].forEach`).
* `plain-filename.js:line:column`, si el frame representa una llamada interna a Node.js.
* `/absolute/path/to/file.js:line:column`, si el frame representa una llamada en un programa de usuario o en sus dependencias.

La string que representa al stack trace es flojamente creada cuando la propiedad `error.stack` es **accedida**.

El número de frames capturadas por el stack trace está limitado al número más bajo del `Error.stackTraceLimit` o el número de frames disponibles en el tic del bucle del evento actual.

Los errores a nivel de sistema son generados como instancias de `Error` aumentadas, las cuales se encuentran detalladas [aquí](#errors_system_errors).

## Clase: AssertionError (Error de Afirmación)

Una subclase de `Error` que indica el fallo de una afirmación. Para detalles, vea [`Class: assert.AssertionError`][].

## Clase: RangeError (Error de Rango)

Una subclase de `Error` que indica que un argumento proporcionado no estaba dentro del conjunto o rango de valores aceptables para una función, ya sea un rango númerico o esté fuera del conjunto de opciones para un parámetro de función dado.

```js
require('net').connect(-1);
// arroja "RangeError: "port" option should be >= 0 and < 65536: -1"
```

Node.js generará y arrojará instancias de `RangeError` *inmediatamente* como forma de validación de argumento.

## Clase: ReferenceError (Error de Referencia)

Una subclase de `Error` que indica que se está intentando acceder a una variable que no está definida. Dichos errores usualmente indican que hay errores tipográficos en el código, o un programa dañado.

Aunque el código de cliente puede generar y propagar estos errores, en la práctica solo lo hará V8.

```js
doesNotExist;
// arroja un ReferenceError, doesNotExist no es una variable en este programa.
```

A menos que una aplicación genere y ejecute código de forma dinámica, las instancias de `ReferenceError` siempre deberían ser consideradas un bug en el código o sus dependencias.

## Clase: SyntaxError (Error de Sintaxis)

Una subclase de `Error` que indica que un programa no es un JavaScript válido. Estos errores solo pueden ser generados y propagados como un resultado de la evaluación de código. La evaluación de código puede ocurrir como resultado de `eval`, `Function`, `require`, o [vm](vm.html). Estos errores casi siempre son indicadores de que un programa está dañado.

```js
try {
  require('vm').runInThisContext('binary ! isNotOk');
} catch (err) {
  // err será un SyntaxError
}
```

Las instancias de `SyntaxError` son irrecuperables en el contexto en el que fueron creados –solo pueden ser capturadas por otros contextos.

## Clase: TypeError (Error de Tipo)

Una subclase de `Error` que indica que un argumento proporcionado no es de un tipo permitido. Por ejemplo, el pasar una función a un parámetro que espera una string sería considerado un `TypeError`.

```js
require('url').parse(() => { });
// arroja TypeError, ya que esperaba una string
```

Node.js generará y arrojará instancias de `TypeError` *inmediatamente* como una forma de validación de argumento.

## Excepciones vs. Errores<!--type=misc-->Una excepción de JavaScript es un valor que es arrojado como resultado de una operación inválida como el objetivo de una declaración de `throw`. Si bien no es obligatorio que estos valores sean instancias de `Error` o clases heredadas de `Error`, todas las excepciones arrojadas por Node.js o por el tiempo de ejecución de JavaScript *serán* instancias de `Error`.

Algunas excepciones son *irrecuperables* en la capa de JavaScript. Dichas excepciones *siempre* causarán que el proceso Node.js se detenga. Los ejemplos incluyen revisiones de `assert()` o llamadas a `abort()` en la capa de C++.

## Errores de Sistema

Node.js generates system errors when exceptions occur within its runtime environment. These usually occur when an application violates an operating system constraint. For example, a system error will occur if an application attempts to read a file that does not exist.

System errors are usually generated at the syscall level. For a comprehensive list, see the [`errno`(3) man page][].

In Node.js, system errors are `Error` objects with extra properties.

### Clase: SystemError (Error de Sistema)

* `address` {string} If present, the address to which a network connection failed
* `code` {string} El código de error de la string
* `dest` {string} If present, the file path destination when reporting a file system error
* `errno` {number|string} El número de error proporcionado por el sistema
* `info` {Object} If present, extra details about the error condition
* `message` {string} A system-provided human-readable description of the error
* `path` {string} If present, the file path when reporting a file system error
* `port` {number} If present, the network connection port that is not available
* `syscall` {string} El nombre de la llamada de sistema que desencadenó el error

#### error.address

* {string}

If present, `error.address` is a string describing the address to which a network connection failed.

#### error.code

* {string}

The `error.code` property is a string representing the error code.

#### error.dest

* {string}

If present, `error.dest` is the file path destination when reporting a file system error.

#### error.errno

* {string|number}

La propiedad `error.errno` es un número o una string. If it is a number, it is a negative value which corresponds to the error code defined in [`libuv Error handling`]. See the libuv `errno.h` header file (`deps/uv/include/uv/errno.h` in the Node.js source tree) for details. En caso de una string, es el mismo que `error.code`.

#### error.info

* {Object}

If present, `error.info` is an object with details about the error condition.

#### error.message

* {string}

`error.message` is a system-provided human-readable description of the error.

#### error.path

* {string}

If present, `error.path` is a string containing a relevant invalid pathname.

#### error.port

* {number}

If present, `error.port` is the network connection port that is not available.

#### error.syscall

* {string}

La propiedad `error.syscall` es una string que describe la [syscall](http://man7.org/linux/man-pages/man2/syscalls.2.html) que falló.

### Errores de Sistema Comunes

This is a list of system errors commonly-encountered when writing a Node.js program. For a comprehensive list, see the [`errno`(3) man page][].

- `EACCES` (Permiso denegado): Se intentó acceder a un archivo de una manera prohibida por sus permisos de acceso de archivo.

- `EADDRINUSE` (Dirección ya en uso): Un intento de enlazar un servidor ([`net`][], [`http`][] o [`https`][]) a una dirección local falló debido a que otro servidor en el sistema local ya está ocupando esa dirección.

- `ECONNREFUSED` (Conexión rechazada): No se pudo realizar ninguna conexión porque la máquina objetivo lo rechazó activamente. Esto generalmente resulta de intentar la conexión a un servicio que está inactivo en el host extranjero.

- `ECONNRESET` (Conexión reiniciada por el peer): Una conexión fue cerrada a la fuerza por un peer. Esto normalmente resulta de una pérdida de la conexión en el conector remoto debido al agotamiento del tiempo de espera o reinicio. Comúnmente encontrado mediante los módulos [`http`][] y [`net`][].

- `EEXIST` (El archivo existe): Un archivo existente fue el objetivo de una operación que requería que el objetivo no existiese.

- `EISDIR` (Es un directorio): Una operación esperaba un archivo, pero el nombre de la ruta dada era un directorio.

- `EMFILE` (Muchos archivos abiertos en el sistema): El número máximo de [descriptores de archivos](https://en.wikipedia.org/wiki/File_descriptor) permitidos en el sistema ha sido alcanzado y las solicitudes para otro descriptor no pueden cumplirse hasta que al menos uno haya sido cerrado. Esto ocurre al abrir muchos archivos a la vez en paralelo, especialmente en sistemas (macOS en particular) donde hay un límite de descriptor de archivos bajo para procesos. Para remediar un límite bajo, ejecute `ulimit -n 2048` en el mismo shell que ejecutará el proceso Node.js.

- `ENOENT` (No existe el archivo o directorio): Comúnmente levantado por operaciones [`fs`][] para indicar que un componente del nombre de ruta especificado no existe — no se pudo encontrar ninguna entidad (archivo o directorio) con la ruta dada.

- `ENOTDIR` (No es un directorio): Un componente del nombre de ruta dado existe, pero no era un directorio, como se esperaba. Comúnmente levantado por [`fs.readdir`][].

- `ENOTEMPTY` (Directorio no vacío): Un directorio con entradas fue el objetivo de una operación que requiere un directorio vacío — usualmente [`fs.unlink`][].

- `EPERM` (Operación no permitida): Se intentó realizar una operación que requiere privilegios elevados.

- `EPIPE` (Conductor dañado): Una escritura en un pipe, socket, o FIFO para el cual no existe un proceso para la lectura de los datos. Comúnmente encontrado en las capas [`net`][] y [`http`][], indicativos de que el lado remoto del stream en el que se escribe ha sido cerrado.

- `ETIMEDOUT` (Se agotó el tiempo de la operación): Una conexión o una solicitud enviada falló porque la parte conectada no respondió adecuadamente luego de un período de tiempo. Usualmente encontrado por [`http`][] o [`net`][] — a menudo, una señal de que `socket.end()` no fue llamado adecuadamente.

<a id="nodejs-error-codes"></a>

## Códigos de Error de Node.js

<a id="ERR_AMBIGUOUS_ARGUMENT"></a>

### ERR_AMBIGUOUS_ARGUMENT

A function argument is being used in a way that suggests that the function signature may be misunderstood. This is thrown by the `assert` module when the `message` parameter in `assert.throws(block, message)` matches the error message thrown by `block` because that usage suggests that the user believes `message` is the expected message rather than the message the `AssertionError` will display if `block` does not throw.

<a id="ERR_ARG_NOT_ITERABLE"></a>

### ERR_ARG_NOT_ITERABLE

Un argumento iterable (es decir, un valor que funciona con loops `for...of`) era requerido, pero no fue proporcionado a un API de Node.js.

<a id="ERR_ASSERTION"></a>

### ERR_ASSERTION

Un tipo especial de error que puede desencadenarse cada vez que Node.js detecte una violación lógica excepcional que nunca debería ocurrir. Estos son típicamente levantados por el módulo `assert`.

<a id="ERR_ASYNC_CALLBACK"></a>

### ERR_ASYNC_CALLBACK

Se intentó registrar algo que no es una función como un callback `AsyncHooks`.

<a id="ERR_ASYNC_TYPE"></a>

### ERR_ASYNC_TYPE

El tipo de una fuente asincrónica era inválido. Los usuarios son capaces de definir su propio type al usar la API pública del embebedor.

<a id="ERR_BROTLI_COMPRESSION_FAILED"></a>

### ERR_BROTLI_COMPRESSION_FAILED

Data passed to a Brotli stream was not successfully compressed.

<a id="ERR_BROTLI_INVALID_PARAM"></a>

### ERR_BROTLI_INVALID_PARAM

An invalid parameter key was passed during construction of a Brotli stream.

<a id="ERR_BUFFER_OUT_OF_BOUNDS"></a>

### ERR_BUFFER_OUT_OF_BOUNDS

Se intentó una operación afuera de los límites de un `Buffer`.

<a id="ERR_BUFFER_TOO_LARGE"></a>

### ERR_BUFFER_TOO_LARGE

Se intentó crear un `Buffer` más grande que el tamaño máximo permitido.

<a id="ERR_CANNOT_TRANSFER_OBJECT"></a>

### ERR_CANNOT_TRANSFER_OBJECT

The value passed to `postMessage()` contained an object that is not supported for transferring.

<a id="ERR_CANNOT_WATCH_SIGINT"></a>

### ERR_CANNOT_WATCH_SIGINT

Node.js no pudo ver la señal `SIGINT`.

<a id="ERR_CHILD_CLOSED_BEFORE_REPLY"></a>

### ERR_CHILD_CLOSED_BEFORE_REPLY

Se cerró un proceso secundario antes de que el proceso primario recibiese una respuesta.

<a id="ERR_CHILD_PROCESS_IPC_REQUIRED"></a>

### ERR_CHILD_PROCESS_IPC_REQUIRED

Utilizado cuando se bifurca un proceso secundario sin especificar un canal IPC.

<a id="ERR_CHILD_PROCESS_STDIO_MAXBUFFER"></a>

### ERR_CHILD_PROCESS_STDIO_MAXBUFFER

Used when the main process is trying to read data from the child process's STDERR/STDOUT, and the data's length is longer than the `maxBuffer` option.

<a id="ERR_CLOSED_MESSAGE_PORT"></a>

### ERR_CLOSED_MESSAGE_PORT

There was an attempt to use a `MessagePort` instance in a closed state, usually after `.close()` has been called.

<a id="ERR_CONSOLE_WRITABLE_STREAM"></a>

### ERR_CONSOLE_WRITABLE_STREAM

La `Console` fue instanciada sin el stream `stdout` o la `Console` tiene un stream `stdout` o `stderr` no escribible.

<a id="ERR_CONSTRUCT_CALL_REQUIRED"></a>

### ERR_CONSTRUCT_CALL_REQUIRED

A constructor for a class was called without `new`.

<a id="ERR_CPU_USAGE"></a>

### ERR_CPU_USAGE

La llamada nativa de `process.cpuUsage` no pudo ser procesada.

<a id="ERR_CRYPTO_CUSTOM_ENGINE_NOT_SUPPORTED"></a>

### ERR_CRYPTO_CUSTOM_ENGINE_NOT_SUPPORTED

Se solicitó un motor de certificado de cliente que no es compatible con la versión de OpenSSL que se está utilizando.

<a id="ERR_CRYPTO_ECDH_INVALID_FORMAT"></a>

### ERR_CRYPTO_ECDH_INVALID_FORMAT

Un valor no válido para el argumento `format` fue pasado al método `getPublicKey()` de la clase `crypto.ECDH()`.

<a id="ERR_CRYPTO_ECDH_INVALID_PUBLIC_KEY"></a>

### ERR_CRYPTO_ECDH_INVALID_PUBLIC_KEY

Un valor no válido para el argumento `key` fue pasado al método `computeSecret()` de la clase `crypto.ECDH()`. Significa que la clave pública está fuera de la curva elíptica.

<a id="ERR_CRYPTO_ENGINE_UNKNOWN"></a>

### ERR_CRYPTO_ENGINE_UNKNOWN

Se pasó un identificador de motor criptográfico inválido a [`require('crypto').setEngine()`][].

<a id="ERR_CRYPTO_FIPS_FORCED"></a>

### ERR_CRYPTO_FIPS_FORCED

El argumento de línea de comando [`--force-fips`][] fue utilizado, pero hubo un intento para habilitar o inhabilitar el modo FIPS en el módulo `crypto`.

<a id="ERR_CRYPTO_FIPS_UNAVAILABLE"></a>

### ERR_CRYPTO_FIPS_UNAVAILABLE

Se intentó habilitar o inhabilitar el modo FIPS, pero el modo FIPS no estaba disponible.

<a id="ERR_CRYPTO_HASH_DIGEST_NO_UTF16"></a>

### ERR_CRYPTO_HASH_DIGEST_NO_UTF16

La codificación UTF-16 fue usada con [`hash.digest()`][]. Mientras que el método `hash.digest()` permite que se pase un argumento `encoding`, causando que el método devuelva una string en lugar de un `Buffer`, la codificación UTF-16 (por ejemplo, `ucs` o `utf16le`) no es soportada.

<a id="ERR_CRYPTO_HASH_FINALIZED"></a>

### ERR_CRYPTO_HASH_FINALIZED

[`hash.digest()`][] fue llamado múltiples veces. El método `hash.digest()` debe ser llamado no más de una vez por instancia de un objeto `Hash`.

<a id="ERR_CRYPTO_HASH_UPDATE_FAILED"></a>

### ERR_CRYPTO_HASH_UPDATE_FAILED

[`hash.update()`][] falló por alguna razón. Esto debería ocurrir raramente, si es que ocurre alguna vez.

<a id="ERR_CRYPTO_INCOMPATIBLE_KEY_OPTIONS"></a>

### ERR_CRYPTO_INCOMPATIBLE_KEY_OPTIONS

The selected public or private key encoding is incompatible with other options.

<a id="ERR_CRYPTO_INVALID_DIGEST"></a>

### ERR_CRYPTO_INVALID_DIGEST

Se especificó un [alogoritmo de cripto síntesis ](crypto.html#crypto_crypto_gethashes) inválido.

<a id="ERR_CRYPTO_INVALID_STATE"></a>

### ERR_CRYPTO_INVALID_STATE

Se utilizó un método criptográfico en un objeto que estaba en un estado inválido. Por ejemplo, el llamar a [`cipher.getAuthTag()`][] antes de llamar a `cipher.final()`.

<a id="ERR_CRYPTO_PBKDF2_ERROR"></a>

### ERR_CRYPTO_PBKDF2_ERROR

The PBKDF2 algorithm failed for unspecified reasons. OpenSSL does not provide more details and therefore neither does Node.js.

<a id="ERR_CRYPTO_SCRYPT_INVALID_PARAMETER"></a>

### ERR_CRYPTO_SCRYPT_INVALID_PARAMETER

One or more [`crypto.scrypt()`][] or [`crypto.scryptSync()`][] parameters are outside their legal range.

<a id="ERR_CRYPTO_SCRYPT_NOT_SUPPORTED"></a>

### ERR_CRYPTO_SCRYPT_NOT_SUPPORTED

Node.js was compiled without `scrypt` support. Not possible with the official release binaries but can happen with custom builds, including distro builds.

<a id="ERR_CRYPTO_SIGN_KEY_REQUIRED"></a>

### ERR_CRYPTO_SIGN_KEY_REQUIRED

No se proveyó una `clave` para el método [`sign.sign()`][].

<a id="ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH"></a>

### ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH

[`crypto.timingSafeEqual()`][] fue llamado con argumentos `Buffer`, `TypedArray` o `DataView` de diferentes tamaños.

<a id="ERR_DNS_SET_SERVERS_FAILED"></a>

### ERR_DNS_SET_SERVERS_FAILED

`c-ares` falló al establecer el servidor DNS.

<a id="ERR_DOMAIN_CALLBACK_NOT_AVAILABLE"></a>

### ERR_DOMAIN_CALLBACK_NOT_AVAILABLE

El módulo `domain` no se pudo utilizar porque no se pudo establecer los hooks requeridos para el manejor de error, porque se llamo a [`process.setUncaughtExceptionCaptureCallback()`][] antes.

<a id="ERR_DOMAIN_CANNOT_SET_UNCAUGHT_EXCEPTION_CAPTURE"></a>

### ERR_DOMAIN_CANNOT_SET_UNCAUGHT_EXCEPTION_CAPTURE

[`process.setUncaughtExceptionCaptureCallback()`][] no pudo ser llamado porque el módulo `domain` ha sido cargado en un punto anterior en el tiempo.

El stack trace es extendido para incluir el punto en el tiempo en el cual el módulo `domain` haya sido cargado.

<a id="ERR_ENCODING_INVALID_ENCODED_DATA"></a>

### ERR_ENCODING_INVALID_ENCODED_DATA

Los datos proporcionados a la API `util.TextDecoder()` eran inválidos, de acuerdo a la codificación proporcionada.

<a id="ERR_ENCODING_NOT_SUPPORTED"></a>

### ERR_ENCODING_NOT_SUPPORTED

La codificación proporcionada a la API `util.TextDecoder()` no era una de las [Codificaciones Soportadas por WHATWG](util.html#util_whatwg_supported_encodings).

<a id="ERR_FALSY_VALUE_REJECTION"></a>

### ERR_FALSY_VALUE_REJECTION

Una `Promise` que se llamó como callback via `util.callbackify()` se rechazó con un valor falso.

<a id="ERR_FS_FILE_TOO_LARGE"></a>

### ERR_FS_FILE_TOO_LARGE

Se intentó leer un archivo cuyo tamaño era mayor que el tamaño máximo permitido para un `Buffer`.

<a id="ERR_FS_INVALID_SYMLINK_TYPE"></a>

### ERR_FS_INVALID_SYMLINK_TYPE

Se pasó un tipo de symlink inválido a los métodos [`fs.symlink()`][] o [`fs.symlinkSync()`][].

<a id="ERR_HTTP_HEADERS_SENT"></a>

### ERR_HTTP_HEADERS_SENT

Se intentó añadir más encabezados después de que los encabezados ya fueron enviados.

<a id="ERR_HTTP_INVALID_HEADER_VALUE"></a>

### ERR_HTTP_INVALID_HEADER_VALUE

Se especifico un valor de encabezado HTTP inválido.

<a id="ERR_HTTP_INVALID_STATUS_CODE"></a>

### ERR_HTTP_INVALID_STATUS_CODE

El código de estado estaba fuera del rango de código de estado regular (100-999).

<a id="ERR_HTTP_TRAILER_INVALID"></a>

### ERR_HTTP_TRAILER_INVALID

El encabezado `Trailer` fue establecido incluso a pesar de que la codificación de transferencia no soporta eso.

<a id="ERR_HTTP2_ALTSVC_INVALID_ORIGIN"></a>

### ERR_HTTP2_ALTSVC_INVALID_ORIGIN

Las estructuras HTTP/2 ALTSVC requieren un origen válido.

<a id="ERR_HTTP2_ALTSVC_LENGTH"></a>

### ERR_HTTP2_ALTSVC_LENGTH

Las estructuras HTTP/2 ALTSVC están limitadas a un máximo de 16,382 bytes de carga útil.

<a id="ERR_HTTP2_CONNECT_AUTHORITY"></a>

### ERR_HTTP2_CONNECT_AUTHORITY

Para las solicitudes HTTP/2 que utilizan el método `CONNECT`, el pseudo encabezado `:authority` es requerido.

<a id="ERR_HTTP2_CONNECT_PATH"></a>

### ERR_HTTP2_CONNECT_PATH

Para las solicitudes HTTP/2 que utilizan el método `CONNECT`, el pseudo encabezado `:path` está prohibido.

<a id="ERR_HTTP2_CONNECT_SCHEME"></a>

### ERR_HTTP2_CONNECT_SCHEME

Para las solicitudes HTTP/2 que utilizan el método `CONNECT`, el pseudo encabezado `:scheme` está prohibido.

<a id="ERR_HTTP2_ERROR"></a>

### ERR_HTTP2_ERROR

A non-specific HTTP/2 error has occurred.

<a id="ERR_HTTP2_GOAWAY_SESSION"></a>

### ERR_HTTP2_GOAWAY_SESSION

Los nuevos Streams HTTP/2 pueden no estar abiertos luego de que `Http2Session` haya recibido un frame `GOAWAY` del peer conectado.

<a id="ERR_HTTP2_HEADERS_AFTER_RESPOND"></a>

### ERR_HTTP2_HEADERS_AFTER_RESPOND

Se especificaron headers adicionales después de que se inició una respuesta HTTP/2.

<a id="ERR_HTTP2_HEADERS_SENT"></a>

### ERR_HTTP2_HEADERS_SENT

Se intentó enviar múltiples encabezados de respuesta.

<a id="ERR_HTTP2_HEADER_SINGLE_VALUE"></a>

### ERR_HTTP2_HEADER_SINGLE_VALUE

Se proporcionaron múltiples valores para un campo de encabezado HTTP/2 que requería tener sólo un valor simple.

<a id="ERR_HTTP2_INFO_STATUS_NOT_ALLOWED"></a>

### ERR_HTTP2_INFO_STATUS_NOT_ALLOWED

Los códigos de estado HTTP informativos (`1xx`) pueden no estar establecidos como el código de estado de respuesta en respuestas de HTTP/2.

<a id="ERR_HTTP2_INVALID_CONNECTION_HEADERS"></a>

### ERR_HTTP2_INVALID_CONNECTION_HEADERS

Los encabezados específicos de conexión HTTP/1 están prohibidos de ser usados en solicitudes y respuestas de HTTP/2.

<a id="ERR_HTTP2_INVALID_HEADER_VALUE"></a>

### ERR_HTTP2_INVALID_HEADER_VALUE

Se especificó un valor de encabezado HTTP/2 inválido.

<a id="ERR_HTTP2_INVALID_INFO_STATUS"></a>

### ERR_HTTP2_INVALID_INFO_STATUS

Se especificó un código de estado informativo de HTTP inválido. Los códigos de estado informativos deben ser un número entero entre `100` y `199` (ambos incluidos).

<a id="ERR_HTTP2_INVALID_ORIGIN"></a>

### ERR_HTTP2_INVALID_ORIGIN

HTTP/2 `ORIGIN` frames require a valid origin.

<a id="ERR_HTTP2_INVALID_PACKED_SETTINGS_LENGTH"></a>

### ERR_HTTP2_INVALID_PACKED_SETTINGS_LENGTH

Las instancias de entrada `Buffer` y `Uint8Array` pasadas a la API `http2.getUnpackedSettings()` deben tener un tamaño que sea múltiplo de seis.

<a id="ERR_HTTP2_INVALID_PSEUDOHEADER"></a>

### ERR_HTTP2_INVALID_PSEUDOHEADER

Sólo pueden ser usados los pseudo encabezados de HTTP/2 (`:status`, `:path`, `:authority`, `:scheme` y `:method`).

<a id="ERR_HTTP2_INVALID_SESSION"></a>

### ERR_HTTP2_INVALID_SESSION

Se realizó una acción en un objeto `Http2Session` que ya se había destruido.

<a id="ERR_HTTP2_INVALID_SETTING_VALUE"></a>

### ERR_HTTP2_INVALID_SETTING_VALUE

Se ha especificado un valor inválido para una configuración de HTTP/2.

<a id="ERR_HTTP2_INVALID_STREAM"></a>

### ERR_HTTP2_INVALID_STREAM

Se realizó una operación en un stream que ya había sido destruido.

<a id="ERR_HTTP2_MAX_PENDING_SETTINGS_ACK"></a>

### ERR_HTTP2_MAX_PENDING_SETTINGS_ACK

Cada vez que un frame `SETTINGS` de HTTP/2 es enviado a un peer conectado, se le solicita al peer enviar una confirmación de que ha recibido y aplicado la nueva `SETTINGS`. Por defecto, el número máximo de frames `SETTINGS` sin confirmar puede ser enviado en cualquier momento. Este código error es utilizado cuando se ha alcanzado ese límite.

<a id="ERR_HTTP2_NESTED_PUSH"></a>

### ERR_HTTP2_NESTED_PUSH

An attempt was made to initiate a new push stream from within a push stream. Nested push streams are not permitted.

<a id="ERR_HTTP2_NO_SOCKET_MANIPULATION"></a>

### ERR_HTTP2_NO_SOCKET_MANIPULATION

Se intentó manipular directamente (leer, escribir, pausar, resumir, etc.) un socket adjunto a un `Http2Session`.

<a id="ERR_HTTP2_ORIGIN_LENGTH"></a>

### ERR_HTTP2_ORIGIN_LENGTH

HTTP/2 `ORIGIN` frames are limited to a length of 16382 bytes.

<a id="ERR_HTTP2_OUT_OF_STREAMS"></a>

### ERR_HTTP2_OUT_OF_STREAMS

El número de streams creados en una sesión de HTTP/2 simple alcanzó el límite máximo.

<a id="ERR_HTTP2_PAYLOAD_FORBIDDEN"></a>

### ERR_HTTP2_PAYLOAD_FORBIDDEN

Una carga de mensajes fue especificada para un código de respuesta HTTP al cual se le prohibió una carga de mensajes.

<a id="ERR_HTTP2_PING_CANCEL"></a>

### ERR_HTTP2_PING_CANCEL

Se canceló un ping HTTP/2.

<a id="ERR_HTTP2_PING_LENGTH"></a>

### ERR_HTTP2_PING_LENGTH

Las cargas de ping HTTP/2 debe ser exactamente de 8 bytes de longitud.

<a id="ERR_HTTP2_PSEUDOHEADER_NOT_ALLOWED"></a>

### ERR_HTTP2_PSEUDOHEADER_NOT_ALLOWED

Se utilizó un pseudo encabezado HTTP/2 inapropiadamente. Los pseudo encabezados son nombres de claves de encabezado que empiezan con el prefijo `:`.

<a id="ERR_HTTP2_PUSH_DISABLED"></a>

### ERR_HTTP2_PUSH_DISABLED

Se intentó crear un push stream, el cual había sido inhabilitado por el cliente.

<a id="ERR_HTTP2_SEND_FILE"></a>

### ERR_HTTP2_SEND_FILE

Se intentó utilizar el API `Http2Stream.prototype.responseWithFile()` para enviar un directorio.

<a id="ERR_HTTP2_SEND_FILE_NOSEEK"></a>

### ERR_HTTP2_SEND_FILE_NOSEEK

Se intentó utilizar el API `Http2Stream.prototype.responseWithFile()` para enviar algo distinto a un archivo regular, pero se proporcionaron las opciones `offset` o `length`.

<a id="ERR_HTTP2_SESSION_ERROR"></a>

### ERR_HTTP2_SESSION_ERROR

La `Http2Session` cerró con un código de error distinto de cero.

<a id="ERR_HTTP2_SETTINGS_CANCEL"></a>

### ERR_HTTP2_SETTINGS_CANCEL

The `Http2Session` settings canceled.

<a id="ERR_HTTP2_SOCKET_BOUND"></a>

### ERR_HTTP2_SOCKET_BOUND

Se intentó conectar un objeto `Http2Session` a un `net.Socket` o `tls.TLSSocket` que ya había sido ligado a otro objeto `Http2Session`.

<a id="ERR_HTTP2_SOCKET_UNBOUND"></a>

### ERR_HTTP2_SOCKET_UNBOUND

An attempt was made to use the `socket` property of an `Http2Session` that has already been closed.

<a id="ERR_HTTP2_STATUS_101"></a>

### ERR_HTTP2_STATUS_101

El uso del código de estado Informativo `101` está prohibido en HTTP/2.

<a id="ERR_HTTP2_STATUS_INVALID"></a>

### ERR_HTTP2_STATUS_INVALID

Se especificó un código de estado HTTP inválido. Los códigos de estado deben ser un número entero entre `100` y `599` (ambos incluidos).

<a id="ERR_HTTP2_STREAM_CANCEL"></a>

### ERR_HTTP2_STREAM_CANCEL

Se destruyó un `Http2Stream` antes de que se transmitiera cualquier dato al peer conectado.

<a id="ERR_HTTP2_STREAM_ERROR"></a>

### ERR_HTTP2_STREAM_ERROR

Se especificó un código de error distinto de cero en un frame `RST_STREAM`.

<a id="ERR_HTTP2_STREAM_SELF_DEPENDENCY"></a>

### ERR_HTTP2_STREAM_SELF_DEPENDENCY

Al configurar la prioridad para un stream HTTP/2, el stream puede ser marcado como una dependencia para un stream primario. Este código de error es utilizado cuando se intenta marcar un stream y depende de él.

<a id="ERR_HTTP2_TRAILERS_ALREADY_SENT"></a>

### ERR_HTTP2_TRAILERS_ALREADY_SENT

Ya se enviaron header de cierre al `Http2Stream`.

<a id="ERR_HTTP2_TRAILERS_NOT_READY"></a>

### ERR_HTTP2_TRAILERS_NOT_READY

El método `http2stream.sendTrailers()` no puede ser llamado hasta después de emitido el evento `'wantTrailers'` en un objeto `Http2Stream`. El evento `'wantTrailers'` sólo será emitido si la opción `waitForTrailers` es establecida para el `Http2Stream`.

<a id="ERR_HTTP2_UNSUPPORTED_PROTOCOL"></a>

### ERR_HTTP2_UNSUPPORTED_PROTOCOL

Se le pasó a `http2.connect()` una URL que utiliza cualquier protocolo distinto de `http:` o `https:`.

<a id="ERR_INDEX_OUT_OF_RANGE"></a>

### ERR_INDEX_OUT_OF_RANGE

Un índice dado estaba afuera del rango aceptado (p. ej, offsets negativos).

<a id="ERR_INSPECTOR_ALREADY_CONNECTED"></a>

### ERR_INSPECTOR_ALREADY_CONNECTED

Se hizo un intento conexión mientras se utilizaba el módulo `inspector` cuando este ya estaba conectado.

<a id="ERR_INSPECTOR_CLOSED"></a>

### ERR_INSPECTOR_CLOSED

Mientras se utilizaba el módulo ` inspector `, se intentó utilizar el inspector después que la sesión ya había cerrado.

<a id="ERR_INSPECTOR_NOT_AVAILABLE"></a>

### ERR_INSPECTOR_NOT_AVAILABLE

No está disponible el uso del módulo `inspector`.

<a id="ERR_INSPECTOR_NOT_CONNECTED"></a>

### ERR_INSPECTOR_NOT_CONNECTED

Mientras se utilizaba el módulo `inspector`, se intentó utilizar el inspector antes de que se conectara.

<a id="ERR_INVALID_ADDRESS_FAMILY"></a>

### ERR_INVALID_ADDRESS_FAMILY

La familia de direcciones provista no se puede interpretar por la API Node.js.

<a id="ERR_INVALID_ARG_TYPE"></a>

### ERR_INVALID_ARG_TYPE

Se pasó un argumento de tipo erróneo a un API Node.js.

<a id="ERR_INVALID_ARG_VALUE"></a>

### ERR_INVALID_ARG_VALUE

Se pasó un valor inválido o no soportado por un argumento dado.

<a id="ERR_INVALID_ARRAY_LENGTH"></a>

### ERR_INVALID_ARRAY_LENGTH

Un arraya no tenía el largo esperado o un tenía un rango inválido.

<a id="ERR_INVALID_ASYNC_ID"></a>

### ERR_INVALID_ASYNC_ID

Se pasó un `asyncId` o `triggerAsyncId` inválido usando `AsyncHooks`. No debe ocurrir nunca un id menor que -1.

<a id="ERR_INVALID_BUFFER_SIZE"></a>

### ERR_INVALID_BUFFER_SIZE

Se realizó un intercambio en un `Buffer`, pero su tamaño no era compatible con la operación.

<a id="ERR_INVALID_CALLBACK"></a>

### ERR_INVALID_CALLBACK

Se requirió una función callback, pero no fue proporcionada a un API de Node.js.

<a id="ERR_INVALID_CHAR"></a>

### ERR_INVALID_CHAR

Se detectaron caracteres inválidos en encabezados.

<a id="ERR_INVALID_CURSOR_POS"></a>

### ERR_INVALID_CURSOR_POS

No se puede mover un cursor en un stream dado a una file especificada sin una columna especificada.

<a id="ERR_INVALID_DOMAIN_NAME"></a>

### ERR_INVALID_DOMAIN_NAME

`hostname` no puede ser analizado desde una URL proporcionada.

<a id="ERR_INVALID_FD"></a>

### ERR_INVALID_FD

Un descriptor de archivo ('fd') no era válido (p. ej., era un valor negativo).

<a id="ERR_INVALID_FD_TYPE"></a>

### ERR_INVALID_FD_TYPE

Un tipo de descriptor de archivo ('fd') no era válido.

<a id="ERR_INVALID_FILE_URL_HOST"></a>

### ERR_INVALID_FILE_URL_HOST

Un API Node.js que consume URLs de `file:` (como ciertas funciones en el módulo [`fs`][]) encontró una URL de un archivo con un host incompatible. Esta situación sólo puede ocurrir en sistemas tipo Unix donde sólo se soportan `localhost` o un host vacío.

<a id="ERR_INVALID_FILE_URL_PATH"></a>

### ERR_INVALID_FILE_URL_PATH

Un API Node.js que consume URLs de `file:` (como ciertas funciones en el módulo [`fs`][]) encontró una URL de de un archivo con una ruta incompatible. La semántica exacta para determinar si se puede usar una ruta es dependiente de la plataforma.

<a id="ERR_INVALID_HANDLE_TYPE"></a>

### ERR_INVALID_HANDLE_TYPE

Se intentó enviar un "handle" no soportado sobre un canal de comunicación IPC a un proceso secundario. Vea [`subprocess.send()`] y [`process.send()`] para más información.

<a id="ERR_INVALID_HTTP_TOKEN"></a>

### ERR_INVALID_HTTP_TOKEN

Se proporcionó un token de HTTP inválido.

<a id="ERR_INVALID_IP_ADDRESS"></a>

### ERR_INVALID_IP_ADDRESS

Una dirección IP no es válida.

<a id="ERR_INVALID_OPT_VALUE"></a>

### ERR_INVALID_OPT_VALUE

Se pasó un valor inválido o inesperado en un objeto de opciones.

<a id="ERR_INVALID_OPT_VALUE_ENCODING"></a>

### ERR_INVALID_OPT_VALUE_ENCODING

Se pasó una codificación de archivo inválida o desconocida.

<a id="ERR_INVALID_PERFORMANCE_MARK"></a>

### ERR_INVALID_PERFORMANCE_MARK

Al usar el API de Tiempo de Rendimiento (`perf_hooks`), una marca de rendimiento es inválida.

<a id="ERR_INVALID_PROTOCOL"></a>

### ERR_INVALID_PROTOCOL

Se pasó un `options.protocol` inválido.

<a id="ERR_INVALID_REPL_EVAL_CONFIG"></a>

### ERR_INVALID_REPL_EVAL_CONFIG

Las opciones `breakEvalOnSigint` y `eval` se establecieron en la configuración REPL, la cual no es soportada.

<a id="ERR_INVALID_RETURN_PROPERTY"></a>

### ERR_INVALID_RETURN_PROPERTY

Thrown in case a function option does not provide a valid value for one of its returned object properties on execution.

<a id="ERR_INVALID_RETURN_PROPERTY_VALUE"></a>

### ERR_INVALID_RETURN_PROPERTY_VALUE

Thrown in case a function option does not provide an expected value type for one of its returned object properties on execution.

<a id="ERR_INVALID_RETURN_VALUE"></a>

### ERR_INVALID_RETURN_VALUE

Thrown in case a function option does not return an expected value type on execution, such as when a function is expected to return a promise.

<a id="ERR_INVALID_SYNC_FORK_INPUT"></a>

### ERR_INVALID_SYNC_FORK_INPUT

A `Buffer`, `TypedArray`, `DataView` or `string` was provided as stdio input to an asynchronous fork. Vea la documentación para el módulo [`child_process`][] para más información.

<a id="ERR_INVALID_THIS"></a>

### ERR_INVALID_THIS

Se llamó una función API de Node.js con un valor `this` incompatible.

```js
const urlSearchParams = new URLSearchParams('foo=bar&baz=new');

const buf = Buffer.alloc(1);
urlSearchParams.has.call(buf, 'foo');
// Arroja un TypeError con el código 'ERR_INVALID_THIS'
```

<a id="ERR_INVALID_TRANSFER_OBJECT"></a>

### ERR_INVALID_TRANSFER_OBJECT

An invalid transfer object was passed to `postMessage()`.

<a id="ERR_INVALID_TUPLE"></a>

### ERR_INVALID_TUPLE

Un elemento en el `iterable` proporcionado al [WHATWG](url.html#url_the_whatwg_url_api) [`URLSearchParams` constructor][`new URLSearchParams(iterable)`] no representó una dupla `[name, value]` - es decir, si un elemento no es iterable o no consiste en dos elementos exactos.

<a id="ERR_INVALID_URI"></a>

### ERR_INVALID_URI

Se pasó una URI inválida.

<a id="ERR_INVALID_URL"></a>

### ERR_INVALID_URL

Se pasó una URL inválida al [WHATWG](url.html#url_the_whatwg_url_api) [`URL` constructor][`new URL(input)`] para ser analizada. El objeto de error arrojado típicamente tiene una propiedad `'input'` adicional que contiene la URL que falló al analisar.

<a id="ERR_INVALID_URL_SCHEME"></a>

### ERR_INVALID_URL_SCHEME

Se intentó usar una URL de un esquema (protocolo) incompatible con un propósito específico. Sólo se soporta la [WHATWG URL API](url.html#url_the_whatwg_url_api) en el módulo [`fs`][] (que acepta sólo URLs con el esquema `'file'`), pero puedo que sea usado también en otras APIs Node.js APIs a futuro.

<a id="ERR_IPC_CHANNEL_CLOSED"></a>

### ERR_IPC_CHANNEL_CLOSED

Se intentó usar un canal de comunicación IPC que ya estaba cerrado.

<a id="ERR_IPC_DISCONNECTED"></a>

### ERR_IPC_DISCONNECTED

Se intentó desconectar un canal de comunicación IPC que ya estaba desconectado. Vea la documentación para el módulo [`child_process`][] para más información.

<a id="ERR_IPC_ONE_PIPE"></a>

### ERR_IPC_ONE_PIPE

Se intentó crear un proceso Node.js secundario utilizando más de un canal de comunicación IPC. Vea la documentación para el módulo [`child_process`][] para más información.

<a id="ERR_IPC_SYNC_FORK"></a>

### ERR_IPC_SYNC_FORK

Se intentó abrir un canal de comunicación IPC con un proceso Node.js originado en un fork síncrono. Vea la documentación para el módulo [`child_process`][] para más información.

<a id="ERR_MEMORY_ALLOCATION_FAILED"></a>

### ERR_MEMORY_ALLOCATION_FAILED

Se hizo un intento de asignar memoria (usualmente en la capa C++), pero falló.

<a id="ERR_METHOD_NOT_IMPLEMENTED"></a>

### ERR_METHOD_NOT_IMPLEMENTED

Se requiere un método pero no se implementa.

<a id="ERR_MISSING_ARGS"></a>

### ERR_MISSING_ARGS

No se pasó un argumento de API de Node.js requerido. Esto sólo se usa para el cumplimiento estricto con la especificación API (la cual, en algunos casos, puede aceptar `func(undefined)`, pero no `func()`). En la mayoría de las APIs de Node.js nativas, `func(undefined)` y `func()` son tratados de igual manera, y el código de error [`ERR_INVALID_ARG_TYPE`][] puede ser utilizado en su lugar.

<a id="ERR_MISSING_DYNAMIC_INSTANTIATE_HOOK"></a>

### ERR_MISSING_DYNAMIC_INSTANTIATE_HOOK

> Estabilidad: 1 - Experimental

An [ES6 module](esm.html) loader hook specified `format: 'dynamic'` but did not provide a `dynamicInstantiate` hook.

<a id="ERR_MISSING_MESSAGE_PORT_IN_TRANSFER_LIST"></a>

### ERR_MISSING_MESSAGE_PORT_IN_TRANSFER_LIST

A `MessagePort` was found in the object passed to a `postMessage()` call, but not provided in the `transferList` for that call.

<a id="ERR_MISSING_MODULE"></a>

### ERR_MISSING_MODULE

> Estabilidad: 1 - Experimental

No se pudo resolver un [módulo ES6](esm.html).

<a id="ERR_MISSING_PLATFORM_FOR_WORKER"></a>

### ERR_MISSING_PLATFORM_FOR_WORKER

The V8 platform used by this instance of Node.js does not support creating Workers. This is caused by lack of embedder support for Workers. In particular, this error will not occur with standard builds of Node.js.

<a id="ERR_MODULE_RESOLUTION_LEGACY"></a>

### ERR_MODULE_RESOLUTION_LEGACY

> Estabilidad: 1 - Experimental

Ocurrió un fallo al resolver importaciones en un [módulo ES6](esm.html).

<a id="ERR_MULTIPLE_CALLBACK"></a>

### ERR_MULTIPLE_CALLBACK

Se llamó un callback más de una vez.

Un callback está pensado para usarse casi siempre una sola vez dado que una llamada puede ser compleada o rechazada pero no las dos cosas al mismo tiempo. Esto último podría pasar si se llama a un callback más de una vez.

<a id="ERR_NAPI_CONS_FUNCTION"></a>

### ERR_NAPI_CONS_FUNCTION

Mientras se utilizaba `N-API`, se pasó un constructor que no era una función.

<a id="ERR_NAPI_INVALID_DATAVIEW_ARGS"></a>

### ERR_NAPI_INVALID_DATAVIEW_ARGS

Mientras se llamaba a `napi_create_dataview()`, un `offset` dado estaba fuera de los límites del dataview u `offset + length` era más grande que una longitud del `buffer` dado.

<a id="ERR_NAPI_INVALID_TYPEDARRAY_ALIGNMENT"></a>

### ERR_NAPI_INVALID_TYPEDARRAY_ALIGNMENT

Mientras se llamaba a `napi_create_typedarray()`, el `offset` proporcionado no era un múltiplo del tamaño del elemento.

<a id="ERR_NAPI_INVALID_TYPEDARRAY_LENGTH"></a>

### ERR_NAPI_INVALID_TYPEDARRAY_LENGTH

Mientras se llamaba a `napi_create_typedarray()`, `(length * size_of_element) +
byte_offset` era más grande que la longitud del `buffer` dado.

<a id="ERR_NAPI_TSFN_CALL_JS"></a>

### ERR_NAPI_TSFN_CALL_JS

An error occurred while invoking the JavaScript portion of the thread-safe function.

<a id="ERR_NAPI_TSFN_GET_UNDEFINED"></a>

### ERR_NAPI_TSFN_GET_UNDEFINED

An error occurred while attempting to retrieve the JavaScript `undefined` value.

<a id="ERR_NAPI_TSFN_START_IDLE_LOOP"></a>

### ERR_NAPI_TSFN_START_IDLE_LOOP

On the main thread, values are removed from the queue associated with the thread-safe function in an idle loop. This error indicates that an error has occurred when attempting to start the loop.

<a id="ERR_NAPI_TSFN_STOP_IDLE_LOOP"></a>

### ERR_NAPI_TSFN_STOP_IDLE_LOOP

Once no more items are left in the queue, the idle loop must be suspended. This error indicates that the idle loop has failed to stop.

<a id="ERR_NO_CRYPTO"></a>

### ERR_NO_CRYPTO

Se intento usar alguna capacidad criptográfica pero Node.js no se compiló para soportar criptografía OpenSSL.

<a id="ERR_NO_ICU"></a>

### ERR_NO_ICU

Se intentó utilizar características que requieren [ICU](intl.html#intl_internationalization_support), pero Node.js no fue compilado con soporte de ICU.

<a id="ERR_NO_LONGER_SUPPORTED"></a>

### ERR_NO_LONGER_SUPPORTED

Se llamó a un API de Node.js de una manera no soportada, como lo es `Buffer.write(string, encoding, offset[, length])`.

<a id="ERR_OUT_OF_RANGE"></a>

### ERR_OUT_OF_RANGE

Un valor dado está fuera del rango aceptado.

<a id="ERR_REQUIRE_ESM"></a>

### ERR_REQUIRE_ESM

> Estabilidad: 1 - Experimental

Hubo un intento para `require()` un [módulo ES6](esm.html).

<a id="ERR_SCRIPT_EXECUTION_INTERRUPTED"></a>

### ERR_SCRIPT_EXECUTION_INTERRUPTED

La ejecución de script fue interrumpida por `SIGINT` (Por ejemplo, cuando se presionó Ctrl+C).

<a id="ERR_SERVER_ALREADY_LISTEN"></a>

### ERR_SERVER_ALREADY_LISTEN

Se llamó al método [`server.listen()`][] mientras que un `net.Server` ya estaba escuchando. Esto aplica a todas las instancias de `net.Server`, incluyendo las instancias del `Server` HTTP, HTTPS y HTTP/2.

<a id="ERR_SERVER_NOT_RUNNING"></a>

### ERR_SERVER_NOT_RUNNING

Se llamó al método [`server.close()`][] cuando un `net.Server` no se estaba ejecutando. Esto aplica a todas las instancias de `net.Server`, incluyendo las instancias del `Server` HTTP, HTTPS y HTTP/2.

<a id="ERR_SOCKET_ALREADY_BOUND"></a>

### ERR_SOCKET_ALREADY_BOUND

Se intentó enlazar un socket que ya se había enlazado.

<a id="ERR_SOCKET_BAD_BUFFER_SIZE"></a>

### ERR_SOCKET_BAD_BUFFER_SIZE

Se pasó un tamaño inválido (negativo) para la opción `recvBufferSize` o `sendBufferSize` en [`dgram.createSocket()`][].

<a id="ERR_SOCKET_BAD_PORT"></a>

### ERR_SOCKET_BAD_PORT

An API function expecting a port >= 0 and < 65536 received an invalid value.

<a id="ERR_SOCKET_BAD_TYPE"></a>

### ERR_SOCKET_BAD_TYPE

Una función que esperaba un tipo de socket (`udp4` o `udp6`) recibió un valor inválido.

<a id="ERR_SOCKET_BUFFER_SIZE"></a>

### ERR_SOCKET_BUFFER_SIZE

Al usar [`dgram.createSocket()`][], el tamaño del `Buffer` de recepción o envío no pudo ser determinado.

<a id="ERR_SOCKET_CANNOT_SEND"></a>

### ERR_SOCKET_CANNOT_SEND

Los datos pudieron ser enviados en un socket.

<a id="ERR_SOCKET_CLOSED"></a>

### ERR_SOCKET_CLOSED

Se intentó operar en un socket que ya estaba cerrado.

<a id="ERR_SOCKET_DGRAM_NOT_RUNNING"></a>

### ERR_SOCKET_DGRAM_NOT_RUNNING

Se hizo una llamada y el subsistema UDP no estaba corriendo.

<a id="ERR_STREAM_CANNOT_PIPE"></a>

### ERR_STREAM_CANNOT_PIPE

Se intentó llamar a [`stream.pipe()`][] en un stream [`Writable`][].

<a id="ERR_STREAM_DESTROYED"></a>

### ERR_STREAM_DESTROYED

Se llamó a un método de stream que no puede completarse porque el stream fue destruido utilizando `stream.destroy()`.

<a id="ERR_STREAM_NULL_VALUES"></a>

### ERR_STREAM_NULL_VALUES

Se intentó llamar a [`stream.write()`][] con un fragmento `null`.

<a id="ERR_STREAM_PREMATURE_CLOSE"></a>

### ERR_STREAM_PREMATURE_CLOSE

Un error devuelto por `stream.finished()` y `stream.pipeline()`, cuando, sin ningún error explícito, un stream o pipeline se cierra sin gracia.

<a id="ERR_STREAM_PUSH_AFTER_EOF"></a>

### ERR_STREAM_PUSH_AFTER_EOF

Se intentó llamar a [`stream.push()`][] luego de que un `null`(EOF) fuera empujado al stream.

<a id="ERR_STREAM_UNSHIFT_AFTER_END_EVENT"></a>

### ERR_STREAM_UNSHIFT_AFTER_END_EVENT

Se intentó llamar a [`stream.unshift()`][] luego de que el evento `'end'` fuera emitido.

<a id="ERR_STREAM_WRAP"></a>

### ERR_STREAM_WRAP

Impide un aborto si un decodificador de string fue establecido en el Socket o si el decodificador está en `objectMode`.

```js
const Socket = require('net').Socket;
const instance = new Socket();

instance.setEncoding('utf8');
```

<a id="ERR_STREAM_WRITE_AFTER_END"></a>

### ERR_STREAM_WRITE_AFTER_END

Se intentó llamar a [`stream.write()`][] luego de que `stream.end()` fuera llamado.

<a id="ERR_STRING_TOO_LONG"></a>

### ERR_STRING_TOO_LONG

Se intentó crear una string más grande que el tamaño máximo permitido.

<a id="ERR_SYSTEM_ERROR"></a>

### ERR_SYSTEM_ERROR

Ha ocurrido un error de sistema no específico o sin especificar dentro del proceso de Node.js. El objeto error tendrá una propiedad de objeto `err.info` con detalles adicionales.

<a id="ERR_TLS_CERT_ALTNAME_INVALID"></a>

### ERR_TLS_CERT_ALTNAME_INVALID

While using TLS, the hostname/IP of the peer did not match any of the `subjectAltNames` in its certificate.

<a id="ERR_TLS_DH_PARAM_SIZE"></a>

### ERR_TLS_DH_PARAM_SIZE

Mientras se utilizaba TLS, el parámetro ofrecido para el protocolo de acuerdo de clave Diffle-Hellman (`DH`) es muy peuqeño. Por defecto, el tamaño de la clave debe ser mayor que o igual a 1024 bits para evitar vulnerabilidades, a pesar de que es altamente recomendado utilizar 2048 bits o más para una mayor seguridad.

<a id="ERR_TLS_HANDSHAKE_TIMEOUT"></a>

### ERR_TLS_HANDSHAKE_TIMEOUT

Se venció el tiempo después de inicio de una comunicación TLS/SSL. En este caso, el servidor debe también abortar la conexión.

<a id="ERR_TLS_INVALID_PROTOCOL_VERSION"></a>

### ERR_TLS_INVALID_PROTOCOL_VERSION

Valid TLS protocol versions are `'TLSv1'`, `'TLSv1.1'`, or `'TLSv1.2'`.

<a id="ERR_TLS_PROTOCOL_VERSION_CONFLICT"></a>

### ERR_TLS_PROTOCOL_VERSION_CONFLICT

Attempting to set a TLS protocol `minVersion` or `maxVersion` conflicts with an attempt to set the `secureProtocol` explicitly. Use one mechanism or the other.

<a id="ERR_TLS_RENEGOTIATE"></a>

### ERR_TLS_RENEGOTIATE

An attempt to renegotiate the TLS session failed.

<a id="ERR_TLS_RENEGOTIATION_DISABLED"></a>

### ERR_TLS_RENEGOTIATION_DISABLED

Se intentó renegociar TLS en una instancia de socket con TLS inhabilitado.

<a id="ERR_TLS_REQUIRED_SERVER_NAME"></a>

### ERR_TLS_REQUIRED_SERVER_NAME

Mientras se utilizaba TLS, se llamó al método `server.addContext()` sin proporcionar un nombre de host en el primer parámetro.

<a id="ERR_TLS_SESSION_ATTACK"></a>

### ERR_TLS_SESSION_ATTACK

Se detectó una cantidad excesiva de renegociaciones TLS, lo cual es un vector potencial para ataques de negación de servicio.

<a id="ERR_TLS_SNI_FROM_SERVER"></a>

### ERR_TLS_SNI_FROM_SERVER

An attempt was made to issue Server Name Indication from a TLS server-side socket, which is only valid from a client.

<a id="ERR_TRACE_EVENTS_CATEGORY_REQUIRED"></a>

### ERR_TRACE_EVENTS_CATEGORY_REQUIRED

El método `trace_events.createTracing()` requiere al menos una categoría de evento trace.

<a id="ERR_TRACE_EVENTS_UNAVAILABLE"></a>

### ERR_TRACE_EVENTS_UNAVAILABLE

El módulo `trace_events` no pudo ser cargado porque Node.js fue compilado con el flag `--without-v8-platform`.

<a id="ERR_TRANSFERRING_EXTERNALIZED_SHAREDARRAYBUFFER"></a>

### ERR_TRANSFERRING_EXTERNALIZED_SHAREDARRAYBUFFER

A `SharedArrayBuffer` whose memory is not managed by the JavaScript engine or by Node.js was encountered during serialization. Such a `SharedArrayBuffer` cannot be serialized.

This can only happen when native addons create `SharedArrayBuffer`s in "externalized" mode, or put existing `SharedArrayBuffer` into externalized mode.

<a id="ERR_TRANSFORM_ALREADY_TRANSFORMING"></a>

### ERR_TRANSFORM_ALREADY_TRANSFORMING

Un stream `Transform` terminó mientras todavía se estaba transformando.

<a id="ERR_TRANSFORM_WITH_LENGTH_0"></a>

### ERR_TRANSFORM_WITH_LENGTH_0

Un stream `Transform` terminó mientras aún tenía datos en el búfer de escritura.

<a id="ERR_TTY_INIT_FAILED"></a>

### ERR_TTY_INIT_FAILED

La inicialización de un TTY falló debido a un error de sistema.

<a id="ERR_UNCAUGHT_EXCEPTION_CAPTURE_ALREADY_SET"></a>

### ERR_UNCAUGHT_EXCEPTION_CAPTURE_ALREADY_SET

Se llamó dos veces a [`process.setUncaughtExceptionCaptureCallback()`][], sin primero reiniciar el callback a `null`.

Este error está diseñado para prevenir sobrescribir accidentalmente un callback registrado desde otro módulo.

<a id="ERR_UNESCAPED_CHARACTERS"></a>

### ERR_UNESCAPED_CHARACTERS

A string that contained unescaped characters was received.

<a id="ERR_UNHANDLED_ERROR"></a>

### ERR_UNHANDLED_ERROR

Ocurrió un error no controlado (por ejemplo, cuando un evento `'error'` es emitido por un [`EventEmitter`][], pero un manejador de `'error'` no está registrado).

<a id="ERR_UNKNOWN_BUILTIN_MODULE"></a>

### ERR_UNKNOWN_BUILTIN_MODULE

Used to identify a specific kind of internal Node.js error that should not typically be triggered by user code. Instances of this error point to an internal bug within the Node.js binary itself.

<a id="ERR_UNKNOWN_ENCODING"></a>

### ERR_UNKNOWN_ENCODING

Se pasó una opción de codificación inválida o desconocida a un API.

<a id="ERR_UNKNOWN_FILE_EXTENSION"></a>

### ERR_UNKNOWN_FILE_EXTENSION

> Estabilidad: 1 - Experimental

Se intentó cargar un módulo con una extensión de archivo desconocida o no soportada.

<a id="ERR_UNKNOWN_MODULE_FORMAT"></a>

### ERR_UNKNOWN_MODULE_FORMAT

> Estabilidad: 1 - Experimental

Se intentó cargar un módulo con un formato desconocido o no soportado.

<a id="ERR_UNKNOWN_SIGNAL"></a>

### ERR_UNKNOWN_SIGNAL

Se pasó una señal de proceso inválida o desconocida a un API que esperaba una señal válida (como [`subprocess.kill()`][]).

<a id="ERR_UNKNOWN_STDIN_TYPE"></a>

### ERR_UNKNOWN_STDIN_TYPE

Se intentó iniciar un proceso Node.js con un tipo de archivo `stdin` desconocido. Este error es usualmente una indicación de un bug dentro del mismo Node.js, aunque es posible que el código de usuario lo desencadene.

<a id="ERR_UNKNOWN_STREAM_TYPE"></a>

### ERR_UNKNOWN_STREAM_TYPE

Se intentó iniciar un proceso Node.js con un tipo de archivo `stdout` o `stderr` desconocido. Este error es usualmente una indicación de un bug dentro del mismo Node.js, aunque es posible que el código de usuario lo desencadene.

<a id="ERR_V8BREAKITERATOR"></a>

### ERR_V8BREAKITERATOR

El API V8 `BreakIterator` fue usado, pero el conjunto de los datos ICU completos no está instalado.

<a id="ERR_VALID_PERFORMANCE_ENTRY_TYPE"></a>

### ERR_VALID_PERFORMANCE_ENTRY_TYPE

Mientras se usaba el API de Tiempo de Rendimiento (`perf_hooks`), no se encontraron tipos de entrada de rendimiento válidos.

<a id="ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING"></a>

### ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING

A dynamic import callback was not specified.

<a id="ERR_VM_MODULE_ALREADY_LINKED"></a>

### ERR_VM_MODULE_ALREADY_LINKED

El módulo que se intentó vincular no es elegible para vincular, por una de las siguientes razones:

- Ya se ha vinculado (`linkingStatus` es `'linked'`)
- Se está vinculando (`linkingStatus` es `'linking'`)
- La vinculación para este módulo ha fallado (`linkingStatus` es `'errored'`)

<a id="ERR_VM_MODULE_DIFFERENT_CONTEXT"></a>

### ERR_VM_MODULE_DIFFERENT_CONTEXT

El módulo que se está devolviendo de la función vinculadora es de un contexto diferente al módulo primario. Los módulos vinculados deben compartir el mismo contexto.

<a id="ERR_VM_MODULE_LINKING_ERRORED"></a>

### ERR_VM_MODULE_LINKING_ERRORED

La función vinculante devolvió un módulo por el cual la vinculación ha fallado.

<a id="ERR_VM_MODULE_NOT_LINKED"></a>

### ERR_VM_MODULE_NOT_LINKED

El módulo debe ser vinculado exitosamente antes de la instanciación.

<a id="ERR_VM_MODULE_NOT_MODULE"></a>

### ERR_VM_MODULE_NOT_MODULE

The fulfilled value of a linking promise is not a `vm.SourceTextModule` object.

<a id="ERR_VM_MODULE_STATUS"></a>

### ERR_VM_MODULE_STATUS

El estado del módulo actual no permite esta operación. El significado específico de este error depende de la función específica.

<a id="ERR_WORKER_PATH"></a>

### ERR_WORKER_PATH

The path for the main script of a worker is neither an absolute path nor a relative path starting with `./` or `../`.

<a id="ERR_WORKER_UNSERIALIZABLE_ERROR"></a>

### ERR_WORKER_UNSERIALIZABLE_ERROR

All attempts at serializing an uncaught exception from a worker thread failed.

<a id="ERR_WORKER_UNSUPPORTED_EXTENSION"></a>

### ERR_WORKER_UNSUPPORTED_EXTENSION

The pathname used for the main script of a worker has an unknown file extension.

<a id="ERR_ZLIB_INITIALIZATION_FAILED"></a>

### ERR_ZLIB_INITIALIZATION_FAILED

La creación de un objeto [`zlib`][] falló debido a una configuración incorrecta.

<a id="HPE_HEADER_OVERFLOW"></a>

### HPE_HEADER_OVERFLOW<!-- YAML
changes:
  - version: v10.15.0
    pr-url: https://github.com/nodejs/node/commit/186035243fad247e3955f
    description: Max header size in `http_parser` was set to 8KB.
-->Too much HTTP header data was received. In order to protect against malicious or malconfigured clients, if more than 8KB of HTTP header data is received then HTTP parsing will abort without a request or response object being created, and an `Error` with this code will be emitted.

<a id="MODULE_NOT_FOUND"></a>

### MODULE_NOT_FOUND

A module file could not be resolved while attempting a [`require()`][] or `import` operation.

## Legacy Node.js Error Codes

> Estabilidad: 0 - Desaprobado. These error codes are either inconsistent, or have been removed.

<a id="ERR_HTTP2_FRAME_ERROR"></a>

### ERR_HTTP2_FRAME_ERROR<!-- YAML
added: v9.0.0
removed: v10.0.0
-->Used when a failure occurs sending an individual frame on the HTTP/2 session.

<a id="ERR_HTTP2_HEADERS_OBJECT"></a>

### ERR_HTTP2_HEADERS_OBJECT
<!-- YAML
added: v9.0.0
removed: v10.0.0
-->

Used when an HTTP/2 Headers Object is expected.

<a id="ERR_HTTP2_HEADER_REQUIRED"></a>

### ERR_HTTP2_HEADER_REQUIRED
<!-- YAML
added: v9.0.0
removed: v10.0.0
-->

Used when a required header is missing in an HTTP/2 message.

<a id="ERR_HTTP2_INFO_HEADERS_AFTER_RESPOND"></a>

### ERR_HTTP2_INFO_HEADERS_AFTER_RESPOND
<!-- YAML
added: v9.0.0
removed: v10.0.0
-->

HTTP/2 informational headers must only be sent *prior* to calling the `Http2Stream.prototype.respond()` method.

<a id="ERR_HTTP2_STREAM_CLOSED"></a>

### ERR_HTTP2_STREAM_CLOSED
<!-- YAML
added: v9.0.0
removed: v10.0.0
-->

Used when an action has been performed on an HTTP/2 Stream that has already been closed.

<a id="ERR_HTTP_INVALID_CHAR"></a>

### ERR_HTTP_INVALID_CHAR
<!-- YAML
added: v9.0.0
removed: v10.0.0
-->

Used when an invalid character is found in an HTTP response status message (reason phrase).

<a id="ERR_NAPI_CONS_PROTOTYPE_OBJECT"></a>

### ERR_NAPI_CONS_PROTOTYPE_OBJECT
<!-- YAML
added: v9.0.0
removed: v10.0.0
-->

Used by the `N-API` when `Constructor.prototype` is not an object.

<a id="ERR_OUTOFMEMORY"></a>

### ERR_OUTOFMEMORY
<!-- YAML
added: v9.0.0
removed: v10.0.0
-->

Used generically to identify that an operation caused an out of memory condition.

<a id="ERR_PARSE_HISTORY_DATA"></a>

### ERR_PARSE_HISTORY_DATA
<!-- YAML
added: v9.0.0
removed: v10.0.0
-->

The `repl` module was unable to parse data from the REPL history file.

<a id="ERR_STDERR_CLOSE"></a>

### ERR_STDERR_CLOSE<!-- YAML
removed: v10.12.0
changes:
  - version: v10.12.0
    pr-url: https://github.com/nodejs/node/pull/23053
    description: Rather than emitting an error, `process.stderr.end()` now
                 only closes the stream side but not the underlying resource,
                 making this error obsolete.
-->Se intentó cerrar el stream `process.stderr`. Por diseño, Node.js no permite que los streams `stdout` o `stderr` sean cerrados por código de usuario.

<a id="ERR_STDOUT_CLOSE"></a>

### ERR_STDOUT_CLOSE
<!-- YAML
removed: v10.12.0
changes:
  - version: v10.12.0
    pr-url: https://github.com/nodejs/node/pull/23053
    description: Rather than emitting an error, `process.stderr.end()` now
                 only closes the stream side but not the underlying resource,
                 making this error obsolete.
-->

Se intentó cerrar el stream `process.stdout`. Por diseño, Node.js no permite que los streams `stdout` o `stderr` sean cerrados por código de usuario.

<a id="ERR_STREAM_READ_NOT_IMPLEMENTED"></a>

### ERR_STREAM_READ_NOT_IMPLEMENTED<!-- YAML
added: v9.0.0
removed: v10.0.0
-->Used when an attempt is made to use a readable stream that has not implemented [`readable._read()`][].

<a id="ERR_TLS_RENEGOTIATION_FAILED"></a>

### ERR_TLS_RENEGOTIATION_FAILED
<!-- YAML
added: v9.0.0
removed: v10.0.0
-->

Used when a TLS renegotiation request has failed in a non-specific way.

<a id="ERR_UNKNOWN_BUILTIN_MODULE"></a>

### ERR_UNKNOWN_BUILTIN_MODULE<!-- YAML
added: v8.0.0
removed: v9.0.0
-->The `'ERR_UNKNOWN_BUILTIN_MODULE'` error code is used to identify a specific kind of internal Node.js error that should not typically be triggered by user code. Instances of this error point to an internal bug within the Node.js binary itself.

<a id="ERR_VALUE_OUT_OF_RANGE"></a>

### ERR_VALUE_OUT_OF_RANGE<!-- YAML
added: v9.0.0
removed: v10.0.0
-->Used when a given value is out of the accepted range.

<a id="ERR_ZLIB_BINDING_CLOSED"></a>

### ERR_ZLIB_BINDING_CLOSED
<!-- YAML
added: v9.0.0
removed: v10.0.0
-->

Used when an attempt is made to use a `zlib` object after it has already been closed.

### Other error codes

These errors have never been released, but had been present on master between releases.

<a id="ERR_FS_WATCHER_ALREADY_STARTED"></a>

#### ERR_FS_WATCHER_ALREADY_STARTED

An attempt was made to start a watcher returned by `fs.watch()` that has already been started.

<a id="ERR_FS_WATCHER_NOT_STARTED"></a>

#### ERR_FS_WATCHER_NOT_STARTED

An attempt was made to initiate operations on a watcher returned by `fs.watch()` that has not yet been started.

<a id="ERR_HTTP2_ALREADY_SHUTDOWN"></a>

#### ERR_HTTP2_ALREADY_SHUTDOWN

Occurs with multiple attempts to shutdown an HTTP/2 session.

<a id="ERR_HTTP2_ERROR"></a>

#### ERR_HTTP2_ERROR

A non-specific HTTP/2 error has occurred.

<a id="ERR_INVALID_REPL_HISTORY"></a>

#### ERR_INVALID_REPL_HISTORY

Used in the `repl` in case the old history file is used and an error occurred while trying to read and parse it.

<a id="ERR_MISSING_DYNAMIC_INSTANTIATE_HOOK"></a>

#### ERR_MISSING_DYNAMIC_INSTANTIATE_HOOK

Used when an [ES6 module](esm.html) loader hook specifies `format: 'dynamic'` but does not provide a `dynamicInstantiate` hook.

<a id="ERR_STREAM_HAS_STRINGDECODER"></a>

#### ERR_STREAM_HAS_STRINGDECODER

Used to prevent an abort if a string decoder was set on the Socket.

```js
const Socket = require('net').Socket;
const instance = new Socket();

instance.setEncoding('utf8');
```

<a id="ERR_STRING_TOO_LARGE"></a>

#### ERR_STRING_TOO_LARGE

An attempt has been made to create a string larger than the maximum allowed size.
