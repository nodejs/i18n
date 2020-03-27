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

## 类：tty.ReadStream
<!-- YAML
added: v0.5.8
-->

`tty.ReadStream` 类是 [`net.Socket`][] 的子类，用来表示和 TTY 读取相关的特性。 在正常情况下 [`process.stdin`][] 是 Node.js 进程中唯一的 `tty.ReadStream` 实例，且没有任何理由需要创建其他实例。

### readStream.isRaw
<!-- YAML
added: v0.7.7
-->

如果 TTY 被配置为原始设备，则该 `boolean` 值为 `true`。 默认值为 `false`。

### readStream.isTTY
<!-- YAML
added: v0.5.8
-->

对于 `tty.ReadStream` 实例，该 `boolean` 值始终为 `true`。

### readStream.setRawMode(mode)
<!-- YAML
added: v0.7.7
-->

允许配置 `tty.ReadStream`，这样它可以作为原始设备运行。

在处于原始模式时，输入按字符逐个生效，但不包括修饰符。 此外，终端对字符的所有特殊处理都被禁用，包括回显输入字符。 注意在此模式下，`CTRL`+`C` 不再产生 `SIGINT`。

* `mode` {boolean} 如果为 `true`，将 `tty.ReadStream` 配置为原始设备。 如果为 `false`，将 `tty.ReadStream` 以其原始模式运行。 `readStream.isRaw` 属性将被设置为结果中对应的模式。

## 类：tty.WriteStream
<!-- YAML
added: v0.5.8
-->

`tty.WriteStream` 类是 `net.Socket` 的子类，用来表示和 TTY 写入相关的特性。 在正常情况下，[`process.stdout`][] 和 [`process.stderr`][] 将会是为 Node.js 进程创建的唯一的 `tty.WriteStream` 实例，且没有任何理由需要创建其他实例。

### 事件：'resize'
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

### writeStream.columns
<!-- YAML
added: v0.7.7
-->

用来表示当前 TTY 列数的 `数字`。 当 `'resize'` 事件被触发时，此属性被更新。

### writeStream.isTTY
<!-- YAML
added: v0.5.8
-->

一个始终为 `true` 的 `boolean` 值。

### writeStream.rows
<!-- YAML
added: v0.7.7
-->

用来表示 TTY 当前行数的 `数字`。 当 `'resize'` 事件被触发时，此属性被更新。

## tty.isatty(fd)
<!-- YAML
added: v0.5.8
-->

* `fd` {number} 一个数字类型的文件描述符

如果给定的 `fd` 和 TTY 相关联，`tty.isatty()` 方法返回 `true`，否则返回 `false`，其中包括当 `fd` 值为负的情况。
