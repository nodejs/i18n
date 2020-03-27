# Util

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定

`util` 模块主要用于满足 Node.js 自己内部 API 的需求。 然而，很多实用程序对于应用程序和模块开发者也非常有用。 可以通过如下方式访问：

```js
const util = require('util');
```

## util.callbackify(original)
<!-- YAML
added: v8.2.0
-->

* `original` {Function} 一个 `异步` 函数
* 返回：{Function} 回调样式的函数

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

将打印：

```txt
hello world
```

回调是异步执行的，且将具有有限的栈回溯。 如果回调函数抛出异常，进程将发出一个 [`'uncaughtException'`][] 事件，如果该事件没有被处理，则将退出。

由于 `null` 作为回调函数的第一个参数具有特殊含义，如果一个被包装的函数拒绝 `Promise` 并返回虚值作为原因，则原始值将被存储于 `reason` 字段，并被包装在 `Error` 中。

```js
function fn() {
  return Promise.reject(null);
}
const callbackFunction = util.callbackify(fn);

callbackFunction((err, ret) => {
  // When the Promise was rejected with `null` it is wrapped with an Error and
  // the original value is stored in `reason`.
  err && err.hasOwnProperty('reason') && err.reason === null;  // true
});
```

## util.debuglog(section)
<!-- YAML
added: v0.11.3
-->

* `section` {string} 用于标识在应用程序中 `debuglog` 函数被创建的部分。
* 返回：{Function} 日志函数

`util.debuglog()` 方法基于 `NODE_DEBUG` 环境变量的值，当符合某些条件时将调试信息输出到 `stderr`。 如果 `section` 名称出现在环境变量的值中，则返回的函数操作类似于 [`console.error()`][]。 如果没有，则返回的函数是空操作。

```js
const util = require('util');
const debuglog = util.debuglog('foo');

debuglog('hello from foo [%d]', 123);
```

如果在变量中包含 `NODE_DEBUG=foo`，则此程序的输出类似于如下内容：

```txt
FOO 3245: hello from foo [123]
```

其中的 `3245` 为进程 id。 如果该环境变量不存在，则程序运行时不打印任何内容。

The `section` supports wildcard also:
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

