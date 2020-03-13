# REPL

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

El módulo `repl` proporciona una implementación del Bucle de Lectura-Evaluación-Impresión (Read-Eval-Print-Loop, REPL) que está disponible tanto como un programa independiente como uno con posibilidad de inclusión en otras aplicaciones. Se puede acceder a él utilizando:

```js
const repl = require('repl');
```

## Diseño y Características

The `repl` module exports the [`repl.REPLServer`][] class. While running, instances of [`repl.REPLServer`][] will accept individual lines of user input, evaluate those according to a user-defined evaluation function, then output the result. Input and output may be from `stdin` and `stdout`, respectively, or may be connected to any Node.js [stream](stream.html).

Instances of [`repl.REPLServer`][] support automatic completion of inputs, simplistic Emacs-style line editing, multi-line inputs, ANSI-styled output, saving and restoring current REPL session state, error recovery, and customizable evaluation functions.

### Comandos y Teclas Especiales

Los siguientes comandos especiales son soportados por todas las instancias de REPL:

* `.break` - Durante el proceso de entrada de una expresión multi-línea, la introducción del comando `.break` (o la presión de la combinación de teclas `<ctrl>-C`) abortará el ingreso de un input adicional y el procesamiento de dicha expresión.
* `.clear` - Restablece `context` de REPL a un objeto vacío y limpia cualquier expresión multi-línea que esté siendo introducida en ese momento.
* `.exit` - Cierra el stream I/O, ocasionando la salida de REPL.
* `.help` - Muestra esta lista de comandos especiales.
* `.save` -Guarda la sesión de REPL actual en un archivo: `> .save ./file/to/save.js`
* `.load` - Carga un archivo en la sesión de REPL actual. `> .load ./file/to/load.js`
* `.editor` - entra en el modo editor (`<ctrl>-D` para finalizar, `<ctrl>-C` para cancelar).
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

Las siguientes combinaciones de teclas en el REPL tendrán estos efectos especiales:

* `<ctrl>-C` - Cuando se presiona una vez, tiene el mismo efecto que el comando `.break`. Cuando se presiona dos veces en una línea en blanco, tiene el mismo efecto que el comando `.exit`.
* `<ctrl>-D` - Tiene el mismo efecto que el comando `.exit`.
* `<tab>` - Cuando es presionado en una línea en blanco, muestra las variables globales y locales (alcance). Cuando se presiona mientras se está ingresando otro input, muestra opciones de auto-completado relevantes.

### Evaluación Predeterminada

By default, all instances of [`repl.REPLServer`][] use an evaluation function that evaluates JavaScript expressions and provides access to Node.js' built-in modules. This default behavior can be overridden by passing in an alternative evaluation function when the [`repl.REPLServer`][] instance is created.

#### Expresiones de JavaScript

El evaluador predeterminado soporta la evaluación directa de las expresiones de JavaScript:
```js
> 1 + 1
2
> const m = 2
undefined
> m + 1
3
```

A menos que haya sido examinado dentro de bloques o funciones, las variables declaradas implícitamente o usando las palabras claves `const`, `let`, o `var` son declaradas en el espectro global.

#### Ámbitos Global y Local

El evaluador predeterminado proporciona acceso a las variables que existan en el ámbito global. Es posible exponer explícitamente a una variable al REPL asignándola al objeto `context` asociado con cada `REPLServer`:

```js
const repl = require('repl');
const msg = 'message';

repl.start('> ').context.m = msg;
```

Las propiedades en el objeto de `context` aparecen como locales dentro del REPL:
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

#### Acceso a los Módulos Principales de Node.js

El evaluador predeterminado cargará automáticamente los módulos principales de Node.js en el ambiente de REPL cuando sea usado. Por ejemplo, a menos que sea declarado como una variable global o con ámbito, el input `fs` será evaluado como `global.fs = require('fs')` cuando se requiera.
```js
> fs.createReadStream('./some/file');
```

