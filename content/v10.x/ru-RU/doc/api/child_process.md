# Дочерний процесс

<!--introduced_in=v0.10.0-->
<!--lint disable maximum-line-length-->

> Стабильность: 2 - Стабильно

Модуль `child_process` предоставляет возможность порождать дочерние процессы способом похожим, но не идентичным popen(3). Эта возможность в основном обеспечивается функцией [`child_process.spawn()`][]:

```js
const { spawn } = require('child_process');
const ls = spawn('ls', ['-lh', '/usr']);

ls.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
  console.log(`stderr: ${data}`);
});

ls.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
```

By default, pipes for `stdin`, `stdout`, and `stderr` are established between the parent Node.js process and the spawned child. These pipes have limited (and platform-specific) capacity. If the child process writes to stdout in excess of that limit without the output being captured, the child process will block waiting for the pipe buffer to accept more data. This is identical to the behavior of pipes in the shell. Use the `{ stdio: 'ignore' }` option if the output will not be consumed.

Метод [`child_process.spawn()`][] создает дочерние процессы асинхронным путем без блокировки цикла событий Node.js. Функция [`child_process.spawnSync()`][] обеспечивает эквивалентный функционал синхронным способом, который блокирует цикл событий, пока вызываемый процесс не завершится или не прекратится.

Для удобства модуль `child_process` предоставляет несколько синхронных и асинхронных альтернатив для [`child_process.spawn()`][] и [`child_process.spawnSync()`][]. *Обратите внимание, что каждая из этих альтернатив реализуется поверх [`child_process.spawn()`][] или [`child_process.spawnSync()`][].*

  * [`child_process.exec()`][]: spawns a shell and runs a command within that shell, passing the `stdout` and `stderr` to a callback function when complete.
  * [`child_process.execFile()`][]: similar to [`child_process.exec()`][] except that it spawns the command directly without first spawning a shell by default.
  * [`child_process.fork()`][]: spawns a new Node.js process and invokes a specified module with an IPC communication channel established that allows sending messages between parent and child.
  * [`child_process.execSync()`][]: a synchronous version of [`child_process.exec()`][] that *will* block the Node.js event loop.
  * [`child_process.execFileSync()`][]: a synchronous version of [`child_process.execFile()`][] that *will* block the Node.js event loop.

