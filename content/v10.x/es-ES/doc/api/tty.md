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

## Clase: tty.ReadStream

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

* `mode` {boolean} Si es `true`, configura `tty.ReadStream` para operar como dispositivo raw. Si es `false`, configura el `tty.ReadStream` para operar en su modo por defecto. La propiedad `readStream.isRaw` será establecida en el modo definido.

## Clase: tty.WriteStream

<!-- YAML
added: v0.5.8
-->

La clase `tty.WriteStream` es una subclase de [`net.Socket`][] que representa la porción con posibilidad de ser escrita de una TTY. En circunstancias normales, [`process.stdout`][] y [`process.stderr`][] son las únicas instancias de `tty.WriteStream` creadas para un proceso Node.js y no debería haber razon para crear instancias adicionales.

### Evento: 'resize'

<!-- YAML
added: v0.7.7
-->

El evento `'resize'` se emite cuando cambian las propiedades de `writeStream.columns` o `writeStream.rows`. No se pasa ningún argumento a la función callback en espera cuando se lo invoca.

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

Un `number` que especifica el número de columnas con las que cuenta una TTY. Esta propiedad se actualiza cada vez que el evento `'resize'` es emitido.

### writeStream.isTTY

<!-- YAML
added: v0.5.8
-->

Un valor `boolean` que siempre es `true`.

### writeStream.rows

<!-- YAML
added: v0.7.7
-->

Un `number` que especifica el número de filas con las que cuenta una TTY. Esta propiedad se actualiza cada vez que el evento `'resize'` es emitido.

### writeStream.getColorDepth([env])

<!-- YAML
added: v9.9.0
-->

* `env` {Object} Un objeto que contiene las variables de ambiente a verificar. **Valor por defecto:** `process.env`.
* Retorno: {number}

Retorna:

* `1` para 2,
* `4` para 16,
* `8` para 256,
* `24` para 16,777,216 colores soportados.

Utilizar esto para determinar que colores soporta la terminal. Debido a la naturaleza de los colores en la terminal, es posible tener falsos positivos o falsos negativos. Depende de la información del proceso y las variables de ambiente que pueden informar erróneamente que terminal está siendo utilizada. Para forzar un comportamiento específico sin depender de `process.env` es posible pasar un objeto con variables diferentes.

Utilizar la variable de ambiente `NODE_DISABLE_COLORS` para forzar a esta función a siempre retornar 1.

## tty.isatty(fd)

<!-- YAML
added: v0.5.8
-->

* `fd` {number} Un descriptor numérico de archivos

El método `tty.isatty()` retorna `true` si el `fd` provisto esta asociado con una TTY, y `false` si no lo esta, incluyendo cuando `fd` es un entero no negativo.