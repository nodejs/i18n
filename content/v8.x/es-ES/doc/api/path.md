# Ruta de Acceso

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

El módulo `path` proporciona utilidades para trabajar con rutas de archivos y directorios. Se puede acceder a él utilizando:

```js
const path = require('path');
```

## Windows vs. POSIX

The default operation of the `path` module varies based on the operating system on which a Node.js application is running. Specifically, when running on a Windows operating system, the `path` module will assume that Windows-style paths are being used.

So using `path.basename()` might yield different results on POSIX and Windows:

En POSIX:

```js
path.basename('C:\\temp\\myfile.html');
// Devuelve: 'C:\\temp\\myfile.html'
```

En Windows:

```js
path.basename('C:\\temp\\myfile.html');
// Devuelve: 'myfile.html'
```

To achieve consistent results when working with Windows file paths on any operating system, use [`path.win32`][]:

En POSIX y Windows:

```js
path.win32.basename('C:\\temp\\myfile.html');
// Devuelve: 'myfile.html'
```

To achieve consistent results when working with POSIX file paths on any operating system, use [`path.posix`][]:

En POSIX y Windows:

```js
path.posix.basename('/tmp/myfile.html');
// Devuelve: 'myfile.html'
```

*Nota:* En Windows, Node.js sigue el concepto de directorio de trabajo por disco. Este comportamiento puede ser observado cuando se usa una ruta de disco sin un backslash. For example `path.resolve('c:\\')` can potentially return a different result than `path.resolve('c:')`. For more information, see [this MSDN page](https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247.aspx#fully_qualified_vs._relative_paths).

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
* Devuelve: {string}

The `path.basename()` methods returns the last portion of a `path`, similar to the Unix `basename` command. Trailing directory separators are ignored, see [`path.sep`][].

For example:

```js
path.basename('/foo/bar/baz/asdf/quux.html');
// Devuelve: 'quux.html'

path.basename('/foo/bar/baz/asdf/quux.html', '.html');
// Devuelve: 'quux'
```

A [`TypeError`][] is thrown if `path` is not a string or if `ext` is given and is not a string.

## path.delimiter

<!-- YAML
added: v0.9.3
-->

* {string}

Proporciona el delimitador de ruta específico de la plataforma:

* `;` para Windows
* `:` para POSIX

Por ejemplo, en POSIX:

```js
console.log(process.env.PATH);
// Devuelve: '/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin'

process.env.PATH.split(path.delimiter);
// Devuelve: ['/usr/bin', '/bin', '/usr/sbin', '/sbin', '/usr/local/bin']
```

En Windows:

```js
console.log(process.env.PATH);
// Imprime: 'C:\Windows\system32;C:\Windows;C:\Program Files\node\'

process.env.PATH.split(path.delimiter);
// Devuelve ['C:\\Windows\\system32', 'C:\\Windows', 'C:\\Program Files\\node\\']
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
* Devuelve: {string}

The `path.dirname()` method returns the directory name of a `path`, similar to the Unix `dirname` command. Trailing directory separators are ignored, see [`path.sep`][].

For example:

```js
path.dirname('/foo/bar/baz/asdf/quux');
// Devuelve: '/foo/bar/baz/asdf'
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
* Devuelve: {string}

The `path.extname()` method returns the extension of the `path`, from the last occurrence of the `.` (period) character to end of string in the last portion of the `path`. If there is no `.` in the last portion of the `path`, or if the first character of the basename of `path` (see `path.basename()`) is `.`, then an empty string is returned.

For example:

```js
path.extname('index.html');
// Devuelve: '.html'

path.extname('index.coffee.md');
// Devuelve: '.md'

path.extname('index.');
// Devuelve: '.'

path.extname('index');
// Devuelve: ''

path.extname('.index');
// Devuelve: ''
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
* Devuelve: {string}

El método `path.format()` retorna un string de ruta de un objeto. This is the opposite of [`path.parse()`][].

When providing properties to the `pathObject` remember that there are combinations where one property has priority over another:

* `pathObject.root` es ignorado si `pathObject.dir` es proporcionado
* `pathObject.ext` y `pathObject.name` son ignorados si `pathObject.base` existe

Por ejemplo, en POSIX:

```js
// Si `dir`, `root` y `base` son propocionados,
// `${dir}${path.sep}${base}`
// será devuelto. `root` es ignorado.
path.format({
  root: '/ignored',
  dir: '/home/user/dir',
  base: 'file.txt'
});
// Devuelve: '/home/user/dir/file.txt'

// `root` será usado si `dir` no es especificado.
// Si solo `root` es proporcionado o`dir` es igual a `root` entonces el
// separador de plataforma no va a ser incluido. `ext` será ignorado.
path.format({
  root: '/',
  base: 'file.txt',
  ext: 'ignored'
});
// Devuelve: '/file.txt'

// `name` + `ext` será usado si `base` no es especificado.
path.format({
  root: '/',
  name: 'file',
  ext: '.txt'
});
// Devuelve: '/file.txt'
```

En Windows:

```js
path.format({
  dir: 'C:\\path\\dir',
  base: 'file.txt'
});
// Devuelve: 'C:\\path\\dir\\file.txt'
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
* Devuelve: {string}

The `path.join()` method joins all given `path` segments together using the platform specific separator as a delimiter, then normalizes the resulting path.

Los segmentos `path` sin extensión son ignorados. If the joined path string is a zero-length string then `'.'` will be returned, representing the current working directory.

For example:

```js
path.join('/foo', 'bar', 'baz/asdf', 'quux', '..');
// Devuelve: '/foo/bar/baz/asdf'

path.join('foo', {}, 'bar');
// arroja 'TypeError: Path debe ser una string. Recibido {}'
```

Un [`TypeError`][] va a ser producido si cualquiera de los segmentos de ruta no es un string.

## path.normalize(path)

<!-- YAML
added: v0.1.23
-->

* `path` {string}
* Devuelve: {string}

The `path.normalize()` method normalizes the given `path`, resolving `'..'` and `'.'` segments.

When multiple, sequential path segment separation characters are found (e.g. `/` on POSIX and either ``\` or``/`on Windows), they are replaced by a single
instance of the platform specific path segment separator (`/`on POSIX and`\` on Windows). Los separadores de seguimiento son preservados.

If the `path` is a zero-length string, `'.'` is returned, representing the current working directory.

Por ejemplo, en POSIX:

```js
path.normalize('/foo/bar//baz/asdf/quux/..');
// Devuelve: '/foo/bar/baz/asdf'
```

En Windows:

```js
path.normalize('C:\\temp\\\\foo\\bar\\..\\');
// Devuelve: 'C:\\temp\\foo\\'
```

Since Windows recognizes multiple path separators, both separators will be replaced by instances of the Windows preferred separator (``):

```js
path.win32.normalize('C:////temp\\\\/\\/\\/foo/bar');
// Devuelve: 'C:\\temp\\foo\\bar'
```

Un [`TypeError`][] es producido si `path` no es un string.

## path.parse(path)

<!-- YAML
added: v0.11.15
-->

* `path` {string}
* Devuelve: {Object}

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
(todos los espacios en la línea "" deben ser ignorados — ellos están solamente para el formato)
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
(todos los espacios en la línea "" deben ser ignorados — ellos están solamente para el formato)
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
* Devuelve: {string}

The `path.relative()` method returns the relative path from `from` to `to` based on the current working directory. If `from` and `to` each resolve to the same path (after calling `path.resolve()` on each), a zero-length string is returned.

If a zero-length string is passed as `from` or `to`, the current working directory will be used instead of the zero-length strings.

Por ejemplo, en POSIX:

```js
path.relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb');
// Devuelve: '../../impl/bbb'
```

En Windows:

```js
path.relative('C:\\orandea\\test\\aaa', 'C:\\orandea\\impl\\bbb');
// Devuelve: '..\\..\\impl\\bbb'
```

Un [`TypeError`][] es arrojado si `from` o `to` no son strings.

## path.resolve([...paths])

<!-- YAML
added: v0.3.4
-->

* `...paths` {string} Una secuencia de rutas o segmentos de ruta
* Devuelve: {string}

The `path.resolve()` method resolves a sequence of paths or path segments into an absolute path.

The given sequence of paths is processed from right to left, with each subsequent `path` prepended until an absolute path is constructed. For instance, given the sequence of path segments: `/foo`, `/bar`, `baz`, calling `path.resolve('/foo', '/bar', 'baz')` would return `/bar/baz`.

If after processing all given `path` segments an absolute path has not yet been generated, the current working directory is used.

The resulting path is normalized and trailing slashes are removed unless the path is resolved to the root directory.

Los segmentos `path` sin extensión son ignorados.

If no `path` segments are passed, `path.resolve()` will return the absolute path of the current working directory.

For example:

```js
path.resolve('/foo/bar', './baz');
// Devuelve: '/foo/bar/baz'

path.resolve('/foo/bar', '/tmp/file/');
// Devuelve: '/tmp/file'

path.resolve('wwwroot', 'static_files/png/', '../gif/image.gif');
// si el directorio de trabajo actual es /home/myself/node,
// esto devuelve '/home/myself/node/wwwroot/static_files/gif/image.gif'
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
// Devuelve: ['foo', 'bar', 'baz']
```

En Windows:

```js
'foo\\bar\\baz'.split(path.sep);
// Devuelve: ['foo', 'bar', 'baz']
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