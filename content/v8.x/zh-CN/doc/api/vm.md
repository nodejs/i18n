# VM (运行 JavaScript)

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定

<!--name=vm-->

`vm` 模块提供了用于在 V8 虚拟机上下文中编译和运行代码的一组 API。

JavaScript 代码可被编译并立即运行，或者编译，保存，并稍后运行。

一个常见的用例就是在一个沙盒环境中运行代码。 沙盒代码使用不同的 V8 上下文，这意味着与代码的其他部分不同，它具有一个不同的全局对象。

可以通过 ["contextifying"](#vm_what_does_it_mean_to_contextify_an_object) 沙盒对象来提供上下文。 沙盒代码将沙盒中的任何属性都视为全局变量。 由沙盒代码导致的任何对全局变量的更改都会被体现在沙盒对象上。

```js
const vm = require('vm');

const x = 1;

const sandbox = { x: 2 };
vm.createContext(sandbox); // Contextify the sandbox.

const code = 'x += 40; var y = 17;';
// x and y are global variables in the sandboxed environment.
// Initially, x has the value 2 because that is the value of sandbox.x.
vm.runInContext(code, sandbox);

console.log(sandbox.x); // 42
console.log(sandbox.y); // 17

console.log(x); // 1; y is not defined.
```

*注意*：vm 模块不是一个安全机制。 **不要使用它来运行不受信任的代码**。

## 类：vm.Script
<!-- YAML
added: v0.3.1
-->

`vm.Script` 类的实例包含预编译的，可在特定沙盒（或 “上下文”）中运行的脚本。

### new vm.Script(code, options)
<!-- YAML
added: v0.3.1
changes:
  - version: v5.7.0
    pr-url: https://github.com/nodejs/node/pull/4777
    description: The `cachedData` and `produceCachedData` options are
                 supported now.
-->

* `code` {string} 要编译的 JavaScript 代码。
* `options`
  * `filename` {string} 指定此脚本生成的追溯栈中使用的文件名。
  * `lineOffset` {number} 指定此脚本生成的追溯栈中显示的行号偏移量。
  * `columnOffset` {number} 指定此脚本生成的追溯栈中显示的列号偏移量。
  * `displayErrors` {boolean} 当值为 `true` 时，如果在编译 `code` 时发生 [`Error`][] 错误，导致错误的代码行会被附加到追溯栈。
  * `timeout` {number} 指定在结束运行前执行 `code` 的毫秒数。 如果运行被终止，则抛出 [`Error`][]。
  * `cachedData` {Buffer} 提供可选的，包含针对给定源的 V8 代码缓存数据的 `Buffer`。 当提供时，`cachedDataRejected` 值将被设置为 `true` 或 `false`，具体值取决于 V8 对数据的接受程度。
  * `produceCachedData` {boolean} 当值为 `true` 时，且 `cachedData` 不存在时，V8 会尝试为 `code` 生成代码缓存数据。 成功后，将生成具有 V8 代码缓存数据的 `Buffer`，并存储在返回的 `vm.Script` 实例的 `cachedData` 属性中。 `cachedDataProduced` 的值将被设置为 `true` 或 `false`，具体取决于代码缓存数据是否被成功生成。

创建新的 `vm.Script` 对象会编译 `code` 但不会运行它。 编译过的 `vm.Script` 可以在以后被多次运行。 `code` 不会被绑定到任何全局对象；恰恰相反，它在每次运行前被绑定，并只针对该次运行而绑定。

### script.runInContext(contextifiedSandbox[, options])
<!-- YAML
added: v0.3.1
changes:
  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/6635
    description: The `breakOnSigint` option is supported now.
-->

* `contextifiedSandbox` {Object} 由 `vm.createContext()` 方法返回的 [contextified](#vm_what_does_it_mean_to_contextify_an_object) 对象。
* `options` {Object}
  * `filename` {string} 指定此脚本生成的追溯栈中使用的文件名。
  * `lineOffset` {number} 指定此脚本生成的追溯栈中显示的行号偏移量。
  * `columnOffset` {number} 指定此脚本生成的追溯栈中显示的列号偏移量。
  * `displayErrors` {boolean} 当值为 `true` 时，如果在编译 `code` 时发生 [`Error`][] 错误，导致错误的代码行会被附加到追溯栈。
  * `timeout` {number} 指定在结束运行前执行 `code` 的毫秒数。 如果运行被终止，则抛出 [`Error`][]。
  * `breakOnSigint`：如果值为 `true`，则在收到 `SIGINT` (Ctrl+C) 时，执行将被终止。 Existing handlers for the event that have been attached via `process.on('SIGINT')` will be disabled during script execution, but will continue to work after that. 如果运行被终止，则抛出 [`Error`][] 。


在已提供的 `contextifiedSandbox` 中运行 `vm.Script` 对象包含的已编译代码，并返回结果。 正在运行的代码不能访问本地作用域。

如下的示例将编译并多次运行代码，该代码会增加全局变量的值，并设置另一个全局变量的值。 全局变量被包含在 `sandbox` 对象中。

```js
const util = require('util');
const vm = require('vm');

const sandbox = {
  animal: 'cat',
  count: 2
};

const script = new vm.Script('count += 1; name = "kitty";');

const context = vm.createContext(sandbox);
for (let i = 0; i < 10; ++i) {
  script.runInContext(context);
}

console.log(util.inspect(sandbox));

// { animal: 'cat', count: 12, name: 'kitty' }
```

*注意*：使用 `timeout` 或 `breakOnSigint` 选项会导致新的事件循环，且对应的线程将被启动，并会导致非零的性能开销。

### script.runInNewContext([sandbox[, options]])
<!-- YAML
added: v0.3.1
-->

* `sandbox` {Object} 将被 [contextified](#vm_what_does_it_mean_to_contextify_an_object) 的对象。 如果 `undefined`，将会创建一个新的对象。
* `options` {Object}
  * `filename` {string} 指定此脚本生成的追溯栈中使用的文件名。
  * `lineOffset` {number} 指定此脚本生成的追溯栈中显示的行号偏移量。
  * `columnOffset` {number} 指定此脚本生成的追溯栈中显示的列号偏移量。
  * `displayErrors` {boolean} 当值为 `true` 时，如果在编译 `code` 时发生 [`Error`][] 错误，导致错误的代码行将被附加到追溯栈。
  * `timeout` {number} 指定在结束运行前执行 `code` 的毫秒数。 如果运行被终止，则抛出 [`Error`][]。

首先 contextifies 给定的 `sandbox`，在已创建的沙盒中运行 `vm.Script` 对象包含的已编译代码，并返回结果。 正在运行的代码不能访问本地作用域。

如下的示例编译设置了全局变量的代码，并在不同的上下文中多次运行该代码。 全局变量被赋值，且被包含于每个单独的 `sandbox` 中。

```js
const util = require('util');
const vm = require('vm');

const script = new vm.Script('globalVar = "set"');

const sandboxes = [{}, {}, {}];
sandboxes.forEach((sandbox) => {
  script.runInNewContext(sandbox);
});

console.log(util.inspect(sandboxes));

// [{ globalVar: 'set' }, { globalVar: 'set' }, { globalVar: 'set' }]
```

### script.runInThisContext([options])
<!-- YAML
added: v0.3.1
-->

* `options` {Object}
  * `filename` {string} 指定此脚本生成的追溯栈中使用的文件名。
  * `lineOffset` {number} 指定此脚本生成的追溯栈中显示的行号偏移量。
  * `columnOffset` {number} 指定此脚本生成的追溯栈中显示的列号偏移量。
  * `displayErrors` {boolean} 当值为 `true` 时，如果在编译 `code` 时发生 [`Error`][] 错误，导致错误的代码行会被附加到追溯栈。
  * `timeout` {number} 指定在结束运行前执行 `code` 的毫秒数。 如果运行被终止，则抛出 [`Error`][]。

在当前 `global` 对象的上下文中运行 `vm.Script` 中包含的已编译代码。 正在运行的代码不能访问本地作用域，但 *可以* 访问当前的 `global` 对象。

如下示例编译增加 `global` 变量值的代码并多次运行该代码：

```js
const vm = require('vm');

global.globalVar = 0;

const script = new vm.Script('globalVar += 1', { filename: 'myfile.vm' });

for (let i = 0; i < 1000; ++i) {
  script.runInThisContext();
}

console.log(globalVar);

// 1000
```

## vm.createContext([sandbox])
<!-- YAML
added: v0.3.1
-->

* `sandbox` {Object}

如果给定 `sandbox` 对象，`vm.createContext()` 方法将会 [准备沙盒](#vm_what_does_it_mean_to_contextify_an_object)，这样该沙盒就可以在调用 [`vm.runInContext()`][] 或[`script.runInContext()`][] 时被使用。 在该脚本中，`sandbox` 对象将会是全局对象，会保留其所有现有属性，同时具有任何标准 [global object](https://es5.github.io/#x15.1) 具有的内置对象和函数。 在 vm 模块运行脚本之外，全局变量将不被更改。

```js
const util = require('util');
const vm = require('vm');

global.globalVar = 3;

const sandbox = { globalVar: 1 };
vm.createContext(sandbox);

vm.runInContext('globalVar *= 2;', sandbox);

console.log(util.inspect(sandbox)); // { globalVar: 2 }

console.log(util.inspect(globalVar)); // 3
```

如果 `sandbox` 被省略 （或显式传递为 `undefined`），则会返回一个新的空 [contextified](#vm_what_does_it_mean_to_contextify_an_object) 沙盒对象。

`vm.createContext()` 方法主要在创建可运行多个脚本的单一沙盒时有用。 例如，如果模仿一个 web 浏览器，该方法可被用于创建一个代表窗口全局对象的单一沙盒，之后在该沙盒的上下文中一起运行所有标签。

## vm.isContext(sandbox)
<!-- YAML
added: v0.11.7
-->

* `sandbox` {Object}

如果给定的 `sandbox` 对象已经通过 [`vm.createContext()`][] 被 [contextified](#vm_what_does_it_mean_to_contextify_an_object)，则返回 `true`。

## vm.runInContext(code, contextifiedSandbox[, options])

* `code` {string} 要编译和运行的 JavaScript 代码。
* `contextifiedSandbox` {Object} 当 `code` 被编译和运行时，将被作为 `global` 的 [contextified](#vm_what_does_it_mean_to_contextify_an_object) 对象。
* `options`
  * `filename` {string} 指定此脚本生成的追溯栈中使用的文件名。
  * `lineOffset` {number} 指定此脚本生成的追溯栈中显示的行号偏移量。
  * `columnOffset` {number} 指定此脚本生成的追溯栈中显示的列号偏移量。
  * `displayErrors` {boolean} 当值为 `true` 时，如果在编译 `code` 时发生 [`Error`][] 错误，导致错误的代码行将被附加到追溯栈。
  * `timeout` {number} 指定在结束运行前执行 `code` 的毫秒数。 如果运行被终止，则抛出 [`Error`][]。

`vm.runInContext()` 方法会编译 `code`，在 `contextifiedSandbox` 的上下文中运行该代码，并返回结果。 正在运行的代码不能访问本地作用域。 `contextifiedSandbox` 对象 *必须* 在之前已经通过 [`vm.createContext()`][] 方法被 [contextified](#vm_what_does_it_mean_to_contextify_an_object)。

如下示例使用单一的 [contextified](#vm_what_does_it_mean_to_contextify_an_object) 对象编译并运行不同的脚本。

```js
const util = require('util');
const vm = require('vm');

const sandbox = { globalVar: 1 };
vm.createContext(sandbox);

for (let i = 0; i < 10; ++i) {
  vm.runInContext('globalVar *= 2;', sandbox);
}
console.log(util.inspect(sandbox));

// { globalVar: 1024 }
```

## vm.runInDebugContext(code)
<!-- YAML
added: v0.11.14
-->

> 稳定性：0 - 已弃用。 替换方案正在开发中。

* `code` {string} 要编译和运行的 JavaScript 代码。

`vm.runInDebugContext()` 方法在 V8 调试上下文中编译和执行 `code`。 主要用例是获得对 V8 `Debug` 对象的访问：

```js
const vm = require('vm');
const Debug = vm.runInDebugContext('Debug');
console.log(Debug.findScript(process.emit).name);  // 'events.js'
console.log(Debug.findScript(process.exit).name);  // 'internal/process.js'
```

*注意*：调试上下文及对象在本质上是和 V8 调试器的实现相绑定的，且可能在没有事先警告的情况下更改（甚至被删除）。

也可以使用 V8 特定的 `--expose_debug_as=` [命令行选项](cli.html) 来提供 `Debug` 对象。

## vm.runInNewContext(code\[, sandbox\]\[, options\])
<!-- YAML
added: v0.3.1
-->

* `code` {string} 要编译和运行的 JavaScript 代码。
* `sandbox` {Object} 将被 [contextified](#vm_what_does_it_mean_to_contextify_an_object) 的对象。 如果 `undefined`，将会创建一个新的对象。
* `options`
  * `filename` {string} 指定此脚本生成的追溯栈中使用的文件名。
  * `lineOffset` {number} 指定此脚本生成的追溯栈中显示的行号偏移量。
  * `columnOffset` {number} 指定此脚本生成的追溯栈中显示的列号偏移量。
  * `displayErrors` {boolean} 当值为 `true` 时，如果在编译 `code` 时发生 [`Error`][] 错误，导致错误的代码行会被附加到追溯栈。
  * `timeout` {number} 指定在结束运行前执行 `code` 的毫秒数。 如果运行被终止，则抛出 [`Error`][]。

`vm.runInNewContext()` 首先会 contextifies 给定的 `sandbox` 对象 （如果传递的是 `undefined`，则会新建一个 `sandbox` ），在创建的上下文中编译和运行 `code` ，并返回结果。 正在运行的代码不能访问本地作用域。

如下示例编译并运行代码，该代码增加一个全局变量的值，并给新的变量赋值。 这些全局变量被包含在 `sandbox` 中。

```js
const util = require('util');
const vm = require('vm');

const sandbox = {
  animal: 'cat',
  count: 2
};

vm.runInNewContext('count += 1; name = "kitty"', sandbox);
console.log(util.inspect(sandbox));

// { animal: 'cat', count: 3, name: 'kitty' }
```

## vm.runInThisContext(code[, options])
<!-- YAML
added: v0.3.1
-->

* `code` {string} 要编译和运行的 JavaScript 代码。
* `options`
  * `filename` {string} 指定此脚本生成的追溯栈中使用的文件名。
  * `lineOffset` {number} 指定此脚本生成的追溯栈中显示的行号偏移量。
  * `columnOffset` {number} 指定此脚本生成的追溯栈中显示的列号偏移量。
  * `displayErrors` {boolean} 当值为 `true` 时，如果在编译 `code` 时发生 [`Error`][] 错误，导致错误的代码行将被附加到追溯栈。
  * `timeout` {number} 指定在结束运行前执行 `code` 的毫秒数。 如果运行被终止，则抛出 [`Error`][]。

`vm.runInThisContext()` 会编译 `code`，在当前 `global` 的上下文中运行该代码，并返回结果。 正在运行的代码不能访问本地作用域，但可以访问当前的 `global` 对象。

下面的示例演示如何使用 `vm.runInThisContext()` 和 JavaScript [`eval()`][] 函数来运行同样的代码：
```js
const vm = require('vm');
let localVar = 'initial value';

const vmResult = vm.runInThisContext('localVar = "vm";');
console.log('vmResult:', vmResult);
console.log('localVar:', localVar);

const evalResult = eval('localVar = "eval";');
console.log('evalResult:', evalResult);
console.log('localVar:', localVar);

// vmResult: 'vm', localVar: 'initial value'
// evalResult: 'eval', localVar: 'eval'
```

由于 `vm.runInThisContext()` 不能访问本地作用域，`localVar` 未被更改。 恰恰相反，[`eval()`][] *可以* 访问本地作用域，因此 `localVar` 的值被更改了。 通过这种方式，`vm.runInThisContext()` 就类似于 [间接 `eval()` 调用]，即：`(0,eval)('code')`。

## 示例：在 VM 中运行一个 HTTP 服务器

当使用 [`script.runInThisContext()`][] 或 [`vm.runInThisContext()`][] 时，代码会在当前 V8 全局上下文中运行。 传递给此 VM 上下文的代码将具有自己隔离的作用域。

为了使用 `http` 模块运行一个简单的 web 服务器，传递给上下文的代码必须自己调用 `require('http')`，或者具有传递给它的 `http` 模块的引用。 例如：

```js
'use strict';
const vm = require('vm');

const code = `
((require) => {
  const http = require('http');

  http.createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('Hello World\\n');
  }).listen(8124);

  console.log('Server running at http://127.0.0.1:8124/');
})`;

vm.runInThisContext(code)(require);
 ```

*注意*：在上述情况下，`require()` 与它从之传递的上下文共享状态。 这可能会在运行不受信任代码时引入风险，即：以不希望的方式更改上下文中的对象。

## "contextify" 一个对象是什么意思？

在 Node.js 中运行的所有 JavaScript 都在 “上下文” 的作用域内运行。 根据 [V8 嵌入式指南](https://github.com/v8/v8/wiki/Embedder's%20Guide#contexts)：

> 在 V8 中，上下文是一个执行环境，它允许在一个单一的 V8 实例中运行分离的，不相关的 JavaScript 应用程序。 你必须显式指定要在其中运行任何 JavaScript 代码的上下文。

当 `vm.createContext()` 方法被调用时，传入的（如果 `sandbox` 是 `undefined`，则是新创建的对象） `sandbox` 对象在内部和一个 V8 上下文的实例相关联。 此 V8 上下文提供了使用 `vm` 模块的方法在一个隔离的，可操作的全局环境中运行的 `code` 。 创建 V8 上下文以及将其和 `sandbox` 对象相关联的过程在此文档中被称作 "contextifying" `sandbox`。
