# Globale Objekte

<!--introduced_in=v0.10.0-->

<!-- type=misc -->

Diese Objekte sind in jedem Modul verfügbar. The following variables may appear to be global but are not. They exist only in the scope of modules, see the [module system documentation](modules.html):

* [`__dirname`][]
* [`__filename`][]
* [`exports`][]
* [`module`][]
* [`require()`][]

The objects listed here are specific to Node.js. There are a number of [built-in objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects) that are part of the JavaScript language itself, which are also globally accessible.

## Class: Buffer

<!-- YAML
added: v0.1.103
-->

<!-- type=global -->

* {Function}

Verarbeitet binäre Daten. Siehe [Abschnitt Puffer](buffer.html).

## \_\_dirname

This variable may appear to be global but is not. See [`__dirname`].

## \_\_filename

This variable may appear to be global but is not. See [`__filename`].

## clearImmediate(immediateObject)

<!-- YAML
added: v0.9.1
-->

<!--type=global-->

[`clearImmediate`] wird im Abschnitt [timers](timers.html) beschrieben.

## clearInterval(intervalObject)

<!-- YAML
added: v0.0.1
-->

<!--type=global-->

[`clearInterval`] wird im Abschnitt [timers](timers.html) beschrieben.

## clearTimeout(timeoutObject)

<!-- YAML
added: v0.0.1
-->

<!--type=global-->

[`clearTimeout`] wird im Abschnitt [timers](timers.html) beschrieben.

## konsole

<!-- YAML
added: v0.1.100
-->

<!-- type=global -->

* {Object}

Wird zur Ausgabe mit stdout und stderr verwendet. Siehe Abschnitt [`console`][].

## exports

This variable may appear to be global but is not. See [`exports`].

## global

<!-- YAML
added: v0.1.27
-->

<!-- type=global -->

* {Object} Das globale namespace Objekt.

In Browsern, ist der Top-Level Bereich der globale Bereich. This means that within the browser `var something` will define a new global variable. In Node.js this is different. The top-level scope is not the global scope; `var something` inside a Node.js module will be local to that module.

## module

This variable may appear to be global but is not. See [`module`].

## prozess

<!-- YAML
added: v0.1.7
-->

<!-- type=global -->

* {Object}

Das Objekt Prozess. Siehe Abschnitt [`process` object][].

## require()

This variable may appear to be global but is not. See [`require()`].

## setImmediate(callback[, ...args])

<!-- YAML
added: v0.9.1
-->

<!-- type=global -->

[`setImmediate`] wird im Abschnitt [timers](timers.html) beschrieben.

## setInterval(callback, delay[, ...args])

<!-- YAML
added: v0.0.1
-->

<!-- type=global -->

[`setInterval`] wird im Abschnitt [timers](timers.html) beschrieben.

## setTimeout(callback, delay[, ...args])

<!-- YAML
added: v0.0.1
-->

<!-- type=global -->

[`setTimeout`] wird im Abschnitt [timers](timers.html) beschrieben.