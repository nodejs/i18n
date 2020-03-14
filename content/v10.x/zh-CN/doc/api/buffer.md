# 缓冲区

<!--introduced_in=v0.1.90-->

> 稳定性：2 - 稳定

在引入 [` TypedArray `] 之前, JavaScript 语言没有读取或操作二进制数据流的机制。 将 `Buffer` 类作为节点的一部分引入Node. js API, 以便在 TCP 流、文件系统操作和其他上下文中用八位位组的方式交互。

随着 [` TypedArray `] 现在变得可用, `Buffer` 类以更优化且适合于节点的方式实现 [` Uint8Array `] 此 API 接口 。

`Buffer`类的实例类似于整数数组，但对应于 V8 堆之外的固定大小的原始内存分配。 `Buffer` 的大小在创建时建立, 不能更改。

`Buffer` 类位于全局范围内, 因此不太可能需要使用 ` require('buffer').Buffer`。

```js
// Creates a zero-filled Buffer of length 10.
const buf1 = Buffer.alloc(10);

// Creates a Buffer of length 10, filled with 0x1.
const buf2 = Buffer.alloc(10, 1);

// Creates an uninitialized buffer of length 10.
// This is faster than calling Buffer.alloc() but the returned
// Buffer instance might contain old data that needs to be
// overwritten using either fill() or write().
const buf3 = Buffer.allocUnsafe(10);

// Creates a Buffer containing [0x1, 0x2, 0x3].
const buf4 = Buffer.from([1, 2, 3]);

// Creates a Buffer containing UTF-8 bytes [0x74, 0xc3, 0xa9, 0x73, 0x74].
const buf5 = Buffer.from('tést');

// Creates a Buffer containing Latin-1 bytes [0x74, 0xe9, 0x73, 0x74].
const buf6 = Buffer.from('tést', 'latin1');
```

## `Buffer.from()`, `Buffer.alloc()`, 和 `Buffer.allocUnsafe()`

在 Node.js 6.0.0 版本之前, 实例通过 `Buffer` 构造函数创建, 它基于不同构造参数 `Buffer` 返回不同的 `Buffer`实例：

* Passing a number as the first argument to `Buffer()` (e.g. `new Buffer(10)`) allocates a new `Buffer` object of the specified size. Prior to Node.js 8.0.0, the memory allocated for such `Buffer` instances is *not* initialized and *can contain sensitive data*. Such `Buffer` instances *must* be subsequently initialized by using either [`buf.fill(0)`][`buf.fill()`] or by writing to the entire `Buffer`. While this behavior is *intentional* to improve performance, development experience has demonstrated that a more explicit distinction is required between creating a fast-but-uninitialized `Buffer` versus creating a slower-but-safer `Buffer`. Starting in Node.js 8.0.0, `Buffer(num)` and `new Buffer(num)` will return a `Buffer` with initialized memory.
* 作为第一个参数传递字符串，数组，或 `Buffer`，将被传递对象的数据复制到 `Buffer`。
* 传递 [`ArrayBuffer`] 或 [`SharedArrayBuffer`] 将会返回一个和给定数组缓冲区共享已分配内存的 `Buffer`。

由于 ` new Buffer() ` 的行为会根据所传入的第一个参数的类型而改变，所以如果应用程序没有进行参数验证，或未能初始化新分配的 `Buffer`，就有可能在无意中为程序带来安全性与可靠性问题。

To make the creation of `Buffer` instances more reliable and less error-prone, the various forms of the `new Buffer()` constructor have been **deprecated** and replaced by separate `Buffer.from()`, [`Buffer.alloc()`], and [`Buffer.allocUnsafe()`] methods.

*开发人员应将 `new Buffer()` 构造函数的所有现有使用迁移到这些新 api 之一中。*

* [`Buffer.from(array)`] returns a new `Buffer` that *contains a copy* of the provided octets.
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`] returns a new `Buffer` that *shares the same allocated memory* as the given [`ArrayBuffer`].
* [`Buffer.from(buffer)`] returns a new `Buffer` that *contains a copy* of the contents of the given `Buffer`.
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`] returns a new `Buffer` that *contains a copy* of the provided string.
* [`Buffer.alloc(size[, fill[, encoding]])`][`Buffer.alloc()`] returns a new initialized `Buffer` of the specified size. This method is slower than [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] but guarantees that newly created `Buffer` instances never contain old data that is potentially sensitive.
* [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] and [`Buffer.allocUnsafeSlow(size)`][`Buffer.allocUnsafeSlow()`] each return a new uninitialized `Buffer` of the specified `size`. Because the `Buffer` is uninitialized, the allocated segment of memory might contain old data that is potentially sensitive.

如果 `size` 小于或等于 [`Buffer.poolSize`] 的一半， 则 [`Buffer.allocUnsafe()`] 返回的 `Buffer` 实例 *可能* 会被分配进一个共享的内部内存池。 [`Buffer.allocUnsafeSlow()`] 返回的实例 *从不* 使用共享的内部内存池。

### `--zero-fill-buffers` 命令行选项
<!-- YAML
added: v5.10.0
-->

Node.js can be started using the `--zero-fill-buffers` command line option to cause all newly allocated `Buffer` instances to be zero-filled upon creation by default, including buffers returned by `new Buffer(size)`, [`Buffer.allocUnsafe()`], [`Buffer.allocUnsafeSlow()`], and `new
SlowBuffer(size)`. Use of this flag can have a significant negative impact on performance. Use of the `--zero-fill-buffers` option is recommended only when necessary to enforce that newly allocated `Buffer` instances cannot contain old data that is potentially sensitive.

```txt
$ node --zero-fill-buffers
> Buffer.allocUnsafe(5);
<Buffer 00 00 00 00 00>
```

### 是什么令 `Buffer.allocUnsafe()` 和 `Buffer.allocUnsafeSlow()` “不安全”？

当调用 [`Buffer.allocUnsafe()`] 和 [`Buffer.allocUnsafeSlow()`] 时，被分配的内存段是 *未初始化的* （没有用 0 填充）。 虽然这样的设计使得内存的分配非常快，但已分配的内存段可能包含潜在的敏感旧数据。 使用由 [`Buffer.allocUnsafe()`] 创建的没有被 *完全* 重写内存的 `Buffer`，在 `Buffer` 内存被读取的时候，可能泄露旧数据。

虽然使用 [`Buffer.allocUnsafe()`] 有明显的性能优势，但 *必须* 要额外小心，以避免给应用程序带来安全漏洞。

## Buffer 与字符编码
<!-- YAML
changes:
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7111
    description: Introduced `latin1` as an alias for `binary`.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2859
    description: Removed the deprecated `raw` and `raws` encodings.
-->

When string data is stored in or extracted out of a `Buffer` instance, a character encoding may be specified.

```js
const buf = Buffer.from('hello world', 'ascii');

console.log(buf.toString('hex'));
// Prints: 68656c6c6f20776f726c64
console.log(buf.toString('base64'));
// Prints: aGVsbG8gd29ybGQ=

console.log(Buffer.from('fhqwhgads', 'ascii'));
// Prints: <Buffer 66 68 71 77 68 67 61 64 73>
console.log(Buffer.from('fhqwhgads', 'utf16le'));
// Prints: <Buffer 66 00 68 00 71 00 77 00 68 00 67 00 61 00 64 00 73 00>
```

Node.js当前支持的字符编码包括：

* `'ascii'` - 仅支持 7 位 ASCII 数据。 此编码速度很快，而且一旦设置，会剥离高位。

* `'utf8'` - 多字节编码的 Unicode 字符。 很多网页或者其它文档的编码格式都是使用 UTF-8 的。

* `'utf16le'` - 2 或 4 个字节，小端字节编码的 Unicode 字符。 支持代理对（(U+10000 到 U+10FFFF) ）。

* `'ucs2'` - `'utf16le'` 的别名。

