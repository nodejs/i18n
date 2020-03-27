# Util

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

The `util` module supports the needs of Node.js internal APIs. Many of the utilities are useful for application and module developers as well. To access it:

```js
const util = require('util');
```

## `util.callbackify(original)`
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

Imprimirá:

```txt
hello world
```

El callback es ejecutado asincrónicamente, y tendrá un stack trace limitado. If the callback throws, the process will emit an [`'uncaughtException'`][] event, and if not handled will exit.

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

## `util.debuglog(section)`
<!-- YAML
added: v0.11.3
-->

* `section` {string} Una string identificando la porción de la aplicación para la cual la función `debuglog` está siendo creada.
* Devuelve: {Function} La función de registro

El método `util.debuglog()` es utilizado para crear una función que condicionalmente escribe mensajes de depuración para `stderr` basándose en la existencia de la variable de entorno `NODE_DEBUG`. Si el nombre de la `section` aparece dentro del valor de esa variable de entorno, entonces la función devuelta opera de manera similar a [`console.error()`][]. Si no, entonces la función devuelta es una no-op.

```js
const util = require('util');
const debuglog = util.debuglog('foo');

debuglog('hello from foo [%d]', 123);
```

Si este programa se ejecuta con `NODE_DEBUG=foo` en el entorno, entonces el resultado será algo como:

```txt
FOO 3245: hello from foo [123]
```

donde `3245` es la identificación del proceso. Si no es ejecutado con ese conjunto de variables de entorno, entonces no imprimirá nada.

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

