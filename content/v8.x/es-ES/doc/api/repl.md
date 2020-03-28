# REPL

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

El módulo `repl` proporciona una implementación del Bucle de Lectura-Evaluación-Impresión (Read-Eval-Print-Loop, REPL) que está disponible tanto como un programa independiente como uno con posibilidad de inclusión en otras aplicaciones. Se puede acceder a él utilizando:

```js
const repl = require('repl');
```

## Diseño y Características

El módulo `repl` exporta la clase `repl.REPLServer`. Durante su ejecución, las instancias de `repl.REPLServer` aceptarán líneas individuales de inputs de usuarios, de acuerdo con una función de evaluación definida por los usuarios, y luego emitirán sus resultados como outputs. Input y output pueden ser de `stdin` y `stdout`, respectivamente, o pueden estar conectados a cualquier [stream](stream.html) de Node.js.

Las instancias de `repl.REPLServer` soportan el auto-completado de los inputs, la edición de líneas de estilo Emacs sencilla, inputs multi-líneas, outputs de estilo ANSI, el guardado y recuperación del estado actual de la sesión de REPL, la recuperación de errores, y funciones de evaluación personalizables.

### Comandos y Teclas Especiales

Los siguientes comandos especiales son soportados por todas las instancias de REPL:

* `.break` - Durante el proceso de entrada de una expresión multi-línea, la introducción del comando `.break` (o la presión de la combinación de teclas `<ctrl>-C`) abortará el ingreso de un input adicional y el procesamiento de dicha expresión.
* `.clear` - Restablece `context` de REPL a un objeto vacío y limpia cualquier expresión multi-línea que esté siendo introducida en ese momento.
* `.exit` - Cierra el stream I/O, ocasionando la salida de REPL.
* `.help` - Muestra esta lista de comandos especiales.
* `.save` -Guarda la sesión de REPL actual en un archivo: `> .save ./file/to/save.js`
* `.load` - Carga un archivo en la sesión de REPL actual. `> .load ./file/to/load.js`
* `.editor` - Entra en el modo de edición (`<ctrl>-D` para finalizar, `<ctrl>-C` para cancelar)

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

Las siguientes combinaciones de teclas en el REPL tendrán estos efectos especiales:

* `<ctrl>-C` - Cuando se presiona una vez, tiene el mismo efecto que el comando `.break`. Cuando se presiona dos veces en una línea en blanco, tiene el mismo efecto que el comando `.exit`.
* `<ctrl>-D` - Tiene el mismo efecto que el comando `.exit`.
* `<tab>` - Cuando se presiona en una línea en blanco, muestra las variables global y local(ámbito). Cuando se presiona mientras se está ingresando otro input, muestra opciones de auto-completado relevantes.

### Evaluación Predeterminada

Por defecto, todas las instancias de `repl.REPLServer` utilizan una función de evaluación que evalúa las expresiones de JavaScript y proporciona acceso a los módulos integrados de Node.js. Este comportamiento predeterminado puede ser anulado al pasar una función de evaluación alternativa cuando sea creada la instancia de `repl.REPLServer`.

#### Expresiones de JavaScript

El evaluador predeterminado soporta la evaluación directa de las expresiones de JavaScript:

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

#### Ámbitos Global y Local

El evaluador predeterminado proporciona acceso a las variables que existan en el ámbito global. Es posible exponer explícitamente una variable al REPL asignándola al objeto de `context` asociado a cada `REPLServer`. For example:

```js
const repl = require('repl');
const msg = 'message';

repl.start('> ').context.m = msg;
```

Las propiedades en el objeto de `context` aparecen como locales dentro del REPL:

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

#### Acceso a los Módulos Principales de Node.js

El evaluador predeterminado cargará automáticamente los módulos principales de Node.js en el ambiente de REPL cuando sea usado. Por ejemplo, a menos que sea declarado como una variable global o con ámbito, el input `fs` será evaluado como `global.fs = require('fs')` cuando se requiera.

<!-- eslint-skip -->

```js
> fs.createReadStream('./some/file');
```

#### Asignación de la variable `_` (guión bajo)

