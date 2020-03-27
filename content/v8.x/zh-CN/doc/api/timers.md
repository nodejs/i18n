# Timers（定时器）

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定

`定时器`模块暴露了全局方法。用来对将要执行的函数进行线程调度。 因为定时器函数时全局的，因此不需要通过 `require('timers')`来使用该API。

在 Node.js 中的定时器函数实现了一个 API，该 API 和 Web 浏览器提供的定时器 API 类似，但其内部实现不同，它是采用了 [Node.js 事件循环](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick) 来构建的。

## Class：Immediate

此对象是在内部创建的，且由 [`setImmediate()`][] 返回。 为了取消计划的操作，可将其传递给 [`clearImmediate()`][]。

## Class: Timeout

此对象是在内部创建的，且由 [`setTimeout()`][] 和 [`setInterval()`][] 返回。 可将其 (分别) 传递给 [`clearTimeout()`][] 或 [`clearInterval()`][] 来取消预定的操作。

默认情况下，当使用 [`setTimeout()`][] 或 [`setInterval()`][] 计划了一个定时器，只要定时器处于活跃状态，Node.js 事件循环就会继续运行 。 由这些函数返回的每一个 `Timeout` 对象会导出 `timeout.ref()` 和 `timeout.unref()` 函数，这个两个函数可被用于控制此默认行为。

### timeout.ref()
<!-- YAML
added: v0.9.1
-->

当被调用时，只要 `Timeout` 处于激活状态，请求 Node.js 事件循环 *不要* 退出。 多次调用 `timeout.ref()` 不会产生任何作用。

*注意*：默认情况下，所有 `Timeout` 对象都是 "ref'd"，这就使得通常情况下没必要调用 `timeout.ref()`，除非 `timeout.unref()` 在之前被调用过。

返回一个 `Timeout` 的引用。

### timeout.unref()
<!-- YAML
added: v0.9.1
-->

当被调用时，活跃的 `Timeout` 对象将不需要 Node.js 的事件循环保持激活。 如果没有其它活动使得事件循环继续运行，进程可能会在 `Timeout` 对象的回调函数被调用之前退出。 多次调用 `timeout.unref()` 不会产生任何作用。

*注意*：调用 `timeout.unref()` 会创建一个内部定时器，该定时器会唤醒 Node.js 事件循环。 创建太多这样的定时器会对 Node.js 应用程序的性能产生负面影响。

返回一个 `Timeout` 的引用。

## Scheduling Timers

在 Node.js 中，定时器是一个内部结构，它会在特定的一段时间后调用一个给定的函数。 至于定时器具体何时被调用，要取决于创建定时器的方法，以及 Node.js 事件循环还在做什么其他的工作。

### setImmediate(callback[, ...args])
<!-- YAML
added: v0.9.1
-->

* `callback` {Function} 在此轮 [Node.js 事件循环](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick) 结束时要调用的函数
* `...args` {any} 当 `callback` 被调用时，要传递的可选参数。

在 I/O 事件的回调函数后，计划 "立即" 执行的 `callback`。 返回一个和 [`clearImmediate()`][] 一同使用的 `Immediate`。

当多次调用 `setImmediate()` 时，`callback` 函数将以它们被创建的次序排队等待执行。 每个事件循环迭代都会处理整个回调函数队列。 如果立即定时器是从正在执行的回调函数排入队列的，则在下一个事件循环迭代之前，该定时器不会被触发。

如果`callback`（回调函数）不是一个函数，将会抛出 [`TypeError`][] 错误。

*注意*：此方法具有一个用于 promises 的自定义变体，它可以通过 [`util.promisify()`][] 来获得：

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

计划每隔 `delay` 毫秒重复执行的 `callback`。 返回一个与 [`clearInterval()`][] 一起使用的 `Timeout`。

当 `delay` 大于 `2147483647` 或小于 `1` 时，`delay` 的值将被设置为 `1`。

如果 `callback` 不是一个函数，则将抛出 [`TypeError`][]。

### setTimeout(callback, delay[, ...args])
<!-- YAML
added: v0.0.1
-->

* `callback` {Function} 当定时器到点时要调用的函数。
* `delay` {number} 在调用 `callback` 之前需要等待的毫秒数。
* `...args` {any} 当 `callback` 被调用时，要传递的可选参数。

计划在 `delay` 毫秒后一次性执行的 `callback`。 返回一个和 [`clearTimeout()`][] 一起使用的 `Timeout`。

可能不会精确的在 `delay` 毫秒时调用 `callback`。 Node.js 不能保证回调函数被调用的准确时间，以及被调用的次序。 回调函数将被在和指定时间尽量接近的时间被调用。

*注意*：当 `delay` 大于 `2147483647` 或小于 `1` 时，`delay` 的值将被设置为 `1`。

如果`callback`（回调函数）不是一个函数，将会抛出 [`TypeError`][] 错误。

*注意*：此方法具有一个用于 promises 的自定义变体，它可以通过 [`util.promisify()`][] 来获得：

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
