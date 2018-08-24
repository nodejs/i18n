# Proceso Secundario

<!--introduced_in=v0.10.0-->

<!--lint disable maximum-line-length-->

> Estabilidad: 2 - Estable

El módulo `child_process` proporciona la habilidad de generar procesos secundarios en una manera similar, pero no idéntica, a popen(3). Esta capacidad es proporcionada principalmente por la función [`child_process.spawn()`][]:

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

By default, pipes for `stdin`, `stdout`, and `stderr` are established between the parent Node.js process and the spawned child. These pipes have limited (and platform-specific) capacity. If the child process writes to stdout in excess of that limit without the output being captured, the child process will block waiting for the pipe buffer to accept more data. This is identical to the behavior of pipes in the shell. Utilice la opción `{ stdio: 'ignore' }` si la salida no será consumida.

El método [`child_process.spawn()`][] genera el proceso secundario asincrónicamente, sin bloquear el bucle de evento Node.js. La función [`child_process.spawnSync()`][] proporciona una funcionalidad equivalente de manera síncrona que bloquea el bucle del evento hasta que el proceso engendrado exista o finalice.

Por conveniencia, el módulo `child_process` proporciona un puñado de alternativas sincrónicas y asincrónicas a [`child_process.spawn()`][] y [`child_process.spawnSync()`][]. *Note que cada una de estas alternativas son implementadas por encima de [`child_process.spawn()`][] o de [`child_process.spawnSync()`][].*

    * [`child_process.exec()`][]: spawns a shell and runs a command within that shell,
      passing the `stdout` and `stderr` to a callback function when complete.
    * [`child_process.execFile()`][]: similar to [`child_process.exec()`][] except that
      it spawns the command directly without first spawning a shell by default.
    * [`child_process.fork()`][]: spawns a new Node.js process and invokes a
      specified module with an IPC communication channel established that allows
      sending messages between parent and child.
    * [`child_process.execSync()`][]: a synchronous version of
      [`child_process.exec()`][] that *will* block the Node.js event loop.
    * [`child_process.execFileSync()`][]: a synchronous version of
      [`child_process.execFile()`][] that *will* block the Node.js event loop.
    

