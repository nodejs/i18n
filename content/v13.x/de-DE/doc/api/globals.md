# Globale Objekte

<!--introduced_in=v0.10.0-->
<!-- type=misc -->

Diese Objekte sind in jedem Modul verfügbar. The following variables may appear to be global but are not. They exist only in the scope of modules, see the [module system documentation](modules.html):

* [`__dirname`][]
* [`__filename`][]
* [`exports`][]
* [`module`][]
* [`require()`][]

The objects listed here are specific to Node.js. There are [built-in objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects) that are part of the JavaScript language itself, which are also globally accessible.

## Class: `Buffer`
<!-- YAML
added: v0.1.103
-->

<!-- type=global -->

* {Function}

Verarbeitet binäre Daten. Siehe [Abschnitt Puffer](buffer.html).

## `__dirname`

This variable may appear to be global but is not. See [`__dirname`][].

## `__filename`

This variable may appear to be global but is not. See [`__filename`][].

## `clearImmediate(immediateObject)`
<!-- YAML
added: v0.9.1
-->

<!--type=global-->

[`clearImmediate`][] is described in the [timers](timers.html) section.

## `clearInterval(intervalObject)`
<!-- YAML
added: v0.0.1
-->

<!--type=global-->

[`clearInterval`][] is described in the [timers](timers.html) section.

## `clearTimeout(timeoutObject)`
<!-- YAML
added: v0.0.1
-->

<!--type=global-->

[`clearTimeout`][] is described in the [timers](timers.html) section.

## `konsole`
<!-- YAML
added: v0.1.100
-->

<!-- type=global -->

* {Object}

Wird zur Ausgabe mit stdout und stderr verwendet. Siehe Abschnitt [`console`][].

## `exports`

This variable may appear to be global but is not. See [`exports`][].

## `global`
<!-- YAML
added: v0.1.27
-->

<!-- type=global -->

* {Object} Das globale namespace Objekt.

In Browsern, ist der Top-Level Bereich der globale Bereich. This means that within the browser `var something` will define a new global variable. In Node.js this is different. The top-level scope is not the global scope; `var something` inside a Node.js module will be local to that module.

## `module`

This variable may appear to be global but is not. See [`module`][].

## `prozess`
<!-- YAML
added: v0.1.7
-->

<!-- type=global -->

* {Object}

Das Objekt Prozess. Siehe Abschnitt [`process` object][].

## `queueMicrotask(callback)`
<!-- YAML
added: v11.0.0
-->

<!-- type=global -->

* `callback` {Function} Function to be queued.

The `queueMicrotask()` method queues a microtask to invoke `callback`. If `callback` throws an exception, the [`process` object][] `'uncaughtException'` event will be emitted.

The microtask queue is managed by V8 and may be used in a similar manner to the [`process.nextTick()`][] queue, which is managed by Node.js. The `process.nextTick()` queue is always processed before the microtask queue within each turn of the Node.js event loop.

```js
// Here, `queueMicrotask()` is used to ensure the 'load' event is always
// emitted asynchronously, and therefore consistently. Using
// `process.nextTick()` here would result in the 'load' event always emitting
// before any other promise jobs.

DataHandler.prototype.load = async function load(key) {
  const hit = this._cache.get(url);
  if (hit !== undefined) {
    queueMicrotask(() => {
      this.emit('load', hit);
    });
    return;
  }

  const data = await fetchData(key);
  this._cache.set(url, data);
  this.emit('load', data);
};
```

## `require()`

This variable may appear to be global but is not. See [`require()`][].

## `setImmediate(callback[, ...args])`
<!-- YAML
added: v0.9.1
-->

<!-- type=global -->

[`setImmediate`][] is described in the [timers](timers.html) section.

## `setInterval(callback, delay[, ...args])`
<!-- YAML
added: v0.0.1
-->

<!-- type=global -->

[`setInterval`][] is described in the [timers](timers.html) section.

## `setTimeout(callback, delay[, ...args])`
<!-- YAML
added: v0.0.1
-->

<!-- type=global -->

[`setTimeout`][] is described in the [timers](timers.html) section.

## `TextDecoder`
<!-- YAML
added: v11.0.0
-->

<!-- type=global -->

The WHATWG `TextDecoder` class. See the [`TextDecoder`][] section.

## `TextEncoder`
<!-- YAML
added: v11.0.0
-->

<!-- type=global -->

The WHATWG `TextEncoder` class. See the [`TextEncoder`][] section.

## `URL`
<!-- YAML
added: v10.0.0
-->

<!-- type=global -->

Die Klasse WHATWG `URL`. Siehe Abschnitt [`URL`][].

## `URLSearchParams`
<!-- YAML
added: v10.0.0
-->

<!-- type=global -->

Die Klasse WHATWG `URLSearchParams`. Siehe Abschnitt [`URLSearchParams`][].

## `WebAssembly`
<!-- YAML
added: v8.0.0
-->

<!-- type=global -->

* {Object}

The object that acts as the namespace for all W3C [WebAssembly](https://webassembly.org) related functionality. See the [Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/WebAssembly) for usage and compatibility.
