# Buffer

<!--introduced_in=v0.1.90-->

> Stabiliteit: 2 - stabiel

In Node.js, `Buffer` objects are used to represent binary data in the form of a sequence of bytes. Many Node.js APIs, for example streams and file system operations, support `Buffer`s, as interactions with the operating system or other processes generally always happen in terms of binary data.

The `Buffer` class is a subclass of the [`Uint8Array`][] class that is built into the JavaScript language. A number of additional methods are supported that cover additional use cases. Node.js APIs accept plain [`Uint8Array`][]s wherever `Buffer`s are supported as well.

Instances of the `Buffer` class, and [`Uint8Array`][]s in general, are similar to arrays of integers from `0` to `255`, but correspond to fixed-sized blocks of memory and cannot contain any other values. The size of a `Buffer` is established when it is created and cannot be changed.

The `Buffer` class is within the global scope, making it unlikely that one would need to ever use `require('buffer').Buffer`.

```js
// Creëert een ongevulde Buffer met een lengte van 10.
const buf1 = Buffer.alloc(10);

// Creates a Buffer of length 10,
// filled with bytes which all have the value `1`.
const buf2 = Buffer.alloc(10, 1);

// Creëert een ongeinitialiseerde buffer met een lengte van10.
// This is faster than calling Buffer.alloc() but the returned
// Buffer instance might contain old data that needs to be
// overwritten using fill(), write(), or other functions that fill the Buffer's
// contents.
const buf3 = Buffer.allocUnsafe(10);

// Creates a Buffer containing the bytes [1, 2, 3].
const buf4 = Buffer.from([1, 2, 3]);

// Creates a Buffer containing the bytes [1, 1, 1, 1] – the entries
// are all truncated using `(value & 255)` to fit into the range 0–255.
const buf5 = Buffer.from([257, 257.5, -255, '1']);

// Creates a Buffer containing the UTF-8-encoded bytes for the string 'tést':
// [0x74, 0xc3, 0xa9, 0x73, 0x74] (in hexadecimal notation)
// [116, 195, 169, 115, 116] (in decimal notation)
const buf6 = Buffer.from('tést');

// Creates a Buffer containing the Latin-1 bytes [0x74, 0xe9, 0x73, 0x74].
const buf7 = Buffer.from('tést', 'latin1');
```

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

When converting between `Buffer`s and strings, a character encoding may be specified. If no character encoding is specified, UTF-8 will be used as the default.

```js
const buf = Buffer.from('hello world', 'utf8');

console.log(buf.toString('hex'));
// Prints: 68656c6c6f20776f726c64
console.log(buf.toString('base64'));
// Prints: aGVsbG8gd29ybGQ=

console.log(Buffer.from('fhqwhgads', 'utf8'));
// Prints: <Buffer 66 68 71 77 68 67 61 64 73>
console.log(Buffer.from('fhqwhgads', 'utf16le'));
// Prints: <Buffer 66 00 68 00 71 00 77 00 68 00 67 00 61 00 64 00 73 00>
```

The character encodings currently supported by Node.js are the following:

* `'utf8'`: Multi-byte encoded Unicode characters. Many web pages and other document formats use [UTF-8](https://en.wikipedia.org/wiki/UTF-8). This is the default character encoding. When decoding a `Buffer` into a string that does not exclusively contain valid UTF-8 data, the Unicode replacement character `U+FFFD` � will be used to represent those errors.

* `'utf16le'`: Multi-byte encoded Unicode characters. Unlike `'utf8'`, each character in the string will be encoded using either 2 or 4 bytes. Node.js only supports the [little-endian](https://en.wikipedia.org/wiki/Endianness) variant of [UTF-16](https://en.wikipedia.org/wiki/UTF-16).

* `'latin1'`: Latin-1 stands for [ISO-8859-1](https://en.wikipedia.org/wiki/ISO-8859-1). This character encoding only supports the Unicode characters from `U+0000` to `U+00FF`. Each character is encoded using a single byte. Characters that do not fit into that range are truncated and will be mapped to characters in that range.

Converting a `Buffer` into a string using one of the above is referred to as decoding, and converting a string into a `Buffer` is referred to as encoding.

Node.js also supports the following two binary-to-text encodings. For binary-to-text encodings, the naming convention is reversed: Converting a `Buffer` into a string is typically referred to as encoding, and converting a string into a `Buffer` as decoding.

* `'base64'`: [Base64](https://en.wikipedia.org/wiki/Base64) encoding. When creating a `Buffer` from a string, this encoding will also correctly accept "URL and Filename Safe Alphabet" as specified in [RFC 4648, Section 5](https://tools.ietf.org/html/rfc4648#section-5).

* `'hex'`: Encode each byte as two hexadecimal characters. Data truncation may occur when decoding string that do exclusively contain valid hexadecimal characters. See below for an example.

The following legacy character encodings are also supported:

* `'ascii'`: For 7-bit [ASCII](https://en.wikipedia.org/wiki/ASCII) data only. When encoding a string into a `Buffer`, this is equivalent to using `'latin1'`. When decoding a `Buffer` into a string, using encoding this will additionally unset the highest bit of each byte before decoding as `'latin1'`. Generally, there should be no reason to use this encoding, as `'utf8'` (or, if the data is known to always be ASCII-only, `'latin1'`) will be a better choice when encoding or decoding ASCII-only text. It is only provided for legacy compatibility.

* `'binary'`: Alias for `'latin1'`. See [binary strings](https://developer.mozilla.org/en-US/docs/Web/API/DOMString/Binary) for more background on this topic. The name of this encoding can be very misleading, as all of the encodings listed here convert between strings and binary data. For converting between strings and `Buffer`s, typically `'utf-8'` is the right choice.

* `'ucs2'`: Alias of `'utf16le'`. UCS-2 used to refer to a variant of UTF-16 that did not support characters that had code points larger than U+FFFF. In Node.js, these code points are always supported.

```js
Buffer.from('1ag', 'hex');
// Prints <Buffer 1a>, data truncated when first non-hexadecimal value
// ('g') encountered.

Buffer.from('1a7g', 'hex');
// Prints <Buffer 1a>, data truncated when data ends in single digit ('7').

Buffer.from('1634', 'hex');
// Prints <Buffer 16 34>, all data represented.
```

Modern Web browsers follow the [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/) which aliases both `'latin1'` and `'ISO-8859-1'` to `'win-1252'`. This means that while doing something like `http.get()`, if the returned charset is one of those listed in the WHATWG specification it is possible that the server actually returned `'win-1252'`-encoded data, and using `'latin1'` encoding may incorrectly decode the characters.

## Buffers and TypedArrays
<!-- YAML
changes:
  - version: v3.0.0
    pr-url: https://github.com/nodejs/node/pull/2002
    description: The `Buffer`s class now inherits from `Uint8Array`.
-->

`Buffer` instances are also [`Uint8Array`][] instances, which is the language’s built-in class for working with binary data. [`Uint8Array`][] in turn is a subclass of [`TypedArray`][]. Therefore, all [`TypedArray`][] methods are also available on `Buffer`s. However, there are subtle incompatibilities between the `Buffer` API and the [`TypedArray`][] API.

In particular:

* While [`TypedArray#slice()`][] creates a copy of part of the `TypedArray`, [`Buffer#slice()`][`buf.slice()`] creates a view over the existing `Buffer` without copying. This behavior can be surprising, and only exists for legacy compatibility. [`TypedArray#subarray()`][] can be used to achieve the behavior of [`Buffer#slice()`][`buf.slice()`] on both `Buffer`s and other `TypedArray`s.
* [`buf.toString()`][] is incompatible with its `TypedArray` equivalent.
* A number of methods, e.g. [`buf.indexOf()`][], support additional arguments.

There are two ways to create new [`TypedArray`][] instances from a `Buffer`.

When passing a `Buffer` to a [`TypedArray`][] constructor, the `Buffer`’s elements will be copied, interpreted as an array of integers, and not as a byte array of the target type. For example, `new Uint32Array(Buffer.from([1, 2, 3, 4]))` creates a 4-element [`Uint32Array`][] with elements `[1, 2, 3, 4]`, rather than a [`Uint32Array`][] with a single element `[0x1020304]` or `[0x4030201]`.

In order to create a [`TypedArray`][] that shares its memory with the `Buffer`, the underlying [`ArrayBuffer`][] can be passed to the [`TypedArray`][] constructor instead:

```js
const buf = Buffer.from('hello', 'utf16le');
const uint16arr = new Uint16Array(
  buf.buffer, buf.byteOffset, buf.length / Uint16Array.BYTES_PER_ELEMENT);
```

It is also possible to create a new `Buffer` that shares the same allocated memory as a [`TypedArray`][] instance by using the `TypedArray` object’s `.buffer` property in the same way. [`Buffer.from()`][`Buffer.from(arrayBuf)`] behaves like `new Uint8Array()` in this context.

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Copies the contents of `arr`.
const buf1 = Buffer.from(arr);
// Shares memory with `arr`.
const buf2 = Buffer.from(arr.buffer);

console.log(buf1);
// Prints: <Buffer 88 a0>
console.log(buf2);
// Prints: <Buffer 88 13 a0 0f>

arr[1] = 6000;

console.log(buf1);
// Prints: <Buffer 88 a0>
console.log(buf2);
// Prints: <Buffer 88 13 70 17>
```

When creating a `Buffer` using a [`TypedArray`][]'s `.buffer`, it is possible to use only a portion of the underlying [`ArrayBuffer`][] by passing in `byteOffset` and `length` parameters.

```js
const arr = new Uint16Array(20);
const buf = Buffer.from(arr.buffer, 0, 16);

console.log(buf.length);
// Print: 16
```

The `Buffer.from()` and [`TypedArray.from()`][] have different signatures and implementations. Specifically, the [`TypedArray`][] variants accept a second argument that is a mapping function that is invoked on every element of the typed array:

* `TypedArray.from(source[, mapFn[, thisArg]])`

De `Buffer.from()` methode zal echter het gebruik van de karteringsfunctie niet ondersteunen:

* [`Buffer.from(array)`][]
* [`Buffer.from(buffer)`][]
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`]
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`]

## Buffers en herhaling

`Buffer` instanties kunnen worden herhaald over het gebruik van de `for..of` syntax:

```js
const buf = Buffer.from([1, 2, 3]);

for (const b of buf) {
  console.log(b);
}
// Prints:
//   1
//   2
//   3
```

Additionally, the [`buf.values()`][], [`buf.keys()`][], and [`buf.entries()`][] methods can be used to create iterators.

## Class: `Buffer`

De `Buffer` class is een globaal type voor het direct omgaan met binary data. Het kan worden opgebouwd op een aantal manieren.

### Class Method: `Buffer.alloc(size[, fill[, encoding]])`
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
* `fill` {string|Buffer|Uint8Array|integer} A value to pre-fill the new `Buffer` with. **Default:** `0`.
* `encoding` {string} Als `fill` een string is, is dit de bijbehorende codering. **Default:** `'utf8'`.

Kent een nieuwe `Buffer` van `size` bytes toe. If `fill` is `undefined`, the `Buffer` will be zero-filled.

```js
const buf = Buffer.alloc(5);

console.log(buf);
// Print: <Buffer 00 00 00 00 00>
```

If `size` is larger than [`buffer.constants.MAX_LENGTH`][] or smaller than 0, [`ERR_INVALID_OPT_VALUE`][] is thrown.

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

Calling [`Buffer.alloc()`][] can be measurably slower than the alternative [`Buffer.allocUnsafe()`][] but ensures that the newly created `Buffer` instance contents will never contain sensitive data from previous allocations, including data that might not have been allocated for `Buffer`s.

Een `TypeError` zal worden geworpen als `size` geen nummer is.

### Class Method: `Buffer.allocUnsafe(size)`
<!-- YAML
added: v5.10.0
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7079
    description: Passing a negative `size` will now throw an error.
-->

* `size` {integer} De gewenste lengte van de nieuwe `Buffer`.

Kent een nieuwe `Buffer` van `size` bytes toe. If `size` is larger than [`buffer.constants.MAX_LENGTH`][] or smaller than 0, [`ERR_INVALID_OPT_VALUE`][] is thrown.

The underlying memory for `Buffer` instances created in this way is *not initialized*. The contents of the newly created `Buffer` are unknown and *may contain sensitive data*. Use [`Buffer.alloc()`][] instead to initialize `Buffer` instances with zeroes.

```js
const buf = Buffer.allocUnsafe(10);

console.log(buf);
// Prints (contents may vary): <Buffer a0 8b 28 3f 01 00 00 00 50 32>

buf.fill(0);

console.log(buf);
// Prints: <Buffer 00 00 00 00 00 00 00 00 00 00>
```

Een `TypeError` zal worden geworpen als `size` geen nummer is.

The `Buffer` module pre-allocates an internal `Buffer` instance of size [`Buffer.poolSize`][] that is used as a pool for the fast allocation of new `Buffer` instances created using [`Buffer.allocUnsafe()`][] and the deprecated `new Buffer(size)` constructor only when `size` is less than or equal to `Buffer.poolSize >> 1` (floor of [`Buffer.poolSize`][] divided by two).

Het gebruik van deze vooraf toegekende interne geheugen pool is een belangrijk verschil tussen het aanroepen van `Buffer.alloc(size, fill)` vs. `Buffer.allocUnsafe(size).fill(fill)`. Specifically, `Buffer.alloc(size, fill)` will *never* use the internal `Buffer` pool, while `Buffer.allocUnsafe(size).fill(fill)` *will* use the internal `Buffer` pool if `size` is less than or equal to half [`Buffer.poolSize`][]. The difference is subtle but can be important when an application requires the additional performance that [`Buffer.allocUnsafe()`][] provides.

### Class Method: `Buffer.allocUnsafeSlow(size)`
<!-- YAML
added: v5.12.0
-->

* `size` {integer} De gewenste lengte van de nieuwe `Buffer`.

Kent een nieuwe `Buffer` van `size` bytes toe. If `size` is larger than [`buffer.constants.MAX_LENGTH`][] or smaller than 0, [`ERR_INVALID_OPT_VALUE`][] is thrown. Een nul-lengte `Buffer` wordt gecreëerd als de `size` 0 is.

The underlying memory for `Buffer` instances created in this way is *not initialized*. The contents of the newly created `Buffer` are unknown and *may contain sensitive data*. Use [`buf.fill(0)`][`buf.fill()`] to initialize such `Buffer` instances with zeroes.

When using [`Buffer.allocUnsafe()`][] to allocate new `Buffer` instances, allocations under 4KB are sliced from a single pre-allocated `Buffer`. This allows applications to avoid the garbage collection overhead of creating many individually allocated `Buffer` instances. This approach improves both performance and memory usage by eliminating the need to track and clean up as many individual `ArrayBuffer` objects.

However, in the case where a developer may need to retain a small chunk of memory from a pool for an indeterminate amount of time, it may be appropriate to create an un-pooled `Buffer` instance using `Buffer.allocUnsafeSlow()` and then copying out the relevant bits.

```js
// Need to keep around a few small chunks of memory.
const store = [];

socket.on('readable', () => {
  let data;
  while (null !== (data = readable.read())) {
    // Allocate for retained data.
    const sb = Buffer.allocUnsafeSlow(10);

    // Copy the data into the new allocation.
    data.copy(sb, 0, 0, 10);

    store.push(sb);
  }
});
```

Een `TypeError` zal worden geworpen als `size` geen nummer is.

### Class Method: `Buffer.byteLength(string[, encoding])`
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
* `encoding` {string} Als `string` een string is, is dit de bijbehorende codering. **Default:** `'utf8'`.
* Retourneert: {integer} Het aantal bytes in `string`.

Returns the byte length of a string when encoded using `encoding`. This is not the same as [`String.prototype.length`][], which does not account for the encoding that is used to convert the string into bytes.

Voor `'base64'` en `'hex'`, gaat deze functie uit van een geldige invoer. For strings that contain non-base64/hex-encoded data (e.g. whitespace), the return value might be greater than the length of a `Buffer` created from the string.

```js
const str = '\u00bd + \u00bc = \u00be';

console.log(`${str}: ${str.length} characters, ` +
            `${Buffer.byteLength(str, 'utf8')} bytes`);
// Print: ½ + ¼ = ¾: 9 tekens, 12 bytes
```

When `string` is a `Buffer`/[`DataView`][]/[`TypedArray`][]/[`ArrayBuffer`][]/ [`SharedArrayBuffer`][], the byte length as reported by `.byteLength` is returned.

### Class Method: `Buffer.compare(buf1, buf2)`
<!-- YAML
added: v0.11.13
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The arguments can now be `Uint8Array`s.
-->

* `buf1` {Buffer|Uint8Array}
* `buf2` {Buffer|Uint8Array}
* Returns: {integer} Either `-1`, `0`, or `1`, depending on the result of the comparison. See [`buf.compare()`][] for details.

Compares `buf1` to `buf2`, typically for the purpose of sorting arrays of `Buffer` instances. Dit is gelijk aan het aanroepen van [`buf1.compare(buf2)`][`buf.compare()`].

```js
const buf1 = Buffer.from('1234');
const buf2 = Buffer.from('0123');
const arr = [buf1, buf2];

console.log(arr.sort(Buffer.compare));
// Prints: [ <Buffer 30 31 32 33>, <Buffer 31 32 33 34> ]
// (This result is equal to: [buf2, buf1].)
```

### Class Method: `Buffer.concat(list[, totalLength])`
<!-- YAML
added: v0.7.11
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The elements of `list` can now be `Uint8Array`s.
-->

* `list` {Buffer[] | Uint8Array[]} List of `Buffer` or [`Uint8Array`][] instances to concatenate.
* `totalLength` {integer} Totale lengte van de `Buffer` instanties in de `list` wanneer ze zijn samengevoegd.
* Retourneert: {Buffer}

Retourneert een nieuwe `Buffer` die het resultaat is van het samenvoegen van alle `Buffer` instanties samen in de `list`.

Als de lijst geen items heeft, of als de `totalLength` 0 is, wordt een `Buffer` met een nul-lengte geretourneerd.

If `totalLength` is not provided, it is calculated from the `Buffer` instances in `list` by adding their lengths.

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

### Class Method: `Buffer.from(array)`
<!-- YAML
added: v5.10.0
-->

* `array` {integer[]}

Allocates a new `Buffer` using an `array` of bytes in the range `0` – `255`. Array entries outside that range will be truncated to fit into it.

```js
// Creates a new Buffer containing the UTF-8 bytes of the string 'buffer'.
const buf = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
```

A `TypeError` will be thrown if `array` is not an `Array` or other type appropriate for `Buffer.from()` variants.

### Class Method: `Buffer.from(arrayBuffer[, byteOffset[, length]])`
<!-- YAML
added: v5.10.0
-->

* `arrayBuffer` {ArrayBuffer|SharedArrayBuffer} An [`ArrayBuffer`][], [`SharedArrayBuffer`][], for example the `.buffer` property of a [`TypedArray`][].
* `byteOffset` {integer} Index van de eerste te onthullen byte. **Default:** `0`.
* `length` {integer} Aantal te onthullen bytes. **Default:** `arrayBuffer.byteLength - byteOffset`.

This creates a view of the [`ArrayBuffer`][] without copying the underlying memory. For example, when passed a reference to the `.buffer` property of a [`TypedArray`][] instance, the newly created `Buffer` will share the same allocated memory as the [`TypedArray`][].

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Shares memory with `arr`.
const buf = Buffer.from(arr.buffer);

console.log(buf);
// Prints: <Buffer 88 13 a0 0f>

// Changing the original Uint16Array changes the Buffer also.
arr[1] = 6000;

console.log(buf);
// Prints: <Buffer 88 13 70 17>
```

De optionele `byteOffset` en `length` argumenten specificeren een geheugenbereik vanuit de `arrayBuffer` die zal worden gedeeld met de `Buffer`.

```js
const ab = new ArrayBuffer(10);
const buf = Buffer.from(ab, 0, 2);

console.log(buf.length);
// Print: 2
```

A `TypeError` will be thrown if `arrayBuffer` is not an [`ArrayBuffer`][] or a [`SharedArrayBuffer`][] or other type appropriate for `Buffer.from()` variants.

### Class Method: `Buffer.from(buffer)`
<!-- YAML
added: v5.10.0
-->

* `buffer` {Buffer|Uint8Array} An existing `Buffer` or [`Uint8Array`][] from which to copy data.

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

A `TypeError` will be thrown if `buffer` is not a `Buffer` or other type appropriate for `Buffer.from()` variants.

### Class Method: `Buffer.from(object[, offsetOrEncoding[, length]])`
<!-- YAML
added: v8.2.0
-->

* `object` {Object} An object supporting `Symbol.toPrimitive` or `valueOf()`.
* `offsetOrEncoding` {integer|string} A byte-offset or encoding, depending on the value returned either by `object.valueOf()` or `object[Symbol.toPrimitive]()`.
* `length` {integer} A length, depending on the value returned either by `object.valueOf()` or `object[Symbol.toPrimitive]()`.

For objects whose `valueOf()` function returns a value not strictly equal to `object`, returns `Buffer.from(object.valueOf(), offsetOrEncoding, length)`.

```js
const buf = Buffer.from(new String('dit is een test'));
// Print: <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

For objects that support `Symbol.toPrimitive`, returns `Buffer.from(object[Symbol.toPrimitive](), offsetOrEncoding, length)`.

```js
class Foo {
  [Symbol.toPrimitive]() {
    retourneert 'dit is een test';
  }
}

const buf = Buffer.from(new Foo(), 'utf8');
// Print: <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

A `TypeError` will be thrown if `object` has not mentioned methods or is not of other type appropriate for `Buffer.from()` variants.

### Class Method: `Buffer.from(string[, encoding])`
<!-- YAML
added: v5.10.0
-->

* `string` {string} Een string om te coderen.
* `encoding` {string} De codering van `string`. **Default:** `'utf8'`.

Creëert een nieuwe `Buffer` die een `string` bevat. The `encoding` parameter identifies the character encoding to be used when converting `string` into bytes.

```js
const buf1 = Buffer.from('this is a tést');
const buf2 = Buffer.from('7468697320697320612074c3a97374', 'hex');

console.log(buf1.toString());
// Prints: this is a tést
console.log(buf2.toString());
// Prints: this is a tést
console.log(buf1.toString('latin1'));
// Prints: this is a tÃ©st
```

A `TypeError` will be thrown if `string` is not a string or other type appropriate for `Buffer.from()` variants.

### Class Method: `Buffer.isBuffer(obj)`
<!-- YAML
added: v0.1.101
-->

* `obj` {Object}
* Retourneert: {boolean}

Retourneert `true` als `obj` een `Buffer` is, en anders `false`.

### Class Method: `Buffer.isEncoding(encoding)`
<!-- YAML
added: v0.9.1
-->

* `encoding` {string} Een na te kijken coderingsnaam van een teken.
* Retourneert: {boolean}

Returns `true` if `encoding` is the name of a supported character encoding, or `false` otherwise.

```js
console.log(Buffer.isEncoding('utf-8'));
// Prints: true

console.log(Buffer.isEncoding('hex'));
// Prints: true

console.log(Buffer.isEncoding('utf/8'));
// Prints: false

console.log(Buffer.isEncoding(''));
// Prints: false
```

### Class Property: `Buffer.poolSize`
<!-- YAML
added: v0.11.3
-->

* {integer} **Default:** `8192`

This is the size (in bytes) of pre-allocated internal `Buffer` instances used for pooling. Deze waarde mag worden aangepast.

### `buf[index]`
<!-- YAML
type: property
name: [index]
-->

* `index` {integer}

De index operator `[index]` kan worden gebruikt om een octet in de positie `index` in `buf` te krijgen en in te stellen. De waarden verwijzen naar individuele bytes, dus het legale waardebereik zit tussen `0x00` en `0xFF` (hex) of `0` en `255` (decimaal).

This operator is inherited from `Uint8Array`, so its behavior on out-of-bounds access is the same as `Uint8Array`. In other words, `buf[index]` returns `undefined` when `index` is negative or `>= buf.length`, and `buf[index] = value` does not modify the buffer if `index` is negative or `>= buf.length`.

```js
// Kopieer een ASCII string in een `Buffer` een byte tegelijk.
// (This only works for ASCII-only strings. In general, one should use
// `Buffer.from()` to perform this conversion.)

const str = 'Node.js';
const buf = Buffer.allocUnsafe(str.length);

for (let i = 0; i < str.length; i++) {
  buf[i] = str.charCodeAt(i);
}

console.log(buf.toString('utf8'));
// Prints: Node.js
```

### `buf.buffer`

* {ArrayBuffer} The underlying `ArrayBuffer` object based on which this `Buffer` object is created.

This `ArrayBuffer` is not guaranteed to correspond exactly to the original `Buffer`. See the notes on `buf.byteOffset` for details.

```js
const arrayBuffer = new ArrayBuffer(16);
const buffer = Buffer.from(arrayBuffer);

console.log(buffer.buffer === arrayBuffer);
// Print: true
```

### `buf.byteOffset`

* {integer} The `byteOffset` on the underlying `ArrayBuffer` object based on which this `Buffer` object is created.

When setting `byteOffset` in `Buffer.from(ArrayBuffer, byteOffset, length)`, or sometimes when allocating a buffer smaller than `Buffer.poolSize`, the buffer doesn't start from a zero offset on the underlying `ArrayBuffer`.

This can cause problems when accessing the underlying `ArrayBuffer` directly using `buf.buffer`, as other parts of the `ArrayBuffer` may be unrelated to the `buf` object itself.

A common issue when creating a `TypedArray` object that shares its memory with a `Buffer` is that in this case one needs to specify the `byteOffset` correctly:

```js
// Create a buffer smaller than `Buffer.poolSize`.
const nodeBuffer = new Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

// When casting the Node.js Buffer to an Int8Array, use the byteOffset
// to refer only to the part of `nodeBuffer.buffer` that contains the memory
// for `nodeBuffer`.
new Int8Array(nodeBuffer.buffer, nodeBuffer.byteOffset, nodeBuffer.length);
```

### `buf.compare(target[, targetStart[, targetEnd[, sourceStart[, sourceEnd]]]])`
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

* `target` {Buffer|Uint8Array} A `Buffer` or [`Uint8Array`][] with which to compare `buf`.
* `targetStart` {integer} De offset binnen `target` waar vergelijking moet beginnen. **Default:** `0`.
* `targetEnd` {integer} The offset within `target` at which to end comparison (not inclusive). **Default:** `target.length`.
* `sourceStart` {integer} De offset binnen `buf` waar vergelijking moet beginnen. **Default:** `0`.
* `sourceEnd` {integer} De offset binnen `buf` waar vergelijking moet eindigen (niet inclusief). **Default:** [`buf.length`][].
* Retourneert: {integer}

Vergelijkt `buf` met `target` en retourneert een nummer dat aangeeft of `buf` vóór of na komt, of hetzelfde is als `target` in de sorteer orde. Vergelijking is gebaseerd op de werkelijke volgorde van bytes in elke `Buffer`.

* `0` wordt geretourneerd als het `target` hetzelfde is als `buf`
* `1` is returned if `target` should come *before* `buf` when sorted.
* `-1` is returned if `target` should come *after* `buf` when sorted.

```js
const buf1 = Buffer.from('ABC');
const buf2 = Buffer.from('BCD');
const buf3 = Buffer.from('ABCD');

console.log(buf1.compare(buf1));
// Prints: 0
console.log(buf1.compare(buf2));
// Prints: -1
console.log(buf1.compare(buf3));
// Prints: -1
console.log(buf2.compare(buf1));
// Prints: 1
console.log(buf2.compare(buf3));
// Prints: 1
console.log([buf1, buf2, buf3].sort(Buffer.compare));
// Prints: [ <Buffer 41 42 43>, <Buffer 41 42 43 44>, <Buffer 42 43 44> ]
// (This result is equal to: [buf1, buf3, buf2].)
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

[`ERR_OUT_OF_RANGE`][] is thrown if `targetStart < 0`, `sourceStart < 0`, `targetEnd > target.byteLength`, or `sourceEnd > source.byteLength`.

### `buf.copy(target[, targetStart[, sourceStart[, sourceEnd]]])`
<!-- YAML
added: v0.1.90
-->

* `target` {Buffer|Uint8Array} A `Buffer` or [`Uint8Array`][] to copy into.
* `targetStart` {integer} The offset within `target` at which to begin writing. **Default:** `0`.
* `sourceStart` {integer} De offset binnen `buf` waar het kopiëren moet beginnen. **Default:** `0`.
* `sourceEnd` {integer} De offset binnen `buf` waar het kopiëren moet eindigen (niet inclusief). **Default:** [`buf.length`][].
* Retourneert: {integer} Het aantal gekopieerde bytes.

Copies data from a region of `buf` to a region in `target`, even if the `target` memory region overlaps with `buf`.

[`TypedArray#set()`][] performs the same operation, and is available for all TypedArrays, including Node.js `Buffer`s, although it takes different function arguments.

```js
// Twee `Buffer` instanties creëren.
const buf1 = Buffer.allocUnsafe(26);
const buf2 = Buffer.allocUnsafe(26).fill('!');

for (let i = 0; i < 26; i++) {
  // 97 is the decimal ASCII value for 'a'.
  buf1[i] = i + 97;
}

// Copy `buf1` bytes 16 through 19 into `buf2` starting at byte 8 of `buf2`.
buf1.copy(buf2, 8, 16, 20);
// This is equivalent to:
// buf2.set(buf1.subarray(16, 20), 8);

console.log(buf2.toString('ascii', 0, 25));
// Prints: !!!!!!!!qrst!!!!!!!!!!!!!
```

```js
// Creëer een `Buffer`en kopieer data van een regio naar een overlappende regio
// binnen dezelfde `Buffer`.

const buf = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 is the decimal ASCII value for 'a'.
  buf[i] = i + 97;
}

buf.copy(buf, 0, 4, 10);

console.log(buf.toString());
// Prints: efghijghijklmnopqrstuvwxyz
```

### `buf.entries()`
<!-- YAML
added: v1.1.0
-->

* Retourneert: {Iterator}

Creates and returns an [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) of `[index, byte]` pairs from the contents of `buf`.

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

### `buf.equals(otherBuffer)`
<!-- YAML
added: v0.11.13
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The arguments can now be `Uint8Array`s.
-->

* `otherBuffer` {Buffer|Uint8Array} A `Buffer` or [`Uint8Array`][] with which to compare `buf`.
* Retourneert: {boolean}

Retourneert `true` als zowel `buf` en `otherBuffer` precies hetzelfde aantal bytes hebben, in andere gevallen `false`. Equivalent to [`buf.compare(otherBuffer) === 0`][`buf.compare()`].

```js
const buf1 = Buffer.from('ABC');
const buf2 = Buffer.from('414243', 'hex');
const buf3 = Buffer.from('ABCD');

console.log(buf1.equals(buf2));
// Print: true
console.log(buf1.equals(buf3));
// Print: false
```

### `buf.fill(value[, offset[, end]][, encoding])`
<!-- YAML
added: v0.5.0
changes:
  - version: v11.0.0
    pr-url: https://github.com/nodejs/node/pull/22969
    description: Throws `ERR_OUT_OF_RANGE` instead of `ERR_INDEX_OUT_OF_RANGE`.
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

* `value` {string|Buffer|Uint8Array|integer} The value with which to fill `buf`.
* `offset` {integer} Het aantal bytes over te slaan voordat men begint met het vullen van `buf`. **Default:** `0`.
* `end` {integer} De plaats waar men moet stoppen met het vullen van `buf` (niet inclusief). **Default:** [`buf.length`][].
* `encoding` {string} De codering voor `value` als `value` een string is. **Default:** `'utf8'`.
* Retourneert: {Buffer} Een referentie naar `buf`.

Vult `buf` met de opgegeven `value`. If the `offset` and `end` are not given, the entire `buf` will be filled:

```js
// Vul een `Buffer` met het ASCII teken 'h'.

const b = Buffer.allocUnsafe(50).fill('h');

console.log(b.toString());
// Print: hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
```

`value` is coerced to a `uint32` value if it is not a string, `Buffer`, or integer. If the resulting integer is greater than `255` (decimal), `buf` will be filled with `value & 255`.

If the final write of a `fill()` operation falls on a multi-byte character, then only the bytes of that character that fit into `buf` are written:

```js
// Fill a `Buffer` with character that takes up two bytes in UTF-8.

console.log(Buffer.allocUnsafe(5).fill('\u0222'));
// Prints: <Buffer c8 a2 c8 a2 c8>
```

If `value` contains invalid characters, it is truncated; if no valid fill data remains, an exception is thrown:

```js
const buf = Buffer.allocUnsafe(5);

console.log(buf.fill('a'));
// Prints: <Buffer 61 61 61 61 61>
console.log(buf.fill('aazz', 'hex'));
// Prints: <Buffer aa aa aa aa aa>
console.log(buf.fill('zz', 'hex'));
// Werpt een uitzondering.
```

### `buf.includes(value[, byteOffset][, encoding])`
<!-- YAML
added: v5.3.0
-->

* `value` {string|Buffer|Uint8Array|integer} Waarnaar gezocht moet worden.
* `byteOffset` {integer} Waar men moet beginnen met zoeken in `buf`. If negative, then offset is calculated from the end of `buf`. **Default:** `0`.
* `encoding` {string} Als `value` een string is, dan is dit de bijbehorende codering. **Default:** `'utf8'`.
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

### `buf.indexOf(value[, byteOffset][, encoding])`
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
* `byteOffset` {integer} Waar men moet beginnen met zoeken in `buf`. If negative, then offset is calculated from the end of `buf`. **Default:** `0`.
* `encoding` {string} If `value` is a string, this is the encoding used to determine the binary representation of the string that will be searched for in `buf`. **Default:** `'utf8'`.
* Returns: {integer} The index of the first occurrence of `value` in `buf`, or `-1` if `buf` does not contain `value`.

Als de `value` is:

* een string, `value` wordt geïnterpreteerd in overeenstemming met de tekencodering in `encoding`.
* a `Buffer` or [`Uint8Array`][], `value` will be used in its entirety. To compare a partial `Buffer`, use [`buf.slice()`][].
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

Als `byteOffset` geen nummer is, zal het worden gedwongen naar een nummer. If the result of coercion is `NaN` or `0`, then the entire buffer will be searched. This behavior matches [`String#indexOf()`][].

```js
const b = Buffer.from('abcdef');

// Passing a value that's a number, but not a valid byte.
// Prints: 2, equivalent to searching for 99 or 'c'.
console.log(b.indexOf(99.9));
console.log(b.indexOf(256 + 99));

// Passing a byteOffset that coerces to NaN or 0.
// Prints: 1, searching the whole buffer.
console.log(b.indexOf('b', undefined));
console.log(b.indexOf('b', {}));
console.log(b.indexOf('b', null));
console.log(b.indexOf('b', []));
```

If `value` is an empty string or empty `Buffer` and `byteOffset` is less than `buf.length`, `byteOffset` will be returned. If `value` is empty and `byteOffset` is at least `buf.length`, `buf.length` will be returned.

### `buf.keys()`
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

### `buf.lastIndexOf(value[, byteOffset][, encoding])`
<!-- YAML
added: v6.0.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `value` can now be a `Uint8Array`.
-->

* `value` {string|Buffer|Uint8Array|integer} Waarnaar gezocht moet worden.
* `byteOffset` {integer} Waar men moet beginnen met zoeken in `buf`. If negative, then offset is calculated from the end of `buf`. **Default:** `buf.length - 1`.
* `encoding` {string} If `value` is a string, this is the encoding used to determine the binary representation of the string that will be searched for in `buf`. **Default:** `'utf8'`.
* Returns: {integer} The index of the last occurrence of `value` in `buf`, or `-1` if `buf` does not contain `value`.

Identical to [`buf.indexOf()`][], except the last occurrence of `value` is found rather than the first occurrence.

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

Als `byteOffset` geen nummer is, zal het worden gedwongen naar een nummer. Alle argumenten die dwingen naar `NaN`, zoals `{}` of `undefined`, zullen de gehele buffer doorzoeken. This behavior matches [`String#lastIndexOf()`][].

```js
const b = Buffer.from('abcdef');

// Passing a value that's a number, but not a valid byte.
// Prints: 2, equivalent to searching for 99 or 'c'.
console.log(b.lastIndexOf(99.9));
console.log(b.lastIndexOf(256 + 99));

// Passing a byteOffset that coerces to NaN.
// Prints: 1, searching the whole buffer.
console.log(b.lastIndexOf('b', undefined));
console.log(b.lastIndexOf('b', {}));

// Passing a byteOffset that coerces to 0.
// Prints: -1, equivalent to passing 0.
console.log(b.lastIndexOf('b', null));
console.log(b.lastIndexOf('b', []));
```

Als de `value` een lege string is of een lege `Buffer`, zal `byteOffset` worden geretourneerd.

### `buf.length`
<!-- YAML
added: v0.1.90
-->

* {integer}

Returns the number of bytes in `buf`.

```js
// Create a `Buffer` and write a shorter string to it using UTF-8.

const buf = Buffer.alloc(1234);

console.log(buf.length);
// Prints: 1234

buf.write('some string', 0, 'utf8');

console.log(buf.length);
// Prints: 1234
```

### `buf.parent`
<!-- YAML
deprecated: v8.0.0
-->

> Stability: 0 - Deprecated: Use [`buf.buffer`][] instead.

De `buf.parent` eigenschap is een afgekeurde alias voor `buf.buffer`.

### `buf.readBigInt64BE([offset])`
### `buf.readBigInt64LE([offset])`
<!-- YAML
added: v12.0.0
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Must satisfy: `0 <= offset <= buf.length - 8`. **Default:** `0`.
* Retourneert: {bigint}

Reads a signed 64-bit integer from `buf` at the specified `offset` with the specified [endianness](https://en.wikipedia.org/wiki/Endianness) (`readBigInt64BE()` reads as big endian, `readBigInt64LE()` reads as little endian).

Gehele getallen gelezen van een `Buffer` worden geïnterpreteerd als aanvullende ondertekende waarden van twee.

### `buf.readBigUInt64BE([offset])`
### `buf.readBigUInt64LE([offset])`
<!-- YAML
added: v12.0.0
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Must satisfy: `0 <= offset <= buf.length - 8`. **Default:** `0`.
* Retourneert: {bigint}

Reads an unsigned 64-bit integer from `buf` at the specified `offset` with the specified [endianness](https://en.wikipedia.org/wiki/Endianness) (`readBigUInt64BE()` reads as big endian, `readBigUInt64LE()` reads as little endian).

```js
const buf = Buffer.from([0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff]);

console.log(buf.readBigUInt64BE(0));
// Prints: 4294967295n

console.log(buf.readBigUInt64LE(0));
// Prints: 18446744069414584320n
```

### `buf.readDoubleBE([offset])`
### `buf.readDoubleLE([offset])`
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Must satisfy `0 <= offset <= buf.length - 8`. **Default:** `0`.
* Retourneert: {number}

Reads a 64-bit double from `buf` at the specified `offset` with the specified [endianness](https://en.wikipedia.org/wiki/Endianness) (`readDoubleBE()` reads as big endian, `readDoubleLE()` reads as little endian).

```js
const buf = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]);

console.log(buf.readDoubleBE(0));
// Prints: 8.20788039913184e-304
console.log(buf.readDoubleLE(0));
// Prints: 5.447603722011605e-270
console.log(buf.readDoubleLE(1));
// Throws ERR_OUT_OF_RANGE.
```

### `buf.readFloatBE([offset])`
### `buf.readFloatLE([offset])`
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Must satisfy `0 <= offset <= buf.length - 4`. **Default:** `0`.
* Retourneert: {number}

Reads a 32-bit float from `buf` at the specified `offset` with the specified [endianness](https://en.wikipedia.org/wiki/Endianness) (`readFloatBE()` reads as big endian, `readFloatLE()` reads as little endian).

```js
const buf = Buffer.from([1, 2, 3, 4]);

console.log(buf.readFloatBE(0));
// Prints: 2.387939260590663e-38
console.log(buf.readFloatLE(0));
// Prints: 1.539989614439558e-36
console.log(buf.readFloatLE(1));
// Throws ERR_OUT_OF_RANGE.
```

### `buf.readInt8([offset])`
<!-- YAML
added: v0.5.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Must satisfy `0 <= offset <= buf.length - 1`. **Default:** `0`.
* Retourneert: {integer}

Leest een ondertekend geheel 8-bit getal van `buf` op de gespecificeerde `offset`.

Gehele getallen gelezen van een `Buffer` worden geïnterpreteerd als aanvullende ondertekende waarden van twee.

```js
const buf = Buffer.from([-1, 5]);

console.log(buf.readInt8(0));
// Prints: -1
console.log(buf.readInt8(1));
// Prints: 5
console.log(buf.readInt8(2));
// Throws ERR_OUT_OF_RANGE.
```

### `buf.readInt16BE([offset])`
### `buf.readInt16LE([offset])`
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Must satisfy `0 <= offset <= buf.length - 2`. **Default:** `0`.
* Retourneert: {integer}

Reads a signed 16-bit integer from `buf` at the specified `offset` with the specified [endianness](https://en.wikipedia.org/wiki/Endianness) (`readInt16BE()` reads as big endian, `readInt16LE()` reads as little endian).

Gehele getallen gelezen van een `Buffer` worden geïnterpreteerd als aanvullende ondertekende waarden van twee.

```js
const buf = Buffer.from([0, 5]);

console.log(buf.readInt16BE(0));
// Prints: 5
console.log(buf.readInt16LE(0));
// Prints: 1280
console.log(buf.readInt16LE(1));
// Throws ERR_OUT_OF_RANGE.
```

### `buf.readInt32BE([offset])`
### `buf.readInt32LE([offset])`
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Must satisfy `0 <= offset <= buf.length - 4`. **Default:** `0`.
* Retourneert: {integer}

Reads a signed 32-bit integer from `buf` at the specified `offset` with the specified [endianness](https://en.wikipedia.org/wiki/Endianness) (`readInt32BE()` reads as big endian, `readInt32LE()` reads as little endian).

Gehele getallen gelezen van een `Buffer` worden geïnterpreteerd als aanvullende ondertekende waarden van twee.

```js
const buf = Buffer.from([0, 0, 0, 5]);

console.log(buf.readInt32BE(0));
// Prints: 5
console.log(buf.readInt32LE(0));
// Prints: 83886080
console.log(buf.readInt32LE(1));
// Throws ERR_OUT_OF_RANGE.
```

### `buf.readIntBE(offset, byteLength)`
### `buf.readIntLE(offset, byteLength)`
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 and `byteLength` to `uint32` anymore.
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Aantal te lezen bytes. Must satisfy `0 < byteLength <= 6`.
* Retourneert: {integer}

Leest `byteLength` aantal bytes van `buf` op de gespecificeerde `offset` en interpreteert het resultaat als een aanvullende getekende waarde van twee. Ondersteunt maximaal 48 bits nauwkeurigheid.

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab]);

console.log(buf.readIntLE(0, 6).toString(16));
// Prints: -546f87a9cbee
console.log(buf.readIntBE(0, 6).toString(16));
// Prints: 1234567890ab
console.log(buf.readIntBE(1, 6).toString(16));
// Throws ERR_OUT_OF_RANGE.
console.log(buf.readIntBE(1, 0).toString(16));
// Throws ERR_OUT_OF_RANGE.
```

### `buf.readUInt8([offset])`
<!-- YAML
added: v0.5.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Must satisfy `0 <= offset <= buf.length - 1`. **Default:** `0`.
* Retourneert: {integer}

Leest een niet-ondertekend geheel 8-bit getal van `buf` op de gespecificeerde `offset`.

```js
const buf = Buffer.from([1, -2]);

console.log(buf.readUInt8(0));
// Prints: 1
console.log(buf.readUInt8(1));
// Prints: 254
console.log(buf.readUInt8(2));
// Throws ERR_OUT_OF_RANGE.
```

### `buf.readUInt16BE([offset])`
### `buf.readUInt16LE([offset])`
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Must satisfy `0 <= offset <= buf.length - 2`. **Default:** `0`.
* Retourneert: {integer}

Reads an unsigned 16-bit integer from `buf` at the specified `offset` with the specified [endianness](https://en.wikipedia.org/wiki/Endianness) (`readUInt16BE()` reads as big endian, `readUInt16LE()` reads as little endian).

```js
const buf = Buffer.from([0x12, 0x34, 0x56]);

console.log(buf.readUInt16BE(0).toString(16));
// Prints: 1234
console.log(buf.readUInt16LE(0).toString(16));
// Prints: 3412
console.log(buf.readUInt16BE(1).toString(16));
// Prints: 3456
console.log(buf.readUInt16LE(1).toString(16));
// Prints: 5634
console.log(buf.readUInt16LE(2).toString(16));
// Throws ERR_OUT_OF_RANGE.
```

### `buf.readUInt32BE([offset])`
### `buf.readUInt32LE([offset])`
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Must satisfy `0 <= offset <= buf.length - 4`. **Default:** `0`.
* Retourneert: {integer}

Reads an unsigned 32-bit integer from `buf` at the specified `offset` with the specified [endianness](https://en.wikipedia.org/wiki/Endianness) (`readUInt32BE()` reads as big endian, `readUInt32LE()` reads as little endian).

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78]);

console.log(buf.readUInt32BE(0).toString(16));
// Prints: 12345678
console.log(buf.readUInt32LE(0).toString(16));
// Prints: 78563412
console.log(buf.readUInt32LE(1).toString(16));
// Throws ERR_OUT_OF_RANGE.
```

### `buf.readUIntBE(offset, byteLength)`
### `buf.readUIntLE(offset, byteLength)`
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 and `byteLength` to `uint32` anymore.
-->

* `offset` {integer} Aantal bytes over te slaan voor aanvang van het lezen. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Aantal te lezen bytes. Must satisfy `0 < byteLength <= 6`.
* Retourneert: {integer}

Leest `byteLength` aantal bytes van `buf` op de gespecificeerde `offset` en interpreteert het resultaat als een niet-ondertekend geheel getal. Ondersteunt maximaal 48 bits nauwkeurigheid.

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab]);

console.log(buf.readUIntBE(0, 6).toString(16));
// Prints: 1234567890ab
console.log(buf.readUIntLE(0, 6).toString(16));
// Prints: ab9078563412
console.log(buf.readUIntBE(1, 6).toString(16));
// Throws ERR_OUT_OF_RANGE.
```

### `buf.subarray([start[, end]])`
<!-- YAML
added: v3.0.0
-->

* `start` {integer} Waar de nieuwe `Buffer` zal beginnen. **Default:** `0`.
* `end` {integer} Waar de nieuwe `Buffer` zal eindigen (niet inclusief). **Default:** [`buf.length`][].
* Retourneert: {Buffer}

Retourneert een nieuwe `Buffer` die verwijst naar hetzelfde geheugen als het origineel, maar offset en bijgesneden door de `start` en `end` van indexcijfers.

Specifying `end` greater than [`buf.length`][] will return the same result as that of `end` equal to [`buf.length`][].

This method is inherited from [`TypedArray#subarray()`][].

Modifying the new `Buffer` slice will modify the memory in the original `Buffer` because the allocated memory of the two objects overlap.

```js
// Creëer een `Buffer` met het ASCII-alfabet, neem een slice, en wijzig één byte
// van de originele `Buffer`.

const buf1 = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 is the decimal ASCII value for 'a'.
  buf1[i] = i + 97;
}

const buf2 = buf1.subarray(0, 3);

console.log(buf2.toString('ascii', 0, buf2.length));
// Prints: abc

buf1[0] = 33;

console.log(buf2.toString('ascii', 0, buf2.length));
// Prints: !bc
```

Het specificeren van negatieve indexen, zorgt ervoor dat de slice wordt gegenereerd relatief aan het einde van `buf` in plaats van aan het begin.

```js
const buf = Buffer.from('buffer');

console.log(buf.subarray(-6, -1).toString());
// Prints: buffe
// (Equivalent to buf.subarray(0, 5).)

console.log(buf.subarray(-6, -2).toString());
// Prints: buff
// (Equivalent to buf.subarray(0, 4).)

console.log(buf.subarray(-5, -2).toString());
// Prints: uff
// (Equivalent to buf.subarray(1, 4).)
```

### `buf.slice([start[, end]])`
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
* `end` {integer} Waar de nieuwe `Buffer` zal eindigen (niet inclusief). **Default:** [`buf.length`][].
* Retourneert: {Buffer}

Retourneert een nieuwe `Buffer` die verwijst naar hetzelfde geheugen als het origineel, maar offset en bijgesneden door de `start` en `end` van indexcijfers.

This is the same behavior as `buf.subarray()`.

This method is not compatible with the `Uint8Array.prototype.slice()`, which is a superclass of `Buffer`. To copy the slice, use `Uint8Array.prototype.slice()`.

```js
const buf = Buffer.from('buffer');

const copiedBuf = Uint8Array.prototype.slice.call(buf);
copiedBuf[0]++;
console.log(copiedBuf.toString());
// Prints: cuffer

console.log(buf.toString());
// Prints: buffer
```

### `buf.swap16()`
<!-- YAML
added: v5.10.0
-->

* Retourneert: {Buffer} Een referentie naar `buf`.

Interprets `buf` as an array of unsigned 16-bit integers and swaps the byte order *in-place*. Throws [`ERR_INVALID_BUFFER_SIZE`][] if [`buf.length`][] is not a multiple of 2.

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

console.log(buf1);
// Prints: <Buffer 01 02 03 04 05 06 07 08>

buf1.swap16();

console.log(buf1);
// Prints: <Buffer 02 01 04 03 06 05 08 07>

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

buf2.swap16();
// Throws ERR_INVALID_BUFFER_SIZE.
```

One convenient use of `buf.swap16()` is to perform a fast in-place conversion between UTF-16 little-endian and UTF-16 big-endian:

```js
const buf = Buffer.from('This is little-endian UTF-16', 'utf16le');
buf.swap16(); // Convert to big-endian UTF-16 text.
```

### `buf.swap32()`
<!-- YAML
added: v5.10.0
-->

* Retourneert: {Buffer} Een referentie naar `buf`.

Interprets `buf` as an array of unsigned 32-bit integers and swaps the byte order *in-place*. Throws [`ERR_INVALID_BUFFER_SIZE`][] if [`buf.length`][] is not a multiple of 4.

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

console.log(buf1);
// Prints: <Buffer 01 02 03 04 05 06 07 08>

buf1.swap32();

console.log(buf1);
// Prints: <Buffer 04 03 02 01 08 07 06 05>

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

buf2.swap32();
// Throws ERR_INVALID_BUFFER_SIZE.
```

### `buf.swap64()`
<!-- YAML
added: v6.3.0
-->

* Retourneert: {Buffer} Een referentie naar `buf`.

Interprets `buf` as an array of 64-bit numbers and swaps byte order *in-place*. Throws [`ERR_INVALID_BUFFER_SIZE`][] if [`buf.length`][] is not a multiple of 8.

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

console.log(buf1);
// Prints: <Buffer 01 02 03 04 05 06 07 08>

buf1.swap64();

console.log(buf1);
// Prints: <Buffer 08 07 06 05 04 03 02 01>

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

buf2.swap64();
// Throws ERR_INVALID_BUFFER_SIZE.
```

### `buf.toJSON()`
<!-- YAML
added: v0.9.2
-->

* Retourneert: {Object}

Retourneert een JSON representatie van `buf`. [`JSON.stringify()`][] implicitly calls this function when stringifying a `Buffer` instance.

`Buffer.from()` accepts objects in the format returned from this method. In particular, `Buffer.from(buf.toJSON())` works like `Buffer.from(buf)`.

```js
const buf = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5]);
const json = JSON.stringify(buf);

console.log(json);
// Print: {"type":"Buffer","data":[1,2,3,4,5]}

const copy = JSON.parse(json, (key, value) => {
  return value && value.type === 'Buffer' ?
    Buffer.from(value) :
    value;
});

console.log(copy);
// Prints: <Buffer 01 02 03 04 05>
```

### `buf.toString([encoding[, start[, end]]])`
<!-- YAML
added: v0.1.90
-->

* `encoding` {string} De te gebruiken teken-codering. **Default:** `'utf8'`.
* `start` {integer} De byte offset waar decoderen moet beginnen. **Default:** `0`.
* `end` {integer} De byte offset waar decodering moet stoppen (niet inclusief). **Default:** [`buf.length`][].
* Retourneert: {string}

Decodeert `buf` naar een string volgens de gespecificeerde teken-codering in `encoding`. `start` en `end` kunnen worden doorgegeven om alleen een subset van `buf` te coderen.

If `encoding` is `'utf8'` and a byte sequence in the input is not valid UTF-8, then each invalid byte is replaced with the replacement character `U+FFFD`.

The maximum length of a string instance (in UTF-16 code units) is available as [`buffer.constants.MAX_STRING_LENGTH`][].

```js
const buf1 = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 is the decimal ASCII value for 'a'.
  buf1[i] = i + 97;
}

console.log(buf1.toString('utf8'));
// Prints: abcdefghijklmnopqrstuvwxyz
console.log(buf1.toString('utf8', 0, 5));
// Prints: abcde

const buf2 = Buffer.from('tést');

console.log(buf2.toString('hex'));
// Prints: 74c3a97374
console.log(buf2.toString('utf8', 0, 3));
// Prints: té
console.log(buf2.toString(undefined, 0, 3));
// Prints: té
```

### `buf.values()`
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

### `buf.write(string[, offset[, length]][, encoding])`
<!-- YAML
added: v0.1.90
-->

* `string` {string} String om naar `buf` te schrijven.
* `offset` {integer} Het aantal bytes over te slaan voordat men begint met het schrijven van de `string`. **Default:** `0`.
* `length` {integer} Maximum number of bytes to write. **Default:** `buf.length - offset`.
* `encoding` {string} De tekencodering van een `string`. **Default:** `'utf8'`.
* Retourneert: {integer} Aantal geschreven bytes.

Writes `string` to `buf` at `offset` according to the character encoding in `encoding`. De `length` parameter is het aantal te schrijven bytes. If `buf` did not contain enough space to fit the entire string, only part of `string` will be written. Gedeeltelijk gecodeerde tekens zullen echter niet geschreven worden.

```js
const buf = Buffer.alloc(256);

const len = buf.write('\u00bd + \u00bc = \u00be', 0);

console.log(`${len} bytes: ${buf.toString('utf8', 0, len)}`);
// Print: 12 bytes: ½ + ¼ = ¾
```

### `buf.writeBigInt64BE(value[, offset])`
### `buf.writeBigInt64LE(value[, offset])`
<!-- YAML
added: v12.0.0
-->

* `value` {bigint} Number to be written to `buf`.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Must satisfy: `0 <= offset <= buf.length - 8`. **Default:** `0`.
* Retourneert: {integer} `offset` plus het aantal geschreven bytes.

Writes `value` to `buf` at the specified `offset` with the specified [endianness](https://en.wikipedia.org/wiki/Endianness) (`writeBigInt64BE()` writes as big endian, `writeBigInt64LE()` writes as little endian).

`value` wordt geïnterpreteerd en geschreven als een aanvullend ondertekend geheel getal van twee.

```js
const buf = Buffer.allocUnsafe(8);

buf.writeBigInt64BE(0x0102030405060708n, 0);

console.log(buf);
// Prints: <Buffer 01 02 03 04 05 06 07 08>
```

### `buf.writeBigUInt64BE(value[, offset])`
### `buf.writeBigUInt64LE(value[, offset])`
<!-- YAML
added: v12.0.0
-->

* `value` {bigint} Number to be written to `buf`.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Must satisfy: `0 <= offset <= buf.length - 8`. **Default:** `0`.
* Retourneert: {integer} `offset` plus het aantal geschreven bytes.

Writes `value` to `buf` at the specified `offset` with specified [endianness](https://en.wikipedia.org/wiki/Endianness) (`writeBigUInt64BE()` writes as big endian, `writeBigUInt64LE()` writes as little endian).

```js
const buf = Buffer.allocUnsafe(8);

buf.writeBigUInt64LE(0xdecafafecacefaden, 0);

console.log(buf);
// Prints: <Buffer de fa ce ca fe fa ca de>
```

### `buf.writeDoubleBE(value[, offset])`
### `buf.writeDoubleLE(value[, offset])`
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {number} Nummer wat naar `buf` geschreven moet worden.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Must satisfy `0 <= offset <= buf.length - 8`. **Default:** `0`.
* Retourneert: {integer} `offset` plus het aantal geschreven bytes.

Writes `value` to `buf` at the specified `offset` with the specified [endianness](https://en.wikipedia.org/wiki/Endianness) (`writeDoubleBE()` writes as big endian, `writeDoubleLE()` writes as little endian). `value` must be a JavaScript number. Behavior is undefined when `value` is anything other than a JavaScript number.

```js
const buf = Buffer.allocUnsafe(8);

buf.writeDoubleBE(123.456, 0);

console.log(buf);
// Prints: <Buffer 40 5e dd 2f 1a 9f be 77>

buf.writeDoubleLE(123.456, 0);

console.log(buf);
// Prints: <Buffer 77 be 9f 1a 2f dd 5e 40>
```

### `buf.writeFloatBE(value[, offset])`
### `buf.writeFloatLE(value[, offset])`
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {number} Nummer wat naar `buf` geschreven moet worden.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Must satisfy `0 <= offset <= buf.length - 4`. **Default:** `0`.
* Retourneert: {integer} `offset` plus het aantal geschreven bytes.

Writes `value` to `buf` at the specified `offset` with specified [endianness](https://en.wikipedia.org/wiki/Endianness) (`writeFloatBE()` writes as big endian, `writeFloatLE()` writes as little endian). `value` must be a JavaScript number. Behavior is undefined when `value` is anything other than a JavaScript number.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeFloatBE(0xcafebabe, 0);

console.log(buf);
// Print: <Buffer 4f 4a fe bb>

buf.writeFloatLE(0xcafebabe, 0);

console.log(buf);
// Print: <Buffer bb fe 4a 4f>
```

### `buf.writeInt8(value[, offset])`
<!-- YAML
added: v0.5.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Nummer wat naar `buf` geschreven moet worden.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Must satisfy `0 <= offset <= buf.length - 1`. **Default:** `0`.
* Retourneert: {integer} `offset` plus het aantal geschreven bytes.

Schrijft `value` naar `buf` op de gespecificeerde `offset`. `value` must be a valid signed 8-bit integer. Gedrag is ongedefinieerd als de `value` iets anders dan een ondertekend geheel 8-bit getal is.

`value` wordt geïnterpreteerd en geschreven als een aanvullend ondertekend geheel getal van twee.

```js
const buf = Buffer.allocUnsafe(2);

buf.writeInt8(2, 0);
buf.writeInt8(-2, 1);

console.log(buf);
// Print: <Buffer 02 fe>
```

### `buf.writeInt16BE(value[, offset])`
### `buf.writeInt16LE(value[, offset])`
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Nummer wat naar `buf` geschreven moet worden.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Must satisfy `0 <= offset <= buf.length - 2`. **Default:** `0`.
* Retourneert: {integer} `offset` plus het aantal geschreven bytes.

Writes `value` to `buf` at the specified `offset` with the specified [endianness](https://en.wikipedia.org/wiki/Endianness) (`writeInt16BE()` writes as big endian, `writeInt16LE()` writes as little endian). `value` must be a valid signed 16-bit integer. Behavior is undefined when `value` is anything other than a signed 16-bit integer.

`value` wordt geïnterpreteerd en geschreven als een aanvullend ondertekend geheel getal van twee.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeInt16BE(0x0102, 0);
buf.writeInt16LE(0x0304, 2);

console.log(buf);
// Print: <Buffer 01 02 04 03>
```

### `buf.writeInt32BE(value[, offset])`
### `buf.writeInt32LE(value[, offset])`
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Nummer wat naar `buf` geschreven moet worden.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Must satisfy `0 <= offset <= buf.length - 4`. **Default:** `0`.
* Retourneert: {integer} `offset` plus het aantal geschreven bytes.

Writes `value` to `buf` at the specified `offset` with the specified [endianness](https://en.wikipedia.org/wiki/Endianness) (`writeInt32BE()` writes aS big endian, `writeInt32LE()` writes as little endian). `value` must be a valid signed 32-bit integer. Behavior is undefined when `value` is anything other than a signed 32-bit integer.

`value` wordt geïnterpreteerd en geschreven als een aanvullend ondertekend geheel getal van twee.

```js
const buf = Buffer.allocUnsafe(8);

buf.writeInt32BE(0x01020304, 0);
buf.writeInt32LE(0x05060708, 4);

console.log(buf);
// Print: <Buffer 01 02 03 04 08 07 06 05>
```

### `buf.writeIntBE(value, offset, byteLength)`
### `buf.writeIntLE(value, offset, byteLength)`
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 and `byteLength` to `uint32` anymore.
-->

* `value` {integer} Nummer wat naar `buf` geschreven moet worden.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Aantal te lezen bytes. Must satisfy `0 < byteLength <= 6`.
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

### `buf.writeUInt8(value[, offset])`
<!-- YAML
added: v0.5.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Nummer wat naar `buf` geschreven moet worden.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Must satisfy `0 <= offset <= buf.length - 1`. **Default:** `0`.
* Retourneert: {integer} `offset` plus het aantal geschreven bytes.

Schrijft `value` naar `buf` op de gespecificeerde `offset`. `value` must be a valid unsigned 8-bit integer. Gedrag is ongedefinieerd als de `value` iets anders dan een ondertekend geheel 8-bit getal is.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt8(0x3, 0);
buf.writeUInt8(0x4, 1);
buf.writeUInt8(0x23, 2);
buf.writeUInt8(0x42, 3);

console.log(buf);
// Print: <Buffer 03 04 23 42>
```

### `buf.writeUInt16BE(value[, offset])`
### `buf.writeUInt16LE(value[, offset])`
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Nummer wat naar `buf` geschreven moet worden.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Must satisfy `0 <= offset <= buf.length - 2`. **Default:** `0`.
* Retourneert: {integer} `offset` plus het aantal geschreven bytes.

Writes `value` to `buf` at the specified `offset` with the specified [endianness](https://en.wikipedia.org/wiki/Endianness) (`writeUInt16BE()` writes as big endian, `writeUInt16LE()` writes as little endian). `value` must be a valid unsigned 16-bit integer. Gedrag is ongedefinieerd als de `value` iets anders dan een niet-ondertekend geheel 16-bit getal is.

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

### `buf.writeUInt32BE(value[, offset])`
### `buf.writeUInt32LE(value[, offset])`
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Nummer wat naar `buf` geschreven moet worden.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Must satisfy `0 <= offset <= buf.length - 4`. **Default:** `0`.
* Retourneert: {integer} `offset` plus het aantal geschreven bytes.

Writes `value` to `buf` at the specified `offset` with the specified [endianness](https://en.wikipedia.org/wiki/Endianness) (`writeUInt32BE()` writes as big endian, `writeUInt32LE()` writes as little endian). `value` must be a valid unsigned 32-bit integer. Gedrag is ongedefinieerd als de `value` iets anders dan een niet-ondertekend geheel 32-bit getal is.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt32BE(0xfeedface, 0);

console.log(buf);
// Print: <Buffer fe ed fa ce>

buf.writeUInt32LE(0xfeedface, 0);

console.log(buf);
// Print: <Buffer ce fa ed fe>
```

### `buf.writeUIntBE(value, offset, byteLength)`
### `buf.writeUIntLE(value, offset, byteLength)`
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 and `byteLength` to `uint32` anymore.
-->

* `value` {integer} Nummer wat naar `buf` geschreven moet worden.
* `offset` {integer} Aantal bytes over te slaan voor aanvang van het schrijven. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Aantal te lezen bytes. Must satisfy `0 < byteLength <= 6`.
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

### `new Buffer(array)`
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

> Stability: 0 - Deprecated: Use [`Buffer.from(array)`][] instead.

* `array` {integer[]} Een array bytes om van te kopiëren.

See [`Buffer.from(array)`][].

### `new Buffer(arrayBuffer[, byteOffset[, length]])`
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

> Stability: 0 - Deprecated: Use [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`] instead.

* `arrayBuffer` {ArrayBuffer|SharedArrayBuffer} An [`ArrayBuffer`][], [`SharedArrayBuffer`][] or the `.buffer` property of a [`TypedArray`][].
* `byteOffset` {integer} Index van de eerste te onthullen byte. **Default:** `0`.
* `length` {integer} Aantal te onthullen bytes. **Default:** `arrayBuffer.byteLength - byteOffset`.

See [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`].

### `new Buffer(buffer)`
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

> Stability: 0 - Deprecated: Use [`Buffer.from(buffer)`][] instead.

* `buffer` {Buffer|Uint8Array} An existing `Buffer` or [`Uint8Array`][] from which to copy data.

See [`Buffer.from(buffer)`][].

### `new Buffer(size)`
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

> Stability: 0 - Deprecated: Use [`Buffer.alloc()`][] instead (also see [`Buffer.allocUnsafe()`][]).

* `size` {integer} De gewenste lengte van de nieuwe `Buffer`.

See [`Buffer.alloc()`][] and [`Buffer.allocUnsafe()`][]. This variant of the constructor is equivalent to [`Buffer.allocUnsafe()`][], although using [`Buffer.alloc()`][] is recommended in code paths that are not critical to performance.

### `new Buffer(string[, encoding])`
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
* `encoding` {string} De codering van `string`. **Default:** `'utf8'`.

See [`Buffer.from(string[, encoding])`][`Buffer.from(string)`].

## `buffer.INSPECT_MAX_BYTES`
<!-- YAML
added: v0.5.4
-->

* {integer} **Default:** `50`

Retourneert het maximaal aantal bytes die worden geretourneerd als `buf.inspect()` wordt aangeroepen. Dit kan overschreven worden door gebruikers-modules. See [`util.inspect()`][] for more details on `buf.inspect()` behavior.

This is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## `buffer.kMaxLength`
<!-- YAML
added: v3.0.0
-->

* {integer} De grootste toegestane grootte voor een enkele `Buffer` instantie.

Een alias voor [`buffer.constants.MAX_LENGTH`][].

This is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## `buffer.transcode(source, fromEnc, toEnc)`
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
* Retourneert: {Buffer}

Re-encodes the given `Buffer` or `Uint8Array` instance from one character encoding to another. Retourneert een nieuwe `Buffer` instantie.

Throws if the `fromEnc` or `toEnc` specify invalid character encodings or if conversion from `fromEnc` to `toEnc` is not permitted.

Encodings supported by `buffer.transcode()` are: `'ascii'`, `'utf8'`, `'utf16le'`, `'ucs2'`, `'latin1'`, and `'binary'`.

The transcoding process will use substitution characters if a given byte sequence cannot be adequately represented in the target encoding. Bijvoorbeeld:

```js
const buffer = require('buffer');

const newBuf = buffer.transcode(Buffer.from('€'), 'utf8', 'ascii');
console.log(newBuf.toString('ascii'));
// Print: '?'
```

Because the Euro (`€`) sign is not representable in US-ASCII, it is replaced with `?` in the transcoded `Buffer`.

This is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## Class: `SlowBuffer`
<!-- YAML
deprecated: v6.0.0
-->

> Stability: 0 - Deprecated: Use [`Buffer.allocUnsafeSlow()`][] instead.

See [`Buffer.allocUnsafeSlow()`][]. This was never a class in the sense that the constructor always returned a `Buffer` instance, rather than a `SlowBuffer` instance.

### `new SlowBuffer(size)`
<!-- YAML
deprecated: v6.0.0
-->

> Stability: 0 - Deprecated: Use [`Buffer.allocUnsafeSlow()`][] instead.

* `size` {integer} De gewenste lengte van de nieuwe `SlowBuffer`.

See [`Buffer.allocUnsafeSlow()`][].

## Buffer Constants
<!-- YAML
added: v8.2.0
-->

`buffer.constants` is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

### `buffer.constants.MAX_LENGTH`
<!-- YAML
added: v8.2.0
-->

* {integer} De grootste toegestane grootte voor een enkele `Buffer` instantie.

On 32-bit architectures, this value currently is `(2^30)-1` (~1GB). On 64-bit architectures, this value currently is `(2^31)-1` (~2GB).

Deze waarde is ook beschikbaar als `buffer.kMaxLength`][].

### `buffer.constants.MAX_STRING_LENGTH`
<!-- YAML
added: v8.2.0
-->

* {integer} De grootste toegestane lengte voor een enkele `string` instantie.

Represents the largest `length` that a `string` primitive can have, counted in UTF-16 code units.

Deze waarde kan afhankelijk zijn van de JS engine die gebruikt wordt.

## `Buffer.from()`, `Buffer.alloc()`, en `Buffer.allocUnsafe()`

In versions of Node.js prior to 6.0.0, `Buffer` instances were created using the `Buffer` constructor function, which allocates the returned `Buffer` differently based on what arguments are provided:

* Passing a number as the first argument to `Buffer()` (e.g. `new Buffer(10)`) allocates a new `Buffer` object of the specified size. Prior to Node.js 8.0.0, the memory allocated for such `Buffer` instances is *not* initialized and *can contain sensitive data*. Such `Buffer` instances *must* be subsequently initialized by using either [`buf.fill(0)`][`buf.fill()`] or by writing to the entire `Buffer` before reading data from the `Buffer`. While this behavior is *intentional* to improve performance, development experience has demonstrated that a more explicit distinction is required between creating a fast-but-uninitialized `Buffer` versus creating a slower-but-safer `Buffer`. Since Node.js 8.0.0, `Buffer(num)` and `new
Buffer(num)` return a `Buffer` with initialized memory.
* Het doorgeven van een string, array, of `Buffer` als eerste argument, kopieert de doorgegeven data van het object naar de `Buffer`.
* Passing an [`ArrayBuffer`][] or a [`SharedArrayBuffer`][] returns a `Buffer` that shares allocated memory with the given array buffer.

Because the behavior of `new Buffer()` is different depending on the type of the first argument, security and reliability issues can be inadvertently introduced into applications when argument validation or `Buffer` initialization is not performed.

For example, if an attacker can cause an application to receive a number where a string is expected, the application may call `new Buffer(100)` instead of `new Buffer("100")`, leading it to allocate a 100 byte buffer instead of allocating a 3 byte buffer with content `"100"`. This is commonly possible using JSON API calls. Since JSON distinguishes between numeric and string types, it allows injection of numbers where a naively written application that does not validate its input sufficiently might expect to always receive a string. Before Node.js 8.0.0, the 100 byte buffer might contain arbitrary pre-existing in-memory data, so may be used to expose in-memory secrets to a remote attacker.  Since Node.js 8.0.0, exposure of memory cannot occur because the data is zero-filled. However, other attacks are still possible, such as causing very large buffers to be allocated by the server, leading to performance degradation or crashing on memory exhaustion.

To make the creation of `Buffer` instances more reliable and less error-prone, the various forms of the `new Buffer()` constructor have been **deprecated** and replaced by separate `Buffer.from()`, [`Buffer.alloc()`][], and [`Buffer.allocUnsafe()`][] methods.

*Ontwikkelaars moeten alle bestaande toepassingen van de `new Buffer()` constructeurs migreren naar een van deze nieuwe API's.*

* [`Buffer.from(array)`][] returns a new `Buffer` that *contains a copy* of the provided octets.
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`] returns a new `Buffer` that *shares the same allocated memory* as the given [`ArrayBuffer`][].
* [`Buffer.from(buffer)`][] returns a new `Buffer` that *contains a copy* of the contents of the given `Buffer`.
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`] returns a new `Buffer` that *contains a copy* of the provided string.
* [`Buffer.alloc(size[, fill[, encoding]])`][`Buffer.alloc()`] returns a new initialized `Buffer` of the specified size. This method is slower than [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] but guarantees that newly created `Buffer` instances never contain old data that is potentially sensitive. Een `TypeError` zal worden geworpen als `size` geen nummer is.
* [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] and [`Buffer.allocUnsafeSlow(size)`][`Buffer.allocUnsafeSlow()`] each return a new uninitialized `Buffer` of the specified `size`. Because the `Buffer` is uninitialized, the allocated segment of memory might contain old data that is potentially sensitive.

`Buffer` instances returned by [`Buffer.allocUnsafe()`][] *may* be allocated off a shared internal memory pool if `size` is less than or equal to half [`Buffer.poolSize`][]. Instances returned by [`Buffer.allocUnsafeSlow()`][] *never* use the shared internal memory pool.

### De `--zero-fill-buffers` command line optie
<!-- YAML
added: v5.10.0
-->

Node.js can be started using the `--zero-fill-buffers` command line option to cause all newly-allocated `Buffer` instances to be zero-filled upon creation by default. Without the option, buffers created with [`Buffer.allocUnsafe()`][], [`Buffer.allocUnsafeSlow()`][], and `new SlowBuffer(size)` are not zero-filled. Use of this flag can have a measurable negative impact on performance. Use the `--zero-fill-buffers` option only when necessary to enforce that newly allocated `Buffer` instances cannot contain old data that is potentially sensitive.

```console
$ node --zero-fill-buffers
> Buffer.allocUnsafe(5);
<Buffer 00 00 00 00 00>
```

### Wat maakt `Buffer.allocUnsafe()` en `Buffer.allocUnsafeSlow()` "onveilig"?

When calling [`Buffer.allocUnsafe()`][] and [`Buffer.allocUnsafeSlow()`][], the segment of allocated memory is *uninitialized* (it is not zeroed-out). Terwijl dit onwerp de toewijzing van geheugen aardig snel maakt, kan het toegewezen deel van het geheurgen oude, potentieel gevoelige, data bevatten. Using a `Buffer` created by [`Buffer.allocUnsafe()`][] without *completely* overwriting the memory can allow this old data to be leaked when the `Buffer` memory is read.

While there are clear performance advantages to using [`Buffer.allocUnsafe()`][], extra care *must* be taken in order to avoid introducing security vulnerabilities into an application.
