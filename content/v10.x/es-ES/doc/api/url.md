# URL

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

El módulo `url` proporciona utilidades para la resolución y análisis de URL. Se puede acceder al mismo utilizando:

```js
const url = require('url');
```

## Strings de URL y Objetos URL

Una string URL es una string estructurada que contiene múltiples componentes significativos. When parsed, a URL object is returned containing properties for each of these components.

The `url` module provides two APIs for working with URLs: a legacy API that is Node.js specific, and a newer API that implements the same [WHATWG URL Standard](https://url.spec.whatwg.org/) used by web browsers.

While the Legacy API has not been deprecated, it is maintained solely for backwards compatibility with existing applications. New application code should use the WHATWG API.

A continuación, se proporciona una comparación entre el WHATWG y las APIs heredadas. Above the URL `'http://user:pass@sub.example.com:8080/p/a/t/h?query=string#hash'`, properties of an object returned by the legacy `url.parse()` are shown. Below it are properties of a WHATWG `URL` object.

WHATWG URL's `origin` property includes `protocol` and `host`, but not `username` or `password`.

```txt
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              href                                              │
├──────────┬──┬─────────────────────┬────────────────────────┬───────────────────────────┬───────┤
│ protocol │  │        auth         │          host          │           path            │ hash  │
│          │  │                     ├─────────────────┬──────┼──────────┬────────────────┤       │
│          │  │                     │    hostname     │ port │ pathname │     search     │       │
│          │  │                     │                 │      │          ├─┬──────────────┤       │
│          │  │                     │                 │      │          │ │    query     │       │
"  https:   //    user   :   pass   @ sub.example.com : 8080   /p/a/t/h  ?  query=string   #hash "
│          │  │          │          │    hostname     │ port │          │                │       │
│          │  │          │          ├─────────────────┴──────┤          │                │       │
│ protocol │  │ username │ password │          host          │          │                │       │
├──────────┴──┼──────────┴──────────┼────────────────────────┤          │                │       │
│   origin    │                     │         origin         │ pathname │     search     │ hash  │
├─────────────┴─────────────────────┴────────────────────────┴──────────┴────────────────┴───────┤
│                                              href                                              │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
(all spaces in the "" line should be ignored — they are purely for formatting)
```

Analizar la string de URL utilizando la API WHATWG:

```js
const myURL =
  new URL('https://user:pass@sub.example.com:8080/p/a/t/h?query=string#hash');
```

Analizar la string de URL usando la API Heredada:

```js
const url = require('url');
const myURL =
  url.parse('https://user:pass@sub.example.com:8080/p/a/t/h?query=string#hash');
```

## La WHATWG URL API

### Clase: URL

<!-- YAML
added:

  - v7.0.0
  - v6.13.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18281
    description: The class is now available on the global object.
-->

Browser-compatible `URL` class, implemented by following the WHATWG URL Standard. [Ejemplos de URLs analizadas](https://url.spec.whatwg.org/#example-url-parsing) pueden ser encontradas en el mismo Estándar. La clase `URL` también está disponible en el objeto global.

In accordance with browser conventions, all properties of `URL` objects are implemented as getters and setters on the class prototype, rather than as data properties on the object itself. Thus, unlike [legacy `urlObject`][]s, using the `delete` keyword on any properties of `URL` objects (e.g. `delete
myURL.protocol`, `delete myURL.pathname`, etc) has no effect but will still return `true`.

#### Constructor: new URL(input[, base])

* `input` {string} La entrada URL absoluta o relativa a analizar. If `input` is relative, then `base` is required. If `input` is absolute, the `base` is ignored.
* `base` {string|URL} The base URL to resolve against if the `input` is not absolute.

Crea un nuevo objeto `URL` al analizar la `input` relativa a la `base`. If `base` is passed as a string, it will be parsed equivalent to `new URL(base)`.

```js
const myURL = new URL('/foo', 'https://example.org/');
// https://example.org/foo
```

Se producirá un `TypeError` si la `input` o `base` no son URLs válidas. Note that an effort will be made to coerce the given values into strings. Por ejemplo:

```js
const myURL = new URL({ toString: () => 'https://example.org/' });
// https://example.org/
```

Unicode characters appearing within the hostname of `input` will be automatically converted to ASCII using the [Punycode](https://tools.ietf.org/html/rfc5891#section-4.4) algorithm.

```js
const myURL = new URL('https://測試');
// https://xn--g6w251d/
```

This feature is only available if the `node` executable was compiled with [ICU](intl.html#intl_options_for_building_node_js) enabled. Si no, los nombres de dominio son pasados sin cambios.

In cases where it is not known in advance if `input` is an absolute URL and a `base` is provided, it is advised to validate that the `origin` of the `URL` object is what is expected.

```js
let myURL = new URL('http://Example.com/', 'https://example.org/');
// http://example.com/

myURL = new URL('https://Example.com/', 'https://example.org/');
// https://example.com/

myURL = new URL('foo://Example.com/', 'https://example.org/');
// foo://Example.com/

myURL = new URL('http:Example.com/', 'https://example.org/');
// http://example.com/

myURL = new URL('https:Example.com/', 'https://example.org/');
// https://example.org/Example.com/

myURL = new URL('foo:Example.com/', 'https://example.org/');
// foo:Example.com/
```

#### url.hash

* {string}

Obtiene y establece la porción fragmentaria del URL.

```js
const myURL = new URL('https://example.org/foo#bar');
console.log(myURL.hash);
// Imprime #bar

myURL.hash = 'baz';
console.log(myURL.href);
// Imprime https://example.org/foo#baz
```

Invalid URL characters included in the value assigned to the `hash` property are [percent-encoded](#whatwg-percent-encoding). Note that the selection of which characters to percent-encode may vary somewhat from what the [`url.parse()`][] and [`url.format()`][] methods would produce.

#### url.host

* {string}

Obtiene y establece la porción del host del URL.

```js
const myURL = new URL('https://example.org:81/foo');
console.log(myURL.host);
// Imprime example.org:81

myURL.host = 'example.com:82';
console.log(myURL.href);
// Imprime https://example.com:82/foo
```

Los valores de hosts inválidos asignados a la propiedad `host` son ignorados.

#### url.hostname

* {string}

Obtiene y establece la porción del nombre de host del URL. The key difference between `url.host` and `url.hostname` is that `url.hostname` does *not* include the port.

```js
const myURL = new URL('https://example.org:81/foo');
console.log(myURL.hostname);
// Imprime example.org

myURL.hostname = 'example.com:82';
console.log(myURL.href);
// Imprime https://example.com:81/foo
```

Valores de hostname inválidos asignados a la propiedad `hostname` son ignorados.

#### url.href

* {string}

Obtiene y establece la URL serializada.

```js
const myURL = new URL('https://example.org/foo');
console.log(myURL.href);
// Imprime https://example.org/foo

myURL.href = 'https://example.com/bar';
console.log(myURL.href);
// Imprime https://example.com/bar
```

Getting the value of the `href` property is equivalent to calling [`url.toString()`][].

Setting the value of this property to a new value is equivalent to creating a new `URL` object using [`new URL(value)`][`new URL()`]. Each of the `URL` object's properties will be modified.

If the value assigned to the `href` property is not a valid URL, a `TypeError` will be thrown.

#### url.origin

* {string}

Obtiene y establece la serialización del origen de la URL.

```js
const myURL = new URL('https://example.org/foo/bar?baz');
console.log(myURL.origin);
// Imprime https://example.org
```

```js
const idnURL = new URL('https://測試');
console.log(idnURL.origin);
// Prints https://xn--g6w251d

console.log(idnURL.hostname);
// Prints xn--g6w251d
```

#### url.password

* {string}

Obtiene y establece la porción de la contraseña de la URL.

```js
const myURL = new URL('https://abc:xyz@example.com');
console.log(myURL.password);
// Imprime xyz

myURL.password = '123';
console.log(myURL.href);
// Imprime https://abc:123@example.com
```

Invalid URL characters included in the value assigned to the `password` property are [percent-encoded](#whatwg-percent-encoding). Note that the selection of which characters to percent-encode may vary somewhat from what the [`url.parse()`][] and [`url.format()`][] methods would produce.

#### url.pathname

* {string}

Obtiene y establece la porción de la ruta de la URL.

```js
const myURL = new URL('https://example.org/abc/xyz?123');
console.log(myURL.pathname);
// Imprime /abc/xyz

myURL.pathname = '/abcdef';
console.log(myURL.href);
// Imprime https://example.org/abcdef?123
```

Invalid URL characters included in the value assigned to the `pathname` property are [percent-encoded](#whatwg-percent-encoding). Note that the selection of which characters to percent-encode may vary somewhat from what the [`url.parse()`][] and [`url.format()`][] methods would produce.

#### url.port

* {string}

Obtiene y establece la porción del puerto de la URL.

The port value may be a number or a string containing a number in the range `0` to `65535` (inclusive). Setting the value to the default port of the `URL` objects given `protocol` will result in the `port` value becoming the empty string (`''`).

The port value can be an empty string in which case the port depends on the protocol/scheme:

| protocol | port |
|:-------- |:---- |
| "ftp"    | 21   |
| "file"   |      |
| "gopher" | 70   |
| "http"   | 80   |
| "https"  | 443  |
| "ws"     | 80   |
| "wss"    | 443  |

Upon assigning a value to the port, the value will first be converted to a string using `.toString()`.

If that string is invalid but it begins with a number, the leading number is assigned to `port`. If the number lies outside the range denoted above, it is ignored.

```js
const myURL = new URL('https://example.org:8888');
console.log(myURL.port);
// Imprime 8888

// Puertos predeterminados son automáticamente transformados a la string vacía
// (el puerto de protocolo HTTPS por defecto es 443)
myURL.port = '443';
console.log(myURL.port);
// Imprime la string vacía
console.log(myURL.href);
// Imprime https://example.org/

myURL.port = 1234;
console.log(myURL.port);
// Imprime 1234
console.log(myURL.href);
// Imprime https://example.org:1234/

// Puertos de string completamente inválidos son ignorados
myURL.port = 'abcd';
console.log(myURL.port);
// Imprime 1234

// Los números iniciales son tratados como un número de puerto
myURL.port = '5678abcd';
console.log(myURL.port);
// Imprime 5678

// Los no-enteros son truncados
myURL.port = 1234.5678;
console.log(myURL.port);
// Imprime 1234

// Los Números fuera de rango que no estén representados en notación científica
// serán ignorados.
myURL.port = 1e10; // 10000000000, se verificará el rango como se describe a continuación
console.log(myURL.port);
// Imprime 1234
```

Note that numbers which contain a decimal point, such as floating-point numbers or numbers in scientific notation, are not an exception to this rule. Leading numbers up to the decimal point will be set as the URL's port, assuming they are valid:

```js
myURL.port = 4.567e21;
console.log(myURL.port);
// Imprime 4 (porque es el número inicial en la string '4.567e21')
```

#### url.protocol

* {string}

Obtiene y establece la porción del protocolo de la URL.

```js
const myURL = new URL('https://example.org');
console.log(myURL.protocol);
// Imprime https:

myURL.protocol = 'ftp';
console.log(myURL.href);
// Imprime ftp://example.org/
```

Los valores de protocolo URL inválidos asignados a la propiedad `protocol` son ignorados.

##### Special Schemes

The [WHATWG URL Standard](https://url.spec.whatwg.org/) considers a handful of URL protocol schemes to be *special* in terms of how they are parsed and serialized. When a URL is parsed using one of these special protocols, the `url.protocol` property may be changed to another special protocol but cannot be changed to a non-special protocol, and vice versa.

For instance, changing from `http` to `https` works:

```js
const u = new URL('http://example.org');
u.protocol = 'https';
console.log(u.href);
// https://example.org
```

However, changing from `http` to a hypothetical `fish` protocol does not because the new protocol is not special.

```js
const u = new URL('http://example.org');
u.protocol = 'fish';
console.log(u.href);
// http://example.org
```

Likewise, changing from a non-special protocol to a special protocol is also not permitted:

```js
const u = new URL('fish://example.org');
u.protocol = 'http';
console.log(u.href);
// fish://example.org
```

The protocol schemes considered to be special by the WHATWG URL Standard include: `ftp`, `file`, `gopher`, `http`, `https`, `ws`, and `wss`.

#### url.search

* {string}

Obtiene y establece la porción de consulta serializada de la URL.

```js
const myURL = new URL('https://example.org/abc?123');
console.log(myURL.search);
// Imprime ?123

myURL.search = 'abc=xyz';
console.log(myURL.href);
// Imprime https://example.org/abc?abc=xyz
```

Any invalid URL characters appearing in the value assigned the `search` property will be [percent-encoded](#whatwg-percent-encoding). Note that the selection of which characters to percent-encode may vary somewhat from what the [`url.parse()`][] and [`url.format()`][] methods would produce.

#### url.searchParams

* {URLSearchParams}

Gets the [`URLSearchParams`][] object representing the query parameters of the URL. This property is read-only; to replace the entirety of query parameters of the URL, use the [`url.search`][] setter. See [`URLSearchParams`][] documentation for details.

#### url.username

* {string}

Obtiene y establece la porción del nombre de usuario de la URL.

```js
const myURL = new URL('https://abc:xyz@example.com');
console.log(myURL.username);
// Imprime abc

myURL.username = '123';
console.log(myURL.href);
// Imprime https://123:xyz@example.com/
```

Any invalid URL characters appearing in the value assigned the `username` property will be [percent-encoded](#whatwg-percent-encoding). Note that the selection of which characters to percent-encode may vary somewhat from what the [`url.parse()`][] and [`url.format()`][] methods would produce.

#### url.toString()

* Devuelve: {string}

El método `toString()` en el objeto `URL` devuelve la URL serializada. The value returned is equivalent to that of [`url.href`][] and [`url.toJSON()`][].

Because of the need for standard compliance, this method does not allow users to customize the serialization process of the URL. For more flexibility, [`require('url').format()`][] method might be of interest.

#### url.toJSON()

* Devuelve: {string}

El método `toJSON()` en el objeto `URL` devuelve la URL serializada. The value returned is equivalent to that of [`url.href`][] and [`url.toString()`][].

This method is automatically called when an `URL` object is serialized with [`JSON.stringify()`][].

```js
const myURLs = [
  new URL('https://www.example.com'),
  new URL('https://test.example.org')
];
console.log(JSON.stringify(myURLs));
// Imprime ["https://www.example.com/","https://test.example.org/"]
```

### Clase: URLSearchParams

<!-- YAML
added:

  - v7.5.0
  - v6.13.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18281
    description: The class is now available on the global object.
-->

The `URLSearchParams` API provides read and write access to the query of a `URL`. The `URLSearchParams` class can also be used standalone with one of the four following constructors. La clase `URLSearchParams` también está disponible en el objeto global.

The WHATWG `URLSearchParams` interface and the [`querystring`][] module have similar purpose, but the purpose of the [`querystring`][] module is more general, as it allows the customization of delimiter characters (`&` and `=`). Por otra parte, esta API está diseñada únicamente para strings de consulta URL.

```js
const myURL = new URL('https://example.org/?abc=123');
console.log(myURL.searchParams.get('abc'));
// Imprime 123

myURL.searchParams.append('abc', 'xyz');
console.log(myURL.href);
// Imprime https://example.org/?abc=123&abc=xyz

myURL.searchParams.delete('abc');
myURL.searchParams.set('a', 'b');
console.log(myURL.href);
// Imprime https://example.org/?a=b

const newSearchParams = new URLSearchParams(myURL.searchParams);
// Lo anterior es equivalente a
// const newSearchParams = new URLSearchParams(myURL.search);

newSearchParams.append('a', 'c');
console.log(myURL.href);
// Imprime https://example.org/?a=b
console.log(newSearchParams.toString());
// Imprime a=b&a=c

// newSearchParams.toString() es llamado implícitamente
myURL.search = newSearchParams;
console.log(myURL.href);
// Imprime https://example.org/?a=b&a=c
newSearchParams.delete('a');
console.log(myURL.href);
// Imprime https://example.org/?a=b&a=c
```

#### Constructor: new URLSearchParams()

Crear una instancia de un nuevo objeto `URLSearchParams` vacío.

#### Constructor: new URLSearchParams(string)

* `string` {string} Una string de consulta

Parse the `string` as a query string, and use it to instantiate a new `URLSearchParams` object. Si está presente un `'?'` inicial, es ignorado.

```js
permite params;

params = new URLSearchParams('user=abc&query=xyz');
console.log(params.get('user'));
// Imprime 'abc'
console.log(params.toString());
// Imprime 'user=abc&query=xyz'

params = new URLSearchParams('?user=abc&query=xyz');
console.log(params.toString());
// Imprime 'user=abc&query=xyz'
```

#### Constructor: new URLSearchParams(obj)

<!-- YAML
added:

  - v7.10.0
  - v6.13.0
-->

* `obj` {Object} Un objeto que representa una colección de pares clave-valor

Crear una instancia de un nuevo objeto `URLSearchParams` con un mapa hash de consulta. The key and value of each property of `obj` are always coerced to strings.

Unlike [`querystring`][] module, duplicate keys in the form of array values are not allowed. Arrays are stringified using [`array.toString()`][], which simply joins all array elements with commas.

```js
const params = new URLSearchParams({
  user: 'abc',
  query: ['first', 'second']
});
console.log(params.getAll('query'));
// Imprime [ 'first,second' ]
console.log(params.toString());
// Imprime 'user=abc&query=first%2Csecond'
```

#### Constructor: new URLSearchParams(iterable)

<!-- YAML
added:

  - v7.10.0
  - v6.13.0
-->

* `iterable` {Iterable} Un objeto iterable cuyos elementos son pares clave-valor

Instantiate a new `URLSearchParams` object with an iterable map in a way that is similar to [`Map`][]'s constructor. `iterable` can be an `Array` or any iterable object. That means `iterable` can be another `URLSearchParams`, in which case the constructor will simply create a clone of the provided `URLSearchParams`. Elements of `iterable` are key-value pairs, and can themselves be any iterable object.

Las claves duplicadas son permitidas.

```js
permite params;

// Usando un array
params = new URLSearchParams([
  ['user', 'abc'],
  ['query', 'first'],
  ['query', 'second']
]);
console.log(params.toString());
// Imprime 'user=abc&query=first&query=second'

// Usando un objeto Map
const map = new Map();
map.set('user', 'abc');
map.set('query', 'xyz');
params = new URLSearchParams(map);
console.log(params.toString());
// Imprime 'user=abc&query=xyz'

// Usando una función de generador
function* getQueryPairs() {
  yield ['user', 'abc'];
  yield ['query', 'first'];
  yield ['query', 'second'];
}
params = new URLSearchParams(getQueryPairs());
console.log(params.toString());
// Imprime 'user=abc&query=first&query=second'

// Cada par clave-valor debe tener exactamente dos elementos
new URLSearchParams([
  ['user', 'abc', 'error']
]);
// Throws TypeError [ERR_INVALID_TUPLE]:
//        Cada consulta par debe ser una tupa [nombre, valor] iterable
```

#### urlSearchParams.append(name, value)

* `name` {string}
* `value` {string}

Agregue un nuevo par nombre-valor a la string de consulta.

#### urlSearchParams.delete(name)

* `name` {string}

Eliminar todos los pares nombre-valor cuyo nombre sea `name`.

#### urlSearchParams.entries()

* Devuelve: {Iterator}

Devuelve un `Iterator` ES6 sobre cada uno de los pares nombre-valor en la consulta. Cada ítem del iterador es un `Array` de JavaScript. The first item of the `Array` is the `name`, the second item of the `Array` is the `value`.

Alias para [`urlSearchParams[@@iterator]()`][`urlSearchParams@@iterator()`].

#### urlSearchParams.forEach(fn[, thisArg])

* `fn` {Function} Invocado por cada par nombre-valor en la consulta
* `thisArg` {Object} Para ser usado como `this` valor para cuando `fn` sea llamado

Itera sobre cada par nombre-valor en la consulta e invoca la función dada.

```js
const myURL = new URL('https://example.org/?a=b&c=d');
myURL.searchParams.forEach((value, name, searchParams) => {
  console.log(name, value, myURL.searchParams === searchParams);
});
// Imprime:
//   a b true
//   c d true
```

#### urlSearchParams.get(name)

* `name` {string}
* Returns: {string} or `null` if there is no name-value pair with the given `name`.

Devuelve el valor del primer par nombre-valor cuyo nombre es `name`. If there are no such pairs, `null` is returned.

#### urlSearchParams.getAll(name)

* `name` {string}
* Devuelve: {string[]}

Devuelve los valores de todos los pares nombre-valor cuyos nombres son `name`. If there are no such pairs, an empty array is returned.

#### urlSearchParams.has(name)

* `name` {string}
* Devuelve: {boolean}

Devuelve `true` Si hay al menos un par nombre-valor cuyo nombre es `name`.

#### urlSearchParams.keys()

* Devuelve: {Iterator}

Devuelve un `Iterator` ES6 sobre los nombres de cada par nombre-valor.

```js
const params = new URLSearchParams('foo=bar&foo=baz');
for (const name of params.keys()) {
  console.log(name);
}
// Imprime:
//   foo
//   foo
```

#### urlSearchParams.set(name, value)

* `name` {string}
* `value` {string}

Sets the value in the `URLSearchParams` object associated with `name` to `value`. If there are any pre-existing name-value pairs whose names are `name`, set the first such pair's value to `value` and remove all others. If not, append the name-value pair to the query string.

```js
const params = new URLSearchParams();
params.append('foo', 'bar');
params.append('foo', 'baz');
params.append('abc', 'def');
console.log(params.toString());
// Imprime foo=bar&foo=baz&abc=def

params.set('foo', 'def');
params.set('xyz', 'opq');
console.log(params.toString());
// Imprime foo=def&abc=def&xyz=opq
```

#### urlSearchParams.sort()

<!-- YAML
added:

  - v7.7.0
  - v6.13.0
-->

Clasifique todos los pares nombre-valor existentes en su lugar por sus nombres. Sorting is done with a [stable sorting algorithm](https://en.wikipedia.org/wiki/Sorting_algorithm#Stability), so relative order between name-value pairs with the same name is preserved.

Este método puede ser usado, en particular, para aumentar los cache hits.

```js
const params = new URLSearchParams('query[]=abc&type=search&query[]=123');
params.sort();
console.log(params.toString());
// Imprime query%5B%5D=abc&query%5B%5D=123&type=search
```

#### urlSearchParams.toString()

* Devuelve: {string}

Returns the search parameters serialized as a string, with characters percent-encoded where necessary.

#### urlSearchParams.values()

* Devuelve: {Iterator}

Devuelve un `Iterator` ES6 sobre los valores de cada par nombre-valor.

#### urlSearchParams\[Symbol.iterator\]()

* Devuelve: {Iterator}

Devuelve un `Iterator` ES6 sobre cada par nombre-valor en la string de consulta. Cada ítem del iterador es un `Array` de JavaScript. The first item of the `Array` is the `name`, the second item of the `Array` is the `value`.

Alias para [`urlSearchParams.entries()`][].

```js
const params = new URLSearchParams('foo=bar&xyz=baz');
for (const [name, value] of params) {
  console.log(name, value);
}
// Imprime:
//   foo bar
//   xyz baz
```

### url.domainToASCII(domain)

<!-- YAML
added:

  - v7.4.0
  - v6.13.0
-->

* `domain` {string}
* Devuelve: {string}

Devuelve la serialización de ASCII [Punycode](https://tools.ietf.org/html/rfc5891#section-4.4) del `domain`. If `domain` is an invalid domain, the empty string is returned.

It performs the inverse operation to [`url.domainToUnicode()`][].

```js
const url = require('url');
console.log(url.domainToASCII('español.com'));
// Imprime xn--espaol-zwa.com
console.log(url.domainToASCII('中文.com'));
// Imprime xn--fiq228c.com
console.log(url.domainToASCII('xn--iñvalid.com'));
// Imprime una string vacía
```

### url.domainToUnicode(domain)

<!-- YAML
added:

  - v7.4.0
  - v6.13.0
-->

* `domain` {string}
* Devuelve: {string}

Devuelve la serialización Unicode del `domain`. If `domain` is an invalid domain, the empty string is returned.

Realiza la operación inversa a [`url.domainToASCII()`][].

```js
const url = require('url');
console.log(url.domainToUnicode('xn--espaol-zwa.com'));
// Imprime español.com
console.log(url.domainToUnicode('xn--fiq228c.com'));
// Imprime 中文.com
console.log(url.domainToUnicode('xn--iñvalid.com'));
// Imprime una string vacía
```

### url.fileURLToPath(url)

<!-- YAML
added: v10.12.0
-->

* `url` {URL | string} The file URL string or URL object to convert to a path.
* Returns: {string} The fully-resolved platform-specific Node.js file path.

This function ensures the correct decodings of percent-encoded characters as well as ensuring a cross-platform valid absolute path string.

```js
new URL('file:///C:/path/').pathname;    // Incorrect: /C:/path/
fileURLToPath('file:///C:/path/');       // Correct:   C:\path\ (Windows)

new URL('file://nas/foo.txt').pathname;  // Incorrect: /foo.txt
fileURLToPath('file://nas/foo.txt');     // Correct:   \\nas\foo.txt (Windows)

new URL('file:///你好.txt').pathname;    // Incorrect: /%E4%BD%A0%E5%A5%BD.txt
fileURLToPath('file:///你好.txt');       // Correct:   /你好.txt (POSIX)

new URL('file:///hello world').pathname; // Incorrect: /hello%20world
fileURLToPath('file:///hello world');    // Correct:   /hello world (POSIX)
```

### url.format(URL[, options])

<!-- YAML
added: v7.6.0
-->

* `URL` {URL} Un objeto de [WHATWG URL](#url_the_whatwg_url_api)
* `opciones` {Object} 
  * `auth` {boolean} `true` if the serialized URL string should include the username and password, `false` otherwise. **Predeterminado:** `true`.
  * `fragment` {boolean} `true` if the serialized URL string should include the fragment, `false` otherwise. **Predeterminado:** `true`.
  * `search` {boolean} `true` if the serialized URL string should include the search query, `false` otherwise. **Predeterminado:** `true`.
  * `unicode` {boolean} `true` if Unicode characters appearing in the host component of the URL string should be encoded directly as opposed to being Punycode encoded. **Default:**`false`.
* Devuelve: {string}

Returns a customizable serialization of a URL `String` representation of a [WHATWG URL](#url_the_whatwg_url_api) object.

The URL object has both a `toString()` method and `href` property that return string serializations of the URL. These are not, however, customizable in any way. The `url.format(URL[, options])` method allows for basic customization of the output.

```js
const myURL = new URL('https://a:b@測試?abc#foo');

console.log(myURL.href);
// Prints https://a:b@xn--g6w251d/?abc#foo

console.log(myURL.toString());
// Prints https://a:b@xn--g6w251d/?abc#foo

console.log(url.format(myURL, { fragment: false, unicode: true, auth: false }));
// Prints 'https://測試/?abc'
```

### url.pathToFileURL(path)

<!-- YAML
added: v10.12.0
-->

* `path` {string} The path to convert to a File URL.
* Returns: {URL} The file URL object.

This function ensures that `path` is resolved absolutely, and that the URL control characters are correctly encoded when converting into a File URL.

```js
new URL(__filename);                // Incorrect: throws (POSIX)
new URL(__filename);                // Incorrect: C:\... (Windows)
pathToFileURL(__filename);          // Correct:   file:///... (POSIX)
pathToFileURL(__filename);          // Correct:   file:///C:/... (Windows)

new URL('/foo#1', 'file:');         // Incorrect: file:///foo#1
pathToFileURL('/foo#1');            // Correct:   file:///foo%231 (POSIX)

new URL('/some/path%.js', 'file:'); // Incorrect: file:///some/path%
pathToFileURL('/some/path%.js');    // Correct:   file:///some/path%25 (POSIX)
```

## Sistema heredado API URL

### Sistema heredado `urlObject`

The legacy `urlObject` (`require('url').Url`) is created and returned by the `url.parse()` function.

#### urlObject.auth

The `auth` property is the username and password portion of the URL, also referred to as *userinfo*. This string subset follows the `protocol` and double slashes (if present) and precedes the `host` component, delimited by `@`. The string is either the username, or it is the username and password separated by `:`.

Por ejemplo: `'user:pass'`.

#### urlObject.hash

The `hash` property is the fragment identifier portion of the URL including the leading `#` character.

Por ejemplo: `'#hash'`.

#### urlObject.host

The `host` property is the full lower-cased host portion of the URL, including the `port` if specified.

Por ejemplo: `'sub.example.com:8080'`.

#### urlObject.hostname

The `hostname` property is the lower-cased host name portion of the `host` component *without* the `port` included.

Por ejemplo: `'sub.example.com'`.

#### urlObject.href

The `href` property is the full URL string that was parsed with both the `protocol` and `host` components converted to lower-case.

Por ejemplo: `'http://user:pass@sub.example.com:8080/p/a/t/h?query=string#hash'`.

#### urlObject.path

The `path` property is a concatenation of the `pathname` and `search` components.

Por ejemplo: `'/p/a/t/h?query=string'`.

No se realiza la decodificación del `path`.

#### urlObject.pathname

La propiedad `pathname` consiste en toda la sección path de la URL. This is everything following the `host` (including the `port`) and before the start of the `query` or `hash` components, delimited by either the ASCII question mark (`?`) or hash (`#`) characters.

For example: `'/p/a/t/h'`.

No se realiza la decodificación del string path.

#### urlObject.port

La propiedad `port` es la porción del port numérico del componente `host`.

Por ejemplo: `'8080'`.

#### urlObject.protocol

La propiedad `protocol` identifica el esquema de protocolo en minúscula de la URL.

Por ejemplo: `'http:'`.

#### urlObject.query

The `query` property is either the query string without the leading ASCII question mark (`?`), or an object returned by the [`querystring`][] module's `parse()` method. Whether the `query` property is a string or object is determined by the `parseQueryString` argument passed to `url.parse()`.

Por ejemplo: `'query=string'` or `{'query': 'string'}`.

Si es devuelto como una string, no se realiza la decodificación de la string de consulta. If returned as an object, both keys and values are decoded.

#### urlObject.search

The `search` property consists of the entire "query string" portion of the URL, including the leading ASCII question mark (`?`) character.

Por ejemplo: `'?query=string'`.

No se realiza la decodificación del string de consulta.

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

El proceso de formateo funciona de la siguiente forma:

* Se crea una nueva string `result` vacía.
* Si `urlObject.protocol` es una string, esta será adjuntada a `result`.
* Otherwise, if `urlObject.protocol` is not `undefined` and is not a string, an [`Error`][] is thrown.
* For all string values of `urlObject.protocol` that *do not end* with an ASCII colon (`:`) character, the literal string `:` will be appended to `result`.
* If either of the following conditions is true, then the literal string `//` will be appended to `result`: * `urlObject.slashes` property is true; * `urlObject.protocol` begins with `http`, `https`, `ftp`, `gopher`, or `file`;
* If the value of the `urlObject.auth` property is truthy, and either `urlObject.host` or `urlObject.hostname` are not `undefined`, the value of `urlObject.auth` will be coerced into a string and appended to `result` followed by the literal string `@`.
* Si la propiedad `urlObject.host` es `undefined`, entonces: 
  * Si `urlObject.hostname` es una string, será adjuntada a `result`.
  * Otherwise, if `urlObject.hostname` is not `undefined` and is not a string, an [`Error`][] is thrown.
  * If the `urlObject.port` property value is truthy, and `urlObject.hostname` is not `undefined`: 
    * La string literal `:` será adjuntada a `result`, y
    * The value of `urlObject.port` is coerced to a string and appended to `result`.
* Otherwise, if the `urlObject.host` property value is truthy, the value of `urlObject.host` is coerced to a string and appended to `result`.
* Si la propiedad `urlObject.pathname` es una string que no es una string vacía: 
  * If the `urlObject.pathname` *does not start* with an ASCII forward slash (`/`), then the literal string `'/'` is appended to `result`.
  * El valor de `urlObject.pathname` es adjuntado a `result`.
* Otherwise, if `urlObject.pathname` is not `undefined` and is not a string, an [`Error`][] is thrown.
* If the `urlObject.search` property is `undefined` and if the `urlObject.query` property is an `Object`, the literal string `?` is appended to `result` followed by the output of calling the [`querystring`][] module's `stringify()` method passing the value of `urlObject.query`.
* De lo contrario, si `urlObject.search` es una string: 
  * If the value of `urlObject.search` *does not start* with the ASCII question mark (`?`) character, the literal string `?` is appended to `result`.
  * El valor de `urlObject.search` es adjuntado a `result`.
* Otherwise, if `urlObject.search` is not `undefined` and is not a string, an [`Error`][] is thrown.
* Si la propiedad `urlObject.hash` es una string: 
  * If the value of `urlObject.hash` *does not start* with the ASCII hash (`#`) character, the literal string `#` is appended to `result`.
  * El valor de `urlObject.hash` es adjuntado a `result`.
* Otherwise, if the `urlObject.hash` property is not `undefined` and is not a string, an [`Error`][] is thrown.
* Se devuelve `result` .

### url.parse(urlString[, parseQueryString[, slashesDenoteHost]])

<!-- YAML
added: v0.1.25
changes:

  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/13606
    description: The `search` property on the returned URL object is now `null`
                 when no query string is present.
-->

* `urlString` {string} La string URL a analizar.
* `parseQueryString` {boolean} If `true`, the `query` property will always be set to an object returned by the [`querystring`][] module's `parse()` method. If `false`, the `query` property on the returned URL object will be an unparsed, undecoded string. **Predeterminado:** `false`.
* `slashesDenoteHost` {boolean} If `true`, the first token after the literal string `//` and preceding the next `/` will be interpreted as the `host`. For instance, given `//foo/bar`, the result would be `{host: 'foo', pathname: '/bar'}` rather than `{pathname: '//foo/bar'}`. **Predeterminado:** `false`.

The `url.parse()` method takes a URL string, parses it, and returns a URL object.

Se produce un `TypeError` si `urlString` no es una string.

Se produce un `URIError` si la propiedad `auth` está presente pero no puede ser decodificada.

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

* `from` {string} La URL Base siendo resuelta en contra.
* `to` {string} La URL HREF siendo resuelta.

The `url.resolve()` method resolves a target URL relative to a base URL in a manner similar to that of a Web browser resolving an anchor tag HREF.

```js
const url = require('url');
url.resolve('/one/two/three', 'four');         // '/one/two/four'
url.resolve('http://example.com/', '/one');    // 'http://example.com/one'
url.resolve('http://example.com/one', '/two'); // 'http://example.com/two'
```

<a id="whatwg-percent-encoding"></a>

## Codificación Porcentual en URLs

Los URLs tienen permitido contener solo un cierto rango de caracteres. Any character falling outside of that range must be encoded. How such characters are encoded, and which characters to encode depends entirely on where the character is located within the structure of the URL.

### Legado API

Within the Legacy API, spaces (`' '`) and the following characters will be automatically escaped in the properties of URL objects:

```txt
< > " ` \r \n \t { } | \ ^ '
```

Por ejemplo, el carácter espacio ASCII (`' '`) es codificado como `%20`. The ASCII forward slash (`/`) character is encoded as `%3C`.

### API de WHATWG

The [WHATWG URL Standard](https://url.spec.whatwg.org/) uses a more selective and fine grained approach to selecting encoded characters than that used by the Legacy API.

The WHATWG algorithm defines four "percent-encode sets" that describe ranges of characters that must be percent-encoded:

* The *C0 control percent-encode set* includes code points in range U+0000 to U+001F (inclusive) and all code points greater than U+007E.

* The *fragment percent-encode set* includes the *C0 control percent-encode set* and code points U+0020, U+0022, U+003C, U+003E, and U+0060.

* The *path percent-encode set* includes the *C0 control percent-encode set* and code points U+0020, U+0022, U+0023, U+003C, U+003E, U+003F, U+0060, U+007B, and U+007D.

* The *userinfo encode set* includes the *path percent-encode set* and code points U+002F, U+003A, U+003B, U+003D, U+0040, U+005B, U+005C, U+005D, U+005E, and U+007C.

The *userinfo percent-encode set* is used exclusively for username and passwords encoded within the URL. The *path percent-encode set* is used for the path of most URLs. El *conjunto fragmento de codificación porcentual* es usado para fragmentos URL. The *C0 control percent-encode set* is used for host and path under certain specific conditions, in addition to all other cases.

When non-ASCII characters appear within a hostname, the hostname is encoded using the [Punycode](https://tools.ietf.org/html/rfc5891#section-4.4) algorithm. Note, however, that a hostname *may* contain *both* Punycode encoded and percent-encoded characters:

```js
const myURL = new URL('https://%CF%80.example.com/foo');
console.log(myURL.href);
// Prints https://xn--1xa.example.com/foo
console.log(myURL.origin);
// Prints https://xn--1xa.example.com
```