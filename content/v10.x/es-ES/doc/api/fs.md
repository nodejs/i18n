# Sistema de Archivos

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

<!--name=fs-->

El módulo de `fs` proporciona una API para interactuar con el sistema de archivos de una manera estrechamente modelado por las funciones estándar de POSIX.

Para utilizar este módulo:

```js
const fs = require('fs');
```

Todas las operaciones del sistema de archivo tienen formas sincrónicas y asincrónicas.

La forma asincrónica toma siempre una devolución de llamada de finalización como su último argumento. Los argumentos pasados a la devolución de llamada de finalización dependen del método, pero el primer argumento se reserva siempre una excepción. Si la operación se completó con éxito, entonces el primer argumento será `null` o `undefined`.

```js
const fs = require('fs');

fs.unlink('/tmp/hello', (err) => {
  if (err) throw err;
  console.log('successfully deleted /tmp/hello');
});
```

Excepciones que se producen utilizando operaciones sincrónicas se lanzan inmediatamente y puede ser manejadas mediante `try`/`catch`, o puede ser permitido que se acumulen.

```js
const fs = require('fs');

try {
  fs.unlinkSync('/tmp/hello');
  console.log('successfully deleted /tmp/hello');
} catch (err) {
  // handle the error
}
```

There is no guaranteed ordering when using asynchronous methods. So the following is prone to error because the `fs.stat()` operation may complete before the `fs.rename()` operation:

```js
fs.rename('/tmp/hello', '/tmp/world', (err) => {
  if (err) throw err;
  console.log('renamed complete');
});
fs.stat('/tmp/world', (err, stats) => {
  if (err) throw err;
  console.log(`stats: ${JSON.stringify(stats)}`);
});
```

Para ordenar correctamente las operaciones, mover la llamada `fs.stat()` en la devolución de llamada de la operación `fs.rename()`:

```js
fs.rename('/tmp/hello', '/tmp/world', (err) => {
  if (err) throw err;
  fs.stat('/tmp/world', (err, stats) => {
    if (err) throw err;
    console.log(`stats: ${JSON.stringify(stats)}`);
  });
});
```

En procesos difíciles, el programador es _fuertemente aconsejado_ a que utilice las versiones asincrónicas de estas llamadas. Las versiones sincrónicas bloquearán todo el proceso hasta que terminen de — detener todas las conexiones.

Aunque no es recomendado, la mayoría de las funciones fs permiten que el argumento de devolución de llamada sea omitido, en este caso, una devolución de llamada predeterminada sea usada para regenerar errores. Para obtener un trace hacia el sitio de llamada original, establezca la variable de entorno `NODE_DEBUG`:

Omitir la función de callback en funciones fs asincrónicas es obsoleto y su resultado puede ser un error que ocurrirá en el futuro.

```txt
$ cat script.js
function bad() {
  require('fs').readFile('/');
}
bad();

$ env NODE_DEBUG=fs node script.js
fs.js:88
        throw backtrace;
        ^
Error: EISDIR: illegal operation on a directory, read
    <stack trace.>
```

## Rutas de archivo

La mayoría de las operaciones de `fs` aceptan rutas de archivo que pueden ser especificadas en la forma de una string, un [`Buffer`][], o un objeto de [`URL`][] utilizando el protocolo `file:` .

Las rutas formadas por string se interpretan como secuencias de caracteres UTF-8, que identifican el nombre de archivo absoluto o relativo. Las rutas relativas serán resueltas en relación al actual directorio funcional como lo especifica `process.cwd()`.

Ejemplo utilizando una ruta absoluta en POSIX:

```js
const fs = require('fs');

fs.open('/abrir/algun/archivo.txt', 'r', (err, fd) => {
  if (err) throw err;
  fs.close(fd, (err) => {
    if (err) throw err;
  });
});
```

Ejemplo utilizando una ruta relativa en POSIX (con relación a `process.cwd()`):

```js
fs.open('archivo.txt', 'r', (err, fd) => {
  if (err) throw err;
  fs.close(fd, (err) => {
    if (err) throw err;
  });
});
```

Las rutas especificadas mediante un [`Buffer`][] son útiles principalmente en ciertos sistemas operativos de POSIX que tratan las rutas de archivo como secuencias de bytes opacas. En tales sistemas, es posible que una única ruta de archivo contenga sub-secuencias que utilicen múltiples codificaciones de caracteres. En cuanto a rutas de strings, las rutas de `Buffer` pueden ser relativas o absolutas:

Ejemplo utilizando una ruta absoluta en POSIX:

```js
fs.open(Buffer.from('/abrir/algun/archivo.txt'), 'r', (err, fd) => {
  if (err) throw err;
  fs.close(fd, (err) => {
    if (err) throw err;
  });
});
```

