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
                 will now be ignored by default.
-->

<!--type=class-->

La clase `Console` se puede utilizar para crear un registrador simple con flujos de salida configurables y se puede acceder a ella utilizando `require('console').Console` o `console.Console` (o sus contrapartes desestructuradas):

```js
const { Console } = require('console');
```

```js
const { Console } = console;
```

### new Console(stdout\[, stderr\]\[, ignoreErrors\])
### new Console(options)
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/9744
    description: The `ignoreErrors` option was introduced.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19372
    description: The `Console` constructor now supports an `options` argument,
                 and the `colorMode` option was introduced.
-->

* `opciones` {Object}
  * `stdout` {stream.Writable}
  * `stderr` {stream.Writable}
  * `ignoreErrors` {boolean} Ignore errors when writing to the underlying streams. **Predeterminado:** `true`.
  * `colorMode` {boolean|string} Establezca el soporte de color para esta instancia de `Console`. El ajuste a `true` permite colorear mientras se inspeccionan los valores, configurando `'auto'` hará que el soporte de color dependa del valor de la propiedad `isTTY` y el valor devuelto por `getColorDepth()` en la secuencia respectiva. **Predeterminado:** `'auto'`.

Crea una nueva `Console` con una o dos instancias de secuencia grabables. `stdout` es una secuencia de escritura para imprimir el registro o la salida de información. `stderr` se utiliza para la salida de advertencia o error. Si no se proporciona `stderr`, se utiliza `stdout` para `stderr`.

```js
const output = fs.createWriteStream('./stdout.log');
const errorOutput = fs.createWriteStream('./stderr.log');
// registrador simple personalizado
const logger = new Console({ stdout: output, stderr: errorOutput });
// usar como consola
const count = 5;
logger.log('count: %d', count);
// in stdout.log: count 5
```

La `console` global es una `console` especial cuya salida se envía a [`process.stdout`][] y [`process.stderr`][]. Es equivalente a llamar:

```js
new Console({ stdout: process.stdout, stderr: process.stderr });
```

### console.assert(value[, ...message])
<!-- YAML
added: v0.1.101
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17706
    description: The implementation is now spec compliant and does not throw
                 anymore.
-->
* `value` {any} El valor probado para ser verdad.
* `... mensaje` {any} Todos los argumentos además del `valor` se utilizan como mensaje de error.

Una simple prueba de afirmación que verifica si el `valor` es verdadero. Si no es, `Assertion failed` el loggueado. Si se proporciona, el error de `message` está formateado usando [`util.format()`][] pasando a lo largo de todos los argumentos del mensaje. El resultado es usado como mensaje de error.

```js
console.assert (true, 'does nothing');
// OKAY
console.assert (false, 'Whoops %s work', 'didn\' t');
// Falló la aserción: Whoops no funcionó
```

Llamar a `console.assert()` con una aserción de falsy solo causará el `mensaje` para imprimir en la consola sin interrumpir la ejecución del código subsiguiente.

### console.clear()
<!-- YAML
added: v8.3.0
-->

Cuando el `stdout` es un TTY, al llamar a `console.clear()` se intentará borrar el TTY. Cuando el `stdout` no es un TTY, este método no hace nada.

La operación específica de `console.clear()` puede variar entre los sistemas operativos y tipos de terminales. Para la mayoría de los sistemas operativos Linux, `console.clear()` funciona de forma similar al comando `clear` shell. En Windows, `console.clear()` borrará sólo la salida en la viewport actual del terminal para el binario Node.js.

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

### console.countReset([label])<!-- YAML
added: v8.3.0
-->* `label` {string} La etiqueta de visualización para el contador. **Default:** `'default'`.

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
  - version: v9.3.0
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

### console.dirxml(...data)<!-- YAML
added: v8.0.0
changes:
  - version: v9.3.0
    pr-url: https://github.com/nodejs/node/pull/17152
    description: "`console.dirxml` now calls `console.log` for its arguments."
-->* `...data` {any}

Este método llama a `console.log()` pasándole los argumentos recibidos. Tenga en cuenta que este método no produce ningún formato XML.

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

### console.groupEnd()
<!-- YAML
added: v8.5.0
-->

Reduce la sangría de las líneas siguientes por dos espacios.

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

### console.table(tabularData[, properties])<!-- YAML
added: v10.0.0
-->* `tabularData` {any}
* `properties` {string[]} Alternar propiedades para la construcción de la tabla.

Intenta construir una tabla con las columnas de las propiedades de `tabularData` (o use `propiedades`) y filas de `tabularData` y conéctelo. Retrocede a solo registrando el argumento si no se puede analizar como tabular.

