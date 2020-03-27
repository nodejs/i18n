# Objets Globaux

<!--introduced_in=v0.10.0-->
<!-- type=misc -->

Ces objets sont disponibles dans tous les modules. Les variables suivantes peuvent apparaître comme globales mais ne sont pas. Elles n’existent que dans la portée des modules, voir la [documentation du système de module](modules.html) :

- [`__dirname`][]
- [`__filename`][]
- [`exports`][]
- [`module`][]
- [`require()`][]

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

Dans les navigateurs, la portée la plus haute est la portée globale. Cela signifie que dans le navigateur `var quelqueChose` définira une nouvelle variable globale. Dans Node.js cela fonctionne différemment. La portée la plus haute n'est pas la portée globale; `var quelqueChose` au sein d'un module Node.js sera local à ce module.

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
