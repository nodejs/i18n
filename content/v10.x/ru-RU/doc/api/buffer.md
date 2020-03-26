# Буфер

<!--introduced_in=v0.1.90-->

> Стабильность: 2 - Стабильно

Prior to the introduction of [`TypedArray`], the JavaScript language had no mechanism for reading or manipulating streams of binary data. The `Buffer` class was introduced as part of the Node.js API to enable interaction with octet streams in TCP streams, file system operations, and other contexts.

With [`TypedArray`] now available, the `Buffer` class implements the [`Uint8Array`] API in a manner that is more optimized and suitable for Node.js.

Экземпляры класса `Buffer` похожи на массивы целых чисел, но соответствуют фиксированному, необработанному распределению памяти вне кучи V8. The size of the `Buffer` is established when it is created and cannot be changed.

The `Buffer` class is within the global scope, making it unlikely that one would need to ever use `require('buffer').Buffer`.

```js
// Создается заполненный нулями буфер длиной 10.
const buf1 = Buffer.alloc(10);

// Создается буфер длиной 10, заполненный 0x1.
const buf2 = Buffer.alloc(10, 1);

// Создается неинициализированный буфер длиной 10.
// Это быстрее, чем вызывающий Buffer.alloc(), но возвращенный
// экземпляр буфера может содержать старые данные, которые должны быть 
// переписаны с помощью fill() или write().
const buf3 = Buffer.allocUnsafe(10);

// Создайте буфер, содержащий [0x1, 0x2, 0x3].
const buf4 = Buffer.from([1, 2, 3]);

// Создайте буфер, содержащий байты UTF-8 [0x74, 0xc3, 0xa9, 0x73, 0x74].
const buf5 = Buffer.from('tést');

// Создайте буфер, содержащий байты Latin-1 [0x74, 0xe9, 0x73, 0x74].
const buf6 = Buffer.from('tést', 'latin1');
```

## `Buffer.from()`, `Buffer.alloc()` и `Buffer.allocUnsafe()`

In versions of Node.js prior to 6.0.0, `Buffer` instances were created using the `Buffer` constructor function, which allocates the returned `Buffer` differently based on what arguments are provided:

* Passing a number as the first argument to `Buffer()` (e.g. `new Buffer(10)`) allocates a new `Buffer` object of the specified size. Prior to Node.js 8.0.0, the memory allocated for such `Buffer` instances is *not* initialized and *can contain sensitive data*. Such `Buffer` instances *must* be subsequently initialized by using either [`buf.fill(0)`][`buf.fill()`] or by writing to the entire `Buffer`. While this behavior is *intentional* to improve performance, development experience has demonstrated that a more explicit distinction is required between creating a fast-but-uninitialized `Buffer` versus creating a slower-but-safer `Buffer`. Starting in Node.js 8.0.0, `Buffer(num)` and `new Buffer(num)` will return a `Buffer` with initialized memory.
* Передача строки, массива или `Buffer` в качестве первого аргумента копирует переданные данные объекта в `Buffer`.
* Передача [`ArrayBuffer`] или [`SharedArrayBuffer`] возвращает `Buffer`, который делит выделенную память с буфером заданного массива.

Because the behavior of `new Buffer()` is different depending on the type of the first argument, security and reliability issues can be inadvertently introduced into applications when argument validation or `Buffer` initialization is not performed.

To make the creation of `Buffer` instances more reliable and less error-prone, the various forms of the `new Buffer()` constructor have been **deprecated** and replaced by separate `Buffer.from()`, [`Buffer.alloc()`], and [`Buffer.allocUnsafe()`] methods.

*Разработчики должны перенести все существующие конструкторы `new Buffer()` в один из этих новых API.*

* [`Buffer.from(array)`] returns a new `Buffer` that *contains a copy* of the provided octets.
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`] returns a new `Buffer` that *shares the same allocated memory* as the given [`ArrayBuffer`].
* [`Buffer.from(buffer)`] returns a new `Buffer` that *contains a copy* of the contents of the given `Buffer`.
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`] returns a new `Buffer` that *contains a copy* of the provided string.
* [`Buffer.alloc(size[, fill[, encoding]])`][`Buffer.alloc()`] returns a new initialized `Buffer` of the specified size. This method is slower than [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] but guarantees that newly created `Buffer` instances never contain old data that is potentially sensitive.
* [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] and [`Buffer.allocUnsafeSlow(size)`][`Buffer.allocUnsafeSlow()`] each return a new uninitialized `Buffer` of the specified `size`. Because the `Buffer` is uninitialized, the allocated segment of memory might contain old data that is potentially sensitive.

Экземпляры `Buffer`, возвращаемые [`Buffer.allocUnsafe()`], *могут* быть выделены из совместного пула внутренней памяти, если их `размер` меньше или равен половине [`Buffer.poolSize`]. Экземпляры, возвращаемые [`Buffer.allocUnsafeSlow()`] *никогда* не используют общий пул внутренней памяти.

### Опция командной строки `--zero-fill-buffers`
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

### Что делает `Buffer.allocUnsafe()` и `Buffer.allocUnsafeSlow()` "небезопасными"?

Когда вызывается [`Buffer.allocUnsafe()`] и [`Buffer.allocUnsafeSlow()`], сегмент выделенной памяти *не инициализирован* (не обнулен). При том, что этот дизайн делает выделение памяти довольно быстрым, выделенный сегмент памяти может содержать старые данные, которые являются потенциально незащищенными. Использование `Buffer`, созданного [`Buffer.allocUnsafe()`] без *полной* перезаписи памяти, может привести к утечке этих старых данных при чтении памяти `Buffer`.

Хотя использование [`Buffer.allocUnsafe()`] имеет явное преимущество, *необходимо* соблюдать особую осторожность, чтобы не допустить появления уязвимостей в приложении.

## Буферы и кодировки символов
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
// Prints: 68656c6c6f20776f726c64
console.log(buf.toString('base64'));
// Prints: aGVsbG8gd29ybGQ=

console.log(Buffer.from('fhqwhgads', 'ascii'));
// Prints: <Buffer 66 68 71 77 68 67 61 64 73>
console.log(Buffer.from('fhqwhgads', 'utf16le'));
// Prints: <Buffer 66 00 68 00 71 00 77 00 68 00 67 00 61 00 64 00 73 00>
```

Кодировки, поддерживаемые Node.js на данный момент, включают в себя:

* `'ascii'` - только для 7-битных данных ASCII. Этот метод кодирования очень быстрый, и устранит старший бит, если он установлен.

* `'utf8'` - многобайтовая кодировка в символах Unicode. Многие веб-страницы и другие форматы документов используют UTF-8.

* `'utf16le'` - 2 или 4 байта, символы Unicode, закодированные в прямом порядке. Поддерживаются суррогатные пары (U+10000 to U+10FFFF).

* `'ucs2'` - аналог `'utf16le'`.

* `'base64'` - кодирование Base64. Когда создается `Buffer` из строки, это кодирование также правильно поддерживает "Безопасный алфавит для URL и названий файлов", как указано в [RFC4648, Section 5](https://tools.ietf.org/html/rfc4648#section-5).

* `'latin1'` - способ кодирования `Buffer` в однобайтовую строку (как определено IANA в [RFC1345](https://tools.ietf.org/html/rfc1345), стр. 63, быть дополнительным блоком Latin-1и управляющими кодами C0/C1).

* `'binary'` - аналог `'latin1'`.

* `'hex'` - кодирует каждый байт как два шестнадцатеричных символа.

Modern Web browsers follow the [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/) which aliases both `'latin1'` and `'ISO-8859-1'` to `'win-1252'`. This means that while doing something like `http.get()`, if the returned charset is one of those listed in the WHATWG specification it is possible that the server actually returned `'win-1252'`-encoded data, and using `'latin1'` encoding may incorrectly decode the characters.

## Буферы и TypedArray
<!-- YAML
changes:
  - version: v3.0.0
    pr-url: https://github.com/nodejs/node/pull/2002
    description: The `Buffer`s class now inherits from `Uint8Array`.
-->

Экземпляры `Buffer` также являются экземплярами [`Uint8Array`]. However, there are subtle incompatibilities with [`TypedArray`]. For example, while [`ArrayBuffer#slice()`] creates a copy of the slice, the implementation of [`Buffer#slice()`][`buf.slice()`] creates a view over the existing `Buffer` without copying, making [`Buffer#slice()`][`buf.slice()`] far more efficient.

