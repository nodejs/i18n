# 国际域名编码
<!-- YAML
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7941
    description: Accessing this module will now emit a deprecation warning.
-->

<!--introduced_in=v0.10.0-->

> 稳定性：0 - 已弃用

**在 Node.js 中绑定的 punycode 模块版本正在被弃用**。 在未来的主要版本的 Node.js 中，此模块将被删除。 依赖于 `punycode` 模块的用户应切换到 userland-provided 版本的 [Punycode.js](https://mths.be/punycode) 模块。

`punycode` 模块是打包后的 [Punycode.js](https://mths.be/punycode) 模块。 可以通过如下方式访问：

```js
const punycode = require('punycode');
```

[Punycode](https://tools.ietf.org/html/rfc3492) 是在 RFC 3492 中定义的字符编码方案，其主要目的是在国际化域名中使用。 由于在 URL 中的主机名只能使用 ASCII 字符，含有非 ASCII 字符的域名必须使用 Punycode 方案将其转化为 ASCII 字符。 例如，翻译为英文单词的日文字符，`'example'` 是 `'例'`。 国际化域名，`'例.com'` (等同于 `'example.com'`) 可以通过 Punycode 将其以 ASCII 字符串 `'xn--fsq.com'` 来表示。

`punycode` 模块提供了 Punycode 标准的简单实现。

*注意*：`punycode` 模块是被 Node.js 使用的第三方依赖库，为方便起见，对开发人员开放。 任何对此模块的修复和更改都必须直接针对 [Punycode.js](https://mths.be/punycode) 项目进行。

## punycode.decode(string)
<!-- YAML
added: v0.5.1
-->

* `string` {string}

`punycode.decode()` 方法将一个 [Punycode](https://tools.ietf.org/html/rfc3492) 的只包含 ASCII 字符的字符串转换为对应的 Unicode 编码字符串。

```js
punycode.decode('maana-pta'); // 'mañana'
punycode.decode('--dqo34k'); // '☃-⌘'
```

## punycode.encode(string)
<!-- YAML
added: v0.5.1
-->

* `string` {string}

`punycode.encode()` 方法将 Unicode 编码的字符串转换为只含有 ASCII 编码字符的 [Punycode](https://tools.ietf.org/html/rfc3492) 字符串。

```js
punycode.encode('mañana'); // 'maana-pta'
punycode.encode('☃-⌘'); // '--dqo34k'
```

## punycode.toASCII(domain)
<!-- YAML
added: v0.6.1
-->

* `domain` {string}

`punycode.toASCII()` 方法将代表国际化域名的 Unicode 字符串转换为 [Punycode](https://tools.ietf.org/html/rfc3492)。 只有域名中的非 ASCII 部分将会被转换。 在只含有 ASCII 字符的字符串上调用 `punycode.toASCII()` 不会产生任何作用。

```js
// encode domain names
punycode.toASCII('mañana.com');  // 'xn--maana-pta.com'
punycode.toASCII('☃-⌘.com');   // 'xn----dqo34k.com'
punycode.toASCII('example.com'); // 'example.com'
```

## punycode.toUnicode(domain)
<!-- YAML
added: v0.6.1
-->

* `domain` {string}

`punycode.toUnicode()` 方法将代表域名的，包含 [Punycode](https://tools.ietf.org/html/rfc3492) 编码字符的字符串转换为 Unicode。 域名中只有 [Punycode](https://tools.ietf.org/html/rfc3492) 编码部分会被进行转换。

```js
// decode domain names
punycode.toUnicode('xn--maana-pta.com'); // 'mañana.com'
punycode.toUnicode('xn----dqo34k.com');  // '☃-⌘.com'
punycode.toUnicode('example.com');       // 'example.com'
```

## punycode.ucs2
<!-- YAML
added: v0.7.0
-->

### punycode.ucs2.decode(string)
<!-- YAML
added: v0.7.0
-->

* `string` {string}

`punycode.ucs2.decode()` 方法返回一个包含字符串中每个 Unicode 符号对应数字值的数组。

```js
punycode.ucs2.decode('abc'); // [0x61, 0x62, 0x63]
// surrogate pair for U+1D306 tetragram for centre:
punycode.ucs2.decode('\uD834\uDF06'); // [0x1D306]
```

### punycode.ucs2.encode(codePoints)
<!-- YAML
added: v0.7.0
-->

* `codePoints` {Array}

`punycode.ucs2.encode()` 方法返回一个基于数字值数组的字符串。

```js
punycode.ucs2.encode([0x61, 0x62, 0x63]); // 'abc'
punycode.ucs2.encode([0x1D306]); // '\uD834\uDF06'
```

## punycode.version
<!-- YAML
added: v0.6.1
-->

返回一个识别当前 [Punycode.js](https://mths.be/punycode) 版本号的字符串。
