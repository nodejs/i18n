# VM (Esecuzione di JavaScript)

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

<!--name=vm-->

The `vm` module enables compiling and running code within V8 Virtual Machine contexts. **The `vm` module is not a security mechanism. Do not use it to run untrusted code**.

Il codice JavaScript può essere compilato ed eseguito immediatamente o compilato, salvato ed eseguito successivamente.

A common use case is to run the code in a different V8 Context. This means invoked code has a different global object than the invoking code.

One can provide the context by [_contextifying_](#vm_what_does_it_mean_to_contextify_an_object) an object. The invoked code treats any property in the context like a global variable. Any changes to global variables caused by the invoked code are reflected in the context object.

```js
const vm = require('vm');

const x = 1;

const context = { x: 2 };
vm.createContext(context); // Contextify the object.

const code = 'x += 40; var y = 17;';
// `x` and `y` are global variables in the context.
// Initially, x has the value 2 because that is the value of context.x.
vm.runInContext(code, context);

console.log(context.x); // 42
console.log(context.y); // 17

console.log(x); // 1; y is not defined.
```

## Class: `vm.Script`
<!-- YAML
added: v0.3.1
-->

Instances of the `vm.Script` class contain precompiled scripts that can be executed in specific contexts.

### Constructor: `new vm.Script(code[, options])`
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
* `options` {Object|string}
  * `filename` {string} Specifica il filename utilizzato nelle stack trace prodotte da questo script. **Default:** `'evalmachine.<anonymous>'`.
  * `lineOffset` {number} Specifica l'offset del numero di riga che viene visualizzato nelle stack trace prodotte da questo script. **Default:** `0`.
  * `columnOffset` {number} Specifica l'offset del numero di colonna che viene visualizzato nelle stack trace prodotte da questo script. **Default:** `0`.
  * `cachedData` {Buffer|TypedArray|DataView} Provides an optional `Buffer` or `TypedArray`, or `DataView` with V8's code cache data for the supplied source. When supplied, the `cachedDataRejected` value will be set to either `true` or `false` depending on acceptance of the data by V8.
  * `produceCachedData` {boolean} Quando è `true` e nessun `cachedData` è presente, V8 cercherà di produrre dati della cache del codice per `code`. In caso di successo, un `Buffer` con i dati della cache del codice di V8 verrà prodotto e memorizzato nella proprietà `cachedData` dell'istanza `vm.Script` restituita. Il valore `cachedDataProduced` sarà impostato su `true` o `false` a seconda del fatto che i dati della cache del codice vengano prodotti correttamente o meno. This option is **deprecated** in favor of `script.createCachedData()`. **Default:** `false`.
  * `importModuleDynamically` {Function} Called during evaluation of this module when `import()` is called. If this option is not specified, calls to `import()` will reject with [`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`][]. This option is part of the experimental API for the `--experimental-modules` flag, and should not be considered stable.
    * `specifier` {string} specifier passed to `import()`
    * `module` {vm.Module}
    * Returns: {Module Namespace Object|vm.Module} Returning a `vm.Module` is recommended in order to take advantage of error tracking, and to avoid issues with namespaces that contain `then` function exports.

Se `options` è una stringa, allora specifica il filename.

La creazione di un nuovo `vm.Script` object compila `code` ma non lo esegue. Il `vm.Script` compilato può essere eseguito successivamente più volte. The `code` is not bound to any global object; rather, it is bound before each run, just for that run.

### `script.createCachedData()`
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

### `script.runInContext(contextifiedObject[, options])`
<!-- YAML
added: v0.3.1
changes:
  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/6635
    description: The `breakOnSigint` option is supported now.
-->

* `contextifiedObject` {Object} A [contextified](#vm_what_does_it_mean_to_contextify_an_object) object as returned by the `vm.createContext()` method.
* `options` {Object}
  * `displayErrors` {boolean} When `true`, if an [`Error`][] occurs while compiling the `code`, the line of code causing the error is attached to the stack trace. **Default:** `true`.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Se l'esecuzione è terminata, verrà generato un [`Error`][]. This value must be a strictly positive integer.
  * `breakOnSigint` {boolean} If `true`, the execution will be terminated when `SIGINT` (Ctrl+C) is received. Gli handler esistenti per l'evento che è stato collegato tramite `process.on('SIGINT')` verranno disabilitati durante l'esecuzione dello script, tuttavia dopo ciò continueranno a funzionare. If execution is terminated, an [`Error`][] will be thrown. **Default:** `false`.
* Returns: {any} the result of the very last statement executed in the script.

Runs the compiled code contained by the `vm.Script` object within the given `contextifiedObject` and returns the result. L'esecuzione del codice non ha accesso allo scope locale.

L'esempio seguente compila il codice che incrementa una variabile globale, imposta il valore di un'altra variabile globale, quindi esegue il codice più volte. The globals are contained in the `context` object.

```js
const util = require('util');
const vm = require('vm');

const context = {
  animal: 'cat',
  count: 2
};

const script = new vm.Script('count += 1; name = "kitty";');

vm.createContext(context);
for (let i = 0; i < 10; ++i) {
  script.runInContext(context);
}

console.log(util.inspect(context));

// { animal: 'cat', count: 12, name: 'kitty' }
```

Using the `timeout` or `breakOnSigint` options will result in new event loops and corresponding threads being started, which have a non-zero performance overhead.

### `script.runInNewContext([contextObject[, options]])`
<!-- YAML
added: v0.3.1
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19016
    description: The `contextCodeGeneration` option is supported now.
  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/6635
    description: The `breakOnSigint` option is supported now.
-->

* `contextObject` {Object} An object that will be [contextified](#vm_what_does_it_mean_to_contextify_an_object). If `undefined`, a new object will be created.
* `options` {Object}
  * `displayErrors` {boolean} When `true`, if an [`Error`][] occurs while compiling the `code`, the line of code causing the error is attached to the stack trace. **Default:** `true`.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Se l'esecuzione è terminata, verrà generato un [`Error`][]. This value must be a strictly positive integer.
  * `breakOnSigint` {boolean} If `true`, the execution will be terminated when `SIGINT` (Ctrl+C) is received. Gli handler esistenti per l'evento che è stato collegato tramite `process.on('SIGINT')` verranno disabilitati durante l'esecuzione dello script, tuttavia dopo ciò continueranno a funzionare. If execution is terminated, an [`Error`][] will be thrown. **Default:** `false`.
  * `contextName` {string} Nome in forma leggibile del contesto appena creato. **Default:** `'VM Context i'`, where `i` is an ascending numerical index of the created context.
  * `contextOrigin` {string} [Origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin) corresponding to the newly created context for display purposes. The origin should be formatted like a URL, but with only the scheme, host, and port (if necessary), like the value of the [`url.origin`][] property of a [`URL`][] object. Most notably, this string should omit the trailing slash, as that denotes a path. **Default:** `''`.
  * `contextCodeGeneration` {Object}
    * `strings` {boolean} If set to false any calls to `eval` or function constructors (`Function`, `GeneratorFunction`, etc) will throw an `EvalError`. **Default:** `true`.
    * `wasm` {boolean} If set to false any attempt to compile a WebAssembly module will throw a `WebAssembly.CompileError`. **Default:** `true`.
* Returns: {any} the result of the very last statement executed in the script.

First contextifies the given `contextObject`, runs the compiled code contained by the `vm.Script` object within the created context, and returns the result. L'esecuzione del codice non ha accesso allo scope locale.

Il seguente esempio compila il codice che imposta una variabile globale, quindi esegue il codice più volte in contesti differenti. The globals are set on and contained within each individual `context`.

```js
const util = require('util');
const vm = require('vm');

const script = new vm.Script('globalVar = "set"');

const contexts = [{}, {}, {}];
contexts.forEach((context) => {
  script.runInNewContext(context);
});

console.log(util.inspect(contexts));

// [{ globalVar: 'set' }, { globalVar: 'set' }, { globalVar: 'set' }]
```

### `script.runInThisContext([options])`
<!-- YAML
added: v0.3.1
changes:
  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/6635
    description: The `breakOnSigint` option is supported now.
-->

* `options` {Object}
  * `displayErrors` {boolean} When `true`, if an [`Error`][] occurs while compiling the `code`, the line of code causing the error is attached to the stack trace. **Default:** `true`.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Se l'esecuzione è terminata, verrà generato un [`Error`][]. This value must be a strictly positive integer.
  * `breakOnSigint` {boolean} If `true`, the execution will be terminated when `SIGINT` (Ctrl+C) is received. Gli handler esistenti per l'evento che è stato collegato tramite `process.on('SIGINT')` verranno disabilitati durante l'esecuzione dello script, tuttavia dopo ciò continueranno a funzionare. If execution is terminated, an [`Error`][] will be thrown. **Default:** `false`.
* Returns: {any} the result of the very last statement executed in the script.

Esegue il codice compilato contenuto dal `vm.Script` all'interno del contesto del `global` object corrente. Running code does not have access to local scope, but *does* have access to the current `global` object.

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

## Class: `vm.Module`
<!-- YAML
added: v12.16.0
-->

> Stabilità: 1 - Sperimentale

*This feature is only available with the `--experimental-vm-modules` command flag enabled.*

The `vm.Module` class provides a low-level interface for using ECMAScript modules in VM contexts. It is the counterpart of the `vm.Script` class that closely mirrors [Module Record](https://www.ecma-international.org/ecma-262/#sec-abstract-module-records)s as defined in the ECMAScript specification.

Unlike `vm.Script` however, every `vm.Module` object is bound to a context from its creation. Operations on `vm.Module` objects are intrinsically asynchronous, in contrast with the synchronous nature of `vm.Script` objects. With the help of async functions, however, manipulating `vm.Module` objects is fairly straightforward.

Using a `vm.Module` object requires three distinct steps: creation/parsing, linking, and evaluation. These three steps are illustrated in the following example.

This implementation lies at a lower level than the \[ECMAScript Module loader\]\[\]. There is also currently no way to interact with the Loader, though support is planned.

```js
const vm = require('vm');

const contextifiedObject = vm.createContext({ secret: 42 });

(async () => {
  // Step 1
  //
  // Create a Module by constructing a new `vm.SourceTextModule` object. This
  // parses the provided source text, throwing a `SyntaxError` if anything goes
  // wrong. By default, a Module is created in the top context. But here, we
  // specify `contextifiedObject` as the context this Module belongs to.
  //
  // Qui, cerchiamo di ottenere l'esportazione predefinita dal modulo "foo", e
  // la mettiamo nel binding locale "secret".

  const bar = new vm.SourceTextModule(`
    import s from 'foo';
    s;
  `, { context: contextifiedObject });

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
        // "contextifiedObject" when creating the context.
        export default secret;
      `, { context: referencingModule.context });

      // Using `contextifiedObject` instead of `referencingModule.context`
      // here would work as well.
    }
    throw new Error(`Unable to resolve dependency: ${specifier}`);
  }
  await bar.link(linker);

  // Step 3
  //
  // Evaluate the Module. Il metodo evaluate() restituisce un Promise con una singola
  // proprietà "result" che contiene il risultato dell'ultima istruzione
  // eseguita nel Module. Nel caso di `bar`, è `s;`, che si riferisce 
  // all'esportazione predefinita del modulo `foo`, il `secret` che abbiamo impostato 
  // all'inizio su 42.

  const { result } = await bar.evaluate();

  console.log(result);
  // Stampa 42.
})();
```

### `module.dependencySpecifiers`

* {string[]}

Gli specifier di tutte le dipendenze di questo modulo. The returned array is frozen to disallow any changes to it.

Corresponds to the `[[RequestedModules]]` field of [Cyclic Module Record](https://tc39.es/ecma262/#sec-cyclic-module-records)s in the ECMAScript specification.

### `module.error`

* {any}

If the `module.status` is `'errored'`, this property contains the exception thrown by the module during evaluation. If the status is anything else, accessing this property will result in a thrown exception.

The value `undefined` cannot be used for cases where there is not a thrown exception due to possible ambiguity with `throw undefined;`.

Corresponds to the `[[EvaluationError]]` field of [Cyclic Module Record](https://tc39.es/ecma262/#sec-cyclic-module-records)s in the ECMAScript specification.

### `module.evaluate([options])`

* `options` {Object}
  * `timeout` {integer} Specifies the number of milliseconds to evaluate before terminating execution. If execution is interrupted, an [`Error`][] will be thrown. This value must be a strictly positive integer.
  * `breakOnSigint` {boolean} If `true`, the execution will be terminated when `SIGINT` (Ctrl+C) is received. Existing handlers for the event that have been attached via `process.on('SIGINT')` will be disabled during script execution, but will continue to work after that. If execution is interrupted, an [`Error`][] will be thrown. **Default:** `false`.
* Restituisce: {Promise}

Valuta il modulo.

This must be called after the module has been linked; otherwise it will throw an error. It could be called also when the module has already been evaluated, in which case it will do one of the following two things:

* return `undefined` if the initial evaluation ended in success (`module.status` is `'evaluated'`)
* rethrow the same exception the initial evaluation threw if the initial evaluation ended in an error (`module.status` is `'errored'`)

This method cannot be called while the module is being evaluated (`module.status` is `'evaluating'`) to prevent infinite recursion.

Corresponds to the [Evaluate() concrete method](https://tc39.es/ecma262/#sec-moduleevaluation) field of \[Cyclic Module Record\]\[\]s in the ECMAScript specification.

### `module.link(linker)`

* `linker` {Function}
  * `specifier` {string} The specifier of the requested module:
    <!-- eslint-skip -->
    ```js
    import foo from 'foo';
    //              ^^^^^ the module specifier
    ```

  * `referencingModule` {vm.Module} The `Module` object `link()` is called on.
  * Returns: {vm.Module|Promise}
* Restituisce: {Promise}

Collega le dipendenze del modulo. This method must be called before evaluation, and can only be called once per module.

The function is expected to return a `Module` object or a `Promise` that eventually resolves to a `Module` object. The returned `Module` must satisfy the following two invariants:

* Deve appartenere allo stesso contesto del parent `Module`.
* Its `status` must not be `'errored'`.

If the returned `Module`'s `status` is `'unlinked'`, this method will be recursively called on the returned `Module` with the same provided `linker` function.

`link()` returns a `Promise` that will either get resolved when all linking instances resolve to a valid `Module`, or rejected if the linker function either throws an exception or returns an invalid `Module`.

The linker function roughly corresponds to the implementation-defined [HostResolveImportedModule](https://tc39.es/ecma262/#sec-hostresolveimportedmodule) abstract operation in the ECMAScript specification, with a few key differences:

* The linker function is allowed to be asynchronous while [HostResolveImportedModule](https://tc39.es/ecma262/#sec-hostresolveimportedmodule) is synchronous.

The actual [HostResolveImportedModule](https://tc39.es/ecma262/#sec-hostresolveimportedmodule) implementation used during module linking is one that returns the modules linked during linking. Since at that point all modules would have been fully linked already, the [HostResolveImportedModule](https://tc39.es/ecma262/#sec-hostresolveimportedmodule) implementation is fully synchronous per specification.

Corresponds to the [Link() concrete method](https://tc39.es/ecma262/#sec-moduledeclarationlinking) field of \[Cyclic Module Record\]\[\]s in the ECMAScript specification.

### `module.namespace`

* {Object}

Il namespace object del modulo. This is only available after linking (`module.link()`) has completed.

Corresponds to the [GetModuleNamespace](https://tc39.es/ecma262/#sec-getmodulenamespace) abstract operation in the ECMAScript specification.

### `module.status`

* {string}

Lo stato attuale del modulo. Sarà uno di:

* `'unlinked'`: `module.link()` non è ancora stato chiamato.

* `'linking'`: `module.link()` has been called, but not all Promises returned by the linker function have been resolved yet.

* `'linked'`: The module has been linked successfully, and all of its dependencies are linked, but `module.evaluate()` has not yet been called.

* `'evaluating'`: The module is being evaluated through a `module.evaluate()` on itself or a parent module.

* `'evaluated'`: Il modulo è stato valutato correttamente.

* `'errored'`: Il modulo è stato valutato, tuttavia è stata generata un'eccezione.

Other than `'errored'`, this status string corresponds to the specification's [Cyclic Module Record](https://tc39.es/ecma262/#sec-cyclic-module-records)'s `[[Status]]` field. `'errored'` corresponds to `'evaluated'` in the specification, but with `[[EvaluationError]]` set to a value that is not `undefined`.

### `module.identifier`

* {string}

The identifier of the current module, as set in the constructor.

## Class: `vm.SourceTextModule`
<!-- YAML
added: v9.6.0
-->

> Stabilità: 1 - Sperimentale

*This feature is only available with the `--experimental-vm-modules` command flag enabled.*

* Extends: {vm.Module}

The `vm.SourceTextModule` class provides the [Source Text Module Record](https://tc39.es/ecma262/#sec-source-text-module-records) as defined in the ECMAScript specification.

### Constructor: `new vm.SourceTextModule(code[, options])`

* `code` {string} Codice di JavaScript Module da analizzare
* `options`
  * `identifier` {string} String used in stack traces. **Default:** `'vm:module(i)'` where `i` is a context-specific ascending index.
  * `context` {Object} The [contextified](#vm_what_does_it_mean_to_contextify_an_object) object as returned by the `vm.createContext()` method, to compile and evaluate this `Module` in.
  * `lineOffset` {integer} Specifies the line number offset that is displayed in stack traces produced by this `Module`. **Default:** `0`.
  * `columnOffset` {integer} Specifies the column number offset that is displayed in stack traces produced by this `Module`. **Default:** `0`.
  * `initializeImportMeta` {Function} Called during evaluation of this `Module` to initialize the `import.meta`.
    * `meta` {import.meta}
    * `module` {vm.SourceTextModule}
  * `importModuleDynamically` {Function} Called during evaluation of this module when `import()` is called. If this option is not specified, calls to `import()` will reject with [`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`][].
    * `specifier` {string} specifier passed to `import()`
    * `module` {vm.Module}
    * Returns: {Module Namespace Object|vm.Module} Returning a `vm.Module` is recommended in order to take advantage of error tracking, and to avoid issues with namespaces that contain `then` function exports.

Creates a new `SourceTextModule` instance.

Properties assigned to the `import.meta` object that are objects may allow the module to access information outside the specified `context`. Use `vm.runInContext()` to create objects in a specific context.

```js
const vm = require('vm');