Для определенных случаев использования - таких как автоматизация сценариев оболочки - [синхронные аналоги](#child_process_synchronous_process_creation) могут быть более удобными. Однако во многих случаях синхронные методы могут иметь значительное влияние на производительность из-за остановки цикла обработки событий, пока не завершаться вызванные процессы.

## Создание асинхронного процесса

Все методы [`child_process.spawn()`][], [`child_process.fork()`][], [`child_process.exec()`][], и [`child_process.execFile()`][] следуют идиоматическому шаблону асинхронного программирования, которое типично для других API Node.js.

Каждый из методов возвращает экземпляр [`ChildProcess`][]. Эти объекты реализуют API Node.js [`EventEmitter`][], позволяя родительскому процессу регистрировать функции прослушивателя, которые вызываются, когда определенные события происходят в течение жизненного цикла дочернего процесса.

Методы [`child_process.exec()`][] и [`child_process.execFile()`][] дополнительно учитывают функцию `обратного вызова`, которая вызывается после завершения дочернего процесса, для определения.

### Создание файлов `.bat` and `.cmd` в Windows

Важность различия между [`child_process.exec()`][] и [`child_process.execFile()`][] может отличаться в зависимости от платформы. On Unix-type operating systems (Unix, Linux, macOS) [`child_process.execFile()`][] can be more efficient because it does not spawn a shell by default. Однако в Windows файлы `.bat` and `.cmd` не могут выполняться самостоятельно без терминала и поэтому не могут быть запущены с помощью [`child_process.execFile()`][]. При работе в Windows файлы `.bat` and `.cmd` могут быть вызваны с помощью [`child_process.spawn()`][] с набором опций `shell`, с [`child_process.exec()`][] или путем вызова `cmd.exe` и передаче `.bat` или `.cmd` файла как аргумент (то, что делают опция `shell` и [`child_process.exec()`][]). В любом случае, если имя файла содержит пробелы, это необходимо указать.

```js
// Только для Windows ...
const { spawn } = require('child_process');
const bat = spawn('cmd.exe', ['/c', 'my.bat']);

bat.stdout.on('data', (data) => {
  console.log(data.toString());
});

bat.stderr.on('data', (data) => {
  console.log(data.toString());
});

bat.on('exit', (code) => {
  console.log(`Child exited with code ${code}`);
});
```

```js
// ИЛИ...
const { exec } = require('child_process');
exec('my.bat', (err, stdout, stderr) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(stdout);
});

// Script with spaces in the filename:
const bat = spawn('"my script.cmd"', ['a', 'b'], { shell: true });
// or:
exec('"my script.cmd" a b', (err, stdout, stderr) => {
  // ...
});
```

### child_process.exec(command\[, options\]\[, callback\])
<!-- YAML
added: v0.1.90
changes:
  - version: v8.8.0
    pr-url: https://github.com/nodejs/node/pull/15380
    description: The `windowsHide` option is supported now.
-->

* `command` {string} Команда запуска с аргументами, разделенными пробелами.
* `options` {Object}
  * `cwd` {string} Текущий рабочий каталог дочернего процесса. **Default:** `null`.
  * `env` {Object} Пары ключ-значение среды. **Default:** `null`.
  * `encoding` {string} **По умолчанию:** `'utf8'`
  * `shell` {string} Оболочка для выполнения команды. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `'/bin/sh'` on UNIX, `process.env.ComSpec` on Windows.
  * `timeout` {number} **По умолчанию:** `0`
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated and any output is truncated. See caveat at [`maxBuffer` and Unicode][]. **По умолчанию:** `200 * 1024`.
  * `killSignal` {string|integer} **По умолчанию:** `'SIGTERM'`
  * `uid` {number} Устанавливает личность пользователя процесса (см. setuid(2)).
  * `gid` {number} Устанавливает групповой идентификатор процесса (см. setgid(2)).
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **По умолчанию:** `false`.
* `callback` {Function} called with the output when process terminates.
  * `error` {Error}
  * `stdout` {string|Buffer}
  * `stderr` {string|Buffer}
* Возвращает: {ChildProcess}

Создает оболочку, затем выполняет `command` внутри этой оболочки, буферизируя все сгенерированные выходы. The `command` string passed to the exec function is processed directly by the shell and special characters (vary based on [shell](https://en.wikipedia.org/wiki/List_of_command-line_interpreters)) need to be dealt with accordingly:
```js
exec('"/path/to/test file/test.sh" arg1 arg2');
// Double quotes are used so that the space in the path is not interpreted as
// multiple arguments

exec('echo "The \\$HOME variable is $HOME"');
// The $HOME variable is escaped in the first instance, but not in the second
```

**Never pass unsanitized user input to this function. Any input containing shell metacharacters may be used to trigger arbitrary command execution.**

Если предусмотрена функция `обратного вызова`, то она вызывается с аргументами `(error, stdout, stderr)`. В случае успеха `error` будет `null`. В случае ошибки `error` будет экземпляром [`Error`][]. Свойство `error.code` будет кодом завершения дочернего процесса, в то время как `error.signal` будет установлен на оповещение при завершении процесса. Любой код, отличный от `0`, считается ошибкой.

Аргументы `stdout` and `stderr`, переданные обратному вызову, будут содержать выходные данные stdout и stderr дочернего процесса. По умолчанию Node.js декодирует выходные данные как UTF-8 и передаст строки функции обратного вызова. Опция `encoding` может использоваться для указания кодировки символов, которая используется для декодирования выходных данных stdout и stderr. Если `encoding` является `'buffer'` или кодировкой нераспознанного символа, объекты `Buffer` вместо этого будут передаваться функции обратного вызова.

```js
const { exec } = require('child_process');
exec('cat *.js missing_file | wc -l', (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
});
```

Если `timeout` больше `0`, то родительский процесс отправит сигнал, определенный свойством `killSignal` (по умолчанию `'SIGTERM'`), если дочерний процесс выполняется дольше, чем `timeout` миллисекунд.

Unlike the exec(3) POSIX system call, `child_process.exec()` does not replace the existing process and uses a shell to execute the command.

If this method is invoked as its [`util.promisify()`][]ed version, it returns a `Promise` for an `Object` with `stdout` and `stderr` properties. In case of an error (including any error resulting in an exit code other than 0), a rejected promise is returned, with the same `error` object given in the callback, but with an additional two properties `stdout` and `stderr`.

```js
const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function lsExample() {
  const { stdout, stderr } = await exec('ls');
  console.log('stdout:', stdout);
  console.log('stderr:', stderr);
}
lsExample();
```

### child_process.execFile(file\[, args\]\[, options\][, callback])
<!-- YAML
added: v0.1.91
changes:
  - version: v8.8.0
    pr-url: https://github.com/nodejs/node/pull/15380
    description: The `windowsHide` option is supported now.
-->

* `file` {string} Имя исполняемого файла для запуска или путь к нему.
* `args` {string[]} Список строковых аргументов.
* `options` {Object}
  * `cwd` {string} Текущий рабочий каталог дочернего процесса.
  * `env` {Object} Пары ключ-значение среды.
  * `encoding` {string} **По умолчанию:** `'utf8'`
  * `timeout` {number} **По умолчанию:** `0`
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated and any output is truncated. See caveat at [`maxBuffer` and Unicode][]. **По умолчанию:** `200 * 1024`.
  * `killSignal` {string|integer} **По умолчанию:** `'SIGTERM'`
  * `uid` {number} Устанавливает личность пользователя процесса (см. setuid(2)).
  * `gid` {number} Устанавливает групповой идентификатор процесса (см. setgid(2)).
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **По умолчанию:** `false`.
  * `windowsVerbatimArguments` {boolean} No quoting or escaping of arguments is done on Windows. Ignored on Unix. **По умолчанию:** `false`.
  * `shell` {boolean|string} Если `true`, запускает `command` внутри оболочки. Uses `'/bin/sh'` on UNIX, and `process.env.ComSpec` on Windows. A different shell can be specified as a string. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **По умолчанию:** `false` (без оболочки).
* `callback` {Function} Called with the output when process terminates.
  * `error` {Error}
  * `stdout` {string|Buffer}
  * `stderr` {string|Buffer}
* Возвращает: {ChildProcess}

The `child_process.execFile()` function is similar to [`child_process.exec()`][] except that it does not spawn a shell by default. Скорее, указанный исполняемый `file` создается непосредственно как новый процесс, делая его немного более эффективным, чем [`child_process.exec()`][].

Поддерживаются те же опции, что и в [`child_process.exec()`][]. Поскольку оболочка не создается, не поддерживается такое поведение, как перенаправление входа-выхода и глобализация файлов.

```js
const { execFile } = require('child_process');
const child = execFile('node', ['--version'], (error, stdout, stderr) => {
  if (error) {
    throw error;
  }
  console.log(stdout);
});
```

Аргументы `stdout` and `stderr`, переданные обратному вызову, будут содержать выходные данные stdout и stderr дочернего процесса. По умолчанию Node.js декодирует выходные данные как UTF-8 и передаст строки функции обратного вызова. Опция `encoding` может использоваться для указания кодировки символов, которая используется для декодирования выходных данных stdout и stderr. Если `encoding` является `'buffer'` или кодировкой нераспознанного символа, объекты `Buffer` вместо этого будут передаваться функции обратного вызова.

If this method is invoked as its [`util.promisify()`][]ed version, it returns a `Promise` for an `Object` with `stdout` and `stderr` properties. In case of an error (including any error resulting in an exit code other than 0), a rejected promise is returned, with the same `error` object given in the callback, but with an additional two properties `stdout` and `stderr`.

```js
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
async function getVersion() {
  const { stdout } = await execFile('node', ['--version']);
  console.log(stdout);
}
getVersion();
```

**If the `shell` option is enabled, do not pass unsanitized user input to this function. Any input containing shell metacharacters may be used to trigger arbitrary command execution.**

### child_process.fork(modulePath\[, args\]\[, options\])
<!-- YAML
added: v0.5.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10866
    description: The `stdio` option can now be a string.
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7811
    description: The `stdio` option is supported now.
-->

* `modulePath` {string} Модуль, запускаемый в дочернем процессе.
* `args` {string[]} Список строковых аргументов.
* `options` {Object}
  * `cwd` {string} Текущий рабочий каталог дочернего процесса.
  * `detached` {boolean} Подготовка дочернего процесса к запуску независимо от его родительского процесса. Поведение определяется в зависимости от платформы, см. [`options.detached`][]).
  * `env` {Object} Пары ключ-значение среды.
  * `execPath` {string} Выполняемая функция для создания дочернего процесса.
  * `execArgv` {string[]} List of string arguments passed to the executable. **По умолчанию:** `process.execArgv`.
  * `silent` {boolean} Если `true`, stdin, stdout и stderr дочернего процесса будут передаваться родительскому процессу, в противном случае они будут унаследованы от родительского процесса; для более подробной информации смотрите опции `'pipe'` и `'inherit'` для [`stdio`][] [`child_process.spawn()`][]. **По умолчанию:** `false`.
  * `stdio` {Array|string} See [`child_process.spawn()`][]'s [`stdio`][]. Когда эта опция предоставляется, она отменяет `silent`. If the array variant is used, it must contain exactly one item with value `'ipc'` or an error will be thrown. Например: `[0, 1, 2, 'ipc']`.
  * `windowsVerbatimArguments` {boolean} No quoting or escaping of arguments is done on Windows. Ignored on Unix. **По умолчанию:** `false`.
  * `uid` {number} Устанавливает личность пользователя процесса (см. setuid(2)).
  * `gid` {number} Устанавливает групповой идентификатор процесса (см. setgid(2)).
* Возвращает: {ChildProcess}

Метод `child_process.fork()` является частным случаем [`child_process.spawn()`][], который используется для создания новых процессов Node.js. Как и [`child_process.spawn()`][], объект [`ChildProcess`][] возвращается. Возвращенный [`ChildProcess`][] будет иметь дополнительный встроенный канал связи, который позволяет сообщениям передаваться в обе стороны между родительским и дочерним процессами. Для более подробной информации см. [`subprocess.send()`][].

Важно помнить, что созданные дочерние процессы Node.js не зависят от родительских, за исключением канала связи IPC, который устанавливается между ними. У каждого процесса своя память с собственными экземплярами V8. Из-за потребности к выделению дополнительных ресурсов, не рекомендуется создавать большое количество дочерних процессов Node.js.

По умолчанию `child_process.fork()` создаст новые экземпляры Node.js, используя [`process.execPath`][] дочернего процесса. Свойство `execPath` в объекте `options` позволяет использовать альтернативный путь выполнения.

Процессы Node.js, запущенные с пользовательским `execPath` будут сообщаться с родительским процессом через файловый дескриптор (fd), который определяется переменной окружения `NODE_CHANNEL_FD` в дочернем процессе.

Unlike the fork(2) POSIX system call, `child_process.fork()` does not clone the current process.

The `shell` option available in [`child_process.spawn()`][] is not supported by `child_process.fork()` and will be ignored if set.

### child_process.spawn(command\[, args\]\[, options\])
<!-- YAML
added: v0.1.90
changes:
  - version: v8.8.0
    pr-url: https://github.com/nodejs/node/pull/15380
    description: The `windowsHide` option is supported now.
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7696
    description: The `argv0` option is supported now.
  - version: v5.7.0
    pr-url: https://github.com/nodejs/node/pull/4598
    description: The `shell` option is supported now.
-->

* `command` {string} Команда для выполнения.
* `args` {string[]} Список строковых аргументов.
* `options` {Object}
  * `cwd` {string} Текущий рабочий каталог дочернего процесса.
  * `env` {Object} Пары ключ-значение среды.
  * `argv0` {string} Точно задайте значение `argv[0]`, отправляемое дочернему процессу. Если не указано, будет установлено значение `command`.
  * `stdio` {Array|string} Конфигурация stdio дочернего процесса (см. [`options.stdio`][`stdio`]).
  * `detached` {boolean} Подготовка дочернего процесса к запуску независимо от его родительского процесса. Поведение определяется в зависимости от платформы, см. [`options.detached`][]).
  * `uid` {number} Устанавливает личность пользователя процесса (см. setuid(2)).
  * `gid` {number} Устанавливает групповой идентификатор процесса (см. setgid(2)).
  * `shell` {boolean|string} Если `true`, запускает `command` внутри оболочки. Uses `'/bin/sh'` on UNIX, and `process.env.ComSpec` on Windows. A different shell can be specified as a string. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **По умолчанию:** `false` (без оболочки).
  * `windowsVerbatimArguments` {boolean} No quoting or escaping of arguments is done on Windows. Ignored on Unix. This is set to `true` automatically when `shell` is specified. **По умолчанию:** `false`.
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **По умолчанию:** `false`.
* Возвращает: {ChildProcess}

Метод `child_process.spawn()` создает новый процесс с использованием заданной функции `command` с аргументами командной строки в `args`. Если это не указано, `args` по умолчанию устанавливается в пустой массив.

**If the `shell` option is enabled, do not pass unsanitized user input to this function. Any input containing shell metacharacters may be used to trigger arbitrary command execution.**

Третий аргумент может быть использован для указания дополнительных опций со следующими параметрами по умолчанию:

```js
const defaults = {
  cwd: undefined,
  env: process.env
};
```

Используйте `cwd`, чтобы определить рабочий каталог, из которого создается процесс. Если это не указано, то по умолчанию наследуется текущий рабочий каталог.

Используйте `env`, чтобы задать переменные среды, которые будут видны новому процессу; по умолчанию - [`process.env`][].

`undefined` values in `env` will be ignored.

Пример выполнения `ls -lh /usr`, захвата `stdout`, `stderr` и кода выхода:

```js
const { spawn } = require('child_process');
const ls = spawn('ls', ['-lh', '/usr']);

ls.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
  console.log(`stderr: ${data}`);
});

ls.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
```

Пример: очень сложный способ выполнения `ps ax | grep ssh`

```js
const { spawn } = require('child_process');
const ps = spawn('ps', ['ax']);
const grep = spawn('grep', ['ssh']);

ps.stdout.on('data', (data) => {
  grep.stdin.write(data);
});

ps.stderr.on('data', (data) => {
  console.log(`ps stderr: ${data}`);
});

ps.on('close', (code) => {
  if (code !== 0) {
    console.log(`ps process exited with code ${code}`);
  }
  grep.stdin.end();
});

grep.stdout.on('data', (data) => {
  console.log(data.toString());
});

grep.stderr.on('data', (data) => {
  console.log(`grep stderr: ${data}`);
});

grep.on('close', (code) => {
  if (code !== 0) {
    console.log(`grep process exited with code ${code}`);
  }
});
```

Пример проверки `spawn` на невыполнение:

```js
const { spawn } = require('child_process');
const subprocess = spawn('bad_command');

subprocess.on('error', (err) => {
  console.log('Failed to start subprocess.');
});
```

Certain platforms (macOS, Linux) will use the value of `argv[0]` for the process title while others (Windows, SunOS) will use `command`.

Node.js currently overwrites `argv[0]` with `process.execPath` on startup, so `process.argv[0]` in a Node.js child process will not match the `argv0` parameter passed to `spawn` from the parent, retrieve it with the `process.argv0` property instead.

#### options.detached
<!-- YAML
added: v0.7.10
-->

На Windows установка `options.detached` на `true` делает возможным для дочернего процесса продолжить выполнение после завершения родительского. У дочернего процесса будет собственное консольное окно. *Запущенный дочерний процесс не может быть прерван*.

На платформах отличных от Windows, если `options.detached` установлен на `true`, дочерний процесс станет лидирующим в группе новых процессов и сессий. Обратите внимание, что дочерние процессы могут продолжать работать после закрытия родительского процесса, не зависимо от того, разделены они или нет. Для более подробной информации см. setsid(2).

По умолчанию родительский процесс будет ждать выхода отделенного дочернего процесса. To prevent the parent from waiting for a given `subprocess` to exit, use the `subprocess.unref()` method. Doing so will cause the parent's event loop to not include the child in its reference count, allowing the parent to exit independently of the child, unless there is an established IPC channel between the child and the parent.

При использовании опции `detached` для запуска длительного процесса, процесс не будет работать в фоновом режиме после закрытия родительского процесса, если только он не предоставляется с конфигурацией `stdio`, которая не подключена к родительскому процессу. Если `stdio` родительского процесса наследуется, дочерний процесс останется прикрепленным к управляющему терминалу.

Пример долговременного процесса с отсоединением и игнорированием файловых дескрипторов `stdio` его родительского процесса, чтобы игнорировать завершение родительского процесса:

```js
const { spawn } = require('child_process');

const subprocess = spawn(process.argv[0], ['child_program.js'], {
  detached: true,
  stdio: 'ignore'
});

subprocess.unref();
```

В качестве альтернативы можно перенаправить вывод дочернего процесса в файлы:

```js
const fs = require('fs');
const { spawn } = require('child_process');
const out = fs.openSync('./out.log', 'a');
const err = fs.openSync('./out.log', 'a');

const subprocess = spawn('prg', [], {
  detached: true,
  stdio: [ 'ignore', out, err ]
});

subprocess.unref();
```

#### options.stdio
<!-- YAML
added: v0.7.10
changes:
  - version: v3.3.1
    pr-url: https://github.com/nodejs/node/pull/2727
    description: The value `0` is now accepted as a file descriptor.
-->

Опция `options.stdio` используется для настройки каналов, установленных между родительским и дочерним процессами. По умолчанию stdin, stdout и stderr дочернего процесса перенаправляются в соответствующие потоки [`subprocess.stdin`][], [`subprocess.stdout`][] и [`subprocess.stderr`][] в объекте [`ChildProcess`][]. Это эквивалентно установке `options.stdio` равному `['pipe', 'pipe', 'pipe']`.

Для удобства `options.stdio` может быть одной из следующих строк:

* `'pipe'` - эквивалент `['pipe', 'pipe', 'pipe']` (по умолчанию)
* `'ignore'` - эквивалент `['ignore', 'ignore', 'ignore']`
* `'inherit'` - equivalent to `['inherit', 'inherit', 'inherit']` or `[0, 1, 2]`

В противном случае значение `options.stdio` является массивом, где каждый индекс соответствует fd в дочернем процессе. Файловые дескрипторы (fd) 0, 1 и 2 согласуются с stdin, stdout и stderr соответственно. Дополнительные fd могут быть указаны для создания дополнительных каналов между родительским и дочерним процессами. Значение является одним из следующих:

1. `'pipe'` - Создание канала между дочерним процессом и родительским процессом. The parent end of the pipe is exposed to the parent as a property on the `child_process` object as [`subprocess.stdio[fd]`][`stdio`]. Pipes created for fds 0 - 2 are also available as [`subprocess.stdin`][], [`subprocess.stdout`][] and [`subprocess.stderr`][], respectively.
2. `'ipc'` - Create an IPC channel for passing messages/file descriptors between parent and child. A [`ChildProcess`][] may have at most *one* IPC stdio file descriptor. Setting this option enables the [`subprocess.send()`][] method. If the child is a Node.js process, the presence of an IPC channel will enable [`process.send()`][] and [`process.disconnect()`][] methods, as well as [`'disconnect'`][] and [`'message'`][] events within the child.

   Accessing the IPC channel fd in any way other than [`process.send()`][] or using the IPC channel with a child process that is not a Node.js instance is not supported.
3. `'ignore'` - Дает наказ Node.js игнорировать fd в дочернем процессе. While Node.js will always open fds 0 - 2 for the processes it spawns, setting the fd to `'ignore'` will cause Node.js to open `/dev/null` and attach it to the child's fd.
4. `'inherit'` - Pass through the corresponding stdio stream to/from the parent process.  In the first three positions, this is equivalent to `process.stdin`, `process.stdout`, and `process.stderr`, respectively.  In any other position, equivalent to `'ignore'`.
5. {Stream} object - Share a readable or writable stream that refers to a tty, file, socket, or a pipe with the child process. The stream's underlying file descriptor is duplicated in the child process to the fd that corresponds to the index in the `stdio` array. Note that the stream must have an underlying descriptor (file streams do not until the `'open'` event has occurred).
6. Positive integer - The integer value is interpreted as a file descriptor that is currently open in the parent process. It is shared with the child process, similar to how {Stream} objects can be shared. Passing sockets is not supported on Windows.
7. `null`, `undefined` - Используйте значение по умолчанию. For stdio fds 0, 1, and 2 (in other words, stdin, stdout, and stderr) a pipe is created. For fd 3 and up, the default is `'ignore'`.

```js
const { spawn } = require('child_process');

// Child will use parent's stdios
spawn('prg', [], { stdio: 'inherit' });

// Spawn child sharing only stderr
spawn('prg', [], { stdio: ['pipe', 'pipe', process.stderr] });

// Open an extra fd=4, to interact with programs presenting a
// startd-style interface.
spawn('prg', [], { stdio: ['pipe', null, null, null, 'pipe'] });
```

*It is worth noting that when an IPC channel is established between the parent and child processes, and the child is a Node.js process, the child is launched with the IPC channel unreferenced (using `unref()`) until the child registers an event handler for the [`'disconnect'`][] event or the [`'message'`][] event. Это позволяет дочернему процессу нормально завершиться без того, чтобы процесс был открыт по открытому каналу IPC.*

On UNIX-like operating systems, the [`child_process.spawn()`][] method performs memory operations synchronously before decoupling the event loop from the child. Applications with a large memory footprint may find frequent [`child_process.spawn()`][] calls to be a bottleneck. For more information, see [V8 issue 7381](https://bugs.chromium.org/p/v8/issues/detail?id=7381).

See also: [`child_process.exec()`][] and [`child_process.fork()`][].

## Создание синхронного процесса

The [`child_process.spawnSync()`][], [`child_process.execSync()`][], and [`child_process.execFileSync()`][] methods are **synchronous** and **WILL** block the Node.js event loop, pausing execution of any additional code until the spawned process exits.

Blocking calls like these are mostly useful for simplifying general-purpose scripting tasks and for simplifying the loading/processing of application configuration at startup.

### child_process.execFileSync(file\[, args\]\[, options\])
<!-- YAML
added: v0.11.12
changes:
  - version: v10.10.0
    pr-url: https://github.com/nodejs/node/pull/22409
    description: The `input` option can now be any `TypedArray` or a
                 `DataView`.
  - version: v8.8.0
    pr-url: https://github.com/nodejs/node/pull/15380
    description: The `windowsHide` option is supported now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10653
    description: The `input` option can now be a `Uint8Array`.
  - version: v6.2.1, v4.5.0
    pr-url: https://github.com/nodejs/node/pull/6939
    description: The `encoding` option can now explicitly be set to `buffer`.
-->

* `file` {string} Имя исполняемого файла для запуска или путь к нему.
* `args` {string[]} Список строковых аргументов.
* `options` {Object}
  * `cwd` {string} Текущий рабочий каталог дочернего процесса.
  * `input` {string|Buffer|TypedArray|DataView} The value which will be passed as stdin to the spawned process. Supplying this value will override `stdio[0]`.
  * `stdio` {string|Array} Конфигурация stdio дочернего процесса. `stderr` by default will be output to the parent process' stderr unless `stdio` is specified. **Default:** `'pipe'`.
  * `env` {Object} Пары ключ-значение среды.
  * `uid` {number} Устанавливает личность пользователя процесса (см. setuid(2)).
  * `gid` {number} Устанавливает групповой идентификатор процесса (см. setgid(2)).
  * `timeout` {number} Максимальное количество времени в миллисекундах, в течение которого процессу разрешено работать. **По умолчанию:** `не определено`.
  * `killSignal` {string|integer} Значение сигнала, которое будет использоваться, когда созданный процесс будет завершен. **По умолчанию:** `'SIGTERM'`.
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated. See caveat at [`maxBuffer` and Unicode][]. **По умолчанию:** `200 * 1024`.
  * `encoding` {string} Кодировка, используемая для всех входов и выходов stdio. **По умолчанию:** `'buffer'`.
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **По умолчанию:** `false`.
  * `shell` {boolean|string} Если `true`, запускает `command` внутри оболочки. Uses `'/bin/sh'` on UNIX, and `process.env.ComSpec` on Windows. A different shell can be specified as a string. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **По умолчанию:** `false` (без оболочки).
* Возвращает: {Buffer|string} Stdout из команды.

Метод `child_process.execFileSync()`, как правило, идентичен [`child_process.execFile()`][] за исключением того, что этот метод не будет возвращен, пока дочерний процесс полностью не завершится. Когда время ожидания обнаружено, и отправлен `killSignal`, метод не вернется, пока процесс полностью не завершится.

If the child process intercepts and handles the `SIGTERM` signal and does not exit, the parent process will still wait until the child process has exited.

If the process times out or has a non-zero exit code, this method ***will*** throw an [`Error`][] that will include the full result of the underlying [`child_process.spawnSync()`][].

**If the `shell` option is enabled, do not pass unsanitized user input to this function. Any input containing shell metacharacters may be used to trigger arbitrary command execution.**

### child_process.execSync(command[, options])
<!-- YAML
added: v0.11.12
changes:
  - version: v10.10.0
    pr-url: https://github.com/nodejs/node/pull/22409
    description: The `input` option can now be any `TypedArray` or a
                 `DataView`.
  - version: v8.8.0
    pr-url: https://github.com/nodejs/node/pull/15380
    description: The `windowsHide` option is supported now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10653
    description: The `input` option can now be a `Uint8Array`.
-->

* `command` {string} Команда для выполнения.
* `options` {Object}
  * `cwd` {string} Текущий рабочий каталог дочернего процесса.
  * `input` {string|Buffer|TypedArray|DataView} The value which will be passed as stdin to the spawned process. Supplying this value will override `stdio[0]`.
  * `stdio` {string|Array} Конфигурация stdio дочернего процесса. `stderr` by default will be output to the parent process' stderr unless `stdio` is specified. **Default:** `'pipe'`.
  * `env` {Object} Пары ключ-значение среды.
  * `shell` {string} Оболочка для выполнения команды. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `'/bin/sh'` on UNIX, `process.env.ComSpec` on Windows.
  * `uid` {number} Устанавливает личность пользователя процесса. (См. setuid(2)).
  * `gid` {number} Устанавливает групповой идентификатор процесса. (См. setgid(2)).
  * `timeout` {number} Максимальное количество времени в миллисекундах, в течение которого процессу разрешено работать. **По умолчанию:** `не определено`.
  * `killSignal` {string|integer} Значение сигнала, которое будет использоваться, когда созданный процесс будет завершен. **По умолчанию:** `'SIGTERM'`.
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated and any output is truncated. See caveat at [`maxBuffer` and Unicode][]. **По умолчанию:** `200 * 1024`.
  * `encoding` {string} Кодировка, используемая для всех входов и выходов stdio. **По умолчанию:** `'buffer'`.
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **По умолчанию:** `false`.
* Возвращает: {Buffer|string} Stdout из команды.

Метод `child_process.execSync()`, как правило, идентичен [`child_process.exec()`][] за исключением того, что этот метод не вернется, пока дочерний процесс полностью не завершится. Когда время ожидания обнаружено, и отправлен `killSignal`, метод не вернется, пока процесс полностью не завершится. *Обратите внимание, что если дочерний процесс перехватывает и обрабатывает сигнал `SIGTERM`, родительский процесс все равно будет ожидать, пока дочерний процесс не завершится.*

If the process times out or has a non-zero exit code, this method ***will*** throw. The [`Error`][] object will contain the entire result from [`child_process.spawnSync()`][].

**Never pass unsanitized user input to this function. Any input containing shell metacharacters may be used to trigger arbitrary command execution.**

### child_process.spawnSync(command\[, args\]\[, options\])
<!-- YAML
added: v0.11.12
changes:
  - version: v10.10.0
    pr-url: https://github.com/nodejs/node/pull/22409
    description: The `input` option can now be any `TypedArray` or a
                 `DataView`.
  - version: v8.8.0
    pr-url: https://github.com/nodejs/node/pull/15380
    description: The `windowsHide` option is supported now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10653
    description: The `input` option can now be a `Uint8Array`.
  - version: v6.2.1, v4.5.0
    pr-url: https://github.com/nodejs/node/pull/6939
    description: The `encoding` option can now explicitly be set to `buffer`.
  - version: v5.7.0
    pr-url: https://github.com/nodejs/node/pull/4598
    description: The `shell` option is supported now.
-->

* `command` {string} Команда для выполнения.
* `args` {string[]} Список строковых аргументов.
* `options` {Object}
  * `cwd` {string} Текущий рабочий каталог дочернего процесса.
  * `input` {string|Buffer|TypedArray|DataView} The value which will be passed as stdin to the spawned process. Supplying this value will override `stdio[0]`.
  * `argv0` {string} Точно задайте значение `argv[0]`, отправляемое дочернему процессу. Если не указано, будет установлено значение `command`.
  * `stdio` {string|Array} Конфигурация stdio дочернего процесса.
  * `env` {Object} Пары ключ-значение среды.
  * `uid` {number} Устанавливает личность пользователя процесса (см. setuid(2)).
  * `gid` {number} Устанавливает групповой идентификатор процесса (см. setgid(2)).
  * `timeout` {number} Максимальное количество времени в миллисекундах, в течение которого процессу разрешено работать. **По умолчанию:** `не определено`.
  * `killSignal` {string|integer} Значение сигнала, которое будет использоваться, когда созданный процесс будет завершен. **По умолчанию:** `'SIGTERM'`.
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated and any output is truncated. See caveat at [`maxBuffer` and Unicode][]. **По умолчанию:** `200 * 1024`.
  * `encoding` {string} Кодировка, используемая для всех входов и выходов stdio. **По умолчанию:** `'buffer'`.
  * `shell` {boolean|string} Если `true`, запускает `command` внутри оболочки. Uses `'/bin/sh'` on UNIX, and `process.env.ComSpec` on Windows. A different shell can be specified as a string. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **По умолчанию:** `false` (без оболочки).
  * `windowsVerbatimArguments` {boolean} No quoting or escaping of arguments is done on Windows. Ignored on Unix. This is set to `true` automatically when `shell` is specified. **По умолчанию:** `false`.
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **По умолчанию:** `false`.
* Возвращает: {Object}
  * `pid` {number} Pid дочернего процесса.
  * `output` {Array} Массив результатов из выхода stdio.
  * `stdout` {Buffer|string} Содержимое `output[1]`.
  * `stderr` {Buffer|string} Содержимое `output[2]`.
  * `status` {number|null} The exit code of the subprocess, or `null` if the subprocess terminated due to a signal.
  * `signal` {string|null} The signal used to kill the subprocess, or `null` if the subprocess did not terminate due to a signal.
  * `error` {Error} Объект ошибки, если дочерний процесс завершился неудачно или истекло время ожидания.

Метод `child_process.spawnSync()`, как правило, идентичен [`child_process.spawn()`][] за исключением того, что функция не вернется, пока дочерний процесс полностью не завершится. Когда время ожидания обнаружено, и отправлен `killSignal`, метод не вернется, пока процесс полностью не завершится. Обратите внимание, что если процесс перехватывает и обрабатывает сигнал `SIGTERM`, и не выходит, родительский процесс будет ожидать, пока дочерний процесс не завершится.

**If the `shell` option is enabled, do not pass unsanitized user input to this function. Any input containing shell metacharacters may be used to trigger arbitrary command execution.**

## Class: ChildProcess
<!-- YAML
added: v2.2.0
-->

Экземплярами класса `ChildProcess` являются [`EventEmitters`][`EventEmitter`], которые представляют созданные дочерние процессы.

Экземпляры `ChildProcess` не предназначены для создания напрямую. Для создания экземпляров `ChildProcess` лучше использовать методы [`child_process.spawn()`][], [`child_process.exec()`][], [`child_process.execFile()`][] или [`child_process.fork()`][].

### Событие: 'close'
<!-- YAML
added: v0.7.7
-->

* `code` {number} Код выхода, если дочерний процесс завершился самостоятельно.
* `signal` {string} Сигнал, по которому дочерний процесс был завершен.

Событие `'close'` генерируется, когда потоки stdio дочернего процесса были закрыты. Это отличается от события [`'exit'`][], поскольку несколько процессов могут совместно использовать одни и те же потоки stdio.

### Событие: 'disconnect'
<!-- YAML
added: v0.7.2
-->

Событие `'disconnect'` генерируется после вызова метода [`subprocess.disconnect()`][] в родительском процессе или [`process.disconnect()`][] в дочернем процессе. После его отсоединения невозможно более отправлять и получать сообщения, и свойство [`subprocess.connected`][] имеет значение `false`.

### Событие: 'error'

* `err` {Error} Ошибка.

Событие `'error'` создается, когда:

1. Процесс не может быть запущен, или
2. Процесс не может быть завершен, или
3. Не удалось отправить сообщение дочернему процессу.

The `'exit'` event may or may not fire after an error has occurred. When listening to both the `'exit'` and `'error'` events, it is important to guard against accidentally invoking handler functions multiple times.

Также смотрите [`subprocess.kill()`][] и [`subprocess.send()`][].

### Событие: 'exit'
<!-- YAML
added: v0.1.90
-->

* `code` {number} Код выхода, если дочерний процесс завершился самостоятельно.
* `signal` {string} Сигнал, по которому дочерний процесс был завершен.

Событие `'exit'` генерируется после завершения дочернего процесса. Если процесс завершен, `code` является окончательным кодом выхода процесса, в противном случае будет `null`. Если процесс завершен из-за получения сигнала, `signal` - имя строки сигнала, в противном случае будет `null`. Один из двух всегда будет ненулевым.

Обратите внимание, когда событие `'exit'` запущено, потоки stdio дочернего процесса могут быть все еще открыты.

Также обратите внимание, что Node.js устанавливает обработчики сигнала для `SIGINT` и `SIGTERM`, и процессы Node.js не завершаться немедленно из-за получения этих сигналов. Скорее Node.js выполнит последовательность действий по очистке, а затем снова запустит обработанный сигнал.

See waitpid(2).

### Событие: 'message'
<!-- YAML
added: v0.5.9
-->

* `message` {Object} Анализируемый объект JSON или примитивное значение.
* `sendHandle` {Handle} Объект [`net.Socket`][] или [`net.Server`][], или не определен.

Событие `'message'` запускается, когда дочерний процесс использует [`process.send()`][] для отправки сообщений.

The message goes through serialization and parsing. The resulting message might not be the same as what is originally sent.

### subprocess.channel
<!-- YAML
added: v7.1.0
-->

* {Object} A pipe representing the IPC channel to the child process.

The `subprocess.channel` property is a reference to the child's IPC channel. If no IPC channel currently exists, this property is `undefined`.

### subprocess.connected
<!-- YAML
added: v0.7.2
-->

* {boolean} Установка на `false` после вызова `subprocess.disconnect()`.

Свойство `subprocess.connected` указывает, возможно ли по-прежнему отправлять и получать сообщения от дочернего процесса. Когда `subprocess.connected` имеет значение `false`, больше нельзя отправлять или получать сообщения.

### subprocess.disconnect()
<!-- YAML
added: v0.7.2
-->

Закрывает канал IPC между родительским и дочерним процессами, позволяя дочернему процессу завершиться успешно, если только нет других соединений, поддерживающих его активным. После вызова этого метода свойства `subprocess.connected` и `process.connected` в родительском и дочернем процессах (соответственно) будут установлены на `false`, и больше не будет возможности передавать сообщения между процессами.

Событие `'disconnect'` будет запущено, когда в процессе получения отсутствуют сообщения. Чаще всего оно запускается сразу после вызова `subprocess.disconnect()`.

Обратите внимание, что когда дочерний процесс является экземпляром Node.js (например, созданный с помощью [`child_process.fork()`]), метод `process.disconnect()` может вызываться в дочернем процессе, чтобы также закрыть канал IPC.

### subprocess.kill([signal])
<!-- YAML
added: v0.1.90
-->

* `signal` {string}

Метод `subprocess.kill()` отправляет сигнал дочернему процессу. Если нет заданного аргумента, процессу будет послан сигнал `'SIGTERM'`. Смотрите signal(7) для просмотра списка доступных сигналов.

```js
const { spawn } = require('child_process');
const grep = spawn('grep', ['ssh']);

grep.on('close', (code, signal) => {
  console.log(
    `child process terminated due to receipt of signal ${signal}`);
});

// Send SIGHUP to process
grep.kill('SIGHUP');
```

Объект [`ChildProcess`][] может вызывать событие [`'error'`][], если сигнал не может быть доставлен. Отправка сигнала дочернему процессу, который уже завершился, не является ошибкой, но может иметь непредвиденные последствия. В частности, если идентификатор процесса (PID) был переназначен другому процессу, сигнал будет доставлен этому процессу вместо заданного, что может иметь неожиданный результат.

Обратите внимание, что хотя функция называется `kill`, сигнал, доставляемый дочернему процессу, не может фактически завершить процесс.

Для справки смотрите kill(2).

On Linux, child processes of child processes will not be terminated when attempting to kill their parent. This is likely to happen when running a new process in a shell or with the use of the `shell` option of `ChildProcess`:

```js
'use strict';
const { spawn } = require('child_process');

const subprocess = spawn(
  'sh',
  [
    '-c',
    `node -e "setInterval(() => {
      console.log(process.pid, 'is alive')
    }, 500);"`
  ], {
    stdio: ['inherit', 'inherit', 'inherit']
  }
);

