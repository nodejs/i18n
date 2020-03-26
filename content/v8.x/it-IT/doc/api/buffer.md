# Buffer

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Prior to the introduction of [`TypedArray`], the JavaScript language had no mechanism for reading or manipulating streams of binary data. The `Buffer` class was introduced as part of the Node.js API to enable interaction with octet streams in TCP streams, file system operations, and other contexts.

With [`TypedArray`] now available, the `Buffer` class implements the [`Uint8Array`] API in a manner that is more optimized and suitable for Node.js.

Instances of the `Buffer` class are similar to arrays of integers but correspond to fixed-sized, raw memory allocations outside the V8 heap. The size of the `Buffer` is established when it is created and cannot be changed.

The `Buffer` class is within the global scope, making it unlikely that one would need to ever use `require('buffer').Buffer`.

Esempi:

```js
// Crea un Buffer a riempimento zero di lunghezza 10.
const buf1 = Buffer.alloc(10);

// Crea un Buffer di lunghezza 10, riempito con 0x1.
const buf2 = Buffer.alloc(10, 1);

// Crea un buffer non inizializzato di lunghezza 10.
// Questo procedimento è più veloce di chiamare Buffer.alloc() ma l'istanza
// di Buffer restituita potrebbe contenere vecchi dati che devono essere 
// sovrascritti usando fill() oppure write().
const buf3 = Buffer.allocUnsafe(10);

// Crea un Buffer contenente [0x1, 0x2, 0x3].
const buf4 = Buffer.from([1, 2, 3]);

// Crea un Buffer contenente byte UTF-8 [0x74, 0xc3, 0xa9, 0x73, 0x74].
const buf5 = Buffer.from('tést');

// Crea un Buffer contenente byte Latin-1 [0x74, 0xe9, 0x73, 0x74].
const buf6 = Buffer.from('tést', 'latin1');
```

## `Buffer.from()`, `Buffer.alloc()`, e `Buffer.allocUnsafe()`

In versions of Node.js prior to v6, `Buffer` instances were created using the `Buffer` constructor function, which allocates the returned `Buffer` differently based on what arguments are provided:

* Passing a number as the first argument to `Buffer()` (e.g. `new Buffer(10)`), allocates a new `Buffer` object of the specified size. Prior to Node.js 8.0.0, the memory allocated for such `Buffer` instances is *not* initialized and *can contain sensitive data*. Such `Buffer` instances *must* be subsequently initialized by using either [`buf.fill(0)`][`buf.fill()`] or by writing to the `Buffer` completely. While this behavior is *intentional* to improve performance, development experience has demonstrated that a more explicit distinction is required between creating a fast-but-uninitialized `Buffer` versus creating a slower-but-safer `Buffer`. Starting in Node.js 8.0.0, `Buffer(num)` and `new Buffer(num)` will return a `Buffer` with initialized memory.
* Passing a string, array, or `Buffer` as the first argument copies the passed object's data into the `Buffer`.
* Passing an [`ArrayBuffer`] or a [`SharedArrayBuffer`] returns a `Buffer` that shares allocated memory with the given array buffer.

Because the behavior of `new Buffer()` changes significantly based on the type of value passed as the first argument, applications that do not properly validate the input arguments passed to `new Buffer()`, or that fail to appropriately initialize newly allocated `Buffer` content, can inadvertently introduce security and reliability issues into their code.

To make the creation of `Buffer` instances more reliable and less error prone, the various forms of the `new Buffer()` constructor have been **deprecated** and replaced by separate `Buffer.from()`, [`Buffer.alloc()`], and [`Buffer.allocUnsafe()`] methods.

*Developers should migrate all existing uses of the `new Buffer()` constructors to one of these new APIs.*

* [`Buffer.from(array)`] returns a new `Buffer` containing a *copy* of the provided octets.
* [`Buffer.from(arrayBuffer[, byteOffset [, length]])`][`Buffer.from(arrayBuffer)`] returns a new `Buffer` that *shares* the same allocated memory as the given [`ArrayBuffer`].
* [`Buffer.from(buffer)`] returns a new `Buffer` containing a *copy* of the contents of the given `Buffer`.
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`] returns a new `Buffer` containing a *copy* of the provided string.
* [`Buffer.alloc(size[, fill[, encoding]])`][`Buffer.alloc()`] returns a "filled" `Buffer` instance of the specified size. This method can be significantly slower than [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] but ensures that newly created `Buffer` instances never contain old and potentially sensitive data.
* [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] and [`Buffer.allocUnsafeSlow(size)`][`Buffer.allocUnsafeSlow()`] each return a new `Buffer` of the specified `size` whose content *must* be initialized using either [`buf.fill(0)`][`buf.fill()`] or written to completely.

`Buffer` instances returned by [`Buffer.allocUnsafe()`] *may* be allocated off a shared internal memory pool if `size` is less than or equal to half [`Buffer.poolSize`]. Instances returned by [`Buffer.allocUnsafeSlow()`] *never* use the shared internal memory pool.

### L'opzione `--zero-fill-buffers` della command line

<!-- YAML
added: v5.10.0
-->

Node.js can be started using the `--zero-fill-buffers` command line option to force all newly allocated `Buffer` instances created using either `new Buffer(size)`, [`Buffer.allocUnsafe()`], [`Buffer.allocUnsafeSlow()`] or `new SlowBuffer(size)` to be *automatically zero-filled* upon creation. Use of this flag *changes the default behavior* of these methods and *can have a significant impact* on performance. Use of the `--zero-fill-buffers` option is recommended only when necessary to enforce that newly allocated `Buffer` instances cannot contain potentially sensitive data.

Esempio:

```txt
$ node --zero-fill-buffers
> Buffer.allocUnsafe(5);
<Buffer 00 00 00 00 00>
```

### Cosa rende `Buffer.allocUnsafe()` e `Buffer.allocUnsafeSlow()` "unsafe" (non sicuri/pericolosi)?

When calling [`Buffer.allocUnsafe()`] and [`Buffer.allocUnsafeSlow()`], the segment of allocated memory is *uninitialized* (it is not zeroed-out). While this design makes the allocation of memory quite fast, the allocated segment of memory might contain old data that is potentially sensitive. Using a `Buffer` created by [`Buffer.allocUnsafe()`] without *completely* overwriting the memory can allow this old data to be leaked when the `Buffer` memory is read.

While there are clear performance advantages to using [`Buffer.allocUnsafe()`], extra care *must* be taken in order to avoid introducing security vulnerabilities into an application.

## Buffer e Codifica (Encoding) dei Caratteri

<!-- YAML
changes:

  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7111
    description: Introduced `latin1` as an alias for `binary`.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2859
    description: Removed the deprecated `raw` and `raws` encodings.
-->

`Buffer` instances are commonly used to represent sequences of encoded characters such as UTF-8, UCS2, Base64, or even Hex-encoded data. It is possible to convert back and forth between `Buffer` instances and ordinary JavaScript strings by using an explicit character encoding.

Esempio:

```js
const buf = Buffer.from('hello world', 'ascii');

// Prints: 68656c6c6f20776f726c64
console.log(buf.toString('hex'));

// Prints: aGVsbG8gd29ybGQ=
console.log(buf.toString('base64'));
```

Le codifiche dei caratteri attualmente supportate da Node.js includono:

* `'ascii'` - Solo per dati ASCII a 7 bit. This encoding is fast and will strip the high bit if set.

* `'utf8'` - Caratteri Unicode codificati in multibyte. Many web pages and other document formats use UTF-8.

* `'utf16le'` - 2 o 4 byte, caratteri Unicode codificati in little-endian. Sono supportate coppie di surrogati (da U+10000 a U+10FFFF).

* `'ucs2'` - Alias di `'utf16le'`.

* `'base64'` - Codifica base64. When creating a `Buffer` from a string, this encoding will also correctly accept "URL and Filename Safe Alphabet" as specified in [RFC4648, Section 5](https://tools.ietf.org/html/rfc4648#section-5).

* `'latin1'` - A way of encoding the `Buffer` into a one-byte encoded string (as defined by the IANA in [RFC1345](https://tools.ietf.org/html/rfc1345), page 63, to be the Latin-1 supplement block and C0/C1 control codes).

* `'binary'` - Alias di `'latin1'`.

* `'hex'` - Codifica ogni byte come due caratteri esadecimali.

*Note*: Today's browsers follow the [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/) which aliases both `'latin1'` and `'ISO-8859-1'` to `'win-1252'`. This means that while doing something like `http.get()`, if the returned charset is one of those listed in the WHATWG specification it is possible that the server actually returned `'win-1252'`-encoded data, and using `'latin1'` encoding may incorrectly decode the characters.

## Buffer e TypedArray

<!-- YAML
changes:

  - version: v3.0.0
    pr-url: https://github.com/nodejs/node/pull/2002
    description: The `Buffer`s class now inherits from `Uint8Array`.
-->

Le istanze di `Buffer` sono anche istanze di [`Uint8Array`]. However, there are subtle incompatibilities with [`TypedArray`]. For example, while [`ArrayBuffer#slice()`] creates a copy of the slice, the implementation of [`Buffer#slice()`][`buf.slice()`] creates a view over the existing `Buffer` without copying, making [`Buffer#slice()`][`buf.slice()`] far more efficient.

It is also possible to create new [`TypedArray`] instances from a `Buffer` with the following caveats:

1. La memoria del `Buffer` object viene copiata su [`TypedArray`], non condivisa.

2. The `Buffer` object's memory is interpreted as an array of distinct elements, and not as a byte array of the target type. That is, `new Uint32Array(Buffer.from([1, 2, 3, 4]))` creates a 4-element [`Uint32Array`] with elements `[1, 2, 3, 4]`, not a [`Uint32Array`] with a single element `[0x1020304]` or `[0x4030201]`.

It is possible to create a new `Buffer` that shares the same allocated memory as a [`TypedArray`] instance by using the TypeArray object's `.buffer` property.