const contextifiedObject = vm.createContext({ secret: 42 });

(async () => {
  const module = new vm.SourceTextModule(
    'Object.getPrototypeOf(import.meta.prop).secret = secret;',
    {
      initializeImportMeta(meta) {
        // Note: this object is created in the top context. As such,
        // Object.getPrototypeOf(import.meta.prop) points to the
        // Object.prototype in the top context rather than that in
        // the contextified object.
        meta.prop = {};
      }
    });
  // Dato che il modulo non ha dipendenze, la funzione linker non verrà mai chiamata.
  await module.link(() => {});
  await module.evaluate();

  // Now, Object.prototype.secret will be equal to 42.
  //
  // To fix this problem, replace
  //     meta.prop = {};
  // above with
  //     meta.prop = vm.runInContext('{}', contextifiedObject);
})();
```

## Class: `vm.SyntheticModule`
<!-- YAML
added: v12.16.0
-->

> Stabilità: 1 - Sperimentale

*This feature is only available with the `--experimental-vm-modules` command flag enabled.*

* Extends: {vm.Module}

The `vm.SyntheticModule` class provides the [Synthetic Module Record](https://heycam.github.io/webidl/#synthetic-module-records) as defined in the WebIDL specification. The purpose of synthetic modules is to provide a generic interface for exposing non-JavaScript sources to ECMAScript module graphs.

```js
const vm = require('vm');