* `fn` {Function} The function that is being deprecated.
* `msg` {string} A warning message to display when the deprecated function is invoked.
* `code` {string} A deprecation code. See the [list of deprecated APIs](deprecations.html#deprecations_list_of_deprecated_apis) for a list of codes.
* Returns: {Function} The deprecated function wrapped to emit a warning.

The `util.deprecate()` method wraps `fn` (which may be a function or class) in such a way that it is marked as deprecated.

```js
const util = require('util');

exports.obsoleteFunction = util.deprecate(() => {
  // Do something here.
}, 'obsoleteFunction() is deprecated. Use newShinyFunction() instead.');
```

When called, `util.deprecate()` will return a function that will emit a `DeprecationWarning` using the [`'warning'`][] event. The warning will be emitted and printed to `stderr` the first time the returned function is called. After the warning is emitted, the wrapped function is called without emitting a warning.

If the same optional `code` is supplied in multiple calls to `util.deprecate()`, the warning will be emitted only once for that `code`.

```js
const util = require('util');

const fn1 = util.deprecate(someFunction, someMessage, 'DEP0001');
const fn2 = util.deprecate(someOtherFunction, someOtherMessage, 'DEP0001');
fn1(); // emits a deprecation warning with code DEP0001
fn2(); // does not emit a deprecation warning because it has the same code
```

If either the `--no-deprecation` or `--no-warnings` command line flags are used, or if the `process.noDeprecation` property is set to `true` *prior* to the first deprecation warning, the `util.deprecate()` method does nothing.

如果 `--trace-deprecation` 或 `--trace-warnings` 命令行标志被设置，或者 `process.traceDeprecation` 属性被设置为 `true`，当已弃用的函数被首次调用时，警告和栈追溯将被打印到 `stderr`。

如果设置了 `--throw-deprecation` 命令行标志，或者 `process.throwDeprecation` 属性被设置为 `true`，当被弃用的函数被调用时会抛出异常。

`--throw-deprecation` 命令行标志和 `process.throwDeprecation` 属性优先于 `--trace-deprecation` 和 `process.traceDeprecation`。

## util.format(format[, ...args])
<!-- YAML
added: v0.5.3
changes:
  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14558
    description: The `%o` and `%O` specifiers are supported now.
-->

* `format` {string} 一个和 `printf` 类似的格式化字符串函数。

`util.format()` 方法返回一个格式化过的字符串，其首个参数的格式和 `printf` 类似。

首个参数是一个包含零个或多个 *占位符* 标记的字符串。 每个占位符标记会被相应的参数转换而来的值所替代。 支持的占位符为：

* `%s` - `String`.
* `%d` - `Number` (integer or floating point value) or `BigInt`.
* `%i` - Integer or `BigInt`.
* `%f` - 单精度浮点数。
* `%j` - JSON。 如果参数中包含循环引用，将其替换为字符串 `'[Circular]'`。
* `%o` - `Object`. 一个代表对象的字符串，以通用 JavaScript 对象格式来呈现。 Similar to `util.inspect()` with options `{ showHidden: true, showProxy: true }`. This will show the full object including non-enumerable properties and proxies.
* `%O` - `Object`. A string representation of an object with generic JavaScript object formatting. 类似于没有选项的 `util.inspect()`。 This will show the full object not including non-enumerable properties and proxies.
* `%%` - 单个百分号 (`'%'`)。 它不使用参数。
* Returns: {string} The formatted string

如果占位符没有对应的参数，则占位符不会被替换。

```js
util.format('%s:%s', 'foo');
// Returns: 'foo:%s'
```

如果传递给 `util.format()` 的参数多于占位符的数量，多余的参数会被强制转换为字符串并和返回的字符串连接在一起，每个字符串由空格分隔。 对于 `typeof` 为 `'object'` 或 `'symbol'` （`null`除外）的多余参数，它们都会由 `util.inspect()` 进行转换。

```js
util.format('%s:%s', 'foo', 'bar', 'baz'); // 'foo:bar baz'
```

如果首个参数不是字符串，则 `util.format()` 返回将所有参数以空格连接在一起的一个字符串。 每个参数都通过使用 `util.inspect()` 转换为一个字符串。

```js
util.format(1, 2, 3); // '1 2 3'
```

如果只有一个参数被传递给 `util.format()`，该参数会被原样返回，且不做任何格式化。

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
// Returns 'See object { foo: 42 }', where `42` is colored as a number
// when printed to a terminal.
```

## util.getSystemErrorName(err)
<!-- YAML
added: v9.7.0
-->

* `err` {number}
* 返回：{string}

Returns the string name for a numeric error code that comes from a Node.js API. The mapping between error codes and error names is platform-dependent. See [Common System Errors](errors.html#errors_common_system_errors) for the names of common errors.

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

Usage of `util.inherits()` is discouraged. Please use the ES6 `class` and `extends` keywords to get language level inheritance support. 还请注意这两种风格在 [语义上不兼容](https://github.com/nodejs/node/issues/4179)。

Inherit the prototype methods from one [constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/constructor) into another. `构造器` 的原型方法将被设定在通过`superConstructor`创建的对象之中。

更为方便的时，`superConstructor` 可以通过 `constructor.super_` 属性进行访问。

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

ES6 example using `class` and `extends`:

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

* `object` {any} Any JavaScript primitive or `Object`.
* `options` {Object}
  * `showHidden` {boolean} If `true`, the `object`'s non-enumerable symbols and properties will be included in the formatted result as well as [`WeakMap`][] and [`WeakSet`][] entries. **默认:** `false`.
  * `depth` {number} 指定在格式化 `对象` 时进行递归的次数。 这在检查大型复杂对象时非常有用。 To make it recurse up to the maximum call stack size pass `Infinity` or `null`. **Default:** `2`.
  * `colors` {boolean} 如果值为 `true`，则输出结果会以 ANSI 颜色代码来格式化。 Colors are customizable, see [Customizing `util.inspect` colors][]. **默认:** `false`.
  * `customInspect` {boolean} If `false`, then custom `inspect(depth, opts)` functions will not be called. **Default:** `true`.
  * `showProxy` {boolean} 如果值为 `true`，则对象和 `代理`对象的函数会自省来显示它们的 `target` 和 `handler` 对象。 **默认:** `false`.
  * `maxArrayLength` {number} Specifies the maximum number of `Array`, [`TypedArray`][], [`WeakMap`][] and [`WeakSet`][] elements to include when formatting. Set to `null` or `Infinity` to show all elements. Set to `0` or negative to show no elements. **Default:** `100`.
  * `breakLength` {number} 对象键值被拆分为多行时的长度。 设置为 `Infinity` 会将对象格式化为单行。 **Default:** `60` for legacy compatibility.
  * `compact` {boolean} Setting this to `false` changes the default indentation to use a line break for each object key instead of lining up multiple properties in one line. It will also break text that is above the `breakLength` size into smaller and better readable chunks and indents objects the same as arrays. Note that no text will be reduced below 16 characters, no matter the `breakLength` size. For more information, see the example below. **Default:** `true`.
  * `sorted` {boolean|Function} If set to `true` or a function, all properties of an object and Set and Map entries will be sorted in the returned string. If set to `true` the [default sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) is going to be used. If set to a function, it is used as a [compare function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#Parameters).
* Returns: {string} The representation of passed object

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

如下的范例检查 `util` 对象的所有属性：

```js
const util = require('util');

console.log(util.inspect(util, { showHidden: true, depth: null }));
```

值可以提供它们自己的自定义 `inspect(depth, opts)` 函数，当被调用时，它们会在递归检查中接收当前 `深度`，以及传递给 `util.inspect()` 的 options 对象。

The following example highlights the difference with the `compact` option:

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

// This will print

// { a:
//   [ 1,
//     2,
//     [ [ 'Lorem ipsum dolor sit amet, consectetur [...]', // A long line
//           'test',
//           'foo' ] ],
//     4 ],
//   b: Map { 'za' => 1, 'zb' => 'test' } }

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
//   b: Map {
//     'za' => 1,
//     'zb' => 'test'
//   }
// }

// Setting `breakLength` to e.g. 150 will print the "Lorem ipsum" text in a
// single line.
// Reducing the `breakLength` will split the "Lorem ipsum" text in smaller
// chunks.
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

### 自定义 `util.inspect` 颜色

<!-- type=misc -->

`util.inspect` 的带颜色输出 （如果启用）可以通过 `util.inspect.styles` 和 `util.inspect.colors` 属性进行全局性定义。

`util.inspect.styles` 是一个将样式名称和 `util.inspect.colors` 中颜色相关联的 map。

默认的样式及其相关联的颜色是：

 * `number` - `黄色`
 * `boolean` - `黄色`
 * `string` - `绿色`
 * `date` - `品红色`
 * `regexp` - `红色`
 * `null` - `粗体`
 * `undefined` - `灰色`
 * `special` - `青色` （仅适用于当前函数）
 * `name` - （无样式）

预定义的颜色代码是：`white`, `grey`, `black`, `blue`, `cyan`, `green`, `magenta`, `red` 和 `yellow`。 同时还有 `bold`, `italic`, `underline` 以及 `inverse` 这些代码。

使用 ANSI 控制代码的颜色样式可能不会适用于所有终端。

### 对象上的自定义检查功能

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

    // Five space padding because that's the size of "Box< ".
    const padding = ' '.repeat(5);
    const inner = util.inspect(this.value, newOptions)
                      .replace(/\n/g, `\n${padding}`);
    return `${options.stylize('Box', 'special')}< ${inner} >`;
  }
}

const box = new Box(true);

util.inspect(box);
// Returns: "Box< true >"
```

自定义的 `[util.inspect.custom](depth, opts)` 函数通常返回一个字符串，但可能会返回任何类型的值，该值会被 `util.inspect()` 进行相应的格式化。

```js
const util = require('util');

const obj = { foo: 'this will not show up in the inspect() output' };
obj[util.inspect.custom] = (depth) => {
  return { bar: 'baz' };
};

util.inspect(obj);
// Returns: "{ bar: 'baz' }"
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

`defaultOptions` 值允许自定义 `util.inspect` 的默认选项。 这对于 `console.log` 或 `util.format` 类似的函数非常有用，这样的函数会隐式调用 `util.inspect`。 应将其设置为一个包含一个或多个合法 [`util.inspect()`][] 选项的对象。 还支持直接设置选项属性。

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
* 返回：{boolean}

Returns `true` if there is deep strict equality between `val1` and `val2`. 否则，返回 `false`。

See [`assert.deepStrictEqual()`][] for more information about deep strict equality.

## util.promisify(original)
<!-- YAML
added: v8.0.0
-->

* `original` {Function}
* 返回：{Function}

Takes a function following the common error-first callback style, i.e. taking an `(err, value) => ...` callback as the last argument, and returns a version that returns promises.

```js
const util = require('util');
const fs = require('fs');

const stat = util.promisify(fs.stat);
stat('.').then((stats) => {
  // Do something with `stats`
}).catch((error) => {
  // Handle the error.
});
```

或者，等同于使用 `async function`：

```js
const util = require('util');
const fs = require('fs');

const stat = util.promisify(fs.stat);

async function callStat() {
  const stats = await stat('.');
  console.log(`This directory is owned by ${stats.uid}`);
}
```

如果存在 `original[util.promisify.custom]` 属性，`promisify` 将会返回它的值，请参阅 [自定义 promisified 函数](#util_custom_promisified_functions)。

`promisify()` 假定 `original` 是一个在所有情况下都将回调函数作为其最终参数的函数。 如果 `original` 不是一个函数，`promisify()` 会抛出一个错误。 如果 `original` 是一个函数，但其最后参数不是 error-first 风格回调函数，它仍会收到一个 error-first 风格的回调函数作为其最后一个参数。

### 自定义 promisified 函数

使用 `util.promisify.custom` 符号可以覆盖 [`util.promisify()`][] 的返回值：

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
// prints 'true'
```

这在当原始函数没有遵循标准格式，也就是把 error-first 回调函数作为最后一个参数的情况下非常有用。

For example, with a function that takes in `(foo, onSuccessCallback, onErrorCallback)`:

```js
doSomething[util.promisify.custom] = (foo) => {
  return new Promise((resolve, reject) => {
    doSomething(foo, resolve, reject);
  });
};
```
如果 `promisify.custom` 已定义但不是一个函数，`promisify()` 会抛出一个错误。

### util.promisify.custom
<!-- YAML
added: v8.0.0
-->

* {symbol}

A {symbol} that can be used to declare custom promisified variants of functions, see [Custom promisified functions](#util_custom_promisified_functions).

## 类：util.TextDecoder
<!-- YAML
added: v8.3.0
-->

一个实现了 [WHATWG 编码规范](https://encoding.spec.whatwg.org/) 的 `TextDecoder` API。

```js
const decoder = new TextDecoder('shift_jis');
let string = '';
let buffer;
while (buffer = getNextChunkSomehow()) {
  string += decoder.decode(buffer, { stream: true });
}
string += decoder.decode(); // end-of-stream
```

### WHATWG 支持的编码

根据 [WHATWG 编码规范](https://encoding.spec.whatwg.org/)，受 `TextDecoder` API 支持的编码如下表所示。 对于每种编码，可以使用一个或多个别名。

不同的 Node.js 构建配置支持不同的编码集。 即使对于没有启用 ICU 的 Node.js 构建，也支持最基本的编码集，对于某些编码，只有启用了 ICU 并使用所有 ICU 数据的 Node.js 才被支持 （请参阅 [国际化](intl.html)）。

#### 没有启用 ICU 时支持的编码

| 编码           | 别名                              |
| ------------ | ------------------------------- |
| `'utf-8'`    | `'unicode-1-1-utf-8'`, `'utf8'` |
| `'utf-16le'` | `'utf-16'`                      |

#### 默认支持的编码 （已启用 ICU）

| 编码           | 别名                              |
| ------------ | ------------------------------- |
| `'utf-8'`    | `'unicode-1-1-utf-8'`, `'utf8'` |
| `'utf-16le'` | `'utf-16'`                      |
| `'utf-16be'` |                                 |

#### 需要完整 ICU 数据的编码

| 编码                 | 别名                                                                                                                                                                                                                                  |
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

* `encoding` {string} 标识这个 `TextDecoder` 实例支持的 `编码`。 **Default:** `'utf-8'`.
* `options` {Object}
  * `fatal` {boolean} `true` 如果解码出现的错误是致命的。 This option is only supported when ICU is enabled (see [Internationalization](intl.html)). **Default:** `false`.
  * `ignoreBOM` {boolean} 当值为 `true` 时，`TextDecoder` 将在解码结果中包括字节顺序标记。 当值为 `false` 时，字节顺序标记将被从输出中删除。 此选项仅在 `encoding` 为 `'utf-8'`, `'utf-16be'` 或 `'utf-16le'` 时被使用。 **默认:** `false`.

创建一个新的 `TextDecoder` 实例。 `encoding` 可以指定一个支持的编码或别名。

### textDecoder.decode([input[, options]])

* `input` {ArrayBuffer|DataView|TypedArray} An `ArrayBuffer`, `DataView` or `Typed Array` instance containing the encoded data.
* `options` {Object}
  * `stream` {boolean} 如果期待额外的数据块，则为 `true`。 **默认:** `false`.
* 返回：{string}

对 `input` 进行解码并返回一个字符串。 如果 `options.stream` 的值为 `true`， `input` 末尾处的任何不完整字节序列会先在内部缓存，并在下一次调用 `textDecoder.decode()` 后被发送。

如果 `textDecoder.fatal` 的值为 `true`，一旦发生解码错误会导致抛出 `TypeError`。

### textDecoder.encoding

* {string}

`TextDecoder` 实例支持的编码。

### textDecoder.fatal

* {boolean}

如果解码错误导致 `TypeError` 被抛出，则其值为 `true`。

### textDecoder.ignoreBOM

* {boolean}

如果解码结果将会包括字节顺序标记，则该值为 `true`。

## 类：util.TextEncoder
<!-- YAML
added: v8.3.0
-->

[WHATWG 编码标准](https://encoding.spec.whatwg.org/)`TextEncoder` API 的一个实现。 所有 `TextEncoder` 的实例只支持 UTF-8 编码。

```js
const encoder = new TextEncoder();
const uint8array = encoder.encode('this is some data');
```

### textEncoder.encode([input])

* `input` {string} 要进行编码的文字。 **Default:** an empty string.
* 返回：{Uint8Array}

使用 UTF-8 编码 `input` 字符串，并返回包含编码字节的 `Uint8Array`。

### textEncoder.encoding

* {string}

`TextEncoder` 实例支持的编码。 始终设置为 `'utf-8'`。

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
* 返回：{boolean}

Returns `true` if the value is a built-in [`ArrayBuffer`][] or [`SharedArrayBuffer`][] instance.

See also [`util.types.isArrayBuffer()`][] and [`util.types.isSharedArrayBuffer()`][].

```js
util.types.isAnyArrayBuffer(new ArrayBuffer());  // Returns true
util.types.isAnyArrayBuffer(new SharedArrayBuffer());  // Returns true
```

### util.types.isArgumentsObject(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is an `arguments` object.
```js
function foo() {
  util.types.isArgumentsObject(arguments);  // Returns true
}
```

### util.types.isArrayBuffer(value)<!-- YAML
added: v10.0.0
-->* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a built-in [`ArrayBuffer`][] instance. This does *not* include [`SharedArrayBuffer`][] instances. Usually, it is desirable to test for both; See [`util.types.isAnyArrayBuffer()`][] for that.

```js
util.types.isArrayBuffer(new ArrayBuffer());  // Returns true
util.types.isArrayBuffer(new SharedArrayBuffer());  // Returns false
```

### util.types.isAsyncFunction(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is an [async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function). Note that this only reports back what the JavaScript engine is seeing; in particular, the return value may not match the original source code if a transpilation tool was used.

```js
util.types.isAsyncFunction(function foo() {});  // Returns false
util.types.isAsyncFunction(async function foo() {});  // Returns true
```

### util.types.isBigInt64Array(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

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
* 返回：{boolean}

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
* 返回：{boolean}

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
-->* `value` {any}
* 返回：{boolean}

Returns `true` if the value is any boxed primitive object, e.g. created by `new Boolean()`, `new String()` or `Object(Symbol())`.

例如：

```js
util.types.isBoxedPrimitive(false); // Returns false
util.types.isBoxedPrimitive(new Boolean(false)); // Returns true
util.types.isBoxedPrimitive(Symbol('foo')); // Returns false
util.types.isBoxedPrimitive(Object(Symbol('foo'))); // Returns true
util.types.isBoxedPrimitive(Object(BigInt(5))); // Returns true
```

### util.types.isDataView(value)<!-- YAML
added: v10.0.0
-->* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a built-in [`DataView`][] instance.

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

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a built-in [`Date`][] instance.

```js
util.types.isDate(new Date());  // Returns true
```

### util.types.isExternal(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a native `External` value.

### util.types.isFloat32Array(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a built-in [`Float32Array`][] instance.

```js
util.types.isFloat32Array(new ArrayBuffer());  // Returns false
util.types.isFloat32Array(new Float32Array());  // Returns true
util.types.isFloat32Array(new Float64Array());  // Returns false
```

### util.types.isFloat64Array(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a built-in [`Float64Array`][] instance.

```js
util.types.isFloat64Array(new ArrayBuffer());  // Returns false
util.types.isFloat64Array(new Uint8Array());  // Returns false
util.types.isFloat64Array(new Float64Array());  // Returns true
```

### util.types.isGeneratorFunction(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a generator function. Note that this only reports back what the JavaScript engine is seeing; in particular, the return value may not match the original source code if a transpilation tool was used.

```js
util.types.isGeneratorFunction(function foo() {});  // Returns false
util.types.isGeneratorFunction(function* foo() {});  // Returns true
```

### util.types.isGeneratorObject(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a generator object as returned from a built-in generator function. Note that this only reports back what the JavaScript engine is seeing; in particular, the return value may not match the original source code if a transpilation tool was used.

```js
function* foo() {}
const generator = foo();
util.types.isGeneratorObject(generator);  // Returns true
```

### util.types.isInt8Array(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a built-in [`Int8Array`][] instance.

```js
util.types.isInt8Array(new ArrayBuffer());  // Returns false
util.types.isInt8Array(new Int8Array());  // Returns true
util.types.isInt8Array(new Float64Array());  // Returns false
```

### util.types.isInt16Array(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a built-in [`Int16Array`][] instance.

```js
util.types.isInt16Array(new ArrayBuffer());  // Returns false
util.types.isInt16Array(new Int16Array());  // Returns true
util.types.isInt16Array(new Float64Array());  // Returns false
```

### util.types.isInt32Array(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a built-in [`Int32Array`][] instance.

```js
util.types.isInt32Array(new ArrayBuffer());  // Returns false
util.types.isInt32Array(new Int32Array());  // Returns true
util.types.isInt32Array(new Float64Array());  // Returns false
```

### util.types.isMap(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a built-in [`Map`][] instance.

```js
util.types.isMap(new Map());  // Returns true
```

### util.types.isMapIterator(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is an iterator returned for a built-in [`Map`][] instance.

```js
const map = new Map();
util.types.isMapIterator(map.keys());  // Returns true
util.types.isMapIterator(map.values());  // Returns true
util.types.isMapIterator(map.entries());  // Returns true
util.types.isMapIterator(map[Symbol.iterator]());  // Returns true
```

### util.types.isModuleNamespaceObject(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

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
* 返回：{boolean}

Returns `true` if the value is an instance of a built-in [`Error`][] type.

```js
util.types.isNativeError(new Error());  // Returns true
util.types.isNativeError(new TypeError());  // Returns true
util.types.isNativeError(new RangeError());  // Returns true
```

### util.types.isNumberObject(value)<!-- YAML
added: v10.0.0
-->* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a number object, e.g. created by `new Number()`.

```js
util.types.isNumberObject(0);  // Returns false
util.types.isNumberObject(new Number(0));   // Returns true
```

### util.types.isPromise(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a built-in [`Promise`][].

```js
util.types.isPromise(Promise.resolve(42));  // Returns true
```

### util.types.isProxy(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a [`Proxy`][] instance.

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

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a regular expression object.

```js
util.types.isRegExp(/abc/);  // Returns true
util.types.isRegExp(new RegExp('abc'));  // Returns true
```

### util.types.isSet(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a built-in [`Set`][] instance.

```js
util.types.isSet(new Set());  // Returns true
```

### util.types.isSetIterator(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is an iterator returned for a built-in [`Set`][] instance.

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

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a built-in [`SharedArrayBuffer`][] instance. This does *not* include [`ArrayBuffer`][] instances. Usually, it is desirable to test for both; See [`util.types.isAnyArrayBuffer()`][] for that.

```js
util.types.isSharedArrayBuffer(new ArrayBuffer());  // Returns false
util.types.isSharedArrayBuffer(new SharedArrayBuffer());  // Returns true
```

### util.types.isStringObject(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a string object, e.g. created by `new String()`.

```js
util.types.isStringObject('foo');  // Returns false
util.types.isStringObject(new String('foo'));   // Returns true
```

### util.types.isSymbolObject(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a symbol object, created by calling `Object()` on a `Symbol` primitive.

```js
const symbol = Symbol('foo');
util.types.isSymbolObject(symbol);  // Returns false
util.types.isSymbolObject(Object(symbol));   // Returns true
```

### util.types.isTypedArray(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a built-in [`TypedArray`][] instance.

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

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a built-in [`Uint8Array`][] instance.

```js
util.types.isUint8Array(new ArrayBuffer());  // Returns false
util.types.isUint8Array(new Uint8Array());  // Returns true
util.types.isUint8Array(new Float64Array());  // Returns false
```

### util.types.isUint8ClampedArray(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a built-in [`Uint8ClampedArray`][] instance.

```js
util.types.isUint8ClampedArray(new ArrayBuffer());  // Returns false
util.types.isUint8ClampedArray(new Uint8ClampedArray());  // Returns true
util.types.isUint8ClampedArray(new Float64Array());  // Returns false
```

### util.types.isUint16Array(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a built-in [`Uint16Array`][] instance.

```js
util.types.isUint16Array(new ArrayBuffer());  // Returns false
util.types.isUint16Array(new Uint16Array());  // Returns true
util.types.isUint16Array(new Float64Array());  // Returns false
```

### util.types.isUint32Array(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a built-in [`Uint32Array`][] instance.

```js
util.types.isUint32Array(new ArrayBuffer());  // Returns false
util.types.isUint32Array(new Uint32Array());  // Returns true
util.types.isUint32Array(new Float64Array());  // Returns false
```

### util.types.isWeakMap(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a built-in [`WeakMap`][] instance.

```js
util.types.isWeakMap(new WeakMap());  // Returns true
```

### util.types.isWeakSet(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a built-in [`WeakSet`][] instance.

```js
util.types.isWeakSet(new WeakSet());  // Returns true
```

### util.types.isWebAssemblyCompiledModule(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* 返回：{boolean}

Returns `true` if the value is a built-in [`WebAssembly.Module`][] instance.

```js
const module = new WebAssembly.Module(wasmBuffer);
util.types.isWebAssemblyCompiledModule(module);  // Returns true
```

## 已弃用的API

The following APIs are deprecated and should no longer be used. 现有的应用程序和模块都应被更新，以找到替代方法。

### util.\_extend(target, source)<!-- YAML
added: v0.7.5
deprecated: v6.0.0
-->* `target` {Object}
* `source` {Object}

> 稳定性：0 - 已弃用：改为使用 [`Object.assign()`]。

`util._extend()` 方法从未打算在内部 Node.js 模块之外被使用。 尽管如此，但社区还是发现并使用了它。

它已被弃用，不应在新代码中使用。 JavaScript 中具有通过 [`Object.assign()`] 实现的，非常类似的内置功能。

### util.debug(string)<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->> 稳定性：0 - 已弃用：改为使用 [`console.error()`][]。

* `string` {string} 打印到 `stderr` 的消息

已弃用的 `console.error` 的前身。

### util.error([...strings])<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->> 稳定性：0 - 已弃用：改为使用 [`console.error()`][]。

* `...strings` {string} 打印到 `stderr` 的消息

已弃用的 `console.error` 的前身。

### util.isArray(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use [`Array.isArray()`][] instead.

* `object` {any}
* 返回：{boolean}

Alias for [`Array.isArray()`][].

如果给定的 `object` 是一个 `Array`，则返回 `true`。 否则，返回 `false`。

```js
const util = require('util');

util.isArray([]);
// Returns: true
util.isArray(new Array());
// Returns: true
util.isArray({});
// Returns: false
```

### util.isBoolean(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use `typeof value === 'boolean'` instead.

* `object` {any}
* 返回：{boolean}

如果给定的 `object` 是 `Boolean`，则返回 `true`。 否则，返回 `false`。

```js
const util = require('util');

util.isBoolean(1);
// Returns: false
util.isBoolean(0);
// Returns: false
util.isBoolean(false);
// Returns: true
```

### util.isBuffer(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> 稳定性：0 - 已弃用：改为使用[`Buffer.isBuffer()`][]。

* `object` {any}
* 返回：{boolean}

如果给定的 `object` 是 `Buffer`，则返回 `true`。 否则，返回 `false`。

```js
const util = require('util');

util.isBuffer({ length: 0 });
// Returns: false
util.isBuffer([]);
// Returns: false
util.isBuffer(Buffer.from('hello world'));
// Returns: true
```

### util.isDate(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use [`util.types.isDate()`][] instead.

* `object` {any}
* 返回：{boolean}

如果给定的 `object` 是 `Date`，则返回 `true`。 否则，返回 `false`。

```js
const util = require('util');

util.isDate(new Date());
// Returns: true
util.isDate(Date());
// false (without 'new' returns a String)
util.isDate({});
// Returns: false
```

### util.isError(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use [`util.types.isNativeError()`][] instead.

* `object` {any}
* 返回：{boolean}

如果给定的 `object` 是一个 [`Error`][]，则返回 `true`。 否则，返回 `false`。

```js
const util = require('util');

util.isError(new Error());
// Returns: true
util.isError(new TypeError());
// Returns: true
util.isError({ name: 'Error', message: 'an error occurred' });
// Returns: false
```

注意这个方法依赖于 `Object.prototype.toString()` 的行为。 当 `object` 参数操作 `@@toStringTag` 时可能会获得不正确的结果。

```js
const util = require('util');
const obj = { name: 'Error', message: 'an error occurred' };

util.isError(obj);
// Returns: false
obj[Symbol.toStringTag] = 'Error';
util.isError(obj);
// Returns: true
```

### util.isFunction(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use `typeof value === 'function'` instead.

* `object` {any}
* 返回：{boolean}

如果给定的 `object` 是 `Function`，则返回 `true`。 否则，返回 `false`。

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

### util.isNull(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use `value === null` instead.

* `object` {any}
* 返回：{boolean}

如果给定的 `object` 严格为 `null`，则返回 `true`。 否则，返回 `false`。

```js
const util = require('util');

util.isNull(0);
// Returns: false
util.isNull(undefined);
// Returns: false
util.isNull(null);
// Returns: true
```

### util.isNullOrUndefined(object)
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `value === undefined || value === null` instead.

* `object` {any}
* 返回：{boolean}

如果给定的 `object` 是 `null` 或 `undefined`，则返回 `true`。 否则，返回 `false`。

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
* 返回：{boolean}

如果给定的 `object` 是 `Number`，则返回 `true`。 否则，返回 `false`。

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
* 返回：{boolean}

Returns `true` if the given `object` is strictly an `Object` **and** not a `Function` (even though functions are objects in JavaScript). 否则，返回 `false`。

```js
const util = require('util');

util.isObject(5);
// Returns: false
util.isObject(null);
// Returns: false
util.isObject({});
// Returns: true
util.isObject(() => {});
// Returns: false
```

### util.isPrimitive(object)
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use `(typeof value !== 'object' && typeof value !== 'function') || value === null` instead.

* `object` {any}
* 返回：{boolean}

如果给定的 `object` 是基本类型，则返回 `true`。 否则，返回 `false`。

```js
const util = require('util');

util.isPrimitive(5);
// Returns: true
util.isPrimitive('foo');
// Returns: true
util.isPrimitive(false);
// Returns: true
util.isPrimitive(null);
// Returns: true
util.isPrimitive(undefined);
// Returns: true
util.isPrimitive({});
// Returns: false
util.isPrimitive(() => {});
// Returns: false
util.isPrimitive(/^$/);
// Returns: false
util.isPrimitive(new Date());
// Returns: false
```

### util.isRegExp(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> 稳定性：0 - 已弃用

* `object` {any}
* 返回：{boolean}

如果给定的 `object` 是 `RegExp`，则返回 `true`。 否则，返回 `false`。

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
* 返回：{boolean}

如果给定的 `object` 是一个 `字符串`，则返回 `true`。 否则，返回 `false`。

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

### util.isSymbol(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stability: 0 - Deprecated: Use `typeof value === 'symbol'` instead.

* `object` {any}
* 返回：{boolean}

如果给定的 `object` 是 `Symbol`，则返回 `true`。 否则，返回 `false`。

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
* 返回：{boolean}

如果给定的 `object` 是 `undefined`，则返回 `true`。 否则，返回 `false`。

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

### util.log(string)<!-- YAML
added: v0.3.0
deprecated: v6.0.0
-->> 稳定性：0 - 已弃用：改为使用第三方模块。

* `string` {string}

`util.log()` 方法在 `标准输出` 打印包含时间戳的给定 `string`。

```js
const util = require('util');

util.log('Timestamped message.');
```

### util.print([...strings])<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->> 稳定性：0 - 已弃用：改为使用 [`console.log()`][]。

已弃用的 `console.log` 的前身。

### util.puts([...strings])<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->> 稳定性：0 - 已弃用：改为使用 [`console.log()`][]。

已弃用的 `console.log` 的前身。
