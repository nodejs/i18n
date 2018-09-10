# Proceso

<!-- introduced_in=v0.10.0 -->

<!-- type=global -->

El objeto `process` es un `global` que proporciona información acerca de, y control sobre, el proceso Node.js actual. Como un global, siempre está disponible para aplicaciones Node.js sin el uso de `require()`.

## Eventos del Proceso

El objeto `process` es una instancia de [`EventEmitter`][].

### Evento: 'beforeExit'

<!-- YAML
added: v0.11.12
-->

El evento `'beforeExit'` es emitido cuando Node.js vacía su bucle de evento y no tiene trabajo adicional a programar. Normalmente, el proceso Node.js se cierra cuando no hay ningún trabajo programado, pero un oyente registrado en el evento `'beforeExit'` puede hacer llamadas asincrónicas y así causar que el proceso Node.js continúe.

La función callback del oyente es invocada con el valor de [`process.exitCode`][] pasado como el único argumento.

El evento `'beforeExit'` *no* es emitido por condiciones que causen la terminación explícita, como lo es llamar a [`process.exit()`][] o excepciones no detectadas.

El `'beforeExit'` *no* debe ser usado como una alternativa al evento `'exit'`, a menos que la intención sea programar trabajo adicional.

### Evento: 'disconnect'

<!-- YAML
added: v0.7.7
-->

Si el proceso Node.js es generado con un canal IPC (vea la documentación del [Proceso Secundario](child_process.html) y de [Cluster](cluster.html)), el evento `'disconnect'` será emitido cuando el canal IPC sea cerrado.

### Evento: 'exit'

<!-- YAML
added: v0.1.7
-->

* `code` {integer}

El evento `'exit'` es emitido cuando el proceso Node.js está cerca de cerrarse como un resultado de:

* El método `process.exit()` es llamado explícitamente;
* El bucle del evento Node.js ya no tiene ningún trabajo adicional a realizar.

No hay manera de prevenir la salida del bucle del evento en este punto, y una vez todos los oyentes de `'exit'` hayan terminado de ejecutarse, el proceso Node.js se terminará.

La función callback del oyente es invocada con el código de salida especificado por la propiedad [`process.exitCode`][] o el argumento `exitCode` pasado al método [`process.exit()`].

```js
process.on('exit', (code) => {
  console.log(`About to exit with code: ${code}`);
});
```

Las funciones del oyente sólo **deben** realizar operaciones **sincrónicas**. El proceso Node.js se cerrará inmediatamente después de llamar a los oyentes del evento `'exit'`, causando que se abandone cualquier trabajo adicional que todavía se encuentre en cola en el bucle del evento. En el siguiente ejemplo, el timeout (tiempo de espera) nunca ocurrirá:

```js
process.on('exit', (code) => {
  setTimeout(() => {
    console.log('This will not run');
  }, 0);
});
```

### Evento: 'message'

<!-- YAML
added: v0.5.10
-->

* `message` { Object | boolean | number | string | null } a parsed JSON object or a serializable primitive value.
* `sendHandle` {net.Server|net.Socket} un objeto [`net.Server`][] o [`net.Socket`][] o indefinido.

Si el proceso Node.js es generado con un canal IPC (vea la documentación de [Proceso Secundario](child_process.html) y de [Cluster](cluster.html)), el evento `'message'` es emitido cada vez que el proceso secundario recibe un mensaje enviado por el proceso primario, utilizando [`childprocess.send()`][].

El mensaje pasa a través de la serialización y análisis. El mensaje resultante podría no ser el mismo enviado originalmente.

### Evento: 'rejectionHandled'

<!-- YAML
added: v1.4.1
-->

* `promise` {Promise} La promesa manejada tarde.

The `'rejectionHandled'` event is emitted whenever a `Promise` has been rejected and an error handler was attached to it (using [`promise.catch()`][], for example) later than one turn of the Node.js event loop.

El objeto `Promise` habría sido emitido previamente en un evento `'unhandledRejection'`, pero durante el curso del proceso, ganó un manejador de rechazo.

No hay noción de un nivel superior para una cadena `Promise` en el cual los rechazos pueden ser controlados siempre. Being inherently asynchronous in nature, a `Promise` rejection can be handled at a future point in time — possibly much later than the event loop turn it takes for the `'unhandledRejection'` event to be emitted.

Otra manera de decir esto es que, a diferencia del código asincrónico donde hay una lista de excepciones sin manejar que está en constante crecimiento, con las Promises (Promesas), puede haber una lista creciente y decreciente de rechazos no controlados.

En el código sincrónico, el evento `'uncaughtException'` es emitido cuando la lista de excepciones no controladas crece.

En el código asincrónico, el evento `'unhandledRejection'` es emitido cuando la lista de rechazos no controlados crece, y el evento `'rejectionHandled'` es emitido cuando la lista de rechazos no controlados decrece.

```js
const unhandledRejections = new Map();
process.on('unhandledRejection', (reason, promise) => {
  unhandledRejections.set(promise, reason);
});
process.on('rejectionHandled', (promise) => {
  unhandledRejections.delete(promise);
});
```

En este ejemplo, el `Map` de `unhandledRejections` crecerá y decrecerá con el tiempo, reflejando los rechazos que comenzaron siendo no controlados y luego fueron controlados. Es posible registrar dichos errores en un registro de error, ya sea periódicamente (lo que probablemente sea lo mejor para aplicaciones de larga ejecución) o al salir del proceso (lo que probablemente sea más conveniente para scripts).

### Evento: 'uncaughtException'

<!-- YAML
added: v0.1.18
-->

The `'uncaughtException'` event is emitted when an uncaught JavaScript exception bubbles all the way back to the event loop. Por defecto, Node.js maneja dichas excepciones imprimiendo el stack trace en `stderr` y cerrándose. Añadir un manejador para el evento `'uncaughtException'` anula este comportamiento predeterminado.

La función oyente es llamada con el objeto `Error` pasado como el único argumento.

```js
process.on('uncaughtException', (err) => {
  fs.writeSync(1, `Caught exception: ${err}\n`);
});

setTimeout(() => {
  console.log('This will still run.');
}, 500);

// Causa intencionalmente una excepción, pero no la atrapa.
nonexistentFunc();
console.log('This will not run.');
```

#### Advertencia: Usando `'uncaughtException'` correctamente

Note que `'uncaughtException'` es un mecanismo crudo para el manejo de excepciones destinadas a ser usada sólo como último recurso. El evento *no debe* ser usado como un equivalente a `On Error Resume Next`. Excepciones no controladas intrínsecamente significan que una aplicación está en un estado no definido. Attempting to resume application code without properly recovering from the exception can cause additional unforeseen and unpredictable issues.

