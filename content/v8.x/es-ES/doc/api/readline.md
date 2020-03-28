# Readline

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

El módulo `readline` proporciona una interfaz para la lectura de datos desde un stream [Legible](stream.html#stream_readable_streams) (tal como [`process.stdin`]), una línea a la vez. Se puede acceder a él utilizando:

```js
const readline = require('readline');
```

En el siguiente ejemplo se ilustra el uso básico del módulo `readline`.

```js
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('What do you think of Node.js? ', (answer) => {
  // TODO: Registre la respuesta en una base de datos
  console.log(`Thank you for your valuable feedback: ${answer}`);

  rl.close();
});
```

*Note*: Once this code is invoked, the Node.js application will not terminate until the `readline.Interface` is closed because the interface waits for data to be received on the `input` stream.

## Clase: Interfaz

<!-- YAML
added: v0.1.104
-->

Las instancias de la clase `readline.Interface` se construyen utilizando el método `readline.createInterface()`. Cada instancia está asociada con un stream [Legible](stream.html#stream_readable_streams) de `input` sencillo y un stream [Escribible](stream.html#stream_writable_streams) de `output` sencillo. El stream de `output` se utiliza para imprimir prompts para el input ingresado por el usuario en, y que es leído desde, el stream de `input`.

### Evento: 'close'

<!-- YAML
added: v0.1.98
-->

El evento `close` se emite cuando ocurre uno de los siguientes casos:

* El método `rl.close()` es llamado y la instancia de `readline.Interface` ha renunciado al control sobre los streams de `input` y `output`;
* El stream de `input` recibe su evento `'end'`;
* El stream de `input` recibe `<ctrl>-D` para señalar el final de la transmisión (EOT, por sus siglas en inglés);
* El stream de `input` recibe `<ctrl>-C` para señalar `SIGINT` y no hay ningún listener del evento `SIGINT` registrado en la instancia de `readline.Interface`.

La función del listener es llamada sin pasar ningún argumento.

La instancia de `readline.Interface` se da por finalizada una vez que el evento `'close'` es emitido.

### Evento: 'line'

<!-- YAML
added: v0.1.98
-->

El evento `'line'` es emitido cuando el stream de `input` recibe una entrada de final de línea (`\n`, `\r`, o `\r\n`). Esto ocurre usualmente cuando el usuario presiona las teclas `<Enter>` o `<Return>`.

La función del listener es llamada con una string que contiene la línea única de la entrada recibida.

For example:

```js
rl.on('line', (input) => {
  console.log(`Received: ${input}`);
});
```

### Evento: 'pause'

<!-- YAML
added: v0.7.5
-->

El evento `'pause'` es emitido cuando ocurre uno de los siguientes casos:

* El stream de `input` es pausado.
* El stream de `input` no se encuentra pausado y recibe el evento `SIGCONT`. (Vea los eventos [`SIGTSTP`][] y [`SIGCONT`][])

La función del listener es llamada sin pasar ningún argumento.

For example:

```js
rl.on('pause', () => {
  console.log('Readline paused.');
});
```

### Evento: 'resume'

<!-- YAML
added: v0.7.5
-->

El evento `'resume'` es emitido cada vez que el stream de `input` es reanudado.

La función del listener es llamada sin pasar ningún argumento.

```js
rl.on('resume', () => {
  console.log('Readline resumed.');
});
```

### Evento: 'SIGCONT'

<!-- YAML
added: v0.7.5
-->

The `'SIGCONT'` event is emitted when a Node.js process previously moved into the background using `<ctrl>-Z` (i.e. `SIGTSTP`) is then brought back to the foreground using fg(1p).

Si el stream de `input` fue pausado *antes* de la solicitud de `SIGTSTP`, este evento no será emitido.

La función del listener es invocada sin pasar ningún argumento.

For example:

```js
rl.on('SIGCONT', () => {
  // `prompt` resumirá automáticamente el stream
  rl.prompt();
});
```

*Nota*: El evento `'SIGCONT'` *no* es soportado en Windows.

### Evento: 'SIGINT'

<!-- YAML
added: v0.3.0
-->

El evento `'SIGINT'` es emitido cada vez que el stream de `input` recibe una entrada de `<ctrl>-C`, conocida típicamente como `SIGINT`. Si no hay ningún listener del evento `'SIGINT'` registrado cuando el stream de `input` reciba un `SIGINT`, el evento `'pause'` será emitido.

La función oyente es invocada sin pasar ningún argumento.

For example:

```js
rl.on('SIGINT', () => {
  rl.question('Are you sure you want to exit? ', (answer) => {
    if (answer.match(/^y(es)?$/i)) rl.pause();
  });
});
```

### Evento: 'SIGTSTP'

<!-- YAML
added: v0.7.5
-->

El evento `'SIGTSTP'` es emitido cuando el stream de `input` recibe una entrada de `<ctrl>-Z`, típicamente conocida como `SIGTSTP`. Si no hay ningún listener del evento `SIGTSTP` registrado cuando el stream de `input` reciba un `SIGTSTP`, el proceso de Node.js será puesto en segundo plano.

When the program is resumed using fg(1p), the `'pause'` and `SIGCONT` events will be emitted. Estos pueden ser utilizados para reanudar el stream de `input`.

Los eventos `'pause'` y `'SIGCONT'` no serán emitidos si el `input` fue pausado antes de que el proceso fuese enviado al segundo plano.

La función oyente es invocada sin pasar ningún argumento.

For example:

```js
rl.on('SIGTSTP', () => {
  // Esto reemplazará a SIGTSTP y prevendrá que el programa se vaya al
  // segundo plano.
  console.log('Caught SIGTSTP.');
});
```

*Nota*: El evento `'SIGTSTP'` *no* es soportado en Windows.

### rl.close()

<!-- YAML
added: v0.1.98
-->

El método `rl.close()` cierra la instancia de `readline.Interface` y renuncia al control sobre los streams de `input` y `output`. Cuando sea llamado, se emitirá el evento `'close'`.

### rl.pause()

<!-- YAML
added: v0.3.4
-->

El método `rl.pause()` pausa el stream de `input`, permitiendo que se reanude más adelante si es necesario.

Llamar a `rl.pause()` no pausa inmediatamente la emisión de otros eventos por la instancia de `readline.Interface` (incluyendo `'line'`).

### rl.prompt([preserveCursor])

<!-- YAML
added: v0.1.98
-->

* `preserveCursor` {boolean} Si es `true`, evita que la colocación del cursor sea restablecida a `0`.

El método `rl.prompt()` escribe el `prompt` configurado de las instancias de `readline.Interface` en una nueva línea en el `output`, para proporcionar a un usuario una nueva ubicación en la cual suministrar el input.

Cuando sea llamado, `rl.prompt()` reanudará el stream de `input` si este ha sido pausado.

Si la `readline.Interface` fue creada con el `output` establecido como `null` o `undefined`, el prompt no es escrito.

### rl.question(query, callback)

<!-- YAML
added: v0.3.3
-->

* `query` {string} Una declaración o consulta a escribir al `output`, antepuesta al prompt.
* `callback` {Function} Una función callback que es invocada con el input del usuario en respuesta a la `query`.

El método `rl.question()` muestra la `query`, escribiéndola al `output`, espera a que el usuario proporcione una entrada en `input`, y luego invoca la función `callback`, pasando la entrada proporcionada como el primer argumento.

Al ser llamada, `rl.question()` reanudará el stream de `input` si este ha sido pausado.

Si la `readline.Interface` fue creada con el `output` establecido como `null` o `undefined`, la `query` no es escrita.

Ejemplo de uso:

```js
rl.question('What is your favorite food? ', (answer) => {
  console.log(`Oh, so your favorite food is ${answer}`);
});
```

*Nota*: La función `callback` pasada a `rl.question()` no sigue el patrón típico de aceptación de objetos de `Error` o `null` como primer argumento. La `callback` es llamada con la respuesta proporcionada como único argumento.

### rl.resume()

<!-- YAML
added: v0.3.4
-->

El método `rl.resume()`reanuda el stream de `input` si este ha sido pausado.

### rl.setPrompt(prompt)

<!-- YAML
added: v0.1.98
-->

* `prompt` {string}

El método `rl.setPrompt()` establece el prompt que será escrito en el `output` cada vez que `rl.prompt()` es llamada.

### rl.write(data[, key])

<!-- YAML
added: v0.1.98
-->

* `data` {string}
* `key` {Object} 
  * `ctrl` {boolean} `true` para señalar la tecla `<ctrl>`.
  * `meta` {boolean} `true` para señalar la tecla `<Meta>`.
  * `shift` {boolean} `true` para señalar la tecla `<Shift>`.
  * `name` {string} El nombre de una tecla.

El método `rl.write()` nunca escribirá `data` o una secuencia de teclas identificada por `key` al `output`. El argumento `key` solo es soportado si el `output` es un terminal de texto [TTY](tty.html).

Si se especifica `key`, `data` será ignorada.

Al ser llamado, `rl.write()` reanudará el stream de `input` si este ha sido pausado.

Si la `readline.Interface` fue creada con `output` establecido como `null` o `undefined`, la `data` y `key` no serán escritas.

For example:

```js
rl.write('Delete this!');
// Simula Ctrl+u para eliminar la línea escrita previamente
rl.write(null, { ctrl: true, name: 'u' });
```

*Nota*: El método `rl.write()` escribirá los datos al `input` de la Interfaz de `readline` *como si hubiesen sido proporcionados por el usuario*.

## readline.clearLine(stream, dir)

<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Writable}
* `dir` {number} 
  * `-1` - a la izquierda del cursor
  * `1` - a la derecha del cursor
  * `0` - toda la línea

El método `readline.clearLine()` limpia la línea actual de un stream [TTY](tty.html) dado en una dirección especificada por `dir`.

## readline.clearScreenDown(stream)

<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Writable}

