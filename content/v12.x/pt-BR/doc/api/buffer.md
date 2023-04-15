# Buffer

<!--introduced_in=v0.1.90-->

> Estabilidade: 2 - Estável

Prior to the introduction of [`TypedArray`][], the JavaScript language had no mechanism for reading or manipulating streams of binary data. The `Buffer` class was introduced as part of the Node.js API to enable interaction with octet streams in TCP streams, file system operations, and other contexts.

With [`TypedArray`][] now available, the `Buffer` class implements the [`Uint8Array`][] API in a manner that is more optimized and suitable for Node.js.

Instances of the `Buffer` class are similar to arrays of integers from `0` to `255` (other integers are coerced to this range by `& 255` operation) but correspond to fixed-sized, raw memory allocations outside the V8 heap. The size of the `Buffer` is established when it is created and cannot be changed.

The `Buffer` class is within the global scope, making it unlikely that one would need to ever use `require('buffer').Buffer`.

```js
// Cria um Buffer de comprimento 10 preenchido de zeros.
const buf1 = Buffer.alloc(10);

// Cria um Buffer de comprimento 10, cheio de 0x1.
const buf2 = Buffer.alloc(10, 1);

// Cria um buffer não inicializado de comprimento 10.
// Isto é mais rápido que chamar Buffer.alloc(), mas a instância retornada do
// Buffer pode conter dados antigos que precisam ser
// sobrescrita usando fill() ou write().
const buf3 = Buffer.allocUnsafe(10);

// Cria um Buffer contendo [0x1, 0x2, 0x3].
const buf4 = Buffer.from([1, 2, 3]);

// Cria um Buffer contendo UTF-8 bytes [0x74, 0xc3, 0xa9, 0x73, 0x74].
const buf5 = Buffer.from('tést');

// Cria um Buffer contendo Latin-1 bytes [0x74, 0xe9, 0x73, 0x74].
const buf6 = Buffer.from('tést', 'latin1');
```

## `Buffer.from()`, `Buffer.alloc()`, e `Buffer.allocUnsafe()`

In versions of Node.js prior to 6.0.0, `Buffer` instances were created using the `Buffer` constructor function, which allocates the returned `Buffer` differently based on what arguments are provided:

* Passing a number as the first argument to `Buffer()` (e.g. `new Buffer(10)`) allocates a new `Buffer` object of the specified size. Prior to Node.js 8.0.0, the memory allocated for such `Buffer` instances is *not* initialized and *can contain sensitive data*. Such `Buffer` instances *must* be subsequently initialized by using either [`buf.fill(0)`][`buf.fill()`] or by writing to the entire `Buffer`. While this behavior is *intentional* to improve performance, development experience has demonstrated that a more explicit distinction is required between creating a fast-but-uninitialized `Buffer` versus creating a slower-but-safer `Buffer`. Since Node.js 8.0.0, `Buffer(num)` and `new
Buffer(num)` return a `Buffer` with initialized memory.
* Passando uma string, array ou `Buffer` como o primeiro argumento copia os dados do objeto passado no `Buffer`.
* Passing an [`ArrayBuffer`][] or a [`SharedArrayBuffer`][] returns a `Buffer` that shares allocated memory with the given array buffer.

Because the behavior of `new Buffer()` is different depending on the type of the first argument, security and reliability issues can be inadvertently introduced into applications when argument validation or `Buffer` initialization is not performed.

For example, if an attacker can cause an application to receive a number where a string is expected, the application may call `new Buffer(100)` instead of `new Buffer("100")`, it will allocate a 100 byte buffer instead of allocating a 3 byte buffer with content `"100"`. This is commonly possible using JSON API calls. Since JSON distinguishes between numeric and string types, it allows injection of numbers where a naive application might expect to always receive a string.  Before Node.js 8.0.0, the 100 byte buffer might contain arbitrary pre-existing in-memory data, so may be used to expose in-memory secrets to a remote attacker.  Since Node.js 8.0.0, exposure of memory cannot occur because the data is zero-filled. However, other attacks are still possible, such as causing very large buffers to be allocated by the server, leading to performance degradation or crashing on memory exhaustion.

To make the creation of `Buffer` instances more reliable and less error-prone, the various forms of the `new Buffer()` constructor have been **deprecated** and replaced by separate `Buffer.from()`, [`Buffer.alloc()`][], and [`Buffer.allocUnsafe()`][] methods.

*Os desenvolvedores devem migrar todas as utilizações existentes dos construtores `new Buffer()` para uma dessas novas APIs.*

* [`Buffer.from(array)`][] returns a new `Buffer` that *contains a copy* of the provided octets.
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`] returns a new `Buffer` that *shares the same allocated memory* as the given [`ArrayBuffer`][].
* [`Buffer.from(buffer)`][] returns a new `Buffer` that *contains a copy* of the contents of the given `Buffer`.
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`] returns a new `Buffer` that *contains a copy* of the provided string.
* [`Buffer.alloc(size[, fill[, encoding]])`][`Buffer.alloc()`] returns a new initialized `Buffer` of the specified size. This method is slower than [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] but guarantees that newly created `Buffer` instances never contain old data that is potentially sensitive. Um `TypeError` será lançado se `size` não é um número.
* [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] and [`Buffer.allocUnsafeSlow(size)`][`Buffer.allocUnsafeSlow()`] each return a new uninitialized `Buffer` of the specified `size`. Because the `Buffer` is uninitialized, the allocated segment of memory might contain old data that is potentially sensitive.

`Buffer` instances returned by [`Buffer.allocUnsafe()`][] *may* be allocated off a shared internal memory pool if `size` is less than or equal to half [`Buffer.poolSize`][]. Instances returned by [`Buffer.allocUnsafeSlow()`][] *never* use the shared internal memory pool.

### A opção `--zero-fill-buffers` linha de comando
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

### O que faz `Buffer.allocUnsafe()` e `Buffer.allocUnsafew()` "Não seguro"?

When calling [`Buffer.allocUnsafe()`][] and [`Buffer.allocUnsafeSlow()`][], the segment of allocated memory is *uninitialized* (it is not zeroed-out). Enquanto este design torna a alocação de memória muito rápida, o segmento alocado de memória pode conter dados antigos que são potencialmente sensíveis. Using a `Buffer` created by [`Buffer.allocUnsafe()`][] without *completely* overwriting the memory can allow this old data to be leaked when the `Buffer` memory is read.

While there are clear performance advantages to using [`Buffer.allocUnsafe()`][], extra care *must* be taken in order to avoid introducing security vulnerabilities into an application.

## Codificações de Buffers e Caracteres
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
// imprime: aGVsbG8gd29ybGQ=

