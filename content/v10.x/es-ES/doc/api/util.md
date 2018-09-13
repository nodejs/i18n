# Util

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

El módulo `util` está diseñado principalmente para apoyar las necesidades de las APIs internas del propio Node.js. Sin embargo, muchas de las utilidades también son útiles para desarrolladores de aplicaciones y módulos. Puede ser accedido usando:

```js
const util = require('util');
```

## util.callbackify(original)

<!-- YAML
added: v8.2.0
-->

* `original` {Function} Una función `async`
* Retorna: {Function} una función de estilo callback

Toma una función `async` (o una función que retorna una `Promise`) y retorna una función siguiendo el estilo de callback error-first, p. ej. tomando un callback `(err, value) => ...` como el último argumento. En el callback, el primer argumento va a ser la razón de rechazo (o `null` si la `Promise` se resolvió), y el segundo argumento va a ser el valor resuelto.

```js
const util = require('util');

async function fn() {
  return 'hello world';
}
const callbackFunction = util.callbackify(fn);

callbackFunction((err, ret) => {
  if (err) throw err;
  console.log(ret);
});
```

Va a estampar:

```txt
hello world
```

El callback es ejecutado asincrónicamente, y va a tener un stack trace limitado. Si el callback arroja, el proceso va a emitir un evento [`'uncaughtException'`][], y si no es gestionado, saldrá.

Ya que `null` tiene un significado especial como el primer argumento para un callback, si una función envuelta rechaza una `Promise` con un valor falso como la razón, el valor es envuelto en un `Error` con el valor original almacenado en un campo llamado `reason`.

```js
function fn() {
  return Promise.reject(null);
}
const callbackFunction = util.callbackify(fn);

callbackFunction((err, ret) => {
  // Cuando la Promise fue rechazada con `null` se envuelve con un Error y
  // el valor original es almacenado en `reason`.
  err && err.hasOwnProperty('reason') && err.reason === null;  // true
});
```

## util.debuglog(section)

<!-- YAML
added: v0.11.3
-->

* `section` {string} Un string identificando la porción de la aplicación para la cual la función `debuglog` está siendo creada.
* Retorna: {Function} La función de registro

El método `util.debuglog()` se usa para crear una función que condicionalmente escribe mensajes de depuración para `stderr` basándose en la existencia de la variable de entorno `NODE_DEBUG`. Si el nombre de la `section` aparece dentro del valor de esa variable de entorno, entonces la función retornada opera similar a [`console.error()`][]. Si no, entonces la función retornada es un no-op.

```js
const util = require('util');
const debuglog = util.debuglog('foo');

debuglog('hello from foo [%d]', 123);
```

Si el programa es ejecutado con `NODE_DEBUG=foo` en el entorno, entonces el resultado va a ser algo como:

```txt
FOO 3245: hello from foo [123]
```

donde `3245` es la identificación del proceso. Si no es ejecutado con ese grupo de variables de entorno, entonces no va a estampar nada.

La `section` también soporta wildcard:

```js
const util = require('util');
const debuglog = util.debuglog('foo-bar');

debuglog('hi there, it\'s foo-bar [%d]', 2333);
```

si es ejecutado con `NODE_DEBUG=foo*` en el entorno, entonces el resultado va a ser algo como:

```txt
FOO-BAR 3257: hola, es foo-bar [2333]
```

Múltiples nombres de `section` separados por coma pueden ser específicados en la variable de entorno `NODE_DEBUG`: `NODE_DEBUG=fs,net,tls`.

## util.deprecate(fn, msg[, code])

<!-- YAML
added: v0.8.0
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/16393
    description: Deprecation warnings are only emitted once for each code.
-->