Esempio:

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Copies the contents of `arr`
const buf1 = Buffer.from(arr);

// Shares memory with `arr`
const buf2 = Buffer.from(arr.buffer);

// Prints: <Buffer 88 a0>
console.log(buf1);

// Prints: <Buffer 88 13 a0 0f>
console.log(buf2);

arr[1] = 6000;

// Prints: <Buffer 88 a0>
console.log(buf1);

// Prints: <Buffer 88 13 70 17>
console.log(buf2);
```

Note that when creating a `Buffer` using a [`TypedArray`]'s `.buffer`, it is possible to use only a portion of the underlying [`ArrayBuffer`] by passing in `byteOffset` and `length` parameters.

Esempio:

```js
const arr = new Uint16Array(20);
const buf = Buffer.from(arr.buffer, 0, 16);

// Prints: 16
console.log(buf.length);
```

The `Buffer.from()` and [`TypedArray.from()`] have different signatures and implementations. Specifically, the [`TypedArray`] variants accept a second argument that is a mapping function that is invoked on every element of the typed array:

* `TypedArray.from(source[, mapFn[, thisArg]])`

The `Buffer.from()` method, however, does not support the use of a mapping function:

* [`Buffer.from(array)`]
* [`Buffer.from(buffer)`]
* [`Buffer.from(arrayBuffer[, byteOffset [, length]])`][`Buffer.from(arrayBuffer)`]
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`]

## Buffer ed iterazione

Le istanze di `Buffer` possono essere iterate usando la sintassi `for..of`:

Esempio:

```js
const buf = Buffer.from([1, 2, 3]);

// Stampa:
//   1
//   2
//   3
for (const b of buf) {
  console.log(b);
}
```

Additionally, the [`buf.values()`], [`buf.keys()`], and [`buf.entries()`] methods can be used to create iterators.

## Class: Buffer

La classe `Buffer` è un tipo globale per gestire direttamente i dati binari. Può essere costruita in vari modi.

### new Buffer(array)

<!-- YAML
deprecated: v6.0.0
changes:

  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
-->

> Stabilità: 0 - Obsoleto: Utilizza invece [`Buffer.from(array)`].

* `array` {integer[]} Un array di byte da cui copiare.

Alloca un nuovo `Buffer` usando un `array` di octet.

Esempio:

```js
// Crea un nuovo Buffer contenente i byte UTF-8 della stringa 'buffer'
const buf = new Buffer([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
```

### new Buffer(arrayBuffer[, byteOffset[, length]])

<!-- YAML
added: v3.0.0
deprecated: v6.0.0
changes:

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

> Stability: 0 - Deprecated: Use [`Buffer.from(arrayBuffer[, byteOffset [, length]])`][`Buffer.from(arrayBuffer)`] instead.

* `arrayBuffer` {ArrayBuffer|SharedArrayBuffer} An [`ArrayBuffer`], [`SharedArrayBuffer`] or the `.buffer` property of a [`TypedArray`].
* `byteOffset` {integer} Indice del primo byte da esporre. **Default:** `0`.
* `length` {integer} Numero di byte da esporre. **Default:** `arrayBuffer.length - byteOffset`.

This creates a view of the [`ArrayBuffer`] or [`SharedArrayBuffer`] without copying the underlying memory. For example, when passed a reference to the `.buffer` property of a [`TypedArray`] instance, the newly created `Buffer` will share the same allocated memory as the [`TypedArray`].

The optional `byteOffset` and `length` arguments specify a memory range within the `arrayBuffer` that will be shared by the `Buffer`.

Esempio:

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Shares memory with `arr`
const buf = new Buffer(arr.buffer);

// Prints: <Buffer 88 13 a0 0f>
console.log(buf);

// Changing the original Uint16Array changes the Buffer also
arr[1] = 6000;

// Prints: <Buffer 88 13 70 17>
console.log(buf);
```

### new Buffer(buffer)

<!-- YAML
deprecated: v6.0.0
changes:

  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
-->

> Stabilità: 0 - Obsoleto: Utilizza invece [`Buffer.from(buffer)`].

* `buffer` {Buffer|Uint8Array} An existing `Buffer` or [`Uint8Array`] from which to copy data.

Copia i dati passati del `buffer` su una nuova istanza di `Buffer`.

Esempio:

```js
const buf1 = new Buffer('buffer');
const buf2 = new Buffer(buf1);

buf1[0] = 0x61;

// Prints: auffer
console.log(buf1.toString());

// Prints: buffer
console.log(buf2.toString());
```

### new Buffer(size)

<!-- YAML
deprecated: v6.0.0
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12141
    description: new Buffer(size) will return zero-filled memory by default.
  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
-->

> Stability: 0 - Deprecated: Use [`Buffer.alloc()`] instead (also see [`Buffer.allocUnsafe()`]).

* `size` {integer} La lunghezza desiderata del nuovo `Buffer`.

Alloca un nuovo `Buffer` di `size` byte. If the `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, a [`RangeError`] will be thrown. A zero-length `Buffer` will be created if `size` is 0.

Prior to Node.js 8.0.0, the underlying memory for `Buffer` instances created in this way is *not initialized*. The contents of a newly created `Buffer` are unknown and *may contain sensitive data*. Use [`Buffer.alloc(size)`][`Buffer.alloc()`] instead to initialize a `Buffer` to zeroes.

Esempio:

```js
const buf = new Buffer(10);

// Prints: <Buffer 00 00 00 00 00 00 00 00 00 00>
console.log(buf);
```

### new Buffer(string[, encoding])

<!-- YAML
deprecated: v6.0.0
changes:

  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
-->

> Stability: 0 - Deprecated: Use [`Buffer.from(string[, encoding])`][`Buffer.from(string)`] instead.

* `string` {string} Stringa da codificare.
* `encoding` {string} La codifica di `string`. **Default:** `'utf8'`.

Crea un nuovo `Buffer` contenente `string`. The `encoding` parameter identifies the character encoding of `string`.

Esempi:

```js
const buf1 = new Buffer('this is a tést');

// Prints: this is a tést
console.log(buf1.toString());

// Prints: this is a tC)st
console.log(buf1.toString('ascii'));

const buf2 = new Buffer('7468697320697320612074c3a97374', 'hex');

// Prints: this is a tést
console.log(buf2.toString());
```

### Class Method: Buffer.alloc(size[, fill[, encoding]])

<!-- YAML
added: v5.10.0
changes:

  - version: v8.9.3
    pr-url: https://github.com/nodejs/node/pull/17428
    description: Specifying an invalid string for `fill` now results in a
                 zero-filled buffer.
-->

* `size` {integer} La lunghezza desiderata del nuovo `Buffer`.
* `fill` {string|Buffer|integer} Un valore con il quale precompilare il nuovo `Buffer`. **Default:** `0`.
* `encoding` {string} Se `fill` è una stringa, questa è la sua codifica. **Default:** `'utf8'`.

Alloca un nuovo `Buffer` di `size` byte. If `fill` is `undefined`, the `Buffer` will be *zero-filled*.

Esempio:

```js
const buf = Buffer.alloc(5);

// Prints: <Buffer 00 00 00 00 00>
console.log(buf);
```

Alloca un nuovo `Buffer` di `size` byte. If the `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, a [`RangeError`] will be thrown. A zero-length `Buffer` will be created if `size` is 0.

If `fill` is specified, the allocated `Buffer` will be initialized by calling [`buf.fill(fill)`][`buf.fill()`].

Esempio:

```js
const buf = Buffer.alloc(5, 'a');

// Prints: <Buffer 61 61 61 61 61>
console.log(buf);
```

If both `fill` and `encoding` are specified, the allocated `Buffer` will be initialized by calling [`buf.fill(fill, encoding)`][`buf.fill()`].

Esempio:

```js
const buf = Buffer.alloc(11, 'aGVsbG8gd29ybGQ=', 'base64');

// Prints: <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64>
console.log(buf);
```

Calling [`Buffer.alloc()`] can be significantly slower than the alternative [`Buffer.allocUnsafe()`] but ensures that the newly created `Buffer` instance contents will *never contain sensitive data*.

Verrà generato un `TypeError` se `size` non è un numero.

### Class Method: Buffer.allocUnsafe(size)

<!-- YAML
added: v5.10.0
changes:

  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7079
    description: Passing a negative `size` will now throw an error.
-->

* `size` {integer} La lunghezza desiderata del nuovo `Buffer`.

Alloca un nuovo `Buffer` di `size` byte. If the `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, a [`RangeError`] will be thrown. A zero-length `Buffer` will be created if `size` is 0.

The underlying memory for `Buffer` instances created in this way is *not initialized*. The contents of the newly created `Buffer` are unknown and *may contain sensitive data*. Use [`Buffer.alloc()`] instead to initialize `Buffer` instances to zeroes.

Esempio:

```js
const buf = Buffer.allocUnsafe(10);

// Prints: (contents may vary): <Buffer a0 8b 28 3f 01 00 00 00 50 32>
console.log(buf);

buf.fill(0);

// Prints: <Buffer 00 00 00 00 00 00 00 00 00 00>
console.log(buf);
```

Verrà generato un `TypeError` se `size` non è un numero.

Note that the `Buffer` module pre-allocates an internal `Buffer` instance of size [`Buffer.poolSize`] that is used as a pool for the fast allocation of new `Buffer` instances created using [`Buffer.allocUnsafe()`] and the deprecated `new Buffer(size)` constructor only when `size` is less than or equal to `Buffer.poolSize >> 1` (floor of [`Buffer.poolSize`] divided by two).

Use of this pre-allocated internal memory pool is a key difference between calling `Buffer.alloc(size, fill)` vs. `Buffer.allocUnsafe(size).fill(fill)`. Specifically, `Buffer.alloc(size, fill)` will *never* use the internal `Buffer` pool, while `Buffer.allocUnsafe(size).fill(fill)` *will* use the internal `Buffer` pool if `size` is less than or equal to half [`Buffer.poolSize`]. The difference is subtle but can be important when an application requires the additional performance that [`Buffer.allocUnsafe()`] provides.

