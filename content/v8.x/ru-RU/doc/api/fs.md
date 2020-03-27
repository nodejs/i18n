# Файловая система

<!--introduced_in=v0.10.0-->

> Стабильность: 2 - Стабильно

<!--name=fs-->

Файловый ввод-вывод обеспечивается простыми врапперами вокруг стандартных функций POSIX. Чтобы использовать этот модуль, выполните `require('fs')`. Все эти методы имеют асинхронные и синхронные формы.

Асинхронная форма всегда принимает обратный вызов завершения в качестве его последнего аргумента. Аргументы, переданные обратному вызову завершения, зависят от метода, но первый аргумент всегда зарезервирован для исключения. В случае успешного завершения операции, первый аргумент будет `нулевой` или `неопределенный`.

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

При использовании асинхронных методов нет гарантии в последовательности. Поэтому следующее подвержено ошибке:

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

В загруженных процессах программисту _настоятельно рекомендуется_ использовать асинхронные версии этих вызовов. Пока синхронные версии не завершат выполнение, они будут блокировать процесс, что послужит причиной приостановки всех соединений.

Можно использовать связанный путь к имени файла. Но помните, что этот путь будет связан с `process.cwd()`.

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

Функции `fs` поддерживают передачу и получение путей как в виде строк, так и буферов. Последний предназначен для работы с файловыми системами, которые допускают имена файлов не в формате UTF-8. Для большинства типичных применений работа с путями в качестве буферов будет лишней, поскольку строковый API автоматически преобразуется в UTF-8 и из него.

*Note*: On certain file systems (such as NTFS and HFS+) filenames will always be encoded as UTF-8. В таких файловых системах буферы, закодированные не в формате UTF-8, будут передаваться функциям `fs` не так, как ожидалось.

## Класс: fs.FSWatcher
<!-- YAML
added: v0.5.8
-->

Объекты, возвращенные из [`fs.watch()`][], относятся к этому типу.

Обратный вызов `listener`, предоставленный `fs.watch()`, получает возвращенные события `change` FSWatcher.

Сам объект создает эти события:

### Событие: "change"'
<!-- YAML
added: v0.5.8
-->

* `eventType` {string} Тип изменения fs
* `filename` {string|Buffer} Имя файла, которое изменилось (если релевантно/допустимо)

Создается, когда что-то меняется в отслеживаемом каталоге или файле. Более подробно смотрите в [`fs.watch()`][].

Аргумент `filename` может не предоставляться в зависимости от поддержки операционной системы. Когда `filename` предоставляется, то он будет `Buffer`, если `fs.watch()` вызывается с опцией `encoding`, установленной на `'buffer'`; в противном случае `filename` будет строкой.

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

Путь к файлу, из которого читается поток, как указано в первом аргументе для `fs.createReadStream()`. Если `path` передается в качестве строки, то `readStream.path` будет строкой. Если `path` передается в качестве `Buffer`, то `readStream.path` будет `Buffer`.

## Класс: fs.Stats
<!-- YAML
added: v0.1.21
changes:
  - version: v8.1.0
    pr-url: https://github.com/nodejs/node/pull/13173
    description: Added times as numbers.
-->

Objects returned from [`fs.stat()`][], [`fs.lstat()`][] and [`fs.fstat()`][] and their synchronous counterparts are of this type.

 - `stats.isFile()`
 - `stats.isDirectory()`
 - `stats.isBlockDevice()`
 - `stats.isCharacterDevice()`
 - `stats.isSymbolicLink()` (действительно только с [`fs.lstat()`][])
 - `stats.isFIFO()`
 - `stats.isSocket()`

Для обычного файла [`util.inspect(stats)`][] будет возвращать строку очень похожую на эту:

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

