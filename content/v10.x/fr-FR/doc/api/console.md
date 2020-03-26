# Console

<!--introduced_in=v0.10.13-->

> Stabilité: 2 - stable

The `console` module provides a simple debugging console that is similar to the JavaScript console mechanism provided by web browsers.

Le module exporte deux composants spécifiques :

* A `Console` class with methods such as `console.log()`, `console.error()` and `console.warn()` that can be used to write to any Node.js stream.
* A global `console` instance configured to write to [`process.stdout`][] and [`process.stderr`][]. The global `console` can be used without calling `require('console')`.

***Warning***: The global console object's methods are neither consistently synchronous like the browser APIs they resemble, nor are they consistently asynchronous like all other Node.js streams. See the [note on process I/O](process.html#process_a_note_on_process_i_o) for more information.

Exemple d’utilisation de l'instance globale `console` :

```js
console.log('hello world');
// Prints: hello world, to stdout
console.log('hello %s', 'world');
// Prints: hello world, to stdout
console.error(new Error('Whoops, something bad happened'));
// Prints: [Error: Whoops, something bad happened], to stderr

const name = 'Will Robinson';
console.warn(`Danger ${name}! Danger!`);
// Prints: Danger Will Robinson! Danger!, to stderr
```

Exemple d’utilisation de la classe `Console` :

```js
const out = getStreamSomehow();
const err = getStreamSomehow();
const myConsole = new console.Console(out, err);

myConsole.log('hello world');
// Prints: hello world, to out
myConsole.log('hello %s', 'world');
// Prints: hello world, to out
myConsole.error(new Error('Whoops, something bad happened'));
// Prints: [Error: Whoops, something bad happened], to err

const name = 'Will Robinson';
myConsole.warn(`Danger ${name}! Danger!`);
// Prints: Danger Will Robinson! Danger!, to err
```

## Classe : Console

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

### new Console(stdout\[, stderr\]\[, ignoreErrors\])

### new Console(options)

<!-- YAML
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/9744
    description: The `ignoreErrors` option was introduced.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19372
    description: The `Console` constructor now supports an `options` argument,
                 and the `colorMode` option was introduced.
-->

* `options` {Object} 
  * `stdout` {stream.Writable}
  * `stderr` {stream.Writable}
  * `ignoreErrors` {boolean} Ignore errors when writing to the underlying streams. **Par défaut :** `true`.
  * `colorMode` {boolean|string} Définit la prise en charge des couleurs pour cette instance de `Console`. Setting to `true` enables coloring while inspecting values, setting to `'auto'` will make color support depend on the value of the `isTTY` property and the value returned by `getColorDepth()` on the respective stream. **Par défaut :** `'auto'`.

Crée une nouvelle `Console` avec une ou deux instances de flux accessibles en écriture. `stdout` is a writable stream to print log or info output. `stderr` is used for warning or error output. Si `stderr` n’est pas fourni, `stdout` est utilisé en tant que `stderr`.

```js
const output = fs.createWriteStream('./stdout.log');
const errorOutput = fs.createWriteStream('./stderr.log');
// custom simple logger
const logger = new Console({ stdout: output, stderr: errorOutput });
// use it like console
const count = 5;
logger.log('count: %d', count);
// in stdout.log: count 5
```

The global `console` is a special `Console` whose output is sent to [`process.stdout`][] and [`process.stderr`][]. Cela équivaut à l’appel :

```js
new Console({ stdout: process.stdout, stderr: process.stderr });
```

### console.assert(value[, ...message])

<!-- YAML
added: v0.1.101
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17706
    description: The implementation is now spec compliant and does not throw
                 anymore.
-->

* `value` {any} La valeur testée comme étant vraie.
* `...message` {any} Tous les arguments en plus de `valeur` sont utilisés comme message d’erreur.

Un simple test d'assertion qui vérifie si la `valeur` est effectivement vraie. If it is not, `Assertion failed` is logged. If provided, the error `message` is formatted using [`util.format()`][] by passing along all message arguments. The output is used as the error message.

```js
console.assert(true, 'does nothing');
// OK
console.assert(false, 'Whoops %s work', 'didn\'t');
// Assertion failed: Whoops didn't work
```

Calling `console.assert()` with a falsy assertion will only cause the `message` to be printed to the console without interrupting execution of subsequent code.

