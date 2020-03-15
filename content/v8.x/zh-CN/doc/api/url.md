# URL

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定

`url` 模块提供了用于处理与解析 URL 的工具。 它可以通过如下方式访问：

```js
const url = require('url');
```

## URL 字符串和 URL 对象

URL 字符串是包含多个具有不同含义组件的结构化字符串。 当被解析时，会返回一个包含所有这些组件的属性的 URL 对象。

`url` 模块提供了两个用于处理 URL 的 API：一个特定于 Node.js 的旧版本 API，还有一个实现了众多浏览器遵循的 [WHATWG URL 标准](https://url.spec.whatwg.org/) 的较新 API。

*注意*：尽管旧版本 API 并未被弃用，它仍在被维护但仅仅是为了保持和现有应用程序的向后兼容性。 新应用程序代码应该使用 WHATWG API。

对于 WHATWG 和旧版本 API的比较如下。 在 URL `'http://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash'` 的上边，旧版本中 `url.parse()` 方法返回对象的属性如下所示。 它下面的是 WHATWG `URL` 对象的属性。

*注意*：WHATWG URL 的 `origin` 属性包括 `protocol` 和 `host`，但不包括 `username` or `password`。

```txt
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                            href                                             │
├──────────┬──┬─────────────────────┬─────────────────────┬───────────────────────────┬───────┤
│ protocol │  │        auth         │        host         │           path            │ hash  │
│          │  │                     ├──────────────┬──────┼──────────┬────────────────┤       │
│          │  │                     │   hostname   │ port │ pathname │     search     │       │
│          │  │                     │              │      │          ├─┬──────────────┤       │
│          │  │                     │              │      │          │ │    query     │       │
"  https:   //    user   :   pass   @ sub.host.com : 8080   /p/a/t/h  ?  query=string   #hash "
│          │  │          │          │   hostname   │ port │          │                │       │
│          │  │          │          ├──────────────┴──────┤          │                │       │
│ protocol │  │ username │ password │        host         │          │                │       │
├──────────┴──┼──────────┴──────────┼─────────────────────┤          │                │       │
│   origin    │                     │       origin        │ pathname │     search     │ hash  │
├─────────────┴─────────────────────┴─────────────────────┴──────────┴────────────────┴───────┤
│                                            href                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
(all spaces in the "" line should be ignored — they are purely for formatting)
```

使用 WHATWG AP 解析 URL 字符串：

```js
const { URL } = require('url');
const myURL =
  new URL('https://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash');
```

*Note*: In Web Browsers, the WHATWG `URL` class is a global that is always available. 然而在 Node.js 中，`URL` 类必须通过 `require('url').URL` 进行访问。

使用 旧版本 API 解析 URL 字符串：

```js
const url = require('url');
const myURL =
  url.parse('https://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash');
```

## The WHATWG URL API
<!-- YAML
added: v7.0.0
-->

### 类：URL

和浏览器兼容的 `URL` 类，是通过遵循 WHATWG URL 标准来实现的。 [解析过的 URL 范例](https://url.spec.whatwg.org/#example-url-parsing) 可以在标准本身中找到。

*Note*: In accordance with browser conventions, all properties of `URL` objects are implemented as getters and setters on the class prototype, rather than as data properties on the object itself. 因此，不像 [旧版本的 urlObject](#url_legacy_urlobject)，在 `URL` 对象的任何属性上使用 `delete` 关键字 （例如：`delete
myURL.protocol`, `delete myURL.pathname` 等）不会产生任何作用，但返回值仍是 `true`。

#### 构造函数：new URL(input[, base])

* `input` {string} 需要解析的输入字符串
* `base` {string|URL} 当 `input` 不是绝对路径时，作为基础的基本 URL。

通过解析相对于 `base` 的 `input` 来创建一个新的 `URL` 对象。 如果 `base` 是以字符串方式被传递的，这就和解析 `new URL(base)` 效果相同。

```js
const { URL } = require('url');
const myURL = new URL('/foo', 'https://example.org/');
// https://example.org/foo
```

如果 `input` 或 `base` 不是有效的 URL，则会抛出 `TypeError`。 注意：给定的值将被尽量强制转换为字符串。 例如：

```js
const { URL } = require('url');
const myURL = new URL({ toString: () => 'https://example.org/' });
// https://example.org/
```

出现在 `input` 主机名中的 unicode 字符串将被使用 [Punycode](https://tools.ietf.org/html/rfc5891#section-4.4) 算法自动转换为 ASCII 代码。

```js
const { URL } = require('url');
const myURL = new URL('https://你好你好');
// https://xn--6qqa088eba/
```

*Note*: This feature is only available if the `node` executable was compiled with [ICU](intl.html#intl_options_for_building_node_js) enabled. 否则，域名在被传递时将不做任何改变。

#### url.hash

* {string}

获取并设置 URL 中的片段部分。

```js
const { URL } = require('url');
const myURL = new URL('https://example.org/foo#bar');
console.log(myURL.hash);
// Prints #bar

myURL.hash = 'baz';
console.log(myURL.href);
// Prints https://example.org/foo#baz
```

分配给 `hash` 属性中的无效 URL 字符会被进行 [百分号编码](#whatwg-percent-encoding)。 注意，在选择哪些字符将被百分号编码上，[`url.parse()`][] 及 [`url.format()`][] 方法的输出有所不同。

#### url.host

* {string}

获取并设置 URL 中的主机部分。

```js
const { URL } = require('url');
const myURL = new URL('https://example.org:81/foo');
console.log(myURL.host);
// Prints example.org:81

myURL.host = 'example.com:82';
console.log(myURL.href);
// Prints https://example.com:82/foo
```

被分配给 `host` 属性的无效主机值将被忽略。

#### url.hostname

* {string}

获取并设置 URL 中的主机名部分。 The key difference between `url.host` and `url.hostname` is that `url.hostname` does *not* include the port.

```js
const { URL } = require('url');
const myURL = new URL('https://example.org:81/foo');
console.log(myURL.hostname);
// Prints example.org

myURL.hostname = 'example.com:82';
console.log(myURL.href);
// Prints https://example.com:81/foo
```

分配给 `hostname` 属性的无效主机名将被忽略。

#### url.href

* {string}

获取并设置序列化的 URL。

```js
const { URL } = require('url');
const myURL = new URL('https://example.org/foo');
console.log(myURL.href);
// Prints https://example.org/foo

myURL.href = 'https://example.com/bar';
console.log(myURL.href);
// Prints https://example.com/bar
```

获取 `href` 属性值就等同于调用 [`url.toString()`][]。

将此属性设置为新值就等同于使用 [`new URL(value)`][`new URL()`] 创建新的 `URL` 对象。 `URL` 对象的所有属性都将被改变。

如果分配给 `href` 属性的值为无效 URL，则会抛出 `TypeError`。

#### url.origin

* {string}

获取只读的 URL 来源序列化字符串。

```js
const { URL } = require('url');
const myURL = new URL('https://example.org/foo/bar?baz');
console.log(myURL.origin);
// Prints https://example.org
```

```js
const { URL } = require('url');
const idnURL = new URL('https://你好你好');
console.log(idnURL.origin);
// Prints https://xn--6qqa088eba

console.log(idnURL.hostname);
// Prints xn--6qqa088eba
```

#### url.password

* {string}

获取并设置 URL 中的密码部分。

```js
const { URL } = require('url');
const myURL = new URL('https://abc:xyz@example.com');
console.log(myURL.password);
// Prints xyz

myURL.password = '123';
console.log(myURL.href);
// Prints https://abc:123@example.com
```

分配给 `password` 属性值中的无效 URL 字符会被 [百分号编码](#whatwg-percent-encoding)。 注意，在选择哪些字符将被百分号编码上，[`url.parse()`][] 及 [`url.format()`][] 方法的输出有所不同。

#### url.pathname

* {string}

获取并设置 URL 中的路径部分。

```js
const { URL } = require('url');
const myURL = new URL('https://example.org/abc/xyz?123');
console.log(myURL.pathname);
// Prints /abc/xyz

myURL.pathname = '/abcdef';
console.log(myURL.href);
// Prints https://example.org/abcdef?123
```

分配给 `pathname` 属性值中的无效 URL 字符会被 [百分号编码](#whatwg-percent-encoding)。 注意，在选择哪些字符将被百分号编码上，[`url.parse()`][] 及 [`url.format()`][] 方法的输出有所不同。

#### url.port

* {string}

获取并设置 URL 中的端口部分。

```js
const { URL } = require('url');
const myURL = new URL('https://example.org:8888');
console.log(myURL.port);
// Prints 8888

// Default ports are automatically transformed to the empty string
// (HTTPS protocol's default port is 443)
myURL.port = '443';
console.log(myURL.port);
// Prints the empty string
console.log(myURL.href);
// Prints https://example.org/

myURL.port = 1234;
console.log(myURL.port);
// Prints 1234
console.log(myURL.href);
// Prints https://example.org:1234/

// Completely invalid port strings are ignored
myURL.port = 'abcd';
console.log(myURL.port);
// Prints 1234

// Leading numbers are treated as a port number
myURL.port = '5678abcd';
console.log(myURL.port);
// Prints 5678

// Non-integers are truncated
myURL.port = 1234.5678;
console.log(myURL.port);
// Prints 1234

// Out-of-range numbers are ignored
myURL.port = 1e10;
console.log(myURL.port);
// Prints 1234
```

端口值可以被设置为一个数字或包含数字的字符串，该数字值为 `0` 到 `65535` （包含）之间的一个值。 将值设定为 `URL` 对象的默认端口，将会导致 `port` 值变为空字符串 (`''`)。

如果将无效字符串分配给 `port` 属性，但该无效字符串以数字开头，则开头的数字将被分配给 `port`。 否则，或者如果数字超出上面的给定范围，它将被忽略。

#### url.protocol

* {string}

获取并设置 URL 中的协议部分。

```js
const { URL } = require('url');
const myURL = new URL('https://example.org');
console.log(myURL.protocol);
// Prints https:

myURL.protocol = 'ftp';
console.log(myURL.href);
// Prints ftp://example.org/
```

分配给 `protocol` 属性的无效 URL 协议值将被忽略。

#### url.search

* {string}

获取并设置 URL 中的序列化查询字符串部分。

```js
const { URL } = require('url');
const myURL = new URL('https://example.org/abc?123');
console.log(myURL.search);
// Prints ?123

myURL.search = 'abc=xyz';
console.log(myURL.href);
// Prints https://example.org/abc?abc=xyz
```

任何被分配给 `search` 属性的无效 URL 字符都将被 [百分号编码](#whatwg-percent-encoding)。 注意，在选择哪些字符将被百分号编码上，[`url.parse()`][] 及 [`url.format()`][] 方法的输出有所不同。

#### url.searchParams

* {URLSearchParams}

获得代表 URL 中查询参数的 [`URLSearchParams`][] 对象。 此属性为只读；要替换 URL 的全部查询参数，请使用 [`url.search`][] setter。 请参阅 [`URLSearchParams`][] 文档以获取详细信息。

#### url.username

* {string}

获取并设置 URL 中的用户名部分。

```js
const { URL } = require('url');
const myURL = new URL('https://abc:xyz@example.com');
console.log(myURL.username);
// Prints abc

myURL.username = '123';
console.log(myURL.href);
// Prints https://123:xyz@example.com/
```

任何被分配给 `username` 属性的无效 URL 字符都将被 [百分号编码](#whatwg-percent-encoding)。 注意，在选择哪些字符将被百分号编码上，[`url.parse()`][] 及 [`url.format()`][] 方法的输出有所不同。

#### url.toString()

* 返回：{string}

`URL` 对象的 `toString()` 方法返回序列化的 URL。 返回的值等同于 [`url.href`][] 和 [`url.toJSON()`][] 的值。

由于需要符合规范，此方法不允许用户自定义 URL 的序列化过程。 为了获得更大的灵活性，可以使用 [`require('url').format()`][] 方法。

#### url.toJSON()

* 返回：{string}

`URL` 对象的 `toJSON()` 方法返回序列化的 URL。 返回的值等同于 [`url.href`][] 和 [`url.toString()`][] 的值。

当一个 `URL` 对象通过 [`JSON.stringify()`][] 序列化时，此方法会自动被调用。

```js
const { URL } = require('url');
const myURLs = [
  new URL('https://www.example.com'),
  new URL('https://test.example.org')
];
console.log(JSON.stringify(myURLs));
// Prints ["https://www.example.com/","https://test.example.org/"]
```

### 类：URLSearchParams
<!-- YAML
added: v7.5.0
-->

`URLSearchParams` API 提供对 `URL` 中查询参数的读写访问。 通过以下四个构造函数，`URLSearchParams` 类还可以被单独使用。

WHATWG `URLSearchParams` 接口和 [`querystring`][] 模块具有类似的目的，但 [`querystring`][] 模块更为通用，其原因在于它允许自定义分隔符 (`&` and `=`)。 另一方面，此 API 纯粹是为了 URL 查询字符串设计的。

```js
const { URL, URLSearchParams } = require('url');

const myURL = new URL('https://example.org/?abc=123');
console.log(myURL.searchParams.get('abc'));
// Prints 123

myURL.searchParams.append('abc', 'xyz');
console.log(myURL.href);
// Prints https://example.org/?abc=123&abc=xyz

myURL.searchParams.delete('abc');
myURL.searchParams.set('a', 'b');
console.log(myURL.href);
// Prints https://example.org/?a=b

const newSearchParams = new URLSearchParams(myURL.searchParams);
// The above is equivalent to
// const newSearchParams = new URLSearchParams(myURL.search);

newSearchParams.append('a', 'c');
console.log(myURL.href);
// Prints https://example.org/?a=b
console.log(newSearchParams.toString());
// Prints a=b&a=c

// newSearchParams.toString() is implicitly called
myURL.search = newSearchParams;
console.log(myURL.href);
// Prints https://example.org/?a=b&a=c
newSearchParams.delete('a');
console.log(myURL.href);
// Prints https://example.org/?a=b&a=c
```

#### 构造函数：new URLSearchParams()

实例化一个新的空 `URLSearchParams` 对象。

#### 构造函数：new URLSearchParams(string)

* `string` {string} 查询字符串

将 `string` 作为查询字符串进行解析，并使用它来初始化一个新的 `URLSearchParams` 对象。 如果以 `'?'` 开头，则忽略它。

```js
const { URLSearchParams } = require('url');
let params;

params = new URLSearchParams('user=abc&query=xyz');
console.log(params.get('user'));
// Prints 'abc'
console.log(params.toString());
// Prints 'user=abc&query=xyz'

params = new URLSearchParams('?user=abc&query=xyz');
console.log(params.toString());
// Prints 'user=abc&query=xyz'
```

#### 构造函数：new URLSearchParams(obj)
<!-- YAML
added: v7.10.0
-->

* `obj` {Object} 一个代表键/值对集合的对象

通过包含查询参数的哈希图来实例化一个 `URLSearchParams` 对象。 `obj` 所有属性的键和值总是会被强制转化为字符串。

*Note*: Unlike [`querystring`][] module, duplicate keys in the form of array values are not allowed. 数组会通过调用 [`array.toString()`][] 方法来字符串化，该方法只是简单的将所有数组元素通过逗号连接。

```js
const { URLSearchParams } = require('url');
const params = new URLSearchParams({
  user: 'abc',
  query: ['first', 'second']
});
console.log(params.getAll('query'));
// Prints [ 'first,second' ]
console.log(params.toString());
// Prints 'user=abc&query=first%2Csecond'
```

#### 构造函数：new URLSearchParams(iterable)
<!-- YAML
added: v7.10.0
-->

* `iterable` {Iterable} 一个元素为键/值对的可迭代对象。

类似于 [`Map`][] 的构造函数，此构造函数通过一个可迭代图来实例化一个新的 `URLSearchParams` 对象。 `iterable` 可以是一个数组，或者任何可迭代对象。 这就意味着 `iterable` 可以是另一个 `URLSearchParams`，在这种情况下，构造函数只是简单的创建提供的 `URLSearchParams` 的克隆。 `iterable` 中的元素是键/值对，它们本身也可以是可迭代对象。

允许重复键。

```js
const { URLSearchParams } = require('url');
let params;

// Using an array
params = new URLSearchParams([
  ['user', 'abc'],
  ['query', 'first'],
  ['query', 'second']
]);
console.log(params.toString());
// Prints 'user=abc&query=first&query=second'

// Using a Map object
const map = new Map();
map.set('user', 'abc');
map.set('query', 'xyz');
params = new URLSearchParams(map);
console.log(params.toString());
// Prints 'user=abc&query=xyz'

// Using a generator function
function* getQueryPairs() {
  yield ['user', 'abc'];
  yield ['query', 'first'];
  yield ['query', 'second'];
}
params = new URLSearchParams(getQueryPairs());
console.log(params.toString());
// Prints 'user=abc&query=first&query=second'

// Each key-value pair must have exactly two elements
new URLSearchParams([
  ['user', 'abc', 'error']
]);
// Throws TypeError [ERR_INVALID_TUPLE]:
//        Each query pair must be an iterable [name, value] tuple
```

#### urlSearchParams.append(name, value)

* `name` {string}
* `value` {string}

向查询字符串中追加一个新的键/值对。

#### urlSearchParams.delete(name)

* `name` {string}

移除所有名字为 `name` 的名称/值对。

#### urlSearchParams.entries()

* 返回：{Iterator}

返回查询字符串中每个名称/值对的ES6迭代器。 迭代器中的每个元素都是一个 JavaScript 数组。 数组中的首个元素为 `name`，第二个元素为 `value`。

[`urlSearchParams[@@iterator]()`][`urlSearchParams@@iterator()`] 的别名。

#### urlSearchParams.forEach(fn[, thisArg])

* `fn` {Function} 在查询字符串中，被每个名称/值对所调用的函数。
* `thisArg` {Object} 在 `fn` 被调用时，将被用作 `this` 值的对象。

对查询字符串中的每个名称/值对进行迭代，并调用给定的函数。

```js
const { URL } = require('url');
const myURL = new URL('https://example.org/?a=b&c=d');
myURL.searchParams.forEach((value, name, searchParams) => {
  console.log(name, value, myURL.searchParams === searchParams);
});
// Prints:
//   a b true
//   c d true
```

#### urlSearchParams.get(name)

* `name` {string}
* 返回：{string} 或 `null` 如果对于给定的 `name`，没有对应的名称/值对。

返回名称为 `name` 的第一个名称/值对中的值。 如果找不到匹配的名称/值对，则返回 `null`。

#### urlSearchParams.getAll(name)

* `name` {string}
* 返回：{Array}

返回名称为 `name` 的所有名称/值对中的值。 如果找不到匹配的名称/值对，则返回一个空数组。

#### urlSearchParams.has(name)

* `name` {string}
* 返回：{boolean}

如果至少有一个名称为 `name` 的名称/值对，则返回 `true`。

#### urlSearchParams.keys()

* 返回：{Iterator}

通过每个名称/值对中的名称返回 ES6 迭代器。

```js
const { URLSearchParams } = require('url');
const params = new URLSearchParams('foo=bar&foo=baz');
for (const name of params.keys()) {
  console.log(name);
}
// Prints:
//   foo
//   foo
```

#### urlSearchParams.set(name, value)

* `name` {string}
* `value` {string}

将和 `name` 相关联的 `URLSearchParams` 对象中的值设置为 `value`。 如果任何现有的名称/值对中的名称为 `name`，将首个名称/值对中的值设置为 `value` 并移除其他的名称/值对。 否则，向查询字符串中追加一个新的名称/值对。

```js
const { URLSearchParams } = require('url');

const params = new URLSearchParams();
params.append('foo', 'bar');
params.append('foo', 'baz');
params.append('abc', 'def');
console.log(params.toString());
// Prints foo=bar&foo=baz&abc=def

params.set('foo', 'def');
params.set('xyz', 'opq');
console.log(params.toString());
// Prints foo=def&abc=def&xyz=opq
```

#### urlSearchParams.sort()
<!-- YAML
added: v7.7.0
-->

将所有现有的名称/值对按照名称排序。 根据 [stable sorting algorithm](https://en.wikipedia.org/wiki/Sorting_algorithm#Stability) 进行排序，具有相同名称的名称/值对的相对顺序被保留。

此方法尤其可被用于提高缓存的命中率。

```js
const { URLSearchParams } = require('url');
const params = new URLSearchParams('query[]=abc&type=search&query[]=123');
params.sort();
console.log(params.toString());
// Prints query%5B%5D=abc&query%5B%5D=123&type=search
```

#### urlSearchParams.toString()

* 返回：{string}

返回序列化为字符串的搜索参数，在必要时对字符进行百分比编码。

#### urlSearchParams.values()

* 返回：{Iterator}

返回包含每个名称/值对中值的 ES6 迭代器。

#### urlSearchParams\[@@iterator\]()

* 返回：{Iterator}

返回查询字符串中包含每个名称/值对的 ES6 迭代器。 迭代器中的每个元素都是一个 JavaScript 数组。 数组中的首个元素为 `name`，第二个元素为 `value`。

[`urlSearchParams.entries()`][] 的别名。

```js
const { URLSearchParams } = require('url');
const params = new URLSearchParams('foo=bar&xyz=baz');
for (const [name, value] of params) {
  console.log(name, value);
}
// Prints:
//   foo bar
//   xyz baz
```

### url.domainToASCII(domain)
<!-- YAML
added: v7.4.0
-->

* `domain` {string}
* 返回：{string}

返回 `domain` 的 [Punycode](https://tools.ietf.org/html/rfc5891#section-4.4) ASCII 序列化编码。 如果 `domain` 为无效域名，则返回空字符串。

它执行 [`url.domainToUnicode()`][] 的反向操作。

```js
const url = require('url');
console.log(url.domainToASCII('español.com'));
// Prints xn--espaol-zwa.com
console.log(url.domainToASCII('中文.com'));
// Prints xn--fiq228c.com
console.log(url.domainToASCII('xn--iñvalid.com'));
// Prints an empty string
```

### url.domainToUnicode(domain)
<!-- YAML
added: v7.4.0
-->

* `domain` {string}
* 返回：{string}

返回 `domain` 的 Unicode 序列化编码。 如果 `domain` 为无效域名，则返回空字符串。

它执行 [`url.domainToASCII()`][] 的反向操作。

```js
const url = require('url');
console.log(url.domainToUnicode('xn--espaol-zwa.com'));
// Prints español.com
console.log(url.domainToUnicode('xn--fiq228c.com'));
// Prints 中文.com
console.log(url.domainToUnicode('xn--iñvalid.com'));
// Prints an empty string
```

### url.format(URL[, options])
<!-- YAML
added: v7.6.0
-->

* `URL` {URL} 一个 [WHATWG URL](#url_the_whatwg_url_api) 对象
* `options` {Object}
  * `auth` {boolean} `true` 如果序列化的 URL 字符串应当包含用户名和密码，否则为 `false`。 **Default:** `true`.
  * `fragment` {boolean} `true` 如果序列化 URL 字符串应当包含片段，否则为 `false`。 **Default:** `true`.
  * `search` {boolean} `true` 如果序列化 URL 字符串应当包含查询参数，否则为 `false`。 **Default:** `true`.
  * `unicode` {boolean} `true` 如果 Unicode 字符出现在 URL 字符串中的主机部分，则应对其进行直接编码，而不是进行 Punycode 编码。 **默认:** `false`.

返回一个代表 [WHATWG URL](#url_the_whatwg_url_api) 对象的可自定义的 URL 字符串序列化编码。

URL 对象具有 `toString()` 方法和 `href` 属性，它们都返回 URL 的字符串序列化编码。 然而，它们都不能进行自定义。 `url.format(URL[, options])` 方法允许对输出进行基本的自定义。

例如：

```js
const { URL } = require('url');
const myURL = new URL('https://a:b@你好你好?abc#foo');

console.log(myURL.href);
// Prints https://a:b@xn--6qqa088eba/?abc#foo

console.log(myURL.toString());
// Prints https://a:b@xn--6qqa088eba/?abc#foo

console.log(url.format(myURL, { fragment: false, unicode: true, auth: false }));
// Prints 'https://你好你好/?abc'
```

## 旧版本 URL API

### 旧版本 urlObject

旧版本的 urlObject (`require('url').Url`) 被 `url.parse()` 函数创建并返回。

#### urlObject.auth

`auth` 属性是 URL 中的用户名和密码部分，也被引用为 "userinfo"。 该字符串部分位于 `protocol`和 双斜杠（如果存在）之后，并位于 `host` 部分之前，由一个 ASCII字符 “at sign”（`@`）分隔。 该字符串的格式为 `{username}[:{password}]`，其中的 `[:{password}]` 部分是可选的。

例如：`'user:pass'`

#### urlObject.hash

`hash` 属性包含 URL 中的 "fragment" 部分，该部分包含起始的 ASCII 哈希 (`#`) 字符。

例如：`'#hash'`

#### urlObject.host

`host` 属性是 URL 中主机部分的小写字母表示，如果指定 `port` 的话，也包含 该部分。

例如：`'sub.host.com:8080'`

#### urlObject.hostname

`hostname` 是 `host` 部分中的小写主机名部分，*不* 包含 `port`。

例如：`'sub.host.com'`

#### urlObject.href

`href` 属性是完整的 URL 字符串，其中的 `protocol` 和 `host` 部分都被转换为小写字母。

例如：`'http://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash'`

#### urlObject.path

`path` 属性是 `pathname` 和 `search` 部分连接到一起的结果。

例如：`'/p/a/t/h?query=string'`

不对 `path` 进行解码。

#### urlObject.pathname

`pathname` 属性包含 URL 中的完整路径部分。 这是在 `host` (包含 `port`) 之后，且在由 ASCII 问号字符 (`?`) 或 哈希字符 (`#`) 分隔的 `query` 或`hash` 部分之前的所有字符。

例如：`'/p/a/t/h'`

不对 path 字符串进行解码。

#### urlObject.port

`port` 属性是 `host` 部分中的数字端口号。

例如：`'8080'`

#### urlObject.protocol

`protocol` 属性标识 URL 中以小写字母表示的协议。

例如：`'http:'`

#### urlObject.query

`query` 属性是不含起始 ASCII 编码问号 (`?`) 的查询字符串，或者是 [`querystring`][] 模块中 `parse()` 方法的返回对象。 `query` 属性是字符串还是对象，取决于传递给 `url.parse()` 的 `parseQueryString` 参数。

例如：`'query=string'` 或 `{'query': 'string'}`

如果以字符串方式返回，则不执行对查询字符串的解码。 如果以对象方式返回，则会对键和值进行解码。

#### urlObject.search

`search` 属性包含 URL 中的 "查询字符串" 部分，该部分包含起始的 ASCII 编码的问号 (`?`) 。

例如：`'?query=string'`

不对查询字符串进行解码。

#### urlObject.slashes

如果在 `protocol` 中的冒号之后需要两个 ASCII 编码的斜杠字符 (`/`)， `slashes` 属性的类型为 `boolean`，且值为 `true`。

### url.format(urlObject)
<!-- YAML
added: v0.1.25
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7234
    description: URLs with a `file:` scheme will now always use the correct
                 number of slashes regardless of `slashes` option. A false-y
                 `slashes` option with no protocol is now also respected at all
                 times.
-->

* `urlObject` {Object|string} 一个 URL 对象 (由 `url.parse()` 返回，否则由构造函数创建)。 如果是字符串，通过将其传递给 `url.parse()` 转换为一个对象。

`url.format()` 方法返回由 `urlObject` 派生的格式化 URL 字符串。

```js
url.format({
  protocol: 'https',
  hostname: 'example.com',
  pathname: '/some/path',
  query: {
    page: 1,
    format: 'json'
  }
});

// => 'https://example.com/some/path?page=1&format=json'
```

如果 `urlObject` 不是对象或字符串，`url.format()` 会抛出 [`TypeError`][]。

格式化过程的操作如下：

* 一个新的空字符串 `result` 被创建。
* 如果 `urlObject.protocol` 是字符串，它会原样不动的被追加到 `result`。
* 否则，如果 `urlObject.protocol` 不是 `undefined`，且不是字符串，会抛出 [`Error`][]。
* 对于 `urlObject.protocol` 中 所有 *不以* ASCII 编码冒号 (`:`) 字符结尾的字符串值，字符串 `:` 会被以文字字符串的方式追加到 `result`。
* If either of the following conditions is true, then the literal string `//` will be appended to `result`:
    * `urlObject.slashes` property is true;
    * `urlObject.protocol` begins with `http`, `https`, `ftp`, `gopher`, or `file`;
* If the value of the `urlObject.auth` property is truthy, and either `urlObject.host` or `urlObject.hostname` are not `undefined`, the value of `urlObject.auth` will be coerced into a string and appended to `result` followed by the literal string `@`.
* 如果 `urlObject.host` 属性是 `undefined`，则：
  * 如果 `urlObject.hostname` 是字符串，则会被追加到 `result`。
  * 否则，如果 `urlObject.hostname` 不是 `undefined`，且不是字符串，则会抛出 [`Error`][]。
  * 如果 `urlObject.port` 属性值为真值，且 `urlObject.hostname` 不是 `undefined`：
    * 文本字符串 `:` 会被追加到 `result`，且
    * `urlObject.port` 的值会被强制转换为字符串，并被追加到 `result`。
* 否则，如果 `urlObject.host` 属性的值为真值，`urlObject.host` 的值会被强制转换为字符串，且被追加到 `result`。
* 如果 `urlObject.pathname` 属性是非空字符串：
  * 如果 `urlObject.pathname` *不是以* ASCII 编码中的斜杠 (`/`) 开始，则文本字符串 '/' 会被追加到 `result`。
  * `urlObject.pathname` 的值被追加到 `result`。
* 否则，如果 `urlObject.pathname` 不是 `undefined`，且不是字符串，会抛出 [`Error`][]。
* 如果 `urlObject.search` 属性为 `undefined`，同时如果 `urlObject.query` 属性是一个 `Object`，文本字符串 `?` 会被追加到 `result`，其后是将 `urlObject.query` 的值传递给 [`querystring`][] 模块的 `stringify()` 方法的输出结果。
* 否则，如果 `urlObject.search` 是字符串：
  * 如果 `urlObject.search` 的值 *不以* ASCII 编码的问号 (`?`) 字符开头，文本字符串 `?` 会被追加到 `result`。
  * `urlObject.search` 的值被追加到 `result`。
* 否则，如果 `urlObject.search` 不是 `undefined`，且不是字符串，会抛出 [`Error`][] 。
* 如果 `urlObject.hash` 属性是字符串：
  * 如果 `urlObject.hash` 的值 *不以* ASCII 编码中的哈希 (`#`) 字符开始，文本字符串 `#` 会被追加到 `result`。
  * `urlObject.hash` 的值会被追加到 `result`。
* 否则，如果 `urlObject.hash` 属性不是 `undefined`，且不是字符串，会抛出 [`Error`][]。
* 返回 `result`。


### url.parse(urlString[, parseQueryString[, slashesDenoteHost]])
<!-- YAML
added: v0.1.25
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/13606
    description: The `search` property on the returned URL object is now `null`
                 when no query string is present.
-->

* `urlString` {string} 要被解析的 URL 字符串。
* `parseQueryString` {boolean} 如果为 `true`，`query` 属性会被赋予到 [`querystring`][] 模块的 `parse()` 方法返回的对象中。 如果为 `false`，返回的 URL 对象中的 `query` 属性则为未解析和未解码的字符串。 **默认:** `false`.
* `slashesDenoteHost` {boolean} 如果为 `true`，则文本字符串 `//` 之后的首个字符到下个 `/` 符号之前的所有字符会被解析为 `host`。 例如，对于给定的 `//foo/bar`，解析结果是 `{host: 'foo', pathname: '/bar'}`，而不是 `{pathname: '//foo/bar'}`。 **默认:** `false`.

`url.parse()` 方法接受 URL 字符串作为参数，并将其解析，返回一个 URL 对象。

如果 `urlString` 不是字符串，则会抛出 `TypeError`。

如果 `auth` 属性存在但无法被解码，则会抛出 `URIError`。

### url.resolve(from, to)
<!-- YAML
added: v0.1.25
changes:
  - version: v6.6.0
    pr-url: https://github.com/nodejs/node/pull/8215
    description: The `auth` fields are now kept intact when `from` and `to`
                 refer to the same host.
  - version: v6.5.0, v4.6.2
    pr-url: https://github.com/nodejs/node/pull/8214
    description: The `port` field is copied correctly now.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/1480
    description: The `auth` fields is cleared now the `to` parameter
                 contains a hostname.
-->

* `from` {string} 要进行解析的基础 URL。
* `to` {string} 要进行解析的 HREF URL。

`url.resolve()` 解析相对于基础 URL 的目标 URL，解析过程类似于浏览器解析锚标记HREF。

例如：

```js
const url = require('url');
url.resolve('/one/two/three', 'four');         // '/one/two/four'
url.resolve('http://example.com/', '/one');    // 'http://example.com/one'
url.resolve('http://example.com/one', '/two'); // 'http://example.com/two'
```

<a id="whatwg-percent-encoding"></a>

## URL 中的百分比编码

在 URL 中只允许包含特定范围内的字符。 任何该范围之外的字符都必须进行编码。 如何对这些字符进行编码，以及哪些字符需要编码，完全取决于字符在 URL 结构中的位置。

### 旧版本 API

在旧版本 API 中，在 URL 对象属性中的空格 (`' '`) 和以下字符都将被自动进行转义：

```txt
< > " ` \r \n \t { } | \ ^ '
```

例如，ASCII 编码中的空格 (`' '`) 会被编码为 `%20`。 ASCII 编码中的斜杠 (`/`) 字符会被编码为 `%3C`。

### WHATWG API

[WHATWG URL 标准](https://url.spec.whatwg.org/) 使用比Legacy API 所使用的更具选择性和细粒度的方法来选择编码字符。

The WHATWG algorithm defines four "percent-encode sets" that describe ranges of characters that must be percent-encoded:

* *C0 控制百分比编码集* 包含从 U+0000 到 U+001F (含) 范围内的代码点和大于 U+007E 的所有代码点。

* The *fragment percent-encode set* includes the *C0 control percent-encode set* and code points U+0020, U+0022, U+003C, U+003E, and U+0060.

* The *path percent-encode set* includes the *C0 control percent-encode set* and code points U+0020, U+0022, U+0023, U+003C, U+003E, U+003F, U+0060, U+007B, and U+007D.

* The *userinfo encode set* includes the *path percent-encode set* and code points U+002F, U+003A, U+003B, U+003D, U+0040, U+005B, U+005C, U+005D, U+005E, and U+007C.

*userinfo 百分比编码集* 专用于在 URL 中用户名和密码的编码。 *路径百分比编码集* 用于大多数 URL 的路径。 The *fragment percent-encode set* is used for URL fragments. The *C0 control percent-encode set* is used for host and path under certain specific conditions, in addition to all other cases.

当非 ASCII 编码字符出现在主机名中时，主机名将使用 [Punycode](https://tools.ietf.org/html/rfc5891#section-4.4) 算法进行编码。 然而，请注意，主机名 *可能* 包含 Punycode 编码 *和* 百分比编码的字符。 例如：

```js
const { URL } = require('url');
const myURL = new URL('https://%CF%80.com/foo');
console.log(myURL.href);
// Prints https://xn--1xa.com/foo
console.log(myURL.origin);
// Prints https://π.com
```