#### Excepciones Globales No Capturadas

El REPL utiliza el módulo [`domain`][] para capturar todas las excepciones sin capturar para esa sesión REPL.

Este uso del módulo [`domain`][] en el REPL tiene estos efectos secundarios:

* Las excepciones sin capturar no emiten el evento [`'uncaughtException'`][].
* Trata de utilizar [`process.setUncaughtExceptionCaptureCallback()`][] produce un error [`ERR_DOMAIN_CANNOT_SET_UNCAUGHT_EXCEPTION_CAPTURE`][].

#### La asignación de la variable `_` (barra baja)<!-- YAML
changes:
  - version: v9.8.0
    pr-url: https://github.com/nodejs/node/pull/18919
    description: Added `_error` support.
-->El evaluador predeterminado será, por defecto, asignado al resultado de la expresión evaluada por la variable especial `_` (barra baja). Explícitamente configurar `_` a algún valor deshabilitará este comportamiento.
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

De forma similar, `_error` referirá al último error visto, si hubo alguno. Establecer explícitamente `_error` a algún valor deshabilitará este comportamiento.
```js
> throw new Error('foo');
Error: foo
> _error.message
'foo'
```

#### Palabra clave `await`

Con la opción de comando de línea [`--experimental-repl-await`][] especificada, el soporte experimental para la palabra clave `await` es habilitado.
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

When a new [`repl.REPLServer`][] is created, a custom evaluation function may be provided. Esta puede ser usada, por ejemplo, para implementar aplicaciones REPL completamente personalizables.

Lo siguiente ilustra un ejemplo hipotético de un REPL que realiza la traducción de un texto de un lenguaje a otro:

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

### Personalización del Output de REPL

By default, [`repl.REPLServer`][] instances format output using the [`util.inspect()`][] method before writing the output to the provided `Writable` stream (`process.stdout` by default). La opción booleana `useColors` puede ser especificada en la construcción para ordenar al escritor predeterminado a utilizar códigos al estilo ANSI para colorear la salida del método `util.inspect()`.

It is possible to fully customize the output of a [`repl.REPLServer`][] instance by passing a new function in using the `writer` option on construction. El siguiente ejemplo, convierte un texto de entrada a mayúsculas:

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

## Clase: REPLServer<!-- YAML
added: v0.1.91
-->La clase `repl.REPLServer` hereda de la clase [`readline.Interface`][]. Las instancias del `repl.REPLServer` son creadas usando el método `repl.start()` y *no deberían* ser creadas directamente utilizando la `nueva` palabra clave de JavaScript.

### Evento: 'exit'<!-- YAML
added: v0.7.7
-->El evento `'exit'` es emitido cuando el REPL es cerrado, sea por la introducción del comando `.exit`, el usuario presionando `<ctrl>-C` dos veces para señalar `SIGINT`, o al presionar `<ctrl>-D` para señalar `'fin'` en el stream de entrada. La función oyente de devolución es invocada sin ningún argumento.

```js
replServer.on('exit', () => {
  console.log('Received "exit" event from repl!');
  process.exit();
});
```

### Evento: 'reset'<!-- YAML
added: v0.11.0
-->El evento `'reset'` es emitido cuando el contexto de REPL es reseteado. Esto ocurre cuando el comando `.clear` es recibido como input, *a menos * que el REPL esté utilizando el evaluador predeterminado y la instancia de `repl.REPLServer` haya sido creada con la opción `useGlobal` establecida en `true`. La callback del listener será llamada con una referencia al objeto de `context` como único argumento.

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

### replServer.defineCommand(keyword, cmd)<!-- YAML
added: v0.3.0
-->* `keyword` {string} La palabra clave del comando (*sin* un carácter `.` adelante).
* `cmd` {Object|Function} La función a invocar cuando el comando sea procesado.

