# Buffer

<!--introduced_in=v0.1.90-->

> Estabilidad: 2 - Estable

Prior to the introduction of [`TypedArray`], the JavaScript language had no mechanism for reading or manipulating streams of binary data. The `Buffer` class was introduced as part of the Node.js API to enable interaction with octet streams in TCP streams, file system operations, and other contexts.

With [`TypedArray`] now available, the `Buffer` class implements the [`Uint8Array`] API in a manner that is more optimized and suitable for Node.js.

Instances of the `Buffer` class are similar to arrays of integers but correspond to fixed-sized, raw memory allocations outside the V8 heap. The size of the `Buffer` is established when it is created and cannot be changed.

The `Buffer` class is within the global scope, making it unlikely that one would need to ever use `require('buffer').Buffer`.

```js
// Crea un Buffer lleno de ceros de longitud 10.
const buf1 = Buffer.alloc(10);

// Crea un Buffer de longitud 10, lleno con 0x1.
const buf2 = Buffer.alloc(10, 1);

// Crea un buffer sin inicializar de longitud 10.
// Esto es más rápido que llamar a Buffer.alloc() pero la instancia
// de buffer retornada podría contener datos antiguos que necesiten ser
// sobrescritos utilizando ya sea fill() o write().
const buf3 = Buffer.allocUnsafe(10);

// Crea un Buffer que contiene [0x1, 0x2, 0x3].
const buf4 = Buffer.from([1, 2, 3]);

// Crea un Buffer que contiene bytes UTF-8 [0x74, 0xc3, 0xa9, 0x73, 0x74].
const buf5 = Buffer.from('tést');

// Crea un Buffer que contiene bytes Latin-1 [0x74, 0xe9, 0x73, 0x74].
const buf6 = Buffer.from('tést', 'latin1');
```

## `Buffer.from()`, `Buffer.alloc()`, y `Buffer.allocUnsafe()`

In versions of Node.js prior to 6.0.0, `Buffer` instances were created using the `Buffer` constructor function, which allocates the returned `Buffer` differently based on what arguments are provided:

* Passing a number as the first argument to `Buffer()` (e.g. `new Buffer(10)`) allocates a new `Buffer` object of the specified size. Prior to Node.js 8.0.0, the memory allocated for such `Buffer` instances is *not* initialized and *can contain sensitive data*. Such `Buffer` instances *must* be subsequently initialized by using either [`buf.fill(0)`][`buf.fill()`] or by writing to the entire `Buffer`. While this behavior is *intentional* to improve performance, development experience has demonstrated that a more explicit distinction is required between creating a fast-but-uninitialized `Buffer` versus creating a slower-but-safer `Buffer`. Starting in Node.js 8.0.0, `Buffer(num)` and `new Buffer(num)` will return a `Buffer` with initialized memory.
* Passing a string, array, or `Buffer` as the first argument copies the passed object's data into the `Buffer`.
* Passing an [`ArrayBuffer`] or a [`SharedArrayBuffer`] returns a `Buffer` that shares allocated memory with the given array buffer.

Because the behavior of `new Buffer()` is different depending on the type of the first argument, security and reliability issues can be inadvertently introduced into applications when argument validation or `Buffer` initialization is not performed.

To make the creation of `Buffer` instances more reliable and less error-prone, the various forms of the `new Buffer()` constructor have been **deprecated** and replaced by separate `Buffer.from()`, [`Buffer.alloc()`], and [`Buffer.allocUnsafe()`] methods.

*Developers should migrate all existing uses of the `new Buffer()` constructors to one of these new APIs.*

* [`Buffer.from(array)`] returns a new `Buffer` that *contains a copy* of the provided octets.
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`] returns a new `Buffer` that *shares the same allocated memory* as the given [`ArrayBuffer`].
* [`Buffer.from(buffer)`] returns a new `Buffer` that *contains a copy* of the contents of the given `Buffer`.
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`] returns a new `Buffer` that *contains a copy* of the provided string.
* [`Buffer.alloc(size[, fill[, encoding]])`][`Buffer.alloc()`] returns a new initialized `Buffer` of the specified size. This method is slower than [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] but guarantees that newly created `Buffer` instances never contain old data that is potentially sensitive.
* [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] and [`Buffer.allocUnsafeSlow(size)`][`Buffer.allocUnsafeSlow()`] each return a new uninitialized `Buffer` of the specified `size`. Because the `Buffer` is uninitialized, the allocated segment of memory might contain old data that is potentially sensitive.

`Buffer` instances returned by [`Buffer.allocUnsafe()`] *may* be allocated off a shared internal memory pool if `size` is less than or equal to half [`Buffer.poolSize`]. Instances returned by [`Buffer.allocUnsafeSlow()`] *never* use the shared internal memory pool.

### La opción de línea de comando `--zero-fill-buffers`

<!-- YAML
added: v5.10.0
-->

Node.js can be started using the `--zero-fill-buffers` command line option to cause all newly allocated `Buffer` instances to be zero-filled upon creation by default, including buffers returned by `new Buffer(size)`, [`Buffer.allocUnsafe()`], [`Buffer.allocUnsafeSlow()`], and `new
SlowBuffer(size)`. Use of this flag can have a significant negative impact on performance. Use of the `--zero-fill-buffers` option is recommended only when necessary to enforce that newly allocated `Buffer` instances cannot contain old data that is potentially sensitive.

```txt
$ node --zero-fill-buffers
> Buffer.allocUnsafe(5);
<Buffer 00 00 00 00 00>
```

### ¿Qué hace a `Buffer.allocUnsafe()` y `Buffer.allocUnsafeSlow()` "inseguros"?

When calling [`Buffer.allocUnsafe()`] and [`Buffer.allocUnsafeSlow()`], the segment of allocated memory is *uninitialized* (it is not zeroed-out). While this design makes the allocation of memory quite fast, the allocated segment of memory might contain old data that is potentially sensitive. Using a `Buffer` created by [`Buffer.allocUnsafe()`] without *completely* overwriting the memory can allow this old data to be leaked when the `Buffer` memory is read.

While there are clear performance advantages to using [`Buffer.allocUnsafe()`], extra care *must* be taken in order to avoid introducing security vulnerabilities into an application.

## Buffer y Codificaciones de Caracteres

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
// Imprime: 68656c6c6f20776f726c64
console.log(buf.toString('base64'));
// Imprime: aGVsbG8gd29ybGQ=

console.log(Buffer.from('fhqwhgads', 'ascii'));
// Imprime: <Buffer 66 68 71 77 68 67 61 64 73>
console.log(Buffer.from('fhqwhgads', 'utf16le'));
// Imprime: <Buffer 66 00 68 00 71 00 77 00 68 00 67 00 61 00 64 00 73 00>
```

Las codificaciones de caracteres soportadas actualmente por Node.js incluyen:

* `'ascii'` - Solo para datos ASCII de 7-bit. This encoding is fast and will strip the high bit if set.

* `'utf8'` - Caracteres Unicode codificados en multibyte. Many web pages and other document formats use UTF-8.

* `'utf16le'` - caracteres Unicode codificados en little-endian, de 2 o 4 bytes. Los pares sustituidos (U+10000 a U+10FFFF) están soportados.

* `'ucs2'` - Alias de `'utf16le'`.

* `'base64'` - Codificación de Base64. When creating a `Buffer` from a string, this encoding will also correctly accept "URL and Filename Safe Alphabet" as specified in [RFC4648, Section 5](https://tools.ietf.org/html/rfc4648#section-5).

* `'latin1'` - A way of encoding the `Buffer` into a one-byte encoded string (as defined by the IANA in [RFC1345](https://tools.ietf.org/html/rfc1345), page 63, to be the Latin-1 supplement block and C0/C1 control codes).

* `'binary'` - Alias de `'latin1'`.

* `'hex'` - Codifica cada byte como dos caracteres hexadecimales.

Modern Web browsers follow the [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/) which aliases both `'latin1'` and `'ISO-8859-1'` to `'win-1252'`. This means that while doing something like `http.get()`, if the returned charset is one of those listed in the WHATWG specification it is possible that the server actually returned `'win-1252'`-encoded data, and using `'latin1'` encoding may incorrectly decode the characters.

## Buffers y TypedArray

<!-- YAML
changes:

  - version: v3.0.0
    pr-url: https://github.com/nodejs/node/pull/2002
    description: The `Buffer`s class now inherits from `Uint8Array`.
-->

Las instancias de `Buffer` también son instancias de [`Uint8Array`]. However, there are subtle incompatibilities with [`TypedArray`]. For example, while [`ArrayBuffer#slice()`] creates a copy of the slice, the implementation of [`Buffer#slice()`][`buf.slice()`] creates a view over the existing `Buffer` without copying, making [`Buffer#slice()`][`buf.slice()`] far more efficient.

