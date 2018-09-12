# String Decoder

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

El módulo `string_decoder` proporciona una API para decodificar objetos `Buffer` en strings de manera que se conserven los caracteres UTF-8 y UTF-16 codificados en varios bytes. Se puede acceder usando:

```js
const { StringDecoder } = require('string_decoder');
```

El siguiente ejemplo muestra el uso básico de la clase `StringDecoder`.

```js
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');

const cent = Buffer.from([0xC2, 0xA2]);
console.log(decoder.write(cent));

const euro = Buffer.from([0xE2, 0x82, 0xAC]);
console.log(decoder.write(euro));
```

Cuando se escribe una instancia `Buffer` en la instancia `StringDecoder`, se utiliza un buffer interno para garantizar que el string decodificado no contenga ningún carácter multibyte incompleto. These are held in the buffer until the next call to `stringDecoder.write()` or until `stringDecoder.end()` is called.

In the following example, the three UTF-8 encoded bytes of the European Euro symbol (`€`) are written over three separate operations:

```js
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');

decoder.write(Buffer.from([0xE2]));
decoder.write(Buffer.from([0x82]));
console.log(decoder.end(Buffer.from([0xAC])));
```

## Class: StringDecoder

### new StringDecoder([encoding])

<!-- YAML
added: v0.1.99
-->

* `encoding` {string} The character encoding the `StringDecoder` will use. **Predeterminado:** `'utf8'`.

Creates a new `StringDecoder` instance.

### stringDecoder.end([buffer])

<!-- YAML
added: v0.9.3
-->

* `buffer` {Buffer} A `Buffer` containing the bytes to decode.
* Returns: {string}

Returns any remaining input stored in the internal buffer as a string. Bytes representing incomplete UTF-8 and UTF-16 characters will be replaced with substitution characters appropriate for the character encoding.

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

* `buffer` {Buffer} A `Buffer` containing the bytes to decode.
* Returns: {string}

Returns a decoded string, ensuring that any incomplete multibyte characters at the end of the `Buffer` are omitted from the returned string and stored in an internal buffer for the next call to `stringDecoder.write()` or `stringDecoder.end()`.