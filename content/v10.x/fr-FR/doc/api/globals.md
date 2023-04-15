# Objets Globaux

<!--introduced_in=v0.10.0-->

<!-- type=misc -->

Ces objets sont disponibles dans tous les modules. The following variables may appear to be global but are not. They exist only in the scope of modules, see the [module system documentation](modules.html):

* [`__dirname`][]
* [`__filename`][]
* [`exports`][]
* [`module`][]
* [`require()`][]

Les objets listés ici sont spécifiques à Node.js. Il y a un certain nombre d' [objets built-in](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects) faisant partie du langage JavaScript lui-même, qui sont également accessibles globalement.

## Classe: Buffer

<!-- YAML
added: v0.1.103
-->

<!-- type=global -->

* {Function}

Utilisée pour gérer les données binaires. Voir la [section buffer](buffer.html).

## \_\_dirname

Cette variable peut sembler globale mais ne l'est pas. Voir [`__dirname`].

## \_\_filename

Cette variable peut sembler globale mais ne l'est pas. Voir [`__filename`].

## clearImmediate(immediateObject)

<!-- YAML
added: v0.9.1
-->

<!--type=global-->

[`clearImmediate`] est décrite dans la section [timers](timers.html).

## clearInterval(intervalObject)

<!-- YAML
added: v0.0.1
-->

<!--type=global-->

[`clearInterval`] est décrite dans la section [timers](timers.html).

## clearTimeout(timeoutObject)

<!-- YAML
added: v0.0.1
-->

<!--type=global-->

[`clearTimeout`] est décrite dans la section [timers](timers.html).

## console

<!-- YAML
added: v0.1.100
-->

<!-- type=global -->

* {Object}

Utilisé pour écrire vers stdout et stderr. Voir la section [`console`][].

## exports

Cette variable peut sembler globale mais ne l'est pas. Voir [`exports`].

## global

<!-- YAML
added: v0.1.27
-->

<!-- type=global -->

* {Object} L'object correspondant à l'espace de nom global.

Dans les navigateurs, la portée la plus haute est la portée globale. This means that within the browser `var something` will define a new global variable. In Node.js this is different. The top-level scope is not the global scope; `var something` inside a Node.js module will be local to that module.

## module

Cette variable peut sembler globale mais ne l'est pas. Voir [`module`].

## process

<!-- YAML
added: v0.1.7
-->

<!-- type=global -->

* {Object}

L'objet process. Voir la section [objet `process`][].

## require()

Cette variable peut sembler globale mais ne l'est pas. Voir [`require()`].

## setImmediate(callback[, ...args])

<!-- YAML
added: v0.9.1
-->

<!-- type=global -->

[`setImmediate`] est décrite dans la section [timers](timers.html).

## setInterval(callback, delay[, ...args])

<!-- YAML
added: v0.0.1
-->

<!-- type=global -->

[`setInterval`] est décrite dans la section [timers](timers.html).

## setTimeout(callback, delay[, ...args])

<!-- YAML
added: v0.0.1
-->

<!-- type=global -->

[`setTimeout`] est décrite dans la section [timers](timers.html).

## URL

<!-- YAML
added: v10.0.0
-->

<!-- type=global -->

La classe `URL` WHATWG. Voir la section [`URL`][].

## URLSearchParams

<!-- YAML
added: v10.0.0
-->

<!-- type=global -->

La classe `URLSearchParams` WHATWG. Voir la section [`URLSearchParams`][].

## WebAssembly

<!-- YAML
added: v8.0.0
-->

<!-- type=global -->

* {Object}

The object that acts as the namespace for all W3C [WebAssembly](https://webassembly.org) related functionality. See the [Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/WebAssembly) for usage and compatibility.