On Windows, Node.js follows the concept of per-drive working directory. This behavior can be observed when using a drive path without a backslash. Por ejemplo, `fs.readdirSync('c:\\')` puede potencialmente devolver un resultado diferente a `fs.readdirSync('c:')`. Para más información, consulte [esta página de MSDN](https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file#fully-qualified-vs-relative-paths).

### Soporte de objetos de URL
<!-- YAML
added: v7.6.0
-->
Para la mayoría de las funciones de módulo de 

`fs`, el `path` o el argumento de `filename` pueden ser pasados como un objeto de [`URL`][] de WHATWG. Sólo los objetos de [`URL`][] que utilizan el protocolo de `file:` son soportados.

```js
const fs = require('fs');
const fileUrl = new URL('file:///tmp/hola');

fs.readFileSync(fileUrl);
```

`file:` Las URLs siempre son rutas absolutas.

Utilizar objetos de [`URL`][] de WHATWG podría introducir comportamientos específicos a la plataforma.

En Windows, URLs del tipo `file:` con un hostname se convierten en rutas UNC, mientras que URLs `file:` con letras de unidades se convierten en rutas absolutas locales. URLs `file:` sin hostname o letra de unidad resultaran en un throw:

```js
// En Windows :

// - WHATWG URLs con hostname se convierten en rutas UNC
// file://hostname/p/a/t/h/file => \\hostname\p\a\t\h\file
fs.readFileSync(new URL('file://hostname/p/a/t/h/file'));

// - WHATWG URLs file con letras de unidad se convierten en rutas absolutas
// file:///C:/tmp/hello => C:\tmp\hello
fs.readFileSync(new URL('file:///C:/tmp/hello'));

// - WHATWG URLs file sin hostname deberá tener la letra de la unidad
fs.readFileSync(new URL('file:///notdriveletter/p/a/t/h/file'));
fs.readFileSync(new URL('file:///c/p/a/t/h/file'));
// TypeError [ERR_INVALID_FILE_URL_PATH]: File URL path must be absolute
```

URLs `file:` con letras de unidad deberán de usar `:` como separador inmediatamente después de la letra de la unidad. Utilizar otro separador dará como resultado un lanzamiento.

En todas las demás plataformas, las URLs de `file:` con un nombre de host no son soportadas y resultarán en un lanzamiento:

```js
// En otras plataformas:

// - WHATWG file URLs con hostname no son compatibles
// file://hostname/p/a/t/h/file => throw!
fs.readFileSync(new URL('file://hostname/p/a/t/h/file'));
// TypeError [ERR_INVALID_FILE_URL_PATH]: debe ser absoluto

// - WHATWG file URLs  se convierten en direcciones absolutas
// file:///tmp/hello => /tmp/hello
fs.readFileSync(new URL('file:///tmp/hello'));
```

Una URL `file:` teniendo caracteres codificados resultara en un throw en todas las plataformas:

```js
// En Windows
fs.readFileSync(new URL('file:///C:/p/a/t/h/%2F'));
fs.readFileSync(new URL('file:///C:/p/a/t/h/%2f'));
/* TypeError [ERR_INVALID_FILE_URL_PATH]: File URL path must not include encoded
\ or / characters */

// En POSIX
fs.readFileSync(new URL('file:///p/a/t/h/%2F'));
fs.readFileSync(new URL('file:///p/a/t/h/%2f'));
/* TypeError [ERR_INVALID_FILE_URL_PATH]: File URL path must not include encoded
/ characters */
```
En Windows, URLs `file:` teniendo barras codificadas resultaran en un throw:

```js
// En Windows
fs.readFileSync(new URL('file:///C:/path/%5C'));
fs.readFileSync(new URL('file:///C:/path/%5c'));
/* TypeError [ERR_INVALID_FILE_URL_PATH]: File URL path must not include encoded
\ or / characters */
```

## Descriptores de archivo

En sistemas de POSIX, para cada proceso, el núcleo mantiene un tablero de archivos actualmente abiertos y recursos. Each open file is assigned a simple numeric identifier called a *file descriptor*. A nivel de sistema, todas las operaciones del sistema de archivos utilizan estos descriptores de archivo para identificar y rastrear cada archivo específico. Los sistemas de Windows utilizan un mecanismo que es diferente, pero conceptualmente similar para los recursos de rastreo. Para simplificar cosas al usuario, Node.js se abstrae las diferencias entre sistemas operativos y asigna a todos los archivos abiertos un descriptor numérico.

El método `fs.open()` se utiliza para asignar un nuevo descriptor de archivo. Una vez asignado, el descriptor de archivo puede ser utilizado para leer datos desde, escribir datos a, o solicitar información sobre el archivo.

```js
fs.open('/abrir/algun/archivo.txt', 'r', (err, fd) => {
  if (err) throw err;
  fs.fstat(fd, (err, stat) => {
    if (err) throw err;
    // use stat

    // Siempre cierra el descriptor de archivo
    fs.close(fd, (err) => {
      if (err) throw err;
    });
  });
});
```

La mayoría de los sistemas operativos limitan el número de descriptores de archivo que pueden ser abiertos en un momento dado, por lo que es crucial cerrar el descriptor cuando se completan las operaciones. Si no se logra, resultará en una pérdida de memoria que eventualmente hará que una aplicación falle.

## Uso del Threadpool

All file system APIs except `fs.FSWatcher()` and those that are explicitly synchronous use libuv's threadpool, which can have surprising and negative performance implications for some applications. See the [`UV_THREADPOOL_SIZE`][] documentation for more information.

## Class: fs.Dirent
<!-- YAML
added: v10.10.0
-->

When [`fs.readdir()`][] or [`fs.readdirSync()`][] is called with the `withFileTypes` option set to `true`, the resulting array is filled with `fs.Dirent` objects, rather than strings or `Buffers`.

### dirent.isBlockDevice()
<!-- YAML
added: v10.10.0
-->

* Devuelve: {boolean}

Returns `true` if the `fs.Dirent` object describes a block device.

### dirent.isCharacterDevice()
<!-- YAML
added: v10.10.0
-->

* Devuelve: {boolean}

Returns `true` if the `fs.Dirent` object describes a character device.

### dirent.isDirectory()
<!-- YAML
added: v10.10.0
-->

* Devuelve: {boolean}

Returns `true` if the `fs.Dirent` object describes a file system directory.

### dirent.isFIFO()
<!-- YAML
added: v10.10.0
-->

* Devuelve: {boolean}

Returns `true` if the `fs.Dirent` object describes a first-in-first-out (FIFO) pipe.

### dirent.isFile()
<!-- YAML
added: v10.10.0
-->

* Devuelve: {boolean}

Returns `true` if the `fs.Dirent` object describes a regular file.

### dirent.isSocket()
<!-- YAML
added: v10.10.0
-->

* Devuelve: {boolean}

Returns `true` if the `fs.Dirent` object describes a socket.

### dirent.isSymbolicLink()
<!-- YAML
added: v10.10.0
-->

* Devuelve: {boolean}

Returns `true` if the `fs.Dirent` object describes a symbolic link.


### dirent.name
<!-- YAML
added: v10.10.0
-->

* {string|Buffer}

The file name that this `fs.Dirent` object refers to. The type of this value is determined by the `options.encoding` passed to [`fs.readdir()`][] or [`fs.readdirSync()`][].

## Clase: fs.FSWatcher
<!-- YAML
added: v0.5.8
-->

Una llamada exitosa al método de [`fs.watch()`][] devolverá un nuevo objeto de `fs.FSWatcher` .

Todos los objetos de `fs.FSWatcher` son [`EventEmitter`][]'s que emitirán un evento de `'change'` cuando se modifique un archivo específico visto.

### Evento: 'change'
<!-- YAML
added: v0.5.8
-->

* `eventType` {string} El tipo de evento de cambio que ha ocurrido
* `filename` {string|Buffer} El nombre de archivo que cambió (si es relevante/disponible)

Se emite cuando algo cambia en un directorio o archivo observado. Vea más detalles en [`fs.watch()`][].

El argumento de `filename` puede no estar proporcionado dependiendo del soporte del sistema operativo. Si se proporciona `filename`, será proporcionado como un `Buffer` si `fs.watch()` es llamado con su opción de `encoding` establecido a `'buffer'`, de lo contrario `filename` será una string de UTF-8.

```js
// Ejemplo cuando es manejado a través de fs.watch()
fs.watch('./tmp', { encoding: 'buffer' }, (eventType, filename) => {
  if (filename) {
    console.log(filename);
    // Imprime: <Buffer ...>
  }
});
```

### Evento: 'close'
<!-- YAML
added: v10.0.0
-->

Se emite cuando el observador deja de buscar cambios. The closed `fs.FSWatcher` object is no longer usable in the event handler.

### Evento: 'error'
<!-- YAML
added: v0.5.8
-->

* `error` {Error}

Se emite cuando ocurre un error mientras se observa al archivo. The errored `fs.FSWatcher` object is no longer usable in the event handler.

### watcher.close()
<!-- YAML
added: v0.5.8
-->

Deja de buscar cambios en el `fs.FSWatcher` dado. Una vez detenido, el objeto de `fs.FSWatcher` ya no es utilizable.

## Clase: fs.ReadStream
<!-- YAML
added: v0.1.93
-->

Una llamada exitosa a `fs.createReadStream()` devolverá un nuevo objeto de `fs.ReadStream` .

Todos los objetos de `fs.ReadStream` son [Streams Legibles](stream.html#stream_class_stream_readable).

### Evento: 'close'
<!-- YAML
added: v0.1.93
-->

Emitido cuando el descriptor de archivo subyacente de `fs.ReadStream` ha sido cerrado.

### Evento: 'open'
<!-- YAML
added: v0.1.93
-->

* `fd` {integer} Descriptor de archivo de enteros utilizado por el `ReadStream`.

Se emite cuando el descriptor de archivos de `fs.ReadStream` ha sido abierto.

### Evento: 'ready'
<!-- YAML
added: v9.11.0
-->

Se emite cuando el `fs.ReadStream` está listo para ser utilizado.

Se activa inmediatamente después de `'open'`.

### readStream.bytesRead
<!-- YAML
added: v6.4.0
-->

* {number}

El número de bytes que han sido leídos hasta el momento.

### readStream.path
<!-- YAML
added: v0.1.93
-->

* {string|Buffer}

La ruta al archivo desde el cual lee el stream, como se especifica en el primer argumento a `fs.createReadStream()`. Si `path` se pasa como una string, entonces `readStream.path` será una string. Si `path` se pasa como un `Buffer`, entonces `readStream.path` será un `Buffer`.

### readStream.pending
<!-- YAML
added: v10.16.0
-->

* {boolean}

This property is `true` if the underlying file has not been opened yet, i.e. before the `'ready'` event is emitted.

## Clase: fs.Stats
<!-- YAML
added: v0.1.21
changes:
  - version: v8.1.0
    pr-url: https://github.com/nodejs/node/pull/13173
    description: Added times as numbers.
-->

Un objeto de `fs.Stats` proporciona información acerca de un archivo.

Objetos devueltos desde [`fs.stat()`][], [`fs.lstat()`][] y [`fs.fstat()`][] y sus contrapartes sincrónicas son de este tipo. If `bigint` in the `options` passed to those methods is true, the numeric values will be `bigint` instead of `number`.

```console
Stats {
  dev: 2114,
  ino: 48064969,
  mode: 33188,
  nlink: 1,
  uid: 85,
  gid: 100,
  rdev: 0,
  size: 527,
  blksize: 4096,
  blocks: 8,
  atimeMs: 1318289051000.1,
  mtimeMs: 1318289051000.1,
  ctimeMs: 1318289051000.1,
  birthtimeMs: 1318289051000.1,
  atime: Mon, 10 Oct 2011 23:24:11 GMT,
  mtime: Mon, 10 Oct 2011 23:24:11 GMT,
  ctime: Mon, 10 Oct 2011 23:24:11 GMT,
```

`bigint` version:

```console
Stats {
  dev: 2114n,
  ino: 48064969n,
  mode: 33188n,
  nlink: 1n,
  uid: 85n,
  gid: 100n,
  rdev: 0n,
  size: 527n,
  blksize: 4096n,
  blocks: 8n,
  atimeMs: 1318289051000n,
  mtimeMs: 1318289051000n,
  ctimeMs: 1318289051000n,
  birthtimeMs: 1318289051000n,
  atime: Mon, 10 Oct 2011 23:24:11 GMT,
  mtime: Mon, 10 Oct 2011 23:24:11 GMT,
  ctime: Mon, 10 Oct 2011 23:24:11 GMT,
  birthtime: Mon, 10 Oct 2011 23:24:11 GMT }
```

### stats.isBlockDevice()
<!-- YAML
added: v0.1.10
-->

* Devuelve: {boolean}

Devuelve `true` si el objeto de `fs.Stats` describe un dispositivo de bloques.

### stats.isCharacterDevice()
<!-- YAML
added: v0.1.10
-->

* Devuelve: {boolean}

Devuelve `true` si el objeto de `fs.Stats` describe un dispositivo de caracteres.

### stats.isDirectory()
<!-- YAML
added: v0.1.10
-->

* Devuelve: {boolean}

Devuelve `true` si el objeto de `fs.Stats` describe un directorio de sistema de archivos.

### stats.isFIFO()
<!-- YAML
added: v0.1.10
-->

* Devuelve: {boolean}

Devuelve `true` si el objeto `fs.Stats` describe un pipe del tipo primeras-entradas-primeras-salidas (FIFO).

### stats.isFile()
<!-- YAML
added: v0.1.10
-->

* Devuelve: {boolean}

Devuelve `true` si el objeto de `fs.Stats` describe un archivo normal.

### stats.isSocket()
<!-- YAML
added: v0.1.10
-->

* Devuelve: {boolean}

Devuelve `true` si el objeto de `fs.Stats` describe un socket.

### stats.isSymbolicLink()
<!-- YAML
added: v0.1.10
-->

* Devuelve: {boolean}

Devuelve `true` si el objeto de `fs.Stats` describe un enlace simbólico.

Este método sólo es válido cuando se utiliza [`fs.lstat()`][].

### stats.dev

* {number|bigint}

El identificador numérico del dispositivo que contiene el archivo.

### stats.ino

* {number|bigint}

El sistema de archivos especifica un número "lnode" para el archivo.

### stas.mode

* {number|bigint}

Un campo de bits que describe el tipo de archivo y el modo.

### stats.nlink

* {number|bigint}

El número de links-fijos que existen para el archivo.

### stats.uid

* {number|bigint}

El identificador de usuario numérico del usuario que posee el archivo (POSIX).

### stats.gid

* {number|bigint}

El identificador de grupo numérico del grupo que posee el archivo (POSIX).

### stats.rdev

* {number|bigint}

Un identificador de dispositivo numérico si el archivo es considerado "especial".

### stats.size

* {number|bigint}

El tamaño del archivo en bytes.

### stats.blksize

* {number|bigint}

El tamaño del bloque del sistema de archivos para operaciones de e/s.

### stats.blocks

* {number|bigint}

El número de bloques destinados para este archivo.

### stats.atimeMs
<!-- YAML
added: v8.1.0
-->

* {number|bigint}

La marca de tiempo que indica la última vez que este archivo fue accedido, expresado en milisegundos desde el Tiempo POSIX.

### stats.mtimeMs
<!-- YAML
added: v8.1.0
-->

* {number|bigint}

La marca de tiempo que indica la última vez que este archivo fue modificado, expresado en milisegundos desde el Tiempo POSIX.

### stats.ctimeMs
<!-- YAML
added: v8.1.0
-->

* {number|bigint}

La marca de tiempo que indica la última vez que este archivo fue cambiado, expresado en milisegundos desde el Tiempo POSIX.

### stats.birthtimeMs
<!-- YAML
added: v8.1.0
-->

* {number|bigint}

La marca de tiempo que indica la hora de creación de este archivo, expresado en milisegundos desde el Tiempo POSIX.

### stats.atime
<!-- YAML
added: v0.11.13
-->

* {Date}

La marca de tiempo que indica la última vez que este archivo fue accedido.

### stats.mtime
<!-- YAML
added: v0.11.13
-->

* {Date}

La marca de tiempo que indica la última vez que este archivo fue modificado.

### stats.ctime
<!-- YAML
added: v0.11.13
-->

* {Date}

La marca de tiempo que indica la última vez que este archivo fue cambiado.

### stats.birthtime
<!-- YAML
added: v0.11.13
-->

* {Date}

La marca de tiempo que indica la hora de creación de este archivo.

### Valores del Tiempo de Estadísticas

Las propiedades de `atimeMs`, `mtimeMs`, `ctimeMs`, `birthtimeMs` son [números](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) que contienen los tiempos correspondientes en milisegundos. Su precisión es específica en la plataforma. `atime`, `mtime`, `ctime`, y `birthtime` son objetos de [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date), representaciones alternas de los tiempos varios. La `Date` y los valores numéricos no están conectados. Asignar un nuevo valor numérico, o mutar el valor de `Date`, no se reflejará en la correspondiente representación alterna.

Los tiempo en el objeto de estadísticas tienen la siguiente semántica:

* `atime` "Hora de Acceso" - La hora en la que se accedió por última vez a los datos de archivo. Cambiados por las llamadas de sistema mknod(2), utimes(2), y read(2).
* `mtime` "Hora de Modificación" - La hora en que se modificaron por última vez los datos de archivo. Cambiados por las llamadas de sistema mknod(2), utimes(2), y read(2).
* `ctime` "Hora de Cambio" - La hora en la que se cambiaron por última vez los estados de archivo (modificación de datos inode). Cambiados por las llamadas de sistema chmod(2), chown(2), link(2), mknod(2), rename(2), unlink(2), utimes(2), read(2), and write(2).
* `birthtime` "Hora de Creación" - La hora de creación de un archivo. Se establece una vez que se crea el archivo. En sistema de archivos en donde no está disponible la hora de creación, este campo puede poseer en su lugar el `ctime` o `1970-01-01T00:00Z` (por ejemplo, la marca de tiempo de la época de unix `0`). This value may be greater than `atime` or `mtime` in this case. On Darwin and other FreeBSD variants, also set if the `atime` is explicitly set to an earlier value than the current `birthtime` using the utimes(2) system call.

Prior to Node.js 0.12, the `ctime` held the `birthtime` on Windows systems. As of 0.12, `ctime` is not "creation time", and on Unix systems, it never was.

## Clase: fs.WriteStream
<!-- YAML
added: v0.1.93
-->

`WriteStream` es un [Stream Editable](stream.html#stream_class_stream_writable).

### Evento: 'close'
<!-- YAML
added: v0.1.93
-->

Emitido cuando el descriptor de archivo subyacente de `WriteStream` ha sido cerrado.

### Evento: 'open'
<!-- YAML
added: v0.1.93
-->

* `fd` {integer} Descriptor de archivo de enteros utilizado por el `WriteStream`.

Se emite cuando se abre el archivo de `WriteStream` .

### Evento: 'ready'
<!-- YAML
added: v9.11.0
-->

Se emite cuando el `fs.WriteStream` está listo para ser utilizado.

Se activa inmediatamente después de `'open'`.

### writeStream.bytesWritten
<!-- YAML
added: v0.4.7
-->

El número de bytes escritos hasta el momento. No incluye datos que todavía están en cola para escritura.

### writeStream.path
<!-- YAML
added: v0.1.93
-->

The path to the file the stream is writing to as specified in the first argument to [`fs.createWriteStream()`][]. Si se pasa a `path` como una string, entonces `writeStream.path` será una string. Si se pasa a `path` como un `Buffer`, entonces `writeStream.path` será un `Buffer`.

### writeStream.pending
<!-- YAML
added: v10.16.0
-->

* {boolean}

This property is `true` if the underlying file has not been opened yet, i.e. before the `'ready'` event is emitted.

## fs.access(path[, mode], callback)
<!-- YAML
added: v0.11.15
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/6534
    description: The constants like `fs.R_OK`, etc which were present directly
                 on `fs` were moved into `fs.constants` as a soft deprecation.
                 Thus for Node.js `< v6.3.0` use `fs`
                 to access those constants, or
                 do something like `(fs.constants || fs).R_OK` to work with all
                 versions.
-->

* `path` {string|Buffer|URL}
* `mode` {integer} **Por defecto es:** `fs.constants.F_OK`
* `callback` {Function}
  * `err` {Error}

Prueba los permisos del usuario para el archivo o directorio especificado por `path`. El argumento `mode` es un entero opcional que especifica las verificaciones de accesibilidad que serán realizadas. Check [File Access Constants](#fs_file_access_constants) for possible values of `mode`. It is possible to create a mask consisting of the bitwise OR of two or more values (e.g. `fs.constants.W_OK | fs.constants.R_OK`).

El argumento final, `callback`, es una función de callback que se invoca con un posible argumento de error. Si alguna verificación de accesibilidad falla, el argumento de error será un objeto de `Error` . Los siguientes ejemplos verifican si `package.json` existe, y si es legible o editable.

```js
const file = 'package.json';

// chequear si el archivo existe en el directorio actual
fs.access(file, fs.constants.F_OK, (err) => {
  console.log(`${file} ${err ? 'does not exist' : 'exists'}`);
});

// chequear si el archivo es leíble
fs.access(file, fs.constants.R_OK, (err) => {
  console.log(`${file} ${err ? 'is not readable' : 'is readable'}`);
});

// Chequear si el archivo es escribible
fs.access(file, fs.constants.W_OK, (err) => {
  console.log(`${file} ${err ? 'is not writable' : 'is writable'}`);
});

// Chequear si el archivo existe en el directorio actual, y si es escribible.
fs.access(file, fs.constants.F_OK | fs.constants.W_OK, (err) => {
  if (err) {
    console.error(
      `${file} ${err.code === 'ENOENT' ? 'does not exist' : 'is read-only'}`);
  } else {
    console.log(`${file} existe, y es escribible`);
  }
});
```

Utilizar `fs.access()` para verificar la accesibilidad de un archivo antes de llamar a `fs.open()`, `fs.readFile()` ó `fs.writeFile()` no es recomendado. Hacer eso introduce una condición de carrera, ya que otros procesos pueden cambiar el estado del archivo entre las dos llamadas. En lugar de ello, el código de usuario debería abrir/leer/escribir el archivo directamente y manejar el error ocurrido si el archivo no es accesible.

**escribir (NO SE RECOMIENDA)**

```js
fs.access('myfile', (err) => {
  if (!err) {
    console.error('myfile already exists');
    return;
  }

  fs.open('myfile', 'wx', (err, fd) => {
    if (err) throw err;
    writeMyData(fd);
  });
});
```

**escribir (RECOMENDADO)**

```js
fs.open('myfile', 'wx', (err, fd) => {
  if (err) {
    if (err.code === 'EEXIST') {
      console.error('myfile ya existe');
      return;
    }

    throw err;
  }

  writeMyData(fd);
});
```

**leer (NO SE RECOMIENDA)**

```js
fs.access('myfile', (err) => {
  if (err) {
    if (err.code === 'ENOENT') {
      console.error('myfile no existe');
      return;
    }

    throw err;
  }

  fs.open('myfile', 'r', (err, fd) => {
    if (err) throw err;
    readMyData(fd);
  });
});
```

**leer (RECOMENDADO)**

```js
fs.open('myfile', 'r', (err, fd) => {
  if (err) {
    if (err.code === 'ENOENT') {
      console.error('myfile no existe');
      return;
    }

    throw err;
  }

  readMyData(fd);
});
```

Los ejemplos anteriores "no recomendados" verifican la accesibilidad y luego utilizan el archivo; los ejemplos "recomendados" son mejores porque utilizan el archivo directamente y manejan el error, si los hay.

En general, verifique la accesibilidad de un archivo sólo si el archivo no será utilizado directamente, por ejemplo, cuando su accesibilidad es una señal de otro proceso.

On Windows, access-control policies (ACLs) on a directory may limit access to a file or directory. The `fs.access()` function, however, does not check the ACL and therefore may report that a path is accessible even if the ACL restricts the user from reading or writing to it.

## fs.accessSync(path[, mode])
<!-- YAML
added: v0.11.15
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `mode` {integer} **Por defecto es:** `fs.constants.F_OK`

Synchronously tests a user's permissions for the file or directory specified by `path`. El argumento `mode` es un entero opcional que especifica las verificaciones de accesibilidad que serán realizadas. Check [File Access Constants](#fs_file_access_constants) for possible values of `mode`. It is possible to create a mask consisting of the bitwise OR of two or more values (e.g. `fs.constants.W_OK | fs.constants.R_OK`).

Si alguna verificación de accesibilidad falla, se arrojará un `Error` . De lo contrario, el método devolverá `undefined`.

```js
try {
  fs.accessSync('etc/passwd', fs.constants.R_OK | fs.constants.W_OK);
  console.log('puede leer/escribir');
} catch (err) {
  console.error('Sin acceso');
}
```

## fs.appendFile(path, data[, options], callback)
<!-- YAML
added: v0.6.7
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7831
    description: The passed `options` object will never be modified.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: The `file` parameter can be a file descriptor now.
-->

* `path` {string|Buffer|URL|number} nombre de archivo o descriptor de archivo
* `data` {string|Buffer}
* `opciones` {Object|string}
  * `encoding` {string|null} **Por defecto es:** `'utf8'`
  * `mode` {integer} **Predeterminado:** `0o666`
  * `flag` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Predeterminado:** `'a'`.
* `callback` {Function}
  * `err` {Error}

Anexa los datos de manera asincrónica a un archivo, creando el archivo en caso de que aún no exista. `data` puede ser una string o un [`Buffer`][].

```js
fs.appendFile('message.txt', 'datos a agregar', (err) => {
  if (err) throw err;
  console.log('El "datos a agregar" ha sido añadido al archivo');
});
```

Si `options` es una string, entonces especifica la codificación:

```js
fs.appendFile('message.txt', 'data a añadir', 'utf8', callback);
```

El `path` puede ser especificado como un descriptor numérico de archivos que ha sido abierto para ser anexado (utilizando `fs.open()` ó `fs.openSync()`). El descriptor de archivos no se cerrará automáticamente.

```js
fs.open('message.txt', 'a', (err, fd) => {
  if (err) throw err;
  fs.appendFile(fd, 'datos a añadir', 'utf8', (err) => {
    fs.close(fd, (err) => {
      if (err) throw err;
    });
    if (err) throw err;
  });
});
```

## fs.appendFileSync(path, data[, options])
<!-- YAML
added: v0.6.7
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7831
    description: The passed `options` object will never be modified.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: The `file` parameter can be a file descriptor now.
-->

* `path` {string|Buffer|URL|number} nombre de archivo o descriptor de archivo
* `data` {string|Buffer}
* `opciones` {Object|string}
  * `encoding` {string|null} **Por defecto es:** `'utf8'`
  * `mode` {integer} **Predeterminado:** `0o666`
  * `flag` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Predeterminado:** `'a'`.

Anexa los datos de manera sincrónica a un archivo, creando el archivo en caso de que aún no exista. `data` puede ser una string o un [`Buffer`][].

```js
try {
  fs.appendFileSync('message.txt', 'data a añadir');
  console.log('Los "data a añadir" fueron añadidos al archivo');
} catch (err) {
  /* Maneja el error*/
}
```

Si `options` es una string, entonces especifica la codificación:

```js
fs.appendFileSync('message.txt', 'data a añadir', 'utf8');
```

El `path` puede ser especificado como un descriptor numérico de archivos que ha sido abierto para ser anexado (utilizando `fs.open()` ó `fs.openSync()`). El descriptor de archivos no se cerrará automáticamente.

```js
try {
  fd = fs.openSync('message.txt', 'a');
  fs.appendFileSync(fd, 'data to append', 'utf8');
} catch (err) {
  /* Maneja el error */
} finally {
  if (fd !== undefined)
    fs.closeSync(fd);
}
```

## fs.chmod(path, mode, callback)
<!-- YAML
added: v0.1.30
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
-->

* `path` {string|Buffer|URL}
* `mode`{integer}
* `callback` {Function}
  * `err` {Error}

Cambia de manera asincrónica los permisos de un archivo. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

Vea también: chmod(2).

### Modos de archivo

El argumento `mode` utilizado en los métodos `fs.chmod()` y `fs.chmodSync()` es una máscara de bits numérica creada utilizando un lógico O de las siguientes constantes:

| Constante              | Octal   | Descripción                     |
| ---------------------- | ------- | ------------------------------- |
| `fs.constants.S_IRUSR` | `0o400` | leído por el propietario        |
| `fs.constants.S_IWUSR` | `0o200` | escribir por el propietario     |
| `fs.constants.S_IXUSR` | `0o100` | ejecutar/buscar por propietario |
| `fs.constants.S_IRGRP` | `0o40`  | leído por el grupo              |
| `fs.constants.S_IWGRP` | `0o20`  | escribir por grupo              |
| `fs.constants.S_IXGRP` | `0o10`  | ejecutar/buscar por grupo       |
| `fs.constants.S_IROTH` | `0o4`   | leído por otros                 |
| `fs.constants.S_IWOTH` | `0o2`   | escribir por otros              |
| `fs.constants.S_IXOTH` | `0 o1`  | ejecutar/buscar por otros       |

Un método más sencillo de construir el `mode` es utilizar una secuencia de tres dígitos octales (por ejemplo, `765`). El primer dígito a la izquierda (`7` en el ejemplo), especifica los permisos para el propietario del archivo. El dígito medio (`6` en el ejemplo), especifica los permisos para el grupo. El primer dígito a la derecha (`5` en el ejemplo), especifica los permisos para otros.

| Número | Descripción                |
| ------ | -------------------------- |
| `7`    | leer, escribir, y ejecutar |
| `6`    | leer y escribir            |
| `5`    | leer y ejecutar            |
| `4`    | solo lectura               |
| `3`    | escribir y ejecutar        |
| `2`    | solo escritura             |
| `1`    | solo ejecutar              |
| `0`    | sin permisos               |

Por ejemplo, el valor octal `0o765` significa:

* El propietario puede leer, escribir y ejecutar el archivo.
* El grupo puede leer y escribir el archivo.
* Otros pueden leer y ejecutar el archivo.

When using raw numbers where file modes are expected, any value larger than `0o777` may result in platform-specific behaviors that are not supported to work consistently. Therefore constants like `S_ISVTX`, `S_ISGID` or `S_ISUID` are not exposed in `fs.constants`.

Caveats: on Windows only the write permission can be changed, and the distinction among the permissions of group, owner or others is not implemented.

## fs.chmodSync(path, mode)
<!-- YAML
added: v0.6.7
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `mode`{integer}

For detailed information, see the documentation of the asynchronous version of this API: [`fs.chmod()`][].

Vea también: chmod(2).

## fs.chown(path, uid, gid, callback)
<!-- YAML
added: v0.1.97
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
-->

* `path` {string|Buffer|URL}
* `uid`{integer}
* `gid`{integer}
* `callback` {Function}
  * `err` {Error}

Cambia de manera asincrónica el propietario y el grupo de un archivo. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

Vea también: chown(2).

## fs.chownSync(path, uid, gid)
<!-- YAML
added: v0.1.97
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `uid`{integer}
* `gid`{integer}

Cambia de manera sincrónica el propietario y el grupo de un archivo. Devuelve `undefined`. Esta es la versión sincrónica de [`fs.chown()`][].

Vea también: chown(2).

## fs.close(fd, callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
-->

* `fd`{integer}
* `callback` {Function}
  * `err` {Error}

close(2) asincrónico. Ningún otro argumento que no sea una posible excepción es dado al callback de terminación.

## fs.closeSync(fd)
<!-- YAML
added: v0.1.21
-->

* `fd`{integer}

close(2) sincrónico. Devuelve `undefined`.

## fs.constants

* {Object}

Devuelve un objeto que contiene constantes utilizadas comúnmente para operaciones del sistema de archivos. Las constantes específicas actualmente definidas se describen en [Constantes de FS](#fs_fs_constants_1).

## fs.copyFile(src, dest[, flags], callback)
<!-- YAML
added: v8.5.0
-->

* `src` {string|Buffer|URL} nombre de archivo de la fuente a copiar
* `dest` {string|Buffer|URL} nombre de archivo de destino de la operación de copia
* `flags` {number} modificadores para la operación de copia. **Predeterminado:** `0`.
* `callback` {Function}

Copia de manera asincrónica `src` a `dest`. Por defecto, se sobrescribe `dest` si ya existe. Ningún otro argumento que no sea una posible excepción es dado a la función de callback. Node.js no ofrece ninguna garantía sobre la atomicidad de la operación de copia. Si ocurre un error luego de que el archivo de destino ha sido abierto para escritura, Node.js intentará eliminar el destino.

`flags` es un entero opcional que especifica el comportamiento de la operación de copia. Es posible crear una máscara que consista del bitwise O de dos o más valores (por ejemplo, `fs.constants.COPYFILE_EXCL | fs.constants.COPYFILE_FICLONE`).

* `fs.constants.COPYFILE_EXCL` - La operación de copia fallará si `dest` ya existe.
* `fs.constants.COPYFILE_FICLONE` - The copy operation will attempt to create a copy-on-write reflink. If the platform does not support copy-on-write, then a fallback copy mechanism is used.
* `fs.constants.COPYFILE_FICLONE_FORCE` - The copy operation will attempt to create a copy-on-write reflink. Si la plataforma no es compatible con copy-on-write, entonces la operación fallará.

```js
const fs = require('fs');

// destination.txt will be created or overwritten by default.
fs.copyFile('source.txt', 'destination.txt', (err) => {
  if (err) throw err;
  console.log('source.txt was copied to destination.txt');
});
```

If the third argument is a number, then it specifies `flags`:

```js
const fs = require('fs');
const { COPYFILE_EXCL } = fs.constants;

// By using COPYFILE_EXCL, the operation will fail if destination.txt exists.
fs.copyFile('source.txt', 'destination.txt', COPYFILE_EXCL, callback);
```

## fs.copyFileSync(src, dest[, flags])
<!-- YAML
added: v8.5.0
-->

* `src` {string|Buffer|URL} nombre de archivo de la fuente a copiar
* `dest` {string|Buffer|URL} nombre de archivo de destino de la operación de copia
* `flags` {number} modificadores para la operación de copia. **Predeterminado:** `0`.

Copia de manera sincrónica `src` a `dest`. Por defecto, se sobrescribe `dest` si ya existe. Devuelve `undefined`. Node.js no ofrece ninguna garantía sobre la atomicidad de la operación de copia. Si ocurre un error luego de que el archivo de destino ha sido abierto para escritura, Node.js intentará eliminar el destino.

`flags` es un entero opcional que especifica el comportamiento de la operación de copia. Es posible crear una máscara que consista del bitwise O de dos o más valores (por ejemplo, `fs.constants.COPYFILE_EXCL | fs.constants.COPYFILE_FICLONE`).

* `fs.constants.COPYFILE_EXCL` - La operación de copia fallará si `dest` ya existe.
* `fs.constants.COPYFILE_FICLONE` - The copy operation will attempt to create a copy-on-write reflink. If the platform does not support copy-on-write, then a fallback copy mechanism is used.
* `fs.constants.COPYFILE_FICLONE_FORCE` - The copy operation will attempt to create a copy-on-write reflink. Si la plataforma no es compatible con copy-on-write, entonces la operación fallará.

```js
const fs = require('fs');

// destination.txt will be created or overwritten by default.
fs.copyFileSync('source.txt', 'destination.txt');
console.log('source.txt was copied to destination.txt');
```

If the third argument is a number, then it specifies `flags`:

```js
const fs = require('fs');
const { COPYFILE_EXCL } = fs.constants;

// By using COPYFILE_EXCL, the operation will fail if destination.txt exists.
fs.copyFileSync('source.txt', 'destination.txt', COPYFILE_EXCL);
```

## fs.createReadStream(path[, options])
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7831
    description: The passed `options` object will never be modified.
  - version: v2.3.0
    pr-url: https://github.com/nodejs/node/pull/1845
    description: The passed `options` object can be a string now.
-->

* `path` {string|Buffer|URL}
* `opciones` {string|Object}
  * `flags` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Predeterminado:** `'r'`.
  * `encoding` {string} **Por defecto es:** `null`
  * `fd` {integer} **Default:** `null`
  * `mode` {integer} **Predeterminado:** `0o666`
  * `autoClose` {boolean} **Default:** `true`
  * `start` {integer}
  * `end` {integer} **Default:** `Infinity`
  * `highWaterMark` {integer} **Default:** `64 * 1024`
* Devuelve: {fs.ReadStream} Vea [Streams Legibles](stream.html#stream_class_stream_readable).

A diferencia de los 16 kb `highWaterMark` predeterminado para un stream legible, el stream devuelto por este método tiene un `highWaterMark` predeterminado de 64 kb.

`options` puede incluir valores de `start` y `end` para leer un rango de bytes desde el archivo, en lugar de todo el archivo. `start` y `end` son inclusivos y empiezan a contar desde 0. Si se especifica `fd` y se omite `start` o es `undefined`, `fs.createReadStream()` lee de manera secuencial desde la posición actual del archivo. El `encoding` puede ser cualquiera de los aceptados por [`Buffer`][].

Si se especifica `fd`, `ReadStream` ignorará el argumento de `path` y utilizará el descriptor de archivo especificado. Esto significa que no se emitirán eventos `'open'` . `fd` should be blocking; non-blocking `fd`s should be passed to [`net.Socket`][].

If `fd` points to a character device that only supports blocking reads (such as keyboard or sound card), read operations do not finish until data is available. This can prevent the process from exiting and the stream from closing naturally.

```js
const fs = require('fs');
// Create a stream from some character  device.
const stream = fs.createReadStream('/dev/input/event0');
setTimeout(() => {
  stream.close(); // This may not close the stream.
  // Artificially marking end-of-stream, as if the underlying resource had
  // indicated end-of-file by itself, allows the stream to close.
  // This does not cancel pending read operations, and if there is such an
  // operation, the process may still not be able to exit successfully
  // until it finishes.
  stream.push(null);
  stream.read(0);
}, 100);
```

Si `autoClose` es falso, entonces el descriptor de archivo no se cerrará, incluso si hay un error. Es responsabilidad de la aplicación cerrarla y asegurarse de que no hayan pérdidas del descriptor de archivo. Si `autoClose` se establece a verdadero (comportamiento predeterminado), en `'error'` ó `'end'` el descriptor de archivo se cerrará automáticamente.

`mode` establece el modo de archivo (el permiso y los sticky bits), pero solo si el archivo fue creado.

Un ejemplo para leer los últimos 10 bytes de un archivo que tiene 100 bytes de longitud:

```js
fs.createReadStream('sample.txt', { start: 90, end: 99 });
```

Si `options` es una string, entonces especifica la codificación.

## fs.createWriteStream(path[, options])
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7831
    description: The passed `options` object will never be modified.
  - version: v5.5.0
    pr-url: https://github.com/nodejs/node/pull/3679
    description: The `autoClose` option is supported now.
  - version: v2.3.0
    pr-url: https://github.com/nodejs/node/pull/1845
    description: The passed `options` object can be a string now.
-->

* `path` {string|Buffer|URL}
* `opciones` {string|Object}
  * `flags` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Predeterminado:** `'w'`.
  * `encoding` {string} **Predeterminado:** `'utf8'`
  * `fd` {integer} **Default:** `null`
  * `mode` {integer} **Predeterminado:** `0o666`
  * `autoClose` {boolean} **Default:** `true`
  * `start` {integer}
* Devuelve: {fs.WriteStream} Vea [Stream Editable](stream.html#stream_class_stream_writable).

`options` también puede incluir una opción de `start` para permitir la escritura de datos en una posición más allá del inicio del archivo. Modificar un archivo en vez de reemplazarlo puede que requiera un modo de `flags` de `r+` en vez del modo predeterminado `w`. El `encoding` puede ser cualquiera de los aceptados por [`Buffer`][].

Si `autoClose` se establece a verdadero (comportamiento predeterminado) en `'error'` ó `'finish'` el descriptor de archivo se cerrará automáticamente. Si `autoClose` es falso, entonces el descriptor de archivo no se cerrará, incluso si hay un error. Es responsabilidad de la aplicación cerrarla y asegurarse de que no hayan pérdidas del descriptor de archivo.

Al igual que [`ReadStream`][], si se especifica `fd`, [`WriteStream`][] ignorará el argumento de `path` y utilizará el descriptor de archivos especificado. Esto significa que no se emitirán eventos `'open'`. `fd` should be blocking; non-blocking `fd`s should be passed to [`net.Socket`][].

Si `options` es una string, entonces especifica la codificación.

## fs.exists(path, callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
deprecated: v1.0.0
-->

> Estabilidad: 0 - Desaprobado: Utilice [`fs.stat()`][] o [`fs.access()`][] en su lugar.

* `path` {string|Buffer|URL}
* `callback` {Function}
  * `exists` {boolean}

Prueba si una ruta dada existe o no, verificándolo mediante el sistema de archivos. Después llama al argumento de `callback` con verdadero o falso:

```js
fs.exists('/etc/passwd', (exists) => {
  console.log(exists ? 'it\'s there' : 'no passwd!');
});
```

**The parameters for this callback are not consistent with other Node.js callbacks.** Normally, the first parameter to a Node.js callback is an `err` parameter, optionally followed by other parameters. The `fs.exists()` callback has only one boolean parameter. This is one reason `fs.access()` is recommended instead of `fs.exists()`.

Utilizar `fs.exists()` para verificar la existencia de un archivo antes de llamar a `fs.open()`, `fs.readFile()` ó `fs.writeFile()` no es recomendado. Hacer eso introduce una condición de carrera, ya que otros procesos pueden cambiar el estado del archivo entre las dos llamadas. En lugar de ello, el código de usuario debería abrir/leer/escribir el archivo directamente y manejar el error ocurrido si el archivo no existe.

**escribir (NO SE RECOMIENDA)**

```js
fs.exists('myfile', (exists) => {
  if (exists) {
    console.error('myfile already exists');
  } else {
    fs.open('myfile', 'wx', (err, fd) => {
      if (err) throw err;
      writeMyData(fd);
    });
  }
});
```

**escribir (RECOMENDADO)**

```js
fs.open('myfile', 'wx', (err, fd) => {
  if (err) {
    if (err.code === 'EEXIST') {
      console.error('myfile ya existe');
      return;
    }

    throw err;
  }

  writeMyData(fd);
});
```

**leer (NO SE RECOMIENDA)**

```js
fs.exists('myfile', (exists) => {
  if (exists) {
    fs.open('myfile', 'r', (err, fd) => {
      if (err) throw err;
      readMyData(fd);
    });
  } else {
    console.error('myfile does not exist');
  }
});
```

**leer (RECOMENDADO)**

```js
fs.open('myfile', 'r', (err, fd) => {
  if (err) {
    if (err.code === 'ENOENT') {
      console.error('myfile no existe');
      return;
    }

    throw err;
  }

  readMyData(fd);
});
```

Los ejemplos anteriores "no recomendados" verifican la existencia y luego utilizan el archivo; los ejemplos "recomendados" son mejores porque estos utilizan el archivo directamente y manejan el error, si los hay.

En general, verifique la existencia de un archivo sólo si el archivo no se utilizará directamente, por ejemplo, cuando su existencia es una señal de otro proceso.

## fs.existsSync(path)
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* Devuelve: {boolean}

Devuelve `true` si la ruta existe, de lo contrario `false`.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.exists()`][].

`fs.exists()` is deprecated, but `fs.existsSync()` is not. The `callback` parameter to `fs.exists()` accepts parameters that are inconsistent with other Node.js callbacks. `fs.existsSync()` does not use a callback.


## fs.fchmod(fd, mode, callback)
<!-- YAML
added: v0.4.7
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
-->

* `fd`{integer}
* `mode`{integer}
* `callback` {Function}
  * `err` {Error}

fchmod(2) asincrónico. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

## fs.fchmodSync(fd, mode)
<!-- YAML
added: v0.4.7
-->

* `fd`{integer}
* `mode`{integer}

fchmod(2) sincrónico. Devuelve `undefined`.

## fs.fchown(fd, uid, gid, callback)
<!-- YAML
added: v0.4.7
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
-->

* `fd`{integer}
* `uid`{integer}
* `gid`{integer}
* `callback` {Function}
  * `err` {Error}

fchown(2) asincrónico. Ningún otro argumento que no sea una posible excepción es dado al callback de terminación.

## fs.fchownSync(fd, uid, gid)
<!-- YAML
added: v0.4.7
-->

* `fd`{integer}
* `uid`{integer}
* `gid`{integer}

fchown(2) sincrónico. Devuelve `undefined`.

## fs.fdatasync(fd, callback)
<!-- YAML
added: v0.1.96
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
-->

* `fd`{integer}
* `callback` {Function}
  * `err` {Error}

fdatasync(2) asincrónico. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

## fs.fdatasyncSync(fd)
<!-- YAML
added: v0.1.96
-->

* `fd`{integer}

fdatasync(2) sincrónico. Devuelve `undefined`.

## fs.fstat(fd[, options], callback)
<!-- YAML
added: v0.1.95
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
  - version: v10.5.0
    pr-url: https://github.com/nodejs/node/pull/20220
    description: Accepts an additional `options` object to specify whether
                 the numeric values returned should be bigint.
-->

* `fd`{integer}
* `opciones` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **Predeterminado:** `false`.
* `callback` {Function}
  * `err` {Error}
  * `stats` {fs.Stats}

fstat(2) asincrónico. El callback obtiene dos argumentos `(err, stats)` donde `stats` es un objeto de [`fs.Stats`][]. `fstat()` es idéntico a [`stat()`][], excepto que el archivo que será añadido a las estadísticas se especifica por el descriptor de archivo `fd`.

## fs.fstatSync(fd[, options])
<!-- YAML
added: v0.1.95
changes:
  - version: v10.5.0
    pr-url: https://github.com/nodejs/node/pull/20220
    description: Accepts an additional `options` object to specify whether
                 the numeric values returned should be bigint.
-->

* `fd`{integer}
* `opciones` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **Predeterminado:** `false`.
* Devuelve: {fs.Stats}

fstat(2) sincrónica.

## fs.fsync(fd, callback)
<!-- YAML
added: v0.1.96
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
-->

* `fd`{integer}
* `callback` {Function}
  * `err` {Error}

fsync(2) asincrónico. Ningún otro argumento que no sea una posible excepción es dado al callback de terminación.

## fs.fsyncSync(fd)
<!-- YAML
added: v0.1.96
-->

* `fd`{integer}

fsync(2) asincrónico. Devuelve `undefined`.

## fs.ftruncate(fd[, len], callback)
<!-- YAML
added: v0.8.6
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
-->

* `fd`{integer}
* `len` {integer} **Predeterminado:** `0`
* `callback` {Function}
  * `err` {Error}

ftruncate(2) asincrónico. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

Si el archivo referido por el descriptor de archivos fuese más grande que los bytes `len`, sólo los primeros bytes `len` serán retenidos en el archivo.

Por ejemplo, el siguiente programa retiene sólo los primeros cuatro bytes del archivo:

```js
console.log(fs.readFileSync('temp.txt', 'utf8'));
// Prints: Node.js

// get the file descriptor of the file to be truncated
const fd = fs.openSync('temp.txt', 'r+');

// truncate the file to first four bytes
fs.ftruncate(fd, 4, (err) => {
  assert.ifError(err);
  console.log(fs.readFileSync('temp.txt', 'utf8'));
});
// Prints: Node
```

Si el archivo previamente era más corto que `len` bytes, se extiende, y la parte extendida se llena con bytes nulos (`'\0'`):

```js
console.log(fs.readFileSync('temp.txt', 'utf8'));
// Prints: Node.js

// get the file descriptor of the file to be truncated
const fd = fs.openSync('temp.txt', 'r+');

// truncate the file to 10 bytes, whereas the actual size is 7 bytes
fs.ftruncate(fd, 10, (err) => {
  assert.ifError(err);
  console.log(fs.readFileSync('temp.txt'));
});
// Prints: <Buffer 4e 6f 64 65 2e 6a 73 00 00 00>
// ('Node.js\0\0\0' in UTF8)
```

Los últimos tres bytes son bytes nulos (`'\0'`), para compensar el sobre-truncamiento.

## fs.ftruncateSync(fd[, len])
<!-- YAML
added: v0.8.6
-->

* `fd`{integer}
* `len` {integer} **Predeterminado:** `0`

Devuelve `undefined`.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.ftruncate()`][].

## fs.futimes(fd, atime, mtime, callback)
<!-- YAML
added: v0.4.2
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
  - version: v4.1.0
    pr-url: https://github.com/nodejs/node/pull/2387
    description: Numeric strings, `NaN` and `Infinity` are now allowed
                 time specifiers.
-->

* `fd`{integer}
* `atime` {number|string|Date}
* `mtime` {number|string|Date}
* `callback` {Function}
  * `err` {Error}

Cambia las marcas de tiempo del sistema de archivos del objeto referenciado por el descriptor de archivo proporcionado. Vea [`fs.utimes()`][].

Esta función no funciona en versiones AIX anteriores a 7.1, devolverá el error `UV_ENOSYS`.

## fs.futimesSync(fd, atime, mtime)
<!-- YAML
added: v0.4.2
changes:
  - version: v4.1.0
    pr-url: https://github.com/nodejs/node/pull/2387
    description: Numeric strings, `NaN` and `Infinity` are now allowed
                 time specifiers.
-->

* `fd`{integer}
* `atime` {integer}
* `mtime` {integer}

Versión sincrónica de [`fs.futimes()`][]. Devuelve `undefined`.

## fs.lchmod(path, mode, callback)
<!-- YAML
deprecated: v0.4.7
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
-->

* `path` {string|Buffer|URL}
* `mode`{integer}
* `callback` {Function}
  * `err` {Error}

lchmod(2) asincrónico. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

Sólo disponible en macOS.

## fs.lchmodSync(path, mode)
<!-- YAML
deprecated: v0.4.7
-->

* `path` {string|Buffer|URL}
* `mode`{integer}

lchmod(2) sincrónico. Devuelve `undefined`.

## fs.lchown(path, uid, gid, callback)
<!-- YAML
changes:
  - version: v10.6.0
    pr-url: https://github.com/nodejs/node/pull/21498
    description: This API is no longer deprecated.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
-->

* `path` {string|Buffer|URL}
* `uid`{integer}
* `gid`{integer}
* `callback` {Function}
  * `err` {Error}

lchwon(2) asincrónico. Ningún otro argumento que no sea una posible excepción es dado al callback de terminación.

## fs.lchownSync(path, uid, gid)
<!-- YAML
changes:
  - version: v10.6.0
    pr-url: https://github.com/nodejs/node/pull/21498
    description: This API is no longer deprecated.
-->

* `path` {string|Buffer|URL}
* `uid`{integer}
* `gid`{integer}

lchwon(2) sincrónico. Devuelve `undefined`.

## fs.link(existingPath, newPath, callback)
<!-- YAML
added: v0.1.31
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `existingPath` and `newPath` parameters can be WHATWG
                 `URL` objects using `file:` protocol. Support is currently
                 still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
-->

* `existingPath` {string|Buffer|URL}
* `newPath` {string|Buffer|URL}
* `callback` {Function}
  * `err` {Error}

link(2) asincrónico. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

## fs.linkSync(existingPath, newPath)
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `existingPath` and `newPath` parameters can be WHATWG
                 `URL` objects using `file:` protocol. Support is currently
                 still *experimental*.
-->

* `existingPath` {string|Buffer|URL}
* `newPath` {string|Buffer|URL}

link(2) sincrónico. Devuelve `undefined`.

## fs.lstat(path[, options], callback)
<!-- YAML
added: v0.1.30
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
  - version: v10.5.0
    pr-url: https://github.com/nodejs/node/pull/20220
    description: Accepts an additional `options` object to specify whether
                 the numeric values returned should be bigint.
-->

* `path` {string|Buffer|URL}
* `opciones` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **Predeterminado:** `false`.
* `callback` {Function}
  * `err` {Error}
  * `stats` {fs.Stats}

lstat(2) asincrónico. El callback obtiene dos argumentos `(err, stats)`, en donde `stats` es un objeto de [`fs.Stats`][]. `lstat()` es idéntico a `stat()`, salvo en caso de que `path` sea un enlace simbólico, entonces el mismo enlace sería parte de las estadísticas, no el archivo al que se refiere.

## fs.lstatSync(path[, options])
<!-- YAML
added: v0.1.30
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v10.5.0
    pr-url: https://github.com/nodejs/node/pull/20220
    description: Accepts an additional `options` object to specify whether
                 the numeric values returned should be bigint.
-->

* `path` {string|Buffer|URL}
* `opciones` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **Predeterminado:** `false`.
* Devuelve: {fs.Stats}

lstat(2) sincrónico.

## fs.mkdir(path[, options], callback)
<!-- YAML
added: v0.1.8
changes:
  - version: v10.12.0
    pr-url: https://github.com/nodejs/node/pull/21875
    description: The second argument can now be an `options` object with
                 `recursive` and `mode` properties.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
-->

* `path` {string|Buffer|URL}
* `opciones` {Object|integer}
  * `recursive` {boolean} **Default:** `false`
  * `mode` {integer} Not supported on Windows. **Default:** `0o777`.
* `callback` {Function}
  * `err` {Error}

Crea un directorio de manera asincrónica. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

The optional `options` argument can be an integer specifying mode (permission and sticky bits), or an object with a `mode` property and a `recursive` property indicating whether parent folders should be created.

```js
// Creates /tmp/a/apple, regardless of whether `/tmp` and /tmp/a exist.
fs.mkdir('/tmp/a/apple', { recursive: true }, (err) => {
  if (err) throw err;
});
```

On Windows, using `fs.mkdir()` on the root directory even with recursion will result in an error:

```js
fs.mkdir('/', { recursive: true }, (err) => {
  // => [Error: EPERM: operation not permitted, mkdir 'C:\']
});
```

Vea también: mkdir(2).

## fs.mkdirSync(path[, options])
<!-- YAML
added: v0.1.21
changes:
  - version: v10.12.0
    pr-url: https://github.com/nodejs/node/pull/21875
    description: The second argument can now be an `options` object with
                 `recursive` and `mode` properties.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `opciones` {Object|integer}
  * `recursive` {boolean} **Default:** `false`
  * `mode` {integer} Not supported on Windows. **Default:** `0o777`.

Crea un directorio de manera sincrónica. Devuelve `undefined`. Esta es la versión sincrónica de [`fs.mkdir()`][].

Vea también: mkdir(2).

## fs.mkdtemp(prefix[, options], callback)
<!-- YAML
added: v5.10.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
  - version: v6.2.1
    pr-url: https://github.com/nodejs/node/pull/6828
    description: The `callback` parameter is optional now.
-->

* `prefix` {string}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `folder` {string}

Crea un único directorio temporal.

Genera seis caracteres aleatorios para ser anexados detrás de un `prefix` necesario, para crear un directorio temporal único.

La ruta de archivo creada se pasa como una string al segundo parámetro del callback.

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar.

```js
fs.mkdtemp(path.join(os.tmpdir(), 'foo-'), (err, folder) => {
  if (err) throw err;
  console.log(folder);
  // Prints: /tmp/foo-itXde2 or C:\Users\...\AppData\Local\Temp\foo-itXde2
});
```

El método de `fs.mkdtemp()` anexará los seis caracteres seleccionados aleatoriamente directamente a la string de `prefix` . For instance, given a directory `/tmp`, if the intention is to create a temporary directory *within* `/tmp`, the `prefix` must end with a trailing platform-specific path separator (`require('path').sep`).

```js
// The parent directory for the new temporary directory
const tmpDir = os.tmpdir();

// This method is *INCORRECT*:
fs.mkdtemp(tmpDir, (err, folder) => {
  if (err) throw err;
  console.log(folder);
  // Will print something similar to `/tmpabc123`.
  // A new temporary directory is created at the file system root
  // rather than *within* the /tmp directory.
});

// This method is *CORRECT*:
const { sep } = require('path');
fs.mkdtemp(`${tmpDir}${sep}`, (err, folder) => {
  if (err) throw err;
  console.log(folder);
  // Will print something similar to `/tmp/abc123`.
  // A new temporary directory is created within
  // the /tmp directory.
});
```

## fs.mkdtempSync(prefix[, options])
<!-- YAML
added: v5.10.0
-->

* `prefix` {string}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`
* Devuelve: {string}

Returns the created folder path.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.mkdtemp()`][].

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar.

## fs.open(path[, flags[, mode]], callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v11.1.0
    pr-url: https://github.com/nodejs/node/pull/23767
    description: The `flags` argument is now optional and defaults to `'r'`.
  - version: v9.9.0
    pr-url: https://github.com/nodejs/node/pull/18801
    description: The `as` and `as+` modes are supported now.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `flags` {string|number} Vea [soporte de las `flags` del sistema de archivos][]. **Predeterminado:** `'r'`.
* `mode` {integer} **Default:** `0o666` (readable and writable)
* `callback` {Function}
  * `err` {Error}
  * `fd`{integer}

Apertura de archivo asincrónica. Vea open(2).

`mode` establece el modo de archivo (el permiso y los sticky bits), pero solo si el archivo fue creado. On Windows, only the write permission can be manipulated; see [`fs.chmod()`][].

El callback recibe dos argumentos `(err, fd)`.

Algunos caracteres (`< > : " / \ | ? *`) están reservados bajo Windows como los documenta [Nombrar Archivos, Rutas, y Espacios de Nombres](https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file). Bajo NTFS, si el nombre de archivo contiene dos puntos, Node.js abrirá un stream del sistema de archivo, como lo describe [esta página de MSDN](https://docs.microsoft.com/en-us/windows/desktop/FileIO/using-streams).

Functions based on `fs.open()` exhibit this behavior as well: `fs.writeFile()`, `fs.readFile()`, etc.

## fs.openSync(path[, flags, mode])
<!-- YAML
added: v0.1.21
changes:
  - version: v11.1.0
    pr-url: https://github.com/nodejs/node/pull/23767
    description: The `flags` argument is now optional and defaults to `'r'`.
  - version: v9.9.0
    pr-url: https://github.com/nodejs/node/pull/18801
    description: The `as` and `as+` modes are supported now.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `flags` {string|number} **Default:** `'r'`. See [support of file system `flags`][].
* `mode` {integer} **Predeterminado:** `0o666`
* Devuelve: {number}

Returns an integer representing the file descriptor.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.open()`][].

## fs.read(fd, buffer, offset, length, position, callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v10.10.0
    pr-url: https://github.com/nodejs/node/pull/22150
    description: The `buffer` parameter can now be any `TypedArray`, or a
                 `DataView`.
  - version: v7.4.0
    pr-url: https://github.com/nodejs/node/pull/10382
    description: The `buffer` parameter can now be a `Uint8Array`.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4518
    description: The `length` parameter can now be `0`.
-->

* `fd`{integer}
* `buffer` {Buffer|TypedArray|DataView}
* `offset` {integer}
* `length` {integer}
* `position` {integer}
* `callback` {Function}
  * `err` {Error}
  * `bytesRead` {integer}
  * `buffer` {Buffer}

Lee datos del archivo especificado por `fd`.

`buffer` es el búfer al cual se escribirán los datos.

`offset` es el offset dentro del búfer en donde se empieza a escribir.

`length` es un entero que especifica el número de bytes a leer.

`position` es un argumento que especifica dónde comenzar la lectura desde dentro del archivo. Si `position` es `null`, se leerán los datos desde la posición actual del archivo, y se actualizará la posición del archivo. Si `position` es un entero, la posición del archivo permanecerá sin cambios.

Al callback se le dan tres argumentos, `(err, bytesRead, buffer)`.

SI se invoca este método en su versión de [`util.promisify()`][], devolverá una `Promise` a un `Object` con `bytesRead` y propiedades de `buffer` .

## fs.readdir(path[, options], callback)
<!-- YAML
added: v0.1.8
changes:
  - version: v10.10.0
    pr-url: https://github.com/nodejs/node/pull/22020
    description: New option `withFileTypes` was added.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5616
    description: The `options` parameter was added.
-->

* `path` {string|Buffer|URL}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`
  * `withFileTypes` {boolean} **Default:** `false`
* `callback` {Function}
  * `err` {Error}
  * `files` {string[]|Buffer[]|fs.Dirent[]}

readdir(3) asincrónico. Lee los contenidos de un directorio. El callback obtiene dos argumentos `(err, files)`, en donde `files` es una matriz de los nombres de los archivos en el directorio excluyendo `'.'` y `'..'`.

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar para los nombres de archivo pasados al callback. Si el `encoding` se establece a `'buffer'`, los nombres de archivo devueltos serán pasados como objetos de `Buffer` .

If `options.withFileTypes` is set to `true`, the `files` array will contain [`fs.Dirent`][] objects.

## fs.readdirSync(path[, options])
<!-- YAML
added: v0.1.21
changes:
  - version: v10.10.0
    pr-url: https://github.com/nodejs/node/pull/22020
    description: New option `withFileTypes` was added.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`
  * `withFileTypes` {boolean} **Default:** `false`
* Returns: {string[]|Buffer[]|fs.Dirent[]}

readdir(3) sincrónico.

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use for the filenames returned. Si el `encoding` se establece a `'buffer'`, los nombres de archivo devueltos serán pasados como objetos de `Buffer` .

If `options.withFileTypes` is set to `true`, the result will contain [`fs.Dirent`][] objects.

## fs.readFile(path[, options], callback)
<!-- YAML
added: v0.1.29
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
  - version: v5.1.0
    pr-url: https://github.com/nodejs/node/pull/3740
    description: The `callback` will always be called with `null` as the `error`
                 parameter in case of success.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: The `path` parameter can be a file descriptor now.
-->

* `path` {string|Buffer|URL|integer} nombre de archivo o descriptor de archivo
* `opciones` {Object|string}
  * `encoding` {string|null} **Por defecto es:** `null`
  * `flag` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Predeterminado:** `'r'`.
* `callback` {Function}
  * `err` {Error}
  * `data` {string|Buffer}

Lee de manera asincrónica todos los contenidos de un archivo.

```js
fs.readFile('/etc/passwd', (err, data) => {
  if (err) throw err;
  console.log(data);
});
```

Al callback se le pasan dos argumentos `(err, data)`, en donde `data` son los contenidos del archivo.

Si no se especifica ninguna codificación, entonces el búfer crudo será devuelto.

Si `options` es una string, entonces especifica la codificación:

```js
fs.readFile('/etc/passwd', 'utf8', callback);
```

Cuando la ruta es un directorio, el comportamiento de `fs.readFile()` y [`fs.readFileSync()`][] es específico en la plataforma. En macOS, Linux, y Windows, se devolverá un error. En FreeBSD, se devolverá una representación de los contenidos del directorio.

```js
// macOS, Linux, and Windows
fs.readFile('<directory>', (err, data) => {
  // => [Error: EISDIR: illegal operation on a directory, read <directory>]
});

//  FreeBSD
fs.readFile('<directory>', (err, data) => {
  // => null, <data>
});
```

La función `fs.readFile()` almacena todo el archivo. To minimize memory costs, when possible prefer streaming via `fs.createReadStream()`.

### Descriptores de archivo
1. Cualquier descriptor de archivos especificado tiene que soportar la lectura.
2. Si un descriptor de archivo se especifica como el `path`, no será cerrado automáticamente.
3. The reading will begin at the current position. For example, if the file already had `'Hello World`' and six bytes are read with the file descriptor, the call to `fs.readFile()` with the same file descriptor, would give `'World'`, rather than `'Hello World'`.

## fs.readFileSync(path[, options])
<!-- YAML
added: v0.1.8
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: The `path` parameter can be a file descriptor now.
-->

* `path` {string|Buffer|URL|integer} nombre de archivo o descriptor de archivo
* `opciones` {Object|string}
  * `encoding` {string|null} **Por defecto es:** `null`
  * `flag` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Predeterminado:** `'r'`.
* Devuelve: {string|Buffer}

Devuelve los contenidos del `path`.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.readFile()`][].

Si la opción de `encoding` es especificada, entonces esta función devuelve una string. De lo contrario, devuelve un búfer.

Similar a [`fs.readFile()`][], cuando la ruta es un directorio, el comportamiento de `fs.readFileSync()` es específico en la plataforma.

```js
// macOS, Linux, and Windows
fs.readFileSync('<directory>');
// => [Error: EISDIR: illegal operation on a directory, read <directory>]

//  FreeBSD
fs.readFileSync('<directory>'); // => <data>
```

## fs.readlink(path[, options], callback)
<!-- YAML
added: v0.1.31
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
-->

* `path` {string|Buffer|URL}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `linkString` {string|Buffer}

readlink(2) asincrónico. El callback obtiene dos argumentos `(err,
linkString)`.

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar para la ruta de enlace pasada al callback. Si el `encoding` se establece a `'buffer'`, la ruta de enlace devuelta será pasada como un objeto de `Buffer` .

## fs.readlinkSync(path[, options])
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`
* Devuelve: {string|Buffer}

readlink(2) sincrónico. Devuelve el valor de la string del enlace simbólico.

El argumento opcional `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar para la ruta del enlace devuelto. Si el `encoding` se establece a `'buffer'`, la ruta de enlace devuelta será pasada como un objeto de `Buffer` .

## fs.readSync(fd, buffer, offset, length, position)
<!-- YAML
added: v0.1.21
changes:
  - version: v10.10.0
    pr-url: https://github.com/nodejs/node/pull/22150
    description: The `buffer` parameter can now be any `TypedArray` or a
                 `DataView`.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4518
    description: The `length` parameter can now be `0`.
-->

* `fd`{integer}
* `buffer` {Buffer|TypedArray|DataView}
* `offset` {integer}
* `length` {integer}
* `position` {integer}
* Devuelve: {number}

Devuelve el número de `bytesRead`.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.read()`][].

## fs.realpath(path[, options], callback)
<!-- YAML
added: v0.1.31
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/13028
    description: Pipe/Socket resolve support was added.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7899
    description: Calling `realpath` now works again for various edge cases
                 on Windows.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/3594
    description: The `cache` parameter was removed.
-->

* `path` {string|Buffer|URL}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `resolvedPath` {string|Buffer}

Computa de manera asincrónica el nombre de ruta canónico resolviendo a `.`, `..` y a los enlaces simbólicos.

A canonical pathname is not necessarily unique. Hard links and bind mounts can expose a file system entity through many pathnames.

Esta función se comporta como realpath(3), con algunas excepciones:

1. No case conversion is performed on case-insensitive file systems.

2. The maximum number of symbolic links is platform-independent and generally (much) higher than what the native realpath(3) implementation supports.

El `callback` obtiene dos argumentos `(err, resolvedPath)`. Puede utilizar `process.cwd` para resolver rutas relativas.

Sólo son soportadas las rutas que pueden ser convertidas a strings UTF8.

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar para la ruta pasada al callback. Si el `encoding` se establece a `'buffer'`, la ruta devuelta será pasada como un objeto de `Buffer` .

Si `path` resuelve a un socket o un pipe, la función devolverá un nombre dependiente al sistema para ese objeto.

## fs.realpath.native(path[, options], callback)
<!-- YAML
added: v9.2.0
-->

* `path` {string|Buffer|URL}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `resolvedPath` {string|Buffer}

realpath(3) asincrónico.

El `callback` obtiene dos argumentos `(err, resolvedPath)`.

Sólo son soportadas las rutas que pueden ser convertidas a strings UTF8.

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar para la ruta pasada al callback. Si el `encoding` se establece a `'buffer'`, la ruta devuelta será pasada como un objeto de `Buffer` .

On Linux, when Node.js is linked against musl libc, the procfs file system must be mounted on `/proc` in order for this function to work. Glibc no tiene esta restricción.

## fs.realpathSync(path[, options])
<!-- YAML
added: v0.1.31
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/13028
    description: Pipe/Socket resolve support was added.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7899
    description: Calling `realpathSync` now works again for various edge cases
                 on Windows.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/3594
    description: The `cache` parameter was removed.
-->

* `path` {string|Buffer|URL}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`
* Devuelve: {string|Buffer}

Returns the resolved pathname.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.realpath()`][].

## fs.realpathSync.native(path[, options])
<!-- YAML
added: v9.2.0
-->

* `path` {string|Buffer|URL}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`
* Devuelve: {string|Buffer}

realpath(3) sincrónico.

Sólo son soportadas las rutas que pueden ser convertidas a strings UTF8.

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use for the path returned. Si el `encoding` se establece a `'buffer'`, la ruta devuelta será pasada como un objeto de `Buffer` .

On Linux, when Node.js is linked against musl libc, the procfs file system must be mounted on `/proc` in order for this function to work. Glibc no tiene esta restricción.

## fs.rename(oldPath, newPath, callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `oldPath` and `newPath` parameters can be WHATWG `URL`
                 objects using `file:` protocol. Support is currently still
                 *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
-->

* `oldPath` {string|Buffer|URL}
* `newPath` {string|Buffer|URL}
* `callback` {Function}
  * `err` {Error}

De manera asincrónica, renombra a un archivo en `oldPath` al nombre de ruta proporcionado como `newPath`. En caso de que `newPath` ya exista, será reescrito. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

Vea también: rename(2).

```js
fs.rename('oldFile.txt', 'newFile.txt', (err) => {
  if (err) throw err;
  console.log('Rename complete!');
});
```

## fs.renameSync(oldPath, newPath)
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `oldPath` and `newPath` parameters can be WHATWG `URL`
                 objects using `file:` protocol. Support is currently still
                 *experimental*.
-->

* `oldPath` {string|Buffer|URL}
* `newPath` {string|Buffer|URL}

rename(2) sincrónico. Devuelve `undefined`.

## fs.rmdir(path, callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameters can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
-->

* `path` {string|Buffer|URL}
* `callback` {Function}
  * `err` {Error}

rmdir(2) asincrónico. Ningún otro argumento que no sea una posible excepción es dado al callback de terminación.

Utilizar `fs.rmdir()` en un archivo (no un directorio) da como resultado un error de `ENOENT` en Windows y un error de `ENOTDIR` en POSIX.

## fs.rmdirSync(path)
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameters can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}

rmdir(2) sincrónico. Devuelve `undefined`.

Utilizar `fs.rmdirSync()` en un archivo (no un directorio) da como resultado un error de `ENOENT` en Windows y un error de `ENOTDIR` en POSIX.

## fs.stat(path[, options], callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
  - version: v10.5.0
    pr-url: https://github.com/nodejs/node/pull/20220
    description: Accepts an additional `options` object to specify whether
                 the numeric values returned should be bigint.
-->

* `path` {string|Buffer|URL}
* `opciones` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **Predeterminado:** `false`.
* `callback` {Function}
  * `err` {Error}
  * `stats` {fs.Stats}

stat(2) asincrónico. El callback obtiene dos argumentos `(err, stats)` donde `stats` es un objeto de [`fs.Stats`][].

En caso de que ocurra un error, el `err.code` será uno de los [Errores de Sistema Comunes](errors.html#errors_common_system_errors).

Utilizar `fs.stat()` para verificar la existencia de un archivo antes de llamar a `fs.open()`, `fs.readFile()` ó `fs.writeFile()` no es recomendado. En lugar de ello, el código de usuario debería abrir/leer/escribir el archivo directamente y manejar el error ocurrido si el archivo no está disponible.

Para verificar si un archivo existe sin manipularlo posteriormente, se recomienda [`fs.access()`].

## fs.statSync(path[, options])
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v10.5.0
    pr-url: https://github.com/nodejs/node/pull/20220
    description: Accepts an additional `options` object to specify whether
                 the numeric values returned should be bigint.
-->

* `path` {string|Buffer|URL}
* `opciones` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **Predeterminado:** `false`.
* Devuelve: {fs.Stats}

stat(2) sincrónico.

## fs.symlink(target, path[, type], callback)
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `target` and `path` parameters can be WHATWG `URL` objects
                 using `file:` protocol. Support is currently still
                 *experimental*.
-->

* `target` {string|Buffer|URL}
* `path` {string|Buffer|URL}
* `type` {string} **Por defecto es:** `'file'`
* `callback` {Function}
  * `err` {Error}

symlink(2) asincrónico. Ningún otro argumento que no sea una posible excepción es dado al callback de terminación. El argumento de `type` puede ser establecido a `'dir'`, `'file'`, ó `'junction'` y sólo está disponible en Windows (se ignora en otras plataformas). Windows junction points require the destination path to be absolute. When using `'junction'`, the `target` argument will automatically be normalized to absolute path.

A continuación, hay un ejemplo:

```js
fs.symlink('./foo', './new-port', callback);
```

Crea un enlace simbólico llamado "new-port" que apunta a "foo".

## fs.symlinkSync(target, path[, type])
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `target` and `path` parameters can be WHATWG `URL` objects
                 using `file:` protocol. Support is currently still
                 *experimental*.
-->

* `target` {string|Buffer|URL}
* `path` {string|Buffer|URL}
* `type` {string} **Por defecto es:** `'file'`

Devuelve `undefined`.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.symlink()`][].

## fs.truncate(path[, len], callback)
<!-- YAML
added: v0.8.6
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
-->

* `path` {string|Buffer|URL}
* `len` {integer} **Predeterminado:** `0`
* `callback` {Function}
  * `err` {Error}

truncate(2) asincrónico. Ningún argumento que no sea una posible excepción es dado al callback de terminación. Un descriptor de archivos también puede ser pasado como el primer argumento. En este caso, `fs.ftruncate()` es llamado.

Pasar un descriptor de archivo es obsoleto y puede ocasionar que se arroje un error en el futuro.

## fs.truncateSync(path[, len])
<!-- YAML
added: v0.8.6
-->

* `path` {string|Buffer|URL}
* `len` {integer} **Predeterminado:** `0`

truncate(2) sincrónico. Devuelve `undefined`. Un descriptor de archivo también puede ser pasado como el primer argumento. En este caso, `fs.ftruncateSync()` es llamado.

Pasar un descriptor de archivo es obsoleto y puede ocasionar que se arroje un error en el futuro.

## fs.unlink(path, callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
-->

* `path` {string|Buffer|URL}
* `callback` {Function}
  * `err` {Error}

Elimina de manera asincrónica un archivo o enlace simbólico. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

```js
// Assuming that 'path/file.txt' is a regular file.
fs.unlink('path/file.txt', (err) => {
  if (err) throw err;
  console.log('path/file.txt was deleted');
});
```

`fs.unlink()` no funcionará en un directorio, vacío o no. Para eliminar un directorio, utilice [`fs.rmdir()`][].

Vea también: unlink(2).

## fs.unlinkSync(path)
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}

unlink(2) sincrónico. Devuelve `undefined`.

## fs.unwatchFile(filename[, listener])
<!-- YAML
added: v0.1.31
-->

* `filename` {string|Buffer|URL}
* `listener` {Function} Opcional, un listener previamente acoplado utilizando `fs.watchFile()`

Deja de buscar cambios en `filename`. Si se especifica `listener`, sólo se eliminará ese listener en específico. De lo contrario, se eliminarán *todos* los listeners, deteniendo de manera eficaz la observación de `filename`.

Llamar a `fs.unwatchFile()` con un nombre de archivo que no esté siendo observado es un no-op, no un error.

Utilizar [`fs.watch()`][] es más eficiente que `fs.watchFile()` y `fs.unwatchFile()`. `fs.watch()` debería ser utilizado en lugar de `fs.watchFile()` y `fs.unwatchFile()` cuando sea posible.

## fs.utimes(path, atime, mtime, callback)
<!-- YAML
added: v0.4.2
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11919
    description: "`NaN`, `Infinity`, and `-Infinity` are no longer valid time
                 specifiers."
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
  - version: v4.1.0
    pr-url: https://github.com/nodejs/node/pull/2387
    description: Numeric strings, `NaN` and `Infinity` are now allowed
                 time specifiers.
-->

* `path` {string|Buffer|URL}
* `atime` {number|string|Date}
* `mtime` {number|string|Date}
* `callback` {Function}
  * `err` {Error}

Cambia las marcas de tiempo del sistema de archivos del objeto referenciado por `path`.

Los argumentos `atime` y `mtime` siguen las siguientes reglas:
- Los valores pueden ser números que representen el tiempo de época de Unix, `Date`s, o una string numérica como `'123456789.0'`.
- Si el valor no puede ser convertido a un número, o es `NaN`, `Infinity` o `-Infinity`, se arrojará un `Error` .

## fs.utimesSync(path, atime, mtime)
<!-- YAML
added: v0.4.2
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11919
    description: "`NaN`, `Infinity`, and `-Infinity` are no longer valid time
                 specifiers."
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v4.1.0
    pr-url: https://github.com/nodejs/node/pull/2387
    description: Numeric strings, `NaN` and `Infinity` are now allowed
                 time specifiers.
-->

* `path` {string|Buffer|URL}
* `atime` {integer}
* `mtime` {integer}

Devuelve `undefined`.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.utimes()`][].

## fs.watch(filename\[, options\]\[, listener\])
<!-- YAML
added: v0.5.10
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `filename` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7831
    description: The passed `options` object will never be modified.
-->

* `filename` {string|Buffer|URL}
* `opciones` {string|Object}
  * `persistent` {boolean} Indica si el proceso debería continuar ejecutándose, siempre y cuando los archivos estén siendo observados. **Predeterminado:** `true`.
  * `recursive` {boolean} Indica si todos los sub-directorios deberían ser observados, o solamente el directorio actual. Esto aplica cuando un directorio es especificado, y solamente en plataformas soportadas (Vea [Advertencias](#fs_caveats)). **Predeterminado:** `false`.
  * `encoding` {string} Especifica la codificación de caracteres que será utilizada para el nombre de archivo pasado al listener. **Predeterminado:** `'utf8'`.
* `listener` {Function|undefined} **Default:** `undefined`
  * `eventType` {string}
  * `filename` {string|Buffer}
* Devuelve: {fs.FSWatcher}

Busca cambios en `filename`, donde `filename` es o un archivo o un directorio.

El segundo argumento es opcional. Si se proporciona `options` como una string, especificará el `encoding`. De lo contrario, `options` debería ser pasado como un objeto.

El callback del listener recibe dos argumentos `(eventType, filename)`. `eventType` es `'rename'` ó `'change'`, y `filename` es el nombre del archivo que activó el evento.

On most platforms, `'rename'` is emitted whenever a filename appears or disappears in the directory.

The listener callback is attached to the `'change'` event fired by [`fs.FSWatcher`][], but it is not the same thing as the `'change'` value of `eventType`.

### Advertencias

<!--type=misc-->

La API de `fs.watch` no es 100% consistente entre plataformas, y en algunas situaciones no está disponible.

La opción recursiva sólo es soportada en macOS y Windows.

#### Disponibilidad

<!--type=misc-->

Esta función depende del sistema operativo subyacente, proporcionando una manera para estar notificado de los cambios del sistema de archivos.

* On Linux systems, this uses [`inotify(7)`].
* On BSD systems, this uses [`kqueue(2)`].
* On macOS, this uses [`kqueue(2)`] for files and [`FSEvents`] for directories.
* En sistemas SunOS (incluyendo Solaris y SmartOS), esto utiliza [`event ports`].
* En el sistema de Windows, esta función depende de [`ReadDirectoryChangesW`].
* En sistemas Aix, esta función depende de [`AHAFS`], la cual debe ser habilitada.

Si la funcionalidad subyacente no está disponible por algún motivo, entonces `fs.watch` no podrá funcionar. Por ejemplo, observar archivos o directorios puede no ser seguro, y en algunos casos imposible, en sistemas de archivos de red (NFS, SMB, etc), o sistemas de alojamiento de archivos cuando se utilizan softwares de virtualización tales como Vagrant, Docker, etc.

Aún es posible utilizar `fs.watchFile()`, el cual utiliza el polling de estadísticas, pero este método es más lento y menos seguro.

#### Inodos

<!--type=misc-->

En Linux y sistemas de macOS, `fs.watch()` resuelve la ruta a un [inode](https://en.wikipedia.org/wiki/Inode) y observa el inode. Si la ruta observada es eliminada y recreada, se le asigna un nuevo inode. La observación emitirá un evento para la eliminación, pero continuará observando el inode *original* . No se emitirán eventos para el nuevo inode. Este comportamiento es esperado.

Los archivos AIX retienen el mismo inode durante el tiempo de vida de un archivo. Guardar y cerrar un archivo observado en AIX tendrá como resultado dos notificaciones (una para añadir nuevo contenido, y una para el truncamiento).

#### Argumento de Nombre de Archivo

<!--type=misc-->

Proporcionar un argumento de `filename` en el callback sólo es soportado en Linux, macOS, WIndows, y AIX. Incluso en las plataformas que lo soportan, no se garantiza que `filename` siempre será proporcionado. Por lo tanto, no asuma que el argumento de `filename` siempre se proporcionará en el callback, y tendrá lógica de reserva si es `null`.

```js
fs.watch('somedir', (eventType, filename) => {
  console.log(`event type is: ${eventType}`);
  if (filename) {
    console.log(`filename provided: ${filename}`);
  } else {
    console.log('filename not provided');
  }
});
```

## fs.watchFile(filename[, options], listener)
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `filename` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
-->

* `filename` {string|Buffer|URL}
* `opciones` {Object}
  * `persistent` {boolean} **Por defecto es:** `true`
  * `interval` {integer} **Por defecto es:** `5007`
* `listener` {Function}
  * `current` {fs.Stats}
  * `previous` {fs.Stats}

Buscar cambios en `filename`. El callback de `listener` será llamado cada vez que el archivo sea accedido.

El argumento de `options` puede ser omitido. Si se proporciona, debería ser un objeto. El objeto de `options` puede contener un booleano llamado `persistent` que indica si el proceso debería continuar ejecutándose, siempre y cuando los archivos estén siendo observados. El objeto de `options` puede especificar una propiedad de `interval` que indique qué tan seguido debería estudiarse el objetivo en milisegundos.

El `listener` obtiene dos argumentos, el objeto de estadística actual y el objeto de estadística previo:

```js
fs.watchFile('message.text', (curr, prev) => {
  console.log(`the current mtime is: ${curr.mtime}`);
  console.log(`the previous mtime was: ${prev.mtime}`);
});
```

Estos objetos de estadísticas son instancias de `fs.Stat`.

Para ser notificado de cuándo se modificó el archivo, no sólo cuando fue accedido, es necesario comparar `curr.mtime` y `prev.mtime`.

Cuando una operación de `fs.watchFile` tiene como resultado un error de `ENOENT`, invocará al listener una vez, con todos los campos en cero (o, para las fechas, la época de Unix). En Windows, los campos de `blksize` y `blocks` serán `undefined`, en vez de cero. Si el archivo es creado más tarde, el listener será llamado nuevamente, con los últimos objetos de estadística. Este es un cambio en la funcionalidad desde v0.10.

Utilizar [`fs.watch()`][] es más eficiente que `fs.watchFile` y `fs.unwatchFile`. `fs.watch` debería ser utilizado en lugar de `fs.watchFile` y `fs.unwatchFile` cuando sea posible.

Cuando un archivo que esté siendo observado por `fs.watchFile()` desaparezca y reaparezca, entonces el `previousStat` reportado en el segundo evento del callback (la reaparición del archivo) será igual al `previousStat` del primer evento del callback (su desaparición).

Esto ocurre cuando:
- el archivo es eliminado, seguido de una restauración
- el archivo es renombrado dos veces - la segunda vez de vuelta a su nombre original

## fs.write(fd, buffer[, offset[, length[, position]]], callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v10.10.0
    pr-url: https://github.com/nodejs/node/pull/22150
    description: The `buffer` parameter can now be any `TypedArray` or a
                 `DataView`
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.4.0
    pr-url: https://github.com/nodejs/node/pull/10382
    description: The `buffer` parameter can now be a `Uint8Array`.
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/7856
    description: The `offset` and `length` parameters are optional now.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
-->

* `fd`{integer}
* `buffer` {Buffer|TypedArray|DataView}
* `offset` {integer}
* `length` {integer}
* `position` {integer}
* `callback` {Function}
  * `err` {Error}
  * `bytesWritten` {integer}
  * `buffer` {Buffer|TypedArray|DataView}

Escribe `buffer` al archivo especificado por `fd`.

`offset` determina la parte del búfer que será escrita, y `length` es un entero que especifica el número de bytes a escribir.

`position` se refiere al offset del principio del archivo en donde deberían ser escritos estos datos. En caso de que `typeof position !== 'number'`, los datos serán escritos en la posición actual. Vea pwrite(2).

Al callback se le darán tres argumentos `(err, bytesWritten, buffer)` en donde `bytesWritten` especificará cuántos _bytes_ fueron escritos desde `buffer`.

Si se invoca este método en su versión [`util.promisify()`][], devolverá una `Promise` para un `Object` con `bytesWritten` y propiedades de `buffer` .

It is unsafe to use `fs.write()` multiple times on the same file without waiting for the callback. For this scenario, [`fs.createWriteStream()`][] is recommended.

En Linux, las escrituras posicionales no funcionan cuando el archivo se abre en modo de anexo. El núcleo ignora el argumento de posición y siempre anexa los datos al final del archivo.

## fs.write(fd, string[, position[, encoding]], callback)
<!-- YAML
added: v0.11.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/7856
    description: The `position` parameter is optional now.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
-->

* `fd`{integer}
* `string` {string}
* `position` {integer}
* `encoding` {string} **Predeterminado:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `written` {integer}
  * `string` {string}

Escribe `string` al archivo especificado por `fd`. Si `string` no es una string, entonces el valor será forzado a uno.

`position` se refiere al offset del principio del archivo en donde deberían ser escritos estos datos. En caso de que `typeof position !== 'number'`, los datos serán escritos en la posición actual. Vea pwrite(2).

`encoding` es la codificación de string esperada.

El callback recibirá los argumentos `(err, written, string)`, en donde `written` especificará cuántos _bytes_ necesitó la string pasada para ser escrita. Bytes written is not necessarily the same as string characters written. See [`Buffer.byteLength`][].

It is unsafe to use `fs.write()` multiple times on the same file without waiting for the callback. For this scenario, [`fs.createWriteStream()`][] is recommended.

En Linux, las escrituras posicionales no funcionan cuando el archivo se abre en modo de anexo. El núcleo ignora el argumento de posición y siempre anexa los datos al final del archivo.

On Windows, if the file descriptor is connected to the console (e.g. `fd == 1` or `stdout`) a string containing non-ASCII characters will not be rendered properly by default, regardless of the encoding used. It is possible to configure the console to render UTF-8 properly by changing the active codepage with the `chcp 65001` command. See the [chcp](https://ss64.com/nt/chcp.html) docs for more details.

## fs.writeFile(file, data[, options], callback)
<!-- YAML
added: v0.1.29
changes:
  - version: v10.10.0
    pr-url: https://github.com/nodejs/node/pull/22150
    description: The `data` parameter can now be any `TypedArray` or a
                 `DataView`.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/12562
    description: The `callback` parameter is no longer optional. Not passing
                 it will throw a `TypeError` at runtime.
  - version: v7.4.0
    pr-url: https://github.com/nodejs/node/pull/10382
    description: The `data` parameter can now be a `Uint8Array`.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning with id DEP0013.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: The `file` parameter can be a file descriptor now.
-->

* `file` {string|Buffer|URL|integer} nombre de archivo o descriptor de archivo
* `data` {string|Buffer|TypedArray|DataView}
* `opciones` {Object|string}
  * `encoding` {string|null} **Por defecto es:** `'utf8'`
  * `mode` {integer} **Predeterminado:** `0o666`
  * `flag` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Predeterminado:** `'w'`.
* `callback` {Function}
  * `err` {Error}

Escribe los datos de manera asincrónica a un archivo, reemplazando el archivo si ya existe. `data` puede ser una string o un búfer.

La opción de `encoding` se ignora si `data` es un búfer.

```js
const data = new Uint8Array(Buffer.from('Hello Node.js'));
fs.writeFile('message.txt', data, (err) => {
  if (err) throw err;
  console.log('The file has been saved!');
});
```

Si `options` es una string, entonces especifica la codificación:

```js
fs.writeFile('message.txt', 'Hello Node.js', 'utf8', callback);
```

It is unsafe to use `fs.writeFile()` multiple times on the same file without waiting for the callback. For this scenario, [`fs.createWriteStream()`][] is recommended.

### Descriptores de archivo
1. Cualquier descriptor de archivos especificado tiene que soportar la escritura.
2. Si un descriptor de archivo se especifica como el `file`, no será cerrado automáticamente.
3. The writing will begin at the beginning of the file. For example, if the file already had `'Hello World'` and the newly written content is `'Aloha'`, then the contents of the file would be `'Aloha World'`, rather than just `'Aloha'`.


## fs.writeFileSync(file, data[, options])
<!-- YAML
added: v0.1.29
changes:
  - version: v10.10.0
    pr-url: https://github.com/nodejs/node/pull/22150
    description: The `data` parameter can now be any `TypedArray` or a
                 `DataView`.
  - version: v7.4.0
    pr-url: https://github.com/nodejs/node/pull/10382
    description: The `data` parameter can now be a `Uint8Array`.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: The `file` parameter can be a file descriptor now.
-->

* `file` {string|Buffer|URL|integer} nombre de archivo o descriptor de archivo
* `data` {string|Buffer|TypedArray|DataView}
* `opciones` {Object|string}
  * `encoding` {string|null} **Por defecto es:** `'utf8'`
  * `mode` {integer} **Predeterminado:** `0o666`
  * `flag` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Predeterminado:** `'w'`.

Devuelve `undefined`.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.writeFile()`][].

## fs.writeSync(fd, buffer[, offset[, length[, position]]])
<!-- YAML
added: v0.1.21
changes:
  - version: v10.10.0
    pr-url: https://github.com/nodejs/node/pull/22150
    description: The `buffer` parameter can now be any `TypedArray` or a
                 `DataView`.
  - version: v7.4.0
    pr-url: https://github.com/nodejs/node/pull/10382
    description: The `buffer` parameter can now be a `Uint8Array`.
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/7856
    description: The `offset` and `length` parameters are optional now.
-->

* `fd`{integer}
* `buffer` {Buffer|TypedArray|DataView}
* `offset` {integer}
* `length` {integer}
* `position` {integer}
* Returns: {number} The number of bytes written.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.write(fd, buffer...)`][].

## fs.writeSync(fd, string[, position[, encoding]])
<!-- YAML
added: v0.11.5
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/7856
    description: The `position` parameter is optional now.
-->

* `fd`{integer}
* `string` {string}
* `position` {integer}
* `encoding` {string}
* Returns: {number} The number of bytes written.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.write(fd, string...)`][].