## `util.deprecate(fn, msg[, code])`
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
fn1(); // Emits a deprecation warning with code DEP0001
fn2(); // Does not emit a deprecation warning because it has the same code
```

If either the `--no-deprecation` or `--no-warnings` command line flags are used, or if the `process.noDeprecation` property is set to `true` *prior* to the first deprecation warning, the `util.deprecate()` method does nothing.

Si las banderas de línea de comandos `--trace-deprecation` o `--trace-warnings` están establecidas, o la propiedad `process.traceDeprecation` está establecida como `true`, una advertencia y un stack trace son impresos a `stderr` la primera vez que la función desaprobada sea llamada.

Si la bandera de línea de comandos `--throw-deprecation` está establecida, o la propiedad `process.throwDeprecation` está establecida en `true`, entonces una excepción va a ser arrojada cuando la función desaprobada sea llamada.

La bandera de línea de comandos `--throw-deprecation` y la propiedad `process.throwDeprecation` tienen prioridad sobre `--trace-deprecation` y `process.traceDeprecation`.

## `util.format(format[, ...args])`
<!-- YAML
added: v0.5.3
changes:
  - version: v12.11.0
    pr-url: https://github.com/nodejs/node/pull/29606
    description: The `%c` specifier is ignored now.
  - version: v11.4.0
    pr-url: https://github.com/nodejs/node/pull/23708
    description: The `%d`, `%f` and `%i` specifiers now support Symbols
                 properly.
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/23162
    description: The `format` argument is now only taken as such if it actually
                 contains format specifiers.
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/23162
    description: If the `format` argument is not a format string, the output
                 string's formatting is no longer dependent on the type of the
                 first argument. This change removes previously present quotes
                 from strings that were being output when the first argument
                 was not a string.
  - version: v11.4.0
    pr-url: https://github.com/nodejs/node/pull/24806
    description: The `%o` specifier's `depth` has default depth of 4 again.
  - version: v11.0.0
    pr-url: https://github.com/nodejs/node/pull/17907
    description: The `%o` specifier's `depth` option will now fall back to the
                 default depth.
  - version: v10.12.0
    pr-url: https://github.com/nodejs/node/pull/22097
    description: The `%d` and `%i` specifiers now support BigInt.
  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14558
    description: The `%o` and `%O` specifiers are supported now.
-->

* `format` {string} Un formato de string parecido a `printf`.

The `util.format()` method returns a formatted string using the first argument as a `printf`-like format string which can contain zero or more format specifiers. Each specifier is replaced with the converted value from the corresponding argument. Supported specifiers are:

* `%s`: `String` will be used to convert all values except `BigInt`, `Object` and `-0`. `BigInt` values will be represented with an `n` and Objects that have no user defined `toString` function are inspected using `util.inspect()` with options `{ depth: 0, colors: false, compact: 3 }`.
* `%d`: `Number` will be used to convert all values except `BigInt` and `Symbol`.
* `%i`: `parseInt(value, 10)` is used for all values except `BigInt` and `Symbol`.
* `%f`: `parseFloat(value)` is used for all values expect `Symbol`.
* `%j`: JSON. Replaced with the string `'[Circular]'` if the argument contains circular references.
* `%o`: `Object`. A string representation of an object with generic JavaScript object formatting. Similar to `util.inspect()` with options `{ showHidden: true, showProxy: true }`. This will show the full object including non-enumerable properties and proxies.
* `%O`: `Object`. A string representation of an object with generic JavaScript object formatting. Similar a `util.inspect()` sin opciones. This will show the full object not including non-enumerable properties and proxies.
* `%c`: `CSS`. This specifier is currently ignored, and will skip any CSS passed in.
* `%%`: single percent sign (`'%'`). Esto no consume un argumento.
* Retorna: {string} El string con formato

If a specifier does not have a corresponding argument, it is not replaced:

```js
util.format('%s:%s', 'foo');
// Devuelve: 'foo:%s'
```

Values that are not part of the format string are formatted using `util.inspect()` if their type is not `string`.

If there are more arguments passed to the `util.format()` method than the number of specifiers, the extra arguments are concatenated to the returned string, separated by spaces:

```js
util.format('%s:%s', 'foo', 'bar', 'baz');
// Returns: 'foo:bar baz'
```

If the first argument does not contain a valid format specifier, `util.format()` returns a string that is the concatenation of all arguments separated by spaces:

```js
util.format(1, 2, 3);
// Returns: '1 2 3'
```

If only one argument is passed to `util.format()`, it is returned as it is without any formatting:

```js
util.format('%% %s');
// Returns: '%% %s'
```

`util.format()` is a synchronous method that is intended as a debugging tool. Some input values can have a significant performance overhead that can block the event loop. Use this function with care and never in a hot code path.

## `util.formatWithOptions(inspectOptions, format[, ...args])`
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

## `util.getSystemErrorName(err)`
<!-- YAML
added: v9.7.0
-->

* `err` {number}
* Devuelve: {string}

Retorna un nombre de string por un código de error numérico que viene de una API de Node.js. El mapeo entre códigos de error y nombres de error es dependiente de la plataforma. Vea [Errores Comunes del Sistema](errors.html#errors_common_system_errors) para los nombres de los errores comunes.

```js
fs.access('file/that/does/not/exist', (err) => {
  const name = util.getSystemErrorName(err.errno);
  console.error(name);  // ENOENT
});
```

## `util.inherits(constructor, superConstructor)`
<!-- YAML
added: v0.3.0
changes:
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3455
    description: The `constructor` parameter can refer to an ES6 class now.
-->

* `constructor` {Function}
* `superConstructor` {Function}

El uso de `util.inherits()` está desalentado. Por favor, utilice la `clase` ES6 y `extienda` palabras clave para obtener soporte de herencia de nivel de lenguaje. Also note that the two styles are [semantically incompatible](https://github.com/nodejs/node/issues/4179).

Herede los métodos prototipo de un [constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/constructor) a otro. El prototipo del `constructor` se establecerá en un nuevo objeto creado a partir de `superConstructor`.

This mainly adds some input validation on top of `Object.setPrototypeOf(constructor.prototype, superConstructor.prototype)`. Como una conveniencia adicional, `superConstructor` será accesible por medio de la propiedad `constructor.super_`.

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

## `util.inspect(object[, options])`
## `util.inspect(object[, showHidden[, depth[, colors]]])`
<!-- YAML
added: v0.3.0
changes:
  - version: v13.5.0
    pr-url: https://github.com/nodejs/node/pull/30768
    description: User defined prototype properties are inspected in case
                 `showHidden` is `true`.
  - version: v13.0.0
    pr-url: https://github.com/nodejs/node/pull/27685
    description: Circular references now include a marker to the reference.
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/27109
    description: The `compact` options default is changed to `3` and the
                 `breakLength` options default is changed to `80`.
  - version: v11.11.0
    pr-url: https://github.com/nodejs/node/pull/26269
    description: The `compact` option accepts numbers for a new output mode.
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/24971
    description: Internal properties no longer appear in the context argument
                 of a custom inspection function.
  - version: v11.7.0
    pr-url: https://github.com/nodejs/node/pull/25006
    description: ArrayBuffers now also show their binary contents.
  - version: v11.5.0
    pr-url: https://github.com/nodejs/node/pull/24852
    description: The `getters` option is supported now.
  - version: v11.4.0
    pr-url: https://github.com/nodejs/node/pull/24326
    description: The `depth` default changed back to `2`.
  - version: v11.0.0
    pr-url: https://github.com/nodejs/node/pull/22846
    description: The `depth` default changed to `20`.
  - version: v10.12.0
    pr-url: https://github.com/nodejs/node/pull/22788
    description: The `sorted` option is supported now.
  - version: v11.0.0
    pr-url: https://github.com/nodejs/node/pull/22756
    description: The inspection output is now limited to about 128 MB. Data
                 above that size will not be fully inspected.
  - version: v10.6.0
    pr-url: https://github.com/nodejs/node/pull/20725
    description: Inspecting linked lists and similar objects is now possible
                 up to the maximum call stack size.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19259
    description: The `WeakMap` and `WeakSet` entries can now be inspected
                 as well.
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
  * `showHidden` {boolean} If `true`, `object`'s non-enumerable symbols and properties are included in the formatted result. [`WeakMap`][] and [`WeakSet`][] entries are also included as well as user defined prototype properties (excluding method properties). **Default:** `false`.
  * `depth` {number} Specifies the number of times to recurse while formatting `object`. This is useful for inspecting large objects. To recurse up to the maximum call stack size pass `Infinity` or `null`. **Default:** `2`.
  * `colors` {boolean} If `true`, the output is styled with ANSI color codes. Colors are customizable. See [Customizing `util.inspect` colors][]. **Default:** `false`.
  * `customInspect` {boolean} If `false`, `[util.inspect.custom](depth, opts)` functions are not invoked. **Default:** `true`.
  * `showProxy` {boolean} If `true`, `Proxy` inspection includes the [`target` and `handler`][] objects. **Default:** `false`.
  * `maxArrayLength` {integer} Specifies the maximum number of `Array`, [`TypedArray`][], [`WeakMap`][] and [`WeakSet`][] elements to include when formatting. Establecer a `null` o `Infinity` para mostrar todos los elementos. Set to `0` or negative to show no elements. **Default:** `100`.
  * `breakLength` {integer} The length at which input values are split across multiple lines. Set to `Infinity` to format the input as a single line (in combination with `compact` set to `true` or any number >= `1`). **Default:** `80`.
  * `compact` {boolean|integer} Setting this to `false` causes each object key to be displayed on a new line. It will also add new lines to text that is longer than `breakLength`. If set to a number, the most `n` inner elements are united on a single line as long as all properties fit into `breakLength`. Short array elements are also grouped together. No text will be reduced below 16 characters, no matter the `breakLength` size. For more information, see the example below. **Default:** `3`.
  * `sorted` {boolean|Function} If set to `true` or a function, all properties of an object, and `Set` and `Map` entries are sorted in the resulting string. If set to `true` the [default sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) is used. If set to a function, it is used as a [compare function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#Parameters).
  * `getters` {boolean|string} If set to `true`, getters are inspected. If set to `'get'`, only getters without a corresponding setter are inspected. If set to `'set'`, only getters with a corresponding setter are inspected. This might cause side effects depending on the getter function. **Default:** `false`.
* Returns: {string} The representation of `object`.

The `util.inspect()` method returns a string representation of `object` that is intended for debugging. The output of `util.inspect` may change at any time and should not be depended upon programmatically. Additional `options` may be passed that alter the result. `util.inspect()` will use the constructor's name and/or `@@toStringTag` to make an identifiable tag for an inspected value.

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

Circular references point to their anchor by using a reference index:

```js
const { inspect } = require('util');

