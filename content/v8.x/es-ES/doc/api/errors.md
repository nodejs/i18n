# Errores

<!--introduced_in=v4.0.0-->

<!--type=misc-->

Las aplicaciones ejecutándose en Node.js experimentarán, generalmente, cuatro categorías de errores:

- Errores estándar de JavaScript como: 
  - {EvalError}: arrojado cuando falla una llamada a `eval()`.
  - {SyntaxError}: arrojado en respuesta a una sintaxis impropia del lenguaje JavaScript.
  - {RangeError}: arrojado cuando un valor no se encuentra en el rango esperado
  - {ReferenceError}: arrojado cuando se usan variables indefenidas
  - {TypeError}: arrojado cuando se pasan argumentos de un tipo incorrecto
  - {URIError}: arrojado cuando una función de manejo del URI global es mal usada.
- Errores de sistema provocados por limitaciones subyacentes del sistema operativo, tales como intentar abrir un archivo que no existe, intentar enviar datos a través de un socket cerrado, etc;
- Y errores especificados por los usuarios a través del código de aplicación.
- Los Errores de Aserción son una clase especial de errores que pueden desencadenarse cada vez que Node.js detecta una violación de lógica excepcional que no debería ocurrir. Estos son levantados típicamente por el módulo `assert`.

Todos los errores de JavaScript y de Sistema levantados por Node.js son heredados, o son instancias, de la clase {Error} de JavaScript estándar y se garantiza que proporcionen, *al menos*, las propiedades disponibles para dicha clase.

## Propagación e Intercepción de Errores

<!--type=misc-->

Node.js soporta varios mecanismos para la propagación y manejo de los errores que ocurran mientras una aplicación se está ejecutando. La manera en la que estos errores se reportan y manejan depende enteramente del tipo de Error y el estilo de la API que sea llamada.

Todos los errores de JavaScript son manejados como excepciones que *inmediatamente* generan y arrojan un error utilizando el mecanismo estándar de JavaScript `throw`. These are handled using the [`try / catch` construct](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch) provided by the JavaScript language.

```js
// Arroja con un ReferenceError ya que z es indefinida
try {
  const m = 1;
  const n = m + z;
} catch (err) {
  // Maneje el error aquí.
}
```

Cualquier uso del mecanismo `throw` de JavaScript levantará una excepción que *debe* ser manejada utilizando `try / catch`, o el proceso Node.js se cerrará inmediatamente.

Con pocas excepciones, las APIs *Sincrónicas* (cualquier método que no acepte una función `callback`, tal como [`fs.readFileSync`][]), utilizarán `throw` para reportar errores.

Los errores que ocurren dentro de *APIs Asíncronas* pueden ser reportados de múltiples maneras:

- La mayoría de los métodos asíncronos que aceptan una función `callback` aceptarán un objeto de `Error` pasado como el primer argumento de dicha función. Si ese primer argumento no es `null` y es una instancia de `Error`, entonces ocurrió un error que debe ser manejado.

<!-- eslint-disable no-useless-return -->

    js
      const fs = require('fs');
      fs.readFile('a file that does not exist', (err, data) => {
        if (err) {
          console.error('There was an error reading the file!', err);
          return;
        }
        // De lo contrario, maneje los datos
      });

- Cuando un método asíncrono es llamado sobre un objeto que es un `EventEmitter`, los errores pueden enrutarse al evento `'error'` de dicho objeto.
  
  ```js
  const net = require('net');
  const connection = net.connect('localhost');
  
  // Adición de un manejador del evento 'error' a un stream:
  connection.on('error', (err) => {
    // Si la conexión es restablecida por el servidor, no puede
    // conectarse, o surge cualquier error en
    // la conexión, ese error será enviado acá.
    console.error(err);
  });
  
  connection.pipe(process.stdout);
  ```

- Puede que un puñado de métodos típicamente asíncronos en la API de Node.js aún utilicen el mecanismo `throw` para levantar excepciones que deben ser manejadas utilizando `try / catch`. No hay una lista comprensiva de estos métodos; por favor refiérase a la documentación de cada método para determinar el mecanismo de manejo apropiado que se requiere para cada uno.