* `atime` "Время доступа" - Время, когда данные файлов последний раз были доступны. Изменено с помощью системных вызовов mknod(2), utimes(2) и read(2).
* `mtime` "Время изменения" - Время, когда данные файла последний раз изменялись. Изменено с помощью системных вызовов mknod(2), utimes(2) и write(2).
* `ctime` "Изменить время" - Время, когда статус файла последний раз изменялся (модификация данных inode). Изменено с помощью системных вызовов chmod(2), chown(2), link(2), mknod(2), rename(2), unlink(2), utimes(2), read(2) и write(2).
* `birthtime` "Время рождения" - Время создания файла. Установите один раз, когда создается файл. В файловых системах, где время рождения недоступно, это поле может содержать `ctime` или `1970-01-01T00:00Z` (т.е. метка времени эпохи unix `0`). Обратите внимание, что в данном случае значение может быть больше, чем `atime` или `mtime`. Также устанавливается в системе Darwin и других вариантах FreeBSD, если `atime` явно установлен на более раннее значение, чем текущее `birthtime`; для этого используется системный вызов utimes(2).

`ctime` поддерживал `birthtime` в системах Windows до Node v0.12. Обратите внимание, что по состоянию на v0.12 `ctime` не является "временем создания", а в системах Unix этого никогда и не было.

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

Количество байтов, записанных на данный момент. Не содержит данные, которые все еще находятся в очереди для записи.

### writeStream.path
<!-- YAML
added: v0.1.93
-->

Путь к файлу, куда записывается поток, как указано в первом аргументе для `fs.createWriteStream()`. Если `path` передается в качестве строки, то `writeStream.path` будет строкой. Если `path` передается в качестве `Buffer`, то `writeStream.path` будет `Buffer`.

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
* `callback` {Function}
  * `err` {Error}

Проверяет права пользователя для файла или каталога, указанного с помощью `path`. Аргумент `mode` - опциональное целое число, которое задает необходимое выполнение проверок доступности. Следующие константы определяют возможные значения `mode`. It is possible to create a mask consisting of the bitwise OR of two or more values (e.g. `fs.constants.W_OK | fs.constants.R_OK`).

* `fs.constants.F_OK` - `path` виден вызывающему процессу. Это полезно, чтобы определить наличие файла, но ничего не говорит о разрешениях `rwx`. Установлен по умолчанию, если `mode` не задан.
* `fs.constants.R_OK` - `path` может быть прочитан вызывающим процессом.
* `fs.constants.W_OK` - `path` может быть записан вызывающим процессом.
* `fs.constants.X_OK` - `path` может быть выполнен вызывающим процессом. Это не работает на Windows (будет вести себя как `fs.constants.F_OK`).

Последний аргумент - `callback` - функция обратного вызова, которая вызывается с возможным аргументом ошибки. If any of the accessibility checks fail, the error argument will be an `Error` object. Следующий пример проверяет, может ли текущий процесс прочитать и записать файл `/etc/passwd`.

```js
fs.access('/etc/passwd', fs.constants.R_OK | fs.constants.W_OK, (err) => {
  console.log(err ? 'no access!' : 'can read/write');
});
```

Не рекомендуется использовать `fs.access()` для проверки доступности файла перед вызовом `fs.open()`, `fs.readFile()` или `fs.writeFile()`. Это вводит условие гонки, потому что другие процессы могут изменять состояние файла между двумя вызовами. Вместо этого пользовательский код должен открывать/читать/записывать файл напрямую и обрабатывать возникшую ошибку, если файл недоступен.

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
* Возвращает: {undefined}

Synchronously tests a user's permissions for the file or directory specified by `path`. The `mode` argument is an optional integer that specifies the accessibility checks to be performed. The following constants define the possible values of `mode`. It is possible to create a mask consisting of the bitwise OR of two or more values (e.g. `fs.constants.W_OK | fs.constants.R_OK`).

