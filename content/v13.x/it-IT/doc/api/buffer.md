# Buffer

<!--introduced_in=v0.1.90-->

> Stabilità: 2 - Stable

Prior to the introduction of [`TypedArray`][], the JavaScript language had no mechanism for reading or manipulating streams of binary data. The `Buffer` class was introduced as part of the Node.js API to enable interaction with octet streams in TCP streams, file system operations, and other contexts.

With [`TypedArray`][] now available, the `Buffer` class implements the [`Uint8Array`][] API in a manner that is more optimized and suitable for Node.js.

Instances of the `Buffer` class are similar to arrays of integers from `0` to `255` (other integers are coerced to this range by `& 255` operation) but correspond to fixed-sized, raw memory allocations outside the V8 heap. The size of the `Buffer` is established when it is created and cannot be changed.

The `Buffer` class is within the global scope, making it unlikely that one would need to ever use `require('buffer').Buffer`.

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

In versions of Node.js prior to 6.0.0, `Buffer` instances were created using the `Buffer` constructor function, which allocates the returned `Buffer` differently based on what arguments are provided:

* Passing a number as the first argument to `Buffer()` (e.g. `new Buffer(10)`) allocates a new `Buffer` object of the specified size. Prior to Node.js 8.0.0, the memory allocated for such `Buffer` instances is *not* initialized and *can contain sensitive data*. Such `Buffer` instances *must* be subsequently initialized by using either [`buf.fill(0)`][`buf.fill()`] or by writing to the entire `Buffer`. While this behavior is *intentional* to improve performance, development experience has demonstrated that a more explicit distinction is required between creating a fast-but-uninitialized `Buffer` versus creating a slower-but-safer `Buffer`. Since Node.js 8.0.0, `Buffer(num)` and `new
Buffer(num)` return a `Buffer` with initialized memory.
* Passando una stringa, un array oppure un `Buffer` come primo argomento copiava i dati dell'object passato all'interno del `Buffer`.
* Passing an [`ArrayBuffer`][] or a [`SharedArrayBuffer`][] returns a `Buffer` that shares allocated memory with the given array buffer.

Because the behavior of `new Buffer()` is different depending on the type of the first argument, security and reliability issues can be inadvertently introduced into applications when argument validation or `Buffer` initialization is not performed.

For example, if an attacker can cause an application to receive a number where a string is expected, the application may call `new Buffer(100)` instead of `new Buffer("100")`, it will allocate a 100 byte buffer instead of allocating a 3 byte buffer with content `"100"`. This is commonly possible using JSON API calls. Since JSON distinguishes between numeric and string types, it allows injection of numbers where a naive application might expect to always receive a string.  Before Node.js 8.0.0, the 100 byte buffer might contain arbitrary pre-existing in-memory data, so may be used to expose in-memory secrets to a remote attacker.  Since Node.js 8.0.0, exposure of memory cannot occur because the data is zero-filled. However, other attacks are still possible, such as causing very large buffers to be allocated by the server, leading to performance degradation or crashing on memory exhaustion.

To make the creation of `Buffer` instances more reliable and less error-prone, the various forms of the `new Buffer()` constructor have been **deprecated** and replaced by separate `Buffer.from()`, [`Buffer.alloc()`][], and [`Buffer.allocUnsafe()`][] methods.

*Gli sviluppatori dovrebbero migrare tutti gli usi esistenti dei constructor `new Buffer()` su una di queste nuove API.*

* [`Buffer.from(array)`][] returns a new `Buffer` that *contains a copy* of the provided octets.
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`] returns a new `Buffer` that *shares the same allocated memory* as the given [`ArrayBuffer`][].
* [`Buffer.from(buffer)`][] returns a new `Buffer` that *contains a copy* of the contents of the given `Buffer`.
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`] returns a new `Buffer` that *contains a copy* of the provided string.
* [`Buffer.alloc(size[, fill[, encoding]])`][`Buffer.alloc()`] returns a new initialized `Buffer` of the specified size. This method is slower than [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] but guarantees that newly created `Buffer` instances never contain old data that is potentially sensitive. Verrà generato un `TypeError` se `size` non è un numero.
* [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] and [`Buffer.allocUnsafeSlow(size)`][`Buffer.allocUnsafeSlow()`] each return a new uninitialized `Buffer` of the specified `size`. Because the `Buffer` is uninitialized, the allocated segment of memory might contain old data that is potentially sensitive.

`Buffer` instances returned by [`Buffer.allocUnsafe()`][] *may* be allocated off a shared internal memory pool if `size` is less than or equal to half [`Buffer.poolSize`][]. Instances returned by [`Buffer.allocUnsafeSlow()`][] *never* use the shared internal memory pool.

### L'opzione `--zero-fill-buffers` della command line
<!-- YAML
added: v5.10.0
-->

Node.js can be started using the `--zero-fill-buffers` command line option to cause all newly allocated `Buffer` instances to be zero-filled upon creation by default. Before Node.js 8.0.0, this included buffers allocated by `new
Buffer(size)`. Since Node.js 8.0.0, buffers allocated with `new` are always zero-filled, whether this option is used or not. [`Buffer.allocUnsafe()`][], [`Buffer.allocUnsafeSlow()`][], and `new
SlowBuffer(size)`. Use of this flag can have a significant negative impact on performance. Use of the `--zero-fill-buffers` option is recommended only when necessary to enforce that newly allocated `Buffer` instances cannot contain old data that is potentially sensitive.

```console
$ node --zero-fill-buffers
> Buffer.allocUnsafe(5);
<Buffer 00 00 00 00 00>
```

### Cosa rende `Buffer.allocUnsafe()` e `Buffer.allocUnsafeSlow()` "unsafe" (non sicuri/pericolosi)?

When calling [`Buffer.allocUnsafe()`][] and [`Buffer.allocUnsafeSlow()`][], the segment of allocated memory is *uninitialized* (it is not zeroed-out). Mentre questo design rende l'allocazione della memoria abbastanza veloce, il segmento di memoria allocato potrebbe contenere vecchi dati potenzialmente sensibili. Using a `Buffer` created by [`Buffer.allocUnsafe()`][] without *completely* overwriting the memory can allow this old data to be leaked when the `Buffer` memory is read.

While there are clear performance advantages to using [`Buffer.allocUnsafe()`][], extra care *must* be taken in order to avoid introducing security vulnerabilities into an application.

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

When string data is stored in or extracted out of a `Buffer` instance, a character encoding may be specified.

```js
const buf = Buffer.from('hello world', 'ascii');

console.log(buf.toString('hex'));
// Stampa: 68656c6c6f20776f726c64
console.log(buf.toString('base64'));
// Stampa: aGVsbG8gd29ybGQ=

console.log(Buffer.from('fhqwhgads', 'ascii'));
// Stampa: <Buffer 66 68 71 77 68 67 61 64 73>
console.log(Buffer.from('fhqwhgads', 'utf16le'));
// Stampa: <Buffer 66 00 68 00 71 00 77 00 68 00 67 00 61 00 64 00 73 00>
```

Le codifiche dei caratteri attualmente supportate da Node.js includono:

* `'ascii'`: For 7-bit ASCII data only. Questa codifica è veloce e decodificherà il bit più alto se impostata.

* `'utf8'`: Multibyte encoded Unicode characters. Molte pagine web ed altri formati di documenti utilizzano UTF-8.

* `'utf16le'`: 2 or 4 bytes, little-endian encoded Unicode characters. Sono supportate coppie di surrogati (da U+10000 a U+10FFFF).

* `'ucs2'`: Alias of `'utf16le'`.