const source = '{ "a": 1 }';
const module = new vm.SyntheticModule(['default'], function() {
  const obj = JSON.parse(source);
  this.setExport('default', obj);
});

// Use `module` in linking...
```

### Constructor: `new vm.SyntheticModule(exportNames, evaluateCallback[, options])`
<!-- YAML
added: v12.16.0
-->

* `exportNames` {string[]} Array of names that will be exported from the module.
* `evaluateCallback` {Function} Called when the module is evaluated.
* `options`
  * `identifier` {string} String used in stack traces. **Default:** `'vm:module(i)'` where `i` is a context-specific ascending index.
  * `context` {Object} The [contextified](#vm_what_does_it_mean_to_contextify_an_object) object as returned by the `vm.createContext()` method, to compile and evaluate this `Module` in.

Creates a new `SyntheticModule` instance.

Objects assigned to the exports of this instance may allow importers of the module to access information outside the specified `context`. Use `vm.runInContext()` to create objects in a specific context.

### `syntheticModule.setExport(name, value)`
<!-- YAML
added: v12.16.0
-->

* `name` {string} Name of the export to set.
* `value` {any} The value to set the export to.

This method is used after the module is linked to set the values of exports. If it is called before the module is linked, an [`ERR_VM_MODULE_STATUS`][] error will be thrown.

```js
const vm = require('vm');

