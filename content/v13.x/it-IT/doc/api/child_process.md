# Child Process

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Il modulo `child_process` offre la possibilità di generare processi child in modo simile, ma non identico, a quello di popen(3). Questa capacità è fornita principalmente dalla funzione [`child_process.spawn()`][]:

```js
const { spawn } = require('child_process');
const ls = spawn('ls', ['-lh', '/usr']);

ls.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

ls.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
```

By default, pipes for `stdin`, `stdout`, and `stderr` are established between the parent Node.js process and the spawned child. These pipes have limited (and platform-specific) capacity. If the child process writes to stdout in excess of that limit without the output being captured, the child process will block waiting for the pipe buffer to accept more data. This is identical to the behavior of pipes in the shell. Use the `{ stdio: 'ignore' }` option if the output will not be consumed.

Il metodo [`child_process.spawn()`][] genera il processo child in modo asincrono, senza bloccare il ciclo degli eventi Node.js. La funzione [`child_process.spawnSync()`][] fornisce funzionalità equivalenti in un modo sincrono che interrompe il ciclo di eventi finché il processo generato non si conclude o viene chiuso.

Per comodità, il modulo `child_process` fornisce una manciata di alternative sincrone e asincrone a [`child_process.spawn()`][] e [`child_process.spawnSync()`][]. Each of these alternatives are implemented on top of [`child_process.spawn()`][] or [`child_process.spawnSync()`][].

* [`child_process.exec()`][]: spawns a shell and runs a command within that shell, passing the `stdout` and `stderr` to a callback function when complete.
* [`child_process.execFile()`][]: similar to [`child_process.exec()`][] except that it spawns the command directly without first spawning a shell by default.
* [`child_process.fork()`][]: spawns a new Node.js process and invokes a specified module with an IPC communication channel established that allows sending messages between parent and child.
* [`child_process.execSync()`][]: a synchronous version of [`child_process.exec()`][] that will block the Node.js event loop.
* [`child_process.execFileSync()`][]: a synchronous version of [`child_process.execFile()`][] that will block the Node.js event loop.

