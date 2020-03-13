# Readline

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Il modulo `readline` fornisce un'interfaccia per leggere i dati da uno stream [Readable](stream.html#stream_readable_streams) (come [`process.stdin`]) una riga alla volta. Ci si può accedere utilizzando:

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

*Note*: Once this code is invoked, the Node.js application will not terminate until the `readline.Interface` is closed because the interface waits for data to be received on the `input` stream.

## Class: Interface
<!-- YAML
added: v0.1.104
-->

Le istanze della classe `readline.Interface` sono costruite utilizzando il metodo `readline.createInterface()`. Ogni istanza è associata ad un singolo stream [Readable](stream.html#stream_readable_streams) di `input` e ad un singolo stream [Writable](stream.html#stream_writable_streams) di `output`. Lo stream di `output` viene utilizzato per stampare prompt per l'input dell'utente che arriva e viene letto dallo stream di `input`.

### Event: 'close'
<!-- YAML
added: v0.1.98
-->

L'evento `'close'` viene emesso quando si verifica uno dei seguenti eventi:

* Il metodo `rl.close()` viene chiamato e l'istanza `readline.Interface` ha ceduto il controllo sugli stream di `input` e `output`;
* Lo stream di `input` riceve il suo evento `'end'`;
* Lo stream `input` riceve `&lt;ctrl&gt;-D` per segnalare la fine della trasmissione (EOT);
* The `input` stream receives `<ctrl>-C` to signal `SIGINT` and there is no `SIGINT` event listener registered on the `readline.Interface` instance.

La funzione listener viene chiamata senza passare alcun argomento.

L'istanza `readline.Interface` è terminata una volta che l'evento `'close'` è stato emesso.

### Event: 'line'
<!-- YAML
added: v0.1.98
-->

L'evento `'line'` viene emesso ogni volta che lo stream di `input` riceve un input di fine riga (`\n`, `\r` o `\r\n`). Questo di solito si verifica quando l'utente preme i tasti `&lt;Enter&gt;` or `&lt;Return&gt;`.

La funzione listener viene chiamata con una stringa contenente la singola riga di input ricevuto.

Per esempio:

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
* The `input` stream is not paused and receives the `SIGCONT` event. (See events [`SIGTSTP`][] and [`SIGCONT`][])

La funzione listener viene chiamata senza passare alcun argomento.

Per esempio:

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

L'evento `'SIGCONT'` viene emesso quando un processo Node.js precedentemente spostato in background utilizzando `&lt;ctrl&gt;-Z` (cioè `SIGTSTP`) viene in seguito riportato in foreground usando fg(1p).

Se lo stream di `input` è stato sospeso *prima* della richiesta `SIGTSTP`, questo evento non verrà emesso.

La funzione listener viene invocata senza passare alcun argomento.

Per esempio:

```js
rl.on('SIGCONT', () => {
  // `prompt` ripristinerà automaticamente lo stream
  rl.prompt();
});
```

*Note*: The `'SIGCONT'` event is _not_ supported on Windows.

### Event: 'SIGINT'
<!-- YAML
added: v0.3.0
-->

L'evento `'SIGINT'` viene emesso ogni qual volta lo stream di `input` riceve un input `&lt;ctrl&gt;-C`, generalmente noto come `SIGINT`. Se non sono presenti listener di eventi `'SIGINT'` registrati quando lo stream di `input` riceve un `SIGINT`, verrà emesso l'evento `'pause'`.

La funzione listener viene invocata senza passare alcun argomento.

Per esempio:

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

L'evento `'SIGTSTP'` viene emesso quando lo stream di `input` riceve un input `&lt;ctrl&gt;-Z`, generalmente noto come `SIGTSTP`. If there are no `SIGTSTP` event listeners registered when the `input` stream receives a `SIGTSTP`, the Node.js process will be sent to the background.

When the program is resumed using fg(1p), the `'pause'` and `SIGCONT` events will be emitted. Questi possono essere utilizzati per ripristinare lo stream di `input`.

Gli eventi `'pause'` e `'SIGCONT'` non verranno emessi se l'`input` era stato messo in pausa prima che il processo fosse inviato in background.

La funzione listener viene invocata senza passare alcun argomento.

Per esempio:

```js
rl.on('SIGTSTP', () => {
  // Questo sovrascriverà SIGTSTP ed eviterà che il programma vada in 
  // background.
  console.log('Caught SIGTSTP.');
});
```

*Note*: The `'SIGTSTP'` event is _not_ supported on Windows.

### rl.close()
<!-- YAML
added: v0.1.98
-->

Il metodo `rl.close()` chiude l'istanza `readline.Interface` e cede il controllo sugli stream di `input` e `output`. Quando viene chiamato, verrà emesso l'evento `'close'`.

### rl.pause()
<!-- YAML
added: v0.3.4
-->

Il metodo `rl.pause()` mette in pausa lo stream di `input`, consentendone la ripresa in seguito, se necessario.

Chiamare `rl.pause()` non sospende immediatamente gli altri eventi (incluso `'line'`) dall'essere emessi dall'istanza `readline.Interface`.

### rl.prompt([preserveCursor])
<!-- YAML
added: v0.1.98
-->

* `preserveCursor` {boolean} Se `true`, impedisce che il posizionamento del cursore venga reimpostato su `0`.

Il metodo `rl.prompt()` scrive le istanze `readline.Interface` configurate `prompt` in una nuova riga in `output` per fornire all'utente una nuova posizione in cui fornire input.

Quando chiamato, `rl.prompt()` ripristinerà lo stream di `input` se è stato messo in pausa.

Se `readline.Interface` è stato creato con `output` impostato su `null` o `undefined` il prompt non viene scritto.

### rl.question(query, callback)
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

*Note*: The `callback` function passed to `rl.question()` does not follow the typical pattern of accepting an `Error` object or `null` as the first argument. Il `callback` viene chiamato con la risposta fornita come unico argomento.

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

Il metodo `rl.setPrompt()` imposta il prompt che verrà scritto su `output` ogni volta che viene chiamato `rl.prompt()`.

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

Il metodo `rl.write()` scriverà i `data` o una sequenza di tasti identificata dalla `key` nell'`output`. L'argomento `key` è supportato esclusivamente se l'`output` è un terminale di testo [TTY](tty.html).

Se viene specificata la `key`, `data` viene ignorato.

Quando chiamato, `rl.write()` ripristinerà lo stream di `input` se è stato messo in pausa.

Se `readline.Interface` è stato creato con `output` impostato su `null` o `undefined` i `data` e la `key` non vengono scritti.

Per esempio:

```js
rl.write('Delete this!');
// Simulare Ctrl+u per eliminare la linea precedentemente scritta
rl.write(null, { ctrl: true, name: 'u' });
```

*Note*: The `rl.write()` method will write the data to the `readline` Interface's `input` *as if it were provided by the user*.

## readline.clearLine(stream, dir)
<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Writable}
* `dir` {number}
  * `-1` - a sinistra rispetto al cursore
  * `1` - a destra rispetto al cursore
  * `0` - la linea intera

