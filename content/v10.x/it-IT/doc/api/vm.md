# VM (Esecuzione di JavaScript)

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

<!--name=vm-->

Il modulo `vm` fornisce API per la compilazione e l'esecuzione del codice all'interno dei contesti di V8 Virtual Machine. **The `vm` module is not a security mechanism. Do not use it to run untrusted code**. The term "sandbox" is used throughout these docs simply to refer to a separate context, and does not confer any security guarantees.

Il codice JavaScript può essere compilato ed eseguito immediatamente o compilato, salvato ed eseguito successivamente.

Un caso d'uso comune è quello di eseguire il codice in un ambiente in modalità sandbox. Il codice in modalità sandbox utilizza un V8 Context differente, che significa che ha un global object diverso dal resto del codice.

È possibile fornire il contesto eseguendo il ["contextify"](#vm_what_does_it_mean_to_contextify_an_object) di un sandbox object. The sandboxed code treats any property in the sandbox like a global variable. Any changes to global variables caused by the sandboxed code are reflected in the sandbox object.

```js
const vm = require('vm');

const x = 1;

const sandbox = { x: 2 };
vm.createContext(sandbox); // Eseguire il Contextify del sandbox.

const code = 'x += 40; var y = 17;';
// x e y sono variabili globali nell'ambiente in modalità sandbox.
// Inizialmente, x ha il valore 2 perché quello è il valore di sandbox.x.
vm.runInContext(code, sandbox);

console.log(sandbox.x); // 42
console.log(sandbox.y); // 17

console.log(x); // 1; y non è definito.
```

## Class: vm.SourceTextModule
<!-- YAML
added: v9.6.0
-->

> Stability: 1 - Experimental

*Questa funzionalità è disponibile esclusivamente con il flag di comando `--experimental-vm-modules` abilitato.*

The `vm.SourceTextModule` class provides a low-level interface for using ECMAScript modules in VM contexts. It is the counterpart of the `vm.Script` class that closely mirrors [Source Text Module Record](https://tc39.github.io/ecma262/#sec-source-text-module-records)s as defined in the ECMAScript specification.

Unlike `vm.Script` however, every `vm.SourceTextModule` object is bound to a context from its creation. Operations on `vm.SourceTextModule` objects are intrinsically asynchronous, in contrast with the synchronous nature of `vm.Script` objects. With the help of async functions, however, manipulating `vm.SourceTextModule` objects is fairly straightforward.

Using a `vm.SourceTextModule` object requires four distinct steps: creation/parsing, linking, instantiation, and evaluation. These four steps are illustrated in the following example.

This implementation lies at a lower level than the \[ECMAScript Module loader\]\[\]. Al momento non c'è nemmeno il modo di interagire con il Loader, sebbene sia previsto il supporto.

```js
const vm = require('vm');

const contextifiedSandbox = vm.createContext({ secret: 42 });

(async () => {
  // Step 1
  //
  // Create a Module by constructing a new `vm.SourceTextModule` object. This
  // parses the provided source text, throwing a `SyntaxError` if anything goes
  // wrong. By default, a Module is created in the top context. But here, we
  // specify `contextifiedSandbox` as the context this Module belongs to.
  //
  // Qui, cerchiamo di ottenere l'esportazione predefinita dal modulo "foo", e
  // la mettiamo nel binding locale "secret".

  const bar = new vm.SourceTextModule(`
    import s from 'foo';
    s;
  `, { context: contextifiedSandbox });

  // Step 2
  //
  // "Link" the imported dependencies of this Module to it.
  //
  // Il callback di collegamento fornito (il "linker") accetta due argomenti: il
  // parent module (`bar` in questo caso) e la stringa che è lo specifier del
  // modulo importato. Il callback dovrebbe restituire un Module che
  // corrisponda allo specifier fornito, con alcuni requisiti documentati
  // in `module.link()`.
  //
  // Se il collegamento per il Module restituito non è iniziato, lo stesso callback 
  // del linker verrà chiamato sul Module restituito.
  //
  // Anche i Module di livello superiore senza dipendenze devono essere esplicitamente collegati. Tuttavia, 
  // il callback fornito non verrà mai chiamato.
  //
  // Il metodo link() restituisce un Promise che sarà risolto quando tutti i
  // Promise restituiti dal linker si risolvono.
  //
  // Nota: Questo è un esempio inventato in quanto la funzione linker crea un nuovo
  // modulo "foo" ogni volta che viene chiamata. In un sistema di moduli a tutti gli effetti,  
  // verrà probabilmente utilizzata una cache per evitare moduli duplicati.

  async function linker(specifier, referencingModule) {
    if (specifier === 'foo') {
      return new vm.SourceTextModule(`
        // The "secret" variable refers to the global variable we added to
        // "contextifiedSandbox" when creating the context.
        export default secret;
      `, { context: referencingModule.context });

      // Utilizzare `contextifiedSandbox` invece di `referencingModule.context`
      // funzionerebbe ugualmente qui.
    }
    throw new Error(`Unable to resolve dependency: ${specifier}`);
  }
  await bar.link(linker);

  // Step 3
  //
  // Istanziare il Module di livello superiore.
  //
  // Solo il Module di livello superiore deve essere istanziato esplicitamente; le sue
  // dipendenze saranno istanziate in modo ricorsivo da instantiate().

  bar.instantiate();

  // Step 4
  //
  // Valutare il Module. Il metodo evaluate() restituisce un Promise con una singola
  // proprietà "result" che contiene il risultato dell'ultima istruzione
  // eseguita nel Module. Nel caso di `bar`, è `s;`, che si riferisce 
  // all'esportazione predefinita del modulo `foo`, il `secret` che abbiamo impostato 
  // all'inizio su 42.

  const { result } = await bar.evaluate();

  console.log(result);
  // Stampa 42.
})();
```

### Constructor: new vm.SourceTextModule(code[, options])

* `code` {string} Codice di JavaScript Module da analizzare
* `options`
  * `url` {string} L'URL utilizzato nella risoluzione del modulo e nelle stack trace. **Default:** `'vm:module(i)'` where `i` is a context-specific ascending index.
  * `context` {Object} L'object [che ha subito il contextify](#vm_what_does_it_mean_to_contextify_an_object) restituito dal metodo `vm.createContext()`, in cui compilare e valutare questo `Module`.
  * `lineOffset` {integer} Specifica l'offset del numero di riga che viene visualizzato nelle stack trace prodotte da questo `Module`.
  * `columnOffset` {integer} Specifica l'offset del numero di colonna che viene visualizzato nelle stack trace prodotte da questo `Module`.
  * `initializeImportMeta` {Function} Called during evaluation of this `Module` to initialize the `import.meta`. This function has the signature `(meta,
module)`, where `meta` is the `import.meta` object in the `Module`, and `module` is this `vm.SourceTextModule` object.
  * `importModuleDynamically` {Function} Called during evaluation of this module when `import()` is called. This function has the signature `(specifier, module)` where `specifier` is the specifier passed to `import()` and `module` is this `vm.SourceTextModule`. If this option is not specified, calls to `import()` will reject with [`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`][]. This method can return a [Module Namespace Object](https://tc39.github.io/ecma262/#sec-module-namespace-exotic-objects), but returning a `vm.SourceTextModule` is recommended in order to take advantage of error tracking, and to avoid issues with namespaces that contain `then` function exports.

Crea un nuovo ES `Module` object.

Properties assigned to the `import.meta` object that are objects may allow the `Module` to access information outside the specified `context`, if the object is created in the top level context. Utilizzare `vm.runInContext()` per creare object in un contesto specifico.

```js
const vm = require('vm');

const contextifiedSandbox = vm.createContext({ secret: 42 });

(async () => {
  const module = new vm.SourceTextModule(
    'Object.getPrototypeOf(import.meta.prop).secret = secret;',
    {
      initializeImportMeta(meta) {
        // Note: this object is created in the top context. Di conseguenza,
        // Object.getPrototypeOf(import.meta.prop) punta allo
        // Object.prototype nel contesto superiore piuttosto che a quello
        // nel sandbox.
        meta.prop = {};
      }
    });
  // Dato che il modulo non ha dipendenze, la funzione linker non verrà mai chiamata.
  await module.link(() => {});
  module.instantiate();
  await module.evaluate();

  // Now, Object.prototype.secret will be equal to 42.
  //
  // Per risolvere questo problema, sostituire
  //     meta.prop = {};
  // sopra con
  //     meta.prop = vm.runInContext('{}', contextifiedSandbox);
})();
```

### module.dependencySpecifiers

* {string[]}

Gli specifier di tutte le dipendenze di questo modulo. L'array restituito viene congelato per impedire qualsiasi modifica su di esso.

Corrisponde al campo `[[RequestedModules]]` dei [Record del Modulo del Testo Sorgente](https://tc39.github.io/ecma262/#sec-source-text-module-records) nella specifica ECMAScript.

### module.error

* {any}

Se il `module.status` è `'errored'`, questa proprietà contiene l'eccezione generata dal modulo durante la valutazione. Se lo stato è qualsiasi altro, accedendo a questa proprietà si otterrà la generazione di un'eccezione.

Il valore `undefined` non può essere utilizzato per i casi in cui non ci sia un'eccezione generata a causa di una possibile ambiguità con `throw undefined;`.

Corrisponde al campo `[[EvaluationError]]` dei [Record del Modulo del Testo Sorgente](https://tc39.github.io/ecma262/#sec-source-text-module-records) nella specifica ECMAScript.

### module.evaluate([options])

* `options` {Object}
  * `timeout` {integer} Specifies the number of milliseconds to evaluate before terminating execution. If execution is interrupted, an [`Error`][] will be thrown. This value must be a strictly positive integer.
  * `breakOnSigint` {boolean} If `true`, the execution will be terminated when `SIGINT` (Ctrl+C) is received. Existing handlers for the event that have been attached via `process.on('SIGINT')` will be disabled during script execution, but will continue to work after that. If execution is interrupted, an [`Error`][] will be thrown.
* Returns: {Promise}

Evaluate the module.

This must be called after the module has been instantiated; otherwise it will throw an error. It could be called also when the module has already been evaluated, in which case it will do one of the following two things:

- return `undefined` if the initial evaluation ended in success (`module.status` is `'evaluated'`)
- rethrow the same exception the initial evaluation threw if the initial evaluation ended in an error (`module.status` is `'errored'`)

This method cannot be called while the module is being evaluated (`module.status` is `'evaluating'`) to prevent infinite recursion.

Corresponds to the [Evaluate() concrete method](https://tc39.github.io/ecma262/#sec-moduleevaluation) field of \[Source Text Module Record\]\[\]s in the ECMAScript specification.

### module.instantiate()

Instantiate the module. This must be called after linking has completed (`linkingStatus` is `'linked'`); otherwise it will throw an error. It may also throw an exception if one of the dependencies does not provide an export the parent module requires.

However, if this function succeeded, further calls to this function after the initial instantiation will be no-ops, to be consistent with the ECMAScript specification.

Unlike other methods operating on `Module`, this function completes synchronously and returns nothing.

Corresponds to the [Instantiate() concrete method](https://tc39.github.io/ecma262/#sec-moduledeclarationinstantiation) field of \[Source Text Module Record\]\[\]s in the ECMAScript specification.

### module.link(linker)

* `linker` {Function}
* Returns: {Promise}

Link module dependencies. This method must be called before instantiation, and can only be called once per module.

Two parameters will be passed to the `linker` function:

- `specifier` The specifier of the requested module:
  <!-- eslint-skip -->
  ```js
  import foo from 'foo';
  //              ^^^^^ the module specifier
  ```
- `referencingModule` The `Module` object `link()` is called on.

The function is expected to return a `Module` object or a `Promise` that eventually resolves to a `Module` object. The returned `Module` must satisfy the following two invariants:

- It must belong to the same context as the parent `Module`.
- Its `linkingStatus` must not be `'errored'`.

If the returned `Module`'s `linkingStatus` is `'unlinked'`, this method will be recursively called on the returned `Module` with the same provided `linker` function.

`link()` returns a `Promise` that will either get resolved when all linking instances resolve to a valid `Module`, or rejected if the linker function either throws an exception or returns an invalid `Module`.

The linker function roughly corresponds to the implementation-defined [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) abstract operation in the ECMAScript specification, with a few key differences:

- The linker function is allowed to be asynchronous while [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) is synchronous.
- The linker function is executed during linking, a Node.js-specific stage before instantiation, while [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) is called during instantiation.

The actual [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) implementation used during module instantiation is one that returns the modules linked during linking. Since at that point all modules would have been fully linked already, the [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) implementation is fully synchronous per specification.

### module.linkingStatus

* {string}

The current linking status of `module`. It will be one of the following values:

- `'unlinked'`: `module.link()` has not yet been called.
- `'linking'`: `module.link()` has been called, but not all Promises returned by the linker function have been resolved yet.
- `'linked'`: `module.link()` has been called, and all its dependencies have been successfully linked.
- `'errored'`: `module.link()` has been called, but at least one of its dependencies failed to link, either because the callback returned a `Promise` that is rejected, or because the `Module` the callback returned is invalid.

### module.namespace

* {Object}

The namespace object of the module. This is only available after instantiation (`module.instantiate()`) has completed.

Corresponds to the [GetModuleNamespace](https://tc39.github.io/ecma262/#sec-getmodulenamespace) abstract operation in the ECMAScript specification.

### module.status

* {string}

The current status of the module. Will be one of:

- `'uninstantiated'`: The module is not instantiated. It may because of any of the following reasons:

  - The module was just created.
  - `module.instantiate()` has been called on this module, but it failed for some reason.

  This status does not convey any information regarding if `module.link()` has been called. See `module.linkingStatus` for that.

- `'instantiating'`: The module is currently being instantiated through a `module.instantiate()` call on itself or a parent module.

- `'instantiated'`: The module has been instantiated successfully, but `module.evaluate()` has not yet been called.

- `'evaluating'`: The module is being evaluated through a `module.evaluate()` on itself or a parent module.

- `'evaluated'`: The module has been successfully evaluated.

- `'errored'`: The module has been evaluated, but an exception was thrown.

Other than `'errored'`, this status string corresponds to the specification's [Source Text Module Record](https://tc39.github.io/ecma262/#sec-source-text-module-records)'s `[[Status]]` field. `'errored'` corresponds to `'evaluated'` in the specification, but with `[[EvaluationError]]` set to a value that is not `undefined`.

### module.url

* {string}

The URL of the current module, as set in the constructor.

## Class: vm.Script
<!-- YAML
added: v0.3.1
-->

Le istanze della classe `vm.Script` contengono script precompilati che possono essere eseguiti in sandbox specifici (o "contesti").

### new vm.Script(code, options)
<!-- YAML
added: v0.3.1
changes:
  - version: v5.7.0
    pr-url: https://github.com/nodejs/node/pull/4777
    description: The `cachedData` and `produceCachedData` options are
                 supported now.
  - version: v10.6.0
    pr-url: https://github.com/nodejs/node/pull/20300
    description: The `produceCachedData` is deprecated in favour of
                 `script.createCachedData()`
-->

* `code` {string} Il codice JavaScript da compilare.
* `options`
  * `filename` {string} Specifica il filename utilizzato nelle stack trace prodotte da questo script.
  * `lineOffset` {number} Specifica l'offset del numero di riga che viene visualizzato nelle stack trace prodotte da questo script.
  * `columnOffset` {number} Specifica l'offset del numero di colonna che viene visualizzato nelle stack trace prodotte da questo script.
  * `cachedData` {Buffer|TypedArray|DataView} Provides an optional `Buffer` or `TypedArray`, or `DataView` with V8's code cache data for the supplied source. When supplied, the `cachedDataRejected` value will be set to either `true` or `false` depending on acceptance of the data by V8.
  * `produceCachedData` {boolean} Quando è `true` e nessun `cachedData` è presente, V8 cercherà di produrre dati della cache del codice per `code`. In caso di successo, un `Buffer` con i dati della cache del codice di V8 verrà prodotto e memorizzato nella proprietà `cachedData` dell'istanza `vm.Script` restituita. Il valore `cachedDataProduced` sarà impostato su `true` o `false` a seconda del fatto che i dati della cache del codice vengano prodotti correttamente o meno. This option is deprecated in favor of `script.createCachedData()`.
  * `importModuleDynamically` {Function} Called during evaluation of this module when `import()` is called. This function has the signature `(specifier, module)` where `specifier` is the specifier passed to `import()` and `module` is this `vm.SourceTextModule`. If this option is not specified, calls to `import()` will reject with [`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`][]. This method can return a [Module Namespace Object](https://tc39.github.io/ecma262/#sec-module-namespace-exotic-objects), but returning a `vm.SourceTextModule` is recommended in order to take advantage of error tracking, and to avoid issues with namespaces that contain `then` function exports.

La creazione di un nuovo `vm.Script` object compila `code` ma non lo esegue. Il `vm.Script` compilato può essere eseguito successivamente più volte. Il `code` non è associato a nessun global object; piuttosto, viene sottoposto al binding prima di ogni esecuzione, esclusivamente per quell'esecuzione.

### script.createCachedData()
<!-- YAML
added: v10.6.0
-->

* Restituisce: {Buffer}

Creates a code cache that can be used with the Script constructor's `cachedData` option. Returns a Buffer. This method may be called at any time and any number of times.

```js
const script = new vm.Script(`
function add(a, b) {
  return a + b;
}

const x = add(1, 2);
`);

const cacheWithoutX = script.createCachedData();

script.runInThisContext();

const cacheWithX = script.createCachedData();
```

### script.runInContext(contextifiedSandbox[, options])
<!-- YAML
added: v0.3.1
changes:
  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/6635
    description: The `breakOnSigint` option is supported now.
-->

* `contextifiedSandbox` {Object} Un object [che ha subito il contextify](#vm_what_does_it_mean_to_contextify_an_object) come restituito dal metodo `vm.createContext()`.
* `options` {Object}
  * `filename` {string} Specifica il filename utilizzato nelle stack trace prodotte da questo script.
  * `lineOffset` {number} Specifica l'offset del numero di riga che viene visualizzato nelle stack trace prodotte da questo script.
  * `columnOffset` {number} Specifica l'offset del numero di colonna che viene visualizzato nelle stack trace prodotte da questo script.
  * `displayErrors` {boolean} Quando `true`, se si verifica un errore [`Error`][] durante la compilazione del `code`, la riga di codice che causa l'errore viene collegata alla stack trace.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Se l'esecuzione è terminata, verrà generato un [`Error`][]. This value must be a strictly positive integer.
  * `breakOnSigint`: se `true`, l'esecuzione verrà terminata al ricevimento di `SIGINT` (Ctrl+C). Gli handler esistenti per l'evento che è stato collegato tramite `process.on('SIGINT')` verranno disabilitati durante l'esecuzione dello script, tuttavia dopo ciò continueranno a funzionare. Se l'esecuzione è terminata, verrà generato un [`Error`][].

Esegue il codice compilato contenuto dal `vm.Script` object all'interno del `contextifiedSandbox` specificato e restituisce il risultato. L'esecuzione del codice non ha accesso allo scope locale.

L'esempio seguente compila il codice che incrementa una variabile globale, imposta il valore di un'altra variabile globale, quindi esegue il codice più volte. I globali sono contenuti nel `sandbox` object.

```js
const util = require('util');
const vm = require('vm');

const sandbox = {
  animal: 'cat',
  count: 2
};

const script = new vm.Script('count += 1; name = "kitty";');

const context = vm.createContext(sandbox);
for (let i = 0; i < 10; ++i) {
  script.runInContext(context);
}

console.log(util.inspect(sandbox));

// { animal: 'cat', count: 12, name: 'kitty' }
```

Using the `timeout` or `breakOnSigint` options will result in new event loops and corresponding threads being started, which have a non-zero performance overhead.

### script.runInNewContext([sandbox[, options]])
<!-- YAML
added: v0.3.1
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19016
    description: The `contextCodeGeneration` option is supported now.
-->

* `sandbox` {Object} Un object che [subirà il contextify](#vm_what_does_it_mean_to_contextify_an_object). Se `undefined`, verrà creato un nuovo object.
* `options` {Object}
  * `filename` {string} Specifica il filename utilizzato nelle stack trace prodotte da questo script.
  * `lineOffset` {number} Specifica l'offset del numero di riga che viene visualizzato nelle stack trace prodotte da questo script.
  * `columnOffset` {number} Specifica l'offset del numero di colonna che viene visualizzato nelle stack trace prodotte da questo script.
  * `displayErrors` {boolean} Quando `true`, se si verifica un errore [`Error`][] durante la compilazione del `code`, la riga di codice che causa l'errore viene collegata alla stack trace.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Se l'esecuzione è terminata, verrà generato un [`Error`][]. This value must be a strictly positive integer.
  * `contextName` {string} Human-readable name of the newly created context. **Default:** `'VM Context i'`, where `i` is an ascending numerical index of the created context.
  * `contextOrigin` {string} [Origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin) corresponding to the newly created context for display purposes. The origin should be formatted like a URL, but with only the scheme, host, and port (if necessary), like the value of the [`url.origin`][] property of a [`URL`][] object. Most notably, this string should omit the trailing slash, as that denotes a path. **Default:** `''`.
  * `contextCodeGeneration` {Object}
    * `strings` {boolean} If set to false any calls to `eval` or function constructors (`Function`, `GeneratorFunction`, etc) will throw an `EvalError`. **Default:** `true`.
    * `wasm` {boolean} If set to false any attempt to compile a WebAssembly module will throw a `WebAssembly.CompileError`. **Default:** `true`.

Innanzitutto esegue il contextify su un determinato `sandbox`, esegue il codice compilato contenuto dal `vm.Script` object all'interno della sandbox creata e restituisce il risultato. L'esecuzione del codice non ha accesso allo scope locale.

Il seguente esempio compila il codice che imposta una variabile globale, quindi esegue il codice più volte in contesti differenti. I globali vengono impostati e contenuti all'interno di ogni singolo `sandbox`.

```js
const util = require('util');
const vm = require('vm');

const script = new vm.Script('globalVar = "set"');

const sandboxes = [{}, {}, {}];
sandboxes.forEach((sandbox) => {
  script.runInNewContext(sandbox);
});

console.log(util.inspect(sandboxes));

// [{ globalVar: 'set' }, { globalVar: 'set' }, { globalVar: 'set' }]
```

### script.runInThisContext([options])
<!-- YAML
added: v0.3.1
-->

* `options` {Object}
  * `filename` {string} Specifica il filename utilizzato nelle stack trace prodotte da questo script.
  * `lineOffset` {number} Specifica l'offset del numero di riga che viene visualizzato nelle stack trace prodotte da questo script.
  * `columnOffset` {number} Specifica l'offset del numero di colonna che viene visualizzato nelle stack trace prodotte da questo script.
  * `displayErrors` {boolean} Quando `true`, se si verifica un errore [`Error`][] durante la compilazione del `code`, la riga di codice che causa l'errore viene collegata alla stack trace.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Se l'esecuzione è terminata, verrà generato un [`Error`][]. This value must be a strictly positive integer.

Esegue il codice compilato contenuto dal `vm.Script` all'interno del contesto del `global` object corrente. L'esecuzione del codice non ha accesso allo scope locale, tuttavia *ha* accesso al `global` object corrente.

Il seguente esempio compila il codice che incrementa una variabile `globale`, quindi esegue quel codice più volte:

```js
const vm = require('vm');

global.globalVar = 0;

const script = new vm.Script('globalVar += 1', { filename: 'myfile.vm' });

for (let i = 0; i < 1000; ++i) {
  script.runInThisContext();
}

console.log(globalVar);

// 1000
```

## vm.compileFunction(code[, params[, options]])
<!-- YAML
added: v10.10.0
-->
* `code` {string} The body of the function to compile.
* `params` {string[]} An array of strings containing all parameters for the function.
* `options` {Object}
  * `filename` {string} Specifica il filename utilizzato nelle stack trace prodotte da questo script. **Default:** `''`.
  * `lineOffset` {number} Specifica l'offset del numero di riga che viene visualizzato nelle stack trace prodotte da questo script. **Default:** `0`.
  * `columnOffset` {number} Specifica l'offset del numero di colonna che viene visualizzato nelle stack trace prodotte da questo script. **Default:** `0`.
  * `cachedData` {Buffer|TypedArray|DataView} Provides an optional `Buffer` or `TypedArray`, or `DataView` with V8's code cache data for the supplied source.
  * `produceCachedData` {boolean} Specifies whether to produce new cache data. **Default:** `false`.
  * `parsingContext` {Object} The [contextified](#vm_what_does_it_mean_to_contextify_an_object) sandbox in which the said function should be compiled in.
  * `contextExtensions` {Object[]} An array containing a collection of context extensions (objects wrapping the current scope) to be applied while compiling. **Default:** `[]`.

Compiles the given code into the provided context/sandbox (if no context is supplied, the current context is used), and returns it wrapped inside a function with the given `params`.

## vm.createContext([sandbox[, options]])
<!-- YAML
added: v0.3.1
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19398
    description: The `sandbox` option can no longer be a function.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19016
    description: The `codeGeneration` option is supported now.
-->

* `sandbox` {Object}
* `options` {Object}
  * `name` {string} Human-readable name of the newly created context. **Default:** `'VM Context i'`, where `i` is an ascending numerical index of the created context.
  * `origin` {string} [Origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin) corresponding to the newly created context for display purposes. The origin should be formatted like a URL, but with only the scheme, host, and port (if necessary), like the value of the [`url.origin`][] property of a [`URL`][] object. Most notably, this string should omit the trailing slash, as that denotes a path. **Default:** `''`.
  * `codeGeneration` {Object}
    * `strings` {boolean} If set to false any calls to `eval` or function constructors (`Function`, `GeneratorFunction`, etc) will throw an `EvalError`. **Default:** `true`.
    * `wasm` {boolean} If set to false any attempt to compile a WebAssembly module will throw a `WebAssembly.CompileError`. **Default:** `true`.

Se viene specificato un `sandbox` object, il metodo `vm.createContext()` [preparerà quel sandbox](#vm_what_does_it_mean_to_contextify_an_object) in modo che possa essere utilizzato in chiamate a [`vm.runInContext()`][] o a [`script.runInContext()`][]. All'interno di questi script, il `sandbox` object sarà il global object, mantenendo tutte le sue proprietà esistenti, ma avendo inoltre gli object incorporati e le funzioni che qualsiasi [global object](https://es5.github.io/#x15.1) standard possiede. Al di fuori degli script eseguiti dal modulo vm, le variabili globali rimarranno invariate.

```js
const util = require('util');
const vm = require('vm');

global.globalVar = 3;

const sandbox = { globalVar: 1 };
vm.createContext(sandbox);

vm.runInContext('globalVar *= 2;', sandbox);

console.log(util.inspect(sandbox)); // { globalVar: 2 }

console.log(util.inspect(globalVar)); // 3
```

Se `sandbox` viene omesso (o passato esplicitamente come `undefined`), verrà restituito un sandbox object che [ha subito il contextify](#vm_what_does_it_mean_to_contextify_an_object) nuovo e vuoto.

Il metodo `vm.createContext()` è principalmente utile per creare un singolo sandbox che può essere utilizzato per eseguire script multipli. Per esempio, se si emula un browser web, il metodo può essere utilizzato per creare un singolo sandbox che rappresenti un global object di window e quindi eseguire contemporaneamente tutti i tag `<script>` all'interno del contesto di quel sandbox.

The provided `name` and `origin` of the context are made visible through the Inspector API.

## vm.isContext(sandbox)
<!-- YAML
added: v0.11.7
-->

* `sandbox` {Object}
* Restituisce: {boolean}

Restituisce `true` se il [contextify](#vm_what_does_it_mean_to_contextify_an_object) del `sandbox` object specificato è stato eseguito utilizzando [`vm.createContext()`][].

## vm.runInContext(code, contextifiedSandbox[, options])

* `code` {string} Il codice JavaScript da compilare ed eseguire.
* `contextifiedSandbox` {Object} L'object che [ha subito il contextify](#vm_what_does_it_mean_to_contextify_an_object) che verrà utilizzato come `global` nel momento in cui il `code` viene compilato ed eseguito.
* `options` {Object|string}
  * `filename` {string} Specifica il filename utilizzato nelle stack trace prodotte da questo script.
  * `lineOffset` {number} Specifica l'offset del numero di riga che viene visualizzato nelle stack trace prodotte da questo script.
  * `columnOffset` {number} Specifica l'offset del numero di colonna che viene visualizzato nelle stack trace prodotte da questo script.
  * `displayErrors` {boolean} Quando `true`, se si verifica un errore [`Error`][] durante la compilazione del `code`, la riga di codice che causa l'errore viene collegata alla stack trace.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Se l'esecuzione è terminata, verrà generato un [`Error`][]. This value must be a strictly positive integer.

Il metodo `vm.runInContext()` compila il `code`, lo esegue all'interno del contesto del `contextifiedSandbox`, quindi restituisce il risultato. L'esecuzione del codice non ha accesso allo scope locale. Il `contextifiedSandbox` object *deve* avere precedentemente [subito il contextify](#vm_what_does_it_mean_to_contextify_an_object) utilizzando il metodo [`vm.createContext()`][].

If `options` is a string, then it specifies the filename.

Il seguente esempio compila ed esegue script differenti utilizzando un singolo object che [ha subito il contextify](#vm_what_does_it_mean_to_contextify_an_object):

```js
const util = require('util');
const vm = require('vm');

const sandbox = { globalVar: 1 };
vm.createContext(sandbox);

for (let i = 0; i < 10; ++i) {
  vm.runInContext('globalVar *= 2;', sandbox);
}
console.log(util.inspect(sandbox));

// { globalVar: 1024 }
```

## vm.runInNewContext(code[, sandbox[, options]])
<!-- YAML
added: v0.3.1
-->

* `code` {string} Il codice JavaScript da compilare ed eseguire.
* `sandbox` {Object} Un object che [subirà il contextify](#vm_what_does_it_mean_to_contextify_an_object). Se `undefined`, verrà creato un nuovo object.
* `options` {Object|string}
  * `filename` {string} Specifica il filename utilizzato nelle stack trace prodotte da questo script.
  * `lineOffset` {number} Specifica l'offset del numero di riga che viene visualizzato nelle stack trace prodotte da questo script.
  * `columnOffset` {number} Specifica l'offset del numero di colonna che viene visualizzato nelle stack trace prodotte da questo script.
  * `displayErrors` {boolean} Quando `true`, se si verifica un errore [`Error`][] durante la compilazione del `code`, la riga di codice che causa l'errore viene collegata alla stack trace.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Se l'esecuzione è terminata, verrà generato un [`Error`][]. This value must be a strictly positive integer.
  * `contextName` {string} Human-readable name of the newly created context. **Default:** `'VM Context i'`, where `i` is an ascending numerical index of the created context.
  * `contextOrigin` {string} [Origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin) corresponding to the newly created context for display purposes. The origin should be formatted like a URL, but with only the scheme, host, and port (if necessary), like the value of the [`url.origin`][] property of a [`URL`][] object. Most notably, this string should omit the trailing slash, as that denotes a path. **Default:** `''`.

Il `vm.runInNewContext()` prima di tutto esegue il contextify sul `sandbox` object specificato (o crea un nuovo `sandbox` se passato come `undefined`), compila il `code`, lo esegue all'interno del contesto del contesto creato, quindi restituisce il risultato. L'esecuzione del codice non ha accesso allo scope locale.

If `options` is a string, then it specifies the filename.

Il seguente esempio compila ed esegue il codice che incrementa una variabile globale e ne imposta una nuova. Questi globali sono contenuti nel `sandbox`.

```js
const util = require('util');
const vm = require('vm');

const sandbox = {
  animal: 'cat',
  count: 2
};

vm.runInNewContext('count += 1; name = "kitty"', sandbox);
console.log(util.inspect(sandbox));

// { animal: 'cat', count: 3, name: 'kitty' }
```

## vm.runInThisContext(code[, options])
<!-- YAML
added: v0.3.1
-->

* `code` {string} Il codice JavaScript da compilare ed eseguire.
* `options` {Object|string}
  * `filename` {string} Specifica il filename utilizzato nelle stack trace prodotte da questo script.
  * `lineOffset` {number} Specifica l'offset del numero di riga che viene visualizzato nelle stack trace prodotte da questo script.
  * `columnOffset` {number} Specifica l'offset del numero di colonna che viene visualizzato nelle stack trace prodotte da questo script.
  * `displayErrors` {boolean} Quando `true`, se si verifica un errore [`Error`][] durante la compilazione del `code`, la riga di codice che causa l'errore viene collegata alla stack trace.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Se l'esecuzione è terminata, verrà generato un [`Error`][]. This value must be a strictly positive integer.

`vm.runInThisContext()` compila il `code`, lo esegue all'interno del contesto del `global` corrente e restituisce il risultato. L'esecuzione del codice non ha accesso allo scope locale, tuttavia ha accesso al `global` object corrente.

If `options` is a string, then it specifies the filename.

L'esempio seguente illustra sia l'utilizzo di `vm.runInThisContext()` che della funzione JavaScript [`eval()`][] per eseguire lo stesso codice:
```js
const vm = require('vm');
let localVar = 'initial value';

const vmResult = vm.runInThisContext('localVar = "vm";');
console.log('vmResult:', vmResult);
console.log('localVar:', localVar);

const evalResult = eval('localVar = "eval";');
console.log('evalResult:', evalResult);
console.log('localVar:', localVar);

// vmResult: 'vm', localVar: 'initial value'
// evalResult: 'eval', localVar: 'eval'
```

Poiché `vm.runInThisContext()` non ha accesso allo scope locale, `localVar` è invariato. Al contrario, [`eval()`][] *ha* accesso allo scope locale, quindi il valore `localVar` è variato. In questo modo `vm.runInThisContext()` è molto simile a un [indirect `eval()` call][], ad esempio `(0,eval)('code')`.

## Esempio: Esecuzione di un Server HTTP all'interno di una VM

When using either [`script.runInThisContext()`][] or [`vm.runInThisContext()`][], the code is executed within the current V8 global context. The code passed to this VM context will have its own isolated scope.

Per eseguire un semplice web server utilizzando il modulo `http`, il codice passato al contesto deve chiamare `require('http')` autonomamente o avere un riferimento al modulo `http` passato a esso. Ad esempio:

```js
'use strict';
const vm = require('vm');

const code = `
((require) => {
  const http = require('http');

  http.createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('Hello World\\n');
  }).listen(8124);

  console.log('Server running at http://127.0.0.1:8124/');
})`;

vm.runInThisContext(code)(require);
```

The `require()` in the above case shares the state with the context it is passed from. Ciò può introdurre dei rischi quando viene eseguito un codice non attendibile, ad esempio alterando object nel contesto in modi indesiderati.

## Cosa significa "eseguire il contextify" su un object?

Tutto il JavaScript eseguito all'interno di Node.js funziona all'interno dello scope di un "contesto". Secondo la [Guida dell'Embedder di V8](https://github.com/v8/v8/wiki/Embedder's%20Guide#contexts):

> In V8, un contesto è un ambiente di esecuzione che permette di eseguire applicazioni JavaScript separate e non correlate in una singola istanza di V8. È necessario specificare esplicitamente il contesto in cui si desidera che venga eseguito qualsiasi codice JavaScript.

Nel momento in cui viene chiamato il metodo `vm.createContext()`, il `sandbox` object che viene passato (o un object appena creato se `sandbox` è `undefined`) viene associato internamente con una nuova istanza di un V8 Context. Questo V8 Context fornisce il `code` eseguito utilizzando i metodi del modulo `vm` con un ambiente globale isolato all'interno del quale può operare. Il processo di creazione del V8 Context e della sua associazione con il `sandbox` object è ciò a cui questo documento si riferisce con l'espressione "eseguire il contextify" del `sandbox`.

## Timeout limitations when using process.nextTick(), and Promises

Because of the internal mechanics of how the `process.nextTick()` queue and the microtask queue that underlies Promises are implemented within V8 and Node.js, it is possible for code running within a context to "escape" the `timeout` set using `vm.runInContext()`, `vm.runInNewContext()`, and `vm.runInThisContext()`.

For example, the following code executed by `vm.runInNewContext()` with a timeout of 5 milliseconds schedules an infinite loop to run after a promise resolves. The scheduled loop is never interrupted by the timeout:

```js
const vm = require('vm');

function loop() {
  while (1) console.log(Date.now());
}

vm.runInNewContext(
  'Promise.resolve().then(loop);',
  { loop, console },
  { timeout: 5 }
);
```

This issue also occurs when the `loop()` call is scheduled using the `process.nextTick()` function.

This issue occurs because all contexts share the same microtask and nextTick queues.
