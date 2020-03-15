# Buffer

<!--introduced_in=v0.1.90-->

> Stabiliteit: 2 - stabiel

Voor de introductie van [`TypedArray`], had de JavaScript taal geen mechanisme voor het lezen of manipuleren van stromen van binaire data. De `Buffer` class werd geïntroduceerd als onderdeel van de Node.js API om interactie met octet streams in TCP streams, bestandsbewerkingen, en andere contexten mogelijk te maken.

Nu [`TypedArray`] beschikbaar is, implementeert de `Buffer` class de [`Uint8Array`] API op een manier die meer is geoptimaliseerd en geschikt voor Node.js.

Instanties van de `Buffer` class zijn te vergelijken met arrays of hele getallen, maar corresponderen met vaste, rauwe geheugentoewijzingen buiten de V8-heap. De grootte van de `Buffer` wordt vastgesteld wanneer deze wordt gecreëerd en kan niet worden gewijzigd.

De `Buffer` class zit binnen het globale bereik, wat het onwaarschijnlijk maakt dat men ooit `require('buffer').Buffer` hoeft te gebruiken.

```js
// Creëert een ongevulde Buffer met een lengte van 10.
const buf1 = Buffer.alloc(10);

// Creëert een Buffer ter lengte van 10, gevuld met 0x1.
const buf2 = Buffer.alloc(10, 1);

// Creëert een ongeinitialiseerde buffer met een lengte van10.
// Dit is sneller dan het aanroepen van Buffer.alloc() maar de geretourneerde
// Buffer instantie kan oude data bevatten wat to be
// overschreven moet worden door gebruik van fill() of write().
const buf3 = Buffer.allocUnsafe(10);

// Creëert een Buffer met [0x1, 0x2, 0x3].
const buf4 = Buffer.from([1, 2, 3]);

// Creëert een Buffer met UTF-8 bytes [0x74, 0xc3, 0xa9, 0x73, 0x74].
const buf5 = Buffer.from('tést');

// Creëert een Buffer met Latin-1 bytes [0x74, 0xe9, 0x73, 0x74].
const buf6 = Buffer.from('tést', 'latin1');
```

## `Buffer.from()`, `Buffer.alloc()`, en `Buffer.allocUnsafe()`

In versies van Node.js vóór 6.0.0, `Buffer` werden instanties gecreëerd met behulp van de `Buffer` constructor functie, die de geretourneerde `Buffer` anders toekent, gebaseerd op welke argumenten verstrekt zijn:

* Het doorgeven van een nummer als het eerste argument aan `Buffer()` (e.g. `new Buffer(10)`), kent een nieuw `Buffer` object toe van de opgegeven grootte. Prior to Node.js 8.0.0, the memory allocated for such `Buffer` instances is *not* initialized and *can contain sensitive data*. Dergelijke `Buffer` instanties *moeten* vervolgens geïnitialiseerd worden met behulp van [`buf.fill(0)`][`buf.fill()`] of door de gehele `Buffer` te schrijven. Terwijl dit gedrag *intentional* is om prestaties te verbeteren, heeft ontwikkelingservaring aangetoond dat een meer expliciet onderscheid nodig is tussen het creëren een snelle, maar ongeïnitialiseerde `Buffer` versus het maken van een langzamere, maar veiligere `Buffer`. Vanaf Node.js 8.0.0, zullen `Buffer(num)` en `new Buffer(num)` een `Buffer` met een geïnitialiseerd geheugen retourneren.
* Het doorgeven van een string, array, of `Buffer` als eerste argument, kopieert de doorgegeven data van het object naar de `Buffer`.
* Het doorgeven van een [`ArrayBuffer`] of een [`SharedArrayBuffer`] retourneert een `Buffer` wat het toegewezen geheugen deelt met de gegeven array buffer.

Omdat het gedrag van `new Buffer()` anders is, afhankelijk van het type van het eerste argument, kunnen onbedoeld beveiligings- en betrouwbaarheidskwesties in toepassingen worden geïntroduceerd wanneer argument validatie of `Buffer` initialisatie niet zijn uitgevoerd.

Om de creatie van `Buffer` instanties betrouwbaarder te maken en minder vatbaar voor fouten, werden de verschillende vormen van de `new Buffer()` constructor **afgekeurd** en vervangen door losse `Buffer.from()`, [`Buffer.alloc()`], en [`Buffer.allocUnsafe()`] methoden.

*Ontwikkelaars moeten alle bestaande toepassingen van de `new Buffer()` constructeurs migreren naar een van deze nieuwe API's.*

* [`Buffer.from(array)`] retourneert een nieuwe `Buffer` die *een kopie bevat* van de verschafte octets.
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`] retourneert een nieuwe `Buffer` die *hetzelfde toegekende geheugen deelt* als de gegeven [`ArrayBuffer`].
* [`Buffer.from(buffer)`] retourneert een nieuwe `Buffer` die *een kopie bevat* van de inhoud van de gegeven `Buffer`.
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`] retourneert een nieuwe `Buffer`die *een kopie bevat* van de verschafte string.
* [`Buffer.alloc(size[, fill[, encoding]])`][`Buffer.alloc()`] retourneert een nieuwe geïnitialiseerde `Buffer` van de gespecificeerde grootte. Deze methode is langzamer dan [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] maar garandeert dat nieuw gecreëerde `Buffer` instanties nooit oude, potentieel gevoelige, data bevatten.
* [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] en [`Buffer.allocUnsafeSlow(size)`][`Buffer.allocUnsafeSlow()`] retourneren allen een nieuwe ongeïnitialiseerde `Buffer` van de gespecificeerde `size`. Omdat de `Buffer` ongeïnitialiseerd is, kan het toegewezen geheugen oude data bevatten die potentieel gevoelig zijn.

`Buffer` instanties geretourneerd door [`Buffer.allocUnsafe()`] *kunnen* toegewezen worden vanaf een gedeelde interne geheugen pool als `size` kleiner is of gelijk aan de helft van [`Buffer.poolSize`]. Instanties geretourneerd door [`Buffer.allocUnsafeSlow()`] gebruiken *nooit* een interne geheugen pool.

### De `--zero-fill-buffers` command line optie
<!-- YAML
added: v5.10.0
-->

Node.js kan worden gestart door gebruik van de `--zero-fill-buffers` command line optie om alle nieuw toegewezen `Buffer` instanties standaard zero-filled te laten zijn bij creatie, inclusief de buffers geretourneerd door `new Buffer(size)`, [`Buffer.allocUnsafe()`], [`Buffer.allocUnsafeSlow()`], en `new
SlowBuffer(size)`. Het gebruik van deze vlag kan een aanzienlijke negatieve impact hebben op de werking. Het gebruik van de `--zero-fill-buffers` optie wordt alleen aangeraden wanneer het noodzakelijk wordt geacht dat nieuwe toegewezen `Buffer` instanties geen oude, potentieel gevoelige, data mogen bevatten.

```txt
$ node --zero-fill-buffers
> Buffer.allocUnsafe(5);
<Buffer 00 00 00 00 00>
```

### Wat maakt `Buffer.allocUnsafe()` en `Buffer.allocUnsafeSlow()` "onveilig"?

Bij het aanroepen van [`Buffer.allocUnsafe()`] en [`Buffer.allocUnsafeSlow()`], wordt het segment van het toegewezen geheugen *ongeïnitialiseerd* (het wordt niet verwijderd). Terwijl dit onwerp de toewijzing van geheugen aardig snel maakt, kan het toegewezen deel van het geheurgen oude, potentieel gevoelige, data bevatten. Het gebruik van een `Buffer` die gecreëerd werd door [`Buffer.allocUnsafe()`] zonder *volledig* het geheugen te overschrijven, kan ervoor zorgen dan oude data lekt als het `Buffer` geheugen wordt gelezen.

Terwijl er heldere prestatievoordelen zijn bij het gebruik van [`Buffer.allocUnsafe()`], *moet* extra zorg worden besteedt aan het voorkomen van invoering van beveiligingsproblemen in de toepassing.

## Buffers en tekencoderingen
<!-- YAML
changes:
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7111
    description: Introduced `latin1` as an alias for `binary`.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2859
    description: Removed the deprecated `raw` and `raws` encodings.
-->

Wanneer string data worden opgeslagen in, of uit een `Buffer` instantie wordt gehaald, kan een tekencode worden gespecificeerd.

```js
const buf = Buffer.from('hello world', 'ascii');

console.log(buf.toString('hex'));
// Prints: 68656c6c6f20776f726c64
console.log(buf.toString('base64'));
// Prints: aGVsbG8gd29ybGQ=

console.log(Buffer.from('fhqwhgads', 'ascii'));
// Prints: <Buffer 66 68 71 77 68 67 61 64 73>
console.log(Buffer.from('fhqwhgads', 'utf16le'));
// Prints: <Buffer 66 00 68 00 71 00 77 00 68 00 67 00 61 00 64 00 73 00>
```

De tekencodes die op dit moment worden ondersteund door Node.js zijn:

* `'ascii'` - Alleen voor 7-bit ASCII gegevens. Deze codering is snel en zal de hoge bit strippen als dit is ingesteld.

* `'utf8'` - Multibyte encoded Unicode tekens. Vele webpagina's en andere document formats gebruiken UTF-8.

* `'utf16le'` - 2 of 4 bytes, little-endian gecodeerde Unicode tekens. Surrogaat paren (U+10000 tot U+10FFFF) worden ondersteund.

* `'ucs2'` - Alias van `'utf16le'`.

