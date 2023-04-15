# SO

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

El módulo `so` provee un número de métodos de utilidad relacionados al sistema operativo. Se puede acceder a él utilizando:

```js
const os = require('os');
```

## os.EOL

<!-- YAML
added: v0.7.8
-->

* {string}

Una constante de strings que define el marcador de fin de línea específico para el sistema operativo:

* `\n` en POSIX
* `\r\n\r\n` en Windows

## os.arch()

<!-- YAML
added: v0.5.0
-->

* Devuelve: {string}

El método `os.arch()` devuelve una string que identifica la arquitectura del CPU del sistema operativo para el cual el binario de Node.js fue compilado.

Actualmente, los valores posibles son: `'arm'`, `'arm64'`, `'ia32'`, `'mips'`, `'mipsel'`, `'ppc'`, `'ppc64'`, `'s390'`, `'s390x'`, `'x32'`, y `'x64'`.

Equivalente para [`process.arch`][].

## os.constants

<!-- YAML
added: v6.3.0
-->

* {Object}

Devuelve un objeto que contiene las constantes específicas del sistema operativo comúnmente utilizadas para códigos de error, señales de procesos, etc. Las constantes específicas actualmente definidas están descritas en [OS Constants](#os_os_constants_1).

## os.cpus()

<!-- YAML
added: v0.3.3
-->

* Retorno: {Object[]}

El método `os.cpus()` devuelve un array de objetos que contienen información sobre cada núcleo lógico del CPU.

Las propiedades incluidas en cada objeto incluyen:

* `model`{string}
* `speed` {number} (en MHz)
* `times` {Object} 
  * `user`{number} El número de milisegundos que el CPU ha estado en modo usuario.
  * `nice` {number} El número de milisegundos que el CPU ha estado en modo nice.
  * `sys` {number} El número de milisegundos que el CPU ha estado en modo sys.
  * `idle` {number} El número de milisegundos que el CPU ha estado en modo idle.
  * `irq` {number} El número de milisegundos que el CPU ha estado en modo irq.

<!-- eslint-disable semi -->

```js
[
  {
    model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
    speed: 2926,
    times: {
      user: 252020,
      nice: 0,
      sys: 30340,
      idle: 1070356870,
      irq: 0
    }
  },
  {
    model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
    speed: 2926,
    times: {
      user: 306960,
      nice: 0,
      sys: 26980,
      idle: 1071569080,
      irq: 0
    }
  },
  {
    model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
    speed: 2926,
    times: {
      user: 248450,
      nice: 0,
      sys: 21750,
      idle: 1070919370,
      irq: 0
    }
  },
  {
    model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
    speed: 2926,
    times: {
      user: 256880,
      nice: 0,
      sys: 19430,
      idle: 1070905480,
      irq: 20
    }
  },
  {
    model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
    speed: 2926,
    times: {
      user: 511580,
      nice: 20,
      sys: 40900,
      idle: 1070842510,
      irq: 0
    }
  },
  {
    model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
    speed: 2926,
    times: {
      user: 291660,
      nice: 0,
      sys: 34360,
      idle: 1070888000,
      irq: 10
    }
  },
  {
    model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
    speed: 2926,
    times: {
      user: 308260,
      nice: 0,
      sys: 55410,
      idle: 1071129970,
      irq: 880
    }
  },
  {
    model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
    speed: 2926,
    times: {
      user: 266450,
      nice: 1480,
      sys: 34920,
      idle: 1072572010,
      irq: 30
    }
  }
]
```

Because `nice` values are UNIX-specific, on Windows the `nice` values of all processors are always 0.

## os.endianness()

<!-- YAML
added: v0.9.4
-->

* Devuelve: {string}

El método`os.endianness()` devuelve una string que identifica la "endianidad" (cualidad de endian) del CPU *para el cual fue compilado el binario de Node.js*.

Los valores posibles son:

* `'BE'` para gran Endian
* `'LE'` para pequeño Endian.

## os.freemem()

<!-- YAML
added: v0.3.3
-->

* Retorno: {integer}

El método `os.freemem()` devuelve la cantidad de memoria del sistema libre, en bytes y como un entero.

## os.getPriority([pid])

<!-- YAML
added: v10.10.0
-->

* `pid` {integer} The process ID to retrieve scheduling priority for. **Default** `0`.
* Devuelve: {integer}

The `os.getPriority()` method returns the scheduling priority for the process specified by `pid`. If `pid` is not provided, or is `0`, the priority of the current process is returned.

## os.homedir()

<!-- YAML
added: v2.3.0
-->

* Devuelve: {string}

El método `os.homedir()` devuelve la carpeta de usuario del usuario actual como una string.

## os.hostname()

<!-- YAML
added: v0.3.3
-->

* Devuelve: {string}

El método `os.hostname()` devuelve el nombre del host del sistema operativo como una string.

## os.loadavg()

<!-- YAML
added: v0.3.3
-->

* Devuelve: {number[]}

El método `os.loadavg()` devuelve un array que contiene los promedios de carga de 1; 5 y 15 minutos.

El promedio de carga es una medida de la actividad del si, calculado por el sistema operativo y expresado como un número fraccionario. Por regla general, el promedio de carga idealmente debería ser menor que el número de CPUs lógicos en el sistema.

El promedio de carga es un concepto específico de Unix que no tiene ningún equivalente real en las plataformas de Windows. En Windows, el valor de retorno siempre es `[0, 0, 0]`.

## os.networkInterfaces()

<!-- YAML
added: v0.6.0
-->

* Devuelve: {Object}

El método `os.networkInterfaces()` devuelve un objeto que solo contiene las interfaces de red a las que se les ha asignado una dirección de red.

Cada clave en el objeto devuelto identifica una interfaz de red. El valor asociado es un array de objetos en el que cada uno describe una dirección de red asignada.

Las propiedades disponibles en la dirección de red asignada incluyen:

* `address` {string} La dirección IPv4 o IPv6 asignada
* `netmask` {string} La máscara de red IPv4 o IPv6
* `family` {string} `IPv4` o `IPv6`
* `mac` {string} La dirección MAC de la interfaz de red
* `internal` {boolean} `true` si la interfaz de red es un loopback o una interfaz similar que no sea accesible de manera remota; de otra forma, es `false`
* `scopeid` {number} El ID numérico del ámbito de IPv6 (solo especificado cuando `family` es `IPv6`)
* `cidr` {string} The assigned IPv4 or IPv6 address with the routing prefix in CIDR notation. If the `netmask` is invalid, this property is set to `null`.

<!-- eslint-skip -->

```js
{
  lo: [
    {
      address: '127.0.0.1',
      netmask: '255.0.0.0',
      family: 'IPv4',
      mac: '00:00:00:00:00:00',
      internal: true,
      cidr: '127.0.0.1/8'
    },
    {
      address: '::1',
      netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      family: 'IPv6',
      mac: '00:00:00:00:00:00',
      scopeid: 0,
      internal: true,
      cidr: '::1/128'
    }
  ],
  eth0: [
    {
      address: '192.168.1.108',
      netmask: '255.255.255.0',
      family: 'IPv4',
      mac: '01:02:03:0a:0b:0c',
      internal: false,
      cidr: '192.168.1.108/24'
    },
    {
      address: 'fe80::a00:27ff:fe4e:66a1',
      netmask: 'ffff:ffff:ffff:ffff::',
      family: 'IPv6',
      mac: '01:02:03:0a:0b:0c',
      scopeid: 1,
      internal: false,
      cidr: 'fe80::a00:27ff:fe4e:66a1/64'
    }
  ]
}
```

## os.platform()

<!-- YAML
added: v0.5.0
-->

* Devuelve: {string}

El método `os.platform()` devuelve una string que identifica la plataforma del sistema operativo tal como fue establecida durante el tiempo de compilación de Node.js.

Los valores posibles son actualmente:

* `'aix'`
* `'darwin'`
* `'freebsd'`
* `'linux'`
* `'openbsd'`
* `'sunos'`
* `'win32'`

Es equivalente a [`process.platform`][].

The value `'android'` may also be returned if the Node.js is built on the Android operating system. However, Android support in Node.js is considered [to be experimental](https://github.com/nodejs/node/blob/master/BUILDING.md#androidandroid-based-devices-eg-firefox-os) at this time.

## os.release()

<!-- YAML
added: v0.3.3
-->

* Devuelve: {string}

El método `os.release()` devuelve una string que identifica la versión del sistema operativo.

On POSIX systems, the operating system release is determined by calling [uname(3)](https://linux.die.net/man/3/uname). En Windows, se utiliza `GetVersionExW()`. Por favor, consulte https://en.wikipedia.org/wiki/Uname#Examples para más información.

## os.setPriority([pid, ]priority)

<!-- YAML
added: v10.10.0
-->

* `pid` {integer} The process ID to set scheduling priority for. **Default** `0`.
* `priority` {integer} The scheduling priority to assign to the process.

The `os.setPriority()` method attempts to set the scheduling priority for the process specified by `pid`. If `pid` is not provided, or is `0`, the priority of the current process is used.

The `priority` input must be an integer between `-20` (high priority) and `19` (low priority). Due to differences between Unix priority levels and Windows priority classes, `priority` is mapped to one of six priority constants in `os.constants.priority`. When retrieving a process priority level, this range mapping may cause the return value to be slightly different on Windows. To avoid confusion, it is recommended to set `priority` to one of the priority constants.

On Windows setting priority to `PRIORITY_HIGHEST` requires elevated user, otherwise the set priority will be silently reduced to `PRIORITY_HIGH`.

## os.tmpdir()

<!-- YAML
added: v0.9.9
changes:

  - version: v2.0.0
    pr-url: https://github.com/nodejs/node/pull/747
    description: This function is now cross-platform consistent and no longer
                 returns a path with a trailing slash on any platform
-->

* Devuelve: {string}

El método `os.tmpdir()` devuelve una string que especifica el directorio predeterminado del sistema operativo para los archivos temporales.

## os.totalmem()

<!-- YAML
added: v0.3.3
-->

* Retorno: {integer}

El método `os.totalmem()` devuelve la cantidad total de memoria del sistema en bytes, como un número entero.

## os.type()

<!-- YAML
added: v0.3.3
-->

* Devuelve: {string}

El método `os.type()` retorna una string que identifica el nombre del sistema operativo tal como es devuelto por [uname(3)](https://linux.die.net/man/3/uname). For example, `'Linux'` on Linux, `'Darwin'` on macOS, and `'Windows_NT'` on Windows.

Por favor consulte https://en.wikipedia.org/wiki/Uname#Examples para obtener información adicional sobre los outputs arrojados por la ejecución de [uname(3)](https://linux.die.net/man/3/uname) en distintos sistemas operativos.

## os.uptime()

<!-- YAML
added: v0.3.3
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/20129
    description: The result of this function no longer contains a fraction
                 component on Windows.
-->

* Retorno: {integer}

El método de `os.uptime()` retorna el tiempo de operación del sistema en segundos.

## os.userInfo([options])

<!-- YAML
added: v6.0.0
-->

* `options` {Object} 
  * `encoding` {string} Codificación de caracteres utilizada para interpretar las strings resultantes. Si `encoding` se establece como `'buffer'`, los valores de `username`, `shell` y `homedir` serán instancias de `Buffer`. **Predeterminado:** `'utf8'`.
* Devuelve: {Object}

El método `os.userInfo()` devuelve información sobre el usuario efectivo actual — en plataformas POSIX, típicamente es un subconjunto del archivo de contraseña. El objeto devuelto incluye los `username`, `uid`, `gid`, `shell` y `homedir`. En Windows, el `uid` y `gid` campos son `-1`, y `shell` es `null`.

El valor de `homedir` devuelto por `os.userInfo()` es provisto por el sistema operativo. Este difiere del resultado de `os.homedir()`, el cual consulta distintas variables de entorno que afectan a la carpeta de usuario antes de remitirse a la respuesta del sistema operativo.

## Constantes del OS (Sistema Operativo)

Las siguientes constantes son exportadas por `os.constants`.

No todas las constantes estarán disponibles en todos los sistemas operativos.

### Constantes de Señal

<!-- YAML
changes:

  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/6093
    description: Added support for `SIGINFO`.
-->

Las siguientes constantes de señal son exportadas por `os.constants.signals`:

<table>
  <tr>
    <th>Constante</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>SIGHUP</code></td>
    <td>Enviada para indicar cuando una terminal de control es cerrada o un proceso primario cierra.</td>
  </tr>
  <tr>
    <td><code>SIGINT</code></td>
    <td>Sent to indicate when a user wishes to interrupt a process
    (<code>(Ctrl+C)</code>).</td>
  </tr>
  <tr>
    <td><code>SIGQUIT</code></td>
    <td>Enviada para indicar cuando un usuario desea terminar un proceso y realizar un volcado de memoria.</td>
  </tr>
  <tr>
    <td><code>SIGILL</code></td>
    <td>Enviada a un proceso para notificar que ha intentado realizar una instrucción ilegal, malformada, desconocida, o privilegiada.</td>
  </tr>
  <tr>
    <td><code>SIGTRAP</code></td>
    <td>Enviada a un proceso cuando ha ocurrido una excepción.</td>
  </tr>
  <tr>
    <td><code>SIGABRT</code></td>
    <td>Enviada a un proceso para solicitar que aborte.</td>
  </tr>
  <tr>
    <td><code>SIGIOT</code></td>
    <td>Sinónimo para <code>SIGABRT</code></td>
  </tr>
  <tr>
    <td><code>SIGBUS</code></td>
    <td>Enviada a un proceso para notificar que ha causada un error de bus.</td>
  </tr>
  <tr>
    <td><code>SIGFPE</code></td>
    <td>Enviada a un proceso para notificar que ha realizado una operación aritmética ilegal.</td>
  </tr>
  <tr>
    <td><code>SIGKILL</code></td>
    <td>Enviada a un proceso para terminarlo inmediatamente.</td>
  </tr>
  <tr>
    <td><code>SIGUSR1</code> <code>SIGUSR2</code></td>
    <td>Enviada a un proceso para identificar las condiciones definidas por los usuarios.</td>
  </tr>
  <tr>
    <td><code>SIGSEGV</code></td>
    <td>Enviada a un proceso para notificar de un fallo de segmentación.</td>
  </tr>
  <tr>
    <td><code>SIGPIPE</code></td>
    <td>Enviada a un proceso cuando ha intentado escribir a un pipe desconectado.</td>
  </tr>
  <tr>
    <td><code>SIGALRM</code></td>
    <td>Enviada a un proceso cuando ha transcurrido un temporizador del sistema.</td>
  </tr>
  <tr>
    <td><code>SIGTERM</code></td>
    <td>Enviada a un proceso para solicitar su terminación.</td>
  </tr>
  <tr>
    <td><code>SIGCHLD</code></td>
    <td>Enviada a un proceso cuando un proceso secundario termina.</td>
  </tr>
  <tr>
    <td><code>SIGSTKFLT</code></td>
    <td>Enviada a un proceso para indicar un error de pila en un coprocesador.</td>
  </tr>
  <tr>
    <td><code>SIGCONT</code></td>
    <td>Enviada para indicar al sistema operativo que continúe un proceso pausado.</td>
  </tr>
  <tr>
    <td><code>SIGSTOP</code></td>
    <td>Enviada para indicar al sistema operativo que detenga un proceso.</td>
  </tr>
  <tr>
    <td><code>SIGTSTP</code></td>
    <td>Enviada a un proceso para solicitar que se detenga.</td>
  </tr>
  <tr>
    <td><code>SIGBREAK</code></td>
    <td>Enviada para indicar cuando un usuario desea interrumpir un proceso.</td>
  </tr>
  <tr>
    <td><code>SIGTTIN</code></td>
    <td>Enviada a un proceso cuando lee desde el TTY en segundo plano.</td>
  </tr>
  <tr>
    <td><code>SIGTTOU</code></td>
    <td>Enviada a un proceso cuando escribe desde el TTY estando en segundo plano.</td>
  </tr>
  <tr>
    <td><code>SIGURG</code></td>
    <td>Enviada a un proceso cuando un socket tiene datos urgentes a leer.</td>
  </tr>
  <tr>
    <td><code>SIGXCPU</code></td>
    <td>Enviada a un proceso cuando ha excedido su límite de uso de la CPU.</td>
  </tr>
  <tr>
    <td><code>SIGXFSZ</code></td>
    <td>Enviada a un proceso cuando el archivo crece más grande que el máximo permitido.</td>
  </tr>
  <tr>
    <td><code>SIGVTALRM</code></td>
    <td>Enviada a un proceso cuando el temporizador virtual ha transcurrido.</td>
  </tr>
  <tr>
    <td><code>SIGPROF</code></td>
    <td>Enviada a un proceso cuando un temporizador del sistema ha transcurrido.</td>
  </tr>
  <tr>
    <td><code>SIGWINCH</code></td>
    <td>Enviada a un proceso cuando la terminal de control ha cambiado su tamaño.</td>
  </tr>
  <tr>
    <td><code>SIGIO</code></td>
    <td>Enviada a un proceso cuando la opción E/A está disponible.</td>
  </tr>
  <tr>
    <td><code>SIGPOLL</code></td>
    <td>Sinónimo para <code>SIGIO</code></td>
  </tr>
  <tr>
    <td><code>SIGLOST</code></td>
    <td>Enviada a un proceso cuando un bloqueo de archivo se ha perdido.</td>
  </tr>
  <tr>
    <td><code>SIGPWR</code></td>
    <td>Enviada a un proceso para notificar de un fallo de alimentación.</td>
  </tr>
  <tr>
    <td><code>SIGINFO</code></td>
    <td>Sinónimo para <code>SIGPWR</code></td>
  </tr>
  <tr>
    <td><code>SIGSYS</code></td>
    <td>Enviada a un proceso para notificar un argumento erróneo.</td>
  </tr>
  <tr>
    <td><code>SIGUNUSED</code></td>
    <td>Sinónimo para <code>SIGSYS</code></td>
  </tr>
</table>

### Constantes de Error

Las siguientes constantes de error son exportadas por `os.constants.errno`:

#### Constantes de Error POSIX

<table>
  <tr>
    <th>Constante</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>E2BIG</code></td>
    <td>Indica que la lista de argumentos es mas larga de lo esperado.</td>
  </tr>
  <tr>
    <td><code>EACCES</code></td>
    <td>Indica que la operación no tiene los permisos suficientes.</td>
  </tr>
  <tr>
    <td><code>EADDRINUSE</code></td>
    <td>Indica que la dirección de red ya se encuentra en uso.</td>
  </tr>
  <tr>
    <td><code>EADDRNOTAVAIL</code></td>
    <td>Indica que la dirección de red no se encuentra disponible para ser usada en ese momento.</td>
  </tr>
  <tr>
    <td><code>EAFNOSUPPORT</code></td>
    <td>Indica que la familia de direcciones de red no es soportada.</td>
  </tr>
  <tr>
    <td><code>EAGAIN</code></td>
    <td>Indica que no hay datos disponibles en ese momento y se debe volver a intentar la operación más tarde.</td>
  </tr>
  <tr>
    <td><code>EALREADY</code></td>
    <td>Indica que el socket ya tiene una conexión pendiente en progreso.</td>
  </tr>
  <tr>
    <td><code>EBADF</code></td>
    <td>Indica que un descriptor de archivo no es válido.</td>
  </tr>
  <tr>
    <td><code>EBADMSG</code></td>
    <td>Indica un mensaje de datos inválido.</td>
  </tr>
  <tr>
    <td><code>EBUSY</code></td>
    <td>Indica que un dispositivo o recurso se encuentra ocupado.</td>
  </tr>
  <tr>
    <td><code>ECANCELED</code></td>
    <td>Indica que una operación fue cancelada.</td>
  </tr>
  <tr>
    <td><code>ECHILD</code></td>
    <td>Indica que no hay procesos secundarios.</td>
  </tr>
  <tr>
    <td><code>ECONNABORTED</code></td>
    <td>Indica que la conexión de la red ha sido abortada.</td>
  </tr>
  <tr>
    <td><code>ECONNREFUSED</code></td>
    <td>Indica que la conexión de la red ha sido rechazada.</td>
  </tr>
  <tr>
    <td><code>ECONNRESET</code></td>
    <td>Indica que la conexión de la red ha sido restablecida.</td>
  </tr>
  <tr>
    <td><code>EDEADLK</code></td>
    <td>Indica que un bloqueo mutuo (deadlock) ha sido evadido.</td>
  </tr>
  <tr>
    <td><code>EDESTADDRREQ</code></td>
    <td>Indica que se requiere una dirección de destino.</td>
  </tr>
  <tr>
    <td><code>EDOM</code></td>
    <td>Indica que un argumento se encuentra fuera del dominio de la función.</td>
  </tr>
  <tr>
    <td><code>EDQUOT</code></td>
    <td>Indica que la cuota del disco ha sido excedida.</td>
  </tr>
  <tr>
    <td><code>EEXIST</code></td>
    <td>Indica que el archivo ya existe.</td>
  </tr>
  <tr>
    <td><code>EFAULT</code></td>
    <td>Indica una dirección de puntero inválida.</td>
  </tr>
  <tr>
    <td><code>EFBIG</code></td>
    <td>Indica que el archivo es demasiado grande.</td>
  </tr>
  <tr>
    <td><code>EHOSTUNREACH</code></td>
    <td>Indica que host es inalcanzable.</td>
  </tr>
  <tr>
    <td><code>EIDRM</code></td>
    <td>Indica que el identificador ha sido removido.</td>
  </tr>
  <tr>
    <td><code>EILSEQ</code></td>
    <td>Indica una secuencia de bytes ilegal.</td>
  </tr>
  <tr>
    <td><code>EINPROGRESS</code></td>
    <td>Indica que una operación ya se encuentra en progreso.</td>
  </tr>
  <tr>
    <td><code>EINTR</code></td>
    <td>Indica que una llamada de función fue interrumpida.</td>
  </tr>
  <tr>
    <td><code>EINVAL</code></td>
    <td>Indica que fue provisto un argumento inválido.</td>
  </tr>
  <tr>
    <td><code>EIO</code></td>
    <td>Indica un error de I/O no especificado.</td>
  </tr>
  <tr>
    <td><code>EISCONN</code></td>
    <td>Indica que el socket está conectado.</td>
  </tr>
  <tr>
    <td><code>EISDIR</code></td>
    <td>Indica que la ruta es un directorio.</td>
  </tr>
  <tr>
    <td><code>ELOOP</code></td>
    <td>Indica que hay demasiados niveles de enlaces simbólicos en una ruta.</td>
  </tr>
  <tr>
    <td><code>EMFILE</code></td>
    <td>Indica que hay muchos archivos abiertos.</td>
  </tr>
  <tr>
    <td><code>EMLINK</code></td>
    <td>Indica que hay demasiados enlaces duros referidos a un archivo.</td>
  </tr>
  <tr>
    <td><code>EMSGSIZE</code></td>
    <td>Indica que el mensaje proporcionado es demasiado largo.</td>
  </tr>
  <tr>
    <td><code>EMULTIHOP</code></td>
    <td>Indica que se intentó realizar un multi-salto.</td>
  </tr>
  <tr>
    <td><code>ENAMETOOLONG</code></td>
    <td>Indica que el nombre del archivo es demasiado largo.</td>
  </tr>
  <tr>
    <td><code>ENETDOWN</code></td>
    <td>Indica que la red se encuentra caída.</td>
  </tr>
  <tr>
    <td><code>ENETRESET</code></td>
    <td>Indica que la conexión ha sido abortada por la red.</td>
  </tr>
  <tr>
    <td><code>ENETUNREACH</code></td>
    <td>Indica que la red es inalcanzable.</td>
  </tr>
  <tr>
    <td><code>ENFILE</code></td>
    <td>Indica que hay demasiados archivos abiertos en el sistema.</td>
  </tr>
  <tr>
    <td><code>ENOBUFS</code></td>
    <td>Indica que no hay espacio de búfer disponible.</td>
  </tr>
  <tr>
    <td><code>ENODATA</code></td>
    <td>Indica que no hay ningún mensaje disponible en el siguiente ítem de la cola de lectura del stream.</td>
  </tr>
  <tr>
    <td><code>ENODEV</code></td>
    <td>Indica que en ese lugar no existe tal dispositivo.</td>
  </tr>
  <tr>
    <td><code>ENOENT</code></td>
    <td>Indica que en ese lugar no existe tal archivo o directorio.</td>
  </tr>
  <tr>
    <td><code>ENOEXEC</code></td>
    <td>Indica un error de formato de exec.</td>
  </tr>
  <tr>
    <td><code>ENOLCK</code></td>
    <td>Indica que no hay bloqueos disponibles.</td>
  </tr>
  <tr>
    <td><code>ENOLINK</code></td>
    <td>Indica que el enlace está roto.</td>
  </tr>
  <tr>
    <td><code>ENOMEM</code></td>
    <td>Indica que no hay suficiente espacio.</td>
  </tr>
  <tr>
    <td><code>ENOMSG</code></td>
    <td>Indica que no hay mensajes del tipo deseado.</td>
  </tr>
  <tr>
    <td><code>ENOPROTOOPT</code></td>
    <td>Indica que el protocolo dado no está disponible.</td>
  </tr>
  <tr>
    <td><code>ENOSPC</code></td>
    <td>Indica que no hay espacio disponible en el dispositivo.</td>
  </tr>
  <tr>
    <td><code>ENOSR</code></td>
    <td>Indica que no hay recursos de stream disponibles.</td>
  </tr>
  <tr>
    <td><code>ENOSTR</code></td>
    <td>Indica que determinado protocolo no es un stream.</td>
  </tr>
  <tr>
    <td><code>ENOSYS</code></td>
    <td>Indica que una función ha sido implementada.</td>
  </tr>
  <tr>
    <td><code>ENOTCONN</code></td>
    <td>Indica que un socket no está conectado.</td>
  </tr>
  <tr>
    <td><code>ENOTDIR</code></td>
    <td>Indica que la ruta no es un directorio.</td>
  </tr>
  <tr>
    <td><code>ENOTEMPTY</code></td>
    <td>Indica que el directorio no está vacío.</td>
  </tr>
  <tr>
    <td><code>ENOTSOCK</code></td>
    <td>Indica que un elemento dado no es un socket.</td>
  </tr>
  <tr>
    <td><code>ENOTSUP</code></td>
    <td>Indica que no se admite la operación dada.</td>
  </tr>
  <tr>
    <td><code>ENOTTY</code></td>
    <td>Indica una operación de control A/E inapropiada.</td>
  </tr>
  <tr>
    <td><code>ENXIO</code></td>
    <td>Indica que no existe el dispositivo o dirección.</td>
  </tr>
  <tr>
    <td><code>EOPNOTSUPP</code></td>
    <td>Indica que la operación no es compatible con el socket.  Note that
    while <code>ENOTSUP</code> and <code>EOPNOTSUPP</code> have the same value
    on Linux, according to POSIX.1 these error values should be distinct.)</td>
  </tr>
  <tr>
    <td><code>EOVERFLOW</code></td>
    <td>Indica que el valor es muy grande para almacenarse en un tipo de datos.</td>
  </tr>
  <tr>
    <td><code>EPERM</code></td>
    <td>Indica que la operación no es permitida.</td>
  </tr>
  <tr>
    <td><code>EPIPE</code></td>
    <td>Indica un pipe roto.</td>
  </tr>
  <tr>
    <td><code>EPROTO</code></td>
    <td>Indica un error de protocolo.</td>
  </tr>
  <tr>
    <td><code>EPROTONOSUPPORT</code></td>
    <td>Indica que un protocolo no es compatible.</td>
  </tr>
  <tr>
    <td><code>EPROTOTYPE</code></td>
    <td>Inidica un tipo incorrecto de protocolo para el socket.</td>
  </tr>
  <tr>
    <td><code>ERANGE</code></td>
    <td>Indica que los resultados son muy grandes.</td>
  </tr>
  <tr>
    <td><code>EROFS</code></td>
    <td>Indica que el sistema de archivos es de solo lectura.</td>
  </tr>
  <tr>
    <td><code>ESPIPE</code></td>
    <td>Indica una operación inválida de búsqueda.</td>
  </tr>
  <tr>
    <td><code>ESRCH</code></td>
    <td>Indica que no existe tal proceso.</td>
  </tr>
  <tr>
    <td><code>ESTALE</code></td>
    <td>Indica que el descriptor de archivos es obsoleto.</td>
  </tr>
  <tr>
    <td><code>ETIME</code></td>
    <td>Indica un temporizador expirado.</td>
  </tr>
  <tr>
    <td><code>ETIMEDOUT</code></td>
    <td>Indica que la conexión ha sido interrumpida.</td>
  </tr>
  <tr>
    <td><code>ETXTBSY</code></td>
    <td>Indica que el archivo de texto está ocupado.</td>
  </tr>
  <tr>
    <td><code>EWOULDBLOCK</code></td>
    <td>Indica que la operación podría bloquear.</td>
  </tr>
  <tr>
    <td><code>EXDEV</code></td>
    <td>Indica un enlace incorrecto.
  </tr>
</table>

#### Constantes de Error Específicas de Windows

Los siguientes códigos de error son específicos de el sistema operativo Windows:

<table>
  <tr>
    <th>Constante</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>WSAEINTR</code></td>
    <td>Indica una interrupción en la función de llamada.</td>
  </tr>
  <tr>
    <td><code>WSAEBADF</code></td>
    <td>Indica un descriptor de archivo inválido.</td>
  </tr>
  <tr>
    <td><code>WSAEACCES</code></td>
    <td>Indica insuficiencia de permisos para completar la operación.</td>
  </tr>
  <tr>
    <td><code>WSAEFAULT</code></td>
    <td>Indica una dirección de puntero inválida.</td>
  </tr>
  <tr>
    <td><code>WSAEINVAL</code></td>
    <td>Indica que un argumento inválido fue proporcionado.</td>
  </tr>
  <tr>
    <td><code>WSAEMFILE</code></td>
    <td>Indica que hay muchos archivos abiertos.</td>
  </tr>
  <tr>
    <td><code>WSAEWOULDBLOCK</code></td>
    <td>Indica que un recurso está temporalmente no disponible.</td>
  </tr>
  <tr>
    <td><code>WSAEINPROGRESS</code></td>
    <td>Indica que la operación está actualmente en progreso.</td>
  </tr>
  <tr>
    <td><code>WSAEALREADY</code></td>
    <td>Indica que la operación ya está en progreso.</td>
  </tr>
  <tr>
    <td><code>WSAENOTSOCK</code></td>
    <td>Indica que el recurso no es un socket.</td>
  </tr>
  <tr>
    <td><code>WSAEDESTADDRREQ</code></td>
    <td>Indica que la dirección de destino es requerida.</td>
  </tr>
  <tr>
    <td><code>WSAEMSGSIZE</code></td>
    <td>Indica que el tamaño del mensaje es demasiado largo.</td>
  </tr>
  <tr>
    <td><code>WSAEPROTOTYPE</code></td>
    <td>Indica el tipo de protocolo incorrecto para el socket.</td>
  </tr>
  <tr>
    <td><code>WSAENOPROTOOPT</code></td>
    <td>Indica una opción de protocolo errónea.</td>
  </tr>
  <tr>
    <td><code>WSAEPROTONOSUPPORT</code></td>
    <td>Indica que el protocolo no es compatible.</td>
  </tr>
  <tr>
    <td><code>WSAESOCKTNOSUPPORT</code></td>
    <td>Indica que el tipo de socket no es compatible.</td>
  </tr>
  <tr>
    <td><code>WSAEOPNOTSUPP</code></td>
    <td>Indica que la operación no esta soportada.</td>
  </tr>
  <tr>
    <td><code>WSAEPFNOSUPPORT</code></td>
    <td>Indica que la familia de protocolos no es soportada.</td>
  </tr>
  <tr>
    <td><code>WSAEAFNOSUPPORT</code></td>
    <td>Indica que la familia de direcciones no es soportada.</td>
  </tr>
  <tr>
    <td><code>WSAEADDRINUSE</code></td>
    <td>Indica que la dirección de red ya se encuentra en uso.</td>
  </tr>
  <tr>
    <td><code>WSAEADDRNOTAVAIL</code></td>
    <td>Indica que la dirección de red no esta disponible.</td>
  </tr>
  <tr>
    <td><code>WSAENETDOWN</code></td>
    <td>Indica que la red se encuentra caída.</td>
  </tr>
  <tr>
    <td><code>WSAENETUNREACH</code></td>
    <td>Indica que la red es inalcanzable.</td>
  </tr>
  <tr>
    <td><code>WSAENETRESET</code></td>
    <td>Indica que la conexión de la red ha sido restablecida.</td>
  </tr>
  <tr>
    <td><code>WSAECONNABORTED</code></td>
    <td>Indica que la conexión ha sido abortada.</td>
  </tr>
  <tr>
    <td><code>WSAECONNRESET</code></td>
    <td>Indica que la conexión ha sido restablecida por el peer.</td>
  </tr>
  <tr>
    <td><code>WSAENOBUFS</code></td>
    <td>Indica que no hay espacio disponible en el buffer.</td>
  </tr>
  <tr>
    <td><code>WSAEISCONN</code></td>
    <td>Indica que el socket ya ha sido conectado.</td>
  </tr>
  <tr>
    <td><code>WSAENOTCONN</code></td>
    <td>Indica que el socket no está conectado.</td>
  </tr>
  <tr>
    <td><code>WSAESHUTDOWN</code></td>
    <td>Indica que los datos no pueden ser enviados luego de que el socket se ha cerrado.</td>
  </tr>
  <tr>
    <td><code>WSAETOOMANYREFS</code></td>
    <td>Indica que hay demasiadas referencias.</td>
  </tr>
  <tr>
    <td><code>WSAETIMEDOUT</code></td>
    <td>Indica que la conexión agotó su tiempo de ejecución.</td>
  </tr>
  <tr>
    <td><code>WSAECONNREFUSED</code></td>
    <td>Indica que la conexión ha sido rechazada.</td>
  </tr>
  <tr>
    <td><code>WSAELOOP</code></td>
    <td>Indica que un nombre no puede ser traducido.</td>
  </tr>
  <tr>
    <td><code>WSAENAMETOOLONG</code></td>
    <td>Indica que un nombre era demasiado largo.</td>
  </tr>
  <tr>
    <td><code>WSAEHOSTDOWN</code></td>
    <td>Indica que un host de la red está caído.</td>
  </tr>
  <tr>
    <td><code>WSAEHOSTUNREACH</code></td>
    <td>Indica que no hay no hay ninguna ruta a un host de la red.</td>
  </tr>
  <tr>
    <td><code>WSAENOTEMPTY</code></td>
    <td>Indica que el directorio no se encuentra vacío.</td>
  </tr>
  <tr>
    <td><code>WSAEPROCLIM</code></td>
    <td>Indica que hay demasiados procesos.</td>
  </tr>
  <tr>
    <td><code>WSAEUSERS</code></td>
    <td>Indica que se ha excedido la cuota de usuarios.</td>
  </tr>
  <tr>
    <td><code>WSAEDQUOT</code></td>
    <td>Indica que la cuota del disco ha sido excedida.</td>
  </tr>
  <tr>
    <td><code>WSAESTALE</code></td>
    <td>Indica una referencia obsoleta al handle de un archivo.</td>
  </tr>
  <tr>
    <td><code>WSAEREMOTE</code></td>
    <td>Indica que el ítem es remoto.</td>
  </tr>
  <tr>
    <td><code>WSASYSNOTREADY</code></td>
    <td>Indica que el subsistema de la red no se encuentra listo.</td>
  </tr>
  <tr>
    <td><code>WSAVERNOTSUPPORTED</code></td>
    <td>Indicates that the <code>winsock.dll</code> version is out of
    range.</td>
  </tr>
  <tr>
    <td><code>WSANOTINITIALISED</code></td>
    <td>Indica que aún no se ha efectuado con éxito el WSAStartup.</td>
  </tr>
  <tr>
    <td><code>WSAEDISCON</code></td>
    <td>Indica que un proceso de apagado exitoso se encuentra en progreso.</td>
  </tr>
  <tr>
    <td><code>WSAENOMORE</code></td>
    <td>Indica que no hay más resultados.</td>
  </tr>
  <tr>
    <td><code>WSAECANCELLED</code></td>
    <td>Indica que una operación ha sido cancelada.</td>
  </tr>
  <tr>
    <td><code>WSAEINVALIDPROCTABLE</code></td>
    <td>Indica que la tabla de llamadas de procedimientos es inválida.</td>
  </tr>
  <tr>
    <td><code>WSAEINVALIDPROVIDER</code></td>
    <td>Indica un proveedor de servicio inválido.</td>
  </tr>
  <tr>
    <td><code>WSAEPROVIDERFAILEDINIT</code></td>
    <td>Indica que falló la inicialización del proveedor de servicio.</td>
  </tr>
  <tr>
    <td><code>WSASYSCALLFAILURE</code></td>
    <td>Indica un fallo de llamada de sistema.</td>
  </tr>
  <tr>
    <td><code>WSASERVICE_NOT_FOUND</code></td>
    <td>Indica que un servicio no fue encontrado.</td>
  </tr>
  <tr>
    <td><code>WSATYPE_NOT_FOUND</code></td>
    <td>Indica que un tipo de clase no fue encontrado.</td>
  </tr>
  <tr>
    <td><code>WSA_E_NO_MORE</code></td>
    <td>Indica que no hay más resultados.</td>
  </tr>
  <tr>
    <td><code>WSA_E_CANCELLED</code></td>
    <td>Indica que la llamada fue cancelada.</td>
  </tr>
  <tr>
    <td><code>WSAEREFUSED</code></td>
    <td>Indica que una consulta de base de datos fue rechazada.</td>
  </tr>
</table>

### constantes dlopen

If available on the operating system, the following constants are exported in `os.constants.dlopen`. See dlopen(3) for detailed information.

<table>
  <tr>
    <th>Constante</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>RTLD_LAZY</code></td>
    <td>Realizar carga diferida. Node.js coloca este parámetro por defecto.</td>
  </tr>
  <tr>
    <td><code>RTLD_NOW</code></td>
    <td>Resuelve todos los símbolos indefinidos en la librería antes que dlopen(3) retorne.</td>
  </tr>
  <tr>
    <td><code>RTLD_GLOBAL</code></td>
    <td>Los símbolos definidos por la librería estarán disponibles para la resolución de símbolos de librerías subsecuentemente cargadas.</td>
  </tr>
  <tr>
    <td><code>RTLD_LOCAL</code></td>
    <td>The converse of <code>RTLD_GLOBAL</code>. This is the default behavior
    if neither flag is specified.</td>
  </tr>
  <tr>
    <td><code>RTLD_DEEPBIND</code></td>
    <td>Hace que una librería auto contenida use sus propio símbolos de preferencia a símbolos de librerías cargadas previamente.</td>
  </tr>
</table>

### Priority Constants

<!-- YAML
added: v10.10.0
-->

The following process scheduling constants are exported by `os.constants.priority`:

<table>
  <tr>
    <th>Constantes</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>PRIORITY_LOW</code></td>
    <td>The lowest process scheduling priority. This corresponds to
    <code>IDLE_PRIORITY_CLASS</code> on Windows, and a nice value of
    <code>19</code> on all other platforms.</td>
  </tr>
  <tr>
    <td><code>PRIORITY_BELOW_NORMAL</code></td>
    <td>The process scheduling priority above <code>PRIORITY_LOW</code> and
    below <code>PRIORITY_NORMAL</code>. This corresponds to
    <code>BELOW_NORMAL_PRIORITY_CLASS</code> on Windows, and a nice value of
    <code>10</code> on all other platforms.</td>
  </tr>
  <tr>
    <td><code>PRIORITY_NORMAL</code></td>
    <td>The default process scheduling priority. This corresponds to
    <code>NORMAL_PRIORITY_CLASS</code> on Windows, and a nice value of
    <code>0</code> on all other platforms.</td>
  </tr>
  <tr>
    <td><code>PRIORITY_ABOVE_NORMAL</code></td>
    <td>The process scheduling priority above <code>PRIORITY_NORMAL</code> and
    below <code>PRIORITY_HIGH</code>. This corresponds to
    <code>ABOVE_NORMAL_PRIORITY_CLASS</code> on Windows, and a nice value of
    <code>-7</code> on all other platforms.</td>
  </tr>
  <tr>
    <td><code>PRIORITY_HIGH</code></td>
    <td>The process scheduling priority above <code>PRIORITY_ABOVE_NORMAL</code>
    and below <code>PRIORITY_HIGHEST</code>. This corresponds to
    <code>HIGH_PRIORITY_CLASS</code> on Windows, and a nice value of
    <code>-14</code> on all other platforms.</td>
  </tr>
  <tr>
    <td><code>PRIORITY_HIGHEST</code></td>
    <td>The highest process scheduling priority. This corresponds to
    <code>REALTIME_PRIORITY_CLASS</code> on Windows, and a nice value of
    <code>-20</code> on all other platforms.</td>
  </tr>
</table>

### constantes libuv

<table>
  <tr>
    <th>Constante</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>UV_UDP_REUSEADDR</code></td>
    <td></td>
  </tr>
</table>