### console.clear()

<!-- YAML
added: v8.3.0
-->

When `stdout` is a TTY, calling `console.clear()` will attempt to clear the TTY. Lorsque `stdout` n’est pas un terminal, cette méthode ne fait rien.

The specific operation of `console.clear()` can vary across operating systems and terminal types. For most Linux operating systems, `console.clear()` operates similarly to the `clear` shell command. On Windows, `console.clear()` will clear only the output in the current terminal viewport for the Node.js binary.

### console.count([label])

<!-- YAML
added: v8.3.0
-->

* `label` {string} le libellé d’affichage pour le compteur. **Par défaut :** `'default'`.

Maintains an internal counter specific to `label` and outputs to `stdout` the number of times `console.count()` has been called with the given `label`.

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

### console.countReset([label])<!-- YAML
added: v8.3.0
-->

* `label` {string} le libellé d’affichage pour le compteur. **Par défaut :** `'default'`.

Réinitialise le compteur interne spécifique à `label`.

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

### console.debug(data[, ...args])<!-- YAML
added: v8.0.0
changes:

  - version: v9.3.0
    pr-url: https://github.com/nodejs/node/pull/17033
    description: "`console.debug` is now an alias for `console.log`."
-->

* `data` {any}
* `...args` {any}

La fonction `console.debug()` est un alias de [`console.log()`][].

### console.dir(obj[, options])<!-- YAML
added: v0.1.101
-->

* `obj` {any}

* `options` {Object}
  
  * `showHidden` {boolean} If `true` then the object's non-enumerable and symbol properties will be shown too. **Par défaut :** `false`.
  * `depth` {number} Tells [`util.inspect()`][] how many times to recurse while formatting the object. This is useful for inspecting large complicated objects. `null` supprime la limite du nombre de récursions. **Par défaut :** `2`.
  * `colors` {boolean} If `true`, then the output will be styled with ANSI color codes. Colors are customizable; see [customizing `util.inspect()` colors][]. **Par défaut :** `false`.

Utilise [`util.inspect()`][] sur `obj` et écrit la chaîne de retour dans `stdout`. Cette fonction contourne toute fonction personnalisée `inspect()` définie sur `obj`.

### console.dirxml(...data)<!-- YAML
added: v8.0.0
changes:

  - version: v9.3.0
    pr-url: https://github.com/nodejs/node/pull/17152
    description: "`console.dirxml` now calls `console.log` for its arguments."
-->

* `...data` {any}

Cette méthode appelle `console.log()` en lui passant les arguments reçus. Notez que cette méthode ne produit aucun formatage XML.

### console.error(\[data\]\[, ...args\])<!-- YAML
added: v0.1.100
-->

* `data` {any}

* `...args` {any}

Écrit dans `stderr` avec une nouvelle ligne. Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values similar to printf(3) (the arguments are all passed to [`util.format()`][]).

```js
const code = 5;
console.error('error #%d', code);
// Prints: error #5, to stderr
console.error('error', code);
// Prints: error 5, to stderr
```

If formatting elements (e.g. `%d`) are not found in the first string then [`util.inspect()`][] is called on each argument and the resulting string values are concatenated. Voir [`util.format()`][] pour plus d’informations.

### console.group([...label])<!-- YAML
added: v8.5.0
-->

* `...label` {any}

Augmente l'indentation des lignes suivantes de deux espaces.

If one or more `label`s are provided, those are printed first without the additional indentation.

### console.groupCollapsed()<!-- YAML
  added: v8.5.0
-->An alias for [

`console.group()`][].

### console.groupEnd()

<!-- YAML
added: v8.5.0
-->

Decreases indentation of subsequent lines by two spaces.

### console.info(\[data\]\[, ...args\])<!-- YAML
added: v0.1.100
-->

* `data` {any}

* `...args` {any}

The `console.info()` function is an alias for [`console.log()`][].

### console.log(\[data\]\[, ...args\])<!-- YAML
added: v0.1.100
-->

* `data` {any}

* `...args` {any}

Prints to `stdout` with newline. Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values similar to printf(3) (the arguments are all passed to [`util.format()`][]).

```js
const count = 5;
console.log('count: %d', count);
// Prints: count: 5, to stdout
console.log('count:', count);
// Prints: count: 5, to stdout
```