## fs Promises API

> Estabilidad: 1 - Experimental

La API de `fs.promises` proporciona un conjunto alternativo de métodos de sistema de archivos asincrónicos que devuelven objetos de `Promise`, en lugar de utilizar callbacks. La API es accesible por medio de `require('fs').promises`.

### clase: FileHandle
<!-- YAML
added: v10.0.0
-->

Un objeto `FileHandle` es un envolvedor para un descriptor de archivo numérico. Las instancias de `FileHandle` son distintas a los descriptores de archivos numéricos en cuanto a que, si el `FileHandle` no se cierra explícitamente utilizando el método de `filehandle.close()`, cerrarán automáticamente el descriptor de archivos y emitirán un aviso de proceso, ayudando así a prevenir pérdidas de memoria.

Las instancias del objeto de `FileHandle` son creadas internamente por el método de `fsPromises.open()` .

A diferencia de la API basada en el callback (`fs.fstat()`, `fs.fchown()`, `fs.fchmod()`, y así sucesivamente), un descriptor de archivos numéricos no es utilizado por la API basada en la promesa. En lugar de ello, la API basada en la promesa utiliza la clase de `FileHandle` para ayudar a evitar la fuga accidental de los descriptores de archivos no cerrados luego de que se resuelve o se rechaza una `Promise` .

