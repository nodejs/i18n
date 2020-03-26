# Util

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stabile

The `util` module is primarily designed to support the needs of Node.js' own internal APIs. However, many of the utilities are useful for application and module developers as well. Ci si può accedere utilizzando:

```js
const util = require('util');
```

## util.callbackify(original)

<!-- YAML
added: v8.2.0
-->

* `original` {Function} Una funzione `async`
* Restituisce: {Function} una funzione di tipo callback

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

Stamperà:

```txt
hello world
```

Il callback viene eseguito in modo asincrono e avrà una stack trace limitata. If the callback throws, the process will emit an [`'uncaughtException'`][] event, and if not handled will exit.

Since `null` has a special meaning as the first argument to a callback, if a wrapped function rejects a `Promise` with a falsy value as a reason, the value is wrapped in an `Error` with the original value stored in a field named `reason`.

```js
function fn() {
  return Promise.reject(null);
}
const callbackFunction = util.callbackify(fn);

callbackFunction((err, ret) => {
  // Quando la Promise è stata rifiutata con 'null' viene sottoposta al wrapping con un Error e
  // il valore originale viene memorizzato in `reason`.
  err && err.hasOwnProperty('reason') && err.reason === null;  // true
});
```

## util.debuglog(section)

<!-- YAML
added: v0.11.3
-->

* `section` {string} A string identifying the portion of the application for which the `debuglog` function is being created.
* Restituisce: {Function} La funzione di registrazione

The `util.debuglog()` method is used to create a function that conditionally writes debug messages to `stderr` based on the existence of the `NODE_DEBUG` environment variable. If the `section` name appears within the value of that environment variable, then the returned function operates similar to [`console.error()`][]. In caso contrario, la funzione restituita è un no-op.

```js
const util = require('util');
const debuglog = util.debuglog('foo');

debuglog('hello from foo [%d]', 123);
```

If this program is run with `NODE_DEBUG=foo` in the environment, then it will output something like:

```txt
FOO 3245: hello from foo [123]
```

in cui `3245` è l'id del processo. If it is not run with that environment variable set, then it will not print anything.

La `section` supporta inoltre il carattere jolly:

```js
const util = require('util');
const debuglog = util.debuglog('foo-bar');

debuglog('hi there, it\'s foo-bar [%d]', 2333);
```

if it is run with `NODE_DEBUG=foo*` in the environment, then it will output something like:

```txt
FOO-BAR 3257: hi there, it's foo-bar [2333]
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

* `fn` {Function} La funzione che viene deprecata.
* `msg` {string} A warning message to display when the deprecated function is invoked.
* `code` {string} Un codice di deprecazione. See the [list of deprecated APIs](deprecations.html#deprecations_list_of_deprecated_apis) for a list of codes.
* Restituisce: {Function} La funzione deprecata sottoposta al wrapping per emettere un avviso.

The `util.deprecate()` method wraps `fn` (which may be a function or class) in such a way that it is marked as deprecated.

```js
const util = require('util');

exports.obsoleteFunction = util.deprecate(() => {
  // Eseguire qualcosa qui.
}, 'obsoleteFunction() is deprecated. Use newShinyFunction() instead.');
```

When called, `util.deprecate()` will return a function that will emit a `DeprecationWarning` using the [`'warning'`][] event. The warning will be emitted and printed to `stderr` the first time the returned function is called. After the warning is emitted, the wrapped function is called without emitting a warning.

If the same optional `code` is supplied in multiple calls to `util.deprecate()`, the warning will be emitted only once for that `code`.

```js
const util = require('util');

const fn1 = util.deprecate(someFunction, someMessage, 'DEP0001');
const fn2 = util.deprecate(someOtherFunction, someOtherMessage, 'DEP0001');
fn1(); // emette un avviso di deprecazione con codice DEP0001
fn2(); // non emette un avviso di deprecazione perché ha lo stesso codice
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

* `format` {string} Una stringa di formato simile a `printf`.

The `util.format()` method returns a formatted string using the first argument as a `printf`-like format.

Il primo argomento è una stringa contenente zero o più token *segnaposto*. Each placeholder token is replaced with the converted value from the corresponding argument. I segnaposto supportati sono:

* `%s` - `String`.
* `%d` - `Number` (integer or floating point value) or `BigInt`.
* `%i` - Integer or `BigInt`.
* `%f` - Valore in virgola mobile.
* `%j` - JSON. Replaced with the string `'[Circular]'` if the argument contains circular references.
* `%o` - `Object`. A string representation of an object with generic JavaScript object formatting. Similar to `util.inspect()` with options `{ showHidden: true, showProxy: true }`. This will show the full object including non-enumerable properties and proxies.
* `%O` - `Object`. A string representation of an object with generic JavaScript object formatting. Simile a `util.inspect()` senza opzioni. This will show the full object not including non-enumerable properties and proxies.
* `%%` - singolo segno di percentuale (`'%'`). Non consuma un argomento.
* Restituisce: {string} La stringa formattata

If the placeholder does not have a corresponding argument, the placeholder is not replaced.

```js
util.format('%s:%s', 'foo');
// Restituisce: 'foo:%s'
```

If there are more arguments passed to the `util.format()` method than the number of placeholders, the extra arguments are coerced into strings then concatenated to the returned string, each delimited by a space. Excessive arguments whose `typeof` is `'object'` or `'symbol'` (except `null`) will be transformed by `util.inspect()`.

```js
util.format('%s:%s', 'foo', 'bar', 'baz'); // 'foo:bar baz'
```

If the first argument is not a string then `util.format()` returns a string that is the concatenation of all arguments separated by spaces. Ogni argomento viene convertito in una stringa utilizzando `util.inspect()`.

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
// Restituisce 'See object { foo: 42 }', in cui `42` è colorato come un numero
// quando viene stampato su un terminale.
```

## util.getSystemErrorName(err)

<!-- YAML
added: v9.7.0
-->

* `err` {number}
* Restituisce: {string}

Restituisce il nome della stringa per un codice di errore numerico proveniente da un'API di Node.js. Il mapping tra codici di errore e nomi di errore è dipendente dalla piattaforma. Vedere [Errori di Sistema Comuni](errors.html#errors_common_system_errors) per i nomi degli errori comuni.

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

L'utilizzo di `util.inherits()` è sconsigliato. Please use the ES6 `class` and `extends` keywords to get language level inheritance support. Also note that the two styles are [semantically incompatible](https://github.com/nodejs/node/issues/4179).

Ereditano i metodi del prototipo da un [constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/constructor) all'altro. The prototype of `constructor` will be set to a new object created from `superConstructor`.

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

Esempio di ES6 utilizzando la `class` ed `extends`:

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

* `object` {any} Qualsiasi dato primitivo o `Object` di JavaScript.
* `options` {Object} 
  * `showHidden` {boolean} If `true`, the `object`'s non-enumerable symbols and properties will be included in the formatted result as well as [`WeakMap`][] and [`WeakSet`][] entries. **Default:** `false`.
  * `depth` {number} Specifies the number of times to recurse while formatting the `object`. È utile per ispezionare object complicati di grandi dimensioni. To make it recurse up to the maximum call stack size pass `Infinity` or `null`. **Default:** `2`.
  * `colors` {boolean} If `true`, the output will be styled with ANSI color codes. I colori sono personalizzabili, vedi [Customizing `util.inspect` colors][]. **Default:** `false`.
  * `customInspect` {boolean} If `false`, then custom `inspect(depth, opts)` functions will not be called. **Default:** `true`.
  * `showProxy` {boolean} If `true`, then objects and functions that are `Proxy` objects will be introspected to show their `target` and `handler` objects. **Default:** `false`.
  * `maxArrayLength` {number} Specifies the maximum number of `Array`, [`TypedArray`][], [`WeakMap`][] and [`WeakSet`][] elements to include when formatting. Impostare su `null` o `Infinity` per mostrare tutti gli elementi. Set to `0` or negative to show no elements. **Default:** `100`.
  * `breakLength` {number} The length at which an object's keys are split across multiple lines. Set to `Infinity` to format an object as a single line. **Default:** `60` per la compatibilità legacy.
  * `compact` {boolean} Setting this to `false` changes the default indentation to use a line break for each object key instead of lining up multiple properties in one line. It will also break text that is above the `breakLength` size into smaller and better readable chunks and indents objects the same as arrays. Note that no text will be reduced below 16 characters, no matter the `breakLength` size. For more information, see the example below. **Default:** `true`.
  * `sorted` {boolean|Function} If set to `true` or a function, all properties of an object and Set and Map entries will be sorted in the returned string. If set to `true` the [default sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) is going to be used. If set to a function, it is used as a [compare function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#Parameters).
* Restituisce: {string} La rappresentazione dell'object passato

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

L'esempio seguente ispeziona tutte le proprietà dell'`util` object:

```js
const util = require('util');