### Class Method: Buffer.allocUnsafeSlow(size)

<!-- YAML
added: v5.12.0
-->

* `size` {integer} La lunghezza desiderata del nuovo `Buffer`.

Alloca un nuovo `Buffer` di `size` byte. If the `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, a [`RangeError`] will be thrown. A zero-length `Buffer` will be created if `size` is 0.

The underlying memory for `Buffer` instances created in this way is *not initialized*. The contents of the newly created `Buffer` are unknown and *may contain sensitive data*. Use [`buf.fill(0)`][`buf.fill()`] to initialize such `Buffer` instances to zeroes.

When using [`Buffer.allocUnsafe()`] to allocate new `Buffer` instances, allocations under 4KB are, by default, sliced from a single pre-allocated `Buffer`. This allows applications to avoid the garbage collection overhead of creating many individually allocated `Buffer` instances. This approach improves both performance and memory usage by eliminating the need to track and cleanup as many `Persistent` objects.

However, in the case where a developer may need to retain a small chunk of memory from a pool for an indeterminate amount of time, it may be appropriate to create an un-pooled `Buffer` instance using `Buffer.allocUnsafeSlow()` then copy out the relevant bits.

Esempio:

```js
// Bisogna mantenere a disposizione alcuni piccoli chunk di memoria
const store = [];

socket.on('readable', () => {
  const data = socket.read();

  // Allocate per i dati conservati
  const sb = Buffer.allocUnsafeSlow(10);

  // Copia i dati nella nuova allocazione
  data.copy(sb, 0, 0, 10);

  store.push(sb);
});
```

Use of `Buffer.allocUnsafeSlow()` should be used only as a last resort *after* a developer has observed undue memory retention in their applications.

Verrà generato un `TypeError` se `size` non è un numero.

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

* `string` {string|Buffer|TypedArray|DataView|ArrayBuffer|SharedArrayBuffer} A value to calculate the length of.
* `encoding` {string} Se `string` è una stringa, questa è la sua codifica. **Default:** `'utf8'`.
* Restituisce: {integer} Il numero di byte contenuti all'interno di una `string`.

Restituisce la lunghezza effettiva in byte di una stringa. This is not the same as [`String.prototype.length`] since that returns the number of *characters* in a string.

*Note*: For `'base64'` and `'hex'`, this function assumes valid input. For strings that contain non-Base64/Hex-encoded data (e.g. whitespace), the return value might be greater than the length of a `Buffer` created from the string.

Esempio:

```js
const str = '\u00bd + \u00bc = \u00be';

// Prints: ½ + ¼ = ¾: 9 characters, 12 bytes
console.log(`${str}: ${str.length} characters, ` +
            `${Buffer.byteLength(str, 'utf8')} bytes`);
```

When `string` is a `Buffer`/[`DataView`]/[`TypedArray`]/[`ArrayBuffer`]/ [`SharedArrayBuffer`], the actual byte length is returned.

### Class Method: Buffer.compare(buf1, buf2)

<!-- YAML
added: v0.11.13
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The arguments can now be `Uint8Array`s.
-->

* `buf1` {Buffer|Uint8Array}
* `buf2` {Buffer|Uint8Array}
* Restituisce: {integer}

Compares `buf1` to `buf2` typically for the purpose of sorting arrays of `Buffer` instances. This is equivalent to calling [`buf1.compare(buf2)`][`buf.compare()`].

Esempio:

```js
const buf1 = Buffer.from('1234');
const buf2 = Buffer.from('0123');
const arr = [buf1, buf2];

// Prints: [ <Buffer 30 31 32 33>, <Buffer 31 32 33 34> ]
// (This result is equal to: [buf2, buf1])
console.log(arr.sort(Buffer.compare));
```

### Class Method: Buffer.concat(list[, totalLength])

<!-- YAML
added: v0.7.11
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The elements of `list` can now be `Uint8Array`s.
-->

* `list` {Array} List of `Buffer` or [`Uint8Array`] instances to concat.
* `totalLength` {integer} Total length of the `Buffer` instances in `list` when concatenated.
* Restituisce: {Buffer}

Returns a new `Buffer` which is the result of concatenating all the `Buffer` instances in the `list` together.

If the list has no items, or if the `totalLength` is 0, then a new zero-length `Buffer` is returned.

If `totalLength` is not provided, it is calculated from the `Buffer` instances in `list`. This however causes an additional loop to be executed in order to calculate the `totalLength`, so it is faster to provide the length explicitly if it is already known.

Se viene fornito `totalLength`, viene assegnato forzatamente ad un unsigned integer (intero senza segno). If the combined length of the `Buffer`s in `list` exceeds `totalLength`, the result is truncated to `totalLength`.

Example: Create a single `Buffer` from a list of three `Buffer` instances

```js
const buf1 = Buffer.alloc(10);
const buf2 = Buffer.alloc(14);
const buf3 = Buffer.alloc(18);
const totalLength = buf1.length + buf2.length + buf3.length;

// Prints: 42
console.log(totalLength);

const bufA = Buffer.concat([buf1, buf2, buf3], totalLength);

// Prints: <Buffer 00 00 00 00 ...>
console.log(bufA);

// Prints: 42
console.log(bufA.length);
```

### Class Method: Buffer.from(array)

<!-- YAML
added: v5.10.0
-->

* `array` {Array}

Alloca un nuovo `Buffer` usando un `array` di octet.

Esempio:

```js
// Crea un nuovo Buffer contenente i byte UTF-8 della stringa 'buffer'
const buf = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
```

Verrà generato un `TypeError` se `array` non è un `Array`.

### Class Method: Buffer.from(arrayBuffer[, byteOffset[, length]])

<!-- YAML
added: v5.10.0
-->

* `arrayBuffer` {ArrayBuffer|SharedArrayBuffer} An [`ArrayBuffer`], [`SharedArrayBuffer`], or the `.buffer` property of a [`TypedArray`].
* `byteOffset` {integer} Indice del primo byte da esporre. **Default:** `0`.
* `length` {integer} Numero di byte da esporre. **Default:** `arrayBuffer.length - byteOffset`.

This creates a view of the [`ArrayBuffer`] without copying the underlying memory. For example, when passed a reference to the `.buffer` property of a [`TypedArray`] instance, the newly created `Buffer` will share the same allocated memory as the [`TypedArray`].

Esempio:

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Shares memory with `arr`
const buf = Buffer.from(arr.buffer);

// Prints: <Buffer 88 13 a0 0f>
console.log(buf);

// Changing the original Uint16Array changes the Buffer also
arr[1] = 6000;

// Prints: <Buffer 88 13 70 17>
console.log(buf);
```

The optional `byteOffset` and `length` arguments specify a memory range within the `arrayBuffer` that will be shared by the `Buffer`.

Esempio:

```js
const ab = new ArrayBuffer(10);
const buf = Buffer.from(ab, 0, 2);

// Prints: 2
console.log(buf.length);
```

A `TypeError` will be thrown if `arrayBuffer` is not an [`ArrayBuffer`] or a [`SharedArrayBuffer`].

### Class Method: Buffer.from(buffer)

<!-- YAML
added: v5.10.0
-->

* `buffer` {Buffer|Uint8Array} An existing `Buffer` or [`Uint8Array`] from which to copy data.

Copia i dati passati del `buffer` su una nuova istanza di `Buffer`.

Esempio:

```js
const buf1 = Buffer.from('buffer');
const buf2 = Buffer.from(buf1);

buf1[0] = 0x61;

// Prints: auffer
console.log(buf1.toString());

// Prints: buffer
console.log(buf2.toString());
```

Verrà generato un `TypeError` se `buffer` non è un `Buffer`.

### Class Method: Buffer.from(string[, encoding])

<!-- YAML
added: v5.10.0
-->

* `string` {string} Una striga da codificare.
* `encoding` {string} La codifica di `string`. **Default:** `'utf8'`.

Crea un nuovo `Buffer` contenente `string`. The `encoding` parameter identifies the character encoding of `string`.

Esempi:

```js
const buf1 = Buffer.from('this is a tést');

// Prints: this is a tést
console.log(buf1.toString());

// Prints: this is a tC)st
console.log(buf1.toString('ascii'));

const buf2 = Buffer.from('7468697320697320612074c3a97374', 'hex');

// Prints: this is a tést
console.log(buf2.toString());
```

Verrà generato un `TypeError` se `string` non è una stringa.

### Class Method: Buffer.from(object[, offsetOrEncoding[, length]])

<!-- YAML
added: v8.2.0
-->

* `object` {Object} Un object che supporta `Symbol.toPrimitive` oppure `valueOf()`
* `offsetOrEncoding` {number|string} A byte-offset or encoding, depending on the value returned either by `object.valueOf()` or `object[Symbol.toPrimitive]()`.
* `length` {number} A length, depending on the value returned either by `object.valueOf()` or `object[Symbol.toPrimitive]()`.

For objects whose `valueOf()` function returns a value not strictly equal to `object`, returns `Buffer.from(object.valueOf(), offsetOrEncoding, length)`.

Per esempio:

```js
const buf = Buffer.from(new String('this is a test'));
// <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

For objects that support `Symbol.toPrimitive`, returns `Buffer.from(object[Symbol.toPrimitive](), offsetOrEncoding, length)`.

Per esempio:

```js
class Foo {
  [Symbol.toPrimitive]() {
    return 'this is a test';
  }
}

const buf = Buffer.from(new Foo(), 'utf8');
// <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

### Class Method: Buffer.isBuffer(obj)

<!-- YAML
added: v0.1.101
-->

* `obj` {Object}
* Restituisce: {boolean}

Restituisce `true` se `obj` è un `Buffer`, in caso contrario `false`.

### Class Method: Buffer.isEncoding(encoding)

