# REPL

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Il modulo `repl` fornisce un'implementazione Read-Eval-Print-Loop (REPL) che è disponibile sia come programma standalone che incluso in altre applicazioni. Ci si può accedere utilizzando:

```js
const repl = require('repl');
```

## Design e Caratteristiche

Il modulo `repl` esporta la classe `repl.REPLServer`. Durante l'esecuzione, le istanze di `repl.REPLServer` accetteranno singole righe di input dell'utente, le valuteranno in base a una funzione di valutazione definita dall'utente, quindi restituiranno il risultato. Input e output possono essere rispettivamente da `stdin` e da `stdout`, oppure possono essere collegati a qualsiasi [stream](stream.html) di Node.js.

Le istanze di `repl.REPLServer` supportano il completamento automatico degli input, l'editing di riga in stile Emacs semplicistico, gli input multi-linea, l'output in stile ANSI, il salvataggio e il ripristino dello stato di sessione REPL corrente, il recupero degli errori e le funzioni di valutazione personalizzabili.

### Comandi e Tasti Speciali

I seguenti comandi speciali sono supportati da tutte le istanze REPL:

* `.break` - Quando nel processo di immissione di un'espressione su più righe, l'inserimento del comando `.break` (o la pressione della combinazione dei tasti `&lt;ctrl&gt;-C`) interromperà ulteriori input o elaborazioni di quell'espressione.
* `.clear` - Reimposta il `context` REPL su un object vuoto e cancella qualsiasi espressione su più righe in fase di immissione in quel momento.
* `.exit` - Chiude lo stream I/O, provocando l'uscita del REPL.
* `.help` - Mostra questo elenco di comandi speciali.
* `.save` - Salva la sessione REPL corrente in un file: `> .save ./file/to/save.js`
* `.load` - Carica un file nella sessione REPL corrente. `> .load ./file/to/load.js`
* `.editor` Entra in modalità editor (`&lt;ctrl&gt;-D` per finire, `&lt;ctrl&gt;-C` per cancellare)
```js
> .editor
// Entrata nella modalità editor (^D per finire, ^C per cancellare)
function welcome(name) {
  return `Hello ${name}!`;
}

welcome('Node.js User');

// ^D
'Hello Node.js User!'
>
```

Le seguenti combinazioni di tasti nel REPL hanno questi effetti speciali:

* `&lt;ctrl&gt;-C` - Se premuto una volta, ha lo stesso effetto del comando `.break`. Quando viene premuto due volte su una riga vuota, ha lo stesso effetto del comando `.exit`.
* `&lt;ctrl&gt;-D` - Ha lo stesso effetto del comando `.exit`.
* `<tab>` - When pressed on a blank line, displays global and local(scope) variables. Quando viene premuto mentre si immette un altro input, visualizza le opzioni di completamento automatico rilevanti.

### Valutazione Predefinita

Per impostazione predefinita, tutte le istanze di `repl.REPLServer` utilizzano una funzione di valutazione che valuta le espressioni JavaScript e fornisce l'accesso ai moduli incorporati di Node.js. Questo comportamento predefinito può essere sovrascritto passando in una funzione di valutazione alternativa quando viene creata l'istanza `repl.REPLServer`.

#### Espressioni JavaScript

Il programma di valutazione predefinito supporta la valutazione diretta delle espressioni JavaScript:
```js
> 1 + 1
2
> const m = 2
undefined
> m + 1
3
```

Salvo diversamente specificato all'interno di blocchi o funzioni, le variabili dichiarate in modo implicito o utilizzando le parole chiave `const`, `let` o `var` vengono dichiarate nello scope globale.

#### Scope Globale e Locale

Il programma di valutazione predefinito fornisce l'accesso a qualsiasi variabile esistente nello scope globale. È possibile esporre esplicitamente una variabile al REPL assegnandola al `context` object associato a ciascun `REPLServer`. Per esempio:

```js
const repl = require('repl');
const msg = 'message';

repl.start('> ').context.m = msg;
```

