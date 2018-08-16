# Buffer

<!--introduced_in=v0.1.90-->

> Stabilità: 2 - Stabile

Prima dell'introduzione di [`TypedArray`], il linguaggio JavaScript non aveva alcun meccanismo per leggere o manipolare stream di dati binari. La classe `Buffer` è stata introdotta come parte dell'API Node.js per consentire l'interazione con gli octet stream negli TCP stream, nelle operazioni del file system ed in altri contesti.

Con [`TypedArray`] ora disponibile, la classe `Buffer` implementa l'API [`Uint8Array`] in modo che sia più ottimizzato e adatto per Node.js.

Le istanze della classe `Buffer` sono simili agli array di numeri interi ma corrispondono ad allocazioni di memoria raw di dimensioni fisse all'esterno di V8 heap. La dimensione del `Buffer` viene stabilita quando viene creato e non può essere modificata.

La classe `Buffer` rientra nel global scope, il che rende improbabile la necessità di utilizzare mai `require('buffer').Buffer`.

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

Nelle versioni di Node.js precedenti alla 6.0.0, le istanze di `Buffer` sono state create utilizzando la funzione `Buffer` constructor, che allocava il `Buffer` restituito in modo diverso a seconda di quali argomenti venivano forniti:

* Passando un numero come primo argomento a `Buffer()` (ad es. `new Buffer(10)`) allocava un nuovo `Buffer` object della dimensione specificata. Prima di Node.js 8.0.0, la memoria allocata per tali istanze di `Buffer` *non* era inizializzata e *poteva contenere dati sensibili*. Tali istanze di `Buffer` *dovevano* essere successivamente inizializzate utilizzando [`buf.fill(0)`][`buf.fill()`] o scrivendo sull'intero `Buffer`. Sebbene questo comportamento fosse *intenzionale* per migliorare le prestazioni, l'esperienza di sviluppo ha dimostrato che è necessaria una distinzione più esplicita tra la creazione di un `Buffer` veloce ma non inizializzato (fast-but-uninitialized) rispetto alla creazione di un `Buffer` più lento ma più sicuro (slower-but-safer). A partire da Node.js 8.0.0, `Buffer(num)` e `new Buffer(num)` restituiranno un `Buffer` con memoria inizializzata.
* Passando una stringa, un array oppure un `Buffer` come primo argomento copiava i dati dell'object passato all'interno del `Buffer`.
* Passando un [`ArrayBuffer`] od un [`SharedArrayBuffer`] restituiva un `Buffer` che condivideva la memoria allocata con l'array buffer specificato.

Poiché il comportamento di `new Buffer()` è diverso a seconda del tipo di primo argomento, potevano essere inavvertitamente introdotti nelle applicazioni problemi di sicurezza ed affidabilità quando la convalida dell'argomento o l'inizializzazione di `Buffer` non venivano eseguite.

Per rendere la creazione delle istanze di `Buffer` più affidabili e meno soggette ad errori, le varie forme del `new Buffer()` constructor sono state **deprecate** e sostituite dai metodi suddivisi `Buffer.from()`, [`Buffer.alloc()`], e [`Buffer.allocUnsafe()`].

*Gli sviluppatori dovrebbero migrare tutti gli usi esistenti dei constructor `new Buffer()` su una di queste nuove API.*

* [`Buffer.from(array)`] restituisce un nuovo `Buffer` che *contiene una copia* degli octet forniti.
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`] restituisce un nuovo `Buffer` che *condivide la stessa memoria allocata* dell'[`ArrayBuffer`] specificato.
* [`Buffer.from(buffer)`] restituisce un nuovo `Buffer` che *contiene una copia* dei contenuti del `Buffer` specificato.
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`] restituisce un nuovo `Buffer` che *contiene una copia* della stringa fornita.
* [`Buffer.alloc(size[, fill[, encoding]])`][`Buffer.alloc()`] restituisce un nuovo `Buffer` inizializzato della dimensione specificata. Questo metodo è più lento di [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] ma garantisce che le istanze `Buffer` appena create non contengano mai vecchi dati potenzialmente sensibili.
* [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] e [`Buffer.allocUnsafeSlow(size)`][`Buffer.allocUnsafeSlow()`] restituiscono ciascuno un nuovo `Buffer` non inizializzato della `size` specificata. Poiché il `Buffer` non è inizializzato, il segmento di memoria allocato potrebbe contenere vecchi dati potenzialmente sensibili.

Le istanze di `Buffer` restituite da [`Buffer.allocUnsafe()`] *potrebbero* essere allocate su un pool di memoria interno condiviso se `size` è minore o uguale a metà di [`Buffer.poolSize`]. Le istanze restituite da [`Buffer.allocUnsafeSlow()`] non usano *mai* il pool di memoria interno condiviso.

### L'opzione `--zero-fill-buffers` della command line

<!-- YAML
added: v5.10.0
-->

Node.js può essere avviato utilizzando l'opzione `--zero-fill-buffers` della command line per far sì che tutte le istanze di `Buffer` appena allocate vengano riempite a zero di default nel momento in cui vengono create, inclusi i buffer restituiti da `new Buffer(size)`, [`Buffer.allocUnsafe()`], [`Buffer.allocUnsafeSlow()`], e `newSlowBuffer(size)`. L'utilizzo di questo flag può avere un impatto negativo significativo sulle prestazioni. L'utilizzo dell'opzione `--zero-fill-buffers` è consigliata solo quando è necessario far sì che le istanze di `Buffer` appena allocate non contengano dati vecchi potenzialmente sensibili.

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