(async () => {
  const m = new vm.SyntheticModule(['x'], () => {
    m.setExport('x', 1);
  });

  await m.link(() => {});
  await m.evaluate();

  assert.strictEqual(m.namespace.x, 1);
})();
```

## `vm.compileFunction(code[, params[, options]])`
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
  * `parsingContext` {Object} The [contextified](#vm_what_does_it_mean_to_contextify_an_object) object in which the said function should be compiled in.
  * `contextExtensions` {Object[]} An array containing a collection of context extensions (objects wrapping the current scope) to be applied while compiling. **Default:** `[]`.
* Restituisce: {Function}

Compiles the given code into the provided context (if no context is supplied, the current context is used), and returns it wrapped inside a function with the given `params`.

## `vm.createContext([contextObject[, options]])`
<!-- YAML
added: v0.3.1
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19398
    description: The first argument can no longer be a function.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19016
    description: The `codeGeneration` option is supported now.
-->

* `contextObject` {Object}
* `options` {Object}
  * `name` {string} Nome in forma leggibile del contesto appena creato. **Default:** `'VM Context i'`, where `i` is an ascending numerical index of the created context.
  * `origin` {string} [Origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin) corresponding to the newly created context for display purposes. The origin should be formatted like a URL, but with only the scheme, host, and port (if necessary), like the value of the [`url.origin`][] property of a [`URL`][] object. Most notably, this string should omit the trailing slash, as that denotes a path. **Default:** `''`.
  * `codeGeneration` {Object}
    * `strings` {boolean} If set to false any calls to `eval` or function constructors (`Function`, `GeneratorFunction`, etc) will throw an `EvalError`. **Default:** `true`.
    * `wasm` {boolean} If set to false any attempt to compile a WebAssembly module will throw a `WebAssembly.CompileError`. **Default:** `true`.
* Returns: {Object} contextified object.

If given a `contextObject`, the `vm.createContext()` method will [prepare that object](#vm_what_does_it_mean_to_contextify_an_object) so that it can be used in calls to [`vm.runInContext()`][] or [`script.runInContext()`][]. Inside such scripts, the `contextObject` will be the global object, retaining all of its existing properties but also having the built-in objects and functions any standard [global object](https://es5.github.io/#x15.1) has. Al di fuori degli script eseguiti dal modulo vm, le variabili globali rimarranno invariate.

```js
const util = require('util');
const vm = require('vm');