Это также возможно для создания новых экземпляров [`TypedArray`] из `Buffer` со следующими оговорками:

1. Память объекта `Buffer` копируется в [`TypedArray`], не используется совместно.

2. Память объекта `Buffer` интерпретируется как массив определенных элементов, а не как байтовый массив целевого типа. То есть, `new Uint32Array(Buffer.from([1, 2, 3, 4]))` создает [`Uint32Array`] из 4 элементов `[1, 2, 3, 4]`, а не [`Uint32Array`] с одним элементом `[0x1020304]` или `[0x4030201]`.

It is possible to create a new `Buffer` that shares the same allocated memory as a [`TypedArray`] instance by using the `TypedArray` object's `.buffer` property.

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Copies the contents of `arr`
const buf1 = Buffer.from(arr);
// Shares memory with `arr`
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

Обратите внимание, что используя `.buffer` [`TypedArray`] при создании `Buffer`, можно использовать только часть лежащего в основе [`ArrayBuffer`], чтобы передать параметры `byteOffset` и `length`.

```js
const arr = new Uint16Array(20);
const buf = Buffer.from(arr.buffer, 0, 16);

console.log(buf.length);
// Prints: 16
```

У `Buffer.from()` и [`TypedArray.from()`] разные свойства и реализации. В частности, варианты [`TypedArray`] принимают второй аргумент, который является функцией отображения, вызываемой на каждом элементе указанного массива:

* `TypedArray.from(source[, mapFn[, thisArg]])`

Однако метод `Buffer.from()` не поддерживает использование функции отображения:

* [`Buffer.from(array)`]
* [`Buffer.from(buffer)`]
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`]
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`]

## Buffers and iteration

`Buffer` instances can be iterated over using `for..of` syntax:

```js
const buf = Buffer.from([1, 2, 3]);

// Печать:
//   1
//   2
//   3
for (const b of buf) {
  console.log(b);
}
```

Кроме того, методы [`buf.values()`], [`buf.keys()`] и [`buf.entries()`] могут использоваться для создания итераторов.

## Класс: Buffer

Класс `Buffer` является глобальным типом для непосредственной работы с двоичными данными. Это можно создать несколькими способами.

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

> Стабильность: 0 - устарело: вместо этого используйте [`Buffer.from(array)`].

* `array` {integer[]} Массив байтов для копирования.

Выделяется новый `Buffer` с помощью `array` октетов.

```js
// Создается новый Buffer, который содержит байты UTF-8 строки 'buffer'
const buf = new Buffer([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
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

> Стабильность: 0 - Устарело: Вместо этого используйте [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`].

* `arrayBuffer` {ArrayBuffer|SharedArrayBuffer} - [`ArrayBuffer`], [`SharedArrayBuffer`] или свойство `.buffer` из [`TypedArray`].
* `byteOffset` {integer} Индекс первого байта для отображения. **Default:** `0`.
* `length` {integer} Количество байтов для отображения. **Default:** `arrayBuffer.length - byteOffset`.

Это создает представление [`ArrayBuffer`] или [`SharedArrayBuffer`] без копирования основной памяти. Например, при передаче ссылки свойствам `.buffer` экземпляра [`TypedArray`], вновь созданный `Buffer` будет использовать ту же выделенную память, что и [`TypedArray`].

Необязательные аргументы `byteOffset` и `length` определяют диапазон памяти в пределах `arrayBuffer`, который будет совместно использоваться `Buffer`.

```js
const arr = new Uint16Array(2);

 arr[0] = 5000;
 arr[1] = 4000;

 // Делит память с `arr`
 const buf = new Buffer(arr.buffer);

 console.log(buf);
 // Печатает: <Buffer 88 13 a0 0f>

 // Изменение оригинального Uint16Array также меняет Buffer
 arr[1] = 6000;

 console.log(buf);
 // Печатает: <Buffer 88 13 70 17>
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

> Стабильность: 0 - устарело: вместо этого используйте [`Buffer.from(buffer)`].

* `buffer` {Buffer|Uint8Array} Существующий `Buffer` или [`Uint8Array`], откуда копируются данные.

Копирует переданные данные `buffer` в новый экземпляр `Buffer`.

```js
const buf1 = new Buffer('buffer');
const buf2 = new Buffer(buf1);

buf1[0] = 0x61;

console.log(buf1.toString());
// Печатает: auffer
console.log(buf2.toString());
// Печатает: buffer
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

> Стабильность: 0 - устарело: вместо этого использовать [`Buffer.alloc()`] (см. также  [`Buffer.allocUnsafe()`]).

* `size` {integer} Желаемая длина нового `Buffer`.

Выделяет новый `Buffer` на `size` байтов. If `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, [`ERR_INVALID_OPT_VALUE`] is thrown. A zero-length `Buffer` is created if `size` is 0.

Prior to Node.js 8.0.0, the underlying memory for `Buffer` instances created in this way is *not initialized*. The contents of a newly created `Buffer` are unknown and *may contain sensitive data*. Use [`Buffer.alloc(size)`][`Buffer.alloc()`] instead to initialize a `Buffer` with zeroes.

```js
const buf = new Buffer(10);

console.log(buf);
// Prints: <Buffer 00 00 00 00 00 00 00 00 00 00>
```

### новый Buffer(string[, encoding])
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

> Стабильность: 0 - Устарело: Вместо этого используйте [`Buffer.from(string[, encoding])`][`Buffer.from(string)`].

* `string` {string} Строка для кодирования.
* `encoding` {string} Кодирование `string`. **Default:** `'utf8'`.

Создает новый `Buffer`, содержащий `string`. Параметр `encoding` определяет кодировку символов `строки`.

```js
const buf1 = new Buffer('this is a tést');
 const buf2 = new Buffer('7468697320697320612074c3a97374', 'hex');

 console.log(buf1.toString());
 // Печатает: это tést
 console.log(buf2.toString());
 // Печатает: это tést
 console.log(buf1.toString('ascii'));
 // Печатает: это tC)st
```

### Метод Класса: Buffer.alloc(size[, fill[, encoding]])
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

* `size` {integer} Желаемая длина нового `Buffer`.
* `вставить` {string|Buffer|integer} Значение для предзаполнения нового `Buffer`. **Default:** `0`.
* `encoding` {string} Если `fill` это строка, это его кодирование. **Default:** `'utf8'`.

Выделяет новый `Buffer` на `size` байтов. Если строка `fill` является `незаполненной`, то `Buffer` останется *пустым*.

```js
const buf = Buffer.alloc(5);

 console.log(buf);
 // Печатает: <Buffer 00 00 00 00 00>
```

Выделяет новый `Buffer` на `size` байтов. If `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, [`ERR_INVALID_OPT_VALUE`] is thrown. A zero-length `Buffer` is created if `size` is 0.

Если `fill` определен, выделенный `Buffer` будет инициализирован вызовом [`buf.fill(fill)`][`buf.fill()`].

```js
const buf = Buffer.alloc(5, 'a');

 console.log(buf);
 // Печатает: <Buffer 61 61 61 61 61>
```

Если и `fill`, и `encoding` определены, выделенный `Buffer` будет инициализирован вызовом [`buf.fill(fill, encoding)`][`buf.fill()`].

```js
const buf = Buffer.alloc(11, 'aGVsbG8gd29ybGQ=', 'base64'); 

console.log(buf);
 // Печатает: <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64>
```

Вызов [`Buffer.alloc()`] может осуществляться значительно медленнее, чем альтернативный [`Buffer.allocUnsafe()`], но гарантировано, что содержимое вновь созданного экземпляра `Buffer` не будет *содержать конфиденциальные данные*.

Если `размер` не является числом, появится `TypeError`.

### Метод Класса: Buffer.allocUnsafe(size)
<!-- YAML
added: v5.10.0
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7079
    description: Passing a negative `size` will now throw an error.
-->

