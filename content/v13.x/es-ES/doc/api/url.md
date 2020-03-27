# URL

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

El módulo `url` proporciona utilidades para la resolución y análisis de URL. Puede accederse al mismo utilizando:

```js
const url = require('url');
```

## Strings de URL y Objetos de URL

Una string de URL es una string estructurada que contiene múltiples componentes significativos. Al ser analizada, se devuelve un objeto de URL que contiene propiedades para cada uno de estos componentes.

El módulo `url` proporciona dos APIs para trabajar con URLs: una API heredada que es específica para Node.js y una API más nueva que implementa el mismo [Estándar de URL de WHATWG](https://url.spec.whatwg.org/) que es utilizado por los navegadores web.

A continuación, se proporciona una comparación entre las API de WHATWG y la API Heredada. Above the URL `'http://user:pass@sub.example.com:8080/p/a/t/h?query=string#hash'`, properties of an object returned by the legacy `url.parse()` are shown. Abajo de este, se encuentran las propiedades de un objeto de `URL` de WHTWG.

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

Analizar la string de URL utilizando la API de WHATWG:

```js
const myURL =
  new URL('https://user:pass@sub.example.com:8080/p/a/t/h?query=string#hash');
```

Analizar la string de URL utilizando la API Heredada:

```js
const url = require('url');
const myURL =
  url.parse('https://user:pass@sub.example.com:8080/p/a/t/h?query=string#hash');
```

## La API de URL de WHATWG

### Class: `URL`
<!-- YAML
added:
  - v7.0.0
  - v6.13.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18281
    description: The class is now available on the global object.
-->

Clase `URL` compatible con los navegadores, implementada por el siguiente Estándar de URL de WHATWG. [Ejemplos de URLs analizadas](https://url.spec.whatwg.org/#example-url-parsing) pueden ser encontrados en el mismo Estándar. La clase `URL` también está disponible en el objeto global.

In accordance with browser conventions, all properties of `URL` objects are implemented as getters and setters on the class prototype, rather than as data properties on the object itself. Thus, unlike [legacy `urlObject`][]s, using the `delete` keyword on any properties of `URL` objects (e.g. `delete
myURL.protocol`, `delete myURL.pathname`, etc) has no effect but will still return `true`.

#### Constructor: `new URL(input[, base])`

* `input` {string} La entrada URL absoluta o relativa a analizar. If `input` is relative, then `base` is required. If `input` is absolute, the `base` is ignored.
* `base` {string|URL} La URL base contra la cual realizar la resolución si el `input` no es absoluto.

Crea un nuevo objeto `URL` analizando el `input` relativo a la `base`. Si `base` es pasada como una string, será analizada como equivalente a `new URL(base)`.

```js
const myURL = new URL('/foo', 'https://example.org/');
// https://example.org/foo
```

Un `TypeError` será arrojado si el `input` o la `base` no son URLs válidas. Tenga en cuenta que se realizará un esfuerzo para forzar los valores dados a convertirse en strings. Por ejemplo:

```js
const myURL = new URL({ toString: () => 'https://example.org/' });
// https://example.org/
```

Unicode characters appearing within the host name of `input` will be automatically converted to ASCII using the [Punycode](https://tools.ietf.org/html/rfc5891#section-4.4) algorithm.

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

#### `url.hash`

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

Los caracteres de URL inválidos incluidos en el valor asignado a la propiedad `hash` son [codificados porcentualmente](#whatwg-percent-encoding). The selection of which characters to percent-encode may vary somewhat from what the [`url.parse()`][] and [`url.format()`][] methods would produce.

#### `url.host`

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

#### `url.hostname`

* {string}

Gets and sets the host name portion of the URL. The key difference between `url.host` and `url.hostname` is that `url.hostname` does *not* include the port.

```js
const myURL = new URL('https://example.org:81/foo');
console.log(myURL.hostname);
// Imprime example.org

myURL.hostname = 'example.com:82';
console.log(myURL.href);
// Imprime https://example.com:81/foo
```

Invalid host name values assigned to the `hostname` property are ignored.

#### `url.href`

* {string}

Obtiene y establece el URL serializado.

```js
const myURL = new URL('https://example.org/foo');
console.log(myURL.href);
// Imprime https://example.org/foo

myURL.href = 'https://example.com/bar';
console.log(myURL.href);
// Imprime https://example.com/bar
```

Obtener el valor de la propiedad `href` es equivalente a llamar a [`url.toString()`][].

Establecer el valor de esta propiedad en un nuevo valor es equivalente a crear un nuevo objeto `URL` utilizando [`new URL(value)`][`new URL()`]. Cada una de las propiedades de objeto del `URL` será modificada.

Si el valor asignado a la propiedad `href` no es una URL válida, se arroja un `TypeError`.

#### `url.origin`

* {string}

Obtiene la serialización de solo-lectura del origen del URL.

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

#### `url.password`

* {string}

Obtiene y establece la porción de la contraseña del URL.

```js
const myURL = new URL('https://abc:xyz@example.com');
console.log(myURL.password);
// Imprime xyz

myURL.password = '123';
console.log(myURL.href);
// Imprime https://abc:123@example.com
```

Los caracteres inválidos incluidos en el valor asignado a la propiedad `password` serán codificados [porcentualmente](#whatwg-percent-encoding). The selection of which characters to percent-encode may vary somewhat from what the [`url.parse()`][] and [`url.format()`][] methods would produce.

#### `url.pathname`

* {string}

Obtiene y establece la porción de la ruta del URL.

```js
const myURL = new URL('https://example.org/abc/xyz?123');
console.log(myURL.pathname);
// Imprime /abc/xyz

myURL.pathname = '/abcdef';
console.log(myURL.href);
// Imprime https://example.org/abcdef?123
```

Los caracteres de URL inválidos incuidos en el valor asignado a `pathname` son [codificados porcentualmente](#whatwg-percent-encoding). The selection of which characters to percent-encode may vary somewhat from what the [`url.parse()`][] and [`url.format()`][] methods would produce.

#### `url.port`

* {string}

Obtiene y establece la porción del puerto del URL.

The port value may be a number or a string containing a number in the range `0` to `65535` (inclusive). Setting the value to the default port of the `URL` objects given `protocol` will result in the `port` value becoming the empty string (`''`).

The port value can be an empty string in which case the port depends on the protocol/scheme:

| protocol | port |
| -------- | ---- |
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

Numbers which contain a decimal point, such as floating-point numbers or numbers in scientific notation, are not an exception to this rule. Leading numbers up to the decimal point will be set as the URL's port, assuming they are valid:

```js
myURL.port = 4.567e21;
console.log(myURL.port);
// Imprime 4 (porque es el número inicial en la string '4.567e21')
```

#### `url.protocol`

* {string}

Obtiene y establece la porción del protocolo del URL.

```js
const myURL = new URL('https://example.org');
console.log(myURL.protocol);
// Imprime https:

myURL.protocol = 'ftp';
console.log(myURL.href);
// Imprime ftp://example.org/
```

Los valores del protocolo URL inválidos asignados a la propiedad `protocol` son ignorados.

##### Special Schemes

The [WHATWG URL Standard](https://url.spec.whatwg.org/) considers a handful of URL protocol schemes to be _special_ in terms of how they are parsed and serialized. When a URL is parsed using one of these special protocols, the `url.protocol` property may be changed to another special protocol but cannot be changed to a non-special protocol, and vice versa.

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

According to the WHATWG URL Standard, special protocol schemes are `ftp`, `file`, `gopher`, `http`, `https`, `ws`, and `wss`.

#### `url.search`

* {string}

Obtiene y establece la porción de la consulta serializada del URL.

```js
const myURL = new URL('https://example.org/abc?123');
console.log(myURL.search);
// Imprime ?123

myURL.search = 'abc=xyz';
console.log(myURL.href);
// Imprime https://example.org/abc?abc=xyz
```

Los caracteres inválidos que aparezcan en el valor asignado a la propiedad `search` serán [codificados porcentualmente](#whatwg-percent-encoding). The selection of which characters to percent-encode may vary somewhat from what the [`url.parse()`][] and [`url.format()`][] methods would produce.

#### `url.searchParams`

* {URLSearchParams}

Obtiene el objeto [`URLSearchParams`][] que representa los parámetros de consulta del URL. Esta propiedad es de solo lectura; para reemplazar la totalidad de los parámetros de consulta del URL, utilice el setter [`url.search`][]. Vea la documentación de [`URLSearchParams`][] para obtener detalles.

#### `url.username`

* {string}

Obtiene y establece la porción del nombre de usuario del URL.

```js
const myURL = new URL('https://abc:xyz@example.com');
console.log(myURL.username);
// Imprime abc

myURL.username = '123';
console.log(myURL.href);
// Imprime https://123:xyz@example.com/
```

Los caracteres inválidos que aparezcan en el valor asignado a la propiedad `username` serán [codificados porcentualmente](#whatwg-percent-encoding). The selection of which characters to percent-encode may vary somewhat from what the [`url.parse()`][] and [`url.format()`][] methods would produce.

#### `url.toString()`

* Devuelve: {string}

El método `toString()` en el objeto `URL` devuelve el URL serializado. El valor devuelto es equivalente al de [`url.href`][] y [`url.toJSON()`][].

Debido a la necesidad de cumplir con los estándares, este método no permite a los usuarios personalizar el proceso de serialización del URL. For more flexibility, [`require('url').format()`][] method might be of interest.

#### `url.toJSON()`

* Devuelve: {string}

El método `toJSON()` en el objeto `URL` devuelve el URL serializado. El valor devuelto es equivalente al de [`url.href`][] y [`url.toString()`][].

Este método es llamado automáticamente cuando un objeto `URL` es serializado con [`JSON.stringify()`][].

```js
const myURLs = [
  new URL('https://www.example.com'),
  new URL('https://test.example.org')
];
console.log(JSON.stringify(myURLs));
// Imprime ["https://www.example.com/","https://test.example.org/"]
```

### Class: `URLSearchParams`
<!-- YAML
added:
  - v7.5.0
  - v6.13.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18281
    description: The class is now available on the global object.
-->

La API de `URLSearchParams` proporciona un acceso de lectura y escritura a la consulta de un `URL`. La clase `URLSearchParams` también puede ser utilizada de manera independiente con uno de los cuatro constructores siguientes. La clase `URLSearchParams` también está disponible en el objeto global.

La interfaz de `URLSearchParams` de WHATWG y el módulo [`querystring`][] tienen un propósito similar, pero el del módulo [`querystring`][] es más general, pues permite la personalización de los caracteres delimitadores (`&` and `=`). Por otra parte, esta API está diseñada únicamente para strings de consulta de URL.

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

#### Constructor: `new URLSearchParams()`

Instanciar un nuevo objeto `URLSearchParams` vacío.

#### Constructor: `new URLSearchParams(string)`

* `string` {string} Una string de consulta

Analice la `string` como una string de consulta, y utilícela para instanciar un nuevo objeto `URLSearchParams`. Si un `'?'` inicial está presente, es ignorado.

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

#### Constructor: `new URLSearchParams(obj)`
<!-- YAML
added:
  - v7.10.0
  - v6.13.0
-->

* `obj` {Object} Un objeto que representa una colección de pares de clave-valor

Instancie un nuevo objeto `URLSearchParams` con un mapa de hash de consulta. La clave y valor de cada propiedad de `obj` siempre son forzados a ser strings.

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

#### Constructor: `new URLSearchParams(iterable)`
<!-- YAML
added:
  - v7.10.0
  - v6.13.0
-->

* `iterable` {Iterable} Un objeto iterable cuyos elementos son pares de clave-valor

Instanciar un nuevo objeto `URLSearchParams` con un mapa iterable de una forma similar al constructor de [`Map`][]. `iterable` can be an `Array` or any iterable object. Eso significa que `iterable` puede ser otro `URLSearchParams`, en cuyo caso el constructor simplemente creará un clon del `URLSearchParams` proporcionado. Los elementos de `iterable` son pares de clave-valor, y pueden ser en sí mismos cualquier objeto iterable.

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

#### `urlSearchParams.append(name, value)`

* `name` {string}
* `value` {string}

Anexe un nuevo par nombre-valor a la string de consulta.

#### `urlSearchParams.delete(name)`

* `name` {string}

Remueva todos los pares nombre-valor cuyo nombre sea `name`.

#### `urlSearchParams.entries()`

* Devuelve: {Iterator}

Devuelve un `Iterator` ES6 sobre cada uno de los pares nombre-valor en la consulta. Cada ítem del iterador es un `Array` de JavaScript. The first item of the `Array` is the `name`, the second item of the `Array` is the `value`.

Alias para [`urlSearchParams[@@iterator]()`][`urlSearchParams@@iterator()`].

#### `urlSearchParams.forEach(fn[, thisArg])`

* `fn` {Function} Invocado por cada par nombre-valor en la consulta
* `thisArg` {Object} Para ser usado como `this` valor para cuando `fn` sea llamado

Itera sobre cada par de nombre-valor en la consulta e invoca la función dada.

```js
const myURL = new URL('https://example.org/?a=b&c=d');
myURL.searchParams.forEach((value, name, searchParams) => {
  console.log(name, value, myURL.searchParams === searchParams);
});
// Imprime:
//   a b true
//   c d true
```

#### `urlSearchParams.get(name)`

* `name` {string}
* Devuelve: {string} o `null` si no hay un par de nombre-valor con el `name` dado.

Devuelve el valor del primer par de nombre-valor cuyo nombre es `name`. Si dichos pares no existen, se devuelve `null`.

#### `urlSearchParams.getAll(name)`

* `name` {string}
* Devuelve: {string[]}

Devuelve los valores de todos los pares de nombre-valor cuyo nombre es `name`. Si no existen dichos pares, se devuelve un array vacío.

#### `urlSearchParams.has(name)`

* `name` {string}
* Devuelve: {boolean}

Devuelve `true` si existe al menos un par de nombre-valor cuyo nombre es `name`.

#### `urlSearchParams.keys()`

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

#### `urlSearchParams.set(name, value)`

* `name` {string}
* `value` {string}

Establece los valores en el objeto `URLSearchParams` asociado con `name` al `value`. Si existen pares nombre-valor preexistentes cuyos nombres sean `name`, establezca el valor del primer par como `value` y remueva todos los demás. Si no los hay, anexe el par de nombre-valor a la string de consulta.

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

#### `urlSearchParams.sort()`
<!-- YAML
added:
  - v7.7.0
  - v6.13.0
-->

Organice todos los pares de nombre-valor existentes in situ por sus nombres. La organización es realizada con un [algoritmo de organización estable](https://en.wikipedia.org/wiki/Sorting_algorithm#Stability), de modo que se conserva el orden relativo entre los pares de nombre-valor con el mismo nombre.

Este método puede ser utilizado para, particularmente, incrementar los aciertos de caché.

```js
const params = new URLSearchParams('query[]=abc&type=search&query[]=123');
params.sort();
console.log(params.toString());
// Imprime query%5B%5D=abc&query%5B%5D=123&type=search
```

#### `urlSearchParams.toString()`

* Devuelve: {string}

Devuelve los parámetros de búsqueda serializados como una string, con los caracteres codificados porcentualmente donde sea necesario.

#### `urlSearchParams.values()`

* Devuelve: {Iterator}

Devuelve un `Iterator` ES6 sobre los valores de cada par nombre-valor.

#### `urlSearchParams[Symbol.iterator]()`

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

### `url.domainToASCII(domain)`
<!-- YAML
added:
  - v7.4.0
  - v6.13.0
-->

* `domain` {string}
* Devuelve: {string}

Devuelve la serialización ASCII de [Punycode](https://tools.ietf.org/html/rfc5891#section-4.4) del `domain`. Si `domain` es un dominio inválido, se devuelve una string vacía.

Realiza la operación inversa a [`url.domainToUnicode()`][].

```js
const url = require('url');
console.log(url.domainToASCII('español.com'));
// Imprime xn--espaol-zwa.com
console.log(url.domainToASCII('中文.com'));
// Imprime xn--fiq228c.com
console.log(url.domainToASCII('xn--iñvalid.com'));
// Imprime una string vacía
```

### `url.domainToUnicode(domain)`
<!-- YAML
added:
  - v7.4.0
  - v6.13.0
-->

* `domain` {string}
* Devuelve: {string}

Devuelve la serialización de Unicode del `domain`. Si `domain` es un dominio inválido, la string vacía es devuelta.

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

### `url.fileURLToPath(url)`
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

### `url.format(URL[, options])`
<!-- YAML
added: v7.6.0
-->

* `URL` {URL} Un objeto de [WHATWG URL](#url_the_whatwg_url_api)
* `options` {Object}
  * `auth` {boolean} `true` if the serialized URL string should include the username and password, `false` otherwise. **Default:** `true`.
  * `fragment` {boolean} `true` if the serialized URL string should include the fragment, `false` otherwise. **Default:** `true`.
  * `search` {boolean} `true` if the serialized URL string should include the search query, `false` otherwise. **Default:** `true`.
  * `unicode` {boolean} `true` if Unicode characters appearing in the host component of the URL string should be encoded directly as opposed to being Punycode encoded. **Default:** `false`.
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

### `url.pathToFileURL(path)`
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

## API de URL Heredada

> Stability: 0 - Deprecated: Use the WHATWG URL API instead.

### Sistema heredado `urlObject`
<!-- YAML
changes:
  - version: v11.0.0
    pr-url: https://github.com/nodejs/node/pull/22715
    description: The Legacy URL API is deprecated. Use the WHATWG URL API.
-->

The legacy `urlObject` (`require('url').Url`) is created and returned by the `url.parse()` function.

#### `urlObject.auth`

The `auth` property is the username and password portion of the URL, also referred to as _userinfo_. This string subset follows the `protocol` and double slashes (if present) and precedes the `host` component, delimited by `@`. The string is either the username, or it is the username and password separated by `:`.

Por ejemplo: `'user:pass'`.

#### `urlObject.hash`

The `hash` property is the fragment identifier portion of the URL including the leading `#` character.

Por ejemplo: `'#hash'`.

#### `urlObject.host`

La propiedad `host` es la porción del host del URL completo y en minúsculas, incluyendo el `port`, si es especificado.

Por ejemplo: `'sub.example.com:8080'`.

#### `urlObject.hostname`

The `hostname` property is the lower-cased host name portion of the `host` component *without* the `port` included.

Por ejemplo: `'sub.example.com'`.

#### `urlObject.href`

La propiedad `href` es la string URL completa que fue analizada por el `protocol` y los componentes del `host` convertidos a minúsculas.

Por ejemplo: `'http://user:pass@sub.example.com:8080/p/a/t/h?query=string#hash'`.

#### `urlObject.path`

La propiedad `path` es una concatenación de los componentes `pathname` y `search`.

Por ejemplo: `'/p/a/t/h?query=string'`.

No se realiza una decodificación del `path`.

#### `urlObject.pathname`

La propiedad `pathname` consiste en la sección de la ruta del URL completa. Esto es todo lo que sigue al `host` (incluyendo el `port`) y está antes del comienzo de los componentes `query` o `hash`, delimitados por los caracteres de signo de interrogación (`?`) o hash (`#`) ASCII.

For example: `'/p/a/t/h'`.

No se realiza una decodificación de la string de ruta.

#### `urlObject.port`

La propiedad `port` es la porción numérica del componente de `host`.

Por ejemplo: `'8080'`.

#### `urlObject.protocol`

La propiedad `protocol` identifica el esquema de protocolo en minúscula de la URL.

Por ejemplo: `'http:'`.

#### `urlObject.query`

La propiedad `query` es una string de consulta sin el signo de interrogación ASCII inicial (`?`), o un objeto devuelto por el método `parse()` del módulo [`querystring`][]. Que la propiedad `query` sea una string o un objeto es determinado por el argumento `parseQueryString` pasado a `url.parse()`.

Por ejemplo: `'query=string'` or `{'query': 'string'}`.

Si es devuelto como una string, no se realiza ninguna decodificación de la string de consulta. Si es devuelto como un objeto, ambas claves y valores son decodificados.

#### `urlObject.search`

La propiedad `search` consiste en la porción completa de "string de consulta" del URL, incluyendo el carácter de signo de interrogación (`?`) ASCII inicial.

Por ejemplo: `'?query=string'`.

No se realiza una decodificación de la string de consulta.

#### `urlObject.slashes`

La propiedad `slashes` es un `boolean` con un valor de `true` si se requieren dos caracteres de barra oblicua ASCII (`/`) tras los dos puntos en el `protocol`.

### `url.format(urlObject)`
<!-- YAML
added: v0.1.25
changes:
  - version: v11.0.0
    pr-url: https://github.com/nodejs/node/pull/22715
    description: The Legacy URL API is deprecated. Use the WHATWG URL API.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7234
    description: URLs with a `file:` scheme will now always use the correct
                 number of slashes regardless of `slashes` option. A false-y
                 `slashes` option with no protocol is now also respected at all
                 times.
-->

* `urlObject` {Object|string} A URL object (as returned by `url.parse()` or constructed otherwise). Si es una string, es convertida en un objeto al pasarla a `url.parse()`.

El método `url.format()` devuelve una string URL formateada derivada de `urlObject`.

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

Si `urlObject` no es un objeto o una string, `url.format()` arrojará un [`TypeError`][].

El proceso de formateo opera de la manera siguiente:

* Una nueva string vacía de `result` es creada.
* Si `urlObject.protocol` es una string, será anexada tal como es a `result`.
* De lo contrario, si `urlObject.protocol` no es `undefined` ni es una string, se arroja un [`Error`][].
* For all string values of `urlObject.protocol` that *do not end* with an ASCII colon (`:`) character, the literal string `:` will be appended to `result`.
* If either of the following conditions is true, then the literal string `//` will be appended to `result`:
  * `urlObject.slashes` property is true;
  * `urlObject.protocol` begins with `http`, `https`, `ftp`, `gopher`, or `file`;
* Si el valor de la propiedad `urlObject.auth` es verdadero y ni `urlObject.host` ni `urlObject.hostname` están `undefined`, el valor de `urlObject.auth` será forzado a convertirse en una string y anexado a `result` seguido de la string literal `@`.
* Si la propiedad `urlObject.host` está `undefined`, entonces:
  * Si el objeto `urlObject.hostname` es una string, será anexado a `result`.
  * De lo contrario, si `urlObject.hostname` no está `undefined` y no es una string, se arrojará un [`Error`][].
  * Si la propiedad `urlObject.port` es verdadera y `urlObject.hostname` no está `undefined`:
    * La string literal `:` será anexada a `result` y
    * El valor de `urlObject.port` será forzado a convertirse en una string y anexado a `result`.
* De lo contrario, si el valor de la propiedad `urlObject.host`es verdadero, el valor de `urlObject.host` será forzado a convertirse en una string y anexado a `result`.
* Si la propiedad `urlObject.pathname` es una string que no es una string vacía:
  * If the `urlObject.pathname` *does not start* with an ASCII forward slash (`/`), then the literal string `'/'` is appended to `result`.
  * El valor de `urlObject.pathname` será anexado a `result`.
* De lo contrario, si `urlObject.pathname` no está `undefined` y no es una string, se arrojará un [`Error`][].
* Si la propiedad `urlObject.search` está `undefined` y la propiedad `urlObject.query` es un `Object`, la string literal `?` será anexada a `result`, seguida del output de la llamada al método `stringify()` del módulo [`querystring`][], pasando el valor de `urlObject.query`.
* De lo contrario, si `urlObject.search` es una string:
  * If the value of `urlObject.search` *does not start* with the ASCII question mark (`?`) character, the literal string `?` is appended to `result`.
  * El valor de `urlObject.search` será anexado a `result`.
* De lo contrario, si `urlObject.search` no está `undefined` y no es una string, se arrojará un [`Error`][].
* Si la propiedad `urlObject.hash` es una string:
  * If the value of `urlObject.hash` *does not start* with the ASCII hash (`#`) character, the literal string `#` is appended to `result`.
  * El valor de `urlObject.hash` será anexado a `result`.
* De lo contrario, si la propiedad `urlObject.hash` no está `undefined` y no es una string, se arrojará un [`Error`][].
* `result` será devuelto.

### `url.parse(urlString[, parseQueryString[, slashesDenoteHost]])`
<!-- YAML
added: v0.1.25
changes:
  - version: v11.14.0
    pr-url: https://github.com/nodejs/node/pull/26941
    description: The `pathname` property on the returned URL object is now `/`
                 when there is no path and the protocol scheme is `ws:` or
                 `wss:`.
  - version: v11.0.0
    pr-url: https://github.com/nodejs/node/pull/22715
    description: The Legacy URL API is deprecated. Use the WHATWG URL API.
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/13606
    description: The `search` property on the returned URL object is now `null`
                 when no query string is present.
-->

* `urlString` {string} La string URL a analizar.
* `parseQueryString` {boolean} Si es `true`, la propiedad `query` siempre será establecida como un objeto devuelto por el método `parse()` del módulo [`querystring`][]. Si es `false`, la propiedad `query` en el objeto URL devuelto será una string no analizada, ni decodificada. **Default:** `false`.
* `slashesDenoteHost` {boolean} Si es `true`, el primer token que está después de la string literal `//` y antes del siguiente `/` será interpretado como el `host`. Por ejemplo, si se proporciona `//foo/bar`, el resultado sería `{host: 'foo', pathname: '/bar'}`, en lugar de `{pathname: '//foo/bar'}`. **Default:** `false`.

El método `url.parse()` toma un string de URL, lo analiza y devuelve un objeto URL.

Se arroja un `TypeError` si `urlString` no es una string.

Se arroja un `URIError` si la propiedad `auth` está presente pero no puede ser decodificada.

### `url.resolve(from, to)`
<!-- YAML
added: v0.1.25
changes:
  - version: v11.0.0
    pr-url: https://github.com/nodejs/node/pull/22715
    description: The Legacy URL API is deprecated. Use the WHATWG URL API.
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

* `from` {string} La URL Base contra la que se está resolviendo.
* `to` {string} El URL HREF siendo resuelto.

El método `url.resolve()` resuelve un URL objetivo relativo al URL base de una forma similar a aquella en la cual un navegador Web resuelve un HREF de una etiqueta de anclaje.

```js
const url = require('url');
url.resolve('/one/two/three', 'four');         // '/one/two/four'
url.resolve('http://example.com/', '/one');    // 'http://example.com/one'
url.resolve('http://example.com/one', '/two'); // 'http://example.com/two'
```

<a id="whatwg-percent-encoding"></a>

## Codificación Porcentual en URLs

A los URLs solo se les permite contener cierto rango de caracteres. Cualquier carácter que esté fuera de ese rango debe ser codificado. La manera en la cual son codificados estos caracteres y la determinación de cuáles se codifican dependen completamente de dónde se encuentren dentro de la estructura del URL.

### API Heredada

Dentro de la API Heredada, los espacios (`' '`) y los siguientes caracteres serán automáticamente escapados en las propiedades de los objetos URL:

```txt
< > " ` \r \n \t { } | \ ^ '
```

Por ejemplo, el carácter ASCII de espacio (`' '`) es codificado como `%20`. El carácter ASCII de barra oblicua (`/`) es codificado como `%3C`.

### API de WHATWG

El [Estándar de URL de WHATWG](https://url.spec.whatwg.org/) utiliza un enfoque más selectivo y detallado que el utilizado por la API Heredada para seleccionar caracteres codificados.

The WHATWG algorithm defines four "percent-encode sets" that describe ranges of characters that must be percent-encoded:

* The *C0 control percent-encode set* includes code points in range U+0000 to U+001F (inclusive) and all code points greater than U+007E.

* The *fragment percent-encode set* includes the *C0 control percent-encode set* and code points U+0020, U+0022, U+003C, U+003E, and U+0060.

* The *path percent-encode set* includes the *C0 control percent-encode set* and code points U+0020, U+0022, U+0023, U+003C, U+003E, U+003F, U+0060, U+007B, and U+007D.

* The *userinfo encode set* includes the *path percent-encode set* and code points U+002F, U+003A, U+003B, U+003D, U+0040, U+005B, U+005C, U+005D, U+005E, and U+007C.

The *userinfo percent-encode set* is used exclusively for username and passwords encoded within the URL. The *path percent-encode set* is used for the path of most URLs. The *fragment percent-encode set* is used for URL fragments. The *C0 control percent-encode set* is used for host and path under certain specific conditions, in addition to all other cases.

When non-ASCII characters appear within a host name, the host name is encoded using the [Punycode](https://tools.ietf.org/html/rfc5891#section-4.4) algorithm. Note, however, that a host name *may* contain *both* Punycode encoded and percent-encoded characters:

```js
const myURL = new URL('https://%CF%80.example.com/foo');
console.log(myURL.href);
// Prints https://xn--1xa.example.com/foo
console.log(myURL.origin);
// Prints https://xn--1xa.example.com
```
