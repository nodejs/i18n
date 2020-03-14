# Буфер

<!--introduced_in=v0.10.0-->

> Стабильность: 2 - Стабильно

Prior to the introduction of [`TypedArray`], the JavaScript language had no mechanism for reading or manipulating streams of binary data. The `Buffer` class was introduced as part of the Node.js API to enable interaction with octet streams in TCP streams, file system operations, and other contexts.

With [`TypedArray`] now available, the `Buffer` class implements the [`Uint8Array`] API in a manner that is more optimized and suitable for Node.js.

Экземпляры класса `Buffer` похожи на массивы целых чисел, но соответствуют фиксированному, необработанному распределению памяти вне кучи V8. The size of the `Buffer` is established when it is created and cannot be changed.

The `Buffer` class is within the global scope, making it unlikely that one would need to ever use `require('buffer').Buffer`.

Примеры:

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

В версиях Node.js до v6 экземпляры `Buffer` создавались с помощью функции конструктора `Buffer`, которая по-разному распределяет возвращаемый `Buffer`, основываясь на заданных аргументах:

* Передача числа в качестве первого аргумента в `Buffer()` (например, `new Buffer(10)`) создает новый объект `Buffer` указанного размера. Prior to Node.js 8.0.0, the memory allocated for such `Buffer` instances is *not* initialized and *can contain sensitive data*. Such `Buffer` instances *must* be subsequently initialized by using either [`buf.fill(0)`][`buf.fill()`] or by writing to the `Buffer` completely. While this behavior is *intentional* to improve performance, development experience has demonstrated that a more explicit distinction is required between creating a fast-but-uninitialized `Buffer` versus creating a slower-but-safer `Buffer`. Starting in Node.js 8.0.0, `Buffer(num)` and `new Buffer(num)` will return a `Buffer` with initialized memory.
* Передача строки, массива или `Buffer` в качестве первого аргумента копирует переданные данные объекта в `Buffer`.
* Передача [`ArrayBuffer`] или [`SharedArrayBuffer`] возвращает `Buffer`, который делит выделенную память с буфером заданного массива.

Поскольку поведение `new Buffer()` значительно изменяется в зависимости от типа значения, переданного в качестве первого аргумента, приложения, которые не выполняют правильную проверку входных аргументов, передаваемых в `new Buffer()`, или неправильно инициализируют новый контент `Buffer`, могут случайно привести к проблемам безопасности и надежности в вашем коде.

Чтобы сделать создание экземпляров `Buffer` более надежным и менее подверженным ошибкам, различные формы конструктора `new Buffer()` были **объявлены устаревшими** и заменены отдельными методами `Buffer.from()`, [`Buffer.alloc()`] и [`Buffer.allocUnsafe()`].

*Разработчики должны перенести все существующие конструкторы `new Buffer()` в один из этих новых API.*

* [`Buffer.from(array)`] возвращает новый `Buffer`, в котором содержится *копия* предоставленных октетов.
* [`Buffer.from(arrayBuffer[, byteOffset [, length]])`][`Buffer.from(arrayBuffer)`] возвращает новый `Buffer`, который *делит* одну и ту же выделенную память, заданную [`ArrayBuffer`].
* [`Buffer.from(buffer)`] возвращает новый `Buffer`, в котором содержится *копия* содержимого указанного `Buffer`.
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`] возвращает новый `Buffer`, в котором содержится *копия* заданной строки.
* [`Buffer.alloc(size[, fill[, encoding]])`][`Buffer.alloc()`] возвращает "заполненный" экземпляр `Buffer` заданного размера. Этот метод может быть значительно медленнее, чем [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`], но обеспечивает отсутствие старых и потенциально незащищенных данных в новых экземплярах `Buffer`.
* [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] и [`Buffer.allocUnsafeSlow(size)`][`Buffer.allocUnsafeSlow()`] возвращают новый `Buffer` заданного `размера`, содержимое которого *должно* быть инициализировано с помощью [`buf.fill(0)`][`buf.fill()`] или полностью записано вручную.

Экземпляры `Buffer`, возвращаемые [`Buffer.allocUnsafe()`], *могут* быть выделены из совместного пула внутренней памяти, если их `размер` меньше или равен половине [`Buffer.poolSize`]. Экземпляры, возвращаемые [`Buffer.allocUnsafeSlow()`] *никогда* не используют общий пул внутренней памяти.

### Опция командной строки `--zero-fill-buffers`
<!-- YAML
added: v5.10.0
-->

Node.js может быть запущен с помощью опции командной строки `--zero-fill-buffers`, чтобы заставить все новые экземпляры `Buffer`, созданные `new Buffer(size)`, [`Buffer.allocUnsafe()`], [`Buffer.allocUnsafeSlow()`] или `new SlowBuffer(size)`, быть *автоматически заполненными нулями* при создании. Use of this flag *changes the default behavior* of these methods and *can have a significant impact* on performance. Использование опции `--zero-fill-buffers` рекомендуется, только когда необходимо обеспечить, чтобы новые экземпляры `Buffer` не содержали потенциально незащищенные данные.

Пример:

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

Экземпляры `Buffer` обычно используются для представления последовательностей кодированных символов, таких как UTF-8, UCS2, Base64, или даже шестнадцатеричных данных. Их можно конвертировать туда и обратно между экземплярами `Buffer` и обычными строками JavaScript с помощью определенного метода кодирования символов.

Пример:

```js
const buf = Buffer.from('hello world', 'ascii');

// Prints: 68656c6c6f20776f726c64
console.log(buf.toString('hex'));

// Prints: aGVsbG8gd29ybGQ=
console.log(buf.toString('base64'));
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

*Note*: Today's browsers follow the [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/) which aliases both `'latin1'` and `'ISO-8859-1'` to `'win-1252'`. This means that while doing something like `http.get()`, if the returned charset is one of those listed in the WHATWG specification it is possible that the server actually returned `'win-1252'`-encoded data, and using `'latin1'` encoding may incorrectly decode the characters.

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

Возможно создать новый `Buffer`, который разделяет одну и ту же выделенную память, как у экземпляра [`TypedArray`], с помощью свойства `.buffer` объектов TypeArray.

Пример:

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Копирует содержимое `arr`
const buf1 = Buffer.from(arr);

// Разделяет память с `arr`
const buf2 = Buffer.from(arr.buffer);

// Печать: <Buffer 88 a0>
console.log(buf1);

// Печать: <Buffer 88 13 a0 0f>
console.log(buf2);

arr[1] = 6000;

// Печать: <Buffer 88 a0>
console.log(buf1);

// Печать: <Buffer 88 13 70 17>
console.log(buf2);
```

Обратите внимание, что используя `.buffer` [`TypedArray`] при создании `Buffer`, можно использовать только часть лежащего в основе [`ArrayBuffer`], чтобы передать параметры `byteOffset` и `length`.

Пример:

```js
const arr = new Uint16Array(20);
const buf = Buffer.from(arr.buffer, 0, 16);

// Печать: 16
console.log(buf.length);
```

У `Buffer.from()` и [`TypedArray.from()`] разные свойства и реализации. В частности, варианты [`TypedArray`] принимают второй аргумент, который является функцией отображения, вызываемой на каждом элементе указанного массива:

* `TypedArray.from(source[, mapFn[, thisArg]])`

Однако метод `Buffer.from()` не поддерживает использование функции отображения:

* [`Buffer.from(array)`]
* [`Buffer.from(buffer)`]
* [`Buffer.from(arrayBuffer[, byteOffset [, length]])`][`Buffer.from(arrayBuffer)`]
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`]

## Buffers and iteration

`Buffer` instances can be iterated over using `for..of` syntax:

Пример:

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

Пример:

```js
// Создается новый Buffer, который содержит байты UTF-8 строки 'buffer'
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

> Стабильность: 0 - устарело: вместо этого используйте  [`Buffer.from(arrayBuffer[, byteOffset [, length]])`][`Buffer.from(arrayBuffer)`].

* `arrayBuffer` {ArrayBuffer|SharedArrayBuffer} - [`ArrayBuffer`], [`SharedArrayBuffer`] или свойство `.buffer` из [`TypedArray`].
* `byteOffset` {integer} Индекс первого байта для отображения. **Default:** `0`.
* `length` {integer} Количество байтов для отображения. **Default:** `arrayBuffer.length - byteOffset`.