It is also possible to create new [`TypedArray`] instances from a `Buffer` with the following caveats:

1. La memoria del objeto de `Buffer` se copia en el [`TypedArray`], no se comparte.

2. The `Buffer` object's memory is interpreted as an array of distinct elements, and not as a byte array of the target type. That is, `new Uint32Array(Buffer.from([1, 2, 3, 4]))` creates a 4-element [`Uint32Array`] with elements `[1, 2, 3, 4]`, not a [`Uint32Array`] with a single element `[0x1020304]` or `[0x4030201]`.

It is possible to create a new `Buffer` that shares the same allocated memory as a [`TypedArray`] instance by using the `TypedArray` object's `.buffer` property.

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Copia el contenido de `arr`
const buf1 = Buffer.from(arr);
// Comparte memoria con `arr`
const buf2 = Buffer.from(arr.buffer);

console.log(buf1);
// Imprime: <Buffer 88 a0>
console.log(buf2);
// Imprime: <Buffer 88 13 a0 0f>

arr[1] = 6000;

console.log(buf1);
// Imprime: <Buffer 88 a0>
console.log(buf2);
// Imprime: <Buffer 88 13 70 17>
```

Note that when creating a `Buffer` using a [`TypedArray`]'s `.buffer`, it is possible to use only a portion of the underlying [`ArrayBuffer`] by passing in `byteOffset` and `length` parameters.

```js
const arr = new Uint16Array(20);
const buf = Buffer.from(arr.buffer, 0, 16);

console.log(buf.length);
// Imprime: 16
```

The `Buffer.from()` and [`TypedArray.from()`] have different signatures and implementations. Specifically, the [`TypedArray`] variants accept a second argument that is a mapping function that is invoked on every element of the typed array:

* `TypedArray.from(source[, mapFn[, thisArg]])`

The `Buffer.from()` method, however, does not support the use of a mapping function:

* [`Buffer.from(array)`]
* [`Buffer.from(buffer)`]
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`]
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`]

## Buffers e Iteración

Las instancias de `Buffer` pueden iterarse utilizando la sintaxis `for..of`:

```js
const buf = Buffer.from([1, 2, 3]);

