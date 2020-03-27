# Buffer

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Prima dell'introduzione di [`TypedArray`], il linguaggio JavaScript non aveva alcun meccanismo per leggere o manipolare stream di dati binari. La classe `Buffer` è stata introdotta come parte dell'API Node.js per consentire l'interazione con gli octet stream negli TCP stream, nelle operazioni del file system ed in altri contesti.

Con [`TypedArray`] ora disponibile, la classe `Buffer` implementa l'API [`Uint8Array`] in modo che sia più ottimizzato e adatto per Node.js.

Le istanze della classe `Buffer` sono simili agli array di numeri interi ma corrispondono ad allocazioni di memoria raw di dimensioni fisse all'esterno di V8 heap. La dimensione del `Buffer` viene stabilita quando viene creato e non può essere modificata.

La classe `Buffer` rientra nel global scope, il che rende improbabile la necessità di utilizzare mai `require('buffer').Buffer`.

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
* Passando una stringa, un array oppure un `Buffer` come primo argomento copiava i dati dell'object passato all'interno del `Buffer`.
* Passando un [`ArrayBuffer`] od un [`SharedArrayBuffer`] restituiva un `Buffer` che condivideva la memoria allocata con l'array buffer specificato.

Because the behavior of `new Buffer()` changes significantly based on the type of value passed as the first argument, applications that do not properly validate the input arguments passed to `new Buffer()`, or that fail to appropriately initialize newly allocated `Buffer` content, can inadvertently introduce security and reliability issues into their code.

To make the creation of `Buffer` instances more reliable and less error prone, the various forms of the `new Buffer()` constructor have been **deprecated** and replaced by separate `Buffer.from()`, [`Buffer.alloc()`], and [`Buffer.allocUnsafe()`] methods.

*Gli sviluppatori dovrebbero migrare tutti gli usi esistenti dei constructor `new Buffer()` su una di queste nuove API.*

