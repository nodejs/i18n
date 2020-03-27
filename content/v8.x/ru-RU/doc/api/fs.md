# Файловая система

<!--introduced_in=v0.10.0-->

> Стабильность: 2 - Стабильно

<!--name=fs-->

Файловый ввод-вывод обеспечивается простыми врапперами вокруг стандартных функций POSIX. To use this module do `require('fs')`. All the methods have asynchronous and synchronous forms.

Асинхронная форма всегда принимает обратный вызов завершения в качестве его последнего аргумента. The arguments passed to the completion callback depend on the method, but the first argument is always reserved for an exception. If the operation was completed successfully, then the first argument will be `null` or `undefined`.

При использовании синхронной формы любые исключения выводятся немедленно. Exceptions may be handled using `try`/`catch`, or they may be allowed to bubble up.

Пример асинхронной версии:

```js
const fs = require('fs');

fs.unlink('/tmp/hello', (err) => {
  if (err) throw err;
  console.log("успешно удален /tmp/hello");
});
```

Синхронная версия:

```js
const fs = require('fs');

fs.unlinkSync('/tmp/hello');
console.log("успешно удален /tmp/hello");
```

При использовании асинхронных методов нет гарантии в последовательности. So the following is prone to error:

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

`fs.stat` может выполняться перед `fs.rename`. Правильный способ это сделать - выстроить по цепочке обратные вызовы.

```js
fs.rename('/tmp/hello', '/tmp/world', (err) => {
  if (err) throw err;
  fs.stat('/tmp/world', (err, stats) => {
    if (err) throw err;
    console.log(`stats: ${JSON.stringify(stats)}`);
  });
});
```

In busy processes, the programmer is *strongly encouraged* to use the asynchronous versions of these calls. The synchronous versions will block the entire process until they complete — halting all connections.

Можно использовать связанный путь к имени файла. Remember, however, that this path will be relative to `process.cwd()`.

While it is not recommended, most fs functions allow the callback argument to be omitted, in which case a default callback is used that rethrows errors. To get a trace to the original call site, set the `NODE_DEBUG` environment variable:

*Note*: Omitting the callback function on asynchronous fs functions is deprecated and may result in an error being thrown in the future.

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

