# Percorso

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Il modulo `path` fornisce utility per lavorare con percorsi di file e directory. Ci si può accedere utilizzando:

```js
const path = require('path');
```

## Windows vs. POSIX

The default operation of the `path` module varies based on the operating system on which a Node.js application is running. Specifically, when running on a Windows operating system, the `path` module will assume that Windows-style paths are being used.

So using `path.basename()` might yield different results on POSIX and Windows:

Su POSIX:

```js
path.basename('C:\\temp\\myfile.html');
// Restituisce: 'C:\\temp\\myfile.html'
```

Su Windows:

```js
path.basename('C:\\temp\\myfile.html');
// Restituisce: 'myfile.html'
```

To achieve consistent results when working with Windows file paths on any operating system, use [`path.win32`][]:

Su POSIX e Windows:

```js
path.win32.basename('C:\\temp\\myfile.html');
// Restituisce: 'myfile.html'
```

To achieve consistent results when working with POSIX file paths on any operating system, use [`path.posix`][]:

Su POSIX e Windows:

```js
path.posix.basename('/tmp/myfile.html');
// Restituisce: 'myfile.html'
```

*Nota:* Su Windows, Node.js segue il concetto di working directory per unità. Questo comportamento può essere osservato quando si utilizza un percorso di unità senza backslash. For example `path.resolve('c:\\')` can potentially return a different result than `path.resolve('c:')`. For more information, see [this MSDN page](https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247.aspx#fully_qualified_vs._relative_paths).

## path.basename(path[, ext])

<!-- YAML
added: v0.1.25
changes:

  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Passing a non-string as the `path` argument will throw now.
-->

* `path` {string}
* `ext` {string} Un'estensione di file opzionale
* Restituisce: {string}

The `path.basename()` methods returns the last portion of a `path`, similar to the Unix `basename` command. Trailing directory separators are ignored, see [`path.sep`][].

Per esempio:

```js
path.basename('/foo/bar/baz/asdf/quux.html');
// Restituisce: 'quux.html'

path.basename('/foo/bar/baz/asdf/quux.html', '.html');
// Restituisce: 'quux'
```

A [`TypeError`][] is thrown if `path` is not a string or if `ext` is given and is not a string.

## path.delimiter

<!-- YAML
added: v0.9.3
-->

* {string}

Fornisce il delimitarore del percorso specifico della piattaforma:

* `;` per Windows
* `:` per POSIX

Ad esempio, su POSIX:

```js
console.log(process.env.PATH);
// Stampa: '/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin'

process.env.PATH.split(path.delimiter);
// Restituisce: ['/usr/bin', '/bin', '/usr/sbin', '/sbin', '/usr/local/bin']
```

Su Windows:

```js
console.log(process.env.PATH);
// Stampa: 'C:\Windows\system32;C:\Windows;C:\Program Files\node\'

process.env.PATH.split(path.delimiter);
// Restituisce ['C:\\Windows\\system32', 'C:\\Windows', 'C:\\Program Files\\node\\']
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
* Restituisce: {string}

The `path.dirname()` method returns the directory name of a `path`, similar to the Unix `dirname` command. Trailing directory separators are ignored, see [`path.sep`][].

Per esempio:

```js
path.dirname('/foo/bar/baz/asdf/quux');
// Restituisce: '/foo/bar/baz/asdf'
```

Un [`TypeError`] [] viene lanciato se `path` non è una stringa.

## path.extname(path)

<!-- YAML
added: v0.1.25
changes:

  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Passing a non-string as the `path` argument will throw now.
-->

* `path` {string}
* Restituisce: {string}

The `path.extname()` method returns the extension of the `path`, from the last occurrence of the `.` (period) character to end of string in the last portion of the `path`. If there is no `.` in the last portion of the `path`, or if the first character of the basename of `path` (see `path.basename()`) is `.`, then an empty string is returned.

Per esempio:

```js
path.extname('index.html');
// Restituisce: '.html'

path.extname('index.coffee.md');
// Restituisce: '.md'

path.extname('index.');
// Restituisce: '.'

path.extname('index');
// Restituisce: ''

path.extname('.index');
// Restituisce: ''
```

Un [`TypeError`] [] viene lanciato se `path` non è una stringa.

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
* Restituisce: {string}

Il metodo `path.format ()` restituisce una stringa di percorso da un object. This is the opposite of [`path.parse()`][].

When providing properties to the `pathObject` remember that there are combinations where one property has priority over another:

* `pathObject.root` viene ignorato se `pathObject.dir` viene fornito
* `pathObject.ext` e `pathObject.name` vengono ignorati se `pathObject.base` esiste

Ad esempio, su POSIX:

```js
// se `dir`, `root` and `base`vengono forniti,
// `${dir}${path.sep}${base}`
// verrà restituito. `root` viene ignorato.
path.format({
  root: '/ignored',
  dir: '/home/user/dir',
  base: 'file.txt'
});
// Restituisce: '/home/user/dir/file.txt'

// `root` sarà usato se`dir` non è specificato.
// Se viene fornito solo `root` o` dir` è uguale a `root`, il 
// separatore della piattaforma non sarà incluso. `ext` verrà ignorato.
path.format({
  root: '/',
  base: 'file.txt',
  ext: 'ignored'
});
// Restituisce: '/file.txt'

// `name` + `ext` verrà usato se `base` non è specificato.
path.format({
  root: '/',
  name: 'file',
  ext: '.txt'
});
// Restituisce: '/file.txt'
```

Su Windows:

```js
path.format({
  dir: 'C:\\path\\dir',
  base: 'file.txt'
});
// Restituisce: 'C:\\path\\dir\\file.txt'
```

## path.isAbsolute(path)

<!-- YAML
added: v0.11.2
-->

* `path` {string}
* Restituisce: {boolean}

Il metodo `path.isAbsolute ()` determina se il `path` è un absolute path.

Se il `path` dato è una stringa di lunghezza zero, verrà restituito `false`.

Ad esempio su POSIX:

```js
path.isAbsolute('/foo/bar'); // true
path.isAbsolute('/baz/..');  // true
path.isAbsolute('qux/');     // false
path.isAbsolute('.');        // false
```

Su Windows:

```js
path.isAbsolute('//server');    // true
path.isAbsolute('\\\\server');  // true
path.isAbsolute('C:/foo/..');   // true
path.isAbsolute('C:\\foo\\..'); // true
path.isAbsolute('bar\\baz');    // false
path.isAbsolute('bar/baz');     // false
path.isAbsolute('.');           // false
```

Un [`TypeError`] [] viene lanciato se `path` non è una stringa.

## path.join([...paths])

<!-- YAML
added: v0.1.16
-->

* `...paths` {string} Una sequenza di segmenti di percorso
* Restituisce: {string}

The `path.join()` method joins all given `path` segments together using the platform specific separator as a delimiter, then normalizes the resulting path.

I segmenti di lunghezza zero `path` vengono ignorati. If the joined path string is a zero-length string then `'.'` will be returned, representing the current working directory.

Per esempio:

```js
path.join('/foo', 'bar', 'baz/asdf', 'quux', '..');
// Restituisce: '/foo/bar/baz/asdf'

path.join('foo', {}, 'bar');
// lancia 'TypeError: Path deve essere una stringa. Ricevuto {}'
```

Un [`TypeError`] [] viene lanciato se uno dei segmenti del percorso non è una stringa.

## path.normalize(path)

<!-- YAML
added: v0.1.23
-->

* `path` {string}
* Restituisce: {string}

The `path.normalize()` method normalizes the given `path`, resolving `'..'` and `'.'` segments.

When multiple, sequential path segment separation characters are found (e.g. `/` on POSIX and either ``\` or``/`on Windows), they are replaced by a single
instance of the platform specific path segment separator (`/`on POSIX and`\` on Windows). I separatori finali vengono conservati.

If the `path` is a zero-length string, `'.'` is returned, representing the current working directory.

Ad esempio su POSIX:

```js
path.normalize('/foo/bar//baz/asdf/quux/..');
// Restituisce: '/foo/bar/baz/asdf'
```

Su Windows:

```js
path.normalize('C:\\temp\\\\foo\\bar\\..\\');
// Restituisce: 'C:\\temp\\foo\\'
```

Since Windows recognizes multiple path separators, both separators will be replaced by instances of the Windows preferred separator (``):

```js
path.win32.normalize('C:////temp\\\\/\\/\\/foo/bar');
// Restituisce: 'C:\\temp\\foo\\bar'
```

Un [`TypeError`] [] viene lanciato se `path` non è una stringa.

## path.parse(path)

<!-- YAML
added: v0.11.15
-->

* `path` {string}
* Restituisce: {Object}

The `path.parse()` method returns an object whose properties represent significant elements of the `path`. Trailing directory separators are ignored, see [`path.sep`][].

L'object restituito avrà le seguenti proprietà:

* `dir` {string}
* `root` {string}
* `base` {string}
* `name` {string}
* `ext` {string}

Ad esempio su POSIX:

```js
path.parse('/home/user/dir/file.txt');
// Restituisce:
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
(tutti gli spazi nella linea "" devono essere ignorati - sono esclusivamente per la formattazione)
```

Su Windows:

```js
path.parse('C:\\path\\dir\\file.txt');
// Restituisce:
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
(tutti gli spazi nella linea "" devono essere ignorati - sono esclusivamente per la formattazione)
```

Un [`TypeError`] [] viene lanciato se `path` non è una stringa.

## path.posix

<!-- YAML
added: v0.11.15
-->

* {Object}

The `path.posix` property provides access to POSIX specific implementations of the `path` methods.

## path.relative (da, a)

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
* Restituisce: {string}

The `path.relative()` method returns the relative path from `from` to `to` based on the current working directory. If `from` and `to` each resolve to the same path (after calling `path.resolve()` on each), a zero-length string is returned.

If a zero-length string is passed as `from` or `to`, the current working directory will be used instead of the zero-length strings.

Ad esempio su POSIX:

```js
path.relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb');
// Restituisce: '../../impl/bbb'
```

Su Windows:

```js
path.relative('C:\\orandea\\test\\aaa', 'C:\\orandea\\impl\\bbb');
// Restituisce: '..\\..\\impl\\bbb'
```

Un [`TypeError`][] viene lanciato se `from` o `to` non è una stringa.

## path.resolve([...paths])

<!-- YAML
added: v0.3.4
-->

* `...paths` {string} Una sequenza di percorsi o segmenti di percorso
* Restituisce: {string}

The `path.resolve()` method resolves a sequence of paths or path segments into an absolute path.

The given sequence of paths is processed from right to left, with each subsequent `path` prepended until an absolute path is constructed. For instance, given the sequence of path segments: `/foo`, `/bar`, `baz`, calling `path.resolve('/foo', '/bar', 'baz')` would return `/bar/baz`.

If after processing all given `path` segments an absolute path has not yet been generated, the current working directory is used.

The resulting path is normalized and trailing slashes are removed unless the path is resolved to the root directory.

I segmenti di lunghezza zero `path` vengono ignorati.

If no `path` segments are passed, `path.resolve()` will return the absolute path of the current working directory.

Per esempio:

```js
path.resolve('/foo/bar', './baz');
// Restituisce: '/foo/bar/baz'

path.resolve('/foo/bar', '/tmp/file/');
// Restituisce: '/tmp/file'

path.resolve('wwwroot', 'static_files/png/', '../gif/image.gif');
// se la directory di lavoro corrente è /home/myself/node,
// questo restituisce'/home/myself/node/wwwroot/static_files/gif/image.gif'
```

Un [`TypeError`][] viene lanciato se uno degli argomenti non è una stringa.

## path.sep

<!-- YAML
added: v0.7.9
-->

* {string}

Fornisce il separatore del segmento del percorso specifico della piattaforma:

* `` su Windows
* `/` su POSIX

Ad esempio su POSIX:

```js
'foo/bar/baz'.split(path.sep);
// Restituisce: ['foo', 'bar', 'baz']
```

Su Windows:

```js
'foo\\bar\\baz'.split(path.sep);
// Restituisce: ['foo', 'bar', 'baz']
```

*Note*: On Windows, both the forward slash (`/`) and backward slash (``\`) are
accepted as path segment separators; however, the``path`methods only add
backward slashes (`\`).

## path.win32

<!-- YAML
added: v0.11.15
-->

* {Object}

The `path.win32` property provides access to Windows-specific implementations of the `path` methods.