Это создает представление [`ArrayBuffer`] или [`SharedArrayBuffer`] без копирования основной памяти. Например, при передаче ссылки свойствам `.buffer` экземпляра [`TypedArray`], вновь созданный `Buffer` будет использовать ту же выделенную память, что и [`TypedArray`].

Необязательные аргументы `byteOffset` и `length` определяют диапазон памяти в пределах `arrayBuffer`, который будет совместно использоваться `Buffer`.

Пример:

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Разделяет память с `arr`
const buf = new Buffer(arr.buffer);

// Печать: <Buffer 88 13 a0 0f>
console.log(buf);

// Изменение оригинального Uint16Array также меняет Buffer
arr[1] = 6000;

// Печать: <Buffer 88 13 70 17>
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

> Стабильность: 0 - устарело: вместо этого используйте [`Buffer.from(buffer)`].

* `buffer` {Buffer|Uint8Array} Существующий `Buffer` или [`Uint8Array`], откуда копируются данные.

Копирует переданные данные `buffer` в новый экземпляр `Buffer`.

Пример:

```js
const buf1 = new Buffer('buffer');
const buf2 = new Buffer(buf1);

buf1[0] = 0x61;

// Печать: auffer
console.log(buf1.toString());

// Печать: buffer
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

> Стабильность: 0 - устарело: вместо этого использовать [`Buffer.alloc()`] (см. также  [`Buffer.allocUnsafe()`]).

* `size` {integer} Желаемая длина нового `Buffer`.

Выделяет новый `Buffer` на `size` байтов. If the `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, a [`RangeError`] will be thrown. A zero-length `Buffer` will be created if `size` is 0.

Prior to Node.js 8.0.0, the underlying memory for `Buffer` instances created in this way is *not initialized*. The contents of a newly created `Buffer` are unknown and *may contain sensitive data*. Use [`Buffer.alloc(size)`][`Buffer.alloc()`] instead to initialize a `Buffer` to zeroes.

Пример:

```js
const buf = new Buffer(10);

// Prints: <Buffer 00 00 00 00 00 00 00 00 00 00>
console.log(buf);
```

### новый Buffer(string[, encoding])
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

> Стабильность: 0 - Устарело: Вместо этого используйте [`Buffer.from(string[, encoding])`][`Buffer.from(string)`].

* `string` {string} Строка для кодирования.
* `encoding` {string} Кодирование `string`. **Default:** `'utf8'`.

Создает новый `Buffer`, содержащий `string`. Параметр `encoding` определяет кодировку символов `строки`.

Примеры:

```js
const buf1 = новый Buffer('this is a tést');

/ / печать: this is a tést
console.log(buf1.toString());

/ / печать: this is a tC)st
console.log(buf1.toString('ascii'));

const buf2 = новый буфер ('7468697320697320612074c3a97374', 'hex');

/ / печать: this is a tést
console.log(buf2.toString());
```

### Метод Класса: Buffer.alloc(size[, fill[, encoding]])
<!-- YAML
added: v5.10.0
changes:
  - version: v8.9.3
    pr-url: https://github.com/nodejs/node/pull/17428
    description: Specifying an invalid string for `fill` now results in a
                 zero-filled buffer.
-->

* `size` {integer} Желаемая длина нового `Buffer`.
* `вставить` {string|Buffer|integer} Значение для предзаполнения нового `Buffer`. **Default:** `0`.
* `encoding` {string} Если `fill` это строка, это его кодирование. **Default:** `'utf8'`.

Выделяет новый `Buffer` на `size` байтов. Если строка `fill` является `незаполненной`, то `Buffer` останется *пустым*.

Пример:

```js
const buf = Buffer.alloc(5); 

// Prints: <Buffer 00 00 00 00 00> 
console.log(buf);
```

Выделяет новый `Buffer` на `size` байтов. If the `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, a [`RangeError`] will be thrown. A zero-length `Buffer` will be created if `size` is 0.

Если `fill` определен, выделенный `Buffer` будет инициализирован вызовом [`buf.fill(fill)`][`buf.fill()`].

Пример:

```js
const buf = Buffer.alloc(5, 'a');

 // Prints: <Buffer 61 61 61 61 61>
 console.log(buf);
```

Если и `fill`, и `encoding` определены, выделенный `Buffer` будет инициализирован вызовом [`buf.fill(fill, encoding)`][`buf.fill()`].

Пример:

```js
const buf = Buffer.alloc(11, 'aGVsbG8gd29ybGQ=', 'base64');

 // Prints: <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64>
 console.log(buf);
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

Выделяет новый `Buffer` на `size` байтов. If the `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, a [`RangeError`] will be thrown. A zero-length `Buffer` will be created if `size` is 0.

Основная память экземпляра `Buffer`, созданного таким образом, *не инициализируется*. Содержимое вновь созданного `Buffer` неизвестно и *может содержать конфиденциальные данные*. Вместо этого используйте [`Buffer.alloc()`], чтобы инициализировать экземпляры `Buffer` как ноль.

Пример:

```js
const buf = Buffer.allocUnsafe(10);

 // Prints: (содержимое может меняться): <Buffer a0 8b 28 3f 01 00 00 00 50 32>
 console.log(buf);

 buf.fill(0);

 // Prints: <Buffer 00 00 00 00 00 00 00 00 00 00> console.log(buf);
```

Если `размер` не является числом, появится `TypeError`.

Обратите внимание, что модуль `Buffer` заранее выделяет внутренний экземпляр `Buffer` размером [`Buffer.poolSize`], который используется как пул для предыдущих выделений новых экземпляров `Buffer`, созданных с использованием [`Buffer.allocUnsafe()`] и устаревшего конструктора `new Buffer(size)`, только если `размер` меньше или равен `Buffer.poolSize >> 1` (floor [`Buffer.poolSize`] делится на два).

Использование этого пула с заранее выделенной внутренней памятью является ключевым различием между вызовом `Buffer.alloc(size, fill)` и `Buffer.allocUnsafe(size).fill(fill)`. Specifically, `Buffer.alloc(size, fill)` will *never* use the internal `Buffer` pool, while `Buffer.allocUnsafe(size).fill(fill)` *will* use the internal `Buffer` pool if `size` is less than or equal to half [`Buffer.poolSize`]. Разница незначительна, но может быть важной, когда приложение требует большей производительности, чем предоставляет [`Buffer.allocUnsafe()`].

### Метод Класса: Buffer.allocUnsafeSlow(size)
<!-- YAML
added: v5.12.0
-->

* `size` {integer} Желаемая длина нового `Buffer`.

Выделяет новый `Buffer` на `size` байтов. If the `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, a [`RangeError`] will be thrown. A zero-length `Buffer` will be created if `size` is 0.

Основная память экземпляра `Buffer`, созданного таким образом, *не инициализируется*. Содержимое вновь созданного `Buffer` неизвестно и *может содержать конфиденциальные данные*. Используйте [`buf.fill(0)`][`buf.fill()`], чтобы инициализировать такие экземпляры `Buffer` как ноль.

При использовании [`Buffer.allocUnsafe()`], чтобы выделить новые экземпляры `Buffer`, выделения до 4КБ являются по умолчанию нарезанными единым заранее выделенным `Buffer`. Это позволяет приложениям избежать garbage collection, что является издержками создания большого количества индивидуально выделенных экземпляров `Buffer`. Такой подход улучшает и производительность, и использование памяти, устраняя необходимость отслеживать и чистить как `Постоянные` объекты.

Но в случае, когда разработчику возможно потребуется сохранить небольшой блок памяти из пула на неопределенное количество времени, допустимо создать экземпляр `Buffer` вне пула, используя `Buffer.allocUnsafeSlow()`, затем скопировать соответствующие биты.

Пример:

```js
// Необходимо иметь несколько небольших блоков памяти 
const store = []; 

socket.on('readable', () => { 
  const data = socket.read();

   // Выделить сохраненные данные
  const sb = Buffer.allocUnsafeSlow(10);

   // Скопировать данные в новое выделение
   data.copy(sb, 0, 0, 10);

   store.push(sb);
 });
```

`Buffer.allocUnsafeSlow()` следует использовать только в качестве крайней меры *после того*, как разработчик обнаружил неоправданное хранение памяти в приложениях.

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

