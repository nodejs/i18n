# VM (Ejecutando JavaScript)

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

<!--name=vm-->

El módulo de `vm` proporciona APIs para compilar y ejecutar código dentro de contextos de Máquinas Virtuales de V8. **The `vm` module is not a security mechanism. Do not use it to run untrusted code**. The term "sandbox" is used throughout these docs simply to refer to a separate context, and does not confer any security guarantees.

El código de JavaScript se puede compilar y ejecutar inmediatamente o compilar, guardar y ejecutar más tarde.

Un caso de uso común es ejecutar el código en un entorno de pruebas (sandbox). El código de espacio aislado usa un Contexto de V8 diferente, lo que significa que tiene un objeto global diferente al resto del código.

Uno puede proporcionar el contexto ["contextificando"](#vm_what_does_it_mean_to_contextify_an_object) un objeto de proceso aislado. The sandboxed code treats any property in the sandbox like a global variable. Any changes to global variables caused by the sandboxed code are reflected in the sandbox object.

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

This implementation lies at a lower level than the [ECMAScript Module loader](esm.html#esm_ecmascript_modules). There is also currently no way to interact with the Loader, though support is planned.

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

Corresponds to the [Evaluate() concrete method](https://tc39.github.io/ecma262/#sec-moduleevaluation) field of [Source Text Module Record](https://tc39.github.io/ecma262/#sec-source-text-module-records)s in the ECMAScript specification.

### module.instantiate()

Instanciar el módulo. This must be called after linking has completed (`linkingStatus` is `'linked'`); otherwise it will throw an error. It may also throw an exception if one of the dependencies does not provide an export the parent module requires.

However, if this function succeeded, further calls to this function after the initial instantiation will be no-ops, to be consistent with the ECMAScript specification.

Unlike other methods operating on `Module`, this function completes synchronously and returns nothing.

Corresponds to the [Instantiate() concrete method](https://tc39.github.io/ecma262/#sec-moduledeclarationinstantiation) field of [Source Text Module Record](https://tc39.github.io/ecma262/#sec-source-text-module-records)s in the ECMAScript specification.

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

Las instancias de la clase `vm.Script` contienen scripts precompilados que se pueden ejecutar en entornos de prueba específicos (o "contextos").

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
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el desplazamiento del número de línea que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el desplazamiento del número de columna que se muestra en los stack traces producidos por este script.
  * `cachedData` {Buffer|TypedArray|DataView} Provides an optional `Buffer` or `TypedArray`, or `DataView` with V8's code cache data for the supplied source. When supplied, the `cachedDataRejected` value will be set to either `true` or `false` depending on acceptance of the data by V8.
  * `produceCachedData` {boolean} Cuando sea `true` y no haya `cachedData`, V8 intentará producir datos de caché de código para `code`. En caso de éxito, se producirá y almacenará un `Buffer` con datos de caché de código de V8 en la propiedad `cachedData` de la instancia `vm.Script` devuelta. El valor `cachedDataProduced` se establecerá en `true` o `false` dependiendo de si los datos de la caché de código se producen correctamente. This option is deprecated in favor of `script.createCachedData()`.
  * `importModuleDynamically` {Function} Called during evaluation of this module when `import()` is called. This function has the signature `(specifier, module)` where `specifier` is the specifier passed to `import()` and `module` is this `vm.SourceTextModule`. If this option is not specified, calls to `import()` will reject with [`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`][]. This method can return a [Module Namespace Object](https://tc39.github.io/ecma262/#sec-module-namespace-exotic-objects), but returning a `vm.SourceTextModule` is recommended in order to take advantage of error tracking, and to avoid issues with namespaces that contain `then` function exports.

La creación de un nuevo objeto `vm.Script` compila el `code` pero no lo ejecuta. El `vm.Script` compilado se puede ejecutar más tarde varias veces. The `code` is not bound to any global object; rather, it is bound before each run, just for that run.

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

* `contextifiedSandbox` {Object} Un objeto [contextificado](#vm_what_does_it_mean_to_contextify_an_object) según lo devuelto por el método `vm.createContext()`.
* `options` {Object} 
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el desplazamiento del número de línea que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el desplazamiento del número de columna que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si ocurre un error [`Error`][] al compilar `code`, la línea de código que causa el error se adjunta al stack trace.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Si se termina la ejecución, se arrojará [`Error`][]. This value must be a strictly positive integer.
  * `breakOnSigint`: si es `true`, la ejecución terminará cuando se reciba `SIGINT` (Ctrl + C). Los manejadores existentes para el evento que se han adjuntado mediante `process.on('SIGINT')` se deshabilitarán durante la ejecución del script, pero continuarán funcionando después de eso. Si se termina la ejecución, se producirá un [`Error`][].

Ejecuta el código compilado contenido por el objeto `vm.Script` dentro del `contextifiedSandbox` dado y devuelve el resultado. El código de ejecución no tiene acceso al ámbito local.

El siguiente ejemplo compila el código que incrementa una variable global, establece el valor de otra variable global y luego ejecuta el código varias veces. Los globales están contenidos en el objeto `sandbox`.

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

* `sandbox` {Object} Un objeto que se [contextualizará](#vm_what_does_it_mean_to_contextify_an_object). Si es `undefined`, se creará un nuevo objeto.
* `options` {Object} 
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el desplazamiento del número de línea que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el desplazamiento del número de columna que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si ocurre un error [`Error`][] al compilar `code`, la línea de código que causa el error se adjunta al stack trace.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Si se termina la ejecución, se arrojará [`Error`][]. This value must be a strictly positive integer.
  * `contextName` {string} Nombre legible del contexto creado recientemente. **Default:** `'VM Context i'`, where `i` is an ascending numerical index of the created context.
  * `contextOrigin` {string} [Origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin) corresponding to the newly created context for display purposes. The origin should be formatted like a URL, but with only the scheme, host, and port (if necessary), like the value of the [`url.origin`][] property of a [`URL`][] object. Most notably, this string should omit the trailing slash, as that denotes a path. **Predeterminado:** `"`.
  * `contextCodeGeneration` {Object} 
    * `strings` {boolean} If set to false any calls to `eval` or function constructors (`Function`, `GeneratorFunction`, etc) will throw an `EvalError`. **Predeterminado:** `true`.
    * `wasm` {boolean} If set to false any attempt to compile a WebAssembly module will throw a `WebAssembly.CompileError`. **Predeterminado:** `true`.

Primero contextualiza el `sandbox` dado, ejecuta el código de compilación contenido en el objeto `vm.Script` dentro del sandbox creado, y devuelve el resultado. El código en ejecución no tiene acceso al ámbito local.

El siguiente ejemplo compila el código que establece una variable global, luego ejecuta el código varias veces en diferentes contextos. Los globales están establecidos y contenidos dentro de cada `sandbox` individualmente.

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
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el desplazamiento del número de línea que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el desplazamiento del número de columna que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si ocurre un error [`Error`][] al compilar `code`, la línea de código que causa el error se adjunta al stack trace.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Si se termina la ejecución, se arrojará [`Error`][]. This value must be a strictly positive integer.

Ejecuta el código compilado contenido por `vm.Script` dentro del contexto del objeto `global` actual. El código en ejecución no tiene acceso al ámbito local, pero *tiene* acceso al objeto `global` actual.

El siguiente ejemplo compila el código que incrementa una variable `global` y luego ejecuta ese código varias veces:

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
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script. **Predeterminado:** `"`.
  * `lineOffset` {number} Especifica el desplazamiento del número de línea que se muestra en los stack traces producidos por este script. **Predeterminado:** `0`.
  * `columnOffset` {number} Especifica el desplazamiento del número de columna que se muestra en los stack traces producidos por este script. **Predeterminado:** `0`.
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

Si se le da un objeto `sandbox`, el método `vm.createContext()` [preparará ese entorno de pruebas](#vm_what_does_it_mean_to_contextify_an_object) para que pueda usarse en las llamadas a [`vm.runInContext()`][] o [`script.runInContext()`][]. Dentro de dichos scripts, el objeto `sandbox` será el objeto global, conservará todas sus propiedades existentes, pero también tendrá los objetos y funciones incorporados que cualquier [objeto global](https://es5.github.io/#x15.1) estándar tiene. Fuera de los scripts ejecutados por el módulo de vm, las variables globales permanecerán sin cambios.

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

Si se omite `sandbox` (o se pasa explícitamente como `undefined`), se devolverá un nuevo objeto de entorno de pruebas [contextificado](#vm_what_does_it_mean_to_contextify_an_object) vacío.

El método `vm.createContext()` es principalmente útil para crear un único entorno de pruebas que se puede usar para ejecutar múltiples scripts. Por ejemplo, si emula un navegador web, el método se puede usar para crear un entorno de pruebas único que represente el objeto global de una ventana, y luego ejecutar todas las etiquetas `<script>` juntas dentro del contexto de ese entorno de pruebas.

The provided `name` and `origin` of the context are made visible through the Inspector API.

## vm.isContext(sandbox)

<!-- YAML
added: v0.11.7
-->

* `sandbox` {Object}
* Devuelve: {boolean}

Devuelve `true` si el objeto de `sandbox` dado ha sido [contextificado](#vm_what_does_it_mean_to_contextify_an_object) usando [`vm.createContext()`][].

## vm.runInContext(código, contextifiedSandbox[, opciones])

* `code` {string} El código JavaScript para compilar y ejecutar.
* `contextifiedSandbox` {Object} El objeto [contextificado](#vm_what_does_it_mean_to_contextify_an_object) que se utilizará como `global` cuando `code` sea compilado y ejecutado.
* `options` {Objeto|string} 
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el desplazamiento del número de línea que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el desplazamiento del número de columna que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si ocurre un error [`Error`][] al compilar `code`, la línea de código que causa el error se adjunta al stack trace.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Si se termina la ejecución, se arrojará [`Error`][]. This value must be a strictly positive integer.

El método `vm.runInContext()` compila `code`, lo ejecuta dentro del contexto de `contextifiedSandbox`, luego devuelve el resultado. El código de ejecución no tiene acceso al ámbito local. El objeto `contextifiedSandbox` *debe* haber sido previamente [contextificado](#vm_what_does_it_mean_to_contextify_an_object) usando el método [`vm.createContext()`][].

Si `options` es una cadena, entonces especifica el nombre del archivo.

El siguiente ejemplo compila y ejecuta diferentes scripts usando un único objeto [contextificado](#vm_what_does_it_mean_to_contextify_an_object):

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
* `sandbox` {Object} Un objeto que se [contextualizará](#vm_what_does_it_mean_to_contextify_an_object). Si es `undefined`, se creará un nuevo objeto.
* `options` {Objeto|string} 
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el desplazamiento del número de línea que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el desplazamiento del número de columna que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si ocurre un error [`Error`][] al compilar `code`, la línea de código que causa el error se adjunta al stack trace.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Si se termina la ejecución, se arrojará [`Error`][]. This value must be a strictly positive integer.
  * `contextName` {string} Nombre legible del contexto creado recientemente. **Default:** `'VM Context i'`, where `i` is an ascending numerical index of the created context.
  * `contextOrigin` {string} [Origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin) corresponding to the newly created context for display purposes. The origin should be formatted like a URL, but with only the scheme, host, and port (if necessary), like the value of the [`url.origin`][] property of a [`URL`][] object. Most notably, this string should omit the trailing slash, as that denotes a path. **Predeterminado:** `"`.

El `vm.runInNewContext()` primero contextifica el objeto del `sandbox` dado (o crea un `sandbox` nuevo si se pasa como `undefined`), compila `code`, lo ejecuta dentro del contexto del contexto creado y luego devuelve el resultado. El código de ejecución no tiene acceso al ámbito local.

Si `options` es una cadena, entonces especifica el nombre del archivo.

El siguiente ejemplo compila y ejecuta código que incrementa una variable global y establece una nueva. Estos globales están contenidos en el `sandbox`.

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
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el desplazamiento del número de línea que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el desplazamiento del número de columna que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si ocurre un error [`Error`][] al compilar `code`, la línea de código que causa el error se adjunta al stack trace.
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. Si se termina la ejecución, se arrojará [`Error`][]. This value must be a strictly positive integer.

`vm.runInThisContext()` compila `code`, lo ejecuta dentro del contexto del `global` actual y devuelve el resultado. El código en ejecución no tiene acceso al ámbito local, pero sí tiene acceso al objeto `global` actual.

Si `options` es una cadena, entonces especifica el nombre del archivo.

El siguiente ejemplo ilustra el uso de `vm.runInThisContext()` y la función de JavaScript [`eval()`][] para ejecutar el mismo código:

<!-- eslint-disable prefer-const -->

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

Debido a que `vm.runInThisContext()` no tiene acceso al ámbito local, `localVar` no se modifica. Por el contrario, [`eval()`][] *tiene* acceso al ámbito local, por lo que se cambia el valor `localVar`. De esta manera, `vm.runInThisContext()` se parece mucho a una [llamada indirecta `eval()`][], por ejemplo, `(0,eval)('code')`.

## Ejemplo: Ejecutar un Servidor HTTP dentro de una Máquina Virtual

When using either [`script.runInThisContext()`][] or [`vm.runInThisContext()`][], the code is executed within the current V8 global context. El código pasado a este contexto VM tendrá su propio ámbito aislado.

Para ejecutar un servidor web simple utilizando el módulo `http`, el código que se pasa al contexto debe llamar a `require('http')` por sí solo, o bien se debe pasar una referencia al módulo `http`. Por ejemplo:

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

The `require()` in the above case shares the state with the context it is passed from. Esto puede generar riesgos cuando se ejecuta un código no confiable, por ejemplo, alterar objetos en el contexto de manera no deseada.

## ¿Qué significa "contextificar" un objeto?

Todo JavaScript ejecutado en Node.js se ejecuta dentro del ámbito de un "contexto". De acuerdo a la [Guía de Incrustadores V8](https://github.com/v8/v8/wiki/Embedder's%20Guide#contexts):

> En V8, un contexto es un entorno de ejecución que permite que aplicaciones de JavaScript independientes y no relacionadas se ejecuten en una sola instancia de V8. Se debe especificar explícitamente el contexto en el que desea que se ejecute cualquier código JavaScript.

Cuando el método `vm.createContext()` es llamado, el objeto de `sandbox` que se pasa (o un objeto recién creado si `sandbox` es `undefined`) es asociado internamente con una nueva instancia de un Contexto de V8. This V8 Context provides the `code` run using the `vm` module's methods with an isolated global environment within which it can operate. El proceso de crear el Contexto de V8 y asociarlo con el objeto de `sandbox` es lo que este documento denomina "contextificar" el `sandbox`.

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