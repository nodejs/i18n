# Timers（定时器）

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定

`定时器`模块暴露了全局方法。用来对将要执行的函数进行线程调度。 因为定时器函数时全局的，因此不需要通过 `require('timers')`来使用该API。

The timer functions within Node.js implement a similar API as the timers API provided by Web Browsers but use a different internal implementation that is built around [the Node.js Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/).

## Class：Immediate

此对象是在内部创建的，且由 [`setImmediate()`][] 返回。 为了取消计划的操作，可将其传递给 [`clearImmediate()`][]。

在默认情况下，当immediate加入事件队列后，如果immediate处于激活状态Node.js的事件循环队列会继续执行。 The `Immediate` object returned by [`setImmediate()`][] exports both `immediate.ref()` and `immediate.unref()` functions that can be used to control this default behavior.

### immediate.ref()
<!-- YAML
added: v9.7.0
-->

* 返回值：{Immediate} 一个`immediate`对象

When called, requests that the Node.js event loop *not* exit so long as the `Immediate` is active. Calling `immediate.ref()` multiple times will have no effect.

By default, all `Immediate` objects are "ref'ed", making it normally unnecessary to call `immediate.ref()` unless `immediate.unref()` had been called previously.

### immediate.unref()
<!-- YAML
added: v9.7.0
-->

* 返回值：{Immediate} 一个`immediate`对象

When called, the active `Immediate` object will not require the Node.js event loop to remain active. If there is no other activity keeping the event loop running, the process may exit before the `Immediate` object's callback is invoked. Calling `immediate.unref()` multiple times will have no effect.

## Class: Timeout

此对象是在内部创建的，且由 [`setTimeout()`][] 和 [`setInterval()`][] 返回。 It can be passed to either [`clearTimeout()`][] or [`clearInterval()`][] in order to cancel the scheduled actions.

默认情况下，当使用 [`setTimeout()`][] 或 [`setInterval()`][] 计划了一个定时器，只要定时器处于活跃状态，Node.js 事件循环就会继续运行 。 由这些函数返回的每一个 `Timeout` 对象会导出 `timeout.ref()` 和 `timeout.unref()` 函数，这个两个函数可被用于控制此默认行为。

### timeout.ref()
<!-- YAML
added: v0.9.1
-->

* Returns: {Timeout} a reference to `timeout`

当被调用时，只要 `Timeout` 处于激活状态，请求 Node.js 事件循环 *不要* 退出。 多次调用 `timeout.ref()` 不会产生任何作用。

By default, all `Timeout` objects are "ref'ed", making it normally unnecessary to call `timeout.ref()` unless `timeout.unref()` had been called previously.

### timeout.refresh()
<!-- YAML
added: v10.2.0
-->

* Returns: {Timeout} a reference to `timeout`

Sets the timer's start time to the current time, and reschedules the timer to call its callback at the previously specified duration adjusted to the current time. This is useful for refreshing a timer without allocating a new JavaScript object.

Using this on a timer that has already called its callback will reactivate the timer.

### timeout.unref()
<!-- YAML
added: v0.9.1
-->

* Returns: {Timeout} a reference to `timeout`

当被调用时，活跃的 `Timeout` 对象将不需要 Node.js 的事件循环保持激活。 如果没有其它活动使得事件循环继续运行，进程可能会在 `Timeout` 对象的回调函数被调用之前退出。 多次调用 `timeout.unref()` 不会产生任何作用。

Calling `timeout.unref()` creates an internal timer that will wake the Node.js event loop. 创建太多这样的定时器会对 Node.js 应用程序的性能产生负面影响。

## Scheduling Timers

在 Node.js 中，定时器是一个内部结构，它会在特定的一段时间后调用一个给定的函数。 至于定时器具体何时被调用，要取决于创建定时器的方法，以及 Node.js 事件循环还在做什么其他的工作。

### setImmediate(callback[, ...args])
<!-- YAML
added: v0.9.1
-->