Per alcuni casi d'utilizzo, come l'automazione degli script della shell, le [controparti sincrone](#child_process_synchronous_process_creation) possono essere più convenienti. Tuttavia, in molti casi, i metodi sincroni possono avere un impatto significativo sulle prestazioni a causa dell'interruzione del ciclo degli eventi durante il completamento dei processi generati.

## Creazione di Processi Asincroni

I metodi [`child_process.spawn()`][], [`child_process.fork()`][], [`child_process.exec()`][], e [`child_process.execFile()`][] seguono tutti il modello di programmazione asincrona idiomatica tipico di altre API di Node.js.

Ciascun metodo restituisce un'istanza [`ChildProcess`][]. Questi objects implementano l'API Node.js [`EventEmitter`][], consentendo al processo parent di registrare le funzioni listener chiamate quando si verificano determinati eventi durante il ciclo del processo child.

The [`child_process.exec()`][] and [`child_process.execFile()`][] methods additionally allow for an optional `callback` function to be specified that is invoked when the child process terminates.

### Generare i file `.bat` e `.cmd` su Windows

L'importanza della distinzione tra [`child_process.exec()`][] e [`child_process.execFile()`][] può variare in base alla piattaforma. On Unix-type operating systems (Unix, Linux, macOS) [`child_process.execFile()`][] can be more efficient because it does not spawn a shell by default. On Windows, however, `.bat` and `.cmd` files are not executable on their own without a terminal, and therefore cannot be launched using [`child_process.execFile()`][]. When running on Windows, `.bat` and `.cmd` files can be invoked using [`child_process.spawn()`][] with the `shell` option set, with [`child_process.exec()`][], or by spawning `cmd.exe` and passing the `.bat` or `.cmd` file as an argument (which is what the `shell` option and [`child_process.exec()`][] do). In ogni caso, se il filename dello script contiene spazi, deve essere racchiuso tra le virgolette.

```js
// On Windows Only...
const { spawn } = require('child_process');
const bat = spawn('cmd.exe', ['/c', 'my.bat']);

bat.stdout.on('data', (data) => {
  console.log(data.toString());
});

bat.stderr.on('data', (data) => {
  console.error(data.toString());
});

bat.on('exit', (code) => {
  console.log(`Child exited with code ${code}`);
});
```

```js
// OPPURE...
const { exec, spawn } = require('child_process');
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

### `child_process.exec(command[, options][, callback])`
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
  * `env` {Object} Coppie key-value dell'ambiente. **Default:** `process.env`.
  * `encoding` {string} **Default:** `'utf8'`
  * `shell` {string} La Shell con la quale eseguire il comando. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `'/bin/sh'` on Unix, `process.env.ComSpec` on Windows.
  * `timeout` {number} **Default:** `0`
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated and any output is truncated. See caveat at [`maxBuffer` and Unicode][]. **Default:** `1024 * 1024`.
  * `killSignal` {string|integer} **Default:** `'SIGTERM'`
  * `uid` {number} Imposta l'identità dell'utente (user identity) del processo (vedi setuid(2)).
  * `gid` {number} Imposta l'identità di gruppo (group identity) del processo (vedi setgid(2)).
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
* `callback` {Function} called with the output when process terminates.
  * `error` {Error}
  * `stdout` {string|Buffer}
  * `stderr` {string|Buffer}
* Restituisce: {ChildProcess}

Genera una shell e successivamente esegue il `command` all'interno della shell stessa, eseguendo il buffer di qualsiasi output generato. The `command` string passed to the exec function is processed directly by the shell and special characters (vary based on [shell](https://en.wikipedia.org/wiki/List_of_command-line_interpreters)) need to be dealt with accordingly:

```js
exec('"/path/to/test file/test.sh" arg1 arg2');
// Double quotes are used so that the space in the path is not interpreted as
// a delimiter of multiple arguments.

exec('echo "The \\$HOME variable is $HOME"');
// The $HOME variable is escaped in the first instance, but not in the second.
```

**Non passare mai l'input unsanitized user a questa funzione. Any input containing shell metacharacters may be used to trigger arbitrary command execution.**

Se viene fornita una funzione `callback`, viene chiamata con gli argomenti `(error, stdout, stderr)`. In caso di successo, `error` sarà `null`. In caso di errore, `error` sarà un'istanza di [`Error`][]. La proprietà `error.code` sarà il valore di uscita del processo child mentre `error.signal` sarà impostato sul segnale che ha interrotto il processo. Qualsiasi valore di uscita diverso da `0` è considerato un errore.

Gli argomenti `stdout` e `stderr` passati al callback conterranno gli output stdout e stderr del processo child. Di default, Node.js decodificherà l'output come UTF-8 e passerà le stringhe al callback. L'opzione `encoding` può essere usata per specificare l'encoding (codifica) dei caratteri utilizzato per decodificare gli output stdout e stderr. Se `encoding` è `'buffer'`, oppure un econding dei caratteri non riconosciuto, allora i `Buffer` object saranno passati al callback.

```js
const { exec } = require('child_process');
exec('cat *.js missing_file | wc -l', (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.error(`stderr: ${stderr}`);
});
```

Se `timeout` è maggiore di `0`, il parent invierà il segnale identificato dalla proprietà `killSignal` (il valore predefinito è `'SIGTERM'`) se il child esegue più di `timeout` millisecondi.

Unlike the exec(3) POSIX system call, `child_process.exec()` does not replace the existing process and uses a shell to execute the command.

If this method is invoked as its [`util.promisify()`][]ed version, it returns a `Promise` for an `Object` with `stdout` and `stderr` properties. The returned `ChildProcess` instance is attached to the `Promise` as a `child` property. In case of an error (including any error resulting in an exit code other than 0), a rejected promise is returned, with the same `error` object given in the callback, but with two additional properties `stdout` and `stderr`.

```js
const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function lsExample() {
  const { stdout, stderr } = await exec('ls');
  console.log('stdout:', stdout);
  console.error('stderr:', stderr);
}
lsExample();
```

### `child_process.execFile(file[, args][, options][, callback])`
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
  * `env` {Object} Coppie key-value dell'ambiente. **Default:** `process.env`.
  * `encoding` {string} **Default:** `'utf8'`
  * `timeout` {number} **Default:** `0`
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated and any output is truncated. See caveat at [`maxBuffer` and Unicode][]. **Default:** `1024 * 1024`.
  * `killSignal` {string|integer} **Default:** `'SIGTERM'`
  * `uid` {number} Imposta l'identità dell'utente (user identity) del processo (vedi setuid(2)).
  * `gid` {number} Imposta l'identità di gruppo (group identity) del processo (vedi setgid(2)).
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
  * `windowsVerbatimArguments` {boolean} No quoting or escaping of arguments is done on Windows. Ignorato su Unix. **Default:** `false`.
  * `shell` {boolean|string} Se `true`, esegue `command` all'interno di una shell. Uses `'/bin/sh'` on Unix, and `process.env.ComSpec` on Windows. A different shell can be specified as a string. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `false` (no shell).
* `callback` {Function} Called with the output when process terminates.
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

Gli argomenti `stdout` e `stderr` passati al callback conterranno gli output stdout e stderr del processo child. Di default, Node.js decodificherà l'output come UTF-8 e passerà le stringhe al callback. L'opzione `encoding` può essere usata per specificare l'encoding (codifica) dei caratteri utilizzato per decodificare gli output stdout e stderr. Se `encoding` è `'buffer'`, oppure un econding dei caratteri non riconosciuto, allora i `Buffer` object saranno passati al callback.

If this method is invoked as its [`util.promisify()`][]ed version, it returns a `Promise` for an `Object` with `stdout` and `stderr` properties. The returned `ChildProcess` instance is attached to the `Promise` as a `child` property. In case of an error (including any error resulting in an exit code other than 0), a rejected promise is returned, with the same `error` object given in the callback, but with two additional properties `stdout` and `stderr`.

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

### `child_process.fork(modulePath[, args][, options])`
<!-- YAML
added: v0.5.0
changes:
  - version: v13.2.0
    pr-url: https://github.com/nodejs/node/pull/30162
    description: The `serialization` option is supported now.
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
  * `detached` {boolean} Prepara il child all'avvio indipendentemente dal suo processo parent. Il comportamento specifico dipende dalla piattaforma, vedi [`options.detached`][].
  * `env` {Object} Coppie key-value dell'ambiente.  **Default:** `process.env`.
  * `execPath` {string} Eseguibile utilizzato per creare il processo child.
  * `execArgv` {string[]} Elenco degli argomenti di string passati all'eseguibile. **Default:** `process.execArgv`.
  * `serialization` {string} Specify the kind of serialization used for sending messages between processes. Possible values are `'json'` and `'advanced'`. See [Advanced Serialization](#child_process_advanced_serialization) for more details. **Default:** `'json'`.
  * `silent` {boolean} Se `true`, stdin, stdout e stderr del child verranno reindirizzati al parent tramite il piping, in caso contrario verranno ereditati dal parent, per maggiori dettagli vedi le opzioni `'pipe'` e `'inherit'` per lo [`stdio`][] di [`child_process.spawn()`][]. **Default:** `false`.
  * `stdio` {Array|string} Vedi lo [`stdio`][] di [`child_process.spawn()`][]. Quando viene fornita quest'opzione, esegue l'override di `silent`. If the array variant is used, it must contain exactly one item with value `'ipc'` or an error will be thrown. Per esempio `[0, 1, 2, 'ipc']`.
  * `windowsVerbatimArguments` {boolean} No quoting or escaping of arguments is done on Windows. Ignorato su Unix. **Default:** `false`.
  * `uid` {number} Imposta l'identità dell'utente (user identity) del processo (vedi setuid(2)).
  * `gid` {number} Imposta l'identità di gruppo (group identity) del processo (vedi setgid(2)).
* Restituisce: {ChildProcess}

Il metodo `child_process.fork()` è un caso speciale di [`child_process.spawn()`][] utilizzato specificamente per generare nuovi processi Node.js. Così come con [`child_process.spawn()`][], viene restituito un [`ChildProcess`][] object. The returned [`ChildProcess`][] will have an additional communication channel built-in that allows messages to be passed back and forth between the parent and child. See [`subprocess.send()`][] for details.

Keep in mind that spawned Node.js child processes are independent of the parent with exception of the IPC communication channel that is established between the two. Ogni processo ha la propria memoria, con le proprie istanze V8. A causa delle allocazioni aggiuntive richieste, non è consigliato generare un numero elevato di processi child di Node.js.

Di default, `child_process.fork()` genererà nuove istanze Node.js utilizzando il [`process.execPath`][] del processo parent. La proprietà `execPath` nell'`options` object consente di utilizzare un percorso di esecuzione alternativo.

I processi Node.js avviati con un `execPath` personalizzato comunicano con il processo parent utilizzando il file descriptor (fd) identificato utilizzando la variabile di ambiente `NODE_CHANNEL_FD` sul processo child.

Unlike the fork(2) POSIX system call, `child_process.fork()` does not clone the current process.

The `shell` option available in [`child_process.spawn()`][] is not supported by `child_process.fork()` and will be ignored if set.

### `child_process.spawn(command[, args][, options])`
<!-- YAML
added: v0.1.90
changes:
  - version: v13.2.0
    pr-url: https://github.com/nodejs/node/pull/30162
    description: The `serialization` option is supported now.
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
  * `env` {Object} Coppie key-value dell'ambiente. **Default:** `process.env`.
  * `argv0` {string} Imposta esplicitamente il valore di `argv[0]` inviato al processo child. Questo sarà impostato su `command` se non specificato.
  * `stdio` {Array|string} Configurazione stdio del child (vedi [`options.stdio`][`stdio`]).
  * `detached` {boolean} Prepara il child all'avvio indipendentemente dal suo processo parent. Il comportamento specifico dipende dalla piattaforma, vedi [`options.detached`][].
  * `uid` {number} Imposta l'identità dell'utente (user identity) del processo (vedi setuid(2)).
  * `gid` {number} Imposta l'identità di gruppo (group identity) del processo (vedi setgid(2)).
  * `serialization` {string} Specify the kind of serialization used for sending messages between processes. Possible values are `'json'` and `'advanced'`. See [Advanced Serialization](#child_process_advanced_serialization) for more details. **Default:** `'json'`.
  * `shell` {boolean|string} Se `true`, esegue `command` all'interno di una shell. Uses `'/bin/sh'` on Unix, and `process.env.ComSpec` on Windows. A different shell can be specified as a string. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `false` (no shell).
  * `windowsVerbatimArguments` {boolean} No quoting or escaping of arguments is done on Windows. Ignorato su Unix. This is set to `true` automatically when `shell` is specified and is CMD. **Default:** `false`.
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
* Restituisce: {ChildProcess}

Il metodo `child_process.spawn()` genera un nuovo processo utilizzando il `command` dato, con gli argomenti della command line in `args`. Se omesso, `args` si imposta automaticamente su un array vuoto.

**If the `shell` option is enabled, do not pass unsanitized user input to this function. Any input containing shell metacharacters may be used to trigger arbitrary command execution.**

Un terzo argomento può essere usato per specificare ulteriori opzioni, con questi valori di default:

```js
const defaults = {
  cwd: undefined,
  env: process.env
};
```

Utilizza `cwd` per specificare la directory di lavoro dalla quale viene generato il processo. Se non specificata, l'impostazione predefinita consiste nell'ereditare l'attuale directory di lavoro.

Utilizza `env` per specificare le variabili di ambiente che saranno visibili per il nuovo processo, il valore predefinito è [`process.env`][].

I valori `undefined` in `env` saranno ignorati.

Esempio di esecuzione di `ls -lh /usr`, acquisizione di `stdout`, `stderr`, e del valore di uscita:

```js
const { spawn } = require('child_process');
const ls = spawn('ls', ['-lh', '/usr']);

ls.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
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
  console.error(`ps stderr: ${data}`);
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
  console.error(`grep stderr: ${data}`);
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
  console.error('Failed to start subprocess.');
});
```

Certain platforms (macOS, Linux) will use the value of `argv[0]` for the process title while others (Windows, SunOS) will use `command`.

Node.js currently overwrites `argv[0]` with `process.execPath` on startup, so `process.argv[0]` in a Node.js child process will not match the `argv0` parameter passed to `spawn` from the parent, retrieve it with the `process.argv0` property instead.

#### `options.detached`
<!-- YAML
added: v0.7.10
-->

Su Windows, l'impostazione di `options.detached` su `true` consente al processo child di continuare ad essere eseguito dopo la chiusura del parent. Il child avrà la propria finestra della console. Once enabled for a child process, it cannot be disabled.

Su piattaforme diverse da Windows, se `options.detached` è impostato su `true`, allora il processo child sarà reso il leader di un nuovo gruppo di processi e di sessione. Child processes may continue running after the parent exits regardless of whether they are detached or not. Vedi setsid(2) per maggiori informazioni.

Di default, il parent aspetterà che il child distaccato si concluda. To prevent the parent from waiting for a given `subprocess` to exit, use the `subprocess.unref()` method. Doing so will cause the parent's event loop to not include the child in its reference count, allowing the parent to exit independently of the child, unless there is an established IPC channel between the child and the parent.

Quando si utilizza l'opzione `detached` per avviare un processo di lunga durata, il processo non verrà eseguito in background dopo la conclusione del parent a meno che non sia fornito di una configurazione `stdio` che non sia collegata al parent. Se lo `stdio` del parent è ereditato, il child rimarrà collegato al terminale di controllo.

Esempio di un processo ad esecuzione prolungata, scollegando ed ignorando anche i file descriptor `stdio` del suo parent, in modo da ignorare la terminazione del parent stesso:

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

#### `options.stdio`
<!-- YAML
added: v0.7.10
changes:
  - version: v3.3.1
    pr-url: https://github.com/nodejs/node/pull/2727
    description: The value `0` is now accepted as a file descriptor.
-->

L'opzione `options.stdio` viene utilizzata per configurare i pipe stabiliti tra i processi parent e child. Di default, lo stdin, lo stdout e lo stderr del child vengono reindirizzati ai corrispondenti stream [`subprocess.stdin`][], [`subprocess.stdout`][], e [`subprocess.stderr`][] sul [`ChildProcess`][] object. Ciò è equivalente all'impostazione di `options.stdio` uguale a `['pipe', 'pipe', 'pipe']`.

Per comodità, `options.stdio` potrebbe essere una delle seguenti stringhe:

* `'pipe'`: equivalent to `['pipe', 'pipe', 'pipe']` (the default)
* `'ignore'`: equivalent to `['ignore', 'ignore', 'ignore']`
* `'inherit'`: equivalent to `['inherit', 'inherit', 'inherit']` or `[0, 1, 2]`

In caso contrario, il valore di `options.stdio` è un array in cui ogni indice corrisponde a un file descriptor (fd) all'interno del child. I file descriptor (fd) 0, 1 e 2 corrispondono rispettivamente a stdin, stdout e stderr. È possibile specificare ulteriori file descriptor (fd) per creare pipe aggiuntivi tra parent e child. Il valore è uno dei seguenti:

1. `'pipe'`: Create a pipe between the child process and the parent process. The parent end of the pipe is exposed to the parent as a property on the `child_process` object as [`subprocess.stdio[fd]`][`subprocess.stdio`]. Pipes created for fds 0, 1, and 2 are also available as [`subprocess.stdin`][], [`subprocess.stdout`][] and [`subprocess.stderr`][], respectively.
2. `'ipc'`: Create an IPC channel for passing messages/file descriptors between parent and child. A [`ChildProcess`][] may have at most one IPC stdio file descriptor. Setting this option enables the [`subprocess.send()`][] method. If the child is a Node.js process, the presence of an IPC channel will enable [`process.send()`][] and [`process.disconnect()`][] methods, as well as [`'disconnect'`][] and [`'message'`][] events within the child.

   Accessing the IPC channel fd in any way other than [`process.send()`][] or using the IPC channel with a child process that is not a Node.js instance is not supported.
3. `'ignore'`: Instructs Node.js to ignore the fd in the child. While Node.js will always open fds 0, 1, and 2 for the processes it spawns, setting the fd to `'ignore'` will cause Node.js to open `/dev/null` and attach it to the child's fd.
4. `'inherit'`: Pass through the corresponding stdio stream to/from the parent process. In the first three positions, this is equivalent to `process.stdin`, `process.stdout`, and `process.stderr`, respectively. In any other position, equivalent to `'ignore'`.
5. {Stream} object: Share a readable or writable stream that refers to a tty, file, socket, or a pipe with the child process. The stream's underlying file descriptor is duplicated in the child process to the fd that corresponds to the index in the `stdio` array. The stream must have an underlying descriptor (file streams do not until the `'open'` event has occurred).
6. Positive integer: The integer value is interpreted as a file descriptor that is currently open in the parent process. It is shared with the child process, similar to how {Stream} objects can be shared. Passing sockets is not supported on Windows.
7. `null`, `undefined`: Use default value. For stdio fds 0, 1, and 2 (in other words, stdin, stdout, and stderr) a pipe is created. For fd 3 and up, the default is `'ignore'`.

```js
const { spawn } = require('child_process');

