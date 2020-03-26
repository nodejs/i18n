# Util

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

The `util` module is primarily designed to support the needs of Node.js' own internal APIs. However, many of the utilities are useful for application and module developers as well. Puede ser accedido usando:

```js
const util = require('util');
```

## util.callbackify(original)

<!-- YAML
added: v8.2.0
-->

* `original` {Function} Una función `async`
* Retorna: {Function} una función de estilo callback

Takes an `async` function (or a function that returns a `Promise`) and returns a function following the error-first callback style, i.e. taking an `(err, value) => ...` callback as the last argument. In the callback, the first argument will be the rejection reason (or `null` if the `Promise` resolved), and the second argument will be the resolved value.

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

Va a imprimir:

```txt
hello world
```

El callback es ejecutado asincrónicamente, y va a tener un stack trace limitado. If the callback throws, the process will emit an [`'uncaughtException'`][] event, and if not handled will exit.

Since `null` has a special meaning as the first argument to a callback, if a wrapped function rejects a `Promise` with a falsy value as a reason, the value is wrapped in an `Error` with the original value stored in a field named `reason`.

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

* `section` {string} A string identifying the portion of the application for which the `debuglog` function is being created.
* Retorna: {Function} La función de registro

The `util.debuglog()` method is used to create a function that conditionally writes debug messages to `stderr` based on the existence of the `NODE_DEBUG` environment variable. If the `section` name appears within the value of that environment variable, then the returned function operates similar to [`console.error()`][]. Si no, entonces la función retornada es un no-op.

```js
const util = require('util');
const debuglog = util.debuglog('foo');

debuglog('hello from foo [%d]', 123);
```

If this program is run with `NODE_DEBUG=foo` in the environment, then it will output something like:

```txt
FOO 3245: hello from foo [123]
```

donde `3245` es la identificación del proceso. If it is not run with that environment variable set, then it will not print anything.

La `section` también soporta wildcard:

```js
const util = require('util');
const debuglog = util.debuglog('foo-bar');

debuglog('hi there, it\'s foo-bar [%d]', 2333);
```

if it is run with `NODE_DEBUG=foo*` in the environment, then it will output something like:

```txt
FOO-BAR 3257: hola, es foo-bar [2333]
```

Multiple comma-separated `section` names may be specified in the `NODE_DEBUG` environment variable: `NODE_DEBUG=fs,net,tls`.

## util.deprecate(fn, msg[, code])

<!-- YAML
added: v0.8.0
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/16393
    description: Deprecation warnings are only emitted once for each code.
-->

