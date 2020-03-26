# 交互式解释器

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定

`repl` 模块提供了一种 “读取-求值-打印-循环“ (REPL) 的实现，它可作为一个独立的程序或嵌入到其他应用程序中。 可以通过如下方式访问：

```js
const repl = require('repl');
```

## 设计与特性

The `repl` module exports the [`repl.REPLServer`][] class. While running, instances of [`repl.REPLServer`][] will accept individual lines of user input, evaluate those according to a user-defined evaluation function, then output the result. Input and output may be from `stdin` and `stdout`, respectively, or may be connected to any Node.js [stream](stream.html).

Instances of [`repl.REPLServer`][] support automatic completion of inputs, simplistic Emacs-style line editing, multi-line inputs, ANSI-styled output, saving and restoring current REPL session state, error recovery, and customizable evaluation functions.

### 命令及特殊键

所有的 REPL 实例都支持如下的特殊命令：

* `.break` - 当在输入多行表达式时，输入 `.break` 命令 (或按下 `<ctrl>-C` 组合键) 将终止表达式的继续输入或处理。
* `.clear` - 将 REPL的 `context` 重置为一个空对象，并清空当前正在输入的任何多行表达式。
* `.exit` - 关闭输入/输出流，退出 REPL。
* `.help` - 显示此特殊命令的列表。
* `.save` - 将当前 REPL 会话保存到文件：`> .save ./file/to/save.js`
* `.load` - 载入一个文件到当前 REPL 会话。 `> .load ./file/to/load.js`
* `.editor` - Enter editor mode (`<ctrl>-D` to finish, `<ctrl>-C` to cancel).
```js
> .editor
// Entering editor mode (^D to finish, ^C to cancel)
function welcome(name) {
  return `Hello ${name}!`;
}

welcome('Node.js User');

// ^D
'Hello Node.js User!'
>
```

在 REPL 中如下组合键具有特殊作用：

* `<ctrl>-C` - 当按下一次时，具有与 `.break` 命令相同的作用。 当在一个空行上按下两次时，具有和 `.exit` 命令相同的效果。
* `<ctrl>-D` - 和 `.exit` 命令具有相同的效果。
* `<tab>` - When pressed on a blank line, displays global and local (scope) variables. 当在输入时按下，将会显示相关的自动完成选项。

### 默认求值函数

By default, all instances of [`repl.REPLServer`][] use an evaluation function that evaluates JavaScript expressions and provides access to Node.js' built-in modules. This default behavior can be overridden by passing in an alternative evaluation function when the [`repl.REPLServer`][] instance is created.

#### JavaScript 表达式

默认的求值器支持对 JavaScript 表达式的直接求值：
```js
> 1 + 1
2
> const m = 2
undefined
> m + 1
3
```

除非在块级作用域或函数中，否则不论变量是隐式声明的，还是使用 `const`, `let`, 或 `var` 关键字进行声明的，都是声明在全局作用域中。

#### 全局与局部作用域

默认的求值器提供了对全局作用域内存在的任何变量的访问。 It is possible to expose a variable to the REPL explicitly by assigning it to the `context` object associated with each `REPLServer`:

```js
const repl = require('repl');
const msg = 'message';

repl.start('> ').context.m = msg;
```

`context` 对象中的属性在 REPL 中表现为局部变量：
```js
$ node repl_test.js
> m
'message'
```

默认情况下 context 属性不是只读的。 要指定只读的全局变量，必须通过 `Object.defineProperty()` 来定义 context 属性：

```js
const repl = require('repl');
const msg = 'message';

const r = repl.start('> ');
Object.defineProperty(r.context, 'm', {
  configurable: false,
  enumerable: true,
  value: msg
});
```

#### 访问 Node.js 核心模块

当默认求值器被使用时，它将自动加载 Node.js 核心模块到 REPL 环境中。 例如：除非被声明为一个全局或具有作用域的变量，否则输入 `fs` 将在需要时被解释为：`global.fs = require('fs')`。
```js
> fs.createReadStream('./some/file');
```

#### Global Uncaught Exceptions

The REPL uses the [`domain`][] module to catch all uncaught exceptions for that REPL session.

This use of the [`domain`][] module in the REPL has these side effects:

* Uncaught exceptions do not emit the [`'uncaughtException'`][] event.
* Trying to use [`process.setUncaughtExceptionCaptureCallback()`][] throws an [`ERR_DOMAIN_CANNOT_SET_UNCAUGHT_EXCEPTION_CAPTURE`][] error.

#### `_` (下划线) 变量的赋值<!-- YAML
changes:
  - version: v9.8.0
    pr-url: https://github.com/nodejs/node/pull/18919
    description: Added `_error` support.
