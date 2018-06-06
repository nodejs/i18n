# Path

<!--introduced_in=v0.10.0-->

> Kararlılık: 2 - Kararlı

`path` modülü, dosya ve dizin adresleriyle çalışmak için yardımcı araçlar sağlar. Modülü yüklemek için:

```js
const path = require('path');
```

## Windows vs. POSIX

`path` modülünün varsayılan ayarları, Node.js uygulamasının çalıştığı işletim sistemine göre değişiklik gösterir. Uygulama Windows işletim sistemi üzerinde çalışıyorsa, `path` modülü Windows tarzı dosya/dizin adreslemesi varsayacaktır.

Örneğin, `path.basename()` fonksiyonu, Windows tarzı bir dosya adresi (`C:\temp\myfile.html`) ile kullanıldığında, POSIX üzerindeki çıktısı, Windows üzerindeki çıktısından farklı olacaktır:

POSIX'te:

```js
path.basename('C:\\temp\\myfile.html');
// 'C:\\temp\\myfile.html'
```

Windows'ta:

```js
path.basename('C:\\temp\\myfile.html');
// 'myfile.html'
```

Windows tarzı adresleme kullanıyorsanız, uygulamanın çalıştığı işletim sisteminden bağımsız olarak tutarlı sonuçlar almak için, [`path.win32`][] kullanabilirsiniz:

POSIX ve Windows'ta:

```js
path.win32.basename('C:\\temp\\myfile.html');
// 'myfile.html'
```

POSIX tarzı adresleme kullanıyorsanız, uygulamanın çalıştığı işletim sisteminden bağımsız olarak tutarlı sonuçlar almak için, [`path.posix`][] kullanabilirsiniz:

POSIX ve Windows'ta:

```js
path.posix.basename('/tmp/myfile.html');
// 'myfile.html'
```

*Not:* Windows'ta, Node.js "her disk bir dizindir" mantığıyla çalışır. Bir dizin adresinde backslash kullanmayarak test edebilirsiniz. Mesela, `path.resolve('c:\\')` çıktısı `path.resolve('c:')` çıktısından farklı olabilir. [Bu MSDN sayfasında](https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247.aspx#fully_qualified_vs._relative_paths) detaylı açıklamasını bulabilirsiniz.

## path.basename(path[, ext])

<!-- YAML
added: v0.1.25
changes:

  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Passing a non-string as the `path` argument will throw now.
-->

* `path` {string}
* `ext` {string} dosya uzantısı (zorunlu değil)
* Çıktı: {string}

`path.basename()` metodları, girdi olarak verilen `path`'in son parçasını dönerler. Unix'deki `basename` komutu gibi davranırlar. Dizin adresi sonundaki ayraç hesaba katılmaz. bkz. [`path.sep`][].

```js
path.basename('/foo/bar/baz/asdf/quux.html');
// 'quux.html'

path.basename('/foo/bar/baz/asdf/quux.html', '.html');
// 'quux'
```

Eğer `path` argümanı bir string değilse, ya da `ext` argümanı verilmiş ancak bir string değilse [`TypeError`][] fırlatılır.

## path.delimiter

<!-- YAML
added: v0.9.3
-->

* {string}

Platformun kullandığı adresleme ayracını verir:

* Windows'ta: `;`
* POSIX'te: `:`

POSIX'te:

```js
console.log(process.env.PATH);
// '/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin'

process.env.PATH.split(path.delimiter);
// ['/usr/bin', '/bin', '/usr/sbin', '/sbin', '/usr/local/bin']
```

Windows'ta:

```js
console.log(process.env.PATH);
// 'C:\Windows\system32;C:\Windows;C:\Program Files\node\'

process.env.PATH.split(path.delimiter);
// ['C:\\Windows\\system32', 'C:\\Windows', 'C:\\Program Files\\node\\']
```

## path.dirname(path)

<!-- YAML
added: v0.1.16
changes:

  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Passing a non-string as the `path` argument will throw now.
-->

* `path` {string}
* Çıktı: {string}

`path.dirname()` metodu, argüman olarak verilen `path`'in dizin adresi parçasını döner. Unix'deki `dirname` komutu gibi davranır. Dizin adresi sonundaki ayraç hesaba katılmaz. bkz. [`path.sep`][].

```js
path.dirname('/foo/bar/baz/asdf/quux');
// '/foo/bar/baz/asdf'
```

Eğer `path` argümanı bir string değilse [`TypeError`][] fırlatılır.

## path.extname(path)

<!-- YAML
added: v0.1.25
changes:

  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Passing a non-string as the `path` argument will throw now.
-->

* `path` {string}
* Çıktı: {string}

The `path.extname()` method returns the extension of the `path`, from the last occurrence of the `.` (period) character to end of string in the last portion of the `path`. If there is no `.` in the last portion of the `path`, or if the first character of the basename of `path` (see `path.basename()`) is `.`, then an empty string is returned.

