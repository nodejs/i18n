# Path

<!--introduced_in=v0.10.0-->

> Kararlılık: 2 - Kararlı

`path` modülü, dosya ve dizin adresleriyle çalışmak için yardımcı araçlar sağlar. Modülü yüklemek için:

```js
const path = require('path');
```

## Windows vs. POSIX

`path` modülünün varsayılan ayarları, Node.js uygulamasının çalıştığı işletim sistemine göre değişiklik gösterir. Uygulama Windows işletim sistemi üzerinde çalışıyorsa, `path` modülü Windows tarzı dosya/dizin adreslemesi varsayacaktır.

So using `path.basename()` might yield different results on POSIX and Windows:

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

On Windows Node.js follows the concept of per-drive working directory. Bir dizin adresinde backslash kullanmayarak test edebilirsiniz. For example, `path.resolve('c:\\')` can potentially return a different result than `path.resolve('c:')`. For more information, see [this MSDN page](https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file#fully-qualified-vs-relative-paths).

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

`path.basename()` metodları, argüman olarak verilen `path`'in son parçasını dönerler. Unix'deki `basename` komutu gibi davranırlar. Dizin adresi sonundaki ayraç hesaba katılmaz. bkz. [`path.sep`][].

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

Platformun kullandığı adresleme ayracı:

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

`path.extname()` metodu, argüman olarak verilen `path`'de son sırada bulunan nokta (`.`) karakterinden, son sırada bulunan karakterler öbeğinin sonuna kadar olan parçayı (dosya uzantısı) döner. Eğer `path`'in son parçasında `.` karakteri bulunamazsa, ya da `path`'in `basename`'inin ilk karakteri `.` ise, boş bir karakter öbeği döner.

```js
path.extname('index.html');
// '.html'

path.extname('index.coffee.md');
// '.md'

path.extname('index.');
// '.'

path.extname('index');
// ''

path.extname('.index');
// ''
```

Eğer `path` argümanı bir string değilse [`TypeError`][] fırlatılır.

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
* Çıktı: {string}

The `path.format()` method returns a path string from an object. This is the opposite of [`path.parse()`][].

When providing properties to the `pathObject` remember that there are combinations where one property has priority over another:

* `pathObject.root` is ignored if `pathObject.dir` is provided
* `pathObject.ext` and `pathObject.name` are ignored if `pathObject.base` exists

POSIX'te:

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

Windows'ta:

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

POSIX'te:

```js
path.isAbsolute('/foo/bar'); // true
path.isAbsolute('/baz/..');  // true
path.isAbsolute('qux/');     // false
path.isAbsolute('.');        // false
```

Windows'ta:

```js
path.isAbsolute('//server');    // true
path.isAbsolute('\\\\server');  // true
path.isAbsolute('C:/foo/..');   // true
path.isAbsolute('C:\\foo\\..'); // true
path.isAbsolute('bar\\baz');    // false
path.isAbsolute('bar/baz');     // false
path.isAbsolute('.');           // false
```

Eğer `path` argümanı bir string değilse [`TypeError`][] fırlatılır.

## path.join([...paths])
<!-- YAML
added: v0.1.16
-->

* `...paths` {string} A sequence of path segments
* Çıktı: {string}

The `path.join()` method joins all given `path` segments together using the platform-specific separator as a delimiter, then normalizes the resulting path.

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
* Çıktı: {string}

The `path.normalize()` method normalizes the given `path`, resolving `'..'` and `'.'` segments.

When multiple, sequential path segment separation characters are found (e.g. `/` on POSIX and either ``\` or``/`on Windows), they are replaced by a single
instance of the platform-specific path segment separator (`/`on POSIX and`\` on Windows). Trailing separators are preserved.

If the `path` is a zero-length string, `'.'` is returned, representing the current working directory.

POSIX'te:

```js
path.normalize('/foo/bar//baz/asdf/quux/..');
// Returns: '/foo/bar/baz/asdf'
```

Windows'ta:

```js
path.normalize('C:\\temp\\\\foo\\bar\\..\\');
// Returns: 'C:\\temp\\foo\\'
```

Since Windows recognizes multiple path separators, both separators will be replaced by instances of the Windows preferred separator (`\`):

```js
path.win32.normalize('C:////temp\\\\/\\/\\/foo/bar');
// Returns: 'C:\\temp\\foo\\bar'
```

Eğer `path` argümanı bir string değilse [`TypeError`][] fırlatılır.

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

POSIX'te:

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

Windows'ta:

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

Eğer `path` argümanı bir string değilse [`TypeError`][] fırlatılır.

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
* Çıktı: {string}

The `path.relative()` method returns the relative path from `from` to `to` based on the current working directory. If `from` and `to` each resolve to the same path (after calling `path.resolve()` on each), a zero-length string is returned.

If a zero-length string is passed as `from` or `to`, the current working directory will be used instead of the zero-length strings.

POSIX'te:

```js
path.relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb');
// Returns: '../../impl/bbb'
```

Windows'ta:

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
* Çıktı: {string}

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

* `\` windows'ta
* `/` on POSIX

POSIX'te:

```js
'foo/bar/baz'.split(path.sep);
// Returns: ['foo', 'bar', 'baz']
```

Windows'ta:

```js
'foo\\bar\\baz'.split(path.sep);
// Returns: ['foo', 'bar', 'baz']
```

On Windows, both the forward slash (`/`) and backward slash (``\`) are accepted
as path segment separators; however, the``path`methods only add backward
slashes (`\`).

## path.toNamespacedPath(path)
<!-- YAML
added: v9.0.0
-->

* `path` {string}
* Çıktı: {string}

On Windows systems only, returns an equivalent [namespace-prefixed path](https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file#namespaces) for the given `path`. If `path` is not a string, `path` will be returned without modifications.

This method is meaningful only on Windows system. On POSIX systems, the method is non-operational and always returns `path` without modifications.

## path.win32
<!-- YAML
added: v0.11.15
-->

* {Object}

The `path.win32` property provides access to Windows-specific implementations of the `path` methods.