El evaluador por defecto asignará, de manera predeterminada, el resultado de la última expresión evaluada a la variable especial `_` (guión bajo). Explícitamente configurar `_` a algún valor deshabilitará este comportamiento.

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

### Funciones de Evaluación Personalizadas

Cuando sea creado un nuevo `repl.REPLServer`, una función de evaluación personalizada puede ser provista. Esto puede utilizarse, por ejemplo, para implementar aplicaciones REPL completamente personalizadas.

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

#### Errores Recuperables

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

De manera predeterminada, las instancias de `repl.REPLServer` dan formato al output utilizando el método [`util.inspect()`][] antes de escribirlo al stream Escribible provisto (`process.stdout`, por defecto). La opción booleana `useColors` puede especificarse en la construcción, para ordenarle al escritor predeterminado que utilice códigos de estilo ANSI para dar color al output del método `util.inspect()`.

Es posible personalizar completamente la salida de una instancia de `repl.REPLServer`, al pasarle una nueva función utilizando la opción `writer` en la construcción. El siguiente ejemplo ilustra la conversión del texto de entrada a mayúsculas:

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

Esto puede utilizarse principalmente para re-inicializar el contexto del REPL a un estado pre-definido, como se ilustra en el siguiente ejemplo sencillo:

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

El método `replServer.defineCommand()` es utilizado para añadir nuevos comandos con el prefijo `.` a la instancia del REPL. Estos comandos son invocados al escribir `.` seguido por la `keyword`. El `cmd` es una Función o un objeto con las siguientes propiedades:

* `help` {string} Texto de ayuda a mostrarse cuando se ingresa `.help` (Opcional).
* `action` {Function} La función a ejecutar, aceptando opcionalmente un solo argumento de string.

El siguiente ejemplo muestra dos nuevos comandos añadidos a la instancia del REPL:

```js
const repl = require('repl');

const replServer = repl.start({ prompt: '> ' });
replServer.defineCommand('sayhello', {
  help: 'Say hello',
  action(name) {
    this.bufferedCommand = '';
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

## repl.start([options])

<!-- YAML
added: v0.1.91
changes:

  - version: v5.8.0
    pr-url: https://github.com/nodejs/node/pull/5388
    description: The `options` parameter is optional now.
-->

* `options` {Objeto|string} 
  * `prompt` {string} El prompt del input a mostrar. **Default:** `>`. (with a trailing space).
  * `input` {stream.Readable} The Readable stream from which REPL input will be read. **Predeterminado:** `process.stdin`.
  * `output` {stream.Writable} El stream escribible en el cual será escrito el output del REPL. **Predeterminado:** `process.stdout`.
  * `terminal` {boolean} Si es `true`, especifica que el `output` debería ser tratado como un terminal de TTY, y le deben ser escritos códigos de escape de ANSI/VT100. **Default:** checking the value of the `isTTY` property on the `output` stream upon instantiation.
  * `eval` {Function} La función que ha de utilizarse al evaluar cada línea de input dada. **Default:** an async wrapper for the JavaScript `eval()` function. Una función `eval` puede producir un error con `repl.Recoverable` para indicar que la entrada fue incompleta y solicitar líneas adicionales al usuario.
  * `useColors` {boolean} Si es `true`, especifica que la función `writer` predeterminada debería incluir el estilo de color ANSI para el output del REPL. Si una función `writer` personalizada es provista, esto no tendrá ningún efecto. **Default:** the REPL instances `terminal` value.
  * `useGlobal` {boolean} Si es `true`, especifica que la función de evaluación predeterminada utilizará la `global` de JavaScript como el contexto, en lugar de crear un nuevo contexto separado para la instancia del REPL. The node CLI REPL sets this value to `true`. **Default:**`false`.
  * `ignoreUndefined` {boolean} Si es `true`, especifica que el escritor predeterminado no emitirá en el output el valor de retorno de un comando si este evalúa en `undefined`. **Default:**`false`.
  * `writer` {Function} La función a ser invocada para dar formato al output de cada comando antes de escribir al `output`. **Predeterminado:** [`util.inspect()`][].
  * `completer` {Function} Una función opcional utilizada para el auto-completado de Tab personalizado. Vea [`readline.InterfaceCompleter`][] para un ejemplo.
  * `replMode` {symbol} A flag that specifies whether the default evaluator executes all JavaScript commands in strict mode or default (sloppy) mode. Son valores aceptables: 
    * `repl.REPL_MODE_SLOPPY` - evalúa expresiones en modo descuidado (sloppy).
    * `repl.REPL_MODE_STRICT` - evalúa expresiones en modo estricto. Esto es equivalente a anteceder cada declaración del repl con `'use strict'`.
    * `repl.REPL_MODE_MAGIC` - This value is **deprecated**, since enhanced spec compliance in V8 has rendered magic mode unnecessary. It is now equivalent to `repl.REPL_MODE_SLOPPY` (documented above).
  * `breakEvalOnSigint` - Detener la evaluación de la porción de código actual cuando `SIGINT` sea recibida, es decir, cuando `Ctrl+C` sea presionada. Esto no puede utilizarse conjuntamente con una función `eval` personalizada. **Default:**`false`.

El método `repl.start()` crea e inicia una instancia de `repl.REPLServer`.

Si `options` es una string, entonces especifica el prompt del input:

```js
const repl = require('repl');

