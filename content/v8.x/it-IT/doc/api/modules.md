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

Without a leading '/', './', or '../' to indicate a file, the module must either be a core module or is loaded from a `node_modules` folder.

Se il percorso specificato non esiste, `require()` genererà un [`Error`][] con la sua proprietà `code` impostata su `'MODULE_NOT_FOUND'`.

## Cartelle come Moduli

<!--type=misc-->

È conveniente organizzare programmi e librerie in directory autonome e quindi fornire un singolo punto di accesso alla libreria. Esistono tre modi in cui una cartella può essere passata a `require()` come un argomento.

Il primo è creare un file `package.json` nel root della cartella, che specifica un `main` module. Un esempio di file package.json potrebbe essere il seguente:

```json
{ "name" : "some-library",
  "main" : "./lib/some-library.js" }
```

Se questo era in una cartella all'interno di `./some-library`, allora `require('./some-library')` avrebbe tentato di caricare `./some-library/lib/some-library.js`.

Questo è il grado di consapevolezza di Node.js riguardo i file package.json.

*Note*: If the file specified by the `'main'` entry of `package.json` is missing and can not be resolved, Node.js will report the entire module as missing with the default error:

```txt
Errore: Impossibile trovare il modulo 'some-library'
```

If there is no package.json file present in the directory, then Node.js will attempt to load an `index.js` or `index.node` file out of that directory. Ad esempio, se non c'era un file package.json nell'esempio precedente, allora `require('./some-library')` avrebbe tentato di caricare:

* `./some-library/index.js`
* `./some-library/index.node`

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

È possibile richiedere file o sotto-moduli specifici distribuiti con un modulo includendo un suffiso di percorso dopo il nome del modulo. Ad esempio `require('example-module/path/to/file')` risolverà `path/to/file` in relazione a dove si trova `example-module`. Il percorso con il suffisso segue la stessa semantica di risoluzione del modulo.

## Caricamento dalle cartelle globali

<!-- type=misc -->

Se la variabile di ambiente `NODE_PATH` è impostata su un elenco delimitato da due punti di percorsi assoluti, allora Node.js cercherà quei percorsi per i moduli se non vengono trovati da nessuna parte.

*Note*: On Windows, `NODE_PATH` is delimited by semicolons instead of colons.