* `'base64'` - Base64 编码。 当从字符串创建 `Buffer` 时，按照 [RFC4648, 第 5 章](https://tools.ietf.org/html/rfc4648#section-5) 中指明的，这种编码也将正确地接受 “URL 和文件名安全字母表”。

* `'latin1'` - 一种把 `Buffer` 编码成 1 字节编码的字符串的方式（由IANA定义在[RFC1345](https://tools.ietf.org/html/rfc1345) 中第63页，作为Latin-1补充块和C0/C1控制码 ）。

* `'binary'` - `'latin1'` 的别名。

* `'hex'` - 将每个字节编码为两个十六进制字符。

Modern Web browsers follow the [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/) which aliases both `'latin1'` and `'ISO-8859-1'` to `'win-1252'`. 这意味着当进行例如 `http.get()` 这样的操作时，如果返回的字符集是 WHATWG 规范列表中的，则有可能服务器实际上返回 `'win-1252'` 编码的数据，此时使用 `'latin1'` 编码方式可能会错误地解码字符。

## Buffers 和 TypedArray
<!-- YAML
changes:
  - version: v3.0.0
    pr-url: https://github.com/nodejs/node/pull/2002
    description: The `Buffer`s class now inherits from `Uint8Array`.
-->

`Buffer` 实例也是 [`Uint8Array`] 实例。 但是与[`TypedArray`] 存在微妙的不兼容。 例如，当 [`ArrayBuffer#slice()`] 创建一个切片的副本时，[`Buffer#slice()`][`buf.slice()`] 的实现是在现有的 `Buffer` 上不经过复制而直接创建视图，这使得 [`Buffer#slice()`][`buf.slice()`] 更加高效。

遵循以下注意事项，也可以从一个 `Buffer` 中创建一个新的 [`TypedArray`] 实例：

1. `Buffer` 对象的内存是被复制到 [`TypedArray`] 中的，而不是共享的。

2. `Buffer` 对象的内存是被解析为一个截然不同的元素的数组，而不是一个目标类型的字节数组。 也就是说，`new Uint32Array(Buffer.from([1, 2, 3, 4]))` 会创建一个包含 `[1, 2, 3, 4]` 四个元素的 [`Uint32Array`]， 而不是一个只包含 `[0x1020304]` 或 `[0x4030201]` 一个元素的 [`Uint32Array`]。

It is possible to create a new `Buffer` that shares the same allocated memory as a [`TypedArray`] instance by using the `TypedArray` object's `.buffer` property.

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Copies the contents of `arr`
const buf1 = Buffer.from(arr);
// Shares memory with `arr`
const buf2 = Buffer.from(arr.buffer);

console.log(buf1);
// Prints: <Buffer 88 a0>
console.log(buf2);
// Prints: <Buffer 88 13 a0 0f>

arr[1] = 6000;

console.log(buf1);
// Prints: <Buffer 88 a0>
console.log(buf2);
// Prints: <Buffer 88 13 70 17>
```

请注意，当使用 [`TypedArray`] 的 `.buffer` 创建 `Buffer`时，也可以通过传入 `byteOffset` 和 `length` 参数只使用 [`ArrayBuffer`] 的一部分。

```js
const arr = new Uint16Array(20);
const buf = Buffer.from(arr.buffer, 0, 16);

console.log(buf.length);
// Prints: 16
```

`Buffer.from()` 和 [`TypedArray.from()`] 有不同的签名和实现。 具体而言，[`TypedArray`] 的变体接受第二个参数，它是在类型数组的每个元素上调用的映射函数：

* `TypedArray.from(source[, mapFn[, thisArg]])`

但是 `Buffer.from()` 方法不支持使用映射函数：

* [`Buffer.from(array)`]
* [`Buffer.from(buffer)`]
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`]
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`]

## Buffers 和 迭代

`Buffer` 实例 可以通过 `for..of` 语法进行迭代：

```js
const buf = Buffer.from([1, 2, 3]);

// Prints:
//   1
//   2
//   3
for (const b of buf) {
  console.log(b);
}
```

而且，可以通过 [`buf.values()`]，[`buf.keys()`] 和 [`buf.entries()`] 方法创建迭代器。

## Class: Buffer

`Buffer` 类是一个直接处理二进制数据的全局类型。 它能够以多种方式构建。

### new Buffer(array)
<!-- YAML
deprecated: v6.0.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19524
    description: Calling this constructor emits a deprecation warning when
                 run from code outside the `node_modules` directory.
  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
-->

> 稳定性：0 - 已弃用：改为使用 [`Buffer.from(array)`]。

* `array` {integer[]} 要从中复制的字节数组。

使用 8 字节的 `array` 分配一个新的 `Buffer`。

```js
// Creates a new Buffer containing the UTF-8 bytes of the string 'buffer'
const buf = new Buffer([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
```

### new Buffer(arrayBuffer[, byteOffset[, length]])
<!-- YAML
added: v3.0.0
deprecated: v6.0.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19524
    description: Calling this constructor emits a deprecation warning when
                 run from code outside the `node_modules` directory.
  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4682
    description: The `byteOffset` and `length` parameters are supported now.
-->

> 稳定性：0 - 已弃用：改为使用 [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`]。

* `arrayBuffer` {ArrayBuffer|SharedArrayBuffer} [`ArrayBuffer`]，[`SharedArrayBuffer`] 或 [`TypedArray`] 的 `.buffer` 属性。
* `byteOffset` {integer} 要暴露的第一个字节的索引。 **默认值：** `0`。
* `length` {integer} 要暴露的字节数。 **默认值：** `arrayBuffer.length - byteOffset`。

该方法将创建 [`ArrayBuffer`] 或 [`SharedArrayBuffer`] 的视图，而不会复制底层内存。 例如，当传入一个 [`TypedArray`] 实例的 `.buffer` 属性的引用时，新创建的 `Buffer` 将会像 [`TypedArray`] 那样共享相同的已分配内存。

可选的 `byteOffset` 和 `length` 参数指定`arrayBuffer` 中将与 `Buffer` 共享的的内存范围。

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Shares memory with `arr`
const buf = new Buffer(arr.buffer);

console.log(buf);
// Prints: <Buffer 88 13 a0 0f>

// Changing the original Uint16Array changes the Buffer also
arr[1] = 6000;

console.log(buf);
// Prints: <Buffer 88 13 70 17>
```

### new Buffer(buffer)
<!-- YAML
deprecated: v6.0.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19524
    description: Calling this constructor emits a deprecation warning when
                 run from code outside the `node_modules` directory.
  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
-->

> 稳定性：0 - 已弃用：改为使用 [`Buffer.from(buffer)`]。

* `buffer` {Buffer|Uint8Array} 一个要被复制数据的 `Buffer` 或 [`Uint8Array`]。

将传入 `buffer` 的数据复制到新的 `Buffer` 实例。

```js
const buf1 = new Buffer('buffer');
const buf2 = new Buffer(buf1);

buf1[0] = 0x61;

console.log(buf1.toString());
// Prints: auffer
console.log(buf2.toString());
// Prints: buffer
```

### new Buffer(size)
<!-- YAML
deprecated: v6.0.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19524
    description: Calling this constructor emits a deprecation warning when
                 run from code outside the `node_modules` directory.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12141
    description: The `new Buffer(size)` will return zero-filled memory by
                 default.
  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
-->

> 稳定性：0 - 已弃用：改为使用 [`Buffer.alloc()`]（也请参阅 [`Buffer.allocUnsafe()`]）。

* `size` {integer} 新建 `Buffer` 的所需长度。

分配一个大小为 `size` 字节的新的 `Buffer`。 If `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, [`ERR_INVALID_OPT_VALUE`] is thrown. A zero-length `Buffer` is created if `size` is 0.

在 Node.js 8.0.0 之前，以这种方式创建的 `Buffer` 实例的底层内存是 *未初始化的*。 新建 `Buffer` 的内容是未知的，并且 *可能包含敏感数据*。 Use [`Buffer.alloc(size)`][`Buffer.alloc()`] instead to initialize a `Buffer` with zeroes.

```js
const buf = new Buffer(10);

console.log(buf);
// Prints: <Buffer 00 00 00 00 00 00 00 00 00 00>
```

### new Buffer(string[, encoding])
<!-- YAML
deprecated: v6.0.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19524
    description: Calling this constructor emits a deprecation warning when
                 run from code outside the `node_modules` directory.
  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
-->

> 稳定性：0 - 已弃用：改为使用 [`Buffer.from(string[, encoding])`][`Buffer.from(string)`]。

* `string` {string} 要编码的字符串。
* `encoding` {string} `string` 的编码。 **默认值:**`‘utf8'`。

创建一个包含 `string` 的 `Buffer`。 `encoding` 参数指定 `string` 的字符串编码方式。

```js
const buf1 = new Buffer('this is a tést');
const buf2 = new Buffer('7468697320697320612074c3a97374', 'hex');

console.log(buf1.toString());
// Prints: this is a tést
console.log(buf2.toString());
// Prints: this is a tést
console.log(buf1.toString('ascii'));
// Prints: this is a tC)st
```

### 类方法：Buffer.alloc(size[, fill[, encoding]])
<!-- YAML
added: v5.10.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18129
    description: Attempting to fill a non-zero length buffer with a zero length
                 buffer triggers a thrown exception.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17427
    description: Specifying an invalid string for `fill` triggers a thrown
                 exception.
  - version: v8.9.3
    pr-url: https://github.com/nodejs/node/pull/17428
    description: Specifying an invalid string for `fill` now results in a
                 zero-filled buffer.
-->

* `size` {integer} 新建 `Buffer` 的所需长度。
* `fill` {string|Buffer|integer} 用来预填充新建 `Buffer` 的值。 **默认值：** `0`。
* `encoding` {string} 如果 `fill` 是字符串，则该值是它的编码方式。 **默认值:**`‘utf8'`。

分配一个大小为 `size` 字节的新的 `Buffer`。 如果 `fill` 是 `未定义的`，则 `Buffer` 将会被 *0 填充*。

```js
const buf = Buffer.alloc(5);

console.log(buf);
// Prints: <Buffer 00 00 00 00 00>
```

分配一个大小为 `size` 字节的新的 `Buffer`。 If `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, [`ERR_INVALID_OPT_VALUE`] is thrown. A zero-length `Buffer` is created if `size` is 0.

如果指定了 `fill`，则会调用 [`buf.fill(fill)`][`buf.fill()`] 初始化分配的 `Buffer`。

```js
const buf = Buffer.alloc(5, 'a');

console.log(buf);
// Prints: <Buffer 61 61 61 61 61>
```

如果同时指定了 `fill` 和 `encoding`，则会调用 [`buf.fill(fill, encoding)`][`buf.fill()`] 初始化分配的 `Buffer`。

```js
const buf = Buffer.alloc(11, 'aGVsbG8gd29ybGQ=', 'base64');

console.log(buf);
// Prints: <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64>
```

调用 [`Buffer.alloc()`] 会明显得比另一个方法 [`Buffer.allocUnsafe()`] 慢，但是能确保新建 `Buffer` 实例的内容 *不会包含敏感数据*。

如果 `size` 不是一个数值，则会抛出 `TypeError` 错误。

### 类方法：Buffer.allocUnsafe(size)
<!-- YAML
added: v5.10.0
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7079
    description: Passing a negative `size` will now throw an error.
-->

* `size` {integer} 新建 `Buffer` 的所需长度。

分配一个大小为 `size` 字节的新的 `Buffer`。 If `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, [`ERR_INVALID_OPT_VALUE`] is thrown. A zero-length `Buffer` is created if `size` is 0.

以这种方法创建的 `Buffer` 实例的底层内存是 *未初始化的*。 新建 `Buffer` 的内容是未知的，并且 *可能包含敏感数据*。 Use [`Buffer.alloc()`] instead to initialize `Buffer` instances with zeroes.

```js
const buf = Buffer.allocUnsafe(10);

console.log(buf);
// Prints: (contents may vary): <Buffer a0 8b 28 3f 01 00 00 00 50 32>

buf.fill(0);

console.log(buf);
// Prints: <Buffer 00 00 00 00 00 00 00 00 00 00>
```

如果 `size` 不是一个数值，则会抛出 `TypeError` 错误。

请注意，`Buffer` 模块会预分配一个大小为 [`Buffer.poolSize`] 的内部 `Buffer` 实例作为快速分配池， 用于 [`Buffer.allocUnsafe()`] 新创建的 `Buffer` 实例，或者当 `size` 小于或等于 `Buffer.poolSize >> 1`（[`Buffer.poolSize`]除以2后的最大整数值）时，用废弃的 `new Buffer(size)` 构造器新创建的 <0>Buffer</0> 实例。

对这个预分配的内部内存池的使用，是调用 `Buffer.alloc(size, fill)` 与 `Buffer.allocUnsafe(size).fill(fill)` 的关键区别。 Specifically, `Buffer.alloc(size, fill)` will *never* use the internal `Buffer` pool, while `Buffer.allocUnsafe(size).fill(fill)` *will* use the internal `Buffer` pool if `size` is less than or equal to half [`Buffer.poolSize`]. 当应用程序需要 [`Buffer.allocUnsafe()`] 提供的额外的性能时，这个细微的区别是非常重要的。

### 类方法：Buffer.allocUnsafeSlow(size)
<!-- YAML
added: v5.12.0
-->

* `size` {integer} 新建 `Buffer` 的所需长度。

分配一个大小为 `size` 字节的新的 `Buffer`。 If `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, [`ERR_INVALID_OPT_VALUE`] is thrown. A zero-length `Buffer` is created if `size` is 0.

以这种方法创建的 `Buffer` 实例的底层内存是 *未初始化的*。 新建 `Buffer` 的内容是未知的，并且 *可能包含敏感数据*。 Use [`buf.fill(0)`][`buf.fill()`] to initialize such `Buffer` instances with zeroes.

When using [`Buffer.allocUnsafe()`] to allocate new `Buffer` instances, allocations under 4KB are sliced from a single pre-allocated `Buffer`. This allows applications to avoid the garbage collection overhead of creating many individually allocated `Buffer` instances. This approach improves both performance and memory usage by eliminating the need to track and clean up as many persistent objects.

However, in the case where a developer may need to retain a small chunk of memory from a pool for an indeterminate amount of time, it may be appropriate to create an un-pooled `Buffer` instance using `Buffer.allocUnsafeSlow()` and then copying out the relevant bits.

```js
// Need to keep around a few small chunks of memory
const store = [];

socket.on('readable', () => {
  let data;
  while (null !== (data = readable.read())) {
    // Allocate for retained data
    const sb = Buffer.allocUnsafeSlow(10);

    // Copy the data into the new allocation
    data.copy(sb, 0, 0, 10);

    store.push(sb);
  }
});
```

`Buffer.allocUnsafeSlow()` should be used only as a last resort after a developer has observed undue memory retention in their applications.

如果 `size` 不是一个数值，则会抛出 `TypeError` 错误。

### 类方法：Buffer.byteLength(string[, encoding])
<!-- YAML
added: v0.1.90
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8946
    description: Passing invalid input will now throw an error.
  - version: v5.10.0
    pr-url: https://github.com/nodejs/node/pull/5255
    description: The `string` parameter can now be any `TypedArray`, `DataView`
                 or `ArrayBuffer`.
-->

* `string` {string|Buffer|TypedArray|DataView|ArrayBuffer|SharedArrayBuffer} 一个计算长度的值。
* `encoding` {string} 如果 `string` 是字符串，则该值是它的编码方式。 **默认值:**`‘utf8'`。
* 返回：{integer} `string` 包含的字节数。

返回一个字符串的实际字节长度。 这与 [`String.prototype.length`] 不同，因为 [<0>String.prototype.length</0>] 返回的是字符串中的 *字符* 数。

For `'base64'` and `'hex'`, this function assumes valid input. For strings that contain non-Base64/Hex-encoded data (e.g. whitespace), the return value might be greater than the length of a `Buffer` created from the string.

```js
const str = '\u00bd + \u00bc = \u00be';

console.log(`${str}: ${str.length} characters, ` +
            `${Buffer.byteLength(str, 'utf8')} bytes`);
// Prints: ½ + ¼ = ¾: 9 characters, 12 bytes
```

当 `string` 是一个 `Buffer`/[`DataView`]/[`TypedArray`]/[`ArrayBuffer`]/ [`SharedArrayBuffer`] 时，返回实际的字节长度。

### 类方法：Buffer.compare(buf1, buf2)
<!-- YAML
added: v0.11.13
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The arguments can now be `Uint8Array`s.
-->

* `buf1` {Buffer|Uint8Array}
* `buf2` {Buffer|Uint8Array}
* 返回：{integer}

比较 `buf1` 和 `buf2`，通常用于 `Buffer` 实例中数组的排序。 这就相当于调用 [`buf1.compare(buf2)`][`buf.compare()`]。

```js
const buf1 = Buffer.from('1234');
const buf2 = Buffer.from('0123');
const arr = [buf1, buf2];

console.log(arr.sort(Buffer.compare));
// Prints: [ <Buffer 30 31 32 33>, <Buffer 31 32 33 34> ]
// (This result is equal to: [buf2, buf1])
```

### 类方法：Buffer.concat(list[, totalLength])
<!-- YAML
added: v0.7.11
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The elements of `list` can now be `Uint8Array`s.
-->

* `list` {Buffer[] | Uint8Array[]} List of `Buffer` or [`Uint8Array`] instances to concat.
* `totalLength` {integer} 合并时 `list` 中 `Buffer` 实例的总长度。
* 返回：{Buffer}

返回一个合并了 `list` 中所有 `Buffer` 实例的新建 `Buffer` 。

如果列表中没有项目，或者 `totalLength` 为 0，则返回一个新建的长度为 0 的 `Buffer`。

如果没有提供 `totalLength`，则从 `list` 中的 `Buffer` 实例计算得到。 但是为了计算 `totalLength`，会导致需要执行额外的循环，所以以显式方式提供已知长度会运行得更快。

如果提供了 `totalLength`，则会将其强制转换为无符号整数。 如果 `列表` 中的所有 `Buffer` 长度之和超过 `totalLength`，则结果会被截取为 `totalLength`。

```js
// Create a single `Buffer` from a list of three `Buffer` instances.

const buf1 = Buffer.alloc(10);
const buf2 = Buffer.alloc(14);
const buf3 = Buffer.alloc(18);
const totalLength = buf1.length + buf2.length + buf3.length;

console.log(totalLength);
// Prints: 42

const bufA = Buffer.concat([buf1, buf2, buf3], totalLength);

console.log(bufA);
// Prints: <Buffer 00 00 00 00 ...>
console.log(bufA.length);
// Prints: 42
```

### 类方法：Buffer.from(array)
<!-- YAML
added: v5.10.0
-->

* `array` {integer[]}

使用 8 字节的 `array` 分配一个新的 `Buffer`。

```js
// Creates a new Buffer containing UTF-8 bytes of the string 'buffer'
const buf = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
```

如果 `array` 不是一个`Array`，则会抛出 `TypeError` 错误。

### 类方法：Buffer.from(arrayBuffer[, byteOffset[, length]])
<!-- YAML
added: v5.10.0
-->

* `arrayBuffer` {ArrayBuffer|SharedArrayBuffer} [`ArrayBuffer`]，[`SharedArrayBuffer`] 或 [`TypedArray`] 的 `.buffer` 属性。
* `byteOffset` {integer} 要暴露的第一个字节的索引。 **默认值：** `0`。
* `length` {integer} 要暴露的字节数。 **默认值：** `arrayBuffer.length - byteOffset`。

该方法将创建 [`ArrayBuffer`] 的视图，而不会复制底层内存。 例如，当传入一个 [`TypedArray`] 实例的 `.buffer` 属性的引用时，新创建的 `Buffer` 将会和 [`TypedArray`] 共享相同的已分配内存。

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Shares memory with `arr`
const buf = Buffer.from(arr.buffer);

console.log(buf);
// Prints: <Buffer 88 13 a0 0f>

// Changing the original Uint16Array changes the Buffer also
arr[1] = 6000;

console.log(buf);
// Prints: <Buffer 88 13 70 17>
```

可选的 `byteOffset` 和 `length` 参数指定`arrayBuffer` 中将与 `Buffer` 共享的的内存范围。

```js
const ab = new ArrayBuffer(10);
const buf = Buffer.from(ab, 0, 2);

console.log(buf.length);
// Prints: 2
```

如果 `arrayBuffer` 不是 [`ArrayBuffer`] 或 [`SharedArrayBuffer`]， 则抛出 `TypeError` 错误。

### 类方法：Buffer.from(buffer)
<!-- YAML
added: v5.10.0
-->

* `buffer` {Buffer|Uint8Array} 一个要被复制数据的 `Buffer` 或 [`Uint8Array`]。

将传入 `buffer` 的数据复制到新的 `Buffer` 实例。

```js
const buf1 = Buffer.from('buffer');
const buf2 = Buffer.from(buf1);

buf1[0] = 0x61;

console.log(buf1.toString());
// Prints: auffer
console.log(buf2.toString());
// Prints: buffer
```

如果 `buffer` 不是一个 `Buffer`， 则会抛出 `TypeError` 错误。

### 类方法：Buffer.from(object[, offsetOrEncoding[, length]])
<!-- YAML
added: v8.2.0
-->

* `object` {Object} 一个支持 `Symbol.toPrimitive` 或 `valueOf()` 的对象。
* `offsetOrEncoding` {number|string} 字节偏移量或编码，取决于 `object.valueOf()` 或 `object[Symbol.toPrimitive]()` 的返回值。
* `length` {number} 长度值，取决于 `object.valueOf()` 或 `object[Symbol.toPrimitive]()` 的返回值。

对那些其 `valueOf()` 方法返回值如果不严格等于 `object` 的对象，返回 `Buffer.from(object.valueOf(), offsetOrEncoding, length)`。

```js
const buf = Buffer.from(new String('this is a test'));
// Prints: <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

对那些支持 `Symbol.toPrimitive` 的对象，返回 `Buffer.from(object[Symbol.toPrimitive](), offsetOrEncoding, length)`。

```js
class Foo {
  [Symbol.toPrimitive]() {
    return 'this is a test';
  }
}

const buf = Buffer.from(new Foo(), 'utf8');
// Prints: <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

### 类方法：Buffer.from(string[, encoding])
<!-- YAML
added: v5.10.0
-->

* `string` {string} 要编码的字符串。
* `encoding` {string} `string` 的编码。 **默认值:**`‘utf8'`。

创建一个包含 `string` 的 `Buffer`。 `encoding` 参数指定 `string` 的字符串编码方式。

```js
const buf1 = Buffer.from('this is a tést');
const buf2 = Buffer.from('7468697320697320612074c3a97374', 'hex');

console.log(buf1.toString());
// Prints: this is a tést
console.log(buf2.toString());
// Prints: this is a tést
console.log(buf1.toString('ascii'));
// Prints: this is a tC)st
```

如果 `string` 不是一个字符串，则会抛出 `TypeError` 错误。

### 类方法：Buffer.isBuffer(obj)
<!-- YAML
added: v0.1.101
-->

* `obj` {Object}
* 返回：{boolean}

如果 `obj` 是一个 `Buffer`，则返回 `true`，否则返回 `false`。

### 类方法：Buffer.isEncoding(encoding)
<!-- YAML
added: v0.9.1
-->

* `encoding` {string} 一个要检查的字符编码名称。
* 返回：{boolean}

如果 `encoding` 包含一个支持的字符编码则返回 `true`，否则返回 `false`。

### 类属性：Buffer.poolSize
<!-- YAML
added: v0.11.3
-->

* {integer} **默认值：** `8192`

This is the size (in bytes) of pre-allocated internal `Buffer` instances used for pooling. 这个值可以修改。

### buf[index]
<!-- YAML
type: property
name: [index]
-->

索引操作符 `[index]` 可用于获取或设置 `buf` 中指定 `index` 位置的八位字节。 这个值指向的是单个字节，所以合法的值范围是从 `0x00` 到 `0xFF` （十六进制），或者从 `0` 到 `255` （十进制）。

该操作符继承自 `Uint8Array`，所以它对越界访问的处理与 `UInt8Array` 相同，也就是说，取值时返回 `undefined`， 赋值时什么也不做。

```js
// Copy an ASCII string into a `Buffer` one byte at a time.

const str = 'Node.js';
const buf = Buffer.allocUnsafe(str.length);

for (let i = 0; i < str.length; i++) {
  buf[i] = str.charCodeAt(i);
}

console.log(buf.toString('ascii'));
// Prints: Node.js
```

### buf.buffer

* {ArrayBuffer} 底层的 `ArrayBuffer` 对象，基于该对象创建此 `Buffer` 对象。

```js
const arrayBuffer = new ArrayBuffer(16);
const buffer = Buffer.from(arrayBuffer);

console.log(buffer.buffer === arrayBuffer);
// Prints: true
```

### buf.byteOffset

* {integer} The `byteOffset` on the underlying `ArrayBuffer` object based on which this `Buffer` object is created.

When setting `byteOffset` in `Buffer.from(ArrayBuffer, byteOffset, length)` or sometimes when allocating a buffer smaller than `Buffer.poolSize` the buffer doesn't start from a zero offset on the underlying `ArrayBuffer`.

This can cause problems when accessing the underlying `ArrayBuffer` directly using `buf.buffer`, as the first bytes in this `ArrayBuffer` may be unrelated to the `buf` object itself.

A common issue is when casting a `Buffer` object to a `TypedArray` object, in this case one needs to specify the `byteOffset` correctly:

```js
// Create a buffer smaller than `Buffer.poolSize`.
const nodeBuffer = new Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

// When casting the Node.js Buffer to an Int8 TypedArray remember to use the
// byteOffset.
new Int8Array(nodeBuffer.buffer, nodeBuffer.byteOffset, nodeBuffer.length);
```

### buf.compare(target[, targetStart[, targetEnd[, sourceStart[, sourceEnd]]]])
<!-- YAML
added: v0.11.13
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `target` parameter can now be a `Uint8Array`.
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5880
    description: Additional parameters for specifying offsets are supported now.
-->

* `target` {Buffer|Uint8Array} A `Buffer` or [`Uint8Array`] with which to compare `buf`.
* `targetStart` {integer} `target` 中开始对比的偏移量。 **默认值：** `0`。
* `targetEnd` {integer} `target` 中结束对比的偏移量（不包含此偏移位）。 **默认值：** `target.length`.
* `sourceStart` {integer} `buf` 中开始对比的偏移量。 **默认值：** `0`。
* `sourceEnd` {integer} `buf` 中结束对比的偏移量（不包含此偏移位）。 **默认值：** [`buf.length`].
* 返回：{integer}

比较 `buf` 和 `target`，返回表明 `buf` 排序上是否排在 `target` 之前，之后，或相同的数值。 对比是基于各自 `Buffer` 中实际的字节序列。

* 如果 `target` 与 `buf` 相同，则返回 `0`
* 在排序时，如果 `target` 应当排在 `buf` *前面*，则返回 `1`。
* 在排序时，如果 `target` 应当排在 `buf` *后面*，则返回 `-1`。

```js
const buf1 = Buffer.from('ABC');
const buf2 = Buffer.from('BCD');
const buf3 = Buffer.from('ABCD');

console.log(buf1.compare(buf1));
// Prints: 0
console.log(buf1.compare(buf2));
// Prints: -1
console.log(buf1.compare(buf3));
// Prints: -1
console.log(buf2.compare(buf1));
// Prints: 1
console.log(buf2.compare(buf3));
// Prints: 1
console.log([buf1, buf2, buf3].sort(Buffer.compare));
// Prints: [ <Buffer 41 42 43>, <Buffer 41 42 43 44>, <Buffer 42 43 44> ]
// (This result is equal to: [buf1, buf3, buf2])
```

可选的 `targetStart`，`targetEnd`，`sourceStart` 和 `sourceEnd` 参数可分别用于在 `target` 和 `buf` 中将对比限制在指定的范围内。

```js
const buf1 = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);
const buf2 = Buffer.from([5, 6, 7, 8, 9, 1, 2, 3, 4]);

console.log(buf1.compare(buf2, 5, 9, 0, 4));
// Prints: 0
console.log(buf1.compare(buf2, 0, 6, 4));
// Prints: -1
console.log(buf1.compare(buf2, 5, 6, 5));
// Prints: 1
```

[`ERR_INDEX_OUT_OF_RANGE`] is thrown if `targetStart < 0`, `sourceStart < 0`, `targetEnd > target.byteLength`, or `sourceEnd > source.byteLength`.

### buf.copy(target[, targetStart[, sourceStart[, sourceEnd]]])
<!-- YAML
added: v0.1.90
-->

* `target` {Buffer|Uint8Array} 要复制进的 `Buffer` 或 [`Uint8Array`]。
* `targetStart` {integer} The offset within `target` at which to begin writing. **默认值：** `0`。
* `sourceStart` {integer} The offset within `buf` from which to begin copying. **默认值：** `0`。
* `sourceEnd` {integer} `buf` 中结束复制的偏移量（不包含自身）。 **默认值：** [`buf.length`].
* 返回：{integer} 被复制的字节数。

复制 `buf` 的一个区域的数据到 `target` 的一个区域，即使 `target` 的内存区域与 `buf` 的内存区域有重叠。

```js
// Create two `Buffer` instances.
const buf1 = Buffer.allocUnsafe(26);
const buf2 = Buffer.allocUnsafe(26).fill('!');

for (let i = 0; i < 26; i++) {
  // 97 is the decimal ASCII value for 'a'
  buf1[i] = i + 97;
}

// Copy `buf1` bytes 16 through 19 into `buf2` starting at byte 8 of `buf2`
buf1.copy(buf2, 8, 16, 20);

console.log(buf2.toString('ascii', 0, 25));
// Prints: !!!!!!!!qrst!!!!!!!!!!!!!
```

```js
// Create a `Buffer` and copy data from one region to an overlapping region
// within the same `Buffer`.

const buf = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 is the decimal ASCII value for 'a'
  buf[i] = i + 97;
}

buf.copy(buf, 0, 4, 10);

console.log(buf.toString());
// Prints: efghijghijklmnopqrstuvwxyz
```

### buf.entries()
<!-- YAML
added: v1.1.0
-->

* 返回：{Iterator}

从 `buf` 的内容中，创建并返回一个 `[index, byte]` 对形式的 [迭代器](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)。

```js
// Log the entire contents of a `Buffer`.

const buf = Buffer.from('buffer');

for (const pair of buf.entries()) {
  console.log(pair);
}
// Prints:
//   [0, 98]
//   [1, 117]
//   [2, 102]
//   [3, 102]
//   [4, 101]
//   [5, 114]
```

### buf.equals(otherBuffer)
<!-- YAML
added: v0.11.13
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The arguments can now be `Uint8Array`s.
-->

* `otherBuffer` {Buffer} A `Buffer` or [`Uint8Array`] with which to compare `buf`.
* 返回：{boolean}

如果 `buf` 和 `otherBuffer` 具有完全相同的字节，则返回 `true`，否则返回 `false`。

```js
const buf1 = Buffer.from('ABC');
const buf2 = Buffer.from('414243', 'hex');
const buf3 = Buffer.from('ABCD');

console.log(buf1.equals(buf2));
// Prints: true
console.log(buf1.equals(buf3));
// Prints: false
```

### buf.fill(value\[, offset[, end]\]\[, encoding\])
<!-- YAML
added: v0.5.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18790
    description: Negative `end` values throw an `ERR_INDEX_OUT_OF_RANGE` error.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18129
    description: Attempting to fill a non-zero length buffer with a zero length
                 buffer triggers a thrown exception.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17427
    description: Specifying an invalid string for `value` triggers a thrown
                 exception.
  - version: v5.7.0
    pr-url: https://github.com/nodejs/node/pull/4935
    description: The `encoding` parameter is supported now.
-->

* `value` {string|Buffer|integer} The value with which to fill `buf`.
* `offset` {integer} 开始填充 `buf` 前要跳过的字节数。 **默认值：** `0`。
* `end` {integer} 结束填充 `buf` 的位置（不包含自身）。 **Default:** [`buf.length`].
* `encoding` {string} The encoding for `value` if `value` is a string. **默认值:**`‘utf8'`。
* 返回：{Buffer} `buf` 的引用。

用指定的 `value` 填充 `buf`。 If the `offset` and `end` are not given, the entire `buf` will be filled:

```js
// Fill a `Buffer` with the ASCII character 'h'.

const b = Buffer.allocUnsafe(50).fill('h');

console.log(b.toString());
// Prints: hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
```

`value` is coerced to a `uint32` value if it is not a string, `Buffer`, or integer. If the resulting integer is greater than `255` (decimal), `buf` will be filled with `value & 255`.

If the final write of a `fill()` operation falls on a multi-byte character, then only the bytes of that character that fit into `buf` are written:

```js
// Fill a `Buffer` with a two-byte character.

console.log(Buffer.allocUnsafe(3).fill('\u0222'));
// Prints: <Buffer c8 a2 c8>
```

If `value` contains invalid characters, it is truncated; if no valid fill data remains, an exception is thrown:

```js
const buf = Buffer.allocUnsafe(5);

console.log(buf.fill('a'));
// Prints: <Buffer 61 61 61 61 61>
console.log(buf.fill('aazz', 'hex'));
// Prints: <Buffer aa aa aa aa aa>
console.log(buf.fill('zz', 'hex'));
// Throws an exception.
```

### buf.includes(value\[, byteOffset\]\[, encoding\])
<!-- YAML
added: v5.3.0
-->

* `value` {string|Buffer|integer} 要搜索的值。
* `byteOffset` {integer} `buf` 中开始搜索的位置。 **默认值：** `0`。
* `encoding` {string} 如果 `value` 是一个字符串，则这是它的编码。 **默认值:**`‘utf8'`。
* 返回：{boolean} 如果在 `buf` 中找到 `value`， 则返回 `true`，否则返回 `false`。

相当于 [`buf.indexOf() !== -1`][`buf.indexOf()`]。

```js
const buf = Buffer.from('this is a buffer');

console.log(buf.includes('this'));
// Prints: true
console.log(buf.includes('is'));
// Prints: true
console.log(buf.includes(Buffer.from('a buffer')));
// Prints: true
console.log(buf.includes(97));
// Prints: true (97 is the decimal ASCII value for 'a')
console.log(buf.includes(Buffer.from('a buffer example')));
// Prints: false
console.log(buf.includes(Buffer.from('a buffer example').slice(0, 8)));
// Prints: true
console.log(buf.includes('this', 4));
// Prints: false
```

### buf.indexOf(value\[, byteOffset\]\[, encoding\])
<!-- YAML
added: v1.5.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `value` can now be a `Uint8Array`.
  - version: v5.7.0, v4.4.0
    pr-url: https://github.com/nodejs/node/pull/4803
    description: When `encoding` is being passed, the `byteOffset` parameter
                 is no longer required.
-->

* `value` {string|Buffer|Uint8Array|integer} 要搜索的值。
* `byteOffset` {integer} `buf` 中开始搜索的位置。 **默认值：** `0`。
* `encoding` {string} 如果 `value` 是一个字符串，这是用于确定将在 `buf` 中搜索的字符串的二进制表示的编码。 **默认值:**`‘utf8'`。
* 返回：{integer} 在 `buf` 中 `value` 首次出现的索引，或者，如果 `buf` 不包含 `value`，则返回 `-1`。

如果 `value` 是：

  * 一个字符串，则根据由 `encoding` 指定的字符编码对 `value` 进行解析。
  * 一个 `Buffer` 或 [`Uint8Array`]， `value` 会被作为一个整体使用。 如果要比较部分 `Buffer`，请使用 [`buf.slice()`]。
  * 一个数字，`value` 会解析为一个介于 `0` 到 `255` 之间的无符号八位整数值。

```js
const buf = Buffer.from('this is a buffer');

console.log(buf.indexOf('this'));
// Prints: 0
console.log(buf.indexOf('is'));
// Prints: 2
console.log(buf.indexOf(Buffer.from('a buffer')));
// Prints: 8
console.log(buf.indexOf(97));
// Prints: 8 (97 is the decimal ASCII value for 'a')
console.log(buf.indexOf(Buffer.from('a buffer example')));
// Prints: -1
console.log(buf.indexOf(Buffer.from('a buffer example').slice(0, 8)));
// Prints: 8

const utf16Buffer = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'utf16le');

console.log(utf16Buffer.indexOf('\u03a3', 0, 'utf16le'));
// Prints: 4
console.log(utf16Buffer.indexOf('\u03a3', -4, 'utf16le'));
// Prints: 6
```

如果 `value` 不是一个字符串，数字，或 `Buffer`，该方法会抛出一个 `TypeError` 错误。 如果 `value` 是一个数字， 它将会被强制转换成一个有效的 byte 值，该整数值介于0到255之间。

如果 `byteOffset` 不是一个数字，它将会被强制转换成一个数字。 If the result of coercion is `NaN` or `0`, then the entire buffer will be searched. This behavior matches [`String#indexOf()`].

```js
const b = Buffer.from('abcdef');

// Passing a value that's a number, but not a valid byte
// Prints: 2, equivalent to searching for 99 or 'c'
console.log(b.indexOf(99.9));
console.log(b.indexOf(256 + 99));

// Passing a byteOffset that coerces to NaN or 0
// Prints: 1, searching the whole buffer
console.log(b.indexOf('b', undefined));
console.log(b.indexOf('b', {}));
console.log(b.indexOf('b', null));
console.log(b.indexOf('b', []));
```

如果 `value` 是一个空字符串或空 `Buffer`， 并且 `byteOffset` 小于 `buf.length`，则返回 `byteOffset` 。 如果 `value` 是空的，并且 `byteOffset` 大于等于 `buf.length`，则返回 `buf.length`。

### buf.keys()
<!-- YAML
added: v1.1.0
-->

* 返回：{Iterator}

创建并返回一个包含 `buf` 键（索引）的 [迭代器](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)。

```js
const buf = Buffer.from('buffer');

for (const key of buf.keys()) {
  console.log(key);
}
// Prints:
//   0
//   1
//   2
//   3
//   4
//   5
```

### buf.lastIndexOf(value\[, byteOffset\]\[, encoding\])
<!-- YAML
added: v6.0.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `value` can now be a `Uint8Array`.
-->

* `value` {string|Buffer|Uint8Array|integer} 要搜索的值。
* `byteOffset` {integer} `buf` 中开始搜索的位置。 **默认值：** [`buf.length`]`- 1`。
* `encoding` {string} 如果 `value` 是一个字符串，这是用于确定将在 `buf` 中搜索的字符串的二进制表示的编码。 **默认值:**`‘utf8'`。
* 返回：{integer} 在 `buf` 中 `value` 最后一次出现的索引，或者，如果 `buf` 不包含 `value`，则返回 `-1`。

与 [`buf.indexOf()`] 相同，除了是最后一次而不是第一次出现的`value`之外。

```js
const buf = Buffer.from('this buffer is a buffer');

console.log(buf.lastIndexOf('this'));
// Prints: 0
console.log(buf.lastIndexOf('buffer'));
// Prints: 17
console.log(buf.lastIndexOf(Buffer.from('buffer')));
// Prints: 17
console.log(buf.lastIndexOf(97));
// Prints: 15 (97 is the decimal ASCII value for 'a')
console.log(buf.lastIndexOf(Buffer.from('yolo')));
// Prints: -1
console.log(buf.lastIndexOf('buffer', 5));
// Prints: 5
console.log(buf.lastIndexOf('buffer', 4));
// Prints: -1

const utf16Buffer = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'utf16le');

console.log(utf16Buffer.lastIndexOf('\u03a3', undefined, 'utf16le'));
// Prints: 6
console.log(utf16Buffer.lastIndexOf('\u03a3', -5, 'utf16le'));
// Prints: 4
```

如果 `value` 不是一个字符串，数字，或 `Buffer`，该方法会抛出一个 `TypeError` 错误。 如果 `value` 是一个数字， 它将会被强制转换成一个有效的 byte 值，该整数值介于0到255之间。

如果 `byteOffset` 不是一个数字，它将会被强制转换成一个数字。 如果参数被强制转换后得到 `NaN`，例如 `{}` 或 `undefined`，那么将会搜索整个buffer。 该行为和 [`String#lastIndexOf()`] 一致。

```js
const b = Buffer.from('abcdef');

// Passing a value that's a number, but not a valid byte
// Prints: 2, equivalent to searching for 99 or 'c'
console.log(b.lastIndexOf(99.9));
console.log(b.lastIndexOf(256 + 99));

// Passing a byteOffset that coerces to NaN
// Prints: 1, searching the whole buffer
console.log(b.lastIndexOf('b', undefined));
console.log(b.lastIndexOf('b', {}));

// Passing a byteOffset that coerces to 0
// Prints: -1, equivalent to passing 0
console.log(b.lastIndexOf('b', null));
console.log(b.lastIndexOf('b', []));
```

如果 `value` 是一个空字符串或空 `Buffer`，那么返回 `byteOffset`。

### buf.length
<!-- YAML
added: v0.1.90
-->

* {integer}

返回为 `buf` 分配的内存量（以字节为单位）。 注意，这并不一定反映 `buf` 中可用的数据量。

```js
// Create a `Buffer` and write a shorter ASCII string to it.

const buf = Buffer.alloc(1234);

console.log(buf.length);
// Prints: 1234

buf.write('some string', 0, 'ascii');

console.log(buf.length);
// Prints: 1234
```

虽然 `length` 属性不是不可变的，但是更改 `length` 的值可能会导致未定义和不一致的行为。 因此那些希望更改 `Buffer` 长度的应用程序应当将 `length` 视为只读的参数，并且使用 [`buf.slice()`] 创建一个新的 `Buffer`。

```js
let buf = Buffer.allocUnsafe(10);

buf.write('abcdefghj', 0, 'ascii');

console.log(buf.length);
// Prints: 10

buf = buf.slice(0, 5);

console.log(buf.length);
// Prints: 5
```

### buf.parent
<!-- YAML
deprecated: v8.0.0
-->

> 稳定性：0 - 已弃用：改为使用 [`buf.buffer`]。

`buf.parent` 属性是 `buf.buffer` 已弃用的别名。

### buf.readDoubleBE(offset)
### buf.readDoubleLE(offset)
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} 开始读取之前要跳过的字节数。 Must satisfy `0 <= offset <= buf.length - 8`.
* 返回：{number}

使用指定的字节序格式从 `buf` 中指定的 `offset` 地址读取一个64位双精度浮点数（`readDoubleBE()` 返回大端格式，`readDoubleLE()` 返回小端格式）。

```js
const buf = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]);

console.log(buf.readDoubleBE(0));
// Prints: 8.20788039913184e-304
console.log(buf.readDoubleLE(0));
// Prints: 5.447603722011605e-270
console.log(buf.readDoubleLE(1));
// Throws ERR_OUT_OF_RANGE
```

### buf.readFloatBE(offset)
### buf.readFloatLE(offset)
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} 开始读取之前要跳过的字节数。 Must satisfy `0 <= offset <= buf.length - 4`.
* 返回：{number}