const obj = {};
obj.a = [obj];
obj.b = {};
obj.b.inner = obj.b;
obj.b.obj = obj;

console.log(inspect(obj));
// <ref *1> {
//   a: [ [Circular *1] ],
//   b: <ref *2> { inner: [Circular *2], obj: [Circular *1] }
// }
```

El siguiente ejemplo inspecciona todas las propiedades del objeto `util`:

```js
const util = require('util');

console.log(util.inspect(util, { showHidden: true, depth: null }));
```

The following example highlights the effect of the `compact` option:

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

// { a:
//   [ 1,
//     2,
//     [ [ 'Lorem ipsum dolor sit amet, consectetur [...]', // A long line
//           'test',
//           'foo' ] ],
//     4 ],
//   b: Map(2) { 'za' => 1, 'zb' => 'test' } }

// Setting `compact` to false changes the output to be more reader friendly.
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
//   b: Map(2) {
//     'za' => 1,
//     'zb' => 'test'
//   }
// }

// Setting `breakLength` to e.g. 150 will print the "Lorem ipsum" text in a
// single line.
// Reducir el `breakLength` va a dividir el texto "Lorem ipsum" en pedazos 
// más pequeños.
```

The `showHidden` option allows [`WeakMap`][] and [`WeakSet`][] entries to be inspected. If there are more entries than `maxArrayLength`, there is no guarantee which entries are displayed. That means retrieving the same [`WeakSet`][] entries twice may result in different output. Furthermore, entries with no remaining strong references may be garbage collected at any time.

