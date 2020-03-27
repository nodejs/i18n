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

Le module `cercle.js` a exporté les fonctions `aire()` et `circonference()`. Functions and objects are added to the root of a module by specifying additional properties on the special `exports` object.

Les variables locales au module seront privées, car le module est enveloppé dans une fonction par Node.js (voir [module wrapper](#modules_the_module_wrapper)). Dans cet exemple, la variable `PI` est une variable privée de `cercle.js`.

The `module.exports` property can be assigned a new value (such as a function or object).

Ci-dessous, `bar.js` utilise le module `carré`, qui exporte une classe Carré :

```js
const Carré = require('./carré.js');
const monCarré = new Carré(2);
console.log(`L'aire de monCarré est ${monCarré.aire()}`);
```

Le module `carré` est défini dans le fichier `carré.js` :

```js
// Assigning to exports will not modify module, must use module.exports
module.exports = class Square {
  constructor(width) {
    this.width = width;
  }

  area() {
    return this.width ** 2;
  }
};
```

Le système de module est implémenté dans le module `require('module')`.

## Accès au module principal

<!-- type=misc -->

Lorsqu’un fichier est exécuté directement par Node.js, son `module` est assigné à `require.main`. That means that it is possible to determine whether a file has been run directly by testing `require.main === module`.

Pour un fichier `foo.js`, cette comparaison renverra `true` si le fichier est exécuté via la commande `node foo.js`, `false` s'il est exécuté par `require('./foo')`.

Parce que `module` expose une propriété `filename` (normalement équivalente à `__filename`), le point d’entrée de l’application courante peut être obtenu en consultant la valeur de `require.main.filename`.

## Addenda : Astuces pour Gestionnaire de Paquets

<!-- type=misc -->

The semantics of the Node.js `require()` function were designed to be general enough to support reasonable directory structures. Package manager programs such as `dpkg`, `rpm`, and `npm` will hopefully find it possible to build native packages from Node.js modules without modification.

Ci-dessous une suggestion d'arborescence de répertoire qui pourrait fonctionner :

Disons que nous voudrions que le dossier situé à `/usr/lib/node/<some-package>/<some-version>` contienne une version spécifique d'un paquet.

Les paquets peuvent dépendre les uns des autres. In order to install package `foo`, it may be necessary to install a specific version of package `bar`. The `bar` package may itself have dependencies, and in some cases, these may even collide or form cyclic dependencies.

Puisque Node.js vérifie le `chemin d'accès réel` de tous les modules qu'il charge (autrement dit, résoud les liens symboliques), puis cherche leurs dépendances dans le dossier `node_modules` comme décrit [ici](#modules_loading_from_node_modules_folders), ce cas est très simple à résoudre avec l'architecture suivante :

* `/usr/lib/node/foo/1.2.3/`: Contents of the `foo` package, version 1.2.3.
* `/usr/lib/node/bar/4.3.2/`: Contents of the `bar` package that `foo` depends on.
* `/usr/lib/node/foo/1.2.3/node_modules/bar`: Symbolic link to `/usr/lib/node/bar/4.3.2/`.
* `/usr/lib/node/bar/4.3.2/node_modules/*`: Symbolic links to the packages that `bar` depends on.

Ainsi, même si un cycle est formé, ou s’il existe des conflits de dépendances, chaque module sera en mesure d’obtenir une version de sa dépendance qu’il pourra utiliser.

Quand le code dans le paquet `foo` appellera `require('bar')`, il obtiendra la version symboliquement liée via `/usr/lib/node/foo/1.2.3/node_modules/bar`. Ensuite, quand le code dans le paquet `bar` appellera `require('quux')`, il obtiendra la version symboliquement liée via `/usr/lib/node/bar/4.3.2/node_modules/quux`.

De plus, pour rendre le processus de résolution de module encore plus optimal, plutôt que de placer directement les packets dans `/usr/lib/node`, nous pourrions les mettre dans `/usr/lib/node_modules/<name>/<version>`. Ainsi Node.js ne perdra pas de temps à aller chercher les dépendances manquantes dans `/usr/node_modules` ou `/node_modules`.

Pour que les modules soient disponibles pour le REPL de Node.js, il pourrait également être utile d'ajouter le dossier `/usr/lib/node_modules` à la variable d'environnement `$NODE_PATH`. Comme les recherches de modules utilisant les dossiers `node_modules` sont toutes relatives, et basées sur le chemin d'accès réels des fichiers appelant `require()`, les paquets eux-mêmes peuvent se trouver n'importe où.

## Addenda: The `.mjs` extension

It is not possible to `require()` files that have the `.mjs` extension. Attempting to do so will throw [an error](errors.html#errors_err_require_esm). The `.mjs` extension is reserved for [ECMAScript Modules](esm.html) which cannot be loaded via `require()`. See [ECMAScript Modules](esm.html) for more details.

## En assemblant les pièces...

<!-- type=misc -->

Pour obtenir le nom de fichier exact qui sera chargé lorsque `require()` est appelée, utilisez la fonction `require.resolve()`.

Putting together all of the above, here is the high-level algorithm in pseudocode of what `require()` does:

```txt
require(X) depuis le module situé au chemin d'accès Y
1. Si X est un module de la bibliothèque de base,
   a. retourner le module de la biliothèque de base
   b. ARRET
2. Si X commence par '/'
   a. assigner à Y une valeur pointant vers la racine du système de fichiers
3. Si X commence par './' ou '/' ou '../'
   a. CHARGER_COMME_FICHIER(Y + X)
   b. LOAD_AS_DIRECTORY(Y + X)
   c. THROW "not found"
4. LOAD_SELF_REFERENCE(X, dirname(Y))
5. LOAD_NODE_MODULES(X, dirname(Y))
6. THROW "not found"

LOAD_AS_FILE(X)
1. Si X est un fichier, charger X comme texte JavaScript.  ARRET
2. Si X.js est un fichier, charger X.js comme texte JavaScript.  ARRET
3. Si X.json est un fichier, parser X.json vers un Objet JavaScript.  ARRET
4. Si X.node est un fichier, charger X.node comme une extension binaire.  STOP

LOAD_INDEX(X)
1. Si X/index.js est un fichier, charger X/index.js comme texte JavaScript.  ARRET
2. Si X/index.json est un fichier, parser X/index.json vers un Objet JavaScript. ARRET
3. Si X/index.node est un fichier, charger X/index.node comme une extension binaire.  STOP

LOAD_AS_DIRECTORY(X)
1. Si X/package.json est un fichier,
   a. Parser X/package.json, et chercher un champ "main".
   b. If "main" is a falsy value, GOTO 2.
   c. let M = X + (json main field)
   d. LOAD_AS_FILE(M)
   e. LOAD_INDEX(M)
   f. LOAD_INDEX(X) DEPRECATED
   g. THROW "not found"
2. LOAD_INDEX(X)

LOAD_NODE_MODULES(X, START)
1. let DIRS = NODE_MODULES_PATHS(START)
2. pour chaque DOSSIER de DOSSIERS :
   a. CHARGER_COMME_FICHIER(DOSSIER/X)
   b. LOAD_AS_DIRECTORY(DIR/X)

NODE_MODULES_PATHS(START)
1. soit SEGMENTS = separation_chemin(DEBUT)
2. soit I = nombre de SEGMENTS - 1
3. let DIRS = [GLOBAL_FOLDERS]
4. tant que I >= 0,
   a. si SEGMENTS[I] = "node_modules" CONTINUE
   b. DOSSIER = concaténation_chemin(SEGMENTS[0 .. I] + "node_modules")
   c. DOSSIERS = DOSSIERS + DOSSIER
   d. soit I = I - 1
5. return DIRS

LOAD_SELF_REFERENCE(X, START)
1. Find the closest package scope to START.
2. If no scope was found, return.
3. If the `package.json` has no "exports", return.
4. If the name in `package.json` isn't a prefix of X, throw "not found".
5. Otherwise, resolve the remainder of X relative to this package as if it
   was loaded via `LOAD_NODE_MODULES` with a name in `package.json`.
```

Node.js allows packages loaded via `LOAD_NODE_MODULES` to explicitly declare which file paths to expose and how they should be interpreted. This expands on the control packages already had using the `main` field.

With this feature enabled, the `LOAD_NODE_MODULES` changes are:

```txt
LOAD_NODE_MODULES(X, START)
1. let DIRS = NODE_MODULES_PATHS(START)
2. pour chaque DOSSIER de DOSSIERS :
   a. let FILE_PATH = RESOLVE_BARE_SPECIFIER(DIR, X)
   b. LOAD_AS_FILE(FILE_PATH)
   c. LOAD_AS_DIRECTORY(FILE_PATH)

RESOLVE_BARE_SPECIFIER(DIR, X)
1. Try to interpret X as a combination of name and subpath where the name
   may have a @scope/ prefix and the subpath begins with a slash (`/`).
2. If X matches this pattern and DIR/name/package.json is a file:
   a. Parse DIR/name/package.json, and look for "exports" field.
   b. If "exports" is null or undefined, GOTO 3.
   c. If "exports" is an object with some keys starting with "." and some keys
      not starting with ".", throw "invalid config".
   d. If "exports" is a string, or object with no keys starting with ".", treat
      it as having that value as its "." object property.
   e. If subpath is "." and "exports" does not have a "." entry, GOTO 3.
   f. Find the longest key in "exports" that the subpath starts with.
   g. If no such key can be found, throw "not found".
   h. let RESOLVED_URL =
        PACKAGE_EXPORTS_TARGET_RESOLVE(pathToFileURL(DIR/name), exports[key],
        subpath.slice(key.length), ["node", "require"]), as defined in the ESM
        resolver.
   i. return fileURLToPath(RESOLVED_URL)
3. return DIR/X
```

`"exports"` is only honored when loading a package "name" as defined above. Any `"exports"` values within nested directories and packages must be declared by the `package.json` responsible for the "name".

## Cache

<!--type=misc-->

Les modules sont mis en cache après leur premier chargement. This means (among other things) that every call to `require('foo')` will get exactly the same object returned, if it would resolve to the same file.

Provided `require.cache` is not modified, multiple calls to `require('foo')` will not cause the module code to be executed multiple times. This is an important feature. With it, "partially done" objects can be returned, thus allowing transitive dependencies to be loaded even when they would cause cycles.

To have a module execute code multiple times, export a function, and call that function.

### Mises en garde relatives à la mise en cache de modules

<!--type=misc-->

Les modules sont mis en cache sur la base du nom de fichier résolu. Since modules may resolve to a different filename based on the location of the calling module (loading from `node_modules` folders), it is not a *guarantee* that `require('foo')` will always return the exact same object, if it would resolve to different files.

De plus, sur les systèmes de fichiers ou d'exploitation insensibles à la casse, des chemins d'accès résolus différents peuvent pointer vers le même fichier, mais le cache les traitera tout de même comme des modules différents et rechargera le fichier plusieurs fois. Par exemple, `require('./foo')` et `require('./FOO')` renverront deux objets différents, que `./foo` et `./FOO` soient le même fichier ou non.

## Modules de la Bibliothèque de Base

<!--type=misc-->

Node.js comporte plusieurs modules compilés directement dans son exécutable. Ces modules sont décrits plus en détail ailleurs dans la présente documentation.

The core modules are defined within the Node.js source and are located in the `lib/` folder.

Les modules de la bibliothèque de base sont toujours chargés en priorité si leur identificateur est passé à `require()`. Par exemple, `require('http')` renverra toujours le module HTTP embarqué, même s'il existe un fichier portant ce nom.

## Cycles

<!--type=misc-->

Lorsque se produisent des appels circulaires à `require()`, un module peut ne pas avoir fini son exécution au moment où il est retourné.

Considérez cette situation :

`a.js` :

```js
console.log('démarrage de a');
exports.done = false;
const b = require('./b.js');
console.log('en a, b.done = %j', b.done);
exports.done = true;
console.log('a terminé');
```

`b.js` :

```js
console.log('démarrage de b');
exports.done = false;
const a = require('./a.js');
console.log('en b, a.done = %j', a.done);
exports.done = true;
console.log('b terminé');
```

`main.js`:

```js
console.log('démarrage de main');
const a = require('./a.js');
const b = require('./b.js');
console.log('en main, a.done = %j, b.done = %j', a.done, b.done);
```

Lorsque `main.js` charge `a.js`, alors `a.js` charge à son tour `b.js`. Arrrivé là, `b.js` essaie de charger `a.js`. In order to prevent an infinite loop, an **unfinished copy** of the `a.js` exports object is returned to the `b.js` module. `b.js` finit alors son chargement, et son objet `exports` est fourni au module `a.js`.

Lorsque `main.js` a chargé les deux modules, ils sont tous deux terminés. La sortie de ce programme serait donc :

```console
$ node main.js
démarrage de main
démarrage de a
démarrage de b
en b, a.done = false
b terminé
en a, b.done = true
a terminé
en main, a.done = true, b.done = true
```

Careful planning is required to allow cyclic module dependencies to work correctly within an application.

## File Modules

<!--type=misc-->

If the exact filename is not found, then Node.js will attempt to load the required filename with the added extensions: `.js`, `.json`, and finally `.node`.

`.js` files are interpreted as JavaScript text files, and `.json` files are parsed as JSON text files. `.node` files are interpreted as compiled addon modules loaded with `process.dlopen()`.

A required module prefixed with `'/'` is an absolute path to the file. For example, `require('/home/marco/foo.js')` will load the file at `/home/marco/foo.js`.

A required module prefixed with `'./'` is relative to the file calling `require()`. That is, `circle.js` must be in the same directory as `foo.js` for `require('./circle')` to find it.

Without a leading `'/'`, `'./'`, or `'../'` to indicate a file, the module must either be a core module or is loaded from a `node_modules` folder.

If the given path does not exist, `require()` will throw an [`Error`][] with its `code` property set to `'MODULE_NOT_FOUND'`.

## Folders as Modules

<!--type=misc-->

It is convenient to organize programs and libraries into self-contained directories, and then provide a single entry point to those directories. There are three ways in which a folder may be passed to `require()` as an argument.

The first is to create a `package.json` file in the root of the folder, which specifies a `main` module. An example `package.json` file might look like this:

```json
{ "name" : "some-library",
  "main" : "./lib/some-library.js" }
```

If this was in a folder at `./some-library`, then `require('./some-library')` would attempt to load `./some-library/lib/some-library.js`.

This is the extent of the awareness of `package.json` files within Node.js.

If there is no `package.json` file present in the directory, or if the `'main'` entry is missing or cannot be resolved, then Node.js will attempt to load an `index.js` or `index.node` file out of that directory. For example, if there was no `package.json` file in the above example, then `require('./some-library')` would attempt to load:

* `./some-library/index.js`
* `./some-library/index.node`

If these attempts fail, then Node.js will report the entire module as missing with the default error:

```txt
Error: Cannot find module 'some-library'
```

## Loading from `node_modules` Folders

<!--type=misc-->

If the module identifier passed to `require()` is not a [core](#modules_core_modules) module, and does not begin with `'/'`, `'../'`, or `'./'`, then Node.js starts at the parent directory of the current module, and adds `/node_modules`, and attempts to load the module from that location. Node.js will not append `node_modules` to a path already ending in `node_modules`.

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

`NODE_PATH` was originally created to support loading modules from varying paths before the current [module resolution](#modules_all_together) algorithm was defined.

`NODE_PATH` is still supported, but is less necessary now that the Node.js ecosystem has settled on a convention for locating dependent modules. Sometimes deployments that rely on `NODE_PATH` show surprising behavior when people are unaware that `NODE_PATH` must be set. Sometimes a module's dependencies change, causing a different version (or even a different module) to be loaded as the `NODE_PATH` is searched.

Additionally, Node.js will search in the following list of GLOBAL_FOLDERS:

* 1: `$HOME/.node_modules`
* 2: `$HOME/.node_libraries`
* 3: `$PREFIX/lib/node`

Where `$HOME` is the user's home directory, and `$PREFIX` is the Node.js configured `node_prefix`.

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

### `__dirname`
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

### `__filename`
<!-- YAML
added: v0.0.1
-->

<!-- type=var -->

* {string}

The file name of the current module. This is the current module file's absolute path with symlinks resolved.

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

### `exports`
<!-- YAML
added: v0.1.12
-->

<!-- type=var -->

* {Object}

A reference to the `module.exports` that is shorter to type. See the section about the [exports shortcut](#modules_exports_shortcut) for details on when to use `exports` and when to use `module.exports`.

### `module`
<!-- YAML
added: v0.1.16
-->

<!-- type=var -->

* {module}

A reference to the current module, see the section about the [`module` object][]. In particular, `module.exports` is used for defining what a module exports and makes available through `require()`.

### `require(id)`
<!-- YAML
added: v0.1.13
-->

<!-- type=var -->

* `id` {string} module name or path
* Returns: {any} exported module content

Used to import modules, `JSON`, and local files. Modules can be imported from `node_modules`. Local modules and JSON files can be imported using a relative path (e.g. `./`, `./foo`, `./bar/baz`, `../foo`) that will be resolved against the directory named by [`__dirname`][] (if defined) or the current working directory. The relative paths of POSIX style are resolved in an OS independent fashion, meaning that the examples above will work on Windows in the same way they would on Unix systems.

```js
// Importing a local module with a path relative to the `__dirname` or current
// working directory. (On Windows, this would resolve to .\path\myLocalModule.)
const myLocalModule = require('./path/myLocalModule');

// Importing a JSON file:
const jsonData = require('./path/filename.json');

// Importing a module from node_modules or Node.js built-in module:
const crypto = require('crypto');
```

#### `require.cache`
<!-- YAML
added: v0.3.0
-->

* {Object}

Modules are cached in this object when they are required. By deleting a key value from this object, the next `require` will reload the module. This does not apply to [native addons](addons.html), for which reloading will result in an error.

Adding or replacing entries is also possible. This cache is checked before native modules and if a name matching a native module is added to the cache, no require call is going to receive the native module anymore. Use with care!

#### `require.extensions`
<!-- YAML
added: v0.3.0
deprecated: v0.10.6
-->

> Stabilité : 0 - obsolète

* {Object}

Instruct `require` on how to handle certain file extensions.

Process files with the extension `.sjs` as `.js`:

```js
require.extensions['.sjs'] = require.extensions['.js'];
```

**Deprecated.** In the past, this list has been used to load non-JavaScript modules into Node.js by compiling them on-demand. However, in practice, there are much better ways to do this, such as loading modules via some other Node.js program, or compiling them to JavaScript ahead of time.

Avoid using `require.extensions`. Use could cause subtle bugs and resolving the extensions gets slower with each registered extension.

#### `require.main`
<!-- YAML
added: v0.1.17
-->

* {module}

The `Module` object representing the entry script loaded when the Node.js process launched. See ["Accessing the main module"](#modules_accessing_the_main_module).

In `entry.js` script:

```js
console.log(require.main);
```

```sh
node entry.js
```
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

#### `require.resolve(request[, options])`<!-- YAML
added: v0.3.0
changes:
  - version: v8.9.0
    pr-url: https://github.com/nodejs/node/pull/16397
    description: The `paths` option is now supported.
-->* `request` {string} The module path to resolve.
* `options` {Object}
  * `paths` {string[]} Paths to resolve module location from. If present, these paths are used instead of the default resolution paths, with the exception of [GLOBAL_FOLDERS](#modules_loading_from_the_global_folders) like `$HOME/.node_modules`, which are always included. Each of these paths is used as a starting point for the module resolution algorithm, meaning that the `node_modules` hierarchy is checked from this location.
* Retourne : {string}

Use the internal `require()` machinery to look up the location of a module, but rather than loading the module, just return the resolved filename.

##### `require.resolve.paths(request)`<!-- YAML
added: v8.9.0
-->* `request` {string} The module path whose lookup paths are being retrieved.
* Returns: {string[]|null}

Returns an array containing the paths searched during resolution of `request` or `null` if the `request` string references a core module, for example `http` or `fs`.

## The `module` Object<!-- YAML
added: v0.1.16
--><!-- type=var --><!-- name=module -->* {Object}

In each module, the `module` free variable is a reference to the object representing the current module. For convenience, `module.exports` is also accessible via the `exports` module-global. `module` is not actually a global but rather local to each module.

### `module.children`<!-- YAML
added: v0.1.16
-->* {module[]}

The module objects required for the first time by this one.

### `module.exports`
<!-- YAML
added: v0.1.16
-->

* {Object}

The `module.exports` object is created by the `Module` system. Sometimes this is not acceptable; many want their module to be an instance of some class. To do this, assign the desired export object to `module.exports`. Assigning the desired object to `exports` will simply rebind the local `exports` variable, which is probably not what is desired.

For example, suppose we were making a module called `a.js`:

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

Assignment to `module.exports` must be done immediately. It cannot be done in any callbacks. This does not work:

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

#### `exports` shortcut
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

### `module.filename`
<!-- YAML
added: v0.1.16
-->

* {string}

The fully resolved filename of the module.

### `module.id`<!-- YAML
added: v0.1.16
-->* {string}

The identifier for the module. Typically this is the fully resolved filename.

### `module.loaded`
<!-- YAML
added: v0.1.16
-->

* {boolean}

Whether or not the module is done loading, or is in the process of loading.

### `module.parent`
<!-- YAML
added: v0.1.16
-->

* {module}

The module that first required this one.

### `module.paths`<!-- YAML
added: v0.4.0
-->* {string[]}

The search paths for the module.

### `module.require(id)`<!-- YAML
added: v0.5.1
-->* `id` {string}
* Returns: {any} exported module content

The `module.require()` method provides a way to load a module as if `require()` was called from the original module.

In order to do this, it is necessary to get a reference to the `module` object. Since `require()` returns the `module.exports`, and the `module` is typically *only* available within a specific module's code, it must be explicitly exported in order to be used.

## The `Module` Object<!-- YAML
added: v0.3.7
-->* {Object}

Provides general utility methods when interacting with instances of `Module` — the `module` variable often seen in file modules. Accessed via `require('module')`.

### `module.builtinModules`<!-- YAML
added:
  - v9.3.0
  - v8.10.0
  - v6.13.0
-->* {string[]}

A list of the names of all modules provided by Node.js. Can be used to verify if a module is maintained by a third party or not.

`module` in this context isn't the same object that's provided by the [module wrapper](#modules_the_module_wrapper). To access it, require the `Module` module:

```js
const builtin = require('module').builtinModules;
```

### `module.createRequire(filename)`<!-- YAML
added: v12.2.0
-->* `filename` {string|URL} Filename to be used to construct the require function. Must be a file URL object, file URL string, or absolute path string.
* Returns: {require} Require function

```js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// sibling-module.js is a CommonJS module.
const siblingModule = require('./sibling-module');
```

### `module.createRequireFromPath(filename)`<!-- YAML
added: v10.12.0
deprecated: v12.2.0
-->> Stability: 0 - Deprecated: Please use [`createRequire()`][] instead.

* `filename` {string} Filename to be used to construct the relative require function.
* Returns: {require} Require function

```js
const { createRequireFromPath } = require('module');
const requireUtil = createRequireFromPath('../src/utils/');

// Require `../src/utils/some-tool`
requireUtil('./some-tool');
```

### `module.syncBuiltinESMExports()`<!-- YAML
added: v12.12.0
-->The `module.syncBuiltinESMExports()` method updates all the live bindings for builtin ES Modules to match the properties of the CommonJS exports. It does not add or remove exported names from the ES Modules.

```js
const fs = require('fs');
const { syncBuiltinESMExports } = require('module');

fs.readFile = null;

delete fs.readFileSync;

fs.newAPI = function newAPI() {
  // ...
};

syncBuiltinESMExports();

import('fs').then((esmFS) => {
  assert.strictEqual(esmFS.readFile, null);
  assert.strictEqual('readFileSync' in fs, true);
  assert.strictEqual(esmFS.newAPI, undefined);
});
```

## Source Map V3 Support<!-- YAML
added: v13.7.0
-->> Stabilité: 1 - Expérimental

Helpers for for interacting with the source map cache. This cache is populated when source map parsing is enabled and [source map include directives](https://sourcemaps.info/spec.html#h.lmz475t4mvbx) are found in a modules' footer.

To enable source map parsing, Node.js must be run with the flag [`--enable-source-maps`][], or with code coverage enabled by setting [`NODE_V8_COVERAGE=dir`][].

```js
const { findSourceMap, SourceMap } = require('module');
```

### `module.findSourceMap(path[, error])`<!-- YAML
added: v13.7.0
-->* `path` {string}
* `error` {Error}
* Returns: {module.SourceMap}

`path` is the resolved path for the file for which a corresponding source map should be fetched.

The `error` instance should be passed as the second parameter to `findSourceMap` in exceptional flows, e.g., when an overridden [`Error.prepareStackTrace(error, trace)`][] is invoked. Modules are not added to the module cache until they are successfully loaded, in these cases source maps will be associated with the `error` instance along with the `path`.

### Class: `module.SourceMap`
<!-- YAML
added: v13.7.0
-->

#### `new SourceMap(payload)`

* `payload` {Object}

Creates a new `sourceMap` instance.

`payload` is an object with keys matching the [Source Map V3 format](https://sourcemaps.info/spec.html#h.mofvlxcwqzej):

* `file`: {string}
* `version`: {number}
* `sources`: {string[]}
* `sourcesContent`: {string[]}
* `names`: {string[]}
* `mappings`: {string}
* `sourceRoot`: {string}

#### `sourceMap.payload`

* Returns: {Object}

Getter for the payload used to construct the [`SourceMap`][] instance.

#### `sourceMap.findEntry(lineNumber, columnNumber)`

* `lineNumber` {number}
* `columnNumber` {number}
* Returns: {Object}

Given a line number and column number in the generated source file, returns an object representing the position in the original file. The object returned consists of the following keys:

* generatedLine: {number}
* generatedColumn: {number}
* originalSource: {string}
* originalLine: {number}
* originalColumn: {number}
