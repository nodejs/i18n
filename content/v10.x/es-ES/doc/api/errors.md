# Errores

<!--introduced_in=v4.0.0-->

<!--type=misc-->

Las aplicaciones que se ejecutan en Node.js generalmente experimentarán cuatro categorías de errores:

- Errores estándar de JavaScript, tales como: 
  - {EvalError} : arrojado cuando falla una llamada a `eval()`.
  - {SyntaxError} : arrojados en respuesta a sintaxis incorrecta del lenguaje JavaScript.
  - {RangeError} : arrojado cuando un valor no está dentro de un rango esperado
  - {ReferenceError} : arrojado al utilizar variables indefinidas
  - {TypeError} : arrojado al pasar argumentos de tipo incorrecto
  - {URIError} : arrojado cuando se utiliza de manera incorrecta una función de manejo URI global.
- Errores de sistema provocados por limitaciones de sistema operativo subyacentes, tales como intentar abrir un archivo que no existe, intentar enviar datos a través de un socket cerrado, etc;
- Y errores de usuario específico provocados por códigos de aplicación.
- Los `AssertionError` son una clase especial de error que pueden desencadenarse cada vez que Node.js detecta una violación lógica excepcional que nunca debería ocurrir. Estos son levantados típicamente por el módulo `assert`.

Todos los errores de JavaScript y Sistema planteados por Node.js se heredan, o son casos, de la clase {Error} de JavaScript estándar y se garantiza que proporcionen, *al menos*, las propiedades disponibles en dicha clase.

## Error Propagation and Interception

<!--type=misc-->

Node.js soporta varios mecanismos para la propagación y manejo de errores que puedan ocurrir cuando una aplicación se está ejecutando. La manera en que estos errores se reportan y manejan depende completamente del tipo de `Error` y estilo de la API que sea llamada.

Todos los errores de JavaScript son manejados como excepciones que *inmediatamente* generan y arrojan un error usando el mecanismo `throw` de JavaScript estándar. These are handled using the [`try / catch` construct](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch) provided by the JavaScript language.

```js
// Arroja con un ReferenceError porque z está indefinido
try {
  const m = 1;
  const n = m + z;
} catch (err) {
  // Handle the error here.
}
```

Cualquier uso del mecanismo `throw` de JavaScript levantará una excepción que *debe* ser manejada usando `try / catch`, o el proceso Node.js se cerrará inmediatamente.

Con pocas excepciones, las APIs *Sincrónicas* (cualquier método de bloqueo que no acepte una función `callback`, como [`fs.readFileSync`][]) utilizarán `throw` para informar errores.

Errores que ocurren dentro de *APIs Asincrónicas* pueden ser reportados de múltiples maneras:

- La mayoría de los métodos asincrónicos que aceptan una función `callback` aceptarán un objeto `Error` pasado como el primer argumento a esa función. Si ese primer argumento no es `null` y es una instancia de `Error`, entonces ocurrió un error que debe ser manejado.

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

- Cuando se llama a un método asincrónico en un objeto que es un [`EventEmitter`][], los errores pueden enrutarse al evento `'error'` de ese objeto.
  
  ```js
  const net = require('net');
  const connection = net.connect('localhost');
  
  // Añadiendo un manejador del evento 'error' a un stream:
  connection.on('error', (err) => {
    // Si la conexión es restablecida por el servidor, si no puede
    // conectarse en lo absoluto o cualquier tipo de error encontrado por
    // la conexión, el error se enviará a acá.
    console.error(err);
  });
  
  connection.pipe(process.stdout);
  ```

- Un puñado de métodos típicamente asincrónicos en el API de Node.js puede todavía usar el mecanismo `throw` para levantar excepciones que deben ser manejadas utilizando `try / catch`. No hay una lista comprensiva de dichos método; por favor, refiérase a la documentación de cada método para determinar el mecanismo manejador de errores apropiado requerido.

