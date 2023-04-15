# SO

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

The `os` module provides operating system-related utility methods and properties. Se puede acceder al mismo utilizando:

```js
const os = require('os');
```

## `os.EOL`
<!-- YAML
added: v0.7.8
-->

* {string}

The operating system-specific end-of-line marker.

* `\n` en POSIX
* `\r\n` en Windows

## `os.arch()`
<!-- YAML
added: v0.5.0
-->

* Devuelve: {string}

Returns the operating system CPU architecture for which the Node.js binary was compiled. Possible values are `'arm'`, `'arm64'`, `'ia32'`, `'mips'`, `'mipsel'`, `'ppc'`, `'ppc64'`, `'s390'`, `'s390x'`, `'x32'`, and `'x64'`.

The return value is equivalent to [`process.arch`][].

## `os.constants`
<!-- YAML
added: v6.3.0
-->

* {Object}

Contains commonly used operating system-specific constants for error codes, process signals, and so on. The specific constants defined are described in [OS Constants](#os_os_constants_1).

## `os.cpus()`
<!-- YAML
added: v0.3.3
-->

* Retorno: {Object[]}

Returns an array of objects containing information about each logical CPU core.

Las propiedades incluidas en cada objeto incluyen:

* `model` {string}
* `speed` {number} (en MHz)
* `times` {Object}
  * `user` {number} El número de milisegundos que el CPU ha pasado en el modo de usuario.
  * `nice` {number} El número de milisegundos que el CPU ha pasado en el modo "nice".
  * `sys` {number} El número de milisegundos que el CPU ha pasado en el modo "sys".
  * `idle` {number} El número de milisegundos que el CPU ha pasado en el modo "iddle" (ausente).
  * `irq` {number} El número de milisegundos que el CPU ha pasado en el modo "irq".
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
  }
]
```

`nice` values are POSIX-only. On Windows, the `nice` values of all processors are always 0.

## `os.endianness()`<!-- YAML
added: v0.9.4
-->* Devuelve: {string}

Returns a string identifying the endianness of the CPU for which the Node.js binary was compiled.

Possible values are `'BE'` for big endian and `'LE'` for little endian.

## `os.freemem()`<!-- YAML
added: v0.3.3
-->* Devuelve: {integer}

Returns the amount of free system memory in bytes as an integer.

## `os.getPriority([pid])`<!-- YAML
added: v10.10.0
-->* `pid` {integer} The process ID to retrieve scheduling priority for. **Default** `0`.
* Devuelve: {integer}

Returns the scheduling priority for the process specified by `pid`. If `pid` is not provided or is `0`, the priority of the current process is returned.

## `os.homedir()`<!-- YAML
added: v2.3.0
-->* Devuelve: {string}

Returns the string path of the current user's home directory.

On POSIX, it uses the `$HOME` environment variable if defined. Otherwise it uses the [effective UID](https://en.wikipedia.org/wiki/User_identifier#Effective_user_ID) to look up the user's home directory.

On Windows, it uses the `USERPROFILE` environment variable if defined. Otherwise it uses the path to the profile directory of the current user.

## `os.hostname()`<!-- YAML
added: v0.3.3
-->* Devuelve: {string}

Returns the hostname of the operating system as a string.

## `os.loadavg()`
<!-- YAML
added: v0.3.3
-->

* Devuelve: {number[]}

Returns an array containing the 1, 5, and 15 minute load averages.

The load average is a measure of system activity calculated by the operating system and expressed as a fractional number.

The load average is a Unix-specific concept. On Windows, the return value is always `[0, 0, 0]`.

## `os.networkInterfaces()`<!-- YAML
added: v0.6.0
-->* Devuelve: {Object}

Returns an object containing network interfaces that have been assigned a network address.

Cada clave en el objeto devuelto identifica una interfaz de red. El valor asociado es un array de objetos en el que cada uno describe una dirección de red asignada.

Las propiedades disponibles en la dirección de red asignada incluyen:

* `address` {string} La dirección IPv4 o IPv6 asignada
* `netmask` {string} La máscara de red IPv4 o IPv6
* `family` {string} `IPv4` o `IPv6`
* `mac` {string} La dirección MAC de la interfaz de red
* `internal` {boolean} `true` si la interfaz de red es un loopback o una interfaz similar que no sea accesible de manera remota; de otra forma, es `false`
* `scopeid` {number} El ID numérico del ámbito de IPv6 (solo especificado cuando `family` es `IPv6`)
* `cidr` {string} The assigned IPv4 or IPv6 address with the routing prefix in CIDR notation. If the `netmask` is invalid, this property is set to `null`.
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

## `os.platform()`<!-- YAML
added: v0.5.0
-->* Devuelve: {string}

Returns a string identifying the operating system platform. The value is set at compile time. Possible values are `'aix'`, `'darwin'`, `'freebsd'`, `'linux'`, `'openbsd'`, `'sunos'`, and `'win32'`.

The return value is equivalent to [`process.platform`][].

The value `'android'` may also be returned if Node.js is built on the Android operating system. [Android support is experimental](https://github.com/nodejs/node/blob/master/BUILDING.md#androidandroid-based-devices-eg-firefox-os).

## `os.release()`<!-- YAML
added: v0.3.3
-->* Devuelve: {string}

Returns the operating system as a string.

On POSIX systems, the operating system release is determined by calling [uname(3)](https://linux.die.net/man/3/uname). En Windows, se utiliza `GetVersionExW()`. See https://en.wikipedia.org/wiki/Uname#Examples for more information.

## `os.setPriority([pid, ]priority)`<!-- YAML
added: v10.10.0
-->* `pid` {integer} The process ID to set scheduling priority for. **Default** `0`.
* `priority` {integer} The scheduling priority to assign to the process.

Attempts to set the scheduling priority for the process specified by `pid`. If `pid` is not provided or is `0`, the process ID of the current process is used.

The `priority` input must be an integer between `-20` (high priority) and `19` (low priority). Due to differences between Unix priority levels and Windows priority classes, `priority` is mapped to one of six priority constants in `os.constants.priority`. When retrieving a process priority level, this range mapping may cause the return value to be slightly different on Windows. To avoid confusion, set `priority` to one of the priority constants.

On Windows, setting priority to `PRIORITY_HIGHEST` requires elevated user privileges. Otherwise the set priority will be silently reduced to `PRIORITY_HIGH`.

## `os.tmpdir()`<!-- YAML
added: v0.9.9
changes:
  - version: v2.0.0
    pr-url: https://github.com/nodejs/node/pull/747
    description: This function is now cross-platform consistent and no longer
                 returns a path with a trailing slash on any platform
-->* Devuelve: {string}

Returns the operating system's default directory for temporary files as a string.

## `os.totalmem()`<!-- YAML
added: v0.3.3
-->* Devuelve: {integer}

Returns the total amount of system memory in bytes as an integer.

## `os.type()`<!-- YAML
added: v0.3.3
-->* Devuelve: {string}

Returns the operating system name as returned by [uname(3)](https://linux.die.net/man/3/uname). For example, it returns `'Linux'` on Linux, `'Darwin'` on macOS, and `'Windows_NT'` on Windows.

See https://en.wikipedia.org/wiki/Uname#Examples for additional information about the output of running [uname(3)](https://linux.die.net/man/3/uname) on various operating systems.

## `os.uptime()`<!-- YAML
added: v0.3.3
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/20129
    description: The result of this function no longer contains a fraction
                 component on Windows.
-->* Devuelve: {integer}

Returns the system uptime in number of seconds.

## `os.userInfo([options])`<!-- YAML
added: v6.0.0
-->* `options` {Object}
  * `encoding` {string} Codificación de caracteres utilizada para interpretar las strings resultantes. Si `encoding` se establece como `'buffer'`, los valores de `username`, `shell` y `homedir` serán instancias de `Buffer`. **Default:** `'utf8'`.
* Devuelve: {Object}

Returns information about the currently effective user. On POSIX platforms, this is typically a subset of the password file. The returned object includes the `username`, `uid`, `gid`, `shell`, and `homedir`. On Windows, the `uid` and `gid` fields are `-1`, and `shell` is `null`.

El valor de `homedir` devuelto por `os.userInfo()` es provisto por el sistema operativo. This differs from the result of `os.homedir()`, which queries environment variables for the home directory before falling back to the operating system response.

Throws a [`SystemError`][] if a user has no `username` or `homedir`.

## Constantes del OS (Sistema Operativo)

Las siguientes constantes son exportadas por `os.constants`.

No todas las constantes estarán disponibles en todos los sistemas operativos.

### Constantes de Señal<!-- YAML
changes:
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/6093
    description: Added support for `SIGINFO`.
-->The following signal constants are exported by `os.constants.signals`.

<table>
  <tr>
    <th>Constante</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>SIGHUP</code></td>
    <td>Enviada para indicar el momento en el cual un terminal es cerrado o un proceso primario es finalizado.</td>
  </tr>
  <tr>
    <td><code>SIGINT</code></td>
    <td>Sent to indicate when a user wishes to interrupt a process
    (<code>(Ctrl+C)</code>).</td>
  </tr>
  <tr>
    <td><code>SIGQUIT</code></td>
    <td>Enviada para indicar el momento en el cual un usuario desea terminar un proceso y realizar un volcado de memoria.</td>
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
    <td>Enviada a un proceso para solicitar su cancelación.</td>
  </tr>
  <tr>
    <td><code>SIGIOT</code></td>
    <td>Sinónimo de <code>SIGABRT</code></td>
  </tr>
  <tr>
    <td><code>SIGBUS</code></td>
    <td>Enviada a un proceso para notificar que este ha causado un "error bus".</td>
  </tr>
  <tr>
    <td><code>SIGFPE</code></td>
    <td>Enviada a un proceso para notificar que este ha llevado a cabo una operación aritmética ilegal.</td>
  </tr>
  <tr>
    <td><code>SIGKILL</code></td>
    <td>Enviada a un proceso para finalizarlo inmediatamente.</td>
  </tr>
  <tr>
    <td><code>SIGUSR1</code> <code>SIGUSR2</code></td>
    <td>Enviadas a un proceso para identificar condiciones definidas por los usuarios.</td>
  </tr>
  <tr>
    <td><code>SIGSEGV</code></td>
    <td>Enviadas a un proceso para notificar un fallo de segmentación.</td>
  </tr>
  <tr>
    <td><code>SIGPIPE</code></td>
    <td>Enviada a un proceso cuando este ha intentado escribir datos a través de un pipe desconectado.</td>
  </tr>
  <tr>
    <td><code>SIGALRM</code></td>
    <td>Enviada a un proceso cuando un temporizador de sistema ha agotado su espera.</td>
  </tr>
  <tr>
    <td><code>SIGTERM</code></td>
    <td>Enviada a un proceso para solicitar su finalización.</td>
  </tr>
  <tr>
    <td><code>SIGCHLD</code></td>
    <td>Enviada a un proceso cuando finaliza un proceso secundario.</td>
  </tr>
  <tr>
    <td><code>SIGSTKFLT</code></td>
    <td>Enviada a un proceso para indicar una falla de pila en un co-procesador.</td>
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
    <td>Enviada a un proceso para solicitarle que se detenga.</td>
  </tr>
  <tr>
    <td><code>SIGBREAK</code></td>
    <td>Enviada para indicar el momento en el cual un usuario desea interrumpir un proceso.</td>
  </tr>
  <tr>
    <td><code>SIGTTIN</code></td>
    <td>Enviada a un proceso cuando este lee desde el TTY estando en el segundo plano.</td>
  </tr>
  <tr>
    <td><code>SIGTTOU</code></td>
    <td>Enviada a un proceso cuando este escribe al TTY estando en segundo plano.</td>
  </tr>
  <tr>
    <td><code>SIGURG</code></td>
    <td>Enviada a un proceso cuando un socket tiene datos urgentes por leer.</td>
  </tr>
  <tr>
    <td><code>SIGXCPU</code></td>
    <td>Enviada a un proceso cuando este ha excedido su límite de uso del CPU.</td>
  </tr>
  <tr>
    <td><code>SIGXFSZ</code></td>
    <td>Enviada a un proceso cuando produce un archivo más grande que el tamaño máximo permitido.</td>
  </tr>
  <tr>
    <td><code>SIGVTALRM</code></td>
    <td>Enviada a un proceso cuando un temporizador virtual ha agotado su espera.</td>
  </tr>
  <tr>
    <td><code>SIGPROF</code></td>
    <td>Enviada a un proceso cuando un temporizador de sistema ha agotado su espera.</td>
  </tr>
  <tr>
    <td><code>SIGWINCH</code></td>
    <td>Enviada a un proceso cuando el terminal de control ha cambiado de tamaño.</td>
  </tr>
  <tr>
    <td><code>SIGIO</code></td>
    <td>Enviada a un proceso cuando el I/O se encuentra disponible.</td>
  </tr>
  <tr>
    <td><code>SIGPOLL</code></td>
    <td>Sinónimo de <code>SIGIO</code></td>
  </tr>
  <tr>
    <td><code>SIGLOST</code></td>
    <td>Enviada a un proceso cuando se ha perdido un bloqueo de archivo.</td>
  </tr>
  <tr>
    <td><code>SIGPWR</code></td>
    <td>Enviada a un proceso para notificar una falla de energía.</td>
  </tr>
  <tr>
    <td><code>SIGINFO</code></td>
    <td>Sinónimo de <code>SIGPWR</code></td>
  </tr>
  <tr>
    <td><code>SIGSYS</code></td>
    <td>Enviada a un proceso para notificar un argumento erróneo.</td>
  </tr>
  <tr>
    <td><code>SIGUNUSED</code></td>
    <td>Sinónimo de <code>SIGSYS</code></td>
  </tr>
</table>

### Constantes de Error

The following error constants are exported by `os.constants.errno`.

#### Constantes de Error de POSIX

<table>
  <tr>
    <th>Constante</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>E2BIG</code></td>
    <td>Indica que la lista de argumentos es más larga de lo esperado.</td>
  </tr>
  <tr>
    <td><code>EACCES</code></td>
    <td>Indica que la operación no tenía los suficientes permisos.</td>
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
    <td>Indicates that there is no data available and to try the
    operation again later.</td>
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
    <td>Indica que hay demasiados archivos abiertos.</td>
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
    <td>Indica que no hay espacio suficiente.</td>
  </tr>
  <tr>
    <td><code>ENOMSG</code></td>
    <td>Indica que no hay ningún mensaje del tipo deseado.</td>
  </tr>
  <tr>
    <td><code>ENOPROTOOPT</code></td>
    <td>Indica que el protocolo indicado no está disponible.</td>
  </tr>
  <tr>
    <td><code>ENOSPC</code></td>
    <td>Indica que no hay espacio disponible dentro del dispositivo.</td>
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
    <td>Indica que la función no ha sido implementada.</td>
  </tr>
  <tr>
    <td><code>ENOTCONN</code></td>
    <td>Indica que el socket no está conectado.</td>
  </tr>
  <tr>
    <td><code>ENOTDIR</code></td>
    <td>Indica que la ruta actual no es un directorio.</td>
  </tr>
  <tr>
    <td><code>ENOTEMPTY</code></td>
    <td>Indica que el directorio actual no está vacío.</td>
  </tr>
  <tr>
    <td><code>ENOTSOCK</code></td>
    <td>Indica que el producto enviado no es un socket.</td>
  </tr>
  <tr>
    <td><code>ENOTSUP</code></td>
    <td>Indica que la operación hecha no está soportada.</td>
  </tr>
  <tr>
    <td><code>ENOTTY</code></td>
    <td>Indica una operación inapropiada de control de I/O (input/output).</td>
  </tr>
  <tr>
    <td><code>ENXIO</code></td>
    <td>Indica que no existe el dispositivo o dirección señalados.</td>
  </tr>
  <tr>
    <td><code>EOPNOTSUPP</code></td>
    <td>Indica que la operación no es soportada en el socket. Although
    <code>ENOTSUP</code> and <code>EOPNOTSUPP</code> have the same value
    on Linux, according to POSIX.1 these error values should be distinct.)</td>
  </tr>
  <tr>
    <td><code>EOVERFLOW</code></td>
    <td>Indica que un valor es demasiado grande como para ser almacenado en un tipo de datos específico.</td>
  </tr>
  <tr>
    <td><code>EPERM</code></td>
    <td>Indica que la operación no esta permitida.</td>
  </tr>
  <tr>
    <td><code>EPIPE</code></td>
    <td>Indica que hay un pipe roto.</td>
  </tr>
  <tr>
    <td><code>EPROTO</code></td>
    <td>Indica un error de protocolo.</td>
  </tr>
  <tr>
    <td><code>EPROTONOSUPPORT</code></td>
    <td>Indica que el protocolo no esta soportado.</td>
  </tr>
  <tr>
    <td><code>EPROTOTYPE</code></td>
    <td>Inidica un tipo incorrecto de protocolo para el socket.</td>
  </tr>
  <tr>
    <td><code>ERANGE</code></td>
    <td>Indica que los resultados son demasiado largos.</td>
  </tr>
  <tr>
    <td><code>EROFS</code></td>
    <td>Indica que el sistema de archivos es de solo lectura.</td>
  </tr>
  <tr>
    <td><code>ESPIPE</code></td>
    <td>Indica una operación de búsqueda inválida.</td>
  </tr>
  <tr>
    <td><code>ESRCH</code></td>
    <td>Indica que no existe tal proceso.</td>
  </tr>
  <tr>
    <td><code>ESTALE</code></td>
    <td>Indica que el handle del archivo es obsoleto.</td>
  </tr>
  <tr>
    <td><code>ETIME</code></td>
    <td>Indica un temporizador expirado.</td>
  </tr>
  <tr>
    <td><code>ETIMEDOUT</code></td>
    <td>Indica que se agoto el tiempo de conexión.</td>
  </tr>
  <tr>
    <td><code>ETXTBSY</code></td>
    <td>Indica que el archivo de texto esta ocupado.</td>
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

#### Constantes de error especificas de Windows

The following error codes are specific to the Windows operating system.

<table>
  <tr>
    <th>Constante</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>WSAEINTR</code></td>
    <td>Indica una llamada de función interrumpida.</td>
  </tr>
  <tr>
    <td><code>WSAEBADF</code></td>
    <td>Indica un handle de archivo inválido.</td>
  </tr>
  <tr>
    <td><code>WSAEACCES</code></td>
    <td>Indica permisos insuficientes para completar la operación.</td>
  </tr>
  <tr>
    <td><code>WSAEFAULT</code></td>
    <td>Indica una dirección de puntero inválida.</td>
  </tr>
  <tr>
    <td><code>WSAEINVAL</code></td>
    <td>Indica que un argumento invalido fue pasado.</td>
  </tr>
  <tr>
    <td><code>WSAEMFILE</code></td>
    <td>Indica que hay demasiados archivos abiertos.</td>
  </tr>
  <tr>
    <td><code>WSAEWOULDBLOCK</code></td>
    <td>Indica que de manera temporal el recurso no se encuentra disponible.</td>
  </tr>
  <tr>
    <td><code>WSAEINPROGRESS</code></td>
    <td>Indica que una operación está actualmente en curso.</td>
  </tr>
  <tr>
    <td><code>WSAEALREADY</code></td>
    <td>Indica que una operación ya se encuentra en progreso.</td>
  </tr>
  <tr>
    <td><code>WSAENOTSOCK</code></td>
    <td>Indica que el recurso no es un socket.</td>
  </tr>
  <tr>
    <td><code>WSAEDESTADDRREQ</code></td>
    <td>Indica que se requiere una dirección de destino.</td>
  </tr>
  <tr>
    <td><code>WSAEMSGSIZE</code></td>
    <td>Indica que el tamaño del mensaje es demasiado largo.</td>
  </tr>
  <tr>
    <td><code>WSAEPROTOTYPE</code></td>
    <td>Indica un tipo incorrecto de protocolo para el socket.</td>
  </tr>
  <tr>
    <td><code>WSAENOPROTOOPT</code></td>
    <td>Indica una opción de protocolo errónea.</td>
  </tr>
  <tr>
    <td><code>WSAEPROTONOSUPPORT</code></td>
    <td>Indica que el protocolo no esta soportado.</td>
  </tr>
  <tr>
    <td><code>WSAESOCKTNOSUPPORT</code></td>
    <td>Indica que el tipo de socket no es soportado.</td>
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
    <td>Indica que el directorio actual no está vacío.</td>
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

### Priority Constants<!-- YAML
added: v10.10.0
-->The following process scheduling constants are exported by `os.constants.priority`.

<table>
  <tr>
    <th>Constante</th>
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

### Constantes de libuv

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