* `'base64'`: Base64 encoding. When creating a `Buffer` from a string, this encoding will also correctly accept "URL and Filename Safe Alphabet" as specified in [RFC 4648, Section 5](https://tools.ietf.org/html/rfc4648#section-5).

* `'latin1'`: A way of encoding the `Buffer` into a one-byte encoded string (as defined by the IANA in [RFC 1345](https://tools.ietf.org/html/rfc1345), page 63, to be the Latin-1 supplement block and C0/C1 control codes).

* `'binary'`: Alias for `'latin1'`.

* `'hex'`: Encode each byte as two hexadecimal characters. Data truncation may occur for unsanitized input. Per esempio:

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

## Buffer e TypedArray
<!-- YAML
changes:
  - version: v3.0.0
    pr-url: https://github.com/nodejs/node/pull/2002
    description: The `Buffer`s class now inherits from `Uint8Array`.
-->

`Buffer` instances are also [`Uint8Array`][] instances. However, there are subtle incompatibilities with [`TypedArray`][]. For example, while [`ArrayBuffer#slice()`][] creates a copy of the slice, the implementation of [`Buffer#slice()`][`buf.slice()`] creates a view over the existing `Buffer` without copying, making [`Buffer#slice()`][`buf.slice()`] far more efficient.

It is also possible to create new [`TypedArray`][] instances from a `Buffer` with the following caveats:

1. The `Buffer` object's memory is copied to the [`TypedArray`][], not shared.

2. La memoria del `Buffer` object viene interpretata come un array di elementi distinti e non come un byte array di tipo specifico. That is, `new Uint32Array(Buffer.from([1, 2, 3, 4]))` creates a 4-element [`Uint32Array`][] with elements `[1, 2, 3, 4]`, not a [`Uint32Array`][] with a single element `[0x1020304]` or `[0x4030201]`.

It is possible to create a new `Buffer` that shares the same allocated memory as a [`TypedArray`][] instance by using the `TypedArray` object's `.buffer` property.

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
// Stampa: 16
```

The `Buffer.from()` and [`TypedArray.from()`][] have different signatures and implementations. Specifically, the [`TypedArray`][] variants accept a second argument that is a mapping function that is invoked on every element of the typed array:

* `TypedArray.from(source[, mapFn[, thisArg]])`

Tuttavia, il metodo `Buffer.from()` non supporta l'uso di una funzione di mapping:

* [`Buffer.from(array)`][]
* [`Buffer.from(buffer)`][]
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`]
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`]

## Buffer ed iterazione

Le istanze di `Buffer` possono essere iterate usando la sintassi `for..of`:

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

La classe `Buffer` è un tipo globale per gestire direttamente i dati binari. Può essere costruita in vari modi.

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

* `array` {integer[]} Un array di byte da cui copiare.

Alloca un nuovo `Buffer` usando un `array` di octet.

```js
// Creates a new Buffer containing the UTF-8 bytes of the string 'buffer'.
const buf = new Buffer([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
```

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
* `byteOffset` {integer} Indice del primo byte da esporre. **Default:** `0`.
* `length` {integer} Numero di byte da esporre. **Default:** `arrayBuffer.byteLength - byteOffset`.

This creates a view of the [`ArrayBuffer`][] or [`SharedArrayBuffer`][] without copying the underlying memory. For example, when passed a reference to the `.buffer` property of a [`TypedArray`][] instance, the newly created `Buffer` will share the same allocated memory as the [`TypedArray`][].

Gli argomenti facoltativi `byteOffset` e `length` specificano un intervallo di memoria all'interno di `arrayBuffer` che sarà condiviso tramite il `Buffer`.

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Shares memory with `arr`.
const buf = new Buffer(arr.buffer);

console.log(buf);
// Prints: <Buffer 88 13 a0 0f>

// Changing the original Uint16Array changes the Buffer also.
arr[1] = 6000;

console.log(buf);
// Prints: <Buffer 88 13 70 17>
```

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

Copia i dati passati del `buffer` su una nuova istanza di `Buffer`.

```js
const buf1 = new Buffer('buffer');
const buf2 = new Buffer(buf1);

buf1[0] = 0x61;

console.log(buf1.toString());
// Stampa: auffer
console.log(buf2.toString());
// Stampa: buffer
```

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

* `size` {integer} La lunghezza desiderata del nuovo `Buffer`.

Alloca un nuovo `Buffer` di `size` byte. If `size` is larger than [`buffer.constants.MAX_LENGTH`][] or smaller than 0, [`ERR_INVALID_OPT_VALUE`][] is thrown. Viene creato un `Buffer` di lunghezza zero se `size` è 0.

Prior to Node.js 8.0.0, the underlying memory for `Buffer` instances created in this way is *not initialized*. The contents of a newly created `Buffer` are unknown and *may contain sensitive data*. Use [`Buffer.alloc(size)`][`Buffer.alloc()`] instead to initialize a `Buffer` with zeroes.

```js
const buf = new Buffer(10);

console.log(buf);
// Stampa: <Buffer 00 00 00 00 00 00 00 00 00 00>
```

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

> Stabilità: 0 - Obsoleto:  Utilizza invece [`Buffer.from(string[, encoding])`][`Buffer.from(string)`].

* `string` {string} Stringa da codificare.
* `encoding` {string} La codifica di `string`. **Default:** `'utf8'`.

Crea un nuovo `Buffer` contenente `string`. The `encoding` parameter identifies the character encoding of `string`.

```js
const buf1 = new Buffer('this is a tést');
const buf2 = new Buffer('7468697320697320612074c3a97374', 'hex');

console.log(buf1.toString());
// Stampa: this is a tést
console.log(buf2.toString());
// Stampa: this is a tést
console.log(buf1.toString('ascii'));
// Stampa: this is a tC)st
```

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

* `size` {integer} La lunghezza desiderata del nuovo `Buffer`.
* `fill` {string|Buffer|Uint8Array|integer} A value to pre-fill the new `Buffer` with. **Default:** `0`.
* `encoding` {string} Se `fill` è una stringa, questa è la sua codifica. **Default:** `'utf8'`.

Alloca un nuovo `Buffer` di `size` byte. If `fill` is `undefined`, the `Buffer` will be *zero-filled*.

```js
const buf = Buffer.alloc(5);

console.log(buf);
// Stampa: <Buffer 00 00 00 00 00>
```

If `size` is larger than [`buffer.constants.MAX_LENGTH`][] or smaller than 0, [`ERR_INVALID_OPT_VALUE`][] is thrown. Viene creato un `Buffer` di lunghezza zero se `size` è 0.

Se `fill` è specificato, il `Buffer` allocato verrà inizializzato chiamando [`buf.fill(fill)`][`buf.fill()`].

```js
const buf = Buffer.alloc(5, 'a');

console.log(buf);
// Stampa: <Buffer 61 61 61 61 61>
```

Se sono specificati sia `fill` che `encoding`, il `Buffer` allocato verrà inizializzato chiamando [`buf.fill(fill, encoding)`][`buf.fill()`].

```js
const buf = Buffer.alloc(11, 'aGVsbG8gd29ybGQ=', 'base64');

console.log(buf);
// Stampa: <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64>
```

Calling [`Buffer.alloc()`][] can be significantly slower than the alternative [`Buffer.allocUnsafe()`][] but ensures that the newly created `Buffer` instance contents will *never contain sensitive data*.

Verrà generato un `TypeError` se `size` non è un numero.

### Class Method: `Buffer.allocUnsafe(size)`
<!-- YAML
added: v5.10.0
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7079
    description: Passing a negative `size` will now throw an error.
-->

* `size` {integer} La lunghezza desiderata del nuovo `Buffer`.

Alloca un nuovo `Buffer` di `size` byte. If `size` is larger than [`buffer.constants.MAX_LENGTH`][] or smaller than 0, [`ERR_INVALID_OPT_VALUE`][] is thrown. Viene creato un `Buffer` di lunghezza zero se `size` è 0.

The underlying memory for `Buffer` instances created in this way is *not initialized*. The contents of the newly created `Buffer` are unknown and *may contain sensitive data*. Use [`Buffer.alloc()`][] instead to initialize `Buffer` instances with zeroes.

```js
const buf = Buffer.allocUnsafe(10);

console.log(buf);
// Prints (contents may vary): <Buffer a0 8b 28 3f 01 00 00 00 50 32>

buf.fill(0);

console.log(buf);
// Prints: <Buffer 00 00 00 00 00 00 00 00 00 00>
```

Verrà generato un `TypeError` se `size` non è un numero.

The `Buffer` module pre-allocates an internal `Buffer` instance of size [`Buffer.poolSize`][] that is used as a pool for the fast allocation of new `Buffer` instances created using [`Buffer.allocUnsafe()`][] and the deprecated `new Buffer(size)` constructor only when `size` is less than or equal to `Buffer.poolSize >> 1` (floor of [`Buffer.poolSize`][] divided by two).

L'utilizzo di questo pool di memoria interno pre-allocato è una differenza chiave tra la chiamata di `Buffer.alloc(size, fill)` contro la chiamata di `Buffer.allocUnsafe(size).fill(fill)`. Specifically, `Buffer.alloc(size, fill)` will *never* use the internal `Buffer` pool, while `Buffer.allocUnsafe(size).fill(fill)` *will* use the internal `Buffer` pool if `size` is less than or equal to half [`Buffer.poolSize`][]. The difference is subtle but can be important when an application requires the additional performance that [`Buffer.allocUnsafe()`][] provides.

### Class Method: `Buffer.allocUnsafeSlow(size)`
<!-- YAML
added: v5.12.0
-->

* `size` {integer} La lunghezza desiderata del nuovo `Buffer`.

Alloca un nuovo `Buffer` di `size` byte. If `size` is larger than [`buffer.constants.MAX_LENGTH`][] or smaller than 0, [`ERR_INVALID_OPT_VALUE`][] is thrown. Viene creato un `Buffer` di lunghezza zero se `size` è 0.

The underlying memory for `Buffer` instances created in this way is *not initialized*. The contents of the newly created `Buffer` are unknown and *may contain sensitive data*. Use [`buf.fill(0)`][`buf.fill()`] to initialize such `Buffer` instances with zeroes.

When using [`Buffer.allocUnsafe()`][] to allocate new `Buffer` instances, allocations under 4KB are sliced from a single pre-allocated `Buffer`. This allows applications to avoid the garbage collection overhead of creating many individually allocated `Buffer` instances. This approach improves both performance and memory usage by eliminating the need to track and clean up as many persistent objects.

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

`Buffer.allocUnsafeSlow()` should be used only as a last resort after a developer has observed undue memory retention in their applications.

Verrà generato un `TypeError` se `size` non è un numero.

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

* `string` {string|Buffer|TypedArray|DataView|ArrayBuffer|SharedArrayBuffer} Un valore di cui calcolare la lunghezza.
* `encoding` {string} Se `string` è una stringa, questa è la sua codifica. **Default:** `'utf8'`.
* Restituisce: {integer} Il numero di byte contenuti all'interno di una `string`.

Restituisce la lunghezza effettiva in byte di una stringa. This is not the same as [`String.prototype.length`][] since that returns the number of *characters* in a string.

Per `'base64'` ed `'hex'`, questa funzione assume input validi. For strings that contain non-Base64/Hex-encoded data (e.g. whitespace), the return value might be greater than the length of a `Buffer` created from the string.

```js
const str = '\u00bd + \u00bc = \u00be';

console.log(`${str}: ${str.length} characters, ` +
            `${Buffer.byteLength(str, 'utf8')} bytes`);
// Stampa: ½ + ¼ = ¾: 9 characters, 12 bytes
```

When `string` is a `Buffer`/[`DataView`][]/[`TypedArray`][]/[`ArrayBuffer`][]/ [`SharedArrayBuffer`][], the actual byte length is returned.

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
* Restituisce: {integer}

Solitamente confronta `buf1` a `buf2` allo scopo di ordinare gli array delle istanze di `Buffer`. Equivale a chiamare [`buf1.compare(buf2)`][`buf.compare()`].

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

* `list` {Buffer[] | Uint8Array[]} List of `Buffer` or [`Uint8Array`][] instances to concat.
* `totalLength` {integer} Lunghezza totale delle istanze di `Buffer` nella `list` quando vengono concatenate.
* Restituisce: {Buffer}

Restituisce un nuovo `Buffer` che è il risultato della concatenazione di tutte le istanze di `Buffer` nella `list`.

Se l'elenco (list) non contiene elementi o se `totalLength` è 0, viene restituito un nuovo `Buffer` di lunghezza zero.

Se `totalLength` non viene fornito, viene calcolato dalle istanze di `Buffer` nella `list`. Questo tuttavia causa l'esecuzione di un ciclo aggiuntivo per calcolare `totalLength`, quindi se la lunghezza è già nota è più rapido fornirla esplicitamente.

Se viene fornito `totalLength`, viene assegnato forzatamente ad un unsigned integer (intero senza segno). Se la lunghezza combinata dei `Buffer` nella `list` supera `totalLength`, il risultato viene troncato a `totalLength`.

```js
// Crea un singolo `Buffer` da una list di tre istanze di `Buffer`.

const buf1 = Buffer.alloc(10);
const buf2 = Buffer.alloc(14);
const buf3 = Buffer.alloc(18);
const totalLength = buf1.length + buf2.length + buf3.length;

console.log(totalLength);
// Stampa: 42

const bufA = Buffer.concat([buf1, buf2, buf3], totalLength);

console.log(bufA);
// Stampa: <Buffer 00 00 00 00 ...>
console.log(bufA.length);
// Stampa: 42
```

### Class Method: `Buffer.from(array)`
<!-- YAML
added: v5.10.0
-->

* `array` {integer[]}

Alloca un nuovo `Buffer` usando un `array` di octet.

```js
// Creates a new Buffer containing UTF-8 bytes of the string 'buffer'.
const buf = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
```

A `TypeError` will be thrown if `array` is not an `Array` or other type appropriate for `Buffer.from()` variants.

### Class Method: `Buffer.from(arrayBuffer[, byteOffset[, length]])`
<!-- YAML
added: v5.10.0
-->

* `arrayBuffer` {ArrayBuffer|SharedArrayBuffer} An [`ArrayBuffer`][], [`SharedArrayBuffer`][], or the `.buffer` property of a [`TypedArray`][].
* `byteOffset` {integer} Indice del primo byte da esporre. **Default:** `0`.
* `length` {integer} Numero di byte da esporre. **Default:** `arrayBuffer.byteLength - byteOffset`.

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

Gli argomenti facoltativi `byteOffset` e `length` specificano un intervallo di memoria all'interno di `arrayBuffer` che sarà condiviso tramite il `Buffer`.

```js
const ab = new ArrayBuffer(10);
const buf = Buffer.from(ab, 0, 2);

console.log(buf.length);
// Stampa: 2
```

A `TypeError` will be thrown if `arrayBuffer` is not an [`ArrayBuffer`][] or a [`SharedArrayBuffer`][] or other type appropriate for `Buffer.from()` variants.

### Class Method: `Buffer.from(buffer)`
<!-- YAML
added: v5.10.0
-->

* `buffer` {Buffer|Uint8Array} An existing `Buffer` or [`Uint8Array`][] from which to copy data.

Copia i dati passati del `buffer` su una nuova istanza di `Buffer`.

```js
const buf1 = Buffer.from('buffer');
const buf2 = Buffer.from(buf1);

buf1[0] = 0x61;

console.log(buf1.toString());
// Stampa: auffer
console.log(buf2.toString());
// Stampa: buffer
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
const buf = Buffer.from(new String('this is a test'));
// Stampa: <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

For objects that support `Symbol.toPrimitive`, returns `Buffer.from(object[Symbol.toPrimitive](), offsetOrEncoding, length)`.

```js
class Foo {
  [Symbol.toPrimitive]() {
    return 'this is a test';
  }
}

const buf = Buffer.from(new Foo(), 'utf8');
// Stampa: <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

A `TypeError` will be thrown if `object` has not mentioned methods or is not of other type appropriate for `Buffer.from()` variants.

### Class Method: `Buffer.from(string[, encoding])`
<!-- YAML
added: v5.10.0
-->

* `string` {string} Una striga da codificare.
* `encoding` {string} La codifica di `string`. **Default:** `'utf8'`.

Crea un nuovo `Buffer` contenente `string`. The `encoding` parameter identifies the character encoding of `string`.

```js
const buf1 = Buffer.from('this is a tést');
const buf2 = Buffer.from('7468697320697320612074c3a97374', 'hex');

console.log(buf1.toString());
// Stampa: this is a tést
console.log(buf2.toString());
// Stampa: this is a tést
console.log(buf1.toString('ascii'));
// Stampa: this is a tC)st
```

A `TypeError` will be thrown if `string` is not a string or other type appropriate for `Buffer.from()` variants.

### Class Method: `Buffer.isBuffer(obj)`
<!-- YAML
added: v0.1.101
-->

* `obj` {Object}
* Restituisce: {boolean}

Restituisce `true` se `obj` è un `Buffer`, in caso contrario `false`.

### Class Method: `Buffer.isEncoding(encoding)`
<!-- YAML
added: v0.9.1
-->

* `encoding` {string} Un nome di una codifica di caratteri da verificare.
* Restituisce: {boolean}

Restituisce `true` se l'`encoding` contiene una codifica di caratteri supportata o in caso contrario `false`.

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

This is the size (in bytes) of pre-allocated internal `Buffer` instances used for pooling. Questo valore potrebbe essere modificato.

### `buf[index]`
<!-- YAML
type: property
name: [index]
-->

* `index` {integer}

L'operatore indice `[index]` può essere usato per ottenere ed impostare l'octet nella posizione `index` all'interno di `buf`. I valori si riferiscono a singoli byte, quindi l'intervallo di valori è compreso tra `0x00` e `0xFF` (esadecimale) oppure tra `0` e `255` (decimale).

This operator is inherited from `Uint8Array`, so its behavior on out-of-bounds access is the same as `UInt8Array`. In other words, getting returns `undefined` and setting does nothing.

```js
// Copia una stringa ASCII all'interno di un `Buffer` un byte alla volta.

const str = 'Node.js';
const buf = Buffer.allocUnsafe(str.length);

for (let i = 0; i < str.length; i++) {
  buf[i] = str.charCodeAt(i);
}

console.log(buf.toString('ascii'));
// Stampa: Node.js
```

### `buf.buffer`

* {ArrayBuffer} The underlying `ArrayBuffer` object based on which this `Buffer` object is created.

This `ArrayBuffer` is not guaranteed to correspond exactly to the original `Buffer`. See the notes on `buf.byteOffset` for details.

```js
const arrayBuffer = new ArrayBuffer(16);
const buffer = Buffer.from(arrayBuffer);

console.log(buffer.buffer === arrayBuffer);
// Stampa: true
```

### `buf.byteOffset`

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
* `targetStart` {integer} L'offset all'interno del `target` sul quale iniziare il confronto. **Default:** `0`.
* `targetEnd` {integer} The offset within `target` at which to end comparison (not inclusive). **Default:** `target.length`.
* `sourceStart` {integer} L'offset all'interno di `buf` sul quale iniziare il confronto. **Default:** `0`.
* `sourceEnd` {integer} L'offset all'interno di `buf` sul quale finire il confronto (non incluso). **Default:** [`buf.length`][].
* Restituisce: {integer}

Confronta `buf` con `target` e restituisce un numero che indica se `buf` viene prima, dopo oppure se è uguale a `target` nella sequenza di ordinamento. Il confronto si basa sulla sequenza effettiva di byte in ciascun `Buffer`.

* Viene restituito `0` se `target` è uguale a `buf`
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

Gli argomenti facoltativi `targetStart`, `targetEnd`, `sourceStart`, e `sourceEnd` possono essere utilizzati per limitare il confronto ad intervalli specifici rispettivamente all'interno di `target` e `buf`.

```js
const buf1 = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);
const buf2 = Buffer.from([5, 6, 7, 8, 9, 1, 2, 3, 4]);

console.log(buf1.compare(buf2, 5, 9, 0, 4));
// Stampa: 0
console.log(buf1.compare(buf2, 0, 6, 4));
// Stampa: -1
console.log(buf1.compare(buf2, 5, 6, 5));
// Stampa: 1
```

[`ERR_OUT_OF_RANGE`][] is thrown if `targetStart < 0`, `sourceStart < 0`, `targetEnd > target.byteLength`, or `sourceEnd > source.byteLength`.

### `buf.copy(target[, targetStart[, sourceStart[, sourceEnd]]])`
<!-- YAML
added: v0.1.90
-->

* `target` {Buffer|Uint8Array} A `Buffer` or [`Uint8Array`][] to copy into.
* `targetStart` {integer} The offset within `target` at which to begin writing. **Default:** `0`.
* `sourceStart` {integer} L'offset all'interno di `buf` dal quale iniziare a copiare. **Default:** `0`.
* `sourceEnd` {integer} L'offset all'interno di `buf` sul quale finire di copiare (non incluso). **Default:** [`buf.length`][].
* Restituisce: {integer} Il numero di byte copiati.

Copia i dati da un'area di `buf` ad un'area in `target` anche se l'area di memoria `target` si sovrappone a `buf`.

```js
// Crea due istanze `Buffer`.
const buf1 = Buffer.allocUnsafe(26);
const buf2 = Buffer.allocUnsafe(26).fill('!');

for (let i = 0; i < 26; i++) {
  // 97 is the decimal ASCII value for 'a'.
  buf1[i] = i + 97;
}

// Copy `buf1` bytes 16 through 19 into `buf2` starting at byte 8 of `buf2`.
buf1.copy(buf2, 8, 16, 20);

console.log(buf2.toString('ascii', 0, 25));
// Prints: !!!!!!!!qrst!!!!!!!!!!!!!
```

```js
// Crea un `Buffer` e copia i dati da un'area in un'altra area sovrapposta all'interno dello stesso `Buffer`.

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

* Restituisce: {Iterator}

Creates and returns an [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) of `[index, byte]` pairs from the contents of `buf`.

```js
// Registra l'intero contenuto di un `Buffer`.

const buf = Buffer.from('buffer');

for (const pair of buf.entries()) {
  console.log(pair);
}
// Stampa:
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
* Restituisce: {boolean}

Restituisce `true` se sia `buf` che `otherBuffer` hanno esattamente gli stessi byte, in caso contrario `false`.

```js
const buf1 = Buffer.from('ABC');
const buf2 = Buffer.from('414243', 'hex');
const buf3 = Buffer.from('ABCD');

console.log(buf1.equals(buf2));
// Stampa: true
console.log(buf1.equals(buf3));
// Stampa: false
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
* `offset` {integer} Numero di byte da saltare prima di iniziare a riempire `buf`. **Default:** `0`.
* `end` {integer} Dove smettere di riempire `buf` (non incluso). **Default:** [`buf.length`][].
* `encoding` {string} La codifica per `value` se `value` è una stringa. **Default:** `'utf8'`.
* Restituisce: {Buffer} Un riferimento a `buf`.

Riempie `buf` con il `value` specificato. If the `offset` and `end` are not given, the entire `buf` will be filled:

```js
// Riempie un `Buffer` con un carattere ASCII 'h'.

const b = Buffer.allocUnsafe(50).fill('h');

console.log(b.toString());
// Stampa: hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
```

`value` is coerced to a `uint32` value if it is not a string, `Buffer`, or integer. If the resulting integer is greater than `255` (decimal), `buf` will be filled with `value & 255`.

If the final write of a `fill()` operation falls on a multi-byte character, then only the bytes of that character that fit into `buf` are written:

```js
// Riempie un `Buffer` con un carattere a due byte.

console.log(Buffer.allocUnsafe(3).fill('\u0222'));
// Stampa: <Buffer c8 a2 c8>
```

If `value` contains invalid characters, it is truncated; if no valid fill data remains, an exception is thrown:

```js
const buf = Buffer.allocUnsafe(5);

console.log(buf.fill('a'));
// Stampa: <Buffer 61 61 61 61 61>
console.log(buf.fill('aazz', 'hex'));
// Stampa: <Buffer aa aa aa aa aa>
console.log(buf.fill('zz', 'hex'));
// Genera un'eccezione.
```

### `buf.includes(value[, byteOffset][, encoding])`
<!-- YAML
added: v5.3.0
-->

* `value` {string|Buffer|Uint8Array|integer} Su cosa eseguire la ricerca.
* `byteOffset` {integer} Dove iniziare la ricerca in `buf`. If negative, then offset is calculated from the end of `buf`. **Default:** `0`.
* `encoding` {string} Se `value` è una stringa, questa è la sua codifica. **Default:** `'utf8'`.
* Restituisce: {boolean} `true` se `value` è stato trovato in `buf`, in caso contrario `false`.

Equivalente a [`buf.indexOf() !== -1`][`buf.indexOf()`].

```js
const buf = Buffer.from('this is a buffer');

console.log(buf.includes('this'));
// Stampa: true
console.log(buf.includes('is'));
// Stampa: true
console.log(buf.includes(Buffer.from('a buffer')));
// Stampa: true
console.log(buf.includes(97));
// Stampa: true (97 è il valore ASCII decimale per 'a')
console.log(buf.includes(Buffer.from('a buffer example')));
// Stampa: false
console.log(buf.includes(Buffer.from('a buffer example').slice(0, 8)));
// Stampa: true
console.log(buf.includes('this', 4));
// Stampa: false
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

* `value` {string|Buffer|Uint8Array|integer} Su cosa eseguire la ricerca.
* `byteOffset` {integer} Dove iniziare la ricerca in `buf`. If negative, then offset is calculated from the end of `buf`. **Default:** `0`.
* `encoding` {string} If `value` is a string, this is the encoding used to determine the binary representation of the string that will be searched for in `buf`. **Default:** `'utf8'`.
* Returns: {integer} The index of the first occurrence of `value` in `buf`, or `-1` if `buf` does not contain `value`.

Se `value` è:

* una stringa, `value` viene interpretato in base alla codifica dei caratteri in `encoding`.
* a `Buffer` or [`Uint8Array`][], `value` will be used in its entirety. To compare a partial `Buffer`, use [`buf.slice()`][].
* un numero, `value` verrà interpretato come un valore unsigned integer a 8 bit (intero senza segno) tra `0` e `255`.

```js
const buf = Buffer.from('this is a buffer');

console.log(buf.indexOf('this'));
// Stampa: 0
console.log(buf.indexOf('is'));
// Stampa: 2
console.log(buf.indexOf(Buffer.from('a buffer')));
// Stampa: 8
console.log(buf.indexOf(97));
// Stampa: 8 (97 is the decimal ASCII value for 'a')
console.log(buf.indexOf(Buffer.from('a buffer example')));
// Stampa: -1
console.log(buf.indexOf(Buffer.from('a buffer example').slice(0, 8)));
// Stampa: 8

const utf16Buffer = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'utf16le');

console.log(utf16Buffer.indexOf('\u03a3', 0, 'utf16le'));
// Stampa: 4
console.log(utf16Buffer.indexOf('\u03a3', -4, 'utf16le'));
// Stampa: 6
```

Se `value` non è una stringa, un numero oppure un `Buffer`, questo metodo genererà un `TypeError`. Se `value` è un numero, verrà forzato ad un valore in byte valido, un integer (numero intero) compreso tra 0 e 255.

Se `byteOffset` non è un numero, sarà forzato ad un numero. If the result of coercion is `NaN` or `0`, then the entire buffer will be searched. This behavior matches [`String#indexOf()`][].

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

* Restituisce: {Iterator}

Crea e restituisce un [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) delle `buf` key (indici).

```js
const buf = Buffer.from('buffer');

for (const key of buf.keys()) {
  console.log(key);
}
// Stampa:
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

* `value` {string|Buffer|Uint8Array|integer} Su cosa eseguire la ricerca.
* `byteOffset` {integer} Dove iniziare la ricerca in `buf`. If negative, then offset is calculated from the end of `buf`. **Default:** `buf.length - 1`.
* `encoding` {string} If `value` is a string, this is the encoding used to determine the binary representation of the string that will be searched for in `buf`. **Default:** `'utf8'`.
* Returns: {integer} The index of the last occurrence of `value` in `buf`, or `-1` if `buf` does not contain `value`.

Identical to [`buf.indexOf()`][], except the last occurrence of `value` is found rather than the first occurrence.

```js
const buf = Buffer.from('this buffer is a buffer');

console.log(buf.lastIndexOf('this'));
// Stampa: 0
console.log(buf.lastIndexOf('buffer'));
// Stampa: 17
console.log(buf.lastIndexOf(Buffer.from('buffer')));
// Stampa: 17
console.log(buf.lastIndexOf(97));
// Stampa: 15 (97 è il valore ASCII decimale per 'a')
console.log(buf.lastIndexOf(Buffer.from('yolo')));
// Stampa: -1
console.log(buf.lastIndexOf('buffer', 5));
// Stampa: 5
console.log(buf.lastIndexOf('buffer', 4));
// Stampa: -1

const utf16Buffer = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'utf16le');

console.log(utf16Buffer.lastIndexOf('\u03a3', undefined, 'utf16le'));
// Stampa: 6
console.log(utf16Buffer.lastIndexOf('\u03a3', -5, 'utf16le'));
// Stampa: 4
```

Se `value` non è una stringa, un numero oppure un `Buffer`, questo metodo genererà un `TypeError`. Se `value` è un numero, verrà forzato ad un valore in byte valido, un integer (numero intero) compreso tra 0 e 255.

Se `byteOffset` non è un numero, sarà forzato ad un numero. Qualsiasi argomento che forza il valore a `NaN`, come possono essere `{}` oppure `undefined`, eseguiranno la ricerca sull'intero buffer. This behavior matches [`String#lastIndexOf()`][].

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

Se `value` è una stringa vuota oppure un `Buffer` vuoto, verrà restituito `byteOffset`.

### `buf.length`
<!-- YAML
added: v0.1.90
-->

* {integer}

Restituisce la quantità di memoria allocata per `buf` in byte. This does not necessarily reflect the amount of "usable" data within `buf`.

```js
// Crea un `Buffer` e scrive su di esso una stringa ASCII più breve.

const buf = Buffer.alloc(1234);

console.log(buf.length);
// Stampa: 1234

buf.write('some string', 0, 'ascii');

console.log(buf.length);
// Stampa: 1234
```

Sebbene la proprietà `length` (lunghezza) non sia immutabile, la modifica del valore di `length` può causare un comportamento indefinito ed incoerente. Applications that wish to modify the length of a `Buffer` should therefore treat `length` as read-only and use [`buf.slice()`][] to create a new `Buffer`.

```js
let buf = Buffer.allocUnsafe(10);

buf.write('abcdefghj', 0, 'ascii');

console.log(buf.length);
// Stampa: 10

buf = buf.slice(0, 5);

console.log(buf.length);
// Stampa: 5
```

### `buf.parent`
<!-- YAML
deprecated: v8.0.0
-->

> Stability: 0 - Deprecated: Use [`buf.buffer`][] instead.

La proprietà `buf.parent` è un alias obsoleto di `buf.buffer`.

### `buf.readBigInt64BE([offset])`
### `buf.readBigInt64LE([offset])`
<!-- YAML
added: v12.0.0
-->

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy: `0 <= offset <= buf.length - 8`. **Default:** `0`.
* Returns: {bigint}

Reads a signed 64-bit integer from `buf` at the specified `offset` with the specified endian format (`readBigInt64BE()` returns big endian, `readBigInt64LE()` returns little endian).

Gli integer (numeri interi) letti da un `Buffer` sono interpretati come valori signed in complemento a due.

### `buf.readBigUInt64BE([offset])`
### `buf.readBigUInt64LE([offset])`
<!-- YAML
added: v12.0.0
-->

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy: `0 <= offset <= buf.length - 8`. **Default:** `0`.
* Returns: {bigint}

Reads an unsigned 64-bit integer from `buf` at the specified `offset` with specified endian format (`readBigUInt64BE()` returns big endian, `readBigUInt64LE()` returns little endian).

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

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy `0 <= offset <= buf.length - 8`. **Default:** `0`.
* Restituisce: {number}

Legge un double a 64 bit da `buf` all'`offset` specificato con il formato endian specificato (`readDoubleBE()` restituisce big endian, `readDoubleLE()` restituisce little endian).

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

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy `0 <= offset <= buf.length - 4`. **Default:** `0`.
* Restituisce: {number}

Legge un float a 32 bit da `buf` all'`offset` specificato con il formato endian specificato (`readFloatBE()` restituisce big endian, `readFloatLE()` restituisce little endian).

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

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy `0 <= offset <= buf.length - 1`. **Default:** `0`.
* Restituisce: {integer}

Legge un signed integer (numero intero con segno) a 8 bit da `buf` all'`offset` specificato.

Gli integer (numeri interi) letti da un `Buffer` sono interpretati come valori signed in complemento a due.

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

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy `0 <= offset <= buf.length - 2`. **Default:** `0`.
* Restituisce: {integer}

Legge un signed integer a 16 bit da `buf` all'`offset` specificato con il formato endian specificato (`readInt16BE()` restituisce big endian, `readInt16LE()` restituisce little endian).

Gli integer (numeri interi) letti da un `Buffer` sono interpretati come valori signed in complemento a due.

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

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy `0 <= offset <= buf.length - 4`. **Default:** `0`.
* Restituisce: {integer}

Legge un signed integer a 32 bit da `buf` all'`offset` specificato con il formato endian specificato (`readInt32BE()` restituisce big endian, `readInt32LE()` restituisce little endian).

Gli integer (numeri interi) letti da un `Buffer` sono interpretati come valori signed in complemento a due.

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

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Numero di byte da leggere. Must satisfy `0 < byteLength <= 6`.
* Restituisce: {integer}

Legge il numero di byte di `byteLength` da `buf` all'`offset` specificato ed interpreta il risultato come valore signed a complemento a due. Supporta fino a 48 bit di accuracy (precisione).

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

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy `0 <= offset <= buf.length - 1`. **Default:** `0`.
* Restituisce: {integer}

Legge un unsigned integer a 8 bit da `buf` all'`offset` specificato.

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

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy `0 <= offset <= buf.length - 2`. **Default:** `0`.
* Restituisce: {integer}

Legge un unsigned integer a 16 bit da `buf` all'`offset` specificato con un formato endian specificato (`readUInt16BE()` restituisce big endian, `readUInt16LE()` restituisce little endian).

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

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy `0 <= offset <= buf.length - 4`. **Default:** `0`.
* Restituisce: {integer}

Legge un unsigned integer a 32 bit da `buf` all'`offset` specificato con un formato endian specificato (`readUInt32BE()` restituisce big endian, `readUInt32LE()` restituisce little endian).

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

* `offset` {integer} Numero di byte da saltare prima di iniziare la lettura. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Numero di byte da leggere. Must satisfy `0 < byteLength <= 6`.
* Restituisce: {integer}

Legge il numero di byte di `byteLength` da `buf` all'`offset` specificato ed interpreta il risultato come un unsigned integer. Supporta fino a 48 bit di accuracy (precisione).

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

* `start` {integer} Dove inizierà il nuovo `Buffer`. **Default:** `0`.
* `end` {integer} Dove terminerà il nuovo `Buffer` (non incluso). **Default:** [`buf.length`][].
* Restituisce: {Buffer}

Restituisce un nuovo `Buffer` che fa riferimento alla stessa memoria dell'originale, ma compensato (offset) e ritagliato (cropped) dagli indici `start` ed `end`.

Specifying `end` greater than [`buf.length`][] will return the same result as that of `end` equal to [`buf.length`][].

Modifying the new `Buffer` slice will modify the memory in the original `Buffer` because the allocated memory of the two objects overlap.

```js
// Crea un `Buffer` con l'alfabeto ASCII, ne prende una sezione (slice)
// e modifica un byte dal `Buffer` originale.

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

Specificando gli indici negativi, la sezione (slice) viene generata in relazione alla fine di `buf` piuttosto che in relazione all'inizio.

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

* `start` {integer} Dove inizierà il nuovo `Buffer`. **Default:** `0`.
* `end` {integer} Dove terminerà il nuovo `Buffer` (non incluso). **Default:** [`buf.length`][].
* Restituisce: {Buffer}

Restituisce un nuovo `Buffer` che fa riferimento alla stessa memoria dell'originale, ma compensato (offset) e ritagliato (cropped) dagli indici `start` ed `end`.

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

* Restituisce: {Buffer} Un riferimento a `buf`.

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

* Restituisce: {Buffer} Un riferimento a `buf`.

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

* Restituisce: {Buffer} Un riferimento a `buf`.

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

JavaScript cannot encode 64-bit integers. Questo metodo è pensato per lavorare con i float a 64 bit.

### `buf.toJSON()`
<!-- YAML
added: v0.9.2
-->

* Restituisce: {Object}

Restituisce una rappresentazione JSON di `buf`. [`JSON.stringify()`][] implicitly calls this function when stringifying a `Buffer` instance.

```js
const buf = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5]);
const json = JSON.stringify(buf);

console.log(json);
// Stampa: {"type":"Buffer","data":[1,2,3,4,5]}

const copy = JSON.parse(json, (key, value) => {
  return value && value.type === 'Buffer' ?
    Buffer.from(value.data) :
    value;
});

console.log(copy);
// Stampa: <Buffer 01 02 03 04 05>
```

### `buf.toString([encoding[, start[, end]]])`
<!-- YAML
added: v0.1.90
-->

* `encoding` {string} La codifica dei caratteri da utilizzare. **Default:** `'utf8'`.
* `start` {integer} Il byte offset da cui iniziare la decodifica. **Default:** `0`.
* `end` {integer} Il byte offset a cui concludere la decodifica (non incluso). **Default:** [`buf.length`][].
* Restituisce: {string}

Decodifica `buf` in una stringa in base alla codifica dei caratteri specificata in `encoding`. `start` ed `end` possono essere passati per decodificare solo un sottoinsieme di `buf`. If a byte sequence in the input is not valid in the given `encoding` then it is replaced with the replacement character `U+FFFD`.

The maximum length of a string instance (in UTF-16 code units) is available as [`buffer.constants.MAX_STRING_LENGTH`][].

```js
const buf1 = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 is the decimal ASCII value for 'a'.
  buf1[i] = i + 97;
}