// Imprime:
//   1
//   2
//   3
for (const b of buf) {
  console.log(b);
}
```

Additionally, the [`buf.values()`], [`buf.keys()`], and [`buf.entries()`] methods can be used to create iterators.

## Clase: Buffer

La clase `Buffer` es un tipo global para tratar con datos binarios directamente. Hay una variedad de maneras en las que puede ser construido.

### nuevo Buffer(array)

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

> Estabilidad: 0 - Obsoleto: Utilice [`Buffer.from(array)`] en su lugar.

* `array` {integer[]} un arreglo de bytes desde el cual copiar.

Asigna un nuevo `Buffer` utilizando un `array` de octetos.

```js
// Crea un nuevo Buffer que contiene los bytes UTF-8 de la cadena 'buffer'
const buf = new Buffer([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
```

### nuevo Buffer(arrayBuffer[, byteOffset[, length]])

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

* `arrayBuffer` {ArrayBuffer|SharedArrayBuffer} An [`ArrayBuffer`], [`SharedArrayBuffer`] or the `.buffer` property of a [`TypedArray`].
* `byteOffset` {integer} Índice del primer byte para exponer. **Predeterminado:** `0`.
* `length` {integer} Número de bytes para exponer. **Predeterminado:** `arrayBuffer.length - byteOffset`.

This creates a view of the [`ArrayBuffer`] or [`SharedArrayBuffer`] without copying the underlying memory. For example, when passed a reference to the `.buffer` property of a [`TypedArray`] instance, the newly created `Buffer` will share the same allocated memory as the [`TypedArray`].

The optional `byteOffset` and `length` arguments specify a memory range within the `arrayBuffer` that will be shared by the `Buffer`.

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Comparte memoria con `arr`
const buf = new Buffer(arr.buffer);

console.log(buf);
// Imprime: <Buffer 88 13 a0 0f>

// Cambiar el Uint16Array original también cambia el Buffer
arr[1] = 6000;

console.log(buf);
// Imprime: <Buffer 88 13 70 17>
```

### nuevo Buffer(buffer)

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

> Estabilidad: 0 - Obsoleto: Utilice [`Buffer.from(buffer)`] en su lugar.

* `buffer` {Buffer|Uint8Array} An existing `Buffer` or [`Uint8Array`] from which to copy data.

Copia los datos del `buffer` pasado en una nueva instancia de `Buffer`.

```js
const buf1 = new Buffer('buffer');
const buf2 = new Buffer(buf1);

buf1[0] = 0x61;

console.log(buf1.toString());
// Imprime: auffer
console.log(buf2.toString());
// Imprime: buffer
```

### nuevo Buffer(size)

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

> Stability: 0 - Deprecated: Use [`Buffer.alloc()`] instead (also see [`Buffer.allocUnsafe()`]).

* `size` {integer} La longitud deseada del nuevo `Buffer`.

Asigna un nuevo `Buffer` de bytes de `size`. If `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, [`ERR_INVALID_OPT_VALUE`] is thrown. Un `Buffer` de longitud cero se crea si `size` es 0.

Prior to Node.js 8.0.0, the underlying memory for `Buffer` instances created in this way is *not initialized*. The contents of a newly created `Buffer` are unknown and *may contain sensitive data*. Use [`Buffer.alloc(size)`][`Buffer.alloc()`] instead to initialize a `Buffer` with zeroes.

```js
const buf = new Buffer(10);

console.log(buf);
// Imprime: <Buffer 00 00 00 00 00 00 00 00 00 00>
```

### nuevo Buffer(string[, encoding])

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

> Stability: 0 - Deprecated: Use [`Buffer.from(string[, encoding])`][`Buffer.from(string)`] instead.

* `string` {string} Cadena para codificar.
* `encoding` {string} La codificación del `string`. **Predeterminado:** `'utf8'`.

Crea un nuevo `Buffer` que contiene `string`. The `encoding` parameter identifies the character encoding of `string`.

```js
const buf1 = new Buffer('esto es un tést');
const buf2 = new Buffer('7468697320697320612074c3a97374', 'hex');

console.log(buf1.toString());
// Imprime: esto es un tést
console.log(buf2.toString());
// Imprime: esto es un tést
console.log(buf1.toString('ascii'));
// Imprime: esto es un tC)st
```

### Método de Clase: Buffer.alloc(size[, fill[, encoding]])

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

* `size` {integer} La longitud deseada del nuevo `Buffer`.
* `fill` {string|Buffer|integer} Un valor con el que llenar previamente el nuevo `Buffer`. **Predeterminado:** `0`.
* `encoding` {string} Si `fill` es una cadena, esta es su codificación. **Predeterminado:** `'utf8'`.

Asigna un nuevo `Buffer` de `size` bytes. If `fill` is `undefined`, the `Buffer` will be *zero-filled*.

```js
const buf = Buffer.alloc(5);

console.log(buf);
// Imprime: <Buffer 00 00 00 00 00>
```

Asigna un nuevo `Buffer` de `size` bytes. If `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, [`ERR_INVALID_OPT_VALUE`] is thrown. Un `Buffer` de longitud cero se crea si `size` es 0.

If `fill` is specified, the allocated `Buffer` will be initialized by calling [`buf.fill(fill)`][`buf.fill()`].

```js
const buf = Buffer.alloc(5, 'a');

console.log(buf);
// Imprime: <Buffer 61 61 61 61 61>
```

If both `fill` and `encoding` are specified, the allocated `Buffer` will be initialized by calling [`buf.fill(fill, encoding)`][`buf.fill()`].

```js
const buf = Buffer.alloc(11, 'aGVsbG8gd29ybGQ=', 'base64');

console.log(buf);
// Imprime: <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64>
```

Calling [`Buffer.alloc()`] can be significantly slower than the alternative [`Buffer.allocUnsafe()`] but ensures that the newly created `Buffer` instance contents will *never contain sensitive data*.

Se producirá un `TypeError` si `size` no es un número.

### Método de Clase: Buffer.allocUnsafe(size)

<!-- YAML
added: v5.10.0
changes:

  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7079
    description: Passing a negative `size` will now throw an error.
-->

* `size` {integer} La longitud deseada del nuevo `Buffer`.

Asigna un nuevo `Buffer` de `size` bytes. If `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, [`ERR_INVALID_OPT_VALUE`] is thrown. Un `Buffer` de longitud cero se crea si `size` es 0.

The underlying memory for `Buffer` instances created in this way is *not initialized*. The contents of the newly created `Buffer` are unknown and *may contain sensitive data*. Use [`Buffer.alloc()`] instead to initialize `Buffer` instances with zeroes.

```js
const buf = Buffer.allocUnsafe(10);

console.log(buf);
// Imprime: (puede variar el contenido): <Buffer a0 8b 28 3f 01 00 00 00 50 32>

buf.fill(0);

console.log(buf);
// Imprime: <Buffer 00 00 00 00 00 00 00 00 00 00>
```

Se producirá un `TypeError` si `size` no es un número.

Note that the `Buffer` module pre-allocates an internal `Buffer` instance of size [`Buffer.poolSize`] that is used as a pool for the fast allocation of new `Buffer` instances created using [`Buffer.allocUnsafe()`] and the deprecated `new Buffer(size)` constructor only when `size` is less than or equal to `Buffer.poolSize >> 1` (floor of [`Buffer.poolSize`] divided by two).

Use of this pre-allocated internal memory pool is a key difference between calling `Buffer.alloc(size, fill)` vs. `Buffer.allocUnsafe(size).fill(fill)`. Specifically, `Buffer.alloc(size, fill)` will *never* use the internal `Buffer` pool, while `Buffer.allocUnsafe(size).fill(fill)` *will* use the internal `Buffer` pool if `size` is less than or equal to half [`Buffer.poolSize`]. The difference is subtle but can be important when an application requires the additional performance that [`Buffer.allocUnsafe()`] provides.

### Método de Clase: Buffer.allocUnsafeSlow(size)

<!-- YAML
added: v5.12.0
-->

* `size` {integer} La longitud deseada del nuevo `Buffer`.

Asigna un nuevo `Buffer` de `size` bytes. If `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, [`ERR_INVALID_OPT_VALUE`] is thrown. Un `Buffer` de longitud cero se crea si `size` es 0.

The underlying memory for `Buffer` instances created in this way is *not initialized*. The contents of the newly created `Buffer` are unknown and *may contain sensitive data*. Use [`buf.fill(0)`][`buf.fill()`] to initialize such `Buffer` instances with zeroes.

When using [`Buffer.allocUnsafe()`] to allocate new `Buffer` instances, allocations under 4KB are sliced from a single pre-allocated `Buffer`. This allows applications to avoid the garbage collection overhead of creating many individually allocated `Buffer` instances. This approach improves both performance and memory usage by eliminating the need to track and clean up as many persistent objects.

However, in the case where a developer may need to retain a small chunk of memory from a pool for an indeterminate amount of time, it may be appropriate to create an un-pooled `Buffer` instance using `Buffer.allocUnsafeSlow()` and then copying out the relevant bits.

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

`Buffer.allocUnsafeSlow()` should be used only as a last resort after a developer has observed undue memory retention in their applications.

Se producirá un `TypeError` si `size` no es un número.

### Método de Clase: Buffer.byteLength(string[, encoding])

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
* `encoding` {string} Si `string` es una cadena, esta es su codificación. **Predeterminado:** `'utf8'`.
* Devuelve: {integer} El número de bytes contenidos en `string`.

Devuelve la longitud real en byte de una cadena. This is not the same as [`String.prototype.length`] since that returns the number of *characters* in a string.

Para `'base64'` y `'hex'`, esta función asume una entrada válida. For strings that contain non-Base64/Hex-encoded data (e.g. whitespace), the return value might be greater than the length of a `Buffer` created from the string.

```js
const str = '\u00bd + \u00bc = \u00be';

console.log(`${str}: ${str.length} characters, ` +
            `${Buffer.byteLength(str, 'utf8')} bytes`);
// Imprime: ½ + ¼ = ¾: 9 caracteres, 12 bytes
```

When `string` is a `Buffer`/[`DataView`]/[`TypedArray`]/[`ArrayBuffer`]/ [`SharedArrayBuffer`], the actual byte length is returned.

### Método de Clase: Buffer.compare(buf1, buf2)

<!-- YAML
added: v0.11.13
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The arguments can now be `Uint8Array`s.
-->

* `buf1` {Buffer|Uint8Array}
* `buf2` {Buffer|Uint8Array}
* Devuelve: {integer}

Compares `buf1` to `buf2` typically for the purpose of sorting arrays of `Buffer` instances. This is equivalent to calling [`buf1.compare(buf2)`][`buf.compare()`].

```js
const buf1 = Buffer.from('1234');
const buf2 = Buffer.from('0123');
const arr = [buf1, buf2];

console.log(arr.sort(Buffer.compare));
// Imprime: [ <Buffer 30 31 32 33>, <Buffer 31 32 33 34> ]
// (Este resultado es igual a: [buf2, buf1])
```

### Método de Clase: Buffer.concat(list[, totalLength])

<!-- YAML
added: v0.7.11
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The elements of `list` can now be `Uint8Array`s.
-->

* `list` {Buffer[] | Uint8Array[]} List of `Buffer` or [`Uint8Array`] instances to concat.
* `totalLength` {integer} Total length of the `Buffer` instances in `list` when concatenated.
* Devuelve: {Buffer}

Returns a new `Buffer` which is the result of concatenating all the `Buffer` instances in the `list` together.

If the list has no items, or if the `totalLength` is 0, then a new zero-length `Buffer` is returned.

If `totalLength` is not provided, it is calculated from the `Buffer` instances in `list`. This however causes an additional loop to be executed in order to calculate the `totalLength`, so it is faster to provide the length explicitly if it is already known.

Si se proporciona `totalLength`, se forza a ser un número entero, sin signos. If the combined length of the `Buffer`s in `list` exceeds `totalLength`, the result is truncated to `totalLength`.

```js
// Crea un `Buffer` único desde una lista de tres instancias de `Buffer`.

const buf1 = Buffer.alloc(10);
const buf2 = Buffer.alloc(14);
const buf3 = Buffer.alloc(18);
const totalLength = buf1.length + buf2.length + buf3.length;

console.log(totalLength);
// Imprime: 42

const bufA = Buffer.concat([buf1, buf2, buf3], totalLength);

console.log(bufA);
// Imprime: <Buffer 00 00 00 00 ...>
console.log(bufA.length);
// Imprime: 42
```

### Método de Clase: Buffer.from(array)

<!-- YAML
added: v5.10.0
-->

* `array` {integer[]}

Asigna un nuevo `Buffer` utilizando un `array` de octetos.

```js
// Crea un nuevo Buffer que contiene bytes UTF-8 de la cadena 'buffer'
const buf = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
```

Se producirá un `TypeError` si `array` no es un `Array`.

### Método de Clase: Buffer.from(arrayBuffer[, byteOffset[, length]])

<!-- YAML
added: v5.10.0
-->

* `arrayBuffer` {ArrayBuffer|SharedArrayBuffer} An [`ArrayBuffer`], [`SharedArrayBuffer`], or the `.buffer` property of a [`TypedArray`].
* `byteOffset` {integer} Índice del primer byte a exponer. **Predeterminado:** `0`.
* `length` {integer} número de bytes a exponer. **Predeterminado:** `arrayBuffer.length - byteOffset`.

This creates a view of the [`ArrayBuffer`] without copying the underlying memory. For example, when passed a reference to the `.buffer` property of a [`TypedArray`] instance, the newly created `Buffer` will share the same allocated memory as the [`TypedArray`].

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Comparte memoria con `arr`
const buf = Buffer.from(arr.buffer);

console.log(buf);
// Imprime: <Buffer 88 13 a0 0f>

// Al cambiar el Uint16Array original también cambia el Buffer
arr[1] = 6000;

console.log(buf);
// Imprime: <Buffer 88 13 70 17>
```

The optional `byteOffset` and `length` arguments specify a memory range within the `arrayBuffer` that will be shared by the `Buffer`.

```js
const ab = new ArrayBuffer(10);
const buf = Buffer.from(ab, 0, 2);

console.log(buf.length);
// Imprime: 2
```

A `TypeError` will be thrown if `arrayBuffer` is not an [`ArrayBuffer`] or a [`SharedArrayBuffer`].

### Método de Clase: Buffer.from(buffer)

<!-- YAML
added: v5.10.0
-->

* `buffer` {Buffer|Uint8Array} An existing `Buffer` or [`Uint8Array`] from which to copy data.

Copia los datos del `buffer` pasado en una nueva instancia de `Buffer`.

```js
const buf1 = Buffer.from('buffer');
const buf2 = Buffer.from(buf1);

buf1[0] = 0x61;

console.log(buf1.toString());
// Imprime: auffer
console.log(buf2.toString());
// Imprime: buffer
```

Se producirá un `TypeError` si `buffer` no es un `Buffer`.

### Método de Clase: Buffer.from(object[, offsetOrEncoding[, length]])

<!-- YAML
added: v8.2.0
-->

* `object` {Object} Un objeto que admite `Symbol.toPrimitive` o `valueOf()`
* `offsetOrEncoding` {number|string} A byte-offset or encoding, depending on the value returned either by `object.valueOf()` or `object[Symbol.toPrimitive]()`.
* `length` {number} A length, depending on the value returned either by `object.valueOf()` or `object[Symbol.toPrimitive]()`.

For objects whose `valueOf()` function returns a value not strictly equal to `object`, returns `Buffer.from(object.valueOf(), offsetOrEncoding, length)`.

```js
const buf = Buffer.from(new String('this is a test')); 
// Imprime: <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

For objects that support `Symbol.toPrimitive`, returns `Buffer.from(object[Symbol.toPrimitive](), offsetOrEncoding, length)`.

```js
class Foo { 
  [Symbol.toPrimitive]() { 
    return 'this is a test'; 
  } 
} 

const buf = Buffer.from(new Foo(), 'utf8'); //
Imprime: <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

### Método de Clase: Buffer.from(string[, encoding])

<!-- YAML
added: v5.10.0
-->

* `string` {string} Una string a codificar.
* `encoding` {string} La codificación de `string`. **Predeterminado:** `'utf8'`.

Crea un nuevo `Buffer` que contiene `string`. The `encoding` parameter identifies the character encoding of `string`.

```js
const buf1 = Buffer.from('this is a tést');
const buf2 = Buffer.from('7468697320697320612074c3a97374', 'hex');

console.log(buf1.toString());
// Imprime: this is a tést
console.log(buf2.toString()); 
// Imprime: this is a tést 
console.log(buf1.toString('ascii')); 
// Imprime: this is a tC)st
```

Se producirá un `TypeError` si `string` no es una cadena.

### Método de Clase: Buffer.isBuffer(obj)

<!-- YAML
added: v0.1.101
-->

* `obj` {Object}
* Devuelve: {boolean}

Devuelve `true` si `obj` es un `Buffer`, de lo contrario devuelve `false`.

### Método de Clase: Buffer.isEncoding(encoding)

<!-- YAML
added: v0.9.1
-->

* `encoding` {string} Un nombre de codificación de caracteres para verificar.
* Devuelve: {boolean}

Returns `true` if `encoding` contains a supported character encoding, or `false` otherwise.

### Propiedad de Clase: Buffer.poolSize

<!-- YAML
added: v0.11.3
-->

* {integer} **Predeterminado:** `8192`

This is the size (in bytes) of pre-allocated internal `Buffer` instances used for pooling. Este valor puede ser modificado.

### buf[index]

<!-- YAML
type: property
name: [index]
-->

The index operator `[index]` can be used to get and set the octet at position `index` in `buf`. The values refer to individual bytes, so the legal value range is between `0x00` and `0xFF` (hex) or `0` and `255` (decimal).

This operator is inherited from `Uint8Array`, so its behavior on out-of-bounds access is the same as `UInt8Array` - that is, getting returns `undefined` and setting does nothing.

```js
// Copia una cadena ASCII dentro de un `Buffer`, un byte a la vez.

const str = 'Node.js';
const buf = Buffer.allocUnsafe(str.length);

for (let i = 0; i < str.length; i++) {
  buf[i] = str.charCodeAt(i);
}

console.log(buf.toString('ascii'));
// Imprime: Node.js
```

### buf.buffer

* {ArrayBuffer} The underlying `ArrayBuffer` object based on which this `Buffer` object is created.

```js
const arrayBuffer = new ArrayBuffer(16);
const buffer = Buffer.from(arrayBuffer);

console.log(buffer.buffer === arrayBuffer);
// Imprime: true
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

* `target` {Buffer|Uint8Array} A `Buffer` or [`Uint8Array`] with which to compare `buf`.
* `targetStart` {integer} The offset within `target` at which to begin comparison. **Predeterminado:** `0`.
* `targetEnd` {integer} The offset with `target` at which to end comparison (not inclusive). **Predeterminado:** `target.length`.
* `sourceStart` {integer} El desplazamiento dentro de `buf` con el que debe comenzar la comparación. **Predeterminado:** `0`.
* `sourceEnd` {integer} The offset within `buf` at which to end comparison (not inclusive). **Predeterminado:** [`buf.length`].
* Devuelve: {integer}

Compares `buf` with `target` and returns a number indicating whether `buf` comes before, after, or is the same as `target` in sort order. La comparación se basa en la secuencia real de bytes en cada `Buffer`.

* Se devuelve `0` si `target` es igual que `buf`
* Se devuelve `1` si `target` debe aparecer *antes* de `buf` cuando se ordenan.
* Se devuelve `-1` si `target` debe aparecer *después* de `buf` cuando se ordenan.

```js
const buf1 = Buffer.from('ABC');
const buf2 = Buffer.from('BCD');
const buf3 = Buffer.from('ABCD');

console.log(buf1.compare(buf1));
// Imprime: 0
console.log(buf1.compare(buf2));
// Imprime: -1
console.log(buf1.compare(buf3));
// Imprime: -1
console.log(buf2.compare(buf1));
// Imprime: 1
console.log(buf2.compare(buf3));
// Imprime: 1
console.log([buf1, buf2, buf3].sort(Buffer.compare));
// Imprime: [ <Buffer 41 42 43>, <Buffer 41 42 43 44>, <Buffer 42 43 44> ]
// (Este resultado es igual a: [buf1, buf3, buf2])
```

The optional `targetStart`, `targetEnd`, `sourceStart`, and `sourceEnd` arguments can be used to limit the comparison to specific ranges within `target` and `buf` respectively.

```js
const buf1 = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);
const buf2 = Buffer.from([5, 6, 7, 8, 9, 1, 2, 3, 4]);

console.log(buf1.compare(buf2, 5, 9, 0, 4));
// Imprime: 0
console.log(buf1.compare(buf2, 0, 6, 4));
// Imprime: -1
console.log(buf1.compare(buf2, 5, 6, 5));
// Imprime: 1
```

[`ERR_INDEX_OUT_OF_RANGE`] is thrown if `targetStart < 0`, `sourceStart < 0`, `targetEnd > target.byteLength`, or `sourceEnd > source.byteLength`.

### buf.copy(target[, targetStart[, sourceStart[, sourceEnd]]])

<!-- YAML
added: v0.1.90
-->

* `target` {Buffer|Uint8Array} Un `Buffer` o [`Uint8Array`] en el cual copiar.
* `targetStart` {integer} The offset within `target` at which to begin writing. **Por defecto:** `0`.
* `sourceStart` {integer} El desplazamiento dentro del `buf` desde el que comenzar a copiar. **Por defecto:** `0`.
* `sourceEnd` {integer} The offset within `buf` at which to stop copying (not inclusive). **Predeterminado:** [`buf.length`].
* Devuelve: {integer} El número de bytes copiados.

Copies data from a region of `buf` to a region in `target` even if the `target` memory region overlaps with `buf`.

```js
// Crea dos instancias de `Buffer`.
const buf1 = Buffer.allocUnsafe(26);
const buf2 = Buffer.allocUnsafe(26).fill('!');

for (let i = 0; i < 26; i++) {
  // 97 es el valor ASCII decimal para 'a'
  buf1[i] = i + 97;
}

// Copia de `buf1` los bytes del 16 al 19 en` buf2` comenzando en el byte 8 de `buf2`
buf1.copy(buf2, 8, 16, 20);

console.log(buf2.toString('ascii', 0, 25));
// Imprime: !!!!!!!!qrst!!!!!!!!!!!!!
```

```js
// Crea un `Buffer` y copia datos desde una región a una región superpuesta
// dentro del mismo `Buffer`.

const buf = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 es el valor ASCII decimal para 'a'
  buf[i] = i + 97;
}

buf.copy(buf, 0, 4, 10);

console.log(buf.toString());
// Imprime: efghijghijklmnopqrstuvwxyz
```

### buf.entries()

<!-- YAML
added: v1.1.0
-->

* Devuelve: {Iterator}

Creates and returns an [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) of `[index, byte]` pairs from the contents of `buf`.

```js
// Registra el contenido completo de un `Buffer`.

const buf = Buffer.from('buffer');

for (const pair of buf.entries()) {
  console.log(pair);
}
// Imprime:
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

* `otherBuffer` {Buffer} A `Buffer` or [`Uint8Array`] with which to compare `buf`.
* Devuelve: {boolean}

Returns `true` if both `buf` and `otherBuffer` have exactly the same bytes, `false` otherwise.

```js
const buf1 = Buffer.from('ABC');
const buf2 = Buffer.from('414243', 'hex');
const buf3 = Buffer.from('ABCD');

console.log(buf1.equals(buf2));
// Imprime: true
console.log(buf1.equals(buf3));
// Imprime: false
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

* `value` {string|Buffer|integer} El valor con el que llenar `buf`.
* `offset` {integer} Número de bytes a omitir antes de empezar a llenar `buf`. **Predeterminado:** `0`.
* `end` {integer} Dónde detener el llenado del `buf` (no incluido). **Predeterminado:** [`buf.length`].
* `encoding` {string} La codificación para el `value` si `value` es una cadena. **Predeterminado:** `'utf8'`.
* Devuelve: {Buffer} Una referencia a `buf`.

Llena `buf` con el `value` especificado. If the `offset` and `end` are not given, the entire `buf` will be filled:

```js
// Llena un `Buffer`con el caracter ASCII 'h'.

const b = Buffer.allocUnsafe(50).fill('h');

console.log(b.toString());
// Imprime: hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
```

`value` is coerced to a `uint32` value if it is not a string, `Buffer`, or integer. If the resulting integer is greater than `255` (decimal), `buf` will be filled with `value & 255`.

If the final write of a `fill()` operation falls on a multi-byte character, then only the bytes of that character that fit into `buf` are written:

```js
// Llena un `Buffer`con un caracter de dos bytes.

console.log(Buffer.allocUnsafe(3).fill('\u0222'));
// Imprime: <Buffer c8 a2 c8>
```

If `value` contains invalid characters, it is truncated; if no valid fill data remains, an exception is thrown:

```js
const buf = Buffer.allocUnsafe(5);

console.log(buf.fill('a'));
// Imprime: <Buffer 61 61 61 61 61>
console.log(buf.fill('aazz', 'hex'));
// Imprime: <Buffer aa aa aa aa aa>
console.log(buf.fill('zz', 'hex'));
// Se produce una excepción.
```

### buf.includes(value\[, byteOffset\]\[, encoding\])

<!-- YAML
added: v5.3.0
-->

* `value` {string|Buffer|integer} Qué buscar.
* `byteOffset` {integer} Dónde comenzar la búsqueda en `buf`. **Predeterminado:** `0`.
* `encoding` {string} Si `value` es una cadena, esta es su codificación. **Predeterminado:** `'utf8'`.
* Devuelve: {boolean} `true` si `value` se encontró en `buf`, y `false` de lo contrario.

Equivalente a [`buf.indexOf() !== -1`][`buf.indexOf()`].

```js
const buf = Buffer.from('this is a buffer');

console.log(buf.includes('this'));
// Imprime: true
console.log(buf.includes('is'));
// Imprime: true
console.log(buf.includes(Buffer.from('a buffer')));
// Imprime: true
console.log(buf.includes(97));
// Imprime: true (97 is the decimal ASCII value for 'a')
console.log(buf.includes(Buffer.from('a buffer example')));
// Imprime: false
console.log(buf.includes(Buffer.from('a buffer example').slice(0, 8)));
// Imprime: true
console.log(buf.includes('this', 4));
// Imprime: false
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

* `value` {string|Buffer|Uint8Array|integer} Qué buscar.
* `byteOffset` {integer} Dónde comenzar la búsqueda en `buf`. **Predeterminado:** `0`.
* `encoding` {string} If `value` is a string, this is the encoding used to determine the binary representation of the string that will be searched for in `buf`. **Predeterminado:** `'utf8'`.
* Returns: {integer} The index of the first occurrence of `value` in `buf`, or `-1` if `buf` does not contain `value`.

Si `value` es:

* a string, `value` is interpreted according to the character encoding in `encoding`.
* un `Buffer` o [`Uint8Array`], `value` se utilizará en su totalidad. Para comparar un `Buffer` parcial, utilice [`buf.slice()`].
* a number, `value` will be interpreted as an unsigned 8-bit integer value between `0` and `255`.

```js
const buf = Buffer.from('this is a buffer');

console.log(buf.indexOf('this'));
// Imprime: 0
console.log(buf.indexOf('is'));
// Imprime: 2
console.log(buf.indexOf(Buffer.from('a buffer')));
// Imprime: 8
console.log(buf.indexOf(97));
// Imprime: 8 (97 es el valor ASCII decimal para 'a')
console.log(buf.indexOf(Buffer.from('a buffer example')));
// Imprime: -1
console.log(buf.indexOf(Buffer.from('a buffer example').slice(0, 8)));
// Imprime: 8

const utf16Buffer = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'utf16le');

console.log(utf16Buffer.indexOf('\u03a3', 0, 'utf16le'));
// Imprime: 4
console.log(utf16Buffer.indexOf('\u03a3', -4, 'utf16le'));
// Imprime: 6
```

If `value` is not a string, number, or `Buffer`, this method will throw a `TypeError`. If `value` is a number, it will be coerced to a valid byte value, an integer between 0 and 255.

Si `byteOffset` no es un número, se forzará a un número. If the result of coercion is `NaN` or `0`, then the entire buffer will be searched. Este comportamiento coincide con [`String#indexOf()`].

```js
const b = Buffer.from('abcdef');

// Pasa un valor que es un número, pero no un byte válido
// Imprime: 2, equivalente a buscar 99 o 'c'
console.log(b.indexOf(99.9));
console.log(b.indexOf(256 + 99));

// Pasa un byteOffset que fuerza a NaN o 0
// Imprime: 1, buscando todo el buffer
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

* Devuelve: {Iterator}

Crea y devuelve un [iterador](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) de claves `buf` (índices).

```js
const buf = Buffer.from('buffer');

for (const key of buf.keys()) {
  console.log(key);
}
// Imprime:
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

* `value` {string|Buffer|Uint8Array|integer} Qué buscar.
* `byteOffset` {integer} Dónde comenzar la búsqueda en `buf`. **Predeterminado:** [`buf.length`]`- 1`.
* `encoding` {string} If `value` is a string, this is the encoding used to determine the binary representation of the string that will be searched for in `buf`. **Predeterminado:** `'utf8'`.
* Returns: {integer} The index of the last occurrence of `value` in `buf`, or `-1` if `buf` does not contain `value`.

Identical to [`buf.indexOf()`], except the last occurrence of `value` is found rather than the first occurrence.

```js
const buf = Buffer.from('this buffer is a buffer');

console.log(buf.lastIndexOf('this'));
// Imprime: 0
console.log(buf.lastIndexOf('buffer'));
// Imprime: 17
console.log(buf.lastIndexOf(Buffer.from('buffer')));
// Imprime: 17
console.log(buf.lastIndexOf(97));
// Imprime: 15 (97 es el valor ASCII decimal para 'a')
console.log(buf.lastIndexOf(Buffer.from('yolo')));
// Imprime: -1
console.log(buf.lastIndexOf('buffer', 5));
// Imprime: 5
console.log(buf.lastIndexOf('buffer', 4));
// Imprime: -1

const utf16Buffer = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'utf16le');

console.log(utf16Buffer.lastIndexOf('\u03a3', undefined, 'utf16le'));
// Imprime: 6
console.log(utf16Buffer.lastIndexOf('\u03a3', -5, 'utf16le'));
// Imprime: 4
```

If `value` is not a string, number, or `Buffer`, this method will throw a `TypeError`. If `value` is a number, it will be coerced to a valid byte value, an integer between 0 and 255.

Si `byteOffset` no es un número, se forzará a un número. Any arguments that coerce to `NaN`, like `{}` or `undefined`, will search the whole buffer. Este comportamiento coincide con [`String#lastIndexOf()`].

```js
const b = Buffer.from('abcdef');

// Pasa un valor que es un número, pero no un byte válido
// Imprime: 2, equivalente a buscar 99 o 'c'
console.log(b.lastIndexOf(99.9));
console.log(b.lastIndexOf(256 + 99));

// Pasa un byteOffset que fuerza a NaN
// Imprime: 1, buscando todo el buffer
console.log(b.lastIndexOf('b', undefined));
console.log(b.lastIndexOf('b', {}));

// Pasa un byteOffset que fuerza a 0
// Imprime: -1, equivalent to passing 0
console.log(b.lastIndexOf('b', null));
console.log(b.lastIndexOf('b', []));
```

Si `value` es una cadena vacía o un `Buffer` vacío, se devolverá `byteOffset`.

### buf.length

<!-- YAML
added: v0.1.90
-->

* {integer}

Devuelve la cantidad de memoria asignada para `buf` en bytes. Note that this does not necessarily reflect the amount of "usable" data within `buf`.

```js
// Crea un `Buffer`y escribe una cadena ASCII más corta en él.

const buf = Buffer.alloc(1234);

console.log(buf.length);
// Imprime: 1234

buf.write('some string', 0, 'ascii');

console.log(buf.length);
// Imprime: 1234
```

While the `length` property is not immutable, changing the value of `length` can result in undefined and inconsistent behavior. Applications that wish to modify the length of a `Buffer` should therefore treat `length` as read-only and use [`buf.slice()`] to create a new `Buffer`.

```js
let buf = Buffer.allocUnsafe(10);

buf.write('abcdefghj', 0, 'ascii');

console.log(buf.length);
// Imprime: 10

buf = buf.slice(0, 5);

console.log(buf.length);
// Imprime: 5
```

### buf.parent

<!-- YAML
deprecated: v8.0.0
-->

> Estabilidad: 0 - Obsoleto: Utilice [`buf.buffer`] en su lugar.

La propiedad `buf.parent` es un alias obsoleto para `buf.buffer`.

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

* `offset` {integer} Número de bytes a omitir antes de comenzar a leer. Must satisfy `0 <= offset <= buf.length - 8`.
* Devuelve: {number}

Reads a 64-bit double from `buf` at the specified `offset` with specified endian format (`readDoubleBE()` returns big endian, `readDoubleLE()` returns little endian).

```js
const buf = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]);

console.log(buf.readDoubleBE(0));
// Imprime: 8.20788039913184e-304
console.log(buf.readDoubleLE(0));
// Imprime: 5.447603722011605e-270
console.log(buf.readDoubleLE(1));
// Lanza ERR_OUT_OF_RANGE
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

* `offset` {integer} Número de bytes a omitir antes de comenzar a leer. Must satisfy `0 <= offset <= buf.length - 4`.
* Retorno: {number}

Reads a 32-bit float from `buf` at the specified `offset` with specified endian format (`readFloatBE()` returns big endian, `readFloatLE()` returns little endian).

```js
const buf = Buffer.from([1, 2, 3, 4]);

console.log(buf.readFloatBE(0));
// Imprime: 2.387939260590663e-38
console.log(buf.readFloatLE(0));
// Imprime: 1.539989614439558e-36
console.log(buf.readFloatLE(1));
// Lanza ERR_OUT_OF_RANGE
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

* `offset` {integer} Número de bytes a omitir antes de comenzar a leer. Must satisfy `0 <= offset <= buf.length - 1`.
* Devuelve: {integer}

Lee un entero de 8-bit con signo desde `buf` en el `offset` especificado.

Los enteros leídos desde un `Buffer` se interpretan como valores con signo del complemento de dos.

```js
const buf = Buffer.from([-1, 5]);

console.log(buf.readInt8(0));
// Imprime: -1
console.log(buf.readInt8(1));
// Imprime: 5
console.log(buf.readInt8(2));
// Lanza ERR_OUT_OF_RANGE
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

* `offset` {integer} Número de bytes a omitir antes de comenzar a leer. Must satisfy `0 <= offset <= buf.length - 2`.
* Devuelve: {integer}

Reads a signed 16-bit integer from `buf` at the specified `offset` with the specified endian format (`readInt16BE()` returns big endian, `readInt16LE()` returns little endian).

Los enteros leídos desde un `Buffer` se interpretan como valores con signo del complemento de dos.

```js
const buf = Buffer.from([0, 5]);

console.log(buf.readInt16BE(0));
// Imprime: 5
console.log(buf.readInt16LE(0));
// Imprime: 1280
console.log(buf.readInt16LE(1));
// Lanza ERR_OUT_OF_RANGE
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

* `offset` {integer} Número de bytes a omitir antes de comenzar a leer. Must satisfy `0 <= offset <= buf.length - 4`.
* Retorno: {integer}

Reads a signed 32-bit integer from `buf` at the specified `offset` with the specified endian format (`readInt32BE()` returns big endian, `readInt32LE()` returns little endian).

Los enteros leídos desde un `Buffer` se interpretan como valores con signo del complemento de dos.

```js
const buf = Buffer.from([0, 0, 0, 5]);

console.log(buf.readInt32BE(0));
// Imprime: 5
console.log(buf.readInt32LE(0));
// Imprime: 83886080
console.log(buf.readInt32LE(1));
// Lanza ERR_OUT_OF_RANGE
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

* `offset` {integer} Número de bytes a omitir antes de comenzar a leer. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Número de bytes a leer. Must satisfy `0 < byteLength <= 6`.
* Retorno: {integer}

Reads `byteLength` number of bytes from `buf` at the specified `offset` and interprets the result as a two's complement signed value. Soporta hasta 48 bits de precisión.

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab]);

console.log(buf.readIntLE(0, 6).toString(16));
// Imprime: -546f87a9cbee
console.log(buf.readIntBE(0, 6).toString(16));
// Imprime: 1234567890ab
console.log(buf.readIntBE(1, 6).toString(16));
// Lanza ERR_INDEX_OUT_OF_RANGE
console.log(buf.readIntBE(1, 0).toString(16));
// Lanza ERR_OUT_OF_RANGE
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

* `offset` {integer} Número de bytes a omitir antes de comenzar a leer. Must satisfy `0 <= offset <= buf.length - 1`.
* Devuelve: {integer}

Lee un entero de 8-bit sin signo desde `buf` en el `offset` especificado.

```js
const buf = Buffer.from([1, -2]);

console.log(buf.readUInt8(0));
// Imprime: 1
console.log(buf.readUInt8(1));
// Imprime: 254
console.log(buf.readUInt8(2));
// Lanza ERR_OUT_OF_RANGE
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

* `offset` {integer} Número de bytes a omitir antes de comenzar a leer. Must satisfy `0 <= offset <= buf.length - 2`.
* Devuelve: {integer}

Reads an unsigned 16-bit integer from `buf` at the specified `offset` with specified endian format (`readUInt16BE()` returns big endian, `readUInt16LE()` returns little endian).

```js
const buf = Buffer.from([0x12, 0x34, 0x56]);

console.log(buf.readUInt16BE(0).toString(16));
// Imprime: 1234
console.log(buf.readUInt16LE(0).toString(16));
// Imprime: 3412
console.log(buf.readUInt16BE(1).toString(16));
// Imprime: 3456
console.log(buf.readUInt16LE(1).toString(16));
// Imprime: 5634
console.log(buf.readUInt16LE(2).toString(16));
// Lanza ERR_OUT_OF_RANGE
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

* `offset` {integer} Número de bytes a omitir antes de comenzar a leer. Must satisfy `0 <= offset <= buf.length - 4`.
* Devuelve: {integer}

Reads an unsigned 32-bit integer from `buf` at the specified `offset` with specified endian format (`readUInt32BE()` returns big endian, `readUInt32LE()` returns little endian).

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78]);

console.log(buf.readUInt32BE(0).toString(16));
// Imprime: 12345678
console.log(buf.readUInt32LE(0).toString(16));
// Imprime: 78563412
console.log(buf.readUInt32LE(1).toString(16));
// Lanza ERR_OUT_OF_RANGE
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

* `offset` {integer} Número de bytes a omitir antes de comenzar a leer. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Número de bytes a leer. Must satisfy `0 < byteLength <= 6`.
* Devuelve: {integer}

Reads `byteLength` number of bytes from `buf` at the specified `offset` and interprets the result as an unsigned integer. Soporta hasta 48 bits de precisión.

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab]);

console.log(buf.readUIntBE(0, 6).toString(16));
// Imprime: 1234567890ab
console.log(buf.readUIntLE(0, 6).toString(16));
// Imprime: ab9078563412
console.log(buf.readUIntBE(1, 6).toString(16));
// Lanza ERR_OUT_OF_RANGE
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

* `start` {integer} Dónde comenzará el nuevo `Buffer`. **Predeterminado:** `0`.
* `end` {integer} Dónde terminará el nuevo `Buffer` (no incluido). **Predeterminado:** [`buf.length`].
* Devuelve: {Buffer}

Returns a new `Buffer` that references the same memory as the original, but offset and cropped by the `start` and `end` indices.

Specifying `end` greater than [`buf.length`] will return the same result as that of `end` equal to [`buf.length`].

Modifying the new `Buffer` slice will modify the memory in the original `Buffer` because the allocated memory of the two objects overlap.

```js
// Crea un `Buffer`con el alfabeto ASCII, toma un segmento, y modifica un byte
// desde el `Buffer`original.

const buf1 = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 es el valor ASCII decimal para 'a'
  buf1[i] = i + 97;
}

