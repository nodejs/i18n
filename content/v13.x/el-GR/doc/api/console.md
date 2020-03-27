# Κονσόλα

<!--introduced_in=v0.10.13-->

> Σταθερότητα: 2 - Σταθερό

Η ενότητα `console` παρέχει μια απλή κονσόλα αποσφαλμάτωσης που είναι παρόμοια με τον μηχανισμό κονσόλας της JavaScript που παρέχεται από τους περιηγητές.

Η ενότητα εξάγει δύο συγκεκριμένα μέρη:

* Μια κλάση `Console` με μεθόδους όπως τα `console.log()`, `console.error()` και `console.warn()` που μπορούν να χρησιμοποιηθούν για να γράψουν σε οποιαδήποτε ροή της Node.js.
* Ένα καθολικό στιγμιότυπο του `console` που έχει ρυθμιστεί για να γράφει στα [`process.stdout`][] και [`process.stderr`][]. Το καθολικό `console` μπορεί να χρησιμοποιείται και χωρίς να γίνει κλήση του `require('console')`.

***Warning***: The global console object's methods are neither consistently synchronous like the browser APIs they resemble, nor are they consistently asynchronous like all other Node.js streams. Δείτε την [σημείωση για το I/O των διαδικασιών](process.html#process_a_note_on_process_i_o) για περισσότερες πληροφορίες.

Παράδειγμα χρήσης του καθολικού `console`:

```js
console.log('hello world');
// Τυπώνει: hello world, στο stdout
console.log('hello %s', 'world');
// Τυπώνει: hello world, στο stdout
console.error(new Error('Whoops, something bad happened'));
// Τυπώνει: [Error: Whoops, something bad happened], στο stderr

const name = 'Will Robinson';
console.warn(`Danger ${name}! Danger!`);
// Τυπώνει: Danger Will Robinson! Danger!, στο stderr
```

Παράδειγμα χρησιμοποιώντας την κλάση `Console`:

```js
const out = getStreamSomehow();
const err = getStreamSomehow();
const myConsole = new console.Console(out, err);

myConsole.log('hello world');
// Τυπώνει: hello world, στο out
myConsole.log('hello %s', 'world');
// Τυπώνει: hello world, στο out
myConsole.error(new Error('Whoops, something bad happened'));
// Τυπώνει [Error: Whoops, something bad happened], στο err

const name = 'Will Robinson';
myConsole.warn(`Danger ${name}! Danger!`);
// Τυπώνει: Danger Will Robinson! Danger!, στο err
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
  * `colorMode` {boolean|string} Ορίζει την υποστήριξη χρωμάτων για αυτό το στιγμιότυπο `Console`. Setting to `true` enables coloring while inspecting values. Setting to `false` disables coloring while inspecting values. Setting to `'auto'` makes color support depend on the value of the `isTTY` property and the value returned by `getColorDepth()` on the respective stream. This option can not be used, if `inspectOptions.colors` is set as well. **Default:** `'auto'`.
  * `inspectOptions` {Object} Specifies options that are passed along to [`util.inspect()`][].

Δημιουργεί ένα νέο `Console` με μια ή δύο εγγράψιμες ροές. Το `stdout` είναι μια εγγράψιμη ροή που τυπώνει την έξοδο καταγραφής ή πληροφοριών. Το `stderr` χρησιμοποιείται για έξοδο προειδοποιήσεων ή σφαλμάτων. Αν δεν παρέχεται έξοδος `stderr`, τότε χρησιμοποιείται η έξοδος `stdout` και για το `stderr`.

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

Το καθολικό `console` είναι ένα ειδικό στιγμιότυπο `Console` του οποίου η έξοδος γίνεται στο [`process.stdout`][] και στο [`process.stderr`][]. Είναι ισοδύναμο της παρακάτω κλήσης:

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

* `value` {any} Οποιαδήποτε τιμή που είναι πιθανώς αληθής.
* `...message` {any} Όλες οι παράμετροι, εκτός από το `value`, χρησιμοποιούνται ως μήνυμα σφάλματος.

Ένας απλός έλεγχος ισχυρισμού για το αν το `value` είναι αληθές. If it is not, `Assertion failed` is logged. If provided, the error `message` is formatted using [`util.format()`][] by passing along all message arguments. The output is used as the error message.

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

Όταν το `stdout` είναι ένα TTY, η κλήση του `console.clear()` θα προσπαθήσει να εκκαθαρίσει ολόκληρο το TTY. Όταν το `stdout` δεν είναι ένα TTY, αυτή η μέθοδος δεν κάνει τίποτα.

The specific operation of `console.clear()` can vary across operating systems and terminal types. Για τις περισσότερες διανομές Linux, το `console.clear()` λειτουργεί παρόμοια με την κλήση της εντολής κελύφους `clear`. Στα Windows, το `console.clear()` θα εκκαθαρίσει μόνο την έξοδο της τρέχουσας προβολής τερματικού του Node.js.

### `console.count([label])`
<!-- YAML
added: v8.3.0
-->

* `label` {string} Η ετικέτα προβολής για τον μετρητή. **Default:** `'default'`.

Διατηρεί έναν εσωτερικό μετρητή ειδικά για το `label` και τυπώνει στο `stdout` πόσες φορές κλήθηκε το `console.count()` με το συγκεκριμένο `label`.
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
-->* `label` {string} Η ετικέτα προβολής για τον μετρητή. **Default:** `'default'`.

Μηδενίζει τον εσωτερικό μετρητή του `label`.
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

Η συνάρτηση `console.debug()` είναι ένα ψευδώνυμο για το [`console.log()`][].

### `console.dir(obj[, options])`<!-- YAML
added: v0.1.101
-->* `obj` {any}
* `options` {Object}
  * `showHidden` {boolean} If `true` then the object's non-enumerable and symbol properties will be shown too. **Default:** `false`.
  * `depth` {number} Tells [`util.inspect()`][] how many times to recurse while formatting the object. This is useful for inspecting large complicated objects. Για να γίνεται επ'αόριστον, χρησιμοποιήστε την τιμή `null`. **Default:** `2`.
  * `colors` {boolean} If `true`, then the output will be styled with ANSI color codes. Colors are customizable; see [customizing `util.inspect()` colors][]. **Default:** `false`.

Χρησιμοποιεί το [`util.inspect()`][] στο `obj` και τυπώνει το string του αποτελέσματος στο `stdout`. Αυτή η συνάρτηση αγνοεί οποιαδήποτε προσαρμοσμένη συνάρτηση `inspect()` έχει οριστεί στο `obj`.

### `console.dirxml(...data)`<!-- YAML
added: v8.0.0
changes:
  - version: v9.3.0
    pr-url: https://github.com/nodejs/node/pull/17152
    description: "`console.dirxml` now calls `console.log` for its arguments."
-->* `...data` {any}

Αυτή η μέθοδος καλεί το `console.log()` και μεταδίδει τις παραμέτρους που έλαβε. This method does not produce any XML formatting.

### `console.error([data][, ...args])`<!-- YAML
added: v0.1.100
-->* `data` {any}
* `...args` {any}

Τυπώνει στο `stderr` με χαρακτήρα αλλαγής γραμμής. Μπορούν να μεταδοθούν πολλαπλές παράμετροι, με την πρώτη να χρησιμοποιείται ως το κυρίως μήνυμα, και οι υπόλοιπες ως αντικαταστάτες, όπως στο printf(3) (όλες οι παράμετροι μεταφέρονται στο [`util.format()`][]).

```js
const code = 5;
console.error('error #%d', code);
// Τυπώνει: error #5, to stderr
console.error('error', code);
// Τυπώνει: error 5, to stderr
```

Αν δε βρεθούν στοιχεία μορφοποίησης (π.χ. `%d`) στο πρώτο string, τότε καλείται το [`util.inspect()`][] σε κάθε παράμετρο, και οι τιμές των αποτελεσμάτων συνενώνονται. Δείτε το [`util.format()`][] για περισσότερες πληροφορίες.

### `console.group([...label])`<!-- YAML
added: v8.5.0
-->* `...label` {any}

Αυξάνει την εσοχή των γραμμών που ακολουθούν, κατά δύο διαστήματα.

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

Η συνάρτηση `console.info()` είναι ένα ψευδώνυμο για την συνάρτηση [`console.log()`][].

### `console.log([data][, ...args])`<!-- YAML
added: v0.1.100
-->* `data` {any}
* `...args` {any}

Τυπώνει στο `stdout` με χαρακτήρα αλλαγής γραμμής. Μπορούν να μεταδοθούν πολλαπλές παράμετροι, με την πρώτη να χρησιμοποιείται ως το κυρίως μήνυμα, και οι υπόλοιπες ως αντικαταστάτες, όπως στο printf(3) (όλες οι παράμετροι μεταφέρονται στο [`util.format()`][]).

```js
const count = 5;
console.log('count: %d', count);
// Τυπώνει: count: 5, στο stdout
console.log('count:', count);
// Τυπώνει: count: 5, στο stdout
```

Δείτε το [`util.format()`][] για περισσότερες πληροφορίες.

### `console.table(tabularData[, properties])`<!-- YAML
added: v10.0.0
-->* `tabularData` {any}
* `properties` {string[]} Alternate properties for constructing the table.

Try to construct a table with the columns of the properties of `tabularData` (or use `properties`) and rows of `tabularData` and log it. Falls back to just logging the argument if it can’t be parsed as tabular.

```js
// Αυτά δε μπορούν να μετατραπούν σε πίνακα
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

