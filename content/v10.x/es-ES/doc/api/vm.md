# VM (Ejecutando JavaScript)

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

<!--name=vm-->

The `vm` module provides APIs for compiling and running code within V8 Virtual Machine contexts. **The `vm` module is not a security mechanism. Do not use it to run untrusted code**. The term "sandbox" is used throughout these docs simply to refer to a separate context, and does not confer any security guarantees.

JavaScript code can be compiled and run immediately or compiled, saved, and run later.

Un caso de uso común es ejecutar el código en un entorno de pruebas (sandbox). The sandboxed code uses a different V8 Context, meaning that it has a different global object than the rest of the code.

One can provide the context by ["contextifying"](#vm_what_does_it_mean_to_contextify_an_object) a sandbox object. The sandboxed code treats any property in the sandbox like a global variable. Any changes to global variables caused by the sandboxed code are reflected in the sandbox object.

```js
const vm = require('vm');

const x = 1;

const sandbox = { x: 2 };
vm.createContext(sandbox); // Contextualiza al sandbox.

const code = 'x += 40; var y = 17;';
// x y y son variables globales en el entorno de prueba.
// Inicialmente, x tiene el valor 2 porque ese es el valor de sandbox.x.
vm.runInContext(code, sandbox);

console.log(sandbox.x); // 42
console.log(sandbox.y); // 17

console.log(x); // 1; y no está definido.
```

## Class: vm.SourceTextModule

<!-- YAML
added: v9.6.0
-->

> Estabilidad: 1 - Experimental

*This feature is only available with the `--experimental-vm-modules` command flag enabled.*

The `vm.SourceTextModule` class provides a low-level interface for using ECMAScript modules in VM contexts. It is the counterpart of the `vm.Script` class that closely mirrors [Source Text Module Record](https://tc39.github.io/ecma262/#sec-source-text-module-records)s as defined in the ECMAScript specification.

Unlike `vm.Script` however, every `vm.SourceTextModule` object is bound to a context from its creation. Operations on `vm.SourceTextModule` objects are intrinsically asynchronous, in contrast with the synchronous nature of `vm.Script` objects. With the help of async functions, however, manipulating `vm.SourceTextModule` objects is fairly straightforward.

Using a `vm.SourceTextModule` object requires four distinct steps: creation/parsing, linking, instantiation, and evaluation. These four steps are illustrated in the following example.

This implementation lies at a lower level than the \[ECMAScript Module loader\]\[\]. There is also currently no way to interact with the Loader, though support is planned.

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
  // Aquí, intentamos obtener la exportación predeterminada del módulo "foo", y
  // colocarla en el enlace local "secreto".

  const bar = new vm.SourceTextModule(`
    import s from 'foo';
    s;
  `, { context: contextifiedSandbox });

  // Step 2
  //
  // "Link" the imported dependencies of this Module to it.
  //
  // La devolución de enlace proporcionada (el "enlazador") acepta dos argumentos:
  // el módulo principal (`bar` en este caso) y la cadena que es el especificador del
  // módulo importado. Se espera la devolución para retornar un Módulo que
  // corresponde al especificador proporcionado, con ciertos requisitos documentados
  // en `module.link()`.
  //
  // Si no se ha iniciado el enlace para el Módulo devuelto, se llamará al mismo
  // callback del enlazador en el Módulo retornado.
  //
  // Incluso los Módulos de nivel superior sin dependencias deben estar explícitamente enlazados. Sin
  // embargo, el callback proporcionado nunca se llamaría.
  //
  // El método link() devuelve una Promesa que se resolverá cuando se resuelvan
  // todas las Promesas devueltas por el enlazador.
  //
  // Nota: Esto es un ejemplo ingenioso en el que la función del enlazador crea un nuevo
  // módulo "foo" cada vez que se llama. En un sistema de módulo completamente desarrollado, probablemente
  // se utilizaría un caché para evitar los módulos duplicados.

  async function linker(specifier, referencingModule) {
    if (specifier === 'foo') {
      return new vm.SourceTextModule(`
        // The "secret" variable refers to the global variable we added to
        // "contextifiedSandbox" when creating the context.
        export default secret;
      `, { context: referencingModule.context });

      // Utilizar `contextifiedSandbox` en lugar de `referencingModule.context`
      // también funcionaría aquí.
    }
    throw new Error(`Unable to resolve dependency: ${specifier}`);
  }
  await bar.link(linker);

  // Paso 3
  //
  // Crear una instancia de Módulo de nivel superior.
  //
  // Solo el Módulo de nivel superior necesita ser instanciado explícitamente; sus
  // dependencias se instanciarán recursivamente por instantiate().

  bar.instantiate();

  // Paso 4
  //
  // Evaluar el Módulo. El método evaluate() devuelve una Promesa con un sola
  // propiedad "resultado" que contiene el resultado de cada última declaración
  // ejecutada en el Módulo. En el caso de `bar`, es `s;`, que se refiere a
  // la exportación predeterminada del módulo `foo`, el `secret` que establecemos al
  // comienzo en 42.

  const { result } = await bar.evaluate();

  console.log(result);
  // Imprime 42.
})();
```

### Constructor: new vm.SourceTextModule(code[, options])

* `code` {string} Código del Módulo JavaScript para analizar
* `options` 
  * `url` {string} URL utilizado en la resolución de módulo y stack traces. **Default:** `'vm:module(i)'` where `i` is a context-specific ascending index.
  * `context` {Object} The [contextified](#vm_what_does_it_mean_to_contextify_an_object) object as returned by the `vm.createContext()` method, to compile and evaluate this `Module` in.
  * `lineOffset` {integer} Specifies the line number offset that is displayed in stack traces produced by this `Module`.
  * `columnOffset` {integer} Specifies the column number offset that is displayed in stack traces produced by this `Module`.
  * `initializeImportMeta` {Function} Called during evaluation of this `Module` to initialize the `import.meta`. This function has the signature `(meta,
module)`, where `meta` is the `import.meta` object in the `Module`, and `module` is this `vm.SourceTextModule` object.
  * `importModuleDynamically` {Function} Called during evaluation of this module when `import()` is called. This function has the signature `(specifier, module)` where `specifier` is the specifier passed to `import()` and `module` is this `vm.SourceTextModule`. If this option is not specified, calls to `import()` will reject with [`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`][]. This method can return a [Module Namespace Object](https://tc39.github.io/ecma262/#sec-module-namespace-exotic-objects), but returning a `vm.SourceTextModule` is recommended in order to take advantage of error tracking, and to avoid issues with namespaces that contain `then` function exports.

Crea un nuevo objeto ES `Module`.

Properties assigned to the `import.meta` object that are objects may allow the `Module` to access information outside the specified `context`, if the object is created in the top level context. Use `vm.runInContext()` to create objects in a specific context.

```js
const vm = require('vm');