使用指定的字节序格式从 `buf` 中指定的 `offset` 读取一个32位单精度浮点数（`readFloatBE()` 返回大端格式，`readFloatLE()` 返回小端格式）。

```js
const buf = Buffer.from([1, 2, 3, 4]);

console.log(buf.readFloatBE(0));
// Prints: 2.387939260590663e-38
console.log(buf.readFloatLE(0));
// Prints: 1.539989614439558e-36
console.log(buf.readFloatLE(1));
// Throws ERR_OUT_OF_RANGE
```

### buf.readInt8(offset)
<!-- YAML
added: v0.5.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} 开始读取之前要跳过的字节数。 Must satisfy `0 <= offset <= buf.length - 1`.
* 返回：{integer}

从 `buf` 中指定的 `offset` 读取一个有符号8位整型数。

从 `Buffer` 中读取的整型数被解析为二进制有符号补码数。

```js
const buf = Buffer.from([-1, 5]);

console.log(buf.readInt8(0));
// Prints: -1
console.log(buf.readInt8(1));
// Prints: 5
console.log(buf.readInt8(2));
// Throws ERR_OUT_OF_RANGE
```

### buf.readInt16BE(offset)
### buf.readInt16LE(offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} 开始读取之前要跳过的字节数。 Must satisfy `0 <= offset <= buf.length - 2`.
* 返回：{integer}

