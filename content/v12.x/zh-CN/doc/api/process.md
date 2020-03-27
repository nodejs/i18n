# 进程

<!-- introduced_in=v0.10.0 -->
<!-- type=global -->

`process` 是一个 `全局` 对象，它提供当前 Node.js 进程的信息并对其进行控制。 作为一个全局对象，无需使用 `require()` 就可以在 Node.js 应用程序中使用它。 It can also be explicitly accessed using `require()`:

```js
const process = require('process');
```

## 进程事件

`process` 对象是 [`EventEmitter`][] 的实例。

### Event: `'beforeExit'`
<!-- YAML
added: v0.11.12
-->

当 Node.js 清空其事件循环且没有其它工作需要计划时，就会发出 `'beforeExit'` 事件。 通常，当没有计划的工作时 Node.js 进程将会退出，但在 `'beforeExit'` 事件上注册的监听器可以发出异步调用，从而导致 Node.js 进程继续。

监听器回调函数被调用时会接受传入的 [`process.exitCode`][] 的值作为唯一参数。

The `'beforeExit'` event is *not* emitted for conditions causing explicit termination, such as calling [`process.exit()`][] or uncaught exceptions.

The `'beforeExit'` should *not* be used as an alternative to the `'exit'` event unless the intention is to schedule additional work.

```js
process.on('beforeExit', (code) => {
  console.log('Process beforeExit event with code: ', code);
});

process.on('exit', (code) => {
  console.log('Process exit event with code: ', code);
});

console.log('This message is displayed first.');

// Prints:
// This message is displayed first.
// Process beforeExit event with code: 0
// Process exit event with code: 0
```

### Event: `'disconnect'`
<!-- YAML
added: v0.7.7
-->

如果使用 IPC 通道 (请参阅 [子进程](child_process.html) 和 [集群](cluster.html) 文档) 衍生 Node.js 进程，则在关闭 IPC 通道时会发出 `'disconnect'` 事件。

### Event: `'exit'`
<!-- YAML
added: v0.1.7
-->

* `code` {integer}

当 Node.js 进程因以下原因之一即将退出时，会发出 `'exit'` 事件。

* `process.exit()` 方法被显式调用；
* Node.js 事件循环中不再有任何工作需要完成。

此时无法阻止退出事件循环，一旦所有 `'exit'` 事件监听器都结束运行，Node.js 进程将会终止。

The listener callback function is invoked with the exit code specified either by the [`process.exitCode`][] property, or the `exitCode` argument passed to the [`process.exit()`][] method.

```js
process.on('exit', (code) => {
  console.log(`About to exit with code: ${code}`);
});
```

Listener functions **must** only perform **synchronous** operations. 在调用 `'exit'` 事件监听器后，Node.js 进程将会立即退出，这会导致仍在事件循环中排队的任何额外工作被终止。 例如，在如下示例中，超时将永不会发生：

```js
process.on('exit', (code) => {
  setTimeout(() => {
    console.log('This will not run');
  }, 0);
});
```

### Event: `'message'`
<!-- YAML
added: v0.5.10
-->

* `message` { Object | boolean | number | string | null } a parsed JSON object or a serializable primitive value.
* `sendHandle` {net.Server|net.Socket} a [`net.Server`][] or [`net.Socket`][] object, or undefined.

如果使用 IPC 通道 (请参阅 [子进程](child_process.html) 和 [集群](cluster.html) 文档) 衍生 Node.js 进程，则当子进程收到父进程使用 [`childprocess.send()`][] 发送的消息时，会发出 `'message'` 事件。

The message goes through serialization and parsing. The resulting message might not be the same as what is originally sent.

If the `serialization` option was set to `advanced` used when spawning the process, the `message` argument can contain data that JSON is not able to represent. See [Advanced Serialization for `child_process`][] for more details.

### Event: `'multipleResolves'`
<!-- YAML
added: v10.12.0
-->

* `type` {string} The resolution type. One of `'resolve'` or `'reject'`.
* `promise` {Promise} The promise that resolved or rejected more than once.
* `value` {any} The value with which the promise was either resolved or rejected after the original resolve.

The `'multipleResolves'` event is emitted whenever a `Promise` has been either:

* Resolved more than once.
* Rejected more than once.
* Rejected after resolve.
* Resolved after reject.

This is useful for tracking potential errors in an application while using the `Promise` constructor, as multiple resolutions are silently swallowed. However, the occurrence of this event does not necessarily indicate an error. For example, [`Promise.race()`][] can trigger a `'multipleResolves'` event.

```js
process.on('multipleResolves', (type, promise, reason) => {
  console.error(type, promise, reason);
  setImmediate(() => process.exit(1));
});

async function main() {
  try {
    return await new Promise((resolve, reject) => {
      resolve('First call');
      resolve('Swallowed resolve');
      reject(new Error('Swallowed reject'));
    });
  } catch {
    throw new Error('Failed');
  }
}

main().then(console.log);
// resolve: Promise { 'First call' } 'Swallowed resolve'
// reject: Promise { 'First call' } Error: Swallowed reject
//     at Promise (*)
//     at new Promise (<anonymous>)
//     at main (*)
// First call
```

### Event: `'rejectionHandled'`
<!-- YAML
added: v1.4.1
-->

* `promise` {Promise} The late handled promise.

当 `Promise` 被拒绝，同时错误处理程序附加到它上面的时间（例如：使用 [`promise.catch()`][]）晚于一轮 Node.js 事件循环时，会发送 `'rejectionHandled'` 事件。

`Promise` 对象在之前的 `'unhandledRejection'` 事件中被发出，但在处理过程中获得了拒绝处理程序。

`Promise` 链中没有顶层的概念，在该链中始终可以处理拒绝。 它在本质上是异步的，可以在未来的某个时间点处理 `Promise` 拒绝 - 该时间可能比发出 `'unhandledRejection'` 事件所需的事件循环更晚。

另一种表述方式就是，与同步代码中不断增长的未处理异常列表不同，使用 Promise 可能会有不断增长和缩小的未处理拒绝列表。

在同步代码中，当未处理异常列表增长时，会发出 `'uncaughtException'` 事件。

在异步代码中，当未处理拒绝列表增长时会发出 `'unhandledRejection'` 事件，而当未处理拒绝列表缩小时会发出 `'rejectionHandled'` 事件。

```js
const unhandledRejections = new Map();
process.on('unhandledRejection', (reason, promise) => {
  unhandledRejections.set(promise, reason);
});
process.on('rejectionHandled', (promise) => {
  unhandledRejections.delete(promise);
});
```

在此示例中，`unhandledRejections` `Map` 将会随着时间的推移而增长和缩小，从而反映出在开始时未被处理的拒绝随后得到了处理。 可以定期的 (这对长时间运行的应用程序最好) 或在进程退出时 (这对脚本来说是最方便的) 在错误日志中记录此类错误。

### Event: `'uncaughtException'`
<!-- YAML
added: v0.1.18
changes:
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/26599
    description: Added the `origin` argument.
-->

* `err` {Error} The uncaught exception.
* `origin` {string} Indicates if the exception originates from an unhandled rejection or from synchronous errors. Can either be `'uncaughtException'` or `'unhandledRejection'`.

当未捕获的 JavaScript 异常一直冒泡返回到事件循环时，会发出 `'uncaughtException'` 事件。 By default, Node.js handles such exceptions by printing the stack trace to `stderr` and exiting with code 1, overriding any previously set [`process.exitCode`][]. 为 `'uncaughtException'` 事件添加处理程序会覆盖此默认行为。 Alternatively, change the [`process.exitCode`][] in the `'uncaughtException'` handler which will result in the process exiting with the provided exit code. Otherwise, in the presence of such handler the process will exit with 0.

```js
process.on('uncaughtException', (err, origin) => {
  fs.writeSync(
    process.stderr.fd,
    `Caught exception: ${err}\n` +
    `Exception origin: ${origin}`
  );
});

setTimeout(() => {
  console.log('This will still run.');
}, 500);

// Intentionally cause an exception, but don't catch it.
nonexistentFunc();
console.log('This will not run.');
```

#### 警告：正确使用 `'uncaughtException'`

`'uncaughtException'` is a crude mechanism for exception handling intended to be used only as a last resort. The event *should not* be used as an equivalent to `On Error Resume Next`. 未处理的异常本质上意味着应用程序处于一个未定义状态。 在没有正确的从异常中恢复时尝试继续应用程序代码，可能会导致额外的不可预见和不可预测的问题。

从事件处理程序中抛出的异常将不会被捕获。 相反，进程会以非零的状态码退出，且会打印追溯栈。 这是为了避免无限递归。

Attempting to resume normally after an uncaught exception can be similar to pulling out the power cord when upgrading a computer. Nine out of ten times, nothing happens. But the tenth time, the system becomes corrupted.

