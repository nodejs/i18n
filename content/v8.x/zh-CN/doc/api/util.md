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

采用 `异步` 函数 （或返回 Promise 的函数）作为参数，并返回遵循错误优先回调样式的函数，即采用 `(err, value) => ...` 形式的回调函数作为最后一个参数。 在回调函数中，第一个参数为拒绝原因 （如果 Promise resolved，则为`null`），第二个参数则为 resolved 值。

例如：

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

*注意*：

* 回调是异步执行的，且将具有有限的栈回溯。 如果回调函数抛出异常，进程将发出一个 [`'uncaughtException'`][] 事件，如果该事件没有被处理，则将退出。

* 由于 `null` 作为回调函数的第一个参数具有特殊含义，如果一个被包装的函数拒绝 `Promise` 并返回虚值作为原因，则原始值将被存储于 `reason` 字段，并被包装在 `Error` 中。
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

例如：

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

在 `NODE_DEBUG` 环境变量中可以使用逗号来分隔多个 `section` 名称。 例如：`NODE_DEBUG=fs,net,tls`。

## util.deprecate(function, string)
<!-- YAML
added: v0.8.0
-->

`util.deprecate()` 方法将会包装给定的 `函数` 或类并将其标记为已弃用。
```js
const util = require('util');

exports.puts = util.deprecate(function() {
  for (let i = 0, len = arguments.length; i < len; ++i) {
    process.stdout.write(arguments[i] + '\n');
  }
}, 'util.puts: Use console.log instead');
```

当被调用时，`util.deprecate()` 会返回一个函数，该函数会使用 `process.on('warning')` 事件来发送 `DeprecationWarning`。 在默认情况下，此警告将被发送且只被打印到 `stderr` 一次，即在其首次被调用时。 在警告被发送后，包装的 `函数` 被调用。

If either the `--no-deprecation` or `--no-warnings` command line flags are used, or if the `process.noDeprecation` property is set to `true` *prior* to the first deprecation warning, the `util.deprecate()` method does nothing.

如果 `--trace-deprecation` 或 `--trace-warnings` 命令行标志被设置，或者 `process.traceDeprecation` 属性被设置为 `true`，当已弃用的函数被首次调用时，警告和栈追溯将被打印到 `stderr`。

如果设置了 `--throw-deprecation` 命令行标志，或者 `process.throwDeprecation` 属性被设置为 `true`，当被弃用的函数被调用时会抛出异常。

`--throw-deprecation` 命令行标志和 `process.throwDeprecation` 属性优先于 `--trace-deprecation` 和 `process.traceDeprecation`。

## util.format(format[, ...args])<!-- YAML
added: v0.5.3
changes:
  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14558
    description: The `%o` and `%O` specifiers are supported now.
-->* `format` {string} 一个和 `printf` 类似的格式化字符串函数。

`util.format()` 方法返回一个格式化过的字符串，其首个参数的格式和 `printf` 类似。

首个参数是一个包含零个或多个 *占位符* 标记的字符串。 每个占位符标记会被相应的参数转换而来的值所替代。 支持的占位符为：

* `%s` - 字符串。
* `%d` - 数字 （整数或单精度浮点数）。
* `%i` - 整数。
* `%f` - 单精度浮点数。
* `%j` - JSON。 如果参数中包含循环引用，将其替换为字符串 `'[Circular]'`。
* `%o` - 对象。 一个代表对象的字符串，以通用 JavaScript 对象格式来呈现。 类似于 `util.inspect()`，具有 `{ showHidden: true, depth: 4, showProxy: true }` 选项。 这将显示完整的对象，包括不可枚举的符号和属性。
* `%O` - 对象。 一个代表对象的字符串，以通用 JavaScript 对象格式来呈现。 类似于没有选项的 `util.inspect()`。 这将显示完整的对象，但不包括不可枚举的符号和属性。
* `%%` - 单个百分号 (`'%'`)。 它不使用参数。

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

## util.getSystemErrorName(err)<!-- YAML
added: v8.12.0
-->* `err` {number}
* 返回：{string}

