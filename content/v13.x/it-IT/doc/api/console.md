# Console

<!--introduced_in=v0.10.13-->

> Stabilità: 2 - Stable

Il modulo `console` fornisce una semplice debugging console con funzionamento simile alla JavaScript console fornita dai browser web.

Il modulo esporta due componenti specifici:

* Una classe `Console` con metodi come `console.log()`, `console.error()` e `console.warn()` che possono essere utilizzati per eseguire la scrittura (writing) su qualsiasi stream di Node.js.
* Un'istanza global `console` configurata per eseguire la scrittura (writing) su [`process.stdout`][] e [`process.stderr`][]. La global `console` può essere utilizzata senza chiamare `require('console')`.

***Warning***: The global console object's methods are neither consistently synchronous like the browser APIs they resemble, nor are they consistently asynchronous like all other Node.js streams. Vedi la [nota sul proceso I/O](process.html#process_a_note_on_process_i_o) per maggiori informazioni.

Esempio utilizzando la global `console`:

```js
console.log('hello world');
// Stampa: hello world, a stdout
console.log('hello %s', 'world');
// Stampa: hello world, a stdout
console.error(new Error('Whoops, something bad happened'));
// Stampa: [Error: Whoops, something bad happened], a stderr

const name = 'Will Robinson';
console.warn(`Danger ${name}! Danger!`);
// Stampa: Danger Will Robinson! Danger!, a stderr
```

Esempio utilizzando la classe `Console`:

```js
const out = getStreamSomehow();
const err = getStreamSomehow();
const myConsole = new console.Console(out, err);

myConsole.log('hello world');
// Stampa: hello world, ad out
myConsole.log('hello %s', 'world');
// Stampa: hello world, ad out
myConsole.error(new Error('Whoops, something bad happened'));
// Stampa: [Error: Whoops, something bad happened], ad err

const name = 'Will Robinson';
myConsole.warn(`Danger ${name}! Danger!`);
// Stampa: Danger Will Robinson! Danger!, ad err
```

## Class: `Console`
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/9744
    description: Errors that occur while writing to the underlying streams
                 will now be ignored by default.
-->

<!--type=class-->

The `Console` class can be used to create a simple logger with configurable output streams and can be accessed using either `require('console').Console` or `console.Console` (or their destructured counterparts):

```js
const { Console } = require('console');
```

```js
const { Console } = console;
```

### `new Console(stdout[, stderr][, ignoreErrors])`
### `new Console(options)`
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/9744
    description: The `ignoreErrors` option was introduced.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19372
    description: The `Console` constructor now supports an `options` argument,
                 and the `colorMode` option was introduced.
  - version: v11.7.0
    pr-url: https://github.com/nodejs/node/pull/24978
    description: The `inspectOptions` option is introduced.
-->

* `options` {Object}
  * `stdout` {stream.Writable}
  * `stderr` {stream.Writable}
  * `ignoreErrors` {boolean} Ignore errors when writing to the underlying streams. **Default:** `true`.
  * `colorMode` {boolean|string} Imposta il supporto dei colori per quest'istanza `Console`. Setting to `true` enables coloring while inspecting values. Setting to `false` disables coloring while inspecting values. Setting to `'auto'` makes color support depend on the value of the `isTTY` property and the value returned by `getColorDepth()` on the respective stream. This option can not be used, if `inspectOptions.colors` is set as well. **Default:** `'auto'`.
  * `inspectOptions` {Object} Specifies options that are passed along to [`util.inspect()`][].

Crea una nuova `Console` con una o due istanze di writable stream. `stdout` è un writable stream per stampare log o info output. `stderr` è utilizzato per stampare warning o error output. Se `stderr` non viene fornito, viene utilizzato `stdout` al posto di `stderr`.

```js
const output = fs.createWriteStream('./stdout.log');
const errorOutput = fs.createWriteStream('./stderr.log');
// Custom simple logger
const logger = new Console({ stdout: output, stderr: errorOutput });
// use it like console
const count = 5;
logger.log('count: %d', count);
// In stdout.log: count 5
```

La global `console` è una speciale `Console` il cui output è inviato a [`process.stdout`][] e [`process.stderr`][]. E' come chiamare:

```js
new Console({ stdout: process.stdout, stderr: process.stderr });
```

### `console.assert(value[, ...message])`
<!-- YAML
added: v0.1.101
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17706
    description: The implementation is now spec compliant and does not throw
                 anymore.
-->

* `value` {any} Il valore testato per essere veritiero.
* `...message` {any} Tutti gli argomenti oltre a `value` vengono utilizzati come error message.

Un semplice assertion test che verifica se `value` è veritiero. If it is not, `Assertion failed` is logged. If provided, the error `message` is formatted using [`util.format()`][] by passing along all message arguments. The output is used as the error message.

```js
console.assert(true, 'does nothing');
// OK
console.assert(false, 'Whoops %s work', 'didn\'t');
// Assertion failed: Whoops didn't work
```

Calling `console.assert()` with a falsy assertion will only cause the `message` to be printed to the console without interrupting execution of subsequent code.

