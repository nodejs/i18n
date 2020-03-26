# Readline

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

The `readline` module provides an interface for reading data from a [Readable](stream.html#stream_readable_streams) stream (such as [`process.stdin`]) one line at a time. Se puede acceder a él utilizando:

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

Instances of the `readline.Interface` class are constructed using the `readline.createInterface()` method. Every instance is associated with a single `input` [Readable](stream.html#stream_readable_streams) stream and a single `output` [Writable](stream.html#stream_writable_streams) stream. The `output` stream is used to print prompts for user input that arrives on, and is read from, the `input` stream.

### Evento: 'close'

<!-- YAML
added: v0.1.98
-->

El evento `close` se emite cuando ocurre uno de los siguientes casos:

* The `rl.close()` method is called and the `readline.Interface` instance has relinquished control over the `input` and `output` streams;
* El stream de `input` recibe su evento `'end'`;
* El stream de `input` recibe `<ctrl>-D` para señalar el final de la transmisión (EOT, por sus siglas en inglés);
* The `input` stream receives `<ctrl>-C` to signal `SIGINT` and there is no `SIGINT` event listener registered on the `readline.Interface` instance.

La función del listener es llamada sin pasar ningún argumento.

The `readline.Interface` instance is finished once the `'close'` event is emitted.

### Evento: 'line'

<!-- YAML
added: v0.1.98
-->

The `'line'` event is emitted whenever the `input` stream receives an end-of-line input (`\n`, `\r`, or `\r\n`). This usually occurs when the user presses the `<Enter>`, or `<Return>` keys.

The listener function is called with a string containing the single line of received input.

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
* El stream de `input` no se encuentra pausado y recibe el evento `SIGCONT`. (See events [`SIGTSTP`][] and [`SIGCONT`][])

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

If the `input` stream was paused *before* the `SIGTSTP` request, this event will not be emitted.

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

The `'SIGINT'` event is emitted whenever the `input` stream receives a `<ctrl>-C` input, known typically as `SIGINT`. If there are no `'SIGINT'` event listeners registered when the `input` stream receives a `SIGINT`, the `'pause'` event will be emitted.

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

The `'SIGTSTP'` event is emitted when the `input` stream receives a `<ctrl>-Z` input, typically known as `SIGTSTP`. If there are no `SIGTSTP` event listeners registered when the `input` stream receives a `SIGTSTP`, the Node.js process will be sent to the background.

When the program is resumed using fg(1p), the `'pause'` and `SIGCONT` events will be emitted. Estos pueden ser utilizados para reanudar el stream de `input`.

The `'pause'` and `'SIGCONT'` events will not be emitted if the `input` was paused before the process was sent to the background.

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

The `rl.close()` method closes the `readline.Interface` instance and relinquishes control over the `input` and `output` streams. When called, the `'close'` event will be emitted.

### rl.pause()

<!-- YAML
added: v0.3.4
-->

The `rl.pause()` method pauses the `input` stream, allowing it to be resumed later if necessary.

Calling `rl.pause()` does not immediately pause other events (including `'line'`) from being emitted by the `readline.Interface` instance.

### rl.prompt([preserveCursor])

<!-- YAML
added: v0.1.98
-->

* `preserveCursor` {boolean} If `true`, prevents the cursor placement from being reset to `0`.

The `rl.prompt()` method writes the `readline.Interface` instances configured `prompt` to a new line in `output` in order to provide a user with a new location at which to provide input.

When called, `rl.prompt()` will resume the `input` stream if it has been paused.

If the `readline.Interface` was created with `output` set to `null` or `undefined` the prompt is not written.

### rl.question(query, callback)

<!-- YAML
added: v0.3.3
-->

* `query` {string} A statement or query to write to `output`, prepended to the prompt.
* `callback` {Function} A callback function that is invoked with the user's input in response to the `query`.

The `rl.question()` method displays the `query` by writing it to the `output`, waits for user input to be provided on `input`, then invokes the `callback` function passing the provided input as the first argument.

When called, `rl.question()` will resume the `input` stream if it has been paused.

If the `readline.Interface` was created with `output` set to `null` or `undefined` the `query` is not written.

Ejemplo de uso:

```js
rl.question('What is your favorite food? ', (answer) => {
  console.log(`Oh, so your favorite food is ${answer}`);
});
```

*Note*: The `callback` function passed to `rl.question()` does not follow the typical pattern of accepting an `Error` object or `null` as the first argument. La `callback` es llamada con la respuesta proporcionada como único argumento.

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

The `rl.setPrompt()` method sets the prompt that will be written to `output` whenever `rl.prompt()` is called.

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

The `rl.write()` method will write either `data` or a key sequence identified by `key` to the `output`. The `key` argument is supported only if `output` is a [TTY](tty.html) text terminal.

Si se especifica `key`, `data` será ignorada.

When called, `rl.write()` will resume the `input` stream if it has been paused.

If the `readline.Interface` was created with `output` set to `null` or `undefined` the `data` and `key` are not written.

For example:

```js
rl.write('Delete this!');
// Simula Ctrl+u para eliminar la línea escrita previamente
rl.write(null, { ctrl: true, name: 'u' });
```

*Note*: The `rl.write()` method will write the data to the `readline` Interface's `input` *as if it were provided by the user*.

## readline.clearLine(stream, dir)

<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Writable}
* `dir` {number} 
  * `-1` - a la izquierda del cursor
  * `1` - a la derecha del cursor
  * `0` - toda la línea

The `readline.clearLine()` method clears current line of given [TTY](tty.html) stream in a specified direction identified by `dir`.

## readline.clearScreenDown(stream)

<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Writable}

