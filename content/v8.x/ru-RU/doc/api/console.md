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
                 will now be ignored.
-->

<!--type=class-->

The `Console` class can be used to create a simple logger with configurable output streams and can be accessed using either `require('console').Console` or `console.Console` (or their destructured counterparts):

```js
const { Console } = require('console');
```

```js
const { Console } = console;
```

### new Console(stdout[, stderr])
* `stdout` {stream.Writable}
* `stderr` {stream.Writable}

Создает новую `Console` с одним или двумя экземплярами, доступными для записи потоков. `stdout` - открытый для записи поток для печати вывода журнала или информации. `stderr` используется для вывода предупреждения или ошибки. Если `stderr` не указан, то `stdout` используется для `stderr`.

```js
const output = fs.createWriteStream('./stdout.log');
const errorOutput = fs.createWriteStream('./stderr.log');
// простой пользовательский logger
const logger = new Console(output, errorOutput);
// используйте это как консоль
const count = 5;
logger.log('count: %d', count);
// в stdout.log: count 5
```

Глобальная `console` является специальной `Console`, вывод которой посылается в [`process.stdout`][] и [`process.stderr`][]. Это идентично вызову:

```js
new Console(process.stdout, process.stderr);
```

### console.assert(value\[, message\]\[, ...args\])
<!-- YAML
added: v0.1.101
-->
* `value` {any}
* `message` {any}
* `...args` {any}

Простой тест подтверждения, который проверяет, является ли `value` истинным. Если нет, выдается `AssertionError`. Если предусмотрено, `сообщение` об ошибке форматируется с помощью [`util.format()`][] и используется как сообщение об ошибке.

```js
console.assert(true, 'does nothing');
// OK
console.assert(false, 'Whoops %s', 'didn\'t work');
// AssertionError: Упс! не сработало
```