`'uncaughtException'` 的正确用法是在进程结束前执行一些已分配资源 (例如：文件描述符，句柄等) 的同步清理操作。 **It is not safe to resume normal operation after `'uncaughtException'`.**

To restart a crashed application in a more reliable way, whether `'uncaughtException'` is emitted or not, an external monitor should be employed in a separate process to detect application failures and recover or restart as needed.

### Event: `'unhandledRejection'`
<!-- YAML
added: v1.4.1
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8217
    description: Not handling `Promise` rejections is deprecated.
  - version: v6.6.0
    pr-url: https://github.com/nodejs/node/pull/8223
    description: Unhandled `Promise` rejections will now emit
                 a process warning.
-->

* `reason` {Error|any} 此对象包含了当 promise 被拒绝时的相关信息（通常是一个 [`Error`][] 对象）。
* `promise` {Promise} The rejected promise.

The `'unhandledRejection'` event is emitted whenever a `Promise` is rejected and no error handler is attached to the promise within a turn of the event loop. 当使用 Promise 编程时，异常被封装为 "rejected promise"。 Rejection 可被 [`promise.catch()`][] 捕获并处理，且在 `Promise` 链中被传播。 `'unhandledRejection'` 事件在检测和跟踪被拒绝的 promise，且 rejection 未被处理的时候非常有用。

```js
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

somePromise.then((res) => {
  return reportToUser(JSON.pasre(res)); // Note the typo (`pasre`)
}); // No `.catch()` or `.then()`
```

如下代码还将触发 `'unhandledRejection'` 事件：

```js
function SomeResource() {
  // Initially set the loaded status to a rejected promise
  this.loaded = Promise.reject(new Error('Resource not yet loaded!'));
}

const resource = new SomeResource();
// no .catch or .then on resource.loaded for at least a turn
```

在此示例中，可以像在其他 `'unhandledRejection'` 事件中一样，跟踪开发者错误导致的 rejection。 要解决此类错误，可在 `resource.loaded` 中附加一个不做任何操作的 [`.catch(() => { })`][`promise.catch()`] 处理程序，这样就可以阻止发出 `'unhandledRejection'` 事件。

### Event: `'warning'`
<!-- YAML
added: v6.0.0
-->

* `warning` {Error} Key properties of the warning are:
  * `name` {string} The name of the warning. **Default:** `'Warning'`.
  * `message` {string} 系统提供的警告描述。
  * `stack` {string} 当警告触发时，包含代码位置的追溯栈。

当 Node.js 发出进程警告时，就会发出 `'warning'` 事件。

进程警告和错误的相似之处在于，它描述了需要用户注意的异常条件。 然而，警告不是 Node.js 和 JavaScript 常规错误处理流程的一部分。 Node.js can emit warnings whenever it detects bad coding practices that could lead to sub-optimal application performance, bugs, or security vulnerabilities.

```js
process.on('warning', (warning) => {
  console.warn(warning.name);    // Print the warning name
  console.warn(warning.message); // Print the warning message
  console.warn(warning.stack);   // Print the stack trace
});
```

默认情况下，Node.js 将把进程警告信息打印到 `stderr`。 `--no-warnings` 命令行选项可被用于阻止默认的控制台输出，但 `process` 对象仍会发出 `'warning'` 事件。

The following example illustrates the warning that is printed to `stderr` when too many listeners have been added to an event:

```console
$ node
> events.defaultMaxListeners = 1;
> process.on('foo', () => {});
> process.on('foo', () => {});
> (node:38638) MaxListenersExceededWarning: Possible EventEmitter memory leak
detected. 2 foo listeners added. Use emitter.setMaxListeners() to increase limit
```

相反，如下示例关闭了默认警告输出，并在 `'warning'` 事件中添加了一个自定义处理程序：

```console
$ node --no-warnings
> const p = process.on('warning', (warning) => console.warn('Do not do that!'));
> events.defaultMaxListeners = 1;
> process.on('foo', () => {});
> process.on('foo', () => {});
> Do not do that!
```

`--trace-warnings` 命令行选项可被用于在默认的控制台输出警告信息中包含警告的全部追溯栈。

使用 `--throw-deprecation` 命令行选项启动 Node.js，将会导致自定义已弃用警告被作为异常抛出。

使用 `--trace-deprecation` 命令行选项将会导致自定义已弃用信息和追溯栈都被输出到 `stderr`。

使用 `--no-deprecation` 命令行选项将会阻止报告所有自定义已弃用警告。

The `*-deprecation` command line flags only affect warnings that use the name `'DeprecationWarning'`.

#### 发出自定义警告

