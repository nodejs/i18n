# 异步钩子

<!--introduced_in=v8.1.0-->

> 稳定性：1 - 实验中

`async_hooks` 模块提供了一个用来注册回调函数的API，它可以用来追踪在Node.js应用程序中创建的异步资源的生存期。 它可以使用如下方式来访问：

```js
const async_hooks = require('async_hooks');
```

## 术语

一个异步资源代表一个含有相关联回调函数的对象。 这个回调函数可能会被多次调用，例如：在`net.createServer`中的`connection`事件，亦或像在`fs.open`中一样被调用一次。 资源也可以在调用回调函数之前被关闭。 AsyncHook没有明确区分这些不同情况，但会作为一个资源的抽象概念代表它们。

## 公共API

### 概览

如下是对公共API的简单概述。

```js
const async_hooks = require('async_hooks');

// Return the ID of the current execution context.
const eid = async_hooks.executionAsyncId();

// Return the ID of the handle responsible for triggering the callback of the
// current execution scope to call.
const tid = async_hooks.triggerAsyncId();

// 创建一个 新的 AsyncHook 实例。 以上所有的回调函数都是可选的。
const asyncHook =
    async_hooks.createHook({ init, before, after, destroy, promiseResolve });

// Allow callbacks of this AsyncHook instance to call. This is not an implicit
// action after running the constructor, and must be explicitly run to begin
// executing callbacks.
asyncHook.enable();

// Disable listening for new asynchronous events.
asyncHook.disable();

//
// The following are the callbacks that can be passed to createHook().
//

// init is called during object construction. The resource may not have
// completed construction when this callback runs, therefore all fields of the
// resource referenced by "asyncId" may not have been populated.
function init(asyncId, type, triggerAsyncId, resource) { }

// before is called just before the resource's callback is called. It can be
// called 0-N times for handles (e.g. TCPWrap), and will be called exactly 1
// time for requests (e.g. FSReqWrap).
function before(asyncId) { }

// after is called just after the resource's callback has finished.
function after(asyncId) { }

// destroy is called when an AsyncWrap instance is destroyed.
function destroy(asyncId) { }

// promiseResolve is called only for promise resources, when the
// `resolve` function passed to the `Promise` constructor is invoked
// (either directly or through other means of resolving a promise).
function promiseResolve(asyncId) { }
```

#### `async_hooks.createHook(callbacks)`

<!-- YAML
added: v8.1.0
-->