* [`Buffer.from(array)`] returns a new `Buffer` containing a *copy* of the provided octets.
* [`Buffer.from(arrayBuffer[, byteOffset [, length]])`][`Buffer.from(arrayBuffer)`] returns a new `Buffer` that *shares* the same allocated memory as the given [`ArrayBuffer`].
* [`Buffer.from(buffer)`] returns a new `Buffer` containing a *copy* of the contents of the given `Buffer`.
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`] returns a new `Buffer` containing a *copy* of the provided string.
* [`Buffer.alloc(size[, fill[, encoding]])`][`Buffer.alloc()`] returns a "filled" `Buffer` instance of the specified size. This method can be significantly slower than [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] but ensures that newly created `Buffer` instances never contain old and potentially sensitive data.
* [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] and [`Buffer.allocUnsafeSlow(size)`][`Buffer.allocUnsafeSlow()`] each return a new `Buffer` of the specified `size` whose content *must* be initialized using either [`buf.fill(0)`][`buf.fill()`] or written to completely.

Le istanze di `Buffer` restituite da [`Buffer.allocUnsafe()`] *potrebbero* essere allocate su un pool di memoria interno condiviso se `size` è minore o uguale a metà di [`Buffer.poolSize`]. Le istanze restituite da [`Buffer.allocUnsafeSlow()`] non usano *mai* il pool di memoria interno condiviso.

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

Quando si chiamano [`Buffer.allocUnsafe()`] e [`Buffer.allocUnsafeSlow()`], il segmento della memoria allocata *non è inizializzato* (non è azzerato). Mentre questo design rende l'allocazione della memoria abbastanza veloce, il segmento di memoria allocato potrebbe contenere vecchi dati potenzialmente sensibili. L'utilizzo di un `Buffer` creato da [`Buffer.allocUnsafe()`] senza sovrascrivere *completamente* la memoria può portare alla fuoriuscita di questi vecchi dati quando viene letta la memoria di `Buffer`.

Sebbene ci siano chiari vantaggi in termini di prestazioni nell'uso di [`Buffer.allocUnsafe()`], è *necessario* prestare particolare attenzione per evitare l'introduzione di possibili vulnerabilità di sicurezza all'interno di un'applicazione.

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

* `'ascii'` - Solo per dati ASCII a 7 bit. Questa codifica è veloce e decodificherà il bit più alto se impostata.

* `'utf8'` - Caratteri Unicode codificati in multibyte. Molte pagine web ed altri formati di documenti utilizzano UTF-8.

* `'utf16le'` - 2 o 4 byte, caratteri Unicode codificati in little-endian. Sono supportate coppie di surrogati (da U+10000 a U+10FFFF).

* `'ucs2'` - Alias di `'utf16le'`.

* `'base64'` - Codifica base64. Quando si crea un `Buffer` da una stringa, questa codifica accetterà anche correttamente "L'Alfabeto Sicuro per l'URL ed il Filename" come specificato in [RFC4648, Section 5](https://tools.ietf.org/html/rfc4648#section-5).

* `'latin1'` - Un modo per codificare il `Buffer` in una stringa codificata ad un byte (definita da IANA in [RFC1345](https://tools.ietf.org/html/rfc1345), pagina 63, come il blocco di supplemento Latin-1 ed i codici di controllo C0/C1).

* `'binary'` - Alias di `'latin1'`.

* `'hex'` - Codifica ogni byte come due caratteri esadecimali.

*Note*: Today's browsers follow the [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/) which aliases both `'latin1'` and `'ISO-8859-1'` to `'win-1252'`. Ciò significa che mentre si fa qualcosa come `http.get()`, se il set di caratteri restituito è uno di quelli elencati nella specifica WHATWG è possibile che il server abbia effettivamente restituito dati con codifica `'win-1252'` e l'utilizzo della codifica `'latin1'` potrebbe decodificare i caratteri in modo errato.

## Buffer e TypedArray
<!-- YAML
changes:
  - version: v3.0.0
    pr-url: https://github.com/nodejs/node/pull/2002
    description: The `Buffer`s class now inherits from `Uint8Array`.
-->

Le istanze di `Buffer` sono anche istanze di [`Uint8Array`]. Tuttavia, esistono sottili incompatibilità con [`TypedArray`]. Ad esempio, mentre [`ArrayBuffer#slice()`] crea una copia dello slice, l'implementazione di [`Buffer#slice()`][`buf.slice()`] crea una visuale sul `Buffer` esistente senza copiare, rendendo così [`Buffer#slice()`][`buf.slice()`] molto più efficiente.

È anche possibile creare nuove istanze di [`TypedArray`] da un `Buffer` con le seguenti raccomandazioni:

1. La memoria del `Buffer` object viene copiata su [`TypedArray`], non condivisa.

2. La memoria del `Buffer` object viene interpretata come un array di elementi distinti e non come un byte array di tipo specifico. Cioè, `new Uint32Array(Buffer.from([1, 2, 3, 4]))` crea un [`Uint32Array`] con 4 elementi quali `[1, 2, 3, 4]`, anziché un [`Uint32Array`] con un singolo elemento il quale può essere `[0x1020304]` oppure `[0x4030201]`.

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

Da notare che quando si crea un `Buffer` utilizzando un `.buffer` di [`TypedArray`], è possibile usare solo una parte del sottostante [`ArrayBuffer`] passando i parametri `byteOffset` e `length`.

Esempio:

```js
const arr = new Uint16Array(20);
const buf = Buffer.from(arr.buffer, 0, 16);

// Prints: 16
console.log(buf.length);
```

Il `Buffer.from()` e [`TypedArray.from()`] hanno diverse diciture ed implementazioni. Nello specifico, le varianti di [`TypedArray`] accettano un secondo argomento che è una funzione di mapping invocata su ogni elemento del typed array (array tipizzato):

* `TypedArray.from(source[, mapFn[, thisArg]])`

Tuttavia, il metodo `Buffer.from()` non supporta l'uso di una funzione di mapping:

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

Inoltre, i metodi [`buf.values()`], [`buf.keys()`], e [`buf.entries()`] possono essere utilizzati per creare degli iterator.

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

