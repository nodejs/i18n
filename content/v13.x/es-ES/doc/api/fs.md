# Sistema de Archivos

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

<!--name=fs-->

The `fs` module provides an API for interacting with the file system in a manner closely modeled around standard POSIX functions.

Para utilizar este módulo:

```js
const fs = require('fs');
```

Todas las operaciones del sistema de archivo tienen formas sincrónicas y asincrónicas.

La forma asincrónica siempre toma un callback de terminación como su último argumento. Los argumentos pasados al callback de terminación dependen del método, pero el primer argumento se reserva siempre para una excepción. Si la operación se completó con éxito, entonces el primer argumento será `null` o `undefined`.

```js
const fs = require('fs');

fs.unlink('/tmp/hello', (err) => {
  if (err) throw err;
  console.log('successfully deleted /tmp/hello');
});
```

Exceptions that occur using synchronous operations are thrown immediately and may be handled using `try…catch`, or may be allowed to bubble up.

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

To correctly order the operations, move the `fs.stat()` call into the callback of the `fs.rename()` operation:

```js
fs.rename('/tmp/hello', '/tmp/world', (err) => {
  if (err) throw err;
  fs.stat('/tmp/world', (err, stats) => {
    if (err) throw err;
    console.log(`stats: ${JSON.stringify(stats)}`);
  });
});
```

In busy processes, use the asynchronous versions of these calls. The synchronous versions will block the entire process until they complete, halting all connections.

While it is not recommended, most fs functions allow the callback argument to be omitted, in which case a default callback is used that rethrows errors. To get a trace to the original call site, set the `NODE_DEBUG` environment variable:

Omitting the callback function on asynchronous fs functions is deprecated and may result in an error being thrown in the future.

```console
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

Most `fs` operations accept filepaths that may be specified in the form of a string, a [`Buffer`][], or a [`URL`][] object using the `file:` protocol.

String form paths are interpreted as UTF-8 character sequences identifying the absolute or relative filename. Relative paths will be resolved relative to the current working directory as specified by `process.cwd()`.

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

Paths specified using a [`Buffer`][] are useful primarily on certain POSIX operating systems that treat file paths as opaque byte sequences. On such systems, it is possible for a single file path to contain sub-sequences that use multiple character encodings. As with string paths, `Buffer` paths may be relative or absolute:

Ejemplo utilizando una ruta absoluta en POSIX:

```js
fs.open(Buffer.from('/abrir/algun/archivo.txt'), 'r', (err, fd) => {
  if (err) throw err;
  fs.close(fd, (err) => {
    if (err) throw err;
  });
});
```

On Windows, Node.js follows the concept of per-drive working directory. This behavior can be observed when using a drive path without a backslash. For example `fs.readdirSync('c:\\')` can potentially return a different result than `fs.readdirSync('c:')`. For more information, see [this MSDN page](https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file#fully-qualified-vs-relative-paths).

### Soporte de objetos de URL
<!-- YAML
added: v7.6.0
-->
For most 

`fs` module functions, the `path` or `filename` argument may be passed as a WHATWG [`URL`][] object. Only [`URL`][] objects using the `file:` protocol are supported.

```js
const fs = require('fs');
const fileUrl = new URL('file:///tmp/hola');

fs.readFileSync(fileUrl);
```

`file:` URLs are always absolute paths.

Utilizar objetos de [`URL`][] de WHATWG podría introducir comportamientos específicos a la plataforma.

On Windows, `file:` URLs with a host name convert to UNC paths, while `file:` URLs with drive letters convert to local absolute paths. `file:` URLs without a host name nor a drive letter will result in a throw:

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

`file:` URLs with drive letters must use `:` as a separator just after the drive letter. Utilizar otro separador dará como resultado un lanzamiento.

On all other platforms, `file:` URLs with a host name are unsupported and will result in a throw:

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

A `file:` URL having encoded slash characters will result in a throw on all platforms:

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

On POSIX systems, for every process, the kernel maintains a table of currently open files and resources. Each open file is assigned a simple numeric identifier called a *file descriptor*. At the system-level, all file system operations use these file descriptors to identify and track each specific file. Windows systems use a different but conceptually similar mechanism for tracking resources. To simplify things for users, Node.js abstracts away the specific differences between operating systems and assigns all open files a numeric file descriptor.

The `fs.open()` method is used to allocate a new file descriptor. Once allocated, the file descriptor may be used to read data from, write data to, or request information about the file.

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

Most operating systems limit the number of file descriptors that may be open at any given time so it is critical to close the descriptor when operations are completed. Failure to do so will result in a memory leak that will eventually cause an application to crash.

## Uso de Threadpool

All file system APIs except `fs.FSWatcher()` and those that are explicitly synchronous use libuv's threadpool, which can have surprising and negative performance implications for some applications. See the [`UV_THREADPOOL_SIZE`][] documentation for more information.

## Class `fs.Dir`
<!-- YAML
added: v12.12.0
-->

A class representing a directory stream.

Created by [`fs.opendir()`][], [`fs.opendirSync()`][], or [`fsPromises.opendir()`][].

```js
const fs = require('fs');

async function print(path) {
  const dir = await fs.promises.opendir(path);
  for await (const dirent of dir) {
    console.log(dirent.name);
  }
}
print('./').catch(console.error);
```

### `dir.close()`
<!-- YAML
added: v12.12.0
-->

* Devuelve: {Promise}

Asynchronously close the directory's underlying resource handle. Subsequent reads will result in errors.

A `Promise` is returned that will be resolved after the resource has been closed.

### `dir.close(callback)`
<!-- YAML
added: v12.12.0
-->

* `callback` {Function}
  * `err` {Error}

Asynchronously close the directory's underlying resource handle. Subsequent reads will result in errors.

The `callback` will be called after the resource handle has been closed.

### `dir.closeSync()`
<!-- YAML
added: v12.12.0
-->

Synchronously close the directory's underlying resource handle. Subsequent reads will result in errors.

### `dir.path`
<!-- YAML
added: v12.12.0
-->

* {string}

The read-only path of this directory as was provided to [`fs.opendir()`][], [`fs.opendirSync()`][], or [`fsPromises.opendir()`][].

### `dir.read()`
<!-- YAML
added: v12.12.0
-->

* Returns: {Promise} containing {fs.Dirent|null}

Asynchronously read the next directory entry via readdir(3) as an [`fs.Dirent`][].

After the read is completed, a `Promise` is returned that will be resolved with an [`fs.Dirent`][], or `null` if there are no more directory entries to read.

Directory entries returned by this function are in no particular order as provided by the operating system's underlying directory mechanisms. Entries added or removed while iterating over the directory may or may not be included in the iteration results.

### `dir.read(callback)`
<!-- YAML
added: v12.12.0
-->

* `callback` {Function}
  * `err` {Error}
  * `dirent` {fs.Dirent|null}

Asynchronously read the next directory entry via readdir(3) as an [`fs.Dirent`][].

After the read is completed, the `callback` will be called with an [`fs.Dirent`][], or `null` if there are no more directory entries to read.

Directory entries returned by this function are in no particular order as provided by the operating system's underlying directory mechanisms. Entries added or removed while iterating over the directory may or may not be included in the iteration results.

### `dir.readSync()`
<!-- YAML
added: v12.12.0
-->

* Returns: {fs.Dirent|null}

Synchronously read the next directory entry via readdir(3) as an [`fs.Dirent`][].

If there are no more directory entries to read, `null` will be returned.

Directory entries returned by this function are in no particular order as provided by the operating system's underlying directory mechanisms. Entries added or removed while iterating over the directory may or may not be included in the iteration results.

### `dir[Symbol.asyncIterator]()`
<!-- YAML
added: v12.12.0
-->

* Returns: {AsyncIterator} of {fs.Dirent}

Asynchronously iterates over the directory via readdir(3) until all entries have been read.

Entries returned by the async iterator are always an [`fs.Dirent`][]. The `null` case from `dir.read()` is handled internally.

See [`fs.Dir`][] for an example.

Directory entries returned by this iterator are in no particular order as provided by the operating system's underlying directory mechanisms. Entries added or removed while iterating over the directory may or may not be included in the iteration results.

## Class: `fs.Dirent`
<!-- YAML
added: v10.10.0
-->

A representation of a directory entry, as returned by reading from an [`fs.Dir`][].

Additionally, when [`fs.readdir()`][] or [`fs.readdirSync()`][] is called with the `withFileTypes` option set to `true`, the resulting array is filled with `fs.Dirent` objects, rather than strings or `Buffers`.

### `dirent.isBlockDevice()`
<!-- YAML
added: v10.10.0
-->

* Devuelve: {boolean}

Returns `true` if the `fs.Dirent` object describes a block device.

### `dirent.isCharacterDevice()`
<!-- YAML
added: v10.10.0
-->

* Devuelve: {boolean}

Returns `true` if the `fs.Dirent` object describes a character device.

### `dirent.isDirectory()`
<!-- YAML
added: v10.10.0
-->

* Devuelve: {boolean}

Returns `true` if the `fs.Dirent` object describes a file system directory.

### `dirent.isFIFO()`
<!-- YAML
added: v10.10.0
-->

* Devuelve: {boolean}

Returns `true` if the `fs.Dirent` object describes a first-in-first-out (FIFO) pipe.

### `dirent.isFile()`
<!-- YAML
added: v10.10.0
-->

* Devuelve: {boolean}

Returns `true` if the `fs.Dirent` object describes a regular file.

### `dirent.isSocket()`
<!-- YAML
added: v10.10.0
-->

* Devuelve: {boolean}

Returns `true` if the `fs.Dirent` object describes a socket.

### `dirent.isSymbolicLink()`
<!-- YAML
added: v10.10.0
-->

* Devuelve: {boolean}

Returns `true` if the `fs.Dirent` object describes a symbolic link.

### `dirent.name`
<!-- YAML
added: v10.10.0
-->

* {string|Buffer}

The file name that this `fs.Dirent` object refers to. The type of this value is determined by the `options.encoding` passed to [`fs.readdir()`][] or [`fs.readdirSync()`][].

## Class: `fs.FSWatcher`
<!-- YAML
added: v0.5.8
-->

* Extends {EventEmitter}

A successful call to [`fs.watch()`][] method will return a new `fs.FSWatcher` object.

All `fs.FSWatcher` objects emit a `'change'` event whenever a specific watched file is modified.

### Event: `'change'`
<!-- YAML
added: v0.5.8
-->

* `eventType` {string} El tipo de evento de cambio que ha ocurrido
* `filename` {string|Buffer} El nombre de archivo que cambió (si es relevante/disponible)

Se emite cuando algo cambia en un directorio o archivo observado. Vea más detalles en [`fs.watch()`][].

El argumento de `filename` puede no estar proporcionado dependiendo del soporte del sistema operativo. If `filename` is provided, it will be provided as a `Buffer` if `fs.watch()` is called with its `encoding` option set to `'buffer'`, otherwise `filename` will be a UTF-8 string.

```js
// Ejemplo cuando es manejado a través de fs.watch()
fs.watch('./tmp', { encoding: 'buffer' }, (eventType, filename) => {
  if (filename) {
    console.log(filename);
    // Imprime: <Buffer ...>
  }
});
```

### Event: `'close'`
<!-- YAML
added: v10.0.0
-->

Emitted when the watcher stops watching for changes. The closed `fs.FSWatcher` object is no longer usable in the event handler.

### Event: `'error'`
<!-- YAML
added: v0.5.8
-->

* `error` {Error}

Emitted when an error occurs while watching the file. The errored `fs.FSWatcher` object is no longer usable in the event handler.

### `watcher.close()`
<!-- YAML
added: v0.5.8
-->

Deja de buscar cambios en el `fs.FSWatcher` dado. Once stopped, the `fs.FSWatcher` object is no longer usable.

## Class: `fs.ReadStream`
<!-- YAML
added: v0.1.93
-->

* Extends: {stream.Readable}

A successful call to `fs.createReadStream()` will return a new `fs.ReadStream` object.

### Event: `'close'`
<!-- YAML
added: v0.1.93
-->

Emitted when the `fs.ReadStream`'s underlying file descriptor has been closed.

### Event: `'open'`
<!-- YAML
added: v0.1.93
-->

* `fd` {integer} Descriptor de archivo de enteros utilizado por el `ReadStream`.

Emitted when the `fs.ReadStream`'s file descriptor has been opened.

### Event: `'ready'`
<!-- YAML
added: v9.11.0
-->

Emitted when the `fs.ReadStream` is ready to be used.

Fires immediately after `'open'`.

### `readStream.bytesRead`
<!-- YAML
added: v6.4.0
-->

* {number}

The number of bytes that have been read so far.

### `readStream.path`
<!-- YAML
added: v0.1.93
-->

* {string|Buffer}

La ruta al archivo desde el cual lee el stream, como se especifica en el primer argumento a `fs.createReadStream()`. Si `path` se pasa como una string, entonces `readStream.path` será una string. Si `path` se pasa como un `Buffer`, entonces `readStream.path` será un `Buffer`.

### `readStream.pending`
<!-- YAML
added: v11.2.0
-->

* {boolean}

This property is `true` if the underlying file has not been opened yet, i.e. before the `'ready'` event is emitted.

## Class: `fs.Stats`
<!-- YAML
added: v0.1.21
changes:
  - version: v8.1.0
    pr-url: https://github.com/nodejs/node/pull/13173
    description: Added times as numbers.
-->

A `fs.Stats` object provides information about a file.

Objects returned from [`fs.stat()`][], [`fs.lstat()`][] and [`fs.fstat()`][] and their synchronous counterparts are of this type. If `bigint` in the `options` passed to those methods is true, the numeric values will be `bigint` instead of `number`, and the object will contain additional nanosecond-precision properties suffixed with `Ns`.

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
BigIntStats {
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
  atimeNs: 1318289051000000000n,
  mtimeNs: 1318289051000000000n,
  ctimeNs: 1318289051000000000n,
  birthtimeNs: 1318289051000000000n,
  atime: Mon, 10 Oct 2011 23:24:11 GMT,
  mtime: Mon, 10 Oct 2011 23:24:11 GMT,
  ctime: Mon, 10 Oct 2011 23:24:11 GMT,
  birthtime: Mon, 10 Oct 2011 23:24:11 GMT }
```

