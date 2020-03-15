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

*Nota*: Aunque la API Heredada no ha sido desaprobada, se mantiene únicamente para compatibilidad retrospectiva con aplicaciones existentes. El nuevo código de aplicación siempre debe utilizar la API de WHATWG.

A continuación, se proporciona una comparación entre las API de WHATWG y la API Heredada. Arriba del URL `'http://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash'`, se muestran las propiedades de un objeto devuelto por la `url.parse()` heredada. Abajo de este, se encuentran las propiedades de un objeto de `URL` de WHTWG.

*Nota*: La propiedad `origin` del URL de WHATWG incluye `protocol` y `host`, mas no `username` ni `password`.

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
(todos los espacios en la línea "" deben ser ignorados — son solamente para dar formato)
```

Analizar la string de URL utilizando la API de WHATWG:

```js
const { URL } = require('url');
const myURL =
  new URL('https://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash');
```

*Nota*: En los Navegadores Web, la clase `URL` de WHATWG es una variable global que siempre está disponible. En Node.js, sin embargo, se debe acceder a la clase `URL` a través de `require('url').URL`.

Analizar la string de URL utilizando la API Heredada:

```js
const url = require('url');
const myURL =
  url.parse('https://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash');
```

## La API de URL de WHATWG
<!-- YAML
added: v7.0.0
-->

### Clase: URL

La clase `URL` compatible con el navegador, implementada siguiendo el estándar URL WHATWG. [Ejemplos de URLs analizadas](https://url.spec.whatwg.org/#example-url-parsing) pueden ser encontradas en el mismo Estándar.

*Nota*: De acuerdo con las convenciones de los navegadores, todas las propiedades de los objetos `URL` son implementadas como getters y setters en el prototipo de la clase, y no como propiedades de datos en el objeto en sí. Por lo tanto, a diferencia de lo que sucede con los [urlObject heredado](#url_legacy_urlobject)s, el uso de la palabra clave `delete` en cualquiera de las propiedades de los objetos `URL` (p.ej., `delete myURL.protocol`, `delete myURL.pathname`, etc) no tiene ningún efecto, pero aún así devolverá `true`.

#### Constructor: new URL(input[, base])

* `input` {string} La URL de entrada a analizar
* `base` {string|URL} La URL base contra la cual realizar la resolución si el `input` no es absoluto.

Crea un nuevo objeto `URL` al analizar la `input` relativa a la `base`. Si `base` pasa como una string, será analizada de forma equivalente a `new URL(base)`.

```js
const { URL } = require('url');
const myURL = new URL('/foo', 'https://example.org/');
// https://example.org/foo
```

Se producirá un `TypeError` si la `input` o `base` no son URLs válidas. Tenga en cuenta que se hará un esfuerzo para obligar a los valores dados a convertirse en cadenas. Por ejemplo:

```js
const { URL } = require('url');
const myURL = new URL({ toString: () => 'https://example.org/' });
// https://example.org/
```

Caracteres unicode que aparecen dentro del hostname de `input` serán automáticamente convertidos a ASCII usando el algoritmo [Punycode](https://tools.ietf.org/html/rfc5891#section-4.4).

```js
const { URL } = require('url');
const myURL = new URL('https://你好你好');
// https://xn--6qqa088eba/
```

*Nota*: Esta función solo estará disponible si el ejecutable de `node` fue compilado con el [ICU](intl.html#intl_options_for_building_node_js) habilitado. Si no, los nombres de dominio son pasados sin cambios.

#### url.hash

* {string}

Obtiene y establece la porción fragmentaria del URL.

```js
const { URL } = require('url');
const myURL = new URL('https://example.org/foo#bar');
console.log(myURL.hash);
// Imprime #bar

myURL.hash = 'baz';
console.log(myURL.href);
// Imprime https://example.org/foo#baz
```

Los caracteres de URL inválidos incluidos en el valor asignado a la propiedad `hash` son [codificados porcentualmente](#whatwg-percent-encoding). Tenga en cuenta que la selección de los caracteres a codificar porcentualmente podría variar un poco de lo que producirían los métodos [`url.parse()`][] y [`url.format()`][].

#### url.host

* {string}

Obtiene y establece la porción del host del URL.

```js
const { URL } = require('url');
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