```js
const { inspect } = require('util');

const obj = { a: 1 };
const obj2 = { b: 2 };
const weakSet = new WeakSet([obj, obj2]);

console.log(inspect(weakSet, { showHidden: true }));
// WeakSet { { a: 1 }, { b: 2 } }
```

The `sorted` option ensures that an object's property insertion order does not impact the result of `util.inspect()`.

```js
const { inspect } = require('util');
const assert = require('assert');

const o1 = {
  b: [2, 3, 1],
  a: '`a` comes before `b`',
  c: new Set([2, 3, 1])
};
console.log(inspect(o1, { sorted: true }));
// { a: '`a` comes before `b`', b: [ 2, 3, 1 ], c: Set(3) { 1, 2, 3 } }
console.log(inspect(o1, { sorted: (a, b) => b.localeCompare(a) }));
// { c: Set(3) { 3, 2, 1 }, b: [ 2, 3, 1 ], a: '`a` comes before `b`' }

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

`util.inspect()` is a synchronous method intended for debugging. Its maximum output length is approximately 128 MB. Inputs that result in longer output will be truncated.

### Personalización de colores `util.inspect`

<!-- type=misc -->

El output de color (si está habilitado) de `util.inspect` es globalmente personalizable a través de las propiedades `util.inspect.styles` y `util.inspect.colors`.

`util.inspect.styles` es un mapa que asocia un nombre de estilo con un color de `util.inspect.colors`.

Los estilos predeterminados y colores asociados son:

* `bigint`: `yellow`
* `boolean`: `yellow`
* `date`: `magenta`
* `module`: `underline`
* `name`: (no styling)
* `null`: `bold`
* `number`: `yellow`
* `regexp`: `red`
* `special`: `cyan` (e.g., `Proxies`)
* `string`: `green`
* `symbol`: `green`
* `undefined`: `grey`

El estilo de color usa códigos de control ANSI que pueden no ser soportados en todas las terminales. To verify color support use [`tty.hasColors()`][].

Predefined control codes are listed below (grouped as "Modifiers", "Foreground colors", and "Background colors").

#### Modifiers

Modifier support varies throughout different terminals. They will mostly be ignored, if not supported.

* `reset` - Resets all (color) modifiers to their defaults
* **bold** - Make text bold
* _italic_ - Make text italic
* <span style="border-bottom: 1px;">underline</span> - Make text underlined
* ~~strikethrough~~ - Puts a horizontal line through the center of the text (Alias: `strikeThrough`, `crossedout`, `crossedOut`)
* `hidden` - Prints the text, but makes it invisible (Alias: conceal)
* <span style="opacity: 0.5;">dim</span> - Decreased color intensity (Alias: `faint`)
* <span style="border-top: 1px">overlined</span> - Make text overlined
* blink - Hides and shows the text in an interval
* <span style="filter: invert(100%)">inverse</span> - Swap foreground and background colors (Alias: `swapcolors`, `swapColors`)
* <span style="border-bottom: 1px double;">doubleunderline</span> - Make text double underlined (Alias: `doubleUnderline`)
* <span style="border: 1px">framed</span> - Draw a frame around the text

#### Foreground colors

* `black`
* `red`
* `green`
* `yellow`
* `blue`
* `magenta`
* `cyan`
* `white`
* `gray` (alias: `grey`, `blackBright`)
* `redBright`
* `greenBright`
* `yellowBright`
* `blueBright`
* `magentaBright`
* `cyanBright`
* `whiteBright`

#### Background colors

* `bgBlack`
* `bgRed`
* `bgGreen`
* `bgYellow`
* `bgBlue`
* `bgMagenta`
* `bgCyan`
* `bgWhite`
* `bgGray` (alias: `bgGrey`, `bgBlackBright`)
* `bgRedBright`
* `bgGreenBright`
* `bgYellowBright`
* `bgBlueBright`
* `bgMagentaBright`
* `bgCyanBright`
* `bgWhiteBright`

### Funciones de inspección personalizadas en Objetos

<!-- type=misc -->

Objects may also define their own [`[util.inspect.custom](depth, opts)`](#util_util_inspect_custom) function, which `util.inspect()` will invoke and use the result of when inspecting the object:

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

    // Cinco espacios de relleno porque ese el tamaño de "Box< ".
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

Las funciones personalizas de `[util.inspect.custom](depth, opts)` usualmente devuelven una string, pero pueden devolver un valor de cualquier tipo, que será formateado de acuerdo a `util.inspect()`.

```js
const util = require('util');

const obj = { foo: 'this will not show up in the inspect() output' };
obj[util.inspect.custom] = (depth) => {
  return { bar: 'baz' };
};

