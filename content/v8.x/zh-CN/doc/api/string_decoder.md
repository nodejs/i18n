# 字符串解码器

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定

`string_decoder` 模块提供了一个可用于将 `Buffer` 对象解码为字符串的 API，在解码过程中会保留已编码的多字节 UTF-8 和 UTF-16 字符。 可以通过如下方式访问：

```js
const { StringDecoder } = require('string_decoder');
```

如下示例演示了 `StringDecoder` 类的基本用法。

```js
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');

const cent = Buffer.from([0xC2, 0xA2]);
console.log(decoder.write(cent));

const euro = Buffer.from([0xE2, 0x82, 0xAC]);
console.log(decoder.write(euro));
```

当 `Buffer` 实例被写入到 `StringDecoder` 实例时，将使用内部缓冲区来确保已解码字符串中不包含不完整的多字节字符。 它们将被保存在缓冲区中，直到下次调用 `stringDecoder.write()` ，或 `stringDecoder.end()` 被调用时。

在下面的示例中，欧元符号 (`€`) 的三个 UTF-8 编码字节通过三个独立的操作来写入：

```js
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');

decoder.write(Buffer.from([0xE2]));
decoder.write(Buffer.from([0x82]));
console.log(decoder.end(Buffer.from([0xAC])));
```

## 类：new StringDecoder([encoding])
<!-- YAML
added: v0.1.99
-->

* `encoding` {string} `StringDecoder` 将要使用的字符编码。 **默认值:**`‘utf8'`。

创建一个新的 `StringDecoder` 实例。

### stringDecoder.end([buffer])
<!-- YAML
added: v0.9.3
-->

* `buffer` {Buffer} 包含将被解码字节的 `Buffer`。

以字符串形式返回保存在内部缓冲区中的任何剩余输入。 表示不完整的 UTF-8 和 UTF-16 字符的字节将被替换为适合字符编码的替代字符。

如果提供了 `buffer` 参数，在返回剩余输入之前将会最后一次调用 `stringDecoder.write()`。

### stringDecoder.write(buffer)
<!-- YAML
added: v0.1.99
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/9618
    description: Each invalid character is now replaced by a single replacement
                 character instead of one for each individual byte.
-->

* `buffer` {Buffer} 包含将被解码字节的 `Buffer`

返回已解码的字符串，确保在 `Buffer` 尾部的任何不完整多字节字符在返回字符串中被忽略，并被保存在内部缓冲区中，以便在下次调用 `stringDecoder.write()` 或 `stringDecoder.end()` 时使用。