使用指定的字节序格式从 `buf` 中指定的 `offset` 地址读取一个有符号16位整型数（`readInt16BE()` 返回大端格式，`readInt16LE()` 返回小端格式）。

从 `Buffer` 中读取的整型数被解析为二进制有符号补码数。

```js
const buf = Buffer.from([0, 5]);

console.log(buf.readInt16BE(0));
// Prints: 5
console.log(buf.readInt16LE(0));
// Prints: 1280
console.log(buf.readInt16LE(1));
// Throws ERR_OUT_OF_RANGE
```

### buf.readInt32BE(offset)
### buf.readInt32LE(offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} 开始读取之前要跳过的字节数。 Must satisfy `0 <= offset <= buf.length - 4`.
* 返回：{integer}

使用指定的字节序格式从 `buf` 中指定的 `offset` 偏移量读取一个有符号32位整形数（`readInt32BE()` 返回大端格式，`readInt32LE()` 返回小端格式）。

从 `Buffer` 中读取的整型数被解析为二进制有符号补码数。

```js
const buf = Buffer.from([0, 0, 0, 5]);

console.log(buf.readInt32BE(0));
// Prints: 5
console.log(buf.readInt32LE(0));
// Prints: 83886080
console.log(buf.readInt32LE(1));
// Throws ERR_OUT_OF_RANGE
```