El método `replServer.defineCommand()` es utilizado para añadir nuevos comandos con el prefijo `.` a la instancia del REPL. Estos comandos son invocados al escribir `.` seguido por la `keyword`. El `cmd` es una `Function` o un `Object` con las siguientes propiedades:

* `help` {string} Texto de ayuda que es mostrado cuando `.help` es introducido (Opcional).
* `action` {Function} La función a ejecutar, opcionalmente aceptando un único argumento de string.

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

### replServer.displayPrompt([preserveCursor])<!-- YAML
added: v0.1.91
-->* `preserveCursor` {boolean}

El método `replServer.displayPrompt()` alista a la instancia del REPL para el input del usuario, imprimiendo el `prompt` configurado a una nueva línea en el `output` y reanudando el `input` para aceptar una nueva entrada.

Cuando una entrada multi-líneas esté siendo ingresada, se imprime una elipsis en lugar del 'prompt'.

Cuando `preserveCursor` sea `true`, la colocación del cursor no se restablecerá a `0`.

El método `replServer.displayPrompt` está destinado principalmente para ser llamado desde dentro de la función de acción para comandos registrados, utilizando el método `replServer.defineCommand()`.

### replServer.clearBufferedCommand()<!-- YAML
added: v9.0.0
-->El método `replServer.clearBufferedCommand()` borra cualquier comando que ha sido cargado pero no aún ejecutado. Este método está destinado principalmente para ser llamado desde dentro la función acción para comandos registrados utilizando el método `replServer.defineCommand()`.

### replServer.parseREPLKeyword(keyword[, rest])<!-- YAML
added: v0.8.9
deprecated: v9.0.0
-->* `keyword` {string} la palabra clave potencial para analizar y ejecutar
* `rest` {any} cualquier parámetro del comando de la palabra clave
* Devuelve: {boolean}

> Estabilidad: 0-Desaprobada.

Un método interno usado para analizar y ejecutar las palabras claves del `REPLServer`. Devuelve `true` si `keyword` es una palabra clave válida, si no `false`.

## repl.start([options])<!-- YAML
added: v0.1.91
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19187
    description: The `REPL_MAGIC_MODE` `replMode` was removed.
  - version: v5.8.0
    pr-url: https://github.com/nodejs/node/pull/5388
    description: The `options` parameter is optional now.
-->* `opciones` {Object|string}
  * `prompt` {string} El aviso de entrada para mostrar. **Predeterminado:** `'> '` (con un espacio al final).
  * `input` {stream.Readable} El stream `leíble` del cual la entrada del REPL será leída. **Predeterminado:** `process.stdin`.
  * `output` {stream.Writable} El stream `con permisos de escritura` en el cual la salida del REPL será escrita. **Predeterminado:** `process.stdout`.
  * `terminal` {boolean} Si es `true`, especifica que la `salida` debería ser tratada como un TTY de la terminal, y tener códigos de escape ANSI/VT100 escrito en ella. **Predeterminado:** chequear el valor de la propiedad `isTTY` en el stream de `salida` al ser instanciado.
  * `eval` {Función} La función que será usada al evaluar cada línea de entrada dada. **Predeterminado:** un contenedor asíncrono para la función `eval()` de JavaScript. Una función `eval` puede tener errores con `repl.Recoverable` para indicar que la entrada fue incompleta y pedir líneas adicionales.
  * `useColors` {boolean} Si es `true`, especifica que la función `writer` predeterminada debería incluir el estilo de color ANSI para el output del REPL. Si una función `writer` personalizada es provista, esto no tendrá ningún efecto. **Predeterminado:** el valor `terminal` de las instancias REPL.
  * `useGlobal` {boolean} Si es `true`, especifica que la función de evaluación predeterminada utilizará la `global` de JavaScript como el contexto, en lugar de crear un nuevo contexto separado para la instancia del REPL. El nodo CLI REPL establece su valor a `true`. **Predeterminado:** `false`.
  * `ignoreUndefined` {boolean} Si es `true`, especifica que el escritor predeterminado no emitirá en el output el valor de retorno de un comando si este evalúa en `undefined`. **Predeterminado:** `false`.
  * `writer` {Function} La función a ser invocada para dar formato al output de cada comando antes de escribir al `output`. **Predeterminado:** [`util.inspect()`][].
  * `completer` {Function} Una función opcional utilizada para el auto-completado de Tab personalizado. Vea [`readline.InterfaceCompleter`][] para un ejemplo.
  * `replMode` {symbol} A flag that specifies whether the default evaluator executes all JavaScript commands in strict mode or default (sloppy) mode. Son valores aceptables:
    * `repl.REPL_MODE_SLOPPY` - evalúa las expresiones en modo descuidado.
    * `repl.REPL_MODE_STRICT` - evalúa las expresiones en modo estricto. Esto es equivalente a prologar cada declaración repl con `'use strict'`.
  * `breakEvalOnSigint` - Detener la evaluación de la porción de código actual cuando `SIGINT` sea recibida, es decir, cuando `Ctrl+C` sea presionada. Esto no puede utilizarse conjuntamente con una función `eval` personalizada. **Predeterminado:** `false`.
