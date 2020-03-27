# Консоль

<!--introduced_in=v0.10.13-->

> Стабильность: 2 - Стабильно

Модуль `console` предоставляет простую консоль отладки, которая похожа на механизм консоли JavaScript, предоставляемый веб-браузерами.

Модуль экспортирует два конкретных компонента:

* Класс `Console` с такими методами, как `console.log()`, `console.error()` и `console.warn()`, которые могут быть использованы для записи в любой поток Node.js.
* Глобальный экземпляр `console`, настроенный для записи в [`process.stdout`][] и [`process.stderr`][]. Глобальная `console` может быть использована без вызова `require('console')`.

***Warning***: The global console object's methods are neither consistently synchronous like the browser APIs they resemble, nor are they consistently asynchronous like all other Node.js streams. Для более подробной информации смотрите [note on process I/O](process.html#process_a_note_on_process_i_o).

Пример использования глобальной `console`:

```js
console.log('hello world');
// Печатает: hello world на stdout
console.log('hello %s', 'world');
// Печатает: hello world на stdout
console.error(new Error('Whoops, something bad happened'));
// Печатает: [Error: Whoops, something bad happened] на stderr

const name = 'Will Robinson';
console.warn(`Danger ${name}! Опасность!`);
// Печатает: Опасность, Will Robinson! Опасность! на stderr
```

Пример использования класса `Console`:

```js
const out = getStreamSomehow();
const err = getStreamSomehow();
const myConsole = new console.Console(out, err);

myConsole.log('hello world');
// Печатает: hello world на out
myConsole.log('hello %s', 'world');
// Печатает: hello world на out
myConsole.error(new Error('Whoops, something bad happened'));
// Печатает: [Error: Whoops, something bad happened] на err

const name = 'Will Robinson';
myConsole.warn(`Danger ${name}! Опасность!`);
// Печатает: Опасность, Will Robinson! Опасность! на err
```

## Класс: Console
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
  * `ignoreErrors` {boolean} Ignore errors when writing to the underlying streams. **Default:** `true`.
  * `colorMode` {boolean|string} Set color support for this `Console` instance. Setting to `true` enables coloring while inspecting values, setting to `'auto'` will make color support depend on the value of the `isTTY` property and the value returned by `getColorDepth()` on the respective stream. **Default:** `'auto'`.

Создает новую `Console` с одним или двумя экземплярами, доступными для записи потоков. `stdout` - открытый для записи поток для печати вывода журнала или информации. `stderr` используется для вывода предупреждения или ошибки. Если `stderr` не указан, то `stdout` используется для `stderr`.

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

Глобальная `console` является специальной `Console`, вывод которой посылается в [`process.stdout`][] и [`process.stderr`][]. Это идентично вызову:

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
* `value` {any} The value tested for being truthy.
* `...message` {any} All arguments besides `value` are used as error message.

Простой тест подтверждения, который проверяет, является ли `value` истинным. If it is not, `Assertion failed` is logged. If provided, the error `message` is formatted using [`util.format()`][] by passing along all message arguments. The output is used as the error message.

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

Когда `stdout` является TTY, вызов `console.clear()` попытается очистить TTY. Когда `stdout` не является TTY, этот метод ничего не делает.

The specific operation of `console.clear()` can vary across operating systems and terminal types. Для большинства операционных систем Linux `console.clear()` работает аналогично команде оболочки `clear`. На Windows `console.clear()` будет удалять только выходные данные в текущем окне просмотра терминала для двоичного файла Node.js.

### console.count([label])
<!-- YAML
added: v8.3.0
-->

* `label` {string} Отображаемая метка для счетчика. **Default:** `'default'`.

Сохраняет определенный внутренний счетчик для `label` и выводит на `stdout` количество вызовов `console.count()` с заданным `label`.
```js
> console.count()
по умолчанию: 1
не определено
> console.count('default')
по умолчанию: 2
не определено
> console.count('abc')
abc: 1
не определено
> console.count('xyz')
xyz: 1
не определено
> console.count('abc')
abc: 2
не определено
> console.count()
по умолчанию: 3
не определено
>
```