-->默认情况下，默认的求值器将会把最近的表达式求值结果赋予特殊变量 `_` (下划线)。 显式设置 `_` 为某个值将禁用此行为。
```js
> [ 'a', 'b', 'c' ]
[ 'a', 'b', 'c' ]
> _.length
3
> _ += 1
Expression assignment to _ now disabled.
4
> 1 + 1
2
> _
4
```

Similarly, `_error` will refer to the last seen error, if there was any. Explicitly setting `_error` to a value will disable this behavior.
```js
> throw new Error('foo');
Error: foo
> _error.message
'foo'
```

#### `await` keyword

With the [`--experimental-repl-await`][] command line option specified, experimental support for the `await` keyword is enabled.
```js
> await Promise.resolve(123)
123
> await Promise.reject(new Error('REPL await'))
Error: REPL await
    at repl:1:45
> const timeout = util.promisify(setTimeout);
undefined
> const old = Date.now(); await timeout(1000); console.log(Date.now() - old);
1002
undefined
```

### 自定义求值函数

When a new [`repl.REPLServer`][] is created, a custom evaluation function may be provided. 例如，这可被用于实现完全自定义的 REPL 应用程序。

如下演示了一个 REPL 的假想示例，该示例将文本从一种语言翻译到另一种语言。

```js
const repl = require('repl');
const { Translator } = require('translator');

const myTranslator = new Translator('en', 'fr');

function myEval(cmd, context, filename, callback) {
  callback(null, myTranslator.translate(cmd));
}

repl.start({ prompt: '> ', eval: myEval });
```

#### 可恢复的错误

当用户正在 REPL 中输入时，按下 `<enter>` 键会将当前行的输入发送到 `eval` 函数。 为了支持多行输入，eval 函数可以将 `repl.Recoverable` 的实例返回到给定的回调函数：

```js
function myEval(cmd, context, filename, callback) {
  let result;
  try {
    result = vm.runInThisContext(cmd);
  } catch (e) {
    if (isRecoverableError(e)) {
      return callback(new repl.Recoverable(e));
    }
  }
  callback(null, result);
}

function isRecoverableError(error) {
  if (error.name === 'SyntaxError') {
    return /^(Unexpected end of input|Unexpected token)/.test(error.message);
  }
  return false;
}
```

### 自定义 REPL 输出

By default, [`repl.REPLServer`][] instances format output using the [`util.inspect()`][] method before writing the output to the provided `Writable` stream (`process.stdout` by default). 在构建时可指定 `useColors` 布尔值选项，以指示默认的输出器使用 ANSI 风格的代码给 `util.inspect()` 方法的输出上色。

It is possible to fully customize the output of a [`repl.REPLServer`][] instance by passing a new function in using the `writer` option on construction. 例如，如下的示例只是简单的将输入文本转换为大写：

```js
const repl = require('repl');

const r = repl.start({ prompt: '> ', eval: myEval, writer: myWriter });

function myEval(cmd, context, filename, callback) {
  callback(null, cmd);
}

function myWriter(output) {
  return output.toUpperCase();
}
```

## 类：REPLServer<!-- YAML
added: v0.1.91
-->`repl.REPLServer` 类继承自 [`readline.Interface`][] 类。 `repl.REPLServer` 的实例由 `repl.start()` 方法创建，且 *不应* 使用 JavaScript `new` 关键字直接创建。

### 事件：'exit'<!-- YAML
added: v0.7.7
-->当接收到 `.exit` 命令作为输入，或用户按下两次 `<ctrl>-C` 以发出 `SIGINT` 信号，或按下 `<ctrl>-D` 以在输入流上发出 `'end'` 信号而使 REPL 退出时，会发出 `'exit'` 事件。 监听器回调函数被调用时不带任何参数。

```js
replServer.on('exit', () => {
  console.log('Received "exit" event from repl!');
  process.exit();
});
```

### 事件：'reset'<!-- YAML
added: v0.11.0
-->当 REPL 的 context 属性被重置时，会发出 `'reset'` 事件。 当接收到 `.clear` 命令作为输入时会发出该事件，*除非* REPL 使用默认的求值器，且在 `useGlobal` 选项被设置为 `true` 时创建了 `repl.REPLServer` 实例。 监听器回调函数被调用时会接受 `context` 对象的引用作为唯一的参数。

This can be used primarily to re-initialize REPL context to some pre-defined state:

```js
const repl = require('repl');

function initializeContext(context) {
  context.m = 'test';
}

const r = repl.start({ prompt: '> ' });
initializeContext(r.context);

r.on('reset', initializeContext);
```

当代码被执行时，全局 `'m'` 变量可被更改，但随后的 `.clear` 命令会将其重置为初始值。
```js
$ ./node example.js
> m
'test'
> m = 1
1
> m
1
> .clear
Clearing context...
> m
'test'
>
```