console.log(buf1.toString('ascii'));
// Prints: abcdefghijklmnopqrstuvwxyz
console.log(buf1.toString('ascii', 0, 5));
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

* Restituisce: {Iterator}

Crea e restituisce un [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) per i valori di `buf` (in byte). Questa funzione è chiamata automaticamente quando un `Buffer` viene usato in un'istruzione `for..of`.

```js
const buf = Buffer.from('buffer');

for (const value of buf.values()) {
  console.log(value);
}
// Stampa:
//   98
//   117
//   102
//   102
//   101
//   114

for (const value of buf) {
  console.log(value);
}
// Stampa:
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

* `string` {string} Stringa da scrivere su `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere `string`. **Default:** `0`.
* `length` {integer} Numero di byte da scrivere. **Default:** `buf.length - offset`.
* `encoding` {string} La codifica dei caratteri di `string`. **Default:** `'utf8'`.
* Restituisce: {integer} Numero di byte scritti.

Writes `string` to `buf` at `offset` according to the character encoding in `encoding`. Il parametro `length` è il numero di byte da scrivere. If `buf` did not contain enough space to fit the entire string, only part of `string` will be written. Tuttavia, i caratteri parzialmente codificati non verranno scritti.

```js
const buf = Buffer.alloc(256);

const len = buf.write('\u00bd + \u00bc = \u00be', 0);

console.log(`${len} bytes: ${buf.toString('utf8', 0, len)}`);
// Stampa: 12 bytes: ½ + ¼ = ¾
```