console.log(util.inspect(util, { showHidden: true, depth: null }));
```

Values may supply their own custom `inspect(depth, opts)` functions, when called these receive the current `depth` in the recursive inspection, as well as the options object passed to `util.inspect()`.

L'esempio seguente evidenzia la differenza con l'opzione `compact`:

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

// Questo stamperà

// { a:
//   [ 1,
//     2,
//     [ [ 'Lorem ipsum dolor sit amet, consectetur [...]', // Una linea lunga
//           'test',
//           'foo' ] ],
//     4 ],
//   b: Map { 'za' => 1, 'zb' => 'test' } }

// Impostare 'compact' su false rende l'output più ottimizzato per il lettore.
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

// Impostare `breakLength` su 150 per esempio stamperà il testo "Lorem ipsum" su una
// linea singola.
// Ridurre la `breakLength` dividerà il testo "Lorem ipsum" in blocchi
// più piccoli.
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

### Personalizzazione dei colori di `util.inspect`

<!-- type=misc -->

Color output (if enabled) of `util.inspect` is customizable globally via the `util.inspect.styles` and `util.inspect.colors` properties.

`util.inspect.styles` is a map associating a style name to a color from `util.inspect.colors`.

Gli stili predefiniti e i colori associati sono:

* `number` - `yellow`
* `boolean` - `yellow`
* `string` - `green`
* `date` - `magenta`
* `regexp` - `red`
* `null` - `bold`
* `undefined` - `grey`
* `special` - `cyan` (applicato solo alle funzioni in questo momento)
* `name` - (senza stile)

The predefined color codes are: `white`, `grey`, `black`, `blue`, `cyan`, `green`, `magenta`, `red` and `yellow`. There are also `bold`, `italic`, `underline` and `inverse` codes.

Color styling uses ANSI control codes that may not be supported on all terminals.

### Funzioni di ispezione personalizzate sugli Object

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

    // Padding di cinque spazi perché è la dimensione di "Box< ".
    const padding = ' '.repeat(5);
    const inner = util.inspect(this.value, newOptions)
                      .replace(/\n/g, `\n${padding}`);
    return `${options.stylize('Box', 'special')}< ${inner} >`;
  }
}

const box = new Box(true);

util.inspect(box);
// Restituisce: "Box< true >"
```

Custom `[util.inspect.custom](depth, opts)` functions typically return a string but may return a value of any type that will be formatted accordingly by `util.inspect()`.

```js
const util = require('util');

const obj = { foo: 'this will not show up in the inspect() output' };
obj[util.inspect.custom] = (depth) => {
  return { bar: 'baz' };
};

util.inspect(obj);
// Restituisce: "{ bar: 'baz' }"
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

console.log(arr); // registra l'array troncato
util.inspect.defaultOptions.maxArrayLength = null;
console.log(arr); // registra l'array completo
```

## util.isDeepStrictEqual(val1, val2)

<!-- YAML
added: v9.0.0
-->

* `val1` {any}
* `val2` {any}
* Restituisce: {boolean}

Restituisce `true` se esiste un'uguaglianza stretta e rigorosa tra `val1` e `val2`. In caso contrario, restituisce `false`.

See [`assert.deepStrictEqual()`][] for more information about deep strict equality.

## util.promisify(original)

<!-- YAML
added: v8.0.0
-->

* `original` {Function}
* Restituisce: {Function}

Takes a function following the common error-first callback style, i.e. taking an `(err, value) => ...` callback as the last argument, and returns a version that returns promises.

```js
const util = require('util');
const fs = require('fs');

const stat = util.promisify(fs.stat);
stat('.').then((stats) => {
  // Eseguire le istruzioni con `stats`
}).catch((error) => {
  //Gestire l'errore.
});
```

Oppure, utilizzando in modo equivalente le `async function`:

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

### Funzioni promisified personalizzate

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
// stampa 'true'
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

