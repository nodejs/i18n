# Readline

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stabile

The `readline` module provides an interface for reading data from a [Readable](stream.html#stream_readable_streams) stream (such as [`process.stdin`]) one line at a time. Ci si può accedere utilizzando:

```js
const readline = require('readline');
```

Il seguente esempio semplice illustra l'uso di base del modulo `readline`.

```js
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('What do you think of Node.js? ', (answer) => {
  // TODO: Registra la risposta in un database
  console.log(`Thank you for your valuable feedback: ${answer}`);

  rl.close();
});
```

Once this code is invoked, the Node.js application will not terminate until the `readline.Interface` is closed because the interface waits for data to be received on the `input` stream.

## Class: Interface

<!-- YAML
added: v0.1.104
-->

Instances of the `readline.Interface` class are constructed using the `readline.createInterface()` method. Every instance is associated with a single `input` [Readable](stream.html#stream_readable_streams) stream and a single `output` [Writable](stream.html#stream_writable_streams) stream. The `output` stream is used to print prompts for user input that arrives on, and is read from, the `input` stream.

### Event: 'close'

<!-- YAML
added: v0.1.98
-->

L'evento `'close'` viene emesso quando si verifica uno dei seguenti eventi:

* The `rl.close()` method is called and the `readline.Interface` instance has relinquished control over the `input` and `output` streams;
* Lo stream di `input` riceve il suo evento `'end'`;
* Lo stream `input` riceve `&lt;ctrl&gt;-D` per segnalare la fine della trasmissione (EOT);
* The `input` stream receives `<ctrl>-C` to signal `SIGINT` and there is no `'SIGINT'` event listener registered on the `readline.Interface` instance.

La funzione listener viene chiamata senza passare alcun argomento.

The `readline.Interface` instance is finished once the `'close'` event is emitted.

### Event: 'line'

<!-- YAML
added: v0.1.98
-->

The `'line'` event is emitted whenever the `input` stream receives an end-of-line input (`\n`, `\r`, or `\r\n`). This usually occurs when the user presses the `<Enter>`, or `<Return>` keys.

The listener function is called with a string containing the single line of received input.

```js
rl.on('line', (input) => {
  console.log(`Received: ${input}`);
});
```

### Event: 'pause'

<!-- YAML
added: v0.7.5
-->

L'evento `'pause'` viene emesso quando si verifica uno dei seguenti eventi:

* Lo stream di `input` è in pausa.
* Lo stream di `input` non viene messo in pausa e riceve l'evento `'SIGCONT'`. (See events [`'SIGTSTP'`][] and [`'SIGCONT'`][].)

La funzione listener viene chiamata senza passare alcun argomento.

```js
rl.on('pause', () => {
  console.log('Readline paused.');
});
```

### Event: 'resume'

<!-- YAML
added: v0.7.5
-->

L'evento `'resume'` viene emesso ogni qual volta viene ripristinato lo stream di `input`.

La funzione listener viene chiamata senza passare alcun argomento.

```js
rl.on('resume', () => {
  console.log('Readline resumed.');
});
```

### Event: 'SIGCONT'

<!-- YAML
added: v0.7.5
-->

The `'SIGCONT'` event is emitted when a Node.js process previously moved into the background using `<ctrl>-Z` (i.e. `SIGTSTP`) is then brought back to the foreground using fg(1p).

If the `input` stream was paused *before* the `SIGTSTP` request, this event will not be emitted.

La funzione listener viene invocata senza passare alcun argomento.

```js
rl.on('SIGCONT', () => {
  // `prompt` ripristinerà automaticamente lo stream
  rl.prompt();
});
```

L'evento `'SIGCONT'` *non* è supportato su Windows.

### Event: 'SIGINT'

<!-- YAML
added: v0.3.0
-->

The `'SIGINT'` event is emitted whenever the `input` stream receives a `<ctrl>-C` input, known typically as `SIGINT`. If there are no `'SIGINT'` event listeners registered when the `input` stream receives a `SIGINT`, the `'pause'` event will be emitted.

La funzione listener viene invocata senza passare alcun argomento.

```js
rl.on('SIGINT', () => {
  rl.question('Are you sure you want to exit? ', (answer) => {
    if (answer.match(/^y(es)?$/i)) rl.pause();
  });
});
```

### Event: 'SIGTSTP'

<!-- YAML
added: v0.7.5
-->

The `'SIGTSTP'` event is emitted when the `input` stream receives a `<ctrl>-Z` input, typically known as `SIGTSTP`. If there are no `'SIGTSTP'` event listeners registered when the `input` stream receives a `SIGTSTP`, the Node.js process will be sent to the background.

When the program is resumed using fg(1p), the `'pause'` and `'SIGCONT'` events will be emitted. Questi possono essere utilizzati per ripristinare lo stream di `input`.

The `'pause'` and `'SIGCONT'` events will not be emitted if the `input` was paused before the process was sent to the background.

La funzione listener viene invocata senza passare alcun argomento.

```js
rl.on('SIGTSTP', () => {
  // Questo sovrascriverà SIGTSTP ed eviterà che il programma vada in 
  // background.
  console.log('Caught SIGTSTP.');
});
```

L'evento `'SIGTSTP'` *non* è supportato su Windows.

### rl.close()

<!-- YAML
added: v0.1.98
-->

The `rl.close()` method closes the `readline.Interface` instance and relinquishes control over the `input` and `output` streams. When called, the `'close'` event will be emitted.

Calling `rl.close()` does not immediately stop other events (including `'line'`) from being emitted by the `readline.Interface` instance.

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

Esempio di utilizzo:

```js
rl.question('What is your favorite food? ', (answer) => {
  console.log(`Oh, so your favorite food is ${answer}`);
});
```

The `callback` function passed to `rl.question()` does not follow the typical pattern of accepting an `Error` object or `null` as the first argument. Il `callback` viene chiamato con la risposta fornita come unico argomento.

### rl.resume()

<!-- YAML
added: v0.3.4
-->

Il metodo `rl.resume()` ripristina lo stream di `input` se è stato messo in pausa.

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
  * `ctrl` {boolean} `true` per indicare il tasto `&lt;ctrl&gt;`.
  * `meta` {boolean} `true` per indicare il tasto `&lt;Meta&gt;`.
  * `shift` {boolean} `true` per indicare il tasto `&lt;Shift&gt;`.
  * `name` {string} Il nome del tasto.

The `rl.write()` method will write either `data` or a key sequence identified by `key` to the `output`. The `key` argument is supported only if `output` is a [TTY](tty.html) text terminal.

Se viene specificata la `key`, `data` viene ignorato.

When called, `rl.write()` will resume the `input` stream if it has been paused.

If the `readline.Interface` was created with `output` set to `null` or `undefined` the `data` and `key` are not written.

```js
rl.write('Delete this!');
// Simulare Ctrl+u per eliminare la linea precedentemente scritta
rl.write(null, { ctrl: true, name: 'u' });
```

The `rl.write()` method will write the data to the `readline` `Interface`'s `input` *as if it were provided by the user*.

### rl\[Symbol.asyncIterator\]()

<!-- YAML
added: v10.16.0
-->

> Stability: 1 - Experimental

* Restituisce: {AsyncIterator}

Create an `AsyncIterator` object that iterates through each line in the input stream as a string. This method allows asynchronous iteration of `readline.Interface` objects through `for`-`await`-`of` loops.

Errors in the input stream are not forwarded.

If the loop is terminated with `break`, `throw`, or `return`, [`rl.close()`][] will be called. In other words, iterating over a `readline.Interface` will always consume the input stream fully.

A caveat with using this experimental API is that the performance is currently not on par with the traditional `'line'` event API, and thus it is not recommended for performance-sensitive applications. We expect this situation to improve in the future.

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

## readline.clearLine(stream, dir)

<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Writable}
* `dir` {number} 
  * `-1` - a sinistra rispetto al cursore
  * `1` - a destra rispetto al cursore
  * `0` - la linea intera

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
  * `input` {stream.Readable} Lo stream [Readable](stream.html#stream_readable_streams) da sottoporre al listening. This option is *required*.
  * `output` {stream.Writable} The [Writable](stream.html#stream_writable_streams) stream to write readline data to.
  * `completer` {Function} Una funzione opzionale utilizzata per il completamento automatico di Tab.
  * `terminal` {boolean} `true` if the `input` and `output` streams should be treated like a TTY, and have ANSI/VT100 escape codes written to it. **Default:** il controllo di `isTTY` sullo stream di `output` dopo l'istanziazione.
  * `historySize` {number} Massimo numero di righe di cronologia conservate. To disable the history set this value to `0`. This option makes sense only if `terminal` is set to `true` by the user or by an internal `output` check, otherwise the history caching mechanism is not initialized at all. **Default:** `30`.
  * `prompt` {string} La stringa prompt da utilizzare. **Default:** `'> '`.
  * `crlfDelay` {number} If the delay between `\r` and `\n` exceeds `crlfDelay` milliseconds, both `\r` and `\n` will be treated as separate end-of-line input. `crlfDelay` will be coerced to a number no less than `100`. It can be set to `Infinity`, in which case `\r` followed by `\n` will always be considered a single newline (which may be reasonable for [reading files](#readline_example_read_file_stream_line_by_line) with `\r\n` line delimiter). **Default:** `100`.
  * `removeHistoryDuplicates` {boolean} If `true`, when a new input line added to the history list duplicates an older one, this removes the older line from the list. **Default:** `false`.
  * `escapeCodeTimeout` {number} The duration `readline` will wait for a character (when reading an ambiguous key sequence in milliseconds one that can both form a complete key sequence using the input read so far and can take additional input to complete a longer key sequence). **Default:** `500`.

The `readline.createInterface()` method creates a new `readline.Interface` instance.

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

### Uso della Funzione `completer`

The `completer` function takes the current line entered by the user as an argument, and returns an `Array` with 2 entries:

* Un `Array` con voci per il completamento corrispondenti.
* La sottostringa che è stata utilizzata per la corrispondenza.

Ad esempio: `[[substr1, substr2, ...], originalsubstring]`.

```js
function completer(line) {
  const completions = '.help .error .exit .quit .q'.split(' ');
  const hits = completions.filter((c) => c.startsWith(line));
  // mostra tutti i completamenti se non ne è stato trovato nemmeno uno
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

The `readline.emitKeypressEvents()` method causes the given [Readable](stream.html#stream_readable_streams) stream to begin emitting `'keypress'` events corresponding to received input.

Optionally, `interface` specifies a `readline.Interface` instance for which autocompletion is disabled when copy-pasted input is detected.

Se lo `stream` è un [TTY](tty.html), deve essere in modalità raw.

This is automatically called by any readline instance on its `input` if the `input` is a terminal. Closing the `readline` instance does not stop the `input` from emitting `'keypress'` events.

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

## Esempio: Tiny CLI

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

## Esempio: Leggere lo Stream del File Riga per Riga

A common use case for `readline` is to consume an input file one line at a time. The easiest way to do so is leveraging the [`fs.ReadStream`][] API as well as a `for`-`await`-`of` loop:

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

Currently, `for`-`await`-`of` loop can be a bit slower. If `async` / `await` flow and speed are both essential, a mixed approach can be applied:

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