# VM (Ejecutar JavaScript)

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

<!--name=vm-->

El módulo de `vm` proporciona APIs para compilar y ejecutar código dentro de contextos de Máquinas Virtuales de V8.

El código de JavaScript se puede compilar y ejecutar inmediatamente o compilar, guardar y ejecutar más tarde.

Un caso de uso común es ejecutar el código en un entorno de pruebas. El código de espacio aislado usa un Contexto de V8 diferente, lo que significa que tiene un objeto global diferente al resto del código.

Uno puede proporcionar el contexto ["contextificando"](#vm_what_does_it_mean_to_contextify_an_object) un objeto de proceso aislado. El código del entorno de pruebas trata a cualquier propiedad del entorno de pruebas como una variable global. Cualquier cambio en las variables globales causado por el código de entorno de pruebas se refleja en el objeto del entorno de pruebas.

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

*Nota*: El módulo de vm no es un mecanismo de seguridad. **No lo utilice para ejecutar código que no sea confiable**.

## Clase: vm.Script

<!-- YAML
added: v0.3.1
-->

Las instancias de la clase `vm.Script` contienen scripts precompilados que se pueden ejecutar en entornos de prueba específicos (o "contextos").

### nuevo vm.Script (código, opciones)

<!-- YAML
added: v0.3.1
changes:

  - version: v5.7.0
    pr-url: https://github.com/nodejs/node/pull/4777
    description: The `cachedData` and `produceCachedData` options are
                 supported now.
-->

* `code` {string} El código de JavaScript para compilar.
* `options` 
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el desplazamiento del número de línea que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el desplazamiento del número de columna que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si ocurre un error [`Error`][] al compilar `code`, la línea de código que causa el error se adjunta al stack trace.
  * `timeout` {number} Especifica el número de milisegundos para ejecutar `code` antes de terminar la ejecución. Si se termina la ejecución, se arrojará [`Error`][].
  * `cachedData` {Buffer} Proporciona un `Buffer` opcional con datos de caché de código de V8 para la fuente suministrada. Cuando se suministre, el valor `cachedDataRejected` se establecerá en `true` o `false` según la aceptación de los datos por parte de V8.
  * `produceCachedData` {boolean} Cuando sea `true` y no haya `cachedData`, V8 intentará producir datos de caché de código para `code`. En caso de éxito, se producirá y almacenará un `Buffer` con datos de caché de código de V8 en la propiedad `cachedData` de la instancia `vm.Script` devuelta. El valor `cachedDataProduced` se establecerá en `true` o `false` dependiendo de si los datos de la caché de código se producen correctamente.

Crear un nuevo objeto `vm.Script` compila `code` pero no lo ejecuta. El `vm.Script` compilado se puede ejecutar más tarde varias veces. The `code` is not bound to any global object; rather, it is bound before each run, just for that run.

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
  * `timeout` {number} Especifica el número de milisegundos para ejecutar `code` antes de terminar la ejecución. Si se termina la ejecución, se arrojará [`Error`][].
  * `breakOnSigint`: si es `true`, la ejecución terminará cuando se reciba `SIGINT` (Ctrl + C). Los manejadores existentes para el evento que se han adjuntado mediante `process.on('SIGINT')` se deshabilitarán durante la ejecución del script, pero continuarán funcionando después de eso. Si se termina la ejecución, se arrojará un [`Error`][].

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

*Nota*: El uso de las opciones `timeout` o `breakOnSigint` dará lugar a nuevos bucles de eventos y se iniciarán las hebras correspondientes, que tienen una sobrecarga de rendimiento distinta de cero.

### script.runInNewContext([sandbox[, opciones]])

<!-- YAML
added: v0.3.1
-->

* `sandbox` {Object} Un objeto que será [contextificado](#vm_what_does_it_mean_to_contextify_an_object). Si es `undefined`, se creará un nuevo objeto.
* `options` {Object} 
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el desplazamiento del número de línea que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el desplazamiento del número de columna que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si ocurre un error [`Error`][] al compilar `code`, la línea de código que causa el error se adjunta al stack trace.
  * `timeout` {number} Especifica el número de milisegundos para ejecutar `code` antes de terminar la ejecución. Si se termina la ejecución, se arrojará [`Error`][].

Primero contextualiza el `sandbox` dado, ejecuta el código de compilación contenido en el objeto `vm.Script` dentro del sandbox creado, y devuelve el resultado. El código de ejecución no tiene acceso al ámbito local.

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
  * `timeout` {number} Especifica el número de milisegundos para ejecutar `code` antes de terminar la ejecución. Si se termina la ejecución, se arrojará [`Error`][].

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

## vm.createContext([sandbox])

<!-- YAML
added: v0.3.1
-->

* `sandbox` {Object}

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

## vm.isContext(sandbox)

<!-- YAML
added: v0.11.7
-->

* `sandbox` {Object}

Devuelve `true` si el objeto de `sandbox` dado ha sido [contextificado](#vm_what_does_it_mean_to_contextify_an_object) usando [`vm.createContext()`][].

## vm.runInContext(código, contextifiedSandbox[, opciones])

* `code` {string} El código JavaScript para compilar y ejecutar.
* `contextifiedSandbox` {Object} El objeto [contextificado](#vm_what_does_it_mean_to_contextify_an_object) que se utilizará como `global` cuando `code` sea compilado y ejecutado.
* `options` 
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el desplazamiento del número de línea que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el desplazamiento del número de columna que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si ocurre un error [`Error`][] al compilar `code`, la línea de código que causa el error se adjunta al stack trace.
  * `timeout` {number} Especifica el número de milisegundos para ejecutar `code` antes de terminar la ejecución. Si se termina la ejecución, se arrojará [`Error`][].

El método `vm.runInContext()` compila `code`, lo ejecuta dentro del contexto de `contextifiedSandbox`, luego devuelve el resultado. El código de ejecución no tiene acceso al ámbito local. El objeto `contextifiedSandbox` *debe* haber sido previamente [contextificado](#vm_what_does_it_mean_to_contextify_an_object) usando el método [`vm.createContext()`][].

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

## vm.runInDebugContext(código)

<!-- YAML
added: v0.11.14
-->

> Estabilidad: 0 - Desaprobado. Una alternativa está en desarrollo.

* `code` {string} El código JavaScript para compilar y ejecutar.

El método `vm.runInDebugContext()` compila y ejecuta `code` dentro del contexto de depuración de V8. El caso de uso principal es obtener acceso al objeto `Debug` de V8:

```js
const vm = require('vm');
const Debug = vm.runInDebugContext('Debug');
console.log(Debug.findScript(process.emit).name);  // 'events.js'
console.log(Debug.findScript(process.exit).name);  // 'internal/process.js'
```

*Nota*: el contexto y el objeto de depuración están vinculados intrínsecamente a la implementación del depurador de V8 y pueden cambiar (o incluso eliminarse) sin previo aviso.

El objeto `Debug` también puede hacerse disponible utilizando la [opción de línea de comando](cli.html) `--expose_debug_as=` específica de V8.

## vm.runInNewContext(código\[, sandbox\]\[, opciones\])

<!-- YAML
added: v0.3.1
-->

* `code` {string} El código JavaScript para compilar y ejecutar.
* `sandbox` {Object} Un objeto que se [contextualizará](#vm_what_does_it_mean_to_contextify_an_object). Si es `undefined`, se creará un nuevo objeto.
* `options` 
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el desplazamiento del número de línea que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el desplazamiento del número de columna que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si ocurre un error [`Error`][] al compilar `code`, la línea de código que causa el error se adjunta al stack trace.
  * `timeout` {number} Especifica el número de milisegundos para ejecutar `code` antes de terminar la ejecución. Si se termina la ejecución, se arrojará [`Error`][].

El `vm.runInNewContext()` primero contextifica el objeto del `sandbox` dado (o crea un `sandbox` nuevo si se pasa como `undefined`), compila `code`, lo ejecuta dentro del contexto del contexto creado y luego devuelve el resultado. El código de ejecución no tiene acceso al ámbito local.

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
* `options` 
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el desplazamiento del número de línea que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el desplazamiento del número de columna que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si ocurre un error [`Error`][] al compilar `code`, la línea de código que causa el error se adjunta al stack trace.
  * `timeout` {number} Especifica el número de milisegundos para ejecutar `code` antes de terminar la ejecución. Si se termina la ejecución, se arrojará [`Error`][].

`vm.runInThisContext()` compila `code`, lo ejecuta dentro del contexto del `global` actual y devuelve el resultado. El código en ejecución no tiene acceso al ámbito local, pero sí tiene acceso al objeto `global` actual.

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

Cuando se usa [`script.runInThisContext()`][] o [`vm.runInThisContext()`][], el código se ejecuta dentro del contexto global actual de V8. El código pasado a este contexto de VM tendrá su propio ámbito aislado.

Para ejecutar un servidor web simple utilizando el módulo `http`, el código que se pasa al contexto debe llamar a `require('http')` por sí solo, o bien se debe pasar una referencia al módulo `http`. Por ejemplo:

```js 'use strict'; const vm = require('vm');

const code = ` ((require) => { const http = require('http');

    http.createServer((request, response) => {
      response.writeHead(200, { 'Content-Type': 'text/plain' });
      response.end('Hello World\\n');
    }).listen(8124);
    
    console.log('Server running at http://127.0.0.1:8124/');
    

})`;

vm.runInThisContext(code)(require); ```

*Nota*: el `require()` en el caso anterior comparte el estado con el contexto desde el cual se pasa. Esto puede generar riesgos cuando se ejecuta un código no confiable, por ejemplo, alterar objetos en el contexto de manera no deseada.

## ¿Qué significa "contextificar" un objeto?

Todo el JavaScript ejecutado dentro de Node.js se ejecuta dentro del ámbito de un "contexto". De acuerdo a la [Guía de Incrustadores V8](https://github.com/v8/v8/wiki/Embedder's%20Guide#contexts):

> En V8, un contexto es un entorno de ejecución que permite que aplicaciones de JavaScript independientes y no relacionadas se ejecuten en una sola instancia de V8. Se debe especificar explícitamente el contexto en el que desea que se ejecute cualquier código JavaScript.

Cuando el método `vm.createContext()` es llamado, el objeto de `sandbox` que se pasa (o un objeto recién creado si `sandbox` es `undefined`) es asociado internamente con una nueva instancia de un Contexto de V8. This V8 Context provides the `code` run using the `vm` module's methods with an isolated global environment within which it can operate. El proceso de crear el Contexto de V8 y asociarlo con el objeto de `sandbox` es lo que este documento denomina "contextificar" el `sandbox`.