# String Decoder

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Il modulo `string_decoder` fornisce un API per la decodifica dei `Buffer` object nelle stringhe in modo da preservare i caratteri UTF-8 e UTF-16 multi-byte codificati. Ci si può accedere utilizzando:

```js
const { StringDecoder } = require('string_decoder');
```

L'esempio seguente mostra l'uso di base della `StringDecoder` class.

```js
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');

const cent = Buffer.from([0xC2, 0xA2]);
console.log(decoder.write(cent));

const euro = Buffer.from([0xE2, 0x82, 0xAC]);
console.log(decoder.write(euro));
```

Quando un'istanza `Buffer` viene scritta nell'istanza `StringDecoder`, un buffer interno viene utilizzato per garantire che la stringa decodificata non contenga caratteri multibyte incompleti. Questi vengono mantenuti nel buffer fino alla chiamata successiva a `stringDecoder.write()` o finché viene chiamato `stringDecoder.end()`.

Nell'esempio seguente, i tre byte codificati UTF-8 del simbolo dell'euro europeo (`€`) sono scritti su tre operazioni separate:

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

* `encoding`{string} La codifica del carattere che verrà usata da `StringDecoder`. **Default:** `'utf8'`.

Crea una nuova istanza `StringDecoder`.

### stringDecoder.end([buffer])
<!-- YAML
added: v0.9.3
-->

* `buffer` {Buffer} Un `Buffer` contenente i byte da decodificare.

Restituisce qualsiasi restante input memorizzato nel buffer interno come una stringa. I byte che rappresentano caratteri UTF-8 e UTF-16 incompleti verranno sostituiti con caratteri sostitutivi appropriati per la codifica dei caratteri.

Se viene fornito l'argomento `buffer`, viene eseguita una chiamata finale a `stringDecoder.write()` prima di restituire l'input rimanente.

### stringDecoder.write(buffer)
<!-- YAML
added: v0.1.99
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/9618
    description: Each invalid character is now replaced by a single replacement
                 character instead of one for each individual byte.
-->

* `buffer` {Buffer} Un `Buffer` contenente i byte da decodificare.

Restituisce una stringa decodificata, assicurando che eventuali caratteri multibyte incompleti alla fine del `Buffer` vengano omessi dalla stringa restituita e memorizzati in un buffer interno per la successiva chiamata a `stringDecoder.write()` o `stringDecoder.end()`.