console.log(Buffer.from('fhqwhgads', 'ascii'));
// imprime: <Buffer 66 68 71 77 68 67 61 64 73>
console.log(Buffer.from('fhqwhgads', 'utf16le'));
// imprime: <Buffer 66 00 68 00 71 00 77 00 68 00 67 00 61 00 64 00 73 00>
```

As codificações de caracteres atualmente suportadas pelo Node.js incluem:

* `'ascii'`: For 7-bit ASCII data only. Esta codificação é rápida e tirará o bit alto se definido.

* `'utf8'`: Multibyte encoded Unicode characters. Muitas páginas da web e outros formatos de documentos usam UTF-8.

* `'utf16le'`: 2 or 4 bytes, little-endian encoded Unicode characters. Pares adicionais (U+1000para U+10FFFF) são suportados.

* `'ucs2'`: Alias of `'utf16le'`.

* `'base64'`: Base64 encoding. When creating a `Buffer` from a string, this encoding will also correctly accept "URL and Filename Safe Alphabet" as specified in [RFC 4648, Section 5](https://tools.ietf.org/html/rfc4648#section-5).

* `'latin1'`: A way of encoding the `Buffer` into a one-byte encoded string (as defined by the IANA in [RFC 1345](https://tools.ietf.org/html/rfc1345), page 63, to be the Latin-1 supplement block and C0/C1 control codes).

* `'binary'`: Alias for `'latin1'`.

* `'hex'`: Encode each byte as two hexadecimal characters.

Modern Web browsers follow the [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/) which aliases both `'latin1'` and `'ISO-8859-1'` to `'win-1252'`. This means that while doing something like `http.get()`, if the returned charset is one of those listed in the WHATWG specification it is possible that the server actually returned `'win-1252'`-encoded data, and using `'latin1'` encoding may incorrectly decode the characters.

## Buffers e TypedArray
<!-- YAML
changes:
  - version: v3.0.0
    pr-url: https://github.com/nodejs/node/pull/2002
    description: The `Buffer`s class now inherits from `Uint8Array`.
-->

`Buffer` instances are also [`Uint8Array`][] instances. However, there are subtle incompatibilities with [`TypedArray`][]. For example, while [`ArrayBuffer#slice()`][] creates a copy of the slice, the implementation of [`Buffer#slice()`][`buf.slice()`] creates a view over the existing `Buffer` without copying, making [`Buffer#slice()`][`buf.slice()`] far more efficient.

It is also possible to create new [`TypedArray`][] instances from a `Buffer` with the following caveats:

1. The `Buffer` object's memory is copied to the [`TypedArray`][], not shared.

2. A memória do objeto `Buffer` é interpretada como uma array de elementos distintos, e não como uma byte array do tipo alvo. That is, `new Uint32Array(Buffer.from([1, 2, 3, 4]))` creates a 4-element [`Uint32Array`][] with elements `[1, 2, 3, 4]`, not a [`Uint32Array`][] with a single element `[0x1020304]` or `[0x4030201]`.

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
const arr = nova Uint16Array(20);
const buf = Buffer.from(arr.buffer, 0, 16);

console.log(buf.length);
// imprime: 16
```

The `Buffer.from()` and [`TypedArray.from()`][] have different signatures and implementations. Specifically, the [`TypedArray`][] variants accept a second argument that is a mapping function that is invoked on every element of the typed array:

* `TypedArray.de(source[, mapFn[, thisArg]])`

O método `Buffer.from()` no entanto, não suporta o uso de uma função de mapeamento:

* [`Buffer.from(array)`][]
* [`Buffer.from(buffer)`][]
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`]
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`]

## Buffers e iteração

Instâncias `Buffer` podem ser iteradas usando a syntax `for..of`:

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

A classe `Buffer` é um tipo global para lidar com dados binários diretamente. Pode ser construído de várias maneiras.

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

* `array` {integer[]} Uma array de bytes para copiar.

Aloca um novo `Buffer` usando um `array` de octets.

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
* `byteOffset` {integer} Index do primeiro byte para expor. **Default:** `0`.
* `length` {integer} Número de bytes para expor. **Default:** `arrayBuffer.length - byteOffset`.

This creates a view of the [`ArrayBuffer`][] or [`SharedArrayBuffer`][] without copying the underlying memory. For example, when passed a reference to the `.buffer` property of a [`TypedArray`][] instance, the newly created `Buffer` will share the same allocated memory as the [`TypedArray`][].

Os argumentos opcionais `byteOffset` e `length` especificam um intervalo de memória dentro de `arrayBuffer` que será compartilhado pelo `Buffer`.

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

Copia os dados passados `buffer` em uma nova instância `Buffer`.

```js
const buf1 = new Buffer('buffer');
const buf2 = new Buffer(buf1);

buf1[0] = 0x61;

console.log(buf1.toString());
// Imprime: buffer
console.log(buf2.toString());
// Imprime: buffer
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

* `size` {integer} O comprimento desejado do novo `Buffer`.

Aloca um novo `Buffer` de `size` bytes. If `size` is larger than [`buffer.constants.MAX_LENGTH`][] or smaller than 0, [`ERR_INVALID_OPT_VALUE`][] is thrown. Um comprimento zero `Buffer` é criado se `size` é 0.

Prior to Node.js 8.0.0, the underlying memory for `Buffer` instances created in this way is *not initialized*. The contents of a newly created `Buffer` are unknown and *may contain sensitive data*. Use [`Buffer.alloc(size)`][`Buffer.alloc()`] instead to initialize a `Buffer` with zeroes.

```js
const buf = new Buffer(10);

console.log(buf);
// Imprime: <Buffer 00 00 00 00 00 00 00 00 00 00>
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

> Estabilidade: 0 - Descontinuada: Use [`Buffer.from(string[, encoding])`][`Buffer.from(string)`]  em vez disso.

* `string` {string} String para codificar.
* `encoding` {string} A codificação da `string`. **Default:** `'utf8'`.

Cria uma nova `Buffer` que contém `string`. The `encoding` parameter identifies the character encoding of `string`.

```js
const buf1 = new Buffer('this is a tést');
const buf2 = new Buffer('7468697320697320612074c3a97374', 'hex');

console.log(buf1.toString());
// Imprime: isto é um teste
console.log(buf2.toString());
// imprime: isto é um teste
console.log(buf1.toString('ascii'));
// Imprime: isto é um teste
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

* `size` {integer} O comprimento desejado do novo `Buffer`.
* `fill` {string|Buffer|Uint8Array|integer} A value to pre-fill the new `Buffer` with. **Default:** `0`.
* `encoding` {string} Se `fill` é uma string, esta é sua codificação. **Default:** `'utf8'`.

Aloca um novo `Buffer` de `size` bytes. If `fill` is `undefined`, the `Buffer` will be *zero-filled*.

```js
const buf = Buffer.alloc(5);

console.log(buf);
// Imprime: <Buffer 00 00 00 00 00>
```

If `size` is larger than [`buffer.constants.MAX_LENGTH`][] or smaller than 0, [`ERR_INVALID_OPT_VALUE`][] is thrown. Um comprimento zero `Buffer` é criado se `size` é 0.