* `size` {integer} Желаемая длина нового `Buffer`.

Выделяет новый `Buffer` на `size` байтов. If `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, [`ERR_INVALID_OPT_VALUE`] is thrown. A zero-length `Buffer` is created if `size` is 0.

Основная память экземпляра `Buffer`, созданного таким образом, *не инициализируется*. Содержимое вновь созданного `Buffer` неизвестно и *может содержать конфиденциальные данные*. Use [`Buffer.alloc()`] instead to initialize `Buffer` instances with zeroes.

```js
const buf = Buffer.allocUnsafe(10);

 console.log(buf);
 // Печатает: (содержимое может меняться): <Buffer a0 8b 28 3f 01 00 00 00 50 32>

 buf.fill(0);

 console.log(buf);
 // Печатает: <Buffer 00 00 00 00 00 00 00 00 00 00>
```

Если `размер` не является числом, появится `TypeError`.

Обратите внимание, что модуль `Buffer` заранее выделяет внутренний экземпляр `Buffer` размером [`Buffer.poolSize`], который используется как пул для предыдущих выделений новых экземпляров `Buffer`, созданных с использованием [`Buffer.allocUnsafe()`] и устаревшего конструктора `new Buffer(size)`, только если `размер` меньше или равен `Buffer.poolSize >> 1` (floor [`Buffer.poolSize`] делится на два).

Использование этого пула с заранее выделенной внутренней памятью является ключевым различием между вызовом `Buffer.alloc(size, fill)` и `Buffer.allocUnsafe(size).fill(fill)`. Specifically, `Buffer.alloc(size, fill)` will *never* use the internal `Buffer` pool, while `Buffer.allocUnsafe(size).fill(fill)` *will* use the internal `Buffer` pool if `size` is less than or equal to half [`Buffer.poolSize`]. Разница незначительна, но может быть важной, когда приложение требует большей производительности, чем предоставляет [`Buffer.allocUnsafe()`].

### Метод Класса: Buffer.allocUnsafeSlow(size)
<!-- YAML
added: v5.12.0
-->

* `size` {integer} Желаемая длина нового `Buffer`.

Выделяет новый `Buffer` на `size` байтов. If `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, [`ERR_INVALID_OPT_VALUE`] is thrown. A zero-length `Buffer` is created if `size` is 0.

Основная память экземпляра `Buffer`, созданного таким образом, *не инициализируется*. Содержимое вновь созданного `Buffer` неизвестно и *может содержать конфиденциальные данные*. Use [`buf.fill(0)`][`buf.fill()`] to initialize such `Buffer` instances with zeroes.

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

Если `размер` не является числом, появится `TypeError`.

### Метод Класса: Buffer.byteLength(string[, encoding])
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

* `string` {string|Buffer|TypedArray|DataView|ArrayBuffer|SharedArrayBuffer} Значение для вычисления длины.
* `encoding` {string} Если `string` это строка, это его кодирование. **Default:** `'utf8'`.
* Возвращает: {integer} Количество байтов, содержащихся в `string`.

Возвращает фактическую байт длину строки. Это не то же самое, что [`String.prototype.length`], так как это возвращает количество *символов* в строке.

For `'base64'` and `'hex'`, this function assumes valid input. For strings that contain non-Base64/Hex-encoded data (e.g. whitespace), the return value might be greater than the length of a `Buffer` created from the string.

```js
const str = '\u00bd + \u00bc = \u00be';

console.log(`${str}: ${str.length} characters, ` +
            `${Buffer.byteLength(str, 'utf8')} bytes`);
// Prints: ½ + ¼ = ¾: 9 characters, 12 bytes
```

Когда `string` является `Buffer`/[`DataView`]/[`TypedArray`]/[`ArrayBuffer`]/ [`SharedArrayBuffer`], возвращается фактическая байт длина.

### Метод Класса: Buffer.compare(buf1, buf2)
<!-- YAML
added: v0.11.13
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The arguments can now be `Uint8Array`s.
-->

* `buf1` {Buffer|Uint8Array}
* `buf2` {Buffer|Uint8Array}
* Возвращает: {integer}

Сравнивает `buf1` с `buf2` обычно для сортировки массивов экземпляров `Buffer`. Это эквивалентно вызову [`buf1.compare(buf2)`][`buf.compare()`].

```js
const buf1 = Buffer.from('1234');
const buf2 = Buffer.from('0123');
const arr = [buf1, buf2];

console.log(arr.sort(Buffer.compare));
// Prints: [ <Buffer 30 31 32 33>, <Buffer 31 32 33 34> ]
// (This result is equal to: [buf2, buf1])
```

### Метод Класса: Buffer.concat(list[, totalLength])
<!-- YAML
added: v0.7.11
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The elements of `list` can now be `Uint8Array`s.
-->

* `list` {Buffer[] | Uint8Array[]} List of `Buffer` or [`Uint8Array`] instances to concat.
* `totalLength` {integer} Общая длина экземпляров `Buffer` в `списке` при объединении.
* Возвращает: {Buffer}

Возвращает новый `Buffer`, который является результатом объединения всех экземпляров `Buffer` в `списке` вместе.

Если в списке нет элементов или если `totalLength` равна 0, тогда возвращается новый `Buffer` нулевой длины.

Если `totalLength` не указана, она высчитывается из экземпляров `Buffer` в `list`. Это вызывает дополнительный цикл, который должен быть выполнен, чтобы вычислить `totalLength`, поэтому быстрее предоставить длину, если она уже известна.

Если `totalLength` указана, она приводится в беззнаковое целое число. Если совмещенная длина `Buffer`s в `list` превышает `totalLength`, результат усекается до `totalLength`.

```js
// Create a single `Buffer` from a list of three `Buffer` instances.

const buf1 = Buffer.alloc(10);
const buf2 = Buffer.alloc(14);
const buf3 = Buffer.alloc(18);
const totalLength = buf1.length + buf2.length + buf3.length;

console.log(totalLength);
// Prints: 42

const bufA = Buffer.concat([buf1, buf2, buf3], totalLength);

console.log(bufA);
// Prints: <Buffer 00 00 00 00 ...>
console.log(bufA.length);
// Prints: 42
```

### Метод Класса: Buffer.from(array)
<!-- YAML
added: v5.10.0
-->

* `array` {integer[]}

Выделяется новый `Buffer` с помощью `array` октетов.

```js
// Создает новый Буфер, содержащий байты UTF-8 строки 'buffer'
const buf = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
```

Если `массив` не является `Массивом`, возникнет`TypeError`.

### Метод Класса: Buffer.from(arrayBuffer[, byteOffset[, length]])
<!-- YAML
added: v5.10.0
-->

* `arrayBuffer` {ArrayBuffer|SharedArrayBuffer} An [`ArrayBuffer`], [`SharedArrayBuffer`] или свойство `.buffer` [`TypedArray`].
* `byteOffset` {integer} Индекс первого байта для отображения. **Default:** `0`.
* `length` {integer} Количество байтов для отображения. **Default:** `arrayBuffer.length - byteOffset`.

Это создает представление [`ArrayBuffer`] без копирования основной памяти. К примеру, при передаче ссылки свойствам `.buffer` экземпляра [`TypedArray`], вновь созданный `Buffer` будет использовать ту же выделенную память, что и [`TypedArray`].

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Shares memory with `arr`
const buf = Buffer.from(arr.buffer);

console.log(buf);
// Prints: <Buffer 88 13 a0 0f>

// Changing the original Uint16Array changes the Buffer also
arr[1] = 6000;

console.log(buf);
// Prints: <Buffer 88 13 70 17>
```

Необязательные аргументы `byteOffset` и `length` определяют диапазон памяти в пределах `arrayBuffer`, который будет совместно использоваться `Buffer`.

```js
const ab = new ArrayBuffer(10);
const buf = Buffer.from(ab, 0, 2);

console.log(buf.length);
// Prints: 2
```

Если `arrayBuffer` не является [`ArrayBuffer`] или [`SharedArrayBuffer`] появится `TypeError`.

### Метод Класса: Buffer.from(buffer)
<!-- YAML
added: v5.10.0
-->

* `buffer` {Buffer|Uint8Array} Существующий `Buffer` или [`Uint8Array`], откуда копируются данные.

Копирует переданные данные `buffer` в новый экземпляр `Buffer`.

```js
const buf1 = Buffer.from('buffer');
const buf2 = Buffer.from(buf1);

