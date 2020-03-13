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
  console.log(`stderr: ${data}`);
});

ls.on('close', (code) => {
  console.log(`el proceso secundario terminó con el código ${code}`);
});
```

Por defecto, los pipes para `stdin`, `stdout` y `stderr` son establecidos entre el proceso Node.js primario y el proceso secundario generado. Estos pipes tienen capacidad (y plataforma específica) limitada. Si el proceso secundario escribe a stdout, excediendo ese límite sin que se haya capturado la salida, el proceso secundario lo bloqueará esperando a que el búfer del pipe acepte más datos. Esto es idéntico al comportamiento de los pies en el shell. Utilice la opción `{ stdio: 'ignore' }` si la salida no será consumida.

El método [`child_process.spawn()`][] genera el proceso secundario asincrónicamente, sin bloquear el bucle de evento Node.js. La función [`child_process.spawnSync()`][] proporciona una funcionalidad equivalente en una forma sincrónica que bloquea el bucle de evento hasta que el proceso generado exista o sea finalizado.

Por conveniencia, el módulo `child_process` proporciona un puñado de alternativas sincrónicas y asincrónicas para [`child_process.spawn()`][] y [`child_process.spawnSync()`][]. *Note que cada una de estas alternativas son implementadas por encima de [`child_process.spawn()`][] o de [`child_process.spawnSync()`][].*

  * [`child_process.exec()`][]: spawns a shell and runs a command within that shell, passing the `stdout` and `stderr` to a callback function when complete.
  * [`child_process.execFile()`][]: similar to [`child_process.exec()`][] except that it spawns the command directly without first spawning a shell by default.
  * [`child_process.fork()`][]: spawns a new Node.js process and invokes a specified module with an IPC communication channel established that allows sending messages between parent and child.
  * [`child_process.execSync()`][]: a synchronous version of [`child_process.exec()`][] that *will* block the Node.js event loop.
  * [`child_process.execFileSync()`][]: a synchronous version of [`child_process.execFile()`][] that *will* block the Node.js event loop.

Para ciertos casos de uso, como la automatización de scripts de shell, las [contrapartes sincrónicas](#child_process_synchronous_process_creation) pueden ser más convenientes. Sin embargo, en muchos casos, los métodos sincrónicos pueden tener un impacto significativo en el rendimiento debido al bloqueo del bucle de eventos mientras se completan los procesos generados.

## Creación de Procesos Asincrónicos

Todos los métodos [`child_process.spawn()`][], [`child_process.fork()`][], [`child_process.exec()`][], y [`child_process.execFile()`][] siguen el patrón de programación asíncrono idiomático típico de otras APIs de Node.js.

Cada uno de los métodos devuelve una instancia de [`ChildProcess`][]. Estos objetos implementan la API de [`EventEmitter`][], permitiendo que el proceso primario registre las funciones del listener que son llamadas cuando ocurren ciertos eventos durante el ciclo de vida del proceso secundario.

Los métodos [`child_process.exec()`][] y [`child_process.execFile()`][] adicionalmente siguen una función de `callback` opcional para especificar que es invocada cuando el proceso secundario termina.

### Generar archivos `.bat` y `.cmd` en Windows

La importancia de la distinción entre [`child_process.exec()`][] y [`child_process.execFile()`][] puede variar según la plataforma. En sistemas operativos de tipo Unix (Unix, Linux, macOS) [`child_process.execFile()`][] puede ser más eficiente debido a que no genera un shell por defecto. Sin embargo, en Windows, los archivos `.bat` y `.cmd` no son ejecutables por su propia cuenta sin un terminal, por lo tanto no pueden ser ejecutados utilizando [`child_process.execFile()`][]. Al ejecutarse en Windows, los archivos `.bat` y `.cmd` pueden ser invocados usando [`child_process.spawn()`][] con el conjunto de opciones `shell`, con [`child_process.exec()`][], o al generar `cmd.exe` y pasar el archivo `.bat` o `.cmd` como un argumento (que es lo que hacen las opciones `shell` y [`child_process.exec()`][]). En cualquier caso, si el nombre de archivo del script contiene espacios necesita ser citado.

```js
// Solo en Windows ...
const { spawn } = require('child_process');
const bat = spawn('cmd.exe', ['/c', 'my.bat']);

bat.stdout.on('data', (data) => {
  console.log(data.toString());
});

bat.stderr.on('data', (data) => {
  console.log(data.toString());
});

bat.on('exit', (code) => {
  console.log(`El proceso secundario terminó con el código ${code}`);
});
```

```js
// O...
const { exec } = require('child_process');
exec('my.bat', (err, stdout, stderr) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(stdout);
});

// Script con espacios en el filename:
const bat = spawn('"my script.cmd"', ['a', 'b'], { shell: true });
// o:
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

