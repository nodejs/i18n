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

* `.break` - Durante un proceso de entrada de una expresión de múltiples líneas, introducir el comando `.break` (o presionar la combinación de teclas `<ctrl>C`) anulará la entrada adicional o el procesamiento de esa expresión.
* `.clear` - Resetea el `context` REPL a un objeto vacío y limpia cualquier expresión de múltiples líneas actualmente siendo introducida.
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

El evaluador por defecto provee acceso a cualquiera de las variables que existen en el espectro global. Es posible exponer explícitamente a una variable al REPL asignándola al objeto `context` asociado con cada `REPLServer`:

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

Las propiedades de contexto no son de sólo lectura por defecto. Para especificar globales de sólo lectura, deben ser definidas propiedades de contexto utilizando `Object.defineProperty()`:

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

El evaluador predeterminado cargará automáticamente los módulos principales de Node.JS al ambiente REPL cuando sea usado. Por ejemplo, a menos que sea declarado como variable global o examinada, la entrada `fs` será evaluada cuando sea comandada como `global.fs = require('fs')`.

<!-- eslint-skip -->

```js
> fs.createReadStream('./some/file');
```

#### Excepciones Globales No Capturadas

El REPL utiliza el módulo [`domain`][] para capturar todas las excepciones sin capturar para esa sesión REPL.

Este uso del módulo [`domain`][] en el REPL tiene estos efectos secundarios:

* Las excepciones sin capturar no emiten el evento [`'uncaughtException'`][].
* Trata de utilizar [`process.setUncaughtExceptionCaptureCallback()`][] produce un error [`ERR_DOMAIN_CANNOT_SET_UNCAUGHT_EXCEPTION_CAPTURE`][].

#### La asignación de la variable `_` (barra baja)

<!-- YAML
changes:

  - version: v9.8.0
    pr-url: https://github.com/nodejs/node/pull/18919
    description: Added `_error` support.
-->

El evaluador predeterminado será, por defecto, asignado al resultado de la expresión evaluada por la variable especial `_` (barra baja). Explícitamente configurar `_` a algún valor deshabilitará este comportamiento.

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

De forma similar, `_error` referirá al último error visto, si hay alguno. Establecer explícitamente `_error` a algún valor deshabilitará este comportamiento.

<!-- eslint-skip -->

```js
> throw new Error('foo');
Error: foo
> _error.message
'foo'
```

#### Palabra clave `await`

Con la opción de comando de línea [`--experimental-repl-await`][] especificada, el soporte experimental para la palabra clave `await` es habilitado.

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

Cuando un nuevo `repl.REPLServer` es creado, una función de evaluación personalizable puede ser provista. Esto puede ser usada, por ejemplo, para implementar aplicaciones REPL completamente personalizables.

Lo siguiente ilustra un ejemplo hipotético de un REPL que realiza la traducción de un texto de un lenguaje a otro ilustra:

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

Mientras un usuario está ingresando información al campo de entrada del REPL, presionar la `<enter>` tecla enviará la línea actual de entrada a la función `eval`. Con el fin de soportar entradas de múltiples líneas, la función eval puede devolver una instancia de `repl.Recoverable` a la función callback provista:

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

### Personalizando la salida REPL

Por defecto, las instancias `repl.REPLServer` formatean la salida usando el método [`util.inspect()`][] antes de escribir la entrada al stream `Writable` provisto (`process.stdout` por defecto). La opción booleana `useColors` puede ser especificada en la construcción para ordenar al escritor predeterminado a utilizar códigos al estilo ANSI para colorizar la salida del método `util.inspect()`.

Es posible personalizar totalmente la salida de la instancia `repl.REPLServer` al pasarle una nueva función al usar la opción `writer` en la construcción. El siguiente ejemplo, convierte un texto de entrada a mayúsculas:

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

La clase `repl.REPLServer` hereda de la clase [`readline.Interface`][]. Las instancias del `repl.REPLServer` son creadas usando el método `repl.start()` y *no deberían* ser creadas directamnte utilizando la `nueva` palabra clave de JavaScript.

### Evento: 'salida'

<!-- YAML
added: v0.7.7
-->

El evento `'salida'` es emitido cuando el REPL es cerrado, sea por la introducción del comando `.exit`, el usuario presionando `<ctrl>-C` dos veces para señalar `SIGINT`, o al presionar `<ctrl>-D` para señalar `'fin'` en el stream de entrada. La función oyente de devolución es invocada sin ningún argumento.

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

El evento `'reset'` ess emitido cuando el contexto de REPL es reseteado. Esto ocurre siempre que el comando `.clear` es recibido como entrada *a menos* que el REPL esté usando el evaluador predeterminado y la instancia del `repl.REPLServer` haya sido creada con la opción `useGlobal` colocada a `true`. La función oyente de devolución será llamado con una referencia al objeto del `context` como único argumento.

