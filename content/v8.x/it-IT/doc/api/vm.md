# VM (Esecuzione di JavaScript)

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

<!--name=vm-->

Il modulo `vm` fornisce API per la compilazione e l'esecuzione del codice all'interno dei contesti di V8 Virtual Machine.

Il codice JavaScript può essere compilato ed eseguito immediatamente o compilato, salvato ed eseguito successivamente.

Un caso d'uso comune è quello di eseguire il codice in un ambiente in modalità sandbox. Il codice in modalità sandbox utilizza un V8 Context differente, che significa che ha un global object diverso dal resto del codice.

È possibile fornire il contesto eseguendo il ["contextify"](#vm_what_does_it_mean_to_contextify_an_object) di un sandbox object. Il codice in modalità sandbox considera qualsiasi proprietà sul sandbox come una variabile globale. Qualsiasi modifica alle variabili globali causata dal codice in modalità sandbox si riflette nel sandbox object.

```js
const vm = require('vm');

const x = 1;

const sandbox = { x: 2 };
vm.createContext(sandbox); // Eseguire il Contextify del sandbox.

const code = 'x += 40; var y = 17;';
// x e y sono variabili globali nell'ambiente in modalità sandbox.
// Inizialmente, x ha il valore 2 perché quello è il valore di sandbox.x.
vm.runInContext(code, sandbox);

console.log(sandbox.x); // 42
console.log(sandbox.y); // 17

console.log(x); // 1; y non è definito.
```

*Note*: The vm module is not a security mechanism. **Do not use it to run untrusted code**.

## Class: vm.Script
<!-- YAML
added: v0.3.1
-->

Le istanze della classe `vm.Script` contengono script precompilati che possono essere eseguiti in sandbox specifici (o "contesti").

### new vm.Script(code, options)
<!-- YAML
added: v0.3.1
changes:
  - version: v5.7.0
    pr-url: https://github.com/nodejs/node/pull/4777
    description: The `cachedData` and `produceCachedData` options are
                 supported now.
-->

* `code` {string} Il codice JavaScript da compilare.
* `options`
  * `filename` {string} Specifica il filename utilizzato nelle stack trace prodotte da questo script.
  * `lineOffset` {number} Specifica l'offset del numero di riga che viene visualizzato nelle stack trace prodotte da questo script.
  * `columnOffset` {number} Specifica l'offset del numero di colonna che viene visualizzato nelle stack trace prodotte da questo script.
  * `displayErrors` {boolean} Quando `true`, se si verifica un errore [`Error`][] durante la compilazione del `code`, la riga di codice che causa l'errore viene collegata alla stack trace.
  * `timeout` {number} Specifica il numero di millisecondi per eseguire `code` prima di terminare l'esecuzione. Se l'esecuzione è terminata, verrà generato un [`Error`][].
  * `cachedData` {Buffer} Fornisce un `Buffer` opzionale con i dati della cache del codice di V8 per la sorgente fornita. Quando fornito, il valore `cachedDataRejected` verrà impostato su `true` o `false` a seconda dell'accettazione dei dati da parte di V8.
  * `produceCachedData` {boolean} Quando è `true` e nessun `cachedData` è presente, V8 cercherà di produrre dati della cache del codice per `code`. In caso di successo, un `Buffer` con i dati della cache del codice di V8 verrà prodotto e memorizzato nella proprietà `cachedData` dell'istanza `vm.Script` restituita. Il valore `cachedDataProduced` sarà impostato su `true` o `false` a seconda del fatto che i dati della cache del codice vengano prodotti correttamente o meno.

La creazione di un nuovo `vm.Script` object compila `code` ma non lo esegue. Il `vm.Script` compilato può essere eseguito successivamente più volte. Il `code` non è associato a nessun global object; piuttosto, viene sottoposto al binding prima di ogni esecuzione, esclusivamente per quell'esecuzione.

### script.runInContext(contextifiedSandbox[, options])
<!-- YAML
added: v0.3.1
changes:
  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/6635
    description: The `breakOnSigint` option is supported now.
-->

* `contextifiedSandbox` {Object} Un object [che ha subito il contextify](#vm_what_does_it_mean_to_contextify_an_object) come restituito dal metodo `vm.createContext()`.
* `options` {Object}
  * `filename` {string} Specifica il filename utilizzato nelle stack trace prodotte da questo script.
  * `lineOffset` {number} Specifica l'offset del numero di riga che viene visualizzato nelle stack trace prodotte da questo script.
  * `columnOffset` {number} Specifica l'offset del numero di colonna che viene visualizzato nelle stack trace prodotte da questo script.
  * `displayErrors` {boolean} Quando `true`, se si verifica un errore [`Error`][] durante la compilazione del `code`, la riga di codice che causa l'errore viene collegata alla stack trace.
  * `timeout` {number} Specifica il numero di millisecondi per eseguire `code` prima di terminare l'esecuzione. Se l'esecuzione è terminata, verrà generato un [`Error`][].
  * `breakOnSigint`: se `true`, l'esecuzione verrà terminata al ricevimento di `SIGINT` (Ctrl+C). Gli handler esistenti per l'evento che è stato collegato tramite `process.on('SIGINT')` verranno disabilitati durante l'esecuzione dello script, tuttavia dopo ciò continueranno a funzionare. Se l'esecuzione è terminata, verrà generato un [`Error`][].


Esegue il codice compilato contenuto dal `vm.Script` object all'interno del `contextifiedSandbox` specificato e restituisce il risultato. L'esecuzione del codice non ha accesso allo scope locale.

L'esempio seguente compila il codice che incrementa una variabile globale, imposta il valore di un'altra variabile globale, quindi esegue il codice più volte. I globali sono contenuti nel `sandbox` object.

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

*Note*: Using the `timeout` or `breakOnSigint` options will result in new event loops and corresponding threads being started, which have a non-zero performance overhead.

### script.runInNewContext([sandbox[, options]])
<!-- YAML
added: v0.3.1
-->

* `sandbox` {Object} Un object che [subirà il contextify](#vm_what_does_it_mean_to_contextify_an_object). Se `undefined`, verrà creato un nuovo object.
* `options` {Object}
  * `filename` {string} Specifica il filename utilizzato nelle stack trace prodotte da questo script.
  * `lineOffset` {number} Specifica l'offset del numero di riga che viene visualizzato nelle stack trace prodotte da questo script.
  * `columnOffset` {number} Specifica l'offset del numero di colonna che viene visualizzato nelle stack trace prodotte da questo script.
  * `displayErrors` {boolean} Quando `true`, se si verifica un errore [`Error`][] durante la compilazione del `code`, la riga di codice che causa l'errore viene collegata alla stack trace.
  * `timeout` {number} Specifica il numero di millisecondi per eseguire `code` prima di terminare l'esecuzione. Se l'esecuzione è terminata, verrà generato un [`Error`][].

Innanzitutto esegue il contextify su un determinato `sandbox`, esegue il codice compilato contenuto dal `vm.Script` object all'interno della sandbox creata e restituisce il risultato. L'esecuzione del codice non ha accesso allo scope locale.

Il seguente esempio compila il codice che imposta una variabile globale, quindi esegue il codice più volte in contesti differenti. I globali vengono impostati e contenuti all'interno di ogni singolo `sandbox`.

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
  * `filename` {string} Specifica il filename utilizzato nelle stack trace prodotte da questo script.
  * `lineOffset` {number} Specifica l'offset del numero di riga che viene visualizzato nelle stack trace prodotte da questo script.
  * `columnOffset` {number} Specifica l'offset del numero di colonna che viene visualizzato nelle stack trace prodotte da questo script.
  * `displayErrors` {boolean} Quando `true`, se si verifica un errore [`Error`][] durante la compilazione del `code`, la riga di codice che causa l'errore viene collegata alla stack trace.
  * `timeout` {number} Specifica il numero di millisecondi per eseguire `code` prima di terminare l'esecuzione. Se l'esecuzione è terminata, verrà generato un [`Error`][].

Esegue il codice compilato contenuto dal `vm.Script` all'interno del contesto del `global` object corrente. L'esecuzione del codice non ha accesso allo scope locale, tuttavia *ha* accesso al `global` object corrente.

Il seguente esempio compila il codice che incrementa una variabile `globale`, quindi esegue quel codice più volte:

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

Se viene specificato un `sandbox` object, il metodo `vm.createContext()` [preparerà quel sandbox](#vm_what_does_it_mean_to_contextify_an_object) in modo che possa essere utilizzato in chiamate a [`vm.runInContext()`][] o a [`script.runInContext()`][]. All'interno di questi script, il `sandbox` object sarà il global object, mantenendo tutte le sue proprietà esistenti, ma avendo inoltre gli object incorporati e le funzioni che qualsiasi [global object](https://es5.github.io/#x15.1) standard possiede. Al di fuori degli script eseguiti dal modulo vm, le variabili globali rimarranno invariate.

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

Se `sandbox` viene omesso (o passato esplicitamente come `undefined`), verrà restituito un sandbox object che [ha subito il contextify](#vm_what_does_it_mean_to_contextify_an_object) nuovo e vuoto.

Il metodo `vm.createContext()` è principalmente utile per creare un singolo sandbox che può essere utilizzato per eseguire script multipli. Per esempio, se si emula un browser web, il metodo può essere utilizzato per creare un singolo sandbox che rappresenti un global object di window e quindi eseguire contemporaneamente tutti i tag `<script>` all'interno del contesto di quel sandbox.

## vm.isContext(sandbox)
<!-- YAML
added: v0.11.7
-->

* `sandbox` {Object}

Restituisce `true` se il [contextify](#vm_what_does_it_mean_to_contextify_an_object) del `sandbox` object specificato è stato eseguito utilizzando [`vm.createContext()`][].

## vm.runInContext(code, contextifiedSandbox[, options])

* `code` {string} Il codice JavaScript da compilare ed eseguire.
* `contextifiedSandbox` {Object} L'object che [ha subito il contextify](#vm_what_does_it_mean_to_contextify_an_object) che verrà utilizzato come `global` nel momento in cui il `code` viene compilato ed eseguito.
* `options`
  * `filename` {string} Specifica il filename utilizzato nelle stack trace prodotte da questo script.
  * `lineOffset` {number} Specifica l'offset del numero di riga che viene visualizzato nelle stack trace prodotte da questo script.
  * `columnOffset` {number} Specifica l'offset del numero di colonna che viene visualizzato nelle stack trace prodotte da questo script.
  * `displayErrors` {boolean} Quando `true`, se si verifica un errore [`Error`][] durante la compilazione del `code`, la riga di codice che causa l'errore viene collegata alla stack trace.
  * `timeout` {number} Specifica il numero di millisecondi per eseguire `code` prima di terminare l'esecuzione. Se l'esecuzione è terminata, verrà generato un [`Error`][].

Il metodo `vm.runInContext()` compila il `code`, lo esegue all'interno del contesto del `contextifiedSandbox`, quindi restituisce il risultato. L'esecuzione del codice non ha accesso allo scope locale. Il `contextifiedSandbox` object *deve* avere precedentemente [subito il contextify](#vm_what_does_it_mean_to_contextify_an_object) utilizzando il metodo [`vm.createContext()`][].

Il seguente esempio compila ed esegue script differenti utilizzando un singolo object che [ha subito il contextify](#vm_what_does_it_mean_to_contextify_an_object):

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

## vm.runInDebugContext(code)
<!-- YAML
added: v0.11.14
-->

> Stabilità: 0 - Obsoleto. An alternative is in development.

* `code` {string} Il codice JavaScript da compilare ed eseguire.

The `vm.runInDebugContext()` method compiles and executes `code` inside the V8 debug context. The primary use case is to gain access to the V8 `Debug` object:

```js
const vm = require('vm');
const Debug = vm.runInDebugContext('Debug');
console.log(Debug.findScript(process.emit).name);  // 'events.js'
console.log(Debug.findScript(process.exit).name);  // 'internal/process.js'
```

*Note*: The debug context and object are intrinsically tied to V8's debugger implementation and may change (or even be removed) without prior warning.

The `Debug` object can also be made available using the V8-specific `--expose_debug_as=` [command line option](cli.html).

## vm.runInNewContext(code\[, sandbox\]\[, options\])
<!-- YAML
added: v0.3.1
-->

* `code` {string} Il codice JavaScript da compilare ed eseguire.
* `sandbox` {Object} Un object che [subirà il contextify](#vm_what_does_it_mean_to_contextify_an_object). Se `undefined`, verrà creato un nuovo object.
* `options`
  * `filename` {string} Specifica il filename utilizzato nelle stack trace prodotte da questo script.
  * `lineOffset` {number} Specifica l'offset del numero di riga che viene visualizzato nelle stack trace prodotte da questo script.
  * `columnOffset` {number} Specifica l'offset del numero di colonna che viene visualizzato nelle stack trace prodotte da questo script.
  * `displayErrors` {boolean} Quando `true`, se si verifica un errore [`Error`][] durante la compilazione del `code`, la riga di codice che causa l'errore viene collegata alla stack trace.
  * `timeout` {number} Specifica il numero di millisecondi per eseguire `code` prima di terminare l'esecuzione. Se l'esecuzione è terminata, verrà generato un [`Error`][].

Il `vm.runInNewContext()` prima di tutto esegue il contextify sul `sandbox` object specificato (o crea un nuovo `sandbox` se passato come `undefined`), compila il `code`, lo esegue all'interno del contesto del contesto creato, quindi restituisce il risultato. L'esecuzione del codice non ha accesso allo scope locale.

Il seguente esempio compila ed esegue il codice che incrementa una variabile globale e ne imposta una nuova. Questi globali sono contenuti nel `sandbox`.

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

* `code` {string} Il codice JavaScript da compilare ed eseguire.
* `options`
  * `filename` {string} Specifica il filename utilizzato nelle stack trace prodotte da questo script.
  * `lineOffset` {number} Specifica l'offset del numero di riga che viene visualizzato nelle stack trace prodotte da questo script.
  * `columnOffset` {number} Specifica l'offset del numero di colonna che viene visualizzato nelle stack trace prodotte da questo script.
  * `displayErrors` {boolean} Quando `true`, se si verifica un errore [`Error`][] durante la compilazione del `code`, la riga di codice che causa l'errore viene collegata alla stack trace.
  * `timeout` {number} Specifica il numero di millisecondi per eseguire `code` prima di terminare l'esecuzione. Se l'esecuzione è terminata, verrà generato un [`Error`][].

`vm.runInThisContext()` compila il `code`, lo esegue all'interno del contesto del `global` corrente e restituisce il risultato. L'esecuzione del codice non ha accesso allo scope locale, tuttavia ha accesso al `global` object corrente.

L'esempio seguente illustra sia l'utilizzo di `vm.runInThisContext()` che della funzione JavaScript [`eval()`][] per eseguire lo stesso codice:
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

Poiché `vm.runInThisContext()` non ha accesso allo scope locale, `localVar` è invariato. Al contrario, [`eval()`][] *ha* accesso allo scope locale, quindi il valore `localVar` è variato. In questo modo `vm.runInThisContext()` è molto simile a un [indirect `eval()` call][], ad esempio `(0,eval)('code')`.

## Esempio: Esecuzione di un Server HTTP all'interno di una VM

When using either [`script.runInThisContext()`][] or [`vm.runInThisContext()`][], the code is executed within the current V8 global context. The code passed to this VM context will have its own isolated scope.

Per eseguire un semplice web server utilizzando il modulo `http`, il codice passato al contesto deve chiamare `require('http')` autonomamente o avere un riferimento al modulo `http` passato a esso. Ad esempio:

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

*Note*: The `require()` in the above case shares the state with the context it is passed from. Ciò può introdurre dei rischi quando viene eseguito un codice non attendibile, ad esempio alterando object nel contesto in modi indesiderati.

## Cosa significa "eseguire il contextify" su un object?

Tutto il JavaScript eseguito all'interno di Node.js funziona all'interno dello scope di un "contesto". Secondo la [Guida dell'Embedder di V8](https://github.com/v8/v8/wiki/Embedder's%20Guide#contexts):

> In V8, un contesto è un ambiente di esecuzione che permette di eseguire applicazioni JavaScript separate e non correlate in una singola istanza di V8. È necessario specificare esplicitamente il contesto in cui si desidera che venga eseguito qualsiasi codice JavaScript.

Nel momento in cui viene chiamato il metodo `vm.createContext()`, il `sandbox` object che viene passato (o un object appena creato se `sandbox` è `undefined`) viene associato internamente con una nuova istanza di un V8 Context. Questo V8 Context fornisce il `code` eseguito utilizzando i metodi del modulo `vm` con un ambiente globale isolato all'interno del quale può operare. Il processo di creazione del V8 Context e della sua associazione con il `sandbox` object è ciò a cui questo documento si riferisce con l'espressione "eseguire il contextify" del `sandbox`.