See [`util.format()`][] for more information.

### console.table(tabularData[, properties])<!-- YAML
added: v10.0.0
-->

* `tabularData` {any}

* `properties` {string[]} Alternate properties for constructing the table.

Try to construct a table with the columns of the properties of `tabularData` (or use `properties`) and rows of `tabularData` and log it. Falls back to just logging the argument if it can’t be parsed as tabular.

```js
// These can't be parsed as tabular data
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

### console.time([label])<!-- YAML
added: v0.1.104
-->

* `label` {string} **Par défaut :** `'default'`

Starts a timer that can be used to compute the duration of an operation. Timers are identified by a unique `label`. Use the same `label` when calling [`console.timeEnd()`][] to stop the timer and output the elapsed time in milliseconds to `stdout`. Timer durations are accurate to the sub-millisecond.

### console.timeEnd([label])<!-- YAML
added: v0.1.104
changes:

  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5901
    description: This method no longer supports multiple calls that don’t map
                 to individual `console.time()` calls; see below for details.
-->

* `label` {string} **Par défaut :** `'default'`

Stops a timer that was previously started by calling [`console.time()`][] and prints the result to `stdout`:

```js
console.time('100-elements');
for (let i = 0; i < 100; i++) {}
console.timeEnd('100-elements');
// prints 100-elements: 225.438ms
```

### console.timeLog(\[label\]\[, ...data\])<!-- YAML
added: v10.7.0
-->

* `label` {string} **Par défaut :** `'default'`

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

### console.trace(\[message\]\[, ...args\])<!-- YAML
added: v0.1.104
-->

* `message` {any}

* `...args` {any}

Prints to `stderr` the string `'Trace: '`, followed by the [`util.format()`][] formatted message and stack trace to the current position in the code.

```js
console.trace('Show me');
// Prints: (stack trace will vary based on where trace is called)
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

### console.warn(\[data\]\[, ...args\])<!-- YAML
added: v0.1.100
-->

* `data` {any}

* `...args` {any}

The `console.warn()` function is an alias for [`console.error()`][].

## Méthodes spécifiques à l'inspecteur

The following methods are exposed by the V8 engine in the general API but do not display anything unless used in conjunction with the [inspector](debugger.html) (`--inspect` flag).

### console.markTimeline([label])<!-- YAML
added: v8.0.0
-->

* `label` {string} **Par défaut :** `'default'`

Cette méthode n'affiche rien à moins d'être utilisée dans l'inspecteur. The `console.markTimeline()` method is the deprecated form of [`console.timeStamp()`][].

### console.profile([label])<!-- YAML
added: v8.0.0
-->

* `label` {string}

Cette méthode n'affiche rien à moins d'être utilisée dans l'inspecteur. The `console.profile()` method starts a JavaScript CPU profile with an optional label until [`console.profileEnd()`][] is called. The profile is then added to the **Profile** panel of the inspector.

```js
console.profile('MyLabel');
// Some code
console.profileEnd('MyLabel');
// Adds the profile 'MyLabel' to the Profiles panel of the inspector.
```

### console.profileEnd([label])

<!-- YAML
added: v8.0.0
-->

* `label` {string}

Cette méthode n'affiche rien à moins d'être utilisée dans l'inspecteur. Stops the current JavaScript CPU profiling session if one has been started and prints the report to the **Profiles** panel of the inspector. See [`console.profile()`][] for an example.

If this method is called without a label, the most recently started profile is stopped.

### console.timeStamp([label])

<!-- YAML
added: v8.0.0
-->

* `label` {string}

Cette méthode n'affiche rien à moins d'être utilisée dans l'inspecteur. The `console.timeStamp()` method adds an event with the label `'label'` to the **Timeline** panel of the inspector.

### console.timeline([label])

<!-- YAML
added: v8.0.0
-->

* `label` {string} **Par défaut :** `'default'`

Cette méthode n'affiche rien à moins d'être utilisée dans l'inspecteur. The `console.timeline()` method is the deprecated form of [`console.time()`][].

### console.timelineEnd([label])

<!-- YAML
added: v8.0.0
-->

* `label` {string} **Par défaut :** `'default'`

Cette méthode n'affiche rien à moins d'être utilisée dans l'inspecteur. The `console.timelineEnd()` method is the deprecated form of [`console.timeEnd()`][].