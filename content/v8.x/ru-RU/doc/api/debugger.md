# Отладчик

<!--introduced_in=v0.9.12-->

> Стабильность: 2 - Стабильно

<!-- type=misc -->

Node.js includes an out-of-process debugging utility accessible via a [V8 Inspector](#debugger_v8_inspector_integration_for_node_js) and built-in debugging client. To use it, start Node.js with the `inspect` argument followed by the path to the script to debug; a prompt will be displayed indicating successful launch of the debugger:

```txt
$ node inspect myscript.js
< Debugger listening on ws://127.0.0.1:9229/80e7a814-7cd3-49fb-921a-2e02228cd5ba
< For help see https://nodejs.org/en/docs/inspector
< Debugger attached.
Break on start in myscript.js:1
> 1 (function (exports, require, module, __filename, __dirname) { global.x = 5;
  2 setTimeout(() => {
  3   console.log('world');
debug>
```

Node.js's debugger client is not a full-featured debugger, but simple step and inspection are possible.

Inserting the statement `debugger;` into the source code of a script will enable a breakpoint at that position in the code:

```js
// myscript.js
global.x = 5;
setTimeout(() => {
  debugger;
  console.log('world');
}, 1000);
console.log('hello');
```

Как только отладчик запущен, точка останова появится в строке 3:

```txt
$ node inspect myscript.js
< Debugger listening on ws://127.0.0.1:9229/80e7a814-7cd3-49fb-921a-2e02228cd5ba
< For help see https://nodejs.org/en/docs/inspector
< Debugger attached.
Break on start in myscript.js:1
> 1 (function (exports, require, module, __filename, __dirname) { global.x = 5;
  2 setTimeout(() => {
  3   debugger;
debug> cont
< hello
break in myscript.js:3
  1 (function (exports, require, module, __filename, __dirname) { global.x = 5;
  2 setTimeout(() => {
> 3   debugger;
  4   console.log('world');
  5 }, 1000);
debug> next
break in myscript.js:4
  2 setTimeout(() => {
  3   debugger;
> 4   console.log('world');
  5 }, 1000);
  6 console.log('hello');
debug> repl
Press Ctrl + C to leave debug repl
> x
5
> 2 + 2
4
debug> next
< world
break in myscript.js:5
  3   debugger;
  4   console.log('world');
> 5 }, 1000);
  6 console.log('hello');
  7
debug> .exit
```

Команда `repl` позволяет удаленно оценивать код. The `next` command steps to the next line. Введите `help`, чтобы увидеть другие доступные команды.

Pressing `enter` without typing a command will repeat the previous debugger command.

## Отслеживания

Во время отладки можно отслеживать выражения и значения переменных. On every breakpoint, each expression from the watchers list will be evaluated in the current context and displayed immediately before the breakpoint's source code listing.

Для начала отслеживания выражения введите `watch('my_expression')`. The command `watchers` will print the active watchers. To remove a watcher, type `unwatch('my_expression')`.

## Справочник команд

### Шаги

* `cont`, `c` - Продолжить выполнение
* `next`, `n` - На шаг вперед
* `step`, `s` - Вход
* `out`, `o` - Выход
* `pause` - Приостанавливает выполнение кода (как кнопка паузы в инструментах разработчика)

### Точки останова

* `setBreakpoint()`, `sb()` - Установка точки останова в текущей строке
* `setBreakpoint(line)`, `sb(line)` - Установка точки останова в определенной строке
* `setBreakpoint('fn()')`, `sb(...)` - Set breakpoint on a first statement in functions body
* `setBreakpoint('script.js', 1)`, `sb(...)` - Set breakpoint on first line of script.js
* `clearBreakpoint('script.js', 1)`, `cb(...)` - Clear breakpoint in script.js on line 1

It is also possible to set a breakpoint in a file (module) that is not loaded yet:

```txt
$ node inspect main.js
< Debugger listening on ws://127.0.0.1:9229/4e3db158-9791-4274-8909-914f7facf3bd
< For help see https://nodejs.org/en/docs/inspector
< Debugger attached.
Break on start in main.js:1
> 1 (function (exports, require, module, __filename, __dirname) { const mod = require('./mod.js');
  2 mod.hello();
  3 mod.hello();
debug> setBreakpoint('mod.js', 22)
Warning: script 'mod.js' was not loaded yet.
debug> c
break in mod.js:22
 20 // USE OR OTHER DEALINGS IN THE SOFTWARE.
 21
>22 exports.hello = function() {
 23   return 'hello from module';
 24 };
debug>
```

### Информация

* `backtrace`, `bt` - Печать обратной трассировки текущего фрейма выполнения
* `list(5)` - List scripts source code with 5 line context (5 lines before and after)
* `watch(expr)` - Добавить выражение для просмотра списка
* `unwatch(expr)` - Удалить выражение из списка для наблюдения
* `watchers` - List all watchers and their values (automatically listed on each breakpoint)
* `repl` - Открыть репль отладчика для оценки в контексте отладки скрипта
* `exec expr` - Выполнить выражение в контексте отладки скрипта

### Контроль управления

* `run` -Запустить скрипт (автоматически запускается на старте отладчика)
* `restart` - Перезапустить скрипт
* `kill` - Убить скрипт

### Разные

* `scripts` - Список всех загруженных скриптов
* `version` - Отображать версию V8

## Продвинутое Использование

### V8 Инспектор Интеграции для Node.js

V8 Inspector integration allows attaching Chrome DevTools to Node.js instances for debugging and profiling. It uses the [Chrome Debugging Protocol](https://chromedevtools.github.io/debugger-protocol-viewer/).

V8 Inspector can be enabled by passing the `--inspect` flag when starting a Node.js application. It is also possible to supply a custom port with that flag, e.g. `--inspect=9222` will accept DevTools connections on port 9222.

To break on the first line of the application code, pass the `--inspect-brk` flag instead of `--inspect`.

```txt
$ node --inspect index.js
Debugger listening on 127.0.0.1:9229.
To start debugging, open the following URL in Chrome:
    chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:9229/dc9010dd-f8b8-4ac5-a510-c1a114ec7d29
```

(In the example above, the UUID dc9010dd-f8b8-4ac5-a510-c1a114ec7d29 at the end of the URL is generated on the fly, it varies in different debugging sessions.)