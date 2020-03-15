# Errori

<!--introduced_in=v4.0.0-->
<!--type=misc-->

Le applicazioni in esecuzione in Node.js in genere riscontreranno quattro categorie di errori:

- Errori standard di JavaScript, come ad esempio:
  - {EvalError} : generato quando una chiamata a `eval()` fallisce.
  - {SyntaxError} : generato in risposta ad un utilizzo improprio della sintassi del linguaggio JavaScript.
  - {RangeError} : generato quando un valore non rientra nell'intervallo previsto
  - {ReferenceError} : generato quando si utilizzano variabili non definite
  - {TypeError} : generato quando vengono passati argomenti di tipo errato
  - {URIError}: generato quando una funzione di gestione globale degli URI è usata in modo errato.
- Errori di sistema innescati da restrizioni implicite del sistema operativo, come ad esempio tentare di aprire un file che non esiste, tentare di inviare dati su un socket chiuso, etc;
- E gli errori specifici dell'utente causati dal codice applicativo.
- Assertion Errors are a special class of error that can be triggered whenever Node.js detects an exceptional logic violation that should never occur. Questi di solito vengono generati dal modulo `assert`.

Tutti gli errori JavaScript e di Sistema generati da Node.js ereditano dalla, o sono istanze della, classe standard JavaScript {Error} e garantiscono di fornire *almeno* le proprietà disponibili su quella classe.

## Propagazione e Intercettazione degli Errori

<!--type=misc-->

Node.js supporta diversi meccanismi per la propagazione e la gestione degli errori che si verificano mentre un'applicazione è in esecuzione. Il modo in cui questi errori vengono segnalati e gestiti dipende interamente dal tipo di Error e dallo stile dell'API che viene chiamata.

Tutti gli errori JavaScript sono gestiti come eccezioni che generano ed inviano *immediatamente* un errore usando il meccanismo standard di JavaScript `throw`. Questi vengono gestiti utilizzando il [`try / catch` construct](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch) fornito dal linguaggio JavaScript.

```js
// Viene generato con un ReferenceError perché z è indefinito
prova {
  const m = 1;
  const n = m + z;
} catch (err) {
  // Gestisci l'errore qui.
}
```

Qualsiasi utilizzo del meccanismo JavaScript `throw` creerà un'eccezione che *deve* essere gestita utilizzando `try / catch` altrimenti il processo Node.js verrà chiuso immediatamente.

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
- When an asynchronous method is called on an object that is an `EventEmitter`, errors can be routed to that object's `'error'` event.

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

- Una manciata di tipici metodi asincroni nell'API Node.js potrebbero comunque usare il meccanismo `throw` per generare eccezioni che devono essere gestite utilizzando `try / catch`. Non esiste una lista completa di tali metodi; consultare la documentazione di ogni metodo per determinare il meccanismo più appropriato di gestione degli errori.

L'utilizzo del meccanismo `'error' ` event è più comune per API di tipo [stream-based](stream.html) ed [event emitter-based](events.html#events_class_eventemitter), le quali rappresentano una serie di operazioni asincrone nel tempo (diversamente da una singola operazione che potrebbe passare o fallire).

For *all* `EventEmitter` objects, if an `'error'` event handler is not provided, the error will be thrown, causing the Node.js process to report an unhandled exception and crash unless either: The [`domain`](domain.html) module is used appropriately or a handler has been registered for the [`process.on('uncaughtException')`][] event.

```js
const EventEmitter = require('events');
const ee = new EventEmitter();

setImmediate(() => {
  // Questo causerà il crash del processo perché non è stato aggiunto alcun
  // handler dell’evento 'error'.
  ee.emit('error', new Error('This will crash'));
});
```

Errors generated in this way *cannot* be intercepted using `try / catch` as they are thrown *after* the calling code has already exited.

Gli sviluppatori devono fare riferimento alla documentazione di ogni metodo per determinare esattamente in che modo vengono propagati gli errori creati da questi metodi.

### Callback error-first<!--type=misc-->Most asynchronous methods exposed by the Node.js core API follow an idiomatic pattern referred to as an _error-first callback_ (sometimes referred to as a _Node.js style callback_). Con questo modello, una funzione callback viene passata al metodo come un argomento. Quando l'operazione è completata oppure viene generato un errore, la funzione di callback viene chiamata con l'oggetto Error passato come primo argomento (se presente). Se non è stato generato alcun errore, il primo argomento verrà passato come `null`.

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