* `'base64'` - Base64 codering. Bij het creëren van een `Buffer` vanuit een string, zal deze codering ook correct "URL en Filename Safe Alphabet" accepteren, zoals is gespecificeerd in [RFC4648, Section 5](https://tools.ietf.org/html/rfc4648#section-5).

* `'latin1'` Een manier om `Buffer` te coderen in een one-byte gecodeerde string (zoals omschreven door de IANA in [RFC1345](https://tools.ietf.org/html/rfc1345), pagina 63, om het Latin-1 supplement blok en C0/C1 control codes te zijn).

* `'binary'` - Alias voor `'latin1'`.

* `'hex'` Codeer elke byte als twee hexadecimale tekens.

Moderne webbrouwsers volgen de [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/) wiens aliassen beiden `'latin1'` en `'ISO-8859-1'` tot `'win-1252'` zijn. Dit betekent dat, terwijl men iets doet als bijvoorbeeld `http.get()`, als de geretourneerde charset één van degenen is die vermeld staan in de WHATWG specificaties, dan is het echter mogelijk dat de server `'win-1252'` gecodeerde data heeft geretourneerd, en het gebruik van `'latin1'` codering kan deze tekens fout decoderen.

## Buffers en TypedArray
<!-- YAML
changes:
  - version: v3.0.0
    pr-url: https://github.com/nodejs/node/pull/2002
    description: The `Buffer`s class now inherits from `Uint8Array`.
-->

`Buffer` instanties zijn ook [`Uint8Array`] instanties. Er zijn echter subtiele tegenstrijdigheden met [`TypedArray`]. Bijvoorbeeld, terwijl [`ArrayBuffer#slice()`] een kopie van de slice creëert, zal de uitvoering van [`Buffer#slice()`][`buf.slice()`] een beeld creëeren over de bestaande `Buffer` zonder het te kopiëren, wat de [`Buffer#slice()`][`buf.slice()`] veel efficiënter maakt.

Het is ook mogelijk nieuwe [`TypedArray`] instanties te creëren vanuit een `Buffer` met de volgende uitzonderingen:

1. Het geheugen van het `Buffer` object wordt gekopieerd naar de [`TypedArray`], niet gedeeld.

2. Het geheugen van het `Buffer` object wordt geïnterpreteerd als een array verschillende elementen, en niet als een byte array van het doeltype. Dat wil zeggen, `new Uint32Array(Buffer.from([1, 2, 3, 4]))` creëert een 4-element [`Uint32Array`] met de elementen `[1, 2, 3, 4]`, niet een [`Uint32Array`] met een enkel element `[0x1020304]` of `[0x4030201]`.

It is possible to create a new `Buffer` that shares the same allocated memory as a [`TypedArray`] instance by using the `TypedArray` object's `.buffer` property.

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Kopieert de inhoud van`arr`
const buf1 = Buffer.from(arr);
// Deelt geheugen met `arr`
const buf2 = Buffer.from(arr.buffer);

console.log(buf1);
// Print: <Buffer 88 a0>
console.log(buf2);
// Print: <Buffer 88 13 a0 0f>

arr[1] = 6000;

console.log(buf1);
// Print: <Buffer 88 a0>
console.log(buf2);
// Print: <Buffer 88 13 70 17>
```

Observeer hier dat bij het creëren van een `Buffer` met behulp van een [`TypedArray`]'s `.buffer`, het mogelijk is om maar een deel van de onderliggende [`ArrayBuffer`] te gebruiken, door het door te geven in `byteOffset` en `length` parameters.

```js
const arr = new Uint16Array(20);
const buf = Buffer.from(arr.buffer, 0, 16);

console.log(buf.length);
// Print: 16
```

De `Buffer.from()` en [`TypedArray.from()`] hebben verschillende handtekeningen en uitvoeringen. De [`TypedArray`] varianten accepteren in het bijzonder een tweede argument wat een karteringsfunctie is die wordt opgeroepen op elk element van de getypte array:

* `TypedArray.from(source[, mapFn[, thisArg]])`

De `Buffer.from()` methode zal echter het gebruik van de karteringsfunctie niet ondersteunen:

* [`Buffer.from(array)`]
* [`Buffer.from(buffer)`]
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`]
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`]

## Buffers en herhaling

`Buffer` instanties kunnen worden herhaald over het gebruik van de `for..of` syntax:

```js
const buf = Buffer.from([1, 2, 3]);

// Print:
//   1
//   2
//   3
voor (const b of buf) {
  console.log(b);
}
```

Aanvullend, kunnen de [`buf.values()`], [`buf.keys()`], en [`buf.entries()`] methoden worden gebruikt om herhalingen te creëren.

## Class: Buffer

De `Buffer` class is een globaal type voor het direct omgaan met binary data. Het kan worden opgebouwd op een aantal manieren.

### new Buffer(array)
<!-- YAML
deprecated: v6.0.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19524
    description: Calling this constructor emits a deprecation warning when
                 run from code outside the `node_modules` directory.
  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
-->

> Stabiliteit: 0 - Afgekeurd: Gebruik als alternatief [`Buffer.from(array)`].

* `array` {integer[]} Een array bytes om van te kopiëren.

Kent een nieuwe `Buffer` toe met behulp van een `array` octets.

```js
// Creëert een nieuwe Buffer die de UTF-8 bytes van de string 'buffer'
const buf = new Buffer([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]) bevat;
```

### new Buffer(arrayBuffer[, byteOffset[, length]])
<!-- YAML
added: v3.0.0
deprecated: v6.0.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19524
    description: Calling this constructor emits a deprecation warning when
                 run from code outside the `node_modules` directory.
  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4682
    description: The `byteOffset` and `length` parameters are supported now.
-->

> Stabiliteit: 0 - Afgekeurd: Gebruik [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`] als alternatief.

* `arrayBuffer` {ArrayBuffer|SharedArrayBuffer} Een [`ArrayBuffer`], [`SharedArrayBuffer`] of de `.buffer` eigenschap van een [`TypedArray`].
* `byteOffset` {integer} Index van de eerste te onthullen byte. **Default:** `0`.
* `length` {integer} Aantal te onthullen bytes. **Standaard:** `arrayBuffer.length - byteOffset`.

Dit creëert een beeld van de [`ArrayBuffer`] of [`SharedArrayBuffer`] zonder het onderliggende geheugen te kopiëren. Bijvoorbeeld, wanneer er een referentie is doorgegeven aan de `.buffer` eigenschap van een [`TypedArray`] instantie, dan zal de nieuw gecreëerde `Buffer` hetzelfde toegewezen geheugen delen met de [`TypedArray`].

De optionele `byteOffset` en `length` argumenten specificeren een geheugenbereik vanuit de `arrayBuffer` die zal worden gedeeld met de `Buffer`.

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Deelt geheugen met `arr`
const buf = new Buffer(arr.buffer);

console.log(buf);
// Print: <Buffer 88 13 a0 0f>

// Het veranderen van de originele Uint16Array verandert ook de Buffer 
arr[1] = 6000;

console.log(buf);
// Print: <Buffer 88 13 70 17>
```

### new Buffer(buffer)
<!-- YAML
deprecated: v6.0.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19524
    description: Calling this constructor emits a deprecation warning when
                 run from code outside the `node_modules` directory.
  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
-->

> Stabiliteit: 0 - Afgekeurd: Gebruik [`Buffer.from(buffer)`] als alternatief.

* `buffer` {Buffer|Uint8Array} Een bestaande `Buffer` of [`Uint8Array`] waarvan data worden gekopieerd.

Kopieert de passende `buffer` data naar een nieuwe `Buffer` instantie.

```js
const buf1 = new Buffer('buffer');
const buf2 = new Buffer(buf1);

buf1[0] = 0x61;

console.log(buf1.toString());
// Print: auffer
console.log(buf2.toString());
// Print: buffer
```

### new Buffer(size)
<!-- YAML
deprecated: v6.0.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19524
    description: Calling this constructor emits a deprecation warning when
                 run from code outside the `node_modules` directory.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12141
    description: The `new Buffer(size)` will return zero-filled memory by
                 default.
  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
-->

> Stabiliteit: 0 - Afgekeurd: Gebruik [`Buffer.alloc()`] als alternatief (zie ook [`Buffer.allocUnsafe()`]).

* `size` {integer} De gewenste lengte van de nieuwe `Buffer`.

Kent een nieuwe `Buffer` van `size` bytes toe. Als `size` groter is dan [`buffer.constants.MAX_LENGTH`] of kleiner dan 0, wordt [`ERR_INVALID_OPT_VALUE`] geworpen. Een nul-lengte `Buffer` wordt gecreëerd als de `size` 0 is.

Voorafgaand aan Node.js 8.0.0., is het onderliggende geheugen voor `Buffer` instanties die op deze manier zijn gecreëerd *niet geïnitialiseerd*. De inhoud van een nieuw gecreëerde `Buffer` is onbekend en *kan gevoelige infomatie bevatten*. Gebruik als alternatief [`Buffer.alloc(size)`][`Buffer.alloc()`] om een `Buffer` met nullen te intitialiseren.

```js
const buf = new Buffer(10);

console.log(buf);
// Print: <Buffer 00 00 00 00 00 00 00 00 00 00>
```

### new Buffer(string[, encoding])
<!-- YAML
deprecated: v6.0.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19524
    description: Calling this constructor emits a deprecation warning when
                 run from code outside the `node_modules` directory.
  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
-->

> Stabiliteit: 0 - Afgekeurd: Gebruik als alternatief [`Buffer.from(string[, encoding])`][`Buffer.from(string)`].

* `string` {string} String om te coderen.
* `encoding` {string} De codering van `string`. **Standaard:** `'utf8'`.

Creëert een nieuwe `Buffer` die een `string` bevat. De `encoding` parameter identificeert de tekencodering van `string`.

```js
const buf1 = new Buffer('dit is een tést');
const buf2 = new Buffer('7468697320697320612074c3a97374', 'hex');

console.log(buf1.toString());
// Print: dit is een tést
console.log(buf2.toString());
// Print: dit is een tést
console.log(buf1.toString('ascii'));
// Print: dit is een tC)st
```

### Class Methode: Buffer.alloc(size[, fill[, encoding]])
<!-- YAML
added: v5.10.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18129
    description: Attempting to fill a non-zero length buffer with a zero length
                 buffer triggers a thrown exception.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17427
    description: Specifying an invalid string for `fill` triggers a thrown
                 exception.
  - version: v8.9.3
    pr-url: https://github.com/nodejs/node/pull/17428
    description: Specifying an invalid string for `fill` now results in a
                 zero-filled buffer.
-->

* `size` {integer} De gewenste lengte van de nieuwe `Buffer`.
* `fill` {string|Buffer|integer} Een waarde om de nieuwe `Buffer` vooraf mee in te vullen. **Default:** `0`.
* `encoding` {string} Als `fill` een string is, is dit de bijbehorende codering. **Standaard:** `'utf8'`.

Kent een nieuwe `Buffer` van `size` bytes toe. Als `fill` `undefined` is, zal de `Buffer` *ongevuld* zijn.

```js
const buf = Buffer.alloc(5);

console.log(buf);
// Print: <Buffer 00 00 00 00 00>
```

Kent een nieuwe `Buffer` van `size` bytes toe. Als `size` groter is dan [`buffer.constants.MAX_LENGTH`] of kleiner dan 0, wordt [`ERR_INVALID_OPT_VALUE`] geworpen. Een nul-lengte `Buffer` wordt gecreëerd als de `size` 0 is.

Als `fill` is gespecificeerd, zal de toegewezen `Buffer` initialiseren door het aanroepen van [`buf.fill(fill)`][`buf.fill()`].

```js
const buf = Buffer.alloc(5, 'a');

console.log(buf);
// Print: <Buffer 61 61 61 61 61>
```

Als zowel `fill` en `encoding` gespecificeerd zijn, zal de toegewezen `Buffer` initialiseren door het aanroepen van [`buf.fill(fill, encoding)`][`buf.fill()`].

```js
const buf = Buffer.alloc(11, 'aGVsbG8gd29ybGQ=', 'base64');

console.log(buf);
// Print: <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64>
```

Het aanroepen van [`Buffer.alloc()`] kan aanzienlijk trager zijn dan de alternatieve [`Buffer.allocUnsafe()`], maar zal er voor zorgen dat de nieuw gecreëerde `Buffer` instantie inhoud *nooit gevoelige informatie zal bevatten*.

Een `TypeError` zal worden geworpen als `size` geen nummer is.

### Class Method: Buffer.allocUnsafe(size)
<!-- YAML
added: v5.10.0
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7079
    description: Passing a negative `size` will now throw an error.
-->

* `size` {integer} De gewenste lengte van de nieuwe `Buffer`.

Kent een nieuwe `Buffer` van `size` bytes toe. Als `size` groter is dan [`buffer.constants.MAX_LENGTH`] of kleiner dan 0, wordt [`ERR_INVALID_OPT_VALUE`] geworpen. Een nul-lengte `Buffer` wordt gecreëerd als de `size` 0 is.

Het onderliggende geheugen voor `Buffer` instanties die op deze manier zijn gecreëerd is *niet geïnitialiseerd*. De inhoud van de nieuw gecreëerde `Buffer` is onbekend en *kan gevoelige informatie bevatten*. Gebruik `Buffer.alloc()`] als alternatief om `Buffer` instanties met nullen te initialiseren.

```js
const buf = Buffer.allocUnsafe(10);

console.log(buf);
// Print: (inhoud kan verschillen): <Buffer a0 8b 28 3f 01 00 00 00 50 32>

buf.fill(0);

console.log(buf);
// Print: <Buffer 00 00 00 00 00 00 00 00 00 00>
```

Een `TypeError` zal worden geworpen als `size` geen nummer is.

Merk op dat de `Buffer` module vóóraf een interne `Buffer` instantie ter grootte van [`Buffer.poolSize`] toekent die wordt gebruikt als een pool voor de snelle toekenning van nieuwe `Buffer` instanties, gecreëerd met behulp van [`Buffer.allocUnsafe()`] en de afgekeurde `new Buffer(size)` constructor alléén wanneer `size` kleiner is dan of gelijk aan `Buffer.poolSize >> 1` (bodem van [`Buffer.poolSize`] gedeeld door twee).

Het gebruik van deze vooraf toegekende interne geheugen pool is een belangrijk verschil tussen het aanroepen van `Buffer.alloc(size, fill)` vs. `Buffer.allocUnsafe(size).fill(fill)`. Specifically, `Buffer.alloc(size, fill)` will *never* use the internal `Buffer` pool, while `Buffer.allocUnsafe(size).fill(fill)` *will* use the internal `Buffer` pool if `size` is less than or equal to half [`Buffer.poolSize`]. Het verschil is subtiel, maar kan belangrijk zijn wanneer een toepassing de aanvullende prestatie nodig heeft die de [`Buffer.allocUnsafe()`] verschaft.

### Class Methode: Buffer.allocUnsafeSlow(size)
<!-- YAML
added: v5.12.0
-->

* `size` {integer} De gewenste lengte van de nieuwe `Buffer`.

Kent een nieuwe `Buffer` van `size` bytes toe. Als `size` groter is dan [`buffer.constants.MAX_LENGTH`] of kleiner dan 0, wordt [`ERR_INVALID_OPT_VALUE`] geworpen. Een nul-lengte `Buffer` wordt gecreëerd als de `size` 0 is.

Het onderliggende geheugen voor `Buffer` instanties die op deze manier zijn gecreëerd is *niet geïnitialiseerd*. De inhoud van de nieuw gecreëerde `Buffer` is onbekend en *kan gevoelige informatie bevatten*. Gebruik [`buf.fill(0)`][`buf.fill()`] voor het initialiseren van dergelijke `Buffer` instanties met nullen.

Bij het gebruik van [`Buffer.allocUnsafe()`] voor het toewijzen van nieuwe `Buffer` instanties, worden toekenningen onder 4KB van één enkele vooraf toegekende `Buffer` gesneden. Hierdoor kunnen toepassingen de afval collectie overhead van het creëren van veel afzonderlijke toegewezen `Buffer` instanties voorkomen. Deze aanpak verbeterd zowel de prestatie als het geheugenverbruik door het elimineren van de behoefte om zoveel blijvende objecten op te sporen en op te ruimen.

Wanneer een ontwikkelaar echter voor onbepaalde tijd een klein deel van het geheugen van een pool moet behouden, kan het gepast zijn een un-pooled `Buffer` instantie te creëren, met behulp van `Buffer.allocUnsafeSlow()` en dan de relevante delen te kopiëren.

```js
// Need to keep around a few small chunks of memory
const store = [];

socket.on('readable', () => {
  let data;
  while (null !== (data = readable.read())) {
    // Allocate for retained data
    const sb = Buffer.allocUnsafeSlow(10);

    // Copy the data into the new allocation
    data.copy(sb, 0, 0, 10);

    store.push(sb);
  }
});
```

`Buffer.allocUnsafeSlow()` zou alleen als laatste poging moeten worden gebruikt als een ontwikkelaar overmatig geheugenbehoud heeft opgemerkt in hun toepassingen.

Een `TypeError` zal worden geworpen als `size` geen nummer is.

### Class Method: Buffer.byteLength(string[, encoding])
<!-- YAML
added: v0.1.90
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8946
    description: Passing invalid input will now throw an error.
  - version: v5.10.0
    pr-url: https://github.com/nodejs/node/pull/5255
    description: The `string` parameter can now be any `TypedArray`, `DataView`
                 or `ArrayBuffer`.
-->

* `string` {string|Buffer|TypedArray|DataView|ArrayBuffer|SharedArrayBuffer} een waarde om de lengte van te berekenen.
* `encoding` {string} Als `string` een string is, is dit de bijbehorende codering. **Standaard:** `'utf8'`.
* Retourneert: {integer} Het aantal bytes in `string`.

Retourneert de werkelijke byte lengte van een string. Dit is niet hetzelfde als [`String.prototype.length`] aangezien dat het aantal *tekens* in een string retourneert.

Voor `'base64'` en `'hex'`, gaat deze functie uit van een geldige invoer. Voor strings die geen non-Base64/Hex-encoded data (bijvoorbeeld whitespace) bevatten, kan de geretourneerde waarde groter zijn dan de lengte van een `Buffer` die is gecreëerd op basis van de string.

```js
const str = '\u00bd + \u00bc = \u00be';

console.log(`${str}: ${str.length} characters, ` +
            `${Buffer.byteLength(str, 'utf8')} bytes`);
// Print: ½ + ¼ = ¾: 9 tekens, 12 bytes
```

Wanneer de `string` een `Buffer`/[`DataView`]/[`TypedArray`]/[`ArrayBuffer`]/ [`SharedArrayBuffer`] is, wordt de werkelijke bytelengte geretourneerd.

### Class Methode: Buffer.compare(buf1, buf2)
<!-- YAML
added: v0.11.13
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The arguments can now be `Uint8Array`s.
-->

* `buf1` {Buffer|Uint8Array}
* `buf2` {Buffer|Uint8Array}
* Retourneert: {integer}

Vergelijkt `buf1` met `buf2` over het algemeen met het oog op het sorteren van arrays van `Buffer` instanties. Dit is gelijk aan het aanroepen van [`buf1.compare(buf2)`][`buf.compare()`].

```js
const buf1 = Buffer.from('1234');
const buf2 = Buffer.from('0123');
const arr = [buf1, buf2];

console.log(arr.sort(Buffer.compare));
// Print: [ <Buffer 30 31 32 33>, <Buffer 31 32 33 34> ]
// (Dit resultaat is gelijk aan: [buf2, buf1])
```

### Class Methode: Buffer.concat(list[, totalLength])
<!-- YAML
added: v0.7.11
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The elements of `list` can now be `Uint8Array`s.
-->

* `list` {Buffer[] | Uint8Array[]} Lijst met `Buffer` of [`Uint8Array`] instanties om samen te voegen.
* `totalLength` {integer} Totale lengte van de `Buffer` instanties in de `list` wanneer ze zijn samengevoegd.
* Retourneert: {Buffer}

Retourneert een nieuwe `Buffer` die het resultaat is van het samenvoegen van alle `Buffer` instanties samen in de `list`.

Als de lijst geen items heeft, of als de `totalLength` 0 is, wordt een `Buffer` met een nul-lengte geretourneerd.

Als `totalLength` niet is opgegeven, wordt het berekend uit de `Buffer` instanties in de `list`. Hierdoor wordt echter een extra lus uitgevoerd om de `totalLength` te berekenen, dus is het sneller om de lengte expliciet op te geven als dat al bekend is.

Als de `totalLength` is opgegeven, wordt het tot een geheel getal zonder handtekening gedwongen. Als de gecombineerde lengte van de `Buffer`s in de `list` de `totalLength` overschrijdt, wordt het resultaat ingekort tot de `totalLength`.

```js
// Creëert een enkele `Buffer` van een lijst van drie `Buffer`instanties.

const buf1 = Buffer.alloc(10);
const buf2 = Buffer.alloc(14);
const buf3 = Buffer.alloc(18);
const totalLength = buf1.length + buf2.length + buf3.length;

console.log(totalLength);
// Print: 42

const bufA = Buffer.concat([buf1, buf2, buf3], totalLength);

console.log(bufA);
// Print: <Buffer 00 00 00 00 ...>
console.log(bufA.length);
// Print: 42
```

### Class Methode: Buffer.from(array)
<!-- YAML
added: v5.10.0
-->

* `array` {integer[]}

Kent een nieuwe `Buffer` toe met behulp van een `array` octets.

```js
// Creëert een nieuwe Buffer die de UTF-8 bytes van de string 'buffer'
const buf = Buffer.from ([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]) bevat;
```

Een `TypeError` zal worden geworpen als `array` geen `Array` is.

### Class Methode: Buffer.from(arrayBuffer[, byteOffset[, length]])
<!-- YAML
added: v5.10.0
-->

* `arrayBuffer` {ArrayBuffer|SharedArrayBuffer} Een [`ArrayBuffer`], [`SharedArrayBuffer`], of de `.buffer` eigenschap van een [`TypedArray`].
* `byteOffset` {integer} Index van de eerste te onthullen byte. **Default:** `0`.
* `length` {integer} Aantal te onthullen bytes. **Standaard:** `arrayBuffer.length - byteOffset`.

Dit creëert een beeld van de [`ArrayBuffer`] zonder het onderliggende geheugen te kopiëren. Bijvoorbeeld, wanneer er een referentie is doorgegeven aan de `.buffer` eigenschap van een [`TypedArray`] instantie, dan zal de nieuw gecreëerde `Buffer` hetzelfde toegewezen geheugen delen met de [`TypedArray`].

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Deelt geheugen met `arr`
const buf = Buffer.from(arr.buffer);

console.log(buf);
// Print: <Buffer 88 13 a0 0f>

// Het veranderen van de originele Uint16Array verandert ook de Buffer 
arr[1] = 6000;

console.log(buf);
// Print: <Buffer 88 13 70 17>
```

De optionele `byteOffset` en `length` argumenten specificeren een geheugenbereik vanuit de `arrayBuffer` die zal worden gedeeld met de `Buffer`.

```js
const ab = new ArrayBuffer(10);
const buf = Buffer.from(ab, 0, 2);

console.log(buf.length);
// Print: 2
```

Een `TypeError` zal worden geworpen als de `arrayBuffer` geen [`ArrayBuffer`] of [`SharedArrayBuffer`] is.

### Class Methode: Buffer.from(buffer)
<!-- YAML
added: v5.10.0
-->

* `buffer` {Buffer|Uint8Array} Een bestaande `Buffer` of [`Uint8Array`] waarvan data worden gekopieerd.

Kopieert de passende `buffer` data naar een nieuwe `Buffer` instantie.

```js
const buf1 = Buffer.from('buffer');
const buf2 = Buffer.from(buf1);

buf1[0] = 0x61;

console.log(buf1.toString());
// Print: auffer
console.log(buf2.toString());
// Print: buffer
```

Een `TypeError` zal worden geworpen als `buffer` geen `Buffer` is.

### Class Methode: Buffer.from(object[, offsetOrEncoding[, length]])
<!-- YAML
added: v8.2.0
-->

* `object` {Object} Een object dat `Symbol.toPrimitive` of `valueOf()` ondersteunt
* `offsetOrEncoding` {number|string} Een byte-offset of codering, afhankelijk van de waarde geretourneerd door `object.valueOf()` of `object[Symbol.toPrimitive]()`.
* `length` {number} Een lengte, afhankelijk van de waarde geretourneerd door `object.valueOf()` of `object[Symbol.toPrimitive]()`.

Voor objecten waarvan de `valueOf()` functie een waarde retourneert die niet strikt gelijk is aan het `object`, retourneert `Buffer.from(object.valueOf(), offsetOrEncoding, length)`.

```js
const buf = Buffer.from(new String('dit is een test'));
// Print: <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

Voor objecten die `Symbol.toPrimitive` ondersteunen, retourneert `Buffer.from(object[Symbol.toPrimitive](), offsetOrEncoding, length)`.

```js
class Foo {
  [Symbol.toPrimitive]() {
    retourneert 'dit is een test';
  }
}

const buf = Buffer.from(new Foo(), 'utf8');
// Print: <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

### Class Methode: Buffer.from(string[, encoding])
<!-- YAML
added: v5.10.0
-->

* `string` {string} Een string om te coderen.
* `encoding` {string} De codering van `string`. **Standaard:** `'utf8'`.

Creëert een nieuwe `Buffer` die een `string` bevat. De `encoding` parameter identificeert de tekencodering van `string`.

```js
const buf1 = new Buffer('dit is een tést');
const buf2 = new Buffer('7468697320697320612074c3a97374', 'hex');

console.log(buf1.toString());
// Print: dit is een tést
console.log(buf2.toString());
// Print: dit is een tést
console.log(buf1.toString('ascii'));
// Print: dit is een tC)st
```

Een `TypeError` zal worden geworpen als `string` geen string is.

### Class Methode: Buffer.isBuffer(obj)
<!-- YAML
added: v0.1.101
-->

* `obj` {Object}
* Retourneert: {boolean}

Retourneert `true` als `obj` een `Buffer` is, en anders `false`.

### Class Methode: Buffer.isEncoding(encoding)
<!-- YAML
added: v0.9.1
-->

* `encoding` {string} Een na te kijken coderingsnaam van een teken.
* Retourneert: {boolean}

Retourneert `true` als de `encoding` een ondersteunde tekencodering bevat, of anders `false`.

### Class Eigenschap: Buffer.poolSize
<!-- YAML
added: v0.11.3
-->

* {integer} **Default:** `8192`

Dit is de grootte (in bytes) van vooraf toegekende interne `Buffer` instanties gebruikt voor pooling. Deze waarde mag worden aangepast.

### buf[index]
<!-- YAML
type: property
name: [index]
-->

De index operator `[index]` kan worden gebruikt om een octet in de positie `index` in `buf` te krijgen en in te stellen. De waarden verwijzen naar individuele bytes, dus het legale waardebereik zit tussen `0x00` en `0xFF` (hex) of `0` en `255` (decimaal).

Deze operator wordt overgenomen van `Uint8Array`, dus zijn gedrag op toegang buiten de grenzen is hetzelfde als `UInt8Array` - oftewel, het geretourneerd krijgen van `undefined` en instelling doet niets.

```js
// Kopieer een ASCII string in een `Buffer` een byte tegelijk.

const str = 'Node.js';
const buf = Buffer.allocUnsafe(str.length);

for (let i = 0; i < str.length; i++) {
  buf[i] = str.charCodeAt(i);
}

console.log(buf.toString('ascii'));
// Print: Node.js
```

### buf.buffer

* {ArrayBuffer} Het onderliggende `ArrayBuffer` object op basis waarvan dit `Buffer` object is gecreëerd.

```js
const arrayBuffer = new ArrayBuffer(16);
const buffer = Buffer.from(arrayBuffer);

console.log(buffer.buffer === arrayBuffer);
// Print: true
```

### buf.byteOffset

* {integer} The `byteOffset` on the underlying `ArrayBuffer` object based on which this `Buffer` object is created.

When setting `byteOffset` in `Buffer.from(ArrayBuffer, byteOffset, length)` or sometimes when allocating a buffer smaller than `Buffer.poolSize` the buffer doesn't start from a zero offset on the underlying `ArrayBuffer`.

This can cause problems when accessing the underlying `ArrayBuffer` directly using `buf.buffer`, as the first bytes in this `ArrayBuffer` may be unrelated to the `buf` object itself.

A common issue is when casting a `Buffer` object to a `TypedArray` object, in this case one needs to specify the `byteOffset` correctly:

```js
// Create a buffer smaller than `Buffer.poolSize`.
const nodeBuffer = new Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

// When casting the Node.js Buffer to an Int8 TypedArray remember to use the
// byteOffset.
new Int8Array(nodeBuffer.buffer, nodeBuffer.byteOffset, nodeBuffer.length);
```

### buf.compare(target[, targetStart[, targetEnd[, sourceStart[, sourceEnd]]]])
<!-- YAML
added: v0.11.13
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `target` parameter can now be a `Uint8Array`.
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5880
    description: Additional parameters for specifying offsets are supported now.
-->

* `target` {Buffer|Uint8Array} Een `Buffer` of [`Uint8Array`] waar `buf` mee vergeleken moet worden.
* `targetStart` {integer} De offset binnen `target` waar vergelijking moet beginnen. **Default:** `0`.
* `targetEnd` {integer} De offset met `target`, waar de vergelijking moet eindigen (niet inclusief). **Standaard:** `target.length`.
* `sourceStart` {integer} De offset binnen `buf` waar vergelijking moet beginnen. **Default:** `0`.
* `sourceEnd` {integer} De offset binnen `buf` waar vergelijking moet eindigen (niet inclusief). **Standaard:** [`buf.length`].
* Retourneert: {integer}

Vergelijkt `buf` met `target` en retourneert een nummer dat aangeeft of `buf` vóór of na komt, of hetzelfde is als `target` in de sorteer orde. Vergelijking is gebaseerd op de werkelijke volgorde van bytes in elke `Buffer`.

* `0` wordt geretourneerd als het `target` hetzelfde is als `buf`
* `1` wordt geretourneerd als `target` *voor* `buf` moet komen wanneer het gesorteerd is.
* `-1` wordt geretourneerd als `target` *na* `buf` moet komen wanneer het gesorteerd is.

```js
const buf1 = Buffer.from('ABC');
const buf2 = Buffer.from('BCD');
const buf3 = Buffer.from('ABCD');

console.log(buf1.compare(buf1));
// Print: 0
console.log(buf1.compare(buf2));
// Print: -1
console.log(buf1.compare(buf3));
// Print: -1
console.log(buf2.compare(buf1));
// Print: 1
console.log(buf2.compare(buf3));
// Print: 1
console.log([buf1, buf2, buf3].sort(Buffer.compare));
// Print: [ <Buffer 41 42 43>, <Buffer 41 42 43 44>, <Buffer 42 43 44> ]
// (Dit resultaat is gelijk aan: [buf1, buf3, buf2])
```

De optimale `targetStart`, `targetEnd`, `sourceStart`, en `sourceEnd` argumenten kunnen worden gebruikt voor het beperken van de vergelijking met specifieke bereiken binnen respectievelijk `target` en `buf`.

```js
const buf1 = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);
const buf2 = Buffer.from([5, 6, 7, 8, 9, 1, 2, 3, 4]);

console.log(buf1.compare(buf2, 5, 9, 0, 4));
// Print: 0
console.log(buf1.compare(buf2, 0, 6, 4));
// Print: -1
console.log(buf1.compare(buf2, 5, 6, 5));
// Print: 1
```

[`ERR_INDEX_OUT_OF_RANGE`] wordt geworpen als `targetStart < 0`, `sourceStart < 0`, `targetEnd > target.byteLength`, of `sourceEnd > source.byteLength`.

### buf.copy(target[, targetStart[, sourceStart[, sourceEnd]]])
<!-- YAML
added: v0.1.90
-->

* `target` {Buffer|Uint8Array} Een `Buffer` of [`Uint8Array`] om naartoe te kopiëren.
* `targetStart` {integer} De offset binnen `target` waar het schrijven moet beginnen. **Default:** `0`.
* `sourceStart` {integer} De offset binnen `buf` waar het kopiëren moet beginnen. **Default:** `0`.
* `sourceEnd` {integer} De offset binnen `buf` waar het kopiëren moet eindigen (niet inclusief). **Standaard:** [`buf.length`].
* Retourneert: {integer} Het aantal gekopieerde bytes.

Kopieert gegevens van een regio van `buf` naar een regio in `target`, zelfs als de `target` geheugen regio met `buf` overlapt.

```js
// Twee `Buffer` instanties creëren.
const buf1 = Buffer.allocUnsafe(26);
const buf2 = Buffer.allocUnsafe(26).fill('!');

voor (let i = 0; i < 26; i++) {
  // 97 is de decimaal ASCII waarde voor 'a'
  buf1[i] = i + 97;
}

// Kopieer `buf1` bytes 16 tot 19 naar `buf2` beginnende bij byte 8 van `buf2`
buf1.copy(buf2, 8, 16, 20);

console.log(buf2.toString('ascii', 0, 25));
// Print: !!!!!!!!qrst!!!!!!!!!!!!!
```

```js
// Creëer een `Buffer`en kopieer data van een regio naar een overlappende regio
// binnen dezelfde `Buffer`.

const buf = Buffer.allocUnsafe(26);

voor (laat i = 0; i < 26; i++) {
  // 97 is de decimale ASCII waarde voor 'a'
  buf[i] = i + 97;
}

buf.copy(buf, 0, 4, 10);

console.log(buf.toString());
// Print: efghijghijklmnopqrstuvwxyz
```

### buf.entries()
<!-- YAML
added: v1.1.0
-->

* Retourneert: {Iterator}

Creëert en retourneert een [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) van `[index, byte]` paren van de inhoud van `buf`.

```js
// Log de gehele inhoud van een `Buffer`.

const buf = Buffer.from('buffer');

voor (const pair of buf.entries()) {
  console.log(pair);
}
// Prints:
//   [0, 98]
//   [1, 117]
//   [2, 102]
//   [3, 102]
//   [4, 101]
//   [5, 114]
```

### buf.equals(otherBuffer)
<!-- YAML
added: v0.11.13
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The arguments can now be `Uint8Array`s.
-->

* `otherBuffer` {Buffer} Een `Buffer` of [`Uint8Array`] waar `buf` mee vergeleken moet worden.
* Retourneert: {boolean}

Retourneert `true` als zowel `buf` en `otherBuffer` precies hetzelfde aantal bytes hebben, in andere gevallen `false`.

```js
const buf1 = Buffer.from('ABC');
const buf2 = Buffer.from('414243', 'hex');
const buf3 = Buffer.from('ABCD');

console.log(buf1.equals(buf2));
// Print: true
console.log(buf1.equals(buf3));
// Print: false
```

### buf.fill(value\[, offset[, end]\]\[, encoding\])
<!-- YAML
added: v0.5.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18790
    description: Negative `end` values throw an `ERR_INDEX_OUT_OF_RANGE` error.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18129
    description: Attempting to fill a non-zero length buffer with a zero length
                 buffer triggers a thrown exception.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17427
    description: Specifying an invalid string for `value` triggers a thrown
                 exception.
  - version: v5.7.0
    pr-url: https://github.com/nodejs/node/pull/4935
    description: The `encoding` parameter is supported now.
-->

* `value` {string|Buffer|integer} De waarde waarmee de `buf` gevuld moet worden.
* `offset` {integer} Het aantal bytes over te slaan voordat men begint met het vullen van `buf`. **Default:** `0`.
* `end` {integer} De plaats waar men moet stoppen met het vullen van `buf` (niet inclusief). **Default:** [`buf.length`].
* `encoding` {string} De codering voor `value` als `value` een string is. **Standaard:** `'utf8'`.
* Retourneert: {Buffer} Een referentie naar `buf`.

Vult `buf` met de opgegeven `value`. Als de `offset` en `end` niet vermeld worden, wordt de gehele `buf` gevuld:

```js
// Vul een `Buffer` met het ASCII teken 'h'.

const b = Buffer.allocUnsafe(50).fill('h');

console.log(b.toString());
// Print: hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
```

`value` is coerced to a `uint32` value if it is not a string, `Buffer`, or integer. If the resulting integer is greater than `255` (decimal), `buf` will be filled with `value & 255`.

Als het definitieve schrijven van een `fill()` operatie op een multi-byte teken valt, dan worden alleen de bytes van het teken dat past in `buf` geschreven:

```js
// Vul een `Buffer` met een twee-byte teken.

console.log(Buffer.allocUnsafe(3).fill('\u0222'));
// Print: <Buffer c8 a2 c8>
```

Als `value` ongeldige tekens bevat, wordt deze afgekapt; als geen geldige vul data overblijven, wordt een uitzondering geworpen:

```js
const buf = Buffer.allocUnsafe(5);

console.log(buf.fill('a'));
// Prints: <Buffer 61 61 61 61 61>
console.log(buf.fill('aazz', 'hex'));
// Prints: <Buffer aa aa aa aa aa>
console.log(buf.fill('zz', 'hex'));
// Werpt een uitzondering.
```

### buf.includes(value\[, byteOffset\]\[, encoding\])
<!-- YAML
added: v5.3.0
-->

* `value` {string|Buffer|integer} Waarnaar gezocht moet worden.
* `byteOffset` {integer} Waar men moet beginnen met zoeken in `buf`. **Default:** `0`.
* `encoding` {string} Als `value` een string is, dan is dit de bijbehorende codering. **Standaard:** `'utf8'`.
* Retourneert: {boolean} `true` als `value` werd gevonden in `buf`, en anders `false`.

Gelijk aan [`buf.indexOf() !== -1`][`buf.indexOf()`].

```js
const buf = Buffer.from('this is a buffer');

console.log(buf.includes('this'));
// Print: true
console.log(buf.includes('is'));
// Print: true
console.log(buf.includes(Buffer.from('a buffer')));
// Print: true
console.log(buf.includes(97));
// Print: true (97 is the decimal ASCII value for 'a')
console.log(buf.includes(Buffer.from('a buffer example')));
// Print: false
console.log(buf.includes(Buffer.from('a buffer example').slice(0, 8)));
// Print: true
console.log(buf.includes('this', 4));
// Print: false
```

### buf.indexOf(value\[, byteOffset\]\[, encoding\])
<!-- YAML
added: v1.5.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `value` can now be a `Uint8Array`.
  - version: v5.7.0, v4.4.0
    pr-url: https://github.com/nodejs/node/pull/4803
    description: When `encoding` is being passed, the `byteOffset` parameter
                 is no longer required.
-->

* `value` {string|Buffer|Uint8Array|integer} Waarnaar gezocht moet worden.
* `byteOffset` {integer} Waar men moet beginnen met zoeken in `buf`. **Default:** `0`.
* `encoding` {string} Als `value` een string is, dan is dit de codering die gebruikt wordt om de binaire representatie te bepalen van de string waarnaar gezocht gaat worden in `buf`. **Standaard:** `'utf8'`.
* Retourneert: {integer} De index van de eerste gebeurtenis van `value` in `buf`, of `-1` als `buf` geen `value` bevat.

Als de `value` is:

  * een string, `value` wordt geïnterpreteerd in overeenstemming met de tekencodering in `encoding`.
  * een `Buffer` of [`Uint8Array`], `value` zal in zijn geheel worden gebruikt. Om een gedeeltelijke `Buffer` te vergelijken, gebruik [`buf.slice()`].
  * een nummer, `value` zal worden geïnterpreteerd als een niet ondertekende 8-bit integer waarde tussen `0` en `255`.

```js
const buf = Buffer.from('dit is een buffer');

console.log(buf.indexOf('this'));
// Print: 0
console.log(buf.indexOf('is'));
// Print: 2
console.log(buf.indexOf(Buffer.from('a buffer')));
// Print: 8
console.log(buf.indexOf(97));
// Print: 8 (97 is de decimale ASCII waarde voor 'a')
console.log(buf.indexOf(Buffer.from('een buffer voorbeeld')));
// Print: -1
console.log(buf.indexOf(Buffer.from('een buffer voorbeeld').slice(0, 8)));
// Print: 8

const utf16Buffer = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'utf16le');

console.log(utf16Buffer.indexOf('\u03a3', 0, 'utf16le'));
// Print: 4
console.log(utf16Buffer.indexOf('\u03a3', -4, 'utf16le'));
// Print: 6
```

Als de `value` geen string, nummer, of een `Buffer` is, dan zal deze methode een `TypeError` werpen. Als de `value` een nummer is, zal het worden gedwongen naar een geldige bytewaarde, een geheel getal tussen 0 en 255.

Als `byteOffset` geen nummer is, zal het worden gedwongen naar een nummer. Als het resultaat van deze dwang `NaN` of `0` is, dan wordt er in de gehele buffer gezocht. Dit gedrag komt overeen met [`String#indexOf()`].

```js
const b = Buffer.from('abcdef');

// Geeft een waarde door wat een nummer is, maar geen geldige byte
// Print: 2, gelijk aan het zoeken naar 99 of 'c'
console.log(b.indexOf(99.9));
console.log(b.indexOf(256 + 99));

// Geeft een byteOffset door wat dwingt naar NaN of 0
// Print: 1, zoek in de gehele buffer
console.log(b.indexOf('b', undefined));
console.log(b.indexOf('b', {}));
console.log(b.indexOf('b', null));
console.log(b.indexOf('b', []));
```

Als `value` een lege string is of een lege `Buffer` en `byteOffset` is minder dan `buf.length`, dan zal `byteOffset` worden geretourneerd. Als de `value` leeg is en de `byteOffset` is ten minste `buf.length`, dan zal `buf.length` worden geretourneerd.

### buf.keys()
<!-- YAML
added: v1.1.0
-->

* Retourneert: {Iterator}

Creëert en retourneert een [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) van `buf` sleutels (indexen).

```js
const buf = Buffer.from('buffer');

voor (const key of buf.keys()) {
  console.log(key);
}
// Print:
//   0
//   1
//   2
//   3
//   4
//   5
```

### buf.lastIndexOf(value\[, byteOffset\]\[, encoding\])
<!-- YAML
added: v6.0.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `value` can now be a `Uint8Array`.
-->

* `value` {string|Buffer|Uint8Array|integer} Waarnaar gezocht moet worden.
* `byteOffset` {integer} Waar men moet beginnen met zoeken in `buf`. **Standaard:** [`buf.length`]`- 1`.
* `encoding` {string} Als `value` een string is, dan is dit de codering die gebruikt wordt om de binaire representatie te bepalen van de string waarnaar gezocht gaat worden in `buf`. **Standaard:** `'utf8'`.
* Retourneert: {integer} De index van de laatste gebeurtenis van `value` in `buf`, of `-1` als `buf` geen `value` bevat.

Identiek aan [`buf.indexOf()`], behalve dat de laatste gebeurtenis van de `value` wordt gevonden, in plaats van de eerste gebeurtenis.

```js
const buf = Buffer.from('deze buffer is een buffer');

console.log(buf.lastIndexOf('this'));
// Print: 0
console.log(buf.lastIndexOf('buffer'));
// Print: 17
console.log(buf.lastIndexOf(Buffer.from('buffer')));
// Print: 17
console.log(buf.lastIndexOf(97));
// Print: 15 (97 is de decimale ASCII waarde voor 'a')
console.log(buf.lastIndexOf(Buffer.from('yolo')));
// Print: -1
console.log(buf.lastIndexOf('buffer', 5));
// Print: 5
console.log(buf.lastIndexOf('buffer', 4));
// Print: -1

const utf16Buffer = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'utf16le');

console.log(utf16Buffer.lastIndexOf('\u03a3', undefined, 'utf16le'));
// Print: 6
console.log(utf16Buffer.lastIndexOf('\u03a3', -5, 'utf16le'));
// Print: 4
```

Als de `value` geen string, nummer, of een `Buffer` is, dan zal deze methode een `TypeError` werpen. Als de `value` een nummer is, zal het worden gedwongen naar een geldige bytewaarde, een geheel getal tussen 0 en 255.

Als `byteOffset` geen nummer is, zal het worden gedwongen naar een nummer. Alle argumenten die dwingen naar `NaN`, zoals `{}` of `undefined`, zullen de gehele buffer doorzoeken. Dit gedrag komt overeen met [`String#lastIndexOf()`].

```js
const b = Buffer.from('abcdef');

// Geeft een waarde door wat een nummer is, maar geen geldige byte
// Print: 2, gelijk aan het zoeken naar 99 of 'c'
console.log(b.lastIndexOf(99.9));
console.log(b.lastIndexOf(256 + 99));

// Geeft een byteOffset door die dwingt naar NaN
// Print: 1, doorzoekt de gehele buffer
console.log(b.lastIndexOf('b', undefined));
console.log(b.lastIndexOf('b', {}));

// Geeft een byteOffset door die dwingt naar 0
// Print: -1, gelijk aan het doorgeven van 0
console.log(b.lastIndexOf('b', null));
console.log(b.lastIndexOf('b', []));
```

Als de `value` een lege string is of een lege `Buffer`, zal `byteOffset` worden geretourneerd.

### buf.length
<!-- YAML
added: v0.1.90
-->

* {integer}

Retourneert de hoeveelheid geheugen toegewezen aan `buf` in bytes. Merk hier op dat dit niet noodzakelijkerwijs het aantal "bruikbare" data binnen `buf` weergeeft.

```js
// Creëer een `Buffer` en schrijf er een kortere ASCII string naartoe.

const buf = Buffer.alloc(1234);

console.log(buf.length);
// Print: 1234

buf.write('some string', 0, 'ascii');

console.log(buf.length);
// Print: 1234
```

Terwijl de `length` eigenschap niet onveranderlijk is, kan het veranderen van de waarde van `length` resulteren tot niet-gedefinieerd en inconsistent gedrag. Toepassingen die de lengte van een `Buffer` wensen aan te passen moeten om deze reden de `length` als een alleen-lezen behandelen en [`buf.slice()`] gebruiken om een nieuwe `Buffer` te creëren.

```js
let buf = Buffer.allocUnsafe(10);

buf.write('abcdefghj', 0, 'ascii');

console.log(buf.length);
// Print: 10

buf = buf.slice(0, 5);

console.log(buf.length);
// Print: 5
```

### buf.parent
<!-- YAML
deprecated: v8.0.0
-->

> Stabiliteit: 0 - Afgekeurd: Gebruik [`buf.buffer`] als alternatief.

De `buf.parent` eigenschap is een afgekeurde alias voor `buf.buffer`.

### buf.readDoubleBE(offset)
### buf.readDoubleLE(offset)
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Moet voldoen aan `0 <= offset <= buf.length - 8`.
* Retourneert: {number}

Leest een 64-bit dubbel van `buf` op de opgegeven `offset` met een gespecificeerd endian-formaat (`readDoubleBE()` retourneert grote endian, `readDoubleLE()` retourneert kleine endian).

```js
const buf = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]);

console.log(buf.readDoubleBE(0));
// Print: 8.20788039913184e-304
console.log(buf.readDoubleLE(0));
// Print: 5.447603722011605e-270
console.log(buf.readDoubleLE(1));
// Throws ERR_OUT_OF_RANGE
```

### buf.readFloatBE(offset)
### buf.readFloatLE(offset)
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Moet voldoen aan `0 <= offset <= buf.length - 4`.
* Retourneert: {number}

Leest een 32-bit float van `buf` op de opgegeven `offset` met gespecificeerd endian formaat (`readFloatBE()` retourneert grote endian, `readFloatLE()` retourneert kleine endian).

```js
const buf = Buffer.from([1, 2, 3, 4]);

console.log(buf.readFloatBE(0));
// Print: 2.387939260590663e-38
console.log(buf.readFloatLE(0));
// Print: 1.539989614439558e-36
console.log(buf.readFloatLE(1));
// Throws ERR_OUT_OF_RANGE
```

### buf.readInt8(offset)
<!-- YAML
added: v0.5.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Moet voldoen aan `0 <= offset <= buf.length - 1`.
* Retourneert: {integer}

Leest een ondertekend geheel 8-bit getal van `buf` op de gespecificeerde `offset`.

Gehele getallen gelezen van een `Buffer` worden geïnterpreteerd als aanvullende ondertekende waarden van twee.

```js
const buf = Buffer.from([-1, 5]);

console.log(buf.readInt8(0));
// Print: -1
console.log(buf.readInt8(1));
// Print: 5
console.log(buf.readInt8(2));
// Throws ERR_OUT_OF_RANGE
```

### buf.readInt16BE(offset)
### buf.readInt16LE(offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Moet voldoen aan `0 <= offset <= buf.length - 2`.
* Retourneert: {integer}

Leest een ondertekend geheel 16-bit getal van `buf` op de opgegeven `offset` met het gespecificeerde endian formaat (`readInt16BE()` retourneert een grote endian, `readInt16LE()` retourneert een kleine endian).

Gehele getallen gelezen van een `Buffer` worden geïnterpreteerd als aanvullende ondertekende waarden van twee.

```js
const buf = Buffer.from([0, 5]);

console.log(buf.readInt16BE(0));
// Print: 5
console.log(buf.readInt16LE(0));
// Print: 1280
console.log(buf.readInt16LE(1));
// Werpt ERR_OUT_OF_RANGE
```

### buf.readInt32BE(offset)
### buf.readInt32LE(offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Moet voldoen aan `0 <= offset <= buf.length - 4`.
* Retourneert: {integer}

Leest een ondertekend geheel 32-bit getal van `buf` op de opgegeven `offset` met het gespecificeerde endian formaat (`readInt32BE()` retourneert een grote endian, `readInt32LE()` retourneert een kleine endian).

Gehele getallen gelezen van een `Buffer` worden geïnterpreteerd als aanvullende ondertekende waarden van twee.

```js
const buf = Buffer.from([0, 0, 0, 5]);

console.log(buf.readInt32BE(0));
// Print: 5
console.log(buf.readInt32LE(0));
// Print: 83886080
console.log(buf.readInt32LE(1));
// WERPT ERR_OUT_OF_RANGE
```

### buf.readIntBE(offset, byteLength)
### buf.readIntLE(offset, byteLength)
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 and `byteLength` to `uint32` anymore.
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Moet voldoen aan `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Aantal te lezen bytes. Moet voldoen aan `0 < byteLength <= 6`.
* Retourneert: {integer}

Leest `byteLength` aantal bytes van `buf` op de gespecificeerde `offset` en interpreteert het resultaat als een aanvullende getekende waarde van twee. Ondersteunt maximaal 48 bits nauwkeurigheid.

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab]);

console.log(buf.readIntLE(0, 6).toString(16));
// Print: -546f87a9cbee
console.log(buf.readIntBE(0, 6).toString(16));
// Print: 1234567890ab
console.log(buf.readIntBE(1, 6).toString(16));
// Werpt ERR_INDEX_OUT_OF_RANGE
console.log(buf.readIntBE(1, 0).toString(16));
// Werpt ERR_OUT_OF_RANGE
```

### buf.readUInt8(offset)
<!-- YAML
added: v0.5.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Moet voldoen aan `0 <= offset <= buf.length - 1`.
* Retourneert: {integer}

Leest een niet-ondertekend geheel 8-bit getal van `buf` op de gespecificeerde `offset`.

```js
const buf = Buffer.from([1, -2]);

console.log(buf.readUInt8(0));
// Print: 1
console.log(buf.readUInt8(1));
// Print: 254
console.log(buf.readUInt8(2));
// Werpt ERR_OUT_OF_RANGE
```

### buf.readUInt16BE(offset)
### buf.readUInt16LE(offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Moet voldoen aan `0 <= offset <= buf.length - 2`.
* Retourneert: {integer}

Leest een niet-ondertekend geheel 16-bit getal van `buf` op de opgegeven `offset` met het gespecificeerde endian formaat (`readInt16BE()` retourneert een grote endian, `readInt16LE()` retourneert een kleine endian).

```js
const buf = Buffer.from([0x12, 0x34, 0x56]);

console.log(buf.readUInt16BE(0).toString(16));
// Print: 1234
console.log(buf.readUInt16LE(0).toString(16));
// Print: 3412
console.log(buf.readUInt16BE(1).toString(16));
// Print: 3456
console.log(buf.readUInt16LE(1).toString(16));
// Print: 5634
console.log(buf.readUInt16LE(2).toString(16));
// Werpt ERR_OUT_OF_RANGE
```

### buf.readUInt32BE(offset)
### buf.readUInt32LE(offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Moet voldoen aan `0 <= offset <= buf.length - 4`.
* Retourneert: {integer}

Leest een niet-ondertekend geheel 32-bit getal van `buf` op de opgegeven `offset` met het gespecificeerde endian formaat (`readInt32BE()` retourneert een grote endian, `readInt32LE()` retourneert een kleine endian).

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78]);

