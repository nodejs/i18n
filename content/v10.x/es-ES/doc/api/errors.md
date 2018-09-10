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

- `ECONNREFUSED` (Conexión rechazada): No se pudo realizar ninguna conexión porque la máquina objetivo lo rechazó activamente. Esto generalmente resulta de intentar la conexión a un servicio que está inactivo en el host extranjero.

- `ECONNRESET` (Conexión reiniciada por el peer): Una conexión fue cerrada a la fuerza por un peer. This normally results from a loss of the connection on the remote socket due to a timeout or reboot. Comúnmente encontrado mediante los módulos [`http`][] y [`net`][].

- `EEXIST` (El archivo existe): Un archivo existente fue el objetivo de una operación que requería que el objetivo no existiese.

- `EISDIR` (Es un directorio): Una operación esperaba un archivo, pero el nombre de la ruta dada era un directorio.

- `EMFILE` (Muchos archivos abiertos en el sistema): El número máximo de [descriptores de archivos](https://en.wikipedia.org/wiki/File_descriptor) permitidos en el sistema ha sido alcanzado y las solicitudes para otro descriptor no pueden cumplirse hasta que al menos uno haya sido cerrado. Esto ocurre al abrir muchos archivos a la vez en paralelo, especialmente en sistemas (macOS en particular) donde hay un límite de descriptor de archivos bajo para procesos. Para remediar un límite bajo, ejecute `ulimit -n 2048` en el mismo shell que ejecutará el proceso Node.js.

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

Utilizado cuando el proceso principal está intentando leer datos de los STDERR / STDOUT del proceso secundario y el tamaño de los datos es mayor que la opción `maxBuffer`.

<a id="ERR_CONSOLE_WRITABLE_STREAM"></a>

### ERR_CONSOLE_WRITABLE_STREAM

La `Console` fue instanciada sin el stream `stdout` o la `Console` tiene un stream `stdout` o `stderr` no escribible.

<a id="ERR_CPU_USAGE"></a>

### ERR_CPU_USAGE

La llamada nativa de `process.cpuUsage` no pudo ser procesada.

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

[`hash.update()`][] falló por alguna razón. This should rarely, if ever, happen.

<a id="ERR_CRYPTO_INVALID_DIGEST"></a>

### ERR_CRYPTO_INVALID_DIGEST

An invalid [crypto digest algorithm](crypto.html#crypto_crypto_gethashes) was specified.

<a id="ERR_CRYPTO_INVALID_STATE"></a>

### ERR_CRYPTO_INVALID_STATE

Se utilizó un método criptográfico en un objeto que estaba en un estado inválido. Por ejemplo, el llamar a [`cipher.getAuthTag()`][] antes de llamar a `cipher.final()`.

<a id="ERR_CRYPTO_SIGN_KEY_REQUIRED"></a>

### ERR_CRYPTO_SIGN_KEY_REQUIRED

A signing `key` was not provided to the [`sign.sign()`][] method.

<a id="ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH"></a>

### ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH

[`crypto.timingSafeEqual()`][] fue llamado con argumentos `Buffer`, `TypedArray` o `DataView` de diferentes tamaños.

<a id="ERR_DNS_SET_SERVERS_FAILED"></a>

### ERR_DNS_SET_SERVERS_FAILED

`c-ares` falló al establecer el servidor DNS.

<a id="ERR_DOMAIN_CALLBACK_NOT_AVAILABLE"></a>

### ERR_DOMAIN_CALLBACK_NOT_AVAILABLE

The `domain` module was not usable since it could not establish the required error handling hooks, because [`process.setUncaughtExceptionCaptureCallback()`][] had been called at an earlier point in time.

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

A `Promise` that was callbackified via `util.callbackify()` was rejected with a falsy value.

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

HTTP/2 ALTSVC frames require a valid origin.

<a id="ERR_HTTP2_ALTSVC_LENGTH"></a>

### ERR_HTTP2_ALTSVC_LENGTH

HTTP/2 ALTSVC frames are limited to a maximum of 16,382 payload bytes.

<a id="ERR_HTTP2_CONNECT_AUTHORITY"></a>

### ERR_HTTP2_CONNECT_AUTHORITY

Para las solicitudes HTTP/2 que utilizan el método `CONNECT`, el pseudo encabezado `:authority` es requerido.

<a id="ERR_HTTP2_CONNECT_PATH"></a>

### ERR_HTTP2_CONNECT_PATH

Para las solicitudes HTTP/2 que utilizan el método `CONNECT`, el pseudo encabezado `:path` está prohibido.

<a id="ERR_HTTP2_CONNECT_SCHEME"></a>

### ERR_HTTP2_CONNECT_SCHEME

Para las solicitudes HTTP/2 que utilizan el método `CONNECT`, el pseudo encabezado `:scheme` está prohibido.

<a id="ERR_HTTP2_GOAWAY_SESSION"></a>

### ERR_HTTP2_GOAWAY_SESSION

Los nuevos Streams HTTP/2 pueden no estar abiertos luego de que `Http2Session` haya recibido un frame `GOAWAY` del peer conectado.

<a id="ERR_HTTP2_HEADER_SINGLE_VALUE"></a>

### ERR_HTTP2_HEADER_SINGLE_VALUE

Se proporcionaron múltiples valores para un campo de encabezado HTTP/2 que requería tener sólo un valor simple.

<a id="ERR_HTTP2_HEADERS_AFTER_RESPOND"></a>

### ERR_HTTP2_HEADERS_AFTER_RESPOND

An additional headers was specified after an HTTP/2 response was initiated.

<a id="ERR_HTTP2_HEADERS_SENT"></a>

### ERR_HTTP2_HEADERS_SENT

Se intentó enviar múltiples encabezados de respuesta.

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

<a id="ERR_HTTP2_NO_SOCKET_MANIPULATION"></a>

### ERR_HTTP2_NO_SOCKET_MANIPULATION

Se intentó manipular directamente (leer, escribir, pausar, resumir, etc.) un socket adjunto a un `Http2Session`.

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

<a id="ERR_HTTP2_SOCKET_BOUND"></a>

### ERR_HTTP2_SOCKET_BOUND

Se intentó conectar un objeto `Http2Session` a un `net.Socket` o `tls.TLSSocket` que ya había sido ligado a otro objeto `Http2Session`.

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

Trailing headers have already been sent on the `Http2Stream`.

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

While using the `inspector` module, an attempt was made to connect when the inspector was already connected.

<a id="ERR_INSPECTOR_CLOSED"></a>

### ERR_INSPECTOR_CLOSED

While using the `inspector` module, an attempt was made to use the inspector after the session had already closed.

<a id="ERR_INSPECTOR_NOT_AVAILABLE"></a>

### ERR_INSPECTOR_NOT_AVAILABLE

No está disponible el uso del módulo `inspector`.

<a id="ERR_INSPECTOR_NOT_CONNECTED"></a>

### ERR_INSPECTOR_NOT_CONNECTED

Mientras se utilizaba el módulo `inspector`, se intentó utilizar el inspector antes de que se conectara.

<a id="ERR_INVALID_ADDRESS_FAMILY"></a>

### ERR_INVALID_ADDRESS_FAMILY

The provided address family is not understood by the Node.js API.

<a id="ERR_INVALID_ARG_TYPE"></a>

### ERR_INVALID_ARG_TYPE

Se pasó un argumento de tipo erróneo a un API Node.js.

<a id="ERR_INVALID_ARG_VALUE"></a>

### ERR_INVALID_ARG_VALUE

Se pasó un valor inválido o no soportado por un argumento dado.

<a id="ERR_INVALID_ARRAY_LENGTH"></a>

### ERR_INVALID_ARRAY_LENGTH

An array was not of the expected length or in a valid range.

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

<a id="ERR_INVALID_RETURN_VALUE"></a>

### ERR_INVALID_RETURN_VALUE

Arrojado en caso de que una opción de función no devuelva un valor esperado en ejecución. Por ejemplo, cuando se espera que una función devuelva una promesa.

<a id="ERR_INVALID_SYNC_FORK_INPUT"></a>

### ERR_INVALID_SYNC_FORK_INPUT

A `Buffer`, `Uint8Array` or `string` was provided as stdio input to a synchronous fork. Vea la documentación para el módulo [`child_process`][] para más información.

<a id="ERR_INVALID_THIS"></a>

### ERR_INVALID_THIS

Se llamó una función API de Node.js con un valor `this` incompatible.

Ejemplo:

```js
const urlSearchParams = new URLSearchParams('foo=bar&baz=new');

const buf = Buffer.alloc(1);
urlSearchParams.has.call(buf, 'foo');
// Arroja un TypeError con el código 'ERR_INVALID_THIS'
```

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

An attempt was made to use a URL of an incompatible scheme (protocol) for a specific purpose. It is only used in the [WHATWG URL API](url.html#url_the_whatwg_url_api) support in the [`fs`][] module (which only accepts URLs with `'file'` scheme), but may be used in other Node.js APIs as well in the future.

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

An attempt was made to open an IPC communication channel with a synchronously forked Node.js process. Vea la documentación para el módulo [`child_process`][] para más información.

<a id="ERR_MEMORY_ALLOCATION_FAILED"></a>

### ERR_MEMORY_ALLOCATION_FAILED

Se hizo un intento de asignar memoria (usualmente en la capa C++), pero falló.

<a id="ERR_METHOD_NOT_IMPLEMENTED"></a>

### ERR_METHOD_NOT_IMPLEMENTED

Se requiere un método pero no se implementa.

<a id="ERR_MISSING_ARGS"></a>

### ERR_MISSING_ARGS

No se pasó un argumento de API de Node.js requerido. Esto sólo se usa para el cumplimiento estricto con la especificación API (la cual, en algunos casos, puede aceptar `func(undefined)`, pero no `func()`). En la mayoría de las APIs de Node.js nativas, `func(undefined)` y `func()` son tratados de igual manera, y el código de error [`ERR_INVALID_ARG_TYPE`][] puede ser utilizado en su lugar.

<a id="ERR_MISSING_MODULE"></a>

### ERR_MISSING_MODULE

> Estabilidad: 1 - Experimental

No se pudo resolver un [módulo ES6](esm.html).

<a id="ERR_MODULE_RESOLUTION_LEGACY"></a>

### ERR_MODULE_RESOLUTION_LEGACY

> Estabilidad: 1 - Experimental

Ocurrió un fallo al resolver importaciones en un [módulo ES6](esm.html).

<a id="ERR_MULTIPLE_CALLBACK"></a>

### ERR_MULTIPLE_CALLBACK

A callback was called more than once.

A callback is almost always meant to only be called once as the query can either be fulfilled or rejected but not both at the same time. The latter would be possible by calling a callback more than once.

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

<a id="ERR_NO_CRYPTO"></a>

### ERR_NO_CRYPTO

An attempt was made to use crypto features while Node.js was not compiled with OpenSSL crypto support.

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

Una función API que esperaba un puerto > 0 y < 65536 recibió un valor inválido.

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

<a id="ERR_STDERR_CLOSE"></a>

### ERR_STDERR_CLOSE

Se intentó cerrar el stream `process.stderr`. Por diseño, Node.js no permite que los streams `stdout` o `stderr` sean cerrados por código de usuario.

<a id="ERR_STDOUT_CLOSE"></a>

### ERR_STDOUT_CLOSE

Se intentó cerrar el stream `process.stdout`. Por diseño, Node.js no permite que los streams `stdout` o `stderr` sean cerrados por código de usuario.

<a id="ERR_STREAM_CANNOT_PIPE"></a>

### ERR_STREAM_CANNOT_PIPE

Se intentó llamar a [`stream.pipe()`][] en un stream [`Writable`][].

<a id="ERR_STREAM_NULL_VALUES"></a>

### ERR_STREAM_NULL_VALUES

Se intentó llamar a [`stream.write()`][] con un fragmento `null`.

<a id="ERR_STREAM_PREMATURE_CLOSE"></a>

### ERR_STREAM_PREMATURE_CLOSE

Un error devuelto por `stream.finished()` y `stream.pipeline()`, cuando, sin ningún error explícito, un stream o pipeline se cierra sin gracia.

<a id="ERR_STREAM_PUSH_AFTER_EOF"></a>

### ERR_STREAM_PUSH_AFTER_EOF

Se intentó llamar a [`stream.push()`][] luego de que un `null`(EOF) fuera empujado al stream.

<a id="ERR_STREAM_READ_NOT_IMPLEMENTED"></a>

### ERR_STREAM_READ_NOT_IMPLEMENTED

Se intentó utilizar un stream legible que no implementaba [`readable._read()`][].

<a id="ERR_STREAM_UNSHIFT_AFTER_END_EVENT"></a>

### ERR_STREAM_UNSHIFT_AFTER_END_EVENT

Se intentó llamar a [`stream.unshift()`][] luego de que el evento `'end'` fuera emitido.

<a id="ERR_STREAM_WRAP"></a>

### ERR_STREAM_WRAP

Impide un aborto si un decodificador de string fue establecido en el Socket o si el decodificador está en `objectMode`.

Ejemplo

```js
const Socket = require('net').Socket;
const instance = new Socket();

instance.setEncoding('utf8');
```

<a id="ERR_STREAM_WRITE_AFTER_END"></a>

### ERR_STREAM_WRITE_AFTER_END

Se intentó llamar a [`stream.write()`][] luego de que `stream.end()` fuera llamado.

<a id="ERR_SYSTEM_ERROR"></a>

### ERR_SYSTEM_ERROR

Ha ocurrido un error de sistema no específico o sin especificar dentro del proceso de Node.js. El objeto error tendrá una propiedad de objeto `err.info` con detalles adicionales.

<a id="ERR_STREAM_DESTROYED"></a>

### ERR_STREAM_DESTROYED

Se llamó a un método de stream que no puede completarse porque el stream fue destruido utilizando `stream.destroy()`.

<a id="ERR_STRING_TOO_LONG"></a>

### ERR_STRING_TOO_LONG

Se intentó crear una string más grande que el tamaño máximo permitido.

<a id="ERR_TLS_CERT_ALTNAME_INVALID"></a>

### ERR_TLS_CERT_ALTNAME_INVALID

While using TLS, the hostname/IP of the peer did not match any of the `subjectAltNames` in its certificate.

<a id="ERR_TLS_DH_PARAM_SIZE"></a>

### ERR_TLS_DH_PARAM_SIZE

Mientras se utilizaba TLS, el parámetro ofrecido para el protocolo de acuerdo de clave Diffle-Hellman (`DH`) es muy peuqeño. Por defecto, el tamaño de la clave debe ser mayor que o igual a 1024 bits para evitar vulnerabilidades, a pesar de que es altamente recomendado utilizar 2048 bits o más para una mayor seguridad.

<a id="ERR_TLS_HANDSHAKE_TIMEOUT"></a>

### ERR_TLS_HANDSHAKE_TIMEOUT

A TLS/SSL handshake timed out. En este caso, el servidor debe también abortar la conexión.

<a id="ERR_TLS_REQUIRED_SERVER_NAME"></a>

### ERR_TLS_REQUIRED_SERVER_NAME

Mientras se utilizaba TLS, se llamó al método `server.addContext()` sin proporcionar un nombre de host en el primer parámetro.

<a id="ERR_TLS_SESSION_ATTACK"></a>

### ERR_TLS_SESSION_ATTACK

Se detectó una cantidad excesiva de renegociaciones TLS, lo cual es un vector potencial para ataques de negación de servicio.

<a id="ERR_TLS_SNI_FROM_SERVER"></a>

### ERR_TLS_SNI_FROM_SERVER

An attempt was made to issue Server Name Indication from a TLS server-side socket, which is only valid from a client.

<a id="ERR_TLS_RENEGOTIATION_DISABLED"></a>

### ERR_TLS_RENEGOTIATION_DISABLED

Se intentó renegociar TLS en una instancia de socket con TLS inhabilitado.

<a id="ERR_TRACE_EVENTS_CATEGORY_REQUIRED"></a>

### ERR_TRACE_EVENTS_CATEGORY_REQUIRED

El método `trace_events.createTracing()` requiere al menos una categoría de evento trace.

<a id="ERR_TRACE_EVENTS_UNAVAILABLE"></a>

### ERR_TRACE_EVENTS_UNAVAILABLE

El módulo `trace_events` no pudo ser cargado porque Node.js fue compilado con el flag `--without-v8-platform`.

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

<a id="ERR_VALUE_OUT_OF_RANGE"></a>

### ERR_VALUE_OUT_OF_RANGE

Reemplazado por `ERR_OUT_OF_RANGE`.

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

El valor cumplido de una promesa de vinculación no es un objeto `vm.Module`.

<a id="ERR_VM_MODULE_STATUS"></a>

### ERR_VM_MODULE_STATUS

El estado del módulo actual no permite esta operación. El significado específico de este error depende de la función específica.

<a id="ERR_ZLIB_INITIALIZATION_FAILED"></a>

### ERR_ZLIB_INITIALIZATION_FAILED

La creación de un objeto [`zlib`][] falló debido a una configuración incorrecta.