Returns the string name for a numeric error code that comes from a Node.js API. The mapping between error codes and error names is platform-dependent. See [Common System Errors](errors.html#errors_common_system_errors) for the names of common errors.

```js
fs.access('file/that/does/not/exist', (err) => {
  const name = util.getSystemErrorName(err.errno);
  console.error(name);  // ENOENT
});
```

## util.inherits(constructor, superConstructor)<!-- YAML
added: v0.3.0
changes:
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3455
    description: The `constructor` parameter can refer to an ES6 class now.
-->*注意*：不鼓励使用 `util.inherits()`。 请使用 ES6 中的 `class` 和 `extends` 关键字来获取编程语言中的继承支持。 还请注意这两种风格在 [语义上不兼容](https://github.com/nodejs/node/issues/4179)。

* `constructor` {Function}
* `superConstructor` {Function}

从一个 [构造器](https://developer.mozilla.org/en-US/JavaScript/Reference/Global_Objects/Object/constructor) 中继承原型方法到另一个构造器。 `构造器` 的原型方法将被设定在通过`superConstructor`创建的对象之中。

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

使用 `class` 和 `extends` 的 ES6 范例

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

## util.inspect(object[, options])<!-- YAML
added: v0.3.0
changes:
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
-->* `object` {any} 任何 JavaScript 基本类型或对象。
* `options` {Object}
  * `showHidden` {boolean} 如果值为 `true`，`对象` 的不可枚举的符号和属性将被包含在格式化输出的结果中。 **默认:** `false`.
  * `depth` {number} 指定在格式化 `对象` 时进行递归的次数。 这在检查大型复杂对象时非常有用。 默认值为 `2`。 如果想要使其进行无限递归，则传递 `null` 给它。
  * `colors` {boolean} 如果值为 `true`，则输出结果会以 ANSI 颜色代码来格式化。 Colors are customizable, see [Customizing `util.inspect` colors][]. **默认:** `false`.
  * `customInspect` {boolean} 如果值为 `false`，在导出到 `object` 的 `inspect(depth, opts)` 函数不会被调用。 **Default:** `true`.
  * `showProxy` {boolean} 如果值为 `true`，则对象和 `代理`对象的函数会自省来显示它们的 `target` 和 `handler` 对象。 **默认:** `false`.
  * `maxArrayLength` {number} 指定在格式化时要包含的最大数量的数组和 `TypedArray`。 Set to `null` to show all array elements. Set to `0` or negative to show no array elements. **Default:** `100`.
  * `breakLength` {number} 对象键值被拆分为多行时的长度。 设置为 `Infinity` 会将对象格式化为单行。 **Default:** `60` for legacy compatibility.

`util.inspect()` 方法返回一个代表 `对象` 的字符串，此方法主要是在调试时有用 。 附加的 `选项` 可以更改格式化字符串的某些方面。

如下的范例检查 `util` 对象的所有属性：

```js
const util = require('util');

console.log(util.inspect(util, { showHidden: true, depth: null }));
```

值可以提供它们自己的自定义 `inspect(depth, opts)` 函数，当被调用时，它们会在递归检查中接收当前 `深度`，以及传递给 `util.inspect()` 的 options 对象。

### 自定义 `util.inspect` 颜色<!-- type=misc -->`util.inspect` 的带颜色输出 （如果启用）可以通过 `util.inspect.styles` 和 `util.inspect.colors` 属性进行全局性定义。

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

对象还可以定义自己的 `[util.inspect.custom](depth, opts)` （或等效的但已弃用的 `inspect(depth, opts)`）函数，`util.inspect()` 在检查对象时会调用该自定义函数并使用其结果。

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

### util.inspect.custom<!-- YAML
added: v6.6.0
-->一个可被用来声明自定义检查函数的符号，请参阅 [对象的自定义检查函数](#util_custom_inspection_functions_on_objects)。

### util.inspect.defaultOptions<!-- YAML
added: v6.4.0
-->`defaultOptions` 值允许自定义 `util.inspect` 的默认选项。 这对于 `console.log` 或 `util.format` 类似的函数非常有用，这样的函数会隐式调用 `util.inspect`。 应将其设置为一个包含一个或多个合法 [`util.inspect()`][] 选项的对象。 还支持直接设置选项属性。

```js
const util = require('util');
const arr = Array(101).fill(0);

console.log(arr); // logs the truncated array
util.inspect.defaultOptions.maxArrayLength = null;
console.log(arr); // logs the full array
```

## util.promisify(original)<!-- YAML
added: v8.0.0
-->* `original` {Function}
* 返回：{Function}

采用通用的 error-first 回调风格，即采用 `(err, value) => ...` 回调函数作为最后一个参数，并返回一个返回值为 promises 的版本。

例如：

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

例如：使用 `(foo, onSuccessCallback, onErrorCallback)` 作为参数的函数：

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

一个可被用于声明函数中自定义 promisified 变量的符号，请参阅 [自定义 promisified 函数](#util_custom_promisified_functions)。

## 类：util.TextDecoder<!-- YAML
added: v8.3.0
-->一个实现了 [WHATWG 编码规范](https://encoding.spec.whatwg.org/) 的 `TextDecoder` API。

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

*注意*：在 [WHATWG 编码规范](https://encoding.spec.whatwg.org/) 中列出的 `'iso-8859-16'` 编码不被支持。

### new TextDecoder([encoding[, options]])

* `encoding` {string} 标识这个 `TextDecoder` 实例支持的 `编码`。 **Default:** `'utf-8'`.
* `options` {Object}
  * `fatal` {boolean} `true` 如果解码出现的错误是致命的。 This option is only supported when ICU is enabled (see [Internationalization](intl.html)). **Default:** `false`.
  * `ignoreBOM` {boolean} 当值为 `true` 时，`TextDecoder` 将在解码结果中包括字节顺序标记。 当值为 `false` 时，字节顺序标记将被从输出中删除。 此选项仅在 `encoding` 为 `'utf-8'`, `'utf-16be'` 或 `'utf-16le'` 时被使用。 **默认:** `false`.

创建一个新的 `TextDecoder` 实例。 `encoding` 可以指定一个支持的编码或别名。

### textDecoder.decode([input[, options]])

* `input` {ArrayBuffer|DataView|TypedArray} 一个包含已编码数据的 `ArrayBuffer`, `DataView` 或 Typed Array 实例。
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

## 已弃用的API

以下的 API 已经被弃用，不应再被使用。 现有的应用程序和模块都应被更新，以找到替代方法。

### util.\_extend(target, source)<!-- YAML
added: v0.7.5
deprecated: v6.0.0
-->> 稳定性：0 - 已弃用：改为使用 [`Object.assign()`]。

`util._extend()` 方法从未打算在内部 Node.js 模块之外被使用。 尽管如此，但社区还是发现并使用了它。

它已被弃用，不应在新代码中使用。 JavaScript 中具有通过 [`Object.assign()`] 实现的，非常类似的内置功能。

### util.debug(string)<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->> 稳定性：0 - 已弃用：改为使用 [`console.error()`][]。

* `string` {string} 打印到 `stderr` 的消息

已弃用的 `console.error` 的前身。

### util.error([...strings])
<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->

> 稳定性：0 - 已弃用：改为使用 [`console.error()`][]。

* `...strings` {string} 打印到 `stderr` 的消息

已弃用的 `console.error` 的前身。

### util.isArray(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> 稳定性：0 - 已弃用

* `object` {any}

[`Array.isArray`][] 的内部别名。

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
-->> 稳定性：0 - 已弃用

* `object` {any}

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

### util.isBuffer(object)
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> 稳定性：0 - 已弃用：改为使用[`Buffer.isBuffer()`][]。

* `object` {any}

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
-->> 稳定性：0 - 已弃用

* `object` {any}

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

### util.isError(object)
<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->

> 稳定性：0 - 已弃用

* `object` {any}

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
-->> 稳定性：0 - 已弃用

* `object` {any}

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

### util.isNull(object)
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> 稳定性：0 - 已弃用

* `object` {any}

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

> 稳定性：0 - 已弃用

* `object` {any}

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

> 稳定性：0 - 已弃用

* `object` {any}

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

> 稳定性：0 - 已弃用

* `object` {any}

Returns `true` if the given `object` is strictly an `Object` **and** not a `Function`. 否则，返回 `false`。

```js
const util = require('util');

util.isObject(5);
// Returns: false
util.isObject(null);
// Returns: false
util.isObject({});
// Returns: true
util.isObject(function() {});
// Returns: false
```

### util.isPrimitive(object)
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> 稳定性：0 - 已弃用

* `object` {any}

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
util.isPrimitive(function() {});
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

### util.isString(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> 稳定性：0 - 已弃用

* `object` {any}

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

### util.isSymbol(object)
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> 稳定性：0 - 已弃用

* `object` {any}

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

> 稳定性：0 - 已弃用

* `object` {any}

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

### util.puts([...strings])
<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->

> 稳定性：0 - 已弃用：改为使用 [`console.log()`][]。

已弃用的 `console.log` 的前身。
