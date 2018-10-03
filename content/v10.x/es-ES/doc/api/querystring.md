# Cadena de Consulta

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

<!--name=querystring-->

El módulo `querystring` proporciona utilidades para análisis y formateo de cadenas de consulta de URL. Puede ser accedido utilizando:

```js
const querystring = require('querystring');
```

## querystring.escape(str)

<!-- YAML
added: v0.1.25
-->

* `str` {string}

El método `querystring.escape()` realiza la codificación de porcentaje de URL en la `str` dada de una manera que está optimizada para los requisitos específicos de las cadenas de consulta de URL.

El método `querystring.escape()` es utilizado por `querystring.stringify()` y generalmente no se espera que se use directamente. Es exportado principalmente para permitir que el código de aplicación para proporcionar una implementación de codificación de porcentaje de reemplazo si es necesario para asignar `querystring.escape` a una función alternativa.

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

* `str` {string} La cadena de consulta de URL a analizar
* `sep` {string} La subcadena utilizada para delimitar los pares de clave y valor en la cadena de consulta. **Predeterminado:** `'&'`.
* `eq` {string}. La subcadena utilizada para delimitar claves y valores en la cadena de consultas. **Predeterminado:** `'='`.
* `options` {Object} 
  * `decodeURIComponent` {Function} La función que se utiliza al decodificar caracteres codificados en porcentaje en la cadena de consulta. **Predeterminado:** `querystring.unescape()`.
  * `maxKeys` {number} Especifica el número máximo de claves a analizar. Especifica `0` para quitar las limitaciones clave del conteo. **Default:** `1000`.

El método `querystring.parse()` analiza una cadena de consulta de URL (`str`) en una colección de pares de clave y valor.

Por ejemplo, la cadena de consulta `'foo=bar&abc=xyz&abc=123'` es analizada en:

<!-- eslint-skip -->

```js
{
  foo: 'bar',
  abc: ['xyz', '123']
}
```

El objeto devuelto por el método `querystring.parse()` *no* se hereda de forma prototípica desde el `Object` de JavaScript. Esto significa que métodos típicos de `Object` tales como `obj.toString()`, `obj.hasOwnProperty()`, entre otros, no están definidos y *no funcionarán*.

De forma predeterminada, se supondrá que los caracteres codificados en porcentaje dentro de la cadena de consulta utilizan la codificación UTF-8. Si un caracter alternativo codificado es utilizado, entonces una opción `decodeURIComponent` alternativa necesitará ser especificada como se ilustra en el siguiente ejemplo:

```js
// Asumiendo que la función gbkDecodeURIComponent ya existe...

querystring.parse('w=%D6%D0%CE%C4&foo=bar', null, null,
                  { decodeURIComponent: gbkDecodeURIComponent });
```

## querystring.stringify(obj[, sep[, eq[, options]]])

<!-- YAML
added: v0.1.25
-->

* `obj` {Object} El objeto a serializar en una cadena de consulta de URL
* `sep` {string} La subcadena utilizada para delimitar los pares de clave y valor en la cadena de consulta. **Predeterminado:** `'&'`.
* `eq` {string}. La subcadena utilizada para delimitar claves y valores en la cadena de consulta. **Predeterminado:** `'='`.
* `options` 
  * `encodeURIComponent` {Function} La función que se utiliza al convertir caracteres no seguros de URL a codificación de porcentaje en la cadena de consulta. **Predeterminado:** `querystring.escape()`.

El método `querystring.stringify()` produce una cadena de consulta de URL desde un `obj` dado mediante la iteración a través de las "propiedades propias" del objeto.

It serializes the following types of values passed in `obj`: {string|number|boolean|string[]|number[]|boolean[]} Any other input values will be coerced to empty strings.

```js
querystring.stringify({ foo: 'bar', baz: ['qux', 'quux'], corge: '' });
// returns 'foo=bar&baz=qux&baz=quux&corge='

querystring.stringify({ foo: 'bar', baz: 'qux' }, ';', ':');
// returns 'foo:bar;baz:qux'
```

By default, characters requiring percent-encoding within the query string will be encoded as UTF-8. If an alternative encoding is required, then an alternative `encodeURIComponent` option will need to be specified as illustrated in the following example:

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

The `querystring.unescape()` method performs decoding of URL percent-encoded characters on the given `str`.

The `querystring.unescape()` method is used by `querystring.parse()` and is generally not expected to be used directly. It is exported primarily to allow application code to provide a replacement decoding implementation if necessary by assigning `querystring.unescape` to an alternative function.

By default, the `querystring.unescape()` method will attempt to use the JavaScript built-in `decodeURIComponent()` method to decode. If that fails, a safer equivalent that does not throw on malformed URLs will be used.