### `console.clear()`
<!-- YAML
added: v8.3.0
-->

Quando `stdout` è un TTY, con la chiamata di `console.clear()` si tenterà di cancellare il TTY. Quando `stdout` non è un TTY, questo metodo non fa nulla.

The specific operation of `console.clear()` can vary across operating systems and terminal types. Per la maggior parte dei sistemi operativi Linux, `console.clear()` funziona in modo simile al comando `clear` di shell. Su Windows, `console.clear()` cancella solo l'output nella corrente finestra del terminale per il binario di Node.js.

### `console.count([label])`
<!-- YAML
added: v8.3.0
-->

* `label` {string} L'etichetta del display per il counter. **Default:** `'default'`.

Mantiene un counter interno specifico per `label` e restituisce a `stdout` il numero di volte in cui `console.count()` è stato chiamato con il `label` fornito.
```js
> console.count()
default: 1
undefined
> console.count('default')
default: 2
undefined
> console.count('abc')
abc: 1
undefined
> console.count('xyz')
xyz: 1
undefined
> console.count('abc')
abc: 2
undefined
> console.count()
default: 3
undefined
>
```

### `console.countReset([label])`<!-- YAML
added: v8.3.0
-->* `label` {string} L'etichetta del display per il counter. **Default:** `'default'`.

Reimposta il counter interno specifico per `label`.
```js
> console.count('abc');
abc: 1
undefined
> console.countReset('abc');
undefined
> console.count('abc');
abc: 1
undefined
>
```

### `console.debug(data[, ...args])`<!-- YAML
added: v8.0.0
changes:
  - version: v8.10.0
    pr-url: https://github.com/nodejs/node/pull/17033
    description: "`console.debug` is now an alias for `console.log`."
-->* `data` {any}
* `...args` {any}

La funzione `console.debug()` è un alias di [`console.log()`][].

### `console.dir(obj[, options])`<!-- YAML
added: v0.1.101
-->* `obj` {any}
* `options` {Object}
  * `showHidden` {boolean} If `true` then the object's non-enumerable and symbol properties will be shown too. **Default:** `false`.
  * `depth` {number} Tells [`util.inspect()`][] how many times to recurse while formatting the object. This is useful for inspecting large complicated objects. Per farlo ripetere indefinitamente, passa `null`. **Default:** `2`.
  * `colors` {boolean} If `true`, then the output will be styled with ANSI color codes. Colors are customizable; see [customizing `util.inspect()` colors][]. **Default:** `false`.

Utilizza [`util.inspect()`][] su `obj` e stampa la stringa risultante su `stdout`. Questa funzione ignora qualsiasi funzione personalizzata `inspect()` definita su `obj`.

### `console.dirxml(...data)`<!-- YAML
added: v8.0.0
changes:
  - version: v9.3.0
    pr-url: https://github.com/nodejs/node/pull/17152
    description: "`console.dirxml` now calls `console.log` for its arguments."
-->* `...data` {any}

Questo metodo chiama `console.log()` passandogli gli argomenti ricevuti. This method does not produce any XML formatting.

### `console.error([data][, ...args])`<!-- YAML
added: v0.1.100
-->* `data` {any}
* `...args` {any}

Stampa una nuova riga (newline) su `stderr`. È possibile passare più argomenti, usando il primo come messaggio principale e tutti gli altri come valori di sostituzione simili a printf(3) (gli argomenti vengono passati tutti ad [`util.format()`][]).

```js
const code = 5;
console.error('error #%d', code);
// Stampa: error #5, a stderr
console.error('error', code);
// Stampa: error 5, a stderr
```

Se gli elementi di formattazione (ad esempio `%d`) non vengono trovati nella prima stringa, allora viene chiamato [`util.inspect()`][] su ogni argomento e i valori risultanti della stringa vengono concatenati. Vedi [`util.format()`][] per maggiori informazioni.

### `console.group([...label])`<!-- YAML
added: v8.5.0
-->* `...label` {any}

Aumenta l'indentazione delle righe successive di due spazi.

If one or more `label`s are provided, those are printed first without the additional indentation.

### `console.groupCollapsed()`<!-- YAML
  added: v8.5.0
-->An alias for [`console.group()`][].

### `console.groupEnd()`
<!-- YAML
added: v8.5.0
-->

Decreases indentation of subsequent lines by two spaces.

### `console.info([data][, ...args])`<!-- YAML
added: v0.1.100
-->* `data` {any}
* `...args` {any}

La funzione `console.info()` è un alias di [`console.log()`][].

### `console.log([data][, ...args])`<!-- YAML
added: v0.1.100
-->* `data` {any}
* `...args` {any}

Stampa una nuova riga (newline) su `stdout`. È possibile passare più argomenti, usando il primo come messaggio principale e tutti gli altri come valori di sostituzione simili a printf(3) (gli argomenti vengono passati tutti ad [`util.format()`][]).

```js
const count = 5;
console.log('count: %d', count);
// Stampa: count: 5, a stdout
console.log('count:', count);
// Stampa: count: 5, a stdout
```

Vedi [`util.format()`][] per maggiori informazioni.

