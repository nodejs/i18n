# TTY

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

El módulo `tty` provee las clases `tty.ReadStream` y `tty.WriteStream`. En la mayoría de los casos, no será necesario o posible utilizar este módulo directamente. De hacer falta, puede ser accedido utilizando:

```js
const tty = require('tty');
```

Cuando Node.js detecta que esta siendo ejecutado con una terminal de texto ("TTY") adosada, [`process.stdin`][] será por defecto inicializado como una instancia de `tty.ReadStream` y tanto [`process.stdout`][] como [`process.stderr`][] serán por defecto, instancias de `tty.WriteStream`. El método por excelencia para determinar si Node.js esta siendo ejecutado en un contexto TTY es verificar que el valor de la propiedad `process.stdout.isTTY` sea `true`:

```sh
$ node -p -e "Boolean(process.stdout.isTTY)"
true
$ node -p -e "Boolean(process.stdout.isTTY)" | cat
false
```

En la mayoría de los casos, debería no haber razones para que una aplicación cree instancias manuales de las clases `tty.ReadStream` y `tty.WriteStream`.

## Class: tty.ReadStream

<!-- YAML
added: v0.5.8
-->

La clase `tty.ReadStream` es una subclase de [`net.Socket`][] que representa la porción legible de una TTY. En circunstancias normales, [`process.stdin`][] será la única instancia de `tty.ReadStream` en un proceso Node.js y no debería haber razón para crear instancias adicionales.

### readStream.isRaw

<!-- YAML
added: v0.7.7
-->

Un valor `boolean` que es `true` si la TTY esta configurada para operar como un dispositivo raw. Por defecto su valor es `false`.

### readStream.isTTY

<!-- YAML
added: v0.5.8
-->

Un valor `boolean` que es siempre `true` para las instancias de `tty.ReadStream`.

### readStream.setRawMode(mode)

<!-- YAML
added: v0.7.7
-->

Permite la configuración de `tty.ReadStream` de tal manera que opere como un dispositivo raw.

Cuando se encuentra en modo raw, lo ingresado siempre esta disponible caracter a caracter, no incluyendo modificadores. Adicionalmente, todo el proceso especial de caracteres por parte de la terminal esta deshabilitado, incluyendo el echo de caracteres ingresados. Notese que `CTRL`+`C` no causará un `SIGINT` en este modo.

* `mode` {boolean} Si es `true`, configura `tty.ReadStream` para operar como dispositivo raw. Si es `false`, configura el `tty.ReadStream` para operar en su modo por defecto. The `readStream.isRaw` property will be set to the resulting mode.

## Class: tty.WriteStream

<!-- YAML
added: v0.5.8
-->

The `tty.WriteStream` class is a subclass of [`net.Socket`][] that represents the writable side of a TTY. In normal circumstances, [`process.stdout`][] and [`process.stderr`][] will be the only `tty.WriteStream` instances created for a Node.js process and there should be no reason to create additional instances.

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

A `number` specifying the number of columns the TTY currently has. This property is updated whenever the `'resize'` event is emitted.

### writeStream.isTTY

<!-- YAML
added: v0.5.8
-->

A `boolean` that is always `true`.

### writeStream.rows

<!-- YAML
added: v0.7.7
-->

A `number` specifying the number of rows the TTY currently has. This property is updated whenever the `'resize'` event is emitted.

### writeStream.getColorDepth([env])

<!-- YAML
added: v9.9.0
-->

* `env` {Object} An object containing the environment variables to check. **Default:** `process.env`.
* Returns: {number}

Returns:

* `1` for 2,
* `4` for 16,
* `8` for 256,
* `24` for 16,777,216 colors supported.

Use this to determine what colors the terminal supports. Due to the nature of colors in terminals it is possible to either have false positives or false negatives. It depends on process information and the environment variables that may lie about what terminal is used. To enforce a specific behavior without relying on `process.env` it is possible to pass in an object with different settings.

Use the `NODE_DISABLE_COLORS` environment variable to enforce this function to always return 1.

## tty.isatty(fd)

<!-- YAML
added: v0.5.8
-->

* `fd` {number} A numeric file descriptor

The `tty.isatty()` method returns `true` if the given `fd` is associated with a TTY and `false` if it is not, including whenever `fd` is not a non-negative integer.