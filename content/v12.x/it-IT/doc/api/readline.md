# Readline

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

The `readline` module provides an interface for reading data from a [Readable](stream.html#stream_readable_streams) stream (such as [`process.stdin`][]) one line at a time. It can be accessed using:

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

## Class: `Interface`
<!-- YAML
added: v0.1.104
-->

* Estendendo: {EventEmitter}

Le istanze della classe `readline.Interface` sono costruite utilizzando il metodo `readline.createInterface()`. Ogni istanza è associata ad un singolo stream [Readable](stream.html#stream_readable_streams) di `input` e ad un singolo stream [Writable](stream.html#stream_writable_streams) di `output`. Lo stream di `output` viene utilizzato per stampare prompt per l'input dell'utente che arriva e viene letto dallo stream di `input`.

### Event: `'close'`
<!-- YAML
added: v0.1.98
-->

L'evento `'close'` viene emesso quando si verifica uno dei seguenti eventi:

* Il metodo `rl.close()` viene chiamato e l'istanza `readline.Interface` ha ceduto il controllo sugli stream di `input` e `output`;
* Lo stream di `input` riceve il suo evento `'end'`;
* Lo stream `input` riceve `&lt;ctrl&gt;-D` per segnalare la fine della trasmissione (EOT);
* The `input` stream receives `<ctrl>-C` to signal `SIGINT` and there is no `'SIGINT'` event listener registered on the `readline.Interface` instance.

La funzione listener viene chiamata senza passare alcun argomento.

L'istanza `readline.Interface` è terminata una volta che l'evento `'close'` è stato emesso.

### Event: `'line'`
<!-- YAML
added: v0.1.98
-->

L'evento `'line'` viene emesso ogni volta che lo stream di `input` riceve un input di fine riga (`\n`, `\r` o `\r\n`). Questo di solito si verifica quando l'utente preme i tasti `&lt;Enter&gt;` or `&lt;Return&gt;`.

La funzione listener viene chiamata con una stringa contenente la singola riga di input ricevuto.

```js
rl.on('line', (input) => {
  console.log(`Received: ${input}`);
});
```

### Event: `'pause'`
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

### Event: `'resume'`
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

### Event: `'SIGCONT'`
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

The `'SIGCONT'` event is _not_ supported on Windows.

### Event: `'SIGINT'`
<!-- YAML
added: v0.3.0
-->

L'evento `'SIGINT'` viene emesso ogni qual volta lo stream di `input` riceve un input `&lt;ctrl&gt;-C`, generalmente noto come `SIGINT`. Se non sono presenti listener di eventi `'SIGINT'` registrati quando lo stream di `input` riceve un `SIGINT`, verrà emesso l'evento `'pause'`.

La funzione listener viene invocata senza passare alcun argomento.

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

L'evento `'SIGTSTP'` viene emesso quando lo stream di `input` riceve un input `&lt;ctrl&gt;-Z`, generalmente noto come `SIGTSTP`. If there are no `'SIGTSTP'` event listeners registered when the `input` stream receives a `SIGTSTP`, the Node.js process will be sent to the background.

When the program is resumed using fg(1p), the `'pause'` and `'SIGCONT'` events will be emitted. Questi possono essere utilizzati per ripristinare lo stream di `input`.

Gli eventi `'pause'` e `'SIGCONT'` non verranno emessi se l'`input` era stato messo in pausa prima che il processo fosse inviato in background.

La funzione listener viene invocata senza passare alcun argomento.

```js
rl.on('SIGTSTP', () => {
  // Questo sovrascriverà SIGTSTP ed eviterà che il programma vada in 
  // background.
  console.log('Caught SIGTSTP.');
});
```

The `'SIGTSTP'` event is _not_ supported on Windows.

### `rl.close()`
<!-- YAML
added: v0.1.98
-->

Il metodo `rl.close()` chiude l'istanza `readline.Interface` e cede il controllo sugli stream di `input` e `output`. Quando viene chiamato, verrà emesso l'evento `'close'`.

Calling `rl.close()` does not immediately stop other events (including `'line'`) from being emitted by the `readline.Interface` instance.

### `rl.pause()`
<!-- YAML
added: v0.3.4
-->

Il metodo `rl.pause()` mette in pausa lo stream di `input`, consentendone la ripresa in seguito, se necessario.

Chiamare `rl.pause()` non sospende immediatamente gli altri eventi (incluso `'line'`) dall'essere emessi dall'istanza `readline.Interface`.

### `rl.prompt([preserveCursor])`
<!-- YAML
added: v0.1.98
-->

* `preserveCursor` {boolean} Se `true`, impedisce che il posizionamento del cursore venga reimpostato su `0`.

Il metodo `rl.prompt()` scrive le istanze `readline.Interface` configurate `prompt` in una nuova riga in `output` per fornire all'utente una nuova posizione in cui fornire input.

Quando chiamato, `rl.prompt()` ripristinerà lo stream di `input` se è stato messo in pausa.

Se `readline.Interface` è stato creato con `output` impostato su `null` o `undefined` il prompt non viene scritto.

### `rl.question(query, callback)`
<!-- YAML
added: v0.3.3
-->

* `query` {string} Un'istruzione o una query da scrivere su `output`, anteposta al prompt.
* `callback` {Function} Una funzione callback invocata con l'input dell'utente in risposta alla `query`.

Il metodo `rl.question()` visualizza la `query` scrivendola nell'`output`, attende che l'input dell'utente venga fornito su `input`, quindi invoca la funzione di `callback` passando l'input fornito come primo argomento.

Quando chiamato, `rl.question()` ripristinerà lo stream di `input` se è stato messo in pausa.

Se `readline.Interface` è stato creato con `output` impostato su `null` o `undefined` la `query` non viene scritta.

Esempio di utilizzo:

```js
rl.question('What is your favorite food? ', (answer) => {
  console.log(`Oh, so your favorite food is ${answer}`);
});
```

The `callback` function passed to `rl.question()` does not follow the typical pattern of accepting an `Error` object or `null` as the first argument. Il `callback` viene chiamato con la risposta fornita come unico argomento.

### `rl.resume()`
<!-- YAML
added: v0.3.4
-->

Il metodo `rl.resume()` ripristina lo stream di `input` se è stato messo in pausa.

### `rl.setPrompt(prompt)`
<!-- YAML
added: v0.1.98
-->

* `prompt` {string}

Il metodo `rl.setPrompt()` imposta il prompt che verrà scritto su `output` ogni volta che viene chiamato `rl.prompt()`.

### `rl.write(data[, key])`
<!-- YAML
added: v0.1.98
-->

* `data` {string}
* `key` {Object}
  * `ctrl` {boolean} `true` per indicare il tasto `&lt;ctrl&gt;`.
  * `meta` {boolean} `true` per indicare il tasto `&lt;Meta&gt;`.
  * `shift` {boolean} `true` per indicare il tasto `&lt;Shift&gt;`.
  * `name` {string} Il nome del tasto.

Il metodo `rl.write()` scriverà i `data` o una sequenza di tasti identificata dalla `key` nell'`output`. L'argomento `key` è supportato esclusivamente se l'`output` è un terminale di testo [TTY](tty.html).

Se viene specificata la `key`, `data` viene ignorato.

Quando chiamato, `rl.write()` ripristinerà lo stream di `input` se è stato messo in pausa.

Se `readline.Interface` è stato creato con `output` impostato su `null` o `undefined` i `data` e la `key` non vengono scritti.

```js
rl.write('Delete this!');
// Simulare Ctrl+u per eliminare la linea precedentemente scritta
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

* Restituisce: {AsyncIterator}

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

### rl.line
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

### rl.cursor
<!-- YAML
added: 0.1.98
-->

* {number|undefined}

The cursor position relative to `rl.line`.

This will track where the current cursor lands in the input string, when reading input from a TTY stream.  The position of cursor determines the portion of the input string that will be modified as input is processed, as well as the column where the terminal caret will be rendered.

### `rl.getCursorPos()`
<!-- YAML
added: v12.16.0
-->

* Restituisce: {Object}
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

Il metodo `readline.clearLine()` cancella la riga corrente di un determinato stream [TTY](tty.html) in una direzione specificata identificata da `dir`.

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

Il metodo `readline.clearScreenDown()` cancella un determinato stream [TTY](tty.html) dalla posizione corrente del cursore verso il basso.

## `readline.createInterface(options)`
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
  * `terminal` {boolean} `true` se gli stream di `input` e `output` devono essere trattati come TTY e avere codici di escape ANSI/VT100 scritti su di esso. **Default:** checking `isTTY` on the `output` stream upon instantiation.
  * `historySize` {number} Massimo numero di righe di cronologia conservate. Per disabilitare la cronologia, impostare questo valore su `0`. This option makes sense only if `terminal` is set to `true` by the user or by an internal `output` check, otherwise the history caching mechanism is not initialized at all. **Default:** `30`.
  * `prompt` {string} La stringa prompt da utilizzare. **Default:** `'> '`.
  * `crlfDelay` {number} Se il ritardo tra `\r` e `\n` supera i millisecondi di `crlfDelay`, sia `\r` che `\n` verranno trattati come input di fine riga separati. `crlfDelay` will be coerced to a number no less than `100`. It can be set to `Infinity`, in which case `\r` followed by `\n` will always be considered a single newline (which may be reasonable for [reading files](#readline_example_read_file_stream_line_by_line) with `\r\n` line delimiter). **Default:** `100`.
  * `removeHistoryDuplicates` {boolean} Se `true`, quando una nuova riga di input aggiunta all'elenco della cronologia ne duplica una precedente, rimuove la riga precedente dall'elenco. **Default:** `false`.
  * `escapeCodeTimeout` {number} The duration `readline` will wait for a character (when reading an ambiguous key sequence in milliseconds one that can both form a complete key sequence using the input read so far and can take additional input to complete a longer key sequence). **Default:** `500`.

Il metodo `readline.createInterface()` crea una nuova istanza di `readline.Interface`.

```js
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
```

Una volta creata l'istanza `readline.Interface`, il caso più comune è sottoporre al listening l'evento `'line'`:

```js
rl.on('line', (line) => {
  console.log(`Received: ${line}`);
});
```

Se il `terminal` è `true` per questa istanza, allora lo stream di `output` otterrà la migliore compatibilità se definisce una proprietà `output.columns` ed emette un evento `'resize'` sull'`output` se o quando le colonne cambiano ([`process.stdout`][] lo fa automaticamente quando è un TTY).

### Uso della Funzione `completer`

The `completer` function takes the current line entered by the user as an argument, and returns an `Array` with 2 entries:

* Un `Array` con voci per il completamento corrispondenti.
* La sottostringa che è stata utilizzata per la corrispondenza.

Ad esempio: `[[substr1, substr2, ...], originalsubstring]`.

```js
function completer(line) {
  const completions = '.help .error .exit .quit .q'.split(' ');
  const hits = completions.filter((c) => c.startsWith(line));
  // Show all completions if none found
  return [hits.length ? hits : completions, line];
}
```

La funzione `completer` può essere chiamata in modo asincrono se accetta due argomenti:

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

Il metodo `readline.cursorTo()` sposta il cursore sulla posizione specificata in un determinato `stream` [TTY](tty.html).

## `readline.emitKeypressEvents(stream[, interface])`
<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Readable}
* `interface` {readline.Interface}

The `readline.emitKeypressEvents()` method causes the given [Readable](stream.html#stream_readable_streams) stream to begin emitting `'keypress'` events corresponding to received input.

Facoltativamente, l'`interface` specifica un'istanza `readline.Interface` per cui il completamento automatico è disabilitato quando viene rilevato un input copia-incollato.

Se lo `stream` è un [TTY](tty.html), deve essere in modalità raw.

This is automatically called by any readline instance on its `input` if the `input` is a terminal. La chiusura dell'istanza `readline` non impedisce all'`input` di emettere eventi `'keypress'`.

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

## Esempio: Tiny CLI

L'esempio seguente illustra l'utilizzo della classe `readline.Interface` per implementare una piccola interfaccia a riga di comando:

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