Obtiene y establece la porción del nombre de host del URL. La diferencia clave entre `url.host` y `url.hostname` es que `url.hostname` *no* incluye al puerto.

```js
const { URL } = require('url');
const myURL = new URL('https://example.org:81/foo');
console.log(myURL.hostname);
// Imprime example.org

myURL.hostname = 'example.com:82';
console.log(myURL.href);
// Imprime https://example.com:81/foo
```

Los nombres de host inválidos asignados a la propiedad `hostname` son ignorados.

#### url.href

* {string}

Obtiene y establece el URL serializado.

```js
const { URL } = require('url');
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

#### url.origin

* {string}

Obtiene la serialización de solo-lectura del origen del URL.

```js
const { URL } = require('url');
const myURL = new URL('https://example.org/foo/bar?baz');
console.log(myURL.origin);
// Imprime https://example.org
```

```js
const { URL } = require('url');
const idnURL = new URL('https://你好你好');
console.log(idnURL.origin);
// Imprime https://xn--6qqa088eba

console.log(idnURL.hostname);
// Imprime xn--6qqa088eba
```

#### url.password

* {string}

Obtiene y establece la porción de la contraseña del URL.

```js
const { URL } = require('url');
const myURL = new URL('https://abc:xyz@example.com');
console.log(myURL.password);
// Imprime xyz

myURL.password = '123';
console.log(myURL.href);
// Imprime https://abc:123@example.com
```

Los caracteres inválidos incluidos en el valor asignado a la propiedad `password` serán codificados [porcentualmente](#whatwg-percent-encoding). Tenga en cuenta que la selección de los caracteres a codificar porcentualmente podría variar un poco de lo que producirían los métodos [`url.parse()`][] y [`url.format()`][].

#### url.pathname

* {string}

Obtiene y establece la porción de la ruta del URL.

```js
const { URL } = require('url');
const myURL = new URL('https://example.org/abc/xyz?123');
console.log(myURL.pathname);
// Imprime /abc/xyz

myURL.pathname = '/abcdef';
console.log(myURL.href);
// Imprime https://example.org/abcdef?123
```

Los caracteres de URL inválidos incuidos en el valor asignado a `pathname` son [codificados porcentualmente](#whatwg-percent-encoding). Tenga en cuenta que la selección de caracteres para codificar porcentualmente podría variar un poco de lo que los métodos [`url.parse()`][] y [`url.format()`][] producirían.

#### url.port

* {string}

Obtiene y establece la porción del puerto del URL.

```js
const { URL } = require('url');
const myURL = new URL('https://example.org:8888');
console.log(myURL.port);
// Imprime 8888

// Los puertos predeterminados son transformados automáticamente a la string vacía
// (El puerto predeterminado para el protocolo HTTPS es 443)
myURL.port = '443';
console.log(myURL.port);
// Imprime la strng vacía
console.log(myURL.href);
// Imprime https://example.org/

myURL.port = 1234;
console.log(myURL.port);
// Imprime 1234
console.log(myURL.href);
// Imprime https://example.org:1234/

// Las strings de puertos completamente inválidos son ignoradas
myURL.port = 'abcd';
console.log(myURL.port);
// Imprime 1234

// Los números iniciales son tratados como un nombre de puerto
myURL.port = '5678abcd';
console.log(myURL.port);
// Imprime 5678

// Los números no enteros son truncados
myURL.port = 1234.5678;
console.log(myURL.port);
// Imprime 1234

// Los números fuera de rango son ignorados
myURL.port = 1e10;
console.log(myURL.port);
// Imprime 1234
```

El valor del puerto puede ser establecido como un número o una String que contenga un número dentro del rango de `0` a `65535` (inclusivos). Establecer el valor del puerto predeterminado del `protocol` dado de los objetos `URL` ocasionará que el valor del `port`se convierta en la string vacía (`''`).

Si una string inválida es asignada a la propiedad `port`, pero comienza con un número, el número inicial será asignado a `port`. De lo contrario, o si el número se encuentra fuera del rango antes indicado, será ignorada.

#### url.protocol

* {string}

Obtiene y establece la porción del protocolo de la URL.

```js
const { URL } = require('url');
const myURL = new URL('https://example.org');
console.log(myURL.protocol);
// Imprime https:

myURL.protocol = 'ftp';
console.log(myURL.href);
// Imprime ftp://example.org/
```

Los valores de protocolo URL inválidos asignados a la propiedad `protocol` son ignorados.

#### url.search

* {string}

Obtiene y establece la porción de consulta serializada de la URL.

```js
const { URL } = require('url');
const myURL = new URL('https://example.org/abc?123');
console.log(myURL.search);
// Imprime ?123

myURL.search = 'abc=xyz';
console.log(myURL.href);
// Imprime https://example.org/abc?abc=xyz
```

Cualquier carácter URL inválido que aparezca en el valor asignado de la propiedad `search` será [percent-encoded](#whatwg-percent-encoding). Tenga en cuenta que la selección de los caracteres para percent-encode puede variar un poco de lo que los métodos [`url.parse()`][] y [`url.format()`][] producirían.

#### url.searchParams

* {URLSearchParams}

Obtiene el objeto [`URLSearchParams`][] representando los parámetros de la consulta de la URL. Esta propiedad es solo para lectura; para reemplazar la totalidad de los parámetros de consulta de la URL, use el setter [`url.search`][]. Vea la documentación [`URLSearchParams`][] para más detalles.

#### url.username

* {string}

Obtiene y establece la porción del nombre de usuario de la URL.

```js
const { URL } = require('url');
const myURL = new URL('https://abc:xyz@example.com');
console.log(myURL.username);
// Imprime abc

myURL.username = '123';
console.log(myURL.href);
// Imprime https://123:xyz@example.com/
```

Cualquier carácter URL inválido que aparezca en el valor asignado de la propiedad `username` será [percent-encoded](#whatwg-percent-encoding). Tenga en cuenta que la selección de los caracteres para percent-encode puede variar un poco de lo que los métodos [`url.parse()`][] y [`url.format()`][] producirían.

#### url.toString()

* Devuelve: {string}

El método `toString()` en el objeto `URL` devuelve la URL serializada. El valor devuelto es equivalente al de [`url.href`][] y [`url.toJSON()`][].

Debido a la necesidad de cumplimiento estándar, este método no permite a los usuarios personalizar el proceso de serialización de la URL. Para mayor flexibilidad, podría estar interesado en el método [`require('url').format()`][].

#### url.toJSON()

* Devuelve: {string}

El método `toJSON()` en el objeto `URL` devuelve la URL serializada. El valor devuelto es equivalente al de [`url.href`][] y [`url.toString()`][].

Este método es automáticamente llamado cuando un objeto `URL` es serializado con [`JSON.stringify()`][].

```js
const { URL } = require('url');
const myURLs = [
  new URL('https://www.example.com'),
  new URL('https://test.example.org')
];
console.log(JSON.stringify(myURLs));
// Imprime ["https://www.example.com/","https://test.example.org/"]
```

### Clase: URLSearchParams
<!-- YAML
added: v7.5.0
-->

La API `URLSearchParams` proporciona acceso para leer y escribir a la consulta de una `URL`. La clase `URLSearchParams` también puede ser usada de forma independiente con uno de los cuatro constructores siguientes.

La interfaz WHATWG `URLSearchParams` y el módulo [`querystring`][], tienen propósitos similares, pero el propósito del módulo [`querystring`][] es más general, ya que permite la personalización de caracteres delimitadores (`&` and `=`). Por otra parte, esta API está diseñada únicamente para strings de consulta URL.

```js
const { URL, URLSearchParams } = require('url');

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

// newSearchParams.toString() is implicitly called
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

Analice la `string` como una string de consulta, y úsela para crear una instancia de un nuevo objeto `URLSearchParams`. Si está presente un `'?'` inicial, es ignorado.

```js
const { URLSearchParams } = require('url');
let params;

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
added: v7.10.0
-->

* `obj` {Object} Un objeto que representa una colección de pares de clave-valor

Crear una instancia de un nuevo objeto `URLSearchParams` con un mapa hash de consulta. La clave y valor de cada propiedad de `obj` siempre son forzados a strings.

*Nota*: Distintamente de en el módulo [`querystring`][], las claves duplicadas en forma de valores de array no son permitidas. Las arrays son convertidas en strings utilizando [`array.toString()`][], la cual sencillamente une todos los elementos de array con comas.

```js
const { URLSearchParams } = require('url');
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
added: v7.10.0
-->