`NODE_PATH` è stato originariamente creato per supportare il caricamento dei moduli da percorsi di vario tipo prima che l'algoritmo dell'attuale [risoluzione del modulo](#modules_all_together) fosse congelato.

`NODE_PATH` è ancora supportato, ma è meno necessario ora che l'ecosistema Node.js ha stabilito una convenzione per la localizzazione dei moduli dipendenti. A volte le distribuzioni che si basano su `NODE_PATH` mostrano comportamenti sorprendenti quando le persone non sanno che `NODE_PATH` deve essere impostato. A volte le dipendenze di un modulo cambiano, causando il caricamento di una versione diversa (o anche di un modulo diverso) durante la ricerca di `NODE_PATH`.

Inoltre, Node.js cercherà nelle seguenti posizioni:

* 1: `$HOME/.node_modules`
* 2: `$HOME/.node_libraries`
* 3: `$PREFIX/lib/node`

Dove `$HOME` è la home directory dell'utente e `$PREFIX` è il `node_prefix` configurato da Node.js.

Queste sono per lo più per ragioni cronologiche.

*Note*: It is strongly encouraged to place dependencies in the local `node_modules` folder. Queste verranno caricate più velocemente e in modo più affidabile.

## Il wrapping di un modulo

<!-- type=misc -->

Prima che venga eseguito il codice di un modulo, Node.js lo sottoporrà al wrapping con una funzione wrapper simile alla seguente:

```js
(function(exports, require, module, __filename, __dirname) {
// Il codice del modulo di fatto vive qui
});
```

In questo modo, Node.js realizza alcune cose:

- Mantiene le variabili top-level (definite con `var`, `const` o `let`) nello scope del modulo anziché nel global object.
- Aiuta a fornire alcune variabili di tipo globale ma che in realtà sono specifiche per il modulo, come ad esempio:
  - Gli object `module` ed `exports` che l'implementor può utilizzare per esportare i valori dal modulo.
  - Le variabili convenienti `__filename` e `__dirname`, contenenti il filename assoluto ed il percorso della directory del modulo.

## Lo scope di un modulo

### \_\_dirname
<!-- YAML
added: v0.1.27
-->

<!-- type=var -->

* {string}

Il nome della directory del modulo attuale. È uguale a quello di [`path.dirname()`][] del [`__filename`][].

Esempio: esecuzione di `node example.js` da `/Users/mjr`

```js
console.log(__dirname);
// Stampa: /Users/mjr
console.log(path.dirname(__filename));
// Stampa: /Users/mjr
```

### \_\_filename
<!-- YAML
added: v0.0.1
-->

<!-- type=var -->

* {string}

Il filename del modulo attuale. E' il percorso assoluto risolto dell'attuale file del modulo.

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

### exports
<!-- YAML
added: v0.1.12
-->

<!-- type=var -->

Un riferimento a `module.exports` più facile da digitare. Vedi la sezione [exports shortcut](#modules_exports_shortcut) per capire quando utilizzare `exports` e quando utilizzare `module.exports`.

### module
<!-- YAML
added: v0.1.16
-->

<!-- type=var -->

* {Object}

Un riferimento al modulo attuale, vedi la sezione [`module` object][]. In particolare, `module.exports` è usato per definire ciò che un modulo esporta e rende disponibile attraverso `require()`.

### require()
<!-- YAML
added: v0.1.13
-->

<!-- type=var -->

* {Function}

Used to import modules, `JSON`, and local files. Modules can be imported from `node_modules`. Local modules and JSON files can be imported using a relative path (e.g. `./`, `./foo`, `./bar/baz`, `../foo`) that will be resolved against the directory named by [`__dirname`][] (if defined) or the current working directory.

```js
// Importing a local module:
const myLocalModule = require('./path/myLocalModule');

// Importing a JSON file:
const jsonData = require('./path/filename.json');

// Importing a module from node_modules or Node.js built-in module:
const crypto = require('crypto');
```

#### require.cache
<!-- YAML
added: v0.3.0
-->

* {Object}

I moduli vengono sottoposti al caching all'interno di quest'object quando sono richiesti. Eliminando un valore chiave (key value) da quest'object, il prossimo `require` ricaricherà il modulo. Note that this does not apply to [native addons](addons.html), for which reloading will result in an Error.

#### require.extensions
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

**Obsoleto** In passato, questo elenco è stato utilizzato per caricare moduli non JavaScript all'interno di Node.js compilandoli su richiesta. Tuttavia, in pratica, ci sono molti modi migliori per farlo, come ad esempio caricare i moduli tramite qualche altro programma di Node.js, oppure compilarli in anticipo su JavaScript.

Poiché il sistema modulo è bloccato, questa funzione probabilmente non se ne andrà mai. Tuttavia, potrebbe avere dei bug e delle complicazioni molto delicate che è meglio non toccare.

Da notare che il numero di operazioni del file system, che il sistema modulo deve eseguire per risolvere un'istruzione `require(...)` su un filename, viene scalato linearmente con il numero di estensioni registrate.

In altre parole, l'aggiunta di estensioni rallenta il caricatore (loader) dei moduli e dovrebbe essere evitata.

#### require.resolve(request[, options])
<!-- YAML
added: v0.3.0
changes:
  - version: v8.9.0
    pr-url: https://github.com/nodejs/node/pull/16397
    description: The `paths` option is now supported.
-->

* `request` {string} Il percorso del modulo da risolvere.
* `options` {Object}
  * `paths` {Array} Paths to resolve module location from. Se presenti, questi percorsi vengono utilizzati al posto dei percorsi di risoluzione predefiniti. Da notare che ognuno di questi percorsi viene utilizzato come punto di partenza per l'algoritmo di risoluzione del modulo, nel senso che la gerarchia di `node_modules` viene controllata da questa posizione.
* Restituisce: {string}

Utilizza il sistema `require()` interno per cercare la posizione di un modulo ma, anziché caricare il modulo, è sufficiente restituire il filename risolto.

#### require.resolve.paths(request)
<!-- YAML
added: v8.9.0
-->

* `request` {string} Il percorso del modulo da cui vengono recuperati i percorsi di ricerca.
* Restituisce: {Array|null}

Returns an array containing the paths searched during resolution of `request` or null if the `request` string references a core module, for example `http` or `fs`.

## L'Object `module`
<!-- YAML
added: v0.1.16
-->

<!-- type=var -->
<!-- name=module -->

* {Object}

In ogni modulo, la variabile libera `module` è un riferimento all'object che rappresenta il modulo attuale. Per comodità, `module.exports` è accessibile anche tramite il modulo globale `exports`. `module` in realtà è più propriamente locale per ogni modulo, non globale.

### module.children
<!-- YAML
added: v0.1.16
-->

* {Array}

Gli object module richiesti da questo modulo.

### module.exports
<!-- YAML
added: v0.1.16
-->

* {Object}

The `module.exports` object is created by the Module system. A volte questo non è accettabile; molti vogliono che il loro modulo sia un'istanza di qualche classe. Per fare ciò, assegna l'object di esportazione desiderato a `module.exports`. Da notare che assegnare l'object desiderato a `exports` vincolerà nuovamente la variabile `exports` locale, e probabilmente non è ciò che si desidera.

Ad esempio, supponiamo di creare un modulo chiamato `a.js`

```js
const EventEmitter = require('events');

module.exports = new EventEmitter();

// Fai un pò di lavoro, e dopo un po' di tempo emetti
// l'evento 'ready' dal modulo stesso.
setTimeout(() => {
  module.exports.emit('ready');
}, 1000);
```

Quindi in un altro file potremmo fare

```js
const a = require('./a');
a.on('ready', () => {
  console.log('module a is ready');
});
```


Da notare che l'assegnazione a `module.exports` deve essere eseguita immediatamente. Non può essere eseguita in qualsiasi callback. Questo non funziona:

x.js:

```js
setTimeout(() => {
  module.exports = { a: 'hello' };
}, 0);
```

y.js:

```js
const x = require('./x');
console.log(x.a);
```

#### exports shortcut
<!-- YAML
added: v0.1.16
-->

La variabile `exports` è disponibile all'interno dello scope al livello del file di un modulo e gli viene assegnato il valore di `module.exports` prima che il modulo venga valutato.

Permette una scorciatoia, in modo che `module.exports.f = ...` possa essere scritto più comodamente come `exports.f = ...`. Tuttavia, tieni presente che, come qualsiasi variabile, se un nuovo valore viene assegnato a `exports`, non è più vincolato a `module.exports`:

```js
module.exports.hello = true; // Esportato da require del modulo
exports = { hello: false };  // Non esportato, solo disponibile nel modulo
```

When the `module.exports` property is being completely replaced by a new object, it is common to also reassign `exports`, for example:
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

### module.filename<!-- YAML
added: v0.1.16
-->* {string}

Il filename completamente risolto nel modulo.

### module.id
<!-- YAML
added: v0.1.16
-->

* {string}

L'identificatore per il modulo. In genere è filename completamente risolto.

### module.loaded
<!-- YAML
added: v0.1.16
-->

* {boolean}

Indipendentemente dal fatto che il modulo abbia completato il caricamento o sia in fase di caricamento.

### module.parent
<!-- YAML
added: v0.1.16
-->

* {Object} Module object

Il modulo che ha richiesto per primo questo modulo.

### module.paths<!-- YAML
added: v0.4.0
-->* {string[]}

I percorsi di ricerca per il modulo.

### module.require(id)<!-- YAML
added: v0.5.1
-->* `id` {string}
* Restituisce: {Object} `module.exports` dal modulo risolto

Il metodo `module.require` fornisce un modo per caricare un modulo come se `require()` fosse chiamato dal modulo originale.

*Note*: In order to do this, it is necessary to get a reference to the `module` object. Since `require()` returns the `module.exports`, and the `module` is typically *only* available within a specific module's code, it must be explicitly exported in order to be used.

## L'Object `Module`<!-- YAML
added: v0.3.7
-->* {Object}

Fornisce metodi di utilità generale quando interagisce con istanze di `Module` — la variabile `module` che si vede spesso nei file module. Accesso effettuato tramite `require('module')`.

### module.builtinModules<!-- YAML
added: v8.10.0
-->* {string[]}

Un elenco dei nomi di tutti i moduli forniti da Node.js. Can be used to verify if a module is maintained by a third-party module or not.