Δημιουργεί ένα χρονόμετρο που μπορεί να χρησιμοποιηθεί για τη μέτρηση της διάρκειας μιας λειτουργίας. Τα χρονόμετρα αναγνωρίζονται από ένα μοναδικό `label`. Use the same `label` when calling [`console.timeEnd()`][] to stop the timer and output the elapsed time in milliseconds to `stdout`. Η ακρίβεια της διάρκειας του χρονομέτρου είναι μεγαλύτερη από χιλιοστό του δευτερολέπτου.

### `console.timeEnd([label])`<!-- YAML
added: v0.1.104
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5901
    description: This method no longer supports multiple calls that don’t map
                 to individual `console.time()` calls; see below for details.
-->* `label` {string} **Default:** `'default'`

Σταματάει το χρονόμετρο που είχε εκκινηθεί με την κλήση του [`console.time()`][] και τυπώνει το αποτέλεσμα στην έξοδο `stdout`:

```js
console.time('100-elements');
for (let i = 0; i < 100; i++) {}
console.timeEnd('100-elements');
// Τυπώνει 100-elements: 225.438ms
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
// Τυπώνει: (stack trace will vary based on where trace is called)
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

Η συνάρτηση `console.warn()` είναι ένα ψευδώνυμο για την συνάρτηση [`console.error()`][].

## Αποκλειστικές μέθοδοι του Επιθεωρητή
The following methods are exposed by the V8 engine in the general API but do not display anything unless used in conjunction with the [inspector](debugger.html) (`--inspect` flag).

### `console.profile([label])`<!-- YAML
added: v8.0.0
-->* `label` {string}

Αυτή η μέθοδος δεν εμφανίζει κάτι, εκτός αν χρησιμοποιείται στον επιθεωρητή. The `console.profile()` method starts a JavaScript CPU profile with an optional label until [`console.profileEnd()`][] is called. The profile is then added to the **Profile** panel of the inspector.

```js
console.profile('MyLabel');
// Some code
console.profileEnd('MyLabel');
// Adds the profile 'MyLabel' to the Profiles panel of the inspector.
```

### `console.profileEnd([label])`<!-- YAML
added: v8.0.0
-->* `label` {string}

Αυτή η μέθοδος δεν εμφανίζει κάτι, εκτός αν χρησιμοποιείται στον επιθεωρητή. Stops the current JavaScript CPU profiling session if one has been started and prints the report to the **Profiles** panel of the inspector. See [`console.profile()`][] for an example.

If this method is called without a label, the most recently started profile is stopped.

### `console.timeStamp([label])`
<!-- YAML
added: v8.0.0
-->

* `label` {string}

Αυτή η μέθοδος δεν εμφανίζει κάτι, εκτός αν χρησιμοποιείται στον επιθεωρητή. The `console.timeStamp()` method adds an event with the label `'label'` to the **Timeline** panel of the inspector.