setTimeout(() => {
  subprocess.kill(); // does not terminate the node process in the shell
}, 2000);
```

### subprocess.killed
<!-- YAML
added: v0.5.10
-->

* {boolean} Установка на `true` после использования `subprocess.kill()` для успешной передачи сигнала дочернему процессу.

Свойство `subprocess.killed` указывает, успешно ли дочерний процесс получил сигнал из `subprocess.kill()`. Свойство `killed` не означает, что дочерний процесс был завершен.

### subprocess.pid
<!-- YAML
added: v0.1.90
-->

* {integer}

Возвращает идентификатор процесса (PID) дочернего процесса.

```js
const { spawn } = require('child_process');
const grep = spawn('grep', ['ssh']);

console.log(`Spawned child pid: ${grep.pid}`);
grep.stdin.end();
```

### subprocess.ref()
<!-- YAML
added: v0.7.10
-->

Calling `subprocess.ref()` after making a call to `subprocess.unref()` will restore the removed reference count for the child process, forcing the parent to wait for the child to exit before exiting itself.

```js
const { spawn } = require('child_process');

const subprocess = spawn(process.argv[0], ['child_program.js'], {
  detached: true,
  stdio: 'ignore'
});

subprocess.unref();
subprocess.ref();
```

### subprocess.send(message\[, sendHandle[, options]\]\[, callback\])
<!-- YAML
added: v0.5.9
changes:
  - version: v5.8.0
    pr-url: https://github.com/nodejs/node/pull/5283
    description: The `options` parameter, and the `keepOpen` option
                 in particular, is supported now.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3516
    description: This method returns a boolean for flow control now.
  - version: v4.0.0
    pr-url: https://github.com/nodejs/node/pull/2620
    description: The `callback` parameter is supported now.
-->

* `message` {Object}
* `sendHandle` {Handle}
* `options` {Object} The `options` argument, if present, is an object used to parameterize the sending of certain types of handles. `options` supports the following properties:
  * `keepOpen` {boolean} A value that can be used when passing instances of `net.Socket`. When `true`, the socket is kept open in the sending process. **По умолчанию:** `false`.
* `callback` {Function}
* Возвращает: {boolean}

Когда канал IPC установлен между родительским и дочерним процессами (т.е. при использовании [`child_process.fork()`][]), метод `subprocess.send()` может быть использован для отправки сообщений дочернему процессу. When the child process is a Node.js instance, these messages can be received via the [`'message'`][] event.

The message goes through serialization and parsing. The resulting message might not be the same as what is originally sent.

Например, в родительском сценарии:

```js
const cp = require('child_process');
const n = cp.fork(`${__dirname}/sub.js`);