```js
path.extname('index.html');
// Returns: '.html'

path.extname('index.coffee.md');
// Returns: '.md'

path.extname('index.');
// Returns: '.'

path.extname('index');
// Returns: ''

path.extname('.index');
// Returns: ''
```

A [`TypeError`][] is thrown if `path` is not a string.

## path.format(pathObject)

<!-- YAML
added: v0.11.15
-->

* `pathObject` {Object} 
  * `dir` {string}
  * `root` {string}
  * `base` {string}
  * `name` {string}
  * `ext` {string}
* Returns: {string}

The `path.format()` method returns a path string from an object. This is the opposite of [`path.parse()`][].

When providing properties to the `pathObject` remember that there are combinations where one property has priority over another:

* `pathObject.root` is ignored if `pathObject.dir` is provided
* `pathObject.ext` and `pathObject.name` are ignored if `pathObject.base` exists

For example, on POSIX:

```js
// If `dir`, `root` and `base` are provided,
// `${dir}${path.sep}${base}`
// will be returned. `root` is ignored.
path.format({
  root: '/ignored',
  dir: '/home/user/dir',
  base: 'file.txt'
});
// Returns: '/home/user/dir/file.txt'

// `root` will be used if `dir` is not specified.
// If only `root` is provided or `dir` is equal to `root` then the
// platform separator will not be included. `ext` will be ignored.
path.format({
  root: '/',
  base: 'file.txt',
  ext: 'ignored'
});
// Returns: '/file.txt'

// `name` + `ext` will be used if `base` is not specified.
path.format({
  root: '/',
  name: 'file',
  ext: '.txt'
});
// Returns: '/file.txt'
```

On Windows:

```js
path.format({
  dir: 'C:\\path\\dir',
  base: 'file.txt'
});
// Returns: 'C:\\path\\dir\\file.txt'
```

## path.isAbsolute(path)

<!-- YAML
added: v0.11.2
-->

* `path` {string}
* Returns: {boolean}

The `path.isAbsolute()` method determines if `path` is an absolute path.

If the given `path` is a zero-length string, `false` will be returned.

For example on POSIX:

```js
path.isAbsolute('/foo/bar'); // true
path.isAbsolute('/baz/..');  // true
path.isAbsolute('qux/');     // false
path.isAbsolute('.');        // false
```

On Windows:

```js
path.isAbsolute('//server');    // true
path.isAbsolute('\\\\server');  // true
path.isAbsolute('C:/foo/..');   // true
path.isAbsolute('C:\\foo\\..'); // true
path.isAbsolute('bar\\baz');    // false
path.isAbsolute('bar/baz');     // false
path.isAbsolute('.');           // false
```

A [`TypeError`][] is thrown if `path` is not a string.

## path.join([...paths])

<!-- YAML
added: v0.1.16
-->

* `...paths` {string} A sequence of path segments
* Returns: {string}

The `path.join()` method joins all given `path` segments together using the platform specific separator as a delimiter, then normalizes the resulting path.

Zero-length `path` segments are ignored. If the joined path string is a zero-length string then `'.'` will be returned, representing the current working directory.

```js
path.join('/foo', 'bar', 'baz/asdf', 'quux', '..');
// Returns: '/foo/bar/baz/asdf'

path.join('foo', {}, 'bar');
// throws 'TypeError: Path must be a string. Received {}'
```

A [`TypeError`][] is thrown if any of the path segments is not a string.

## path.normalize(path)

<!-- YAML
added: v0.1.23
-->

* `path` {string}
* Returns: {string}

The `path.normalize()` method normalizes the given `path`, resolving `'..'` and `'.'` segments.

When multiple, sequential path segment separation characters are found (e.g. `/` on POSIX and either `` or `/` on Windows), they are replaced by a single instance of the platform specific path segment separator (`/` on POSIX and `` on Windows). Trailing separators are preserved.

If the `path` is a zero-length string, `'.'` is returned, representing the current working directory.

For example on POSIX:

```js
path.normalize('/foo/bar//baz/asdf/quux/..');
// Returns: '/foo/bar/baz/asdf'
```

On Windows:

```js
path.normalize('C:\\temp\\\\foo\\bar\\..\\');
// Returns: 'C:\\temp\\foo\\'
```

Since Windows recognizes multiple path separators, both separators will be replaced by instances of the Windows preferred separator (``):

```js
path.win32.normalize('C:////temp\\\\/\\/\\/foo/bar');
// Returns: 'C:\\temp\\foo\\bar'
```

A [`TypeError`][] is thrown if `path` is not a string.

## path.parse(path)

<!-- YAML
added: v0.11.15
-->

* `path` {string}
* Returns: {Object}

The `path.parse()` method returns an object whose properties represent significant elements of the `path`. Trailing directory separators are ignored, see [`path.sep`][].

The returned object will have the following properties:

* `dir` {string}
* `root` {string}
* `base` {string}
* `name` {string}
* `ext` {string}

For example on POSIX:

```js
path.parse('/home/user/dir/file.txt');
// Returns:
// { root: '/',
//   dir: '/home/user/dir',
//   base: 'file.txt',
//   ext: '.txt',
//   name: 'file' }
```

```text
┌─────────────────────┬────────────┐
│          dir        │    base    │
├──────┬              ├──────┬─────┤
│ root │              │ name │ ext │
"  /    home/user/dir / file  .txt "
└──────┴──────────────┴──────┴─────┘
(all spaces in the "" line should be ignored — they are purely for formatting)
```

On Windows:

```js
path.parse('C:\\path\\dir\\file.txt');
// Returns:
// { root: 'C:\\',
//   dir: 'C:\\path\\dir',
//   base: 'file.txt',
//   ext: '.txt',
//   name: 'file' }
```

```text
┌─────────────────────┬────────────┐
│          dir        │    base    │
├──────┬              ├──────┬─────┤
│ root │              │ name │ ext │
" C:\      path\dir   \ file  .txt "
└──────┴──────────────┴──────┴─────┘
(all spaces in the "" line should be ignored — they are purely for formatting)
```

A [`TypeError`][] is thrown if `path` is not a string.

## path.posix

<!-- YAML
added: v0.11.15
-->

* {Object}

The `path.posix` property provides access to POSIX specific implementations of the `path` methods.

## path.relative(from, to)

<!-- YAML
added: v0.5.0
changes:

  - version: v6.8.0
    pr-url: https://github.com/nodejs/node/pull/8523
    description: On Windows, the leading slashes for UNC paths are now included
                 in the return value.
-->

* `from` {string}
* `to` {string}
* Returns: {string}

The `path.relative()` method returns the relative path from `from` to `to` based on the current working directory. If `from` and `to` each resolve to the same path (after calling `path.resolve()` on each), a zero-length string is returned.

If a zero-length string is passed as `from` or `to`, the current working directory will be used instead of the zero-length strings.

For example on POSIX:

```js
path.relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb');
// Returns: '../../impl/bbb'
```

On Windows:

```js
path.relative('C:\\orandea\\test\\aaa', 'C:\\orandea\\impl\\bbb');
// Returns: '..\\..\\impl\\bbb'
```

A [`TypeError`][] is thrown if either `from` or `to` is not a string.

## path.resolve([...paths])

<!-- YAML
added: v0.3.4
-->

* `...paths` {string} A sequence of paths or path segments
* Returns: {string}

The `path.resolve()` method resolves a sequence of paths or path segments into an absolute path.

The given sequence of paths is processed from right to left, with each subsequent `path` prepended until an absolute path is constructed. For instance, given the sequence of path segments: `/foo`, `/bar`, `baz`, calling `path.resolve('/foo', '/bar', 'baz')` would return `/bar/baz`.

If after processing all given `path` segments an absolute path has not yet been generated, the current working directory is used.

The resulting path is normalized and trailing slashes are removed unless the path is resolved to the root directory.

Zero-length `path` segments are ignored.

If no `path` segments are passed, `path.resolve()` will return the absolute path of the current working directory.

```js
path.resolve('/foo/bar', './baz');
// Returns: '/foo/bar/baz'

path.resolve('/foo/bar', '/tmp/file/');
// Returns: '/tmp/file'

path.resolve('wwwroot', 'static_files/png/', '../gif/image.gif');
// if the current working directory is /home/myself/node,
// this returns '/home/myself/node/wwwroot/static_files/gif/image.gif'
```

A [`TypeError`][] is thrown if any of the arguments is not a string.

## path.sep

<!-- YAML
added: v0.7.9
-->

* {string}

Provides the platform-specific path segment separator:

* `` on Windows
* `/` on POSIX

For example on POSIX:

```js
'foo/bar/baz'.split(path.sep);
// Returns: ['foo', 'bar', 'baz']
```

On Windows:

```js
'foo\\bar\\baz'.split(path.sep);
// Returns: ['foo', 'bar', 'baz']
```

On Windows, both the forward slash (`/`) and backward slash (``) are accepted as path segment separators; however, the `path` methods only add backward slashes (``).

## path.toNamespacedPath(path)

<!-- YAML
added: v9.0.0
-->

* `path` {string}
* Returns: {string}

On Windows systems only, returns an equivalent [namespace-prefixed path](https://msdn.microsoft.com/library/windows/desktop/aa365247(v=vs.85).aspx#namespaces) for the given `path`. If `path` is not a string, `path` will be returned without modifications.

This method is meaningful only on Windows system. On posix systems, the method is non-operational and always returns `path` without modifications.

## path.win32

<!-- YAML
added: v0.11.15
-->

* {Object}

The `path.win32` property provides access to Windows-specific implementations of the `path` methods.