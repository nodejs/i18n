# VM (Ejecutando JavaScript)

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

<!--name=vm-->

El módulo `vm` proporciona APIs para compilar y ejecutar códigos dentro de los contextos de la Máquina Virtual V8.

El código JavaScript puede ser compilado y ejecutado inmediatamente o compilado, guardado y ejecutado después.

Un caso de uso común es ejecutar el código en un entorno de pruebas (sandbox). El código del entorno de prueba utiliza un Contexto V8 diferente, lo que significa que tiene un objeto global diferente al resto del código.

Uno puedo proporcionar el contexto ["contextifying"](#vm_what_does_it_mean_to_contextify_an_object) un objeto sandbox. El código del entorno de prueba trata cualquier propiedad en el sandbox como una variable global. Cualquier cambio en las variables globales causado por el código del entorno de prueba se refleja en el objeto sandbox.

```js
const vm = require('vm');

const x = 1;

const sandbox = { x: 2 };
vm.createContext(sandbox); // Contextify the sandbox.

const code = 'x += 40; var y = 17;';
// x y y son variables globales en el entorno de prueba.
// Inicialmente, x tiene el valor 2 porque ese es el valor de sandbox.x.
vm.runInContext(code, sandbox);

console.log(sandbox.x); // 42
console.log(sandbox.y); // 17

console.log(x); // 1; y no está definido.
```

**El módulo vm no es un mecanismo de seguridad. No lo utilice para ejecutar código no confiable**.

## Clase: vm.Module

<!-- YAML
added: v9.6.0
-->

> Estabilidad: 1 - Experimental

*Esta función solo está disponible con el indicador de comando `--experimental-vm-modules` habilitado.*

La clase `vm.Module` proporciona una interfaz de bajo nivel para utilizar módulos ECMAScript en contextos VM. Es la contraparte de la clase `vm.Script` que refleja estrechamente los [Registros del Módulo de Texto de Fuente](https://tc39.github.io/ecma262/#sec-source-text-module-records) que se definen en la especificación ECMAScript.

Sin embargo, a diferencia de `vm.Script`, cada objeto `vm.Module` está vinculado a un contexto desde su creación. Las operaciones en objetos `vm.Module` son intrínsecamente asincrónicas, en contraste con la naturaleza sincrónica de los objetos `vm.Script`. Con la ayuda de las funciones asincrónicas, sin embargo, manipular objetos `vm.Module` es bastante sencillo.

Utilizar un objeto `vm.Module` requiere cuatro pasos distintos: creación/análisis, vinculación, creación de instancias, y evaluación. Estos cuatro pasos se ilustran en el siguiente ejemplo.

Esta implementación se encuentra a un nivel más bajo que el [cargador de Módulo ECMAScript](esm.html#esm_ecmascript_modules). Actualmente, tampoco hay manera de interactuar con el Cargador, aunque el soporte está planeado.

```js
const contextifiedSandbox = vm.createContext({ secret: 42 });

(async () => {
  // Paso 1
  //
  // Crea un Módulo mediante la construcción de un nuevo objeto `vm.Module`. Esto analiza
  // el texto fuente proporcionado, lanzando un `SyntaxError` si algo sale mal. Por
  // defecto, un Módulo se crea en el contexto superior. Pero ahí, especificamos a
  // `contextifiedSandbox` como el contexto al que pertenece este Módulo.
  //
  // Aquí, intentamos obtener la exportación predeterminado del módulo "foo", y
  // colocarla en el enlace local "secreto".

  const bar = new vm.Module(`
    import s from 'foo';
    s;
  `, { context: contextifiedSandbox });

  // Paso 2
  //
  // "Enlace" las dependencias importadas de este Módulo.
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
      return new vm.Module(`
        // La variable "secreta" se refiere a la variable global que agregamos a
        // "contextifiedSandbox" al crear el contexto.
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

### Constructor: nuevo vm.Module(code[, options])

* `code` {string} Código del Módulo JavaScript para analizar
* `options` 
  * `url` {string} URL utilizado en la resolución de módulo y stack traces. **Predeterminado:** `'vm:module(i)'` donde `i` es un índice ascendente de contexto específico.
  * `context` {Object} El objeto [contextualizado](#vm_what_does_it_mean_to_contextify_an_object) como es devuelto por el método `vm.createContext()`, para compilar y evaluar este `Module`.
  * `lineOffset` {integer} Especifica el desplazamiento del número de línea que se muestra en los stack traces producidos por este `Module`.
  * `columnOffset` {integer} Especifica el desplazamiento del número de columna que se muestra en los stack traces producidos por este `Modulo`.
  * `initalizeImportMeta` {Function} Llamada durante la evaluación de este `Module` para inicializar el `import.meta`. Esta función tiene la firma `(meta,
module)`, donde `meta` es el objeto `import.meta` en el `Module`, y `module` es este objeto `vm.Module`.

Crea un nuevo objeto ES `Module`.

*Nota*: Las propiedades asignadas al objeto `import.meta` que son objetos pueden permitir que el `Module` acceda a información fuera del `context` especificado, si el objeto se crea en el contexto de nivel superior. Utilice `vm.runInContext()` para crear objetos en un contexto específico.

```js
const vm = require('vm');

const contextifiedSandbox = vm.createContext({ secret: 42 });

(async () => {
  const module = new vm.Module(
    'Object.getPrototypeOf(import.meta.prop).secret = secret;',
    {
      initializeImportMeta(meta) {
        // Nota: este objeto se crea en el contexto superior. Como tal,
        // Object.getPrototypeOf(import.meta.prop) apunta al
        // Object.prototype en el contexto superior, en lugar de en
        // el sandbox.
        meta.prop = {};
      }
    });
  // Ya que el módulo no tiene dependencias, la función del enlazador nunca se llamará.
  await module.link(() => {});
  module.initialize();
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

### module.linkingStatus

* {string}

El estatus de vinculación actual del `module`. Será uno de los siguientes valores:

* `'unlinked'`: `module.link()` todavía no ha sido llamado.
* `'linking'`: `module.link()` ha sido llamado, pero no todas las Promesas devueltas por la función del enlazador han sido resueltas todavía.
* `'linked'`: `module.link()` ha sido llamado, y todas sus dependencias han sido exitosamente enlazadas.
* `'errored'`: `module.link()` ha sido llamado, pero al menos una de sus dependencias falló al enlazarse, ya sea porque el callback retornó una `Promise` que se rechaza, o porque el `Module` que el callback retornó es inválido.

### module.namespace

* {Object}

El objeto namespace del módulo. Esto solo está disponible después de que la instantación (`module.instantiate()`) se haya completado.

Corresponde a la operación abstracta [GetModuleNamespace](https://tc39.github.io/ecma262/#sec-getmodulenamespace) en la especificación de ECMAScript.

### module.status

* {string}

El estatus actual del módulo. Será uno de:

* `'uninstantiated'`: El módulo no está instanciado. Puede ser por alguna de las siguientes razones:
  
  * El módulo se acaba de crear.
  * `module.instantiate()` ha sido llamado en este módulo, pero falló por alguna razón.
  
  Este estatus no transmite ninguna información con respecto a si `module.link()` ha sido llamado. Vea `module.linkingStatus` para eso.

* `'instantiating'`: El módulo se está instanciando actualmente mediante un `module.instantiate()` llamado sobre sí mismo o un módulo principal.

* `'instantiated'`: El módulo ha sido instanciado exitosamente, pero `module.evaluate()` todavía no ha sido llamado.

* `'evaluating'`: El módulo se está evaluando mediante un `module.evaluate()` en sí mismo o en un módulo principal.

* `'evaluated'`: El módulo ha sido evaluado exitosamente.

* `'errored'`: El módulo ha sido evaluado, pero se lanzó una excepción.

Aparte de `'errored'`, esta cadena de estatus corresponde al campo de `[[Status]]` del [Registro de Módulo de Texto de Fuente](https://tc39.github.io/ecma262/#sec-source-text-module-records) de la especificación. `'errored'` corresponde a `'evaluated'` en la especificación, pero con `[[EvaluationError]]` configurado a un valor que no está `undefined`.

### module.url

* {string}

El URL del módulo actual, como se configura en el constructor.

### module.evaluate([options])

* `options` {Object} 
  * `timeout` {number} Especifica la cantidad de milisegundos para evaluar antes de terminar la ejecución. Si la ejecución se interrumpe, un [`Error`][] se lanzará.
  * `breakOnSigint` {boolean} Si es `true`, la ejecución se terminará cuando `SIGINT` (Ctrl+C) se reciba. Los controladores existentes para el evento que se han adjuntado a través de `process.on('SIGINT')` se desactivarán durante la ejecución del script, pero continuarán trabajando después de eso. Si se interrumpe la ejecución, un [`Error`][] se lanzará.
* Devuelve: {Promise}

Evaluar el módulo.

Esto debe ser llamado después de que el módulo haya sido instanciado; de lo contrario lanzará un error. Podría llamarse también cuando el módulo ya haya sido evaluado, en ese caso hará una de las siguientes dos cosas:

* devuelve `undefined` si la evaluación inicial terminó correctamente (`module.status` es `'evaluated'`)
* vuelve a producir la misma excepción que la evaluación inicial lanzó si la evaluación inicial terminó en un error (`module.status` es `'errored'`)

Este método no puede llamarse mientras el módulo está siendo evaluado (`module.status` es `'evaluating'`) para evitar la recursión infinita.

Corresponde al campo del [método concreto Evaluate()](https://tc39.github.io/ecma262/#sec-moduleevaluation) de los [Registros de Módulo de Texto de Fuente](https://tc39.github.io/ecma262/#sec-source-text-module-records) en la especificación ECMAScript.

### module.instantiate()

Instanciar el módulo. Esto debe llamarse después de que el enlace se haya completado (`linkingStatus` es `'linked'`); de lo contrario lanzará un error. También puede lanzar una excepción si uno de las dependencias no proporciona una exportación que el módulo principal requiere.

Sin embargo, si esta función fue exitosa, las llamadas adicionales para esta función después de la instanciación inicial no estarán operativas, para ser consistentes con la especificación ECMAScript.

A diferencias de otros métodos operativos en `Module`, este función se completa sincrónicamente y no devuelve nada.

Corresponde al campo del [método concreto Instantiate()](https://tc39.github.io/ecma262/#sec-moduledeclarationinstantiation) de los [Registros de Módulo de Texto de Fuente](https://tc39.github.io/ecma262/#sec-source-text-module-records) en la especificación ECMAScript.

### module.link(linker)

* `linker` {Function}
* Devuelve: {Promise}

Dependencias del módulo de enlace. Este método debe llamarse antes de la instanciación, y solo puede llamarse una vez por módulo.

Dos parámetros se pasarán a la función `linker`:

* `specifier` El especificador del módulo requerido: <!-- eslint-skip -->
  
      js
      import foo from 'foo';
      //              ^^^^^ el especificador del módulo

* `referencingModule` Se llama al `link()` del objeto `Module`.

La función se espera para devolver un objeto `Module` o un `Promise` que eventualmente se convierta en un objeto `Module`. El `Module` devuelto debe satisfacer las siguientes dos invariantes:

* Debe pertenecer al mismo contexto que el `Module` principal.
* Su `linkingStatus` no debe ser `'errored'`.

Si el `linkingStatus` del `Module` devuelto está `'unlinked'`, este método se llamará recursivamente en el `Module` devuelto con la misma función del `linker` proporcionado.

`link()` devuelve un `Promise` que se resolverá cuando todas las instancias de enlace se resuelvan en un `Module` válido, o se rechazará si la función enlazador lanza una excepción o devuelve un `Module` inválido.

La función enlazador corresponde aproximadamente a la operación abstracta de [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) definida por la implementación en la especificación ECMAScript, con algunas diferencias clave:

* La función enlazador puede ser asincrónica mientras que [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) es sincrónica.
* La función enlazador se ejecuta durante la vinculación, una etapa específica de Node.js antes de la instanciación, mientras que [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) se llama durante la instanciación.

La implementación [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) real utilizada durante la instanciación del módulo es aquella que devuelve los módulos enlazados durante la vinculación. Dado que en ese punto todos los módulos ya estarían completamente enlazados, la implementación [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) es completament sincrónica por especificación.

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
-->

* `code` {string} El código JavaScript para compilar.
* `options` 
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el número de línea del desplazamiento que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el número de la columna del desplazamiento que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si produce un error [`Error`][] mientras se compila el `code`, la línea del código que causa el error se adjunta al stack trace.
  * `timeout` {number} Especifica la cantidad de milisegundos para ejecutar el `code` antes de terminar la ejecución. Si la ejecución se termina, se producirá un [`Error`][].
  * `cachedData` {Buffer} Proporciona un `Buffer` opcional con los datos de caché del código de V8 para la fuente suministrada. Cuando se suministre, el valor de `cachedDataRejected` se establecerá en `true` o `false` dependiendo de la aceptación de los datos por V8.
  * `produceCachedData` {boolean} Cuando es `true` y no está presente `cachedData`, V8 intentará producir datos de caché del código para `code`. En caso de éxito, un `Buffer` con datos de caché del código de V8 se producirá y almacenará en la propiedad `cachedData` de la instancia `vm.Script` devuelta. El valor `cachedDataProduced` se establecerá en `true` o `false` dependiendo de si los datos de caché del código se producen exitosamente.

La creación de un nuevo objeto `vm.Script` compila el `code` pero no lo ejecuta. El `vm.Script` compilado se puede ejecutar múltiples veces después. El `code` no está vinculado a ningún objeto global; más bien, se vincula antes de la ejecución, solo para esa ejecución.

### script.runInContext(contextifiedSandbox[, options])

<!-- YAML
added: v0.3.1
changes:

  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/6635
    description: The `breakOnSigint` option is supported now.
-->

* `contextifiedSandbox` {Object} Un objeto [contextualizado](#vm_what_does_it_mean_to_contextify_an_object) como resultado del método `vm.createContext()`.
* `options` {Object} 
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el número de línea del desplazamiento que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el número de columna del desplazamiento que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si produce un error [`Error`][] mientras se compila el `code`, la línea del código que causa el error se adjunta al stack trace.
  * `timeout` {number} Especifica la cantidad de milisegundos para ejecutar el `code` antes de terminar la ejecución. Si se termina la ejecución, se producirá un [`Error`][].
  * `breakOnSigint`: si es `true`, la ejecución terminará cuando se reciba `SIGINT` (Ctrl+C). Los controladores existentes para el evento que se han adjuntado a través de `process.on('SIGINT')` se desactivarán durante la ejecución del script, pero continuarán trabajando después de eso. Si se termina la ejecución, se producirá un [`Error`][].

Se ejecuta el código compilado contenido por el objeto `vm.Script` dentro del `contextifiedSandbox` dado y devuelve el resultado. Running code does not have access to local scope.

The following example compiles code that increments a global variable, sets the value of another global variable, then execute the code multiple times. The globals are contained in the `sandbox` object.

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

* `sandbox` {Object} An object that will be [contextified](#vm_what_does_it_mean_to_contextify_an_object). If `undefined`, a new object will be created.
* `options` {Object} 
  * `filename` {string} Specifies the filename used in stack traces produced by this script.
  * `lineOffset` {number} Specifies the line number offset that is displayed in stack traces produced by this script.
  * `columnOffset` {number} Specifies the column number offset that is displayed in stack traces produced by this script.
  * `displayErrors` {boolean} When `true`, if an [`Error`][] error occurs while compiling the `code`, the line of code causing the error is attached to the stack trace.
  * `timeout` {number} Specifies the number of milliseconds to execute `code` before terminating execution. If execution is terminated, an [`Error`][] will be thrown.
  * `contextName` {string} Human-readable name of the newly created context. **Default:** `'VM Context i'`, where `i` is an ascending numerical index of the created context.
  * `contextOrigin` {string} [Origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin) corresponding to the newly created context for display purposes. The origin should be formatted like a URL, but with only the scheme, host, and port (if necessary), like the value of the [`url.origin`][] property of a [`URL`][] object. Most notably, this string should omit the trailing slash, as that denotes a path. **Default:** `''`.
  * `contextCodeGeneration` {Object} 
    * `strings` {boolean} If set to false any calls to `eval` or function constructors (`Function`, `GeneratorFunction`, etc) will throw an `EvalError`. **Predeterminado:** `true`.
    * `wasm` {boolean} If set to false any attempt to compile a WebAssembly module will throw a `WebAssembly.CompileError`. **Predeterminado:** `true`.

First contextifies the given `sandbox`, runs the compiled code contained by the `vm.Script` object within the created sandbox, and returns the result. Running code does not have access to local scope.

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
  * `timeout` {number} Specifies the number of milliseconds to execute `code` before terminating execution. If execution is terminated, an [`Error`][] will be thrown.

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
* Returns: {boolean}

Returns `true` if the given `sandbox` object has been [contextified](#vm_what_does_it_mean_to_contextify_an_object) using [`vm.createContext()`][].

## vm.runInContext(code, contextifiedSandbox[, options])

* `code` {string} The JavaScript code to compile and run.
* `contextifiedSandbox` {Object} The [contextified](#vm_what_does_it_mean_to_contextify_an_object) object that will be used as the `global` when the `code` is compiled and run.
* `options` {Object|string} 
  * `filename` {string} Specifies the filename used in stack traces produced by this script.
  * `lineOffset` {number} Specifies the line number offset that is displayed in stack traces produced by this script.
  * `columnOffset` {number} Specifies the column number offset that is displayed in stack traces produced by this script.
  * `displayErrors` {boolean} When `true`, if an [`Error`][] error occurs while compiling the `code`, the line of code causing the error is attached to the stack trace.
  * `timeout` {number} Specifies the number of milliseconds to execute `code` before terminating execution. If execution is terminated, an [`Error`][] will be thrown.

The `vm.runInContext()` method compiles `code`, runs it within the context of the `contextifiedSandbox`, then returns the result. Running code does not have access to the local scope. The `contextifiedSandbox` object *must* have been previously [contextified](#vm_what_does_it_mean_to_contextify_an_object) using the [`vm.createContext()`][] method.

If `options` is a string, then it specifies the filename.

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

## vm.runInNewContext(code\[, sandbox\]\[, options\])

<!-- YAML
added: v0.3.1
-->

* `code` {string} The JavaScript code to compile and run.
* `sandbox` {Object} An object that will be [contextified](#vm_what_does_it_mean_to_contextify_an_object). If `undefined`, a new object will be created.
* `options` {Object|string} 
  * `filename` {string} Specifies the filename used in stack traces produced by this script.
  * `lineOffset` {number} Specifies the line number offset that is displayed in stack traces produced by this script.
  * `columnOffset` {number} Specifies the column number offset that is displayed in stack traces produced by this script.
  * `displayErrors` {boolean} When `true`, if an [`Error`][] error occurs while compiling the `code`, the line of code causing the error is attached to the stack trace.
  * `timeout` {number} Specifies the number of milliseconds to execute `code` before terminating execution. If execution is terminated, an [`Error`][] will be thrown.
  * `contextName` {string} Human-readable name of the newly created context. **Default:** `'VM Context i'`, where `i` is an ascending numerical index of the created context.
  * `contextOrigin` {string} [Origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin) corresponding to the newly created context for display purposes. The origin should be formatted like a URL, but with only the scheme, host, and port (if necessary), like the value of the [`url.origin`][] property of a [`URL`][] object. Most notably, this string should omit the trailing slash, as that denotes a path. **Default:** `''`.

The `vm.runInNewContext()` first contextifies the given `sandbox` object (or creates a new `sandbox` if passed as `undefined`), compiles the `code`, runs it within the context of the created context, then returns the result. Running code does not have access to the local scope.

If `options` is a string, then it specifies the filename.

The following example compiles and executes code that increments a global variable and sets a new one. These globals are contained in the `sandbox`.

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

* `code` {string} The JavaScript code to compile and run.
* `options` {Object|string} 
  * `filename` {string} Specifies the filename used in stack traces produced by this script.
  * `lineOffset` {number} Specifies the line number offset that is displayed in stack traces produced by this script.
  * `columnOffset` {number} Specifies the column number offset that is displayed in stack traces produced by this script.
  * `displayErrors` {boolean} When `true`, if an [`Error`][] error occurs while compiling the `code`, the line of code causing the error is attached to the stack trace.
  * `timeout` {number} Specifies the number of milliseconds to execute `code` before terminating execution. If execution is terminated, an [`Error`][] will be thrown.

`vm.runInThisContext()` compiles `code`, runs it within the context of the current `global` and returns the result. Running code does not have access to local scope, but does have access to the current `global` object.

If `options` is a string, then it specifies the filename.

The following example illustrates using both `vm.runInThisContext()` and the JavaScript [`eval()`][] function to run the same code:

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

Because `vm.runInThisContext()` does not have access to the local scope, `localVar` is unchanged. In contrast, [`eval()`][] *does* have access to the local scope, so the value `localVar` is changed. In this way `vm.runInThisContext()` is much like an [indirect `eval()` call][], e.g. `(0,eval)('code')`.

## Example: Running an HTTP Server within a VM

When using either [`script.runInThisContext()`][] or [`vm.runInThisContext()`][], the code is executed within the current V8 global context. The code passed to this VM context will have its own isolated scope.

In order to run a simple web server using the `http` module the code passed to the context must either call `require('http')` on its own, or have a reference to the `http` module passed to it. For instance:

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

## What does it mean to "contextify" an object?

All JavaScript executed within Node.js runs within the scope of a "context". According to the [V8 Embedder's Guide](https://github.com/v8/v8/wiki/Embedder's%20Guide#contexts):

> In V8, a context is an execution environment that allows separate, unrelated, JavaScript applications to run in a single instance of V8. You must explicitly specify the context in which you want any JavaScript code to be run.

When the method `vm.createContext()` is called, the `sandbox` object that is passed in (or a newly created object if `sandbox` is `undefined`) is associated internally with a new instance of a V8 Context. This V8 Context provides the `code` run using the `vm` module's methods with an isolated global environment within which it can operate. The process of creating the V8 Context and associating it with the `sandbox` object is what this document refers to as "contextifying" the `sandbox`.