console.log(buf.readUInt32BE(0).toString(16));
// Print: 12345678
console.log(buf.readUInt32LE(0).toString(16));
// Print: 78563412
console.log(buf.readUInt32LE(1).toString(16));
// Werpt ERR_OUT_OF_RANGE
```

### buf.readUIntBE(offset, byteLength)
### buf.readUIntLE(offset, byteLength)
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 and `byteLength` to `uint32` anymore.
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Moet voldoen aan `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Aantal te lezen bytes. Moet voldoen aan `0 < byteLength <= 6`.
* Retourneert: {integer}

Leest `byteLength` aantal bytes van `buf` op de gespecificeerde `offset` en interpreteert het resultaat als een niet-ondertekend geheel getal. Ondersteunt maximaal 48 bits nauwkeurigheid.

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab]);

console.log(buf.readUIntBE(0, 6).toString(16));
// Print: 1234567890ab
console.log(buf.readUIntLE(0, 6).toString(16));
// Print: ab9078563412
console.log(buf.readUIntBE(1, 6).toString(16));
// Werpt ERR_OUT_OF_RANGE
```

### buf.slice([start[, end]])
<!-- YAML
added: v0.3.0
changes:
  - version: v7.1.0, v6.9.2
    pr-url: https://github.com/nodejs/node/pull/9341
    description: Coercing the offsets to integers now handles values outside
                 the 32-bit integer range properly.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/9101
    description: All offsets are now coerced to integers before doing any
                 calculations with them.
-->

* `start` {integer} Waar de nieuwe `Buffer` zal beginnen. **Default:** `0`.
* `end` {integer} Waar de nieuwe `Buffer` zal eindigen (niet inclusief). **Standaard:** [`buf.length`].
* Retourneert: {Buffer}

Retourneert een nieuwe `Buffer` die verwijst naar hetzelfde geheugen als het origineel, maar offset en bijgesneden door de `start` en `end` van indexcijfers.

Het specificeren van een `end` groter dan [`buf.length`] zal hetzelfde resultaat retourneren als `end` gelijk aan [`buf.length`].

Het wijzigen van de nieuwe `Buffer` slice zal het geheugen in de originele `Buffer` wijzigen omdat het toegewezen geheugen van de twee objecten elkaar overlappen.

```js
// Creëer een `Buffer` met het ASCII-alfabet, neem een slice, en wijzig één byte
// van de originele `Buffer`.

