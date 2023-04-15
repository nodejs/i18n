# REPL

<!--introduced_in=v0.10.0-->

> Estabilidad 2 - Estable

El módulo `repl` proporciona una implementación del Bucle de Lectura-Evaluación-Impresión (Read-Eval-Print-Loop, REPL) que está disponible tanto como un programa independiente como uno con posibilidad de inclusión en otras aplicaciones. Puede ser accesado usando:

```js
const repl = require('repl');
```

## Diseño y Características

The `repl` module exports the [`repl.REPLServer`][] class. While running, instances of [`repl.REPLServer`][] will accept individual lines of user input, evaluate those according to a user-defined evaluation function, then output the result. Input and output may be from `stdin` and `stdout`, respectively, or may be connected to any Node.js [stream](stream.html).

Instances of [`repl.REPLServer`][] support automatic completion of inputs, simplistic Emacs-style line editing, multi-line inputs, ANSI-styled output, saving and restoring current REPL session state, error recovery, and customizable evaluation functions.

### Comandos y Teclas Especiales

Los siguientes comandos especiales son soportados por todas las instancias REPL:

* `.break` - Durante el proceso de entrada de una expresión multi-línea, la introducción del comando `.break` (o la presión de la combinación de teclas `<ctrl>-C`) abortará el ingreso de un input adicional y el procesamiento de dicha expresión.
* `.clear` - Restablece `context` de REPL a un objeto vacío y limpia cualquier expresión multi-línea que esté siendo introducida en ese momento.
* `.exit` - Cierra el stream E/S, causando que RPL se cierre.
* `.help` - Muestra la lista de comandos especiales.
* `.save` -Guarda la sesión de REPL actual en un archivo: `> .save ./file/to/save.js`
* `.load` - Carga un archivo a la actual sesión REPL. `> .load ./file/to/load.js`
* `.editor` - entra en el modo editor (`<ctrl>-D` para finalizar, `<ctrl>-C` para cancelar).

<!-- eslint-skip -->

```js
> .editor
// Entrando en el modo de edición (^D para finalizar, ^C para cancelar)
function welcome(name) {
  return `Hello ${name}!`;
}

welcome('Node.js User');

// ^D
'Hello Node.js User!'
>
```

Las siguientes combinaciones de teclas en REPL tienen los siguientes efectos:

* `<ctrl>-C` - Cuando es presionada, tiene el mismo efecto que el comando `.break`. Cuando se presiona dos veces en una línea en blanco, tiene el mismo efecto que el comando `.exit`.
* `<ctrl>-D` - Tiene el mismo efecto que el comando `.exit`.
* `<tab>` - When pressed on a blank line, displays global and local (scope) variables. Cuando se presiona mientras se está ingresando otro input, muestra opciones de auto-completado relevantes.

### Evaluación Predeterminada

By default, all instances of [`repl.REPLServer`][] use an evaluation function that evaluates JavaScript expressions and provides access to Node.js' built-in modules. This default behavior can be overridden by passing in an alternative evaluation function when the [`repl.REPLServer`][] instance is created.

#### Expresiones JavaScript

El evaluador por defecto soporta evaluaciones directas de las expresiones de JavaScript:

<!-- eslint-skip -->

```js
> 1 + 1
2
> const m = 2
undefined
> m + 1
3
```

Unless otherwise scoped within blocks or functions, variables declared either implicitly or using the `const`, `let`, or `var` keywords are declared at the global scope.

#### Espectros Globales y Locales

El evaluador predeterminado proporciona acceso a las variables que existan en el ámbito global. It is possible to expose a variable to the REPL explicitly by assigning it to the `context` object associated with each `REPLServer`:

```js
const repl = require('repl');
const msg = 'message';

repl.start('> ').context.m = msg;
```

Las propiedades en el objeto `context` aparecen como locales dentro de REPL:

<!-- eslint-skip -->

```js
$ node repl_test.js
> m
'message'
```

Las propiedades de contexto no son de sólo lectura por defecto. To specify read-only globals, context properties must be defined using `Object.defineProperty()`:

```js
const repl = require('repl');
const msg = 'message';

const r = repl.start('> ');
Object.defineProperty(r.context, 'm', {
  configurable: false,
  enumerable: true,
  value: msg
});
```

