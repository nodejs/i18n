# Proceso

<!-- introduced_in=v0.10.0 -->
<!-- type=global -->

El objeto `process` es un `global` que proporciona información y control sobre el proceso actual de Node.js. Como un global, siempre está disponible para aplicaciones de Node.js sin utilizar `require()`. It can also be explicitly accessed using `require()`:

```js
const process = require('process');
```

## Eventos de Proceso

El objeto `process` es una instancia de [`EventEmitter`][].

### Event: `'beforeExit'`
<!-- YAML
added: v0.11.12
-->

El evento `'beforeExit'` es emitido cuando Node.js vacía su bucle de evento y no tiene un trabajo adicional que programar. Normalmente, el proceso Node.js se cerrará cuando no haya ningún trabajo programado, pero un listener registrado en el evento `'beforeExit'` puede hacer llamadas asíncronas y así causar que el proceso Node.js continúe.

La función callback del oyente es invocada con el valor de [`process.exitCode`][] pasado como el único argumento.

The `'beforeExit'` event is *not* emitted for conditions causing explicit termination, such as calling [`process.exit()`][] or uncaught exceptions.

The `'beforeExit'` should *not* be used as an alternative to the `'exit'` event unless the intention is to schedule additional work.

```js
process.on('beforeExit', (code) => {
  console.log('Process beforeExit event with code: ', code);
});

process.on('exit', (code) => {
  console.log('Process exit event with code: ', code);
});

console.log('This message is displayed first.');

// Prints:
// This message is displayed first.
// Process beforeExit event with code: 0
// Process exit event with code: 0
```

### Event: `'disconnect'`
<!-- YAML
added: v0.7.7
-->

Si el proceso Node.js es generado con un canal IPC (ver la documentación de [Proceso Secundario](child_process.html) y de [Cluster](cluster.html)), el evento `'disconnect'` será emitido cuando el canal IPC esté cerrado.

### Event: `'exit'`
<!-- YAML
added: v0.1.7
-->

* `code` {integer}

El evento `'exit'` es emitido cuando el proceso Node.js está por cerrarse como un resultado de:

* El método `process.exit()` siendo llamado de manera explícita;
* El bucle de evento de Node.js ya no tiene ningún trabajo adicional que realizar.

No hay manera de prevenir la salida del bucle del evento en este punto, y una vez que todos los oyentes de `'exit'` hayan terminado de ejecutar el proceso Node.js, se terminarán.

The listener callback function is invoked with the exit code specified either by the [`process.exitCode`][] property, or the `exitCode` argument passed to the [`process.exit()`][] method.

```js
process.on('exit', (code) => {
  console.log(`About to exit with code: ${code}`);
});
```

Listener functions **must** only perform **synchronous** operations. El proceso Node.js saldrá inmediatamente después de llamar a los oyentes del evento `'exit'`, causando que se abandone cualquier trabajo adicional que todavía se encuentre en cola en el bucle del evento. En el siguiente ejemplo, el tiempo de espera nunca ocurrirá:

```js
process.on('exit', (code) => {
  setTimeout(() => {
    console.log('This will not run');
  }, 0);
});
```

### Event: `'message'`
<!-- YAML
added: v0.5.10
-->

* `message` { Object | boolean | number | string | null } a parsed JSON object or a serializable primitive value.
* `sendHandle` {net.Server|net.Socket} a [`net.Server`][] or [`net.Socket`][] object, or undefined.

Si el proceso Node.js es generado con un canal IPC (ver la documentación de [Child Process](child_process.html) y de [Cluster](cluster.html)), el evento `'message'` es emitido cuando un mensaje enviado por un proceso primario utilizando [`childprocess.send()`][] es recibido por el proceso secundario.

El mensaje pasa a través de la serialización y análisis. The resulting message might not be the same as what is originally sent.

If the `serialization` option was set to `advanced` used when spawning the process, the `message` argument can contain data that JSON is not able to represent. See [Advanced Serialization for `child_process`][] for more details.

### Event: `'multipleResolves'`
<!-- YAML
added: v10.12.0
-->

* `type` {string} The resolution type. One of `'resolve'` or `'reject'`.
* `promise` {Promise} The promise that resolved or rejected more than once.
* `value` {any} The value with which the promise was either resolved or rejected after the original resolve.

The `'multipleResolves'` event is emitted whenever a `Promise` has been either:

* Resolved more than once.
* Rejected more than once.
* Rejected after resolve.
* Resolved after reject.

This is useful for tracking potential errors in an application while using the `Promise` constructor, as multiple resolutions are silently swallowed. However, the occurrence of this event does not necessarily indicate an error. For example, [`Promise.race()`][] can trigger a `'multipleResolves'` event.

```js
process.on('multipleResolves', (type, promise, reason) => {
  console.error(type, promise, reason);
  setImmediate(() => process.exit(1));
});

async function main() {
  try {
    return await new Promise((resolve, reject) => {
      resolve('First call');
      resolve('Swallowed resolve');
      reject(new Error('Swallowed reject'));
    });
  } catch {
    throw new Error('Failed');
  }
}

main().then(console.log);
// resolve: Promise { 'First call' } 'Swallowed resolve'
// reject: Promise { 'First call' } Error: Swallowed reject
//     at Promise (*)
//     at new Promise (<anonymous>)
//     at main (*)
// First call
```

### Event: `'rejectionHandled'`
<!-- YAML
added: v1.4.1
-->

* `promise` {Promise} La promesa manejada tarde.

El evento `'rejectionHandled'` es emitido cuando una `Promise` ha sido rechazada y se adjuntó un manejador de errores (utilizando [`promise.catch()`][], por ejemplo) después de un giro del bucle de evento de Node.js.

El objeto `Promise` habría sido previamente emitido en un evento `'unhandledRejection'`, pero durante el curso del procesamiento ganó un manejador de rechazos.

No hay noción de un nivel superior para una cadena de `Promise` en la cual los rechazos pueden ser siempre manejados. Ser inherentemente asíncrono en naturaleza, un rechazo de una `Promise` puede ser manejado en un punto futuro del tiempo — posiblemente más tarde que el giro del bucle de evento que el evento `'unhandledRejection'` sea emitido.

Otra manera de decir esto es que, a diferencia de en el código síncrono, donde hay una lista de excepciones sin manejar que está en constante crecimiento, con las Promesas puede haber una lista creciente y decreciente de rechazos no manejados.

En el código síncrono, el evento `'uncaughtException'` es emitido cuando la lista de excepciones no manejadas crece.

En el código asíncrono, el evento `'unhandledRejection'` es emitido cuando la lista de rechazos no manejados crece, y el evento `'rejectionHandled'` es emitido cuando decrece la listas de rechazos no manejados.

```js
const unhandledRejections = new Map();
process.on('unhandledRejection', (reason, promise) => {
  unhandledRejections.set(promise, reason);
});
process.on('rejectionHandled', (promise) => {
  unhandledRejections.delete(promise);
});
```

En este ejemplo, el `unhandledRejections` `Map` crecerá y decrecerá con el tiempo, reflejando rechazos que inician sin ser manejados y pasen a ser manejados. Es posible registrar dichos errores en un registro de errores, de manera periódica (que es probablemente lo más adecuado para aplicaciones de larga ejecución) o al salir del proceso (que es posiblemente lo más conveniente para scripts).

### Event: `'uncaughtException'`
<!-- YAML
added: v0.1.18
changes:
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/26599
    description: Added the `origin` argument.
-->

* `err` {Error} The uncaught exception.
* `origin` {string} Indicates if the exception originates from an unhandled rejection or from synchronous errors. Can either be `'uncaughtException'` or `'unhandledRejection'`.

El evento `'uncaughtException'` es emitido cuando una excepción no capturada de JavaScript vuelve al bucle de eventos. By default, Node.js handles such exceptions by printing the stack trace to `stderr` and exiting with code 1, overriding any previously set [`process.exitCode`][]. Añadir un manejador para el evento `'uncaughtException'` anula este comportamiento predeterminado. Alternatively, change the [`process.exitCode`][] in the `'uncaughtException'` handler which will result in the process exiting with the provided exit code. Otherwise, in the presence of such handler the process will exit with 0.

```js
process.on('uncaughtException', (err, origin) => {
  fs.writeSync(
    process.stderr.fd,
    `Caught exception: ${err}\n` +
    `Exception origin: ${origin}`
  );
});

setTimeout(() => {
  console.log('This will still run.');
}, 500);

// Intentionally cause an exception, but don't catch it.
nonexistentFunc();
console.log('This will not run.');
```

#### Advertencia: Utilizar `'uncaughtException'` correctamente

`'uncaughtException'` is a crude mechanism for exception handling intended to be used only as a last resort. The event *should not* be used as an equivalent to `On Error Resume Next`. Las excepciones no manejadas intrínsecamente significan que una aplicación está en un estado indefinido. Intentar reanudar el código de la aplicación sin recuperarse apropiadamente de la excepción puede causar problemas adicionales impredecibles e imprevisibles.

Las excepciones arrojadas desde dentro del manejador de eventos no serán capturadas. En su lugar, el proceso se cerrará con un código de salida distinto de cero y el stack trace será impreso. Esto es para evitar recursión infinita.

Attempting to resume normally after an uncaught exception can be similar to pulling out the power cord when upgrading a computer. Nine out of ten times, nothing happens. But the tenth time, the system becomes corrupted.

