# Modules

<!--introduced_in=v0.10.0-->

> Stabilité: 2 - stable

<!--name=module-->

Dans le système de module de Node.js, chaque fichier est traité comme un module séparé. Par exemple, considérez un fichier nommé `foo.js` :

```js
const cercle = require('./cercle.js');
console.log(`L'aire d'un cercle de rayon 4 est ${cercle.aire(4)}`);
```

Sur la première ligne, `foo.js` charge le module `cercle.js` qui se trouve dans le même répertoire que `foo.js`.

Voici le contenu de `cercle.js` :

```js
const { PI } = Math;

exports.aire = (r) => PI * r ** 2;

exports.circonference = (r) => 2 * PI * r;
```

Le module `cercle.js` a exporté les fonctions `aire()` et `circonference()`. Fonctions et objets sont ajoutés à la racine d’un module en ajoutant des propriétés à l’objet spécial `exports`.

Les variables locales au module seront privées, car le module est enveloppé dans une fonction par Node.js (voir [module wrapper](#modules_the_module_wrapper)). Dans cet exemple, la variable `PI` est une variable privée de `cercle.js`.

Il est possible d'assigner une nouvelle valeur à `module.exports` (telle qu'une fonction ou un objet).

Ci-dessous, `bar.js` utilise le module `carré`, qui exporte une classe Carré :

```js
const Carré = require('./carré.js');
const monCarré = new Carré(2);
console.log(`L'aire de monCarré est ${monCarré.aire()}`);
```

Le module `carré` est défini dans le fichier `carré.js` :

```js
// assigner à exports directement ne modifierait pas module, il est nécessaire de passer par module.exports
module.exports = class Carré{
  constructor(longueur) {
    this.longueur = longueur;
  }

  aire() {
    return this.longueur ** 2;
  }
};
```

Le système de module est implémenté dans le module `require('module')`.

## Accès au module principal

<!-- type=misc -->

Lorsqu’un fichier est exécuté directement par Node.js, son `module` est assigné à `require.main`. Cela signifie qu’il est possible de déterminer si un fichier est exécuté directement en testant que `require.main === module`.

Pour un fichier `foo.js`, cette comparaison renverra `true` si le fichier est exécuté via la commande `node foo.js`, `false` s'il est exécuté par `require('./foo')`.

Parce que `module` expose une propriété `filename` (normalement équivalente à `__filename`), le point d’entrée de l’application courante peut être obtenu en consultant la valeur de `require.main.filename`.

## Addenda : Astuces de Gestionnaire de Paquets

<!-- type=misc -->

La sémantique de la fonction `require()` de Node.js a été conçue de façon à être assez générale pour supporter plusieurs types raisonnables d'arborescence de répertoires. Nous espérons que les programmes de gestion de paquets tels que `dpkg`, `rpm`, et `npm` seront en mesure de générer des paquets natifs à partir de modules Node.js sans modification.

Ci-dessous une suggestion d'arborescence de répertoire qui pourrait fonctionner :

Disons que nous voudrions que le dossier situé à `/usr/lib/node/<some-package>/<some-version>` contienne une version spécifique d'un paquet.

Les paquets peuvent dépendre les uns des autres. Afin d’installer le paquet `foo`, il peut être nécessaire d’installer une version spécifique du paquet `bar`. Le paquet `bar` peut lui-même avoir des dépendances, et dans certains cas, elles pourraient même entrer en collision ou former des cycles de dépendances.

Puisque Node.js vérifie le `chemin d'accès réel` de tous les modules qu'il charge (autrement dit, résoud les liens symboliques), puis cherche leurs dépendances dans le dossier `node_modules` comme décrit [ici](#modules_loading_from_node_modules_folders), ce cas est très simple à résoudre avec l'architecture suivante :

* `/usr/lib/node/foo/1.2.3/` - contenu du paquet `foo`, version 1.2.3.
* `/usr/lib/node/bar/4.3.2/` - contenu du paquet `bar` dont `foo` dépend.
* `/usr/lib/node/foo/1.2.3/node_modules/bar` - lien symbolique vers `/usr/lib/node/bar/4.3.2/`.
* `/usr/lib/node/bar/4.3.2/node_modules/*` - liens symboliques vers les paquets dont `bar` dépend.

Ainsi, même si un cycle est formé, ou s’il existe des conflits de dépendances, chaque module sera en mesure d’obtenir une version de sa dépendance qu’il pourra utiliser.

Quand le code dans le paquet `foo` appellera `require('bar')`, il obtiendra la version symboliquement liée via `/usr/lib/node/foo/1.2.3/node_modules/bar`. Ensuite, quand le code dans le paquet `bar` appellera `require('quux')`, il obtiendra la version symboliquement liée via `/usr/lib/node/bar/4.3.2/node_modules/quux`.

De plus, pour rendre le processus de résolution de module encore plus optimal, plutôt que de placer directement les packets dans `/usr/lib/node`, nous pourrions les mettre dans `/usr/lib/node_modules/<name>/<version>`. Ainsi Node.js ne perdra pas de temps à aller chercher les dépendances manquantes dans `/usr/node_modules` ou `/node_modules`.

Pour que les modules soient disponibles pour le REPL de Node.js, il pourrait également être utile d'ajouter le dossier `/usr/lib/node_modules` à la variable d'environnement `$NODE_PATH`. Comme les recherches de modules utilisant les dossiers `node_modules` sont toutes relatives, et basées sur le chemin d'accès réels des fichiers appelant `require()`, les paquets eux-mêmes peuvent se trouver n'importe où.

## En assemblant les pièces...

<!-- type=misc -->

Pour obtenir le nom de fichier exact qui sera chargé lorsque `require()` est appelée, utilisez la fonction `require.resolve()`.

En rassemblant tout ce qui a été dit précédemment, voici l'algorithme général, en pseudocode, de ce que fait `require.resolve()` :

```txt
require(X) depuis le module situé au chemin d'accès Y
1. Si X est un module de la librairie de base,
   a. retourner le module de la biliothèque de base
   b. ARRET
2. Si X commence par '/'
   a. assigner à Y une valeur pointant vers la racine du système de fichiers
3. Si X commence par './' ou '/' ou '../'
   a. CHARGER_COMME_FICHIER(Y + X)
   b. CHARGER_COMME_DOSSIER(Y + X)
4. CHARGER_MODULES_NODE(X, nom_de_dossier(Y))
5. LEVER ERREUR "non trouvé"

CHARGER_COMME_FICHIER(X)

1. If X is a file, load X as JavaScript text.  STOP
2. If X.js is a file, load X.js as JavaScript text.  STOP
3. If X.json is a file, parse X.json to a JavaScript Object.  STOP
4. If X.node is a file, load X.node as binary addon.  STOP

LOAD_INDEX(X)

1. If X/index.js is a file, load X/index.js as JavaScript text.  STOP
2. If X/index.json is a file, parse X/index.json to a JavaScript object. STOP
3. If X/index.node is a file, load X/index.node as binary addon.  STOP

LOAD_AS_DIRECTORY(X)

1. If X/package.json is a file,
   a. Parse X/package.json, and look for "main" field.
   b. let M = X + (json main field)
   c. LOAD_AS_FILE(M)
   d. LOAD_INDEX(M)
2. LOAD_INDEX(X)

LOAD_NODE_MODULES(X, START)

1. let DIRS=NODE_MODULES_PATHS(START)
2. for each DIR in DIRS:
   a. LOAD_AS_FILE(DIR/X)
   b. LOAD_AS_DIRECTORY(DIR/X)

NODE_MODULES_PATHS(START)

1. let PARTS = path split(START)
2. let I = count of PARTS - 1
3. let DIRS = []
4. while I >= 0,
   a. if PARTS[I] = "node_modules" CONTINUE
   b. DIR = path join(PARTS[0 .. I] + "node_modules")
   c. DIRS = DIRS + DIR
   d. let I = I - 1
5. return DIRS
```

## Caching

<!--type=misc-->

Modules are cached after the first time they are loaded. This means (among other things) that every call to `require('foo')` will get exactly the same object returned, if it would resolve to the same file.

Multiple calls to `require('foo')` may not cause the module code to be executed multiple times. This is an important feature. With it, "partially done" objects can be returned, thus allowing transitive dependencies to be loaded even when they would cause cycles.

To have a module execute code multiple times, export a function, and call that function.

### Module Caching Caveats

<!--type=misc-->

Modules are cached based on their resolved filename. Since modules may resolve to a different filename based on the location of the calling module (loading from `node_modules` folders), it is not a *guarantee* that `require('foo')` will always return the exact same object, if it would resolve to different files.

Additionally, on case-insensitive file systems or operating systems, different resolved filenames can point to the same file, but the cache will still treat them as different modules and will reload the file multiple times. For example, `require('./foo')` and `require('./FOO')` return two different objects, irrespective of whether or not `./foo` and `./FOO` are the same file.

## Core Modules

<!--type=misc-->

Node.js has several modules compiled into the binary. These modules are described in greater detail elsewhere in this documentation.

The core modules are defined within Node.js's source and are located in the `lib/` folder.

Core modules are always preferentially loaded if their identifier is passed to `require()`. For instance, `require('http')` will always return the built in HTTP module, even if there is a file by that name.

## Cycles

<!--type=misc-->

When there are circular `require()` calls, a module might not have finished executing when it is returned.

Consider this situation:

`a.js`:

```js
console.log('a starting');
exports.done = false;
const b = require('./b.js');
console.log('in a, b.done = %j', b.done);
exports.done = true;
console.log('a done');
```

`b.js`:

```js
console.log('b starting');
exports.done = false;
const a = require('./a.js');
console.log('in b, a.done = %j', a.done);
exports.done = true;
console.log('b done');
```

`main.js`:

```js
console.log('main starting');
const a = require('./a.js');
const b = require('./b.js');
console.log('in main, a.done = %j, b.done = %j', a.done, b.done);
```

When `main.js` loads `a.js`, then `a.js` in turn loads `b.js`. At that point, `b.js` tries to load `a.js`. In order to prevent an infinite loop, an **unfinished copy** of the `a.js` exports object is returned to the `b.js` module. `b.js` then finishes loading, and its `exports` object is provided to the `a.js` module.

By the time `main.js` has loaded both modules, they're both finished. The output of this program would thus be:

```txt
$ node main.js
main starting
a starting
b starting
in b, a.done = false
b done
in a, b.done = true
a done
in main, a.done = true, b.done = true
```

Careful planning is required to allow cyclic module dependencies to work correctly within an application.

## File Modules

<!--type=misc-->

If the exact filename is not found, then Node.js will attempt to load the required filename with the added extensions: `.js`, `.json`, and finally `.node`.

`.js` files are interpreted as JavaScript text files, and `.json` files are parsed as JSON text files. `.node` files are interpreted as compiled addon modules loaded with `dlopen`.

A required module prefixed with `'/'` is an absolute path to the file. For example, `require('/home/marco/foo.js')` will load the file at `/home/marco/foo.js`.

A required module prefixed with `'./'` is relative to the file calling `require()`. That is, `circle.js` must be in the same directory as `foo.js` for `require('./circle')` to find it.

Without a leading `'/'`, `'./'`, or `'../'` to indicate a file, the module must either be a core module or is loaded from a `node_modules` folder.

If the given path does not exist, `require()` will throw an [`Error`][] with its `code` property set to `'MODULE_NOT_FOUND'`.

## Folders as Modules

<!--type=misc-->

It is convenient to organize programs and libraries into self-contained directories, and then provide a single entry point to that library. There are three ways in which a folder may be passed to `require()` as an argument.

The first is to create a `package.json` file in the root of the folder, which specifies a `main` module. An example `package.json` file might look like this:

```json
{ "name" : "some-library",
  "main" : "./lib/some-library.js" }
```

If this was in a folder at `./some-library`, then `require('./some-library')` would attempt to load `./some-library/lib/some-library.js`.

This is the extent of Node.js's awareness of `package.json` files.

If the file specified by the `'main'` entry of `package.json` is missing and can not be resolved, Node.js will report the entire module as missing with the default error:

```txt
Error: Cannot find module 'some-library'
```

If there is no `package.json` file present in the directory, then Node.js will attempt to load an `index.js` or `index.node` file out of that directory. For example, if there was no `package.json` file in the above example, then `require('./some-library')` would attempt to load:

* `./some-library/index.js`
* `./some-library/index.node`

## Loading from `node_modules` Folders

<!--type=misc-->

If the module identifier passed to `require()` is not a [core](#modules_core_modules) module, and does not begin with `'/'`, `'../'`, or `'./'`, then Node.js starts at the parent directory of the current module, and adds `/node_modules`, and attempts to load the module from that location. Node will not append `node_modules` to a path already ending in `node_modules`.

If it is not found there, then it moves to the parent directory, and so on, until the root of the file system is reached.

For example, if the file at `'/home/ry/projects/foo.js'` called `require('bar.js')`, then Node.js would look in the following locations, in this order:

* `/home/ry/projects/node_modules/bar.js`
* `/home/ry/node_modules/bar.js`
* `/home/node_modules/bar.js`
* `/node_modules/bar.js`

This allows programs to localize their dependencies, so that they do not clash.

It is possible to require specific files or sub modules distributed with a module by including a path suffix after the module name. For instance `require('example-module/path/to/file')` would resolve `path/to/file` relative to where `example-module` is located. The suffixed path follows the same module resolution semantics.

## Loading from the global folders

<!-- type=misc -->

If the `NODE_PATH` environment variable is set to a colon-delimited list of absolute paths, then Node.js will search those paths for modules if they are not found elsewhere.

On Windows, `NODE_PATH` is delimited by semicolons (`;`) instead of colons.

`NODE_PATH` was originally created to support loading modules from varying paths before the current [module resolution](#modules_all_together) algorithm was frozen.

`NODE_PATH` is still supported, but is less necessary now that the Node.js ecosystem has settled on a convention for locating dependent modules. Sometimes deployments that rely on `NODE_PATH` show surprising behavior when people are unaware that `NODE_PATH` must be set. Sometimes a module's dependencies change, causing a different version (or even a different module) to be loaded as the `NODE_PATH` is searched.

Additionally, Node.js will search in the following locations:

* 1: `$HOME/.node_modules`
* 2: `$HOME/.node_libraries`
* 3: `$PREFIX/lib/node`

Where `$HOME` is the user's home directory, and `$PREFIX` is Node.js's configured `node_prefix`.

These are mostly for historic reasons.

It is strongly encouraged to place dependencies in the local `node_modules` folder. These will be loaded faster, and more reliably.

## The module wrapper

<!-- type=misc -->

Before a module's code is executed, Node.js will wrap it with a function wrapper that looks like the following:

```js
(function(exports, require, module, __filename, __dirname) {
// Module code actually lives in here
});
```

By doing this, Node.js achieves a few things:

* It keeps top-level variables (defined with `var`, `const` or `let`) scoped to the module rather than the global object.
* It helps to provide some global-looking variables that are actually specific to the module, such as: 
  * The `module` and `exports` objects that the implementor can use to export values from the module.
  * The convenience variables `__filename` and `__dirname`, containing the module's absolute filename and directory path.

## The module scope

### \_\_dirname

<!-- YAML
added: v0.1.27
-->

<!-- type=var -->

* {string}

The directory name of the current module. This is the same as the [`path.dirname()`][] of the [`__filename`][].

Example: running `node example.js` from `/Users/mjr`

```js
console.log(__dirname);
// Prints: /Users/mjr
console.log(path.dirname(__filename));
// Prints: /Users/mjr
```

### \_\_filename

<!-- YAML
added: v0.0.1
-->

<!-- type=var -->

* {string}

The file name of the current module. This is the resolved absolute path of the current module file.

For a main program this is not necessarily the same as the file name used in the command line.

See [`__dirname`][] for the directory name of the current module.

Examples:

Running `node example.js` from `/Users/mjr`

```js
console.log(__filename);
// Prints: /Users/mjr/example.js
console.log(__dirname);
// Prints: /Users/mjr
```

Given two modules: `a` and `b`, where `b` is a dependency of `a` and there is a directory structure of:

* `/Users/mjr/app/a.js`
* `/Users/mjr/app/node_modules/b/b.js`

References to `__filename` within `b.js` will return `/Users/mjr/app/node_modules/b/b.js` while references to `__filename` within `a.js` will return `/Users/mjr/app/a.js`.

### exports

<!-- YAML
added: v0.1.12
-->

<!-- type=var -->

A reference to the `module.exports` that is shorter to type. See the section about the [exports shortcut](#modules_exports_shortcut) for details on when to use `exports` and when to use `module.exports`.

### module

<!-- YAML
added: v0.1.16
-->

<!-- type=var -->

* {Object}

A reference to the current module, see the section about the [`module` object][]. In particular, `module.exports` is used for defining what a module exports and makes available through `require()`.

### require()

<!-- YAML
added: v0.1.13
-->

<!-- type=var -->

* {Function}

To require modules.

#### require.cache

<!-- YAML
added: v0.3.0
-->

* {Object}

Modules are cached in this object when they are required. By deleting a key value from this object, the next `require` will reload the module. Note that this does not apply to [native addons](addons.html), for which reloading will result in an error.

#### require.extensions

<!-- YAML
added: v0.3.0
deprecated: v0.10.6
-->

> Stability: 0 - Deprecated

* {Object}

Instruct `require` on how to handle certain file extensions.

Process files with the extension `.sjs` as `.js`:

```js
require.extensions['.sjs'] = require.extensions['.js'];
```

**Deprecated** In the past, this list has been used to load non-JavaScript modules into Node.js by compiling them on-demand. However, in practice, there are much better ways to do this, such as loading modules via some other Node.js program, or compiling them to JavaScript ahead of time.

Since the module system is locked, this feature will probably never go away. However, it may have subtle bugs and complexities that are best left untouched.

Note that the number of file system operations that the module system has to perform in order to resolve a `require(...)` statement to a filename scales linearly with the number of registered extensions.

In other words, adding extensions slows down the module loader and should be discouraged.

#### require.main

<!-- YAML
added: v0.1.17
-->

* {Object}

The `Module` object representing the entry script loaded when the Node.js process launched. See ["Accessing the main module"](#modules_accessing_the_main_module).

In `entry.js` script:

```js
console.log(require.main);
```

```sh
node entry.js
```

<!-- eslint-skip -->

```js
Module {
  id: '.',
  exports: {},
  parent: null,
  filename: '/absolute/path/to/entry.js',
  loaded: false,
  children: [],
  paths:
   [ '/absolute/path/to/node_modules',
     '/absolute/path/node_modules',
     '/absolute/node_modules',
     '/node_modules' ] }
```

#### require.resolve(request[, options])

<!-- YAML
added: v0.3.0
changes:

  - version: v8.9.0
    pr-url: https://github.com/nodejs/node/pull/16397
    description: The `paths` option is now supported.
-->

* `request` {string} The module path to resolve.
* `options` {Object} 
  * `paths` {string[]} Paths to resolve module location from. If present, these paths are used instead of the default resolution paths. Note that each of these paths is used as a starting point for the module resolution algorithm, meaning that the `node_modules` hierarchy is checked from this location.
* Returns: {string}

Use the internal `require()` machinery to look up the location of a module, but rather than loading the module, just return the resolved filename.

#### require.resolve.paths(request)

<!-- YAML
added: v8.9.0
-->

* `request` {string} The module path whose lookup paths are being retrieved.
* Returns: {string[]|null}

Returns an array containing the paths searched during resolution of `request` or `null` if the `request` string references a core module, for example `http` or `fs`.

## The `module` Object

<!-- YAML
added: v0.1.16
-->

<!-- type=var -->

<!-- name=module -->

* {Object}

In each module, the `module` free variable is a reference to the object representing the current module. For convenience, `module.exports` is also accessible via the `exports` module-global. `module` is not actually a global but rather local to each module.

### module.children

<!-- YAML
added: v0.1.16
-->

* {module[]}

The module objects required by this one.

### module.exports

<!-- YAML
added: v0.1.16
-->

* {Object}

The `module.exports` object is created by the `Module` system. Sometimes this is not acceptable; many want their module to be an instance of some class. To do this, assign the desired export object to `module.exports`. Note that assigning the desired object to `exports` will simply rebind the local `exports` variable, which is probably not what is desired.

For example suppose we were making a module called `a.js`:

```js
const EventEmitter = require('events');

module.exports = new EventEmitter();

// Do some work, and after some time emit
// the 'ready' event from the module itself.
setTimeout(() => {
  module.exports.emit('ready');
}, 1000);
```

Then in another file we could do:

```js
const a = require('./a');
a.on('ready', () => {
  console.log('module "a" is ready');
});
```

Note that assignment to `module.exports` must be done immediately. It cannot be done in any callbacks. This does not work:

`x.js`:

```js
setTimeout(() => {
  module.exports = { a: 'hello' };
}, 0);
```

`y.js`:

```js
const x = require('./x');
console.log(x.a);
```

#### exports shortcut

<!-- YAML
added: v0.1.16
-->

The `exports` variable is available within a module's file-level scope, and is assigned the value of `module.exports` before the module is evaluated.

It allows a shortcut, so that `module.exports.f = ...` can be written more succinctly as `exports.f = ...`. However, be aware that like any variable, if a new value is assigned to `exports`, it is no longer bound to `module.exports`:

```js
module.exports.hello = true; // Exported from require of module
exports = { hello: false };  // Not exported, only available in the module
```

When the `module.exports` property is being completely replaced by a new object, it is common to also reassign `exports`:

<!-- eslint-disable func-name-matching -->

```js
module.exports = exports = function Constructor() {
  // ... etc.
};
```

To illustrate the behavior, imagine this hypothetical implementation of `require()`, which is quite similar to what is actually done by `require()`:

```js
function require(/* ... */) {
  const module = { exports: {} };
  ((module, exports) => {
    // Module code here. In this example, define a function.
    function someFunc() {}
    exports = someFunc;
    // At this point, exports is no longer a shortcut to module.exports, and
    // this module will still export an empty default object.
    module.exports = someFunc;
    // At this point, the module will now export someFunc, instead of the
    // default object.
  })(module, module.exports);
  return module.exports;
}
```

### module.filename

<!-- YAML
added: v0.1.16
-->

* {string}

The fully resolved filename to the module.

### module.id

<!-- YAML
added: v0.1.16
-->

* {string}

The identifier for the module. Typically this is the fully resolved filename.

### module.loaded

<!-- YAML
added: v0.1.16
-->

* {boolean}

Whether or not the module is done loading, or is in the process of loading.

### module.parent

<!-- YAML
added: v0.1.16
-->

* {module}

The module that first required this one.

### module.paths

<!-- YAML
added: v0.4.0
-->

* {string[]}

The search paths for the module.

### module.require(id)

<!-- YAML
added: v0.5.1
-->

* `id` {string}
* Returns: {Object} `module.exports` from the resolved module

The `module.require` method provides a way to load a module as if `require()` was called from the original module.

In order to do this, it is necessary to get a reference to the `module` object. Since `require()` returns the `module.exports`, and the `module` is typically *only* available within a specific module's code, it must be explicitly exported in order to be used.

## The `Module` Object

<!-- YAML
added: v0.3.7
-->

* {Object}

Provides general utility methods when interacting with instances of `Module` — the `module` variable often seen in file modules. Accessed via `require('module')`.

### module.builtinModules

<!-- YAML
added: v9.3.0
-->

* {string[]}

A list of the names of all modules provided by Node.js. Can be used to verify if a module is maintained by a third party or not.

Note that `module` in this context isn't the same object that's provided by the [module wrapper](#modules_the_module_wrapper). To access it, require the `Module` module:

```js
const builtin = require('module').builtinModules;
```