Quando gli string data sono memorizzati oppure estratti da un'istanza di `Buffer`, è possibile specificare una codifica (encoding) dei caratteri.

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

* `'ascii'` - Solo per dati ASCII a 7 bit. Questa codifica è veloce e decodificherà il bit più alto se impostata.

* `'utf8'` - Caratteri Unicode codificati in multibyte. Molte pagine web ed altri formati di documenti utilizzano UTF-8.

* `'utf16le'` - 2 o 4 byte, caratteri Unicode codificati in little-endian. Sono supportate coppie di surrogati (da U+10000 a U+10FFFF).

* `'ucs2'` - Alias di `'utf16le'`.

* `'base64'` - Codifica base64. Quando si crea un `Buffer` da una stringa, questa codifica accetterà anche correttamente "L'Alfabeto Sicuro per l'URL ed il Filename" come specificato in [RFC4648, Section 5](https://tools.ietf.org/html/rfc4648#section-5).

* `'latin1'` - Un modo per codificare il `Buffer` in una stringa codificata ad un byte (definita da IANA in [RFC1345](https://tools.ietf.org/html/rfc1345), pagina 63, come il blocco di supplemento Latin-1 ed i codici di controllo C0/C1).

* `'binary'` - Alias di `'latin1'`.

* `'hex'` - Codifica ogni byte come due caratteri esadecimali.

I moderni browser web seguono la [Codifica Standard WHATWG](https://encoding.spec.whatwg.org/) che attribuiscono sia a `'latin1'` che ad `'ISO-8859-1'` l'alias `'win-1252'`. Ciò significa che mentre si fa qualcosa come `http.get()`, se il set di caratteri restituito è uno di quelli elencati nella specifica WHATWG è possibile che il server abbia effettivamente restituito dati con codifica `'win-1252'` e l'utilizzo della codifica `'latin1'` potrebbe decodificare i caratteri in modo errato.

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

È possibile creare un nuovo `Buffer` che condivide la stessa memoria allocata di un'istanza di [`TypedArray`] utilizzando la proprietà `.buffer` del `TypeArray` object.

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Copia il contenuto di `arr`
const buf1 = Buffer.from(arr);
// Condivide la memoria con `arr`
const buf2 = Buffer.from(arr.buffer);

console.log(buf1);
// Stampa: <Buffer 88 a0>
console.log(buf2);
// Stampa: <Buffer 88 13 a0 0f>

arr[1] = 6000;

console.log(buf1);
// Stampa: <Buffer 88 a0>
console.log(buf2);
// Stampa: <Buffer 88 13 70 17>
```

Da notare che quando si crea un `Buffer` utilizzando un `.buffer` di [`TypedArray`], è possibile usare solo una parte del sottostante [`ArrayBuffer`] passando i parametri `byteOffset` e `length`.

```js
const arr = new Uint16Array(20);
const buf = Buffer.from(arr.buffer, 0, 16);

console.log(buf.length);
// Stampa: 16
```

Il `Buffer.from()` e [`TypedArray.from()`] hanno diverse diciture ed implementazioni. Nello specifico, le varianti di [`TypedArray`] accettano un secondo argomento che è una funzione di mapping invocata su ogni elemento del typed array (array tipizzato):

* `TypedArray.from(source[, mapFn[, thisArg]])`

Tuttavia, il metodo `Buffer.from()` non supporta l'uso di una funzione di mapping:

* [`Buffer.from(array)`]
* [`Buffer.from(buffer)`]
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`]
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`]

## Buffer ed iterazione

Le istanze di `Buffer` possono essere iterate usando la sintassi `for..of`:

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

> Stabilità: 0 - Obsoleto: Utilizza invece [`Buffer.from(array)`].

* `array` {integer[]} Un array di byte da cui copiare.

Alloca un nuovo `Buffer` usando un `array` di octet.

```js
// Crea un nuovo Buffer contenente i byte UTF-8 della stringa 'buffer'
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

> Stabilità: 0 - Obsoleto: Utilizza invece [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`].

* `arrayBuffer` {ArrayBuffer|SharedArrayBuffer} Un [`ArrayBuffer`], un [`SharedArrayBuffer`] oppure la proprietà `.buffer` di un [`TypedArray`].
* `byteOffset` {integer} Indice del primo byte da esporre. **Default:** `0`.
* `length` {integer} Numero di byte da esporre. **Default:** `arrayBuffer.length - byteOffset`.

Ciò crea una visuale di [`ArrayBuffer`] oppure [`SharedArrayBuffer`] senza copiare la memoria sottostante. Ad esempio, quando viene passato un riferimento alla proprietà `.buffer` di un'istanza di [`TypedArray`], il `Buffer` appena creato condividerà la stessa memoria allocata in [`TypedArray`].

Gli argomenti facoltativi `byteOffset` e `length` specificano un intervallo di memoria all'interno di `arrayBuffer` che sarà condiviso tramite il `Buffer`.

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Condivide la memoria con `arr`
const buf = new Buffer(arr.buffer);

console.log(buf);
// Stampa: <Buffer 88 13 a0 0f>

// La modifica dell'originale Uint16Array cambia anche il Buffer
arr[1] = 6000;

console.log(buf);
// Stampa: <Buffer 88 13 70 17>
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

> Stabilità: 0 - Obsoleto: Utilizza invece [`Buffer.from(buffer)`].

* `buffer` {Buffer|Uint8Array} Un `Buffer` esistente oppure un [`Uint8Array`] da cui copiare i dati.

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

> Stabilità: 0 - Obsoleto: Utilizza invece [`Buffer.alloc()`] (vedi anche [`Buffer.allocUnsafe()`]).

* `size` {integer} La lunghezza desiderata del nuovo `Buffer`.

Alloca un nuovo `Buffer` di `size` byte. Se `size` è maggiore di [`buffer.constants.MAX_LENGTH`] o minore di 0, viene generato [`ERR_INVALID_OPT_VALUE`]. Viene creato un `Buffer` di lunghezza zero se `size` è 0.

Prima di Node.js 8.0.0, la memoria sottostante per le istanze di `Buffer` create in questo modo *non era inizializzata*. I contenuti di un `Buffer` appena creato sono sconosciuti e *potrebbero contenere dati sensibili*. Utilizza invece [`Buffer.alloc(size)`][`Buffer.alloc()`] per inizializzare un `Buffer` con gli zeri.

```js
const buf = new Buffer(10);

console.log(buf);
// Stampa: <Buffer 00 00 00 00 00 00 00 00 00 00>
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

> Stabilità: 0 - Obsoleto: Utilizza invece [`Buffer.from(string[, encoding])`][`Buffer.from(string)`].

* `string` {string} Stringa da codificare.
* `encoding` {string} La codifica di `string`. **Default:** `'utf8'`.

Crea un nuovo `Buffer` contenente `string`. Il parametro `encoding` identifica la codifica dei caratteri di `string`.

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

### Class Method: Buffer.alloc(size[, fill[, encoding]])

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
* `fill` {string|Buffer|integer} Un valore con il quale precompilare il nuovo `Buffer`. **Default:** `0`.
* `encoding` {string} Se `fill` è una stringa, questa è la sua codifica. **Default:** `'utf8'`.

Alloca un nuovo `Buffer` di `size` byte. Se `fill` è `undefined`, il `Buffer` sarà *riempito a zero*.

```js
const buf = Buffer.alloc(5);

console.log(buf);
// Stampa: <Buffer 00 00 00 00 00>
```

Alloca un nuovo `Buffer` di `size` byte. Se `size` è maggiore di [`buffer.constants.MAX_LENGTH`] o minore di 0, viene generato [`ERR_INVALID_OPT_VALUE`]. Viene creato un `Buffer` di lunghezza zero se `size` è 0.

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

Alloca un nuovo `Buffer` di `size` byte. Se `size` è maggiore di [`buffer.constants.MAX_LENGTH`] o minore di 0, viene generato [`ERR_INVALID_OPT_VALUE`]. Viene creato un `Buffer` di lunghezza zero se `size` è 0.

La memoria sottostante per le istanze di `Buffer` create in questo modo *non è inizializzata*. I contenuti del `Buffer` appena creato sono sconosciuti e *potrebbero contenere dati sensibili*. Utilizza [`Buffer.alloc()`] per inizializzare istanze di `Buffer` con gli zeri.

```js
const buf = Buffer.allocUnsafe(10);

console.log(buf);
// Stampa: (contents may vary): <Buffer a0 8b 28 3f 01 00 00 00 50 32>

buf.fill(0);

console.log(buf);
// Stampa: <Buffer 00 00 00 00 00 00 00 00 00 00>
```

Verrà generato un `TypeError` se `size` non è un numero.

Da notare che il modulo `Buffer` pre-alloca un'istanza interna di `Buffer` di dimensioni [`Buffer.poolSize`] utilizzata come pool per l'allocazione rapida delle nuove istanze di `Buffer` create utilizzando [`Buffer.allocUnsafe()`] ed il nuovo `new Buffer(size)` constructor solo quando `size` è minore o uguale a `Buffer.poolSize >> 1` (area di [`Buffer.poolSize`] diviso due).

L'utilizzo di questo pool di memoria interno pre-allocato è una differenza chiave tra la chiamata di `Buffer.alloc(size, fill)` contro la chiamata di `Buffer.allocUnsafe(size).fill(fill)`. In particolare, `Buffer.alloc(size, fill)` non utilizzerà *mai* il `Buffer` pool interno, mentre `Buffer.allocUnsafe(size).fill(fill)` *utilizzerà* il `Buffer` pool interno se `size` è minore o uguale a metà di [`Buffer.poolSize`]. La differenza è sottile ma può essere importante quando un'applicazione richiede prestazioni aggiuntive che vengono fornite da [`Buffer.allocUnsafe()`].

### Class Method: Buffer.allocUnsafeSlow(size)

<!-- YAML
added: v5.12.0
-->

* `size` {integer} La lunghezza desiderata del nuovo `Buffer`.

Alloca un nuovo `Buffer` di `size` byte. Se `size` è maggiore di [`buffer.constants.MAX_LENGTH`] o minore di 0, viene generato [`ERR_INVALID_OPT_VALUE`]. Viene creato un `Buffer` di lunghezza zero se `size` è 0.

La memoria sottostante per le istanze di `Buffer` create in questo modo *non è inizializzata*. I contenuti del `Buffer` appena creato sono sconosciuti e *potrebbero contenere dati sensibili*. Utilizza [`buf.fill(0)`][`buf.fill()`] per inizializzare tali istanze di `Buffer` con gli zeri.

Quando si utilizza [`Buffer.allocUnsafe()`] per allocare nuove istanze di `Buffer`, le allocazioni sotto i 4KB vengono suddivise da un singolo `Buffer` pre-allocato. Ciò consente alle applicazioni di evitare il sovraccarico della garbage collection per la creazione di numerose istanze di `Buffer` allocate individualmente. Questo approccio migliora sia le prestazioni che l'utilizzo della memoria eliminando la necessità di tenere traccia e ripulire il maggior numero di persistent object.

Tuttavia, nel caso in cui uno sviluppatore possa aver bisogno di conservare un piccolo chunk di memoria da un pool per un periodo di tempo indeterminato, potrebbe essere opportuno creare un'istanza un-pooled `Buffer` utilizzando `Buffer.allocUnsafeSlow()` e quindi copiando i bit rilevanti.

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

`Buffer.allocUnsafeSlow()` dovrebbe essere usato solo come ultima risorsa in seguito che uno sviluppatore abbia osservato un'indebita conservazione della memoria nelle sue applicazioni.

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

Restituisce la lunghezza effettiva del byte di una stringa. Questo non è uguale a [`String.prototype.length`] poiché restituisce il numero di *caratteri* in una stringa.

Per `'base64'` ed `'hex'`, questa funzione assume input validi. Per le stringhe che contengono dati con codifica diversa da Base64/Hex (es. whitespace), il valore restituito potrebbe essere maggiore della lunghezza di un `Buffer` creato dalla stringa.

```js
const str = '\u00bd + \u00bc = \u00be';

console.log(`${str}: ${str.length} characters, ` +
            `${Buffer.byteLength(str, 'utf8')} bytes`);
// Stampa: ½ + ¼ = ¾: 9 characters, 12 bytes
```

Quando `string` è un `Buffer`/[`DataView`]/[`TypedArray`]/[`ArrayBuffer`]/[`SharedArrayBuffer`], viene restituita la lunghezza effettiva del byte.

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

```js
const buf1 = Buffer.from('1234');
const buf2 = Buffer.from('0123');
const arr = [buf1, buf2];

console.log(arr.sort(Buffer.compare));
// Stampa: [ <Buffer 30 31 32 33>, <Buffer 31 32 33 34> ]
// (Questo risultato è uguale a: [buf2, buf1])
```

### Class Method: Buffer.concat(list[, totalLength])

<!-- YAML
added: v0.7.11
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The elements of `list` can now be `Uint8Array`s.
-->

* `list` {Buffer[] | Uint8Array[]} Elenco delle istanze di `Buffer` o di [`Uint8Array`] per cui eseguire il concat.
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

### Class Method: Buffer.from(array)

<!-- YAML
added: v5.10.0
-->

* `array` {integer[]}

Alloca un nuovo `Buffer` usando un `array` di octet.

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

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Condivide la memoria con `arr`
const buf = Buffer.from(arr.buffer);

console.log(buf);
// Stampa: <Buffer 88 13 a0 0f>

// La modifica dell'originale Uint16Array cambia anche il Buffer
arr[1] = 6000;

console.log(buf);
// Stampa: <Buffer 88 13 70 17>
```

Gli argomenti facoltativi `byteOffset` e `length` specificano un intervallo di memoria all'interno di `arrayBuffer` che sarà condiviso tramite il `Buffer`.

```js
const ab = new ArrayBuffer(10);
const buf = Buffer.from(ab, 0, 2);

console.log(buf.length);
// Stampa: 2
```

Verrà generato un `TypeError` se `arrayBuffer` non è un [`ArrayBuffer`] od un [`SharedArrayBuffer`].

### Class Method: Buffer.from(buffer)

<!-- YAML
added: v5.10.0
-->

* `buffer` {Buffer|Uint8Array} Un `Buffer` esistente oppure un [`Uint8Array`] da cui copiare i dati.

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

Verrà generato un `TypeError` se `buffer` non è un `Buffer`.

### Class Method: Buffer.from(string[, encoding])

<!-- YAML
added: v5.10.0
-->

* `string` {string} Una striga da codificare.
* `encoding` {string} La codifica di `string`. **Default:** `'utf8'`.

Crea un nuovo `Buffer` contenente `string`. Il parametro `encoding` identifica la codifica dei caratteri di `string`.

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

Verrà generato un `TypeError` se `string` non è una stringa.

### Class Method: Buffer.from(object[, offsetOrEncoding[, length]])

<!-- YAML
added: v8.2.0
-->

* `object` {Object} Un object che supporta `Symbol.toPrimitive` oppure `valueOf()`
* `offsetOrEncoding` {number|string} Un byte-offset od una codifica, a seconda del valore restituito da `object.valueOf()` oppure da `object[Symbol.toPrimitive]()`.
* `length` {number} Una lunghezza, a seconda del valore restituito da `object.valueOf()` oppure da `object[Symbol.toPrimitive]()`.

Per gli object la cui funzione `valueOf()` restituisce un valore non strettamente uguale ad `object`, restituisce `Buffer.from(object.valueOf(), offsetOrEncoding, length)`.

```js
const buf = Buffer.from(new String('this is a test'));
// Stampa: <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

Per gli object che supportano `Symbol.toPrimitive`, restituisce `Buffer.from(object[Symbol.toPrimitive](), offsetOrEncoding, length)`.

```js
class Foo {
  [Symbol.toPrimitive]() {
    return 'this is a test';
  }
}

const buf = Buffer.from(new Foo(), 'utf8');
// Stampa: <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
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

Restituisce `true` se l'`encoding` contiene una codifica di caratteri supportata od in caso contrario `false`.

### Class Property: Buffer.poolSize

<!-- YAML
added: v0.11.3
-->

* {integer} **Default:** `8192`

Questa è la dimensione (in byte) delle istanze di `Buffer` interne pre-allocate utilizzate per il pooling. Questo valore potrebbe essere modificato.

### buf[index]

<!-- YAML
type: property
name: [index]
-->

L'operatore indice `[index]` può essere usato per ottenere ed impostare l'octet nella posizione `index` all'interno di `buf`. I valori si riferiscono a singoli byte, quindi l'intervallo di valori è compreso tra `0x00` e `0xFF` (esadecimale) oppure tra `0` e `255` (decimale).

Quest'operatore è ereditato da `Uint8Array`, quindi il suo comportamento sull'accesso off-limits è uguale a quello di `UInt8Array` - cioè, ottiene dei return `undefined` e l'impostazione non esegue nulla.

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

### buf.buffer

* {ArrayBuffer} L'`ArrayBuffer` object sottostante in base al quale viene creato questo `Buffer` object.

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

* `target` {Buffer|Uint8Array} Un `Buffer` oppure un [`Uint8Array`] con cui confrontare `buf`.
* `targetStart` {integer} L'offset all'interno del `target` sul quale iniziare il confronto. **Default:** `0`.
* `targetEnd` {integer} L'offset all'interno del `target` sul quale finire il confronto (non incluso). **Default:** `target.length`.
* `sourceStart` {integer} L'offset all'interno di `buf` sul quale iniziare il confronto. **Default:** `0`.
* `sourceEnd` {integer} L'offset all'interno di `buf` sul quale finire il confronto (non incluso). **Default:** [`buf.length`].
* Restituisce: {integer}

Confronta `buf` con `target` e restituisce un numero che indica se `buf` viene prima, dopo oppure se è uguale a `target` nella sequenza di ordinamento. Il confronto si basa sulla sequenza effettiva di byte in ciascun `Buffer`.

* Viene restituito `0` se `target` è uguale a `buf`
* Viene restituito `1` se `target` dovrebbe venire *prima* di `buf` quando viene ordinato.
* Viene restituito `-1` se `target` dovrebbe venire *dopo* di `buf` quando viene ordinato.

```js
const buf1 = Buffer.from('ABC');
const buf2 = Buffer.from('BCD');
const buf3 = Buffer.from('ABCD');

console.log(buf1.compare(buf1));
// Stampa: 0
console.log(buf1.compare(buf2));
// Stampa: -1
console.log(buf1.compare(buf3));
// Stampa: -1
console.log(buf2.compare(buf1));
// Stampa: 1
console.log(buf2.compare(buf3));
// Stampa: 1
console.log([buf1, buf2, buf3].sort(Buffer.compare));
// Stampa: [ <Buffer 41 42 43>, <Buffer 41 42 43 44>, <Buffer 42 43 44> ]
// (Questo risultato è uguale a: [buf1, buf3, buf2])
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

Viene generato [`ERR_INDEX_OUT_OF_RANGE`] se `targetStart < 0`, `sourceStart < 0`, `targetEnd > target.byteLength`, oppure `sourceEnd > source.byteLength`.

### buf.copy(target[, targetStart[, sourceStart[, sourceEnd]]])

<!-- YAML
added: v0.1.90
-->

* `target` {Buffer|Uint8Array} Un `Buffer` od un [`Uint8Array`] da cui copiare.
* `targetStart` {integer} L'offset all'interno del `target` sul quale iniziare a scrivere. **Default:** `0`.
* `sourceStart` {integer} L'offset all'interno di `buf` dal quale iniziare a copiare. **Default:** `0`.
* `sourceEnd` {integer} L'offset all'interno di `buf` sul quale finire di copiare (non incluso). **Default:** [`buf.length`].
* Restituisce: {integer} Il numero di byte copiati.

Copia i dati da un'area di `buf` ad un'area in `target` anche se l'area di memoria `target` si sovrappone a `buf`.

```js
// Crea due istanze `Buffer`.
const buf1 = Buffer.allocUnsafe(26);
const buf2 = Buffer.allocUnsafe(26).fill('!');

for (let i = 0; i < 26; i++) {
  // 97 è il valore ASCII decimale per 'a'
  buf1[i] = i + 97;
}

// Copia i byte `buf1` da 16 a 19 in` buf2` a partire dal byte 8 di `buf2`
buf1.copy(buf2, 8, 16, 20);

console.log(buf2.toString('ascii', 0, 25));
// Stampa: !!!!!!!!qrst!!!!!!!!!!!!!
```

```js
// Crea un `Buffer` e copia i dati da un'area in un'altra area sovrapposta all'interno dello stesso `Buffer`.

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

* Returns: {Iterator}

Creates and returns an [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) of `[index, byte]` pairs from the contents of `buf`.

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
* Returns: {boolean}

Returns `true` if both `buf` and `otherBuffer` have exactly the same bytes, `false` otherwise.

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
* `offset` {integer} Number of bytes to skip before starting to fill `buf`. **Default:** `0`.
* `end` {integer} Where to stop filling `buf` (not inclusive). **Default:** [`buf.length`].
* `encoding` {string} The encoding for `value` if `value` is a string. **Default:** `'utf8'`.
* Returns: {Buffer} A reference to `buf`.

Fills `buf` with the specified `value`. If the `offset` and `end` are not given, the entire `buf` will be filled:

```js
// Fill a `Buffer` with the ASCII character 'h'.

const b = Buffer.allocUnsafe(50).fill('h');

console.log(b.toString());
// Prints: hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
```

`value` is coerced to a `uint32` value if it is not a string or integer.

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

* `value` {string|Buffer|integer} What to search for.
* `byteOffset` {integer} Where to begin searching in `buf`. **Default:** `0`.
* `encoding` {string} If `value` is a string, this is its encoding. **Default:** `'utf8'`.
* Returns: {boolean} `true` if `value` was found in `buf`, `false` otherwise.

Equivalent to [`buf.indexOf() !== -1`][`buf.indexOf()`].

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

* `value` {string|Buffer|Uint8Array|integer} What to search for.
* `byteOffset` {integer} Where to begin searching in `buf`. **Default:** `0`.
* `encoding` {string} If `value` is a string, this is the encoding used to determine the binary representation of the string that will be searched for in `buf`. **Default:** `'utf8'`.
* Returns: {integer} The index of the first occurrence of `value` in `buf`, or `-1` if `buf` does not contain `value`.

If `value` is:

* a string, `value` is interpreted according to the character encoding in `encoding`.
* a `Buffer` or [`Uint8Array`], `value` will be used in its entirety. To compare a partial `Buffer`, use [`buf.slice()`].
* a number, `value` will be interpreted as an unsigned 8-bit integer value between `0` and `255`.

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

If `value` is not a string, number, or `Buffer`, this method will throw a `TypeError`. If `value` is a number, it will be coerced to a valid byte value, an integer between 0 and 255.

If `byteOffset` is not a number, it will be coerced to a number. If the result of coercion is `NaN` or `0`, then the entire buffer will be searched. This behavior matches [`String#indexOf()`].

```js
const b = Buffer.from('abcdef');

// Passing a value that's a number, but not a valid byte
// Prints: 2, equivalent to searching for 99 or 'c'
console.log(b.indexOf(99.9));
console.log(b.indexOf(256 + 99));

// Passing a byteOffset that coerces to NaN or 0
// Prints: 1, searching the whole buffer
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

* Returns: {Iterator}

Creates and returns an [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) of `buf` keys (indices).

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

* `value` {string|Buffer|Uint8Array|integer} What to search for.
* `byteOffset` {integer} Where to begin searching in `buf`. **Default:** [`buf.length`]`- 1`.
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

If `value` is not a string, number, or `Buffer`, this method will throw a `TypeError`. If `value` is a number, it will be coerced to a valid byte value, an integer between 0 and 255.

If `byteOffset` is not a number, it will be coerced to a number. Any arguments that coerce to `NaN`, like `{}` or `undefined`, will search the whole buffer. This behavior matches [`String#lastIndexOf()`].

```js
const b = Buffer.from('abcdef');

// Passing a value that's a number, but not a valid byte
// Prints: 2, equivalent to searching for 99 or 'c'
console.log(b.lastIndexOf(99.9));
console.log(b.lastIndexOf(256 + 99));

// Passing a byteOffset that coerces to NaN
// Prints: 1, searching the whole buffer
console.log(b.lastIndexOf('b', undefined));
console.log(b.lastIndexOf('b', {}));

// Passing a byteOffset that coerces to 0
// Prints: -1, equivalent to passing 0
console.log(b.lastIndexOf('b', null));
console.log(b.lastIndexOf('b', []));
```

If `value` is an empty string or empty `Buffer`, `byteOffset` will be returned.

### buf.length

<!-- YAML
added: v0.1.90
-->

* {integer}

Returns the amount of memory allocated for `buf` in bytes. Note that this does not necessarily reflect the amount of "usable" data within `buf`.

```js
// Create a `Buffer` and write a shorter ASCII string to it.

const buf = Buffer.alloc(1234);

console.log(buf.length);
// Prints: 1234

buf.write('some string', 0, 'ascii');

console.log(buf.length);
// Prints: 1234
```

While the `length` property is not immutable, changing the value of `length` can result in undefined and inconsistent behavior. Applications that wish to modify the length of a `Buffer` should therefore treat `length` as read-only and use [`buf.slice()`] to create a new `Buffer`.

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

* `offset` {integer} Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 8`.
* Returns: {number}

Reads a 64-bit double from `buf` at the specified `offset` with specified endian format (`readDoubleBE()` returns big endian, `readDoubleLE()` returns little endian).

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

* `offset` {integer} Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 4`.
* Returns: {number}

Reads a 32-bit float from `buf` at the specified `offset` with specified endian format (`readFloatBE()` returns big endian, `readFloatLE()` returns little endian).

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

* `offset` {integer} Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 1`.
* Returns: {integer}

Reads a signed 8-bit integer from `buf` at the specified `offset`.

Integers read from a `Buffer` are interpreted as two's complement signed values.

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

* `offset` {integer} Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 2`.
* Returns: {integer}

Reads a signed 16-bit integer from `buf` at the specified `offset` with the specified endian format (`readInt16BE()` returns big endian, `readInt16LE()` returns little endian).

Integers read from a `Buffer` are interpreted as two's complement signed values.

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

* `offset` {integer} Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 4`.
* Returns: {integer}

Reads a signed 32-bit integer from `buf` at the specified `offset` with the specified endian format (`readInt32BE()` returns big endian, `readInt32LE()` returns little endian).

Integers read from a `Buffer` are interpreted as two's complement signed values.

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

* `offset` {integer} Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Number of bytes to read. Must satisfy `0 < byteLength <= 6`.
* Returns: {integer}

Reads `byteLength` number of bytes from `buf` at the specified `offset` and interprets the result as a two's complement signed value. Supports up to 48 bits of accuracy.

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

* `offset` {integer} Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 1`.
* Returns: {integer}

Reads an unsigned 8-bit integer from `buf` at the specified `offset`.

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

* `offset` {integer} Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 2`.
* Returns: {integer}

Reads an unsigned 16-bit integer from `buf` at the specified `offset` with specified endian format (`readUInt16BE()` returns big endian, `readUInt16LE()` returns little endian).

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

* `offset` {integer} Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 4`.
* Returns: {integer}

Reads an unsigned 32-bit integer from `buf` at the specified `offset` with specified endian format (`readUInt32BE()` returns big endian, `readUInt32LE()` returns little endian).

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

* `offset` {integer} Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Number of bytes to read. Must satisfy `0 < byteLength <= 6`.
* Returns: {integer}

Reads `byteLength` number of bytes from `buf` at the specified `offset` and interprets the result as an unsigned integer. Supports up to 48 bits of accuracy.

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

* `start` {integer} Where the new `Buffer` will start. **Default:** `0`.
* `end` {integer} Where the new `Buffer` will end (not inclusive). **Default:** [`buf.length`].
* Returns: {Buffer}

Returns a new `Buffer` that references the same memory as the original, but offset and cropped by the `start` and `end` indices.

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

Specifying negative indexes causes the slice to be generated relative to the end of `buf` rather than the beginning.

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

* Returns: {Buffer} A reference to `buf`.

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

### buf.swap32()

<!-- YAML
added: v5.10.0
-->

* Returns: {Buffer} A reference to `buf`.

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

* Returns: {Buffer} A reference to `buf`.

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

Note that JavaScript cannot encode 64-bit integers. This method is intended for working with 64-bit floats.

### buf.toJSON()

<!-- YAML
added: v0.9.2
-->

* Returns: {Object}

Returns a JSON representation of `buf`. [`JSON.stringify()`] implicitly calls this function when stringifying a `Buffer` instance.

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
* `start` {integer} The byte offset to start decoding at. **Default:** `0`.
* `end` {integer} The byte offset to stop decoding at (not inclusive). **Default:** [`buf.length`].
* Returns: {string}

Decodes `buf` to a string according to the specified character encoding in `encoding`. `start` and `end` may be passed to decode only a subset of `buf`.

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

* Returns: {Iterator}

Creates and returns an [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) for `buf` values (bytes). This function is called automatically when a `Buffer` is used in a `for..of` statement.

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
* `offset` {integer} Number of bytes to skip before starting to write `string`. **Default:** `0`.
* `length` {integer} Number of bytes to write. **Default:** `buf.length - offset`.
* `encoding` {string} The character encoding of `string`. **Default:** `'utf8'`.
* Returns: {integer} Number of bytes written.

Writes `string` to `buf` at `offset` according to the character encoding in `encoding`. The `length` parameter is the number of bytes to write. If `buf` did not contain enough space to fit the entire string, only part of `string` will be written. However, partially encoded characters will not be written.

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

* `value` {number} Number to be written to `buf`.
* `offset` {integer} Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - 8`.
* Returns: {integer} `offset` plus the number of bytes written.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeDoubleBE()` writes big endian, `writeDoubleLE()` writes little endian). `value` *should* be a valid 64-bit double. Behavior is undefined when `value` is anything other than a 64-bit double.

```js
const buf = Buffer.allocUnsafe(8);

buf.writeDoubleBE(0xdeadbeefcafebabe, 0);

console.log(buf);
// Prints: <Buffer 43 eb d5 b7 dd f9 5f d7>

buf.writeDoubleLE(0xdeadbeefcafebabe, 0);

console.log(buf);
// Prints: <Buffer d7 5f f9 dd b7 d5 eb 43>
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

* `value` {number} Number to be written to `buf`.
* `offset` {integer} Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - 4`.
* Returns: {integer} `offset` plus the number of bytes written.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeFloatBE()` writes big endian, `writeFloatLE()` writes little endian). `value` *should* be a valid 32-bit float. Behavior is undefined when `value` is anything other than a 32-bit float.

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

* `value` {integer} Number to be written to `buf`.
* `offset` {integer} Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - 1`.
* Returns: {integer} `offset` plus the number of bytes written.

Writes `value` to `buf` at the specified `offset`. `value` *should* be a valid signed 8-bit integer. Behavior is undefined when `value` is anything other than a signed 8-bit integer.

`value` is interpreted and written as a two's complement signed integer.

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

* `value` {integer} Number to be written to `buf`.
* `offset` {integer} Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - 2`.
* Returns: {integer} `offset` plus the number of bytes written.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeInt16BE()` writes big endian, `writeInt16LE()` writes little endian). `value` *should* be a valid signed 16-bit integer. Behavior is undefined when `value` is anything other than a signed 16-bit integer.

`value` is interpreted and written as a two's complement signed integer.

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

* `value` {integer} Number to be written to `buf`.
* `offset` {integer} Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - 4`.
* Returns: {integer} `offset` plus the number of bytes written.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeInt32BE()` writes big endian, `writeInt32LE()` writes little endian). `value` *should* be a valid signed 32-bit integer. Behavior is undefined when `value` is anything other than a signed 32-bit integer.

`value` is interpreted and written as a two's complement signed integer.

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

* `value` {integer} Number to be written to `buf`.
* `offset` {integer} Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Number of bytes to write. Must satisfy `0 < byteLength <= 6`.
* Returns: {integer} `offset` plus the number of bytes written.

Writes `byteLength` bytes of `value` to `buf` at the specified `offset`. Supports up to 48 bits of accuracy. Behavior is undefined when `value` is anything other than a signed integer.

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

* `value` {integer} Number to be written to `buf`.
* `offset` {integer} Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - 1`.
* Returns: {integer} `offset` plus the number of bytes written.

Writes `value` to `buf` at the specified `offset`. `value` *should* be a valid unsigned 8-bit integer. Behavior is undefined when `value` is anything other than an unsigned 8-bit integer.

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

* `value` {integer} Number to be written to `buf`.
* `offset` {integer} Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - 2`.
* Returns: {integer} `offset` plus the number of bytes written.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeUInt16BE()` writes big endian, `writeUInt16LE()` writes little endian). `value` should be a valid unsigned 16-bit integer. Behavior is undefined when `value` is anything other than an unsigned 16-bit integer.

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

* `value` {integer} Number to be written to `buf`.
* `offset` {integer} Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - 4`.
* Returns: {integer} `offset` plus the number of bytes written.

Writes `value` to `buf` at the specified `offset` with specified endian format (`writeUInt32BE()` writes big endian, `writeUInt32LE()` writes little endian). `value` should be a valid unsigned 32-bit integer. Behavior is undefined when `value` is anything other than an unsigned 32-bit integer.

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

* `value` {integer} Number to be written to `buf`.
* `offset` {integer} Number of bytes to skip before starting to write. Must satisfy `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Number of bytes to write. Must satisfy `0 < byteLength <= 6`.
* Returns: {integer} `offset` plus the number of bytes written.

Writes `byteLength` bytes of `value` to `buf` at the specified `offset`. Supports up to 48 bits of accuracy. Behavior is undefined when `value` is anything other than an unsigned integer.

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

* {integer} **Default:** `50`

Returns the maximum number of bytes that will be returned when `buf.inspect()` is called. This can be overridden by user modules. See [`util.inspect()`] for more details on `buf.inspect()` behavior.

Note that this is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## buffer.kMaxLength

<!-- YAML
added: v3.0.0
-->

* {integer} The largest size allowed for a single `Buffer` instance.

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

The transcoding process will use substitution characters if a given byte sequence cannot be adequately represented in the target encoding. For instance:

```js
const buffer = require('buffer');

const newBuf = buffer.transcode(Buffer.from('€'), 'utf8', 'ascii');
console.log(newBuf.toString('ascii'));
// Prints: '?'
```

Because the Euro (`€`) sign is not representable in US-ASCII, it is replaced with `?` in the transcoded `Buffer`.

Note that this is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

## Class: SlowBuffer

<!-- YAML
deprecated: v6.0.0
-->

> Stability: 0 - Deprecated: Use [`Buffer.allocUnsafeSlow()`] instead.

Returns an un-pooled `Buffer`.

In order to avoid the garbage collection overhead of creating many individually allocated `Buffer` instances, by default allocations under 4KB are sliced from a single larger allocated object.

In the case where a developer may need to retain a small chunk of memory from a pool for an indeterminate amount of time, it may be appropriate to create an un-pooled `Buffer` instance using `SlowBuffer` then copy out the relevant bits.

```js
// Need to keep around a few small chunks of memory
const store = [];

socket.on('readable', () => {
  const data = socket.read();

  // Allocate for retained data
  const sb = SlowBuffer(10);

  // Copy the data into the new allocation
  data.copy(sb, 0, 0, 10);

  store.push(sb);
});
```

Use of `SlowBuffer` should be used only as a last resort *after* a developer has observed undue memory retention in their applications.

### new SlowBuffer(size)

<!-- YAML
deprecated: v6.0.0
-->

> Stability: 0 - Deprecated: Use [`Buffer.allocUnsafeSlow()`] instead.

* `size` {integer} The desired length of the new `SlowBuffer`.

Allocates a new `Buffer` of `size` bytes. Se `size` è maggiore di [`buffer.constants.MAX_LENGTH`] o minore di 0, viene generato [`ERR_INVALID_OPT_VALUE`]. Viene creato un `Buffer` di lunghezza zero se `size` è 0.

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

Note that `buffer.constants` is a property on the `buffer` module returned by `require('buffer')`, not on the `Buffer` global or a `Buffer` instance.

### buffer.constants.MAX_LENGTH

<!-- YAML
added: v8.2.0
-->

* {integer} The largest size allowed for a single `Buffer` instance.

On 32-bit architectures, this value is `(2^30)-1` (~1GB). On 64-bit architectures, this value is `(2^31)-1` (~2GB).

This value is also available as [`buffer.kMaxLength`][].

### buffer.constants.MAX_STRING_LENGTH

<!-- YAML
added: v8.2.0
-->

* {integer} The largest length allowed for a single `string` instance.

Represents the largest `length` that a `string` primitive can have, counted in UTF-16 code units.

This value may depend on the JS engine that is being used.