El uso del mecanismo del evento `'error'` es más común para las APIs [basadas en streams](stream.html) y [basadas en emisores de eventos](events.html#events_class_eventemitter), las cuales representan series de operaciones asíncronas a lo largo del tiempo (a diferencia de operaciones sencillas que pueden pasar o fallar).

For *all* `EventEmitter` objects, if an `'error'` event handler is not provided, the error will be thrown, causing the Node.js process to report an unhandled exception and crash unless either: The [`domain`](domain.html) module is used appropriately or a handler has been registered for the [`process.on('uncaughtException')`][] event.

```js
const EventEmitter = require('events');
const ee = new EventEmitter();

setImmediate(() => {
  // Esto causará el colapso del proceso, debido a que no fue
  // añadido un manejador del evento 'error0.
  ee.emit('error', new Error('This will crash'));
});
```

Los errores generados de esta manera *no pueden* ser interceptados utilizando `try / catch`, ya que son arrojados *después* de que el código de llamada ha sido cerrado.

Los desarrolladores deben referirse a la documentación de cada método para determinar exactamente cómo son propagados los errores levantados por cada uno de estos métodos.

### Error-first callbacks

<!--type=misc-->

Most asynchronous methods exposed by the Node.js core API follow an idiomatic pattern referred to as an *error-first callback* (sometimes referred to as a *Node.js style callback*). With this pattern, a callback function is passed to the method as an argument. When the operation either completes or an error is raised, the callback function is called with the Error object (if any) passed as the first argument. If no error was raised, the first argument will be passed as `null`.

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

El mecanismo `try /catch` de JavaScript **no puede** ser utilizado para interceptar errores generados por APIs asíncronas. A common mistake for beginners is to try to use `throw` inside an error-first callback:

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

## Clase: Error

<!--type=class-->

Un objeto de `Error` de JavaScript genérico que no denota ninguna circunstancia específica por la cual ocurrió el error. Los objetos de `Error` capturan un "stack trace" que detalla el punto del código en el cual fue instanciado el `Error`, y pueden proporcionar una descripción de texto del mismo.

For crypto only, `Error` objects will include the OpenSSL error stack in a separate property called `opensslErrorStack` if it is available when the error is thrown.

Todos los errores generados por Node.js, incluyendo todos los errores de Sistema y JavaScript, serán instancias de la clase `Error` o heredados de esta.

### new Error(message)

- `message` {string}

Crea un nuevo objeto de `Error` y establece la propiedad `error.message` al mensaje de texto proporcionado. Si un objeto es pasado como un `message`, dicho mensaje será generado al llamar a `message.toString()`. La propiedad `error.stack` representará el punto en el código en el cual el `new Error()` fue llamado. Los stack traces dependen de la [API de stack traces de V8](https://github.com/v8/v8/wiki/Stack-Trace-API). Los stack traces se extienden solo (a) al inicio de la *ejecución de código sincrónico*, o (b) el número de frames dados por la propiedad `Error.stackTraceLimit`, lo que sea más pequeño.

### Error.captureStackTrace(targetObject[, constructorOpt])

- `targetObject` {Object}
- `constructorOpt` {Function}

Crea una propiedad `.stack` en el `targetObject`, la cual al ser accedida devuelve una string que representa la ubicación en el código en la cual `Error.captureStackTrace()` fue llamado.

```js
const myObject = {};
Error.captureStackTrace(myObject);
myObject.stack;  // similar a `new Error().stack`
```

The first line of the trace will be prefixed with `${myObject.name}: ${myObject.message}`.

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

- {number}

La propiedad `Error.stackTraceLimit` especifica el número de stack frames recolectadas por un stack trace (ya sea que fue generado por `new Error().stack` o `Error.captureStackTrace(obj)`).

El valor por defecto es `10`, pero puede establecerse en cualquier número de JavaScript válido. Los cambios afectarán cualquier stack trace capturado *después* de que el valor haya sido cambiado.

Si se establece como un valor no-numérico, o un número negativo, los stack traces no capturarán ningún frame.

### error.code

- {string}

La propiedad `error.code` es una etiqueta de string que identifica el tipo de error. See [Node.js Error Codes](#nodejs-error-codes) for details about specific codes.

### error.message

- {string}

The `error.message` property is the string description of the error as set by calling `new Error(message)`. The `message` passed to the constructor will also appear in the first line of the stack trace of the `Error`, however changing this property after the `Error` object is created *may not* change the first line of the stack trace (for example, when `error.stack` is read before this property is changed).

```js
const err = new Error('The message');
console.error(err.message);
// Imprime: The message
```

### error.stack

- {string}

La propiedad `error.stack` es una string que describe el punto en el código en el cual el `Error` fue instanciado.

Por ejemplo:

```txt
Error: ¡Siguen ocurriendo cosas!
   at /home/gbusey/file.js:525:2
   at Frobnicator.refrobulate (/home/gbusey/business-logic.js:424:21)
   at Actor.<anonymous> (/home/gbusey/actors.js:400:8)
   at increaseSynergy (/home/gbusey/actors.js:701:6)
```

La primera línea está formateada como `<error class name>: <error message>` y es seguida por una serie de stack frames (donde cada línea comienza con "at "). Cada frame describe un sitio de llamada dentro del código que conduce al error que está siendo generado. V8 intenta mostrar el nombre de cada función (por nombre de la variable, nombre de la función o nombre del método del objeto), pero ocasionalmente no podrá encontrar un nombre adecuado. Si V8 no puede determinar un nombre para la función, solo se mostrará información de ubicación para ese frame. En caso contrario, el nombre de la función determinado será mostrado con la información de ubicación adjunta entre paréntesis.

Los frames sólo son generados para funciones JavaScript. If, for example, execution synchronously passes through a C++ addon function called `cheetahify` which itself calls a JavaScript function, the frame representing the `cheetahify` call will not be present in the stack traces:

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

- `native`, si el frame representa una llamada interna a V8 (como en `[].forEach`).
- `plain-filename.js:line:column`, si el frame representa una llamada interna a Node.js.
- `/absolute/path/to/file.js:line:column`, si el frame representa una llamada en un programa de usuario o sus dependencias.

La string que representa al stack trace es generada flojamente cuando la propiedad `error.stack` es **accedida**.

El número de frames capturadas por el stack trace está limitado al número más bajo del `Error.stackTraceLimit` o el número de frames disponibles en el tic del bucle del evento actual.

Los errores a nivel de sistema son generados como instancias de `Error` aumentadas, las cuales se encuentran detalladas [aquí](#errors_system_errors).

## Clase: AssertionError (Error de Afirmación)

Una subclase de `Error` que indica un fallo en una afirmación. Such errors commonly indicate inequality of actual and expected value.

Por ejemplo:

```js
assert.strictEqual(1, 2);
// AssertionError [ERR_ASSERTION]: 1 === 2
```

## Clase: RangeError (Error de Rango)

Una subclase de `Error` que indica que un argumento proporcionado no se encontraba dentro del conjunto o rango de valores aceptables para una función; ya sea que este no está en un rango numérico válido o se encuentra fuera del conjunto de opciones para un parámetro de funciones dado.

Por ejemplo:

```js
require('net').connect(-1);
// arroja "RangeError: "port" option should be >= 0 and < 65536: -1"
```

Node.js generará y arrojará instancias de `RangeError` *inmediatamente*, como una forma de validación de argumentos.

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

Una subclase de `Error` que indica que un argumento proporcionado no es de un tipo permitido. Por ejemplo, pasar una función a un parámetro que espera una string será considerado un TypeError.

```js
require('url').parse(() => { });
// arroja TypeError, ya que esperaba una string
```

Node.js generará y arrojará *inmediatamente* instancias de `TypeError` como una forma de validación de argumentos.

## Excepciones vs. Errores

<!--type=misc-->

Una excepción de JavaScript es un valor que es arrojado como resultado de una operación inválida como el objetivo de una declaración de `throw`. Aunque no es necesario que estos valores sean instancias de `Error` o clases heredadas de `Error`, todas las excepciones arrojadas por JavaScript o el tiempo de ejecución de JavaScript *serán* instancias de Error.

Algunas excepciones son *irrecuperables* en la capa de JavaScript. Dichas excepciones *siempre* causarán el colapso del proceso de Node.js. Los ejemplos incluyen revisiones de `assert()` o llamadas a `abort()` en la capa de C++.

## Errores de Sistema

Los errores de sistema son generados cuando ocurren excepciones dentro del entorno del tiempo de ejecución del programa. Típicamente, estos son errores operacionales que ocurren cuando una aplicación viola una restricción del sistema operativo, tal como intentar leer un archivo que no existe o intentar hacerlo cuando el usuario no tiene suficientes permisos.

Los errores de sistema son típicamente generados a nivel de las llamadas de sistema: una lista exhaustiva de códigos de error y sus significados está disponible, para acceder a ella se debe ejecutar `man 2 intro` o `man 3 errno` en la mayoría de los Unices; u [online](http://man7.org/linux/man-pages/man3/errno.3.html).

En Node.js, los errores de sistema son representados como objetos de `Error` aumentados con propiedades añadidas.

### Clase: Error de Sistema

#### error.code

- {string}

The `error.code` property is a string representing the error code, which is typically `E` followed by a sequence of capital letters.

#### error.errno

- {string|number}

La propiedad `error.errno` es un número o una string. The number is a **negative** value which corresponds to the error code defined in [`libuv Error handling`]. See uv-errno.h header file (`deps/uv/include/uv-errno.h` in the Node.js source tree) for details. In case of a string, it is the same as `error.code`.

#### error.syscall

- {string}

La propiedad `error.syscall` es una string que describe la [syscall](http://man7.org/linux/man-pages/man2/syscall.2.html) que falló.

#### error.path

- {string}

When present (e.g. in `fs` or `child_process`), the `error.path` property is a string containing a relevant invalid pathname.

#### error.address

- {string}

When present (e.g. in `net` or `dgram`), the `error.address` property is a string describing the address to which the connection failed.

#### error.port

- {number}

When present (e.g. in `net` or `dgram`), the `error.port` property is a number representing the connection's port that is not available.

### Errores de Sistema Comunes

Esta lista **no es exhaustiva**, pero enumera muchos de los errores de sistema comunes que se encuentran al escribir un programa de Node.js. Una lista exhaustiva puede ser encontrada [aquí](http://man7.org/linux/man-pages/man3/errno.3.html).

- `EACCES` (Permiso denegado): Se intentó acceder a un archivo de una manera prohibida por sus permisos de acceso de archivo.

- `EADDRINUSE` (Dirección ya en uso): Falló un intento de enlazar un servidor ([`net`][], [`http`][], o [`https`][]) a una dirección local, debido que otro servidor en el sistema local ya se encontraba ocupando dicha dirección.

- `ECONNREFUSED` (Conexión rechazada): No se pudo establecer ninguna conexión, debido a que la máquina objetivo la rechazó de manera activa. Esto es usualmente el resultado de un intento de conectarse a un servicio que está inactivo en el host externo.

- `ECONNRESET` (Conexión restablecida por un peer): Una conexión fue cerrada forzosamente por un peer. Esto es normalmente el resultado de una pérdida de conexión en el socket remoto, debida a un agotamiento del tiempo de espera o un reinicio. Comúnmente, se encuentra a través de los módulos [`http`][] y [`net`][].

- `EEXIST` (El archivo existe): Un archivo existente fue el objetivo de una operación que requería que el objetivo no existiese.

- `EISDIR` (Es un directorio): Una operación esperaba un archivo, pero la ruta dada correspondía a un directorio.

- `EMFILE` (Demasiados archivos abiertos en el sistema): El número máximo de [descriptores de archivos](https://en.wikipedia.org/wiki/File_descriptor) permitidos en el sistema ha sido alcanzado, y las solicitudes para otro descriptor no pueden ser cumplidas hasta que al menos uno de estos haya sido cerrado. Esto se encuentra al abrir demasiados archivos en paralelo al mismo tiempo, especialmente en sistemas (en particular, en macOS) donde hay un límite bajo de descriptores de archivos para los procesos. Para remediar un límite bajo, ejecute `ulimit -n 2048` en el mismo shell que ejecutará el proceso de Node.js.

- `ENOENT` (No existe tal archivo o directorio): Comúnmente, es levantado por las operaciones de [`fs`][] para indicar que un componente del nombre de la ruta especificada no existe — no se pudo encontrar ninguna entidad (archivo o directorio) con la ruta dada.

- `ENOTDIR` (No es un directorio): Un componente del nombre de ruta proporcionado existía, pero no era un directorio, como se esperaba. Comúnmente, es levantado por [`fs.readdir`][].

- `ENOTEMPTY` (El directorio no se encuentra vacío): Un directorio con entradas fue el objetivo de una operación que requiere un directorio vacío — usualmente [`fs.unlink`][].

- `EPERM` (Operación no permitida): Se intentó realizar una operación que requiere privilegios superiores.

- `EPIPE` (Conductor dañado): Una escritura en un pipe, socket, o FIFO para el cual no existe un proceso para la lectura de los datos. Comúnmente, se encuentra en las capas [`net`][] y [`http`][], indicadores de que el lado remoto del stream siendo escrito ha sido cerrado.

- `ETIMEDOUT` (Se agotó el tiempo de la operación): Una solicitud de conexión o envío falló debido a que la parte conectada no respondió adecuadamente luego de un período de tiempo. Usualmente, es encontrado por [`http`][] o [`net`][] — a menudo una señal de que `socket.end()` no fue llamada correctamente.

<a id="nodejs-error-codes"></a>

## Códigos de Error de Node.js

<a id="ERR_ARG_NOT_ITERABLE"></a>

### ERR_ARG_NOT_ITERABLE

An iterable argument (i.e. a value that works with `for...of` loops) was required, but not provided to a Node.js API.

<a id="ERR_ASYNC_CALLBACK"></a>

### ERR_ASYNC_CALLBACK

An attempt was made to register something that is not a function as an `AsyncHooks` callback.

<a id="ERR_ASYNC_TYPE"></a>

### ERR_ASYNC_TYPE

El tipo de una fuente asincrónica era inválido. Note that users are also able to define their own types if using the public embedder API.

<a id="ERR_ENCODING_INVALID_ENCODED_DATA"></a>

### ERR_ENCODING_INVALID_ENCODED_DATA

Data provided to `util.TextDecoder()` API was invalid according to the encoding provided.

<a id="ERR_ENCODING_NOT_SUPPORTED"></a>

### ERR_ENCODING_NOT_SUPPORTED

Encoding provided to `util.TextDecoder()` API was not one of the [WHATWG Supported Encodings](util.md#whatwg-supported-encodings).

<a id="ERR_FALSY_VALUE_REJECTION"></a>

### ERR_FALSY_VALUE_REJECTION

A `Promise` that was callbackified via `util.callbackify()` was rejected with a falsy value.

<a id="ERR_HTTP_HEADERS_SENT"></a>

### ERR_HTTP_HEADERS_SENT

Se intentó añadir más encabezados después de que los encabezados ya fueron enviados.

<a id="ERR_HTTP_INVALID_CHAR"></a>

### ERR_HTTP_INVALID_CHAR

An invalid character was found in an HTTP response status message (reason phrase).

<a id="ERR_HTTP_INVALID_STATUS_CODE"></a>

### ERR_HTTP_INVALID_STATUS_CODE

El código de estado estaba fuera del rango de código de estado regular (100-999).

<a id="ERR_HTTP_TRAILER_INVALID"></a>

### ERR_HTTP_TRAILER_INVALID

The `Trailer` header was set even though the transfer encoding does not support that.

<a id="ERR_HTTP2_ALREADY_SHUTDOWN"></a>

### ERR_HTTP2_ALREADY_SHUTDOWN

Occurs with multiple attempts to shutdown an HTTP/2 session.

<a id="ERR_HTTP2_ALTSVC_INVALID_ORIGIN"></a>

### ERR_HTTP2_ALTSVC_INVALID_ORIGIN

Las estructuras HTTP/2 ALTSVC requieren un origen válido.

<a id="ERR_HTTP2_ALTSVC_LENGTH"></a>

### ERR_HTTP2_ALTSVC_LENGTH

Las estructuras HTTP/2 ALTSVC están limitadas a un máximo de 16,382 bytes de carga útil.

<a id="ERR_HTTP2_CONNECT_AUTHORITY"></a>

### ERR_HTTP2_CONNECT_AUTHORITY

For HTTP/2 requests using the `CONNECT` method, the `:authority` pseudo-header is required.

<a id="ERR_HTTP2_CONNECT_PATH"></a>

### ERR_HTTP2_CONNECT_PATH

For HTTP/2 requests using the `CONNECT` method, the `:path` pseudo-header is forbidden.

<a id="ERR_HTTP2_CONNECT_SCHEME"></a>

### ERR_HTTP2_CONNECT_SCHEME

For HTTP/2 requests using the `CONNECT` method, the `:scheme` pseudo-header is forbidden.

<a id="ERR_HTTP2_FRAME_ERROR"></a>

### ERR_HTTP2_FRAME_ERROR

A failure occurred sending an individual frame on the HTTP/2 session.

<a id="ERR_HTTP2_GOAWAY_SESSION"></a>

### ERR_HTTP2_GOAWAY_SESSION

New HTTP/2 Streams may not be opened after the `Http2Session` has received a `GOAWAY` frame from the connected peer.

<a id="ERR_HTTP2_HEADER_REQUIRED"></a>

### ERR_HTTP2_HEADER_REQUIRED

A required header was missing in an HTTP/2 message.

<a id="ERR_HTTP2_HEADER_SINGLE_VALUE"></a>

### ERR_HTTP2_HEADER_SINGLE_VALUE

Multiple values were provided for an HTTP/2 header field that was required to have only a single value.

<a id="ERR_HTTP2_HEADERS_AFTER_RESPOND"></a>

### ERR_HTTP2_HEADERS_AFTER_RESPOND

Se especificaron headers adicionales después de que se inició una respuesta HTTP/2.

<a id="ERR_HTTP2_HEADERS_OBJECT"></a>

### ERR_HTTP2_HEADERS_OBJECT

An HTTP/2 Headers Object was expected.

<a id="ERR_HTTP2_HEADERS_SENT"></a>

### ERR_HTTP2_HEADERS_SENT

Se intentó enviar múltiples encabezados de respuesta.

<a id="ERR_HTTP2_INFO_HEADERS_AFTER_RESPOND"></a>

### ERR_HTTP2_INFO_HEADERS_AFTER_RESPOND

HTTP/2 Informational headers must only be sent *prior* to calling the `Http2Stream.prototype.respond()` method.

<a id="ERR_HTTP2_INFO_STATUS_NOT_ALLOWED"></a>

### ERR_HTTP2_INFO_STATUS_NOT_ALLOWED

Informational HTTP status codes (`1xx`) may not be set as the response status code on HTTP/2 responses.

<a id="ERR_HTTP2_INVALID_CONNECTION_HEADERS"></a>

### ERR_HTTP2_INVALID_CONNECTION_HEADERS

HTTP/1 connection specific headers are forbidden to be used in HTTP/2 requests and responses.

<a id="ERR_HTTP2_INVALID_HEADER_VALUE"></a>

### ERR_HTTP2_INVALID_HEADER_VALUE

Se especificó un valor de encabezado HTTP/2 inválido.

<a id="ERR_HTTP2_INVALID_INFO_STATUS"></a>

### ERR_HTTP2_INVALID_INFO_STATUS

Se especificó un código de estado informativo de HTTP inválido. Informational status codes must be an integer between `100` and `199` (inclusive).

<a id="ERR_HTTP2_INVALID_ORIGIN"></a>

### ERR_HTTP2_INVALID_ORIGIN

HTTP/2 `ORIGIN` frames require a valid origin.

<a id="ERR_HTTP2_INVALID_PACKED_SETTINGS_LENGTH"></a>

### ERR_HTTP2_INVALID_PACKED_SETTINGS_LENGTH

Input `Buffer` and `Uint8Array` instances passed to the `http2.getUnpackedSettings()` API must have a length that is a multiple of six.

<a id="ERR_HTTP2_INVALID_PSEUDOHEADER"></a>

### ERR_HTTP2_INVALID_PSEUDOHEADER

Only valid HTTP/2 pseudoheaders (`:status`, `:path`, `:authority`, `:scheme`, and `:method`) may be used.

<a id="ERR_HTTP2_INVALID_SESSION"></a>

### ERR_HTTP2_INVALID_SESSION

An action was performed on an `Http2Session` object that had already been destroyed.

<a id="ERR_HTTP2_INVALID_SETTING_VALUE"></a>

### ERR_HTTP2_INVALID_SETTING_VALUE

Se ha especificado un valor inválido para una configuración de HTTP/2.

<a id="ERR_HTTP2_INVALID_STREAM"></a>

### ERR_HTTP2_INVALID_STREAM

Se realizó una operación en un stream que ya había sido destruido.

<a id="ERR_HTTP2_MAX_PENDING_SETTINGS_ACK"></a>

### ERR_HTTP2_MAX_PENDING_SETTINGS_ACK

Whenever an HTTP/2 `SETTINGS` frame is sent to a connected peer, the peer is required to send an acknowledgment that it has received and applied the new `SETTINGS`. By default, a maximum number of unacknowledged `SETTINGS` frames may be sent at any given time. This error code is used when that limit has been reached.

<a id="ERR_HTTP2_NESTED_PUSH"></a>

### ERR_HTTP2_NESTED_PUSH

An attempt was made to initiate a new push stream from within a push stream. Nested push streams are not permitted.

<a id="ERR_HTTP2_NO_SOCKET_MANIPULATION"></a>

### ERR_HTTP2_NO_SOCKET_MANIPULATION

An attempt was made to directly manipulate (read, write, pause, resume, etc.) a socket attached to an `Http2Session`.

<a id="ERR_HTTP2_ORIGIN_LENGTH"></a>

### ERR_HTTP2_ORIGIN_LENGTH

HTTP/2 `ORIGIN` frames are limited to a length of 16382 bytes.

<a id="ERR_HTTP2_OUT_OF_STREAMS"></a>

### ERR_HTTP2_OUT_OF_STREAMS

The number of streams created on a single HTTP/2 session reached the maximum limit.

<a id="ERR_HTTP2_PAYLOAD_FORBIDDEN"></a>

### ERR_HTTP2_PAYLOAD_FORBIDDEN

A message payload was specified for an HTTP response code for which a payload is forbidden.

<a id="ERR_HTTP2_PING_CANCEL"></a>

### ERR_HTTP2_PING_CANCEL

Se canceló un ping HTTP/2.

<a id="ERR_HTTP2_PING_LENGTH"></a>

### ERR_HTTP2_PING_LENGTH

Las cargas de ping HTTP/2 debe ser exactamente de 8 bytes de longitud.

<a id="ERR_HTTP2_PSEUDOHEADER_NOT_ALLOWED"></a>

### ERR_HTTP2_PSEUDOHEADER_NOT_ALLOWED

Se utilizó un pseudo encabezado HTTP/2 inapropiadamente. Pseudo-headers are header key names that begin with the `:` prefix.

<a id="ERR_HTTP2_PUSH_DISABLED"></a>

### ERR_HTTP2_PUSH_DISABLED

An attempt was made to create a push stream, which had been disabled by the client.

<a id="ERR_HTTP2_SEND_FILE"></a>

### ERR_HTTP2_SEND_FILE

An attempt was made to use the `Http2Stream.prototype.responseWithFile()` API to send something other than a regular file.

<a id="ERR_HTTP2_SESSION_ERROR"></a>

### ERR_HTTP2_SESSION_ERROR

La `Http2Session` cerró con un código de error distinto de cero.

<a id="ERR_HTTP2_SETTINGS_CANCEL"></a>

### ERR_HTTP2_SETTINGS_CANCEL

The `Http2Session` settings canceled.

<a id="ERR_HTTP2_SOCKET_BOUND"></a>

### ERR_HTTP2_SOCKET_BOUND

An attempt was made to connect a `Http2Session` object to a `net.Socket` or `tls.TLSSocket` that had already been bound to another `Http2Session` object.

<a id="ERR_HTTP2_SOCKET_UNBOUND"></a>

### ERR_HTTP2_SOCKET_UNBOUND

An attempt was made to use the `socket` property of an `Http2Session` that has already been closed.

<a id="ERR_HTTP2_STATUS_101"></a>

### ERR_HTTP2_STATUS_101

El uso del código de estado Informativo `101` está prohibido en HTTP/2.

<a id="ERR_HTTP2_STATUS_INVALID"></a>

### ERR_HTTP2_STATUS_INVALID

Se especificó un código de estado HTTP inválido. Status codes must be an integer between `100` and `599` (inclusive).

<a id="ERR_HTTP2_STREAM_CANCEL"></a>

### ERR_HTTP2_STREAM_CANCEL

An `Http2Stream` was destroyed before any data was transmitted to the connected peer.

<a id="ERR_HTTP2_STREAM_ERROR"></a>

### ERR_HTTP2_STREAM_ERROR

Se especificó un código de error distinto de cero en un frame `RST_STREAM`.

<a id="ERR_HTTP2_STREAM_SELF_DEPENDENCY"></a>

### ERR_HTTP2_STREAM_SELF_DEPENDENCY

When setting the priority for an HTTP/2 stream, the stream may be marked as a dependency for a parent stream. This error code is used when an attempt is made to mark a stream and dependent of itself.

<a id="ERR_HTTP2_TRAILERS_ALREADY_SENT"></a>

### ERR_HTTP2_TRAILERS_ALREADY_SENT

Ya se enviaron header de cierre al `Http2Stream`.

<a id="ERR_HTTP2_TRAILERS_NOT_READY"></a>

### ERR_HTTP2_TRAILERS_NOT_READY

The `http2stream.sendTrailers()` method cannot be called until after the `'wantTrailers'` event is emitted on an `Http2Stream` object. The `'wantTrailers'` event will only be emitted if the `waitForTrailers` option is set for the `Http2Stream`.

<a id="ERR_HTTP2_UNSUPPORTED_PROTOCOL"></a>

### ERR_HTTP2_UNSUPPORTED_PROTOCOL

`http2.connect()` was passed a URL that uses any protocol other than `http:` or `https:`.

<a id="ERR_INDEX_OUT_OF_RANGE"></a>

### ERR_INDEX_OUT_OF_RANGE

Un índice dado estaba afuera del rango aceptado (p. ej, offsets negativos).

<a id="ERR_INVALID_ARG_TYPE"></a>

### ERR_INVALID_ARG_TYPE

Se pasó un argumento de tipo erróneo a un API Node.js.

<a id="ERR_INVALID_ASYNC_ID"></a>

### ERR_INVALID_ASYNC_ID

Se pasó un `asyncId` o `triggerAsyncId` inválido usando `AsyncHooks`. An id less than -1 should never happen.

<a id="ERR_INVALID_CALLBACK"></a>

### ERR_INVALID_CALLBACK

Se requirió una función callback, pero no fue proporcionada a un API de Node.js.

<a id="ERR_INVALID_FILE_URL_HOST"></a>

### ERR_INVALID_FILE_URL_HOST

A Node.js API that consumes `file:` URLs (such as certain functions in the [`fs`][] module) encountered a file URL with an incompatible host. This situation can only occur on Unix-like systems where only `localhost` or an empty host is supported.

<a id="ERR_INVALID_FILE_URL_PATH"></a>

### ERR_INVALID_FILE_URL_PATH

A Node.js API that consumes `file:` URLs (such as certain functions in the [`fs`][] module) encountered a file URL with an incompatible path. The exact semantics for determining whether a path can be used is platform-dependent.

<a id="ERR_INVALID_HANDLE_TYPE"></a>

### ERR_INVALID_HANDLE_TYPE

An attempt was made to send an unsupported "handle" over an IPC communication channel to a child process. See [`subprocess.send()`] and [`process.send()`] for more information.

<a id="ERR_INVALID_OPT_VALUE"></a>

### ERR_INVALID_OPT_VALUE

Se pasó un valor inválido o inesperado en un objeto de opciones.

<a id="ERR_INVALID_PERFORMANCE_MARK"></a>

### ERR_INVALID_PERFORMANCE_MARK

While using the Performance Timing API (`perf_hooks`), a performance mark is invalid.

<a id="ERR_INVALID_PROTOCOL"></a>

### ERR_INVALID_PROTOCOL

Se pasó un `options.protocol` inválido.

<a id="ERR_INVALID_SYNC_FORK_INPUT"></a>

### ERR_INVALID_SYNC_FORK_INPUT

A `Buffer`, `Uint8Array` or `string` was provided as stdio input to a synchronous fork. See the documentation for the [`child_process`](child_process.html) module for more information.

<a id="ERR_INVALID_THIS"></a>

### ERR_INVALID_THIS

Se llamó una función API de Node.js con un valor `this` incompatible.

Ejemplo:

```js
const { URLSearchParams } = require('url');
const urlSearchParams = new URLSearchParams('foo=bar&baz=new');

const buf = Buffer.alloc(1);
urlSearchParams.has.call(buf, 'foo');
// Throws a TypeError with code 'ERR_INVALID_THIS'
```

<a id="ERR_INVALID_TUPLE"></a>

### ERR_INVALID_TUPLE

An element in the `iterable` provided to the [WHATWG](url.html#url_the_whatwg_url_api) [`URLSearchParams` constructor][`new URLSearchParams(iterable)`] did not represent a `[name, value]` tuple – that is, if an element is not iterable, or does not consist of exactly two elements.

<a id="ERR_INVALID_URL"></a>

### ERR_INVALID_URL

An invalid URL was passed to the [WHATWG](url.html#url_the_whatwg_url_api) [`URL` constructor][`new URL(input)`] to be parsed. The thrown error object typically has an additional property `'input'` that contains the URL that failed to parse.

<a id="ERR_INVALID_URL_SCHEME"></a>

### ERR_INVALID_URL_SCHEME

An attempt was made to use a URL of an incompatible scheme (protocol) for a specific purpose. It is only used in the [WHATWG URL API](url.html#url_the_whatwg_url_api) support in the [`fs`][] module (which only accepts URLs with `'file'` scheme), but may be used in other Node.js APIs as well in the future.

<a id="ERR_IPC_CHANNEL_CLOSED"></a>

### ERR_IPC_CHANNEL_CLOSED

Se intentó usar un canal de comunicación IPC que ya estaba cerrado.

<a id="ERR_IPC_DISCONNECTED"></a>

### ERR_IPC_DISCONNECTED

An attempt was made to disconnect an IPC communication channel that was already disconnected. See the documentation for the [`child_process`](child_process.html) module for more information.

<a id="ERR_IPC_ONE_PIPE"></a>

### ERR_IPC_ONE_PIPE

An attempt was made to create a child Node.js process using more than one IPC communication channel. See the documentation for the [`child_process`](child_process.html) module for more information.

<a id="ERR_IPC_SYNC_FORK"></a>

### ERR_IPC_SYNC_FORK

An attempt was made to open an IPC communication channel with a synchronously forked Node.js process. See the documentation for the [`child_process`](child_process.html) module for more information.

<a id="ERR_MISSING_ARGS"></a>

### ERR_MISSING_ARGS

No se pasó un argumento de API de Node.js requerido. This is only used for strict compliance with the API specification (which in some cases may accept `func(undefined)` but not `func()`). In most native Node.js APIs, `func(undefined)` and `func()` are treated identically, and the [`ERR_INVALID_ARG_TYPE`][] error code may be used instead.

<a id="ERR_MISSING_DYNAMIC_INSTANTIATE_HOOK"></a>

### ERR_MISSING_DYNAMIC_INSTANTIATE_HOOK

> Estabilidad: 1 - Experimental

Used when an \[ES6 module\]\[\] loader hook specifies `format: 'dynamic` but does not provide a `dynamicInstantiate` hook.

<a id="ERR_MISSING_MODULE"></a>

### ERR_MISSING_MODULE

> Estabilidad: 1 - Experimental

Used when an \[ES6 module\]\[\] cannot be resolved.

<a id="ERR_MODULE_RESOLUTION_LEGACY"></a>

### ERR_MODULE_RESOLUTION_LEGACY

> Estabilidad: 1 - Experimental

Used when a failure occurred resolving imports in an \[ES6 module\]\[\].

<a id="ERR_MULTIPLE_CALLBACK"></a>

### ERR_MULTIPLE_CALLBACK

Se llamó un callback más de una vez.

*Note*: A callback is almost always meant to only be called once as the query can either be fulfilled or rejected but not both at the same time. The latter would be possible by calling a callback more than once.

<a id="ERR_NAPI_CONS_FUNCTION"></a>

### ERR_NAPI_CONS_FUNCTION

Mientras se utilizaba `N-API`, se pasó un constructor que no era una función.

<a id="ERR_NAPI_CONS_PROTOTYPE_OBJECT"></a>

### ERR_NAPI_CONS_PROTOTYPE_OBJECT

While using `N-API`, `Constructor.prototype` was not an object.

<a id="ERR_NAPI_INVALID_DATAVIEW_ARGS"></a>

### ERR_NAPI_INVALID_DATAVIEW_ARGS

While calling `napi_create_dataview()`, a given `offset` was outside the bounds of the dataview or `offset + length` was larger than a length of given `buffer`.

<a id="ERR_NAPI_INVALID_TYPEDARRAY_ALIGNMENT"></a>

### ERR_NAPI_INVALID_TYPEDARRAY_ALIGNMENT

While calling `napi_create_typedarray()`, the provided `offset` was not a multiple of the element size.

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

On the main thread, values are removed from the queue associated with the thread-safe function in an idle loop. This error indicates that an error has occurred when attemping to start the loop.

<a id="ERR_NAPI_TSFN_STOP_IDLE_LOOP"></a>

### ERR_NAPI_TSFN_STOP_IDLE_LOOP

Once no more items are left in the queue, the idle loop must be suspended. This error indicates that the idle loop has failed to stop.

<a id="ERR_NO_ICU"></a>

### ERR_NO_ICU

An attempt was made to use features that require [ICU](intl.html#intl_internationalization_support), but Node.js was not compiled with ICU support.

<a id="ERR_SOCKET_ALREADY_BOUND"></a>

### ERR_SOCKET_ALREADY_BOUND

Se intentó enlazar un socket que ya se había enlazado.

<a id="ERR_SOCKET_BAD_PORT"></a>

### ERR_SOCKET_BAD_PORT

An API function expecting a port > 0 and < 65536 received an invalid value.

<a id="ERR_SOCKET_BAD_TYPE"></a>

### ERR_SOCKET_BAD_TYPE

An API function expecting a socket type (`udp4` or `udp6`) received an invalid value.

<a id="ERR_SOCKET_CANNOT_SEND"></a>

### ERR_SOCKET_CANNOT_SEND

Los datos pudieron ser enviados en un socket.

<a id="ERR_SOCKET_CLOSED"></a>

### ERR_SOCKET_CLOSED

Se intentó operar en un socket que ya estaba cerrado.

<a id="ERR_SOCKET_DGRAM_NOT_RUNNING"></a>

### ERR_SOCKET_DGRAM_NOT_RUNNING

Se hizo una llamada y el subsistema UDP no estaba corriendo.

<a id="ERR_STDERR_CLOSE"></a>

### ERR_STDERR_CLOSE

<!-- YAML
removed: v8.16.0
changes:

  - version: v8.16.0
    pr-url: https://github.com/nodejs/node/pull/23053
    description: Rather than emitting an error, `process.stderr.end()` now
                 only closes the stream side but not the underlying resource,
                 making this error obsolete.
-->

An attempt was made to close the `process.stderr` stream. By design, Node.js does not allow `stdout` or `stderr` streams to be closed by user code.

<a id="ERR_STDOUT_CLOSE"></a>

### ERR_STDOUT_CLOSE

<!-- YAML
removed: v8.16.0
changes:

  - version: v8.16.0
    pr-url: https://github.com/nodejs/node/pull/23053
    description: Rather than emitting an error, `process.stderr.end()` now
                 only closes the stream side but not the underlying resource,
                 making this error obsolete.
-->

Se intentó cerrar el stream `process.stdout`. By design, Node.js does not allow `stdout` or `stderr` streams to be closed by user code.

<a id="ERR_TLS_CERT_ALTNAME_INVALID"></a>

### ERR_TLS_CERT_ALTNAME_INVALID

While using TLS, the hostname/IP of the peer did not match any of the subjectAltNames in its certificate.

<a id="ERR_TLS_DH_PARAM_SIZE"></a>

### ERR_TLS_DH_PARAM_SIZE

While using TLS, the parameter offered for the Diffie-Hellman (`DH`) key-agreement protocol is too small. By default, the key length must be greater than or equal to 1024 bits to avoid vulnerabilities, even though it is strongly recommended to use 2048 bits or larger for stronger security.

<a id="ERR_TLS_HANDSHAKE_TIMEOUT"></a>

### ERR_TLS_HANDSHAKE_TIMEOUT

Se venció el tiempo después de inicio de una comunicación TLS/SSL. In this case, the server must also abort the connection.

<a id="ERR_TLS_RENEGOTIATION_FAILED"></a>

### ERR_TLS_RENEGOTIATION_FAILED

A TLS renegotiation request has failed in a non-specific way.

<a id="ERR_TLS_REQUIRED_SERVER_NAME"></a>

### ERR_TLS_REQUIRED_SERVER_NAME

While using TLS, the `server.addContext()` method was called without providing a hostname in the first parameter.

<a id="ERR_TLS_SESSION_ATTACK"></a>

### ERR_TLS_SESSION_ATTACK

An excessive amount of TLS renegotiations is detected, which is a potential vector for denial-of-service attacks.

<a id="ERR_TRANSFORM_ALREADY_TRANSFORMING"></a>

### ERR_TRANSFORM_ALREADY_TRANSFORMING

A Transform stream finished while it was still transforming.

<a id="ERR_TRANSFORM_WITH_LENGTH_0"></a>

### ERR_TRANSFORM_WITH_LENGTH_0

A Transform stream finished with data still in the write buffer.

<a id="ERR_UNKNOWN_SIGNAL"></a>

### ERR_UNKNOWN_SIGNAL

An invalid or unknown process signal was passed to an API expecting a valid signal (such as [`subprocess.kill()`][]).

<a id="ERR_UNKNOWN_STDIN_TYPE"></a>

### ERR_UNKNOWN_STDIN_TYPE

An attempt was made to launch a Node.js process with an unknown `stdin` file type. This error is usually an indication of a bug within Node.js itself, although it is possible for user code to trigger it.

<a id="ERR_UNKNOWN_STREAM_TYPE"></a>

### ERR_UNKNOWN_STREAM_TYPE

An attempt was made to launch a Node.js process with an unknown `stdout` or `stderr` file type. This error is usually an indication of a bug within Node.js itself, although it is possible for user code to trigger it.

<a id="ERR_V8BREAKITERATOR"></a>

### ERR_V8BREAKITERATOR

The V8 BreakIterator API was used but the full ICU data set is not installed.

<a id="ERR_VALID_PERFORMANCE_ENTRY_TYPE"></a>

### ERR_VALID_PERFORMANCE_ENTRY_TYPE

While using the Performance Timing API (`perf_hooks`), no valid performance entry types were found.

<a id="ERR_VALUE_OUT_OF_RANGE"></a>

### ERR_VALUE_OUT_OF_RANGE

Un valor dado está fuera del rango aceptado.