*Note*: For `'base64'` and `'hex'`, this function assumes valid input. Для строк, которые содержат данные non-Base64/Hex-encoded (например, пробел), возвратное значение может быть больше, чем длина `Buffer`, созданного из строки.

Пример:

```js
const str = '\u00bd + \u00bc = \u00be';

 // Prints: ½ + ¼ = ¾: 9 characters, 12 bytes
 console.log(`${str}: ${str.length} characters, ` +
             `${Buffer.byteLength(str, 'utf8')} bytes`);
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

Пример:

```js
const buf1 = Buffer.from('1234');
 const buf2 = Buffer.from('0123');
 const arr = [buf1, buf2];

// Печатает: [ <Buffer 30 31 32 33>, <Buffer 31 32 33 34> ]
 // (Этот результат равен: [buf2, buf1])
 console.log(arr.sort(Buffer.compare));
```

### Метод Класса: Buffer.concat(list[, totalLength])
<!-- YAML
added: v0.7.11
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The elements of `list` can now be `Uint8Array`s.
-->

* `list` {Array} List of `Buffer` or [`Uint8Array`] instances to concat.
* `totalLength` {integer} Общая длина экземпляров `Buffer` в `списке` при объединении.
* Возвращает: {Buffer}

Возвращает новый `Buffer`, который является результатом объединения всех экземпляров `Buffer` в `списке` вместе.

Если в списке нет элементов или если `totalLength` равна 0, тогда возвращается новый `Buffer` нулевой длины.

Если `totalLength` не указана, она высчитывается из экземпляров `Buffer` в `list`. Это вызывает дополнительный цикл, который должен быть выполнен, чтобы вычислить `totalLength`, поэтому быстрее предоставить длину, если она уже известна.

Если `totalLength` указана, она приводится в беззнаковое целое число. Если совмещенная длина `Buffer`s в `list` превышает `totalLength`, результат усекается до `totalLength`.

Например, создайте один `Buffer` из списка из трех экземпляров `Buffer`

```js
const buf1 = Buffer.alloc(10);
 const buf2 = Buffer.alloc(14);
 const buf3 = Buffer.alloc(18);
 const totalLength = buf1.length + buf2.length + buf3.length;

 // Печатает: 42
 console.log(totalLength);

 const bufA = Buffer.concat([buf1, buf2, buf3], totalLength);

 // Печатает: <Buffer 00 00 00 00 ...>
 console.log(bufA);

 // Печатает: 42 console.log(bufA.length);
```

### Метод Класса: Buffer.from(array)
<!-- YAML
added: v5.10.0
-->

* `массив` {Array}

Выделяется новый `Buffer` с помощью `array` октетов.

Пример:

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

Пример:

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Делит память с `arr`
const buf = Buffer.from(arr.buffer);

// Печатает: <Buffer 88 13 a0 0f>
console.log(buf);

// Меняет original Uint16Array также меняет Buffer
arr[1] = 6000;

// Печатает: <Buffer 88 13 70 17>
console.log(buf);
```

Необязательные аргументы `byteOffset` и `length` определяют диапазон памяти в пределах `arrayBuffer`, который будет совместно использоваться `Buffer`.

Пример:

```js
const ab = new ArrayBuffer(10);
 const buf = Buffer.from(ab, 0, 2);

 // Печатает: 2
 console.log(buf.length);
```

Если `arrayBuffer` не является [`ArrayBuffer`] или [`SharedArrayBuffer`] появится `TypeError`.

### Метод Класса: Buffer.from(buffer)
<!-- YAML
added: v5.10.0
-->

* `buffer` {Buffer|Uint8Array} Существующий `Buffer` или [`Uint8Array`], откуда копируются данные.

Копирует переданные данные `buffer` в новый экземпляр `Buffer`.

Пример:

```js
const buf1 = Buffer.from('buffer');
 const buf2 = Buffer.from(buf1);

 buf1[0] = 0x61;

 // Печатает: auffer
 console.log(buf1.toString());

 // Печатает: buffer console.log(buf2.toString());
```

Если `buffer` не является `Buffer`, возникает `TypeError`.

### Метод Класса: Buffer.from(string[, encoding])
<!-- YAML
added: v5.10.0
-->

* `string` {string} Строка для кодирования.
* `encoding` {string} Кодирование `string`. **Default:** `'utf8'`.

Создает новый `Buffer`, содержащий `string`. Параметр `encoding` определяет кодировку символов `строки`.

Примеры:

```js
const buf1 = Buffer.from('this is a tést');

 // Печатает: this is a tést
 console.log(buf1.toString());

 // Печатает: this is a tC)st
 console.log(buf1.toString('ascii'));

 const buf2 = Buffer.from('7468697320697320612074c3a97374', 'hex');

 // Печатает: this is a tést
 console.log(buf2.toString());
```

Возникает `TypeError`, если `string` не является строкой.

### Class Method: Buffer.from(object[, offsetOrEncoding[, length]])
<!-- YAML
added: v8.2.0
-->

* `object` {Object} An object supporting `Symbol.toPrimitive` or `valueOf()`
* `offsetOrEncoding` {number|string} A byte-offset or encoding, depending on the value returned either by `object.valueOf()` or `object[Symbol.toPrimitive]()`.
* `length` {number} A length, depending on the value returned either by `object.valueOf()` or `object[Symbol.toPrimitive]()`.

For objects whose `valueOf()` function returns a value not strictly equal to `object`, returns `Buffer.from(object.valueOf(), offsetOrEncoding, length)`.

Например:

```js
const buf = Buffer.from(new String('this is a test'));
// <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

For objects that support `Symbol.toPrimitive`, returns `Buffer.from(object[Symbol.toPrimitive](), offsetOrEncoding, length)`.

Например:

```js
class Foo {
  [Symbol.toPrimitive]() {
    return 'this is a test';
  }
}

const buf = Buffer.from(new Foo(), 'utf8');
// <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

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

Это количество байт, используемых для определения размера предварительно выделенных внутренних экземпляров `буфера` используемых для пула. Это значение может быть изменено.

### buf[index]
<!-- YAML
type: property
name: [index]
-->

Оператор индекса `[index]` может использоваться для получения и установки октета в позиции `index` в `buf`. Значения относятся к индивидуальным байтам, поэтому легальный диапазон значения находится между `0x00` и `0xFF` (hex) или `0` и `255` (десятичное).

This operator is inherited from `Uint8Array`, so its behavior on out-of-bounds access is the same as `UInt8Array` - that is, getting returns `undefined` and setting does nothing.

Например: Скопируйте строку ASCII в `Buffer`, один байт за раз

```js
const str = 'Node.js';
 const buf = Buffer.allocUnsafe(str.length);

 for (let i = 0; i < str.length; i++) {
   buf[i] = str.charCodeAt(i);
 }

 // Печатает: Node.js console.log(buf.toString('ascii'));
```

### buf.buffer

The `buffer` property references the underlying `ArrayBuffer` object based on which this Buffer object is created.

```js
const arrayBuffer = new ArrayBuffer(16);
const buffer = Buffer.from(arrayBuffer);

console.log(buffer.buffer === arrayBuffer);
// Prints: true
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
* `targetStart` {integer} Смещение в пределах `target`, где начинается сравнение. **Default:** `0`.
* `targetEnd` {integer} Смещение с `target`, где сравнение заканчивается (не включительно). **Default:** `target.length`.
* `sourceStart` {integer} Смещение в пределах `buf`, где начинается сравнение. **Default:** `0`.
* `sourceEnd` {integer} Смещение в пределах `buf`, где сравнение заканчивается (не включительно). **Default:** [`buf.length`].
* Возвращает: {integer}

Сравнивает `buf` с `target` и возвращает число, указывающее, приходит ли `buf` до, после, или так же как и `target` в порядке сортировки. Сравнение основывается на фактической последовательности байтов в каждом `Buffer`.

* `0` возвращается, если `target` является таким же как `buf`
* `1` возвращается, если `target` приходит *до* `buf` при сортировке.
* `-1` возвращается, если `target` приходит *после* `buf` при сортировке.

Примеры:

```js
const buf1 = Buffer.from('ABC');
const buf2 = Buffer.from('BCD');
const buf3 = Buffer.from('ABCD');

 // Печатает: 0
 console.log(buf1.compare(buf1));

 // Печатает: -1
 console.log(buf1.compare(buf2));

 // Печатает: -1
 console.log(buf1.compare(buf3));

 // Печатает: 1
 console.log(buf2.compare(buf1));

 // Печатает: 1
 console.log(buf2.compare(buf3));

 // Печатает: [ <Buffer 41 42 43>, <Buffer 41 42 43 44>, <Buffer 42 43 44> ]
 // (Этот результат равен: [buf1, buf3, buf2])
 console.log([buf1, buf2, buf3].sort(Buffer.compare));
