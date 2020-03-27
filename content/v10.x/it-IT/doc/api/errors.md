# Errori

<!--introduced_in=v4.0.0-->
<!--type=misc-->

Le applicazioni in esecuzione in Node.js in genere riscontreranno quattro categorie di errori:

- Standard JavaScript errors such as {EvalError}, {SyntaxError}, {RangeError},
{ReferenceError}, {TypeError}, and {URIError}.
- System errors triggered by underlying operating system constraints such as attempting to open a file that does not exist or attempting to send data over a closed socket.
- User-specified errors triggered by application code.
- `AssertionError`s are a special class of error that can be triggered when Node.js detects an exceptional logic violation that should never occur. Questi di solito vengono generati dal modulo `assert`.

Tutti gli errori JavaScript e di Sistema generati da Node.js ereditano dalla, o sono istanze della, classe standard JavaScript {Error} e garantiscono di fornire *almeno* le proprietà disponibili su quella classe.

## Propagazione e Intercettazione degli Errori

<!--type=misc-->

Node.js supporta diversi meccanismi per la propagazione e la gestione degli errori che si verificano mentre un'applicazione è in esecuzione. Il modo in cui questi errori vengono segnalati e gestiti dipende interamente dal tipo di `Error` e dallo stile dell'API che viene chiamata.

Tutti gli errori JavaScript sono gestiti come eccezioni che generano ed inviano *immediatamente* un errore usando il meccanismo standard di JavaScript `throw`. These are handled using the [`try…catch` construct](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch) provided by the JavaScript language.

```js
// Throws with a ReferenceError because z is not defined.
try {
  const m = 1;
  const n = m + z;
} catch (err) {
  // Handle the error here.
}
```

Any use of the JavaScript `throw` mechanism will raise an exception that *must* be handled using `try…catch` or the Node.js process will exit immediately.

Con poche eccezioni, le API _Sincrone_ (qualsiasi metodo di blocco che non accetta una funzione `callback`, come ad esempio [`fs.readFileSync`][]), utilizzerà `throw` per segnalare gli errori.

Gli errori che si verificano all'interno di _API Asincrone_ possono essere segnalati in diversi modi:

- La maggior parte dei metodi asincroni che accettano una funzione `callback` accetteranno un oggetto `Error` passato come primo argomento a quella funzione. Se questo primo argomento non è `null` ed è un istanza di `Error`, allora si è verificato un errore che dovrebbe essere gestito.
  ```js
  const fs = require('fs');
  fs.readFile('a file that does not exist', (err, data) => {
    if (err) {
      console.error('There was an error reading the file!', err);
      return;
    }
    // Otherwise handle the data
  });
  ```
- When an asynchronous method is called on an object that is an [`EventEmitter`][], errors can be routed to that object's `'error'` event.

  ```js
  const net = require('net');
  const connection = net.connect('localhost');

  // Adding an 'error' event handler to a stream:
  connection.on('error', (err) => {
    // If the connection is reset by the server, or if it can't
    // connect at all, or on any sort of error encountered by
    // the connection, the error will be sent here.
    console.error(err);
  });

  connection.pipe(process.stdout);
  ```

- A handful of typically asynchronous methods in the Node.js API may still use the `throw` mechanism to raise exceptions that must be handled using `try…catch`. Non esiste una lista completa di tali metodi; consultare la documentazione di ogni metodo per determinare il meccanismo più appropriato di gestione degli errori.

L'utilizzo del meccanismo `'error' ` event è più comune per API di tipo [stream-based](stream.html) ed [event emitter-based](events.html#events_class_eventemitter), le quali rappresentano una serie di operazioni asincrone nel tempo (diversamente da una singola operazione che potrebbe passare o fallire).

For *all* [`EventEmitter`][] objects, if an `'error'` event handler is not provided, the error will be thrown, causing the Node.js process to report an uncaught exception and crash unless either: The [`domain`](domain.html) module is used appropriately or a handler has been registered for the [`'uncaughtException'`][] event.

```js
const EventEmitter = require('events');
const ee = new EventEmitter();

setImmediate(() => {
  // Questo causerà il crash del processo perché non è stato aggiunto alcun
  // handler dell’evento 'error'.
  ee.emit('error', new Error('This will crash'));
});
```

Errors generated in this way *cannot* be intercepted using `try…catch` as they are thrown *after* the calling code has already exited.

Gli sviluppatori devono fare riferimento alla documentazione di ogni metodo per determinare esattamente in che modo vengono propagati gli errori creati da questi metodi.

### Callback error-first<!--type=misc-->Most asynchronous methods exposed by the Node.js core API follow an idiomatic pattern referred to as an _error-first callback_. With this pattern, a callback function is passed to the method as an argument. When the operation either completes or an error is raised, the callback function is called with the `Error` object (if any) passed as the first argument. If no error was raised, the first argument will be passed as `null`.

```js
const fs = require('fs');

function errorFirstCallback(err, data) {
  if (err) {
    console.error('There was an error', err);
    return;
  }
  console.log(data);
}

fs.readFile('/some/file/that/does-not-exist', errorFirstCallback);
fs.readFile('/some/file/that/does-exist', errorFirstCallback);
```

The JavaScript `try…catch` mechanism **cannot** be used to intercept errors generated by asynchronous APIs. Un errore comune per i principianti è quello di cercare di usare `throw` all'interno di un callback error-first:

```js
//QUESTO NON FUNZIONERÀ:
const fs = require('fs');

try {
  fs.readFile('/some/file/that/does-not-exist', (err, data) => {
    // ipotesi errata: generando qui...
    if (err) {
      throw err;
    }
  });
} catch (err) {
  // Questo non prenderà il throw!
  console.error(err);
}
```