Un'implementazione dell'API `TextDecoder` dello [Standard di Codifica WHATWG](https://encoding.spec.whatwg.org/).

```js
const decoder = new TextDecoder('shift_jis');
let string = '';
let buffer;
while (buffer = getNextChunkSomehow()) {
  string += decoder.decode(buffer, { stream: true });
}
string += decoder.decode(); // end-of-stream
```

### Codifiche Supportate da WHATWG

Per the [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/), the encodings supported by the `TextDecoder` API are outlined in the tables below. For each encoding, one or more aliases may be used.

Diverse configurazioni di build Node.js supportano diversi set di codifiche. While a very basic set of encodings is supported even on Node.js builds without ICU enabled, support for some encodings is provided only when Node.js is built with ICU and using the full ICU data (see [Internationalization](intl.html)).

#### Codifiche Supportate Senza ICU

| Codifica     | Alias                           |
| ------------ | ------------------------------- |
| `'utf-8'`    | `'unicode-1-1-utf-8'`, `'utf8'` |
| `'utf-16le'` | `'utf-16'`                      |

#### Codifiche Supportate per Impostazione Predefinita (Con ICU)

| Codifica     | Alias                           |
| ------------ | ------------------------------- |
| `'utf-8'`    | `'unicode-1-1-utf-8'`, `'utf8'` |
| `'utf-16le'` | `'utf-16'`                      |
| `'utf-16be'` |                                 |

#### Codifiche che Richiedono Dati ICU Completi

| Codifica           | Alias                                                                                                                                                                                                                               |
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
  * `fatal` {boolean} `true` se i fallimenti di decodifica sono fatali. This option is only supported when ICU is enabled (see [Internationalization](intl.html)). **Default:** `false`.
  * `ignoreBOM` {boolean} Quando è `true`, il `TextDecoder` includerà il segno di ordine dei byte nel risultato decodificato. Se `false`, il segno di ordine dei byte verrà rimosso dall'output. This option is only used when `encoding` is `'utf-8'`, `'utf-16be'` or `'utf-16le'`. **Default:** `false`.

Crea una nuova istanza `TextDecoder`. The `encoding` may specify one of the supported encodings or an alias.

### textDecoder.decode([input[, options]])

* `input` {ArrayBuffer|DataView|TypedArray} An `ArrayBuffer`, `DataView` or `Typed Array` instance containing the encoded data.
* `options` {Object} 
  * `stream` {boolean} `true` se sono previsti chunk di dati aggiuntivi. **Default** `false`.
* Restituisce: {string}

Decodifica l'`input` e restituisce una stringa. If `options.stream` is `true`, any incomplete byte sequences occurring at the end of the `input` are buffered internally and emitted after the next call to `textDecoder.decode()`.

If `textDecoder.fatal` is `true`, decoding errors that occur will result in a `TypeError` being thrown.

### textDecoder.encoding

* {string}

La codifica supportata dall'istanza `TextDecoder`.

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

Un'implementazione dell'API `TextEncoder` dello [Standard di Codifica WHATWG](https://encoding.spec.whatwg.org/). All instances of `TextEncoder` only support UTF-8 encoding.

```js
const encoder = new TextEncoder();
const uint8array = encoder.encode('this is some data');
```

### textEncoder.encode([input])

* `input` {string} Il testo da codificare. **Default:** una stringa vuota.
* Restituisce: {Uint8Array}

UTF-8 encodes the `input` string and returns a `Uint8Array` containing the encoded bytes.

### textEncoder.encoding

* {string}

La codifica supportata dall'istanza `TextEncoder`. Impostata sempre su `'utf-8'`.

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
* Restituisce: {boolean}

Returns `true` if the value is a built-in [`ArrayBuffer`][] or [`SharedArrayBuffer`][] instance.

See also [`util.types.isArrayBuffer()`][] and [`util.types.isSharedArrayBuffer()`][].

```js
util.types.isAnyArrayBuffer(new ArrayBuffer());  // Restituisce true
util.types.isAnyArrayBuffer(new SharedArrayBuffer());  // Restituisce true
```

### util.types.isArgumentsObject(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un `arguments` object.

```js
function foo() {
  util.types.isArgumentsObject(arguments);  // Restituisce true
}
```

### util.types.isArrayBuffer(value)<!-- YAML
added: v10.0.0
-->

* `value` {any}

* Returns: {boolean}

Restituisce `true` se il valore è un'istanza [`ArrayBuffer`][] incorporata. Questo *non* include le istanze [`SharedArrayBuffer`][]. Usually, it is desirable to test for both; See [`util.types.isAnyArrayBuffer()`][] for that.

```js
util.types.isArrayBuffer(new ArrayBuffer());  // Restituisce true
util.types.isArrayBuffer(new SharedArrayBuffer());  // Restituisce false
```

### util.types.isAsyncFunction(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è una [funzione asincrona](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function). Note that this only reports back what the JavaScript engine is seeing; in particular, the return value may not match the original source code if a transpilation tool was used.

```js
util.types.isAsyncFunction(function foo() {});  // Restituisce false
util.types.isAsyncFunction(async function foo() {});  // Restituisce true
```

### util.types.isBigInt64Array(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

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
* Restituisce: {boolean}

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
* Restituisce: {boolean}

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

* Returns: {boolean}

Returns `true` if the value is any boxed primitive object, e.g. created by `new Boolean()`, `new String()` or `Object(Symbol())`.

Per esempio:

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

* Returns: {boolean}

Restituisce `true` se il valore è un'istanza [`DataView`][] incorporata.

```js
const ab = new ArrayBuffer(20);
util.types.isDataView(new DataView(ab));  // Restituisce true
util.types.isDataView(new Float64Array());  // Restituisce false
```

Vedere inoltre [`ArrayBuffer.isView()`][].

### util.types.isDate(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un'istanza [`Date`][] incorporata.

```js
util.types.isDate(new Date());  // Restituisce true
```

### util.types.isExternal(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un valore `External` nativo.

### util.types.isFloat32Array(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un'istanza [`Float32Array`][] incorporata.

```js
util.types.isFloat32Array(new ArrayBuffer());  // Restituisce false
util.types.isFloat32Array(new Float32Array());  // Restituisce  true
util.types.isFloat32Array(new Float64Array());  // Restituisce  false
```

### util.types.isFloat64Array(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un'istanza [`Float64Array`][] incorporata.

```js
util.types.isFloat64Array(new ArrayBuffer());  // Restituisce  false
util.types.isFloat64Array(new Uint8Array());  // Restituisce  false
util.types.isFloat64Array(new Float64Array());  // Restituisce  true
```

### util.types.isGeneratorFunction(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è una funzione generatore. Note that this only reports back what the JavaScript engine is seeing; in particular, the return value may not match the original source code if a transpilation tool was used.

```js
util.types.isGeneratorFunction(function foo() {});  // Restituisce false
util.types.isGeneratorFunction(function* foo() {});  // Restituisce true
```

### util.types.isGeneratorObject(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Returns `true` if the value is a generator object as returned from a built-in generator function. Note that this only reports back what the JavaScript engine is seeing; in particular, the return value may not match the original source code if a transpilation tool was used.

```js
function* foo() {}
const generator = foo();
util.types.isGeneratorObject(generator);  // Restituisce true
```

### util.types.isInt8Array(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un'istanza [`Int8Array`][] incorporata.

```js
util.types.isInt8Array(new ArrayBuffer());  // Restituisce false
util.types.isInt8Array(new Int8Array());  // Restituisce true
util.types.isInt8Array(new Float64Array());  // Restituisce false
```

### util.types.isInt16Array(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un'istanza [`Int16Array`] incorporata.

```js
util.types.isInt16Array(new ArrayBuffer());  // Restituisce false
util.types.isInt16Array(new Int16Array());  // Restituisce true
util.types.isInt16Array(new Float64Array());  // Restituisce false
```

### util.types.isInt32Array(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un'istanza [`Int32Array`] incorporata.

```js
util.types.isInt32Array(new ArrayBuffer());  // Restituisce false
util.types.isInt32Array(new Int32Array());  // Restituisce true
util.types.isInt32Array(new Float64Array());  // Restituisce false
```

### util.types.isMap(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un'istanza [`Map`][] incorporata.

```js
util.types.isMap(new Map());  // Restituisce true
```

### util.types.isMapIterator(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Returns `true` if the value is an iterator returned for a built-in [`Map`][] instance.

```js
const map = new Map();
util.types.isMapIterator(map.keys());  // Restituisce true
util.types.isMapIterator(map.values());  // Restituisce true
util.types.isMapIterator(map.entries());  // Restituisce true
util.types.isMapIterator(map[Symbol.iterator]());  // Restituisce true
```

### util.types.isModuleNamespaceObject(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

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
* Restituisce: {boolean}

Restituisce `true` se il valore è un'istanza di un tipo di [`Error`][] incorporato.

```js
util.types.isNativeError(new Error());  // Restituisce true
util.types.isNativeError(new TypeError());  // Restituisce true
util.types.isNativeError(new RangeError());  // Restituisce true
```

### util.types.isNumberObject(value)<!-- YAML
added: v10.0.0
-->

* `value` {any}

* Returns: {boolean}

Returns `true` if the value is a number object, e.g. created by `new Number()`.

```js
util.types.isNumberObject(0);  // Restituisce false
util.types.isNumberObject(new Number(0));   // Restituisce true
```

### util.types.isPromise(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un [`Promise`][] incorporato.

```js
util.types.isPromise(Promise.resolve(42));  // Restituisce true
```

### util.types.isProxy(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un'istanza [`Proxy`][].

```js
const target = {};
const proxy = new Proxy(target, {});
util.types.isProxy(target);  // Restituisce false
util.types.isProxy(proxy);  // Restituisce true
```

### util.types.isRegExp(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un object di espressione regolare.

```js
util.types.isRegExp(/abc/);  // Restituisce true
util.types.isRegExp(new RegExp('abc'));  // Restituisce true
```

### util.types.isSet(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un'istanza [`Set`][] incorporata.

```js
util.types.isSet(new Set());  // Restituisce true
```

### util.types.isSetIterator(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Returns `true` if the value is an iterator returned for a built-in [`Set`][] instance.

```js
const set = new Set();
util.types.isSetIterator(set.keys());  // Restituisce true
util.types.isSetIterator(set.values());  // Restituisce true
util.types.isSetIterator(set.entries());  // Restituisce true
util.types.isSetIterator(set[Symbol.iterator]());  // Restituisce true
```

### util.types.isSharedArrayBuffer(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un'istanza [`SharedArrayBuffer`][] incorporata. Questo *non* include le istanze [`ArrayBuffer`][]. Usually, it is desirable to test for both; See [`util.types.isAnyArrayBuffer()`][] for that.

```js
util.types.isSharedArrayBuffer(new ArrayBuffer());  // Restituisce false
util.types.isSharedArrayBuffer(new SharedArrayBuffer());  // Restituisce true
```

### util.types.isStringObject(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Returns `true` if the value is a string object, e.g. created by `new String()`.

```js
util.types.isStringObject('foo');  // Restituisce false
util.types.isStringObject(new String('foo'));   // Restituisce true
```

### util.types.isSymbolObject(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Returns `true` if the value is a symbol object, created by calling `Object()` on a `Symbol` primitive.

```js
const symbol = Symbol('foo');
util.types.isSymbolObject(symbol);  // Restituisce false
util.types.isSymbolObject(Object(symbol));   // Restituisce true
```

### util.types.isTypedArray(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un'istanza [`TypedArray`] incorporata.

```js
util.types.isTypedArray(new ArrayBuffer());  // Restituisce false
util.types.isTypedArray(new Uint8Array());  // Restituisce true
util.types.isTypedArray(new Float64Array());  // Restituisce true
```

Vedere inoltre [`ArrayBuffer.isView()`][].

### util.types.isUint8Array(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un'istanza [`Uint8Array`][] incorporata.

```js
util.types.isUint8Array(new ArrayBuffer());  // Restituisce false
util.types.isUint8Array(new Uint8Array());  // Restituisce true
util.types.isUint8Array(new Float64Array());  // Restituisce false
```

### util.types.isUint8ClampedArray(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un'istanza [`Uint8ClampedArray`][] incorporata.

```js
util.types.isUint8ClampedArray(new ArrayBuffer());  // Restituisce false
util.types.isUint8ClampedArray(new Uint8ClampedArray());  // Restituisce true
util.types.isUint8ClampedArray(new Float64Array());  // Restituisce false
```

### util.types.isUint16Array(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un'istanza [`Uint16Array`][] incorporata.

```js
util.types.isUint16Array(new ArrayBuffer());  // Restituisce false
util.types.isUint16Array(new Uint16Array());  // Restituisce true
util.types.isUint16Array(new Float64Array());  // Restituisce false
```

### util.types.isUint32Array(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un'istanza [`Uint32Array`][] incorporata.

```js
util.types.isUint32Array(new ArrayBuffer());  // Restituisce false
util.types.isUint32Array(new Uint32Array());  // Restituisce true
util.types.isUint32Array(new Float64Array());  // Restituisce false
```

### util.types.isWeakMap(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un'istanza [`WeakMap`][] incorporata.

```js
util.types.isWeakMap(new WeakMap());  // Restituisce true
```

### util.types.isWeakSet(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un'istanza [`WeakSet`][] incorporata.

```js
util.types.isWeakSet(new WeakSet());  // Restituisce true
```

### util.types.isWebAssemblyCompiledModule(value)

<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Restituisce: {boolean}

Restituisce `true` se il valore è un'istanza [`WebAssembly.Module`][] incorporata.

```js
const module = new WebAssembly.Module(wasmBuffer);
util.types.isWebAssemblyCompiledModule(module);  // Restituisce true
```

## API obsolete

The following APIs are deprecated and should no longer be used. Existing applications and modules should be updated to find alternative approaches.

### util.\_extend(target, source)<!-- YAML
added: v0.7.5
deprecated: v6.0.0
-->

* `target` {Object}

* `source` {Object}

> Stabilità: 0 - Deprecato: Utilizza [`Object.assign()`] al suo posto.

The `util._extend()` method was never intended to be used outside of internal Node.js modules. Tuttavia la comunità l'ha trovato e utilizzato ugualmente.

E' deprecato e non dovrebbe essere utilizzato in un nuovo codice. JavaScript comes with very similar built-in functionality through [`Object.assign()`].

### util.debug(string)<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->> Stability: 0 - Deprecated: Use [

`console.error()`][] instead.

* `string` {string} Il messaggio da stampare su `stderr`

Predecessore deprecato di `console.error`.

### util.error([...strings])<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->> Stability: 0 - Deprecated: Use [

`console.error()`][] instead.