#### Acceder a los módulos principales de Node.Js

El evaluador predeterminado cargará automáticamente los módulos principales de Node.js en el ambiente de REPL cuando sea usado. Por ejemplo, a menos que sea declarado como una variable global o con ámbito, el input `fs` será evaluado como `global.fs = require('fs')` cuando se requiera.

<!-- eslint-skip -->

```js
> fs.createReadStream('./some/file');
```

#### Excepciones Globales No Capturadas

The REPL uses the [`domain`][] module to catch all uncaught exceptions for that REPL session.

Este uso del módulo [`domain`][] en el REPL tiene estos efectos secundarios:

* Las excepciones sin capturar no emiten el evento [`'uncaughtException'`][].
* Trying to use [`process.setUncaughtExceptionCaptureCallback()`][] throws an [`ERR_DOMAIN_CANNOT_SET_UNCAUGHT_EXCEPTION_CAPTURE`][] error.

#### Asignación de la variable `_` (guión bajo)

<!-- YAML
changes:

  - version: v9.8.0
    pr-url: https://github.com/nodejs/node/pull/18919
    description: Added `_error` support.
-->

El evaluador por defecto asignará, de manera predeterminada, el resultado de la última expresión evaluada a la variable especial `_` (guión bajo). Establecer explícitamente `_` a un valor deshabilitará este comportamiento.

<!-- eslint-skip -->

```js
> [ 'a', 'b', 'c' ]
[ 'a', 'b', 'c' ]
> _.length
3
> _ += 1
Expression assignment to _ now disabled.
4
> 1 + 1
2
> _
4
```

Similarly, `_error` will refer to the last seen error, if there was any. Explicitly setting `_error` to a value will disable this behavior.

<!-- eslint-skip -->

```js
> throw new Error('foo');
Error: foo
> _error.message
'foo'
```

#### Palabra clave `await`

With the [`--experimental-repl-await`][] command line option specified, experimental support for the `await` keyword is enabled.

<!-- eslint-skip -->

```js
> await Promise.resolve(123)
123
> await Promise.reject(new Error('REPL await'))
Error: REPL await
    at repl:1:45
> const timeout = util.promisify(setTimeout);
undefined
> const old = Date.now(); await timeout(1000); console.log(Date.now() - old);
1002
undefined
```

### Funciones de Evaluación Personalizadas

When a new [`repl.REPLServer`][] is created, a custom evaluation function may be provided. Esto puede utilizarse, por ejemplo, para implementar aplicaciones REPL completamente personalizadas.

Lo siguiente ilustra un ejemplo hipotético de un REPL que traduce texto de un idioma a otro:

```js
const repl = require('repl');
const { Translator } = require('translator');

const myTranslator = new Translator('en', 'fr');

function myEval(cmd, context, filename, callback) {
  callback(null, myTranslator.translate(cmd));
}

repl.start({ prompt: '> ', eval: myEval });
```

#### Errores recuperables

Cuando un usuario esté ingresando una entrada en el campo de texto del REPL, presionar la tecla `<enter>` enviará la línea actual del input a la función `eval`. Para poder soportar entradas multi-líneas, la función de evaluación puede devolver una instancia de `repl.Recoverable` a la función callback proporcionada:

```js
function myEval(cmd, context, filename, callback) {
  let result;
  try {
    result = vm.runInThisContext(cmd);
  } catch (e) {
    if (isRecoverableError(e)) {
      return callback(new repl.Recoverable(e));
    }
  }
  callback(null, result);
}

function isRecoverableError(error) {
  if (error.name === 'SyntaxError') {
    return /^(Unexpected end of input|Unexpected token)/.test(error.message);
  }
  return false;
}
```

### Personalización del Output de REPL

By default, [`repl.REPLServer`][] instances format output using the [`util.inspect()`][] method before writing the output to the provided `Writable` stream (`process.stdout` by default). La opción booleana `useColors` puede especificarse en la construcción, para ordenarle al escritor predeterminado que utilice códigos de estilo ANSI para dar color al output del método `util.inspect()`.

