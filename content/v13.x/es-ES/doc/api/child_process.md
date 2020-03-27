# Child Process

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

El módulo `child_process` proporciona la habilidad de generar procesos secundarios en una forma similar, pero no idéntica, a popen(3). Esta capacidad es proporcionada principalmente por la función [`child_process.spawn()`][]:

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

El método [`child_process.spawn()`][] genera el proceso secundario asincrónicamente, sin bloquear el bucle de evento Node.js. La función [`child_process.spawnSync()`][] proporciona una funcionalidad equivalente en una forma sincrónica que bloquea el bucle de evento hasta que el proceso generado exista o sea finalizado.

Por conveniencia, el módulo `child_process` proporciona un puñado de alternativas sincrónicas y asincrónicas para [`child_process.spawn()`][] y [`child_process.spawnSync()`][]. Each of these alternatives are implemented on top of [`child_process.spawn()`][] or [`child_process.spawnSync()`][].

* [`child_process.exec()`][]: spawns a shell and runs a command within that shell, passing the `stdout` and `stderr` to a callback function when complete.
* [`child_process.execFile()`][]: similar to [`child_process.exec()`][] except that it spawns the command directly without first spawning a shell by default.
* [`child_process.fork()`][]: spawns a new Node.js process and invokes a specified module with an IPC communication channel established that allows sending messages between parent and child.
* [`child_process.execSync()`][]: a synchronous version of [`child_process.exec()`][] that will block the Node.js event loop.
* [`child_process.execFileSync()`][]: a synchronous version of [`child_process.execFile()`][] that will block the Node.js event loop.