### `buf.writeBigInt64BE(value[, offset])`
### `buf.writeBigInt64LE(value[, offset])`
<!-- YAML
added: v12.0.0
-->

* `value` {bigint} Number to be written to `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy: `0 <= offset <= buf.length - 8`. **Default:** `0`.
* Restituisce: {integer} `offset` più il numero di byte scritti.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeBigInt64BE()` writes big endian, `writeBigInt64LE()` writes little endian).

`value` è interpretato e scritto come signed integer di un complemento a due.

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
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy: `0 <= offset <= buf.length - 8`. **Default:** `0`.
* Restituisce: {integer} `offset` più il numero di byte scritti.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeBigUInt64BE()` writes big endian, `writeBigUInt64LE()` writes little endian).

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

* `value` {number} Numero da scrivere su `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy `0 <= offset <= buf.length - 8`. **Default:** `0`.
* Restituisce: {integer} `offset` più il numero di byte scritti.

Scrive `value` da `buf` all'`offset` specificato con il formato endian specificato (`writeDoubleBE()` scrive big endian, `writeDoubleLE()` scrive little endian). `value` *should* be a valid 64-bit double. Il comportamento è undefined (indefinito) quando `value` è diverso da un double a 64 bit.

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

* `value` {number} Numero da scrivere su `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy `0 <= offset <= buf.length - 4`. **Default:** `0`.
* Restituisce: {integer} `offset` più il numero di byte scritti.

Scrive `value` da `buf` all'`offset` specificato con il formato endian specificato (`writeFloatBE()` scrive big endian, `writeFloatLE()` scrive little endian). `value` *should* be a valid 32-bit float. Il comportamento è undefined (indefinito) quando `value` è diverso da un float a 32 bit.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeFloatBE(0xcafebabe, 0);

console.log(buf);
// Stampa: <Buffer 4f 4a fe bb>

buf.writeFloatLE(0xcafebabe, 0);

console.log(buf);
// Stampa: <Buffer bb fe 4a 4f>
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

* `value` {integer} Numero da scrivere su `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy `0 <= offset <= buf.length - 1`. **Default:** `0`.
* Restituisce: {integer} `offset` più il numero di byte scritti.