Le proprietà nel `context` object vengono visualizzate come locali all'interno del REPL:
```js
$ node repl_test.js
> m
'message'
```

Le proprietà del contesto non sono di sola lettura per impostazione predefinita. Per specificare globali di sola lettura, le proprietà del contesto devono essere definite utilizzando `Object.defineProperty()`:

```js
const repl = require('repl');
const msg = 'message';

const r = repl.start('> ');
Object.defineProperty(r.context, 'm', {
  configurable: false,
  enumerable: true,
  value: msg
});
```

#### Accesso ai Moduli Core Node.js

Quando viene utilizzato, il programma di valutazione predefinito caricherà automaticamente i moduli core Node.js nell'ambiente REPL. Ad esempio, se non diversamente dichiarato come variabile globale o con scope, l'input `fs` sarà valutato su richiesta come `global.fs = require('fs')`.
```js
> fs.createReadStream('./some/file');
```

#### Assegnazione della variabile `_` (underscore)

Per impostazione predefinita, il programma di valutazione predefinito assegnerà il risultato dell'espressione valutata più recentemente alla variabile speciale `_ ` (underscore). L'impostazione esplicita di `_` su un valore disabiliterà questo comportamento.
```js
> [ 'a', 'b', 'c' ]
[ 'a', 'b', 'c' ]
> _.length
3
> _ += 1
Expression assignment to _ now disabled.
4
> 1 + 1
2
> _
4
```

### Funzioni di Valutazione Personalizzate

Quando viene creato un nuovo `repl.REPLServer`, può essere fornita una funzione di valutazione personalizzata. Questo può essere utilizzato, ad esempio, per implementare applicazioni REPL completamente personalizzate.

Di seguito viene illustrato un esempio ipotetico di un REPL che esegue la traduzione del testo da una lingua ad un'altra:

```js
const repl = require('repl');
const { Translator } = require('translator');

const myTranslator = new Translator('en', 'fr');

function myEval(cmd, context, filename, callback) {
  callback(null, myTranslator.translate(cmd));
}

repl.start({ prompt: '> ', eval: myEval });
```

#### Errori Recuperabili

Quando un utente digita l'input nel prompt REPL, premendo il tasto `&lt;enter&gt;` invierà la riga corrente di input alla funzione `eval`. Per supportare un input su più righe, la funzione eval può restituire un'istanza di `repl.Recoverable` alla funzione di callback fornita:

```js
function myEval(cmd, context, filename, callback) {
  let result;
  try {
    result = vm.runInThisContext(cmd);
  } catch (e) {
    if (isRecoverableError(e)) {
      return callback(new repl.Recoverable(e));
    }
  }
  callback(null, result);
}

function isRecoverableError(error) {
  if (error.name === 'SyntaxError') {
    return /^(Unexpected end of input|Unexpected token)/.test(error.message);
  }
  return false;
}
```

### Personalizzazione dell'Output REPL

By default, `repl.REPLServer` instances format output using the [`util.inspect()`][] method before writing the output to the provided Writable stream (`process.stdout` by default). L'opzione booleana `useColors` può essere specificata in fase di costruzione per indicare al writer predefinito di utilizzare i codici di stile ANSI per colorare l'output dal metodo `util.inspect()`.

È possibile personalizzare completamente l'output di un'istanza `repl.REPLServer` passando una nuova funzione nell'utilizzo dell'opzione `writer` in fase di costruzione. La seguente dimostrazione, ad esempio, converte semplicemente qualsiasi testo di input in maiuscolo:

```js
const repl = require('repl');

const r = repl.start({ prompt: '> ', eval: myEval, writer: myWriter });

function myEval(cmd, context, filename, callback) {
  callback(null, cmd);
}

function myWriter(output) {
  return output.toUpperCase();
}
```

## Class: REPLServer<!-- YAML
added: v0.1.91
-->La classe `repl.REPLServer` eredita dalla classe [`readline.Interface`][]. Le istanze di `repl.REPLServer` vengono create utilizzando il metodo `repl.start()` e *non devono* essere create direttamente utilizzando la parola chiave `new` di JavaScript.