El uso correcto de `'uncaughtException'` es para realizar la limpieza sincrónica de recursos asignados (por ejemplo, descriptores de archivos, manejadores, etc.) antes de finalizar el proceso. **It is not safe to resume normal operation after `'uncaughtException'`.**

To restart a crashed application in a more reliable way, whether `'uncaughtException'` is emitted or not, an external monitor should be employed in a separate process to detect application failures and recover or restart as needed.

### Event: `'unhandledRejection'`
<!-- YAML
added: v1.4.1
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8217
    description: Not handling `Promise` rejections is deprecated.
  - version: v6.6.0
    pr-url: https://github.com/nodejs/node/pull/8223
    description: Unhandled `Promise` rejections will now emit
                 a process warning.
-->

* `reason` {Error|any} El objeto con el cual la promesa fue rechazada (típicamente un objeto [`Error`][]).
* `promise` {Promise} The rejected promise.

The `'unhandledRejection'` event is emitted whenever a `Promise` is rejected and no error handler is attached to the promise within a turn of the event loop. Al programar con Promesas, las excepciones son encapsuladas como "promesas rechazadas". Los rechazos pueden ser capturados y manejados utilizando [`promise.catch()`][] y son propagados a través de una cadena `Promise`. El evento `'unhandledRejection'` es útil para detectar y hacer seguimiento de promesas que fueron rechazadas y cuyos rechazos todavía no han sido manejados.

```js
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

somePromise.then((res) => {
  return reportToUser(JSON.pasre(res)); // Note the typo (`pasre`)
}); // No `.catch()` or `.then()`
```

Lo siguiente también desencadenará el evento `'unhandledRejection'` a ser emitido:

```js
function SomeResource() {
  // Inicialmente establece el estado de carga a una promesa rechazada
  this.loaded = Promise.reject(new Error('Resource not yet loaded!'));
}

const resource = new SomeResource();
// sin .catch o .then en resource.loaded por al menos un turno
```

En este caso de ejemplo, es posible rastrear el rechazo como un error de desarrollador, como sería típicamente el caso para otros eventos `'unhandledRejection'`. Para abordar tales fallos, un manejador [`.catch(() => { })`][`promise.catch()`] no operacional puede ser adjuntado a `resource.loaded`, el cual evitará que el evento `'unhandledRejection'` sea emitido.

### Event: `'warning'`
<!-- YAML
added: v6.0.0
-->

* `warning` {Error} Key properties of the warning are:
  * `name` {string} The name of the warning. **Default:** `'Warning'`.
  * `message` {string} Una descripción de la advertencia proporcionada por el sistema.
  * `stack` {string} Un stack trace a la ubicación en el código en el que se emitió la advertencia.

El evento `'warning'` es emitido cada vez que Node.js emite una advertencia de proceso.

Una advertencia de proceso es similar a un error en el sentido de que describe condiciones excepcionales que son traídas a la atención del usuario. Sin embargo, las advertencias no son parte del flujo normal de manejo de errores de Node.js y JavaScript. Node.js can emit warnings whenever it detects bad coding practices that could lead to sub-optimal application performance, bugs, or security vulnerabilities.

```js
process.on('warning', (warning) => {
  console.warn(warning.name);    // Imprime el nombre de la advertencia
  console.warn(warning.message); // Imprime el mensaje de la advertencia
  console.warn(warning.stack);   // Imprime el stack trace
});
```

Por defecto, Node.js imprimirá las advertencias de proceso en `stderr`. La opción de línea de comando `--no-warnings` puede ser utilizada para suprimir la salida predeterminada de la consola, pero el evento `'warning'` seguirá siendo emitido por el objeto `process`.

The following example illustrates the warning that is printed to `stderr` when too many listeners have been added to an event:

```console
$ node
> events.defaultMaxListeners = 1;
> process.on('foo', () => {});
> process.on('foo', () => {});
> (node:38638) MaxListenersExceededWarning: Possible EventEmitter memory leak
detected. 2 foo listeners added. Use emitter.setMaxListeners() to increase limit
```

En contraste, el siguiente ejemplo desactiva el output de la advertencia predeterminado y agrega un manejador personalizado al evento `'warning'`:

```console
$ node --no-warnings
> const p = process.on('warning', (warning) => console.warn('Do not do that!'));
> events.defaultMaxListeners = 1;
> process.on('foo', () => {});
> process.on('foo', () => {});
> Do not do that!
```

La opción de línea de comandos `--trace-warnings` puede ser utilizada para hacer que el output de consola por defecto para advertencias incluya el stack trace de la advertencia.

Iniciar Node.js utilizando la bandera de línea de comandos `--throw-deprecation` causará que las advertencias de desaprobación personalizadas se arrojen como excepciones.

Utilizar la bandera de línea de comandos `--trace-deprecation` causará que la desaprobación personalizada sea impresa en `stderr` junto con el stack trace.

Utilizar la bandera de línea de comandos `--no-deprecation` suprimirá todos los reportes de desaprobaciones personalizadas.

The `*-deprecation` command line flags only affect warnings that use the name `'DeprecationWarning'`.

#### Emisión de advertencias personalizadas