Il metodo `readline.clearLine()` cancella la riga corrente di un determinato stream [TTY](tty.html) in una direzione specificata identificata da `dir`.


## readline.clearScreenDown(stream)
<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Writable}

Il metodo `readline.clearScreenDown()` cancella un determinato stream [TTY](tty.html) dalla posizione corrente del cursore verso il basso.

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
  * `terminal` {boolean} `true` se gli stream di `input` e `output` devono essere trattati come TTY e avere codici di escape ANSI/VT100 scritti su di esso. **Default:** il controllo di `isTTY` sullo stream di `output` dopo l'istanziazione.
  * `historySize` {number} Massimo numero di righe di cronologia conservate. Per disabilitare la cronologia, impostare questo valore su `0`. Questa opzione ha senso solo se il `terminal` è impostato su `true` dall'utente o da un controllo di `output` interno, altrimenti il ​​meccanismo di memorizzazione nella cache della cronologia non è affatto inizializzato. **Default:** `30`.
  * `prompt` {string} La stringa prompt da utilizzare. **Default:** `'> '`.
  * `crlfDelay` {number} Se il ritardo tra `\r` e `\n` supera i millisecondi di `crlfDelay`, sia `\r` che `\n` verranno trattati come input di fine riga separati. `crlfDelay` sarà forzato a un numero non inferiore a `100`. Può essere impostato su `Infinity`, nel qual caso `\r` seguito da `\n` verrà sempre considerato una singola riga nuova (che potrebbe essere ragionevole per i [file di lettura](#readline_example_read_file_stream_line_by_line) con delimitatore di riga `\r\n`). **Default:** `100`.
  * `removeHistoryDuplicates` {boolean} Se `true`, quando una nuova riga di input aggiunta all'elenco della cronologia ne duplica una precedente, rimuove la riga precedente dall'elenco. **Default:** `false`.

Il metodo `readline.createInterface()` crea una nuova istanza di `readline.Interface`.

Per esempio:

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

The `completer` function takes the current line entered by the user as an argument, and returns an Array with 2 entries:

* Un Array con voci per il completamento corrispondenti.
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

La funzione `completer` può essere chiamata in modo asincrono se accetta due argomenti:

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

Il metodo `readline.cursorTo()` sposta il cursore sulla posizione specificata in un determinato `stream` [TTY](tty.html).

## readline.emitKeypressEvents(stream[, interface])
<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Readable}
* `interface` {readline.Interface}

The `readline.emitKeypressEvents()` method causes the given [Readable](stream.html#stream_readable_streams) `stream` to begin emitting `'keypress'` events corresponding to received input.

Facoltativamente, l'`interface` specifica un'istanza `readline.Interface` per cui il completamento automatico è disabilitato quando viene rilevato un input copia-incollato.

Se lo `stream` è un [TTY](tty.html), deve essere in modalità raw.

*Note*: This is automatically called by any readline instance on its `input` if the `input` is a terminal. La chiusura dell'istanza `readline` non impedisce all'`input` di emettere eventi `'keypress'`.

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

Il metodo `readline.moveCursor()` sposta il cursore *relativamente* alla sua posizione corrente in un determinato `stream` [TTY](tty.html).


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

Un caso di uso comune per `readline` consiste nel consumare input da un filesystem [Readable](stream.html#stream_readable_streams) stream una riga alla volta, come illustrato nell'esempio seguente:

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