*Note*: The `console.assert()` method is implemented differently in Node.js than the `console.assert()` method [available in browsers](https://developer.mozilla.org/en-US/docs/Web/API/console/assert).

Особенно в браузерах вызов `console.assert()` с ложным утверждением приведет к тому, что `сообщение` будет напечатано на консоли без прерывания выполнения следующего кода. Однако в Node.js ложное утверждение приведет к выводу `AssertionError`.

Функциональность, близкая к той, что реализована в браузерах, может быть реализована с помощью расширения `console` Node.js и переопределения метода `console.assert()`.

В следующем примере создается простой модуль, который расширяет и переопределяет поведение по умолчанию `console` в Node.js.
```js
'use strict';

// Создает простое расширение консоли с
// новым impl для утверждения без monkey-patching.
const myConsole = Object.create(console, {
  assert: {
    value: function assert(assertion, message, ...args) {
      try {
        console.assert(assertion, message, ...args);
      } catch (err) {
        console.error(err.stack);
      }
    },
    configurable: true,
    enumerable: true,
    writable: true,
  },
});

module.exports = myConsole;
```

Затем это можно использовать как прямую замену встроенной консоли:

```js
const console = require('./myConsole');
console.assert(false, 'это сообщение будет напечатано, но не будет выдана ошибка');
console.log('это тоже будет напечатано');
```

### console.clear()<!-- YAML
added: v8.3.0
-->Когда `stdout` является TTY, вызов `console.clear()` попытается очистить TTY. Когда `stdout` не является TTY, этот метод ничего не делает.

*Примечание*: Конкретная операция `console.clear()` может варьироваться в зависимости от операционных систем и типа терминалов. Для большинства операционных систем Linux `console.clear()` работает аналогично команде оболочки `clear`. На Windows `console.clear()` будет удалять только выходные данные в текущем окне просмотра терминала для двоичного файла Node.js.

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

### console.countReset([label='default'])
<!-- YAML
added: v8.3.0
-->

* `label` {string} Отображаемая метка для счетчика. **Default:** `'default'`.

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
  - version: v8.10.0
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

### console.groupEnd()<!-- YAML
added: v8.5.0
-->Decreases indentation of subsequent lines by two spaces.

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

### console.time(label)<!-- YAML
added: v0.1.104
-->* `label` {string}

Запускает таймер, который может быть использован для расчета продолжительности операции. Таймеры идентифицируются уникальным `label`. Use the same `label` when calling [`console.timeEnd()`][] to stop the timer and output the elapsed time in milliseconds to `stdout`. Показания таймера точны до миллисекунды.

### console.timeEnd(label)<!-- YAML
added: v0.1.104
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5901
    description: This method no longer supports multiple calls that don’t map
                 to individual `console.time()` calls; see below for details.
-->* `label` {string}

Останавливает ранее запущенный таймер вызовом [`console.time()`][] и печатает результат в `stdout`:

```js
console.time('100-elements');
for (let i = 0; i < 100; i++) {}
console.timeEnd('100-elements');
// prints 100-elements: 225.438ms
```

*Note*: As of Node.js v6.0.0, `console.timeEnd()` deletes the timer to avoid leaking it. В более старых версиях таймер сохранился. Это позволяло вызывать `console.timeEnd()` несколько раз для одной и той же метки. Эта функциональность была непреднамеренной и больше не поддерживается.

### console.trace(\[message\]\[, ...args\])<!-- YAML
added: v0.1.104
-->* `message` {any}
* `...args` {any}

Печатает в `stderr` строку `'Trace :'`, за которой следует отформатированное сообщение [`util.format()`][] и трассировка стека до текущей позиции в коде.

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

### console.dirxml(object)<!-- YAML
added: v8.0.0
-->* `object` {string}

This method does not display anything unless used in the inspector. The `console.dirxml()` method displays in `stdout` an XML interactive tree representation of the descendants of the specified `object` if possible, or the JavaScript representation if not. Calling `console.dirxml()` on an HTML or XML element is equivalent to calling `console.log()`.

### console.markTimeline(label)<!-- YAML
added: v8.0.0
-->* `label` {string} Defaults to `'default'`.

This method does not display anything unless used in the inspector. The `console.markTimeline()` method is the deprecated form of [`console.timeStamp()`][].

### console.profile([label])<!-- YAML
added: v8.0.0
-->* `label` {string}

This method does not display anything unless used in the inspector. The `console.profile()` method starts a JavaScript CPU profile with an optional label until [`console.profileEnd()`][] is called. The profile is then added to the **Profile** panel of the inspector.
```js
console.profile('MyLabel');
// Some code
console.profileEnd();
// Adds the profile 'MyLabel' to the Profiles panel of the inspector.
```

### console.profileEnd()
<!-- YAML
added: v8.0.0
-->
This method does not display anything unless used in the inspector. Stops the current JavaScript CPU profiling session if one has been started and prints the report to the **Profiles** panel of the inspector. See [`console.profile()`][] for an example.

### console.table(array[, columns])
<!-- YAML
added: v8.0.0
-->
* `массив` {Array|Object}
* `columns` {Array}

This method does not display anything unless used in the inspector. Prints to `stdout` the array `array` formatted as a table.

### console.timeStamp([label])
<!-- YAML
added: v8.0.0
-->
* `label` {string}

This method does not display anything unless used in the inspector. The `console.timeStamp()` method adds an event with the label `label` to the **Timeline** panel of the inspector.

### console.timeline([label])
<!-- YAML
added: v8.0.0
-->

* `label` {string} Defaults to `'default'`.

This method does not display anything unless used in the inspector. The `console.timeline()` method is the deprecated form of [`console.time()`][].

### console.timelineEnd([label])
<!-- YAML
added: v8.0.0
-->
* `label` {string} Defaults to `'default'`.

This method does not display anything unless used in the inspector. The `console.timelineEnd()` method is the deprecated form of [`console.timeEnd()`][].
