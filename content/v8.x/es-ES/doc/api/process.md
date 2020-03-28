# Proceso

<!-- introduced_in=v0.10.0 -->

<!-- type=global -->

El objeto `process` es un `global` que proporciona información y control sobre el proceso actual de Node.js. Como un global, siempre está disponible para aplicaciones de Node.js sin utilizar `require()`.

## Eventos de Proceso

El objeto `process` es una instancia de [`EventEmitter`][].

### Evento: 'beforeExit'

<!-- YAML
added: v0.11.12
-->

El evento `'beforeExit'` es emitido cuando Node.js vacía su bucle de evento y no tiene un trabajo adicional que programar. Normalmente, el proceso Node.js se cerrará cuando no haya ningún trabajo programado, pero un listener registrado en el evento `'beforeExit'` puede hacer llamadas asíncronas y así causar que el proceso Node.js continúe.

La función callback del oyente es invocada con el valor de [`process.exitCode`][] pasado como el único argumento.

El evento `'beforeExit'` *no* es emitido para condiciones que causen la terminación explícita, como lo es llamar a [`process.exit()`][] o excepciones no detectadas.

El `'beforeExit'` *no* debe ser utilizado como una alternativa al evento `'exit'` a menos que la intención sea programar un trabajo adicional.

### Evento: 'disconnect'

<!-- YAML
added: v0.7.7
-->

Si el proceso Node.js es generado con un canal IPC (ver la documentación de [Proceso Secundario](child_process.html) y de [Cluster](cluster.html)), el evento `'disconnect'` será emitido cuando el canal IPC esté cerrado.

### Evento: 'exit'

<!-- YAML
added: v0.1.7
-->

El evento `'exit'` es emitido cuando el proceso Node.js está por cerrarse como un resultado de:

* El método `process.exit()` siendo llamado de manera explícita;
* El bucle de evento de Node.js ya no tiene ningún trabajo adicional que realizar.

No hay manera de prevenir la salida del bucle del evento en este punto, y una vez que todos los oyentes de `'exit'` hayan terminado de ejecutar el proceso Node.js, se terminarán.

La función de callback del oyente es invocada con el código de salida especificado por la propiedad [`process.exitCode`][] o el argumento `exitCode` pasado al método [`process.exit()`] como el único argumento.

For example:

```js
process.on('exit', (code) => {
  console.log(`About to exit with code: ${code}`);
});
```

Las funciones del oyente sólo **deben** realizar operaciones **sincrónicas**. El proceso Node.js saldrá inmediatamente después de llamar a los oyentes del evento `'exit'`, causando que se abandone cualquier trabajo adicional que todavía se encuentre en cola en el bucle del evento. En el siguiente ejemplo, el tiempo de espera nunca ocurrirá:

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

Si el proceso Node.js es generado con un canal IPC (ver la documentación de [Child Process](child_process.html) y de [Cluster](cluster.html)), el evento `'message'` es emitido cuando un mensaje enviado por un proceso primario utilizando [`childprocess.send()`][] es recibido por el proceso secundario.

El callback del listener es invocado con los siguientes argumentos:

* `message` {Object} un objeto de JSON analizado o un valor primitivo.
* `sendHandle` {Handle object} un objeto [`net.Socket`][] o [`net.Server`][], o indefinido.

*Note*: The message goes through serialization and parsing. The resulting message might not be the same as what is originally sent.

### Evento: 'rejectionHandled'

<!-- YAML
added: v1.4.1
-->

El evento `'rejectionHandled'` es emitido cuando una `Promise` ha sido rechazada y se adjuntó un manejador de errores (utilizando [`promise.catch()`][], por ejemplo) después de un giro del bucle de evento de Node.js.

El callback del oyente es invocado con una referencia a la `Promise` rechazada como el único argumento.

El objeto `Promise` habría sido previamente emitido en un evento `'unhandledRejection'`, pero durante el curso del procesamiento ganó un manejador de rechazos.

No hay noción de un nivel superior para una cadena de `Promise` en la cual los rechazos pueden ser siempre manejados. Ser inherentemente asíncrono en naturaleza, un rechazo de una `Promise` puede ser manejado en un punto futuro del tiempo — posiblemente más tarde que el giro del bucle de evento que el evento `'unhandledRejection'` sea emitido.

Otra manera de decir esto es que, a diferencia de en el código síncrono, donde hay una lista de excepciones sin manejar que está en constante crecimiento, con las Promesas puede haber una lista creciente y decreciente de rechazos no manejados.

En el código síncrono, el evento `'uncaughtException'` es emitido cuando la lista de excepciones no manejadas crece.

En el código asíncrono, el evento `'unhandledRejection'` es emitido cuando la lista de rechazos no manejados crece, y el evento `'rejectionHandled'` es emitido cuando decrece la listas de rechazos no manejados.

For example:

```js
const unhandledRejections = new Map();
process.on('unhandledRejection', (reason, p) => {
  unhandledRejections.set(p, reason);
});
process.on('rejectionHandled', (p) => {
  unhandledRejections.delete(p);
});
```

En este ejemplo, el `unhandledRejections` `Map` crecerá y decrecerá con el tiempo, reflejando rechazos que inician sin ser manejados y pasen a ser manejados. Es posible registrar dichos errores en un registro de errores, de manera periódica (que es probablemente lo más adecuado para aplicaciones de larga ejecución) o al salir del proceso (que es posiblemente lo más conveniente para scripts).

### Evento: 'uncaughtException'

<!-- YAML
added: v0.1.18
-->

El evento `'uncaughtException'` es emitido cuando una excepción no capturada de JavaScript vuelve al bucle de eventos. Por defecto, Node.js maneja dichas excepciones imprimiendo el stack trace en `stderr` y cerrándose. Añadir un manejador para el evento `'uncaughtException'` anula este comportamiento predeterminado.

La función oyente es llamada con el objeto `Error` pasado como el único argumento.

