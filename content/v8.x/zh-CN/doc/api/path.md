# 路径

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定的

`path` 模块提供了用于处理文件和目录路径的实用工具。 可以通过如下方式使用它：

```js
const path = require('path');
```

## Windows 与 POSIX

The default operation of the `path` module varies based on the operating system on which a Node.js application is running. Specifically, when running on a Windows operating system, the `path` module will assume that Windows-style paths are being used.

So using `path.basename()` might yield different results on POSIX and Windows:

在 POSIX 系统上：

```js
path.basename('C:\\temp\\myfile.html');
// Returns: 'C:\\temp\\myfile.html'
```

在 Windows 系统上：

```js
path.basename('C:\\temp\\myfile.html');
// Returns: 'myfile.html'
```

To achieve consistent results when working with Windows file paths on any operating system, use [`path.win32`][]:

在 POSIX 和 Windows 系统上：

```js
path.win32.basename('C:\\temp\\myfile.html');
// Returns: 'myfile.html'
```

To achieve consistent results when working with POSIX file paths on any operating system, use [`path.posix`][]:

在 POSIX 和 Windows 系统上:

```js
path.posix.basename('/tmp/myfile.html');
// Returns: 'myfile.html'
```

* 注意: *在 Windows 系统上，Node.js 遵循单驱动器工作目录的概念。 使用不带反斜线的驱动器路径时, 可以观察到此行为。 For example `path.resolve('c:\\')` can potentially return a different result than `path.resolve('c:')`. For more information, see [this MSDN page](https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247.aspx#fully_qualified_vs._relative_paths).

## path.basename(path[, ext])

<!-- YAML
added: v0.1.25
changes:

  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Passing a non-string as the `path` argument will throw now.
-->

* `path` {string}
* `ext` {string} 可选的文件扩展名
* 返回：{string}

The `path.basename()` methods returns the last portion of a `path`, similar to the Unix `basename` command. Trailing directory separators are ignored, see [`path.sep`][].

例如：

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

提供针对特定平台的路径分隔符：

* `;` 用于 Windows
* `:` 用于 POSIX

例如，在 POSIX 系统上：

```js
console.log(process.env.PATH);
// Prints: '/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin'

process.env.PATH.split(path.delimiter);
// Returns: ['/usr/bin', '/bin', '/usr/sbin', '/sbin', '/usr/local/bin']
```

在 Windows 系统上：

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
* 返回：{string}

The `path.dirname()` method returns the directory name of a `path`, similar to the Unix `dirname` command. Trailing directory separators are ignored, see [`path.sep`][].

例如：

```js
path.dirname('/foo/bar/baz/asdf/quux');
// Returns: '/foo/bar/baz/asdf'
```

如果 `path` 不是字符串，则会抛出 [`TypeError`][]。

## path.extname(path)

<!-- YAML
added: v0.1.25
changes:

  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Passing a non-string as the `path` argument will throw now.
-->

* `path` {string}
* 返回：{string}

The `path.extname()` method returns the extension of the `path`, from the last occurrence of the `.` (period) character to end of string in the last portion of the `path`. If there is no `.` in the last portion of the `path`, or if the first character of the basename of `path` (see `path.basename()`) is `.`, then an empty string is returned.

例如：

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

如果 `path` 不是字符串，则抛出 [`TypeError`][]。

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
* 返回：{string}

`path.format()` 从对象返回一个路径字符串。 This is the opposite of [`path.parse()`][].

When providing properties to the `pathObject` remember that there are combinations where one property has priority over another:

* 如果提供了 `pathObject.dir`，则会忽略 `pathObject.root`
* 如果 `pathObject.base` 存在，则 `pathObject.ext` 和 `pathObject.name` 会被忽略

例如，在 POSIX 系统上，

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

在 Windows 系统上：

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
* 返回：{boolean}

`path.isAbsolute()` 方法检测 `path` 是否为绝对路径。

如果给定的 `path` 为长度为零的字符串，则返回 `false` 。

例如，在 POSIX 系统上：

```js
path.isAbsolute('/foo/bar'); // true
path.isAbsolute('/baz/..');  // true
path.isAbsolute('qux/');     // false
path.isAbsolute('.');        // false
```

在 Windows 系统上：

```js
path.isAbsolute('//server');    // true
path.isAbsolute('\\\\server');  // true
path.isAbsolute('C:/foo/..');   // true
path.isAbsolute('C:\\foo\\..'); // true
path.isAbsolute('bar\\baz');    // false
path.isAbsolute('bar/baz');     // false
path.isAbsolute('.');           // false
```

如果 `path` 不是字符串，则抛出 [`TypeError`][]。

## path.join([...paths])

<!-- YAML
added: v0.1.16
-->

* `...paths` {string} 路径片段序列
* 返回：{string}

The `path.join()` method joins all given `path` segments together using the platform specific separator as a delimiter, then normalizes the resulting path.

长度为零的 `path` 片段将被忽略。 If the joined path string is a zero-length string then `'.'` will be returned, representing the current working directory.

例如：

```js
path.join('/foo', 'bar', 'baz/asdf', 'quux', '..');
// Returns: '/foo/bar/baz/asdf'

path.join('foo', {}, 'bar');
// throws 'TypeError: Path must be a string. Received {}'
```

如果任何路径片段不是字符串，则会抛出 [`TypeError`][]。

## path.normalize(path)

<!-- YAML
added: v0.1.23
-->

* `path` {string}
* 返回：{string}

The `path.normalize()` method normalizes the given `path`, resolving `'..'` and `'.'` segments.

When multiple, sequential path segment separation characters are found (e.g. `/` on POSIX and either `` or `/` on Windows), they are replaced by a single instance of the platform specific path segment separator (`/` on POSIX and `` on Windows). 尾部的分隔符会被保留。

If the `path` is a zero-length string, `'.'` is returned, representing the current working directory.

例如，在 POSIX 系统上：

```js
path.normalize('/foo/bar//baz/asdf/quux/..');
// Returns: '/foo/bar/baz/asdf'
```

在 Windows 系统上：

```js
path.normalize('C:\\temp\\\\foo\\bar\\..\\');
// Returns: 'C:\\temp\\foo\\'
```

Since Windows recognizes multiple path separators, both separators will be replaced by instances of the Windows preferred separator (``):

```js
path.win32.normalize('C:////temp\\\\/\\/\\/foo/bar');
// Returns: 'C:\\temp\\foo\\bar'
```

如果 `path` 不是字符串，则会抛出 [`TypeError`][]。

## path.parse(path)

<!-- YAML
added: v0.11.15
-->

* `path` {string}
* 返回：{Object}

The `path.parse()` method returns an object whose properties represent significant elements of the `path`. Trailing directory separators are ignored, see [`path.sep`][].

返回的对象含有如下属性：

* `dir` {string}
* `root` {string}
* `base` {string}
* `name` {string}
* `ext` {string}

例如，在 POSIX 系统上：

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

在 Windows 系统上：

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

如果 `path` 不是字符串，则会抛出 [`TypeError`][]。

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
* 返回：{string}

The `path.relative()` method returns the relative path from `from` to `to` based on the current working directory. If `from` and `to` each resolve to the same path (after calling `path.resolve()` on each), a zero-length string is returned.

If a zero-length string is passed as `from` or `to`, the current working directory will be used instead of the zero-length strings.

例如，在 POSIX 系统上：

```js
path.relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb');
// Returns: '../../impl/bbb'
```

在 Windows 系统上：

```js
path.relative('C:\\orandea\\test\\aaa', 'C:\\orandea\\impl\\bbb');
// Returns: '..\\..\\impl\\bbb'
```

如果 `from` 或 `to` 不是字符串，则会抛出 [`TypeError`][]。

## path.resolve([...paths])

<!-- YAML
added: v0.3.4
-->

* `...paths` {string} 路径或路径片段序列
* 返回：{string}

The `path.resolve()` method resolves a sequence of paths or path segments into an absolute path.

The given sequence of paths is processed from right to left, with each subsequent `path` prepended until an absolute path is constructed. For instance, given the sequence of path segments: `/foo`, `/bar`, `baz`, calling `path.resolve('/foo', '/bar', 'baz')` would return `/bar/baz`.

If after processing all given `path` segments an absolute path has not yet been generated, the current working directory is used.

The resulting path is normalized and trailing slashes are removed unless the path is resolved to the root directory.

零长度的 `path` 片段将被忽略。

If no `path` segments are passed, `path.resolve()` will return the absolute path of the current working directory.

例如：

```js
path.resolve('/foo/bar', './baz');
// Returns: '/foo/bar/baz'

path.resolve('/foo/bar', '/tmp/file/');
// Returns: '/tmp/file'

path.resolve('wwwroot', 'static_files/png/', '../gif/image.gif');
// if the current working directory is /home/myself/node,
// this returns '/home/myself/node/wwwroot/static_files/gif/image.gif'
```

如果任何一个参数不是字符串，则会抛出 [`TypeError`][] 。

## path.sep

<!-- YAML
added: v0.7.9
-->

* {string}

提供针对特定平台的路径片段分隔符：

* `` 在 Windows 系统上
* `/` 在 POSIX 系统上

例如，在 POSIX 系统上：

```js
'foo/bar/baz'.split(path.sep);
// Returns: ['foo', 'bar', 'baz']
```

在 Windows 系统上：

```js
'foo\\bar\\baz'.split(path.sep);
// Returns: ['foo', 'bar', 'baz']
```

*Note*: On Windows, both the forward slash (`/`) and backward slash (``) are accepted as path segment separators; however, the `path` methods only add backward slashes (``).

## path.win32

<!-- YAML
added: v0.11.15
-->

* {Object}

The `path.win32` property provides access to Windows-specific implementations of the `path` methods.