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

creerà un timeout di 4 secondi sulla maggior parte delle platform (piattaforme) ma un timeout più lungo sulle platform più lente.

### La *common* API

Utilizza il più possibile gli helper del modulo `common`. Fai riferimento alla [documentazione del file common](https://github.com/nodejs/node/tree/master/test/common) per i dettagli completi riguardanti gli helper.

#### common.mustCall

Un caso interessante è `common.mustCall`. L'utilizzo di `common.mustCall` può evitare l'uso di variabili extra e delle assertion corrispondenti. Spieghiamolo con un test reale presente nell'insieme dei test di Node.js.

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

Il [modulo common Countdown](https://github.com/nodejs/node/tree/master/test/common#countdown-module) fornisce un semplice meccanismo di countdown per i test che richiedono una determinata azione da intraprendere dopo un dato numero di attività completate (ad esempio, arrestando un server HTTP dopo un numero specifico di richieste).

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

Alcuni test richiedono l'esecuzione di Node.js con uno specifico set di command line flag. Per fare ciò, aggiungi un commento `// Flags:` nel preambolo del test seguito dai flag. Ad esempio, per consentire ad un test di richiedere alcuni dei moduli `internal/*`, aggiungi il flag `--expose-internals`. Un test che richiede `internal/freelist` potrebbe iniziare in questo modo:

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

Per considerazioni relative alle prestazioni, utilizziamo solo un sottoinsieme selezionato di funzionalità ES.Next nel codice JavaScript nella directory `lib`. Tuttavia, durante la scrittura dei test, per facilitare il backport, è consigliato utilizzare le funzionalità ES.Next utilizzabili direttamente senza un flag in [tutti i branch mantenuti](https://github.com/nodejs/lts). [node.green](http://node.green/) lists available features in each release, such as:

- `let` e `const` al posto di `var`
- Template letterali al posto della concatenazione delle stringhe
- Funzioni Arrow quando opportune

## Denominazione dei Test File

I test file sono denominati utilizzando il kebab casing. Il primo componente del nome è `test`. Il secondo è il modulo od il sottosistema in fase di test. Il terzo è solitamente il metodo od il nome dell'evento in fase di test. I componenti successivi del nome aggiungono ulteriori informazioni su ciò che viene testato.

Ad esempio, un test per l'evento `beforeExit` sul `process` object potrebbe essere denominato `test-process-before-exit.js`. Se il test ha verificato in modo specifico che le funzioni arrow funzionassero correttamente con l'evento `beforeExit`, potrebbe essere denominato `test-process-before-exit-arrow-functions.js`.

## Test Importati

### Web Platform Tests

Alcuni dei test per l'implementazione del WHATWG URL (denominati `test-whatwg-url-*.js`) vengono importati dal [Web Platform Tests Project](https://github.com/w3c/web-platform-tests/tree/master/url). Questi test importati verranno sottoposti al wrapping nel seguente modo:

```js
/* I seguenti test sono copiati da WPT. Le relative modifiche dovrebbero essere prima installate. Refs:
   https://github.com/w3c/web-platform-tests/blob/8791bed/url/urlsearchparams-stringifier.html
   License: http://www.w3.org/Consortium/Legal/2008/04-testsuite-copyright.html
*/
/* eslint-disable */

// Test code

/* eslint-enable */
```

Per migliorare i test che sono stati importati in questo modo, inviare prima una PR al progetto sopracitato. Quando la modifica proposta viene inserita nel progetto sopracitato, invia un altra PR qui per aggiornare di conseguenza anche Node.js. Assicurati di aggiornare l'hash nell'URL dopo `WPT Refs:`.

## Test dell'unità C++

Il codice C++ può essere testato utilizzando [Google Test](https://github.com/google/googletest). La maggior parte delle funzionalità in Node.js può essere testata utilizzando i metodi descritti in precedenza in questo documento. Ma ci sono casi in cui questi potrebbero non essere sufficienti, ad esempio scrivere codice per Node.js che verrà chiamato solo quando viene incorporato Node.js.

### Aggiungere un nuovo test

Lo unit test deve essere inserito in `test/cctest` e deve essere denominato con il prefisso `test` seguito dal nome dell'unità testata. Ad esempio, il codice seguente verrà inserito in `test/cctest/test_env.cc`:

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

Si noti che le sole sources (fonti) che dovrebbero essere incluse nel cctest target sono i veri e propri test source file od helper source file. Potrebbe essere necessario includere object file specifici compilati dal `node` target e questo può essere fatto aggiungendoli alla sezione `libraries` nel cctest target.

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

### Node.js test fixture
C'è un [test fixture](https://github.com/google/googletest/blob/master/googletest/docs/Primer.md#test-fixtures-using-the-same-data-configuration-for-multiple-tests) denominato `node_test_fixture.h` che può essere incluso dagli unit test. Il fixture si occupa di configurare l'ambiente di Node.js e di abbatterlo al termine dei test.

Contiene anche un helper per creare argomenti da passare all'interno di Node.js. In base a cosa viene testato si decide se questo è richiesto oppure no.

### Test Coverage

To generate a test coverage report, see the [Test Coverage section of the Building guide](https://github.com/nodejs/node/blob/master/BUILDING.md#running-coverage).