### Event: 'exit'<!-- YAML
added: v0.7.7
-->L'evento `'exit'` viene emesso quando REPL viene chiuso ricevendo il comando `.exit` come input, con l'utente che preme `&lt;ctrl&gt;-C` due volte per segnalare `SIGINT` o premendo `&lt;ctrl&gt;-D` per segnalare `'end'` sullo stream di input. Il callback del listener viene invocato senza alcun argomento.

```js
replServer.on('exit', () => {
  console.log('Received "exit" event from repl!');
  process.exit();
});
```

### Event: 'reset'<!-- YAML
added: v0.11.0
-->L'evento `'reset'` viene emesso quando il contesto di REPL viene reimpostato. Ciò si verifica ogni volta che il comando `.clear` viene ricevuto come input *eccetto* quando il REPL sta utilizzando il programma di valutazione predefinito e l'istanza `repl.REPLServer` è stata creata con l'opzione `useGlobal` impostata su `true`. Il callback del listener verrà chiamato con un riferimento al `context` object come unico argomento.

Questo può essere utilizzato principalmente per reinizializzare il contesto REPL ad uno stato predefinito come illustrato nel seguente semplice esempio:

```js
const repl = require('repl');

function initializeContext(context) {
  context.m = 'test';
}

const r = repl.start({ prompt: '> ' });
initializeContext(r.context);

r.on('reset', initializeContext);
```

Quando questo codice viene eseguito, la variabile globale `'m'` può essere modificata ma poi reimpostata al suo valore iniziale usando il comando `.clear`:
```js
$ ./node example.js
> m
'test'
> m = 1
1
> m
1
> .clear
Clearing context...
> m
'test'
>
```

### replServer.defineCommand(keyword, cmd)<!-- YAML
added: v0.3.0
-->* `keyword` {string} La parola chiave del comando (*senza* carattere iniziale `.`).
* `cmd` {Object|Function} La funzione da invocare quando il comando viene elaborato.

Il metodo `replServer.defineCommand()` viene utilizzato per aggiungere nuovi comandi `.`-prefissati all'istanza REPL. Tali comandi vengono invocati digitando un `.` seguito dalla `keyword`. The `cmd` is either a Function or an object with the following properties:

* `help` {string} Testo di aiuto da visualizzare quando viene inserito `.help` (Opzionale).
* `action` {Function} La funzione da eseguire, accettando facoltativamente un argomento a stringa singola.

L'esempio seguente mostra due nuovi comandi aggiunti all'istanza REPL:

```js
const repl = require('repl');

const replServer = repl.start({ prompt: '> ' });
replServer.defineCommand('sayhello', {
  help: 'Say hello',
  action(name) {
    this.bufferedCommand = '';
    console.log(`Hello, ${name}!`);
    this.displayPrompt();
  }
});
replServer.defineCommand('saybye', function saybye() {
  console.log('Goodbye!');
  this.close();
});
```

I nuovi comandi possono quindi essere utilizzati dall'interno dell'istanza REPL:

```txt
> .sayhello Node.js User
Hello, Node.js User!
> .saybye
Goodbye!
```

### replServer.displayPrompt([preserveCursor])<!-- YAML
added: v0.1.91
-->* `preserveCursor` {boolean}

Il metodo `replServer.displayPrompt()` prepara l'istanza REPL per l'input dall'utente, stampando il `prompt` configurato su una nuova riga nell'`output` e ripristinando l'`input` per accettare un nuovo input.

Quando viene immesso un input su più righe, vengono stampati dei puntini di sospensione anziché il "prompt".

Quando `preserveCursor` è `true`, la posizione del cursore non verrà reimpostata su `0`.

Il metodo `replServer.displayPrompt` è destinato principalmente a essere chiamato dall'interno della funzione di azione per i comandi registrati utilizzando il metodo `replServer.defineCommand()`.

