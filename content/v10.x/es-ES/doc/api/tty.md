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

## Clase: tty.ReadStream
<!-- YAML
added: v0.5.8
-->

La clase `tty.ReadStream` es una subclase de [`net.Socket`][] que representa el lado legible de un TTY. En circunstancias normales, [`process.stdin`][] será la única instancia `tty.ReadStream` en un proceso de Node.js y no debería haber ningún motivo para crear instancias adicionales.

### readStream.isRaw
<!-- YAML
added: v0.7.7
-->

Un `boolean` que es `true` si la TTY está configurada para operar como un dispositivo raw. Por defecto su valor es `false`.

### readStream.isTTY
<!-- YAML
added: v0.5.8
-->

Un `boolean` que siempre es `true` para las instancias de `tty.ReadStream` .

### readStream.setRawMode(mode)
<!-- YAML
added: v0.7.7
-->

* `mode` {boolean} Si es `true`, configura `tty.ReadStream` para operar como un dispositivo raw. Si es `false`, configura el `tty.ReadStream` para operar en su modo predeterminado. La propiedad `readStream.isRaw` será establecida al modo resultante.
* Returns: {this} - the read stream instance.

Permite la configuración de `tty.ReadStream` para que opere como un dispositivo raw.

Cuando se encuentra en modo raw, la entrada siempre está disponible carácter por carácter, sin incluir a los modificadores. Además, todos los caracteres de procesamiento especial del terminal están deshabilitados, incluyendo el echo de caracteres de entrada. Tenga en cuenta que `CTRL`+`C` ya no causará un `SIGINT` en este modo.

## Clase: tty.WriteStream
<!-- YAML
added: v0.5.8
-->

La clase `tty.WriteStream` es una subclase de [`net.Socket`][] que representa la porción con posibilidad de ser escrita de una TTY. En circunstancias normales, [`process.stdout`][] y [`process.stderr`][] serán las únicas instancias de `tty.WriteStream` creadas para un proceso de Node.js y no debería haber ningún motivo para crear instancias adicionales.

### Evento: 'resize'
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

### writeStream.clearLine(dir)
<!-- YAML
added: v0.7.7
-->

* `dir` {number}
  * `-1` - a la izquierda del cursor
  * `1` - a la derecha del cursor
  * `0` - toda la línea

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

Un `number` que especifica el número de columnas que posee actualmente un TTY. Esta propiedad se actualiza cada vez que se emite el evento `'resize'` .

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

* `env` {Object} Un objeto que contiene las variables de ambiente a verificar. **Valor por defecto:** `process.env`.
* Devuelve: {number}

Retorna:
* `1` para 2,
* `4` para 16,
* `8` para 256,
* `24` para 16,777,216 colores soportados.

Utilizar esto para determinar que colores soporta la terminal. Debido a la naturaleza de los colores en la terminal, es posible tener falsos positivos o falsos negativos. Depende de la información del proceso y las variables de ambiente que pueden informar erróneamente que terminal está siendo utilizada. Para forzar un comportamiento específico sin depender de `process.env` es posible pasar un objeto con variables diferentes.

Utilizar la variable de ambiente `NODE_DISABLE_COLORS` para forzar a esta función a siempre retornar 1.

### writeStream.getWindowSize()
<!-- YAML
added: v0.7.7
-->
* Devuelve: {number[]}

`writeStream.getWindowSize()` returns the size of the [TTY](tty.html) corresponding to this `WriteStream`. The array is of the type `[numColumns, numRows]` where `numColumns` and `numRows` represent the number of columns and rows in the corresponding [TTY](tty.html).

### writeStream.hasColors(\[count\]\[, env\])
<!-- YAML
added: v10.16.0
-->

* `count` {integer} The number of colors that are requested (minimum 2). **Predeterminado:** 16.
* `env` {Object} Un objeto que contiene las variables de ambiente a verificar. This enables simulating the usage of a specific terminal. **Predeterminado:** `process.env`.
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

### writeStream.isTTY
<!-- YAML
added: v0.5.8
-->

Un `boolean` que siempre es `true`.

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

Un `number` que especifica el número de filas que posee actualmente un TTY. Esta propiedad se actualiza cada vez que se emite el evento `'resize'` .

## tty.isatty(fd)
<!-- YAML
added: v0.5.8
-->

* `fd` {number} Un descriptor numérico de archivos

El método `tty.isatty()` retorna `true` si el `fd` provisto esta asociado con una TTY, y `false` si no lo esta, incluyendo cuando `fd` es un entero no negativo.
