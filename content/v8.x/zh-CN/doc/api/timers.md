# 定时器

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定的

The `timer` module exposes a global API for scheduling functions to be called at some future period of time. Because the timer functions are globals, there is no need to call `require('timers')` to use the API.

The timer functions within Node.js implement a similar API as the timers API provided by Web Browsers but use a different internal implementation that is built around [the Node.js Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick).

## 类：Immediate

此对象是在内部创建的，且由 [`setImmediate()`][] 返回。 It can be passed to [`clearImmediate()`][] in order to cancel the scheduled actions.

## 类：Timeout

This object is created internally and is returned from [`setTimeout()`][] and [`setInterval()`][]. It can be passed to [`clearTimeout()`][] or [`clearInterval()`][] (respectively) in order to cancel the scheduled actions.

By default, when a timer is scheduled using either [`setTimeout()`][] or [`setInterval()`][], the Node.js event loop will continue running as long as the timer is active. Each of the `Timeout` objects returned by these functions export both `timeout.ref()` and `timeout.unref()` functions that can be used to control this default behavior.

### timeout.ref()

<!-- YAML
added: v0.9.1
-->

When called, requests that the Node.js event loop *not* exit so long as the `Timeout` is active. 多次调用 `timeout.ref()` 不会产生任何作用。

*Note*: By default, all `Timeout` objects are "ref'd", making it normally unnecessary to call `timeout.ref()` unless `timeout.unref()` had been called previously.

返回一个 `Timeout` 的引用。

### timeout.unref()

<!-- YAML
added: v0.9.1
-->

When called, the active `Timeout` object will not require the Node.js event loop to remain active. If there is no other activity keeping the event loop running, the process may exit before the `Timeout` object's callback is invoked. Calling `timeout.unref()` multiple times will have no effect.

*Note*: Calling `timeout.unref()` creates an internal timer that will wake the Node.js event loop. Creating too many of these can adversely impact performance of the Node.js application.

返回一个 `Timeout` 的引用。

## 计划定时器

A timer in Node.js is an internal construct that calls a given function after a certain period of time. When a timer's function is called varies depending on which method was used to create the timer and what other work the Node.js event loop is doing.

### setImmediate(callback[, ...args])

<!-- YAML
added: v0.9.1
-->

* `callback` {Function} The function to call at the end of this turn of [the Node.js Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick)
* `...args` {any} 当 `callback` 被调用时，要传递的可选参数。

Schedules the "immediate" execution of the `callback` after I/O events' callbacks. 返回一个和 [`clearImmediate()`][] 一同使用的 `Immediate`。

When multiple calls to `setImmediate()` are made, the `callback` functions are queued for execution in the order in which they are created. The entire callback queue is processed every event loop iteration. If an immediate timer is queued from inside an executing callback, that timer will not be triggered until the next event loop iteration.

如果 `callback` 不是一个函数，则将抛出 [`TypeError`][]。

*Note*: This method has a custom variant for promises that is available using [`util.promisify()`][]:

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
* `delay` {number} The number of milliseconds to wait before calling the `callback`.
* `...args` {any} 当 `callback` 被调用时，要传递的可选参数。

计划每隔 `delay` 毫秒重复执行的 `callback`。 返回一个与 [`clearInterval()`][] 一起使用的 `Timeout`。

When `delay` is larger than `2147483647` or less than `1`, the `delay` will be set to `1`.

如果 `callback` 不是一个函数，则将抛出 [`TypeError`][]。

### setTimeout(callback, delay[, ...args])

<!-- YAML
added: v0.0.1
-->

* `callback` {Function} 当定时器到点时要调用的函数。
* `delay` {number} The number of milliseconds to wait before calling the `callback`.
* `...args` {any} 当 `callback` 被调用时，要传递的可选参数。

计划在 `delay` 毫秒后一次性执行的 `callback`。 返回一个和 [`clearTimeout()`][] 一起使用的 `Timeout`。

可能不会精确的在 `delay` 毫秒时调用 `callback`。 Node.js makes no guarantees about the exact timing of when callbacks will fire, nor of their ordering. The callback will be called as close as possible to the time specified.

*Note*: When `delay` is larger than `2147483647` or less than `1`, the `delay` will be set to `1`.

如果 `callback` 不是一个函数，则将抛出 [`TypeError`][]。

*Note*: This method has a custom variant for promises that is available using [`util.promisify()`][]:

```js
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

setTimeoutPromise(40, 'foobar').then((value) => {
  // value === 'foobar' (passing values is optional)
  // This is executed after about 40 milliseconds.
});
```

## 取消定时器

The [`setImmediate()`][], [`setInterval()`][], and [`setTimeout()`][] methods each return objects that represent the scheduled timers. These can be used to cancel the timer and prevent it from triggering.

It is not possible to cancel timers that were created using the promisified variants of [`setImmediate()`][], [`setTimeout()`][].

### clearImmediate(immediate)

<!-- YAML
added: v0.9.1
-->

* `immediate` {Immediate} An `Immediate` object as returned by [`setImmediate()`][].

取消由 [`setImmediate()`][] 创建的 `Immediate` 对象。

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