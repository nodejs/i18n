# 查询字符串

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定

<!--name=querystring-->

`querystring` 模块提供了解析和格式化 URL 查询字符串的实用工具。 可以通过如下方式访问：

```js
const querystring = require('querystring');
```

## querystring.decode()
<!-- YAML
added: v0.1.99
-->

The `querystring.decode()` function is an alias for `querystring.parse()`.

## querystring.encode()
<!-- YAML
added: v0.1.99
-->

The `querystring.encode()` function is an alias for `querystring.stringify()`.

## querystring.escape(str)
<!-- YAML
added: v0.1.25
-->

* `str` {string}

`querystring.escape()` 方法以对 URL 查询字符串的特定要求进行优化的方式对给定的 `str` 进行 URL 百分比编码。

`querystring.escape()` 方法由 `querystring.stringify()` 使用，且通常不应被直接使用。 导出它主要是为了允许应用程序代码在必要时，通过将 `querystring.escape` 指定给替代函数来提供替代的百分比编码实现。

## querystring.parse(str[, sep[, eq[, options]]])
<!-- YAML
added: v0.1.25
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10967
    description: Multiple empty entries are now parsed correctly (e.g. `&=&=`).
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/6055
    description: The returned object no longer inherits from `Object.prototype`.
  - version: v6.0.0, v4.2.4
    pr-url: https://github.com/nodejs/node/pull/3807
    description: The `eq` parameter may now have a length of more than `1`.
-->

* `str` {string} 需要解析的 URL 查询字符串
* `sep` {string} 用于分隔查询字符串中键值对的子字符串。 **Default:** `'&'`.
* `eq` {string}。 用于分隔查询字符串中键和值的子字符串。 **Default:** `'='`.
* `options` {Object}
  * `decodeURIComponent` {Function} 解码查询字符串中的百分比编码字符时使用的函数。 **Default:** `querystring.unescape()`.
  * `maxKeys` {number} 指定要解析的键的最大数量。 指定 `0` 以移除键计数限制。 **Default:** `1000`.

`querystring.parse()` 方法将一个 URL 查询字符串 (`str`) 解析为一个键值对集合。

例如：查询字符串 `'foo=bar&abc=xyz&abc=123'` 被解析为：
```js
{
  foo: 'bar',
  abc: ['xyz', '123']
}
```

The object returned by the `querystring.parse()` method _does not_ prototypically inherit from the JavaScript `Object`. 这意味着典型的 `Object` 方法例如 `obj.toString()`, `obj.hasOwnProperty()`，以及其他方法都未定义且 *无法工作*。

默认情况下，查询字符串中的百分比编码字符被假定为使用 UTF-8 编码。 If an alternative character encoding is used, then an alternative `decodeURIComponent` option will need to be specified:

```js
// Assuming gbkDecodeURIComponent function already exists...

querystring.parse('w=%D6%D0%CE%C4&foo=bar', null, null,
                  { decodeURIComponent: gbkDecodeURIComponent });
```

## querystring.stringify(obj[, sep[, eq[, options]]])<!-- YAML
added: v0.1.25
-->* `obj` {Object} 要序列化为 URL 查询字符串的对象
* `sep` {string} 用于分隔查询字符串中键值对的子字符串。 **Default:** `'&'`.
* `eq` {string}。 用于分隔查询字符串中键和值的子字符串。 **Default:** `'='`.
* `options`
  * `encodeURIComponent` {Function} 将查询字符串中 URL 不安全字符转换为百分比编码时使用的函数。 **Default:** `querystring.escape()`.

`querystring.stringify()` 方法通过从给定的 `obj` 遍历对象的 "自身属性" 生成 URL 查询字符串。

It serializes the following types of values passed in `obj`:
{string|number|boolean|string[]|number[]|boolean[]}
Any other input values will be coerced to empty strings.

```js
querystring.stringify({ foo: 'bar', baz: ['qux', 'quux'], corge: '' });
// returns 'foo=bar&baz=qux&baz=quux&corge='

querystring.stringify({ foo: 'bar', baz: 'qux' }, ';', ':');
// returns 'foo:bar;baz:qux'
```

默认情况下，在查询字符串中需要百分比编码的字符将被编码为 UTF-8。 If an alternative encoding is required, then an alternative `encodeURIComponent` option will need to be specified:

```js
// Assuming gbkEncodeURIComponent function already exists,

querystring.stringify({ w: '中文', foo: 'bar' }, null, null,
                      { encodeURIComponent: gbkEncodeURIComponent });
```

## querystring.unescape(str)
<!-- YAML
added: v0.1.25
-->

* `str` {string}

`querystring.unescape()` 方法在给定的 `str` 上进行 URL 百分比编码字符的解码。

`querystring.unescape()` 方法由 `querystring.parse()` 使用，且通常不应被直接使用。 导出它主要是为了允许应用程序代码在必要时，通过将 `querystring.unescape` 指定给替代函数来提供替代的百分比解码实现。

默认情况下， `querystring.unescape()` 方法将尝试使用 JavaScript 内置的 `decodeURIComponent()` 方法进行解码。 如果失败，将使用更安全的，不会丢失格式错误的 URL 的等价方法。