#### filehandle.appendFile(data, options)
<!-- YAML
added: v10.0.0
-->
* `data` {string|Buffer}
* `opciones` {Object|string}
  * `encoding` {string|null} **Por defecto es:** `'utf8'`
  * `mode` {integer} **Predeterminado:** `0o666`
  * `flag` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Predeterminado:** `'a'`.
* Devuelve: {Promise}

Anexa los datos de manera asincrónica a este archivo, creando el archivo en caso de que aún no exista. `data` puede ser una string o un [`Buffer`][]. La `Promise` será resuelta sin argumentos al realizarse con éxito.

Si `options` es una string, entonces especifica la codificación.

El `FileHandle` tuvo que haber sido abierto para ser anexado.

#### filehandle.chmod(mode)
<!-- YAML
added: v10.0.0
-->
* `mode`{integer}
* Devuelve: {Promise}

Modifica los permisos en el archivo. La `Promise` se resuelve sin argumentos al realizarse con éxito.

#### filehandle.chown(uid, gid)
<!-- YAML
added: v10.0.0
-->
* `uid`{integer}
* `gid`{integer}
* Devuelve: {Promise}

Cambia la pertenencia del archivo, luego resuelve la `Promise` sin argumentos al realizarse con éxito.

#### filehandle.close()
<!-- YAML
added: v10.0.0
-->

