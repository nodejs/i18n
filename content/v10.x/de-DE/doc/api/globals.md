# Globale Objekte

<!--introduced_in=v0.10.0-->
<!-- type=misc -->

Diese Objekte sind in jedem Modul verfügbar. Die folgenden Variablen sehen zwar aus, als wären sie Global, aber das sind sie nicht. Sie existieren nur im Modul-bereich. Mehr Informationen darüber, sind in der [Modul-System Dokumentation](modules.html):

- [`__dirname`][]
- [`__filename`][]
- [`exports`][]
- [`module`][]
- [`require()`][]

The objects listed here are specific to Node.js. There are a number of [built-in objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects) that are part of the JavaScript language itself, which are also globally accessible.

## Class: Buffer
<!-- YAML
added: v0.1.103
-->

<!-- type=global -->

* {Function}

Verarbeitet binäre Daten. Siehe [Abschnitt Puffer](buffer.html).

## \_\_dirname

Die Variable sieht wie eine globale aus, ist es aber nicht. Siehe [`__dirname`].

## \_\_filename

Die Variable sieht wie eine globale aus, ist es aber nicht. Siehe [`__filename`].

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

Die Variable sieht wie eine globale aus, ist es aber nicht. Siehe [`exports`].

## global
<!-- YAML
added: v0.1.27
-->

<!-- type=global -->

* {Object} Das globale namespace Objekt.

In Browsern, ist der Top-Level Bereich der globale Bereich. Dies bedeutet, dass `var something` innerhalb des Browsers als neue globale Variable definiert wird. In Node.js ist dies anders. Der Top-Level Bereich ist nicht der Globale Bereich; `var something` wird innerhalb eines Node.js Moduls lokal sein.

## module

Die Variable sieht wie eine globale aus, ist es aber nicht. Siehe [`module`].

## prozess
<!-- YAML
added: v0.1.7
-->

<!-- type=global -->

* {Object}

Das Objekt Prozess. Siehe Abschnitt [`process` object][].

## require()

Die Variable sieht wie eine globale aus, ist es aber nicht. Siehe [`require()`].

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

## URL
<!-- YAML
added: v10.0.0
-->

<!-- type=global -->

The WHATWG `URL` class. See the [`URL`][] section.

## URLSearchParams
<!-- YAML
added: v10.0.0
-->

<!-- type=global -->

The WHATWG `URLSearchParams` class. See the [`URLSearchParams`][] section.

## WebAssembly
<!-- YAML
added: v8.0.0
-->

<!-- type=global -->

* {Object}

The object that acts as the namespace for all W3C [WebAssembly](https://webassembly.org) related functionality. See the [Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/WebAssembly) for usage and compatibility.