* `...strings` {string} Il messaggio da stampare su `stderr`

Predecessore deprecato di `console.error`.

### util.isArray(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use [

`Array.isArray()`][] instead.

* `object` {any}
* Restituisce: {boolean}

Alias per [`Array.isArray()`][].

Restituisce `true` se l'`object` indicato è un `Array`. In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isArray([]);
// Restituisce: true
util.isArray(new Array());
// Restituisce: true
util.isArray({});
// Restituisce: false
```

### util.isBoolean(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use 

`typeof value === 'boolean'` instead.

* `object` {any}
* Restituisce: {boolean}

Restituisce `true` se l'`object` indicato è un `Boolean`. In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isBoolean(1);
// Restituisce: false
util.isBoolean(0);
// Restituisce: false
util.isBoolean(false);
// Restituisce: true
```

### util.isBuffer(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use [

`Buffer.isBuffer()`][] instead.

* `object` {any}
* Restituisce: {boolean}

Restituisce `true` se l'`object` indicato è un `Buffer`. In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isBuffer({ length: 0 });
// Restituisce: false
util.isBuffer([]);
// Restituisce: false
util.isBuffer(Buffer.from('hello world'));
// Restituisce: true
```

### util.isDate(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use [

`util.types.isDate()`][] instead.

* `object` {any}
* Restituisce: {boolean}

Restituisce `true` se l'`object` indicato è una `Date`. In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isDate(new Date());
// Restituisce: true
util.isDate(Date());
// false (senza 'new' restituisce una Stringa)
util.isDate({});
// Restituisce: false
```

