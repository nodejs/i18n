# String Decoder

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

El módulo `string_decoder` proporciona una API para decodificar objetos `Buffer` en strings de manera que se conserven los caracteres UTF-8 y UTF-16 codificados en varios bytes. Se puede acceder a él utilizando:

```js
const { StringDecoder } = require('string_decoder');
```

El siguiente ejemplo muestra el uso básico de la clase `StringDecoder` .

```js
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');

const cent = Buffer.from([0xC2, 0xA2]);
console.log(decoder.write(cent));

const euro = Buffer.from([0xE2, 0x82, 0xAC]);
console.log(decoder.write(euro));
```

Cuando se escribe una instancia `Buffer` en la instancia `StringDecoder`, se utiliza un búfer interno para garantizar que el string decodificado no contenga ningún carácter incompleto de varios bytes. Estos se mantienen en el búfer hasta la próxima llamada a `stringDecoder.write()` o hasta que `stringDecoder.end()` sea llamado.

En el siguiente ejemplo, los tres bytes codificados en UTF-8 del símbolo del Euro Europeo (`€`) se escriben en tres operaciones separadas:

```js
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');

decoder.write(Buffer.from([0xE2]));
decoder.write(Buffer.from([0x82]));
console.log(decoder.end(Buffer.from([0xAC])));
```

## Clase: StringDecoder

### new StringDecoder([encoding])
<!-- YAML
added: v0.1.99
-->

* `encoding` {string} La codificación de caracteres que usará el `StringDecoder` . **Predeterminado:** `'utf8'`.

Crea una nueva instancia de `StringDecoder` .

### stringDecoder.end([buffer])
<!-- YAML
added: v0.9.3
-->

* `buffer` {Buffer|TypedArray|DataView} A `Buffer`, or `TypedArray`, or `DataView` containing the bytes to decode.
* Devuelve: {string}

Devuelve cualquier entrada restante almacenada en el búfer interno como una string. Los bytes que representan caracteres incompletos de UTF-8 y UTF-16 serán reemplazados por caracteres de sustitución apropiados para la codificación de caracteres.

Si se proporciona el argumento `buffer`, se realiza una llamada final a `stringDecoder.write()` antes de devolver la entrada restante.

### stringDecoder.write(buffer)
<!-- YAML
added: v0.1.99
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/9618
    description: Each invalid character is now replaced by a single replacement
                 character instead of one for each individual byte.
-->

* `buffer` {Buffer|TypedArray|DataView} A `Buffer`, or `TypedArray`, or `DataView` containing the bytes to decode.
* Devuelve: {string}

Returns a decoded string, ensuring that any incomplete multibyte characters at the end of the `Buffer`, or `TypedArray`, or `DataView` are omitted from the returned string and stored in an internal buffer for the next call to `stringDecoder.write()` or `stringDecoder.end()`.