const buf2 = buf1.slice(0, 3);

console.log(buf2.toString('ascii', 0, buf2.length));
// Imprime: abc

buf1[0] = 33;

console.log(buf2.toString('ascii', 0, buf2.length));
// Imprime: !bc
```

Specifying negative indexes causes the slice to be generated relative to the end of `buf` rather than the beginning.

```js
const buf = Buffer.from('buffer');

console.log(buf.slice(-6, -1).toString());
// Imprime: buffe
// (Equivalente a buf.slice(0, 5))

console.log(buf.slice(-6, -2).toString());
// Imprime: buff
// (Equivalente a buf.slice(0, 4))

console.log(buf.slice(-5, -2).toString());
// Imprime: uff
// (Equivalente a buf.slice(1, 4))
```

### buf.swap16()

<!-- YAML
added: v5.10.0
-->

* Devuelve: {Buffer} Una referencia a `buf`.

Interprets `buf` as an array of unsigned 16-bit integers and swaps the byte order *in-place*. Throws [`ERR_INVALID_BUFFER_SIZE`] if [`buf.length`] is not a multiple of 2.

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

console.log(buf1);
// Imprime: <Buffer 01 02 03 04 05 06 07 08>

buf1.swap16();

console.log(buf1);
// Imprime: <Buffer 02 01 04 03 06 05 08 07>

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

buf2.swap16();
// Lanza ERR_INVALID_BUFFER_SIZE
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

* Devuelve: {Buffer} Una referencia a `buf`.

Interprets `buf` as an array of unsigned 32-bit integers and swaps the byte order *in-place*. Throws [`ERR_INVALID_BUFFER_SIZE`] if [`buf.length`] is not a multiple of 4.

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

console.log(buf1);
// Imprime: <Buffer 01 02 03 04 05 06 07 08>

buf1.swap32();

console.log(buf1);
// Imprime: <Buffer 04 03 02 01 08 07 06 05>

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

buf2.swap32();
// Lanza ERR_INVALID_BUFFER_SIZE
```