### `stats.isBlockDevice()`
<!-- YAML
added: v0.1.10
-->

* Devuelve: {boolean}

Returns `true` if the `fs.Stats` object describes a block device.

### `stats.isCharacterDevice()`
<!-- YAML
added: v0.1.10
-->

* Devuelve: {boolean}

Returns `true` if the `fs.Stats` object describes a character device.

### `stats.isDirectory()`
<!-- YAML
added: v0.1.10
-->

* Devuelve: {boolean}

Returns `true` if the `fs.Stats` object describes a file system directory.

### `stats.isFIFO()`
<!-- YAML
added: v0.1.10
-->

* Devuelve: {boolean}

Returns `true` if the `fs.Stats` object describes a first-in-first-out (FIFO) pipe.

### `stats.isFile()`
<!-- YAML
added: v0.1.10
-->

* Devuelve: {boolean}

Returns `true` if the `fs.Stats` object describes a regular file.

### `stats.isSocket()`
<!-- YAML
added: v0.1.10
-->

* Devuelve: {boolean}

Returns `true` if the `fs.Stats` object describes a socket.

### `stats.isSymbolicLink()`
<!-- YAML
added: v0.1.10
-->

* Devuelve: {boolean}

Returns `true` if the `fs.Stats` object describes a symbolic link.

This method is only valid when using [`fs.lstat()`][].

### `stats.dev`

* {number|bigint}

The numeric identifier of the device containing the file.

### `stats.ino`

* {number|bigint}

The file system specific "Inode" number for the file.

### `stas.mode`

* {number|bigint}

A bit-field describing the file type and mode.

### `stats.nlink`

* {number|bigint}

The number of hard-links that exist for the file.

### `stats.uid`

* {number|bigint}

The numeric user identifier of the user that owns the file (POSIX).

### `stats.gid`

* {number|bigint}

The numeric group identifier of the group that owns the file (POSIX).

### `stats.rdev`

* {number|bigint}

A numeric device identifier if the file is considered "special".

### `stats.size`

* {number|bigint}

The size of the file in bytes.

### `stats.blksize`

* {number|bigint}

The file system block size for i/o operations.

### `stats.blocks`

* {number|bigint}

The number of blocks allocated for this file.

### `stats.atimeMs`
<!-- YAML
added: v8.1.0
-->

* {number|bigint}

The timestamp indicating the last time this file was accessed expressed in milliseconds since the POSIX Epoch.

### `stats.mtimeMs`
<!-- YAML
added: v8.1.0
-->

* {number|bigint}

The timestamp indicating the last time this file was modified expressed in milliseconds since the POSIX Epoch.

### `stats.ctimeMs`
<!-- YAML
added: v8.1.0
-->

* {number|bigint}

The timestamp indicating the last time the file status was changed expressed in milliseconds since the POSIX Epoch.

### `stats.birthtimeMs`
<!-- YAML
added: v8.1.0
-->

* {number|bigint}

The timestamp indicating the creation time of this file expressed in milliseconds since the POSIX Epoch.

### `stats.atimeNs`
<!-- YAML
added: v12.10.0
-->

* {bigint}

Only present when `bigint: true` is passed into the method that generates the object. The timestamp indicating the last time this file was accessed expressed in nanoseconds since the POSIX Epoch.

### `stats.mtimeNs`
<!-- YAML
added: v12.10.0
-->

* {bigint}

Only present when `bigint: true` is passed into the method that generates the object. The timestamp indicating the last time this file was modified expressed in nanoseconds since the POSIX Epoch.

### `stats.ctimeNs`
<!-- YAML
added: v12.10.0
-->

* {bigint}

Only present when `bigint: true` is passed into the method that generates the object. The timestamp indicating the last time the file status was changed expressed in nanoseconds since the POSIX Epoch.

### `stats.birthtimeNs`
<!-- YAML
added: v12.10.0
-->

* {bigint}

Only present when `bigint: true` is passed into the method that generates the object. The timestamp indicating the creation time of this file expressed in nanoseconds since the POSIX Epoch.

### `stats.atime`
<!-- YAML
added: v0.11.13
-->

* {Date}

The timestamp indicating the last time this file was accessed.

### `stats.mtime`
<!-- YAML
added: v0.11.13
-->

* {Date}

The timestamp indicating the last time this file was modified.

### `stats.ctime`
<!-- YAML
added: v0.11.13
-->

* {Date}

The timestamp indicating the last time the file status was changed.

### `stats.birthtime`
<!-- YAML
added: v0.11.13
-->

* {Date}

The timestamp indicating the creation time of this file.

### Valores del Tiempo de Estadísticas