buf1[0] = 0x61;

console.log(buf1.toString());
// Prints: auffer
console.log(buf2.toString());
// Prints: buffer
```

Если `buffer` не является `Buffer`, возникает `TypeError`.

### Class Method: Buffer.from(object[, offsetOrEncoding[, length]])
<!-- YAML
added: v8.2.0
-->

* `object` {Object} An object supporting `Symbol.toPrimitive` or `valueOf()`
* `offsetOrEncoding` {number|string} A byte-offset or encoding, depending on the value returned either by `object.valueOf()` or `object[Symbol.toPrimitive]()`.
* `length` {number} A length, depending on the value returned either by `object.valueOf()` or `object[Symbol.toPrimitive]()`.

For objects whose `valueOf()` function returns a value not strictly equal to `object`, returns `Buffer.from(object.valueOf(), offsetOrEncoding, length)`.

```js
const buf = Buffer.from(new String('this is a test'));
// Prints: <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

For objects that support `Symbol.toPrimitive`, returns `Buffer.from(object[Symbol.toPrimitive](), offsetOrEncoding, length)`.

```js
class Foo {
  [Symbol.toPrimitive]() {
    return 'this is a test';
  }
}

const buf = Buffer.from(new Foo(), 'utf8');
// Prints: <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

### Метод Класса: Buffer.from(string[, encoding])
<!-- YAML
added: v5.10.0
-->

* `string` {string} Строка для кодирования.
* `encoding` {string} Кодирование `string`. **Default:** `'utf8'`.

Создает новый `Buffer`, содержащий `string`. Параметр `encoding` определяет кодировку символов `строки`.

```js
const buf1 = Buffer.from('this is a tést');
const buf2 = Buffer.from('7468697320697320612074c3a97374', 'hex');

console.log(buf1.toString());
// Prints: this is a tést
console.log(buf2.toString());
// Prints: this is a tést
console.log(buf1.toString('ascii'));
// Prints: this is a tC)st
```

Возникает `TypeError`, если `string` не является строкой.

### Метод Класса: Buffer.isBuffer(obj)
<!-- YAML
added: v0.1.101
-->

* `obj` {Object}
* Возвращает: {boolean}

Возвращает `true`, если `obj` является `Buffer`, в противном случае `false`.

### Метод Класса: Buffer.isEncoding(encoding)
<!-- YAML
added: v0.9.1
-->

* `кодирование`{string} Имя кодировки символа для проверки.
* Возвращает: {boolean}

Возвращает `true`, если `encoding` содержит кодировку поддерживаемых символов или в противном случае `false`.

### Свойство Класса: Buffer.poolSize
<!-- YAML
added: v0.11.3
-->

* {integer} **Default:** `8192`

This is the size (in bytes) of pre-allocated internal `Buffer` instances used for pooling. Это значение может быть изменено.

### buf[index]
<!-- YAML
type: property
name: [index]
-->

Оператор индекса `[index]` может использоваться для получения и установки октета в позиции `index` в `buf`. Значения относятся к индивидуальным байтам, поэтому легальный диапазон значения находится между `0x00` и `0xFF` (hex) или `0` и `255` (десятичное).

This operator is inherited from `Uint8Array`, so its behavior on out-of-bounds access is the same as `UInt8Array` - that is, getting returns `undefined` and setting does nothing.

```js
// Copy an ASCII string into a `Buffer` one byte at a time.

const str = 'Node.js';
const buf = Buffer.allocUnsafe(str.length);

for (let i = 0; i < str.length; i++) {
  buf[i] = str.charCodeAt(i);
}

console.log(buf.toString('ascii'));
// Prints: Node.js
```

### buf.buffer

* {ArrayBuffer} The underlying `ArrayBuffer` object based on which this `Buffer` object is created.

```js
const arrayBuffer = new ArrayBuffer(16);
const buffer = Buffer.from(arrayBuffer);

console.log(buffer.buffer === arrayBuffer);
// Prints: true
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
* `targetStart` {integer} Смещение в пределах `target`, где начинается сравнение. **Default:** `0`.
* `targetEnd` {integer} Смещение с `target`, где сравнение заканчивается (не включительно). **Default:** `target.length`.
* `sourceStart` {integer} Смещение в пределах `buf`, где начинается сравнение. **Default:** `0`.
* `sourceEnd` {integer} Смещение в пределах `buf`, где сравнение заканчивается (не включительно). **Default:** [`buf.length`].
* Возвращает: {integer}

Сравнивает `buf` с `target` и возвращает число, указывающее, приходит ли `buf` до, после, или так же как и `target` в порядке сортировки. Сравнение основывается на фактической последовательности байтов в каждом `Buffer`.

* `0` возвращается, если `target` является таким же как `buf`
* `1` возвращается, если `target` приходит *до* `buf` при сортировке.
* `-1` возвращается, если `target` приходит *после* `buf` при сортировке.

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
// (This result is equal to: [buf1, buf3, buf2])
```

Дополнительные `targetStart`, `targetEnd`, `sourceStart` и `sourceEnd` аргументы могут быть использованы для ограничения сравнения определенных диапазонов в пределах `target` и `buf`, соответственно.

```js
const buf1 = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);
const buf2 = Buffer.from([5, 6, 7, 8, 9, 1, 2, 3, 4]);

console.log(buf1.compare(buf2, 5, 9, 0, 4));
// Prints: 0
console.log(buf1.compare(buf2, 0, 6, 4));
// Prints: -1
console.log(buf1.compare(buf2, 5, 6, 5));
// Prints: 1
```

[`ERR_INDEX_OUT_OF_RANGE`] is thrown if `targetStart < 0`, `sourceStart < 0`, `targetEnd > target.byteLength`, or `sourceEnd > source.byteLength`.

### buf.copy(target[, targetStart[, sourceStart[, sourceEnd]]])
<!-- YAML
added: v0.1.90
-->

* `target` {Buffer|Uint8Array} `Buffer` или [`Uint8Array`] для копирования.
* `targetStart` {integer} The offset within `target` at which to begin writing. **Default:** `0`.
* `sourceStart` {integer} The offset within `buf` from which to begin copying. **Default:** `0`.
* `sourceEnd` {integer} Смещение в пределах `buf`, где завершается копирование (не включительно). **Default:** [`buf.length`].
* Возвращает: {integer} Количество скопированных байтов.

Копирует данные из региона `buf` в регион `target`, даже если `target` область памяти совпадает с `buf`.

```js
// Create two `Buffer` instances.
const buf1 = Buffer.allocUnsafe(26);
const buf2 = Buffer.allocUnsafe(26).fill('!');

for (let i = 0; i < 26; i++) {
  // 97 is the decimal ASCII value for 'a'
  buf1[i] = i + 97;
}

// Copy `buf1` bytes 16 through 19 into `buf2` starting at byte 8 of `buf2`
buf1.copy(buf2, 8, 16, 20);

console.log(buf2.toString('ascii', 0, 25));
// Prints: !!!!!!!!qrst!!!!!!!!!!!!!
```

```js
// Create a `Buffer` and copy data from one region to an overlapping region
// within the same `Buffer`.

const buf = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 is the decimal ASCII value for 'a'
  buf[i] = i + 97;
}

buf.copy(buf, 0, 4, 10);

console.log(buf.toString());
// Prints: efghijghijklmnopqrstuvwxyz
```

### buf.entries()
<!-- YAML
added: v1.1.0
-->

* Возвращает: {Iterator}

Создает и возвращает [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) `[index, byte]` пар из содержимого `buf`.

```js
// Log the entire contents of a `Buffer`.

const buf = Buffer.from('buffer');