<!-- YAML
added: v0.9.1
-->

* `encoding` {string} Un nome di una codifica di caratteri da verificare.
* Restituisce: {boolean}

Returns `true` if `encoding` contains a supported character encoding, or `false` otherwise.

### Class Property: Buffer.poolSize

<!-- YAML
added: v0.11.3
-->

* {integer} **Default:** `8192`

This is the number of bytes used to determine the size of pre-allocated, internal `Buffer` instances used for pooling. Questo valore potrebbe essere modificato.

### buf[index]

<!-- YAML
type: property
name: [index]
-->

The index operator `[index]` can be used to get and set the octet at position `index` in `buf`. The values refer to individual bytes, so the legal value range is between `0x00` and `0xFF` (hex) or `0` and `255` (decimal).

This operator is inherited from `Uint8Array`, so its behavior on out-of-bounds access is the same as `UInt8Array` - that is, getting returns `undefined` and setting does nothing.

Example: Copy an ASCII string into a `Buffer`, one byte at a time

```js
const str = 'Node.js';
const buf = Buffer.allocUnsafe(str.length);

for (let i = 0; i < str.length; i++) {
  buf[i] = str.charCodeAt(i);
}

// Prints: Node.js
console.log(buf.toString('ascii'));
```

### buf.buffer

The `buffer` property references the underlying `ArrayBuffer` object based on which this Buffer object is created.

```js
const arrayBuffer = new ArrayBuffer(16);
const buffer = Buffer.from(arrayBuffer);

console.log(buffer.buffer === arrayBuffer);
// Stampa: true
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

* `target` {Buffer|Uint8Array} A `Buffer` or [`Uint8Array`] to compare to.
* `targetStart` {integer} The offset within `target` at which to begin comparison. **Default:** `0`.
* `targetEnd` {integer} The offset with `target` at which to end comparison (not inclusive). **Default:** `target.length`.
* `sourceStart` {integer} L'offset all'interno di `buf` sul quale iniziare il confronto. **Default:** `0`.
* `sourceEnd` {integer} The offset within `buf` at which to end comparison (not inclusive). **Default:** [`buf.length`].
* Restituisce: {integer}

Compares `buf` with `target` and returns a number indicating whether `buf` comes before, after, or is the same as `target` in sort order. Il confronto si basa sulla sequenza effettiva di byte in ciascun `Buffer`.

* Viene restituito `0` se `target` è uguale a `buf`
* Viene restituito `1` se `target` dovrebbe venire *prima* di `buf` quando viene ordinato.
* Viene restituito `-1` se `target` dovrebbe venire *dopo* di `buf` quando viene ordinato.

Esempi:

```js
const buf1 = Buffer.from('ABC');
const buf2 = Buffer.from('BCD');
const buf3 = Buffer.from('ABCD');

// Prints: 0
console.log(buf1.compare(buf1));

// Prints: -1
console.log(buf1.compare(buf2));

// Prints: -1
console.log(buf1.compare(buf3));

// Prints: 1
console.log(buf2.compare(buf1));

// Prints: 1
console.log(buf2.compare(buf3));

// Prints: [ <Buffer 41 42 43>, <Buffer 41 42 43 44>, <Buffer 42 43 44> ]
// (This result is equal to: [buf1, buf3, buf2])
console.log([buf1, buf2, buf3].sort(Buffer.compare));
```

The optional `targetStart`, `targetEnd`, `sourceStart`, and `sourceEnd` arguments can be used to limit the comparison to specific ranges within `target` and `buf` respectively.

Esempi:

```js
const buf1 = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);
const buf2 = Buffer.from([5, 6, 7, 8, 9, 1, 2, 3, 4]);

// Prints: 0
console.log(buf1.compare(buf2, 5, 9, 0, 4));

// Prints: -1
console.log(buf1.compare(buf2, 0, 6, 4));

// Prints: 1
console.log(buf1.compare(buf2, 5, 6, 5));
```

A `RangeError` will be thrown if: `targetStart < 0`, `sourceStart < 0`, `targetEnd > target.byteLength` or `sourceEnd > source.byteLength`.

### buf.copy(target[, targetStart[, sourceStart[, sourceEnd]]])

<!-- YAML
added: v0.1.90
-->

* `target` {Buffer|Uint8Array} Un `Buffer` od un [`Uint8Array`] su cui copiare.
* `targetStart` {integer} The offset within `target` at which to begin copying to. **Default:** `0`.
* `sourceStart` {integer} The offset within `buf` at which to begin copying from. **Default:** `0`.
* `sourceEnd` {integer} The offset within `buf` at which to stop copying (not inclusive). **Default:** [`buf.length`].
* Restituisce: {integer} Il numero di byte copiati.

Copies data from a region of `buf` to a region in `target` even if the `target` memory region overlaps with `buf`.

Example: Create two `Buffer` instances, `buf1` and `buf2`, and copy `buf1` from byte 16 through byte 19 into `buf2`, starting at the 8th byte in `buf2`

```js
const buf1 = Buffer.allocUnsafe(26);
const buf2 = Buffer.allocUnsafe(26).fill('!');

for (let i = 0; i < 26; i++) {
  // 97 is the decimal ASCII value for 'a'
  buf1[i] = i + 97;
}

buf1.copy(buf2, 8, 16, 20);

// Prints: !!!!!!!!qrst!!!!!!!!!!!!!
console.log(buf2.toString('ascii', 0, 25));
```

Example: Create a single `Buffer` and copy data from one region to an overlapping region within the same `Buffer`

```js
const buf = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 is the decimal ASCII value for 'a'
  buf[i] = i + 97;
}

buf.copy(buf, 0, 4, 10);

// Prints: efghijghijklmnopqrstuvwxyz
console.log(buf.toString());
```

### buf.entries()

<!-- YAML
added: v1.1.0
-->

* Restituisce: {Iterator}

Creates and returns an [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) of `[index, byte]` pairs from the contents of `buf`.

Example: Log the entire contents of a `Buffer`

```js
const buf = Buffer.from('buffer');

// Prints:
//   [0, 98]
//   [1, 117]
//   [2, 102]
//   [3, 102]
//   [4, 101]
//   [5, 114]
for (const pair of buf.entries()) {
  console.log(pair);
}
```

### buf.equals(otherBuffer)

<!-- YAML
added: v0.11.13
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The arguments can now be `Uint8Array`s.
-->

* `otherBuffer` {Buffer} A `Buffer` or [`Uint8Array`] to compare to.
* Restituisce: {boolean}

Returns `true` if both `buf` and `otherBuffer` have exactly the same bytes, `false` otherwise.

Esempi:

```js
const buf1 = Buffer.from('ABC');
const buf2 = Buffer.from('414243', 'hex');
const buf3 = Buffer.from('ABCD');

// Prints: true
console.log(buf1.equals(buf2));

// Prints: false
console.log(buf1.equals(buf3));
```

### buf.fill(value\[, offset[, end]\]\[, encoding\])

<!-- YAML
added: v0.5.0
changes:

  - version: v5.7.0
    pr-url: https://github.com/nodejs/node/pull/4935
    description: The `encoding` parameter is supported now.
-->

* `value` {string|Buffer|integer} The value to fill `buf` with.
* `offset` {integer} Numero di byte da saltare prima di iniziare a riempire `buf`. **Default:** `0`.
* `end` {integer} Dove smettere di riempire `buf` (non incluso). **Default:** [`buf.length`].
* `encoding` {string} Se `value` è una stringa, questa è la sua codifica. **Default:** `'utf8'`.
* Restituisce: {Buffer} Un riferimento a `buf`.

Riempie `buf` con il `value` specificato. If the `offset` and `end` are not given, the entire `buf` will be filled. This is meant to be a small simplification to allow the creation and filling of a `Buffer` to be done on a single line.

Example: Fill a `Buffer` with the ASCII character `'h'`

```js
const b = Buffer.allocUnsafe(50).fill('h');

// Prints: hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
console.log(b.toString());
```

`value` is coerced to a `uint32` value if it is not a String or Integer.

If the final write of a `fill()` operation falls on a multi-byte character, then only the first bytes of that character that fit into `buf` are written.

Example: Fill a `Buffer` with a two-byte character

```js
// Prints: <Buffer c8 a2 c8>
console.log(Buffer.allocUnsafe(3).fill('\u0222'));
```

If `value` contains invalid characters, it is truncated.

If no valid fill data remains, then the buffer is either zero-filled or no filling is performed, depending on the input type. That behavior is dictated by compatibility reasons and was changed to throwing an exception in Node.js v10, so it's not recommended to rely on that.

```js
const buf = Buffer.allocUnsafe(5);
// Prints: <Buffer 61 61 61 61 61>
console.log(buf.fill('a'));
// Prints: <Buffer aa aa aa aa aa>
console.log(buf.fill('aazz', 'hex'));
// Prints: <Buffer aa aa aa aa aa>
console.log(buf.fill('zz', 'hex'));
```

### buf.includes(value\[, byteOffset\]\[, encoding\])

<!-- YAML
added: v5.3.0
-->

* `value` {string|Buffer|integer} Su cosa eseguire la ricerca.
* `byteOffset` {integer} Dove iniziare la ricerca in `buf`. **Default:** `0`.
* `encoding` {string} Se `value` è una stringa, questa è la sua codifica. **Default:** `'utf8'`.
* Restituisce: {boolean} `true` se `value` è stato trovato in `buf`, in caso contrario `false`.

Equivalente a [`buf.indexOf() !== -1`][`buf.indexOf()`].

Esempi:

```js
const buf = Buffer.from('this is a buffer');

// Prints: true
console.log(buf.includes('this'));

// Prints: true
console.log(buf.includes('is'));

// Prints: true
console.log(buf.includes(Buffer.from('a buffer')));

// Prints: true
// (97 is the decimal ASCII value for 'a')
console.log(buf.includes(97));

