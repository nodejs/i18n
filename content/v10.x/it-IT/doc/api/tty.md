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

## Class: tty.ReadStream
<!-- YAML
added: v0.5.8
-->

La classe `tty.ReadStream` è una sottoclasse di [`net.Socket`][] che rappresenta il lato leggibile di un TTY. In circostanze normali [`process.stdin`][] sarà l'unica istanza `tty.ReadStream` in un processo di Node.js e non ci dovrebbero essere alcun motivo per creare istanze aggiuntive.

### readStream.isRaw
<!-- YAML
added: v0.7.7
-->

Un `boolean` che è `true` se il TTY è attualmente configurato per funzionare come dispositivo non elaborato. Il valore predefinito è `false`.

### readStream.isTTY
<!-- YAML
added: v0.5.8
-->

Un `boolean` che è sempre `true` per le istanze `tty.ReadStream`.

### readStream.setRawMode(mode)
<!-- YAML
added: v0.7.7
-->

* `mode` {boolean} Se `true`, configura il `tty.ReadStream` per funzionare come dispositivo raw. Se `false`, configura il `tty.ReadStream` per funzionare nella sua modalità predefinita. La proprietà `readStream.isRaw` verrà impostata sulla modalità risultante.
* Returns: {this} - the read stream instance.

Consente la configurazione di `tty.ReadStream` in modo che funzioni come dispositivo raw.

Quando è in modalità raw, l'input è sempre disponibile carattere per carattere, ad esclusione dei modificatori. Inoltre, tutte le elaborazioni speciali dei caratteri da parte del terminale sono disabilitate, inclusi i caratteri di input con eco. Notare che `CTRL`+`C` non causerà più un `SIGINT` in questa modalità.

## Class: tty.WriteStream
<!-- YAML
added: v0.5.8
-->

The `tty.WriteStream` class is a subclass of [`net.Socket`][] that represents the writable side of a TTY. In circostanze normali, [`process.stdout`][] e [`process.stderr`][] saranno le uniche istanze `tty.WriteStream` create per un processo di Node.js e non ci dovrebbero essere alcun motivo per creare istanze aggiuntive.

### Event: 'resize'
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

### writeStream.clearLine(dir)
<!-- YAML
added: v0.7.7
-->

* `dir` {number}
  * `-1` - a sinistra rispetto al cursore
  * `1` - a destra rispetto al cursore
  * `0` - la linea intera

`writeStream.clearLine()` clears the current line of this `WriteStream` in a direction identified by `dir`.

### writeStream.clearScreenDown()
<!-- YAML
added: v0.7.7
-->

`writeStream.clearScreenDown()` clears this `WriteStream` from the current cursor down.

### writeStream.columns
<!-- YAML
added: v0.7.7
-->

Un `number` che specifica il numero di colonne che il TTY possiede attualmente. Questa proprietà viene aggiornata ogni volta che l'evento `'resize'` viene emesso.

### writeStream.cursorTo(x, y)
<!-- YAML
added: v0.7.7
-->

* `x` {number}
* `y` {number}

`writeStream.cursorTo()` moves this `WriteStream`'s cursor to the specified position.

### writeStream.getColorDepth([env])
<!-- YAML
added: v9.9.0
-->

* `env` {Object} An object containing the environment variables to check. **Default:** `process.env`.
* Restituisce: {number}

Returns:
* `1` for 2,
* `4` for 16,
* `8` for 256,
* `24` for 16,777,216 colors supported.

Use this to determine what colors the terminal supports. Due to the nature of colors in terminals it is possible to either have false positives or false negatives. It depends on process information and the environment variables that may lie about what terminal is used. To enforce a specific behavior without relying on `process.env` it is possible to pass in an object with different settings.

Use the `NODE_DISABLE_COLORS` environment variable to enforce this function to always return 1.

### writeStream.getWindowSize()
<!-- YAML
added: v0.7.7
-->
* Returns: {number[]}

`writeStream.getWindowSize()` returns the size of the [TTY](tty.html) corresponding to this `WriteStream`. The array is of the type `[numColumns, numRows]` where `numColumns` and `numRows` represent the number of columns and rows in the corresponding [TTY](tty.html).

### writeStream.hasColors(\[count\]\[, env\])
<!-- YAML
added: v10.16.0
-->

* `count` {integer} The number of colors that are requested (minimum 2). **Default:** 16.
* `env` {Object} An object containing the environment variables to check. This enables simulating the usage of a specific terminal. **Default:** `process.env`.
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

### writeStream.isTTY
<!-- YAML
added: v0.5.8
-->

Un `boolean` che è sempre `true`.

### writeStream.moveCursor(dx, dy)
<!-- YAML
added: v0.7.7
-->

* `dx` {number}
* `dy` {number}

`writeStream.moveCursor()` moves this `WriteStream`'s cursor *relative* to its current position.

### writeStream.rows
<!-- YAML
added: v0.7.7
-->

Un `number` che specifica il numero di righe che il TTY possiede attualmente. Questa proprietà viene aggiornata ogni volta che l'evento `'resize'` viene emesso.

## tty.isatty(fd)
<!-- YAML
added: v0.5.8
-->

* `fd` {number} Un descrittore di file numerico

Il metodo `tty.isatty()` restituisce `true` se il `fd` indicato è associato con un TTY e `false` se non lo è, compreso quando `fd` non è un numero intero non negativo.
