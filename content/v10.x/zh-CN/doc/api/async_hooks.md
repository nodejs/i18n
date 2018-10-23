# 异步钩子

<!--introduced_in=v8.1.0-->

> Stability: 1 - Experimental

`async_hooks` 模块提供了一个用来注册回调函数的API，它可以用来追踪在Node.js应用程序中创建的异步资源的生存期。 It can be accessed using:

```js
const async_hooks = require('async_hooks');
```

## 术语

一个异步资源代表一个含有相关联回调函数的对象。 This callback may be called multiple times, for example, the `'connection'` event in `net.createServer()`, or just a single time like in `fs.open()`. A resource can also be closed before the callback is called. `AsyncHook` does not explicitly distinguish between these different cases but will represent them as the abstract concept that is a resource.

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

* `callbacks` {Object} 要注册的 [钩子回调函数](#async_hooks_hook_callbacks) 
  * `init` {Function} [`init` 回调函数][]。
  * `before` {Function} [`before` 回调函数][]
  * `after` {Function} [`after` 回调函数][]。
  * `destroy` {Function} [`destroy` 回调函数][]。
* Returns: {AsyncHook} Instance used for disabling and enabling hooks

注册针对每个异步操作的不同生命周期事件而调用的函数。

回调函数`init()`/`before()`/`after()`/`destroy()`在资源生命周期中为各自的异步事件所调用。

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

##### Error Handling

如果任何 `AsyncHook` 回调函数被抛出，应用程序会打印追溯栈并退出。 The exit path does follow that of an uncaught exception, but all `'uncaughtException'` listeners are removed, thus forcing the process to exit. 除非应用程序在运行时添加了`--abort-on-uncaught-exception`参数，`'exit'`回调函数仍会被调用，这这种情况下，回溯栈仍会被打印，应用程序会退出，并留下一个核心文件。

此错误处理行为的原因在于这些回调函数正在运行在对象的生命周期中潜在的不稳定点上，例如在类构造和析构时。 正因为如此，为了防止在未来被无意中止，迅速杀死进程被认为是必要的。 如果进行综合分析，这点在将来可能会发生变化，以确保异常可以遵循正常的控制流程而不会产生无意的副作用。

##### 在AsyncHooks回调函数中打印

由于打印到控制台是异步操作，`console.log()`会导致AsyncHooks回调函数被调用。 因此在AsyncHooks回调函数中使用`console.log()`或类似的异步操作会导致无限递归。 An easy solution to this when debugging is to use a synchronous logging operation such as `fs.writeSync(1, msg)`. This will print to stdout because `1` is the file descriptor for stdout and will not invoke AsyncHooks recursively because it is synchronous.

```js
const fs = require('fs');
const util = require('util');

function debug(...args) {
  // use a function like this one when debugging inside an AsyncHooks callback
  fs.writeSync(1, `${util.format(...args)}\n`);
}
```

如果在日志记录时需要异步操作，则可以使用AsyncHooks自身提供的信息来获取导致异步操作的原因。 如果是日志记录本身导致对AsyncHooks回调函数的调用，则日志记录应该被跳过。 通过这种方式，无限递归会被中断。

#### asyncHook.enable()

* 返回：{AsyncHook} 对`asyncHook`的引用。

为给定的 `AsyncHook` 实例启用回调函数。 If no callbacks are provided enabling is a noop.

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
* `resource` {Object} Reference to the resource representing the async operation, needs to be released during *destroy*.

Called when a class is constructed that has the *possibility* to emit an asynchronous event. This *does not* mean the instance must call `before`/`after` before `destroy` is called, only that the possibility exists.

This behavior can be observed by doing something like opening a resource then closing it before the resource can be used. The following snippet demonstrates this.

```js
require('net').createServer().listen(function() { this.close(); });
// OR
clearTimeout(setTimeout(() => {}, 10));
```

Every new resource is assigned an ID that is unique within the scope of the current process.

###### `type`

The `type` is a string identifying the type of resource that caused `init` to be called. Generally, it will correspond to the name of the resource's constructor.

```text
FSEVENTWRAP, FSREQWRAP, GETADDRINFOREQWRAP, GETNAMEINFOREQWRAP, HTTPPARSER,
JSSTREAM, PIPECONNECTWRAP, PIPEWRAP, PROCESSWRAP, QUERYWRAP, SHUTDOWNWRAP,
SIGNALWRAP, STATWATCHER, TCPCONNECTWRAP, TCPSERVER, TCPWRAP, TIMERWRAP, TTYWRAP,
UDPSENDWRAP, UDPWRAP, WRITEWRAP, ZLIB, SSLCONNECTION, PBKDF2REQUEST,
RANDOMBYTESREQUEST, TLSWRAP, Timeout, Immediate, TickObject
```

There is also the `PROMISE` resource type, which is used to track `Promise` instances and asynchronous work scheduled by them.

Users are able to define their own `type` when using the public embedder API.

It is possible to have type name collisions. Embedders are encouraged to use unique prefixes, such as the npm package name, to prevent collisions when listening to the hooks.

###### `triggerAsyncId`

`triggerAsyncId` is the `asyncId` of the resource that caused (or "triggered") the new resource to initialize and that caused `init` to call. This is different from `async_hooks.executionAsyncId()` that only shows *when* a resource was created, while `triggerAsyncId` shows *why* a resource was created.

The following is a simple demonstration of `triggerAsyncId`:

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

Output when hitting the server with `nc localhost 8080`:

```console
TCPSERVERWRAP(2): trigger: 1 execution: 1
TCPWRAP(4): trigger: 2 execution: 0
```

The `TCPSERVERWRAP` is the server which receives the connections.

The `TCPWRAP` is the new connection from the client. When a new connection is made, the `TCPWrap` instance is immediately constructed. This happens outside of any JavaScript stack. (An `executionAsyncId()` of `0` means that it is being executed from C++ with no JavaScript stack above it.) With only that information, it would be impossible to link resources together in terms of what caused them to be created, so `triggerAsyncId` is given the task of propagating what resource is responsible for the new resource's existence.

###### `resource`

`resource` is an object that represents the actual async resource that has been initialized. This can contain useful information that can vary based on the value of `type`. For instance, for the `GETADDRINFOREQWRAP` resource type, `resource` provides the hostname used when looking up the IP address for the hostname in `net.Server.listen()`. The API for accessing this information is currently not considered public, but using the Embedder API, users can provide and document their own resource objects. For example, such a resource object could contain the SQL query being executed.

In the case of Promises, the `resource` object will have `promise` property that refers to the `Promise` that is being initialized, and an `isChainedPromise` property, set to `true` if the promise has a parent promise, and `false` otherwise. For example, in the case of `b = a.then(handler)`, `a` is considered a parent `Promise` of `b`. Here, `b` is considered a chained promise.

In some cases the resource object is reused for performance reasons, it is thus not safe to use it as a key in a `WeakMap` or add properties to it.

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

As illustrated in the example, `executionAsyncId()` and `execution` each specify the value of the current execution context; which is delineated by calls to `before` and `after`.

Only using `execution` to graph resource allocation results in the following:

```console
TTYWRAP(6) -> Timeout(4) -> TIMERWRAP(5) -> TickObject(3) -> root(1)
```

The `TCPSERVERWRAP` is not part of this graph, even though it was the reason for `console.log()` being called. This is because binding to a port without a hostname is a *synchronous* operation, but to maintain a completely asynchronous API the user's callback is placed in a `process.nextTick()`.

The graph only shows *when* a resource was created, not *why*, so to track the *why* use `triggerAsyncId`.

##### before(asyncId)

* `asyncId` {number}

When an asynchronous operation is initiated (such as a TCP server receiving a new connection) or completes (such as writing data to disk) a callback is called to notify the user. The `before` callback is called just before said callback is executed. `asyncId` is the unique identifier assigned to the resource about to execute the callback.

The `before` callback will be called 0 to N times. The `before` callback will typically be called 0 times if the asynchronous operation was cancelled or, for example, if no connections are received by a TCP server. Persistent asynchronous resources like a TCP server will typically call the `before` callback multiple times, while other operations like `fs.open()` will call it only once.

##### after(asyncId)

* `asyncId` {number}

Called immediately after the callback specified in `before` is completed.

If an uncaught exception occurs during execution of the callback, then `after` will run *after* the `'uncaughtException'` event is emitted or a `domain`'s handler runs.

##### destroy(asyncId)

* `asyncId` {number}

Called after the resource corresponding to `asyncId` is destroyed. It is also called asynchronously from the embedder API `emitDestroy()`.

Some resources depend on garbage collection for cleanup, so if a reference is made to the `resource` object passed to `init` it is possible that `destroy` will never be called, causing a memory leak in the application. If the resource does not depend on garbage collection, then this will not be an issue.

##### promiseResolve(asyncId)

* `asyncId` {number}

Called when the `resolve` function passed to the `Promise` constructor is invoked (either directly or through other means of resolving a promise).

Note that `resolve()` does not do any observable synchronous work.

The `Promise` is not necessarily fulfilled or rejected at this point if the `Promise` was resolved by assuming the state of another `Promise`.

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

#### async_hooks.executionAsyncId()

<!-- YAML
added: v8.1.0
changes:

  - version: v8.2.0
    pr-url: https://github.com/nodejs/node/pull/13490
    description: Renamed from `currentId`
-->

* Returns: {number} The `asyncId` of the current execution context. Useful to track when something calls.

```js
const async_hooks = require('async_hooks');

console.log(async_hooks.executionAsyncId());  // 1 - bootstrap
fs.open(path, 'r', (err, fd) => {
  console.log(async_hooks.executionAsyncId());  // 6 - open()
});
```

The ID returned from `executionAsyncId()` is related to execution timing, not causality (which is covered by `triggerAsyncId()`):

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

Note that promise contexts may not get precise `executionAsyncIds` by default. See the section on [promise execution tracking](#async_hooks_promise_execution_tracking).

#### async_hooks.triggerAsyncId()

* Returns: {number} The ID of the resource responsible for calling the callback that is currently being executed.

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

By default, promise executions are not assigned `asyncId`s due to the relatively expensive nature of the [promise introspection API](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk) provided by V8. This means that programs using promises or `async`/`await` will not get correct execution and trigger ids for promise callback contexts by default.

Here's an example:

```js
const ah = require('async_hooks');
Promise.resolve(1729).then(() => {
  console.log(`eid ${ah.executionAsyncId()} tid ${ah.triggerAsyncId()}`);
});
// produces:
// eid 1 tid 0
```

Observe that the `then()` callback claims to have executed in the context of the outer scope even though there was an asynchronous hop involved. Also note that the `triggerAsyncId` value is `0`, which means that we are missing context about the resource that caused (triggered) the `then()` callback to be executed.

Installing async hooks via `async_hooks.createHook` enables promise execution tracking. Example:

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

Another subtlety with promises is that `before` and `after` callbacks are run only on chained promises. That means promises not created by `then()`/`catch()` will not have the `before` and `after` callbacks fired on them. For more details see the details of the V8 [PromiseHooks](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk) API.

## JavaScript Embedder API

Library developers that handle their own asynchronous resources performing tasks like I/O, connection pooling, or managing callback queues may use the `AsyncWrap` JavaScript API so that all the appropriate callbacks are called.

### Class: AsyncResource

The class `AsyncResource` is designed to be extended by the embedder's async resources. Using this, users can easily trigger the lifetime events of their own resources.

The `init` hook will trigger when an `AsyncResource` is instantiated.

The following is an overview of the `AsyncResource` API.

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

// Call AsyncHooks before callbacks.
// Deprecated: Use asyncResource.runInAsyncScope instead.
asyncResource.emitBefore();

// Call AsyncHooks after callbacks.
// Deprecated: Use asyncResource.runInAsyncScope instead.
asyncResource.emitAfter();
```

#### new AsyncResource(type[, options])

* `type` {string} The type of async event.
* `options` {Object} 
  * `triggerAsyncId` {number} The ID of the execution context that created this async event. **Default:** `executionAsyncId()`.
  * `requireManualDestroy` {boolean} Disables automatic `emitDestroy` when the object is garbage collected. This usually does not need to be set (even if `emitDestroy` is called manually), unless the resource's `asyncId` is retrieved and the sensitive API's `emitDestroy` is called with it. **Default:** `false`.

Example usage:

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

Call all `before` callbacks to notify that a new asynchronous execution context is being entered. If nested calls to `emitBefore()` are made, the stack of `asyncId`s will be tracked and properly unwound.

`before` and `after` calls must be unwound in the same order that they are called. Otherwise, an unrecoverable exception will occur and the process will abort. For this reason, the `emitBefore` and `emitAfter` APIs are considered deprecated. Please use `runInAsyncScope`, as it provides a much safer alternative.

#### asyncResource.emitAfter()

<!-- YAML
deprecated: v9.6.0
-->

> Stability: 0 - Deprecated: Use [`asyncResource.runInAsyncScope()`][] instead.

Call all `after` callbacks. If nested calls to `emitBefore()` were made, then make sure the stack is unwound properly. Otherwise an error will be thrown.

If the user's callback throws an exception, `emitAfter()` will automatically be called for all `asyncId`s on the stack if the error is handled by a domain or `'uncaughtException'` handler.

`before` and `after` calls must be unwound in the same order that they are called. Otherwise, an unrecoverable exception will occur and the process will abort. For this reason, the `emitBefore` and `emitAfter` APIs are considered deprecated. Please use `runInAsyncScope`, as it provides a much safer alternative.

#### asyncResource.emitDestroy()

Call all `destroy` hooks. This should only ever be called once. An error will be thrown if it is called more than once. This **must** be manually called. If the resource is left to be collected by the GC then the `destroy` hooks will never be called.

#### asyncResource.asyncId()

* Returns: {number} The unique `asyncId` assigned to the resource.

#### asyncResource.triggerAsyncId()

* Returns: {number} The same `triggerAsyncId` that is passed to the `AsyncResource` constructor.