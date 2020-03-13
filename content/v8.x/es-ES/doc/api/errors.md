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

Todos los errores de JavaScript son manejados como excepciones que *inmediatamente* generan y arrojan un error utilizando el mecanismo estándar de JavaScript `throw`. Estos son manejados utilizando el [`try / catch` construct](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch) proporcionado por el lenguaje JavaScript.

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
- Cuando un método asíncrono es llamado sobre un objeto que es un `EventEmitter`, los errores pueden enrutarse al evento `'error'` de dicho objeto.

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

Errors generated in this way *cannot* be intercepted using `try / catch` as they are thrown *after* the calling code has already exited.

Los desarrolladores deben referirse a la documentación de cada método para determinar exactamente cómo son propagados los errores levantados por cada uno de estos métodos.

### Callbacks de primero-error<!--type=misc-->Most asynchronous methods exposed by the Node.js core API follow an idiomatic pattern referred to as an _error-first callback_ (sometimes referred to as a _Node.js style callback_). Con este patrón, se pasa una función callback al método como un argumento. Cuando la operación se complete o se levante un error, se llama a la función callback con el objeto Error (si existe) pasado como el primer argumento. Si no se levantó ningún error, el primer argumento será pasado como `null`.

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

El mecanismo `try /catch` de JavaScript **no puede** ser utilizado para interceptar errores generados por APIs asíncronas. Un error común de principiantes es intentar utilizar `throw` dentro de un callback error-first:

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

* {number}

La propiedad `Error.stackTraceLimit` especifica el número de stack frames recolectadas por un stack trace (ya sea que fue generado por `new Error().stack` o `Error.captureStackTrace(obj)`).

El valor por defecto es `10`, pero puede establecerse en cualquier número de JavaScript válido. Los cambos afectarán cualquier stack trace capturado *después* de que el valor haya sido cambiado.

Si se establece como un valor no-numérico, o un número negativo, los stack traces no capturarán ningún frame.

### error.code

* {string}