It is possible to fully customize the output of a [`repl.REPLServer`][] instance by passing a new function in using the `writer` option on construction. El siguiente ejemplo ilustra la conversión del texto de entrada a mayúsculas:

```js
const repl = require('repl');

const r = repl.start({ prompt: '> ', eval: myEval, writer: myWriter });

function myEval(cmd, context, filename, callback) {
  callback(null, cmd);
}

function myWriter(output) {
  return output.toUpperCase();
}
```

## Clase: REPLServer

<!-- YAML
added: v0.1.91
-->

La clase `repl.REPLServer` hereda de la clase [`readline.Interface`][]. Las instancias de `repl.REPLServer` son creadas utilizando el método `repl.start()` y *no deben* ser creadas directamente utilizando la palabra clave de JavaScript `new`.

### Evento: 'exit'

<!-- YAML
added: v0.7.7
-->

El evento `'exit'` es emitido cuando se sale del REPL, ya sea por la introducción del comando `.exit`, la presión por el usuario de `<ctrl>-C` dos veces, para señalar `SIGINT`, o la presión de `<ctrl>-D` para señalar `'end'` en el stream del input. La callback del listener es invocada sin argumentos.

```js
replServer.on('exit', () => {
  console.log('Received "exit" event from repl!');
  process.exit();
});
```

### Evento: 'reset'

<!-- YAML
added: v0.11.0
-->

El evento `'reset'` es emitido cuando el contexto del REPL es restablecido. Esto ocurre cuando el comando `.clear` es recibido como input, *a menos * que el REPL esté utilizando el evaluador predeterminado y la instancia de `repl.REPLServer` haya sido creada con la opción `useGlobal` establecida en `true`. La callback del listener será llamada con una referencia al objeto de `context` como único argumento.

This can be used primarily to re-initialize REPL context to some pre-defined state:

```js
const repl = require('repl');

function initializeContext(context) {
  context.m = 'test';
}

const r = repl.start({ prompt: '> ' });
initializeContext(r.context);

r.on('reset', initializeContext);
```

Cuando se ejecuta este código, la variable `'m'` global puede ser modificada, pero luego restablecida a su valor inicial, utilizando el comando `.clear`:

<!-- eslint-skip -->

```js
$ ./node example.js
> m
'test'
> m = 1
1
> m
1
> .clear
Clearing context...
> m
'test'
>
```

### replServer.defineCommand(keyword, cmd)

<!-- YAML
added: v0.3.0
-->

* `keyword` {string} La palabra clave del comando (*sin* un carácter `.` adelante).
* `cmd` {Object|Function} La función a invocar cuando el comando sea procesado.

El método `replServer.defineCommand()` es utilizado para añadir nuevos comandos con el prefijo `.` a la instancia del REPL. Estos comandos son invocados al escribir `.` seguido por la `keyword`. The `cmd` is either a `Function` or an `Object` with the following properties:

* `help` {string} Texto de ayuda que es mostrado cuando `.help` es introducido (Opcional).
* `action` {Function} La función a ejecutar, aceptando opcionalmente un solo argumento de string.

El siguiente ejemplo muestra dos nuevos comandos añadidos a la instancia del REPL:

```js
const repl = require('repl');

const replServer = repl.start({ prompt: '> ' });
replServer.defineCommand('sayhello', {
  help: 'Say hello',
  action(name) {
    this.clearBufferedCommand();
    console.log(`Hello, ${name}!`);
    this.displayPrompt();
  }
});
replServer.defineCommand('saybye', function saybye() {
  console.log('Goodbye!');
  this.close();
});
```

Los nuevos comandos pueden ser utilizados desde dentro de la instancia del REPL:

```txt
> .sayhello Usuario de Node.js
¡Hola, Usuario de Node.Js!
> .saybye
¡Adiós!
```

### replServer.displayPrompt([preserveCursor])

<!-- YAML
added: v0.1.91
-->

* `preserveCursor` {boolean}

El método `replServer.displayPrompt()` alista a la instancia del REPL para el input del usuario, imprimiendo el `prompt` configurado a una nueva línea en el `output` y reanudando el `input` para aceptar una nueva entrada.

Cuando una entrada multi-líneas esté siendo ingresada, se imprime una elipsis en lugar del 'prompt'.

