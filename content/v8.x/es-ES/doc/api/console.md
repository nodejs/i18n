# Consola

<!--introduced_in=v0.10.13-->

> Estability: 2 - Estable

El módulo de `console` proporciona una consola de depuración simple que es similar al mecanismo de consola JavaScript proporcionado por los navegadores web.

El módulo exporta dos componentes específicos:

* Una clase de `console` con métodos como `console.log()`, `console.error()` y `console.warn()` que pueden utilizarse para escribir en cualquier secuencia Node.js.
* Una instancia de `console` global configurada para escribir en [`process.stdout`][] y [`process.stderr`][]. La `console` global puede ser utilizada sin necesidad de llamar `require('console')`.

***Warning***: The global console object's methods are neither consistently synchronous like the browser APIs they resemble, nor are they consistently asynchronous like all other Node.js streams. Consulte la [nota sobre I/O](process.html#process_a_note_on_process_i_o) de proceso para obtener más información.

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

La clase `Console` se puede utilizar para crear un registrador simple con flujos de salida configurables y se puede acceder a ella utilizando `require('console').Console` o `console.Console` (o sus contrapartes desestructuradas):

```js
const { Console } = require('console');
```

```js
const { Console } = console;
```

### new Console(stdout[, stderr])
* `stdout` {stream.Writable}
* `stderr` {stream.Writable}

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
-->Cuando `stdout` es un TTY, llamando a `console.clear()` intentará borrar el TTY. Cuando `stdout` no es un TTY, este método no hace nada.

*Nota*: El funcionamiento específico de `console.clear()` puede variar según el sistema operativo y el tipo de terminal. Para la mayoría de los sistemas operativos Linux, `console.clear()` funciona de manera similar al comando de shell `borrar`. En Windows, `console.clear()` borrará solo la salida en la ventana del terminal actual para Node.js binario.

### console.count([label])
<!-- YAML
added: v8.3.0
-->

* `label` {string} La etiqueta de visualización para el contador. **Default:** `'default'`.

Mantiene un contador interno específico para la etiqueta `label` y las salidas a `stdout` número de veces que se ha llamado a `console.count()` con la etiqueta `label`.
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

Restablece el contador interno específico de la `etiqueta`.
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
-->* `data` {any}
* `...args` {any}

La función `console.debug()` es un alias para [`console.log()`][].

### console.dir(obj[, options])<!-- YAML
added: v0.1.101
-->* `obj` {any}
* `opciones` {Object}
  * `showHidden` {boolean} If `true` luego el objeto no enumerable y símbolo las propiedades se mostrarán también. **Predeterminado:** `false`.
  * `depth` {number} Indica [`util.inspect()`][] cuántas veces se repite mientras formatear el objeto. This is useful for inspecting large complicated objects. Para hacer que se repita indefinidamente, pase `null`. **Default:** `2`.
  * `colors` {boolean} Si `true`, la salida se diseñará con el color ANSI   códigos. Los colores son personalizables;   ver [customizing` util.inspect()` colors][]. **Predeterminado:** `false`.

Utiliza [`util.inspect()`][] en `obj` e imprime la cadena resultante en `stdout`. Esta función omite cualquier función personalizada `inspeccionar()` definida en `obj`.

### console.error(\[data\]\[, ...args\])<!-- YAML
added: v0.1.100
-->* `data` {any}
* `...args` {any}

Imprime en `stderr` con nueva línea. Se pueden pasar múltiples argumentos, con el primero utilizado como el mensaje principal y todos los adicionales utilizados como sustitución valores similares a printf (3) (todos los argumentos se pasan a [`util.format()`][]).

```js
const code = 5;
console.error('error #%d', code);
// Prints: error #5, to stderr
console.error('error', code);
// Prints: error 5, to stderr
```

Si los elementos de formato (por ejemplo,`%d`) no se encuentran en la primera cadena, entonces [`util.inspect()`][] se llama en cada argumento y la cadena resultante los valores están concatenados. Vea [`util.format()`][] para más información.

### console.group([...label])<!-- YAML
added: v8.5.0
-->* `...label` {any}

Aumenta la sangría de las líneas siguientes en dos espacios.

Si se proporcionan una o más `etiquetas`, éstas se imprimen primero sin el indentación adicional.

### console.groupCollapsed()<!-- YAML
  added: v8.5.0
-->Un alias para [`console.group()`][].

### console.groupEnd()<!-- YAML
added: v8.5.0
-->Reduce la sangría de las líneas siguientes por dos espacios.

### console.info(\[data\]\[, ...args\])<!-- YAML
added: v0.1.100
-->* `data` {any}
* `...args` {any}