Il meccanismo JavaScript `try / catch` **non può** essere usato per intercettare errori generati da API asincrone. Un errore comune per i principianti è quello di cercare di usare `throw` all'interno di un callback error-first:

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

La proprietà `error.code` è un etichetta di stringa che identifica il tipo de errore. Visualizza [Node.js Error Codes](#nodejs-error-codes) per i dettagli riguardanti codici specifici.

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

Per esempio:

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

Una sottoclasse di `Error` che indica il fallimento di un assertion. Such errors commonly indicate inequality of actual and expected value.

Per esempio:

```js
assert.strictEqual(1, 2);
// AssertionError [ERR_ASSERTION]: 1 === 2
```

## Classe: RangeError

Una sottoclasse di `Error` che indica che un argomento fornito non era all'interno dell'insieme o del range di valori accettabili per una funzione; sia che si tratti di un valore numerico o al di fuori dell'insieme di opzioni per un dato parametro di funzione.

Per esempio:

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

Una sottoclasse di `Error` che indica che un argomento fornito non è un tipo di argomento consentito. Ad esempio, passare una funzione ad un parametro che si aspetta una stringa verrebbe considerato un TypeError.

```js
require('url').parse(() => { });
// genera TypeError, dato che si aspettava una stringa
```

Node.js genererà e mostrerà le istanze `TypeError` *immediatamente* come una forma di validazione dell'argomento.

## Eccezioni vs. Errori<!--type=misc-->Un'eccezione JavaScript viene generata come risultato di un operazione non valida o come obbiettivo di un'istruzione `throw`. While it is not required that these values are instances of `Error` or classes which inherit from `Error`, all exceptions thrown by Node.js or the JavaScript runtime *will* be instances of Error.

Alcune eccezione sono *non recuperabili* al livello di JavaScript. Tali eccezione causeranno *sempre* l'arresto del processo Node.js. Gli esempi includono verifiche `assert()` o chiamate `abort()` nel livello di C++.

## Errori di Sistema

System errors are generated when exceptions occur within the program's runtime environment. Di solito, questi sono errori operativi che si verificano quando un'applicazione viola un vincolo del sistema operativo come ad esempio provare a leggere un file che non esiste oppure quando l'utente non dispone dei permessi necessari.

Gli errori di sistema sono di solito generati al livello di syscall: un elenco esaustivo di codici di errore e il loro significato è disponibile eseguendo `man 2 intro` o `man 3 errno` sulla maggior parte dei sistemi operativi Unix; oppure [online](http://man7.org/linux/man-pages/man3/errno.3.html).

In Node.js gli errori di sistema sono rappresentati come `Error` objects aumentati con proprietà aggiunte.

### Class: System Error

#### error.code

* {string}

La proprietà `error.code` è una stringa che rappresenta il codice dell'errore, la quale è di solito `E` seguita da una serie di lettere maiuscole.

#### error.errno

* {string|number}

La proprietà `error.errno` è un numero o una stringa. Il numero è un valore **negativo** che corrisponde al codice dell'errore definito in [`libuv Error handling`]. Visualizza il file di intestazione uv-errno.h (`deps/uv/include/uv-errno.h` nell'albero delle risorse di Node.js) per ulteriori dettagli. Nel caso di una stringa, è uguale a `error.code`.

#### error.syscall

* {string}

La proprietà `error.syscall` è una stringa che descrive il [syscall](http://man7.org/linux/man-pages/man2/syscall.2.html) che ha fallito.

#### error.path

* {string}

Quando è presente (es. su `fs` o in un `child_process`), la proprietà `error.path` è una stringa contente un rilevante pathname invalido.

#### error.address

* {string}

Quando è presente (es. su `net` oppure `dgram`), la proprietà `error.address` è una stringa che descrive l'indirizzo al quale la connessione non è riuscita.

#### error.port

* {number}

Quando è presente (es. su `net` o `dgram`), la proprietà `error.port` è un numero che rappresenta la porta di connessione che non è disponibile.

### Errori di Sistema Comuni

Questo elenco **non è esaustivo**, però elenca molti degli errori di sistema che si incontrano quando si scrive un programma Node.js. [Qui](http://man7.org/linux/man-pages/man3/errno.3.html) potresti trovare un elenco esaustivo.

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

<a id="ERR_ARG_NOT_ITERABLE"></a>

### ERR_ARG_NOT_ITERABLE

Un argomento iterabile (cioè un valore che funziona con loop `for…of`) era necessario, ma non è stato fornito ad un'API Node.js.

<a id="ERR_ASYNC_CALLBACK"></a>

### ERR_ASYNC_CALLBACK

C'è stato un tentativo di registrare una cosa che non è una funziona come un callback `AsyncHooks`.

<a id="ERR_ASYNC_TYPE"></a>

### ERR_ASYNC_TYPE

Il tipo di risorsa asincrona non è valido. Nota che gli utenti possono anche definire i propri tipi se stanno usando il public embedder API.

<a id="ERR_ENCODING_INVALID_ENCODED_DATA"></a>

### ERR_ENCODING_INVALID_ENCODED_DATA

I dati forniti all'API `util.TextDecoder()` non erano validi secondo la codifica fornita.

<a id="ERR_ENCODING_NOT_SUPPORTED"></a>

### ERR_ENCODING_NOT_SUPPORTED

La codifica fornita all'API `util.TextDecoder()` non era una delle [Codifiche WHATWG supportate](util.md#whatwg-supported-encodings).

<a id="ERR_FALSY_VALUE_REJECTION"></a>

### ERR_FALSY_VALUE_REJECTION

Una `Promise` che è stata callbackified attraverso `util.callbackify()` è stata rifiutata con un valore falso.

<a id="ERR_HTTP_HEADERS_SENT"></a>

### ERR_HTTP_HEADERS_SENT

È stato effettuato un tentativo di aggiungere ulteriori intestazioni dopo che le intestazioni erano già state inviate.

<a id="ERR_HTTP_INVALID_CHAR"></a>

### ERR_HTTP_INVALID_CHAR

An invalid character was found in an HTTP response status message (reason phrase).

<a id="ERR_HTTP_INVALID_STATUS_CODE"></a>

### ERR_HTTP_INVALID_STATUS_CODE

Il codice di stato non rientrava nel normale intervallo di codici di stato (100-999).

<a id="ERR_HTTP_TRAILER_INVALID"></a>

### ERR_HTTP_TRAILER_INVALID

L'intestazione `Trailer` è stata impostata anche se la codifica di trasferimento non lo supporta.

<a id="ERR_HTTP2_ALREADY_SHUTDOWN"></a>

### ERR_HTTP2_ALREADY_SHUTDOWN

Occurs with multiple attempts to shutdown an HTTP/2 session.

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

<a id="ERR_HTTP2_FRAME_ERROR"></a>

### ERR_HTTP2_FRAME_ERROR

A failure occurred sending an individual frame on the HTTP/2 session.

<a id="ERR_HTTP2_GOAWAY_SESSION"></a>

### ERR_HTTP2_GOAWAY_SESSION

I nuovi Stream HTTP/2 non possono essere aperti dopo che la `Http2Session` ha ricevuto un frame `GOAWAY` dal peer connesso.

<a id="ERR_HTTP2_HEADER_REQUIRED"></a>

### ERR_HTTP2_HEADER_REQUIRED

A required header was missing in an HTTP/2 message.

<a id="ERR_HTTP2_HEADER_SINGLE_VALUE"></a>

### ERR_HTTP2_HEADER_SINGLE_VALUE

Sono stati forniti molteplici valori per un campo intestazione HTTP/2 che doveva avere un solo valore.

<a id="ERR_HTTP2_HEADERS_AFTER_RESPOND"></a>

### ERR_HTTP2_HEADERS_AFTER_RESPOND

Dopo che una risposta HTTP/2 era stata iniziata è stata specificata un’ulteriore intestazione.

<a id="ERR_HTTP2_HEADERS_OBJECT"></a>

### ERR_HTTP2_HEADERS_OBJECT

An HTTP/2 Headers Object was expected.

<a id="ERR_HTTP2_HEADERS_SENT"></a>

### ERR_HTTP2_HEADERS_SENT

C'è stato un tentativo di inviare molteplici intestazioni di risposta.

<a id="ERR_HTTP2_INFO_HEADERS_AFTER_RESPOND"></a>

### ERR_HTTP2_INFO_HEADERS_AFTER_RESPOND

HTTP/2 Informational headers must only be sent *prior* to calling the `Http2Stream.prototype.respond()` method.

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

An attempt was made to use the `Http2Stream.prototype.responseWithFile()` API to send something other than a regular file.

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

<a id="ERR_INVALID_ARG_TYPE"></a>

### ERR_INVALID_ARG_TYPE

Un argomento di tipo errato è stato passato a un'API Node.js.

<a id="ERR_INVALID_ASYNC_ID"></a>

### ERR_INVALID_ASYNC_ID

Un `asyncld` o `triggerAsyncld`non valido è stato passato utilizzando `AsyncHooks`. Un id minore di -1 non dovrebbe mai accadere.

<a id="ERR_INVALID_CALLBACK"></a>

### ERR_INVALID_CALLBACK

È stata richiesta una funzione di callback ma non era stata fornita a un'API Node.js.

<a id="ERR_INVALID_FILE_URL_HOST"></a>

### ERR_INVALID_FILE_URL_HOST

Un API Node.js che utilizza URL di `file:` (come ad esempio alcune funzioni nel modulo [`fs`][]) ha incontrato un URL di un file con un host incompatibile. Questa situazione può essere incontrata solo su sistemi di tipo Unix in cui è supportato solo `localhost` o un host vuoto.

<a id="ERR_INVALID_FILE_URL_PATH"></a>

### ERR_INVALID_FILE_URL_PATH

Un'API Node.js che utilizza URL di `file` (come ad esempio certe funzioni nel modulo [`fs`][]) ha incontrato un file con un percorso incompatibile. Le semantiche esatte per determinare se un percorso può essere utilizzato o meno, dipendono dalla piattaforma.

<a id="ERR_INVALID_HANDLE_TYPE"></a>

### ERR_INVALID_HANDLE_TYPE

È stato effettuato un tentativo di inviare un "handle" non supportato su un canale di comunicazione IPC a un processo secondario. Per informazione aggiuntive visualizza [`subprocess.send()`] e [`process.send()`].

<a id="ERR_INVALID_OPT_VALUE"></a>

### ERR_INVALID_OPT_VALUE

Un valore imprevisto o non valido è stato passato in un oggetto di un opzione.

<a id="ERR_INVALID_PERFORMANCE_MARK"></a>

### ERR_INVALID_PERFORMANCE_MARK

Durante l'utilizzo dell'API Performance Timing (`perf_hooks`), un performance mark non era valido.

<a id="ERR_INVALID_PROTOCOL"></a>

### ERR_INVALID_PROTOCOL

È stato passato un `options.protocol` non valido.

<a id="ERR_INVALID_SYNC_FORK_INPUT"></a>

### ERR_INVALID_SYNC_FORK_INPUT

Un `Buffer`, `Uint8Array` or `string` è stato fornito come input stdio a un fork sincrono. See the documentation for the [`child_process`](child_process.html) module for more information.

<a id="ERR_INVALID_THIS"></a>

### ERR_INVALID_THIS

Una funzione API Node.js è stata chiamata con un valore `this` non compatibile.

Esempio:

```js
const { URLSearchParams } = require('url');
const urlSearchParams = new URLSearchParams('foo=bar&baz=new');

const buf = Buffer.alloc(1);
urlSearchParams.has.call(buf, 'foo');
// Throws a TypeError with code 'ERR_INVALID_THIS'
```

<a id="ERR_INVALID_TUPLE"></a>

### ERR_INVALID_TUPLE

Un elemento nell'`iterable` fornito al [WHATWG](url.html#url_the_whatwg_url_api) [constructor `URLSearchParams`][`newURLSearchParams(iterable)`] non rappresentava una sequenza `[name, value]` - cioè, se un elemento non è iterabile o non è composto esattamente da 2 elementi.

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

È stato effettuato un tentativo di disconnettere un canale di comunicazione IPC che era già stato disconnesso. See the documentation for the [`child_process`](child_process.html) module for more information.

<a id="ERR_IPC_ONE_PIPE"></a>

### ERR_IPC_ONE_PIPE

È stato effettuato un tentativo di creare un processo child Node.js utilizzando più di un canale di comunicazione IPC. See the documentation for the [`child_process`](child_process.html) module for more information.

<a id="ERR_IPC_SYNC_FORK"></a>

### ERR_IPC_SYNC_FORK

Si è fatto un tentativo di aprire un canale di comunicazione IPC con un processo biforcato in modo sincrono Node.js. See the documentation for the [`child_process`](child_process.html) module for more information.

<a id="ERR_MISSING_ARGS"></a>

### ERR_METHOD_NOT_IMPLEMENTED

Un argomento necessario di un API Node.js non è stato passato. Questo è usato solamente per un applicazione rigorosa con le specifiche dell'API (che in alcuni casi potrebbe accettare `func(undefined)` ma non `func()`). Nella maggior parte delle API Node.js, `func(undefined)` e `func()` sono trattate allo stesso modo, e potrebbe essere usato l'error code [`ERR_INVALID_ARG_TYPE`][].

<a id="ERR_MISSING_DYNAMIC_INSTANTIATE_HOOK"></a>

### ERR_MISSING_DYNAMIC_INSTANTIATE_HOOK

> Stability: 1 - Experimental

Used when an \[ES6 module\]\[\] loader hook specifies `format: 'dynamic` but does not provide a `dynamicInstantiate` hook.

<a id="ERR_MISSING_MODULE"></a>

### ERR_MISSING_MODULE

> Stability: 1 - Experimental

Used when an \[ES6 module\]\[\] cannot be resolved.

<a id="ERR_MODULE_RESOLUTION_LEGACY"></a>

### ERR_MODULE_RESOLUTION_LEGACY

> Stabilità: 1 - Sperimentale

Used when a failure occurred resolving imports in an \[ES6 module\]\[\].

<a id="ERR_MULTIPLE_CALLBACK"></a>

### ERR_MULTIPLE_CALLBACK

Un callback è stato chiamato più di una volta.

*Note*: A callback is almost always meant to only be called once as the query can either be fulfilled or rejected but not both at the same time. Quest'ultimo sarebbe possibile chiamando un callback più volte.

<a id="ERR_NAPI_CONS_FUNCTION"></a>

### ERR_NAPI_CONS_FUNCTION

Durante l'utilizzo di `N-API`, un constructor passato non era una funzione.

<a id="ERR_NAPI_CONS_PROTOTYPE_OBJECT"></a>

### ERR_NAPI_CONS_PROTOTYPE_OBJECT

While using `N-API`, `Constructor.prototype` was not an object.

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

On the main thread, values are removed from the queue associated with the thread-safe function in an idle loop. This error indicates that an error has occurred when attemping to start the loop.

<a id="ERR_NAPI_TSFN_STOP_IDLE_LOOP"></a>

### ERR_NAPI_TSFN_STOP_IDLE_LOOP

Once no more items are left in the queue, the idle loop must be suspended. This error indicates that the idle loop has failed to stop.

<a id="ERR_NO_ICU"></a>

### ERR_NO_ICU

È stato effettuato un tentativo di utilizzare funzioni che richiedono [ICU](intl.html#intl_internationalization_support), ma Node.js non era compilato con il supporto ICU.

<a id="ERR_SOCKET_ALREADY_BOUND"></a>

### ERR_SOCKET_ALREADY_BOUND

È stato effettuato un tentativo di associare un socket che è già stato associato.

<a id="ERR_SOCKET_BAD_PORT"></a>

### ERR_SOCKET_BAD_PORT

Una funzione API che si aspettava una porta > 0 e < 65536 ha ricevuto un valore non valido.

<a id="ERR_SOCKET_BAD_TYPE"></a>

### ERR_SOCKET_BAD_TYPE

Una funzione API che si aspettava un tipo di socket (`udp4` o `udp6`) ha ricevuto un valore non valido.

<a id="ERR_SOCKET_CANNOT_SEND"></a>

### ERR_SOCKET_CANNOT_SEND

I dati potrebbero essere inviati su un socket.

<a id="ERR_SOCKET_CLOSED"></a>

### ERR_SOCKET_CLOSED

È stato effettuato un tentativo di operare su un socket già chiuso.

<a id="ERR_SOCKET_DGRAM_NOT_RUNNING"></a>

### ERR_SOCKET_DGRAM_NOT_RUNNING

È stata effettuata una chiamata e il sottosistema UDP non era in esecuzione.

<a id="ERR_STDERR_CLOSE"></a>

### ERR_STDERR_CLOSE<!-- YAML
removed: v8.16.0
changes:
  - version: v8.16.0
    pr-url: https://github.com/nodejs/node/pull/23053
    description: Rather than emitting an error, `process.stderr.end()` now
                 only closes the stream side but not the underlying resource,
                 making this error obsolete.
-->È stato effettuato un tentativo di chiudere lo stream `process.stderr`. Per progettazione, Node.js non permette che gli stream `stdout` o `stderr` vengano chiusi dal codice utente.

<a id="ERR_STDOUT_CLOSE"></a>

### ERR_STDOUT_CLOSE

<!-- YAML
removed: v8.16.0
changes:
  - version: v8.16.0
    pr-url: https://github.com/nodejs/node/pull/23053
    description: Rather than emitting an error, `process.stderr.end()` now
                 only closes the stream side but not the underlying resource,
                 making this error obsolete.
-->

È stato effettuato un tentativo di chiudere lo stream `process.stdout`. Per progettazione, Node.js non permette che gli stream `stdout` o `stderr` vengano chiusi dal codice utente.

<a id="ERR_TLS_CERT_ALTNAME_INVALID"></a>

### ERR_TLS_CERT_ALTNAME_INVALID

Durante l'utilizzo di TLS, l'hostname/IP del peer non corrispondeva a nessuno dei subjectAltNames presenti nel suo certificato.

<a id="ERR_TLS_DH_PARAM_SIZE"></a>

### ERR_TLS_DH_PARAM_SIZE

Durante l'utilizzo di TLS, il parametro offerto per il key-agreement protocol Diffie-Hellman (`DH`) era troppo piccolo. Da impostazione predefinita, la lunghezza della chiave deve essere maggiore o uguale a 1024 bit per evitare vulnerabilità, anche se, per una maggiore sicurezza, è fortemente raccomandato utilizzare 2048 bit o superiore.

<a id="ERR_TLS_HANDSHAKE_TIMEOUT"></a>

### ERR_TLS_HANDSHAKE_TIMEOUT

Un handshake TLS/SSL è scaduto. In questo caso il server deve anche interrompere la connessione.

<a id="ERR_TLS_RENEGOTIATION_FAILED"></a>

### ERR_TLS_RENEGOTIATION_FAILED

A TLS renegotiation request has failed in a non-specific way.

<a id="ERR_TLS_REQUIRED_SERVER_NAME"></a>

### ERR_TLS_REQUIRED_SERVER_NAME

Durante l'utilizzo di TLS, il metodo `server.addContext()` è stato chiamato senza fornire un nome del host nel primo parametro.

<a id="ERR_TLS_SESSION_ATTACK"></a>

### ERR_TLS_SESSION_ATTACK

È stata rilevata una quantità eccessiva di rinegoziazioni TLS, il che è un potenziale vettore per attacchi di tipo denial-of-service.

<a id="ERR_TRANSFORM_ALREADY_TRANSFORMING"></a>

### ERR_TRANSFORM_ALREADY_TRANSFORMING

Uno stream Transform è terminato mentre era ancora in fase di trasformazione.

<a id="ERR_TRANSFORM_WITH_LENGTH_0"></a>

### ERR_TRANSFORM_WITH_LENGTH_0

Uno stream Transform è terminato con dati ancora presenti nel buffer di scrittura.

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

È stata usata l'API V8 Breaklterator però il set completo di dati ICU non è installato.

<a id="ERR_VALID_PERFORMANCE_ENTRY_TYPE"></a>

### ERR_VALID_PERFORMANCE_ENTRY_TYPE

Durante l'utilizzo dell'API per la Tempistica delle Prestazioni (`perf_hooks`), non è stato trovato alcun tipo di prestazione valida.

<a id="ERR_VALUE_OUT_OF_RANGE"></a>

### ERR_VALUE_OUT_OF_RANGE

Un determinato valore è fuori dal range accettato.