* `arrayBuffer` {ArrayBuffer|SharedArrayBuffer} Un [`ArrayBuffer`], un [`SharedArrayBuffer`] oppure la proprietà `.buffer` di un [`TypedArray`].
* `byteOffset` {integer} Indice del primo byte da esporre. **Default:** `0`.
* `length` {integer} Numero di byte da esporre. **Default:** `arrayBuffer.length - byteOffset`.

Ciò crea una visuale di [`ArrayBuffer`] oppure [`SharedArrayBuffer`] senza copiare la memoria sottostante. Ad esempio, quando viene passato un riferimento alla proprietà `.buffer` di un'istanza di [`TypedArray`], il `Buffer` appena creato condividerà la stessa memoria allocata in [`TypedArray`].

Gli argomenti facoltativi `byteOffset` e `length` specificano un intervallo di memoria all'interno di `arrayBuffer` che sarà condiviso tramite il `Buffer`.

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

* `buffer` {Buffer|Uint8Array} Un `Buffer` esistente oppure un [`Uint8Array`] da cui copiare i dati.

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

> Stabilità: 0 - Obsoleto: Utilizza invece [`Buffer.alloc()`] (vedi anche  [`Buffer.allocUnsafe()`]).

* `size` {integer} La lunghezza desiderata del nuovo `Buffer`.

Alloca un nuovo `Buffer` di `size` byte. If the `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, a [`RangeError`] will be thrown. A zero-length `Buffer` will be created if `size` is 0.

Prima di Node.js 8.0.0, la memoria sottostante per le istanze di `Buffer` create in questo modo *non era inizializzata*. I contenuti di un `Buffer` appena creato sono sconosciuti e *potrebbero contenere dati sensibili*. Use [`Buffer.alloc(size)`][`Buffer.alloc()`] instead to initialize a `Buffer` to zeroes.

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

> Stabilità: 0 - Obsoleto:  Utilizza invece [`Buffer.from(string[, encoding])`][`Buffer.from(string)`].

* `string` {string} Stringa da codificare.
* `encoding` {string} La codifica di `string`. **Default:** `'utf8'`.

Crea un nuovo `Buffer` contenente `string`. Il parametro `encoding` identifica la codifica dei caratteri di `string`.

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

Alloca un nuovo `Buffer` di `size` byte. Se `fill` è `undefined`, il `Buffer` sarà *riempito a zero*.

Esempio:

```js
const buf = Buffer.alloc(5);

// Prints: <Buffer 00 00 00 00 00>
console.log(buf);
```

Alloca un nuovo `Buffer` di `size` byte. If the `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, a [`RangeError`] will be thrown. A zero-length `Buffer` will be created if `size` is 0.

Se `fill` è specificato, il `Buffer` allocato verrà inizializzato chiamando [`buf.fill(fill)`][`buf.fill()`].

Esempio:

```js
const buf = Buffer.alloc(5, 'a');

// Prints: <Buffer 61 61 61 61 61>
console.log(buf);
```

Se sono specificati sia `fill` che `encoding`, il `Buffer` allocato verrà inizializzato chiamando [`buf.fill(fill, encoding)`][`buf.fill()`].

Esempio:

```js
const buf = Buffer.alloc(11, 'aGVsbG8gd29ybGQ=', 'base64');

// Prints: <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64>
console.log(buf);
```

Chiamare [`Buffer.alloc()`] può essere molto più lento dell'alternativa di chiamare [`Buffer.allocUnsafe()`] ma assicura che i contenuti dell'istanza di `Buffer` appena creata *non contengono mai dati sensibili*.

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

La memoria sottostante per le istanze di `Buffer` create in questo modo *non è inizializzata*. I contenuti del `Buffer` appena creato sono sconosciuti e *potrebbero contenere dati sensibili*. Use [`Buffer.alloc()`] instead to initialize `Buffer` instances to zeroes.

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

Da notare che il modulo `Buffer` pre-alloca un'istanza interna di `Buffer` di dimensioni [`Buffer.poolSize`] utilizzata come pool per l'allocazione rapida delle nuove istanze di `Buffer` create utilizzando [`Buffer.allocUnsafe()`] ed il nuovo `new Buffer(size)` constructor solo quando `size` è minore o uguale a `Buffer.poolSize >> 1` (area di [`Buffer.poolSize`] diviso due).