For example:

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

#### Advertencia: Utilizar `'uncaughtException'` correctamente

Note que `'uncaughtException'` es un mecanismo crudo para el manejo de excepciones destinadas a ser utilizadas solo como último recurso. El evento *no debe* ser utilizado como un equivalente a `On Error Resume Next`. Las excepciones no manejadas intrínsecamente significan que una aplicación está en un estado indefinido. Intentar reanudar el código de la aplicación sin recuperarse apropiadamente de la excepción puede causar problemas adicionales impredecibles e imprevisibles.

Las excepciones arrojadas desde dentro del manejador de eventos no serán capturadas. En su lugar, el proceso se cerrará con un código de salida distinto de cero y el stack trace será impreso. Esto es para evitar una recursión infinita.

Intentar reanudar normalmente luego de una excepción no capturada puede ser similar a desconectar la energía cuando se está actualizando una computadora — nueve de diez veces no ocurre nada - pero la décima vez, el sistema se corrompe.

El uso correcto de `'uncaughtException'` es para realizar la limpieza sincrónica de recursos asignados (por ejemplo, descriptores de archivos, manejadores, etc.) antes de finalizar el proceso. **No es seguro reanudar el funcionamiento normal luego de `'uncaughtException'`.**

Para reiniciar una aplicación detenida de una manera más fiable, si `uncaughtException` es emitida o no, un monitor externo debe ser empleado en un proceso separado para detectar fallos de aplicación y recuperar o reiniciar si es necesario.

### Evento: 'unhandledRejection'

<!-- YAML
added: v1.4.1
changes:

  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8217
    description: Not handling Promise rejections has been deprecated.
  - version: v6.6.0
    pr-url: https://github.com/nodejs/node/pull/8223
    description: Unhandled Promise rejections will now emit
                 a process warning.
-->

El evento `'unhandledRejection`' es emitido si una `Promise` es rechazada y no hay un manejador de errores adjunto a la promesa dentro de un giro del bucle de evento. Al programar con Promesas, las excepciones son encapsuladas como "promesas rechazadas". Los rechazos pueden ser capturados y manejados utilizando [`promise.catch()`][] y son propagados a través de una cadena `Promise`. El evento `'unhandledRejection'` es útil para detectar y hacer seguimiento de promesas que fueron rechazadas y cuyos rechazos todavía no han sido manejados.

La función oyente es llamada con los siguientes argumentos:

* `reason` {Error|any} El objeto con el cual la promesa fue rechazada (típicamente un objeto [`Error`][]).
* `p` de la `Promise` que fue rechazada.

For example:

```js
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

somePromise.then((res) => {
  return reportToUser(JSON.pasre(res)); // note the typo (`pasre`)
}); // no `.catch` or `.then`
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

En este caso de ejemplo, es posible rastrear el rechazo como un error de desarrollador, como sería típicamente el caso para otros eventos `'unhandledRejection'`. Para abordar tales fallos, un manejador [`.catch(() => { })`][`promise.catch()`] no operacional puede ser adjuntado a `resource.loaded`, el cual evitará que el evento `'unhandledRejection'` sea emitido. Alternativamente, el evento [`'rejectionHandled'`][] puede ser usado.

### Evento: 'warning'

<!-- YAML
added: v6.0.0
-->

El evento `'warning'` es emitido cada vez que Node.js emite una advertencia del proceso.

Una advertencia de proceso es similar a un error en el sentido de que describe condiciones excepcionales que son traídas a la atención del usuario. Sin embargo, las advertencias no son parte del flujo normal de manejo de errores de Node.js y JavaScript. Node.js can emit warnings whenever it detects bad coding practices that could lead to sub-optimal application performance, bugs, or security vulnerabilities.

La función oyente es llamada con un argumento `warning` cuyo valor es un objeto `Error`. Existen tres propiedades clave que describen las advertencias:

* `name` {string} El nombre de la advertencia (actualmente `Warning` por defecto).
* `message` {string} Una descripción de la advertencia proporcionada por el sistema.
* `stack` {string} Un stack trace a la ubicación en el código en el que se emitió la advertencia.

```js
process.on('warning', (warning) => {
  console.warn(warning.name);    // Imprime el nombre de la advertencia
  console.warn(warning.message); // Imprime el mensaje de la advertencia
  console.warn(warning.stack);   // Imprime el stack trace
});
```

Por defecto, Node.js imprimirá advertencias de proceso en `stderr`. La opción de línea de comando `--no-warnings` puede ser utilizada para suprimir la salida predeterminada de la consola, pero el evento `'warning'` seguirá siendo emitido por el objeto `process`.

El siguiente ejemplo ilustra la advertencia que es impresa en `stderr` cuando se han añadido demasiados listeners a un evento

```txt
$ node
> events.defaultMaxListeners = 1;
> process.on('foo', () => {});
> process.on('foo', () => {});
> (node:38638) MaxListenersExceededWarning: Possible EventEmitter memory leak
detected. 2 foo listeners added. Use emitter.setMaxListeners() to increase limit
```

En contraste, el siguiente ejemplo desactiva el output de la advertencia predeterminado y agrega un manejador personalizado al evento `'warning'`:

```txt
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

Las banderas de línea de comandos `*-deprecation` sólo afectan las advertencias que utilizan el nombre `DeprecationWarning`.

#### Emisión de advertencias personalizadas

