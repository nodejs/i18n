# Moduli

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stabile

<!--name=module-->

Nel sistema modulo di Node.js, ogni file viene trattato come un modulo separato. Ad esempio, considera un file chiamato `foo.js`:

```js
const circle = require('./circle.js');
console.log(`The area of a circle of radius 4 is ${circle.area(4)}`);
```

Nella prima riga, `foo.js` carica il modulo `circle.js` che si trova nella stessa directory di `foo.js`.

Ecco i contenuti di `circle.js`:

```js
const { PI } = Math;

exports.area = (r) => PI * r ** 2;

exports.circumference = (r) => 2 * PI * r;
```

Il modulo `circle.js` ha esportato le funzioni `area()` e `circumference()`. Le funzioni e gli object vengono aggiunti al root di un modulo specificando le proprietà aggiuntive sullo special object `exports`.

Le variabili locali assegnate al modulo saranno private, questo perché il modulo è sottoposto al wrapping all'interno di una funzione attraverso Node.js (vedi [wrapping di un modulo](#modules_the_module_wrapper)). In questo esempio, la variabile `PI` assegnata a `circle.js` è privata.

Alla proprietà `module.exports` può essere assegnato un nuovo valore (come ad esempio una funzione oppure un object).

Di seguito, `bar.js` fa uso del modulo `square`, che esporta una classe Square:

```js
const Square = require('./square.js');
const mySquare = new Square(2);
console.log(`The area of mySquare is ${mySquare.area()}`);
```

Il modulo `square` è definito all'interno di `square.js`:

```js
// l'assegnazione ad exports non modificherà il modulo, va utilizzato module.exports
module.exports = class Square {
  constructor(width) {
    this.width = width;
  }

  area() {
    return this.width ** 2;
  }
};
```

Il sistema modulo è implementato nel modulo `require('module')`.

## Accesso al modulo principale

<!-- type=misc -->

Quando un file viene eseguito direttamente da Node.js, `require.main` è impostato sul suo `module`. Ciò significa che è possibile determinare se un file è stato eseguito direttamente testando `require.main === module`.

Per un file `foo.js`, il risultato sarà `true` se eseguito tramite `node foo.js`, ma `false` se eseguito tramite `require('./foo')`.

Poiché `module` fornisce una proprietà `filename` (normalmente equivalente a `__filename`), il punto di ingresso dell'applicazione attuale può essere ottenuto controllando `require.main.filename`.

## Aggiunta: Suggerimenti per il Package Manager

<!-- type=misc -->

La semantica della funzione `require()` di Node.js è stata progettata per essere abbastanza generica da supportare un numero ragionevole di directory structure. Si spera che i programmi di Package Manager come `dpkg`, `rpm`, e `npm` siano in grado di creare pacchetti nativi dai moduli Node.js senza modifiche.

Di seguito forniamo una directory structure consigliata che potrebbe funzionare:

Diciamo che volevamo che la cartella in `/usr/lib/node/<some-package>/<some-version>` contenesse una versione specifica di un pacchetto.

I pacchetti possono dipendere l'uno dall'altro. Per installare il pacchetto `foo`, potrebbe essere necessario installare una versione specifica del pacchetto `bar`. Il pacchetto `bar` può avere delle proprie dipendenze e, in alcuni casi, queste possono persino scontrarsi tra loro oppure formare dipendenze cicliche.