// Child will use parent's stdios.
spawn('prg', [], { stdio: 'inherit' });

// Spawn child sharing only stderr.
spawn('prg', [], { stdio: ['pipe', 'pipe', process.stderr] });

// Open an extra fd=4, to interact with programs presenting a
// startd-style interface.
spawn('prg', [], { stdio: ['pipe', null, null, null, 'pipe'] });
```

*It is worth noting that when an IPC channel is established between the parent and child processes, and the child is a Node.js process, the child is launched with the IPC channel unreferenced (using `unref()`) until the child registers an event handler for the [`'disconnect'`][] event or the [`'message'`][] event. Ciò consente al child di concludersi normalmente senza che il processo venga tenuto aperto dal canale IPC aperto.*

On Unix-like operating systems, the [`child_process.spawn()`][] method performs memory operations synchronously before decoupling the event loop from the child. Applications with a large memory footprint may find frequent [`child_process.spawn()`][] calls to be a bottleneck. For more information, see [V8 issue 7381](https://bugs.chromium.org/p/v8/issues/detail?id=7381).

Vedi anche: [`child_process.exec()`][] e [`child_process.fork()`][].

## Creazione di Processi Sincroni

The [`child_process.spawnSync()`][], [`child_process.execSync()`][], and [`child_process.execFileSync()`][] methods are synchronous and will block the Node.js event loop, pausing execution of any additional code until the spawned process exits.

Blocking calls like these are mostly useful for simplifying general-purpose scripting tasks and for simplifying the loading/processing of application configuration at startup.

### `child_process.execFileSync(file[, args][, options])`
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
  * `input` {string|Buffer|TypedArray|DataView} The value which will be passed as stdin to the spawned process. Supplying this value will override `stdio[0]`.
  * `stdio` {string|Array} Configurazione stdio del child. `stderr` by default will be output to the parent process' stderr unless `stdio` is specified. **Default:** `'pipe'`.
  * `env` {Object} Coppie key-value dell'ambiente.  **Default:** `process.env`.
  * `uid` {number} Imposta l'identità dell'utente (user identity) del processo (vedi setuid(2)).
  * `gid` {number} Imposta l'identità di gruppo (group identity) del processo (vedi setgid(2)).
  * `timeout` {number} La quantità massima di tempo in millisecondi in cui il processo può essere eseguito. **Default:** `undefined`.
  * `killSignal` {string|integer} Il valore del segnale da utilizzare quando il processo generato verrà arrestato. **Default:** `'SIGTERM'`.
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. Se superata, il processo child viene concluso. See caveat at [`maxBuffer` and Unicode][]. **Default:** `1024 * 1024`.
  * `encoding` {string} L'encoding (codifica) utilizzata per tutti gli input e gli output stdio. **Default:** `'buffer'`.
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
  * `shell` {boolean|string} Se `true`, esegue `command` all'interno di una shell. Uses `'/bin/sh'` on Unix, and `process.env.ComSpec` on Windows. A different shell can be specified as a string. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `false` (no shell).
* Restituisce: {Buffer|string} Lo stdout dal comando.

The `child_process.execFileSync()` method is generally identical to [`child_process.execFile()`][] with the exception that the method will not return until the child process has fully closed. When a timeout has been encountered and `killSignal` is sent, the method won't return until the process has completely exited.

If the child process intercepts and handles the `SIGTERM` signal and does not exit, the parent process will still wait until the child process has exited.

If the process times out or has a non-zero exit code, this method will throw an [`Error`][] that will include the full result of the underlying [`child_process.spawnSync()`][].

**If the `shell` option is enabled, do not pass unsanitized user input to this function. Any input containing shell metacharacters may be used to trigger arbitrary command execution.**

### `child_process.execSync(command[, options])`
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
  * `input` {string|Buffer|TypedArray|DataView} The value which will be passed as stdin to the spawned process. Supplying this value will override `stdio[0]`.
  * `stdio` {string|Array} Configurazione stdio del child. `stderr` by default will be output to the parent process' stderr unless `stdio` is specified. **Default:** `'pipe'`.
  * `env` {Object} Coppie key-value dell'ambiente. **Default:** `process.env`.
  * `shell` {string} La Shell con la quale eseguire il comando. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `'/bin/sh'` on Unix, `process.env.ComSpec` on Windows.
  * `uid` {number} Imposta l'identità dell'utente (user identity) del processo. (Vedi setuid(2)).
  * `gid` {number} Imposta l'identità di gruppo (group identity) del processo. (Vedi setgid(2)).
  * `timeout` {number} La quantità massima di tempo in millisecondi in cui il processo può essere eseguito. **Default:** `undefined`.
  * `killSignal` {string|integer} Il valore del segnale da utilizzare quando il processo generato verrà arrestato. **Default:** `'SIGTERM'`.
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated and any output is truncated. See caveat at [`maxBuffer` and Unicode][]. **Default:** `1024 * 1024`.
  * `encoding` {string} L'encoding (codifica) utilizzata per tutti gli input e gli output stdio. **Default:** `'buffer'`.
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
* Restituisce: {Buffer|string} Lo stdout dal comando.

The `child_process.execSync()` method is generally identical to [`child_process.exec()`][] with the exception that the method will not return until the child process has fully closed. Quando si verifica un timeout e viene inviato `killSignal`, il metodo non restituirà nulla finché il processo non sarà completamente concluso. If the child process intercepts and handles the `SIGTERM` signal and doesn't exit, the parent process will wait until the child process has exited.

If the process times out or has a non-zero exit code, this method will throw. The [`Error`][] object will contain the entire result from [`child_process.spawnSync()`][].

**Non passare mai l'input unsanitized user a questa funzione. Any input containing shell metacharacters may be used to trigger arbitrary command execution.**

### `child_process.spawnSync(command[, args][, options])`
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
  * `input` {string|Buffer|TypedArray|DataView} The value which will be passed as stdin to the spawned process. Supplying this value will override `stdio[0]`.
  * `argv0` {string} Imposta esplicitamente il valore di `argv[0]` inviato al processo child. Questo sarà impostato su `command` se non specificato.
  * `stdio` {string|Array} Configurazione stdio del child.
  * `env` {Object} Coppie key-value dell'ambiente.  **Default:** `process.env`.
  * `uid` {number} Imposta l'identità dell'utente (user identity) del processo (vedi setuid(2)).
  * `gid` {number} Imposta l'identità di gruppo (group identity) del processo (vedi setgid(2)).
  * `timeout` {number} La quantità massima di tempo in millisecondi in cui il processo può essere eseguito. **Default:** `undefined`.
  * `killSignal` {string|integer} Il valore del segnale da utilizzare quando il processo generato verrà arrestato. **Default:** `'SIGTERM'`.
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated and any output is truncated. See caveat at [`maxBuffer` and Unicode][]. **Default:** `1024 * 1024`.
  * `encoding` {string} L'encoding (codifica) utilizzata per tutti gli input e gli output stdio. **Default:** `'buffer'`.
  * `shell` {boolean|string} Se `true`, esegue `command` all'interno di una shell. Uses `'/bin/sh'` on Unix, and `process.env.ComSpec` on Windows. A different shell can be specified as a string. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `false` (no shell).
  * `windowsVerbatimArguments` {boolean} No quoting or escaping of arguments is done on Windows. Ignorato su Unix. This is set to `true` automatically when `shell` is specified and is CMD. **Default:** `false`.
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
* Restituisce: {Object}
  * `pid` {number} Pid (Process Identifier) del processo child.
  * `output` {Array} Array dei risultati provenienti dall'output di stdio.
  * `stdout` {Buffer|string} Il contenuto di `output[1]`.
  * `stderr` {Buffer|string} Il contenuto di `output[2]`.
  * `status` {number|null} The exit code of the subprocess, or `null` if the subprocess terminated due to a signal.
  * `signal` {string|null} The signal used to kill the subprocess, or `null` if the subprocess did not terminate due to a signal.
  * `error` {Error} L'error object se il processo child ha avuto esito negativo oppure è scaduto (timeout).

Il metodo `child_process.spawnSync()` è generalmente identico a [`child_process.spawn()`][] con l'eccezione che la funzione non restituirà nulla finché il processo child non sarà completamente chiuso. Quando si verifica un timeout e viene inviato `killSignal`, il metodo non restituirà nulla finché il processo non sarà completamente concluso. If the process intercepts and handles the `SIGTERM` signal and doesn't exit, the parent process will wait until the child process has exited.

**If the `shell` option is enabled, do not pass unsanitized user input to this function. Any input containing shell metacharacters may be used to trigger arbitrary command execution.**

## Class: `ChildProcess`
<!-- YAML
added: v2.2.0
-->

* Estendendo: {EventEmitter}

Instances of the `ChildProcess` represent spawned child processes.

Le istanze di `ChildProcess` non devono essere create direttamente. Piuttosto, per creare istanze di `ChildProcess`, utilizza i metodi [`child_process.spawn()`][], [`child_process.exec()`][], [`child_process.execFile()`][], oppure [`child_process.fork()`][].

### Event: `'close'`
<!-- YAML
added: v0.7.7
-->

* `code` {number} Il valore di uscita se il child si è concluso autonomamente.
* `signal` {string} Il segnale con cui è stato terminato il processo child.

L'evento `'close'` viene emesso quando gli stream stdio di un processo child sono stati chiusi. E' diverso dall'evento [`'exit'`][], in quanto più processi potrebbero condividere gli stessi stream stdio.

```js
const { spawn } = require('child_process');
const ls = spawn('ls', ['-lh', '/usr']);