Scrive `value` da `buf` all'`offset` specificato. `value` *should* be a valid signed 8-bit integer. Il comportamento è undefined (indefinito) quando `value` è diverso da un signed integer (numero intero con segno) a 8 bit.

`value` è interpretato e scritto come signed integer di un complemento a due.

```js
const buf = Buffer.allocUnsafe(2);

buf.writeInt8(2, 0);
buf.writeInt8(-2, 1);

console.log(buf);
// Stampa: <Buffer 02 fe>
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

* `value` {integer} Numero da scrivere su `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy `0 <= offset <= buf.length - 2`. **Default:** `0`.
* Restituisce: {integer} `offset` più il numero di byte scritti.

Scrive `value` da `buf` all'`offset` specificato con il formato endian specificato (`writeInt16BE()` scrive big endian, `writeInt16LE()` scrive little endian). `value` *should* be a valid signed 16-bit integer. Behavior is undefined when `value` is anything other than a signed 16-bit integer.

`value` è interpretato e scritto come signed integer di un complemento a due.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeInt16BE(0x0102, 0);
buf.writeInt16LE(0x0304, 2);

console.log(buf);
// Stampa: <Buffer 01 02 04 03>
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

* `value` {integer} Numero da scrivere su `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy `0 <= offset <= buf.length - 4`. **Default:** `0`.
* Restituisce: {integer} `offset` più il numero di byte scritti.

Scrive `value` da `buf` all'`offset` specificato con il formato endian specificato (`writeInt32BE()` scrive big endian, `writeInt32LE()` scrive little endian). `value` *should* be a valid signed 32-bit integer. Behavior is undefined when `value` is anything other than a signed 32-bit integer.

`value` è interpretato e scritto come signed integer di un complemento a due.

```js
const buf = Buffer.allocUnsafe(8);

