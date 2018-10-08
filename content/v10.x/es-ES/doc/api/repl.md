# REPL

<!--introduced_in=v0.10.0-->

> Estabilidad 2 - Estable

El módulo `repl` provee una implementación Bucle Lectura-Evaluación-Impresión la cual esta disponible tanto como un programa individual o incluido en otras aplicaciones. Puede ser accesado usando:

```js
const repl = require('repl');
```

## Diseño y Características

El módulo `repl` exporta la clase `repl.REPLServer`. Mientras se ejecuta, las instancias de `repl.REPLServer` aceptarán líneas de entrada de usuario individuales, y las evaluará de acuerdo a una función de evaluación definida por el usuario. Las entradas y las salidas pueden ser de `stdin` y `stdout`, respectivamente, o pueden estar conectadas a cualquier [stream](stream.html) Node.js.

Las instancias de `repl.REPLServer` soportan la completación automática de las entradas, edición de línea simplista estilo Emac, entradas multi líneas, salidas estilo ANSI, guardar y restaurar el estado de la sesión actual RPL, recuperación de errores, y funciones de evaluación personalizables.

### Comandos y Teclas Especiales

Los siguientes comandos especiales son soportados por todas las instancias REPL:

* `.break` - Cuando en un proceso de entrada de una expresión de múltiples líneas, introducir el comando `.break` (o presionar la combinación de teclas `<ctrl>C`) anulará la entrada adicional o el procesamiento de esa expresión.
* `.clear` - Resetee el `context` REPL a un objeto vacío y limpia cualquier expresión de múltiples líneas actualmente siendo introducida.
* `.exit` - Cierra el stream E/S, causando que RPL se cierre.
* `.help` - Muestra la lista de comandos especiales.
* `.save` - Guarda la sesión actual de REPL a un archivo: `> .save ./file/to/save.js`
* `.load` - Carga un archivo a la actual sesión REPL. `> .load ./file/to/load.js`
* `.editor` - entra en el modo editor (`<ctrl>-D` para finalizar, `<ctrl>-C` para cancelar).

<!-- eslint-skip -->

```js
> .editor
// Entering editor mode (^D to finish, ^C to cancel)
function welcome(name) {
  return `Hello ${name}!`;
}

welcome('Node.js User');

// ^D
'Hello Node.js User!'
>
```

Las siguientes combinaciones de teclas en REPL tienen los siguientes efectos:

* `<ctrl>-C` - Cuando es presionada, tiene el mismo efecto que el comando `.break`. Cuando es presionada dos veces en una línea en blanco, tiene el mismo efecto que el comando `.exit`.
* `<ctrl>-D` - Tiene el mismo efecto que el comando `.exit`.
* `<tab>` - Cuando es presionado en una línea en blanco, muestra las variables globales y locales (alcance). Cuando se presiona mientras se está introduciendo otra entrada, muestra las opciones de autocompletado relevantes.

### Evaluación Predeterminada

De forma predeterminada, todas las instancias del `repl.REPLServer` usan una función de evaluación que evalúa las expresiones de JavaScript y provee acceso a los módulos integrados de Node.Js. Este comportamiento predeterminado puede ser al pasar una función de evaluación alternativa cuando la instancia `repl.REPLServer` es creada.

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

A menos que haya sido examinado dentro de bloques o funciones, las variables declaradas implícitamente o usando las palabras claves `const`, `let`, o `var` son declaradas en el espectro global.

#### Espectros Globales y Locales

El evaluador por defecto provee acceso a cualquiera de las varaibles que existen en el espectro global. Es posible exponer explícitamente a una variable al REPL asignándola al objeto `context` asociado con cada `REPLServer`:

```js
const repl = require('repl');
const msg = 'message';

repl.start('> ').context.m = msg;
```

Las propiedades en el objeto `context` aperecen como locales dentro de REPL:

<!-- eslint-skip -->

```js
$ node repl_test.js
> m
'message'
```

Las propiedades de contexto no son de sólo lectura por defecto. Para especificar globales de sólo lectura, propiedades de contexto deben ser definidas utilizando `Object.defineProperty()`:

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

#### Accesando a los módulos principales de Node.Js

El evaluador predeterminado cargará automáticamente los módulos principales de Node.JS al ambiante REPL cuando sea usado. For instance, unless otherwise declared as a global or scoped variable, the input `fs` will be evaluated on-demand as `global.fs = require('fs')`.

<!-- eslint-skip -->

```js
> fs.createReadStream('./some/file');
```

#### Global Uncaught Exceptions

The REPL uses the [`domain`][] module to catch all uncaught exceptions for that REPL session.

This use of the [`domain`][] module in the REPL has these side effects:

* Uncaught exceptions do not emit the [`'uncaughtException'`][] event.
* Trying to use [`process.setUncaughtExceptionCaptureCallback()`][] throws an [`ERR_DOMAIN_CANNOT_SET_UNCAUGHT_EXCEPTION_CAPTURE`][] error.

#### Assignment of the `_` (underscore) variable

<!-- YAML
changes:

  - version: v9.8.0
    pr-url: https://github.com/nodejs/node/pull/18919
    description: Added `_error` support.