### console.countReset([label])<!-- YAML
added: v8.3.0
-->* `label` {string} Отображаемая метка для счетчика. **Default:** `'default'`.

Сбрасывает определенный внутренний счетчик для `label`.
```js
> console.count('abc');
abc: 1
не определено
> console.countReset('abc');
не определено
> console.count('abc');
abc: 1
не определено
>
```

### console.debug(data[, ...args])<!-- YAML
added: v8.0.0
changes:
  - version: v9.3.0
    pr-url: https://github.com/nodejs/node/pull/17033
    description: "`console.debug` is now an alias for `console.log`."
-->* `data` {any}
* `...args` {any}

Функция `console.debug()` является псевдонимом для [`console.log()`][].

### console.dir(obj[, options])<!-- YAML
added: v0.1.101
-->* `obj` {any}
* `options` {Object}
  * `showHidden` {boolean} If `true` then the object's non-enumerable and symbol properties will be shown too. **По умолчанию:** `false`.
  * `depth` {number} Tells [`util.inspect()`][] how many times to recurse while formatting the object. This is useful for inspecting large complicated objects. Для бесконечной рекурсии необходимо передать `null`. **Default:** `2`.
  * `colors` {boolean} If `true`, then the output will be styled with ANSI color codes. Colors are customizable; see [customizing `util.inspect()` colors][]. **По умолчанию:** `false`.

Использует [`util.inspect()`][] в `obj` и печатает строку с результатом в `stdout`. Эта функция обходит любую пользовательскую функцию `inspect()`, которая определена в `obj`.

### console.dirxml(...data)<!-- YAML
added: v8.0.0
changes:
  - version: v9.3.0
    pr-url: https://github.com/nodejs/node/pull/17152
    description: "`console.dirxml` now calls `console.log` for its arguments."
-->* `...data` {any}

This method calls `console.log()` passing it the arguments received. Please note that this method does not produce any XML formatting.

### console.error(\[data\]\[, ...args\])<!-- YAML
added: v0.1.100
-->* `data` {any}
* `...args` {any}

Печатает `stderr` с новой строки. Можно передавать несколько аргументов, первый из которых используется в качестве основного сообщения, а все дополнительные - в качестве значений подстановки аналогично printf(3) (все аргументы передаются в [`util.format()`][]).

```js
const code = 5;
console.error('error #%d', code);
// Печатает: error #5, в stderr
console.error('error', code);
// Печатает: error 5, в stderr
```

Если элементы форматирования (например, `%d`) не найдены в первой строке, то в каждом аргументе вызывается [`util.inspect()`][], а значения строки результата объединяются. Для более подробной информации смотрите [`util.format()`][].

### console.group([...label])<!-- YAML
added: v8.5.0
-->* `...label` {any}

Increases indentation of subsequent lines by two spaces.

If one or more `label`s are provided, those are printed first without the additional indentation.

### console.groupCollapsed()<!-- YAML
  added: v8.5.0
-->An alias for [`console.group()`][].

### console.groupEnd()
<!-- YAML
added: v8.5.0
-->

Decreases indentation of subsequent lines by two spaces.

### console.info(\[data\]\[, ...args\])<!-- YAML
added: v0.1.100
-->* `data` {any}
* `...args` {any}

Функция `console.info()` является псевдонимом для [`console.log()`][].

### console.log(\[data\]\[, ...args\])<!-- YAML
added: v0.1.100
-->* `data` {any}
* `...args` {any}

Печатает в `stdout` с новой строки. Можно передавать несколько аргументов, первый из которых используется в качестве основного сообщения, а все дополнительные - в качестве значений подстановки аналогично printf(3) (все аргументы передаются в [`util.format()`][]).

```js
const count = 5;
console.log('count: %d', count);
// Печатает: count: 5, в stdout
console.log('count:', count);
// Печатает: count: 5, в stdout
```