```

Дополнительные `targetStart`, `targetEnd`, `sourceStart` и `sourceEnd` аргументы могут быть использованы для ограничения сравнения определенных диапазонов в пределах `target` и `buf`, соответственно.

Примеры:

```js
const buf1 = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);
 const buf2 = Buffer.from([5, 6, 7, 8, 9, 1, 2, 3, 4]);

 // Печатает: 0
 console.log(buf1.compare(buf2, 5, 9, 0, 4));

 // Печатает: -1
 console.log(buf1.compare(buf2, 0, 6, 4));

 // Печатает: 1
 console.log(buf1.compare(buf2, 5, 6, 5));
```

`RangeError` возникает, если: `targetStart < 0`, `sourceStart < 0`, `targetEnd > target.byteLength` или `sourceEnd > source.byteLength`.

### buf.copy(target[, targetStart[, sourceStart[, sourceEnd]]])
<!-- YAML
added: v0.1.90
-->

* `target` {Buffer|Uint8Array} `Buffer` или [`Uint8Array`] для копирования.
* `targetStart` {integer} Смещение в пределах `target`, где начинается копирование. **Default:** `0`.
* `sourceStart` {integer} Смещение в пределах `buf`, с которого начинается копирование. **Default:** `0`.
* `sourceEnd` {integer} Смещение в пределах `buf`, где завершается копирование (не включительно). **Default:** [`buf.length`].
* Возвращает: {integer} Количество скопированных байтов.

Копирует данные из региона `buf` в регион `target`, даже если `target` область памяти совпадает с `buf`.

Пример: Создать два экземпляра `Buffer`, `buf1` и `buf2` и скопировать `buf1` из байта 16 через байт 19 в `buf2`, начиная с 8-го байта в `buf2`

```js
const buf1 = Buffer.allocUnsafe(26);
 const buf2 = Buffer.allocUnsafe(26).fill('!');

 для (let i = 0; i < 26; i++) { 
  // 97 является десятичным значением ASCII для 'a'
   buf1[i] = i + 97; 
}
 buf1.copy(buf2, 8, 16, 20);

 // Печатает: !!!!!!!!qrst!!!!!!!!!!!!!
console.log(buf2.toString('ascii', 0, 25));
```

Пример: Создать один `Buffer` и скопировать данные из одного региона в смежный регион в пределах того же `Buffer`

```js
const buf = Buffer.allocUnsafe(26);

для (let i = 0; i < 26; i++) {
  // 97 является десятичным значением ASCII для 'a'
  buf[i] = i + 97;
}

buf.copy(buf, 0, 4, 10);

// Печатает: efghijghijklmnopqrstuvwxyz
console.log(buf.toString());
```

### buf.entries()
<!-- YAML
added: v1.1.0
-->

* Возвращает: {Iterator}

Создает и возвращает [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) `[index, byte]` пар из содержимого `buf`.

Пример: Внести все содержимое `Buffer`

```js
const buf = Buffer.from('buffer');

 // Печатает:
 // [0, 98]
 // [1, 117]
 // [2, 102]
 // [3, 102]
 // [4, 101]
 // [5, 114]
 для (const pair of buf.entries()) {
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
* Возвращает: {boolean}

Возвращает `true`, если и `buf`, и `otherBuffer` имеют точно такие же байты, иначе `false`.

Примеры:

```js
const buf1 = Buffer.from('ABC');
 const buf2 = Buffer.from('414243', 'hex');
 const buf3 = Buffer.from('ABCD');

 // Печатает: true
 console.log(buf1.equals(buf2));

 // Печатает: false
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

* `value` {string|Buffer|integer} Значение для заполнения `buf`.
* `offset` {integer} Количество байтов для пропуска перед началом заполнения `buf`. **Default:** `0`.
* `end` {integer} Где заполнение завершается `buf` (не включительно). **Default:** [`buf.length`].
* `encoding` {string} Если `value` является строкой, это кодирование. **Default:** `'utf8'`.
* Возвращает: {Buffer} Ссылка на `buf`.

Заполняет `buf` указанным `value`. Если `offset` и `end` не указаны, `buf` будет заполнен полностью. Это небольшое упрощение, которое позволит создавать и заполнять `Buffer` в одну строку.

Пример: Заполните `Buffer` символом ASCII `'h'`

```js
const b = Buffer.allocUnsafe(50).fill('h');

 // Печатает: hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh console.log(b.toString());
```

`value` приводится к значению `uint32`, если оно не является строкой или целым числом.

Если окончательная запись операции `fill()` попадает на многобайтовый символ, то записываются только первые байты этого символа, которые вписываются в `buf`.

Пример: Заполните `Buffer` двухбайтовым символом

```js
// Печатает: <Buffer c8 a2 c8>
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

* `value` {string|Buffer|integer} Что искать.
* `byteOffset` {integer} Где начать поиск в `buf`. **Default:** `0`.
* `encoding` {string} Если `value` является строкой, это кодирование. **Default:** `'utf8'`.
* Возвращает: {boolean} `true`, если `value` был найден в `buf`, в противном случае это `false`.

Эквивалентно [`buf.indexOf() !== -1`][`buf.indexOf()`].

Примеры:

```js
const buf = Buffer.from('this is a buffer');

// Печатает: true
console.log(buf.includes('this'));

// Печатает: true
console.log(buf.includes('is'));

// Печатает: true
console.log(buf.includes(Buffer.from('a buffer')));

// Печатает: true
// (97 is the decimal ASCII value for 'a')
console.log(buf.includes(97));

// Печатает: false
console.log(buf.includes(Buffer.from('a buffer example')));

// Печатает: true
console.log(buf.includes(Buffer.from('a buffer example').slice(0, 8)));

// Печатает: false
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

* `value` {string|Buffer|Uint8Array|integer} Что искать.
* `byteOffset` {integer} Где начать поиск в `buf`. **Default:** `0`.
* `encoding` {string} If `value` is a string, this is the encoding used to determine the binary representation of the string that will be searched for in `buf`. **Default:** `'utf8'`.
* Returns: {integer} The index of the first occurrence of `value` in `buf`, or `-1` if `buf` does not contain `value`.

Если `value`:

  * строка, `value` интерпретируется в соответствии с кодировкой символов в `encoding`.
  * a `Buffer` or [`Uint8Array`], `value` will be used in its entirety. To compare a partial `Buffer`, use [`buf.slice()`].
  * число, `value` будет интерпретироваться как 8-разрядное число без знака в диапазоне от `0` до `255`.

Примеры:

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

Если `value` не строка, номер или `Buffer`, этот метод выдаст `TypeError`. Если `value` является числом, оно будет приведено к действительному значению байта - целому числу между 0 и 255.

Если `byteOffset` не является числом, он будет приведен к числу. Любые аргументы, которые приводят к `NaN` или 0, такие как `{}`, `[]`, `null` или `undefined`, будут исследовать весь буфер. Это поведение соответствует [`String#indexOf()`].

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

Пример:

```js
const buf = Buffer.from('buffer');

// Печатает:
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

* `value` {string|Buffer|Uint8Array|integer} Что искать.
* `byteOffset` {integer} Где начать поиск в `buf`. **Default:** [`buf.length`]`- 1`.
* `encoding` {string} If `value` is a string, this is the encoding used to determine the binary representation of the string that will be searched for in `buf`. **Default:** `'utf8'`.
* Returns: {integer} The index of the last occurrence of `value` in `buf`, or `-1` if `buf` does not contain `value`.

Identical to [`buf.indexOf()`], except the last occurrence of `value` is found rather than the first occurrence.

Примеры:

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

Например: Создайте `Buffer` и запишите в него более короткую строку ASCII

```js
const buf = Buffer.alloc(1234);

// Печатает: 1234
console.log(buf.length);

buf.write('some string', 0, 'ascii');

// Печатает: 1234
console.log(buf.length);
```

Хотя свойство `length` не является неизменным, изменение значения `length` может привести к неопределенному и противоречивому поведению. Поэтому приложения, которые хотят изменить длину `Buffer`, должны рассматривать `length` только для чтения и использовать [`buf.slice()`] для создания нового `Buffer`.

Примеры:

```js
let buf = Buffer.allocUnsafe(10);

buf.write('abcdefghj', 0, 'ascii');

// Печатает: 10
console.log(buf.length);

buf = buf.slice(0, 5);

// Печатает: 5
console.log(buf.length);
```

### buf.parent
<!-- YAML
deprecated: v8.0.0
-->

> Stability: 0 - Deprecated: Use [`buf.buffer`] instead.

The `buf.parent` property is a deprecated alias for `buf.buffer`.

### buf.readDoubleBE(offset[, noAssert])
### buf.readDoubleLE(offset[, noAssert])
<!-- YAML
added: v0.11.15
-->

* `offset` {integer} Количество байтов, которое игнорируется перед началом чтения. Должно удовлетворять: `0 <= offset <= buf.length - 8`.
* `noAssert` {boolean} Пропустить проверку `offset`? **Default:** `false`
* Возвращает: {number}

Читает 64-битное число двойной точности из `buf` при заданном `offset` с указанным endian форматом (`readDoubleBE()` возвращает big endian, `readDoubleLE()` возвращает little endian).

Установка `noAssert` в `true` позволяет `offset` быть за пределами `buf`, но поведение в результате не определено.

Примеры:

```js
const buf = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]);