Se `fill` for especificado, o alocado `Buffer` será inicializado chamando [`buf.fill(fill)`][`buf.fill()`].

```js
const buf = Buffer.alloc(5, 'a');

console.log(buf);
// Imprime: <Buffer 61 61 61 61 61>
```

Se ambos `fill` e `encoding` forem especificados, o `Buffer` alocado será inicializado chamando [`buf.fill(fill)`][`buf.fill()`].

```js
const buf = Buffer.alloc(11, 'aGVsbG8gd29ybGQ=', 'base64');

console.log(buf);
// Imprime: <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64>
```

Calling [`Buffer.alloc()`][] can be significantly slower than the alternative [`Buffer.allocUnsafe()`][] but ensures that the newly created `Buffer` instance contents will *never contain sensitive data*.

Um `TypeError` será lançado se `size` não é um número.

### Class Method: `Buffer.allocUnsafe(size)`
<!-- YAML
added: v5.10.0
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7079
    description: Passing a negative `size` will now throw an error.
-->

* `size` {integer} O comprimento desejado do novo `Buffer`.

Aloca um novo `Buffer` de `size` bytes. If `size` is larger than [`buffer.constants.MAX_LENGTH`][] or smaller than 0, [`ERR_INVALID_OPT_VALUE`][] is thrown. Um comprimento zero `Buffer` é criado se `size` é 0.

The underlying memory for `Buffer` instances created in this way is *not initialized*. The contents of the newly created `Buffer` are unknown and *may contain sensitive data*. Use [`Buffer.alloc()`][] instead to initialize `Buffer` instances with zeroes.

```js
const buf = Buffer.allocUnsafe(10);

console.log(buf);
// Prints (contents may vary): <Buffer a0 8b 28 3f 01 00 00 00 50 32>

buf.fill(0);

console.log(buf);
// Prints: <Buffer 00 00 00 00 00 00 00 00 00 00>
```

Um `TypeError` será lançado se `size` não é um número.

The `Buffer` module pre-allocates an internal `Buffer` instance of size [`Buffer.poolSize`][] that is used as a pool for the fast allocation of new `Buffer` instances created using [`Buffer.allocUnsafe()`][] and the deprecated `new Buffer(size)` constructor only when `size` is less than or equal to `Buffer.poolSize >> 1` (floor of [`Buffer.poolSize`][] divided by two).

O uso deste pool de memória interna pré-alocada é uma diferença de chave entre chamar `Buffer.alloc(size, fill)` vs. `Buffer.allocUnsafe(size).fill(fill)`. Specifically, `Buffer.alloc(size, fill)` will *never* use the internal `Buffer` pool, while `Buffer.allocUnsafe(size).fill(fill)` *will* use the internal `Buffer` pool if `size` is less than or equal to half [`Buffer.poolSize`][]. The difference is subtle but can be important when an application requires the additional performance that [`Buffer.allocUnsafe()`][] provides.

### Class Method: `Buffer.allocUnsafeSlow(size)`
<!-- YAML
added: v5.12.0
-->

* `size` {integer} O comprimento desejado do novo `Buffer`.

Aloca um novo `Buffer` de `size` bytes. If `size` is larger than [`buffer.constants.MAX_LENGTH`][] or smaller than 0, [`ERR_INVALID_OPT_VALUE`][] is thrown. Um comprimento zero `Buffer` é criado se `size` é 0.

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

Um `TypeError` será lançado se `size` não é um número.

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

* `string` {string|Buffer|TypedArray|DataView|ArrayBuffer|SharedArrayBuffer} Um valor para calcular o comprimento de.
* `encoding` {string} Se `string` é uma string, esta é sua codificação. **Default:** `'utf8'`.
* Retorna: {integer} O número de bytes contidos dentro de `string`.

Retorna o tamanho atual do byte de uma string. This is not the same as [`String.prototype.length`][] since that returns the number of *characters* in a string.

Para `'base64'` e `'hex'`, esta função assume uma entrada válida. For strings that contain non-Base64/Hex-encoded data (e.g. whitespace), the return value might be greater than the length of a `Buffer` created from the string.

```js
const str = '\u00bd + \u00bc = \u00be';

console.log(`${str}: ${str.length} characters, ` +
            `${Buffer.byteLength(str, 'utf8')} bytes`);
// imprime: ½ + ¼ = ¾: 9 characters, 12 bytes
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
* Retorna: {integer}

Compara `buf1` com `buf2` normalmente para o propósito de ordenar os arrays de instâncias `Buffer`. Isto é equivalente a chamar [`buf1.compare(buf2)`][`buf.compare()`].

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
* `totalLength` {integer} Comprimento total das instâncias `Buffer` em `list` quando concatenado.
* Retorna: {Buffer}

Retorna um novo `Buffer` que é o resultado de concatenar todos as instâncias `Buffer` em `list` juntos.

Se a lista não tem itens, ou se o `totalLength` é 0, então um novo `Buffer` de comprimento zero é retornado.

Se `totalLength` não for fornecido, ele é calculado a partir das instâncias `Buffer` em `list`. Isso, no entanto, faz com que um loop adicional seja executado para calcular o `totalLength`, então é mais rápido fornecer o comprimento explicitamente se já é conhecido.

Se `totalLength` for fornecido, ele é coagido a um inteiro não assinado. Se o comprimento combinado dos `Buffer`s na `list` excede `totalLength`, o resultado é truncado para `totalLength`.

```js
// Cria um único `Buffer` de uma lista de três instâncias `Buffer`.

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

### Class Method: `Buffer.from(array)`
<!-- YAML
added: v5.10.0
-->

* `array` {integer[]}

Aloca um novo `Buffer` usando um `array` de octets.

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
* `byteOffset` {integer} Index do primeiro byte para expor. **Default:** `0`.
* `length` {integer} Número de bytes para expor. **Default:** `arrayBuffer.length - byteOffset`.

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

Os argumentos opcionais `byteOffset` e `length` especificam um intervalo de memória dentro de `arrayBuffer` que será compartilhado pelo `Buffer`.

```js
const ab = new ArrayBuffer(10);
const buf = Buffer.from(ab, 0, 2);

console.log(buf.length);
// imprime: 2
```

A `TypeError` will be thrown if `arrayBuffer` is not an [`ArrayBuffer`][] or a [`SharedArrayBuffer`][] or other type appropriate for `Buffer.from()` variants.

### Class Method: `Buffer.from(buffer)`
<!-- YAML
added: v5.10.0
-->

* `buffer` {Buffer|Uint8Array} An existing `Buffer` or [`Uint8Array`][] from which to copy data.

Copia os dados passados `buffer` em uma nova instância `Buffer`.

```js
const buf1 = Buffer.from('buffer');
const buf2 = Buffer.from(buf1);

buf1[0] = 0x61;

console.log(buf1.toString());
// imprime: buffer
console.log(buf2.toString());
// imprime: buffer
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
// imprime: <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

For objects that support `Symbol.toPrimitive`, returns `Buffer.from(object[Symbol.toPrimitive](), offsetOrEncoding, length)`.

```js
class Foo {
  [Symbol.toPrimitive]() {
    return 'this is a test';
  }
}