### util.isError(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use [

`util.types.isNativeError()`][] instead.

* `object` {any}
* Restituisce: {boolean}

Restituisce `true` se l'`object` indicato è un [`Error`][]. Otherwise, returns `false`.

```js
const util = require('util');

util.isError(new Error());
// Restituisce: true
util.isError(new TypeError());
// Restituisce: true
util.isError({ name: 'Error', message: 'an error occurred' });
// Restituisce: false
```

Notare che questo metodo dipende dal comportamento di `Object.prototype.toString()`. It is possible to obtain an incorrect result when the `object` argument manipulates `@@toStringTag`.

```js
const util = require('util');
const obj = { name: 'Error', message: 'an error occurred' };

util.isError(obj);
// Restituisce: false
obj[Symbol.toStringTag] = 'Error';
util.isError(obj);
// Restituisce: true
```

### util.isFunction(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use 

`typeof value === 'function'` instead.

* `object` {any}
* Restituisce: {boolean}

Restituisce `true` se l'`object` indicato è una `Function`. Otherwise, returns `false`.

```js
const util = require('util');

function Foo() {}
const Bar = () => {};

util.isFunction({});
// Restituisce: false
util.isFunction(Foo);
// Restituisce: true
util.isFunction(Bar);
// Restituisce: true
```