// Печатает: 8.20788039913184e-304
console.log(buf.readDoubleBE());

// Печатает: 5.447603722011605e-270
console.log(buf.readDoubleLE());

// Создает исключение: RangeError: Индекс вне диапазона
console.log(buf.readDoubleLE(1));

// Предупреждение: читает пройденный конец буфера!
// Это приведет к ошибке сегментации! Не делайте это!
console.log(buf.readDoubleLE(1, true));
```

### buf.readFloatBE(offset[, noAssert])
### buf.readFloatLE(offset[, noAssert])
<!-- YAML
added: v0.11.15
-->

* `offset` {integer} Количество байтов, которое игнорируется перед началом чтения. Должно удовлетворять: `0 <= offset <= buf.length - 4`.
* `noAssert` {boolean} Пропустить проверку `offset`? **Default:** `false`
* Возвращает: {number}

Считывает 32-битное число типа float из `buf` при заданном `offset` с указанным endian форматом (`readFloatBE()` возвращает big endian, `readFloatLE()` возвращает little endian).

Установка `noAssert` в `true` позволяет `offset` быть за пределами `buf`, но поведение в результате не определено.

Примеры:

```js
const buf = Buffer.from([1, 2, 3, 4]);

// Печатает: 2.387939260590663e-38
console.log(buf.readFloatBE());

// Печатает: 1.539989614439558e-36
console.log(buf.readFloatLE());

// Создает исключение: RangeError: Индекс вне диапазона
console.log(buf.readFloatLE(1));

// Предупреждение: читает пройденный конец буфера!
// Это приведет к ошибке сегментации! Не делайте это!
console.log(buf.readFloatLE(1, true));
```

### buf.readInt8(offset[, noAssert])
<!-- YAML
added: v0.5.0
-->

* `offset` {integer} Количество байтов, которое игнорируется перед началом чтения. Должно удовлетворять: `0 <= offset <= buf.length - 1`.
* `noAssert` {boolean} Пропустить проверку `offset`? **Default:** `false`
* Возвращает: {integer}

Считывает 8-битное целое число со знаком из `buf` с указанным `offset`.

Установка `noAssert` в `true` позволяет `offset` быть за пределами `buf`, но поведение в результате не определено.

Целые числа, считанные из `Buffer` интерпретируются как знаковые значения дополнения двух.

Примеры:

```js
const buf = Buffer.from([-1, 5]);

// Печатает: -1
console.log(buf.readInt8(0));

// Печатает: 5
console.log(buf.readInt8(1));

// Создает исключение: RangeError: Индекс вне диапазона
console.log(buf.readInt8(2));
```

### buf.readInt16BE(offset[, noAssert])
### buf.readInt16LE(offset[, noAssert])
<!-- YAML
added: v0.5.5
-->

* `offset` {integer} Количество байтов, которое игнорируется перед началом чтения. Должно удовлетворять: `0 <= offset <= buf.length - 2`.
* `noAssert` {boolean} Пропустить проверку `offset`? **Default:** `false`
* Возвращает: {integer}

Считывает 16-битное знаковое целое число из `buf` при заданном `offset` с указанным endian форматом (`readInt16BE()` возвращает big endian, `readInt16LE()` возвращает little endian).

Установка `noAssert` в `true` позволяет `offset` быть за пределами `buf`, но поведение в результате не определено.

Целые числа, считанные из `Buffer` интерпретируются как знаковые значения дополнения двух.

Примеры:

```js
const buf = Buffer.from([0, 5]);

// Печатает: 5
console.log(buf.readInt16BE());

// Печатает: 1280
console.log(buf.readInt16LE());

// Создает исключение: RangeError: Индекс вне диапазона
console.log(buf.readInt16LE(1));
```

### buf.readInt32BE(offset[, noAssert])
### buf.readInt32LE(offset[, noAssert])
<!-- YAML
added: v0.5.5
-->

* `offset` {integer} Количество байтов, которое игнорируется перед началом чтения. Должно удовлетворять: `0 <= offset <= buf.length - 4`.
* `noAssert` {boolean} Пропустить проверку `offset`? **Default:** `false`
* Возвращает: {integer}

Считывает 32-битное знаковое целое число из `buf` при заданном `offset` с указанным endian форматом (`readInt32BE()` возвращает big endian, `readInt32LE()` возвращает little endian).

Установка `noAssert` в `true` позволяет `offset` быть за пределами `buf`, но поведение в результате не определено.

Целые числа, считанные из `Buffer` интерпретируются как знаковые значения дополнения двух.

Примеры:

```js
const buf = Buffer.from([0, 0, 0, 5]);

// Печатает: 5
console.log(buf.readInt32BE());

// Печатает: 83886080
console.log(buf.readInt32LE());

// Создает исключение: RangeError: Индекс вне диапазона
console.log(buf.readInt32LE(1));
```

### buf.readIntBE(offset, byteLength[, noAssert])
### buf.readIntLE(offset, byteLength[, noAssert])
<!-- YAML
added: v0.11.15
-->

* `offset` {integer} Количество байтов, которое игнорируется перед началом чтения. Должно удовлетворять: `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Количество байтов для чтения. Должно удовлетворять: `0 < byteLength <= 6`.
* `noAssert` {boolean} Пропустить проверку `offset` и `byteLength`? **По умолчанию:** `false`.
* Возвращает: {integer}

Считывает количество байтов `byteLength` из `buf` с указанным `offset` и интерпретирует результат как знаковое значение дополнения двух. Поддерживает точность до 48 бит.

Установка `noAssert` в `true` позволяет `offset` быть за пределами `buf`, но поведение в результате не определено.

Примеры:

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab]);

// Печатает: -546f87a9cbee
console.log(buf.readIntLE(0, 6).toString(16));

// Печатает: 1234567890ab
console.log(buf.readIntBE(0, 6).toString(16));

// Создает исключение: RangeError: Индекс вне диапазона
console.log(buf.readIntBE(1, 6).toString(16));
```

### buf.readUInt8(offset[, noAssert])
<!-- YAML
added: v0.5.0
-->

* `offset` {integer} Количество байтов, которое игнорируется перед началом чтения. Должно удовлетворять: `0 <= offset <= buf.length - 1`.
* `noAssert` {boolean} Пропустить проверку `offset`? **По умолчанию:** `false`
* Возвращает: {integer}

Считывает 8-битное целое число без знака из `buf` с указанным `offset`.

Установка `noAssert` в `true` позволяет `offset` быть за пределами `buf`, но поведение в результате не определено.

Примеры:

```js
const buf = Buffer.from([1, -2]);

// Печатает: 1
console.log(buf.readUInt8(0));

// Печатает: 254
console.log(buf.readUInt8(1));