L'utilizzo di questo pool di memoria interno pre-allocato è una differenza chiave tra la chiamata di `Buffer.alloc(size, fill)` contro la chiamata di `Buffer.allocUnsafe(size).fill(fill)`. Specifically, `Buffer.alloc(size, fill)` will *never* use the internal `Buffer` pool, while `Buffer.allocUnsafe(size).fill(fill)` *will* use the internal `Buffer` pool if `size` is less than or equal to half [`Buffer.poolSize`]. La differenza è sottile ma può essere importante quando un'applicazione richiede prestazioni aggiuntive che vengono fornite da [`Buffer.allocUnsafe()`].

### Class Method: Buffer.allocUnsafeSlow(size)
<!-- YAML
added: v5.12.0
-->

* `size` {integer} La lunghezza desiderata del nuovo `Buffer`.

Alloca un nuovo `Buffer` di `size` byte. If the `size` is larger than [`buffer.constants.MAX_LENGTH`] or smaller than 0, a [`RangeError`] will be thrown. A zero-length `Buffer` will be created if `size` is 0.

La memoria sottostante per le istanze di `Buffer` create in questo modo *non è inizializzata*. I contenuti del `Buffer` appena creato sono sconosciuti e *potrebbero contenere dati sensibili*. Use [`buf.fill(0)`][`buf.fill()`] to initialize such `Buffer` instances to zeroes.

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

* `string` {string|Buffer|TypedArray|DataView|ArrayBuffer|SharedArrayBuffer} Un valore di cui calcolare la lunghezza.
* `encoding` {string} Se `string` è una stringa, questa è la sua codifica. **Default:** `'utf8'`.
* Restituisce: {integer} Il numero di byte contenuti all'interno di una `string`.

Restituisce la lunghezza effettiva in byte di una stringa. Questo non è uguale a [`String.prototype.length`] poiché quest’ultimo restituisce il numero di *caratteri* in una stringa.

*Note*: For `'base64'` and `'hex'`, this function assumes valid input. For strings that contain non-Base64/Hex-encoded data (e.g. whitespace), the return value might be greater than the length of a `Buffer` created from the string.

Esempio:

```js
const str = '\u00bd + \u00bc = \u00be';

// Prints: ½ + ¼ = ¾: 9 characters, 12 bytes
console.log(`${str}: ${str.length} characters, ` +
            `${Buffer.byteLength(str, 'utf8')} bytes`);
```

Quando `string` è un `Buffer`/[`DataView`]/[`TypedArray`]/[`ArrayBuffer`]/[`SharedArrayBuffer`], viene restituita la lunghezza effettiva in byte.

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

Solitamente confronta `buf1` a `buf2` allo scopo di ordinare gli array delle istanze di `Buffer`. Equivale a chiamare [`buf1.compare(buf2)`][`buf.compare()`].

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
* `totalLength` {integer} Lunghezza totale delle istanze di `Buffer` nella `list` quando vengono concatenate.
* Restituisce: {Buffer}

Restituisce un nuovo `Buffer` che è il risultato della concatenazione di tutte le istanze di `Buffer` nella `list`.

Se l'elenco (list) non contiene elementi o se `totalLength` è 0, viene restituito un nuovo `Buffer` di lunghezza zero.

Se `totalLength` non viene fornito, viene calcolato dalle istanze di `Buffer` nella `list`. Questo tuttavia causa l'esecuzione di un ciclo aggiuntivo per calcolare `totalLength`, quindi se la lunghezza è già nota è più rapido fornirla esplicitamente.

Se viene fornito `totalLength`, viene assegnato forzatamente ad un unsigned integer (intero senza segno). Se la lunghezza combinata dei `Buffer` nella `list` supera `totalLength`, il risultato viene troncato a `totalLength`.

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

* `arrayBuffer` {ArrayBuffer|SharedArrayBuffer} Un [`ArrayBuffer`], un [`SharedArrayBuffer`], oppure una proprietà `.buffer` di un [`TypedArray`].
* `byteOffset` {integer} Indice del primo byte da esporre. **Default:** `0`.
* `length` {integer} Numero di byte da esporre. **Default:** `arrayBuffer.length - byteOffset`.

