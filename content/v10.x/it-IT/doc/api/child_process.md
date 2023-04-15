# Child Process

<!--introduced_in=v0.10.0-->

<!--lint disable maximum-line-length-->

> Stabilità: 2 - Stabile

The `child_process` module provides the ability to spawn child processes in a manner that is similar, but not identical, to popen(3). This capability is primarily provided by the [`child_process.spawn()`][] function:

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

The [`child_process.spawn()`][] method spawns the child process asynchronously, without blocking the Node.js event loop. The [`child_process.spawnSync()`][] function provides equivalent functionality in a synchronous manner that blocks the event loop until the spawned process either exits or is terminated.

For convenience, the `child_process` module provides a handful of synchronous and asynchronous alternatives to [`child_process.spawn()`][] and [`child_process.spawnSync()`][]. *Note that each of these alternatives are implemented on top of [`child_process.spawn()`][] or [`child_process.spawnSync()`][].*

    * [`child_process.exec()`][]: spawns a shell and runs a command within that shell, passing the `stdout` and `stderr` to a callback function when complete.
    * [`child_process.execFile()`][]: similar to [`child_process.exec()`][] except that it spawns the command directly without first spawning a shell by default.
    * [`child_process.fork()`][]: spawns a new Node.js process and invokes a specified module with an IPC communication channel established that allows sending messages between parent and child.
    * [`child_process.execSync()`][]: a synchronous version of [`child_process.exec()`][] that *will* block the Node.js event loop.
    * [`child_process.execFileSync()`][]: a synchronous version of [`child_process.execFile()`][] that *will* block the Node.js event loop.
    