// Prints: false
console.log(buf.includes(Buffer.from('a buffer example')));

// Prints: true
console.log(buf.includes(Buffer.from('a buffer example').slice(0, 8)));

// Prints: false
console.log(buf.includes('this', 4));
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

* `value` {string|Buffer|Uint8Array|integer} Su cosa eseguire la ricerca.
* `byteOffset` {integer} Dove iniziare la ricerca in `buf`. **Default:** `0`.
* `encoding` {string} If `value` is a string, this is the encoding used to determine the binary representation of the string that will be searched for in `buf`. **Default:** `'utf8'`.
* Returns: {integer} The index of the first occurrence of `value` in `buf`, or `-1` if `buf` does not contain `value`.

Se `value` è:

* a string, `value` is interpreted according to the character encoding in `encoding`.
* un `Buffer` oppure un [`Uint8Array`], `value` sarà usato nella sua interezza. Per confrontare un `Buffer` parziale, utilizza [`buf.slice()`].
* a number, `value` will be interpreted as an unsigned 8-bit integer value between `0` and `255`.

Esempi:

```js
const buf = Buffer.from('this is a buffer');

// Prints: 0
console.log(buf.indexOf('this'));

// Prints: 2
console.log(buf.indexOf('is'));

// Prints: 8
console.log(buf.indexOf(Buffer.from('a buffer')));

// Prints: 8
// (97 is the decimal ASCII value for 'a')
console.log(buf.indexOf(97));

// Prints: -1
console.log(buf.indexOf(Buffer.from('a buffer example')));

// Prints: 8
console.log(buf.indexOf(Buffer.from('a buffer example').slice(0, 8)));

const utf16Buffer = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'ucs2');

// Prints: 4
console.log(utf16Buffer.indexOf('\u03a3', 0, 'ucs2'));

// Prints: 6
console.log(utf16Buffer.indexOf('\u03a3', -4, 'ucs2'));
```

If `value` is not a string, number, or `Buffer`, this method will throw a `TypeError`. If `value` is a number, it will be coerced to a valid byte value, an integer between 0 and 255.

Se `byteOffset` non è un numero, sarà forzato ad un numero. Any arguments that coerce to `NaN` or 0, like `{}`, `[]`, `null` or `undefined`, will search the whole buffer. This behavior matches [`String#indexOf()`].

```js
const b = Buffer.from('abcdef');

// Passa un valore che è un numero, ma non un byte valido
// Stampa: 2, equivalente alla ricerca di 99 o 'c'
console.log(b.indexOf(99.9));
console.log(b.indexOf(256 + 99));

// Passa un byteOffset che forza il valore a NaN oppure 0
// Stampa: 1, eseguendo la ricerca sull'intero buffer
console.log(b.indexOf('b', undefined));
console.log(b.indexOf('b', {}));
console.log(b.indexOf('b', null));
console.log(b.indexOf('b', []));
```

If `value` is an empty string or empty `Buffer` and `byteOffset` is less than `buf.length`, `byteOffset` will be returned. If `value` is empty and `byteOffset` is at least `buf.length`, `buf.length` will be returned.

### buf.keys()

<!-- YAML
added: v1.1.0
-->

* Restituisce: {Iterator}

Crea e restituisce un [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) delle `buf` key (indici).

Esempio:

```js
const buf = Buffer.from('buffer');

// Prints:
//   0
//   1
//   2
//   3
//   4
//   5
for (const key of buf.keys()) {
  console.log(key);
}
```

### buf.lastIndexOf(value\[, byteOffset\]\[, encoding\])

<!-- YAML
added: v6.0.0
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `value` can now be a `Uint8Array`.
-->

* `value` {string|Buffer|Uint8Array|integer} Su cosa eseguire la ricerca.
* `byteOffset` {integer} Dove iniziare la ricerca in `buf`. **Default:** [`buf.length`]`- 1`.
* `encoding` {string} If `value` is a string, this is the encoding used to determine the binary representation of the string that will be searched for in `buf`. **Default:** `'utf8'`.
* Returns: {integer} The index of the last occurrence of `value` in `buf`, or `-1` if `buf` does not contain `value`.

Identical to [`buf.indexOf()`], except the last occurrence of `value` is found rather than the first occurrence.

Esempi:

```js
const buf = Buffer.from('this buffer is a buffer');

// Prints: 0
console.log(buf.lastIndexOf('this'));

// Prints: 17
console.log(buf.lastIndexOf('buffer'));

// Prints: 17
console.log(buf.lastIndexOf(Buffer.from('buffer')));

// Prints: 15
// (97 is the decimal ASCII value for 'a')
console.log(buf.lastIndexOf(97));

// Prints: -1
console.log(buf.lastIndexOf(Buffer.from('yolo')));

// Prints: 5
console.log(buf.lastIndexOf('buffer', 5));

// Prints: -1
console.log(buf.lastIndexOf('buffer', 4));

const utf16Buffer = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'ucs2');

// Prints: 6
console.log(utf16Buffer.lastIndexOf('\u03a3', undefined, 'ucs2'));

// Prints: 4
console.log(utf16Buffer.lastIndexOf('\u03a3', -5, 'ucs2'));
```

If `value` is not a string, number, or `Buffer`, this method will throw a `TypeError`. If `value` is a number, it will be coerced to a valid byte value, an integer between 0 and 255.

Se `byteOffset` non è un numero, sarà forzato ad un numero. Any arguments that coerce to `NaN`, like `{}` or `undefined`, will search the whole buffer. Questo comportamento corrisponde a [`String#lastIndexOf()`].

```js
const b = Buffer.from('abcdef');

// Passa un valore che è un numero, ma non un byte valido
// Stampa: 2, equivalente alla ricerca di 99 o 'c'
console.log(b.lastIndexOf(99.9));
console.log(b.lastIndexOf(256 + 99));

// Passa un byteOffset che forza il valore a NaN
// Stampa: 1, eseguendo la ricerca sull'intero buffer
console.log(b.lastIndexOf('b', undefined));
console.log(b.lastIndexOf('b', {}));

// Passing a byteOffset that coerces to 0
// Prints: -1, equivalent to passing 0
console.log(b.lastIndexOf('b', null));
console.log(b.lastIndexOf('b', []));
```

Se `value` è una stringa vuota oppure un `Buffer` vuoto, verrà restituito `byteOffset`.

### buf.length

<!-- YAML
added: v0.1.90
-->

* {integer}

Restituisce la quantità di memoria allocata per `buf` in byte. Note that this does not necessarily reflect the amount of "usable" data within `buf`.

Example: Create a `Buffer` and write a shorter ASCII string to it

```js
const buf = Buffer.alloc(1234);

// Prints: 1234
console.log(buf.length);

buf.write('some string', 0, 'ascii');

// Prints: 1234
console.log(buf.length);
```

While the `length` property is not immutable, changing the value of `length` can result in undefined and inconsistent behavior. Applications that wish to modify the length of a `Buffer` should therefore treat `length` as read-only and use [`buf.slice()`] to create a new `Buffer`.

Esempi:

```js
let buf = Buffer.allocUnsafe(10);

buf.write('abcdefghj', 0, 'ascii');

// Prints: 10
console.log(buf.length);

buf = buf.slice(0, 5);

// Prints: 5
console.log(buf.length);
```

### buf.parent

<!-- YAML
deprecated: v8.0.0
-->

> Stabilità: 0 - Obsoleto: Utilizza invece [`buf.buffer`].

La proprietà `buf.parent` è un alias obsoleto di `buf.buffer`.

### buf.readDoubleBE(offset[, noAssert])

### buf.readDoubleLE(offset[, noAssert])

<!-- YAML
added: v0.11.15
-->

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy: `0 <= offset <= buf.length - 8`.
* `noAssert` {boolean} Skip `offset` validation? **Default:** `false`
* Restituisce: {number}

Reads a 64-bit double from `buf` at the specified `offset` with specified endian format (`readDoubleBE()` returns big endian, `readDoubleLE()` returns little endian).

Setting `noAssert` to `true` allows `offset` to be beyond the end of `buf`, but the resulting behavior is undefined.

Esempi:

```js
const buf = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]);

// Prints: 8.20788039913184e-304
console.log(buf.readDoubleBE());

// Prints: 5.447603722011605e-270
console.log(buf.readDoubleLE());

// Throws an exception: RangeError: Index out of range
console.log(buf.readDoubleLE(1));

// Warning: reads passed end of buffer!
// This will result in a segmentation fault! Don't do this!
console.log(buf.readDoubleLE(1, true));
```

### buf.readFloatBE(offset[, noAssert])

### buf.readFloatLE(offset[, noAssert])

<!-- YAML
added: v0.11.15
-->

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy: `0 <= offset <= buf.length - 4`.
* `noAssert` {boolean} Skip `offset` validation? **Default:** `false`
* Restituisce: {number}

Reads a 32-bit float from `buf` at the specified `offset` with specified endian format (`readFloatBE()` returns big endian, `readFloatLE()` returns little endian).

Setting `noAssert` to `true` allows `offset` to be beyond the end of `buf`, but the resulting behavior is undefined.

Esempi:

```js
const buf = Buffer.from([1, 2, 3, 4]);

// Prints: 2.387939260590663e-38
console.log(buf.readFloatBE());

// Prints: 1.539989614439558e-36
console.log(buf.readFloatLE());

// Throws an exception: RangeError: Index out of range
console.log(buf.readFloatLE(1));

// Warning: reads passed end of buffer!
// This will result in a segmentation fault! Don't do this!
console.log(buf.readFloatLE(1, true));
```

### buf.readInt8(offset[, noAssert])

<!-- YAML
added: v0.5.0
-->

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy: `0 <= offset <= buf.length - 1`.
* `noAssert` {boolean} Skip `offset` validation? **Default:** `false`
* Restituisce: {integer}

Legge un signed integer (numero intero con segno) a 8 bit da `buf` all'`offset` specificato.