Questo crea una visuale di [`ArrayBuffer`] senza copiare la memoria sottostante. Ad esempio, quando viene passato un riferimento alla proprietà `.buffer` di un'istanza [`TypedArray`], il `Buffer` appena creato condividerà la stessa memoria allocata in [`TypedArray`].

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

Gli argomenti facoltativi `byteOffset` e `length` specificano un intervallo di memoria all'interno di `arrayBuffer` che sarà condiviso tramite il `Buffer`.

Esempio:

```js
const ab = new ArrayBuffer(10);
const buf = Buffer.from(ab, 0, 2);

// Prints: 2
console.log(buf.length);
```

Verrà generato un `TypeError` se `arrayBuffer` non è un [`ArrayBuffer`] od un [`SharedArrayBuffer`].

### Class Method: Buffer.from(buffer)
<!-- YAML
added: v5.10.0
-->

* `buffer` {Buffer|Uint8Array} Un `Buffer` esistente oppure un [`Uint8Array`] da cui copiare i dati.

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

Crea un nuovo `Buffer` contenente `string`. Il parametro `encoding` identifica la codifica dei caratteri di `string`.

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
* `offsetOrEncoding` {number|string} Un byte-offset od una codifica, a seconda del valore restituito da `object.valueOf()` oppure da `object[Symbol.toPrimitive]()`.
* `length` {number} Una lunghezza, a seconda del valore restituito da `object.valueOf()` oppure da `object[Symbol.toPrimitive]()`.

Per gli object la cui funzione `valueOf()` restituisce un valore non strettamente uguale ad `object`, restituisce `Buffer.from(object.valueOf(), offsetOrEncoding, length)`.

Per esempio:

```js
const buf = Buffer.from(new String('this is a test'));
// <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

Per gli object che supportano `Symbol.toPrimitive`, restituisce `Buffer.from(object[Symbol.toPrimitive](), offsetOrEncoding, length)`.

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

Restituisce `true` se l'`encoding` contiene una codifica di caratteri supportata o in caso contrario `false`.

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

L'operatore indice `[index]` può essere usato per ottenere ed impostare l'octet nella posizione `index` all'interno di `buf`. I valori si riferiscono a singoli byte, quindi l'intervallo di valori è compreso tra `0x00` e `0xFF` (esadecimale) oppure tra `0` e `255` (decimale).

Quest'operatore è ereditato da `Uint8Array`, quindi il suo comportamento sull'accesso off-limits è uguale a quello di `UInt8Array` - cioè, ottiene dei return `undefined` e l'impostazione non esegue nulla.

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
* `targetStart` {integer} L'offset all'interno del `target` sul quale iniziare il confronto. **Default:** `0`.
* `targetEnd` {integer} L'offset all'interno del `target` sul quale finire il confronto (non incluso). **Default:** `target.length`.
* `sourceStart` {integer} L'offset all'interno di `buf` sul quale iniziare il confronto. **Default:** `0`.
* `sourceEnd` {integer} L'offset all'interno di `buf` sul quale finire il confronto (non incluso). **Default:** [`buf.length`].
* Restituisce: {integer}

Confronta `buf` con `target` e restituisce un numero che indica se `buf` viene prima, dopo oppure se è uguale a `target` nella sequenza di ordinamento. Il confronto si basa sulla sequenza effettiva di byte in ciascun `Buffer`.

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

Gli argomenti facoltativi `targetStart`, `targetEnd`, `sourceStart`, e `sourceEnd` possono essere utilizzati per limitare il confronto ad intervalli specifici rispettivamente all'interno di `target` e `buf`.

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
* `sourceEnd` {integer} L'offset all'interno di `buf` sul quale finire di copiare (non incluso). **Default:** [`buf.length`].
* Restituisce: {integer} Il numero di byte copiati.

Copia i dati da un'area di `buf` ad un'area in `target` anche se l'area di memoria `target` si sovrappone a `buf`.

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

Crea e restituisce un [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) di coppie `[index, byte]` dal contenuto di `buf`.

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

Restituisce `true` se sia `buf` che `otherBuffer` hanno esattamente gli stessi byte, in caso contrario `false`.

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
* `encoding` {string} Se `value` è una stringa, questa è la codifica utilizzata per determinare la rappresentazione binaria della stringa per cui verrà eseguita la ricerca in `buf`. **Default:** `'utf8'`.
* Restituisce: {integer} L'indice della prima apparizione di `value` in `buf`, oppure `-1` se `buf` non contiene `value`.

Se `value` è:

  * una stringa, `value` viene interpretato in base alla codifica dei caratteri in `encoding`.
  * un `Buffer` oppure un [`Uint8Array`], `value` sarà usato nella sua interezza. Per confrontare un `Buffer` parziale, utilizza [`buf.slice()`].
  * un numero, `value` verrà interpretato come un valore unsigned integer a 8 bit (intero senza segno) tra `0` e `255`.

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

Se `value` non è una stringa, un numero oppure un `Buffer`, questo metodo genererà un `TypeError`. Se `value` è un numero, verrà forzato ad un valore in byte valido, un integer (numero intero) compreso tra 0 e 255.

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

Se `value` è una stringa vuota o un `Buffer` vuoto e `byteOffset` è inferiore rispetto a `buf.length`, verrà restituito `byteOffset`. Se `value` è vuoto e `byteOffset` è almeno equivalente a `buf.length`, verrà restituito `buf.length`.

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
* `encoding` {string} Se `value` è una stringa, questa è la codifica utilizzata per determinare la rappresentazione binaria della stringa per cui verrà eseguita la ricerca in `buf`. **Default:** `'utf8'`.
* Restituisce: {integer} L'indice dell'ultima apparizione di `value` in `buf`, oppure `-1` se `buf` non contiene `value`.

Identico a [`buf.indexOf()`], eccetto che l'ultima apparizione di `value` rispetto alla prima viene trovata.

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

Se `value` non è una stringa, un numero oppure un `Buffer`, questo metodo genererà un `TypeError`. Se `value` è un numero, verrà forzato ad un valore in byte valido, un integer (numero intero) compreso tra 0 e 255.

Se `byteOffset` non è un numero, sarà forzato ad un numero. Qualsiasi argomento che forza il valore a `NaN`, come possono essere `{}` oppure `undefined`, eseguiranno la ricerca sull'intero buffer. Questo comportamento corrisponde a [`String#lastIndexOf()`].

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

Restituisce la quantità di memoria allocata per `buf` in byte. Da notare che questo non rispecchia necessariamente la quantità di dati "utilizzabili” all'interno di `buf`.

Example: Create a `Buffer` and write a shorter ASCII string to it

```js
const buf = Buffer.alloc(1234);

// Prints: 1234
console.log(buf.length);

buf.write('some string', 0, 'ascii');

// Prints: 1234
console.log(buf.length);
```

Sebbene la proprietà `length` (lunghezza) non sia immutabile, la modifica del valore di `length` può causare un comportamento indefinito ed incoerente. Le applicazioni che desiderano modificare la lunghezza di un `Buffer` dovrebbero pertanto trattare `length` come un valore di sola lettura ed utilizzare [`buf.slice()`] per creare un nuovo `Buffer`.

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

Legge un double a 64 bit da `buf` all'`offset` specificato con il formato endian specificato (`readDoubleBE()` restituisce big endian, `readDoubleLE()` restituisce little endian).

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

Legge un float a 32 bit da `buf` all'`offset` specificato con il formato endian specificato (`readFloatBE()` restituisce big endian, `readFloatLE()` restituisce little endian).

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

Legge un signed integer a 16 bit da `buf` all'`offset` specificato con il formato endian specificato (`readInt16BE()` restituisce big endian, `readInt16LE()` restituisce little endian).

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

Legge un signed integer a 32 bit da `buf` all'`offset` specificato con il formato endian specificato (`readInt32BE()` restituisce big endian, `readInt32LE()` restituisce little endian).

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

Legge il numero di byte di `byteLength` da `buf` all'`offset` specificato ed interpreta il risultato come valore signed a complemento a due. Supporta fino a 48 bit di accuracy (precisione).

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

