# URL

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Il modulo `url` fornisce utility per la risoluzione e l'analisi dell'URL. Ci si può accedere utilizzando:

```js
const url = require('url');
```

## Stringhe URL e URL Objects

Una stringa URL è una stringa strutturata contenente più componenti significativi. When parsed, a URL object is returned containing properties for each of these components.

The `url` module provides two APIs for working with URLs: a legacy API that is Node.js specific, and a newer API that implements the same [WHATWG URL Standard](https://url.spec.whatwg.org/) used by web browsers.

*Note*: While the Legacy API has not been deprecated, it is maintained solely for backwards compatibility with existing applications. New application code should use the WHATWG API.

Di seguito viene fornito un confronto tra le API WHATWG e Legacy. Above the URL `'http://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash'`, properties of an object returned by the legacy `url.parse()` are shown. Below it are properties of a WHATWG `URL` object.

*Note*: WHATWG URL's `origin` property includes `protocol` and `host`, but not `username` or `password`.

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
(tutti gli spazi nella linea "" devono essere ignorati — sono presenti semplicemente per la formattazione)
```

Analisi della stringa URL utilizzando l'API WHATWG:

```js
const { URL } = require('url');
const myURL =
  new URL('https://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash');
```

*Note*: In Web Browsers, the WHATWG `URL` class is a global that is always available. In Node.js, however, the `URL` class must be accessed via `require('url').URL`.

Analisi della stringa URL utilizzando l'API Legacy:

```js
const url = require('url');
const myURL =
  url.parse('https://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash');
```

## L'API di WHATWG URL

<!-- YAML
added: v7.0.0
-->

### Class: URL

Browser-compatible `URL` class, implemented by following the WHATWG URL Standard. [Esempi di URL analizzati](https://url.spec.whatwg.org/#example-url-parsing) possono essere trovati nello Standard stesso.

*Note*: In accordance with browser conventions, all properties of `URL` objects are implemented as getters and setters on the class prototype, rather than as data properties on the object itself. Thus, unlike [legacy urlObject](#url_legacy_urlobject)s, using the `delete` keyword on any properties of `URL` objects (e.g. `delete
myURL.protocol`, `delete myURL.pathname`, etc) has no effect but will still return `true`.

#### Constructor: new URL(input[, base])

* `input` {string} The input URL to parse
* `base` {string|URL} The base URL to resolve against if the `input` is not absolute.

Crea un nuovo `URL` object analizzando l'`input` relativo alla `base`. If `base` is passed as a string, it will be parsed equivalent to `new URL(base)`.

```js
const { URL } = require('url');
const myURL = new URL('/foo', 'https://example.org/');
// https://example.org/foo
```

Verrà generato un `TypeError` se l'`input` o la `base` non sono URL validi. Note that an effort will be made to coerce the given values into strings. Ad esempio:

```js
const { URL } = require('url');
const myURL = new URL({ toString: () => 'https://example.org/' });
// https://example.org/
```

Unicode characters appearing within the hostname of `input` will be automatically converted to ASCII using the [Punycode](https://tools.ietf.org/html/rfc5891#section-4.4) algorithm.

```js
const { URL } = require('url');
const myURL = new URL('https://你好你好');
// https://xn--6qqa088eba/
```

*Note*: This feature is only available if the `node` executable was compiled with [ICU](intl.html#intl_options_for_building_node_js) enabled. In caso contrario, i nomi di dominio vengono passati invariati.

#### url.hash

* {string}

Ottiene e imposta la parte frammento dell'URL.

```js
const { URL } = require('url');
const myURL = new URL('https://example.org/foo#bar');
console.log(myURL.hash);
// Prints #bar

myURL.hash = 'baz';
console.log(myURL.href);
// Prints https://example.org/foo#baz
```

Invalid URL characters included in the value assigned to the `hash` property are [percent-encoded](#whatwg-percent-encoding). Note that the selection of which characters to percent-encode may vary somewhat from what the [`url.parse()`][] and [`url.format()`][] methods would produce.

#### url.host

* {string}

Ottiene e imposta la parte host dell'URL.

```js
const { URL } = require('url');
const myURL = new URL('https://example.org:81/foo');
console.log(myURL.host);
// Prints example.org:81

myURL.host = 'example.com:82';
console.log(myURL.href);
// Prints https://example.com:82/foo
```

I valori host non validi assegnati alla proprietà `host` vengono ignorati.

#### url.hostname

* {string}

Ottiene e imposta la parte hostname dell'URL. The key difference between `url.host` and `url.hostname` is that `url.hostname` does *not* include the port.

```js
const { URL } = require('url');
const myURL = new URL('https://example.org:81/foo');
console.log(myURL.hostname);
// Prints example.org

myURL.hostname = 'example.com:82';
console.log(myURL.href);
// Prints https://example.com:81/foo
```

I valori degli hostname non validi assegnati alla proprietà `hostname` vengono ignorati.

#### url.href

* {string}

Ottiene e imposta l'URL serializzato.

```js
const { URL } = require('url');
const myURL = new URL('https://example.org/foo');
console.log(myURL.href);
// Prints https://example.org/foo

myURL.href = 'https://example.com/bar';
console.log(myURL.href);
// Prints https://example.com/bar
```

Getting the value of the `href` property is equivalent to calling [`url.toString()`][].

Setting the value of this property to a new value is equivalent to creating a new `URL` object using [`new URL(value)`][`new URL()`]. Each of the `URL` object's properties will be modified.

If the value assigned to the `href` property is not a valid URL, a `TypeError` will be thrown.

#### url.origin

* {string}

Ottiene la serializzazione di sola lettura dell'origine dell'URL.

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

Ottiene e imposta la parte password dell'URL.

```js
const { URL } = require('url');
const myURL = new URL('https://abc:xyz@example.com');
console.log(myURL.password);
// Prints xyz

myURL.password = '123';
console.log(myURL.href);
// Prints https://abc:123@example.com
```

Invalid URL characters included in the value assigned to the `password` property are [percent-encoded](#whatwg-percent-encoding). Note that the selection of which characters to percent-encode may vary somewhat from what the [`url.parse()`][] and [`url.format()`][] methods would produce.

#### url.pathname

* {string}

Ottiene e imposta la parte percorso dell'URL.

```js
const { URL } = require('url');
const myURL = new URL('https://example.org/abc/xyz?123');
console.log(myURL.pathname);
// Prints /abc/xyz

myURL.pathname = '/abcdef';
console.log(myURL.href);
// Prints https://example.org/abcdef?123
```

Invalid URL characters included in the value assigned to the `pathname` property are [percent-encoded](#whatwg-percent-encoding). Note that the selection of which characters to percent-encode may vary somewhat from what the [`url.parse()`][] and [`url.format()`][] methods would produce.

#### url.port

* {string}

Ottiene e imposta la parte porta dell'URL.

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

The port value may be set as either a number or as a String containing a number in the range `0` to `65535` (inclusive). Setting the value to the default port of the `URL` objects given `protocol` will result in the `port` value becoming the empty string (`''`).

If an invalid string is assigned to the `port` property, but it begins with a number, the leading number is assigned to `port`. Otherwise, or if the number lies outside the range denoted above, it is ignored.

#### url.protocol

* {string}

Ottiene e imposta la parte protocollo dell'URL.

```js
const { URL } = require('url');
const myURL = new URL('https://example.org');
console.log(myURL.protocol);
// Prints https:

myURL.protocol = 'ftp';
console.log(myURL.href);
// Prints ftp://example.org/
```

I valori del protocollo URL non validi assegnati alla proprietà `protocol` vengono ignorati.

#### url.search

* {string}

Ottiene e imposta la parte query serializzata dell'URL.

```js
const { URL } = require('url');
const myURL = new URL('https://example.org/abc?123');
console.log(myURL.search);
// Prints ?123

myURL.search = 'abc=xyz';
console.log(myURL.href);
// Prints https://example.org/abc?abc=xyz
```

Any invalid URL characters appearing in the value assigned the `search` property will be [percent-encoded](#whatwg-percent-encoding). Note that the selection of which characters to percent-encode may vary somewhat from what the [`url.parse()`][] and [`url.format()`][] methods would produce.

#### url.searchParams

* {URLSearchParams}

Gets the [`URLSearchParams`][] object representing the query parameters of the URL. This property is read-only; to replace the entirety of query parameters of the URL, use the [`url.search`][] setter. See [`URLSearchParams`][] documentation for details.

#### url.username

* {string}

Ottiene e imposta la parte username dell'URL.

```js
const { URL } = require('url');
const myURL = new URL('https://abc:xyz@example.com');
console.log(myURL.username);
// Prints abc

myURL.username = '123';
console.log(myURL.href);
// Prints https://123:xyz@example.com/
```

Any invalid URL characters appearing in the value assigned the `username` property will be [percent-encoded](#whatwg-percent-encoding). Note that the selection of which characters to percent-encode may vary somewhat from what the [`url.parse()`][] and [`url.format()`][] methods would produce.

#### url.toString()

* Restituisce: {string}

Il metodo `toString()` sull'`URL` object restituisce l'URL serializzato. The value returned is equivalent to that of [`url.href`][] and [`url.toJSON()`][].

Because of the need for standard compliance, this method does not allow users to customize the serialization process of the URL. For more flexibility, [`require('url').format()`][] method might be of interest.

#### url.toJSON()

* Restituisce: {string}

Il metodo `toJSON()` sull'`URL` object restituisce l'URL serializzato. The value returned is equivalent to that of [`url.href`][] and [`url.toString()`][].

This method is automatically called when an `URL` object is serialized with [`JSON.stringify()`][].

```js
const { URL } = require('url');
const myURLs = [
  new URL('https://www.example.com'),
  new URL('https://test.example.org')
];
console.log(JSON.stringify(myURLs));
// Prints ["https://www.example.com/","https://test.example.org/"]
```

### Class: URLSearchParams

<!-- YAML
added: v7.5.0
-->

The `URLSearchParams` API provides read and write access to the query of a `URL`. The `URLSearchParams` class can also be used standalone with one of the four following constructors.

The WHATWG `URLSearchParams` interface and the [`querystring`][] module have similar purpose, but the purpose of the [`querystring`][] module is more general, as it allows the customization of delimiter characters (`&` and `=`). D'altra parte, questa API è progettata esclusivamente per stringhe di query URL.

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

#### Constructor: new URLSearchParams()

Istanziare un nuovo `URLSearchParams` object vuoto.

#### Constructor: new URLSearchParams(string)

* `string` {string} Una stringa di query

Parse the `string` as a query string, and use it to instantiate a new `URLSearchParams` object. Un `'?'` iniziale, se presente, viene ignorato.

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

#### Constructor: new URLSearchParams(obj)

<!-- YAML
added: v7.10.0
-->

* `obj` {Object} Un object che rappresenta una raccolta di coppie chiave-valore

Istanziare un nuovo `URLSearchParams` object con una mappa hash di query. The key and value of each property of `obj` are always coerced to strings.

*Note*: Unlike [`querystring`][] module, duplicate keys in the form of array values are not allowed. Arrays are stringified using [`array.toString()`][], which simply joins all array elements with commas.

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

#### Constructor: new URLSearchParams(iterable)

<!-- YAML
added: v7.10.0
-->

* `iterable` {Iterable} Un object iterabile i cui elementi sono coppie chiave-valore

Instantiate a new `URLSearchParams` object with an iterable map in a way that is similar to [`Map`][]'s constructor. `iterable` can be an Array or any iterable object. That means `iterable` can be another `URLSearchParams`, in which case the constructor will simply create a clone of the provided `URLSearchParams`. Elements of `iterable` are key-value pairs, and can themselves be any iterable object.

Sono consentite chiavi duplicate.

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

Aggiungi una nuova coppia nome-valore alla stringa di query.

#### urlSearchParams.delete(name)

* `name` {string}

Rimuovi tutte le coppie nome-valore il cui nome è `name`.

#### urlSearchParams.entries()

* Restituisce: {Iterator}

Restituisce un Iterator di ES6 su ciascuna delle coppie nome-valore nella query. Ogni elemento dell'iteratore è un Array di JavaScript. The first item of the Array is the `name`, the second item of the Array is the `value`.

Alias per [`urlSearchParams[@@iterator]()`][`urlSearchParams@@iterator()`].

#### urlSearchParams.forEach(fn[, thisArg])

* `fn` {Function} Function invoked for each name-value pair in the query.
* `thisArg` {Object} Object to be used as `this` value for when `fn` is called

Itera su ciascuna coppia nome-valore nella query ed invoca la funzione specificata.

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
* Returns: {string} or `null` if there is no name-value pair with the given `name`.

Restituisce il valore della prima coppia nome-valore il cui nome è `name`. If there are no such pairs, `null` is returned.

#### urlSearchParams.getAll(name)

* `name` {string}
* Restituisce: {Array}

Restituisce i valori di tutte le coppie nome-valore il cui nome è `name`. If there are no such pairs, an empty array is returned.

#### urlSearchParams.has(name)

* `name` {string}
* Restituisce: {boolean}

Restituisce `true` se esiste almeno una coppia nome-valore il cui nome è `name`.

#### urlSearchParams.keys()

* Restituisce: {Iterator}

Restituisce un Iterator di ES6 sui nomi di ciascuna coppia nome-valore.

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

Sets the value in the `URLSearchParams` object associated with `name` to `value`. If there are any pre-existing name-value pairs whose names are `name`, set the first such pair's value to `value` and remove all others. If not, append the name-value pair to the query string.

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

Ordina tutte le coppie nome-valore esistenti a seconda del loro nome. Sorting is done with a [stable sorting algorithm](https://en.wikipedia.org/wiki/Sorting_algorithm#Stability), so relative order between name-value pairs with the same name is preserved.

Questo metodo può essere utilizzato, in particolare, per aumentare i cache hit.

```js
const { URLSearchParams } = require('url');
const params = new URLSearchParams('query[]=abc&type=search&query[]=123');
params.sort();
console.log(params.toString());
// Prints query%5B%5D=abc&query%5B%5D=123&type=search
```

#### urlSearchParams.toString()

* Restituisce: {string}

Returns the search parameters serialized as a string, with characters percent-encoded where necessary.

#### urlSearchParams.values()

* Restituisce: {Iterator}

Restituisce un Iterator di ES6 sui valori di ciascuna coppia nome-valore.

#### urlSearchParams\[@@iterator\]()

* Restituisce: {Iterator}

Restituisce un Iterator di ES6 su ciascuna delle coppie nome-valore nella stringa di query. Ogni elemento dell'iteratore è un Array di JavaScript. The first item of the Array is the `name`, the second item of the Array is the `value`.

Alias per [`urlSearchParams.entries()`][].

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
* Restituisce: {string}

Restituisce la serializzazione ASCII [Punycode](https://tools.ietf.org/html/rfc5891#section-4.4) del `domain`. If `domain` is an invalid domain, the empty string is returned.

Esegue l'operazione inversa su [`url.domainToUnicode()`][].

```js
const url = require('url');
console.log(url.domainToASCII('español.com'));
// Stampa xn--espaol-zwa.com
console.log(url.domainToASCII('中文.com'));
// Stampa xn--fiq228c.com
console.log(url.domainToASCII('xn--iñvalid.com'));
// Stampa una stringa vuota
```

### url.domainToUnicode(domain)

<!-- YAML
added: v7.4.0
-->

* `domain` {string}
* Restituisce: {string}

Restituisce la serializzazione Unicode del `domain`. If `domain` is an invalid domain, the empty string is returned.

Esegue l'operazione inversa su [`url.domainToASCII()`][].

```js
const url = require('url');
console.log(url.domainToUnicode('xn--espaol-zwa.com'));
// Stampa español.com
console.log(url.domainToUnicode('xn--fiq228c.com'));
// Stampa 中文.com
console.log(url.domainToUnicode('xn--iñvalid.com'));
//Stampa una stringa vuota
```

### url.format(URL[, options])

<!-- YAML
added: v7.6.0
-->

* `URL` {URL} Un [WHATWG URL](#url_the_whatwg_url_api) object
* `options` {Object} 
  * `auth` {boolean} `true` if the serialized URL string should include the username and password, `false` otherwise. **Default:** `true`.
  * `fragment` {boolean} `true` if the serialized URL string should include the fragment, `false` otherwise. **Default:** `true`.
  * `search` {boolean} `true` if the serialized URL string should include the search query, `false` otherwise. **Default:** `true`.
  * `unicode` {boolean} `true` if Unicode characters appearing in the host component of the URL string should be encoded directly as opposed to being Punycode encoded. **Default:** `false`.

Returns a customizable serialization of a URL String representation of a [WHATWG URL](#url_the_whatwg_url_api) object.

The URL object has both a `toString()` method and `href` property that return string serializations of the URL. These are not, however, customizable in any way. The `url.format(URL[, options])` method allows for basic customization of the output.

Per esempio:

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

## API Legacy dell'URL

### Legacy urlObject

The legacy urlObject (`require('url').Url`) is created and returned by the `url.parse()` function.

#### urlObject.auth

The `auth` property is the username and password portion of the URL, also referred to as "userinfo". This string subset follows the `protocol` and double slashes (if present) and precedes the `host` component, delimited by an ASCII "at sign" (`@`). The format of the string is `{username}[:{password}]`, with the `[:{password}]` portion being optional.

Per esempio: `'user:pass'`

#### urlObject.hash

The `hash` property consists of the "fragment" portion of the URL including the leading ASCII hash (`#`) character.

Per esempio: `'#hash'`

#### urlObject.host

The `host` property is the full lower-cased host portion of the URL, including the `port` if specified.

Per esempio: `'sub.host.com:8080'`

#### urlObject.hostname

The `hostname` property is the lower-cased host name portion of the `host` component *without* the `port` included.

Per esempio: `'sub.host.com'`

#### urlObject.href

The `href` property is the full URL string that was parsed with both the `protocol` and `host` components converted to lower-case.

Per esempio: `'http://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash'`

#### urlObject.path

The `path` property is a concatenation of the `pathname` and `search` components.

Per esempio: `'/p/a/t/h?query=string'`

Non viene eseguita alcuna decodifica del `path`.

#### urlObject.pathname

La proprietà `pathname` è costituita dall'intera sezione del percorso dell'URL. This is everything following the `host` (including the `port`) and before the start of the `query` or `hash` components, delimited by either the ASCII question mark (`?`) or hash (`#`) characters.

Per esempio `'/p/a/t/h'`

Non viene eseguita alcuna decodifica della stringa del percorso.

#### urlObject.port

La proprietà `port` è la porzione numerica della porta del componente `host`.

Per esempio: `'8080'`

#### urlObject.protocol

La proprietà del `protocol` identifica lo schema del protocollo dell'URL in minuscolo.

Per esempio: `'http:'`

#### urlObject.query

The `query` property is either the query string without the leading ASCII question mark (`?`), or an object returned by the [`querystring`][] module's `parse()` method. Whether the `query` property is a string or object is determined by the `parseQueryString` argument passed to `url.parse()`.

Per esempio: `'query=string'` o `{'query': 'string'}`

Se restituito come stringa, non viene eseguita alcuna decodifica della stringa di query. If returned as an object, both keys and values are decoded.

#### urlObject.search

The `search` property consists of the entire "query string" portion of the URL, including the leading ASCII question mark (`?`) character.

Per esempio: `'?query=string'`

Non viene eseguita alcuna decodifica della stringa di query.

#### urlObject.slashes

The `slashes` property is a `boolean` with a value of `true` if two ASCII forward-slash characters (`/`) are required following the colon in the `protocol`.

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

* `urlObject` {Object|string} A URL object (as returned by `url.parse()` or constructed otherwise). If a string, it is converted to an object by passing it to `url.parse()`.

The `url.format()` method returns a formatted URL string derived from `urlObject`.

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

If `urlObject` is not an object or a string, `url.format()` will throw a [`TypeError`][].

Il processo di formattazione funziona come segue:

* Viene creata un nuovo stringa vuota `result`.
* Se `urlObject.protocol` è una stringa, viene aggiunta così com'è a `result`.
* Otherwise, if `urlObject.protocol` is not `undefined` and is not a string, an [`Error`][] is thrown.
* For all string values of `urlObject.protocol` that *do not end* with an ASCII colon (`:`) character, the literal string `:` will be appended to `result`.
* If either of the following conditions is true, then the literal string `//` will be appended to `result`: * `urlObject.slashes` property is true; * `urlObject.protocol` begins with `http`, `https`, `ftp`, `gopher`, or `file`;
* If the value of the `urlObject.auth` property is truthy, and either `urlObject.host` or `urlObject.hostname` are not `undefined`, the value of `urlObject.auth` will be coerced into a string and appended to `result` followed by the literal string `@`.
* Se la proprietà `urlObject.host` è `undefined` allora: 
  * Se l'`urlObject.hostname` è una stringa, viene aggiunta al `result`.
  * Otherwise, if `urlObject.hostname` is not `undefined` and is not a string, an [`Error`][] is thrown.
  * If the `urlObject.port` property value is truthy, and `urlObject.hostname` is not `undefined`: 
    * La stringa letterale `:` viene aggiunta al `result` e
    * The value of `urlObject.port` is coerced to a string and appended to `result`.
* Otherwise, if the `urlObject.host` property value is truthy, the value of `urlObject.host` is coerced to a string and appended to `result`.
* Se la proprietà `urlObject.pathname` è una stringa che non è una stringa vuota: 
  * If the `urlObject.pathname` *does not start* with an ASCII forward slash (`/`), then the literal string '/' is appended to `result`.
  * Il valore di `urlObject.pathname` viene aggiunto al `result`.
* Otherwise, if `urlObject.pathname` is not `undefined` and is not a string, an [`Error`][] is thrown.
* If the `urlObject.search` property is `undefined` and if the `urlObject.query` property is an `Object`, the literal string `?` is appended to `result` followed by the output of calling the [`querystring`][] module's `stringify()` method passing the value of `urlObject.query`.
* Altrimenti, se `urlObject.search` è una stringa: 
  * If the value of `urlObject.search` *does not start* with the ASCII question mark (`?`) character, the literal string `?` is appended to `result`.
  * Il valore di `urlObject.search` viene aggiunto al `result`.
* Otherwise, if `urlObject.search` is not `undefined` and is not a string, an [`Error`][] is thrown.
* Se la proprietà `urlObject.hash` è una stringa: 
  * If the value of `urlObject.hash` *does not start* with the ASCII hash (`#`) character, the literal string `#` is appended to `result`.
  * Il valore di `urlObject.hash` viene aggiunto al `result`.
* Otherwise, if the `urlObject.hash` property is not `undefined` and is not a string, an [`Error`][] is thrown.
* Viene restituito `result`.

### url.parse(urlString[, parseQueryString[, slashesDenoteHost]])

<!-- YAML
added: v0.1.25
changes:

  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/13606
    description: The `search` property on the returned URL object is now `null`
                 when no query string is present.
-->

* `urlString` {string} La stringa dell'URL da analizzare.
* `parseQueryString` {boolean} If `true`, the `query` property will always be set to an object returned by the [`querystring`][] module's `parse()` method. If `false`, the `query` property on the returned URL object will be an unparsed, undecoded string. **Default:** `false`.
* `slashesDenoteHost` {boolean} If `true`, the first token after the literal string `//` and preceding the next `/` will be interpreted as the `host`. For instance, given `//foo/bar`, the result would be `{host: 'foo', pathname: '/bar'}` rather than `{pathname: '//foo/bar'}`. **Default:** `false`.

The `url.parse()` method takes a URL string, parses it, and returns a URL object.

Verrà generato un `TypeError` se `urlString` non è una stringa.

Viene generato un `URIError` se la proprietà `auth` è presente ma non può essere decodificata.

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

* `from` {string} L'URL di Base da risolvere.
* `to` {string} L'URL di HREF da risolvere.

The `url.resolve()` method resolves a target URL relative to a base URL in a manner similar to that of a Web browser resolving an anchor tag HREF.

Per esempio:

```js
const url = require('url');
url.resolve('/one/two/three', 'four');         // '/one/two/four'
url.resolve('http://example.com/', '/one');    // 'http://example.com/one'
url.resolve('http://example.com/one', '/two'); // 'http://example.com/two'
```

<a id="whatwg-percent-encoding"></a>

## Codifica Percentuale negli URL

Gli URL sono autorizzati a contenere esclusivamente un determinato intervallo di caratteri. Any character falling outside of that range must be encoded. How such characters are encoded, and which characters to encode depends entirely on where the character is located within the structure of the URL.

### API Legacy

Within the Legacy API, spaces (`' '`) and the following characters will be automatically escaped in the properties of URL objects:

```txt
< > " ` \r \n \t { } | \ ^ '
```

Ad esempio, Il carattere ASCII spazio (`' '`) viene codificato come `%20`. The ASCII forward slash (`/`) character is encoded as `%3C`.

### API di WHATWG

The [WHATWG URL Standard](https://url.spec.whatwg.org/) uses a more selective and fine grained approach to selecting encoded characters than that used by the Legacy API.

The WHATWG algorithm defines four "percent-encode sets" that describe ranges of characters that must be percent-encoded:

* The *C0 control percent-encode set* includes code points in range U+0000 to U+001F (inclusive) and all code points greater than U+007E.

* The *fragment percent-encode set* includes the *C0 control percent-encode set* and code points U+0020, U+0022, U+003C, U+003E, and U+0060.

* The *path percent-encode set* includes the *C0 control percent-encode set* and code points U+0020, U+0022, U+0023, U+003C, U+003E, U+003F, U+0060, U+007B, and U+007D.

* The *userinfo encode set* includes the *path percent-encode set* and code points U+002F, U+003A, U+003B, U+003D, U+0040, U+005B, U+005C, U+005D, U+005E, and U+007C.

The *userinfo percent-encode set* is used exclusively for username and passwords encoded within the URL. The *path percent-encode set* is used for the path of most URLs. Il *set di codifica percentuale del frammento* viene utilizzato per i frammenti degli URL. The *C0 control percent-encode set* is used for host and path under certain specific conditions, in addition to all other cases.

When non-ASCII characters appear within a hostname, the hostname is encoded using the [Punycode](https://tools.ietf.org/html/rfc5891#section-4.4) algorithm. Note, however, that a hostname *may* contain *both* Punycode encoded and percent-encoded characters. Per esempio:

```js
const { URL } = require('url');
const myURL = new URL('https://%CF%80.com/foo');
console.log(myURL.href);
// Prints https://xn--1xa.com/foo
console.log(myURL.origin);
// Prints https://π.com
```