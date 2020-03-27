# String Dekorierer

<!--introduced_in=v0.10.0-->

> Stabilität: 2 - Stabil

The `string_decoder` module provides an API for decoding `Buffer` objects into strings in a manner that preserves encoded multi-byte UTF-8 and UTF-16 characters. Es kann zugegriffen werden durch:

```js
const { StringDecoder } = require('string_decoder');
```

Das folgende Beispiel zeigt die grundlegende Verwendung der `StringDecoder` Klasse.

```js
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');

const cent = Buffer. rom([0xC2, 0xA2]);
console.log(decoder.write(cent));

const euro = Buffer.from([0xE2, 0x82, 0xAC]);
console.log(decoder.write(euro));
```

When a `Buffer` instance is written to the `StringDecoder` instance, an internal buffer is used to ensure that the decoded string does not contain any incomplete multibyte characters. These are held in the buffer until the next call to `stringDecoder.write()` or until `stringDecoder.end()` is called.

In the following example, the three UTF-8 encoded bytes of the European Euro symbol (`€`) are written over three separate operations:

```js
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');

decoder.write(Buffer.from([0xE2]));
decoder.write(Buffer.from([0x82]));
console.log(decoder.end(Buffer.from([0xAC])));
```

## Class: new StringDecoder([encoding])

<!-- YAML
added: v0.1.99
-->

* `Kodierung` {string} Die Zeichenkodierung des `StringDecoder` wird verwendet. **Standard:** `'utf8'`.

Erstellt einen neuen `StringDecoder` Instanz.

### stringDecoder.end([buffer])

<!-- YAML
added: v0.9.3
-->

* `puffer` {Buffer} A `Buffer` enthält die Bytes zum Entschlüsseln.

Gibt alle übrigen im internen Puffer gespeicherten Eingaben als String zurück. Bytes representing incomplete UTF-8 and UTF-16 characters will be replaced with substitution characters appropriate for the character encoding.

If the `buffer` argument is provided, one final call to `stringDecoder.write()` is performed before returning the remaining input.

### stringDecoder.write(buffer)

<!-- YAML
added: v0.1.99
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/9618
    description: Each invalid character is now replaced by a single replacement
                 character instead of one for each individual byte.
-->

* `puffer` {Buffer} A `Buffer` enthält die Bytes zum Entschlüsseln.

Returns a decoded string, ensuring that any incomplete multibyte characters at the end of the `Buffer` are omitted from the returned string and stored in an internal buffer for the next call to `stringDecoder.write()` or `stringDecoder.end()`.