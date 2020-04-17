# Cómo escribir una prueba para el proyecto de Node.js

## ¿Qué es una prueba?

La mayoría de las pruebas en el núcleo de Node.js son programas de JavaScript que ejercen una funcionalidad proporcionada por Node.js y verifican que se comporte como se espera. Las pruebas deben salir con el código `0` cuando tengan éxito. Una prueba fallará si:

* Se sale al configurar `process.exitCode` a un número distinto de cero.
  * Esto es realizado usualmente haciendo que una aserción arroje un Error no capturado.
  * Ocasionalmente, puede ser apropiado utilizar `process.exit(code)`.
* Nunca se sale. En este caso, el corredor de prueba terminará la prueba porque establece un límite de tiempo máximo.

Añadir pruebas cuando:

* Se añada una nueva funcionalidad.
* Se reparen regresiones y errores.
* Se expanda la cobertura de prueba.

## Estructura del directorio de la prueba

Vea [descripción general de la estructura del directorio](https://github.com/nodejs/node/blob/master/test/README.md#test-directories) para obtener un resumen de la prueba & ubicaciones. When deciding on whether to expand an existing test file or create a new one, consider going through the files related to the subsystem. Por ejemplo, busque los `test-streams` al escribir una prueba para `lib/streams.js`.

## Estructura de la prueba

Analicemos esta prueba básica de la suite de pruebas de Node.js:

```javascript
'use strict';                                                          // 1
const common = require('../common');                                   // 2
const fixtures = require('../common/fixtures');                        // 3

// Esta prueba asegura que el http-parser pueda soportar caracteres UTF-8
// 5
// en el encabezado http.                                                 // 6

const assert = require('assert');                                      // 8
const http = require('http');                                          // 9

const server = http.createServer(common.mustCall((req, res) => {       // 11
  res.end('ok');                                                       // 12
}));                                                                   // 13
server.listen(0, () => {                                               // 14
  http.get({                                                           // 15
    port: server.address().port,                                       // 16
    headers: { 'Test': 'Düsseldorf' }                                  // 17
  }, common.mustCall((res) => {                                        // 18
    assert.strictEqual(res.statusCode, 200);                           // 19
    server.close();                                                    // 20
  }));                                                                 // 21
});                                                                    // 22
// ...                                                                 // 23
```

### **Líneas 1-3**

```javascript
'use strict';
const common = require('../common');
const fixtures = require('../common/fixtures');
```

La primera línea habilita el modo estricto. Todas las pruebas deben estar en modo estricto, a menos que la naturaleza de la prueba requiera que la prueba se ejecute sin él.

La segunda línea carga el módulo `common`. The [`common` module][] is a helper module that provides useful tools for the tests. Some common functionality has been extracted into submodules, which are required separately like the fixtures module here.

Incluso si una prueba no usa funciones u otras propiedades exportadas por `common`, aún así debe incluir el módulo `common` antes que cualquier otro módulo. Esto es debido a que el módulo `common` incluye código que causará que la prueba falle si la misma filtra variables en el espacio global. En situaciones en las que una prueba no use funciones u otras propiedades exportadas por `common`, inclúyalo sin asignarlo a un identificador:

```javascript
require('../common');
```

### **Líneas 5-6**

```javascript
// Esta prueba se asegura de que el http-parser pueda manejar caracteres de UTF-8
// en la cabecera de http.
```

Una prueba debe comenzar con un comentario que contenga una breve descripción de lo que está diseñada para probar.

### **Líneas 8-9**

```javascript
const assert = require('assert');
const http = require('http');
```

La prueba verifica la funcionalidad en el módulo `http`.

La mayoría de las pruebas utilizan el módulo `assert` para confirmar las expectativas de la prueba.

The require statements are sorted in [ASCII](http://man7.org/linux/man-pages/man7/ascii.7.html) order (digits, upper case, `_`, lower case).

### **Líneas 11-22**

Este es el cuerpo de la prueba. Esta prueba es simple, solo prueba que un servidor HTTP acepte caracteres `non-ASCII` en las cabeceras de una solicitud entrante. Cosas interesantes a tomar en cuenta:

* Si la prueba no depende de un número de puerto específico, entonces siempre utilice 0 en lugar de un valor arbitrario, ya que permite que las pruebas se ejecuten en paralelo de forma segura, ya que el sistema operativo asignará un puerto aleatorio. Si la prueba requiere un puerto específico, por ejemplo, si la prueba verifica que asignar un puerto específico funciona como se espera, entonces está bien asignar un número de puerto específico.
* El uso de `common.mustCall` para verificar que algunas callbacks o algunos listeners son llamados.
* El servidor HTTP se cierra una vez se hayan ejecutado todas las verificaciones. De esta forma, la prueba puede salir con gracia. Recuerde que para que una prueba tenga éxito, debe salir con un código de estado de 0.

## Recomendaciones generales

### Temporizadores

Evite los temporizadores a menos que la prueba esté específicamente probando los temporizadores. Existen varias razones para esto. Principalmente, son una fuente de problemas. Para una explicación completa, vaya [aquí](https://github.com/nodejs/testing/issues/27).

En el evento en el que una prueba necesite un temporizador, considere utilizar el método `common.platformTimeout()`. It allows setting specific timeouts depending on the platform:

```javascript
const timer = setTimeout(fail, common.platformTimeout(4000));
```

creará un tiempo de espera de 4 segundos en la mayoría de las plataformas, pero un tiempo de espera más largo en plataformas más lentas.

### The *common* API

Utilice los ayudantes del módulo `common` tanto como sea posible. Please refer to the [common file documentation](https://github.com/nodejs/node/tree/master/test/common) for the full details of the helpers.

#### common.mustCall

Un caso interesante es `common.mustCall`. The use of `common.mustCall` may avoid the use of extra variables and the corresponding assertions. Let's explain this with a real test from the test suite.

```javascript
'use strict';
require('../common');
const assert = require('assert');
const http = require('http');

let request = 0;
let listening = 0;
let response = 0;
process.on('exit', () => {
  assert.equal(request, 1, 'http server "request" callback was not called');
  assert.equal(listening, 1, 'http server "listening" callback was not called');
  assert.equal(response, 1, 'http request "response" callback was not called');
});

const server = http.createServer((req, res) => {
  request++;
  res.end();
}).listen(0, () => {
  listening++;
  const options = {
    agent: null,
    port: server.address().port
  };
  http.get(options, (res) => {
    response++;
    res.resume();
    server.close();
  });
});
```

Esta prueba se puede simplificar enormemente utilizando `common.mustCall` de esta forma:

```javascript
'use strict';
const common = require('../common');
const http = require('http');

const server = http.createServer(common.mustCall((req, res) => {
  res.end();
})).listen(0, common.mustCall(() => {
  const options = {
    agent: null,
    port: server.address().port
  };
  http.get(options, common.mustCall((res) => {
    res.resume();
    server.close();
  }));
}));

```

#### Módulo Countdown

The common [Countdown module](https://github.com/nodejs/node/tree/master/test/common#countdown-module) provides a simple countdown mechanism for tests that require a particular action to be taken after a given number of completed tasks (for instance, shutting down an HTTP server after a specific number of requests).

```javascript
const Countdown = require('../common/countdown');

const countdown = new Countdown(2, () => {
  console.log('.');
});

countdown.dec();
countdown.dec(); // The countdown callback will be invoked now.
```

#### Testing promises

When writing tests involving promises, it is generally good to wrap the `onFulfilled` handler, otherwise the test could successfully finish if the promise never resolves (pending promises do not keep the event loop alive). The `common` module automatically adds a handler that makes the process crash - and hence, the test fail - in the case of an `unhandledRejection` event. It is possible to disable it with `common.disableCrashOnUnhandledRejection()` if needed.

```javascript
const common = require('../common');
const assert = require('assert');
const fs = require('fs').promises;

// Wrap the `onFulfilled` handler in `common.mustCall()`.
fs.readFile('test-file').then(
  common.mustCall(
    (content) => assert.strictEqual(content.toString(), 'test2')
  ));
```

### Banderas

Algunas pruebas requerirán ejecutar Node.js con banderas de línea de comando específicas establecidas. Para lograr esto, añada un comentario `// Flags:` en el preámbulo de la prueba, seguido por las banderas. Por ejemplo, para permitir que una prueba requiera algunos de los módulos `internal/*`, añada la bandera `--expose-internals`. Una prueba que requeriría `internal/freelist` podría empezar de esta forma:

```javascript
'use strict';

// Banderas: --expose-internals

require('../common');
const assert = require('assert');
const freelist = require('internal/freelist');
```

### Aserciones

Al escribir aserciones, prefiera las versiones estrictas:

* `assert.strictEqual()` sobre `assert.equal()`
* `assert.deepStrictEqual()` sobre `assert.deepEqual()`

Al utilizar `assert.throws()`, si es posible, proporcione el mensaje de error completo:

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  /^Error: Wrong value$/ // En lugar de algo como /Wrong value/
);
```

### Console output

Output written by tests to stdout or stderr, such as with `console.log()` or `console.error()`, can be useful when writing tests, as well as for debugging them during later maintenance. The output will be suppressed by the test runner (`./tools/test.py`) unless the test fails, but will always be displayed when running tests directly with `node`. For failing tests, the test runner will include the output along with the failed test assertion in the test report.

Some output can help debugging by giving context to test failures. For example, when troubleshooting tests that timeout in CI. With no log statements, we have no idea where the test got hung up.

There have been cases where tests fail without `console.log()`, and then pass when its added, so be cautious about its use, particularly in tests of the I/O and streaming APIs.

Excessive use of console output is discouraged as it can overwhelm the display, including the Jenkins console and test report displays. Be particularly cautious of output in loops, or other contexts where output may be repeated many times in the case of failure.

In some tests, it can be unclear whether a `console.log()` statement is required as part of the test (message tests, tests that check output from child processes, etc.), or is there as a debug aide. If there is any chance of confusion, use comments to make the purpose clear.

### ES.Next features

Por consideraciones de rendimiento, solo utilizamos un subconjunto seleccionado de características ES.Next en código de JavaScript en el directorio de `lib`. However, when writing tests, for the ease of backporting, it is encouraged to use those ES.Next features that can be used directly without a flag in [all maintained branches](https://github.com/nodejs/lts). [node.green](https://node.green/) lists available features in each release, such as:

* `let` y `const` sobre `var`
* Literales de plantilla sobre la concatenación de strings
* Funciones de flecha cuando sea apropiado

## Nombrar Archivos de Prueba

Los archivos de prueba son nombrados usando kebab casing. El primer componente del nombre es `test`. El segundo es el módulo o subsistema siendo probado. El tercero es usualmente el método o el nombre del evento siendo probado. Los componentes posteriores del nombre añaden más información acerca de lo que está siendo probado.

Por ejemplo, una prueba para el evento `beforeExit` en el objeto `process` puede ser nombrada `test-process-before-exit.js`. Si la prueba específicamente verificó que las funciones flecha funcionaron correctamente con el evento `beforeExit`, entonces puede ser nombrada `test-process-before-exit-arrow-functions.js`.

## Pruebas Importadas

### Pruebas de Plataforma Web

See [`test/wpt`](../../test/wpt/README.md) for more information.

## Prueba de la Unidad C++

El código C++ puede ser probado usando [Google Test](https://github.com/google/googletest). Most features in Node.js can be tested using the methods described previously in this document. But there are cases where these might not be enough, for example writing code for Node.js that will only be called when Node.js is embedded.

### Añadiendo una nueva prueba

The unit test should be placed in `test/cctest` and be named with the prefix `test` followed by the name of unit being tested. For example, the code below would be placed in `test/cctest/test_env.cc`:

```c++
#include "gtest/gtest.h"
#include "node_test_fixture.h"
#include "env.h"
#include "node.h"
#include "v8.h"

static bool called_cb = false;
static void at_exit_callback(void* arg);

class EnvTest : public NodeTestFixture { };

TEST_F(EnvTest, RunAtExit) {
  v8::HandleScope handle_scope(isolate_);
  v8::Local<v8::Context> context = v8::Context::New(isolate_);
  node::IsolateData* isolateData = node::CreateIsolateData(isolate_, uv_default_loop());
  Argv argv{"node", "-e", ";"};
  auto env = node::CreateEnvironment(isolateData, context, 1, *argv, 2, *argv);
  node::AtExit(env, at_exit_callback);
  node::RunAtExit(env);
  EXPECT_TRUE(called_cb);
}

static void at_exit_callback(void* arg) {
  called_cb = true;
}
```

Luego añada la prueba al `sources` en el objetivo `cctest` en node.gyp:

```console
'sources': [
  'test/cctest/test_env.cc',
  ...
],
```

The only sources that should be included in the cctest target are actual test or helper source files. There might be a need to include specific object files that are compiled by the `node` target and this can be done by adding them to the `libraries` section in the cctest target.

La prueba puede ser realizada al ejecutar el objetivo `cctest`:

```console
$ make cctest
```

A filter can be applied to run single/multiple test cases:

```console
$ make cctest GTEST_FILTER=EnvironmentTest.AtExitWithArgument
```

`cctest` can also be run directly which can be useful when debugging:

```console
$ out/Release/cctest --gtest_filter=EnvironmentTest.AtExit*
```

### Accesorio de prueba Node.js
There is a [test fixture](https://github.com/google/googletest/blob/master/googletest/docs/Primer.md#test-fixtures-using-the-same-data-configuration-for-multiple-tests) named `node_test_fixture.h` which can be included by unit tests. The fixture takes care of setting up the Node.js environment and tearing it down after the tests have finished.

También contiene un ayudante para crear argumentos a ser pasados a Node.js. It will depend on what is being tested if this is required or not.

### Cobertura de Prueba

To generate a test coverage report, see the [Test Coverage section of the Building guide](https://github.com/nodejs/node/blob/master/BUILDING.md#running-coverage).

Nightly coverage reports for the Node.js master branch are available at https://coverage.nodejs.org/.