### `console.table(tabularData[, properties])`<!-- YAML
added: v10.0.0
-->* `tabularData` {any}
* `properties` {string[]} Alternate properties for constructing the table.

Try to construct a table with the columns of the properties of `tabularData` (or use `properties`) and rows of `tabularData` and log it. Falls back to just logging the argument if it can’t be parsed as tabular.

```js
// Questi non possono essere analizzati tramite il parsing come dati della tabella
console.table(Symbol());
// Symbol()

console.table(undefined);
// undefined

console.table([{ a: 1, b: 'Y' }, { a: 'Z', b: 2 }]);
// ┌─────────┬─────┬─────┐
// │ (index) │  a  │  b  │
// ├─────────┼─────┼─────┤
// │    0    │  1  │ 'Y' │
// │    1    │ 'Z' │  2  │
// └─────────┴─────┴─────┘

console.table([{ a: 1, b: 'Y' }, { a: 'Z', b: 2 }], ['a']);
// ┌─────────┬─────┐
// │ (index) │  a  │
// ├─────────┼─────┤
// │    0    │  1  │
// │    1    │ 'Z' │
// └─────────┴─────┘
```

### `console.time([label])`<!-- YAML
added: v0.1.104
-->* `label` {string} **Default:** `'default'`

Avvia un timer che può essere utilizzato per calcolare la durata di un'operazione. I timer sono identificati da una `label` specifica. Use the same `label` when calling [`console.timeEnd()`][] to stop the timer and output the elapsed time in milliseconds to `stdout`. Le misure del timer sono precise al millisecondo.

### `console.timeEnd([label])`<!-- YAML
added: v0.1.104
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5901
    description: This method no longer supports multiple calls that don’t map
                 to individual `console.time()` calls; see below for details.
-->* `label` {string} **Default:** `'default'`

Arresta un timer precedentemente avviato chiamando [`console.time()`][] e stampa il risultato su `stdout`:

```js
console.time('100-elements');
for (let i = 0; i < 100; i++) {}
console.timeEnd('100-elements');
// stampa 100-elements: 225.438ms
```

### `console.timeLog([label][, ...data])`<!-- YAML
added: v10.7.0
-->* `label` {string} **Default:** `'default'`
* `...data` {any}

For a timer that was previously started by calling [`console.time()`][], prints the elapsed time and other `data` arguments to `stdout`:

```js
console.time('process');
const value = expensiveProcess1(); // Returns 42
console.timeLog('process', value);
// Prints "process: 365.227ms 42".
doExpensiveProcess2(value);
console.timeEnd('process');
```

### `console.trace([message][, ...args])`<!-- YAML
added: v0.1.104
-->* `message` {any}
* `...args` {any}

Prints to `stderr` the string `'Trace: '`, followed by the [`util.format()`][] formatted message and stack trace to the current position in the code.

```js
console.trace('Show me');
// Stampa: (lo stack trace varierà in base a dove viene chiamata la trace)
//  Trace: Show me
//    at repl:2:9
//    at REPLServer.defaultEval (repl.js:248:27)
//    at bound (domain.js:287:14)
//    at REPLServer.runBound [as eval] (domain.js:300:12)
//    at REPLServer.<anonymous> (repl.js:412:12)
//    at emitOne (events.js:82:20)
//    at REPLServer.emit (events.js:169:7)
//    at REPLServer.Interface._onLine (readline.js:210:10)
//    at REPLServer.Interface._line (readline.js:549:8)
//    at REPLServer.Interface._ttyWrite (readline.js:826:14)
```

### `console.warn([data][, ...args])`<!-- YAML
added: v0.1.100
-->* `data` {any}
* `...args` {any}

La funzione `console.warn()` è un alias di [`console.error()`][].

## Metodi solo per l'Inspector
The following methods are exposed by the V8 engine in the general API but do not display anything unless used in conjunction with the [inspector](debugger.html) (`--inspect` flag).

### `console.profile([label])`<!-- YAML
added: v8.0.0
-->* `label` {string}

Questo metodo non mostra nulla se non viene utilizzato nell'inspector. The `console.profile()` method starts a JavaScript CPU profile with an optional label until [`console.profileEnd()`][] is called. The profile is then added to the **Profile** panel of the inspector.

```js
console.profile('MyLabel');
// Some code
console.profileEnd('MyLabel');
// Adds the profile 'MyLabel' to the Profiles panel of the inspector.
```

### `console.profileEnd([label])`<!-- YAML
added: v8.0.0
-->* `label` {string}

Questo metodo non mostra nulla se non viene utilizzato nell'inspector. Stops the current JavaScript CPU profiling session if one has been started and prints the report to the **Profiles** panel of the inspector. See [`console.profile()`][] for an example.

If this method is called without a label, the most recently started profile is stopped.

### `console.timeStamp([label])`
<!-- YAML
added: v8.0.0
-->

* `label` {string}

Questo metodo non mostra nulla se non viene utilizzato nell'inspector. The `console.timeStamp()` method adds an event with the label `'label'` to the **Timeline** panel of the inspector.
