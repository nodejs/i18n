# Path

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

El módulo `path` provee utilidades para trabajar con rutas de archivos y de directorios. Puede ser accedido usando:

```js
const path = require('path');
```

## Windows vs. POSIX

The default operation of the `path` module varies based on the operating system on which a Node.js application is running. Specifically, when running on a Windows operating system, the `path` module will assume that Windows-style paths are being used.

So using `path.basename()` might yield different results on POSIX and Windows:

En POSIX:

```js
path.basename('C:\\temp\\myfile.html');
// Retorna: 'C:\\temp\\myfile.html'
```

En Windows:

```js
path.basename('C:\\temp\\myfile.html');
// Retorna: 'myfile.html'
```

To achieve consistent results when working with Windows file paths on any operating system, use [`path.win32`][]:

En POSIX y Windows:

```js
path.win32.basename('C:\\temp\\myfile.html');
// Retorna: 'myfile.html'
```

To achieve consistent results when working with POSIX file paths on any operating system, use [`path.posix`][]:

En POSIX y Windows:

```js
path.posix.basename('/tmp/myfile.html');
// Retorna: 'myfile.html'
```

On Windows Node.js follows the concept of per-drive working directory. Este comportamiento puede ser observado cuando se usa una ruta de disco sin un backslash. For example, `path.resolve('c:\\')` can potentially return a different result than `path.resolve('c:')`. For more information, see [this MSDN page](https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file#fully-qualified-vs-relative-paths).

## path.basename(path[, ext])

<!-- YAML
added: v0.1.25
changes:

  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Passing a non-string as the `path` argument will throw now.
-->

* `path` {string}
* `ext` {string} Una extensión de archivo opcional
* Retorna: {string}

The `path.basename()` methods returns the last portion of a `path`, similar to the Unix `basename` command. Trailing directory separators are ignored, see [`path.sep`][].

```js
path.basename('/foo/bar/baz/asdf/quux.html');
// Retorna: 'quux.html'

path.basename('/foo/bar/baz/asdf/quux.html', '.html');
// Retorna: 'quux'
```

A [`TypeError`][] is thrown if `path` is not a string or if `ext` is given and is not a string.

## path.delimiter

<!-- YAML
added: v0.9.3
-->

* {string}

Provee el delimitador de ruta específico de la plataforma:

* `;` para Windows
* `:` para POSIX

Por ejemplo, en POSIX:

```js
console.log(process.env.PATH);
// Estampa: '/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin'

process.env.PATH.split(path.delimiter);
// Retorna: ['/usr/bin', '/bin', '/usr/sbin', '/sbin', '/usr/local/bin']
```

En Windows:

```js
console.log(process.env.PATH);
// Estampa: 'C:\Windows\system32;C:\Windows;C:\Program Files\node\'

process.env.PATH.split(path.delimiter);
// Retorna ['C:\\Windows\\system32', 'C:\\Windows', 'C:\\Program Files\\node\\']
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
* Retorna: {string}

The `path.dirname()` method returns the directory name of a `path`, similar to the Unix `dirname` command. Trailing directory separators are ignored, see [`path.sep`][].

```js
path.dirname('/foo/bar/baz/asdf/quux');
// Retorna: '/foo/bar/baz/asdf'
```

Un [`TypeError`][] es producido si `path` no es un string.

## path.extname(path)

<!-- YAML
added: v0.1.25
changes:

  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Passing a non-string as the `path` argument will throw now.
-->

* `path` {string}
* Retorna: {string}

The `path.extname()` method returns the extension of the `path`, from the last occurrence of the `.` (period) character to end of string in the last portion of the `path`. If there is no `.` in the last portion of the `path`, or if the first character of the basename of `path` (see `path.basename()`) is `.`, then an empty string is returned.

```js
path.extname('index.html');
// Retorna: '.html'

path.extname('index.coffee.md');
// Retorna: '.md'

path.extname('index.');
// Retorna: '.'

path.extname('index');
// Retorna: ''

path.extname('.index');
// Retorna: ''
```

Un [`TypeError`][] es producido si `path` no es un string.

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
* Retorna: {string}

El método `path.format()` retorna un string de ruta de un objeto. This is the opposite of [`path.parse()`][].

When providing properties to the `pathObject` remember that there are combinations where one property has priority over another:

* `pathObject.root` es ignorado si `pathObject.dir` es provisto
* `pathObject.ext` y `pathObject.name` son ignorados si `pathObject.base` existe

Por ejemplo, en POSIX:

```js
// Si `dir`, `root` and `base` son provistos,
// `${dir}${path.sep}${base}`
// va a ser retornado. `root` es ignorado.
path.format({
  root: '/ignored',
  dir: '/home/user/dir',
  base: 'file.txt'
});
// Retorna: '/home/user/dir/file.txt'

// `root` será usado si `dir` no es especificado.
// Si solo `root` es provista o `dir` es igual a `root` entonces el
// separador de plataforma no va a ser incluido. `ext` va a ser ignorado.
path.format({
  root: '/',
  base: 'file.txt',
  ext: 'ignored'
});
// Retorna: '/file.txt'

// `name` + `ext` van a ser usados si `base` no es especificado.
path.format({
  root: '/',
  name: 'file',
  ext: '.txt'
});
// Retorna: '/file.txt'
```

En Windows:

```js
path.format({
  dir: 'C:\\path\\dir',
  base: 'file.txt'
});
// Retorna: 'C:\\path\\dir\\file.txt'
```

## path.isAbsolute(path)

<!-- YAML
added: v0.11.2
-->

* `path` {string}
* Retorna: {boolean}

El método `path.isAbsolute()` determina si `path` es una ruta absoluta.

Si el `path` dado es un string sin extensión, `false` va a ser retornado.

Por ejemplo, en POSIX:

```js
path.isAbsolute('/foo/bar'); // true
path.isAbsolute('/baz/..');  // true
path.isAbsolute('qux/');     // false
path.isAbsolute('.');        // false
```

En Windows:

```js
path.isAbsolute('//server');    // true
path.isAbsolute('\\\\server');  // true
path.isAbsolute('C:/foo/..');   // true
path.isAbsolute('C:\\foo\\..'); // true
path.isAbsolute('bar\\baz');    // false
path.isAbsolute('bar/baz');     // false
path.isAbsolute('.');           // false
```

Un [`TypeError`][] es producido si `path` no es un string.

## path.join([...paths])

<!-- YAML
added: v0.1.16
-->

* `...paths` {string} Una secuencia de segmentos de ruta
* Retorna: {string}

The `path.join()` method joins all given `path` segments together using the platform-specific separator as a delimiter, then normalizes the resulting path.

Los segmentos `path` sin extensión son ignorados. If the joined path string is a zero-length string then `'.'` will be returned, representing the current working directory.

```js
path.join('/foo', 'bar', 'baz/asdf', 'quux', '..');
// Retorna: '/foo/bar/baz/asdf'

path.join('foo', {}, 'bar');
// Produce 'TypeError: Path must be a string. Recibido {}'
```

Un [`TypeError`][] va a ser producido si cualquiera de los segmentos de ruta no es un string.

## path.normalize(path)

<!-- YAML
added: v0.1.23
-->

* `path` {string}
* Retorna: {string}

The `path.normalize()` method normalizes the given `path`, resolving `'..'` and `'.'` segments.

When multiple, sequential path segment separation characters are found (e.g. `/` on POSIX and either ``\` or``/`on Windows), they are replaced by a single
instance of the platform-specific path segment separator (`/`on POSIX and`\` on Windows). Los separadores de seguimiento son preservados.

If the `path` is a zero-length string, `'.'` is returned, representing the current working directory.

Por ejemplo, en POSIX:

```js
path.normalize('/foo/bar//baz/asdf/quux/..');
// Retorna: '/foo/bar/baz/asdf'
```

En Windows:

```js
path.normalize('C:\\temp\\\\foo\\bar\\..\\');
// Retorna: 'C:\\temp\\foo\\'
```

Since Windows recognizes multiple path separators, both separators will be replaced by instances of the Windows preferred separator (``):

```js
path.win32.normalize('C:////temp\\\\/\\/\\/foo/bar');
// Retorna: 'C:\\temp\\foo\\bar'
```

Un [`TypeError`][] es producido si `path` no es un string.

## path.parse(path)

<!-- YAML
added: v0.11.15
-->

* `path` {string}
* Retorna: {Object}

The `path.parse()` method returns an object whose properties represent significant elements of the `path`. Trailing directory separators are ignored, see [`path.sep`][].

El objeto retornado va a tener las siguientes propiedades:

* `dir` {string}
* `root` {string}
* `base` {string}
* `name` {string}
* `ext` {string}

Por ejemplo, en POSIX:

```js
path.parse('/home/user/dir/file.txt');
// Retorna:
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
(todos los espacios en la línea "" deberían ser ignorados — ellos están solamente para el formato)
```

En Windows:

```js
path.parse('C:\\path\\dir\\file.txt');
// Retorna:
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
(todos los espacios en la línea "" deberían ser ignorados — ellos están solamente para el formato)
```

Un [`TypeError`][] es producido si `path` no es un string.

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
* Retorna: {string}

The `path.relative()` method returns the relative path from `from` to `to` based on the current working directory. If `from` and `to` each resolve to the same path (after calling `path.resolve()` on each), a zero-length string is returned.

If a zero-length string is passed as `from` or `to`, the current working directory will be used instead of the zero-length strings.

Por ejemplo, en POSIX:

```js
path.relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb');
// Retorna: '../../impl/bbb'
```

En Windows:

```js
path.relative('C:\\orandea\\test\\aaa', 'C:\\orandea\\impl\\bbb');
// Retorna: '..\\..\\impl\\bbb'
```

Se produce un [`TypeError`][] si ya sea `from` o `to` no son una string.

## path.resolve([...paths])

<!-- YAML
added: v0.3.4
-->

* `...paths` {string} Una secuencia de rutas o segmentos de rutas
* Retorna: {string}

The `path.resolve()` method resolves a sequence of paths or path segments into an absolute path.

The given sequence of paths is processed from right to left, with each subsequent `path` prepended until an absolute path is constructed. For instance, given the sequence of path segments: `/foo`, `/bar`, `baz`, calling `path.resolve('/foo', '/bar', 'baz')` would return `/bar/baz`.

If after processing all given `path` segments an absolute path has not yet been generated, the current working directory is used.

The resulting path is normalized and trailing slashes are removed unless the path is resolved to the root directory.

Los segmentos `path` sin extensión son ignorados.

If no `path` segments are passed, `path.resolve()` will return the absolute path of the current working directory.

```js
path.resolve('/foo/bar', './baz');
// Retorna: '/foo/bar/baz'

path.resolve('/foo/bar', '/tmp/file/');
// Retorna: '/tmp/file'

path.resolve('wwwroot', 'static_files/png/', '../gif/image.gif');
// si el directorio de trabajo actual es /home/myself/node,
// esto retorna '/home/myself/node/wwwroot/static_files/gif/image.gif'
```

Un [`TypeError`][] es producido si cualquiera de los argumentos no es un string.

## path.sep

<!-- YAML
added: v0.7.9
-->

* {string}

Provee el separador de segmento de ruta específico de la plataforma:

* `` en Windows
* `/` en POSIX

Por ejemplo, en POSIX:

```js
'foo/bar/baz'.split(path.sep);
// Retorna: ['foo', 'bar', 'baz']
```

En Windows:

```js
'foo\\bar\\baz'.split(path.sep);
// Retorna: ['foo', 'bar', 'baz']
```

On Windows, both the forward slash (`/`) and backward slash (``\`) are accepted
as path segment separators; however, the``path`methods only add backward
slashes (`\`).

## path.toNamespacedPath(path)

<!-- YAML
added: v9.0.0
-->

* `path` {string}
* Retorna: {string}

On Windows systems only, returns an equivalent [namespace-prefixed path](https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file#namespaces) for the given `path`. If `path` is not a string, `path` will be returned without modifications.

Este método es significativo solo en el sistema Windows. On POSIX systems, the method is non-operational and always returns `path` without modifications.

## path.win32

<!-- YAML
added: v0.11.15
-->

* {Object}

The `path.win32` property provides access to Windows-specific implementations of the `path` methods.