n.on('message', (m) => {
  console.log('PARENT got message:', m);
});

// Causes the child to print: CHILD got message: { hello: 'world' }
n.send({ hello: 'world' });
```

И тогда дочерний сценарий `'sub.js'` может выглядеть так:

```js
process.on('message', (m) => {
  console.log('CHILD got message:', m);
});

// Causes the parent to print: PARENT got message: { foo: 'bar', baz: null }
process.send({ foo: 'bar', baz: NaN });
```

Дочерние процессы Node.js будут иметь собственный метод [`process.send()`][], который позволяет дочернему процессу посылать сообщения обратно родительскому процессу.

Существует особый случай при отправке сообщения `{cmd: 'NODE_foo'}`. Messages containing a `NODE_` prefix in the `cmd` property are reserved for use within Node.js core and will not be emitted in the child's [`'message'`][] event. Rather, such messages are emitted using the `'internalMessage'` event and are consumed internally by Node.js. Приложения должны избегать использования таких сообщений или прослушивания событий `'internalMessage'`, поскольку они могут быть изменены без предварительного уведомления.

Необязательный аргумент `sendHandle`, который может быть передан `subprocess.send()`, существует для передачи сервера TCP или объекта сокета дочернему процессу. The child will receive the object as the second argument passed to the callback function registered on the [`'message'`][] event. Любые данные, которые получены и буферизированы в сокете, не будут отправляться дочернему процессу.

Опциональная функция `callback` - это функция, которая вызывается после отправки сообщения, но до того, как дочерний процесс его получит. Функция вызывается только с одним аргументом: `null` - в случае удачи или объект [`Error`][] - в случае неудачи.

Если функция `callback` не предоставляется и сообщение не может быть отправлено, событие `'error'` будет создаваться объектом [`ChildProcess`][]. Например, это может произойти, когда дочерний процесс уже завершился.

`subprocess.send()` будет возвращать `false`, если канал закрыт или когда отставание неотправленных сообщений превышает порог, выше которого дальнейшая отправка сообщений нецелесообразна. В противном случае, метод возвращает `true`. Функция `callback` может использоваться для реализации управления потоком.

#### Пример: отправка объекта сервера

Аргумент `sendHandle` может использоваться, например, для передачи обработчика объекта сервера TCP дочернему процессу, как показано в примере ниже:

```js
const subprocess = require('child_process').fork('subprocess.js');

