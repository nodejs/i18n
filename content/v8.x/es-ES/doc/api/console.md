# Consola

<!--introduced_in=v0.10.13-->

> Estabilidad: 2 - Estable

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

La clase `Console` se puede utilizar para crear un registrador simple con flujos de salida configurables y se puede acceder a ella utilizando `require('console').Console` o `console.Console` (o sus contrapartes desestructuradas):

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

*Nota*: El método `console.assert()` se implementa de forma diferente en Node.js que el método `console.assert()` [disponible en los navegadores](https://developer.mozilla.org/en-US/docs/Web/API/console/assert).

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

La función `console.debug()` es un alias para [`console.log()`][].

### console.dir(obj[, options])

<!-- YAML
added: v0.1.101
-->

* `obj` {any}
* `options` {Object} 
  * `showHidden` {boolean}
  * `depth` {number}
  * `colors` {boolean}

Utiliza [`util.inspect()`][] en el `obj` e imprime la cadena resultante en `stdout`. Esta función evita cualquier función personalizada `inspect()` definida en `obj`. Un objeto opcional de `opciones` puede ser pasado para alterar ciertos aspectos de la cadena formateada:

* `showHidden` - si es `true`, también se mostrarán las propiedades no numéricas y de símbolo del objeto. Por defecto es `false`.

* `depth` - indica [`util.inspect()`][] cuántas veces se debe volver a realizar la operación mientras se formatea el objeto. Esto es útil para inspeccionar objetos grandes y complicados. Por defecto es `2`. Para que se devuelva indefinidamente, pass `null`.

* `colors` - si es `true`, entonces la salida será estilizada con códigos de color ANSI. Por defecto es `false`. Los colores se pueden personalizar; véase [customizing `util.inspect()` colors][].

### console.error(\[data\]\[, ...args\])

<!-- YAML
added: v0.1.100
-->

* `data` {any}
* `...args` {any}

Imprime a `stderr` con newline. Se pueden pasar múltiples argumentos, con el primero usado como mensaje primario y todos los adicionales usados como valores de sustitución similares a printf(3) (todos los argumentos se pasan a [`util.format()`][]).

```js
const code = 5;
console.error('error #%d', code);
// Prints: error #5, to stderr
console.error('error', code);
// Prints: error 5, to stderr
```

Si los elementos de formato (por ejemplo, `%d`) no se encuentran en la primera cadena, se llama a [`util.inspect()`][] en cada argumento y los valores de cadena resultantes se concatenan. Ver [`util.format()`][] para más información.

### console.group([...label])

<!-- YAML
added: v8.5.0
-->

* `...label` {any}

Aumenta la sangría de las líneas siguientes en dos espacios.

Si se proporcionan una o más `identificaciones`, éstas se imprimen primero sin la sangría adicional.

### console.groupCollapsed()

<!-- YAML
  added: v8.5.0
-->

Un alias para [`console.group()`][].

### console.groupEnd()

<!-- YAML
added: v8.5.0
-->

Disminuye la sangría de las líneas siguientes en dos espacios.

### console.info(\[data\]\[, ...args\])

<!-- YAML
added: v0.1.100
-->

* `data` {any}
* `...args` {any}

La función `console.info()` es un alias para [`console.log()`][].

### console.log(\[data\]\[, ...args\])

<!-- YAML
added: v0.1.100
-->

* `data` {any}
* `...args` {any}

Imprime a `stdout` con newline. Se pueden pasar múltiples argumentos, con el primero usado como mensaje primario y todos los adicionales usados como valores de sustitución similares a printf(3) (todos los argumentos se pasan a [`util.format()`][]).

```js
const count = 5;
console.log('count: %d', count);
// Prints: count: 5, to stdout
console.log('count:', count);
// Prints: count: 5, to stdout
```

Ver [`util.format()`][] para más información.

### console.time(label)

<!-- YAML
added: v0.1.104
-->

* `identificación` {string}

Inicia un temporizador que puede utilizarse para calcular la duración de una operación. Los temporizadores se identifican mediante una `identificación` única. Utilice la misma `identificación` cuando llame a [`console.timeEnd()`][] para detener el temporizador y enviar el tiempo transcurrido en milisegundos a `stdout`. Las duraciones del temporizador son precisas en menos de un milisegundo.

### console.timeEnd(label)

<!-- YAML
added: v0.1.104
changes:

  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5901
    description: This method no longer supports multiple calls that don’t map
                 to individual `console.time()` calls; see below for details.
-->

* `identificación` {string}

Detiene un temporizador que se inició previamente llamando a [`console.time()`][] e imprime el resultado en `stdout`:

```js
console.time('100-elements');
for (let i = 0; i < 100; i++) {}
console.timeEnd('100-elements');
// prints 100-elements: 225.438ms
```

*Nota*: A partir de Node.js v6.0.0.0, `console.timeEnd()` elimina el temporizador para evitar fugas. En las versiones anteriores, el temporizador persistió. Esto permitió que `console.timeEnd()` fuera llamado varias veces para la misma identificación. Esta funcionalidad no fue intencionada y ya no es compatible.

### console.trace(\[message\]\[, ...args\])

<!-- YAML
added: v0.1.104
-->

* `message` {any}
* `...args` {any}

Imprime a `stderr` la cadena `'Trace:'`, seguida del mensaje formateado [`util.format()`][] y la traza de la pila hasta la posición actual en el código.

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

### console.warn(\[data\]\[, ...args\])

<!-- YAML
added: v0.1.100
-->

* `data` {any}
* `...args` {any}

La función `console.warn()` es un alias para [`console.error()`][].