const buf1 = Buffer.allocUnsafe(26);

voor (let i = 0; i < 26; i++) {
  // 97 is de decimale ASCII waarde voor 'a'
  buf1[i] = i + 97;
}

const buf2 = buf1.slice(0, 3);

console.log(buf2.toString('ascii', 0, buf2.length));
// Print: abc

buf1[0] = 33;

console.log(buf2.toString('ascii', 0, buf2.length));
// Print: !bc
```

Het specificeren van negatieve indexen, zorgt ervoor dat de slice wordt gegenereerd relatief aan het einde van `buf` in plaats van aan het begin.

```js
const buf = Buffer.from('buffer');

console.log(buf.slice(-6, -1).toString());
// Print: buffe
// (Gelijk aan buf.slice(0, 5))

console.log(buf.slice(-6, -2).toString());
// Print: buff
// (Gelijk aan buf.slice(0, 4))

console.log(buf.slice(-5, -2).toString());
// Print: uff
// (Gelijk aan buf.slice(1, 4))
```

### buf.swap16()
<!-- YAML
added: v5.10.0
-->

* Retourneert: {Buffer} Een referentie naar `buf`.

Interpreteert `buf` als een array van niet-ondertekende gehele 16-bit getallen en wisselt de byte-volgorde *in-place*. Werpt een [`ERR_INVALID_BUFFER_SIZE`] als [`buf.length`] geen veelvoud van 2 is.

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

console.log(buf1);
// Print: <Buffer 01 02 03 04 05 06 07 08>

buf1.swap16();

console.log(buf1);
// Print: <Buffer 02 01 04 03 06 05 08 07>

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

buf2.swap16();
// Werpt ERR_INVALID_BUFFER_SIZE
```

