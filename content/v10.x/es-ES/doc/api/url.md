# URL

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

El módulo `url` proporciona utilidades para la resolución y análisis URL. Puede ser accedido utilizando:

```js
const url = require('url');
```

## Strings de URL y Objetos URL

Una string URL es una string estructurada que contiene múltiples componentes significativos. Cuando es analizado, un objeto URL es devuelto conteniendo propiedades para cada uno de estos componentes.

El módulo `url` proporciona dos APIs para trabajar con URLs: una API heredada que es específica de Node.js, y una API más nueva que implementa el mismo [Estándar URL WHATWG](https://url.spec.whatwg.org/) utilizado por navegadores web.

Mientras que la API Heredada no ha sido desaprobada, es mantenida únicamente para compatibilidad retrasada con aplicaciones existentes. El código de una nueva aplicación debe usar la API WHATWG.

A continuación, se proporciona una comparación entre el WHATWG y las APIs heredadas. Arriba de la URL` 'http://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash'`, se muestran propiedades de un objeto devuelto por el legado `url.parse()`. Debajo de la misma, se muestran propiedades de un objeto WHATWG `URL`.

La propiedad `origin` de WHATWG URL incluye `protocol` y `host`, pero no `username` o `password`.

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

(todos los espacios en la línea "" deben ser ignorados — son simplemente para formatear)
```

Analizar la string de URL utilizando la API WHATWG:

```js
const myURL =
  new URL('https://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash');
```

Analizar la string de URL usando la API Heredada:

```js
const url = require('url');
const myURL =
  url.parse('https://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash');
```

## La WHATWG URL API

### Clase: URL

<!-- YAML
added: v7.0.0
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18281
    description: The class is now available on the global object.
-->

La clase `URL` compatible con el navegador, implementada siguiendo el estándar URL WHATWG. [Ejemplos de URLs analizadas](https://url.spec.whatwg.org/#example-url-parsing) pueden ser encontradas en el mismo Estándar. La clase `URL` también está disponible en el objeto global.

De acuerdo con las convenciones del navegador, todas las propiedades de los objetos `URL` son implementadas como getters y setters en el prototipo de la clase, en lugar de como propiedades de datos en el objeto mismo. Por lo tanto, a diferencia de [legacy `urlObject`][]s, utilizar la palabra clave `delete` en cualquiera de las propiedades de los objetos `URL` (p. e.j. `delete
myURL.protocol`, `delete myURL.pathname`, etc) no tiene ningún efecto, pero aún así devolverán `true`.

#### Constructor: new URL(input[, base])

* `input` {string} La entrada URL absoluta o relativa a analizar. Si `input` es relativa, entonces `base` es necesaria. Si `input` es absoluta, la `base` es ignorada.
* `base` {string|URL} La URL base a resolver si la `input` no es absoluta.

Crea un nuevo objeto `URL` al analizar la `input` relativa a la `base`. Si `base` pasa como una string, será analizada de forma equivalente a `new URL(base)`.

```js
const myURL = new URL('/foo', 'https://example.org/');
// https://example.org/foo
```

Se producirá un `TypeError` si la `input` o `base` no son URLs válidas. Tenga en cuenta que se hará un esfuerzo para obligar a los valores dados a convertirse en cadenas. Por ejemplo:

```js
const myURL = new URL({ toString: () => 'https://example.org/' });
// https://example.org/
```

Caracteres unicode que aparecen dentro del hostname de `input` serán automáticamente convertidos a ASCII usando el algoritmo [Punycode](https://tools.ietf.org/html/rfc5891#section-4.4).

```js
const myURL = new URL('https://你好你好');
// https://xn--6qqa088eba/
```

Esta función solo está disponible si el `node` ejecutable fue compilado con el [ICU](intl.html#intl_options_for_building_node_js) habilitado. Si no, los nombres de dominio son pasados sin cambios.

En casos donde no es conocido de antemano si `input` es un URL absoluto y una `base` es proporcionada, es recomendable validar que el `origin` del objeto `URL` es lo esperado.

```js
let myURL = new URL('http://anotherExample.org/', 'https://example.org/');
// http://anotherexample.org/

myURL = new URL('https://anotherExample.org/', 'https://example.org/');
// https://anotherexample.org/

myURL = new URL('foo://anotherExample.org/', 'https://example.org/');
// foo://anotherExample.org/

myURL = new URL('http:anotherExample.org/', 'https://example.org/');
// http://anotherexample.org/

myURL = new URL('https:anotherExample.org/', 'https://example.org/');
// https://example.org/anotherExample.org/

myURL = new URL('foo:anotherExample.org/', 'https://example.org/');
// foo:anotherExample.org/
```

#### url.hash

* {string}

Obtiene y establece la porción del fragmento de la URL.

```js
const myURL = new URL('https://example.org/foo#bar');
console.log(myURL.hash);
// Imprime #bar

myURL.hash = 'baz';
console.log(myURL.href);
// Imprime https://example.org/foo#baz
```

Caracteres URL inválidos incluidos en el valor asignado a la propiedad `hash` son [percent-encoded](#whatwg-percent-encoding). Tenga en cuenta que la selección de los caracteres para percent-encode puede variar un poco de lo que los métodos [`url.parse()`][] y [`url.format()`][] producirían.

#### url.host

* {string}

Obtiene y establece la porción del host de la URL.

```js
const myURL = new URL('https://example.org:81/foo');
console.log(myURL.host);
// Imprime example.org:81

myURL.host = 'example.com:82';
console.log(myURL.href);
// Imprime https://example.com:82/foo
```

Los valores de host inválidos asignados a la propiedad `host` son ignorados.

#### url.hostname

* {string}

Obtiene y establece la porción del hostname de la URL. La diferencia clave entre `url.host` y `url.hostname` es que `url.hostname` *no* incluye el puerto.

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

Obtener el valor de la propiedad `href` es equivalente a llamar a [`url.toString()`][].

Establecer el valor de esta propiedad a un nuevo valor es equivalente a crear un nuevo objeto `URL` usando [`new URL(value)`][`new URL()`]. Cada una de las propiedades del objeto `URL` serán modificadas.

Si el valor asignado a la propiedad `href` no es una URL válida, se producirá un `TypeError`.

#### url.origin

* {string}

Obtiene y establece la serialización del origen de la URL.

```js
const myURL = new URL('https://example.org/foo/bar?baz');
console.log(myURL.origin);
// Imprime https://example.org
```

```js
const idnURL = new URL('https://你好你好');
console.log(idnURL.origin);
// Imprime https://xn--6qqa088eba

console.log(idnURL.hostname);
// Imprime xn--6qqa088eba
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

Caracteres de URL inválidos incluidos en el valor asignado a la propiedad `password` son [percent-encoded](#whatwg-percent-encoding). Tenga en cuenta que la selección de los caracteres para percent-encode puede variar un poco de lo que los métodos [`url.parse()`][] y [`url.format()`][] producirían.

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

Caracteres URL inválidos incluidos en el valor asignado a la propiedad `pathname` son [percent-encoded](#whatwg-percent-encoding). Tenga en cuenta que la selección de los caracteres para percent-encode puede variar un poco de lo que los métodos [`url.parse()`][] y [`url.format()`][] producirían.

#### url.port

* {string}

Obtiene y establece la porción del puerto de la URL.

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

El valor del puerto puede ser establecido ya sea como un número o como una string conteniendo un número en el rango de `0` a `65535` (inclusivo). Establecer el valor al puerto predeterminado de los objetos `URL` dado el `protocol`, resultará en el valor del `port` convirtiéndose en una string vacía (`''`).

Al asignar un valor al puerto, el valor se convertirá primero en una string usando `.toString()`.

Si esa string es inválida pero comienza con un número, el número inicial es asignado a `port`. De otra forma, o si el número se encuentra fuera del rango indicado anteriormente, es ignorado.

Tenga en cuenta que los números que contengan un punto decimal, como los números flotantes o números en notación científica, no son una excepción a esta regla. Los números iniciales hasta el punto decimal serán establecidos como el puerto de la URL, asumiendo que son válidos:

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

Cualquier carácter URL inválido que aparezca en el valor asignado de la propiedad `search` será [percent-encoded](#whatwg-percent-encoding). Tenga en cuenta que la selección de los caracteres para percent-encode puede variar un poco de lo que los métodos [`url.parse()`][] y [`url.format()`][] producirían.

#### url.searchParams

* {URLSearchParams}

Obtiene el objeto [`URLSearchParams`][] representando los parámetros de la consulta de la URL. Esta propiedad es solo para lectura; para reemplazar la totalidad de los parámetros de consulta de la URL, use el setter [`url.search`][]. Vea la documentación [`URLSearchParams`][] para más detalles.

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
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18281
    description: The class is now available on the global object.
-->

La API `URLSearchParams` proporciona acceso para leer y escribir a la consulta de una `URL`. La clase `URLSearchParams` también puede ser usada de forma independiente con uno de los cuatro constructores siguientes. La clase `URLSearchParams` también está disponible en el objeto global.

La interfaz WHATWG `URLSearchParams` y el módulo [`querystring`][], tienen propósitos similares, pero el propósito del módulo [`querystring`][] es más general, ya que permite la personalización de caracteres delimitadores (`&` and `=`). Por otra parte, esta API está diseñada únicamente para strings de consulta URL.

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

Analice la `string` como una string de consulta, y úsela para crear una instancia de un nuevo objeto `URLSearchParams`. Si está presente un `'?'` inicial, es ignorado.

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
added: v7.10.0
-->

* `obj` {Object} Un objeto que representa una colección de pares clave-valor

Crear una instancia de un nuevo objeto `URLSearchParams` con un mapa hash de consulta. La clave y valor de cada propiedad de `obj` siempre son forzados a strings.

A diferencia del módulo [`querystring`][], las claves duplicadas en forma de valores de array no son permitidas. Los arrays son codificados usando [`array.toString()`][], el cual simplemente une todos los elementos array con comas.

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
added: v7.10.0
-->

* `iterable` {Iterable} Un objeto iterable cuyos elementos son pares clave-valor

Crear una instancia de un nuevo objeto `URLSearchParams` con un mapa iterable de forma que sea similar al constructor [`Map`][]. `iterable` puede ser un `Array` o cualquier objeto iterable. Eso significa que `iterable` puede ser otro `URLSearchParams`, en tal caso el constructor simplemente creará un clon del `URLSearchParams` proporcionado. Los elementos de `iterable` son pares clave-valor, y ellos mismos pueden ser cualquier objeto iterable.

Las llaves duplicadas son permitidas.

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

Devuelve un `Iterator` ES6 sobre cada uno de los pares nombre-valor en la consulta. Cada ítem del iterador es un `Array` de JavaScript. El primer ítem del `Array` es el `name`, el segundo ítem del `Array` es el `value`.

Alias para [`urlSearchParams[@@iterator]()`][`urlSearchParams@@iterator()`].

#### urlSearchParams.forEach(fn[, thisArg])

* `fn` {Function} Invocado por cada par nombre-valor en la consulta
* `thisArg` {Object} Para ser usado como `this` valor para cuando `fn` es llamado

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
* Devuelve: {string} o `null` si no hay ningún par nombre-valor con el `name` dado.

Devuelve el valor del primer par nombre-valor cuyo nombre es `name`. Si no hay tales pares, `null` es devuelto.

#### urlSearchParams.getAll(name)

* `name` {string}
* Devuelve: {string[]}

Devuelve los valores de todos los pares nombre-valor cuyos nombres son `name`. Si no hay tales pares, un array vacío es devuelto.

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

Establece el valor en el objeto `URLSearchParams` asociado con `name` para `value`. Si hay pares nombre-valor preexistentes cuyos nombres son `name`, establezca el primer valor de dicho par a `value` y elimine los otros. Si no es así, agregue el par nombre-valor a la string de consulta.

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
added: v7.7.0
-->

Clasifique todos los pares nombre-valor existentes en su lugar por sus nombres. La clasificación está lista con un [stable sorting algorithm](https://en.wikipedia.org/wiki/Sorting_algorithm#Stability), así que el orden relativo entre pares nombre-valor con el mismo nombre es conservado.

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

* Returns: {Iterator}

Returns an ES6 `Iterator` over the values of each name-value pair.

#### urlSearchParams\[Symbol.iterator\]()

* Returns: {Iterator}

Returns an ES6 `Iterator` over each of the name-value pairs in the query string. Cada ítem del iterador es un `Array` de JavaScript. El primer ítem del `Array` es el `name`, el segundo ítem del `Array` es el `value`.

Alias for [`urlSearchParams.entries()`][].

```js
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
* Returns: {string}

Returns the [Punycode](https://tools.ietf.org/html/rfc5891#section-4.4) ASCII serialization of the `domain`. If `domain` is an invalid domain, the empty string is returned.

It performs the inverse operation to [`url.domainToUnicode()`][].

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
* Returns: {string}

Returns the Unicode serialization of the `domain`. If `domain` is an invalid domain, the empty string is returned.

It performs the inverse operation to [`url.domainToASCII()`][].

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

* `URL` {URL} A [WHATWG URL](#url_the_whatwg_url_api) object
* `options` {Object} 
  * `auth` {boolean} `true` if the serialized URL string should include the username and password, `false` otherwise. **Default:** `true`.
  * `fragment` {boolean} `true` if the serialized URL string should include the fragment, `false` otherwise. **Default:** `true`.
  * `search` {boolean} `true` if the serialized URL string should include the search query, `false` otherwise. **Default:** `true`.
  * `unicode` {boolean} `true` if Unicode characters appearing in the host component of the URL string should be encoded directly as opposed to being Punycode encoded. **Default:** `false`.
* Returns: {string}

Returns a customizable serialization of a URL `String` representation of a [WHATWG URL](#url_the_whatwg_url_api) object.

The URL object has both a `toString()` method and `href` property that return string serializations of the URL. These are not, however, customizable in any way. The `url.format(URL[, options])` method allows for basic customization of the output.

For example:

```js
const myURL = new URL('https://a:b@你好你好?abc#foo');

console.log(myURL.href);
// Prints https://a:b@xn--6qqa088eba/?abc#foo

console.log(myURL.toString());
// Prints https://a:b@xn--6qqa088eba/?abc#foo

console.log(url.format(myURL, { fragment: false, unicode: true, auth: false }));
// Prints 'https://你好你好/?abc'
```

## Legacy URL API

### Legacy `urlObject`

The legacy `urlObject` (`require('url').Url`) is created and returned by the `url.parse()` function.

#### urlObject.auth

The `auth` property is the username and password portion of the URL, also referred to as "userinfo". This string subset follows the `protocol` and double slashes (if present) and precedes the `host` component, delimited by an ASCII "at sign" (`@`). The format of the string is `{username}[:{password}]`, with the `[:{password}]` portion being optional.

For example: `'user:pass'`.

#### urlObject.hash

The `hash` property consists of the "fragment" portion of the URL including the leading ASCII hash (`#`) character.

For example: `'#hash'`.

#### urlObject.host

The `host` property is the full lower-cased host portion of the URL, including the `port` if specified.

For example: `'sub.host.com:8080'`.

#### urlObject.hostname

The `hostname` property is the lower-cased host name portion of the `host` component *without* the `port` included.

For example: `'sub.host.com'`.

#### urlObject.href

The `href` property is the full URL string that was parsed with both the `protocol` and `host` components converted to lower-case.

For example: `'http://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash'`.

#### urlObject.path

The `path` property is a concatenation of the `pathname` and `search` components.

For example: `'/p/a/t/h?query=string'`.

No decoding of the `path` is performed.

#### urlObject.pathname

The `pathname` property consists of the entire path section of the URL. This is everything following the `host` (including the `port`) and before the start of the `query` or `hash` components, delimited by either the ASCII question mark (`?`) or hash (`#`) characters.

For example `'/p/a/t/h'`.

No decoding of the path string is performed.

#### urlObject.port

The `port` property is the numeric port portion of the `host` component.

For example: `'8080'`.

#### urlObject.protocol

The `protocol` property identifies the URL's lower-cased protocol scheme.

For example: `'http:'`.

#### urlObject.query

The `query` property is either the query string without the leading ASCII question mark (`?`), or an object returned by the [`querystring`][] module's `parse()` method. Whether the `query` property is a string or object is determined by the `parseQueryString` argument passed to `url.parse()`.

For example: `'query=string'` or `{'query': 'string'}`.

If returned as a string, no decoding of the query string is performed. If returned as an object, both keys and values are decoded.

#### urlObject.search

The `search` property consists of the entire "query string" portion of the URL, including the leading ASCII question mark (`?`) character.

For example: `'?query=string'`.

No decoding of the query string is performed.

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

The formatting process operates as follows:

* A new empty string `result` is created.
* If `urlObject.protocol` is a string, it is appended as-is to `result`.
* Otherwise, if `urlObject.protocol` is not `undefined` and is not a string, an [`Error`][] is thrown.
* For all string values of `urlObject.protocol` that *do not end* with an ASCII colon (`:`) character, the literal string `:` will be appended to `result`.
* If either of the following conditions is true, then the literal string `//` will be appended to `result`: * `urlObject.slashes` property is true; * `urlObject.protocol` begins with `http`, `https`, `ftp`, `gopher`, or `file`;
* If the value of the `urlObject.auth` property is truthy, and either `urlObject.host` or `urlObject.hostname` are not `undefined`, the value of `urlObject.auth` will be coerced into a string and appended to `result` followed by the literal string `@`.
* If the `urlObject.host` property is `undefined` then: 
  * If the `urlObject.hostname` is a string, it is appended to `result`.
  * Otherwise, if `urlObject.hostname` is not `undefined` and is not a string, an [`Error`][] is thrown.
  * If the `urlObject.port` property value is truthy, and `urlObject.hostname` is not `undefined`: 
    * The literal string `:` is appended to `result`, and
    * The value of `urlObject.port` is coerced to a string and appended to `result`.
* Otherwise, if the `urlObject.host` property value is truthy, the value of `urlObject.host` is coerced to a string and appended to `result`.
* If the `urlObject.pathname` property is a string that is not an empty string: 
  * If the `urlObject.pathname` *does not start* with an ASCII forward slash (`/`), then the literal string `'/'` is appended to `result`.
  * The value of `urlObject.pathname` is appended to `result`.
* Otherwise, if `urlObject.pathname` is not `undefined` and is not a string, an [`Error`][] is thrown.
* If the `urlObject.search` property is `undefined` and if the `urlObject.query` property is an `Object`, the literal string `?` is appended to `result` followed by the output of calling the [`querystring`][] module's `stringify()` method passing the value of `urlObject.query`.
* Otherwise, if `urlObject.search` is a string: 
  * If the value of `urlObject.search` *does not start* with the ASCII question mark (`?`) character, the literal string `?` is appended to `result`.
  * The value of `urlObject.search` is appended to `result`.
* Otherwise, if `urlObject.search` is not `undefined` and is not a string, an [`Error`][] is thrown.
* If the `urlObject.hash` property is a string: 
  * If the value of `urlObject.hash` *does not start* with the ASCII hash (`#`) character, the literal string `#` is appended to `result`.
  * The value of `urlObject.hash` is appended to `result`.
* Otherwise, if the `urlObject.hash` property is not `undefined` and is not a string, an [`Error`][] is thrown.
* `result` is returned.

### url.parse(urlString[, parseQueryString[, slashesDenoteHost]])

<!-- YAML
added: v0.1.25
changes:

  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/13606
    description: The `search` property on the returned URL object is now `null`
                 when no query string is present.
-->

* `urlString` {string} The URL string to parse.
* `parseQueryString` {boolean} If `true`, the `query` property will always be set to an object returned by the [`querystring`][] module's `parse()` method. If `false`, the `query` property on the returned URL object will be an unparsed, undecoded string. **Default:** `false`.
* `slashesDenoteHost` {boolean} If `true`, the first token after the literal string `//` and preceding the next `/` will be interpreted as the `host`. For instance, given `//foo/bar`, the result would be `{host: 'foo', pathname: '/bar'}` rather than `{pathname: '//foo/bar'}`. **Default:** `false`.

The `url.parse()` method takes a URL string, parses it, and returns a URL object.

A `TypeError` is thrown if `urlString` is not a string.

A `URIError` is thrown if the `auth` property is present but cannot be decoded.

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

* `from` {string} The Base URL being resolved against.
* `to` {string} The HREF URL being resolved.

The `url.resolve()` method resolves a target URL relative to a base URL in a manner similar to that of a Web browser resolving an anchor tag HREF.

For example:

```js
const url = require('url');
url.resolve('/one/two/three', 'four');         // '/one/two/four'
url.resolve('http://example.com/', '/one');    // 'http://example.com/one'
url.resolve('http://example.com/one', '/two'); // 'http://example.com/two'
```

<a id="whatwg-percent-encoding"></a>

## Percent-Encoding in URLs

URLs are permitted to only contain a certain range of characters. Any character falling outside of that range must be encoded. How such characters are encoded, and which characters to encode depends entirely on where the character is located within the structure of the URL.

### Legacy API

Within the Legacy API, spaces (`' '`) and the following characters will be automatically escaped in the properties of URL objects:

```txt
< > " ` \r \n \t { } | \ ^ '
```

For example, the ASCII space character (`' '`) is encoded as `%20`. The ASCII forward slash (`/`) character is encoded as `%3C`.

### WHATWG API

The [WHATWG URL Standard](https://url.spec.whatwg.org/) uses a more selective and fine grained approach to selecting encoded characters than that used by the Legacy API.

The WHATWG algorithm defines four "percent-encode sets" that describe ranges of characters that must be percent-encoded:

* The *C0 control percent-encode set* includes code points in range U+0000 to U+001F (inclusive) and all code points greater than U+007E.

* The *fragment percent-encode set* includes the *C0 control percent-encode set* and code points U+0020, U+0022, U+003C, U+003E, and U+0060.

* The *path percent-encode set* includes the *C0 control percent-encode set* and code points U+0020, U+0022, U+0023, U+003C, U+003E, U+003F, U+0060, U+007B, and U+007D.

* The *userinfo encode set* includes the *path percent-encode set* and code points U+002F, U+003A, U+003B, U+003D, U+0040, U+005B, U+005C, U+005D, U+005E, and U+007C.

The *userinfo percent-encode set* is used exclusively for username and passwords encoded within the URL. The *path percent-encode set* is used for the path of most URLs. The *fragment percent-encode set* is used for URL fragments. The *C0 control percent-encode set* is used for host and path under certain specific conditions, in addition to all other cases.

When non-ASCII characters appear within a hostname, the hostname is encoded using the [Punycode](https://tools.ietf.org/html/rfc5891#section-4.4) algorithm. Note, however, that a hostname *may* contain *both* Punycode encoded and percent-encoded characters. For example:

```js
const myURL = new URL('https://%CF%80.com/foo');
console.log(myURL.href);
// Prints https://xn--1xa.com/foo
console.log(myURL.origin);
// Prints https://π.com
```