// Открыть объект сервера и отправить обработчик.
const server = require('net').createServer();
server.on('connection', (socket) => {
  socket.end('handled by parent');
});
server.listen(1337, () => {
  subprocess.send('server', server);
});
```

Дочерний процесс тогда получит объект сервера как:

```js
process.on('message', (m, server) => {
  if (m === 'server') {
    server.on('connection', (socket) => {
      socket.end('handled by child');
    });
  }
});
```

Как только сервер разделен между родительским и дочерним процессами, некоторые соединения могут обрабатываться родительским процессом, а некоторые - дочерним.

Хотя приведенный выше пример использует сервер, созданный при помощи модуля `net`, серверы модуля `dgram` используют точно такой же рабочий процесс за исключением прослушивания события `'message'` вместо `'connection'` и использования `server.bind()` вместо `server.listen()`. Однако в настоящее время это поддерживается только на платформах UNIX.

#### Пример: отправка объекта сокета

Аналогичным образом аргумент `sendHandler` может использоваться для передачи обработчика сокета дочернему процессу. В нижеприведенном примере создаются два дочерних процесса, каждый из которых обрабатывает соединения с "нормальным" или "специальным" приоритетом:

```js
const { fork } = require('child_process');
const normal = fork('subprocess.js', ['normal']);
const special = fork('subprocess.js', ['special']);

