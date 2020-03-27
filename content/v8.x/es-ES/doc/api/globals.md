# Objetos Globales

<!--introduced_in=v0.10.0-->
<!-- type=misc -->

Estos objetos están disponibles en todos los módulos. Las siguientes variables pueden parecer globales, pero no lo son. Existen solo en el ámbito de los módulos, vea la [documentación del sistema de módulo](modules.html):

- [`__dirname`][]
- [`__filename`][]
- [`exports`][]
- [`module`][]
- [`require()`][]

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

Esta variable puede parecer de alcance global, pero no lo es. Vea [`exports`].

## global
<!-- YAML
added: v0.1.27
-->

<!-- type=global -->

* {Objeto} el objeto del espacio de nombre global.

En los navegadores, el ámbito de nivel superior es el ámbito global. Esto significa que dentro del navegador, `var something` definirá una nueva variable global. En Node.js esto es diferente. El ámbito de nivel más alto no es el ámbito global; dentro de un módulo de Node.js, `var something` se ubicará de manera local en relación a ese módulo.

## módulo

Esta variable puede parecer de alcance global, pero no lo es. Vea [`module`].

## process
<!-- YAML
added: v0.1.7
-->

<!-- type=global -->

* {Objeto}

El objeto del proceso. Consulte la sección de [objeto de `proceso`][].

## require()

Esta variable puede parecer de alcance global, pero no lo es. Vea [`require()`].

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