util.inspect(obj);
// Devuelve: "{ bar: 'baz' }"
```

### `util.inspect.custom`
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

### `util.inspect.defaultOptions`
<!-- YAML
added: v6.4.0
-->

El valor `defaultOptions` permite la personalización de las opciones predeterminadas utilizadas por `util.inspect`. Esto es útil para funciones como `console.log` o `util.format` que implícitamente llaman a `util.inspect`. Debería ser establecido en un objeto conteniendo una o más opciones [`util.inspect()`][] válidas. También se admite establecer directamente propiedades de opciones.

```js
const util = require('util');
const arr = Array(101).fill(0);

console.log(arr); // Logs the truncated array
util.inspect.defaultOptions.maxArrayLength = null;
console.log(arr); // logs the full array
```

## `util.isDeepStrictEqual(val1, val2)`
<!-- YAML
added: v9.0.0
-->

* `val1` {any}
* `val2` {any}
* Devuelve: {boolean}

Devuelve `true` si hay una estricta igualdad profunda entre `val1` and `val2`. De lo contrario, devuelve `false`.

See [`assert.deepStrictEqual()`][] for more information about deep strict equality.

## `util.promisify(original)`
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

Using `promisify()` on class methods or other methods that use `this` may not work as expected unless handled specially:

```js
const util = require('util');

class Foo {
  constructor() {
    this.a = 42;
  }

  bar(callback) {
    callback(null, this.a);
  }
}

const foo = new Foo();

const naiveBar = util.promisify(foo.bar);
// TypeError: Cannot read property 'a' of undefined
// naiveBar().then(a => console.log(a));

naiveBar.call(foo).then((a) => console.log(a)); // '42'

