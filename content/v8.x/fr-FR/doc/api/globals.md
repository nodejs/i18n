# Objets Globaux

<!--introduced_in=v0.10.0-->

<!-- type=misc -->

Ces objets sont disponibles dans tous les modules. The following variables may appear to be global but are not. They exist only in the scope of modules, see the [module system documentation](modules.html):

* [`__dirname`][]
* [`__filename`][]
* [`exports`][]
* [`module`][]
* [`require()`][]

Les objets listés ici sont spécifiques à Node.js. There are a number of [built-in objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects) that are part of the JavaScript language itself, which are also globally accessible.

## Classe: Buffer

<!-- YAML
added: v0.1.103
-->

<!-- type=global -->

* {Function}

Utilisée pour gérer les données binaires. Voir la [section buffer](buffer.html).

## \_\_dirname

This variable may appear to be global but is not. See [`__dirname`].

## \_\_filename

This variable may appear to be global but is not. See [`__filename`].

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

This variable may appear to be global but is not. See [`exports`].

## global

<!-- YAML
added: v0.1.27
-->

<!-- type=global -->

* {Object} L'object correspondant à l'espace de nom global.

Dans les navigateurs, la portée la plus haute est la portée globale. This means that within the browser `var something` will define a new global variable. In Node.js this is different. The top-level scope is not the global scope; `var something` inside a Node.js module will be local to that module.

## module

This variable may appear to be global but is not. See [`module`].

## process

<!-- YAML
added: v0.1.7
-->

<!-- type=global -->

* {Object}

L'objet process. Voir la section [objet `process`][].

## require()

This variable may appear to be global but is not. See [`require()`].

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