One convenient use of `buf.swap16()` is to perform a fast in-place conversion between UTF-16 little-endian and UTF-16 big-endian:

```js
const buf = Buffer.from('This is little-endian UTF-16', 'utf16le');
buf.swap16(); // Convert to big-endian UTF-16 text.
```

### buf.swap32()
<!-- YAML
added: v5.10.0
-->

* Retourneert: {Buffer} Een referentie naar `buf`.

Interpreteert `buf` als een array van niet-ondertekende gehele 32-bit getallen en wisselt de byte-volgorde *in-place*. Werpt een [`ERR_INVALID_BUFFER_SIZE`] als [`buf.length`] geen veelvoud van 4 is.

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

console.log(buf1);
// Print: <Buffer 01 02 03 04 05 06 07 08>

buf1.swap32();

console.log(buf1);
// Print: <Buffer 04 03 02 01 08 07 06 05>

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

buf2.swap32();
// Werpt ERR_INVALID_BUFFER_SIZE
```

### buf.swap64()
<!-- YAML
added: v6.3.0
-->

* Retourneert: {Buffer} Een referentie naar `buf`.

Interpreteert `buf` als een array van 64-bit getallen en wisselt de byte-volgorde *in-place*. Werpt een [`ERR_INVALID_BUFFER_SIZE`] als [`buf.length`] geen veelvoud van 8 is.

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

console.log(buf1);
// Print: <Buffer 01 02 03 04 05 06 07 08>

buf1.swap64();

console.log(buf1);
// Print: <Buffer 08 07 06 05 04 03 02 01>

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

buf2.swap64();
// Werpt ERR_INVALID_BUFFER_SIZE
```