La propiedad `error.code` es una etiqueta de string que identifica el tipo de error. Vea [Códigos de Error Node.js](#nodejs-error-codes) para detalles de códigos específicos.

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

For example:

```txt
Error: ¡Siguen ocurriendo cosas!
   at /home/gbusey/file.js:525:2
   at Frobnicator.refrobulate (/home/gbusey/business-logic.js:424:21)
   at Actor.<anonymous> (/home/gbusey/actors.js:400:8)
   at increaseSynergy (/home/gbusey/actors.js:701:6)
```

La primera línea está formateada como `<error class name>: <error message>` y es seguida por una serie de stack frames (cada línea comenzando con "at"). Cada frame describe un sitio de llamada dentro del código que conduce al error generado. V8 intenta mostrar un nombre para cada función (por nombre de la variable, nombre de la función o nombre del método del objeto), pero ocasionalmente no podrá encontrar un nombre adecuado. Si V8 no puede determinar un nombre para la función, sólo se mostrará información de ubicación para ese frame. De lo contrario, el nombre de la función determinada será mostrado con la información de ubicación adjunta en paréntesis.

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

El número de frames capturados por el stack trace es limitado por el menor de `Error.stackTraceLimit` o el número de frames disponibles en el tic del bucle del evento actual.

Los errores a nivel de sistema son generados como instancias de `Error` aumentadas, las cuales se detallan [aquí](#errors_system_errors).

## Clase: AssertionError (Error de Afirmación)

Una subclase de `Error` que indica el fallo de una afirmación. Such errors commonly indicate inequality of actual and expected value.

For example:

```js
assert.strictEqual(1, 2);
// AssertionError [ERR_ASSERTION]: 1 === 2
```

## Clase: RangeError (Error de Rango)

Una subclase de `Error` que indica que un argumento proporcionado no estaba dentro del conjunto o rango de valores aceptables para una función, ya sea un rango númerico o esté fuera del conjunto de opciones para un parámetro de función dado.

For example:

```js
require('net').connect(-1);
// arroja "RangeError: "port" option should be >= 0 and < 65536: -1"
```

Node.js generará y arrojará instancias de `RangeError` *inmediatamente* como forma de validación de argumento.

## Clase: ReferenceError (Error de Referencia)

Una subclase de `Error` que indica que se está haciendo un intento para acceder a una variable que no está definida. Dichos errores usualmente indican typos en el código o, de lo contrario, un programa dañado.

Mientras que el código cliente puede generar y propagar estos errores, en la práctica, sólo lo hará el V8.

```js
doesNotExist;
// arroja un ReferenceError, doesNotExist no es una variable en este programa.
```

A menos que una aplicación esté dinámicamente generando y ejecutando código, instancias de `ReferenceError` deberían siempre ser consideradas un bug en el código o en sus dependencias.

## Clase: SyntaxError (Error de Sintaxis)

Una sub-clase de `Error` que indica que un programa no es un JavaScript válido. Estos errores solo pueden ser generados y propagados como un resultado de evaluación de código. La evaluación de código puede ocurrir como resultado de `eval`, `Function`, `require` o [vm](vm.html). Estos errores casi siempre son indicadores de un programa roto.

```js
try {
  require('vm').runInThisContext('binary ! isNotOk');
} catch (err) {
  // err será un SyntaxError
}
```

Las instancias de `SyntaxError` son irrecuperables en el contexto que las creó - sólo pueden ser atrapadas por otros contextos.

## Clase: TypeError (Error de Tipo)

Una sub-clase de `Error` que indica que un argumento proporcionado no es de un tipo permitido. Por ejemplo, pasar una función a un parámetro que espera una string será considerado un TypeError.

```js
require('url').parse(() => { });
// arroja TypeError, ya que esperaba una string
```

Node.js generará y arrojará instancias de `TypeError` *inmediatamente* como una forma de validación de argumento.

## Excepciones vs. Errores<!--type=misc-->Una excepción JavaScript es un valor que es arrojado como resultado de una operación inválida o como el objetivo de una declaración `throw`. Aunque no es necesario que estos valores sean instancias de `Error` o clases heredadas de `Error`, todas las excepciones arrojadas por JavaScript o el tiempo de ejecución de JavaScript *serán* instancias de Error.

Algunas excepciones son *irrecuperables* en la capa de JavaScript. Dichas excepciones *siempre* causarán que el proceso Node.js se detenga. Los ejemplos incluyen llamadas a `assert()` revisiones o `abort()` en la capa de C++.

## Errores de Sistema

Los errores de sistema son generados cuando ocurren excepciones dentro del entorno del tiempo de ejecución del programa. Típicamente, estos son errores operacionales que ocurren cuando una aplicación viola una restricción de sistema operativo, como lo es intentar leer un archivo que no existe o cuando el usuario no tiene permisos suficientes.

Los errores del sistema se generan típicamente a nivel de syscall: una lista exhaustiva de códigos de error y sus significados está disponible al ejecutar `man 2 intro` o `man 3 errno` en la mayoría de los Unices; u [online](http://man7.org/linux/man-pages/man3/errno.3.html).

En Node.js, los errores de sistema son representados como objetos de `Error` aumentados con propiedades añadidas.

### Clase: Error de Sistema

#### error.code

* {string}

La propiedad `error.code` es una string que representa el código de error, el cual es típicamente `E`, seguido por una secuencia de letras mayúsculas.

#### error.errno

* {string|number}

La propiedad `error.errno` es un número o una string. El número es un valor **negativo** que corresponde al código de error definido en [`libuv Error handling`]. Vea el archivo encabezado uv-errno.h (`deps/uv/include/uv-errno.h` en el árbol fuente de Node.js) para detalles. En caso de una string, es el mismo que `error.code`.

#### error.syscall

* {string}

La propiedad `error.syscall` es una string que describe la [syscall](http://man7.org/linux/man-pages/man2/syscall.2.html) que falló.

#### error.path

* {string}

Cuando está presente (por ejemplo, en `fs` o `child_process`), la propiedad `error.path` es una string que contiene un nombre de ruta inválido relevante.

#### error.address

* {string}

Cuando está presente (por ejemplo, en `net` or `dgram`), la propiedad `error.address` es una string que describe la dirección hacia la cual la conexión falló.

#### error.port

* {number}

Cuando está presente (por ejemplo, en `net` or `dgram`), la propiedad `error.port` es un número que representa el puerto de la conexión que no está disponible.

### Errores de Sistema Comunes

Esta lista **no es exhaustiva**, pero enumera muchos de los errores de sistema encontrados al escribir un programa de Node.js. Una lista exhaustiva puede ser encontrada [aquí](http://man7.org/linux/man-pages/man3/errno.3.html).

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

<a id="ERR_ARG_NOT_ITERABLE"></a>

### ERR_ARG_NOT_ITERABLE

Un argumento iterable (es decir, un valor que funciona con loops `for...of`) era requerido, pero no fue proporcionado a un API de Node.js.

<a id="ERR_ASYNC_CALLBACK"></a>

### ERR_ASYNC_CALLBACK

Se intentó registrar algo que no es una función como un callback `AsyncHooks`.

<a id="ERR_ASYNC_TYPE"></a>

### ERR_ASYNC_TYPE

El tipo de una fuente asincrónica era inválido. Los usuarios son capaces de definir su propio type al usar la API pública del embebedor.

<a id="ERR_ENCODING_INVALID_ENCODED_DATA"></a>

### ERR_ENCODING_INVALID_ENCODED_DATA

Los datos proporcionados a la API `util.TextDecoder()` eran inválidos, de acuerdo a la codificación proporcionada.

<a id="ERR_ENCODING_NOT_SUPPORTED"></a>

### ERR_ENCODING_NOT_SUPPORTED

La codificación proporcionada a la API `util.TextDecoder()` no era una de las [Codificaciones Soportadas por WHATWG](util.md#whatwg-supported-encodings).

<a id="ERR_FALSY_VALUE_REJECTION"></a>

### ERR_FALSY_VALUE_REJECTION

Una `Promise` que se llamó como callback via `util.callbackify()` se rechazó con un valor falso.

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

El encabezado `Trailer` fue establecido incluso a pesar de que la codificación de transferencia no soporta eso.

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

Para las solicitudes HTTP/2 que utilizan el método `CONNECT`, el pseudo encabezado `:authority` es requerido.

<a id="ERR_HTTP2_CONNECT_PATH"></a>

### ERR_HTTP2_CONNECT_PATH

Para las solicitudes HTTP/2 que utilizan el método `CONNECT`, el pseudo encabezado `:path` está prohibido.

<a id="ERR_HTTP2_CONNECT_SCHEME"></a>

### ERR_HTTP2_CONNECT_SCHEME

Para las solicitudes HTTP/2 que utilizan el método `CONNECT`, el pseudo encabezado `:scheme` está prohibido.

<a id="ERR_HTTP2_FRAME_ERROR"></a>

### ERR_HTTP2_FRAME_ERROR

A failure occurred sending an individual frame on the HTTP/2 session.

<a id="ERR_HTTP2_GOAWAY_SESSION"></a>

### ERR_HTTP2_GOAWAY_SESSION

Los nuevos Streams HTTP/2 pueden no estar abiertos luego de que `Http2Session` haya recibido un frame `GOAWAY` del peer conectado.

<a id="ERR_HTTP2_HEADER_REQUIRED"></a>

### ERR_HTTP2_HEADER_REQUIRED

A required header was missing in an HTTP/2 message.

<a id="ERR_HTTP2_HEADER_SINGLE_VALUE"></a>

### ERR_HTTP2_HEADER_SINGLE_VALUE

Se proporcionaron múltiples valores para un campo de encabezado HTTP/2 que requería tener sólo un valor simple.

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

An attempt was made to use the `Http2Stream.prototype.responseWithFile()` API to send something other than a regular file.

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

<a id="ERR_INVALID_ARG_TYPE"></a>

### ERR_INVALID_ARG_TYPE

Se pasó un argumento de tipo erróneo a un API Node.js.

<a id="ERR_INVALID_ASYNC_ID"></a>

### ERR_INVALID_ASYNC_ID

Se pasó un `asyncId` o `triggerAsyncId` inválido usando `AsyncHooks`. No debe ocurrir nunca un id menor que -1.

<a id="ERR_INVALID_CALLBACK"></a>

### ERR_INVALID_CALLBACK

Se requirió una función callback, pero no fue proporcionada a un API de Node.js.

<a id="ERR_INVALID_FILE_URL_HOST"></a>

### ERR_INVALID_FILE_URL_HOST

Un API Node.js que consume URLs de `file:` (como ciertas funciones en el módulo [`fs`][]) encontró una URL de un archivo con un host incompatible. Esta situación sólo puede ocurrir en sistemas tipo Unix donde sólo se soportan `localhost` o un host vacío.

<a id="ERR_INVALID_FILE_URL_PATH"></a>

### ERR_INVALID_FILE_URL_PATH

Un API Node.js que consume URLs de `file:` (como ciertas funciones en el módulo [`fs`][]) encontró una URL de de un archivo con una ruta incompatible. La semántica exacta para determinar si se puede usar una ruta es dependiente de la plataforma.

<a id="ERR_INVALID_HANDLE_TYPE"></a>

### ERR_INVALID_HANDLE_TYPE

Se intentó enviar un "handle" no soportado sobre un canal de comunicación IPC a un proceso secundario. Vea [`subprocess.send()`] y [`process.send()`] para más información.

<a id="ERR_INVALID_OPT_VALUE"></a>

### ERR_INVALID_OPT_VALUE

Se pasó un valor inválido o inesperado en un objeto de opciones.

<a id="ERR_INVALID_PERFORMANCE_MARK"></a>

### ERR_INVALID_PERFORMANCE_MARK

Al usar el API de Tiempo de Rendimiento (`perf_hooks`), una marca de rendimiento es inválida.

<a id="ERR_INVALID_PROTOCOL"></a>

### ERR_INVALID_PROTOCOL

Se pasó un `options.protocol` inválido.

<a id="ERR_INVALID_SYNC_FORK_INPUT"></a>

### ERR_INVALID_SYNC_FORK_INPUT

Se pasó un `Buffer`, `Uint8Array` o `string` como input al stdio de un fork síncrono. See the documentation for the [`child_process`](child_process.html) module for more information.

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

Un elemento en el `iterable` proporcionado al [WHATWG](url.html#url_the_whatwg_url_api) [`URLSearchParams` constructor][`new URLSearchParams(iterable)`] no representó una dupla `[name, value]` - es decir, si un elemento no es iterable o no consiste en dos elementos exactos.

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

Se intentó desconectar un canal de comunicación IPC que ya estaba desconectado. See the documentation for the [`child_process`](child_process.html) module for more information.

<a id="ERR_IPC_ONE_PIPE"></a>

### ERR_IPC_ONE_PIPE

Se intentó crear un proceso Node.js secundario utilizando más de un canal de comunicación IPC. See the documentation for the [`child_process`](child_process.html) module for more information.

<a id="ERR_IPC_SYNC_FORK"></a>

### ERR_IPC_SYNC_FORK

Se intentó abrir un canal de comunicación IPC con un proceso Node.js originado en un fork síncrono. See the documentation for the [`child_process`](child_process.html) module for more information.

<a id="ERR_MISSING_ARGS"></a>

### ERR_MISSING_ARGS

No se pasó un argumento de API de Node.js requerido. Esto sólo se usa para el cumplimiento estricto con la especificación API (la cual, en algunos casos, puede aceptar `func(undefined)`, pero no `func()`). En la mayoría de las APIs de Node.js nativas, `func(undefined)` y `func()` son tratados de igual manera, y el código de error [`ERR_INVALID_ARG_TYPE`][] puede ser utilizado en su lugar.

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

*Note*: A callback is almost always meant to only be called once as the query can either be fulfilled or rejected but not both at the same time. Esto último podría pasar si se llama a un callback más de una vez.

<a id="ERR_NAPI_CONS_FUNCTION"></a>

### ERR_NAPI_CONS_FUNCTION

Mientras se utilizaba `N-API`, se pasó un constructor que no era una función.

<a id="ERR_NAPI_CONS_PROTOTYPE_OBJECT"></a>

### ERR_NAPI_CONS_PROTOTYPE_OBJECT

While using `N-API`, `Constructor.prototype` was not an object.

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

On the main thread, values are removed from the queue associated with the thread-safe function in an idle loop. This error indicates that an error has occurred when attemping to start the loop.

<a id="ERR_NAPI_TSFN_STOP_IDLE_LOOP"></a>

### ERR_NAPI_TSFN_STOP_IDLE_LOOP

Once no more items are left in the queue, the idle loop must be suspended. This error indicates that the idle loop has failed to stop.

<a id="ERR_NO_ICU"></a>

### ERR_NO_ICU

Se intentó utilizar características que requieren [ICU](intl.html#intl_internationalization_support), pero Node.js no fue compilado con soporte de ICU.

<a id="ERR_SOCKET_ALREADY_BOUND"></a>

### ERR_SOCKET_ALREADY_BOUND

Se intentó enlazar un socket que ya se había enlazado.

<a id="ERR_SOCKET_BAD_PORT"></a>

### ERR_SOCKET_BAD_PORT

Una función API que esperaba un puerto > 0 y < 65536 recibió un valor inválido.

<a id="ERR_SOCKET_BAD_TYPE"></a>

### ERR_SOCKET_BAD_TYPE

Una función que esperaba un tipo de socket (`udp4` o `udp6`) recibió un valor inválido.

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

### ERR_STDERR_CLOSE<!-- YAML
removed: v8.16.0
changes:
  - version: v8.16.0
    pr-url: https://github.com/nodejs/node/pull/23053
    description: Rather than emitting an error, `process.stderr.end()` now
                 only closes the stream side but not the underlying resource,
                 making this error obsolete.
-->Se intentó cerrar el stream `process.stderr`. Por diseño, Node.js no permite que los streams `stdout` o `stderr` sean cerrados por código de usuario.

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

Se intentó cerrar el stream `process.stdout`. Por diseño, Node.js no permite que los streams `stdout` o `stderr` sean cerrados por código de usuario.

<a id="ERR_TLS_CERT_ALTNAME_INVALID"></a>

### ERR_TLS_CERT_ALTNAME_INVALID

Al intentar usar TLS, el hostnamo o la IP de la otra parte no coincidió con ninguno de los subjectAltNames en su certificado.

<a id="ERR_TLS_DH_PARAM_SIZE"></a>

### ERR_TLS_DH_PARAM_SIZE

Mientras se utilizaba TLS, el parámetro ofrecido para el protocolo de acuerdo de clave Diffle-Hellman (`DH`) es muy peuqeño. Por defecto, el tamaño de la clave debe ser mayor que o igual a 1024 bits para evitar vulnerabilidades, a pesar de que es altamente recomendado utilizar 2048 bits o más para una mayor seguridad.

<a id="ERR_TLS_HANDSHAKE_TIMEOUT"></a>

### ERR_TLS_HANDSHAKE_TIMEOUT

Se venció el tiempo después de inicio de una comunicación TLS/SSL. En este caso, el servidor debe también abortar la conexión.

<a id="ERR_TLS_RENEGOTIATION_FAILED"></a>

### ERR_TLS_RENEGOTIATION_FAILED

A TLS renegotiation request has failed in a non-specific way.

<a id="ERR_TLS_REQUIRED_SERVER_NAME"></a>

### ERR_TLS_REQUIRED_SERVER_NAME

Mientras se utilizaba TLS, se llamó al método `server.addContext()` sin proporcionar un nombre de host en el primer parámetro.

<a id="ERR_TLS_SESSION_ATTACK"></a>

### ERR_TLS_SESSION_ATTACK

Se detectó una cantidad excesiva de renegociaciones TLS, lo cual es un vector potencial para ataques de negación de servicio.

<a id="ERR_TRANSFORM_ALREADY_TRANSFORMING"></a>

### ERR_TRANSFORM_ALREADY_TRANSFORMING

Un stream Transform terminó mientras todavía se estaba transformando.

<a id="ERR_TRANSFORM_WITH_LENGTH_0"></a>

### ERR_TRANSFORM_WITH_LENGTH_0

Un stream Transform terminó mientras aún tenía datos en el búfer de escritura.

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

El API V8 BreakIterator fue usado, pero el conjunto de los datos ICU completos no está instalado.

<a id="ERR_VALID_PERFORMANCE_ENTRY_TYPE"></a>

### ERR_VALID_PERFORMANCE_ENTRY_TYPE

Mientras se usaba el API de Tiempo de Rendimiento (`perf_hooks`), no se encontraron tipos de entrada de rendimiento válidos.

<a id="ERR_VALUE_OUT_OF_RANGE"></a>

### ERR_VALUE_OUT_OF_RANGE

Un valor dado está fuera del rango aceptado.