for (const pair of buf.entries()) {
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

* `otherBuffer` {Buffer} A `Buffer` or [`Uint8Array`] with which to compare `buf`.
* Возвращает: {boolean}

Возвращает `true`, если и `buf`, и `otherBuffer` имеют точно такие же байты, иначе `false`.

```js
const buf1 = Buffer.from('ABC');
const buf2 = Buffer.from('414243', 'hex');
const buf3 = Buffer.from('ABCD');

console.log(buf1.equals(buf2));
// Prints: true
console.log(buf1.equals(buf3));
// Prints: false
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

* `value` {string|Buffer|integer} The value with which to fill `buf`.
* `offset` {integer} Количество байтов для пропуска перед началом заполнения `buf`. **Default:** `0`.
* `end` {integer} Где заполнение завершается `buf` (не включительно). **Default:** [`buf.length`].
* `encoding` {string} The encoding for `value` if `value` is a string. **Default:** `'utf8'`.
* Возвращает: {Buffer} Ссылка на `buf`.

Заполняет `buf` указанным `value`. If the `offset` and `end` are not given, the entire `buf` will be filled:

```js
// Fill a `Buffer` with the ASCII character 'h'.

const b = Buffer.allocUnsafe(50).fill('h');

console.log(b.toString());
// Prints: hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
```

`value` is coerced to a `uint32` value if it is not a string, `Buffer`, or integer. If the resulting integer is greater than `255` (decimal), `buf` will be filled with `value & 255`.

If the final write of a `fill()` operation falls on a multi-byte character, then only the bytes of that character that fit into `buf` are written:

```js
// Fill a `Buffer` with a two-byte character.

console.log(Buffer.allocUnsafe(3).fill('\u0222'));
// Prints: <Buffer c8 a2 c8>
```

If `value` contains invalid characters, it is truncated; if no valid fill data remains, an exception is thrown:

```js
const buf = Buffer.allocUnsafe(5);

console.log(buf.fill('a'));
// Prints: <Buffer 61 61 61 61 61>
console.log(buf.fill('aazz', 'hex'));
// Prints: <Buffer aa aa aa aa aa>
console.log(buf.fill('zz', 'hex'));
// Throws an exception.
```

### buf.includes(value\[, byteOffset\]\[, encoding\])
<!-- YAML
added: v5.3.0
-->

* `value` {string|Buffer|integer} Что искать.
* `byteOffset` {integer} Где начать поиск в `buf`. **Default:** `0`.
* `encoding` {string} Если `value` является строкой, это кодирование. **Default:** `'utf8'`.
* Возвращает: {boolean} `true`, если `value` был найден в `buf`, в противном случае это `false`.

Эквивалентно [`buf.indexOf() !== -1`][`buf.indexOf()`].

```js
const buf = Buffer.from('this is a buffer');

console.log(buf.includes('this'));
// Prints: true
console.log(buf.includes('is'));
// Prints: true
console.log(buf.includes(Buffer.from('a buffer')));
// Prints: true
console.log(buf.includes(97));
// Prints: true (97 is the decimal ASCII value for 'a')
console.log(buf.includes(Buffer.from('a buffer example')));
// Prints: false
console.log(buf.includes(Buffer.from('a buffer example').slice(0, 8)));
// Prints: true
console.log(buf.includes('this', 4));
// Prints: false
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

* `value` {string|Buffer|Uint8Array|integer} Что искать.
* `byteOffset` {integer} Где начать поиск в `buf`. **Default:** `0`.
* `encoding` {string} If `value` is a string, this is the encoding used to determine the binary representation of the string that will be searched for in `buf`. **Default:** `'utf8'`.
* Returns: {integer} The index of the first occurrence of `value` in `buf`, or `-1` if `buf` does not contain `value`.

Если `value`:

  * строка, `value` интерпретируется в соответствии с кодировкой символов в `encoding`.
  * a `Buffer` or [`Uint8Array`], `value` will be used in its entirety. To compare a partial `Buffer`, use [`buf.slice()`].
  * число, `value` будет интерпретироваться как 8-разрядное число без знака в диапазоне от `0` до `255`.

```js
const buf = Buffer.from('this is a buffer');

console.log(buf.indexOf('this'));
// Prints: 0
console.log(buf.indexOf('is'));
// Prints: 2
console.log(buf.indexOf(Buffer.from('a buffer')));
// Prints: 8
console.log(buf.indexOf(97));
// Prints: 8 (97 is the decimal ASCII value for 'a')
console.log(buf.indexOf(Buffer.from('a buffer example')));
// Prints: -1
console.log(buf.indexOf(Buffer.from('a buffer example').slice(0, 8)));
// Prints: 8

const utf16Buffer = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'utf16le');

console.log(utf16Buffer.indexOf('\u03a3', 0, 'utf16le'));
// Prints: 4
console.log(utf16Buffer.indexOf('\u03a3', -4, 'utf16le'));
// Prints: 6
```

Если `value` не строка, номер или `Buffer`, этот метод выдаст `TypeError`. Если `value` является числом, оно будет приведено к действительному значению байта - целому числу между 0 и 255.

Если `byteOffset` не является числом, он будет приведен к числу. If the result of coercion is `NaN` or `0`, then the entire buffer will be searched. This behavior matches [`String#indexOf()`].

```js
const b = Buffer.from('abcdef');

// Передача значения, которое является числом, но не является действительным байтом
// Печатает: 2, эквивалентно поиску 99 или 'c'
console.log(b.indexOf(99.9));
console.log(b.indexOf(256 + 99));

// Передача byteOffset, который приводит к NaN или 0
// Печатает: 1, исследование всего буфера
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

* Возвращает: {Iterator}

Создает и возвращает [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) ключей (индексов) `buf`.

```js
const buf = Buffer.from('buffer');

for (const key of buf.keys()) {
  console.log(key);
}
// Prints:
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

* `value` {string|Buffer|Uint8Array|integer} Что искать.
* `byteOffset` {integer} Где начать поиск в `buf`. **Default:** [`buf.length`]`- 1`.
* `encoding` {string} If `value` is a string, this is the encoding used to determine the binary representation of the string that will be searched for in `buf`. **Default:** `'utf8'`.
* Returns: {integer} The index of the last occurrence of `value` in `buf`, or `-1` if `buf` does not contain `value`.

Identical to [`buf.indexOf()`], except the last occurrence of `value` is found rather than the first occurrence.

```js
const buf = Buffer.from('this buffer is a buffer');

console.log(buf.lastIndexOf('this'));
// Prints: 0
console.log(buf.lastIndexOf('buffer'));
// Prints: 17
console.log(buf.lastIndexOf(Buffer.from('buffer')));
// Prints: 17
console.log(buf.lastIndexOf(97));
// Prints: 15 (97 is the decimal ASCII value for 'a')
console.log(buf.lastIndexOf(Buffer.from('yolo')));
// Prints: -1
console.log(buf.lastIndexOf('buffer', 5));
// Prints: 5
console.log(buf.lastIndexOf('buffer', 4));
// Prints: -1

const utf16Buffer = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'utf16le');

console.log(utf16Buffer.lastIndexOf('\u03a3', undefined, 'utf16le'));
// Prints: 6
console.log(utf16Buffer.lastIndexOf('\u03a3', -5, 'utf16le'));
// Prints: 4
```

Если `value` не строка, номер или `Buffer`, этот метод выдаст `TypeError`. Если `value` является числом, оно будет приведено к действительному значению байта - целому числу между 0 и 255.

Если `byteOffset` не является числом, он будет приведен к числу. Любые аргументы, которые приводят к `NaN`, такие как `{}`, или `undefined`, будут исследовать весь буфер. Это поведение соответствует [`String#lastIndexOf()`].

```js
const b = Buffer.from('abcdef');

// Передача значения, которое является числом, но не является действительным байтом
// Печатает: 2, эквивалентно поиску 99 или 'c'
console.log(b.lastIndexOf(99.9));
console.log(b.lastIndexOf(256 + 99));

// Передача byteOffset, который приводит к NaN
// Печатает: 1, исследование всего буфера
console.log(b.lastIndexOf('b', undefined));
console.log(b.lastIndexOf('b', {}));

// Передача byteOffset, который приводит к 0
// Печатает: -1, эквивалентно прохождению 0
console.log(b.lastIndexOf('b', null));
console.log(b.lastIndexOf('b', []));
```

If `value` is an empty string or empty `Buffer`, `byteOffset` will be returned.

### buf.length
<!-- YAML
added: v0.1.90
-->

* {integer}

Возвращает объем памяти, выделенный для `buf` в байтах. Обратите внимание, что это не обязательно отражает количество «используемых» данных в `buf`.

```js
// Create a `Buffer` and write a shorter ASCII string to it.

const buf = Buffer.alloc(1234);

console.log(buf.length);
// Prints: 1234

buf.write('some string', 0, 'ascii');

console.log(buf.length);
// Prints: 1234
```

Хотя свойство `length` не является неизменным, изменение значения `length` может привести к неопределенному и противоречивому поведению. Поэтому приложения, которые хотят изменить длину `Buffer`, должны рассматривать `length` только для чтения и использовать [`buf.slice()`] для создания нового `Buffer`.

```js
let buf = Buffer.allocUnsafe(10);

buf.write('abcdefghj', 0, 'ascii');

console.log(buf.length);
// Prints: 10

buf = buf.slice(0, 5);

console.log(buf.length);
// Prints: 5
```

### buf.parent
<!-- YAML
deprecated: v8.0.0
-->

> Stability: 0 - Deprecated: Use [`buf.buffer`] instead.

The `buf.parent` property is a deprecated alias for `buf.buffer`.

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

* `offset` {integer} Количество байтов, которое игнорируется перед началом чтения. Must satisfy `0 <= offset <= buf.length - 8`.
* Возвращает: {number}

Читает 64-битное число двойной точности из `buf` при заданном `offset` с указанным endian форматом (`readDoubleBE()` возвращает big endian, `readDoubleLE()` возвращает little endian).

```js
const buf = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]);

console.log(buf.readDoubleBE(0));
// Prints: 8.20788039913184e-304
console.log(buf.readDoubleLE(0));
// Prints: 5.447603722011605e-270
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

* `offset` {integer} Количество байтов, которое игнорируется перед началом чтения. Must satisfy `0 <= offset <= buf.length - 4`.
* Возвращает: {number}

Считывает 32-битное число типа float из `buf` при заданном `offset` с указанным endian форматом (`readFloatBE()` возвращает big endian, `readFloatLE()` возвращает little endian).

```js
const buf = Buffer.from([1, 2, 3, 4]);

console.log(buf.readFloatBE(0));
// Prints: 2.387939260590663e-38
console.log(buf.readFloatLE(0));
// Prints: 1.539989614439558e-36
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

* `offset` {integer} Количество байтов, которое игнорируется перед началом чтения. Must satisfy `0 <= offset <= buf.length - 1`.
* Возвращает: {integer}

Считывает 8-битное целое число со знаком из `buf` с указанным `offset`.

Целые числа, считанные из `Buffer` интерпретируются как знаковые значения дополнения двух.

```js
const buf = Buffer.from([-1, 5]);

console.log(buf.readInt8(0));
// Prints: -1
console.log(buf.readInt8(1));
// Prints: 5
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

* `offset` {integer} Количество байтов, которое игнорируется перед началом чтения. Must satisfy `0 <= offset <= buf.length - 2`.
* Возвращает: {integer}

Считывает 16-битное знаковое целое число из `buf` при заданном `offset` с указанным endian форматом (`readInt16BE()` возвращает big endian, `readInt16LE()` возвращает little endian).

Целые числа, считанные из `Buffer` интерпретируются как знаковые значения дополнения двух.

```js
const buf = Buffer.from([0, 5]);

console.log(buf.readInt16BE(0));
// Prints: 5
console.log(buf.readInt16LE(0));
// Prints: 1280
console.log(buf.readInt16LE(1));
// Throws ERR_OUT_OF_RANGE
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

* `offset` {integer} Количество байтов, которое игнорируется перед началом чтения. Must satisfy `0 <= offset <= buf.length - 4`.
* Возвращает: {integer}

Считывает 32-битное знаковое целое число из `buf` при заданном `offset` с указанным endian форматом (`readInt32BE()` возвращает big endian, `readInt32LE()` возвращает little endian).

Целые числа, считанные из `Buffer` интерпретируются как знаковые значения дополнения двух.

```js
const buf = Buffer.from([0, 0, 0, 5]);

console.log(buf.readInt32BE(0));
// Prints: 5
console.log(buf.readInt32LE(0));
// Prints: 83886080
console.log(buf.readInt32LE(1));
// Throws ERR_OUT_OF_RANGE
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

* `offset` {integer} Количество байтов, которое игнорируется перед началом чтения. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Количество байтов для чтения. Must satisfy `0 < byteLength <= 6`.
* Возвращает: {integer}

Считывает количество байтов `byteLength` из `buf` с указанным `offset` и интерпретирует результат как знаковое значение дополнения двух. Поддерживает точность до 48 бит.

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab]);

console.log(buf.readIntLE(0, 6).toString(16));
// Prints: -546f87a9cbee
console.log(buf.readIntBE(0, 6).toString(16));
// Prints: 1234567890ab
console.log(buf.readIntBE(1, 6).toString(16));
// Throws ERR_INDEX_OUT_OF_RANGE
console.log(buf.readIntBE(1, 0).toString(16));
// Throws ERR_OUT_OF_RANGE
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

* `offset` {integer} Количество байтов, которое игнорируется перед началом чтения. Must satisfy `0 <= offset <= buf.length - 1`.
* Возвращает: {integer}

Считывает 8-битное целое число без знака из `buf` с указанным `offset`.

```js
const buf = Buffer.from([1, -2]);

console.log(buf.readUInt8(0));
// Prints: 1
console.log(buf.readUInt8(1));
// Prints: 254
console.log(buf.readUInt8(2));
// Throws ERR_OUT_OF_RANGE
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

* `offset` {integer} Количество байтов, которое игнорируется перед началом чтения. Must satisfy `0 <= offset <= buf.length - 2`.
* Возвращает: {integer}

Считывает 16-битное целое число без знака из `buf` при заданном `offset` с указанным endian форматом (`readUInt16BE()` возвращает big endian, `readUInt16LE()` возвращает little endian).

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
// Throws ERR_OUT_OF_RANGE
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

* `offset` {integer} Количество байтов, которое игнорируется перед началом чтения. Must satisfy `0 <= offset <= buf.length - 4`.
* Возвращает: {integer}

Считывает 32-битное целое число без знака из `buf` при заданном `offset` с указанным endian форматом (`readUInt32BE()` возвращает big endian, `readUInt32LE()` возвращает little endian).

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78]);