global.globalVar = 3;

const context = { globalVar: 1 };
vm.createContext(context);

vm.runInContext('globalVar *= 2;', context);

console.log(util.inspect(context)); // { globalVar: 2 }

console.log(util.inspect(globalVar)); // 3
```

If `contextObject` is omitted (or passed explicitly as `undefined`), a new, empty [contextified](#vm_what_does_it_mean_to_contextify_an_object) object will be returned.

The `vm.createContext()` method is primarily useful for creating a single context that can be used to run multiple scripts. For instance, if emulating a web browser, the method can be used to create a single context representing a window's global object, then run all `<script>` tags together within that context.

The provided `name` and `origin` of the context are made visible through the Inspector API.

## `vm.isContext(object)`
<!-- YAML
added: v0.11.7
-->

* `object` {Object}
* Restituisce: {boolean}

Returns `true` if the given `oject` object has been [contextified](#vm_what_does_it_mean_to_contextify_an_object) using [`vm.createContext()`][].

## `vm.runInContext(code, contextifiedObject[, options])`
<!-- YAML
added: v0.3.1
changes:
  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/6635
    description: The `breakOnSigint` option is supported now.
-->

* `code` {string} Il codice JavaScript da compilare ed eseguire.
* `contextifiedObject` {Object} The [contextified](#vm_what_does_it_mean_to_contextify_an_object) object that will be used as the `global` when the `code` is compiled and run.
* `options` {Object|string}
  * `filename` {string} Specifica il filename utilizzato nelle stack trace prodotte da questo script. **Default:** `'evalmachine.<anonymous>'`.
  * `lineOffset` {number} Specifica l'offset del numero di riga che viene visualizzato nelle stack trace prodotte da questo script. **Default:** `0`.
  * `columnOffset` {number} Specifica l'offset del numero di colonna che viene visualizzato nelle stack trace prodotte da questo script. **Default:** `0`.
  * `displayErrors` {boolean} When `true`, if an [`Error`][] occurs while compiling the `code`, the line of code causing the error is attached to the stack trace. **Default:** `true`.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Se l'esecuzione è terminata, verrà generato un [`Error`][]. This value must be a strictly positive integer.
  * `breakOnSigint` {boolean} If `true`, the execution will be terminated when `SIGINT` (Ctrl+C) is received. Gli handler esistenti per l'evento che è stato collegato tramite `process.on('SIGINT')` verranno disabilitati durante l'esecuzione dello script, tuttavia dopo ciò continueranno a funzionare. If execution is terminated, an [`Error`][] will be thrown. **Default:** `false`.
  * `cachedData` {Buffer|TypedArray|DataView} Provides an optional `Buffer` or `TypedArray`, or `DataView` with V8's code cache data for the supplied source. When supplied, the `cachedDataRejected` value will be set to either `true` or `false` depending on acceptance of the data by V8.
  * `produceCachedData` {boolean} Quando è `true` e nessun `cachedData` è presente, V8 cercherà di produrre dati della cache del codice per `code`. In caso di successo, un `Buffer` con i dati della cache del codice di V8 verrà prodotto e memorizzato nella proprietà `cachedData` dell'istanza `vm.Script` restituita. Il valore `cachedDataProduced` sarà impostato su `true` o `false` a seconda del fatto che i dati della cache del codice vengano prodotti correttamente o meno. This option is **deprecated** in favor of `script.createCachedData()`. **Default:** `false`.
  * `importModuleDynamically` {Function} Called during evaluation of this module when `import()` is called. If this option is not specified, calls to `import()` will reject with [`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`][]. This option is part of the experimental API for the `--experimental-modules` flag, and should not be considered stable.
    * `specifier` {string} specifier passed to `import()`
    * `module` {vm.Module}
    * Returns: {Module Namespace Object|vm.Module} Returning a `vm.Module` is recommended in order to take advantage of error tracking, and to avoid issues with namespaces that contain `then` function exports.
* Returns: {any} the result of the very last statement executed in the script.

The `vm.runInContext()` method compiles `code`, runs it within the context of the `contextifiedObject`, then returns the result. L'esecuzione del codice non ha accesso allo scope locale. The `contextifiedObject` object *must* have been previously [contextified](#vm_what_does_it_mean_to_contextify_an_object) using the [`vm.createContext()`][] method.

Se `options` è una stringa, allora specifica il filename.

Il seguente esempio compila ed esegue script differenti utilizzando un singolo object che [ha subito il contextify](#vm_what_does_it_mean_to_contextify_an_object):

```js
const util = require('util');
const vm = require('vm');