Poiché Node.js cerca il `realpath` di tutti i moduli caricati (ovvero risolve i collegamenti simbolici), e successivamente cerca le loro dipendenze nelle cartelle `node_modules` come descritto [qui](#modules_loading_from_node_modules_folders), questa situazione è molto semplice da risolvere tramite la seguente architettura:

* `/usr/lib/node/foo/1.2.3/` - Contenuto del pacchetto `foo`, versione 1.2.3.
* `/usr/lib/node/bar/4.3.2/` - Contenuto del pacchetto `bar` da cui dipende `foo`.
* `/usr/lib/node/foo/1.2.3/node_modules/bar` - Collegamento simbolico a `/usr/lib/node/bar/4.3.2/`.
* `/usr/lib/node/bar/4.3.2/node_modules/*` - Collegamenti simbolici ai pacchetti da cui dipende `bar`.

Quindi, anche se si incontra un ciclo oppure se ci sono conflitti di dipendenze, ogni modulo sarà in grado di ottenere una versione della propria dipendenza da poter utilizzare.

Quando il codice nel pacchetto `foo` esegue `require('bar')`, otterrà la versione che è simbolicamente collegata all'interno di `/usr/lib/node/foo/1.2.3/node_modules/bar`. Quindi, quando il codice nel pacchetto `bar` chiama `require('quux')`, otterrà la versione che è simbolicamente collegata all'interno di `/usr/lib/node/bar/4.3.2/node_modules/quux`.

Inoltre, per rendere il processo di ricerca dei moduli ancora più ottimale, piuttosto che mettere i pacchetti direttamente in `/usr/lib/node`, potremmo inserirli all'interno di `/usr/lib/node_modules/<name>/<version>`. Così Node.js non si preoccuperà di cercare le dipendenze mancanti all'interno di `/usr/node_modules` o di `/node_modules`.

Per rendere i moduli disponibili al REPL di Node.js, potrebbe essere utile aggiungere anche la cartella `/usr/lib/node_modules` alla variabile d'ambiente `$NODE_PATH`. Poiché le ricerche dei moduli utilizzando le cartelle `node_modules` sono tutte relative, e in base al real path (percorso reale) dei file che effettuano le chiamate a `require()`, i pacchetti stessi possono essere ovunque.

## Tutti Insieme...

<!-- type=misc -->

Per ottenere l'esatto filename che verrà caricato quando viene chiamato `require()`, utilizza la funzione `require.resolve()`.

Mettendo insieme tutto quel che è stato detto sopra, ecco l'algoritmo di alto livello in pseudocodice di ciò che fa `require.resolve()`:

```txt
require(X) dal modulo al path Y
1. Se X è un core module,
   a. restituisce il core module
   b. STOP
2. Se X inizia con '/'
   a. imposta Y come root del filesystem
3. Se X inizia con './' o '/' or '../'
   a. LOAD_AS_FILE(Y + X)
   b. LOAD_AS_DIRECTORY(Y + X)
4. LOAD_NODE_MODULES(X, dirname(Y))
5. THROW "not found"

LOAD_AS_FILE(X)

1. Se X è un file, carica X come JavaScript text.  STOP
2. Se X.js è un file, carica X.js come JavaScript text.  STOP
3. Se X.json è un file, analizza (parsing) X.json in cerca di un JavaScript Object.  STOP
4. Se X.node è un file, carica X.node come addon binario.  STOP

LOAD_INDEX(X)

1. Se X/index.js è un file, carica X/index.js come JavaScript text.  STOP
2. Se X/index.json è un file, analizza (parsing) X/index.json in cerca di un JavaScript object. STOP
3. Se X/index.node è un file, carica X/index.node come addon binario.  STOP

LOAD_AS_DIRECTORY(X)

1. Se X/package.json è un file,
   a. Analizza (parsing) X/package.json, e cerca il "main" field.
   b. lascia M = X + (json main field)
   c. LOAD_AS_FILE(M)
   d. LOAD_INDEX(M)
2. LOAD_INDEX(X)

LOAD_NODE_MODULES(X, START)

1. lascia DIRS=NODE_MODULES_PATHS(START)
2. per ogni DIR in DIRS:
   a. LOAD_AS_FILE(DIR/X)
   b. LOAD_AS_DIRECTORY(DIR/X)

NODE_MODULES_PATHS(START)

1. lascia PARTS = path split(START)
2. lascia I = count of PARTS - 1
3. lascia DIRS = []
4. mentre I >= 0,
   a. se PARTS[I] = "node_modules" CONTINUE
   b. DIR = path join(PARTS[0 .. I] + "node_modules")
   c. DIRS = DIRS + DIR
   d. lascia I = I - 1
5. restituisce DIRS
```

## Caching

<!--type=misc-->

I moduli vengono memorizzati nella cache dopo il loro primo caricamento. Ciò significa (tra le altre cose) che ogni chiamata a `require('foo')`, se si risolvesse nello stesso file, restituirebbe esattamente lo stesso object.

Chiamate multiple a `require('foo')` potrebbero non portare alla ripetuta esecuzione del codice del modulo. Questa è una caratteristica importante. Con essa, gli object "parzialmente completi" possono essere restituiti, consentendo così il caricamento delle dipendenze transitive anche quando avrebbero causato dei cicli.

Per fare in modo che un modulo esegua più volte il codice, esporta una funzione e chiamala.

### Avvertenze sul Caching dei Moduli

<!--type=misc-->

I moduli sono memorizzati nella cache in base al filename risolto. Poiché i moduli potrebbero essere risolti in un filename diverso in base alla posizione del modulo chiamante (eseguendo il caricamento dalle cartelle `node_modules`), se `require('foo')` si risolvesse in file diversi non è *garantito* che dia sempre lo stesso identico object.

Inoltre, sui file system o sui sistemi operativi case-insensitive (che non fanno distinzione tra maiuscole e minuscole), diversi filename risolti possono puntare allo stesso file, ma la cache li tratterà ancora come moduli diversi e ricaricherà il file più volte. Ad esempio, `require('./foo')` e `require('./FOO')` restituiscono due object diversi, indipendentemente dal fatto che `./foo` e `./FOO` siano lo stesso file.

## I Core Module

<!--type=misc-->

Node.js ha diversi moduli compilati nel binario. Questi moduli sono descritti in modo più dettagliato in un altro punto di questa documentazione.

I core module sono definiti nella sorgente (source) di Node.js e si trovano nella cartella `lib/`.

I core module vengono sempre caricati prima di tutti se il loro identificatore viene passato a `require()`. Ad esempio, `require('http')` restituirà sempre il modulo HTTP integrato, anche se esiste un file con quel nome.

## Cicli

<!--type=misc-->

Quando ci sono le chiamate circolari `require()`, un modulo potrebbe non aver completato l'esecuzione nel momento in cui viene restituito.

Considera questa situazione:

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

Quando `main.js` carica `a.js`, di conseguenza a sua volta `a.js` carica `b.js`. A quel punto, `b.js` prova a caricare `a.js`. Al fine di impedire un ciclo infinito, una **copia incompleta** dell'exports object `a.js` viene restituita al modulo `b.js`. Dopo `b.js` termina il caricamento e il suo `exports` object viene fornito al modulo `a.js`.

Nel momento in cui `main.js` ha caricato entrambi i moduli, sono entrambi conclusi. L'output di questo programma sarebbe quindi:

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

È necessaria un'attenta pianificazione per consentire alle dipendenze dei moduli ciclici di funzionare correttamente all'interno di un'applicazione.

## I File Module

<!--type=misc-->

Se il filename esatto non viene trovato, Node.js tenterà di caricare il filename richiesto con le estensioni aggiunte: `.js`, `.json`, e infine `.node`.

I file `.js` sono interpretati come file JavaScript text ed i file `.json` sono analizzati (parsing) come file JSON text. I file `.node` sono interpretati come degli addon module compilati caricati con `dlopen`.

Un modulo richiesto con il prefisso `'/'` è un percorso assoluto verso il file. Ad esempio, `require('/home/marco/foo.js')` caricherà il file su `/home/marco/foo.js`.

Un modulo richiesto con il prefisso `'./'` è relativo al file che chiama `require()`. Cioè, `circle.js` deve essere nella stessa directory di `foo.js` per far sì che `require('./circle')` lo trovi.

Senza un prefisso `'/'`, `'./'`, o `'../'` per indicare un file, il modulo deve essere un core module oppure deve essere caricato da una cartella `node_modules`.

Se il percorso specificato non esiste, `require()` genererà un [`Error`][] con la sua proprietà `code` impostata su `'MODULE_NOT_FOUND'`.

## Cartelle come Moduli

<!--type=misc-->

È conveniente organizzare programmi e librerie in directory autonome e quindi fornire un singolo punto di accesso alla libreria. Esistono tre modi in cui una cartella può essere passata a `require()` come un argomento.

Il primo è creare un file `package.json` nel root della cartella, che specifica un `main` module. Un esempio di file `package.json` potrebbe essere il seguente:

```json
{ "name" : "some-library",
  "main" : "./lib/some-library.js" }
```

Se questo era in una cartella all'interno di `./some-library`, allora `require('./some-library')` avrebbe tentato di caricare `./some-library/lib/some-library.js`.

Questo è il grado di consapevolezza di Node.js riguardo i file `package.json`.

Se manca il file specificato dalla voce `'main'` di `package.json` e non può essere risolto, Node.js segnalerà l'intero modulo come mancante con l'errore predefinito:

```txt
Errore: Impossibile trovare il modulo 'some-library'
```

Se non c'è nessun file `package.json` nella directory, allora Node.js tenterà di caricare un file `index.js` o un file `index.node` al di fuori di quella directory. Ad esempio, se non c'era un file `package.json` nell'esempio precedente, allora `require('./some-library')` avrebbe tentato di caricare:

* `./some-library/index.js`
* `./some-library/index.node`

## Caricamento dalle cartelle `node_modules`

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