const buf = Buffer.from(new Foo(), 'utf8');
// Imprime: <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

A `TypeError` will be thrown if `object` has not mentioned methods or is not of other type appropriate for `Buffer.from()` variants.

### Class Method: `Buffer.from(string[, encoding])`
<!-- YAML
added: v5.10.0
-->

* `string` {string} Uma string para codificar.
* `encoding` {string} A codificação da `string`. **Default:** `'utf8'`.

Cria uma nova `Buffer` que contém `string`. The `encoding` parameter identifies the character encoding of `string`.

```js
const buf1 = Buffer.from('this is a tést');
const buf2 = Buffer.from('7468697320697320612074c3a97374', 'hex');

console.log(buf1.toString());
// Imprime: isto é um teste
console.log(buf2.toString());
// imprime: isto é um teste
console.log(buf1.toString('ascii'));
// Imprime: isto é um teste
```

A `TypeError` will be thrown if `string` is not a string or other type appropriate for `Buffer.from()` variants.

### Class Method: `Buffer.isBuffer(obj)`
<!-- YAML
added: v0.1.101
-->

* `obj` {Object}
* Retorna: {boolean}

Retorna `true` se `obj` é um `Buffer`, `false` caso contrário.

### Class Method: `Buffer.isEncoding(encoding)`
<!-- YAML
added: v0.9.1
-->

* `encoding` {string} Um nome de codificação de caracteres para verificar.
* Retorna: {boolean}

Retorna `true` se `encoding` contém uma codificação de caracteres suportada, ou `false` caso contrário.

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

This is the size (in bytes) of pre-allocated internal `Buffer` instances used for pooling. Este valor pode ser modificado.

### `buf[index]`
<!-- YAML
type: property
name: [index]
-->

* `index` {integer}

O operador de índice `[index]` pode ser usado para obter e definir o octet na posição `index` em `buf`. Os valores referem-se a bytes individuais, então o valor legal tem entre `0x00` e `0xFF` (hex) ou `0` e `255` (decimal).

This operator is inherited from `Uint8Array`, so its behavior on out-of-bounds access is the same as `UInt8Array`. In other words, getting returns `undefined` and setting does nothing.

```js
// Copie uma string ASCII para um byte `Buffer` de cada vez.

const str = 'Node.js';
const buf = Buffer.allocUnsafe(str.length);

for (let i = 0; i < str.length; i++) {
  buf[i] = str.charCodeAt(i);
}

console.log(buf.toString('ascii'));
// Imprime: Node.js
```

### `buf.buffer`

* {ArrayBuffer} The underlying `ArrayBuffer` object based on which this `Buffer` object is created.

This `ArrayBuffer` is not guaranteed to correspond exactly to the original `Buffer`. See the notes on `buf.byteOffset` for details.

```js
const arrayBuffer = new ArrayBuffer(16);
const buffer = Buffer.from(arrayBuffer);

console.log(buffer.buffer === arrayBuffer);
// Imprime: true
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
* `targetStart` {integer} O offset de `target` com o qual começa a comparação. **Default:** `0`.
* `targetEnd` {integer} The offset within `target` at which to end comparison (not inclusive). **Default:** `target.length`.
* `sourceStart` {integer} O offset de `buf` com o qual começa a comparação. **Default:** `0`.
* `sourceEnd` {integer} O offset de `buf` com o qual termina a comparação. (Não incluída). **Default:** [`buf.length`][].
* Retorna: {integer}

Compara `buf` com `target` e retorna um número indicando se `buf` vem antes, depois, ou é o mesmo que `target` em ordem de ordenação. Comparação é baseada na sequência real de bytes em cada `Buffer`.

* `0` é retornado se `target` é o mesmo que `buf`
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

Os argumentos opcionais `targetStart`, `targetEnd`, `sourceStart`, e `sourceEnd` podem ser usados para limitar a comparação a intervalos específicos dentro de `target` e `buf` respectivamente.

```js
const buf1 = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);
const buf2 = Buffer.from([5, 6, 7, 8, 9, 1, 2, 3, 4]);

console.log(buf1.compare(buf2, 5, 9, 0, 4));
// imprime: 0
console.log(buf1.compare(buf2, 0, 6, 4));
// imprime: -1
console.log(buf1.compare(buf2, 5, 6, 5));
// imprime: 1
```

[`ERR_OUT_OF_RANGE`][] is thrown if `targetStart < 0`, `sourceStart < 0`, `targetEnd > target.byteLength`, or `sourceEnd > source.byteLength`.

### `buf.copy(target[, targetStart[, sourceStart[, sourceEnd]]])`
<!-- YAML
added: v0.1.90
-->

* `target` {Buffer|Uint8Array} A `Buffer` or [`Uint8Array`][] to copy into.
* `targetStart` {integer} The offset within `target` at which to begin writing. **Default:** `0`.
* `sourceStart` {integer} O offset de `buf` com o qual começa a copiar. **Default:** `0`.
* `sourceEnd` {integer} O offset de `buf` com o qual termina de copiar. (Não incluída). **Default:** [`buf.length`][].
* Retorna: {integer} O número de bytes copiados.

Copia dados de uma região de `buf` para uma região em `target` mesmo se a região da memória de `target` se sobrepõe com `buf`.

```js
// Criar duas instâncias `Buffer`.
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
// Cria um `Buffer` e copia dados de uma região para uma região sobreposta
// dentro do mesmo `Buffer`.

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

* Retorna: {Iterator}

Creates and returns an [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) of `[index, byte]` pairs from the contents of `buf`.

```js
// Registra todo o conteúdo de um `Buffer`.

const buf = Buffer.from('buffer');

for (const pair of buf.entries()) {
  console.log(pair);
}
// imprime:
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
* Retorna: {boolean}

Retorna `true` se ambos `buf` e `otherBuffer` tiverem exatamente os mesmos bytes, `false` caso contrário.

```js
const buf1 = Buffer.from('ABC');
const buf2 = Buffer.from('414243', 'hex');
const buf3 = Buffer.from('ABCD');

console.log(buf1.equals(buf2));
// imprime: true
console.log(buf1.equals(buf3));
// imprime: false
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
* `offset` {integer} Número de bytes para pular antes de começar a preencher `buf`. **Default:** `0`.
* `end` {integer} Onde para de preencher `buf` (não incluso). **Default:** [`buf.length`][].
* `encoding` {string} A codificação para `value` se `value` for uma string. **Default:** `'utf8'`.
* Retorna: {Buffer} Uma referência a `buf`.

Preenche `buf` com o valor especificado `value`. If the `offset` and `end` are not given, the entire `buf` will be filled:

```js
// Preenche um `Buffer` com o caractere ASCII 'h'.

const b = Buffer.allocUnsafe(50).fill('h');

console.log(b.toString());
// imprime: hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
```