const contextObject = { globalVar: 1 };
vm.createContext(contextObject);

for (let i = 0; i < 10; ++i) {
  vm.runInContext('globalVar *= 2;', contextObject);
}
console.log(util.inspect(contextObject));

// { globalVar: 1024 }
```

## `vm.runInNewContext(code[, contextObject[, options]])`
<!-- YAML
added: v0.3.1
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19016
    description: The `contextCodeGeneration` option is supported now.
  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/6635
    description: The `breakOnSigint` option is supported now.
-->

* `code` {string} Il codice JavaScript da compilare ed eseguire.
* `contextObject` {Object} An object that will be [contextified](#vm_what_does_it_mean_to_contextify_an_object). If `undefined`, a new object will be created.
* `options` {Object|string}
  * `filename` {string} Specifica il filename utilizzato nelle stack trace prodotte da questo script. **Default:** `'evalmachine.<anonymous>'`.
  * `lineOffset` {number} Specifica l'offset del numero di riga che viene visualizzato nelle stack trace prodotte da questo script. **Default:** `0`.
  * `columnOffset` {number} Specifica l'offset del numero di colonna che viene visualizzato nelle stack trace prodotte da questo script. **Default:** `0`.
  * `displayErrors` {boolean} When `true`, if an [`Error`][] occurs while compiling the `code`, the line of code causing the error is attached to the stack trace. **Default:** `true`.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Se l'esecuzione è terminata, verrà generato un [`Error`][]. This value must be a strictly positive integer.
  * `breakOnSigint` {boolean} If `true`, the execution will be terminated when `SIGINT` (Ctrl+C) is received. Gli handler esistenti per l'evento che è stato collegato tramite `process.on('SIGINT')` verranno disabilitati durante l'esecuzione dello script, tuttavia dopo ciò continueranno a funzionare. If execution is terminated, an [`Error`][] will be thrown. **Default:** `false`.
  * `contextName` {string} Nome in forma leggibile del contesto appena creato. **Default:** `'VM Context i'`, where `i` is an ascending numerical index of the created context.
  * `contextOrigin` {string} [Origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin) corresponding to the newly created context for display purposes. The origin should be formatted like a URL, but with only the scheme, host, and port (if necessary), like the value of the [`url.origin`][] property of a [`URL`][] object. Most notably, this string should omit the trailing slash, as that denotes a path. **Default:** `''`.
  * `contextCodeGeneration` {Object}
    * `strings` {boolean} If set to false any calls to `eval` or function constructors (`Function`, `GeneratorFunction`, etc) will throw an `EvalError`. **Default:** `true`.
    * `wasm` {boolean} If set to false any attempt to compile a WebAssembly module will throw a `WebAssembly.CompileError`. **Default:** `true`.
  * `cachedData` {Buffer|TypedArray|DataView} Provides an optional `Buffer` or `TypedArray`, or `DataView` with V8's code cache data for the supplied source. When supplied, the `cachedDataRejected` value will be set to either `true` or `false` depending on acceptance of the data by V8.
  * `produceCachedData` {boolean} Quando è `true` e nessun `cachedData` è presente, V8 cercherà di produrre dati della cache del codice per `code`. In caso di successo, un `Buffer` con i dati della cache del codice di V8 verrà prodotto e memorizzato nella proprietà `cachedData` dell'istanza `vm.Script` restituita. Il valore `cachedDataProduced` sarà impostato su `true` o `false` a seconda del fatto che i dati della cache del codice vengano prodotti correttamente o meno. This option is **deprecated** in favor of `script.createCachedData()`. **Default:** `false`.
  * `importModuleDynamically` {Function} Called during evaluation of this module when `import()` is called. If this option is not specified, calls to `import()` will reject with [`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`][]. This option is part of the experimental API for the `--experimental-modules` flag, and should not be considered stable.
    * `specifier` {string} specifier passed to `import()`
    * `module` {vm.Module}
    * Returns: {Module Namespace Object|vm.Module} Returning a `vm.Module` is recommended in order to take advantage of error tracking, and to avoid issues with namespaces that contain `then` function exports.
* Returns: {any} the result of the very last statement executed in the script.

The `vm.runInNewContext()` first contextifies the given `contextObject` (or creates a new `contextObject` if passed as `undefined`), compiles the `code`, runs it within the created context, then returns the result. L'esecuzione del codice non ha accesso allo scope locale.

Se `options` è una stringa, allora specifica il filename.

Il seguente esempio compila ed esegue il codice che incrementa una variabile globale e ne imposta una nuova. These globals are contained in the `contextObject`.

```js
const util = require('util');
const vm = require('vm');