### buf.swap64()

<!-- YAML
added: v6.3.0
-->

* Devuelve: {Buffer} Una referencia a `buf`.

Interpreta a `buf` como un arreglo de números de 64-bit y cambia el orden de los bytes *in situ*. Produce [`ERR_INVALID_BUFFER_SIZE`] si [`buf.length`] no es un múltiplo de 8.

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

console.log(buf1);
// Imprime: <Buffer 01 02 03 04 05 06 07 08>

buf1.swap64();

console.log(buf1);
// Imprime: <Buffer 08 07 06 05 04 03 02 01>

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

buf2.swap64();
// Lanza ERR_INVALID_BUFFER_SIZE
```

Tenga en cuenta que JavaScript no puede codificar enteros de 64-bit. This method is intended for working with 64-bit floats.

### buf.toJSON()

<!-- YAML
added: v0.9.2
-->

* Devuelve: {Object}

Devuelve una representación JSON de `buf`. [`JSON.stringify()`] implicitly calls this function when stringifying a `Buffer` instance.

```js
const buf = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5]);
const json = JSON.stringify(buf);

console.log(json);
// Imprime: {"type":"Buffer","data":[1,2,3,4,5]}

const copy = JSON.parse(json, (key, value) => {
  return value && value.type === 'Buffer' ?
    Buffer.from(value.data) :
    value;
});