### util.isNull(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use 

`value === null` instead.

* `object` {any}
* Restituisce: {boolean}

Restituisce `true` se l'`object` indicato è rigorosamente `null`. Otherwise, returns `false`.

```js
const util = require('util');

util.isNull(0);
// Restituisce: false
util.isNull(undefined);
// Restituisce: false
util.isNull(null);
// Restituisce: true
```

### util.isNullOrUndefined(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `value === undefined || value === null` instead.

* `object` {any}
* Restituisce: {boolean}

Restituisce `true` se l'`object` indicato è `null` o `undefined`. Otherwise, returns `false`.

```js
const util = require('util');

util.isNullOrUndefined(0);
// Restituisce: false
util.isNullOrUndefined(undefined);
// Restituisce: true
util.isNullOrUndefined(null);
// Restituisce: true
```

### util.isNumber(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `typeof value === 'number'` instead.

* `object` {any}
* Restituisce: {boolean}

Restituisce `true` se l'`object` indicato è un `Number`. In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isNumber(false);
// Restituisce: false
util.isNumber(Infinity);
// Restituisce: true
util.isNumber(0);
// Restituisce: true
util.isNumber(NaN);
// Restituisce: true
```

### util.isObject(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `value !== null && typeof value === 'object'` instead.

* `object` {any}
* Restituisce: {boolean}

Returns `true` if the given `object` is strictly an `Object` **and** not a `Function` (even though functions are objects in JavaScript). In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isObject(5);
// Restituisce: false
util.isObject(null);
// Restituisce: false
util.isObject({});
// Restituisce: true
util.isObject(() => {});
// Restituisce: false
```