### buf.readIntBE(offset, byteLength)
### buf.readIntLE(offset, byteLength)
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 and `byteLength` to `uint32` anymore.
-->

* `offset` {integer} 开始读取之前要跳过的字节数。 Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} 要读取的字节数。 Must satisfy `0 < byteLength <= 6`.
* 返回：{integer}

从 `buf` 中指定的 `offset` 偏移量读取 `byteLength` 字节，并且读取的结果被解析为二进制有符号补码数。 最大支持48位精度。

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab]);

console.log(buf.readIntLE(0, 6).toString(16));
// Prints: -546f87a9cbee
console.log(buf.readIntBE(0, 6).toString(16));
// Prints: 1234567890ab
console.log(buf.readIntBE(1, 6).toString(16));
// Throws ERR_INDEX_OUT_OF_RANGE
console.log(buf.readIntBE(1, 0).toString(16));
// Throws ERR_OUT_OF_RANGE
```

### buf.readUInt8(offset)
<!-- YAML
added: v0.5.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} 开始读取之前要跳过的字节数。 Must satisfy `0 <= offset <= buf.length - 1`.
* 返回：{integer}

从 `buf` 中指定的 `offset` 偏移量读取一个无符号8位整型数。

```js
const buf = Buffer.from([1, -2]);