buf.writeInt32BE(0x01020304, 0);
buf.writeInt32LE(0x05060708, 4);

console.log(buf);
// Stampa: <Buffer 01 02 03 04 08 07 06 05>
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

* `value` {integer} Numero da scrivere su `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Numero di byte da scrivere. Must satisfy `0 < byteLength <= 6`.
* Restituisce: {integer} `offset` più il numero di byte scritti.

Scrive `byteLength` byte di `value` da `buf` all'`offset` specificato. Supporta fino a 48 bit di accuracy (precisione). Il comportamento è undefined (indefinito) quando `value` è diverso da un signed integer (numero intero con segno).

```js
const buf = Buffer.allocUnsafe(6);

buf.writeIntBE(0x1234567890ab, 0, 6);

console.log(buf);
// Stampa: <Buffer 12 34 56 78 90 ab>

buf.writeIntLE(0x1234567890ab, 0, 6);

console.log(buf);
// Stampa: <Buffer ab 90 78 56 34 12>
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

* `value` {integer} Numero da scrivere su `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy `0 <= offset <= buf.length - 1`. **Default:** `0`.
* Restituisce: {integer} `offset` più il numero di byte scritti.

Scrive `value` da `buf` all'`offset` specificato. `value` *should* be a valid unsigned 8-bit integer. Il comportamento è undefined (indefinito) quando `value` è diverso da un unsigned integer (numero intero senza segno) a 8 bit.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt8(0x3, 0);
buf.writeUInt8(0x4, 1);
buf.writeUInt8(0x23, 2);
buf.writeUInt8(0x42, 3);

console.log(buf);
// Stampa: <Buffer 03 04 23 42>
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

* `value` {integer} Numero da scrivere su `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy `0 <= offset <= buf.length - 2`. **Default:** `0`.
* Restituisce: {integer} `offset` più il numero di byte scritti.

