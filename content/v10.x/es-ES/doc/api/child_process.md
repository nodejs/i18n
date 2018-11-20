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

Por defecto, los pipes para `stdin`, `stdout` y `stderr` son establecidos entre el proceso Node.js primario y el proceso secundario generado. Estos pipes tienen capacidad (y plataforma específica) limitada. Si el proceso secundario escribe a stdout, excediendo ese límite sin que se haya capturado la salida, el proceso secundario lo bloqueará esperando a que el búfer del pipe acepte más datos. Esto es idéntico al comportamiento de los pies en el shell. Utilice la opción `{ stdio: 'ignore' }` si la salida no será consumida.

El método [`child_process.spawn()`][] genera el proceso secundario asincrónicamente, sin bloquear el bucle de evento Node.js. La función [`child_process.spawnSync()`][] proporciona una funcionalidad equivalente de manera síncrona que bloquea el bucle del evento hasta que el proceso engendrado exista o finalice.

Por conveniencia, el módulo `child_process` proporciona un puñado de alternativas sincrónicas y asincrónicas a [`child_process.spawn()`][] y [`child_process.spawnSync()`][]. *Note que cada una de estas alternativas son implementadas por encima de [`child_process.spawn()`][] o de [`child_process.spawnSync()`][].*

    * [`child_process.exec()`][]: genera un shell y ejecuta un comando dentro de ese shell,
      pasar `stdout` y `stderr` a una función de callback cuando termine.
    * [`child_process.execFile()`][]: similar to [`child_process.exec()`][] except that
      it spawns the command directly without first spawning a shell by default.
    * [`child_process.fork()`][]: genera un nuevo proceso de Node.js e invoca un
      módulo especificado con un canal de comunicación IPC establecido que permite
      enviar mensajes entre primario y secundario.
    * [`child_process.execSync()`][]: una versión sincrónica de 
      [`child_process.exec()`][] que *bloqueará* el bucle de evento de Node.js.
    * [`child_process.execFileSync()`][]: una versión sincrónica de 
      [`child_process.execFile()`][] que *bloqueará* el bucle de evento de Node.js.
    

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
  * `cwd` {string} El directorio del proceso secundario actualmente operativo. **Predeterminado:** `null`.
  * `env` {Object} Pares clave-valor del entorno. **Predeterminado:** `null`.
  * `encoding` {string} **Predeterminado:** `'utf8'`
  * `shell` {string} Shell con el que ejecutar el comando. Vea [Shell Requirements](#child_process_shell_requirements) y [Default Windows Shell](#child_process_default_windows_shell). **Default:** `'/bin/sh'` en UNIX, `process.env.ComSpec` en Windows.
  * `timeout` {number} **Predeterminado:** `0`
  * `maxBuffer` {number} La cantidad más grande datos en bytes permitidos en stdout o stderr. Si se excede, el proceso secundario se finaliza. Vea caveat en [`maxBuffer` y Unicode][]. **Predeterminado:** `200 * 1024`.
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
  * `env` {Object} Pares clave-valor del entorno.
  * `encoding` {string} **Predeterminado:** `'utf8'`
  * `timeout` {number} **Predeterminado:** `0`
  * `maxBuffer` {number} Cantidad más grande de datos en bytes permitidos en stdout o stderr. Si se excede, se finaliza el proceso secundario. Vea caveat en [`maxBuffer` y Unicode][]. **Predeterminado:** `200 * 1024`.
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
  * `env` {Object} Pares clave-valor del entorno.
  * `execPath` {string} Ejecutable utilizado para crear el proceso secundario.
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
  * `env` {Object} Pares clave-valor del entorno.
  * `argv0` {string} Establecer explícitamente el valor de `argv[0]` enviado al proceso secundario. Esto será establecido en el `command` si no se especifica.
  * `stdio` {Array|string} Configuración stdio del proceso secundario (vea [`options.stdio`][`stdio`]).
  * `detached` {boolean} Prepare el proceso secundario para ejecutar independientemente de su proceso primario. El comportamiento específico depende de la plataforma, vea [`options.detached`][]).
  * `uid` {number} Establece la identidad de usuario del proceso (vea setuid(2)).
  * `gid` {number} Establece la identidad de grupo del proceso (vea setgid(2)).
  * `shell` {boolean|string} Si es `true`, ejecuta el `command` dentro de un shell. Utiliza `'/bin/sh'` en UNIX y `process.env.ComSpec` en Windows. Una shell diferente puede especificarse como una string. Vea los [Requerimientos de Shell](#child_process_shell_requirements) y [Default Windows Shell](#child_process_default_windows_shell). **Predeterminado:** `false` (sin shell).
  * `windowsVerbatimArguments` {boolean} No se realiza ninguna cita o escape de argumentos en Windows. Se ignora en Unix. Esto se establece automáticamente a `true` cuando se especifica `shell`. **Predeterminado:** `false`.
  * `windowsHide` {boolean} Ocultar la ventada de la consola de sub-proceso que normalmente se crea en los sistemas Windows. **Predeterminado:** `false`.
* Devuelve: {ChildProcess}

El método `child_process.spawn()` genera un nuevo proceso usando el `command` dado con los argumentos de línea de comando en `args`. Si se omite, `args` se establece de manera predeterminada a un array vacío.

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

Actualmente, Node.js sobrescribe a `argv[0]` con `process.execPath` en el inicio, por lo que `process.argv[0]` en un proceso secundario de Node.js no coincidirá con el parámetro `argv0` pasado a `spawn` desde el proceso primario, en su lugar, recupérelo con la propiedad `process.argv0`.

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

La opción `options.stdio` es utilizada para configurar los pipes que son establecidos entre el proceso primario y el proceso secundario. Por defecto, el stdin, stdout y stderr del proceso secundario son redireccionados a streams [`subprocess.stdin`][], [`subprocess.stdout`][] y [`subprocess.stderr`][] correspondientes en el objeto [`ChildProcess`][]. Esto es equivalente a configurar el `options.stdio` igual a `['pipe', 'pipe', 'pipe']`.

Por conveniencia, `options.stdio` puede ser uno de los siguientes strings:

* `'pipe'` - equivalente a `['pipe', 'pipe', 'pipe']` (lo predeterminado)
* `'ignore'` - equivalente a `['ignore', 'ignore', 'ignore']`
* `'inherit'` - equivalente a `[process.stdin, process.stdout, process.stderr]` o `[0,1,2]`

De otra manera, el valor de `options.stdio` es un array en donde cada índice corresponde a un fd en el proceso secundario. Los fds 0, 1 y 2 corresponden a stdin, stdout y stderr respectivamente. Fds adicionales pueden especificarse para crear pipes adicionales entre el proceso primario y el proceso secundario. El valor es uno de los siguientes:

1. `'pipe'` - Crea un pipe entre el proceso secundario y el proceso primario. El final del pipe del proceso primario le es expuesto a éste como una propiedad en el objeto `child_process`, como [`subprocess.stdio[fd]`][`stdio`]. Los pipes creados para fds 0 - 2 también están disponibles como [`subprocess.stdin`][], [`subprocess.stdout`][] y [`subprocess.stderr`][], respectivamente.
2. `'ipc'` - Crea un canal IPC para pasar descriptores de mensajes/archivos entre el proceso primario y secundario. Un [`ChildProcess`][] puede tener hasta *un* descriptor de archivo stdio IPC. Configurar esta opción habilita el método [`subprocess.send()`][]. Si el proceso secundario es un proceso Node.js, la presencia de un canal IPC habilitará los métodos [`process.send()`][] and [`process.disconnect()`][], al igual que los eventos [`'disconnect'`][] y [`'message'`][] dentro del proceso secundario.
  
  Acceder al fd del canal IPC de cualquier manera distinta a [`process.send()`][] o usar un canal IPC con un proceso secundario que no es una instancia de Node.js no es soportado.

3. `'ignore'` - Enseña a Node.js a ignorar el fd en el proceso secundario. Mientras que Node.js siempre abrirá los fds 0 - 2 para los procesos que genera, configurar el fd a `'ignore'` causará que Node.js abra `/dev/null` y lo adjunte al del proceso secundario.

4. {Stream} objeto - Comparte un stream legible o grabable que se refiere a un tty, archivo, conector o un pipe con el proceso secundario. El descriptor del archivo subyaciente del stream es duplicado en el proceso secundario al fd que corresponde al índice en el array `stdio`. Note that the stream must have an underlying descriptor (file streams do not until the `'open'` event has occurred).
5. Entero positivo - El valor del entero es interpretado como un descriptor de archivo que está actualmente abierto en el proceso primario. Es compartido con el proceso secundario, similar a como los objetos {Stream} pueden compartirse.
6. `null`, `undefined` - Utiliza el valor por defecto. Para los fds stdio 0, 1 y 2 (en otras palabras, stdin, stdout y stderr) se crea un pipe. Para fd 3 y mayores, el predeterminado es `'ignore'`.

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
  * `stdio` {string|Array} Configuración del stdio del proceso secundario. Por defecto, `stderr` será la salida del stderr del proceso primario, a menos que se especifique el `stdio`. **Predeterminado:** `'pipe'`.
  * `env` {Object} Pares clave-valor del entorno.
  * `uid` {number} Establece la identidad de usuario del proceso (vea setuid(2)).
  * `gid` {number} Establece la identidad de grupo del proceso (vea setgid(2)).
  * `timeout` {number} En milisegundos, la cantidad máxima de tiempo que permite que se ejecute el proceso. **Predeterminado:** `undefined`.
  * `killSignal` {string|integer} El valor de la señal a ser usado cuando el proceso generado vaya a ser aniquilado. **Predeterminado:** `'SIGTERM'`.
  * `maxBuffer` {number} La mayor cantidad de datos en bytes permitidos en stdout o stderr. Si se excede, el proceso secundario se finaliza. Vea caveat en [`maxBuffer` y Unicode][]. **Predeterminado:** `200 * 1024`.
  * `encoding` {string} La codificación usada para todas entradas y salidas de stdio. **Predeterminado:** `'buffer'`.
  * `windowsHide` {boolean} Oculta la ventada de la consola de sub-procesos que normalmente estaría creada en sistemas Windows. **Predeterminado:** `false`.
  * `shell` {boolean|string} Si es `true`, ejecuta el `command` dentro de un shell. Utiliza `'/bin/sh'` en UNIX y `process.env.ComSpec` en Windows. Una shell diferente puede especificarse como una string. Vea los [Requerimientos de Shell](#child_process_shell_requirements) y [Shell de Windows Predeterminado](#child_process_default_windows_shell). **Predeterminado:** `false` (sin shell).
* Devuelve: {Buffer|string} El stdout desde el comando.

El método `child_process.execFileSync()` es generalmente idéntico a [`child_process.execFile()`][] con la excepción de que el método no se devolverá hasta que el proceso secundario haya sido completamente cerrado. Cuando se haya encontrado un timeout y se haya enviado una `killSignal`, el método no se devolverá hasta que el proceso haya sido completamente cerrado.

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
  * `stdio` {string|Array} La configuración del stdio del proceso secundario. `stderr` por defecto será la salida del stderr del proceso primario a menos que se especifique el `stdio`. **Predeterminado:** `'pipe'`.
  * `env` {Object} Pares clave-valor del entorno.
  * `shell` {string} Shell con el que ejecutar el comando. Vea los [Requerimientos de Shell](#child_process_shell_requirements) y [Shell de Windows Predeterminado](#child_process_default_windows_shell). **Default:** `'/bin/sh'` en UNIX, `process.env.ComSpec` en Windows.
  * `uid` {number} Establece la identidad del usuario del proceso. (Vea setuid(2)).
  * `gid` {number} Establece la identidad del grupo del proceso. (Vea setgid(2)).
  * `timeout` {number} En milisegundos, la cantidad máxima de tiempo que permite que se ejecute el proceso. **Predeterminado:** `undefined`.
  * `killSignal` {string|integer} El valor de la señal a ser usado cuando el proceso generado vaya a ser aniquilado. **Predeterminado:** `'SIGTERM'`.
  * `maxBuffer` {number} La mayor cantidad de datos en bytes permitidos en stdout o stderr. Si se excede, el proceso secundario se finaliza. Vea caveat en [`maxBuffer` y Unicode][]. **Predeterminado:** `200 * 1024`.
  * `encoding` {string} La codificación usada para todas las entradas y salidas de stdio. **Predeterminado:** `'buffer'`.
  * `windowsHide` {boolean} Oculta la ventana de la consola del sub-proceso que normalmente se crea en los sistemas Windows. **Predeterminado:** `false`.
* Devuelve: {Buffer|string} El stdout desde el comando.

El método `child_process.execSync()` es generalmente idéntico a [`child_process.exec()`][] a excepción de que el método no se devolverá hasta que el proceso secundario haya sido completamente cerrado. Cuando se ha encontrado un timeout y se ha enviado una `killSignal`, el método no se devolverá hasta que el proceso haya sido completamente cerrado. *Note que si el proceso secundario intercepta y maneja la señal `SIGTERM` y no se cierra, el proceso primario todavía esperará hasta que el proceso secundario se haya cerrado.*

Si el proceso expira o tiene un código de salida diferente a cero, este método ***arrojará***. El objeto [`Error`][] contendrá el resultado entero de [`child_process.spawnSync()`][].

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

* `command` {string} El comando a ejecutar.
* `args` {string[]} Lista de argumentos de strings.
* `opciones` {Object} 
  * `cwd` {string} El directorio del proceso secundario actualmente operativo.
  * `input` {string|Buffer|Uint8Array} El valor que será pasado como stdin al proceso generado. Suministrar este valor anulará `stdio[0]`.
  * `stdio` {string|Array} La configuración del stdio del proceso secundario.
  * `env` {Object} Pares clave-valor del entorno.
  * `uid` {number} Establece la identidad del usuario del proceso (vea setuid(2)).
  * `gid` {number} Establece la identidad del grupo del proceso (vea setgid(2)).
  * `timeout` {number} En milisegundos, la cantidad máxima de tiempo que permite que se ejecute el proceso. **Predeterminado:** `undefined`.
  * `killSignal` {string|integer} El valor de la señal a ser usado cuando el proceso generado vaya a ser aniquilado. **Predeterminado:** `'SIGTERM'`.
  * `maxBuffer` {number} La mayor cantidad de datos en bytes permitidos en stdout o stderr. Si se excede, el proceso secundario se finaliza. Vea caveat en [`maxBuffer` y Unicode][]. **Predeterminado:** `200 * 1024`.
  * `encoding` {string} La codificación usada para todas las entradas y salidas de stdio. **Predeterminado:** `'buffer'`.
  * `shell` {boolean|string} Si es `true`, ejecuta el `command` dentro de un shell. Utiliza `'/bin/sh'` en UNIX y `process.env.ComSpec` en Windows. Una shell diferente puede especificarse como una string. Vea los [Requerimientos de Shell](#child_process_shell_requirements) y [Shell de Windows Predeterminado](#child_process_default_windows_shell). **Predeterminado:** `false` (sin shell).
  * `windowsVerbatimArguments` {boolean} No se realiza ninguna cita o escape de argumentos en Windows. Se ignora en Unix. Esto se establece automáticamente a `true` cuando se especifica el `shell`. **Predeterminado:** `false`.
  * `windowsHide` {boolean} Oculta la ventana de la consola de sub-procesos que normalmente estaría creada en sistemas Windows. **Predeterminado:** `false`.
* Devuelve: {Object} 
  * `pid` {number} Pid del proceso secundario.
  * `output` {Array} Array de los resultados de la salida stdio.
  * `stdout` {Buffer|string} Los contenidos de `output[1]`.
  * `stderr` {Buffer|string} Los contenidos de `output[2]`.
  * `status` {number} El código de salida del proceso secundario.
  * `signal` {string} La señal usada para aniquilar el proceso secundario.
  * `error` {Error} El objeto error si el proceso secundario falla o expira.

El método `child_process.spawnSync()` es generalmente idéntico a [`child_process.spawn()`][] a excepción de que la función no se devolverá hasta que el proceso secundario haya sido completamente cerrado. Cuando se ha encontrado un timeout y se ha enviado una `killSignal`, el método no se devolverá hasta que el proceso haya sido completamente cerrado. Note que si el proceso intercepta y maneja la señal `SIGTERM` y no se cierra, el proceso primario esperará hasta que el proceso secundario se haya cerrado.

**Si la opción `shell` está habilitada, no pase la entrada del usuario no optimizado a esta función. Cualquier entrada que contenga metacaracteres shell puede ser usada para activar la ejecución de comando arbitrario.**

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

### Evento: 'disconnect' (desconectar)

<!-- YAML
added: v0.7.2
-->

El evento `'disconnect'` es emitido luego de llamar al método [`subprocess.disconnect()`][] en el proceso primario o [`process.disconnect()`][] en el proceso secundario. Luego de desconectarlo, no es posible enviar o recibir mensajes, y la propiedad [`subprocess.connected`][] es `false`.

### Evento: 'error'

* `err` {Error} El error.

El evento `'error'` es emitido cuando:

1. El proceso no pudo ser generado o
2. El proceso no pudo ser aniquilado o
3. Falló el envío de un mensaje al proceso secundario.

El evento `'exit'` puede o no disparar luego de que haya ocurrido un error. Al escuchar los eventos `'exit'` y `'error'`, es importante salvaguardarse de invocar múltiples veces, por accidente, funciones de manejador.

Vea también [`subprocess.kill()`][] y [`subprocess.send()`][].

### Evento: 'exit' (salida)

<!-- YAML
added: v0.1.90
-->

* `code` {number} El código de salida si el proceso secundario se cerró por sí solo.
* `signal` {string} La señal por la cual el proceso secundario fue terminado.

El evento `'exit'` es emitido luego de que el proceso secundario finaliza. Si se cierra el proceso, `code` es el código de salida final del proceso, o de otra manera es `null`. Si el proceso se termina debido a la recepción de una señal, `signal` es el nombre de la string de la señal, sino es `null`. Una de las dos siempre será no nula.

Note que cuando se activa el evento `'exit'`, los streams stdio del proceso secundario pueden todavía seguir abiertos.

También note que Node.js establece manejadores de señal para `SIGINT` y `SIGTERM` y que los procesos Node.js no se terminarán inmediatamente debido a la recepción de esas señales. Por lo contrario, Node.js llevará a cabo una secuencia de acciones de limpieza y luego volverá a subir la señal manejada.

Vea waitpid(2).

### Evento: 'message' (mensaje)

<!-- YAML
added: v0.5.9
-->

* `message` {Object} Un objeto JSON analizado o un valor primitivo.
* `sendHandle` {Handle} Un objeto [`net.Socket`][] o [`net.Server`][] o indefinido.

El evento `'message'` se desencadena cuando un proceso secundario utiliza [`process.send()`][] para enviar mensajes.

El mensaje pasa a través de la serialización y análisis. El mensaje resultante puede no ser el mismo que lo originalmente enviado.

### subprocess.channel

<!-- YAML
added: v7.1.0
-->

* {Object} Un pipe que representa el canal IPC al proceso secundario.

La propiedad `subprocess.channel` es una referencia al canal IPC del proceso secundario. Si no existe actualmente un canal IPC, esta propiedad es `undefined`.

### subprocess.connected

<!-- YAML
added: v0.7.2
-->

* {boolean} Establece a `false` luego de que se llame a `subprocess.disconnect()`.

La propiedad `subprocess.connected` indica si todavía es posible enviar y recibir mensajes de un proceso secundario. Cuando `subprocess.connected` es `false`, no es posible enviar o recibir mensajes.

### subprocess.disconnect()

<!-- YAML
added: v0.7.2
-->

Cierra el canal IPC entre el proceso primario y el secundario, permitiendo que el secundario se cierre exitosamente, una vez que no hayan otras conexiones que lo mantengan activo. Luego de llamar a este método, las propiedades `subprocess.connected` y `process.connected` en el proceso primario y el proceso secundario (respectivamente), se establecerá a `false` y ya no será posible pasar mensajes entre los procesos.

El evento `'disconnect'` será emitido cuando no hayan mensajes en el proceso de ser recibidos. Generalmente, esto se activará inmediatamente después de llamar a `subprocess.disconnect()`.

Note que cuando el proceso secundario es una instancia Node.js (por ejemplo, cuando ha sido generado utilizando [`child_process.fork()`]), el método `process.disconnect()` puede ser invocado dentro del proceso secundario para cerrar también el canal IPC.

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
    `child process terminated due to receipt of signal ${signal}`);
});

// Send SIGHUP to process
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

* {boolean} Establecido a `true` luego de que se haya usado `subprocess.kill()` para enviar una señal con éxito al proceso secundario.

La propiedad `subprocess.killed` indica si el proceso secundario recibió con éxito una señal desde `subprocess.kill()`. La propiedad `killed` no indica que el proceso secundario haya sido terminado.

### subprocess.pid

<!-- YAML
added: v0.1.90
-->

* {integer}

Devuelve el identificador del proceso (PID) del proceso secundario.

Ejemplo:

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
* `opciones` {Object} El argumento `options`, si está presente, es un objeto usado para parametizar el envío de ciertos tipos de manejos. `options` soporta las siguientes propiedades: 
  * `keepOpen` {boolean} Un valor que puede ser usado al pasar instancias de `net.Socket`. Cuando es `true`, la conexión se mantiene abierta en el proceso de envío. **Predeterminado:** `false`.
* `callback` {Function}
* Devuelve: {boolean}

Cuando un canal IPC ha sido establecido entre el proceso primario y el secundario (p. ej. al usar [`child_process.fork()`][]), el método `subprocess.send()` puede ser usado para enviar mensajes al proceso secundario. Cuando el proceso secundario es una instancia Node.js, estos mensajes pueden ser recibidos a través del evento [`'message'`][].

El mensaje pasa a través de la serialización y análisis. El mensaje resultante puede no ser el mismo que lo originalmente enviado.

Por ejemplo, en el script primario:

```js
const cp = require('child_process');
const n = cp.fork(`${__dirname}/sub.js`);

n.on('message', (m) => {
  console.log('PARENT got message:', m);
});

// Causes the child to print: CHILD got message: { hello: 'world' }
n.send({ hello: 'world' });
```

Y, entonces, el script secundario, `'sub.js'` puede lucir así:

```js
process.on('message', (m) => {
  console.log('CHILD got message:', m);
});

// Causes the parent to print: PARENT got message: { foo: 'bar', baz: null }
process.send({ foo: 'bar', baz: NaN });
```

Los procesos Node.js secundarios tendrán un método [`process.send()`][] propio que permita que el proceso secundario envíe mensajes de vuelta al proceso primario.

Hay un caso especial al enviar un mensaje `{cmd: 'NODE_foo'}`. Los mensajes que contengan un prefijo `NODE_` en la propiedad `cmd` son reservados para usar dentro del core de Node.js y no serán emitidos en el evento [`'message'`][] del proceso secundario. En su lugar, dichos mensajes son emitidos usando el evento `'internalMessage'` y son consumidos internamente por Node.js. Las aplicaciones deben evitar usar dichos mensajes o escuchar los eventos `'internalMessage'`, ya que están sujetos a cambiar sin previo aviso.

El argumento `sendHandle` opcional que puede ser pasado a `subprocess.send()` es para pasar un servidor TCP un objeto conector al proceso secundario. El proceso secundario recibirá el objeto como el segundo argumento pasado a la función callback registrada en el evento [`'message'`][]. Cualquier data que sea recibida y almacenada en el socket no será enviada al proceso secundario.

El `callback` opcional es una opción que es invocada luego de que el mensaje es enviado, pero antes de que el proceso secundario pudiera haber sido recibido. La función es llamada con un argumento simple: `null` en éxito, o con un objeto [`Error`][] en fracaso.

No se provee ninguna función `callback` y el mensaje no puede ser enviado, un evento `'error'` será emitido por el objeto [`ChildProcess`][]. Esto puede pasar, por ejemplo, cuando el proceso secundario ya se haya cerrado.

`subprocess.send()` devolverá `false` si el canal se ha cerrado o cuando la reserva de mensajes sin enviar exceda el límite que hace imprudente enviar más. De otro modo, el método devuelve `true`. La función `callback` puede ser usada para implementar control de flujo.

#### Ejemplo: enviado un objeto del servidor

El argumento `sendHandle` puede ser usado, por ejemplo, para pasar el handle de un objeto de servidor TCP al proceso secundario, como se ilustra en el siguiente ejemplo:

```js
const subprocess = require('child_process').fork('subprocess.js');

// Abre el objeto de servidor y envía el handle.
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

While the example above uses a server created using the `net` module, `dgram` module servers use exactly the same workflow with the exceptions of listening on a `'message'` event instead of `'connection'` and using `server.bind()` instead of `server.listen()`. Esto es, sin embargo, actualmente soportado únicamente en plataformas UNIX.

#### Ejemplo: enviando un objeto conector

De manera similar, el argumento `sendHandler` puede ser usado para pasar el handle de un conector al proceso secundario. El siguiente ejemplo genera dos procesos secundarios, cada uno maneja conexiones con prioridad "normal" o "especial":

```js
const { fork } = require('child_process');
const normal = fork('subprocess.js', ['normal']);
const special = fork('subprocess.js', ['special']);

// Abre el servidor y envía conectores al proceso secundario. Use pauseOnConnect para prevenir
// que los sockets sean leídos antes de ser enviados al proceso secundario.
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
      // Verifica la existencia de un socket de cliente.
      // Es posible que se cierre el conector entre el tiempo en que se
      // envía y el tiempo en el que se recibe en el proceso secundario.
      socket.end(`Request handled with ${process.argv[2]} priority`);
    }
  }
});
```

Una vez que un conector ha sido pasado al proceso secundario, el proceso primario ya no es capaz de monitorear cuando éste es destruido. Para indicar esto, la propiedad `.connections` se convierte en `null`. Se recomienda no utilizar `.maxConnections` cuando esto ocurre.

También se recomienda que cualquier manejador de `'message'` en el proceso secundario verifique la existencia de `socket`, ya que la conexión puede haber sido cerrada durante el tiempo que toma enviar la conexión al proceso secundario.

### subprocess.stderr

<!-- YAML
added: v0.1.90
-->

* {stream.Readable}

Un `Readable Stream` que represente el `stderr` del proceso secundario.

Si el proceso secundario fue generado con el `stdio[2]` establecido a cualquier otro diferente a `'pipe'`, entonces esto será `null`.

`subprocess.stderr` es un alias de `subprocess.stdio[2]`. Ambas propiedades se referirán al mismo valor.

### subprocess.stdin

<!-- YAML
added: v0.1.90
-->

* {stream.Writable}

Un `Writable Stream` que representa al `stdin` del proceso secundario.

*Note que si un proceso secundario espera a leer todas sus entradas, el proceso secundario no continuará hasta que este stream haya sido cerrado a través de `end()`.*

Si el proceso secundario fue generado con el `stdio[0]` establecido a cualquier otro diferente a `'pipe'`, entonces esto será `null`.

`subprocess.stdin` es un alias de `subprocess.stdio[0]`. Both properties will refer to the same value.

### subprocess.stdio

<!-- YAML
added: v0.7.10
-->

* {Array}

Un array disperso de pipes al proceso secundario, correspondiente con posiciones en la opción [`stdio`][] pasada a [`child_process.spawn()`][] que ha sido establecida al valor `'pipe'`. Note que `subprocess.stdio[0]`, `subprocess.stdio[1]` y `subprocess.stdio[2]` también están disponibles como `subprocess.stdin`, `subprocess.stdout` y `subprocess.stderr`, respectivamente.

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

Un `Readable Stream` que representa el `stdout` del proceso secundario.

Si el proceso secundario fue generado con el `stdio[1]` establecido a cualquier otro diferente a `'pipe'`, entonces esto será `null`.

`subprocess.stdout` es un alias de `subprocess.stdio[1]`. Ambas propiedades se referirán al mismo valor.

## `maxBuffer` y Unicode

La opción `maxBuffer` especifica al mayor número de bytes permitidos en `stdout` o `stderr`. Si se excede este valor, entonces el proceso secundario se finaliza. This impacts output that includes multibyte character encodings such as UTF-8 or UTF-16. Por ejemplo, `console.log('中文测试')` enviará 13 UTF-8 bytes codificados a `stdout`, aunque sólo hayan 4 caracteres.

## Requerimientos de Shell

El shell debe entender el interruptor `-c` en UNIX o `/d /s /c` en Windows. En Windows, el análisis de línea de comandos debe ser compatible con `'cmd.exe'`.

## Shell de Windows Predeterminado

Aunque Microsoft especifique que `%COMSPEC%` debe contener la ruta a `'cmd.exe'` en el entorno root, los procesos secundarios no siempre están sujetos al mismo requerimiento. Así, en las funciones `child_process` donde un shell puede ser generado, se utiliza `'cmd.exe'` como un fallback si `process.env.ComSpec` no está disponible.