```js
// No se pueden analizar como datos tabulares
console.table(Symbol());
// Symbol()

console.table(undefined);
// undefined

console.table([{ a: 1, b: 'Y' }, { a: 'Z', b: 2 }]);
// ┌─────────┬─────┬─────┐
// │ (index) │  a  │  b  │
// ├─────────┼─────┼─────┤
// │    0    │  1  │ 'Y' │
// │    1    │ 'Z' │  2  │
// └─────────┴─────┴─────┘

console.table([{ a: 1, b: 'Y' }, { a: 'Z', b: 2 }], ['a']);
// ┌─────────┬─────┐
// │ (index) │  a  │
// ├─────────┼─────┤
// │    0    │  1  │
// │    1    │ 'Z' │
// └─────────┴─────┘
```

### console.time([label])<!-- YAML
added: v0.1.104
-->* `label` {string} **Default:** `'default'`

Inicia un temporizador que se puede usar para calcular la duración de una operación. Temporizadores se identifican por una `etiqueta` única. Use la misma `etiqueta` cuando llame [`console.timeEnd()`][] para detener el temporizador y generar el tiempo transcurrido en milisegundos a `stdout`. Las duraciones del temporizador son precisas hasta en milisegundos.

### console.timeEnd([label])<!-- YAML
added: v0.1.104
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5901
    description: This method no longer supports multiple calls that don’t map
                 to individual `console.time()` calls; see below for details.
-->* `label` {string} **Default:** `'default'`

Detiene un temporizador que se inició anteriormente llamando a [`console.time()`][] y imprime el resultado a `stdout`:

```js
console.time('100-elements');
for (let i = 0; i < 100; i++) {}
console.timeEnd('100-elements');
// prints 100-elements: 225.438ms
```

### console.timeLog(\[label\]\[, ...data\])<!-- YAML
added: v10.7.0
-->* `label` {string} **Default:** `'default'`
* `...data` {any}

For a timer that was previously started by calling [`console.time()`][], prints the elapsed time and other `data` arguments to `stdout`:

```js
console.time('process');
const value = expensiveProcess1(); // Returns 42
console.timeLog('process', value);
// Prints "process: 365.227ms 42".
doExpensiveProcess2(value);
console.timeEnd('process');
```

### console.trace(\[message\]\[, ...args\])<!-- YAML
added: v0.1.104
-->* `message` {any}
* `...args` {any}

Imprime en `stderr` la cadena `'Rastreo:'`, seguido por [`formato.util() `][] mensaje formateado y seguimiento de pila a la posición actual en el código.

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

### console.markTimeline([label])<!-- YAML
added: v8.0.0
-->* `label` {string} **Default:** `'default'`

Este método no muestra nada a menos que se use en el inspector. El método `console.markTimeline()` es la forma obsoleta de [`console.timeStamp()`][].

### console.profile([label])<!-- YAML
added: v8.0.0
-->* `label` {string}

Este método no muestra nada a menos que se use en el inspector. El método `console.profile()` inicia un perfil de CPU de JavaScript con una opción etiqueta hasta que se llame a [`console.profileEnd()`][]. El perfil se agrega a el panel **Profile** del inspector.
```js
console.profile('MyLabel');
// Some code
console.profileEnd('MyLabel');
// Adds the profile 'MyLabel' to the Profiles panel of the inspector.
```

### console.profileEnd([label])
<!-- YAML
added: v8.0.0
-->
* `label` {string}

Este método no muestra nada a menos que se use en el inspector. Detiene el sesión actual de creación de perfiles de CPU de JavaScript si se ha iniciado una y se imprime el informe al panel **Profiles** del inspector. Vea [`console.profile()`][] para un ejemplo.

If this method is called without a label, the most recently started profile is stopped.

### console.timeStamp([label])
<!-- YAML
added: v8.0.0
-->
* `label` {string}

Este método no muestra nada a menos que se use en el inspector. The `console.timeStamp()` method adds an event with the label `'label'` to the **Timeline** panel of the inspector.

### console.timeline([label])
<!-- YAML
added: v8.0.0
-->
* `label` {string} **Default:** `'default'`

Este método no muestra nada a menos que se use en el inspector. El método `console.timeline()` es la forma obsoleta de [`console.time()`][].

### console.timelineEnd([label])
<!-- YAML
added: v8.0.0
-->
* `label` {string} **Default:** `'default'`

Este método no muestra nada a menos que se use en el inspector. El método `console.timelineEnd()` es la forma obsoleta de [`console.timeEnd()`][].