* `fn` {Function} La función que está siendo desaprobada.
* `msg` {string} A warning message to display when the deprecated function is invoked.
* `code` {string} Un código de desaprobación. See the [list of deprecated APIs](deprecations.html#deprecations_list_of_deprecated_apis) for a list of codes.
* Retorna: {Function} La función desaprobada se envolvió para emitir una advertencia.

The `util.deprecate()` method wraps `fn` (which may be a function or class) in such a way that it is marked as deprecated.

```js
const util = require('util');

exports.obsoleteFunction = util.deprecate(() => {
  // Hacer algo aquí.
}, 'obsoleteFunction() está obsoleto. En cambio, use newShinyFunction().');
```

When called, `util.deprecate()` will return a function that will emit a `DeprecationWarning` using the [`'warning'`][] event. The warning will be emitted and printed to `stderr` the first time the returned function is called. After the warning is emitted, the wrapped function is called without emitting a warning.

If the same optional `code` is supplied in multiple calls to `util.deprecate()`, the warning will be emitted only once for that `code`.

```js
const util = require('util');

const fn1 = util.deprecate(someFunction, someMessage, 'DEP0001');
const fn2 = util.deprecate(someOtherFunction, someOtherMessage, 'DEP0001');
fn1(); // emite una advertencia de desaprobación con el código DEP0001
fn2(); // no emite una advertencia de desaprobación porque tiene el mismo código
```

If either the `--no-deprecation` or `--no-warnings` command line flags are used, or if the `process.noDeprecation` property is set to `true` *prior* to the first deprecation warning, the `util.deprecate()` method does nothing.

If the `--trace-deprecation` or `--trace-warnings` command line flags are set, or the `process.traceDeprecation` property is set to `true`, a warning and a stack trace are printed to `stderr` the first time the deprecated function is called.

If the `--throw-deprecation` command line flag is set, or the `process.throwDeprecation` property is set to `true`, then an exception will be thrown when the deprecated function is called.

The `--throw-deprecation` command line flag and `process.throwDeprecation` property take precedence over `--trace-deprecation` and `process.traceDeprecation`.

## util.format(format[, ...args])

<!-- YAML
added: v0.5.3
changes:

  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14558
    description: The `%o` and `%O` specifiers are supported now.
-->

* 0>format</code> {string} Un formato de string parecido a `printf`.

The `util.format()` method returns a formatted string using the first argument as a `printf`-like format.

El primer argumento es un string conteniendo cero o más tokens *placeholder*. Each placeholder token is replaced with the converted value from the corresponding argument. Los placeholders soportados son:

* `%s` - `String`.
* `%d` - `Number` (integer or floating point value) or `BigInt`.
* `%i` - Integer or `BigInt`.
* `%f` - Valor de punto flotante.
* `%j` - JSON. Replaced with the string `'[Circular]'` if the argument contains circular references.
* `%o` - `Object`. A string representation of an object with generic JavaScript object formatting. Similar to `util.inspect()` with options `{ showHidden: true, showProxy: true }`. This will show the full object including non-enumerable properties and proxies.
* `%O` - `Object`. A string representation of an object with generic JavaScript object formatting. Similar a `util.inspect()` sin opciones. This will show the full object not including non-enumerable properties and proxies.
* `%%` - signo de porcentaje individual (`'%'`). Esto no consume un argumento.
* Retorna: {string} El string con formato

If the placeholder does not have a corresponding argument, the placeholder is not replaced.

```js
util.format('%s:%s', 'foo');
// Retorna: 'foo:%s'
```

If there are more arguments passed to the `util.format()` method than the number of placeholders, the extra arguments are coerced into strings then concatenated to the returned string, each delimited by a space. Excessive arguments whose `typeof` is `'object'` or `'symbol'` (except `null`) will be transformed by `util.inspect()`.

```js
util.format('%s:%s', 'foo', 'bar', 'baz'); // 'foo:bar baz'
```

If the first argument is not a string then `util.format()` returns a string that is the concatenation of all arguments separated by spaces. Cada argumento es convertido a un string usando `util.inspect()`.

```js
util.format(1, 2, 3); // '1 2 3'
```

If only one argument is passed to `util.format()`, it is returned as it is without any formatting.

```js
util.format('%% %s'); // '%% %s'
```

Please note that `util.format()` is a synchronous method that is mainly intended as a debugging tool. Some input values can have a significant performance overhead that can block the event loop. Use this function with care and never in a hot code path.

## util.formatWithOptions(inspectOptions, format[, ...args])

<!-- YAML
added: v10.0.0
-->

* `inspectOptions` {Object}
* `format` {string}

This function is identical to [`util.format()`][], except in that it takes an `inspectOptions` argument which specifies options that are passed along to [`util.inspect()`][].

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

* `constructor` {Function}
* `superConstructor` {Function}

El uso de `util.inherits()` está desalentado. Please use the ES6 `class` and `extends` keywords to get language level inheritance support. Also note that the two styles are [semantically incompatible](https://github.com/nodejs/node/issues/4179).

Herede los métodos prototipo de un [constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/constructor) a otro. The prototype of `constructor` will be set to a new object created from `superConstructor`.

As an additional convenience, `superConstructor` will be accessible through the `constructor.super_` property.

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

## util.inspect(object[, showHidden[, depth[, colors]]])

<!-- YAML
added: v0.3.0
changes:

  - version: v10.12.0
    pr-url: https://github.com/nodejs/node/pull/22788
    description: The `sorted` option is supported now.
  - version: v10.6.0
    pr-url: https://github.com/nodejs/node/pull/20725
    description: Inspecting linked lists and similar objects is now possible
                 up to the maximum call stack size.
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
  * `showHidden` {boolean} If `true`, the `object`'s non-enumerable symbols and properties will be included in the formatted result as well as [`WeakMap`][] and [`WeakSet`][] entries. **Predeterminado:** `false`.
  * `depth` {number} Specifies the number of times to recurse while formatting the `object`. Esto es útil para inspeccionar objetos grandes y complicados. To make it recurse up to the maximum call stack size pass `Infinity` or `null`. **Default:** `2`.
  * `colors` {boolean} If `true`, the output will be styled with ANSI color codes. Los colores son personalizables, vea [Customizing `util.inspect` colors][]. **Predeterminado:** `false`.
  * `customInspect` {boolean} If `false`, then custom `inspect(depth, opts)` functions will not be called. **Predeterminado:** `true`.
  * `showProxy` {boolean} If `true`, then objects and functions that are `Proxy` objects will be introspected to show their `target` and `handler` objects. **Predeterminado:** `false`.
  * `maxArrayLength` {number} Specifies the maximum number of `Array`, [`TypedArray`][], [`WeakMap`][] and [`WeakSet`][] elements to include when formatting. Establecer a `null` o `Infinity` para mostrar todos los elementos. Set to `0` or negative to show no elements. **Predeterminado:** `100`.
  * `breakLength` {number} The length at which an object's keys are split across multiple lines. Set to `Infinity` to format an object as a single line. **Predeterminado:** `60` para compatibilidad con versiones anteriores.
  * `compact` {boolean} Setting this to `false` changes the default indentation to use a line break for each object key instead of lining up multiple properties in one line. It will also break text that is above the `breakLength` size into smaller and better readable chunks and indents objects the same as arrays. Note that no text will be reduced below 16 characters, no matter the `breakLength` size. For more information, see the example below. **Predeterminado:** `true`.
  * `sorted` {boolean|Function} If set to `true` or a function, all properties of an object and Set and Map entries will be sorted in the returned string. If set to `true` the [default sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) is going to be used. If set to a function, it is used as a [compare function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#Parameters).
* Devuelve: {string} La representación de un objeto pasado

The `util.inspect()` method returns a string representation of `object` that is intended for debugging. The output of `util.inspect` may change at any time and should not be depended upon programmatically. Additional `options` may be passed that alter certain aspects of the formatted string. `util.inspect()` will use the constructor's name and/or `@@toStringTag` to make an identifiable tag for an inspected value.

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

Values may supply their own custom `inspect(depth, opts)` functions, when called these receive the current `depth` in the recursive inspection, as well as the options object passed to `util.inspect()`.

El siguiente ejemplo resalta la diferencia con la opción `compact`:

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

Using the `showHidden` option allows to inspect [`WeakMap`][] and [`WeakSet`][] entries. If there are more entries than `maxArrayLength`, there is no guarantee which entries are displayed. That means retrieving the same [`WeakSet`][] entries twice might actually result in a different output. Besides this any item might be collected at any point of time by the garbage collector if there is no strong reference left to that object. Therefore there is no guarantee to get a reliable output.

```js
const { inspect } = require('util');

const obj = { a: 1 };
const obj2 = { b: 2 };
const weakSet = new WeakSet([obj, obj2]);

console.log(inspect(weakSet, { showHidden: true }));
// WeakSet { { a: 1 }, { b: 2 } }
```

The `sorted` option makes sure the output is identical, no matter of the properties insertion order:

```js
const { inspect } = require('util');
const assert = require('assert');

const o1 = {
  b: [2, 3, 1],
  a: '`a` comes before `b`',
  c: new Set([2, 3, 1])
};
console.log(inspect(o1, { sorted: true }));
// { a: '`a` comes before `b`', b: [ 2, 3, 1 ], c: Set { 1, 2, 3 } }
console.log(inspect(o1, { sorted: (a, b) => b.localeCompare(a) }));
// { c: Set { 3, 2, 1 }, b: [ 2, 3, 1 ], a: '`a` comes before `b`' }

const o2 = {
  c: new Set([2, 1, 3]),
  a: '`a` comes before `b`',
  b: [2, 3, 1]
};
assert.strict.equal(
  inspect(o1, { sorted: true }),
  inspect(o2, { sorted: true })
);
```

Please note that `util.inspect()` is a synchronous method that is mainly intended as a debugging tool. Some input values can have a significant performance overhead that can block the event loop. Use this function with care and never in a hot code path.

### Personalizar colores `util.inspect`

<!-- type=misc -->

Color output (if enabled) of `util.inspect` is customizable globally via the `util.inspect.styles` and `util.inspect.colors` properties.

`util.inspect.styles` is a map associating a style name to a color from `util.inspect.colors`.

Los estilos predeterminados y colores asociados son:

* `number` - `yellow`
* `boolean` - `yellow`
* `string` - `green`
* `date` - `magenta`
* `regexp` - `red`
* `null` - `bold`
* `undefined` - `grey`
* `special` - `cyan` (solo aplicado a funciones en este momento)
* `name` - (sin estilo)

The predefined color codes are: `white`, `grey`, `black`, `blue`, `cyan`, `green`, `magenta`, `red` and `yellow`. There are also `bold`, `italic`, `underline` and `inverse` codes.

Color styling uses ANSI control codes that may not be supported on all terminals.

### Funciones de inspección personalizada en Objetos

<!-- type=misc -->

Objects may also define their own [`[util.inspect.custom](depth, opts)`](#util_util_inspect_custom) (or the equivalent but deprecated `inspect(depth, opts)`) function, which `util.inspect()` will invoke and use the result of when inspecting the object:

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

    // Cinco espacios rellenados porque ese es el tamaño de "Box< ".
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
// Devuelve: "{ bar: 'baz' }"
```

### util.inspect.custom

<!-- YAML
added: v6.6.0
changes:

  - version: v10.12.0
    pr-url: https://github.com/nodejs/node/pull/20857
    description: This is now defined as a shared symbol.
-->

* {symbol} that can be used to declare custom inspect functions.

In addition to being accessible through `util.inspect.custom`, this symbol is [registered globally](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/for) and can be accessed in any environment as `Symbol.for('nodejs.util.inspect.custom')`.

```js
const inspect = Symbol.for('nodejs.util.inspect.custom');

class Password {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return 'xxxxxxxx';
  }

  [inspect]() {
    return `Password <${this.toString()}>`;
  }
}

const password = new Password('r0sebud');
console.log(password);
// Prints Password <xxxxxxxx>
```

See [Custom inspection functions on Objects](#util_custom_inspection_functions_on_objects) for more details.

### util.inspect.defaultOptions

<!-- YAML
added: v6.4.0
-->

The `defaultOptions` value allows customization of the default options used by `util.inspect`. This is useful for functions like `console.log` or `util.format` which implicitly call into `util.inspect`. It shall be set to an object containing one or more valid [`util.inspect()`][] options. Setting option properties directly is also supported.

```js
const util = require('util');
const arr = Array(101).fill(0);

console.log(arr); // registra el array truncado
util.inspect.defaultOptions.maxArrayLength = null;
console.log(arr); // registra el array completo
```

## util.isDeepStrictEqual(val1, val2)

<!-- YAML
added: v9.0.0
-->

* `val1` {any}
* `val2` {any}
* Devuelve: {boolean}

Devuelve `true` si hay una estricta igualdad profunda entre `val1` and `val2`. De otra manera, devuelve `false`.

See [`assert.deepStrictEqual()`][] for more information about deep strict equality.

## util.promisify(original)

<!-- YAML
added: v8.0.0
-->

* `original` {Function}
* Devuelve: {Function}

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

O, equivalentemente usando `async function`s:

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

### Funciones promisificadas personalizadas

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
// imprimir 'true'
```

This can be useful for cases where the original function does not follow the standard format of taking an error-first callback as the last argument.

Por ejemplo, con una función que tome `(foo, onSuccessCallback, onErrorCallback)`:

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

## Clase: util.TextDecoder

<!-- YAML
added: v8.3.0
-->

Una implementación de la API `TextDecoder` del [Estándar de Codificación WHATWG](https://encoding.spec.whatwg.org/).

```js
const decoder = new TextDecoder('shift_jis');
let string = '';
let buffer;
while (buffer = getNextChunkSomehow()) {
  string += decoder.decode(buffer, { stream: true });
}
string += decoder.decode(); // end-of-stream
```

### Codificaciones Soportadas por WHATWG

Per the [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/), the encodings supported by the `TextDecoder` API are outlined in the tables below. For each encoding, one or more aliases may be used.

Diferentes configuraciones de construcción de Node.js soportan diferentes conjuntos de codificaciones. While a very basic set of encodings is supported even on Node.js builds without ICU enabled, support for some encodings is provided only when Node.js is built with ICU and using the full ICU data (see [Internationalization](intl.html)).

#### Codificaciones Soportadas Sin ICU

| Codificación | Alias                           |
| ------------ | ------------------------------- |
| `'utf-8'`    | `'unicode-1-1-utf-8'`, `'utf8'` |
| `'utf-16le'` | `'utf-16'`                      |

#### Codificaciones Soportadas Por Defecto (Sin ICU)

| Codificación | Alias                           |
| ------------ | ------------------------------- |
| `'utf-8'`    | `'unicode-1-1-utf-8'`, `'utf8'` |
| `'utf-16le'` | `'utf-16'`                      |
| `'utf-16be'` |                                 |

#### Codificaciones que Requieren los Datos Completos de ICU

| Codificación       | Alias                                                                                                                                                                                                                               |
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

### nuevo TextDecoder([encoding[, options]])

* `encoding` {string} Identifies the `encoding` that this `TextDecoder` instance supports. **Predeterminado:** `'utf-8'`.
* `options` {Object} 
  * `fatal` {boolean} `true` si las fallas de decodificación son fatales. This option is only supported when ICU is enabled (see [Internationalization](intl.html)). **Predeterminado:** `false`.
  * `ignoreBOM` {boolean} When `true`, the `TextDecoder` will include the byte order mark in the decoded result. When `false`, the byte order mark will be removed from the output. This option is only used when `encoding` is `'utf-8'`, `'utf-16be'` or `'utf-16le'`. **Default:**`false`.

Crea una nueva instancia `TextDecoder`. The `encoding` may specify one of the supported encodings or an alias.

### textDecoder.decode([input[, options]])

* `input` {ArrayBuffer|DataView|TypedArray} An `ArrayBuffer`, `DataView` or `Typed Array` instance containing the encoded data.
* `options` {Object} 
  * `stream` {boolean} `true` si pedazos adicionales de datos son esperados. **Predeterminado:** `false`.
* Devuelve: {string}

Decodifica el `input` y devuelve un string. If `options.stream` is `true`, any incomplete byte sequences occurring at the end of the `input` are buffered internally and emitted after the next call to `textDecoder.decode()`.

If `textDecoder.fatal` is `true`, decoding errors that occur will result in a `TypeError` being thrown.

### textDecoder.encoding

* {string}

La codificación soportada por la instancia `TextDecoder`.

### textDecoder.fatal

* {boolean}

The value will be `true` if decoding errors result in a `TypeError` being thrown.

### textDecoder.ignoreBOM

* {boolean}

The value will be `true` if the decoding result will include the byte order mark.

## Clase: util.TextEncoder

<!-- YAML
added: v8.3.0
-->

Una implementación de la API `TextDecoder` del [Estándar de Codificación WHATWG](https://encoding.spec.whatwg.org/). All instances of `TextEncoder` only support UTF-8 encoding.

```js
const encoder = new TextEncoder();
const uint8array = encoder.encode('this is some data');
```

### textEncoder.encode([input])

* `input` {string} El texto para codificar. **Predeterminado:** un string vacío.
* Devuelve: {Uint8Array}

UTF-8 encodes the `input` string and returns a `Uint8Array` containing the encoded bytes.

### textEncoder.encoding

* {string}

La codificación soportada por la instancia `TextEncoder`. Siempre configurado para `'utf-8'`.

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

* `value` {any}
* Devuelve: {boolean}

Returns `true` if the value is a built-in [`ArrayBuffer`][] or [`SharedArrayBuffer`][] instance.

See also [`util.types.isArrayBuffer()`][] and [`util.types.isSharedArrayBuffer()`][].

```js
util.types.isAnyArrayBuffer(new ArrayBuffer());  // Devuelve true
util.types.isAnyArrayBuffer(new SharedArrayBuffer());  // Devuelve true
```

### util.types.isArgumentsObject(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es un objeto de `arguments`.

```js
function foo() {
  util.types.isArgumentsObject(arguments);  // Devuelve true
}
```

### util.types.isArrayBuffer(value)<!-- YAML
added: v10.0.0
-->

* `value` {any}

* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`ArrayBuffer`][] incorporada. Esto *no* incluye instancias [`SharedArrayBuffer`][]. Usually, it is desirable to test for both; See [`util.types.isAnyArrayBuffer()`][] for that.

```js
util.types.isArrayBuffer(new ArrayBuffer());  // Devuelve true
util.types.isArrayBuffer(new SharedArrayBuffer());  // Devuelve false
```

### util.types.isAsyncFunction(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una [función asíncrona](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function). Note that this only reports back what the JavaScript engine is seeing; in particular, the return value may not match the original source code if a transpilation tool was used.

```js
util.types.isAsyncFunction(function foo() {});  // Devuelve false
util.types.isAsyncFunction(async function foo() {});  // Devuelve true
```

### util.types.isBigInt64Array(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Returns `true` if the value is a `BigInt64Array` instance.

```js
util.types.isBigInt64Array(new BigInt64Array());   // Returns true
util.types.isBigInt64Array(new BigUint64Array());  // Returns false
```

### util.types.isBigUint64Array(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Returns `true` if the value is a `BigUint64Array` instance.

```js
util.types.isBigUint64Array(new BigInt64Array());   // Returns false
util.types.isBigUint64Array(new BigUint64Array());  // Returns true
```

### util.types.isBooleanObject(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Returns `true` if the value is a boolean object, e.g. created by `new Boolean()`.

```js
util.types.isBooleanObject(false);  // Returns false
util.types.isBooleanObject(true);   // Returns false
util.types.isBooleanObject(new Boolean(false)); // Returns true
util.types.isBooleanObject(new Boolean(true));  // Returns true
util.types.isBooleanObject(Boolean(false)); // Returns false
util.types.isBooleanObject(Boolean(true));  // Returns false
```

### util.types.isBoxedPrimitive(value)<!-- YAML
added: v10.11.0
-->

* `value` {any}

* Devuelve: {boolean}

Returns `true` if the value is any boxed primitive object, e.g. created by `new Boolean()`, `new String()` or `Object(Symbol())`.

For example:

```js
util.types.isBoxedPrimitive(false); // Returns false
util.types.isBoxedPrimitive(new Boolean(false)); // Returns true
util.types.isBoxedPrimitive(Symbol('foo')); // Returns false
util.types.isBoxedPrimitive(Object(Symbol('foo'))); // Returns true
util.types.isBoxedPrimitive(Object(BigInt(5))); // Returns true
```

### util.types.isDataView(value)<!-- YAML
added: v10.0.0
-->

* `value` {any}

* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`DataView`][] incorporada.

```js
const ab = new ArrayBuffer(20);
util.types.isDataView(new DataView(ab));  // Devuelve true
util.types.isDataView(new Float64Array());  // Devuelve false
```

Ver también [`ArrayBuffer.isView()`][].

### util.types.isDate(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Date`][] incorporada.

```js
util.types.isDate(new Date());  // Devuelve true
```

### util.types.isExternal(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es un valor `External` nativo.

### util.types.isFloat32Array(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Float32Array`][] incorporada.

```js
util.types.isFloat32Array(new ArrayBuffer());  // Devuelve false
util.types.isFloat32Array(new Float32Array());  // Devuelve  true
util.types.isFloat32Array(new Float64Array());  // Devuelve false
```

### util.types.isFloat64Array(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Float64Array`][] incorporada.

```js
util.types.isFloat64Array(new ArrayBuffer());  // Devuelve false
util.types.isFloat64Array(new Uint8Array());  // Devuelve  false
util.types.isFloat64Array(new Float64Array());  // Devuelve true
```

### util.types.isGeneratorFunction(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una función generadora. Note that this only reports back what the JavaScript engine is seeing; in particular, the return value may not match the original source code if a transpilation tool was used.

```js
util.types.isGeneratorFunction(function foo() {});  // Devuelve false
util.types.isGeneratorFunction(function* foo() {});  // Devuelve true
```

### util.types.isGeneratorObject(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Returns `true` if the value is a generator object as returned from a built-in generator function. Note that this only reports back what the JavaScript engine is seeing; in particular, the return value may not match the original source code if a transpilation tool was used.

```js
function* foo() {}
const generator = foo();
util.types.isGeneratorObject(generator);  // Devuelve true
```

### util.types.isInt8Array(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Int8Array`][] incorporada.

```js
util.types.isInt8Array(new ArrayBuffer());  // Devuelve false
util.types.isInt8Array(new Int8Array());  // Devuelve  true
util.types.isInt8Array(new Float64Array());  // Devuelve false
```

### util.types.isInt16Array(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Int16Array`][] incorporada.

```js
util.types.isInt16Array(new ArrayBuffer());  // Devuelve false
util.types.isInt16Array(new Int16Array());  // Devuelve true
util.types.isInt16Array(new Float64Array());  // Devuelve false
```

### util.types.isInt32Array(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Int32Array`][] incorporada.

```js
util.types.isInt32Array(new ArrayBuffer());  // Devuelve false
util.types.isInt32Array(new Int32Array());  // Devuelve true
util.types.isInt32Array(new Float64Array());  // Devuelve false
```

### util.types.isMap(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Map`][] incorporada.

```js
util.types.isMap(new Map());  // Devuelve true
```

### util.types.isMapIterator(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Returns `true` if the value is an iterator returned for a built-in [`Map`][] instance.

```js
const map = new Map();
util.types.isMapIterator(map.keys());  // Devuelve true
util.types.isMapIterator(map.values());  // Devuelve true
util.types.isMapIterator(map.entries());  // Devuelve true
util.types.isMapIterator(map[Symbol.iterator]());  // Devuelve true
```

### util.types.isModuleNamespaceObject(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Returns `true` if the value is an instance of a [Module Namespace Object](https://tc39.github.io/ecma262/#sec-module-namespace-exotic-objects).

```js
import * as ns from './a.js';

util.types.isModuleNamespaceObject(ns);  // Returns true
```

### util.types.isNativeError(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia del tipo [`Error`][] incorporado.

```js
util.types.isNativeError(new Error());  // Devuelve true
util.types.isNativeError(new TypeError());  // Devuelve true
util.types.isNativeError(new RangeError());  // Devuelve true
```

### util.types.isNumberObject(value)<!-- YAML
added: v10.0.0
-->

* `value` {any}

* Devuelve: {boolean}

Returns `true` if the value is a number object, e.g. created by `new Number()`.

```js
util.types.isNumberObject(0);  // Devuelve false
util.types.isNumberObject(new Number(0));   // Devuelve true
```

### util.types.isPromise(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una [`Promise`][] incorporada.

```js
util.types.isPromise(Promise.resolve(42));  // Devuelve true
```

### util.types.isProxy(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Proxy`][].

```js
const target = {};
const proxy = new Proxy(target, {});
util.types.isProxy(target);  // Devuelve false
util.types.isProxy(proxy);  // Devuelve true
```

### util.types.isRegExp(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es un objeto de expresión regular.

```js
util.types.isRegExp(/abc/);  // Devuelve true
util.types.isRegExp(new RegExp('abc'));  // Devuelve true
```

### util.types.isSet(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Set`][] incorporada.

```js
util.types.isSet(new Set());  // Devuelve true
```

### util.types.isSetIterator(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Returns `true` if the value is an iterator returned for a built-in [`Set`][] instance.

```js
const set = new Set();
util.types.isSetIterator(set.keys());  // Devuelve true
util.types.isSetIterator(set.values());  // Devuelve true
util.types.isSetIterator(set.entries());  // Devuelve true
util.types.isSetIterator(set[Symbol.iterator]());  // Devuelve true
```

### util.types.isSharedArrayBuffer(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`SharedArrayBuffer`][] incorporada. Esto *no* incluye a instancias [`ArrayBuffer`][]. Usually, it is desirable to test for both; See [`util.types.isAnyArrayBuffer()`][] for that.

```js
util.types.isSharedArrayBuffer(new ArrayBuffer());  // Devuelve false
util.types.isSharedArrayBuffer(new SharedArrayBuffer());  // Devuelve true
```

### util.types.isStringObject(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Returns `true` if the value is a string object, e.g. created by `new String()`.

```js
util.types.isStringObject('foo');  // Devuelve false
util.types.isStringObject(new String('foo'));   // Devuelve true
```

### util.types.isSymbolObject(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Returns `true` if the value is a symbol object, created by calling `Object()` on a `Symbol` primitive.

```js
const symbol = Symbol('foo');
util.types.isSymbolObject(symbol);  // Devuelve false
util.types.isSymbolObject(Object(symbol));   // Devuelve true
```

### util.types.isTypedArray(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`TypedArray`][] incorporada.

```js
util.types.isTypedArray(new ArrayBuffer());  // Devuelve false
util.types.isTypedArray(new Uint8Array());  // Devuelve true
util.types.isTypedArray(new Float64Array());  // Devuelve true
```

Ver también [`ArrayBuffer.isView()`][].

### util.types.isUint8Array(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Uint8Array`][] incorporada.

```js
util.types.isUint8Array(new ArrayBuffer());  // Devuelve false
util.types.isUint8Array(new Uint8Array());  // Devuelve true
util.types.isUint8Array(new Float64Array());  // Devuelve false
```

### util.types.isUint8ClampedArray(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Uint8ClampedArray`][] incorporada.

```js
util.types.isUint8ClampedArray(new ArrayBuffer());  // Devuelve false
util.types.isUint8ClampedArray(new Uint8ClampedArray());  // Devuelve true
util.types.isUint8ClampedArray(new Float64Array());  // Devuelve false
```

### util.types.isUint16Array(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Uint16Array`][] incorporada.

```js
util.types.isUint16Array(new ArrayBuffer());  // Devuelve false
util.types.isUint16Array(new Uint16Array());  // Devuelve true
util.types.isUint16Array(new Float64Array());  // Devuelve false
```

### util.types.isUint32Array(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Uint32Array`][] incorporada.

```js
util.types.isUint32Array(new ArrayBuffer());  // Devuelve false
util.types.isUint32Array(new Uint32Array());  // Devuelve true
util.types.isUint32Array(new Float64Array());  // Devuelve false
```

### util.types.isWeakMap(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`WeakMap`][] incorporada.

```js
util.types.isWeakMap(new WeakMap());  // Devuelve true
```

### util.types.isWeakSet(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`WeakSet`][] incorporada.

```js
util.types.isWeakSet(new WeakSet());  // Devuelve true
```

### util.types.isWebAssemblyCompiledModule(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`WebAssembly.Module`][] incorporada.

```js
const module = new WebAssembly.Module(wasmBuffer);
util.types.isWebAssemblyCompiledModule(module);  // Devuelve true
```

## APIs Desaprobadas

The following APIs are deprecated and should no longer be used. Existing applications and modules should be updated to find alternative approaches.

### util.\_extend(target, source)<!-- YAML
added: v0.7.5
deprecated: v6.0.0
-->

* `target` {Object}

* `source` {Object}

> Estabilidad: 0 - Desaprobado: En cambio, use [`Object.assign()`].

The `util._extend()` method was never intended to be used outside of internal Node.js modules. De todas maneras, la comunidad lo encontró y lo usó.

Está desaprobado y no debería ser usado en código nuevo. JavaScript comes with very similar built-in functionality through [`Object.assign()`].

### util.debug(string)<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->> Stability: 0 - Deprecated: Use [

`console.error()`][] instead.

* `string` {string} El mensaje para imprimir en `stderr`

Predecesor desaprobado de `console.error`.

### util.error([...strings])<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->> Stability: 0 - Deprecated: Use [

`console.error()`][] instead.

* `...strings` {string} El mensaje para imprimir en `stderr`

Predecesor desaprobado de `console.error`.

### util.isArray(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use [

`Array.isArray()`][] instead.