const bindBar = naiveBar.bind(foo);
bindBar().then((a) => console.log(a)); // '42'
```

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

For example, with a function that takes in `(foo, onSuccessCallback, onErrorCallback)`:

```js
doSomething[util.promisify.custom] = (foo) => {
  return new Promise((resolve, reject) => {
    doSomething(foo, resolve, reject);
  });
};
```

If `promisify.custom` is defined but is not a function, `promisify()` will throw an error.

### `util.promisify.custom`
<!-- YAML
added: v8.0.0
-->

* {symbol} that can be used to declare custom promisified variants of functions, see [Custom promisified functions](#util_custom_promisified_functions).

## Class: `util.TextDecoder`
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

Diferentes configuraciones de construcción de Node.js soportan diferentes conjuntos de codificaciones. (see [Internationalization](intl.html))

#### Encodings Supported by Default (With Full ICU Data)

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

#### Encodings Supported when Node.js is built with the `small-icu` option

| Codificación | Alias                           |
| ------------ | ------------------------------- |
| `'utf-8'`    | `'unicode-1-1-utf-8'`, `'utf8'` |
| `'utf-16le'` | `'utf-16'`                      |
| `'utf-16be'` |                                 |

#### Encodings Supported when ICU is disabled

| Codificación | Alias                           |
| ------------ | ------------------------------- |
| `'utf-8'`    | `'unicode-1-1-utf-8'`, `'utf8'` |
| `'utf-16le'` | `'utf-16'`                      |

The `'iso-8859-16'` encoding listed in the [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/) is not supported.

### `nuevo TextDecoder([encoding[, options]])`
<!-- YAML
added: v8.3.0
changes:
  - version: v11.0.0
    pr-url: v11.0.0
    description: The class is now available on the global object.
-->

* `encoding` {string} Identifies the `encoding` that this `TextDecoder` instance supports. **Default:** `'utf-8'`.
* `options` {Object}
  * `fatal` {boolean} `true` si las fallas de decodificación son fatales. This option is not supported when ICU is disabled (see [Internationalization](intl.html)). **Default:** `false`.
  * `ignoreBOM` {boolean} When `true`, the `TextDecoder` will include the byte order mark in the decoded result. When `false`, the byte order mark will be removed from the output. This option is only used when `encoding` is `'utf-8'`, `'utf-16be'` or `'utf-16le'`. **Default:** `false`.

Crea una nueva instancia `TextDecoder`. The `encoding` may specify one of the supported encodings or an alias.

The `TextDecoder` class is also available on the global object.

### `textDecoder.decode([input[, options]])`

* `input` {ArrayBuffer|DataView|TypedArray} An `ArrayBuffer`, `DataView` or `TypedArray` instance containing the encoded data.
* `options` {Object}
  * `stream` {boolean} `true` si pedazos adicionales de datos son esperados. **Default:** `false`.
* Devuelve: {string}

Decodifica el `input` y devuelve un string. If `options.stream` is `true`, any incomplete byte sequences occurring at the end of the `input` are buffered internally and emitted after the next call to `textDecoder.decode()`.

If `textDecoder.fatal` is `true`, decoding errors that occur will result in a `TypeError` being thrown.

### `textDecoder.encoding`

* {string}

La codificación soportada por la instancia `TextDecoder`.

### `textDecoder.fatal`

* {boolean}

The value will be `true` if decoding errors result in a `TypeError` being thrown.

### `textDecoder.ignoreBOM`

* {boolean}

The value will be `true` if the decoding result will include the byte order mark.

## Class: `util.TextEncoder`
<!-- YAML
added: v8.3.0
changes:
  - version: v11.0.0
    pr-url: v11.0.0
    description: The class is now available on the global object.
-->

Una implementación de la API `TextDecoder` del [Estándar de Codificación WHATWG](https://encoding.spec.whatwg.org/). All instances of `TextEncoder` only support UTF-8 encoding.

```js
const encoder = new TextEncoder();
const uint8array = encoder.encode('this is some data');
```

The `TextEncoder` class is also available on the global object.

### `textEncoder.encode([input])`

* `input` {string} El texto para codificar. **Default:** an empty string.
* Devuelve: {Uint8Array}

UTF-8 encodes the `input` string and returns a `Uint8Array` containing the encoded bytes.

### `textEncoder.encodeInto(src, dest)`

* `src` {string} The text to encode.
* `dest` {Uint8Array} The array to hold the encode result.
* Devuelve: {Object}
  * `read` {number} The read Unicode code units of src.
  * `written` {number} The written UTF-8 bytes of dest.

UTF-8 encodes the `src` string to the `dest` Uint8Array and returns an object containing the read Unicode code units and written UTF-8 bytes.

```js
const encoder = new TextEncoder();
const src = 'this is some data';
const dest = new Uint8Array(10);
const { read, written } = encoder.encodeInto(src, dest);
```

### `textEncoder.encoding`

* {string}

La codificación soportada por la instancia `TextEncoder`. Siempre configurado para `'utf-8'`.

## `util.types`
<!-- YAML
added: v10.0.0
-->

`util.types` provides type checks for different kinds of built-in objects. Unlike `instanceof` or `Object.prototype.toString.call(value)`, these checks do not inspect properties of the object that are accessible from JavaScript (like their prototype), and usually have the overhead of calling into C++.

The result generally does not make any guarantees about what kinds of properties or behavior a value exposes in JavaScript. They are primarily useful for addon developers who prefer to do type checking in JavaScript.

### `util.types.isAnyArrayBuffer(value)`
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

### `util.types.isArgumentsObject(value)`
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

### `util.types.isArrayBuffer(value)`<!-- YAML
added: v10.0.0
-->* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`ArrayBuffer`][] incorporada. This does *not* include [`SharedArrayBuffer`][] instances. Usually, it is desirable to test for both; See [`util.types.isAnyArrayBuffer()`][] for that.

```js
util.types.isArrayBuffer(new ArrayBuffer());  // Devuelve true
util.types.isArrayBuffer(new SharedArrayBuffer());  // Devuelve false
```

### `util.types.isAsyncFunction(value)`
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una [función asíncrona](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function). This only reports back what the JavaScript engine is seeing; in particular, the return value may not match the original source code if a transpilation tool was used.

```js
util.types.isAsyncFunction(function foo() {});  // Devuelve false
util.types.isAsyncFunction(async function foo() {});  // Devuelve true
```

### `util.types.isBigInt64Array(value)`
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

### `util.types.isBigUint64Array(value)`
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

### `util.types.isBooleanObject(value)`
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

### `util.types.isBoxedPrimitive(value)`<!-- YAML
added: v10.11.0
-->* `value` {any}
* Devuelve: {boolean}

Returns `true` if the value is any boxed primitive object, e.g. created by `new Boolean()`, `new String()` or `Object(Symbol())`.

Por ejemplo:

```js
util.types.isBoxedPrimitive(false); // Returns false
util.types.isBoxedPrimitive(new Boolean(false)); // Returns true
util.types.isBoxedPrimitive(Symbol('foo')); // Returns false
util.types.isBoxedPrimitive(Object(Symbol('foo'))); // Returns true
util.types.isBoxedPrimitive(Object(BigInt(5))); // Returns true
```

### `util.types.isDataView(value)`<!-- YAML
added: v10.0.0
-->* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`DataView`][] incorporada.

```js
const ab = new ArrayBuffer(20);
util.types.isDataView(new DataView(ab));  // Devuelve true
util.types.isDataView(new Float64Array());  // Devuelve false
```

Ver también [`ArrayBuffer.isView()`][].

### `util.types.isDate(value)`
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Date`][] incorporada.