Esto puede ser usado primeramente para reiniciar el contexto REPL a un estado pre-definido como es ilustrado en el siguiente ejemplo:

```js
const repl = require('repl');

function initializeContext(context) {
  context.m = 'test';
}

const r = repl.start({ prompt: '> ' });
initializeContext(r.context);

r.on('reset', initializeContext);
```

Cuando el código es ejecutado, la variable global `'m'` puede ser modificada pero luego reseteada a su valor inicial utilizando el comando `.clear`:

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

* `keyword` {string} El comando keyword (*sin un* caracter inicial `.`).
* `cmd` {Objeto|Función} La función que se utiliza cuando el comando está siendo procesado.

El método `replServer.defineCommand()` es usado para añadir nuevos comandos `.` prefijados a la instancia REPL. Estos comandos son invocadaos al escribir un `.` seguido de `keyword`. El `cmd` es una `Función` o un `Objeto` con las siguientes propiedades:

* `help` {string} Texto de ayuda que es mostrado cuando `.help` es introducido (Opcional).
* `action` {Función} La función para ejecutar, opcionalmente aceptando un único argumento de string.

El siguiente ejemplo muestra dos nuesvos comando agregados a la instancia REPL:

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

Los nuevos comandos pueden ser usados desde dentro de la instancia REPL:

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

El método `replServer.displayPrompt()` prepara la instancia REPL para la entrada proviniente del usuario, imprimiendo el `aviso` configurado a una nueva línea en la `salida` y resumiendo la `entrada` para aceptar una nueva.

Cuando una entrada de múltiples lines está siendo introducida, una elipsis se imprime en lugar del "aviso".

Cuando `preserveCursor` es `true`, la colocación del cursor no se restablecera a `0`.

El método `replServer.displayPrompt` está destinado principalmente para ser llamado desde dentro la función de acción para comandos registrados usando el método `replServer.defineCommand()`.

### replServer.clearBufferedCommand()

<!-- YAML
added: v9.0.0
-->

El método `replServer.clearBufferedCommand()` borra cualquier comando que ha sido cargado pero no aún ejecutado. Este método está destinado principalmente para ser llamado desde dentro la función acción para comandos registrados utilizando el método `replServer.defineCommand()`.

### replServer.parseREPLKeyword(keyword, [rest])

<!-- YAML
added: v0.8.9
deprecated: v9.0.0
-->

* `keyword` {string} la palabra clave potencial para analizar y ejecutar
* `rest` {any} cualquier parámetro del comando de la palabra clave
* Devuelve: {boolean}

> Estabilidad: 0-Desaprobada.

Un método interno usado para analizar y ejecutar las palabras claves del `REPLServer`. Devuelve `true` si `keyword` es una palabra clave válida, si no `false`.

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

* `options` {Objeto|string} 
  * `prompt` {string} El aviso de entrada para mostrar. **Predeterminado:** `'> '` (con un espacio al final).
  * `input` {stream.Readable} El stream `leíble` del cual la entrada del REPL será leída. **Predeterminado:** `process.stdin`.
  * `output` {stream.Writable} El stream `con permisos de escritura` en el cual la salida del REPL será escrita. **Predeterminado:** `process.stdout`.
  * `terminal` {boolean} Si es `true`, especifica que la `salida` debería ser tratada como un TTY de la terminal, y tener códigos de escape ANSI/VT100 escrito en ella. **Predeterminado:** chequear el valor de la propiedad `isTTY` en el stream de `salida` al ser instanciado.
  * `eval` {Función} La función que será usada al evaluar cada línea de entrada dada. **Predeterminado:** un contenedor asíncrono para la función `eval()` de JavaScript. Una función `eval` puede tener errores con `repl.Recoverable` para indicar que la entrada fue incompleta y pedir líneas adicionales.
  * `useColors` {boolean} Si es `true`, especifica que la función predeterminada `writer` debería incluir el estilo de color ANSI para la salida de REPL. Si una función personalizada `writer` es proporcionada entonces esto no tiene efecto. **Predeterminado:** el valor `terminal` de las instancias REPL.
  * `useGlobal` {boolean} Si es `true`, especifica que la función de evaluación predeterminada usará la variable de JavaScript `global` como el contexto que se opone a la creación de un nuevo contexto separado para la instancia REPL. El nodo CLI REPL establece su valor a `true`. **Predeterminado:** `false`.
  * `ignoreUndefined` {boolean} Si es `true`, especifica que el escritor predeterminado no generará el valor de retorno de un comando si el mismo evalúa a `undefined`. **Predeterminado:** `false`.
  * `writer` {Function} The function to invoke to format the output of each command before writing to `output`. **Predeterminado:** [`util.inspect()`][].
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