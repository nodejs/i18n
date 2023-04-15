# Objetos Globales

<!--introduced_in=v0.10.0-->

<!-- type=misc -->

Estos objetos están disponibles en todos los módulos. The following variables may appear to be global but are not. They exist only in the scope of modules, see the [module system documentation](modules.html):

* [`__dirname`][]
* [`__filename`][]
* [`exports`][]
* [`module`][]
* [`require()`][]

Los objetos listados aquí son específicos para Node.js. Hay un número de [objetos-complemento](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects) que forman parte del lenguaje de JavaScript en sí mismo, y pueden ser accedidos de manera global.

## Clase: Buffer

<!-- YAML
added: v0.1.103
-->

<!-- type=global -->

* {Function}

Es utilizada para manejar datos binarios. Consulte la [sección de búfer](buffer.html).

## \_\_dirname

Esta variable puede parecer de alcance global, pero no lo es. Vea [`__dirname`].

## \_\_filename

Esta variable puede parecer de alcance global, pero no lo es. Vea [`__filename`].

## clearImmediate(immediateObject)

<!-- YAML
added: v0.9.1
-->

<!--type=global-->

[`clearImmediate`] es descrita en las sección de [temporizadores](timers.html).

## clearInterval(intervalObject)

<!-- YAML
added: v0.0.1
-->

<!--type=global-->

[`clearInterval`] es descrita en las sección de [temporizadores](timers.html).

## clearTimeout(timeoutObject)

<!-- YAML
added: v0.0.1
-->

<!--type=global-->

[`clearTimeout`] es descrita en las sección de [temporizadores](timers.html).

## console

<!-- YAML
added: v0.1.100
-->

<!-- type=global -->

* {Object}

Se utiliza para imprimir stdout y stderr. Consulte la sección de [`console`][].

## exportaciones

Esta variable puede parecer global, pero no lo es. Vea [`exports`].

## global

<!-- YAML
added: v0.1.27
-->

<!-- type=global -->

* {Object} El objeto del espacio de nombre global.

En los navegadores, el ámbito de máximo nivel es el ámbito global. This means that within the browser `var something` will define a new global variable. In Node.js this is different. The top-level scope is not the global scope; `var something` inside a Node.js module will be local to that module.

## módulo

Esta variable puede parecer global, pero no lo es. Vea [`module`].

## process

<!-- YAML
added: v0.1.7
-->

<!-- type=global -->

* {Object}

El objeto del proceso. Consulte la sección del [objeto de `process`][].

## require()

Esta variable puede parecer de alcance global, pero no lo es. Vea [`require()`].

## setImmediate(callback[, ...args])

<!-- YAML
added: v0.9.1
-->

<!-- type=global -->

[`setImmediate`] es descrita en las sección de [temporizadores](timers.html).

## setInterval(callback, delay[, ...args])

<!-- YAML
added: v0.0.1
-->

<!-- type=global -->

[`setInterval`] es descrita en las sección de [temporizadores](timers.html).

## setTimeout(callback, delay[, ...args])

<!-- YAML
added: v0.0.1
-->

<!-- type=global -->

[`setTimeout`] es descrita en las sección de [temporizadores](timers.html).

## URL

<!-- YAML
added: v10.0.0
-->

<!-- type=global -->

La clase WHATWG `URL`. Consulte la sección [`URL`][].

## URLSearchParams

<!-- YAML
added: v10.0.0
-->

<!-- type=global -->

La clase WHATWG `URL`. Consulte la sección de [`URLSearchParams`][].

## WebAssembly

<!-- YAML
added: v8.0.0
-->

<!-- type=global -->

* {Object}

The object that acts as the namespace for all W3C [WebAssembly](https://webassembly.org) related functionality. See the [Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/WebAssembly) for usage and compatibility.