console.log(buf.readUInt32BE(0).toString(16));
// Prints: 12345678
console.log(buf.readUInt32LE(0).toString(16));
// Prints: 78563412
console.log(buf.readUInt32LE(1).toString(16));
// Throws ERR_OUT_OF_RANGE
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

* `offset` {integer} Количество байтов, которое игнорируется перед началом чтения. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Количество байтов для чтения. Must satisfy `0 < byteLength <= 6`.
* Возвращает: {integer}

Считывает количество байтов `byteLength` из `buf` при заданном `offset` и интерпретирует результат как целое число без знака. Поддерживает точность до 48 бит.

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab]);

console.log(buf.readUIntBE(0, 6).toString(16));
// Prints: 1234567890ab
console.log(buf.readUIntLE(0, 6).toString(16));
// Prints: ab9078563412
console.log(buf.readUIntBE(1, 6).toString(16));
// Throws ERR_OUT_OF_RANGE
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

* `start` {integer} Где начнется новый `Buffer`. **Default:** `0`.
* `end` {integer} Где закончится новый `Buffer` (не включительно). **Default:** [`buf.length`].
* Возвращает: {Buffer}

Возвращает новый `Buffer`, который ссылается на ту же память, что и оригинал, но смещен и ограничен индексами `start` и `end`.

Specifying `end` greater than [`buf.length`] will return the same result as that of `end` equal to [`buf.length`].

Modifying the new `Buffer` slice will modify the memory in the original `Buffer` because the allocated memory of the two objects overlap.