`value` is coerced to a `uint32` value if it is not a string, `Buffer`, or integer. If the resulting integer is greater than `255` (decimal), `buf` will be filled with `value & 255`.

If the final write of a `fill()` operation falls on a multi-byte character, then only the bytes of that character that fit into `buf` are written:

```js
// Preenche um `Buffer` com um caractere de dois bytes.

console.log(Buffer.allocUnsafe(3).fill('\u0222'));
// imprime: <Buffer c8 a2 c8>
```

If `value` contains invalid characters, it is truncated; if no valid fill data remains, an exception is thrown:

```js
const buf = Buffer.allocUnsafe(5);

console.log(buf.fill('a'));
// imprime: <Buffer 61 61 61 61 61>
console.log(buf.fill('aazz', 'hex'));
// imprime: <Buffer aa aa aa aa aa>
console.log(buf.fill('zz', 'hex'));
// Lança uma exceção.
```

### `buf.includes(value[, byteOffset][, encoding])`
<!-- YAML
added: v5.3.0
-->

* `value` {string|Buffer|Uint8Array|integer} O que procurar.
* `byteOffset` {integer} Onde começar a procurar em `buf`. If negative, then offset is calculated from the end of `buf`. **Default:** `0`.
* `encoding` {string} Se `value` é uma string, esta é sua codificação. **Default:** `'utf8'`.
* Retorna: {boolean} `true` se `value` foi encontrado em `buf`, `false` caso contrário.

Equivalente para [`buf.indexOf() != -1`][`buf.indexOf()`].

```js
const buf = Buffer.from('this is a buffer');

console.log(buf.includes('this'));
// Imprime: true
console.log(buf.includes('is'));
// Imprime: true
console.log(buf.includes(Buffer.from('a buffer')));
// Imprime: true
console.log(buf.includes(97));
// Imprime: true (97 é o valor decimal ASCII para 'a')
console.log(buf.includes(Buffer.from('a buffer example')));
// Imprime: false
console.log(buf.includes(Buffer.from('a buffer example').slice(0, 8)));
// Imprime: true
console.log(buf.includes('this', 4));
// Imprime: false
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

* `value` {string|Buffer|Uint8Array|integer} O que procurar.
* `byteOffset` {integer} Onde começar a procurar em `buf`. If negative, then offset is calculated from the end of `buf`. **Default:** `0`.
* `encoding` {string} If `value` is a string, this is the encoding used to determine the binary representation of the string that will be searched for in `buf`. **Default:** `'utf8'`.
* Returns: {integer} The index of the first occurrence of `value` in `buf`, or `-1` if `buf` does not contain `value`.

Se `value` é:

* uma string, `value` é interpretada de acordo com a codificação de caracteres em `encoding`.
* a `Buffer` or [`Uint8Array`][], `value` will be used in its entirety. To compare a partial `Buffer`, use [`buf.slice()`][].
* um número, `value` será interpretado como um valor inteiro de 8 bits não assinado entre `0` e `255`.

```js
const buf = Buffer.from('this is a buffer');

console.log(buf.indexOf('this'));
// Imprime: 0
console.log(buf.indexOf('is'));
// Imprime: 2
console.log(buf.indexOf(Buffer.from('a buffer')));
// Imprime: 8
console.log(buf.indexOf(97));
// Imprime: 8 (97 é o valor decimal ASCII para 'a')
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

Se `value` não é uma string, número, ou `Buffer`, este método irá lançar um `TypeError`. Se `value` é um número, ele será coagido a um valor de byte válido, um inteiro entre 0 e 255.

Se `byteOffset` não for um número, ele será coagido a um número. If the result of coercion is `NaN` or `0`, then the entire buffer will be searched. This behavior matches [`String#indexOf()`][].

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

* Retorna: {Iterator}

Cria e retorna um [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) de chaves `buf` (indices).

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

### `buf.lastIndexOf(value[, byteOffset][, encoding])`
<!-- YAML
added: v6.0.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `value` can now be a `Uint8Array`.
-->

* `value` {string|Buffer|Uint8Array|integer} O que procurar.
* `byteOffset` {integer} Onde começar a procurar em `buf`. If negative, then offset is calculated from the end of `buf`. **Default:** `buf.length - 1`.
* `encoding` {string} If `value` is a string, this is the encoding used to determine the binary representation of the string that will be searched for in `buf`. **Default:** `'utf8'`.
* Returns: {integer} The index of the last occurrence of `value` in `buf`, or `-1` if `buf` does not contain `value`.

Identical to [`buf.indexOf()`][], except the last occurrence of `value` is found rather than the first occurrence.

```js
const buf = Buffer.from('this buffer is a buffer');

console.log(buf.lastIndexOf('this'));
// Imprime: 0
console.log(buf.lastIndexOf('buffer'));
// Imprime: 17
console.log(buf.lastIndexOf(Buffer.from('buffer')));
// Imprime: 17
console.log(buf.lastIndexOf(97));
// Imprime: 15 (97 is the decimal ASCII value for 'a')
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

Se `value` não é uma string, número, ou `Buffer`, este método irá lançar um `TypeError`. Se `value` é um número, ele será coagido a um valor de byte válido, um inteiro entre 0 e 255.

Se `byteOffset` não for um número, ele será coagido a um número. Qualquer argumento que coagir com `NaN`, como `{}` ou `undefined`, irá pesquisar todo o buffer. This behavior matches [`String#lastIndexOf()`][].

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

Se `value` é uma string vazia ou um `Buffer`, vazio `byteOffset` será devolvido.

### `buf.length`
<!-- YAML
added: v0.1.90
-->

* {integer}

Retorna a quantidade de memória alocada para `buf` em bytes. This does not necessarily reflect the amount of "usable" data within `buf`.

```js
// Crie um `Buffer` e escreva uma string ASCII mais curta para ele.

const buf = Buffer.alloc(1234);

console.log(buf.length);
// Imprime: 1234

buf.write('some string', 0, 'ascii');

console.log(buf.length);
// Imprime: 1234
```

Enquanto a propriedade `length` não é imutável, mudando o valor de `length` pode resultar em comportamento indefinido e inconsistente. Applications that wish to modify the length of a `Buffer` should therefore treat `length` as read-only and use [`buf.slice()`][] to create a new `Buffer`.

```js
let buf = Buffer.allocUnsafe(10);

buf.write('abcdefghj', 0, 'ascii');

console.log(buf.length);
// Imprime: 10

buf = buf.slice(0, 5);

console.log(buf.length);
// Imprime: 5
```

### `buf.parent`
<!-- YAML
deprecated: v8.0.0
-->

> Stability: 0 - Deprecated: Use [`buf.buffer`][] instead.

A propriedade `buf.parent` é um alias obsoleto para `buf.buffer`.

### `buf.readBigInt64BE([offset])`
### `buf.readBigInt64LE([offset])`
<!-- YAML
added: v12.0.0
-->

