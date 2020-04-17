# TTY

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Il modulo `tty` fornisce le classi `tty.ReadStream` e `tty.WriteStream`. Nella maggior parte dei casi, non sarà necessario né possibile utilizzare direttamente questo modulo. Tuttavia, ci si può accedere utilizzando:

```js
const tty = require('tty');
```

Quando Node.js rileva che è in fase di esecuzione con un terminale di testo ("TTY") associato, [`process.stdin`][] verrà, di default, inizializzato come istanza di `tty.ReadStream` e sia [`process.stdout`][] che [`process.stderr`][] saranno, di default, istanze di `tty.WriteStream`. Il metodo migliore per determinare se Node.js sia in esecuzione in un contesto TTY è controllare che il valore della proprietà `process.stdout.isTTY` sia `true`:

```sh
$ node -p -e "Boolean(process.stdout.isTTY)"
true
$ node -p -e "Boolean(process.stdout.isTTY)" | cat
false
```

Nella maggior parte dei casi, non ci dovrebbe essere alcun motivo per cui un'applicazione debba creare manualmente istanze delle classi `tty.ReadStream` e `tty.WriteStream`.

## Class: `tty.ReadStream`
<!-- YAML
added: v0.5.8
-->

* Extends: {net.Socket}

Represents the readable side of a TTY. In normal circumstances [`process.stdin`][] will be the only `tty.ReadStream` instance in a Node.js process and there should be no reason to create additional instances.

### `readStream.isRaw`
<!-- YAML
added: v0.7.7
-->

Un `boolean` che è `true` se il TTY è attualmente configurato per funzionare come dispositivo non elaborato. Il valore predefinito è `false`.

### `readStream.isTTY`
<!-- YAML
added: v0.5.8
-->

Un `boolean` che è sempre `true` per le istanze `tty.ReadStream`.

### `readStream.setRawMode(mode)`
<!-- YAML
added: v0.7.7
-->

* `mode` {boolean} Se `true`, configura il `tty.ReadStream` per funzionare come dispositivo raw. Se `false`, configura il `tty.ReadStream` per funzionare nella sua modalità predefinita. La proprietà `readStream.isRaw` verrà impostata sulla modalità risultante.
* Returns: {this} The read stream instance.

Consente la configurazione di `tty.ReadStream` in modo che funzioni come dispositivo raw.

Quando è in modalità raw, l'input è sempre disponibile carattere per carattere, ad esclusione dei modificatori. Inoltre, tutte le elaborazioni speciali dei caratteri da parte del terminale sono disabilitate, inclusi i caratteri di input con eco. `CTRL`+`C` will no longer cause a `SIGINT` when in this mode.

## Class: `tty.WriteStream`
<!-- YAML
added: v0.5.8
-->

* Extends: {net.Socket}

Represents the writable side of a TTY. In normal circumstances, [`process.stdout`][] and [`process.stderr`][] will be the only `tty.WriteStream` instances created for a Node.js process and there should be no reason to create additional instances.

### Event: `'resize'`
<!-- YAML
added: v0.7.7
-->

L'evento `'resize'` viene emesso ogni volta che una delle proprietà `writeStream.columns` o `writeStream.rows` viene modificata. Non viene passato nessun argomento al callback del listener quando viene chiamato.

```js
process.stdout.on('resize', () => {
  console.log('screen size has changed!');
  console.log(`${process.stdout.columns}x${process.stdout.rows}`);
});
```

### `writeStream.clearLine(dir[, callback])`
<!-- YAML
added: v0.7.7
changes:
  - version: v12.7.0
    pr-url: https://github.com/nodejs/node/pull/28721
    description: The stream's write() callback and return value are exposed.
-->

* `dir` {number}
  * `-1`: to the left from cursor
  * `1`: to the right from cursor
  * `0`: the entire line
* `callback` {Function} Invoked once the operation completes.
* Returns: {boolean} `false` if the stream wishes for the calling code to wait for the `'drain'` event to be emitted before continuing to write additional data; otherwise `true`.

`writeStream.clearLine()` clears the current line of this `WriteStream` in a direction identified by `dir`.

### `writeStream.clearScreenDown([callback])`
<!-- YAML
added: v0.7.7
changes:
  - version: v12.7.0
    pr-url: https://github.com/nodejs/node/pull/28721
    description: The stream's write() callback and return value are exposed.
-->

* `callback` {Function} Invoked once the operation completes.
* Returns: {boolean} `false` if the stream wishes for the calling code to wait for the `'drain'` event to be emitted before continuing to write additional data; otherwise `true`.

`writeStream.clearScreenDown()` clears this `WriteStream` from the current cursor down.

