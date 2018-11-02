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

De forma similar, `_error` referirá al último error visto, si hubo alguno. Establecer explícitamente `_error` a algún valor deshabilitará este comportamiento.

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

Cuando un nuevo `repl.REPLServer` es creado, una función de evaluación personalizable puede ser provista. Esta puede ser usada, por ejemplo, para implementar aplicaciones REPL completamente personalizables.

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

### Personalización de la salida REPL

Por defecto, las instancias `repl.REPLServer` formatean la salida usando el método [`util.inspect()`][] antes de escribir la entrada al stream `Writable` provisto (`process.stdout` por defecto). La opción booleana `useColors` puede ser especificada en la construcción para ordenar al escritor predeterminado a utilizar códigos al estilo ANSI para colorear la salida del método `util.inspect()`.

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

La clase `repl.REPLServer` hereda de la clase [`readline.Interface`][]. Las instancias del `repl.REPLServer` son creadas usando el método `repl.start()` y *no deberían* ser creadas directamente utilizando la `nueva` palabra clave de JavaScript.

### Evento: 'exit'

<!-- YAML
added: v0.7.7
-->

El evento `'exit'` es emitido cuando el REPL es cerrado, sea por la introducción del comando `.exit`, el usuario presionando `<ctrl>-C` dos veces para señalar `SIGINT`, o al presionar `<ctrl>-D` para señalar `'fin'` en el stream de entrada. La función oyente de devolución es invocada sin ningún argumento.

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

El evento `'reset'` es emitido cuando el contexto de REPL es reseteado. Esto ocurre siempre que el comando `.clear` es recibido como entrada *a menos* que el REPL esté usando el evaluador predeterminado y la instancia del `repl.REPLServer` haya sido creada con la opción `useGlobal` establecida a `true`. La callback de listeners será llamada con una referencia al objeto del `context` como único argumento.

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

* `keyword` {string} El comando keyword (*sin un* carácter inicial `.`).
* `cmd` {Object|Function} La función a invocar cuando el comando sea procesado.

El método `replServer.defineCommand()` es usado para añadir nuevos comandos `.` prefijados a la instancia REPL. Estos comandos son invocados al escribir un `.` seguido de la`keyword`. El `cmd` es una `Function` o un `Object` con las siguientes propiedades:

* `help` {string} Texto de ayuda que es mostrado cuando `.help` es introducido (Opcional).
* `action` {Function} La función a ejecutar, opcionalmente aceptando un único argumento de string.

El siguiente ejemplo muestra dos nuevos comandos agregados a la instancia REPL:

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
  * `ignoreUndefined` {boolean} Si es `true`, especifica que el escritor predeterminado no generará el valor de retorno de un comando si este evalúa a `undefined`. **Predeterminado:** `false`.
  * `writer` {Function} The function to invoke to format the output of each command before writing to `output`. **Predeterminado:** [`util.inspect()`][].
  * `completer` {Function} Una función opcional usada para la autocompletación personalizada de pestañas. Vea [`readline.InterfaceCompleter`][] para un ejemplo.
  * `replMode` {symbol} Una bandera que especifica si el evaluador predeterminado ejecuta todos los comandos de JavaScript en modo estricto o en modo predeterminado (descuidado). Son valores aceptables: 
    * `repl.REPL_MODE_SLOPPY` - evalúa las expresiones en modo descuidado.
    * `repl.REPL_MODE_STRICT` - evalúa las expresiones en modo estricto. Esto es equivalente a prologar cada declaración repl con `'use strict'`.
  * `breakEvalOnSigint` - Detener la evaluación del actual pedazo de código cuando `SIGINT` es recibido, e.g. cuando `Ctrl+C` es presionado. Esto no puede utilizarse junto a la función personalizada `eval`. **Predeterminado:** `false`.

El método `repl.start()` crea y comienza una instancia del `repl.REPLServer`.

Si `options` es un string, entonces especifica el aviso de entrada:

```js
const repl = require('repl');

// un aviso estilo Unix style
repl.start('$ ');
```

## El REPL de Node.js

En si mismo, Node.Js utiliza el módulo `repl` para proveer su propia interfaz interactiva para ejecutar JavaScript. Esto puede ser usado al ejecutar el binario de Node.Js sin pasar ningún argumento (o al pasar el argumento `-i`):

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

Varios comportamientos del REPL de Node.js pueden ser personalizados utilizando las siguientes variables de entorno:

* `NODE_REPL_HISTORY` - Cuando una ruta válida es dada, la historia persistente del REPL será guardada al archivo especificado en vez de `.node_repl_history` en el directorio hogar del usuario. Establecer este valor a `''` deshabilitará la historia persistente del REPL. El espacio en blanco será recortado del valor.
* `NODE_REPL_HISTORY_SIZE` Controla el número de líneas que persistirán si se dispone de la historia. Debe ser un número positivo. **Predeterminado:** `1000`.
* `NODE_REPL_MODE` - Puede ser tanto el valor `'sloppy'` como el `'strict'`. **Predeterminado:** `'sloppy'`, el cual permitirá que el código en modo no-estricto sea ejecutado.

### Historia Persistente

Por defecto, el REPL de Node.js persistirá en la historia entre el `nodo` de las sesiones REPL al guardar las entradas en el archivo `.node_repl_history` ubicado en el directorio hogar del usuario. Esto puede ser deshabilitado al establecer la variable de entorno `NODE_REPL_HISTORY=''`.

### Usando el REPL de Node.js con editores de líneas avanzados

Para editores de línea avanzados, inicie Node.js con la variable de entorno `NODE_NO_READLINE=1`. Esto iniciará el REPL principal y el depurador en configuraciones canónicas terminales, lo cual permitirá utilizarlos con `rlwrap`.

Por ejemplo, el siguiente código puede ser añadido al archivo `.bashrc`:

```text
alias node="env NODE_NO_READLINE=1 rlwrap node"
```

### Inicializando múltiples instancias en vez de inicializar solamente una

Es posible crear e inicializar múltiples instancias REPL en vez de una sola instancia de Node.js que comparta único objeto `global` pero que tenga diferentes interfaces de entrada y salida.

El siguiente ejemplo provee REPLs separadas en `stdin`, un socket de Linux, y un socket TCP:

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

Por ejemplo al ejecutar una (`terminal`) REPL "con funciones completas" sobre un `net.Server` y una instancia `net.Socket`, véase: <https://gist.github.com/2209310>.

Para un ejemplo de una instancia REPL ejecutándose sobre [curl(1)](https://curl.haxx.se/docs/manpage.html), véase: <https://gist.github.com/2053342>.