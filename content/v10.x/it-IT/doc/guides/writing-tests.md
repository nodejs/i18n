# Come scrivere un test per il progetto Node.js

## Cos'è un test?

La maggior parte dei test nel Node.js core sono programmi JavaScript che esercitano una funzionalità fornita da Node.js e controllano che si comporti come previsto. I test dovrebbero uscire con il codice `0` in caso di successo. Un test fallirà se:

- Esce impostando `process.exitCode` su un numero diverso da zero. 
  - Di solito ciò avviene facendo in modo che un assertion generi un uncaught Error.
  - Occasionalmente, l'utilizzo di `process.exit(code)` potrebbe essere appropriato.
- Non esce mai. In questo caso, il test runner terminerà il test perché imposta un limite di tempo massimo.

Aggiungi i test quando:

- Vengono aggiunte nuove funzionalità.
- Vengono corretti regressioni e bug.
- Viene ampliato il test coverage.

## Test directory structure

Vedi la [panoramica della directory structure](https://github.com/nodejs/node/blob/master/test/README.md#test-directories) per la descrizione dei test & delle posizioni esistenti. Al momento di decidere se espandere un file di test esistente o crearne uno nuovo, prendi in considerazione la possibilità di passare attraverso i file relativi al sottosistema. Ad esempio, cerca `test-streams` durante la scrittura di un test per `lib/streams.js`.

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

La prima riga attiva la strict mode. Tutti i test dovrebbero essere in strict mode a meno che la natura del test richieda che funzioni senza tale modalità.

La seconda riga carica il modulo `common`. Il modulo [`common` module][] è un modulo helper (di supporto) che fornisce strumenti utili per i test. Alcune funzionalità di common sono state estratte in sottomoduli, che sono richiesti separatamente come in ad esempio in questo caso il modulo fixtures.

Anche se un test non utilizza funzioni od altre proprietà esportate da `common`, il test dovrebbe comunque includere il modulo `common` prima di qualsiasi altro modulo. Questo perché il modulo `common` include il codice che causerà il fallimento di un test nel caso in cui il test perda le variabili all'interno del global space. In situazioni in cui un test non utilizza funzioni od altre proprietà esportate da `common`, includilo senza assegnarlo a un identifier (identificatore):

```javascript
require('../common');
```

### **Righe 5-6**

```javascript
// Questo test assicura che l'http-parser possa gestire i caratteri UTF-8
// nell'http header.
```

Un test dovrebbe iniziare con un commento contenente una breve descrizione che spiega cosa va a testare.

### **Righe 8-9**

```javascript
const assert = require('assert');
const http = require('http');
```

Il test controlla le funzionalità nel modulo `http`.

La maggior parte dei test utilizza il modulo `assert` per confermare le proprie aspettative.

Le istruzioni require sono ordinate secondo l'[ASCII](http://man7.org/linux/man-pages/man7/ascii.7.html) (cifre, lettere maiuscole, `_`, lettere minuscole).

### **Righe 11-22**

Questo è il body (corpo) del test. Questo test è semplice, verifica solo che un server HTTP accetti i caratteri `non-ASCII` negli header di una richiesta in entrata. Cose interessanti da notare:

- Se il test non dipende da un numero di porta specifico, utilizza sempre 0 invece di un valore arbitrario, in quanto consente ai test di eseguire in parallelo in modo sicuro, visto che il sistema operativo assegnerà una porta casuale. Se il test richiede una porta specifica, ad esempio se il test verifica che l'assegnazione di una porta specifica funzioni come previsto, allora è giusto assegnare un numero di porta specifico.
- L'utilizzo di `common.mustCall` per controllare che vengano chiamati alcuni callback/listener.
- Il server HTTP si chiude dopo l'esecuzione di tutti i controlli. In questo modo, il test può uscire tranquillamente. Ricorda che per far sì che un test riesca, deve uscire con uno status code pari a 0.

## Raccomandazioni Generali

### Timers

Evitare i timer a meno che il test non li stia testando specificamente. Ci sono molte ragioni per farlo. Principalmente, sono una fonte di problematiche. Per una spiegazione approfondita vai [qui](https://github.com/nodejs/testing/issues/27).

Nel caso in cui un test abbia bisogno di un timer, considera l'utilizzo del metodo `common.platformTimeout()`. Permette di impostare specifici timeout a seconda della platform (piattaforma):

```javascript
const timer = setTimeout(fail, common.platformTimeout(4000));
```

will create a 4-second timeout on most platforms but a longer timeout on slower platforms.

### The *common* API

Make use of the helpers from the `common` module as much as possible. Please refer to the [common file documentation](https://github.com/nodejs/node/tree/master/test/common) for the full details of the helpers.

#### common.mustCall

One interesting case is `common.mustCall`. The use of `common.mustCall` may avoid the use of extra variables and the corresponding assertions. Let's explain this with a real test from the test suite.

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

This test could be greatly simplified by using `common.mustCall` like this:

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

#### Countdown Module

The common [Countdown module](https://github.com/nodejs/node/tree/master/test/common#countdown-module) provides a simple countdown mechanism for tests that require a particular action to be taken after a given number of completed tasks (for instance, shutting down an HTTP server after a specific number of requests).

```javascript
const Countdown = require('../common/countdown');

const countdown = new Countdown(2, function() {
  console.log('.');
});

countdown.dec();
countdown.dec(); // The countdown callback will be invoked now.
```

### Flags

Some tests will require running Node.js with specific command line flags set. To accomplish this, add a `// Flags:` comment in the preamble of the test followed by the flags. For example, to allow a test to require some of the `internal/*` modules, add the `--expose-internals` flag. A test that would require `internal/freelist` could start like this:

```javascript
'use strict';

// Flags: --expose-internals

require('../common');
const assert = require('assert');
const freelist = require('internal/freelist');
```

### Assertions

When writing assertions, prefer the strict versions:

- `assert.strictEqual()` over `assert.equal()`
- `assert.deepStrictEqual()` over `assert.deepEqual()`

When using `assert.throws()`, if possible, provide the full error message:

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  /^Error: Wrong value$/ // Instead of something like /Wrong value/
);
```

### ES.Next features

For performance considerations, we only use a selected subset of ES.Next features in JavaScript code in the `lib` directory. However, when writing tests, for the ease of backporting, it is encouraged to use those ES.Next features that can be used directly without a flag in [all maintained branches](https://github.com/nodejs/lts). [node.green](http://node.green/) lists available features in each release, such as:

- `let` and `const` over `var`
- Template literals over string concatenation
- Arrow functions when appropriate

## Naming Test Files

Test files are named using kebab casing. The first component of the name is `test`. The second is the module or subsystem being tested. The third is usually the method or event name being tested. Subsequent components of the name add more information about what is being tested.

For example, a test for the `beforeExit` event on the `process` object might be named `test-process-before-exit.js`. If the test specifically checked that arrow functions worked correctly with the `beforeExit` event, then it might be named `test-process-before-exit-arrow-functions.js`.

## Imported Tests

### Web Platform Tests

Some of the tests for the WHATWG URL implementation (named `test-whatwg-url-*.js`) are imported from the [Web Platform Tests Project](https://github.com/w3c/web-platform-tests/tree/master/url). These imported tests will be wrapped like this:

```js
/* The following tests are copied from WPT. Modifications to them should be
   upstreamed first. Refs:
   https://github.com/w3c/web-platform-tests/blob/8791bed/url/urlsearchparams-stringifier.html
   License: http://www.w3.org/Consortium/Legal/2008/04-testsuite-copyright.html
*/
/* eslint-disable */

// Test code

/* eslint-enable */
```

To improve tests that have been imported this way, please send a PR to the upstream project first. When the proposed change is merged in the upstream project, send another PR here to update Node.js accordingly. Be sure to update the hash in the URL following `WPT Refs:`.

## C++ Unit test

C++ code can be tested using [Google Test](https://github.com/google/googletest). Most features in Node.js can be tested using the methods described previously in this document. But there are cases where these might not be enough, for example writing code for Node.js that will only be called when Node.js is embedded.

### Adding a new test

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

Next add the test to the `sources` in the `cctest` target in node.gyp:

```console
'sources': [
  'test/cctest/test_env.cc',
  ...
],
```

Note that the only sources that should be included in the cctest target are actual test or helper source files. There might be a need to include specific object files that are compiled by the `node` target and this can be done by adding them to the `libraries` section in the cctest target.

The test can be executed by running the `cctest` target:

```console
$ make cctest
```

### Node.js test fixture

There is a [test fixture](https://github.com/google/googletest/blob/master/googletest/docs/Primer.md#test-fixtures-using-the-same-data-configuration-for-multiple-tests) named `node_test_fixture.h` which can be included by unit tests. The fixture takes care of setting up the Node.js environment and tearing it down after the tests have finished.

It also contains a helper to create arguments to be passed into Node.js. It will depend on what is being tested if this is required or not.

### Test Coverage

To generate a test coverage report, see the [Test Coverage section of the Pull Requests guide](https://github.com/nodejs/node/blob/master/doc/guides/contributing/pull-requests.md#test-coverage).