For certain use cases, such as automating shell scripts, the [synchronous counterparts](#child_process_synchronous_process_creation) may be more convenient. In many cases, however, the synchronous methods can have significant impact on performance due to stalling the event loop while spawned processes complete.

## Creazione di Processi Asincroni

The [`child_process.spawn()`][], [`child_process.fork()`][], [`child_process.exec()`][], and [`child_process.execFile()`][] methods all follow the idiomatic asynchronous programming pattern typical of other Node.js APIs.

Ciascun metodo restituisce un'istanza [`ChildProcess`][]. These objects implement the Node.js [`EventEmitter`][] API, allowing the parent process to register listener functions that are called when certain events occur during the life cycle of the child process.

The [`child_process.exec()`][] and [`child_process.execFile()`][] methods additionally allow for an optional `callback` function to be specified that is invoked when the child process terminates.

### Generare i file `.bat` e `.cmd` su Windows

The importance of the distinction between [`child_process.exec()`][] and [`child_process.execFile()`][] can vary based on platform. On Unix-type operating systems (Unix, Linux, macOS) [`child_process.execFile()`][] can be more efficient because it does not spawn a shell by default. On Windows, however, `.bat` and `.cmd` files are not executable on their own without a terminal, and therefore cannot be launched using [`child_process.execFile()`][]. When running on Windows, `.bat` and `.cmd` files can be invoked using [`child_process.spawn()`][] with the `shell` option set, with [`child_process.exec()`][], or by spawning `cmd.exe` and passing the `.bat` or `.cmd` file as an argument (which is what the `shell` option and [`child_process.exec()`][] do). In any case, if the script filename contains spaces it needs to be quoted.

```js
// Solo su Windows ...
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
// OPPURE...
const { exec } = require('child_process');
exec('my.bat', (err, stdout, stderr) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(stdout);
});

// Script con spazi nel filename:
const bat = spawn('"my script.cmd"', ['a', 'b'], { shell: true });
// oppure:
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

* `command` {string} Il comando da eseguire, con argomenti separati dallo spazio.
* `options` {Object} 
  * `cwd` {string} Attuale directory di lavoro del processo child. **Default:** `null`.
  * `env` {Object} Coppie key-value dell'ambiente. **Default:** `null`.
  * `encoding` {string} **Default:** `'utf8'`
  * `shell` {string} La Shell con la quale eseguire il comando. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `'/bin/sh'` on UNIX, `process.env.ComSpec` on Windows.
  * `timeout` {number} **Default:** `0`
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated and any output is truncated. See caveat at [`maxBuffer` and Unicode][]. **Default:** `200 * 1024`.
  * `killSignal` {string|integer} **Default:** `'SIGTERM'`
  * `uid` {number} Imposta l'identità dell'utente (user identity) del processo (vedi setuid(2)).
  * `gid` {number} Imposta l'identità di gruppo (group identity) del processo (vedi setgid(2)).
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
* `callback` {Function} chiamata con l'output al termine del processo. 
  * `error` {Error}
  * `stdout` {string|Buffer}
  * `stderr` {string|Buffer}
* Restituisce: {ChildProcess}

Spawns a shell then executes the `command` within that shell, buffering any generated output. The `command` string passed to the exec function is processed directly by the shell and special characters (vary based on [shell](https://en.wikipedia.org/wiki/List_of_command-line_interpreters)) need to be dealt with accordingly:

```js
exec('"/path/to/test file/test.sh" arg1 arg2');
// Le virgolette vengono utilizzate in modo che lo spazio nel percorso (path) non venga interpretato come
// più argomenti

exec('echo "The \\$HOME variable is $HOME"');
// La variabile $HOME è sottoposta all'escape nella prima istanza, ma non nella seconda
```

**Non passare mai l'input unsanitized user a questa funzione. Any input containing shell metacharacters may be used to trigger arbitrary command execution.**

If a `callback` function is provided, it is called with the arguments `(error, stdout, stderr)`. In caso di successo, `error` sarà `null`. On error, `error` will be an instance of [`Error`][]. The `error.code` property will be the exit code of the child process while `error.signal` will be set to the signal that terminated the process. Any exit code other than `0` is considered to be an error.

The `stdout` and `stderr` arguments passed to the callback will contain the stdout and stderr output of the child process. By default, Node.js will decode the output as UTF-8 and pass strings to the callback. The `encoding` option can be used to specify the character encoding used to decode the stdout and stderr output. If `encoding` is `'buffer'`, or an unrecognized character encoding, `Buffer` objects will be passed to the callback instead.

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

If `timeout` is greater than `0`, the parent will send the signal identified by the `killSignal` property (the default is `'SIGTERM'`) if the child runs longer than `timeout` milliseconds.

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

* `file` {string} Il nome o il percorso del file eseguibile da avviare.
* `args` {string[]} Elenco degli argomenti di string.
* `options` {Object} 
  * `cwd` {string} Attuale directory di lavoro del processo child.
  * `env` {Object} Coppie key-value dell'ambiente.
  * `encoding` {string} **Default:** `'utf8'`
  * `timeout` {number} **Default:** `0`
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated and any output is truncated. See caveat at [`maxBuffer` and Unicode][]. **Default:** `200 * 1024`.
  * `killSignal` {string|integer} **Default:** `'SIGTERM'`
  * `uid` {number} Imposta l'identità dell'utente (user identity) del processo (vedi setuid(2)).
  * `gid` {number} Imposta l'identità di gruppo (group identity) del processo (vedi setgid(2)).
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
  * `windowsVerbatimArguments` {boolean} No quoting or escaping of arguments is done on Windows. Ignorato su Unix. **Default:** `false`.
  * `shell` {boolean|string} Se `true`, esegue `command` all'interno di una shell. Uses `'/bin/sh'` on UNIX, and `process.env.ComSpec` on Windows. A different shell can be specified as a string. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `false` (nessuna shell).
* `callback` {Function} Chiamata con l'output al termine del processo. 
  * `error` {Error}
  * `stdout` {string|Buffer}
  * `stderr` {string|Buffer}
* Restituisce: {ChildProcess}

The `child_process.execFile()` function is similar to [`child_process.exec()`][] except that it does not spawn a shell by default. Rather, the specified executable `file` is spawned directly as a new process making it slightly more efficient than [`child_process.exec()`][].

Sono supportate le stesse opzioni di [`child_process.exec()`][]. Since a shell is not spawned, behaviors such as I/O redirection and file globbing are not supported.

```js
const { execFile } = require('child_process');
const child = execFile('node', ['--version'], (error, stdout, stderr) => {
  if (error) {
    throw error;
  }
  console.log(stdout);
});
```

The `stdout` and `stderr` arguments passed to the callback will contain the stdout and stderr output of the child process. By default, Node.js will decode the output as UTF-8 and pass strings to the callback. The `encoding` option can be used to specify the character encoding used to decode the stdout and stderr output. If `encoding` is `'buffer'`, or an unrecognized character encoding, `Buffer` objects will be passed to the callback instead.

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

* `modulePath` {string} Il modulo da eseguire nel child.
* `args` {string[]} Elenco degli argomenti di string.
* `options` {Object} 
  * `cwd` {string} Attuale directory di lavoro del processo child.
  * `detached` {boolean} Prepare child to run independently of its parent process. Specific behavior depends on the platform, see [`options.detached`][]).
  * `env` {Object} Coppie key-value dell'ambiente.
  * `execPath` {string} Eseguibile utilizzato per creare il processo child.
  * `execArgv` {string[]} Elenco degli argomenti di string passati all'eseguibile. **Default:** `process.execArgv`.
  * `silent` {boolean} If `true`, stdin, stdout, and stderr of the child will be piped to the parent, otherwise they will be inherited from the parent, see the `'pipe'` and `'inherit'` options for [`child_process.spawn()`][]'s [`stdio`][] for more details. **Default:** `false`.
  * `stdio` {Array|string} Vedi lo [`stdio`][] di [`child_process.spawn()`][]. Quando viene fornita quest'opzione, esegue l'override di `silent`. If the array variant is used, it must contain exactly one item with value `'ipc'` or an error will be thrown. Per esempio `[0, 1, 2, 'ipc']`.
  * `windowsVerbatimArguments` {boolean} No quoting or escaping of arguments is done on Windows. Ignorato su Unix. **Default:** `false`.
  * `uid` {number} Imposta l'identità dell'utente (user identity) del processo (vedi setuid(2)).
  * `gid` {number} Imposta l'identità di gruppo (group identity) del processo (vedi setgid(2)).
* Restituisce: {ChildProcess}

The `child_process.fork()` method is a special case of [`child_process.spawn()`][] used specifically to spawn new Node.js processes. Così come con [`child_process.spawn()`][], viene restituito un [`ChildProcess`][] object. The returned [`ChildProcess`][] will have an additional communication channel built-in that allows messages to be passed back and forth between the parent and child. See [`subprocess.send()`][] for details.

It is important to keep in mind that spawned Node.js child processes are independent of the parent with exception of the IPC communication channel that is established between the two. Each process has its own memory, with their own V8 instances. Because of the additional resource allocations required, spawning a large number of child Node.js processes is not recommended.

By default, `child_process.fork()` will spawn new Node.js instances using the [`process.execPath`][] of the parent process. The `execPath` property in the `options` object allows for an alternative execution path to be used.

Node.js processes launched with a custom `execPath` will communicate with the parent process using the file descriptor (fd) identified using the environment variable `NODE_CHANNEL_FD` on the child process.

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

* `command` {string} Il comando da eseguire.
* `args` {string[]} Elenco degli argomenti di string.
* `options` {Object} 
  * `cwd` {string} Attuale directory di lavoro del processo child.
  * `env` {Object} Coppie key-value dell'ambiente.
  * `argv0` {string} Explicitly set the value of `argv[0]` sent to the child process. Questo sarà impostato su `command` se non specificato.
  * `stdio` {Array|string} Child's stdio configuration (see [`options.stdio`][`stdio`]).
  * `detached` {boolean} Prepare child to run independently of its parent process. Specific behavior depends on the platform, see [`options.detached`][]).
  * `uid` {number} Imposta l'identità dell'utente (user identity) del processo (vedi setuid(2)).
  * `gid` {number} Imposta l'identità di gruppo (group identity) del processo (vedi setgid(2)).
  * `shell` {boolean|string} Se `true`, esegue `command` all'interno di una shell. Uses `'/bin/sh'` on UNIX, and `process.env.ComSpec` on Windows. A different shell can be specified as a string. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `false` (nessuna shell).
  * `windowsVerbatimArguments` {boolean} No quoting or escaping of arguments is done on Windows. Ignorato su Unix. This is set to `true` automatically when `shell` is specified. **Default:** `false`.
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
* Restituisce: {ChildProcess}

The `child_process.spawn()` method spawns a new process using the given `command`, with command line arguments in `args`. If omitted, `args` defaults to an empty array.

**If the `shell` option is enabled, do not pass unsanitized user input to this function. Any input containing shell metacharacters may be used to trigger arbitrary command execution.**

Un terzo argomento può essere usato per specificare ulteriori opzioni, con questi valori di default:

```js
const defaults = {
  cwd: undefined,
  env: process.env
};
```

Utilizza `cwd` per specificare la directory di lavoro dalla quale viene generato il processo. Se non specificata, l'impostazione predefinita consiste nell'ereditare l'attuale directory di lavoro.

Use `env` to specify environment variables that will be visible to the new process, the default is [`process.env`][].

I valori `undefined` in `env` saranno ignorati.

Example of running `ls -lh /usr`, capturing `stdout`, `stderr`, and the exit code:

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

Esempio: Un modo molto elaborato per eseguire `ps ax | grep ssh`

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

Esempio di controllo per `spawn` fallito:

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

On Windows, setting `options.detached` to `true` makes it possible for the child process to continue running after the parent exits. The child will have its own console window. *Once enabled for a child process, it cannot be disabled*.

On non-Windows platforms, if `options.detached` is set to `true`, the child process will be made the leader of a new process group and session. Note that child processes may continue running after the parent exits regardless of whether they are detached or not. Vedi setsid(2) per maggiori informazioni.

Di default, il parent aspetterà che il child distaccato si concluda. To prevent the parent from waiting for a given `subprocess` to exit, use the `subprocess.unref()` method. Doing so will cause the parent's event loop to not include the child in its reference count, allowing the parent to exit independently of the child, unless there is an established IPC channel between the child and the parent.

When using the `detached` option to start a long-running process, the process will not stay running in the background after the parent exits unless it is provided with a `stdio` configuration that is not connected to the parent. If the parent's `stdio` is inherited, the child will remain attached to the controlling terminal.

Example of a long-running process, by detaching and also ignoring its parent `stdio` file descriptors, in order to ignore the parent's termination:

```js
const { spawn } = require('child_process');

const subprocess = spawn(process.argv[0], ['child_program.js'], {
  detached: true,
  stdio: 'ignore'
});

subprocess.unref();
```

In alternativa, è possibile reindirizzare l'output del processo child all'interno dei file:

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

The `options.stdio` option is used to configure the pipes that are established between the parent and child process. By default, the child's stdin, stdout, and stderr are redirected to corresponding [`subprocess.stdin`][], [`subprocess.stdout`][], and [`subprocess.stderr`][] streams on the [`ChildProcess`][] object. This is equivalent to setting the `options.stdio` equal to `['pipe', 'pipe', 'pipe']`.

Per comodità, `options.stdio` potrebbe essere una delle seguenti stringhe:

* `'pipe'` - equivalente a `['pipe', 'pipe', 'pipe']` (il valore predefinito)
* `'ignore'` - equivalente a `['ignore', 'ignore', 'ignore']`
* `'inherit'` - equivalent to `['inherit', 'inherit', 'inherit']` or `[0, 1, 2]`

Otherwise, the value of `options.stdio` is an array where each index corresponds to an fd in the child. The fds 0, 1, and 2 correspond to stdin, stdout, and stderr, respectively. Additional fds can be specified to create additional pipes between the parent and child. Il valore è uno dei seguenti:

1. `'pipe'` - Crea un pipe tra i processi child e parent. The parent end of the pipe is exposed to the parent as a property on the `child_process` object as [`subprocess.stdio[fd]`][`stdio`]. Pipes created for fds 0 - 2 are also available as [`subprocess.stdin`][], [`subprocess.stdout`][] and [`subprocess.stderr`][], respectively.
2. `'ipc'` - Create an IPC channel for passing messages/file descriptors between parent and child. A [`ChildProcess`][] may have at most *one* IPC stdio file descriptor. Setting this option enables the [`subprocess.send()`][] method. If the child is a Node.js process, the presence of an IPC channel will enable [`process.send()`][] and [`process.disconnect()`][] methods, as well as [`'disconnect'`][] and [`'message'`][] events within the child.
  
  Accessing the IPC channel fd in any way other than [`process.send()`][] or using the IPC channel with a child process that is not a Node.js instance is not supported.

3. `'ignore'` - Dà a Node.js l'istruzione di ignorare il file descriptor all'interno del child. While Node.js will always open fds 0 - 2 for the processes it spawns, setting the fd to `'ignore'` will cause Node.js to open `/dev/null` and attach it to the child's fd.

4. `'inherit'` - Pass through the corresponding stdio stream to/from the parent process. In the first three positions, this is equivalent to `process.stdin`, `process.stdout`, and `process.stderr`, respectively. In any other position, equivalent to `'ignore'`.
5. {Stream} object - Share a readable or writable stream that refers to a tty, file, socket, or a pipe with the child process. The stream's underlying file descriptor is duplicated in the child process to the fd that corresponds to the index in the `stdio` array. Note that the stream must have an underlying descriptor (file streams do not until the `'open'` event has occurred).
6. Positive integer - The integer value is interpreted as a file descriptor that is currently open in the parent process. It is shared with the child process, similar to how {Stream} objects can be shared. Passing sockets is not supported on Windows.
7. `null`, `undefined` - Utilizzano il valore predefinito. For stdio fds 0, 1, and 2 (in other words, stdin, stdout, and stderr) a pipe is created. For fd 3 and up, the default is `'ignore'`.

```js
const { spawn } = require('child_process');

// Il child utilizzerà gli stdio del parent
spawn('prg', [], { stdio: 'inherit' });

// Genera un child che condivide solo stderr
spawn('prg', [], { stdio: ['pipe', 'pipe', process.stderr] });

// Apre un extra fd = 4, per interagire con i programmi che presentano 
// un'interfaccia in stile startd.
spawn('prg', [], { stdio: ['pipe', null, null, null, 'pipe'] });
```

*It is worth noting that when an IPC channel is established between the parent and child processes, and the child is a Node.js process, the child is launched with the IPC channel unreferenced (using `unref()`) until the child registers an event handler for the [`'disconnect'`][] event or the [`'message'`][] event. This allows the child to exit normally without the process being held open by the open IPC channel.*

On UNIX-like operating systems, the [`child_process.spawn()`][] method performs memory operations synchronously before decoupling the event loop from the child. Applications with a large memory footprint may find frequent [`child_process.spawn()`][] calls to be a bottleneck. For more information, see [V8 issue 7381](https://bugs.chromium.org/p/v8/issues/detail?id=7381).

Vedi anche: [`child_process.exec()`][] e [`child_process.fork()`][].

## Creazione di Processi Sincroni

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

* `file` {string} Il nome o il percorso del file eseguibile da avviare.
* `args` {string[]} Elenco degli argomenti di string.
* `options` {Object} 
  * `cwd` {string} Attuale directory di lavoro del processo child.
  * `input` {string|Buffer|TypedArray|DataView} The value which will be passed as stdin to the spawned process. Fornendo questo valore `stdio[0]` verrà sottoposto all'override.
  * `stdio` {string|Array} Configurazione stdio del child. `stderr` by default will be output to the parent process' stderr unless `stdio` is specified. **Default:** `'pipe'`.
  * `env` {Object} Coppie key-value dell'ambiente.
  * `uid` {number} Imposta l'identità dell'utente (user identity) del processo (vedi setuid(2)).
  * `gid` {number} Imposta l'identità di gruppo (group identity) del processo (vedi setgid(2)).
  * `timeout` {number} In milliseconds the maximum amount of time the process is allowed to run. **Default:** `undefined`.
  * `killSignal` {string|integer} The signal value to be used when the spawned process will be killed. **Default:** `'SIGTERM'`.
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. Se superata, il processo child viene concluso. See caveat at [`maxBuffer` and Unicode][]. **Default:** `200 * 1024`.
  * `encoding` {string} L'encoding (codifica) utilizzata per tutti gli input e gli output stdio. **Default:** `'buffer'`.
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
  * `shell` {boolean|string} Se `true`, esegue `command` all'interno di una shell. Uses `'/bin/sh'` on UNIX, and `process.env.ComSpec` on Windows. A different shell can be specified as a string. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `false` (nessuna shell).
* Restituisce: {Buffer|string} Lo stdout dal comando.

The `child_process.execFileSync()` method is generally identical to [`child_process.execFile()`][] with the exception that the method will not return until the child process has fully closed. When a timeout has been encountered and `killSignal` is sent, the method won't return until the process has completely exited.

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

* `command` {string} Il comando da eseguire.
* `options` {Object} 
  * `cwd` {string} Attuale directory di lavoro del processo child.
  * `input` {string|Buffer|TypedArray|DataView} The value which will be passed as stdin to the spawned process. Fornendo questo valore `stdio[0]` verrà sottoposto all'override.
  * `stdio` {string|Array} Configurazione stdio del child. `stderr` by default will be output to the parent process' stderr unless `stdio` is specified. **Default:** `'pipe'`.
  * `env` {Object} Coppie key-value dell'ambiente.
  * `shell` {string} La Shell con la quale eseguire il comando. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `'/bin/sh'` on UNIX, `process.env.ComSpec` on Windows.
  * `uid` {number} Imposta l'identità dell'utente (user identity) del processo. (Vedi setuid(2)).
  * `gid` {number} Imposta l'identità di gruppo (group identity) del processo. (Vedi setgid(2)).
  * `timeout` {number} In milliseconds the maximum amount of time the process is allowed to run. **Default:** `undefined`.
  * `killSignal` {string|integer} The signal value to be used when the spawned process will be killed. **Default:** `'SIGTERM'`.
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated and any output is truncated. See caveat at [`maxBuffer` and Unicode][]. **Default:** `200 * 1024`.
  * `encoding` {string} L'encoding (codifica) utilizzata per tutti gli input e gli output stdio. **Default:** `'buffer'`.
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
* Restituisce: {Buffer|string} Lo stdout dal comando.

The `child_process.execSync()` method is generally identical to [`child_process.exec()`][] with the exception that the method will not return until the child process has fully closed. When a timeout has been encountered and `killSignal` is sent, the method won't return until the process has completely exited. *Note that if the child process intercepts and handles the `SIGTERM` signal and doesn't exit, the parent process will wait until the child process has exited.*

If the process times out or has a non-zero exit code, this method ***will*** throw. The [`Error`][] object will contain the entire result from [`child_process.spawnSync()`][].

**Non passare mai l'input unsanitized user a questa funzione. Any input containing shell metacharacters may be used to trigger arbitrary command execution.**

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

* `command` {string} Il comando da eseguire.
* `args` {string[]} Elenco degli argomenti di string.
* `options` {Object} 
  * `cwd` {string} Attuale directory di lavoro del processo child.
  * `input` {string|Buffer|TypedArray|DataView} The value which will be passed as stdin to the spawned process. Fornendo questo valore `stdio[0]` verrà sottoposto all'override.
  * `argv0` {string} Explicitly set the value of `argv[0]` sent to the child process. Questo sarà impostato su `command` se non specificato.
  * `stdio` {string|Array} Configurazione stdio del child.
  * `env` {Object} Coppie key-value dell'ambiente.
  * `uid` {number} Imposta l'identità dell'utente (user identity) del processo (vedi setuid(2)).
  * `gid` {number} Imposta l'identità di gruppo (group identity) del processo (vedi setgid(2)).
  * `timeout` {number} In milliseconds the maximum amount of time the process is allowed to run. **Default:** `undefined`.
  * `killSignal` {string|integer} The signal value to be used when the spawned process will be killed. **Default:** `'SIGTERM'`.
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated and any output is truncated. See caveat at [`maxBuffer` and Unicode][]. **Default:** `200 * 1024`.
  * `encoding` {string} L'encoding (codifica) utilizzata per tutti gli input e gli output stdio. **Default:** `'buffer'`.
  * `shell` {boolean|string} Se `true`, esegue `command` all'interno di una shell. Uses `'/bin/sh'` on UNIX, and `process.env.ComSpec` on Windows. A different shell can be specified as a string. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `false` (nessuna shell).
  * `windowsVerbatimArguments` {boolean} No quoting or escaping of arguments is done on Windows. Ignorato su Unix. This is set to `true` automatically when `shell` is specified. **Default:** `false`.
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
* Restituisce: {Object} 
  * `pid` {number} Pid (Process Identifier) del processo child.
  * `output` {Array} Array dei risultati provenienti dall'output di stdio.
  * `stdout` {Buffer|string} Il contenuto di `output[1]`.
  * `stderr` {Buffer|string} Il contenuto di `output[2]`.
  * `status` {number|null} The exit code of the subprocess, or `null` if the subprocess terminated due to a signal.
  * `signal` {string|null} The signal used to kill the subprocess, or `null` if the subprocess did not terminate due to a signal.
  * `error` {Error} L'error object se il processo child ha avuto esito negativo oppure è scaduto (timeout).

The `child_process.spawnSync()` method is generally identical to [`child_process.spawn()`][] with the exception that the function will not return until the child process has fully closed. When a timeout has been encountered and `killSignal` is sent, the method won't return until the process has completely exited. Note that if the process intercepts and handles the `SIGTERM` signal and doesn't exit, the parent process will wait until the child process has exited.

**If the `shell` option is enabled, do not pass unsanitized user input to this function. Any input containing shell metacharacters may be used to trigger arbitrary command execution.**

## Class: ChildProcess

<!-- YAML
added: v2.2.0
-->

Instances of the `ChildProcess` class are [`EventEmitters`][`EventEmitter`] that represent spawned child processes.

Le istanze di `ChildProcess` non devono essere create direttamente. Rather, use the [`child_process.spawn()`][], [`child_process.exec()`][], [`child_process.execFile()`][], or [`child_process.fork()`][] methods to create instances of `ChildProcess`.

### Event: 'close'

<!-- YAML
added: v0.7.7
-->

* `code` {number} Il valore di uscita se il child si è concluso autonomamente.
* `signal` {string} Il segnale con cui è stato terminato il processo child.

The `'close'` event is emitted when the stdio streams of a child process have been closed. This is distinct from the [`'exit'`][] event, since multiple processes might share the same stdio streams.

### Event: 'disconnect'

<!-- YAML
added: v0.7.2
-->

The `'disconnect'` event is emitted after calling the [`subprocess.disconnect()`][] method in parent process or [`process.disconnect()`][] in child process. After disconnecting it is no longer possible to send or receive messages, and the [`subprocess.connected`][] property is `false`.

### Event: 'error'

* `err` {Error} L'errore.

L'evento `'error'` viene emesso ogni volta che:

1. Non è stato possibile generare il processo, oppure
2. Non è stato possibile arrestare il processo, oppure
3. Non è andato a buon fine l'invio di un messaggio al processo child.

L'evento `'exit'` può o non può funzionare dopo che si è verificato un errore. When listening to both the `'exit'` and `'error'` events, it is important to guard against accidentally invoking handler functions multiple times.

Vedi anche [`subprocess.kill()`][] e [`subprocess.send()`][].

### Event: 'exit'

<!-- YAML
added: v0.1.90
-->

* `code` {number} Il valore di uscita se il child si è concluso autonomamente.
* `signal` {string} Il segnale con cui è stato terminato il processo child.

L'evento `'exit'` viene emesso al termine del processo child. If the process exited, `code` is the final exit code of the process, otherwise `null`. If the process terminated due to receipt of a signal, `signal` is the string name of the signal, otherwise `null`. Uno dei due sarà sempre non nullo.

Note that when the `'exit'` event is triggered, child process stdio streams might still be open.

Also, note that Node.js establishes signal handlers for `SIGINT` and `SIGTERM` and Node.js processes will not terminate immediately due to receipt of those signals. Rather, Node.js will perform a sequence of cleanup actions and then will re-raise the handled signal.

Vedi waitpid(2).

### Event: 'message'

<!-- YAML
added: v0.5.9
-->

* `message` {Object} Un JSON object analizzato tramite il parsing oppure un valore primitivo.
* `sendHandle` {Handle} A [`net.Socket`][] or [`net.Server`][] object, or undefined.

The `'message'` event is triggered when a child process uses [`process.send()`][] to send messages.

Il messaggio passa attraverso la serializzazione e il parsing. The resulting message might not be the same as what is originally sent.

### subprocess.channel

<!-- YAML
added: v7.1.0
-->

* {Object} Un pipe che rappresenta il canale IPC per il processo child.

La proprietà `subprocess.channel` è un riferimento al canale IPC del child. If no IPC channel currently exists, this property is `undefined`.

### subprocess.connected

<!-- YAML
added: v0.7.2
-->

* {boolean} Impostata su `false` dopo che viene chiamato `subprocess.disconnect()`.

The `subprocess.connected` property indicates whether it is still possible to send and receive messages from a child process. When `subprocess.connected` is `false`, it is no longer possible to send or receive messages.

### subprocess.disconnect()

<!-- YAML
added: v0.7.2
-->

Closes the IPC channel between parent and child, allowing the child to exit gracefully once there are no other connections keeping it alive. After calling this method the `subprocess.connected` and `process.connected` properties in both the parent and child (respectively) will be set to `false`, and it will be no longer possible to pass messages between the processes.

The `'disconnect'` event will be emitted when there are no messages in the process of being received. This will most often be triggered immediately after calling `subprocess.disconnect()`.

Note that when the child process is a Node.js instance (e.g. spawned using [`child_process.fork()`]), the `process.disconnect()` method can be invoked within the child process to close the IPC channel as well.

### subprocess.kill([signal])

<!-- YAML
added: v0.1.90
-->

* `signal` {string}

Il metodo `subprocess.kill()` invia un segnale al processo child. If no argument is given, the process will be sent the `'SIGTERM'` signal. See signal(7) for a list of available signals.

```js
const { spawn } = require('child_process');
const grep = spawn('grep', ['ssh']);

grep.on('close', (code, signal) => {
  console.log(
    `child process terminated due to receipt of signal ${signal}`);
});

// Invia SIGHUP al processo
grep.kill('SIGHUP');
```

The [`ChildProcess`][] object may emit an [`'error'`][] event if the signal cannot be delivered. Sending a signal to a child process that has already exited is not an error but may have unforeseen consequences. Specifically, if the process identifier (PID) has been reassigned to another process, the signal will be delivered to that process instead which can have unexpected results.

Note that while the function is called `kill`, the signal delivered to the child process may not actually terminate the process.

Vedi kill(2) come riferimento.

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
  subprocess.kill(); // non termina il processo del nodo nella shell
}, 2000);
```

### subprocess.killed

<!-- YAML
added: v0.5.10
-->

* {boolean} Set to `true` after `subprocess.kill()` is used to successfully send a signal to the child process.

The `subprocess.killed` property indicates whether the child process successfully received a signal from `subprocess.kill()`. The `killed` property does not indicate that the child process has been terminated.

### subprocess.pid

<!-- YAML
added: v0.1.90
-->

* {integer}

Restituisce il process identifier (PID) del processo child.

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
  * `keepOpen` {boolean} A value that can be used when passing instances of `net.Socket`. Quando è `true`, il socket viene mantenuto aperto nel processo di invio. **Default:** `false`.
* `callback` {Function}
* Restituisce: {boolean}

When an IPC channel has been established between the parent and child ( i.e. when using [`child_process.fork()`][]), the `subprocess.send()` method can be used to send messages to the child process. When the child process is a Node.js instance, these messages can be received via the [`'message'`][] event.

Il messaggio passa attraverso la serializzazione e il parsing. The resulting message might not be the same as what is originally sent.

Per esempio, nello script del parent:

```js
const cp = require('child_process');
const n = cp.fork(`${__dirname}/sub.js`);

n.on('message', (m) => {
  console.log('PARENT got message:', m);
});

// Fa sì che il child stampi: CHILD got message: { hello: 'world' }
n.send({ hello: 'world' });
```

E poi lo script del child, che potrebbe assomigliare a `'sub.js'`:

```js
process.on('message', (m) => {
  console.log('CHILD got message:', m);
});

// Fa sì che il parent stampi: PARENT got message: { foo: 'bar', baz: null }
process.send({ foo: 'bar', baz: NaN });
```

Child Node.js processes will have a [`process.send()`][] method of their own that allows the child to send messages back to the parent.

Si presenta un caso particolare quando si invia un messaggio `{cmd: 'NODE_foo'}`. Messages containing a `NODE_` prefix in the `cmd` property are reserved for use within Node.js core and will not be emitted in the child's [`'message'`][] event. Rather, such messages are emitted using the `'internalMessage'` event and are consumed internally by Node.js. Applications should avoid using such messages or listening for `'internalMessage'` events as it is subject to change without notice.

The optional `sendHandle` argument that may be passed to `subprocess.send()` is for passing a TCP server or socket object to the child process. The child will receive the object as the second argument passed to the callback function registered on the [`'message'`][] event. Any data that is received and buffered in the socket will not be sent to the child.

The optional `callback` is a function that is invoked after the message is sent but before the child may have received it. The function is called with a single argument: `null` on success, or an [`Error`][] object on failure.

If no `callback` function is provided and the message cannot be sent, an `'error'` event will be emitted by the [`ChildProcess`][] object. This can happen, for instance, when the child process has already exited.

`subprocess.send()` will return `false` if the channel has closed or when the backlog of unsent messages exceeds a threshold that makes it unwise to send more. Altrimenti, il metodo restituisce `true`. The `callback` function can be used to implement flow control.

#### Esempio: invio di un server object

The `sendHandle` argument can be used, for instance, to pass the handle of a TCP server object to the child process as illustrated in the example below:

```js
const subprocess = require('child_process').fork('subprocess.js');

// Apri il server object ed invia l'handle.
const server = require('net').createServer();
server.on('connection', (socket) => {
  socket.end('handled by parent');
});
server.listen(1337, () => {
  subprocess.send('server', server);
});
```

Quindi il child riceverà il server object come:

```js
process.on('message', (m, server) => {
  if (m === 'server') {
    server.on('connection', (socket) => {
      socket.end('handled by child');
    });
  }
});
```

Once the server is now shared between the parent and child, some connections can be handled by the parent and some by the child.

While the example above uses a server created using the `net` module, `dgram` module servers use exactly the same workflow with the exceptions of listening on a `'message'` event instead of `'connection'` and using `server.bind()` instead of `server.listen()`. Tuttavia attualmente è supportato solo su piattaforme UNIX.

#### Esempio: invio di un socket object

Similarly, the `sendHandler` argument can be used to pass the handle of a socket to the child process. The example below spawns two children that each handle connections with "normal" or "special" priority:

```js
const { fork } = require('child_process');
const normal = fork('subprocess.js', ['normal']);
const special = fork('subprocess.js', ['special']);

// Apri il server e invia i socket al child. Utilizza pauseOnConnect per impedire 
// la lettura dei socket prima che vengano inviati al processo child.
const server = require('net').createServer({ pauseOnConnect: true });
server.on('connection', (socket) => {

  // Se questa è una priorità special
  if (socket.remoteAddress === '74.125.127.100') {
    special.send('socket', socket);
    return;
  }
  // Questa è una priorità normal
  normal.send('socket', socket);
});
server.listen(1337);
```

The `subprocess.js` would receive the socket handle as the second argument passed to the event callback function:

```js
process.on('message', (m, socket) => {
  if (m === 'socket') {
    if (socket) {
      // Verifica che il client socket esista.
      // È possibile che il socket venga chiuso dal momento in cui viene
// inviato fino a quando non viene ricevuto nel processo child.
      socket.end(`Request handled with ${process.argv[2]} priority`);
    }
  }
});
```

Once a socket has been passed to a child, the parent is no longer capable of tracking when the socket is destroyed. To indicate this, the `.connections` property becomes `null`. It is recommended not to use `.maxConnections` when this occurs.

It is also recommended that any `'message'` handlers in the child process verify that `socket` exists, as the connection may have been closed during the time it takes to send the connection to the child.

### subprocess.stderr

<!-- YAML
added: v0.1.90
-->

* {stream.Readable}

Un `Readable Stream` che rappresenta lo `stderr` del processo child.

If the child was spawned with `stdio[2]` set to anything other than `'pipe'`, then this will be `null`.

`subprocess.stderr` è un alias per `subprocess.stdio[2]`. Both properties will refer to the same value.

### subprocess.stdin

<!-- YAML
added: v0.1.90
-->

* {stream.Writable}

Un `Writable Stream` che rappresenta lo `stdin` del processo child.

*Note that if a child process waits to read all of its input, the child will not continue until this stream has been closed via `end()`.*

If the child was spawned with `stdio[0]` set to anything other than `'pipe'`, then this will be `null`.

`subprocess.stdin` è un alias per `subprocess.stdio[0]`. Both properties will refer to the same value.

### subprocess.stdio

<!-- YAML
added: v0.7.10
-->

* {Array}

A sparse array of pipes to the child process, corresponding with positions in the [`stdio`][] option passed to [`child_process.spawn()`][] that have been set to the value `'pipe'`. Note that `subprocess.stdio[0]`, `subprocess.stdio[1]`, and `subprocess.stdio[2]` are also available as `subprocess.stdin`, `subprocess.stdout`, and `subprocess.stderr`, respectively.

In the following example, only the child's fd `1` (stdout) is configured as a pipe, so only the parent's `subprocess.stdio[1]` is a stream, all other values in the array are `null`.

```js
const assert = require('assert');
const fs = require('fs');
const child_process = require('child_process');

const subprocess = child_process.spawn('ls', {
  stdio: [
    0, // Usa lo stdin del parent per il child
    'pipe', // Esegue il piping dello stdout del child al parent
    fs.openSync('err.out', 'w') // Dirige lo stderr del child su un file
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

Un `Readable Stream` che rappresenta lo `stdout` del processo child.

If the child was spawned with `stdio[1]` set to anything other than `'pipe'`, then this will be `null`.

`subprocess.stdout` è un alias per `subprocess.stdio[1]`. Both properties will refer to the same value.

### subprocess.unref()

<!-- YAML
added: v0.7.10
-->

Di default, il parent aspetterà che il child distaccato si concluda. To prevent the parent from waiting for a given `subprocess` to exit, use the `subprocess.unref()` method. Doing so will cause the parent's event loop to not include the child in its reference count, allowing the parent to exit independently of the child, unless there is an established IPC channel between the child and the parent.

```js
const { spawn } = require('child_process');

const subprocess = spawn(process.argv[0], ['child_program.js'], {
  detached: true,
  stdio: 'ignore'
});

subprocess.unref();
```

## `maxBuffer` e Unicode

The `maxBuffer` option specifies the largest number of bytes allowed on `stdout` or `stderr`. Se questo valore viene superato, allora il processo child viene concluso. This impacts output that includes multibyte character encodings such as UTF-8 or UTF-16. For instance, `console.log('中文测试')` will send 13 UTF-8 encoded bytes to `stdout` although there are only 4 characters.

## Requisiti della Shell

La shell dovrebbe capire lo switch `-c` su UNIX oppure `/d /s /c` su Windows. Su Windows, il parsing (analisi) della command line dovrebbe essere compatibile con `'cmd.exe'`.

## Shell Default di Windows

Although Microsoft specifies `%COMSPEC%` must contain the path to `'cmd.exe'` in the root environment, child processes are not always subject to the same requirement. Thus, in `child_process` functions where a shell can be spawned, `'cmd.exe'` is used as a fallback if `process.env.ComSpec` is unavailable.