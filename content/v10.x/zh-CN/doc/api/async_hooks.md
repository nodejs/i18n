# 异步钩子

<!--introduced_in=v8.1.0-->

> 稳定性：1 - 实验中

`async_hooks` 模块提供了一个用来注册回调函数的API，它可以用来追踪在Node.js应用程序中创建的异步资源的生存期。 可以通过如下方式访问：

```js
const async_hooks = require('async_hooks');
```

## 术语

一个异步资源代表一个含有相关联回调函数的对象。 This callback may be called multiple times, for example, the `'connection'` event in `net.createServer()`, or just a single time like in `fs.open()`. A resource can also be closed before the callback is called. `AsyncHook` does not explicitly distinguish between these different cases but will represent them as the abstract concept that is a resource.

If [`Worker`][]s are used, each thread has an independent `async_hooks` interface, and each thread will use a new set of async IDs.

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

#### async_hooks.createHook(callbacks)

<!-- YAML
added: v8.1.0
-->

* `callbacks` {Object} The [Hook Callbacks](#async_hooks_hook_callbacks) to register
  * `init` {Function} [`init` 回调函数][]。
  * `before` {Function} [`before` 回调函数][]
  * `after` {Function} [`after` 回调函数][]。
  * `destroy` {Function} [`destroy` 回调函数][]。
* 返回：用于禁用和启用钩子的 {AsyncHook} 实例

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

如果任何 `AsyncHook` 回调函数抛出异常，应用程序会打印追溯栈并退出。 The exit path does follow that of an uncaught exception, but all `'uncaughtException'` listeners are removed, thus forcing the process to exit. 除非应用程序在运行时添加了`--abort-on-uncaught-exception`参数，`'exit'`回调函数仍会被调用，在这种情况下，回溯栈仍会被打印，应用程序会退出，并留下一个核心文件。

此错误处理行为的原因在于这些回调函数正在运行在对象的生命周期中潜在的不稳定点上，例如在类构造和析构时。 正因为如此，为了防止在未来被无意中止，迅速杀死进程被认为是必要的。 如果进行综合分析，这点在将来可能会发生变化，以确保异常可以遵循正常的控制流程而不会产生无意的副作用。

##### 在AsyncHooks回调函数中打印

由于打印到控制台是异步操作，`console.log()`会导致AsyncHooks回调函数被调用。 因此在AsyncHooks回调函数中使用`console.log()`或类似的异步操作会导致无限递归。 An easy solution to this when debugging is to use a synchronous logging operation such as `fs.writeFileSync(file, msg, flag)`. This will print to the file and will not invoke AsyncHooks recursively because it is synchronous.

```js
const fs = require('fs');
const util = require('util');

function debug(...args) {
  // use a function like this one when debugging inside an AsyncHooks callback
  fs.writeFileSync('log.out', `${util.format(...args)}\n`, { flag: 'a' });
}
```

如果需要异步操作进行日志记录，则可以使用AsyncHooks自身提供的信息来获取导致异步操作的原因。 如果是日志记录本身导致对AsyncHooks回调函数的调用，则日志记录应该被跳过。 通过这种方式，无限递归会被中断。

#### asyncHook.enable()

* 返回：{AsyncHook} 对`asyncHook`的引用。

为给定的 `AsyncHook` 实例启用回调函数。 如果未提供回调函数，则启用操作为 noop (空操作)。

在默认情况下，`AsyncHook` 实例被禁用。 如果 `AsyncHook` 实例需要在创建后立即被启用，则可以使用如下模式。

```js
const async_hooks = require('async_hooks');

const hook = async_hooks.createHook(callbacks).enable();
```

#### asyncHook.disable()

* 返回：{AsyncHook} 对`asyncHook`的引用。

Disable the callbacks for a given `AsyncHook` instance from the global pool of `AsyncHook` callbacks to be executed. 一旦钩子被禁用，在被启用之前它不会被再次调用。

为保持 API 的一致性，`disable()` 也返回 `AsyncHook` 的实例。

#### 钩子回调函数

异步事件生命周期中的关键事件被分为四种类型：实例化，在回调函数被调用之前/之后，以及当实例被销毁时。

##### init(asyncId, type, triggerAsyncId, resource)

* `asyncId` {number} 异步资源的唯一 ID。
* `type` {string} 异步资源的类型。
* `triggerAsyncId` {number} 异步资源在其被创建的执行上下文中的唯一 ID。
* `resource` {Object} Reference to the resource representing the async operation, needs to be released during _destroy_.

当一个类被构造时，如果有 _可能_ 会发出异步事件，则回调函数会被调用。 这并 _不_ 意味着在 `destroy` 被调用之前实例必须调用 `before`/`after`，只是这种可能性存在。

这种行为可以通过类似如下操作进行观察：打开一个资源然后在资源可用之前立即关闭它。 下面的代码片段可以就此进行演示。

```js
require('net').createServer().listen(function() { this.close(); });
// OR
clearTimeout(setTimeout(() => {}, 10));
```

Every new resource is assigned an ID that is unique within the scope of the current Node.js instance.

###### `type`

`type` 是一个用来识别资源类型的字符串，它会导致 `init` 被调用。 通常情况下，它将对应于资源构造函数的名字。

```text
FSEVENTWRAP, FSREQWRAP, GETADDRINFOREQWRAP, GETNAMEINFOREQWRAP, HTTPPARSER,
JSSTREAM, PIPECONNECTWRAP, PIPEWRAP, PROCESSWRAP, QUERYWRAP, SHUTDOWNWRAP,
SIGNALWRAP, STATWATCHER, TCPCONNECTWRAP, TCPSERVERWRAP, TCPWRAP, TIMERWRAP,
TTYWRAP, UDPSENDWRAP, UDPWRAP, WRITEWRAP, ZLIB, SSLCONNECTION, PBKDF2REQUEST,
RANDOMBYTESREQUEST, TLSWRAP, Timeout, Immediate, TickObject
```

还有 `PROMISE` 这种资源类型，它被用于跟踪 `Promise` 实例以及它们计划的异步工作。

用户可以通过使用公共的 embedder API来定义它们自己的 `type`。

It is possible to have type name collisions. Embedders are encouraged to use unique prefixes, such as the npm package name, to prevent collisions when listening to the hooks.

###### `triggerAsyncId`

`triggerAsyncId` 是导致 (或 “触发”) 新资源被初始化以及`init`被调用的资源的`asyncId`。 This is different from `async_hooks.executionAsyncId()` that only shows *when* a resource was created, while `triggerAsyncId` shows *why* a resource was created.

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
TCPSERVERWRAP(5): trigger: 1 execution: 1
TCPWRAP(7): trigger: 5 execution: 0
```

`TCPSERVERWRAP` 是接收连接的服务器。

`TCPWRAP` 是来自客户端的新连接。 When a new connection is made, the `TCPWrap` instance is immediately constructed. This happens outside of any JavaScript stack. (An `executionAsyncId()` of `0` means that it is being executed from C++ with no JavaScript stack above it.) With only that information, it would be impossible to link resources together in terms of what caused them to be created, so `triggerAsyncId` is given the task of propagating what resource is responsible for the new resource's existence.

###### `resource`

`resource` 是表示已被初始化的实际异步资源的对象。 它可能会包含因 `type` 值而异的有用信息。 For instance, for the `GETADDRINFOREQWRAP` resource type, `resource` provides the hostname used when looking up the IP address for the host in `net.Server.listen()`. 用于访问此信息的 API 目前不被视为公开的，但通过使用 Embedder API，用户可以提供并记录自己的资源对象。 例如，这样的资源对象可以包含将被执行的 SQL 查询。

In the case of Promises, the `resource` object will have `promise` property that refers to the `Promise` that is being initialized, and an `isChainedPromise` property, set to `true` if the promise has a parent promise, and `false` otherwise. For example, in the case of `b = a.then(handler)`, `a` is considered a parent `Promise` of `b`. Here, `b` is considered a chained promise.

In some cases the resource object is reused for performance reasons, it is thus not safe to use it as a key in a `WeakMap` or add properties to it.

###### 异步上下文示例

下面是一个示例，其中包含介于`before`和`after`之间的`init`调用的额外信息，特别是到`listen()`的回调函数是如何使用的。 输出格式略作了些调整以便调用上下文更易于查看。

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
    fs.writeFileSync('log.out',
                     `${indentStr}before:  ${asyncId}\n`, { flag: 'a' });
    indent += 2;
  },
  after(asyncId) {
    indent -= 2;
    const indentStr = ' '.repeat(indent);
    fs.writeFileSync('log.out',
                     `${indentStr}after:  ${asyncId}\n`, { flag: 'a' });
  },
  destroy(asyncId) {
    const indentStr = ' '.repeat(indent);
    fs.writeFileSync('log.out',
                     `${indentStr}destroy:  ${asyncId}\n`, { flag: 'a' });
  },
}).enable();

require('net').createServer(() => {}).listen(8080, () => {
  // Let's wait 10ms before logging the server started.
  setTimeout(() => {
    console.log('>>>', async_hooks.executionAsyncId());
  }, 10);
});
```

仅在服务器启动时的输出：

```console
TCPSERVERWRAP(5): trigger: 1 execution: 1
TickObject(6): trigger: 5 execution: 1
before:  6
  Timeout(7): trigger: 6 execution: 6
after:   6
destroy: 6
before:  7
>>> 7
  TickObject(8): trigger: 7 execution: 7
after:   7
before:  8
after:   8
```

As illustrated in the example, `executionAsyncId()` and `execution` each specify the value of the current execution context; which is delineated by calls to `before` and `after`.

仅使用 `execution` 来图示资源分配，会导致如下结果：

```console
Timeout(7) -> TickObject(6) -> root(1)
```

尽管是 `console.log()` 被调用的原因，但 `TCPSERVERWRAP` 并不是此图的一部分。 This is because binding to a port without a hostname is a *synchronous* operation, but to maintain a completely asynchronous API the user's callback is placed in a `process.nextTick()`.

The graph only shows *when* a resource was created, not *why*, so to track the *why* use `triggerAsyncId`.

##### before(asyncId)

* `asyncId` {number}

当异步操作被初始化 (例如TCP服务器收到新连接) 或完成时 (例如将数据写入磁盘)，回调函数被调用以通知用户。 `before` 在回调函数被调用之前被执行。 `asyncId` 是被分配给执行回调函数的资源的唯一标识符。

`before` 回调函数将被调用0到N次。 如果异步操作被取消，则`before`回调函数通常只会被调用0次，或者，例如，如果TCP服务器没有接收到任何连接。 将像TCP服务器这样的异步资源持久化通常会多次调用`before`回调函数，而其他诸如 `fs.open()` 这样的操作只会调用一次。

##### after(asyncId)

* `asyncId` {number}

在 `before` 中指定的回调函数结束后立即调用。

If an uncaught exception occurs during execution of the callback, then `after` will run *after* the `'uncaughtException'` event is emitted or a `domain`'s handler runs.

##### destroy(asyncId)

* `asyncId` {number}

在与 `asyncId` 对应的资源被销毁后调用。 它也从 embedder API 中的 `emitDestroy()` 中被异步调用。

Some resources depend on garbage collection for cleanup, so if a reference is made to the `resource` object passed to `init` it is possible that `destroy` will never be called, causing a memory leak in the application. If the resource does not depend on garbage collection, then this will not be an issue.

##### promiseResolve(asyncId)

* `asyncId` {number}

当传递给 `Promise` 构造器的 `resolve` 函数被调用 (被直接调用或通过其他完成promise的方法调用) 时，它会被调用。

注意 `resolve()` 不会做任何可观察的同步工作。

The `Promise` is not necessarily fulfilled or rejected at this point if the `Promise` was resolved by assuming the state of another `Promise`.

```js
new Promise((resolve) => resolve(true)).then((a) => {});
```

调用如下的回调函数：

```text
init for PROMISE with id 5, trigger id: 1
  promise resolve 5      # corresponds to resolve(true)
init for PROMISE with id 6, trigger id: 5  # the Promise returned by then()
  before 6               # the then() callback is entered
  promise resolve 6      # the then() callback resolves the promise by returning
  after 6
```

#### async_hooks.executionAsyncId()

<!-- YAML
added: v8.1.0
changes:
  - version: v8.2.0
    pr-url: https://github.com/nodejs/node/pull/13490
    description: Renamed from `currentId`
-->

* 返回：{number} 当前执行上下文的 `asyncId`。 在追踪某些调用时非常有用。

```js
const async_hooks = require('async_hooks');

console.log(async_hooks.executionAsyncId());  // 1 - bootstrap
fs.open(path, 'r', (err, fd) => {
  console.log(async_hooks.executionAsyncId());  // 6 - open()
});
```

The ID returned from `executionAsyncId()` is related to execution timing, not causality (which is covered by `triggerAsyncId()`):

```js
const server = net.createServer((conn) => {
  // Returns the ID of the server, not of the new connection, because the
  // callback runs in the execution scope of the server's MakeCallback().
  async_hooks.executionAsyncId();

}).listen(port, () => {
  // Returns the ID of a TickObject (i.e. process.nextTick()) because all
  // callbacks passed to .listen() are wrapped in a nextTick().
  async_hooks.executionAsyncId();
});
```

Note that promise contexts may not get precise `executionAsyncIds` by default. See the section on [promise execution tracking](#async_hooks_promise_execution_tracking).

#### async_hooks.triggerAsyncId()

* 返回：{number} 负责调用正在被执行的回调函数的资源ID。

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

Note that promise contexts may not get valid `triggerAsyncId`s by default. See the section on [promise execution tracking](#async_hooks_promise_execution_tracking).

## Promise execution tracking

By default, promise executions are not assigned `asyncId`s due to the relatively expensive nature of the [promise introspection API](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk/edit) provided by V8. This means that programs using promises or `async`/`await` will not get correct execution and trigger ids for promise callback contexts by default.

```js
const ah = require('async_hooks');
Promise.resolve(1729).then(() => {
  console.log(`eid ${ah.executionAsyncId()} tid ${ah.triggerAsyncId()}`);
});
// produces:
// eid 1 tid 0
```

Observe that the `then()` callback claims to have executed in the context of the outer scope even though there was an asynchronous hop involved. Also note that the `triggerAsyncId` value is `0`, which means that we are missing context about the resource that caused (triggered) the `then()` callback to be executed.

Installing async hooks via `async_hooks.createHook` enables promise execution tracking:

```js
const ah = require('async_hooks');
ah.createHook({ init() {} }).enable(); // forces PromiseHooks to be enabled.
Promise.resolve(1729).then(() => {
  console.log(`eid ${ah.executionAsyncId()} tid ${ah.triggerAsyncId()}`);
});
// produces:
// eid 7 tid 6
```

In this example, adding any actual hook function enabled the tracking of promises. There are two promises in the example above; the promise created by `Promise.resolve()` and the promise returned by the call to `then()`. In the example above, the first promise got the `asyncId` `6` and the latter got `asyncId` `7`. During the execution of the `then()` callback, we are executing in the context of promise with `asyncId` `7`. This promise was triggered by async resource `6`.

Another subtlety with promises is that `before` and `after` callbacks are run only on chained promises. That means promises not created by `then()`/`catch()` will not have the `before` and `after` callbacks fired on them. For more details see the details of the V8 [PromiseHooks](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk/edit) API.

## JavaScript Embedder API

Library developers that handle their own asynchronous resources performing tasks like I/O, connection pooling, or managing callback queues may use the `AsyncWrap` JavaScript API so that all the appropriate callbacks are called.

### Class: AsyncResource

The class `AsyncResource` is designed to be extended by the embedder's async resources. Using this, users can easily trigger the lifetime events of their own resources.

当 `AsyncResource` 被初始化时，`init` 钩子将会触发。

以下是对 `AsyncResource` API 的概览。

```js
const { AsyncResource, executionAsyncId } = require('async_hooks');

// AsyncResource() is meant to be extended. Instantiating a
// new AsyncResource() also triggers init. If triggerAsyncId is omitted then
// async_hook.executionAsyncId() is used.
const asyncResource = new AsyncResource(
  type, { triggerAsyncId: executionAsyncId(), requireManualDestroy: false }
);

// Run a function in the execution context of the resource. This will
// * establish the context of the resource
// * trigger the AsyncHooks before callbacks
// * call the provided function `fn` with the supplied arguments
// * trigger the AsyncHooks after callbacks
// * restore the original execution context
asyncResource.runInAsyncScope(fn, thisArg, ...args);

// Call AsyncHooks destroy callbacks.
asyncResource.emitDestroy();

// Return the unique ID assigned to the AsyncResource instance.
asyncResource.asyncId();

// Return the trigger ID for the AsyncResource instance.
asyncResource.triggerAsyncId();
```

#### new AsyncResource(type[, options])

* `type` {string} 异步事件的类型。
* `options` {Object}
  * `triggerAsyncId` {number} 创建此异步事件的执行上下文ID。 **默认值：** `executionAsyncId()`.
  * `requireManualDestroy` {boolean} 当对象被垃圾回收时，禁用自动的 `emitDestroy`。 This usually does not need to be set (even if `emitDestroy` is called manually), unless the resource's `asyncId` is retrieved and the sensitive API's `emitDestroy` is called with it. **默认:** `false`.

示例用法：

```js
class DBQuery extends AsyncResource {
  constructor(db) {
    super('DBQuery');
    this.db = db;
  }

  getInfo(query, callback) {
    this.db.get(query, (err, data) => {
      this.runInAsyncScope(callback, null, err, data);
    });
  }

  close() {
    this.db = null;
    this.emitDestroy();
  }
}
```

#### asyncResource.runInAsyncScope(fn[, thisArg, ...args])
<!-- YAML
added: v9.6.0
-->

* `fn` {Function} The function to call in the execution context of this async resource.
* `thisArg` {any} The receiver to be used for the function call.
* `...args` {any} Optional arguments to pass to the function.

Call the provided function with the provided arguments in the execution context of the async resource. This will establish the context, trigger the AsyncHooks before callbacks, call the function, trigger the AsyncHooks after callbacks, and then restore the original execution context.

#### asyncResource.emitBefore()
<!-- YAML
deprecated: v9.6.0
-->
> Stability: 0 - Deprecated: Use [`asyncResource.runInAsyncScope()`][] instead.

调用所有的 `before` 回调函数以通知进入了一个新的异步执行上下文。 如果对 `emitBefore()` 进行了嵌套调用，`asyncId` 栈会被追踪并被正确解析。

`before` and `after` calls must be unwound in the same order that they are called. 否则，会发生不可恢复错误且进程被终止。 For this reason, the `emitBefore` and `emitAfter` APIs are considered deprecated. Please use `runInAsyncScope`, as it provides a much safer alternative.

#### asyncResource.emitAfter()
<!-- YAML
deprecated: v9.6.0
-->
> Stability: 0 - Deprecated: Use [`asyncResource.runInAsyncScope()`][] instead.

调用所有 `after` 回调函数。 如果对 `emitBefore()` 进行了嵌套调用，请确保正确解析栈。 否则将抛出错误。

如果用户的回调函数抛出错误，同时错误由域或 `'uncaughtException'` 处理程序来处理，则针对栈中的所有 `asyncId`，`emitAfter()` 会被调用。

`before` and `after` calls must be unwound in the same order that they are called. 否则，会发生不可恢复错误且进程被终止。 For this reason, the `emitBefore` and `emitAfter` APIs are considered deprecated. Please use `runInAsyncScope`, as it provides a much safer alternative.

#### asyncResource.emitDestroy()

* Returns: {AsyncResource} A reference to `asyncResource`.

调用所有 `destroy` 钩子。 这应该只被调用一次。 如果被调用多次，将会抛出错误。 **必须** 手动调用它。 如果资源由垃圾回收器回收，则 `destroy` 钩子永不会被调用。

#### asyncResource.asyncId()

* 返回：{number} 分配给资源的唯一性 `asyncId`。

#### asyncResource.triggerAsyncId()

* Returns: {number} The same `triggerAsyncId` that is passed to the `AsyncResource` constructor.