-->

The default evaluator will, by default, assign the result of the most recently evaluated expression to the special variable `_` (underscore). Explicitly setting `_` to a value will disable this behavior.

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

#### `await` keyword

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

### Custom Evaluation Functions

When a new `repl.REPLServer` is created, a custom evaluation function may be provided. This can be used, for instance, to implement fully customized REPL applications.

The following illustrates a hypothetical example of a REPL that performs translation of text from one language to another:

```js
const repl = require('repl');
const { Translator } = require('translator');

const myTranslator = new Translator('en', 'fr');

function myEval(cmd, context, filename, callback) {
  callback(null, myTranslator.translate(cmd));
}

repl.start({ prompt: '> ', eval: myEval });
```

#### Recoverable Errors

As a user is typing input into the REPL prompt, pressing the `<enter>` key will send the current line of input to the `eval` function. In order to support multi-line input, the eval function can return an instance of `repl.Recoverable` to the provided callback function:

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

### Customizing REPL Output

By default, `repl.REPLServer` instances format output using the [`util.inspect()`][] method before writing the output to the provided `Writable` stream (`process.stdout` by default). The `useColors` boolean option can be specified at construction to instruct the default writer to use ANSI style codes to colorize the output from the `util.inspect()` method.

It is possible to fully customize the output of a `repl.REPLServer` instance by passing a new function in using the `writer` option on construction. The following example, for instance, simply converts any input text to upper case:

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

## Class: REPLServer

<!-- YAML
added: v0.1.91
-->

The `repl.REPLServer` class inherits from the [`readline.Interface`][] class. Instances of `repl.REPLServer` are created using the `repl.start()` method and *should not* be created directly using the JavaScript `new` keyword.

### Event: 'exit'

<!-- YAML
added: v0.7.7
-->

The `'exit'` event is emitted when the REPL is exited either by receiving the `.exit` command as input, the user pressing `<ctrl>-C` twice to signal `SIGINT`, or by pressing `<ctrl>-D` to signal `'end'` on the input stream. The listener callback is invoked without any arguments.

```js
replServer.on('exit', () => {
  console.log('Received "exit" event from repl!');
  process.exit();
});
```

### Event: 'reset'

<!-- YAML
added: v0.11.0
-->

The `'reset'` event is emitted when the REPL's context is reset. This occurs whenever the `.clear` command is received as input *unless* the REPL is using the default evaluator and the `repl.REPLServer` instance was created with the `useGlobal` option set to `true`. The listener callback will be called with a reference to the `context` object as the only argument.

This can be used primarily to re-initialize REPL context to some pre-defined state as illustrated in the following simple example:

```js
const repl = require('repl');

function initializeContext(context) {
  context.m = 'test';
}

const r = repl.start({ prompt: '> ' });
initializeContext(r.context);

r.on('reset', initializeContext);
```

When this code is executed, the global `'m'` variable can be modified but then reset to its initial value using the `.clear` command:

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

* `keyword` {string} The command keyword (*without* a leading `.` character).
* `cmd` {Object|Function} The function to invoke when the command is processed.

The `replServer.defineCommand()` method is used to add new `.`-prefixed commands to the REPL instance. Such commands are invoked by typing a `.` followed by the `keyword`. The `cmd` is either a `Function` or an `Object` with the following properties:

* `help` {string} Help text to be displayed when `.help` is entered (Optional).
* `action` {Function} The function to execute, optionally accepting a single string argument.

The following example shows two new commands added to the REPL instance:

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

The new commands can then be used from within the REPL instance:

```txt
> .sayhello Node.js User
Hello, Node.js User!
> .saybye
Goodbye!
```

### replServer.displayPrompt([preserveCursor])

<!-- YAML
added: v0.1.91
-->

* `preserveCursor` {boolean}

The `replServer.displayPrompt()` method readies the REPL instance for input from the user, printing the configured `prompt` to a new line in the `output` and resuming the `input` to accept new input.

When multi-line input is being entered, an ellipsis is printed rather than the 'prompt'.

When `preserveCursor` is `true`, the cursor placement will not be reset to `0`.

The `replServer.displayPrompt` method is primarily intended to be called from within the action function for commands registered using the `replServer.defineCommand()` method.

### replServer.clearBufferedCommand()

<!-- YAML
added: v9.0.0
-->

The `replServer.clearBufferedCommand()` method clears any command that has been buffered but not yet executed. This method is primarily intended to be called from within the action function for commands registered using the `replServer.defineCommand()` method.

### replServer.parseREPLKeyword(keyword, [rest])

<!-- YAML
added: v0.8.9
deprecated: v9.0.0
-->

* `keyword` {string} the potential keyword to parse and execute
* `rest` {any} any parameters to the keyword command
* Returns: {boolean}

> Stability: 0 - Deprecated.

An internal method used to parse and execute `REPLServer` keywords. Returns `true` if `keyword` is a valid keyword, otherwise `false`.

## repl.start([options])

<!-- YAML
added: v0.1.91
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/v10.0.0
    description: The `REPL_MAGIC_MODE` `replMode` was removed.
  - version: v5.8.0
    pr-url: https://github.com/nodejs/node/pull/5388
    description: The `options` parameter is optional now.