```js
util.types.isDate(new Date());  // Devuelve true
```

### `util.types.isExternal(value)`
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es un valor `External` nativo.

A native `External` value is a special type of object that contains a raw C++ pointer (`void*`) for access from native code, and has no other properties. Such objects are created either by Node.js internals or native addons. In JavaScript, they are [frozen][`Object.freeze()`] objects with a `null` prototype.

```c
#include <js_native_api.h>
#include <stdlib.h>
napi_value result;
static napi_value MyNapi(napi_env env, napi_callback_info info) {
  int* raw = (int*) malloc(1024);
  napi_status status = napi_create_external(env, (void*) raw, NULL, NULL, &result);
  if (status != napi_ok) {
    napi_throw_error(env, NULL, "napi_create_external failed");
    return NULL;
  }
  return result;
}
...
DECLARE_NAPI_PROPERTY("myNapi", MyNapi)
...
```

```js
const native = require('napi_addon.node');
const data = native.myNapi();
util.types.isExternal(data); // returns true
util.types.isExternal(0); // returns false
util.types.isExternal(new String('foo')); // returns false
```

For further information on `napi_create_external`, refer to [`napi_create_external()`][].

### `util.types.isFloat32Array(value)`
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

### `util.types.isFloat64Array(value)`
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

### `util.types.isGeneratorFunction(value)`
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una función generadora. This only reports back what the JavaScript engine is seeing; in particular, the return value may not match the original source code if a transpilation tool was used.

```js
util.types.isGeneratorFunction(function foo() {});  // Devuelve false
util.types.isGeneratorFunction(function* foo() {});  // Devuelve true
```

### `util.types.isGeneratorObject(value)`
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Returns `true` if the value is a generator object as returned from a built-in generator function. This only reports back what the JavaScript engine is seeing; in particular, the return value may not match the original source code if a transpilation tool was used.

```js
function* foo() {}
const generator = foo();
util.types.isGeneratorObject(generator);  // Devuelve true
```

### `util.types.isInt8Array(value)`
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

### `util.types.isInt16Array(value)`
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

### `util.types.isInt32Array(value)`
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

### `util.types.isMap(value)`
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Map`][] incorporada.

```js
util.types.isMap(new Map());  // Devuelve true
```

### `util.types.isMapIterator(value)`
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

### `util.types.isModuleNamespaceObject(value)`
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

### `util.types.isNativeError(value)`
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

### `util.types.isNumberObject(value)`<!-- YAML
added: v10.0.0
-->* `value` {any}
* Devuelve: {boolean}

Returns `true` if the value is a number object, e.g. created by `new Number()`.

```js
util.types.isNumberObject(0);  // Devuelve false
util.types.isNumberObject(new Number(0));   // Devuelve true
```

### `util.types.isPromise(value)`
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una [`Promise`][] incorporada.

```js
util.types.isPromise(Promise.resolve(42));  // Devuelve true
```

### `util.types.isProxy(value)`
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

### `util.types.isRegExp(value)`
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

### `util.types.isSet(value)`
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Set`][] incorporada.

```js
util.types.isSet(new Set());  // Devuelve true
```

### `util.types.isSetIterator(value)`
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

### `util.types.isSharedArrayBuffer(value)`
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`SharedArrayBuffer`][] incorporada. This does *not* include [`ArrayBuffer`][] instances. Usually, it is desirable to test for both; See [`util.types.isAnyArrayBuffer()`][] for that.

```js
util.types.isSharedArrayBuffer(new ArrayBuffer());  // Devuelve false
util.types.isSharedArrayBuffer(new SharedArrayBuffer());  // Devuelve true
```

### `util.types.isStringObject(value)`
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

### `util.types.isSymbolObject(value)`
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

### `util.types.isTypedArray(value)`
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

### `util.types.isUint8Array(value)`
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

### `util.types.isUint8ClampedArray(value)`
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

### `util.types.isUint16Array(value)`
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

### `util.types.isUint32Array(value)`
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

### `util.types.isWeakMap(value)`
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`WeakMap`][] incorporada.

```js
util.types.isWeakMap(new WeakMap());  // Devuelve true
```

### `util.types.isWeakSet(value)`
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`WeakSet`][] incorporada.

```js
util.types.isWeakSet(new WeakSet());  // Devuelve true
```

### `util.types.isWebAssemblyCompiledModule(value)`
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

The following APIs are deprecated and should no longer be used. Las aplicaciones y módulos existentes deberían actualizarse para encontrar enfoques alternativos.