Для более подробной информации смотрите [`util.format()`][].

### console.table(tabularData[, properties])<!-- YAML
added: v10.0.0
-->* `tabularData` {any}
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
-->* `label` {string} **Default:** `'default'`

Запускает таймер, который может быть использован для расчета продолжительности операции. Таймеры идентифицируются уникальным `label`. Use the same `label` when calling [`console.timeEnd()`][] to stop the timer and output the elapsed time in milliseconds to `stdout`. Показания таймера точны до миллисекунды.

### console.timeEnd([label])<!-- YAML
added: v0.1.104
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5901
    description: This method no longer supports multiple calls that don’t map
                 to individual `console.time()` calls; see below for details.
-->* `label` {string} **Default:** `'default'`

Останавливает ранее запущенный таймер вызовом [`console.time()`][] и печатает результат в `stdout`:

```js
console.time('100-elements');
for (let i = 0; i < 100; i++) {}
console.timeEnd('100-elements');
// prints 100-elements: 225.438ms
```

### console.timeLog(\[label\]\[, ...data\])<!-- YAML
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

### console.trace(\[message\]\[, ...args\])<!-- YAML
added: v0.1.104
-->* `message` {any}
* `...args` {any}

Prints to `stderr` the string `'Trace: '`, followed by the [`util.format()`][] formatted message and stack trace to the current position in the code.

```js
console.trace('Show me');
// Печатает: (трассировка стека будет меняться в зависимости от того, где она вызывается)
//  Трассировка: Show me
//    на repl:2:9
//    на REPLServer.defaultEval (repl.js:248:27)
//    на bound (domain.js:287:14)
//    на REPLServer.runBound [as eval] (domain.js:300:12)
//    на REPLServer.<anonymous> (repl.js:412:12)
//    на emitOne (events.js:82:20)
//    на REPLServer.emit (events.js:169:7)
//    на REPLServer.Interface._onLine (readline.js:210:10)
//    на REPLServer.Interface._line (readline.js:549:8)
//    на REPLServer.Interface._ttyWrite (readline.js:826:14)
```

### console.warn(\[data\]\[, ...args\])<!-- YAML
added: v0.1.100
-->* `data` {any}
* `...args` {any}

Функция `console.warn()` является псевдонимом для [`console.error()`][].

## Inspector only methods
The following methods are exposed by the V8 engine in the general API but do not display anything unless used in conjunction with the [inspector](debugger.html) (`--inspect` flag).

### console.markTimeline([label])<!-- YAML
added: v8.0.0
-->* `label` {string} **Default:** `'default'`

This method does not display anything unless used in the inspector. The `console.markTimeline()` method is the deprecated form of [`console.timeStamp()`][].

### console.profile([label])<!-- YAML
added: v8.0.0
-->* `label` {string}

This method does not display anything unless used in the inspector. The `console.profile()` method starts a JavaScript CPU profile with an optional label until [`console.profileEnd()`][] is called. The profile is then added to the **Profile** panel of the inspector.
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

This method does not display anything unless used in the inspector. Stops the current JavaScript CPU profiling session if one has been started and prints the report to the **Profiles** panel of the inspector. See [`console.profile()`][] for an example.

If this method is called without a label, the most recently started profile is stopped.

### console.timeStamp([label])
<!-- YAML
added: v8.0.0
-->
* `label` {string}

This method does not display anything unless used in the inspector. The `console.timeStamp()` method adds an event with the label `'label'` to the **Timeline** panel of the inspector.

### console.timeline([label])
<!-- YAML
added: v8.0.0
-->
* `label` {string} **Default:** `'default'`

This method does not display anything unless used in the inspector. The `console.timeline()` method is the deprecated form of [`console.time()`][].

### console.timelineEnd([label])
<!-- YAML
added: v8.0.0
-->
* `label` {string} **Default:** `'default'`

This method does not display anything unless used in the inspector. The `console.timelineEnd()` method is the deprecated form of [`console.timeEnd()`][].