Merk hier op dat JavaScript geen gehele 64-bit getallen kan coderen. Deze methode is bedoeld om te werken met 64-bit floats.

### buf.toJSON()
<!-- YAML
added: v0.9.2
-->

* Retourneert: {Object}

Retourneert een JSON representatie van `buf`. [`JSON.stringify()`] roept deze functie onvoorwaardelijk op wanneer een `Buffer` instantie een string wordt gemaakt.

```js
const buf = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5]);
const json = JSON.stringify(buf);

console.log(json);
// Print: {"type":"Buffer","data":[1,2,3,4,5]}

const copy = JSON.parse(json, (key, value) => {
  return value && value.type === 'Buffer' ?
    Buffer.from(value.data) :
    value;
});

console.log(copy);
// Print: <Buffer 01 02 03 04 05>
```

### buf.toString([encoding[, start[, end]]])
<!-- YAML
added: v0.1.90
-->

* `encoding` {string} De te gebruiken teken-codering. **Standaard:** `'utf8'`.
* `start` {integer} De byte offset waar decoderen moet beginnen. **Default:** `0`.
* `end` {integer} De byte offset waar decodering moet stoppen (niet inclusief). **Standaard:** [`buf.length`].
* Retourneert: {string}

Decodeert `buf` naar een string volgens de gespecificeerde teken-codering in `encoding`. `start` en `end` kunnen worden doorgegeven om alleen een subset van `buf` te coderen.

