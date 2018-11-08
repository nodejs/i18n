# Console

<!--introduced_in=v0.10.13-->

> Stability: 2 - Stable

El módulo de `console` proporciona una consola de depuración simple que es similar al mecanismo de consola JavaScript proporcionado por los navegadores web.

El módulo exporta dos componentes específicos:

* Una clase de `console` con métodos como `console.log()`, `console.error()` y `console.warn()` que pueden utilizarse para escribir en cualquier secuencia Node.js.
* Una instancia de `console` global configurada para escribir en [`process.stdout`][] y [`process.stderr`][]. La `console` global puede ser utilizada sin necesidad de llamar `require('console')`.

***Advertencia***: Los métodos de los objetos de la consola global no son consistentemente sincrónicos como las APIs del navegador a las que se asemejan, ni consistentemente asincrónicos como todas las otras secuencias de Node.js. Consulte la [nota sobre I/O](process.html#process_a_note_on_process_i_o) de proceso para obtener más información.

Ejemplo usando la `console` global:

```js
console.log('hola mundo');
// Prints: hola mundo, to stdout
console.log('hola %s', 'mundo');
// Prints: hola mundo, a stdout
console.error(new Error('Whoops, algo malo pasó'));
// Prints: [Error: Whoops, algo malo pasó], a stderr

const name = 'Will Robinson';
console.warn(`Peligro ${name}! Peligro!`);
// Prints: ¡Peligro Will Robinson! Peligro!, a stderr
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

## Clase: Consola

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

* `stdout` {Writable}
* `stderr` {Writable}

Crea una nueva `Console` con una o dos instancias de secuencia grabables. `stdout` es una secuencia de escritura para imprimir el registro o la salida de información. `stderr` se utiliza para la salida de advertencia o error. Si no se proporciona `stderr`, se utiliza `stdout` para `stderr`.

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

La `console` global es una `console` especial cuya salida se envía a [`process.stdout`][] y [`process.stderr`][]. Es equivalente a llamar:

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

Una simple prueba de afirmación que verifica si el `valor` es verdadero. Si no lo es, se lanza un `AssertionError`. Si se proporciona, el `mensaje` de error se formatea utilizando [`util.format()`][] y se utiliza como mensaje de error.

```js
console.assert(true, 'does nothing');
// OK
console.assert(false, 'Whoops %s', 'didn\'t work');
// AssertionError: Whoops didn't work
```

*Note*: The `console.assert()` method is implemented differently in Node.js than the `console.assert()` method [available in browsers](https://developer.mozilla.org/en-US/docs/Web/API/console/assert).

Específicamente, en los navegadores, llamar `console.assert()` con una aserción falsa hará que el `mensaje` se imprima en la consola sin interrumpir la ejecución del código subsiguiente. En Node.js, sin embargo, una aserción falsa causará que un `AssertionError` sea lanzado.

La funcionalidad que se aproxima a la implementada por los navegadores puede ser implementada extendiendo la `console` de Node.js y anulando el método `console.assert()`.

En el siguiente ejemplo, se crea un módulo simple que se extiende y anula el comportamiento predeterminado de la `console` en Node.js.

<!-- eslint-disable func-name-matching -->

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

### console.clear()

<!-- YAML
added: v8.3.0
-->

Cuando el `stdout` es un TTY, al llamar a `console.clear()` se intentará borrar el TTY. Cuando el `stdout` no es un TTY, este método no hace nada.

*Nota*: El funcionamiento específico de `console.clear()` puede variar según el sistema operativo y el tipo de terminal. Para la mayoría de los sistemas operativos Linux, `console.clear()` funciona de forma similar al comando `clear` shell. En Windows, `console.clear()` borrará sólo la salida en la viewport actual del terminal para el binario Node.js.

### console.count([label])

<!-- YAML
added: v8.3.0
-->

* `identificación` {string} La identificación de la pantalla para el contador. Por defecto es `'default'`.

Mantiene un contador interno específico para la `identificación` y `stdout` a la salida el número de veces que se ha llamado a `console.count()` con la `identificación` dada.

<!-- eslint-skip -->

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

* `identificación` {string} La identificación de la pantalla para el contador. Por defecto es `'default'`.

Restablece el contador interno específico de la `identificación`.

<!-- eslint-skip -->

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

### console.debug(data[, ...args])

<!-- YAML
added: v8.0.0
-->

* `data` {any}
* `...args` {any}

The `console.debug()` function is an alias for [`console.log()`][].

### console.dir(obj[, options])

<!-- YAML
added: v0.1.101
-->

* `obj` {any}
* `options` {Object} 
  * `showHidden` {boolean}
  * `depth` {number}
  * `colors` {boolean}

Uses [`util.inspect()`][] on `obj` and prints the resulting string to `stdout`. This function bypasses any custom `inspect()` function defined on `obj`. An optional `options` object may be passed to alter certain aspects of the formatted string:

* `showHidden` - if `true` then the object's non-enumerable and symbol properties will be shown too. Defaults to `false`.

* `depth` - tells [`util.inspect()`][] how many times to recurse while formatting the object. This is useful for inspecting large complicated objects. Defaults to `2`. To make it recurse indefinitely, pass `null`.

* `colors` - if `true`, then the output will be styled with ANSI color codes. Defaults to `false`. Colors are customizable; see [customizing `util.inspect()` colors][].

### console.error(\[data\]\[, ...args\])

<!-- YAML
added: v0.1.100
-->

* `data` {any}
* `...args` {any}

Prints to `stderr` with newline. Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values similar to printf(3) (the arguments are all passed to [`util.format()`][]).

```js
const code = 5;
console.error('error #%d', code);
// Prints: error #5, to stderr
console.error('error', code);
// Prints: error 5, to stderr
```

If formatting elements (e.g. `%d`) are not found in the first string then [`util.inspect()`][] is called on each argument and the resulting string values are concatenated. See [`util.format()`][] for more information.

### console.group([...label])

<!-- YAML
added: v8.5.0
-->

* `...label` {any}

Increases indentation of subsequent lines by two spaces.

If one or more `label`s are provided, those are printed first without the additional indentation.

### console.groupCollapsed()

<!-- YAML
  added: v8.5.0
-->

An alias for [`console.group()`][].

### console.groupEnd()

<!-- YAML
added: v8.5.0
-->

Decreases indentation of subsequent lines by two spaces.

### console.info(\[data\]\[, ...args\])

<!-- YAML
added: v0.1.100
-->

* `data` {any}
* `...args` {any}

The `console.info()` function is an alias for [`console.log()`][].

### console.log(\[data\]\[, ...args\])

<!-- YAML
added: v0.1.100
-->

* `data` {any}
* `...args` {any}

Prints to `stdout` with newline. Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values similar to printf(3) (the arguments are all passed to [`util.format()`][]).

```js
const count = 5;
console.log('count: %d', count);
// Prints: count: 5, to stdout
console.log('count:', count);
// Prints: count: 5, to stdout
```

See [`util.format()`][] for more information.

### console.time(label)

<!-- YAML
added: v0.1.104
-->

* `label` {string}

Starts a timer that can be used to compute the duration of an operation. Timers are identified by a unique `label`. Use the same `label` when calling [`console.timeEnd()`][] to stop the timer and output the elapsed time in milliseconds to `stdout`. Timer durations are accurate to the sub-millisecond.

### console.timeEnd(label)

<!-- YAML
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

*Note*: As of Node.js v6.0.0, `console.timeEnd()` deletes the timer to avoid leaking it. On older versions, the timer persisted. This allowed `console.timeEnd()` to be called multiple times for the same label. This functionality was unintended and is no longer supported.

### console.trace(\[message\]\[, ...args\])

<!-- YAML
added: v0.1.104
-->

* `message` {any}
* `...args` {any}

Prints to `stderr` the string `'Trace :'`, followed by the [`util.format()`][] formatted message and stack trace to the current position in the code.

```js
console.trace('Show me');
// Prints: (stack trace will vary based on where trace is called)
//  Trace: Show me
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

### console.warn(\[data\]\[, ...args\])

<!-- YAML
added: v0.1.100
-->

* `data` {any}
* `...args` {any}

The `console.warn()` function is an alias for [`console.error()`][].