console.log(buf.readUInt8(0));
// Prints: 1
console.log(buf.readUInt8(1));
// Prints: 254
console.log(buf.readUInt8(2));
// Throws ERR_OUT_OF_RANGE
```

### buf.readUInt16BE(offset)
### buf.readUInt16LE(offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} 开始读取之前要跳过的字节数。 Must satisfy `0 <= offset <= buf.length - 2`.
* 返回：{integer}

Reads an unsigned 16-bit integer from `buf` at the specified `offset` with specified endian format (`readUInt16BE()` returns big endian, `readUInt16LE()` returns little endian).

```js
const buf = Buffer.from([0x12, 0x34, 0x56]);

console.log(buf.readUInt16BE(0).toString(16));
// Prints: 1234
console.log(buf.readUInt16LE(0).toString(16));
// Prints: 3412
console.log(buf.readUInt16BE(1).toString(16));
// Prints: 3456
console.log(buf.readUInt16LE(1).toString(16));
// Prints: 5634
console.log(buf.readUInt16LE(2).toString(16));
// Throws ERR_OUT_OF_RANGE
```

### buf.readUInt32BE(offset)
### buf.readUInt32LE(offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} 开始读取之前要跳过的字节数。 Must satisfy `0 <= offset <= buf.length - 4`.
* 返回：{integer}

使用指定的字节序格式从 `buf` 中指定的 `offset` 地址读取一个无符号32位整形数（`readUInt32BE()` 返回大端格式，`readUInt32LE()` 返回小端格式）。

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78]);

console.log(buf.readUInt32BE(0).toString(16));
// Prints: 12345678
console.log(buf.readUInt32LE(0).toString(16));
// Prints: 78563412
console.log(buf.readUInt32LE(1).toString(16));
// Throws ERR_OUT_OF_RANGE
```

### buf.readUIntBE(offset, byteLength)
### buf.readUIntLE(offset, byteLength)
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 and `byteLength` to `uint32` anymore.
-->

* `offset` {integer} 开始读取之前要跳过的字节数。 Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} 要读取的字节数。 Must satisfy `0 < byteLength <= 6`.
* 返回：{integer}

从 `buf` 中指定的 `offset` 地址读取 `byteLength` 字节，并且读取的结果被解析为无符号整数。 最大支持48位精度。

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab]);