```js
// Create a `Buffer` with the ASCII alphabet, take a slice, and modify one byte
// from the original `Buffer`.

const buf1 = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 is the decimal ASCII value for 'a'
  buf1[i] = i + 97;
}

const buf2 = buf1.slice(0, 3);

console.log(buf2.toString('ascii', 0, buf2.length));
// Prints: abc

buf1[0] = 33;

console.log(buf2.toString('ascii', 0, buf2.length));
// Prints: !bc
```

Задание негативных индексов приводит к тому, что сегмент генерируется относительно конца `buf`, а не начала.

```js
const buf = Buffer.from('buffer');

console.log(buf.slice(-6, -1).toString());
// Prints: buffe
// (Equivalent to buf.slice(0, 5))

console.log(buf.slice(-6, -2).toString());
// Prints: buff
// (Equivalent to buf.slice(0, 4))

console.log(buf.slice(-5, -2).toString());
// Prints: uff
// (Equivalent to buf.slice(1, 4))
```

### buf.swap16()
<!-- YAML
added: v5.10.0
-->

* Возвращает: {Buffer} Ссылка на `buf`.

Interprets `buf` as an array of unsigned 16-bit integers and swaps the byte order *in-place*. Throws [`ERR_INVALID_BUFFER_SIZE`] if [`buf.length`] is not a multiple of 2.

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

console.log(buf1);
// Prints: <Buffer 01 02 03 04 05 06 07 08>

buf1.swap16();

console.log(buf1);
// Prints: <Buffer 02 01 04 03 06 05 08 07>

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

buf2.swap16();
// Throws ERR_INVALID_BUFFER_SIZE
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

* Возвращает: {Buffer} Ссылка на `buf`.

Interprets `buf` as an array of unsigned 32-bit integers and swaps the byte order *in-place*. Throws [`ERR_INVALID_BUFFER_SIZE`] if [`buf.length`] is not a multiple of 4.

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

console.log(buf1);
// Prints: <Buffer 01 02 03 04 05 06 07 08>

buf1.swap32();

console.log(buf1);
// Prints: <Buffer 04 03 02 01 08 07 06 05>

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

buf2.swap32();
// Throws ERR_INVALID_BUFFER_SIZE
```

### buf.swap64()
<!-- YAML
added: v6.3.0
-->

* Возвращает: {Buffer} Ссылка на `buf`.

Interprets `buf` as an array of 64-bit numbers and swaps byte order *in-place*. Throws [`ERR_INVALID_BUFFER_SIZE`] if [`buf.length`] is not a multiple of 8.

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

console.log(buf1);
// Prints: <Buffer 01 02 03 04 05 06 07 08>

buf1.swap64();

console.log(buf1);
// Prints: <Buffer 08 07 06 05 04 03 02 01>

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

buf2.swap64();
// Throws ERR_INVALID_BUFFER_SIZE
```

Обратите внимание, что JavaScript не может кодировать 64-битные целые числа. Этот метод предназначен для работы с 64-битными числами типа float.

### buf.toJSON()
<!-- YAML
added: v0.9.2
-->

* Возвращает: {Object}

Возвращает образ JSON экземпляра `buf`. [`JSON.stringify()`] неявно вызывает эту функцию, когда преобразует в строку экземпляр `Buffer`.

```js
const buf = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5]);
const json = JSON.stringify(buf);

console.log(json);
// Prints: {"type":"Buffer","data":[1,2,3,4,5]}

const copy = JSON.parse(json, (key, value) => {
  return value && value.type === 'Buffer' ?
    Buffer.from(value.data) :
    value;
});

console.log(copy);
// Prints: <Buffer 01 02 03 04 05>
```

### buf.toString([encoding[, start[, end]]])
<!-- YAML
added: v0.1.90
-->

* `encoding` {string} The character encoding to use. **Default:** `'utf8'`.
* `start` {integer} Смещение байта, с которого начинается декодирование. **Default:** `0`.
* `end` {integer} Байт смещения, при котором останавливается декодирование (не включительно). **Default:** [`buf.length`].
* Возвращает: {string}

Декодирует `buf` в строку в соответствии с кодировкой символов, указанной в `encoding`. `start` и `end` могут быть переданы для декодирования только подмножества `buf`.

The maximum length of a string instance (in UTF-16 code units) is available as [`buffer.constants.MAX_STRING_LENGTH`][].

```js
const buf1 = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 is the decimal ASCII value for 'a'
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

### buf.values()
<!-- YAML
added: v1.1.0
-->

* Возвращает: {Iterator}

Создает и возвращает [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) для значений `buf` (байты). Эта функция вызывается автоматически, когда `Buffer` используется в утверждении `for..of`.

```js
const buf = Buffer.from('buffer');

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
// Prints:
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

* `string` {string} String to write to `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи `string`. **Default:** `0`.
* `length` {integer} Количество байтов для записи. **Default:** `buf.length - offset`.
* `encoding` {string} Кодировка символов `string`. **Default:** `'utf8'`.
* Возвращает: {integer} Количество записанных байтов.

Writes `string` to `buf` at `offset` according to the character encoding in `encoding`. Параметр `length` - это количество байтов для записи. If `buf` did not contain enough space to fit the entire string, only part of `string` will be written. Однако частично закодированные символы не будут записаны.

```js
const buf = Buffer.alloc(256);

const len = buf.write('\u00bd + \u00bc = \u00be', 0);

console.log(`${len} bytes: ${buf.toString('utf8', 0, len)}`);
// Prints: 12 bytes: ½ + ¼ = ¾
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

* `value` {number} Количество для записи в `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи. Must satisfy `0 <= offset <= buf.length - 8`.
* Возвращает: {integer} `offset` плюс количество записанных байтов.

Записывает `value` в `buf` с заданным `offset` с указанным endian форматом (`writeDoubleBE()` записывает big endian, `writeDoubleLE()` записывает little endian). `value` *должно* быть допустимым 64-битным числом двойной точности. Поведение не определено, когда `value` отличается от 64-битного числа двойной точности.

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

* `value` {number} Количество для записи в `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи. Must satisfy `0 <= offset <= buf.length - 4`.
* Возвращает: {integer} `offset` плюс количество записанных байтов.

Записывает `value` в `buf` с заданным `offset` с указанным endian форматом (`writeFloatBE()` записывает big endian, `writeFloatLE()` записывает little endian). `value` *должно* быть допустимым 32-битным числом типа float. Поведение не определено, когда `value` отличается от 32-битного числа типа float.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeFloatBE(0xcafebabe, 0);

console.log(buf);
// Prints: <Buffer 4f 4a fe bb>

buf.writeFloatLE(0xcafebabe, 0);

console.log(buf);
// Prints: <Buffer bb fe 4a 4f>
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

* `value` {integer} Количество для записи в `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи. Must satisfy `0 <= offset <= buf.length - 1`.
* Возвращает: {integer} `offset` плюс количество записанных байтов.

Записывает `value` в `buf` с указанным `offset`. `value` *должно* быть допустимым 8-битным целым знаковым числом. Поведение не определено, когда `value` отличается от 8-битного целого знакового числа.

`value` интерпретируется и записывается как знаковое целое число дополнения двух.

```js
const buf = Buffer.allocUnsafe(2);

buf.writeInt8(2, 0);
buf.writeInt8(-2, 1);

console.log(buf);
// Prints: <Buffer 02 fe>
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

* `value` {integer} Количество для записи в `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи. Must satisfy `0 <= offset <= buf.length - 2`.
* Возвращает: {integer} `offset` плюс количество записанных байтов.

Записывает `value` в `buf` с заданным `offset` с указанным endian форматом (`writeInt16BE()` записывает big endian, `writeInt16LE()` записывает little endian). `value` *должно* быть допустимым 16-битным знаковым целым числом. Behavior is undefined when `value` is anything other than a signed 16-bit integer.

`value` интерпретируется и записывается как знаковое целое число дополнения двух.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeInt16BE(0x0102, 0);
buf.writeInt16LE(0x0304, 2);

console.log(buf);
// Prints: <Buffer 01 02 04 03>
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

* `value` {integer} Количество для записи в `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи. Must satisfy `0 <= offset <= buf.length - 4`.
* Возвращает: {integer} `offset` плюс количество записанных байтов.