* `command` {string} El comando a ejecutar, con argumentos separados por espacios.
* `opciones` {Object}
  * `cwd` {string} Directorio del proceso secundario actualmente operativo. **Predeterminado:** `null`.
  * `env` {Object} Pares clave-valor del entorno. **Predeterminado:** `null`.
  * `encoding` {string} **Predeterminado:** `'utf8'`
  * `shell` {string} Shell con el que ejecutar el comando. Vea los [Requerimientos de Shell](#child_process_shell_requirements) y [Shell de Windows Predeterminado](#child_process_default_windows_shell). **Default:** `'/bin/sh'` en UNIX, `process.env.ComSpec` en Windows.
  * `timeout` {number} **Predeterminado:** `0`
  * `maxBuffer` {number} La mayor cantidad de datos en bytes permitidos en stdout o stderr. Si se excede, el proceso secundario se finaliza. Vea caveat en [`maxBuffer` y Unicode][]. **Predeterminado:** `200 * 1024`.
  * `killSignal` {string|integer} **Predeterminado:** `'SIGTERM'`
  * `uid` {number} Establece la identidad de usuario del proceso (vea setuid(2)).
  * `gid` {number} Establece la identidad de grupo del proceso (vea setgid(2)).
  * `windowsHide` {boolean} Oculta la ventana de la consola del sub-proceso que normalmente se crea en los sistemas Windows. **Predeterminado:** `false`.
* `callback` {Function} called with the output when process terminates.
  * `error` {Error}
  * `stdout` {string|Buffer}
  * `stderr` {string|Buffer}
* Devuelve: {ChildProcess}

Genera un shell, luego ejecuta el `command` dentro de esa shell, cargando cualquier salida generada. La string `command` pasada a la función exec es procesada directamente por el shell y los caracteres especiales (varía dependiendo del [shell](https://en.wikipedia.org/wiki/List_of_command-line_interpreters)) necesitan ser tratados en consecuencia:
```js
exec('"/path/to/test file/test.sh" arg1 arg2');
//Double quotes are used so that the space in the path is not interpreted as
//multiple arguments

exec('echo "The \\$HOME variable is $HOME"');
//The $HOME variable is escaped in the first instance, but not in the second
```

*Note*: Never pass unsanitized user input to this function. Cualquier input que contenga metacaracteres shell puede ser usada para activar la ejecución de comando arbitrario.

```js
const { exec } = require('child_process');
exec('cat *.js bad_file | wc -l', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error de ejecución: ${error}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
});
```

Si se proporciona una función `callback`, se llama con los argumentos `(error, stdout, stderr)`. En éxito, el `error` será `null`. En error, el `error` será una instancia de [`Error`][]. La propiedad `error.code` será el código de salida del proceso secundario, mientras que `error.signal` se establecerá a la señal que finalizó el proceso. Cualquier otro código de salida distinto a `0` se considera como un error.

Los argumentos `stdout` y `stderr` pasados al callback contendrán la salida stdout y stderr del proceso secundario. Por defecto, Node.js decodificará la salida como UTF-8 y pasará las strings al callback. La opción `codificación` puede ser utilizada para especificar la codificación de caracteres para decodificar las salida stdout y stderr. Si `encoding` es `'buffer'` o una codificación de caracter no reconocido, los objetos `Buffer` serán pasados al callback en su lugar.

Si `timeout` es mayor que `0`, el proceso primario enviará la señal identificada por la propiedad `killSignal` (por defecto es `'SIGTERM'`) si el proceso secundario se ejecuta por más de `timeout` milisegundos.

*Note*: Unlike the exec(3) POSIX system call, `child_process.exec()` does not replace the existing process and uses a shell to execute the command.

If this method is invoked as its [`util.promisify()`][]ed version, it returns a Promise for an object with `stdout` and `stderr` properties. In case of an error, a rejected promise is returned, with the same `error` object given in the callback, but with an additional two properties `stdout` and `stderr`.

For example:

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

* `file` {string} El nombre o la ruta del archivo ejecutable a ejecutar.
* `args` {string[]} Lista de argumentos de strings.
* `opciones` {Object}
  * `cwd` {string} Directorio del proceso secundario actualmente operativo.
  * `env` {Object} Pares clave-valor del entorno.
  * `encoding` {string} **Predeterminado:** `'utf8'`
  * `timeout` {number} **Predeterminado:** `0`
  * `maxBuffer` {number} La mayor cantidad de datos en bytes permitidos en stdout o stderr. Si se excede, el proceso secundario se finaliza. Vea caveat en [`maxBuffer` y Unicode][]. **Predeterminado:** `200 * 1024`.
  * `killSignal` {string|integer} **Predeterminado:** `'SIGTERM'`
  * `uid` {number} Establece la identidad de usuario del proceso (vea setuid(2)).
  * `gid` {number} Establece la identidad de grupo del proceso (vea setgid(2)).
  * `windowsHide` {boolean} Oculta la ventana de la consola del sub-proceso que normalmente se crea en los sistemas Windows. **Predeterminado:** `false`.
  * `windowsVerbatimArguments` {boolean} No se realiza ninguna cita o escape de argumentos en Windows. Se ignora en Unix. **Predeterminado:** `false`.
  * `shell` {boolean|string} Si es `true`, se ejecuta el `command` dentro del shell. Utiliza `'/bin/sh'` en UNIX y `process.env.ComSpec` en Windows. Una shell diferente puede especificarse como una string. Vea los [Requerimientos de Shell](#child_process_shell_requirements) y [Shell de Windows Predeterminado](#child_process_default_windows_shell). **Predeterminado:** `false` (sin shell).
* `callback` {Function} Called with the output when process terminates.
  * `error` {Error}
  * `stdout` {string|Buffer}
  * `stderr` {string|Buffer}
* Devuelve: {ChildProcess}

La función `child_process.execFile()` es similar a [`child_process.exec()`][] excepto que no genera un shell por defecto. Más bien, el `file` ejecutable especificado es generado directamente como un nuevo proceso, haciéndolo ligeramente más eficiente que [`child_process.exec()`][].

Se admiten las mismas opciones como [`child_process.exec()`][]. Ya que no es generado un shell, no se permiten comportamientos tales como la redirección I/O y el agrupamiento de archivos.

```js
const { execFile } = require('child_process');
const child = execFile('node', ['--version'], (error, stdout, stderr) => {
  if (error) {
    throw error;
  }
  console.log(stdout);
});
```

Los argumentos `stdout` y `stderr` pasados al callback contendrán las salidas stdout y stderr del proceso secundario. Por defecto, Node.js decodificará la salida como UTF-8 y pasará las strings al callback. La opción `encoding` puede ser usada para especificar la codificación de caracter usada para decodificar las salidas stdout y stderr. Si `encoding` es `'buffer'` o una codificación de caracter no reconocido, los objetos `Buffer` serán pasados al callback en su lugar.

If this method is invoked as its [`util.promisify()`][]ed version, it returns a Promise for an object with `stdout` and `stderr` properties. In case of an error, a rejected promise is returned, with the same `error` object given in the callback, but with an additional two properties `stdout` and `stderr`.

```js
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
async function getVersion() {
  const { stdout } = await execFile('node', ['--version']);
  console.log(stdout);
}
getVersion();
```

*Note*: If the `shell` option is enabled, do not pass unsanitized user input to this function. Cualquier input que contenga metacaracteres de shell puede ser utilizada para activar la ejecución arbitraria de comandos.

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

* `modulePath` {string} El módulo a ejecutar en el proceso secundario.
* `args` {Array} Lista de argumentos de string.
* `opciones` {Object}
  * `cwd` {string} Directorio del proceso secundario actualmente operativo.
  * `env` {Object} Pares clave-valor del entorno.
  * `execPath` {string} Ejecutable utilizado para crear el proceso secundario.
  * `execArgv` {Array} Lista de argumentos de string pasados al ejecutable. **Predeterminado:** `process.execArgv`.
  * `silent` {boolean} Si es `true`, stdin, stdout, y stderr del proceso secundario serán piped al proceso primario, de lo contrario serán heredadas del proceso primario, vea las opciones `'pipe'` y `'inherit'` para el [`stdio`][] de [`child_process.spawn()`][] para más detalles. **Predeterminado:** `false`.
  * `stdio` {Array|string} Vea el [`stdio`][] del [`child_process.spawn()`][]'. Cuando se proporciona esta opción, se anula `silent`. Si la variante del array es usada, debe contener exactamente un artículo con el valor `'ipc'` o se arrojará un error. Por ejemplo `[0, 1, 2, 'ipc']`.
  * `windowsVerbatimArguments` {boolean} No se realiza ninguna cita o escape de argumentos en Windows. Se ignora en Unix. **Predeterminado:** `false`.
  * `uid` {number} Establece la identidad de usuario del proceso (vea setuid(2)).
  * `gid` {number} Establece la identidad de grupo del proceso (vea setgid(2)).
* Devuelve: {ChildProcess}

El método `child_process.fork()` es un caso especial de [`child_process.spawn()`][] usado específicamente para generar nuevos procesos Node.js. Al igual que [`child_process.spawn()`][], se devuelve un objeto [`ChildProcess`][]. El [`ChildProcess`][] devuelto tendrá un canal de comunicación integrado que permite que los mensajes se pasen de un lado a otro entre el proceso primario y el proceso secundario. Vea [`subprocess.send()`][] para más detalles.

Es importante tener presente que los procesos secundarios Node.js generados son independientes de los procesos primarios a excepción del canal de comunicación IPC que se establece entre ambos. Cada proceso tiene su propia memoria con sus propias instancias V8. Debido a las asignaciones de recursos adicionales requeridas, la generación de un número más grande de procesos secundarios Node.js no es recomendado.

Por defecto, `child_process.fork()` generará nuevas instancias Node.js usando el [`process.execPath`][] del proceso primario. La propiedad `execPath` en el objeto `options` permite usar una ruta de ejecución alternativa.

Los procesos Node.js iniciados con una `execPath` personalizada se comunicarán con el proceso primario usando el descriptor de archivo (fd) identificado usando la variable ambiente `NODE_CHANNEL_FD` en el proceso secundario.

*Note*: Unlike the fork(2) POSIX system call, `child_process.fork()` does not clone the current process.

*Note*: La opción `shell` disponible en [`child_process.spawn()`][] no es soportada por `child_process.fork()` y será ignorada si se establece.

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

* `command` {string} El comando a ejecutar.
* `args` {Array} Lista de argumentos de string.
* `opciones` {Object}
  * `cwd` {string} Directorio del proceso secundario actualmente operativo.
  * `env` {Object} Pares clave-valor del entorno.
  * `argv0` {string} Establecer explícitamente el valor de `argv[0]` enviado al proceso secundario. Esto será establecido a `command` si no es especificado.
  * `stdio` {Array|string} Configuración de stdio del proceso secundario (vea [`options.stdio`][`stdio`]).
  * `detached` {boolean} Prepare el proceso secundario para que sea ejecutado independientemente de su proceso primario. El comportamiento específico depende de la plataforma, vea [`options.detached`][]).
  * `uid` {number} Establece la identidad de usuario del proceso (vea setuid(2)).
  * `gid` {number} Establece la identidad de grupo del proceso (vea setgid(2)).
  * `shell` {boolean|string} Si es `true`, se ejecuta el `command` dentro del shell. Utiliza `'/bin/sh'` en UNIX y `process.env.ComSpec` en Windows. Una shell diferente puede especificarse como una string. Vea los [Requerimientos de Shell](#child_process_shell_requirements) y [Shell de Windows Predeterminado](#child_process_default_windows_shell). **Predeterminado:** `false` (sin shell).
  * `windowsVerbatimArguments` {boolean} No se realiza ninguna cita o escape de argumentos en Windows. Se ignora en Unix. Esto se establece automáticamente a `true` cuando se especifica `shell`. **Predeterminado:** `false`.
  * `windowsHide` {boolean} Oculta la ventana de la consola del sub-proceso que normalmente se crea en los sistemas Windows. **Predeterminado:** `false`.
* Devuelve: {ChildProcess}

El método `child_process.spawn()` genera un nuevo proceso usando el `command` dado con los argumentos de línea de comando en `args`. Si se omite, `args` se establece de manera predeterminada a un array vacío.

*Note*: If the `shell` option is enabled, do not pass unsanitized user input to this function. Cualquier input que contenga metacaracteres de shell puede ser utilizada para activar la ejecución arbitraria de comandos.

Se puede utilizar un tercer argumento para especificar opciones adicionales con estos valores predeterminados:

```js
const defaults = {
  cwd: undefined,
  env: process.env
};
```

Utilice `cwd` para especificar el directorio de trabajo del cual se genera el proceso. Si no se proporciona, lo predeterminado es heredar el directorio actualmente trabajando.

Utilice `env` para especificar las variables de ambiente que serán visibles para el nuevo proceso, el predeterminado es [`process.env`][].

Ejemplo de `ls -lh /usr` ejecutándose, capturando `stdout`, `stderr` y el código de salida:

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
  console.log(`el proceso secundario terminó con el código ${code}`);
});
```


Ejemplo: Una manera muy elaborada para ejecutar `ps ax | grep ssh`

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
    console.log(`el proceso ps terminó con el código ${code}`);
  }
  grep.stdin.end();
});
```


Ejemplo de verificación para `spawn` fallido:

```js
const { spawn } = require('child_process');
const subprocess = spawn('bad_command');

subprocess.on('error', (err) => {
  console.log('Falló al iniciar el subproceso.');
});
```

*Note*: Certain platforms (macOS, Linux) will use the value of `argv[0]` for the process title while others (Windows, SunOS) will use `command`.

*Note*: Node.js currently overwrites `argv[0]` with `process.execPath` on startup, so `process.argv[0]` in a Node.js child process will not match the `argv0` parameter passed to `spawn` from the parent, retrieve it with the `process.argv0` property instead.

#### options.detached
<!-- YAML
added: v0.7.10
-->

En Windows, configurar `options.detached` a `true` hace posible que el proceso secundario continúe funcionando después de que el proceso primario se cierre. El proceso secundario tendrá su propia ventana de consola. *Una vez activado para un proceso secundario, no puede ser desactivado*.

En plataformas distintas de Windows, si `options.detached` se establece a `true`, el proceso secundario se volverá el líder de un grupo de proceso y sesión nuevos. Note que los procesos secundarios pueden continuar funcionando después de que el proceso primario se cierre, independientemente de si se separan o no. Vea setsid(2) para más información.

Por defecto, el proceso primario esperará que el proceso secundario independiente se cierre. Para prevenir que el proceso primario espere por un `subprocess` dado, utilice el método `subprocess.unref()`. Haciendo esto causará que el bucle del evento del proceso primario no incluya al proceso secundario en su cuenta de referencia, permitiendo que el proceso primario se cierre independientemente del proceso secundario, a menos que haya un canal IPC establecido entre ambos procesos.

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

#### options.stdio
<!-- YAML
added: v0.7.10
changes:
  - version: v3.3.1
    pr-url: https://github.com/nodejs/node/pull/2727
    description: The value `0` is now accepted as a file descriptor.
-->

La opción `options.stdio` es utilizada para configurar los pipes que son establecidos entre el proceso primario y el proceso secundario. Por defecto, el stdin, stdout y stderr del proceso secundario son redireccionados a streams [`subprocess.stdin`][], [`subprocess.stdout`][] y [`subprocess.stderr`][] correspondientes en el objeto [`ChildProcess`][]. Esto es equivalente a configurar el `options.stdio` igual a `['pipe', 'pipe', 'pipe']`.

Por conveniencia, `options.stdio` puede ser uno de los siguientes strings:

* `'pipe'` - equivalente a `['pipe', 'pipe', 'pipe']` (lo predeterminado)
* `'ignore'` - equivalente a `['ignore', 'ignore', 'ignore']`
* `'inherit'` equivalente a `[process.stdin, process.stdout, process.stderr]` o `[0,1,2]`

De otra manera, el valor de `options.stdio` es un array en donde cada índice corresponde a un fd en el proceso secundario. Los fds 0, 1 y 2 corresponden a stdin, stdout y stderr respectivamente. Fds adicionales pueden especificarse para crear pipes adicionales entre el proceso primario y el proceso secundario. El valor es uno de los siguientes:

1. `'pipe'` - Crear un pipe entre el proceso secundario y el proceso primario. The parent end of the pipe is exposed to the parent as a property on the `child_process` object as [`subprocess.stdio[fd]`][`stdio`]. Pipes created for fds 0 - 2 are also available as [`subprocess.stdin`][], [`subprocess.stdout`][] and [`subprocess.stderr`][], respectively.
2. `'ipc'` - Create an IPC channel for passing messages/file descriptors between parent and child. A [`ChildProcess`][] may have at most *one* IPC stdio file descriptor. Setting this option enables the [`subprocess.send()`][] method. If the child is a Node.js process, the presence of an IPC channel will enable [`process.send()`][], [`process.disconnect()`][], [`process.on('disconnect')`][], and [`process.on('message')`] within the child.

   Accessing the IPC channel fd in any way other than [`process.send()`][] or using the IPC channel with a child process that is not a Node.js instance is not supported.
3. `'ignore'` - Enseña a Node.js a ignorar el fd en el proceso secundario. While Node.js will always open fds 0 - 2 for the processes it spawns, setting the fd to `'ignore'` will cause Node.js to open `/dev/null` and attach it to the child's fd.
4. {Stream} object - Share a readable or writable stream that refers to a tty, file, socket, or a pipe with the child process. The stream's underlying file descriptor is duplicated in the child process to the fd that corresponds to the index in the `stdio` array. Note that the stream must have an underlying descriptor (file streams do not until the `'open'` event has occurred).
5. Positive integer - The integer value is interpreted as a file descriptor that is currently open in the parent process. It is shared with the child process, similar to how {Stream} objects can be shared.
6. `null`, `undefined` - Utiliza el valor por defecto. For stdio fds 0, 1, and 2 (in other words, stdin, stdout, and stderr) a pipe is created. For fd 3 and up, the default is `'ignore'`.

Ejemplo:

```js
const { spawn } = require('child_process');

// El proceso secundario utilizara el stdio del principal
spawn('prg', [], { stdio: 'inherit' });

// El proceso secundario generado compartirá sólo el stderr
spawn('prg', [], { stdio: ['pipe', 'pipe', process.stderr] });

// Abre un extra fd=4, para interactuar con programas presentando una 
// interfaz estilo startd.
spawn('prg', [], { stdio: ['pipe', null, null, null, 'pipe'] });
```

*Cabe destacar que cuando se establece un canal IPC entre los procesos primarios y secundarios, y el proceso secundario es un proceso de Node.js, este es lanzado con el canal IPC sin referencia (utilizando `unref()`) hasta que registre un manejador de eventos para el evento [`process.on('disconnect')`][] o para [`process.on('message')`][]. Esto permite que el proceso secundario se cierre normalmente sin que se mantenga el proceso abierto por el canal IPC abierto.*

Vea también: [`child_process.exec()`][] y [`child_process.fork()`][]

## Creación de Procesos Sincrónicos

The [`child_process.spawnSync()`][], [`child_process.execSync()`][], and [`child_process.execFileSync()`][] methods are **synchronous** and **WILL** block the Node.js event loop, pausing execution of any additional code until the spawned process exits.

El bloquear llamadas como estas es sobre todo útil para la simplificación de tareas de uso general y para simplificar la carga/el procesamiento de la configuración de aplicación en el inicio.

### child_process.execFileSync(file\[, args\]\[, options\])
<!-- YAML
added: v0.11.12
changes:
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

* `file` {string} El nombre o la ruta del archivo ejecutable a ejecutar.
* `args` {string[]} Lista de argumentos de strings.
* `opciones` {Object}
  * `cwd` {string} Directorio del proceso secundario actualmente operativo.
  * `input` {string|Buffer|Uint8Array} El valor que será pasado como stdin al proceso generado. Suministrar este valor anulará `stdio[0]`.
  * `stdio` {string|Array} Configuración del stdio del proceso secundario. `stderr` por defecto será la salida del stderr del proceso primario a menos que se especifique el `stdio`. **Predeterminado:** `'pipe'`.
  * `env` {Object} Pares clave-valor del entorno.
  * `uid` {number} Establece la identidad de usuario del proceso (vea setuid(2)).
  * `gid` {number} Establece la identidad de grupo del proceso (vea setgid(2)).
  * `timeout` {number} En milisegundos, la cantidad máxima de tiempo que se permite que se ejecute el proceso. **Predeterminado:** `undefined`.
  * `killSignal` {string|integer} El valor de la señal a ser usada cuando el proceso generado vaya a ser eliminado. **Predeterminado:** `'SIGTERM'`.
  * `maxBuffer` {number} La mayor cantidad de datos en bytes permitidos en stdout o stderr. Si se excede, el proceso secundario se finaliza. Vea caveat en [`maxBuffer` y Unicode][]. **Predeterminado:** `200 * 1024`.
  * `encoding` {string} La codificación usada para todas las entradas y salidas de stdio. **Predeterminado:** `'buffer'`.
  * `windowsHide` {boolean} Oculta la ventana de la consola del sub-proceso que normalmente se crea en los sistemas Windows. **Predeterminado:** `false`.
  * `shell` {boolean|string} Si es `true`, se ejecuta el `command` dentro del shell. Utiliza `'/bin/sh'` en UNIX y `process.env.ComSpec` en Windows. Una shell diferente puede especificarse como una string. Vea los [Requerimientos de Shell](#child_process_shell_requirements) y [Shell de Windows Predeterminado](#child_process_default_windows_shell). **Predeterminado:** `false` (sin shell).
* Devuelve: {Buffer|string} El stdout desde el comando.

El método `child_process.execFileSync()` es generalmente idéntico a [`child_process.execFile()`][] con la excepción de que el método no se devolverá hasta que el proceso secundario haya sido completamente cerrado. Cuando se ha encontrado un timeout y se ha enviado una `killSignal`, el método no se devolverá hasta que el proceso haya sido completamente cerrado.

*Note*: If the child process intercepts and handles the `SIGTERM` signal and does not exit, the parent process will still wait until the child process has exited.

If the process times out or has a non-zero exit code, this method ***will*** throw an [`Error`][] that will include the full result of the underlying [`child_process.spawnSync()`][].

*Note*: If the `shell` option is enabled, do not pass unsanitized user input to this function. Cualquier input que contenga metacaracteres de shell puede ser utilizada para activar la ejecución arbitraria de comandos.

### child_process.execSync(command[, options])
<!-- YAML
added: v0.11.12
changes:
  - version: v8.8.0
    pr-url: https://github.com/nodejs/node/pull/15380
    description: The `windowsHide` option is supported now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10653
    description: The `input` option can now be a `Uint8Array`.
-->

* `command` {string} El comando a ejecutar.
* `opciones` {Object}
  * `cwd` {string} Directorio del proceso secundario actualmente operativo.
  * `input` {string|Buffer|Uint8Array} El valor que será pasado como stdin al proceso generado. Suministrar este valor anulará `stdio[0]`.
  * `stdio` {string|Array} Configuración del stdio del proceso secundario. `stderr` por defecto será la salida del stderr del proceso primario a menos que se especifique el `stdio`. **Predeterminado:** `'pipe'`.
  * `env` {Object} Pares clave-valor del entorno.
  * `shell` {string} Shell con el que ejecutar el comando. Vea los [Requerimientos de Shell](#child_process_shell_requirements) y [Shell de Windows Predeterminado](#child_process_default_windows_shell). **Default:** `'/bin/sh'` en UNIX, `process.env.ComSpec` en Windows.
  * `uid` {number} Establece la identidad del usuario del proceso. (Vea setuid(2)).
  * `gid` {number} Establece la identidad del grupo del proceso. (Vea setgid(2)).
  * `timeout` {number} En milisegundos, la cantidad máxima de tiempo que se permite que se ejecute el proceso. **Predeterminado:** `undefined`.
  * `killSignal` {string|integer} El valor de la señal a ser usada cuando el proceso generado vaya a ser eliminado. **Predeterminado:** `'SIGTERM'`.
  * `maxBuffer` {number} La mayor cantidad de datos en bytes permitidos en stdout o stderr. Si se excede, el proceso secundario se finaliza. Vea caveat en [`maxBuffer` y Unicode][]. **Predeterminado:** `200 * 1024`.
  * `encoding` {string} La codificación usada para todas las entradas y salidas de stdio. **Predeterminado:** `'buffer'`.
  * `windowsHide` {boolean} Oculta la ventana de la consola del sub-proceso que normalmente se crea en los sistemas Windows. **Predeterminado:** `false`.
* Devuelve: {Buffer|string} El stdout desde el comando.

El método `child_process.execSync()` es generalmente idéntico a [`child_process.exec()`][] a excepción de que el método no se devolverá hasta que el proceso secundario haya sido completamente cerrado. Cuando se ha encontrado un timeout y se ha enviado una `killSignal`, el método no se devolverá hasta que el proceso haya sido completamente cerrado. *Note que si el proceso secundario intercepta y maneja la señal `SIGTERM` y no se cierra, el proceso primario todavía esperará hasta que el proceso secundario se haya cerrado.*

Si el proceso expira o tiene un código de salida diferente a cero, este método ***arrojará***. El objeto [`Error`][] contendrá el resultado entero de [`child_process.spawnSync()`][]

*Note*: Never pass unsanitized user input to this function. Cualquier input que contenga metacaracteres shell puede ser usada para activar la ejecución de comando arbitrario.

### child_process.spawnSync(command\[, args\]\[, options\])
<!-- YAML
added: v0.11.12
changes:
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
* `args` {Array} Lista de argumentos de string.
* `opciones` {Object}
  * `cwd` {string} Directorio del proceso secundario actualmente operativo.
  * `input` {string|Buffer|Uint8Array} El valor que será pasado como stdin al proceso generado. Suministrar este valor anulará `stdio[0]`.
  * `stdio` {string|Array} Configuración del stdio del proceso secundario.
  * `env` {Object} Pares clave-valor del entorno.
  * `uid` {number} Establece la identidad de usuario del proceso (vea setuid(2)).
  * `gid` {number} Establece la identidad de grupo del proceso (vea setgid(2)).
  * `timeout` {number} En milisegundos, la cantidad máxima de tiempo que se permite que se ejecute el proceso. **Predeterminado:** `undefined`.
  * `killSignal` {string|integer} El valor de la señal a ser usada cuando el proceso generado vaya a ser eliminado. **Predeterminado:** `'SIGTERM'`.
  * `maxBuffer` {number} La mayor cantidad de datos en bytes permitidos en stdout o stderr. Si se excede, el proceso secundario se finaliza. Vea caveat en [`maxBuffer` y Unicode][]. **Predeterminado:** `200 * 1024`.
  * `encoding` {string} La codificación usada para todas las entradas y salidas de stdio. **Predeterminado:** `'buffer'`.
  * `shell` {boolean|string} Si es `true`, se ejecuta el `command` dentro del shell. Utiliza `'/bin/sh'` en UNIX y `process.env.ComSpec` en Windows. Una shell diferente puede especificarse como una string. Vea los [Requerimientos de Shell](#child_process_shell_requirements) y [Shell de Windows Predeterminado](#child_process_default_windows_shell). **Predeterminado:** `false` (sin shell).
  * `windowsVerbatimArguments` {boolean} No se realiza ninguna cita o escape de argumentos en Windows. Se ignora en Unix. Esto se establece automáticamente a `true` cuando se especifica `shell`. **Predeterminado:** `false`.
  * `windowsHide` {boolean} Oculta la ventana de la consola del sub-proceso que normalmente se crea en los sistemas Windows. **Predeterminado:** `false`.
* Devuelve: {Object}
  * `pid` {number} Pid del proceso secundario.
  * `output` {Array} Array de los resultados del output stdio.
  * `stdout` {Buffer|string} Los contenidos de `output[1]`.
  * `stderr` {Buffer|string} Los contenidos de `output[2]`.
  * `status` {number} El código de salida del proceso secundario.
  * `signal` {string} La señal utilizada para eliminar el proceso secundario.
  * `error` {Error} El objeto de error si el proceso secundario falla o expira.

El método `child_process.spawnSync()` es generalmente idéntico a [`child_process.spawn()`][] a excepción de que la función no se devolverá hasta que el proceso secundario haya sido completamente cerrado. Cuando se ha encontrado un timeout y se ha enviado una `killSignal`, el método no se devolverá hasta que el proceso haya sido completamente cerrado. Note que si el proceso intercepta y maneja la señal `SIGTERM` y no se cierra, el proceso primario esperará hasta que el proceso secundario se haya cerrado.

*Note*: If the `shell` option is enabled, do not pass unsanitized user input to this function. Cualquier input que contenga metacaracteres de shell puede ser utilizada para activar la ejecución arbitraria de comandos.

## Clase: ChildProcess
<!-- YAML
added: v2.2.0
-->

Las instancias de la clase `ChildProcess` son [`EventEmitters`][`EventEmitter`] que representan procesos secundarios generados.

Las instancias del `ChildProcess` no se supone que sean creadas directamente. En su lugar, utilice los métodos [`child_process.spawn()`][], [`child_process.exec()`][], [`child_process.execFile()`][] o [`child_process.fork()`][] para crear instancias de `ChildProcess`.

### Evento: 'close' (cerrar)
<!-- YAML
added: v0.7.7
-->

* `code` {number} El código de salida si el proceso secundario se cerró por sí solo.
* `signal` {string} La señal por la cual el proceso secundario fue terminado.

El evento `'close'` es emitido cuando los streams stdio de un proceso secundario han sido cerrados. Esto es distinto del evento [`'exit'`][], ya que múltiples procesos pueden compartir los mismos streams stdio.

### Evento: 'disconnect'
<!-- YAML
added: v0.7.2
-->

El evento `'disconnect'` es emitido luego de llamar al método [`subprocess.disconnect()`][] en el proceso primario o [`process.disconnect()`][] en el proceso secundario. Luego de desconectarlo, no es posible enviar o recibir mensajes, y la propiedad [`subprocess.connected`][] es `false`.

### Evento: 'error'

* `err` {Error} El error.

El evento `'error'` es emitido cuando:

1. El proceso no pudo ser generado, o
2. El proceso no pudo ser eliminado, o
3. Falló el envío de un mensaje al proceso secundario.

*Note*: The `'exit'` event may or may not fire after an error has occurred. When listening to both the `'exit'` and `'error'` events, it is important to guard against accidentally invoking handler functions multiple times.

Vea también [`subprocess.kill()`][] y [`subprocess.send()`][].

### Evento: 'exit'
<!-- YAML
added: v0.1.90
-->

* `code` {number} El código de salida si el proceso secundario se cerró por sí solo.
* `signal` {string} La señal por la cual el proceso secundario fue terminado.

El evento `'exit'` es emitido luego de que el proceso secundario finaliza. Si se cierra el proceso, `code` es el código de salida final del proceso, o de otra manera es `null`. Si el proceso se termina debido a la recepción de una señal, `signal` es el nombre de la string de la señal, sino es `null`. Una de las dos siempre será no nula.

Note que cuando se activa el evento `'exit'`, los streams stdio del proceso secundario pueden todavía seguir abiertos.

También note que Node.js establece manejadores de señal para `SIGINT` y `SIGTERM` y que los procesos Node.js no se terminarán inmediatamente debido a la recepción de esas señales. Por lo contrario, Node.js llevará a cabo una secuencia de acciones de limpieza y luego volverá a subir la señal manejada.

Vea waitpid(2).

### Evento: 'message'
<!-- YAML
added: v0.5.9
-->

* `message` {Object} Un objeto JSON analizado o un valor primitivo.
* `sendHandle` {Handle} Un objeto [`net.Socket`][] o [`net.Server`][], o indefinido.

El evento `'message'` se desencadena cuando un proceso secundario utiliza [`process.send()`][] para enviar mensajes.

*Note*: The message goes through serialization and parsing. El mensaje resultante puede no ser el mismo que lo originalmente enviado.

<a name="child_process_child_channel"></a>

### subprocess.channel
<!-- YAML
added: v7.1.0
-->

* {Object} Un pipe que representa el canal IPC al proceso secundario.

La propiedad `subprocess.channel` es una referencia al canal IPC del proceso secundario. Si no existe actualmente un canal IPC, esta propiedad es `undefined`.

<a name="child_process_child_connected"></a>

### subprocess.connected
<!-- YAML
added: v0.7.2
-->

* {boolean} Establece a `false` luego de que se llame a `subprocess.disconnect()`.

La propiedad `subprocess.connected` indica si todavía es posible enviar y recibir mensajes de un proceso secundario. Cuando `subprocess.connected` es `false`, no es posible enviar o recibir mensajes.

<a name="child_process_child_disconnect"></a>

### subprocess.disconnect()
<!-- YAML
added: v0.7.2
-->

Cierra el canal IPC entre el proceso primario y el secundario, permitiendo que el secundario se cierre exitosamente, una vez que no hayan otras conexiones que lo mantengan activo. Luego de llamar a este método, las propiedades `subprocess.connected` y `process.connected` en el proceso primario y el proceso secundario (respectivamente), se establecerá a `false` y ya no será posible pasar mensajes entre los procesos.

El evento `'disconnect'` será emitido cuando no hayan mensajes en el proceso de ser recibidos. Generalmente, esto se activará inmediatamente después de llamar a `subprocess.disconnect()`.

Note que cuando el proceso secundario es una instancia Node.js (por ejemplo, cuando ha sido generado utilizando [`child_process.fork()`]), el método `process.disconnect()` puede ser invocado dentro del proceso secundario para cerrar también el canal IPC.

<a name="child_process_child_kill_signal"></a>

### subprocess.kill([signal])
<!-- YAML
added: v0.1.90
-->

* `signal` {string}

El método `subprocess.kill()` envía una señal al proceso secundario. Si no se proporciona ningún argumento, se le enviará la señal `'SIGTERM'` al proceso. Vea signal(7) para una lista de señales disponibles.

```js
const { spawn } = require('child_process');
const grep = spawn('grep', ['ssh']);

grep.on('close', (code, signal) => {
  console.log(
    `el proceso secundario terminó por haber recibido la señal ${signal}`);
});

// Envía un SIGHUP al proceso
grep.kill('SIGHUP');
```

El objeto [`ChildProcess`][] puede emitir un evento [`'error'`][] si la señal no puede ser enviada. El envío de una señal a un proceso secundario que ya se haya cerrado no es un error, pero puede tener consecuencias imprevistas. Específicamente, si el identificador proceso (PID) ha sido reasignado a otro proceso, la señal será enviada a ese proceso en su lugar, lo cual puede tener resultados inesperados.

Note que aunque que la función se llame `kill`, la señal enviada al proceso secundario puede no terminar el proceso.

Vea kill(2) para referencias.

También observe: en Linux, los procesos secundarios de procesos secundarios no serán terminados al intentar aniquilar a su proceso primario. Esto es probable que suceda cuando se ejecuta un nuevo proceso en un shell o con el uso de la opción `shell` de `ChildProcess`, como en este ejemplo:

```js
'use strict';
const { spawn } = require('child_process');

const subprocess = spawn(
  'sh',
  [
    '-c',
    `node -e "setInterval(() => {
      console.log(process.pid, 'está vivo')
    }, 500);"`
  ], {
    stdio: ['inherit', 'inherit', 'inherit']
  }
);

setTimeout(() => {
  subprocess.kill(); // no termina el proceso node en la consola
}, 2000);
```

### subprocess.killed
<!-- YAML
added: v0.5.10
-->

* {boolean} Establecido a `true` luego de que se haya usado `subprocess.kill()` para enviar una señal con éxito al proceso secundario.

La propiedad `subprocess.killed` indica si el proceso secundario recibió con éxito una señal desde `subprocess.kill()`. La propiedad `killed` no indica que el proceso secundario haya sido terminado.

<a name="child_process_child_pid"></a>

### subprocess.pid
<!-- YAML
added: v0.1.90
-->

* {number} Entero

Devuelve el identificador del proceso (PID) del proceso secundario.

Ejemplo:

```js
const { spawn } = require('child_process');
const grep = spawn('grep', ['ssh']);

console.log(`Proceso secundario generado con pid: ${grep.pid}`);
grep.stdin.end();
```

<a name="child_process_child_send_message_sendhandle_options_callback"></a>

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
* `options` {Object} The `options` argument, if present, is an object used to parameterize the sending of certain types of handles. `options` soporta las siguientes propiedades:
  * `keepOpen` - A Boolean value that can be used when passing instances of `net.Socket`. Cuando es `true`, la conexión se mantiene abierta en el proceso de envío. **Predeterminado:** `false`.
* `callback` {Function}
* Devuelve: {boolean}

Cuando un canal IPC ha sido establecido entre el proceso primario y el secundario (p. ej. al usar [`child_process.fork()`][]), el método `subprocess.send()` puede ser usado para enviar mensajes al proceso secundario. Cuando el proceso secundario es una instancia de Node.js, estos mensajes pueden ser recibidos por medio del evento [`process.on('message')`][].

*Note*: The message goes through serialization and parsing. El mensaje resultante puede no ser el mismo que lo originalmente enviado.

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

Y, entonces, el script secundario, `'sub.js'` puede lucir así:

```js
process.on('message', (m) => {
  console.log('SECUNDARIO recibió el mensaje:', m);
});

// Hace que el principal imprima: PRINICPAL recibió el mensaje: { foo: 'bar', baz: null }
process.send({ foo: 'bar', baz: NaN });
```

Los procesos Node.js secundarios tendrán un método [`process.send()`][] propio que permita que el proceso secundario envíe mensajes de vuelta al proceso primario.

Hay un caso especial al enviar un mensaje `{cmd: 'NODE_foo'}`. Los mensajes que contengan un prefijo `NODE_` en la propiedad `cmd` son reservados para ser usados dentro del core de Node.js y no serán emitidos en el evento [`process.on('message')`][] del proceso secundario. En su lugar, dichos mensajes son emitidos usando el evento `process.on('internalMessage')` y consumidos internamente por Node.js. Las aplicaciones deben evitar usar dichos mensajes o escuchar los eventos `'internalMessage'`, ya que están sujetos a cambiar sin previo aviso.

El argumento `sendHandle` opcional que puede ser pasado a `subprocess.send()` es para pasar un servidor TCP un objeto conector al proceso secundario. El proceso secundario recibirá el objeto como el segundo argumento pasado a la función callback registrada en el evento [`process.on('message')`][]. Cualquier data que sea recibida y almacenada en el socket no será enviada al proceso secundario.

El `callback` opcional es una opción que es invocada luego de que el mensaje es enviado, pero antes de que el proceso secundario pudiera haber sido recibido. La función es llamada con un argumento simple: `null` en éxito, o con un objeto [`Error`][] en fracaso.

No se provee ninguna función `callback` y el mensaje no puede ser enviado, un evento `'error'` será emitido por el objeto [`ChildProcess`][]. Esto puede pasar, por ejemplo, cuando el proceso secundario ya se haya cerrado.

`subprocess.send()` devolverá `false` si el canal se ha cerrado o cuando la reserva de mensajes sin enviar exceda el límite que hace imprudente enviar más. De otro modo, el método devuelve `true`. La función `callback` puede ser usada para implementar control de flujo.

#### Ejemplo: enviar un objeto del servidor

El argumento `sendHandle` puede ser usado, por ejemplo, para pasar el handle de un objeto de servidor TCP al proceso secundario, como se ilustra en el siguiente ejemplo:

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

El proceso secundario luego recibirá el objeto del servidor como:

```js
process.on('message', (m, server) => {
  if (m === 'server') {
    server.on('connection', (socket) => {
      socket.end('handled by child');
    });
  }
});
```

Una vez el servidor se haya compartido entre el proceso primario y el secundario, algunas conexiones pueden ser manejadas por el primario y algunas por el secundario.

Mientras que el ejemplo anterior usa un servidor creado utilizando el módulo `net`, los servidores del módulo `dgram` usan exactamente el mismo flujo de trabajo con las excepciones de que escuchan un evento `'message'` en lugar de `'connection'` y usan `server.bind()` en lugar de `server.listen()`. Esto es, sin embargo, actualmente soportado únicamente en plataformas UNIX.

#### Ejemplo: enviar un objeto socket

De manera similar, el argumento `sendHandler` puede ser usado para pasar el handle de un conector al proceso secundario. El siguiente ejemplo genera dos procesos secundarios, cada uno maneja conexiones con prioridad "normal" o "especial":

```js
const { fork } = require('child_process');
const normal = fork('subprocess.js', ['normal']);
const special = fork('subprocess.js', ['special']);

// Abra el servidor y envíe los sockets al proceso secundario. Use pauseOnConnect para prevenir
// que los sockets sean leídos antes de ser enviados al proceso secundario.
const server = require('net').createServer({ pauseOnConnect: true });
server.on('connection', (socket) => {

  // Si esto es de prioridad especial
  if (socket.remoteAddress === '74.125.127.100') {
    special.send('socket', socket);
    return;
  }
  // Esto es de prioridad normal
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

Una vez que un conector ha sido pasado al proceso secundario, el proceso primario ya no es capaz de monitorear cuando éste es destruido. Para indicar esto, la propiedad `.connections` se convierte en `null`. Se recomienda no utilizar `.maxConnections` cuando esto ocurre.

También se recomienda que cualquier manejador de `'message'` en el proceso secundario verifique la existencia de `socket`, ya que la conexión puede haber sido cerrada durante el tiempo que toma enviar la conexión al proceso secundario.

*Nota*: Esta función utiliza [`JSON.stringify()`][] internamente para serializar el `message`.

<a name="child_process_child_stderr"></a>

### subprocess.stderr
<!-- YAML
added: v0.1.90
-->

* {stream.Readable}

Un `Readable Stream` que represente el `stderr` del proceso secundario.

Si el proceso secundario fue generado con el `stdio[2]` establecido a cualquier otro diferente a `'pipe'`, entonces esto será `null`.

`subprocess.stderr` es un alias de `subprocess.stdio[2]`. Ambas propiedades se referirán al mismo valor.

<a name="child_process_child_stdin"></a>

### subprocess.stdin
<!-- YAML
added: v0.1.90
-->

* {stream.Writable}

Un `Writable Stream` que representa al `stdin` del proceso secundario.

*Tenga en cuenta que si un proceso secundario espera a leer todas sus inputs, este no continuará hasta que este stream haya sido cerrado a través de `end()`.*

Si el proceso secundario fue generado con `stdio[0]` establecido a cualquier valor distinto a `'pipe'`, entonces esto será `null`.

`subprocess.stdin` es un alias para `subprocess.stdio[0]`. Ambas propiedades se referirán al mismo valor.

<a name="child_process_child_stdio"></a>

### subprocess.stdio
<!-- YAML
added: v0.7.10
-->

* {Array}

Un array disperso de pipes al proceso secundario, correspondiente con posiciones en la opción [`stdio`][] pasada a [`child_process.spawn()`][] que ha sido establecida al valor `'pipe'`. Note que `subprocess.stdio[0]`, `subprocess.stdio[1]` y `subprocess.stdio[2]` también están disponibles como `subprocess.stdin`, `subprocess.stdout` y `subprocess.stderr`, respectivamente.

En el siguiente ejemplo, solo el fd `1` (stdout) del proceso secundario está configurado como un pipe, así que solo el `subprocess.stdio[1]` del proceso primario es una stream, todos los demás valores en el array son `null`.

```js
const assert = require('assert');
const fs = require('fs');
const child_process = require('child_process');

const subprocess = child_process.spawn('ls', {
  stdio: [
    0, // Utilice el stdin del proceso primario para el proceso secundario
    'pipe', // Pipe del stdout del proceso secundario al primario
    fs.openSync('err.out', 'w') // Direct child's stderr to a file
  ]
});

assert.strictEqual(subprocess.stdio[0], null);
assert.strictEqual(subprocess.stdio[0], subprocess.stdin);

assert(subprocess.stdout);
assert.strictEqual(subprocess.stdio[1], subprocess.stdout);

assert.strictEqual(subprocess.stdio[2], null);
assert.strictEqual(subprocess.stdio[2], subprocess.stderr);
```

<a name="child_process_child_stdout"></a>

### subprocess.stdout
<!-- YAML
added: v0.1.90
-->

* {stream.Readable}

Un `Readable Stream` que representa el `stdout` del proceso secundario.

Si el proceso secundario fue generado con el `stdio[1]` establecido a cualquier otro diferente a `'pipe'`, entonces esto será `null`.

`subprocess.stdout` es un alias de `subprocess.stdio[1]`. Ambas propiedades se referirán al mismo valor.

## `maxBuffer` y Unicode

La opción `maxBuffer` especifica al mayor número de bytes permitidos en `stdout` o `stderr`. Si se excede este valor, entonces el proceso secundario se finaliza. Esto impacta el output que incluye codificaciones de caracteres multibyte como UTF-8 o UTF-16. Por ejemplo, `console.log('中文测试')` enviará 13 UTF-8 bytes codificados a `stdout`, aunque sólo hayan 4 caracteres.

## Requerimientos de Shell

El shell debe entender el interruptor `-c` en UNIX o `/d /s /c` en Windows. En Windows, el análisis de línea de comandos debe ser compatible con `'cmd.exe'`.

## Shell de Windows Predeterminado

Aunque Microsoft especifique que `%COMSPEC%` debe contener la ruta a `'cmd.exe'` en el entorno root, los procesos secundarios no siempre están sujetos al mismo requerimiento. Así, en las funciones `child_process` donde un shell puede ser generado, se utiliza `'cmd.exe'` como un fallback si `process.env.ComSpec` no está disponible.
