# Moduli

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

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

Il modulo `circle.js` ha esportato le funzioni `area()` e `circumference()`. Functions and objects are added to the root of a module by specifying additional properties on the special `exports` object.

Le variabili locali assegnate al modulo saranno private, questo perché il modulo è sottoposto al wrapping all'interno di una funzione attraverso Node.js (vedi [wrapping di un modulo](#modules_the_module_wrapper)). In questo esempio, la variabile `PI` assegnata a `circle.js` è privata.

The `module.exports` property can be assigned a new value (such as a function or object).

Di seguito, `bar.js` fa uso del modulo `square`, che esporta una classe Square:

```js
const Square = require('./square.js');
const mySquare = new Square(2);
console.log(`The area of mySquare is ${mySquare.area()}`);
```

Il modulo `square` è definito all'interno di `square.js`:

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

Il sistema modulo è implementato nel modulo `require('module')`.

## Accesso al modulo principale

<!-- type=misc -->

Quando un file viene eseguito direttamente da Node.js, `require.main` è impostato sul suo `module`. That means that it is possible to determine whether a file has been run directly by testing `require.main === module`.

Per un file `foo.js`, il risultato sarà `true` se eseguito tramite `node foo.js`, ma `false` se eseguito tramite `require('./foo')`.

Poiché `module` fornisce una proprietà `filename` (normalmente equivalente a `__filename`), il punto di ingresso dell'applicazione attuale può essere ottenuto controllando `require.main.filename`.

## Aggiunta: Suggerimenti per il Package Manager

<!-- type=misc -->

The semantics of Node.js's `require()` function were designed to be general enough to support reasonable directory structures. Package manager programs such as `dpkg`, `rpm`, and `npm` will hopefully find it possible to build native packages from Node.js modules without modification.

Di seguito forniamo una directory structure consigliata che potrebbe funzionare:

Diciamo che volevamo che la cartella in `/usr/lib/node/<some-package>/<some-version>` contenesse una versione specifica di un pacchetto.

I pacchetti possono dipendere l'uno dall'altro. In order to install package `foo`, it may be necessary to install a specific version of package `bar`. The `bar` package may itself have dependencies, and in some cases, these may even collide or form cyclic dependencies.