* Devuelve: {Promise} Una `Promise` que se resolverá una vez que se cierre el descriptor de archivo subyacente, o será rechazada si un error ocurre durante el cierre.

Cierra el descriptor de archivos.

```js
const fsPromises = require('fs').promises;
async function openAndClose() {
  let filehandle;
  try {
    filehandle = await fsPromises.open('thefile.txt', 'r');
  } finally {
    if (filehandle !== undefined)
      await filehandle.close();
  }
}
```

#### filehandle.datasync()
<!-- YAML
added: v10.0.0
-->
* Devuelve: {Promise}

fdatasync(2) asincrónico. La `Promise` se resuelve sin argumentos al realizarse con éxito.

#### filehandle.fd
<!-- YAML
added: v10.0.0
-->

* {number} El descriptor de archivo numérico gestionado por el objeto de `FileHandle` .

#### filehandle.read(buffer, offset, length, position)
<!-- YAML
added: v10.0.0
-->
* `buffer` {Buffer|Uint8Array}
* `offset` {integer}
* `length` {integer}
* `position` {integer}
* Devuelve: {Promise}

Leer datos desde el archivo.

`buffer` es el búfer al cual se escribirán los datos.

`offset` es el offset dentro del búfer en donde se empieza a escribir.

`length` es un entero que especifica el número de bytes a leer.