console.log(buf.readUIntBE(0, 6).toString(16));
// Prints: 1234567890ab
console.log(buf.readUIntLE(0, 6).toString(16));
// Prints: ab9078563412
console.log(buf.readUIntBE(1, 6).toString(16));
// Throws ERR_OUT_OF_RANGE
```

### buf.slice([start[, end]])
<!-- YAML
added: v0.3.0
changes:
  - version: v7.1.0, v6.9.2
    pr-url: https://github.com/nodejs/node/pull/9341
    description: Coercing the offsets to integers now handles values outside
                 the 32-bit integer range properly.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/9101
    description: All offsets are now coerced to integers before doing any
                 calculations with them.
-->

* `start` {integer} 新 `Buffer` 的起始位置。 **默认值：** `0`。
* `end` {integer} Where the new `Buffer` will end (not inclusive). **默认值：** [`buf.length`].
* 返回：{Buffer}

Returns a new `Buffer` that references the same memory as the original, but offset and cropped by the `start` and `end` indices.

Specifying `end` greater than [`buf.length`] will return the same result as that of `end` equal to [`buf.length`].

Modifying the new `Buffer` slice will modify the memory in the original `Buffer` because the allocated memory of the two objects overlap.

```js
// Create a `Buffer` with the ASCII alphabet, take a slice, and modify one byte
// from the original `Buffer`.

const buf1 = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 is the decimal ASCII value for 'a'
  buf1[i] = i + 97;
}

const buf2 = buf1.slice(0, 3);

console.log(buf2.toString('ascii', 0, buf2.length));
// Prints: abc

buf1[0] = 33;

console.log(buf2.toString('ascii', 0, buf2.length));
// Prints: !bc
```

Specifying negative indexes causes the slice to be generated relative to the end of `buf` rather than the beginning.

```js
const buf = Buffer.from('buffer');

console.log(buf.slice(-6, -1).toString());
// Prints: buffe
// (Equivalent to buf.slice(0, 5))

console.log(buf.slice(-6, -2).toString());
// Prints: buff
// (Equivalent to buf.slice(0, 4))

console.log(buf.slice(-5, -2).toString());
// Prints: uff
// (Equivalent to buf.slice(1, 4))
```

### buf.swap16()
<!-- YAML
added: v5.10.0
-->

* 返回：{Buffer} `buf` 的引用。

Interprets `buf` as an array of unsigned 16-bit integers and swaps the byte order *in-place*. Throws [`ERR_INVALID_BUFFER_SIZE`] if [`buf.length`] is not a multiple of 2.

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

console.log(buf1);
// Prints: <Buffer 01 02 03 04 05 06 07 08>

buf1.swap16();

console.log(buf1);
// Prints: <Buffer 02 01 04 03 06 05 08 07>

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

buf2.swap16();
// Throws ERR_INVALID_BUFFER_SIZE
```

One convenient use of `buf.swap16()` is to perform a fast in-place conversion between UTF-16 little-endian and UTF-16 big-endian:

```js
const buf = Buffer.from('This is little-endian UTF-16', 'utf16le');
buf.swap16(); // Convert to big-endian UTF-16 text.
```

### buf.swap32()
<!-- YAML
added: v5.10.0
-->

* 返回：{Buffer} `buf` 的引用。

Interprets `buf` as an array of unsigned 32-bit integers and swaps the byte order *in-place*. Throws [`ERR_INVALID_BUFFER_SIZE`] if [`buf.length`] is not a multiple of 4.

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

console.log(buf1);
// Prints: <Buffer 01 02 03 04 05 06 07 08>

buf1.swap32();

console.log(buf1);
// Prints: <Buffer 04 03 02 01 08 07 06 05>

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

buf2.swap32();
// Throws ERR_INVALID_BUFFER_SIZE
```

### buf.swap64()
<!-- YAML
added: v6.3.0
-->

* 返回：{Buffer} `buf` 的引用。

Interprets `buf` as an array of 64-bit numbers and swaps byte order *in-place*. Throws [`ERR_INVALID_BUFFER_SIZE`] if [`buf.length`] is not a multiple of 8.

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

console.log(buf1);
// Prints: <Buffer 01 02 03 04 05 06 07 08>

buf1.swap64();

console.log(buf1);
// Prints: <Buffer 08 07 06 05 04 03 02 01>

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

buf2.swap64();
// Throws ERR_INVALID_BUFFER_SIZE
```

Note that JavaScript cannot encode 64-bit integers. This method is intended for working with 64-bit floats.

### buf.toJSON()
<!-- YAML
added: v0.9.2
-->

* 返回：{Object}

Returns a JSON representation of `buf`. [`JSON.stringify()`] implicitly calls this function when stringifying a `Buffer` instance.

```js
const buf = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5]);
const json = JSON.stringify(buf);

console.log(json);
// Prints: {"type":"Buffer","data":[1,2,3,4,5]}

const copy = JSON.parse(json, (key, value) => {
  return value && value.type === 'Buffer' ?
    Buffer.from(value.data) :
    value;
});

console.log(copy);
// Prints: <Buffer 01 02 03 04 05>
```

### buf.toString([encoding[, start[, end]]])
<!-- YAML
added: v0.1.90
-->

* `encoding` {string} The character encoding to use. **默认值:**`‘utf8'`。
* `start` {integer} The byte offset to start decoding at. **默认值：** `0`。
* `end` {integer} The byte offset to stop decoding at (not inclusive). **默认值：** [`buf.length`].
* 返回：{string}

Decodes `buf` to a string according to the specified character encoding in `encoding`. `start` and `end` may be passed to decode only a subset of `buf`.

The maximum length of a string instance (in UTF-16 code units) is available as [`buffer.constants.MAX_STRING_LENGTH`][].

```js
const buf1 = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 is the decimal ASCII value for 'a'
  buf1[i] = i + 97;
}

console.log(buf1.toString('ascii'));
// Prints: abcdefghijklmnopqrstuvwxyz
console.log(buf1.toString('ascii', 0, 5));
// Prints: abcde

const buf2 = Buffer.from('tést');

console.log(buf2.toString('hex'));
// Prints: 74c3a97374
console.log(buf2.toString('utf8', 0, 3));
// Prints: té
console.log(buf2.toString(undefined, 0, 3));
// Prints: té
```

### buf.values()
<!-- YAML
added: v1.1.0
-->

* 返回：{Iterator}

Creates and returns an [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) for `buf` values (bytes). This function is called automatically when a `Buffer` is used in a `for..of` statement.

```js
const buf = Buffer.from('buffer');

for (const value of buf.values()) {
  console.log(value);
}
// Prints:
//   98
//   117
//   102
//   102
//   101
//   114

for (const value of buf) {
  console.log(value);
}
// Prints:
//   98
//   117
//   102
//   102
//   101
//   114
```

### buf.write(string\[, offset[, length]\]\[, encoding\])
<!-- YAML
added: v0.1.90
-->

* `string` {string} String to write to `buf`.
* `offset` {integer} Number of bytes to skip before starting to write `string`. **默认值：** `0`。
* `length` {integer} Number of bytes to write. **Default:** `buf.length - offset`.
* `encoding` {string} The character encoding of `string`. **默认值:**`‘utf8'`。
* Returns: {integer} Number of bytes written.

Writes `string` to `buf` at `offset` according to the character encoding in `encoding`. The `length` parameter is the number of bytes to write. If `buf` did not contain enough space to fit the entire string, only part of `string` will be written. However, partially encoded characters will not be written.

```js
const buf = Buffer.alloc(256);

const len = buf.write('\u00bd + \u00bc = \u00be', 0);

console.log(`${len} bytes: ${buf.toString('utf8', 0, len)}`);
// Prints: 12 bytes: ½ + ¼ = ¾
```

### buf.writeDoubleBE(value, offset)
### buf.writeDoubleLE(value, offset)
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {number} Number to be written to `buf`.
* `offset` {integer} Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - 8`.
* Returns: {integer} `offset` plus the number of bytes written.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeDoubleBE()` writes big endian, `writeDoubleLE()` writes little endian). `value` *should* be a valid 64-bit double. Behavior is undefined when `value` is anything other than a 64-bit double.

```js
const buf = Buffer.allocUnsafe(8);

buf.writeDoubleBE(123.456, 0);

console.log(buf);
// Prints: <Buffer 40 5e dd 2f 1a 9f be 77>

buf.writeDoubleLE(123.456, 0);

console.log(buf);
// Prints: <Buffer 77 be 9f 1a 2f dd 5e 40>
```

### buf.writeFloatBE(value, offset)
### buf.writeFloatLE(value, offset)
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {number} Number to be written to `buf`.
* `offset` {integer} Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - 4`.
* Returns: {integer} `offset` plus the number of bytes written.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeFloatBE()` writes big endian, `writeFloatLE()` writes little endian). `value` *should* be a valid 32-bit float. Behavior is undefined when `value` is anything other than a 32-bit float.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeFloatBE(0xcafebabe, 0);

console.log(buf);
// Prints: <Buffer 4f 4a fe bb>

buf.writeFloatLE(0xcafebabe, 0);

console.log(buf);
// Prints: <Buffer bb fe 4a 4f>
```

### buf.writeInt8(value, offset)
<!-- YAML
added: v0.5.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Number to be written to `buf`.
* `offset` {integer} Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - 1`.
* Returns: {integer} `offset` plus the number of bytes written.

Writes `value` to `buf` at the specified `offset`. `value` *should* be a valid signed 8-bit integer. Behavior is undefined when `value` is anything other than a signed 8-bit integer.

`value` is interpreted and written as a two's complement signed integer.

```js
const buf = Buffer.allocUnsafe(2);

buf.writeInt8(2, 0);
buf.writeInt8(-2, 1);

console.log(buf);
// Prints: <Buffer 02 fe>
```