* `fs.constants.F_OK` - `path` виден вызывающему процессу. Это полезно, чтобы определить наличие файла, но ничего не говорит о разрешениях `rwx`. Установлен по умолчанию, если `mode` не задан.
* `fs.constants.R_OK` - `path` может быть прочитан вызывающим процессом.
* `fs.constants.W_OK` - `path` может быть записан вызывающим процессом.
* `fs.constants.X_OK` - `path` может быть выполнен вызывающим процессом. Это не работает на Windows (будет вести себя как `fs.constants.F_OK`).

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
* `options` {Object|string}
  * `encoding` {string|null} **По умолчанию:** `'utf8'`
  * `mode` {integer} **Default:** `0o666`
  * `flag` {string} **Default:** `'a'`
* `callback` {Function}
  * `err` {Error}

Asynchronously append data to a file, creating the file if it does not yet exist. `data` can be a string or a [`Buffer`][].

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
* `options` {Object|string}
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
* `callback` {Function}
  * `err` {Error}

Асинхронно изменяет права доступа к файлу. Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова.

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
* `callback` {Function}
  * `err` {Error}

Асинхронно меняет владельца и группу файла. Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова.

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
* `options` {string|Object}
  * `flags` {string}
  * `encoding` {string}
  * `fd` {integer}
  * `mode` {integer}
  * `autoClose` {boolean}
  * `start` {integer}
  * `end` {integer}
  * `highWaterMark` {integer}