### util.isPrimitive(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `(typeof value !== 'object' && typeof value !== 'function') || value === null` instead.

* `object` {any}
* Restituisce: {boolean}

Restituisce `true` se l'`object` indicato è un tipo primitivo. Otherwise, returns `false`.

```js
const util = require('util');

util.isPrimitive(5);
// Restituisce: true
util.isPrimitive('foo');
// Restituisce: true
util.isPrimitive(false);
// Restituisce: true
util.isPrimitive(null);
// Restituisce: true
util.isPrimitive(undefined);
// Restituisce: true
util.isPrimitive({});
// Restituisce: false
util.isPrimitive(() => {});
// Restituisce: false
util.isPrimitive(/^$/);
// Restituisce: false
util.isPrimitive(new Date());
// Restituisce: false
```

### util.isRegExp(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Stability: 0 - Deprecated

* `object` {any}
* Restituisce: {boolean}

Restituisce `true` se l'`object` indicato è un `RegExp`. In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isRegExp(/some regexp/);
// Restituisce: true
util.isRegExp(new RegExp('another regexp'));
// Restituisce: true
util.isRegExp({});
// Restituisce: false
```

### util.isString(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `typeof value === 'string'` instead.

* `object` {any}
* Restituisce: {boolean}

Restituisce `true` se l'`object` indicato è una `string`. In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isString('');
// Restituisce: true
util.isString('foo');
// Restituisce: true
util.isString(String('foo'));
// Restituisce: true
util.isString(5);
// Restituisce: false
```

### util.isSymbol(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use 

`typeof value === 'symbol'` instead.

* `object` {any}
* Restituisce: {boolean}

Restituisce `true` se l'`object` indicato è un `Symbol`. In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isSymbol(5);
// Restituisce: false
util.isSymbol('foo');
// Restituisce: false
util.isSymbol(Symbol('foo'));
// Restituisce: true
```

### util.isUndefined(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `value === undefined` instead.

* `object` {any}
* Restituisce: {boolean}

Restituisce `true` se l'`object` indicato è `undefined`. In caso contrario, restituisce `false`.

```js
const util = require('util');

const foo = undefined;
util.isUndefined(5);
// Restituisce: false
util.isUndefined(foo);
// Restituisce: true
util.isUndefined(null);
// Restituisce: false
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

Predecessore obsoleto di `console.log`.

### util.puts([...strings])<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->> Stability: 0 - Deprecated: Use [

`console.log()`][] instead.

Predecessore obsoleto di `console.log`.