Questo non funzionerà perché la funzione callback passata a `fs.redFile()` è chiamata in modo asincrono. Per quando il callback è stato chiamato, il codice circostante (incluso il blocco `try { } catch (err) { }` sarà già stato chiuso. Nella maggior parte dei casi, generare un errore all'interno del callback **può causare il crash del processo Node.js**. Se sono abilitati i [domini](domain.html), oppure un handler è stato registrato con `process.on('uncaughtException')`, tali errori possono essere intercettati.

## Classe: Errore<!--type=class-->Un `Error` object generico di JavaScript che non denota alcuna circostanza specifica per cui si è verificato l'errore. Gli `Error` object acquisiscono una "stack trace" che specifica il punto esatto, all'interno del codice, in cui è stato istanziato l'`Errore`, e potrebbe fornire una descrizione di testo dell'errore.

Solo per crypto, gli `Error` object includeranno l'error stack OpensSSL in una proprietà separata chiamata `opensslErrorStack` se questa è disponibile quando l'errore viene generato.

Tutti gli errori generati da Node.js, inclusi tutti gli errori di Sistema e di Javascript, o saranno istanze della classe `Error` oppure erediteranno da essa.

### nuovo Error(message)

* `message` {string}

Crea un nuovo `Error` object e imposta la proprietà `error.message` al messaggio di testo fornito. Se un oggetto viene passato come `message`, il messaggio di testo è generato chiamando `message.toString()`. La proprietà `error.stack` rappresenterà il punto esatto all'interno del codice in cui è stato chiamato `new Error()`. Le stack trace sono dipendenti dalle [V8's stack trace API](https://github.com/v8/v8/wiki/Stack-Trace-API). Le Stack trace si estendono solo a (a) l'inizio del *synchronous code execution*, oppure (b) il numero di frame dato dalla proprietà `Error.stackTraceLimit`, qualunque sia il più piccolo.

### Error.captureStackTrace(targetObject[, constructorOpt])

* `targetObject` {Object}
* `constructorOpt` {Function}

Crea una proprietà `.stack` su `targetObject`, la quale quando viene acceduta restituisce una stringa che rappresenta il punto esatto all'interno del codice in cui è stata chiamata `Error.captureStackTrace()`.

```js
const myObject = {};
Error.captureStackTrace(myObject);
myObject.stack;  // simile a `new Error().stack`
```

The first line of the trace will be prefixed with `${myObject.name}: ${myObject.message}`.

L'argomento facoltativo `constructorOpt` accetta una funzione. Se richiesto, tutti i frame sopra `constructorOpt`, incluso `constructorOpt`, saranno omessi dalla stack trace generata.

L'argomento `constructorOpt` è utile per nascondere all'utente finale i dettagli di implementazione della generazione dell'errore. Ad esempio:

```js
function MyError() {
  Error.captureStackTrace(this, MyError);
}

// Senza passare MyError a captureStackTrace, il MyError
// frame verrebbe mostrato nella proprietà  .Stack. Passando
// il constructor, omettiamo quel frame, e manteniamo tutti i frame inferiori.
new MyError().stack;
```

### Error.stackTraceLimit

* {number}

La proprietà `Error.stackTraceLimit` specifica il numero di stack frame collezionati da una stack trace (generata da `new Error().stack` o da `Error.captureStackTrace(obj)`).

Il valore predefinito è `10` ma può essere impostato su un qualsiasi numero JavaScript valido. Le modifiche influiranno su qualsiasi stack trace catturata *dopo* che il valore è stato cambiato.

Se impostato su un valore non numerico, o impostato su un valore numerico negativo, le stack trace non cattureranno nessun frame.

### error.code

* {string}

La proprietà `error.code` è un etichetta di stringa che identifica il tipo de errore. `error.code` is the most stable way to identify an error. It will only change between major versions of Node.js. In contrast, `error.message` strings may change between any versions of Node.js. See [Node.js Error Codes](#nodejs-error-codes) for details about specific codes.

### error.message

* {string}

La proprietà `error.message` è la descrizione di tipo stringa dell'errore come fu impostata chiamando `new Error(messasge)`. Il `message` passato al constructor apparirà anche nella prima riga dello stack trace dell'`Error`, tuttavia cambiando questa proprietà dopo che l'`Error` object è stato creato *potrebbe non* cambiare la prima riga dello stack trace (ad esempio, quando `error.stack` viene letto prima che questa proprietà sia cambiata).

```js
const err = new Error('The message');
console.error(err.message);
// Stampa: Il messaggio
```

### error.stack

* {string}

La proprietà `error.stack` è una stringa che descrive il punto esatto all'interno del codice in cui è stato istanziato l'`Errore`.

```txt
Errore: Continuano ad accadere cose!
   at /home/gbusey/file.js:525:2
at Frobnicator.refrobulate (/home/gbusey/business-logic.js:424:21)
at Actor.&lt;anonymous&gt; (/home/gbusey/actors.js:400:8)
at increaseSynergy (/home/gbusey/actors.js:701:6)
```

La prima riga viene formattata come `<error class name>: <error message>`, ed è seguita da una serie di stack frame (ogni riga inizia con "at"). Ogni frame descrive un sito di chiamata all'interno del codice che conduce all'errore generato. V8 prova a mostrare un nome per ogni funzione (dal nome della variabile, nome della funzione, o nome del metodo dell'oggetto), ma a volte non riuscirà a trovare un nome adatto. Se V8 non riesce a determinare un nome per la funzione, per quel frame verrà mostrata solo la posizione. Altrimenti, il nome determinato per la funzione verrà mostrato con le informazioni riguardanti la posizione aggiunte tra parentesi.

I frame sono generati solo per le funzioni JavaScript. Se, ad esempio, l'esecuzione passa in modo sincrono attraverso una funzione aggiuntiva di C++ chiamata `cheetahify` la quale a sua volta chiama una funzione JavaScript, il frame che rappresenta la chiamata a `cheetahify` non sarà presente nelle stack trace:

```js
const cheetahify = require('./native-binding.node');

function makeFaster() {
  // cheetahify  chiama speedy *in modo sincrono*.
  cheetahify(function speedy() {
    throw new Error('oh no!');
  });
}

makeFaster();
// genererà:
//   /home/gbusey/file.js:6
//       genera nuovo errore ('oh no!');
//           ^
//   Errore: oh no!
//       at speedy (/home/gbusey/file.js:6:11)
//       at makeFaster (/home/gbusey/file.js:5:3)
//       at Object.&lt;anonymous&gt; (/home/gbusey/file.js:10:1)
//       at Module._compile (module.js:456:26)
//       at Object.Module._extensions..js (module.js:474:10)
//       at Module.load (module.js:356:32)
//       at Function.Module._load (module.js:312:12)
//       at Function.Module.runMain (module.js:497:10)
//       at startup (node.js:119:16)
//       at node.js:906:3
```

Le informazioni di posizione saranno di tipo:

* `native`, se il frame rappresenta una chiamata interna a V8 (come in `[].forEach`).
* `plain-filename.js:line:column`, se il frame rappresenta una chiamata interna a Node.js.
* `/absolute/path/to/file.js:line:column`, se il frame rappresenta una chiamata in un programma utente, o nelle relative dipendenze.

La stringa che rappresenta la stack trace è generata in modalità lazy quando **si effettua l'accesso** alla proprietà `error.stack`.

Il numero di frame catturati dalla stack trace è delimitato dal più piccolo degli `Error.stackTraceLimit` o dal numero di frame disponibili sull'event loop tick attuale.

Gli errori a livello di sistema sono generati come istanze `Error` aumentate, che sono dettagliate [qui](#errors_system_errors).

## Classe: AssertionError

Una sottoclasse di `Error` che indica il fallimento di un assertion. For details, see [`Class: assert.AssertionError`][].

## Classe: RangeError

Una sottoclasse di `Error` che indica che un argomento fornito non era all'interno dell'insieme o del range di valori accettabili per una funzione; sia che si tratti di un valore numerico o al di fuori dell'insieme di opzioni per un dato parametro di funzione.

```js
require('net').connect(-1);
// genera "RangeError: l'opzione "port" dovrebbe essere >= 0 and < 65536: -1"
```

Node.js genererà e lancerà le istanze `RangeError` *immediatamente* come una forma di validazione dell'argomento.

## Classe: ReferenceError

Una sottoclasse di `Error` che indica che c'è stato un tentativo di accesso ad una variabile che non è stata definita. Tali errori solitamente indicano errori di battitura nel codice, oppure un programma danneggiato.

Mentre il codice di tipo client potrebbe generare e propagare questi errori, in pratica, solo V8 lo farà.

```js
doesNotExist;
// genera ReferenceError, doesNotExist non è una variabile in questo programma.
```

A meno che un'applicazione non stia generando ed eseguendo codice in maniera dinamica, le istanze di `ReferenceError` dovrebbero sempre essere considerate come un bug nel codice o nelle relative dipendenze.

## Classe: SyntaxError

Una sottoclasse di `Error` che indica che un programma non è un JavaScript valido. Questi errori potrebbero essere generati e propagati solamente come risultato di una valutazione del codice. La valutazione del codice potrebbe accadere come risultato di `eval`, `Function`, `require`, o [vm](vm.html). Questi errori sono quasi sempre indicativi di un programma danneggiato.

```js
try {
  require('vm').runInThisContext('binary ! isNotOk');
} catch (err) {
  // l'errore sarà del tipo SyntaxError
}
```

Le istanze di tipo `SyntaxError` non sono recuperabili nel contesto che le ha create - possono essere catturate solo da altri contesti.

## Classe: TypeError

Una sottoclasse di `Error` che indica che un argomento fornito non è un tipo di argomento consentito. For example, passing a function to a parameter which expects a string would be considered a `TypeError`.

```js
require('url').parse(() => { });
// genera TypeError, dato che si aspettava una stringa
```

Node.js genererà e mostrerà le istanze `TypeError` *immediatamente* come una forma di validazione dell'argomento.

## Eccezioni vs. Errori<!--type=misc-->Un'eccezione JavaScript viene generata come risultato di un operazione non valida o come obbiettivo di un'istruzione `throw`. While it is not required that these values are instances of `Error` or classes which inherit from `Error`, all exceptions thrown by Node.js or the JavaScript runtime *will* be instances of `Error`.

Alcune eccezione sono *non recuperabili* al livello di JavaScript. Tali eccezione causeranno *sempre* l'arresto del processo Node.js. Gli esempi includono verifiche `assert()` o chiamate `abort()` nel livello di C++.

## Errori di Sistema

Node.js generates system errors when exceptions occur within its runtime environment. These usually occur when an application violates an operating system constraint. For example, a system error will occur if an application attempts to read a file that does not exist.

System errors are usually generated at the syscall level. For a comprehensive list, see the [`errno`(3) man page][].

In Node.js, system errors are `Error` objects with extra properties.

### Classe: SystemError

* `address` {string} If present, the address to which a network connection failed
* `code` {string} The string error code
* `dest` {string} If present, the file path destination when reporting a file system error
* `errno` {number|string} The system-provided error number
* `info` {Object} If present, extra details about the error condition
* `message` {string} A system-provided human-readable description of the error
* `path` {string} If present, the file path when reporting a file system error
* `port` {number} If present, the network connection port that is not available
* `syscall` {string} The name of the system call that triggered the error

#### error.address

* {string}

If present, `error.address` is a string describing the address to which a network connection failed.

#### error.code

* {string}

The `error.code` property is a string representing the error code.

#### error.dest

* {string}

If present, `error.dest` is the file path destination when reporting a file system error.

#### error.errno

* {string|number}

La proprietà `error.errno` è un numero o una stringa. If it is a number, it is a negative value which corresponds to the error code defined in [`libuv Error handling`]. See the libuv `errno.h` header file (`deps/uv/include/uv/errno.h` in the Node.js source tree) for details. Nel caso di una stringa, è uguale a `error.code`.

#### error.info

* {Object}

If present, `error.info` is an object with details about the error condition.

#### error.message

* {string}

`error.message` is a system-provided human-readable description of the error.

#### error.path

* {string}

If present, `error.path` is a string containing a relevant invalid pathname.

#### error.port

* {number}

If present, `error.port` is the network connection port that is not available.

#### error.syscall

* {string}

The `error.syscall` property is a string describing the [syscall](http://man7.org/linux/man-pages/man2/syscalls.2.html) that failed.

### Errori di Sistema Comuni

This is a list of system errors commonly-encountered when writing a Node.js program. For a comprehensive list, see the [`errno`(3) man page][].

- `EACCES` (Permesso negato): È stato effettuato un tentativo di accedere ad un file in un modo vietato dai permessi di accesso del file.

- `EADDRINUSE` (Indirizzo già esistente): Un tentativo di collegare un server di tipo ([`net`][], [`http`][] o [`https`] []) ad un indirizzo locale è fallito perché nel sistema locale è presente un altro server che occupa quell'indirizzo.

- `ECONNREFUSED` (Connessione rifiutata) Non è stato possibile creare una connessione perché la macchina di destinazione l'ha rifiutata in maniera attiva. Questo è solitamente dovuto a tentativi di connessione ad un servizio che è inattivo sul host esterno.

- `ECONNRESET` (Connessione ripristinata dal peer): Una connessione e stata chiusa da un peer in maniera forzata. Questo è solitamente il risultato di una perdita della connessione sul socket remoto a causa di un timeout o un riavvio. Comunemente riscontrati attraverso i moduli [`http`][] e [`net`][].

- `EEXIST`(File esistente): Un file esistente e stato la destinazione di un operazione che richiedeva una destinazione inesistente.

- `EISDIR` (È una cartella): Un’operazione si aspettava un file, ma il pathname fornito era una cartella.

- `EMFILE` (Troppi file aperti nel sistema): È stato raggiunto il numero massimo di [file descrittori](https://en.wikipedia.org/wiki/File_descriptor) consentito dal sistema, e la richiesta per un altro descrittore non potrà essere elaborata finché almeno un file descrittore non sarà stato chiuso. Questo errore viene incontrato quando si aprono troppi file contemporaneamente in parallelo, sopratutto nei sistemi in cui c'è un limite basso per file descrittori per i processi (in particolare macOS). Per rimediare a questo limite basso, eseguire `ulimit - n 2048` nella stessa shell che eseguirà il processo Node.js.

- `ENOENT` (Nessun file o directory di questo tipo): Tipicamente generato da operazioni [`fs`] [] per indicare che un componente del pathname specificato non esiste —il path fornito non è riuscito a trovare nessuna entità (file o cartella).

- `ENOTDIR` (Non è una cartella): Un componente del pathname fornito era esistente, ma non era una cartella come era previsto. Di solito generata da [`fs.readdir`][].

- `ENOTEMPTY` (La cartella non è vuota): Una cartella contenente voci era la destinazione di un'operazione che necessita una cartella vuota — di solito [`fs.unlink`][].

- `EPERM` (Operazione non consentita): È stato effettuato un tentativo di effettuare un'operazione che richiede privilegi elevati.

- `EPIPE` (Broken pipe): Una scrittura su un pipe, socket o FIFO per la quale non è presente nessun processo per leggerne i dati. Di solito incontrati a livello di [`net`][] e [`http`][], ed indicano che il lato remoto dello stream su cui si stava scrivendo è stato chiuso.

- `ETIMEDOUT` (Operazione scaduta): Una richiesta di connessione o di invio ha fallito perché l'entità connessa non ha risposto correttamente dopo un certo periodo di tempo. Di solito incontrata da [`http`][] o [`net`][] — spesso è un segno che un `socket.end()` non è stato chiamato correttamente.

<a id="nodejs-error-codes"></a>

## Codici Errore Node.js

<a id="ERR_AMBIGUOUS_ARGUMENT"></a>

### ERR_AMBIGUOUS_ARGUMENT

A function argument is being used in a way that suggests that the function signature may be misunderstood. This is thrown by the `assert` module when the `message` parameter in `assert.throws(block, message)` matches the error message thrown by `block` because that usage suggests that the user believes `message` is the expected message rather than the message the `AssertionError` will display if `block` does not throw.

<a id="ERR_ARG_NOT_ITERABLE"></a>

### ERR_ARG_NOT_ITERABLE

Un argomento iterabile (cioè un valore che funziona con loop `for…of`) era necessario, ma non è stato fornito ad un'API Node.js.

<a id="ERR_ASSERTION"></a>

### ERR_ASSERTION

A special type of error that can be triggered whenever Node.js detects an exceptional logic violation that should never occur. These are raised typically by the `assert` module.

<a id="ERR_ASYNC_CALLBACK"></a>

### ERR_ASYNC_CALLBACK

C'è stato un tentativo di registrare una cosa che non è una funziona come un callback `AsyncHooks`.

<a id="ERR_ASYNC_TYPE"></a>

### ERR_ASYNC_TYPE

Il tipo di risorsa asincrona non è valido. Nota che gli utenti possono anche definire i propri tipi se stanno usando il public embedder API.

<a id="ERR_BROTLI_COMPRESSION_FAILED"></a>

### ERR_BROTLI_COMPRESSION_FAILED

Data passed to a Brotli stream was not successfully compressed.

<a id="ERR_BROTLI_INVALID_PARAM"></a>

### ERR_BROTLI_INVALID_PARAM

An invalid parameter key was passed during construction of a Brotli stream.

<a id="ERR_BUFFER_OUT_OF_BOUNDS"></a>

### ERR_BUFFER_OUT_OF_BOUNDS

An operation outside the bounds of a `Buffer` was attempted.

<a id="ERR_BUFFER_TOO_LARGE"></a>

### ERR_BUFFER_TOO_LARGE

An attempt has been made to create a `Buffer` larger than the maximum allowed size.

<a id="ERR_CANNOT_TRANSFER_OBJECT"></a>

### ERR_CANNOT_TRANSFER_OBJECT

The value passed to `postMessage()` contained an object that is not supported for transferring.

<a id="ERR_CANNOT_WATCH_SIGINT"></a>

### ERR_CANNOT_WATCH_SIGINT

Node.js was unable to watch for the `SIGINT` signal.

<a id="ERR_CHILD_CLOSED_BEFORE_REPLY"></a>

### ERR_CHILD_CLOSED_BEFORE_REPLY

A child process was closed before the parent received a reply.

<a id="ERR_CHILD_PROCESS_IPC_REQUIRED"></a>

### ERR_CHILD_PROCESS_IPC_REQUIRED

Used when a child process is being forked without specifying an IPC channel.

<a id="ERR_CHILD_PROCESS_STDIO_MAXBUFFER"></a>

### ERR_CHILD_PROCESS_STDIO_MAXBUFFER

Used when the main process is trying to read data from the child process's STDERR/STDOUT, and the data's length is longer than the `maxBuffer` option.

<a id="ERR_CLOSED_MESSAGE_PORT"></a>

### ERR_CLOSED_MESSAGE_PORT

There was an attempt to use a `MessagePort` instance in a closed state, usually after `.close()` has been called.

<a id="ERR_CONSOLE_WRITABLE_STREAM"></a>

### ERR_CONSOLE_WRITABLE_STREAM

`Console` was instantiated without `stdout` stream, or `Console` has a non-writable `stdout` or `stderr` stream.

<a id="ERR_CONSTRUCT_CALL_REQUIRED"></a>

### ERR_CONSTRUCT_CALL_REQUIRED

A constructor for a class was called without `new`.

<a id="ERR_CPU_USAGE"></a>

### ERR_CPU_USAGE

The native call from `process.cpuUsage` could not be processed.

<a id="ERR_CRYPTO_CUSTOM_ENGINE_NOT_SUPPORTED"></a>

### ERR_CRYPTO_CUSTOM_ENGINE_NOT_SUPPORTED

A client certificate engine was requested that is not supported by the version of OpenSSL being used.

<a id="ERR_CRYPTO_ECDH_INVALID_FORMAT"></a>

### ERR_CRYPTO_ECDH_INVALID_FORMAT

An invalid value for the `format` argument was passed to the `crypto.ECDH()` class `getPublicKey()` method.

<a id="ERR_CRYPTO_ECDH_INVALID_PUBLIC_KEY"></a>

### ERR_CRYPTO_ECDH_INVALID_PUBLIC_KEY

An invalid value for the `key` argument has been passed to the `crypto.ECDH()` class `computeSecret()` method. It means that the public key lies outside of the elliptic curve.

<a id="ERR_CRYPTO_ENGINE_UNKNOWN"></a>

### ERR_CRYPTO_ENGINE_UNKNOWN

An invalid crypto engine identifier was passed to [`require('crypto').setEngine()`][].

<a id="ERR_CRYPTO_FIPS_FORCED"></a>

### ERR_CRYPTO_FIPS_FORCED

The [`--force-fips`][] command-line argument was used but there was an attempt to enable or disable FIPS mode in the `crypto` module.

<a id="ERR_CRYPTO_FIPS_UNAVAILABLE"></a>

### ERR_CRYPTO_FIPS_UNAVAILABLE

An attempt was made to enable or disable FIPS mode, but FIPS mode was not available.

<a id="ERR_CRYPTO_HASH_DIGEST_NO_UTF16"></a>

### ERR_CRYPTO_HASH_DIGEST_NO_UTF16

The UTF-16 encoding was used with [`hash.digest()`][]. While the `hash.digest()` method does allow an `encoding` argument to be passed in, causing the method to return a string rather than a `Buffer`, the UTF-16 encoding (e.g. `ucs` or `utf16le`) is not supported.

<a id="ERR_CRYPTO_HASH_FINALIZED"></a>

### ERR_CRYPTO_HASH_FINALIZED

[`hash.digest()`][] was called multiple times. The `hash.digest()` method must be called no more than one time per instance of a `Hash` object.

<a id="ERR_CRYPTO_HASH_UPDATE_FAILED"></a>

### ERR_CRYPTO_HASH_UPDATE_FAILED

[`hash.update()`][] failed for any reason. This should rarely, if ever, happen.

<a id="ERR_CRYPTO_INCOMPATIBLE_KEY_OPTIONS"></a>

### ERR_CRYPTO_INCOMPATIBLE_KEY_OPTIONS

The selected public or private key encoding is incompatible with other options.

<a id="ERR_CRYPTO_INVALID_DIGEST"></a>

### ERR_CRYPTO_INVALID_DIGEST

An invalid [crypto digest algorithm](crypto.html#crypto_crypto_gethashes) was specified.

<a id="ERR_CRYPTO_INVALID_STATE"></a>

### ERR_CRYPTO_INVALID_STATE

A crypto method was used on an object that was in an invalid state. For instance, calling [`cipher.getAuthTag()`][] before calling `cipher.final()`.

<a id="ERR_CRYPTO_PBKDF2_ERROR"></a>

### ERR_CRYPTO_PBKDF2_ERROR

The PBKDF2 algorithm failed for unspecified reasons. OpenSSL does not provide more details and therefore neither does Node.js.

<a id="ERR_CRYPTO_SCRYPT_INVALID_PARAMETER"></a>

### ERR_CRYPTO_SCRYPT_INVALID_PARAMETER

One or more [`crypto.scrypt()`][] or [`crypto.scryptSync()`][] parameters are outside their legal range.

<a id="ERR_CRYPTO_SCRYPT_NOT_SUPPORTED"></a>

### ERR_CRYPTO_SCRYPT_NOT_SUPPORTED

Node.js was compiled without `scrypt` support. Not possible with the official release binaries but can happen with custom builds, including distro builds.

<a id="ERR_CRYPTO_SIGN_KEY_REQUIRED"></a>

### ERR_CRYPTO_SIGN_KEY_REQUIRED

A signing `key` was not provided to the [`sign.sign()`][] method.

<a id="ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH"></a>

### ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH

[`crypto.timingSafeEqual()`][] was called with `Buffer`, `TypedArray`, or `DataView` arguments of different lengths.

<a id="ERR_DNS_SET_SERVERS_FAILED"></a>

### ERR_DNS_SET_SERVERS_FAILED

`c-ares` failed to set the DNS server.

<a id="ERR_DOMAIN_CALLBACK_NOT_AVAILABLE"></a>

### ERR_DOMAIN_CALLBACK_NOT_AVAILABLE

The `domain` module was not usable since it could not establish the required error handling hooks, because [`process.setUncaughtExceptionCaptureCallback()`][] had been called at an earlier point in time.

<a id="ERR_DOMAIN_CANNOT_SET_UNCAUGHT_EXCEPTION_CAPTURE"></a>

### ERR_DOMAIN_CANNOT_SET_UNCAUGHT_EXCEPTION_CAPTURE

[`process.setUncaughtExceptionCaptureCallback()`][] could not be called because the `domain` module has been loaded at an earlier point in time.

The stack trace is extended to include the point in time at which the `domain` module had been loaded.

<a id="ERR_ENCODING_INVALID_ENCODED_DATA"></a>

### ERR_ENCODING_INVALID_ENCODED_DATA

I dati forniti all'API `util.TextDecoder()` non erano validi secondo la codifica fornita.

<a id="ERR_ENCODING_NOT_SUPPORTED"></a>

### ERR_ENCODING_NOT_SUPPORTED

Encoding provided to `util.TextDecoder()` API was not one of the [WHATWG Supported Encodings](util.html#util_whatwg_supported_encodings).

<a id="ERR_FALSY_VALUE_REJECTION"></a>

### ERR_FALSY_VALUE_REJECTION

Una `Promise` che è stata callbackified attraverso `util.callbackify()` è stata rifiutata con un valore falso.

<a id="ERR_FS_FILE_TOO_LARGE"></a>

### ERR_FS_FILE_TOO_LARGE

An attempt has been made to read a file whose size is larger than the maximum allowed size for a `Buffer`.

<a id="ERR_FS_INVALID_SYMLINK_TYPE"></a>

### ERR_FS_INVALID_SYMLINK_TYPE

An invalid symlink type was passed to the [`fs.symlink()`][] or [`fs.symlinkSync()`][] methods.

<a id="ERR_HTTP_HEADERS_SENT"></a>

### ERR_HTTP_HEADERS_SENT

È stato effettuato un tentativo di aggiungere ulteriori intestazioni dopo che le intestazioni erano già state inviate.

<a id="ERR_HTTP_INVALID_HEADER_VALUE"></a>

### ERR_HTTP_INVALID_HEADER_VALUE

An invalid HTTP header value was specified.

<a id="ERR_HTTP_INVALID_STATUS_CODE"></a>

### ERR_HTTP_INVALID_STATUS_CODE

Il codice di stato non rientrava nel normale intervallo di codici di stato (100-999).

<a id="ERR_HTTP_TRAILER_INVALID"></a>

### ERR_HTTP_TRAILER_INVALID

L'intestazione `Trailer` è stata impostata anche se la codifica di trasferimento non lo supporta.

<a id="ERR_HTTP2_ALTSVC_INVALID_ORIGIN"></a>

### ERR_HTTP2_ALTSVC_INVALID_ORIGIN

I frame HTTP/2 ALTSVC richiedono un'origine valida.

<a id="ERR_HTTP2_ALTSVC_LENGTH"></a>

### ERR_HTTP2_ALTSVC_INVALID_ORIGIN

I frame HTTP/2 ALTSVC sono limitati a un massimo di 16,382 payload byte.

<a id="ERR_HTTP2_CONNECT_AUTHORITY"></a>

### ERR_HTTP2_CONNECT_AUTHORITY

Per le richieste HTTP/2 che utilizzano il metodo `CONNECT`,è necessaria la pseudo-intestazione `:authority`.

<a id="ERR_HTTP2_CONNECT_PATH"></a>

### ERR_HTTP2_CONNECT_PATH

Per le richieste HTTP/2 che utilizzano il metodo `CONNECT`, la pseudo-intestazione `:path` è proibita.

<a id="ERR_HTTP2_CONNECT_SCHEME"></a>

### ERR_HTTP2_CONNECT_SCHEME

Per le richieste HTTP/2 che utilizzano il metodo `CONNECT`, la pseudo-intestazione `:scheme` è proibita.

<a id="ERR_HTTP2_ERROR"></a>

### ERR_HTTP2_ERROR

A non-specific HTTP/2 error has occurred.

<a id="ERR_HTTP2_GOAWAY_SESSION"></a>

### ERR_HTTP2_GOAWAY_SESSION

I nuovi Stream HTTP/2 non possono essere aperti dopo che la `Http2Session` ha ricevuto un frame `GOAWAY` dal peer connesso.

<a id="ERR_HTTP2_HEADERS_AFTER_RESPOND"></a>

### ERR_HTTP2_HEADERS_AFTER_RESPOND

Dopo che una risposta HTTP/2 era stata iniziata è stata specificata un’ulteriore intestazione.

<a id="ERR_HTTP2_HEADERS_SENT"></a>

### ERR_HTTP2_HEADERS_SENT

C'è stato un tentativo di inviare molteplici intestazioni di risposta.

<a id="ERR_HTTP2_HEADER_SINGLE_VALUE"></a>

### ERR_HTTP2_HEADER_SINGLE_VALUE

Sono stati forniti molteplici valori per un campo intestazione HTTP/2 che doveva avere un solo valore.

<a id="ERR_HTTP2_INFO_STATUS_NOT_ALLOWED"></a>

### ERR_HTTP2_INFO_STATUS_NOT_ALLOWED

I codici di stato informativi HTTP (`1xx`) non possono essere impostati come codici di stato di risposta sulle risposte HTTP/2.

<a id="ERR_HTTP2_INVALID_CONNECTION_HEADERS"></a>

### ERR_HTTP2_INVALID_CONNECTION_HEADERS

È vietato utilizzare le intestazioni HTTTP/1 specifiche di connessione sulle richieste e risposte HTTP/2.

<a id="ERR_HTTP2_INVALID_HEADER_VALUE"></a>

### ERR_HTTP2_INVALID_HEADER_VALUE

È stato specificato un valore di intestazione HTTP/2 non valido.

<a id="ERR_HTTP2_INVALID_INFO_STATUS"></a>

### ERR_HTTP2_INVALID_INFO_STATUS

È stato specificato un codice di stato informativo HTTP non valido. I codici di stato informativi devono essere un intero tra `100` e `199` (compresi).

<a id="ERR_HTTP2_INVALID_ORIGIN"></a>

### ERR_HTTP2_INVALID_ORIGIN

HTTP/2 `ORIGIN` frames require a valid origin.

<a id="ERR_HTTP2_INVALID_PACKED_SETTINGS_LENGTH"></a>

### ERR_HTTP2_INVALID_PACKED_SETTINGS_LENGTH

Le istanze in entrata `Buffer` e `Uint8Array` passate all'API `http2.getUnpackedSettings()` devono avere una lunghezza che sia un multiplo di 6.

<a id="ERR_HTTP2_INVALID_PSEUDOHEADER"></a>

### ERR_HTTP2_INVALID_PSEUDOHEADER

Possono essere usate solo pseudo-intestazioni HTTP/2 valide (`:status`, `:path`, `:authority`, `:scheme` e `:method`).

<a id="ERR_HTTP2_INVALID_SESSION"></a>

### ERR_HTTP2_INVALID_SESSION

È stata eseguita un'azione su un oggetto `Http2Session` che era già stato distrutto.

<a id="ERR_HTTP2_INVALID_SETTING_VALUE"></a>

### ERR_HTTP2_INVALID_SETTING_VALUE

È stato specificato un valore non valido per un'impostazione HTTP/2.

<a id="ERR_HTTP2_INVALID_STREAM"></a>

### ERR_HTTP2_INVALID_STREAM

Un'operazione è stata eseguita su uno stream che era già stato distrutto.

<a id="ERR_HTTP2_MAX_PENDING_SETTINGS_ACK"></a>

### ERR_HTTP2_MAX_PENDING_SETTINGS_ACK

Ogni volta che un frame di `IMPOSTAZIONI` HTTP/2 viene inviato ad un peer connesso, il peer deve inviare una conferma di aver ricevuto e applicato le nuove `IMPOSTAZIONI`. Per impostazione predefinita, un numero massimo di frame `IMPOSTAZIONI` sconosciuti potrebbe essere inviato in qualsiasi momento. Questo codice di errore viene usato quando è stato raggiunto quel limite.

<a id="ERR_HTTP2_NESTED_PUSH"></a>

### ERR_HTTP2_NESTED_PUSH

An attempt was made to initiate a new push stream from within a push stream. Nested push streams are not permitted.

<a id="ERR_HTTP2_NO_SOCKET_MANIPULATION"></a>

### ERR_HTTP2_NO_SOCKET_MANIPULATION

È stato effettuato un tentativo di manipolare in modo diretto (leggere, scrivere, mettere in pausa, riprendere, ecc.) un socket collegato a una `Http2Session`.

<a id="ERR_HTTP2_ORIGIN_LENGTH"></a>

### ERR_HTTP2_ORIGIN_LENGTH

HTTP/2 `ORIGIN` frames are limited to a length of 16382 bytes.

<a id="ERR_HTTP2_OUT_OF_STREAMS"></a>

### ERR_HTTP2_OUT_OF_STREAMS

Il numero di stream creati su una singola sessione HTTP/2 ha raggiunto il limite massimo.

<a id="ERR_HTTP2_PAYLOAD_FORBIDDEN"></a>

### ERR_HTTP2_PAYLOAD_FORBIDDEN

È stato specificato un messaggio payload per un codice di risposta HTTP per il quale il payload è è proibito.

<a id="ERR_HTTP2_PING_CANCEL"></a>

### ERR_HTTP2_PING_CANCEL

Un ping HTTP/2 è stato cancellato.

<a id="ERR_HTTP2_PING_LENGTH"></a>

### ERR_HTTP2_PING_LENGTH

I payload dei ping HTTP/2 devono avere esattamente 8 byte di lunghezza.

<a id="ERR_HTTP2_PSEUDOHEADER_NOT_ALLOWED"></a>

### ERR_HTTP2_PSEUDOHEADER_NOT_ALLOWED

Una pseudo-intestazione HTTP/2 è stata usata in modo inappropriato. Le pseudo-intestazioni sono nomi chiave delle intestazioni che iniziano con il prefisso`:`.

<a id="ERR_HTTP2_PUSH_DISABLED"></a>

### ERR_HTTP2_PUSH_DISABLED

È stato effettuato un tentativo di creare un push stream, il quale era stato disabilitato dal client.

<a id="ERR_HTTP2_SEND_FILE"></a>

### ERR_HTTP2_SEND_FILE

An attempt was made to use the `Http2Stream.prototype.responseWithFile()` API to send a directory.

<a id="ERR_HTTP2_SEND_FILE_NOSEEK"></a>

### ERR_HTTP2_SEND_FILE_NOSEEK

An attempt was made to use the `Http2Stream.prototype.responseWithFile()` API to send something other than a regular file, but `offset` or `length` options were provided.

<a id="ERR_HTTP2_SESSION_ERROR"></a>

### ERR_HTTP2_SESSION_ERROR

La `Http2Session` si è chiusa con un codice di errore diverso da zero.

<a id="ERR_HTTP2_SETTINGS_CANCEL"></a>

### ERR_HTTP2_SETTINGS_CANCEL

The `Http2Session` settings canceled.

<a id="ERR_HTTP2_SOCKET_BOUND"></a>

### ERR_HTTP2_SOCKET_BOUND

È stato effettuato un tentativo di collegare un oggetto `Http2Session` a un `net.Socket` o a un `tls.TLSSocker` che era già stato collegato a un altro oggetto `Http2Session`.

<a id="ERR_HTTP2_SOCKET_UNBOUND"></a>

### ERR_HTTP2_SOCKET_UNBOUND

An attempt was made to use the `socket` property of an `Http2Session` that has already been closed.

<a id="ERR_HTTP2_STATUS_101"></a>

### ERR_HTTP2_STATUS_101

L'uso del Codice di stato informativo `101` è proibito in HTTP/2.

<a id="ERR_HTTP2_STATUS_INVALID"></a>

### ERR_HTTP2_STATUS_INVALID

È stato specificato un codice di stato HTTP invalido. I codici di stato devono essere un intero tra `100` e `599` (compreso).

<a id="ERR_HTTP2_STREAM_CANCEL"></a>

### ERR_HTTP2_STREAM_CANCEL

Un `Http2Stream` è stato distrutto prima che siano stati trasmessi dati al peer connesso.

<a id="ERR_HTTP2_STREAM_ERROR"></a>

### ERR_HTTP2_STREAM_ERROR

È stato specificato un codice di errore diverso da zero in un frame `RST_STREAM`.

<a id="ERR_HTTP2_STREAM_SELF_DEPENDENCY"></a>

### ERR_HTTP2_STREAM_SELF_DEPENDENCY

Quando si imposta la priorità per uno stream HTTP/2, lo stream potrebbe essere contrassegnato come una dipendenza da uno stream primario. Questo codice di errore viene usato quando si effettua un tentativo di contrassegnare uno stream e dipendente di se stesso.

<a id="ERR_HTTP2_TRAILERS_ALREADY_SENT"></a>

### ERR_HTTP2_TRAILERS_ALREADY_SENT

Le intestazioni del trailing sono già state inviate sul `Http2Stream`.

<a id="ERR_HTTP2_TRAILERS_NOT_READY"></a>

### ERR_HTTP2_TRAILERS_NOT_READY

Il metodo `http2stream.sendTrailers()` non può essere chiamato prima che l'evento `'wantTrailers'` sia stato emesso su un oggetto `Http2Stream`. L'evento `'wantTrailers' ` verrà emesso solo se l'opzione `waitForTrailers` è impostata per lo `Http2Stream`.

<a id="ERR_HTTP2_UNSUPPORTED_PROTOCOL"></a>

### ERR_HTTP2_UNSUPPORTED_PROTOCOL

Un URL che utilizza qualsiasi protocollo diverso da `http:` o `https:` è stato passato a `http2.connect()`.

<a id="ERR_INDEX_OUT_OF_RANGE"></a>

### ERR_HTTP2_UNSUPPORTED_PROTOCOL

Un dato indice non rientrava nell'intervallo accettato (ad esempio, offset negativi).

<a id="ERR_INSPECTOR_ALREADY_CONNECTED"></a>

### ERR_INSPECTOR_ALREADY_CONNECTED

While using the `inspector` module, an attempt was made to connect when the inspector was already connected.

<a id="ERR_INSPECTOR_CLOSED"></a>

### ERR_INSPECTOR_CLOSED

While using the `inspector` module, an attempt was made to use the inspector after the session had already closed.

<a id="ERR_INSPECTOR_NOT_AVAILABLE"></a>

### ERR_INSPECTOR_NOT_AVAILABLE

The `inspector` module is not available for use.

<a id="ERR_INSPECTOR_NOT_CONNECTED"></a>

### ERR_INSPECTOR_NOT_CONNECTED

While using the `inspector` module, an attempt was made to use the inspector before it was connected.

<a id="ERR_INVALID_ADDRESS_FAMILY"></a>

### ERR_INVALID_ADDRESS_FAMILY

The provided address family is not understood by the Node.js API.

<a id="ERR_INVALID_ARG_TYPE"></a>

### ERR_INVALID_ARG_TYPE

Un argomento di tipo errato è stato passato a un'API Node.js.

<a id="ERR_INVALID_ARG_VALUE"></a>

### ERR_INVALID_ARG_VALUE

An invalid or unsupported value was passed for a given argument.

<a id="ERR_INVALID_ARRAY_LENGTH"></a>

### ERR_INVALID_ARRAY_LENGTH

An array was not of the expected length or in a valid range.

<a id="ERR_INVALID_ASYNC_ID"></a>

### ERR_INVALID_ASYNC_ID

Un `asyncld` o `triggerAsyncld`non valido è stato passato utilizzando `AsyncHooks`. Un id minore di -1 non dovrebbe mai accadere.

<a id="ERR_INVALID_BUFFER_SIZE"></a>

### ERR_INVALID_BUFFER_SIZE

A swap was performed on a `Buffer` but its size was not compatible with the operation.

<a id="ERR_INVALID_CALLBACK"></a>

### ERR_INVALID_CALLBACK

È stata richiesta una funzione di callback ma non era stata fornita a un'API Node.js.

<a id="ERR_INVALID_CHAR"></a>

### ERR_INVALID_CHAR

Invalid characters were detected in headers.

<a id="ERR_INVALID_CURSOR_POS"></a>

### ERR_INVALID_CURSOR_POS

A cursor on a given stream cannot be moved to a specified row without a specified column.

<a id="ERR_INVALID_DOMAIN_NAME"></a>

### ERR_INVALID_DOMAIN_NAME

`hostname` can not be parsed from a provided URL.

<a id="ERR_INVALID_FD"></a>

### ERR_INVALID_FD

A file descriptor ('fd') was not valid (e.g. it was a negative value).

<a id="ERR_INVALID_FD_TYPE"></a>

### ERR_INVALID_FD_TYPE

A file descriptor ('fd') type was not valid.

<a id="ERR_INVALID_FILE_URL_HOST"></a>

### ERR_INVALID_FILE_URL_HOST

Un API Node.js che utilizza URL di `file:` (come ad esempio alcune funzioni nel modulo [`fs`][]) ha incontrato un URL di un file con un host incompatibile. Questa situazione può essere incontrata solo su sistemi di tipo Unix in cui è supportato solo `localhost` o un host vuoto.

<a id="ERR_INVALID_FILE_URL_PATH"></a>

### ERR_INVALID_FILE_URL_PATH

Un'API Node.js che utilizza URL di `file` (come ad esempio certe funzioni nel modulo [`fs`][]) ha incontrato un file con un percorso incompatibile. Le semantiche esatte per determinare se un percorso può essere utilizzato o meno, dipendono dalla piattaforma.

<a id="ERR_INVALID_HANDLE_TYPE"></a>

### ERR_INVALID_HANDLE_TYPE

È stato effettuato un tentativo di inviare un "handle" non supportato su un canale di comunicazione IPC a un processo secondario. Per informazione aggiuntive visualizza [`subprocess.send()`] e [`process.send()`].

<a id="ERR_INVALID_HTTP_TOKEN"></a>

### ERR_INVALID_HTTP_TOKEN

An invalid HTTP token was supplied.

<a id="ERR_INVALID_IP_ADDRESS"></a>

### ERR_INVALID_IP_ADDRESS

An IP address is not valid.

<a id="ERR_INVALID_OPT_VALUE"></a>

### ERR_INVALID_OPT_VALUE

Un valore imprevisto o non valido è stato passato in un oggetto di un opzione.

<a id="ERR_INVALID_OPT_VALUE_ENCODING"></a>

### ERR_INVALID_OPT_VALUE_ENCODING

An invalid or unknown file encoding was passed.

<a id="ERR_INVALID_PERFORMANCE_MARK"></a>

### ERR_INVALID_PERFORMANCE_MARK

Durante l'utilizzo dell'API Performance Timing (`perf_hooks`), un performance mark non era valido.

<a id="ERR_INVALID_PROTOCOL"></a>

### ERR_INVALID_PROTOCOL

È stato passato un `options.protocol` non valido.

<a id="ERR_INVALID_REPL_EVAL_CONFIG"></a>

### ERR_INVALID_REPL_EVAL_CONFIG

Both `breakEvalOnSigint` and `eval` options were set in the REPL config, which is not supported.

<a id="ERR_INVALID_RETURN_PROPERTY"></a>

### ERR_INVALID_RETURN_PROPERTY

Thrown in case a function option does not provide a valid value for one of its returned object properties on execution.

<a id="ERR_INVALID_RETURN_PROPERTY_VALUE"></a>

### ERR_INVALID_RETURN_PROPERTY_VALUE

Thrown in case a function option does not provide an expected value type for one of its returned object properties on execution.

<a id="ERR_INVALID_RETURN_VALUE"></a>

### ERR_INVALID_RETURN_VALUE

Thrown in case a function option does not return an expected value type on execution, such as when a function is expected to return a promise.

<a id="ERR_INVALID_SYNC_FORK_INPUT"></a>

### ERR_INVALID_SYNC_FORK_INPUT

A `Buffer`, `TypedArray`, `DataView` or `string` was provided as stdio input to an asynchronous fork. See the documentation for the [`child_process`][] module for more information.

<a id="ERR_INVALID_THIS"></a>

### ERR_INVALID_THIS

Una funzione API Node.js è stata chiamata con un valore `this` non compatibile.

```js
const urlSearchParams = new URLSearchParams('foo=bar&baz=new');

const buf = Buffer.alloc(1);
urlSearchParams.has.call(buf, 'foo');
// Throws a TypeError with code 'ERR_INVALID_THIS'
```

<a id="ERR_INVALID_TRANSFER_OBJECT"></a>

### ERR_INVALID_TRANSFER_OBJECT

An invalid transfer object was passed to `postMessage()`.

<a id="ERR_INVALID_TUPLE"></a>

### ERR_INVALID_TUPLE

Un elemento nell'`iterable` fornito al [WHATWG](url.html#url_the_whatwg_url_api) [constructor `URLSearchParams`][`newURLSearchParams(iterable)`] non rappresentava una sequenza `[name, value]` - cioè, se un elemento non è iterabile o non è composto esattamente da 2 elementi.

<a id="ERR_INVALID_URI"></a>

### ERR_INVALID_URI

An invalid URI was passed.

<a id="ERR_INVALID_URL"></a>

### ERR_INVALID_URL

Un URL non valido è stato passato al [WHATWG](url.html#url_the_whatwg_url_api) [`URL` constructor][`nuovo URL(input)`] da analizzare. L'oggetto errore generato di solito ha una proprietà chiamata `'input' ` che contiene l'URL che non è stato possibile analizzare.

<a id="ERR_INVALID_URL_SCHEME"></a>

### ERR_INVALID_URL_SCHEME

È stato effettuato un tentativo di utilizzare un URL che aveva uno schema (protocollo) non valido per uno scopo specifico. Viene utilizzato solo nel supporto [WHATWG URL API](url.html#url_the_whatwg_url_api) nel modulo [`fs`][] (il quale accetta solo URL con schema `'file' `),ma in futuro, potrebbe essere usato anche in altre API Node.js.

<a id="ERR_IPC_CHANNEL_CLOSED"></a>

### ERR_IPC_CHANNEL_CLOSED

È stato effettuato un tentativo di utilizzare un canale di comunicazione IPC che era già stata chiuso.

<a id="ERR_IPC_DISCONNECTED"></a>

### ERR_IPC_DISCONNECTED

È stato effettuato un tentativo di disconnettere un canale di comunicazione IPC che era già stato disconnesso. See the documentation for the [`child_process`][] module for more information.

<a id="ERR_IPC_ONE_PIPE"></a>

### ERR_IPC_ONE_PIPE

È stato effettuato un tentativo di creare un processo child Node.js utilizzando più di un canale di comunicazione IPC. See the documentation for the [`child_process`][] module for more information.

<a id="ERR_IPC_SYNC_FORK"></a>

### ERR_IPC_SYNC_FORK

Si è fatto un tentativo di aprire un canale di comunicazione IPC con un processo biforcato in modo sincrono Node.js. See the documentation for the [`child_process`][] module for more information.

<a id="ERR_MEMORY_ALLOCATION_FAILED"></a>

### ERR_MEMORY_ALLOCATION_FAILED

An attempt was made to allocate memory (usually in the C++ layer) but it failed.

<a id="ERR_METHOD_NOT_IMPLEMENTED"></a>

### ERR_METHOD_NOT_IMPLEMENTED

A method is required but not implemented.

<a id="ERR_MISSING_ARGS"></a>

### ERR_METHOD_NOT_IMPLEMENTED

Un argomento necessario di un API Node.js non è stato passato. Questo è usato solamente per un applicazione rigorosa con le specifiche dell'API (che in alcuni casi potrebbe accettare `func(undefined)` ma non `func()`). Nella maggior parte delle API Node.js, `func(undefined)` e `func()` sono trattate allo stesso modo, e potrebbe essere usato l'error code [`ERR_INVALID_ARG_TYPE`][].

<a id="ERR_MISSING_DYNAMIC_INSTANTIATE_HOOK"></a>

### ERR_MISSING_DYNAMIC_INSTANTIATE_HOOK

> Stability: 1 - Experimental

An [ES6 module](esm.html) loader hook specified `format: 'dynamic'` but did not provide a `dynamicInstantiate` hook.

<a id="ERR_MISSING_MESSAGE_PORT_IN_TRANSFER_LIST"></a>

### ERR_MISSING_MESSAGE_PORT_IN_TRANSFER_LIST

A `MessagePort` was found in the object passed to a `postMessage()` call, but not provided in the `transferList` for that call.

<a id="ERR_MISSING_MODULE"></a>

### ERR_MISSING_MODULE

> Stability: 1 - Experimental

An [ES6 module](esm.html) could not be resolved.

<a id="ERR_MISSING_PLATFORM_FOR_WORKER"></a>

### ERR_MISSING_PLATFORM_FOR_WORKER

The V8 platform used by this instance of Node.js does not support creating Workers. This is caused by lack of embedder support for Workers. In particular, this error will not occur with standard builds of Node.js.

<a id="ERR_MODULE_RESOLUTION_LEGACY"></a>

### ERR_MODULE_RESOLUTION_LEGACY

> Stabilità: 1 - Sperimentale

A failure occurred resolving imports in an [ES6 module](esm.html).

<a id="ERR_MULTIPLE_CALLBACK"></a>

### ERR_MULTIPLE_CALLBACK

Un callback è stato chiamato più di una volta.

A callback is almost always meant to only be called once as the query can either be fulfilled or rejected but not both at the same time. Quest'ultimo sarebbe possibile chiamando un callback più volte.

<a id="ERR_NAPI_CONS_FUNCTION"></a>

### ERR_NAPI_CONS_FUNCTION

Durante l'utilizzo di `N-API`, un constructor passato non era una funzione.

<a id="ERR_NAPI_INVALID_DATAVIEW_ARGS"></a>

### ERR_NAPI_INVALID_DATAVIEW_ARGS

Durante la chiamata a `napi_create_dataview()`, un determinato `offset` superava i limiti del dataview oppure `offset + length` era più grande di una lunghezza del `buffer` fornito.

<a id="ERR_NAPI_INVALID_TYPEDARRAY_ALIGNMENT"></a>

### ERR_NAPI_INVALID_TYPEDARRAY_ALIGNMENT

Durante la chiamata a `napi_create_typedarray()`, l'`offset` fornito non era un multiplo delle dimensioni dell'elemento.

<a id="ERR_NAPI_INVALID_TYPEDARRAY_LENGTH"></a>

### ERR_NAPI_INVALID_TYPEDARRAY_LENGTH

Durante la chiamata a `napi_create_typedarray()`, `(length * size_of_element) +
byte_offset` era più grande della lunghezza del `buffer` fornito.

<a id="ERR_NAPI_TSFN_CALL_JS"></a>

### ERR_NAPI_TSFN_CALL_JS

An error occurred while invoking the JavaScript portion of the thread-safe function.

<a id="ERR_NAPI_TSFN_GET_UNDEFINED"></a>

### ERR_NAPI_TSFN_GET_UNDEFINED

An error occurred while attempting to retrieve the JavaScript `undefined` value.

<a id="ERR_NAPI_TSFN_START_IDLE_LOOP"></a>

### ERR_NAPI_TSFN_START_IDLE_LOOP

On the main thread, values are removed from the queue associated with the thread-safe function in an idle loop. This error indicates that an error has occurred when attempting to start the loop.

<a id="ERR_NAPI_TSFN_STOP_IDLE_LOOP"></a>

### ERR_NAPI_TSFN_STOP_IDLE_LOOP

Once no more items are left in the queue, the idle loop must be suspended. This error indicates that the idle loop has failed to stop.

<a id="ERR_NO_CRYPTO"></a>

### ERR_NO_CRYPTO

An attempt was made to use crypto features while Node.js was not compiled with OpenSSL crypto support.

<a id="ERR_NO_ICU"></a>

### ERR_NO_ICU

È stato effettuato un tentativo di utilizzare funzioni che richiedono [ICU](intl.html#intl_internationalization_support), ma Node.js non era compilato con il supporto ICU.

<a id="ERR_NO_LONGER_SUPPORTED"></a>

### ERR_NO_LONGER_SUPPORTED

A Node.js API was called in an unsupported manner, such as `Buffer.write(string, encoding, offset[, length])`.

<a id="ERR_OUT_OF_RANGE"></a>

### ERR_OUT_OF_RANGE

Un determinato valore è fuori dal range accettato.

<a id="ERR_REQUIRE_ESM"></a>

### ERR_REQUIRE_ESM

> Stabilità: 1 - Sperimentale

An attempt was made to `require()` an [ES6 module](esm.html).

<a id="ERR_SCRIPT_EXECUTION_INTERRUPTED"></a>

### ERR_SCRIPT_EXECUTION_INTERRUPTED

Script execution was interrupted by `SIGINT` (For example, when Ctrl+C was pressed).

<a id="ERR_SERVER_ALREADY_LISTEN"></a>

### ERR_SERVER_ALREADY_LISTEN

The [`server.listen()`][] method was called while a `net.Server` was already listening. This applies to all instances of `net.Server`, including HTTP, HTTPS, and HTTP/2 `Server` instances.

<a id="ERR_SERVER_NOT_RUNNING"></a>

### ERR_SERVER_NOT_RUNNING

The [`server.close()`][] method was called when a `net.Server` was not running. This applies to all instances of `net.Server`, including HTTP, HTTPS, and HTTP/2 `Server` instances.

<a id="ERR_SOCKET_ALREADY_BOUND"></a>

### ERR_SOCKET_ALREADY_BOUND

È stato effettuato un tentativo di associare un socket che è già stato associato.

<a id="ERR_SOCKET_BAD_BUFFER_SIZE"></a>

### ERR_SOCKET_BAD_BUFFER_SIZE

An invalid (negative) size was passed for either the `recvBufferSize` or `sendBufferSize` options in [`dgram.createSocket()`][].

<a id="ERR_SOCKET_BAD_PORT"></a>

### ERR_SOCKET_BAD_PORT

An API function expecting a port >= 0 and < 65536 received an invalid value.

<a id="ERR_SOCKET_BAD_TYPE"></a>

### ERR_SOCKET_BAD_TYPE

Una funzione API che si aspettava un tipo di socket (`udp4` o `udp6`) ha ricevuto un valore non valido.

<a id="ERR_SOCKET_BUFFER_SIZE"></a>

### ERR_SOCKET_BUFFER_SIZE

While using [`dgram.createSocket()`][], the size of the receive or send `Buffer` could not be determined.

<a id="ERR_SOCKET_CANNOT_SEND"></a>

### ERR_SOCKET_CANNOT_SEND

I dati potrebbero essere inviati su un socket.

<a id="ERR_SOCKET_CLOSED"></a>

### ERR_SOCKET_CLOSED

È stato effettuato un tentativo di operare su un socket già chiuso.

<a id="ERR_SOCKET_DGRAM_NOT_RUNNING"></a>

### ERR_SOCKET_DGRAM_NOT_RUNNING

È stata effettuata una chiamata e il sottosistema UDP non era in esecuzione.

<a id="ERR_STREAM_CANNOT_PIPE"></a>

### ERR_STREAM_CANNOT_PIPE

An attempt was made to call [`stream.pipe()`][] on a [`Writable`][] stream.

<a id="ERR_STREAM_DESTROYED"></a>

### ERR_STREAM_DESTROYED

A stream method was called that cannot complete because the stream was destroyed using `stream.destroy()`.

<a id="ERR_STREAM_NULL_VALUES"></a>

### ERR_STREAM_NULL_VALUES

An attempt was made to call [`stream.write()`][] with a `null` chunk.

<a id="ERR_STREAM_PREMATURE_CLOSE"></a>

### ERR_STREAM_PREMATURE_CLOSE

An error returned by `stream.finished()` and `stream.pipeline()`, when a stream or a pipeline ends non gracefully with no explicit error.

<a id="ERR_STREAM_PUSH_AFTER_EOF"></a>

### ERR_STREAM_PUSH_AFTER_EOF

An attempt was made to call [`stream.push()`][] after a `null`(EOF) had been pushed to the stream.

<a id="ERR_STREAM_UNSHIFT_AFTER_END_EVENT"></a>

### ERR_STREAM_UNSHIFT_AFTER_END_EVENT

An attempt was made to call [`stream.unshift()`][] after the `'end'` event was emitted.

<a id="ERR_STREAM_WRAP"></a>

### ERR_STREAM_WRAP

Prevents an abort if a string decoder was set on the Socket or if the decoder is in `objectMode`.

```js
const Socket = require('net').Socket;
const instance = new Socket();

instance.setEncoding('utf8');
```

<a id="ERR_STREAM_WRITE_AFTER_END"></a>

### ERR_STREAM_WRITE_AFTER_END

An attempt was made to call [`stream.write()`][] after `stream.end()` has been called.

<a id="ERR_STRING_TOO_LONG"></a>

### ERR_STRING_TOO_LONG

An attempt has been made to create a string longer than the maximum allowed length.

<a id="ERR_SYSTEM_ERROR"></a>

### ERR_SYSTEM_ERROR

An unspecified or non-specific system error has occurred within the Node.js process. The error object will have an `err.info` object property with additional details.

<a id="ERR_TLS_CERT_ALTNAME_INVALID"></a>

### ERR_TLS_CERT_ALTNAME_INVALID

While using TLS, the hostname/IP of the peer did not match any of the `subjectAltNames` in its certificate.

<a id="ERR_TLS_DH_PARAM_SIZE"></a>

### ERR_TLS_DH_PARAM_SIZE

Durante l'utilizzo di TLS, il parametro offerto per il key-agreement protocol Diffie-Hellman (`DH`) era troppo piccolo. Da impostazione predefinita, la lunghezza della chiave deve essere maggiore o uguale a 1024 bit per evitare vulnerabilità, anche se, per una maggiore sicurezza, è fortemente raccomandato utilizzare 2048 bit o superiore.

<a id="ERR_TLS_HANDSHAKE_TIMEOUT"></a>

### ERR_TLS_HANDSHAKE_TIMEOUT

Un handshake TLS/SSL è scaduto. In questo caso il server deve anche interrompere la connessione.

<a id="ERR_TLS_INVALID_PROTOCOL_VERSION"></a>

### ERR_TLS_INVALID_PROTOCOL_VERSION

Valid TLS protocol versions are `'TLSv1'`, `'TLSv1.1'`, or `'TLSv1.2'`.

<a id="ERR_TLS_PROTOCOL_VERSION_CONFLICT"></a>

### ERR_TLS_PROTOCOL_VERSION_CONFLICT

Attempting to set a TLS protocol `minVersion` or `maxVersion` conflicts with an attempt to set the `secureProtocol` explicitly. Use one mechanism or the other.

<a id="ERR_TLS_RENEGOTIATE"></a>

### ERR_TLS_RENEGOTIATE

An attempt to renegotiate the TLS session failed.

<a id="ERR_TLS_RENEGOTIATION_DISABLED"></a>

### ERR_TLS_RENEGOTIATION_DISABLED

An attempt was made to renegotiate TLS on a socket instance with TLS disabled.

<a id="ERR_TLS_REQUIRED_SERVER_NAME"></a>

### ERR_TLS_REQUIRED_SERVER_NAME

Durante l'utilizzo di TLS, il metodo `server.addContext()` è stato chiamato senza fornire un nome del host nel primo parametro.

<a id="ERR_TLS_SESSION_ATTACK"></a>

### ERR_TLS_SESSION_ATTACK

È stata rilevata una quantità eccessiva di rinegoziazioni TLS, il che è un potenziale vettore per attacchi di tipo denial-of-service.

<a id="ERR_TLS_SNI_FROM_SERVER"></a>

### ERR_TLS_SNI_FROM_SERVER

An attempt was made to issue Server Name Indication from a TLS server-side socket, which is only valid from a client.

<a id="ERR_TRACE_EVENTS_CATEGORY_REQUIRED"></a>

### ERR_TRACE_EVENTS_CATEGORY_REQUIRED

The `trace_events.createTracing()` method requires at least one trace event category.

<a id="ERR_TRACE_EVENTS_UNAVAILABLE"></a>

### ERR_TRACE_EVENTS_UNAVAILABLE

The `trace_events` module could not be loaded because Node.js was compiled with the `--without-v8-platform` flag.

<a id="ERR_TRANSFERRING_EXTERNALIZED_SHAREDARRAYBUFFER"></a>

### ERR_TRANSFERRING_EXTERNALIZED_SHAREDARRAYBUFFER

A `SharedArrayBuffer` whose memory is not managed by the JavaScript engine or by Node.js was encountered during serialization. Such a `SharedArrayBuffer` cannot be serialized.

This can only happen when native addons create `SharedArrayBuffer`s in "externalized" mode, or put existing `SharedArrayBuffer` into externalized mode.

<a id="ERR_TRANSFORM_ALREADY_TRANSFORMING"></a>

### ERR_TRANSFORM_ALREADY_TRANSFORMING

A `Transform` stream finished while it was still transforming.

<a id="ERR_TRANSFORM_WITH_LENGTH_0"></a>

### ERR_TRANSFORM_WITH_LENGTH_0

A `Transform` stream finished with data still in the write buffer.

<a id="ERR_TTY_INIT_FAILED"></a>

### ERR_TTY_INIT_FAILED

The initialization of a TTY failed due to a system error.

<a id="ERR_UNCAUGHT_EXCEPTION_CAPTURE_ALREADY_SET"></a>

### ERR_UNCAUGHT_EXCEPTION_CAPTURE_ALREADY_SET

[`process.setUncaughtExceptionCaptureCallback()`][] was called twice, without first resetting the callback to `null`.

This error is designed to prevent accidentally overwriting a callback registered from another module.

<a id="ERR_UNESCAPED_CHARACTERS"></a>

### ERR_UNESCAPED_CHARACTERS

A string that contained unescaped characters was received.

<a id="ERR_UNHANDLED_ERROR"></a>

### ERR_UNHANDLED_ERROR

An unhandled error occurred (for instance, when an `'error'` event is emitted by an [`EventEmitter`][] but an `'error'` handler is not registered).

<a id="ERR_UNKNOWN_BUILTIN_MODULE"></a>

### ERR_UNKNOWN_BUILTIN_MODULE

Used to identify a specific kind of internal Node.js error that should not typically be triggered by user code. Instances of this error point to an internal bug within the Node.js binary itself.

<a id="ERR_UNKNOWN_ENCODING"></a>

### ERR_UNKNOWN_ENCODING

An invalid or unknown encoding option was passed to an API.

<a id="ERR_UNKNOWN_FILE_EXTENSION"></a>

### ERR_UNKNOWN_FILE_EXTENSION

> Stabilità: 1 - Sperimentale

An attempt was made to load a module with an unknown or unsupported file extension.

<a id="ERR_UNKNOWN_MODULE_FORMAT"></a>

### ERR_UNKNOWN_MODULE_FORMAT

> Stability: 1 - Experimental

An attempt was made to load a module with an unknown or unsupported format.

<a id="ERR_UNKNOWN_SIGNAL"></a>

### ERR_UNKNOWN_SIGNAL

Un segnale di processo non valido o sconosciuto e stato passato a un'API che si aspettava un segnale valido (ad esempio [`subprocess.kill()`][]).

<a id="ERR_UNKNOWN_STDIN_TYPE"></a>

### ERR_UNKNOWN_STDIN_TYPE

È stato effettuato un tentativo di avviare un processo Node.js con un tipo di file `stdin` sconosciuto. Questo errore di solito indica un bug interno a Node.js, anche se può essere generato anche dal codice utente.

<a id="ERR_UNKNOWN_STREAM_TYPE"></a>

### ERR_UNKNOWN_STREAM_TYPE

È stato effettuato un tentativo di avviare il processo Node.js con un tipo di file `stdout` o `stderr` sconosciuto. Questo errore di solito indica un bug interno a Node.js, anche se può essere generato anche dal codice utente.

<a id="ERR_V8BREAKITERATOR"></a>

### ERR_V8BREAKITERATOR

The V8 `BreakIterator` API was used but the full ICU data set is not installed.

<a id="ERR_VALID_PERFORMANCE_ENTRY_TYPE"></a>

### ERR_VALID_PERFORMANCE_ENTRY_TYPE

Durante l'utilizzo dell'API per la Tempistica delle Prestazioni (`perf_hooks`), non è stato trovato alcun tipo di prestazione valida.

<a id="ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING"></a>

### ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING

A dynamic import callback was not specified.

<a id="ERR_VM_MODULE_ALREADY_LINKED"></a>

### ERR_VM_MODULE_ALREADY_LINKED

The module attempted to be linked is not eligible for linking, because of one of the following reasons:

- It has already been linked (`linkingStatus` is `'linked'`)
- It is being linked (`linkingStatus` is `'linking'`)
- Linking has failed for this module (`linkingStatus` is `'errored'`)

<a id="ERR_VM_MODULE_DIFFERENT_CONTEXT"></a>

### ERR_VM_MODULE_DIFFERENT_CONTEXT

The module being returned from the linker function is from a different context than the parent module. Linked modules must share the same context.

<a id="ERR_VM_MODULE_LINKING_ERRORED"></a>

### ERR_VM_MODULE_LINKING_ERRORED

The linker function returned a module for which linking has failed.

<a id="ERR_VM_MODULE_NOT_LINKED"></a>

### ERR_VM_MODULE_NOT_LINKED

The module must be successfully linked before instantiation.

<a id="ERR_VM_MODULE_NOT_MODULE"></a>

### ERR_VM_MODULE_NOT_MODULE

The fulfilled value of a linking promise is not a `vm.SourceTextModule` object.

<a id="ERR_VM_MODULE_STATUS"></a>

### ERR_VM_MODULE_STATUS

The current module's status does not allow for this operation. The specific meaning of the error depends on the specific function.

<a id="ERR_WORKER_PATH"></a>

### ERR_WORKER_PATH

The path for the main script of a worker is neither an absolute path nor a relative path starting with `./` or `../`.

<a id="ERR_WORKER_UNSERIALIZABLE_ERROR"></a>

### ERR_WORKER_UNSERIALIZABLE_ERROR

All attempts at serializing an uncaught exception from a worker thread failed.

<a id="ERR_WORKER_UNSUPPORTED_EXTENSION"></a>

### ERR_WORKER_UNSUPPORTED_EXTENSION

The pathname used for the main script of a worker has an unknown file extension.

<a id="ERR_ZLIB_INITIALIZATION_FAILED"></a>

### ERR_ZLIB_INITIALIZATION_FAILED

Creation of a [`zlib`][] object failed due to incorrect configuration.

<a id="HPE_HEADER_OVERFLOW"></a>

### HPE_HEADER_OVERFLOW<!-- YAML
changes:
  - version: v10.15.0
    pr-url: https://github.com/nodejs/node/commit/186035243fad247e3955f
    description: Max header size in `http_parser` was set to 8KB.
-->Too much HTTP header data was received. In order to protect against malicious or malconfigured clients, if more than 8KB of HTTP header data is received then HTTP parsing will abort without a request or response object being created, and an `Error` with this code will be emitted.

<a id="MODULE_NOT_FOUND"></a>

### MODULE_NOT_FOUND

A module file could not be resolved while attempting a [`require()`][] or `import` operation.

## Legacy Node.js Error Codes

> Stabilità: 0 - Obsoleto. These error codes are either inconsistent, or have been removed.

<a id="ERR_HTTP2_FRAME_ERROR"></a>

### ERR_HTTP2_FRAME_ERROR<!-- YAML
added: v9.0.0
removed: v10.0.0
-->Used when a failure occurs sending an individual frame on the HTTP/2 session.

<a id="ERR_HTTP2_HEADERS_OBJECT"></a>

### ERR_HTTP2_HEADERS_OBJECT
<!-- YAML
added: v9.0.0
removed: v10.0.0
-->

Used when an HTTP/2 Headers Object is expected.

<a id="ERR_HTTP2_HEADER_REQUIRED"></a>

### ERR_HTTP2_HEADER_REQUIRED
<!-- YAML
added: v9.0.0
removed: v10.0.0
-->

Used when a required header is missing in an HTTP/2 message.

<a id="ERR_HTTP2_INFO_HEADERS_AFTER_RESPOND"></a>

### ERR_HTTP2_INFO_HEADERS_AFTER_RESPOND
<!-- YAML
added: v9.0.0
removed: v10.0.0
-->

HTTP/2 informational headers must only be sent *prior* to calling the `Http2Stream.prototype.respond()` method.

<a id="ERR_HTTP2_STREAM_CLOSED"></a>

### ERR_HTTP2_STREAM_CLOSED
<!-- YAML
added: v9.0.0
removed: v10.0.0
-->

Used when an action has been performed on an HTTP/2 Stream that has already been closed.

<a id="ERR_HTTP_INVALID_CHAR"></a>

### ERR_HTTP_INVALID_CHAR
<!-- YAML
added: v9.0.0
removed: v10.0.0
-->

Used when an invalid character is found in an HTTP response status message (reason phrase).

<a id="ERR_NAPI_CONS_PROTOTYPE_OBJECT"></a>

### ERR_NAPI_CONS_PROTOTYPE_OBJECT
<!-- YAML
added: v9.0.0
removed: v10.0.0
-->

Used by the `N-API` when `Constructor.prototype` is not an object.

<a id="ERR_OUTOFMEMORY"></a>

### ERR_OUTOFMEMORY
<!-- YAML
added: v9.0.0
removed: v10.0.0
-->

Used generically to identify that an operation caused an out of memory condition.

<a id="ERR_PARSE_HISTORY_DATA"></a>

### ERR_PARSE_HISTORY_DATA
<!-- YAML
added: v9.0.0
removed: v10.0.0
-->

The `repl` module was unable to parse data from the REPL history file.

<a id="ERR_STDERR_CLOSE"></a>

### ERR_STDERR_CLOSE<!-- YAML
removed: v10.12.0
changes:
  - version: v10.12.0
    pr-url: https://github.com/nodejs/node/pull/23053
    description: Rather than emitting an error, `process.stderr.end()` now
                 only closes the stream side but not the underlying resource,
                 making this error obsolete.
-->È stato effettuato un tentativo di chiudere lo stream `process.stderr`. Per progettazione, Node.js non permette che gli stream `stdout` o `stderr` vengano chiusi dal codice utente.

<a id="ERR_STDOUT_CLOSE"></a>

### ERR_STDOUT_CLOSE
<!-- YAML
removed: v10.12.0
changes:
  - version: v10.12.0
    pr-url: https://github.com/nodejs/node/pull/23053
    description: Rather than emitting an error, `process.stderr.end()` now
                 only closes the stream side but not the underlying resource,
                 making this error obsolete.
-->

È stato effettuato un tentativo di chiudere lo stream `process.stdout`. Per progettazione, Node.js non permette che gli stream `stdout` o `stderr` vengano chiusi dal codice utente.

<a id="ERR_STREAM_READ_NOT_IMPLEMENTED"></a>

### ERR_STREAM_READ_NOT_IMPLEMENTED<!-- YAML
added: v9.0.0
removed: v10.0.0
-->Used when an attempt is made to use a readable stream that has not implemented [`readable._read()`][].

<a id="ERR_TLS_RENEGOTIATION_FAILED"></a>

### ERR_TLS_RENEGOTIATION_FAILED
<!-- YAML
added: v9.0.0
removed: v10.0.0
-->

Used when a TLS renegotiation request has failed in a non-specific way.

<a id="ERR_UNKNOWN_BUILTIN_MODULE"></a>

### ERR_UNKNOWN_BUILTIN_MODULE<!-- YAML
added: v8.0.0
removed: v9.0.0
-->The `'ERR_UNKNOWN_BUILTIN_MODULE'` error code is used to identify a specific kind of internal Node.js error that should not typically be triggered by user code. Instances of this error point to an internal bug within the Node.js binary itself.

<a id="ERR_VALUE_OUT_OF_RANGE"></a>

### ERR_VALUE_OUT_OF_RANGE<!-- YAML
added: v9.0.0
removed: v10.0.0
-->Used when a given value is out of the accepted range.

<a id="ERR_ZLIB_BINDING_CLOSED"></a>

### ERR_ZLIB_BINDING_CLOSED
<!-- YAML
added: v9.0.0
removed: v10.0.0
-->

Used when an attempt is made to use a `zlib` object after it has already been closed.

### Other error codes

These errors have never been released, but had been present on master between releases.

<a id="ERR_FS_WATCHER_ALREADY_STARTED"></a>

#### ERR_FS_WATCHER_ALREADY_STARTED

An attempt was made to start a watcher returned by `fs.watch()` that has already been started.

<a id="ERR_FS_WATCHER_NOT_STARTED"></a>

#### ERR_FS_WATCHER_NOT_STARTED

An attempt was made to initiate operations on a watcher returned by `fs.watch()` that has not yet been started.

<a id="ERR_HTTP2_ALREADY_SHUTDOWN"></a>

#### ERR_HTTP2_ALREADY_SHUTDOWN

Occurs with multiple attempts to shutdown an HTTP/2 session.

<a id="ERR_HTTP2_ERROR"></a>

#### ERR_HTTP2_ERROR

A non-specific HTTP/2 error has occurred.

<a id="ERR_INVALID_REPL_HISTORY"></a>

#### ERR_INVALID_REPL_HISTORY

Used in the `repl` in case the old history file is used and an error occurred while trying to read and parse it.

<a id="ERR_MISSING_DYNAMIC_INSTANTIATE_HOOK"></a>

#### ERR_MISSING_DYNAMIC_INSTANTIATE_HOOK

Used when an [ES6 module](esm.html) loader hook specifies `format: 'dynamic'` but does not provide a `dynamicInstantiate` hook.

<a id="ERR_STREAM_HAS_STRINGDECODER"></a>

#### ERR_STREAM_HAS_STRINGDECODER

Used to prevent an abort if a string decoder was set on the Socket.

```js
const Socket = require('net').Socket;
const instance = new Socket();

instance.setEncoding('utf8');
```

<a id="ERR_STRING_TOO_LARGE"></a>

#### ERR_STRING_TOO_LARGE

An attempt has been made to create a string larger than the maximum allowed size.