// Открыть сервер и отправить сокеты дочернему процессу. Используйте pauseOnConnect для предотвращения
// чтения сокетов перед их отправкой дочернему процессу.
const server = require('net').createServer({ pauseOnConnect: true });
server.on('connection', (socket) => {

  // Если специальный приоритет 
  if (socket.remoteAddress === '74.125.127.100') {
    special.send('socket', socket);
    return;
  }
  // Это нормальный приоритет
  normal.send('socket', socket);
});
server.listen(1337);
```

`subprocess.js` будет получать обработчик сокета в качестве второго аргумента, передаваемого событию функции обратного вызова:

```js
process.on('message', (m, socket) => {
  if (m === 'socket') {
    if (socket) {
      // Проверяем, что клиентский сокет существует.
      // Сокет может быть закрыт между временем, когда он был
      // отправлен и временем, когда он доставлен в дочерний процесс.
      socket.end(`Request handled with ${process.argv[2]} priority`);
    }
  }
});
```

После того, как сокет был отправлен дочернему процессу, родительский процесс более не способен отслеживать, когда уничтожается сокет. Чтобы указать это, свойство `.connections` становится `null`. Рекомендуется не использовать `.maxConnections`, когда это происходит.

Также рекомендуется, чтобы любой обработчик `'message'` в дочернем процессе проверял, что `socket` существует, поскольку соединение может быть закрыто в течение времени, необходимого для отправки соединения дочернему процессу.

### subprocess.stderr
<!-- YAML
added: v0.1.90
-->

* {stream.Readable}

`Readable Stream`, который представляет `stderr` дочернего процесса.

Если дочерний процесс был создан с `stdio[2]`, для которого установлено любое значение, кроме `'pipe'`, тогда это будет `null`.

`subprocess.stderr` является псевдонимом для `subprocess.stdio[2]`. Оба свойства будут ссылаться на одно и то же значение.

### subprocess.stdin
<!-- YAML
added: v0.1.90
-->

* {stream.Writable}

`Writable Stream`, который представляет `stdin` дочернего процесса.

*Обратите внимание, если дочерний процесс ожидает чтения всех своих входных данных, он не будет продолжаться, пока этот поток не будет закрыт через `end()`.*

Если дочерний процесс был создан с `stdio[0]`, для которого установлено любое значение, кроме `'pipe'`, тогда это будет `null`.

`subprocess.stdin` является псевдонимом для `subprocess.stdio[0]`. Оба свойства будут ссылаться на одно и то же значение.

### subprocess.stdio
<!-- YAML
added: v0.7.10
-->

* {Array}

Разреженный массив каналов, ведущих к дочернему процессу, который соответствует позициям в опции [`stdio`][], переданных [`child_process.spawn()`][], установленным на значение `'pipe'`. Обратите внимание, что `subprocess.stdio[0]`, `subprocess.stdio[1]` и `subprocess.stdio[2]` также доступны как `subprocess.stdin`, `subprocess.stdout` и `subprocess.stderr` соответственно.

В следующем примере только fd дочернего процесса `1` (stdout) настроен как канал, поэтому только `subprocess.stdio[1]` родительского процесса является потоком; все остальные значения в массиве являются `null`.

```js
const assert = require('assert');
const fs = require('fs');
const child_process = require('child_process');