ls.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

ls.on('close', (code) => {
  console.log(`child process close all stdio with code ${code}`);
});

ls.on('exit', (code) => {
  console.log(`child process exited with code ${code}`);
});
```

### Event: `'disconnect'`
<!-- YAML
added: v0.7.2
-->

L'evento `'disconnect'` viene emesso dopo aver chiamato il metodo [`subprocess.disconnect()`][] nel processo parent oppure [`process.disconnect()`][] nel processo child. Dopo averlo disconnesso, non è più possibile inviare o ricevere messaggi e la proprietà [`subprocess.connected`][] diventa `false`.

### Event: `'error'`

* `err` {Error} L'errore.

L'evento `'error'` viene emesso ogni volta che:

1. Non è stato possibile generare il processo, oppure
2. Non è stato possibile arrestare il processo, oppure
3. Non è andato a buon fine l'invio di un messaggio al processo child.

L'evento `'exit'` può o non può funzionare dopo che si è verificato un errore. When listening to both the `'exit'` and `'error'` events, guard against accidentally invoking handler functions multiple times.

Vedi anche [`subprocess.kill()`][] e [`subprocess.send()`][].

### Event: `'exit'`
<!-- YAML
added: v0.1.90
-->

* `code` {number} Il valore di uscita se il child si è concluso autonomamente.
* `signal` {string} Il segnale con cui è stato terminato il processo child.

L'evento `'exit'` viene emesso al termine del processo child. Se il processo è concluso, `code` è il valore di uscita finale del processo, in caso contrario `null`. Se il processo termina a causa della ricezione di un segnale, `signal` è il nome della stringa del segnale, in caso contrario `null`. One of the two will always be non-`null`.

When the `'exit'` event is triggered, child process stdio streams might still be open.

Node.js establishes signal handlers for `SIGINT` and `SIGTERM` and Node.js processes will not terminate immediately due to receipt of those signals. Rather, Node.js will perform a sequence of cleanup actions and then will re-raise the handled signal.

Vedi waitpid(2).

### Event: `'message'`
<!-- YAML
added: v0.5.9
-->

* `message` {Object} Un JSON object analizzato tramite il parsing oppure un valore primitivo.
* `sendHandle` {Handle} Un [`net.Socket`][] object o un [`net.Server`][] object, oppure un valore undefined (indefinito).

The `'message'` event is triggered when a child process uses [`process.send()`][] to send messages.

Il messaggio passa attraverso la serializzazione e il parsing. The resulting message might not be the same as what is originally sent.

If the `serialization` option was set to `'advanced'` used when spawning the child process, the `message` argument can contain data that JSON is not able to represent. See [Advanced Serialization](#child_process_advanced_serialization) for more details.

### `subprocess.channel`
<!-- YAML
added: v7.1.0
-->

* {Object} Un pipe che rappresenta il canale IPC per il processo child.

La proprietà `subprocess.channel` è un riferimento al canale IPC del child. If no IPC channel currently exists, this property is `undefined`.

### `subprocess.connected`
<!-- YAML
added: v0.7.2
-->

* {boolean} Impostata su `false` dopo che viene chiamato `subprocess.disconnect()`.

La proprietà `subprocess.connected` indica se è ancora possibile inviare e ricevere messaggi da un processo child. Quando `subprocess.connected` è `false`, non è più possibile inviare o ricevere messaggi.

### `subprocess.disconnect()`
<!-- YAML
added: v0.7.2
-->

Chiude il canale IPC tra parent e child, consentendo al child di concludersi facilmente una volta che non ci sono altre connessioni che lo mantengano in funzione. Dopo aver chiamato questo metodo, le proprietà `subprocess.connected` e `process.connected`, rispettivamente all'interno del parent e del child, saranno impostate su `false` e non sarà più possibile far passare messaggi tra i due processi.

L'evento `'disconnect'` verrà emesso quando non ci saranno messaggi in fase di ricezione. Questo verrà spesso attivato immediatamente dopo aver chiamato `subprocess.disconnect()`.

When the child process is a Node.js instance (e.g. spawned using [`child_process.fork()`][]), the `process.disconnect()` method can be invoked within the child process to close the IPC channel as well.

### `subprocess.exitCode`

* {integer}

The `subprocess.exitCode` property indicates the exit code of the child process. If the child process is still running, the field will be `null`.

### `subprocess.kill([signal])`
<!-- YAML
added: v0.1.90
-->

* `signal` {number|string}
* Restituisce: {boolean}

Il metodo `subprocess.kill()` invia un segnale al processo child. Se non viene fornito alcun argomento, al processo verrà inviato il segnale `'SIGTERM'`. Vedi signal(7) per la lista dei segnali disponibili. This function returns `true` if kill(2) succeeds, and `false` otherwise.

```js
const { spawn } = require('child_process');
const grep = spawn('grep', ['ssh']);