### replServer.defineCommand(keyword, cmd)<!-- YAML
added: v0.3.0
-->* `keyword` {string} 命令关键字 (*不包含* 起始的 `.` 字符)。
* `cmd` {Object|Function} 当命令被处理时要调用的函数。

`replServer.defineCommand()` 方法被用于将新的 `.` 前缀命令添加到 REPL 实例。 这些命令可通过键入 `.` 加 `关键字` 来调用。 The `cmd` is either a `Function` or an `Object` with the following properties:

* `help` {string} 当 输入 `.help` 时显示的帮助文本 (可选的)。
* `action` {Function} 要运行的函数，可选择性的接受一个字符串参数。

如下示例演示了添加到 REPL 实例的两个新命令：

```js
const repl = require('repl');

const replServer = repl.start({ prompt: '> ' });
replServer.defineCommand('sayhello', {
  help: 'Say hello',
  action(name) {
    this.clearBufferedCommand();
    console.log(`Hello, ${name}!`);
    this.displayPrompt();
  }
});
replServer.defineCommand('saybye', function saybye() {
  console.log('Goodbye!');
  this.close();
});
```

在 REPL 实例中可使用新的命令：

```txt
> .sayhello Node.js User
Hello, Node.js User!
> .saybye
Goodbye!
```

### replServer.displayPrompt([preserveCursor])<!-- YAML
added: v0.1.91
-->* `preserveCursor` {boolean}

`replServer.displayPrompt()` 方法让 REPL 实例准备就绪来接受用户输入，在 `output` 的新行中打印配置的 `提示符`，并返回 `input` 以接受新的输入。

当键入了多行输入时，会打印省略号而不是 '提示符'。

当 `preserveCursor` 的值为 `true` 时，光标位置不会被复位到 `0`。

`replServer.displayPrompt` 方法主要被使用 `replServer.defineCommand()` 方法注册的命令的执行函数所调用。

### replServer.clearBufferedCommand()<!-- YAML
added: v9.0.0
-->The `replServer.clearBufferedCommand()` method clears any command that has been buffered but not yet executed. This method is primarily intended to be called from within the action function for commands registered using the `replServer.defineCommand()` method.

### replServer.parseREPLKeyword(keyword[, rest])<!-- YAML
added: v0.8.9
deprecated: v9.0.0
-->* `keyword` {string} the potential keyword to parse and execute
* `rest` {any} any parameters to the keyword command
* 返回：{boolean}

> 稳定性：0 - 已弃用。

An internal method used to parse and execute `REPLServer` keywords. Returns `true` if `keyword` is a valid keyword, otherwise `false`.

## repl.start([options])<!-- YAML
added: v0.1.91
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19187
    description: The `REPL_MAGIC_MODE` `replMode` was removed.
  - version: v5.8.0
    pr-url: https://github.com/nodejs/node/pull/5388
    description: The `options` parameter is optional now.
-->* `options` {Object|string}
  * `prompt` {string} 要显示的输入提示符。 **Default:** `'> '` (with a trailing space).
  * `input` {stream.Readable} The `Readable` stream from which REPL input will be read. **默认值：** `process.stdin`.
  * `output` {stream.Writable} The `Writable` stream to which REPL output will be written. **默认值：** `process.stdout`.
  * `terminal` {boolean} 如果值为 `true`，指定 `output` 应被视为一个 TTY 终端，且可以使用 ANSI/VT100 转义符写入。 **Default:** checking the value of the `isTTY` property on the `output` stream upon instantiation.
  * `eval` {Function} 在计算每个给定行输入时使用的函数。 **Default:** an async wrapper for the JavaScript `eval()` function. `eval` 函数出错时会返回 `repl.Recoverable`，来指示输入不完整，并提示需要额外的行。
  * `useColors` {boolean} 如果值为 `true`，指定默认的 `writer` 函数应在 REPL 输出中包含 ANSI 颜色风格。 如果提供了自定义的 `writer` 函数，则此选项不起作用。 **Default:** the REPL instances `terminal` value.
  * `useGlobal` {boolean} 如果值为 `true`，指定默认求值函数将使用 JavaScript `global` 对象作为上下文，而不是为 REPL 实例创建一个新的独立上下文。 Node CLI REPL 将此值设为 `true`。 **默认:** `false`.
  * `ignoreUndefined` {boolean} 如果值为 `true`，指定当命令的返回值为 `undefined` 时，默认 writer 不对该值进行输出。 **默认:** `false`.
  * `writer` {Function} 在写入到 `output` 之前，要调用的对每个命令输出进行格式化的函数。 **Default:** [`util.inspect()`][].
  * `completer` {Function} 用于 Tab 键自动完成的可选函数。 示例请参阅 [`readline.InterfaceCompleter`][] 。
  * `replMode` {symbol} A flag that specifies whether the default evaluator executes all JavaScript commands in strict mode or default (sloppy) mode. 可接受的值为：
    * `repl.REPL_MODE_SLOPPY` - 以 sloppy 模式来计算表达式。
    * `repl.REPL_MODE_STRICT` - 以 strict 模式来计算表达式。 这就等同于在每个 repl 声明前加上 `'use strict'`。
  * `breakEvalOnSigint` - 当收到 `SIGINT`，即：按下 `Ctrl+C` 时，结束计算当前代码段。 这不能和自定义 `eval` 函数一起使用。 **默认:** `false`.