// Создает исключение: RangeError: Индекс вне диапазона
console.log(buf.readUInt8(2));
```

### buf.readUInt16BE(offset[, noAssert])
### buf.readUInt16LE(offset[, noAssert])
<!-- YAML
added: v0.5.5
-->

* `offset` {integer} Количество байтов, которое игнорируется перед началом чтения. Должно удовлетворять: `0 <= offset <= buf.length - 2`.
* `noAssert` {boolean} Пропустить проверку `offset`? **По умолчанию:** `false`
* Возвращает: {integer}

Считывает 16-битное целое число без знака из `buf` при заданном `offset` с указанным endian форматом (`readUInt16BE()` возвращает big endian, `readUInt16LE()` возвращает little endian).

Установка `noAssert` в `true` позволяет `offset` быть за пределами `buf`, но поведение в результате не определено.

Примеры:

```js
const buf = Buffer.from([0x12, 0x34, 0x56]);

// Печатает: 1234
console.log(buf.readUInt16BE(0).toString(16));

// Печатает: 3412
console.log(buf.readUInt16LE(0).toString(16));

// Печатает: 3456
console.log(buf.readUInt16BE(1).toString(16));

// Печатает: 5634
console.log(buf.readUInt16LE(1).toString(16));

// Создает исключение: RangeError: Индекс вне диапазона
console.log(buf.readUInt16LE(2).toString(16));
```

### buf.readUInt32BE(offset[, noAssert])
### buf.readUInt32LE(offset[, noAssert])
<!-- YAML
added: v0.5.5
-->

* `offset` {integer} Количество байтов, которое игнорируется перед началом чтения. Должно удовлетворять: `0 <= offset <= buf.length - 4`.
* `noAssert` {boolean} Пропустить проверку `offset`? **По умолчанию:** `false`
* Возвращает: {integer}

Считывает 32-битное целое число без знака из `buf` при заданном `offset` с указанным endian форматом (`readUInt32BE()` возвращает big endian, `readUInt32LE()` возвращает little endian).

Установка `noAssert` в `true` позволяет `offset` быть за пределами `buf`, но поведение в результате не определено.

Примеры:

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78]);

// Печатает: 12345678
console.log(buf.readUInt32BE(0).toString(16));

// Печатает: 78563412
console.log(buf.readUInt32LE(0).toString(16));

// Создает исключение: RangeError: Индекс вне диапазона
console.log(buf.readUInt32LE(1).toString(16));
```

### buf.readUIntBE(offset, byteLength[, noAssert])
### buf.readUIntLE(offset, byteLength[, noAssert])
<!-- YAML
added: v0.11.15
-->

* `offset` {integer} Количество байтов, которое игнорируется перед началом чтения. Должно удовлетворять: `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Количество байтов для чтения. Должно удовлетворять: `0 < byteLength <= 6`.
* `noAssert` {boolean} Пропустить проверку `offset` и `byteLength`? **По умолчанию:** `false`
* Возвращает: {integer}

Считывает количество байтов `byteLength` из `buf` при заданном `offset` и интерпретирует результат как целое число без знака. Поддерживает точность до 48 бит.

Установка `noAssert` в `true` позволяет `offset` быть за пределами `buf`, но поведение в результате не определено.

Примеры:

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab]);

// Печатает: 1234567890ab
console.log(buf.readUIntBE(0, 6).toString(16));

// Печатает: ab9078563412
console.log(buf.readUIntLE(0, 6).toString(16));

// Создает исключение: RangeError: Индекс вне диапазона
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

* `start` {integer} Где начнется новый `Buffer`. **Default:** `0`.
* `end` {integer} Где закончится новый `Buffer` (не включительно). **Default:** [`buf.length`].
* Возвращает: {Buffer}

Возвращает новый `Buffer`, который ссылается на ту же память, что и оригинал, но смещен и ограничен индексами `start` и `end`.

Specifying `end` greater than [`buf.length`] will return the same result as that of `end` equal to [`buf.length`].

*Note*: Modifying the new `Buffer` slice will modify the memory in the original `Buffer` because the allocated memory of the two objects overlap.

Например: Создайте `Buffer` с алфавитом ASCII, выберите сегмент и измените байт из оригинального `Buffer`

```js
const buf1 = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 is the decimal ASCII value for 'a'
  buf1[i] = i + 97;
}

const buf2 = buf1.slice(0, 3);

// Печатает: abc
console.log(buf2.toString('ascii', 0, buf2.length));

buf1[0] = 33;

// Печатает: !bc
console.log(buf2.toString('ascii', 0, buf2.length));
```

Задание негативных индексов приводит к тому, что сегмент генерируется относительно конца `buf`, а не начала.

Примеры:

```js
const buf = Buffer.from('buffer');

// Печатает: buffe
// (Эквивалентно buf.slice(0, 5))
console.log(buf.slice(-6, -1).toString());

// Печатает: buff
// (Эквивалентно buf.slice(0, 4))
console.log(buf.slice(-6, -2).toString());

// Печатает: uff
// (Эквивалентно buf.slice(1, 4))
console.log(buf.slice(-5, -2).toString());
```

### buf.swap16()
<!-- YAML
added: v5.10.0
-->

* Возвращает: {Buffer} Ссылка на `buf`.

Interprets `buf` as an array of unsigned 16-bit integers and swaps the byte order *in-place*. Выдает `RangeError`, если [`buf.length`] не кратно 2.

Примеры:

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

// Печатает: <Buffer 01 02 03 04 05 06 07 08>
console.log(buf1);

buf1.swap16();

// Печатает: <Buffer 02 01 04 03 06 05 08 07>
console.log(buf1);

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

// Создает исключение: RangeError: Размер буфера должен быть кратным 16
buf2.swap16();
```

### buf.swap32()
<!-- YAML
added: v5.10.0
-->

* Возвращает: {Buffer} Ссылка на `buf`.

Interprets `buf` as an array of unsigned 32-bit integers and swaps the byte order *in-place*. Выдает `RangeError`, если [`buf.length`] не кратно 4.

Примеры:

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

// Печатает: <Buffer 01 02 03 04 05 06 07 08>
console.log(buf1);

buf1.swap32();

// Печатает: <Buffer 04 03 02 01 08 07 06 05>
console.log(buf1);

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

// Создает исключение: RangeError: Размер буфера должен быть кратным 32 бит
buf2.swap32();
```

### buf.swap64()
<!-- YAML
added: v6.3.0
-->

* Возвращает: {Buffer} Ссылка на `buf`.

Interprets `buf` as an array of 64-bit numbers and swaps the byte order *in-place*. Выдает `RangeError`, если`RangeError` не кратно 8.

Примеры:

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

// печатает: <Buffer 01 02 03 04 05 06 07 08>
console.log(buf1);

buf1.swap64();

// Печатает: <Buffer 08 07 06 05 04 03 02 01>
console.log(buf1);

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

// Создает исключение: RangeError: Размер буфера должен быть кратным 64 бит
buf2.swap64();
```

Обратите внимание, что JavaScript не может кодировать 64-битные целые числа. Этот метод предназначен для работы с 64-битными числами типа float.

### buf.toJSON()
<!-- YAML
added: v0.9.2
-->

* Возвращает: {Object}

Возвращает образ JSON экземпляра `buf`. [`JSON.stringify()`] неявно вызывает эту функцию, когда преобразует в строку экземпляр `Buffer`.

Пример:

```js
const buf = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5]);
const json = JSON.stringify(buf);

// Печатает: {"type":"Buffer","data":[1,2,3,4,5]}
console.log(json);

const copy = JSON.parse(json, (key, value) => {
  return value && value.type === 'Buffer' ?
    Buffer.from(value.data) :
    value;
});

// Печатает: &lt;Buffer 01 02 03 04 05&gt;
console.log(copy);
```

### buf.toString([encoding[, start[, end]]])
<!-- YAML
added: v0.1.90
-->

* `encoding` {string} Кодировка символов для декодирования. **Default:** `'utf8'`.
* `start` {integer} Смещение байта, с которого начинается декодирование. **Default:** `0`.
* `end` {integer} Байт смещения, при котором останавливается декодирование (не включительно). **Default:** [`buf.length`].
* Возвращает: {string}