grep.on('close', (code, signal) => {
  console.log(
    `child process terminated due to receipt of signal ${signal}`);
});

// Send SIGHUP to process.
grep.kill('SIGHUP');
```

The [`ChildProcess`][] object may emit an [`'error'`][] event if the signal cannot be delivered. Sending a signal to a child process that has already exited is not an error but may have unforeseen consequences. Specifically, if the process identifier (PID) has been reassigned to another process, the signal will be delivered to that process instead which can have unexpected results.

While the function is called `kill`, the signal delivered to the child process may not actually terminate the process.

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
  subprocess.kill(); // Does not terminate the Node.js process in the shell.
}, 2000);
```

### `subprocess.killed`
<!-- YAML
added: v0.5.10
-->

* {boolean} Impostata su `true` dopo aver utilizzato `subprocess.kill()` per inviare correttamente un segnale al processo child.

La proprietà `subprocess.killed` indica se il processo child ha ricevuto correttamente un segnale da `subprocess.kill()`. La proprietà `killed` non sta ad indicare che il processo child è stato arrestato.

### `subprocess.pid`
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

### `subprocess.ref()`
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

### `subprocess.send(message[, sendHandle[, options]][, callback])`
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

Quando viene stabilito un canale IPC tra parent e child (cioè quando si utilizza [`child_process.fork()`][]), il metodo `subprocess.send()` può essere utilizzato per inviare messaggi al processo child. When the child process is a Node.js instance, these messages can be received via the [`'message'`][] event.

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