* Devuelve: {repl.REPLServer}

The `repl.start()` method creates and starts a [`repl.REPLServer`][] instance.

Si `options` es una string, entonces especifica el prompt del input:

```js
const repl = require('repl');

// un aviso estilo Unix style
repl.start('$ ');
```

## El REPL de Node.js

Node.js utiliza, en sí mismo, el módulo `repl` para proporcionar su propia interfaz interactiva para la ejecución de JavaScript. Este puede utilizarse ejecutando el binario de Node.js sin pasar ningún argumento (o pasando el argumento `-i`):
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

 - `NODE_REPL_HISTORY` - When a valid path is given, persistent REPL history will be saved to the specified file rather than `.node_repl_history` in the user's home directory. Setting this value to `''` (an empty string) will disable persistent REPL history. El espacio en blanco será recortado del valor. On Windows platforms environment variables with empty values are invalid so set this variable to one or more spaces to disable persistent REPL history.
 - `NODE_REPL_HISTORY_SIZE` - Controls how many lines of history will be persisted if history is available. Debe ser un número positivo. **Default:** `1000`.
 - `NODE_REPL_MODE` - Puede ser tanto el valor `'sloppy'` como el `'strict'`. **Default:** `'sloppy'`, which will allow non-strict mode code to be run.

### Historia Persistente

Por defecto, el REPL de Node.js almacenará de manera persistente el historial de las sesiones `node` de REPL, salvando los inputs en un archivo `.node_repl_history` ubicado en la carpeta de usuario del usuario actual. Esto puede desactivarse al establecer la variable de entorno `NODE_REPL_HISTORY=''`.

### Usando el REPL de Node.js con editores de líneas avanzados

Para utilizar editores de línea avanzados, inicie Node.js con la variable de entorno `NODE_NO_READLINE=1`. Esto iniciará el REPL principal y el depurador en configuraciones canónicas terminales, lo cual permitirá utilizarlos con `rlwrap`.

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

Ejecutar esta aplicación desde la línea de comandos inicializará un REPL en stdin. Otros clientes REPL pueden conectarse a través del socket Unix o el socket TCP. `telnet`, por ejemplo, es útil para conectarse a los sockets TCP, mientras los `socat` pueden ser usados por ambos, tanto Unix como sockets TCP.

Al iniciar un REPL desde un servidor Unix basado en sockets en vez de stdin, es posible conectarse a un proceso Node.js de larga duración sin reiniciarlo.

For an example of running a "full-featured" (`terminal`) REPL over a `net.Server` and `net.Socket` instance, see: <https://gist.github.com/TooTallNate/2209310>.

For an example of running a REPL instance over [curl(1)](https://curl.haxx.se/docs/manpage.html), see: <https://gist.github.com/TooTallNate/2053342>.