Para ciertos casos de uso, como la automatización de scripts de shell, las [synchronous counterparts](#child_process_synchronous_process_creation) pueden ser más convenientes. En muchos casos, sin embargo, los métodos sincrónicos pueden tener un impacto significativo en el rendimiento debido al bloqueo del bucle de eventos mientras se completan los procesos generados.

## Creación de Procesos Asincrónicos

Los métodos [`child_process.spawn()`][], [`child_process.fork()`][], [`child_process.exec()`][], y [`child_process.execFile()`][], todos siguen el patrón de programación asincrónico idiomático típico de otros APIs de Node.js.

Cada uno de los métodos devuelve una instancia de [`ChildProcess`][]. Estos objetos implementan el API [`EventEmitter`][] de Node.js, permitiendo que el proceso primario registre funciones de oyente que son llamadas cuando ciertos eventos ocurren durante el ciclo de vida del proceso secundario.

Los métodos [`child_process.exec()`][] y [`child_process.execFile()`][] adicionalmente permiten que se especifique una función `callback` opcional que es invocada cuando el proceso secundario finaliza.

### Generando archivos `.bat` y `.cmd` en Windows

La importancia de la distinción entre [`child_process.exec()`][] y [`child_process.execFile()`][] puede variar basándose en la plataforma. En sistemas operativos de tipo Unix (Unix, Linux, macOS) [`child_process.execFile()`][] puede ser más eficiente debido a que no genera un shell por defecto. En Windows, sin embargo, los archivos `.bat` y `.cmd` no son ejecutables por su propia cuenta sin un terminal, y por lo tanto no pueden ser ejecutados utilizando [`child_process.execFile()`][]. Al correr en Windows, los archivos `.bat` y `.cmd` son invocados utilizando [`child_process.spawn()`][] con la opción `shell` establecida, con [`child_process.exec()`][] o generando `cmd.exe</0 y pasando el archivo
<code>.bat` o `.cmd` como un argumento (que es lo que la opción `shell` y [`child_process.exec()`][] hacen). En cualquier caso, si el script filename contiene espacios, necesita ser citado.

```js
// Sólo en Windows ...
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

* `command` {string} El comando a ejecutar, con los argumentos separados con espacios.
* `opciones` {Object} 
  * `cwd` {string} El directorio del proceso secundario actualmente operativo. **Default:** `null`.
  * `env` {Object} Environment key-value pairs. **Predeterminado:** `null`.
  * `encoding` {string} **Predeterminado:** `'utf8'`
  * `shell` {string} Shell con el que ejecutar el comando. Vea [Shell Requirements](#child_process_shell_requirements) y [Default Windows Shell](#child_process_default_windows_shell). **Default:** `'/bin/sh'` en UNIX, `process.env.ComSpec` en Windows.
  * `timeout` {number} **Predeterminado:** `0`
  * `maxBuffer` {number} La cantidad más grande datos en bytes permitidos en stdout o stderr. Si se excede, el proceso secundario se finaliza. See caveat at [`maxBuffer` and Unicode][]. **Predeterminado:** `200 * 1024`.
  * `killSignal` {string|integer} **Predeterminado:** `'SIGTERM'`
  * `uid` {number} Establece la identidad del usuario de los procesos (vea setuid(2)).
  * `gid` {number} Establece la identidad del grupo del proceso (vea setgid(2)).
  * `windowsHide` {boolean} Ocultar la ventana de la consola de sub-proceso que normalmente estaría creada en sistemas Windows. **Predeterminado:** `false`.
* `callback` {Function} llamada con la salida cuando el proceso finaliza. 
  * `error` {Error}
  * `stdout` {string|Buffer}
  * `stderr` {string|Buffer}
* Devuelve: {ChildProcess}

Genera un shell, luego ejecuta el `command` dentro de esa shell, cargando cualquier salida generada. La string `command` pasada a la función exec es procesada directamente por el shell y los caracteres especiales (varía dependiendo del [shell](https://en.wikipedia.org/wiki/List_of_command-line_interpreters)) necesitan ser tratados en consecuencia:

```js
exec('"/path/to/test file/test.sh" arg1 arg2');
// Se utilizan las comillas dobles para que el espacio en la ruta no sea interpretado como
// múltiples argumentos

exec('echo "The \\$HOME variable is $HOME"');
// La variable $HOME se escapó en la primera instancia, pero no en la segunda
```

**Nunca pase la entrada del usuario no optimizado a esta función. Cualquier entrada que contenga metacaracteres shell pueden ser usadas para activar la ejecución de comando arbitrario.**

```js
const { exec } = require('child_process');
exec('cat *.js bad_file | wc -l', (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
});
```

Si se proporciona una función `callback`, se llama con los argumentos `(error, stdout, stderr)`. En éxito, el `error` será `null`. En error, el `error` será una instancia de [`Error`][]. La propiedad `error.code` será el código de salida del proceso secundario, mientras que `error.signal` se establecerá a la señal que finalizó el proceso. Cualquier otro código de salida distinto a `0` se considera como un error.

Los argumentos `stdout` y `stderr` pasados al callback contendrán la salida stdout y stderr del proceso secundario. Por defecto, Node.js decodificará la salida como UTF-8 y pasará las strings al callback. La opción `codificación` puede ser utilizada para especificar la codificación de caracteres para decodificar las salida stdout y stderr. Si `encoding` es `'buffer'` o una codificación de caracter no reconocido, los objetos `Buffer` serán pasados al callback en su lugar.

Si `timeout` es mayor que `0`, el proceso primario enviará la señal identificada por la propiedad `killSignal` (la señal predeterminada es `'SIGTERM'`) si el proceso secundario se ejecuta por mayor tiempo que `timeout` milisegundos.

A diferencia de la llamada de sistema exec(3) POSIX, el `child_process.exec()` no remplaza el proceso existente y utiliza un shell para ejecutar el comando.

Si se invoca este método en su versión [`util.promisify()`][]ed, devuelve una `Promesa` para un `Objeto` con propiedades `stdout` y `stderr`. En el caso de un error (incluyendo cualquier error que resulte en una salida de código diferente a 0), se devolverá una promesa con el mismo objeto `error` dado en el callback, pero con dos propiedades adicionales `stdout` y `stderr`.

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

* `archivo` {string} El nombre o la ruta del archivo a ejecutar.
* `args` {string[]} Lista de argumentos de strings.
* `opciones` {Object} 
  * `cwd` {string} Directorio del proceso secundario actualmente operativo.
  * `env` {Object} Environment key-value pairs.
  * `encoding` {string} **Predeterminado:** `'utf8'`
  * `timeout` {number} **Predeterminado:** `0`
  * `maxBuffer` {number} Cantidad más grande de datos en bytes permitidos en stdout o stderr. Si se excede, se finaliza el proceso secundario. See caveat at [`maxBuffer` and Unicode][]. **Predeterminado:** `200 * 1024`.
  * `killSignal` {string|integer} **Predeterminado:** `'SIGTERM'`
  * `uid` {number} Establece la identidad del usuario del proceso (vea setuid(2)).
  * `gid` {number} Establece la identidad de grupo del proceso (vea setgid(2)).
  * `windowsHide` {boolean} Oculta la ventada de la consola de subproceso que normalmente se crea en los sistemas Windows. **Predeterminado:** `false`.
  * `windowsVerbatimArguments` {boolean} No se realiza ninguna cita o escape de argumentos en Windows. Se ignora en Unix. **Predeterminado:** `false`.
  * `shell` {boolean|string} Si es `true`, se ejecuta el `command` dentro del shell. Utiliza `'/bin/sh'` en UNIX y `process.env.ComSpec` en Windows. Una shell diferente puede especificarse como una string. Vea los [Requerimientos de Shell](#child_process_shell_requirements) y [Shell de Windows Predeterminado](#child_process_default_windows_shell). **Predeterminado:** `false` (sin shell).
* `callback` {Function} Llamada con la salida cuando el proceso finaliza. 
  * `error` {Error}
  * `stdout` {string|Buffer}
  * `stderr` {string|Buffer}
* Devuelve: {ChildProcess}

La función `child_process.execFile()` es similar a [`child_process.exec()`][] excepto que no genera un shell por defecto. Más bien, el `file` ejecutable especificado es generado directamente como un nuevo proceso, haciéndolo ligeramente más eficiente que [`child_process.exec()`][].

Se admiten las mismas opciones como [`child_process.exec()`][]. Since a shell is not spawned, behaviors such as I/O redirection and file globbing are not supported.

```js
const { execFile } = require('child_process');
const child = execFile('node', ['--version'], (error, stdout, stderr) => {
  if (error) {
    throw error;
  }
  console.log(stdout);
});
```

Los argumentos `stdout` y `stderr` pasados al callback contendrán las salidas stdout y stderr del proceso secundario. Por defecto, Node.js decodificará la salida como UTF-8 y pasará las strings al callback. La opción `encoding` puede ser usada para especificar la codificación de caracter usada para decodificar las salidas stdout y stderr. Si `encoding` es `'buffer'` o una codificación de caracter no reconocida, los objetos `Buffer` serán pasados al callback en su lugar.

Si se invoca este método en su versión [`util.promisify()`][]ed, devuelve una `Promesa` para un `Objeto` con propiedades `stdout` y `stderr`. En caso de un error (incluyendo cualquier error que resulta en una salida de código distinta a 0), se devolverá una promesa rechazada con el mismo objeto `error` dado en el callback, pero con dos propiedades `stdout` y `stderr` adicionales.

```js
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
async function getVersion() {
  const { stdout } = await execFile('node', ['--version']);
  console.log(stdout);
}
getVersion();
```

**Si la opción `shell` está habilitada, no pase la entrada del usuario no optimizado a esta función. Cualquier entrada que contenga metacaracteres shell puede ser usada para activar la ejecución de comando arbitrario.**

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
* `args` {string[]} Lista de argumentos de strings.
* `opciones` {Object} 
  * `cwd` {string} Directorio del proceso secundario actualmente operativo.
  * `env` {Object} Environment key-value pairs.
  * `execPath` {string} Executable used to create the child process.
  * `execArgv` {string[]} Lista de argumentos de strings pasados al ejecutable. **Predeterminado:** `process.execArgv`.
  * `silent` {boolean} If `true`, stdin, stdout, and stderr of the child will be piped to the parent, otherwise they will be inherited from the parent, see the `'pipe'` and `'inherit'` options for [`child_process.spawn()`][]'s [`stdio`][] for more details. **Predeterminado:** `false`.
  * `stdio` {Array|string} Vea el [`stdio`][] del [`child_process.spawn()`][]'. Cuando se proporciona esta opción, se anula `silent`. Si la variante del array es usada, debe contener exactamente un artículo con el valor `'ipc'` o se arrojará un error. Por ejemplo: `[0, 1, 2, 'ipc']`.
  * `windowsVerbatimArguments` {boolean} No se realiza ninguna cita o escape de argumentos en Windows. Se ignora en Unix. **Predeterminado:** `false`.
  * `uid` {number} Establece la identidad del usuario del proceso (vea setuid(2)).
  * `gid` {number} Establece la identidad del grupo del proceso (vea setgid(2)).
* Devuelve: {ChildProcess}

El método `child_process.fork()` es un caso especial de [`child_process.spawn()`][] usado específicamente para generar nuevos procesos Node.js. Al igual que [`child_process.spawn()`][], se devuelve un objeto [`ChildProcess`][]. El [`ChildProcess`][] devuelto tendrá un canal de comunicación integrado que permite que los mensajes se pasen de un lado a otro entre el proceso primario y el proceso secundario. Vea [`subprocess.send()`][] para más detalles.

Es importante tener presente que los procesos secundarios Node.js generados son independientes de los procesos primarios a excepción del canal de comunicación IPC que se establece entre ambos. Cada proceso tiene su propia memoria con sus propias instancias V8. Debido a las asignaciones de recursos adicionales requeridas, la generación de un número más grande de procesos secundarios Node.js no es recomendado.

Por defecto, `child_process.fork()` generará nuevas instancias Node.js usando el [`process.execPath`][] del proceso primario. La propiedad `execPath` en el objeto `options` permite usar una ruta de ejecución alternativa.

Los procesos Node.js iniciados con una `execPath` personalizada se comunicarán con el proceso primario usando el descriptor de archivo (fd) identificado usando la variable ambiente `NODE_CHANNEL_FD` en el proceso secundario.

A diferencia de la llamada de sistema fork(2) POSIX, `child_process.fork()` no clona el proceso actual.

La opción `shell` disponible en [`child_process.spawn()`][] no está soportada por `child_process.fork()` y será ignorada si se establece.

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
* `args` {string[]} Lista de argumentos de strings.
* `opciones` {Object} 
  * `cwd` {string} El directorio del proceso secundario actualmente operativo.
  * `env` {Object} Environment key-value pairs.
  * `argv0` {string} Establecer explícitamente el valor de `argv[0]` enviado al proceso secundario. Esto será establecido en el `command` si no se especifica.
  * `stdio` {Array|string} Configuración stdio del proceso secundario (vea [`options.stdio`][`stdio`]).
  * `detached` {boolean} Prepare el proceso secundario para ejecutar independientemente de su proceso primario. El comportamiento específico depende de la plataforma, vea [`options.detached`][]).
  * `uid` {number} Establece la identidad de usuario del proceso (vea setuid(2)).
  * `gid` {number} Establece la identidad de grupo del proceso (vea setgid(2)).
  * `shell` {boolean|string} Si es `true`, ejecuta el `command` dentro de un shell. Utiliza `'/bin/sh'` en UNIX y `process.env.ComSpec` en Windows. Una shell diferente puede especificarse como una string. Vea los [Requerimientos de Shell](#child_process_shell_requirements) y [Default Windows Shell](#child_process_default_windows_shell). **Predeterminado:** `false` (sin shell).
  * `windowsVerbatimArguments` {boolean} No se realiza ninguna cita o escape de argumentos en Windows. Se ignora en Unix. Esto se establece automáticamente a `true` cuando se especifica `shell`. **Predeterminado:** `false`.
  * `windowsHide` {boolean} Ocultar la ventada de la consola de sub-proceso que normalmente se crea en los sistemas Windows. **Predeterminado:** `false`.
* Devuelve: {ChildProcess}

El método `child_process.spawn()` genera un nuevo proceso usando el `command` dado con los argumentos de línea de comando en `args`. If omitted, `args` defaults to an empty array.

**Si la opción `shell` está habilitada, no pase la entrada del usuario no optimizado a esta función. Cualquier entrada que contenga metacaracteres shell puede ser usada para activar la ejecución de comando arbitrario.**

Se puede utilizar un tercer argumento para especificar opciones adicionales con estos valores predeterminados:

```js
const defaults = {
  cwd: undefined,
  env: process.env
};
```

Utilice `cwd` para especificar el directorio de trabajo del cual se genera el proceso. Si no se proporciona, lo predeterminado es heredar el directorio actualmente trabajando.

Utilice `env` para especificar las variables de ambiente que serán visibles para el nuevo proceso, el predeterminado es [`process.env`][].

Los valores `undefined` en `env` serán ignorados.

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
  console.log(`child process exited with code ${code}`);
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

Example of checking for failed `spawn`:

```js
const { spawn } = require('child_process');
const subprocess = spawn('bad_command');

subprocess.on('error', (err) => {
  console.log('Failed to start subprocess.');
});
```

Ciertas plataformas (macOS, Linux) utilizarán el valor de `argv[0]` para el título del proceso mientras que otras (Windows, SunOS) utilizarán `command`.

Node.js currently overwrites `argv[0]` with `process.execPath` on startup, so `process.argv[0]` in a Node.js child process will not match the `argv0` parameter passed to `spawn` from the parent, retrieve it with the `process.argv0` property instead.

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
const { spawn } = require('child_process');

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

The `options.stdio` option is used to configure the pipes that are established between the parent and child process. Por defecto, el stdin, stdout y stderr del proceso secundario son redireccionados a streams [`subprocess.stdin`][], [`subprocess.stdout`][] y [`subprocess.stderr`][] correspondientes en el objeto [`ChildProcess`][]. Esto es equivalente a configurar el `options.stdio` igual a `['pipe', 'pipe', 'pipe']`.

Por conveniencia, `options.stdio` puede ser uno de los siguientes strings:

* `'pipe'` - equivalente a `['pipe', 'pipe', 'pipe']` (lo predeterminado)
* `'ignore'` - equivalente a `['ignore', 'ignore', 'ignore']`
* `'inherit'` - equivalente a `[process.stdin, process.stdout, process.stderr]` o `[0,1,2]`

De otra manera, el valor de `options.stdio` es un array en donde cada índice corresponde a un fd en el proceso secundario. Los fds 0, 1 y 2 corresponden a stdin, stdout y stderr respectivamente. Additional fds can be specified to create additional pipes between the parent and child. El valor es uno de los siguientes:

1. `'pipe'` - Create a pipe between the child process and the parent process. The parent end of the pipe is exposed to the parent as a property on the `child_process` object as [`subprocess.stdio[fd]`][`stdio`]. Pipes created for fds 0 - 2 are also available as [`subprocess.stdin`][], [`subprocess.stdout`][] and [`subprocess.stderr`][], respectively.
2. `'ipc'` - Crea un canal IPC para pasar descriptores de mensajes/archivos entre el proceso primario y secundario. Un [`ChildProcess`][] puede tener hasta *un* descriptor de archivo stdio IPC. Configurar esta opción habilita el método [`subprocess.send()`][]. Si el proceso secundario es un proceso Node.js, la presencia de un canal IPC habilitará los métodos [`process.send()`][] and [`process.disconnect()`][], al igual que los eventos [`'disconnect'`][] y [`'message'`][] dentro del proceso secundario.
  
  Acceder al fd del canal IPC de cualquier manera distinta a [`process.send()`][] o usar un canal IPC con un proceso secundario que no es una instancia de Node.js no es soportado.

3. `'ignore'` - Enseña a Node.js a ignorar el fd en el proceso secundario. Mientras que Node.js siempre abrirá los fds 0 - 2 para los procesos que genera, configurar el fd a `'ignore'` causará que Node.js abra `/dev/null` y lo adjunte al del proceso secundario.

4. {Stream} object - Share a readable or writable stream that refers to a tty, file, socket, or a pipe with the child process. The stream's underlying file descriptor is duplicated in the child process to the fd that corresponds to the index in the `stdio` array. Note that the stream must have an underlying descriptor (file streams do not until the `'open'` event has occurred).
5. Entero positivo - El valor del entero es interpretado como un descriptor de archivo que está actualmente abierto en el proceso primario. Es compartido con el proceso secundario, similar a como los objetos {Stream} pueden compartirse.
6. `null`, `undefined` - Utiliza el valor por defecto. For stdio fds 0, 1, and 2 (in other words, stdin, stdout, and stderr) a pipe is created. Para fd 3 y mayores, el predeterminado es `'ignore'`.

Ejemplo:

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

*It is worth noting that when an IPC channel is established between the parent and child processes, and the child is a Node.js process, the child is launched with the IPC channel unreferenced (using `unref()`) until the child registers an event handler for the [`'disconnect'`][] event or the [`'message'`][] event. Esto permite que el proceso secundario se cierre normalmente sin que se mantenga el proceso abierto por el canal IPC abierto.*

Vea también: [`child_process.exec()`][] y [`child_process.fork()`][].

## Creación de Procesos Sincrónicos

Los métodos [`child_process.spawnSync()`][], [`child_process.execSync()`][] y [`child_process.execFileSync()`][] son **sincrónicos** y **VAN** a bloquear el bucle del evento Node.js, pausando la ejecución de cualquier código adicional hasta que se cierre el proceso generado.

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
  * `cwd` {string} El directorio del proceso secundario actualmente operativo.
  * `input` {string|Buffer|Uint8Array} El valor que será pasado como stdin al proceso generado. Suministrar este valor anulará `stdio[0]`.
  * `stdio` {string|Array} Configuración del stdio del proceso secundario. `stderr` by default will be output to the parent process' stderr unless `stdio` is specified. **Predeterminado:** `'pipe'`.
  * `env` {Object} Environment key-value pairs.
  * `uid` {number} Establece la identidad de usuario del proceso (vea setuid(2)).
  * `gid` {number} Establece la identidad de grupo del proceso (vea setgid(2)).
  * `timeout` {number} En milisegundos, la cantidad máxima de tiempo que permite que se ejecute el proceso. **Predeterminado:** `undefined`.
  * `killSignal` {string|integer} El valor de la señal a ser usado cuando el proceso generado vaya a ser aniquilado. **Predeterminado:** `'SIGTERM'`.
  * `maxBuffer` {number} La mayor cantidad de datos en bytes permitidos en stdout o stderr. Si se excede, el proceso secundario se finaliza. See caveat at [`maxBuffer` and Unicode][]. **Predeterminado:** `200 * 1024`.
  * `encoding` {string} La codificación usada para todas entradas y salidas de stdio. **Predeterminado:** `'buffer'`.
  * `windowsHide` {boolean} Oculta la ventada de la consola de sub-procesos que normalmente estaría creada en sistemas Windows. **Predeterminado:** `false`.
  * `shell` {boolean|string} Si es `true`, ejecuta el `command` dentro de un shell. Utiliza `'/bin/sh'` en UNIX y `process.env.ComSpec` en Windows. Una shell diferente puede especificarse como una string. Vea los [Requerimientos de Shell](#child_process_shell_requirements) y [Shell de Windows Predeterminado](#child_process_default_windows_shell). **Predeterminado:** `false` (sin shell).
* Devuelve: {Buffer|string} El stdout desde el comando.

El método `child_process.execFileSync()` es generalmente idéntico a [`child_process.execFile()`][] con la excepción de que el método no se devolverá hasta que el proceso secundario haya sido completamente cerrado. When a timeout has been encountered and `killSignal` is sent, the method won't return until the process has completely exited.

Si el proceso secundario intercepta y maneja la señal `SIGTERM` y no se cierra, el proceso primario todavía esperará hasta que el proceso secundario se haya cerrado.

Si el proceso expira o tiene un código de salida distinto de cero, este método ***arrojará*** un [`Error`][] que incluirá el resultado total del [`child_process.spawnSync()`][] subyacente.

**Si la opción `shell` está habilitada, no pase la entrada del usuario no optimizado a esta función. Cualquier entrada que contenga metacaracteres shell puede ser usada para activar la ejecución de comando arbitrario.**

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
  * `cwd` {string} El directorio del proceso secundario actualmente operativo.
  * `input` {string|Buffer|Uint8Array} El valor que será pasado como stdin al proceso generado. Suministrar este valor anulará `stdio[0]`.
  * `stdio` {string|Array} La configuración del stdio del proceso secundario. `stderr` por defecto será la salida del stderr del proceso secundario a menos que se especifique el `stdio`. **Predeterminado:** `'pipe'`.
  * `env` {Object} Environment key-value pairs.
  * `shell` {string} Shell con el que ejecutar el comando. Vea los [Requerimientos de Shell](#child_process_shell_requirements) y [Shell de Windows Predeterminado](#child_process_default_windows_shell). **Default:** `'/bin/sh'` en UNIX, `process.env.ComSpec` en Windows.
  * `uid` {number} Establece la identidad del usuario del proceso. (Vea setuid(2)).
  * `gid` {number} Establece la identidad del grupo del proceso. (Vea setgid(2)).
  * `timeout` {number} En milisegundos, la cantidad máxima de tiempo que permite que se ejecute el proceso. **Predeterminado:** `undefined`.
  * `killSignal` {string|integer} El valor de la señal a ser usado cuando el proceso generado vaya a ser aniquilado. **Predeterminado:** `'SIGTERM'`.
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated. See caveat at [`maxBuffer` and Unicode][]. **Default:** `200 * 1024`.
  * `encoding` {string} The encoding used for all stdio inputs and outputs. **Predeterminado:** `'buffer'`.
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
* Returns: {Buffer|string} The stdout from the command.

The `child_process.execSync()` method is generally identical to [`child_process.exec()`][] with the exception that the method will not return until the child process has fully closed. When a timeout has been encountered and `killSignal` is sent, the method won't return until the process has completely exited. *Note that if the child process intercepts and handles the `SIGTERM` signal and doesn't exit, the parent process will wait until the child process has exited.*

If the process times out or has a non-zero exit code, this method ***will*** throw. The [`Error`][] object will contain the entire result from [`child_process.spawnSync()`][].

**Nunca pase la entrada del usuario no optimizado a esta función. Cualquier entrada que contenga metacaracteres shell pueden ser usadas para activar la ejecución de comando arbitrario.**

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

* `command` {string} The command to run.
* `args` {string[]} List of string arguments.
* `options` {Object} 
  * `cwd` {string} Current working directory of the child process.
  * `input` {string|Buffer|Uint8Array} El valor que será pasado como stdin al proceso generado. Suministrar este valor anulará `stdio[0]`.
  * `stdio` {string|Array} Child's stdio configuration.
  * `env` {Object} Environment key-value pairs.
  * `uid` {number} Sets the user identity of the process (see setuid(2)).
  * `gid` {number} Sets the group identity of the process (see setgid(2)).
  * `timeout` {number} In milliseconds the maximum amount of time the process is allowed to run. **Predeterminado:** `undefined`.
  * `killSignal` {string|integer} The signal value to be used when the spawned process will be killed. **Predeterminado:** `'SIGTERM'`.
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated. See caveat at [`maxBuffer` and Unicode][]. **Default:** `200 * 1024`.
  * `encoding` {string} The encoding used for all stdio inputs and outputs. **Predeterminado:** `'buffer'`.
  * `shell` {boolean|string} If `true`, runs `command` inside of a shell. Uses `'/bin/sh'` on UNIX, and `process.env.ComSpec` on Windows. A different shell can be specified as a string. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `false` (no shell).
  * `windowsVerbatimArguments` {boolean} No quoting or escaping of arguments is done on Windows. Ignored on Unix. This is set to `true` automatically when `shell` is specified. **Default:** `false`.
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
* Returns: {Object} 
  * `pid` {number} Pid of the child process.
  * `output` {Array} Array of results from stdio output.
  * `stdout` {Buffer|string} The contents of `output[1]`.
  * `stderr` {Buffer|string} The contents of `output[2]`.
  * `status` {number} The exit code of the child process.
  * `signal` {string} The signal used to kill the child process.
  * `error` {Error} The error object if the child process failed or timed out.

The `child_process.spawnSync()` method is generally identical to [`child_process.spawn()`][] with the exception that the function will not return until the child process has fully closed. When a timeout has been encountered and `killSignal` is sent, the method won't return until the process has completely exited. Note that if the process intercepts and handles the `SIGTERM` signal and doesn't exit, the parent process will wait until the child process has exited.

**Si la opción `shell` está habilitada, no pase la entrada del usuario no optimizado a esta función. Cualquier entrada que contenga metacaracteres shell puede ser usada para activar la ejecución de comando arbitrario.**

## Class: ChildProcess

<!-- YAML
added: v2.2.0
-->

Instances of the `ChildProcess` class are [`EventEmitters`][`EventEmitter`] that represent spawned child processes.

Instances of `ChildProcess` are not intended to be created directly. Rather, use the [`child_process.spawn()`][], [`child_process.exec()`][], [`child_process.execFile()`][], or [`child_process.fork()`][] methods to create instances of `ChildProcess`.

### Event: 'close'

<!-- YAML
added: v0.7.7
-->

* `code` {number} The exit code if the child exited on its own.
* `signal` {string} The signal by which the child process was terminated.

The `'close'` event is emitted when the stdio streams of a child process have been closed. This is distinct from the [`'exit'`][] event, since multiple processes might share the same stdio streams.

### Event: 'disconnect'

<!-- YAML
added: v0.7.2
-->

The `'disconnect'` event is emitted after calling the [`subprocess.disconnect()`][] method in parent process or [`process.disconnect()`][] in child process. After disconnecting it is no longer possible to send or receive messages, and the [`subprocess.connected`][] property is `false`.

### Event: 'error'

* `err` {Error} The error.

The `'error'` event is emitted whenever:

1. The process could not be spawned, or
2. The process could not be killed, or
3. Sending a message to the child process failed.

The `'exit'` event may or may not fire after an error has occurred. When listening to both the `'exit'` and `'error'` events, it is important to guard against accidentally invoking handler functions multiple times.

See also [`subprocess.kill()`][] and [`subprocess.send()`][].

### Event: 'exit'

<!-- YAML
added: v0.1.90
-->

* `code` {number} The exit code if the child exited on its own.
* `signal` {string} The signal by which the child process was terminated.

The `'exit'` event is emitted after the child process ends. If the process exited, `code` is the final exit code of the process, otherwise `null`. If the process terminated due to receipt of a signal, `signal` is the string name of the signal, otherwise `null`. One of the two will always be non-null.

Note that when the `'exit'` event is triggered, child process stdio streams might still be open.

Also, note that Node.js establishes signal handlers for `SIGINT` and `SIGTERM` and Node.js processes will not terminate immediately due to receipt of those signals. Rather, Node.js will perform a sequence of cleanup actions and then will re-raise the handled signal.

See waitpid(2).

### Event: 'message'

<!-- YAML
added: v0.5.9
-->

* `message` {Object} A parsed JSON object or primitive value.
* `sendHandle` {Handle} A [`net.Socket`][] or [`net.Server`][] object, or undefined.

The `'message'` event is triggered when a child process uses [`process.send()`][] to send messages.

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

* {boolean} Set to `false` after `subprocess.disconnect()` is called.

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

The `subprocess.kill()` method sends a signal to the child process. If no argument is given, the process will be sent the `'SIGTERM'` signal. See signal(7) for a list of available signals.

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

The [`ChildProcess`][] object may emit an [`'error'`][] event if the signal cannot be delivered. Sending a signal to a child process that has already exited is not an error but may have unforeseen consequences. Specifically, if the process identifier (PID) has been reassigned to another process, the signal will be delivered to that process instead which can have unexpected results.

Note that while the function is called `kill`, the signal delivered to the child process may not actually terminate the process.

See kill(2) for reference.

Also note: on Linux, child processes of child processes will not be terminated when attempting to kill their parent. This is likely to happen when running a new process in a shell or with use of the `shell` option of `ChildProcess`, such as in this example:

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

* {boolean} Set to `true` after `subprocess.kill()` is used to successfully send a signal to the child process.

The `subprocess.killed` property indicates whether the child process successfully received a signal from `subprocess.kill()`. The `killed` property does not indicate that the child process has been terminated.

### subprocess.pid

<!-- YAML
added: v0.1.90
-->

* {integer}

Returns the process identifier (PID) of the child process.

Example:

```js
const { spawn } = require('child_process');
const grep = spawn('grep', ['ssh']);

console.log(`Spawned child pid: ${grep.pid}`);
grep.stdin.end();
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
  * `keepOpen` {boolean} A value that can be used when passing instances of `net.Socket`. When `true`, the socket is kept open in the sending process. **Default:** `false`.
* `callback` {Function}
* Returns: {boolean}

When an IPC channel has been established between the parent and child ( i.e. when using [`child_process.fork()`][]), the `subprocess.send()` method can be used to send messages to the child process. When the child process is a Node.js instance, these messages can be received via the [`'message'`][] event.

The message goes through serialization and parsing. The resulting message might not be the same as what is originally sent.

For example, in the parent script:

```js
const cp = require('child_process');
const n = cp.fork(`${__dirname}/sub.js`);

n.on('message', (m) => {
  console.log('PARENT got message:', m);
});

// Causes the child to print: CHILD got message: { hello: 'world' }
n.send({ hello: 'world' });
```

And then the child script, `'sub.js'` might look like this:

```js
process.on('message', (m) => {
  console.log('CHILD got message:', m);
});

// Causes the parent to print: PARENT got message: { foo: 'bar', baz: null }
process.send({ foo: 'bar', baz: NaN });
```

Child Node.js processes will have a [`process.send()`][] method of their own that allows the child to send messages back to the parent.

There is a special case when sending a `{cmd: 'NODE_foo'}` message. Messages containing a `NODE_` prefix in the `cmd` property are reserved for use within Node.js core and will not be emitted in the child's [`'message'`][] event. Rather, such messages are emitted using the `'internalMessage'` event and are consumed internally by Node.js. Applications should avoid using such messages or listening for `'internalMessage'` events as it is subject to change without notice.

The optional `sendHandle` argument that may be passed to `subprocess.send()` is for passing a TCP server or socket object to the child process. The child will receive the object as the second argument passed to the callback function registered on the [`'message'`][] event. Any data that is received and buffered in the socket will not be sent to the child.

The optional `callback` is a function that is invoked after the message is sent but before the child may have received it. The function is called with a single argument: `null` on success, or an [`Error`][] object on failure.

If no `callback` function is provided and the message cannot be sent, an `'error'` event will be emitted by the [`ChildProcess`][] object. This can happen, for instance, when the child process has already exited.

`subprocess.send()` will return `false` if the channel has closed or when the backlog of unsent messages exceeds a threshold that makes it unwise to send more. Otherwise, the method returns `true`. The `callback` function can be used to implement flow control.

#### Example: sending a server object

The `sendHandle` argument can be used, for instance, to pass the handle of a TCP server object to the child process as illustrated in the example below:

```js
const subprocess = require('child_process').fork('subprocess.js');

// Open up the server object and send the handle.
const server = require('net').createServer();
server.on('connection', (socket) => {
  socket.end('handled by parent');
});
server.listen(1337, () => {
  subprocess.send('server', server);
});
```

The child would then receive the server object as:

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

While the example above uses a server created using the `net` module, `dgram` module servers use exactly the same workflow with the exceptions of listening on a `'message'` event instead of `'connection'` and using `server.bind()` instead of `server.listen()`. This is, however, currently only supported on UNIX platforms.

#### Example: sending a socket object

Similarly, the `sendHandler` argument can be used to pass the handle of a socket to the child process. The example below spawns two children that each handle connections with "normal" or "special" priority:

```js
const { fork } = require('child_process');
const normal = fork('subprocess.js', ['normal']);
const special = fork('subprocess.js', ['special']);

// Open up the server and send sockets to child. Use pauseOnConnect to prevent
// the sockets from being read before they are sent to the child process.
const server = require('net').createServer({ pauseOnConnect: true });
server.on('connection', (socket) => {

  // If this is special priority
  if (socket.remoteAddress === '74.125.127.100') {
    special.send('socket', socket);
    return;
  }
  // This is normal priority
  normal.send('socket', socket);
});
server.listen(1337);
```

The `subprocess.js` would receive the socket handle as the second argument passed to the event callback function:

```js
process.on('message', (m, socket) => {
  if (m === 'socket') {
    if (socket) {
      // Check that the client socket exists.
      // It is possible for the socket to be closed between the time it is
      // sent and the time it is received in the child process.
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

A `Readable Stream` that represents the child process's `stderr`.

If the child was spawned with `stdio[2]` set to anything other than `'pipe'`, then this will be `null`.

`subprocess.stderr` is an alias for `subprocess.stdio[2]`. Both properties will refer to the same value.

### subprocess.stdin

<!-- YAML
added: v0.1.90
-->

* {stream.Writable}

A `Writable Stream` that represents the child process's `stdin`.

*Note that if a child process waits to read all of its input, the child will not continue until this stream has been closed via `end()`.*

If the child was spawned with `stdio[0]` set to anything other than `'pipe'`, then this will be `null`.

`subprocess.stdin` is an alias for `subprocess.stdio[0]`. Both properties will refer to the same value.

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
    0, // Use parent's stdin for child
    'pipe', // Pipe child's stdout to parent
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

### subprocess.stdout

<!-- YAML
added: v0.1.90
-->

* {stream.Readable}

A `Readable Stream` that represents the child process's `stdout`.

If the child was spawned with `stdio[1]` set to anything other than `'pipe'`, then this will be `null`.

`subprocess.stdout` is an alias for `subprocess.stdio[1]`. Both properties will refer to the same value.

## `maxBuffer` and Unicode

The `maxBuffer` option specifies the largest number of bytes allowed on `stdout` or `stderr`. If this value is exceeded, then the child process is terminated. This impacts output that includes multibyte character encodings such as UTF-8 or UTF-16. For instance, `console.log('中文测试')` will send 13 UTF-8 encoded bytes to `stdout` although there are only 4 characters.

## Shell Requirements

The shell should understand the `-c` switch on UNIX or `/d /s /c` on Windows. On Windows, command line parsing should be compatible with `'cmd.exe'`.

## Default Windows Shell

Although Microsoft specifies `%COMSPEC%` must contain the path to `'cmd.exe'` in the root environment, child processes are not always subject to the same requirement. Thus, in `child_process` functions where a shell can be spawned, `'cmd.exe'` is used as a fallback if `process.env.ComSpec` is unavailable.