Декодирует `buf` в строку в соответствии с кодировкой символов, указанной в `encoding`. `start` и `end` могут быть переданы для декодирования только подмножества `buf`.

The maximum length of a string instance (in UTF-16 code units) is available as [`buffer.constants.MAX_STRING_LENGTH`][].

Примеры:

```js
const buf1 = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 - десятичное значение ASCII для 'a'
  buf1[i] = i + 97;
}

// Печатает: abcdefghijklmnopqrstuvwxyz
console.log(buf1.toString('ascii'));

// Печатает: abcde
console.log(buf1.toString('ascii', 0, 5));

const buf2 = Buffer.from('tést');

// Печатает: 74c3a97374
console.log(buf2.toString('hex'));

// Печатает: té
console.log(buf2.toString('utf8', 0, 3));

// Печатает: té
console.log(buf2.toString(undefined, 0, 3));
```

### buf.values()
<!-- YAML
added: v1.1.0
-->

* Возвращает: {Iterator}

Создает и возвращает [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) для значений `buf` (байты). Эта функция вызывается автоматически, когда `Buffer` используется в утверждении `for..of`.

Примеры:

```js
const buf = Buffer.from('buffer');

// Печатает:
//   98
//   117
//   102
//   102
//   101
//   114
for (const value of buf.values()) {
  console.log(value);
}

// Печатает:
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

* `string` {string} Строка для записи в `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи `string`. **Default:** `0`.
* `length` {integer} Количество байтов для записи. **По умолчанию:** `buf.length - offset`.
* `encoding` {string} Кодировка символов `string`. **Default:** `'utf8'`.
* Возвращает: {integer} Количество записанных байтов.

Записывает `string` в `buf` с `offset` в соответствии с кодировкой символов в `encoding`. Параметр `length` - это количество байтов для записи. Если `buf` не содержит достаточно места для размещения всей строки, будет записана только часть `string`. Однако частично закодированные символы не будут записаны.

Пример:

```js
const buf = Buffer.allocUnsafe(256);

const len = buf.write('\u00bd + \u00bc = \u00be', 0);

// Печатает: 12 bytes: ½ + ¼ = ¾
console.log(`${len} bytes: ${buf.toString('utf8', 0, len)}`);
```

### buf.writeDoubleBE(value, offset[, noAssert])
### buf.writeDoubleLE(value, offset[, noAssert])
<!-- YAML
added: v0.11.15
-->

* `value` {number} Количество для записи в `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи. Должно удовлетворять: `0 <= offset <= buf.length - 8`.
* `noAssert` {boolean} Пропустить проверку `value` и `offset`? **По умолчанию:** `false`
* Возвращает: {integer} `offset` плюс количество записанных байтов.

Записывает `value` в `buf` с заданным `offset` с указанным endian форматом (`writeDoubleBE()` записывает big endian, `writeDoubleLE()` записывает little endian). `value` *должно* быть допустимым 64-битным числом двойной точности. Поведение не определено, когда `value` отличается от 64-битного числа двойной точности.

Установка `noAssert` в `true` позволяет закодированной форме `value` выходить за пределы `buf`, но поведение в результате не определено.

Примеры:

```js
const buf = Buffer.allocUnsafe(8);

buf.writeDoubleBE(0xdeadbeefcafebabe, 0);

// Печатает: &lt;Buffer 43 eb d5 b7 dd f9 5f d7&gt;
console.log(buf);

buf.writeDoubleLE(0xdeadbeefcafebabe, 0);

// Печатает: &lt;Buffer d7 5f f9 dd b7 d5 eb 43&gt;
console.log(buf);
```

### buf.writeFloatBE(value, offset[, noAssert])
### buf.writeFloatLE(value, offset[, noAssert])
<!-- YAML
added: v0.11.15
-->

* `value` {number} Количество для записи в `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи. Должно удовлетворять: `0 <= offset <= buf.length - 4`.
* `noAssert` {boolean} Пропустить проверку `value` и `offset`? **По умолчанию:** `false`
* Возвращает: {integer} `offset` плюс количество записанных байтов.

Записывает `value` в `buf` с заданным `offset` с указанным endian форматом (`writeFloatBE()` записывает big endian, `writeFloatLE()` записывает little endian). `value` *должно* быть допустимым 32-битным числом типа float. Поведение не определено, когда `value` отличается от 32-битного числа типа float.

Установка `noAssert` в `true` позволяет закодированной форме `value` выходить за пределы `buf`, но поведение в результате не определено.

Примеры:

```js
const buf = Buffer.allocUnsafe(4);

buf.writeFloatBE(0xcafebabe, 0);

// Печатает: &lt;Buffer 4f 4a fe bb&gt;
console.log(buf);

buf.writeFloatLE(0xcafebabe, 0);

// Печатает: &lt;Buffer bb fe 4a 4f&gt;
console.log(buf);
```

### buf.writeInt8(value, offset[, noAssert])
<!-- YAML
added: v0.5.0
-->

* `value` {integer} Количество для записи в `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи. Должно удовлетворять: `0 <= offset <= buf.length - 1`.
* `noAssert` {boolean} Пропустить проверку `value` и `offset`? **По умолчанию:** `false`
* Возвращает: {integer} `offset` плюс количество записанных байтов.

Записывает `value` в `buf` с указанным `offset`. `value` *должно* быть допустимым 8-битным целым знаковым числом. Поведение не определено, когда `value` отличается от 8-битного целого знакового числа.

Установка `noAssert` в `true` позволяет закодированной форме `value` выходить за пределы `buf`, но поведение в результате не определено.

`value` интерпретируется и записывается как знаковое целое число дополнения двух.

Примеры:

```js
const buf = Buffer.allocUnsafe(2);

buf.writeInt8(2, 0);
buf.writeInt8(-2, 1);

// Печатает: &lt;Buffer 02 fe&gt;
console.log(buf);
```

### buf.writeInt16BE(value, offset[, noAssert])
### buf.writeInt16LE(value, offset[, noAssert])
<!-- YAML
added: v0.5.5
-->

* `value` {integer} Количество для записи в `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи. Должно удовлетворять: `0 <= offset <= buf.length - 2`.
* `noAssert` {boolean} Пропустить проверку `value` и `offset`? **По умолчанию:** `false`
* Возвращает: {integer} `offset` плюс количество записанных байтов.

Записывает `value` в `buf` с заданным `offset` с указанным endian форматом (`writeInt16BE()` записывает big endian, `writeInt16LE()` записывает little endian). `value` *должно* быть допустимым 16-битным знаковым целым числом. Поведение не определено, когда `value` отличается от 16-битного знакового целого числа.

Установка `noAssert` в `true` позволяет закодированной форме `value` выходить за пределы `buf`, но поведение в результате не определено.

`value` интерпретируется и записывается как знаковое целое число дополнения двух.

Примеры:

```js
const buf = Buffer.allocUnsafe(4);

buf.writeInt16BE(0x0102, 0);
buf.writeInt16LE(0x0304, 2);

// Печатает: &lt;Buffer 01 02 04 03&gt;
console.log(buf);
```

### buf.writeInt32BE(value, offset[, noAssert])
### buf.writeInt32LE(value, offset[, noAssert])
<!-- YAML
added: v0.5.5
-->

* `value` {integer} Количество для записи в `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи. Должно удовлетворять: `0 <= offset <= buf.length - 4`.
* `noAssert` {boolean} Пропустить проверку `value` и `offset`? **По умолчанию:** `false`
* Возвращает: {integer} `offset` плюс количество записанных байтов.

Записывает `value` в `buf` с заданным `offset` с указанным endian форматом (`writeInt32BE()` записывает big endian, `writeInt32LE()` записывает little endian). `value` *должно* быть допустимым 32-битным знаковым целым числом. Поведение не определено, когда `value` отличается от 32-битного знакового целого числа.

Установка `noAssert` в `true` позволяет закодированной форме `value` выходить за пределы `buf`, но поведение в результате не определено.

`value` интерпретируется и записывается как знаковое целое число дополнения двух.

Примеры:

```js
const buf = Buffer.allocUnsafe(8);

buf.writeInt32BE(0x01020304, 0);
buf.writeInt32LE(0x05060708, 4);

