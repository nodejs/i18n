# Cómo escribir una prueba para el proyecto de Node.js

## ¿Qué es una prueba?

La mayoría de las pruebas en el núcleo de Node.js son programas de JavaScript que ejercen una funcionalidad proporcionada por Node.js y verifican que se comporte como se espera. Las pruebas deben salir con el código `0` cuando tengan éxito. Una prueba fallará si:

- Se sale al configurar `process.exitCode` a un número distinto de cero.
  - Esto es realizado usualmente haciendo que una aserción arroje un Error no capturado.
  - Ocasionalmente, puede ser apropiado utilizar `process.exit(code)`.
- Nunca se sale. En este caso, el corredor de prueba terminará la prueba porque establece un límite de tiempo máximo.

Añadir pruebas cuando:

- Se añada una nueva funcionalidad.
- Se reparen regresiones y errores.
- Se expanda la cobertura de prueba.

## Estructura del directorio de la prueba

Vea [descripción general de la estructura del directorio](https://github.com/nodejs/node/blob/master/test/README.md#test-directories) para obtener un resumen de la prueba & ubicaciones. Al decidir si expandir un archivo de prueba existente o crear uno nuevo, considere revisar los archivos relacionados con el subsistema. Por ejemplo, busque los `test-streams` al escribir una prueba para `lib/streams.js`.

## Estructura de la prueba

Analicemos esta prueba básica de la suite de prueba de Node.js:

```javascript
'use strict';                                                          // 1
const common = require('../common');                                   // 2
const fixtures = require('../common/fixtures');                        // 3

// Esta prueba se asegura de que el http-parser pueda manejar caracteres de UTF-8  // 5
// en la cabecera de http.                                                 // 6

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

La primera línea habilita el modo estricto. Todas las pruebas deben ser realizadas en modo estricto a menos que la naturaleza de la prueba requiera que la prueba sea ejecutada sin el.

La segunda línea carga el módulo `common`. El [`common` module][] es un módulo ayudante que proporciona herramientas útiles para las pruebas. Algunas funcionalidades comunes han sido extraídas en submódulos, los cuales son requeridos por separado como los accesorios del módulo de aquí.

Incluso si una prueba no usa funciones u otras propiedades exportadas por `common`, la prueba aún así debe incluir el módulo `common` antes que cualquier otro módulo. Esto es debido a que el módulo `common` incluye código que causará que la prueba falle si la misma filtra variables en el espacio global. En situaciones donde una prueba no usa funciones u otras propiedades exportadas por `common`, inclúyalo sin asignarlo a un identificador:

```javascript
require('../common');
```

### **Líneas 5-6**

```javascript
// Esta prueba se asegura de que el http-parser pueda manejar caracteres de UTF-8
// en la cabecera de http.
```

Una prueba debe iniciar con un comentario que contenga una breve descripción de lo que está diseñada a probar.

### **Líneas 8-9**

```javascript
const assert = require('assert');
const http = require('http');
```

La prueba comprueba la funcionalidad en el módulo `http`.

La mayoría de las pruebas usan el módulo `assert` para confirmar las expectativas de la prueba.

Las instrucciones require se ordenan en orden [ASCII](http://man7.org/linux/man-pages/man7/ascii.7.html) (dígitos, mayúsculas, `_`, minúsculas).

### **Líneas 11-22**

Este es el cuerpo de la prueba. Esta prueba es simple, solo prueba que un servidor HTTP acepte caracteres `non-ASCII` en las cabeceras de una solicitud entrante. Cosas interesantes que tomar en cuenta:

- Si la prueba no depende de un número de puerto específico, entonces siempre utilice 0 en lugar de un valor arbitrario, ya que permite que las pruebas se ejecuten en paralelo de forma segura, ya que el sistema operativo asignará un puerto aleatorio. Si la prueba requiere un puerto específico, por ejemplo, si la prueba verifica que asignar un puerto específico funciona como se espera, entonces está bien asignar un número de puerto específico.
- El uso de `common.mustCall` para verificar que algunas callbacks o algunos listeners son llamados.
- El servidor HTTP se cierra una vez se hayan ejecutado todas las verificaciones. De esta forma, la prueba puede salir con gracia. Recuerde que para que una prueba tenga éxito, debe salir con un código de estado de 0.

## Recomendaciones generales

### Temporizadores

Evite usar temporizadores a menos que la prueba esté probando específicamente los temporizadores. Existen varias razones para esto. Mayormente, son una fuente de problemas. Para una explicación completa vaya [aquí](https://github.com/nodejs/testing/issues/27).

En el evento la prueba necesita un temporizador, considere usar el método `common.platformTimeout()`. Permite configurar tiempos de espera específicos dependiendo de la plataforma:

```javascript
const timer = setTimeout(fail, common.platformTimeout(4000));
```

creará un tiempo de espera de 4 segundos en la mayoría de las plataformas, pero un tiempo de espera más largo en plataformas más lentas.

### La API *common*

Utilice los helpers del módulo `common` tanto como sea posible. Por favor consulte la [documentación del archivo common](https://github.com/nodejs/node/tree/master/test/common) para los detalles completos acerca de los helpers.

#### common.mustCall

Un caso interesante es `common.mustCall`. El uso de `common.mustCall` puede evitar el uso de variables extras y las aserciones correspondientes. Expliquemos esto con una prueba real de la suite de pruebas.

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

const server = http.createServer((req, res) => {
  request++;
  res.end();
}).listen(0, function() {
  const options = {
    agent: null,
    port: this.address().port
  };
  http.get(options, (res) => {
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

const server = http.createServer(common.mustCall((req, res) => {
  res.end();
})).listen(0, function() {
  const options = {
    agent: null,
    port: this.address().port
  };
  http.get(options, common.mustCall((res) => {
    res.resume();
    server.close();
  }));
});

```
#### Módulo Countdown

El [módulo Countdown](https://github.com/nodejs/node/tree/master/test/common#countdown-module) common proporciona un mecanismo de cuenta regresiva simple para pruebas que requieren que se realice una acción particular después de un número determinado de tareas completadas (por ejemplo, apagar un servidor HTTP después de un número específico de solicitudes).

```javascript
const Countdown = require('../common/countdown');

const countdown = new Countdown(2, function() {
  console.log('.');
});

countdown.dec();
countdown.dec(); // La callback countdown será invocada ahora.
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

- `assert.strictEqual()` sobre `assert.equal()`
- `assert.deepStrictEqual()` sobre `assert.deepEqual()`

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

Por razones de rendimiento, solo usamos un subconjunto seleccionado de características ES.Next en código JavaScript en el directorio `lib`. Sin embargo, al escribir pruebas, para la facilidad del backporting, se recomienda usar aquellas características ES.Next que pueden ser usadas directamente sin una bandera en [todas las ramas mantenidas](https://github.com/nodejs/lts). [node.green](http://node.green/) enumera las características disponibles en cada versión, tales como:

- `let` y `const` sobre `var`
- Literales de plantilla sobre la concatenación de strings
- Funciones de flecha cuando sea apropiado

## Nombrar Archivos de Prueba

Los archivos de prueba son nombrados usando kebab casing. El primer componente del nombre es `test`. El segundo es el módulo o subsistema siendo probado. El tercero es usualmente el método o el nombre del evento siendo probado. Los componentes posteriores del nombre añaden más información acerca de lo que está siendo probado.

Por ejemplo, una prueba para el evento `beforeExit` en el objeto `process` puede ser nombrada `test-process-before-exit.js`. Si la prueba específicamente verificó que las funciones flecha funcionaron correctamente con el evento `beforeExit`, entonces puede ser nombrada `test-process-before-exit-arrow-functions.js`.

## Pruebas Importadas

### Pruebas de Plataforma Web

Algunas de las pruebas para la implementación (nombrada `test-whatwg-url-*.js`) son importadas del [Proyecto de Pruebas de Plataforma Web](https://github.com/w3c/web-platform-tests/tree/master/url). Estas pruebas importadas serán envueltas de esta forma:

```js
/* Las siguientes pruebas son copiadas del WPT. Las modificaciones a ellas deben ser primero upstreamed. Refs:
   https://github.com/w3c/web-platform-tests/blob/8791bed/url/urlsearchparams-stringifier.html
   License: http://www.w3.org/Consortium/Legal/2008/04-testsuite-copyright.html
*/
/* eslint-disable */

// Código de la prueba

/* eslint-enable */
```

Para mejorar las pruebas que han sido importadas de esta manera, por favor envíe una PR al proyecto upstream primero. Cuando el cambio propuesto se fusione con el proyecto upstream, envíe otro PR aquí para actualizar Node.js en consecuencia. Asegúrese de actualizar el hash en el URL siguiendo las `WPT Refs:`.

## Prueba de la Unidad C++

El código C++ puede ser probado utilizando [Google Test](https://github.com/google/googletest). La mayoría de las funcionalidades en Node.js pueden ser probadas utilizando los métodos descritos previamente en este documento. Pero hay casos en donde estos pueden no ser suficientes, por ejemplo, al escribir código para Node.js que sólo será llamado cuando Node.js esté incrustado.

### Añadiendo una nueva prueba

La prueba de unidad debe ser colocada en `test/cctest` y nombrada con el prefijo `test`, seguido por el nombre de la unidad que está siendo probada. Por ejemplo, el siguiente código será colocado en `test/cctest/test_env.cc`:

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

Luego añada la prueba a las `sources` en el objetivo de `cctest` en node.gyp:

```console
'sources': [
  'test/cctest/test_env.cc',
  ...
],
```

Note que las únicos recursos que deben ser incluidos en el objetivo de cctest son pruebas reales o archivos de fuente auxiliares. Puede que sea necesario incluir archivos de objeto específicos que sean compilados por el objetivo de `node` y esto puede ser hecho al añadirlos a la sección `libraries` en el objetivo de cctest.

La prueba puede ejecutarse al correr el objetivo de `cctest`:

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
Hay un [accesorio de pruebas](https://github.com/google/googletest/blob/master/googletest/docs/Primer.md#test-fixtures-using-the-same-data-configuration-for-multiple-tests) llamado `node_test_fixture.h`, el cual puede ser incluido por las pruebas de unidad. El accesorio se encarga de configurar el ambiente de Node.js y de desmontarlo después de que las pruebas hayan finalizado.

También contiene un ayudante para crear argumentos a ser pasados a Node.js. Dependerá de lo que se esté probando si esto es necesario o no.

### Cobertura de Prueba

To generate a test coverage report, see the [Test Coverage section of the Building guide](https://github.com/nodejs/node/blob/master/BUILDING.md#running-coverage).
