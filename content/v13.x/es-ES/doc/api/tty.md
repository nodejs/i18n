# TTY

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

El módulo `tty` proporciona las clases `tty.ReadStream` y `tty.WriteStream` . En la mayoría de los casos, no será necesario o posible utilizar este módulo directamente. Sin embargo, puede ser accedido utilizando:

```js
const tty = require('tty');
```

Cuando Node.js detecta que está siendo ejecutado con una terminal de texto ("TTY") adjuntada, [`process.stdin`][] será, por defecto, inicializado como una instancia de `tty.ReadStream` y tanto [`process.stdout`][] como [`process.stderr`][] serán por defecto, instancias de `tty.WriteStream`. El método preferido para determinar si Node.js está siendo ejecutado dentro de un contexto de TTY es verificar que el valor de la propiedad `process.stdout.isTTY` sea `true`:

```sh
$ node -p -e "Boolean(process.stdout.isTTY)"
true
$ node -p -e "Boolean(process.stdout.isTTY)" | cat
false
```

En la mayoría de los casos, no debería haber motivos para que una aplicación cree manualmente instancias de las clases `tty.ReadStream` y `tty.WriteStream` .

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

Un `boolean` que es `true` si la TTY está configurada para operar como un dispositivo raw. Por defecto es `false`.

### `readStream.isTTY`
<!-- YAML
added: v0.5.8
-->

Un `boolean` que siempre es `true` para las instancias de `tty.ReadStream` .

### `readStream.setRawMode(mode)`
<!-- YAML
added: v0.7.7
-->

* `mode` {boolean} Si es `true`, configura `tty.ReadStream` para operar como un dispositivo raw. Si es `false`, configura el `tty.ReadStream` para operar en su modo predeterminado. La propiedad `readStream.isRaw` será establecida al modo resultante.
* Returns: {this} The read stream instance.

Permite la configuración de `tty.ReadStream` para que opere como un dispositivo raw.

Cuando se encuentra en modo raw, la entrada siempre está disponible carácter por carácter, sin incluir a los modificadores. Además, todos los caracteres de procesamiento especial del terminal están deshabilitados, incluyendo el echo de caracteres de entrada. `CTRL`+`C` will no longer cause a `SIGINT` when in this mode.

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

El evento `'resize'` se emite cuando han cambiado las propiedades de `writeStream.columns` o `writeStream.rows` . No se pasa ningún argumento al callback del listener cuando es llamado.

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

Un `number` que especifica el número de columnas que posee actualmente un TTY. Esta propiedad se actualiza cada vez que se emite el evento `'resize'` .

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

* `env` {Object} Un objeto que contiene las variables de ambiente a verificar. This enables simulating the usage of a specific terminal. **Default:** `process.env`.
* Devuelve: {number}

Retorna:

* `1` para 2,
* `4` para 16,
* `8` para 256,
* `24` for 16,777,216 colors supported.

Utilizar esto para determinar que colores soporta la terminal. Due to the nature of colors in terminals it is possible to either have false positives or false negatives. It depends on process information and the environment variables that may lie about what terminal is used. It is possible to pass in an `env` object to simulate the usage of a specific terminal. This can be useful to check how specific environment settings behave.

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

* Devuelve: {number[]}

`writeStream.getWindowSize()` returns the size of the [TTY](tty.html) corresponding to this `WriteStream`. The array is of the type `[numColumns, numRows]` where `numColumns` and `numRows` represent the number of columns and rows in the corresponding [TTY](tty.html).

### `writeStream.hasColors([count][, env])`
<!-- YAML
added: v11.13.0
-->

* `count` {integer} The number of colors that are requested (minimum 2). **Default:** 16.
* `env` {Object} Un objeto que contiene las variables de ambiente a verificar. This enables simulating the usage of a specific terminal. **Default:** `process.env`.
* Devuelve: {boolean}

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

Un `boolean` que siempre es `true`.

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

Un `number` que especifica el número de filas que posee actualmente un TTY. Esta propiedad se actualiza cada vez que se emite el evento `'resize'` .

## `tty.isatty(fd)`
<!-- YAML
added: v0.5.8
-->

* `fd` {number} Un descriptor numérico de archivos
* Devuelve: {boolean}

El método `tty.isatty()` devuelve `true` si el `fd` dado está asociado a una TTY, y `false` si no lo está, incluyendo cuando `fd` no sea un entero no negativo.
