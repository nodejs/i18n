# Readline

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

The `readline` module provides an interface for reading data from a [Readable](stream.html#stream_readable_streams) stream (such as [`process.stdin`][]) one line at a time. It can be accessed using:

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

Once this code is invoked, the Node.js application will not terminate until the `readline.Interface` is closed because the interface waits for data to be received on the `input` stream.

## Class: `Interface`
<!-- YAML
added: v0.1.104
-->

* Extiende a: {EventEmitter}

Las instancias de la clase `readline.Interface` se construyen utilizando el método `readline.createInterface()`. Cada instancia está asociada con un stream [Legible](stream.html#stream_readable_streams) de `input` sencillo y un stream [Escribible](stream.html#stream_writable_streams) de `output` sencillo. El stream de `output` se utiliza para imprimir prompts para el input ingresado por el usuario en, y que es leído desde, el stream de `input`.

### Event: `'close'`
<!-- YAML
added: v0.1.98
-->

El evento `close` se emite cuando ocurre uno de los siguientes casos:

* El método `rl.close()` es llamado y la instancia de `readline.Interface` ha renunciado al control sobre los streams de `input` y `output`;
* El stream de `input` recibe su evento `'end'`;
* El stream de `input` recibe `<ctrl>-D` para señalar el final de la transmisión (EOT, por sus siglas en inglés);
* The `input` stream receives `<ctrl>-C` to signal `SIGINT` and there is no `'SIGINT'` event listener registered on the `readline.Interface` instance.

La función del listener es llamada sin pasar ningún argumento.

La instancia de `readline.Interface` se da por finalizada una vez que el evento `'close'` es emitido.

### Event: `'line'`
<!-- YAML
added: v0.1.98
-->

El evento `'line'` es emitido cuando el stream de `input` recibe una entrada de final de línea (`\n`, `\r`, o `\r\n`). Esto ocurre usualmente cuando el usuario presiona las teclas `<Enter>` o `<Return>`.

La función del listener es llamada con una string que contiene la línea única de la entrada recibida.

```js
rl.on('line', (input) => {
  console.log(`Received: ${input}`);
});
```

### Event: `'pause'`
<!-- YAML
added: v0.7.5
-->

El evento `'pause'` es emitido cuando ocurre uno de los siguientes casos:

* El stream de `input` es pausado.
* El stream `input` está pausado y recibe el evento `'SIGCONT'`. (See events [`'SIGTSTP'`][] and [`'SIGCONT'`][].)

La función del listener es llamada sin pasar ningún argumento.

```js
rl.on('pause', () => {
  console.log('Readline paused.');
});
```

### Event: `'resume'`
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

### Event: `'SIGCONT'`
<!-- YAML
added: v0.7.5
-->

The `'SIGCONT'` event is emitted when a Node.js process previously moved into the background using `<ctrl>-Z` (i.e. `SIGTSTP`) is then brought back to the foreground using fg(1p).

If the `input` stream was paused *before* the `SIGTSTP` request, this event will not be emitted.

La función del listener es invocada sin pasar ningún argumento.

```js
rl.on('SIGCONT', () => {
  // `prompt` resumirá automáticamente el stream
  rl.prompt();
});
```

The `'SIGCONT'` event is _not_ supported on Windows.

### Event: `'SIGINT'`
<!-- YAML
added: v0.3.0
-->

El evento `'SIGINT'` es emitido cada vez que el stream de `input` recibe una entrada de `<ctrl>-C`, conocida típicamente como `SIGINT`. Si no hay ningún listener del evento `'SIGINT'` registrado cuando el stream de `input` reciba un `SIGINT`, el evento `'pause'` será emitido.

La función del listener es invocada sin pasar ningún argumento.

```js
rl.on('SIGINT', () => {
  rl.question('Are you sure you want to exit? ', (answer) => {
    if (answer.match(/^y(es)?$/i)) rl.pause();
  });
});
```

### Event: `'SIGTSTP'`
<!-- YAML
added: v0.7.5
-->

El evento `'SIGTSTP'` es emitido cuando el stream de `input` recibe una entrada de `<ctrl>-Z`, típicamente conocida como `SIGTSTP`. If there are no `'SIGTSTP'` event listeners registered when the `input` stream receives a `SIGTSTP`, the Node.js process will be sent to the background.

When the program is resumed using fg(1p), the `'pause'` and `'SIGCONT'` events will be emitted. Estos pueden ser utilizados para reanudar el stream de `input`.

Los eventos `'pause'` y `'SIGCONT'` no serán emitidos si el `input` fue pausado antes de que el proceso fuese enviado al segundo plano.

La función del listener es invocada sin pasar ningún argumento.

```js
rl.on('SIGTSTP', () => {
  // Esto reemplazará a SIGTSTP y prevendrá que el programa se vaya al
  // segundo plano.
  console.log('Caught SIGTSTP.');
});
```

The `'SIGTSTP'` event is _not_ supported on Windows.

### `rl.close()`
<!-- YAML
added: v0.1.98
-->

El método `rl.close()` cierra la instancia de `readline.Interface` y renuncia al control sobre los streams de `input` y `output`. Cuando sea llamado, se emitirá el evento `'close'`.

Calling `rl.close()` does not immediately stop other events (including `'line'`) from being emitted by the `readline.Interface` instance.

### `rl.pause()`
<!-- YAML
added: v0.3.4
-->

El método `rl.pause()` pausa el stream de `input`, permitiendo que se reanude más adelante si es necesario.

Llamar a `rl.pause()` no pausa inmediatamente la emisión de otros eventos por la instancia de `readline.Interface` (incluyendo `'line'`).

### `rl.prompt([preserveCursor])`
<!-- YAML
added: v0.1.98
-->

* `preserveCursor` {boolean} Si es `true`, evita que la colocación del cursor sea restablecida a `0`.

El método `rl.prompt()` escribe el `prompt` configurado de las instancias de `readline.Interface` en una nueva línea en el `output`, para proporcionar a un usuario una nueva ubicación en la cual suministrar el input.

Cuando sea llamado, `rl.prompt()` reanudará el stream de `input` si este ha sido pausado.

Si la `readline.Interface` fue creada con el `output` establecido como `null` o `undefined`, el prompt no es escrito.

### `rl.question(query, callback)`
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

The `callback` function passed to `rl.question()` does not follow the typical pattern of accepting an `Error` object or `null` as the first argument. La `callback` es llamada con la respuesta proporcionada como único argumento.

### `rl.resume()`
<!-- YAML
added: v0.3.4
-->

El método `rl.resume()`reanuda el stream de `input` si este ha sido pausado.

### `rl.setPrompt(prompt)`
<!-- YAML
added: v0.1.98
-->

* `prompt` {string}

El método `rl.setPrompt()` establece el prompt que será escrito en el `output` cada vez que `rl.prompt()` es llamada.

### `rl.write(data[, key])`
<!-- YAML
added: v0.1.98
-->

* `data` {string}
* `key` {Object}
  * `ctrl` {boolean} `true` para señalar la tecla `<ctrl>`.
  * `meta` {boolean} `true` para señalar la tecla `<Meta>`.
  * `shift` {boolean} `true` para señalar la tecla `<Shift>`.
  * `name` {string} El nombre de una tecla.

El método `rl.write()` nunca escribirá `data` o una secuencia de teclas identificada por `key` al `output`. El argumento `key` solo es soportado si el `output` es un terminal de texto [TTY](tty.html). See [TTY keybindings](#readline_tty_keybindings) for a list of key combinations.

Si se especifica `key`, `data` será ignorada.

Al ser llamado, `rl.write()` reanudará el stream de `input` si este ha sido pausado.

Si la `readline.Interface` fue creada con `output` establecido como `null` o `undefined`, la `data` y `key` no serán escritas.

```js
rl.write('Delete this!');
// Simula Ctrl+u para eliminar la línea escrita previamente
rl.write(null, { ctrl: true, name: 'u' });
```

The `rl.write()` method will write the data to the `readline` `Interface`'s `input` *as if it were provided by the user*.

### `rl[Symbol.asyncIterator]()`
<!-- YAML
added: v11.4.0
changes:
  - version: v11.14.0
    pr-url: https://github.com/nodejs/node/pull/26989
    description: Symbol.asyncIterator support is no longer experimental.
-->

* Devuelve: {AsyncIterator}

Create an `AsyncIterator` object that iterates through each line in the input stream as a string. This method allows asynchronous iteration of `readline.Interface` objects through `for await...of` loops.

Errors in the input stream are not forwarded.

If the loop is terminated with `break`, `throw`, or `return`, [`rl.close()`][] will be called. In other words, iterating over a `readline.Interface` will always consume the input stream fully.

Performance is not on par with the traditional `'line'` event API. Use `'line'` instead for performance-sensitive applications.

```js
async function processLineByLine() {
  const rl = readline.createInterface({
    // ...
  });

  for await (const line of rl) {
    // Each line in the readline input will be successively available here as
    // `line`.
  }
}
```

### `rl.line`
<!-- YAML
added: 0.1.98
-->

* {string|undefined}

The current input data being processed by node.

This can be used when collecting input from a TTY stream to retrieve the current value that has been processed thus far, prior to the `line` event being emitted.  Once the `line` event has been emitted, this property will be an empty string.

Be aware that modifying the value during the instance runtime may have unintended consequences if `rl.cursor` is not also controlled.

**If not using a TTY stream for input, use the [`'line'`][] event.**

One possible use case would be as follows:

```js
const values = ['lorem ipsum', 'dolor sit amet'];
const rl = readline.createInterface(process.stdin);
const showResults = debounce(() => {
  console.log(
    '\n',
    values.filter((val) => val.startsWith(rl.line)).join(' ')
  );
}, 300);
process.stdin.on('keypress', (c, k) => {
  showResults();
});
```

### `rl.cursor`
<!-- YAML
added: 0.1.98
-->

* {number|undefined}

The cursor position relative to `rl.line`.

This will track where the current cursor lands in the input string, when reading input from a TTY stream.  The position of cursor determines the portion of the input string that will be modified as input is processed, as well as the column where the terminal caret will be rendered.

### `rl.getCursorPos()`
<!-- YAML
added: v13.5.0
-->

* Devuelve: {Object}
  * `rows` {number} the row of the prompt the cursor currently lands on
  * `cols` {number} the screen column the cursor currently lands on

Returns the real position of the cursor in relation to the input prompt + string.  Long input (wrapping) strings, as well as multiple line prompts are included in the calculations.

## `readline.clearLine(stream, dir[, callback])`
<!-- YAML
added: v0.7.7
changes:
  - version: v12.7.0
    pr-url: https://github.com/nodejs/node/pull/28674
    description: The stream's write() callback and return value are exposed.
-->

* `stream` {stream.Writable}
* `dir` {number}
  * `-1`: to the left from cursor
  * `1`: to the right from cursor
  * `0`: the entire line
* `callback` {Function} Invoked once the operation completes.
* Returns: {boolean} `false` if `stream` wishes for the calling code to wait for the `'drain'` event to be emitted before continuing to write additional data; otherwise `true`.

El método `readline.clearLine()` limpia la línea actual de un stream [TTY](tty.html) dado en una dirección especificada por `dir`.

## `readline.clearScreenDown(stream[, callback])`
<!-- YAML
added: v0.7.7
changes:
  - version: v12.7.0
    pr-url: https://github.com/nodejs/node/pull/28641
    description: The stream's write() callback and return value are exposed.
-->

* `stream` {stream.Writable}
* `callback` {Function} Invoked once the operation completes.
* Returns: {boolean} `false` if `stream` wishes for the calling code to wait for the `'drain'` event to be emitted before continuing to write additional data; otherwise `true`.

El método `readline.clearScreenDown()` limpia el stream [TTY](tty.html) dado desde la posición actual del cursor hacia abajo.

## `readline.createInterface(options)`
<!-- YAML
added: v0.1.98
changes:
  - version: v13.9.0
    pr-url: https://github.com/nodejs/node/pull/31318
    description: The `tabSize` option is supported now.
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
  * `input` {stream.Readable} El stream [Legible](stream.html#stream_readable_streams) al cual escuchar. This option is *required*.
  * `output` {stream.Writable} The [Writable](stream.html#stream_writable_streams) stream to write readline data to.
  * `completer` {Function} Una función opcional utilizada para el auto-completado de Tab.
  * `terminal` {boolean} `true` si los streams de `input` y `output` deben ser tratados como un TTY, y deben escribirse códigos de escape ANSI/VT100 en ellos. **Default:** checking `isTTY` on the `output` stream upon instantiation.
  * `historySize` {number} Número máximo de líneas de historia retenidas. Para deshabilitar el historial, establezca este valor en `0`. This option makes sense only if `terminal` is set to `true` by the user or by an internal `output` check, otherwise the history caching mechanism is not initialized at all. **Default:** `30`.
  * `prompt` {string} La string aviso a utilizar. **Default:** `'> '`.
  * `crlfDelay` {number} Si el retraso entre `\r` y `\n` excede los `crlfDelay` milisegundos, tanto `\r` como `\n` serán tratados como entradas de fin de línea separadas. `crlfDelay` will be coerced to a number no less than `100`. It can be set to `Infinity`, in which case `\r` followed by `\n` will always be considered a single newline (which may be reasonable for [reading files](#readline_example_read_file_stream_line_by_line) with `\r\n` line delimiter). **Default:** `100`.
  * `removeHistoryDuplicates` {boolean} Si es `true`, cuando se añada una nueva línea de entrada a la lista del historial, duplicando una anterior, la más vieja de las dos será removida de la lista. **Default:** `false`.
  * `escapeCodeTimeout` {number} The duration `readline` will wait for a character (when reading an ambiguous key sequence in milliseconds one that can both form a complete key sequence using the input read so far and can take additional input to complete a longer key sequence). **Default:** `500`.
  * `tabSize` {integer} The number of spaces a tab is equal to (minimum 1). **Default:** `8`.

El método `readline.createInterface()` crea una nueva instancia de `readline.Interface`.

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

The `completer` function takes the current line entered by the user as an argument, and returns an `Array` with 2 entries:

* Un `Array` con entradas que coincidan para la terminación.
* La substring que fue utilizada para la coincidencia.

Por ejemplo: `[[substr1, substr2, ...], originalsubstring]`.

```js
function completer(line) {
  const completions = '.help .error .exit .quit .q'.split(' ');
  const hits = completions.filter((c) => c.startsWith(line));
  // Show all completions if none found
  return [hits.length ? hits : completions, line];
}
```

La función `completer` puede ser llamada de manera asíncrona si acepta dos argumentos:

```js
function completer(linePartial, callback) {
  callback(null, [['123'], linePartial]);
}
```

## `readline.cursorTo(stream, x[, y][, callback])`
<!-- YAML
added: v0.7.7
changes:
  - version: v12.7.0
    pr-url: https://github.com/nodejs/node/pull/28674
    description: The stream's write() callback and return value are exposed.
-->

* `stream` {stream.Writable}
* `x` {number}
* `y` {number}
* `callback` {Function} Invoked once the operation completes.
* Returns: {boolean} `false` if `stream` wishes for the calling code to wait for the `'drain'` event to be emitted before continuing to write additional data; otherwise `true`.

El método `readline.cursorTo()` mueve el cursor a la posición especificada en un `stream` [TTY](tty.html).

## `readline.emitKeypressEvents(stream[, interface])`
<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Readable}
* `interface` {readline.Interface}

The `readline.emitKeypressEvents()` method causes the given [Readable](stream.html#stream_readable_streams) stream to begin emitting `'keypress'` events corresponding to received input.

Opcionalmente, `interface` especifica una instancia de `readline.Interface` para la cual el auto-completado se deshabilita cuando se detecta una entrada copy-paste.

Si el `stream` es un [TTY](tty.html), entonces debe estar en modo raw.

This is automatically called by any readline instance on its `input` if the `input` is a terminal. Cerrar la instancia de `readline` no evita que el `input` emita eventos `'keypress'`.

```js
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY)
  process.stdin.setRawMode(true);
```

## `readline.moveCursor(stream, dx, dy[, callback])`
<!-- YAML
added: v0.7.7
changes:
  - version: v12.7.0
    pr-url: https://github.com/nodejs/node/pull/28674
    description: The stream's write() callback and return value are exposed.
-->

* `stream` {stream.Writable}
* `dx` {number}
* `dy` {number}
* `callback` {Function} Invoked once the operation completes.
* Returns: {boolean} `false` if `stream` wishes for the calling code to wait for the `'drain'` event to be emitted before continuing to write additional data; otherwise `true`.

The `readline.moveCursor()` method moves the cursor *relative* to its current position in a given [TTY](tty.html) `stream`.

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

A common use case for `readline` is to consume an input file one line at a time. The easiest way to do so is leveraging the [`fs.ReadStream`][] API as well as a `for await...of` loop:

```js
const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('input.txt');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    console.log(`Line from file: ${line}`);
  }
}

processLineByLine();
```

Alternatively, one could use the [`'line'`][] event:

```js
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('sample.txt'),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  console.log(`Line from file: ${line}`);
});
```

Currently, `for await...of` loop can be a bit slower. If `async` / `await` flow and speed are both essential, a mixed approach can be applied:

```js
const { once } = require('events');
const { createReadStream } = require('fs');
const { createInterface } = require('readline');

(async function processLineByLine() {
  try {
    const rl = createInterface({
      input: createReadStream('big-file.txt'),
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      // Process the line.
    });

    await once(rl, 'close');

    console.log('File processed.');
  } catch (err) {
    console.error(err);
  }
})();
```

## TTY keybindings

<table>
  <tr>
    <th>Keybindings</th>
    <th>Descripción</th>
    <th>Notas</th>
  </tr>
  <tr>
    <td><code>ctrl</code> + <code>shift</code> + <code>backspace</code></td>
    <td>Delete line left</td>
    <td>Doesn't work on Linux, Mac and Windows</td>
  </tr>
  <tr>
    <td><code>ctrl</code> + <code>shift</code> + <code>delete</code></td>
    <td>Delete line right</td>
    <td>Doesn't work on Linux and Mac</td>
  </tr>
  <tr>
    <td><code>ctrl</code> + <code>c</code></td>
    <td>Emit <code>SIGINT</code> or close the readline instance</td>
    <td></td>
  </tr>
  <tr>
    <td><code>ctrl</code> + <code>h</code></td>
    <td>Delete left</td>
    <td></td>
  </tr>
  <tr>
    <td><code>ctrl</code> + <code>d</code></td>
    <td>Delete right or close the readline instance in case the current line is empty / EOF</td>
    <td>Doesn't work on Windows</td>
  </tr>
  <tr>
    <td><code>ctrl</code> + <code>u</code></td>
    <td>Delete from the current position to the line start</td>
    <td></td>
  </tr>
  <tr>
    <td><code>ctrl</code> + <code>k</code></td>
    <td>Delete from the current position to the end of line</td>
    <td></td>
  </tr>
  <tr>
    <td><code>ctrl</code> + <code>a</code></td>
    <td>Go to start of line</td>
    <td></td>
  </tr>
  <tr>
    <td><code>ctrl</code> + <code>e</code></td>
    <td>Go to to end of line</td>
    <td></td>
  </tr>
  <tr>
    <td><code>ctrl</code> + <code>b</code></td>
    <td>Back one character</td>
    <td></td>
  </tr>
  <tr>
    <td><code>ctrl</code> + <code>f</code></td>
    <td>Forward one character</td>
    <td></td>
  </tr>
  <tr>
    <td><code>ctrl</code> + <code>l</code></td>
    <td>Clear screen</td>
    <td></td>
  </tr>
  <tr>
    <td><code>ctrl</code> + <code>n</code></td>
    <td>Next history item</td>
    <td></td>
  </tr>
  <tr>
    <td><code>ctrl</code> + <code>p</code></td>
    <td>Previous history item</td>
    <td></td>
  </tr>
  <tr>
    <td><code>ctrl</code> + <code>z</code></td>
    <td>Moves running process into background. Type
    <code>fg</code> and press <code>enter</code>
    to return.</td>
    <td>Doesn't work on Windows</td>
  </tr>
  <tr>
    <td><code>ctrl</code> + <code>w</code> or <code>ctrl</code>
    + <code>backspace</code></td>
    <td>Delete backwards to a word boundary</td>
    <td><code>ctrl</code> + <code>backspace</code> Doesn't
    work as expected on Windows</td>
  </tr>
  <tr>
    <td><code>ctrl</code> + <code>delete</code></td>
    <td>Delete forward to a word boundary</td>
    <td>Doesn't work on Mac</td>
  </tr>
  <tr>
    <td><code>ctrl</code> + <code>left</code> or
    <code>meta</code> + <code>b</code></td>
    <td>Word left</td>
    <td><code>ctrl</code> + <code>left</code> Doesn't work
    on Mac</td>
  </tr>
  <tr>
    <td><code>ctrl</code> + <code>right</code> or
    <code>meta</code> + <code>f</code></td>
    <td>Word right</td>
    <td><code>ctrl</code> + <code>right</code> Doesn't work
    on Mac</td>
  </tr>
  <tr>
    <td><code>meta</code> + <code>d</code> or <code>meta</code>
    + <code>delete</code></td>
    <td>Delete word right</td>
    <td><code>meta</code> + <code>delete</code> Doesn't work
    on windows</td>
  </tr>
  <tr>
    <td><code>meta</code> + <code>backspace</code></td>
    <td>Delete word left</td>
    <td>Doesn't work on Mac</td>
  </tr>
</table>