const contextObject = {
  animal: 'cat',
  count: 2
};

vm.runInNewContext('count += 1; name = "kitty"', contextObject);
console.log(util.inspect(contextObject));

// { animal: 'cat', count: 3, name: 'kitty' }
```

## `vm.runInThisContext(code[, options])`
<!-- YAML
added: v0.3.1
changes:
  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/6635
    description: The `breakOnSigint` option is supported now.
-->

* `code` {string} Il codice JavaScript da compilare ed eseguire.
* `options` {Object|string}
  * `filename` {string} Specifica il filename utilizzato nelle stack trace prodotte da questo script. **Default:** `'evalmachine.<anonymous>'`.
  * `lineOffset` {number} Specifica l'offset del numero di riga che viene visualizzato nelle stack trace prodotte da questo script. **Default:** `0`.
  * `columnOffset` {number} Specifica l'offset del numero di colonna che viene visualizzato nelle stack trace prodotte da questo script. **Default:** `0`.
  * `displayErrors` {boolean} When `true`, if an [`Error`][] occurs while compiling the `code`, the line of code causing the error is attached to the stack trace. **Default:** `true`.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Se l'esecuzione è terminata, verrà generato un [`Error`][]. This value must be a strictly positive integer.
  * `breakOnSigint` {boolean} If `true`, the execution will be terminated when `SIGINT` (Ctrl+C) is received. Gli handler esistenti per l'evento che è stato collegato tramite `process.on('SIGINT')` verranno disabilitati durante l'esecuzione dello script, tuttavia dopo ciò continueranno a funzionare. If execution is terminated, an [`Error`][] will be thrown. **Default:** `false`.
  * `cachedData` {Buffer|TypedArray|DataView} Provides an optional `Buffer` or `TypedArray`, or `DataView` with V8's code cache data for the supplied source. When supplied, the `cachedDataRejected` value will be set to either `true` or `false` depending on acceptance of the data by V8.
  * `produceCachedData` {boolean} Quando è `true` e nessun `cachedData` è presente, V8 cercherà di produrre dati della cache del codice per `code`. In caso di successo, un `Buffer` con i dati della cache del codice di V8 verrà prodotto e memorizzato nella proprietà `cachedData` dell'istanza `vm.Script` restituita. Il valore `cachedDataProduced` sarà impostato su `true` o `false` a seconda del fatto che i dati della cache del codice vengano prodotti correttamente o meno. This option is **deprecated** in favor of `script.createCachedData()`. **Default:** `false`.
  * `importModuleDynamically` {Function} Called during evaluation of this module when `import()` is called. If this option is not specified, calls to `import()` will reject with [`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`][]. This option is part of the experimental API for the `--experimental-modules` flag, and should not be considered stable.
    * `specifier` {string} specifier passed to `import()`
    * `module` {vm.Module}
    * Returns: {Module Namespace Object|vm.Module} Returning a `vm.Module` is recommended in order to take advantage of error tracking, and to avoid issues with namespaces that contain `then` function exports.
* Returns: {any} the result of the very last statement executed in the script.

`vm.runInThisContext()` compila il `code`, lo esegue all'interno del contesto del `global` corrente e restituisce il risultato. L'esecuzione del codice non ha accesso allo scope locale, tuttavia ha accesso al `global` object corrente.

Se `options` è una stringa, allora specifica il filename.

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

Poiché `vm.runInThisContext()` non ha accesso allo scope locale, `localVar` è invariato. In contrast, [`eval()`][] *does* have access to the local scope, so the value `localVar` is changed. In questo modo `vm.runInThisContext()` è molto simile a un [indirect `eval()` call][], ad esempio `(0,eval)('code')`.

## Esempio: Esecuzione di un Server HTTP all'interno di una VM

When using either [`script.runInThisContext()`][] or [`vm.runInThisContext()`][], the code is executed within the current V8 global context. Il codice passato a questo contesto della VM avrà un proprio scope isolato.

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

Tutto il JavaScript eseguito all'interno di Node.js funziona all'interno dello scope di un "contesto". According to the [V8 Embedder's Guide](https://v8.dev/docs/embed#contexts):

> In V8, un contesto è un ambiente di esecuzione che permette di eseguire applicazioni JavaScript separate e non correlate in una singola istanza di V8. È necessario specificare esplicitamente il contesto in cui si desidera che venga eseguito qualsiasi codice JavaScript.

When the method `vm.createContext()` is called, the `contextObject` argument (or a newly-created object if `contextObject` is `undefined`) is associated internally with a new instance of a V8 Context. This V8 Context provides the `code` run using the `vm` module's methods with an isolated global environment within which it can operate. The process of creating the V8 Context and associating it with the `contextObject` is what this document refers to as "contextifying" the object.

## Timeout limitations when using `process.nextTick()`, Promises, and `queueMicrotask()`

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

This issue also occurs when the `loop()` call is scheduled using the `process.nextTick()` and `queueMicrotask()` functions.

This issue occurs because all contexts share the same microtask and nextTick queues.