Cuando `preserveCursor` sea `true`, la colocación del cursor no se restablecerá a `0`.

El método `replServer.displayPrompt` está destinado principalmente para ser llamado desde dentro de la función de acción para comandos registrados, utilizando el método `replServer.defineCommand()`.

### replServer.clearBufferedCommand()

<!-- YAML
added: v9.0.0
-->

The `replServer.clearBufferedCommand()` method clears any command that has been buffered but not yet executed. This method is primarily intended to be called from within the action function for commands registered using the `replServer.defineCommand()` method.

### replServer.parseREPLKeyword(keyword[, rest])

<!-- YAML
added: v0.8.9
deprecated: v9.0.0
-->

* `keyword` {string} the potential keyword to parse and execute
* `rest` {any} any parameters to the keyword command
* Devuelve: {boolean}

> Estabilidad: 0 - Desaprobado.

An internal method used to parse and execute `REPLServer` keywords. Returns `true` if `keyword` is a valid keyword, otherwise `false`.

## repl.start([options])

<!-- YAML
added: v0.1.91
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19187
    description: The `REPL_MAGIC_MODE` `replMode` was removed.
  - version: v5.8.0
    pr-url: https://github.com/nodejs/node/pull/5388
    description: The `options` parameter is optional now.
-->

* `options` {Object|string} 
  * `prompt` {string} El prompt del input a mostrar. **Default:** `'> '` (with a trailing space).
  * `input` {stream.Readable} The `Readable` stream from which REPL input will be read. **Predeterminado:** `process.stdin`.
  * `output` {stream.Writable} The `Writable` stream to which REPL output will be written. **Predeterminado:** `process.stdout`.
  * `terminal` {boolean} Si es `true`, especifica que el `output` debería ser tratado como un terminal de TTY, y le deben ser escritos códigos de escape de ANSI/VT100. **Default:** checking the value of the `isTTY` property on the `output` stream upon instantiation.
  * `eval` {Function} La función que ha de utilizarse al evaluar cada línea de input dada. **Default:** an async wrapper for the JavaScript `eval()` function. Una función `eval` puede producir un error con `repl.Recoverable` para indicar que la entrada fue incompleta y solicitar líneas adicionales al usuario.
  * `useColors` {boolean} Si es `true`, especifica que la función `writer` predeterminada debería incluir el estilo de color ANSI para el output del REPL. Si una función `writer` personalizada es provista, esto no tendrá ningún efecto. **Default:** the REPL instances `terminal` value.
  * `useGlobal` {boolean} Si es `true`, especifica que la función de evaluación predeterminada utilizará la `global` de JavaScript como el contexto, en lugar de crear un nuevo contexto separado para la instancia del REPL. The node CLI REPL sets this value to `true`. **Predeterminado:** `false`.
  * `ignoreUndefined` {boolean} Si es `true`, especifica que el escritor predeterminado no emitirá en el output el valor de retorno de un comando si este evalúa en `undefined`. **Predeterminado:** `false`.
  * `writer` {Function} La función a ser invocada para dar formato al output de cada comando antes de escribir al `output`. **Predeterminado:** [`util.inspect()`][].
  * `completer` {Function} Una función opcional utilizada para el auto-completado de Tab personalizado. Vea [`readline.InterfaceCompleter`][] para un ejemplo.
  * `replMode` {symbol} A flag that specifies whether the default evaluator executes all JavaScript commands in strict mode or default (sloppy) mode. Son valores aceptables: 
    * `repl.REPL_MODE_SLOPPY` - evalúa las expresiones en modo descuidado.
    * `repl.REPL_MODE_STRICT` - evalúa las expresiones en modo estricto. Esto es equivalente a anteceder cada declaración del repl con `'use strict'`.
  * `breakEvalOnSigint` - Detener la evaluación de la porción de código actual cuando `SIGINT` sea recibida, es decir, cuando `Ctrl+C` sea presionada. Esto no puede utilizarse conjuntamente con una función `eval` personalizada. **Predeterminado:** `false`.
* Returns: {repl.REPLServer}

The `repl.start()` method creates and starts a [`repl.REPLServer`][] instance.

Si `options` es una string, entonces especifica el prompt del input:

```js
const repl = require('repl');

// un aviso estilo Unix style
repl.start('$ ');
```

## El REPL de Node.js

Node.js utiliza, en sí mismo, el módulo `repl` para proporcionar su propia interfaz interactiva para la ejecución de JavaScript. Este puede utilizarse ejecutando el binario de Node.js sin pasar ningún argumento (o pasando el argumento `-i`):

<!-- eslint-skip -->

```js
$ node
> const a = [1, 2, 3];
indefinido
> a
[ 1, 2, 3 ]
> a.forEach((v) => {
...   console.log(v);
...   });
1
2
3
```

### Opciones de Variables de Entorno

Varios comportamientos del REPL de Node.js pueden ser personalizados mediante el uso de las siguientes variables de ambiente:

* `NODE_REPL_HISTORY` - Cuando sea proporcionada una ruta válida, se guardará el historial persistente del REPL en el archivo especificado, en lugar de en el `.node_repl_history` dentro de la carpeta de usuario del usuario actual. Setting this value to `''` (an empty string) will disable persistent REPL history. El espacio en blanco será recortado del valor. On Windows platforms environment variables with empty values are invalid so set this variable to one or more spaces to disable persistent REPL history.
* `NODE_REPL_HISTORY_SIZE` - Controls how many lines of history will be persisted if history is available. Debe ser un número positivo. **Predeterminado:** `1000`.
* `NODE_REPL_MODE` - Puede ser tanto el valor `'sloppy'` como el `'strict'`. **Default:** `'sloppy'`, which will allow non-strict mode code to be run.

### Historia Persistente

Por defecto, el REPL de Node.js almacenará de manera persistente el historial de las sesiones `node` de REPL, salvando los inputs en un archivo `.node_repl_history` ubicado en la carpeta de usuario del usuario actual. Esto puede desactivarse al establecer la variable de entorno `NODE_REPL_HISTORY=''`.

### Usando el REPL de Node.js con editores de líneas avanzados

Para utilizar editores de línea avanzados, inicie Node.js con la variable de entorno `NODE_NO_READLINE=1`. This will start the main and debugger REPL in canonical terminal settings, which will allow use with `rlwrap`.

Por ejemplo, el siguiente código puede ser añadido al archivo `.bashrc`:

```text
alias node="env NODE_NO_READLINE=1 rlwrap node"
```

### Inicializando múltiples instancias en vez de inicializar solamente una

Es posible crear y ejecutar múltiples instancias de REPL, en lugar de una instancia única de Node.js que comparta un único objeto `global` pero tenga interfaces I/O separadas.

En el siguiente ejemplo se muestran REPLs separados en `stdin`, un socket de Unix y un socket de TCP:

```js
const net = require('net');
const repl = require('repl');
let connections = 0;

repl.start({
  prompt: 'Node.js via stdin> ',
  input: process.stdin,
  output: process.stdout
});

net.createServer((socket) => {
  connections += 1;
  repl.start({
    prompt: 'Node.js via Unix socket> ',
    input: socket,
    output: socket
  }).on('exit', () => {
    socket.end();
  });
}).listen('/tmp/node-repl-sock');

net.createServer((socket) => {
  connections += 1;
  repl.start({
    prompt: 'Node.js via TCP socket> ',
    input: socket,
    output: socket
  }).on('exit', () => {
    socket.end();
  });
}).listen(5001);
```

La ejecución de esta aplicación desde la línea de comandos dará inicio a un REPL en stdin. Otros clientes de REPL pueden conectarse a través del socket de Unix o socket de TCP. Por ejemplo, `telnet` es útil para conectarse a sockets de TCP, mientras que `socat` puede ser utilizado para conectarse tanto a sockets de Unix como de TCP.

Al iniciar un REPL desde un servidor basado en sockets de Unix, en lugar de en stdin, es posible conectarse a un proceso de larga duración de Node.js sin la necesidad de reiniciarlo.

For an example of running a "full-featured" (`terminal`) REPL over a `net.Server` and `net.Socket` instance, see: <https://gist.github.com/TooTallNate/2209310>.

For an example of running a REPL instance over [curl(1)](https://curl.haxx.se/docs/manpage.html), see: <https://gist.github.com/TooTallNate/2053342>.