const contextifiedSandbox = vm.createContext({ secret: 42 });

(async () => {
  const module = new vm.SourceTextModule(
    'Object.getPrototypeOf(import.meta.prop).secret = secret;',
    {
      initializeImportMeta(meta) {
        // Note: this object is created in the top context. Como tal,
        // Object.getPrototypeOf(import.meta.prop) apunta al
        // Object.prototype en el contexto superior, en lugar de en
        // el sandbox.
        meta.prop = {};
      }
    });
  // Ya que el módulo no tiene dependencias, la función del enlazador nunca se llamará.
  await module.link(() => {});
  module.instantiate();
  await module.evaluate();

  // Ahora, Object.prototype.secret será igual a 42.
  //
  // Para solucionar este problema, reemplace el
  //     meta.prop = {};
  // anterior con
  //     meta.prop = vm.runInContext('{}', contextifiedSandbox);
})();
```

### module.dependencySpecifiers

* {string[]}

Los especificadores de todas las dependencias de este módulo. The returned array is frozen to disallow any changes to it.

Corresponds to the `[[RequestedModules]]` field of [Source Text Module Record](https://tc39.github.io/ecma262/#sec-source-text-module-records)s in the ECMAScript specification.

### module.error

* {any}

If the `module.status` is `'errored'`, this property contains the exception thrown by the module during evaluation. If the status is anything else, accessing this property will result in a thrown exception.

The value `undefined` cannot be used for cases where there is not a thrown exception due to possible ambiguity with `throw undefined;`.

Corresponds to the `[[EvaluationError]]` field of [Source Text Module Record](https://tc39.github.io/ecma262/#sec-source-text-module-records)s in the ECMAScript specification.

### module.evaluate([options])

* `options` {Object} 
  * `timeout` {integer} Specifies the number of milliseconds to evaluate before terminating execution. If execution is interrupted, an [`Error`][] will be thrown. This value must be a strictly positive integer.
  * `breakOnSigint` {boolean} If `true`, the execution will be terminated when `SIGINT` (Ctrl+C) is received. Existing handlers for the event that have been attached via `process.on('SIGINT')` will be disabled during script execution, but will continue to work after that. If execution is interrupted, an [`Error`][] will be thrown.
* Devuelve: {Promise}

Evaluar el módulo.

This must be called after the module has been instantiated; otherwise it will throw an error. It could be called also when the module has already been evaluated, in which case it will do one of the following two things:

* return `undefined` if the initial evaluation ended in success (`module.status` is `'evaluated'`)
* rethrow the same exception the initial evaluation threw if the initial evaluation ended in an error (`module.status` is `'errored'`)

This method cannot be called while the module is being evaluated (`module.status` is `'evaluating'`) to prevent infinite recursion.

Corresponds to the [Evaluate() concrete method](https://tc39.github.io/ecma262/#sec-moduleevaluation) field of \[Source Text Module Record\]\[\]s in the ECMAScript specification.

### module.instantiate()

Instanciar el módulo. This must be called after linking has completed (`linkingStatus` is `'linked'`); otherwise it will throw an error. It may also throw an exception if one of the dependencies does not provide an export the parent module requires.

However, if this function succeeded, further calls to this function after the initial instantiation will be no-ops, to be consistent with the ECMAScript specification.

Unlike other methods operating on `Module`, this function completes synchronously and returns nothing.

Corresponds to the [Instantiate() concrete method](https://tc39.github.io/ecma262/#sec-moduledeclarationinstantiation) field of \[Source Text Module Record\]\[\]s in the ECMAScript specification.

### module.link(linker)

* `linker` {Function}
* Devuelve: {Promise}

Dependencias del módulo de enlace. This method must be called before instantiation, and can only be called once per module.

Dos parámetros se pasarán a la función `linker`:

* `specifier` El especificador del módulo requerido: <!-- eslint-skip -->
  
      js
      import foo from 'foo';
      //              ^^^^^ el especificador del módulo

* `referencingModule` El `link()` del objeto `Module` que es llamado.

The function is expected to return a `Module` object or a `Promise` that eventually resolves to a `Module` object. The returned `Module` must satisfy the following two invariants:

* Debe pertenecer al mismo contexto que el `Module` principal.
* Su `linkingStatus` no debe ser `'errored'`.

If the returned `Module`'s `linkingStatus` is `'unlinked'`, this method will be recursively called on the returned `Module` with the same provided `linker` function.

`link()` returns a `Promise` that will either get resolved when all linking instances resolve to a valid `Module`, or rejected if the linker function either throws an exception or returns an invalid `Module`.

The linker function roughly corresponds to the implementation-defined [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) abstract operation in the ECMAScript specification, with a few key differences:

* The linker function is allowed to be asynchronous while [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) is synchronous.
* The linker function is executed during linking, a Node.js-specific stage before instantiation, while [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) is called during instantiation.

The actual [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) implementation used during module instantiation is one that returns the modules linked during linking. Since at that point all modules would have been fully linked already, the [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) implementation is fully synchronous per specification.

### module.linkingStatus

* {string}

El estatus de vinculación actual del `module`. Será uno de los siguientes valores:

* `'unlinked'`: `module.link()` todavía no ha sido llamado.
* `'linking'`: `module.link()` has been called, but not all Promises returned by the linker function have been resolved yet.
* `'linked'`: `module.link()` has been called, and all its dependencies have been successfully linked.
* `'errored'`: `module.link()` has been called, but at least one of its dependencies failed to link, either because the callback returned a `Promise` that is rejected, or because the `Module` the callback returned is invalid.

### module.namespace

* {Object}

El objeto namespace del módulo. This is only available after instantiation (`module.instantiate()`) has completed.

Corresponds to the [GetModuleNamespace](https://tc39.github.io/ecma262/#sec-getmodulenamespace) abstract operation in the ECMAScript specification.

### module.status

* {string}

El estatus actual del módulo. Será uno de:

* `'uninstantiated'`: El módulo no está instanciado. It may because of any of the following reasons:
  
  * El módulo se acaba de crear.
  * `module.instantiate()` has been called on this module, but it failed for some reason.
  
  This status does not convey any information regarding if `module.link()` has been called. Vea `module.linkingStatus` para eso.

* `'instantiating'`: The module is currently being instantiated through a `module.instantiate()` call on itself or a parent module.

* `'instantiated'`: The module has been instantiated successfully, but `module.evaluate()` has not yet been called.

* `'evaluating'`: The module is being evaluated through a `module.evaluate()` on itself or a parent module.

* `'evaluated'`: El módulo ha sido evaluado exitosamente.

* `'errored'`: El módulo ha sido evaluado, pero se lanzó una excepción.

Other than `'errored'`, this status string corresponds to the specification's [Source Text Module Record](https://tc39.github.io/ecma262/#sec-source-text-module-records)'s `[[Status]]` field. `'errored'` corresponds to `'evaluated'` in the specification, but with `[[EvaluationError]]` set to a value that is not `undefined`.

### module.url

* {string}

El URL del módulo actual, como se configura en el constructor.

## Clase: vm.Script

<!-- YAML
added: v0.3.1
-->

Instances of the `vm.Script` class contain precompiled scripts that can be executed in specific sandboxes (or "contexts").

### nuevo vm.Script(code, options)

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

* `code` {string} El código JavaScript para compilar.
* `options` 
  * `filename` {string} Specifies the filename used in stack traces produced by this script.
  * `lineOffset` {number} Specifies the line number offset that is displayed in stack traces produced by this script.
  * `columnOffset` {number} Specifies the column number offset that is displayed in stack traces produced by this script.
  * `cachedData` {Buffer|TypedArray|DataView} Provides an optional `Buffer` or `TypedArray`, or `DataView` with V8's code cache data for the supplied source. When supplied, the `cachedDataRejected` value will be set to either `true` or `false` depending on acceptance of the data by V8.
  * `produceCachedData` {boolean} When `true` and no `cachedData` is present, V8 will attempt to produce code cache data for `code`. Upon success, a `Buffer` with V8's code cache data will be produced and stored in the `cachedData` property of the returned `vm.Script` instance. The `cachedDataProduced` value will be set to either `true` or `false` depending on whether code cache data is produced successfully. This option is deprecated in favor of `script.createCachedData()`.
  * `importModuleDynamically` {Function} Called during evaluation of this module when `import()` is called. This function has the signature `(specifier, module)` where `specifier` is the specifier passed to `import()` and `module` is this `vm.SourceTextModule`. If this option is not specified, calls to `import()` will reject with [`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`][]. This method can return a [Module Namespace Object](https://tc39.github.io/ecma262/#sec-module-namespace-exotic-objects), but returning a `vm.SourceTextModule` is recommended in order to take advantage of error tracking, and to avoid issues with namespaces that contain `then` function exports.

La creación de un nuevo objeto `vm.Script` compila el `code` pero no lo ejecuta. The compiled `vm.Script` can be run later multiple times. The `code` is not bound to any global object; rather, it is bound before each run, just for that run.

### script.createCachedData()

<!-- YAML
added: v10.6.0
-->

* Devuelve: {Buffer}

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

### script.runInContext(contextifiedSandbox[, opciones])

<!-- YAML
added: v0.3.1
changes:

  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/6635
    description: The `breakOnSigint` option is supported now.
-->

* `contextifiedSandbox` {Object} A [contextified](#vm_what_does_it_mean_to_contextify_an_object) object as returned by the `vm.createContext()` method.
* `options` {Object} 
  * `filename` {string} Specifies the filename used in stack traces produced by this script.
  * `lineOffset` {number} Specifies the line number offset that is displayed in stack traces produced by this script.
  * `columnOffset` {number} Specifies the column number offset that is displayed in stack traces produced by this script.
  * `displayErrors` {boolean} When `true`, if an [`Error`][] error occurs while compiling the `code`, the line of code causing the error is attached to the stack trace.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Si se termina la ejecución, se arrojará un [`Error`][]. This value must be a strictly positive integer.
  * `breakOnSigint`: if `true`, the execution will be terminated when `SIGINT` (Ctrl+C) is received. Existing handlers for the event that have been attached via `process.on('SIGINT')` will be disabled during script execution, but will continue to work after that. Si se termina la ejecución, se producirá un [`Error`][].

Runs the compiled code contained by the `vm.Script` object within the given `contextifiedSandbox` and returns the result. El código de ejecución no tiene acceso al ámbito local.

The following example compiles code that increments a global variable, sets the value of another global variable, then execute the code multiple times. Los globales están contenidos en el objeto `sandbox`.

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

### script.runInNewContext([sandbox[, opciones]])

<!-- YAML
added: v0.3.1
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19016
    description: The `contextCodeGeneration` option is supported now.
-->

* `sandbox` {Object} Un objeto que se [contextualizará](#vm_what_does_it_mean_to_contextify_an_object). If `undefined`, a new object will be created.
* `options` {Object} 
  * `filename` {string} Specifies the filename used in stack traces produced by this script.
  * `lineOffset` {number} Specifies the line number offset that is displayed in stack traces produced by this script.
  * `columnOffset` {number} Specifies the column number offset that is displayed in stack traces produced by this script.
  * `displayErrors` {boolean} When `true`, if an [`Error`][] error occurs while compiling the `code`, the line of code causing the error is attached to the stack trace.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Si se termina la ejecución, se arrojará un [`Error`][]. This value must be a strictly positive integer.
  * `contextName` {string} Nombre legible del contexto creado recientemente. **Default:** `'VM Context i'`, where `i` is an ascending numerical index of the created context.
  * `contextOrigin` {string} [Origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin) corresponding to the newly created context for display purposes. The origin should be formatted like a URL, but with only the scheme, host, and port (if necessary), like the value of the [`url.origin`][] property of a [`URL`][] object. Most notably, this string should omit the trailing slash, as that denotes a path. **Predeterminado:** `"`.
  * `contextCodeGeneration` {Object} 
    * `strings` {boolean} If set to false any calls to `eval` or function constructors (`Function`, `GeneratorFunction`, etc) will throw an `EvalError`. **Predeterminado:** `true`.
    * `wasm` {boolean} If set to false any attempt to compile a WebAssembly module will throw a `WebAssembly.CompileError`. **Predeterminado:** `true`.