console.log(copy);
// Imprime: <Buffer 01 02 03 04 05>
```

### buf.toString([encoding[, start[, end]]])

<!-- YAML
added: v0.1.90
-->

* `encoding` {string} La codificación de caracteres a utilizar. **Predeterminado:** `'utf8'`.
* `start` {integer} El desplazamiento de bytes donde comenzar la decodificación. **Predeterminado:** `0`.
* `end` {integer} El desplazamiento de bytes donde detener la codificación (no incluido). **Predeterminado:** [`buf.length`].
* Devuelve: {string}

Decodes `buf` to a string according to the specified character encoding in `encoding`. `start` y `end` pueden pasarse para decodificar solo un subconjunto de `buf`.

The maximum length of a string instance (in UTF-16 code units) is available as [`buffer.constants.MAX_STRING_LENGTH`][].

```js
const buf1 = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 es el valor ASCII decimal para 'a'
  buf1[i] = i + 97;
}

console.log(buf1.toString('ascii'));
// Imprime: abcdefghijklmnopqrstuvwxyz
console.log(buf1.toString('ascii', 0, 5));
// Imprime: abcde

const buf2 = Buffer.from('tést');

console.log(buf2.toString('hex'));
// Imprime: 74c3a97374
console.log(buf2.toString('utf8', 0, 3));
// Imprime: té
console.log(buf2.toString(undefined, 0, 3));
// Imprime: té
```

### buf.values()

<!-- YAML
added: v1.1.0
-->

* Devuelve: {Iterator}

Crea y devuelve un [iterador](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) para valores de `buf` (bytes). This function is called automatically when a `Buffer` is used in a `for..of` statement.

```js
const buf = Buffer.from('buffer');