* `offset` {integer} Número de bytes para pular antes de começar a ler. Must satisfy: `0 <= offset <= buf.length - 8`. **Default:** `0`.
* Retorna: {bigint}

Reads a signed 64-bit integer from `buf` at the specified `offset` with the specified endian format (`readBigInt64BE()` returns big endian, `readBigInt64LE()` returns little endian).

Inteiros lidos de um `Buffer` são interpretados como dois valores assinados complementares.

### `buf.readBigUInt64BE([offset])`
### `buf.readBigUInt64LE([offset])`
<!-- YAML
added: v12.0.0
-->

* `offset` {integer} Número de bytes para pular antes de começar a ler. Must satisfy: `0 <= offset <= buf.length - 8`. **Default:** `0`.
* Retorna: {bigint}

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

* `offset` {integer} Número de bytes para pular antes de começar a ler. Must satisfy `0 <= offset <= buf.length - 8`. **Default:** `0`.
* Retorna: {number}

Lê um duplo de 64 bits de `buf` no `offset` especificado com formato especificado endian (`readDoubleBE()` retorna grande endian, `readbleLE()` retorna pequeno endian).

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

* `offset` {integer} Número de bytes para pular antes de começar a ler. Must satisfy `0 <= offset <= buf.length - 4`. **Default:** `0`.
* Retorna: {number}

Lê um float de 32 bits de `buf` no especificado `offset` com formato especificado endian (`readFloatBE()` retorna grande endian, `readatLE()` retorna pequeno endian).

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

* `offset` {integer} Número de bytes para pular antes de começar a ler. Must satisfy `0 <= offset <= buf.length - 1`. **Default:** `0`.
* Retorna: {integer}

Lê um 8 bits assinado inteiro de `buf` no `offset` especificado.

Inteiros lidos de um `Buffer` são interpretados como dois valores assinados complementares.

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

* `offset` {integer} Número de bytes para pular antes de começar a ler. Must satisfy `0 <= offset <= buf.length - 2`. **Default:** `0`.
* Retorna: {integer}

Lê um inteiro de 16 bits assinado de `buf` no `offset` especificado com o formato endian selecionado (`readInt16BE()` retorna grande endian, `readInt16LE()` retorna pequeno endian).

Inteiros lidos de um `Buffer` são interpretados como dois valores assinados complementares.

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

* `offset` {integer} Número de bytes para pular antes de começar a ler. Must satisfy `0 <= offset <= buf.length - 4`. **Default:** `0`.
* Retorna: {integer}

Lê um inteiro de 32 bits assinado de `buf` no `offset` especificado com o formato selecionado (`readInt32BE()` retorna grande endian, `readInt32LE()` retorna pequeno endian).

Inteiros lidos de um `Buffer` são interpretados como dois valores assinados complementares.

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

* `offset` {integer} Número de bytes para pular antes de começar a ler. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Número de bytes para ler. Must satisfy `0 < byteLength <= 6`.
* Retorna: {integer}

Lê `byteLength` número de bytes de `buf` no `offset` especificado e interpreta o resultado como dois valores complementares assinalados. Suporta até 48 bits de precisão.

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

* `offset` {integer} Número de bytes para pular antes de começar a ler. Must satisfy `0 <= offset <= buf.length - 1`. **Default:** `0`.
* Retorna: {integer}

Lê um inteiro de 8 bits não assinado de `buf` no `offset` especificado.

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

* `offset` {integer} Número de bytes para pular antes de começar a ler. Must satisfy `0 <= offset <= buf.length - 2`. **Default:** `0`.
* Retorna: {integer}

Lê um inteiro de 16 bits não assinado de `buf` no `offset` especificado com Formato endian especificado (`readUInt16BE()` retorna grande endian, `readUInt16LE()` retorna pequeno endian).

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

* `offset` {integer} Número de bytes para pular antes de começar a ler. Must satisfy `0 <= offset <= buf.length - 4`. **Default:** `0`.
* Retorna: {integer}

Lê um inteiro de 32 bits não assinado de `buf` no `offset` especificado com Formato endian especificado (`readUInt32BE()` retorna grande endian, `readUInt32LE()` retorna pequeno endian).

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

* `offset` {integer} Número de bytes para pular antes de começar a ler. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Número de bytes para ler. Must satisfy `0 < byteLength <= 6`.
* Retorna: {integer}

Lê `byteLength` número de bytes de `buf` no `offset` especificado e interpreta o resultado como um inteiro não assinado. Suporta até 48 bits de precisão.

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

* `start` {integer} Onde o novo `Buffer` começará. **Default:** `0`.
* `end` {integer} Onde o novo `Buffer` terminará (não inclusivo). **Default:** [`buf.length`][].
* Retorna: {Buffer}

Retorna um novo `Buffer` que faz referência à mesma memória que o original, mas offset e cortado pelos índices `start` e `end`.

Specifying `end` greater than [`buf.length`][] will return the same result as that of `end` equal to [`buf.length`][].

Modifying the new `Buffer` slice will modify the memory in the original `Buffer` because the allocated memory of the two objects overlap.

```js
// Crie um `Buffer` com o alfabeto ASCII, pegue uma fatia e modifique um byte
// do `Buffer`original.

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

Especificar índices negativos faz com que a fatia seja gerada em relação ao fim de `buf` em vez do início.

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

* `start` {integer} Onde o novo `Buffer` começará. **Default:** `0`.
* `end` {integer} Onde o novo `Buffer` terminará (não inclusivo). **Default:** [`buf.length`][].
* Retorna: {Buffer}

Retorna um novo `Buffer` que faz referência à mesma memória que o original, mas offset e cortado pelos índices `start` e `end`.

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

* Retorna: {Buffer} Uma referência a `buf`.

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

* Retorna: {Buffer} Uma referência a `buf`.

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

* Retorna: {Buffer} Uma referência a `buf`.

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

JavaScript cannot encode 64-bit integers. Este método é destinado para trabalhar com floats 64 bits.

### `buf.toJSON()`
<!-- YAML
added: v0.9.2
-->

* Retorna: {Object}

Retorna uma representação JSON de `buf`. [`JSON.stringify()`][] implicitly calls this function when stringifying a `Buffer` instance.

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

### `buf.toString([encoding[, start[, end]]])`
<!-- YAML
added: v0.1.90
-->

* `encoding` {string} A codificação de caracteres a ser usada. **Default:** `'utf8'`.
* `start` {integer} O offset de bytes para começar a decodificar. **Default:** `0`.
* `end` {integer} O offset de bytes para parar de decodificar em (não incluído). **Default:** [`buf.length`][].
* Retorna: {string}

Decodifica `buf` para uma string de acordo com a codificação de caracteres especificada em `encoding`. `start` e `end` podem ser passados para decodificar apenas um subconjunto de `buf`. If a byte sequence in the input is not valid in the given `encoding` then it is replaced with the replacement character `U+FFFD`.

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

* Retorna: {Iterator}

Cria e retorna um [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) para valores `buf` (bytes). Esta função é chamada automaticamente quando um `Buffer` é usado em uma instrução `for..of`.

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

### `buf.write(string[, offset[, length]][, encoding])`
<!-- YAML
added: v0.1.90
-->

* `string` {string} String para escrever para `buf`.
* `offset` {integer} Número de bytes para pular antes de começar a escrever a `string`. **Default:** `0`.
* `length` {integer} Número de bytes para escrever. **Default:** `buf.length - offset`.
* `encoding` {string} A codificação de caracteres da `string`. **Default:** `'utf8'`.
* Retorna: {integer} Número de bytes escritos.

Writes `string` to `buf` at `offset` according to the character encoding in `encoding`. O parâmetro `length` é o número de bytes a escrever. If `buf` did not contain enough space to fit the entire string, only part of `string` will be written. No entanto, caracteres parcialmente codificados não serão escritos.

```js
const buf = Buffer.alloc(256);

