# Файловая система

<!--introduced_in=v0.10.0-->

> Стабильность: 2 - Стабильно

<!--name=fs-->

The `fs` module provides an API for interacting with the file system in a manner closely modeled around standard POSIX functions.

To use this module:

```js
const fs = require('fs');
```

All file system operations have synchronous and asynchronous forms.

Асинхронная форма всегда принимает обратный вызов завершения в качестве его последнего аргумента. Аргументы, переданные обратному вызову завершения, зависят от метода, но первый аргумент всегда зарезервирован для исключения. В случае успешного завершения операции, первый аргумент будет `нулевой` или `неопределенный`.

```js
const fs = require('fs');

fs.unlink('/tmp/hello', (err) => {
  if (err) throw err;
  console.log("успешно удален /tmp/hello");
});
```

Exceptions that occur using synchronous operations are thrown immediately and may be handled using `try`/`catch`, or may be allowed to bubble up.

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
s.rename('/tmp/hello', '/tmp/world', (err) => {
  if (err) throw err;
  console.log("полностью переименовано");
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

В загруженных процессах программисту _настоятельно рекомендуется_ использовать асинхронные версии этих вызовов. Пока синхронные версии не завершат выполнение, они будут блокировать процесс, что послужит причиной приостановки всех соединений.

While it is not recommended, most fs functions allow the callback argument to be omitted, in which case a default callback is used that rethrows errors. To get a trace to the original call site, set the `NODE_DEBUG` environment variable:

Omitting the callback function on asynchronous fs functions is deprecated and may result in an error being thrown in the future.

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
Ошибка: EISDIR: недопустимая операция с каталогом, читайте
    <stack trace.>
```

## File paths

Most `fs` operations accept filepaths that may be specified in the form of a string, a [`Buffer`][], or a [`URL`][] object using the `file:` protocol.

String form paths are interpreted as UTF-8 character sequences identifying the absolute or relative filename. Relative paths will be resolved relative to the current working directory as specified by `process.cwd()`.

Example using an absolute path on POSIX:

```js
const fs = require('fs');

fs.open('/open/some/file.txt', 'r', (err, fd) => {
  if (err) throw err;
  fs.close(fd, (err) => {
    if (err) throw err;
  });
});
```

Example using a relative path on POSIX (relative to `process.cwd()`):

```js
fs.open('file.txt', 'r', (err, fd) => {
  if (err) throw err;
  fs.close(fd, (err) => {
    if (err) throw err;
  });
});
```

Paths specified using a [`Buffer`][] are useful primarily on certain POSIX operating systems that treat file paths as opaque byte sequences. On such systems, it is possible for a single file path to contain sub-sequences that use multiple character encodings. As with string paths, `Buffer` paths may be relative or absolute:

Example using an absolute path on POSIX:

```js
fs.open(Buffer.from('/open/some/file.txt'), 'r', (err, fd) => {
  if (err) throw err;
  fs.close(fd, (err) => {
    if (err) throw err;
  });
});
```

On Windows, Node.js follows the concept of per-drive working directory. This behavior can be observed when using a drive path without a backslash. For example `fs.readdirSync('c:\\')` can potentially return a different result than `fs.readdirSync('c:')`. For more information, see [this MSDN page](https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file#fully-qualified-vs-relative-paths).

### URL object support
<!-- YAML
added: v7.6.0
-->
For most 

`fs` module functions, the `path` or `filename` argument may be passed as a WHATWG [`URL`][] object. Only [`URL`][] objects using the `file:` protocol are supported.

```js
const fs = require('fs');
const fileUrl = new URL('file:///tmp/hello');

fs.readFileSync(fileUrl);
```

`file:` URLs are always absolute paths.

Using WHATWG [`URL`][] objects might introduce platform-specific behaviors.

On Windows, `file:` URLs with a hostname convert to UNC paths, while `file:` URLs with drive letters convert to local absolute paths. `file:` URLs without a hostname nor a drive letter will result in a throw:

```js
// On Windows :

// - WHATWG file URLs with hostname convert to UNC path
// file://hostname/p/a/t/h/file => \\hostname\p\a\t\h\file
fs.readFileSync(new URL('file://hostname/p/a/t/h/file'));

// - WHATWG file URLs with drive letters convert to absolute path
// file:///C:/tmp/hello => C:\tmp\hello
fs.readFileSync(new URL('file:///C:/tmp/hello'));

// - WHATWG file URLs without hostname must have a drive letters
fs.readFileSync(new URL('file:///notdriveletter/p/a/t/h/file'));
fs.readFileSync(new URL('file:///c/p/a/t/h/file'));
// TypeError [ERR_INVALID_FILE_URL_PATH]: File URL path must be absolute
```

`file:` URLs with drive letters must use `:` as a separator just after the drive letter. Using another separator will result in a throw.

On all other platforms, `file:` URLs with a hostname are unsupported and will result in a throw:

```js
// On other platforms:

// - WHATWG file URLs with hostname are unsupported
// file://hostname/p/a/t/h/file => throw!
fs.readFileSync(new URL('file://hostname/p/a/t/h/file'));
// TypeError [ERR_INVALID_FILE_URL_PATH]: must be absolute

// - WHATWG file URLs convert to absolute path
// file:///tmp/hello => /tmp/hello
fs.readFileSync(new URL('file:///tmp/hello'));
```

A `file:` URL having encoded slash characters will result in a throw on all platforms:

```js
// On Windows
fs.readFileSync(new URL('file:///C:/p/a/t/h/%2F'));
fs.readFileSync(new URL('file:///C:/p/a/t/h/%2f'));
/* TypeError [ERR_INVALID_FILE_URL_PATH]: File URL path must not include encoded
\ or / characters */

// On POSIX
fs.readFileSync(new URL('file:///p/a/t/h/%2F'));
fs.readFileSync(new URL('file:///p/a/t/h/%2f'));
/* TypeError [ERR_INVALID_FILE_URL_PATH]: File URL path must not include encoded
/ characters */
```
On Windows, `file:` URLs having encoded backslash will result in a throw:

```js
// On Windows
fs.readFileSync(new URL('file:///C:/path/%5C'));
fs.readFileSync(new URL('file:///C:/path/%5c'));
/* TypeError [ERR_INVALID_FILE_URL_PATH]: File URL path must not include encoded
\ or / characters */
```

## File Descriptors

On POSIX systems, for every process, the kernel maintains a table of currently open files and resources. Each open file is assigned a simple numeric identifier called a *file descriptor*. At the system-level, all file system operations use these file descriptors to identify and track each specific file. Windows systems use a different but conceptually similar mechanism for tracking resources. To simplify things for users, Node.js abstracts away the specific differences between operating systems and assigns all open files a numeric file descriptor.

The `fs.open()` method is used to allocate a new file descriptor. Once allocated, the file descriptor may be used to read data from, write data to, or request information about the file.

```js
fs.open('/open/some/file.txt', 'r', (err, fd) => {
  if (err) throw err;
  fs.fstat(fd, (err, stat) => {
    if (err) throw err;
    // use stat

    // always close the file descriptor!
    fs.close(fd, (err) => {
      if (err) throw err;
    });
  });
});
```

Most operating systems limit the number of file descriptors that may be open at any given time so it is critical to close the descriptor when operations are completed. Failure to do so will result in a memory leak that will eventually cause an application to crash.

## Threadpool Usage

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

* Возвращает: {boolean}

Returns `true` if the `fs.Dirent` object describes a block device.

### dirent.isCharacterDevice()
<!-- YAML
added: v10.10.0
-->

* Возвращает: {boolean}

Returns `true` if the `fs.Dirent` object describes a character device.

### dirent.isDirectory()
<!-- YAML
added: v10.10.0
-->

* Возвращает: {boolean}

Returns `true` if the `fs.Dirent` object describes a file system directory.

### dirent.isFIFO()
<!-- YAML
added: v10.10.0
-->

* Возвращает: {boolean}

Returns `true` if the `fs.Dirent` object describes a first-in-first-out (FIFO) pipe.

### dirent.isFile()
<!-- YAML
added: v10.10.0
-->

* Возвращает: {boolean}

Returns `true` if the `fs.Dirent` object describes a regular file.

### dirent.isSocket()
<!-- YAML
added: v10.10.0
-->

* Возвращает: {boolean}

Returns `true` if the `fs.Dirent` object describes a socket.

### dirent.isSymbolicLink()
<!-- YAML
added: v10.10.0
-->

* Возвращает: {boolean}

Returns `true` if the `fs.Dirent` object describes a symbolic link.


### dirent.name
<!-- YAML
added: v10.10.0
-->

* {string|Buffer}

The file name that this `fs.Dirent` object refers to. The type of this value is determined by the `options.encoding` passed to [`fs.readdir()`][] or [`fs.readdirSync()`][].

## Класс: fs.FSWatcher
<!-- YAML
added: v0.5.8
-->

A successful call to [`fs.watch()`][] method will return a new `fs.FSWatcher` object.

All `fs.FSWatcher` objects are [`EventEmitter`][]'s that will emit a `'change'` event whenever a specific watched file is modified.

### Событие: "change"'
<!-- YAML
added: v0.5.8
-->

* `eventType` {string} The type of change event that has occurred
* `filename` {string|Buffer} Имя файла, которое изменилось (если релевантно/допустимо)

Создается, когда что-то меняется в отслеживаемом каталоге или файле. Более подробно смотрите в [`fs.watch()`][].

Аргумент `filename` может не предоставляться в зависимости от поддержки операционной системы. If `filename` is provided, it will be provided as a `Buffer` if `fs.watch()` is called with its `encoding` option set to `'buffer'`, otherwise `filename` will be a UTF-8 string.

```js
// Example when handled through fs.watch() listener
fs.watch('./tmp', { encoding: 'buffer' }, (eventType, filename) => {
  if (filename) {
    console.log(filename);
    // Prints: <Buffer ...>
  }
});
```

### Событие: 'close'
<!-- YAML
added: v10.0.0
-->

Emitted when the watcher stops watching for changes. The closed `fs.FSWatcher` object is no longer usable in the event handler.

### Событие: 'error'
<!-- YAML
added: v0.5.8
-->

* `error` {Error}

Emitted when an error occurs while watching the file. The errored `fs.FSWatcher` object is no longer usable in the event handler.

### watcher.close()
<!-- YAML
added: v0.5.8
-->

Прекратить просмотр изменений на данном `fs.FSWatcher`. Once stopped, the `fs.FSWatcher` object is no longer usable.

## Класс: fs.ReadStream
<!-- YAML
added: v0.1.93
-->

A successful call to `fs.createReadStream()` will return a new `fs.ReadStream` object.

All `fs.ReadStream` objects are [Readable Streams](stream.html#stream_class_stream_readable).

### Событие: 'close'
<!-- YAML
added: v0.1.93
-->

Emitted when the `fs.ReadStream`'s underlying file descriptor has been closed.

### Событие: 'open'
<!-- YAML
added: v0.1.93
-->

* `fd` {integer} Integer file descriptor used by the `ReadStream`.

Emitted when the `fs.ReadStream`'s file descriptor has been opened.

### Event: 'ready'
<!-- YAML
added: v9.11.0
-->

Emitted when the `fs.ReadStream` is ready to be used.

Fires immediately after `'open'`.

### readStream.bytesRead
<!-- YAML
added: v6.4.0
-->

* {number}

The number of bytes that have been read so far.

### readStream.path
<!-- YAML
added: v0.1.93
-->

* {string|Buffer}

Путь к файлу, из которого читается поток, как указано в первом аргументе для `fs.createReadStream()`. Если `path` передается в качестве строки, то `readStream.path` будет строкой. Если `path` передается в качестве `Buffer`, то `readStream.path` будет `Buffer`.

### readStream.pending
<!-- YAML
added: v10.16.0
-->

* {boolean}

This property is `true` if the underlying file has not been opened yet, i.e. before the `'ready'` event is emitted.

## Класс: fs.Stats
<!-- YAML
added: v0.1.21
changes:
  - version: v8.1.0
    pr-url: https://github.com/nodejs/node/pull/13173
    description: Added times as numbers.
-->

A `fs.Stats` object provides information about a file.

Objects returned from [`fs.stat()`][], [`fs.lstat()`][] and [`fs.fstat()`][] and their synchronous counterparts are of this type. If `bigint` in the `options` passed to those methods is true, the numeric values will be `bigint` instead of `number`.

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
  birthtime: Mon, 10 Oct 2011 23:24:11 GMT }
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

* Возвращает: {boolean}

Returns `true` if the `fs.Stats` object describes a block device.

### stats.isCharacterDevice()
<!-- YAML
added: v0.1.10
-->

* Возвращает: {boolean}

Returns `true` if the `fs.Stats` object describes a character device.

### stats.isDirectory()
<!-- YAML
added: v0.1.10
-->

* Возвращает: {boolean}

Returns `true` if the `fs.Stats` object describes a file system directory.

### stats.isFIFO()
<!-- YAML
added: v0.1.10
-->

* Возвращает: {boolean}

Returns `true` if the `fs.Stats` object describes a first-in-first-out (FIFO) pipe.

### stats.isFile()
<!-- YAML
added: v0.1.10
-->

* Возвращает: {boolean}

Returns `true` if the `fs.Stats` object describes a regular file.

### stats.isSocket()
<!-- YAML
added: v0.1.10
-->

* Возвращает: {boolean}

Returns `true` if the `fs.Stats` object describes a socket.

### stats.isSymbolicLink()
<!-- YAML
added: v0.1.10
-->

* Возвращает: {boolean}

Returns `true` if the `fs.Stats` object describes a symbolic link.

This method is only valid when using [`fs.lstat()`][].

### stats.dev

* {number|bigint}

The numeric identifier of the device containing the file.

### stats.ino

* {number|bigint}

The file system specific "Inode" number for the file.

### stats.mode

* {number|bigint}

A bit-field describing the file type and mode.

### stats.nlink

* {number|bigint}

The number of hard-links that exist for the file.

### stats.uid

* {number|bigint}

The numeric user identifier of the user that owns the file (POSIX).

### stats.gid

* {number|bigint}

The numeric group identifier of the group that owns the file (POSIX).

### stats.rdev

* {number|bigint}

A numeric device identifier if the file is considered "special".

### stats.size

* {number|bigint}

The size of the file in bytes.

### stats.blksize

* {number|bigint}

The file system block size for i/o operations.

### stats.blocks

* {number|bigint}

The number of blocks allocated for this file.

### stats.atimeMs
<!-- YAML
added: v8.1.0
-->

* {number|bigint}

The timestamp indicating the last time this file was accessed expressed in milliseconds since the POSIX Epoch.

### stats.mtimeMs
<!-- YAML
added: v8.1.0
-->

* {number|bigint}

The timestamp indicating the last time this file was modified expressed in milliseconds since the POSIX Epoch.

### stats.ctimeMs
<!-- YAML
added: v8.1.0
-->

* {number|bigint}

The timestamp indicating the last time the file status was changed expressed in milliseconds since the POSIX Epoch.

### stats.birthtimeMs
<!-- YAML
added: v8.1.0
-->

* {number|bigint}

The timestamp indicating the creation time of this file expressed in milliseconds since the POSIX Epoch.

### stats.atime
<!-- YAML
added: v0.11.13
-->

* {Date}

The timestamp indicating the last time this file was accessed.

### stats.mtime
<!-- YAML
added: v0.11.13
-->

* {Date}

The timestamp indicating the last time this file was modified.

### stats.ctime
<!-- YAML
added: v0.11.13
-->

* {Date}

The timestamp indicating the last time the file status was changed.

### stats.birthtime
<!-- YAML
added: v0.11.13
-->

* {Date}

The timestamp indicating the creation time of this file.

### Статические значения времени

The `atimeMs`, `mtimeMs`, `ctimeMs`, `birthtimeMs` properties are [numbers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) that hold the corresponding times in milliseconds. Their precision is platform specific. `atime`, `mtime`, `ctime`, and `birthtime` are [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) object alternate representations of the various times. The `Date` and number values are not connected. Assigning a new number value, or mutating the `Date` value, will not be reflected in the corresponding alternate representation.

Время в объекте статистики имеет следующую семантику:

* `atime` "Время доступа" - Время, когда данные файлов последний раз были доступны. Изменено с помощью системных вызовов mknod(2), utimes(2) и read(2).
* `mtime` "Время изменения" - Время, когда данные файла последний раз изменялись. Изменено с помощью системных вызовов mknod(2), utimes(2) и write(2).
* `ctime` "Изменить время" - Время, когда статус файла последний раз изменялся (модификация данных inode). Изменено с помощью системных вызовов chmod(2), chown(2), link(2), mknod(2), rename(2), unlink(2), utimes(2), read(2) и write(2).
* `birthtime` "Время рождения" - Время создания файла. Установите один раз, когда создается файл. В файловых системах, где время рождения недоступно, это поле может содержать `ctime` или `1970-01-01T00:00Z` (т.е. метка времени эпохи unix `0`). This value may be greater than `atime` or `mtime` in this case. On Darwin and other FreeBSD variants, also set if the `atime` is explicitly set to an earlier value than the current `birthtime` using the utimes(2) system call.

Prior to Node.js 0.12, the `ctime` held the `birthtime` on Windows systems. As of 0.12, `ctime` is not "creation time", and on Unix systems, it never was.

## Класс: fs.WriteStream
<!-- YAML
added: v0.1.93
-->

`WriteStream` является [Записываемым потоком](stream.html#stream_class_stream_writable).

### Событие: 'close'
<!-- YAML
added: v0.1.93
-->

Создается, когда базовый файловый дескриптор `WriteStream` был закрыт.

### Событие: 'open'
<!-- YAML
added: v0.1.93
-->

* `fd` {integer} Integer file descriptor used by the `WriteStream`.

Emitted when the `WriteStream`'s file is opened.

### Event: 'ready'
<!-- YAML
added: v9.11.0
-->

Emitted when the `fs.WriteStream` is ready to be used.

Fires immediately after `'open'`.

### writeStream.bytesWritten
<!-- YAML
added: v0.4.7
-->

Количество байтов, записанных на данный момент. Не содержит данные, которые все еще находятся в очереди для записи.

### writeStream.path
<!-- YAML
added: v0.1.93
-->

The path to the file the stream is writing to as specified in the first argument to [`fs.createWriteStream()`][]. Если `path` передается в качестве строки, то `writeStream.path` будет строкой. Если `path` передается в качестве `Buffer`, то `writeStream.path` будет `Buffer`.

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
* `mode` {integer} **Default:** `fs.constants.F_OK`
* `callback` {Function}
  * `err` {Error}

Проверяет права пользователя для файла или каталога, указанного с помощью `path`. Аргумент `mode` - опциональное целое число, которое задает необходимое выполнение проверок доступности. Check [File Access Constants](#fs_file_access_constants) for possible values of `mode`. It is possible to create a mask consisting of the bitwise OR of two or more values (e.g. `fs.constants.W_OK | fs.constants.R_OK`).

Последний аргумент - `callback` - функция обратного вызова, которая вызывается с возможным аргументом ошибки. If any of the accessibility checks fail, the error argument will be an `Error` object. The following examples check if `package.json` exists, and if it is readable or writable.

```js
const file = 'package.json';

// Check if the file exists in the current directory.
fs.access(file, fs.constants.F_OK, (err) => {
  console.log(`${file} ${err ? 'does not exist' : 'exists'}`);
});

// Check if the file is readable.
fs.access(file, fs.constants.R_OK, (err) => {
  console.log(`${file} ${err ? 'is not readable' : 'is readable'}`);
});

// Check if the file is writable.
fs.access(file, fs.constants.W_OK, (err) => {
  console.log(`${file} ${err ? 'is not writable' : 'is writable'}`);
});

// Check if the file exists in the current directory, and if it is writable.
fs.access(file, fs.constants.F_OK | fs.constants.W_OK, (err) => {
  if (err) {
    console.error(
      `${file} ${err.code === 'ENOENT' ? 'does not exist' : 'is read-only'}`);
  } else {
    console.log(`${file} exists, and it is writable`);
  }
});
```

Не рекомендуется использовать `fs.access()` для проверки доступности файла перед вызовом `fs.open()`, `fs.readFile()` или `fs.writeFile()`. Это вводит условие гонки, потому что другие процессы могут изменять состояние файла между двумя вызовами. Вместо этого пользовательский код должен открывать/читать/записывать файл напрямую и обрабатывать возникшую ошибку, если файл недоступен.

**запись (НЕ РЕКОМЕНДУЕТСЯ)**

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

**запись (РЕКОМЕНДУЕТСЯ)**

```js
fs.open('myfile', 'wx', (err, fd) => {
  if (err) {
    if (err.code === 'EEXIST') {
      console.error('myfile already exists');
      return;
    }

    throw err;
  }

  writeMyData(fd);
});
```

**чтение (НЕ РЕКОМЕНДУЕТСЯ)**

```js
fs.access('myfile', (err) => {
  if (err) {
    if (err.code === 'ENOENT') {
      console.error('myfile does not exist');
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

**чтение (РЕКОМЕНДУЕТСЯ)**

```js
fs.open('myfile', 'r', (err, fd) => {
  if (err) {
    if (err.code === 'ENOENT') {
      console.error('myfile does not exist');
      return;
    }

    throw err;
  }

  readMyData(fd);
});
```

Приведенные выше примеры, которые "не рекомендуются", проверяют доступность и затем используют файл; примеры, которые "рекомендуются", лучше, потому что они используют файл напрямую и обрабатывают ошибки, если таковые имеются.

In general, check for the accessibility of a file only if the file will not be used directly, for example when its accessibility is a signal from another process.

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
* `mode` {integer} **Default:** `fs.constants.F_OK`

Synchronously tests a user's permissions for the file or directory specified by `path`. The `mode` argument is an optional integer that specifies the accessibility checks to be performed. Check [File Access Constants](#fs_file_access_constants) for possible values of `mode`. It is possible to create a mask consisting of the bitwise OR of two or more values (e.g. `fs.constants.W_OK | fs.constants.R_OK`).

If any of the accessibility checks fail, an `Error` will be thrown. Otherwise, the method will return `undefined`.

```js
try {
  fs.accessSync('etc/passwd', fs.constants.R_OK | fs.constants.W_OK);
  console.log('can read/write');
} catch (err) {
  console.error('no access!');
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

* `path` {string|Buffer|URL|number} filename or file descriptor
* `data` {string|Buffer}
* `options` {Object|string}
  * `encoding` {string|null} **По умолчанию:** `'utf8'`
  * `mode` {integer} **Default:** `0o666`
  * `flag` {string} See [support of file system `flags`][]. **Default:** `'a'`.
* `callback` {Function}
  * `err` {Error}

Asynchronously append data to a file, creating the file if it does not yet exist. `data` can be a string or a [`Buffer`][].

```js
fs.appendFile('message.txt', 'данные для добавления', (err) => {
  if (err) throw err;
  console.log('"Данные для добавления" были добавлены в файл!');
});
```

If `options` is a string, then it specifies the encoding:

```js
fs.appendFile('message.txt', 'данные для добавления', 'utf8', обратный вызов);
```

The `path` may be specified as a numeric file descriptor that has been opened for appending (using `fs.open()` or `fs.openSync()`). The file descriptor will not be closed automatically.

```js
fs.open('message.txt', 'a', (err, fd) => {
  if (err) throw err;
  fs.appendFile(fd, 'data to append', 'utf8', (err) => {
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

* `path` {string|Buffer|URL|number} filename or file descriptor
* `data` {string|Buffer}
* `options` {Object|string}
  * `encoding` {string|null} **По умолчанию:** `'utf8'`
  * `mode` {integer} **Default:** `0o666`
  * `flag` {string} See [support of file system `flags`][]. **Default:** `'a'`.

Synchronously append data to a file, creating the file if it does not yet exist. `data` can be a string or a [`Buffer`][].

```js
try {
  fs.appendFileSync('message.txt', 'data to append');
  console.log('The "data to append" was appended to file!');
} catch (err) {
  /* Handle the error */
}
```

If `options` is a string, then it specifies the encoding:

```js
fs.appendFileSync('message.txt', 'data to append', 'utf8');
```

The `path` may be specified as a numeric file descriptor that has been opened for appending (using `fs.open()` or `fs.openSync()`). The file descriptor will not be closed automatically.

```js
let fd;

try {
  fd = fs.openSync('message.txt', 'a');
  fs.appendFileSync(fd, 'data to append', 'utf8');
} catch (err) {
  /* Handle the error */
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
* `mode` {integer}
* `callback` {Function}
  * `err` {Error}

Асинхронно изменяет права доступа к файлу. Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова.

See also: chmod(2).

### File modes

The `mode` argument used in both the `fs.chmod()` and `fs.chmodSync()` methods is a numeric bitmask created using a logical OR of the following constants:

| Константа              | Octal   | Описание                 |
| ---------------------- | ------- | ------------------------ |
| `fs.constants.S_IRUSR` | `0o400` | read by owner            |
| `fs.constants.S_IWUSR` | `0o200` | write by owner           |
| `fs.constants.S_IXUSR` | `0o100` | execute/search by owner  |
| `fs.constants.S_IRGRP` | `0o40`  | read by group            |
| `fs.constants.S_IWGRP` | `0o20`  | write by group           |
| `fs.constants.S_IXGRP` | `0o10`  | execute/search by group  |
| `fs.constants.S_IROTH` | `0o4`   | read by others           |
| `fs.constants.S_IWOTH` | `0o2`   | write by others          |
| `fs.constants.S_IXOTH` | `0o1`   | execute/search by others |

An easier method of constructing the `mode` is to use a sequence of three octal digits (e.g. `765`). The left-most digit (`7` in the example), specifies the permissions for the file owner. The middle digit (`6` in the example), specifies permissions for the group. The right-most digit (`5` in the example), specifies the permissions for others.

| Number | Описание                 |
| ------ | ------------------------ |
| `7`    | read, write, and execute |
| `6`    | read and write           |
| `5`    | read and execute         |
| `4`    | только для чтения        |
| `3`    | write and execute        |
| `2`    | write only               |
| `1`    | execute only             |
| `0`    | no permission            |

For example, the octal value `0o765` means:

* The owner may read, write and execute the file.
* The group may read and write the file.
* Others may read and execute the file.

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
* `mode` {integer}

For detailed information, see the documentation of the asynchronous version of this API: [`fs.chmod()`][].

See also: chmod(2).

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
* `uid` {integer}
* `gid` {integer}
* `callback` {Function}
  * `err` {Error}

Асинхронно меняет владельца и группу файла. Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова.

See also: chown(2).

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
* `uid` {integer}
* `gid` {integer}

Синхронно меняет владельца и группу файла. Возвращает `undefined`. Синхронная версия [`fs.chown()`][].

See also: chown(2).

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

* `fd` {integer}
* `callback` {Function}
  * `err` {Error}

Асинхронный close(2). Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова.

## fs.closeSync(fd)
<!-- YAML
added: v0.1.21
-->

* `fd` {integer}

Синхронный close(2). Возвращает `undefined`.

## fs.constants

* {Object}

Возвращает объект, содержащий часто используемые константы для операций файловой системы. Определенные константы, установленные в настоящее время, описаны в [FS Constants](#fs_fs_constants_1).

## fs.copyFile(src, dest[, flags], callback)
<!-- YAML
added: v8.5.0
-->

* `src` {string|Buffer|URL} source filename to copy
* `dest` {string|Buffer|URL} destination filename of the copy operation
* `flags` {number} modifiers for copy operation. **Default:** `0`.
* `callback` {Function}

Asynchronously copies `src` to `dest`. By default, `dest` is overwritten if it already exists. No arguments other than a possible exception are given to the callback function. Node.js makes no guarantees about the atomicity of the copy operation. If an error occurs after the destination file has been opened for writing, Node.js will attempt to remove the destination.

`flags` is an optional integer that specifies the behavior of the copy operation. It is possible to create a mask consisting of the bitwise OR of two or more values (e.g. `fs.constants.COPYFILE_EXCL | fs.constants.COPYFILE_FICLONE`).

* `fs.constants.COPYFILE_EXCL` - The copy operation will fail if `dest` already exists.
* `fs.constants.COPYFILE_FICLONE` - The copy operation will attempt to create a copy-on-write reflink. If the platform does not support copy-on-write, then a fallback copy mechanism is used.
* `fs.constants.COPYFILE_FICLONE_FORCE` - The copy operation will attempt to create a copy-on-write reflink. If the platform does not support copy-on-write, then the operation will fail.

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

* `src` {string|Buffer|URL} source filename to copy
* `dest` {string|Buffer|URL} destination filename of the copy operation
* `flags` {number} modifiers for copy operation. **Default:** `0`.

Synchronously copies `src` to `dest`. By default, `dest` is overwritten if it already exists. Возвращает `undefined`. Node.js makes no guarantees about the atomicity of the copy operation. If an error occurs after the destination file has been opened for writing, Node.js will attempt to remove the destination.

`flags` is an optional integer that specifies the behavior of the copy operation. It is possible to create a mask consisting of the bitwise OR of two or more values (e.g. `fs.constants.COPYFILE_EXCL | fs.constants.COPYFILE_FICLONE`).

* `fs.constants.COPYFILE_EXCL` - The copy operation will fail if `dest` already exists.
* `fs.constants.COPYFILE_FICLONE` - The copy operation will attempt to create a copy-on-write reflink. If the platform does not support copy-on-write, then a fallback copy mechanism is used.
* `fs.constants.COPYFILE_FICLONE_FORCE` - The copy operation will attempt to create a copy-on-write reflink. If the platform does not support copy-on-write, then the operation will fail.

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
* `options` {string|Object}
  * `flags` {string} See [support of file system `flags`][]. **Default:** `'r'`.
  * `encoding` {string} **Default:** `null`
  * `fd` {integer} **Default:** `null`
  * `mode` {integer} **Default:** `0o666`
  * `autoClose` {boolean} **Default:** `true`
  * `start` {integer}
  * `end` {integer} **Default:** `Infinity`
  * `highWaterMark` {integer} **Default:** `64 * 1024`
* Returns: {fs.ReadStream} See [Readable Streams](stream.html#stream_class_stream_readable).

Unlike the 16 kb default `highWaterMark` for a readable stream, the stream returned by this method has a default `highWaterMark` of 64 kb.

Параметр `options` может включать в себя значения `start` и `end` для чтения определенного диапазона байтов вместо всего файла. И `start`, и `end` включительно и начинают отсчет с 0. Если указан `fd` и `start` опущен или `undefined`, то `fs.createReadStream()` последовательно читает из текущей позиции файла. `encoding` может быть одним из тех, что принимает [`Buffer`][].

Если указан `fd`, то `ReadStream` будет игнорировать аргумент `path` и будет использовать указанный файловый дескриптор. Это означает, что событие `'open'` не будет создано. `fd` should be blocking; non-blocking `fd`s should be passed to [`net.Socket`][].

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

Если `autoClose` имеет значение false, то файловый дескриптор не будет закрыт, даже при наличии ошибки. It is the application's responsibility to close it and make sure there's no file descriptor leak. If `autoClose` is set to true (default behavior), on `'error'` or `'end'` the file descriptor will be closed automatically.

`mode` устанавливает режим файла (разрешение и sticky-биты), но только если файл был создан.

Пример чтения последних 10 байтов файла, который имеет длину 100 байтов:

```js
fs.createReadStream('sample.txt', { start: 90, end: 99 });
```

Если параметр `options` является строкой, то он указывает кодировку.

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
* `options` {string|Object}
  * `flags` {string} See [support of file system `flags`][]. **Default:** `'w'`.
  * `encoding` {string} **По умолчанию:** `'utf8'`
  * `fd` {integer} **Default:** `null`
  * `mode` {integer} **Default:** `0o666`
  * `autoClose` {boolean} **Default:** `true`
  * `start` {integer}
* Returns: {fs.WriteStream} See [Writable Stream](stream.html#stream_class_stream_writable).

Параметр `options` также может включать в себя опцию `start`, что разрешает записывать данные в некоторой позиции после начала файла. Чтобы модифицировать файл, а не заменить его, может потребоваться режим `flags` `r+` вместо режима по умолчанию `w`. The `encoding` can be any one of those accepted by [`Buffer`][].

If `autoClose` is set to true (default behavior) on `'error'` or `'finish'` the file descriptor will be closed automatically. Если `autoClose` имеет значение false, то файловый дескриптор не закроется, даже при наличии ошибки. It is the application's responsibility to close it and make sure there's no file descriptor leak.

Like [`ReadStream`][], if `fd` is specified, [`WriteStream`][] will ignore the `path` argument and will use the specified file descriptor. Это означает, что событие `'open'` не будет создано. `fd` should be blocking; non-blocking `fd`s should be passed to [`net.Socket`][].

Если параметр `options` является строкой, то он указывает кодировку.

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

> Стабильность: 0 - Устарело: Вместо этого используйте [`fs.stat()`][] или [`fs.access()`][].

* `path` {string|Buffer|URL}
* `callback` {Function}
  * `exists` {boolean}

Проверьте наличие данного пути с помощью файловой системы. Then call the `callback` argument with either true or false:

```js
fs.exists('/etc/passwd', (exists) => {
  console.log(exists ? 'it\'s there' : 'no passwd!');
});
```

**The parameters for this callback are not consistent with other Node.js callbacks.** Normally, the first parameter to a Node.js callback is an `err` parameter, optionally followed by other parameters. The `fs.exists()` callback has only one boolean parameter. This is one reason `fs.access()` is recommended instead of `fs.exists()`.

Не рекомендуется использовать `fs.exists()` для проверки наличия файла перед вызовом `fs.open()`, `fs.readFile()` или `fs.writeFile()`. Это вводит условие гонки, потому что другие процессы могут изменять состояние файла между двумя вызовами. Вместо этого пользовательский код должен открывать/читать/записывать файл напрямую и обрабатывать возникшую ошибку, если файл не существует.

**запись (НЕ РЕКОМЕНДУЕТСЯ)**

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

**запись (РЕКОМЕНДУЕТСЯ)**

```js
fs.open('myfile', 'wx', (err, fd) => {
  if (err) {
    if (err.code === 'EEXIST') {
      console.error('myfile already exists');
      return;
    }

    throw err;
  }

  writeMyData(fd);
});
```

**чтение (НЕ РЕКОМЕНДУЕТСЯ)**

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

**чтение (РЕКОМЕНДУЕТСЯ)**

```js
fs.open('myfile', 'r', (err, fd) => {
  if (err) {
    if (err.code === 'ENOENT') {
      console.error('myfile does not exist');
      return;
    }

    throw err;
  }

  readMyData(fd);
});
```

Приведенные выше примеры, которые "не рекомендуются", проверяют наличие и затем используют файл; примеры, которые "рекомендуются", лучше, потому что они используют файл напрямую и обрабатывают ошибки, если таковые имеются.

В общем, проверяйте наличие файла, только если файл не будет использоваться напрямую; например, когда его наличие является сигналом от другого процесса.

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
* Возвращает: {boolean}

Если путь существует, возвращает `true`, в противном случае - `false`.

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

* `fd` {integer}
* `mode` {integer}
* `callback` {Function}
  * `err` {Error}

Асинхронный fchmod(2). Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова.

## fs.fchmodSync(fd, mode)
<!-- YAML
added: v0.4.7
-->

* `fd` {integer}
* `mode` {integer}

Синхронный fchmod(2). Возвращает `undefined`.

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

* `fd` {integer}
* `uid` {integer}
* `gid` {integer}
* `callback` {Function}
  * `err` {Error}

Асинхронный fchown(2). Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова.

## fs.fchownSync(fd, uid, gid)
<!-- YAML
added: v0.4.7
-->

* `fd` {integer}
* `uid` {integer}
* `gid` {integer}

Синхронный fchown(2). Возвращает `undefined`.

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

* `fd` {integer}
* `callback` {Function}
  * `err` {Error}

Асинхронный fdatasync(2). Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова.

## fs.fdatasyncSync(fd)
<!-- YAML
added: v0.1.96
-->

* `fd` {integer}

Синхронный fdatasync(2). Возвращает `undefined`.

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

* `fd` {integer}
* `options` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **По умолчанию:** `false`.
* `callback` {Function}
  * `err` {Error}
  * `stats` {fs.Stats}

Асинхронный fstat(2). Обратный вызов получает два аргумента `(err, stats)`, где `stats` является объектом [`fs.Stats`][]. `fstat()` идентичен [`stat()`][], за исключением того, что файл, который будет создан, определяется файловым дескриптором `fd`.

## fs.fstatSync(fd[, options])
<!-- YAML
added: v0.1.95
changes:
  - version: v10.5.0
    pr-url: https://github.com/nodejs/node/pull/20220
    description: Accepts an additional `options` object to specify whether
                 the numeric values returned should be bigint.
-->

* `fd` {integer}
* `options` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **По умолчанию:** `false`.
* Returns: {fs.Stats}

Синхронный fstat(2).

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

* `fd` {integer}
* `callback` {Function}
  * `err` {Error}

Асинхронный fsync(2). Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова.

## fs.fsyncSync(fd)
<!-- YAML
added: v0.1.96
-->

* `fd` {integer}

Синхронный fsync(2). Возвращает `undefined`.

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

* `fd` {integer}
* `len` {integer} **Default:** `0`
* `callback` {Function}
  * `err` {Error}

Асинхронный ftruncate(2). Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова.

Если файл, на который ссылается файловый дескриптор, был больше, чем `len` байтов, в файле будут сохранены только первые `len` байтов.

For example, the following program retains only the first four bytes of the file:

```js
console.log(fs.readFileSync('temp.txt', 'utf8'));
// Печатает: Node.js

// получить файловый дескриптор файла, который нужно сократить
const fd = fs.openSync('temp.txt', 'r+');

// сократить файл до первых четырех байтов
fs.ftruncate(fd, 4, (err) => {
  assert.ifError(err);
  console.log(fs.readFileSync('temp.txt', 'utf8'));
});
// Печатает: Node
```

If the file previously was shorter than `len` bytes, it is extended, and the extended part is filled with null bytes (`'\0'`):

```js
console.log(fs.readFileSync('temp.txt', 'utf8'));
// Печатает: Node.js

// получить файловый дескриптор файла, который нужно сократить
const fd = fs.openSync('temp.txt', 'r+');

// сократить файл до 10 байтов, когда фактический размер составляет 7 байтов
fs.ftruncate(fd, 10, (err) => {
  assert.ifError(err);
  console.log(fs.readFileSync('temp.txt'));
});
// Печатает: <Buffer 4e 6f 64 65 2e 6a 73 00 00 00>
// ('Node.js\0\0\0' in UTF8)
```

The last three bytes are null bytes (`'\0'`), to compensate the over-truncation.

## fs.ftruncateSync(fd[, len])
<!-- YAML
added: v0.8.6
-->

* `fd` {integer}
* `len` {integer} **Default:** `0`

Возвращает `undefined`.

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

* `fd` {integer}
* `atime` {number|string|Date}
* `mtime` {number|string|Date}
* `callback` {Function}
  * `err` {Error}

Change the file system timestamps of the object referenced by the supplied file descriptor. See [`fs.utimes()`][].

This function does not work on AIX versions before 7.1, it will return the error `UV_ENOSYS`.

## fs.futimesSync(fd, atime, mtime)
<!-- YAML
added: v0.4.2
changes:
  - version: v4.1.0
    pr-url: https://github.com/nodejs/node/pull/2387
    description: Numeric strings, `NaN` and `Infinity` are now allowed
                 time specifiers.
-->

* `fd` {integer}
* `atime` {integer}
* `mtime` {integer}

Синхронная версия [`fs.futimes()`][]. Возвращает `undefined`.

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
* `mode` {integer}
* `callback` {Function}
  * `err` {Error}

Асинхронный lchmod(2). Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова.

Доступно только на macOS.

## fs.lchmodSync(path, mode)
<!-- YAML
deprecated: v0.4.7
-->

* `path` {string|Buffer|URL}
* `mode` {integer}

Синхронный lchmod(2). Возвращает `undefined`.

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
* `uid` {integer}
* `gid` {integer}
* `callback` {Function}
  * `err` {Error}

Асинхронный lchown(2). Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова.

## fs.lchownSync(path, uid, gid)
<!-- YAML
changes:
  - version: v10.6.0
    pr-url: https://github.com/nodejs/node/pull/21498
    description: This API is no longer deprecated.
-->

* `path` {string|Buffer|URL}
* `uid` {integer}
* `gid` {integer}

Синхронный lchown(2). Возвращает `undefined`.

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

Асинхронный link(2). Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова.

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

Синхронный link(2). Возвращает `undefined`.

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
* `options` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **По умолчанию:** `false`.
* `callback` {Function}
  * `err` {Error}
  * `stats` {fs.Stats}

Асинхронный lstat(2). Обратный вызов получает два аргумента `(err, stats)`, где `stats` является объектом [`fs.Stats`][]. `lstat()` идентичен `stat()`, за исключением того, что, если `path` является символической ссылкой, то сама ссылка обрабатывается stat, а не файл, на который она ссылается.

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
* `options` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **По умолчанию:** `false`.
* Returns: {fs.Stats}

Синхронный lstat(2).

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
* `options` {Object|integer}
  * `recursive` {boolean} **Default:** `false`
  * `mode` {integer} Not supported on Windows. **Default:** `0o777`.
* `callback` {Function}
  * `err` {Error}

Асинхронно создает каталог. Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова.

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

See also: mkdir(2).

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
* `options` {Object|integer}
  * `recursive` {boolean} **Default:** `false`
  * `mode` {integer} Not supported on Windows. **Default:** `0o777`.

Синхронно создает каталог. Возвращает `undefined`. Синхронная версия [`fs.mkdir()`][].

See also: mkdir(2).

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
* `options` {string|Object}
  * `encoding` {string} **По умолчанию:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `folder` {string}

Создает уникальный временный каталог.

Генерирует шесть случайных символов, которые будут добавлены после необходимого `prefix` для создания уникального временного каталога.

Созданный путь к папке передается второму параметру обратного вызова в качестве строки.

Опциональный аргумент `options` может быть строкой, указывающей кодировку, или объектом со свойством `encoding`, который определяет используемую кодировку символов.

```js
fs.mkdtemp(path.join(os.tmpdir(), 'foo-'), (err, folder) => {
  if (err) throw err;
  console.log(folder);
  // Печатает: /tmp/foo-itXde2 or C:\Users\...\AppData\Local\Temp\foo-itXde2
});
```

The `fs.mkdtemp()` method will append the six randomly selected characters directly to the `prefix` string. For instance, given a directory `/tmp`, if the intention is to create a temporary directory *within* `/tmp`, the `prefix` must end with a trailing platform-specific path separator (`require('path').sep`).

```js
// Родительский каталог для нового временного каталога
const tmpDir = os.tmpdir();

// Этот метод *НЕПРАВИЛЬНЫЙ*:
fs.mkdtemp(tmpDir, (err, folder) => {
  if (err) throw err;
  console.log(folder);
  // Напечатает что-то похожее на `/tmpabc123`.
  // A new temporary directory is created at the file system root
  // rather than *within* the /tmp directory.
});

// Этот метод *ПРАВИЛЬНЫЙ*:
const { sep } = require('path');
fs.mkdtemp(`${tmpDir}${sep}`, (err, folder) => {
  if (err) throw err;
  console.log(folder);
  // Напечатает что-то похожее на `/tmp/abc123`.
  // Новый временный каталог создается в
  // каталоге /tmp.
});
```

## fs.mkdtempSync(prefix[, options])
<!-- YAML
added: v5.10.0
-->

* `prefix` {string}
* `options` {string|Object}
  * `encoding` {string} **По умолчанию:** `'utf8'`
* Возвращает: {string}

Returns the created folder path.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.mkdtemp()`][].

Опциональный аргумент `options` может быть строкой, указывающей кодировку, или объектом со свойством `encoding`, который определяет используемую кодировку символов.

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
* `flags` {string|number} See [support of file system `flags`][]. **Default:** `'r'`.
* `mode` {integer} **Default:** `0o666` (readable and writable)
* `callback` {Function}
  * `err` {Error}
  * `fd` {integer}

Асинхронное открытие файла. См. open(2).

`mode` устанавливает режим файла (разрешение и sticky-биты), но только если файл был создан. On Windows, only the write permission can be manipulated; see [`fs.chmod()`][].

Обратный вызов принимает два аргумента `(err, fd)`.

Некоторые символы (`< > : " / \ | ? *`) are reserved under Windows as documented by [Naming Files, Paths, and Namespaces](https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file). Under NTFS, if the filename contains a colon, Node.js will open a file system stream, as described by [this MSDN page](https://docs.microsoft.com/en-us/windows/desktop/FileIO/using-streams).

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
* `mode` {integer} **Default:** `0o666`
* Возвращает: {number}

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

* `fd` {integer}
* `buffer` {Buffer|TypedArray|DataView}
* `offset` {integer}
* `length` {integer}
* `position` {integer}
* `callback` {Function}
  * `err` {Error}
  * `bytesRead` {integer}
  * `buffer` {Buffer}

Читает данные из файла, указанного `fd`.

`buffer` - буфер, на который будут записаны данные.

`offset` - смещение в буфере, чтобы начать запись.

`length` - целое число, которое указывает количество байтов для чтения.

`position` - аргумент, указывающий, где начать чтение из файла. Если `position` равен `null`, данные будут считываться с текущей позиции файла и положение файла будет обновлено. Если `position` - целое число, позиция файла останется неизменной.

Обратному вызову дается три аргумента `(err, bytesRead, buffer)`.

If this method is invoked as its [`util.promisify()`][]ed version, it returns a `Promise` for an `Object` with `bytesRead` and `buffer` properties.

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
* `options` {string|Object}
  * `encoding` {string} **По умолчанию:** `'utf8'`
  * `withFileTypes` {boolean} **Default:** `false`
* `callback` {Function}
  * `err` {Error}
  * `files` {string[]|Buffer[]|fs.Dirent[]}

Асинхронный readdir(3). Считывает содержимое каталога. Обратный вызов получает два аргумента `(err, files)`, где `files` - массив имен файлов в каталоге, за исключением `'.'` и `'..'`.

Опциональный аргумент `options` может быть строкой, указывающей кодировку, или объектом со свойством `encoding`, определяющим используемую кодировку имен файлов, переданных обратному вызову. Если `encoding` установлен на `'buffer'`, возвращаемые имена файлов будут переданы в качестве объектов `Buffer`.

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
* `options` {string|Object}
  * `encoding` {string} **По умолчанию:** `'utf8'`
  * `withFileTypes` {boolean} **Default:** `false`
* Returns: {string[]|Buffer[]|fs.Dirent[]}

Синхронный readdir(3).

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use for the filenames returned. Если `encoding` установлен на `'buffer'`, возвращаемые имена файлов будут переданы в качестве объектов `Buffer`.

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

* `path` {string|Buffer|URL|integer} filename or file descriptor
* `options` {Object|string}
  * `encoding` {string|null} **Default:** `null`
  * `flag` {string} See [support of file system `flags`][]. **Default:** `'r'`.
* `callback` {Function}
  * `err` {Error}
  * `data` {string|Buffer}

Асинхронно считывает все содержимое файла.

```js
fs.readFile('/etc/passwd', (err, data) => {
  if (err) throw err;
  console.log(data);
});
```

Обратному вызову передается два аргумента `(err, data)`, где `data` - содержимое файла.

Если кодировка не указана, то вернется необработанный буфер.

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

### File Descriptors
1. Любой указанный файловый дескриптор должен поддерживать чтение.
2. If a file descriptor is specified as the `path`, it will not be closed automatically.
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

* `path` {string|Buffer|URL|integer} filename or file descriptor
* `options` {Object|string}
  * `encoding` {string|null} **Default:** `null`
  * `flag` {string} See [support of file system `flags`][]. **Default:** `'r'`.
* Returns: {string|Buffer}

Returns the contents of the `path`.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.readFile()`][].

Если указана опция `encoding`, то функция вернет строку. В противном случае она возвращает буфер.

Similar to [`fs.readFile()`][], when the path is a directory, the behavior of `fs.readFileSync()` is platform-specific.

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
* `options` {string|Object}
  * `encoding` {string} **По умолчанию:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `linkString` {string|Buffer}

Асинхронный readlink(2). Обратный вызов принимает два аргумента `(err, linkString)`.

Опциональный аргумент `options` может быть строкой, указывающей кодировку, или объектом со свойством `encoding`, определяющим кодировку символов, которая используется для пути ссылки, передаваемого обратному вызову. Если `encoding` установлен на `'buffer'`, возвращаемый путь ссылки будет передаваться в качестве объекта `Buffer`.

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
* `options` {string|Object}
  * `encoding` {string} **По умолчанию:** `'utf8'`
* Returns: {string|Buffer}

Синхронный readlink(2). Возвращает значение строки символической ссылки.

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use for the link path returned. Если `encoding` установлен на `'buffer'`, возвращаемый путь ссылки будет передаваться в качестве объекта `Buffer`.

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

* `fd` {integer}
* `buffer` {Buffer|TypedArray|DataView}
* `offset` {integer}
* `length` {integer}
* `position` {integer}
* Возвращает: {number}

Возвращает количество `bytesRead`.

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
* `options` {string|Object}
  * `encoding` {string} **По умолчанию:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `resolvedPath` {string|Buffer}

Asynchronously computes the canonical pathname by resolving `.`, `..` and symbolic links.

A canonical pathname is not necessarily unique. Hard links and bind mounts can expose a file system entity through many pathnames.

This function behaves like realpath(3), with some exceptions:

1. No case conversion is performed on case-insensitive file systems.

2. The maximum number of symbolic links is platform-independent and generally (much) higher than what the native realpath(3) implementation supports.

The `callback` gets two arguments `(err, resolvedPath)`. May use `process.cwd` to resolve relative paths.

Поддерживаются только те пути, которые могут быть преобразованы в строки UTF8.

Опциональный аргумент `options` может быть строкой, указывающей кодировку, или объектом со свойством `encoding`, определяющим используемую кодировку для пути, который передается обратному вызову. Если `encoding` установлен на `'buffer'`, то возвращаемый путь будет передан в качестве объекта `Buffer`.

If `path` resolves to a socket or a pipe, the function will return a system dependent name for that object.

## fs.realpath.native(path[, options], callback)
<!-- YAML
added: v9.2.0
-->

* `path` {string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} **По умолчанию:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `resolvedPath` {string|Buffer}

Асинхронный realpath(3).

The `callback` gets two arguments `(err, resolvedPath)`.

Поддерживаются только те пути, которые могут быть преобразованы в строки UTF8.

Опциональный аргумент `options` может быть строкой, указывающей кодировку, или объектом со свойством `encoding`, определяющим используемую кодировку для пути, который передается обратному вызову. Если `encoding` установлен на `'buffer'`, то возвращаемый путь будет передан в качестве объекта `Buffer`.

On Linux, when Node.js is linked against musl libc, the procfs file system must be mounted on `/proc` in order for this function to work. Glibc does not have this restriction.

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
* `options` {string|Object}
  * `encoding` {string} **По умолчанию:** `'utf8'`
* Returns: {string|Buffer}

Returns the resolved pathname.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.realpath()`][].

## fs.realpathSync.native(path[, options])
<!-- YAML
added: v9.2.0
-->

* `path` {string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} **По умолчанию:** `'utf8'`
* Returns: {string|Buffer}

Синхронный realpath(3).

Поддерживаются только те пути, которые могут быть преобразованы в строки UTF8.

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use for the path returned. Если `encoding` установлен на `'buffer'`, то возвращаемый путь будет передан в качестве объекта `Buffer`.

On Linux, when Node.js is linked against musl libc, the procfs file system must be mounted on `/proc` in order for this function to work. Glibc does not have this restriction.

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

Asynchronously rename file at `oldPath` to the pathname provided as `newPath`. In the case that `newPath` already exists, it will be overwritten. Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова.

See also: rename(2).

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

Синхронный rename(2). Возвращает `undefined`.

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

Асинхронный rmdir(2). Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова.

Using `fs.rmdir()` on a file (not a directory) results in an `ENOENT` error on Windows and an `ENOTDIR` error on POSIX.

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

Синхронный rmdir(2). Возвращает `undefined`.

Using `fs.rmdirSync()` on a file (not a directory) results in an `ENOENT` error on Windows and an `ENOTDIR` error on POSIX.

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
* `options` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **По умолчанию:** `false`.
* `callback` {Function}
  * `err` {Error}
  * `stats` {fs.Stats}

Асинхронный stat(2). Обратный вызов получает два аргумента `(err, stats)`, где `stats` является объектом [`fs.Stats`][].

В случае ошибки `err.code` будет одной из [Общих Системных Ошибок](errors.html#errors_common_system_errors).

Не рекомендуется использовать `fs.stat()` для проверки наличия файла перед вызовом `fs.open()`, `fs.readFile()` или `fs.writeFile()`. Вместо этого пользовательский код должен открывать/читать/записывать файл напрямую и обрабатывать возникшую ошибку, если файл недоступен.

Для проверки наличия файла без дальнейшего манипулирования им, рекомендуется [`fs.access()`].

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
* `options` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **По умолчанию:** `false`.
* Returns: {fs.Stats}

Синхронный stat(2).

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
* `type` {string} **Default:** `'file'`
* `callback` {Function}
  * `err` {Error}

Асинхронный symlink(2). Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова. The `type` argument can be set to `'dir'`, `'file'`, or `'junction'` and is only available on Windows (ignored on other platforms). Windows junction points require the destination path to be absolute. When using `'junction'`, the `target` argument will automatically be normalized to absolute path.

Ниже приведен пример:

```js
fs.symlink('./foo', './new-port', callback);
```

Создает символическую ссылку с именем "new-port", которая указывает на "foo".

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
* `type` {string} **Default:** `'file'`

Возвращает `undefined`.

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
* `len` {integer} **Default:** `0`
* `callback` {Function}
  * `err` {Error}

Асинхронный truncate(2). Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова. Файловый дескриптор также может передаваться в качестве первого аргумента. В этом случае вызывается `fs.ftruncate()`.

Passing a file descriptor is deprecated and may result in an error being thrown in the future.

## fs.truncateSync(path[, len])
<!-- YAML
added: v0.8.6
-->

* `path` {string|Buffer|URL}
* `len` {integer} **Default:** `0`

Синхронный truncate(2). Возвращает `undefined`. Файловый дескриптор также может передаваться в качестве первого аргумента. В этом случае вызывается `fs.ftruncateSync()`.

Passing a file descriptor is deprecated and may result in an error being thrown in the future.

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

Asynchronously removes a file or symbolic link. Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова.

```js
// Assuming that 'path/file.txt' is a regular file.
fs.unlink('path/file.txt', (err) => {
  if (err) throw err;
  console.log('path/file.txt was deleted');
});
```

`fs.unlink()` will not work on a directory, empty or otherwise. To remove a directory, use [`fs.rmdir()`][].

See also: unlink(2).

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

Синхронный unlink(2). Возвращает `undefined`.

## fs.unwatchFile(filename[, listener])
<!-- YAML
added: v0.1.31
-->

* `filename` {string|Buffer|URL}
* `listener` {Function} Optional, a listener previously attached using `fs.watchFile()`

Остановить отслеживание изменений на `filename`. Если указан `listener`, то удаляется только этот конкретный слушатель. Otherwise, *all* listeners are removed, effectively stopping watching of `filename`.

Вызов `fs.unwatchFile()` с именем файла, который не отслеживается, является пустой операцией, а не ошибкой.

Using [`fs.watch()`][] is more efficient than `fs.watchFile()` and `fs.unwatchFile()`. `fs.watch()` should be used instead of `fs.watchFile()` and `fs.unwatchFile()` when possible.

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

Change the file system timestamps of the object referenced by `path`.

The `atime` and `mtime` arguments follow these rules:
- Values can be either numbers representing Unix epoch time, `Date`s, or a numeric string like `'123456789.0'`.
- If the value can not be converted to a number, or is `NaN`, `Infinity` or `-Infinity`, an `Error` will be thrown.

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

Возвращает `undefined`.

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
* `options` {string|Object}
  * `persistent` {boolean} Указывает, должен ли процесс продолжаться до тех пор, пока файлы отслеживаются. **Default:** `true`.
  * `recursive` {boolean} Указывает, следует ли отслеживать все подкаталоги или только текущий каталог. This applies when a directory is specified, and only on supported platforms (See [Caveats](#fs_caveats)). **Default:** `false`.
  * `encoding` {string} Определяет кодировку символов, которая будет использоваться для имени файла, переданного слушателю. **Default:** `'utf8'`.
* `listener` {Function|undefined} **Default:** `undefined`
  * `eventType` {string}
  * `filename` {string|Buffer}
* Returns: {fs.FSWatcher}

Следите за изменениями в `filename`, где `filename` является файлом или каталогом.

Второй аргумент является необязательным. Если `options` предоставляется в виде строки, это указывает `encoding`. В противном случае параметр `options` передается в качестве объекта.

Обратный вызов слушателя получит два аргумента `(eventType, filename)`. `eventType` is either `'rename'` or `'change'`, and `filename` is the name of the file which triggered the event.

On most platforms, `'rename'` is emitted whenever a filename appears or disappears in the directory.

The listener callback is attached to the `'change'` event fired by [`fs.FSWatcher`][], but it is not the same thing as the `'change'` value of `eventType`.

### Предупреждения

<!--type=misc-->

API `fs.watch` не на 100% совместим с разными платформами и не доступен в некоторых ситуациях.

Рекурсивная опция поддерживается только на macOS and Windows.

#### Доступность

<!--type=misc-->

Эта функция зависит от базовой операционной системы, обеспечивающей возможность получать уведомления об изменениях файловой системы.

* On Linux systems, this uses [`inotify(7)`].
* On BSD systems, this uses [`kqueue(2)`].
* On macOS, this uses [`kqueue(2)`] for files and [`FSEvents`] for directories.
* В системах SunOS (включая Solaris и SmartOS) используется [`event ports`].
* В системах Windows эта функция зависит от [`ReadDirectoryChangesW`].
* В системах Aix эта функция зависит от [`AHAFS`], который должен быть включен.

Если базовая функция недоступна по какой-либо причине, то `fs.watch` не сможет функционировать. Например, просмотр файлов или каталогов может быть ненадежным, а в некоторых случаях невозможным, в частности в сетевых файловых системах (NFS, SMB и др.) или файловых системах хоста при использовании программного обеспечения для виртуализации, таких как Vagrant, Docker и др.

It is still possible to use `fs.watchFile()`, which uses stat polling, but this method is slower and less reliable.

#### Индексные дескрипторы

<!--type=misc-->

В системах Linux и macOS `fs.watch()` разрешает путь к [индексному дескриптору](https://en.wikipedia.org/wiki/Inode) и отслеживает этот индексный дескриптор. Если отслеживаемый путь удален или воссоздан, ему присваивается новый индексный дескриптор. Отслеживание создаст событие для удаления, но продолжит отслеживать *оригинальный* индексный дескриптор. События для нового индексного дескриптора не будут созданы. Это ожидаемое поведение.

AIX files retain the same inode for the lifetime of a file. Saving and closing a watched file on AIX will result in two notifications (one for adding new content, and one for truncation).

#### Аргумент имени файла

<!--type=misc-->

Providing `filename` argument in the callback is only supported on Linux, macOS, Windows, and AIX. Even on supported platforms, `filename` is not always guaranteed to be provided. Therefore, don't assume that `filename` argument is always provided in the callback, and have some fallback logic if it is `null`.

```js
fs.watch('somedir', (eventType, filename) => {
  console.log(`тип события: ${eventType}`);
  if (filename) {
    console.log(`имя файла предоставлено: ${filename}`);
  } else {
    console.log('имя файла не предоставлено');
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
* `options` {Object}
  * `persistent` {boolean} **Default:** `true`
  * `interval` {integer} **Default:** `5007`
* `listener` {Function}
  * `current` {fs.Stats}
  * `previous` {fs.Stats}

Отслеживание изменений в `filename`. `listener` обратного вызова будет вызываться при каждом доступе к файлу.

Аргумент `options` может быть опущен. Если он предусмотрен, то должен быть объектом. Объект `options` может содержать `persistent` с логическим именем, которое указывает, должен ли процесс продолжаться до тех пор, пока отслеживаются файлы. Объект `options` может указывать свойство `interval`, которое указывает, как часто цель должна опрашиваться в миллисекундах.

`listener` получает два аргумента - текущий stat объект и предыдущий stat объект:

```js
fs.watchFile('message.text', (curr, prev) => {
  console.log(`текущий mtime: ${curr.mtime}`);
  console.log(`предыдущий mtime был: ${prev.mtime}`);
});
```

Эти stat объекты являются экземплярами `fs.Stat`.

To be notified when the file was modified, not just accessed, it is necessary to compare `curr.mtime` and `prev.mtime`.

When an `fs.watchFile` operation results in an `ENOENT` error, it will invoke the listener once, with all the fields zeroed (or, for dates, the Unix Epoch). In Windows, `blksize` and `blocks` fields will be `undefined`, instead of zero. If the file is created later on, the listener will be called again, with the latest stat objects. This is a change in functionality since v0.10.

Using [`fs.watch()`][] is more efficient than `fs.watchFile` and `fs.unwatchFile`. Когда это возможно, `fs.watch` должен использоваться вместо `fs.watchFile` и `fs.unwatchFile`.

When a file being watched by `fs.watchFile()` disappears and reappears, then the `previousStat` reported in the second callback event (the file's reappearance) will be the same as the `previousStat` of the first callback event (its disappearance).

Это происходит, когда:
- файл удален с последующим восстановлением
- переименование файла дважды - возвращение к изначальному имени во второй раз

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

* `fd` {integer}
* `buffer` {Buffer|TypedArray|DataView}
* `offset` {integer}
* `length` {integer}
* `position` {integer}
* `callback` {Function}
  * `err` {Error}
  * `bytesWritten` {integer}
  * `buffer` {Buffer|TypedArray|DataView}

Запись `buffer` в файл, указанный `fd`.

`offset` определяет часть буфера для записи, а `length` - целое число, указывающее количество байтов для записи.

`position` относится к смещению от начала файла, в котором эти данные должны быть записаны. Если `typeof position !== 'number'`, данные будут записаны в текущей позиции. Смотрите pwrite(2).

The callback will be given three arguments `(err, bytesWritten, buffer)` where `bytesWritten` specifies how many _bytes_ were written from `buffer`.

If this method is invoked as its [`util.promisify()`][]ed version, it returns a `Promise` for an `Object` with `bytesWritten` and `buffer` properties.

It is unsafe to use `fs.write()` multiple times on the same file without waiting for the callback. For this scenario, [`fs.createWriteStream()`][] is recommended.

В Linux позиционные записи не работают, когда файл открыт в режиме добавления. Ядро игнорирует позиционный аргумент и всегда добавляет данные в конец файла.

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

* `fd` {integer}
* `string` {string}
* `position` {integer}
* `encoding` {string} **По умолчанию:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `written` {integer}
  * `string` {string}

Запись `string` в файл, указанный `fd`. Если `string` не является строкой, то значение будет приведено к одному.

`position` относится к смещению от начала файла, в котором эти данные должны быть записаны. Если `typeof position !== 'number'`, данные будут записаны в текущую позицию. Смотрите pwrite(2).

`encoding` - ожидаемое кодирование строки.

Обратный вызов получит аргументы `(err, written, string)`, где `written` указывает, сколько _bytes_ переданной строки нужно записать. Bytes written is not necessarily the same as string characters written. See [`Buffer.byteLength`][].

It is unsafe to use `fs.write()` multiple times on the same file without waiting for the callback. For this scenario, [`fs.createWriteStream()`][] is recommended.

В Linux позиционные записи не работают, когда файл открыт в режиме добавления. Ядро игнорирует позиционный аргумент и всегда добавляет данные в конец файла.

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

* `file` {string|Buffer|URL|integer} имя файла или файловый дескриптор
* `data` {string|Buffer|TypedArray|DataView}
* `options` {Object|string}
  * `encoding` {string|null} **По умолчанию:** `'utf8'`
  * `mode` {integer} **Default:** `0o666`
  * `flag` {string} See [support of file system `flags`][]. **Default:** `'w'`.
* `callback` {Function}
  * `err` {Error}

Асинхронно записывает данные в файл, заменяя файл, если он уже существует. `data` может быть строкой или буфером.

Опция `encoding` игнорируется, если `data` является буфером.

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

### File Descriptors
1. Любой заданный файловый дескриптор должен поддерживать запись.
2. If a file descriptor is specified as the `file`, it will not be closed automatically.
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

* `file` {string|Buffer|URL|integer} имя файла или файловый дескриптор
* `data` {string|Buffer|TypedArray|DataView}
* `options` {Object|string}
  * `encoding` {string|null} **По умолчанию:** `'utf8'`
  * `mode` {integer} **Default:** `0o666`
  * `flag` {string} See [support of file system `flags`][]. **Default:** `'w'`.

Возвращает `undefined`.

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

* `fd` {integer}
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

* `fd` {integer}
* `string` {string}
* `position` {integer}
* `encoding` {string}
* Returns: {number} The number of bytes written.

For detailed information, see the documentation of the asynchronous version of this API: [`fs.write(fd, string...)`][].

## fs Promises API

> Стабильность: 1 - экспериментальный

The `fs.promises` API provides an alternative set of asynchronous file system methods that return `Promise` objects rather than using callbacks. The API is accessible via `require('fs').promises`.

### class: FileHandle
<!-- YAML
added: v10.0.0
-->

A `FileHandle` object is a wrapper for a numeric file descriptor. Instances of `FileHandle` are distinct from numeric file descriptors in that, if the `FileHandle` is not explicitly closed using the `filehandle.close()` method, they will automatically close the file descriptor and will emit a process warning, thereby helping to prevent memory leaks.

Instances of the `FileHandle` object are created internally by the `fsPromises.open()` method.

Unlike the callback-based API (`fs.fstat()`, `fs.fchown()`, `fs.fchmod()`, and so on), a numeric file descriptor is not used by the promise-based API. Instead, the promise-based API uses the `FileHandle` class in order to help avoid accidental leaking of unclosed file descriptors after a `Promise` is resolved or rejected.

#### filehandle.appendFile(data, options)
<!-- YAML
added: v10.0.0
-->
* `data` {string|Buffer}
* `options` {Object|string}
  * `encoding` {string|null} **По умолчанию:** `'utf8'`
  * `mode` {integer} **Default:** `0o666`
  * `flag` {string} See [support of file system `flags`][]. **Default:** `'a'`.
* Returns: {Promise}

Asynchronously append data to this file, creating the file if it does not yet exist. `data` can be a string or a [`Buffer`][]. The `Promise` will be resolved with no arguments upon success.

Если параметр `options` является строкой, то он указывает кодировку.

The `FileHandle` must have been opened for appending.

#### filehandle.chmod(mode)
<!-- YAML
added: v10.0.0
-->
* `mode` {integer}
* Returns: {Promise}

Modifies the permissions on the file. The `Promise` is resolved with no arguments upon success.

#### filehandle.chown(uid, gid)
<!-- YAML
added: v10.0.0
-->
* `uid` {integer}
* `gid` {integer}
* Returns: {Promise}

Changes the ownership of the file then resolves the `Promise` with no arguments upon success.

#### filehandle.close()
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

#### filehandle.datasync()
<!-- YAML
added: v10.0.0
-->
* Returns: {Promise}

Асинхронный fdatasync(2). The `Promise` is resolved with no arguments upon success.

#### filehandle.fd
<!-- YAML
added: v10.0.0
-->

* {number} The numeric file descriptor managed by the `FileHandle` object.

#### filehandle.read(buffer, offset, length, position)
<!-- YAML
added: v10.0.0
-->
* `buffer` {Buffer|Uint8Array}
* `offset` {integer}
* `length` {integer}
* `position` {integer}
* Returns: {Promise}

Read data from the file.

`buffer` - буфер, на который будут записаны данные.

`offset` - смещение в буфере, чтобы начать запись.

`length` - целое число, которое указывает количество байтов для чтения.

`position` - аргумент, указывающий, где начать чтение из файла. Если `position` равен `null`, данные будут считываться с текущей позиции файла и положение файла будет обновлено. Если `position` - целое число, позиция файла останется неизменной.

Following successful read, the `Promise` is resolved with an object with a `bytesRead` property specifying the number of bytes read, and a `buffer` property that is a reference to the passed in `buffer` argument.

#### filehandle.readFile(options)
<!-- YAML
added: v10.0.0
-->
* `options` {Object|string}
  * `encoding` {string|null} **Default:** `null`
  * `flag` {string} See [support of file system `flags`][]. **Default:** `'r'`.
* Returns: {Promise}

Асинхронно считывает все содержимое файла.

The `Promise` is resolved with the contents of the file. If no encoding is specified (using `options.encoding`), the data is returned as a `Buffer` object. Otherwise, the data will be a string.

Если параметр `options` является строкой, то он указывает кодировку.

When the `path` is a directory, the behavior of `fsPromises.readFile()` is platform-specific. On macOS, Linux, and Windows, the promise will be rejected with an error. On FreeBSD, a representation of the directory's contents will be returned.

The `FileHandle` has to support reading.

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
* `options` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **По умолчанию:** `false`.
* Returns: {Promise}

Retrieves the [`fs.Stats`][] for the file.

#### filehandle.sync()
<!-- YAML
added: v10.0.0
-->
* Returns: {Promise}

Асинхронный fsync(2). The `Promise` is resolved with no arguments upon success.

#### filehandle.truncate(len)
<!-- YAML
added: v10.0.0
-->
* `len` {integer} **Default:** `0`
* Returns: {Promise}

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
      // close the file if it is opened.
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
      // close the file if it is opened.
      await filehandle.close();
    }
  }
  console.log(fs.readFileSync('temp.txt', 'utf8'));  // Prints Node.js\0\0\0
}

doTruncate().catch(console.error);
```

The last three bytes are null bytes (`'\0'`), to compensate the over-truncation.

#### filehandle.utimes(atime, mtime)
<!-- YAML
added: v10.0.0
-->
* `atime` {number|string|Date}
* `mtime` {number|string|Date}
* Returns: {Promise}

Change the file system timestamps of the object referenced by the `FileHandle` then resolves the `Promise` with no arguments upon success.

This function does not work on AIX versions before 7.1, it will resolve the `Promise` with an error using code `UV_ENOSYS`.

#### filehandle.write(buffer, offset, length, position)
<!-- YAML
added: v10.0.0
-->
* `buffer` {Buffer|Uint8Array}
* `offset` {integer}
* `length` {integer}
* `position` {integer}
* Returns: {Promise}

Write `buffer` to the file.

The `Promise` is resolved with an object containing a `bytesWritten` property identifying the number of bytes written, and a `buffer` property containing a reference to the `buffer` written.

`offset` определяет часть буфера для записи, а `length` - целое число, указывающее количество байтов для записи.

`position` относится к смещению от начала файла, в котором эти данные должны быть записаны. Если `typeof position !== 'number'`, данные будут записаны в текущей позиции. Смотрите pwrite(2).

It is unsafe to use `filehandle.write()` multiple times on the same file without waiting for the `Promise` to be resolved (or rejected). For this scenario, [`fs.createWriteStream()`][] is strongly recommended.

On Linux, positional writes do not work when the file is opened in append mode. Ядро игнорирует позиционный аргумент и всегда добавляет данные в конец файла.

#### filehandle.write(string[, position[, encoding]])
<!-- YAML
added: v10.0.0
-->

* `string` {string}
* `position` {integer}
* `encoding` {string} **По умолчанию:** `'utf8'`
* Returns: {Promise}

Write `string` to the file. Если `string` не является строкой, то значение будет приведено к одному.

The `Promise` is resolved with an object containing a `bytesWritten` property identifying the number of bytes written, and a `buffer` property containing a reference to the `string` written.

`position` относится к смещению от начала файла, в котором эти данные должны быть записаны. If the type of `position` is not a `number` the data will be written at the current position. Смотрите pwrite(2).

`encoding` - ожидаемое кодирование строки.

It is unsafe to use `filehandle.write()` multiple times on the same file without waiting for the `Promise` to be resolved (or rejected). For this scenario, [`fs.createWriteStream()`][] is strongly recommended.

On Linux, positional writes do not work when the file is opened in append mode. Ядро игнорирует позиционный аргумент и всегда добавляет данные в конец файла.

#### filehandle.writeFile(data, options)
<!-- YAML
added: v10.0.0
-->
* `data` {string|Buffer|Uint8Array}
* `options` {Object|string}
  * `encoding` {string|null} **По умолчанию:** `'utf8'`
  * `mode` {integer} **Default:** `0o666`
  * `flag` {string} See [support of file system `flags`][]. **Default:** `'w'`.
* Returns: {Promise}

Асинхронно записывает данные в файл, заменяя файл, если он уже существует. `data` может быть строкой или буфером. The `Promise` will be resolved with no arguments upon success.

Опция `encoding` игнорируется, если `data` является буфером.

Если параметр `options` является строкой, то он указывает кодировку.

The `FileHandle` has to support writing.

It is unsafe to use `filehandle.writeFile()` multiple times on the same file without waiting for the `Promise` to be resolved (or rejected).

If one or more `filehandle.write()` calls are made on a file handle and then a `filehandle.writeFile()` call is made, the data will be written from the current position till the end of the file. It doesn't always write from the beginning of the file.

### fsPromises.access(path[, mode])
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL}
* `mode` {integer} **Default:** `fs.constants.F_OK`
* Returns: {Promise}

Проверяет права пользователя для файла или каталога, указанного с помощью `path`. Аргумент `mode` - опциональное целое число, которое задает необходимое выполнение проверок доступности. Check [File Access Constants](#fs_file_access_constants) for possible values of `mode`. It is possible to create a mask consisting of the bitwise OR of two or more values (e.g. `fs.constants.W_OK | fs.constants.R_OK`).

If the accessibility check is successful, the `Promise` is resolved with no value. If any of the accessibility checks fail, the `Promise` is rejected with an `Error` object. Следующий пример проверяет, может ли текущий процесс прочитать и записать файл `/etc/passwd`.

```js
const fs = require('fs');
const fsPromises = fs.promises;

fsPromises.access('/etc/passwd', fs.constants.R_OK | fs.constants.W_OK)
  .then(() => console.log('can access'))
  .catch(() => console.error('cannot access'));
```

Using `fsPromises.access()` to check for the accessibility of a file before calling `fsPromises.open()` is not recommended. Doing so introduces a race condition, since other processes may change the file's state between the two calls. Instead, user code should open/read/write the file directly and handle the error raised if the file is not accessible.

### fsPromises.appendFile(path, data[, options])
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL|FileHandle} filename or `FileHandle`
* `data` {string|Buffer}
* `options` {Object|string}
  * `encoding` {string|null} **По умолчанию:** `'utf8'`
  * `mode` {integer} **Default:** `0o666`
  * `flag` {string} See [support of file system `flags`][]. **Default:** `'a'`.
* Returns: {Promise}

Asynchronously append data to a file, creating the file if it does not yet exist. `data` can be a string or a [`Buffer`][]. The `Promise` will be resolved with no arguments upon success.

Если параметр `options` является строкой, то он указывает кодировку.

The `path` may be specified as a `FileHandle` that has been opened for appending (using `fsPromises.open()`).

### fsPromises.chmod(path, mode)
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL}
* `mode` {integer}
* Returns: {Promise}

Changes the permissions of a file then resolves the `Promise` with no arguments upon succces.

### fsPromises.chown(path, uid, gid)
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL}
* `uid` {integer}
* `gid` {integer}
* Returns: {Promise}

Changes the ownership of a file then resolves the `Promise` with no arguments upon success.

### fsPromises.copyFile(src, dest[, flags])
<!-- YAML
added: v10.0.0
-->

* `src` {string|Buffer|URL} source filename to copy
* `dest` {string|Buffer|URL} destination filename of the copy operation
* `flags` {number} modifiers for copy operation. **Default:** `0`.
* Returns: {Promise}

Asynchronously copies `src` to `dest`. By default, `dest` is overwritten if it already exists. The `Promise` will be resolved with no arguments upon success.

Node.js makes no guarantees about the atomicity of the copy operation. If an error occurs after the destination file has been opened for writing, Node.js will attempt to remove the destination.

`flags` is an optional integer that specifies the behavior of the copy operation. It is possible to create a mask consisting of the bitwise OR of two or more values (e.g. `fs.constants.COPYFILE_EXCL | fs.constants.COPYFILE_FICLONE`).

* `fs.constants.COPYFILE_EXCL` - The copy operation will fail if `dest` already exists.
* `fs.constants.COPYFILE_FICLONE` - The copy operation will attempt to create a copy-on-write reflink. If the platform does not support copy-on-write, then a fallback copy mechanism is used.
* `fs.constants.COPYFILE_FICLONE_FORCE` - The copy operation will attempt to create a copy-on-write reflink. If the platform does not support copy-on-write, then the operation will fail.

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
* `mode` {integer}
* Returns: {Promise}

Changes the permissions on a symbolic link then resolves the `Promise` with no arguments upon success. This method is only implemented on macOS.

### fsPromises.lchown(path, uid, gid)
<!-- YAML
added: v10.0.0
changes:
  - version: v10.6.0
    pr-url: https://github.com/nodejs/node/pull/21498
    description: This API is no longer deprecated.
-->

* `path` {string|Buffer|URL}
* `uid` {integer}
* `gid` {integer}
* Returns: {Promise}

Changes the ownership on a symbolic link then resolves the `Promise` with no arguments upon success.

### fsPromises.link(existingPath, newPath)
<!-- YAML
added: v10.0.0
-->

* `existingPath` {string|Buffer|URL}
* `newPath` {string|Buffer|URL}
* Returns: {Promise}

Асинхронный link(2). The `Promise` is resolved with no arguments upon success.

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
* `options` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **По умолчанию:** `false`.
* Returns: {Promise}

Асинхронный lstat(2). The `Promise` is resolved with the [`fs.Stats`][] object for the given symbolic link `path`.

### fsPromises.mkdir(path[, options])
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL}
* `options` {Object|integer}
  * `recursive` {boolean} **Default:** `false`
  * `mode` {integer} Not supported on Windows. **Default:** `0o777`.
* Returns: {Promise}

Asynchronously creates a directory then resolves the `Promise` with no arguments upon success.

The optional `options` argument can be an integer specifying mode (permission and sticky bits), or an object with a `mode` property and a `recursive` property indicating whether parent folders should be created.

### fsPromises.mkdtemp(prefix[, options])
<!-- YAML
added: v10.0.0
-->

* `prefix` {string}
* `options` {string|Object}
  * `encoding` {string} **По умолчанию:** `'utf8'`
* Returns: {Promise}

Creates a unique temporary directory and resolves the `Promise` with the created folder path. A unique directory name is generated by appending six random characters to the end of the provided `prefix`.

Опциональный аргумент `options` может быть строкой, указывающей кодировку, или объектом со свойством `encoding`, который определяет используемую кодировку символов.

```js
fsPromises.mkdtemp(path.join(os.tmpdir(), 'foo-'))
  .catch(console.error);
```

The `fsPromises.mkdtemp()` method will append the six randomly selected characters directly to the `prefix` string. For instance, given a directory `/tmp`, if the intention is to create a temporary directory *within* `/tmp`, the `prefix` must end with a trailing platform-specific path separator (`require('path').sep`).

### fsPromises.open(path, flags[, mode])
<!-- YAML
added: v10.0.0
changes:
  - version: v11.1.0
    pr-url: https://github.com/nodejs/node/pull/23767
    description: The `flags` argument is now optional and defaults to `'r'`.
-->

* `path` {string|Buffer|URL}
* `flags` {string|number} See [support of file system `flags`][]. **Default:** `'r'`.
* `mode` {integer} **Default:** `0o666` (readable and writable)
* Returns: {Promise}

Asynchronous file open that returns a `Promise` that, when resolved, yields a `FileHandle` object. См. open(2).

`mode` устанавливает режим файла (разрешение и sticky-биты), но только если файл был создан.

Некоторые символы (`< > : " / \ | ? *`) are reserved under Windows as documented by [Naming Files, Paths, and Namespaces](https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file). Under NTFS, if the filename contains a colon, Node.js will open a file system stream, as described by [this MSDN page](https://docs.microsoft.com/en-us/windows/desktop/FileIO/using-streams).

### fsPromises.readdir(path[, options])
<!-- YAML
added: v10.0.0
changes:
  - version: v10.11.0
    pr-url: https://github.com/nodejs/node/pull/22020
    description: New option `withFileTypes` was added.
-->

* `path` {string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} **По умолчанию:** `'utf8'`
  * `withFileTypes` {boolean} **Default:** `false`
* Returns: {Promise}

Reads the contents of a directory then resolves the `Promise` with an array of the names of the files in the directory excluding `'.'` and `'..'`.

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use for the filenames. If the `encoding` is set to `'buffer'`, the filenames returned will be passed as `Buffer` objects.

If `options.withFileTypes` is set to `true`, the resolved array will contain [`fs.Dirent`][] objects.

### fsPromises.readFile(path[, options])
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL|FileHandle} filename or `FileHandle`
* `options` {Object|string}
  * `encoding` {string|null} **Default:** `null`
  * `flag` {string} See [support of file system `flags`][]. **Default:** `'r'`.
* Returns: {Promise}

Асинхронно считывает все содержимое файла.

The `Promise` is resolved with the contents of the file. If no encoding is specified (using `options.encoding`), the data is returned as a `Buffer` object. Otherwise, the data will be a string.

Если параметр `options` является строкой, то он указывает кодировку.

When the `path` is a directory, the behavior of `fsPromises.readFile()` is platform-specific. On macOS, Linux, and Windows, the promise will be rejected with an error. On FreeBSD, a representation of the directory's contents will be returned.

Any specified `FileHandle` has to support reading.

### fsPromises.readlink(path[, options])
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} **По умолчанию:** `'utf8'`
* Returns: {Promise}

Асинхронный readlink(2). The `Promise` is resolved with the `linkString` upon success.

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use for the link path returned. If the `encoding` is set to `'buffer'`, the link path returned will be passed as a `Buffer` object.

### fsPromises.realpath(path[, options])
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL}
* `options` {string|Object}
  * `encoding` {string} **По умолчанию:** `'utf8'`
* Returns: {Promise}

Determines the actual location of `path` using the same semantics as the `fs.realpath.native()` function then resolves the `Promise` with the resolved path.

Поддерживаются только те пути, которые могут быть преобразованы в строки UTF8.

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use for the path. If the `encoding` is set to `'buffer'`, the path returned will be passed as a `Buffer` object.

On Linux, when Node.js is linked against musl libc, the procfs file system must be mounted on `/proc` in order for this function to work. Glibc does not have this restriction.

### fsPromises.rename(oldPath, newPath)
<!-- YAML
added: v10.0.0
-->

* `oldPath` {string|Buffer|URL}
* `newPath` {string|Buffer|URL}
* Returns: {Promise}

Renames `oldPath` to `newPath` and resolves the `Promise` with no arguments upon success.

### fsPromises.rmdir(path)
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL}
* Returns: {Promise}

Removes the directory identified by `path` then resolves the `Promise` with no arguments upon success.

Using `fsPromises.rmdir()` on a file (not a directory) results in the `Promise` being rejected with an `ENOENT` error on Windows and an `ENOTDIR` error on POSIX.

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
* `options` {Object}
  * `bigint` {boolean} Whether the numeric values in the returned [`fs.Stats`][] object should be `bigint`. **По умолчанию:** `false`.
* Returns: {Promise}

The `Promise` is resolved with the [`fs.Stats`][] object for the given `path`.

### fsPromises.symlink(target, path[, type])
<!-- YAML
added: v10.0.0
-->

* `target` {string|Buffer|URL}
* `path` {string|Buffer|URL}
* `type` {string} **Default:** `'file'`
* Returns: {Promise}

Creates a symbolic link then resolves the `Promise` with no arguments upon success.

The `type` argument is only used on Windows platforms and can be one of `'dir'`, `'file'`, or `'junction'`. Windows junction points require the destination path to be absolute. When using `'junction'`, the `target` argument will automatically be normalized to absolute path.

### fsPromises.truncate(path[, len])
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL}
* `len` {integer} **Default:** `0`
* Returns: {Promise}

Truncates the `path` then resolves the `Promise` with no arguments upon success. The `path` *must* be a string or `Buffer`.

### fsPromises.unlink(path)
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL}
* Returns: {Promise}

Asynchronous unlink(2). The `Promise` is resolved with no arguments upon success.

### fsPromises.utimes(path, atime, mtime)
<!-- YAML
added: v10.0.0
-->

* `path` {string|Buffer|URL}
* `atime` {number|string|Date}
* `mtime` {number|string|Date}
* Returns: {Promise}

Change the file system timestamps of the object referenced by `path` then resolves the `Promise` with no arguments upon success.

The `atime` and `mtime` arguments follow these rules:
- Values can be either numbers representing Unix epoch time, `Date`s, or a numeric string like `'123456789.0'`.
- If the value can not be converted to a number, or is `NaN`, `Infinity` or `-Infinity`, an `Error` will be thrown.

### fsPromises.writeFile(file, data[, options])
<!-- YAML
added: v10.0.0
-->

* `file` {string|Buffer|URL|FileHandle} filename or `FileHandle`
* `data` {string|Buffer|Uint8Array}
* `options` {Object|string}
  * `encoding` {string|null} **По умолчанию:** `'utf8'`
  * `mode` {integer} **Default:** `0o666`
  * `flag` {string} See [support of file system `flags`][]. **Default:** `'w'`.
* Returns: {Promise}

Асинхронно записывает данные в файл, заменяя файл, если он уже существует. `data` может быть строкой или буфером. The `Promise` will be resolved with no arguments upon success.

Опция `encoding` игнорируется, если `data` является буфером.

Если параметр `options` является строкой, то он указывает кодировку.

Any specified `FileHandle` has to support writing.

It is unsafe to use `fsPromises.writeFile()` multiple times on the same file without waiting for the `Promise` to be resolved (or rejected).

## Константы FS

Следующие константы экспортируются с помощью `fs.constants`.

Not every constant will be available on every operating system.

### Константы доступа к файлу

Следующие константы предназначены для использования с [`fs.access()`][].

<table>
  <tr>
    <th>Константа</th>
    <th>Описание</th>
  </tr>
  <tr>
    <td><code>F_OK</code></td>
    <td>Флаг, указывающий, что файл виден для вызывающего процесса.
     This is useful for determining if a file exists, but says nothing
     about <code>rwx</code> permissions. Default if no mode is specified.</td>
  </tr>
  <tr>
    <td><code>R_OK</code></td>
    <td>Флаг, указывающий, что файл может быть прочитан вызывающим процессом.</td>
  </tr>
  <tr>
    <td><code>W_OK</code></td>
    <td>Флаг, указывающий, что файл может быть записан вызывающим
  процессом.</td>
  </tr>
  <tr>
    <td><code>X_OK</code></td>
    <td>Флаг, указывающий, что файл может быть выполнен вызывающим
   процессом. This has no effect on Windows
    (will behave like <code>fs.constants.F_OK</code>).</td>
  </tr>
</table>

### File Copy Constants

The following constants are meant for use with [`fs.copyFile()`][].

<table>
  <tr>
    <th>Константа</th>
    <th>Описание</th>
  </tr>
  <tr>
    <td><code>COPYFILE_EXCL</code></td>
    <td>If present, the copy operation will fail with an error if the
    destination path already exists.</td>
  </tr>
  <tr>
    <td><code>COPYFILE_FICLONE</code></td>
    <td>If present, the copy operation will attempt to create a
    copy-on-write reflink. If the underlying platform does not support
    copy-on-write, then a fallback copy mechanism is used.</td>
  </tr>
  <tr>
    <td><code>COPYFILE_FICLONE_FORCE</code></td>
    <td>If present, the copy operation will attempt to create a
    copy-on-write reflink. If the underlying platform does not support
    copy-on-write, then the operation will fail with an error.</td>
  </tr>
</table>

### Константы открытия файла

Следующие константы предназначены для использования с `fs.open()`.

<table>
  <tr>
    <th>Константа</th>
    <th>Описание</th>
  </tr>
  <tr>
    <td><code>O_RDONLY</code></td>
    <td>Флаг, который указывает на открытие файла, доступного только для чтения.</td>
  </tr>
  <tr>
    <td><code>O_WRONLY</code></td>
    <td>Флаг, который указывает на открытие файла, доступного только для записи.</td>
  </tr>
  <tr>
    <td><code>O_RDWR</code></td>
    <td>Флаг, который указывает на открытие файла, доступного только для чтения.</td>
  </tr>
  <tr>
    <td><code>O_CREAT</code></td>
    <td>Флаг, указывающий на создание файла, если он еще не существует.</td>
  </tr>
  <tr>
    <td><code>O_EXCL</code></td>
    <td>Флаг, указывающий, что открытие файла должно потерпеть неудачу, если
    установлен флаг <code>O_CREAT</code>, а файл уже существует.</td>
  </tr>
  <tr>
    <td><code>O_NOCTTY</code></td>
    <td>Флаг, указывающий на то, что если путь идентифицирует терминальное устройство, то открытие
    пути не приведет к тому, что терминал станет управляющим для
    процесса (если у процесса все еще нет терминала).</td>
  </tr>
  <tr>
    <td><code>O_TRUNC</code></td>
    <td>Флаг, указывающий, что если файл существует и является обычным файлом, и этот
    файл успешно открыт с доступом для записи, его длина должна быть усечена
    до нуля.</td>
  </tr>
  <tr>
    <td><code>O_APPEND</code></td>
    <td>Флаг, указывающий, что данные будут добавлены в конец файла.</td>
  </tr>
  <tr>
    <td><code>O_DIRECTORY</code></td>
    <td>Флаг, указывающий, что открытие должно завершиться неудачей, если путь не является
    каталогом.</td>
  </tr>
  <tr>
  <td><code>O_NOATIME</code></td>
    <td>Flag indicating reading accesses to the file system will no longer
    result in an update to the <code>atime</code> information associated with
    the file.  Этот флаг доступен только на операционных системах Linux.</td>
  </tr>
  <tr>
    <td><code>O_NOFOLLOW</code></td>
    <td>Флаг, указывающий, что открытие должно завершиться неудачей, если путь является символической
    ссылкой.</td>
  </tr>
  <tr>
    <td><code>O_SYNC</code></td>
    <td>Flag indicating that the file is opened for synchronized I/O with write
    operations waiting for file integrity.</td>
  </tr>
  <tr>
    <td><code>O_DSYNC</code></td>
    <td>Flag indicating that the file is opened for synchronized I/O with write
    operations waiting for data integrity.</td>
  </tr>
  <tr>
    <td><code>O_SYMLINK</code></td>
    <td>Флаг, указывающий на открытие самой символической ссылки, а не ресурса, на который она указывает.</td>
  </tr>
  <tr>
    <td><code>O_DIRECT</code></td>
    <td>Когда установлено, будет сделана попытка свести к минимуму эффекты кэширования файлового
    ввода-вывода.</td>
  </tr>
  <tr>
    <td><code>O_NONBLOCK</code></td>
    <td>Флаг, указывающий, что при возможности файл открывается в режиме без блокировки.</td>
  </tr>
</table>

### Константы типа файла

Следующие константы предназначены для использования со свойством `mode` объекта [`fs.Stats`][] для определения типа файла.

<table>
  <tr>
    <th>Константа</th>
    <th>Описание</th>
  </tr>
  <tr>
    <td><code>S_IFMT</code></td>
    <td>Битовая маска, используемая для извлечения кода типа файла.</td>
  </tr>
  <tr>
    <td><code>S_IFREG</code></td>
    <td>Константа типа файла для обычного файла.</td>
  </tr>
  <tr>
    <td><code>S_IFDIR</code></td>
    <td>Константа типа файла для каталога.</td>
  </tr>
  <tr>
    <td><code>S_IFCHR</code></td>
    <td>Константа типа файла для файла устройства, ориентированного на символы.</td>
  </tr>
  <tr>
    <td><code>S_IFBLK</code></td>
    <td>Константа типа файла для файла устройства, ориентированного на блоки.</td>
  </tr>
  <tr>
    <td><code>S_IFIFO</code></td>
    <td>Константа типа файла для FIFO/канала.</td>
  </tr>
  <tr>
    <td><code>S_IFLNK</code></td>
    <td>Константа типа файла для символической ссылки.</td>
  </tr>
  <tr>
    <td><code>S_IFSOCK</code></td>
    <td>Константа типа файла для сокета.</td>
  </tr>
</table>

### Константы режимов файла

Следующие константы предназначены для использования со свойством `mode` объекта [`fs.Stats`][] для определения прав доступа к файлу.

<table>
  <tr>
    <th>Константа</th>
    <th>Описание</th>
  </tr>
  <tr>
    <td><code>S_IRWXU</code></td>
    <td>File mode indicating readable, writable, and executable by owner.</td>
  </tr>
  <tr>
    <td><code>S_IRUSR</code></td>
    <td>Режим файла, указывающий на чтение пользователем.</td>
  </tr>
  <tr>
    <td><code>S_IWUSR</code></td>
    <td>Режим файла, указывающий на запись пользователем.</td>
  </tr>
  <tr>
    <td><code>S_IXUSR</code></td>
    <td>Режим файла, указывающий на выполнение пользователем.</td>
  </tr>
  <tr>
    <td><code>S_IRWXG</code></td>
    <td>File mode indicating readable, writable, and executable by group.</td>
  </tr>
  <tr>
    <td><code>S_IRGRP</code></td>
    <td>Режим файла, указывающий на чтение группой.</td>
  </tr>
  <tr>
    <td><code>S_IWGRP</code></td>
    <td>Режим файла, указывающий на запись группой.</td>
  </tr>
  <tr>
    <td><code>S_IXGRP</code></td>
    <td>Режим файла, указывающий на выполнение группой.</td>
  </tr>
  <tr>
    <td><code>S_IRWXO</code></td>
    <td>File mode indicating readable, writable, and executable by others.</td>
  </tr>
  <tr>
    <td><code>S_IROTH</code></td>
    <td>Режим файла, указывающий на чтение другими.</td>
  </tr>
  <tr>
    <td><code>S_IWOTH</code></td>
    <td>Режим файла, указывающий на запись другими.</td>
  </tr>
  <tr>
    <td><code>S_IXOTH</code></td>
    <td>Режим файла, указывающий на выполнение другими.</td>
  </tr>
</table>

## File System Flags

The following flags are available wherever the `flag` option takes a string:

* `'a'` - Открыть файл для добавления. Файл создается, если он не существует.

* `'ax'` - Like `'a'` but fails if the path exists.

* `'a+'` - Открыть файл для чтения и добавления. Файл создается, если он не существует.

* `'ax+'` - Like `'a+'` but fails if the path exists.

* `'as'` - Open file for appending in synchronous mode. Файл создается, если он не существует.

* `'as+'` - Open file for reading and appending in synchronous mode. Файл создается, если он не существует.

* `'r'` - Открыть файл для чтения. Исключение возникает, если файл не существует.

* `'r+'` - Открыть файл для чтения и записи. Исключение возникает, если файл не существует.

* `'rs+'` - Открыть файл для чтения и записи в синхронном режиме. Дает инструкцию ОС обойти кеш локальной файловой системы.

  This is primarily useful for opening files on NFS mounts as it allows skipping the potentially stale local cache. It has a very real impact on I/O performance so using this flag is not recommended unless it is needed.

  This doesn't turn `fs.open()` or `fsPromises.open()` into a synchronous blocking call. If synchronous operation is desired, something like `fs.openSync()` should be used.

* `'w'` - Открыть файл для записи. Файл создается (если он не существует) или сокращается (если он существует).

* `'wx'` - Like `'w'` but fails if the path exists.

* `'w+'` - Открыть файл для чтения и записи. Файл создается (если он не существует) или сокращается (если он существует).

* `'wx+'` - Like `'w+'` but fails if the path exists.

`flag` can also be a number as documented by open(2); commonly used constants are available from `fs.constants`. On Windows, flags are translated to their equivalent ones where applicable, e.g. `O_WRONLY` to `FILE_GENERIC_WRITE`, or `O_EXCL|O_CREAT` to `CREATE_NEW`, as accepted by `CreateFileW`.

The exclusive flag `'x'` (`O_EXCL` flag in open(2)) ensures that path is newly created. On POSIX systems, path is considered to exist even if it is a symlink to a non-existent file. The exclusive flag may or may not work with network file systems.

В Linux позиционные записи не работают, когда файл открыт в режиме добавления. Ядро игнорирует позиционный аргумент и всегда добавляет данные в конец файла.

Modifying a file rather than replacing it may require a flags mode of `'r+'` rather than the default mode `'w'`.

The behavior of some flags are platform-specific. As such, opening a directory on macOS and Linux with the `'a+'` flag - see example below - will return an error. In contrast, on Windows and FreeBSD, a file descriptor or a `FileHandle` will be returned.

```js
// macOS и Linux
fs.open('<directory>', 'a+', (err, fd) => {
  // => [Error: EISDIR: недопустимая операция с каталогом, открыть <directory>]
});

// Windows и FreeBSD
fs.open('<directory>', 'a+', (err, fd) => {
  // => null, <fd>
});
```

On Windows, opening an existing hidden file using the `'w'` flag (either through `fs.open()` or `fs.writeFile()` or `fsPromises.open()`) will fail with `EPERM`. Existing hidden files can be opened for writing with the `'r+'` flag.

A call to `fs.ftruncate()` or `filehandle.truncate()` can be used to reset the file contents.