for (const value of buf.values()) {
  console.log(value);
}
// Imprime:
//   98
//   117
//   102
//   102
//   101
//   114

for (const value of buf) {
  console.log(value);
}
// Imprime:
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

* `string` {string} Cadena para escribir al `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir el `string`. **Predeterminado:** `0`.
* `length` {integer} Número de bytes a escribir. **Predeterminado:** `buf.length - offset`.
* `encoding` {string} La codificación de caracteres del `string`. **Predeterminado:** `'utf8'`.
* Devuelve: {integer} Número de bytes escritos.

Escribe el `string` en `buf` de `offset` de acuerdo a la codificación de caracteres en `encoding`. El parámetro de `length` es el número de bytes para escribir. If `buf` did not contain enough space to fit the entire string, only part of `string` will be written. Sin embargo, no se escribirán caracteres codificados parcialmente.

```js
const buf = Buffer.alloc(256);

const len = buf.write('\u00bd + \u00bc = \u00be', 0);

console.log(`${len} bytes: ${buf.toString('utf8', 0, len)}`);
// Imprime: 12 bytes: ½ + ¼ = ¾
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

* `value` {number} Número a ser escrito en `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir. Must satisfy `0 <= offset <= buf.length - 8`.
* Devuelve: {integer} `offset` más el número de bytes escritos.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeDoubleBE()` writes big endian, `writeDoubleLE()` writes little endian). `value` *debe* ser un doble de 64-bit válido. Behavior is undefined when `value` is anything other than a 64-bit double.

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

* `value` {number} Número a ser escrito en `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir. Must satisfy `0 <= offset <= buf.length - 4`.
* Devuelve: {integer} `offset` más el número de bytes escritos.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeFloatBE()` writes big endian, `writeFloatLE()` writes little endian). `value` *debe* ser un float de 32-bit válido. Behavior is undefined when `value` is anything other than a 32-bit float.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeFloatBE(0xcafebabe, 0);

console.log(buf);
// Imprime: <Buffer 4f 4a fe bb>

buf.writeFloatLE(0xcafebabe, 0);

console.log(buf);
// Imprime: <Buffer bb fe 4a 4f>
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

* `value` {integer} Número a ser escrito en `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir. Must satisfy `0 <= offset <= buf.length - 1`.
* Devuelve: {integer} `offset` más el número de bytes escritos.

Escribe el `value` al `buff` en el `offset` especificado. `value` *debe* se un entero con sigo de 8-bit válido. Behavior is undefined when `value` is anything other than a signed 8-bit integer.

`value` se interpreta y escribe como un complemento de dos entero con signo.

```js
const buf = Buffer.allocUnsafe(2);

buf.writeInt8(2, 0);
buf.writeInt8(-2, 1);

console.log(buf);
// Imprime: <Buffer 02 fe>
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

* `value` {integer} Número a ser escrito en `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir. Must satisfy `0 <= offset <= buf.length - 2`.
* Devuelve: {integer} `offset` más el número de bytes escritos.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeInt16BE()` writes big endian, `writeInt16LE()` writes little endian). `value` *debe* se un entero con sigo de 16-bit válido. Behavior is undefined when `value` is anything other than a signed 16-bit integer.

`value` se interpreta y escribe como un complemento de dos entero con signo.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeInt16BE(0x0102, 0);
buf.writeInt16LE(0x0304, 2);

console.log(buf);
// Imprime: <Buffer 01 02 04 03>
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

* `value` {integer} Número a ser escrito en `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir. Must satisfy `0 <= offset <= buf.length - 4`.
* Devuelve: {integer} `offset` más el número de bytes escritos.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeInt32BE()` writes big endian, `writeInt32LE()` writes little endian). `value` *debe* se un entero con signo de 32-bit válido. Behavior is undefined when `value` is anything other than a signed 32-bit integer.