De maximale lengte van een string instantie (in UTF-16 code units) is beschikbaar als [`buffer.constants.MAX_STRING_LENGTH`][].

```js
const buf1 = Buffer.allocUnsafe(26);

voor (let i = 0; i < 26; i++) {
  // 97 is de decimale ASCII waarde voor 'a'
  buf1[i] = i + 97;
}

console.log(buf1.toString('ascii'));
// Print: abcdefghijklmnopqrstuvwxyz
console.log(buf1.toString('ascii', 0, 5));
// Print: abcde

const buf2 = Buffer.from('tést');

console.log(buf2.toString('hex'));
// Print: 74c3a97374
console.log(buf2.toString('utf8', 0, 3));
// Print: té
console.log(buf2.toString(undefined, 0, 3));
// Print: té
```

### buf.values()
<!-- YAML
added: v1.1.0
-->

* Retourneert: {Iterator}

Creëert en retourneert een [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) voor `buf` sleutels (indexen). Deze functie wordt automatisch aangeroepen als een `Buffer` wordt gebruikt in een `for..of` verklaring.

```js
const buf = Buffer.from('buffer');

voor (const value of buf.values()) {
  console.log(value);
}
// Print:
//   98
//   117
//   102
//   102
//   101
//   114

voor (const value of buf) {
  console.log(value);
}
// Print:
//   98
//   117
//   102
//   102
//   101
//   114
```

### buf.write(string\[, offset[, length]\]\[, encoding\])
<!-- YAML
added: v0.1.90
-->

* `string` {string} String om naar `buf` te schrijven.
* `offset` {integer} Het aantal bytes over te slaan voordat men begint met het schrijven van de `string`. **Default:** `0`.
* `length` {integer} Aantal te schrijven bytes. **Standaard:** `buf.length - offset`.
* `encoding` {string} De tekencodering van een `string`. **Standaard:** `'utf8'`.
* Retourneert: {integer} Aantal geschreven bytes.

Schrijft `string` naar `buf` op `offset` volgens de tekencodering in `encoding`. De `length` parameter is het aantal te schrijven bytes. Als `buf` niet genoeg ruimte had om een gehele string te bevatten, wordt slechts een gedeelte van de `string` geschreven. Gedeeltelijk gecodeerde tekens zullen echter niet geschreven worden.

```js
const buf = Buffer.alloc(256);

const len = buf.write('\u00bd + \u00bc = \u00be', 0);

console.log(`${len} bytes: ${buf.toString('utf8', 0, len)}`);
// Print: 12 bytes: ½ + ¼ = ¾
```

### buf.writeDoubleBE(value, offset)
### buf.writeDoubleLE(value, offset)
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {number} Nummer wat naar `buf` geschreven moet worden.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Moet voldoen aan `0 <= offset <= buf.length - 8`.
* Retourneert: {integer} `offset` plus het aantal geschreven bytes.

Schrijft `value` naar `buf` op de opgegeven `offset` met gespecificeerd endian format (`writeDoubleBE()` schrijft grote endian, `writeDoubleLE()` schrijft kleine endian). `value` *moet* een geldig 64-bit evenbeeld zijn. Gedrag is ongedefinieerd als de `value` iets anders dan een 64-bit evenbeeld is.

```js
const buf = Buffer.allocUnsafe(8);

buf.writeDoubleBE(123.456, 0);

console.log(buf);
// Prints: <Buffer 40 5e dd 2f 1a 9f be 77>

buf.writeDoubleLE(123.456, 0);

console.log(buf);
// Prints: <Buffer 77 be 9f 1a 2f dd 5e 40>
```

### buf.writeFloatBE(value, offset)
### buf.writeFloatLE(value, offset)
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {number} Nummer wat naar `buf` geschreven moet worden.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Moet voldoen aan `0 <= offset <= buf.length - 4`.
* Retourneert: {integer} `offset` plus het aantal geschreven bytes.

Schrijft `value` naar `buf` op de opgegeven `offset` met gespecificeerd endian format (`writeFloatBE()` schrijft grote endian, `writeFloatLE()` schrijft kleine endian). `value` *moet* een geldige 32-bit float zijn. Gedrag is ongedefinieerd als de `value` iets anders dan een 32-bit float is.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeFloatBE(0xcafebabe, 0);

console.log(buf);
// Print: <Buffer 4f 4a fe bb>

buf.writeFloatLE(0xcafebabe, 0);

console.log(buf);
// Print: <Buffer bb fe 4a 4f>
```

### buf.writeInt8(value, offset)
<!-- YAML
added: v0.5.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Nummer wat naar `buf` geschreven moet worden.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Moet voldoen aan `0 <= offset <= buf.length - 1`.
* Retourneert: {integer} `offset` plus het aantal geschreven bytes.

Schrijft `value` naar `buf` op de gespecificeerde `offset`. `value` *moet* een geldig ondertekend geheel 8-bit getal zijn. Gedrag is ongedefinieerd als de `value` iets anders dan een ondertekend geheel 8-bit getal is.

`value` wordt geïnterpreteerd en geschreven als een aanvullend ondertekend geheel getal van twee.

```js
const buf = Buffer.allocUnsafe(2);

buf.writeInt8(2, 0);
buf.writeInt8(-2, 1);

console.log(buf);
// Print: <Buffer 02 fe>
```

### buf.writeInt16BE(value, offset)
### buf.writeInt16LE(value, offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Nummer wat naar `buf` geschreven moet worden.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Moet voldoen aan `0 <= offset <= buf.length - 2`.
* Retourneert: {integer} `offset` plus het aantal geschreven bytes.

Schrijft `value` naar `buf` op de opgegeven `offset` met gespecificeerd endian format (`writeInt16BE()` schrijft grote endian, `writeInt16LE()` schrijft kleine endian). `value` *moet* een geldig ondertekend geheel 16-bit getal zijn. Gedrag is ongedefinieerd als de `value` iets anders dan een ondertekend geheel 16-bit getal is.

`value` wordt geïnterpreteerd en geschreven als een aanvullend ondertekend geheel getal van twee.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeInt16BE(0x0102, 0);
buf.writeInt16LE(0x0304, 2);

console.log(buf);
// Print: <Buffer 01 02 04 03>
```

### buf.writeInt32BE(value, offset)
### buf.writeInt32LE(value, offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Nummer wat naar `buf` geschreven moet worden.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Moet voldoen aan `0 <= offset <= buf.length - 4`.
* Retourneert: {integer} `offset` plus het aantal geschreven bytes.

Schrijft `value` naar `buf` op de opgegeven `offset` met gespecificeerd endian format (`writeInt32BE()` schrijft grote endian, `writeInt32LE()` schrijft kleine endian). `value` *moet* een geldig ondertekend geheel 32-bit getal zijn. Gedrag is ongedefinieerd als de `value` iets anders dan een ondertekend geheel 32-bit getal is.

`value` wordt geïnterpreteerd en geschreven als een aanvullend ondertekend geheel getal van twee.