Legge un unsigned integer a 16 bit da `buf` all'`offset` specificato con un formato endian specificato (`readUInt16BE()` restituisce big endian, `readUInt16LE()` restituisce little endian).

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

Legge un unsigned integer a 32 bit da `buf` all'`offset` specificato con un formato endian specificato (`readUInt32BE()` restituisce big endian, `readUInt32LE()` restituisce little endian).

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

Legge il numero di byte di `byteLength` da `buf` all'`offset` specificato ed interpreta il risultato come un unsigned integer. Supporta fino a 48 bit di accuracy (precisione).

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

Restituisce un nuovo `Buffer` che fa riferimento alla stessa memoria dell'originale, ma compensato (offset) e ritagliato (cropped) dagli indici `start` ed `end`.

Specificare `end` maggiore di [`buf.length`] restituirà lo stesso risultato di `end` uguale a [`buf.length`].

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

Specificando gli indici negativi, la sezione (slice) viene generata in relazione alla fine di `buf` piuttosto che in relazione all'inizio.

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

Da notare che JavaScript non può codificare degli integer (numeri interi) a 64 bit. Questo metodo è pensato per lavorare con i float a 64 bit.

### buf.toJSON()
<!-- YAML
added: v0.9.2
-->

* Restituisce: {Object}

Restituisce una rappresentazione JSON di `buf`. [`JSON.stringify()`] chiama implicitamente questa funzione quando trasforma un'istanza di `Buffer` in una stringa.

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

Decodifica `buf` in una stringa in base alla codifica dei caratteri specificata in `encoding`. `start` ed `end` possono essere passati per decodificare solo un sottoinsieme di `buf`.

La lunghezza massima di un'istanza di string (in unità di codice UTF-16) è disponibile come [`buffer.constants.MAX_STRING_LENGTH`][].

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

Crea e restituisce un [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) per i valori di `buf` (in byte). Questa funzione è chiamata automaticamente quando un `Buffer` viene usato in un'istruzione `for..of`.

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

Scrive `value` da `buf` all'`offset` specificato con il formato endian specificato (`writeDoubleBE()` scrive big endian, `writeDoubleLE()` scrive little endian). `value` *dovrebbe* essere un double a 64 bit valido. Il comportamento è undefined (indefinito) quando `value` è diverso da un double a 64 bit.

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

Scrive `value` da `buf` all'`offset` specificato con il formato endian specificato (`writeFloatBE()` scrive big endian, `writeFloatLE()` scrive little endian). `value` *dovrebbe* essere un float a 32 bit valido. Il comportamento è undefined (indefinito) quando `value` è diverso da un float a 32 bit.

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

Scrive `value` da `buf` all'`offset` specificato. `value` *dovrebbe* essere un signed integer (numero intero con segno) a 8 bit valido. Il comportamento è undefined (indefinito) quando `value` è diverso da un signed integer (numero intero con segno) a 8 bit.

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

Scrive `value` da `buf` all'`offset` specificato con il formato endian specificato (`writeInt16BE()` scrive big endian, `writeInt16LE()` scrive little endian). `value` *dovrebbe* essere un signed integer (numero intero con segno) a 16 bit valido. Behavior is undefined when `value` is anything other than a signed 16-bit integer.

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

Scrive `value` da `buf` all'`offset` specificato con il formato endian specificato (`writeInt32BE()` scrive big endian, `writeInt32LE()` scrive little endian). `value` *dovrebbe* essere un signed integer (numero intero con segno) a 32 bit valido. Behavior is undefined when `value` is anything other than a signed 32-bit integer.

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

Scrive `byteLength` byte di `value` da `buf` all'`offset` specificato. Supporta fino a 48 bit di accuracy (precisione). Il comportamento è undefined (indefinito) quando `value` è diverso da un signed integer (numero intero con segno).

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

Scrive `value` da `buf` all'`offset` specificato. `value` *dovrebbe* essere un unsigned integer (numero intero senza segno) a 8 bit valido. Il comportamento è undefined (indefinito) quando `value` è diverso da un unsigned integer (numero intero senza segno) a 8 bit.

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