Возвращает новый объект [`ReadStream`][]. (См. [Readable Stream](stream.html#stream_class_stream_readable)).

Имейте в виду, что в отличие от значения по умолчанию, установленного для `highWaterMark` в читаемом потоке (16 КБ), поток, возвращаемый этим методом, имеет значение по умолчанию 64 КБ для того же параметра.

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

Параметр `options` может включать в себя значения `start` и `end` для чтения определенного диапазона байтов вместо всего файла. И `start`, и `end` включительно и начинают отсчет с 0. Если указан `fd` и `start` опущен или `undefined`, то `fs.createReadStream()` последовательно читает из текущей позиции файла. `encoding` может быть одним из тех, что принимает [`Buffer`][].

Если указан `fd`, то `ReadStream` будет игнорировать аргумент `path` и будет использовать указанный файловый дескриптор. Это означает, что событие `'open'` не будет создано. Обратите внимание, что `fd` должно быть блокирующим; неблокирующие `fd` должны передаваться [`net.Socket`][].

Если `autoClose` имеет значение false, то файловый дескриптор не будет закрыт, даже при наличии ошибки. It is the application's responsibility to close it and make sure there's no file descriptor leak. Если `autoClose` имеет значение true (поведение по умолчанию), то при `error` или `end` файловый дескриптор закроется автоматически.

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

Параметр `options` также может включать в себя опцию `start`, что разрешает записывать данные в некоторой позиции после начала файла. Чтобы модифицировать файл, а не заменить его, может потребоваться режим `flags` `r+` вместо режима по умолчанию `w`. The `encoding` can be any one of those accepted by [`Buffer`][].

Если `autoClose` установлено на true (поведение по умолчанию), то при `error` или `end` файловый дескриптор закроется автоматически. Если `autoClose` имеет значение false, то файловый дескриптор не закроется, даже при наличии ошибки. It is the application's responsibility to close it and make sure there's no file descriptor leak.

Если указан `fd`, то `WriteStream` будет игнорировать аргумент `path` и будет использовать указанный файловый дескриптор, аналогично [`ReadStream`][]. Это означает, что событие `'open'` не будет создано. Обратите внимание, что `fd` должен быть блокирующим, неблокирующие `fd` должны передаваться [`net.Socket`][].

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

Проверьте наличие данного пути с помощью файловой системы. Затем вызовите аргумент `callback` со значением true или false. Пример:

```js
fs.exists('/etc/passwd', (exists) => {
  console.log(exists ? 'it\'s there' : 'no passwd!');
});
```

**Обратите внимание, что этот обратный вызов не согласуется с другими обратными вызовами Node.js.** Обычно первый параметр обратного вызова Node.js - `err`, за которым могут следовать другие параметры. У обратного вызова `fs.exists()` есть только один логический параметр. Это одна из причин, по которой `fs.access()` рекомендуется вместо `fs.exists()`.

Не рекомендуется использовать `fs.exists()` для проверки наличия файла перед вызовом `fs.open()`, `fs.readFile()` или `fs.writeFile()`. Это вводит условие гонки, потому что другие процессы могут изменять состояние файла между двумя вызовами. Вместо этого пользовательский код должен открывать/читать/записывать файл напрямую и обрабатывать возникшую ошибку, если файл не существует.

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

Синхронная версия [`fs.exists()`][]. Если путь существует, возвращает `true`, в противном случае - `false`.

Обратите внимание, что устарел `fs.exists()`, но не `fs.existsSync()`. (Параметр `callback` для `fs.exists()` принимает параметры, которые несовместимы с другими обратными вызовами Node.js. `fs.existsSync()` не использует обратную связь.)

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
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
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
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
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
* `callback` {Function}
  * `err` {Error}
  * `stats` {fs.Stats}

Асинхронный fstat(2). Обратный вызов получает два аргумента `(err, stats)`, где `stats` является объектом [`fs.Stats`][]. `fstat()` идентичен [`stat()`][], за исключением того, что файл, который будет создан, определяется файловым дескриптором `fd`.

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
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd` {integer}
* `len` {integer} **Default:** `0`
* `callback` {Function}
  * `err` {Error}

Асинхронный ftruncate(2). Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова.

Если файл, на который ссылается файловый дескриптор, был больше, чем `len` байтов, в файле будут сохранены только первые `len` байтов.

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

Если ранее файл был короче `len` байтов, он расширяется, а дополнительная часть заполняется нулевыми байтами ('\0'). Например,

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
* `callback` {Function}
  * `err` {Error}

Change the file system timestamps of the object referenced by the supplied file descriptor. See [`fs.utimes()`][].

*Примечание*: Эта функция не работает на версиях AIX до 7.1, она вернет ошибку `UV_ENOSYS`.

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
* `callback` {Function}
  * `err` {Error}

Асинхронный lchown(2). Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова.

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
* `callback` {Function}
  * `err` {Error}
  * `stats` {fs.Stats}

Асинхронный lstat(2). Обратный вызов получает два аргумента `(err, stats)`, где `stats` является объектом [`fs.Stats`][]. `lstat()` идентичен `stat()`, за исключением того, что, если `path` является символической ссылкой, то сама ссылка обрабатывается stat, а не файл, на который она ссылается.

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
* `callback` {Function}
  * `err` {Error}

Асинхронно создает каталог. Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова.

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
* `options` {string|Object}
  * `encoding` {string} **По умолчанию:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `folder` {string}

Создает уникальный временный каталог.

Генерирует шесть случайных символов, которые будут добавлены после необходимого `prefix` для создания уникального временного каталога.

Созданный путь к папке передается второму параметру обратного вызова в качестве строки.

Опциональный аргумент `options` может быть строкой, указывающей кодировку, или объектом со свойством `encoding`, который определяет используемую кодировку символов.

Пример:

```js
fs.mkdtemp(path.join(os.tmpdir(), 'foo-'), (err, folder) => {
  if (err) throw err;
  console.log(folder);
  // Печатает: /tmp/foo-itXde2 or C:\Users\...\AppData\Local\Temp\foo-itXde2
});
```

*Примечание*: Метод `fs.mkdtemp()` добавит шесть случайно выбранных символов непосредственно в строку `prefix`. For instance, given a directory `/tmp`, if the intention is to create a temporary directory *within* `/tmp`, the `prefix` *must* end with a trailing platform-specific path separator (`require('path').sep`).

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
* `options` {string|Object}
  * `encoding` {string} **По умолчанию:** `'utf8'`

Синхронная версия [`fs.mkdtemp()`][]. Возвращает путь к созданной папке.

Опциональный аргумент `options` может быть строкой, указывающей кодировку, или объектом со свойством `encoding`, который определяет используемую кодировку символов.

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
* `callback` {Function}
  * `err` {Error}
  * `fd` {integer}

Асинхронное открытие файла. См. open(2). Параметр `flags` может быть:

* `'r'` - Открыть файл для чтения. Исключение возникает, если файл не существует.

* `'r+'` - Открыть файл для чтения и записи. Исключение возникает, если файл не существует.

* `'rs+'` - Открыть файл для чтения и записи в синхронном режиме. Дает инструкцию ОС обойти кеш локальной файловой системы.

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

`mode` устанавливает режим файла (разрешение и sticky-биты), но только если файл был создан.

Обратный вызов принимает два аргумента `(err, fd)`.

Флаг исключения `'x'` (флаг `O_EXCL` в open(2)) гарантирует воссоздание `path`. На системах POSIX `path` считается существующим, даже если это символическая ссылка на несуществующий файл. Флаг исключения может работать или не работать с сетевыми файловыми системами.

Параметр `flags` также может быть числом, как задокументировано open(2); обычно используемые константы доступны из `fs.constants`. В Windows, где это применимо, флаги переводятся в их эквиваленты, например, `O_WRONLY` в `FILE_GENERIC_WRITE` или `O_EXCL|O_CREAT` в `CREATE_NEW`, как принято CreateFileW.

В Linux позиционные записи не работают, когда файл открыт в режиме добавления. Ядро игнорирует позиционный аргумент и всегда добавляет данные в конец файла.

*Примечание*: Поведение `fs.open()` зависит от платформы для некоторых флагов. As such, opening a directory on macOS and Linux with the `'a+'` flag - see example below - will return an error. Для сравнения: на Windows и FreeBSD вернется файловый дескриптор.

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

Некоторые символы (`< > : " / \ | ? *`) зарезервировано под Windows, как описано в [Наименование файлов, Пути и Пространство имен](https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx). Под NTFS, если имя файла содержит двоеточие, Node.js откроет поток файловой системы, как описано [этой страницей MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/bb540537.aspx).

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

Синхронная версия [`fs.open()`][]. Возвращает целое число, представляющее файловый дескриптор.

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
* `options` {string|Object}
  * `encoding` {string} **По умолчанию:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `files` {string[]|Buffer[]}

Асинхронный readdir(3). Считывает содержимое каталога. Обратный вызов получает два аргумента `(err, files)`, где `files` - массив имен файлов в каталоге, за исключением `'.'` и `'..'`.

Опциональный аргумент `options` может быть строкой, указывающей кодировку, или объектом со свойством `encoding`, определяющим используемую кодировку имен файлов, переданных обратному вызову. Если `encoding` установлен на `'buffer'`, возвращаемые имена файлов будут переданы в качестве объектов `Buffer`.

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
* `options` {string|Object}
  * `encoding` {string} **По умолчанию:** `'utf8'`

Синхронный readdir(3). Возвращает массив имен файлов, за исключением `'.'` и `'..'`.

Опциональный аргумент `options` может быть строкой, указывающей кодировку, или объектом со свойством `encoding`, определяющим используемую кодировку имен файлов, переданных обратному вызову. Если `encoding` установлен на `'buffer'`, возвращаемые имена файлов будут переданы в качестве объектов `Buffer`.

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
* `options` {Object|string}
  * `encoding` {string|null} **Default:** `null`
  * `flag` {string} **Default:** `'r'`
* `callback` {Function}
  * `err` {Error}
  * `data` {string|Buffer}

Асинхронно считывает все содержимое файла. Пример:

```js
fs.readFile('/etc/passwd', (err, data) => {
  if (err) throw err;
  console.log(data);
});
```

Обратному вызову передается два аргумента `(err, data)`, где `data` - содержимое файла.

Если кодировка не указана, то вернется необработанный буфер.

Если параметр `options` является строкой, то он указывает кодировку. Пример:

```js
fs.readFile('/etc/passwd', 'utf8', callback);
```
*Примечание*: Когда путь является каталогом, поведение `fs.readFile()` и [`fs.readFileSync()`][] зависит от платформы. На macOS, Linux и Windows вернется ошибка. На FreeBSD вернется представление содержимого каталога.

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

*Примечание*: Если файловый дескриптор указан как `path`, он не закроется автоматически.

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
* `options` {Object|string}
  * `encoding` {string|null} **Default:** `null`
  * `flag` {string} **Default:** `'r'`

Синхронная версия [`fs.readFile()`][]. Returns the contents of the `path`.

Если указана опция `encoding`, то функция вернет строку. В противном случае она возвращает буфер.

*Примечание*: Подобно [`fs.readFile()`][], если путь является каталогом, то поведение `fs.readFileSync()` зависит от платформы.

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

Синхронный readlink(2). Возвращает значение строки символической ссылки.

Опциональный аргумент `options` может быть строкой, указывающей кодировку, или объектом со свойством `encoding`, определяющим кодировку символов, которая используется для пути ссылки, передаваемого обратному вызову. Если `encoding` установлен на `'buffer'`, возвращаемый путь ссылки будет передаваться в качестве объекта `Buffer`.

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
* `options` {string|Object}
  * `encoding` {string} **По умолчанию:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `resolvedPath` {string|Buffer}

Асинхронный realpath(3). `callback` получает два аргумента `(err, resolvedPath)`. Может использовать `process.cwd` для разрешения относительных путей.

Поддерживаются только те пути, которые могут быть преобразованы в строки UTF8.

Опциональный аргумент `options` может быть строкой, указывающей кодировку, или объектом со свойством `encoding`, определяющим используемую кодировку для пути, который передается обратному вызову. Если `encoding` установлен на `'buffer'`, то возвращаемый путь будет передан в качестве объекта `Buffer`.

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
* `options` {string|Object}
  * `encoding` {string} **По умолчанию:** `'utf8'`

Синхронный realpath(3). Возвращает разрешенный путь.

Поддерживаются только те пути, которые могут быть преобразованы в строки UTF8.

Опциональный аргумент `options` может быть строкой, указывающей кодировку, или объектом со свойством `encoding`, определяющим используемую кодировку для возвращаемого значения. Если `encoding` установлен на `'buffer'`, то возвращаемый путь будет передан в качестве объекта `Buffer`.

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
* `callback` {Function}
  * `err` {Error}

Асинхронный rmdir(2). Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова.

*Примечание*: Использование `fs.rmdir()` для файла (не каталога) приводит к ошибке `ENOENT` в Windows и ошибке `ENOTDIR` в POSIX.

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

*Примечание*: Использование `fs.rmdirSync()` для файла (не каталога) приводит к ошибке `ENOENT` в Windows и ошибке `ENOTDIR` в POSIX.

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
* `callback` {Function}
  * `err` {Error}
  * `stats` {fs.Stats}

Асинхронный stat(2). Обратный вызов получает два аргумента `(err, stats)`, где `stats` является объектом [`fs.Stats`][].

В случае ошибки `err.code` будет одной из [Общих Системных Ошибок](errors.html#errors_common_system_errors).

Не рекомендуется использовать `fs.stat()` для проверки наличия файла перед вызовом `fs.open()`, `fs.readFile()` или `fs.writeFile()`. Вместо этого пользовательский код должен открывать/читать/записывать файл напрямую и обрабатывать возникшую ошибку, если файл недоступен.

Для проверки наличия файла без дальнейшего манипулирования им, рекомендуется [`fs.access()`].

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
* `callback` {Function}
  * `err` {Error}

Асинхронный symlink(2). Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова. The `type` argument can be set to `'dir'`, `'file'`, or `'junction'` and is only available on Windows (ignored on other platforms). Обратите внимание, что точки соединения Windows требуют полный путь назначения. При использовании `'junction'` аргумент `target` будет автоматически приведен к полному пути.

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
* `callback` {Function}
  * `err` {Error}

Асинхронный truncate(2). Никакие аргументы, кроме возможного исключения, не задаются для завершающего обратного вызова. Файловый дескриптор также может передаваться в качестве первого аргумента. В этом случае вызывается `fs.ftruncate()`.

## fs.truncateSync(path[, len])
<!-- YAML
added: v0.8.6
-->

* `path` {string|Buffer|URL}
* `len` {integer} **Default:** `0`

Синхронный truncate(2). Возвращает `undefined`. Файловый дескриптор также может передаваться в качестве первого аргумента. В этом случае вызывается `fs.ftruncateSync()`.

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

Остановить отслеживание изменений на `filename`. Если указан `listener`, то удаляется только этот конкретный слушатель. Otherwise, *all* listeners are removed, effectively stopping watching of `filename`.

Вызов `fs.unwatchFile()` с именем файла, который не отслеживается, является пустой операцией, а не ошибкой.

*Note*: [`fs.watch()`][] is more efficient than `fs.watchFile()` and `fs.unwatchFile()`. `fs.watch()` should be used instead of `fs.watchFile()` and `fs.unwatchFile()` when possible.

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
* `callback` {Function}
  * `err` {Error}

Change the file system timestamps of the object referenced by `path`.

The `atime` and `mtime` arguments follow these rules:
- Values can be either numbers representing Unix epoch time, `Date`s, or a numeric string like `'123456789.0'`.
- If the value can not be converted to a number, or is `NaN`, `Infinity` or `-Infinity`, a `Error` will be thrown.

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
* `options` {string|Object}
  * `persistent` {boolean} Указывает, должен ли процесс продолжаться до тех пор, пока файлы отслеживаются. **Default:** `true`.
  * `recursive` {boolean} Указывает, следует ли отслеживать все подкаталоги или только текущий каталог. This applies when a directory is specified, and only on supported platforms (See [Caveats](#fs_caveats)). **Default:** `false`.
  * `encoding` {string} Определяет кодировку символов, которая будет использоваться для имени файла, переданного слушателю. **Default:** `'utf8'`.
* `listener` {Function|undefined} **Default:** `undefined`
  * `eventType` {string}
  * `filename` {string|Buffer}

Следите за изменениями в `filename`, где `filename` является файлом или каталогом. [`fs.FSWatcher`][] - возвращаемый объект.

Второй аргумент является необязательным. Если `options` предоставляется в виде строки, это указывает `encoding`. В противном случае параметр `options` передается в качестве объекта.

Обратный вызов слушателя получит два аргумента `(eventType, filename)`. `eventType` может быть `'rename'` или `'change'`, а `filename` - имя файла, которое вызвало событие.

Обратите внимание, что на большинстве платформ `'rename'` создается каждый раз, когда имя файла появляется или исчезает в каталоге.

Также обратите внимание, что обратный вызов слушателя присоединен к событию `'change'`, запущенному [`fs.FSWatcher`][], но это не то же самое, что значение `'change'` параметра `eventType`.

### Предупреждения

<!--type=misc-->

API `fs.watch` не на 100% совместим с разными платформами и не доступен в некоторых ситуациях.

Рекурсивная опция поддерживается только на macOS and Windows.

#### Доступность

<!--type=misc-->

Эта функция зависит от базовой операционной системы, обеспечивающей возможность получать уведомления об изменениях файловой системы.

* В системах Linux используется [`inotify`]
* В системах BSD используется [`kqueue`]
* В macOS используется [`kqueue`] для файлов и [`FSEvents`] для каталогов.
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

*Note*: When an `fs.watchFile` operation results in an `ENOENT` error, it will invoke the listener once, with all the fields zeroed (or, for dates, the Unix Epoch). In Windows, `blksize` and `blocks` fields will be `undefined`, instead of zero. If the file is created later on, the listener will be called again, with the latest stat objects. This is a change in functionality since v0.10.

*Примечание*: [`fs.watch()`][] более эффективен, чем `fs.watchFile` и `fs.unwatchFile`. Когда это возможно, `fs.watch` должен использоваться вместо `fs.watchFile` и `fs.unwatchFile`.

*Примечание:* Когда файл, просматриваемый `fs.watchFile()`, исчезает и появляется снова, то `previousStat` сообщенное во втором событии обратного вызова (повторное появление файла) будет таким же, как `previousStat` первого события обратного вызова (его исчезновение).

Это происходит, когда:
- файл удален с последующим восстановлением
- переименование файла дважды - возвращение к изначальному имени во второй раз

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
* `callback` {Function}
  * `err` {Error}
  * `bytesWritten` {integer}
  * `buffer` {Buffer|Uint8Array}

Запись `buffer` в файл, указанный `fd`.

`offset` определяет часть буфера для записи, а `length` - целое число, указывающее количество байтов для записи.

`position` относится к смещению от начала файла, в котором эти данные должны быть записаны. Если `typeof position !== 'number'`, данные будут записаны в текущей позиции. Смотрите pwrite(2).

The callback will be given three arguments `(err, bytesWritten, buffer)` where `bytesWritten` specifies how many _bytes_ were written from `buffer`.

If this method is invoked as its [`util.promisify()`][]ed version, it returns a Promise for an object with `bytesWritten` and `buffer` properties.

Обратите внимание, что небезопасно многократно использовать `fs.write` в одном и том же файле без ожидания обратного вызова. Для этого случая настоятельно рекомендуется использовать `fs.createWriteStream`.

В Linux позиционные записи не работают, когда файл открыт в режиме добавления. Ядро игнорирует позиционный аргумент и всегда добавляет данные в конец файла.

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
* `callback` {Function}
  * `err` {Error}
  * `written` {integer}
  * `string` {string}

Запись `string` в файл, указанный `fd`. Если `string` не является строкой, то значение будет приведено к одному.

`position` относится к смещению от начала файла, в котором эти данные должны быть записаны. Если `typeof position !== 'number'`, данные будут записаны в текущую позицию. Смотрите pwrite(2).

`encoding` - ожидаемое кодирование строки.

Обратный вызов получит аргументы `(err, written, string)`, где `written` указывает, сколько _bytes_ переданной строки нужно записать. Обратите внимание, что записанные байты не то же самое, что и строковые символы. Смотрите [`Buffer.byteLength`][].

В отличие от записи `buffer`, строка должна записываться полностью. Нельзя указать подстроку. Это связано с тем, что смещение байтов полученных данных может быть не равно смещению строк.

Обратите внимание, что небезопасно многократно использовать `fs.write` в одном и том же файле без ожидания обратного вызова. Для этого случая настоятельно рекомендуется использовать `fs.createWriteStream`.

В Linux позиционные записи не работают, когда файл открыт в режиме добавления. Ядро игнорирует позиционный аргумент и всегда добавляет данные в конец файла.

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
* `options` {Object|string}
  * `encoding` {string|null} **По умолчанию:** `'utf8'`
  * `mode` {integer} **Default:** `0o666`
  * `flag` {string} **Default:** `'w'`
* `callback` {Function}
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

Обратите внимание, что небезопасно многократно использовать `fs.writeFile` в одном и том же файле без ожидания обратного вызова. Для этого случая настоятельно рекомендуется использовать `fs.createWriteStream`.

*Примечание*: Если файловый дескриптор указан как `file`, то он не будет закрыт автоматически.

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
* `options` {Object|string}
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