## repl.start([options])<!-- YAML
added: v0.1.91
changes:
  - version: v5.8.0
    pr-url: https://github.com/nodejs/node/pull/5388
    description: The `options` parameter is optional now.
-->* `options` {Object|string}
  * `prompt` {string} Il prompt dell'input da visualizzare. **Default:** `>`. (with a trailing space).
  * `input` {stream.Readable} The Readable stream from which REPL input will be read. **Default:** `process.stdin`.
  * `output` {stream.Writable} The Writable stream to which REPL output will be written. **Default:** `process.stdout`.
  * `terminal` {boolean} Se `true`, specifica che l'`output` deve essere trattato come un terminale TTY e deve avere i codici di escape ANSI/VT100 scritti su di esso. **Default:** verifica il valore della proprietà `isTTY` sullo stream di `output` dopo l'istanziazione.
  * `eval` {Function} La funzione da utilizzare quando si valuta ogni riga specifica di input. **Default:** un wrapper asincrono per la funzione `eval()` di JavaScript. Una funzione `eval` può generare un errore con `repl.Recoverable` nel tentativo di indicare che l'input era incompleto e può richiedere linee aggiuntive.
  * `useColors` {boolean} Se `true`, specifica che la funzione `writer` predefinita deve includere lo stile dei colori ANSI per l'output REPL. Se viene fornita una funzione `writer` personalizzata, ciò non ha alcun effetto. **Default:** il valore `terminal` delle istanze REPL.
  * `useGlobal` {boolean} Se `true`, specifica che la funzione di valutazione predefinita utilizzerà il `global` di JavaScript come contesto anziché creare un nuovo contesto separato per l'istanza REPL. Il nodo REPL CLI imposta questo valore su `true`. **Default:** `false`.
  * `ignoreUndefined` {boolean} Se `true`, specifica che il writer predefinito non genererà il valore restituito di un comando se si valuta `undefined`. **Default:** `false`.
  * `writer` {Function} La funzione da invocare per formattare l'output di ciascun comando prima di scrivere sull'`output`. **Default:** [`util.inspect()`][].
  * `completer` {Function} Una funzione opzionale utilizzata per il completamento automatico di Tab. Vedi [`readline.InterfaceCompleter`][] per un esempio.
  * `replMode` {symbol} A flag that specifies whether the default evaluator executes all JavaScript commands in strict mode or default (sloppy) mode. I valori accettabili sono:
    * `repl.REPL_MODE_SLOPPY` - valuta le espressioni in modalità sloppy.
    * `repl.REPL_MODE_STRICT` - valuta le espressioni in modalità strict. Questo è equivalente all'anteporre `'use strict'` davanti ad ogni istruzione repl.
    * `repl.REPL_MODE_MAGIC` - This value is **deprecated**, since enhanced spec compliance in V8 has rendered magic mode unnecessary. It is now equivalent to `repl.REPL_MODE_SLOPPY` (documented above).
  * `breakEvalOnSigint` - Interrompe la valutazione dell'attuale pezzo di codice quando viene ricevuto `SIGINT`, ovvero quando viene premuto `Ctrl+C`. Questo non può essere utilizzato insieme ad una funzione di `eval` personalizzata. **Default:** `false`.

Il metodo `repl.start()` crea e avvia un'istanza `repl.REPLServer`.

Se `options` è una stringa, allora specifica il prompt di input:

```js
const repl = require('repl');

// un prompt in stile Unix
repl.start('$ ');
```

## Il REPL di Node.js

Node.js stesso utilizza il modulo `repl` per fornire la propria interfaccia interattiva per l'esecuzione di JavaScript. Questo può essere utilizzato eseguendo il binario di Node.js senza passare alcun argomento (o passando l'argomento `-i`):
```js
$ node
> const a = [1, 2, 3];
undefined
> a
[ 1, 2, 3 ]
> a.forEach((v) => {
...   console.log(v);
...   });
1
2
3
```

### Opzioni Variabili d'Ambiente

