# Consola

<!--introduced_in=v0.10.13-->

> Estability: 2 - Estable

The `console` module provides a simple debugging console that is similar to the JavaScript console mechanism provided by web browsers.

El módulo exporta dos componentes específicos:

* A `Console` class with methods such as `console.log()`, `console.error()` and `console.warn()` that can be used to write to any Node.js stream.
* A global `console` instance configured to write to [`process.stdout`][] and [`process.stderr`][]. The global `console` can be used without calling `require('console')`.

***Warning***: The global console object's methods are neither consistently synchronous like the browser APIs they resemble, nor are they consistently asynchronous like all other Node.js streams. See the [note on process I/O](process.html#process_a_note_on_process_i_o) for more information.

Ejemplo usando la `console` global:

```js
console.log('hola mundo');
// Prints: hola mundo, to stdout
console.log('hola %s', 'mundo');
// Prints: hola mundo, a stdout
console.error(new Error('Whoops, algo malo pasó'));
// Prints: [Error: Whoops, algo malo pasó], a stderr

const name = 'Will Robinson';
console.warn(`Peligro ${name}! Danger!`);
// Imprime: Danger Will Robinson! Peligro!, a stderr
```

Ejemplo utilizando la clase `Console`:

```js
const out = getStreamSomehow();
const err = getStreamSomehow();
const myConsole = new console.Console(out, err);

myConsole.log('hola mundo');
// Prints: hola mundo, to out
myConsole.log('hola %s', 'mundo');
// Prints: hola mundo, to out
myConsole.error(new Error('Whoops, algo malo pasó'));
// Prints: [Error: Whoops, algo malo pasó], to err

const name = 'Will Robinson';
myConsole.warn(`Peligro ${name}! Peligro!`);
// Prints: ¡Peligro Will Robinson! Peligro!, to err
```

## Class: Consola

<!-- YAML
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/9744
    description: Errors that occur while writing to the underlying streams
                 will now be ignored.
-->

<!--type=class-->

The `Console` class can be used to create a simple logger with configurable output streams and can be accessed using either `require('console').Console` or `console.Console` (or their destructured counterparts):

```js
const { Console } = require('console');
```

```js
const { Console } = console;
```

### new Console(stdout[, stderr])

* `stdout` {stream.Writable}
* `stderr` {stream.Writable}

Crea una nueva `Console` con una o dos instancias de secuencia grabables. `stdout` is a writable stream to print log or info output. `stderr` is used for warning or error output. Si no se proporciona `stderr`, se utiliza `stdout` para `stderr`.

```js
const output = fs.createWriteStream('./stdout.log');
const errorOutput = fs.createWriteStream('./stderr.log');
// logger simple personalizado
const logger = new Console(output, errorOutput);
// usarlo como console
const count = 5;
logger.log('count: %d', count);
// en stdout.log: count 5
```

The global `console` is a special `Console` whose output is sent to [`process.stdout`][] and [`process.stderr`][]. Es equivalente a llamar:

```js
new Console(process.stdout, process.stderr);
```

### console.assert(value\[, message\]\[, ...args\])

<!-- YAML
added: v0.1.101
-->

* `value` {any}
* `message` {any}
* `...args` {any}

Una simple prueba de afirmación que verifica si el `valor` es verdadero. If it is not, an `AssertionError` is thrown. If provided, the error `message` is formatted using [`util.format()`][] and used as the error message.

```js
console.assert(true, 'does nothing');
// OK
console.assert(false, 'Whoops %s', 'didn\'t work');
// AssertionError: Whoops didn't work
```