const len = buf.write('\u00bd + \u00bc = \u00be', 0);

console.log(`${len} bytes: ${buf.toString('utf8', 0, len)}`);
// Imprime: 12 bytes: ½ + ¼ = ¾
```

### `buf.writeBigInt64BE(value[, offset])`
### `buf.writeBigInt64LE(value[, offset])`
<!-- YAML
added: v12.0.0
-->

* `value` {bigint} Number to be written to `buf`.
* `offset` {integer} Número de bytes para pular antes de começar a escrever. Must satisfy: `0 <= offset <= buf.length - 8`. **Default:** `0`.
* Retorna: {integer} `offset` mais o número de bytes escritos.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeBigInt64BE()` writes big endian, `writeBigInt64LE()` writes little endian).

`value` é interpretado e escrito como dois inteiros complementares assinados.

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
* `offset` {integer} Número de bytes para pular antes de começar a escrever. Must satisfy: `0 <= offset <= buf.length - 8`. **Default:** `0`.
* Retorna: {integer} `offset` mais o número de bytes escritos.

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

* `value` {number} Número a ser escrito para `buf`.
* `offset` {integer} Número de bytes para pular antes de começar a escrever. Must satisfy `0 <= offset <= buf.length - 8`. **Default:** `0`.
* Retorna: {integer} `offset` mais o número de bytes escritos.

Escreve `value` para `buf` no `offset` específico com formato especificado endian (`write eDoubleBE()` escreve grande endian, `write eDoubleLE()` escreve pequeno endian). `value` *should* be a valid 64-bit double. Comportamento não está definido quando `value` é algo diferente de um duplo de 64 bits.

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

* `value` {number} Número a ser escrito para `buf`.
* `offset` {integer} Número de bytes para pular antes de começar a escrever. Must satisfy `0 <= offset <= buf.length - 4`. **Default:** `0`.
* Retorna: {integer} `offset` mais o número de bytes escritos.

Escreve `value` para `buf` no `offset` com formato especificado endian (`write eFloatBE()` escreve grande endian, `write eFloatLE()` escreve pequeno endian). `value` *should* be a valid 32-bit float. Comportamento não está definido quando `value` é qualquer coisa diferente de um float de 32 bits.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeFloatBE(0xcafebabe, 0);

console.log(buf);
// Imprime: <Buffer 4f 4a fe bb>

buf.writeFloatLE(0xcafebabe, 0);

console.log(buf);
// Imprime: <Buffer bb fe 4a 4f>
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

* `value` {integer} Número a ser escrito para `buf`.
* `offset` {integer} Número de bytes para pular antes de começar a escrever. Must satisfy `0 <= offset <= buf.length - 1`. **Default:** `0`.
* Retorna: {integer} `offset` mais o número de bytes escritos.

Escreve `value` para `buf` no `offset` especificado. `value` *should* be a valid signed 8-bit integer. Comportamento não está definido quando `value` é qualquer coisa diferente de um inteiro de 8 bits assinado.

`value` é interpretado e escrito como dois inteiros complementares assinados.

```js
const buf = Buffer.allocUnsafe(2);

buf.writeInt8(2, 0);
buf.writeInt8(-2, 1);

console.log(buf);
// Imprime: <Buffer 02 fe>
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

* `value` {integer} Número a ser escrito para `buf`.
* `offset` {integer} Número de bytes para pular antes de começar a escrever. Must satisfy `0 <= offset <= buf.length - 2`. **Default:** `0`.
* Retorna: {integer} `offset` mais o número de bytes escritos.

Escreve `value` para `buf` no `offset` com formato especificado endian (`writeInt16BE()` escreve grande endian, `writeInt16LE()` escreve pequeno endian). `value` *should* be a valid signed 16-bit integer. Behavior is undefined when `value` is anything other than a signed 16-bit integer.

`value` é interpretado e escrito como dois inteiros complementares assinados.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeInt16BE(0x0102, 0);
buf.writeInt16LE(0x0304, 2);

console.log(buf);
// Imprime: <Buffer 01 02 04 03>
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

* `value` {integer} Número a ser escrito para `buf`.
* `offset` {integer} Número de bytes para pular antes de começar a escrever. Must satisfy `0 <= offset <= buf.length - 4`. **Default:** `0`.
* Retorna: {integer} `offset` mais o número de bytes escritos.

Escreve `value` para `buf` no `offset` com formato especificado endian (`writeInt32BE()` escreve grande endian, `writeInt32LE()` escreve pequeno endian). `value` *should* be a valid signed 32-bit integer. Behavior is undefined when `value` is anything other than a signed 32-bit integer.

`value` é interpretado e escrito como dois inteiros complementares assinados.

```js
const buf = Buffer.allocUnsafe(8);

buf.writeInt32BE(0x01020304, 0);
buf.writeInt32LE(0x05060708, 4);

console.log(buf);
// Imprime: <Buffer 01 02 03 04 08 07 06 05>
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

* `value` {integer} Número a ser escrito para `buf`.
* `offset` {integer} Número de bytes para pular antes de começar a escrever. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Número de bytes para escrever. Must satisfy `0 < byteLength <= 6`.
* Retorna: {integer} `offset` mais o número de bytes escritos.

Escreve `byteLength` bytes de `value` para `buf` no `offset` especificado. Suporta até 48 bits de precisão. Comportamento não está definido quando `value` é qualquer coisa diferente de um inteiro assinado.