```js
const buf = Buffer.allocUnsafe(8);

buf.writeInt32BE(0x01020304, 0);
buf.writeInt32LE(0x05060708, 4);

console.log(buf);
// Print: <Buffer 01 02 03 04 08 07 06 05>
```

### buf.writeIntBE(value, offset, byteLength)
### buf.writeIntLE(value, offset, byteLength)
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 and `byteLength` to `uint32` anymore.
-->

* `value` {integer} Nummer wat naar `buf` geschreven moet worden.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Moet voldoen aan `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Aantal te lezen bytes. Moet voldoen aan `0 < byteLength <= 6`.
* Retourneert: {integer} `offset` plus het aantal geschreven bytes.

Schrijft `byteLength` bytes van `value` naar `buf` op de gespecificeerde `offset`. Ondersteunt maximaal 48 bits nauwkeurigheid. Gedrag is ongedefinieerd als de `value` iets anders dan een ondertekend geheel getal is.

```js
const buf = Buffer.allocUnsafe(6);

buf.writeIntBE(0x1234567890ab, 0, 6);

console.log(buf);
// Print: <Buffer 12 34 56 78 90 ab>

buf.writeIntLE(0x1234567890ab, 0, 6);

console.log(buf);
// Print: <Buffer ab 90 78 56 34 12>
```

### buf.writeUInt8(value, offset)
<!-- YAML
added: v0.5.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Nummer wat naar `buf` geschreven moet worden.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Moet voldoen aan `0 <= offset <= buf.length - 1`.
* Retourneert: {integer} `offset` plus het aantal geschreven bytes.

Schrijft `value` naar `buf` op de gespecificeerde `offset`. `value` *moet* een geldig niet-ondertekend geheel 8-bit getal zijn. Gedrag is ongedefinieerd als de `value` iets anders dan een ondertekend geheel 8-bit getal is.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt8(0x3, 0);
buf.writeUInt8(0x4, 1);
buf.writeUInt8(0x23, 2);
buf.writeUInt8(0x42, 3);

console.log(buf);
// Print: <Buffer 03 04 23 42>
```

### buf.writeUInt16BE(value, offset)
### buf.writeUInt16LE(value, offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Nummer wat naar `buf` geschreven moet worden.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Moet voldoen aan `0 <= offset <= buf.length - 2`.
* Retourneert: {integer} `offset` plus het aantal geschreven bytes.

Schrijft `value` naar `buf` op de opgegeven `offset`met gespecificeerd endian format (`writeUInt16BE()` schrijft endian, `writeUInt16LE()` schrijft kleine endian). `value` moet een geldig niet-ondertekend geheel 16-bit getal zijn. Gedrag is ongedefinieerd als de `value` iets anders dan een niet-ondertekend geheel 16-bit getal is.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt16BE(0xdead, 0);
buf.writeUInt16BE(0xbeef, 2);

console.log(buf);
// Print: <Buffer de ad be ef>

buf.writeUInt16LE(0xdead, 0);
buf.writeUInt16LE(0xbeef, 2);

console.log(buf);
// Print: <Buffer ad de ef be>
```

### buf.writeUInt32BE(value, offset)
### buf.writeUInt32LE(value, offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Nummer wat naar `buf` geschreven moet worden.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Moet voldoen aan `0 <= offset <= buf.length - 4`.
* Retourneert: {integer} `offset` plus het aantal geschreven bytes.

Schrijft `value` naar `buf` op de opgegeven `offset`met gespecificeerd endian format (`writeUInt32BE()` schrijft grote endian, `writeUInt32LE()` schrijft kleine endian). `value` moet een geldig niet-ondertekend geheel 32-bit getal zijn. Gedrag is ongedefinieerd als de `value` iets anders dan een niet-ondertekend geheel 32-bit getal is.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt32BE(0xfeedface, 0);

console.log(buf);
// Print: <Buffer fe ed fa ce>

buf.writeUInt32LE(0xfeedface, 0);

console.log(buf);
// Print: <Buffer ce fa ed fe>
```

### buf.writeUIntBE(value, offset, byteLength)
### buf.writeUIntLE(value, offset, byteLength)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 and `byteLength` to `uint32` anymore.
-->

* `value` {integer} Nummer wat naar `buf` geschreven moet worden.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Moet voldoen aan `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Aantal te lezen bytes. Moet voldoen aan `0 < byteLength <= 6`.
* Retourneert: {integer} `offset` plus het aantal geschreven bytes.

Schrijft `byteLength` bytes van `value` naar `buf` op de gespecificeerde `offset`. Ondersteunt maximaal 48 bits nauwkeurigheid. Gedrag is ongedefinieerd als de `value` iets anders dan een niet-ondertekend geheel getal is.

```js
const buf = Buffer.allocUnsafe(6);

buf.writeUIntBE(0x1234567890ab, 0, 6);

console.log(buf);
// Print: <Buffer 12 34 56 78 90 ab>

buf.writeUIntLE(0x1234567890ab, 0, 6);

console.log(buf);
// Print: <Buffer ab 90 78 56 34 12>
```

## buffer.INSPECT_MAX_BYTES
<!-- YAML
added: v0.5.4
-->

* {integer} **Standaard:** `50`

Retourneert het maximaal aantal bytes die worden geretourneerd als `buf.inspect()` wordt aangeroepen. Dit kan overschreven worden door gebruikers-modules. Zie [`util.inspect()`] voor meer informatie over `buf.inspect()` gedrag.

Observeer hier dat dit een eigenschap is op de `buffer` module geretourneerd door `require('buffer')`, niet op de `Buffer` globaal of een `Buffer` instantie.

## buffer.kMaxLength
<!-- YAML
added: v3.0.0
-->

* {integer} De grootste toegestane grootte voor een enkele `Buffer` instantie.

Een alias voor [`buffer.constants.MAX_LENGTH`][].

Observeer hier dat dit een eigenschap is op de `buffer` module geretourneerd door `require('buffer')`, niet op de `Buffer` globaal of een `Buffer` instantie.

## buffer.transcode(source, fromEnc, toEnc)
<!-- YAML
added: v7.1.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `source` parameter can now be a `Uint8Array`.
-->

* `source` {Buffer|Uint8Array} Een `Buffer` of `Uint8Array` instantie.
* `fromEnc` {string} De actuele codering.
* `toEnc` {string} Naar doel codering.

Codeert opnieuw de gegeven `Buffer` of `Uint8Array` instantie van één teken codering naar een andere. Retourneert een nieuwe `Buffer` instantie.

Werpt als de `fromEnc` of `toEnc` ongeldige teken coderingen specificeert, of als de conversie van `fromEnc` naar `toEnc` niet is toegestaan.

Encodings supported by `buffer.transcode()` are: `'ascii'`, `'utf8'`, `'utf16le'`, `'ucs2'`, `'latin1'`, and `'binary'`.

Het transcoderingsproces zal vervangingstekens gebruiken als een gegeven byte reeks niet adequaat kan worden weergegeven in de codering van het doel. Bijvoorbeeld:

```js
const buffer = require('buffer');

const newBuf = buffer.transcode(Buffer.from('€'), 'utf8', 'ascii');
console.log(newBuf.toString('ascii'));
// Print: '?'
```

Omdat het Euro (`€`) teken niet kan worden weergegeven in US-ASCII, wordt het vervangen door `?</> in de trans-gecodeerde <code>Buffer`.

Observeer hier dat dit een eigenschap is op de `buffer` module geretourneerd door `require('buffer')`, niet op de `Buffer` globaal of een `Buffer` instantie.

## Class: SlowBuffer
<!-- YAML
deprecated: v6.0.0
-->

> Stabiliteit: 0 - Afgekeurd: Gebruik [`Buffer.allocUnsafeSlow()`] als alternatief.

Retourneert een un-pooled `Buffer`.

Om vuilnis collectie overhead te voorkomen door het creëren van veel individueel toegewezen `Buffer` instanties, worden als standaard toewijzingen van minder dan 4KB van één enkel groter toegewezen object gesneden.

Wanneer een ontwikkelaar echter voor onbepaalde tijd een klein deel van het geheugen van een pool moet behouden, kan het gepast zijn een un-pooled `Buffer` instantie te creëren, met behulp van `SlowBuffer` en dan de relevante delen te kopiëren.

```js
// Need to keep around a few small chunks of memory
const store = [];

socket.on('readable', () => {
  let data;
  while (null !== (data = readable.read())) {
    // Allocate for retained data
    const sb = SlowBuffer(10);

    // Copy the data into the new allocation
    data.copy(sb, 0, 0, 10);

    store.push(sb);
  }
});
```

`SlowBuffer` zou alleen als laatste poging moeten worden gebruikt *nadat* een ontwikkelaar overmatig geheugenbehoud heeft opgemerkt in hun toepassingen.

### new SlowBuffer(size)
<!-- YAML
deprecated: v6.0.0
-->

> Stabiliteit: 0 - Afgekeurd: Gebruik [`Buffer.allocUnsafeSlow()`] als alternatief.

* `size` {integer} De gewenste lengte van de nieuwe `SlowBuffer`.

Kent een nieuwe `Buffer` van `size` bytes toe. Als `size` groter is dan [`buffer.constants.MAX_LENGTH`] of kleiner dan 0, wordt [`ERR_INVALID_OPT_VALUE`] geworpen. Een nul-lengte `Buffer` wordt gecreëerd als de `size` 0 is.

Het onderliggende geheugen voor `SlowBuffer` instanties is *niet geïnitialiseerd*. De inhoud van een nieuw gecreëerde `SlowBuffer` is onbekend en kan gevoelige informatie bevatten. Gebruik [`buf.fill(0)`][`buf.fill()`] om een `SlowBuffer` met nullen te initialiseren.

```js
const { SlowBuffer } = require('buffer');

const buf = new SlowBuffer(5);

console.log(buf);
// Print: (inhoud kan verschillen): <Buffer 78 e0 82 02 01>

buf.fill(0);

console.log(buf);
// Print: <Buffer 00 00 00 00 00>
```

## Buffer Constants
<!-- YAML
added: v8.2.0
-->

Observeer hier dat `buffer.constants` een eigenschap is op de `buffer` module geretourneerd door `require('buffer')`, niet op de `Buffer` globaal of een `Buffer` instantie.

### buffer.constants.MAX_LENGTH
<!-- YAML
added: v8.2.0
-->

* {integer} De grootste toegestane grootte voor een enkele `Buffer` instantie.

Op 32-bit architecturen, is deze waarde `(2^30)-1` (~1GB). Op 64-bit architecturen, is deze waarde `(2^31)-1` (~2GB).

Deze waarde is ook beschikbaar als `buffer.kMaxLength`][].

### buffer.constants.MAX_STRING_LENGTH
<!-- YAML
added: v8.2.0
-->

* {integer} De grootste toegestane lengte voor een enkele `string` instantie.

Vertegenwoordigt de grootste `length` die een `string` primitieve kan hebben, geteld in UTF-16 code units.

Deze waarde kan afhankelijk zijn van de JS engine die gebruikt wordt.