See the [`process.emitWarning()`](#process_process_emitwarning_warning_type_code_ctor) method for issuing custom or application-specific warnings.

### Eventos de Señal

<!--type=event-->

<!--name=SIGINT, SIGHUP, etc.-->

Los eventos de señal serán emitidos cuando el proceso Node.js reciba una señal. Por favor, dirigirse a signal(7) para obtener un listado de nombres de señal estándares de POSIX, como `SIGINT`, `SIGHUP`, etc.

The signal handler will receive the signal's name (`'SIGINT'`, `'SIGTERM'`, etc.) as the first argument.

El nombre de cada evento será el nombre común en mayúscula para la señal (p. ej., `'SIGINT'` para señales `SIGINT`).

Por ejemplo:

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

* `SIGUSR1` is reserved by Node.js to start the [debugger](debugger.html). It's possible to install a listener but doing so might interfere with the debugger.
* `SIGTERM` and `SIGINT` have default handlers on non-Windows platforms that reset the terminal mode before exiting with code `128 + signal number`. If one of these signals has a listener installed, its default behavior will be removed (Node.js will no longer exit).
* `SIGPIPE` es ignorado por defecto. Puede tener un listener instalado.
* `SIGHUP` es generado en Windows cuando la ventana de consola es cerrada, y en otras plataformas bajo varias condiciones similares, véase signal(7). Puede tener instalado un listener, sin embargo, Node.js será terminado incondicionalmente por Windows unos 10 segundos después. En plataformas diferentes a Windows, el comportamiento predeterminado de `SIGHUP` es terminar Node.js, pero una vez que sea instalado un listener, su comportamiento por defecto será eliminado.
* `SIGTERM` no está soportado en Windows, puede ser escuchado.
* `SIGINT` from the terminal is supported on all platforms, and can usually be generated with `<Ctrl>+C` (though this may be configurable). No es generado cuando el terminal está habilitado en modo raw.
* `SIGBREAK` es entregado en Windows cuando se presiona `<Ctrl>+<Break>`, en plataformas diferentes a Windows puede ser escuchado, pero no hay manera de enviarlo o generarlo.
* `SIGWINCH` es entregado cuando la consola ha sido redimensionada. En Windows, esto solo ocurrirá al escribir en la consola cuando se mueva el cursor, o cuando se use un tty legible en modo raw.
* `SIGKILL` no puede tener un listener instalado, Node.js será terminado incondicionalmente en toda las plataformas.
* `SIGSTOP` no puede tener un listener instalado.
* `SIGBUS`, `SIGFPE`, `SIGSEGV` y `SIGILL`, cuando no se levantan artificialmente utilizando kill(2), de manera inherente, dejan al proceso en un estado desde el cual no es seguro intentar llamar a los listeners de JS. Hacer esto puede llevar al proceso a colgarse en un bucle infinito, ya que los listeners conectados mediante `process.on()` son llamados de manera asíncrona y, por lo tanto, no pueden de corregir el problema subyacente.

*Nota*: Windows no soporta el envío de señales, pero Node.js ofrece alguna emulación con [`process.kill()`][] y [`subprocess.kill()`][]. El envío de la señal `0` puede ser utilizado para probar la existencia de un proceso. El envío de `SIGINT`, `SIGTERM` y `SIGKILL` causa la terminación incondicional del proceso objetivo.

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

La propiedad `process.arch` devuelve una string que identifica la arquitectura del CPU del sistema operativo para la cual el binario de Node.js se compiló.

Actualmente, los valores posibles son: `'arm'`, `'arm64'`, `'ia32'`, `'mips'`, `'mipsel'`, `'ppc'`, `'ppc64'`, `'s390'`, `'s390x'`, `'x32'`, y `'x64'`.

```js
console.log(`This processor architecture is ${process.arch}`);
```

## process.argv

<!-- YAML
added: v0.1.27
-->

* {Array}

La propiedad `process.argv` devuelve un arreglo que contiene los argumentos de la línea de comandos pasados cuando el proceso Node.js se inició. El primer elemento será [`process.execPath`]. Ver `process.argv0` si se necesita acceso al valor original de `argv[0]`. El segundo elemento será la ruta al archivo de JavaScript que está siendo ejecutado. Los elementos restantes serán argumentos de línea de comandos adicionales cualesquiera.

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
added: 6.4.0
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

## process.channel

<!-- YAML
added: v7.1.0
-->

* {Object}

If the Node.js process was spawned with an IPC channel (see the [Child Process](child_process.html) documentation), the `process.channel` property is a reference to the IPC channel. If no IPC channel exists, this property is `undefined`.

## process.chdir(directory)

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

## process.config

<!-- YAML
added: v0.7.7
-->

* {Object}

La propiedad `process.config` devuelve un Objeto que contiene la representación de JavaScript de las opciones de configuración utilizadas para compilar el ejecutable actual de Node.js. Esto es igual que el archivo `config.gypi` que fue producido al ejecutar el script `./configure`.

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

*Nota*: La propiedad `process.config` **no** es de sólo lectura y hay módulos existentes en el ecosistema que son conocidos por extender, modificar o reemplazar completamente el valor de `process.config`.

## process.connected

<!-- YAML
added: v0.7.2
-->

* {boolean}

Si el proceso Node.js se genera con un canal IPC (ver la documentación de [Procesos Secundarios](child_process.html) y de [Cluster](cluster.html)), la propiedad `process.connected` devolverá `true` siempre que el canal IPC esté conectado y devolverá `false` después de que `process.disconnect()` es llamada.

Una vez que `process.connected` es `false`, ya no es posible enviar mensajes sobre el canal IPC utilizando `process.send()`.

## process.cpuUsage([previousValue])

<!-- YAML
added: v6.1.0
-->

* `previousValue` {Object} Un valor de retorno previo a llamar a `process.cpuUsage()`
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

## process.cwd()

<!-- YAML
added: v0.1.8
-->

* Devuelve: {string}

El método `process.cwd()` devuelve el directorio de trabajo actual del proceso Node.js.

```js
console.log(`Current directory: ${process.cwd()}`);
```

## process.debugPort

<!-- YAML
added: v0.7.2
-->

* {number}

El puerto usado por el depurador de Node.js cuando está habilitado.

```js
process.debugPort = 5858;
```

## process.disconnect()

<!-- YAML
added: v0.7.2
-->

Si el proceso Node.js es generado con un canal IPC (vea la documentación del [Proceso Secundario](child_process.html) y de [Cluster](cluster.html)), el método `process.disconnect()` cerrará el canal IPC para el proceso primario, permitiendo que el proceso secundario se cierre con gracia una vez no haya ninguna otra conexión que lo mantenga con vida.

El efecto de llamar a `process.disconnect()` es el mismo que el de llamar a [`ChildProcess.disconnect()`][] del proceso primario.

Si el proceso Node.js no fue generado con un canal IPC, `process.disconnect()` será `undefined`.

## process.emitWarning(warning[, options])

<!-- YAML
added: 8.0.0
-->

* `warning` {string|Error} La advertencia a emitir.
* `options` {Object} 
    * `type` {string} When `warning` is a String, `type` is the name to use for the *type* of warning being emitted. **Default:** `Warning`.
    * `code` {string} Un identificador único para la instancia de la advertencia que se emite.
    * `ctor` {Function} `warning` es una String, `ctor` es una función opcional utilizada para limitar el stack trace generado. **Predeterminado:** `process.emitWarning`.
    * `detail` {string} Texto adicional a incluir con el error.

El método `process.emitWarning()` puede ser utilizado para emitir advertencias de proceso personalizadas o específicas de aplicación. Estas pueden ser escuchadas añadiendo un manejador al evento [`process.on('warning')`](#process_event_warning).

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

In this example, an `Error` object is generated internally by `process.emitWarning()` and passed through to the [`process.on('warning')`](#process_event_warning) event.

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

* `warning` {string|Error} La advertencia a emitir.
* `type` {string} When `warning` is a String, `type` is the name to use for the *type* of warning being emitted. **Default:** `Warning`.
* `code` {string} Un identificador único para la instancia de la advertencia que se emite.
* `ctor` {Function} `warning` es una String, `ctor` es una función opcional utilizada para limitar el stack trace generado. **Predeterminado:** `process.emitWarning`.

El método `process.emitWarning()` puede ser utilizado para emitir advertencias de proceso personalizadas o específicas de aplicación. Estas pueden ser escuchadas añadiendo un manejador al evento [`process.on('warning')`](#process_event_warning).

```js
// Emitir una advertencia utilizando una string.
process.emitWarning('Something happened!');
// Emite: (node: 56338) Advertencia: Something happened!
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

En cada uno de los ejemplos previos, un objeto `Error` es generado internamente por `process.emitWarning()` y pasado a través del evento [`process.on('warning')`](#process_event_warning).

```js
process.on('warning', (warning) => {
  console.warn(warning.name);
  console.warn(warning.message);
  console.warn(warning.code);
  console.warn(warning.stack);
});
```

If `warning` is passed as an `Error` object, it will be passed through to the `process.on('warning')` event handler unmodified (and the optional `type`, `code` and `ctor` arguments will be ignored):

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

Note que, aunque las advertencias de proceso utiliza objetos `Error`, el mecanismo de advertencia de proceso **no** es un reemplazo para los mecanismos normales de manejo de errores.

The following additional handling is implemented if the warning `type` is `DeprecationWarning`:

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

## process.env

<!-- YAML
added: v0.1.27
-->

* {Object}

La propiedad `process.env` devuelve un objeto que contiene el entorno del usuario. Vea environ(7).

Un ejemplo de este objeto luce así:

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

Es posible modificar este objeto, pero tales modificaciones no serán reflejadas fuera del proceso Node.js. En otras palabras, el siguiente ejemplo no funcionará:

```console
$ node -e 'process.env.foo = "bar"' && echo $foo
```

Mientras que el siguiente sí:

```js
process.env.foo = 'bar';
console.log(process.env.foo);
```

Asignar una propiedad en `process.env` convertirá implícitamente el valor a una string.

Ejemplo:

```js
process.env.test = null;
console.log(process.env.test);
// => 'null'
process.env.test = undefined;
console.log(process.env.test);
// => 'undefined'
```

Utilice `delete` para eliminar una propiedad de `process.env`.

Ejemplo:

```js
process.env.TEST = 1;
delete process.env.TEST;
console.log(process.env.TEST);
// => undefined
```

En sistemas operativos Windows, las variables de entorno no distinguen entre minúscula y mayúscula.

Ejemplo:

```js
process.env.TEST = 1;
console.log(process.env.test);
// => 1
```

## process.execArgv

<!-- YAML
added: v0.7.7
-->

* {Array}

La propiedad `process.execArgv` devuelve el conjunto de opciones de línea de comandos específicas de Node.js pasadas cuando el proceso Node.js fue lanzado. Estas opciones no aparecen en el arreglo devuelto por la propiedad [`process.argv`][], y no incluyen el ejecutable de Node.js, el nombre del script, o cualquier opción que sigua al nombre del script. Estas opciones son útiles para generar procesos secundarios con el mismo entorno de ejecución que el proceso primario.

For example:

```console
$ node --harmony script.js --version
```

Resulta en `process.execArgv`:

<!-- eslint-disable semi -->

```js
['--harmony']
```

Y `process.argv`:

<!-- eslint-disable semi -->

```js
['/usr/local/bin/node', 'script.js', '--version']
```

## process.execPath

<!-- YAML
added: v0.1.100
-->

* {string}

La propiedad `process.execPath` devuelve el nombre de ruta absoluto del ejecutable que inició el proceso Node.js.

For example:

<!-- eslint-disable semi -->

```js
'/usr/local/bin/node'
```

## process.exit([code])

<!-- YAML
added: v0.1.13
-->

* `code` {integer} El código de salida. **Predeterminado:** `0`.

El método `process.exit()` indica a Node.js que finalice el proceso de forma sincrónica con un estado de salida de `code`. Si `code` es omitido, la salida utiliza el código de 'success' `0` o el valor de `process.exitCode` si ha sido establecido. Node.js no terminará hasta que todos los listeners del evento [`'exit'`] sean llamados.

Para salir con un código 'failure':

```js
process.exit(1);
```

La shell que ejecutó Node.js debería ver el código de salida como `1`.

Calling `process.exit()` will force the process to exit as quickly as possible even if there are still asynchronous operations pending that have not yet completed fully, including I/O operations to `process.stdout` and `process.stderr`.

En la mayoría de las situaciones, no es realmente necesario llamar a `process.exit()` explícitamente. El proceso Node.js se saldrá por su propia cuenta *si no hay trabajo adicional pendiente* en el bucle de evento. La propiedad `process.exitCode` puede establecerse para decirle al proceso cuál es el código de salida a utilizar cuando el proceso se cierre de forma exitosa.

Por ejemplo, el siguiente ejemplo ilustra un *mal uso* del método `process.exit()` que puede conducir a que los datos impresos en stdout sean truncados o perdidos:

```js
// Esto es un ejemplo de qué *no* hacer:
if (someConditionNotMet()) {
  printUsageToStdout();
  process.exit(1);
}
```

Las razón por la que esto es problemático es que las escrituras a `process.stdout` en Node.js son a veces *asíncronas* y pueden ocurrir sobre múltiples ticks del bucle del evento de Node.js. Llamar a `process.exit()`, sin embargo, fuerza al proceso a salir *antes* de que se realicen esas escrituras adicionales en `stdout`.

En lugar de llamar directamente a `process.exit()`, el código *debe* establecer el `process.exitCode` y permitir al proceso salir naturalmente evitando programar cualquier trabajo adicional para el bucle de evento:

```js
// Cómo establecer correctamente el código de salida al dejar
// que el proceso se cierre con gracia.
if (someConditionNotMet()) {
  printUsageToStdout();
  process.exitCode = 1;
}
```

Si es necesario terminar el proceso Node.js debido a una condición de error, arrojar un error *no capturado* y permitir que el proceso termine como corresponde, es más seguro que llamar a `process.exit()`.

## process.exitCode

<!-- YAML
added: v0.11.8
-->

* {integer}

Un número que será el código de salida del proceso, cuando el proceso se cierre exitosamente, o se cierre a través de [`process.exit()`][] sin especificar un código.

Especificar un código a [`process.exit(code)`][`process.exit()`] anulará cualquier configuración previa de `process.exitCode`.

## process.getegid()

<!-- YAML
added: v2.0.0
-->

El método `process.getegid()` devuelve la identidad numérica efectiva del grupo del proceso Node.js. (Ver getegid(2).)

```js
if (process.getegid) {
  console.log(`Current gid: ${process.getegid()}`);
}
```

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.geteuid()

<!-- YAML
added: v2.0.0
-->

* Devuelve: {Object}

El método `process.geteuid()` devuelve la identidad numérica efectiva del usuario del proceso. (Ver geteuid(2).)

```js
if (process.geteuid) {
  console.log(`Current uid: ${process.geteuid()}`);
}
```

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.getgid()

<!-- YAML
added: v0.1.31
-->

* Devuelve: {Object}

El método `process.getgid()` devuelve la identidad numérica efectiva del grupo del proceso. (Ver getgid(2).)

```js
if (process.getgid) {
  console.log(`Current gid: ${process.getgid()}`);
}
```

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.getgroups()

<!-- YAML
added: v0.9.4
-->

* Devuelve: {Array}

El método `process.getgroups()` devuelve un arreglo con los IDs de grupo suplementarios. POSIX lo deja sin especificar si el ID efectivo del grupo es incluido, pero Node.js asegura que siempre lo está.

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.getuid()

<!-- YAML
added: v0.1.28
-->

* Devuelve: {integer}

El método `process.getuid()` devuelve la identidad numérica efectiva de usuario del proceso. (Ver getuid(2).)

```js
if (process.getuid) {
  console.log(`Current uid: ${process.getuid()}`);
}
```

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.hrtime([time])

<!-- YAML
added: v0.7.6
-->

* `time` {Array} The result of a previous call to `process.hrtime()`
* Devuelve: {Array}

The `process.hrtime()` method returns the current high-resolution real time in a `[seconds, nanoseconds]` tuple Array, where `nanoseconds` is the remaining part of the real time that can't be represented in second precision.

`time` is an optional parameter that must be the result of a previous `process.hrtime()` call to diff with the current time. If the parameter passed in is not a tuple Array, a `TypeError` will be thrown. Passing in a user-defined array instead of the result of a previous call to `process.hrtime()` will lead to undefined behavior.

Estos tiempos son relativos a un tiempo arbitrario en el pasado, y no están relacionados a las horas del día y, por lo tanto, no están sujetos a la deriva del reloj. El uso principal es para medir el rendimiento entre los intervalos:

```js
const NS_PER_SEC = 1e9;
const time = process.hrtime();
// [ 1800216, 25 ]

setTimeout(() => {
  const diff = process.hrtime(time);
  // [ 1, 552 ]

  console.log(`Benchmark took ${diff[0] * NS_PER_SEC + diff[1]} nanoseconds`);
  // el punto de referencia tomó 1000000552 nanosegundos
}, 1000);
```

## process.initgroups(user, extra_group)

<!-- YAML
added: v0.9.4
-->

* `user` {string|number} El nombre de usuario o identificador numérico.
* `extra_group` {string|number} Un nombre de grupo o identificador numérico.

El método `process.initgroups()` lee el archivo `/etc/group` e inicializa la lista de acceso de grupo, utilizando todos los grupos en los cuales el usuario es miembro. Esta es una operación privilegiada que requiere que el proceso Node.js tenga acceso a `root` o la capacidad `CAP_SETGID`.

Note que se debe tener cuidado al eliminar privilegios. Ejemplo:

```js
console.log(process.getgroups());         // [ 0 ]
process.initgroups('bnoordhuis', 1000);   // cambia el usuario
console.log(process.getgroups());         // [ 27, 30, 46, 1000, 0 ]
process.setgid(1000);                     // elimina el gid del root
console.log(process.getgroups());         // [ 27, 30, 46, 1000 ]
```

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.kill(pid[, signal])

<!-- YAML
added: v0.0.6
-->

* `pid` {number} Un ID de proceso
* `signal` {string|number} La señal a enviar, como una string o un número. **Predeterminado:** `'SIGTERM'`.

El método `process.kill()` envía la `signal` al proceso identificado por `pid`.

Los nombres de las señales son strings tales como `'SIGINT'` o `'SIGHUP'`. Ver [Eventos de Senal](#process_signal_events) y kill(2) para mayor información.

Este método arrojará un error si el `pid` objetivo no existe. Como un caso especial, una señal de `0` puede ser utilizada para probar la existencia de un proceso. Las plataformas Windows arrojarán un error si el `pid` es utilizado para matar un grupo de procesos.

*Note*: Even though the name of this function is `process.kill()`, it is really just a signal sender, like the `kill` system call. The signal sent may do something other than kill the target process.

Por ejemplo:

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

*Note*: When `SIGUSR1` is received by a Node.js process, Node.js will start the debugger, see [Signal Events](#process_signal_events).

## process.mainModule

<!-- YAML
added: v0.1.17
-->

* {Object}

La propiedad `process.mainModule` proporciona una manera alternativa de recuperar [`require.main`][]. La diferencia es que si el módulo principal cambia en tiempo de ejecución, [`require.main`][] aún puede referirse al módulo principal original en los módulos que se requerían antes de que ocurriera el cambio. Generalmente, es seguro asumir que ambos se refieren al mismo módulo.

Al igual que con [`require.main`][], `process.mainModule` será `undefined` si no hay un script de entrada.

## process.memoryUsage()

<!-- YAML
added: v0.1.16
changes:

  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9587
    description: Added `external` to the returned object.
-->

* Devuelve: {Object} 
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

<!-- eslint-skip -->

```js
{
  rss: 4935680,
  heapTotal: 1826816,
  heapUsed: 650472,
  external: 49879
}
```

`heapTotal` y `heapUsed` se refieren al uso de memoria de V8. `external` se refiere al uso de memoria de objetos C++ vinculados a objetos JavaScript administrados por V8. `rss`, por sus siglas en inglés "Resident Set Size", es la cantidad de espacio ocupado en la memoria principal del dispositivo (que es un subconjunto de la memoria total asignada) para el proceso, la cual incluye el *montículo*, el *segmento de código* y la *pila*.

El *montículo* es donde los objetos, strings y cierres son almacenados. Las variables son almacenadas en la *pila* y el código JavaScript real reside en el *segmento de código*.

## process.nextTick(callback[, ...args])

<!-- YAML
added: v0.1.26
changes:

  - version: v1.8.1
    pr-url: https://github.com/nodejs/node/pull/1077
    description: Additional arguments after `callback` are now supported.
-->

* `callback` {Function}
* `...args` {any} Argumentos adicionales a pasar al invocar el `callback`

El método `process.nextTick()` añade el `callback` a la "cola de siguiente tramo". Una vez que el turno actual del bucle de evento se complete, se llamarán todas las callbacks actualmente en la cola de siguiente tramo.

Este *no* es un simple alias de [`setTimeout(fn, 0)`][]. Es mucho más eficiente. Se ejecuta antes de que los eventos adicionales de I/O (incluyendo temporizadores) se activen en tramos subsecuentes del bucle de evento.

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

Esto es importante al desarrollar APIs para dar a los usuarios la oportunidad de asignar manejadores de evento *luego* de que un objeto haya sido construido pero antes de que cualquier I/O haya ocurrido:

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
// ¡ADVERTENCIA!  ¡NO LO UTILICE!  ¡MALO, INSEGURO, PELIGROSO!
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

*Note*: The next tick queue is completely drained on each pass of the event loop **before** additional I/O is processed. Como resultado, establecer recursivamente los callbacks de nextTick bloquearán la ocurrencia de cualquier I/O, así como un bucle `while(true);`.

## process.noDeprecation

<!-- YAML
added: v0.8.0
-->

* {boolean}

La propiedad `process.noDeprecation` indica si la bandera `--no-deprecation` está establecida en el proceso Node.js actual. See the documentation for the [`warning` event](#process_event_warning) and the [`emitWarning` method](#process_process_emitwarning_warning_type_code_ctor) for more information about this flag's behavior.

## process.pid

<!-- YAML
added: v0.1.15
-->

* {integer}

La propiedad `process.pid` devuelve el PID del proceso.

```js
console.log(`This process is pid ${process.pid}`);
```

## process.platform

<!-- YAML
added: v0.1.16
-->

* {string}

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

## process.ppid

<!-- YAML
added: v8.10.0
-->

* {integer}

La propiedad `process.ppid` devuelve el PID del proceso primario actual.

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

La propiedad `process.release` devuelve un Objeto que contiene los metadatos relacionados al lanzamiento actual, incluyendo URLs para el tarball fuente y los tarballs de solo cabeceras.

`process.release` contiene las siguientes propiedades:

* `name` {string} un valor que siempre será `'node'` para Node.js. Para versiones legacy io.js, este será `'io.js'`.
* `sourceUrl` {string} una URL absoluta que apunta a una archivo *`.tar.gz`* que contiene el código fuente de la versión actual.
* `headersUrl`{string} una URL absoluta que apunta a un archivo *`.tar.gz`* que contiene sólo los archivos fuente de cabecera para la versión actual. Este archivo es significativamente más pequeño que el archivo fuente completo y puede ser utilizado para compilar los complementos nativos de Node.js.
* `libUrl` {string} una URL absoluta que apunta a un archivo *`node.lib`* que coincide con la arquitectura y versión del lanzamiento actual. Este archivo es utilizado para compilar complementos nativos de Node.js. *Esta propiedad sólo está presente en construcciones Windows de Node.js y no aparecerá en ninguna otra plataforma.*
* `lts` {string} una etiqueta de string que identifica la etiqueta [LTS](https://github.com/nodejs/LTS/) para esta versión. Esta propiedad sólo existe en versiones LTS y es `undefined` para todos los otros tipos de versiones, incluyendo las versions *Actuales*. Actualmente, lo valores válidos son: 
    * `'Argon'` para la línea LTS 4.x que comienza con 4.2.0.
    * `'Boron'` para la línea LTS 6.x que comienza con 6.9.0.
    * `'Carbon'` para la línea LTS 8.x que comienza con 8.9.1.

Por ejemplo:

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

En builds personalizados de versiones no lanzadas del árbol de origen, solo puede estar presente la propiedad `name`. No se debe confiar en que las propiedades adicionales existan.

## process.send(message\[, sendHandle[, options]\]\[, callback\])

<!-- YAML
added: v0.5.9
-->

* `message` {Object}
* `sendHandle` {Handle object}
* `opciones` {Object}
* `callback` {Function}
* Devuelve: {boolean}

Si Node.js se genera con un canal IPC, el método `process.send()` puede ser utilizado para enviar mensajes al proceso primario. Los mensajes serán recibidos como un evento [`'message'`][] en el objeto [`ChildProcess`][] del proceso primario.

Si Node.js no fue generado con un canal IPC, `process.send()` será `undefined`.

*Note*: The message goes through serialization and parsing. The resulting message might not be the same as what is originally sent.

## process.setegid(id)

<!-- YAML
added: v2.0.0
-->

* `id` {string|number} Un nombre o ID de grupo

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

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.seteuid(id)

<!-- YAML
added: v2.0.0
-->

* `id` {string|number} Un nombre o ID de usuario

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

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.setgid(id)

<!-- YAML
added: v0.1.31
-->

* `id` {string|number} El nombre o ID del grupo

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

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.setgroups(groups)

<!-- YAML
added: v0.9.4
-->

* `groups` {Array}

El método `process.setgroups()` establece los IDs de grupo suplementarios para el proceso Node.js. Esta es una operación privilegiada que requiere que el proceso Node.js tenga `root` o la capacidad `CAP_SETGID`.

El arreglo `groups` puede contener IDs de grupo numéricos, nombres de grupo o ambos.

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.setuid(id)

<!-- YAML
added: v0.1.28
-->

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

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.stderr

* {Stream}

La propiedad `process.stderr` devuelve un stream conectado a `stderr` (descriptor de archivo `2`). Es un [`net.Socket`][] (el cual es un stream [Dúplex](stream.html#stream_duplex_and_transform_streams)) a menos que el descriptor de archivo `2` haga referencia a un archivo, en cuyo caso es un stream [Esribible](stream.html#stream_writable_streams).

*Note*: `process.stderr` differs from other Node.js streams in important ways, see [note on process I/O](process.html#process_a_note_on_process_i_o) for more information.

## process.stdin

* {Stream}

La propiedad `process.stdin` devuelve un stream conectado a `stdin` (descriptor de archivo `0`). Es un [`net.Socket`][] (el cual es un stream [Dúplex](stream.html#stream_duplex_and_transform_streams)) a menos que el descriptor de archivo `0` haga referencia a un archivo, en cuyo caso es un stream [Legible](stream.html#stream_readable_streams).

Por ejemplo:

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

Como un stream [Dúplex](stream.html#stream_duplex_and_transform_streams), `process.stdin` también puede ser utilizado en el modo "antiguo" que es compatible con scripts escritos para Node.js anterior a la v0.10. Para más información ver [Compatibilidad de stream](stream.html#stream_compatibility_with_older_node_js_versions).

*Nota*: En el modo "antiguo" de los streams el stream `stdin` es pausado por defecto, por lo que se debe llamar a `process.stdin.resume()` para leerlo. Note que el llamar a `process.stdin.resume()` también cambiaría el stream al modo "antiguo".

## process.stdout

* {Stream}

La propiedad `process.stdout` devuelve un stream conectado a `stdout` (descriptor de archivo `1`). Es un [`net.Socket`][] (el cual es un stream [Dúplex](stream.html#stream_duplex_and_transform_streams)) a menos que el descriptor de archivo `1` haga referencia a un archivo, en cuyo caso es un stream [Escribible](stream.html#stream_writable_streams).

Por ejemplo, para copiar process.stdin en process.stdout:

```js
process.stdin.pipe(process.stdout);
```

*Note*: `process.stdout` differs from other Node.js streams in important ways, see [note on process I/O](process.html#process_a_note_on_process_i_o) for more information.

### Una nota sobre I/O de procesos

`process.stdout` y `process.stderr` difieren de otros streams de Node.js d maneras importantes:

1. Son utilizadas internamente por [`console.log()`][] y [`console.error()`][], respectivamente.
2. Las escrituras pueden ser sincrónicas, dependiendo de a qué esté conectado el stream y si el sistema es Windows o POSIX: 
    * Archivos: *sincrónicos* en Windows y POSIX
    * TTYs (Terminales): *asíncronos* en Windows, *sincrónicos* en POSIX
    * Pipes (y sockets): *sincrónicos* en Windows, *asíncronos* en POSIX

Estos comportamientos de deben, en parte, a razones históricas, y cambiarlos crearía incompatibilidad con versiones anteriores, pero también son esperados por algunos usuarios.

Las escrituras sincrónicas evitan problemas tales como el output escrito con `console.log()` o `console.error()` sea intercalado inesperadamente, o no se escriba en absoluto si `process.exit()` es llamado antes de que se complete la escritura asíncrona. Ver [`process.exit()`][] para más información.

***Advertencia***: Las escrituras sincrónicas bloquean el bucle de eventos hasta que la escritura se ha completado. Esto puede ser casi instantáneo en el caso del output a un archivo, pero con una carga alta del sistema, los pipes que no están siendo leídos en el extremo receptor, o con terminales o sistemas de archivos lentos, es posible que el bucle de eventos sea bloqueado con la suficiente frecuencia o el tiempo suficiente para tener graves impactos negativos en el rendimiento. Esto puede no ser un problema al escribir en una sesión de terminal interactiva, pero considere esto de forma particularmente cuidadosa al hacer el registro de producción para los streams de salida del proceso.

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

## process.throwDeprecation

<!-- YAML
added: v0.9.12
-->

* {boolean}

La propiedad `process.throwDeprecation` indica si a bandera `--throw-deprecation` está establecida en el proceso Node.js actual. See the documentation for the [`warning` event](#process_event_warning) and the [`emitWarning` method](#process_process_emitwarning_warning_type_code_ctor) for more information about this flag's behavior.

## process.title

<!-- YAML
added: v0.1.104
-->

* {string}

La propiedad `process.title` devuelve el título del proceso actual (p.ej., devuelve el valor actual de `ps`). Asignar un nuevo valor a `process.title` modifica el valor actual de `ps`.

*Note*: When a new value is assigned, different platforms will impose different maximum length restrictions on the title. Usually such restrictions are quite limited. For instance, on Linux and macOS, `process.title` is limited to the size of the binary name plus the length of the command line arguments because setting the `process.title` overwrites the `argv` memory of the process. Node.js v0.8 allowed for longer process title strings by also overwriting the `environ` memory but that was potentially insecure and confusing in some (rather obscure) cases.

## process.traceDeprecation

<!-- YAML
added: v0.8.0
-->

* {boolean}

La propiedad `process.traceDeprecation` indica si la bandera `--trace-deprecation` está establecida en el proceso Node.js actual. See the documentation for the [`warning` event](#process_event_warning) and the [`emitWarning` method](#process_process_emitwarning_warning_type_code_ctor) for more information about this flag's behavior.

## process.umask([mask])

<!-- YAML
added: v0.1.19
-->

* `mask` {number}

El método `process.umask()` establece o devuelve la máscara de creación de modo de archivo del proceso Node.js. Los procesos secundarios heredan la máscara del proceso primario. Invocado sin un argumento, se devuelve la máscara actual; de lo contrario, la umask se establece en el valor del argumento y se devuelve la máscara anterior.

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

* Devuelve: {number}

El método `process.uptime()` devuelve el número de segundos que se ha estado ejecutando el proceso Node.js actual.

*Note*: The return value includes fractions of a second. Utilice `Math.floor()` para obtener segundos completos.

## process.version

<!-- YAML
added: v0.1.3
-->

* {string}

La propiedad `process.version` devuelve la string de la versión de Node.js.

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
-->

* {Object}

La propiedad `process.versions` devuelve un objeto que enumera las strings de versiones de Node.js y sus dependencias. `process.versions.modules` indica la versión ABI actual, la cual es incrementada cada vez que cambia una API de C++. Node.js rechazará cargar módulos que fueron compilados contra una versión de módulo ABI diferente.

```js
console.log(process.versions);
```

Generará un objeto similar a:

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

## Código de Salida

Node.js normalmente se cerrará con un código de estado `0` cuando no hayan más operaciones asíncronas pendientes. Los siguientes códigos de estado son utilizados en otros casos:

* `1` **Excepción Fatal no Capturada** - Hubo una excepción no capturada, y no fue manejada por un dominio o por un manejador de evento [`'uncaughtException'`][].
* `2` - Sin utilizar (reservado por Bash para mal uso incorporado)
* `3` **Error Interno de Análisis de JavaScript** - El código fuente interno de JavaScript en el proceso de bootstrap de Node.js causó un error de análisis. Esto es extremadamente raro, y generalmente sólo puede pasar durante el desarrollo del mismo Node.js.
* `4` **Falla Interna de Evaluación de JavaScript** - El código fuente interno de JavaScript en el proceso de bootstrap de Node.js falló al devolver un valor de función al evaluarse. Esto es extremadamente raro, y generalmente sólo puede ocurrir durante el desarrollo del mismo Node.js.
* `5` **Error Fatal** - Hubo un error fatal irrecuperable en V8. Usualmente, se imprimirá un mensaje en stderr con el prefijo `FATAL
ERROR`.
* `6` **Manejador No-función de Excepción Interno** - Hubo una excepción no capturada, pero la función interna manejadora de excepción fatal de alguna manera fue establecida como una non-function, y no pudo ser llamada.
* `7` **Falla de Tiempo de Ejecución de Manejador de Excepciones Internas** - Hubo una excepción no capturada, y la función interna manejadora de excepciones fatales arrojó un error al intentar manejarla. Esto puede pasar, por ejemplo, si un manejador de [`'uncaughtException'`][] o `domain.on('error')` arroja un error.
* `8` - No utilizado. En versiones previas de Node.js, el código de cierre 8 a veces indicaba una excepción sin capturar.
* `9` - **Argumento Inválido** - Si una opción desconocida fue especificada, o una opción que requiere un valor fue proporcionada sin un valor.
* `10` **Falla Interna de Tiempo de Ejecución de JavaScript** - El código fuente interno de JavaScript en el proceso de bootstrap de Node.js arrojó un error cuando la función bootstrapping fue llamada. Esto es extremadamente raro, y generalmente sólo puede ocurrir durante el desarrollo del mismo Node.js.
* `12` **Argumento de Depuración Inválido** - Las opciones `--inspect` y/o `--inspect-brk` fueron establecidas, pero el número de puerto escogido era inválido o no estaba disponible.
* `>128` **Salidas de Señales** - Si Node.js recibe una señal fatal como `SIGKILL` o `SIGHUP`, entonces su código de salida será `128` más el valor del código de señal. Esta es una práctica estándar de POSIX, como los códigos de salida están definidos para ser enteros de 7 bits, y las salidas por señal establecen el bit de orden mayor, y entonces contienen el valor del código de señal.