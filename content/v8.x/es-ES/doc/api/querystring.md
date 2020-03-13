# String de Consulta

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

<!--name=querystring-->

El módulo `querystring` proporciona utilidades para análisis y formateo de strings de consulta de URL. Se puede acceder a él utilizando:

```js
const querystring = require('querystring');
```

## querystring.escape(str)
<!-- YAML
added: v0.1.25
-->

* `str` {string}

El método `querystring.escape()` realiza codificación porcentual de URL en el `str` dado, de una forma que está optimizada para los requerimientos específicos de las strings de consulta de URL.

El método `querystring.escape()` es utilizado por `querystring.stringify()` y generalmente no se espera que sea utilizado de forma directa. Principalmente, se exporta para permitir que el código de aplicación proporcione una codificación porcentual de remplazo, de ser necesario, asignando `querystring.escape` a una función alternativa.

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

* `str` {string} La string de consulta de URL a analizar
* `sep` {string} La subcadena utilizada para delimitar los pares de clave y valor en la string de consulta. **Predeterminado:** `'&'`.
* `eq` {string}. La subcadena utilizada para delimitar claves y valores en la string de consulta. **Predeterminado:** `'='`.
* `opciones` {Object}
  * `decodeURIComponent` {Function} La función que se utiliza al decodificar caracteres de codificación porcentual en la string de consulta. **Predeterminado:** `querystring.unescape()`.
  * `maxKeys` {number} Especifica el número máximo de claves a analizar. Especifique `0` para remover las limitaciones del conteo de claves. **Default:** `1000`.

El método `querystring.parse()` analiza una string de consulta de URL (`str`) en una colección de pares de clave y valor.

Por ejemplo, la string de consulta `'foo=bar&abc=xyz&abc=123'` es analizada en:
```js
{
  foo: 'bar',
  abc: ['xyz', '123']
}
```

*Note*: The object returned by the `querystring.parse()` method _does not_ prototypically inherit from the JavaScript `Object`. Esto significa que métodos típicos de `Object` tales como `obj.toString()`, `obj.hasOwnProperty()`, entre otros, no están definidos y *no funcionarán*.

Por defecto, se asumirá que los caracteres codificados porcentualmente dentro de la string de consulta utilizan codificación UTF-8. Si se utiliza una codificación de caracteres alternativa, entonces se deberá especificar una opción `decodeURIComponent` alternativa, como se ilustra en el siguiente ejemplo:

```js
// Asumiento que la función gbkDecodeURIComponent ya existe...

querystring.parse('w=%D6%D0%CE%C4&foo=bar', null, null,
                  { decodeURIComponent: gbkDecodeURIComponent });
```

## querystring.stringify(obj[, sep[, eq[, options]]])<!-- YAML
added: v0.1.25
-->* `obj` {Object} El objeto a serializar en una string de consulta de URL
* `sep` {string} La subcadena utilizada para delimitar los pares de clave y valor en la string de consulta. **Predeterminado:** `'&'`.
* `eq` {string}. La subcadena utilizada para delimitar claves y valores en la string de consulta. **Predeterminado:** `'='`.
* `options`
  * `encodeURIComponent` {Function} La función a utilizar al convertir caracteres no seguros de URL a codificación porcentual en la string de consulta. **Predeterminado:** `querystring.escape()`.

El método `querystring.stringify()` produce una string de consulta partiendo de un `obj` dado, mediante la iteración a través de las "propiedades propias" del objeto.

It serializes the following types of values passed in `obj`:
{string|number|boolean|string[]|number[]|boolean[]}
Any other input values will be coerced to empty strings.

For example:

```js
querystring.stringify({ foo: 'bar', baz: ['qux', 'quux'], corge: '' });
// devuelve 'foo=bar&baz=qux&baz=quux&corge='

querystring.stringify({ foo: 'bar', baz: 'qux' }, ';', ':');
// devuelve 'foo:bar;baz:qux'
```

Por defecto, los caracteres que requieren codificación en porcentaje dentro de la cadena de consulta se codificarán como UTF-8. Si una codificación alternativa es requerida, entonces una opción `encodeURIComponent` alternativa necesitará ser especificada como se ilustra en el siguiente ejemplo:

```js
// Asumiendo que la función gbkEncodeURIComponent ya existe,

querystring.stringify({ w: '中文', foo: 'bar' }, null, null,
                      { encodeURIComponent: gbkEncodeURIComponent });
```

## querystring.unescape(str)
<!-- YAML
added: v0.1.25
-->

* `str` {string}


El método `querystring.unescape()`realiza la decodificación de caracteres codificados en porcentaje de URL en la `str` dada.

El método `querystring.unescape()` es utilizado por `querystring.parse()` y generalmente no se espera que se use directamente. Principalmente, es exportado para permitir que el código de aplicación pueda proporcionar una implementación de codificación de reemplazo si es necesario, asignando `querystring.unescape` a una función alternativa.

Por defecto, el método `querystring.unescape()` intentará utilizar el método incorporado de JavaScript `decodeURIComponent()` para decodificar. Si falla, se utilizará un equivalente más seguro que no arroje en URLs mal formadas.
