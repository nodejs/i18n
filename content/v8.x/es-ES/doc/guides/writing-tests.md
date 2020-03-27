# Cómo escribir una prueba para el proyecto Node.js

## ¿Qué es una prueba?

Most tests in Node.js core are JavaScript programs that exercise a functionality provided by Node.js and check that it behaves as expected. Tests should exit with code `0` on success. Una prueba fallará si:

- Se sale al configurar `process.exitCode` a un número distinto de cero. 
  - Esto es realizado usualmente haciendo que una aserción arroje un Error no capturado.
  - Ocasionalmente, puede ser apropiado utilizar `process.exit(code)`.
- Nunca se sale. In this case, the test runner will terminate the test because it sets a maximum time limit.

Añadir pruebas cuando:

- Se añada una nueva funcionalidad.
- Se reparen regresiones y errores.
- Se expanda la cobertura de prueba.

## Estructura del directorio de la prueba

Vea [descripción general de la estructura del directorio](https://github.com/nodejs/node/blob/master/test/README.md#test-directories) para obtener un resumen de la prueba & ubicaciones. When deciding on whether to expand an existing test file or create a new one, consider going through the files related to the subsystem. Por ejemplo, busque los `test-streams` al escribir una prueba para `lib/streams.js`.

## Estructura de la prueba

Analicemos esta prueba básica de la suite de prueba de Node.js:

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

La primera línea habilita el modo estricto. All tests should be in strict mode unless the nature of the test requires that the test run without it.

La segunda línea carga el módulo `common`. The [`common` module][] is a helper module that provides useful tools for the tests. Some common functionality has been extracted into submodules, which are required separately like the fixtures module here.

Even if a test uses no functions or other properties exported by `common`, the test should still include the `common` module before any other modules. This is because the `common` module includes code that will cause a test to fail if the test leaks variables into the global space. In situations where a test uses no functions or other properties exported by `common`, include it without assigning it to an identifier:

```javascript
require('../common');
```

### **Líneas 5-6**

```javascript
// Esta prueba asegura que el http-parser pueda soportar caracteres UTF-8
// en el encabezado http.
```

A test should start with a comment containing a brief description of what it is designed to test.

### **Líneas 8-9**

```javascript
const assert = require('assert');
const http = require('http');
```

La prueba comprueba la funcionalidad en el módulo `http`.

La mayoría de las pruebas usan el módulo `assert` para confirmar las expectativas de la prueba.

The require statements are sorted in [ASCII](http://man7.org/linux/man-pages/man7/ascii.7.html) order (digits, upper case, `_`, lower case).

### **Líneas 11-22**

Este es el cuerpo de la prueba. This test is simple, it just tests that an HTTP server accepts `non-ASCII` characters in the headers of an incoming request. Cosas interesantes que tomar en cuenta:

- If the test doesn't depend on a specific port number, then always use 0 instead of an arbitrary value, as it allows tests to run in parallel safely, as the operating system will assign a random port. If the test requires a specific port, for example if the test checks that assigning a specific port works as expected, then it is ok to assign a specific port number.
- The use of `common.mustCall` to check that some callbacks/listeners are called.
- El servidor HTTP se cierra una vez se hayan ejecutado todas las verificaciones. This way, the test can exit gracefully. Remember that for a test to succeed, it must exit with a status code of 0.

## Recomendaciones generales

### Temporizadores

Evite usar temporizadores a menos que la prueba esté probando específicamente los temporizadores. There are multiple reasons for this. Mayormente, son una fuente de problemas. For a thorough explanation go [here](https://github.com/nodejs/testing/issues/27).

In the event a test needs a timer, consider using the `common.platformTimeout()` method. It allows setting specific timeouts depending on the platform. Por ejemplo:

```javascript
const timer = setTimeout(fail, common.platformTimeout(4000));
```

will create a 4-second timeout on most platforms but a longer timeout on slower platforms.

### La API *common*

Utilice los helpers del módulo `common` tanto como sea posible. Please refer to the [common file documentation](https://github.com/nodejs/node/tree/master/test/common) for the full details of the helpers.

#### common.mustCall

Un caso interesante es `common.mustCall`. The use of `common.mustCall` may avoid the use of extra variables and the corresponding assertions. Let's explain this with a real test from the test suite.

```javascript
'use strict';
require('../common');
const assert = require('assert');
const http = require('http');

let request = 0;
let response = 0;
process.on('exit', function() {
  assert.equal(request, 1, 'http server "request" callback was not called');
  assert.equal(response, 1, 'http request "response" callback was not called');
});

const server = http.createServer(function(req, res) {
  request++;
  res.end();
}).listen(0, function() {
  const options = {
    agent: null,
    port: this.address().port
  };
  http.get(options, function(res) {
    response++;
    res.resume();
    server.close();
  });
});
```

Esta prueba se puede simplificar enormemente al usar `common.mustCall` de esta forma:

```javascript
'use strict';
const common = require('../common');
const http = require('http');

const server = http.createServer(common.mustCall(function(req, res) {
  res.end();
})).listen(0, function() {
  const options = {
    agent: null,
    port: this.address().port
  };
  http.get(options, common.mustCall(function(res) {
    res.resume();
    server.close();
  }));
});

```

#### Módulo Countdown

The common [Countdown module](https://github.com/nodejs/node/tree/master/test/common#countdown-module) provides a simple countdown mechanism for tests that require a particular action to be taken after a given number of completed tasks (for instance, shutting down an HTTP server after a specific number of requests).

```javascript
const Countdown = require('../common/countdown');

const countdown = new Countdown(2, function() {
  console.log('.');
});

countdown.dec();
countdown.dec(); // El callback countdown será invocado ahora.
```

### Banderas

Algunas pruebas requerirán ejecutar Node.js con banderas de línea de comando específicas establecidas. To accomplish this, add a `// Flags:` comment in the preamble of the test followed by the flags. For example, to allow a test to require some of the `internal/*` modules, add the `--expose-internals` flag. Una prueba que requeriría `internal/freelist` podría comenzar de esta forma:

```javascript
'use strict';

// Flags: --expose-internals

require('../common');
const assert = require('assert');
const freelist = require('internal/freelist');
```

### Aserciones

Al escribir aserciones, prefiera las versiones estrictas:

- `assert.strictEqual()` sobre `assert.equal()`
- `assert.deepStrictEqual()` sobre `assert.deepEqual()`

Al usar `assert.throws()`, si es posible, proporcione el mensaje de error completo:

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  /^Error: Wrong value$/ // En lugar de algo como /Valor incorrecto/
);
```

### Funcionalidades ES.Next

For performance considerations, we only use a selected subset of ES.Next features in JavaScript code in the `lib` directory. However, when writing tests, for the ease of backporting, it is encouraged to use those ES.Next features that can be used directly without a flag in [all maintained branches](https://github.com/nodejs/lts). [node.green](http://node.green/) lists available features in each release.

For example:

- `let` y `const` sobre `var`
- Literales de plantilla sobre la concatenación de strings
- Funciones de flecha cuando sea apropiado

## Nombrar Archivos de Prueba

Los archivos de prueba son nombrados usando kebab casing. The first component of the name is `test`. El segundo es el módulo o subsistema siendo probado. The third is usually the method or event name being tested. Subsequent components of the name add more information about what is being tested.

For example, a test for the `beforeExit` event on the `process` object might be named `test-process-before-exit.js`. If the test specifically checked that arrow functions worked correctly with the `beforeExit` event, then it might be named `test-process-before-exit-arrow-functions.js`.

## Pruebas Importadas

### Pruebas de Plataforma Web

Some of the tests for the WHATWG URL implementation (named `test-whatwg-url-*.js`) are imported from the [Web Platform Tests Project](https://github.com/w3c/web-platform-tests/tree/master/url). Estas pruebas importadas serán envueltas de esta forma:

```js
/* Las siguientes pruebas son copiadas del WPT. Las modificaciones a ellas deben ser primero upstreamed. Refs:
   https://github.com/w3c/web-platform-tests/blob/8791bed/url/urlsearchparams-stringifier.html
   License: http://www.w3.org/Consortium/Legal/2008/04-testsuite-copyright.html
*/
/* eslint-disable */

// Código de la prueba

/* eslint-enable */
```

To improve tests that have been imported this way, please send a PR to the upstream project first. When the proposed change is merged in the upstream project, send another PR here to update Node.js accordingly. Asegúrese de actualizar el hash en el URL siguiendo las `WPT Refs:`.

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

Note that the only sources that should be included in the cctest target are actual test or helper source files. There might be a need to include specific object files that are compiled by the `node` target and this can be done by adding them to the `libraries` section in the cctest target.

La prueba puede ser realizada al ejecutar el objetivo `cctest`:

```console
$ make cctest
```

### Accesorio de prueba de Node

There is a [test fixture](https://github.com/google/googletest/blob/master/googletest/docs/Primer.md#test-fixtures-using-the-same-data-configuration-for-multiple-tests) named `node_test_fixture.h` which can be included by unit tests. The fixture takes care of setting up the Node.js environment and tearing it down after the tests have finished.

También contiene un ayudante para crear argumentos a ser pasados a Node.js. It will depend on what is being tested if this is required or not.