// un prompt estilo Unix
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

### Opciones de Variables de Ambiente

Varios comportamientos del REPL de Node.js pueden ser personalizados mediante el uso de las siguientes variables de ambiente:

* `NODE_REPL_HISTORY` - Cuando sea proporcionada una ruta válida, se guardará el historial persistente del REPL en el archivo especificado, en lugar de en el `.node_repl_history` dentro de la carpeta de usuario del usuario actual. Establecer este valor en `''` deshabilitará el historial persistente del REPL. El espacio en blanco será recortado del valor.
* `NODE_REPL_HISTORY_SIZE` - Controls how many lines of history will be persisted if history is available. Debe ser un número positivo. **Default:** `1000`.
* `NODE_REPL_MODE` - Puede ser `sloppy`, `strict`, o `magic`. `magic` is **deprecated** and treated as an alias of `sloppy`. **Default:** `sloppy`, which will allow non-strict mode code to be run.

### Historial Persistente

Por defecto, el REPL de Node.js almacenará de manera persistente el historial de las sesiones `node` de REPL, salvando los inputs en un archivo `.node_repl_history` ubicado en la carpeta de usuario del usuario actual. This can be disabled by setting the environment variable `NODE_REPL_HISTORY=""`.

#### NODE_REPL_HISTORY_FILE

<!-- YAML
added: v2.0.0
deprecated: v3.0.0
-->

> Estabilidad: 0 - Desaprobado: Utilice `NODE_REPL_HISTORY` en su lugar.

Anteriormente, el historial del REPL en las versiones v2.x de Node.js e io.js era controlado mediante el uso de una variable de entorno `NODE_REPL_HISTORY_FILE`, y dicho historial era almacenado en formato JSON. Esta variable ha sido desaprobada, y el viejo archivo JSON del historial de REPL será convertido automáticamente a un formato de texto sencillo simplificado. Este nuevo archivo será guardado en la carpeta de usuario del usuario actual o en un directorio definido por la variable `NODE_REPL_HISTORY`, tal como se documenta en las [Opciones de Variable de Entorno](#repl_environment_variable_options).

### Utilización del REPL de Node.js con editores de línea avanzados

Para utilizar editores de línea avanzados, inicie Node.js con la variable de entorno `NODE_NO_READLINE=1`. This will start the main and debugger REPL in canonical terminal settings, which will allow use with `rlwrap`.

Por ejemplo, el siguiente código puede ser añadido al archivo `.bashrc`:

```text
alias node="env NODE_NO_READLINE=1 rlwrap node"
```

### Inicio de múltiples instancias de REPL, en lugar del inicio de una instancia única

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

Para un ejemplo de la ejecución de un REPL con "funcionalidad completa" (`terminal`) sobre una instancia de `net.Server` y `net.Socket`, vea: https://gist.github.com/2209310

For an example of running a REPL instance over [curl(1)](https://curl.haxx.se/docs/manpage.html), see: https://gist.github.com/2053342