const subprocess = child_process.spawn('ls', {
  stdio: [
    0, // Использовать stdin родительского процесса для дочернего
    'pipe', // Канал stdout дочернего процесса к родительскому
    fs.openSync('err.out', 'w') // Направить stderr дочернего процесса в файл
  ]
});

assert.strictEqual(subprocess.stdio[0], null);
assert.strictEqual(subprocess.stdio[0], subprocess.stdin);

assert(subprocess.stdout);
assert.strictEqual(subprocess.stdio[1], subprocess.stdout);

assert.strictEqual(subprocess.stdio[2], null);
assert.strictEqual(subprocess.stdio[2], subprocess.stderr);
```

### subprocess.stdout
<!-- YAML
added: v0.1.90
-->

* {stream.Readable}

`Readable Stream`, который представляет `stdout` дочернего процесса.

Если дочерний процесс был создан с `stdio[1]`, для которого установлено любое значение, кроме `'pipe'`, тогда это будет `null`.

`subprocess.stdout` является псевдонимом для `subprocess.stdio[1]`. Оба свойства будут ссылаться на одно и то же значение.

### subprocess.unref()
<!-- YAML
added: v0.7.10
-->

По умолчанию родительский процесс будет ждать выхода отделенного дочернего процесса. To prevent the parent from waiting for a given `subprocess` to exit, use the `subprocess.unref()` method. Doing so will cause the parent's event loop to not include the child in its reference count, allowing the parent to exit independently of the child, unless there is an established IPC channel between the child and the parent.

```js
const { spawn } = require('child_process');

const subprocess = spawn(process.argv[0], ['child_program.js'], {
  detached: true,
  stdio: 'ignore'
});

subprocess.unref();
```

## `maxBuffer` и Юникод

Опция `maxBuffer` задает наибольшее количество байтов, допустимых в `stdout` или `stderr`. Если это значение превышено, дочерний процесс завершается. Это влияет на выход, который содержит многобайтовые кодировки символов, такие как UTF-8 или UTF-16. Например, `console.log('中文测试')` отправит 13 байтов в кодировке UTF-8 в `stdout`, хотя в наличии только 4 символа.

## Shell Requirements

The shell should understand the `-c` switch on UNIX or `/d /s /c` on Windows. On Windows, command line parsing should be compatible with `'cmd.exe'`.

## Default Windows Shell

Although Microsoft specifies `%COMSPEC%` must contain the path to `'cmd.exe'` in the root environment, child processes are not always subject to the same requirement. Thus, in `child_process` functions where a shell can be spawned, `'cmd.exe'` is used as a fallback if `process.env.ComSpec` is unavailable.