* `fn` {Function} La función que está siendo desaprobada.
* `msg` {string} Un mensaje de advertencia para mostrar cuando la función desaprobada es invocada.
* `code` {string} Un código de desaprobación. Vea la [lista de APIs desaprobadas](deprecations.html#deprecations_list_of_deprecated_apis) para una lista de códigos.
* Retorna: {Function} La función desaprobada se envolvió para emitir una advertencia.

El método `util.deprecate()` envuelve a `fn` (que puede ser una función o una clase) de tal manera, que es marcado como obsoleto.

```js
const util = require('util');

exports.obsoleteFunction = util.deprecate(() => {
  // Hacer algo aquí.
}, 'obsoleteFunction() está obsoleto. En cambio, use newShinyFunction().');
```

Cuando sea llamada, `util.deprecate()` va a retornar una función que va a emitir una `DeprecationWarning` usando el evento [`'warning'`][]. La advertencia va a ser emitida y estampada a `stderr` la primera vez que la función retornada sea llamada. Después de que la advertencia sea emitida, la función envuelta es llamada sin emitir una advertencia.

Si el mismo `código` opcional es suministrado en múltiples llamadas a `util.deprecate()`, la advertencia va a ser emitida solo una vez por ese `código`.

```js
const util = require('util');

const fn1 = util.deprecate(someFunction, someMessage, 'DEP0001');
const fn2 = util.deprecate(someOtherFunction, someOtherMessage, 'DEP0001');
fn1(); // emite una advertencia de desaprobación con el código DEP0001
fn2(); // no emite una advertencia de desaprobación porque tiene el mismo código
```

Si las banderas de línea de comando `--no-deprecation` o `--nowarnings` son usadas, o si la propiedad `process.noDeprecation` está establecida como `true` *antes* de la primera advertencia de desaprobación, el método `util.deprecate()` no hace nada.

Si las banderas de línea de comando `--trace-deprecation` o `--tracewarnings` están establecidas, o la propiedad `process.traceDeprecation` está establecida como `true`, una advertencia y un stack trace son estampados a `stderr` la primera vez que la función obsoleta sea llamada.

Si la bandera de línea de comando `--throw-deprecation` está establecida, o la propiedad `process.throwDeprecation` está establecida en `true`, entonces una excepción va a ser arrojada cuando la función obsoleta sea llamada.

La bandera de línea de comando `--throw-deprecation` y la propiedad `process.throwDeprecation` toman precedencia sobre `--trace-deprecation` y `process.traceDeprecation`.

## util.format(format[, ...args])

<!-- YAML
added: v0.5.3
changes:

  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14558
    description: The `%o` and `%O` specifiers are supported now.
-->

* 0>format</code> {string} Un formato de string parecido a `printf`.

El método `util.format()` retorna un string con formato usando el primer argumento como un formato parecido a `printf`.

El primer argumento es un string conteniendo cero o más tokens *placeholder*. Cada token placeholder es reemplazado con el valor convertido del argumento correspondiente. Los placeholders soportados son:

* `%s` - `String`.
* `%d` - `Number` (entero o valor de punto flotante).
* `%i` - Entero.
* `%f` - Valor de punto flotante.
* `%j` - JSON. Reemplazado con el string `'[Circular]'` si el argumento contiene referencias circulares.
* `%o` - `Object`. Una representación de string de un objeto con formato de objeto de JavaScript genérico. Similar a `util.inspect()` con opciones `{ showHidden: true, showProxy: true }`. Esto va a mostrar el objeto completo incluyendo propiedades y proxies no enumerables.
* `%O` - `Object`. Una representación de string de un objeto con formato de objeto de JavaScript genérico. Similar a `util.inspect()` sin opciones. Esto va a mostrar el objeto completo no incluyendo propiedades y proxies no enumerables.
* `%%` - signo de porcentaje individual (`'%'`). Esto no consume un argumento.
* Retorna: {string} El string con formato

Si el placeholder no tiene un argumento correspondiente, el placeholder es reemplazado.

```js
util.format('%s:%s', 'foo');
// Retorna: 'foo:%s'
```

Si hay más argumentos pasados al método `util.format()` que el número de placeholders, los argumentos extra son coaccionados en strings, luego cocatenados a la string retornada, cada uno delimitado por un espacio. Argumentos excesivos cuyos `typeof` sea `'object'` o `'symbol'` (excepto `null`), serán transformados por `util.inspect()`.

```js
util.format('%s:%s', 'foo', 'bar', 'baz'); // 'foo:bar baz'
```

Si el primer argumento no es un string, entonces `util.format()` retorna un string que es la concatenación de todos los argumentos separados por espacios. Cada argumento es convertido a un string usando `util.inspect()`.

```js
util.format(1, 2, 3); // '1 2 3'
```

Si solo un argumento es pasado a `util.format()`, este es retornado tal como está, sin ningún formato.

```js
util.format('%% %s'); // '%% %s'
```

Por favor, note que `util.format()` es un método sincrónico que es principalmente concebido como una herramienta de depuración. Algunos valores de entrada pueden tener una significativa recarga de rendimiento que puede bloquear el bucle de eventos. Use esta función con cuidado y nunca en una ruta de código caliente.

## util.formatWithOptions(inspectOptions, format[, ...args])

<!-- YAML
added: v10.0.0
-->

* `inspectOptions` {Object}
* `format` {string}

Esta función es idéntica a [`util.format()`][], excepto en que esta toma un argumento `inspectOptions` que especifica las opciones que son pasadas a [`util.inspect()`][].

```js
util.formatWithOptions({ colors: true }, 'See object %O', { foo: 42 });
// Retorna 'See object { foo: 42 }', donde `42` es coloreado como un número
// cuando es estampado a un terminal.
```

## util.getSystemErrorName(err)

<!-- YAML
added: v9.7.0
-->

* `err` {number}
* Retorna: {string}

Retorna un nombre de string por un código de error numérico que viene de una API de Node.js. El mapeo entre códigos de error y nombres de error es dependiente de la plataforma. Vea [Errores Comunes del Sistema](errors.html#errors_common_system_errors) para los nombres de los errores comunes.

```js
fs.access('file/that/does/not/exist', (err) => {
  const name = util.getSystemErrorName(err.errno);
  console.error(name);  // ENOENT
});
```

## util.inherits(constructor, superConstructor)

<!-- YAML
added: v0.3.0
changes:

  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3455
    description: The `constructor` parameter can refer to an ES6 class now.
-->

El uso de `util.inherits()` está desalentado. Por favor use la `clase` ES6 y `extienda` palabras clave para obtener soporte de herencia de nivel de lenguaje. También note que los dos estilos son [semánticamente incompatibles](https://github.com/nodejs/node/issues/4179).

* `constructor` {Function}
* `superConstructor` {Function}

Herede los métodos prototipo de un [constructor](https://developer.mozilla.org/en-US/JavaScript/Reference/Global_Objects/Object/constructor) a otro. El prototipo del `constructor` se establecerá a un nuevo objeto creado a partir de `superConstructor`.

Como una conveniencia adicional, `superConstructor` va a ser accesible por medio de la propiedad `constructor.super_`.

```js
const util = require('util');
const EventEmitter = require('events');

function MyStream() {
  EventEmitter.call(this);
}

util.inherits(MyStream, EventEmitter);

MyStream.prototype.write = function(data) {
  this.emit('data', data);
};

const stream = new MyStream();

console.log(stream instanceof EventEmitter); // true
console.log(MyStream.super_ === EventEmitter); // true

stream.on('data', (data) => {
  console.log(`Received data: "${data}"`);
});
stream.write('It works!'); // Received data: "It works!"
```

Ejemplo de ES6 usando `class` y `extends`:

```js
const EventEmitter = require('events');

class MyStream extends EventEmitter {
  write(data) {
    this.emit('data', data);
  }
}

const stream = new MyStream();

stream.on('data', (data) => {
  console.log(`Received data: "${data}"`);
});
stream.write('With ES6');
```

## util.inspect(object[, options])

<!-- YAML
added: v0.3.0
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19259
    description: The `WeakMap` and `WeakSet` entries can now be inspected.
  - version: v9.9.0
    pr-url: https://github.com/nodejs/node/pull/17576
    description: The `compact` option is supported now.
  - version: v6.6.0
    pr-url: https://github.com/nodejs/node/pull/8174
    description: Custom inspection functions can now return `this`.
  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/7499
    description: The `breakLength` option is supported now.
  - version: v6.1.0
    pr-url: https://github.com/nodejs/node/pull/6334
    description: The `maxArrayLength` option is supported now; in particular,
                 long arrays are truncated by default.
  - version: v6.1.0
    pr-url: https://github.com/nodejs/node/pull/6465
    description: The `showProxy` option is supported now.
-->

* `object` {any} Cualquier JavaScript primitivo u `Object`.
* `options` {Object}
  
  * `showHidden` {boolean} Si `true`, los símbolos y propiedades no enumerables del `object` van a ser incluidos en el resultado formateado, así como también las entradas [`WeakMap`][] y [`WeakSet`][]. **Default:** `false`.
  * `depth` {number} Especifica el número de veces a repetir mientras se formatea el `object`. Esto es útil para inspeccionar objetos grandes y complicados. Para hacer que se repita indefinidamente pase `null`. **Default:** `2`.
  * `colors` {boolean} Si `true`, el output va a ser diseñado con códigos de colores ANSI. Colores son personalizables, vea [Customizing `util.inspect` colors][]. **Default:** `false`.
  * `customInspect` {boolean} Si `false`, entonces las funciones personalizadas `inspect(depth, opts)` no van a ser llamadas. **Default:** `true`.
  * `showProxy` {boolean} Si `true`, entonces los objetos y funciones que son objetos `Proxy` van a ser analizados para mostrar sus objetos `target` y `handler`. **Default:** `false`. <!--
  TODO(BridgeAR): Deprecate `maxArrayLength` and replace it with
                  `maxEntries`.
  -->
  
  * `maxArrayLength` {number} Especifica el número máximo de elementos de `Array`, [`TypedArray`][], [`WeakMap`][] and [`WeakSet`][] a incluir al formatear. Establecer a `null` o `Infinity` para mostrar todos los elementos. Establecer a `0` o negativo, para no mostrar ningún elemento. **Default:** `100`.
  
  * `breakLength` {number} La extensión a la cual las claves de un objeto son divididas a través de múltiples líneas. Establecer a `Infinity` para formatear un objeto como una sola línea. **Default:** `60` for legacy compatibility.
  * `compact` {boolean} Establecer esto a `false` cambia la sangría predeterminada para usar un salto de línea por cada clave de objeto, en vez de alinear múltiples propiedades en una sola línea. Esto también romperá el texto que está por encima del tamaño `breakLength` en pedazos más pequeños y más fáciles de leer, y endenta objetos igual que las arrays. Note que ningún texto va a ser reducido a por debajo de 16 carácteres, sin importar el tamaño del `breakLength`. Para más información, vea el ejemplo de abajo. **Default:** `true`.

* Retorna: {string} La representación de un objeto pasado

El método `util.inspect()` retorna una representación string del `object` que está destinado a la depuración. El output de `util.inspect` puede cambiar en cualquier momento y no debería de dependerse de él programáticamente. `options` adicionales pueden ser pasadas que alteran ciertos aspectos del string con formato. `util.inspect()` va a usar el nombre del constructor y/o `@@toStringTag` para hacer una etiqueta identificable para un valor inspeccionado.

```js
class Foo {
  get [Symbol.toStringTag]() {
    return 'bar';
  }
}

class Bar {}

const baz = Object.create(null, { [Symbol.toStringTag]: { value: 'foo' } });

util.inspect(new Foo()); // 'Foo [bar] {}'
util.inspect(new Bar()); // 'Bar {}'
util.inspect(baz);       // '[foo] {}'
```

El siguiente ejemplo inspecciona todas las propiedades del objeto `util`:

```js
const util = require('util');

console.log(util.inspect(util, { showHidden: true, depth: null }));
```

Los valores pueden proporcionar sus propias funciones personalizadas `inspect(depth, opts)`, cuando son llamadas estas reciben el `depth` actual en una inspección recursiva, así como también los objetos de opción pasados a `util.inspect()`.

El siguiente ejemplo resalta ladiferencia con la opción `compact`:

```js
const util = require('util');

const o = {
  a: [1, 2, [[
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do ' +
      'eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'test',
    'foo']], 4],
  b: new Map([['za', 1], ['zb', 'test']])
};
console.log(util.inspect(o, { compact: true, depth: 5, breakLength: 80 }));

// Esto va a estampar

// { a:
//   [ 1,
//     2,
//     [ [ 'Lorem ipsum dolor sit amet, consectetur [...]', // A long line
//           'test',
//           'foo' ] ],
//     4 ],
//   b: Map { 'za' => 1, 'zb' => 'test' } }

// Establecer `compact` como falso, cambia el output para que sea más amigable con el lector.
console.log(util.inspect(o, { compact: false, depth: 5, breakLength: 80 }));

// {
//   a: [
//     1,
//     2,
//     [
//       [
//         'Lorem ipsum dolor sit amet, consectetur ' +
//           'adipiscing elit, sed do eiusmod tempor ' +
//           'incididunt ut labore et dolore magna ' +
//           'aliqua.,
//         'test',
//         'foo'
//       ]
//     ],
//     4
//   ],
//   b: Map {
//     'za' => 1,
//     'zb' => 'test'
//   }
// }

// Establecer `breakLength` a p. ej 150 va a estampar el texto "Lorem ipsum" en una
// sola línea.
// Reducir el `breakLength` va a dividir el texto "Lorem ipsum" en pedazos 
// más pequeños.
```

Usar la opción `showHidden` permite inspeccionar las entradas [`WeakMap`][] and [`WeakSet`][]. Si hay más entradas que `maxArrayLength`, no hay ninguna garantía de cuales entradas son desplegadas. Esto significa, que recuperar la misma entrada [`WeakSet`][] dos veces puede resultar en un output diferente. Además de esto, cualquier ítem puede ser coleccionado en cualquier momento por el colector de basura, si no hay una referencia fuerte dejada para ese objeto. Por lo tanto, no hay garantía de obtener un output confiable.

```js
const { inspect } = require('util');

const obj = { a: 1 };
const obj2 = { b: 2 };
const weakSet = new WeakSet([obj, obj2]);

console.log(inspect(weakSet, { showHidden: true }));
// WeakSet { { a: 1 }, { b: 2 } }
```

Please note that `util.inspect()` is a synchronous method that is mainly intended as a debugging tool. Algunos valores de entrada pueden tener una significativa recarga de rendimiento que puede bloquear el bucle de eventos. Use esta función con cuidado y nunca en una ruta de código caliente.

### Customizing `util.inspect` colors

<!-- type=misc -->

Color output (if enabled) of `util.inspect` is customizable globally via the `util.inspect.styles` and `util.inspect.colors` properties.

`util.inspect.styles` is a map associating a style name to a color from `util.inspect.colors`.

The default styles and associated colors are:

* `number` - `yellow`
* `boolean` - `yellow`
* `string` - `green`
* `date` - `magenta`
* `regexp` - `red`
* `null` - `bold`
* `undefined` - `grey`
* `special` - `cyan` (only applied to functions at this time)
* `name` - (no styling)

The predefined color codes are: `white`, `grey`, `black`, `blue`, `cyan`, `green`, `magenta`, `red` and `yellow`. There are also `bold`, `italic`, `underline` and `inverse` codes.

Color styling uses ANSI control codes that may not be supported on all terminals.

### Custom inspection functions on Objects

<!-- type=misc -->

Objects may also define their own `[util.inspect.custom](depth, opts)` (or the equivalent but deprecated `inspect(depth, opts)`) function that `util.inspect()` will invoke and use the result of when inspecting the object:

```js
const util = require('util');

class Box {
  constructor(value) {
    this.value = value;
  }

  [util.inspect.custom](depth, options) {
    if (depth < 0) {
      return options.stylize('[Box]', 'special');
    }

    const newOptions = Object.assign({}, options, {
      depth: options.depth === null ? null : options.depth - 1
    });

    // Five space padding because that's the size of "Box< ".
    const padding = ' '.repeat(5);
    const inner = util.inspect(this.value, newOptions)
                      .replace(/\n/g, `\n${padding}`);
    return `${options.stylize('Box', 'special')}< ${inner} >`;
  }
}

const box = new Box(true);

util.inspect(box);
// Retorna: "Box< true >"
```

Custom `[util.inspect.custom](depth, opts)` functions typically return a string but may return a value of any type that will be formatted accordingly by `util.inspect()`.

```js
const util = require('util');

const obj = { foo: 'this will not show up in the inspect() output' };
obj[util.inspect.custom] = (depth) => {
  return { bar: 'baz' };
};

util.inspect(obj);
// Retorna: "{ bar: 'baz' }"
```

### util.inspect.custom

<!-- YAML
added: v6.6.0
-->

A {symbol} that can be used to declare custom inspect functions, see [Custom inspection functions on Objects](#util_custom_inspection_functions_on_objects).

### util.inspect.defaultOptions

<!-- YAML
added: v6.4.0
-->

The `defaultOptions` value allows customization of the default options used by `util.inspect`. This is useful for functions like `console.log` or `util.format` which implicitly call into `util.inspect`. It shall be set to an object containing one or more valid [`util.inspect()`][] options. Setting option properties directly is also supported.

```js
const util = require('util');
const arr = Array(101).fill(0);

console.log(arr); // logs the truncated array
util.inspect.defaultOptions.maxArrayLength = null;
console.log(arr); // logs the full array
```

## util.isDeepStrictEqual(val1, val2)

<!-- YAML
added: v9.0.0
-->

* `val1` {any}
* `val2` {any}
* Returns: {boolean}

Returns `true` if there is deep strict equality between `val1` and `val2`. Otherwise, returns `false`.

See [`assert.deepStrictEqual()`][] for more information about deep strict equality.

## util.promisify(original)

<!-- YAML
added: v8.0.0
-->

* `original` {Function}
* Returns: {Function}

Takes a function following the common error-first callback style, i.e. taking an `(err, value) => ...` callback as the last argument, and returns a version that returns promises.

```js
const util = require('util');
const fs = require('fs');

const stat = util.promisify(fs.stat);
stat('.').then((stats) => {
  // Hacer algo con `stats`
}).catch((error) => {
  // Gestionar el error.
});
```

Or, equivalently using `async function`s:

```js
const util = require('util');
const fs = require('fs');

const stat = util.promisify(fs.stat);

async function callStat() {
  const stats = await stat('.');
  console.log(`This directory is owned by ${stats.uid}`);
}
```

If there is an `original[util.promisify.custom]` property present, `promisify` will return its value, see [Custom promisified functions](#util_custom_promisified_functions).

`promisify()` assumes that `original` is a function taking a callback as its final argument in all cases. If `original` is not a function, `promisify()` will throw an error. If `original` is a function but its last argument is not an error-first callback, it will still be passed an error-first callback as its last argument.

### Custom promisified functions

Using the `util.promisify.custom` symbol one can override the return value of [`util.promisify()`][]:

```js
const util = require('util');

function doSomething(foo, callback) {
  // ...
}

doSomething[util.promisify.custom] = (foo) => {
  return getPromiseSomehow();
};

const promisified = util.promisify(doSomething);
console.log(promisified === doSomething[util.promisify.custom]);
// estampar 'true'
```

This can be useful for cases where the original function does not follow the standard format of taking an error-first callback as the last argument.

For example, with a function that takes in `(foo, onSuccessCallback, onErrorCallback)`:

```js
doSomething[util.promisify.custom] = (foo) => {
  return new Promise((resolve, reject) => {
    doSomething(foo, resolve, reject);
  });
};
```

If `promisify.custom` is defined but is not a function, `promisify()` will throw an error.

### util.promisify.custom

<!-- YAML
added: v8.0.0
-->

* {symbol}

A {symbol} that can be used to declare custom promisified variants of functions, see [Custom promisified functions](#util_custom_promisified_functions).

## Class: util.TextDecoder

<!-- YAML
added: v8.3.0
-->

An implementation of the [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/) `TextDecoder` API.

```js
const decoder = new TextDecoder('shift_jis');
let string = '';
let buffer;
while (buffer = getNextChunkSomehow()) {
  string += decoder.decode(buffer, { stream: true });
}
string += decoder.decode(); // end-of-stream
```

### WHATWG Supported Encodings

Per the [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/), the encodings supported by the `TextDecoder` API are outlined in the tables below. For each encoding, one or more aliases may be used.

Different Node.js build configurations support different sets of encodings. While a very basic set of encodings is supported even on Node.js builds without ICU enabled, support for some encodings is provided only when Node.js is built with ICU and using the full ICU data (see [Internationalization](intl.html)).

#### Encodings Supported Without ICU

| Encoding     | Aliases                         |
| ------------ | ------------------------------- |
| `'utf-8'`    | `'unicode-1-1-utf-8'`, `'utf8'` |
| `'utf-16le'` | `'utf-16'`                      |

#### Encodings Supported by Default (With ICU)

| Encoding     | Aliases                         |
| ------------ | ------------------------------- |
| `'utf-8'`    | `'unicode-1-1-utf-8'`, `'utf8'` |
| `'utf-16le'` | `'utf-16'`                      |
| `'utf-16be'` |                                 |

#### Encodings Requiring Full ICU Data

| Encoding           | Aliases                                                                                                                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'ibm866'`         | `'866'`, `'cp866'`, `'csibm866'`                                                                                                                                                                                                    |
| `'iso-8859-2'`     | `'csisolatin2'`, `'iso-ir-101'`, `'iso8859-2'`, `'iso88592'`, `'iso_8859-2'`, `'iso_8859-2:1987'`, `'l2'`, `'latin2'`                                                                                                               |
| `'iso-8859-3'`     | `'csisolatin3'`, `'iso-ir-109'`, `'iso8859-3'`, `'iso88593'`, `'iso_8859-3'`, `'iso_8859-3:1988'`, `'l3'`, `'latin3'`                                                                                                               |
| `'iso-8859-4'`     | `'csisolatin4'`, `'iso-ir-110'`, `'iso8859-4'`, `'iso88594'`, `'iso_8859-4'`, `'iso_8859-4:1988'`, `'l4'`, `'latin4'`                                                                                                               |
| `'iso-8859-5'`     | `'csisolatincyrillic'`, `'cyrillic'`, `'iso-ir-144'`, `'iso8859-5'`, `'iso88595'`, `'iso_8859-5'`, `'iso_8859-5:1988'`                                                                                                              |
| `'iso-8859-6'`     | `'arabic'`, `'asmo-708'`, `'csiso88596e'`, `'csiso88596i'`, `'csisolatinarabic'`, `'ecma-114'`, `'iso-8859-6-e'`, `'iso-8859-6-i'`, `'iso-ir-127'`, `'iso8859-6'`, `'iso88596'`, `'iso_8859-6'`, `'iso_8859-6:1987'`                |
| `'iso-8859-7'`     | `'csisolatingreek'`, `'ecma-118'`, `'elot_928'`, `'greek'`, `'greek8'`, `'iso-ir-126'`, `'iso8859-7'`, `'iso88597'`, `'iso_8859-7'`, `'iso_8859-7:1987'`, `'sun_eu_greek'`                                                          |
| `'iso-8859-8'`     | `'csiso88598e'`, `'csisolatinhebrew'`, `'hebrew'`, `'iso-8859-8-e'`, `'iso-ir-138'`, `'iso8859-8'`, `'iso88598'`, `'iso_8859-8'`, `'iso_8859-8:1988'`, `'visual'`                                                                   |
| `'iso-8859-8-i'`   | `'csiso88598i'`, `'logical'`                                                                                                                                                                                                        |
| `'iso-8859-10'`    | `'csisolatin6'`, `'iso-ir-157'`, `'iso8859-10'`, `'iso885910'`, `'l6'`, `'latin6'`                                                                                                                                                  |
| `'iso-8859-13'`    | `'iso8859-13'`, `'iso885913'`                                                                                                                                                                                                       |
| `'iso-8859-14'`    | `'iso8859-14'`, `'iso885914'`                                                                                                                                                                                                       |
| `'iso-8859-15'`    | `'csisolatin9'`, `'iso8859-15'`, `'iso885915'`, `'iso_8859-15'`, `'l9'`                                                                                                                                                             |
| `'koi8-r'`         | `'cskoi8r'`, `'koi'`, `'koi8'`, `'koi8_r'`                                                                                                                                                                                          |
| `'koi8-u'`         | `'koi8-ru'`                                                                                                                                                                                                                         |
| `'macintosh'`      | `'csmacintosh'`, `'mac'`, `'x-mac-roman'`                                                                                                                                                                                           |
| `'windows-874'`    | `'dos-874'`, `'iso-8859-11'`, `'iso8859-11'`, `'iso885911'`, `'tis-620'`                                                                                                                                                            |
| `'windows-1250'`   | `'cp1250'`, `'x-cp1250'`                                                                                                                                                                                                            |
| `'windows-1251'`   | `'cp1251'`, `'x-cp1251'`                                                                                                                                                                                                            |
| `'windows-1252'`   | `'ansi_x3.4-1968'`, `'ascii'`, `'cp1252'`, `'cp819'`, `'csisolatin1'`, `'ibm819'`, `'iso-8859-1'`, `'iso-ir-100'`, `'iso8859-1'`, `'iso88591'`, `'iso_8859-1'`, `'iso_8859-1:1987'`, `'l1'`, `'latin1'`, `'us-ascii'`, `'x-cp1252'` |
| `'windows-1253'`   | `'cp1253'`, `'x-cp1253'`                                                                                                                                                                                                            |
| `'windows-1254'`   | `'cp1254'`, `'csisolatin5'`, `'iso-8859-9'`, `'iso-ir-148'`, `'iso8859-9'`, `'iso88599'`, `'iso_8859-9'`, `'iso_8859-9:1989'`, `'l5'`, `'latin5'`, `'x-cp1254'`                                                                     |
| `'windows-1255'`   | `'cp1255'`, `'x-cp1255'`                                                                                                                                                                                                            |
| `'windows-1256'`   | `'cp1256'`, `'x-cp1256'`                                                                                                                                                                                                            |
| `'windows-1257'`   | `'cp1257'`, `'x-cp1257'`                                                                                                                                                                                                            |
| `'windows-1258'`   | `'cp1258'`, `'x-cp1258'`                                                                                                                                                                                                            |
| `'x-mac-cyrillic'` | `'x-mac-ukrainian'`                                                                                                                                                                                                                 |
| `'gbk'`            | `'chinese'`, `'csgb2312'`, `'csiso58gb231280'`, `'gb2312'`, `'gb_2312'`, `'gb_2312-80'`, `'iso-ir-58'`, `'x-gbk'`                                                                                                                   |
| `'gb18030'`        |                                                                                                                                                                                                                                     |
| `'big5'`           | `'big5-hkscs'`, `'cn-big5'`, `'csbig5'`, `'x-x-big5'`                                                                                                                                                                               |
| `'euc-jp'`         | `'cseucpkdfmtjapanese'`, `'x-euc-jp'`                                                                                                                                                                                               |
| `'iso-2022-jp'`    | `'csiso2022jp'`                                                                                                                                                                                                                     |
| `'shift_jis'`      | `'csshiftjis'`, `'ms932'`, `'ms_kanji'`, `'shift-jis'`, `'sjis'`, `'windows-31j'`, `'x-sjis'`                                                                                                                                       |
| `'euc-kr'`         | `'cseuckr'`, `'csksc56011987'`, `'iso-ir-149'`, `'korean'`, `'ks_c_5601-1987'`, `'ks_c_5601-1989'`, `'ksc5601'`, `'ksc_5601'`, `'windows-949'`                                                                                      |

The `'iso-8859-16'` encoding listed in the [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/) is not supported.

### new TextDecoder([encoding[, options]])

* `encoding` {string} Identifies the `encoding` that this `TextDecoder` instance supports. **Default:** `'utf-8'`.
* `options` {Object} 
  * `fatal` {boolean} `true` if decoding failures are fatal. This option is only supported when ICU is enabled (see [Internationalization](intl.html)). **Default:** `false`.
  * `ignoreBOM` {boolean} When `true`, the `TextDecoder` will include the byte order mark in the decoded result. When `false`, the byte order mark will be removed from the output. This option is only used when `encoding` is `'utf-8'`, `'utf-16be'` or `'utf-16le'`. **Default:** `false`.

Creates an new `TextDecoder` instance. The `encoding` may specify one of the supported encodings or an alias.

### textDecoder.decode([input[, options]])

* `input` {ArrayBuffer|DataView|TypedArray} An `ArrayBuffer`, `DataView` or `Typed Array` instance containing the encoded data.
* `options` {Object} 
  * `stream` {boolean} `true` if additional chunks of data are expected. **Default:** `false`.
* Returns: {string}

Decodes the `input` and returns a string. If `options.stream` is `true`, any incomplete byte sequences occurring at the end of the `input` are buffered internally and emitted after the next call to `textDecoder.decode()`.

If `textDecoder.fatal` is `true`, decoding errors that occur will result in a `TypeError` being thrown.

### textDecoder.encoding

* {string}

The encoding supported by the `TextDecoder` instance.

### textDecoder.fatal

* {boolean}

The value will be `true` if decoding errors result in a `TypeError` being thrown.

### textDecoder.ignoreBOM

* {boolean}

The value will be `true` if the decoding result will include the byte order mark.

## Class: util.TextEncoder

<!-- YAML
added: v8.3.0
-->

An implementation of the [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/) `TextEncoder` API. All instances of `TextEncoder` only support UTF-8 encoding.

```js
const encoder = new TextEncoder();
const uint8array = encoder.encode('this is some data');
```

### textEncoder.encode([input])

* `input` {string} The text to encode. **Default:** an empty string.
* Returns: {Uint8Array}

UTF-8 encodes the `input` string and returns a `Uint8Array` containing the encoded bytes.

### textEncoder.encoding

* {string}

The encoding supported by the `TextEncoder` instance. Always set to `'utf-8'`.

## util.types

<!-- YAML
added: v10.0.0
-->

`util.types` provides a number of type checks for different kinds of built-in objects. Unlike `instanceof` or `Object.prototype.toString.call(value)`, these checks do not inspect properties of the object that are accessible from JavaScript (like their prototype), and usually have the overhead of calling into C++.

The result generally does not make any guarantees about what kinds of properties or behavior a value exposes in JavaScript. They are primarily useful for addon developers who prefer to do type checking in JavaScript.

### util.types.isAnyArrayBuffer(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a built-in [`ArrayBuffer`][] or [`SharedArrayBuffer`][] instance.

See also [`util.types.isArrayBuffer()`][] and [`util.types.isSharedArrayBuffer()`][].

For example:

```js
util.types.isAnyArrayBuffer(new ArrayBuffer());  // Returns true
util.types.isAnyArrayBuffer(new SharedArrayBuffer());  // Returns true
```

### util.types.isArgumentsObject(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is an `arguments` object.

For example:

<!-- eslint-disable prefer-rest-params -->

```js
function foo() {
  util.types.isArgumentsObject(arguments);  // Returns true
}
```

### util.types.isArrayBuffer(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a built-in [`ArrayBuffer`][] instance. This does *not* include [`SharedArrayBuffer`][] instances. Usually, it is desirable to test for both; See [`util.types.isAnyArrayBuffer()`][] for that.

For example:

```js
util.types.isArrayBuffer(new ArrayBuffer());  // Returns true
util.types.isArrayBuffer(new SharedArrayBuffer());  // Returns false
```

### util.types.isAsyncFunction(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is an [async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function). Note that this only reports back what the JavaScript engine is seeing; in particular, the return value may not match the original source code if a transpilation tool was used.

For example:

```js
util.types.isAsyncFunction(function foo() {});  // Returns false
util.types.isAsyncFunction(async function foo() {});  // Returns true
```

### util.types.isBooleanObject(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a boolean object, e.g. created by `new Boolean()`.

For example:

```js
util.types.isBooleanObject(false);  // Returns false
util.types.isBooleanObject(true);   // Returns false
util.types.isBooleanObject(new Boolean(false));   // Returns true
util.types.isBooleanObject(new Boolean(true));    // Returns true
util.types.isBooleanObject(Boolean(false)); // Returns false
util.types.isBooleanObject(Boolean(true)); // Returns false
```

### util.types.isDataView(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a built-in [`DataView`][] instance.

For example:

```js
const ab = new ArrayBuffer(20);
util.types.isDataView(new DataView(ab));  // Returns true
util.types.isDataView(new Float64Array());  // Returns false
```

See also [`ArrayBuffer.isView()`][].

### util.types.isDate(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a built-in [`Date`][] instance.

For example:

```js
util.types.isDate(new Date());  // Returns true
```

### util.types.isExternal(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a native `External` value.

### util.types.isFloat32Array(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a built-in [`Float32Array`][] instance.

For example:

```js
util.types.isFloat32Array(new ArrayBuffer());  // Returns false
util.types.isFloat32Array(new Float32Array());  // Returns true
util.types.isFloat32Array(new Float64Array());  // Returns false
```

### util.types.isFloat64Array(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a built-in [`Float64Array`][] instance.

For example:

```js
util.types.isFloat64Array(new ArrayBuffer());  // Returns false
util.types.isFloat64Array(new Uint8Array());  // Returns false
util.types.isFloat64Array(new Float64Array());  // Returns true
```

### util.types.isGeneratorFunction(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a generator function. Note that this only reports back what the JavaScript engine is seeing; in particular, the return value may not match the original source code if a transpilation tool was used.

For example:

```js
util.types.isGeneratorFunction(function foo() {});  // Returns false
util.types.isGeneratorFunction(function* foo() {});  // Returns true
```

### util.types.isGeneratorObject(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a generator object as returned from a built-in generator function. Note that this only reports back what the JavaScript engine is seeing; in particular, the return value may not match the original source code if a transpilation tool was used.

For example:

```js
function* foo() {}
const generator = foo();
util.types.isGeneratorObject(generator);  // Returns true
```

### util.types.isInt8Array(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a built-in [`Int8Array`][] instance.

For example:

```js
util.types.isInt8Array(new ArrayBuffer());  // Returns false
util.types.isInt8Array(new Int8Array());  // Returns true
util.types.isInt8Array(new Float64Array());  // Returns false
```

### util.types.isInt16Array(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a built-in [`Int16Array`][] instance.

For example:

```js
util.types.isInt16Array(new ArrayBuffer());  // Returns false
util.types.isInt16Array(new Int16Array());  // Returns true
util.types.isInt16Array(new Float64Array());  // Returns false
```

### util.types.isInt32Array(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a built-in [`Int32Array`][] instance.

For example:

```js
util.types.isInt32Array(new ArrayBuffer());  // Returns false
util.types.isInt32Array(new Int32Array());  // Returns true
util.types.isInt32Array(new Float64Array());  // Returns false
```

### util.types.isMap(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a built-in [`Map`][] instance.

For example:

```js
util.types.isMap(new Map());  // Returns true
```

### util.types.isMapIterator(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is an iterator returned for a built-in [`Map`][] instance.

For example:

```js
const map = new Map();
util.types.isMapIterator(map.keys());  // Returns true
util.types.isMapIterator(map.values());  // Returns true
util.types.isMapIterator(map.entries());  // Returns true
util.types.isMapIterator(map[Symbol.iterator]());  // Returns true
```

### util.types.isNativeError(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is an instance of a built-in [`Error`][] type.

For example:

```js
util.types.isNativeError(new Error());  // Returns true
util.types.isNativeError(new TypeError());  // Returns true
util.types.isNativeError(new RangeError());  // Returns true
```

### util.types.isNumberObject(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a number object, e.g. created by `new Number()`.

For example:

```js
util.types.isNumberObject(0);  // Returns false
util.types.isNumberObject(new Number(0));   // Returns true
```

### util.types.isPromise(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a built-in [`Promise`][].

For example:

```js
util.types.isPromise(Promise.resolve(42));  // Returns true
```

### util.types.isProxy(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a [`Proxy`][] instance.

For example:

```js
const target = {};
const proxy = new Proxy(target, {});
util.types.isProxy(target);  // Returns false
util.types.isProxy(proxy);  // Returns true
```

### util.types.isRegExp(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a regular expression object.

For example:

```js
util.types.isRegExp(/abc/);  // Returns true
util.types.isRegExp(new RegExp('abc'));  // Returns true
```

### util.types.isSet(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a built-in [`Set`][] instance.

For example:

```js
util.types.isSet(new Set());  // Returns true
```

### util.types.isSetIterator(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is an iterator returned for a built-in [`Set`][] instance.

For example:

```js
const set = new Set();
util.types.isSetIterator(set.keys());  // Returns true
util.types.isSetIterator(set.values());  // Returns true
util.types.isSetIterator(set.entries());  // Returns true
util.types.isSetIterator(set[Symbol.iterator]());  // Returns true
```

### util.types.isSharedArrayBuffer(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a built-in [`SharedArrayBuffer`][] instance. This does *not* include [`ArrayBuffer`][] instances. Usually, it is desirable to test for both; See [`util.types.isAnyArrayBuffer()`][] for that.

For example:

```js
util.types.isSharedArrayBuffer(new ArrayBuffer());  // Returns false
util.types.isSharedArrayBuffer(new SharedArrayBuffer());  // Returns true
```

### util.types.isStringObject(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a string object, e.g. created by `new String()`.

For example:

```js
util.types.isStringObject('foo');  // Returns false
util.types.isStringObject(new String('foo'));   // Returns true
```

### util.types.isSymbolObject(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a symbol object, created by calling `Object()` on a `Symbol` primitive.

For example:

```js
const symbol = Symbol('foo');
util.types.isSymbolObject(symbol);  // Returns false
util.types.isSymbolObject(Object(symbol));   // Returns true
```

### util.types.isTypedArray(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a built-in [`TypedArray`][] instance.

For example:

```js
util.types.isTypedArray(new ArrayBuffer());  // Returns false
util.types.isTypedArray(new Uint8Array());  // Returns true
util.types.isTypedArray(new Float64Array());  // Returns true
```

See also [`ArrayBuffer.isView()`][].

### util.types.isUint8Array(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a built-in [`Uint8Array`][] instance.

For example:

```js
util.types.isUint8Array(new ArrayBuffer());  // Returns false
util.types.isUint8Array(new Uint8Array());  // Returns true
util.types.isUint8Array(new Float64Array());  // Returns false
```

### util.types.isUint8ClampedArray(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a built-in [`Uint8ClampedArray`][] instance.

For example:

```js
util.types.isUint8ClampedArray(new ArrayBuffer());  // Returns false
util.types.isUint8ClampedArray(new Uint8ClampedArray());  // Returns true
util.types.isUint8ClampedArray(new Float64Array());  // Returns false
```

### util.types.isUint16Array(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a built-in [`Uint16Array`][] instance.

For example:

```js
util.types.isUint16Array(new ArrayBuffer());  // Returns false
util.types.isUint16Array(new Uint16Array());  // Returns true
util.types.isUint16Array(new Float64Array());  // Returns false
```

### util.types.isUint32Array(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a built-in [`Uint32Array`][] instance.

For example:

```js
util.types.isUint32Array(new ArrayBuffer());  // Returns false
util.types.isUint32Array(new Uint32Array());  // Returns true
util.types.isUint32Array(new Float64Array());  // Returns false
```

### util.types.isWeakMap(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a built-in [`WeakMap`][] instance.

For example:

```js
util.types.isWeakMap(new WeakMap());  // Returns true
```

### util.types.isWeakSet(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a built-in [`WeakSet`][] instance.

For example:

```js
util.types.isWeakSet(new WeakSet());  // Returns true
```

### util.types.isWebAssemblyCompiledModule(value)

<!-- YAML
added: v10.0.0
-->

* Returns: {boolean}

Returns `true` if the value is a built-in [`WebAssembly.Module`][] instance.

For example:

```js
const module = new WebAssembly.Module(wasmBuffer);
util.types.isWebAssemblyCompiledModule(module);  // Returns true
```

## Deprecated APIs

The following APIs have been deprecated and should no longer be used. Existing applications and modules should be updated to find alternative approaches.

### util.\_extend(target, source)

<!-- YAML
added: v0.7.5
deprecated: v6.0.0
-->

> Stability: 0 - Deprecated: Use [`Object.assign()`] instead.

The `util._extend()` method was never intended to be used outside of internal Node.js modules. The community found and used it anyway.

It is deprecated and should not be used in new code. JavaScript comes with very similar built-in functionality through [`Object.assign()`].

### util.debug(string)

<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->

> Stability: 0 - Deprecated: Use [`console.error()`][] instead.

* `string` {string} The message to print to `stderr`

Deprecated predecessor of `console.error`.

### util.error([...strings])

<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->

> Stability: 0 - Deprecated: Use [`console.error()`][] instead.

* `...strings` {string} The message to print to `stderr`

Deprecated predecessor of `console.error`.

### util.isArray(object)

<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use [`Array.isArray()`][] instead.

* `object` {any}
* Returns: {boolean}

Alias for [`Array.isArray()`][].

Returns `true` if the given `object` is an `Array`. Otherwise, returns `false`.

```js
const util = require('util');

util.isArray([]);
// Returns: true
util.isArray(new Array());
// Returns: true
util.isArray({});
// Returns: false
```

### util.isBoolean(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `typeof value === 'boolean'` instead.

* `object` {any}
* Returns: {boolean}

Returns `true` if the given `object` is a `Boolean`. Otherwise, returns `false`.

```js
const util = require('util');

util.isBoolean(1);
// Returns: false
util.isBoolean(0);
// Returns: false
util.isBoolean(false);
// Returns: true
```

### util.isBuffer(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use [`Buffer.isBuffer()`][] instead.

* `object` {any}
* Returns: {boolean}

Returns `true` if the given `object` is a `Buffer`. Otherwise, returns `false`.

```js
const util = require('util');

util.isBuffer({ length: 0 });
// Returns: false
util.isBuffer([]);
// Returns: false
util.isBuffer(Buffer.from('hello world'));
// Returns: true
```

### util.isDate(object)

<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use [`util.types.isDate()`][] instead.

* `object` {any}
* Returns: {boolean}

Returns `true` if the given `object` is a `Date`. Otherwise, returns `false`.

```js
const util = require('util');

util.isDate(new Date());
// Returns: true
util.isDate(Date());
// false (without 'new' returns a String)
util.isDate({});
// Returns: false
```

### util.isError(object)

<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use [`util.types.isNativeError()`][] instead.

* `object` {any}
* Returns: {boolean}

Returns `true` if the given `object` is an [`Error`][]. Otherwise, returns `false`.

```js
const util = require('util');

util.isError(new Error());
// Returns: true
util.isError(new TypeError());
// Returns: true
util.isError({ name: 'Error', message: 'an error occurred' });
// Returns: false
```

Note that this method relies on `Object.prototype.toString()` behavior. It is possible to obtain an incorrect result when the `object` argument manipulates `@@toStringTag`.

```js
const util = require('util');
const obj = { name: 'Error', message: 'an error occurred' };

util.isError(obj);
// Returns: false
obj[Symbol.toStringTag] = 'Error';
util.isError(obj);
// Returns: true
```

### util.isFunction(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `typeof value === 'function'` instead.

* `object` {any}
* Returns: {boolean}

Returns `true` if the given `object` is a `Function`. Otherwise, returns `false`.

```js
const util = require('util');

function Foo() {}
const Bar = () => {};

util.isFunction({});
// Returns: false
util.isFunction(Foo);
// Returns: true
util.isFunction(Bar);
// Returns: true
```

### util.isNull(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `value === null` instead.

* `object` {any}
* Returns: {boolean}

Returns `true` if the given `object` is strictly `null`. Otherwise, returns `false`.

```js
const util = require('util');

util.isNull(0);
// Retorna: false
util.isNull(undefined);
// Retorna: false
util.isNull(null);
// Retorna: true
```

### util.isNullOrUndefined(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `value === undefined || value === null` instead.

* `object` {any}
* Returns: {boolean}

Returns `true` if the given `object` is `null` or `undefined`. Otherwise, returns `false`.

```js
const util = require('util');

util.isNullOrUndefined(0);
// Returns: false
util.isNullOrUndefined(undefined);
// Returns: true
util.isNullOrUndefined(null);
// Returns: true
```

### util.isNumber(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `typeof value === 'number'` instead.

* `object` {any}
* Returns: {boolean}

Returns `true` if the given `object` is a `Number`. Otherwise, returns `false`.

```js
const util = require('util');

util.isNumber(false);
// Returns: false
util.isNumber(Infinity);
// Returns: true
util.isNumber(0);
// Returns: true
util.isNumber(NaN);
// Returns: true
```

### util.isObject(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `value !== null && typeof value === 'object'` instead.

* `object` {any}
* Returns: {boolean}

Returns `true` if the given `object` is strictly an `Object` **and** not a `Function` (even though functions are objects in JavaScript). Otherwise, returns `false`.

```js
const util = require('util');

util.isObject(5);
// Retorna: false
util.isObject(null);
// Retorna: false
util.isObject({});
// Retorna: true
util.isObject(() => {});
// Retorna: false
```

### util.isPrimitive(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `(typeof value !== 'object' && typeof value !== 'function') || value === null` instead.

* `object` {any}
* Returns: {boolean}

Returns `true` if the given `object` is a primitive type. Otherwise, returns `false`.

```js
const util = require('util');

util.isPrimitive(5);
// Retorna: true
util.isPrimitive('foo');
// Retorna: true
util.isPrimitive(false);
// Retorna: true
util.isPrimitive(null);
// Retorna: true
util.isPrimitive(undefined);
// Retorna: true
util.isPrimitive({});
// Retorna: false
util.isPrimitive(() => {});
// Retorna: false
util.isPrimitive(/^$/);
// Retorna: false
util.isPrimitive(new Date());
// Retorna: false
```

### util.isRegExp(object)

<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated

* `object` {any}
* Returns: {boolean}

Returns `true` if the given `object` is a `RegExp`. Otherwise, returns `false`.

```js
const util = require('util');

util.isRegExp(/some regexp/);
// Returns: true
util.isRegExp(new RegExp('another regexp'));
// Returns: true
util.isRegExp({});
// Returns: false
```

### util.isString(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `typeof value === 'string'` instead.

* `object` {any}
* Returns: {boolean}

Returns `true` if the given `object` is a `string`. Otherwise, returns `false`.

```js
const util = require('util');

util.isString('');
// Returns: true
util.isString('foo');
// Returns: true
util.isString(String('foo'));
// Returns: true
util.isString(5);
// Returns: false
```

### util.isSymbol(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `typeof value === 'symbol'` instead.

* `object` {any}
* Returns: {boolean}

Returns `true` if the given `object` is a `Symbol`. Otherwise, returns `false`.

```js
const util = require('util');

util.isSymbol(5);
// Returns: false
util.isSymbol('foo');
// Returns: false
util.isSymbol(Symbol('foo'));
// Returns: true
```

### util.isUndefined(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `value === undefined` instead.

* `object` {any}
* Returns: {boolean}

Returns `true` if the given `object` is `undefined`. Otherwise, returns `false`.

```js
const util = require('util');

const foo = undefined;
util.isUndefined(5);
// Returns: false
util.isUndefined(foo);
// Returns: true
util.isUndefined(null);
// Returns: false
```

### util.log(string)

<!-- YAML
added: v0.3.0
deprecated: v6.0.0
-->

> Stability: 0 - Deprecated: Use a third party module instead.

* `string` {string}

The `util.log()` method prints the given `string` to `stdout` with an included timestamp.

```js
const util = require('util');

util.log('Timestamped message.');
```

### util.print([...strings])

<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->

> Stability: 0 - Deprecated: Use [`console.log()`][] instead.

Deprecated predecessor of `console.log`.

### util.puts([...strings])

<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->

> Stability: 0 - Deprecated: Use [`console.log()`][] instead.

Deprecated predecessor of `console.log`.