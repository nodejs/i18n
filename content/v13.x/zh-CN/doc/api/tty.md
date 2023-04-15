# TTY

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定

`tty` 模块提供了 `tty.ReadStream` 和 `tty.WriteStream` 类。 在大多数情况下，不需要或不可能直接使用此模块。 然而，可以通过如下方式访问它：

```js
const tty = require('tty');
```

当 Node.js 检测到其运行环境中有连接的文本终端 ("TTY") 时，默认情况下 [`process.stdin`][] 会被作为 `tty.ReadStream` 的实例初始化，同时 [`process.stdout`][] 和 [`process.stderr`][] 会被作为 `tty.WriteStream` 的实例初始化。 用于确定 Node.js 是否在 TTY 的上下文中运行的首选方法就是，检查 `process.stdout.isTTY` 属性的值是否为 `true`：

```sh
$ node -p -e "Boolean(process.stdout.isTTY)"
true
$ node -p -e "Boolean(process.stdout.isTTY)" | cat
false
```

在大多数情况下，应用程序几乎没有理由手工创建 `tty.ReadStream` 和 `tty.WriteStream` 类的实例。

## Class: `tty.ReadStream`
<!-- YAML
added: v0.5.8
-->

* Extends: {net.Socket}

Represents the readable side of a TTY. In normal circumstances [`process.stdin`][] will be the only `tty.ReadStream` instance in a Node.js process and there should be no reason to create additional instances.

### `readStream.isRaw`
<!-- YAML
added: v0.7.7
-->

如果 TTY 被配置为原始设备，则该 `boolean` 值为 `true`。 默认值为 `false`。

### `readStream.isTTY`
<!-- YAML
added: v0.5.8
-->

对于 `tty.ReadStream` 实例，该 `boolean` 值始终为 `true`。

### `readStream.setRawMode(mode)`
<!-- YAML
added: v0.7.7
-->

* `mode` {boolean} 如果为 `true`，将 `tty.ReadStream` 配置为原始设备。 如果为 `false`，将 `tty.ReadStream` 以其原始模式运行。 `readStream.isRaw` 属性将被设置为结果中对应的模式。
* Returns: {this} The read stream instance.

允许配置 `tty.ReadStream`，这样它可以作为原始设备运行。

在处于原始模式时，输入按字符逐个生效，但不包括修饰符。 此外，终端对字符的所有特殊处理都被禁用，包括回显输入字符。 `CTRL`+`C` will no longer cause a `SIGINT` when in this mode.

## Class: `tty.WriteStream`
<!-- YAML
added: v0.5.8
-->

* Extends: {net.Socket}

Represents the writable side of a TTY. In normal circumstances, [`process.stdout`][] and [`process.stderr`][] will be the only `tty.WriteStream` instances created for a Node.js process and there should be no reason to create additional instances.

### Event: `'resize'`
<!-- YAML
added: v0.7.7
-->

当 `writeStream.columns` 或 `writeStream.rows` 属性发生变化时，`'resize'` 事件会被触发。 它在被调用时，没有参数被传递给监听器回调函数。

```js
process.stdout.on('resize', () => {
  console.log('screen size has changed!');
  console.log(`${process.stdout.columns}x${process.stdout.rows}`);
});
```

### `writeStream.clearLine(dir[, callback])`
<!-- YAML
added: v0.7.7
changes:
  - version: v12.7.0
    pr-url: https://github.com/nodejs/node/pull/28721
    description: The stream's write() callback and return value are exposed.
-->

* `dir` {number}
  * `-1`: to the left from cursor
  * `1`: to the right from cursor
  * `0`: the entire line
* `callback` {Function} Invoked once the operation completes.
* Returns: {boolean} `false` if the stream wishes for the calling code to wait for the `'drain'` event to be emitted before continuing to write additional data; otherwise `true`.

`writeStream.clearLine()` clears the current line of this `WriteStream` in a direction identified by `dir`.

### `writeStream.clearScreenDown([callback])`
<!-- YAML
added: v0.7.7
changes:
  - version: v12.7.0
    pr-url: https://github.com/nodejs/node/pull/28721
    description: The stream's write() callback and return value are exposed.
-->

* `callback` {Function} Invoked once the operation completes.
* Returns: {boolean} `false` if the stream wishes for the calling code to wait for the `'drain'` event to be emitted before continuing to write additional data; otherwise `true`.

`writeStream.clearScreenDown()` clears this `WriteStream` from the current cursor down.