Si presenta un caso particolare quando si invia un messaggio `{cmd: 'NODE_foo'}`. Messages containing a `NODE_` prefix in the `cmd` property are reserved for use within Node.js core and will not be emitted in the child's [`'message'`][] event. Rather, such messages are emitted using the `'internalMessage'` event and are consumed internally by Node.js. Le applicazioni dovrebbero evitare l'utilizzo di messaggi del genere o di ascoltare gli eventi `'internalMessage'` in quanto sono soggetti a modifiche senza alcun preavviso.

L'argomento facoltativo `sendHandle` che può essere passato a `subprocess.send()` serve a far passare un server TCP o un socket object al processo child. The child will receive the object as the second argument passed to the callback function registered on the [`'message'`][] event. Tutti i dati ricevuti e memorizzati tramite il buffering all'interno del socket non verranno inviati al child.

Il `callback` facoltativo è una funzione invocata dopo aver inviato il messaggio ma prima che il child l'abbia ricevuto. La funzione viene chiamata con un singolo argomento: `null` in caso di successo, oppure un [`Error`][] object se fallisce.

Se non viene fornita alcuna funzione `callback` e il messaggio non può essere inviato, verrà emesso un evento `'error'` dal [`ChildProcess`][] object. This can happen, for instance, when the child process has already exited.