Para ciertos casos de uso, como la automatización de scripts de shell, las [contrapartes sincrónicas](#child_process_synchronous_process_creation) pueden ser más convenientes. Sin embargo, en muchos casos, los métodos sincrónicos pueden tener un impacto significativo en el rendimiento debido al bloqueo del bucle de eventos mientras se completan los procesos generados.

## Creación de Procesos Asincrónicos

Todos los métodos [`child_process.spawn()`][], [`child_process.fork()`][], [`child_process.exec()`][], y [`child_process.execFile()`][] siguen el patrón de programación asíncrono idiomático típico de otras APIs de Node.js.

Cada uno de los métodos devuelve una instancia de [`ChildProcess`][]. Estos objetos implementan la API de [`EventEmitter`][], permitiendo que el proceso primario registre las funciones del listener que son llamadas cuando ocurren ciertos eventos durante el ciclo de vida del proceso secundario.

The [`child_process.exec()`][] and [`child_process.execFile()`][] methods additionally allow for an optional `callback` function to be specified that is invoked when the child process terminates.

### Generar archivos `.bat` y `.cmd` en Windows

La importancia de la distinción entre [`child_process.exec()`][] y [`child_process.execFile()`][] puede variar según la plataforma. On Unix-type operating systems (Unix, Linux, macOS) [`child_process.execFile()`][] can be more efficient because it does not spawn a shell by default. On Windows, however, `.bat` and `.cmd` files are not executable on their own without a terminal, and therefore cannot be launched using [`child_process.execFile()`][]. When running on Windows, `.bat` and `.cmd` files can be invoked using [`child_process.spawn()`][] with the `shell` option set, with [`child_process.exec()`][], or by spawning `cmd.exe` and passing the `.bat` or `.cmd` file as an argument (which is what the `shell` option and [`child_process.exec()`][] do). En cualquier caso, si el nombre de archivo del script contiene espacios necesita ser citado.

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
// O...
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

* `command` {string} El comando a ejecutar, con argumentos separados por espacios.
* `options` {Object}
  * `cwd` {string} El directorio del proceso secundario actualmente operativo. **Default:** `null`.
  * `env` {Object} Pares clave-valor del entorno. **Default:** `process.env`.
  * `encoding` {string} **Default:** `'utf8'`
  * `shell` {string} Shell con el que ejecutar el comando. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `'/bin/sh'` on Unix, `process.env.ComSpec` on Windows.
  * `timeout` {number} **Default:** `0`
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated and any output is truncated. See caveat at [`maxBuffer` and Unicode][]. **Default:** `1024 * 1024`.
  * `killSignal` {string|integer} **Default:** `'SIGTERM'`
  * `uid` {number} Establece la identidad del usuario del proceso (vea stuid(2)).
  * `gid` {number} Establece la identidad del grupo del proceso (vea setgid(2)).
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
* `callback` {Function} called with the output when process terminates.
  * `error` {Error}
  * `stdout` {string|Buffer}
  * `stderr` {string|Buffer}
* Devuelve: {ChildProcess}

Genera un shell, luego ejecuta el `command` dentro de ese shell, cargando cualquier output generado. The `command` string passed to the exec function is processed directly by the shell and special characters (vary based on [shell](https://en.wikipedia.org/wiki/List_of_command-line_interpreters)) need to be dealt with accordingly:

```js
exec('"/path/to/test file/test.sh" arg1 arg2');
// Double quotes are used so that the space in the path is not interpreted as
// a delimiter of multiple arguments.

exec('echo "The \\$HOME variable is $HOME"');
// The $HOME variable is escaped in the first instance, but not in the second.
```

**Nunca pase la entrada del usuario no optimizado a esta función. Any input containing shell metacharacters may be used to trigger arbitrary command execution.**

Si se proporciona una función `callback`, es llamada con los argumentos `(error, stdout, stderr)`. Si tiene éxito, `error` será `null`. Si falla, `error` será una instancia de [`Error`][]. La propiedad `error.code` será el código de salida del proceso secundario, mientras que `error.signal` será establecido a la señal que terminó el proceso. Cualquier otro código de salida distinto a `0` es considerado como un error.

Los argumentos `stdout` y `stderr` pasados a la callback contendrán las outputs stdout y stderr del proceso secundario. Por defecto, Node.js decodificará el output como UTF-8 y pasará las strings a la callback. La opción `encoding` puede ser usada para especificar la codificación de caracteres para decodificar las outputs stdout y stderr. Si `encoding` es `'buffer'`, o una codificación de caracteres no reconocida, los objetos `Buffer` serán pasados a la callback en su lugar.

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

Si `timeout` es mayor que `0`, el proceso primario enviará la señal identificada por la propiedad `killSignal` (por defecto es `'SIGTERM'`) si el proceso secundario se ejecuta por más de `timeout` milisegundos.

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

* `file` {string} El nombre o la ruta del archivo a ejecutar.
* `args` {string[]} Lista de argumentos de string.
* `options` {Object}
  * `cwd` {string} El directorio del proceso secundario actualmente operativo.
  * `env` {Object} Pares clave-valor del entorno. **Default:** `process.env`.
  * `encoding` {string} **Default:** `'utf8'`
  * `timeout` {number} **Default:** `0`
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated and any output is truncated. See caveat at [`maxBuffer` and Unicode][]. **Default:** `1024 * 1024`.
  * `killSignal` {string|integer} **Default:** `'SIGTERM'`
  * `uid` {number} Establece la identidad del usuario del proceso (vea stuid(2)).
  * `gid` {number} Establece la identidad del grupo del proceso (vea setgid(2)).
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
  * `windowsVerbatimArguments` {boolean} No quoting or escaping of arguments is done on Windows. Se ignora en Unix. **Default:** `false`.
  * `shell` {boolean|string} Si es `true`, ejecuta el `command` dentro de un shell. Uses `'/bin/sh'` on Unix, and `process.env.ComSpec` on Windows. A different shell can be specified as a string. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `false` (no shell).
* `callback` {Function} Called with the output when process terminates.
  * `error` {Error}
  * `stdout` {string|Buffer}
  * `stderr` {string|Buffer}
* Devuelve: {ChildProcess}

The `child_process.execFile()` function is similar to [`child_process.exec()`][] except that it does not spawn a shell by default. Rather, the specified executable `file` is spawned directly as a new process making it slightly more efficient than [`child_process.exec()`][].

Se permiten las mismas opciones como [`child_process.exec()`][]. Since a shell is not spawned, behaviors such as I/O redirection and file globbing are not supported.

```js
const { execFile } = require('child_process');
const child = execFile('node', ['--version'], (error, stdout, stderr) => {
  if (error) {
    throw error;
  }
  console.log(stdout);
});
```

Los argumentos `stdout` y `stderr` pasados a la callback contendrán las outputs stdout y stderr del proceso secundario. Por defecto, Node.js decodificará el output como UTF-8 y pasará las strings a la callback. La opción `encoding` puede ser usada para especificar la codificación de caracteres para decodificar las outputs stdout y stderr. Si `encoding` es `'buffer'`, o una codificación de caracteres no reconocida, los objetos `Buffer` serán pasados a la callback en su lugar.

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

* `modulePath` {string} El módulo a ejecutar en el proceso secundario.
* `args` {string[]} Lista de argumentos de string.
* `options` {Object}
  * `cwd` {string} El directorio del proceso secundario actualmente operativo.
  * `detached` {boolean} Prepare el proceso secundario para que sea ejecutado independientemente de su proceso primario. El comportamiento específico depende de la plataforma, vea [`options.detached`][]).
  * `env` {Object} Pares clave-valor del entorno.  **Default:** `process.env`.
  * `execPath` {string} Ejecutable utilizado para crear el proceso secundario.
  * `execArgv` {string[]} Lista de argumentos de strings pasados al ejecutable. **Default:** `process.execArgv`.
  * `serialization` {string} Specify the kind of serialization used for sending messages between processes. Possible values are `'json'` and `'advanced'`. See [Advanced Serialization](#child_process_advanced_serialization) for more details. **Default:** `'json'`.
  * `silent` {boolean} Si es `true`, stdin, stdout, y stderr del proceso secundario serán piped al proceso primario, de lo contrario serán heredadas del proceso primario, vea las opciones `'pipe'` y `'inherit'` para el [`stdio`][] de [`child_process.spawn()`][] para más detalles. **Default:** `false`.
  * `stdio` {Array|string} Vea el [`stdio`][] del [`child_process.spawn()`][]'. Cuando se proporciona esta opción, se anula `silent`. If the array variant is used, it must contain exactly one item with value `'ipc'` or an error will be thrown. Por ejemplo `[0, 1, 2, 'ipc']`.
  * `windowsVerbatimArguments` {boolean} No quoting or escaping of arguments is done on Windows. Se ignora en Unix. **Default:** `false`.
  * `uid` {number} Establece la identidad del usuario del proceso (vea stuid(2)).
  * `gid` {number} Establece la identidad del grupo del proceso (vea setgid(2)).
* Devuelve: {ChildProcess}

El método `child_process.fork()` es un caso especial de [`child_process.spawn()`][] usado específicamente para generar nuevos procesos de Node.js. Al igual que [`child_process.spawn()`][], un objeto [`ChildProcess`][] es devuelto. The returned [`ChildProcess`][] will have an additional communication channel built-in that allows messages to be passed back and forth between the parent and child. Vea [`subprocess.send()`][] para más detalles.

Keep in mind that spawned Node.js child processes are independent of the parent with exception of the IPC communication channel that is established between the two. Cada proceso tiene su propia memoria, con sus propias instancias V8. Debido a las asignaciones de recursos adicionales requeridas, no es recomendado generar un número grande de procesos secundarios de Node.js.

Por defecto, `child_process.fork()` generará nuevas instancias de Node.js utilizando [`process.execPath`][] del proceso primario. La propiedad `execPath`en el objeto `options` permite utilizar una ruta de ejecución alternativa.

Los procesos de Node.js lanzados con un `execPath` personalizado con el proceso primario utilizando el descriptor de archivo (fd) identificado utilizando la variable de ambiente `NODE_CHANNEL_FD` en el proceso secundario.

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

* `command` {string} El comando a ejecutar.
* `args` {string[]} Lista de argumentos de string.
* `options` {Object}
  * `cwd` {string} El directorio del proceso secundario actualmente operativo.
  * `env` {Object} Pares clave-valor del entorno. **Default:** `process.env`.
  * `argv0` {string} Establecer explícitamente el valor de `argv[0]` enviado al proceso secundario. Esto será establecido a `command` si no es especificado.
  * `stdio` {Array|string} Configuración de stdio del proceso secundario (vea [`options.stdio`][`stdio`]).
  * `detached` {boolean} Prepare el proceso secundario para que sea ejecutado independientemente de su proceso primario. El comportamiento específico depende de la plataforma, vea [`options.detached`][]).
  * `uid` {number} Establece la identidad del usuario del proceso (vea stuid(2)).
  * `gid` {number} Establece la identidad del grupo del proceso (vea setgid(2)).
  * `serialization` {string} Specify the kind of serialization used for sending messages between processes. Possible values are `'json'` and `'advanced'`. See [Advanced Serialization](#child_process_advanced_serialization) for more details. **Default:** `'json'`.
  * `shell` {boolean|string} Si es `true`, ejecuta el `command` dentro de un shell. Uses `'/bin/sh'` on Unix, and `process.env.ComSpec` on Windows. A different shell can be specified as a string. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `false` (no shell).
  * `windowsVerbatimArguments` {boolean} No quoting or escaping of arguments is done on Windows. Se ignora en Unix. This is set to `true` automatically when `shell` is specified and is CMD. **Default:** `false`.
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
* Devuelve: {ChildProcess}

El método `child_process.spawn()` genera un nuevo proceso utilizando el `command` dado, con los argumentos de línea de comandos en `args`. Si es omitido, `args` se establece de manera predeterminada a un array vacío.

**If the `shell` option is enabled, do not pass unsanitized user input to this function. Any input containing shell metacharacters may be used to trigger arbitrary command execution.**

Se puede utilizar un tercer argumento para especificar opciones adicionales, con estos valores predeterminados:

```js
const defaults = {
  cwd: undefined,
  env: process.env
};
```

Utilice `cwd` para especificar el directorio de trabajo del cual se genera el proceso. Si no se proporciona, lo predeterminado es heredar el directorio de trabajo actual.

Utilice `env` para especificar las variables de ambiente que serán visibles para el nuevo proceso, la predeterminada es [`process.env`][].

Los valores `undefined` en `env` serán ignorados.

Ejemplo de `ls -lh /usr` ejecutándose, capturando `stdout`, `stderr`, y el código de salida:

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

Ejemplo: Una manera muy elaborada de ejecutar `ps ax | grep ssh`

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

Ejemplo de verificación para `spawn` fallido:

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

En Windows, establecer a `options.detached` como `true` hace posible que el proceso secundario continúe funcionando después de que el proceso primario se cierre. El proceso secundario tendrá su propia ventana de consola. Once enabled for a child process, it cannot be disabled.

En plataformas distintas a Windows, si `options.detached` es establecido como `true`, el proceso secundario se volverá el líder de un proceso de grupo y sesión nuevos. Child processes may continue running after the parent exits regardless of whether they are detached or not. Vea setsid(2) para más información.

Por defecto, el proceso primario esperará que el proceso secundario independiente se cierre. To prevent the parent from waiting for a given `subprocess` to exit, use the `subprocess.unref()` method. Doing so will cause the parent's event loop to not include the child in its reference count, allowing the parent to exit independently of the child, unless there is an established IPC channel between the child and the parent.

Al utilizar la opción `detached` para iniciar un proceso de larga duración, el proceso no se mantendrá corriendo en segundo plano después de que el proceso primario se cierre, a menos que sea provisto con una configuración `stdio` que no esté conectada al proceso primario. Si el `stdio` del proceso primario es heredado, el proceso secundario permanecerá unido al terminal de control.

Ejemplo de un proceso de larga duración, al separar y también ignorar los descriptores de archivo `stdio` de su proceso primario, para ignorar la terminación del proceso primario:

```js
const subprocess = spawn(process.argv[0], ['child_program.js'], {
  detached: true,
  stdio: 'ignore'
});

subprocess.unref();
```

Alternativamente, uno puede redirigir la salida del proceso secundario a archivos:

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

La opción `options.stdio` es utilizada para configurar los pipes que son establecidos entre el proceso primario y el secundario. Por defecto, los stdin, stdout y stderr del proceso secundario son redireccionados a streams [`subprocess.stdin`][], [`subprocess.stdout`][], y [`subprocess.stderr`][] en el objeto [`ChildProcess`][]. Esto es equivalente a configurar el `options.stdio` igual a `['pipe', 'pipe', 'pipe']`.

Por conveniencia, `options.stdio` puede ser uno de los siguientes strings:

* `'pipe'`: equivalent to `['pipe', 'pipe', 'pipe']` (the default)
* `'ignore'`: equivalent to `['ignore', 'ignore', 'ignore']`
* `'inherit'`: equivalent to `['inherit', 'inherit', 'inherit']` or `[0, 1, 2]`

De lo contrario, el valor de `options.stdio` es un array donde cada índice corresponde a un fd en el proceso secundario. Los fds 0, 1, y 2 corresponden a stdin, stdout y stderr respectivamente. Fds adicionales pueden especificarse para crear pipes adicionales entre el proceso primario y el proceso secundario. El valor es uno de los siguientes:

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

*It is worth noting that when an IPC channel is established between the parent and child processes, and the child is a Node.js process, the child is launched with the IPC channel unreferenced (using `unref()`) until the child registers an event handler for the [`'disconnect'`][] event or the [`'message'`][] event. Esto permite que el proceso secundario se cierre normalmente sin que se mantega el proceso abierto por el canal IPC abierto.*

On Unix-like operating systems, the [`child_process.spawn()`][] method performs memory operations synchronously before decoupling the event loop from the child. Applications with a large memory footprint may find frequent [`child_process.spawn()`][] calls to be a bottleneck. For more information, see [V8 issue 7381](https://bugs.chromium.org/p/v8/issues/detail?id=7381).

Vea también: [`child_process.exec()`][] y [`child_process.fork()`][].

## Creación de Procesos Sincrónicos

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

* `file` {string} El nombre o la ruta del archivo a ejecutar.
* `args` {string[]} Lista de argumentos de string.
* `options` {Object}
  * `cwd` {string} El directorio del proceso secundario actualmente operativo.
  * `input` {string|Buffer|TypedArray|DataView} The value which will be passed as stdin to the spawned process. Supplying this value will override `stdio[0]`.
  * `stdio` {string|Array} Configuración del stdio del proceso secundario. `stderr` by default will be output to the parent process' stderr unless `stdio` is specified. **Default:** `'pipe'`.
  * `env` {Object} Pares clave-valor del entorno.  **Default:** `process.env`.
  * `uid` {number} Establece la identidad del usuario del proceso (vea stuid(2)).
  * `gid` {number} Establece la identidad del grupo del proceso (vea setgid(2)).
  * `timeout` {number} En milisegundos, la cantidad máxima de tiempo que se permite que se ejecute el proceso. **Default:** `undefined`.
  * `killSignal` {string|integer} El valor de la señal a ser usada cuando el proceso generado vaya a ser eliminado. **Default:** `'SIGTERM'`.
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. Si se excede, el proceso secundario se finaliza. See caveat at [`maxBuffer` and Unicode][]. **Default:** `1024 * 1024`.
  * `encoding` {string} La codificación usada para todas las inputs y outputs de stdio. **Default:** `'buffer'`.
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
  * `shell` {boolean|string} Si es `true`, ejecuta el `command` dentro de un shell. Uses `'/bin/sh'` on Unix, and `process.env.ComSpec` on Windows. A different shell can be specified as a string. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `false` (no shell).
* Devuelve: {Buffer|string} El stdout desde el comando.

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

* `command` {string} El comando a ejecutar.
* `options` {Object}
  * `cwd` {string} El directorio del proceso secundario actualmente operativo.
  * `input` {string|Buffer|TypedArray|DataView} The value which will be passed as stdin to the spawned process. Supplying this value will override `stdio[0]`.
  * `stdio` {string|Array} Configuración del stdio del proceso secundario. `stderr` by default will be output to the parent process' stderr unless `stdio` is specified. **Default:** `'pipe'`.
  * `env` {Object} Pares clave-valor del entorno. **Default:** `process.env`.
  * `shell` {string} Shell con el que ejecutar el comando. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `'/bin/sh'` on Unix, `process.env.ComSpec` on Windows.
  * `uid` {number} Establece la identidad del usuario del proceso. (Vea setuid(2)).
  * `gid` {number} Establece la identidad del grupo del proceso. (Vea setgid(2)).
  * `timeout` {number} En milisegundos, la cantidad máxima de tiempo que se permite que se ejecute el proceso. **Default:** `undefined`.
  * `killSignal` {string|integer} El valor de la señal a ser usada cuando el proceso generado vaya a ser eliminado. **Default:** `'SIGTERM'`.
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated and any output is truncated. See caveat at [`maxBuffer` and Unicode][]. **Default:** `1024 * 1024`.
  * `encoding` {string} La codificación usada para todas las inputs y outputs de stdio. **Default:** `'buffer'`.
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
* Devuelve: {Buffer|string} El stdout desde el comando.

The `child_process.execSync()` method is generally identical to [`child_process.exec()`][] with the exception that the method will not return until the child process has fully closed. Cuando se haya encontrado un timeout y se haya enviado una `killSignal`, el método no devolverá hasta que el proceso haya sido completamente cerrado. If the child process intercepts and handles the `SIGTERM` signal and doesn't exit, the parent process will wait until the child process has exited.

If the process times out or has a non-zero exit code, this method will throw. The [`Error`][] object will contain the entire result from [`child_process.spawnSync()`][].

**Nunca pase la entrada del usuario no optimizado a esta función. Any input containing shell metacharacters may be used to trigger arbitrary command execution.**

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

* `command` {string} El comando a ejecutar.
* `args` {string[]} Lista de argumentos de string.
* `options` {Object}
  * `cwd` {string} El directorio del proceso secundario actualmente operativo.
  * `input` {string|Buffer|TypedArray|DataView} The value which will be passed as stdin to the spawned process. Supplying this value will override `stdio[0]`.
  * `argv0` {string} Establecer explícitamente el valor de `argv[0]` enviado al proceso secundario. Esto será establecido a `command` si no es especificado.
  * `stdio` {string|Array} Configuración del stdio del proceso secundario.
  * `env` {Object} Pares clave-valor del entorno.  **Default:** `process.env`.
  * `uid` {number} Establece la identidad del usuario del proceso (vea stuid(2)).
  * `gid` {number} Establece la identidad del grupo del proceso (vea setgid(2)).
  * `timeout` {number} En milisegundos, la cantidad máxima de tiempo que se permite que se ejecute el proceso. **Default:** `undefined`.
  * `killSignal` {string|integer} El valor de la señal a ser usada cuando el proceso generado vaya a ser eliminado. **Default:** `'SIGTERM'`.
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated and any output is truncated. See caveat at [`maxBuffer` and Unicode][]. **Default:** `1024 * 1024`.
  * `encoding` {string} La codificación usada para todas las inputs y outputs de stdio. **Default:** `'buffer'`.
  * `shell` {boolean|string} Si es `true`, ejecuta el `command` dentro de un shell. Uses `'/bin/sh'` on Unix, and `process.env.ComSpec` on Windows. A different shell can be specified as a string. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `false` (no shell).
  * `windowsVerbatimArguments` {boolean} No quoting or escaping of arguments is done on Windows. Se ignora en Unix. This is set to `true` automatically when `shell` is specified and is CMD. **Default:** `false`.
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
* Devuelve: {Object}
  * `pid` {number} Pid del proceso secundario.
  * `output` {Array} Array de los resultados del output stdio.
  * `stdout` {Buffer|string} Los contenidos de `output[1]`.
  * `stderr` {Buffer|string} Los contenidos de `output[2]`.
  * `status` {number|null} The exit code of the subprocess, or `null` if the subprocess terminated due to a signal.
  * `signal` {string|null} The signal used to kill the subprocess, or `null` if the subprocess did not terminate due to a signal.
  * `error` {Error} El objeto de error si el proceso secundario falla o expira.

El método `child_process.spawnSync()` es generalmente idéntico a [`child_process.spawn()`][] con la excepción de que la función no se devolverá hasta que el proceso secundario haya sido completamente cerrado. Cuando se haya encontrado un timeout y se haya enviado una `killSignal`, el método no devolverá hasta que el proceso haya sido completamente cerrado. If the process intercepts and handles the `SIGTERM` signal and doesn't exit, the parent process will wait until the child process has exited.

**If the `shell` option is enabled, do not pass unsanitized user input to this function. Any input containing shell metacharacters may be used to trigger arbitrary command execution.**

## Class: `ChildProcess`
<!-- YAML
added: v2.2.0
-->

* Extiende a: {EventEmitter}

Instances of the `ChildProcess` represent spawned child processes.

Las instancias del `ChildProcess` no están destinadas a ser creadas directamente. En su lugar, utilice los métodos [`child_process.spawn()`][], [`child_process.exec()`][], [`child_process.execFile()`][], o [`child_process.fork()`][] para crear instancias de `ChildProcess`.

### Event: `'close'`
<!-- YAML
added: v0.7.7
-->

* `code` {number} El código de salida si el proceso secundario se cerró por sí solo.
* `signal` {string} La señal por la cual el proceso secundario fue terminado.

El evento `'close'` es emitido cuando los streams stdio de un proceso secundario han sido cerrados. Esto es distinto del evento [`'exit'`][], debido a que múltiples procesos pueden compartir los mismos streams stdio.

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

El evento `'disconnect'` es emitido luego de llamar al método [`subprocess.disconnect()`][] en el proceso primario o [`process.disconnect()`][] en el proceso secundario. Luego de desconectarlo, no es posible enviar o recibir mensajes, y la propiedad [`subprocess.connected`][] es `false`.

### Event: `'error'`

* `err` {Error} El error.

El evento `'error'` es emitido cuando:

1. El proceso no pudo ser generado, o
2. El proceso no pudo ser eliminado, o
3. Falló el envío de un mensaje al proceso secundario.

El evento `'exit'` puede o no disparar luego de que haya ocurrido un error. When listening to both the `'exit'` and `'error'` events, guard against accidentally invoking handler functions multiple times.

Vea también [`subprocess.kill()`][] y [`subprocess.send()`][].

### Event: `'exit'`
<!-- YAML
added: v0.1.90
-->

* `code` {number} El código de salida si el proceso secundario se cerró por sí solo.
* `signal` {string} La señal por la cual el proceso secundario fue terminado.

El evento `'exit'` es emitido luego de que el proceso secundario finaliza. Si se cierra el proceso, `code` es el código de salida final del proceso, de otra manera es `null`. Si el proceso se termina debido a la recepción de una señal, `signal` es el nombre de la string de la señal, de lo contrario es `null`. One of the two will always be non-`null`.

When the `'exit'` event is triggered, child process stdio streams might still be open.

Node.js establishes signal handlers for `SIGINT` and `SIGTERM` and Node.js processes will not terminate immediately due to receipt of those signals. Rather, Node.js will perform a sequence of cleanup actions and then will re-raise the handled signal.

Vea waitpid(2).

### Event: `'message'`
<!-- YAML
added: v0.5.9
-->

* `message` {Object} Un objeto JSON analizado o un valor primitivo.
* `sendHandle` {Handle} Un objeto [`net.Socket`][] o [`net.Server`][], o indefinido.

The `'message'` event is triggered when a child process uses [`process.send()`][] to send messages.

El mensaje pasa a través de la serialización y análisis. The resulting message might not be the same as what is originally sent.

If the `serialization` option was set to `'advanced'` used when spawning the child process, the `message` argument can contain data that JSON is not able to represent. See [Advanced Serialization](#child_process_advanced_serialization) for more details.

### `subprocess.channel`
<!-- YAML
added: v7.1.0
-->

* {Object} Un pipe que representa el canal IPC al proceso secundario.

La propiedad `subprocess.channel` es una referencia al canal IPC del proceso secundario. If no IPC channel currently exists, this property is `undefined`.

### `subprocess.connected`
<!-- YAML
added: v0.7.2
-->

* {boolean} Establece a `false` luego de que se llame a `subprocess.disconnect()`.

La propiedad `subprocess.connected` indica si todavía es posible enviar y recibir mensajes de un proceso secundario. Cuando `subprocess.connected` es `false`, no es posible enviar o recibir mensajes.

### `subprocess.disconnect()`
<!-- YAML
added: v0.7.2
-->

Cierra el canal IPC entre el proceso primario y el secundario, permitiendo que el secundario se cierre exitosamente, una vez que no hayan otras conexiones que lo mantengan activo. Luego de llamar a este método, las propiedades `subprocess.connected` y `process.connected` tanto en el proceso primario como en el secundario (respectivamente) serán establecidas a `false`, y ya no será posible pasar mensajes entre procesos.

El evento `'disconnect'` será emitido cuando no hayan mensajes en el proceso de ser recibidos. Generalmente, esto será activado inmediatamente después de llamar a `subprocess.disconnect()`.

When the child process is a Node.js instance (e.g. spawned using [`child_process.fork()`][]), the `process.disconnect()` method can be invoked within the child process to close the IPC channel as well.

### `subprocess.exitCode`

* {integer}

The `subprocess.exitCode` property indicates the exit code of the child process. If the child process is still running, the field will be `null`.

### `subprocess.kill([signal])`
<!-- YAML
added: v0.1.90
-->

* `signal` {number|string}
* Devuelve: {boolean}

El método `subprocess.kill()` envía una señal al proceso secundario. Si no se proporciona ningún argumento, se le enviará la señal `'SIGTERM'` al proceso. Vea signal(7) para una lista de señales disponibles. This function returns `true` if kill(2) succeeds, and `false` otherwise.

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

Vea kill(2) para referencias.

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

* {boolean} Establecido a `true` después de que se haya usado `subprocess.kill()` para enviar una señal de manera exitosa al proceso secundario.

La propiedad `subprocess.killed` indica si el proceso secundario recibió de manera exitosa una señal desde `subprocess.kill()`. La propiedad `killed` no indica que el proceso secundario haya sido terminado.

### `subprocess.pid`
<!-- YAML
added: v0.1.90
-->

* {integer}

Devuelve el identificador de proceso (PID) del proceso secundario.

```js
const { spawn } = require('child_process');
const grep = spawn('grep', ['ssh']);

console.log(`Proceso secundario generado con pid: ${grep.pid}`);
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
  * `keepOpen` {boolean} A value that can be used when passing instances of `net.Socket`. Cuando es `true`, la conexión se mantiene abierta en el proceso de envío. **Default:** `false`.
* `callback` {Function}
* Devuelve: {boolean}

Cuando un canal IPC ha sido establecido entre el proceso primario y el secundario (p. ej., al usar [`child_process.fork()`][]), el método `subprocess.send()` puede ser usado para enviar mensajes al proceso secundario. When the child process is a Node.js instance, these messages can be received via the [`'message'`][] event.

El mensaje pasa a través de la serialización y análisis. The resulting message might not be the same as what is originally sent.

Por ejemplo, en el script primario:

```js
const cp = require('child_process');
const n = cp.fork(`${__dirname}/sub.js`);

n.on('message', (m) => {
  console.log('PRINCIPAL recibió el mensaje:', m);
});

// Hace que el secundario imprima:  SECUNDARIO recibió el mensaje: { hello: 'world' }

n.send({ hello: 'world' });
```

Y entonces el script secundario, `'sub.js'` puede lucir así:

```js
process.on('message', (m) => {
  console.log('SECUNDARIO recibió el mensaje:', m);
});

// Hace que el principal imprima: PRINICPAL recibió el mensaje: { foo: 'bar', baz: null }
process.send({ foo: 'bar', baz: NaN });
```

Child Node.js processes will have a [`process.send()`][] method of their own that allows the child to send messages back to the parent.

Hay un caso especial al enviar un mensaje `{cmd: 'NODE_foo'}`. Messages containing a `NODE_` prefix in the `cmd` property are reserved for use within Node.js core and will not be emitted in the child's [`'message'`][] event. Rather, such messages are emitted using the `'internalMessage'` event and are consumed internally by Node.js. Las aplicaciones deben evitar usar dichos mensajes o escuchar los eventos `'internalMessage'` ya que están sujetos a cambiar sin previo aviso.

El argumento opcional `sendHandle` que puede ser pasado a `subprocess.send()` es para pasar un servidor TCP o un objeto socket al proceso secundario. The child will receive the object as the second argument passed to the callback function registered on the [`'message'`][] event. Cualquier dato que sea recibido y almacenado en el socket no será enviado al proceso secundario.

La `callback` opcional es una función que es invocada después de que el mensaje es enviado, pero antes de que el proceso secundario pudiera haberlo recibido. La función es llamada con un solo argumento: `null` si tiene éxito, o un objeto [`Error`][] si falla.

Si no se proporciona ninguna función `callback` y el mensaje no puede ser enviado, un evento `'error'` será emitido por el objeto [`ChildProcess`][]. This can happen, for instance, when the child process has already exited.

`subprocess.send()` devolverá `false` si el canal ha cerrado o cuando el backlog de mensajes no enviados exceda el límite que hace imprudente enviar más. De lo contrario, el método devuelve `true`. La función `callback` puede ser usada para implementar control de flujo.

#### Ejemplo: enviar un objeto del servidor

El argumento `sendHandle` puede ser usado, por ejemplo, para pasar el handle de un servidor TCP al proceso secundario como es ilustrado en el siguiente ejemplo:

```js
const subprocess = require('child_process').fork('subprocess.js');

// Abra el objeto del servidor y envíe el manejador.
const server = require('net').createServer();
server.on('connection', (socket) => {
  socket.end('handled by parent');
});
server.listen(1337, () => {
  subprocess.send('server', server);
});
```

El proceso secundario después recibirá el objeto del servidor como:

```js
process.on('message', (m, server) => {
  if (m === 'server') {
    server.on('connection', (socket) => {
      socket.end('handled by child');
    });
  }
});
```

Una vez el servidor sea compartido entre el proceso primario y el secundario, algunas conexiones pueden ser manejadas por el proceso primario y otras por el secundario.

While the example above uses a server created using the `net` module, `dgram` module servers use exactly the same workflow with the exceptions of listening on a `'message'` event instead of `'connection'` and using `server.bind()` instead of `server.listen()`. This is, however, currently only supported on Unix platforms.

#### Ejemplo: enviar un objeto socket

De manera similar, el argumento `sendHandler` puede ser usado para pasar el handle de un socket al proceso secundario. El siguiente ejemplo genera dos procesos secundarios, cada uno maneja conexiones con prioridad "normal" o "especial":

```js
const { fork } = require('child_process');
const normal = fork('subprocess.js', ['normal']);
const special = fork('subprocess.js', ['special']);

// Abra el servidor y envíe los sockets al proceso secundario. Use pauseOnConnect para prevenir
// que los sockets sean leídos antes de ser enviados al proceso secundario.
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

El `subprocess.js` recibiría el handle del socket como el segundo argumento pasado a la función del evento callback:

```js
process.on('message', (m, socket) => {
  if (m === 'socket') {
    if (socket) {
      // Verifique que el socket del cliente exista.
      // Es posible que se cierre el socket entre el tiempo en que se
      // envía y el tiempo en el que se recibe el proceso secundario.
      socket.end(`Request handled with ${process.argv[2]} priority`);
    }
  }
});
```

Una vez que un conector ha sido pasado al proceso secundario, el proceso primario ya no es capaz de monitorear cuando es destruido. Para indicar esto, la propiedad `.connections` se convierte en `null`. Se recomienda no utilizar `.maxConnections` cuando esto ocurre.

También se recomienda que cualquier handle de `'message'` en el proceso secundario verifique que el `socket` exista, ya que la conexión puede haber sido cerrada durante el tiempo que toma enviar la conexión al proceso secundario.

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

Un `Readable Stream` que representa el `stderr` del proceso secundario.

Si el proceso secundario fue generado con `stdio[2]` establecido a cualquier valor distinto a `'pipe'`, entonces esto será `null`.

`subprocess.stderr` es un alias para `subprocess.stdio[2]`. Ambas propiedades se referirán al mismo valor.

### `subprocess.stdin`
<!-- YAML
added: v0.1.90
-->

* {stream.Writable}

Un `Writable Stream` que representa al `stdin` del proceso secundario.

If a child process waits to read all of its input, the child will not continue until this stream has been closed via `end()`.

Si el proceso secundario fue generado con `stdio[0]` establecido a cualquier valor distinto a `'pipe'`, entonces esto será `null`.

`subprocess.stdin` es un alias para `subprocess.stdio[0]`. Ambas propiedades se referirán al mismo valor.

### `subprocess.stdio`
<!-- YAML
added: v0.7.10
-->

* {Array}

Un array disperso de pipes al proceso secundario, correspondiente con posición en la opción [`stdio`][] pasada al [`child_process.spawn()`][] que ha sido establecido al valor de `'pipe'`. `subprocess.stdio[0]`, `subprocess.stdio[1]`, and `subprocess.stdio[2]` are also available as `subprocess.stdin`, `subprocess.stdout`, and `subprocess.stderr`, respectively.

En el siguiente ejemplo, solo el fd `1` (stdout) del proceso secundario está configurado como un pipe, así que solo el `subprocess.stdio[1]` del proceso primario es una stream, todos los demás valores en el array son `null`.

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

Un `Readable Stream` que representa el `stdout` del proceso secundario.

Si el proceso secundario fue generado con `stdio[1]` establecido a cualquier valor distinto a `'pipe'`, entonces esto será `null`.

`subprocess.stdout` es un alias para `subprocess.stdio[1]`. Ambas propiedades se referirán al mismo valor.

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

Por defecto, el proceso primario esperará que el proceso secundario independiente se cierre. To prevent the parent from waiting for a given `subprocess` to exit, use the `subprocess.unref()` method. Doing so will cause the parent's event loop to not include the child in its reference count, allowing the parent to exit independently of the child, unless there is an established IPC channel between the child and the parent.

```js
const subprocess = spawn(process.argv[0], ['child_program.js'], {
  detached: true,
  stdio: 'ignore'
});

subprocess.unref();
```

## `maxBuffer` y Unicode

La opción `maxBuffer` especifica el mayor número de bytes permitidos en `stdout` o `stderr`. Si se excede este valor, entonces el proceso secundario finaliza. Esto impacta el output que incluye codificaciones de caracteres multibyte como UTF-8 o UTF-16. Por ejemplo, `console.log('中文测试')` enviará 13 UTF-8 bytes codificados a `stdout`, aunque solo hayan 4 caracteres.

## Requerimientos de Shell

The shell should understand the `-c` switch. If the shell is `'cmd.exe'`, it should understand the `/d /s /c` switches and command line parsing should be compatible.

## Shell de Windows Predeterminado

Although Microsoft specifies `%COMSPEC%` must contain the path to `'cmd.exe'` in the root environment, child processes are not always subject to the same requirement. Thus, in `child_process` functions where a shell can be spawned, `'cmd.exe'` is used as a fallback if `process.env.ComSpec` is unavailable.

## Advanced Serialization
<!-- YAML
added: v13.2.0
-->

Child processes support a serialization mechanism for IPC that is based on the [serialization API of the `v8` module](v8.html#v8_serialization_api), based on the [HTML structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm). This is generally more powerful and supports more built-in JavaScript object types, such as `BigInt`, `Map` and `Set`, `ArrayBuffer` and `TypedArray`, `Buffer`, `Error`, `RegExp` etc.

However, this format is not a full superset of JSON, and e.g. properties set on objects of such built-in types will not be passed on through the serialization step. Additionally, performance may not be equivalent to that of JSON, depending on the structure of the passed data. Therefore, this feature requires opting in by setting the `serialization` option to `'advanced'` when calling [`child_process.spawn()`][] or [`child_process.fork()`][].