See the [`process.emitWarning()`](#process_process_emitwarning_warning_type_code_ctor) method for issuing custom or application-specific warnings.

### 信号事件

<!--type=event-->
<!--name=SIGINT, SIGHUP, etc.-->

当 Node.js 进程接收到信号时会发出信号事件。 Please refer to signal(7) for a listing of standard POSIX signal names such as `'SIGINT'`, `'SIGHUP'`, etc.

Signals are not available on [`Worker`][] threads.

The signal handler will receive the signal's name (`'SIGINT'`, `'SIGTERM'`, etc.) as the first argument.

每个事件的名称将是信号公共名称的大写表示 (例如：对 `SIGINT` 信号而言是 `'SIGINT'`)。

```js
// Begin reading from stdin so the process does not exit.
process.stdin.resume();

process.on('SIGINT', () => {
  console.log('Received SIGINT. Press Control-D to exit.');
});

// Using a single function to handle multiple signals
function handle(signal) {
  console.log(`Received ${signal}`);
}

process.on('SIGINT', handle);
process.on('SIGTERM', handle);
```

* `'SIGUSR1'` is reserved by Node.js to start the [debugger](debugger.html). It's possible to install a listener but doing so might interfere with the debugger.
* `'SIGTERM'` and `'SIGINT'` have default handlers on non-Windows platforms that reset the terminal mode before exiting with code `128 + signal number`. If one of these signals has a listener installed, its default behavior will be removed (Node.js will no longer exit).
* `'SIGPIPE'` is ignored by default. 它可以安装一个监听器。
* `'SIGHUP'` is generated on Windows when the console window is closed, and on other platforms under various similar conditions. See signal(7). 它可以安装监听器，但在大约 10 秒后，Node.js 会被 Windows 无条件终止。 在非 Windows 平台，`SIGHUP` 的默认行为是结束 Node.js，但一旦安装了监听器，其默认行为将被删除。
* `'SIGTERM'` is not supported on Windows, it can be listened on.
* `'SIGINT'` from the terminal is supported on all platforms, and can usually be generated with `<Ctrl>+C` (though this may be configurable). It is not generated when terminal raw mode is enabled.
* `'SIGBREAK'` is delivered on Windows when `<Ctrl>+<Break>` is pressed, on non-Windows platforms it can be listened on, but there is no way to send or generate it.
* `'SIGWINCH'` is delivered when the console has been resized. 在 Windows 平台，只有在移动光标时写入控制台，或在原始模式下使用可读 tty 时才会发生。
* `'SIGKILL'` cannot have a listener installed, it will unconditionally terminate Node.js on all platforms.
* `'SIGSTOP'` cannot have a listener installed.
* `'SIGBUS'`, `'SIGFPE'`, `'SIGSEGV'` and `'SIGILL'`, when not raised artificially using kill(2), inherently leave the process in a state from which it is not safe to attempt to call JS listeners. Doing so might lead to the process hanging in an endless loop, since listeners attached using `process.on()` are called asynchronously and therefore unable to correct the underlying problem.

Windows does not support sending signals, but Node.js offers some emulation with [`process.kill()`][], and [`subprocess.kill()`][]. Sending signal `0` can be used to test for the existence of a process. Sending `SIGINT`, `SIGTERM`, and `SIGKILL` cause the unconditional termination of the target process.

## `process.abort()`
<!-- YAML
added: v0.7.0
-->

`process.abort()` 方法会导致 Node.js 进程立即退出并生成一个核心文件。

This feature is not available in [`Worker`][] threads.

## `process.allowedNodeEnvironmentFlags`
<!-- YAML
added: v10.10.0
-->

* {Set}

The `process.allowedNodeEnvironmentFlags` property is a special, read-only `Set` of flags allowable within the [`NODE_OPTIONS`][] environment variable.

`process.allowedNodeEnvironmentFlags` extends `Set`, but overrides `Set.prototype.has` to recognize several different possible flag representations.  `process.allowedNodeEnvironmentFlags.has()` will return `true` in the following cases:

* Flags may omit leading single (`-`) or double (`--`) dashes; e.g., `inspect-brk` for `--inspect-brk`, or `r` for `-r`.
* Flags passed through to V8 (as listed in `--v8-options`) may replace one or more *non-leading* dashes for an underscore, or vice-versa; e.g., `--perf_basic_prof`, `--perf-basic-prof`, `--perf_basic-prof`, etc.
* Flags may contain one or more equals (`=`) characters; all characters after and including the first equals will be ignored; e.g., `--stack-trace-limit=100`.
* Flags *must* be allowable within [`NODE_OPTIONS`][].

When iterating over `process.allowedNodeEnvironmentFlags`, flags will appear only *once*; each will begin with one or more dashes. Flags passed through to V8 will contain underscores instead of non-leading dashes:

```js
process.allowedNodeEnvironmentFlags.forEach((flag) => {
  // -r
  // --inspect-brk
  // --abort_on_uncaught_exception
  // ...
});
```

The methods `add()`, `clear()`, and `delete()` of `process.allowedNodeEnvironmentFlags` do nothing, and will fail silently.

If Node.js was compiled *without* [`NODE_OPTIONS`][] support (shown in [`process.config`][]), `process.allowedNodeEnvironmentFlags` will contain what *would have* been allowable.

## `process.arch`
<!-- YAML
added: v0.5.0
-->

* {string}

The operating system CPU architecture for which the Node.js binary was compiled. Possible values are: `'arm'`, `'arm64'`, `'ia32'`, `'mips'`,`'mipsel'`, `'ppc'`, `'ppc64'`, `'s390'`, `'s390x'`, `'x32'`, and `'x64'`.

```js
console.log(`This processor architecture is ${process.arch}`);
```

## `process.argv`
<!-- YAML
added: v0.1.27
-->

* {string[]}

`process.argv` 属性返回一个数组，其中包含在 Node.js 启动时传入的命令行参数。 The first element will be [`process.execPath`][]. See `process.argv0` if access to the original value of `argv[0]` is needed. 第二个元素是正在运行的 JavaScript 文件的路径。 剩余元素为任何额外的命令行参数。

例如：假定 `process-args.js` 中的脚本如下所示：

```js
// print process.argv
process.argv.forEach((val, index) => {
  console.log(`${index}: ${val}`);
});
```

以如下方式启动 Node.js 进程：

```console
$ node process-args.js one two=three four
```

将会生成如下输出：

```text
0: /usr/local/bin/node
1: /Users/mjr/work/node/process-args.js
2: one
3: two=three
4: four
```

## `process.argv0`
<!-- YAML
added: v6.4.0
-->

* {string}

`process.argv0` 属性会保存当 Node.js 启动时传入的 `argv[0]` 参数原始值的一份只读副本。

```console
$ bash -c 'exec -a customArgv0 ./node'
> process.argv[0]
'/Volumes/code/external/node/out/Release/node'
> process.argv0
'customArgv0'
```

## `process.channel`
<!-- YAML
added: v7.1.0
-->

* {Object}

If the Node.js process was spawned with an IPC channel (see the [Child Process](child_process.html) documentation), the `process.channel` property is a reference to the IPC channel. If no IPC channel exists, this property is `undefined`.

## `process.chdir(directory)`
<!-- YAML
added: v0.1.17
-->

* `directory` {string}

`process.chdir()` 方法改变 Node.js 进程的当前工作目录，如果改变目录失败 (例如：如果指定的 `directory` 不存在) 则抛出异常。

```js
console.log(`Starting directory: ${process.cwd()}`);
try {
  process.chdir('/tmp');
  console.log(`New directory: ${process.cwd()}`);
} catch (err) {
  console.error(`chdir: ${err}`);
}
```

This feature is not available in [`Worker`][] threads.

## `process.config`
<!-- YAML
added: v0.7.7
-->

* {Object}

The `process.config` property returns an `Object` containing the JavaScript representation of the configure options used to compile the current Node.js executable. 这和运行 `./configure` 脚本时生成的 `config.gypi` 文件一样。

可能的输出如下所示：
```js
{
  target_defaults:
   { cflags: [],
     default_configuration: 'Release',
     defines: [],
     include_dirs: [],
     libraries: [] },
  variables:
   {
     host_arch: 'x64',
     napi_build_version: 5,
     node_install_npm: 'true',
     node_prefix: '',
     node_shared_cares: 'false',
     node_shared_http_parser: 'false',
     node_shared_libuv: 'false',
     node_shared_zlib: 'false',
     node_use_dtrace: 'false',
     node_use_openssl: 'true',
     node_shared_openssl: 'false',
     strict_aliasing: 'true',
     target_arch: 'x64',
     v8_use_snapshot: 1
   }
}
```

The `process.config` property is **not** read-only and there are existing modules in the ecosystem that are known to extend, modify, or entirely replace the value of `process.config`.

## `process.connected`<!-- YAML
added: v0.7.2
-->* {boolean}

如果使用 IPC 通道 (请参阅 [子进程](child_process.html) 和 [集群](cluster.html) 文档) 衍生 Node.js 进程，只要 IPC 通道保持连接，`process.connected` 属性就会返回 `true`，当调用 `process.disconnect()` 后，则返回 `false`。

如果 `process.connected` 的值为 `false`，就不可能通过 IPC 通道使用 `process.send()` 来发送消息。

## `process.cpuUsage([previousValue])`<!-- YAML
added: v6.1.0
-->* `previousValue` {Object} 之前调用 `process.cpuUsage()` 的返回值
* 返回：{Object}
  * `user` {integer}
  * `system` {integer}

`process.cpuUsage()` 方法返回包含当前进程的用户及系统 CPU 时间使用情况的对象，该对象包含 `user` 和 `system` 属性，这些属性的值都是以微秒 (百万之一秒) 计的。 这些值分别计算运行用户和系统代码所需的时间，如果在此进程中使用了多个 CPU 处理器，这些值就有可能大于实际使用的时间。

之前调用 `process.cpuUsage()` 的返回值可作为参数传递给这个函数，以获取差值。

```js
const startUsage = process.cpuUsage();
// { user: 38579, system: 6986 }

// spin the CPU for 500 milliseconds
const now = Date.now();
while (Date.now() - now < 500);

console.log(process.cpuUsage(startUsage));
// { user: 514883, system: 11226 }
```

## `process.cwd()`<!-- YAML
added: v0.1.8
-->* 返回：{string}

`process.cwd()` 方法返回 Node.js 进程的当前工作目录。

```js
console.log(`Current directory: ${process.cwd()}`);
```

## `process.debugPort`<!-- YAML
added: v0.7.2
-->* {number}

The port used by Node.js's debugger when enabled.

```js
process.debugPort = 5858;
```

## `process.disconnect()`
<!-- YAML
added: v0.7.2
-->

如果使用 IPC 通道 (请参阅 [子进程](child_process.html) 和 [集群](cluster.html) 文档) 衍生 Node.js 进程，`process.disconnect()` 方法会关闭连接父进程的 IPC 通道，以允许在没有任何使子进程活跃的连接时使子进程安全退出。

The effect of calling `process.disconnect()` is the same as calling [`ChildProcess.disconnect()`][] from the parent process.

如果 Node.js 进程不是衍生自 IPC 通道，则 `process.disconnect()` 的值为 `undefined`。

## `process.dlopen(module, filename[, flags])`<!-- YAML
added: v0.1.16
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/12794
    description: Added support for the `flags` argument.
-->* `module` {Object}
* `filename` {string}
* `flags` {os.constants.dlopen} **Default:** `os.constants.dlopen.RTLD_LAZY`

The `process.dlopen()` method allows to dynamically load shared objects. It is primarily used by `require()` to load C++ Addons, and should not be used directly, except in special cases. In other words, [`require()`][] should be preferred over `process.dlopen()`, unless there are specific reasons.

The `flags` argument is an integer that allows to specify dlopen behavior. See the [`os.constants.dlopen`][] documentation for details.

If there are specific reasons to use `process.dlopen()` (for instance, to specify dlopen flags), it's often useful to use [`require.resolve()`][] to look up the module's path.

An important drawback when calling `process.dlopen()` is that the `module` instance must be passed. Functions exported by the C++ Addon will be accessible via `module.exports`.

The example below shows how to load a C++ Addon, named as `binding`, that exports a `foo` function. All the symbols will be loaded before the call returns, by passing the `RTLD_NOW` constant. In this example the constant is assumed to be available.

```js
const os = require('os');
process.dlopen(module, require.resolve('binding'),
               os.constants.dlopen.RTLD_NOW);
module.exports.foo();
```

## `process.emitWarning(warning[, options])`<!-- YAML
added: v8.0.0
-->* `warning` {string|Error} 将要发出的警告。
* `options` {Object}
  * `type` {string} When `warning` is a `String`, `type` is the name to use for the *type* of warning being emitted. **Default:** `'Warning'`.
  * `code` {string} 将要发出的警告实例的唯一标识符。
  * `ctor` {Function} When `warning` is a `String`, `ctor` is an optional function used to limit the generated stack trace. **Default:** `process.emitWarning`.
  * `detail` {string} 错误中要包含的额外文字。

`process.emitWarning()` 方法可被用于发出自定义或应用程序特定的进程警告。 These can be listened for by adding a handler to the [`'warning'`](#process_event_warning) event.

```js
// Emit a warning with a code and additional detail.
process.emitWarning('Something happened!', {
  code: 'MY_WARNING',
  detail: 'This is some additional information'
});
// Emits:
// (node:56338) [MY_WARNING] Warning: Something happened!
// This is some additional information
```

In this example, an `Error` object is generated internally by `process.emitWarning()` and passed through to the [`'warning'`](#process_event_warning) handler.

```js
process.on('warning', (warning) => {
  console.warn(warning.name);    // 'Warning'
  console.warn(warning.message); // 'Something happened!'
  console.warn(warning.code);    // 'MY_WARNING'
  console.warn(warning.stack);   // Stack trace
  console.warn(warning.detail);  // 'This is some additional information'
});
```

如果将 `warning` 作为 `Error` 对象进行传递，将会忽略 `options` 参数。

## `process.emitWarning(warning[, type[, code]][, ctor])`<!-- YAML
added: v6.0.0
-->* `warning` {string|Error} 将要发出的警告。
* `type` {string} When `warning` is a `String`, `type` is the name to use for the *type* of warning being emitted. **Default:** `'Warning'`.
* `code` {string} 将要发出的警告实例的唯一标识符。
* `ctor` {Function} When `warning` is a `String`, `ctor` is an optional function used to limit the generated stack trace. **Default:** `process.emitWarning`.

`process.emitWarning()` 方法可被用于发出自定义或应用程序特定的进程警告。 These can be listened for by adding a handler to the [`'warning'`](#process_event_warning) event.

```js
// Emit a warning using a string.
process.emitWarning('Something happened!');
// Emits: (node: 56338) Warning: Something happened!
```

```js
// Emit a warning using a string and a type.
process.emitWarning('Something Happened!', 'CustomWarning');
// Emits: (node:56338) CustomWarning: Something Happened!
```

```js
process.emitWarning('Something happened!', 'CustomWarning', 'WARN001');
// Emits: (node:56338) [WARN001] CustomWarning: Something happened!
```

In each of the previous examples, an `Error` object is generated internally by `process.emitWarning()` and passed through to the [`'warning'`](#process_event_warning) handler.

```js
process.on('warning', (warning) => {
  console.warn(warning.name);
  console.warn(warning.message);
  console.warn(warning.code);
  console.warn(warning.stack);
});
```

If `warning` is passed as an `Error` object, it will be passed through to the `'warning'` event handler unmodified (and the optional `type`, `code` and `ctor` arguments will be ignored):

```js
// Emit a warning using an Error object.
const myWarning = new Error('Something happened!');
// Use the Error name property to specify the type name
myWarning.name = 'CustomWarning';
myWarning.code = 'WARN001';

process.emitWarning(myWarning);
// Emits: (node:56338) [WARN001] CustomWarning: Something happened!
```

如果 `warning` 不是字符串或 `Error` 对象，则会抛出 `TypeError`。

While process warnings use `Error` objects, the process warning mechanism is **not** a replacement for normal error handling mechanisms.

The following additional handling is implemented if the warning `type` is `'DeprecationWarning'`:

* 如果使用了 `--throw-deprecation` 命令行选项，已弃用警告会被作为异常抛出，而不是被作为事件发送。
* 如果使用了 `--no-deprecation` 命令行选项，则不会发出被弃用警告。
* 如果使用了 `--trace-deprecation` 命令行选项，则已弃用警告会和完整追溯栈一同打印到 `stderr`。

### 避免重复性警告

作为最佳实践，在每个进程中警告只应被发出一次。 若要如此，推荐将 `emitWarning()` 置于一个简单的布尔标志后，正如如下示例所示：

```js
function emitMyWarning() {
  if (!emitMyWarning.warned) {
    emitMyWarning.warned = true;
    process.emitWarning('Only warn once!');
  }
}
emitMyWarning();
// Emits: (node: 56339) Warning: Only warn once!
emitMyWarning();
// Emits nothing
```

## `process.env`<!-- YAML
added: v0.1.27
changes:
  - version: v11.14.0
    pr-url: https://github.com/nodejs/node/pull/26544
    description: Worker threads will now use a copy of the parent thread’s
                 `process.env` by default, configurable through the `env`
                 option of the `Worker` constructor.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18990
    description: Implicit conversion of variable value to string is deprecated.
-->* {Object}

`process.env` 属性返回一个包含用户环境的对象。 请参阅 environ(7)。

此对象的示例看起来就像如下所示：
```js
{
  TERM: 'xterm-256color',
  SHELL: '/usr/local/bin/bash',
  USER: 'maciej',
  PATH: '~/.bin/:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin',
  PWD: '/Users/maciej',
  EDITOR: 'vim',
  SHLVL: '1',
  HOME: '/Users/maciej',
  LOGNAME: 'maciej',
  _: '/usr/local/bin/node'
}
```

It is possible to modify this object, but such modifications will not be reflected outside the Node.js process, or (unless explicitly requested) to other [`Worker`][] threads. In other words, the following example would not work:

```console
$ node -e 'process.env.foo = "bar"' && echo $foo
```

而如下示例则会正常工作：

```js
process.env.foo = 'bar';
console.log(process.env.foo);
```

将属性赋予 `process.env` 将会隐式的将其值转换为字符串。 **This behavior is deprecated.** Future versions of Node.js may throw an error when the value is not a string, number, or boolean.

```js
process.env.test = null;
console.log(process.env.test);
// => 'null'
process.env.test = undefined;
console.log(process.env.test);
// => 'undefined'
```

使用 `delete` 从 `process.env` 中删除属性。

```js
process.env.TEST = 1;
delete process.env.TEST;
console.log(process.env.TEST);
// => undefined
```

在 Windows 操作系统，环境变量是不区分大小写的。

```js
process.env.TEST = 1;
console.log(process.env.test);
// => 1
```

Unless explicitly specified when creating a [`Worker`][] instance, each [`Worker`][] thread has its own copy of `process.env`, based on its parent thread’s `process.env`, or whatever was specified as the `env` option to the [`Worker`][] constructor. Changes to `process.env` will not be visible across [`Worker`][] threads, and only the main thread can make changes that are visible to the operating system or to native add-ons.

## `process.execArgv`<!-- YAML
added: v0.7.7
-->* {string[]}

`process.execArgv` 属性返回一组在 Node.js 进程启动时传入的特定于 Node.js 的命令行选项。 这些选项不会出现在 [`process.argv`][] 属性返回的数组中，也不会包含 Node.js 的可执行文件，脚本名称，或脚本名称之后的任何选项中。 在从父进程中衍生子进程并保持和父进程相同的执行环境时，这些选项非常有用。

```console
$ node --harmony script.js --version
```

在 `process.execArgv` 中的结果：
```js
['--harmony']
```

同时 `process.argv` 的值为：
```js
['/usr/local/bin/node', 'script.js', '--version']
```

## `process.execPath`<!-- YAML
added: v0.1.100
-->* {string}

`process.execPath` 属性返回启动 Node.js 进程的可执行文件的绝对路径。
```js
'/usr/local/bin/node'
```

## `process.exit([code])`<!-- YAML
added: v0.1.13
-->* `code` {integer} 退出代码。 **Default:** `0`.

`process.exit()` 方法指示 Node.js 在终止进程时和退出码 `code` 同步。 如果未提供 `code`，在退出时使用 '成功' 代码 `0`，或者当被设置时使用 `process.exitCode` 的值。 Node.js will not terminate until all the [`'exit'`][] event listeners are called.

使用 '失败' 代码退出：

```js
process.exit(1);
```

执行 Node.js 的 shell 应可以看到退出代码为 `1`。

Calling `process.exit()` will force the process to exit as quickly as possible even if there are still asynchronous operations pending that have not yet completed fully, including I/O operations to `process.stdout` and `process.stderr`.

在大多数情况下，没有必要显式调用 `process.exit()`。 The Node.js process will exit on its own *if there is no additional work pending* in the event loop. 可以设置 `process.exitCode` 属性来告诉进程正常退出时需要使用的退出码。

For instance, the following example illustrates a *misuse* of the `process.exit()` method that could lead to data printed to stdout being truncated and lost:

```js
// This is an example of what *not* to do:
if (someConditionNotMet()) {
  printUsageToStdout();
  process.exit(1);
}
```

The reason this is problematic is because writes to `process.stdout` in Node.js are sometimes *asynchronous* and may occur over multiple ticks of the Node.js event loop. Calling `process.exit()`, however, forces the process to exit *before* those additional writes to `stdout` can be performed.

Rather than calling `process.exit()` directly, the code *should* set the `process.exitCode` and allow the process to exit naturally by avoiding scheduling any additional work for the event loop:

```js
// How to properly set the exit code while letting
// the process exit gracefully.
if (someConditionNotMet()) {
  printUsageToStdout();
  process.exitCode = 1;
}
```

If it is necessary to terminate the Node.js process due to an error condition, throwing an *uncaught* error and allowing the process to terminate accordingly is safer than calling `process.exit()`.

In [`Worker`][] threads, this function stops the current thread rather than the current process.

## `process.exitCode`<!-- YAML
added: v0.11.8
-->* {integer}

当进程正常退出，或在未指定退出码的情况下通过 [`process.exit()`][] 退出时，代表进程退出码的数字。

为 [`process.exit(code)`][`process.exit()`] 指定推出码将会覆盖任何之前对 `process.exitCode` 的设置。

## `process.getegid()`<!-- YAML
added: v2.0.0
-->`process.getegid()` 方法返回 Node.js 进程的数字形式的有效组标识。 (请参阅 getegid(2)。)

```js
if (process.getegid) {
  console.log(`Current gid: ${process.getegid()}`);
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android).

## `process.geteuid()`<!-- YAML
added: v2.0.0
-->* 返回：{Object}

`process.geteuid()` 方法返回进程的数字形式的有效用户标识。 (请参阅 geteuid(2)。)

```js
if (process.geteuid) {
  console.log(`Current uid: ${process.geteuid()}`);
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android).

## `process.getgid()`<!-- YAML
added: v0.1.31
-->* 返回：{Object}

`process.getgid()` 返回数字形式的进程有效组标识。 (请参阅 getgid(2)。)

```js
if (process.getgid) {
  console.log(`Current gid: ${process.getgid()}`);
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android).

## `process.getgroups()`<!-- YAML
added: v0.9.4
-->* Returns: {integer[]}

`process.getgroups()` 方法返回包含补充组 ID 的数组。 如果包含了有效组 ID，POSIX 会将其值保留为未定义的，但 Node.js 确保包含有效组 ID。

This function is only available on POSIX platforms (i.e. not Windows or Android).

## `process.getuid()`<!-- YAML
added: v0.1.28
-->* 返回：{integer}

`process.getuid()` 方法返回数字形式的进程用户标识。 (请参阅 getuid(2)。)

```js
if (process.getuid) {
  console.log(`Current uid: ${process.getuid()}`);
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android).

## `process.hasUncaughtExceptionCaptureCallback()`<!-- YAML
added: v9.3.0
-->* 返回：{boolean}

Indicates whether a callback has been set using [`process.setUncaughtExceptionCaptureCallback()`][].

## `process.hrtime([time])`<!-- YAML
added: v0.7.6
-->* `time` {integer[]} The result of a previous call to `process.hrtime()`
* Returns: {integer[]}

This is the legacy version of [`process.hrtime.bigint()`][] before `bigint` was introduced in JavaScript.

The `process.hrtime()` method returns the current high-resolution real time in a `[seconds, nanoseconds]` tuple `Array`, where `nanoseconds` is the remaining part of the real time that can't be represented in second precision.

`time` is an optional parameter that must be the result of a previous `process.hrtime()` call to diff with the current time. If the parameter passed in is not a tuple `Array`, a `TypeError` will be thrown. Passing in a user-defined array instead of the result of a previous call to `process.hrtime()` will lead to undefined behavior.

这些时间都是相对于过去某一时间的值，与一天中的时间没有关系，因此也不受时钟偏差的影响。 其主要用途是衡量时间间隔之间的性能：

```js
const NS_PER_SEC = 1e9;
const time = process.hrtime();
// [ 1800216, 25 ]

setTimeout(() => {
  const diff = process.hrtime(time);
  // [ 1, 552 ]

  console.log(`Benchmark took ${diff[0] * NS_PER_SEC + diff[1]} nanoseconds`);
  // Benchmark took 1000000552 nanoseconds
}, 1000);
```

## `process.hrtime.bigint()`<!-- YAML
added: v10.7.0
-->* Returns: {bigint}

The `bigint` version of the [`process.hrtime()`][] method returning the current high-resolution real time in nanoseconds as a `bigint`.

Unlike [`process.hrtime()`][], it does not support an additional `time` argument since the difference can just be computed directly by subtraction of the two `bigint`s.

```js
const start = process.hrtime.bigint();
// 191051479007711n

setTimeout(() => {
  const end = process.hrtime.bigint();
  // 191052633396993n

  console.log(`Benchmark took ${end - start} nanoseconds`);
  // Benchmark took 1154389282 nanoseconds
}, 1000);
```

## `process.initgroups(user, extraGroup)`
<!-- YAML
added: v0.9.4
-->

* `user` {string|number} 用户名或数字标识符。
* `extraGroup` {string|number} A group name or numeric identifier.

`process.initgroups()` 方法读取 `/etc/group` 文件，并使用用户所属的所有组初始化组访问列表。 这是一个特权操作，要求 Node.js 进程具有 `root` 访问权限，或者具有 `CAP_SETGID` 能力才能操作。

Use care when dropping privileges:

```js
console.log(process.getgroups());         // [ 0 ]
process.initgroups('bnoordhuis', 1000);   // switch user
console.log(process.getgroups());         // [ 27, 30, 46, 1000, 0 ]
process.setgid(1000);                     // drop root gid
console.log(process.getgroups());         // [ 27, 30, 46, 1000 ]
```

This function is only available on POSIX platforms (i.e. not Windows or Android). This feature is not available in [`Worker`][] threads.

## `process.kill(pid[, signal])`<!-- YAML
added: v0.0.6
-->* `pid` {number} 进程 ID
* `signal` {string|number} 要发送的信号，为字符串或数字。 **Default:** `'SIGTERM'`.

`process.kill()` 方法将 `signal` 发送给以 `pid` 标识的进程。

信号名称为字符串，例如：`'SIGINT'` 或 `'SIGHUP'`。 请参阅 [信号事件](#process_signal_events) 和 kill(2) 以获取更多信息。

如果目标 `pid` 不存在，此方法会抛出一个错误。 在特殊情况下，可通过发送信号 `0` 来测试进程是否存在。 如果使用 `pid` 来杀死一个进程组，Windows 平台会抛出一个错误。

Even though the name of this function is `process.kill()`, it is really just a signal sender, like the `kill` system call. The signal sent may do something other than kill the target process.

```js
process.on('SIGHUP', () => {
  console.log('Got SIGHUP signal.');
});

setTimeout(() => {
  console.log('Exiting.');
  process.exit(0);
}, 100);

process.kill(process.pid, 'SIGHUP');
```

When `SIGUSR1` is received by a Node.js process, Node.js will start the debugger. See [Signal Events](#process_signal_events).

## `process.mainModule`<!-- YAML
added: v0.1.17
-->* {Object}

`process.mainModule` 属性提供了接收 [`require.main`][] 的替代方法。 其区别在于 ，如果主模块在运行时发生改变，[`require.main`][] 可能仍指向变化之前所依赖的原始主模块。 通常情况下，假定它们引用相同的模块是安全的。

就像 [`require.main`][] 一样，如果没有入口脚本，`process.mainModule` 的值是 `undefined`。

## `process.memoryUsage()`<!-- YAML
added: v0.1.16
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9587
    description: Added `external` to the returned object.
-->* 返回：{Object}
  * `rss` {integer}
  * `heapTotal` {integer}
  * `heapUsed` {integer}
  * `external` {integer}

`process.memoryUsage()` 方法返回一个以字节为单位度量的，描述 Node.js 进程内存使用的对象。

例如，代码：

```js
console.log(process.memoryUsage());
```

将会生成：
```js
{
  rss: 4935680,
  heapTotal: 1826816,
  heapUsed: 650472,
  external: 49879
}
```

`heapTotal` 和 `heapUsed` 代表的是 V8 的内存使用状况。 `external` 指的是 C++ 对象的内存使用，这些对象绑定到由 V8 管理的 JavaScript 对象。 `rss`, Resident Set Size, is the amount of space occupied in the main memory device (that is a subset of the total allocated memory) for the process, which includes the _heap_, _code segment_ and _stack_.

The _heap_ is where objects, strings, and closures are stored. Variables are stored in the _stack_ and the actual JavaScript code resides in the _code segment_.

When using [`Worker`][] threads, `rss` will be a value that is valid for the entire process, while the other fields will only refer to the current thread.

## `process.nextTick(callback[, ...args])`<!-- YAML
added: v0.1.26
changes:
  - version: v1.8.1
    pr-url: https://github.com/nodejs/node/pull/1077
    description: Additional arguments after `callback` are now supported.
-->* `callback` {Function}
* `...args` {any} 当调用 `callback` 时传入的额外参数

`process.nextTick()` adds `callback` to the "next tick queue". This queue is fully drained after the current operation on the JavaScript stack runs to completion and before the event loop is allowed to continue. It's possible to create an infinite loop if one were to recursively call `process.nextTick()`. See the [Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/#process-nexttick) guide for more background.

```js
console.log('start');
process.nextTick(() => {
  console.log('nextTick callback');
});
console.log('scheduled');
// Output:
// start
// scheduled
// nextTick callback
```

This is important when developing APIs in order to give users the opportunity to assign event handlers *after* an object has been constructed but before any I/O has occurred:

```js
function MyThing(options) {
  this.setupOptions(options);

  process.nextTick(() => {
    this.startDoingStuff();
  });
}

const thing = new MyThing();
thing.getReadyForStuff();

// thing.startDoingStuff() gets called now, not before.
```

对于 100% 同步，或者 100% 异步的 API，此方法非常重要。 考虑如下示例：

```js
// WARNING!  DO NOT USE!  BAD UNSAFE HAZARD!
function maybeSync(arg, cb) {
  if (arg) {
    cb();
    return;
  }

  fs.stat('file', cb);
}
```

此 API 是危险的，因为在如下情况下：

```js
const maybeTrue = Math.random() > 0.5;

maybeSync(maybeTrue, () => {
  foo();
});

bar();
```

不清楚应该先调用 `foo()` 还是 `bar()`。

如下的方法更好：

```js
function definitelyAsync(arg, cb) {
  if (arg) {
    process.nextTick(cb);
    return;
  }

  fs.stat('file', cb);
}
```

## `process.noDeprecation`<!-- YAML
added: v0.8.0
-->* {boolean}

`process.noDeprecation` 属性指示在当前 Node.js 进程上是否设置了 `--no-deprecation` 标志。 See the documentation for the [`'warning'` event](#process_event_warning) and the [`emitWarning()` method](#process_process_emitwarning_warning_type_code_ctor) for more information about this flag's behavior.

## `process.pid`<!-- YAML
added: v0.1.15
-->* {integer}

`process.pid` 属性返回进程的 PID。

```js
console.log(`This process is pid ${process.pid}`);
```

## `process.platform`<!-- YAML
added: v0.1.16
-->* {string}

`process.platform` 属性返回一个用于标识 Node.js 进程运行其上的操作系统平台的字符串。

当前可能的值包括：

* `'aix'`
* `'darwin'`
* `'freebsd'`
* `'linux'`
* `'openbsd'`
* `'sunos'`
* `'win32'`

```js
console.log(`This platform is ${process.platform}`);
```

The value `'android'` may also be returned if the Node.js is built on the Android operating system. However, Android support in Node.js [is experimental](https://github.com/nodejs/node/blob/master/BUILDING.md#androidandroid-based-devices-eg-firefox-os).

## `process.ppid`<!-- YAML
added:
  - v9.2.0
  - v8.10.0
  - v6.13.0
-->* {integer}

`process.ppid` 属性返回当前父进程的 PID。

```js
console.log(`The parent process is pid ${process.ppid}`);
```

## `process.release`<!-- YAML
added: v3.0.0
changes:
  - version: v4.2.0
    pr-url: https://github.com/nodejs/node/pull/3212
    description: The `lts` property is now supported.
-->* {Object}

The `process.release` property returns an `Object` containing metadata related to the current release, including URLs for the source tarball and headers-only tarball.

`process.release` 包含如下属性：

* `name` {string} 对于 Node.js，此值始终为 `'node'`。 对于传统的 io.js 发行版本，此值是 `'io.js'`。
* `sourceUrl` {string} an absolute URL pointing to a _`.tar.gz`_ file containing the source code of the current release.
* `headersUrl`{string} an absolute URL pointing to a _`.tar.gz`_ file containing only the source header files for the current release. 此文件比完整源文件要小很多，并可被用于编译 Node.js 原生插件。
* `libUrl` {string} an absolute URL pointing to a _`node.lib`_ file matching the architecture and version of the current release. 此文件用于编译 Node.js 原生插件。 _This property is only present on Windows builds of Node.js and will be missing on all other platforms._
* `lts` {string} a string label identifying the [LTS](https://github.com/nodejs/Release) label for this release. This property only exists for LTS releases and is `undefined` for all other release types, including _Current_ releases. 当前的有效值包括：
  * `'Argon'` 针对自 4.2.0 开始的 4.x LTS 版本。
  * `'Boron'` 针对自 6.9.0 开始的 6.x LTS 版本。
  * `'Carbon'` 针对自 8.9.1 开始的 8.x LTS 版本。
```js
{
  name: 'node',
  lts: 'Argon',
  sourceUrl: 'https://nodejs.org/download/release/v4.4.5/node-v4.4.5.tar.gz',
  headersUrl: 'https://nodejs.org/download/release/v4.4.5/node-v4.4.5-headers.tar.gz',
  libUrl: 'https://nodejs.org/download/release/v4.4.5/win-x64/node.lib'
}
```

在源码树中基于未发布版本的自定义构建中，可能只有 `name` 属性存在。 额外属性可能不存在。

## `process.report`<!-- YAML
added: v11.8.0
-->> 稳定性：1 - 实验中

* {Object}

`process.report` is an object whose methods are used to generate diagnostic reports for the current process. Additional documentation is available in the [report documentation](report.html).

### `process.report.directory`<!-- YAML
added: v11.12.0
-->> 稳定性：1 - 实验中

* {string}

Directory where the report is written. The default value is the empty string, indicating that reports are written to the current working directory of the Node.js process.

```js
console.log(`Report directory is ${process.report.directory}`);
```

### `process.report.filename`<!-- YAML
added: v11.12.0
-->> 稳定性：1 - 实验中

* {string}

Filename where the report is written. If set to the empty string, the output filename will be comprised of a timestamp, PID, and sequence number. The default value is the empty string.

```js
console.log(`Report filename is ${process.report.filename}`);
```

### `process.report.getReport([err])`<!-- YAML
added: v11.8.0
-->> 稳定性：1 - 实验中

* `err` {Error} A custom error used for reporting the JavaScript stack.
* 返回：{Object}

Returns a JavaScript Object representation of a diagnostic report for the running process. The report's JavaScript stack trace is taken from `err`, if present.

```js
const data = process.report.getReport();
console.log(data.header.nodeJsVersion);

// Similar to process.report.writeReport()
const fs = require('fs');
fs.writeFileSync(util.inspect(data), 'my-report.log', 'utf8');
```

Additional documentation is available in the [report documentation](report.html).

### `process.report.reportOnFatalError`<!-- YAML
added: v11.12.0
-->> 稳定性：1 - 实验中

* {boolean}

If `true`, a diagnostic report is generated on fatal errors, such as out of memory errors or failed C++ assertions.

```js
console.log(`Report on fatal error: ${process.report.reportOnFatalError}`);
```

### `process.report.reportOnSignal`<!-- YAML
added: v11.12.0
-->> 稳定性：1 - 实验中

* {boolean}

If `true`, a diagnostic report is generated when the process receives the signal specified by `process.report.signal`.

```js
console.log(`Report on signal: ${process.report.reportOnSignal}`);
```

### `process.report.reportOnUncaughtException`<!-- YAML
added: v11.12.0
-->> 稳定性：1 - 实验中

* {boolean}

If `true`, a diagnostic report is generated on uncaught exception.

```js
console.log(`Report on exception: ${process.report.reportOnUncaughtException}`);
```

### `process.report.signal`<!-- YAML
added: v11.12.0
-->> 稳定性：1 - 实验中

* {string}

The signal used to trigger the creation of a diagnostic report. Defaults to `'SIGUSR2'`.

```js
console.log(`Report signal: ${process.report.signal}`);
```

### `process.report.writeReport([filename][, err])`<!-- YAML
added: v11.8.0
-->> 稳定性：1 - 实验中

* `filename` {string} Name of the file where the report is written. This should be a relative path, that will be appended to the directory specified in `process.report.directory`, or the current working directory of the Node.js process, if unspecified.
* `err` {Error} A custom error used for reporting the JavaScript stack.

* Returns: {string} Returns the filename of the generated report.

Writes a diagnostic report to a file. If `filename` is not provided, the default filename includes the date, time, PID, and a sequence number. The report's JavaScript stack trace is taken from `err`, if present.

```js
process.report.writeReport();
```

Additional documentation is available in the [report documentation](report.html).

## `process.resourceUsage()`<!-- YAML
added: v12.6.0
-->* Returns: {Object} the resource usage for the current process. All of these values come from the `uv_getrusage` call which returns a [`uv_rusage_t` struct](http://docs.libuv.org/en/v1.x/misc.html#c.uv_rusage_t).
  * `userCPUTime` {integer} maps to `ru_utime` computed in microseconds. It is the same value as [`process.cpuUsage().user`](#process_process_cpuusage_previousvalue).
  * `systemCPUTime` {integer} maps to `ru_stime` computed in microseconds. It is the same value as [`process.cpuUsage().system`](#process_process_cpuusage_previousvalue).
  * `maxRSS` {integer} maps to `ru_maxrss` which is the maximum resident set size used in kilobytes.
  * `sharedMemorySize` {integer} maps to `ru_ixrss` but is not supported by any platform.
  * `unsharedDataSize` {integer} maps to `ru_idrss` but is not supported by any platform.
  * `unsharedStackSize` {integer} maps to `ru_isrss` but is not supported by any platform.
  * `minorPageFault` {integer} maps to `ru_minflt` which is the number of minor page faults for the process, see [this article for more details](https://en.wikipedia.org/wiki/Page_fault#Minor).
  * `majorPageFault` {integer} maps to `ru_majflt` which is the number of major page faults for the process, see [this article for more details](https://en.wikipedia.org/wiki/Page_fault#Major). This field is not supported on Windows.
  * `swappedOut` {integer} maps to `ru_nswap` but is not supported by any platform.
  * `fsRead` {integer} maps to `ru_inblock` which is the number of times the file system had to perform input.
  * `fsWrite` {integer} maps to `ru_oublock` which is the number of times the file system had to perform output.
  * `ipcSent` {integer} maps to `ru_msgsnd` but is not supported by any platform.
  * `ipcReceived` {integer} maps to `ru_msgrcv` but is not supported by any platform.
  * `signalsCount` {integer} maps to `ru_nsignals` but is not supported by any platform.
  * `voluntaryContextSwitches` {integer} maps to `ru_nvcsw` which is the number of times a CPU context switch resulted due to a process voluntarily giving up the processor before its time slice was completed (usually to await availability of a resource). This field is not supported on Windows.
  * `involuntaryContextSwitches` {integer} maps to `ru_nivcsw` which is the number of times a CPU context switch resulted due to a higher priority process becoming runnable or because the current process exceeded its time slice. This field is not supported on Windows.

```js
console.log(process.resourceUsage());
/*
  Will output:
  {
    userCPUTime: 82872,
    systemCPUTime: 4143,
    maxRSS: 33164,
    sharedMemorySize: 0,
    unsharedDataSize: 0,
    unsharedStackSize: 0,
    minorPageFault: 2469,
    majorPageFault: 0,
    swappedOut: 0,
    fsRead: 0,
    fsWrite: 8,
    ipcSent: 0,
    ipcReceived: 0,
    signalsCount: 0,
    voluntaryContextSwitches: 79,
    involuntaryContextSwitches: 1
  }
*/
```

## `process.send(message[, sendHandle[, options]][, callback])`<!-- YAML
added: v0.5.9
-->* `message` {Object}
* `sendHandle` {net.Server|net.Socket}
* `options` {Object} used to parameterize the sending of certain types of handles.`options` supports the following properties:
  * `keepOpen` {boolean} A value that can be used when passing instances of `net.Socket`. When `true`, the socket is kept open in the sending process. **Default:** `false`.
* `callback` {Function}
* 返回：{boolean}

如果 Node.js 进程是通过 IPC 通道创建的，可使用 `process.send()` 方法发送消息给其父进程。 消息将被作为父进程 [`ChildProcess`][] 对象的 [`'message'`][] 事件接收。

If Node.js was not spawned with an IPC channel, `process.send` will be `undefined`.

The message goes through serialization and parsing. The resulting message might not be the same as what is originally sent.

## `process.setegid(id)`<!-- YAML
added: v2.0.0
-->* `id` {string|number} 组名或 ID

`process.setegid()` 方法设置进程的有效组标识符。 (请参阅 setegid(2)。) `id` 可以以数字型 ID 或组名称字符串的方式传递。 如果指定了组名称，则当解析对应的数字 ID 时，此方法是阻塞的。

```js
if (process.getegid && process.setegid) {
  console.log(`Current gid: ${process.getegid()}`);
  try {
    process.setegid(501);
    console.log(`New gid: ${process.getegid()}`);
  } catch (err) {
    console.log(`Failed to set gid: ${err}`);
  }
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android). This feature is not available in [`Worker`][] threads.

## `process.seteuid(id)`<!-- YAML
added: v2.0.0
-->* `id` {string|number} 用户名或 ID

`process.seteuid()` 方法设置进程的有效用户标识符。 (请参阅 seteuid(2)。) `id` 可以以数字型 ID 或用户名字符串的方式传递。 如果指定了用户名，则当解析对应的数字 ID 时，此方法是阻塞的。

```js
if (process.geteuid && process.seteuid) {
  console.log(`Current uid: ${process.geteuid()}`);
  try {
    process.seteuid(501);
    console.log(`New uid: ${process.geteuid()}`);
  } catch (err) {
    console.log(`Failed to set uid: ${err}`);
  }
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android). This feature is not available in [`Worker`][] threads.

## `process.setgid(id)`<!-- YAML
added: v0.1.31
-->* `id` {string|number} 组名或 ID

`process.setgid()` 方法设置进程的组标识符。 (See setgid(2).) The `id` can be passed as either a numeric ID or a group name string. 如果指定了组名，则当解析对应的数字 ID 时，此方法是阻塞的。

```js
if (process.getgid && process.setgid) {
  console.log(`Current gid: ${process.getgid()}`);
  try {
    process.setgid(501);
    console.log(`New gid: ${process.getgid()}`);
  } catch (err) {
    console.log(`Failed to set gid: ${err}`);
  }
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android). This feature is not available in [`Worker`][] threads.

## `process.setgroups(groups)`<!-- YAML
added: v0.9.4
-->* `groups` {integer[]}

`process.setgroups()` 方法为当前 Node.js 进程设置补充组 ID。 This is a privileged operation that requires the Node.js process to have `root` or the `CAP_SETGID` capability.

`groups` 数组可以包含数字形式的组 ID，组名，或者两者都有。

This function is only available on POSIX platforms (i.e. not Windows or Android). This feature is not available in [`Worker`][] threads.

## `process.setuid(id)`<!-- YAML
added: v0.1.28
-->* `id` {integer | string}

`process.setuid(id)` 方法设置进程的用户标识符。 (See setuid(2).) The `id` can be passed as either a numeric ID or a username string. 如果指定了用户名，则当解析对应的数字 ID 时，此方法是阻塞的。

```js
if (process.getuid && process.setuid) {
  console.log(`Current uid: ${process.getuid()}`);
  try {
    process.setuid(501);
    console.log(`New uid: ${process.getuid()}`);
  } catch (err) {
    console.log(`Failed to set uid: ${err}`);
  }
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android). This feature is not available in [`Worker`][] threads.

## `process.setUncaughtExceptionCaptureCallback(fn)`<!-- YAML
added: v9.3.0
-->* `fn` {Function|null}

The `process.setUncaughtExceptionCaptureCallback()` function sets a function that will be invoked when an uncaught exception occurs, which will receive the exception value itself as its first argument.

If such a function is set, the [`'uncaughtException'`][] event will not be emitted. If `--abort-on-uncaught-exception` was passed from the command line or set through [`v8.setFlagsFromString()`][], the process will not abort.

To unset the capture function, `process.setUncaughtExceptionCaptureCallback(null)` may be used. Calling this method with a non-`null` argument while another capture function is set will throw an error.

Using this function is mutually exclusive with using the deprecated [`domain`][] built-in module.

## `process.stderr`

* {Stream}

`process.stderr` 属性返回一个连接到 `stderr` (fd `2`) 的流。 除非 fd `2` 指向一个文件，否则它是一个 [`net.Socket`][] (这是一个 [Duplex](stream.html#stream_duplex_and_transform_streams) 流) ，当指向文件时，它是一个 [Writable](stream.html#stream_writable_streams) 流。

`process.stderr` differs from other Node.js streams in important ways. See [note on process I/O](process.html#process_a_note_on_process_i_o) for more information.

## `process.stdin`

* {Stream}

`process.stdin` 属性返回一个连接到 `stdin` (fd `0`) 的流。 除非 fd `0` 指向一个文件，否则它是一个 [`net.Socket`][] (它是一个 [Duplex](stream.html#stream_duplex_and_transform_streams) 流)，当指向文件时，它是 [Readable](stream.html#stream_readable_streams) 流。

```js
process.stdin.setEncoding('utf8');

process.stdin.on('readable', () => {
  let chunk;
  // Use a loop to make sure we read all available data.
  while ((chunk = process.stdin.read()) !== null) {
    process.stdout.write(`data: ${chunk}`);
  }
});

process.stdin.on('end', () => {
  process.stdout.write('end');
});
```

作为一个 [Duplex](stream.html#stream_duplex_and_transform_streams) 流，`process.stdin` 可以在 "旧" 模式下使用，以便和 Node.js v0.10 之前版本写的脚本兼容。 请参阅 [流兼容性](stream.html#stream_compatibility_with_older_node_js_versions) 以获取更多信息。

In "old" streams mode the `stdin` stream is paused by default, so one must call `process.stdin.resume()` to read from it. 同时需要注意，调用 `process.stdin.resume()` 会将流切换至 "旧" 模式。

## `process.stdout`

* {Stream}

`process.stdout` 属性返回一个连接到 `stdout` (fd `1`) 的流。 除非 fd `1` 指向一个文件，否则它是 [`net.Socket`][] (它是 [Duplex](stream.html#stream_duplex_and_transform_streams) 流)，当指向文件时，它是 [Writable](stream.html#stream_writable_streams) 流。

For example, to copy `process.stdin` to `process.stdout`:

```js
process.stdin.pipe(process.stdout);
```

`process.stdout` differs from other Node.js streams in important ways. See [note on process I/O](process.html#process_a_note_on_process_i_o) for more information.

### 关于进程 I/O 的注意事项

`process.stdout` 和 `process.stderr` 和其他 Node.js 流有重大区别：

1. 它们分别被 [`console.log()`][] 和 [`console.error()`][] 在内部使用。
2. 写操作是否为同步方式，取决于连接的是什么流以及操作系统是 Windows 还是 POSIX:
   * Files: *synchronous* on Windows and POSIX
   * TTYs (Terminals): *asynchronous* on Windows, *synchronous* on POSIX
   * Pipes (and sockets): *synchronous* on Windows, *asynchronous* on POSIX

这些行为部分是由于历史原因造成的，改变它们可能会导致向后的不兼容性，其实它们也是部分用户的期待行为。

以同步方式写入避免了诸如调用 `console.log()` 或 `console.error()` 进行写入时的不可预知的交错输出问题，甚至当在异步方式写入结束之前调用 `process.exit()` 的问题。 请参阅 [`process.exit()`][] 获取更多信息。

***Warning***: Synchronous writes block the event loop until the write has completed. 有时候文件的写入几乎瞬间就能完成，但当系统处于高负载时，管道的接收端可能不会被读取、或者连接到缓慢的终端或文件系统，这样事件循环就会被阻塞的足够频繁且足够长的时间，这些会给系统性能带来负面影响。 在写入到交互式终端时，这可能不是问题，但在将生产环境的日志输出到进程的输出流时需要额外小心。

要想检查一个流是否连接到 [TTY](tty.html#tty_tty) 上下文，请检查 `isTTY` 属性。

例如：

```console
$ node -p "Boolean(process.stdin.isTTY)"
true
$ echo "foo" | node -p "Boolean(process.stdin.isTTY)"
false
$ node -p "Boolean(process.stdout.isTTY)"
true
$ node -p "Boolean(process.stdout.isTTY)" | cat
false
```

请参阅 [TTY](tty.html#tty_tty) 文档以获取更多信息。

## `process.throwDeprecation`<!-- YAML
added: v0.9.12
-->* {boolean}

The initial value of `process.throwDeprecation` indicates whether the `--throw-deprecation` flag is set on the current Node.js process. `process.throwDeprecation` is mutable, so whether or not deprecation warnings result in errors may be altered at runtime. See the documentation for the [`'warning'` event](#process_event_warning) and the [`emitWarning()` method](#process_process_emitwarning_warning_type_code_ctor) for more information.

```console
$ node --throw-deprecation -p "process.throwDeprecation"
true
$ node -p "process.throwDeprecation"
undefined
$ node
> process.emitWarning('test', 'DeprecationWarning');
undefined
> (node:26598) DeprecationWarning: test
> process.throwDeprecation = true;
true
> process.emitWarning('test', 'DeprecationWarning');
Thrown:
[DeprecationWarning: test] { name: 'DeprecationWarning' }
```

## `process.title`<!-- YAML
added: v0.1.104
-->* {string}

`process.title` 属性返回当前进程的标题 (即：返回 `ps` 的当前值)。 将 `process.title` 赋予新的值会更新 `ps` 的当前值。

When a new value is assigned, different platforms will impose different maximum length restrictions on the title. Usually such restrictions are quite limited. For instance, on Linux and macOS, `process.title` is limited to the size of the binary name plus the length of the command line arguments because setting the `process.title` overwrites the `argv` memory of the process. Node.js v0.8 allowed for longer process title strings by also overwriting the `environ` memory but that was potentially insecure and confusing in some (rather obscure) cases.

## `process.traceDeprecation`<!-- YAML
added: v0.8.0
-->* {boolean}

`process.traceDeprecation` 属性指示在当前 Node.js 进程是否设置了 `--trace-deprecation` 标志位。 See the documentation for the [`'warning'` event](#process_event_warning) and the [`emitWarning()` method](#process_process_emitwarning_warning_type_code_ctor) for more information about this flag's behavior.

## `process.umask([mask])`<!-- YAML
added: v0.1.19
-->* `mask` {string|integer}

`process.umask()` 方法设置或返回 Node.js 进程的文件模式创建掩码。 子进程会从父进程继承此掩码。 在调用时未传入参数的话，会返回当前掩码，否则，umask 方法会设置传入的参数值，同时会返回之前的掩码。

```js
const newmask = 0o022;
const oldmask = process.umask(newmask);
console.log(
  `Changed umask from ${oldmask.toString(8)} to ${newmask.toString(8)}`
);
```

[`Worker`][] threads are able to read the umask, however attempting to set the umask will result in a thrown exception.

## `process.uptime()`<!-- YAML
added: v0.5.0
-->* 返回：{number}

`process.uptime()` 方法返回以秒计的当前 Node.js 进程的运行时间。

The return value includes fractions of a second. Use `Math.floor()` to get whole seconds.

## `process.version`<!-- YAML
added: v0.1.3
-->* {string}

`process.version` 属性返回 Node.js 版本号字符串。

```js
console.log(`Version: ${process.version}`);
```

## `process.versions`<!-- YAML
added: v0.2.0
changes:
  - version: v4.2.0
    pr-url: https://github.com/nodejs/node/pull/3102
    description: The `icu` property is now supported.
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15785
    description: The `v8` property now includes a Node.js specific suffix.
-->* {Object}

`process.versions` 属性返回一个包含 Node.js 及其依赖库的版本字符串列表的对象。 `process.versions.modules` 指示当前的 ABI 版本，每当 C++ API 更改时该版本会递增。 Node.js 会拒绝加载针对不同模块 ABI 版本而编译的模块。

```js
console.log(process.versions);
```

将会生成一个如下所示的类似对象：

```console
{ node: '11.13.0',
  v8: '7.0.276.38-node.18',
  uv: '1.27.0',
  zlib: '1.2.11',
  brotli: '1.0.7',
  ares: '1.15.0',
  modules: '67',
  nghttp2: '1.34.0',
  napi: '4',
  llhttp: '1.1.1',
  http_parser: '2.8.0',
  openssl: '1.1.1b',
  cldr: '34.0',
  icu: '63.1',
  tz: '2018e',
  unicode: '11.0' }
```

## 退出码

如果没有异步操作在等待，Node.js 通常会以状态码 `0` 退出。 如下的退出码在其他情况下使用：

* `1` **Uncaught Fatal Exception**: There was an uncaught exception, and it was not handled by a domain or an [`'uncaughtException'`][] event handler.
* `2`: Unused (reserved by Bash for builtin misuse)
* `3` **Internal JavaScript Parse Error**: The JavaScript source code internal in Node.js's bootstrapping process caused a parse error. 这种情况非常罕见，仅仅在 Node.js 自身的开发过程中可能出现。
* `4` **Internal JavaScript Evaluation Failure**: The JavaScript source code internal in Node.js's bootstrapping process failed to return a function value when evaluated. 这种情况非常罕见，仅仅在 Node.js 自身的开发过程中可能出现。
* `5` **Fatal Error**: There was a fatal unrecoverable error in V8. 通常，一个前缀为 `FATALERROR` 的消息会打印到 stderr 上。
* `6` **Non-function Internal Exception Handler**: There was an uncaught exception, but the internal fatal exception handler function was somehow set to a non-function, and could not be called.
* `7` **Internal Exception Handler Run-Time Failure**: There was an uncaught exception, and the internal fatal exception handler function itself threw an error while attempting to handle it. This can happen, for example, if an [`'uncaughtException'`][] or `domain.on('error')` handler throws an error.
* `8`: Unused. 在 Node.js 的之前版本中，返回码为 8 有时代表一个未被捕获的异常。
* `9` **Invalid Argument**: Either an unknown option was specified, or an option requiring a value was provided without a value.
* `10` **Internal JavaScript Run-Time Failure**: The JavaScript source code internal in Node.js's bootstrapping process threw an error when the bootstrapping function was called. 这种情况非常罕见，且通常发生在 Node.js 自己的开发过程中。
* `12` **Invalid Debug Argument**: The `--inspect` and/or `--inspect-brk` options were set, but the port number chosen was invalid or unavailable.
* `>128` **Signal Exits**: If Node.js receives a fatal signal such as `SIGKILL` or `SIGHUP`, then its exit code will be `128` plus the value of the signal code. 这是 POSIX 的标准做法，由于退出码被定义为 7 位整数，且退出信号设置了高位，因此会包含信号代码的值。 For example, signal `SIGABRT` has value `6`, so the expected exit code will be `128` + `6`, or `134`.