* `object` {any}
* Devuelve: {boolean}

Alias para [`Array.isArray()`][].

Devuelve `true` si el `object` dado es un `Array`. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isArray([]);
// Devuelve: true
util.isArray(new Array());
// Devuelve: true
util.isArray({});
// Devuelve: false
```

### util.isBoolean(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use 

`typeof value === 'boolean'` instead.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es un `Boolean`. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isBoolean(1);
// Devuelve: false
util.isBoolean(0);
// Devuelve: false
util.isBoolean(false);
// Devuelve: true
```

### util.isBuffer(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use [

`Buffer.isBuffer()`][] instead.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es un `Buffer`. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isBuffer({ length: 0 });
// Devuelve: false
util.isBuffer([]);
// Devuelve: false
util.isBuffer(Buffer.from('hello world'));
// Devuelve: true
```

### util.isDate(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use [

`util.types.isDate()`][] instead.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` es una `Date`. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isDate(new Date());
// Devuelve: true
util.isDate(Date());
// false (sin 'new' devuelve un String)
util.isDate({});
// Devuelve: false
```

### util.isError(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use [

`util.types.isNativeError()`][] instead.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es un [`Error`][]. De lo contrario, devuelve `false`.

```js
const util = require('util');

util.isError(new Error());
// Devuelve: true
util.isError(new TypeError());
// Devuelve: true
util.isError({ name: 'Error', message: 'an error occurred' });
// Devuelve: false
```

Tenga en cuenta que este método depende del comportamiento de `Object.prototype.toString()`. It is possible to obtain an incorrect result when the `object` argument manipulates `@@toStringTag`.

```js
const util = require('util');
const obj = { name: 'Error', message: 'an error occurred' };