* Returns: {repl.REPLServer}

The `repl.start()` method creates and starts a [`repl.REPLServer`][] instance.

如果 `options` 是一个字符串，则它指定输入提示符：

```js
const repl = require('repl');

// a Unix style prompt
repl.start('$ ');
```

## Node.js 的 REPL

Node.js 自身使用 `repl` 模块来提供它自己的，用于运行 JavaScript 代码的交互界面。 可以通过在运行 Node.js 二进制代码时不传递任何参数 (或传递 `-i` 参数) 的方式来进入交互界面。
```js
$ node
> const a = [1, 2, 3];
undefined
> a
[ 1, 2, 3 ]
> a.forEach((v) => {
...   console.log(v);
...   });
1
2
3
```

### 环境变量选项

Node.js REPL 的不同行为可通过如下环境变量来进行自定义：

 - `NODE_REPL_HISTORY` - When a valid path is given, persistent REPL history will be saved to the specified file rather than `.node_repl_history` in the user's home directory. Setting this value to `''` (an empty string) will disable persistent REPL history. 值中的空白将被去除。 On Windows platforms environment variables with empty values are invalid so set this variable to one or more spaces to disable persistent REPL history.
 - `NODE_REPL_HISTORY_SIZE` - Controls how many lines of history will be persisted if history is available. 必须为一个正数。 **Default:** `1000`.
 - `NODE_REPL_MODE` - May be either `'sloppy'` or `'strict'`. **Default:** `'sloppy'`, which will allow non-strict mode code to be run.

### 历史纪录持久化

默认情况下，Node.js REPL 将会通过把输入保存在用户目录下的 `.node_repl_history` 文件来实现 `node` REPL 会话间历史记录的持久化。 This can be disabled by setting the environment variable `NODE_REPL_HISTORY=''`.

### 在高级行编辑器中使用 Node.js REPL

对于高级行编辑器，可以使用环境变量 `NODE_NO_READLINE=1` 来启动 Node.js。 这会以标准的终端设置来启动主 REPL 和调试 REPL，同时这将允许使用 `rlwrap`。

例如：如下设置可被添加到 `.bashrc` 文件中：

```text
alias node="env NODE_NO_READLINE=1 rlwrap node"
```

### 在单一 Node. js 运行实例中启动多个 REPL 实例

可以在单一的 Node.js 运行实例中创建并运行多个 REPL 实例，它们共享单一的 `global` 对象但具有独立的 I/O 接口。

例如：如下示例在 `stdin`, Unix 套接字，和 TCP 套接字上分别提供了独立的 REPL：

```js
const net = require('net');
const repl = require('repl');
let connections = 0;

repl.start({
  prompt: 'Node.js via stdin> ',
  input: process.stdin,
  output: process.stdout
});

net.createServer((socket) => {
  connections += 1;
  repl.start({
    prompt: 'Node.js via Unix socket> ',
    input: socket,
    output: socket
  }).on('exit', () => {
    socket.end();
  });
}).listen('/tmp/node-repl-sock');

net.createServer((socket) => {
  connections += 1;
  repl.start({
    prompt: 'Node.js via TCP socket> ',
    input: socket,
    output: socket
  }).on('exit', () => {
    socket.end();
  });
}).listen(5001);
```

从命令行上运行此应用程序将会在 stdin 上启动 REPL。 其它 REPL 客户端可通过 Unix 套接字或 TCP 套接字来连接。 例如：可以使用 `telnet` 连接到 TCP 套接字，使用 `socat` 连接到 Unix 和 TCP 套接字。

从一个基于 Unix 套接字的服务器，而不是 stdin 来启动一个 REPL，可以连接到一个长时间运行的 Node.js 进程而无需重启它。

For an example of running a "full-featured" (`terminal`) REPL over a `net.Server` and `net.Socket` instance, see: <https://gist.github.com/TooTallNate/2209310>.

For an example of running a REPL instance over [curl(1)](https://curl.haxx.se/docs/manpage.html), see: <https://gist.github.com/TooTallNate/2053342>.