Setting `noAssert` to `true` allows `offset` to be beyond the end of `buf`, but the resulting behavior is undefined.

Gli integer (numeri interi) letti da un `Buffer` sono interpretati come valori signed in complemento a due.

Esempi:

```js
const buf = Buffer.from([-1, 5]);

// Prints: -1
console.log(buf.readInt8(0));

// Prints: 5
console.log(buf.readInt8(1));

// Throws an exception: RangeError: Index out of range
console.log(buf.readInt8(2));
```

### buf.readInt16BE(offset[, noAssert])

### buf.readInt16LE(offset[, noAssert])

<!-- YAML
added: v0.5.5
-->

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy: `0 <= offset <= buf.length - 2`.
* `noAssert` {boolean} Skip `offset` validation? **Default:** `false`
* Restituisce: {integer}

Reads a signed 16-bit integer from `buf` at the specified `offset` with the specified endian format (`readInt16BE()` returns big endian, `readInt16LE()` returns little endian).

Setting `noAssert` to `true` allows `offset` to be beyond the end of `buf`, but the resulting behavior is undefined.

Gli integer (numeri interi) letti da un `Buffer` sono interpretati come valori signed in complemento a due.

Esempi:

```js
const buf = Buffer.from([0, 5]);

// Prints: 5
console.log(buf.readInt16BE());

// Prints: 1280
console.log(buf.readInt16LE());

// Throws an exception: RangeError: Index out of range
console.log(buf.readInt16LE(1));
```

### buf.readInt32BE(offset[, noAssert])

### buf.readInt32LE(offset[, noAssert])

<!-- YAML
added: v0.5.5
-->

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy: `0 <= offset <= buf.length - 4`.
* `noAssert` {boolean} Skip `offset` validation? **Default:** `false`
* Restituisce: {integer}

Reads a signed 32-bit integer from `buf` at the specified `offset` with the specified endian format (`readInt32BE()` returns big endian, `readInt32LE()` returns little endian).

Setting `noAssert` to `true` allows `offset` to be beyond the end of `buf`, but the resulting behavior is undefined.

Gli integer (numeri interi) letti da un `Buffer` sono interpretati come valori signed in complemento a due.

Esempi:

```js
const buf = Buffer.from([0, 0, 0, 5]);

// Prints: 5
console.log(buf.readInt32BE());

// Prints: 83886080
console.log(buf.readInt32LE());

// Throws an exception: RangeError: Index out of range
console.log(buf.readInt32LE(1));
```

### buf.readIntBE(offset, byteLength[, noAssert])

### buf.readIntLE(offset, byteLength[, noAssert])

<!-- YAML
added: v0.11.15
-->

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy: `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Numero di byte da leggere. Must satisfy: `0 < byteLength <= 6`.
* `noAssert` {boolean} Skip `offset` and `byteLength` validation? **Default:** `false`.
* Restituisce: {integer}

Reads `byteLength` number of bytes from `buf` at the specified `offset` and interprets the result as a two's complement signed value. Supporta fino a 48 bit di accuracy (precisione).

Setting `noAssert` to `true` allows `offset` to be beyond the end of `buf`, but the resulting behavior is undefined.

Esempi:

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab]);

// Prints: -546f87a9cbee
console.log(buf.readIntLE(0, 6).toString(16));

// Prints: 1234567890ab
console.log(buf.readIntBE(0, 6).toString(16));

// Throws an exception: RangeError: Index out of range
console.log(buf.readIntBE(1, 6).toString(16));
```

### buf.readUInt8(offset[, noAssert])

<!-- YAML
added: v0.5.0
-->

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy: `0 <= offset <= buf.length - 1`.
* `noAssert` {boolean} Skip `offset` validation? **Default:** `false`
* Restituisce: {integer}

Legge un unsigned integer a 8 bit da `buf` all'`offset` specificato.

Setting `noAssert` to `true` allows `offset` to be beyond the end of `buf`, but the resulting behavior is undefined.

Esempi:

```js
const buf = Buffer.from([1, -2]);

// Prints: 1
console.log(buf.readUInt8(0));

// Prints: 254
console.log(buf.readUInt8(1));

// Throws an exception: RangeError: Index out of range
console.log(buf.readUInt8(2));
```

### buf.readUInt16BE(offset[, noAssert])

### buf.readUInt16LE(offset[, noAssert])

<!-- YAML
added: v0.5.5
-->

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy: `0 <= offset <= buf.length - 2`.
* `noAssert` {boolean} Skip `offset` validation? **Default:** `false`
* Restituisce: {integer}

Reads an unsigned 16-bit integer from `buf` at the specified `offset` with specified endian format (`readUInt16BE()` returns big endian, `readUInt16LE()` returns little endian).

Setting `noAssert` to `true` allows `offset` to be beyond the end of `buf`, but the resulting behavior is undefined.

Esempi:

```js
const buf = Buffer.from([0x12, 0x34, 0x56]);

// Prints: 1234
console.log(buf.readUInt16BE(0).toString(16));

// Prints: 3412
console.log(buf.readUInt16LE(0).toString(16));

// Prints: 3456
console.log(buf.readUInt16BE(1).toString(16));

// Prints: 5634
console.log(buf.readUInt16LE(1).toString(16));

// Throws an exception: RangeError: Index out of range
console.log(buf.readUInt16LE(2).toString(16));
```

### buf.readUInt32BE(offset[, noAssert])

### buf.readUInt32LE(offset[, noAssert])

<!-- YAML
added: v0.5.5
-->

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy: `0 <= offset <= buf.length - 4`.
* `noAssert` {boolean} Skip `offset` validation? **Default:** `false`
* Restituisce: {integer}

Reads an unsigned 32-bit integer from `buf` at the specified `offset` with specified endian format (`readUInt32BE()` returns big endian, `readUInt32LE()` returns little endian).

Setting `noAssert` to `true` allows `offset` to be beyond the end of `buf`, but the resulting behavior is undefined.

Esempi:

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78]);

// Prints: 12345678
console.log(buf.readUInt32BE(0).toString(16));

// Prints: 78563412
console.log(buf.readUInt32LE(0).toString(16));

// Throws an exception: RangeError: Index out of range
console.log(buf.readUInt32LE(1).toString(16));
```

### buf.readUIntBE(offset, byteLength[, noAssert])

### buf.readUIntLE(offset, byteLength[, noAssert])

<!-- YAML
added: v0.11.15
-->

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy: `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Numero di byte da leggere. Must satisfy: `0 < byteLength <= 6`.
* `noAssert` {boolean} Skip `offset` and `byteLength` validation? **Default:** `false`
* Restituisce: {integer}

Reads `byteLength` number of bytes from `buf` at the specified `offset` and interprets the result as an unsigned integer. Supporta fino a 48 bit di accuracy (precisione).

Setting `noAssert` to `true` allows `offset` to be beyond the end of `buf`, but the resulting behavior is undefined.

Esempi:

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab]);

// Prints: 1234567890ab
console.log(buf.readUIntBE(0, 6).toString(16));

// Prints: ab9078563412
console.log(buf.readUIntLE(0, 6).toString(16));

// Throws an exception: RangeError: Index out of range
console.log(buf.readUIntBE(1, 6).toString(16));
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

* `start` {integer} Dove inizierà il nuovo `Buffer`. **Default:** `0`.
* `end` {integer} Dove terminerà il nuovo `Buffer` (non incluso). **Default:** [`buf.length`].
* Restituisce: {Buffer}

Returns a new `Buffer` that references the same memory as the original, but offset and cropped by the `start` and `end` indices.

Specifying `end` greater than [`buf.length`] will return the same result as that of `end` equal to [`buf.length`].

*Note*: Modifying the new `Buffer` slice will modify the memory in the original `Buffer` because the allocated memory of the two objects overlap.

Example: Create a `Buffer` with the ASCII alphabet, take a slice, and then modify one byte from the original `Buffer`

```js
const buf1 = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 is the decimal ASCII value for 'a'
  buf1[i] = i + 97;
}

const buf2 = buf1.slice(0, 3);

// Prints: abc
console.log(buf2.toString('ascii', 0, buf2.length));

buf1[0] = 33;

// Prints: !bc
console.log(buf2.toString('ascii', 0, buf2.length));
```

Specifying negative indexes causes the slice to be generated relative to the end of `buf` rather than the beginning.

Esempi:

```js
const buf = Buffer.from('buffer');

// Prints: buffe
// (Equivalent to buf.slice(0, 5))
console.log(buf.slice(-6, -1).toString());

// Prints: buff
// (Equivalent to buf.slice(0, 4))
console.log(buf.slice(-6, -2).toString());

// Prints: uff
// (Equivalent to buf.slice(1, 4))
console.log(buf.slice(-5, -2).toString());
```

### buf.swap16()

<!-- YAML
added: v5.10.0
-->

* Restituisce: {Buffer} Un riferimento a `buf`.

Interprets `buf` as an array of unsigned 16-bit integers and swaps the byte order *in-place*. Throws a `RangeError` if [`buf.length`] is not a multiple of 2.

Esempi:

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

// Prints: <Buffer 01 02 03 04 05 06 07 08>
console.log(buf1);

buf1.swap16();

// Prints: <Buffer 02 01 04 03 06 05 08 07>
console.log(buf1);

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

// Throws an exception: RangeError: Buffer size must be a multiple of 16-bits
buf2.swap16();
```

### buf.swap32()

<!-- YAML
added: v5.10.0
-->

* Restituisce: {Buffer} Un riferimento a `buf`.

Interprets `buf` as an array of unsigned 32-bit integers and swaps the byte order *in-place*. Throws a `RangeError` if [`buf.length`] is not a multiple of 4.

Esempi:

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

// Prints: <Buffer 01 02 03 04 05 06 07 08>
console.log(buf1);

buf1.swap32();

// Prints: <Buffer 04 03 02 01 08 07 06 05>
console.log(buf1);

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

// Throws an exception: RangeError: Buffer size must be a multiple of 32-bits
buf2.swap32();
```