// Печатает: &lt;Buffer 01 02 03 04 08 07 06 05&gt;
console.log(buf);
```

### buf.writeIntBE(value, offset, byteLength[, noAssert])
### buf.writeIntLE(value, offset, byteLength[, noAssert])
<!-- YAML
added: v0.11.15
-->

* `value` {integer} Количество для записи в `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи. Должно удовлетворять: `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Количество байтов для записи. Должно удовлетворять: `0 < byteLength <= 6`.
* `noAssert` {boolean} Пропустить проверку `value`, `offset` и `byteLength`? **По умолчанию:** `false`
* Возвращает: {integer} `offset` плюс количество записанных байтов.

Записывает `byteLength` байты `value` в `buf` с указанным `offset`. Поддерживает точность до 48 бит. Поведение не определено, когда `value` отличается от знакового целого числа.

Установка `noAssert` в `true` позволяет закодированной форме `value` выходить за пределы `buf`, но поведение в результате не определено.

Примеры:

```js
const buf = Buffer.allocUnsafe(6);

buf.writeIntBE(0x1234567890ab, 0, 6);

// Печатает: &lt;Buffer 12 34 56 78 90 ab&gt;
console.log(buf);

buf.writeIntLE(0x1234567890ab, 0, 6);

// Печатает: &lt;Buffer ab 90 78 56 34 12&gt;
console.log(buf);
```

### buf.writeUInt8(value, offset[, noAssert])
<!-- YAML
added: v0.5.0
-->

* `value` {integer} Количество для записи в `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи. Должно удовлетворять: `0 <= offset <= buf.length - 1`.
* `noAssert` {boolean} Пропустить проверку `value` и `offset`? **По умолчанию:** `false`
* Возвращает: {integer} `offset` плюс количество записанных байтов.

Записывает `value` в `buf` с указанным `offset`. `value` *должно* быть допустимым 8-битным целым числом без знака. Поведение не определено, когда `value` отличается от 8-битного целого числа без знака.

Установка `noAssert` в `true` позволяет закодированной форме `value` выходить за пределы `buf`, но поведение в результате не определено.

Примеры:

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt8(0x3, 0);
buf.writeUInt8(0x4, 1);
buf.writeUInt8(0x23, 2);
buf.writeUInt8(0x42, 3);

// Печатает: &lt;Buffer 03 04 23 42&gt;
console.log(buf);
```

### buf.writeUInt16BE(value, offset[, noAssert])
### buf.writeUInt16LE(value, offset[, noAssert])
<!-- YAML
added: v0.5.5
-->

* `value` {integer} Количество для записи в `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи. Должно удовлетворять: `0 <= offset <= buf.length - 2`.
* `noAssert` {boolean} Пропустить проверку `value` и `offset`? **По умолчанию:** `false`
* Возвращает: {integer} `offset` плюс количество записанных байтов.

Записывает `value` в `buf` с заданным `offset` с указанным endian форматом (`writeUInt16BE()` записывает big endian, `writeUInt16LE()` записывает little endian). `value` должно быть допустимым 16-битным целым числом без знака. Поведение не определено, когда `value` отличается от 16-битного целого числа без знака.

Установка `noAssert` в `true` позволяет закодированной форме `value` выходить за пределы `buf`, но поведение в результате не определено.

Примеры:

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt16BE(0xdead, 0);
buf.writeUInt16BE(0xbeef, 2);

// Печатает: &lt;Buffer de ad be ef&gt;
console.log(buf);

buf.writeUInt16LE(0xdead, 0);
buf.writeUInt16LE(0xbeef, 2);

// Печатает: &lt;Buffer ad de ef be&gt;
console.log(buf);
```

### buf.writeUInt32BE(value, offset[, noAssert])
### buf.writeUInt32LE(value, offset[, noAssert])
<!-- YAML
added: v0.5.5
-->

* `value` {integer} Количество для записи в `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи. Должно удовлетворять: `0 <= offset <= buf.length - 4`.
* `noAssert` {boolean} Пропустить проверку `value` и `offset`? **По умолчанию:** `false`
* Возвращает: {integer} `offset` плюс количество записанных байтов.

Записывает `value` в `buf` с заданным `offset` с указанным endian форматом (`writeUInt32BE()` записывает big endian, `writeUInt32LE()` записывает little endian). `value` должно быть допустимым 32-битным целым числом без знака. Поведение не определено, когда `value` отличается от 32-битного целого числа без знака.

Установка `noAssert` в `true` позволяет закодированной форме `value` выходить за пределы `buf`, но поведение в результате не определено.

Примеры:

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt32BE(0xfeedface, 0);

// Печатает: &lt;Buffer fe ed fa ce&gt;
console.log(buf);

buf.writeUInt32LE(0xfeedface, 0);

// Печатает: &lt;Buffer ce fa ed fe&gt;
console.log(buf);
```

### buf.writeUIntBE(value, offset, byteLength[, noAssert])
### buf.writeUIntLE(value, offset, byteLength[, noAssert])
<!-- YAML
added: v0.5.5
-->

* `value` {integer} Количество для записи в `buf`.
* `offset` {integer} Количество байтов, которое нужно пропустить перед началом записи. Должно удовлетворять: `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Количество байтов для записи. Должно удовлетворять: `0 < byteLength <= 6`.
* `noAssert` {boolean} Пропустить проверку `value`, `offset` и `byteLength`? **По умолчанию:** `false`.
* Возвращает: {integer} `offset` плюс количество записанных байтов.

Записывает `byteLength` байты `value` в `buf` с указанным `offset`. Поддерживает точность до 48 бит. Поведение не определено, когда `value` отличается от целого числа без знака.

Установка `noAssert` в `true` позволяет закодированной форме `value` выходить за пределы `buf`, но поведение в результате не определено.

Примеры:

```js
const buf = Buffer.allocUnsafe(6);

buf.writeUIntBE(0x1234567890ab, 0, 6);

// Печатает: &lt;Buffer 12 34 56 78 90 ab&gt;
console.log(buf);

buf.writeUIntLE(0x1234567890ab, 0, 6);

// Печатает: &lt;Buffer ab 90 78 56 34 12&gt;
console.log(buf);
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

An alias for [`buffer.constants.MAX_LENGTH`][]

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

Пример:

```js
// Нужно сохранить несколько маленьких кусочков памяти
const store = [];

socket.on('readable', () => {
  const data = socket.read();

  // Распределить для сохраненных данных
  const sb = SlowBuffer(10);

  // Копируем данные в новое распределение
  data.copy(sb, 0, 0, 10);

  store.push(sb);
});
```

Использовать `SlowBuffer` нужно только в качестве крайней меры *после того*, как разработчик обнаружил чрезмерное удержание памяти в своих приложениях.

### new SlowBuffer(size)
<!-- YAML
deprecated: v6.0.0
-->

> Стабильность: 0 - Устарело: Вместо этого используйте [`Buffer.allocUnsafeSlow()`].

* `size` {integer} Желаемая длина нового `SlowBuffer`.

Выделяет новый `Buffer` на `size` байтов. If the `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, a [`RangeError`] will be thrown. A zero-length `Buffer` will be created if `size` is 0.

Базовая память для экземпляров `SlowBuffer` *не инициализирована*. The contents of a newly created `SlowBuffer` are unknown and may contain sensitive data. Используйте [`buf.fill(0)`][`buf.fill()`] для инициализации `SlowBuffer` до нулей.

Пример:

```js
const { SlowBuffer } = require('buffer');

const buf = new SlowBuffer(5);

// Prints: (contents may vary): <Buffer 78 e0 82 02 01>
console.log(buf);

buf.fill(0);

// Prints: <Buffer 00 00 00 00 00>
console.log(buf);
```

## Buffer Constants
<!-- YAML
added: 8.2.0
-->

Note that `buffer.constants` is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

### buffer.constants.MAX_LENGTH
<!-- YAML
added: 8.2.0
-->

* {integer} Наибольший размер для одного экземпляра `Buffer`.

В 32-битных архитектурах это значение равно `(2^30)-1` (~1GB). В 64-битных архитектурах это значение равно `(2^31)-1` (~2GB).

This value is also available as [`buffer.kMaxLength`][].

### buffer.constants.MAX_STRING_LENGTH
<!-- YAML
added: 8.2.0
-->

* {integer} The largest length allowed for a single `string` instance.

Represents the largest `length` that a `string` primitive can have, counted in UTF-16 code units.

This value may depend on the JS engine that is being used.
