# SO

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

El módulo `so` provee un número de métodos de utilidad relacionados al sistema operativo. Puede ser accesado a el usando:

```js
const os = require('os');
```

## os.EOL

<!-- YAML
added: v0.7.8
-->

* {string}

Una constante de string definiendo el marcador del carácter especial específico del sistema operativo:

* `\n` en POSIX
* `\r\n\r\n` en Windows

## os.arch()

<!-- YAML
added: v0.5.0
-->

* Devuelve: {string}

El método `os.arch()` devuelve una línea identificando la arquitectura del CPU del sistema operativo para el cual el binario de Node.js fue compilado.

Los actuales valores posibles son: `'arm'`, `'arm64'`, `'ia32'`, `'mips'`, `'mipsel'`, `'ppc'`, `'ppc64'`, `'s390'`, `'s390x'`, `'x32'`, y `'x64'`.

Equivalente para [`process.arch`][].

## os.constants

<!-- YAML
added: v6.3.0
-->

* {Object}

Devuelve un objeto que contiene constantes específicas del sistema operativo comúnmente usadas para códigos de error, señales de proceso, y así sucesivamente. Las constantes específicas actualmente definidas son descritas como [Constantes del SO](#os_os_constants_1).

## os.cpus()

<!-- YAML
added: v0.3.3
-->

* Returns: {Object[]}

El método `os.cpus()` devuelve un conjunto de objetos conteniendo información acerca de cada core lógico del CPU.

Las propiedades incluidas en cada objeto incluyen:

* `model`{string}
* `speed`{number} (en MHz)
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

Porque los valores `nice` son específicos de UNIX, en Windows los valores `nice` todos los procesos son siempre 0.

## os.endianness()

<!-- YAML
added: v0.9.4
-->

* Retorna: {string}

El método `os.endianness()` devuelve una línea identificando la endianidad del CPU* para la cual el binario Node.js fue compilado*.

Los posibles valores son:

* `'BE'` para gran Endian
* `'LE'` para pequeño Endian.

## os.freemem()

<!-- YAML
added: v0.3.3
-->

* Devuelve: {integer}

El método `os.freemem()` devuelve la cantidad de memoria libre del sistema en bytes como un entero.

## os.homedir()

<!-- YAML
added: v2.3.0
-->

* Devuelve: {string}

El método `os.homedir()` devuelve el directorio hogar del usuario actual como una línea.

## os.hostname()

<!-- YAML
added: v0.3.3
-->

* Devuelve: {string}

El método `os.hostname()` devuelve el nombre del dueño del sistema operativo como una string.

## os.loadavg()

<!-- YAML
added: v0.3.3
-->

* Devuelve: {number[]}

El método `os.loadavg()` devuelve un conjunto conteniendo los promedios de carga de 1,5 y 15 minutos.

El promedio de carga es una medida de la actividad del sistema, calculado por el sistema operativo y expresado como un número fraccionario. Como regla general, la carga promedio debería ser idealmente menor que el número de CPUs lógicos en el sistema.

La carga promedio es un concepto específico de UNIX con ningún equivalente real en las plataformas Windows. En Windows, el valor de retorno siempre es `[0, 0, 0]`.

## os.networkInterfaces()

<!-- YAML
added: v0.6.0
-->

* Devuelve: {Object}

El método `os.networkInterfaces()` devuelve un objeto conteniendo solamente interfaces en la red que han sido asignados a la dirección de la red.

Cada tecla en el objeto devuelto identifica la interfaz de red. El valor asociado es un conjunto de objetos donde cada uno describe una dirección asignada a la red.

Las propiedades disponibles en el objeto de dirección de red asignado incluyen:

* `address` {string} La dirección IPv4 o IPv6 asignada
* `netmask` {string} La máscara de red IPv4 o IPv6
* `family` {string} Para `IPv4` o `IPv6`
* `mac` {string} La dirección MAC de la interfaz de red
* `internal` {boolean} `true` si la interfaz de la red es un loopback o es una interfaz similar que no es remotamente accesible; de otra forma `false`
* `scopeid` {number} El identificador numérico IPv6 (solamente especificado cuando `family` es `IPv6`)
* `cidr` {string} The assigned IPv4 or IPv6 address with the routing prefix in CIDR notation. Si la `netmask` es invalida, esta propiedad está colocada a `null`.

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

El método `os.platform()` devuelve un string identificando la plataforma del sistema operativo como fue colocada durante el tiempo de compilación de Node.js.

Los posibles valores actuales son:

* `'aix'`
* `'darwin'`
* `'freebsd'`
* `'linux'`
* `'openbsd'`
* `'sunos'`
* `'win32'`

Equivalente para [`process.platform`][].

El valor `'android'` puede también ser devuelto si Node.js está construido en un sistema operativo Android. Sin embargo, el soporte de Android es considerado[ experimental](https://github.com/nodejs/node/blob/master/BUILDING.md#androidandroid-based-devices-eg-firefox-os) actualmente.

## os.release()

<!-- YAML
added: v0.3.3
-->

* Retorna: {string}

El método `os.release()` retorna un string identificando la versión del sistema operativo.

En sistemas POSIX, la versión del sistema operativo es determinada llamando [uname(3)](https://linux.die.net/man/3/uname). En Windows, `GetVersionExW()` es usado. Por favor vea https://en.wikipedia.org/wiki/Uname#Examples para mayor información.

## os.tmpdir()

<!-- YAML
added: v0.9.9
changes:

  - version: v2.0.0
    pr-url: https://github.com/nodejs/node/pull/747
    description: This function is now cross-platform consistent and no longer
                 returns a path with a trailing slash on any platform
-->

* Retorna: {string}

El método `os.tmpdir()` retorna una string que especifica el directorio predeterminado del sistema operativo para los archivos temporales.

## os.totalmem()

<!-- YAML
added: v0.3.3
-->

* Retorna: {integer}

El método `os.totalmem()` retorna la cantidad total de memoria del sistema en bytes como un entero.

## os.type()

<!-- YAML
added: v0.3.3
-->

* Retorna: {string}

El método `os.type()` retorna una string identificando el nombre del sistema operativo como es retornado por [uname(3)](https://linux.die.net/man/3/uname). Por ejemplo`'Linux'` en Linux, `'Darwin'` en macOS y `'Windows_NT'` en Windows.

Por favor vea https://en.wikipedia.org/wiki/Uname#Examples para información adicional sobre los resultados de correr [uname(3)](https://linux.die.net/man/3/uname) en distintos sistemas operativos.

## os.uptime()

<!-- YAML
added: v0.3.3
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/20129
    description: The result of this function no longer contains a fraction
                 component on Windows.
-->

* Retorna: {integer}

El método de `os.uptime()` retorna el tiempo de operación del sistema en segundos.

## os.userInfo([options])

<!-- YAML
added: v6.0.0
-->

* `opciones` {Object} 
  * `encoding` {string} Cifrado de caracteres usado para interpretar strings resultantes. Si `encoding` esta colocado en `'buffer'`, el `username`, `shell`, y `homedir` valores serán instancias `Buffer`. **Predeterminado:** `'utf8'`.
* Retorna: {Object}

El método `os.userInfo()` retorna información acerca del actual usuario efectivo -- en plataformas POSIX, esto es tipicamente un subconjunto en el archivo de contraseñas. El objeto devuelto incluye el `username`, `uid`, `gid`, `shell`, y `homedir`. En Windows, el `uid` y `gid` campos son `-1`, y `shell` es `null`.

El valor del `homedir` deveulto por `os.userInfo()` es provisto por el sistema operativo. Esto difiere del resultado de `os.homedir()` el cual consulta distintas variables del entorno para el directorio hogar antes de recurrir a la respuesta del sistema operativo.

## Constantes del SO

Las siguientes constantes son exportadas por `os.constants`.

No todas las constantes estarán disponibles en todos los sistemas operativos.

### Constantes de Señal

<!-- YAML
changes:

  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/6093
    description: Added support for `SIGINFO`.
-->

Las siguientes constantes son exportadas por `os.constants.signals`:

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
    <td>Enviada para indicar cuando un usuario desea interrumpir un proceso (`(Ctrl+C)`).</td>
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
    <td>Enviada para indicar al sistema operativo que continue un proceso pausado.</td>
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
    <td>Indica que la dirección de red se encuentra en uso.</td>
  </tr>
  <tr>
    <td><code>EADDRNOTAVAIL</code></td>
    <td>Indica que la dirección de red se encuentra no disponible para su uso.</td>
  </tr>
  <tr>
    <td><code>EAFNOSUPPORT</code></td>
    <td>Indica que la familia de la dirección de red no es compatible.</td>
  </tr>
  <tr>
    <td><code>EAGAIN</code></td>
    <td>Indica que no hay datos disponibles y que se debe intentar la operación más tarde.</td>
  </tr>
  <tr>
    <td><code>EALREADY</code></td>
    <td>Indica que el socket ya tiene una conexión pendiente en proceso.</td>
  </tr>
  <tr>
    <td><code>EBADF</code></td>
    <td>Indica que un descriptor del archivo no es válido.</td>
  </tr>
  <tr>
    <td><code>EBADMSG</code></td>
    <td>Indica un mensaje de datos inválido.</td>
  </tr>
  <tr>
    <td><code>EBUSY</code></td>
    <td>Indica que un dispositivo o recurso está ocupado.</td>
  </tr>
  <tr>
    <td><code>ECANCELED</code></td>
    <td>Indica que una operación fue cancelada.</td>
  </tr>
  <tr>
    <td><code>ECHILD</code></td>
    <td>Indica que no no hay procesos secundarios.</td>
  </tr>
  <tr>
    <td><code>ECONNABORTED</code></td>
    <td>Indica que la conexión de red ha sido abortada.</td>
  </tr>
  <tr>
    <td><code>ECONNREFUSED</code></td>
    <td>Indica que la conexión de red fue rechazada.</td>
  </tr>
  <tr>
    <td><code>ECONNRESET</code></td>
    <td>Indica que la conexión de red fue reiniciada.</td>
  </tr>
  <tr>
    <td><code>EDEADLK</code></td>
    <td>Indica que un bloqueo de recursos ha sido evadido.</td>
  </tr>
  <tr>
    <td><code>EDESTADDRREQ</code></td>
    <td>Indica que una dirección destino es requerida.</td>
  </tr>
  <tr>
    <td><code>EDOM</code></td>
    <td>Indica que un argumento está fuera del dominio de la función.</td>
  </tr>
  <tr>
    <td><code>EDQUOT</code></td>
    <td>Indica que se ha excedido la cuota del disco.</td>
  </tr>
  <tr>
    <td><code>EEXIST</code></td>
    <td>Indica que el archivo existe.</td>
  </tr>
  <tr>
    <td><code>EFAULT</code></td>
    <td>Indica una dirección de puntero no válido.</td>
  </tr>
  <tr>
    <td><code>EFBIG</code></td>
    <td>Indica que el archivo es muy grande.</td>
  </tr>
  <tr>
    <td><code>EHOSTUNREACH</code></td>
    <td>Indica que el host es inalcanzable.</td>
  </tr>
  <tr>
    <td><code>EIDRM</code></td>
    <td>Indica que el identificador ha sido removido.</td>
  </tr>
  <tr>
    <td><code>EILSEQ</code></td>
    <td>Indica una secuencia ilegal de bytes.</td>
  </tr>
  <tr>
    <td><code>EINPROGRESS</code></td>
    <td>Indica que una operación está en progreso.</td>
  </tr>
  <tr>
    <td><code>EINTR</code></td>
    <td>Indica que un llamado a la función fue interrumpido.</td>
  </tr>
  <tr>
    <td><code>EINVAL</code></td>
    <td>Indica que un argumento inválido fue proporcionado.</td>
  </tr>
  <tr>
    <td><code>EIO</code></td>
    <td>Indica un error E/A no especificado.</td>
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
    <td>Indica muchos niveles de enlaces simbólicos en la ruta.</td>
  </tr>
  <tr>
    <td><code>EMFILE</code></td>
    <td>Indica que hay demasiados archivos abiertos.</td>
  </tr>
  <tr>
    <td><code>EMLINK</code></td>
    <td>Indica que hay muchos enlaces duros a un archivo.</td>
  </tr>
  <tr>
    <td><code>EMSGSIZE</code></td>
    <td>Indica que el mensaje provisto es muy largo.</td>
  </tr>
  <tr>
    <td><code>EMULTIHOP</code></td>
    <td>Indica que un multisalto fue intentado.</td>
  </tr>
  <tr>
    <td><code>ENAMETOOLONG</code></td>
    <td>Indica que el nombre del archivo es muy largo.</td>
  </tr>
  <tr>
    <td><code>ENETDOWN</code></td>
    <td>Indica que la red esta caída.</td>
  </tr>
  <tr>
    <td><code>ENETRESET</code></td>
    <td>Indica que la conexión fue abortada por la red.</td>
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
    <td>Indica que no hay mensajes disponibles en la cola de lectura.</td>
  </tr>
  <tr>
    <td><code>ENODEV</code></td>
    <td>Indica que no existe tal dispositivo.</td>
  </tr>
  <tr>
    <td><code>ENOENT</code></td>
    <td>Indica que no existe tal directorio o archivo.</td>
  </tr>
  <tr>
    <td><code>ENOEXEC</code></td>
    <td>Indica que hay un error de formato exec.</td>
  </tr>
  <tr>
    <td><code>ENOLCK</code></td>
    <td>Indica que no hay bloqueos disponibles.</td>
  </tr>
  <tr>
    <td><code>ENOLINK</code></td>
    <td>Indica que un enlace se ha roto.</td>
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
    <td>Indica que no hay recursos del stream disponibles.</td>
  </tr>
  <tr>
    <td><code>ENOSTR</code></td>
    <td>Indica que un recurso dado no es un stream.</td>
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
    <td>Indica que la operación no es compatible con el socket.
    Note que mientras `ENOTSUP` y `EOPNOTSUPP` tienen el mismo valor en Linux, de acuerdo a POSIX. 1 los valores de error deben ser distintos.)</td>
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
    <td>Indica que el tipo incorrecto de protocolo para un socket.</td>
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

Los siguientes códigos de error son específicos del sistema operativo windows:

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
    <td>Indica que la operación no es compatible.</td>
  </tr>
  <tr>
    <td><code>WSAEPFNOSUPPORT</code></td>
    <td>Indica que la familia de protocolo no es compatible.</td>
  </tr>
  <tr>
    <td><code>WSAEAFNOSUPPORT</code></td>
    <td>Indica que la familia de direcciones no es compatible.</td>
  </tr>
  <tr>
    <td><code>WSAEADDRINUSE</code></td>
    <td>Indica que la dirección de red se encuentra en uso.</td>
  </tr>
  <tr>
    <td><code>WSAEADDRNOTAVAIL</code></td>
    <td>Indica que la dirección de red no se encuentra disponible.</td>
  </tr>
  <tr>
    <td><code>WSAENETDOWN</code></td>
    <td>Indica que la red está caída.</td>
  </tr>
  <tr>
    <td><code>WSAENETUNREACH</code></td>
    <td>Indica que la red es inalcanzable.</td>
  </tr>
  <tr>
    <td><code>WSAENETRESET</code></td>
    <td>Indica que la conexión de red fue reiniciada.</td>
  </tr>
  <tr>
    <td><code>WSAECONNABORTED</code></td>
    <td>Indica que la conexión ha sido abortada.</td>
  </tr>
  <tr>
    <td><code>WSAECONNRESET</code></td>
    <td>Indica que la conexión fue reiniciada por el par.</td>
  </tr>
  <tr>
    <td><code>WSAENOBUFS</code></td>
    <td>Indica que no hay espacio de búfer disponible.</td>
  </tr>
  <tr>
    <td><code>WSAEISCONN</code></td>
    <td>Indica que el socket se encuentra conectado.</td>
  </tr>
  <tr>
    <td><code>WSAENOTCONN</code></td>
    <td>Indica que el socket no se encuentra conectado.</td>
  </tr>
  <tr>
    <td><code>WSAESHUTDOWN</code></td>
    <td>Indica que los datos no pueden ser enviados luego de que el socket se haya apagado.</td>
  </tr>
  <tr>
    <td><code>WSAETOOMANYREFS</code></td>
    <td>Indica que hay demasiadas referencias.</td>
  </tr>
  <tr>
    <td><code>WSAETIMEDOUT</code></td>
    <td>Indica que la conexión ha sido interrumpida.</td>
  </tr>
  <tr>
    <td><code>WSAECONNREFUSED</code></td>
    <td>Indica que la conexión ha sido rechazada.</td>
  </tr>
  <tr>
    <td><code>WSAELOOP</code></td>
    <td>Indica que el nombre no puede ser traducido.</td>
  </tr>
  <tr>
    <td><code>WSAENAMETOOLONG</code></td>
    <td>Indica que el nombre es demasiado largo.</td>
  </tr>
  <tr>
    <td><code>WSAEHOSTDOWN</code></td>
    <td>Indica que un host de la red está caído.</td>
  </tr>
  <tr>
    <td><code>WSAEHOSTUNREACH</code></td>
    <td>Indica que no hay ninguna ruta al host de la red.</td>
  </tr>
  <tr>
    <td><code>WSAENOTEMPTY</code></td>
    <td>Indica que el directorio no está vacío.</td>
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
    <td>Indica que la cuota de disco ha sido excedida.</td>
  </tr>
  <tr>
    <td><code>WSAESTALE</code></td>
    <td>Indica un descriptor de archivo viejo.</td>
  </tr>
  <tr>
    <td><code>WSAEREMOTE</code></td>
    <td>Indica que el elemento es remoto.</td>
  </tr>
  <tr>
    <td><code>WSASYSNOTREADY</code></td>
    <td>Indica que el subsistema de la red no está listo.</td>
  </tr>
  <tr>
    <td><code>WSAVERNOTSUPPORTED</code></td>
    <td>Indica que la versión de `winsock.dll` está fuera de rango.</td>
  </tr>
  <tr>
    <td><code>WSANOTINITIALISED</code></td>
    <td>Indica que el WSAStartup no ha sido realizado con éxito.</td>
  </tr>
  <tr>
    <td><code>WSAEDISCON</code></td>
    <td>Indica que un proceso de apagado exitoso está en progreso.</td>
  </tr>
  <tr>
    <td><code>WSAENOMORE</code></td>
    <td>Indica que no hay más resultados.</td>
  </tr>
  <tr>
    <td><code>WSAECANCELLED</code></td>
    <td>Indica que hay una operación ha sido cancelada.</td>
  </tr>
  <tr>
    <td><code>WSAEINVALIDPROCTABLE</code></td>
    <td>Indica que la tabla de llamada de procedimiento es inválida-.</td>
  </tr>
  <tr>
    <td><code>WSAEINVALIDPROVIDER</code></td>
    <td>Indica un proveedor de servicio inválido.</td>
  </tr>
  <tr>
    <td><code>WSAEPROVIDERFAILEDINIT</code></td>
    <td>Indica que el proveedor del servicio falló al inicializar.</td>
  </tr>
  <tr>
    <td><code>WSASYSCALLFAILURE</code></td>
    <td>Indica un fallo de llamada del sistema.</td>
  </tr>
  <tr>
    <td><code>WSASERVICE_NOT_FOUND</code></td>
    <td>Indica que el servicio no fue encontrado.</td>
  </tr>
  <tr>
    <td><code>WSATYPE_NOT_FOUND</code></td>
    <td>Indica que el tipo de clase no fue encontrado.</td>
  </tr>
  <tr>
    <td><code>WSA_E_NO_MORE</code></td>
    <td>Indica que no hay mas resultados.</td>
  </tr>
  <tr>
    <td><code>WSA_E_CANCELLED</code></td>
    <td>Indica que el llamado fue cancelado.</td>
  </tr>
  <tr>
    <td><code>WSAEREFUSED</code></td>
    <td>Indica que una consulta a la base de datos fue rechazada.</td>
  </tr>
</table>

### constantes dlopen

Si se encuentran en el sistema operativo, las siguientes constantes son exportadas en `os.constants.dlopen`. Vea dlopen(3) para información detallada.

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
    <td>La conversa de `RTLD_GLOBAL`. Este es el compartamiento predeterminado si ningún parámetro es especificado.</td>
  </tr>
  <tr>
    <td><code>RTLD_DEEPBIND</code></td>
    <td>Hace que una librería auto contenida use sus propio símbolos de preferencia a símbolos de librerías cargadas previamente.</td>
  </tr>
</table>

### constantes libuv

<table>
  <tr>
    <th>Constantes</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>UV_UDP_REUSEADDR</code></td>
    <td></td>
  </tr>
</table>