`position` es un argumento que especifica dónde comenzar la lectura desde dentro del archivo. Si `position` es `null`, se leerán los datos desde la posición actual del archivo, y se actualizará la posición del archivo. Si `position` es un entero, la posición del archivo permanecerá sin cambios.

Luego de una lectura exitosa, la `Promise` se resuelve con un objeto con una propiedad de `bytesRead` que especifique el número de bytes leídos, y una propiedad de `buffer` que sea una referencia a lo que fue pasado en el argumento de  `buffer` .

#### filehandle.readFile(options)
<!-- YAML
added: v10.0.0
-->
* `opciones` {Object|string}
  * `encoding` {string|null} **Por defecto es:** `null`
  * `flag` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Predeterminado:** `'r'`.
* Devuelve: {Promise}

Lee de manera asincrónica todos los contenidos de un archivo.

La `Promise` se resuelve con los contenidos del archivo. Si no se especifica ninguna codificación (utilizando `options.encoding`), los datos son devueltos como un objeto de `Buffer` . De lo contrario, los datos serán una string.

Si `options` es una string, entonces especifica la codificación.

Cuando el `path` es un directorio, el comportamiento de `fsPromises.readFile()` es específico en la plataforma. En macOS, Linux, y Windows, la promesa será rechazada con un error. En FreeBSD, una representación de los contenidos del directorio será devuelta.

El `FileHandle` debe soportar la lectura.

If one or more `filehandle.read()` calls are made on a file handle and then a `filehandle.readFile()` call is made, the data will be read from the current position till the end of the file. It doesn't always read from the beginning of the file.

#### filehandle.stat([options])
<!-- YAML
added: v10.0.0
changes:
  - version: v10.5.0
    pr-url: https://github.com/nodejs/node/pull/20220
    description: Accepts an additional `options` object to specify whether
                 the numeric values returned should be bigint.
-->
* `opciones` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **Predeterminado:** `false`.
* Devuelve: {Promise}

Recupera el [`fs.Stats`][] para el archivo.

