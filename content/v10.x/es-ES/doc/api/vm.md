# VM (Ejecutar JavaScript)

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

<!--name=vm-->

El módulo de `vm` proporciona APIs para compilar y ejecutar código dentro de contextos de Máquinas Virtuales de V8. **The `vm` module is not a security mechanism. Do not use it to run untrusted code**. The term "sandbox" is used throughout these docs simply to refer to a separate context, and does not confer any security guarantees.

El código de JavaScript se puede compilar y ejecutar inmediatamente o compilar, guardar y ejecutar más tarde.

Un caso de uso común es ejecutar el código en un entorno de pruebas. El código del entorno de pruebas usa un Contexto de V8 diferente, lo que significa que tiene un objeto global diferente al resto del código.

Uno puede proporcionar el contexto ["contextificando"](#vm_what_does_it_mean_to_contextify_an_object) un objeto de un entorno de pruebas. The sandboxed code treats any property in the sandbox like a global variable. Any changes to global variables caused by the sandboxed code are reflected in the sandbox object.

```js
const vm = require('vm');

const x = 1;

const sandbox = { x: 2 };
vm.createContext(sandbox); // Contextificar el espacio aislado.

const code = 'x += 40; var y = 17;';
// "x" y "y" son variables globales en el entorno de espacio aislado.
// Inicialmente, x tiene el valor 2 porque ese es el valor de sandbox.x.
vm.runInContext(código, espacio aislado);

console.log(sandbox.x); // 42
console.log(sandbox.y); // 17

console.log(x); // 1; y is not defined.
```

## Class: vm.SourceTextModule
<!-- YAML
added: v9.6.0
-->

> Estabilidad: 1 - Experimental

*Esta función solo está disponible con el indicador de comando `--experimental-vm-modules` habilitado.*

The `vm.SourceTextModule` class provides a low-level interface for using ECMAScript modules in VM contexts. It is the counterpart of the `vm.Script` class that closely mirrors [Source Text Module Record](https://tc39.github.io/ecma262/#sec-source-text-module-records)s as defined in the ECMAScript specification.

Unlike `vm.Script` however, every `vm.SourceTextModule` object is bound to a context from its creation. Operations on `vm.SourceTextModule` objects are intrinsically asynchronous, in contrast with the synchronous nature of `vm.Script` objects. With the help of async functions, however, manipulating `vm.SourceTextModule` objects is fairly straightforward.

Using a `vm.SourceTextModule` object requires four distinct steps: creation/parsing, linking, instantiation, and evaluation. These four steps are illustrated in the following example.

This implementation lies at a lower level than the \[ECMAScript Module loader\]\[\]. Actualmente, tampoco hay manera de interactuar con el Cargador, aunque el soporte está planeado.

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
  * `url` {string} URL utilizado en la resolución de módulo y stack traces. **Predeterminado:** `'vm:module(i)'` donde `i` es un índice ascendente de contexto específico.
  * `context` {Object} El objeto [contextualizado](#vm_what_does_it_mean_to_contextify_an_object) como es devuelto por el método `vm.createContext()`, para compilar y evaluar este `Module`.
  * `lineOffset` {integer} Especifica el desplazamiento del número de línea que se muestra en los stack traces producidos por este `Module`.
  * `columnOffset` {integer} Especifica el desplazamiento del número de columna que se muestra en los stack traces producidos por este `Modulo`.
  * `initializeImportMeta` {Function} Called during evaluation of this `Module` to initialize the `import.meta`. This function has the signature `(meta,
module)`, where `meta` is the `import.meta` object in the `Module`, and `module` is this `vm.SourceTextModule` object.
  * `importModuleDynamically` {Function} Called during evaluation of this module when `import()` is called. This function has the signature `(specifier, module)` where `specifier` is the specifier passed to `import()` and `module` is this `vm.SourceTextModule`. If this option is not specified, calls to `import()` will reject with [`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`][]. This method can return a [Module Namespace Object](https://tc39.github.io/ecma262/#sec-module-namespace-exotic-objects), but returning a `vm.SourceTextModule` is recommended in order to take advantage of error tracking, and to avoid issues with namespaces that contain `then` function exports.

Crea un nuevo objeto ES `Module`.

Properties assigned to the `import.meta` object that are objects may allow the `Module` to access information outside the specified `context`, if the object is created in the top level context. Utilice `vm.runInContext()` para crear objetos en un contexto específico.

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

Los especificadores de todas las dependencias de este módulo. El arreglo devuelto se congela para no permitir ningún cambio en él.

Corresponde al campo `[[RequestedModules]]` de los [Registros del Módulo de Texto de Fuente](https://tc39.github.io/ecma262/#sec-source-text-module-records) en la especificación de ECMAScript.

### module.error

* {any}

Si el`module.status` es `'errored'`, esta propiedad contiene la excepción lanzada por el módulo durante la evaluación. Si el estatus es cualquier cosa distinta, acceder a esta propiedad dará como resultado el lanzamiento de una excepción.

El valor `undefined` no puede ser utilizado para casos donde no se lanza una excepción debido a la posible ambigüedad con `throw undefined;`.

Corresponde al campo `[[EvaluationError]]` de los [Registros de Módulo de Texto de Fuente](https://tc39.github.io/ecma262/#sec-source-text-module-records) en la especificación de ECMAScript.

### module.evaluate([options])

* `opciones` {Object}
  * `timeout` {integer} Especifica la cantidad de milisegundos para evaluar antes de terminar la ejecución. Si la ejecución se interrumpe, un [`Error`][] se lanzará. This value must be a strictly positive integer.
  * `breakOnSigint` {boolean} Si es `true`, la ejecución se terminará cuando `SIGINT` (Ctrl+C) se reciba. Los manejadores existentes para el evento que se han adjuntado a través de `process.on('SIGINT')` se desactivarán durante la ejecución del script, pero continuarán trabajando después de eso. Si se interrumpe la ejecución, un [`Error`][] se lanzará.
* Devuelve: {Promise}

Evaluar el módulo.

Esto debe ser llamado después de que el módulo haya sido instanciado; de lo contrario lanzará un error. Podría llamarse también cuando el módulo ya haya sido evaluado, en ese caso hará una de las siguientes dos cosas:

- devuelve `undefined` si la evaluación inicial terminó correctamente (`module.status` es `'evaluated'`)
- vuelve a producir la misma excepción que la evaluación inicial lanzó si la evaluación inicial terminó en un error (`module.status` es `'errored'`)

Este método no puede llamarse mientras el módulo está siendo evaluado (`module.status` es `'evaluating'`) para evitar la recursión infinita.

Corresponds to the [Evaluate() concrete method](https://tc39.github.io/ecma262/#sec-moduleevaluation) field of \[Source Text Module Record\]\[\]s in the ECMAScript specification.

### module.instantiate()

Instanciar el módulo. Esto debe llamarse después de que el enlace se haya completado (`linkingStatus` es `'linked'`); de lo contrario lanzará un error. También puede lanzar una excepción si una de las dependencias no proporciona una exportación que el módulo principal requiere.

Sin embargo, si esta función fue exitosa, las llamadas adicionales para esta función después de la instanciación inicial no estarán operativas, para ser consistentes con la especificación ECMAScript.

A diferencia de otros métodos operativos en `Module`, esta función se completa sincrónicamente y no devuelve nada.

Corresponds to the [Instantiate() concrete method](https://tc39.github.io/ecma262/#sec-moduledeclarationinstantiation) field of \[Source Text Module Record\]\[\]s in the ECMAScript specification.

### module.link(linker)

* `linker` {Function}
* Devuelve: {Promise}

Dependencias del módulo de enlace. Este método debe llamarse antes de la instanciación, y solo puede llamarse una vez por módulo.

Dos parámetros se pasarán a la función `linker`:

- `specifier` The specifier of the requested module:
  <!-- eslint-skip -->
  ```js
  import foo from 'foo';
  //              ^^^^^ the module specifier
  ```
- `referencingModule` El `link()` del objeto `Module` que es llamado.

Se espera que la función devuelva un objeto `Module` o una `Promise` que eventualmente se convierta en un objeto `Module`. El `Module` devuelto debe satisfacer las siguientes dos invariantes:

- Debe pertenecer al mismo contexto que el `Module` principal.
- Su `linkingStatus` no debe ser `'errored'`.

Si el `linkingStatus` del `Module` devuelto es `'unlinked'`, este método se llamará recursivamente en el `Module` devuelto con la misma función `linker` proporcionada.

`link()` devuelve un `Promise` que se resolverá cuando todas las instancias de enlace se resuelvan en un `Module` válido, o se rechazará si la función enlazador lanza una excepción o devuelve un `Module` inválido.

La función enlazador corresponde aproximadamente a la operación abstracta de [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) definida por la implementación en la especificación ECMAScript, con algunas diferencias clave:

- La función enlazador puede ser asincrónica mientras que [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) es sincrónica.
- La función enlazador se ejecuta durante la vinculación, una etapa específica de Node.js antes de la instanciación, mientras que [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) se llama durante la instanciación.

La implementación [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) real utilizada durante la instanciación del módulo es aquella que devuelve los módulos enlazados durante la vinculación. Dado que en ese punto todos los módulos ya estarían completamente enlazados, la implementación [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) es completament sincrónica por especificación.

### module.linkingStatus

* {string}

El estatus de vinculación actual del `module`. Será uno de los siguientes valores:

- `'unlinked'`: `module.link()` todavía no ha sido llamado.
- `'linking'`: `module.link()` ha sido llamado, pero no todas las Promesas devueltas por la función del enlazador han sido resueltas todavía.
- `'linked'`: `module.link()` ha sido llamado, y todas sus dependencias han sido exitosamente enlazadas.
- `'errored'`: `module.link()` ha sido llamado, pero al menos una de sus dependencias falló al enlazarse, ya sea porque el callback retornó una `Promise` que se rechaza, o porque el `Module` que el callback retornó es inválido.

### module.namespace

* {Object}

El objeto namespace del módulo. Esto solo está disponible después de que la instantación (`module.instantiate()`) se haya completado.

Corresponde a la operación abstracta [GetModuleNamespace](https://tc39.github.io/ecma262/#sec-getmodulenamespace) en la especificación de ECMAScript.

### module.status

* {string}

El estatus actual del módulo. Será uno de:

- `'uninstantiated'`: El módulo no está instanciado. Puede ser por alguna de las siguientes razones:

  - El módulo se acaba de crear.
  - `module.instantiate()` ha sido llamado en este módulo, pero falló por alguna razón.

  Este estatus no transmite ninguna información con respecto a si `module.link()` ha sido llamado. Vea `module.linkingStatus` para eso.

- `'instantiating'`: El módulo se está instanciando actualmente mediante un `module.instantiate()` llamado sobre sí mismo o un módulo principal.

- `'instantiated'`: El módulo ha sido instanciado exitosamente, pero `module.evaluate()` todavía no ha sido llamado.

- `'evaluating'`: El módulo se está evaluando mediante un `module.evaluate()` en sí mismo o en un módulo principal.

- `'evaluated'`: El módulo ha sido evaluado exitosamente.

- `'errored'`: El módulo ha sido evaluado, pero se lanzó una excepción.

Aparte de `'errored'`, esta cadena de estatus corresponde al campo de `[[Status]]` del [Registro de Módulo de Texto de Fuente](https://tc39.github.io/ecma262/#sec-source-text-module-records) de la especificación. `'errored'` corresponde a `'evaluated'` en la especificación, pero con `[[EvaluationError]]` configurado a un valor que no está `undefined`.

### module.url

* {string}

El URL del módulo actual, como se configura en el constructor.

## Clase: vm.Script
<!-- YAML
added: v0.3.1
-->

Las instancias de la clase `vm.Script` contienen scripts precompilados que pueden ejecutarse en sandboxes específicos (o "contextos").

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
  * `lineOffset` {number} Especifica el número de línea del desplazamiento que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el número de la columna del desplazamiento que se muestra en los stack traces producidos por este script.
  * `cachedData` {Buffer|TypedArray|DataView} Provides an optional `Buffer` or `TypedArray`, or `DataView` with V8's code cache data for the supplied source. When supplied, the `cachedDataRejected` value will be set to either `true` or `false` depending on acceptance of the data by V8.
  * `produceCachedData` {boolean} Cuando es `true` y no está presente `cachedData`, V8 intentará producir datos de caché del código para `code`. En caso de éxito, un `Buffer` con datos de caché del código de V8 se producirá y almacenará en la propiedad `cachedData` de la instancia `vm.Script` devuelta. El valor `cachedDataProduced` se establecerá en `true` o `false` dependiendo de si los datos de caché del código se producen exitosamente. This option is deprecated in favor of `script.createCachedData()`.
  * `importModuleDynamically` {Function} Called during evaluation of this module when `import()` is called. This function has the signature `(specifier, module)` where `specifier` is the specifier passed to `import()` and `module` is this `vm.SourceTextModule`. If this option is not specified, calls to `import()` will reject with [`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`][]. This method can return a [Module Namespace Object](https://tc39.github.io/ecma262/#sec-module-namespace-exotic-objects), but returning a `vm.SourceTextModule` is recommended in order to take advantage of error tracking, and to avoid issues with namespaces that contain `then` function exports.

La creación de un nuevo objeto `vm.Script` compila el `code` pero no lo ejecuta. El `vm.Script` compilado se puede ejecutar múltiples veces después. El `code` no está vinculado a ningún objeto global; más bien, se vincula antes de la ejecución, solo para esa ejecución.

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

* `contextifiedSandbox` {Object} Un objeto [contextualizado](#vm_what_does_it_mean_to_contextify_an_object) como resultado del método `vm.createContext()`.
* `opciones` {Object}
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el número de línea del desplazamiento que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el número de la columna del desplazamiento que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si se produce un error [`Error`][] mientras se compila el `code`, la línea del código que causa el error se adjunta al stack trace.
  * `timeout` {integer} Especifica la cantidad de milisegundos para ejecutar el `code` antes de terminar la ejecución. Si la ejecución se termina, se producirá un [`Error`][]. This value must be a strictly positive integer.
  * `breakOnSigint`: si es `true`, la ejecución terminará cuando se reciba `SIGINT` (Ctrl+C). Los manejadores existentes para el evento que se han adjuntado a través de `process.on('SIGINT')` se desactivarán durante la ejecución del script, pero continuarán trabajando después de eso. Si se termina la ejecución, se producirá un [`Error`][].

Se ejecuta el código compilado contenido por el objeto `vm.Script` dentro del `contextifiedSandbox` dado y devuelve el resultado. El código en ejecución no tiene acceso al ámbito local.

El siguiente ejemplo compila el código que incrementa una variable global, establece el valor de otra variable global y luego ejecuta el código múltiples veces. Los globales están contenidos en el objeto `sandbox`.

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

Utilizar las opciones `timeout` o `breakOnSigint` resultará en un nuevo bucle de eventos y los hilos correspondientes se iniciarán, los cuales tienen una sobrecarga de rendimiento distinta a cero.

### script.runInNewContext([sandbox[, opciones]])
<!-- YAML
added: v0.3.1
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19016
    description: The `contextCodeGeneration` option is supported now.
-->

* `sandbox` {Object} Un objeto que se [contextualizará](#vm_what_does_it_mean_to_contextify_an_object). Si es `undefined`, un nuevo objeto se creará.
* `opciones` {Object}
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el número de línea del desplazamiento que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el número de la columna del desplazamiento que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si ocurre un error [`Error`][] mientras se compila el `code`, la línea del código que causa el error se adjunta al stack trace.
  * `timeout` {integer} Especifica la cantidad de milisegundos para ejecutar el `code` antes de terminar la ejecución. Si la ejecución se termina, se producirá un [`Error`][]. This value must be a strictly positive integer.
  * `contextName` {string} Nombre legible del contexto creado recientemente. **Predeterminado:** `'VM Context i'`, donde `i` es un índice numérico ascendente del contexto creado.
  * `contextOrigin` {string} El [origen](https://developer.mozilla.org/en-US/docs/Glossary/Origin) correspondiente al contexto creado recientemente con propósitos de visualización. El origen debe ser formateado como un URL, pero solo con el esquema, el host y el puerto (si es necesario), como el valor de la propiedad [`url.origin`][] de un objeto [`URL`][]. En particular, esta cadena debe omitir la barra (/) al final, ya que denota una ruta. **Predeterminado:** `"`.
  * `contextCodeGeneration` {Object}
    * `strings` {boolean} Si se establece en falso, cualquier llamada para `eval` o constructores de función (`Function`, `GeneratorFunction`, etc) producirá un `EvalError`. **Predeterminado:** `true`.
    * `wasm` {boolean} Si se establece en falso, cualquier intento de compilar un módulo WebAssembly producirá un `WebAssembly.CompileError`. **Predeterminado:** `true`.

Primero contextualiza el `sandbox` dado, ejecuta el código de compilación contenido en el objeto `vm.Script` dentro del sandbox creado, y devuelve el resultado. El código en ejecución no tiene acceso al ámbito local.

El siguiente ejemplo compila el código que establece una variable global, luego ejecuta el código múltiples veces en diferentes contextos. Los globales están configurados y contenidos dentro de cada `sandbox` individual.

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

* `opciones` {Object}
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el número de línea del desplazamiento que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el número de la columna del desplazamiento que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si ocurre un error [`Error`][] mientras se compila el `code`, la línea del código que causa el error se adjunta al stack trace.
  * `timeout` {integer} Especifica la cantidad de milisegundos para ejecutar el `code` antes de terminar la ejecución. Si la ejecución se termina, se producirá un [`Error`][]. This value must be a strictly positive integer.

Ejecuta el código compilado contenido por el `vm.Script` dentro del contexto del objeto `global` actual. El código en ejecución no tiene acceso al ámbito global, pero *tiene* acceso al objeto `global` actual.

El siguiente ejemplo compila el código que incrementa una variable `global` y luego ejecuta el código múltiples veces:

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
* `opciones` {Object}
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script. **Predeterminado:** `"`.
  * `lineOffset` {number} Especifica el número de línea del desplazamiento que se muestra en los stack traces producidos por este script. **Predeterminado:** `0`.
  * `columnOffset` {number} Especifica el número de la columna del desplazamiento que se muestra en los stack traces producidos por este script. **Predeterminado:** `0`.
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
* `opciones` {Object}
  * `name` {string} Nombre legible del contexto creado recientemente. **Predeterminado:** `'VM Context i'`, donde `i` es un índice numérico ascendente del contexto creado.
  * `origin` {string} El [origen](https://developer.mozilla.org/en-US/docs/Glossary/Origin) corresponde al contexto creado recientemente con propósitos de visualización. El origen debe ser formateado como un URL, pero solo con el esquema, el host y el puerto (si es necesario), como el valor de la propiedad [`url.origin`][] de un objeto [`URL`][]. En particular, esta cadena debe omitir la barra (/) al final, ya que denota una ruta. **Predeterminado:** `"`.
  * `codeGeneration` {Object}
    * `strings` {boolean} Si se establece en falso, cualquier llamada para `eval` o constructores de función (`Function`, `GeneratorFunction`, etc) producirá un `EvalError`. **Predeterminado:** `true`.
    * `wasm` {boolean} Si se establece en falso, cualquier intento de compilar un módulo WebAssembly producirá un `WebAssembly.CompileError`. **Predeterminado:** `true`.

Si se le da un objeto `sandbox`, el método `vm.createContext()` [preparará ese sandbox](#vm_what_does_it_mean_to_contextify_an_object) para que se pueda utilizar en llamadas a [`vm.runInContext()`][] o [`script.runInContext()`][]. Dentro de esos scripts, el objeto `sandbox` será el objeto global, reteniendo todas sus propiedades existentes pero también teniendo los objetos y funciones incorporados que tiene cualquier [objeto global](https://es5.github.io/#x15.1) estándar. Fuera de los scripts ejecutados por el módulo vm, las variables globales permanecerán sin cambios.

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

Si `sandbox` se omite (o se pasa explícitamente como `undefined`), un objeto sandbox [contextualizado](#vm_what_does_it_mean_to_contextify_an_object) nuevo y vacío se devolverá.

El método `vm.createContext()` es principalmente útil para crear un sandbox único que puede ser utilizado para ejecutar múltiples scripts. Por ejemplo, si se emula un navegador web, el método puede utilizarse para crear un sandbox único que representa un objeto global de windows y luego ejecutar todas las etiquetas del `<script>` juntas dentro del contexto de ese sandbox.

El `name` proporcionado y el `origin` del contexto se hacen visibles a través de la API de Inspector.

## vm.isContext(sandbox)
<!-- YAML
added: v0.11.7
-->

* `sandbox` {Object}
* Devuelve: {boolean}

Devuelve `true` si el objeto `sandbox` dado ha sido [contextualizado](#vm_what_does_it_mean_to_contextify_an_object) utilizando [`vm.createContext()`][].

## vm.runInContext(código, contextifiedSandbox[, opciones])

* `code` {string} El código JavaScript para compilar y ejecutar.
* `contextifiedSandbox` {Object} El objeto [contextualizado](#vm_what_does_it_mean_to_contextify_an_object) que se utilizará como el `global` cuando el `code` se compila y ejecuta.
* `opciones` {Object|string}
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el número de línea del desplazamiento que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el número de la columna del desplazamiento que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si ocurre un error [`Error`][] mientras se compila el `code`, la línea del código que causa el error se adjunta al stack trace.
  * `timeout` {integer} Especifica la cantidad de milisegundos para ejecutar el `code` antes de terminar la ejecución. Si la ejecución se termina, se producirá un [`Error`][]. This value must be a strictly positive integer.

El método `vm.runInContext()` compila el `code`, lo ejecuta dentro del contexto del `contextifiedSandbox` y luego devuelve el resultado. El código en ejecución no tiene acceso al ámbito local. El objeto `contextifiedSandbox` *debe* ser [contextualizado](#vm_what_does_it_mean_to_contextify_an_object) previamente utilizando el método [`vm.createContext()`][].

Si `options` es una cadena, entonces especifica el nombre del archivo.

El siguiente ejemplo compila y ejecuta diferentes scripts utilizando un objeto [contextualizado](#vm_what_does_it_mean_to_contextify_an_object) único:

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
* `sandbox` {Object} Un objeto que se [contextualizará](#vm_what_does_it_mean_to_contextify_an_object). Si es `undefined`, un nuevo objeto se creará.
* `opciones` {Object|string}
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el número de línea del desplazamiento que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el número de la columna del desplazamiento que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si ocurre un error [`Error`][] mientras se compila el `code`, la línea del código que causa el error se adjunta al stack trace.
  * `timeout` {integer} Especifica la cantidad de milisegundos para ejecutar el `code` antes de terminar la ejecución. Si la ejecución se termina, se producirá un [`Error`][]. This value must be a strictly positive integer.
  * `contextName` {string} Nombre legible del contexto creado recientemente. **Predeterminado:** `'VM Context i'`, donde `i` es un índice numérico ascendente del contexto creado.
  * `contextOrigin` {string} El [origen](https://developer.mozilla.org/en-US/docs/Glossary/Origin) correspondiente al contexto creado recientemente con propósitos de visualización. El origen debe ser formateado como un URL, pero solo con el esquema, el host y el puerto (si es necesario), como el valor de la propiedad [`url.origin`][] de un objeto [`URL`][]. En particular, esta cadena debe omitir la barra (/) al final, ya que denota una ruta. **Predeterminado:** `"`.

El `vm.runInNewContext()` primero contextualiza el objeto `sandbox` dado (o crea un nuevo `sandbox` si se pasa como `undefined`), compila el `code`, lo ejecuta dentro del contexto del contexto creado y luego devuelve el resultado. El código en ejecución no tiene acceso al ámbito global.

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
* `opciones` {Object|string}
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el número de línea del desplazamiento que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el número de la columna del desplazamiento que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si ocurre un error [`Error`][] mientras se compila el `code`, la línea del código que causa el error se adjunta al stack trace.
  * `timeout` {integer} Especifica la cantidad de milisegundos para ejecutar el `code` antes de terminar la ejecución. Si la ejecución se termina, se producirá un [`Error`][]. This value must be a strictly positive integer.

`vm.runInThisContext()` compila el `code`, lo ejecuta dentro del contexto del `global` actual y devuelve el resultado. El código en ejecución no tiene acceso al ámbito local, pero tiene acceso al objeto `global` actual.

Si `options` es una cadena, entonces especifica el nombre del archivo.

El siguiente ejemplo ilustra el uso de `vm.runInThisContext()` y de la función [`eval()`][] de JavaScript para ejecutar el mismo código:
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

A causa de que `vm.runInThisContext()` no tiene acceso al ámbito local, `localVar` no se modifica. En cambio, [`eval()`][] *tiene* acceso al ámbito local, por lo que el valor de `localVar` se modifica. De esta manera, `vm.runInThisContext()` es muy similar a una [llamada indirecta `eval()`][], por ejemplo `(0,eval)('code')`.

## Ejemplo: Ejecutar un Servidor HTTP dentro de una Máquina Virtual

Cuando se utiliza [`script.runInThisContext()`][] o [`vm.runInThisContext()`][], el código se ejecuta dentro del contexto global V8 actual. El código pasado a este contexto VM tendrá su propio ámbito aislado.

A fin de ejecutar un servidor web simple utilizando el módulo `http` el código pasado para el contexto debe llamar a `require('http')` por sí solo, o tener una referencia al módulo `http` pasado a él. Por ejemplo:

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

El `require()` en el caso anterior comparte el estado con el contexto desde el cual se pasa. Esto puede introducir riesgos cuando se ejecuta un código no confiable, por ejemplo alterar objetos en el contexto de maneras no deseadas.

## ¿Qué significa "contextificar" un objeto?

Todo JavaScript ejecutado en Node.js se ejecuta dentro del ámbito de un "contexto". De acuerdo a la [Guía de Incrustadores V8](https://github.com/v8/v8/wiki/Embedder's%20Guide#contexts):

> En V8, un contexto es un entorno de ejecución que permite que aplicaciones de JavaScript independientes y no relacionadas se ejecuten en una sola instancia de V8. Se debe especificar explícitamente el contexto en el que desea que se ejecute cualquier código JavaScript.

Cuando el `vm.createContext()` se llama, el objeto `sandbox` que se pasa (o un objeto creado recientemente si `sandbox` está `undefined`) se asocia internamente con una nueva instancia de un Contexto V8. Este Contexto V8 proporciona el `code` que se ejecuta utilizando los métodos del módulo `vm` con un ambiente global aislado dentro del cual puede operar. El proceso de creación del Contexto V8 y asociarlo con el objeto `sandbox` es lo que este documento denomina como "contextualizar" el `sandbox`.

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