### buf.swap64()

<!-- YAML
added: v6.3.0
-->

* Restituisce: {Buffer} Un riferimento a `buf`.

Interprets `buf` as an array of 64-bit numbers and swaps the byte order *in-place*. Throws a `RangeError` if [`buf.length`] is not a multiple of 8.

Esempi:

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

// Prints: <Buffer 01 02 03 04 05 06 07 08>
console.log(buf1);

buf1.swap64();

// Prints: <Buffer 08 07 06 05 04 03 02 01>
console.log(buf1);

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

// Throws an exception: RangeError: Buffer size must be a multiple of 64-bits
buf2.swap64();
```

Da notare che JavaScript non può codificare degli integer (numeri interi) a 64 bit. This method is intended for working with 64-bit floats.

### buf.toJSON()

<!-- YAML
added: v0.9.2
-->

* Restituisce: {Object}

Restituisce una rappresentazione JSON di `buf`. [`JSON.stringify()`] implicitly calls this function when stringifying a `Buffer` instance.

Esempio:

```js
const buf = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5]);
const json = JSON.stringify(buf);

// Prints: {"type":"Buffer","data":[1,2,3,4,5]}
console.log(json);

const copy = JSON.parse(json, (key, value) => {
  return value && value.type === 'Buffer' ?
    Buffer.from(value.data) :
    value;
});

// Prints: <Buffer 01 02 03 04 05>
console.log(copy);
```

### buf.toString([encoding[, start[, end]]])

<!-- YAML
added: v0.1.90
-->

* `encoding` {string} The character encoding to decode to. **Default:** `'utf8'`.
* `start` {integer} Il byte offset da cui iniziare la decodifica. **Default:** `0`.
* `end` {integer} Il byte offset a cui concludere la decodifica (non incluso). **Default:** [`buf.length`].
* Restituisce: {string}

Decodes `buf` to a string according to the specified character encoding in `encoding`. `start` ed `end` possono essere passati per decodificare solo un sottoinsieme di `buf`.

The maximum length of a string instance (in UTF-16 code units) is available as [`buffer.constants.MAX_STRING_LENGTH`][].

Esempi:

```js
const buf1 = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 is the decimal ASCII value for 'a'
  buf1[i] = i + 97;
}

// Prints: abcdefghijklmnopqrstuvwxyz
console.log(buf1.toString('ascii'));

// Prints: abcde
console.log(buf1.toString('ascii', 0, 5));

const buf2 = Buffer.from('tést');

// Prints: 74c3a97374
console.log(buf2.toString('hex'));

// Prints: té
console.log(buf2.toString('utf8', 0, 3));

// Prints: té
console.log(buf2.toString(undefined, 0, 3));
```

### buf.values()

<!-- YAML
added: v1.1.0
-->

* Restituisce: {Iterator}

Crea e restituisce un [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) per i valori di `buf` (in byte). This function is called automatically when a `Buffer` is used in a `for..of` statement.

Esempi:

```js
const buf = Buffer.from('buffer');

// Prints:
//   98
//   117
//   102
//   102
//   101
//   114
for (const value of buf.values()) {
  console.log(value);
}

// Prints:
//   98
//   117
//   102
//   102
//   101
//   114
for (const value of buf) {
  console.log(value);
}
```

### buf.write(string\[, offset[, length]\]\[, encoding\])

<!-- YAML
added: v0.1.90
-->

* `string` {string} String to be written to `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere `string`. **Default:** `0`.
* `length` {integer} Numero di byte da scrivere. **Default:** `buf.length - offset`.
* `encoding` {string} La codifica dei caratteri di `string`. **Default:** `'utf8'`.
* Restituisce: {integer} Numero di byte scritti.

Writes `string` to `buf` at `offset` according to the character encoding in `encoding`. Il parametro `length` è il numero di byte da scrivere. If `buf` did not contain enough space to fit the entire string, only a partial amount of `string` will be written. Tuttavia, i caratteri parzialmente codificati non verranno scritti.

Esempio:

```js
const buf = Buffer.allocUnsafe(256);

const len = buf.write('\u00bd + \u00bc = \u00be', 0);

// Prints: 12 bytes: ½ + ¼ = ¾
console.log(`${len} bytes: ${buf.toString('utf8', 0, len)}`);
```

### buf.writeDoubleBE(value, offset[, noAssert])

### buf.writeDoubleLE(value, offset[, noAssert])

<!-- YAML
added: v0.11.15
-->

* `value` {number} Numero da scrivere su `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy: `0 <= offset <= buf.length - 8`.
* `noAssert` {boolean} Skip `value` and `offset` validation? **Default:** `false`
* Restituisce: {integer} `offset` più il numero di byte scritti.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeDoubleBE()` writes big endian, `writeDoubleLE()` writes little endian). `value` *dovrebbe* essere un double a 64 bit valido. Behavior is undefined when `value` is anything other than a 64-bit double.

Setting `noAssert` to `true` allows the encoded form of `value` to extend beyond the end of `buf`, but the resulting behavior is undefined.

Esempi:

```js
const buf = Buffer.allocUnsafe(8);

buf.writeDoubleBE(0xdeadbeefcafebabe, 0);

// Prints: <Buffer 43 eb d5 b7 dd f9 5f d7>
console.log(buf);

buf.writeDoubleLE(0xdeadbeefcafebabe, 0);

// Prints: <Buffer d7 5f f9 dd b7 d5 eb 43>
console.log(buf);
```

### buf.writeFloatBE(value, offset[, noAssert])

### buf.writeFloatLE(value, offset[, noAssert])

<!-- YAML
added: v0.11.15
-->

* `value` {number} Numero da scrivere su `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy: `0 <= offset <= buf.length - 4`.
* `noAssert` {boolean} Skip `value` and `offset` validation? **Default:** `false`
* Restituisce: {integer} `offset` più il numero di byte scritti.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeFloatBE()` writes big endian, `writeFloatLE()` writes little endian). `value` *dovrebbe* essere un float a 32 bit valido. Behavior is undefined when `value` is anything other than a 32-bit float.

Setting `noAssert` to `true` allows the encoded form of `value` to extend beyond the end of `buf`, but the resulting behavior is undefined.

Esempi:

```js
const buf = Buffer.allocUnsafe(4);

buf.writeFloatBE(0xcafebabe, 0);

// Prints: <Buffer 4f 4a fe bb>
console.log(buf);

buf.writeFloatLE(0xcafebabe, 0);

// Prints: <Buffer bb fe 4a 4f>
console.log(buf);
```

### buf.writeInt8(value, offset[, noAssert])

<!-- YAML
added: v0.5.0
-->

* `value` {integer} Numero da scrivere su `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy: `0 <= offset <= buf.length - 1`.
* `noAssert` {boolean} Skip `value` and `offset` validation? **Default:** `false`
* Restituisce: {integer} `offset` più il numero di byte scritti.

Scrive `value` da `buf` all'`offset` specificato. `value` *dovrebbe* essere un signed integer (numero intero con segno) a 8 bit valido. Behavior is undefined when `value` is anything other than a signed 8-bit integer.

Setting `noAssert` to `true` allows the encoded form of `value` to extend beyond the end of `buf`, but the resulting behavior is undefined.

`value` è interpretato e scritto come signed integer di un complemento a due.

Esempi:

```js
const buf = Buffer.allocUnsafe(2);

buf.writeInt8(2, 0);
buf.writeInt8(-2, 1);

// Prints: <Buffer 02 fe>
console.log(buf);
```

### buf.writeInt16BE(value, offset[, noAssert])

### buf.writeInt16LE(value, offset[, noAssert])

<!-- YAML
added: v0.5.5
-->

* `value` {integer} Numero da scrivere su `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy: `0 <= offset <= buf.length - 2`.
* `noAssert` {boolean} Skip `value` and `offset` validation? **Default:** `false`
* Restituisce: {integer} `offset` più il numero di byte scritti.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeInt16BE()` writes big endian, `writeInt16LE()` writes little endian). `value` *dovrebbe* essere un signed integer (numero intero con segno) a 16 bit valido. Behavior is undefined when `value` is anything other than a signed 16-bit integer.

Setting `noAssert` to `true` allows the encoded form of `value` to extend beyond the end of `buf`, but the resulting behavior is undefined.

`value` è interpretato e scritto come signed integer di un complemento a due.

Esempi:

```js
const buf = Buffer.allocUnsafe(4);

buf.writeInt16BE(0x0102, 0);
buf.writeInt16LE(0x0304, 2);

// Prints: <Buffer 01 02 04 03>
console.log(buf);
```

### buf.writeInt32BE(value, offset[, noAssert])

### buf.writeInt32LE(value, offset[, noAssert])

<!-- YAML
added: v0.5.5
-->

* `value` {integer} Numero da scrivere su `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy: `0 <= offset <= buf.length - 4`.
* `noAssert` {boolean} Skip `value` and `offset` validation? **Default:** `false`
* Restituisce: {integer} `offset` più il numero di byte scritti.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeInt32BE()` writes big endian, `writeInt32LE()` writes little endian). `value` *dovrebbe* essere un signed integer (numero intero con segno) a 32 bit valido. Behavior is undefined when `value` is anything other than a signed 32-bit integer.

Setting `noAssert` to `true` allows the encoded form of `value` to extend beyond the end of `buf`, but the resulting behavior is undefined.

`value` è interpretato e scritto come signed integer di un complemento a due.

Esempi:

```js
const buf = Buffer.allocUnsafe(8);

buf.writeInt32BE(0x01020304, 0);
buf.writeInt32LE(0x05060708, 4);