* `iterable` {Iterable} Un objeto iterable cuyos elementos son pares de clave-valor

Crear una instancia de un nuevo objeto `URLSearchParams` con un mapa iterable de forma que sea similar al constructor [`Map`][]. `iterable` puede ser un Array o cualquier objeto iterable. Eso significa que `iterable` puede ser otro `URLSearchParams`, en tal caso el constructor simplemente creará un clon del `URLSearchParams` proporcionado. Los elementos de `iterable` son pares clave-valor, y ellos mismos pueden ser cualquier objeto iterable.

Las claves duplicadas son permitidas.

```js
const { URLSearchParams } = require('url');
let params;

// Utilizar un array
params = new URLSearchParams([
  ['user', 'abc'],
  ['query', 'first'],
  ['query', 'second']
]);
console.log(params.toString());
// Imprime 'user=abc&query=first&query=second'

// Utilizar un objeto Map
const map = new Map();
map.set('user', 'abc');
map.set('query', 'xyz');
params = new URLSearchParams(map);
console.log(params.toString());
// Imprime 'user=abc&query=xyz'

// Utilizar una función generadora
function* getQueryPairs() {
  yield ['user', 'abc'];
  yield ['query', 'first'];
  yield ['query', 'second'];
}
params = new URLSearchParams(getQueryPairs());
console.log(params.toString());
// Imprime 'user=abc&query=first&query=second'

// Cada par clave valor debe tener exactamente dos elementos
new URLSearchParams([
  ['user', 'abc', 'error']
]);
// Arroja TypeError [ERR_INVALID_TUPLE]:
//        Cada par de consulta debe ser una tupla [name, value] iterable
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

Devuelve un Iterador de ES6 sobre cada uno de los pares de nombre-valor en la consulta. Cada ítem del Iterador es un Array de JavaScript. El primer ítem del Array es el `name`, el segundo ítem del Array es `value`.

Alias para [`urlSearchParams[@@iterator]()`][`urlSearchParams@@iterator()`].

#### urlSearchParams.forEach(fn[, thisArg])

* `fn` {Function} Función invocada por cada par de nombre-valor en la consulta.
* `thisArg` {Object} Objeto a ser utilizado como valor `this` cuando `fn` sea llamada

Itera sobre cada par nombre-valor en la consulta e invoca la función dada.

```js
const { URL } = require('url');
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
* Devuelve: {string} o `null` si no hay un par de nombre-valor con el `name` dado.

Devuelve el valor del primer par nombre-valor cuyo nombre es `name`. Si no hay tales pares, `null` es devuelto.

#### urlSearchParams.getAll(name)

* `name` {string}
* Devuelve: {Array}

Devuelve los valores de todos los pares nombre-valor cuyos nombres son `name`. Si no hay tales pares, un array vacío es devuelto.

#### urlSearchParams.has(name)

* `name` {string}
* Devuelve: {boolean}

Devuelve `true` Si hay al menos un par nombre-valor cuyo nombre es `name`.

#### urlSearchParams.keys()

* Devuelve: {Iterator}

Devuelve un Iterador de ES6 sobre los nombres de cada par de nombre-valor.

```js
const { URLSearchParams } = require('url');
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

Establece el valor en el objeto `URLSearchParams` asociado con `name` para `value`. Si hay pares nombre-valor preexistentes cuyos nombres son `name`, establezca el primer valor de dicho par a `value` y elimine los otros. Si no es así, agregue el par nombre-valor a la string de consulta.

```js
const { URLSearchParams } = require('url');

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
added: v7.7.0
-->