Poiché Node.js cerca il `realpath` di tutti i moduli caricati (ovvero risolve i collegamenti simbolici), e successivamente cerca le loro dipendenze nelle cartelle `node_modules` come descritto [qui](#modules_loading_from_node_modules_folders), questa situazione è molto semplice da risolvere tramite la seguente architettura:

* `/usr/lib/node/foo/1.2.3/`: Contents of the `foo` package, version 1.2.3.
* `/usr/lib/node/bar/4.3.2/`: Contents of the `bar` package that `foo` depends on.
* `/usr/lib/node/foo/1.2.3/node_modules/bar`: Symbolic link to `/usr/lib/node/bar/4.3.2/`.
* `/usr/lib/node/bar/4.3.2/node_modules/*`: Symbolic links to the packages that `bar` depends on.

Quindi, anche se si incontra un ciclo oppure se ci sono conflitti di dipendenze, ogni modulo sarà in grado di ottenere una versione della propria dipendenza da poter utilizzare.

Quando il codice nel pacchetto `foo` esegue `require('bar')`, otterrà la versione che è simbolicamente collegata all'interno di `/usr/lib/node/foo/1.2.3/node_modules/bar`. Quindi, quando il codice nel pacchetto `bar` chiama `require('quux')`, otterrà la versione che è simbolicamente collegata all'interno di `/usr/lib/node/bar/4.3.2/node_modules/quux`.

Inoltre, per rendere il processo di ricerca dei moduli ancora più ottimale, piuttosto che mettere i pacchetti direttamente in `/usr/lib/node`, potremmo inserirli all'interno di `/usr/lib/node_modules/<name>/<version>`. Così Node.js non si preoccuperà di cercare le dipendenze mancanti all'interno di `/usr/node_modules` o di `/node_modules`.

Per rendere i moduli disponibili al REPL di Node.js, potrebbe essere utile aggiungere anche la cartella `/usr/lib/node_modules` alla variabile d'ambiente `$NODE_PATH`. Poiché le ricerche dei moduli utilizzando le cartelle `node_modules` sono tutte relative, e in base al real path (percorso reale) dei file che effettuano le chiamate a `require()`, i pacchetti stessi possono essere ovunque.

## Addenda: The `.mjs` extension

It is not possible to `require()` files that have the `.mjs` extension. Attempting to do so will throw [an error](errors.html#errors_err_require_esm). The `.mjs` extension is reserved for [ECMAScript Modules](esm.html) which cannot be loaded via `require()`. See [ECMAScript Modules](esm.html) for more details.

## Tutti Insieme...

<!-- type=misc -->

Per ottenere l'esatto filename che verrà caricato quando viene chiamato `require()`, utilizza la funzione `require.resolve()`.

Putting together all of the above, here is the high-level algorithm in pseudocode of what `require()` does:

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
   c. THROW "not found"
4. LOAD_SELF_REFERENCE(X, dirname(Y))
5. LOAD_NODE_MODULES(X, dirname(Y))
7. THROW "not found"

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
   b. If "main" is a falsy value, GOTO 2.
   c. let M = X + (json main field)
   d. LOAD_AS_FILE(M)
   e. LOAD_INDEX(M)
   f. LOAD_INDEX(X) DEPRECATED
   g. THROW "not found"
2. LOAD_INDEX(X)

LOAD_NODE_MODULES(X, START)
1. let DIRS = NODE_MODULES_PATHS(START)
2. per ogni DIR in DIRS:
   a. LOAD_AS_FILE(DIR/X)
   b. LOAD_AS_DIRECTORY(DIR/X)

NODE_MODULES_PATHS(START)
1. lascia PARTS = path split(START)
2. lascia I = count of PARTS - 1
3. let DIRS = [GLOBAL_FOLDERS]
4. mentre I >= 0,
   a. se PARTS[I] = "node_modules" CONTINUE
   b. DIR = path join(PARTS[0 .. I] + "node_modules")
   c. DIRS = DIRS + DIR
   d. lascia I = I - 1
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
2. per ogni DIR in DIRS:
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

## Caching

<!--type=misc-->

I moduli vengono memorizzati nella cache dopo il loro primo caricamento. This means (among other things) that every call to `require('foo')` will get exactly the same object returned, if it would resolve to the same file.

Provided `require.cache` is not modified, multiple calls to `require('foo')` will not cause the module code to be executed multiple times. This is an important feature. With it, "partially done" objects can be returned, thus allowing transitive dependencies to be loaded even when they would cause cycles.

To have a module execute code multiple times, export a function, and call that function.

### Avvertenze sul Caching dei Moduli

<!--type=misc-->

I moduli sono memorizzati nella cache in base al filename risolto. Since modules may resolve to a different filename based on the location of the calling module (loading from `node_modules` folders), it is not a *guarantee* that `require('foo')` will always return the exact same object, if it would resolve to different files.

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

Quando `main.js` carica `a.js`, di conseguenza a sua volta `a.js` carica `b.js`. A quel punto, `b.js` prova a caricare `a.js`. In order to prevent an infinite loop, an **unfinished copy** of the `a.js` exports object is returned to the `b.js` module. Dopo `b.js` termina il caricamento e il suo `exports` object viene fornito al modulo `a.js`.

Nel momento in cui `main.js` ha caricato entrambi i moduli, sono entrambi conclusi. L'output di questo programma sarebbe quindi:

```console
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

## I File Module

<!--type=misc-->

Se il filename esatto non viene trovato, Node.js tenterà di caricare il filename richiesto con le estensioni aggiunte: `.js`, `.json`, e infine `.node`.

I file `.js` sono interpretati come file JavaScript text ed i file `.json` sono analizzati (parsing) come file JSON text. `.node` files are interpreted as compiled addon modules loaded with `process.dlopen()`.

Un modulo richiesto con il prefisso `'/'` è un percorso assoluto verso il file. Ad esempio, `require('/home/marco/foo.js')` caricherà il file su `/home/marco/foo.js`.

Un modulo richiesto con il prefisso `'./'` è relativo al file che chiama `require()`. Cioè, `circle.js` deve essere nella stessa directory di `foo.js` per far sì che `require('./circle')` lo trovi.

Without a leading `'/'`, `'./'`, or `'../'` to indicate a file, the module must either be a core module or is loaded from a `node_modules` folder.

Se il percorso specificato non esiste, `require()` genererà un [`Error`][] con la sua proprietà `code` impostata su `'MODULE_NOT_FOUND'`.

## Cartelle come Moduli

<!--type=misc-->

It is convenient to organize programs and libraries into self-contained directories, and then provide a single entry point to those directories. Esistono tre modi in cui una cartella può essere passata a `require()` come un argomento.

Il primo è creare un file `package.json` nel root della cartella, che specifica un `main` module. An example `package.json` file might look like this:

```json
{ "name" : "some-library",
  "main" : "./lib/some-library.js" }
```

Se questo era in una cartella all'interno di `./some-library`, allora `require('./some-library')` avrebbe tentato di caricare `./some-library/lib/some-library.js`.

Questo è il grado di consapevolezza di Node.js riguardo i file `package.json`.

If there is no `package.json` file present in the directory, or if the `'main'` entry is missing or cannot be resolved, then Node.js will attempt to load an `index.js` or `index.node` file out of that directory. For example, if there was no `package.json` file in the above example, then `require('./some-library')` would attempt to load:

* `./some-library/index.js`
* `./some-library/index.node`

If these attempts fail, then Node.js will report the entire module as missing with the default error:

```txt
Errore: Impossibile trovare il modulo 'some-library'
```

## Caricamento dalle cartelle `node_modules`

<!--type=misc-->

Se l'identificatore del modulo passato a `require()` non è un [core](#modules_core_modules) module, e non inizia con `'/'`, `'../'` o `'./'`, allora Node.js inizia nella parent directory del modulo attuale, e aggiunge `/node_modules`, tentando di caricare il modulo da quella posizione. Node.js will not append `node_modules` to a path already ending in `node_modules`.

Se non viene trovato lì, allora passa alla parent directory e così via fino a raggiungere il root del file system.

Ad esempio, se il file all'interno di `'/home/ry/projects/foo.js'` ha chiamato `require('bar.js')`, allora Node.js cercherà nelle seguenti posizioni, in quest'ordine:

* `/home/ry/projects/node_modules/bar.js`
* `/home/ry/node_modules/bar.js`
* `/home/node_modules/bar.js`
* `/node_modules/bar.js`

Ciò consente ai programmi di localizzare le loro dipendenze, in modo che non entrino in conflitto.

It is possible to require specific files or sub modules distributed with a module by including a path suffix after the module name. Ad esempio `require('example-module/path/to/file')` risolverà `path/to/file` in relazione a dove si trova `example-module`. Il percorso con il suffisso segue la stessa semantica di risoluzione del modulo.

## Caricamento dalle cartelle globali

<!-- type=misc -->

Se la variabile di ambiente `NODE_PATH` è impostata su un elenco delimitato da due punti di percorsi assoluti, allora Node.js cercherà quei percorsi per i moduli se non vengono trovati da nessuna parte.

Su Windows, `NODE_PATH` è delimitato da punti e virgola (`;`) anziché da due punti.

`NODE_PATH` was originally created to support loading modules from varying paths before the current [module resolution](#modules_all_together) algorithm was defined.

`NODE_PATH` è ancora supportato, ma è meno necessario ora che l'ecosistema Node.js ha stabilito una convenzione per la localizzazione dei moduli dipendenti. A volte le distribuzioni che si basano su `NODE_PATH` mostrano comportamenti sorprendenti quando le persone non sanno che `NODE_PATH` deve essere impostato. A volte le dipendenze di un modulo cambiano, causando il caricamento di una versione diversa (o anche di un modulo diverso) durante la ricerca di `NODE_PATH`.

Additionally, Node.js will search in the following list of GLOBAL_FOLDERS:

* 1: `$HOME/.node_modules`
* 2: `$HOME/.node_libraries`
* 3: `$PREFIX/lib/node`

Dove `$HOME` è la home directory dell'utente e `$PREFIX` è il `node_prefix` configurato da Node.js.

Queste sono per lo più per ragioni cronologiche.

It is strongly encouraged to place dependencies in the local `node_modules` folder. Queste verranno caricate più velocemente e in modo più affidabile.

## Il wrapping di un modulo

<!-- type=misc -->

Prima che venga eseguito il codice di un modulo, Node.js lo sottoporrà al wrapping con una funzione wrapper simile alla seguente:

```js
(function(exports, require, module, __filename, __dirname) {
// Il codice del modulo di fatto vive qui
});
```

In questo modo, Node.js realizza alcune cose:

* Mantiene le variabili top-level (definite con `var`, `const` o `let`) nello scope del modulo anziché nel global object.
* Aiuta a fornire alcune variabili di tipo globale ma che in realtà sono specifiche per il modulo, come ad esempio:
  * Gli object `module` ed `exports` che l'implementor può utilizzare per esportare i valori dal modulo.
  * Le variabili convenienti `__filename` e `__dirname`, contenenti il filename assoluto ed il percorso della directory del modulo.

## Lo scope di un modulo

### `__dirname`
<!-- YAML
added: v0.1.27
-->

<!-- type=var -->

* {string}

Il nome della directory del modulo attuale. This is the same as the [`path.dirname()`][] of the [`__filename`][].

Esempio: esecuzione di `node example.js` da `/Users/mjr`

```js
console.log(__dirname);
// Stampa: /Users/mjr
console.log(path.dirname(__filename));
// Stampa: /Users/mjr
```

### `__filename`
<!-- YAML
added: v0.0.1
-->

<!-- type=var -->

* {string}

Il filename del modulo attuale. This is the current module file's absolute path with symlinks resolved.

Per un programma principale questo non è necessariamente uguale al filename usato nella command line.

Vedi [`__dirname`][] per il nome della directory dell'attuale modulo.

Esempi:

Esecuzione di `node example.js` da `/Users/mjr`

```js
console.log(__filename);
// Stampa: /Users/mjr/example.js
console.log(__dirname);
// Stampa: /Users/mjr
```

Dati due moduli: `a` e `b`, dove `b` è una dipendenza di `a` e c'è una directory structure di:

* `/Users/mjr/app/a.js`
* `/Users/mjr/app/node_modules/b/b.js`

I riferimenti a `__filename` all'interno di `b.js` restituiranno `/Users/mjr/app/node_modules/b/b.js` mentre i riferimenti a `__filename` all'interno di `a.js` restituiranno `/Users/mjr/app/a.js`.

### `export`
<!-- YAML
added: v0.1.12
-->

<!-- type=var -->

* {Object}

Un riferimento a `module.exports` più facile da digitare. See the section about the [exports shortcut](#modules_exports_shortcut) for details on when to use `exports` and when to use `module.exports`.

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

Used to import modules, `JSON`, and local files. Modules can be imported from `node_modules`. Local modules and JSON files can be imported using a relative path (e.g. `./`, `./foo`, `./bar/baz`, `../foo`) that will be resolved against the directory named by [`__dirname`][] (if defined) or the current working directory.

```js
// Importing a local module:
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

I moduli vengono sottoposti al caching all'interno di quest'object quando sono richiesti. Eliminando un valore chiave (key value) da quest'object, il prossimo `require` ricaricherà il modulo. This does not apply to [native addons](addons.html), for which reloading will result in an error.

Adding or replacing entries is also possible. This cache is checked before native modules and if a name matching a native module is added to the cache, no require call is going to receive the native module anymore. Use with care!

#### `require.extensions`
<!-- YAML
added: v0.3.0
deprecated: v0.10.6
-->

> Stabilità: 0 - Obsoleto

* {Object}

Dà istruzioni a `require` su come gestire determinate estensioni dei file.

Elabora i file con l'estensione `.sjs` come file `.js`:

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

The `Module` object representing the entry script loaded when the Node.js process launched. Vedi ["Accesso al modulo principale"](#modules_accessing_the_main_module).

Nello script `entry.js`:

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
-->* `request` {string} Il percorso del modulo da risolvere.
* `options` {Object}
  * `paths` {string[]} Percorsi dai quali risolvere la posizione dei moduli. If present, these paths are used instead of the default resolution paths, with the exception of [GLOBAL_FOLDERS](#modules_loading_from_the_global_folders) like `$HOME/.node_modules`, which are always included. Each of these paths is used as a starting point for the module resolution algorithm, meaning that the `node_modules` hierarchy is checked from this location.
* Restituisce: {string}

Utilizza il sistema `require()` interno per cercare la posizione di un modulo ma, anziché caricare il modulo, è sufficiente restituire il filename risolto.

##### `require.resolve.paths(request)`<!-- YAML
added: v8.9.0
-->* `request` {string} Il percorso del modulo da cui vengono recuperati i percorsi di ricerca.
* Returns: {string[]|null}

Returns an array containing the paths searched during resolution of `request` or `null` if the `request` string references a core module, for example `http` or `fs`.

## L'Object `module`<!-- YAML
added: v0.1.16
--><!-- type=var --><!-- name=module -->* {Object}

In ogni modulo, la variabile libera `module` è un riferimento all'object che rappresenta il modulo attuale. Per comodità, `module.exports` è accessibile anche tramite il modulo globale `exports`. `module` in realtà è più propriamente locale per ogni modulo, non globale.

### `module.children`<!-- YAML
added: v0.1.16
-->* {module[]}

The module objects required for the first time by this one.

### `module.exports`
<!-- YAML
added: v0.1.16
-->

* {Object}

The `module.exports` object is created by the `Module` system. A volte questo non è accettabile; molti vogliono che il loro modulo sia un'istanza di qualche classe. Per fare ciò, assegna l'object di esportazione desiderato a `module.exports`. Assigning the desired object to `exports` will simply rebind the local `exports` variable, which is probably not what is desired.

For example, suppose we were making a module called `a.js`:

```js
const EventEmitter = require('events');

module.exports = new EventEmitter();

// Fai un pò di lavoro, e dopo un po' di tempo emetti
// l'evento 'ready' dal modulo stesso.
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

Assignment to `module.exports` must be done immediately. Non può essere eseguita in qualsiasi callback. Questo non funziona:

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

La variabile `exports` è disponibile all'interno dello scope al livello del file di un modulo e gli viene assegnato il valore di `module.exports` prima che il modulo venga valutato.

Permette una scorciatoia, in modo che `module.exports.f = ...` possa essere scritto più comodamente come `exports.f = ...`. Tuttavia, tieni presente che, come qualsiasi variabile, se un nuovo valore viene assegnato a `exports`, non è più vincolato a `module.exports`:

```js
module.exports.hello = true; // Esportato da require del modulo
exports = { hello: false };  // Non esportato, solo disponibile nel modulo
```

When the `module.exports` property is being completely replaced by a new object, it is common to also reassign `exports`:
```js
module.exports = exports = function Constructor() {
  // ... ecc.
};
```

Per mostrare il comportamento, immagina questa implementazione ipotetica di `require()`, che è abbastanza simile a ciò che viene effettivamente fatto da `require()`:

```js
function require(/* ... */) {
  const module = { exports: {} };
  ((module, exports) => {
    // Codice del modulo qui. In questo esempio, definisci una funzione.
    function someFunc() {}
    exports = someFunc;
    // A questo punto, exports non è più una scorciatoia di module.exports, e     
    // questo modulo continuerà a esportare un object vuoto predefinito.
    module.exports = someFunc;
    // A questo punto, il modulo esporterà someFunc, invece di
    // un object predefinito.
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

L'identificatore per il modulo. In genere è filename completamente risolto.

### `module.loaded`
<!-- YAML
added: v0.1.16
-->

* {boolean}

Indipendentemente dal fatto che il modulo abbia completato il caricamento o sia in fase di caricamento.

### `module.parent`
<!-- YAML
added: v0.1.16
-->

* {module}

Il modulo che ha richiesto per primo questo modulo.

### `module.paths`<!-- YAML
added: v0.4.0
-->* {string[]}

I percorsi di ricerca per il modulo.

### `module.require(id)`<!-- YAML
added: v0.5.1
-->* `id` {string}
* Returns: {any} exported module content

The `module.require()` method provides a way to load a module as if `require()` was called from the original module.

In order to do this, it is necessary to get a reference to the `module` object. Since `require()` returns the `module.exports`, and the `module` is typically *only* available within a specific module's code, it must be explicitly exported in order to be used.

## L'Object `Module`<!-- YAML
added: v0.3.7
-->* {Object}

Fornisce metodi di utilità generale quando interagisce con istanze di `Module` — la variabile `module` che si vede spesso nei file module. Accesso effettuato tramite `require('module')`.

### `module.builtinModules`<!-- YAML
added:
  - v9.3.0
  - v8.10.0
  - v6.13.0
-->* {string[]}

Un elenco dei nomi di tutti i moduli forniti da Node.js. Can be used to verify if a module is maintained by a third party or not.

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
