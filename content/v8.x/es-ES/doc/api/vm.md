# VM (Ejecutar JavaScript)

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

<!--name=vm-->

El módulo de `vm` proporciona APIs para compilar y ejecutar código dentro de contextos de Máquinas Virtuales de V8.

El código de JavaScript se puede compilar y ejecutar inmediatamente o compilar, guardar y ejecutar más tarde.

Un caso de uso común es ejecutar el código en un entorno de pruebas. El código del entorno de pruebas usa un Contexto de V8 diferente, lo que significa que tiene un objeto global diferente al resto del código.

Uno puede proporcionar el contexto ["contextificando"](#vm_what_does_it_mean_to_contextify_an_object) un objeto de un entorno de pruebas. El código del entorno de pruebas trata a cualquier propiedad del entorno de pruebas como una variable global. Cualquier cambio en las variables globales causado por el código de entorno de pruebas se refleja en el objeto del entorno de pruebas.

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

Las instancias de la clase `vm.Script` contienen scripts precompilados que pueden ejecutarse en sandboxes específicos (o "contextos").

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

La creación de un nuevo objeto `vm.Script` compila el `code` pero no lo ejecuta. El `vm.Script` compilado se puede ejecutar múltiples veces después. El `code` no está vinculado a ningún objeto global; más bien, se vincula antes de la ejecución, solo para esa ejecución.

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
  * `displayErrors` {boolean} Cuando es `true`, si ocurre un error [`Error`][] mientras se compila el `code`, la línea del código que causa el error se adjunta al stack trace.
  * `timeout` {number} Especifica la cantidad de milisegundos para ejecutar el `code` antes de terminar la ejecución. Si la ejecución se termina, se producirá un [`Error`][].
  * `breakOnSigint`: si es `true`, la ejecución terminará cuando se reciba `SIGINT` (Ctrl + C). Los manejadores existentes para el evento que se han adjuntado mediante `process.on('SIGINT')` se deshabilitarán durante la ejecución del script, pero continuarán funcionando después de eso. Si se termina la ejecución, se arrojará un [`Error`][].


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

*Nota*: El uso de las opciones `timeout` o `breakOnSigint` dará lugar a nuevos bucles de eventos y se iniciarán las hebras correspondientes, que tienen una sobrecarga de rendimiento distinta de cero.

### script.runInNewContext([sandbox[, opciones]])
<!-- YAML
added: v0.3.1
-->

* `sandbox` {Object} Un objeto que se [contextualizará](#vm_what_does_it_mean_to_contextify_an_object). Si es `undefined`, un nuevo objeto se creará.
* `opciones` {Object}
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el número de línea del desplazamiento que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el número de la columna del desplazamiento que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si ocurre un error [`Error`][] mientras se compila el `code`, la línea del código que causa el error se adjunta al stack trace.
  * `timeout` {number} Especifica la cantidad de milisegundos para ejecutar el `code` antes de terminar la ejecución. Si la ejecución se termina, se producirá un [`Error`][].

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
  * `timeout` {number} Especifica la cantidad de milisegundos para ejecutar el `code` antes de terminar la ejecución. Si la ejecución se termina, se producirá un [`Error`][].

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

## vm.createContext([sandbox])
<!-- YAML
added: v0.3.1
-->

* `sandbox` {Object}

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

## vm.isContext(sandbox)
<!-- YAML
added: v0.11.7
-->

* `sandbox` {Object}

Devuelve `true` si el objeto `sandbox` dado ha sido [contextualizado](#vm_what_does_it_mean_to_contextify_an_object) utilizando [`vm.createContext()`][].

## vm.runInContext(código, contextifiedSandbox[, opciones])

* `code` {string} El código JavaScript para compilar y ejecutar.
* `contextifiedSandbox` {Object} El objeto [contextualizado](#vm_what_does_it_mean_to_contextify_an_object) que se utilizará como el `global` cuando el `code` se compila y ejecuta.
* `options`
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el número de línea del desplazamiento que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el número de la columna del desplazamiento que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si ocurre un error [`Error`][] mientras se compila el `code`, la línea del código que causa el error se adjunta al stack trace.
  * `timeout` {number} Especifica la cantidad de milisegundos para ejecutar el `code` antes de terminar la ejecución. Si la ejecución se termina, se producirá un [`Error`][].

El método `vm.runInContext()` compila el `code`, lo ejecuta dentro del contexto del `contextifiedSandbox` y luego devuelve el resultado. El código en ejecución no tiene acceso al ámbito local. El objeto `contextifiedSandbox` *debe* ser [contextualizado](#vm_what_does_it_mean_to_contextify_an_object) previamente utilizando el método [`vm.createContext()`][].

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
* `sandbox` {Object} Un objeto que se [contextualizará](#vm_what_does_it_mean_to_contextify_an_object). Si es `undefined`, un nuevo objeto se creará.
* `options`
  * `filename` {string} Especifica el nombre de archivo utilizado en los stack traces producidos por este script.
  * `lineOffset` {number} Especifica el número de línea del desplazamiento que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el número de la columna del desplazamiento que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si ocurre un error [`Error`][] mientras se compila el `code`, la línea del código que causa el error se adjunta al stack trace.
  * `timeout` {number} Especifica la cantidad de milisegundos para ejecutar el `code` antes de terminar la ejecución. Si la ejecución se termina, se producirá un [`Error`][].

El `vm.runInNewContext()` primero contextualiza el objeto `sandbox` dado (o crea un nuevo `sandbox` si se pasa como `undefined`), compila el `code`, lo ejecuta dentro del contexto del contexto creado y luego devuelve el resultado. El código en ejecución no tiene acceso al ámbito global.

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
  * `lineOffset` {number} Especifica el número de línea del desplazamiento que se muestra en los stack traces producidos por este script.
  * `columnOffset` {number} Especifica el número de la columna del desplazamiento que se muestra en los stack traces producidos por este script.
  * `displayErrors` {boolean} Cuando es `true`, si ocurre un error [`Error`][] mientras se compila el `code`, la línea del código que causa el error se adjunta al stack trace.
  * `timeout` {number} Especifica la cantidad de milisegundos para ejecutar el `code` antes de terminar la ejecución. Si la ejecución se termina, se producirá un [`Error`][].

`vm.runInThisContext()` compila el `code`, lo ejecuta dentro del contexto del `global` actual y devuelve el resultado. El código en ejecución no tiene acceso al ámbito local, pero tiene acceso al objeto `global` actual.

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

Cuando se usa [`script.runInThisContext()`][] o [`vm.runInThisContext()`][], el código se ejecuta dentro del contexto global actual de V8. El código pasado a este contexto de VM tendrá su propio ámbito aislado.

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

*Nota*: el `require()` en el caso anterior comparte el estado con el contexto desde el cual se pasa. Esto puede introducir riesgos cuando se ejecuta un código no confiable, por ejemplo alterar objetos en el contexto de maneras no deseadas.

## ¿Qué significa "contextificar" un objeto?

Todo JavaScript ejecutado en Node.js se ejecuta dentro del ámbito de un "contexto". De acuerdo a la [Guía de Incrustadores V8](https://github.com/v8/v8/wiki/Embedder's%20Guide#contexts):

> En V8, un contexto es un entorno de ejecución que permite que aplicaciones de JavaScript independientes y no relacionadas se ejecuten en una sola instancia de V8. Se debe especificar explícitamente el contexto en el que desea que se ejecute cualquier código JavaScript.

Cuando el `vm.createContext()` se llama, el objeto `sandbox` que se pasa (o un objeto creado recientemente si `sandbox` está `undefined`) se asocia internamente con una nueva instancia de un Contexto V8. Este Contexto V8 proporciona el `code` que se ejecuta utilizando los métodos del módulo `vm` con un ambiente global aislado dentro del cual puede operar. El proceso de creación del Contexto V8 y asociarlo con el objeto `sandbox` es lo que este documento denomina como "contextualizar" el `sandbox`.