See the [`process.emitWarning()`](#process_process_emitwarning_warning_type_code_ctor) method for issuing custom or application-specific warnings.

### Eventos de Señal

<!--type=event-->
<!--name=SIGINT, SIGHUP, etc.-->

Los eventos de señal serán emitidos cuando el proceso Node.js reciba una señal. Please refer to signal(7) for a listing of standard POSIX signal names such as `'SIGINT'`, `'SIGHUP'`, etc.

Signals are not available on [`Worker`][] threads.

The signal handler will receive the signal's name (`'SIGINT'`, `'SIGTERM'`, etc.) as the first argument.

El nombre de cada evento será el nombre común en mayúscula para la señal (p. ej., `'SIGINT'` para señales `SIGINT`).

```js
// Inicie leyendo desde stdin, así el proceso no se finaliza.
process.stdin.resume();

process.on('SIGINT', () => {
  console.log('Received SIGINT. Press Control-D to exit.');
});

// Usando una función simple para manejar múltiples señales
function handle(signal) {
  console.log(`Received ${signal}`);
}

process.on('SIGINT', handle);
process.on('SIGTERM', handle);
```

* `'SIGUSR1'` is reserved by Node.js to start the [debugger](debugger.html). It's possible to install a listener but doing so might interfere with the debugger.
* `'SIGTERM'` and `'SIGINT'` have default handlers on non-Windows platforms that reset the terminal mode before exiting with code `128 + signal number`. If one of these signals has a listener installed, its default behavior will be removed (Node.js will no longer exit).
* `'SIGPIPE'` is ignored by default. Puede tener un listener instalado.
* `'SIGHUP'` is generated on Windows when the console window is closed, and on other platforms under various similar conditions. See signal(7). Puede tener instalado un listener, sin embargo, Node.js será terminado incondicionalmente por Windows unos 10 segundos después. En plataformas diferentes a Windows, el comportamiento predeterminado de `SIGHUP` es terminar Node.js, pero una vez que sea instalado un listener, su comportamiento por defecto será eliminado.
* `'SIGTERM'` is not supported on Windows, it can be listened on.
* `'SIGINT'` from the terminal is supported on all platforms, and can usually be generated with `<Ctrl>+C` (though this may be configurable). It is not generated when terminal raw mode is enabled.
* `'SIGBREAK'` is delivered on Windows when `<Ctrl>+<Break>` is pressed, on non-Windows platforms it can be listened on, but there is no way to send or generate it.
* `'SIGWINCH'` is delivered when the console has been resized. En Windows, esto solo ocurrirá al escribir en la consola cuando se mueva el cursor, o cuando se use un tty legible en modo raw.
* `'SIGKILL'` cannot have a listener installed, it will unconditionally terminate Node.js on all platforms.
* `'SIGSTOP'` cannot have a listener installed.
* `'SIGBUS'`, `'SIGFPE'`, `'SIGSEGV'` and `'SIGILL'`, when not raised artificially using kill(2), inherently leave the process in a state from which it is not safe to attempt to call JS listeners. Doing so might lead to the process hanging in an endless loop, since listeners attached using `process.on()` are called asynchronously and therefore unable to correct the underlying problem.

Windows does not support sending signals, but Node.js offers some emulation with [`process.kill()`][], and [`subprocess.kill()`][]. Sending signal `0` can be used to test for the existence of a process. Sending `SIGINT`, `SIGTERM`, and `SIGKILL` cause the unconditional termination of the target process.

## `process.abort()`
<!-- YAML
added: v0.7.0
-->

El método `process.abort()` causa que el proceso Node.js se cierre inmediatamente y genere un archivo core.

This feature is not available in [`Worker`][] threads.

## `process.allowedNodeEnvironmentFlags`
<!-- YAML
added: v10.10.0
-->

* {Set}

The `process.allowedNodeEnvironmentFlags` property is a special, read-only `Set` of flags allowable within the [`NODE_OPTIONS`][] environment variable.

`process.allowedNodeEnvironmentFlags` extends `Set`, but overrides `Set.prototype.has` to recognize several different possible flag representations.  `process.allowedNodeEnvironmentFlags.has()` will return `true` in the following cases:

* Flags may omit leading single (`-`) or double (`--`) dashes; e.g., `inspect-brk` for `--inspect-brk`, or `r` for `-r`.
* Flags passed through to V8 (as listed in `--v8-options`) may replace one or more *non-leading* dashes for an underscore, or vice-versa; e.g., `--perf_basic_prof`, `--perf-basic-prof`, `--perf_basic-prof`, etc.
* Flags may contain one or more equals (`=`) characters; all characters after and including the first equals will be ignored; e.g., `--stack-trace-limit=100`.
* Flags *must* be allowable within [`NODE_OPTIONS`][].

When iterating over `process.allowedNodeEnvironmentFlags`, flags will appear only *once*; each will begin with one or more dashes. Flags passed through to V8 will contain underscores instead of non-leading dashes:

```js
process.allowedNodeEnvironmentFlags.forEach((flag) => {
  // -r
  // --inspect-brk
  // --abort_on_uncaught_exception
  // ...
});
```

The methods `add()`, `clear()`, and `delete()` of `process.allowedNodeEnvironmentFlags` do nothing, and will fail silently.

If Node.js was compiled *without* [`NODE_OPTIONS`][] support (shown in [`process.config`][]), `process.allowedNodeEnvironmentFlags` will contain what *would have* been allowable.

## `process.arch`
<!-- YAML
added: v0.5.0
-->

* {string}

The operating system CPU architecture for which the Node.js binary was compiled. Possible values are: `'arm'`, `'arm64'`, `'ia32'`, `'mips'`,`'mipsel'`, `'ppc'`, `'ppc64'`, `'s390'`, `'s390x'`, `'x32'`, and `'x64'`.

```js
console.log(`This processor architecture is ${process.arch}`);
```

## `process.argv`
<!-- YAML
added: v0.1.27
-->

* {string[]}

La propiedad `process.argv` devuelve un arreglo que contiene los argumentos de la línea de comandos pasados cuando el proceso Node.js se inició. The first element will be [`process.execPath`][]. See `process.argv0` if access to the original value of `argv[0]` is needed. El segundo elemento será la ruta al archivo de JavaScript que está siendo ejecutado. Los elementos restantes serán argumentos de línea de comandos adicionales cualesquiera.

Por ejemplo, asumiendo el siguiente script para `process-args.js`:

```js
// imprime process.argv
process.argv.forEach((val, index) => {
  console.log(`${index}: ${val}`);
});
```

Iniciar el proceso Node.js como:

```console
$ node process-args.js one two=three four
```

Generará la salida:

```text
0: /usr/local/bin/node
1: /Users/mjr/work/node/process-args.js
2: one
3: two=three
4: four
```

## `process.argv0`
<!-- YAML
added: v6.4.0
-->

* {string}

La propiedad `process.argv0` almacena una copia de solo lectura del valor original de `argv[0]` pasado cuando Node.js inicia.

```console
$ bash -c 'exec -a customArgv0 ./node'
> process.argv[0]
'/Volumes/code/external/node/out/Release/node'
> process.argv0
'customArgv0'
```

## `process.channel`
<!-- YAML
added: v7.1.0
-->

* {Object}

If the Node.js process was spawned with an IPC channel (see the [Child Process](child_process.html) documentation), the `process.channel` property is a reference to the IPC channel. If no IPC channel exists, this property is `undefined`.

## `process.chdir(directory)`
<!-- YAML
added: v0.1.17
-->

* `directory` {string}

El método `process.chdir()` cambia el directorio de trabajo actual del proceso Node.js o arroja una excepción si se falla al realizarlo (por ejemplo, si el `directory` especificado no existe).

```js
console.log(`Starting directory: ${process.cwd()}`);
try {
  process.chdir('/tmp');
  console.log(`New directory: ${process.cwd()}`);
} catch (err) {
  console.error(`chdir: ${err}`);
}
```

This feature is not available in [`Worker`][] threads.

## `process.config`
<!-- YAML
added: v0.7.7
-->

* {Object}

The `process.config` property returns an `Object` containing the JavaScript representation of the configure options used to compile the current Node.js executable. Esto es igual que el archivo `config.gypi` que fue producido al ejecutar el script `./configure`.

Un ejemplo del posible output luce así:
```js
{
  target_defaults:
   { cflags: [],
     default_configuration: 'Release',
     defines: [],
     include_dirs: [],
     libraries: [] },
  variables:
   {
     host_arch: 'x64',
     napi_build_version: 5,
     node_install_npm: 'true',
     node_prefix: '',
     node_shared_cares: 'false',
     node_shared_http_parser: 'false',
     node_shared_libuv: 'false',
     node_shared_zlib: 'false',
     node_use_dtrace: 'false',
     node_use_openssl: 'true',
     node_shared_openssl: 'false',
     strict_aliasing: 'true',
     target_arch: 'x64',
     v8_use_snapshot: 1
   }
}
```

The `process.config` property is **not** read-only and there are existing modules in the ecosystem that are known to extend, modify, or entirely replace the value of `process.config`.

## `process.connected`<!-- YAML
added: v0.7.2
-->* {boolean}

Si el proceso Node.js se genera con un canal IPC (ver la documentación de [Procesos Secundarios](child_process.html) y de [Cluster](cluster.html)), la propiedad `process.connected` devolverá `true` siempre que el canal IPC esté conectado y devolverá `false` después de que `process.disconnect()` es llamada.

Una vez que `process.connected` es `false`, ya no es posible enviar mensajes sobre el canal IPC utilizando `process.send()`.

## `process.cpuUsage([previousValue])`<!-- YAML
added: v6.1.0
-->* `previousValue` {Object} Un valor de retorno previo a llamar a `process.cpuUsage()`
* Devuelve: {Object}
  * `user` {integer}
  * `system` {integer}

El método `process.cpuUsage()` devuelve al usuario y al CPU del sistema el tiempo de uso del proceso actual, en un objeto con las propiedades `user` y `system`, cuyos valores son valores de microsegundos (millonésima de segundo). Estos valores miden el tiempo empleado en usuario y en código de sistema respectivamente, y pueden llegar a ser mayores que el tiempo real transcurrido si múltiples núcleos de CPU están realizando el trabajo para este proceso.

El resultado de una llamada previa a `process.cpuUsage()` puede ser pasado como un argumento de la función, para obtener una lectura diferente.

```js
const startUsage = process.cpuUsage();
// { user: 38579, system: 6986 }

// gire el CPU por 500 milisegundos
const now = Date.now();
while (Date.now() - now < 500);

console.log(process.cpuUsage(startUsage));
// { user: 514883, system: 11226 }
```

## `process.cwd()`<!-- YAML
added: v0.1.8
-->* Devuelve: {string}

El método `process.cwd()` devuelve el directorio de trabajo actual del proceso Node.js.

```js
console.log(`Current directory: ${process.cwd()}`);
```

## `process.debugPort`<!-- YAML
added: v0.7.2
-->* {number}

El puerto usado por el depurador de Node.js cuando está habilitado.

```js
process.debugPort = 5858;
```

## `process.disconnect()`
<!-- YAML
added: v0.7.2
-->

Si el proceso Node.js es generado con un canal IPC (vea la documentación del [Proceso Secundario](child_process.html) y de [Cluster](cluster.html)), el método `process.disconnect()` cerrará el canal IPC para el proceso primario, permitiendo que el proceso secundario se cierre con gracia una vez no haya ninguna otra conexión que lo mantenga con vida.

The effect of calling `process.disconnect()` is the same as calling [`ChildProcess.disconnect()`][] from the parent process.

Si el proceso Node.js no fue generado con un canal IPC, `process.disconnect()` será `undefined`.

## `process.dlopen(module, filename[, flags])`<!-- YAML
added: v0.1.16
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/12794
    description: Added support for the `flags` argument.
-->* `module` {Object}
* `filename` {string}
* `flags` {os.constants.dlopen} **Default:** `os.constants.dlopen.RTLD_LAZY`

The `process.dlopen()` method allows to dynamically load shared objects. It is primarily used by `require()` to load C++ Addons, and should not be used directly, except in special cases. In other words, [`require()`][] should be preferred over `process.dlopen()`, unless there are specific reasons.

The `flags` argument is an integer that allows to specify dlopen behavior. See the [`os.constants.dlopen`][] documentation for details.

If there are specific reasons to use `process.dlopen()` (for instance, to specify dlopen flags), it's often useful to use [`require.resolve()`][] to look up the module's path.

An important drawback when calling `process.dlopen()` is that the `module` instance must be passed. Functions exported by the C++ Addon will be accessible via `module.exports`.

The example below shows how to load a C++ Addon, named as `binding`, that exports a `foo` function. All the symbols will be loaded before the call returns, by passing the `RTLD_NOW` constant. In this example the constant is assumed to be available.

```js
const os = require('os');
process.dlopen(module, require.resolve('binding'),
               os.constants.dlopen.RTLD_NOW);
module.exports.foo();
```

## `process.emitWarning(warning[, options])`<!-- YAML
added: v8.0.0
-->* `warning` {string|Error} La advertencia a emitir.
* `options` {Object}
  * `type` {string} When `warning` is a `String`, `type` is the name to use for the *type* of warning being emitted. **Default:** `'Warning'`.
  * `code` {string} Un identificador único para la instancia de la advertencia que se emite.
  * `ctor` {Function} When `warning` is a `String`, `ctor` is an optional function used to limit the generated stack trace. **Default:** `process.emitWarning`.
  * `detail` {string} Texto adicional a incluir con el error.

El método `process.emitWarning()` puede ser utilizado para emitir advertencias de proceso personalizadas o específicas de aplicación. These can be listened for by adding a handler to the [`'warning'`](#process_event_warning) event.

```js
// Emitir una advertencia con un código y un detalle adicional.
process.emitWarning('Something happened!', {
  code: 'MY_WARNING',
  detail: 'This is some additional information'
});
// Emite:
// (node:56338) [MY_WARNING] Advertencia: Something happened!
// Esta es una información adicional
```

In this example, an `Error` object is generated internally by `process.emitWarning()` and passed through to the [`'warning'`](#process_event_warning) handler.

```js
process.on('warning', (warning) => {
  console.warn(warning.name);    // 'Warning'
  console.warn(warning.message); // 'Something happened!'
  console.warn(warning.code);    // 'MY_WARNING'
  console.warn(warning.stack);   // Stack trace
  console.warn(warning.detail);  // 'This is some additional information'
});
```

If `warning` is passed as an `Error` object, the `options` argument is ignored.

## `process.emitWarning(warning[, type[, code]][, ctor])`<!-- YAML
added: v6.0.0
-->* `warning` {string|Error} La advertencia a emitir.
* `type` {string} When `warning` is a `String`, `type` is the name to use for the *type* of warning being emitted. **Default:** `'Warning'`.
* `code` {string} Un identificador único para la instancia de la advertencia que se emite.
* `ctor` {Function} When `warning` is a `String`, `ctor` is an optional function used to limit the generated stack trace. **Default:** `process.emitWarning`.

El método `process.emitWarning()` puede ser utilizado para emitir advertencias de proceso personalizadas o específicas de aplicación. These can be listened for by adding a handler to the [`'warning'`](#process_event_warning) event.

```js
// Emitir una advertencia utilizando una string.
process.emitWarning('Something happened!');
// Emite: (node: 56338) Warning: Something happened!
```

```js
// Emitir una advertencia utilizando una string y un tipo.
process.emitWarning('Something Happened!', 'CustomWarning');
// Emite: (node:56338) CustomWarning: Something Happened!
```

```js
process.emitWarning('Something happened!', 'CustomWarning', 'WARN001');
// Emite: (node:56338) [WARN001] CustomWarning: Something happened!
```

In each of the previous examples, an `Error` object is generated internally by `process.emitWarning()` and passed through to the [`'warning'`](#process_event_warning) handler.

```js
process.on('warning', (warning) => {
  console.warn(warning.name);
  console.warn(warning.message);
  console.warn(warning.code);
  console.warn(warning.stack);
});
```

If `warning` is passed as an `Error` object, it will be passed through to the `'warning'` event handler unmodified (and the optional `type`, `code` and `ctor` arguments will be ignored):

```js
// Emitir una advertencia utilizando un objeto Error.
const myWarning = new Error('Something happened!');
// Utilizar la propiedad de nombre Error para especificar el nombre del tipo
myWarning.name = 'CustomWarning';
myWarning.code = 'WARN001';

process.emitWarning(myWarning);
// Emite: (node:56338) [WARN001] CustomWarning: Something happened!
```

Un `TypeError` es arrojado si `warning` es algo distinto a una string o un objeto `Error`.

While process warnings use `Error` objects, the process warning mechanism is **not** a replacement for normal error handling mechanisms.

The following additional handling is implemented if the warning `type` is `'DeprecationWarning'`:

* Si la bandera de línea de comandos `--throw-deprecation` es utilizada, la advertencia de desaprobación es arrojada como una excepción en lugar de ser emitida como un evento.
* Si la bandera de línea de comandos `--no-deprecation` es utilizada, la advertencia de desaprobación es suprimida.
* Si la bandera de línea de comandos `--trace-deprecation` es utilizada, la advertencia de desaprobación es impresa en `stderr` en conjunto con el stack trace completo.

### Evitar advertencias duplicadas

Como buena práctica, las advertencias deben ser emitidas una sola vez por proceso. Para hacerlo, es recomendado colocar la advertencia `emitWarning()` detrás de una bandera booleana simple, como se ilustra en el siguiente ejemplo:

```js
function emitMyWarning() {
  if (!emitMyWarning.warned) {
    emitMyWarning.warned = true;
    process.emitWarning('Only warn once!');
  }
}
emitMyWarning();
// Emite: (node: 56339) Warning: Only warn once!
emitMyWarning();
// No emite nada
```

## `process.env`<!-- YAML
added: v0.1.27
changes:
  - version: v11.14.0
    pr-url: https://github.com/nodejs/node/pull/26544
    description: Worker threads will now use a copy of the parent thread’s
                 `process.env` by default, configurable through the `env`
                 option of the `Worker` constructor.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18990
    description: Implicit conversion of variable value to string is deprecated.
-->* {Object}

La propiedad `process.env` devuelve un objeto que contiene el entorno del usuario. Ver environ(7).

Un ejemplo de este objeto luce así:
```js
{
  TERM: 'xterm-256color',
  SHELL: '/usr/local/bin/bash',
  USER: 'maciej',
  PATH: '~/.bin/:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin',
  PWD: '/Users/maciej',
  EDITOR: 'vim',
  SHLVL: '1',
  HOME: '/Users/maciej',
  LOGNAME: 'maciej',
  _: '/usr/local/bin/node'
}
```

It is possible to modify this object, but such modifications will not be reflected outside the Node.js process, or (unless explicitly requested) to other [`Worker`][] threads. In other words, the following example would not work:

```console
$ node -e 'process.env.foo = "bar"' && echo $foo
```

Mientras que el siguiente será:

```js
process.env.foo = 'bar';
console.log(process.env.foo);
```

Asignar una propiedad en `process.env` convertirá implícitamente el valor a una string. **This behavior is deprecated.** Future versions of Node.js may throw an error when the value is not a string, number, or boolean.

```js
process.env.test = null;
console.log(process.env.test);
// => 'null'
process.env.test = undefined;
console.log(process.env.test);
// => 'undefined'
```

Utilizar `delete` para eliminar una propiedad de `process.env`.

```js
process.env.TEST = 1;
delete process.env.TEST;
console.log(process.env.TEST);
// => undefined
```

En sistemas operativos Windows, las variables de entorno no distinguen entre mayúsculas y minúsculas.

```js
process.env.TEST = 1;
console.log(process.env.test);
// => 1
```

Unless explicitly specified when creating a [`Worker`][] instance, each [`Worker`][] thread has its own copy of `process.env`, based on its parent thread’s `process.env`, or whatever was specified as the `env` option to the [`Worker`][] constructor. Changes to `process.env` will not be visible across [`Worker`][] threads, and only the main thread can make changes that are visible to the operating system or to native add-ons.

## `process.execArgv`<!-- YAML
added: v0.7.7
-->* {string[]}

La propiedad `process.execArgv` devuelve el conjunto de opciones de línea de comandos específicas de Node.js pasadas cuando el proceso Node.js fue lanzado. Estas opciones no aparecen en el arreglo devuelto por la propiedad [`process.argv`][], y no incluyen el ejecutable de Node.js, el nombre del script, o cualquier opción que sigua al nombre del script. Estas opciones son útiles para generar procesos secundarios con el mismo entorno de ejecución que el proceso primario.

```console
$ node --harmony script.js --version
```

Resulta en `process.execArgv`:
```js
['--harmony']
```

Y `process.argv`:
```js
['/usr/local/bin/node', 'script.js', '--version']
```

## `process.execPath`<!-- YAML
added: v0.1.100
-->* {string}

La propiedad `process.execPath` devuelve el nombre de ruta absoluto del ejecutable que inició el proceso Node.js.
```js
'/usr/local/bin/node'
```

## `process.exit([code])`<!-- YAML
added: v0.1.13
-->* `code` {integer} El código de salida. **Default:** `0`.

El método `process.exit()` indica a Node.js que finalice el proceso de forma sincrónica con un estado de salida de `code`. Si `code` es omitido, la salida utiliza el código de 'success' `0` o el valor de `process.exitCode` si ha sido establecido. Node.js will not terminate until all the [`'exit'`][] event listeners are called.

Para salir con un código de 'failure':

```js
process.exit(1);
```

El shell que ejecutó Node.js debe ver el código de salida como `1`.

Calling `process.exit()` will force the process to exit as quickly as possible even if there are still asynchronous operations pending that have not yet completed fully, including I/O operations to `process.stdout` and `process.stderr`.

En la mayoría de las situaciones, no es realmente necesario llamar a `process.exit()` explícitamente. The Node.js process will exit on its own *if there is no additional work pending* in the event loop. La propiedad `process.exitCode` puede establecerse para decirle al proceso cuál es el código de salida a utilizar cuando el proceso se cierre de forma exitosa.

For instance, the following example illustrates a *misuse* of the `process.exit()` method that could lead to data printed to stdout being truncated and lost:

```js
// Este es un ejempo de lo que *no* se debe hacer:
if (someConditionNotMet()) {
  printUsageToStdout();
  process.exit(1);
}
```

The reason this is problematic is because writes to `process.stdout` in Node.js are sometimes *asynchronous* and may occur over multiple ticks of the Node.js event loop. Calling `process.exit()`, however, forces the process to exit *before* those additional writes to `stdout` can be performed.

Rather than calling `process.exit()` directly, the code *should* set the `process.exitCode` and allow the process to exit naturally by avoiding scheduling any additional work for the event loop:

```js
// Cómo establecer apropiadamente el código de salida, dejando 
// que el proceso se cierre exitosamente.
if (someConditionNotMet()) {
  printUsageToStdout();
  process.exitCode = 1;
}
```

If it is necessary to terminate the Node.js process due to an error condition, throwing an *uncaught* error and allowing the process to terminate accordingly is safer than calling `process.exit()`.

In [`Worker`][] threads, this function stops the current thread rather than the current process.

## `process.exitCode`<!-- YAML
added: v0.11.8
-->* {integer}

Un número que será el código de salida del proceso, cuando el proceso se cierre exitosamente, o se cierre a través de [`process.exit()`][] sin especificar un código.

Especificar un código a [`process.exit(code)`][`process.exit()`] anulará cualquier configuración previa de `process.exitCode`.

## `process.getegid()`<!-- YAML
added: v2.0.0
-->El método `process.getegid()` devuelve la identidad numérica efectiva del grupo del proceso Node.js. (Ver getegid(2).)

```js
if (process.getegid) {
  console.log(`Current gid: ${process.getegid()}`);
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android).

## `process.geteuid()`<!-- YAML
added: v2.0.0
-->* Devuelve: {Object}

El método `process.geteuid()` devuelve la identidad numérica efectiva del usuario del proceso. (Ver geteuid(2).)

```js
if (process.geteuid) {
  console.log(`Current uid: ${process.geteuid()}`);
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android).

## `process.getgid()`<!-- YAML
added: v0.1.31
-->* Devuelve: {Object}

El método `process.getgid()` devuelve la identidad numérica efectiva del grupo del proceso. (Ver getgid(2).)

```js
if (process.getgid) {
  console.log(`Current gid: ${process.getgid()}`);
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android).

## `process.getgroups()`<!-- YAML
added: v0.9.4
-->* Devuelve: {integer[]}

El método `process.getgroups()` devuelve un arreglo con los IDs de grupo suplementarios. POSIX lo deja sin especificar si el ID efectivo del grupo es incluido, pero Node.js asegura que siempre lo está.

This function is only available on POSIX platforms (i.e. not Windows or Android).

## `process.getuid()`<!-- YAML
added: v0.1.28
-->* Devuelve: {integer}

El método `process.getuid()` devuelve la identidad numérica efectiva de usuario del proceso. (Ver getuid(2).)

```js
if (process.getuid) {
  console.log(`Current uid: ${process.getuid()}`);
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android).

## `process.hasUncaughtExceptionCaptureCallback()`<!-- YAML
added: v9.3.0
-->* Devuelve: {boolean}

Indicates whether a callback has been set using [`process.setUncaughtExceptionCaptureCallback()`][].

## `process.hrtime([time])`<!-- YAML
added: v0.7.6
-->* `time` {integer[]} The result of a previous call to `process.hrtime()`
* Devuelve: {integer[]}

This is the legacy version of [`process.hrtime.bigint()`][] before `bigint` was introduced in JavaScript.

The `process.hrtime()` method returns the current high-resolution real time in a `[seconds, nanoseconds]` tuple `Array`, where `nanoseconds` is the remaining part of the real time that can't be represented in second precision.

`time` is an optional parameter that must be the result of a previous `process.hrtime()` call to diff with the current time. If the parameter passed in is not a tuple `Array`, a `TypeError` will be thrown. Passing in a user-defined array instead of the result of a previous call to `process.hrtime()` will lead to undefined behavior.

Estos tiempos son relativos a un tiempo arbitrario en el pasado, y no están relacionados a las horas del día y, por lo tanto, no están sujetos a la deriva del reloj. El uso principal es para medir el rendimiento entre los intervalos:

```js
const NS_PER_SEC = 1e9;
const time = process.hrtime();
// [ 1800216, 25 ]

setTimeout(() => {
  const diff = process.hrtime(time);
  // [ 1, 552 ]

  console.log(`Benchmark took ${diff[0] * NS_PER_SEC + diff[1]} nanoseconds`);
  // Benchmark took 1000000552 nanoseconds
}, 1000);
```

## `process.hrtime.bigint()`<!-- YAML
added: v10.7.0
-->* Returns: {bigint}

The `bigint` version of the [`process.hrtime()`][] method returning the current high-resolution real time in nanoseconds as a `bigint`.

Unlike [`process.hrtime()`][], it does not support an additional `time` argument since the difference can just be computed directly by subtraction of the two `bigint`s.

```js
const start = process.hrtime.bigint();
// 191051479007711n

setTimeout(() => {
  const end = process.hrtime.bigint();
  // 191052633396993n

  console.log(`Benchmark took ${end - start} nanoseconds`);
  // Benchmark took 1154389282 nanoseconds
}, 1000);
```

## `process.initgroups(user, extraGroup)`
<!-- YAML
added: v0.9.4
-->

* `user` {string|number} El nombre de usuario o identificador numérico.
* `extraGroup` {string|number} A group name or numeric identifier.

El método `process.initgroups()` lee el archivo `/etc/group` e inicializa la lista de acceso de grupo, utilizando todos los grupos en los cuales el usuario es miembro. Esta es una operación privilegiada que requiere que el proceso Node.js tenga acceso a `root` o la capacidad `CAP_SETGID`.

Use care when dropping privileges:

```js
console.log(process.getgroups());         // [ 0 ]
process.initgroups('bnoordhuis', 1000);   // cambia el usuario
console.log(process.getgroups());         // [ 27, 30, 46, 1000, 0 ]
process.setgid(1000);                     // elimina el gid del root
console.log(process.getgroups());         // [ 27, 30, 46, 1000 ]
```

This function is only available on POSIX platforms (i.e. not Windows or Android). This feature is not available in [`Worker`][] threads.

## `process.kill(pid[, signal])`<!-- YAML
added: v0.0.6
-->* `pid` {number} Un ID de proceso
* `signal` {string|number} La señal a enviar, como una string o un número. **Default:** `'SIGTERM'`.

El método `process.kill()` envía la `signal` al proceso identificado por `pid`.

Los nombres de las señales son strings tales como `'SIGINT'` o `'SIGHUP'`. Ver [Eventos de Senal](#process_signal_events) y kill(2) para mayor información.

Este método arrojará un error si el `pid` objetivo no existe. Como un caso especial, una señal de `0` puede ser utilizada para probar la existencia de un proceso. Las plataformas Windows arrojarán un error si el `pid` es utilizado para matar un grupo de procesos.

Even though the name of this function is `process.kill()`, it is really just a signal sender, like the `kill` system call. The signal sent may do something other than kill the target process.

```js
process.on('SIGHUP', () => {
  console.log('Got SIGHUP signal.');
});

setTimeout(() => {
  console.log('Exiting.');
  process.exit(0);
}, 100);

process.kill(process.pid, 'SIGHUP');
```

When `SIGUSR1` is received by a Node.js process, Node.js will start the debugger. See [Signal Events](#process_signal_events).

## `process.mainModule`<!-- YAML
added: v0.1.17
-->* {Object}

La propiedad `process.mainModule` proporciona una manera alternativa de recuperar [`require.main`][]. La diferencia es que si el módulo principal cambia en tiempo de ejecución, [`require.main`][] aún puede referirse al módulo principal original en los módulos que se requerían antes de que ocurriera el cambio. Generalmente, es seguro asumir que ambos se refieren al mismo módulo.

Al igual que con [`require.main`][], `process.mainModule` será `undefined` si no hay un script de entrada.

## `process.memoryUsage()`<!-- YAML
added: v0.1.16
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9587
    description: Added `external` to the returned object.
-->* Devuelve: {Object}
  * `rss` {integer}
  * `heapTotal` {integer}
  * `heapUsed` {integer}
  * `external` {integer}

El método `process.memoryUsage()` devuelve un objeto que describe el uso de la memoria del proceso Node.js medido en bytes.

Por ejemplo, el código:

```js
console.log(process.memoryUsage());
```

Generará:
```js
{
  rss: 4935680,
  heapTotal: 1826816,
  heapUsed: 650472,
  external: 49879
}
```

`heapTotal` y `heapUsed` se refieren al uso de memoria de V8. `external` se refiere al uso de memoria de objetos C++ vinculados a objetos JavaScript administrados por V8. `rss`, Resident Set Size, is the amount of space occupied in the main memory device (that is a subset of the total allocated memory) for the process, which includes the _heap_, _code segment_ and _stack_.

The _heap_ is where objects, strings, and closures are stored. Variables are stored in the _stack_ and the actual JavaScript code resides in the _code segment_.

When using [`Worker`][] threads, `rss` will be a value that is valid for the entire process, while the other fields will only refer to the current thread.

## `process.nextTick(callback[, ...args])`<!-- YAML
added: v0.1.26
changes:
  - version: v1.8.1
    pr-url: https://github.com/nodejs/node/pull/1077
    description: Additional arguments after `callback` are now supported.
-->* `callback` {Function}
* `...args` {any} Argumentos adicionales a pasar al invocar el `callback`

`process.nextTick()` adds `callback` to the "next tick queue". This queue is fully drained after the current operation on the JavaScript stack runs to completion and before the event loop is allowed to continue. It's possible to create an infinite loop if one were to recursively call `process.nextTick()`. See the [Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/#process-nexttick) guide for more background.

```js
console.log('start');
process.nextTick(() => {
  console.log('nextTick callback');
});
console.log('scheduled');
// Salida:
// inicio
// programado
// callback nextTick
```

This is important when developing APIs in order to give users the opportunity to assign event handlers *after* an object has been constructed but before any I/O has occurred:

```js
function MyThing(options) {
  this.setupOptions(options);

  process.nextTick(() => {
    this.startDoingStuff();
  });
}

const thing = new MyThing();
thing.getReadyForStuff();

// thing.startDoingStuff() se llama ahora, no antes.
```

Es muy importante para las APIs ser 100% sincrónicas o 100% asíncronas. Considere este ejemplo:

```js
// ¡ADVERTENCIA!  ¡NO UTILIZAR!  ¡MALO, INSEGURO, PELIGROSO!
function maybeSync(arg, cb) {
  if (arg) {
    cb();
    return;
  }

  fs.stat('file', cb);
}
```

Esta API es peligrosa porque en el siguiente caso:

```js
const maybeTrue = Math.random() > 0.5;

maybeSync(maybeTrue, () => {
  foo();
});

bar();
```

No está claro si primero se llamará a `foo()` o a `bar()`.

El siguiente enfoque es mucho mejor:

```js
function definitelyAsync(arg, cb) {
  if (arg) {
    process.nextTick(cb);
    return;
  }

  fs.stat('file', cb);
}
```

## `process.noDeprecation`<!-- YAML
added: v0.8.0
-->* {boolean}

La propiedad `process.noDeprecation` indica si la bandera `--no-deprecation` está establecida en el proceso Node.js actual. See the documentation for the [`'warning'` event](#process_event_warning) and the [`emitWarning()` method](#process_process_emitwarning_warning_type_code_ctor) for more information about this flag's behavior.

## `process.pid`<!-- YAML
added: v0.1.15
-->* {integer}

La propiedad `process.pid` devuelve el PID del proceso.

```js
console.log(`This process is pid ${process.pid}`);
```

## `process.platform`<!-- YAML
added: v0.1.16
-->* {string}

La propiedad `process.platform` devuelve una string que identifica la plataforma del sistema operativo en el cual se está ejecutando el proceso Node.js.

Los valores posibles son actualmente:

* `'aix'`
* `'darwin'`
* `'freebsd'`
* `'linux'`
* `'openbsd'`
* `'sunos'`
* `'win32'`

```js
console.log(`This platform is ${process.platform}`);
```

The value `'android'` may also be returned if the Node.js is built on the Android operating system. However, Android support in Node.js [is experimental](https://github.com/nodejs/node/blob/master/BUILDING.md#androidandroid-based-devices-eg-firefox-os).

## `process.ppid`<!-- YAML
added:
  - v9.2.0
  - v8.10.0
  - v6.13.0
-->* {integer}

La propiedad `process.ppid` devuelve el PID del proceso primario actual.

```js
console.log(`The parent process is pid ${process.ppid}`);
```

## `process.release`<!-- YAML
added: v3.0.0
changes:
  - version: v4.2.0
    pr-url: https://github.com/nodejs/node/pull/3212
    description: The `lts` property is now supported.
-->* {Object}

The `process.release` property returns an `Object` containing metadata related to the current release, including URLs for the source tarball and headers-only tarball.

`process.release` contiene las siguientes propiedades:

* `name` {string} Un valor que siempre será `'node'` para Node.js. Para versiones legacy io.js, este será `'io.js'`.
* `sourceUrl` {string} an absolute URL pointing to a _`.tar.gz`_ file containing the source code of the current release.
* `headersUrl`{string} an absolute URL pointing to a _`.tar.gz`_ file containing only the source header files for the current release. Este archivo es significativamente más pequeño que el archivo fuente completo y puede ser utilizado para compilar los complementos nativos de Node.js.
* `libUrl` {string} an absolute URL pointing to a _`node.lib`_ file matching the architecture and version of the current release. Este archivo es utilizado para compilar complementos nativos de Node.js. _This property is only present on Windows builds of Node.js and will be missing on all other platforms._
* `lts` {string} a string label identifying the [LTS](https://github.com/nodejs/Release) label for this release. This property only exists for LTS releases and is `undefined` for all other release types, including _Current_ releases. Actualmente, lo valores válidos son:
  * `'Argon'` para la línea LTS 4.x que comienza con 4.2.0.
  * `'Boron'` para la línea LTS 6.x que comienza con 6.9.0.
  * `'Carbon'` para la línea LTS 8.x que comienza con 8.9.1.
```js
{
  name: 'node',
  lts: 'Argon',
  sourceUrl: 'https://nodejs.org/download/release/v4.4.5/node-v4.4.5.tar.gz',
  headersUrl: 'https://nodejs.org/download/release/v4.4.5/node-v4.4.5-headers.tar.gz',
  libUrl: 'https://nodejs.org/download/release/v4.4.5/win-x64/node.lib'
}
```

En builds personalizados de versiones no lanzadas del árbol de origen, solo puede estar presente la propiedad `name`. No se debe confiar en que las propiedades adicionales existan.

## `process.report`<!-- YAML
added: v11.8.0
-->> Estabilidad: 1 - Experimental

* {Object}

`process.report` is an object whose methods are used to generate diagnostic reports for the current process. Additional documentation is available in the [report documentation](report.html).

### `process.report.directory`<!-- YAML
added: v11.12.0
-->> Estabilidad: 1 - Experimental

* {string}

Directory where the report is written. The default value is the empty string, indicating that reports are written to the current working directory of the Node.js process.

```js
console.log(`Report directory is ${process.report.directory}`);
```

### `process.report.filename`<!-- YAML
added: v11.12.0
-->> Estabilidad: 1 - Experimental

* {string}

Filename where the report is written. If set to the empty string, the output filename will be comprised of a timestamp, PID, and sequence number. The default value is the empty string.

```js
console.log(`Report filename is ${process.report.filename}`);
```

### `process.report.getReport([err])`<!-- YAML
added: v11.8.0
-->> Estabilidad: 1 - Experimental

* `err` {Error} A custom error used for reporting the JavaScript stack.
* Devuelve: {Object}

Returns a JavaScript Object representation of a diagnostic report for the running process. The report's JavaScript stack trace is taken from `err`, if present.

```js
const data = process.report.getReport();
console.log(data.header.nodeJsVersion);

// Similar to process.report.writeReport()
const fs = require('fs');
fs.writeFileSync(util.inspect(data), 'my-report.log', 'utf8');
```

Additional documentation is available in the [report documentation](report.html).

### `process.report.reportOnFatalError`<!-- YAML
added: v11.12.0
-->> Estabilidad: 1 - Experimental

* {boolean}

If `true`, a diagnostic report is generated on fatal errors, such as out of memory errors or failed C++ assertions.

```js
console.log(`Report on fatal error: ${process.report.reportOnFatalError}`);
```

### `process.report.reportOnSignal`<!-- YAML
added: v11.12.0
-->> Estabilidad: 1 - Experimental

* {boolean}

If `true`, a diagnostic report is generated when the process receives the signal specified by `process.report.signal`.

```js
console.log(`Report on signal: ${process.report.reportOnSignal}`);
```

### `process.report.reportOnUncaughtException`<!-- YAML
added: v11.12.0
-->> Estabilidad: 1 - Experimental

* {boolean}

If `true`, a diagnostic report is generated on uncaught exception.

```js
console.log(`Report on exception: ${process.report.reportOnUncaughtException}`);
```

### `process.report.signal`<!-- YAML
added: v11.12.0
-->> Estabilidad: 1 - Experimental

* {string}

The signal used to trigger the creation of a diagnostic report. Defaults to `'SIGUSR2'`.

```js
console.log(`Report signal: ${process.report.signal}`);
```

### `process.report.writeReport([filename][, err])`<!-- YAML
added: v11.8.0
-->> Estabilidad: 1 - Experimental

* `filename` {string} Name of the file where the report is written. This should be a relative path, that will be appended to the directory specified in `process.report.directory`, or the current working directory of the Node.js process, if unspecified.
* `err` {Error} A custom error used for reporting the JavaScript stack.

* Returns: {string} Returns the filename of the generated report.

Writes a diagnostic report to a file. If `filename` is not provided, the default filename includes the date, time, PID, and a sequence number. The report's JavaScript stack trace is taken from `err`, if present.

```js
process.report.writeReport();
```

Additional documentation is available in the [report documentation](report.html).

## `process.resourceUsage()`<!-- YAML
added: v12.6.0
-->* Returns: {Object} the resource usage for the current process. All of these values come from the `uv_getrusage` call which returns a [`uv_rusage_t` struct](http://docs.libuv.org/en/v1.x/misc.html#c.uv_rusage_t).
  * `userCPUTime` {integer} maps to `ru_utime` computed in microseconds. It is the same value as [`process.cpuUsage().user`](#process_process_cpuusage_previousvalue).
  * `systemCPUTime` {integer} maps to `ru_stime` computed in microseconds. It is the same value as [`process.cpuUsage().system`](#process_process_cpuusage_previousvalue).
  * `maxRSS` {integer} maps to `ru_maxrss` which is the maximum resident set size used in kilobytes.
  * `sharedMemorySize` {integer} maps to `ru_ixrss` but is not supported by any platform.
  * `unsharedDataSize` {integer} maps to `ru_idrss` but is not supported by any platform.
  * `unsharedStackSize` {integer} maps to `ru_isrss` but is not supported by any platform.
  * `minorPageFault` {integer} maps to `ru_minflt` which is the number of minor page faults for the process, see [this article for more details](https://en.wikipedia.org/wiki/Page_fault#Minor).
  * `majorPageFault` {integer} maps to `ru_majflt` which is the number of major page faults for the process, see [this article for more details](https://en.wikipedia.org/wiki/Page_fault#Major). This field is not supported on Windows.
  * `swappedOut` {integer} maps to `ru_nswap` but is not supported by any platform.
  * `fsRead` {integer} maps to `ru_inblock` which is the number of times the file system had to perform input.
  * `fsWrite` {integer} maps to `ru_oublock` which is the number of times the file system had to perform output.
  * `ipcSent` {integer} maps to `ru_msgsnd` but is not supported by any platform.
  * `ipcReceived` {integer} maps to `ru_msgrcv` but is not supported by any platform.
  * `signalsCount` {integer} maps to `ru_nsignals` but is not supported by any platform.
  * `voluntaryContextSwitches` {integer} maps to `ru_nvcsw` which is the number of times a CPU context switch resulted due to a process voluntarily giving up the processor before its time slice was completed (usually to await availability of a resource). This field is not supported on Windows.
  * `involuntaryContextSwitches` {integer} maps to `ru_nivcsw` which is the number of times a CPU context switch resulted due to a higher priority process becoming runnable or because the current process exceeded its time slice. This field is not supported on Windows.

```js
console.log(process.resourceUsage());
/*
  Will output:
  {
    userCPUTime: 82872,
    systemCPUTime: 4143,
    maxRSS: 33164,
    sharedMemorySize: 0,
    unsharedDataSize: 0,
    unsharedStackSize: 0,
    minorPageFault: 2469,
    majorPageFault: 0,
    swappedOut: 0,
    fsRead: 0,
    fsWrite: 8,
    ipcSent: 0,
    ipcReceived: 0,
    signalsCount: 0,
    voluntaryContextSwitches: 79,
    involuntaryContextSwitches: 1
  }
*/
```

## `process.send(message[, sendHandle[, options]][, callback])`<!-- YAML
added: v0.5.9
-->* `message` {Object}
* `sendHandle` {net.Server|net.Socket}
* `options` {Object} used to parameterize the sending of certain types of handles.`options` supports the following properties:
  * `keepOpen` {boolean} A value that can be used when passing instances of `net.Socket`. Cuando es `true`, la conexión se mantiene abierta en el proceso de envío. **Default:** `false`.
* `callback` {Function}
* Devuelve: {boolean}

Si Node.js se genera con un canal IPC, el método `process.send()` puede ser utilizado para enviar mensajes al proceso primario. Los mensajes serán recibidos como un evento [`'message'`][] en el objeto [`ChildProcess`][] del proceso primario.

If Node.js was not spawned with an IPC channel, `process.send` will be `undefined`.

El mensaje pasa a través de la serialización y análisis. The resulting message might not be the same as what is originally sent.

## `process.setegid(id)`<!-- YAML
added: v2.0.0
-->* `id` {string|number} Un nombre o ID de grupo

El método `process.setegid()` establece la identidad de grupo efectiva del proceso. (Ver setegid(2).) El `id` puede ser pasado como un ID numérico o como una string de nombre de grupo. Si un nombre de grupo es especificado, este método se bloquea mientras se resuelve el ID numérico asociado.

```js
if (process.getegid && process.setegid) {
  console.log(`Current gid: ${process.getegid()}`);
  try {
    process.setegid(501);
    console.log(`New gid: ${process.getegid()}`);
  } catch (err) {
    console.log(`Failed to set gid: ${err}`);
  }
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android). This feature is not available in [`Worker`][] threads.

## `process.seteuid(id)`<!-- YAML
added: v2.0.0
-->* `id` {string|number} Un nombre o ID de usuario

El método `process.seteuid()` establece el identificador de usuario efectivo del proceso. (Ver seteuid(2).) El `id` puede ser pasado como un ID numérico o una string de nombre de usuario. Si un nombre de usuario es especificado, el método se bloquea mientras resuelve el ID numérico asociado.

```js
if (process.geteuid && process.seteuid) {
  console.log(`Current uid: ${process.geteuid()}`);
  try {
    process.seteuid(501);
    console.log(`New uid: ${process.geteuid()}`);
  } catch (err) {
    console.log(`Failed to set uid: ${err}`);
  }
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android). This feature is not available in [`Worker`][] threads.

## `process.setgid(id)`<!-- YAML
added: v0.1.31
-->* `id` {string|number} El nombre o ID del grupo

El método `process.setgid()` establece la identidad del grupo del proceso. (Ver setgid(2).). El `id` puede ser pasado como un ID numérico o como un string de nombre de grupo. Si un nombre de grupo es especificado, este método se bloquea mientras se resuelve el ID numérico asociado.

```js
if (process.getgid && process.setgid) {
  console.log(`Current gid: ${process.getgid()}`);
  try {
    process.setgid(501);
    console.log(`New gid: ${process.getgid()}`);
  } catch (err) {
    console.log(`Failed to set gid: ${err}`);
  }
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android). This feature is not available in [`Worker`][] threads.

## `process.setgroups(groups)`<!-- YAML
added: v0.9.4
-->* `groups` {integer[]}

El método `process.setgroups()` establece los IDs de grupo suplementarios para el proceso Node.js. This is a privileged operation that requires the Node.js process to have `root` or the `CAP_SETGID` capability.

El arreglo `groups` puede contener IDs de grupo numéricos, nombres de grupo o ambos.

This function is only available on POSIX platforms (i.e. not Windows or Android). This feature is not available in [`Worker`][] threads.

## `process.setuid(id)`<!-- YAML
added: v0.1.28
-->* `id` {integer | string}

El método `process.setuid(id)` establece la identidad del usuario del proceso. (Ver seuid(2).) El `id` puede ser pasado como un ID numérico o como un string de nombre de usuario. Si un nombre de usuario es especificado, el método se bloquea mientras se resuelve el ID numérico asociado.

```js
if (process.getuid && process.setuid) {
  console.log(`Current uid: ${process.getuid()}`);
  try {
    process.setuid(501);
    console.log(`New uid: ${process.getuid()}`);
  } catch (err) {
    console.log(`Failed to set uid: ${err}`);
  }
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android). This feature is not available in [`Worker`][] threads.

## `process.setUncaughtExceptionCaptureCallback(fn)`<!-- YAML
added: v9.3.0
-->* `fn` {Function|null}

The `process.setUncaughtExceptionCaptureCallback()` function sets a function that will be invoked when an uncaught exception occurs, which will receive the exception value itself as its first argument.

If such a function is set, the [`'uncaughtException'`][] event will not be emitted. If `--abort-on-uncaught-exception` was passed from the command line or set through [`v8.setFlagsFromString()`][], the process will not abort.

To unset the capture function, `process.setUncaughtExceptionCaptureCallback(null)` may be used. Calling this method with a non-`null` argument while another capture function is set will throw an error.

Using this function is mutually exclusive with using the deprecated [`domain`][] built-in module.

## `process.stderr`

* {Stream}

La propiedad `process.stderr` devuelve un stream conectado a `stderr` (descriptor de archivo `2`). Es un [`net.Socket`][] (el cual es un stream [Dúplex](stream.html#stream_duplex_and_transform_streams)) a menos que el descriptor de archivo `2` haga referencia a un archivo, en cuyo caso es un stream [Esribible](stream.html#stream_writable_streams).

`process.stderr` differs from other Node.js streams in important ways. See [note on process I/O](process.html#process_a_note_on_process_i_o) for more information.

## `process.stdin`

* {Stream}

La propiedad `process.stdin` devuelve un stream conectado a `stdin` (descriptor de archivo `0`). Es un [`net.Socket`][] (el cual es un stream [Dúplex](stream.html#stream_duplex_and_transform_streams)) a menos que el descriptor de archivo `0` haga referencia a un archivo, en cuyo caso es un stream [Legible](stream.html#stream_readable_streams).

```js
process.stdin.setEncoding('utf8');

process.stdin.on('readable', () => {
  let chunk;
  // Use a loop to make sure we read all available data.
  while ((chunk = process.stdin.read()) !== null) {
    process.stdout.write(`data: ${chunk}`);
  }
});

process.stdin.on('end', () => {
  process.stdout.write('end');
});
```

Como un stream [Dúplex](stream.html#stream_duplex_and_transform_streams), `process.stdin` también puede ser utilizado en el modo "antiguo" que es compatible con scripts escritos para Node.js anterior a la v0.10. Para más información ver [Compatibilidad de stream](stream.html#stream_compatibility_with_older_node_js_versions).

In "old" streams mode the `stdin` stream is paused by default, so one must call `process.stdin.resume()` to read from it. Note que el llamar a `process.stdin.resume()` también cambiaría el stream al modo "antiguo".

## `process.stdout`

* {Stream}

La propiedad `process.stdout` devuelve un stream conectado a `stdout` (descriptor de archivo `1`). Es un [`net.Socket`][] (el cual es un stream [Dúplex](stream.html#stream_duplex_and_transform_streams)) a menos que el descriptor de archivo `1` haga referencia a un archivo, en cuyo caso es un stream [Escribible](stream.html#stream_writable_streams).

For example, to copy `process.stdin` to `process.stdout`:

```js
process.stdin.pipe(process.stdout);
```

`process.stdout` differs from other Node.js streams in important ways. See [note on process I/O](process.html#process_a_note_on_process_i_o) for more information.

### Una nota sobre I/O de procesos

`process.stdout` y `process.stderr` difieren de otros streams de Node.js d maneras importantes:

1. Son utilizadas internamente por [`console.log()`][] y [`console.error()`][], respectivamente.
2. Las escrituras pueden ser sincrónicas, dependiendo de a qué esté conectado el stream y si el sistema es Windows o POSIX:
   * Files: *synchronous* on Windows and POSIX
   * TTYs (Terminals): *asynchronous* on Windows, *synchronous* on POSIX
   * Pipes (and sockets): *synchronous* on Windows, *asynchronous* on POSIX

Estos comportamientos de deben, en parte, a razones históricas, y cambiarlos crearía incompatibilidad con versiones anteriores, pero también son esperados por algunos usuarios.

Las escrituras sincrónicas evitan problemas tales como el output escrito con `console.log()` o `console.error()` sea intercalado inesperadamente, o no se escriba en absoluto si `process.exit()` es llamado antes de que se complete la escritura asíncrona. Ver [`process.exit()`][] para más información.

***Warning***: Synchronous writes block the event loop until the write has completed. Esto puede ser casi instantáneo en el caso del output a un archivo, pero con una carga alta del sistema, los pipes que no están siendo leídos en el extremo receptor, o con terminales o sistemas de archivos lentos, es posible que el bucle de eventos sea bloqueado con la suficiente frecuencia o el tiempo suficiente para tener graves impactos negativos en el rendimiento. Esto puede no ser un problema al escribir en una sesión de terminal interactiva, pero considere esto de forma particularmente cuidadosa al hacer el registro de producción para los streams de salida del proceso.

Para verificar si un stream está conectado a un contexto [TTY](tty.html#tty_tty), comprobar la propiedad `isTTY`.

Por ejemplo:

```console
$ node -p "Boolean(process.stdin.isTTY)"
true
$ echo "foo" | node -p "Boolean(process.stdin.isTTY)"
false
$ node -p "Boolean(process.stdout.isTTY)"
true
$ node -p "Boolean(process.stdout.isTTY)" | cat
false
```

Ver la documentación de [TTY](tty.html#tty_tty) para mayor información.

## `process.throwDeprecation`<!-- YAML
added: v0.9.12
-->* {boolean}

The initial value of `process.throwDeprecation` indicates whether the `--throw-deprecation` flag is set on the current Node.js process. `process.throwDeprecation` is mutable, so whether or not deprecation warnings result in errors may be altered at runtime. See the documentation for the [`'warning'` event](#process_event_warning) and the [`emitWarning()` method](#process_process_emitwarning_warning_type_code_ctor) for more information.

```console
$ node --throw-deprecation -p "process.throwDeprecation"
true
$ node -p "process.throwDeprecation"
undefined
$ node
> process.emitWarning('test', 'DeprecationWarning');
undefined
> (node:26598) DeprecationWarning: test
> process.throwDeprecation = true;
true
> process.emitWarning('test', 'DeprecationWarning');
Thrown:
[DeprecationWarning: test] { name: 'DeprecationWarning' }
```

## `process.title`<!-- YAML
added: v0.1.104
-->* {string}

La propiedad `process.title` devuelve el título del proceso actual (p.ej., devuelve el valor actual de `ps`). Asignar un nuevo valor a `process.title` modifica el valor actual de `ps`.

When a new value is assigned, different platforms will impose different maximum length restrictions on the title. Usualmente, dichas restricciones son muy limitadas. For instance, on Linux and macOS, `process.title` is limited to the size of the binary name plus the length of the command line arguments because setting the `process.title` overwrites the `argv` memory of the process. Node.js v0.8 allowed for longer process title strings by also overwriting the `environ` memory but that was potentially insecure and confusing in some (rather obscure) cases.

## `process.traceDeprecation`<!-- YAML
added: v0.8.0
-->* {boolean}

La propiedad `process.traceDeprecation` indica si la bandera `--trace-deprecation` está establecida en el proceso Node.js actual. See the documentation for the [`'warning'` event](#process_event_warning) and the [`emitWarning()` method](#process_process_emitwarning_warning_type_code_ctor) for more information about this flag's behavior.

## `process.umask([mask])`<!-- YAML
added: v0.1.19
-->* `mask` {string|integer}

El método `process.umask()` establece o devuelve la máscara de creación de modo de archivo del proceso Node.js. Los procesos secundarios heredan la máscara del proceso primario. Invocado sin un argumento, se devuelve la máscara actual; de lo contrario, la umask se establece en el valor del argumento y se devuelve la máscara anterior.

```js
const newmask = 0o022;
const oldmask = process.umask(newmask);
console.log(
  `Changed umask from ${oldmask.toString(8)} to ${newmask.toString(8)}`
);
```

[`Worker`][] threads are able to read the umask, however attempting to set the umask will result in a thrown exception.

## `process.uptime()`<!-- YAML
added: v0.5.0
-->* Devuelve: {number}

El método `process.uptime()` devuelve el número de segundos que se ha estado ejecutando el proceso Node.js actual.

The return value includes fractions of a second. Use `Math.floor()` to get whole seconds.

## `process.version`<!-- YAML
added: v0.1.3
-->* {string}

La propiedad `process.version` devuelve la string de la versión de Node.js.

```js
console.log(`Version: ${process.version}`);
```

## `process.versions`<!-- YAML
added: v0.2.0
changes:
  - version: v4.2.0
    pr-url: https://github.com/nodejs/node/pull/3102
    description: The `icu` property is now supported.
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15785
    description: The `v8` property now includes a Node.js specific suffix.
-->* {Object}

La propiedad `process.versions` devuelve un objeto que enumera las strings de versiones de Node.js y sus dependencias. `process.versions.modules` indica la versión ABI actual, la cual es incrementada cada vez que cambia una API de C++. Node.js rechazará cargar módulos que fueron compilados contra una versión de módulo ABI diferente.

```js
console.log(process.versions);
```

Generará un objeto similar a:

```console
{ node: '11.13.0',
  v8: '7.0.276.38-node.18',
  uv: '1.27.0',
  zlib: '1.2.11',
  brotli: '1.0.7',
  ares: '1.15.0',
  modules: '67',
  nghttp2: '1.34.0',
  napi: '4',
  llhttp: '1.1.1',
  http_parser: '2.8.0',
  openssl: '1.1.1b',
  cldr: '34.0',
  icu: '63.1',
  tz: '2018e',
  unicode: '11.0' }
```

## Códigos de Salida

Node.js normalmente se cerrará con un código de estado `0` cuando no hayan más operaciones asíncronas pendientes. Los siguientes códigos de estado son utilizados en otros casos:

* `1` **Uncaught Fatal Exception**: There was an uncaught exception, and it was not handled by a domain or an [`'uncaughtException'`][] event handler.
* `2`: Unused (reserved by Bash for builtin misuse)
* `3` **Internal JavaScript Parse Error**: The JavaScript source code internal in Node.js's bootstrapping process caused a parse error. Esto es extremadamente raro, y generalmente sólo puede pasar durante el desarrollo del mismo Node.js.
* `4` **Internal JavaScript Evaluation Failure**: The JavaScript source code internal in Node.js's bootstrapping process failed to return a function value when evaluated. Esto es extremadamente raro, y generalmente sólo puede ocurrir durante el desarrollo del mismo Node.js.
* `5` **Fatal Error**: There was a fatal unrecoverable error in V8. Usualmente, se imprimirá un mensaje en stderr con el prefijo `FATAL ERROR`.
* `6` **Non-function Internal Exception Handler**: There was an uncaught exception, but the internal fatal exception handler function was somehow set to a non-function, and could not be called.
* `7` **Internal Exception Handler Run-Time Failure**: There was an uncaught exception, and the internal fatal exception handler function itself threw an error while attempting to handle it. This can happen, for example, if an [`'uncaughtException'`][] or `domain.on('error')` handler throws an error.
* `8`: Unused. En versiones previas de Node.js, el código de cierre 8 a veces indicaba una excepción sin capturar.
* `9` **Invalid Argument**: Either an unknown option was specified, or an option requiring a value was provided without a value.
* `10` **Internal JavaScript Run-Time Failure**: The JavaScript source code internal in Node.js's bootstrapping process threw an error when the bootstrapping function was called. Esto es extremadamente raro, y generalmente sólo puede ocurrir durante el desarrollo del mismo Node.js.
* `12` **Invalid Debug Argument**: The `--inspect` and/or `--inspect-brk` options were set, but the port number chosen was invalid or unavailable.
* `>128` **Signal Exits**: If Node.js receives a fatal signal such as `SIGKILL` or `SIGHUP`, then its exit code will be `128` plus the value of the signal code. Esta es una práctica estándar de POSIX, como los códigos de salida están definidos para ser enteros de 7 bits, y las salidas por señal establecen el bit de orden mayor, y entonces contienen el valor del código de señal. For example, signal `SIGABRT` has value `6`, so the expected exit code will be `128` + `6`, or `134`.
