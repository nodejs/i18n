# Come scrivere un test per il progetto Node.js

## Cos'è un test?

Most tests in Node.js core are JavaScript programs that exercise a functionality provided by Node.js and check that it behaves as expected. Tests should exit with code `0` on success. Un test fallirà se:

- Esce impostando `process.exitCode` su un numero diverso da zero. 
  - Di solito ciò avviene facendo in modo che un assertion generi un uncaught Error.
  - Occasionalmente, l'utilizzo di `process.exit(code)` potrebbe essere appropriato.
- Non esce mai. In this case, the test runner will terminate the test because it sets a maximum time limit.

Aggiungi i test quando:

- Vengono aggiunte nuove funzionalità.
- Vengono corretti regressioni e bug.
- Viene ampliato il test coverage.

## Test directory structure

Vedi la [panoramica della directory structure](https://github.com/nodejs/node/blob/master/test/README.md#test-directories) per la descrizione dei test & delle posizioni esistenti. When deciding on whether to expand an existing test file or create a new one, consider going through the files related to the subsystem. Ad esempio, cerca `test-streams` durante la scrittura di un test per `lib/streams.js`.

## Test structure

Analizziamo questo test di base dall'insieme dei test di Node.js:

```javascript
'use strict';                                                          // 1
const common = require('../common');                                   // 2
const fixtures = require('../common/fixtures');                        // 3

// Questo test assicura che l'http-parser possa gestire i caratteri UTF-8 // 5 
// nell'http header.                                                 // 6

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

### **Righe 1-3**

```javascript
'use strict';
const common = require('../common');
const fixtures = require('../common/fixtures');
```

La prima riga attiva la strict mode. All tests should be in strict mode unless the nature of the test requires that the test run without it.

La seconda riga carica il modulo `common`. The [`common` module][] is a helper module that provides useful tools for the tests. Some common functionality has been extracted into submodules, which are required separately like the fixtures module here.

Even if a test uses no functions or other properties exported by `common`, the test should still include the `common` module before any other modules. This is because the `common` module includes code that will cause a test to fail if the test leaks variables into the global space. In situations where a test uses no functions or other properties exported by `common`, include it without assigning it to an identifier:

```javascript
require('../common');
```

### **Righe 5-6**

```javascript
// Questo test assicura che l'http-parser possa gestire i caratteri UTF-8
// nell'http header.
```

A test should start with a comment containing a brief description of what it is designed to test.

### **Righe 8-9**

```javascript
const assert = require('assert');
const http = require('http');
```

Il test controlla le funzionalità nel modulo `http`.

La maggior parte dei test utilizza il modulo `assert` per confermare le proprie aspettative.

The require statements are sorted in [ASCII](http://man7.org/linux/man-pages/man7/ascii.7.html) order (digits, upper case, `_`, lower case).

### **Righe 11-22**

Questo è il body (corpo) del test. This test is simple, it just tests that an HTTP server accepts `non-ASCII` characters in the headers of an incoming request. Cose interessanti da notare:

- If the test doesn't depend on a specific port number, then always use 0 instead of an arbitrary value, as it allows tests to run in parallel safely, as the operating system will assign a random port. If the test requires a specific port, for example if the test checks that assigning a specific port works as expected, then it is ok to assign a specific port number.
- The use of `common.mustCall` to check that some callbacks/listeners are called.
- Il server HTTP si chiude dopo l'esecuzione di tutti i controlli. This way, the test can exit gracefully. Remember that for a test to succeed, it must exit with a status code of 0.

## Raccomandazioni Generali

### Timers

Evitare i timer a meno che il test non li stia testando specificamente. There are multiple reasons for this. Principalmente, sono una fonte di problematiche. For a thorough explanation go [here](https://github.com/nodejs/testing/issues/27).

In the event a test needs a timer, consider using the `common.platformTimeout()` method. It allows setting specific timeouts depending on the platform:

```javascript
const timer = setTimeout(fail, common.platformTimeout(4000));
```

will create a 4-second timeout on most platforms but a longer timeout on slower platforms.

### La *common* API

Utilizza il più possibile gli helper del modulo `common`. Please refer to the [common file documentation](https://github.com/nodejs/node/tree/master/test/common) for the full details of the helpers.

#### common.mustCall

Un caso interessante è `common.mustCall`. The use of `common.mustCall` may avoid the use of extra variables and the corresponding assertions. Let's explain this with a real test from the test suite.

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

Questo test potrebbe essere notevolmente semplificato utilizzando `common.mustCall` in questo modo:

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

#### Modulo Countdown

The common [Countdown module](https://github.com/nodejs/node/tree/master/test/common#countdown-module) provides a simple countdown mechanism for tests that require a particular action to be taken after a given number of completed tasks (for instance, shutting down an HTTP server after a specific number of requests).

```javascript
const Countdown = require('../common/countdown');

const countdown = new Countdown(2, function() {
  console.log('.');
});

countdown.dec();
countdown.dec(); // Il countdown callback sarà invocato adesso.
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

### Flags

Alcuni test richiedono l'esecuzione di Node.js con uno specifico set di command line flag. To accomplish this, add a `// Flags:` comment in the preamble of the test followed by the flags. For example, to allow a test to require some of the `internal/*` modules, add the `--expose-internals` flag. Un test che richiede `internal/freelist` potrebbe iniziare in questo modo:

```javascript
'use strict';

// Flags: --expose-internals

require('../common');
const assert = require('assert');
const freelist = require('internal/freelist');
```

### Assertions

Quando vengono scritte le assertion, sono preferibili le versioni strict:

- `assert.strictEqual()` al posto di `assert.equal()`
- `assert.deepStrictEqual()` al posto di `assert.deepEqual()`

Quando si utilizza `assert.throws()`, se possibile, fornire l'error message completo:

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  /^Error: Wrong value$/ // Invece di qualcosa tipo /Wrong value/
);
```

### Console output

Output written by tests to stdout or stderr, such as with `console.log()` or `console.error()`, can be useful when writing tests, as well as for debugging them during later maintenance. The output will be suppressed by the test runner (`./tools/test.py`) unless the test fails, but will always be displayed when running tests directly with `node`. For failing tests, the test runner will include the output along with the failed test assertion in the test report.

Some output can help debugging by giving context to test failures. For example, when troubleshooting tests that timeout in CI. With no log statements, we have no idea where the test got hung up.

There have been cases where tests fail without `console.log()`, and then pass when its added, so be cautious about its use, particularly in tests of the I/O and streaming APIs.

Excessive use of console output is discouraged as it can overwhelm the display, including the Jenkins console and test report displays. Be particularly cautious of output in loops, or other contexts where output may be repeated many times in the case of failure.

In some tests, it can be unclear whether a `console.log()` statement is required as part of the test (message tests, tests that check output from child processes, etc.), or is there as a debug aide. If there is any chance of confusion, use comments to make the purpose clear.

### Funzionalità ES.Next

For performance considerations, we only use a selected subset of ES.Next features in JavaScript code in the `lib` directory. However, when writing tests, for the ease of backporting, it is encouraged to use those ES.Next features that can be used directly without a flag in [all maintained branches](https://github.com/nodejs/lts). [node.green](http://node.green/) lists available features in each release, such as:

- `let` e `const` al posto di `var`
- Template letterali al posto della concatenazione delle stringhe
- Funzioni Arrow quando opportune

## Denominazione dei Test File

I test file sono denominati utilizzando il kebab casing. The first component of the name is `test`. Il secondo è il modulo od il sottosistema in fase di test. The third is usually the method or event name being tested. Subsequent components of the name add more information about what is being tested.

For example, a test for the `beforeExit` event on the `process` object might be named `test-process-before-exit.js`. If the test specifically checked that arrow functions worked correctly with the `beforeExit` event, then it might be named `test-process-before-exit-arrow-functions.js`.

## Test Importati

### Web Platform Tests

Some of the tests for the WHATWG URL implementation (named `test-whatwg-url-*.js`) are imported from the [Web Platform Tests Project](https://github.com/w3c/web-platform-tests/tree/master/url). Questi test importati verranno sottoposti al wrapping nel seguente modo:

```js
/* I seguenti test sono copiati da WPT. Le relative modifiche dovrebbero essere prima installate. Refs:
   https://github.com/w3c/web-platform-tests/blob/8791bed/url/urlsearchparams-stringifier.html
   License: http://www.w3.org/Consortium/Legal/2008/04-testsuite-copyright.html
*/
/* eslint-disable */