Las excepciones arrojadas desde dentro del manejador de eventos no serán capturadas. En su lugar, el proceso se cerrará con un código de salida distinto de cero y se imprimirá el stack trace. Esto es para evitar una recursión infinita.

Attempting to resume normally after an uncaught exception can be similar to pulling out of the power cord when upgrading a computer — nine out of ten times nothing happens - but the 10th time, the system becomes corrupted.

The correct use of `'uncaughtException'` is to perform synchronous cleanup of allocated resources (e.g. file descriptors, handles, etc) before shutting down the process. **No es seguro reanudar el funcionamiento normal después de `'uncaughtException'`.**

To restart a crashed application in a more reliable way, whether `'uncaughtException'` is emitted or not, an external monitor should be employed in a separate process to detect application failures and recover or restart as needed.

### Evento: 'unhandledRejection'

<!-- YAML
added: v1.4.1
changes:

  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8217
    description: Not handling `Promise` rejections has been deprecated.
  - version: v6.6.0
    pr-url: https://github.com/nodejs/node/pull/8223
    description: Unhandled `Promise` rejections will now emit
                 a process warning.
-->

El evento `'unhandledRejection'` es emitido cada vez que una `Promise` es rechazada y no hay un manejador de error adjunto a la promesa dentro de un turno del bucle de evento. Al programar con Promises, las excepciones son encapsuladas como "promesas rechazadas". Los rechazos pueden ser capturados y manejados utilizando [`promise.catch()`][], y son propagados a través de una cadena `Promise`. El evento `'unhandledRejection'` es útil para detectar y hacer seguimiento de promesas que fueron rechazadas y cuyos rechazos todavía no han sido manejados.

La función oyente es llamada con los siguientes argumentos:

* `reason` {Error|any} El objeto con el cual la promesa fue rechazada (típicamente un objeto [`Error`][]).
* `p` la `Promise` fue rechazada.

```js
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

somePromise.then((res) => {
  return reportToUser(JSON.pasre(res)); // note the typo (`pasre`)
}); // no `.catch()` or `.then()`
```

Lo siguiente también desencadenará al evento `'unhandledRejection'` a ser emitido:

```js
function SomeResource() {
  // Inicialmente establece el estado de carga a una promesa rechazada
  this.loaded = Promise.reject(new Error('Resource not yet loaded!'));
}

const resource = new SomeResource();
// sin .catch o .then en resource.loaded por al menos un turno
```

En este caso de ejemplo, es posible rastrear el rechazo como un error de desarrollador, como sería típicamente el caso para otros eventos `'unhandledRejection'`. Para abordar dichas fallas, un manejador [`.catch(() => { })`][`promise.catch()`] no operacional puede ser adjuntado a `resource.loaded`, lo cual prevendría que se emitiera el evento `'unhandledRejection'`. Alternativamente, el evento [`'rejectionHandled'`][] puede ser usado.

### Evento: 'warning'

<!-- YAML
added: v6.0.0
-->

* `warning` {Error} Las propiedades clave de la advertencia son: 
  * `name` {string} El nombre de la advertencia. **Predeterminado:** `'Warning'`.
  * `message` {string} Una descripción de la advertencia proporcionada por el sistema.
  * `stack` {string} Un stack trace a la ubicación en el código donde se emitió la advertencia.

El evento `'warning'` es emitido cada vez que Node.js emite una advertencia del proceso.

A process warning is similar to an error in that it describes exceptional conditions that are being brought to the user's attention. Sin embargo, las advertencias no son parte del flujo de manejo de errores de Node.js y JavaScript normal. Node.js puede emitir advertencias cada vez que detecte malas prácticas de programación que pueden conducir a un rendimiento de la aplicación sub-óptimo, bugs o vulnerabilidades de seguridad.

```js
process.on('warning', (warning) => {
  console.warn(warning.name);    // Print the warning name
  console.warn(warning.message); // Print the warning message
  console.warn(warning.stack);   // Print the stack trace
});
```

Por defecto, Node.js imprimirá advertencias de proceso en `stderr`. La opción de línea de comando `--no-warnings` puede ser usada para suprimir la salida de la consola predeterminada, pero el evento `'warning'` aún será emitido por el objeto `process`.

El siguiente ejemplo ilustra la advertencia que se imprime en `stderr` cuando se han añadido muchos oyentes a un evento:

```txt
$ node
> events.defaultMaxListeners = 1;
> process.on('foo', () => {});
> process.on('foo', () => {});
> (node:38638) MaxListenersExceededWarning: Possible EventEmitter memory leak
detected. 2 foo listeners added. Use emitter.setMaxListeners() to increase limit
```

En cambio, el siguiente ejemplo desactiva la salida de advertencia predeterminada y añade un manejador personalizado al evento `'warning'`:

```txt
$ node --no-warnings
> const p = process.on('warning', (warning) => console.warn('Do not do that!'));
> events.defaultMaxListeners = 1;
> process.on('foo', () => {});
> process.on('foo', () => {});
> Do not do that!
```

La opción de línea de comando `--trace-warnings` puede ser usada para hacer que la salida de la consola predeterminada para advertencias incluya el stack trace completo de la advertencia.

El arranque de Node.js utilizando la bandera de línea de comando `--throw-deprecation` causará que se arrojen como excepciones advertencias de desaprobación personalizadas.

El uso de la bandera de línea de comando `--trace-deprecation` causa que la desaprobación personalizada se imprima en `stderr`, en conjunto con el stack trace.

El uso de la bandera de línea de comando `--no-deprecation` suprimirá todos los informes de la desaprobación personalizada.

Las banderas de línea de comando `*-deprecation` sólo afectan a las advertencias que utilizan el nombre `'DeprecationWarning'`.

#### Emisión de advertencias personalizadas

