# Punycode

<!-- YAML
changes:

  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7941
    description: Accessing this module will now emit a deprecation warning.
-->

<!--introduced_in=v0.10.0-->

> Estabilidad: 0 - Desaprobado

**La versión del módulo Punycode incluida en Node.js se encuentra en desuso**. Será eliminada de este módulo en una próxima versión de Node.js. Los usuarios que actualmente dependan del módulo `punycode` deberán cambiar al módulo [Punycode.js](https://mths.be/punycode) proporcionado por el espacio de usuario.

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

El método `punycode.decode()` convierte una string [Punycode](https://tools.ietf.org/html/rfc3492) de caracteres ASCII únicamente a la string equivalente de puntos de código de Unicode.

```js
punycode.decode('maana-pta'); // 'mañana'
punycode.decode('--dqo34k'); // '☃-⌘'
```

## punycode.encode(string)

<!-- YAML
added: v0.5.1
-->

* `string` {string}

El método `punycode.encode()` convierte una string de puntos de código de Unicode a una string [Punycode](https://tools.ietf.org/html/rfc3492) de sólo caracteres ASCII.

```js
punycode.encode('mañana'); // 'maana-pta'
punycode.encode('☃-⌘'); // '--dqo34k'
```

## punycode.toASCII(domain)

<!-- YAML
added: v0.6.1
-->

* `domain` {string}

El método `punycode.toASCII()` convierte una string Unicode que representa un Nombre de Dominio Internacionalizado a [Punycode](https://tools.ietf.org/html/rfc3492). Sólo las partes distintas de ASCII del nombre del dominio serán convertidas. El llamar a `punycode.toASCII()` en una string que ya contiene sólo caracteres ASCII no tendrá efecto.

```js
// codificar nombres de dominio
punycode.toASCII('mañana.com');  // 'xn--maana-pta.com'
punycode.toASCII('☃-⌘.com');   // 'xn----dqo34k.com'
punycode.toASCII('example.com'); // 'example.com'
```

## punycode.toUnicode(domain)

<!-- YAML
added: v0.6.1
-->

* `domain` {string}

El método `punycode.toUnicode()` convierte una string que representa a un nombre de dominio que contiene caracteres codificados de [Punycode](https://tools.ietf.org/html/rfc3492) en Unicode. Sólo las partes codificadas de [Punycode](https://tools.ietf.org/html/rfc3492) del nombre del dominio son convertidas.

```js
// decodificar los nombres de dominio
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

El método `punycode.ucs2.decode()` devuelve un array que contiene los valores de puntos de código numéricos de cada símbolo de Unicode en la string.

```js
punycode.ucs2.decode('abc'); // [0x61, 0x62, 0x63]
// par suplente para el tetragrama U+1D30 para el centro:
punycode.ucs2.decode('\uD834\uDF06'); // [0x1D306]
```

### punycode.ucs2.encode(codePoints)

<!-- YAML
added: v0.7.0
-->

* `codePoints` {integer[]}

El método `punycode.ucs2.encode()` devuelve una string basada en un array de valores de puntos de código numéricos.

```js
punycode.ucs2.encode([0x61, 0x62, 0x63]); // 'abc'
punycode.ucs2.encode([0x1D306]); // '\uD834\uDF06'
```

## punycode.version

<!-- YAML
added: v0.6.1
-->

* {string}

Devuelve una string que identifica el número de la versión de [Punycode.js](https://mths.be/punycode) actual.