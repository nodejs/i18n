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

Esta variable puede parecer de alcance global, pero no lo es. Ver [`__filename`].

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

[`clearInterval`] se describe en la sección [contadores de tiempo](timers.html).

## clearTimeout(timeoutObject)

<!-- YAML
added: v0.0.1
-->

<!--type=global-->

[`clearTimeout`] se describe en la sección [contadores de tiempo](timers.html).

## console

<!-- YAML
added: v0.1.100
-->

<!-- type=global -->

* {Object}

Utilizado para imprimir a stdout y stderr. Consulte la sección de [] [`consola`].

## exports

Esta variable puede parecer de alcance global, pero no lo es. Ver [`exports`].

## global

<!-- YAML
added: v0.1.27
-->

<!-- type=global -->

* {Objeto} el objeto del espacio de nombre global.

En los navegadores, el ámbito de nivel superior es el ámbito global. Esto significa que dentro del navegador de `var algo` va a definir una nueva variable global. En Node.js esto es diferente. El ámbito de nivel superior no es el ámbito global; `var algo` dentro un módulo de Node.js tendrá alcance local a dicho módulo.

## module

Esta variable puede parecer de alcance global, pero no lo es. Ver [`module`].

## process

<!-- YAML
added: v0.1.7
-->

<!-- type=global -->

* {Object}

El objeto del proceso. Consulte la sección de [objeto de `proceso`][].

## require()

Esta variable puede parecer de alcance global, pero no lo es. Ver [`require()`].

## setImmediate(callback[, ...args])

<!-- YAML
added: v0.9.1
-->

<!-- type=global -->

[`setImmediate`] se describe en la sección [contadores de tiempo](timers.html).

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

[`setTimeout`] se describe en la sección [contadores de tiempo](timers.html).

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