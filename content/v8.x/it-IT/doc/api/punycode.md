# Punycode
<!-- YAML
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7941
    description: Accessing this module will now emit a deprecation warning.
-->

<!--introduced_in=v0.10.0-->

> Stabilità: 0 - Deprecato

**La versione del modulo punycode in bundle in Node.js è deprecata**. In una futura versione principale di Node.js questo modulo verrà rimosso. Gli utenti che attualmente dipendono dal modulo `punycode` dovrebbero invece passare all'utilizzo del modulo [Punycode.js](https://mths.be/punycode) fornito dall'userland.

Il modulo `punycode` è una versione in bundle del modulo [Punycode.js](https://mths.be/punycode). Ci si può accedere utilizzando:

```js
const punycode = require('punycode');
```

[Punycode](https://tools.ietf.org/html/rfc3492) è uno schema di codifica dei caratteri definito da RFC 3492 destinato principalmente all'utilizzo nei Nomi di Dominio Internazionalizzati. Poiché i nomi host negli URL sono limitati ai soli caratteri ASCII, i Nomi di Dominio che contengono caratteri non-ASCII devono essere convertiti in ASCII utilizzando lo schema Punycode. Ad esempio, il carattere giapponese che si traduce nella parola inglese `'example'` è `'例'`. Il Nome di Dominio Internazionalizzato, `'例.com'` (equivalente a `'example.com'`) è rappresentato da Punycode come la stringa ASCII `'xn--fsq.com'`.

Il modulo `punycode` fornisce una semplice implementazione dello standard Punycode.

*Note*: The `punycode` module is a third-party dependency used by Node.js and made available to developers as a convenience. Correzioni o altre modifiche al modulo devono essere indirizzate al progetto [Punycode.js](https://mths.be/punycode).

## punycode.decode(string)
<!-- YAML
added: v0.5.1
-->

* `string` {string}

Il metodo `punycode.decode()` converte una stringa [Punycode](https://tools.ietf.org/html/rfc3492) di caratteri solo ASCII nella stringa equivalente di punti di codice Unicode.

```js
punycode.decode('maana-pta'); // 'mañana'
punycode.decode('--dqo34k'); // '☃-⌘'
```

## punycode.encode(string)
<!-- YAML
added: v0.5.1
-->

* `string` {string}

Il metodo `punycode.encode()` converte una stringa di codepoint Unicode in una stringa [Punycode](https://tools.ietf.org/html/rfc3492) di caratteri solo ASCII.

```js
punycode.encode('mañana'); // 'maana-pta'
punycode.encode('☃-⌘'); // '--dqo34k'
```

## punycode.toASCII(domain)
<!-- YAML
added: v0.6.1
-->

* `domain` {string}

Il metodo `punycode.toASCII()` converte una stringa Unicode che rappresenta un Nome di Dominio Internazionalizzato in [Punycode](https://tools.ietf.org/html/rfc3492). Verranno convertite solo le parti non-ASCII del nome di dominio. Chiamare `punycode.toASCII()` su una stringa che già contiene solo caratteri ASCII non avrà alcun effetto.

```js
// codifica nomi di dominio
punycode.toASCII('mañana.com');  // 'xn--maana-pta.com'
punycode.toASCII('☃-⌘.com');   // 'xn----dqo34k.com'
punycode.toASCII('example.com'); // 'example.com'
```

## punycode.toUnicode(domain)
<!-- YAML
added: v0.6.1
-->

* `domain` {string}

Il metodo `punycode.toUnicode()` converte una stringa che rappresenta un nome di dominio contenente caratteri codificati [Punycode](https://tools.ietf.org/html/rfc3492) in Unicode. Solo le parti codificate con codice [Punycode](https://tools.ietf.org/html/rfc3492) del nome di dominio vengono convertite.

```js
// decodifica nomi di dominio
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

Il metodo `punycode.ucs2.decode()` restituisce un array contenente i valori numerici dei punti di codice di ciascun simbolo Unicode nella stringa.

```js
punycode.ucs2.decode('abc'); // [0x61, 0x62, 0x63]
// coppia surrogata per U+1D306 tetragram for centre:
punycode.ucs2.decode('\uD834\uDF06'); // [0x1D306]
```

### punycode.ucs2.encode(codePoints)
<!-- YAML
added: v0.7.0
-->

* `codePoints` {Array}

Il metodo `punycode.ucs2.encode()` restituisce una stringa basata su un array di valori numerici di punti di codice.

```js
punycode.ucs2.encode([0x61, 0x62, 0x63]); // 'abc'
punycode.ucs2.encode([0x1D306]); // '\uD834\uDF06'
```

## punycode.version
<!-- YAML
added: v0.6.1
-->

Restituisce una stringa che identifica il numero di versione corrente di [Punycode.js](https://mths.be/punycode).
