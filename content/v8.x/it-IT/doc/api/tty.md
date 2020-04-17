# TTY

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Il modulo `tty` fornisce le classi `tty.ReadStream` e `tty.WriteStream`. Nella maggior parte dei casi, non sarà necessario né possibile utilizzare direttamente questo modulo. Tuttavia, ci si può accedere utilizzando:

```js
const tty = require('tty');
```

When Node.js detects that it is being run with a text terminal ("TTY") attached, [`process.stdin`][] will, by default, be initialized as an instance of `tty.ReadStream` and both [`process.stdout`][] and [`process.stderr`][] will, by default be instances of `tty.WriteStream`. The preferred method of determining whether Node.js is being run within a TTY context is to check that the value of the `process.stdout.isTTY` property is `true`:

```sh
$ node -p -e "Boolean(process.stdout.isTTY)"
true
$ node -p -e "Boolean(process.stdout.isTTY)" | cat
false
```

In most cases, there should be little to no reason for an application to manually create instances of the `tty.ReadStream` and `tty.WriteStream` classes.

## Class: tty.ReadStream

<!-- YAML
added: v0.5.8
-->

The `tty.ReadStream` class is a subclass of [`net.Socket`][] that represents the readable side of a TTY. In normal circumstances [`process.stdin`][] will be the only `tty.ReadStream` instance in a Node.js process and there should be no reason to create additional instances.

### readStream.isRaw

<!-- YAML
added: v0.7.7
-->

A `boolean` that is `true` if the TTY is currently configured to operate as a raw device. Il valore predefinito è `false`.

### readStream.isTTY

<!-- YAML
added: v0.5.8
-->

Un `boolean` che è sempre `true` per le istanze `tty.ReadStream`.

### readStream.setRawMode(mode)

<!-- YAML
added: v0.7.7
-->

Consente la configurazione di `tty.ReadStream` in modo che funzioni come dispositivo raw.

When in raw mode, input is always available character-by-character, not including modifiers. Additionally, all special processing of characters by the terminal is disabled, including echoing input characters. Notare che `CTRL`+`C` non causerà più un `SIGINT` in questa modalità.

* `mode` {boolean} If `true`, configures the `tty.ReadStream` to operate as a raw device. If `false`, configures the `tty.ReadStream` to operate in its default mode. The `readStream.isRaw` property will be set to the resulting mode.

## Class: tty.WriteStream

<!-- YAML
added: v0.5.8
-->

The `tty.WriteStream` class is a subclass of `net.Socket` that represents the writable side of a TTY. In normal circumstances, [`process.stdout`][] and [`process.stderr`][] will be the only `tty.WriteStream` instances created for a Node.js process and there should be no reason to create additional instances.

### Event: 'resize'

<!-- YAML
added: v0.7.7
-->

The `'resize'` event is emitted whenever either of the `writeStream.columns` or `writeStream.rows` properties have changed. No arguments are passed to the listener callback when called.

```js
process.stdout.on('resize', () => {
  console.log('screen size has changed!');
  console.log(`${process.stdout.columns}x${process.stdout.rows}`);
});
```

### writeStream.columns

<!-- YAML
added: v0.7.7
-->

Un `number` che specifica il numero di colonne che il TTY possiede attualmente. This property is updated whenever the `'resize'` event is emitted.

### writeStream.isTTY

<!-- YAML
added: v0.5.8
-->

Un `boolean` che è sempre `true`.

### writeStream.rows

<!-- YAML
added: v0.7.7
-->

Un `number` che specifica il numero di righe che il TTY possiede attualmente. This property is updated whenever the `'resize'` event is emitted.

## tty.isatty(fd)

<!-- YAML
added: v0.5.8
-->

* `fd` {number} Un descrittore di file numerico

The `tty.isatty()` method returns `true` if the given `fd` is associated with a TTY and `false` if it is not, including whenever `fd` is not a non-negative integer.