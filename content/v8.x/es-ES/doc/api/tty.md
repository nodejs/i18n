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

Permite la configuración de `tty.ReadStream` para que opere como un dispositivo raw.

Cuando se encuentra en modo raw, la entrada siempre está disponible carácter por carácter, sin incluir a los modificadores. Además, todos los caracteres de procesamiento especial del terminal están deshabilitados, incluyendo el echo de caracteres de entrada. Tenga en cuenta que `CTRL`+`C` ya no causará un `SIGINT` en este modo.

* `mode` {boolean} Si es `true`, configura `tty.ReadStream` para operar como un dispositivo raw. Si es `false`, configura el `tty.ReadStream` para operar en su modo predeterminado. La propiedad `readStream.isRaw` será establecida al modo resultante.

## Clase: tty.WriteStream
<!-- YAML
added: v0.5.8
-->

La clase `tty.WriteStream` es una subclase de `net.Socket` que representa el lado editable de una TTY. En circunstancias normales, [`process.stdout`][] y [`process.stderr`][] serán las únicas instancias de `tty.WriteStream` creadas para un proceso de Node.js y no debería haber ningún motivo para crear instancias adicionales.

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

### writeStream.columns
<!-- YAML
added: v0.7.7
-->

Un `number` que especifica el número de columnas que posee actualmente un TTY. Esta propiedad se actualiza cada vez que se emite el evento `'resize'` .

### writeStream.isTTY
<!-- YAML
added: v0.5.8
-->

Un `boolean` que siempre es `true`.

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