Scrive `value` su `buf` all'`offset` specificato con il formato endian specificato (`writeInt16BE()` scrive big endian, `writeInt16LE()` scrive little endian). `value` dovrebbe essere un numero intero senza segno valido a 16 bit. Il comportamento è indefinito quando `value` è qualcosa di diverso da un numero intero senza segno a 16 bit.

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

Scrive `value` su `buf` all'`offset` specificato con il formato endian specificato (`writeInt32BE()` scrive big endian, `writeInt32LE()` scrive little endian). `value` dovrebbe essere un numero intero senza segno valido a 32 bit. Il comportamento è indefinito quando `value` è qualcosa di diverso da un numero intero senza segno a 32 bit.

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

Scrive `byteLength` byte di `value` da `buf` all'`offset` specificato. Supporta fino a 48 bit di accuracy (precisione). Il comportamento è indefinito quando `value` è qualcosa di diverso da un numero intero senza segno.

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

Restituisce il numero massimo di byte che verranno restituiti quando viene chiamato `buf.inspect()`. Questo può essere sovrascritto dai moduli utente. Vedi [`util.inspect()`] per maggiori dettagli sul comportamento di `buf.inspect()`.

Notare che questa è una proprietà sul modulo `buffer` restituito da `require('buffer')`, non sul globale `Buffer` o su un'istanza `Buffer`.

## buffer.kMaxLength
<!-- YAML
added: v3.0.0
-->

* {integer} La dimensione più grande consentita per una singola istanza `Buffer`.

Un alias per [`buffer.constants.MAX_LENGTH]`[]

Notare che questa è una proprietà sul modulo `buffer` restituito da `require('buffer')`, non sul globale `Buffer` o su un'istanza `Buffer`.

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

Ricodifica l'istanza `Buffer` o `Uint8Array` indicata da una codifica di carattere a un'altra. Restituisce una nuova istanza `Buffer`.

Genera (un errore) se il `fromEnc` o il `toEnc` specificano codifiche di carattere non valide o se la conversione da `fromEnc` a `toEnc` non è consentita.

Il processo di transcodifica utilizzerà caratteri di sostituzione se una determinata sequenza di byte non può essere adeguatamente rappresentata nella codifica di destinazione. Ad esempio:

```js
const buffer = require('buffer');

const newBuf = buffer.transcode(Buffer.from('€'), 'utf8', 'ascii');
console.log(newBuf.toString('ascii'));
// Stampa: '?'
```

Poiché il segno Euro (`€`) non è rappresentabile nell'US-ASCII, viene sostituito con `?` nel `Buffer` transcodificato.

Notare che questa è una proprietà sul modulo `buffer` restituito da `require('buffer')`, non sul globale `Buffer` o su un'istanza `Buffer`.

## Class: SlowBuffer
<!-- YAML
deprecated: v6.0.0
-->

> Stabilità: 0 - Deprecato: Utilizza [`Buffer.allocUnsafeSlow()`][] al suo posto.

Restituisce un `Buffer` non inserito in un pool.

Per evitare il sovraccarico della garbage collection per la creazione di numerose istanze di `Buffer` allocate individualmente, di default le allocazioni sotto ai 4KB vengono suddivise da un singolo object allocato più grande.

Nel caso in cui uno sviluppatore possa aver bisogno di conservare un piccolo chunk di memoria da un pool per un periodo di tempo indeterminato, potrebbe essere opportuno creare un'istanza `Buffer` non inserita nel pool utilizzando `SlowBuffer` per poi copiare i bit rilevanti.

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

L'utilizzo di `SlowBuffer` dovrebbe essere fatto solo come ultima risorsa *dopo* che uno sviluppatore abbia osservato un'indebita conservazione della memoria nelle sue applicazioni.

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

Notare che `buffer.constants` è una proprietà sul modulo `buffer` restituito da `require('buffer')`, non sul globale `Buffer` o su un'istanza `Buffer`.

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

Rappresenta la maggior `lenght` che una primitiva `string` può avere, conteggiata in unità di codice UTF-16.

Questo valore può dipendere dal motore JS che viene utilizzato.