First contextifies the given `sandbox`, runs the compiled code contained by the `vm.Script` object within the created sandbox, and returns the result. El código en ejecución no tiene acceso al ámbito local.

The following example compiles code that sets a global variable, then executes the code multiple times in different contexts. The globals are set on and contained within each individual `sandbox`.

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
  * `filename` {string} Specifies the filename used in stack traces produced by this script.
  * `lineOffset` {number} Specifies the line number offset that is displayed in stack traces produced by this script.
  * `columnOffset` {number} Specifies the column number offset that is displayed in stack traces produced by this script.
  * `displayErrors` {boolean} When `true`, if an [`Error`][] error occurs while compiling the `code`, the line of code causing the error is attached to the stack trace.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Si se termina la ejecución, se arrojará un [`Error`][]. This value must be a strictly positive integer.

Runs the compiled code contained by the `vm.Script` within the context of the current `global` object. Running code does not have access to local scope, but *does* have access to the current `global` object.

The following example compiles code that increments a `global` variable then executes that code multiple times:

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
  * `filename` {string} Specifies the filename used in stack traces produced by this script. **Predeterminado:** `"`.
  * `lineOffset` {number} Specifies the line number offset that is displayed in stack traces produced by this script. **Predeterminado:** `0`.
  * `columnOffset` {number} Specifies the column number offset that is displayed in stack traces produced by this script. **Predeterminado:** `0`.
  * `cachedData` {Buffer|TypedArray|DataView} Provides an optional `Buffer` or `TypedArray`, or `DataView` with V8's code cache data for the supplied source.
  * `produceCachedData` {boolean} Specifies whether to produce new cache data. **Predeterminado:** `false`.
  * `parsingContext` {Object} The [contextified](#vm_what_does_it_mean_to_contextify_an_object) sandbox in which the said function should be compiled in.
  * `contextExtensions` {Object[]} An array containing a collection of context extensions (objects wrapping the current scope) to be applied while compiling. **Default:** `[]`.

Compiles the given code into the provided context/sandbox (if no context is supplied, the current context is used), and returns it wrapped inside a function with the given `params`.

## vm.createContext([sandbox[, opciones]])

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
  * `name` {string} Nombre legible del contexto creado recientemente. **Default:** `'VM Context i'`, where `i` is an ascending numerical index of the created context.
  * `origin` {string} [Origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin) corresponding to the newly created context for display purposes. The origin should be formatted like a URL, but with only the scheme, host, and port (if necessary), like the value of the [`url.origin`][] property of a [`URL`][] object. Most notably, this string should omit the trailing slash, as that denotes a path. **Predeterminado:** `"`.
  * `codeGeneration` {Object} 
    * `strings` {boolean} If set to false any calls to `eval` or function constructors (`Function`, `GeneratorFunction`, etc) will throw an `EvalError`. **Predeterminado:** `true`.
    * `wasm` {boolean} If set to false any attempt to compile a WebAssembly module will throw a `WebAssembly.CompileError`. **Predeterminado:** `true`.

If given a `sandbox` object, the `vm.createContext()` method will [prepare that sandbox](#vm_what_does_it_mean_to_contextify_an_object) so that it can be used in calls to [`vm.runInContext()`][] or [`script.runInContext()`][]. Inside such scripts, the `sandbox` object will be the global object, retaining all of its existing properties but also having the built-in objects and functions any standard [global object](https://es5.github.io/#x15.1) has. Outside of scripts run by the vm module, global variables will remain unchanged.

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

If `sandbox` is omitted (or passed explicitly as `undefined`), a new, empty [contextified](#vm_what_does_it_mean_to_contextify_an_object) sandbox object will be returned.

The `vm.createContext()` method is primarily useful for creating a single sandbox that can be used to run multiple scripts. For instance, if emulating a web browser, the method can be used to create a single sandbox representing a window's global object, then run all `<script>` tags together within the context of that sandbox.

The provided `name` and `origin` of the context are made visible through the Inspector API.

## vm.isContext(sandbox)

<!-- YAML
added: v0.11.7
-->

* `sandbox` {Object}
* Devuelve: {boolean}

Returns `true` if the given `sandbox` object has been [contextified](#vm_what_does_it_mean_to_contextify_an_object) using [`vm.createContext()`][].

## vm.runInContext(código, contextifiedSandbox[, opciones])

* `code` {string} El código JavaScript para compilar y ejecutar.
* `contextifiedSandbox` {Object} The [contextified](#vm_what_does_it_mean_to_contextify_an_object) object that will be used as the `global` when the `code` is compiled and run.
* `options` {Objeto|string} 
  * `filename` {string} Specifies the filename used in stack traces produced by this script.
  * `lineOffset` {number} Specifies the line number offset that is displayed in stack traces produced by this script.
  * `columnOffset` {number} Specifies the column number offset that is displayed in stack traces produced by this script.
  * `displayErrors` {boolean} When `true`, if an [`Error`][] error occurs while compiling the `code`, the line of code causing the error is attached to the stack trace.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Si se termina la ejecución, se arrojará un [`Error`][]. This value must be a strictly positive integer.

The `vm.runInContext()` method compiles `code`, runs it within the context of the `contextifiedSandbox`, then returns the result. Running code does not have access to the local scope. The `contextifiedSandbox` object *must* have been previously [contextified](#vm_what_does_it_mean_to_contextify_an_object) using the [`vm.createContext()`][] method.

Si `options` es una cadena, entonces especifica el nombre del archivo.

The following example compiles and executes different scripts using a single [contextified](#vm_what_does_it_mean_to_contextify_an_object) object:

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

* `code` {string} El código JavaScript para compilar y ejecutar.
* `sandbox` {Object} Un objeto que se [contextualizará](#vm_what_does_it_mean_to_contextify_an_object). If `undefined`, a new object will be created.
* `options` {Objeto|string} 
  * `filename` {string} Specifies the filename used in stack traces produced by this script.
  * `lineOffset` {number} Specifies the line number offset that is displayed in stack traces produced by this script.
  * `columnOffset` {number} Specifies the column number offset that is displayed in stack traces produced by this script.
  * `displayErrors` {boolean} When `true`, if an [`Error`][] error occurs while compiling the `code`, the line of code causing the error is attached to the stack trace.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Si se termina la ejecución, se arrojará un [`Error`][]. This value must be a strictly positive integer.
  * `contextName` {string} Nombre legible del contexto creado recientemente. **Default:** `'VM Context i'`, where `i` is an ascending numerical index of the created context.
  * `contextOrigin` {string} [Origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin) corresponding to the newly created context for display purposes. The origin should be formatted like a URL, but with only the scheme, host, and port (if necessary), like the value of the [`url.origin`][] property of a [`URL`][] object. Most notably, this string should omit the trailing slash, as that denotes a path. **Predeterminado:** `"`.

The `vm.runInNewContext()` first contextifies the given `sandbox` object (or creates a new `sandbox` if passed as `undefined`), compiles the `code`, runs it within the context of the created context, then returns the result. Running code does not have access to the local scope.

Si `options` es una cadena, entonces especifica el nombre del archivo.

The following example compiles and executes code that increments a global variable and sets a new one. Estos globales están contenidos en el `sandbox`.

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

## vm.runInThisContext(código[, opciones])

<!-- YAML
added: v0.3.1
-->

* `code` {string} El código JavaScript para compilar y ejecutar.
* `options` {Objeto|string} 
  * `filename` {string} Specifies the filename used in stack traces produced by this script.
  * `lineOffset` {number} Specifies the line number offset that is displayed in stack traces produced by this script.
  * `columnOffset` {number} Specifies the column number offset that is displayed in stack traces produced by this script.
  * `displayErrors` {boolean} When `true`, if an [`Error`][] error occurs while compiling the `code`, the line of code causing the error is attached to the stack trace.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Si se termina la ejecución, se arrojará un [`Error`][]. This value must be a strictly positive integer.

`vm.runInThisContext()` compiles `code`, runs it within the context of the current `global` and returns the result. Running code does not have access to local scope, but does have access to the current `global` object.

Si `options` es una cadena, entonces especifica el nombre del archivo.

The following example illustrates using both `vm.runInThisContext()` and the JavaScript [`eval()`][] function to run the same code:

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

Because `vm.runInThisContext()` does not have access to the local scope, `localVar` is unchanged. In contrast, [`eval()`][] *does* have access to the local scope, so the value `localVar` is changed. In this way `vm.runInThisContext()` is much like an [indirect `eval()` call][], e.g. `(0,eval)('code')`.

## Ejemplo: Ejecutar un Servidor HTTP dentro de una Máquina Virtual

When using either [`script.runInThisContext()`][] or [`vm.runInThisContext()`][], the code is executed within the current V8 global context. El código pasado a este contexto VM tendrá su propio ámbito aislado.

In order to run a simple web server using the `http` module the code passed to the context must either call `require('http')` on its own, or have a reference to the `http` module passed to it. Por ejemplo:

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

The `require()` in the above case shares the state with the context it is passed from. This may introduce risks when untrusted code is executed, e.g. altering objects in the context in unwanted ways.

## ¿Qué significa "contextificar" un objeto?

Todo JavaScript ejecutado en Node.js se ejecuta dentro del ámbito de un "contexto". De acuerdo a la [Guía de Incrustadores V8](https://github.com/v8/v8/wiki/Embedder's%20Guide#contexts):

> In V8, a context is an execution environment that allows separate, unrelated, JavaScript applications to run in a single instance of V8. You must explicitly specify the context in which you want any JavaScript code to be run.

When the method `vm.createContext()` is called, the `sandbox` object that is passed in (or a newly created object if `sandbox` is `undefined`) is associated internally with a new instance of a V8 Context. This V8 Context provides the `code` run using the `vm` module's methods with an isolated global environment within which it can operate. The process of creating the V8 Context and associating it with the `sandbox` object is what this document refers to as "contextifying" the `sandbox`.

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