*Note:* On Windows Node.js follows the concept of per-drive working directory. This behavior can be observed when using a drive path without a backslash. For example `fs.readdirSync('c:\\')` can potentially return a different result than `fs.readdirSync('c:')`. For more information, see [this MSDN page](https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247.aspx#fully_qualified_vs._relative_paths).

*Note:* On Windows, opening an existing hidden file using the `w` flag (either through `fs.open` or `fs.writeFile`) will fail with `EPERM`. Existing hidden files can be opened for writing with the `r+` flag. A call to `fs.ftruncate` can be used to reset the file contents.

## Threadpool Usage

Note that all file system APIs except `fs.FSWatcher()` and those that are explicitly synchronous use libuv's threadpool, which can have surprising and negative performance implications for some applications, see the [`UV_THREADPOOL_SIZE`][] documentation for more information.

## WHATWG URL object support

<!-- YAML
added: v7.6.0
-->

> Стабильность: 1 - экспериментальный

For most `fs` module functions, the `path` or `filename` argument may be passed as a WHATWG [`URL`][] object. Only [`URL`][] objects using the `file:` protocol are supported.

```js
const fs = require('fs');
const { URL } = require('url');
const fileUrl = new URL('file:///tmp/hello');

fs.readFileSync(fileUrl);
```

*Note*: `file:` URLs are always absolute paths.

Using WHATWG [`URL`][] objects might introduce platform-specific behaviors.

On Windows, `file:` URLs with a hostname convert to UNC paths, while `file:` URLs with drive letters convert to local absolute paths. `file:` URLs without a hostname nor a drive letter will result in a throw :

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

*Note*: `file:` URLs with drive letters must use `:` as a separator just after the drive letter. Using another separator will result in a throw.

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

## API буфера

<!-- YAML
added: v6.0.0
-->

`fs` functions support passing and receiving paths as both strings and Buffers. The latter is intended to make it possible to work with filesystems that allow for non-UTF-8 filenames. For most typical uses, working with paths as Buffers will be unnecessary, as the string API converts to and from UTF-8 automatically.

*Note*: On certain file systems (such as NTFS and HFS+) filenames will always be encoded as UTF-8. On such file systems, passing non-UTF-8 encoded Buffers to `fs` functions will not work as expected.

## Класс: fs.FSWatcher

<!-- YAML
added: v0.5.8
-->

Объекты, возвращенные из [`fs.watch()`][], относятся к этому типу.

The `listener` callback provided to `fs.watch()` receives the returned FSWatcher's `change` events.

Сам объект создает эти события:

### Событие: "change"'

<!-- YAML
added: v0.5.8
-->

* `eventType` {string} Тип изменения fs
* `filename` {string|Buffer} Имя файла, которое изменилось (если релевантно/допустимо)

Создается, когда что-то меняется в отслеживаемом каталоге или файле. Более подробно смотрите в [`fs.watch()`][].

The `filename` argument may not be provided depending on operating system support. If `filename` is provided, it will be provided as a `Buffer` if `fs.watch()` is called with its `encoding` option set to `'buffer'`, otherwise `filename` will be a string.

```js
// Example when handled through fs.watch listener
fs.watch('./tmp', { encoding: 'buffer' }, (eventType, filename) => {
  if (filename) {
    console.log(filename);
    // Prints: <Buffer ...>
  }
});
```

### Событие: 'error'

<!-- YAML
added: v0.5.8
-->

* `error` {Error}

Создается при возникновении ошибки.

### watcher.close()

<!-- YAML
added: v0.5.8
-->

Прекратить просмотр изменений на данном `fs.FSWatcher`.

## Класс: fs.ReadStream

<!-- YAML
added: v0.1.93
-->

`ReadStream` является [Читаемым Потоком](stream.html#stream_class_stream_readable).

### Событие: 'close'

<!-- YAML
added: v0.1.93
-->

Создается, когда базовый файловый дескриптор `ReadStream` был закрыт.

### Событие: 'open'

<!-- YAML
added: v0.1.93
-->

* `fd` {integer} Целочислительный файловый дескриптор, используемый ReadStream.

Создается, когда открывается файл ReadStream.

### readStream.bytesRead

<!-- YAML
added: 6.4.0
-->

Количество байтов, прочитанных на данный момент.

### readStream.path

<!-- YAML
added: v0.1.93
-->

The path to the file the stream is reading from as specified in the first argument to `fs.createReadStream()`. If `path` is passed as a string, then `readStream.path` will be a string. If `path` is passed as a `Buffer`, then `readStream.path` will be a `Buffer`.

## Класс: fs.Stats

<!-- YAML
added: v0.1.21
changes:

  - version: v8.1.0
    pr-url: https://github.com/nodejs/node/pull/13173
    description: Added times as numbers.
-->

Objects returned from [`fs.stat()`][], [`fs.lstat()`][] and [`fs.fstat()`][] and their synchronous counterparts are of this type.

* `stats.isFile()`
* `stats.isDirectory()`
* `stats.isBlockDevice()`
* `stats.isCharacterDevice()`
* `stats.isSymbolicLink()` (действительно только с [`fs.lstat()`][])
* `stats.isFIFO()`
* `stats.isSocket()`

For a regular file [`util.inspect(stats)`][] would return a string very similar to this:

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

*Note*: `atimeMs`, `mtimeMs`, `ctimeMs`, `birthtimeMs` are [numbers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) that hold the corresponding times in milliseconds. Their precision is platform specific. `atime`, `mtime`, `ctime`, and `birthtime` are [`Date`](https://developer.mozilla.org/en-US/JavaScript/Reference/Global_Objects/Date) object alternate representations of the various times. The `Date` and number values are not connected. Assigning a new number value, or mutating the `Date` value, will not be reflected in the corresponding alternate representation.

### Статические значения времени

Время в объекте статистики имеет следующую семантику:

* `atime` "Время доступа" - Время, когда данные файлов последний раз были доступны. Changed by the mknod(2), utimes(2), and read(2) system calls.
* `mtime` "Время изменения" - Время, когда данные файла последний раз изменялись. Изменено с помощью системных вызовов mknod(2), utimes(2) и write(2).
* `ctime` "Change Time" - Time when file status was last changed (inode data modification). Changed by the chmod(2), chown(2), link(2), mknod(2), rename(2), unlink(2), utimes(2), read(2), and write(2) system calls.
* `birthtime` "Время рождения" - Время создания файла. Set once when the file is created. On filesystems where birthtime is not available, this field may instead hold either the `ctime` or `1970-01-01T00:00Z` (ie, unix epoch timestamp `0`). Note that this value may be greater than `atime` or `mtime` in this case. On Darwin and other FreeBSD variants, also set if the `atime` is explicitly set to an earlier value than the current `birthtime` using the utimes(2) system call.

Prior to Node v0.12, the `ctime` held the `birthtime` on Windows systems. Note that as of v0.12, `ctime` is not "creation time", and on Unix systems, it never was.

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

* `fd` {integer} Целочислительный файловый дескриптор, используемый WriteStream.

Создается, когда открывается файл WriteStream.

### writeStream.bytesWritten

<!-- YAML
added: v0.4.7
-->

Количество байтов, записанных на данный момент. Does not include data that is still queued for writing.

### writeStream.path

<!-- YAML
added: v0.1.93
-->

The path to the file the stream is writing to as specified in the first argument to `fs.createWriteStream()`. If `path` is passed as a string, then `writeStream.path` will be a string. If `path` is passed as a `Buffer`, then `writeStream.path` will be a `Buffer`.

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
                 Thus for Node `< v6.3.0` use `fs` to access those constants, or
                 do something like `(fs.constants || fs).R_OK` to work with all
                 versions.
-->

* `path` {string|Buffer|URL}
* `mode` {integer} **Default:** `fs.constants.F_OK`
* `обратный вызов` {Function} 
  * `err` {Error}

Проверяет права пользователя для файла или каталога, указанного с помощью `path`. The `mode` argument is an optional integer that specifies the accessibility checks to be performed. The following constants define the possible values of `mode`. It is possible to create a mask consisting of the bitwise OR of two or more values (e.g. `fs.constants.W_OK | fs.constants.R_OK`).

* `fs.constants.F_OK` - `path` виден вызывающему процессу. This is useful for determining if a file exists, but says nothing about `rwx` permissions. Установлен по умолчанию, если `mode` не задан.
* `fs.constants.R_OK` - `path` может быть прочитан вызывающим процессом.
* `fs.constants.W_OK` - `path` может быть записан вызывающим процессом.
* `fs.constants.X_OK` - `path` может быть выполнен вызывающим процессом. This has no effect on Windows (will behave like `fs.constants.F_OK`).

The final argument, `callback`, is a callback function that is invoked with a possible error argument. If any of the accessibility checks fail, the error argument will be an `Error` object. The following example checks if the file `/etc/passwd` can be read and written by the current process.

```js
fs.access('/etc/passwd', fs.constants.R_OK | fs.constants.W_OK, (err) => {
  console.log(err ? 'no access!' : 'can read/write');
});
```

Using `fs.access()` to check for the accessibility of a file before calling `fs.open()`, `fs.readFile()` or `fs.writeFile()` is not recommended. Doing so introduces a race condition, since other processes may change the file's state between the two calls. Instead, user code should open/read/write the file directly and handle the error raised if the file is not accessible.

Например:

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

The "not recommended" examples above check for accessibility and then use the file; the "recommended" examples are better because they use the file directly and handle the error, if any.

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
* Возвращает: {undefined}

Synchronously tests a user's permissions for the file or directory specified by `path`. The `mode` argument is an optional integer that specifies the accessibility checks to be performed. The following constants define the possible values of `mode`. It is possible to create a mask consisting of the bitwise OR of two or more values (e.g. `fs.constants.W_OK | fs.constants.R_OK`).

* `fs.constants.F_OK` - `path` виден вызывающему процессу. This is useful for determining if a file exists, but says nothing about `rwx` permissions. Установлен по умолчанию, если `mode` не задан.
* `fs.constants.R_OK` - `path` может быть прочитан вызывающим процессом.
* `fs.constants.W_OK` - `path` может быть записан вызывающим процессом.
* `fs.constants.X_OK` - `path` может быть выполнен вызывающим процессом. This has no effect on Windows (will behave like `fs.constants.F_OK`).

If any of the accessibility checks fail, an `Error` will be thrown. Otherwise, the method will return `undefined`.

```js
try {
  fs.accessSync('etc/passwd', fs.constants.R_OK | fs.constants.W_OK);
  console.log('can read/write');
} catch (err) {
  console.error('no access!');
}
```

## fs.appendFile(file, data[, options], callback)

<!-- YAML
added: v0.6.7
changes:

  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7831
    description: The passed `options` object will never be modified.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: The `file` parameter can be a file descriptor now.
-->

* `file` {string|Buffer|URL|number} имя файла или файловый дескриптор
* `data` {string|Buffer}
* `опции` {Object|string} 
  * `encoding` {string|null} **По умолчанию:** `'utf8'`
  * `mode` {integer} **Default:** `0o666`
  * `flag` {string} **Default:** `'a'`
* `обратный вызов` {Function} 
  * `err` {Error}

Асинхронно добавляет данные в файл, создавая файл, если он еще не существует. `data` can be a string or a [`Buffer`][].

Пример:

```js
fs.appendFile('message.txt', 'данные для добавления', (err) => {
  if (err) throw err;
  console.log('"Данные для добавления" были добавлены в файл!');
});
```

Если параметр `options` является строкой, то он указывает кодировку. Пример:

```js
fs.appendFile('message.txt', 'данные для добавления', 'utf8', обратный вызов);
```

The `file` may be specified as a numeric file descriptor that has been opened for appending (using `fs.open()` or `fs.openSync()`). The file descriptor will not be closed automatically.

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

## fs.appendFileSync(file, data[, options])

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

* `file` {string|Buffer|URL|number} имя файла или файловый дескриптор
* `data` {string|Buffer}
* `опции` {Object|string} 
  * `encoding` {string|null} **По умолчанию:** `'utf8'`
  * `mode` {integer} **Default:** `0o666`
  * `flag` {string} **Default:** `'a'`

Synchronously append data to a file, creating the file if it does not yet exist. `data` can be a string or a [`Buffer`][].

Пример:

```js
try {
  fs.appendFileSync('message.txt', 'data to append');
  console.log('The "data to append" was appended to file!');
} catch (err) {
  /* Handle the error */
}
```

Если параметр `options` является строкой, то он указывает кодировку. Пример:

```js
fs.appendFileSync('message.txt', 'data to append', 'utf8');
```

The `file` may be specified as a numeric file descriptor that has been opened for appending (using `fs.open()` or `fs.openSync()`). The file descriptor will not be closed automatically.

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

  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `mode` {integer}
* `обратный вызов` {Function} 
  * `err` {Error}

Асинхронно изменяет права доступа к файлу. No arguments other than a possible exception are given to the completion callback.

См. также: chmod(2)

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

Синхронно меняет права доступа к файлу. Возвращает `undefined`. Синхронная версия [`fs.chmod()`][].

См. также: chmod(2)

## fs.chown(path, uid, gid, callback)

<!-- YAML
added: v0.1.97
changes:

  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `uid` {integer}
* `gid` {integer}
* `обратный вызов` {Function} 
  * `err` {Error}

Асинхронно меняет владельца и группу файла. No arguments other than a possible exception are given to the completion callback.

См. также: chown(2)

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

См. также: chown(2)

## fs.close(fd, callback)

<!-- YAML
added: v0.0.2
changes:

  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd` {integer}
* `обратный вызов` {Function} 
  * `err` {Error}

Асинхронный close(2). No arguments other than a possible exception are given to the completion callback.

## fs.closeSync(fd)

<!-- YAML
added: v0.1.21
-->

* `fd` {integer}

Синхронный close(2). Возвращает `undefined`.

## fs.constants

Returns an object containing commonly used constants for file system operations. The specific constants currently defined are described in [FS Constants](#fs_fs_constants_1).

## fs.copyFile(src, dest[, flags], callback)

<!-- YAML
added: v8.5.0
-->

* `src` {string|Buffer|URL} source filename to copy
* `dest` {string|Buffer|URL} destination filename of the copy operation
* `flags` {number} modifiers for copy operation. **Default:** `0`.
* `callback` {Function}

Asynchronously copies `src` to `dest`. By default, `dest` is overwritten if it already exists. No arguments other than a possible exception are given to the callback function. Node.js makes no guarantees about the atomicity of the copy operation. If an error occurs after the destination file has been opened for writing, Node.js will attempt to remove the destination.

`flags` is an optional integer that specifies the behavior of the copy operation. The only supported flag is `fs.constants.COPYFILE_EXCL`, which causes the copy operation to fail if `dest` already exists.

Пример:

```js
const fs = require('fs');

// destination.txt will be created or overwritten by default.
fs.copyFile('source.txt', 'destination.txt', (err) => {
  if (err) throw err;
  console.log('source.txt was copied to destination.txt');
});
```

If the third argument is a number, then it specifies `flags`, as shown in the following example.

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

`flags` is an optional integer that specifies the behavior of the copy operation. The only supported flag is `fs.constants.COPYFILE_EXCL`, which causes the copy operation to fail if `dest` already exists.

Пример:

```js
const fs = require('fs');

// destination.txt will be created or overwritten by default.
fs.copyFileSync('source.txt', 'destination.txt');
console.log('source.txt was copied to destination.txt');
```

If the third argument is a number, then it specifies `flags`, as shown in the following example.

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
* `опции` {string|Object} 
  * `flags` {string}
  * `encoding` {string}
  * `fd` {integer}
  * `mode` {integer}
  * `autoClose` {boolean}
  * `start` {integer}
  * `end` {integer}
  * `highWaterMark` {integer}

Возвращает новый объект [`ReadStream`][]. (См. [Readable Stream](stream.html#stream_class_stream_readable)).

Be aware that, unlike the default value set for `highWaterMark` on a readable stream (16 kb), the stream returned by this method has a default value of 64 kb for the same parameter.

`options` - объект или строка со следующими значениями по умолчанию:

```js
const defaults = {
  flags: 'r',
  encoding: null,
  fd: null,
  mode: 0o666,
  autoClose: true,
  highWaterMark: 64 * 1024
};
```

`options` can include `start` and `end` values to read a range of bytes from the file instead of the entire file. Both `start` and `end` are inclusive and start counting at 0. If `fd` is specified and `start` is omitted or `undefined`, `fs.createReadStream()` reads sequentially from the current file position. `encoding` может быть одним из тех, что принимает [`Buffer`][].

If `fd` is specified, `ReadStream` will ignore the `path` argument and will use the specified file descriptor. This means that no `'open'` event will be emitted. Note that `fd` should be blocking; non-blocking `fd`s should be passed to [`net.Socket`][].

If `autoClose` is false, then the file descriptor won't be closed, even if there's an error. It is the application's responsibility to close it and make sure there's no file descriptor leak. If `autoClose` is set to true (default behavior), on `error` or `end` the file descriptor will be closed automatically.

`mode` sets the file mode (permission and sticky bits), but only if the file was created.

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
* `опции` {string|Object} 
  * `flags` {string}
  * `encoding` {string}
  * `fd` {integer}
  * `mode` {integer}
  * `autoClose` {boolean}
  * `start` {integer}

Возвращает новый объект [`WriteStream`][]. (См. [Writable Stream](stream.html#stream_class_stream_writable)).

`options` - объект или строка со следующими значениями по умолчанию:

```js
const defaults = {
  flags: 'w',
  encoding: 'utf8',
  fd: null,
  mode: 0o666,
  autoClose: true
};
```

`options` may also include a `start` option to allow writing data at some position past the beginning of the file. Modifying a file rather than replacing it may require a `flags` mode of `r+` rather than the default mode `w`. `encoding` может быть одним из тех, что принимает [`Buffer`][].

If `autoClose` is set to true (default behavior) on `error` or `end` the file descriptor will be closed automatically. If `autoClose` is false, then the file descriptor won't be closed, even if there's an error. It is the application's responsibility to close it and make sure there's no file descriptor leak.

Like [`ReadStream`][], if `fd` is specified, `WriteStream` will ignore the `path` argument and will use the specified file descriptor. This means that no `'open'` event will be emitted. Note that `fd` should be blocking; non-blocking `fd`s should be passed to [`net.Socket`][].

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
* `обратный вызов` {Function} 
  * `exists` {boolean}

Проверьте наличие данного пути с помощью файловой системы. Затем вызовите аргумент `callback` со значением true или false. Пример:

```js
fs.exists('/etc/passwd', (exists) => {
  console.log(exists ? 'it\'s there' : 'no passwd!');
});
```

**Note that the parameter to this callback is not consistent with other Node.js callbacks.** Normally, the first parameter to a Node.js callback is an `err` parameter, optionally followed by other parameters. The `fs.exists()` callback has only one boolean parameter. This is one reason `fs.access()` is recommended instead of `fs.exists()`.

Using `fs.exists()` to check for the existence of a file before calling `fs.open()`, `fs.readFile()` or `fs.writeFile()` is not recommended. Doing so introduces a race condition, since other processes may change the file's state between the two calls. Instead, user code should open/read/write the file directly and handle the error raised if the file does not exist.

Например:

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

The "not recommended" examples above check for existence and then use the file; the "recommended" examples are better because they use the file directly and handle the error, if any.

In general, check for the existence of a file only if the file won’t be used directly, for example when its existence is a signal from another process.

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

Синхронная версия [`fs.exists()`][]. Если путь существует, возвращает `true`, в противном случае - `false`.

Обратите внимание, что устарел `fs.exists()`, но не `fs.existsSync()`. (The `callback` parameter to `fs.exists()` accepts parameters that are inconsistent with other Node.js callbacks. `fs.existsSync()` does not use a callback.)

## fs.fchmod(fd, mode, callback)

<!-- YAML
added: v0.4.7
changes:

  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd` {integer}
* `mode` {integer}
* `обратный вызов` {Function} 
  * `err` {Error}

Асинхронный fchmod(2). No arguments other than a possible exception are given to the completion callback.

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

  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd` {integer}
* `uid` {integer}
* `gid` {integer}
* `обратный вызов` {Function} 
  * `err` {Error}

Асинхронный fchown(2). No arguments other than a possible exception are given to the completion callback.

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

  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd` {integer}
* `обратный вызов` {Function} 
  * `err` {Error}

Асинхронный fdatasync(2). No arguments other than a possible exception are given to the completion callback.

## fs.fdatasyncSync(fd)

<!-- YAML
added: v0.1.96
-->

* `fd` {integer}

Синхронный fdatasync(2). Возвращает `undefined`.

## fs.fstat(fd, callback)

<!-- YAML
added: v0.1.95
changes:

  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd` {integer}
* `обратный вызов` {Function} 
  * `err` {Error}
  * `stats` {fs.Stats}

Асинхронный fstat(2). The callback gets two arguments `(err, stats)` where `stats` is an [`fs.Stats`][] object. `fstat()` is identical to [`stat()`][], except that the file to be stat-ed is specified by the file descriptor `fd`.

## fs.fstatSync(fd)

<!-- YAML
added: v0.1.95
-->

* `fd` {integer}

Синхронный fstat(2). Возвращает экземпляр [`fs.Stats`][].

## fs.fsync(fd, callback)

<!-- YAML
added: v0.1.96
changes:

  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd` {integer}
* `обратный вызов` {Function} 
  * `err` {Error}

Асинхронный fsync(2). No arguments other than a possible exception are given to the completion callback.

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

  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd` {integer}
* `len` {integer} **Default:** `0`
* `обратный вызов` {Function} 
  * `err` {Error}

Асинхронный ftruncate(2). No arguments other than a possible exception are given to the completion callback.

If the file referred to by the file descriptor was larger than `len` bytes, only the first `len` bytes will be retained in the file.

Например, следующая программа сохраняет только первые четыре байта файла

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

If the file previously was shorter than `len` bytes, it is extended, and the extended part is filled with null bytes ('\0'). Например,

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

Последние три байта будут нулевыми ('\0'), чтобы компенсировать чрезмерное усечение.

## fs.ftruncateSync(fd[, len])

<!-- YAML
added: v0.8.6
-->

* `fd` {integer}
* `len` {integer} **Default:** `0`

Синхронный ftruncate(2). Возвращает `undefined`.

## fs.futimes(fd, atime, mtime, callback)

<!-- YAML
added: v0.4.2
changes:

  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v4.1.0
    pr-url: https://github.com/nodejs/node/pull/2387
    description: Numeric strings, `NaN` and `Infinity` are now allowed
                 time specifiers.
-->

* `fd` {integer}
* `atime` {number|string|Date}
* `mtime` {number|string|Date}
* `обратный вызов` {Function} 
  * `err` {Error}

Change the file system timestamps of the object referenced by the supplied file descriptor. See [`fs.utimes()`][].

*Note*: This function does not work on AIX versions before 7.1, it will return the error `UV_ENOSYS`.

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

  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `mode` {integer}
* `обратный вызов` {Function} 
  * `err` {Error}

Асинхронный lchmod(2). No arguments other than a possible exception are given to the completion callback.

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
deprecated: v0.4.7
changes:

  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `uid` {integer}
* `gid` {integer}
* `обратный вызов` {Function} 
  * `err` {Error}

Асинхронный lchown(2). No arguments other than a possible exception are given to the completion callback.

## fs.lchownSync(path, uid, gid)

<!-- YAML
deprecated: v0.4.7
-->

* `path` {string|Buffer|URL}
* `uid` {integer}
* `gid` {integer}

Синхронный lchown(2). Возвращает `undefined`.

## fs.link(existingPath, newPath, callback)

<!-- YAML
added: v0.1.31
changes:

  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `existingPath` and `newPath` parameters can be WHATWG
                 `URL` objects using `file:` protocol. Support is currently
                 still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `existingPath` {string|Buffer|URL}
* `newPath` {string|Buffer|URL}
* `обратный вызов` {Function} 
  * `err` {Error}

Асинхронный link(2). No arguments other than a possible exception are given to the completion callback.

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

## fs.lstat(path, callback)

<!-- YAML
added: v0.1.30
changes:

  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `обратный вызов` {Function} 
  * `err` {Error}
  * `stats` {fs.Stats}

Асинхронный lstat(2). The callback gets two arguments `(err, stats)` where `stats` is a [`fs.Stats`][] object. `lstat()` is identical to `stat()`, except that if `path` is a symbolic link, then the link itself is stat-ed, not the file that it refers to.

## fs.lstatSync(path)

<!-- YAML
added: v0.1.30
changes:

  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}

Синхронный lstat(2). Возвращает экземпляр [`fs.Stats`][].

## fs.mkdir(path[, mode], callback)

<!-- YAML
added: v0.1.8
changes:

  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `mode` {integer} **Default:** `0o777`
* `обратный вызов` {Function} 
  * `err` {Error}

Асинхронно создает каталог. No arguments other than a possible exception are given to the completion callback.

См. также: mkdir(2)

## fs.mkdirSync(path[, mode])

<!-- YAML
added: v0.1.21
changes:

  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `mode` {integer} **Default:** `0o777`

Синхронно создает каталог. Возвращает `undefined`. Синхронная версия [`fs.mkdir()`][].

См. также: mkdir(2)

## fs.mkdtemp(prefix[, options], callback)

<!-- YAML
added: v5.10.0
changes:

  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v6.2.1
    pr-url: https://github.com/nodejs/node/pull/6828
    description: The `callback` parameter is optional now.
-->

* `prefix` {string}
* `опции` {string|Object} 
  * `encoding` {string} **По умолчанию:** `'utf8'`
* `обратный вызов` {Function} 
  * `err` {Error}
  * `folder` {string}

Создает уникальный временный каталог.

Generates six random characters to be appended behind a required `prefix` to create a unique temporary directory.

The created folder path is passed as a string to the callback's second parameter.

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use.

Пример:

```js
fs.mkdtemp(path.join(os.tmpdir(), 'foo-'), (err, folder) => {
  if (err) throw err;
  console.log(folder);
  // Печатает: /tmp/foo-itXde2 or C:\Users\...\AppData\Local\Temp\foo-itXde2
});
```

*Note*: The `fs.mkdtemp()` method will append the six randomly selected characters directly to the `prefix` string. For instance, given a directory `/tmp`, if the intention is to create a temporary directory *within* `/tmp`, the `prefix` *must* end with a trailing platform-specific path separator (`require('path').sep`).

```js
// Родительский каталог для нового временного каталога
const tmpDir = os.tmpdir();

// Этот метод *НЕПРАВИЛЬНЫЙ*:
fs.mkdtemp(tmpDir, (err, folder) => {
  if (err) throw err;
  console.log(folder);
  // Напечатает что-то похожее на `/tmpabc123`.
  // Обратите внимание, что новый временный каталог создается
  // в корневой файловой системе, а не *в*
  // каталоге /tmp.
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
* `опции` {string|Object} 
  * `encoding` {string} **По умолчанию:** `'utf8'`

Синхронная версия [`fs.mkdtemp()`][]. Returns the created folder path.

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use.

## fs.open(path, flags[, mode], callback)

<!-- YAML
added: v0.0.2
changes:

  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `flags` {string|number}
* `mode` {integer} **Default:** `0o666` (readable and writable)
* `обратный вызов` {Function} 
  * `err` {Error}
  * `fd` {integer}

Асинхронное открытие файла. См. open(2). Параметр `flags` может быть:

* `'r'` - Открыть файл для чтения. Исключение возникает, если файл не существует.

* `'r+'` - Открыть файл для чтения и записи. Исключение возникает, если файл не существует.

* `'rs+'` - Открыть файл для чтения и записи в синхронном режиме. Instructs the operating system to bypass the local file system cache.
  
  This is primarily useful for opening files on NFS mounts as it allows skipping the potentially stale local cache. It has a very real impact on I/O performance so using this flag is not recommended unless it is needed.
  
  Обратите внимание, что это не превращает `fs.open()` в синхронно блокирующий вызов. If synchronous operation is desired `fs.openSync()` should be used.

* `'w'` - Открыть файл для записи. Файл создается (если он не существует) или сокращается (если он существует).

* `'wx'` - Как `'w'`, но не работает, если `path` существует.

* `'w+'` - Открыть файл для чтения и записи. Файл создается (если он не существует) или сокращается (если он существует).

* `'wx+'` - Как `'w+'`, но не работает, если `path` существует.

* `'a'` - Открыть файл для добавления. Файл создается, если он не существует.

* `'ax'` - Как `'a'`, но не работает, если `path` существует.

* `'as'` - Open file for appending in synchronous mode. Файл создается, если он не существует.

* `'a+'` - Открыть файл для чтения и добавления. Файл создается, если он не существует.

* `'ax+'` - Как `'a+'`, но не работает, если `path` существует.

* `'as+'` - Open file for reading and appending in synchronous mode. Файл создается, если он не существует.

`mode` sets the file mode (permission and sticky bits), but only if the file was created.

Обратный вызов принимает два аргумента `(err, fd)`.

The exclusive flag `'x'` (`O_EXCL` flag in open(2)) ensures that `path` is newly created. On POSIX systems, `path` is considered to exist even if it is a symlink to a non-existent file. The exclusive flag may or may not work with network file systems.

`flags` can also be a number as documented by open(2); commonly used constants are available from `fs.constants`. On Windows, flags are translated to their equivalent ones where applicable, e.g. `O_WRONLY` to `FILE_GENERIC_WRITE`, or `O_EXCL|O_CREAT` to `CREATE_NEW`, as accepted by CreateFileW.

В Linux позиционные записи не работают, когда файл открыт в режиме добавления. The kernel ignores the position argument and always appends the data to the end of the file.

*Примечание*: Поведение `fs.open()` зависит от платформы для некоторых флагов. As such, opening a directory on macOS and Linux with the `'a+'` flag - see example below - will return an error. In contrast, on Windows and FreeBSD, a file descriptor will be returned.

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

Некоторые символы (`< > : " / \ | ? *`) are reserved under Windows as documented by [Naming Files, Paths, and Namespaces](https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx). Under NTFS, if the filename contains a colon, Node.js will open a file system stream, as described by [this MSDN page](https://msdn.microsoft.com/en-us/library/windows/desktop/bb540537.aspx).

Функции, основанные на `fs.open()`, также демонстрируют это поведение. например, `fs.writeFile()`, `fs.readFile()` и т.д.

## fs.openSync(path, flags[, mode])

<!-- YAML
added: v0.1.21
changes:

  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `flags` {string|number}
* `mode` {integer} **Default:** `0o666`

Синхронная версия [`fs.open()`][]. Returns an integer representing the file descriptor.

## fs.read(fd, buffer, offset, length, position, callback)

<!-- YAML
added: v0.0.2
changes:

  - version: v7.4.0
    pr-url: https://github.com/nodejs/node/pull/10382
    description: The `buffer` parameter can now be a `Uint8Array`.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4518
    description: The `length` parameter can now be `0`.
-->

* `fd` {integer}
* `buffer` {Buffer|Uint8Array}
* `offset` {integer}
* `length` {integer}
* `position` {integer}
* `обратный вызов` {Function} 
  * `err` {Error}
  * `bytesRead` {integer}
  * `buffer` {Buffer}

Читает данные из файла, указанного `fd`.

`buffer` - буфер, на который будут записаны данные.

`offset` - смещение в буфере, чтобы начать запись.

`length` - целое число, которое указывает количество байтов для чтения.

`position` - аргумент, указывающий, где начать чтение из файла. If `position` is `null`, data will be read from the current file position, and the file position will be updated. Если `position` - целое число, позиция файла останется неизменной.

Обратному вызову дается три аргумента `(err, bytesRead, buffer)`.

If this method is invoked as its [`util.promisify()`][]ed version, it returns a Promise for an object with `bytesRead` and `buffer` properties.

## fs.readdir(path[, options], callback)

<!-- YAML
added: v0.1.8
changes:

  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5616
    description: The `options` parameter was added.
-->

* `path` {string|Buffer|URL}
* `опции` {string|Object} 
  * `encoding` {string} **По умолчанию:** `'utf8'`
* `обратный вызов` {Function} 
  * `err` {Error}
  * `files` {string[]|Buffer[]}

Асинхронный readdir(3). Считывает содержимое каталога. The callback gets two arguments `(err, files)` where `files` is an array of the names of the files in the directory excluding `'.'` and `'..'`.

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use for the filenames passed to the callback. If the `encoding` is set to `'buffer'`, the filenames returned will be passed as `Buffer` objects.

## fs.readdirSync(path[, options])

<!-- YAML
added: v0.1.21
changes:

  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `опции` {string|Object} 
  * `encoding` {string} **По умолчанию:** `'utf8'`

Синхронный readdir(3). Returns an array of filenames excluding `'.'` and `'..'`.

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use for the filenames passed to the callback. If the `encoding` is set to `'buffer'`, the filenames returned will be passed as `Buffer` objects.

## fs.readFile(path[, options], callback)

<!-- YAML
added: v0.1.29
changes:

  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v5.1.0
    pr-url: https://github.com/nodejs/node/pull/3740
    description: The `callback` will always be called with `null` as the `error`
                 parameter in case of success.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: The `path` parameter can be a file descriptor now.
-->

* `path` {string|Buffer|URL|integer} filename or file descriptor
* `опции` {Object|string} 
  * `encoding` {string|null} **Default:** `null`
  * `flag` {string} **Default:** `'r'`
* `обратный вызов` {Function} 
  * `err` {Error}
  * `data` {string|Buffer}

Асинхронно считывает все содержимое файла. Пример:

```js
fs.readFile('/etc/passwd', (err, data) => {
  if (err) throw err;
  console.log(data);
});
```

The callback is passed two arguments `(err, data)`, where `data` is the contents of the file.

Если кодировка не указана, то вернется необработанный буфер.

Если параметр `options` является строкой, то он указывает кодировку. Пример:

```js
fs.readFile('/etc/passwd', 'utf8', callback);
```

*Note*: When the path is a directory, the behavior of `fs.readFile()` and [`fs.readFileSync()`][] is platform-specific. On macOS, Linux, and Windows, an error will be returned. On FreeBSD, a representation of the directory's contents will be returned.

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

Любой указанный файловый дескриптор должен поддерживать чтение.

*Note*: If a file descriptor is specified as the `path`, it will not be closed automatically.

*Note*: `fs.readFile()` reads the entire file in a single threadpool request. To minimize threadpool task length variation, prefer the partitioned APIs `fs.read()` and `fs.createReadStream()` when reading files as part of fulfilling a client request.

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
* `опции` {Object|string} 
  * `encoding` {string|null} **Default:** `null`
  * `flag` {string} **Default:** `'r'`

Синхронная версия [`fs.readFile()`][]. Returns the contents of the `path`.

If the `encoding` option is specified then this function returns a string. В противном случае она возвращает буфер.

*Note*: Similar to [`fs.readFile()`][], when the path is a directory, the behavior of `fs.readFileSync()` is platform-specific.

```js
// macOS, Linux, and Windows
fs.readFileSync('<directory>');
// => [Error: EISDIR: illegal operation on a directory, read <directory>]

//  FreeBSD
fs.readFileSync('<directory>'); // => null, <data>
```

## fs.readlink(path[, options], callback)

<!-- YAML
added: v0.1.31
changes:

  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `опции` {string|Object} 
  * `encoding` {string} **По умолчанию:** `'utf8'`
* `обратный вызов` {Function} 
  * `err` {Error}
  * `linkString` {string|Buffer}

Асинхронный readlink(2). Обратный вызов принимает два аргумента `(err, linkString)`.

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use for the link path passed to the callback. If the `encoding` is set to `'buffer'`, the link path returned will be passed as a `Buffer` object.

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
* `опции` {string|Object} 
  * `encoding` {string} **По умолчанию:** `'utf8'`

Синхронный readlink(2). Возвращает значение строки символической ссылки.

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use for the link path passed to the callback. If the `encoding` is set to `'buffer'`, the link path returned will be passed as a `Buffer` object.

## fs.readSync(fd, buffer, offset, length, position)

<!-- YAML
added: v0.1.21
changes:

  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4518
    description: The `length` parameter can now be `0`.
-->

* `fd` {integer}
* `buffer` {Buffer|Uint8Array}
* `offset` {integer}
* `length` {integer}
* `position` {integer}

Синхронная версия [`fs.read()`][]. Возвращает количество `bytesRead`.

## fs.realpath(path[, options], callback)

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
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7899
    description: Calling `realpath` now works again for various edge cases
                 on Windows.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/3594
    description: The `cache` parameter was removed.
-->

* `path` {string|Buffer|URL}
* `опции` {string|Object} 
  * `encoding` {string} **По умолчанию:** `'utf8'`
* `обратный вызов` {Function} 
  * `err` {Error}
  * `resolvedPath` {string|Buffer}

Асинхронный realpath(3). `callback` получает два аргумента `(err, resolvedPath)`. Может использовать `process.cwd` для разрешения относительных путей.

Поддерживаются только те пути, которые могут быть преобразованы в строки UTF8.

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use for the path passed to the callback. If the `encoding` is set to `'buffer'`, the path returned will be passed as a `Buffer` object.

*Note*: If `path` resolves to a socket or a pipe, the function will return a system dependent name for that object.

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
* `опции` {string|Object} 
  * `encoding` {string} **По умолчанию:** `'utf8'`

Синхронный realpath(3). Возвращает разрешенный путь.

Поддерживаются только те пути, которые могут быть преобразованы в строки UTF8.

The optional `options` argument can be a string specifying an encoding, or an object with an `encoding` property specifying the character encoding to use for the returned value. If the `encoding` is set to `'buffer'`, the path returned will be passed as a `Buffer` object.

*Note*: If `path` resolves to a socket or a pipe, the function will return a system dependent name for that object.

## fs.rename(oldPath, newPath, callback)

<!-- YAML
added: v0.0.2
changes:

  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `oldPath` and `newPath` parameters can be WHATWG `URL`
                 objects using `file:` protocol. Support is currently still
                 *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `oldPath` {string|Buffer|URL}
* `newPath` {string|Buffer|URL}
* `обратный вызов` {Function} 
  * `err` {Error}

Asynchronously rename file at `oldPath` to the pathname provided as `newPath`. In the case that `newPath` already exists, it will be overwritten. No arguments other than a possible exception are given to the completion callback.

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

  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameters can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `обратный вызов` {Function} 
  * `err` {Error}

Асинхронный rmdir(2). No arguments other than a possible exception are given to the completion callback.

*Note*: Using `fs.rmdir()` on a file (not a directory) results in an `ENOENT` error on Windows and an `ENOTDIR` error on POSIX.

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

*Note*: Using `fs.rmdirSync()` on a file (not a directory) results in an `ENOENT` error on Windows and an `ENOTDIR` error on POSIX.

## fs.stat(path, callback)

<!-- YAML
added: v0.0.2
changes:

  - version: v9.9.0
    pr-url: https://github.com/nodejs/node/pull/18801
    description: The `as` and `as+` modes are supported now.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `обратный вызов` {Function} 
  * `err` {Error}
  * `stats` {fs.Stats}

Асинхронный stat(2). The callback gets two arguments `(err, stats)` where `stats` is an [`fs.Stats`][] object.

В случае ошибки `err.code` будет одной из [Общих Системных Ошибок](errors.html#errors_common_system_errors).

Using `fs.stat()` to check for the existence of a file before calling `fs.open()`, `fs.readFile()` or `fs.writeFile()` is not recommended. Instead, user code should open/read/write the file directly and handle the error raised if the file is not available.

To check if a file exists without manipulating it afterwards, [`fs.access()`] is recommended.

## fs.statSync(path)

<!-- YAML
added: v0.1.21
changes:

  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}

Синхронный stat(2). Возвращает экземпляр [`fs.Stats`][].

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
* `обратный вызов` {Function} 
  * `err` {Error}

Асинхронный symlink(2). No arguments other than a possible exception are given to the completion callback. The `type` argument can be set to `'dir'`, `'file'`, or `'junction'` and is only available on Windows (ignored on other platforms). Note that Windows junction points require the destination path to be absolute. When using `'junction'`, the `target` argument will automatically be normalized to absolute path.

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

Синхронный symlink(2). Возвращает `undefined`.

## fs.truncate(path[, len], callback)

<!-- YAML
added: v0.8.6
changes:

  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `len` {integer} **Default:** `0`
* `обратный вызов` {Function} 
  * `err` {Error}

Асинхронный truncate(2). No arguments other than a possible exception are given to the completion callback. A file descriptor can also be passed as the first argument. В этом случае вызывается `fs.ftruncate()`.

## fs.truncateSync(path[, len])

<!-- YAML
added: v0.8.6
-->

* `path` {string|Buffer|URL}
* `len` {integer} **Default:** `0`

Синхронный truncate(2). Возвращает `undefined`. A file descriptor can also be passed as the first argument. В этом случае вызывается `fs.ftruncateSync()`.

## fs.unlink(path, callback)

<!-- YAML
added: v0.0.2
changes:

  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `обратный вызов` {Function} 
  * `err` {Error}

Asynchronously removes a file or symbolic link. No arguments other than a possible exception are given to the completion callback.

```js
// Assuming that 'path/file.txt' is a regular file.
fs.unlink('path/file.txt', (err) => {
  if (err) throw err;
  console.log('path/file.txt was deleted');
});
```

`fs.unlink()` will not work on a directory, empty or otherwise. To remove a directory, use [`fs.rmdir()`][].

See also: unlink(2)

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

Остановить отслеживание изменений на `filename`. If `listener` is specified, only that particular listener is removed. Otherwise, *all* listeners are removed, effectively stopping watching of `filename`.

Calling `fs.unwatchFile()` with a filename that is not being watched is a no-op, not an error.

*Примечание*: [`fs.watch()`][] более эффективен, чем `fs.watchFile()` и `fs.unwatchFile()`. `fs.watch()` should be used instead of `fs.watchFile()` and `fs.unwatchFile()` when possible.

## fs.utimes(path, atime, mtime, callback)

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
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v4.1.0
    pr-url: https://github.com/nodejs/node/pull/2387
    description: Numeric strings, `NaN` and `Infinity` are now allowed
                 time specifiers.
-->

* `path` {string|Buffer|URL}
* `atime` {number|string|Date}
* `mtime` {number|string|Date}
* `обратный вызов` {Function} 
  * `err` {Error}

Change the file system timestamps of the object referenced by `path`.

The `atime` and `mtime` arguments follow these rules:

* Values can be either numbers representing Unix epoch time, `Date`s, or a numeric string like `'123456789.0'`.
* If the value can not be converted to a number, or is `NaN`, `Infinity` or `-Infinity`, a `Error` will be thrown.

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

Синхронная версия [`fs.utimes()`][]. Возвращает `undefined`.

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
* `опции` {string|Object} 
  * `persistent` {boolean} Indicates whether the process should continue to run as long as files are being watched. **Default:** `true`.
  * `recursive` {boolean} Indicates whether all subdirectories should be watched, or only the current directory. This applies when a directory is specified, and only on supported platforms (See [Caveats](#fs_caveats)). **По умолчанию:** `false`.
  * `encoding` {string} Specifies the character encoding to be used for the filename passed to the listener. **Default:** `'utf8'`.
* `слушатель` {Function|undefined} **Default:** `undefined` 
  * `eventType` {string}
  * `filename` {string|Buffer}

Watch for changes on `filename`, where `filename` is either a file or a directory. [`fs.FSWatcher`][] - возвращаемый объект.

Второй аргумент является необязательным. If `options` is provided as a string, it specifies the `encoding`. В противном случае параметр `options` передается в качестве объекта.

Обратный вызов слушателя получит два аргумента `(eventType, filename)`. `eventType` is either `'rename'` or `'change'`, and `filename` is the name of the file which triggered the event.

Note that on most platforms, `'rename'` is emitted whenever a filename appears or disappears in the directory.

Also note the listener callback is attached to the `'change'` event fired by [`fs.FSWatcher`][], but it is not the same thing as the `'change'` value of `eventType`.

### Предупреждения

<!--type=misc-->

The `fs.watch` API is not 100% consistent across platforms, and is unavailable in some situations.

Рекурсивная опция поддерживается только на macOS and Windows.

#### Доступность

<!--type=misc-->

This feature depends on the underlying operating system providing a way to be notified of filesystem changes.

* В системах Linux используется [`inotify`]
* В системах BSD используется [`kqueue`]
* В macOS используется [`kqueue`] для файлов и [`FSEvents`] для каталогов.
* В системах SunOS (включая Solaris и SmartOS) используется [`event ports`].
* В системах Windows эта функция зависит от [`ReadDirectoryChangesW`].
* В системах Aix эта функция зависит от [`AHAFS`], который должен быть включен.

If the underlying functionality is not available for some reason, then `fs.watch` will not be able to function. For example, watching files or directories can be unreliable, and in some cases impossible, on network file systems (NFS, SMB, etc), or host file systems when using virtualization software such as Vagrant, Docker, etc.

It is still possible to use `fs.watchFile()`, which uses stat polling, but this method is slower and less reliable.

#### Индексные дескрипторы

<!--type=misc-->

On Linux and macOS systems, `fs.watch()` resolves the path to an [inode](https://en.wikipedia.org/wiki/Inode) and watches the inode. If the watched path is deleted and recreated, it is assigned a new inode. The watch will emit an event for the delete but will continue watching the *original* inode. События для нового индексного дескриптора не будут созданы. Это ожидаемое поведение.

AIX files retain the same inode for the lifetime of a file. Saving and closing a watched file on AIX will result in two notifications (one for adding new content, and one for truncation).

#### Аргумент имени файла

<!--type=misc-->

Providing `filename` argument in the callback is only supported on Linux, macOS, Windows, and AIX. Even on supported platforms, `filename` is not always guaranteed to be provided. Therefore, don't assume that `filename` argument is always provided in the callback, and have some fallback logic if it is null.

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
* `опции` {Object} 
  * `persistent` {boolean} **Default:** `true`
  * `interval` {integer} **Default:** `5007`
* `слушатель` {Function} 
  * `current` {fs.Stats}
  * `previous` {fs.Stats}

Отслеживание изменений в `filename`. The callback `listener` will be called each time the file is accessed.

Аргумент `options` может быть опущен. Если он предусмотрен, то должен быть объектом. The `options` object may contain a boolean named `persistent` that indicates whether the process should continue to run as long as files are being watched. The `options` object may specify an `interval` property indicating how often the target should be polled in milliseconds.

The `listener` gets two arguments the current stat object and the previous stat object:

```js
fs.watchFile('message.text', (curr, prev) => {
  console.log(`текущий mtime: ${curr.mtime}`);
  console.log(`предыдущий mtime был: ${prev.mtime}`);
});
```

Эти stat объекты являются экземплярами `fs.Stat`.

To be notified when the file was modified, not just accessed, it is necessary to compare `curr.mtime` and `prev.mtime`.

*Note*: When an `fs.watchFile` operation results in an `ENOENT` error, it will invoke the listener once, with all the fields zeroed (or, for dates, the Unix Epoch). In Windows, `blksize` and `blocks` fields will be `undefined`, instead of zero. If the file is created later on, the listener will be called again, with the latest stat objects. Это изменение функциональности начинается с версии v0.10.

*Note*: [`fs.watch()`][] is more efficient than `fs.watchFile` and `fs.unwatchFile`. `fs.watch` should be used instead of `fs.watchFile` and `fs.unwatchFile` when possible.

*Note:* When a file being watched by `fs.watchFile()` disappears and reappears, then the `previousStat` reported in the second callback event (the file's reappearance) will be the same as the `previousStat` of the first callback event (its disappearance).

Это происходит, когда:

* файл удален с последующим восстановлением
* переименование файла дважды - возвращение к изначальному имени во второй раз

## fs.write(fd, buffer[, offset[, length[, position]]], callback)

<!-- YAML
added: v0.0.2
changes:

  - version: v7.4.0
    pr-url: https://github.com/nodejs/node/pull/10382
    description: The `buffer` parameter can now be a `Uint8Array`.
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/7856
    description: The `offset` and `length` parameters are optional now.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd` {integer}
* `buffer` {Buffer|Uint8Array}
* `offset` {integer}
* `length` {integer}
* `position` {integer}
* `обратный вызов` {Function} 
  * `err` {Error}
  * `bytesWritten` {integer}
  * `buffer` {Buffer|Uint8Array}

Запись `buffer` в файл, указанный `fd`.

`offset` determines the part of the buffer to be written, and `length` is an integer specifying the number of bytes to write.

`position` refers to the offset from the beginning of the file where this data should be written. If `typeof position !== 'number'`, the data will be written at the current position. Смотрите pwrite(2).

The callback will be given three arguments `(err, bytesWritten, buffer)` where `bytesWritten` specifies how many *bytes* were written from `buffer`.

If this method is invoked as its [`util.promisify()`][]ed version, it returns a Promise for an object with `bytesWritten` and `buffer` properties.

Note that it is unsafe to use `fs.write` multiple times on the same file without waiting for the callback. For this scenario, `fs.createWriteStream` is strongly recommended.

В Linux позиционные записи не работают, когда файл открыт в режиме добавления. The kernel ignores the position argument and always appends the data to the end of the file.

## fs.write(fd, string[, position[, encoding]], callback)

<!-- YAML
added: v0.11.5
changes:

  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/7856
    description: The `position` parameter is optional now.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd` {integer}
* `string` {string}
* `position` {integer}
* `encoding` {string}
* `обратный вызов` {Function} 
  * `err` {Error}
  * `written` {integer}
  * `string` {string}

Запись `string` в файл, указанный `fd`. If `string` is not a string, then the value will be coerced to one.

`position` refers to the offset from the beginning of the file where this data should be written. If `typeof position !== 'number'` the data will be written at the current position. Смотрите pwrite(2).

`encoding` - ожидаемое кодирование строки.

The callback will receive the arguments `(err, written, string)` where `written` specifies how many *bytes* the passed string required to be written. Note that bytes written is not the same as string characters. Смотрите [`Buffer.byteLength`][].

В отличие от записи `buffer`, строка должна записываться полностью. No substring may be specified. This is because the byte offset of the resulting data may not be the same as the string offset.

Note that it is unsafe to use `fs.write` multiple times on the same file without waiting for the callback. For this scenario, `fs.createWriteStream` is strongly recommended.

В Linux позиционные записи не работают, когда файл открыт в режиме добавления. The kernel ignores the position argument and always appends the data to the end of the file.

## fs.writeFile(file, data[, options], callback)

<!-- YAML
added: v0.1.29
changes:

  - version: v7.4.0
    pr-url: https://github.com/nodejs/node/pull/10382
    description: The `data` parameter can now be a `Uint8Array`.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: The `file` parameter can be a file descriptor now.
-->

* `file` {string|Buffer|URL|integer} имя файла или файловый дескриптор
* `data` {string|Buffer|Uint8Array}
* `опции` {Object|string} 
  * `encoding` {string|null} **По умолчанию:** `'utf8'`
  * `mode` {integer} **Default:** `0o666`
  * `flag` {string} **Default:** `'w'`
* `обратный вызов` {Function} 
  * `err` {Error}

Асинхронно записывает данные в файл, заменяя файл, если он уже существует. `data` может быть строкой или буфером.

Опция `encoding` игнорируется, если `data` является буфером.

Пример:

```js
fs.writeFile('message.txt', 'Hello Node.js', (err) => {
  if (err) throw err;
  console.log('Файл сохранен!');
});
```

Если параметр `options` является строкой, то он указывает кодировку. Пример:

```js
fs.writeFile('message.txt', 'Hello Node.js', 'utf8', callback);
```

Любой заданный файловый дескриптор должен поддерживать запись.

Note that it is unsafe to use `fs.writeFile` multiple times on the same file without waiting for the callback. For this scenario, `fs.createWriteStream` is strongly recommended.

*Note*: If a file descriptor is specified as the `file`, it will not be closed automatically.

## fs.writeFileSync(file, data[, options])

<!-- YAML
added: v0.1.29
changes:

  - version: v7.4.0
    pr-url: https://github.com/nodejs/node/pull/10382
    description: The `data` parameter can now be a `Uint8Array`.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: The `file` parameter can be a file descriptor now.
-->

* `file` {string|Buffer|URL|integer} имя файла или файловый дескриптор
* `data` {string|Buffer|Uint8Array}
* `опции` {Object|string} 
  * `encoding` {string|null} **По умолчанию:** `'utf8'`
  * `mode` {integer} **Default:** `0o666`
  * `flag` {string} **Default:** `'w'`

Синхронная версия [`fs.writeFile()`][]. Возвращает `undefined`.

## fs.writeSync(fd, buffer[, offset[, length[, position]]])

<!-- YAML
added: v0.1.21
changes:

  - version: v7.4.0
    pr-url: https://github.com/nodejs/node/pull/10382
    description: The `buffer` parameter can now be a `Uint8Array`.
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/7856
    description: The `offset` and `length` parameters are optional now.
-->

* `fd` {integer}
* `buffer` {Buffer|Uint8Array}
* `offset` {integer}
* `length` {integer}
* `position` {integer}

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

Синхронная версия [`fs.write()`][]. Возвращает количество записанных байтов.

## Константы FS

Следующие константы экспортируются с помощью `fs.constants`.

*Note*: Not every constant will be available on every operating system.

### Константы доступа к файлу

Следующие константы предназначены для использования с [`fs.access()`][].

<table>
  <tr>
    <th>Константа</th>
    <th>Описание</th>
  </tr>
  <tr>
    <td><code>F_OK</code></td>
    <td>Флаг, указывающий, что файл виден для вызывающего процесса.</td>
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
   процессом.</td>
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
    <td>Флаг, указывающий, что доступ для чтения к файловой системе больше не приведет к обновлению информации "atime", связанной с файлом.
    Этот флаг доступен только на операционных системах Linux.</td>
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

The following constants are meant for use with the [`fs.Stats`][] object's `mode` property for determining a file's type.

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

The following constants are meant for use with the [`fs.Stats`][] object's `mode` property for determining the access permissions for a file.

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