The `atimeMs`, `mtimeMs`, `ctimeMs`, `birthtimeMs` properties are numeric values that hold the corresponding times in milliseconds. Their precision is platform specific. When `bigint: true` is passed into the method that generates the object, the properties will be [bigints](https://tc39.github.io/proposal-bigint), otherwise they will be [numbers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type).

The `atimeNs`, `mtimeNs`, `ctimeNs`, `birthtimeNs` properties are [bigints](https://tc39.github.io/proposal-bigint) that hold the corresponding times in nanoseconds. They are only present when `bigint: true` is passed into the method that generates the object. Their precision is platform specific.

`atime`, `mtime`, `ctime`, and `birthtime` are [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) object alternate representations of the various times. The `Date` and number values are not connected. Assigning a new number value, or mutating the `Date` value, will not be reflected in the corresponding alternate representation.

Los tiempos en el objeto de estadística tienen la siguiente semántica:

* `atime` "Access Time": Time when file data last accessed. Cambiado por las llamadas de sistema mknod(2), utimes(2), y read(2).
* `mtime` "Modified Time": Time when file data last modified. Cambiado por las llamadas de sistema mknod(2), utimes(2), y write(2).
* `ctime` "Change Time": Time when file status was last changed (inode data modification). Cambiado por las llamada de sistema chmod(2), chown(2), link(2), mknod(2), rename(2), unlink(2), utimes(2), read(2) y write(2).
* `birthtime` "Birth Time": Time of file creation. Se establece una vez que el archivo es creado. On filesystems where birthtime is not available, this field may instead hold either the `ctime` or `1970-01-01T00:00Z` (ie, Unix epoch timestamp `0`). This value may be greater than `atime` or `mtime` in this case. On Darwin and other FreeBSD variants, also set if the `atime` is explicitly set to an earlier value than the current `birthtime` using the utimes(2) system call.

Prior to Node.js 0.12, the `ctime` held the `birthtime` on Windows systems. As of 0.12, `ctime` is not "creation time", and on Unix systems, it never was.

## Class: `fs.WriteStream`
<!-- YAML
added: v0.1.93
-->

* Extends {stream.Writable}

### Event: `'close'`
<!-- YAML
added: v0.1.93
-->

Se emite cuando el descriptor de archivo subyacente de `WriteStream` ha sido cerrado.

### Event: `'open'`
<!-- YAML
added: v0.1.93
-->

* `fd` {integer} Descriptor de archivo de enteros utilizado por el `WriteStream`.

Emitted when the `WriteStream`'s file is opened.

### Event: `'ready'`
<!-- YAML
added: v9.11.0
-->

Emitted when the `fs.WriteStream` is ready to be used.

Fires immediately after `'open'`.

### `writeStream.bytesWritten`
<!-- YAML
added: v0.4.7
-->

El número de bytes escritos hasta ahora. No incluye datos que todavía están en cola para escritura.

### `writeStream.path`
<!-- YAML
added: v0.1.93
-->

The path to the file the stream is writing to as specified in the first argument to [`fs.createWriteStream()`][]. Si se pasa a `path` como una string, entonces `writeStream.path` será una string. Si se pasa a `path` com un `Buffer`, entonces `writeStream.path` será un `Buffer`.

### `writeStream.pending`
<!-- YAML
added: v11.2.0
-->

* {boolean}

This property is `true` if the underlying file has not been opened yet, i.e. before the `'ready'` event is emitted.

## `fs.access(path[, mode], callback)`
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

* `path`{string|Buffer|URL}
* `mode` {integer} **Default:** `fs.constants.F_OK`
* `callback` {Function}
  * `err` {Error}

Prueba los permisos de un usuario para el archivo o directorio especificado por `path`. El argumento `mode` es un entero opcional que especifica las verificaciones de accesibilidad que serán realizadas. Check [File Access Constants](#fs_file_access_constants) for possible values of `mode`. It is possible to create a mask consisting of the bitwise OR of two or more values (e.g. `fs.constants.W_OK | fs.constants.R_OK`).

El argumento final, `callback`, es una función de callback que se invoca con un posible argumento de error. If any of the accessibility checks fail, the error argument will be an `Error` object. The following examples check if `package.json` exists, and if it is readable or writable.

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

Utilizar `fs.access()` para verificar la accesibilidad de un archivo antes de llamar a `fs.open()`, `fs.readFile()` o `fs.writeFile()` no es recomendado. Hacer esto introduce una condición de carrera, ya que otros procesos pueden cambiar el estado del archivo entre las dos llamadas. En lugar de ello, el código de usuario debería abrir/leer/escribir el archivo directamente y manejar el error ocurrido si el archivo no es accesible.

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

**leer (NO RECOMENDADO)**

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

In general, check for the accessibility of a file only if the file will not be used directly, for example when its accessibility is a signal from another process.

On Windows, access-control policies (ACLs) on a directory may limit access to a file or directory. The `fs.access()` function, however, does not check the ACL and therefore may report that a path is accessible even if the ACL restricts the user from reading or writing to it.

## `fs.accessSync(path[, mode])`
<!-- YAML
added: v0.11.15
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path`{string|Buffer|URL}
* `mode` {integer} **Default:** `fs.constants.F_OK`

Synchronously tests a user's permissions for the file or directory specified by `path`. The `mode` argument is an optional integer that specifies the accessibility checks to be performed. Check [File Access Constants](#fs_file_access_constants) for possible values of `mode`. It is possible to create a mask consisting of the bitwise OR of two or more values (e.g. `fs.constants.W_OK | fs.constants.R_OK`).

Si alguna verificación de accesibilidad falla, se arrojará un `Error` . Otherwise, the method will return `undefined`.

```js
try {
  fs.accessSync('etc/passwd', fs.constants.R_OK | fs.constants.W_OK);
  console.log('puede leer/escribir');
} catch (err) {
  console.error('Sin acceso');
}
```

## `fs.appendFile(path, data[, options], callback)`
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
* `options` {Object|string}
  * `encoding` {string|null} **Default:** `'utf8'`
  * `mode` {integer} **Default:** `0o666`
  * `flag` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Default:** `'a'`.
* `callback` {Function}
  * `err` {Error}

Asynchronously append data to a file, creating the file if it does not yet exist. `data` puede ser una string o un [`Buffer`][].

```js
fs.appendFile('message.txt', 'datos a agregar', (err) => {
  if (err) throw err;
  console.log('El "datos a agregar" ha sido añadido al archivo');
});
```

If `options` is a string, then it specifies the encoding:

```js
fs.appendFile('message.txt', 'data a añadir', 'utf8', callback);
```

The `path` may be specified as a numeric file descriptor that has been opened for appending (using `fs.open()` or `fs.openSync()`). The file descriptor will not be closed automatically.

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

## `fs.appendFileSync(path, data[, options])`
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
* `options` {Object|string}
  * `encoding` {string|null} **Default:** `'utf8'`
  * `mode` {integer} **Default:** `0o666`
  * `flag` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Default:** `'a'`.

Synchronously append data to a file, creating the file if it does not yet exist. `data` puede ser una string o un [`Buffer`][].

```js
try {
  fs.appendFileSync('message.txt', 'data a añadir');
  console.log('Los "data a añadir" fueron añadidos al archivo');
} catch (err) {
  /* Maneja el error*/
}
```

If `options` is a string, then it specifies the encoding:

```js
fs.appendFileSync('message.txt', 'data a añadir', 'utf8');
```

The `path` may be specified as a numeric file descriptor that has been opened for appending (using `fs.open()` or `fs.openSync()`). The file descriptor will not be closed automatically.

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

## `fs.chmod(path, mode, callback)`
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

* `path`{string|Buffer|URL}
* `mode` {string|integer}
* `callback` {Function}
  * `err` {Error}

Cambia de manera asincrónica los permisos de un archivo. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

See also: chmod(2).

```js
fs.chmod('my_file.txt', 0o775, (err) => {
  if (err) throw err;
  console.log('The permissions for file "my_file.txt" have been changed!');
});
```

### Modos de archivo

The `mode` argument used in both the `fs.chmod()` and `fs.chmodSync()` methods is a numeric bitmask created using a logical OR of the following constants:

| Constante              | Octal   | Descripción                     |
| ---------------------- | ------- | ------------------------------- |
| `fs.constants.S_IRUSR` | `0o400` | leído por el propietario        |
| `fs.constants.S_IWUSR` | `0o200` | escribir por propietario        |
| `fs.constants.S_IXUSR` | `0o100` | ejecutar/buscar por propietario |
| `fs.constants.S_IRGRP` | `0o40`  | leído por el grupo              |
| `fs.constants.S_IWGRP` | `0o20`  | escribir por grupo              |
| `fs.constants.S_IXGRP` | `0o10`  | ejecutar/buscar por grupo       |
| `fs.constants.S_IROTH` | `0o4`   | leído por otros                 |
| `fs.constants.S_IWOTH` | `0o2`   | escribir por otros              |
| `fs.constants.S_IXOTH` | `0 o1`  | ejecutar/buscar por otros       |

An easier method of constructing the `mode` is to use a sequence of three octal digits (e.g. `765`). The left-most digit (`7` in the example), specifies the permissions for the file owner. The middle digit (`6` in the example), specifies permissions for the group. The right-most digit (`5` in the example), specifies the permissions for others.

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

## `fs.chmodSync(path, mode)`
<!-- YAML
added: v0.6.7
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path`{string|Buffer|URL}
* `mode` {string|integer}

For detailed information, see the documentation of the asynchronous version of this API: [`fs.chmod()`][].

See also: chmod(2).

## `fs.chown(path, uid, gid, callback)`
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

* `path`{string|Buffer|URL}
* `uid`{integer}
* `gid`{integer}
* `callback` {Function}
  * `err` {Error}

Cambia de manera asincrónica el propietario y el grupo de un archivo. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

See also: chown(2).

## `fs.chownSync(path, uid, gid)`
<!-- YAML
added: v0.1.97
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path`{string|Buffer|URL}
* `uid`{integer}
* `gid`{integer}

Cambia de manera sincrónica el propietario y el grupo de un archivo. Devuelve `undefined`. Esta es la versión sincrónica de [`fs.chown()`][].

See also: chown(2).

## `fs.close(fd, callback)`
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

Calling `fs.close()` on any file descriptor (`fd`) that is currently in use through any other `fs` operation may lead to undefined behavior.

## `fs.closeSync(fd)`
<!-- YAML
added: v0.1.21
-->

* `fd`{integer}

close(2) sincrónico. Devuelve `undefined`.

Calling `fs.closeSync()` on any file descriptor (`fd`) that is currently in use through any other `fs` operation may lead to undefined behavior.

## `fs.constants`

* {Object}

Devuelve un objeto que contiene constantes utilizadas comúnmente para operaciones del sistema de archivos. Las constantes específicas actualmente definidas se describen en [Constantes de FS](#fs_fs_constants_1).

## `fs.copyFile(src, dest[, flags], callback)`
<!-- YAML
added: v8.5.0
-->

* `src` {string|Buffer|URL} nombre de archivo de la fuente a copiar
* `dest` {string|Buffer|URL} nombre de archivo de destino de la operación de copia
* `flags` {number} modificadores para la operación de copia. **Default:** `0`.
* `callback` {Function}

Copia de manera asincrónica `src` a `dest`. By default, `dest` is overwritten if it already exists. No arguments other than a possible exception are given to the callback function. Node.js makes no guarantees about the atomicity of the copy operation. If an error occurs after the destination file has been opened for writing, Node.js will attempt to remove the destination.

`flags` is an optional integer that specifies the behavior of the copy operation. It is possible to create a mask consisting of the bitwise OR of two or more values (e.g. `fs.constants.COPYFILE_EXCL | fs.constants.COPYFILE_FICLONE`).

* `fs.constants.COPYFILE_EXCL`: The copy operation will fail if `dest` already exists.
* `fs.constants.COPYFILE_FICLONE`: The copy operation will attempt to create a copy-on-write reflink. If the platform does not support copy-on-write, then a fallback copy mechanism is used.
* `fs.constants.COPYFILE_FICLONE_FORCE`: The copy operation will attempt to create a copy-on-write reflink. If the platform does not support copy-on-write, then the operation will fail.

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

## `fs.copyFileSync(src, dest[, flags])`
<!-- YAML
added: v8.5.0
-->

* `src` {string|Buffer|URL} nombre de archivo de la fuente a copiar
* `dest` {string|Buffer|URL} nombre de archivo de destino de la operación de copia
* `flags` {number} modificadores para la operación de copia. **Default:** `0`.

Copia de manera sincrónica `src` a `dest`. By default, `dest` is overwritten if it already exists. Devuelve `undefined`. Node.js makes no guarantees about the atomicity of the copy operation. If an error occurs after the destination file has been opened for writing, Node.js will attempt to remove the destination.

`flags` is an optional integer that specifies the behavior of the copy operation. It is possible to create a mask consisting of the bitwise OR of two or more values (e.g. `fs.constants.COPYFILE_EXCL | fs.constants.COPYFILE_FICLONE`).

* `fs.constants.COPYFILE_EXCL`: The copy operation will fail if `dest` already exists.
* `fs.constants.COPYFILE_FICLONE`: The copy operation will attempt to create a copy-on-write reflink. If the platform does not support copy-on-write, then a fallback copy mechanism is used.
* `fs.constants.COPYFILE_FICLONE_FORCE`: The copy operation will attempt to create a copy-on-write reflink. If the platform does not support copy-on-write, then the operation will fail.

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

## `fs.createReadStream(path[, options])`
<!-- YAML
added: v0.1.31
changes:
  - version: v12.10.0
    pr-url: https://github.com/nodejs/node/pull/29212
    description: Enable `emitClose` option.
  - version: v11.0.0
    pr-url: https://github.com/nodejs/node/pull/19898
    description: Impose new restrictions on `start` and `end`, throwing
                 more appropriate errors in cases when we cannot reasonably
                 handle the input values.
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
  - version: v13.6.0
    pr-url: https://github.com/nodejs/node/pull/29083
    description: The `fs` options allow overriding the used `fs`
                 implementation.
-->

* `path`{string|Buffer|URL}
* `options` {string|Object}
  * `flags` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Default:** `'r'`.
  * `encoding` {string} **Default:** `null`
  * `fd` {integer} **Default:** `null`
  * `mode` {integer} **Default:** `0o666`
  * `autoClose` {boolean} **Default:** `true`
  * `emitClose` {boolean} **Default:** `false`
  * `start` {integer}
  * `end` {integer} **Default:** `Infinity`
  * `highWaterMark` {integer} **Default:** `64 * 1024`
  * `fs` {Object|null} **Default:** `null`
* Returns: {fs.ReadStream} See [Readable Stream](#stream_class_stream_readable).

Unlike the 16 kb default `highWaterMark` for a readable stream, the stream returned by this method has a default `highWaterMark` of 64 kb.

`options` puede incluir valores de `start` y `end` para leer un rango de bytes desde el archivo, en lugar de todo el archivo. Both `start` and `end` are inclusive and start counting at 0, allowed values are in the [0, [`Number.MAX_SAFE_INTEGER`][]] range. If `fd` is specified and `start` is omitted or `undefined`, `fs.createReadStream()` reads sequentially from the current file position. The `encoding` can be any one of those accepted by [`Buffer`][].

Si se especifica `fd`, `ReadStream` ignorará el argumento `path` y usará el descriptor de archivo especificado. Esto significa que no se emitirán eventos `'open'` . `fd` should be blocking; non-blocking `fd`s should be passed to [`net.Socket`][].

If `fd` points to a character device that only supports blocking reads (such as keyboard or sound card), read operations do not finish until data is available. This can prevent the process from exiting and the stream from closing naturally.

By default, the stream will not emit a `'close'` event after it has been destroyed. This is the opposite of the default for other `Readable` streams. Set the `emitClose` option to `true` to change this behavior.

By providing the `fs` option it is possible to override the corresponding `fs` implementations for `open`, `read` and `close`. When providing the `fs` option, you must override `open`, `close` and `read`.

```js
const fs = require('fs');
// Create a stream from some character device.
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

Si `autoClose` es falso, entonces el descriptor de archivo no se cerrará, incluso si ocurre un error. It is the application's responsibility to close it and make sure there's no file descriptor leak. If `autoClose` is set to true (default behavior), on `'error'` or `'end'` the file descriptor will be closed automatically.

`mode` establece el modo de archivo (el permiso y los sticky bits), pero solo si el archivo fue creado.

Un ejemplo para leer los últimos 10 bytes de un archivo que tiene 100 bytes de longitud:

```js
fs.createReadStream('sample.txt', { start: 90, end: 99 });
```

Si `options` es una string, entonces especifica la codificación.

## `fs.createWriteStream(path[, options])`
<!-- YAML
added: v0.1.31
changes:
  - version: v12.10.0
    pr-url: https://github.com/nodejs/node/pull/29212
    description: Enable `emitClose` option.
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
  - version: v13.6.0
    pr-url: https://github.com/nodejs/node/pull/29083
    description: The `fs` options allow overriding the used `fs`
                 implementation.
-->

* `path`{string|Buffer|URL}
* `options` {string|Object}
  * `flags` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Default:** `'w'`.
  * `encoding` {string} **Default:** `'utf8'`
  * `fd` {integer} **Default:** `null`
  * `mode` {integer} **Default:** `0o666`
  * `autoClose` {boolean} **Default:** `true`
  * `emitClose` {boolean} **Default:** `false`
  * `start` {integer}
  * `fs` {Object|null} **Default:** `null`
* Devuelve: {fs.WriteStream} Vea [Stream Editable](stream.html#stream_class_stream_writable).

`options` may also include a `start` option to allow writing data at some position past the beginning of the file, allowed values are in the [0, [`Number.MAX_SAFE_INTEGER`][]] range. Modificar un archivo en vez de reemplazarlo puede que requiera un modo de `flags` de `r+` en vez del modo predeterminado `w`. The `encoding` can be any one of those accepted by [`Buffer`][].

If `autoClose` is set to true (default behavior) on `'error'` or `'finish'` the file descriptor will be closed automatically. Si `autoClose` es false, entonces el descriptor de archivos no se cerrará, incluso si hay un error. It is the application's responsibility to close it and make sure there's no file descriptor leak.

By default, the stream will not emit a `'close'` event after it has been destroyed. This is the opposite of the default for other `Writable` streams. Set the `emitClose` option to `true` to change this behavior.

By providing the `fs` option it is possible to override the corresponding `fs` implementations for `open`, `write`, `writev` and `close`. Overriding `write()` without `writev()` can reduce performance as some optimizations (`_writev()`) will be disabled. When providing the `fs` option, you must override `open`, `close` and at least one of `write` and `writev`.

Like [`ReadStream`][], if `fd` is specified, [`WriteStream`][] will ignore the `path` argument and will use the specified file descriptor. Esto significa que no se emitirán eventos `'open'` . `fd` should be blocking; non-blocking `fd`s should be passed to [`net.Socket`][].

Si `options` es una string, entonces especifica la codificación.

## `fs.exists(path, callback)`
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

* `path`{string|Buffer|URL}
* `callback` {Function}
  * `exists` {boolean}

Prueba si la ruta dada existe o no, verificándolo mediante el sistema de archivos. Then call the `callback` argument with either true or false:

```js
fs.exists('/etc/passwd', (exists) => {
  console.log(exists ? 'it\'s there' : 'no passwd!');
});
```

**The parameters for this callback are not consistent with other Node.js callbacks.** Normally, the first parameter to a Node.js callback is an `err` parameter, optionally followed by other parameters. The `fs.exists()` callback has only one boolean parameter. This is one reason `fs.access()` is recommended instead of `fs.exists()`.

Utilizar `fs.exists()` para verificar la existencia de un archivo antes de llamar a `fs.open()`, `fs.readFile()` o `fs.writeFile()` no es recomendado. Hacer esto introduce una condición de carrera, ya que otros procesos pueden cambiar el estado del archivo entre las dos llamadas. En lugar de ello, el código de usuario debería abrir/leer/escribir el archivo directamente y manejar el error ocurrido si el archivo no existe.

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

**leer (NO RECOMENDADO)**

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

En general, verifique la existencia de un archivo solo si el archivo no será utilizado directamente, por ejemplo, cuando su existencia sea una señal de otro proceso.

## `fs.existsSync(path)`
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
-->

* `path`{string|Buffer|URL}
* Devuelve: {boolean}

Devuelve `true` si la ruta existe, de lo contrario `false` .

For detailed information, see the documentation of the asynchronous version of this API: [`fs.exists()`][].

`fs.exists()` is deprecated, but `fs.existsSync()` is not. The `callback` parameter to `fs.exists()` accepts parameters that are inconsistent with other Node.js callbacks. `fs.existsSync()` does not use a callback.

```js
if (fs.existsSync('/etc/passwd')) {
  console.log('The path exists.');
}
```

## `fs.fchmod(fd, mode, callback)`
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
* `mode` {string|integer}
* `callback` {Function}
  * `err` {Error}

fchmod(2) asincrónico. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

## `fs.fchmodSync(fd, mode)`
<!-- YAML
added: v0.4.7
-->

* `fd`{integer}
* `mode` {string|integer}

fchmod(2) sincrónico. Devuelve `undefined`.

## `fs.fchown(fd, uid, gid, callback)`
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

## `fs.fchownSync(fd, uid, gid)`
<!-- YAML
added: v0.4.7
-->

* `fd`{integer}
* `uid`{integer}
* `gid`{integer}

fchown(2) sincrónico. Devuelve `undefined`.

## `fs.fdatasync(fd, callback)`
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

## `fs.fdatasyncSync(fd)`
<!-- YAML
added: v0.1.96
-->

* `fd`{integer}

fdatasync(2) sincrónico. Devuelve `undefined`.

## `fs.fstat(fd[, options], callback)`
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
* `options` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **Default:** `false`.
* `callback` {Function}
  * `err` {Error}
  * `stats` {fs.Stats}

fstat(2) asincrónico. El callback obtiene dos argumentos `(err, stats)`, en donde `stats` es un objeto de [`fs.Stats`][]. `fstat()` es idéntico a [`stat()`][], excepto que el archivo que será añadido a las estadísticas se especifica por el descriptor de archivo `fd`.

## `fs.fstatSync(fd[, options])`
<!-- YAML
added: v0.1.95
changes:
  - version: v10.5.0
    pr-url: https://github.com/nodejs/node/pull/20220
    description: Accepts an additional `options` object to specify whether
                 the numeric values returned should be bigint.
-->

* `fd`{integer}
* `options` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **Default:** `false`.
* Devuelve: {fs.Stats}

stat(2) sincrónico.

## `fs.fsync(fd, callback)`
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

## `fs.fsyncSync(fd)`
<!-- YAML
added: v0.1.96
-->

* `fd`{integer}

fsync(2) sincrónico. Devuelve `undefined`.

## `fs.ftruncate(fd[, len], callback)`
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
* `len` {integer} **Default:** `0`
* `callback` {Function}
  * `err` {Error}

ftruncate(2) asincrónico. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

Si el archivo referido por el descriptor de archivos fuese más grande que los bytes `len`, solo los primeros bytes `len` serán retenidos en el archivo.

For example, the following program retains only the first four bytes of the file:

```js
console.log(fs.readFileSync('temp.txt', 'utf8'));
// Prints: Node.js

// get the file descriptor of the file to be truncated
const fd = fs.openSync('temp.txt', 'r+');

// Truncate the file to first four bytes
fs.ftruncate(fd, 4, (err) => {
  assert.ifError(err);
  console.log(fs.readFileSync('temp.txt', 'utf8'));
});
// Prints: Node
```

If the file previously was shorter than `len` bytes, it is extended, and the extended part is filled with null bytes (`'\0'`):

```js
console.log(fs.readFileSync('temp.txt', 'utf8'));
// Prints: Node.js

// get the file descriptor of the file to be truncated
const fd = fs.openSync('temp.txt', 'r+');

// Truncate the file to 10 bytes, whereas the actual size is 7 bytes
fs.ftruncate(fd, 10, (err) => {
  assert.ifError(err);
  console.log(fs.readFileSync('temp.txt'));
});
// Prints: <Buffer 4e 6f 64 65 2e 6a 73 00 00 00>
// ('Node.js\0\0\0' in UTF8)
```

The last three bytes are null bytes (`'\0'`), to compensate the over-truncation.

## `fs.ftruncateSync(fd[, len])`
<!-- YAML
added: v0.8.6
-->

* `fd`{integer}
* `len` {integer} **Default:** `0`

Devuelve `undefined`.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.ftruncate()`][].

## `fs.futimes(fd, atime, mtime, callback)`
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

Change the file system timestamps of the object referenced by the supplied file descriptor. Vea [`fs.utimes()`][].

This function does not work on AIX versions before 7.1, it will return the error `UV_ENOSYS`.

## `fs.futimesSync(fd, atime, mtime)`
<!-- YAML
added: v0.4.2
changes:
  - version: v4.1.0
    pr-url: https://github.com/nodejs/node/pull/2387
    description: Numeric strings, `NaN` and `Infinity` are now allowed
                 time specifiers.
-->

* `fd`{integer}
* `atime` {number|string|Date}
* `mtime` {number|string|Date}

Versión sincrónica de [`fs.futimes()`][]. Devuelve `undefined`.

## `fs.lchmod(path, mode, callback)`
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

* `path`{string|Buffer|URL}
* `mode`{integer}
* `callback` {Function}
  * `err` {Error}

lchmod(2) asincrónico. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

Solo disponible en macOS.

## `fs.lchmodSync(path, mode)`
<!-- YAML
deprecated: v0.4.7
-->

* `path`{string|Buffer|URL}
* `mode`{integer}

lchmod(2) sincrónico. Devuelve `undefined`.

## `fs.lchown(path, uid, gid, callback)`
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

* `path`{string|Buffer|URL}
* `uid`{integer}
* `gid`{integer}
* `callback` {Function}
  * `err` {Error}

lchown(2) asincrónico. Ningún otro argumento que no sea una posible excepción es dado al callback de terminación.

## `fs.lchownSync(path, uid, gid)`
<!-- YAML
changes:
  - version: v10.6.0
    pr-url: https://github.com/nodejs/node/pull/21498
    description: This API is no longer deprecated.
-->

* `path`{string|Buffer|URL}
* `uid`{integer}
* `gid`{integer}

lchown(2) sincrónico. Devuelve `undefined`.

## `fs.link(existingPath, newPath, callback)`
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

## `fs.linkSync(existingPath, newPath)`
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

## `fs.lstat(path[, options], callback)`
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

* `path`{string|Buffer|URL}
* `options` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **Default:** `false`.
* `callback` {Function}
  * `err` {Error}
  * `stats` {fs.Stats}

lstat(2) asincrónico. El callback obtiene dos argumentos `(err, stats)`, en donde `stats` es un objeto de [`fs.Stats`][]. `lstat()` es idéntico a `stat()`, salvo en caso de que `path` sea un enlace simbólico, entonces el mismo enlace sería parte de las estadísticas, no el archivo al que se refiere.

## `fs.lstatSync(path[, options])`
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

* `path`{string|Buffer|URL}
* `options` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **Default:** `false`.
* Devuelve: {fs.Stats}

lstat(2) sincrónico.

## `fs.mkdir(path[, options], callback)`
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

* `path`{string|Buffer|URL}
* `options` {Object|integer}
  * `recursive` {boolean} **Default:** `false`
  * `mode` {string|integer} Not supported on Windows. **Default:** `0o777`.
* `callback` {Function}
  * `err` {Error}

Crea un directorio de manera asincrónica. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

The optional `options` argument can be an integer specifying mode (permission and sticky bits), or an object with a `mode` property and a `recursive` property indicating whether parent folders should be created. Calling `fs.mkdir()` when `path` is a directory that exists results in an error only when `recursive` is false.

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

See also: mkdir(2).

## `fs.mkdirSync(path[, options])`
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

* `path`{string|Buffer|URL}
* `options` {Object|integer}
  * `recursive` {boolean} **Default:** `false`
  * `mode` {string|integer} Not supported on Windows. **Default:** `0o777`.

Crea un directorio de manera sincrónica. Devuelve `undefined`. Esta es la versión sincrónica de [`fs.mkdir()`][].

See also: mkdir(2).

## `fs.mkdtemp(prefix[, options], callback)`
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
* `options` {string|Object}
  * `encoding` {string} **Default:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `folder` {string}

Crea un único directorio temporal.

Genera seis caracteres aleatorios para ser anexados detrás de un `prefix` requerido para crear un directorio temporal único. Due to platform inconsistencies, avoid trailing `X` characters in `prefix`. Some platforms, notably the BSDs, can return more than six random characters, and replace trailing `X` characters in `prefix` with random characters.

La ruta de archivo creada se pasa como una string al segundo parámetro del callback.

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar.

```js
fs.mkdtemp(path.join(os.tmpdir(), 'foo-'), (err, folder) => {
  if (err) throw err;
  console.log(folder);
  // Prints: /tmp/foo-itXde2 or C:\Users\...\AppData\Local\Temp\foo-itXde2
});
```

The `fs.mkdtemp()` method will append the six randomly selected characters directly to the `prefix` string. For instance, given a directory `/tmp`, if the intention is to create a temporary directory *within* `/tmp`, the `prefix` must end with a trailing platform-specific path separator (`require('path').sep`).

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

## `fs.mkdtempSync(prefix[, options])`
<!-- YAML
added: v5.10.0
-->

* `prefix` {string}
* `options` {string|Object}
  * `encoding` {string} **Default:** `'utf8'`
* Devuelve: {string}

Returns the created folder path.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.mkdtemp()`][].

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar.

## `fs.open(path[, flags[, mode]], callback)`
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

* `path`{string|Buffer|URL}
* `flags` {string|number} Vea [soporte de las `flags` del sistema de archivos][]. **Default:** `'r'`.
* `mode` {string|integer} **Default:** `0o666` (readable and writable)
* `callback` {Function}
  * `err` {Error}
  * `fd`{integer}

Apertura de archivo asincrónica. Vea open(2).

`mode` establece el modo de archivo (el permiso y los sticky bits), pero solo si el archivo fue creado. On Windows, only the write permission can be manipulated; see [`fs.chmod()`][].

El callback obtiene dos argumentos `(err, fd)`.

Algunos caracteres (`< > : " / \ | ? *`) are reserved under Windows as documented by [Naming Files, Paths, and Namespaces](https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file). Under NTFS, if the filename contains a colon, Node.js will open a file system stream, as described by [this MSDN page](https://docs.microsoft.com/en-us/windows/desktop/FileIO/using-streams).

Functions based on `fs.open()` exhibit this behavior as well: `fs.writeFile()`, `fs.readFile()`, etc.

## `fs.opendir(path[, options], callback)`
<!-- YAML
added: v12.12.0
changes:
  - version: v13.1.0
    pr-url: https://github.com/nodejs/node/pull/30114
    description: The `bufferSize` option was introduced.
-->

* `path`{string|Buffer|URL}
* `options` {Object}
  * `encoding` {string|null} **Default:** `'utf8'`
  * `bufferSize` {number} Number of directory entries that are buffered internally when reading from the directory. Higher values lead to better performance but higher memory usage. **Default:** `32`
* `callback` {Function}
  * `err` {Error}
  * `dir` {fs.Dir}

Asynchronously open a directory. See opendir(3).

Creates an [`fs.Dir`][], which contains all further functions for reading from and cleaning up the directory.

The `encoding` option sets the encoding for the `path` while opening the directory and subsequent read operations.

## `fs.opendirSync(path[, options])`
<!-- YAML
added: v12.12.0
changes:
  - version: v13.1.0
    pr-url: https://github.com/nodejs/node/pull/30114
    description: The `bufferSize` option was introduced.
-->

* `path`{string|Buffer|URL}
* `options` {Object}
  * `encoding` {string|null} **Default:** `'utf8'`
  * `bufferSize` {number} Number of directory entries that are buffered internally when reading from the directory. Higher values lead to better performance but higher memory usage. **Default:** `32`
* Returns: {fs.Dir}

Synchronously open a directory. See opendir(3).

Creates an [`fs.Dir`][], which contains all further functions for reading from and cleaning up the directory.

The `encoding` option sets the encoding for the `path` while opening the directory and subsequent read operations.

## `fs.openSync(path[, flags, mode])`
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

* `path`{string|Buffer|URL}
* `flags` {string|number} **Default:** `'r'`. See [support of file system `flags`][].
* `mode` {string|integer} **Default:** `0o666`
* Devuelve: {number}

Returns an integer representing the file descriptor.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.open()`][].

## `fs.read(fd, buffer, offset, length, position, callback)`
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

If this method is invoked as its [`util.promisify()`][]ed version, it returns a `Promise` for an `Object` with `bytesRead` and `buffer` properties.

## `fs.readdir(path[, options], callback)`
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

* `path`{string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} **Default:** `'utf8'`
  * `withFileTypes` {boolean} **Default:** `false`
* `callback` {Function}
  * `err` {Error}
  * `files` {string[]|Buffer[]|fs.Dirent[]}

readdir(3) asincrónico. Lee los contenidos de un directorio. El callback obtiene dos argumentos `(err, files)` donde `files` es una matriz de los nombres de los archivos en el directorio, excluyendo `'.'` y `'..'`.

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar para los nombres de archivo pasados al callback. Si el `encoding` se establece a `'buffer'`, los nombres de archivo devueltos serán pasados como objetos de `Buffer` .

If `options.withFileTypes` is set to `true`, the `files` array will contain [`fs.Dirent`][] objects.

## `fs.readdirSync(path[, options])`
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

* `path`{string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} **Default:** `'utf8'`
  * `withFileTypes` {boolean} **Default:** `false`
* Returns: {string[]|Buffer[]|fs.Dirent[]}

readdir(3) sincrónico.

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use for the filenames returned. Si el `encoding` se establece a `'buffer'`, los nombres de archivo devueltos serán pasados como objetos de `Buffer` .

If `options.withFileTypes` is set to `true`, the result will contain [`fs.Dirent`][] objects.

## `fs.readFile(path[, options], callback)`
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
* `options` {Object|string}
  * `encoding` {string|null} **Default:** `null`
  * `flag` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Default:** `'r'`.
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

Al callback se le pasan dos argumentos `(err, data)`, donde `data` son los contenidos del archivo.

Si no se especifica ninguna codificación, entonces el búfer crudo será devuelto.

If `options` is a string, then it specifies the encoding:

```js
fs.readFile('/etc/passwd', 'utf8', callback);
```

When the path is a directory, the behavior of `fs.readFile()` and [`fs.readFileSync()`][] is platform-specific. On macOS, Linux, and Windows, an error will be returned. On FreeBSD, a representation of the directory's contents will be returned.

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

The `fs.readFile()` function buffers the entire file. To minimize memory costs, when possible prefer streaming via `fs.createReadStream()`.

### Descriptores de archivo

1. Cualquier descriptor de archivos especificado tiene que soportar la lectura.
2. If a file descriptor is specified as the `path`, it will not be closed automatically.
3. The reading will begin at the current position. For example, if the file already had `'Hello World`' and six bytes are read with the file descriptor, the call to `fs.readFile()` with the same file descriptor, would give `'World'`, rather than `'Hello World'`.

## `fs.readFileSync(path[, options])`
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
* `options` {Object|string}
  * `encoding` {string|null} **Default:** `null`
  * `flag` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Default:** `'r'`.
* Devuelve: {string|Buffer}

Devuelve los contenidos del `path`.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.readFile()`][].

Si la opción de `encoding` es especificada, entonces esta función devolverá una string. De lo contrario, devuelve un búfer.

Similar to [`fs.readFile()`][], when the path is a directory, the behavior of `fs.readFileSync()` is platform-specific.

```js
// macOS, Linux, and Windows
fs.readFileSync('<directory>');
// => [Error: EISDIR: illegal operation on a directory, read <directory>]

//  FreeBSD
fs.readFileSync('<directory>'); // => <data>
```

## `fs.readlink(path[, options], callback)`
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

* `path`{string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} **Default:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `linkString` {string|Buffer}

readlink(2) asincrónico. El callback obtiene dos argumentos `(err,
linkString)`.

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar para la ruta de enlace pasada al callback. Si el `encoding` se establece a `'buffer'`, la ruta de enlace devuelta será pasada como un objeto de `Buffer` .

## `fs.readlinkSync(path[, options])`
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path`{string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} **Default:** `'utf8'`
* Devuelve: {string|Buffer}

readlink(2) sincrónico. Devuelve el valor de la string del enlace simbólico.

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use for the link path returned. Si el `encoding` se establece a `'buffer'`, la ruta de enlace devuelta será pasada como un objeto de `Buffer` .

## `fs.readSync(fd, buffer, offset, length, position)`
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

## `fs.realpath(path[, options], callback)`
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

* `path`{string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} **Default:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `resolvedPath` {string|Buffer}

Asynchronously computes the canonical pathname by resolving `.`, `..` and symbolic links.

A canonical pathname is not necessarily unique. Hard links and bind mounts can expose a file system entity through many pathnames.

This function behaves like realpath(3), with some exceptions:

1. No case conversion is performed on case-insensitive file systems.

2. The maximum number of symbolic links is platform-independent and generally (much) higher than what the native realpath(3) implementation supports.

The `callback` gets two arguments `(err, resolvedPath)`. May use `process.cwd` to resolve relative paths.

Solo son soportadas las rutas que pueden ser convertidas a strings UTF8.

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar para la ruta pasada al callback. Si el `encoding` se establece a `'buffer'`, la ruta devuelta será pasada como un objeto de `Buffer`.

If `path` resolves to a socket or a pipe, the function will return a system dependent name for that object.

## `fs.realpath.native(path[, options], callback)`
<!-- YAML
added: v9.2.0
-->

* `path`{string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} **Default:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `resolvedPath` {string|Buffer}

realpath(3) asincrónico.

The `callback` gets two arguments `(err, resolvedPath)`.

Solo son soportadas las rutas que pueden ser convertidas a strings UTF8.

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar para la ruta pasada al callback. Si el `encoding` se establece a `'buffer'`, la ruta devuelta será pasada como un objeto de `Buffer`.

On Linux, when Node.js is linked against musl libc, the procfs file system must be mounted on `/proc` in order for this function to work. Glibc does not have this restriction.

## `fs.realpathSync(path[, options])`
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

* `path`{string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} **Default:** `'utf8'`
* Devuelve: {string|Buffer}

Returns the resolved pathname.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.realpath()`][].

## `fs.realpathSync.native(path[, options])`
<!-- YAML
added: v9.2.0
-->

* `path`{string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} **Default:** `'utf8'`
* Devuelve: {string|Buffer}

realpath(3) sincrónico.

Solo son soportadas las rutas que pueden ser convertidas a strings UTF8.

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use for the path returned. Si el `encoding` se establece a `'buffer'`, la ruta devuelta será pasada como un objeto de `Buffer`.

On Linux, when Node.js is linked against musl libc, the procfs file system must be mounted on `/proc` in order for this function to work. Glibc does not have this restriction.

## `fs.rename(oldPath, newPath, callback)`
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

Asynchronously rename file at `oldPath` to the pathname provided as `newPath`. In the case that `newPath` already exists, it will be overwritten. If there is a directory at `newPath`, an error will be raised instead. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

Vea también: rename(2).

```js
fs.rename('oldFile.txt', 'newFile.txt', (err) => {
  if (err) throw err;
  console.log('Rename complete!');
});
```

## `fs.renameSync(oldPath, newPath)`
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

## `fs.rmdir(path[, options], callback)`
<!-- YAML
added: v0.0.2
changes:
  - version: v13.3.0
    pr-url: https://github.com/nodejs/node/pull/30644
    description: The `maxBusyTries` option is renamed to `maxRetries`, and its
                 default is 0. The `emfileWait` option has been removed, and
                 `EMFILE` errors use the same retry logic as other errors. The
                 `retryDelay` option is now supported. `ENFILE` errors are now
                 retried.
  - version: v12.10.0
    pr-url: https://github.com/nodejs/node/pull/29168
    description: The `recursive`, `maxBusyTries`, and `emfileWait` options are
                 now supported.
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

> Stability: 1 - Recursive removal is experimental.

* `path`{string|Buffer|URL}
* `options` {Object}
  * `maxRetries` {integer} If an `EBUSY`, `EMFILE`, `ENFILE`, `ENOTEMPTY`, or `EPERM` error is encountered, Node.js will retry the operation with a linear backoff wait of `retryDelay` ms longer on each try. This option represents the number of retries. This option is ignored if the `recursive` option is not `true`. **Default:** `0`.
  * `recursive` {boolean} If `true`, perform a recursive directory removal. In recursive mode, errors are not reported if `path` does not exist, and operations are retried on failure. **Default:** `false`.
  * `retryDelay` {integer} The amount of time in milliseconds to wait between retries. This option is ignored if the `recursive` option is not `true`. **Default:** `100`.
* `callback` {Function}
  * `err` {Error}

rmdir(2) asincrónico. Ningún otro argumento que no sea una posible excepción es dado al callback de terminación.

Using `fs.rmdir()` on a file (not a directory) results in an `ENOENT` error on Windows and an `ENOTDIR` error on POSIX.

## `fs.rmdirSync(path[, options])`
<!-- YAML
added: v0.1.21
changes:
  - version: v13.3.0
    pr-url: https://github.com/nodejs/node/pull/30644
    description: The `maxBusyTries` option is renamed to `maxRetries`, and its
                 default is 0. The `emfileWait` option has been removed, and
                 `EMFILE` errors use the same retry logic as other errors. The
                 `retryDelay` option is now supported. `ENFILE` errors are now
                 retried.
  - version: v12.10.0
    pr-url: https://github.com/nodejs/node/pull/29168
    description: The `recursive`, `maxBusyTries`, and `emfileWait` options are
                 now supported.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameters can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
-->

> Stability: 1 - Recursive removal is experimental.

* `path`{string|Buffer|URL}
* `options` {Object}
  * `maxRetries` {integer} If an `EBUSY`, `EMFILE`, `ENFILE`, `ENOTEMPTY`, or `EPERM` error is encountered, Node.js will retry the operation with a linear backoff wait of `retryDelay` ms longer on each try. This option represents the number of retries. This option is ignored if the `recursive` option is not `true`. **Default:** `0`.
  * `recursive` {boolean} If `true`, perform a recursive directory removal. In recursive mode, errors are not reported if `path` does not exist, and operations are retried on failure. **Default:** `false`.
  * `retryDelay` {integer} The amount of time in milliseconds to wait between retries. This option is ignored if the `recursive` option is not `true`. **Default:** `100`.

rmdir(2) sincrónico. Devuelve `undefined`.

Using `fs.rmdirSync()` on a file (not a directory) results in an `ENOENT` error on Windows and an `ENOTDIR` error on POSIX.

## `fs.stat(path[, options], callback)`
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

* `path`{string|Buffer|URL}
* `options` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **Default:** `false`.
* `callback` {Function}
  * `err` {Error}
  * `stats` {fs.Stats}

stat(2) asincrónico. El callback obtiene dos argumentos `(err, stats)`, en donde `stats` es un objeto de [`fs.Stats`][].

En caso de que ocurra un error, el `err.code` será uno de los [Errores de Sistema Comunes](errors.html#errors_common_system_errors).

Utilizar `fs.stat()` para verificar la existencia de un archivo antes de llamar a `fs.open()`, `fs.readFile()` o `fs.writeFile()` no es recomendado. En lugar de ello, el código de usuario debería abrir/leer/escribir el archivo directamente y manejar el error ocurrido si el archivo no está disponible.

To check if a file exists without manipulating it afterwards, [`fs.access()`][] is recommended.

For example, given the following folder structure:

```fundamental
- txtDir
-- file.txt
- app.js
```

The next program will check for the stats of the given paths:

```js
const fs = require('fs');

const pathsToCheck = ['./txtDir', './txtDir/file.txt'];

for (let i = 0; i < pathsToCheck.length; i++) {
  fs.stat(pathsToCheck[i], function(err, stats) {
    console.log(stats.isDirectory());
    console.log(stats);
  });
}
```

The resulting output will resemble:

```console
true
Stats {
  dev: 16777220,
  mode: 16877,
  nlink: 3,
  uid: 501,
  gid: 20,
  rdev: 0,
  blksize: 4096,
  ino: 14214262,
  size: 96,
  blocks: 0,
  atimeMs: 1561174653071.963,
  mtimeMs: 1561174614583.3518,
  ctimeMs: 1561174626623.5366,
  birthtimeMs: 1561174126937.2893,
  atime: 2019-06-22T03:37:33.072Z,
  mtime: 2019-06-22T03:36:54.583Z,
  ctime: 2019-06-22T03:37:06.624Z,
  birthtime: 2019-06-22T03:28:46.937Z
}
false
Stats {
  dev: 16777220,
  mode: 33188,
  nlink: 1,
  uid: 501,
  gid: 20,
  rdev: 0,
  blksize: 4096,
  ino: 14214074,
  size: 8,
  blocks: 8,
  atimeMs: 1561174616618.8555,
  mtimeMs: 1561174614584,
  ctimeMs: 1561174614583.8145,
  birthtimeMs: 1561174007710.7478,
  atime: 2019-06-22T03:36:56.619Z,
  mtime: 2019-06-22T03:36:54.584Z,
  ctime: 2019-06-22T03:36:54.584Z,
  birthtime: 2019-06-22T03:26:47.711Z
}
```

## `fs.statSync(path[, options])`
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

* `path`{string|Buffer|URL}
* `options` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **Default:** `false`.
* Devuelve: {fs.Stats}

stat(2) sincrónico.

## `fs.symlink(target, path[, type], callback)`
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `target` and `path` parameters can be WHATWG `URL` objects
                 using `file:` protocol. Support is currently still
                 *experimental*.
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/23724
    description: If the `type` argument is left undefined, Node will autodetect
                 `target` type and automatically select `dir` or `file`
-->

* `target` {string|Buffer|URL}
* `path`{string|Buffer|URL}
* `type` {string}
* `callback` {Function}
  * `err` {Error}

Asynchronous symlink(2) which creates the link called `path` pointing to `target`.  No arguments other than a possible exception are given to the completion callback.

The `type` argument is only available on Windows and ignored on other platforms. It can be set to `'dir'`, `'file'`, or `'junction'`. If the `type` argument is not set, Node.js will autodetect `target` type and use `'file'` or `'dir'`. If the `target` does not exist, `'file'` will be used. Windows junction points require the destination path to be absolute.  When using `'junction'`, the `target` argument will automatically be normalized to absolute path.

Relative targets are relative to the link’s parent directory.

```js
fs.symlink('./mew', './example/mewtwo', callback);
```

The above example creates a symbolic link `mewtwo` in the `example` which points to `mew` in the same directory:

```bash
$ tree example/
example/
├── mew
└── mewtwo -> ./mew
```

## `fs.symlinkSync(target, path[, type])`
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `target` and `path` parameters can be WHATWG `URL` objects
                 using `file:` protocol. Support is currently still
                 *experimental*.
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/23724
    description: If the `type` argument is left undefined, Node will autodetect
                 `target` type and automatically select `dir` or `file`
-->

* `target` {string|Buffer|URL}
* `path`{string|Buffer|URL}
* `type` {string}

Devuelve `undefined`.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.symlink()`][].

## `fs.truncate(path[, len], callback)`
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

* `path`{string|Buffer|URL}
* `len` {integer} **Default:** `0`
* `callback` {Function}
  * `err` {Error}

truncate(2) asincrónico. Ningún argumento que no sea una posible excepción es dado al callback de terminación. Un descriptor de archivos también puede ser pasado como el primer argumento. En este caso, `fs.ftruncate()` es llamado.

Passing a file descriptor is deprecated and may result in an error being thrown in the future.

## `fs.truncateSync(path[, len])`
<!-- YAML
added: v0.8.6
-->

* `path`{string|Buffer|URL}
* `len` {integer} **Default:** `0`

truncate(2) sincrónico. Devuelve `undefined`. Un descriptor de archivo también puede ser pasado como el primer argumento. En este caso, `fs.ftruncateSync()` es llamado.

Passing a file descriptor is deprecated and may result in an error being thrown in the future.

## `fs.unlink(path, callback)`
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

* `path`{string|Buffer|URL}
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

`fs.unlink()` no funcionará en un directorio, vacío o no. To remove a directory, use [`fs.rmdir()`][].

See also: unlink(2).

## `fs.unlinkSync(path)`
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path`{string|Buffer|URL}

unlink(2) sincrónico. Devuelve `undefined`.

## `fs.unwatchFile(filename[, listener])`
<!-- YAML
added: v0.1.31
-->

* `filename` {string|Buffer|URL}
* `listener` {Function} Optional, a listener previously attached using `fs.watchFile()`

Deja de buscar cambios en `filename`. Si se especifica `listener`, solo se eliminará ese listener en específico. Otherwise, *all* listeners are removed, effectively stopping watching of `filename`.

Llamar a `fs.unwatchFile()` con un nombre de archivo que no esté siendo observado es un no-op, no un error.

Using [`fs.watch()`][] is more efficient than `fs.watchFile()` and `fs.unwatchFile()`. `fs.watch()` should be used instead of `fs.watchFile()` and `fs.unwatchFile()` when possible.

## `fs.utimes(path, atime, mtime, callback)`
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

* `path`{string|Buffer|URL}
* `atime` {number|string|Date}
* `mtime` {number|string|Date}
* `callback` {Function}
  * `err` {Error}

Cambia las marcas de tiempo del sistema de archivos del objeto referenciado por `path`.

Los argumentos `atime` y `mtime` siguen las siguientes reglas:

* Values can be either numbers representing Unix epoch time, `Date`s, or a numeric string like `'123456789.0'`.
* If the value can not be converted to a number, or is `NaN`, `Infinity` or `-Infinity`, an `Error` will be thrown.

## `fs.utimesSync(path, atime, mtime)`
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

* `path`{string|Buffer|URL}
* `atime` {number|string|Date}
* `mtime` {number|string|Date}

Devuelve `undefined`.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.utimes()`][].

## `fs.watch(filename[, options][, listener])`
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
* `options` {string|Object}
  * `persistent` {boolean} Indica si el proceso debería continuar ejecutándose, siempre y cuando los archivos estén siendo observados. **Default:** `true`.
  * `recursive` {boolean} Indica si todos los sub-directorios deberían ser observados, o solamente el directorio actual. This applies when a directory is specified, and only on supported platforms (See [Caveats](#fs_caveats)). **Default:** `false`.
  * `encoding` {string} Especifica la codificación de caracteres que será utilizada para el nombre de archivo pasado al listener. **Default:** `'utf8'`.
* `listener` {Function|undefined} **Default:** `undefined`
  * `eventType` {string}
  * `filename` {string|Buffer}
* Devuelve: {fs.FSWatcher}

Busca cambios en `filename`, donde `filename` es o un archivo o un directorio.

El segundo argumento es opcional. Si se proporciona `options` como una string, esta especificará el `encoding`. De lo contrario, `options` debería ser pasado como un objeto.

El callback del listener recibe dos argumentos `(eventType, filename)`. `eventType` is either `'rename'` or `'change'`, and `filename` is the name of the file which triggered the event.

On most platforms, `'rename'` is emitted whenever a filename appears or disappears in the directory.

The listener callback is attached to the `'change'` event fired by [`fs.FSWatcher`][], but it is not the same thing as the `'change'` value of `eventType`.

### Advertencias

<!--type=misc-->

La API de `fs.watch` no es 100% consistente entre plataformas, y en algunas situaciones no está disponible.

La opción recursiva solo es soportada en macOS y Windows.

#### Disponibilidad

<!--type=misc-->

Esta función depende del sistema operativo subyacente, proporcionando una manera para estar notificado de los cambios del sistema de archivos.

* On Linux systems, this uses [`inotify(7)`][].
* On BSD systems, this uses [`kqueue(2)`][].
* On macOS, this uses [`kqueue(2)`][] for files and [`FSEvents`][] for directories.
* On SunOS systems (including Solaris and SmartOS), this uses [`event ports`][].
* On Windows systems, this feature depends on [`ReadDirectoryChangesW`][].
* On Aix systems, this feature depends on [`AHAFS`][], which must be enabled.

Si la funcionalidad subyacente no está disponible por algún motivo, entonces `fs.watch` no podrá funcionar. Por ejemplo, observar archivos o directorios puede no ser seguro, y en algunos casos imposible, en sistemas de archivos de red (NFS, SMB, etc), o sistemas de alojamiento de archivos cuando se utilizan softwares de virtualización tales como Vagrant, Docker, etc.

It is still possible to use `fs.watchFile()`, which uses stat polling, but this method is slower and less reliable.

#### Inodos

<!--type=misc-->

En Linux y sistemas de macOS, `fs.watch()` resuelve la ruta a un [inodo](https://en.wikipedia.org/wiki/Inode) y observa al inodo. Si la ruta observada es eliminada y recreada, se le asignará un nuevo inode. The watch will emit an event for the delete but will continue watching the *original* inode. No se emitirán eventos para el nuevo inode. Este comportamiento es esperado.

Los archivos AIX retienen el mismo inode durante el tiempo de vida de un archivo. Saving and closing a watched file on AIX will result in two notifications (one for adding new content, and one for truncation).

#### Argumento de Nombre de Archivo

<!--type=misc-->

Providing `filename` argument in the callback is only supported on Linux, macOS, Windows, and AIX. Even on supported platforms, `filename` is not always guaranteed to be provided. Therefore, don't assume that `filename` argument is always provided in the callback, and have some fallback logic if it is `null`.

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

## `fs.watchFile(filename[, options], listener)`
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `filename` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
-->

* `filename` {string|Buffer|URL}
* `options` {Object}
  * `persistent` {boolean} **Default:** `true`
  * `interval` {integer} **Default:** `5007`
* `listener` {Function}
  * `current` {fs.Stats}
  * `previous` {fs.Stats}

Buscar cambios en `filename`. El `listener` del callback será llamado cada vez que el archivo sea accedido.

El argumento de `options` puede ser omitido. Si se proporciona, debería ser un objeto. El objeto de `options` puede contener un booleano llamado `persistent` que indica si el proceso debería continuar ejecutándose, siempre y cuando los archivos estén siendo observados. El objeto de `options` puede especificar una propiedad de `interval` que indique qué tan seguido debería estudiarse el objetivo en milisegundos.

El `listener` obtiene dos argumentos, el objeto de estadística actual y el objeto de estadística previo:

```js
fs.watchFile('message.text', (curr, prev) => {
  console.log(`the current mtime is: ${curr.mtime}`);
  console.log(`the previous mtime was: ${prev.mtime}`);
});
```

Estos objetos de estadística son instancias de `fs.Stat`.

To be notified when the file was modified, not just accessed, it is necessary to compare `curr.mtime` and `prev.mtime`.

When an `fs.watchFile` operation results in an `ENOENT` error, it will invoke the listener once, with all the fields zeroed (or, for dates, the Unix Epoch). If the file is created later on, the listener will be called again, with the latest stat objects. This is a change in functionality since v0.10.

Using [`fs.watch()`][] is more efficient than `fs.watchFile` and `fs.unwatchFile`. `fs.watch` debería ser utilizado en lugar de `fs.watchFile` y `fs.unwatchFile` cuando sea posible.

When a file being watched by `fs.watchFile()` disappears and reappears, then the `previousStat` reported in the second callback event (the file's reappearance) will be the same as the `previousStat` of the first callback event (its disappearance).

Esto ocurre cuando:

* el archivo es eliminado, seguido de una restauración
* the file is renamed and then renamed a second time back to its original name

## `fs.write(fd, buffer[, offset[, length[, position]]], callback)`
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

Escriba `buffer` al archivo especificado por `fd`.

`offset` determina la parte del búfer que será escrita, y `length` es un entero que especifica el número de bytes a escribir.

`position` se refiere al offset del principio del archivo en donde deberían ser escritos estos datos. En caso de `typeof position !== 'number'`, los datos serán escritos en la posición actual. Vea pwrite(2).

The callback will be given three arguments `(err, bytesWritten, buffer)` where `bytesWritten` specifies how many _bytes_ were written from `buffer`.

If this method is invoked as its [`util.promisify()`][]ed version, it returns a `Promise` for an `Object` with `bytesWritten` and `buffer` properties.

It is unsafe to use `fs.write()` multiple times on the same file without waiting for the callback. For this scenario, [`fs.createWriteStream()`][] is recommended.

En Linux, las escrituras posicionales no funcionan cuando el archivo se abre en modo de anexo. El núcleo ignora el argumento de posición y siempre anexa los datos al final del archivo.

## `fs.write(fd, string[, position[, encoding]], callback)`
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
* `encoding` {string} **Default:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `written` {integer}
  * `string` {string}

Escribe `string` al archivo especificado por `fd`. Si `string` no es una string, entonces el valor será forzado a uno.

`position` se refiere al offset del principio del archivo en donde deberían ser escritos estos datos. En caso de `typeof position !== 'number'`, los datos serán escritos en la posición actual. Vea pwrite(2).

`encoding` es la codificación de strings esperada.

The callback will receive the arguments `(err, written, string)` where `written` specifies how many _bytes_ the passed string required to be written. Bytes written is not necessarily the same as string characters written. See [`Buffer.byteLength`][].

It is unsafe to use `fs.write()` multiple times on the same file without waiting for the callback. For this scenario, [`fs.createWriteStream()`][] is recommended.

En Linux, las escrituras posicionales no funcionan cuando el archivo se abre en modo de anexo. El núcleo ignora el argumento de posición y siempre anexa los datos al final del archivo.

On Windows, if the file descriptor is connected to the console (e.g. `fd == 1` or `stdout`) a string containing non-ASCII characters will not be rendered properly by default, regardless of the encoding used. It is possible to configure the console to render UTF-8 properly by changing the active codepage with the `chcp 65001` command. See the [chcp](https://ss64.com/nt/chcp.html) docs for more details.

## `fs.writeFile(file, data[, options], callback)`
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
* `options` {Object|string}
  * `encoding` {string|null} **Default:** `'utf8'`
  * `mode` {integer} **Default:** `0o666`
  * `flag` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Default:** `'w'`.
* `callback` {Function}
  * `err` {Error}

When `file` is a filename, asynchronously writes data to the file, replacing the file if it already exists.  `data` puede ser una string o un búfer.

When `file` is a file descriptor, the behavior is similar to calling `fs.write()` directly (which is recommended). See the notes below on using a file descriptor.

La opción de `encoding` se ignora si `data` es un búfer.

```js
const data = new Uint8Array(Buffer.from('Hello Node.js'));
fs.writeFile('message.txt', data, (err) => {
  if (err) throw err;
  console.log('The file has been saved!');
});
```

If `options` is a string, then it specifies the encoding:

```js
fs.writeFile('message.txt', 'Hello Node.js', 'utf8', callback);
```

It is unsafe to use `fs.writeFile()` multiple times on the same file without waiting for the callback. For this scenario, [`fs.createWriteStream()`][] is recommended.

### Using `fs.writeFile()` with File Descriptors

When `file` is a file descriptor, the behavior is almost identical to directly calling `fs.write()` like:

```javascript
fs.write(fd, Buffer.from(data, options.encoding), callback);
```

The difference from directly calling `fs.write()` is that under some unusual conditions, `fs.write()` may write only part of the buffer and will need to be retried to write the remaining data, whereas `fs.writeFile()` will retry until the data is entirely written (or an error occurs).

The implications of this are a common source of confusion. In the file descriptor case, the file is not replaced! The data is not necessarily written to the beginning of the file, and the file's original data may remain before and/or after the newly written data.

For example, if `fs.writeFile()` is called twice in a row, first to write the string `'Hello'`, then to write the string `', World'`, the file would contain `'Hello, World'`, and might contain some of the file's original data (depending on the size of the original file, and the position of the file descriptor).  If a file name had been used instead of a descriptor, the file would be guaranteed to contain only `', World'`.

## `fs.writeFileSync(file, data[, options])`
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
* `options` {Object|string}
  * `encoding` {string|null} **Default:** `'utf8'`
  * `mode` {integer} **Default:** `0o666`
  * `flag` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Default:** `'w'`.

Devuelve `undefined`.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.writeFile()`][].

## `fs.writeSync(fd, buffer[, offset[, length[, position]]])`
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

## `fs.writeSync(fd, string[, position[, encoding]])`
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

## `fs.writev(fd, buffers[, position], callback)`
<!-- YAML
added: v12.9.0
-->

* `fd`{integer}
* `buffers` {ArrayBufferView[]}
* `position` {integer}
* `callback` {Function}
  * `err` {Error}
  * `bytesWritten` {integer}
  * `buffers` {ArrayBufferView[]}

Write an array of `ArrayBufferView`s to the file specified by `fd` using `writev()`.

`position` is the offset from the beginning of the file where this data should be written. En caso de `typeof position !== 'number'`, los datos serán escritos en la posición actual.

The callback will be given three arguments: `err`, `bytesWritten`, and `buffers`. `bytesWritten` is how many bytes were written from `buffers`.

If this method is [`util.promisify()`][]ed, it returns a `Promise` for an `Object` with `bytesWritten` and `buffers` properties.

It is unsafe to use `fs.writev()` multiple times on the same file without waiting for the callback. For this scenario, use [`fs.createWriteStream()`][].

En Linux, las escrituras posicionales no funcionan cuando el archivo se abre en modo de anexo. El núcleo ignora el argumento de posición y siempre anexa los datos al final del archivo.

## `fs.writevSync(fd, buffers[, position])`
<!-- YAML
added: v12.9.0
-->

* `fd`{integer}
* `buffers` {ArrayBufferView[]}
* `position` {integer}
* Returns: {number} The number of bytes written.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.writev()`][].

## `fs` Promises API

The `fs.promises` API provides an alternative set of asynchronous file system methods that return `Promise` objects rather than using callbacks. The API is accessible via `require('fs').promises`.

### class: `FileHandle`
<!-- YAML
added: v10.0.0
-->

A `FileHandle` object is a wrapper for a numeric file descriptor. Instances of `FileHandle` are distinct from numeric file descriptors in that they provide an object oriented API for working with files.

If a `FileHandle` is not closed using the `filehandle.close()` method, it might automatically close the file descriptor and will emit a process warning, thereby helping to prevent memory leaks. Please do not rely on this behavior in your code because it is unreliable and your file may not be closed. Instead, always explicitly close `FileHandle`s. Node.js may change this behavior in the future.

Instances of the `FileHandle` object are created internally by the `fsPromises.open()` method.

Unlike the callback-based API (`fs.fstat()`, `fs.fchown()`, `fs.fchmod()`, and so on), a numeric file descriptor is not used by the promise-based API. Instead, the promise-based API uses the `FileHandle` class in order to help avoid accidental leaking of unclosed file descriptors after a `Promise` is resolved or rejected.

#### `filehandle.appendFile(data, options)`
<!-- YAML
added: v10.0.0
-->

* `data` {string|Buffer}
* `options` {Object|string}
  * `encoding` {string|null} **Default:** `'utf8'`
* Devuelve: {Promise}

Alias of [`filehandle.writeFile()`][].

When operating on file handles, the mode cannot be changed from what it was set to with [`fsPromises.open()`][]. Therefore, this is equivalent to [`filehandle.writeFile()`][].

#### `filehandle.chmod(mode)`
<!-- YAML
added: v10.0.0
-->

* `mode`{integer}
* Devuelve: {Promise}

Modifies the permissions on the file. The `Promise` is resolved with no arguments upon success.

#### `filehandle.chown(uid, gid)`
<!-- YAML
added: v10.0.0
-->

* `uid`{integer}
* `gid`{integer}
* Devuelve: {Promise}

Changes the ownership of the file then resolves the `Promise` with no arguments upon success.

#### `filehandle.close()`
<!-- YAML
added: v10.0.0
-->

* Returns: {Promise} A `Promise` that will be resolved once the underlying file descriptor is closed, or will be rejected if an error occurs while closing.

Closes the file descriptor.

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

#### `filehandle.datasync()`
<!-- YAML
added: v10.0.0
-->

* Devuelve: {Promise}

fdatasync(2) asincrónico. The `Promise` is resolved with no arguments upon success.

#### `filehandle.fd`
<!-- YAML
added: v10.0.0
-->

* {number} El descriptor de archivo numérico gestionado por el objeto de `FileHandle` .

#### `filehandle.read(buffer, offset, length, position)`
<!-- YAML
added: v10.0.0
-->

* `buffer` {Buffer|Uint8Array}
* `offset` {integer}
* `length` {integer}
* `position` {integer}
* Devuelve: {Promise}

Read data from the file.

`buffer` es el búfer al cual se escribirán los datos.

`offset` es el offset dentro del búfer en donde se empieza a escribir.

`length` es un entero que especifica el número de bytes a leer.

`position` es un argumento que especifica dónde comenzar la lectura desde dentro del archivo. Si `position` es `null`, se leerán los datos desde la posición actual del archivo, y se actualizará la posición del archivo. Si `position` es un entero, la posición del archivo permanecerá sin cambios.

Following successful read, the `Promise` is resolved with an object with a `bytesRead` property specifying the number of bytes read, and a `buffer` property that is a reference to the passed in `buffer` argument.

#### `filehandle.readFile(options)`
<!-- YAML
added: v10.0.0
-->

* `options` {Object|string}
  * `encoding` {string|null} **Default:** `null`
* Devuelve: {Promise}

Lee de manera asincrónica todos los contenidos de un archivo.

The `Promise` is resolved with the contents of the file. If no encoding is specified (using `options.encoding`), the data is returned as a `Buffer` object. Otherwise, the data will be a string.

Si `options` es una string, entonces especifica la codificación.

The `FileHandle` has to support reading.

If one or more `filehandle.read()` calls are made on a file handle and then a `filehandle.readFile()` call is made, the data will be read from the current position till the end of the file. It doesn't always read from the beginning of the file.

#### `filehandle.stat([options])`
<!-- YAML
added: v10.0.0
changes:
  - version: v10.5.0
    pr-url: https://github.com/nodejs/node/pull/20220
    description: Accepts an additional `options` object to specify whether
                 the numeric values returned should be bigint.
-->

* `options` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **Default:** `false`.
* Devuelve: {Promise}

Retrieves the [`fs.Stats`][] for the file.

#### `filehandle.sync()`
<!-- YAML
added: v10.0.0
-->

* Devuelve: {Promise}

fsync(2) asincrónico. The `Promise` is resolved with no arguments upon success.

#### `filehandle.truncate(len)`
<!-- YAML
added: v10.0.0
-->

* `len` {integer} **Default:** `0`
* Devuelve: {Promise}

Truncates the file then resolves the `Promise` with no arguments upon success.

If the file was larger than `len` bytes, only the first `len` bytes will be retained in the file.

For example, the following program retains only the first four bytes of the file:

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
      // Close the file if it is opened.
      await filehandle.close();
    }
  }
  console.log(fs.readFileSync('temp.txt', 'utf8'));  // Prints: Node
}

doTruncate().catch(console.error);
```

If the file previously was shorter than `len` bytes, it is extended, and the extended part is filled with null bytes (`'\0'`):

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
      // Close the file if it is opened.
      await filehandle.close();
    }
  }
  console.log(fs.readFileSync('temp.txt', 'utf8'));  // Prints Node.js\0\0\0
}

doTruncate().catch(console.error);
```

The last three bytes are null bytes (`'\0'`), to compensate the over-truncation.

#### `filehandle.utimes(atime, mtime)`
<!-- YAML
added: v10.0.0
-->

* `atime` {number|string|Date}
* `mtime` {number|string|Date}
* Devuelve: {Promise}

Change the file system timestamps of the object referenced by the `FileHandle` then resolves the `Promise` with no arguments upon success.

This function does not work on AIX versions before 7.1, it will resolve the `Promise` with an error using code `UV_ENOSYS`.

#### `filehandle.write(buffer[, offset[, length[, position]]])`
<!-- YAML
added: v10.0.0
-->

* `buffer` {Buffer|Uint8Array}
* `offset` {integer}
* `length` {integer}
* `position` {integer}
* Devuelve: {Promise}

Write `buffer` to the file.

The `Promise` is resolved with an object containing a `bytesWritten` property identifying the number of bytes written, and a `buffer` property containing a reference to the `buffer` written.

`offset` determina la parte del búfer que será escrita, y `length` es un entero que especifica el número de bytes a escribir.

`position` se refiere al offset del principio del archivo en donde deberían ser escritos estos datos. En caso de `typeof position !== 'number'`, los datos serán escritos en la posición actual. Vea pwrite(2).

It is unsafe to use `filehandle.write()` multiple times on the same file without waiting for the `Promise` to be resolved (or rejected). For this scenario, use [`fs.createWriteStream()`][].

On Linux, positional writes do not work when the file is opened in append mode. El núcleo ignora el argumento de posición y siempre anexa los datos al final del archivo.

#### `filehandle.write(string[, position[, encoding]])`
<!-- YAML
added: v10.0.0
-->

* `string` {string}
* `position` {integer}
* `encoding` {string} **Default:** `'utf8'`
* Devuelve: {Promise}

Write `string` to the file. Si `string` no es una string, entonces el valor será forzado a uno.

The `Promise` is resolved with an object containing a `bytesWritten` property identifying the number of bytes written, and a `buffer` property containing a reference to the `string` written.

`position` se refiere al offset del principio del archivo en donde deberían ser escritos estos datos. If the type of `position` is not a `number` the data will be written at the current position. Vea pwrite(2).

`encoding` es la codificación de strings esperada.

It is unsafe to use `filehandle.write()` multiple times on the same file without waiting for the `Promise` to be resolved (or rejected). For this scenario, use [`fs.createWriteStream()`][].

On Linux, positional writes do not work when the file is opened in append mode. El núcleo ignora el argumento de posición y siempre anexa los datos al final del archivo.

#### `filehandle.writeFile(data, options)`
<!-- YAML
added: v10.0.0
-->

* `data` {string|Buffer|Uint8Array}
* `options` {Object|string}
  * `encoding` {string|null} **Default:** `'utf8'`
* Devuelve: {Promise}

Escribe datos de manera asincrónica a un archivo, reemplazando el archivo si ya existe. `data` puede ser una string o un búfer. The `Promise` will be resolved with no arguments upon success.

La opción de `encoding` se ignora si `data` es un búfer.

Si `options` es una string, entonces especifica la codificación.

The `FileHandle` has to support writing.

It is unsafe to use `filehandle.writeFile()` multiple times on the same file without waiting for the `Promise` to be resolved (or rejected).

If one or more `filehandle.write()` calls are made on a file handle and then a `filehandle.writeFile()` call is made, the data will be written from the current position till the end of the file. It doesn't always write from the beginning of the file.

#### `filehandle.writev(buffers[, position])`
<!-- YAML
added: v12.9.0
-->

* `buffers` {ArrayBufferView[]}
* `position` {integer}
* Devuelve: {Promise}

Write an array of `ArrayBufferView`s to the file.

The `Promise` is resolved with an object containing a `bytesWritten` property identifying the number of bytes written, and a `buffers` property containing a reference to the `buffers` input.

`position` is the offset from the beginning of the file where this data should be written. En caso de `typeof position !== 'number'`, los datos serán escritos en la posición actual.

It is unsafe to call `writev()` multiple times on the same file without waiting for the previous operation to complete.

En Linux, las escrituras posicionales no funcionan cuando el archivo se abre en modo de anexo. El núcleo ignora el argumento de posición y siempre anexa los datos al final del archivo.

### `fsPromises.access(path[, mode])`
<!-- YAML
added: v10.0.0
-->

* `path`{string|Buffer|URL}
* `mode` {integer} **Default:** `fs.constants.F_OK`
* Devuelve: {Promise}

Prueba los permisos de un usuario para el archivo o directorio especificado por `path`. El argumento `mode` es un entero opcional que especifica las verificaciones de accesibilidad que serán realizadas. Check [File Access Constants](#fs_file_access_constants) for possible values of `mode`. It is possible to create a mask consisting of the bitwise OR of two or more values (e.g. `fs.constants.W_OK | fs.constants.R_OK`).

If the accessibility check is successful, the `Promise` is resolved with no value. If any of the accessibility checks fail, the `Promise` is rejected with an `Error` object. El siguiente ejemplo verifica si el archivo `/etc/passwd` puede ser leído y escrito por el proceso actual.

```js
const fs = require('fs');
const fsPromises = fs.promises;

fsPromises.access('/etc/passwd', fs.constants.R_OK | fs.constants.W_OK)
  .then(() => console.log('can access'))
  .catch(() => console.error('cannot access'));
```

Using `fsPromises.access()` to check for the accessibility of a file before calling `fsPromises.open()` is not recommended. Doing so introduces a race condition, since other processes may change the file's state between the two calls. Instead, user code should open/read/write the file directly and handle the error raised if the file is not accessible.

### `fsPromises.appendFile(path, data[, options])`
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL|FileHandle} nombre de archivo o `FileHandle`
* `data` {string|Buffer}
* `options` {Object|string}
  * `encoding` {string|null} **Default:** `'utf8'`
  * `mode` {integer} **Default:** `0o666`
  * `flag` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Default:** `'a'`.
* Devuelve: {Promise}

Asynchronously append data to a file, creating the file if it does not yet exist. `data` puede ser una string o un [`Buffer`][]. The `Promise` will be resolved with no arguments upon success.

Si `options` es una string, entonces especifica la codificación.

The `path` may be specified as a `FileHandle` that has been opened for appending (using `fsPromises.open()`).

### `fsPromises.chmod(path, mode)`
<!-- YAML
added: v10.0.0
-->

* `path`{string|Buffer|URL}
* `mode` {string|integer}
* Devuelve: {Promise}

Changes the permissions of a file then resolves the `Promise` with no arguments upon succces.

### `fsPromises.chown(path, uid, gid)`
<!-- YAML
added: v10.0.0
-->

* `path`{string|Buffer|URL}
* `uid`{integer}
* `gid`{integer}
* Devuelve: {Promise}

Changes the ownership of a file then resolves the `Promise` with no arguments upon success.

### `fsPromises.copyFile(src, dest[, flags])`
<!-- YAML
added: v10.0.0
-->

* `src` {string|Buffer|URL} nombre de archivo de la fuente a copiar
* `dest` {string|Buffer|URL} nombre de archivo de destino de la operación de copia
* `flags` {number} modificadores para la operación de copia. **Default:** `0`.
* Devuelve: {Promise}

Copia de manera asincrónica `src` a `dest`. By default, `dest` is overwritten if it already exists. The `Promise` will be resolved with no arguments upon success.

Node.js no ofrece ninguna garantía sobre la atomicidad de la operación de copia. If an error occurs after the destination file has been opened for writing, Node.js will attempt to remove the destination.

`flags` is an optional integer that specifies the behavior of the copy operation. It is possible to create a mask consisting of the bitwise OR of two or more values (e.g. `fs.constants.COPYFILE_EXCL | fs.constants.COPYFILE_FICLONE`).

* `fs.constants.COPYFILE_EXCL`: The copy operation will fail if `dest` already exists.
* `fs.constants.COPYFILE_FICLONE`: The copy operation will attempt to create a copy-on-write reflink. If the platform does not support copy-on-write, then a fallback copy mechanism is used.
* `fs.constants.COPYFILE_FICLONE_FORCE`: The copy operation will attempt to create a copy-on-write reflink. If the platform does not support copy-on-write, then the operation will fail.

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

### `fsPromises.lchmod(path, mode)`
<!-- YAML
deprecated: v10.0.0
-->

* `path`{string|Buffer|URL}
* `mode`{integer}
* Devuelve: {Promise}

Changes the permissions on a symbolic link then resolves the `Promise` with no arguments upon success. This method is only implemented on macOS.

### `fsPromises.lchown(path, uid, gid)`
<!-- YAML
added: v10.0.0
changes:
  - version: v10.6.0
    pr-url: https://github.com/nodejs/node/pull/21498
    description: This API is no longer deprecated.
-->

* `path`{string|Buffer|URL}
* `uid`{integer}
* `gid`{integer}
* Devuelve: {Promise}

Changes the ownership on a symbolic link then resolves the `Promise` with no arguments upon success.

### `fsPromises.link(existingPath, newPath)`
<!-- YAML
added: v10.0.0
-->

* `existingPath` {string|Buffer|URL}
* `newPath` {string|Buffer|URL}
* Devuelve: {Promise}

link(2) asincrónico. The `Promise` is resolved with no arguments upon success.

### `fsPromises.lstat(path[, options])`
<!-- YAML
added: v10.0.0
changes:
  - version: v10.5.0
    pr-url: https://github.com/nodejs/node/pull/20220
    description: Accepts an additional `options` object to specify whether
                 the numeric values returned should be bigint.
-->

* `path`{string|Buffer|URL}
* `options` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **Default:** `false`.
* Devuelve: {Promise}

lstat(2) asincrónico. The `Promise` is resolved with the [`fs.Stats`][] object for the given symbolic link `path`.

### `fsPromises.mkdir(path[, options])`
<!-- YAML
added: v10.0.0
-->

* `path`{string|Buffer|URL}
* `options` {Object|integer}
  * `recursive` {boolean} **Default:** `false`
  * `mode` {string|integer} Not supported on Windows. **Default:** `0o777`.
* Devuelve: {Promise}

Asynchronously creates a directory then resolves the `Promise` with no arguments upon success.

The optional `options` argument can be an integer specifying mode (permission and sticky bits), or an object with a `mode` property and a `recursive` property indicating whether parent folders should be created. Calling `fsPromises.mkdir()` when `path` is a directory that exists results in a rejection only when `recursive` is false.

### `fsPromises.mkdtemp(prefix[, options])`
<!-- YAML
added: v10.0.0
-->

* `prefix` {string}
* `options` {string|Object}
  * `encoding` {string} **Default:** `'utf8'`
* Devuelve: {Promise}

Creates a unique temporary directory and resolves the `Promise` with the created folder path. A unique directory name is generated by appending six random characters to the end of the provided `prefix`. Due to platform inconsistencies, avoid trailing `X` characters in `prefix`. Some platforms, notably the BSDs, can return more than six random characters, and replace trailing `X` characters in `prefix` with random characters.

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar.

```js
fsPromises.mkdtemp(path.join(os.tmpdir(), 'foo-'))
  .catch(console.error);
```

The `fsPromises.mkdtemp()` method will append the six randomly selected characters directly to the `prefix` string. For instance, given a directory `/tmp`, if the intention is to create a temporary directory *within* `/tmp`, the `prefix` must end with a trailing platform-specific path separator (`require('path').sep`).

### `fsPromises.open(path, flags[, mode])`
<!-- YAML
added: v10.0.0
changes:
  - version: v11.1.0
    pr-url: https://github.com/nodejs/node/pull/23767
    description: The `flags` argument is now optional and defaults to `'r'`.
-->

* `path`{string|Buffer|URL}
* `flags` {string|number} Vea [soporte de las `flags` del sistema de archivos][]. **Default:** `'r'`.
* `mode` {string|integer} **Default:** `0o666` (readable and writable)
* Devuelve: {Promise}

Asynchronous file open that returns a `Promise` that, when resolved, yields a `FileHandle` object. Vea open(2).

`mode` establece el modo de archivo (el permiso y los sticky bits), pero solo si el archivo fue creado.

Algunos caracteres (`< > : " / \ | ? *`) are reserved under Windows as documented by [Naming Files, Paths, and Namespaces](https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file). Under NTFS, if the filename contains a colon, Node.js will open a file system stream, as described by [this MSDN page](https://docs.microsoft.com/en-us/windows/desktop/FileIO/using-streams).

### `fsPromises.opendir(path[, options])`
<!-- YAML
added: v12.12.0
changes:
  - version: v13.1.0
    pr-url: https://github.com/nodejs/node/pull/30114
    description: The `bufferSize` option was introduced.
-->

* `path`{string|Buffer|URL}
* `options` {Object}
  * `encoding` {string|null} **Default:** `'utf8'`
  * `bufferSize` {number} Number of directory entries that are buffered internally when reading from the directory. Higher values lead to better performance but higher memory usage. **Default:** `32`
* Returns: {Promise} containing {fs.Dir}

Asynchronously open a directory. See opendir(3).

Creates an [`fs.Dir`][], which contains all further functions for reading from and cleaning up the directory.

The `encoding` option sets the encoding for the `path` while opening the directory and subsequent read operations.

Example using async iteration:

```js
const fs = require('fs');

async function print(path) {
  const dir = await fs.promises.opendir(path);
  for await (const dirent of dir) {
    console.log(dirent.name);
  }
}
print('./').catch(console.error);
```

### `fsPromises.readdir(path[, options])`
<!-- YAML
added: v10.0.0
changes:
  - version: v10.11.0
    pr-url: https://github.com/nodejs/node/pull/22020
    description: New option `withFileTypes` was added.
-->

* `path`{string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} **Default:** `'utf8'`
  * `withFileTypes` {boolean} **Default:** `false`
* Devuelve: {Promise}

Reads the contents of a directory then resolves the `Promise` with an array of the names of the files in the directory excluding `'.'` and `'..'`.

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use for the filenames. If the `encoding` is set to `'buffer'`, the filenames returned will be passed as `Buffer` objects.

If `options.withFileTypes` is set to `true`, the resolved array will contain [`fs.Dirent`][] objects.

```js
const fs = require('fs');

async function print(path) {
  const files = await fs.promises.readdir(path);
  for (const file of files) {
    console.log(file);
  }
}
print('./').catch(console.error);
```

### `fsPromises.readFile(path[, options])`
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL|FileHandle} nombre de archivo o `FileHandle`
* `options` {Object|string}
  * `encoding` {string|null} **Default:** `null`
  * `flag` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Default:** `'r'`.
* Devuelve: {Promise}

Lee de manera asincrónica todos los contenidos de un archivo.

The `Promise` is resolved with the contents of the file. If no encoding is specified (using `options.encoding`), the data is returned as a `Buffer` object. Otherwise, the data will be a string.

Si `options` es una string, entonces especifica la codificación.

When the `path` is a directory, the behavior of `fsPromises.readFile()` is platform-specific. On macOS, Linux, and Windows, the promise will be rejected with an error. On FreeBSD, a representation of the directory's contents will be returned.

Any specified `FileHandle` has to support reading.

### `fsPromises.readlink(path[, options])`
<!-- YAML
added: v10.0.0
-->

* `path`{string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} **Default:** `'utf8'`
* Devuelve: {Promise}

readlink(2) asincrónico. The `Promise` is resolved with the `linkString` upon success.

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use for the link path returned. If the `encoding` is set to `'buffer'`, the link path returned will be passed as a `Buffer` object.

### `fsPromises.realpath(path[, options])`
<!-- YAML
added: v10.0.0
-->

* `path`{string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} **Default:** `'utf8'`
* Devuelve: {Promise}

Determines the actual location of `path` using the same semantics as the `fs.realpath.native()` function then resolves the `Promise` with the resolved path.

Solo son soportadas las rutas que pueden ser convertidas a strings UTF8.

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use for the path. If the `encoding` is set to `'buffer'`, the path returned will be passed as a `Buffer` object.

On Linux, when Node.js is linked against musl libc, the procfs file system must be mounted on `/proc` in order for this function to work. Glibc does not have this restriction.

### `fsPromises.rename(oldPath, newPath)`
<!-- YAML
added: v10.0.0
-->

* `oldPath` {string|Buffer|URL}
* `newPath` {string|Buffer|URL}
* Devuelve: {Promise}

Renames `oldPath` to `newPath` and resolves the `Promise` with no arguments upon success.

### `fsPromises.rmdir(path[, options])`
<!-- YAML
added: v10.0.0
changes:
  - version: v13.3.0
    pr-url: https://github.com/nodejs/node/pull/30644
    description: The `maxBusyTries` option is renamed to `maxRetries`, and its
                 default is 0. The `emfileWait` option has been removed, and
                 `EMFILE` errors use the same retry logic as other errors. The
                 `retryDelay` option is now supported. `ENFILE` errors are now
                 retried.
  - version: v12.10.0
    pr-url: https://github.com/nodejs/node/pull/29168
    description: The `recursive`, `maxBusyTries`, and `emfileWait` options are
                  now supported.
-->

> Stability: 1 - Recursive removal is experimental.

* `path`{string|Buffer|URL}
* `options` {Object}
  * `maxRetries` {integer} If an `EBUSY`, `EMFILE`, `ENFILE`, `ENOTEMPTY`, or `EPERM` error is encountered, Node.js will retry the operation with a linear backoff wait of `retryDelay` ms longer on each try. This option represents the number of retries. This option is ignored if the `recursive` option is not `true`. **Default:** `0`.
  * `recursive` {boolean} If `true`, perform a recursive directory removal. In recursive mode, errors are not reported if `path` does not exist, and operations are retried on failure. **Default:** `false`.
  * `retryDelay` {integer} The amount of time in milliseconds to wait between retries. This option is ignored if the `recursive` option is not `true`. **Default:** `100`.
* Devuelve: {Promise}

Removes the directory identified by `path` then resolves the `Promise` with no arguments upon success.

Using `fsPromises.rmdir()` on a file (not a directory) results in the `Promise` being rejected with an `ENOENT` error on Windows and an `ENOTDIR` error on POSIX.

### `fsPromises.stat(path[, options])`
<!-- YAML
added: v10.0.0
changes:
  - version: v10.5.0
    pr-url: https://github.com/nodejs/node/pull/20220
    description: Accepts an additional `options` object to specify whether
                 the numeric values returned should be bigint.
-->

* `path`{string|Buffer|URL}
* `options` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **Default:** `false`.
* Devuelve: {Promise}

The `Promise` is resolved with the [`fs.Stats`][] object for the given `path`.

### `fsPromises.symlink(target, path[, type])`
<!-- YAML
added: v10.0.0
-->

* `target` {string|Buffer|URL}
* `path`{string|Buffer|URL}
* `type` {string} **Default:** `'file'`
* Devuelve: {Promise}

Creates a symbolic link then resolves the `Promise` with no arguments upon success.

The `type` argument is only used on Windows platforms and can be one of `'dir'`, `'file'`, or `'junction'`. Windows junction points require the destination path to be absolute. When using `'junction'`, the `target` argument will automatically be normalized to absolute path.

### `fsPromises.truncate(path[, len])`
<!-- YAML
added: v10.0.0
-->

* `path`{string|Buffer|URL}
* `len` {integer} **Default:** `0`
* Devuelve: {Promise}

Truncates the `path` then resolves the `Promise` with no arguments upon success. The `path` *must* be a string or `Buffer`.

### `fsPromises.unlink(path)`
<!-- YAML
added: v10.0.0
-->

* `path`{string|Buffer|URL}
* Devuelve: {Promise}

unlink(2) asincrónico. The `Promise` is resolved with no arguments upon success.

### `fsPromises.utimes(path, atime, mtime)`
<!-- YAML
added: v10.0.0
-->

* `path`{string|Buffer|URL}
* `atime` {number|string|Date}
* `mtime` {number|string|Date}
* Devuelve: {Promise}

Change the file system timestamps of the object referenced by `path` then resolves the `Promise` with no arguments upon success.

Los argumentos `atime` y `mtime` siguen las siguientes reglas:

* Values can be either numbers representing Unix epoch time, `Date`s, or a numeric string like `'123456789.0'`.
* If the value can not be converted to a number, or is `NaN`, `Infinity` or `-Infinity`, an `Error` will be thrown.

### `fsPromises.writeFile(file, data[, options])`
<!-- YAML
added: v10.0.0
-->

* `file` {string|Buffer|URL|FileHandle} nombre de archivo o `FileHandle`
* `data` {string|Buffer|Uint8Array}
* `options` {Object|string}
  * `encoding` {string|null} **Default:** `'utf8'`
  * `mode` {integer} **Default:** `0o666`
  * `flag` {string} Vea [soporte de las `flags` del sistema de archivos][]. **Default:** `'w'`.
* Devuelve: {Promise}

Escribe datos de manera asincrónica a un archivo, reemplazando el archivo si ya existe. `data` puede ser una string o un búfer. The `Promise` will be resolved with no arguments upon success.

La opción de `encoding` se ignora si `data` es un búfer.

Si `options` es una string, entonces especifica la codificación.

Any specified `FileHandle` has to support writing.

It is unsafe to use `fsPromises.writeFile()` multiple times on the same file without waiting for the `Promise` to be resolved (or rejected).

## Constantes FS

Las siguientes constantes son exportadas por `fs.constants`.

Not every constant will be available on every operating system.

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
    <td>Bandera que indica que el archivo puede ser escrito por el proceso de
    llamada.</td>
  </tr>
  <tr>
    <td><code>X_OK</code></td>
    <td>Bandera que indica que el archivo puede ser ejecutado por el proceso
    de llamada. This has no effect on Windows
    (will behave like <code>fs.constants.F_OK</code>).</td>
  </tr>
</table>

### Constantes de Copia de Archivo

The following constants are meant for use with [`fs.copyFile()`][].

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
    <th>Constante</th>
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
    <td>Bandera que indica crear el archivo, si este aún no existe.</td>
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
    the file. Esta bandera solo está disponible en sistemas operativos de Linux.</td>
  </tr>
  <tr>
    <td><code>O_NOFOLLOW</code></td>
    <td>Bandera que indica que la apertura debería fallar si la ruta es un enlace
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
    recurso al cual este apunta.</td>
  </tr>
  <tr>
    <td><code>O_DIRECT</code></td>
    <td>Al establecerse, se realizará un intento para minimizar los efectos de caché del
    I/O del archivo.</td>
  </tr>
  <tr>
    <td><code>O_NONBLOCK</code></td>
    <td>Bandera que indica abrir el archivo en modo de no-bloqueo, cuando sea posible.</td>
  </tr>
  <tr>
    <td><code>UV_FS_O_FILEMAP</code></td>
    <td>When set, a memory file mapping is used to access the file. This flag
    is available on Windows operating systems only. On other operating systems,
    this flag is ignored.</td>
  </tr>
</table>

### Constantes de Tipo de Archivo

Las siguientes constantes están destinadas a ser utilizadas con la propiedad `mode` del objeto de [`fs.Stats`][] para determinar un tipo de archivo.

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

Las siguientes constantes están destinadas a ser utilizadas con la propiedad `mode` del objeto de [`fs.Stats`][] para determinar los permisos de acceso para un archivo.

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
    <td>Modo de archivo que indica que es legible. editable, y que puede ser ejecutado por el grupo.</td>
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
    <td>Modo de archivo que indica que es legible, editable, y que puede ser ejecutado por otros.</td>
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

The following flags are available wherever the `flag` option takes a string.

* `'a'`: Open file for appending. El archivo se crea si no existe.

* `'ax'`: Like `'a'` but fails if the path exists.

* `'a+'`: Open file for reading and appending. El archivo se crea si no existe.

* `'ax+'`: Like `'a+'` but fails if the path exists.

* `'as'`: Open file for appending in synchronous mode. El archivo se crea si no existe.

* `'as+'`: Open file for reading and appending in synchronous mode. El archivo se crea si no existe.

* `'r'`: Open file for reading. Una excepción ocurre si el archivo no existe.

* `'r+'`: Open file for reading and writing. Una excepción ocurre si el archivo no existe.

* `'rs+'`: Open file for reading and writing in synchronous mode. Instruye al sistema operativo para evadir la caché del sistema de archivos local.

  This is primarily useful for opening files on NFS mounts as it allows skipping the potentially stale local cache. It has a very real impact on I/O performance so using this flag is not recommended unless it is needed.

  This doesn't turn `fs.open()` or `fsPromises.open()` into a synchronous blocking call. If synchronous operation is desired, something like `fs.openSync()` should be used.

* `'w'`: Open file for writing. El archivo es creado (si no existe) o truncado (si existe).

* `'wx'`: Like `'w'` but fails if the path exists.

* `'w+'`: Open file for reading and writing. El archivo es creado (si no existe) o truncado (si existe).

* `'wx+'`: Like `'w+'` but fails if the path exists.

`flag` can also be a number as documented by open(2); commonly used constants are available from `fs.constants`. On Windows, flags are translated to their equivalent ones where applicable, e.g. `O_WRONLY` to `FILE_GENERIC_WRITE`, or `O_EXCL|O_CREAT` to `CREATE_NEW`, as accepted by `CreateFileW`.

The exclusive flag `'x'` (`O_EXCL` flag in open(2)) ensures that path is newly created. On POSIX systems, path is considered to exist even if it is a symlink to a non-existent file. The exclusive flag may or may not work with network file systems.

En Linux, las escrituras posicionales no funcionan cuando el archivo se abre en modo de anexo. El núcleo ignora el argumento de posición y siempre anexa los datos al final del archivo.

Modifying a file rather than replacing it may require a flags mode of `'r+'` rather than the default mode `'w'`.

The behavior of some flags are platform-specific. As such, opening a directory on macOS and Linux with the `'a+'` flag, as in the example below, will return an error. In contrast, on Windows and FreeBSD, a file descriptor or a `FileHandle` will be returned.

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

On Windows, opening an existing hidden file using the `'w'` flag (either through `fs.open()` or `fs.writeFile()` or `fsPromises.open()`) will fail with `EPERM`. Existing hidden files can be opened for writing with the `'r+'` flag.

A call to `fs.ftruncate()` or `filehandle.truncate()` can be used to reset the file contents.