### `writeStream.columns`
<!-- YAML
added: v0.7.7
-->

用来表示当前 TTY 列数的 `数字`。 当 `'resize'` 事件被触发时，此属性被更新。

### `writeStream.cursorTo(x[, y][, callback])`
<!-- YAML
added: v0.7.7
changes:
  - version: v12.7.0
    pr-url: https://github.com/nodejs/node/pull/28721
    description: The stream's write() callback and return value are exposed.
-->

* `x` {number}
* `y` {number}
* `callback` {Function} Invoked once the operation completes.
* Returns: {boolean} `false` if the stream wishes for the calling code to wait for the `'drain'` event to be emitted before continuing to write additional data; otherwise `true`.

`writeStream.cursorTo()` moves this `WriteStream`'s cursor to the specified position.

### `writeStream.getColorDepth([env])`
<!-- YAML
added: v9.9.0
-->

* `env` {Object} An object containing the environment variables to check. This enables simulating the usage of a specific terminal. **Default:** `process.env`.
* 返回：{number}

返回:

* `1` for 2,
* `4` for 16,
* `8` for 256,
* `24` for 16,777,216 colors supported.

Use this to determine what colors the terminal supports. Due to the nature of colors in terminals it is possible to either have false positives or false negatives. It depends on process information and the environment variables that may lie about what terminal is used. It is possible to pass in an `env` object to simulate the usage of a specific terminal. This can be useful to check how specific environment settings behave.

To enforce a specific color support, use one of the below environment settings.

* 2 colors: `FORCE_COLOR = 0` (Disables colors)
* 16 colors: `FORCE_COLOR = 1`
* 256 colors: `FORCE_COLOR = 2`
* 16,777,216 colors: `FORCE_COLOR = 3`

Disabling color support is also possible by using the `NO_COLOR` and `NODE_DISABLE_COLORS` environment variables.

### `writeStream.getWindowSize()`
<!-- YAML
added: v0.7.7
-->

* Returns: {number[]}

`writeStream.getWindowSize()` returns the size of the [TTY](tty.html) corresponding to this `WriteStream`. The array is of the type `[numColumns, numRows]` where `numColumns` and `numRows` represent the number of columns and rows in the corresponding [TTY](tty.html).

### `writeStream.hasColors([count][, env])`
<!-- YAML
added: v11.13.0
-->

* `count` {integer} The number of colors that are requested (minimum 2). **Default:** 16.
* `env` {Object} An object containing the environment variables to check. This enables simulating the usage of a specific terminal. **Default:** `process.env`.
* 返回：{boolean}

Returns `true` if the `writeStream` supports at least as many colors as provided in `count`. Minimum support is 2 (black and white).

This has the same false positives and negatives as described in [`writeStream.getColorDepth()`][].

```js
process.stdout.hasColors();
// Returns true or false depending on if `stdout` supports at least 16 colors.
process.stdout.hasColors(256);
// Returns true or false depending on if `stdout` supports at least 256 colors.
process.stdout.hasColors({ TMUX: '1' });
// Returns true.
process.stdout.hasColors(2 ** 24, { TMUX: '1' });
// Returns false (the environment setting pretends to support 2 ** 8 colors).
```

### `writeStream.isTTY`
<!-- YAML
added: v0.5.8
-->

一个始终为 `true` 的 `boolean` 值。

### `writeStream.moveCursor(dx, dy[, callback])`
<!-- YAML
added: v0.7.7
changes:
  - version: v12.7.0
    pr-url: https://github.com/nodejs/node/pull/28721
    description: The stream's write() callback and return value are exposed.
-->

* `dx` {number}
* `dy` {number}
* `callback` {Function} Invoked once the operation completes.
* Returns: {boolean} `false` if the stream wishes for the calling code to wait for the `'drain'` event to be emitted before continuing to write additional data; otherwise `true`.

`writeStream.moveCursor()` moves this `WriteStream`'s cursor *relative* to its current position.

### `writeStream.rows`
<!-- YAML
added: v0.7.7
-->

用来表示 TTY 当前行数的 `数字`。 当 `'resize'` 事件被触发时，此属性被更新。

## `tty.isatty(fd)`
<!-- YAML
added: v0.5.8
-->

* `fd` {number} 一个数字类型的文件描述符
* 返回：{boolean}

如果给定的 `fd` 和 TTY 相关联，`tty.isatty()` 方法返回 `true`，否则返回 `false`，其中包括当 `fd` 值为负的情况。
