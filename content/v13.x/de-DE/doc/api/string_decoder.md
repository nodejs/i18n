# String Dekorierer

<!--introduced_in=v0.10.0-->

> Stabilität: 2 - Stabil

Das `string_decoder` Modul bietet eine API zur Dekodierung von `Puffer` Objekten in auf eine Weise, die kodierte Multibyte UTF-8 und UTF-16 Zeichen beibehält. Es kann zugegriffen werden durch:

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

Wenn eine `Buffer` Instanz auf die `StringDecoder` Instanz geschrieben wird ein interner Puffer wird verwendet, um sicherzustellen, dass der dekodierte String keine unvollständigen Multibyte-Zeichen enthält. Diese werden in Buffer behalten bis der nächste Aufruf zu `stringDecoder.write()` oder zu `stringDecoder.end()` aufgerufen wurde.

Im folgenden Beispiel werden die drei UTF-8-kodierten Bytes des Europäischen Euro Symbols (`€`) über drei separate Operationen geschrieben:

```js
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');

decoder.write(Buffer.from([0xE2]));
decoder.write(Buffer.from([0x82]));
console.log(decoder.end(Buffer.from([0xAC])));
```

## Class: `StringDecoder`

### `new StringDecoder([encoding])`
<!-- YAML
added: v0.1.99
-->

* `Kodierung` {string} Die Zeichenkodierung des `StringDecoder` wird verwendet. **Default:** `'utf8'`.

Erstellt einen neuen `StringDecoder` Instanz.

### `stringDecoder.end([buffer])`
<!-- YAML
added: v0.9.3
-->

* `buffer` {Buffer|TypedArray|DataView} A `Buffer`, or `TypedArray`, or `DataView` containing the bytes to decode.
* Gibt zurück: {string}

Gibt alle übrigen im internen Puffer gespeicherten Eingaben als String zurück. Bytes die unvollständige UTF-8 und UTF-16 Zeichen darstellen, werden durch ersetzt werden, die für die Zeichenkodierung geeignet sind.

Wenn das `buffer`-Argument angegeben wird, wird ein letzter Aufruf an `stringDecoder.write()` vor der Rückgabe der restlichen Eingabe durchgeführt.

### `stringDecoder.write(buffer)`
<!-- YAML
added: v0.1.99
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/9618
    description: Each invalid character is now replaced by a single replacement
                 character instead of one for each individual byte.
-->

* `buffer` {Buffer|TypedArray|DataView} A `Buffer`, or `TypedArray`, or `DataView` containing the bytes to decode.
* Gibt zurück: {string}

Returns a decoded string, ensuring that any incomplete multibyte characters at the end of the `Buffer`, or `TypedArray`, or `DataView` are omitted from the returned string and stored in an internal buffer for the next call to `stringDecoder.write()` or `stringDecoder.end()`.