util.isError(obj);
// Devuelve: false
obj[Symbol.toStringTag] = 'Error';
util.isError(obj);
// Devuelve: true
```

### util.isFunction(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use 

`typeof value === 'function'` instead.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es una `Function`. De lo contrario, devuelve `false`.

```js
const util = require('util');

function Foo() {}
const Bar = () => {};

util.isFunction({});
// Devuelve: false
util.isFunction(Foo);
// Devuelve: true
util.isFunction(Bar);
// Devuelve: true
```

### util.isNull(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use 

`value === null` instead.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` es estrictamente `null`. De lo contrario, devuelve `false`.

```js
const util = require('util');

util.isNull(0);
// Devuelve: false
util.isNull(undefined);
// Devuelve: false
util.isNull(null);
// Devuelve: true
```

### util.isNullOrUndefined(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `value === undefined || value === null` instead.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es `null` o `undefined`. De lo contrario, devuelve `false`.

```js
const util = require('util');

util.isNullOrUndefined(0);
// Devuelve: false
util.isNullOrUndefined(undefined);
// Devuelve: true
util.isNullOrUndefined(null);
// Devuelve: true
```

### util.isNumber(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `typeof value === 'number'` instead.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es un `Number`. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isNumber(false);
// Devuelve: false
util.isNumber(Infinity);
// Devuelve: true
util.isNumber(0);
// Devuelve: true
util.isNumber(NaN);
// Devuelve: true
```

### util.isObject(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `value !== null && typeof value === 'object'` instead.

* `object` {any}
* Devuelve: {boolean}

Returns `true` if the given `object` is strictly an `Object` **and** not a `Function` (even though functions are objects in JavaScript). De otra manera, devuelve `false`.

```js
const util = require('util');