```js
const buf = Buffer.allocUnsafe(6);

buf.writeIntBE(0x1234567890ab, 0, 6);

console.log(buf);
// Imprime: <Buffer 12 34 56 78 90 ab>

buf.writeIntLE(0x1234567890ab, 0, 6);

console.log(buf);
// Imprime: <Buffer ab 90 78 56 34 12>
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

* `value` {integer} Número a ser escrito para `buf`.
* `offset` {integer} Número de bytes para pular antes de começar a escrever. Must satisfy `0 <= offset <= buf.length - 1`. **Default:** `0`.
* Retorna: {integer} `offset` mais o número de bytes escritos.

Escreve `value` para `buf` no `offset` especificado. `value` *should* be a valid unsigned 8-bit integer. Comportamento não está definido quando `value` é qualquer coisa diferente de um inteiro de 8 bits não assinado.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt8(0x3, 0);
buf.writeUInt8(0x4, 1);
buf.writeUInt8(0x23, 2);
buf.writeUInt8(0x42, 3);

console.log(buf);
// Imprime: <Buffer 03 04 23 42>
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

* `value` {integer} Número a ser escrito para `buf`.
* `offset` {integer} Número de bytes para pular antes de começar a escrever. Must satisfy `0 <= offset <= buf.length - 2`. **Default:** `0`.
* Retorna: {integer} `offset` mais o número de bytes escritos.

Escreve `value` no`buf` no `offset` especificado, com formato especificado endian (`writeInt16BE()` escreve em big endian, `writeInt16LE()` escreve em little endian). `value` deve ser um inteiro válido não assinado de 16 bits. O comportamento é indefinido quando `value` é qualquer coisa diferente de um inteiro de 16 bits não assinado.

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

* `value` {integer} Número a ser escrito para `buf`.
* `offset` {integer} Número de bytes para pular antes de começar a escrever. Must satisfy `0 <= offset <= buf.length - 4`. **Default:** `0`.
* Retorna: {integer} `offset` mais o número de bytes escritos.

Escreve `value` no `buf` no `offset` especificado com o formato endian especificado (`writeUInt32BE()` escreve em big endian, `writeUInt32LE()` escreve em little endian). `value` deve ser um inteiro válido não assinado de 32 bits. O comportamento é indefinido quando `value` é qualquer coisa diferente de um inteiro de 32 bits não assinado.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt32BE(0xfeedface, 0);

console.log(buf);
// Imprime: <Buffer fe ed fa ce>

buf.writeUInt32LE(0xfeedface, 0);

console.log(buf);
// Imprime: <Buffer ce fa ed fe>
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

* `value` {integer} Número a ser escrito para `buf`.
* `offset` {integer} Número de bytes para pular antes de começar a escrever. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Número de bytes para escrever. Must satisfy `0 < byteLength <= 6`.
* Retorna: {integer} `offset` mais o número de bytes escritos.

Escreve `byteLength` bytes de `value` para `buf` no `offset` especificado. Suporta até 48 bits de precisão. O comportamento é indefinido quando `value` é qualquer coisa diferente de um inteiro não assinado.

```js
const buf = Buffer.allocUnsafe(6);

buf.writeUIntBE(0x1234567890ab, 0, 6);

console.log(buf);
// Imprime: <Buffer 12 34 56 78 90 ab>

buf.writeUIntLE(0x1234567890ab, 0, 6);

console.log(buf);
// Imprime: <Buffer ab 90 78 56 34 12>
```

## `buffer.INSPECT_MAX_BYTES`
<!-- YAML
added: v0.5.4
-->

* {integer} **Default:** `50`

Retorna o número máximo de bytes que será retornado quando o `buf.inspect()` for chamado. Isto pode ser substituído por módulos de usuário. See [`util.inspect()`][] for more details on `buf.inspect()` behavior.

This is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## `buffer.kMaxLength`
<!-- YAML
added: v3.0.0
-->

* {integer} O maior tamanho permitido para uma instância `Buffer` única.

Um apelido para [`buffer.constants.MAX_LENGTH`][].

This is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## `buffer.transcode(source, fromEnc, toEnc)`
<!-- YAML
added: v7.1.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `source` parameter can now be a `Uint8Array`.
-->

* `source` {Buffer|Uint8Array} Um `Buffer` ou uma instância `Uint8Array`.
* `fromEnc` {string} A codificação atual.
* `fromEnc` {string} A codificação futura.
* Retorna: {Buffer}

Re-encodes the given `Buffer` or `Uint8Array` instance from one character encoding to another. Retorna uma nova instância `Buffer`.

Throws if the `fromEnc` or `toEnc` specify invalid character encodings or if conversion from `fromEnc` to `toEnc` is not permitted.

Encodings supported by `buffer.transcode()` are: `'ascii'`, `'utf8'`, `'utf16le'`, `'ucs2'`, `'latin1'`, and `'binary'`.

The transcoding process will use substitution characters if a given byte sequence cannot be adequately represented in the target encoding. Por exemplo:

```js
const buffer = require('buffer');

const newBuf = buffer.transcode(Buffer.from('€'), 'utf8', 'ascii');
console.log(newBuf.toString('ascii'));
// Saída: '?'
```

Because the Euro (`€`) sign is not representable in US-ASCII, it is replaced with `?` in the transcoded `Buffer`.

This is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## Class: `SlowBuffer`
<!-- YAML
deprecated: v6.0.0
-->

> Stability: 0 - Deprecated: Use [`Buffer.allocUnsafeSlow()`][] instead.

Returns an un-pooled `Buffer`.

In order to avoid the garbage collection overhead of creating many individually allocated `Buffer` instances, by default allocations under 4KB are sliced from a single larger allocated object.

In the case where a developer may need to retain a small chunk of memory from a pool for an indeterminate amount of time, it may be appropriate to create an un-pooled `Buffer` instance using `SlowBuffer` then copy out the relevant bits.

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

* `size` {integer} The desired length of the new `SlowBuffer`.

Aloca um novo `Buffer` de `size` bytes. If `size` is larger than [`buffer.constants.MAX_LENGTH`][] or smaller than 0, [`ERR_INVALID_OPT_VALUE`][] is thrown. Um comprimento zero `Buffer` é criado se `size` é 0.

The underlying memory for `SlowBuffer` instances is *not initialized*. The contents of a newly created `SlowBuffer` are unknown and may contain sensitive data. Use [`buf.fill(0)`][`buf.fill()`] to initialize a `SlowBuffer` with zeroes.

```js
const { SlowBuffer } = require('buffer');

const buf = new SlowBuffer(5);

console.log(buf);
// Prints: (contents may vary): <Buffer 78 e0 82 02 01>

buf.fill(0);

console.log(buf);
// Prints: <Buffer 00 00 00 00 00>
```

## Buffer Constants
<!-- YAML
added: v8.2.0
-->

`buffer.constants` is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

### `buffer.constants.MAX_LENGTH`
<!-- YAML
added: v8.2.0
-->

* {integer} O maior tamanho permitido para uma instância `Buffer` única.

On 32-bit architectures, this value is `(2^30)-1` (~1GB). On 64-bit architectures, this value is `(2^31)-1` (~2GB).

This value is also available as [`buffer.kMaxLength`][].

### `buffer.constants.MAX_STRING_LENGTH`
<!-- YAML
added: v8.2.0
-->

* {integer} The largest length allowed for a single `string` instance.

Represents the largest `length` that a `string` primitive can have, counted in UTF-16 code units.

This value may depend on the JS engine that is being used.