* `callbacks` {Object} 要注册的 [钩子回调函数](#async_hooks_hook_callbacks) 
  * `init` {Function} [`init` 回调函数][]。
  * `before` {Function} [`before` 回调函数][]
  * `after` {Function} [`after` 回调函数][]。
  * `destroy` {Function} [`destroy` 回调函数][]。
* 返回：用于禁用和启用钩子的 `{AsyncHook}` 实例

注册针对每个异步操作的不同生命周期事件而调用的函数。

`init()`/`before()`/`after()`/`destroy()`等回调函数在资源生命周期中为各自的异步事件所调用。

所有的回调函数都是可选的。 例如，如果仅仅是资源清理需要被跟踪，则只需要传递 `destroy` 回调函数。 可以传递给 `回调函数` 的所有函数的细节都在 [钩子回调函数](#async_hooks_hook_callbacks) 部分中。

```js
const async_hooks = require('async_hooks');

const asyncHook = async_hooks.createHook({
  init(asyncId, type, triggerAsyncId, resource) { },
  destroy(asyncId) { }
});
```

注意，回调函数将通过原型链来继承：

```js
class MyAsyncCallbacks {
  init(asyncId, type, triggerAsyncId, resource) { }
  destroy(asyncId) {}
}

class MyAddedCallbacks extends MyAsyncCallbacks {
  before(asyncId) { }
  after(asyncId) { }
}

const asyncHook = async_hooks.createHook(new MyAddedCallbacks());
```

##### 错误处理

如果任何 `AsyncHook` 回调函数被抛出，应用程序会打印追溯栈并退出。 退出路径确实遵循未捕获异常中的路径, 但所有的 `uncaughtException` 监听器都将被删除, 从而强制进程退出。 除非应用程序在运行时添加了`--abort-on-uncaught-exception`参数，`'exit'`回调函数仍会被调用，在这种情况下，回溯栈仍会被打印，应用程序会退出，并留下一个核心文件。

此错误处理行为的原因在于这些回调函数正在运行在对象的生命周期中潜在的不稳定点上，例如在类构造和析构时。 正因为如此，为了防止在未来被无意中止，迅速杀死进程被认为是必要的。 如果进行综合分析，这点在将来可能会发生变化，以确保异常可以遵循正常的控制流程而不会产生无意的副作用。

##### 在AsyncHooks回调函数中打印

由于打印到控制台是异步操作，`console.log()`会导致AsyncHooks回调函数被调用。 因此在AsyncHooks回调函数中使用`console.log()`或类似的异步操作会导致无限递归。 针对这个问题的一种简易解决方案就是，使用类似`fs.writeSync(1, msg)`的同步日志操作。 因为`1`是标准输出的文件描述符，这就打印到标准输出上，同时由于它本身是同步的，因此也不会以递归方式调用AsyncHooks。

```js
const fs = require('fs');
const util = require('util');

function debug(...args) {
  // use a function like this one when debugging inside an AsyncHooks callback
  fs.writeSync(1, `${util.format(...args)}\n`);
}
```

如果在日志记录时需要异步操作，则可以使用AsyncHooks自身提供的信息来获取导致异步操作的原因。 如果是日志记录本身导致对AsyncHooks回调函数的调用，则日志记录应该被跳过。 通过这种方式，无限递归会被中断。

#### `asyncHook.enable()`

* 返回：{AsyncHook} 对`asyncHook`的引用。

为给定的 `AsyncHook` 实例启用回调函数。 If no callbacks are provided enabling is a noop.

在默认情况下，`AsyncHook` 实例被禁用。 如果 `AsyncHook` 实例需要在创建后立即被启用，则可以使用如下模式。

```js
const async_hooks = require('async_hooks');

const hook = async_hooks.createHook(callbacks).enable();
```

#### `asyncHook.disable()`

* 返回：{AsyncHook} 对`asyncHook`的引用。

从将被执行的 AsyncHook 回调函数的全局池中禁用给定 ` AsyncHook ` 实例的回调函数。 一旦钩子被禁用，在被启用之前它不会被再次调用。

为保持 API 的一致性，`disable()` 也返回 `AsyncHook` 的实例。

#### 钩子回调函数

异步事件生命周期中的关键事件被分为四种类型：实例化，在回调函数被调用之前/之后，以及当实例被销毁时。

##### `init(asyncId, type, triggerAsyncId, resource)`

* `asyncId` {number} 异步资源的唯一 ID。
* `type` {string} 异步资源的类型。
* `triggerAsyncId` {number} 异步资源在其被创建的执行上下文中的唯一 ID。
* `resource` {Object} 对代表异步操作的资源的引用，在*destroy*时需要被释放。

当一个类被构造时，如果有 *可能* 会发出异步事件，则回调函数会被调用。 这并 *不* 意味着在 `destroy` 被调用之前实例必须调用 `before`/`after`，只是这种可能性存在。

这种行为可以通过类似如下操作进行观察：打开一个资源然后在资源可用之前立即关闭它。 下面的代码片段可以就此进行演示。

```js
require('net').createServer().listen(function() { this.close(); });
// OR
clearTimeout(setTimeout(() => {}, 10));
```

在当前进程的范围内，将为每个新资源分配一个唯一的 ID。

###### `type`

`type` 是一个用来识别资源类型的字符串，它会导致 `init` 被调用。 通常情况下，它将对应于资源构造函数的名字。

```text
FSEVENTWRAP, FSREQWRAP, GETADDRINFOREQWRAP, GETNAMEINFOREQWRAP, HTTPPARSER,
JSSTREAM, PIPECONNECTWRAP, PIPEWRAP, PROCESSWRAP, QUERYWRAP, SHUTDOWNWRAP,
SIGNALWRAP, STATWATCHER, TCPCONNECTWRAP, TCPSERVER, TCPWRAP, TIMERWRAP, TTYWRAP,
UDPSENDWRAP, UDPWRAP, WRITEWRAP, ZLIB, SSLCONNECTION, PBKDF2REQUEST,
RANDOMBYTESREQUEST, TLSWRAP, Timeout, Immediate, TickObject
```

还有 `PROMISE` 这种资源类型，它被用于跟踪 `Promise` 实例以及它们计划的异步工作。

用户可以通过使用公共的 embedder API来定义它们自己的 `type`。

*注意：* 可能会有类型名称冲突。 鼓励 Embedders 使用唯一性前缀，例如 npm 包名，来防止监听钩子时发生冲突。

###### `triggerId`

`triggerAsyncId` 是导致 (或 “触发”) 新资源被初始化以及`init`被调用的资源的`asyncId`。 它和`async_hooks.executionAsyncId()`不同，后者只是显示新资源在 *何时* 被创建，而 `triggerAsyncId` 显示 *为什么* 新资源被创建。

下面是 `triggerAsyncId` 的简单演示：

```js
async_hooks.createHook({
  init(asyncId, type, triggerAsyncId) {
    const eid = async_hooks.executionAsyncId();
    fs.writeSync(
      1, `${type}(${asyncId}): trigger: ${triggerAsyncId} execution: ${eid}\n`);
  }
}).enable();

require('net').createServer((conn) => {}).listen(8080);
```

当使用 `nc localhost 8080` 访问服务器时的输出：

```console
TCPSERVERWRAP(2): trigger: 1 execution: 1
TCPWRAP(4): trigger: 2 execution: 0
```

`TCPSERVERWRAP` 是接收连接的服务器。

`TCPWRAP` 是来自客户端的新连接。 当创建新连接时，`TCPWrap`实例会立刻被构造。 这个过程会发生于任何 JavaScript 栈之外 (侧注：`0` 的 `executionAsyncId()` 意味着它是在C++中被运行，且其上面没有 JavaScript 栈)。 只有这些信息，不可能将这些资源就它们被创建的原因链接到一起，因此`triggerAsyncId`的任务就是负责传播什么资源负责新资源的存在。

###### `resource`

`resource` 是表示已被初始化的实际异步资源的对象。 它可能会包含基于 `type` 值的不同有用信息。 例如，对于 `GETADDRINFOREQWRAP` 资源类型，`resource` 提供了在 `net.Server.listen()` 中查找 IP 地址时使用的主机名。 用于访问此信息的 API 目前不被视为公开的，但通过使用 Embedder API，用户可以提供并记录自己的资源对象。 例如，这样的资源对象可以包含将被执行的 SQL 查询。

在使用 Promises 时，`resource` 会含有`promise`属性，该属性引用正在被初始化的 Promise，而`parentId`属性则被设置为 父 Promise 的`asyncId`，当然前提是它存在，否则为 `undefined`。 例如，当`b = a.then(handler)`时，`a` 会被认为是 `b` 的父Promise。

*注意*：有些时候处于性能考虑，资源对象会被重用，因此将其作为 `WeakMap` 中的键值或向其添加属性是不安全的。

###### Asynchronous context example

The following is an example with additional information about the calls to `init` between the `before` and `after` calls, specifically what the callback to `listen()` will look like. The output formatting is slightly more elaborate to make calling context easier to see.

```js
let indent = 0;
async_hooks.createHook({
  init(asyncId, type, triggerAsyncId) {
    const eid = async_hooks.executionAsyncId();
    const indentStr = ' '.repeat(indent);
    fs.writeSync(
      1,
      `${indentStr}${type}(${asyncId}):` +
      ` trigger: ${triggerAsyncId} execution: ${eid}\n`);
  },
  before(asyncId) {
    const indentStr = ' '.repeat(indent);
    fs.writeSync(1, `${indentStr}before:  ${asyncId}\n`);
    indent += 2;
  },
  after(asyncId) {
    indent -= 2;
    const indentStr = ' '.repeat(indent);
    fs.writeSync(1, `${indentStr}after:   ${asyncId}\n`);
  },
  destroy(asyncId) {
    const indentStr = ' '.repeat(indent);
    fs.writeSync(1, `${indentStr}destroy: ${asyncId}\n`);
  },
}).enable();

require('net').createServer(() => {}).listen(8080, () => {
  // Let's wait 10ms before logging the server started.
  setTimeout(() => {
    console.log('>>>', async_hooks.executionAsyncId());
  }, 10);
});
```

Output from only starting the server:

```console
TCPSERVERWRAP(2): trigger: 1 execution: 1
TickObject(3): trigger: 2 execution: 1
before:  3
  Timeout(4): trigger: 3 execution: 3
  TIMERWRAP(5): trigger: 3 execution: 3
after:   3
destroy: 3
before:  5
  before:  4
    TTYWRAP(6): trigger: 4 execution: 4
    SIGNALWRAP(7): trigger: 4 execution: 4
    TTYWRAP(8): trigger: 4 execution: 4
>>> 4
    TickObject(9): trigger: 4 execution: 4
  after:   4
after:   5
before:  9
after:   9
destroy: 4
destroy: 9
destroy: 5
```

*Note*: As illustrated in the example, `executionAsyncId()` and `execution` each specify the value of the current execution context; which is delineated by calls to `before` and `after`.

Only using `execution` to graph resource allocation results in the following:

```console
TTYWRAP(6) -> Timeout(4) -> TIMERWRAP(5) -> TickObject(3) -> root(1)
```

The `TCPSERVERWRAP` is not part of this graph, even though it was the reason for `console.log()` being called. This is because binding to a port without a hostname is a *synchronous* operation, but to maintain a completely asynchronous API the user's callback is placed in a `process.nextTick()`.

The graph only shows *when* a resource was created, not *why*, so to track the *why* use `triggerAsyncId`.

##### `before(asyncId)`

* `asyncId` {number}

When an asynchronous operation is initiated (such as a TCP server receiving a new connection) or completes (such as writing data to disk) a callback is called to notify the user. The `before` callback is called just before said callback is executed. `asyncId` is the unique identifier assigned to the resource about to execute the callback.

The `before` callback will be called 0 to N times. The `before` callback will typically be called 0 times if the asynchronous operation was cancelled or, for example, if no connections are received by a TCP server. Persistent asynchronous resources like a TCP server will typically call the `before` callback multiple times, while other operations like `fs.open()` will call it only once.

##### `after(asyncId)`

* `asyncId` {number}

Called immediately after the callback specified in `before` is completed.

*Note:* If an uncaught exception occurs during execution of the callback, then `after` will run *after* the `'uncaughtException'` event is emitted or a `domain`'s handler runs.

##### `destroy(asyncId)`

* `asyncId` {number}

Called after the resource corresponding to `asyncId` is destroyed. It is also called asynchronously from the embedder API `emitDestroy()`.

*Note:* Some resources depend on garbage collection for cleanup, so if a reference is made to the `resource` object passed to `init` it is possible that `destroy` will never be called, causing a memory leak in the application. If the resource does not depend on garbage collection, then this will not be an issue.

##### `promiseResolve(asyncId)`

* `asyncId` {number}

Called when the `resolve` function passed to the `Promise` constructor is invoked (either directly or through other means of resolving a promise).

Note that `resolve()` does not do any observable synchronous work.

*Note:* This does not necessarily mean that the `Promise` is fulfilled or rejected at this point, if the `Promise` was resolved by assuming the state of another `Promise`.

For example:

```js
new Promise((resolve) => resolve(true)).then((a) => {});
```

calls the following callbacks:

```text
init for PROMISE with id 5, trigger id: 1
  promise resolve 5      # corresponds to resolve(true)
init for PROMISE with id 6, trigger id: 5  # the Promise returned by then()
  before 6               # the then() callback is entered
  promise resolve 6      # the then() callback resolves the promise by returning
  after 6
```

#### `async_hooks.executionAsyncId()`

<!-- YAML
added: v8.1.0
changes:

  - version: v8.2.0
    pr-url: https://github.com/nodejs/node/pull/13490
    description: Renamed from currentId
-->

* Returns: {number} The `asyncId` of the current execution context. Useful to track when something calls.

For example:

```js
const async_hooks = require('async_hooks');

console.log(async_hooks.executionAsyncId());  // 1 - bootstrap
fs.open(path, 'r', (err, fd) => {
  console.log(async_hooks.executionAsyncId());  // 6 - open()
});
```

The ID returned from `executionAsyncId()` is related to execution timing, not causality (which is covered by `triggerAsyncId()`). For example:

```js
const server = net.createServer(function onConnection(conn) {
  // Returns the ID of the server, not of the new connection, because the
  // onConnection callback runs in the execution scope of the server's
  // MakeCallback().
  async_hooks.executionAsyncId();

}).listen(port, function onListening() {
  // Returns the ID of a TickObject (i.e. process.nextTick()) because all
  // callbacks passed to .listen() are wrapped in a nextTick().
  async_hooks.executionAsyncId();
});
```

#### `async_hooks.triggerAsyncId()`

* Returns: {number} The ID of the resource responsible for calling the callback that is currently being executed.

For example:

```js
const server = net.createServer((conn) => {
  // The resource that caused (or triggered) this callback to be called
  // was that of the new connection. Thus the return value of triggerAsyncId()
  // is the asyncId of "conn".
  async_hooks.triggerAsyncId();

}).listen(port, () => {
  // Even though all callbacks passed to .listen() are wrapped in a nextTick()
  // the callback itself exists because the call to the server's .listen()
  // was made. So the return value would be the ID of the server.
  async_hooks.triggerAsyncId();
});
```

## JavaScript Embedder API

Library developers that handle their own asynchronous resources performing tasks like I/O, connection pooling, or managing callback queues may use the `AsyncWrap` JavaScript API so that all the appropriate callbacks are called.

### `class AsyncResource()`

The class `AsyncResource` was designed to be extended by the embedder's async resources. Using this users can easily trigger the lifetime events of their own resources.

The `init` hook will trigger when an `AsyncResource` is instantiated.

*Note*: `before` and `after` calls must be unwound in the same order that they are called. Otherwise, an unrecoverable exception will occur and the process will abort.

The following is an overview of the `AsyncResource` API.

```js
const { AsyncResource, executionAsyncId } = require('async_hooks');

// AsyncResource() is meant to be extended. Instantiating a
// new AsyncResource() also triggers init. If triggerAsyncId is omitted then
// async_hook.executionAsyncId() is used.
const asyncResource = new AsyncResource(
  type, { triggerAsyncId: executionAsyncId(), requireManualDestroy: false }
);

// Call AsyncHooks before callbacks.
asyncResource.emitBefore();

// Call AsyncHooks after callbacks.
asyncResource.emitAfter();

// Call AsyncHooks destroy callbacks.
asyncResource.emitDestroy();

// Return the unique ID assigned to the AsyncResource instance.
asyncResource.asyncId();

// Return the trigger ID for the AsyncResource instance.
asyncResource.triggerAsyncId();
```

#### `AsyncResource(type[, options])`

* `type` {string} The type of async event.
* `options` {Object} 
  * `triggerAsyncId` {number} The ID of the execution context that created this async event. **Default:** `executionAsyncId()`
  * `requireManualDestroy` {boolean} Disables automatic `emitDestroy` when the object is garbage collected. This usually does not need to be set (even if `emitDestroy` is called manually), unless the resource's asyncId is retrieved and the sensitive API's `emitDestroy` is called with it. **Default:** `false`

Example usage:

```js
class DBQuery extends AsyncResource {
  constructor(db) {
    super('DBQuery');
    this.db = db;
  }

  getInfo(query, callback) {
    this.db.get(query, (err, data) => {
      this.emitBefore();
      callback(err, data);
      this.emitAfter();
    });
  }

  close() {
    this.db = null;
    this.emitDestroy();
  }
}
```

#### `asyncResource.emitBefore()`

* Returns: {undefined}

Call all `before` callbacks to notify that a new asynchronous execution context is being entered. If nested calls to `emitBefore()` are made, the stack of `asyncId`s will be tracked and properly unwound.

#### `asyncResource.emitAfter()`

* Returns: {undefined}

Call all `after` callbacks. If nested calls to `emitBefore()` were made, then make sure the stack is unwound properly. Otherwise an error will be thrown.

If the user's callback throws an exception, `emitAfter()` will automatically be called for all `asyncId`s on the stack if the error is handled by a domain or `'uncaughtException'` handler.

#### `asyncResource.emitDestroy()`

* Returns: {undefined}

Call all `destroy` hooks. This should only ever be called once. An error will be thrown if it is called more than once. This **must** be manually called. If the resource is left to be collected by the GC then the `destroy` hooks will never be called.

#### `asyncResource.asyncId()`

* Returns: {number} The unique `asyncId` assigned to the resource.

#### `asyncResource.triggerAsyncId()`

* Returns: {number} The same `triggerAsyncId` that is passed to the `AsyncResource` constructor.