Clasifique todos los pares nombre-valor existentes en su lugar por sus nombres. La clasificación se realiza con un [stable sorting algorithm](https://en.wikipedia.org/wiki/Sorting_algorithm#Stability), así que el orden relativo entre pares nombre-valor con el mismo nombre es conservado.

Este método puede ser usado, en particular, para aumentar los cache hits.

```js
const { URLSearchParams } = require('url');
const params = new URLSearchParams('query[]=abc&type=search&query[]=123');
params.sort();
console.log(params.toString());
// Imprime query%5B%5D=abc&query%5B%5D=123&type=search
```

#### urlSearchParams.toString()

* Devuelve: {string}

Devuelve los parámetros de búsqueda serializados como una string, con caracteres de codificación de porcentajes cuando sea necesario.

#### urlSearchParams.values()

* Devuelve: {Iterator}

Devuelve un Iterador de ES6 encima de los valores de cada par de nombre-valor.

#### urlSearchParams\[@@iterator\]()

* Devuelve: {Iterator}

Devuelve un Iterador de ES6 sobre cada par de nombre-valor en la string de consulta. Cada ítem del iterador es una Matriz de JavaScript. El primer ítem de la Matriz es el `name`, el segundo ítem de la Matriz es el `value`.

Alias para [`urlSearchParams.entries()`][].

```js
const { URLSearchParams } = require('url');
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
added: v7.4.0
-->

* `domain` {string}
* Devuelve: {string}

Devuelve la serialización de ASCII [Punycode](https://tools.ietf.org/html/rfc5891#section-4.4) del `domain`. Si `domain` es un dominio inválido, la string vacía es devuelta.

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
added: v7.4.0
-->

* `domain` {string}
* Devuelve: {string}

Devuelve la serialización Unicode del `domain`. Si `domain` es un dominio inválido, la string vacía es devuelta.

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

### url.format(URL[, options])
<!-- YAML
added: v7.6.0
-->

* `URL` {URL} Un objeto de [WHATWG URL](#url_the_whatwg_url_api)
* `opciones` {Object}
  * `auth` {boolean} Es `true` si la string de URL serializada debe incluir el nombre de usuario y contraseña, de lo contrario es `false` . **Predeterminado:** `true`.
  * `fragment` {boolean} Es `true` si la string de URL serializada debe incluir el fragmento, de lo contrario es `false` . **Predeterminado:** `true`.
  * `search` {boolean} Es `true` si la string de URL serializada debe incluir la consulta de búsqueda, de lo contrario es `false` . **Predeterminado:** `true`.
  * `unicode` {boolean} Es `true` si los caracteres de Unicode que aparecen en el componente del host de la string URL deben ser codificados directamente, en lugar de ser codificados como Punycode. **Predeterminado:** `false`.

Devuelve una serialización personalizable de una representación de string URL de un objeto [WHATWG URL](#url_the_whatwg_url_api) .

El objeto URL tiene tanto un método `toString()` como una propiedad `href` que devuelven serializaciones de string de la URL. Sin embargo, estas no son personalizables de ninguna forma. El método `url.format(URL[, options])` permite la personalización básica del output.

For example:

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

## API de URL Heredada

### Sistema heredado urlObject

El objeto urlObject heredado (`require('url').Url`) es creado y devuelto por la función `url.parse()`.

#### urlObject.auth

La propiedad `auth` es la porción del nombre de usuario y contraseña de la URL, también conocido como "userinfo". Este subconjunto de string sigue el `protocol` y las barras dobles (si están presentes) y precede al componente del `host`, delimitado por un "arroba" ASCII (`@`). El formato de la string es `{username}[:{password}]`, con la porción `[:{password}]` siendo opcional.

Por ejemplo: `'user:pass'`

#### urlObject.hash

La propiedad `hash` consiste en la porción "fragmento" de la URL que incluye el carácter hash ASCII principal (`#`).

Por ejemplo: `'#hash'`

#### urlObject.host

La propiedad `host` es la porción del host completa en minúsculas de la URL, incluyendo el `port` si es especificado.

Por ejemplo: `'sub.host.com:8080'`

#### urlObject.hostname

La propiedad `hostname` es la porción del host completa en minúsculas del componente `host` *sin* el `puerto` incluido.

Por ejemplo: `'sub.host.com'`

#### urlObject.href

La propiedad `href` es la string URL completa que fue analizada con ambos componentes `protocol` y `host` convertidos a minúscula.

Por ejemplo: `'http://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash'`

#### urlObject.path

La propiedad `path` es una concatenación de los componentes `pathname` y `search`.

Por ejemplo: `'/p/a/t/h?query=string'`

No se realiza la decodificación del `path`.

#### urlObject.pathname

La propiedad `pathname` consiste en toda la sección path de la URL. Esto es todo lo que sigue al `host` (incluyendo el `port`) y es previo al inicio de los componentes `query` o `hash`, delimitados por el signo de interrogación ASCII (`?`) o caracteres hash (`#`).

Por ejemplo `'/p/a/t/h'`

No se realiza la decodificación del string path.

#### urlObject.port

La propiedad `port` es la porción del port numérico del componente `host`.

Por ejemplo: `'8080'`

#### urlObject.protocol

La propiedad `protocol` identifica el esquema de protocolo en minúscula de la URL.

Por ejemplo: `'http:'`

#### urlObject.query

La propiedad `query` es la string query sin el signo de interrogación ASCII principal (`?`), o un objeto devuelto por el método `parse()` del módulo [`querystring`][]. Si la propiedad `query` es una string o un objeto, esto es determinado por el argumento `parseQueryString` pasado a `url.parse()`.

Por ejemplo: `'query=string'` o `{'query': 'string'}`

Si es devuelto como una string, no se realiza la decodificación de la string de consulta. Si es devuelto como un objeto, tanto las claves como los valores son decodificados.

#### urlObject.search

La propiedad `search` consiste en toda la porción "string de consulta" de la URL, incluyendo el carácter signo de interrogación ASCII principal (`?`).

Por ejemplo: `'?query=string'`

No se realiza la decodificación del string de consulta.

#### urlObject.slashes

La propiedad `slashes` es un `boolean` con un valor de `true` si dos caracteres barra oblicua de ASCII (`/`) son requeridos seguidos de los dos puntos en el `protocol`.

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

* `urlObject` {Object|string} Un objeto URL (devuelto por `url.parse()`, de otra forma, es construido). Si es una string, es convertida a un objeto pasándola a `url.parse()`.

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

El proceso de formateo funciona de la siguiente forma:

* Se crea una nueva string `result` vacía.
* Si `urlObject.protocol` es una string, esta será adjuntada a `result`.
* De lo contrario, si `urlObject.protocol` no es `undefined` y no es una string, se arrojará un [`Error`][] .
* Para todos los valores de string de `urlObject.protocol` que *no terminan* con un carácter ASCII de dos puntos (`:`), la string literal `:` será adjuntada a `result`.
* If either of the following conditions is true, then the literal string `//` will be appended to `result`:
    * `urlObject.slashes` property is true;
    * `urlObject.protocol` begins with `http`, `https`, `ftp`, `gopher`, or `file`;
* If the value of the `urlObject.auth` property is truthy, and either `urlObject.host` or `urlObject.hostname` are not `undefined`, the value of `urlObject.auth` will be coerced into a string and appended to `result` followed by the literal string `@`.
* Si la propiedad `urlObject.host` es `undefined`, entonces:
  * Si `urlObject.hostname` es una string, será adjuntada a `result`.
  * De lo contrario, si `urlObject.hostname` no es `undefined` y no es una string, se arrojará un [`Error`][] .
  * Si el valor de la propiedad `urlObject.port` es truthy, y `urlObject.hostname` no es `undefined`:
    * La string literal `:` será adjuntada a `result`, y
    * El valor de `urlObject.port` será forzado a volverse una string y adjuntado a `result`.
* De lo contrario, si el valor de la propiedad `urlObject.host` es truthy, el valor de `urlObject.host` será forzado a volverse una string y adjuntado a `result`.
* Si la propiedad `urlObject.pathname` es una string que no es una string vacía:
  * Si `urlObject.pathname` *no comienza* con una barra oblicua ASCII (`/`), entonces la string literal '/' será adjuntada a `result`.
  * El valor de `urlObject.pathname` es adjuntado a `result`.
* De lo contrario, si `urlObject.pathname` no es `undefined` y no es una string, se arrojará un [`Error`][] .
* Si la propiedad `urlObject.search` es `undefined` y si la propiedad `urlObject.query` es un `Object`, la string literal `?` será adjuntada a `result`, seguida por el output que resulta de llamar al método `stringify()` del módulo [`querystring`][], pasando el valor de `urlObject.query`.
* De lo contrario, si `urlObject.search` es una string:
  * Si el valor de `urlObject.search` *no comienza* con un carácter ASCII de signo de interrogación (`?`), la string literal `?` será adjuntada a `result`.
  * El valor de `urlObject.search` es adjuntado a `result`.
* De lo contrario, si `urlObject.search` no es `undefined` y no es una string, se arrojará un [`Error`][] .
* Si la propiedad `urlObject.hash` es una string:
  * Si el valor de `urlObject.hash` *no comienza* con el carácter hash ASCII (`#`), la string literal `#` es adjuntada a `result`.
  * El valor de `urlObject.hash` es adjuntado a `result`.
* De lo contrario, si la propiedad `urlObject.hash` no es `undefined` y no es una string, se arrojará un [`Error`][] .
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
* `parseQueryString` {boolean} Si es `true`, la propiedad `query` siempre será establecida a un objeto devuelto por el método `parse()` del módulo [`querystring`][] . Si es `false`, la propiedad `query` en el objeto de URL devuelto será una string no analizada ni decodificada. **Predeterminado:** `false`.
* `slashesDenoteHost` {boolean} Si es `true`, el primer token posterior a la string literal `//` y anterior a la próxima `/` será interpretado como el `host`. Por ejemplo, si se da un `//foo/bar`, el resultado sería `{host: 'foo', pathname: '/bar'}` en vez de `{pathname: '//foo/bar'}`. **Predeterminado:** `false`.

El método `url.parse()` toma una string URL, la analiza, y la devuelve al objeto URL.

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

El método `url.resolve()` resuelve un URL objetivo relativo a un URL base de una forma similar a la de un navegador Web que resuelve una etiqueta de anclaje HREF.

For example:

```js
const url = require('url');
url.resolve('/one/two/three', 'four');         // '/one/two/four'
url.resolve('http://example.com/', '/one');    // 'http://example.com/one'
url.resolve('http://example.com/one', '/two'); // 'http://example.com/two'
```

<a id="whatwg-percent-encoding"></a>

## Codificación Porcentual en URLs

Los URLs tienen permitido contener solo un cierto rango de caracteres. Cualquier carácter que caiga fuera de ese rango debe ser codificado. Cómo son codificados estos caracteres, y cuáles caracteres son decodificados depende completamente de donde se encuentra ubicado el carácter dentro de la estructura de la URL.

### Sistema heredado API

Dentro del Sistema heredado API, los espacios (`' '`) y los siguientes caracteres serán evadidos en las propiedades de los objetos URL:

```txt
< > " ` \r \n \t { } | \ ^ '
```

Por ejemplo, el carácter espacio ASCII (`' '`) es codificado como `%20`. El carácter barra oblicua ASCII (`/`) es codificado como `%3C`.

### API de WHATWG

El [Estándar URL de WHATWG](https://url.spec.whatwg.org/) utiliza un enfoque más selectivo y detallado para seleccionar caracteres codificados que el que utiliza el Sistema heredado API.

El algoritmo WHATWG define cuatro "conjuntos de porcentaje de codificación" que describen los rangos de los caracteres que deben ser código porciento:

* El *conjunto de codificación porcentual de control C0* incluye puntos de código en rango U+0000 para U+001F (inclusivo) y todos los puntos de código mayores que U+007E.

* The *fragment percent-encode set* includes the *C0 control percent-encode set* and code points U+0020, U+0022, U+003C, U+003E, and U+0060.

* The *path percent-encode set* includes the *C0 control percent-encode set* and code points U+0020, U+0022, U+0023, U+003C, U+003E, U+003F, U+0060, U+007B, and U+007D.

* The *userinfo encode set* includes the *path percent-encode set* and code points U+002F, U+003A, U+003B, U+003D, U+0040, U+005B, U+005C, U+005D, U+005E, and U+007C.

El *conjunto codificado userinfo* es usado exclusivamente para el nombre de usuario y las contraseñas codificadas dentro de la URL. El *conjunto codificado userinfo* es usado para la ruta de la mayoría de las URLs. El *conjunto fragmento de codificación porcentual* es usado para fragmentos URL. El *conjunto fragmento de codificación porcentual* es usado para host y path bajo ciertas condiciones específicas, en adición al resto de casos.

Cuando aparecen caracteres no ASCII dentro del hostname, el hostname es codificado usando el algoritmo [Punycode](https://tools.ietf.org/html/rfc5891#section-4.4). Tenga en cuenta, sin embargo, que el hostname *puede* contener *ambos* caracteres cifrados y codificados por porcentaje Punnycode. For example:

```js
const { URL } = require('url');
const myURL = new URL('https://%CF%80.com/foo');
console.log(myURL.href);
// Imprime https://xn--1xa.com/foo
console.log(myURL.origin);
// Imprime https://π.com
```