I vari comportamenti del REPL di Node.js possono essere personalizzati utilizzando le seguenti variabili di ambiente:

 - `NODE_REPL_HISTORY` - When a valid path is given, persistent REPL history will be saved to the specified file rather than `.node_repl_history` in the user's home directory. Setting this value to `''` will disable persistent REPL history. Lo spazio bianco sarà aggiustato dal valore.
 - `NODE_REPL_HISTORY_SIZE` - Controls how many lines of history will be persisted if history is available. Deve essere un numero positivo. **Default:** `1000`.
 - `NODE_REPL_MODE` - May be any of `sloppy`, `strict`, or `magic`. `magic` is **deprecated** and treated as an alias of `sloppy`. **Default:** `sloppy`, which will allow non-strict mode code to be run.

### Cronologia Persistente

Per impostazione predefinita, il REPL di Node.js manterrà la cronologia tra le sessioni REPL del `node` salvando gli input in un file `.node_repl_history` situato nella home directory dell'utente. This can be disabled by setting the environment variable `NODE_REPL_HISTORY=""`.

#### NODE_REPL_HISTORY_FILE<!-- YAML
added: v2.0.0
deprecated: v3.0.0
-->> Stability: 0 - Deprecated: Use `NODE_REPL_HISTORY` instead.

Previously in Node.js/io.js v2.x, REPL history was controlled by using a `NODE_REPL_HISTORY_FILE` environment variable, and the history was saved in JSON format. This variable has now been deprecated, and the old JSON REPL history file will be automatically converted to a simplified plain text format. This new file will be saved to either the user's home directory, or a directory defined by the `NODE_REPL_HISTORY` variable, as documented in the [Environment Variable Options](#repl_environment_variable_options).

### Utilizzo del REPL di Node.js con editor di riga avanzati

Per gli editor di riga avanzati, avviare Node.js con la variabile di ambiente `NODE_NO_READLINE=1`. Questo avvierà il REPL principale e del debugger nelle impostazioni del terminale canonico, che ne permetteranno l'uso con `rlwrap`.

Ad esempio, ciò che segue può essere aggiunto a un file `.bashrc`:

```text
alias node="env NODE_NO_READLINE=1 rlwrap node"
```

### Avvio di più istanze REPL su una singola istanza in esecuzione

È possibile creare ed eseguire più istanze REPL su una singola istanza di Node.js in esecuzione che condivide un singolo `global` object ma possiede interfacce I/O separate.

Il seguente caso, ad esempio, fornisce REPL separati su `stdin`, un socket Unix ed un socket TCP:

```js
const net = require('net');
const repl = require('repl');
let connections = 0;

repl.start({
  prompt: 'Node.js via stdin> ',
  input: process.stdin,
  output: process.stdout
});

net.createServer((socket) => {
  connections += 1;
  repl.start({
    prompt: 'Node.js via Unix socket> ',
    input: socket,
    output: socket
  }).on('exit', () => {
    socket.end();
  });
}).listen('/tmp/node-repl-sock');

net.createServer((socket) => {
  connections += 1;
  repl.start({
    prompt: 'Node.js via TCP socket> ',
    input: socket,
    output: socket
  }).on('exit', () => {
    socket.end();
  });
}).listen(5001);
```

L'esecuzione di questa applicazione dalla riga di comando avvierà un REPL su stdin. Altri client REPL possono connettersi tramite il socket Unix o il socket TCP. `telnet`, ad esempio, è utile per la connessione ai socket TCP, mentre `socat` può essere utilizzato per connettersi sia ai socket Unix sia ai TCP.

Avviando un REPL da un server basato su socket Unix invece di stdin, è possibile connettersi a un processo Node.js con esecuzione prolungata senza riavviarlo.

For an example of running a "full-featured" (`terminal`) REPL over a `net.Server` and `net.Socket` instance, see: https://gist.github.com/2209310

For an example of running a REPL instance over [curl(1)](https://curl.haxx.se/docs/manpage.html), see: https://gist.github.com/2053342