### `writeStream.columns`
<!-- YAML
added: v0.7.7
-->

Un `number` che specifica il numero di colonne che il TTY possiede attualmente. Questa proprietà viene aggiornata ogni volta che l'evento `'resize'` viene emesso.

### `writeStream.cursorTo(x[, y][, callback])`
<!-- YAML
added: v0.7.7
changes:
  - version: v12.7.0
    pr-url: https://github.com/nodejs/node/pull/28721
    description: The stream's write() callback and return value are exposed.
-->

* `x` {number}
* `y` {number}
* `callback` {Function} Invoked once the operation completes.
* Returns: {boolean} `false` if the stream wishes for the calling code to wait for the `'drain'` event to be emitted before continuing to write additional data; otherwise `true`.

`writeStream.cursorTo()` moves this `WriteStream`'s cursor to the specified position.

### `writeStream.getColorDepth([env])`
<!-- YAML
added: v9.9.0
-->

* `env` {Object} Un object contenente le variabili d'ambiente da controllare. This enables simulating the usage of a specific terminal. **Default:** `process.env`.
* Restituisce: {number}

Restituisce:

* `1` per 2,
* `4` per 16,
* `8` per 256,
* `24` for 16,777,216 colors supported.

Da utilizzare per determinare quali colori supporta il terminale. Due to the nature of colors in terminals it is possible to either have false positives or false negatives. It depends on process information and the environment variables that may lie about what terminal is used. It is possible to pass in an `env` object to simulate the usage of a specific terminal. This can be useful to check how specific environment settings behave.

To enforce a specific color support, use one of the below environment settings.

* 2 colors: `FORCE_COLOR = 0` (Disables colors)
* 16 colors: `FORCE_COLOR = 1`
* 256 colors: `FORCE_COLOR = 2`
* 16,777,216 colors: `FORCE_COLOR = 3`

Disabling color support is also possible by using the `NO_COLOR` and `NODE_DISABLE_COLORS` environment variables.

### `writeStream.getWindowSize()`
<!-- YAML
added: v0.7.7
-->

* Restituisce: {number[]}

`writeStream.getWindowSize()` returns the size of the [TTY](tty.html) corresponding to this `WriteStream`. The array is of the type `[numColumns, numRows]` where `numColumns` and `numRows` represent the number of columns and rows in the corresponding [TTY](tty.html).

### `writeStream.hasColors([count][, env])`
<!-- YAML
added: v11.13.0
-->

* `count` {integer} The number of colors that are requested (minimum 2). **Default:** 16.
* `env` {Object} Un object contenente le variabili d'ambiente da controllare. This enables simulating the usage of a specific terminal. **Default:** `process.env`.
* Restituisce: {boolean}

Returns `true` if the `writeStream` supports at least as many colors as provided in `count`. Minimum support is 2 (black and white).

This has the same false positives and negatives as described in [`writeStream.getColorDepth()`][].

```js
process.stdout.hasColors();
// Returns true or false depending on if `stdout` supports at least 16 colors.
process.stdout.hasColors(256);
// Returns true or false depending on if `stdout` supports at least 256 colors.
process.stdout.hasColors({ TMUX: '1' });
// Returns true.
process.stdout.hasColors(2 ** 24, { TMUX: '1' });
// Returns false (the environment setting pretends to support 2 ** 8 colors).
```

### `writeStream.isTTY`
<!-- YAML
added: v0.5.8
-->

Un `boolean` che è sempre `true`.

### `writeStream.moveCursor(dx, dy[, callback])`
<!-- YAML
added: v0.7.7
changes:
  - version: v12.7.0
    pr-url: https://github.com/nodejs/node/pull/28721
    description: The stream's write() callback and return value are exposed.
-->

* `dx` {number}
* `dy` {number}
* `callback` {Function} Invoked once the operation completes.
* Returns: {boolean} `false` if the stream wishes for the calling code to wait for the `'drain'` event to be emitted before continuing to write additional data; otherwise `true`.

`writeStream.moveCursor()` moves this `WriteStream`'s cursor *relative* to its current position.

### `writeStream.rows`
<!-- YAML
added: v0.7.7
-->

Un `number` che specifica il numero di righe che il TTY possiede attualmente. Questa proprietà viene aggiornata ogni volta che l'evento `'resize'` viene emesso.

## `tty.isatty(fd)`
<!-- YAML
added: v0.5.8
-->

* `fd` {number} Un descrittore di file numerico
* Restituisce: {boolean}

Il metodo `tty.isatty()` restituisce `true` se il `fd` indicato è associato con un TTY e `false` se non lo è, compreso quando `fd` non è un numero intero non negativo.