Scrive `value` su `buf` all'`offset` specificato con il formato endian specificato (`writeInt16BE()` scrive big endian, `writeInt16LE()` scrive little endian). `value` dovrebbe essere un numero intero senza segno valido a 16 bit. Il comportamento è indefinito quando `value` è qualcosa di diverso da un numero intero senza segno a 16 bit.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt16BE(0xdead, 0);
buf.writeUInt16BE(0xbeef, 2);

console.log(buf);
// Stampa: <Buffer de ad be ef>

buf.writeUInt16LE(0xdead, 0);
buf.writeUInt16LE(0xbeef, 2);

console.log(buf);
// Stampa: <Buffer ad de ef be>
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

* `value` {integer} Numero da scrivere su `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy `0 <= offset <= buf.length - 4`. **Default:** `0`.
* Restituisce: {integer} `offset` più il numero di byte scritti.

Scrive `value` su `buf` all'`offset` specificato con il formato endian specificato (`writeInt32BE()` scrive big endian, `writeInt32LE()` scrive little endian). `value` dovrebbe essere un numero intero senza segno valido a 32 bit. Il comportamento è indefinito quando `value` è qualcosa di diverso da un numero intero senza segno a 32 bit.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt32BE(0xfeedface, 0);

console.log(buf);
// Stampa: <Buffer fe ed fa ce>

buf.writeUInt32LE(0xfeedface, 0);

console.log(buf);
// Stampa: <Buffer ce fa ed fe>
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

* `value` {integer} Numero da scrivere su `buf`.
* `offset` {integer} Numero di byte da saltare prima di iniziare a scrivere. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Numero di byte da scrivere. Must satisfy `0 < byteLength <= 6`.
* Restituisce: {integer} `offset` più il numero di byte scritti.

Scrive `byteLength` byte di `value` da `buf` all'`offset` specificato. Supporta fino a 48 bit di accuracy (precisione). Il comportamento è indefinito quando `value` è qualcosa di diverso da un numero intero senza segno.

```js
const buf = Buffer.allocUnsafe(6);