El método `readline.clearScreenDown()` limpia el stream [TTY](tty.html) dado desde la posición actual del cursor hacia abajo.

## readline.createInterface(options)

<!-- YAML
added: v0.1.98
changes:

  - version: v8.3.0, 6.11.4
    pr-url: https://github.com/nodejs/node/pull/13497
    description: Remove max limit of `crlfDelay` option.
  - version: v6.6.0
    pr-url: https://github.com/nodejs/node/pull/8109
    description: The `crlfDelay` option is supported now.
  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/7125
    description: The `prompt` option is supported now.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/6352
    description: The `historySize` option can be `0` now.
-->

* `options` {Object} 
  * `input` {stream.Readable} El stream [Legible](stream.html#stream_readable_streams) al cual escuchar. Esta opción es *requerida*.
  * `output` {stream.Writable} El stream [Escribible](stream.html#stream_writable_streams) al cual escribir los datos de readline.
  * `completer` {Function} Una función opcional utilizada para el auto-completado de Tab.
  * `terminal` {boolean} `true` si los streams de `input` y `output` deben ser tratados como un TTY, y deben escribirse códigos de escape ANSI/VT100 en ellos. **Default:** checking `isTTY` on the `output` stream upon instantiation.
  * `historySize` {number} Número máximo de líneas de historia retenidas. Para deshabilitar el historial, establezca este valor en `0`. This option makes sense only if `terminal` is set to `true` by the user or by an internal `output` check, otherwise the history caching mechanism is not initialized at all. **Predeterminado:** `30`.
  * `prompt` {string} La string aviso a utilizar. **Predeterminado:** `'> '`.
  * `crlfDelay` {number} Si el retraso entre `\r` y `\n` excede los `crlfDelay` milisegundos, tanto `\r` como `\n` serán tratados como entradas de fin de línea separadas. `crlfDelay` will be coerced to a number no less than `100`. It can be set to `Infinity`, in which case `\r` followed by `\n` will always be considered a single newline (which may be reasonable for [reading files](#readline_example_read_file_stream_line_by_line) with `\r\n` line delimiter). **Predeterminado:** `100`.
  * `removeHistoryDuplicates` {boolean} Si es `true`, cuando se añada una nueva línea de entrada a la lista del historial, duplicando una anterior, la más vieja de las dos será removida de la lista. **Predeterminado:** `false`.

El método `readline.createInterface()` crea una nueva instancia de `readline.Interface`.

For example:

```js
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
```

Una vez que la instancia de `readline.Interface` es creada, lo más usual es escuchar por el evento `'line'`:

```js
rl.on('line', (line) => {
  console.log(`Received: ${line}`);
});
```

Si `terminal` es `true` para esta instancia, entonces el stream de `output` tendrá la mejor compatibilidad si define una propiedad `output.columns` y emite un evento `'resize'` en el `output` si, o cuando, las columnas cambian ([`process.stdout`][] hace esto de manera automática cuando es un TTY).

### Uso de la Función `completer` (completado)

La función `completer` toma la línea actual introducida por el usuario como un argumento, y regresa un Array con 2 entradas:

* Un Array con entradas que coinciden para la completación.
* La substring que fue utilizada para la coincidencia.

Por ejemplo: `[[substr1, substr2, ...], originalsubstring]`.

```js
function completer(line) {
  const completions = '.help .error .exit .quit .q'.split(' ');
  const hits = completions.filter((c) => c.startsWith(line));
  // mostrar todas las finalizaciones si no se encuentra ninguna
  return [hits.length ? hits : completions, line];
}
```

La función `completer` puede ser llamada de manera asíncrona si acepta dos argumentos:

```js
function completer(linePartial, callback) {
  callback(null, [['123'], linePartial]);
}
```

## readline.cursorTo(stream, x, y)

<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Writable}
* `x` {number}
* `y` {number}

El método `readline.cursorTo()` mueve el cursor a la posición especificada en un `stream` [TTY](tty.html).

## readline.emitKeypressEvents(stream[, interface])

<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Readable}
* `interface` {readline.Interface}

El método `readline.emitKeypressEvents()` causa que el `stream` [Legible](stream.html#stream_readable_streams) comience a emitir eventos `'keypress'` correspondientes a la entrada recibida.

Opcionalmente, `interface` especifica una instancia de `readline.Interface` para la cual el auto-completado se deshabilita cuando se detecta una entrada copy-paste.

Si el `stream` es un [TTY](tty.html), entonces debe estar en modo raw.

*Nota*: Esto es llamado automáticamente por cualquier instancia de readline en su `input`, si el `input` es un terminal. Cerrar la instancia de `readline` no evita que el `input` emita eventos `'keypress'`.

```js
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY)
  process.stdin.setRawMode(true);
```

## readline.moveCursor(stream, dx, dy)

<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Writable}
* `dx` {number}
* `dy` {number}

El método `readline.moveCursor()` mueve el cursor *con relación* a su posición actual en un `stream` [TTY](tty.html) dado.

## Ejemplo: CLI Pequeña

El siguiente ejemplo ilustra el uso de la clase `readline.Interface` para implementar una interfaz de línea de comandos pequeña:

```js
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'OHAI> '
});

rl.prompt();

rl.on('line', (line) => {
  switch (line.trim()) {
    case 'hello':
      console.log('world!');
      break;
    default:
      console.log(`Say what? I might have heard '${line.trim()}'`);
      break;
  }
  rl.prompt();
}).on('close', () => {
  console.log('Have a great day!');
  process.exit(0);
});
```

## Ejemplo: Leer el Stream de Archivos Línea por Línea

Un caso de uso común para `readline` es el consumo del input de un stream [Legible](stream.html#stream_readable_streams) del sistema de archivos una línea a la vez, como se ilustra en el siguiente ejemplo:

```js
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: fs.createReadStream('sample.txt'),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  console.log(`Line from file: ${line}`);
});
```