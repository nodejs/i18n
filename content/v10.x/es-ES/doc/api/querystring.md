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

El método `querystring.escape()` es utilizado por `querystring.stringify()` y generalmente no se espera que se use directamente. Principalmente, es exportado para permitir que el código de aplicación pueda proporcionar una implementación de codificación de porcentaje de reemplazo si es necesario, asignando `querystring.escape` a una función alternativa.

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
* `eq` {string}. La subcadena utilizada para delimitar claves y valores en la cadena de consulta. **Predeterminado:** `'='`.
* `options` {Object} 
  * `decodeURIComponent` {Function} La función que se utiliza al decodificar caracteres codificados en porcentaje en la cadena de consulta. **Predeterminado:** `querystring.unescape()`.
  * `maxKeys` {number} Especifica el número máximo de claves a analizar. Especifica `0` para quitar las limitaciones del conteo de claves. **Default:** `1000`.

El método `querystring.parse()` analiza una cadena de consulta de URL (`str`) en una colección de pares de clave y valor.

Por ejemplo, la cadena de consulta `'foo=bar&abc=xyz&abc=123'` es analizada en:

<!-- eslint-skip -->

```js
{
  foo: 'bar',
  abc: ['xyz', '123']
}
```

El objeto devuelto por el método `querystring.parse()` *no* se hereda de forma prototípica desde el `Object` de JavaScript. Esto significa que métodos típicos de `Object`, tales como `obj.toString()`, `obj.hasOwnProperty()`, entre otros, no están definidos y *no funcionarán*.

De forma predeterminada, se supondrá que los caracteres codificados en porcentaje dentro de la cadena de consulta utilizan la codificación UTF-8. Si una codificación alterna de caracteres es utilizada, entonces una opción `decodeURIComponent` alternativa necesitará ser especificada como se ilustra en el siguiente ejemplo:

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

El método `querystring.stringify()` produce una cadena de consulta de URL desde un `obj` dado, mediante la iteración a través de las "propiedades propias" del objeto.

Serializa los siguientes tipos de valores pasados en `obj`: {string|number|boolean|string[]|number[]|boolean[]} Cualquier otro valor de entrada será forzado a cadenas vacías.

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