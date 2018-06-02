# Objetos Globales

<!--introduced_in=v0.10.0-->

<!-- type=misc -->

Estos objetos están disponibles en todos los módulos. Las siguientes variables pueden parecer globales, pero no lo son. Existen sólo en el ámbito de los módulos, consulte la [documentación del sistema de módulo](modules.html):

* [`__dirname`][]
* [`__filename`][]
* [`exports`][]
* [`module`][]
* [`require()`][]

Los objetos listados aquí son específicos a Node.js. Son un numero de [ objetos embebidos ](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects) que forman parte del lenguaje JavaScript en si, y a la vez son accesibles globalmente.

## Clase: Buffer

<!-- YAML
added: v0.1.103
-->

<!-- type=global -->

* {Function}

Utilizado para manejar datos binarios. Ver la [sección de buffer](buffer.html).

## \_\_dirname

Esta variable puede parecer de alcance global, pero no lo es. Ver [`__dirname`].

## \_\_filename

Esta variable puede parecer de alcance global, pero no lo es. Ver [`__dirname`].

## clearImmediate(immediateObject)

<!-- YAML
added: v0.9.1
-->

<!--type=global-->

[`clearImmediate`] se describe en la sección [contadores de tiempo](timers.html).

## clearInterval(intervalObject)

<!-- YAML
added: v0.0.1
-->

<!--type=global-->

[`clearImmediate`] se describe en la sección [contadores de tiempo](timers.html).

## clearTimeout(timeoutObject)

<!-- YAML
added: v0.0.1
-->

<!--type=global-->

[`clearImmediate`] se describe en la sección [contadores de tiempo](timers.html).

## console

<!-- YAML
added: v0.1.100
-->

<!-- type=global -->

* {Objeto}

Utilizado para imprimir a stdout y stderr. Consulte la sección de [] [`consola`].

## exports

Esta variable puede parecer de alcance global, pero no lo es. Ver [`exports`].

## global

<!-- YAML
added: v0.1.27
-->

<!-- type=global -->

* {Object} The global namespace object.

In browsers, the top-level scope is the global scope. This means that within the browser `var something` will define a new global variable. In Node.js this is different. The top-level scope is not the global scope; `var something` inside a Node.js module will be local to that module.

## module

Esta variable puede parecer de alcance global, pero no lo es. See [`module`].

## process

<!-- YAML
added: v0.1.7
-->

<!-- type=global -->

* {Object}

The process object. See the [`process` object][] section.

## require()

This variable may appear to be global but is not. See [`require()`].

## setImmediate(callback[, ...args])

<!-- YAML
added: v0.9.1
-->

<!-- type=global -->

[`setImmediate`] is described in the [timers](timers.html) section.

## setInterval(callback, delay[, ...args])

<!-- YAML
added: v0.0.1
-->

<!-- type=global -->

[`setInterval`] se describe en la sección [contadores de tiempo](timers.html).

## setTimeout(callback, delay[, ...args])

<!-- YAML
added: v0.0.1
-->

<!-- type=global -->

[`setTimeout`] is described in the [timers](timers.html) section.

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