### buf.writeInt16BE(value, offset)
### buf.writeInt16LE(value, offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Number to be written to `buf`.
* `offset` {integer} Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - 2`.
* Returns: {integer} `offset` plus the number of bytes written.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeInt16BE()` writes big endian, `writeInt16LE()` writes little endian). `value` *should* be a valid signed 16-bit integer. Behavior is undefined when `value` is anything other than a signed 16-bit integer.

`value` is interpreted and written as a two's complement signed integer.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeInt16BE(0x0102, 0);
buf.writeInt16LE(0x0304, 2);

console.log(buf);
// Prints: <Buffer 01 02 04 03>
```

### buf.writeInt32BE(value, offset)
### buf.writeInt32LE(value, offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Number to be written to `buf`.
* `offset` {integer} Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - 4`.
* Returns: {integer} `offset` plus the number of bytes written.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeInt32BE()` writes big endian, `writeInt32LE()` writes little endian). `value` *should* be a valid signed 32-bit integer. Behavior is undefined when `value` is anything other than a signed 32-bit integer.

`value` is interpreted and written as a two's complement signed integer.

```js
const buf = Buffer.allocUnsafe(8);

buf.writeInt32BE(0x01020304, 0);
buf.writeInt32LE(0x05060708, 4);

console.log(buf);
// Prints: <Buffer 01 02 03 04 08 07 06 05>
```

### buf.writeIntBE(value, offset, byteLength)
### buf.writeIntLE(value, offset, byteLength)
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 and `byteLength` to `uint32` anymore.
-->

* `value` {integer} Number to be written to `buf`.
* `offset` {integer} Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Number of bytes to write. Must satisfy `0 < byteLength <= 6`.
* Returns: {integer} `offset` plus the number of bytes written.

Writes `byteLength` bytes of `value` to `buf` at the specified `offset`. Supports up to 48 bits of accuracy. Behavior is undefined when `value` is anything other than a signed integer.

```js
const buf = Buffer.allocUnsafe(6);

buf.writeIntBE(0x1234567890ab, 0, 6);

console.log(buf);
// Prints: <Buffer 12 34 56 78 90 ab>

buf.writeIntLE(0x1234567890ab, 0, 6);

console.log(buf);
// Prints: <Buffer ab 90 78 56 34 12>
```

### buf.writeUInt8(value, offset)
<!-- YAML
added: v0.5.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Number to be written to `buf`.
* `offset` {integer} Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - 1`.
* Returns: {integer} `offset` plus the number of bytes written.

Writes `value` to `buf` at the specified `offset`. `value` *should* be a valid unsigned 8-bit integer. Behavior is undefined when `value` is anything other than an unsigned 8-bit integer.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt8(0x3, 0);
buf.writeUInt8(0x4, 1);
buf.writeUInt8(0x23, 2);
buf.writeUInt8(0x42, 3);

console.log(buf);
// Prints: <Buffer 03 04 23 42>
```

### buf.writeUInt16BE(value, offset)
### buf.writeUInt16LE(value, offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Number to be written to `buf`.
* `offset` {integer} Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - 2`.
* Returns: {integer} `offset` plus the number of bytes written.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeUInt16BE()` writes big endian, `writeUInt16LE()` writes little endian). `value` should be a valid unsigned 16-bit integer. Behavior is undefined when `value` is anything other than an unsigned 16-bit integer.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt16BE(0xdead, 0);
buf.writeUInt16BE(0xbeef, 2);

console.log(buf);
// Prints: <Buffer de ad be ef>

buf.writeUInt16LE(0xdead, 0);
buf.writeUInt16LE(0xbeef, 2);

console.log(buf);
// Prints: <Buffer ad de ef be>
```

### buf.writeUInt32BE(value, offset)
### buf.writeUInt32LE(value, offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Number to be written to `buf`.
* `offset` {integer} Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - 4`.
* Returns: {integer} `offset` plus the number of bytes written.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeUInt32BE()` writes big endian, `writeUInt32LE()` writes little endian). `value` should be a valid unsigned 32-bit integer. Behavior is undefined when `value` is anything other than an unsigned 32-bit integer.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt32BE(0xfeedface, 0);

console.log(buf);
// Prints: <Buffer fe ed fa ce>

buf.writeUInt32LE(0xfeedface, 0);

console.log(buf);
// Prints: <Buffer ce fa ed fe>
```

### buf.writeUIntBE(value, offset, byteLength)
### buf.writeUIntLE(value, offset, byteLength)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 and `byteLength` to `uint32` anymore.
-->

* `value` {integer} Number to be written to `buf`.
* `offset` {integer} Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Number of bytes to write. Must satisfy `0 < byteLength <= 6`.
* Returns: {integer} `offset` plus the number of bytes written.

Writes `byteLength` bytes of `value` to `buf` at the specified `offset`. Supports up to 48 bits of accuracy. Behavior is undefined when `value` is anything other than an unsigned integer.

```js
const buf = Buffer.allocUnsafe(6);

buf.writeUIntBE(0x1234567890ab, 0, 6);

console.log(buf);
// Prints: <Buffer 12 34 56 78 90 ab>

buf.writeUIntLE(0x1234567890ab, 0, 6);

console.log(buf);
// Prints: <Buffer ab 90 78 56 34 12>
```

## buffer.INSPECT_MAX_BYTES
<!-- YAML
added: v0.5.4
-->

* {integer} **默认值：** `50`

Returns the maximum number of bytes that will be returned when `buf.inspect()` is called. This can be overridden by user modules. See [`util.inspect()`] for more details on `buf.inspect()` behavior.

Note that this is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## buffer.kMaxLength
<!-- YAML
added: v3.0.0
-->

* {integer} 单个`Buffer`对象允许的最大长度。

An alias for [`buffer.constants.MAX_LENGTH`][].

Note that this is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## buffer.transcode(source, fromEnc, toEnc)
<!-- YAML
added: v7.1.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `source` parameter can now be a `Uint8Array`.
-->

* `source` {Buffer|Uint8Array} A `Buffer` or `Uint8Array` instance.
* `fromEnc` {string} The current encoding.
* `toEnc` {string} To target encoding.

Re-encodes the given `Buffer` or `Uint8Array` instance from one character encoding to another. Returns a new `Buffer` instance.

Throws if the `fromEnc` or `toEnc` specify invalid character encodings or if conversion from `fromEnc` to `toEnc` is not permitted.

Encodings supported by `buffer.transcode()` are: `'ascii'`, `'utf8'`, `'utf16le'`, `'ucs2'`, `'latin1'`, and `'binary'`.

The transcoding process will use substitution characters if a given byte sequence cannot be adequately represented in the target encoding. 例如：

```js
const buffer = require('buffer');

const newBuf = buffer.transcode(Buffer.from('€'), 'utf8', 'ascii');
console.log(newBuf.toString('ascii'));
// Prints: '?'
```

Because the Euro (`€`) sign is not representable in US-ASCII, it is replaced with `?` in the transcoded `Buffer`.

Note that this is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## Class: SlowBuffer
<!-- YAML
deprecated: v6.0.0
-->

> Stability: 0 - Deprecated: Use [`Buffer.allocUnsafeSlow()`] instead.

Returns an un-pooled `Buffer`.

In order to avoid the garbage collection overhead of creating many individually allocated `Buffer` instances, by default allocations under 4KB are sliced from a single larger allocated object.

In the case where a developer may need to retain a small chunk of memory from a pool for an indeterminate amount of time, it may be appropriate to create an un-pooled `Buffer` instance using `SlowBuffer` then copy out the relevant bits.

```js
// Need to keep around a few small chunks of memory
const store = [];

socket.on('readable', () => {
  let data;
  while (null !== (data = readable.read())) {
    // Allocate for retained data
    const sb = SlowBuffer(10);

    // Copy the data into the new allocation
    data.copy(sb, 0, 0, 10);

    store.push(sb);
  }
});
```

Use of `SlowBuffer` should be used only as a last resort *after* a developer has observed undue memory retention in their applications.

### new SlowBuffer(size)
<!-- YAML
deprecated: v6.0.0
-->

> Stability: 0 - Deprecated: Use [`Buffer.allocUnsafeSlow()`] instead.

* `size` {integer} The desired length of the new `SlowBuffer`.

分配一个大小为 `size` 字节的新的 `Buffer`。 If `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, [`ERR_INVALID_OPT_VALUE`] is thrown. A zero-length `Buffer` is created if `size` is 0.

The underlying memory for `SlowBuffer` instances is *not initialized*. The contents of a newly created `SlowBuffer` are unknown and may contain sensitive data. Use [`buf.fill(0)`][`buf.fill()`] to initialize a `SlowBuffer` with zeroes.

```js
const { SlowBuffer } = require('buffer');

const buf = new SlowBuffer(5);

console.log(buf);
// Prints: (contents may vary): <Buffer 78 e0 82 02 01>

buf.fill(0);

console.log(buf);
// Prints: <Buffer 00 00 00 00 00>
```

## Buffer Constants
<!-- YAML
added: v8.2.0
-->

请注意 `bufffer.constants` 是通过`require('buffer')`返回的 `buffer` 模块上的属性，不在 `Buffer` 全局变量或`Buffer` 实例中。

### buffer.constants.MAX_LENGTH
<!-- YAML
added: v8.2.0
-->

* {integer} 单个`Buffer`对象允许的最大长度。

在32位架构中，此值是 `(2^30)-1`(~1GB)。 在64位架构中，此值是 `(2^31)-1`(~2GB)。

这个值也可以通过`buffer.kMaxLength`获取。

### buffer.constants.MAX_STRING_LENGTH
<!-- YAML
added: v8.2.0
-->

* {integer} 单个`String`对象允许的最大长度。

代表一个 `string` 的最大长度（`length`），按 UTF-16 编码单元计算。

此值可能取决于正在使用的 JS 引擎。
