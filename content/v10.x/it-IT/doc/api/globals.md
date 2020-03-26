# Object Globali

<!--introduced_in=v0.10.0-->

<!-- type=misc -->

Questi object sono disponibili in tutti i moduli. The following variables may appear to be global but are not. They exist only in the scope of modules, see the [module system documentation](modules.html):

* [`__dirname`][]
* [`__filename`][]
* [`exports`][]
* [`module`][]
* [`require()`][]

Gli object qui elencati sono specifici a Node.js. There are a number of [built-in objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects) that are part of the JavaScript language itself, which are also globally accessible.

## Class: Buffer

<!-- YAML
added: v0.1.103
-->

<!-- type=global -->

* {Function}

Utilizzato per gestire i dati binari. Visualizza la [sezione buffer](buffer.html).

## \_\_dirname

Questa variabile può sembrare globale ma non lo è. Visualizza [`__dirname`].

## \_\_filename

Questa variabile può sembrare globale ma non lo è. Visualizza [`__filename`].

## clearImmediate(immediateObject)

<!-- YAML
added: v0.9.1
-->

<!--type=global-->

[`clearImmediate`] è descritta nella sezione [timers](timers.html).

## clearInterval(intervalObject)

<!-- YAML
added: v0.0.1
-->

<!--type=global-->

[`clearInterval`] è descritto nella sezione [timers](timers.html).

## clearTimeout(timeoutObject)

<!-- YAML
added: v0.0.1
-->

<!--type=global-->

[`clearTimeout`] è descritto nella sezione [timers](timers.html).

## console

<!-- YAML
added: v0.1.100
-->

<!-- type=global -->

* {Object}

Utilizzato per la stampa su stdout e stderr. Visualizza la sezione [`console`][].

## export

Questa variabile può sembrare globale ma non lo è. Visualizza [`exports`].

## globale

<!-- YAML
added: v0.1.27
-->

<!-- type=global -->

* {Object} Il namespace object globale.

Nei browser, l'ambito principale è l'ambito globale. This means that within the browser `var something` will define a new global variable. In Node.js this is different. The top-level scope is not the global scope; `var something` inside a Node.js module will be local to that module.

## module

Questa variabile può sembrare globale ma non lo è. Visualizza [`module`].

## process

<!-- YAML
added: v0.1.7
-->

<!-- type=global -->

* {Object}

L'object del processo. Visualizza la sezione [object del `processo`][].

## require()

Questa variabile può sembrare globale ma non lo è. Visualizza [`require()`].

## setImmediate(callback[, ...args])

<!-- YAML
added: v0.9.1
-->

<!-- type=global -->

[`setImmediate`] è descritto nella sezione [timers](timers.html).

## setInterval(callback, delay[, ...args])

<!-- YAML
added: v0.0.1
-->

<!-- type=global -->

[`setInterval`] è descritto nella sezione [timers](timers.html).

## setTimeout(callback, delay[, ...args])

<!-- YAML
added: v0.0.1
-->

<!-- type=global -->

[`setTimeout`] è descritto nella sezione [timers](timers.html).

## URL

<!-- YAML
added: v10.0.0
-->

<!-- type=global -->

La classe di `URL` WHATWG. Visualizza la sezione [`URL`][].

## URLSearchParams

<!-- YAML
added: v10.0.0
-->

<!-- type=global -->

La classe di `URLSearchParams` WHATWG. Visualizza la sezione [`URLSearchParams`][].

## WebAssembly

<!-- YAML
added: v8.0.0
-->

<!-- type=global -->

* {Object}

The object that acts as the namespace for all W3C [WebAssembly](https://webassembly.org) related functionality. See the [Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/WebAssembly) for usage and compatibility.