// Test code

/* eslint-enable */
```

To improve tests that have been imported this way, please send a PR to the upstream project first. When the proposed change is merged in the upstream project, send another PR here to update Node.js accordingly. Assicurati di aggiornare l'hash nell'URL dopo `WPT Refs:`.

## Test dell'unità C++

Il codice C++ può essere testato utilizzando [Google Test](https://github.com/google/googletest). Most features in Node.js can be tested using the methods described previously in this document. But there are cases where these might not be enough, for example writing code for Node.js that will only be called when Node.js is embedded.

### Aggiungere un nuovo test

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

Successivamente aggiungi il test alle `sources` nel `cctest` target in node.gyp:

```console
'sources': [
  'test/cctest/test_env.cc',
  ...
],
```

Note that the only sources that should be included in the cctest target are actual test or helper source files. There might be a need to include specific object files that are compiled by the `node` target and this can be done by adding them to the `libraries` section in the cctest target.

Il test può essere eseguito tramite l'eseguzione del `cctest` target:

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

### Test fixture di Node.js

There is a [test fixture](https://github.com/google/googletest/blob/master/googletest/docs/Primer.md#test-fixtures-using-the-same-data-configuration-for-multiple-tests) named `node_test_fixture.h` which can be included by unit tests. The fixture takes care of setting up the Node.js environment and tearing it down after the tests have finished.

Contiene anche un helper per creare argomenti da passare all'interno di Node.js. It will depend on what is being tested if this is required or not.

### Test Coverage

To generate a test coverage report, see the [Test Coverage section of the Building guide](https://github.com/nodejs/node/blob/master/BUILDING.md#running-coverage).