`value` se interpreta y escribe como un complemento de dos entero con signo.

```js
const buf = Buffer.allocUnsafe(8);

buf.writeInt32BE(0x01020304, 0);
buf.writeInt32LE(0x05060708, 4);

console.log(buf);
// Imprime: <Buffer 01 02 03 04 08 07 06 05>
```

### buf.writeIntBE(value, byteLength)

### buf.writeIntLE(value, byteLength)

<!-- YAML
added: v0.11.15
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 and `byteLength` to `uint32` anymore.
-->

* `value` {integer} Número a ser escrito en `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Número de bytes a escribir. Must satisfy `0 < byteLength <= 6`.
* Devuelve: {integer} `offset` más el número de bytes escritos.

Escribe los bytes de `byteLength` del `value` al `buf` en el `offset` especificado. Soporta hasta 48 bits de precisión. Behavior is undefined when `value` is anything other than a signed integer.

```js
const buf = Buffer.allocUnsafe(6);

buf.writeIntBE(0x1234567890ab, 0, 6);

console.log(buf);
// Imprime: <Buffer 12 34 56 78 90 ab>

buf.writeIntLE(0x1234567890ab, 0, 6);

console.log(buf);
// Imprime: <Buffer ab 90 78 56 34 12>
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

* `value` {integer} Número a ser escrito en `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir. Must satisfy `0 <= offset <= buf.length - 1`.
* Devuelve: {integer} `offset` más el número de bytes escritos.

Escribe el `value` al `buff` en el `offset` especificado. `value` *should* be a valid unsigned 8-bit integer. Behavior is undefined when `value` is anything other than an unsigned 8-bit integer.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt8(0x3, 0);
buf.writeUInt8(0x4, 1);
buf.writeUInt8(0x23, 2);
buf.writeUInt8(0x42, 3);

console.log(buf);
// Imprime: <Buffer 03 04 23 42>
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

* `value` {integer} Número a ser escrito en `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir. Must satisfy `0 <= offset <= buf.length - 2`.
* Devuelve: {integer} `offset` más el número de bytes escritos.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeUInt16BE()` writes big endian, `writeUInt16LE()` writes little endian). `value` debe ser un entero sin signo de 16-bit válido. Behavior is undefined when `value` is anything other than an unsigned 16-bit integer.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt16BE(0xdead, 0);
buf.writeUInt16BE(0xbeef, 2);

console.log(buf);
// Imprime: <Buffer de ad be ef>

buf.writeUInt16LE(0xdead, 0);
buf.writeUInt16LE(0xbeef, 2);

console.log(buf);
// Imprime: <Buffer ad de ef be>
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

* `value` {integer} Número a ser escrito en `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir. Must satisfy `0 <= offset <= buf.length - 4`.
* Devuelve: {integer} `offset` más el número de bytes escritos.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeUInt32BE()` writes big endian, `writeUInt32LE()` writes little endian). `value` debe ser un entero sin signo de 32-bit válido. Behavior is undefined when `value` is anything other than an unsigned 32-bit integer.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt32BE(0xfeedface, 0);

console.log(buf);
// Escribe: <Buffer fe ed fa ce>

buf.writeUInt32LE(0xfeedface, 0);

console.log(buf);
// Escribe: <Buffer ce fa ed fe>
```

### buf.writeUIntBE(value, byteLength)

### buf.writeUIntLE(value, byteLength)

<!-- YAML
added: v0.5.5
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 and `byteLength` to `uint32` anymore.
-->

* `value` {integer} Número a ser escrito en `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Número de bytes a escribir. Must satisfy `0 < byteLength <= 6`.
* Devuelve: {integer} `offset` más el número de bytes escritos.

Escribe los bytes de `byteLength` del `value` al `buf` en el `offset` especificado. Soporta hasta 48 bits de precisión. Behavior is undefined when `value` is anything other than an unsigned integer.

```js
const buf = Buffer.allocUnsafe(6);

buf.writeUIntBE(0x1234567890ab, 0, 6);

console.log(buf);
// Imprime: <Buffer 12 34 56 78 90 ab>

buf.writeUIntLE(0x1234567890ab, 0, 6);

console.log(buf);
// Imprime: <Buffer ab 90 78 56 34 12>
```

## buffer.INSPECT_MAX_BYTES

<!-- YAML
added: v0.5.4
-->

* {integer} **Predeterminado:** `50`

Returns the maximum number of bytes that will be returned when `buf.inspect()` is called. Esto puede ser reemplazado por módulos de usuario. See [`util.inspect()`] for more details on `buf.inspect()` behavior.

Note that this is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## buffer.kMaxLength

<!-- YAML
added: v3.0.0
-->

* {integer} El tamaño más grande asignado para una sola instancia de `Buffer`.

Un alias para [`buffer.constants.MAX_LENGTH`][].

Note that this is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## buffer.transcode(source, fromEnc, toEnc)

<!-- YAML
added: v7.1.0
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `source` parameter can now be a `Uint8Array`.
-->

* `source` {Buffer|Uint8Array} Una instancia de `Buffer` o `Uint8Array`.
* `fromEnc` {string} La codificación actual.
* `toEnc` {string} Para apuntar a la codificación.

Re-encodes the given `Buffer` or `Uint8Array` instance from one character encoding to another. Devuelve una nueva instancia de `Buffer`.

Throws if the `fromEnc` or `toEnc` specify invalid character encodings or if conversion from `fromEnc` to `toEnc` is not permitted.

Encodings supported by `buffer.transcode()` are: `'ascii'`, `'utf8'`, `'utf16le'`, `'ucs2'`, `'latin1'`, and `'binary'`.

The transcoding process will use substitution characters if a given byte sequence cannot be adequately represented in the target encoding. Por ejemplo:

```js
const buffer = require('buffer');

const newBuf = buffer.transcode(Buffer.from('€'), 'utf8', 'ascii');
console.log(newBuf.toString('ascii'));
// Imprime: '?'
```

Because the Euro (`€`) sign is not representable in US-ASCII, it is replaced with `?` in the transcoded `Buffer`.

Note that this is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## Clase: SlowBuffer

<!-- YAML
deprecated: v6.0.0
-->

> Estabilidad: 0 - Desaprobado: Utilice [`Buffer.allocUnsafeSlow()`] en su lugar.

Devuelve un `Buffer` sin agrupar.

In order to avoid the garbage collection overhead of creating many individually allocated `Buffer` instances, by default allocations under 4KB are sliced from a single larger allocated object.

In the case where a developer may need to retain a small chunk of memory from a pool for an indeterminate amount of time, it may be appropriate to create an un-pooled `Buffer` instance using `SlowBuffer` then copy out the relevant bits.

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

Use of `SlowBuffer` should be used only as a last resort *after* a developer has observed undue memory retention in their applications.

### nuevo SlowBuffer(size)

<!-- YAML
deprecated: v6.0.0
-->

> Estabilidad: 0 - Desaprobado: Utilice [`Buffer.allocUnsafeSlow()`] es su lugar.

* `size` {integer} La longitud deseada del nuevo `SlowBuffer`.

Asigna un nuevo `Buffer` de `size` bytes. If `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, [`ERR_INVALID_OPT_VALUE`] is thrown. Un `Buffer` de longitud cero se crea si `size` es 0.

La memoria subyacente para instancias de `SlowBuffer` están *sin inicializar*. The contents of a newly created `SlowBuffer` are unknown and may contain sensitive data. Use [`buf.fill(0)`][`buf.fill()`] to initialize a `SlowBuffer` with zeroes.

```js
const { SlowBuffer } = require('buffer');

const buf = new SlowBuffer(5);

console.log(buf);
// Imprime: (los contenidos pueden variar): <Buffer 78 e0 82 02 01>

buf.fill(0);

console.log(buf);
// Imprime: <Buffer 00 00 00 00 00>
```

## Constantes de Buffer

<!-- YAML
added: v8.2.0
-->

Note that `buffer.constants` is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

### buffer.constants.MAX_LENGTH

<!-- YAML
added: v8.2.0
-->

* {integer} El tamaño más grande asignado para una sola instancia de `Buffer`.

En arquitecturas de 32-bit, este valor es `(2^30)-1` (~1GB). En arquitecturas de 64-bit, este valor es `(2^31)-1` (~2GB).

Este valor también está disponible como [`buffer.kMaxLength`][].

### buffer.constants.MAX_STRING_LENGTH

<!-- YAML
added: v8.2.0
-->

* {integer} La longitud más larga asignada para una sola instancia de `string`.

Represents the largest `length` that a `string` primitive can have, counted in UTF-16 code units.

Este valor debe depender del motor JS que se esté utilizando.