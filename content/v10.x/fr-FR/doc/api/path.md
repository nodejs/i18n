# Path

<!--introduced_in=v0.10.0-->

> Stabilité: 2 - stable

Le module `path` fournit des fonctions utilitaires permettant de travailler avec des chemins de fichiers et de répertoires. On peut y accéder en utilisant :

```js
const path = require('path');
```

## Windows vs. POSIX

L'opération par défaut du module `path` varie selon le système d'exploitation sur lequel s'exécute une application Node.js. Plus précisément, lorsque vous utilisez un système d'exploitation Windows, le module `path` considérera que les chemins utilisés sont de type Windows.

So using `path.basename()` might yield different results on POSIX and Windows:

Sur POSIX :

```js
path.basename('C:\\temp\\myfile.html');
// Returns: 'C:\\temp\\myfile.html'
```

Sur Windows :

```js
path.basename('C:\\temp\\myfile.html');
// Rend: 'myfile.html'
```

Pour obtenir des résultats cohérents lorsque vous travaillez avec des chemins de fichiers Windows sur n'importe quel système d'exploitation, utilisez [`path.win32`][] :

Sur POSIX et Windows :

```js
path.win32.basename('C:\\temp\\myfile.html');
// Rend: 'myfile.html'
```

Pour obtenir des résultats cohérents lorsque vous travaillez avec des chemins de fichiers POSIX sur n'importe quel système d'exploitation, utilisez [`path.posix`][] :

Sur POSIX et Windows :

```js
path.posix.basename('/tmp/myfile.html');
// retourne: 'myfile.html'
```

On Windows Node.js follows the concept of per-drive working directory. Ce comportement peut être observé en utilisant un chemin vers un disque sans antislash. For example, `path.resolve('c:\\')` can potentially return a different result than `path.resolve('c:')`. For more information, see [this MSDN page](https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file#fully-qualified-vs-relative-paths).

## path.basename(path[, ext])
<!-- YAML
added: v0.1.25
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Passing a non-string as the `path` argument will throw now.
-->

* `path` {string}
* `ext` {string} Une extension de fichier optionnelle
* Retourne : {string}

La méthode `path.basename()` retourne la dernière portion de `path`, de la même façon que la commande Unix `basename`. Trailing directory separators are ignored, see [`path.sep`][].

```js
path.basename('/foo/bar/baz/asdf/quux.html');
// Returns: 'quux.html'

path.basename('/foo/bar/baz/asdf/quux.html', '.html');
// Returns: 'quux'
```

A [`TypeError`][] is thrown if `path` is not a string or if `ext` is given and is not a string.

## path.delimiter
<!-- YAML
added: v0.9.3
-->

* {string}

Provides the platform-specific path delimiter:

* `;` for Windows
* `:` for POSIX

For example, on POSIX:

```js
console.log(process.env.PATH);
// Prints: '/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin'

process.env.PATH.split(path.delimiter);
// Returns: ['/usr/bin', '/bin', '/usr/sbin', '/sbin', '/usr/local/bin']
```

Sur Windows :

```js
console.log(process.env.PATH);
// Prints: 'C:\Windows\system32;C:\Windows;C:\Program Files\node\'

process.env.PATH.split(path.delimiter);
// Returns ['C:\\Windows\\system32', 'C:\\Windows', 'C:\\Program Files\\node\\']
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
* Retourne : {string}

The `path.dirname()` method returns the directory name of a `path`, similar to the Unix `dirname` command. Trailing directory separators are ignored, see [`path.sep`][].

```js
path.dirname('/foo/bar/baz/asdf/quux');
// Returns: '/foo/bar/baz/asdf'
```

A [`TypeError`][] is thrown if `path` is not a string.

## path.extname(path)
<!-- YAML
added: v0.1.25
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Passing a non-string as the `path` argument will throw now.
-->

* `path` {string}
* Retourne : {string}

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
* Retourne : {string}

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

Sur Windows :

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

For example, on POSIX:

```js
path.isAbsolute('/foo/bar'); // true
path.isAbsolute('/baz/..');  // true
path.isAbsolute('qux/');     // false
path.isAbsolute('.');        // false
```

Sur Windows :

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
* Retourne : {string}

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
* Retourne : {string}

The `path.normalize()` method normalizes the given `path`, resolving `'..'` and `'.'` segments.

When multiple, sequential path segment separation characters are found (e.g. `/` on POSIX and either ``\` or``/`on Windows), they are replaced by a single
instance of the platform-specific path segment separator (`/`on POSIX and`\` on Windows). Trailing separators are preserved.

If the `path` is a zero-length string, `'.'` is returned, representing the current working directory.

For example, on POSIX:

```js
path.normalize('/foo/bar//baz/asdf/quux/..');
// Returns: '/foo/bar/baz/asdf'
```

Sur Windows :

```js
path.normalize('C:\\temp\\\\foo\\bar\\..\\');
// Returns: 'C:\\temp\\foo\\'
```

Since Windows recognizes multiple path separators, both separators will be replaced by instances of the Windows preferred separator (`\`):

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

For example, on POSIX:

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

Sur Windows :

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
* Retourne : {string}

The `path.relative()` method returns the relative path from `from` to `to` based on the current working directory. If `from` and `to` each resolve to the same path (after calling `path.resolve()` on each), a zero-length string is returned.

If a zero-length string is passed as `from` or `to`, the current working directory will be used instead of the zero-length strings.

For example, on POSIX:

```js
path.relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb');
// Returns: '../../impl/bbb'
```

Sur Windows :

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
* Retourne : {string}

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

* `\` on Windows
* `/` on POSIX

For example, on POSIX:

```js
'foo/bar/baz'.split(path.sep);
// Returns: ['foo', 'bar', 'baz']
```

Sur Windows :

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
* Retourne : {string}

On Windows systems only, returns an equivalent [namespace-prefixed path](https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file#namespaces) for the given `path`. If `path` is not a string, `path` will be returned without modifications.

This method is meaningful only on Windows system. On POSIX systems, the method is non-operational and always returns `path` without modifications.

## path.win32
<!-- YAML
added: v0.11.15
-->

* {Object}

The `path.win32` property provides access to Windows-specific implementations of the `path` methods.
