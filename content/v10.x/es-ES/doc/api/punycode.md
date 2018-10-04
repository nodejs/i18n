# Punycode

<!-- YAML
changes:

  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7941
    description: Accessing this module will now emit a deprecation warning.
-->

<!--introduced_in=v0.10.0-->

> Estabilidad: 0 - En desuso

**La versión del módulo Punycode incluida en Node.js se encuentra en desuso**. Será eliminada de este módulo en una próxima versión de Node.js. Los usuarios que actualmente dependan del módulo `punycode` deberán cambiar al usuario provisto en el módulo [Punycode.js](https://mths.be/punycode).

El módulo `punycode` es una versión añadida al módulo [Punycode.js](https://mths.be/punycode). Se puede acceder a través de:

```js
const punycode = require('punycode');
```

[Punycode](https://tools.ietf.org/html/rfc3492) es un esquema de codificación de caracter definido por RFC 3492 que está destinado principalmente para el uso en Nombres de Dominios Internacionalizados. Debido a que los nombres de host en URLs son limitados a caracteres ASCII únicamente, los Nombres de Dominio que contengan caracteres distintos a ASCII deben ser convertidos a ASCII utilizado el esquema de Punycode. Por ejemplo, el caracter japonés que se traduce a la palabra en inglés, `'example'` es `'例'`. El Nombre de Dominio Internacionalizado, `'例.com'` (equivalente a `'example.com'`) está representado por Punycode como el string ASCII `'xn--fsq.com'`.

El módulo `punycode` proporciona una implementación simple del Punycode estándar.

El módulo `punycode` es una dependencia de terceros utilizada por Node.js y que está disponible para desarrolladores como una conveniencia. Las reparaciones u otras modificaciones al módulo deben ser dirigidas al proyecto [Punycode.js](https://mths.be/punycode).

## punycode.decode(string)

<!-- YAML
added: v0.5.1
-->

* `string` {string}

The `punycode.decode()` method converts a [Punycode](https://tools.ietf.org/html/rfc3492) string of ASCII-only characters to the equivalent string of Unicode codepoints.

```js
punycode.decode('maana-pta'); // 'mañana'
punycode.decode('--dqo34k'); // '☃-⌘'
```

## punycode.encode(string)

<!-- YAML
added: v0.5.1
-->

* `string` {string}

The `punycode.encode()` method converts a string of Unicode codepoints to a [Punycode](https://tools.ietf.org/html/rfc3492) string of ASCII-only characters.

```js
punycode.encode('mañana'); // 'maana-pta'
punycode.encode('☃-⌘'); // '--dqo34k'
```

## punycode.toASCII(domain)

<!-- YAML
added: v0.6.1
-->

* `domain` {string}

The `punycode.toASCII()` method converts a Unicode string representing an Internationalized Domain Name to [Punycode](https://tools.ietf.org/html/rfc3492). Only the non-ASCII parts of the domain name will be converted. Calling `punycode.toASCII()` on a string that already only contains ASCII characters will have no effect.

```js
// encode domain names
punycode.toASCII('mañana.com');  // 'xn--maana-pta.com'
punycode.toASCII('☃-⌘.com');   // 'xn----dqo34k.com'
punycode.toASCII('example.com'); // 'example.com'
```

## punycode.toUnicode(domain)

<!-- YAML
added: v0.6.1
-->

* `domain` {string}

The `punycode.toUnicode()` method converts a string representing a domain name containing [Punycode](https://tools.ietf.org/html/rfc3492) encoded characters into Unicode. Only the [Punycode](https://tools.ietf.org/html/rfc3492) encoded parts of the domain name are be converted.

```js
// decode domain names
punycode.toUnicode('xn--maana-pta.com'); // 'mañana.com'
punycode.toUnicode('xn----dqo34k.com');  // '☃-⌘.com'
punycode.toUnicode('example.com');       // 'example.com'
```

## punycode.ucs2

<!-- YAML
added: v0.7.0
-->

### punycode.ucs2.decode(string)

<!-- YAML
added: v0.7.0
-->

* `string` {string}

The `punycode.ucs2.decode()` method returns an array containing the numeric codepoint values of each Unicode symbol in the string.

```js
punycode.ucs2.decode('abc'); // [0x61, 0x62, 0x63]
// surrogate pair for U+1D306 tetragram for centre:
punycode.ucs2.decode('\uD834\uDF06'); // [0x1D306]
```

### punycode.ucs2.encode(codePoints)

<!-- YAML
added: v0.7.0
-->

* `codePoints` {integer[]}

The `punycode.ucs2.encode()` method returns a string based on an array of numeric code point values.

```js
punycode.ucs2.encode([0x61, 0x62, 0x63]); // 'abc'
punycode.ucs2.encode([0x1D306]); // '\uD834\uDF06'
```

## punycode.version

<!-- YAML
added: v0.6.1
-->

* {string}

Returns a string identifying the current [Punycode.js](https://mths.be/punycode) version number.