-->

* `options` {Object|string} 
  * `prompt` {string} The input prompt to display. **Default:** `'> '` (with a trailing space).
  * `input` {stream.Readable} The `Readable` stream from which REPL input will be read. **Default:** `process.stdin`.
  * `output` {stream.Writable} The `Writable` stream to which REPL output will be written. **Default:** `process.stdout`.
  * `terminal` {boolean} If `true`, specifies that the `output` should be treated as a TTY terminal, and have ANSI/VT100 escape codes written to it. **Default:** checking the value of the `isTTY` property on the `output` stream upon instantiation.
  * `eval` {Function} The function to be used when evaluating each given line of input. **Default:** an async wrapper for the JavaScript `eval()` function. An `eval` function can error with `repl.Recoverable` to indicate the input was incomplete and prompt for additional lines.
  * `useColors` {boolean} If `true`, specifies that the default `writer` function should include ANSI color styling to REPL output. If a custom `writer` function is provided then this has no effect. **Default:** the REPL instances `terminal` value.
  * `useGlobal` {boolean} If `true`, specifies that the default evaluation function will use the JavaScript `global` as the context as opposed to creating a new separate context for the REPL instance. The node CLI REPL sets this value to `true`. **Default:** `false`.
  * `ignoreUndefined` {boolean} If `true`, specifies that the default writer will not output the return value of a command if it evaluates to `undefined`. **Default:** `false`.
  * `writer` {Function} The function to invoke to format the output of each command before writing to `output`. **Default:** [`util.inspect()`][].
  * `completer` {Function} An optional function used for custom Tab auto completion. See [`readline.InterfaceCompleter`][] for an example.
  * `replMode` {symbol} A flag that specifies whether the default evaluator executes all JavaScript commands in strict mode or default (sloppy) mode. Acceptable values are: 
    * `repl.REPL_MODE_SLOPPY` - evaluates expressions in sloppy mode.
    * `repl.REPL_MODE_STRICT` - evaluates expressions in strict mode. This is equivalent to prefacing every repl statement with `'use strict'`.
  * `breakEvalOnSigint` - Stop evaluating the current piece of code when `SIGINT` is received, i.e. `Ctrl+C` is pressed. This cannot be used together with a custom `eval` function. **Default:** `false`.

The `repl.start()` method creates and starts a `repl.REPLServer` instance.

If `options` is a string, then it specifies the input prompt:

```js
const repl = require('repl');

// a Unix style prompt
repl.start('$ ');
```

## The Node.js REPL

Node.js itself uses the `repl` module to provide its own interactive interface for executing JavaScript. This can be used by executing the Node.js binary without passing any arguments (or by passing the `-i` argument):

<!-- eslint-skip -->

```js
$ node
> const a = [1, 2, 3];
undefined
> a
[ 1, 2, 3 ]
> a.forEach((v) => {
...   console.log(v);
...   });
1
2
3
```

### Environment Variable Options

Various behaviors of the Node.js REPL can be customized using the following environment variables:

* `NODE_REPL_HISTORY` - When a valid path is given, persistent REPL history will be saved to the specified file rather than `.node_repl_history` in the user's home directory. Setting this value to `''` will disable persistent REPL history. Whitespace will be trimmed from the value.
* `NODE_REPL_HISTORY_SIZE` - Controls how many lines of history will be persisted if history is available. Must be a positive number. **Default:** `1000`.
* `NODE_REPL_MODE` - May be either `'sloppy'` or `'strict'`. **Default:** `'sloppy'`, which will allow non-strict mode code to be run.

### Persistent History

By default, the Node.js REPL will persist history between `node` REPL sessions by saving inputs to a `.node_repl_history` file located in the user's home directory. This can be disabled by setting the environment variable `NODE_REPL_HISTORY=''`.

### Using the Node.js REPL with advanced line-editors

For advanced line-editors, start Node.js with the environment variable `NODE_NO_READLINE=1`. This will start the main and debugger REPL in canonical terminal settings, which will allow use with `rlwrap`.

For example, the following can be added to a `.bashrc` file:

```text
alias node="env NODE_NO_READLINE=1 rlwrap node"
```

### Starting multiple REPL instances against a single running instance

It is possible to create and run multiple REPL instances against a single running instance of Node.js that share a single `global` object but have separate I/O interfaces.

The following example, for instance, provides separate REPLs on `stdin`, a Unix socket, and a TCP socket:

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

Running this application from the command line will start a REPL on stdin. Other REPL clients may connect through the Unix socket or TCP socket. `telnet`, for instance, is useful for connecting to TCP sockets, while `socat` can be used to connect to both Unix and TCP sockets.

By starting a REPL from a Unix socket-based server instead of stdin, it is possible to connect to a long-running Node.js process without restarting it.

For an example of running a "full-featured" (`terminal`) REPL over a `net.Server` and `net.Socket` instance, see: <https://gist.github.com/2209310>.

For an example of running a REPL instance over [curl(1)](https://curl.haxx.se/docs/manpage.html), see: <https://gist.github.com/2053342>.