El uso del mecanismo del evento `'error'` es más común para APIs [basadas en streams](stream.html) y [basadas en emisor de eventos ](events.html#events_class_eventemitter), los cuales representan una serie de operaciones asincrónicas a lo largo del tiempo (a diferencia de una simple operación que puede aprobar o reprobar).

Para *todos* los objetos [`EventEmitter`][], si no se proporciona un manejador del evento `'error'`, se arrojará el error, causando que el proceso Node.js reporte una excepción no detectada y ocasione un fallo, a menos que: El módulo [`dominio`](domain.html) sea usado apropiadamente, o se haya registrado un manejador para el evento [`'uncaughtException'`][].

```js
const EventEmitter = require('events');
const ee = new EventEmitter();

setImmediate(() => {
  // Esto generará un fallo en el proceso porque no se ha añadido
  // ningún manejador del evento 'error'.
  ee.emit('error', new Error('This will crash'));
});
```

Los errores generados de esta manera *no pueden* ser interceptados usando `try / catch`, ya que son arrojados *después* de que el código de llamada ha sido cerrado.

Los desarrolladores deben referirse a la documentación de cada método para determinar exactamente cómo los errores levantados por estos métodos son propagados.

### Error-first callbacks

<!--type=misc-->

La mayoría de los métodos asincrónicos expuestos por el API core de Node.js siguen un patrón idiomático denominado *error-first callback* (algunas veces referido como *callback de estilo Node.js*). Con este patrón, se pasa una función callback al método como un argumento. Cuando la operación se complete o se levante un error, se llama a la función callback con el objeto `Error` (si existe) pasado como el primer argumento. Si no se levantó ningún error, el primer argumento será pasado como `null`.

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

El mecanismo `try / catch` de JavaScript **no puede** ser utilizado para interceptar errores generados por APIs asincrónicas. Un error común de principiantes es intentar utilizar `throw` dentro de un callback error-first:

```js
// ESTO NO FUNCIONARÁ:
const fs = require('fs');

try {
  fs.readFile('/some/file/that/does-not-exist', (err, data) => {
    // mistaken assumption: throwing here...
    if (err) {
      throw err;
    }
  });
} catch (err) {
  // ¡Esto no atrapará el throw!
  console.error(err);
}
```

Esto no funcionará porque la función callback pasada a `fs.readFile()` es llamada asincrónicamente. Al momento en el que se llama al callback, el código circundante (incluyendo el bloque `try { } catch (err) { }`) ya se habrá cerrado. Arrojar un error dentro del callback **puede generar un fallo en el proceso Node.js** en la mayoría de los casos. Si los [dominios](domain.html) están habilitados o se ha registrado un manejador con `process.on('uncaughtException')`, dichos errores pueden ser interceptados.

## Clase: Error

<!--type=class-->

Un objeto `Error` de JavaScript genérico que no denota ninguna circunstancia específica de porqué el error ocurrió. Los objetos `Error` capturan un "stack trace" detallando el punto en el código en el cual el `Error` fue instanciado, y pueden proporcionar una descripción de texto del error.

Sólo para criptos, los objetos `Error` incluirán el stack de error de OpenSSL en una propiedad separada llamada `opensslErrorStack`, si está disponible cuando se arroja el error.

Todos los errores generados por Node.js, incluyendo todos los errores de Sistema y JavaScript, serán instancias o serán heredados de la clase `Error`.

### new Error(message)

- `message` {string}

Crea un nuevo objeto `Error` y establece la propiedad `error.message` al mensaje de texto proporcionado. Si se pasa un objeto como `message`, el mensaje de texto es generado llamando a `message.toString()`. La propiedad `error.stack` representará el punto en el código en el cual `new Error()` fue llamado. Stack traces are dependent on [V8's stack trace API](https://github.com/v8/v8/wiki/Stack-Trace-API). Los stack traces se extienden a (a) el inicio de la *ejecución sincrónica de código* o (b) el número de frames dados por la propiedad `Error.stackTraceLimit`, lo que sea más pequeño.

### Error.captureStackTrace(targetObject[, constructorOpt])

- `targetObject` {Object}
- `constructorOpt` {Function}

Crea una nueva propiedad `.stack` en `targetObject`, el cual al ser accedido devuelve una string que representa la ubicación en el código en la cual `Error.captureStackTrace()` fue llamado.

```js
const myObject = {};
Error.captureStackTrace(myObject);
myObject.stack;  // similar a `new Error().stack`
```

La primera línea de la traza tendrá como prefijo `${myObject.name}: ${myObject.message}`.

El argumento opcional `constructorOpt` acepta una función. Si se le otorga, todos los cuerpos encima de `constructorOpt`, incluyendo `constructorOpt`, serán omitidos del stack trace generado.

El argumento `constructorOpt` es útil para ocultar detalles de implementación de generación de errores de un usuario final. Por ejemplo:

```js
function MyError() {
  Error.captureStackTrace(this, MyError);
}

// Si no se pasase MyError a captureStackTrave, el cuerpo
// MyError se mostraría en la propiedad .stack. Al pasar
// el constructor, omitimos ese cuerpo y retenemos todos los cuerpos debajo de él.
new MyError().stack;
```

### Error.stackTraceLimit

- {number}

La propiedad `Error.stackTraceLimit` especifica el número de stack frames recogidos por un stack trace (ya sean generados por `new Error().stack` o `Error.captureStackTrace(obj)`).

El valor por defecto es `10`, pero puede establecerse a cualquier número de JavaScript válido. Los cambos afectarán cualquier stack trace capturado *después* de que el valor haya sido cambiado.

Si se establece a un valor no numérico o a un valor negativo, los stack traces no capturarán ningún frame.

### error.code

- {string}

La propiedad `error.code` es una etiqueta de string que identifica el tipo de error. Vea [Códigos de Error Node.js](#nodejs-error-codes) para detalles de códigos específicos.

### error.message

- {string}

La propiedad `error.message` es la descripción de string del error establecida al llamar a `new Error(message)`. El `message` pasado al constructor también aparecerá en la primera línea del stack trace del `Error`, sin embargo, cambiar esta propiedad después de creado el objeto `Error` *puede no* cambiar la primera línea del stack trace (por ejemplo, cuando `error.stack` es leído antes de que esta propiedad fuese cambiada).

```js
const err = new Error('The message');
console.error(err.message);
// Imprime: The message
```

### error.stack

- {string}

La propiedad `error.stack` es una string que describe el punto en el código en el cual el `Error` fue instanciado.

```txt
Error: ¡Siguen ocurriendo cosas!
   at /home/gbusey/file.js:525:2
   at Frobnicator.refrobulate (/home/gbusey/business-logic.js:424:21)
   at Actor.<anonymous> (/home/gbusey/actors.js:400:8)
   at increaseSynergy (/home/gbusey/actors.js:701:6)
```

La primera línea está formateada como `<error class name>: <error message>` y es seguida por una serie de stack frames (cada línea comenzando con "at"). Cada frame describe un sitio de llamada dentro del código que conduce al error generado. V8 intenta mostrar un nombre para cada función (por nombre de la variable, nombre de la función o nombre del método del objeto), pero ocasionalmente no podrá encontrar un nombre adecuado. Si V8 no puede determinar un nombre para la función, sólo se mostrará información de ubicación para ese frame. De lo contrario, el nombre de la función determinada será mostrado con la información de ubicación adjunta en paréntesis.

Los frames sólo son generados para funciones JavaScript. If, for example, execution synchronously passes through a C++ addon function called `cheetahify` which itself calls a JavaScript function, the frame representing the `cheetahify` call will not be present in the stack traces:

```js
const cheetahify = require('./native-binding.node');

function makeFaster() {
  // cheetahify *synchronously* calls speedy.
  cheetahify(function speedy() {
    throw new Error('oh no!');
  });
}

makeFaster();
// will throw:
//   /home/gbusey/file.js:6
//       throw new Error('oh no!');
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
- `/absolute/path/to/file.js:line:column`, si el frame representa una llamada en un programa de usuario o en sus dependencias.

La string que representa al stack trace es flojamente creada cuando la propiedad `error.stack` es **accedida**.

El número de frames capturados por el stack trace es limitado por el menor de `Error.stackTraceLimit` o el número de frames disponibles en el tic del bucle del evento actual.

Los errores a nivel de sistema son generados como instancias de `Error` aumentadas, las cuales se detallan [aquí](#errors_system_errors).

## Clase: AssertionError (Error de Afirmación)

Una subclase de `Error` que indica el fallo de una afirmación. Para detalles, vea [`Class: assert.AssertionError`][].

## Clase: RangeError (Error de Rango)

Una subclase de `Error` que indica que un argumento proporcionado no estaba dentro del conjunto o rango de valores aceptables para una función, ya sea un rango númerico o esté fuera del conjunto de opciones para un parámetro de función dado.

```js
require('net').connect(-1);
// throws "RangeError: "port" option should be >= 0 and < 65536: -1"
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

A subclass of `Error` that indicates that a program is not valid JavaScript. Estos errores solo pueden ser generados y propagados como un resultado de evaluación de código. La evaluación de código puede ocurrir como resultado de `eval`, `Function`, `require` o [vm](vm.html). Estos errores casi siempre son indicadores de un programa roto.

```js
try {
  require('vm').runInThisContext('binary ! isNotOk');
} catch (err) {
  // err será un SyntaxError
}
```

Las instancias de `SyntaxError` son irrecuperables en el contexto que las creó - sólo pueden ser atrapadas por otros contextos.

## Clase: TypeError (Error de Tipo)

Una sub-clase de `Error` que indica que un argumento proporcionado no es de un tipo permitido. Por ejemplo, el pasar una función a un parámetro que espera una string sería considerado un `TypeError`.

```js
require('url').parse(() => { });
// arroja un TypeError, ya que espera una string
```

Node.js generará y arrojará instancias de `TypeError` *inmediatamente* como una forma de validación de argumento.

## Excepciones vs. Errores

<!--type=misc-->

Una excepción JavaScript es un valor que es arrojado como resultado de una operación inválida o como el objetivo de una declaración `throw`. Si bien no es obligatorio que estos valores sean instancias de `Error` o clases heredadas de `Error`, todas las excepciones arrojadas por Node.js o por el tiempo de ejecución de JavaScript *serán* instancias de `Error`.

Algunas excepciones son *irrecuperables* en la capa de JavaScript. Dichas excepciones *siempre* causarán que el proceso Node.js se detenga. Examples include `assert()` checks or `abort()` calls in the C++ layer.

## Errores de Sistema

Los errores de sistema son generados cuando ocurren excepciones dentro del entorno del tiempo de ejecución (runtime environment) de Node.js. Típicamente, estos son errores operacionales que ocurren cuando una aplicación viola una restricción de sistema operativo, como lo es intentar leer un archivo que no existe o cuando el usuario no tiene permisos suficientes.

System errors are typically generated at the syscall level: an exhaustive list of error codes and their meanings is available by running `man 2 intro` or `man 3 errno` on most Unices; or [online](http://man7.org/linux/man-pages/man3/errno.3.html).

En Node.js, los errores de sistema son representados como objetos de `Error` aumentados con propiedades añadidas.

### Clase: SystemError (Error de Sistema)

### error.info

Las instancias de `SystemError` pueden tener una propiedad de `info` adicional cuyo valor es un objeto con detalles adicionales acerca de las condiciones de error.

Las siguientes propiedades son proporcionadas:

- `code` {string} El código de error de la string
- `errno` {number} El número de error proporcionado por el sistema
- `message` {string} Una descripción del error legible por humanos proporcionada por el sistema
- `syscall` {string} El nombre de la llamada de sistema que desencadenó el error
- `path` {Buffer} When reporting a file system error, the `path` will identify the file path.
- `dest` {Buffer} When reporting a file system error, the `dest` will identify the file path destination (if any).

#### error.code

- {string}

La propiedad `error.code` es una string que representa el código de error, el cual es típicamente `E`, seguido por una secuencia de letras mayúsculas.

#### error.errno

- {string|number}

La propiedad `error.errno` es un número o una string. El número es un valor **negativo** que corresponde al código de error definido en [`libuv Error handling`]. Vea el archivo encabezado `uv-errno.h` (`deps/uv/include/uv-errno.h` en el árbol fuente de Node.js) para detalles. En caso de una string, es el mismo que `error.code`.

#### error.syscall

- {string}

La propiedad `error.syscall` es una string que describe la [syscall](http://man7.org/linux/man-pages/man2/syscall.2.html) que falló.

#### error.path

- {string}

Cuando está presente (por ejemplo, en `fs` o `child_process`), la propiedad `error.path` es una string que contiene un nombre de ruta inválido relevante.

#### error.address

- {string}

Cuando está presente (por ejemplo, en `net` or `dgram`), la propiedad `error.address` es una string que describe la dirección hacia la cual la conexión falló.

#### error.port

- {number}

Cuando está presente (por ejemplo, en `net` or `dgram`), la propiedad `error.port` es un número que representa el puerto de la conexión que no está disponible.

### Errores de Sistema Comunes

Esta lista **no es exhaustiva**, pero enumera muchos de los errores de sistema encontrados al escribir un programa de Node.js. Una lista exhaustiva puede ser encontrada [aquí](http://man7.org/linux/man-pages/man3/errno.3.html).

- `EACCES` (Permiso denegado): Se intentó acceder a un archivo de una manera prohibida por sus permisos de acceso de archivo.

- `EADDRINUSE` (Dirección ya en uso): Un intento de enlazar un servidor ([`net`][], [`http`][] o [`https`][]) a una dirección local falló debido a que otro servidor en el sistema local ya está ocupando esa dirección.

- `ECONNREFUSED` (Conexión rechazada): No se pudo realizar ninguna conexión porque la máquina objetivo lo rechazó activamente. Estoy resulta generalmente de internet conectar a un servicio que está inactivo en el host extranjero.

- `ECONNRESET` (Conexión reiniciada por el peer): Una conexión fue cerrada a la fuerza por un peer. This normally results from a loss of the connection on the remote socket due to a timeout or reboot. Comúnmente encontrado mediante los módulos [`http`][] y [`net`][].

- `EEXIST` (El archivo existe): Un archivo existente fue el objetivo de una operación que requería que el objetivo no existiese.

- `EISDIR` (Es un directorio): Una operación esperaba un archivo, pero el nombre de la ruta dada era un directorio.

- `EMFILE` (Muchos archivos abiertos en el sistema): El número máximo de [descriptores de archivos](https://en.wikipedia.org/wiki/File_descriptor) permitidos en el sistema ha sido alcanzado y las solicitudes para otro descriptor no pueden cumplirse hasta que al menos uno haya sido cerrado. Esto ocurre al abrir muchos archivos a la vez en paralelo, especialmente en sistemas (macOS en particular) donde hay un límite de descriptor de archivos bajo para procesos. Para remediar un límite bajo, ejecute `ulimit -n 2048` en el mismo shell que ejecutara el proceso Node.js.

- `ENOENT` (No existe el archivo o directorio): Comúnmente levantado por operaciones [`fs`][] para indicar que un componente del nombre de ruta especificado no existe — no se pudo encontrar ninguna entidad (archivo o directorio) con la ruta dada.

- `ENOTDIR` (No es un directorio): Un componente del nombre de ruta dado existe, pero no era un directorio, como se esperaba. Comúnmente levantado por [`fs.readdir`][].

- `ENOTEMPTY` (Directorio no vacío): Un directorio con entradas fue el objetivo de una operación que requiere un directorio vacío — usualmente [`fs.unlink`][].

- `EPERM` (Operación no permitida): Se intentó realizar una operación que requiere privilegios elevados.

- `EPIPE` (Broken pipe): A write on a pipe, socket, or FIFO for which there is no process to read the data. Comúnmente encontrado en las capas [`net`][] y [`http`][], indicativos de que el lado remoto del stream en el que se escribe ha sido cerrado.

- `ETIMEDOUT` (Se agotó el tiempo de la operación): Una conexión o una solicitud enviada falló porque la parte conectada no respondió adecuadamente luego de un período de tiempo. Usualmente encontrado por [`http`][] o [`net`][] — a menudo, una señal de que `socket.end()` no fue llamado adecuadamente.

<a id="nodejs-error-codes"></a>

## Códigos de Error de Node.js

<a id="ERR_AMBIGUOUS_ARGUMENT"></a>

### ERR_AMBIGUOUS_ARGUMENT

Esto es accionado por el módulo `assert` en caso de que, por ejemplo, `assert.throws(fn, message)` sea usado de una manera en que el mensaje es el mensaje de error arrojado. Esto es ambiguo porque el mensaje no verifica el mensaje de error y sólo será arrojado en caso de que no se arroje ningún error.

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

El tipo de una fuente asincrónica era inválido. Note that users are also able to define their own types if using the public embedder API.

<a id="ERR_BUFFER_OUT_OF_BOUNDS"></a>

### ERR_BUFFER_OUT_OF_BOUNDS

Se intentó una operación afuera de los límites de un `Buffer`.

<a id="ERR_BUFFER_TOO_LARGE"></a>

### ERR_BUFFER_TOO_LARGE

Se intentó crear un `Buffer` más grande que el tamaño máximo permitido.

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

Utilizado cuando el proceso principal está intentando leer datos de los STDERR / STDOUT del proceso secundario y cuando el tamaño de los datos es mayor que la opción `maxBuffer`.

<a id="ERR_CONSOLE_WRITABLE_STREAM"></a>

### ERR_CONSOLE_WRITABLE_STREAM

La `Console` fue iniciada sin el stream `stdout` o la `Console` tiene un stream `stdout` o `stderr` no escribible.

<a id="ERR_CPU_USAGE"></a>

### ERR_CPU_USAGE

The native call from `process.cpuUsage` could not be processed.

<a id="ERR_CRYPTO_CUSTOM_ENGINE_NOT_SUPPORTED"></a>

### ERR_CRYPTO_CUSTOM_ENGINE_NOT_SUPPORTED

A client certificate engine was requested that is not supported by the version of OpenSSL being used.

<a id="ERR_CRYPTO_ECDH_INVALID_FORMAT"></a>

### ERR_CRYPTO_ECDH_INVALID_FORMAT

An invalid value for the `format` argument was passed to the `crypto.ECDH()` class `getPublicKey()` method.

<a id="ERR_CRYPTO_ECDH_INVALID_PUBLIC_KEY"></a>

### ERR_CRYPTO_ECDH_INVALID_PUBLIC_KEY

An invalid value for the `key` argument has been passed to the `crypto.ECDH()` class `computeSecret()` method. It means that the public key lies outside of the elliptic curve.

<a id="ERR_CRYPTO_ENGINE_UNKNOWN"></a>

### ERR_CRYPTO_ENGINE_UNKNOWN

Se pasó un identificador de motor criptográfico inválido a [`require('crypto').setEngine()`][].

<a id="ERR_CRYPTO_FIPS_FORCED"></a>

### ERR_CRYPTO_FIPS_FORCED

The [`--force-fips`][] command-line argument was used but there was an attempt to enable or disable FIPS mode in the `crypto` module.

<a id="ERR_CRYPTO_FIPS_UNAVAILABLE"></a>

### ERR_CRYPTO_FIPS_UNAVAILABLE

An attempt was made to enable or disable FIPS mode, but FIPS mode was not available.

<a id="ERR_CRYPTO_HASH_DIGEST_NO_UTF16"></a>

### ERR_CRYPTO_HASH_DIGEST_NO_UTF16

The UTF-16 encoding was used with [`hash.digest()`][]. While the `hash.digest()` method does allow an `encoding` argument to be passed in, causing the method to return a string rather than a `Buffer`, the UTF-16 encoding (e.g. `ucs` or `utf16le`) is not supported.

<a id="ERR_CRYPTO_HASH_FINALIZED"></a>

### ERR_CRYPTO_HASH_FINALIZED

[`hash.digest()`][] was called multiple times. The `hash.digest()` method must be called no more than one time per instance of a `Hash` object.

<a id="ERR_CRYPTO_HASH_UPDATE_FAILED"></a>

### ERR_CRYPTO_HASH_UPDATE_FAILED

[`hash.update()`][] failed for any reason. This should rarely, if ever, happen.

<a id="ERR_CRYPTO_INVALID_DIGEST"></a>

### ERR_CRYPTO_INVALID_DIGEST

An invalid [crypto digest algorithm](crypto.html#crypto_crypto_gethashes) was specified.

<a id="ERR_CRYPTO_INVALID_STATE"></a>

### ERR_CRYPTO_INVALID_STATE

A crypto method was used on an object that was in an invalid state. For instance, calling [`cipher.getAuthTag()`][] before calling `cipher.final()`.

<a id="ERR_CRYPTO_SIGN_KEY_REQUIRED"></a>

### ERR_CRYPTO_SIGN_KEY_REQUIRED

A signing `key` was not provided to the [`sign.sign()`][] method.

<a id="ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH"></a>

### ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH

[`crypto.timingSafeEqual()`][] was called with `Buffer`, `TypedArray`, or `DataView` arguments of different lengths.

<a id="ERR_DNS_SET_SERVERS_FAILED"></a>

### ERR_DNS_SET_SERVERS_FAILED

`c-ares` failed to set the DNS server.

<a id="ERR_DOMAIN_CALLBACK_NOT_AVAILABLE"></a>

### ERR_DOMAIN_CALLBACK_NOT_AVAILABLE

The `domain` module was not usable since it could not establish the required error handling hooks, because [`process.setUncaughtExceptionCaptureCallback()`][] had been called at an earlier point in time.

<a id="ERR_DOMAIN_CANNOT_SET_UNCAUGHT_EXCEPTION_CAPTURE"></a>

### ERR_DOMAIN_CANNOT_SET_UNCAUGHT_EXCEPTION_CAPTURE

[`process.setUncaughtExceptionCaptureCallback()`][] could not be called because the `domain` module has been loaded at an earlier point in time.

The stack trace is extended to include the point in time at which the `domain` module had been loaded.

<a id="ERR_ENCODING_INVALID_ENCODED_DATA"></a>

### ERR_ENCODING_INVALID_ENCODED_DATA

Data provided to `util.TextDecoder()` API was invalid according to the encoding provided.

<a id="ERR_ENCODING_NOT_SUPPORTED"></a>

### ERR_ENCODING_NOT_SUPPORTED

Encoding provided to `util.TextDecoder()` API was not one of the [WHATWG Supported Encodings](util.html#util_whatwg_supported_encodings).

<a id="ERR_FALSY_VALUE_REJECTION"></a>

### ERR_FALSY_VALUE_REJECTION

A `Promise` that was callbackified via `util.callbackify()` was rejected with a falsy value.

<a id="ERR_FS_FILE_TOO_LARGE"></a>

### ERR_FS_FILE_TOO_LARGE

An attempt has been made to read a file whose size is larger than the maximum allowed size for a `Buffer`.

<a id="ERR_FS_INVALID_SYMLINK_TYPE"></a>

### ERR_FS_INVALID_SYMLINK_TYPE

An invalid symlink type was passed to the [`fs.symlink()`][] or [`fs.symlinkSync()`][] methods.

<a id="ERR_HTTP_HEADERS_SENT"></a>

### ERR_HTTP_HEADERS_SENT

An attempt was made to add more headers after the headers had already been sent.

<a id="ERR_HTTP_INVALID_HEADER_VALUE"></a>

### ERR_HTTP_INVALID_HEADER_VALUE

An invalid HTTP header value was specified.

<a id="ERR_HTTP_INVALID_STATUS_CODE"></a>

### ERR_HTTP_INVALID_STATUS_CODE

Status code was outside the regular status code range (100-999).

<a id="ERR_HTTP_TRAILER_INVALID"></a>

### ERR_HTTP_TRAILER_INVALID

The `Trailer` header was set even though the transfer encoding does not support that.

<a id="ERR_HTTP2_ALTSVC_INVALID_ORIGIN"></a>

### ERR_HTTP2_ALTSVC_INVALID_ORIGIN

HTTP/2 ALTSVC frames require a valid origin.

<a id="ERR_HTTP2_ALTSVC_LENGTH"></a>

### ERR_HTTP2_ALTSVC_LENGTH

HTTP/2 ALTSVC frames are limited to a maximum of 16,382 payload bytes.

<a id="ERR_HTTP2_CONNECT_AUTHORITY"></a>

### ERR_HTTP2_CONNECT_AUTHORITY

For HTTP/2 requests using the `CONNECT` method, the `:authority` pseudo-header is required.

<a id="ERR_HTTP2_CONNECT_PATH"></a>

### ERR_HTTP2_CONNECT_PATH

For HTTP/2 requests using the `CONNECT` method, the `:path` pseudo-header is forbidden.

<a id="ERR_HTTP2_CONNECT_SCHEME"></a>

### ERR_HTTP2_CONNECT_SCHEME

For HTTP/2 requests using the `CONNECT` method, the `:scheme` pseudo-header is forbidden.

<a id="ERR_HTTP2_GOAWAY_SESSION"></a>

### ERR_HTTP2_GOAWAY_SESSION

New HTTP/2 Streams may not be opened after the `Http2Session` has received a `GOAWAY` frame from the connected peer.

<a id="ERR_HTTP2_HEADER_SINGLE_VALUE"></a>

### ERR_HTTP2_HEADER_SINGLE_VALUE

Multiple values were provided for an HTTP/2 header field that was required to have only a single value.

<a id="ERR_HTTP2_HEADERS_AFTER_RESPOND"></a>

### ERR_HTTP2_HEADERS_AFTER_RESPOND

An additional headers was specified after an HTTP/2 response was initiated.

<a id="ERR_HTTP2_HEADERS_SENT"></a>

### ERR_HTTP2_HEADERS_SENT

An attempt was made to send multiple response headers.

<a id="ERR_HTTP2_INFO_STATUS_NOT_ALLOWED"></a>

### ERR_HTTP2_INFO_STATUS_NOT_ALLOWED

Informational HTTP status codes (`1xx`) may not be set as the response status code on HTTP/2 responses.

<a id="ERR_HTTP2_INVALID_CONNECTION_HEADERS"></a>

### ERR_HTTP2_INVALID_CONNECTION_HEADERS

HTTP/1 connection specific headers are forbidden to be used in HTTP/2 requests and responses.

<a id="ERR_HTTP2_INVALID_HEADER_VALUE"></a>

### ERR_HTTP2_INVALID_HEADER_VALUE

An invalid HTTP/2 header value was specified.

<a id="ERR_HTTP2_INVALID_INFO_STATUS"></a>

### ERR_HTTP2_INVALID_INFO_STATUS

An invalid HTTP informational status code has been specified. Informational status codes must be an integer between `100` and `199` (inclusive).

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

An invalid value has been specified for an HTTP/2 setting.

<a id="ERR_HTTP2_INVALID_STREAM"></a>

### ERR_HTTP2_INVALID_STREAM

An operation was performed on a stream that had already been destroyed.

<a id="ERR_HTTP2_MAX_PENDING_SETTINGS_ACK"></a>

### ERR_HTTP2_MAX_PENDING_SETTINGS_ACK

Whenever an HTTP/2 `SETTINGS` frame is sent to a connected peer, the peer is required to send an acknowledgment that it has received and applied the new `SETTINGS`. By default, a maximum number of unacknowledged `SETTINGS` frames may be sent at any given time. This error code is used when that limit has been reached.

<a id="ERR_HTTP2_NO_SOCKET_MANIPULATION"></a>

### ERR_HTTP2_NO_SOCKET_MANIPULATION

An attempt was made to directly manipulate (read, write, pause, resume, etc.) a socket attached to an `Http2Session`.

<a id="ERR_HTTP2_OUT_OF_STREAMS"></a>

### ERR_HTTP2_OUT_OF_STREAMS

The number of streams created on a single HTTP/2 session reached the maximum limit.

<a id="ERR_HTTP2_PAYLOAD_FORBIDDEN"></a>

### ERR_HTTP2_PAYLOAD_FORBIDDEN

A message payload was specified for an HTTP response code for which a payload is forbidden.

<a id="ERR_HTTP2_PING_CANCEL"></a>

### ERR_HTTP2_PING_CANCEL

An HTTP/2 ping was canceled.

<a id="ERR_HTTP2_PING_LENGTH"></a>

### ERR_HTTP2_PING_LENGTH

HTTP/2 ping payloads must be exactly 8 bytes in length.

<a id="ERR_HTTP2_PSEUDOHEADER_NOT_ALLOWED"></a>

### ERR_HTTP2_PSEUDOHEADER_NOT_ALLOWED

An HTTP/2 pseudo-header has been used inappropriately. Pseudo-headers are header key names that begin with the `:` prefix.

<a id="ERR_HTTP2_PUSH_DISABLED"></a>

### ERR_HTTP2_PUSH_DISABLED

An attempt was made to create a push stream, which had been disabled by the client.

<a id="ERR_HTTP2_SEND_FILE"></a>

### ERR_HTTP2_SEND_FILE

An attempt was made to use the `Http2Stream.prototype.responseWithFile()` API to send a directory.

<a id="ERR_HTTP2_SEND_FILE_NOSEEK"></a>

### ERR_HTTP2_SEND_FILE_NOSEEK

An attempt was made to use the `Http2Stream.prototype.responseWithFile()` API to send something other than a regular file, but `offset` or `length` options were provided.

<a id="ERR_HTTP2_SESSION_ERROR"></a>

### ERR_HTTP2_SESSION_ERROR

The `Http2Session` closed with a non-zero error code.

<a id="ERR_HTTP2_SOCKET_BOUND"></a>

### ERR_HTTP2_SOCKET_BOUND

An attempt was made to connect a `Http2Session` object to a `net.Socket` or `tls.TLSSocket` that had already been bound to another `Http2Session` object.

<a id="ERR_HTTP2_STATUS_101"></a>

### ERR_HTTP2_STATUS_101

Use of the `101` Informational status code is forbidden in HTTP/2.

<a id="ERR_HTTP2_STATUS_INVALID"></a>

### ERR_HTTP2_STATUS_INVALID

An invalid HTTP status code has been specified. Status codes must be an integer between `100` and `599` (inclusive).

<a id="ERR_HTTP2_STREAM_CANCEL"></a>

### ERR_HTTP2_STREAM_CANCEL

An `Http2Stream` was destroyed before any data was transmitted to the connected peer.

<a id="ERR_HTTP2_STREAM_ERROR"></a>

### ERR_HTTP2_STREAM_ERROR

A non-zero error code was been specified in an `RST_STREAM` frame.

<a id="ERR_HTTP2_STREAM_SELF_DEPENDENCY"></a>

### ERR_HTTP2_STREAM_SELF_DEPENDENCY

When setting the priority for an HTTP/2 stream, the stream may be marked as a dependency for a parent stream. This error code is used when an attempt is made to mark a stream and dependent of itself.

<a id="ERR_HTTP2_TRAILERS_ALREADY_SENT"></a>

### ERR_HTTP2_TRAILERS_ALREADY_SENT

Trailing headers have already been sent on the `Http2Stream`.

<a id="ERR_HTTP2_TRAILERS_NOT_READY"></a>

### ERR_HTTP2_TRAILERS_NOT_READY

The `http2stream.sendTrailers()` method cannot be called until after the `'wantTrailers'` event is emitted on an `Http2Stream` object. The `'wantTrailers'` event will only be emitted if the `waitForTrailers` option is set for the `Http2Stream`.

<a id="ERR_HTTP2_UNSUPPORTED_PROTOCOL"></a>

### ERR_HTTP2_UNSUPPORTED_PROTOCOL

`http2.connect()` was passed a URL that uses any protocol other than `http:` or `https:`.

<a id="ERR_INDEX_OUT_OF_RANGE"></a>

### ERR_INDEX_OUT_OF_RANGE

A given index was out of the accepted range (e.g. negative offsets).

<a id="ERR_INSPECTOR_ALREADY_CONNECTED"></a>

### ERR_INSPECTOR_ALREADY_CONNECTED

While using the `inspector` module, an attempt was made to connect when the inspector was already connected.

<a id="ERR_INSPECTOR_CLOSED"></a>

### ERR_INSPECTOR_CLOSED

While using the `inspector` module, an attempt was made to use the inspector after the session had already closed.

<a id="ERR_INSPECTOR_NOT_AVAILABLE"></a>

### ERR_INSPECTOR_NOT_AVAILABLE

The `inspector` module is not available for use.

<a id="ERR_INSPECTOR_NOT_CONNECTED"></a>

### ERR_INSPECTOR_NOT_CONNECTED

While using the `inspector` module, an attempt was made to use the inspector before it was connected.

<a id="ERR_INVALID_ADDRESS_FAMILY"></a>

### ERR_INVALID_ADDRESS_FAMILY

The provided address family is not understood by the Node.js API.

<a id="ERR_INVALID_ARG_TYPE"></a>

### ERR_INVALID_ARG_TYPE

An argument of the wrong type was passed to a Node.js API.

<a id="ERR_INVALID_ARG_VALUE"></a>

### ERR_INVALID_ARG_VALUE

An invalid or unsupported value was passed for a given argument.

<a id="ERR_INVALID_ARRAY_LENGTH"></a>

### ERR_INVALID_ARRAY_LENGTH

An array was not of the expected length or in a valid range.

<a id="ERR_INVALID_ASYNC_ID"></a>

### ERR_INVALID_ASYNC_ID

An invalid `asyncId` or `triggerAsyncId` was passed using `AsyncHooks`. An id less than -1 should never happen.

<a id="ERR_INVALID_BUFFER_SIZE"></a>

### ERR_INVALID_BUFFER_SIZE

A swap was performed on a `Buffer` but its size was not compatible with the operation.

<a id="ERR_INVALID_CALLBACK"></a>

### ERR_INVALID_CALLBACK

A callback function was required but was not been provided to a Node.js API.

<a id="ERR_INVALID_CHAR"></a>

### ERR_INVALID_CHAR

Invalid characters were detected in headers.

<a id="ERR_INVALID_CURSOR_POS"></a>

### ERR_INVALID_CURSOR_POS

A cursor on a given stream cannot be moved to a specified row without a specified column.

<a id="ERR_INVALID_DOMAIN_NAME"></a>

### ERR_INVALID_DOMAIN_NAME

`hostname` can not be parsed from a provided URL.

<a id="ERR_INVALID_FD"></a>

### ERR_INVALID_FD

A file descriptor ('fd') was not valid (e.g. it was a negative value).

<a id="ERR_INVALID_FD_TYPE"></a>

### ERR_INVALID_FD_TYPE

A file descriptor ('fd') type was not valid.

<a id="ERR_INVALID_FILE_URL_HOST"></a>

### ERR_INVALID_FILE_URL_HOST

A Node.js API that consumes `file:` URLs (such as certain functions in the [`fs`][] module) encountered a file URL with an incompatible host. This situation can only occur on Unix-like systems where only `localhost` or an empty host is supported.

<a id="ERR_INVALID_FILE_URL_PATH"></a>

### ERR_INVALID_FILE_URL_PATH

A Node.js API that consumes `file:` URLs (such as certain functions in the [`fs`][] module) encountered a file URL with an incompatible path. The exact semantics for determining whether a path can be used is platform-dependent.

<a id="ERR_INVALID_HANDLE_TYPE"></a>

### ERR_INVALID_HANDLE_TYPE

An attempt was made to send an unsupported "handle" over an IPC communication channel to a child process. See [`subprocess.send()`] and [`process.send()`] for more information.

<a id="ERR_INVALID_HTTP_TOKEN"></a>

### ERR_INVALID_HTTP_TOKEN

An invalid HTTP token was supplied.

<a id="ERR_INVALID_IP_ADDRESS"></a>

### ERR_INVALID_IP_ADDRESS

An IP address is not valid.

<a id="ERR_INVALID_OPT_VALUE"></a>

### ERR_INVALID_OPT_VALUE

An invalid or unexpected value was passed in an options object.

<a id="ERR_INVALID_OPT_VALUE_ENCODING"></a>

### ERR_INVALID_OPT_VALUE_ENCODING

An invalid or unknown file encoding was passed.

<a id="ERR_INVALID_PERFORMANCE_MARK"></a>

### ERR_INVALID_PERFORMANCE_MARK

While using the Performance Timing API (`perf_hooks`), a performance mark is invalid.

<a id="ERR_INVALID_PROTOCOL"></a>

### ERR_INVALID_PROTOCOL

An invalid `options.protocol` was passed.

<a id="ERR_INVALID_REPL_EVAL_CONFIG"></a>

### ERR_INVALID_REPL_EVAL_CONFIG

Both `breakEvalOnSigint` and `eval` options were set in the REPL config, which is not supported.

<a id="ERR_INVALID_RETURN_VALUE"></a>

### ERR_INVALID_RETURN_VALUE

Thrown in case a function option does not return an expected value on execution. For example when a function is expected to return a promise.

<a id="ERR_INVALID_SYNC_FORK_INPUT"></a>

### ERR_INVALID_SYNC_FORK_INPUT

A `Buffer`, `Uint8Array` or `string` was provided as stdio input to a synchronous fork. See the documentation for the [`child_process`][] module for more information.

<a id="ERR_INVALID_THIS"></a>

### ERR_INVALID_THIS

A Node.js API function was called with an incompatible `this` value.

Example:

```js
const urlSearchParams = new URLSearchParams('foo=bar&baz=new');

const buf = Buffer.alloc(1);
urlSearchParams.has.call(buf, 'foo');
// Throws a TypeError with code 'ERR_INVALID_THIS'
```

<a id="ERR_INVALID_TUPLE"></a>

### ERR_INVALID_TUPLE

An element in the `iterable` provided to the [WHATWG](url.html#url_the_whatwg_url_api) [`URLSearchParams` constructor][`new URLSearchParams(iterable)`] did not represent a `[name, value]` tuple – that is, if an element is not iterable, or does not consist of exactly two elements.

<a id="ERR_INVALID_URI"></a>

### ERR_INVALID_URI

An invalid URI was passed.

<a id="ERR_INVALID_URL"></a>

### ERR_INVALID_URL

An invalid URL was passed to the [WHATWG](url.html#url_the_whatwg_url_api) [`URL` constructor][`new URL(input)`] to be parsed. The thrown error object typically has an additional property `'input'` that contains the URL that failed to parse.

<a id="ERR_INVALID_URL_SCHEME"></a>

### ERR_INVALID_URL_SCHEME

An attempt was made to use a URL of an incompatible scheme (protocol) for a specific purpose. It is only used in the [WHATWG URL API](url.html#url_the_whatwg_url_api) support in the [`fs`][] module (which only accepts URLs with `'file'` scheme), but may be used in other Node.js APIs as well in the future.

<a id="ERR_IPC_CHANNEL_CLOSED"></a>

### ERR_IPC_CHANNEL_CLOSED

An attempt was made to use an IPC communication channel that was already closed.

<a id="ERR_IPC_DISCONNECTED"></a>

### ERR_IPC_DISCONNECTED

An attempt was made to disconnect an IPC communication channel that was already disconnected. See the documentation for the [`child_process`][] module for more information.

<a id="ERR_IPC_ONE_PIPE"></a>

### ERR_IPC_ONE_PIPE

An attempt was made to create a child Node.js process using more than one IPC communication channel. See the documentation for the [`child_process`][] module for more information.

<a id="ERR_IPC_SYNC_FORK"></a>

### ERR_IPC_SYNC_FORK

An attempt was made to open an IPC communication channel with a synchronously forked Node.js process. See the documentation for the [`child_process`][] module for more information.

<a id="ERR_MEMORY_ALLOCATION_FAILED"></a>

### ERR_MEMORY_ALLOCATION_FAILED

An attempt was made to allocate memory (usually in the C++ layer) but it failed.

<a id="ERR_METHOD_NOT_IMPLEMENTED"></a>

### ERR_METHOD_NOT_IMPLEMENTED

A method is required but not implemented.

<a id="ERR_MISSING_ARGS"></a>

### ERR_MISSING_ARGS

A required argument of a Node.js API was not passed. This is only used for strict compliance with the API specification (which in some cases may accept `func(undefined)` but not `func()`). In most native Node.js APIs, `func(undefined)` and `func()` are treated identically, and the [`ERR_INVALID_ARG_TYPE`][] error code may be used instead.

<a id="ERR_MISSING_MODULE"></a>

### ERR_MISSING_MODULE

> Stability: 1 - Experimental

An [ES6 module](esm.html) could not be resolved.

<a id="ERR_MODULE_RESOLUTION_LEGACY"></a>

### ERR_MODULE_RESOLUTION_LEGACY

> Stability: 1 - Experimental

A failure occurred resolving imports in an [ES6 module](esm.html).

<a id="ERR_MULTIPLE_CALLBACK"></a>

### ERR_MULTIPLE_CALLBACK

A callback was called more than once.

A callback is almost always meant to only be called once as the query can either be fulfilled or rejected but not both at the same time. The latter would be possible by calling a callback more than once.

<a id="ERR_NAPI_CONS_FUNCTION"></a>

### ERR_NAPI_CONS_FUNCTION

While using `N-API`, a constructor passed was not a function.

<a id="ERR_NAPI_INVALID_DATAVIEW_ARGS"></a>

### ERR_NAPI_INVALID_DATAVIEW_ARGS

While calling `napi_create_dataview()`, a given `offset` was outside the bounds of the dataview or `offset + length` was larger than a length of given `buffer`.

<a id="ERR_NAPI_INVALID_TYPEDARRAY_ALIGNMENT"></a>

### ERR_NAPI_INVALID_TYPEDARRAY_ALIGNMENT

While calling `napi_create_typedarray()`, the provided `offset` was not a multiple of the element size.

<a id="ERR_NAPI_INVALID_TYPEDARRAY_LENGTH"></a>

### ERR_NAPI_INVALID_TYPEDARRAY_LENGTH

While calling `napi_create_typedarray()`, `(length * size_of_element) +
byte_offset` was larger than the length of given `buffer`.

<a id="ERR_NO_CRYPTO"></a>

### ERR_NO_CRYPTO

An attempt was made to use crypto features while Node.js was not compiled with OpenSSL crypto support.

<a id="ERR_NO_ICU"></a>

### ERR_NO_ICU

An attempt was made to use features that require [ICU](intl.html#intl_internationalization_support), but Node.js was not compiled with ICU support.

<a id="ERR_NO_LONGER_SUPPORTED"></a>

### ERR_NO_LONGER_SUPPORTED

A Node.js API was called in an unsupported manner, such as `Buffer.write(string, encoding, offset[, length])`.

<a id="ERR_OUT_OF_RANGE"></a>

### ERR_OUT_OF_RANGE

A given value is out of the accepted range.

<a id="ERR_REQUIRE_ESM"></a>

### ERR_REQUIRE_ESM

> Stability: 1 - Experimental

An attempt was made to `require()` an [ES6 module](esm.html).

<a id="ERR_SCRIPT_EXECUTION_INTERRUPTED"></a>

### ERR_SCRIPT_EXECUTION_INTERRUPTED

Script execution was interrupted by `SIGINT` (For example, when Ctrl+C was pressed).

<a id="ERR_SERVER_ALREADY_LISTEN"></a>

### ERR_SERVER_ALREADY_LISTEN

The [`server.listen()`][] method was called while a `net.Server` was already listening. This applies to all instances of `net.Server`, including HTTP, HTTPS, and HTTP/2 `Server` instances.

<a id="ERR_SERVER_NOT_RUNNING"></a>

### ERR_SERVER_NOT_RUNNING

The [`server.close()`][] method was called when a `net.Server` was not running. This applies to all instances of `net.Server`, including HTTP, HTTPS, and HTTP/2 `Server` instances.

<a id="ERR_SOCKET_ALREADY_BOUND"></a>

### ERR_SOCKET_ALREADY_BOUND

An attempt was made to bind a socket that has already been bound.

<a id="ERR_SOCKET_BAD_BUFFER_SIZE"></a>

### ERR_SOCKET_BAD_BUFFER_SIZE

An invalid (negative) size was passed for either the `recvBufferSize` or `sendBufferSize` options in [`dgram.createSocket()`][].

<a id="ERR_SOCKET_BAD_PORT"></a>

### ERR_SOCKET_BAD_PORT

An API function expecting a port > 0 and < 65536 received an invalid value.

<a id="ERR_SOCKET_BAD_TYPE"></a>

### ERR_SOCKET_BAD_TYPE

An API function expecting a socket type (`udp4` or `udp6`) received an invalid value.

<a id="ERR_SOCKET_BUFFER_SIZE"></a>

### ERR_SOCKET_BUFFER_SIZE

While using [`dgram.createSocket()`][], the size of the receive or send `Buffer` could not be determined.

<a id="ERR_SOCKET_CANNOT_SEND"></a>

### ERR_SOCKET_CANNOT_SEND

Data could be sent on a socket.

<a id="ERR_SOCKET_CLOSED"></a>

### ERR_SOCKET_CLOSED

An attempt was made to operate on an already closed socket.

<a id="ERR_SOCKET_DGRAM_NOT_RUNNING"></a>

### ERR_SOCKET_DGRAM_NOT_RUNNING

A call was made and the UDP subsystem was not running.

<a id="ERR_STDERR_CLOSE"></a>

### ERR_STDERR_CLOSE

An attempt was made to close the `process.stderr` stream. By design, Node.js does not allow `stdout` or `stderr` streams to be closed by user code.

<a id="ERR_STDOUT_CLOSE"></a>

### ERR_STDOUT_CLOSE

An attempt was made to close the `process.stdout` stream. By design, Node.js does not allow `stdout` or `stderr` streams to be closed by user code.

<a id="ERR_STREAM_CANNOT_PIPE"></a>

### ERR_STREAM_CANNOT_PIPE

An attempt was made to call [`stream.pipe()`][] on a [`Writable`][] stream.

<a id="ERR_STREAM_NULL_VALUES"></a>

### ERR_STREAM_NULL_VALUES

An attempt was made to call [`stream.write()`][] with a `null` chunk.

<a id="ERR_STREAM_PREMATURE_CLOSE"></a>

### ERR_STREAM_PREMATURE_CLOSE

An error returned by `stream.finished()` and `stream.pipeline()`, when a stream or a pipeline ends non gracefully with no explicit error.

<a id="ERR_STREAM_PUSH_AFTER_EOF"></a>

### ERR_STREAM_PUSH_AFTER_EOF

An attempt was made to call [`stream.push()`][] after a `null`(EOF) had been pushed to the stream.

<a id="ERR_STREAM_READ_NOT_IMPLEMENTED"></a>

### ERR_STREAM_READ_NOT_IMPLEMENTED

An attempt was made to use a readable stream that did not implement [`readable._read()`][].

<a id="ERR_STREAM_UNSHIFT_AFTER_END_EVENT"></a>

### ERR_STREAM_UNSHIFT_AFTER_END_EVENT

An attempt was made to call [`stream.unshift()`][] after the `'end'` event was emitted.

<a id="ERR_STREAM_WRAP"></a>

### ERR_STREAM_WRAP

Prevents an abort if a string decoder was set on the Socket or if the decoder is in `objectMode`.

Example

```js
const Socket = require('net').Socket;
const instance = new Socket();

instance.setEncoding('utf8');
```

<a id="ERR_STREAM_WRITE_AFTER_END"></a>

### ERR_STREAM_WRITE_AFTER_END

An attempt was made to call [`stream.write()`][] after `stream.end()` has been called.

<a id="ERR_SYSTEM_ERROR"></a>

### ERR_SYSTEM_ERROR

An unspecified or non-specific system error has occurred within the Node.js process. The error object will have an `err.info` object property with additional details.

<a id="ERR_STREAM_DESTROYED"></a>

### ERR_STREAM_DESTROYED

A stream method was called that cannot complete because the stream was destroyed using `stream.destroy()`.

<a id="ERR_STRING_TOO_LONG"></a>

### ERR_STRING_TOO_LONG

An attempt has been made to create a string longer than the maximum allowed length.

<a id="ERR_TLS_CERT_ALTNAME_INVALID"></a>

### ERR_TLS_CERT_ALTNAME_INVALID

While using TLS, the hostname/IP of the peer did not match any of the `subjectAltNames` in its certificate.

<a id="ERR_TLS_DH_PARAM_SIZE"></a>

### ERR_TLS_DH_PARAM_SIZE

While using TLS, the parameter offered for the Diffie-Hellman (`DH`) key-agreement protocol is too small. By default, the key length must be greater than or equal to 1024 bits to avoid vulnerabilities, even though it is strongly recommended to use 2048 bits or larger for stronger security.

<a id="ERR_TLS_HANDSHAKE_TIMEOUT"></a>

### ERR_TLS_HANDSHAKE_TIMEOUT

A TLS/SSL handshake timed out. In this case, the server must also abort the connection.

<a id="ERR_TLS_REQUIRED_SERVER_NAME"></a>

### ERR_TLS_REQUIRED_SERVER_NAME

While using TLS, the `server.addContext()` method was called without providing a hostname in the first parameter.

<a id="ERR_TLS_SESSION_ATTACK"></a>

### ERR_TLS_SESSION_ATTACK

An excessive amount of TLS renegotiations is detected, which is a potential vector for denial-of-service attacks.

<a id="ERR_TLS_SNI_FROM_SERVER"></a>

### ERR_TLS_SNI_FROM_SERVER

An attempt was made to issue Server Name Indication from a TLS server-side socket, which is only valid from a client.

<a id="ERR_TLS_RENEGOTIATION_DISABLED"></a>

### ERR_TLS_RENEGOTIATION_DISABLED

An attempt was made to renegotiate TLS on a socket instance with TLS disabled.

<a id="ERR_TRACE_EVENTS_CATEGORY_REQUIRED"></a>

### ERR_TRACE_EVENTS_CATEGORY_REQUIRED

The `trace_events.createTracing()` method requires at least one trace event category.

<a id="ERR_TRACE_EVENTS_UNAVAILABLE"></a>

### ERR_TRACE_EVENTS_UNAVAILABLE

The `trace_events` module could not be loaded because Node.js was compiled with the `--without-v8-platform` flag.

<a id="ERR_TRANSFORM_ALREADY_TRANSFORMING"></a>

### ERR_TRANSFORM_ALREADY_TRANSFORMING

A `Transform` stream finished while it was still transforming.

<a id="ERR_TRANSFORM_WITH_LENGTH_0"></a>

### ERR_TRANSFORM_WITH_LENGTH_0

A `Transform` stream finished with data still in the write buffer.

<a id="ERR_TTY_INIT_FAILED"></a>

### ERR_TTY_INIT_FAILED

The initialization of a TTY failed due to a system error.

<a id="ERR_UNCAUGHT_EXCEPTION_CAPTURE_ALREADY_SET"></a>

### ERR_UNCAUGHT_EXCEPTION_CAPTURE_ALREADY_SET

[`process.setUncaughtExceptionCaptureCallback()`][] was called twice, without first resetting the callback to `null`.

This error is designed to prevent accidentally overwriting a callback registered from another module.

<a id="ERR_UNESCAPED_CHARACTERS"></a>

### ERR_UNESCAPED_CHARACTERS

A string that contained unescaped characters was received.

<a id="ERR_UNHANDLED_ERROR"></a>

### ERR_UNHANDLED_ERROR

An unhandled error occurred (for instance, when an `'error'` event is emitted by an [`EventEmitter`][] but an `'error'` handler is not registered).

<a id="ERR_UNKNOWN_ENCODING"></a>

### ERR_UNKNOWN_ENCODING

An invalid or unknown encoding option was passed to an API.

<a id="ERR_UNKNOWN_FILE_EXTENSION"></a>

### ERR_UNKNOWN_FILE_EXTENSION

> Stability: 1 - Experimental

An attempt was made to load a module with an unknown or unsupported file extension.

<a id="ERR_UNKNOWN_MODULE_FORMAT"></a>

### ERR_UNKNOWN_MODULE_FORMAT

> Stability: 1 - Experimental

An attempt was made to load a module with an unknown or unsupported format.

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

The V8 `BreakIterator` API was used but the full ICU data set is not installed.

<a id="ERR_VALID_PERFORMANCE_ENTRY_TYPE"></a>

### ERR_VALID_PERFORMANCE_ENTRY_TYPE

While using the Performance Timing API (`perf_hooks`), no valid performance entry types were found.

<a id="ERR_VALUE_OUT_OF_RANGE"></a>

### ERR_VALUE_OUT_OF_RANGE

Superseded by `ERR_OUT_OF_RANGE`.

<a id="ERR_VM_MODULE_ALREADY_LINKED"></a>

### ERR_VM_MODULE_ALREADY_LINKED

The module attempted to be linked is not eligible for linking, because of one of the following reasons:

- It has already been linked (`linkingStatus` is `'linked'`)
- It is being linked (`linkingStatus` is `'linking'`)
- Linking has failed for this module (`linkingStatus` is `'errored'`)

<a id="ERR_VM_MODULE_DIFFERENT_CONTEXT"></a>

### ERR_VM_MODULE_DIFFERENT_CONTEXT

The module being returned from the linker function is from a different context than the parent module. Linked modules must share the same context.

<a id="ERR_VM_MODULE_LINKING_ERRORED"></a>

### ERR_VM_MODULE_LINKING_ERRORED

The linker function returned a module for which linking has failed.

<a id="ERR_VM_MODULE_NOT_LINKED"></a>

### ERR_VM_MODULE_NOT_LINKED

The module must be successfully linked before instantiation.

<a id="ERR_VM_MODULE_NOT_MODULE"></a>

### ERR_VM_MODULE_NOT_MODULE

The fulfilled value of a linking promise is not a `vm.Module` object.

<a id="ERR_VM_MODULE_STATUS"></a>

### ERR_VM_MODULE_STATUS

The current module's status does not allow for this operation. The specific meaning of the error depends on the specific function.

<a id="ERR_ZLIB_INITIALIZATION_FAILED"></a>

### ERR_ZLIB_INITIALIZATION_FAILED

Creation of a [`zlib`][] object failed due to incorrect configuration.