#### filehandle.sync()
<!-- YAML
added: v10.0.0
-->
* Devuelve: {Promise}

fsync(2) asincrónico. La `Promise` se resuelve sin argumentos al realizarse con éxito.

#### filehandle.truncate(len)
<!-- YAML
added: v10.0.0
-->
* `len` {integer} **Predeterminado:** `0`
* Devuelve: {Promise}

Trunca el archivo y luego resuelve la `Promise` sin argumentos al realizarse con éxito.

Si el archivo era más grande que `len` bytes, sólo los primeros `len` bytes serán retenidos en el archivo.

Por ejemplo, el siguiente programa retiene sólo los primeros cuatro bytes del archivo:

```js
const fs = require('fs');
const fsPromises = fs.promises;

console.log(fs.readFileSync('temp.txt', 'utf8'));
// Prints: Node.js

async function doTruncate() {
  let filehandle = null;
  try {
    filehandle = await fsPromises.open('temp.txt', 'r+');
    await filehandle.truncate(4);
  } finally {
    if (filehandle) {
      // close the file if it is opened.
      await filehandle.close();
    }
  }
  console.log(fs.readFileSync('temp.txt', 'utf8'));  // Prints: Node
}

doTruncate().catch(console.error);
```

Si el archivo previamente era más corto que `len` bytes, se extiende, y la parte extendida se llena con bytes nulos (`'\0'`):

```js
const fs = require('fs');
const fsPromises = fs.promises;

console.log(fs.readFileSync('temp.txt', 'utf8'));
// Prints: Node.js

async function doTruncate() {
  let filehandle = null;
  try {
    filehandle = await fsPromises.open('temp.txt', 'r+');
    await filehandle.truncate(10);
  } finally {
    if (filehandle) {
      // close the file if it is opened.
      await filehandle.close();
    }
  }
  console.log(fs.readFileSync('temp.txt', 'utf8'));  // Prints Node.js\0\0\0
}

doTruncate().catch(console.error);
```

Los últimos tres bytes son bytes nulos (`'\0'`), para compensar el sobre-truncamiento.

#### filehandle.utimes(atime, mtime)
<!-- YAML
added: v10.0.0
-->
* `atime` {number|string|Date}
* `mtime` {number|string|Date}
* Devuelve: {Promise}

Cambia las marcas de tiempo del sistema de archivos del objeto referenciado por el `FileHandle`, luego resuelve la `Promise` sin argumentos al realizarse con éxito.

Esta función no funciona en versiones AIX anteriores a 7.1, resolverá la `Promise` con un error, utilizando el código `UV_ENOSYS`.

#### filehandle.write(buffer, offset, length, position)
<!-- YAML
added: v10.0.0
-->
* `buffer` {Buffer|Uint8Array}
* `offset` {integer}
* `length` {integer}
* `position` {integer}
* Devuelve: {Promise}

Escribe `buffer` al archivo.

La `Promise` se resuelve con un objeto que contenga una propiedad de `bytesWritten` que identifique el número de bytes escritos, y una propiedad de `buffer` que contenga una referencia al `buffer` escrito.

`offset` determina la parte del búfer que será escrita, y `length` es un entero que especifica el número de bytes a escribir.

`position` se refiere al offset del principio del archivo en donde deberían ser escritos estos datos. En caso de que `typeof position !== 'number'`, los datos serán escritos en la posición actual. Vea pwrite(2).

No es seguro utilizar `filehandle.write()` varias veces en el mismo archivo sin esperar a que la `Promise` sea resuelta (o rechazada). For this scenario, [`fs.createWriteStream()`][] is strongly recommended.

En Linux, las escrituras posicionales no funcionan cuando el archivo se abre en modo de anexo. El núcleo ignora el argumento de posición y siempre anexa los datos al final del archivo.

#### filehandle.write(string[, position[, encoding]])
<!-- YAML
added: v10.0.0
-->

* `string` {string}
* `position` {integer}
* `encoding` {string} **Predeterminado:** `'utf8'`
* Devuelve: {Promise}

Write `string` to the file. Si `string` no es una string, entonces el valor será forzado a uno.

The `Promise` is resolved with an object containing a `bytesWritten` property identifying the number of bytes written, and a `buffer` property containing a reference to the `string` written.

`position` se refiere al offset del principio del archivo en donde deberían ser escritos estos datos. If the type of `position` is not a `number` the data will be written at the current position. Vea pwrite(2).

`encoding` es la codificación de string esperada.

No es seguro utilizar `filehandle.write()` varias veces en el mismo archivo sin esperar a que la `Promise` sea resuelta (o rechazada). For this scenario, [`fs.createWriteStream()`][] is strongly recommended.

En Linux, las escrituras posicionales no funcionan cuando el archivo se abre en modo de anexo. El núcleo ignora el argumento de posición y siempre anexa los datos al final del archivo.

#### filehandle.writeFile(data, options)
<!-- YAML
added: v10.0.0
-->
* `data` {string|Buffer|Uint8Array}
* `opciones` {Object|string}
  * `encoding` {string|null} **Por defecto es:** `'utf8'`
  * `mode` {integer} **Predeterminado:** `0o666`
  * `flag` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Predeterminado:** `'w'`.
* Devuelve: {Promise}

Escribe los datos de manera asincrónica a un archivo, reemplazando el archivo si ya existe. `data` puede ser una string o un búfer. La `Promise` será resuelta sin argumentos al realizarse con éxito.

La opción de `encoding` se ignora si `data` es un búfer.

Si `options` es una string, entonces especifica la codificación.

El `FileHandle` debe soportar la lectura.

No es seguro utilizar `filehandle.writeFile()` varias veces en el mismo archivo sin esperar a que la `Promise` sea resuelta (o rechazada).

If one or more `filehandle.write()` calls are made on a file handle and then a `filehandle.writeFile()` call is made, the data will be written from the current position till the end of the file. It doesn't always write from the beginning of the file.

### fsPromises.access(path[, mode])
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL}
* `mode` {integer} **Por defecto es:** `fs.constants.F_OK`
* Devuelve: {Promise}

Prueba los permisos del usuario para el archivo o directorio especificado por `path`. El argumento `mode` es un entero opcional que especifica las verificaciones de accesibilidad que serán realizadas. Check [File Access Constants](#fs_file_access_constants) for possible values of `mode`. It is possible to create a mask consisting of the bitwise OR of two or more values (e.g. `fs.constants.W_OK | fs.constants.R_OK`).

Si la verificación de accesibilidad tiene éxito, la `Promise` se resuelve sin ningún valor. Si alguna verificación de accesibilidad falla, la `Promise` será rechazada con un objeto de `Error` . El siguiente ejemplo verifica si el archivo `/etc/passwd` puede ser leído y escrito por el proceso actual.

```js
const fs = require('fs');
const fsPromises = fs.promises;

fsPromises.access('/etc/passwd', fs.constants.R_OK | fs.constants.W_OK)
  .then(() => console.log('can access'))
  .catch(() => console.error('cannot access'));
```

Utilizar `fsPromises.access()` para verificar la accesibilidad de un archivo antes de llamar a `fsPromises.open()` no es recomendado. Hacerlo introduce una condición de carrera, ya que otros procesos pueden cambiar el estado del archivo entre dos llamadas. En lugar de ello, el código de usuario debería abrir/leer/escribir el archivo directamente y manejar el error ocurrido si el archivo no es accesible.

### fsPromises.appendFile(path, data[, options])
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL|FileHandle} nombre de archivo o `FileHandle`
* `data` {string|Buffer}
* `opciones` {Object|string}
  * `encoding` {string|null} **Por defecto es:** `'utf8'`
  * `mode` {integer} **Predeterminado:** `0o666`
  * `flag` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Predeterminado:** `'a'`.
* Devuelve: {Promise}

Anexa los datos de manera asincrónica a un archivo, creando el archivo en caso de que aún no exista. `data` puede ser una string o un [`Buffer`][]. La `Promise` será resuelta sin argumentos al realizarse con éxito.

Si `options` es una string, entonces especifica la codificación.

El `path` puede ser especificado como un `FileHandle` que ha sido abierto para ser anexado (utilizando `fsPromises.open()`).

### fsPromises.chmod(path, mode)
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL}
* `mode`{integer}
* Devuelve: {Promise}

Cambia los permisos de un archivo, luego resuelve la `Promise` sin argumentos al realizarlo con éxito.

### fsPromises.chown(path, uid, gid)
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL}
* `uid`{integer}
* `gid`{integer}
* Devuelve: {Promise}

Cambia la pertenencia de un archivo, luego resuelve la `Promise` sin argumentos al realizarse con éxito.

### fsPromises.copyFile(src, dest[, flags])
<!-- YAML
added: v10.0.0
-->

* `src` {string|Buffer|URL} nombre de archivo de la fuente a copiar
* `dest` {string|Buffer|URL} nombre de archivo de destino de la operación de copia
* `flags` {number} modificadores para la operación de copia. **Predeterminado:** `0`.
* Devuelve: {Promise}

Copia de manera asincrónica `src` a `dest`. Por defecto, se sobrescribe `dest` si ya existe. La `Promise` será resuelta sin argumentos al realizarse con éxito.

Node.js no ofrece ninguna garantía sobre la atomicidad de la operación de copia. Si un error ocurre luego de que el archivo de destino ha sido abierto para escritura, Node.js intentará eliminar el destino.

`flags` es un entero opcional que especifica el comportamiento de la operación de copia. Es posible crear una máscara que consista del bitwise O de dos o más valores (por ejemplo, `fs.constants.COPYFILE_EXCL | fs.constants.COPYFILE_FICLONE`).

* `fs.constants.COPYFILE_EXCL` - La operación de copia fallará si `dest` ya existe.
* `fs.constants.COPYFILE_FICLONE` - The copy operation will attempt to create a copy-on-write reflink. If the platform does not support copy-on-write, then a fallback copy mechanism is used.
* `fs.constants.COPYFILE_FICLONE_FORCE` - The copy operation will attempt to create a copy-on-write reflink. Si la plataforma no es compatible con copy-on-write, entonces la operación fallará.

```js
const fsPromises = require('fs').promises;

// destination.txt will be created or overwritten by default.
fsPromises.copyFile('source.txt', 'destination.txt')
  .then(() => console.log('source.txt was copied to destination.txt'))
  .catch(() => console.log('The file could not be copied'));
```

If the third argument is a number, then it specifies `flags`:

```js
const fs = require('fs');
const fsPromises = fs.promises;
const { COPYFILE_EXCL } = fs.constants;

// By using COPYFILE_EXCL, the operation will fail if destination.txt exists.
fsPromises.copyFile('source.txt', 'destination.txt', COPYFILE_EXCL)
  .then(() => console.log('source.txt was copied to destination.txt'))
  .catch(() => console.log('The file could not be copied'));
```

### fsPromises.lchmod(path, mode)
<!-- YAML
deprecated: v10.0.0
-->

* `path` {string|Buffer|URL}
* `mode`{integer}
* Devuelve: {Promise}

Cambia los permisos en un enlace simbólico, luego resuelve la `Promise` sin argumentos al realizarse con éxito. Este método sólo se implementa en macOS.

### fsPromises.lchown(path, uid, gid)
<!-- YAML
added: v10.0.0
changes:
  - version: v10.6.0
    pr-url: https://github.com/nodejs/node/pull/21498
    description: This API is no longer deprecated.
-->

* `path` {string|Buffer|URL}
* `uid`{integer}
* `gid`{integer}
* Devuelve: {Promise}

Cambia la pertenencia en un enlace simbólico, luego resuelve la `Promise` sin argumentos al realizarse con éxito.

### fsPromises.link(existingPath, newPath)
<!-- YAML
added: v10.0.0
-->

* `existingPath` {string|Buffer|URL}
* `newPath` {string|Buffer|URL}
* Devuelve: {Promise}

link(2) asincrónico. La `Promise` se resuelve sin argumentos al realizarse con éxito.

### fsPromises.lstat(path[, options])
<!-- YAML
added: v10.0.0
changes:
  - version: v10.5.0
    pr-url: https://github.com/nodejs/node/pull/20220
    description: Accepts an additional `options` object to specify whether
                 the numeric values returned should be bigint.
-->

* `path` {string|Buffer|URL}
* `opciones` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **Predeterminado:** `false`.
* Devuelve: {Promise}

lstat(2) asincrónico. La `Promise` se resuelve con el objeto de [`fs.Stats`][] para el enlace simbólico de `path` dado.

### fsPromises.mkdir(path[, options])
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL}
* `opciones` {Object|integer}
  * `recursive` {boolean} **Default:** `false`
  * `mode` {integer} Not supported on Windows. **Default:** `0o777`.
* Devuelve: {Promise}

De manera asincrónica, crea un directorio y luego resuelve la `Promise` sin argumentos al realizarse con éxito.

The optional `options` argument can be an integer specifying mode (permission and sticky bits), or an object with a `mode` property and a `recursive` property indicating whether parent folders should be created.

### fsPromises.mkdtemp(prefix[, options])
<!-- YAML
added: v10.0.0
-->

* `prefix` {string}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`
* Devuelve: {Promise}

Crea un directorio temporal único y resuelve la `Promise` con la ruta de carpeta creada. Se genera un nombre de directorio único anexando seis caracteres al azar al final del `prefix` proporcionado.

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar.

```js
fsPromises.mkdtemp(path.join(os.tmpdir(), 'foo-'))
  .catch(console.error);
```

El método de `fsPromises.mkdtemp()` anexará los seis caracteres seleccionados aleatoriamente, directamente a la string de `prefix` . For instance, given a directory `/tmp`, if the intention is to create a temporary directory *within* `/tmp`, the `prefix` must end with a trailing platform-specific path separator (`require('path').sep`).

### fsPromises.open(path, flags[, mode])
<!-- YAML
added: v10.0.0
changes:
  - version: v11.1.0
    pr-url: https://github.com/nodejs/node/pull/23767
    description: The `flags` argument is now optional and defaults to `'r'`.
-->

* `path` {string|Buffer|URL}
* `flags` {string|number} Vea [soporte de las `flags` del sistema de archivos][]. **Predeterminado:** `'r'`.
* `mode` {integer} **Default:** `0o666` (readable and writable)
* Devuelve: {Promise}

Apertura asincrónica de archivo que devuelve una `Promise` que, cuando se resuelve, produce un objeto de `FileHandle` . Vea open(2).

`mode` establece el modo de archivo (el permiso y los sticky bits), pero solo si el archivo fue creado.

Algunos caracteres (`< > : " / \ | ? *`) están reservados bajo Windows como los documenta [Nombrar Archivos, Rutas, y Espacios de Nombres](https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file). Bajo NTFS, si el nombre de archivo contiene dos puntos, Node.js abrirá un stream del sistema de archivo, como lo describe [esta página de MSDN](https://docs.microsoft.com/en-us/windows/desktop/FileIO/using-streams).

### fsPromises.readdir(path[, options])
<!-- YAML
added: v10.0.0
changes:
  - version: v10.11.0
    pr-url: https://github.com/nodejs/node/pull/22020
    description: New option `withFileTypes` was added.
-->

* `path` {string|Buffer|URL}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`
  * `withFileTypes` {boolean} **Default:** `false`
* Devuelve: {Promise}

Reads the contents of a directory then resolves the `Promise` with an array of the names of the files in the directory excluding `'.'` and `'..'`.

El argumento opcional `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar para los nombres de archivo. Si el `encoding` se establece a `'buffer'`, los nombres de archivo devueltos serán pasados como un objeto de `Buffer` .

If `options.withFileTypes` is set to `true`, the resolved array will contain [`fs.Dirent`][] objects.

### fsPromises.readFile(path[, options])
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL|FileHandle} nombre de archivo o `FileHandle`
* `opciones` {Object|string}
  * `encoding` {string|null} **Por defecto es:** `null`
  * `flag` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Predeterminado:** `'r'`.
* Devuelve: {Promise}

Lee de manera asincrónica todos los contenidos de un archivo.

La `Promise` se resuelve con los contenidos del archivo. Si no se especifica ninguna codificación (utilizando `options.encoding`), los datos son devueltos como un objeto de `Buffer` . De lo contrario, los datos serán una string.

Si `options` es una string, entonces especifica la codificación.

Cuando el `path` es un directorio, el comportamiento de `fsPromises.readFile()` es específico en la plataforma. En macOS, Linux, y Windows, la promesa será rechazada con un error. En FreeBSD, una representación de los contenidos del directorio será devuelta.

Cualquier `FileHandle` especificado tiene que apoyar la lectura.

### fsPromises.readlink(path[, options])
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`
* Devuelve: {Promise}

readlink(2) asincrónico. La `Promise` se resuelve con el `linkString` al realizarse con éxito.

El argumento opcional `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar para la ruta del enlace devuelto. Si el `encoding` se establece a `'buffer'`, la ruta de enlace devuelta será pasada como un objeto de `Buffer` .