util.isObject(5);
// Devuelve: false
util.isObject(null);
// Devuelve: false
util.isObject({});
// Devuelve: true
util.isObject(() => {});
// Devuelve: false
```

### util.isPrimitive(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `(typeof value !== 'object' && typeof value !== 'function') || value === null` instead.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es de un tipo primitivo. De lo contrario, devuelve `false`.

```js
const util = require('util');

util.isPrimitive(5);
// Devuelve: true
util.isPrimitive('foo');
// Devuelve: true
util.isPrimitive(false);
// Devuelve: true
util.isPrimitive(null);
// Devuelve: true
util.isPrimitive(undefined);
// Devuelve: true
util.isPrimitive({});
// Devuelve: false
util.isPrimitive(() => {});
// Devuelve: false
util.isPrimitive(/^$/);
// Devuelve: false
util.isPrimitive(new Date());
// Devuelve: false
```

### util.isRegExp(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Stability: 0 - Deprecated

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es un `RegExp`. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isRegExp(/some regexp/);
// Devuelve: true
util.isRegExp(new RegExp('another regexp'));
// Devuelve: true
util.isRegExp({});
// Devuelve: false
```

### util.isString(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `typeof value === 'string'` instead.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es un `string`. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isString('');
// Devuelve: true
util.isString('foo');
// Devuelve: true
util.isString(String('foo'));
// Devuelve: true
util.isString(5);
// Devuelve: false
```

### util.isSymbol(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use 

`typeof value === 'symbol'` instead.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es un `Symbol`. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isSymbol(5);
// Devuelve: false
util.isSymbol('foo');
// Devuelve: false
util.isSymbol(Symbol('foo'));
// Devuelve: true
```

### util.isUndefined(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `value === undefined` instead.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es `undefined`. De otra manera, devuelve `false`.

```js
const util = require('util');

const foo = undefined;
util.isUndefined(5);
// Devuelve: false
util.isUndefined(foo);
// Devuelve: true
util.isUndefined(null);
// Devuelve: false
```

### util.log(string)<!-- YAML
added: v0.3.0
deprecated: v6.0.0
-->> Stability: 0 - Deprecated: Use a third party module instead.

* `string` {string}

The `util.log()` method prints the given `string` to `stdout` with an included timestamp.

```js
const util = require('util');

util.log('Timestamped message.');
```

### util.print([...strings])<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->> Stability: 0 - Deprecated: Use [

`console.log()`][] instead.

Predecesor desaprobado de `console.log`.

### util.puts([...strings])<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->> Stability: 0 - Deprecated: Use [

`console.log()`][] instead.

Predecesor desaprobado de `console.log`.