`subprocess.send()` restituirà `false` se il canale è chiuso o quando il backlog dei messaggi non inviati supera una soglia oltre la quale è sconsigliato inviarne altri. Altrimenti, il metodo restituisce `true`. La funzione `callback` può essere utilizzata per implementare il flow control (controllo del flusso).

#### Esempio: invio di un server object

L'argomento `sendHandle` può essere utilizzato, ad esempio, per passare l'handle di un server object TCP al processo child come mostrato di seguito:

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

Una volta che il server viene condiviso tra parent e child, alcune connessioni possono essere gestite dal parent ed altre dal child.

While the example above uses a server created using the `net` module, `dgram` module servers use exactly the same workflow with the exceptions of listening on a `'message'` event instead of `'connection'` and using `server.bind()` instead of `server.listen()`. This is, however, currently only supported on Unix platforms.

#### Esempio: invio di un socket object

Allo stesso modo, l'argomento `sendHandler` può essere utilizzato per passare l'handle di un socket al processo child. L'esempio seguente genera due children che gestiscono rispettivamente le connessioni con priorità "normal" o "special":

```js
const { fork } = require('child_process');
const normal = fork('subprocess.js', ['normal']);
const special = fork('subprocess.js', ['special']);

// Apri il server e invia i socket al child. Utilizza pauseOnConnect per impedire 
// la lettura dei socket prima che vengano inviati al processo child.
const server = require('net').createServer({ pauseOnConnect: true });
server.on('connection', (socket) => {

  // If this is special priority...
  if (socket.remoteAddress === '74.125.127.100') {
    special.send('socket', socket);
    return;
  }
  // This is normal priority.
  normal.send('socket', socket);
});
server.listen(1337);
```

Il `subprocess.js` riceverà l'handle del socket come secondo argomento passato alla funzione callback dell'evento:

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