The `readline.clearScreenDown()` method clears the given [TTY](tty.html) stream from the current position of the cursor down.

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
  * `input` {stream.Readable} El stream [Legible](stream.html#stream_readable_streams) al cual escuchar. This option is *required*.
  * `output` {stream.Writable} El stream [Escribible](stream.html#stream_writable_streams) al cual escribir los datos de readline.
  * `completer` {Function} Una función opcional utilizada para el auto-completado de Tab.
  * `terminal` {boolean} `true` if the `input` and `output` streams should be treated like a TTY, and have ANSI/VT100 escape codes written to it. **Default:** checking `isTTY` on the `output` stream upon instantiation.
  * `historySize` {number} Número máximo de líneas de historia retenidas. To disable the history set this value to `0`. This option makes sense only if `terminal` is set to `true` by the user or by an internal `output` check, otherwise the history caching mechanism is not initialized at all. **Predeterminado:** `30`.
  * `prompt` {string} La string aviso a utilizar. **Predeterminado:** `'> '`.
  * `crlfDelay` {number} If the delay between `\r` and `\n` exceeds `crlfDelay` milliseconds, both `\r` and `\n` will be treated as separate end-of-line input. Se forzará a `crlfDelay` a ser un número no menor de `100`. It can be set to `Infinity`, in which case `\r` followed by `\n` will always be considered a single newline (which may be reasonable for [reading files](#readline_example_read_file_stream_line_by_line) with `\r\n` line delimiter). **Predeterminado:** `100`.
  * `removeHistoryDuplicates` {boolean} If `true`, when a new input line added to the history list duplicates an older one, this removes the older line from the list. **Predeterminado:** `false`.

The `readline.createInterface()` method creates a new `readline.Interface` instance.

For example:

```js
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
```

Once the `readline.Interface` instance is created, the most common case is to listen for the `'line'` event:

```js
rl.on('line', (line) => {
  console.log(`Received: ${line}`);
});
```

If `terminal` is `true` for this instance then the `output` stream will get the best compatibility if it defines an `output.columns` property and emits a `'resize'` event on the `output` if or when the columns ever change ([`process.stdout`][] does this automatically when it is a TTY).

### Uso de la Función `completer` (completado)

The `completer` function takes the current line entered by the user as an argument, and returns an Array with 2 entries:

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

The `completer` function can be called asynchronously if it accepts two arguments:

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

The `readline.cursorTo()` method moves cursor to the specified position in a given [TTY](tty.html) `stream`.

## readline.emitKeypressEvents(stream[, interface])

<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Readable}
* `interface` {readline.Interface}

The `readline.emitKeypressEvents()` method causes the given [Readable](stream.html#stream_readable_streams) `stream` to begin emitting `'keypress'` events corresponding to received input.

Optionally, `interface` specifies a `readline.Interface` instance for which autocompletion is disabled when copy-pasted input is detected.

Si el `stream` es un [TTY](tty.html), entonces debe estar en modo raw.

*Note*: This is automatically called by any readline instance on its `input` if the `input` is a terminal. Closing the `readline` instance does not stop the `input` from emitting `'keypress'` events.

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

The `readline.moveCursor()` method moves the cursor *relative* to its current position in a given [TTY](tty.html) `stream`.

## Ejemplo: CLI Pequeña

The following example illustrates the use of `readline.Interface` class to implement a small command-line interface:

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

A common use case for `readline` is to consume input from a filesystem [Readable](stream.html#stream_readable_streams) stream one line at a time, as illustrated in the following example:

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