Vea el método [`process.emitWarning()`](#process_process_emitwarning_warning_type_code_ctor) para emitir advertencias personalizadas o específicas de aplicación.

### Eventos de Señal

<!--type=event-->

<!--name=SIGINT, SIGHUP, etc.-->

Los eventos de señal serán emitidos cuando el proceso Node.js reciba una señal. Por favor, diríjase a signal(7) para obtener un listado de nombres de señales POSIX estándares, como `'SIGINT'`, `'SIGHUP'`, etc.

El manejador de señal recibirá el nombre de la señal (`'SIGINT'`, `'SIGTERM'`, etc.) como primer argumento.

El nombre de cada evento será el nombre común en mayúscula para la señal (p. ej., `'SIGINT'` para las señales `SIGINT`).

```js
// Comience leyendo desde stdin, así el proceso no se cierra.
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

* `'SIGUSR1'` está reservado por Node.js para iniciar el [depurador](debugger.html). Es posible instalar un oyente, pero el hacerlo podría interferir con el depurador.
* `'SIGTERM'` y `'SIGINT'` tienen manejadores predeterminados en plataformas distintas a Windows, que reinician el modo terminal antes de salir con el código `128 + signal number`. Si una de estas señales tiene un oyente instalado, su comportamiento predeterminado será eliminado (Node.js ya no se cerrará).
* `'SIGPIPE'` es ignorado por defecto. Puede tener un oyente instalado.
* `'SIGHUP'` es generado en Windows cuando la ventana de la consola está cerrada, y en otras plataformas bajo varias condiciones similares, vea signal(7). Puede tener un oyente instalado, sin embargo, Node.js será cerrado incondicionalmente por Windows unos 10 segundos después. En plataformas distintas de Windows, el comportamiento por defecto de `SIGHUP` es cerrar Node.js, pero una vez que se haya instalado un oyente, su comportamiento por defecto será eliminado.
* `'SIGTERM'` no está soportado en Windows, puede ser escuchado.
* `'SIGINT'` desde el terminal está soportado en todas las plataformas y puede ser generado usualmente con `<Ctrl>+C` (aunque esto puede ser configurable). No es generado cuando está habilitado el modo terminal sin procesar.
* `'SIGBREAK'` es enviado en Windows cuando se presiona `<Ctrl>+<Break>`. En plataformas distintas de Windows, se puede escuchar, pero no hay manera de enviarlo o generarlo.
* `'SIGWINCH'` es enviado cuando la consola ha sido redimensionada. On Windows, this will only happen on write to the console when the cursor is being moved, or when a readable tty is used in raw mode.
* `'SIGKILL'` no puede tener un oyente instalado, esto cerrará incondicionalmente Node.js en todas las plataformas.
* `'SIGSTOP'` no puede tener un oyente instalado.
* `'SIGBUS'`, `'SIGFPE'`, `'SIGSEGV'` y `'SIGILL'`, cuando no se levantan artificialmente utilizando kill(2), intrínsicamente abandonan el proceso en un estado en el cual no es seguro intentar llamar a oyentes JS. Hacer esto podría llevar al proceso a colgarse en un bucle infinito, ya que los oyentes adjuntos que utilizan `process.on()` son llamados asincrónicamente, y, por lo tanto, son incapaces de corregir el problema subyaciente.

Windows no soporta el envío de señales, pero Node.js ofrece una emulación con [`process.kill()`][] y [`subprocess.kill()`][]. El envío de la señal `0` puede ser usado para probar la existencia de un proceso. El envío de `SIGINT`, `SIGTERM`, y `SIGKILL` causa la terminación incondicional del proceso objetivo.

## process.abort()

<!-- YAML
added: v0.7.0
-->

El método `process.abort()` causa que el proceso Node.js se cierre inmediatamente y genere un archivo core.

## process.arch

<!-- YAML
added: v0.5.0
-->

* {string}

La propiedad `process.arch` devuelve una string que identifica la arquitectura del CPU del sistema operativo para el cual se compiló el binario de Node.js.

Los posibles valores actuales son: `'arm'`, `'arm64'`, `'ia32'`, `'mips'`, `'mipsel'`, `'ppc'`, `'ppc64'`, `'s390'`, `'s390x'`, `'x32'` y `'x64'`.

```js
console.log(`This processor architecture is ${process.arch}`);
```

## process.argv

<!-- YAML
added: v0.1.27
-->

* {string[]}

La propiedad `process.argv` devuelve un array que contiene los argumentos de línea de comando pasados cuando se inició el proceso Node.js. El primer elemento será [`process.execPath`]. Vea `process.argv0` si se necesita acceso al valor original de `argv[0]`. El segundo elemento será la ruta para el archivo de JavaScript siendo ejecutado. Los elementos restantes serán argumentos de línea de comando adicional cualesquiera.

Por ejemplo, asumiendo el siguiente script para `process-args.js`:

```js
// imprimir process.argv
process.argv.forEach((val, index) => {
  console.log(`${index}: ${val}`);
});
```

Iniciar el proceso Node.js como:

```console
$ node process-args.js one two=three four
```

Generaría la salida:

```text
0: /usr/local/bin/node
1: /Users/mjr/work/node/process-args.js
2: one
3: two=three
4: four
```

## process.argv0

<!-- YAML
added: v6.4.0
-->

* {string}

La propiedad `process.argv0` almacena una copia de sólo lectura del valor original de `argv[0]` pasado cuando Node.js inicia.

```console
$ bash -c 'exec -a customArgv0 ./node'
> process.argv[0]
'/Volumes/code/external/node/out/Release/node'
> process.argv0
'customArgv0'
```

## process.channel

<!-- YAML
added: v7.1.0
-->

* {Object}

Si el proceso Node.js fue generado con un canal IPC (vea la documentación del [Proceso Secundario](child_process.html)), la propiedad `process.channel` es una referencia al canal IPC. No existe un canal IPC, esta propiedad es `undefined`.

## process.chdir(directory)

<!-- YAML
added: v0.1.17
-->

* `directory` {string}

El método `process.chdir()` cambia el directorio actualmente operativo del proceso Node.js o arroja una excepción si se falla al hacerlo (por ejemplo, si el `directory` especificado no existe).

```js
console.log(`Starting directory: ${process.cwd()}`);
try {
  process.chdir('/tmp');
  console.log(`New directory: ${process.cwd()}`);
} catch (err) {
  console.error(`chdir: ${err}`);
}
```

## process.config

<!-- YAML
added: v0.7.7
-->

* {Object}

La propiedad `process.config` devuelve un `Object` que contiene la representación de JavaScript de las opciones de configuración usadas para compilar el actual Node.js ejecutable. Esto es igual que el archivo `config.gypi` que fue producido al correr el script `./configure`.

Un ejemplo de la salida posible luce así:

<!-- eslint-skip -->

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
     v8_use_snapshot: 'true'
   }
}
```

La propiedad `process.config` **no** es de sólo lectura y existen módulos en el ecosistema que son conocidos por extender, modificar o remplazar completamente el valor de `process.config`.

## process.connected

<!-- YAML
added: v0.7.2
-->

* {boolean}

Si el proceso Node.js es generado con un canal IPC (vea la documentación del [Proceso Secundario](child_process.html) y de [Cluster](cluster.html)), la propiedad `process.connected` devolverá `true` siempre que el canal IPC esté conectado, y devolverá `false` después de que se llame a `process.disconnect()`.

Una vez que `process.connected` sea `false`, ya no será posible enviar mensajes por el canal IPC usando `process.send()`.

## process.cpuUsage([previousValue])

<!-- YAML
added: v6.1.0
-->

* `previousValue` {Object} Un valor de devolución previo a llamar `process.cpuUsage()`
* Devuelve: {Object} * `user` {integer} * `system` {integer}

The `process.cpuUsage()` method returns the user and system CPU time usage of the current process, in an object with properties `user` and `system`, whose values are microsecond values (millionth of a second). These values measure time spent in user and system code respectively, and may end up being greater than actual elapsed time if multiple CPU cores are performing work for this process.

El resultado de una llamada previa a `process.cpuUsage()` puede ser pasado como el argumento a la función, para obtener una lectura diff.

```js
const startUsage = process.cpuUsage();
// { user: 38579, system: 6986 }

// gire el CPU por 500 milisegundos
const now = Date.now();
while (Date.now() - now < 500);

console.log(process.cpuUsage(startUsage));
// { user: 514883, system: 11226 }
```

## process.cwd()

<!-- YAML
added: v0.1.8
-->

* Returns: {string}

The `process.cwd()` method returns the current working directory of the Node.js process.

```js
console.log(`Current directory: ${process.cwd()}`);
```

## process.debugPort

<!-- YAML
added: v0.7.2
-->

* {number}

The port used by Node.js's debugger when enabled.

```js
process.debugPort = 5858;
```

## process.disconnect()

<!-- YAML
added: v0.7.2
-->

If the Node.js process is spawned with an IPC channel (see the [Child Process](child_process.html) and [Cluster](cluster.html) documentation), the `process.disconnect()` method will close the IPC channel to the parent process, allowing the child process to exit gracefully once there are no other connections keeping it alive.

The effect of calling `process.disconnect()` is that same as calling the parent process's [`ChildProcess.disconnect()`][].

If the Node.js process was not spawned with an IPC channel, `process.disconnect()` will be `undefined`.

## process.dlopen(module, filename[, flags])

<!-- YAML
added: v0.1.16
changes:

  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/12794
    description: Added support for the `flags` argument.
-->

* `module` {Object}
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

## process.emitWarning(warning[, options])

<!-- YAML
added: v8.0.0
-->

* `warning` {string|Error} The warning to emit.
* `options` {Object} 
  * `type` {string} When `warning` is a `String`, `type` is the name to use for the *type* of warning being emitted. **Predeterminado:** `'Warning'`.
  * `code` {string} A unique identifier for the warning instance being emitted.
  * `ctor` {Function} When `warning` is a `String`, `ctor` is an optional function used to limit the generated stack trace. **Default:** `process.emitWarning`.
  * `detail` {string} Additional text to include with the error.

The `process.emitWarning()` method can be used to emit custom or application specific process warnings. These can be listened for by adding a handler to the [`'warning'`](#process_event_warning) event.

```js
// Emit a warning with a code and additional detail.
process.emitWarning('Something happened!', {
  code: 'MY_WARNING',
  detail: 'This is some additional information'
});
// Emits:
// (node:56338) [MY_WARNING] Warning: Something happened!
// This is some additional information
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

## process.emitWarning(warning\[, type[, code]\]\[, ctor\])

<!-- YAML
added: v6.0.0
-->

* `warning` {string|Error} The warning to emit.
* `type` {string} When `warning` is a `String`, `type` is the name to use for the *type* of warning being emitted. **Predeterminado:** `'Warning'`.
* `code` {string} A unique identifier for the warning instance being emitted.
* `ctor` {Function} When `warning` is a `String`, `ctor` is an optional function used to limit the generated stack trace. **Default:** `process.emitWarning`.

The `process.emitWarning()` method can be used to emit custom or application specific process warnings. These can be listened for by adding a handler to the [`'warning'`](#process_event_warning) event.

```js
// Emit a warning using a string.
process.emitWarning('Something happened!');
// Emits: (node: 56338) Warning: Something happened!
```

```js
// Emit a warning using a string and a type.
process.emitWarning('Something Happened!', 'CustomWarning');
// Emits: (node:56338) CustomWarning: Something Happened!
```

```js
process.emitWarning('Something happened!', 'CustomWarning', 'WARN001');
// Emits: (node:56338) [WARN001] CustomWarning: Something happened!
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
// Emit a warning using an Error object.
const myWarning = new Error('Something happened!');
// Use the Error name property to specify the type name
myWarning.name = 'CustomWarning';
myWarning.code = 'WARN001';

process.emitWarning(myWarning);
// Emits: (node:56338) [WARN001] CustomWarning: Something happened!
```

A `TypeError` is thrown if `warning` is anything other than a string or `Error` object.

Note that while process warnings use `Error` objects, the process warning mechanism is **not** a replacement for normal error handling mechanisms.

The following additional handling is implemented if the warning `type` is `'DeprecationWarning'`:

* If the `--throw-deprecation` command-line flag is used, the deprecation warning is thrown as an exception rather than being emitted as an event.
* If the `--no-deprecation` command-line flag is used, the deprecation warning is suppressed.
* If the `--trace-deprecation` command-line flag is used, the deprecation warning is printed to `stderr` along with the full stack trace.

### Avoiding duplicate warnings

As a best practice, warnings should be emitted only once per process. To do so, it is recommended to place the `emitWarning()` behind a simple boolean flag as illustrated in the example below:

```js
function emitMyWarning() {
  if (!emitMyWarning.warned) {
    emitMyWarning.warned = true;
    process.emitWarning('Only warn once!');
  }
}
emitMyWarning();
// Emits: (node: 56339) Warning: Only warn once!
emitMyWarning();
// Emits nothing
```

## process.env

<!-- YAML
added: v0.1.27
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18990
    description: Implicit conversion of variable value to string is deprecated.
-->

* {Object}

The `process.env` property returns an object containing the user environment. See environ(7).

An example of this object looks like:

<!-- eslint-skip -->

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

It is possible to modify this object, but such modifications will not be reflected outside the Node.js process. In other words, the following example would not work:

```console
$ node -e 'process.env.foo = "bar"' && echo $foo
```

While the following will:

```js
process.env.foo = 'bar';
console.log(process.env.foo);
```

Assigning a property on `process.env` will implicitly convert the value to a string. **This behavior is deprecated.** Future versions of Node.js may throw an error when the value is not a string, number, or boolean.

Example:

```js
process.env.test = null;
console.log(process.env.test);
// => 'null'
process.env.test = undefined;
console.log(process.env.test);
// => 'undefined'
```

Use `delete` to delete a property from `process.env`.

Example:

```js
process.env.TEST = 1;
delete process.env.TEST;
console.log(process.env.TEST);
// => undefined
```

On Windows operating systems, environment variables are case-insensitive.

Example:

```js
process.env.TEST = 1;
console.log(process.env.test);
// => 1
```

## process.execArgv

<!-- YAML
added: v0.7.7
-->

* {string[]}

The `process.execArgv` property returns the set of Node.js-specific command-line options passed when the Node.js process was launched. These options do not appear in the array returned by the [`process.argv`][] property, and do not include the Node.js executable, the name of the script, or any options following the script name. These options are useful in order to spawn child processes with the same execution environment as the parent.

```console
$ node --harmony script.js --version
```

Results in `process.execArgv`:

<!-- eslint-disable semi -->

```js
['--harmony']
```

And `process.argv`:

<!-- eslint-disable semi -->

```js
['/usr/local/bin/node', 'script.js', '--version']
```

## process.execPath

<!-- YAML
added: v0.1.100
-->

* {string}

The `process.execPath` property returns the absolute pathname of the executable that started the Node.js process.

<!-- eslint-disable semi -->

```js
'/usr/local/bin/node'
```

## process.exit([code])

<!-- YAML
added: v0.1.13
-->

* `code` {integer} The exit code. **Default:** `0`.

The `process.exit()` method instructs Node.js to terminate the process synchronously with an exit status of `code`. If `code` is omitted, exit uses either the 'success' code `0` or the value of `process.exitCode` if it has been set. Node.js will not terminate until all the [`'exit'`] event listeners are called.

To exit with a 'failure' code:

```js
process.exit(1);
```

The shell that executed Node.js should see the exit code as `1`.

Calling `process.exit()` will force the process to exit as quickly as possible even if there are still asynchronous operations pending that have not yet completed fully, including I/O operations to `process.stdout` and `process.stderr`.

In most situations, it is not actually necessary to call `process.exit()` explicitly. The Node.js process will exit on its own *if there is no additional work pending* in the event loop. The `process.exitCode` property can be set to tell the process which exit code to use when the process exits gracefully.

For instance, the following example illustrates a *misuse* of the `process.exit()` method that could lead to data printed to stdout being truncated and lost:

```js
// This is an example of what *not* to do:
if (someConditionNotMet()) {
  printUsageToStdout();
  process.exit(1);
}
```

The reason this is problematic is because writes to `process.stdout` in Node.js are sometimes *asynchronous* and may occur over multiple ticks of the Node.js event loop. Calling `process.exit()`, however, forces the process to exit *before* those additional writes to `stdout` can be performed.

Rather than calling `process.exit()` directly, the code *should* set the `process.exitCode` and allow the process to exit naturally by avoiding scheduling any additional work for the event loop:

```js
// How to properly set the exit code while letting
// the process exit gracefully.
if (someConditionNotMet()) {
  printUsageToStdout();
  process.exitCode = 1;
}
```

If it is necessary to terminate the Node.js process due to an error condition, throwing an *uncaught* error and allowing the process to terminate accordingly is safer than calling `process.exit()`.

## process.exitCode

<!-- YAML
added: v0.11.8
-->

* {integer}

A number which will be the process exit code, when the process either exits gracefully, or is exited via [`process.exit()`][] without specifying a code.

Specifying a code to [`process.exit(code)`][`process.exit()`] will override any previous setting of `process.exitCode`.

## process.getegid()

<!-- YAML
added: v2.0.0
-->

The `process.getegid()` method returns the numerical effective group identity of the Node.js process. (See getegid(2).)

```js
if (process.getegid) {
  console.log(`Current gid: ${process.getegid()}`);
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.geteuid()

<!-- YAML
added: v2.0.0
-->

* Returns: {Object}

The `process.geteuid()` method returns the numerical effective user identity of the process. (See geteuid(2).)

```js
if (process.geteuid) {
  console.log(`Current uid: ${process.geteuid()}`);
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.getgid()

<!-- YAML
added: v0.1.31
-->

* Returns: {Object}

The `process.getgid()` method returns the numerical group identity of the process. (See getgid(2).)

```js
if (process.getgid) {
  console.log(`Current gid: ${process.getgid()}`);
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.getgroups()

<!-- YAML
added: v0.9.4
-->

* Returns: {integer[]}

The `process.getgroups()` method returns an array with the supplementary group IDs. POSIX leaves it unspecified if the effective group ID is included but Node.js ensures it always is.

This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.getuid()

<!-- YAML
added: v0.1.28
-->

* Returns: {integer}

The `process.getuid()` method returns the numeric user identity of the process. (See getuid(2).)

```js
if (process.getuid) {
  console.log(`Current uid: ${process.getuid()}`);
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.hasUncaughtExceptionCaptureCallback()

<!-- YAML
added: v9.3.0
-->

* Returns: {boolean}

Indicates whether a callback has been set using [`process.setUncaughtExceptionCaptureCallback()`][].

## process.hrtime([time])

<!-- YAML
added: v0.7.6
-->

* `time` {integer[]} The result of a previous call to `process.hrtime()`
* Returns: {integer[]}

The `process.hrtime()` method returns the current high-resolution real time in a `[seconds, nanoseconds]` tuple `Array`, where `nanoseconds` is the remaining part of the real time that can't be represented in second precision.

`time` is an optional parameter that must be the result of a previous `process.hrtime()` call to diff with the current time. If the parameter passed in is not a tuple `Array`, a `TypeError` will be thrown. Passing in a user-defined array instead of the result of a previous call to `process.hrtime()` will lead to undefined behavior.

These times are relative to an arbitrary time in the past, and not related to the time of day and therefore not subject to clock drift. The primary use is for measuring performance between intervals:

```js
const NS_PER_SEC = 1e9;
const time = process.hrtime();
// [ 1800216, 25 ]

setTimeout(() => {
  const diff = process.hrtime(time);
  // [ 1, 552 ]

  console.log(`Benchmark took ${diff[0] * NS_PER_SEC + diff[1]} nanoseconds`);
  // benchmark took 1000000552 nanoseconds
}, 1000);
```

## process.initgroups(user, extraGroup)

<!-- YAML
added: v0.9.4
-->

* `user` {string|number} The user name or numeric identifier.
* `extraGroup` {string|number} A group name or numeric identifier.

The `process.initgroups()` method reads the `/etc/group` file and initializes the group access list, using all groups of which the user is a member. This is a privileged operation that requires that the Node.js process either have `root` access or the `CAP_SETGID` capability.

Note that care must be taken when dropping privileges. Example:

```js
console.log(process.getgroups());         // [ 0 ]
process.initgroups('bnoordhuis', 1000);   // switch user
console.log(process.getgroups());         // [ 27, 30, 46, 1000, 0 ]
process.setgid(1000);                     // drop root gid
console.log(process.getgroups());         // [ 27, 30, 46, 1000 ]
```

This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.kill(pid[, signal])

<!-- YAML
added: v0.0.6
-->

* `pid` {number} A process ID
* `signal` {string|number} The signal to send, either as a string or number. **Predeterminado:** `'SIGTERM'`.

The `process.kill()` method sends the `signal` to the process identified by `pid`.

Signal names are strings such as `'SIGINT'` or `'SIGHUP'`. See [Signal Events](#process_signal_events) and kill(2) for more information.

This method will throw an error if the target `pid` does not exist. As a special case, a signal of `0` can be used to test for the existence of a process. Windows platforms will throw an error if the `pid` is used to kill a process group.

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

When `SIGUSR1` is received by a Node.js process, Node.js will start the debugger, see [Signal Events](#process_signal_events).

## process.mainModule

<!-- YAML
added: v0.1.17
-->

* {Object}

The `process.mainModule` property provides an alternative way of retrieving [`require.main`][]. The difference is that if the main module changes at runtime, [`require.main`][] may still refer to the original main module in modules that were required before the change occurred. Generally, it's safe to assume that the two refer to the same module.

As with [`require.main`][], `process.mainModule` will be `undefined` if there is no entry script.

## process.memoryUsage()

<!-- YAML
added: v0.1.16
changes:

  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9587
    description: Added `external` to the returned object.
-->

* Returns: {Object} * `rss` {integer} * `heapTotal` {integer} * `heapUsed` {integer} * `external` {integer}

The `process.memoryUsage()` method returns an object describing the memory usage of the Node.js process measured in bytes.

For example, the code:

```js
console.log(process.memoryUsage());
```

Will generate:

<!-- eslint-skip -->

```js
{
  rss: 4935680,
  heapTotal: 1826816,
  heapUsed: 650472,
  external: 49879
}
```

`heapTotal` and `heapUsed` refer to V8's memory usage. `external` refers to the memory usage of C++ objects bound to JavaScript objects managed by V8. `rss`, Resident Set Size, is the amount of space occupied in the main memory device (that is a subset of the total allocated memory) for the process, which includes the *heap*, *code segment* and *stack*.

The *heap* is where objects, strings, and closures are stored. Variables are stored in the *stack* and the actual JavaScript code resides in the *code segment*.

## process.nextTick(callback[, ...args])

<!-- YAML
added: v0.1.26
changes:

  - version: v1.8.1
    pr-url: https://github.com/nodejs/node/pull/1077
    description: Additional arguments after `callback` are now supported.
-->

* `callback` {Function}
* `...args` {any} Additional arguments to pass when invoking the `callback`

The `process.nextTick()` method adds the `callback` to the "next tick queue". Once the current turn of the event loop turn runs to completion, all callbacks currently in the next tick queue will be called.

This is *not* a simple alias to [`setTimeout(fn, 0)`][]. It is much more efficient. It runs before any additional I/O events (including timers) fire in subsequent ticks of the event loop.

```js
console.log('start');
process.nextTick(() => {
  console.log('nextTick callback');
});
console.log('scheduled');
// Output:
// start
// scheduled
// nextTick callback
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

// thing.startDoingStuff() gets called now, not before.
```

It is very important for APIs to be either 100% synchronous or 100% asynchronous. Consider this example:

```js
// WARNING!  DO NOT USE!  BAD UNSAFE HAZARD!
function maybeSync(arg, cb) {
  if (arg) {
    cb();
    return;
  }

  fs.stat('file', cb);
}
```

This API is hazardous because in the following case:

```js
const maybeTrue = Math.random() > 0.5;

maybeSync(maybeTrue, () => {
  foo();
});

bar();
```

It is not clear whether `foo()` or `bar()` will be called first.

The following approach is much better:

```js
function definitelyAsync(arg, cb) {
  if (arg) {
    process.nextTick(cb);
    return;
  }

  fs.stat('file', cb);
}
```

The next tick queue is completely drained on each pass of the event loop **before** additional I/O is processed. As a result, recursively setting `nextTick()` callbacks will block any I/O from happening, just like a `while(true);` loop.

## process.noDeprecation

<!-- YAML
added: v0.8.0
-->

* {boolean}

The `process.noDeprecation` property indicates whether the `--no-deprecation` flag is set on the current Node.js process. See the documentation for the [`'warning'` event](#process_event_warning) and the [`emitWarning()` method](#process_process_emitwarning_warning_type_code_ctor) for more information about this flag's behavior.

## process.pid

<!-- YAML
added: v0.1.15
-->

* {integer}

The `process.pid` property returns the PID of the process.

```js
console.log(`This process is pid ${process.pid}`);
```

## process.platform

<!-- YAML
added: v0.1.16
-->

* {string}

The `process.platform` property returns a string identifying the operating system platform on which the Node.js process is running.

Currently possible values are:

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

## process.ppid

<!-- YAML
added: v9.2.0
-->

* {integer}

The `process.ppid` property returns the PID of the current parent process.

```js
console.log(`The parent process is pid ${process.ppid}`);
```

## process.release

<!-- YAML
added: v3.0.0
changes:

  - version: v4.2.0
    pr-url: https://github.com/nodejs/node/pull/3212
    description: The `lts` property is now supported.
-->

* {Object}

The `process.release` property returns an `Object` containing metadata related to the current release, including URLs for the source tarball and headers-only tarball.

`process.release` contains the following properties:

* `name` {string} A value that will always be `'node'` for Node.js. For legacy io.js releases, this will be `'io.js'`.
* `sourceUrl` {string} an absolute URL pointing to a *`.tar.gz`* file containing the source code of the current release.
* `headersUrl`{string} an absolute URL pointing to a *`.tar.gz`* file containing only the source header files for the current release. This file is significantly smaller than the full source file and can be used for compiling Node.js native add-ons.
* `libUrl` {string} an absolute URL pointing to a *`node.lib`* file matching the architecture and version of the current release. This file is used for compiling Node.js native add-ons. *This property is only present on Windows builds of Node.js and will be missing on all other platforms.*
* `lts` {string} a string label identifying the [LTS](https://github.com/nodejs/LTS/) label for this release. This property only exists for LTS releases and is `undefined` for all other release types, including *Current* releases. Currently the valid values are: 
  * `'Argon'` for the 4.x LTS line beginning with 4.2.0.
  * `'Boron'` for the 6.x LTS line beginning with 6.9.0.
  * `'Carbon'` for the 8.x LTS line beginning with 8.9.1.

<!-- eslint-skip -->

```js
{
  name: 'node',
  lts: 'Argon',
  sourceUrl: 'https://nodejs.org/download/release/v4.4.5/node-v4.4.5.tar.gz',
  headersUrl: 'https://nodejs.org/download/release/v4.4.5/node-v4.4.5-headers.tar.gz',
  libUrl: 'https://nodejs.org/download/release/v4.4.5/win-x64/node.lib'
}
```

In custom builds from non-release versions of the source tree, only the `name` property may be present. The additional properties should not be relied upon to exist.

## process.send(message\[, sendHandle[, options]\]\[, callback\])

<!-- YAML
added: v0.5.9
-->

* `message` {Object}
* `sendHandle` {net.Server|net.Socket}
* `options` {Object}
* `callback` {Function}
* Returns: {boolean}

If Node.js is spawned with an IPC channel, the `process.send()` method can be used to send messages to the parent process. Messages will be received as a [`'message'`][] event on the parent's [`ChildProcess`][] object.

If Node.js was not spawned with an IPC channel, `process.send()` will be `undefined`.

El mensaje pasa a través de la serialización y análisis. El mensaje resultante podría no ser el mismo enviado originalmente.

## process.setegid(id)

<!-- YAML
added: v2.0.0
-->

* `id` {string|number} A group name or ID

The `process.setegid()` method sets the effective group identity of the process. (See setegid(2).) The `id` can be passed as either a numeric ID or a group name string. If a group name is specified, this method blocks while resolving the associated a numeric ID.

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

This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.seteuid(id)

<!-- YAML
added: v2.0.0
-->

* `id` {string|number} A user name or ID

The `process.seteuid()` method sets the effective user identity of the process. (See seteuid(2).) The `id` can be passed as either a numeric ID or a username string. If a username is specified, the method blocks while resolving the associated numeric ID.

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

This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.setgid(id)

<!-- YAML
added: v0.1.31
-->

* `id` {string|number} The group name or ID

The `process.setgid()` method sets the group identity of the process. (See setgid(2).) The `id` can be passed as either a numeric ID or a group name string. If a group name is specified, this method blocks while resolving the associated numeric ID.

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

This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.setgroups(groups)

<!-- YAML
added: v0.9.4
-->

* `groups` {integer[]}

The `process.setgroups()` method sets the supplementary group IDs for the Node.js process. This is a privileged operation that requires the Node.js process to have `root` or the `CAP_SETGID` capability.

The `groups` array can contain numeric group IDs, group names or both.

This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.setuid(id)

<!-- YAML
added: v0.1.28
-->

The `process.setuid(id)` method sets the user identity of the process. (See setuid(2).) The `id` can be passed as either a numeric ID or a username string. If a username is specified, the method blocks while resolving the associated numeric ID.

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

This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.setUncaughtExceptionCaptureCallback(fn)

<!-- YAML
added: v9.3.0
-->

* `fn` {Function|null}

The `process.setUncaughtExceptionCapture` function sets a function that will be invoked when an uncaught exception occurs, which will receive the exception value itself as its first argument.

If such a function is set, the [`'uncaughtException'`][] event will not be emitted. If `--abort-on-uncaught-exception` was passed from the command line or set through [`v8.setFlagsFromString()`][], the process will not abort.

To unset the capture function, `process.setUncaughtExceptionCapture(null)` may be used. Calling this method with a non-`null` argument while another capture function is set will throw an error.

Using this function is mutually exclusive with using the deprecated [`domain`][] built-in module.

## process.stderr

* {Stream}

The `process.stderr` property returns a stream connected to `stderr` (fd `2`). It is a [`net.Socket`][] (which is a [Duplex](stream.html#stream_duplex_and_transform_streams) stream) unless fd `2` refers to a file, in which case it is a [Writable](stream.html#stream_writable_streams) stream.

`process.stderr` differs from other Node.js streams in important ways, see [note on process I/O](process.html#process_a_note_on_process_i_o) for more information.

## process.stdin

* {Stream}

The `process.stdin` property returns a stream connected to `stdin` (fd `0`). It is a [`net.Socket`][] (which is a [Duplex](stream.html#stream_duplex_and_transform_streams) stream) unless fd `0` refers to a file, in which case it is a [Readable](stream.html#stream_readable_streams) stream.

```js
process.stdin.setEncoding('utf8');

process.stdin.on('readable', () => {
  const chunk = process.stdin.read();
  if (chunk !== null) {
    process.stdout.write(`data: ${chunk}`);
  }
});

process.stdin.on('end', () => {
  process.stdout.write('end');
});
```

As a [Duplex](stream.html#stream_duplex_and_transform_streams) stream, `process.stdin` can also be used in "old" mode that is compatible with scripts written for Node.js prior to v0.10. For more information see [Stream compatibility](stream.html#stream_compatibility_with_older_node_js_versions).

In "old" streams mode the `stdin` stream is paused by default, so one must call `process.stdin.resume()` to read from it. Note also that calling `process.stdin.resume()` itself would switch stream to "old" mode.

## process.stdout

* {Stream}

The `process.stdout` property returns a stream connected to `stdout` (fd `1`). It is a [`net.Socket`][] (which is a [Duplex](stream.html#stream_duplex_and_transform_streams) stream) unless fd `1` refers to a file, in which case it is a [Writable](stream.html#stream_writable_streams) stream.

For example, to copy `process.stdin` to `process.stdout`:

```js
process.stdin.pipe(process.stdout);
```

`process.stdout` differs from other Node.js streams in important ways, see [note on process I/O](process.html#process_a_note_on_process_i_o) for more information.

### A note on process I/O

`process.stdout` and `process.stderr` differ from other Node.js streams in important ways:

1. They are used internally by [`console.log()`][] and [`console.error()`][], respectively.
2. They cannot be closed ([`end()`][] will throw).
3. They will never emit the [`'finish'`][] event.
4. Writes may be synchronous depending on what the stream is connected to and whether the system is Windows or POSIX: 
  * Files: *synchronous* on Windows and POSIX
  * TTYs (Terminals): *asynchronous* on Windows, *synchronous* on POSIX
  * Pipes (and sockets): *synchronous* on Windows, *asynchronous* on POSIX

These behaviors are partly for historical reasons, as changing them would create backwards incompatibility, but they are also expected by some users.

Synchronous writes avoid problems such as output written with `console.log()` or `console.error()` being unexpectedly interleaved, or not written at all if `process.exit()` is called before an asynchronous write completes. See [`process.exit()`][] for more information.

***Warning***: Synchronous writes block the event loop until the write has completed. This can be near instantaneous in the case of output to a file, but under high system load, pipes that are not being read at the receiving end, or with slow terminals or file systems, its possible for the event loop to be blocked often enough and long enough to have severe negative performance impacts. This may not be a problem when writing to an interactive terminal session, but consider this particularly careful when doing production logging to the process output streams.

To check if a stream is connected to a [TTY](tty.html#tty_tty) context, check the `isTTY` property.

For instance:

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

See the [TTY](tty.html#tty_tty) documentation for more information.

## process.throwDeprecation

<!-- YAML
added: v0.9.12
-->

* {boolean}

The `process.throwDeprecation` property indicates whether the `--throw-deprecation` flag is set on the current Node.js process. See the documentation for the [`'warning'` event](#process_event_warning) and the [`emitWarning()` method](#process_process_emitwarning_warning_type_code_ctor) for more information about this flag's behavior.

## process.title

<!-- YAML
added: v0.1.104
-->

* {string}

The `process.title` property returns the current process title (i.e. returns the current value of `ps`). Assigning a new value to `process.title` modifies the current value of `ps`.

When a new value is assigned, different platforms will impose different maximum length restrictions on the title. Usually such restrictions are quite limited. For instance, on Linux and macOS, `process.title` is limited to the size of the binary name plus the length of the command line arguments because setting the `process.title` overwrites the `argv` memory of the process. Node.js v0.8 allowed for longer process title strings by also overwriting the `environ` memory but that was potentially insecure and confusing in some (rather obscure) cases.

## process.traceDeprecation

<!-- YAML
added: v0.8.0
-->

* {boolean}

The `process.traceDeprecation` property indicates whether the `--trace-deprecation` flag is set on the current Node.js process. See the documentation for the [`'warning'` event](#process_event_warning) and the [`emitWarning()` method](#process_process_emitwarning_warning_type_code_ctor) for more information about this flag's behavior.

## process.umask([mask])

<!-- YAML
added: v0.1.19
-->

* `mask` {number}

The `process.umask()` method sets or returns the Node.js process's file mode creation mask. Child processes inherit the mask from the parent process. Invoked without an argument, the current mask is returned, otherwise the umask is set to the argument value and the previous mask is returned.

```js
const newmask = 0o022;
const oldmask = process.umask(newmask);
console.log(
  `Changed umask from ${oldmask.toString(8)} to ${newmask.toString(8)}`
);
```

## process.uptime()

<!-- YAML
added: v0.5.0
-->

* Returns: {number}

The `process.uptime()` method returns the number of seconds the current Node.js process has been running.

The return value includes fractions of a second. Use `Math.floor()` to get whole seconds.

## process.version

<!-- YAML
added: v0.1.3
-->

* {string}

The `process.version` property returns the Node.js version string.

```js
console.log(`Version: ${process.version}`);
```

## process.versions

<!-- YAML
added: v0.2.0
changes:

  - version: v4.2.0
    pr-url: https://github.com/nodejs/node/pull/3102
    description: The `icu` property is now supported.
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15785
    description: The `v8` property now includes a Node.js specific suffix.
-->

* {Object}

The `process.versions` property returns an object listing the version strings of Node.js and its dependencies. `process.versions.modules` indicates the current ABI version, which is increased whenever a C++ API changes. Node.js will refuse to load modules that were compiled against a different module ABI version.

```js
console.log(process.versions);
```

Will generate an object similar to:

<!-- eslint-skip -->

```js
{ http_parser: '2.7.0',
  node: '8.9.0',
  v8: '6.3.292.48-node.6',
  uv: '1.18.0',
  zlib: '1.2.11',
  ares: '1.13.0',
  modules: '60',
  nghttp2: '1.29.0',
  napi: '2',
  openssl: '1.0.2n',
  icu: '60.1',
  unicode: '10.0',
  cldr: '32.0',
  tz: '2016b' }
```

## Exit Codes

Node.js will normally exit with a `0` status code when no more async operations are pending. The following status codes are used in other cases:

* `1` **Uncaught Fatal Exception** - There was an uncaught exception, and it was not handled by a domain or an [`'uncaughtException'`][] event handler.
* `2` - Unused (reserved by Bash for builtin misuse)
* `3` **Internal JavaScript Parse Error** - The JavaScript source code internal in Node.js's bootstrapping process caused a parse error. This is extremely rare, and generally can only happen during development of Node.js itself.
* `4` **Internal JavaScript Evaluation Failure** - The JavaScript source code internal in Node.js's bootstrapping process failed to return a function value when evaluated. This is extremely rare, and generally can only happen during development of Node.js itself.
* `5` **Fatal Error** - There was a fatal unrecoverable error in V8. Typically a message will be printed to stderr with the prefix `FATAL
ERROR`.
* `6` **Non-function Internal Exception Handler** - There was an uncaught exception, but the internal fatal exception handler function was somehow set to a non-function, and could not be called.
* `7` **Internal Exception Handler Run-Time Failure** - There was an uncaught exception, and the internal fatal exception handler function itself threw an error while attempting to handle it. This can happen, for example, if an [`'uncaughtException'`][] or `domain.on('error')` handler throws an error.
* `8` - Unused. In previous versions of Node.js, exit code 8 sometimes indicated an uncaught exception.
* `9` - **Invalid Argument** - Either an unknown option was specified, or an option requiring a value was provided without a value.
* `10` **Internal JavaScript Run-Time Failure** - The JavaScript source code internal in Node.js's bootstrapping process threw an error when the bootstrapping function was called. This is extremely rare, and generally can only happen during development of Node.js itself.
* `12` **Invalid Debug Argument** - The `--inspect` and/or `--inspect-brk` options were set, but the port number chosen was invalid or unavailable.
* `>128` **Signal Exits** - If Node.js receives a fatal signal such as `SIGKILL` or `SIGHUP`, then its exit code will be `128` plus the value of the signal code. This is a standard POSIX practice, since exit codes are defined to be 7-bit integers, and signal exits set the high-order bit, and then contain the value of the signal code. For example, signal `SIGABRT` has value `6`, so the expected exit code will be `128` + `6`, or `134`.