### `util._extend(target, source)`<!-- YAML
added: v0.7.5
deprecated: v6.0.0
-->> Stability: 0 - Deprecated: Use [`Object.assign()`][] instead.

* `target` {Object}
* `source` {Object}

El método `util._extend()` nunca fue pensado para ser utilizado fuera de los módulos internos de Node.js. La comunidad lo encontró y lo utilizó de todas maneras.

Está desaprobado y no debería utilizarse en códigos nuevos. JavaScript comes with very similar built-in functionality through [`Object.assign()`][].

### `util.isArray(object)`<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use [`Array.isArray()`][] instead.

* `object` {any}
* Devuelve: {boolean}

Alias para [`Array.isArray()`][].

Devuelve `true` si el `object` dado es un `Array`. De lo contrario, devuelve `false`.

```js
const util = require('util');

util.isArray([]);
// Devuelve: true
util.isArray(new Array());
// Devuelve: true
util.isArray({});
// Devuelve: false
```

### `util.isBoolean(object)`<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use `typeof value === 'boolean'` instead.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es un `Boolean`. De lo contrario, devuelve `false`.

```js
const util = require('util');

util.isBoolean(1);
// Devuelve: false
util.isBoolean(0);
// Devuelve: false
util.isBoolean(false);
// Devuelve: true
```

### `util.isBuffer(object)`<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Estabilidad: 0 - Desaprobado: Utilice [`Buffer.isBuffer()`][] en su lugar.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es un `Buffer`. De lo contrario, devuelve `false`.

```js
const util = require('util');

util.isBuffer({ length: 0 });
// Devuelve: false
util.isBuffer([]);
// Devuelve: false
util.isBuffer(Buffer.from('hello world'));
// Devuelve: true
```

### `util.isDate(object)`<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use [`util.types.isDate()`][] instead.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es una `Date`. De lo contrario, devuelve `false`.

```js
const util = require('util');

util.isDate(new Date());
// Devuelve: true
util.isDate(Date());
// false (sin 'new' devuelve un String)
util.isDate({});
// Devuelve: false
```

### `util.isError(object)`<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use [`util.types.isNativeError()`][] instead.

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

This method relies on `Object.prototype.toString()` behavior. Es posible obtener un resultado incorrecto cuando el argumento del `object` manipula a `@@toStringTag`.

```js
const util = require('util');
const obj = { name: 'Error', message: 'an error occurred' };

util.isError(obj);
// Devuelve: false
obj[Symbol.toStringTag] = 'Error';
util.isError(obj);
// Devuelve: true
```

### `util.isFunction(object)`<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use `typeof value === 'function'` instead.

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

### `util.isNull(object)`<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use `value === null` instead.

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

### `util.isNullOrUndefined(object)`
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

### `util.isNumber(object)`
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `typeof value === 'number'` instead.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es un `Number`. De lo contrario, devuelve `false`.

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

### `util.isObject(object)`
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `value !== null && typeof value === 'object'` instead.

* `object` {any}
* Devuelve: {boolean}

Returns `true` if the given `object` is strictly an `Object` **and** not a `Function` (even though functions are objects in JavaScript). De lo contrario, devuelve `false`.

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

### `util.isPrimitive(object)`
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `(typeof value !== 'object' && typeof value !== 'function') || value === null` instead.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es un tipo primitivo. De lo contrario, devuelve `false`.

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

### `util.isRegExp(object)`<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Estabilidad: 0 - Desaprobado

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es una `RegExp`. De lo contrario, devuelve `false`.

```js
const util = require('util');

util.isRegExp(/some regexp/);
// Devuelve: true
util.isRegExp(new RegExp('another regexp'));
// Devuelve: true
util.isRegExp({});
// Devuelve: false
```

### `util.isString(object)`
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `typeof value === 'string'` instead.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es una `string`. De lo contrario, devuelve `false`.

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

### `util.isSymbol(object)`<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use `typeof value === 'symbol'` instead.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es un `Symbol`. De lo contrario, devuelve `false`.

```js
const util = require('util');

util.isSymbol(5);
// Devuelve: false
util.isSymbol('foo');
// Devuelve: false
util.isSymbol(Symbol('foo'));
// Devuelve: true
```

### `util.isUndefined(object)`
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `value === undefined` instead.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es `undefined`. De lo contrario, devuelve `false`.

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

### `util.log(string)`<!-- YAML
added: v0.3.0
deprecated: v6.0.0
-->> Estabilidad: 0 - Desaprobado: Utilice un módulo de terceros en su lugar.

* `string` {string}

El método `util.log()` imprime la `string` dada en `stdout` con una marca de tiempo incluída.

```js
const util = require('util');

util.log('Timestamped message.');
```