La `console.info()` función es un alias para [`console.log()`][].

### console.log(\[data\]\[, ...args\])<!-- YAML
added: v0.1.100
-->* `data` {any}
* `...args` {any}

Imprime a `stdout` con nueva línea. Se pueden pasar múltiples argumentos, con el primero utilizado como el mensaje principal y todos los adicionales utilizados como sustitución valores similares a printf (3) (todos los argumentos se pasan a [`util.format()`][]).

```js
const count = 5;
console.log('count: %d', count);
// Prints: count: 5, to stdout
console.log('count:', count);
// Prints: count: 5, to stdout
```

Vea [`util.format()`][] para más información.

### console.time(label)<!-- YAML
added: v0.1.104
-->* `label` {string}

Inicia un temporizador que se puede usar para calcular la duración de una operación. Temporizadores se identifican por una `etiqueta` única. Use la misma `etiqueta` cuando llame [`console.timeEnd()`][] para detener el temporizador y generar el tiempo transcurrido en milisegundos a `stdout`. Las duraciones del temporizador son precisas hasta en milisegundos.

### console.timeEnd(label)<!-- YAML
added: v0.1.104
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5901
    description: This method no longer supports multiple calls that don’t map
                 to individual `console.time()` calls; see below for details.
-->* `label` {string}

Detiene un temporizador que se inició anteriormente llamando a [`console.time()`][] y imprime el resultado a `stdout`:

```js
console.time('100-elements');
for (let i = 0; i < 100; i++) {}
console.timeEnd('100-elements');
// prints 100-elements: 225.438ms
```

*Nota*: A partir de Node.js v6.0.0.0, `console.timeEnd()` elimina el temporizador para evitar fugas. En las versiones anteriores, el temporizador persistió. Esto permitió que `console.timeEnd()` fuera llamado varias veces para la misma identificación. Esta funcionalidad no fue intencionada y ya no es compatible.

### console.trace(\[message\]\[, ...args\])<!-- YAML
added: v0.1.104
-->* `message` {any}
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

### console.warn(\[data\]\[, ...args\])<!-- YAML
added: v0.1.100
-->* `data` {any}
* `...args` {any}

La `console.warn()` función es un alias para [`console.error()`][].

## Solo métodos del inspector
Los siguientes métodos están expuestos por el motor V8 en la API general, pero lo hacen no mostrar nada a menos que se use junto con el [inspector](debugger.html) (`--inspeccionar` flag).

### console.dirxml(object)<!-- YAML
added: v8.0.0
-->* `object` {string}

Este método no muestra nada a menos que se use en el inspector. The `console.dirxml()` method displays in `stdout` an XML interactive tree representation of the descendants of the specified `object` if possible, or the JavaScript representation if not. Calling `console.dirxml()` on an HTML or XML element is equivalent to calling `console.log()`.

### console.markTimeline(label)<!-- YAML
added: v8.0.0
-->* `label` {string} Defaults to `'default'`.

Este método no muestra nada a menos que se use en el inspector. The `console.markTimeline()` method is the deprecated form of [`console.timeStamp()`][].

### console.profile([label])<!-- YAML
added: v8.0.0
-->* `identificación` {string}

Este método no muestra nada a menos que se use en el inspector. El método `console.profile()` inicia un perfil de CPU de JavaScript con una opción etiqueta hasta que se llame a [`console.profileEnd()`][]. El perfil se agrega a el panel **Profile** del inspector.
```js
console.profile ('MyLabel');
// Cierto código
console.profileEnd();
// Agrega el perfil 'MyLabel' al panel Perfiles del inspector.
```

### console.profileEnd()
<!-- YAML
added: v8.0.0
-->
Este método no muestra nada a menos que se use en el inspector. Detiene el sesión actual de creación de perfiles de CPU de JavaScript si se ha iniciado una y se imprime el informe al panel **Profiles** del inspector. Vea [`console.profile()`][] para un ejemplo.

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
* `identificación` {string}

Este método no muestra nada a menos que se use en el inspector. The `console.timeStamp()` method adds an event with the label `label` to the **Timeline** panel of the inspector.

### console.timeline([label])
<!-- YAML
added: v8.0.0
-->

* `label` {string} Defaults to `'default'`.

Este método no muestra nada a menos que se use en el inspector. El método `console.timeline()` es la forma obsoleta de [`console.time()`][].

### console.timelineEnd([label])
<!-- YAML
added: v8.0.0
-->
* `label` {string} Defaults to `'default'`.

Este método no muestra nada a menos que se use en el inspector. The `console.timelineEnd()` method is the deprecated form of [`console.timeEnd()`][].