*Note*: The `console.assert()` method is implemented differently in Node.js than the `console.assert()` method [available in browsers](https://developer.mozilla.org/en-US/docs/Web/API/console/assert).

Specifically, in browsers, calling `console.assert()` with a falsy assertion will cause the `message` to be printed to the console without interrupting execution of subsequent code. In Node.js, however, a falsy assertion will cause an `AssertionError` to be thrown.

Functionality approximating that implemented by browsers can be implemented by extending Node.js' `console` and overriding the `console.assert()` method.

In the following example, a simple module is created that extends and overrides the default behavior of `console` in Node.js.

```js
'use strict';

// Crea una simple extensión de la consola con una
// new impl para assert sin monkey-patching.
const myConsole = Object.create(console, {
  assert: {
    value: function assert(assertion, message, ...args) {
      try {
        console.assert(assertion, message, ...args);
      } catch (err) {
        console.error(err.stack);
      }
    },
    configurable: true,
    enumerable: true,
    writable: true,
  },
});

module.exports = myConsole;
```

Esto puede ser usado como un reemplazo directo para la consola integrada:

```js
const console = require('./myConsole');
console.assert(false, 'este mensaje se imprimirá, pero no se producirá ningún error');
console.log('esto también imprimirá');
```

### console.clear()<!-- YAML
added: v8.3.0
-->When 

`stdout` is a TTY, calling `console.clear()` will attempt to clear the TTY. Cuando el `stdout` no es un TTY, este método no hace nada.

*Note*: The specific operation of `console.clear()` can vary across operating systems and terminal types. For most Linux operating systems, `console.clear()` operates similarly to the `clear` shell command. On Windows, `console.clear()` will clear only the output in the current terminal viewport for the Node.js binary.

### console.count([label])

<!-- YAML
added: v8.3.0
-->

* `label` {string} La etiqueta de visualización para el contador. **Default:** `'default'`.

Maintains an internal counter specific to `label` and outputs to `stdout` the number of times `console.count()` has been called with the given `label`.

```js
> console.count()
default: 1
undefined
> console.count('default')
default: 2
undefined
> console.count('abc')
abc: 1
undefined
> console.count('xyz')
xyz: 1
undefined
> console.count('abc')
abc: 2
undefined
> console.count()
default: 3
undefined
>
```

### console.countReset([label='default'])

<!-- YAML
added: v8.3.0
-->

* `label` {string} La etiqueta de visualización para el contador. **Default:** `'default'`.

Restablece el contador interno específico de la `identificación`.

```js
> console.count('abc');
abc: 1
undefined
> console.countReset('abc');
undefined
> console.count('abc');
abc: 1
undefined
>
```

### console.debug(data[, ...args])<!-- YAML
added: v8.0.0
changes:

  - version: v8.10.0
    pr-url: https://github.com/nodejs/node/pull/17033
    description: "`console.debug` is now an alias for `console.log`."
-->

* `data` {any}
* `...args` {any}

La función `console.debug()` es un alias para [`console.log()`][].

### console.dir(obj[, options])<!-- YAML
added: v0.1.101
-->

* `obj` {any}

* `options` {Object}
  
  * `showHidden` {boolean} If `true` then the object's non-enumerable and symbol properties will be shown too. **Default:** `false`.
  * `depth` {number} Tells [`util.inspect()`][] how many times to recurse while formatting the object. Esto es útil para inspeccionar objetos grandes y complicados. Para hacer que se repita indefinidamente, pase `null`. **Default:** `2`.
  * `colors` {boolean} If `true`, then the output will be styled with ANSI color codes. Colors are customizable; see [customizing `util.inspect()` colors][]. **Default:**`false`.

Utiliza [`util.inspect()`][] en el `obj` e imprime la cadena resultante en `stdout`. Esta función evita cualquier función personalizada `inspect()` definida en `obj`.

### console.error(\[data\]\[, ...args\])<!-- YAML
added: v0.1.100
-->

* `data` {any}

* `...args` {any}

Imprime a `stderr` con newline. Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values similar to printf(3) (the arguments are all passed to [`util.format()`][]).

```js
const code = 5;
console.error('error #%d', code);
// Prints: error #5, to stderr
console.error('error', code);
// Prints: error 5, to stderr
```

If formatting elements (e.g. `%d`) are not found in the first string then [`util.inspect()`][] is called on each argument and the resulting string values are concatenated. Ver [`util.format()`][] para más información.

### console.group([...label])<!-- YAML
added: v8.5.0
-->

* `...label` {any}

Aumenta la sangría de las líneas siguientes en dos espacios.

If one or more `label`s are provided, those are printed first without the additional indentation.

### console.groupCollapsed()<!-- YAML
  added: v8.5.0
-->An alias for [

`console.group()`][].

### console.groupEnd()<!-- YAML
added: v8.5.0
-->Decreases indentation of subsequent lines by two spaces.

### console.info(\[data\]\[, ...args\])<!-- YAML
added: v0.1.100
-->

* `data` {any}

* `...args` {any}

La función `console.info()` es un alias para [`console.log()`][].

### console.log(\[data\]\[, ...args\])<!-- YAML
added: v0.1.100
-->

* `data` {any}

* `...args` {any}

Imprime a `stdout` con newline. Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values similar to printf(3) (the arguments are all passed to [`util.format()`][]).

```js
const count = 5;
console.log('count: %d', count);
// Prints: count: 5, to stdout
console.log('count:', count);
// Prints: count: 5, to stdout
```

Ver [`util.format()`][] para más información.

### console.time(label)<!-- YAML
added: v0.1.104
-->

* `label` {string}

Inicia un temporizador que puede utilizarse para calcular la duración de una operación. Timers are identified by a unique `label`. Use the same `label` when calling [`console.timeEnd()`][] to stop the timer and output the elapsed time in milliseconds to `stdout`. Las duraciones del temporizador son precisas en menos de un milisegundo.

### console.timeEnd(label)<!-- YAML
added: v0.1.104
changes:

  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5901
    description: This method no longer supports multiple calls that don’t map
                 to individual `console.time()` calls; see below for details.
-->

* `label` {string}

Stops a timer that was previously started by calling [`console.time()`][] and prints the result to `stdout`:

```js
console.time('100-elements');
for (let i = 0; i < 100; i++) {}
console.timeEnd('100-elements');
// prints 100-elements: 225.438ms
```

*Note*: As of Node.js v6.0.0, `console.timeEnd()` deletes the timer to avoid leaking it. En las versiones anteriores, el temporizador persistió. This allowed `console.timeEnd()` to be called multiple times for the same label. This functionality was unintended and is no longer supported.

### console.trace(\[message\]\[, ...args\])<!-- YAML
added: v0.1.104
-->

* `message` {any}

* `...args` {any}

Prints to `stderr` the string `'Trace :'`, followed by the [`util.format()`][] formatted message and stack trace to the current position in the code.

```js
console.trace('Muéstrame');
// Prints: (el trazado de la pila variará en función de dónde se llame el trazado)
//  Trace: Muéstrame
//    at repl:2:9
//    at REPLServer.defaultEval (repl.js:248:27)
//    at bound (domain.js:287:14)
//    at REPLServer.runBound [as eval] (domain.js:300:12)
//    at REPLServer.<anonymous> (repl.js:412:12)
//    at emitOne (events.js:82:20)
//    at REPLServer.emit (events.js:169:7)
//    at REPLServer.Interface._onLine (readline.js:210:10)
//    at REPLServer.Interface._line (readline.js:549:8)
//    at REPLServer.Interface._ttyWrite (readline.js:826:14)
```

### console.warn(\[data\]\[, ...args\])<!-- YAML
added: v0.1.100
-->

* `data` {any}

* `...args` {any}

La función `console.warn()` es un alias para [`console.error()`][].

## Solo métodos del inspector

The following methods are exposed by the V8 engine in the general API but do not display anything unless used in conjunction with the [inspector](debugger.html) (`--inspect` flag).

### console.dirxml(object)<!-- YAML
added: v8.0.0
-->

* `object` {string}

Este método no muestra nada a menos que se use en el inspector. The `console.dirxml()` method displays in `stdout` an XML interactive tree representation of the descendants of the specified `object` if possible, or the JavaScript representation if not. Calling `console.dirxml()` on an HTML or XML element is equivalent to calling `console.log()`.

### console.markTimeline(label)<!-- YAML
added: v8.0.0
-->

* `label` {string} Defaults to `'default'`.

Este método no muestra nada a menos que se use en el inspector. The `console.markTimeline()` method is the deprecated form of [`console.timeStamp()`][].

### console.profile([label])<!-- YAML
added: v8.0.0
-->

* `label` {string}

Este método no muestra nada a menos que se use en el inspector. The `console.profile()` method starts a JavaScript CPU profile with an optional label until [`console.profileEnd()`][] is called. The profile is then added to the **Profile** panel of the inspector.

```js
console.profile ('MyLabel');
// Cierto código
console.profileEnd();
// Agrega el perfil 'MyLabel' al panel Perfiles del inspector.
```

### console.profileEnd()

<!-- YAML
added: v8.0.0
--> Este método no muestra nada a menos que se use en el inspector. Stops the current JavaScript CPU profiling session if one has been started and prints the report to the 

**Profiles** panel of the inspector. See [`console.profile()`][] for an example.

### console.table(array[, columns])

<!-- YAML
added: v8.0.0
-->

* `array` {Array|Object}
* `columns` {Array}

Este método no muestra nada a menos que se use en el inspector. Prints to `stdout` the array `array` formatted as a table.

### console.timeStamp([label])

<!-- YAML
added: v8.0.0
-->

* `label` {string}

Este método no muestra nada a menos que se use en el inspector. The `console.timeStamp()` method adds an event with the label `label` to the **Timeline** panel of the inspector.

### console.timeline([label])

<!-- YAML
added: v8.0.0
-->

* `label` {string} Defaults to `'default'`.

Este método no muestra nada a menos que se use en el inspector. The `console.timeline()` method is the deprecated form of [`console.time()`][].

### console.timelineEnd([label])

<!-- YAML
added: v8.0.0
-->

* `label` {string} Defaults to `'default'`.

Este método no muestra nada a menos que se use en el inspector. The `console.timelineEnd()` method is the deprecated form of [`console.timeEnd()`][].