buf.writeUIntBE(0x1234567890ab, 0, 6);

console.log(buf);
// Stampa: <Buffer 12 34 56 78 90 ab>

buf.writeUIntLE(0x1234567890ab, 0, 6);

console.log(buf);
// Stampa: <Buffer ab 90 78 56 34 12>
```

## `buffer.INSPECT_MAX_BYTES`
<!-- YAML
added: v0.5.4
-->

* {integer} **Default:** `50`

Restituisce il numero massimo di byte che verranno restituiti quando viene chiamato `buf.inspect()`. Questo può essere sovrascritto dai moduli utente. See [`util.inspect()`][] for more details on `buf.inspect()` behavior.

This is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## `buffer.kMaxLength`
<!-- YAML
added: v3.0.0
-->

* {integer} La dimensione più grande consentita per una singola istanza `Buffer`.

Un alias per [`buffer.constants.MAX_LENGTH]`[].

This is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## `buffer.transcode(source, fromEnc, toEnc)`
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
* Restituisce: {Buffer}

Re-encodes the given `Buffer` or `Uint8Array` instance from one character encoding to another. Restituisce una nuova istanza `Buffer`.

Throws if the `fromEnc` or `toEnc` specify invalid character encodings or if conversion from `fromEnc` to `toEnc` is not permitted.

Encodings supported by `buffer.transcode()` are: `'ascii'`, `'utf8'`, `'utf16le'`, `'ucs2'`, `'latin1'`, and `'binary'`.

The transcoding process will use substitution characters if a given byte sequence cannot be adequately represented in the target encoding. Ad esempio:

```js
const buffer = require('buffer');

const newBuf = buffer.transcode(Buffer.from('€'), 'utf8', 'ascii');
console.log(newBuf.toString('ascii'));
// Stampa: '?'
```

Because the Euro (`€`) sign is not representable in US-ASCII, it is replaced with `?` in the transcoded `Buffer`.

This is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## Class: `SlowBuffer`
<!-- YAML
deprecated: v6.0.0
-->

> Stability: 0 - Deprecated: Use [`Buffer.allocUnsafeSlow()`][] instead.

Restituisce un `Buffer` non inserito in un pool.

Per evitare il sovraccarico della garbage collection per la creazione di numerose istanze di `Buffer` allocate individualmente, di default le allocazioni sotto ai 4KB vengono suddivise da un singolo object allocato più grande.

Nel caso in cui uno sviluppatore possa aver bisogno di conservare un piccolo chunk di memoria da un pool per un periodo di tempo indeterminato, potrebbe essere opportuno creare un'istanza `Buffer` non inserita nel pool utilizzando `SlowBuffer` per poi copiare i bit rilevanti.

```js
// Need to keep around a few small chunks of memory.
const store = [];

socket.on('readable', () => {
  let data;
  while (null !== (data = readable.read())) {
    // Allocate for retained data.
    const sb = SlowBuffer(10);

    // Copy the data into the new allocation.
    data.copy(sb, 0, 0, 10);

    store.push(sb);
  }
});
```

Use of `SlowBuffer` should be used only as a last resort *after* a developer has observed undue memory retention in their applications.

### `new SlowBuffer(size)`
<!-- YAML
deprecated: v6.0.0
-->

> Stability: 0 - Deprecated: Use [`Buffer.allocUnsafeSlow()`][] instead.

* `size` {integer} La lunghezza desiderata del nuovo `SlowBuffer`.

Alloca un nuovo `Buffer` di `size` byte. If `size` is larger than [`buffer.constants.MAX_LENGTH`][] or smaller than 0, [`ERR_INVALID_OPT_VALUE`][] is thrown. Viene creato un `Buffer` di lunghezza zero se `size` è 0.

The underlying memory for `SlowBuffer` instances is *not initialized*. The contents of a newly created `SlowBuffer` are unknown and may contain sensitive data. Use [`buf.fill(0)`][`buf.fill()`] to initialize a `SlowBuffer` with zeroes.

```js
const { SlowBuffer } = require('buffer');

const buf = new SlowBuffer(5);

console.log(buf);
// Stampa: (contents may vary): <Buffer 78 e0 82 02 01>

buf.fill(0);

console.log(buf);
// Stampa: <Buffer 00 00 00 00 00>
```

## Costanti Buffer
<!-- YAML
added: v8.2.0
-->

`buffer.constants` is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

### `buffer.constants.MAX_LENGTH`
<!-- YAML
added: v8.2.0
-->

* {integer} La dimensione più grande consentita per una singola istanza `Buffer`.

Su architetture a 32 bit questo valore è `(2^30)-1` (~1GB). Su architetture a 64 bit questo valore è `(2^31)-1` (~2GB).

Questo valore è disponibile inoltre come [`buffer.kMaxLength`][].

### `buffer.constants.MAX_STRING_LENGTH`
<!-- YAML
added: v8.2.0
-->

* {integer} La lunghezza maggiore consentita per una singola istanza `string`.

Represents the largest `length` that a `string` primitive can have, counted in UTF-16 code units.

Questo valore può dipendere dal motore JS che viene utilizzato.