### fsPromises.realpath(path[, options])
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`
* Devuelve: {Promise}

Determina la ubicación actual de `path` utilizando la misma semántica que la función `fs.realpath.native()`, luego resuelve la `Promise` con la ruta resuelta.

Sólo son soportadas las rutas que pueden ser convertidas a strings UTF8.

El argumento opcional `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar para la ruta. Si el `encoding` se establece a `'buffer'`, la ruta devuelta será pasada como un objeto de `Buffer` .

On Linux, when Node.js is linked against musl libc, the procfs file system must be mounted on `/proc` in order for this function to work. Glibc no tiene esta restricción.

### fsPromises.rename(oldPath, newPath)
<!-- YAML
added: v10.0.0
-->

* `oldPath` {string|Buffer|URL}
* `newPath` {string|Buffer|URL}
* Devuelve: {Promise}

Renombra a `oldPath` como `newPath` y resuelve la `Promise` sin argumentos al realizarse con éxito.

### fsPromises.rmdir(path)
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL}
* Devuelve: {Promise}

Elimina el directorio identificado por `path`, luego resuelve la `Promise` sin argumentos al realizarse con éxito.

Utilizar `fsPromises.rmdir()` en un archivo (no un directorio) da como resultado el rechazo de la `Promise` con un error `ENOENT` en Windows y un error `ENOTDIR` en POSIX.

### fsPromises.stat(path[, options])
<!-- YAML
added: v10.0.0
changes:
  - version: v10.5.0
    pr-url: https://github.com/nodejs/node/pull/20220
    description: Accepts an additional `options` object to specify whether
                 the numeric values returned should be bigint.
-->

* `path` {string|Buffer|URL}
* `opciones` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **Predeterminado:** `false`.
* Devuelve: {Promise}

La `Promise` se resuelve con el objeto de [`fs.Stats`][] para el `path` dado.

### fsPromises.symlink(target, path[, type])
<!-- YAML
added: v10.0.0
-->

* `target` {string|Buffer|URL}
* `path` {string|Buffer|URL}
* `type` {string} **Por defecto es:** `'file'`
* Devuelve: {Promise}

Crea un enlace simbólico y luego resuelve la `Promise` sin argumentos al realizarse con éxito.

El argumento de `type` sólo se utiliza en plataformas de Windows y puede ser uno de `'dir'`, `'file'`, o `'junction'`. Windows junction points require the destination path to be absolute. When using `'junction'`, the `target` argument will automatically be normalized to absolute path.

### fsPromises.truncate(path[, len])
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL}
* `len` {integer} **Predeterminado:** `0`
* Devuelve: {Promise}

Trunca el `path` y luego resuelve la `Promise` sin argumentos al realizarse con éxito. El `path` *debe* ser una string o `Buffer`.

### fsPromises.unlink(path)
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL}
* Devuelve: {Promise}

unlink(2) asincrónico. La `Promise` se resuelve sin argumentos al realizarse con éxito.

### fsPromises.utimes(path, atime, mtime)
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL}
* `atime` {number|string|Date}
* `mtime` {number|string|Date}
* Devuelve: {Promise}

Cambia las marcas de tiempo del sistema de archivos del objeto referenciado por `path`, luego resuelve la `Promise` sin argumentos al realizarse con éxito.

Los argumentos `atime` y `mtime` siguen las siguientes reglas:
- Los valores pueden ser números que representen el tiempo de época de Unix, `Date`s, o una string numérica como `'123456789.0'`.
- Si el valor no puede ser convertido a un número, o es `NaN`, `Infinity` o `-Infinity`, se arrojará un `Error` .

### fsPromises.writeFile(file, data[, options])
<!-- YAML
added: v10.0.0
-->

* `file` {string|Buffer|URL|FileHandle} nombre de archivo o `FileHandle`
* `data` {string|Buffer|Uint8Array}
* `opciones` {Object|string}
  * `encoding` {string|null} **Por defecto es:** `'utf8'`
  * `mode` {integer} **Predeterminado:** `0o666`
  * `flag` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Predeterminado:** `'w'`.
* Devuelve: {Promise}

Escribe los datos de manera asincrónica a un archivo, reemplazando el archivo si ya existe. `data` puede ser una string o un búfer. La `Promise` será resuelta sin argumentos al realizarse con éxito.

La opción de `encoding` se ignora si `data` es un búfer.

Si `options` es una string, entonces especifica la codificación.

Cualquier `FileHandle` especificado tiene que apoyar la escritura.

No es seguro utilizar `fsPromises.writeFile()` varias veces en el mismo archivo sin esperar a que la `Promise` sea resuelta (o rechazada).

## Constantes FS

Las siguientes constantes son exportadas por `fs.constants`.

No todas las constantes estarán disponibles en cada sistema operativo.

### Constantes de Acceso de Archivo

Las siguientes constantes están destinadas para ser utilizadas con [`fs.access()`][].

<table>
  <tr>
    <th>Constante</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>F_OK</code></td>
    <td>Bandera que indica que el archivo es visible para el proceso de llamada.
     This is useful for determining if a file exists, but says nothing
     about <code>rwx</code> permissions. Predeterminado si no se especifica ningún mode .</td>
  </tr>
  <tr>
    <td><code>R_OK</code></td>
    <td>Bandera que indica que el archivo puede ser leído por el proceso de llamada.</td>
  </tr>
  <tr>
    <td><code>W_OK</code></td>
    <td>Bandera que indica que el archivo puede ser escrito por el proceso
    de llamada.</td>
  </tr>
  <tr>
    <td><code>X_OK</code></td>
    <td>Bandera que indica que el archivo puede ser ejecutado por el proceso
    de llamada. This has no effect on Windows
    (will behave like <code>fs.constants.F_OK</code>).</td>
  </tr>
</table>

### Constantes de Copia de Archivo

Las siguientes constantes están destinadas para ser utilizadas con [`fs.copyFile()`][].

<table>
  <tr>
    <th>Constante</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>COPYFILE_EXCL</code></td>
    <td>Si está presente, la operación de copia fallará con un error si la
    ruta de destino ya existe.</td>
  </tr>
  <tr>
    <td><code>COPYFILE_FICLONE</code></td>
    <td>Si está presente, la operación de copia intentará crear un
    enlace de referencia de copy-on-write. If the underlying platform does not support
    copy-on-write, then a fallback copy mechanism is used.</td>
  </tr>
  <tr>
    <td><code>COPYFILE_FICLONE_FORCE</code></td>
    <td>Si está presente, la operación de copia intentará crear un
    enlace de referencia de copy-on-write. If the underlying platform does not support
    copy-on-write, then the operation will fail with an error.</td>
  </tr>
</table>

### Constantes Abiertas de Archivo

Las siguientes constantes están destinadas para ser utilizadas con `fs.open()`.

<table>
  <tr>
    <th>Constantes</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>O_RDONLY</code></td>
    <td>Bandera que indica abrir un archivo con acceso de solo-lectura.</td>
  </tr>
  <tr>
    <td><code>O_WRONLY</code></td>
    <td>Bandera que indica abrir un archivo con acceso de solo-escritura.</td>
  </tr>
  <tr>
    <td><code>O_RDWR</code></td>
    <td>Bandera que indica abrir un archivo con acceso de lectura-escritura.</td>
  </tr>
  <tr>
    <td><code>O_CREAT</code></td>
    <td>Bandera que indica crear el archivo, si éste aún no existe.</td>
  </tr>
  <tr>
    <td><code>O_EXCL</code></td>
    <td>Bandera que indica que fallará la apertura de un archivo si la
bandera     <code>O_CREAT</code> está establecida y el archivo ya existe.</td>
  </tr>
  <tr>
    <td><code>O_NOCTTY</code></td>
    <td>Bandera que indica que si la ruta identifica un dispositivo terminal, abrir la
    ruta no causará que ese terminal se convierta en un terminal de control para
    el proceso (si el proceso no posee ya en ese momento uno).</td>
  </tr>
  <tr>
    <td><code>O_TRUNC</code></td>
    <td>Bandera que indica que si el archivo existe y es un archivo normal, y el
    archivo se abre exitosamente con acceso para ser escrito, su longitud deberá ser truncada
    a cero.</td>
  </tr>
  <tr>
    <td><code>O_APPEND</code></td>
    <td>Bandera que indica que los datos serán anexados al final del archivo.</td>
  </tr>
  <tr>
    <td><code>O_DIRECTORY</code></td>
    <td>Bandera que indica que la apertura debería fallar si la ruta no es un
    directorio.</td>
  </tr>
  <tr>
  <td><code>O_NOATIME</code></td>
    <td>Flag indicating reading accesses to the file system will no longer
    result in an update to the <code>atime</code> information associated with
    the file.  Esta bandera sólo está disponible en sistemas operativos de Linux.</td>
  </tr>
  <tr>
    <td><code>O_NOFOLLOW</code></td>
    <td>Bandera que indica que la apertura debería fallar si el archivo es un link
    simbólico.</td>
  </tr>
  <tr>
    <td><code>O_SYNC</code></td>
    <td>Bandera que indica que el archivo se abre para E/S sincronizada con operaciones de
    escritura a la espera de la integridad del archivo.</td>
  </tr>
  <tr>
    <td><code>O_DSYNC</code></td>
    <td>Bandera que indica que el archivo se abre para E/S sincronizada con operaciones de
    escritura a la espera de la integridad de los datos.</td>
  </tr>
  <tr>
    <td><code>O_SYMLINK</code></td>
    <td>Bandera que indica abrir el enlace simbólico en vez del
    recurso al cual éste apunta.</td>
  </tr>
  <tr>
    <td><code>O_DIRECT</code></td>
    <td>Al establecerse, se realizará un intento para minimizar los efectos de captura del archivo
    E/S.</td>
  </tr>
  <tr>
    <td><code>O_NONBLOCK</code></td>
    <td>Bandera que indica abrir el archivo en modo de no-bloqueo, cuando sea posible.</td>
  </tr>
</table>

### Constantes de Tipo de Archivo

Las siguientes constantes están destinadas para ser utilizadas con la propiedad `mode` del objeto de [`fs.Stats`][] para determinar el tipo de un archivo.

<table>
  <tr>
    <th>Constante</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>S_IFMT</code></td>
    <td>Máscara de bits utilizada para extraer el código de tipo de archivo.</td>
  </tr>
  <tr>
    <td><code>S_IFREG</code></td>
    <td>Constante de tipo de archivo para un archivo normal.</td>
  </tr>
  <tr>
    <td><code>S_IFDIR</code></td>
    <td>Constante de tipo de archivo para un directorio.</td>
  </tr>
  <tr>
    <td><code>S_IFDIR</code></td>
    <td>Constante de tipo de archivo para un archivo de dispositivo orientado por caracteres.</td>
  </tr>
  <tr>
    <td><code>S_IFBLK</code></td>
    <td>Constante de tipo de archivo para un archivo de dispositivo orientado por bloques.</td>
  </tr>
  <tr>
    <td><code>S_IFIFO</code></td>
    <td>Constante de tipo de archivo para un FIFO/pipe.</td>
  </tr>
  <tr>
    <td><code>S_IFLNK</code></td>
    <td>Constante de tipo de archivo para un enlace simbólico.</td>
  </tr>
  <tr>
    <td><code>S_IFSOCK</code></td>
    <td>Constante de tipo de archivo para un socket.</td>
  </tr>
</table>

### Constantes de Modo de Archivo

Las siguientes constantes están destinadas para ser utilizadas con la propiedad `mode` del objeto de [`fs.Stats`][] para determinar los permisos de acceso para un archivo.

<table>
  <tr>
    <th>Constante</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>S_IRWXU</code></td>
    <td>Modo de archivo que indica que es legible, editable y que puede ser ejecutado por el propietario.</td>
  </tr>
  <tr>
    <td><code>S_IRUSR</code></td>
    <td>Modo de archivo que indica que puede ser leído por el propietario.</td>
  </tr>
  <tr>
    <td><code>S_IWUSR</code></td>
    <td>Modo de archivo que indica que puede ser editado por el propietario.</td>
  </tr>
  <tr>
    <td><code>S_IXUSR</code></td>
    <td>Modo de archivo que indica que puede ser ejecutado por el propietario.</td>
  </tr>
  <tr>
    <td><code>S_IRWXG</code></td>
    <td>Modo de archivo que indica que es legible, editable y que puede ser ejecutado por el grupo.</td>
  </tr>
  <tr>
    <td><code>S_IRGRP</code></td>
    <td>Modo de archivo que indica que puede ser leído por el grupo.</td>
  </tr>
  <tr>
    <td><code>S_IWGRP</code></td>
    <td>Modo de archivo que indica que puede ser editado por el grupo.</td>
  </tr>
  <tr>
    <td><code>S_IXGRP</code></td>
    <td>Modo de archivo que indica que puede ser ejecutado por el grupo.</td>
  </tr>
  <tr>
    <td><code>S_IRWXO</code></td>
    <td>Modo de archivo que indica que es legible, editable y que puede ser ejecutado por otros.</td>
  </tr>
  <tr>
    <td><code>S_IROTH</code></td>
    <td>Modo de archivo que indica que puede ser leído por otros.</td>
  </tr>
  <tr>
    <td><code>S_IWOTH</code></td>
    <td>Modo de archivo que indica que puede ser editado por otros.</td>
  </tr>
  <tr>
    <td><code>S_IXOTH</code></td>
    <td>Modo de archivo que indica que puede ser ejecutado por otros.</td>
  </tr>
</table>

## Banderas del Sistema de Archivos

Las siguientes banderas están disponibles en donde sea que la opción de `flag` tome una string:

* `'a'` - Archivo abierto para anexar. El archivo se crea si no existe.

* `'ax'` - Como `'a'`, pero falla si la ruta existe.

* `'a+'` - Archivo abierto para leer y anexar. El archivo se crea si no existe.

* `'ax+'` - Como `'a+'`, pero falla si la ruta existe.

* `'as'` - Archivo abierto para anexar en modo sincrónico. El archivo se crea si no existe.

* `'as+'` - Archivo abierto para leer y anexar en modo sincrónico. El archivo se crea si no existe.

* `'r'` - Archivo abierto para leer. Una excepción ocurre si el archivo no existe.

* `'r+'` - Archivo abierto para leer y escribir. Una excepción ocurre si el archivo no existe.

* `'rs+'` - Archivo abierto para leer y escribir en modo sincrónico. Instruye al sistema operativo a evadir la caché del sistema de archivos local.

  This is primarily useful for opening files on NFS mounts as it allows skipping the potentially stale local cache. Tiene un impacto bastante real en el rendimiento de E/S, así que no se recomienda utilizar esta bandera a menos de que sea necesario.

  This doesn't turn `fs.open()` or `fsPromises.open()` into a synchronous blocking call. If synchronous operation is desired, something like `fs.openSync()` should be used.

* `'w'` - Archivo abierto para escribir. El archivo es creado (si no existe) o truncado (si existe).

* `'wx'` - Como `'w'`, pero falla si la ruta existe.

* `'w+'` - Archivo abierto para leer y escribir. El archivo es creado (si no existe) o truncado (si existe).

* `'wx+'` - Como `'w+'`, pero falla si la ruta existe.

`flag` también puede ser un número como lo documenta open(2); las constantes comúnmente utilizadas están disponibles desde `fs.constants`. En Windows, donde esto sea aplicable, las banderas son traducidas a sus equivalentes, por ejemplo, `O_WRONLY` a `FILE_GENERIC_WRITE`, o `O_EXCL|O_CREAT` para `CREATE_NEW`, como las acepta `CreateFileW`.

La bandera exclusiva `'x'` (bandera `O_EXCL` en open(2)) asegura que esa ruta sea creada recientemente. En sistemas de POSIX, se considera que la ruta existe incluso si es un enlace simbólico a un archivo inexistente. La bandera exclusiva puede o no que funcione con sistemas de archivos de red.

En Linux, las escrituras posicionales no funcionan cuando el archivo se abre en modo de anexo. El núcleo ignora el argumento de posición y siempre anexa los datos al final del archivo.

Modificar un archivo en vez de reemplazarlo puede que requiera un modo de banderas de `'r+'` en lugar del modo predeterminado `'w'`.

El comportamiento de algunas banderas son específicas en la plataforma. Y así, abrir un directorio en macOS y Linux con la bandera `'a+'` - vea el ejemplo a continuación - devolverá un error. En contraste, en Windows y FreeBSD, un descriptor de archivo o un `FileHandle` será devuelto.

```js
// macOS and Linux
fs.open('<directory>', 'a+', (err, fd) => {
  // => [Error: EISDIR: illegal operation on a directory, open <directory>]
});

// Windows and FreeBSD
fs.open('<directory>', 'a+', (err, fd) => {
  // => null, <fd>
});
```

En Windows, abrir un archivo oculto existente utilizando la bandera `'w'` (ya sea mediante `fs.open()` ó `fs.writeFile()` ó `fsPromises.open()`) fallará con `EPERM`. Los archivos ocultos existentes pueden ser abiertos para ser escritos con la bandera `'r+'` .

A call to `fs.ftruncate()` or `filehandle.truncate()` can be used to reset the file contents.