* `callback` {Function} The function to call at the end of this turn of [the Node.js Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)
* `...args` {any} 当 `callback` 被调用时，要传递的可选参数。
* Returns: {Immediate} for use with [`clearImmediate()`][]

在 I/O 事件的回调函数后，计划 "立即" 执行的 `callback`。

当多次调用 `setImmediate()` 时，`callback` 函数将以它们被创建的次序排队等待执行。 每个事件循环迭代都会处理整个回调函数队列。 如果立即定时器是从正在执行的回调函数排入队列的，则在下一个事件循环迭代之前，该定时器不会被触发。

如果`callback`（回调函数）不是一个函数，将会抛出 [`TypeError`][] 错误。

This method has a custom variant for promises that is available using [`util.promisify()`][]:

```js
const util = require('util');
const setImmediatePromise = util.promisify(setImmediate);

setImmediatePromise('foobar').then((value) => {
  // value === 'foobar' (passing values is optional)
  // This is executed after all I/O callbacks.
});

// or with async function
async function timerExample() {
  console.log('Before I/O callbacks');
  await setImmediatePromise();
  console.log('After I/O callbacks');
}
timerExample();
```

### setInterval(callback, delay[, ...args])
<!-- YAML
added: v0.0.1
-->

* `callback` {Function} 当定时器到点时要调用的函数。
* `delay` {number} 在调用 `callback` 之前需要等待的毫秒数。
* `...args` {any} 当 `callback` 被调用时，要传递的可选参数。
* Returns: {Timeout} for use with [`clearInterval()`][]

计划每隔 `delay` 毫秒重复执行的 `callback`。

当 `delay` 大于 `2147483647` 或小于 `1` 时，`delay` 的值将被设置为 `1`。

如果`callback`（回调函数）不是一个函数，将会抛出 [`TypeError`][] 错误。

### setTimeout(callback, delay[, ...args])
<!-- YAML
added: v0.0.1
-->

* `callback` {Function} 当定时器到点时要调用的函数。
* `delay` {number} 在调用 `callback` 之前需要等待的毫秒数。
* `...args` {any} 当 `callback` 被调用时，要传递的可选参数。
* Returns: {Timeout} for use with [`clearTimeout()`][]

计划在 `delay` 毫秒后一次性执行的 `callback`。

可能不会精确的在 `delay` 毫秒时调用 `callback`。 Node.js 不能保证回调函数被调用的准确时间，以及被调用的次序。 回调函数将被在和指定时间尽量接近的时间被调用。

When `delay` is larger than `2147483647` or less than `1`, the `delay` will be set to `1`.

如果`callback`（回调函数）不是一个函数，将会抛出 [`TypeError`][] 错误。

This method has a custom variant for promises that is available using [`util.promisify()`][]:

```js
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

setTimeoutPromise(40, 'foobar').then((value) => {
  // value === 'foobar' (参数是可选的)
  // 大约在40毫秒后执行.
});
```

## 取消定时器

[`setImmediate()`][], [`setInterval()`][], 和 [`setTimeout()`][] 中的每个方法都会返回代表已计划定时器的对象。 它们可被用于取消定时器并防止其被触发。

不可能取消使用 [`setImmediate()`][] 和 [`setTimeout()`][] 中 promisified 变体创建的定时器。

### clearImmediate(immediate)
<!-- YAML
added: v0.9.1
-->

* `immediate` {Immediate} 由 [`setImmediate()`][] 返回的 `Immediate` 对象。

取消掉由[`setImmediate()`][] 创建的立即执行对象`Immediate`

### clearInterval(timeout)
<!-- YAML
added: v0.0.1
-->

* `timeout` {Timeout} 由 [`setInterval()`][] 返回的 `Timeout` 对象。

取消由 [`setInterval()`][] 创建的 `Timeout` 对象。

### clearTimeout(timeout)
<!-- YAML
added: v0.0.1
-->

* `timeout` {Timeout} 由 [`setTimeout()`][] 返回的 `Timeout` 对象。

取消由 [`setTimeout()`][] 创建的 `Timeout` 对象。