// Prints: <Buffer 01 02 03 04 08 07 06 05>
console.log(buf);
```

### buf.writeIntBE(value, offset, byteLength[, noAssert])

### buf.writeIntLE(value, offset, byteLength[, noAssert])

<!-- YAML
added: v0.11.15
-->

* `value` {integer} Numero da scrivere su `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy: `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Numero di byte da scrivere. Must satisfy: `0 < byteLength <= 6`.
* `noAssert` {boolean} Skip `value`, `offset`, and `byteLength` validation? **Default:** `false`
* Restituisce: {integer} `offset` più il numero di byte scritti.

Scrive `byteLength` byte di `value` da `buf` all'`offset` specificato. Supporta fino a 48 bit di accuracy (precisione). Behavior is undefined when `value` is anything other than a signed integer.

Setting `noAssert` to `true` allows the encoded form of `value` to extend beyond the end of `buf`, but the resulting behavior is undefined.

Esempi:

```js
const buf = Buffer.allocUnsafe(6);

buf.writeIntBE(0x1234567890ab, 0, 6);

// Prints: <Buffer 12 34 56 78 90 ab>
console.log(buf);

buf.writeIntLE(0x1234567890ab, 0, 6);

// Prints: <Buffer ab 90 78 56 34 12>
console.log(buf);
```

### buf.writeUInt8(value, offset[, noAssert])

<!-- YAML
added: v0.5.0
-->

* `value` {integer} Numero da scrivere su `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy: `0 <= offset <= buf.length - 1`.
* `noAssert` {boolean} Skip `value` and `offset` validation? **Default:** `false`
* Restituisce: {integer} `offset` più il numero di byte scritti.

Scrive `value` da `buf` all'`offset` specificato. `value` *should* be a valid unsigned 8-bit integer. Behavior is undefined when `value` is anything other than an unsigned 8-bit integer.

Setting `noAssert` to `true` allows the encoded form of `value` to extend beyond the end of `buf`, but the resulting behavior is undefined.

Esempi:

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt8(0x3, 0);
buf.writeUInt8(0x4, 1);
buf.writeUInt8(0x23, 2);
buf.writeUInt8(0x42, 3);

// Prints: <Buffer 03 04 23 42>
console.log(buf);
```

### buf.writeUInt16BE(value, offset[, noAssert])

### buf.writeUInt16LE(value, offset[, noAssert])

<!-- YAML
added: v0.5.5
-->

* `value` {integer} Numero da scrivere su `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy: `0 <= offset <= buf.length - 2`.
* `noAssert` {boolean} Skip `value` and `offset` validation? **Default:** `false`
* Restituisce: {integer} `offset` più il numero di byte scritti.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeUInt16BE()` writes big endian, `writeUInt16LE()` writes little endian). `value` dovrebbe essere un numero intero senza segno valido a 16 bit. Behavior is undefined when `value` is anything other than an unsigned 16-bit integer.

Setting `noAssert` to `true` allows the encoded form of `value` to extend beyond the end of `buf`, but the resulting behavior is undefined.

Esempi:

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt16BE(0xdead, 0);
buf.writeUInt16BE(0xbeef, 2);

// Prints: <Buffer de ad be ef>
console.log(buf);

buf.writeUInt16LE(0xdead, 0);
buf.writeUInt16LE(0xbeef, 2);

// Prints: <Buffer ad de ef be>
console.log(buf);
```

### buf.writeUInt32BE(value, offset[, noAssert])

### buf.writeUInt32LE(value, offset[, noAssert])

<!-- YAML
added: v0.5.5
-->

* `value` {integer} Numero da scrivere su `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy: `0 <= offset <= buf.length - 4`.
* `noAssert` {boolean} Skip `value` and `offset` validation? **Default:** `false`
* Restituisce: {integer} `offset` più il numero di byte scritti.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeUInt32BE()` writes big endian, `writeUInt32LE()` writes little endian). `value` dovrebbe essere un numero intero senza segno valido a 32 bit. Behavior is undefined when `value` is anything other than an unsigned 32-bit integer.

Setting `noAssert` to `true` allows the encoded form of `value` to extend beyond the end of `buf`, but the resulting behavior is undefined.

Esempi:

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt32BE(0xfeedface, 0);

// Prints: <Buffer fe ed fa ce>
console.log(buf);

buf.writeUInt32LE(0xfeedface, 0);

// Prints: <Buffer ce fa ed fe>
console.log(buf);
```

### buf.writeUIntBE(value, offset, byteLength[, noAssert])

### buf.writeUIntLE(value, offset, byteLength[, noAssert])

<!-- YAML
added: v0.5.5
-->

* `value` {integer} Numero da scrivere su `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy: `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Numero di byte da scrivere. Must satisfy: `0 < byteLength <= 6`.
* `noAssert` {boolean} Skip `value`, `offset`, and `byteLength` validation? **Default:** `false`.
* Restituisce: {integer} `offset` più il numero di byte scritti.

Scrive `byteLength` byte di `value` da `buf` all'`offset` specificato. Supporta fino a 48 bit di accuracy (precisione). Behavior is undefined when `value` is anything other than an unsigned integer.

Setting `noAssert` to `true` allows the encoded form of `value` to extend beyond the end of `buf`, but the resulting behavior is undefined.

Esempi:

```js
const buf = Buffer.allocUnsafe(6);

buf.writeUIntBE(0x1234567890ab, 0, 6);

// Prints: <Buffer 12 34 56 78 90 ab>
console.log(buf);

buf.writeUIntLE(0x1234567890ab, 0, 6);

// Prints: <Buffer ab 90 78 56 34 12>
console.log(buf);
```

## buffer.INSPECT_MAX_BYTES

<!-- YAML
added: v0.5.4
-->

* {integer} **Default:** `50`

Returns the maximum number of bytes that will be returned when `buf.inspect()` is called. Questo può essere sovrascritto dai moduli utente. See [`util.inspect()`] for more details on `buf.inspect()` behavior.

Note that this is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## buffer.kMaxLength

<!-- YAML
added: v3.0.0
-->

* {integer} La dimensione più grande consentita per una singola istanza `Buffer`.

Un alias per [`buffer.constants.MAX_LENGTH]`[]

Note that this is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## buffer.transcode(source, fromEnc, toEnc)

<!-- YAML
added: v7.1.0
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `source` parameter can now be a `Uint8Array`.
-->

* `source` {Buffer|Uint8Array} Un'istanza `Buffer` o [`Uint8Array`].
* `fromEnc` {string} La codifica corrente.
* `toEnc` {string} La codifica di destinazione.

Re-encodes the given `Buffer` or `Uint8Array` instance from one character encoding to another. Restituisce una nuova istanza `Buffer`.

Throws if the `fromEnc` or `toEnc` specify invalid character encodings or if conversion from `fromEnc` to `toEnc` is not permitted.

The transcoding process will use substitution characters if a given byte sequence cannot be adequately represented in the target encoding. Ad esempio:

```js
const buffer = require('buffer');

const newBuf = buffer.transcode(Buffer.from('€'), 'utf8', 'ascii');
console.log(newBuf.toString('ascii'));
// Stampa: '?'
```

Because the Euro (`€`) sign is not representable in US-ASCII, it is replaced with `?` in the transcoded `Buffer`.

Note that this is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## Class: SlowBuffer

<!-- YAML
deprecated: v6.0.0
-->

> Stabilità: 0 - Deprecato: Utilizza [`Buffer.allocUnsafeSlow()`][] al suo posto.

Restituisce un `Buffer` non inserito in un pool.

In order to avoid the garbage collection overhead of creating many individually allocated `Buffer` instances, by default allocations under 4KB are sliced from a single larger allocated object.

In the case where a developer may need to retain a small chunk of memory from a pool for an indeterminate amount of time, it may be appropriate to create an un-pooled `Buffer` instance using `SlowBuffer` then copy out the relevant bits.

Esempio:

```js
// Bisogna mantenere a disposizione alcuni piccoli chunk di memoria
const store = [];

socket.on('readable', () => {
  const data = socket.read();

  // Allocare per i dati conservati
  const sb = SlowBuffer(10);

  // Copiare i dati nella nuova allocazione
  data.copy(sb, 0, 0, 10);

  store.push(sb);
});
```

Use of `SlowBuffer` should be used only as a last resort *after* a developer has observed undue memory retention in their applications.

### new SlowBuffer(size)

<!-- YAML
deprecated: v6.0.0
-->

> Stabilità: 0 - Deprecato: Utilizza [`Buffer.allocUnsafeSlow()`][] al suo posto.

* `size` {integer} La lunghezza desiderata del nuovo `SlowBuffer`.

Alloca un nuovo `Buffer` di `size` byte. If the `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, a [`RangeError`] will be thrown. A zero-length `Buffer` will be created if `size` is 0.

La memoria sottostante per le istanze di `SlowBuffer` *non è inizializzata*. The contents of a newly created `SlowBuffer` are unknown and may contain sensitive data. Use [`buf.fill(0)`][`buf.fill()`] to initialize a `SlowBuffer` to zeroes.

Esempio:

```js
const { SlowBuffer } = require('buffer');

const buf = new SlowBuffer(5);

// Prints: (contents may vary): <Buffer 78 e0 82 02 01>
console.log(buf);

buf.fill(0);

// Prints: <Buffer 00 00 00 00 00>
console.log(buf);
```

## Costanti Buffer

<!-- YAML
added: 8.2.0
-->

Note that `buffer.constants` is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

### buffer.constants.MAX_LENGTH

<!-- YAML
added: 8.2.0
-->

* {integer} La dimensione più grande consentita per una singola istanza `Buffer`.

Su architetture a 32 bit questo valore è `(2^30)-1` (~1GB). Su architetture a 64 bit questo valore è `(2^31)-1` (~2GB).

Questo valore è disponibile inoltre come [`buffer.kMaxLength`][].

### buffer.constants.MAX_STRING_LENGTH

<!-- YAML
added: 8.2.0
-->

* {integer} La lunghezza maggiore consentita per una singola istanza `string`.

Represents the largest `length` that a `string` primitive can have, counted in UTF-16 code units.

Questo valore può dipendere dal motore JS che viene utilizzato.