Una volta che un socket viene passato a un child, il parent non è più in grado di rilevare quando tale socket viene distrutto. Per indicare ciò, la proprietà `.connections` diventa `null`. Si consiglia di non utilizzare `.maxConnections` quando questo si verifica.

Si consiglia inoltre che qualsiasi `'message'` handler nel processo child verifichi che il `socket` esista, in quanto la connessione potrebbe essere stata chiusa mentre veniva inviata al child.

### `subprocess.signalCode`

* {integer}

The `subprocess.signalCode` property indicates the signal number received by the child process if any, else `null`.

### `subprocess.spawnargs`

* {Array}

The `subprocess.spawnargs` property represents the full list of command line arguments the child process was launched with.

### `subprocess.spawnfile`

* {string}

The `subprocess.spawnfile` property indicates the executable file name of the child process that is launched.

For [`child_process.fork()`][], its value will be equal to [`process.execPath`][]. For [`child_process.spawn()`][], its value will be the name of the executable file. For [`child_process.exec()`][],  its value will be the name of the shell in which the child process is launched.

### `subprocess.stderr`
<!-- YAML
added: v0.1.90
-->

* {stream.Readable}

Un `Readable Stream` che rappresenta lo `stderr` del processo child.

Se il child è stato generato con `stdio[2]` impostato su un valore diverso da `'pipe'`, allora questo sarà `null`.

`subprocess.stderr` è un alias per `subprocess.stdio[2]`. Entrambe le proprietà faranno riferimento allo stesso valore.

### `subprocess.stdin`
<!-- YAML
added: v0.1.90
-->

* {stream.Writable}

Un `Writable Stream` che rappresenta lo `stdin` del processo child.

If a child process waits to read all of its input, the child will not continue until this stream has been closed via `end()`.

Se il child è stato generato con `stdio[0]` impostato su un valore diverso da `'pipe'`, allora questo sarà `null`.

`subprocess.stdin` è un alias per `subprocess.stdio[0]`. Entrambe le proprietà faranno riferimento allo stesso valore.

### `subprocess.stdio`
<!-- YAML
added: v0.7.10
-->

* {Array}

Uno sparse array dei pipe per il processo child, corrispondenti alle posizioni nell'opzione [`stdio`][], passate a [`child_process.spawn()`][], che sono state impostate al valore `'pipe'`. `subprocess.stdio[0]`, `subprocess.stdio[1]`, and `subprocess.stdio[2]` are also available as `subprocess.stdin`, `subprocess.stdout`, and `subprocess.stderr`, respectively.

Nell'esempio seguente, solo il file descriptor `1` (stdout) del child è configurato come un pipe, quindi solo il `subprocess.stdio[1]` del parent è uno stream, tutti gli altri valori nell'array sono `null`.

```js
const assert = require('assert');
const fs = require('fs');
const child_process = require('child_process');

const subprocess = child_process.spawn('ls', {
  stdio: [
    0, // Use parent's stdin for child.
    'pipe', // Pipe child's stdout to parent.
    fs.openSync('err.out', 'w') // Direct child's stderr to a file.
  ]
});

assert.strictEqual(subprocess.stdio[0], null);
assert.strictEqual(subprocess.stdio[0], subprocess.stdin);

assert(subprocess.stdout);
assert.strictEqual(subprocess.stdio[1], subprocess.stdout);

assert.strictEqual(subprocess.stdio[2], null);
assert.strictEqual(subprocess.stdio[2], subprocess.stderr);
```

### `subprocess.stdout`
<!-- YAML
added: v0.1.90
-->

* {stream.Readable}

Un `Readable Stream` che rappresenta lo `stdout` del processo child.

Se il child è stato generato con `stdio[1]` impostato su un valore diverso da `'pipe'`, allora questo sarà `null`.

`subprocess.stdout` è un alias per `subprocess.stdio[1]`. Entrambe le proprietà faranno riferimento allo stesso valore.

```js
const { spawn } = require('child_process');

const subprocess = spawn('ls');

subprocess.stdout.on('data', (data) => {
  console.log(`Received chunk ${data}`);
});
```

### `subprocess.unref()`
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

L'opzione `maxBuffer` specifica il massimo numero di byte consentiti su `stdout` o su `stderr`. Se questo valore viene superato, allora il processo child viene concluso. Questo influisce sull'output che include gli encoding di caratteri multibyte come UTF-8 o UTF-16. Ad esempio, `console.log('中文测试')` invierà 13 byte con codifica UTF-8 a `stdout` sebbene ci siano solo 4 caratteri.

## Requisiti della Shell

The shell should understand the `-c` switch. If the shell is `'cmd.exe'`, it should understand the `/d /s /c` switches and command line parsing should be compatible.

## Shell Default di Windows

Although Microsoft specifies `%COMSPEC%` must contain the path to `'cmd.exe'` in the root environment, child processes are not always subject to the same requirement. Thus, in `child_process` functions where a shell can be spawned, `'cmd.exe'` is used as a fallback if `process.env.ComSpec` is unavailable.

## Advanced Serialization
<!-- YAML
added: v13.2.0
-->

Child processes support a serialization mechanism for IPC that is based on the [serialization API of the `v8` module](v8.html#v8_serialization_api), based on the [HTML structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm). This is generally more powerful and supports more built-in JavaScript object types, such as `BigInt`, `Map` and `Set`, `ArrayBuffer` and `TypedArray`, `Buffer`, `Error`, `RegExp` etc.

However, this format is not a full superset of JSON, and e.g. properties set on objects of such built-in types will not be passed on through the serialization step. Additionally, performance may not be equivalent to that of JSON, depending on the structure of the passed data. Therefore, this feature requires opting in by setting the `serialization` option to `'advanced'` when calling [`child_process.spawn()`][] or [`child_process.fork()`][].