Записывает `value` в `buf` с заданным `offset` с указанным endian форматом (`writeInt32BE()` записывает big endian, `writeInt32LE()` записывает little endian). `value` *должно* быть допустимым 32-битным знаковым целым числом. Behavior is undefined when `value` is anything other than a signed 32-bit integer.

`value` интерпретируется и записывается как знаковое целое число дополнения двух.

```js
const buf = Buffer.allocUnsafe(8);

buf.writeInt32BE(0x01020304, 0);
buf.writeInt32LE(0x05060708, 4);

console.log(buf);
// Prints: <Buffer 01 02 03 04 08 07 06 05>
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

* `value` {integer} Количество для записи в `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Количество байтов для записи. Must satisfy `0 < byteLength <= 6`.
* Возвращает: {integer} `offset` плюс количество записанных байтов.

Записывает `byteLength` байты `value` в `buf` с указанным `offset`. Поддерживает точность до 48 бит. Поведение не определено, когда `value` отличается от знакового целого числа.

```js
const buf = Buffer.allocUnsafe(6);

buf.writeIntBE(0x1234567890ab, 0, 6);

console.log(buf);
// Prints: <Buffer 12 34 56 78 90 ab>

buf.writeIntLE(0x1234567890ab, 0, 6);

console.log(buf);
// Prints: <Buffer ab 90 78 56 34 12>
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

* `value` {integer} Количество для записи в `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи. Must satisfy `0 <= offset <= buf.length - 1`.
* Возвращает: {integer} `offset` плюс количество записанных байтов.

Записывает `value` в `buf` с указанным `offset`. `value` *должно* быть допустимым 8-битным целым числом без знака. Поведение не определено, когда `value` отличается от 8-битного целого числа без знака.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt8(0x3, 0);
buf.writeUInt8(0x4, 1);
buf.writeUInt8(0x23, 2);
buf.writeUInt8(0x42, 3);

console.log(buf);
// Prints: <Buffer 03 04 23 42>
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

* `value` {integer} Количество для записи в `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи. Must satisfy `0 <= offset <= buf.length - 2`.
* Возвращает: {integer} `offset` плюс количество записанных байтов.

Записывает `value` в `buf` с заданным `offset` с указанным endian форматом (`writeUInt16BE()` записывает big endian, `writeUInt16LE()` записывает little endian). `value` должно быть допустимым 16-битным целым числом без знака. Поведение не определено, когда `value` отличается от 16-битного целого числа без знака.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt16BE(0xdead, 0);
buf.writeUInt16BE(0xbeef, 2);

console.log(buf);
// Prints: <Buffer de ad be ef>

buf.writeUInt16LE(0xdead, 0);
buf.writeUInt16LE(0xbeef, 2);

console.log(buf);
// Prints: <Buffer ad de ef be>
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

* `value` {integer} Количество для записи в `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи. Must satisfy `0 <= offset <= buf.length - 4`.
* Возвращает: {integer} `offset` плюс количество записанных байтов.

Записывает `value` в `buf` с заданным `offset` с указанным endian форматом (`writeUInt32BE()` записывает big endian, `writeUInt32LE()` записывает little endian). `value` должно быть допустимым 32-битным целым числом без знака. Поведение не определено, когда `value` отличается от 32-битного целого числа без знака.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt32BE(0xfeedface, 0);

console.log(buf);
// Prints: <Buffer fe ed fa ce>

buf.writeUInt32LE(0xfeedface, 0);

console.log(buf);
// Prints: <Buffer ce fa ed fe>
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

* `value` {integer} Количество для записи в `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Количество байтов для записи. Must satisfy `0 < byteLength <= 6`.
* Возвращает: {integer} `offset` плюс количество записанных байтов.

Записывает `byteLength` байты `value` в `buf` с указанным `offset`. Поддерживает точность до 48 бит. Поведение не определено, когда `value` отличается от целого числа без знака.

```js
const buf = Buffer.allocUnsafe(6);

buf.writeUIntBE(0x1234567890ab, 0, 6);

console.log(buf);
// Prints: <Buffer 12 34 56 78 90 ab>

buf.writeUIntLE(0x1234567890ab, 0, 6);

console.log(buf);
// Prints: <Buffer ab 90 78 56 34 12>
```

## buffer.INSPECT_MAX_BYTES
<!-- YAML
added: v0.5.4
-->

* {integer} **По умолчанию:** `50`

Возвращает максимальное количество байтов, которые будут возвращены при вызове `buf.inspect()`. Это может быть переопределено пользовательскими модулями. Для более подробной информации о поведении `buf.inspect()` смотрите [`util.inspect()`].

Note that this is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## buffer.kMaxLength
<!-- YAML
added: v3.0.0
-->

* {integer} Наибольший размер для одного экземпляра `Buffer`.

An alias for [`buffer.constants.MAX_LENGTH`][].

Note that this is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## buffer.transcode(source, fromEnc, toEnc)
<!-- YAML
added: v7.1.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `source` parameter can now be a `Uint8Array`.
-->

* `source` {Buffer|Uint8Array} A `Buffer` or `Uint8Array` instance.
* `fromEnc` {string} The current encoding.
* `toEnc` {string} To target encoding.

Re-encodes the given `Buffer` or `Uint8Array` instance from one character encoding to another. Returns a new `Buffer` instance.

Throws if the `fromEnc` or `toEnc` specify invalid character encodings or if conversion from `fromEnc` to `toEnc` is not permitted.

Encodings supported by `buffer.transcode()` are: `'ascii'`, `'utf8'`, `'utf16le'`, `'ucs2'`, `'latin1'`, and `'binary'`.

The transcoding process will use substitution characters if a given byte sequence cannot be adequately represented in the target encoding. Например:

```js
const buffer = require('buffer');

const newBuf = buffer.transcode(Buffer.from('€'), 'utf8', 'ascii');
console.log(newBuf.toString('ascii'));
// Prints: '?'
```

Because the Euro (`€`) sign is not representable in US-ASCII, it is replaced with `?` in the transcoded `Buffer`.

Note that this is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## Класс: SlowBuffer
<!-- YAML
deprecated: v6.0.0
-->

> Стабильность: 0 - Устарело: Вместо этого используйте [`Buffer.allocUnsafeSlow()`].

Возвращает `Buffer` без пула.

Чтобы избежать накопления мусора из-за создания множества индивидуально выделенных экземпляров `Buffer`, по умолчанию выделения размером менее 4КБ отделяются от одного большого выделенного объекта.

В случае, когда разработчику необходимо сохранить небольшую часть памяти пула на неопределенный промежуток времени, целесообразно создать экземпляр `Buffer` без пула с использованием `SlowBuffer`, а затем скопировать соответствующие биты.

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

Использовать `SlowBuffer` нужно только в качестве крайней меры *после того*, как разработчик обнаружил чрезмерное удержание памяти в своих приложениях.

### new SlowBuffer(size)
<!-- YAML
deprecated: v6.0.0
-->

> Стабильность: 0 - Устарело: Вместо этого используйте [`Buffer.allocUnsafeSlow()`].

* `size` {integer} Желаемая длина нового `SlowBuffer`.

Выделяет новый `Buffer` на `size` байтов. If `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, [`ERR_INVALID_OPT_VALUE`] is thrown. A zero-length `Buffer` is created if `size` is 0.

Базовая память для экземпляров `SlowBuffer` *не инициализирована*. The contents of a newly created `SlowBuffer` are unknown and may contain sensitive data. Use [`buf.fill(0)`][`buf.fill()`] to initialize a `SlowBuffer` with zeroes.

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

Note that `buffer.constants` is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

### buffer.constants.MAX_LENGTH
<!-- YAML
added: v8.2.0
-->

* {integer} Наибольший размер для одного экземпляра `Buffer`.

В 32-битных архитектурах это значение равно `(2^30)-1` (~1GB). В 64-битных архитектурах это значение равно `(2^31)-1` (~2GB).

This value is also available as [`buffer.kMaxLength`][].

### buffer.constants.MAX_STRING_LENGTH
<!-- YAML
added: v8.2.0
-->

* {integer} The largest length allowed for a single `string` instance.

Represents the largest `length` that a `string` primitive can have, counted in UTF-16 code units.

This value may depend on the JS engine that is being used.
