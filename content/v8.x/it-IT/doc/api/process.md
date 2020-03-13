# Processo

<!-- introduced_in=v0.10.0 -->
<!-- type=global -->

Il `process` object è un `global` che fornisce informazioni riguardo al processo Node.js corrente e lo controlla. Come un global, è sempre disponibile per le applicazioni Node.js senza usare `require()`.

## Process Events

Il `process` object è un'istanza di [`EventEmitter`][].

### Evento: 'beforeExit'
<!-- YAML
added: v0.11.12
-->

L'evento `'beforeExit'` viene emesso quando Node.js svuota il suo ciclo degli eventi e non ha lavoro aggiuntivo da pianificare. Normalmente, il processo Node.js uscirà quando non c'è nessun lavoro programmato, ma un listener registrato sull'evento `'beforeExit'` può effettuare chiamate asincrone e quindi far proseguire il processo Node.js.

La funzione di callback del listener è invocata con il valore di [`process.exitCode`][] passato come unico argomento.

L'evento `'beforeExit'` *non* viene emesso per condizioni che causano la terminazione esplicita, come chiamare [`process.exit ()`][] o eccezioni non rilevate.

Il `'beforeExit'` *non* dovrebbe essere usato come un'alternativa all'evento `'exit'` a meno che l'intenzione non sia pianificare un lavoro aggiuntivo.

### Evento: 'disconnect'
<!-- YAML
added: v0.7.7
-->

Se il processo Node.js viene generato con un canale IPC (consultare la documentazione [Child Process](child_process.html) e [Cluster](cluster.html)), l'evento `'disconnect'` verrà emesso quando il canale IPC è chiuso.

### Evento: 'exit'
<!-- YAML
added: v0.1.7
-->

L'evento `'exit'` viene emesso quando il processo Node.js sta per uscire a causa di una delle seguenti circostanze:

* Il metodo `process.exit()` viene chiamato esplicitamente;
* Il ciclo degli eventi Node.js non ha più alcun lavoro aggiuntivo da eseguire.

Non c'è modo di impedire l'uscita del ciclo degli eventi a questo punto e una volta che tutti gli `'exit'` listener hanno terminato l'esecuzione, il processo Node.js terminerà.

The listener callback function is invoked with the exit code specified either by the [`process.exitCode`][] property, or the `exitCode` argument passed to the [`process.exit()`] method, as the only argument.

Per esempio:

```js
process.on('exit', (code) => {
  console.log(`About to exit with code: ${code}`);
});
```

Le funzioni del listener **devono** eseguire solo operazioni **sincrone**. Il processo Node.js si chiuderà immediatamente dopo aver chiamato i listener dell'evento `'exit'` causando l'interruzione di qualsiasi eventuale lavoro aggiuntivo ancora accodato nel ciclo degli eventi. Nell'esempio seguente, ad esempio, il timeout non si verificherà mai:

```js
process.on('exit', (code) => {
  setTimeout(() => {
    console.log('This will not run');
  }, 0);
});
```

### Evento: 'message'
<!-- YAML
added: v0.5.10
-->

Se il processo Node.js viene generato con un canale IPC (consultare la documentazione [Child Process](child_process.html) e [Cluster](cluster.html)), l'evento `'message'` viene emesso ogni volta che un messaggio inviato da un parent process che utilizza [`childprocess.send ()`][] viene ricevuto dal child process.

The listener callback is invoked with the following arguments:
* `message` {Object} a parsed JSON object or primitive value.
* `sendHandle` {Handle object} a [`net.Socket`][] or [`net.Server`][] object, or undefined.

*Note*: The message goes through serialization and parsing. Il messaggio risultante potrebbe non essere uguale a quello che è stato inviato originariamente.

### Evento: 'rejectionHandled'
<!-- YAML
added: v1.4.1
-->

L'evento `'rejectionHandled'` viene emesso ogni volta che una `Promise` è stata rifiutata e un error handler è stato collegato ad essa (usando, ad esempio [` promise.catch ()`][]) dopo un giro del ciclo di eventi Node.js.

The listener callback is invoked with a reference to the rejected `Promise` as the only argument.

Il `Promise` object sarebbe stato precedentemente emesso in un evento `'unhandledRejection'`, ma durante il processo di elaborazione ha ottenuto un rejection handler.

Non esiste la nozione di un livello superiore per una catena `Promise` in cui le rejection possono essere sempre gestite. Essendo di natura intrinsecamente asincrona, una `Promise` rejection può essere gestita in un momento futuro — probabilmente molto più tardi del ciclo di eventi necessario per l'evento `'unhandledRejection'` da emettere.

Un altro modo per affermare ciò è che, a differenza del codice sincrono in cui è presente un elenco sempre crescente di eccezioni non gestite, con le Promise può esserci un elenco crescente e in diminuzione di rejection non gestite.

Nel codice sincrono, l'evento `'uncaughtException'` viene emesso quando l'elenco di eccezioni non gestite aumenta.

In codice asincrono, l'evento `'unhandledRejection'` viene emesso quando l'elenco delle rejection non gestite aumenta e l'evento `'rejectionHandled'` viene emesso quando l'elenco delle rejection non gestite si riduce.

Per esempio:

```js
const unhandledRejections = new Map();
process.on('unhandledRejection', (reason, p) => {
  unhandledRejections.set(p, reason);
});
process.on('rejectionHandled', (p) => {
  unhandledRejections.delete(p);
});
```

In questo esempio, la `unhandledRejections` `Map` crescerà e si restringerà nel tempo, riflettendo le rejection che iniziano non gestite e quindi diventano gestite. È possibile registrare tali errori in un log degli errori, periodicamente (che è probabilmente meglio per un'applicazione di lunga durata) o all'uscita del processo (che è probabilmente più conveniente per gli script).

### Evento: 'uncaughtException'
<!-- YAML
added: v0.1.18
-->

L'evento `'uncaughtException'` viene emesso quando un'eccezione JavaScript non rilevata rimbalza fino al ciclo degli eventi. Per impostazione predefinita, Node.js gestisce tali eccezioni stampando la traccia dello stack su `stderr` ed uscendo. L'aggiunta di un handler per l'evento `'uncaughtException'` sostituisce questo comportamento predefinito.

La funzione listener viene chiamata con l'`Error` object passato come l'unico argomento.

Per esempio:

```js
process.on('uncaughtException', (err) => {
  fs.writeSync(1, `Caught exception: ${err}\n`);
});

setTimeout(() => {
  console.log('This will still run.');
}, 500);

// Crea intenzionalmente un'eccezione, ma non prenderla.
nonexistentFunc();
console.log('This will not run.');
```

#### Avviso: utilizzando `'uncaughtException'` correttamente

Ricorda che `'uncaughtException'` è un meccanismo grezzo per la exception handling destinato ad essere utilizzata solo come un'ultima risorsa. L'evento *non dovrebbe* essere utilizzato come un equivalente a `On Error Resume Next`. Le eccezioni non gestite implicano intrinsecamente che un'applicazione è in uno stato indefinito. Il tentativo di riprendere il codice dell'applicazione senza il corretto ripristino dall'eccezione può causare ulteriori problemi inattesi e imprevedibili.

Le eccezioni lanciate dall'interno del gestore dell'evento non verranno catturate. Il processo, invece, uscirà con un codice di uscita diverso da zero e la traccia dello stack verrà stampata. Questo per evitare una ricorsione infinita.

Tentare di riprendere normalmente dopo un'eccezione non rilevata può essere simile all'estrazione del cavo di alimentazione durante l'aggiornamento di un computer — nove volte su dieci non accade nulla - ma la decima volta il sistema diventa danneggiato.

L'uso corretto di `'uncaughtException'` consiste nell'eseguire la pulizia sincrona delle risorse allocate (ad esempio i file descriptor, gli handle, ecc.) prima di arrestare il processo. **Non è sicuro riprendere il normale funzionamento dopo una `'uncaughtException'`.**

To restart a crashed application in a more reliable way, whether `uncaughtException` is emitted or not, an external monitor should be employed in a separate process to detect application failures and recover or restart as needed.

### Evento: 'unhandledRejection'
<!-- YAML
added: v1.4.1
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8217
    description: Not handling Promise rejections has been deprecated.
  - version: v6.6.0
    pr-url: https://github.com/nodejs/node/pull/8223
    description: Unhandled Promise rejections will now emit
                 a process warning.
-->

The `'unhandledRejection`' event is emitted whenever a `Promise` is rejected and no error handler is attached to the promise within a turn of the event loop. Quando si programma con le Promise, le eccezioni sono incapsulate come "rejected promises". I rejection possono essere catturati e gestiti usando [`promise.catch()`][] e vengono propagati attraverso una `Promise` chain. L'evento `'unhandledRejection'` è utile per rilevare e tenere traccia delle promise che sono state respinte, le cui rejection non sono ancora state gestite.

La funzione listener viene chiamata con i seguenti argomenti:

* `reason` {Error|any} L'object con cui è stata rifiutata la promise (in genere un [`error`][] object).
* `p` la `Promise` che è stata respinta.

Per esempio:

```js
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

somePromise.then((res) => {
  return reportToUser(JSON.pasre(res)); // note the typo (`pasre`)
}); // no `.catch` or `.then`
```

Il seguente attiverà anche l'evento `'unhandledRejection'` da emettere:

```js
function SomeResource () {
   // Inizialmente imposta lo stato caricato su una promise respinta
   this.loaded = Promise.reject (new Error ('Resource not yet loaded!'));
}

const resource = new SomeResource ();
// no .catch o .then su resource.loaded per almeno un turno
```

In questo caso di esempio, è possibile tenere traccia del rejection come errore dello sviluppatore, come in genere accade per altri eventi `'unhandledRejection'`. Per affrontare tali fallimentii, un [`.catch(() = >{ })`][`promise.catch()`] handler non operativo può essere collegato alla `resource.loaded`, che impedirebbe l'emissione dell'evento `'unhandledRejection'`. In alternativa, l'evento [`'rejectionHandled'`][] può essere utilizzato.

### Evento: 'warning'
<!-- YAML
added: v6.0.0
-->

L'evento `'warning'` viene emesso ogni volta che Node.js emette un process warning.

Un process warning è simile a un errore laddove descrive condizioni eccezionali che vengono portate all'attenzione dell'utente. Tuttavia, gli avvisi non fanno parte del normale flusso di gestione degli errori di Node.js e JavaScript. Node.js può emettere avvisi ogni volta che rileva pratiche di codifica errate che potrebbero portare a prestazioni di applicazione non ottimali, bug o vulnerabilità di sicurezza.

The listener function is called with a single `warning` argument whose value is an `Error` object. There are three key properties that describe the warning:

* `name` {string} The name of the warning (currently `Warning` by default).
* `message` {string} Una descrizione fornita dal sistema dell'avviso.
* `stack`{string} Una traccia dello stack nella posizione nel codice in cui è stato emesso l'avviso.

```js
process.on('warning', (warning) => {
  console.warn(warning.name);    // Stampa il nome dell'avviso
  console.warn(warning.message); // Stampa il messaggio dell'avviso
  console.warn(warning.stack);   // Stampa la traccia dello stack
});
```

Per impostazione predefinita, Node.js stamperà avvisi di processo su `stderr`. L'opzione della riga di comando `--no-warnings` può essere utilizzata per eliminare l'output della console predefinito ma l'evento `'warning'` verrà comunque emesso dal `process` object.

L'esempio seguente illustra l'avviso che viene stampato su `stderr` quando sono stati aggiunti troppi listener a un evento

```txt
$ node
> events.defaultMaxListeners = 1;
> process.on('foo', () => {});
> process.on('foo', () => {});
> (node:38638) MaxListenersExceededWarning: Rilevata possibile perdita di memoria EventEmitter. Aggiunti 2 foo listener. Usa emitter.setMaxListeners() per aumentare il limite
```

Al contrario, l'esempio seguente disattiva l'output di avviso predefinito e aggiunge un handler personalizzato all'evento `'warning'`:

```txt
$ node --no-warnings
> const p = process.on('warning', (warning) => console.warn('Do not do that!'));
> events.defaultMaxListeners = 1;
> process.on('foo', () => {});
> process.on('foo', () => {});
> Non farlo!
```

L'opzione della riga di comando `--trace-warnings` può essere utilizzata per fare in modo che l'output della console predefinito per gli avvisi includa la traccia stack completa dell'avviso.

L'avvio di Node.js utilizzando il flag della riga di comando `--throw-deprecation` comporterà il lancio di depecration warning personalizzati come eccezioni.

L'utilizzo del flag della riga di comando `--trace-deprecation` comporterà la stampa della deprecation personalizzata su `stderr` insieme alla stack trace.

L'utilizzo del flag della riga di comando `--no-deprecation` eliminerà tutti i rapporti relativi alla depecration personalizzata.

The `*-deprecation` command line flags only affect warnings that use the name `DeprecationWarning`.

#### Emissione di avvisi personalizzati

Vedere il metodo [`process.emitWarning()`](#process_process_emitwarning_warning_type_code_ctor) per l'emissione di avvisi personalizzati o specifici dell'applicazione.

### Eventi Segnale

<!--type=event-->
<!--name=SIGINT, SIGHUP, etc.-->

Gli Eventi Segnale verranno emessi quando il processo Node.js riceve un segnale. Please refer to signal(7) for a listing of standard POSIX signal names such as `SIGINT`, `SIGHUP`, etc.

L'handler del segnale riceverà come primo argomento il nome del segnale (`'SIGINT'`, `'SIGTERM'`, ecc.).

Il nome di ciascun evento sarà il nome comune in maiuscolo per il segnale (ad esempio `'SIGINT'` per i segnali `SIGINT`).

Per esempio:

```js
// Iniziare a leggere da stdin in modo che il processo non termini.
process.stdin.resume();

process.on('SIGINT', () => {
  console.log('Received SIGINT. Premi Control-D per uscire.');
});


// Utilizzando una singola funzione per gestire più segnali
handle di funzione(segnale) {  
console.log(`Received ${signal}`);
}

process.on('SIGINT', handle);
process.on('SIGTERM', handle);
```

* `SIGUSR1` is reserved by Node.js to start the [debugger](debugger.html). È possibile installare un listener ma ciò potrebbe interferire con il debugger.
* `SIGTERM` and `SIGINT` have default handlers on non-Windows platforms that reset the terminal mode before exiting with code `128 + signal number`. Se uno di questi segnali ha un listener installato, il suo comportamento predefinito verrà rimosso (Node.js non terminerà più).
* `SIGPIPE` is ignored by default. Può avere un listener installato.
* `SIGHUP` is generated on Windows when the console window is closed, and on other platforms under various similar conditions, see signal(7). Può avere un listener installato, tuttavia Node.js verrà terminato incondizionatamente da Windows circa 10 secondi dopo. Su piattaforme non Windows, il comportamento predefinito di `SIGHUP` è quello di terminare Node.js, ma una volta che il listener viene installato, il suo comportamento predefinito verrà rimosso.
* `SIGTERM` is not supported on Windows, it can be listened on.
* `SIGINT` from the terminal is supported on all platforms, and can usually be generated with `<Ctrl>+C` (though this may be configurable). It is not generated when terminal raw mode is enabled.
* `SIGBREAK` is delivered on Windows when `<Ctrl>+<Break>` is pressed, on non-Windows platforms it can be listened on, but there is no way to send or generate it.
* `SIGWINCH` is delivered when the console has been resized. Su Windows, ciò avverrà solo scrivendo sulla console quando il cursore viene spostato o quando un tty leggibile in modalità raw viene utilizzato.
* `SIGKILL` cannot have a listener installed, it will unconditionally terminate Node.js on all platforms.
* `SIGSTOP` cannot have a listener installed.
* `SIGBUS`, `SIGFPE`, `SIGSEGV` and `SIGILL`, when not raised artificially using kill(2), inherently leave the process in a state from which it is not safe to attempt to call JS listeners. Doing so might lead to the process hanging in an endless loop, since listeners attached using `process.on()` are called asynchronously and therefore unable to correct the underlying problem.

*Note*: Windows does not support sending signals, but Node.js offers some emulation with [`process.kill()`][], and [`subprocess.kill()`][]. Sending signal `0` can be used to test for the existence of a process. Sending `SIGINT`, `SIGTERM`, and `SIGKILL` cause the unconditional termination of the target process.

## process.abort()
<!-- YAML
added: v0.7.0
-->

Il metodo `process.abort()` fa sì che il processo Node.js esca immediatamente e generi un file core.

## process.arch
<!-- YAML
added: v0.5.0
-->

* {string}

The `process.arch` property returns a string identifying the operating system CPU architecture for which the Node.js binary was compiled.

I possibili valori correnti sono: `'arm'`, `'arm64'`, `'ia32'`, `'mips'`, `'mipsel'`, `'ppc'`, `'ppc64'`, `'s390'`, `'s390x'`, `'x32'` e `'x64'`.

```js
console.log(`Questa architettura del processore è ${process.arch}`);
```

## process.argv
<!-- YAML
added: v0.1.27
-->

* {Array}

La proprietà `process.argv` restituisce una array contenente gli argomenti della riga di comando passati al momento dell'avvio del processo Node.js. Il primo elemento sarà [`process.execPath`]. Vedi `process.argv0` se l'accesso al valore originale di `argv[0]` è necessario. Il secondo elemento sarà il percorso del file JavaScript in esecuzione. Gli elementi rimanenti saranno argomenti aggiuntivi della riga di comando.

Ad esempio, assumendo il seguente script per `process-args.js`:

```js
// stampa process.argv
process.argv.forEach((val, index) => {
  console.log(`${index}: ${val}`);
});
```

Avviando il processo Node.js come:

```console
$ node process-args.js uno due=tre quattro
```

Genererebbe l'output:

```text
0: /usr/local/bin/node
1: /Users/mjr/work/node/process-args.js
2: uno
3: due=tre
4: quattro
```

## process.argv0
<!-- YAML
added: 6.4.0
-->

* {string}

La proprietà `process.argv0` memorizza una copia di sola lettura del valore originale di `argv[0]` passato all'avvio di Node.js.

```console
$ bash -c 'exec -a customArgv0 ./node'
> process.argv[0]
'/Volumes/code/external/node/out/Release/node'
> process.argv0
'customArgv0'
```

## process.channel
<!-- YAML
added: v7.1.0
-->

* {Object}

Se il processo Node.js è stato generato con un canale IPC (consultare la documentazione [Child Process](child_process.html)), la proprietà `process.channel` è un riferimento al canale IPC. Se non esiste alcun canale IPC, questa proprietà è `undefined`.

## process.chdir(directory)
<!-- YAML
added: v0.1.17
-->

* `directory` {string}

Il metodo `process.chdir()` cambia la directory di lavoro corrente del processo Node.js o lancia un'eccezione se ciò non riesce (ad esempio, se la `directory` specificata non esiste).

```js
console.log(`Starting directory: ${process.cwd()}`);
try {
  process.chdir('/tmp');
  console.log(`New directory: ${process.cwd()}`);
} catch (err) {
  console.error(`chdir: ${err}`);
}
```

## process.config
<!-- YAML
added: v0.7.7
-->

* {Object}

The `process.config` property returns an Object containing the JavaScript representation of the configure options used to compile the current Node.js executable. È lo stesso del file `config.gypi` prodotto durante l'esecuzione dello script `./configure`.

Un esempio dell'output possibile è simile a:
```js
{
  target_defaults:
   { cflags: [],
     default_configuration: 'Release',
     defines: [],
     include_dirs: [],
     libraries: [] },
  variables:
   {
     host_arch: 'x64',
     node_install_npm: 'true',
     node_prefix: '',
     node_shared_cares: 'false',
     node_shared_http_parser: 'false',
     node_shared_libuv: 'false',
     node_shared_zlib: 'false',
     node_use_dtrace: 'false',
     node_use_openssl: 'true',
     node_shared_openssl: 'false',
     strict_aliasing: 'true',
     target_arch: 'x64',
     v8_use_snapshot: 'true'
   }
}
```

*Note*: The `process.config` property is **not** read-only and there are existing modules in the ecosystem that are known to extend, modify, or entirely replace the value of `process.config`.

## process.connected<!-- YAML
added: v0.7.2
-->* {boolean}

Se il processo Node.js viene generato con un canale IPC (consultare la documentazione [Child Process](child_process.html) e [Cluster](cluster.html)), la proprietà `process.connected` verrà restituita `true` fino a quando il canale IPC è connesso e restituirà `false` dopo che `process.disconnect()` viene chiamato.

Una volta che `process.connected` è `false`, non è più possibile inviare messaggi tramite il canale IPC utilizzando `process.send()`.

## process.cpuUsage([previousValue])<!-- YAML
added: v6.1.0
-->* `previousValue` {Object} Un precedente valore di ritorno dalla chiamata `process.cpuUsage()`
* Restituisce: {Object}
    * `user` {integer}
    * `system` {integer}

Il metodo `process.cpuUsage()` restituisce l'utilizzo del tempo della CPU dell'utente e del sistema del processo corrente, in un object con proprietà `user` e `system`, i cui valori sono valori in microsecondi (milionesimo di secondo). Questi valori misurano il tempo trascorso rispettivamente nel codice utente e di sistema e potrebbero risultare maggiori del tempo trascorso effettivo se più core CPU stanno eseguendo il lavoro per questo processo.

Il risultato di una precedente chiamata a `process.cpuUsage()` può essere passato come argomento alla funzione per ottenere una lettura di diff.

```js
const startUsage = process.cpuUsage();
// { user: 38579, system: 6986 }

// gira la CPU per 500 millisecondi
const now = Date.now();
mentre (Date.now() - now < 500);

console.log(process.cpuUsage(startUsage));
// { user: 514883, system: 11226 }
```

## process.cwd()<!-- YAML
added: v0.1.8
-->* Restituisce: {string}

Il metodo `process.cwd()` restituisce la directory di lavoro corrente del processo Node.js.

```js
console.log(`Current directory: ${process.cwd()}`);
```
## process.debugPort<!-- YAML
added: v0.7.2
-->* {number}

La porta utilizzata dal debugger di Node.js quando abilitata.

```js
process.debugPort = 5858;
```
## process.disconnect()
<!-- YAML
added: v0.7.2
-->
Se il processo Node.js viene generato con un canale IPC (consultare la documentazione [Child Process](child_process.html) e [Cluster](cluster.html)), ll metodo `process.disconnect()` chiuderà il canale IPC al parent process, permettendo al child process di eseguire l'uscita in modo corretto una volta che non ci sono altre connessioni che lo mantengono in vita.

L'effetto di chiamare `process.disconnect()` equivale a chiamare [`ChildProcess.disconnect()`][] del parent process [<0>ChildProcess.disconnect()</0>][].

Se il processo Node.js non è stato generato con un canale IPC,`process.disconnect()` sarà `undefined`.

## process.emitWarning(warning[, options])<!-- YAML
added: 8.0.0
-->* `warning` {string|Error} L'avviso da emettere.
* `options` {Object}
  * `type` {string} When `warning` is a String, `type` is the name to use for the *type* of warning being emitted. **Default:** `Warning`.
  * `code` {string} Un identificativo univoco per l'istanza di avviso che viene emessa.
  * `ctor` {Function} When `warning` is a String, `ctor` is an optional function used to limit the generated stack trace. **Default:** `process.emitWarning`.
  * `detail` {string} Testo addizionale da includere con l'errore.

Il metodo `process.emitWarning()` può essere utilizzato per emettere avvisi di processo personalizzati o specifici dell'applicazione. These can be listened for by adding a handler to the [`process.on('warning')`](#process_event_warning) event.

```js
// Emetti un avviso con un codice e dettagli aggiuntivi.
process.emitWarning('Something happened!', {
  code: 'MY_WARNING',
  detail: 'This is some additional information'
});
// Emette:
// (node:56338) [MY_WARNING] Avviso: È successo qualcosa!
// Queste sono alcune informazioni aggiuntive
```

In this example, an `Error` object is generated internally by `process.emitWarning()` and passed through to the [`process.on('warning')`](#process_event_warning) event.

```js
process.on('warning', (warning) => {
  console.warn(warning.name);    // 'Warning'
  console.warn(warning.message); // 'Something happened!'
  console.warn(warning.code);    // 'MY_WARNING'
  console.warn(warning.stack);   // Stack trace
  console.warn(warning.detail);  // 'This is some additional information'
});
```

Se `warning` viene passato come un `Error` object, l'argomento `options` viene ignorato.

## process.emitWarning(warning\[, type[, code]\]\[, ctor\])<!-- YAML
added: v6.0.0
-->* `warning` {string|Error} L'avviso da emettere.
* `type` {string} When `warning` is a String, `type` is the name to use for the *type* of warning being emitted. **Default:** `Warning`.
* `code` {string} Un identificativo univoco per l'istanza di avviso che viene emessa.
* `ctor` {Function} When `warning` is a String, `ctor` is an optional function used to limit the generated stack trace. **Default:** `process.emitWarning`.

Il metodo `process.emitWarning()` può essere utilizzato per emettere avvisi di processo personalizzati o specifici dell'applicazione. These can be listened for by adding a handler to the [`process.on('warning')`](#process_event_warning) event.

```js
// Emetti un avviso usando una stringa.
process.emitWarning('Something happened!');
// Emette: (node: 56338) Avviso: È successo qualcosa!
```

```js
// Emette un avviso usando una stringa e un type.
process.emitWarning('Something Happened!', 'CustomWarning'); 
// Emette: (node: 56338) CustomWarning: È Successo Qualcosa!
```

```js
process.emitWarning('Something happened!', 'CustomWarning', 'WARN001'); // Emette: (node: 56338) [WARN001] CustomWarning: È successo qualcosa!
```

In each of the previous examples, an `Error` object is generated internally by `process.emitWarning()` and passed through to the [`process.on('warning')`](#process_event_warning) event.

```js
process.on('warning', (warning) => {
  console.warn(warning.name);
  console.warn(warning.message);
  console.warn(warning.code);
  console.warn(warning.stack);
});
```

If `warning` is passed as an `Error` object, it will be passed through to the `process.on('warning')` event handler unmodified (and the optional `type`, `code` and `ctor` arguments will be ignored):

```js
// Emetti un avviso usando un Error object.
const myWarning = new Error('Something happened!');
// Utilizzare la proprietà Error name per specificare il nome del type
myWarning.name = 'CustomWarning';
myWarning.code = 'WARN001';

process.emitWarning(myWarning);
// Emette: (node: 56338) [WARN001] CustomWarning: È successo qualcosa!
```

Un `TypeError` viene generato se `warning` è qualcosa di diverso da una stringa o da un `Error` object.

Si noti che mentre gli avvisi di processo utilizzano gli `Error` object, il meccanismo di avviso del processo **non** è un sostituto per i normali meccanismi di gestione degli errori.

The following additional handling is implemented if the warning `type` is `DeprecationWarning`:

* Se viene utilizzato il flag della riga di comando `--throw-deprecation`, l'avviso di deprecation viene generato come eccezione anziché essere emesso come un evento.
* Se viene utilizzato il flag della riga di comando `--no-deprecation`, l'avviso di deprecation viene eliminato.
* Se viene utilizzato il flag della riga di comando `--trace-deprecation`, l'avviso di deprecration viene stampato su `stderr` insieme alla stack trace completa.

### Evitare gli avvisi duplicati

Come buona prassi, gli avvisi dovrebbero essere emessi solo una volta per processo. Per fare ciò, si consiglia di posizionare `emitWarning()` dietro un semplice flag booleano come illustrato nell'esempio seguente:

```js
unction emitMyWarning() {
  if (!emitMyWarning.warned) {
    emitMyWarning.warned = true;
    process.emitWarning('Only warn once!');
  }
}
emitMyWarning(); 
// Emette: (node: 56339) Avviso: Avvisa solo una volta!
emitMyWarning();//
// Non emette niente
```

## process.env<!-- YAML
added: v0.1.27
-->* {Object}

La proprietà `process.env` restituisce un object contenente l'ambiente utente. See environ(7).

Un esempio di questo object è simile a:
```js
{
  TERM: 'xterm-256color',
  SHELL: '/usr/local/bin/bash',
  USER: 'maciej',
  PATH: '~/.bin/:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin',
  PWD: '/Users/maciej',
  EDITOR: 'vim',
  SHLVL: '1',
  HOME: '/Users/maciej',
  LOGNAME: 'maciej',
  _: '/usr/local/bin/node'
}
```

È possibile modificare questo object, ma tali modifiche non saranno riflesse al di fuori del processo Node.js. In altre parole, il seguente esempio non funzionerebbe:

```console
$ node -e 'process.env.foo = "bar"' && echo $foo
```

Mentre il seguente sarà:

```js
rocess.env.foo = 'bar';
console.log(process.env.foo);
```

Assegnare una proprietà su `process.env` convertirà implicitamente il valore ad una stringa.

Esempio:

```js
process.env.test = null;
console.log(process.env.test);
// => 'null'
process.env.test = undefined;
console.log(process.env.test);
// => 'undefined'
```

Usa `delete` per eliminare una proprietà da `process.env`.

Esempio:

```js
process.env.TEST = 1;
delete process.env.TEST;
console.log(process.env.TEST);
// => undefined
```

Sui sistemi operativi Windows, le variabili di ambiente non fanno distinzione tra maiuscole e minuscole.

Esempio:

```js
process.env.TEST = 1;
console.log(process.env.test);
// => 1
```

## process.execArgv<!-- YAML
added: v0.7.7
-->* {Array}

La proprietà `process.execArgv` restituisce l'insieme delle opzioni della riga di comando specifiche di Node.js passate all'avvio del processo Node.js. Queste opzioni non compaiono nell'array restituito dalla proprietà [`process.argv`][] e non includono l'eseguibile Node.js, il nome dello script o le opzioni che seguono il nome dello script. Queste opzioni sono utili per generare i child process con lo stesso ambiente di esecuzione del parent.

Per esempio:

```console
$ node --harmony script.js --version
```

Risultati in `process.execArgv`:
```js
['--harmony']
```

E `process.argv`:
```js
['/usr/local/bin/node', 'script.js', '--version']
```

## process.execPath<!-- YAML
added: v0.1.100
-->* {string}

La proprietà `process.execPath` restituisce l'absolute pathname dell'eseguibile che ha avviato il processo Node.js.

Per esempio:
```js
'/usr/local/bin/node'
```


## process.exit([code])<!-- YAML
added: v0.1.13
-->* `code` {integer} Il codice di uscita. **Default:** `0`.

Il metodo `process.exit()` indica a Node.js di terminare il processo in modo sincrono con uno stato di uscita di `code`. Se viene omesso `code`, exit utilizza il codice "success" `0` o il valore di `process.exitCode` se è stato impostato. Node.js non terminerà fino a quando tutti gli [`'exit'`] listener di eventi non verranno chiamati.

Per uscire con un codice 'failure':

```js
process.exit(1);
```

La shell che ha eseguito Node.js dovrebbe vedere il codice di uscita come `1`.

Chiamare `process.exit()` forzerà il processo ad uscire il più rapidamente possibile anche se ci sono ancora operazioni asincrone in sospeso che non sono ancora state completate interamente, comprese le operazioni di I/O su `process.stdout` e `process.stderr`.

Nella maggior parte dei casi, in realtà non è necessario chiamare esplicitamente `process.exit()`. Il processo Node.js uscirà da solo *se non ci sono lavori aggiuntivi in sospeso* nel ciclo degli eventi. La proprietà `process.exitCode` può essere impostata per indicare al processo quale codice di uscita utilizzare quando il processo esce in modo corretto.

Ad esempio, il seguente esempio illustra un *misuse* del metodo `process.exit()` che potrebbe portare a dati stampati sullo stdout che vengono troncati e persi:

```js
// Questo è un esempio di quello da *non* fare:
se (someConditionNotMet()) {
  printUsageToStdout();
  process.exit(1);
}
```

Il motivo per cui ciò è problematico è perché le scritture su `process.stdout` in Node.js sono talvolta *asincrone* e possono verificarsi su più tick del ciclo degli eventi di Node.js. Tuttavia, chiamare `process.exit()` forza il processo ad uscire *prima* che quegli scritti aggiuntivi sullo `stdout` possano essere eseguiti.

Piuttosto che chiamare `process.exit()` direttamente, il codice *dovrebbe* impostare `process.exitCode` e consentire al processo di uscire naturalmente evitando di pianificare qualsiasi lavoro aggiuntivo per il ciclo degli eventi:

```js
// Come impostare correttamente il codice di uscita mentre si lascia che
// il processo esca in modo corretto.
se (someConditionNotMet()) {
  printUsageToStdout();
  process.exitCode = 1;
}
```

Se è necessario terminare il processo Node.js a causa di una condizione di errore, lanciare un errore *uncaught* e consentire di conseguenza la chiusura del processo è più sicuro che chiamare `process.exit()`.

## process.exitCode<!-- YAML
added: v0.11.8
-->* {integer}

Un numero che sarà il codice di uscita del processo, quando il processo o esce in modo corretto, o viene chiuso tramite [`process.exit()`][] senza specificare un codice.

Specificando un codice a [`process.exit(code)`][`process.exit()`] sovrascriverà qualsiasi impostazione precedente del `process.exitCode`.


## process.getegid()<!-- YAML
added: v2.0.0
-->Il metodo `process.getegid()` restituisce l'identità numerica effettiva del gruppo del processo Node.js. (See getegid(2).)

```js
se (process.getegid) {
  console.log(`Current gid: ${process.getegid()}`);
}
```

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.geteuid()<!-- YAML
added: v2.0.0
-->* Restituisce: {Object}

Il metodo `process.geteuid()` restituisce l'identità utente numerica effettiva del processo. (See geteuid(2).)

```js
se (process.geteuid) {
  console.log(`Current uid: ${process.geteuid()}`);
}
```

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.getgid()<!-- YAML
added: v0.1.31
-->* Restituisce: {Object}

Il metodo `process.getgid()` restituisce l'identità del gruppo numerico del processo. (See getgid(2).)

```js
se (process.getgid) {
  console.log(`Current gid: ${process.getgid()}`);
}
```

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).


## process.getgroups()<!-- YAML
added: v0.9.4
-->* Restituisce: {Array}

Il metodo `process.getgroups()` restituisce un array con gli ID di gruppo supplementari. POSIX lascia non specificato se sia incluso l'ID di gruppo effettivo ma Node.js garantisce che esso lo sia sempre.

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.getuid()<!-- YAML
added: v0.1.28
-->* Restituisce: {integer}

Il metodo `process.getuid()` restituisce l'identità numerica dell'utente del processo. (See getuid(2).)

```js
se (process.getuid) {
  console.log(`Current uid: ${process.getuid()}`);
}
```

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.hrtime([time])<!-- YAML
added: v0.7.6
-->* `time` {Array} The result of a previous call to `process.hrtime()`
* Restituisce: {Array}

The `process.hrtime()` method returns the current high-resolution real time in a `[seconds, nanoseconds]` tuple Array, where `nanoseconds` is the remaining part of the real time that can't be represented in second precision.

`time` è un parametro opzionale che deve essere il risultato di una precedente chiamata `process.hrtime()` a diff con l'ora corrente. Se il parametro passato non è una tuple Array, un `TypeError` verrà lanciato. Passare in un'array definita dall'utente anziché il risultato di una precedente chiamata a `process.hrtime()` porterà a un comportamento non definito.

Questi tempi sono relativi a un tempo arbitrario nel passato e non correlato all'ora del giorno e quindi non soggetto a deriva dell'orologio. L'uso principale è per misurare le prestazioni tra intervalli:

```js
const NS_PER_SEC = 1e9;
const time = process.hrtime();
// [ 1800216, 25 ]

setTimeout(() => {
  const diff = process.hrtime(time);
  // [ 1, 552 ]

  console.log(`Benchmark took ${diff[0] * NS_PER_SEC + diff[1]} nanoseconds`);
  // il benchmark ha impiegato 1000000552 nanosecondi
}, 1000);
```


## process.initgroups(user, extra_group)<!-- YAML
added: v0.9.4
-->* `user`{string|number} Il nome utente o l'identificatore numerico.
* `extra_group` {string|number} A group name or numeric identifier.

Il metodo `process.initgroups()` legge il file `/etc/group` e inizializza l'elenco di accesso al gruppo, utilizzando tutti i gruppi di cui l'utente è membro. Questa è un'operazione privilegiata che richiede che il processo Node.js abbia l'accesso `root` o la capacità `CAP_SETGID`.

Si noti che occorre prestare attenzione quando si eliminano i privilegi. Esempio:

```js
console.log(process.getgroups());         // [ 0 ]
process.initgroups('bnoordhuis', 1000);   // switch user
console.log(process.getgroups());         // [ 27, 30, 46, 1000, 0 ]
process.setgid(1000);                     // drop root gid
console.log(process.getgroups());         // [ 27, 30, 46, 1000 ]
```

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.kill(pid[, signal])<!-- YAML
added: v0.0.6
-->* `pid` {number} Un ID di processo
* `signal` {string|number} Il segnale da inviare, come una stringa o come un numero. **Default:** `'SIGTERM'`.

Il metodo `process.kill()` invia il `signal` al processo identificato da `pid`.

I nomi dei segnali sono stringhe come `'SIGINT'` o `'SIGHUP'`. Vedi [Signal Events](#process_signal_events) e kill(2) per ulteriori informazioni.

Questo metodo lancerà un errore se il target `pid` non esiste. Come un caso speciale, un segnale di `0` può essere usato per verificare l'esistenza di un processo. Le piattaforme Windows lanceranno un errore se il `pid` viene utilizzato per eseguire il killing di un gruppo di processo.

*Note*: Even though the name of this function is `process.kill()`, it is really just a signal sender, like the `kill` system call. The signal sent may do something other than kill the target process.

Per esempio:

```js
process.on('SIGHUP', () => {
  console.log('Got SIGHUP signal.');
});

setTimeout(() => {
  console.log('Exiting.');
  process.exit(0);
}, 100);

process.kill(process.pid, 'SIGHUP');
```

*Note*: When `SIGUSR1` is received by a Node.js process, Node.js will start the debugger, see [Signal Events](#process_signal_events).

## process.mainModule<!-- YAML
added: v0.1.17
-->* {Object}

La proprietà `process.mainModule` fornisce un modo alternativo per recuperare [`require.main`][]. La differenza è che se il modulo principale cambia al momento dell'esecuzione, [`require.main`][] potrebbe ancora fare riferimento al modulo principale originale nei moduli che erano necessari prima che si verificasse la modifica. In generale, è sicuro supporre che i due si riferiscano allo stesso modulo.

Come con [`require.main`][], `process.mainModule` sarà `undefined` se non c'è nessun entry script.

## process.memoryUsage()<!-- YAML
added: v0.1.16
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9587
    description: Added `external` to the returned object.
-->* Restituisce: {Object}
    * `rss` {integer}
    * `heapTotal` {integer}
    * `heapUsed` {integer}
    * `external` {integer}

Il metodo `process.memoryUsage()` restituisce un object che descrive l'utilizzo della memoria del processo Node.js misurato in byte.

Ad esempio, il codice:

```js
console.log(process.memoryUsage());
```

Genererà:
```js
{
  rss: 4935680,
  heapTotal: 1826816,
  heapUsed: 650472,
  external: 49879
}
```

`heapTotal` e `heapUsed` si riferiscono all'utilizzo della memoria del V8. `external` si riferisce all'utilizzo della memoria dei C++ object legati ai JavaScript object gestiti da V8. `rss`, Resident Set Size, is the amount of space occupied in the main memory device (that is a subset of the total allocated memory) for the process, which includes the _heap_, _code segment_ and _stack_.

L'_heap_ è dove sono memorizzati object, stringhe e chiusure. Le variabili sono memorizzate nello _stack_ e il codice JavaScript reale risiede nel _code segment_.

## process.nextTick(callback[, ...args])<!-- YAML
added: v0.1.26
changes:
  - version: v1.8.1
    pr-url: https://github.com/nodejs/node/pull/1077
    description: Additional arguments after `callback` are now supported.
-->* `callback` {Function}
* `...args` {any} Argomenti aggiuntivi da trasmettere quando si invoca la `callback`

Il metodo `process.nextTick()` aggiunge la `callback` alla "coda di tick successiva". Una volta che il turno corrente del giro del ciclo degli eventi giunge al completamento, tutte le callback attualmente nella coda di tick successiva verranno chiamate.

Questo *non* è un semplice alias per [`setTimeout(fn, 0)`][]. È molto più efficiente. Funziona prima che qualsiasi evento I/O aggiuntivo (inclusi i timer) si accenda nei tick successivi del ciclo degli eventi.

```js
console.log('start');
process.nextTick(() => {
  console.log('nextTick callback');
});
console.log('scheduled');
// Output:
// start
// scheduled
// nextTick callback
```

Questo è importante quando si sviluppano le API per dare agli utenti l'opportunità di assegnare gli event handler *dopo* che è stato costruito un object ma prima che si sia verificato un I/O:

```js
function MyThing(options) {
  this.setupOptions(options);

  process.nextTick(() => {
    this.startDoingStuff();
  });
}

const thing = new MyThing();
thing.getReadyForStuff();

// thing.startDoingStuff() viene chiamato ora, non prima.
```

È molto importante che le API siano al 100% sincrone o al 100% asincrone. Considera questo esempio:

```js
// ATTENZIONE!  NON USARE!  RISCHIO PERICOLOSO E GRAVE!
function maybeSync(arg, cb) {
  if (arg) {
    cb();
    return;
  }

  fs.stat('file', cb);
}
```

Questa API è pericolosa perché nel seguente caso:

```js
const maybeTrue = Math.random() > 0.5;

maybeSync(maybeTrue, () => {
  foo();
});

bar();
```

Non è chiaro se `foo()` o `bar()` saranno chiamato per primi.

Il seguente approccio è notevolmente migliore:

```js
function definitelyAsync(arg, cb) {
  if (arg) {
    process.nextTick(cb);
    return;
  }

  fs.stat('file', cb);
}
```

*Note*: The next tick queue is completely drained on each pass of the event loop **before** additional I/O is processed. As a result, recursively setting nextTick callbacks will block any I/O from happening, just like a `while(true);` loop.

## process.noDeprecation<!-- YAML
added: v0.8.0
-->* {boolean}

La proprietà `process.noDeprecation` indica se il `--no-deprecation` flag è impostato sul processo Node.js corrente. See the documentation for the [`warning` event](#process_event_warning) and the [`emitWarning` method](#process_process_emitwarning_warning_type_code_ctor) for more information about this flag's behavior.

## process.pid<!-- YAML
added: v0.1.15
-->* {integer}

La proprietà `process.pid` restituisce il PID del processo.

```js
console.log(`Questo processo è pid ${process.pid}`);
```

## process.platform<!-- YAML
added: v0.1.16
-->* {string}

La proprietà `process.platform` restituisce una stringa che identifica la piattaforma del sistema operativo su cui è in esecuzione il processo Node.js.

I valori attualmente possibili sono:

* `'aix'`
* `'darwin'`
* `'freebsd'`
* `'linux'`
* `'openbsd'`
* `'sunos'`
* `'win32'`

```js
console.log(`Questa piattaforma è ${process.platform}`);
```

Il valore `'android'` potrebbe anche essere restituito se il Node.js è costruito sul sistema operativo Android. Tuttavia, il supporto Android in Node.js [è sperimentale](https://github.com/nodejs/node/blob/master/BUILDING.md#androidandroid-based-devices-eg-firefox-os).

## process.ppid<!-- YAML
added: v8.10.0
-->* {integer}

La proprietà `process.ppid` restituisce il PID del parent process corrente.

```js
console.log(`Il parent process è pid ${process.ppid}`);
```

## process.release<!-- YAML
added: v3.0.0
changes:
  - version: v4.2.0
    pr-url: https://github.com/nodejs/node/pull/3212
    description: The `lts` property is now supported.
-->* {Object}

The `process.release` property returns an Object containing metadata related to the current release, including URLs for the source tarball and headers-only tarball.

`process.release` contiene le seguenti proprietà:

* `name` {string} Un valore che sarà sempre `'node'` per Node.js. Per le versioni legacy di io.js, questo sarà `'io.js'`.
* `sourceUrl` {string} un absolute URL che punta a un _`.tar.gz`_ file contenente il codice sorgente della versione corrente.
* `headersUrl` {string} un absolute URL che punta a un _`.tar.gz`_ file contenente solo i file sorgente di intestazione per la versione corrente. Questo file è significativamente più piccolo del file sorgente completo e può essere utilizzato per compilare i componenti aggiuntivi nativi di Node.js.
* `libUrl` {string} un absolute URL che punta a un _`node.lib`_ file che corrisponde all'architettura e alla versione del rilascio corrente. Questo file viene utilizzato per compilare i componenti aggiuntivi nativi di Node.js. _Questa proprietà è presente solo nei build di Windows di Node.js e non sarà presente su tutte le altre piattaforme_
* `lts` {string} a string label identifying the [LTS](https://github.com/nodejs/LTS/) label for this release. Questa proprietà esiste solo per le versioni LTS ed è `undefined` per tutti gli altri tipi di rilascio, comprese le versioni _Attuali_. Attualmente i valori validi sono:
  - `'Argon'` per la riga 4.x LTS che inizia con 4.2.0.
  - `'Boron'` per la riga 6.x LTS che inizia con 6.9.0.
  - `'Carbon'` per la riga 8.x LTS che inizia con 8.9.1.

Per esempio:
```js
{
  name: 'node',
  lts: 'Argon',
  sourceUrl: 'https://nodejs.org/download/release/v4.4.5/node-v4.4.5.tar.gz',
  headersUrl: 'https://nodejs.org/download/release/v4.4.5/node-v4.4.5-headers.tar.gz',
  libUrl: 'https://nodejs.org/download/release/v4.4.5/win-x64/node.lib'
}
```

Nelle build personalizzate da versioni non rilasciate del source tree, può essere presente solo la proprietà `name`. Non si dovrebbe contare sul fatto che le proprietà aggiuntive esistano.

## process.send(message\[, sendHandle[, options]\]\[, callback\])<!-- YAML
added: v0.5.9
-->* `message` {Object}
* `sendHandle` {Handle object}
* `options` {Object}
* `callback` {Function}
* Restituisce: {boolean}

Se Node.js viene generato con un canale IPC, il metodo `process.send()` può essere utilizzato per inviare messaggi al parent process. I messaggi saranno ricevuti come un evento [`'messagge'`][] sul [`ChildProcess`][] object del parent.

Se Node.js non è stato generato con un canale IPC, `process.send()` sarà `undefined`.

*Note*: The message goes through serialization and parsing. Il messaggio risultante potrebbe non essere uguale a quello che è stato inviato originariamente.

## process.setegid(id)<!-- YAML
added: v2.0.0
-->* `id` {string|number} Un nome di gruppo o ID

Il metodo `process.setegid()` imposta l'identità di gruppo effettiva del processo. (Vedi setegid(2).) L'`id` può essere passato come un ID numerico o una stringa del nome del gruppo. Se viene specificato un nome di gruppo, questo metodo si blocca durante la risoluzione dell'ID numerico associato.

```js
se (process.getegid && process.setegid) {
  console.log(`Current gid: ${process.getegid()}`);
  try {
    process.setegid(501);
    console.log(`New gid: ${process.getegid()}`);
  } catch (err) {
    console.log(`Failed to set gid: ${err}`);
  }
}
```

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).


## process.seteuid(id)<!-- YAML
added: v2.0.0
-->* `id` {string|number} Un nome utente o ID

Il metodo `process.seteuid()` imposta l'effettiva identità dell'utente del processo. (Vedi seteuid(2).) L'`id` può essere passato come un ID numerico o una stringa del nome utente. Se viene specificato un nome utente, il metodo si blocca durante la risoluzione dell'ID numerico associato.

```js
se (process.geteuid && process.seteuid) {
  console.log(`Current uid: ${process.geteuid()}`);
  try {
    process.seteuid(501);
    console.log(`New uid: ${process.geteuid()}`);
  } catch (err) {
    console.log(`Failed to set uid: ${err}`);
  }
}
```

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.setgid(id)<!-- YAML
added: v0.1.31
-->* `id` {string|number} Il nome di gruppo o ID

Il metodo `process.setgid()` imposta l'identità di gruppo del processo. (Vedi setgid (2).) L'`id` può essere passato come un ID numerico o una stringa di nome di gruppo. Se viene specificato un nome di gruppo, questo metodo si blocca durante la risoluzione dell'ID numerico associato.

```js
se (process.getgid && process.setgid) {
  console.log(`Current gid: ${process.getgid()}`);
  try {
    process.setgid(501);
    console.log(`New gid: ${process.getgid()}`);
  } catch (err) {
    console.log(`Failed to set gid: ${err}`);
  }
}
```

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.setgroups(groups)<!-- YAML
added: v0.9.4
-->* `groups` {Array}

Il metodo `process.setgroups()` imposta gli ID di gruppo supplementari per il processo Node.js. This is a privileged operation that requires the Node.js process to have `root` or the `CAP_SETGID` capability.

I `groups` array possono contenere ID di gruppi numerici, nomi di gruppi o entrambi.

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).

## process.setuid(id)<!-- YAML
added: v0.1.28
-->Il metodo `process.setuid(id)` imposta l'identità dell'utente del processo. (Vedi setuid (2).) L'`id` può essere passato come un ID numerico o una stringa del nome utente. Se viene specificato un nome utente, il metodo si blocca durante la risoluzione dell'ID numerico associato.

```js
se (process.getuid && process.setuid) {
  console.log(`Current uid: ${process.getuid()}`);
  try {
    process.setuid(501);
    console.log(`New uid: ${process.getuid()}`);
  } catch (err) {
    console.log(`Failed to set uid: ${err}`);
  }
}
```

*Note*: This function is only available on POSIX platforms (i.e. not Windows or Android).


## process.stderr

* {Stream}

La proprietà `process.stderr` restituisce uno stream connesso a `stderr` (fd `2`). È un [`net.Socket`][] (che è un [Duplex](stream.html#stream_duplex_and_transform_streams) stream) a meno che fd `2` si riferisca a un file, nel qual caso è un [Writable](stream.html#stream_writable_streams) stream.

*Note*: `process.stderr` differs from other Node.js streams in important ways, see [note on process I/O](process.html#process_a_note_on_process_i_o) for more information.

## process.stdin

* {Stream}

La proprietà `process.stdin` restituisce uno stream connesso a `stdin` (fd `0`). È un [`net.Socket`][] (che è un [Duplex](stream.html#stream_duplex_and_transform_streams) stream) a meno che fd `0` si riferisca a un file, nel qual caso è un
Readable/2> stream.</p> 

Per esempio:



```js
process.stdin.setEncoding('utf8');

process.stdin.on('readable', () => {
  const chunk = process.stdin.read();
  if (chunk !== null) {
    process.stdout.write(`data: ${chunk}`);
  }
});

process.stdin.on('end', () => {
  process.stdout.write('end');
});
```


Come [Duplex](stream.html#stream_duplex_and_transform_streams) stream, `process.stdin` può anche essere utilizzato in modalità "old" compatibile con script scritti per Node.js precedenti alla v0.10. Per ulteriori informazioni consulta [Stream compatibility](stream.html#stream_compatibility_with_older_node_js_versions).

*Note*: In "old" streams mode the `stdin` stream is paused by default, so one must call `process.stdin.resume()` to read from it. Nota anche che la chiamata a `process.stdin.resume()` stessa cambierebbe lo stream in modalità "old".



## process.stdout

* {Stream}

La proprietà `process.stdout` restituisce uno stream connesso a `stdout` (fd `1`). È un [`net.Socket`][] (che è un [Duplex](stream.html#stream_duplex_and_transform_streams) stream) a meno che fd `1` si riferisca a un file, nel qual caso è un [Writable](stream.html#stream_writable_streams) stream.

Ad esempio, per copiare process.stdin a process.stdout:



```js
process.stdin.pipe(process.stdout);
```


*Note*: `process.stdout` differs from other Node.js streams in important ways, see [note on process I/O](process.html#process_a_note_on_process_i_o) for more information.



### Una nota sull'I/O di processo

`process.stdout` e `process.stderr` si differenziano dagli altri Node.js stream in maniere consistenti:

1. They are used internally by [`console.log()`][] and [`console.error()`][], respectively.

2. Writes may be synchronous depending on what the stream is connected to and whether the system is Windows or POSIX:

   - I file: *synchronous* su Windows e POSIX
   - TTY(Terminali): *asynchronous* su Windows, *synchronous* su POSIX
   - Le pipe (e i socket): *synchronous* su Windows, *asynchronous* su POSIX

Questi comportamenti sono in parte dovuti a ragioni storiche, poiché modificarli creerebbe un'incompatibilità a ritroso, ma sono anche previsti da alcuni utenti.

Le scritture sincrone evitano problemi come l'output scritto con `console.log()` o `console.error()` inaspettatamente interlacciato, o non scritto affatto se `process.exit()` viene chiamato prima del completamento di una scrittura asincrona. Vedi [`process.exit()`][] per maggiori informazioni.

***Warning***: Le scritture sincrone bloccano il ciclo degli eventi fino al completamento della scrittura. Questo può essere quasi istantaneo nel caso di output ad un file, ma con un carico di sistema elevato, pipe che non vengono lette dal ricevente o aventi terminali o file system lenti, è possibile che il ciclo degli eventi sia bloccato abbastanza spesso e abbastanza a lungo da avere gravi impatti negativi sulle prestazioni. Questo potrebbe non essere un problema durante la scrittura su una sessione terminale interattiva, ma considera questo con particolare attentenzione quando si esegue la registrazione di produzione sugli output stream del processo.

Per verificare se uno stream è connesso a un contesto [TTY](tty.html#tty_tty), controlla la proprietà `isTTY`.

Ad esempio:


```console
$ node -p "Boolean(process.stdin.isTTY)"
true
$ echo "foo" | node -p "Boolean(process.stdin.isTTY)"
false
$ node -p "Boolean(process.stdout.isTTY)"
true
$ node -p "Boolean(process.stdout.isTTY)" | cat
false
```


Consulta la documentazione [TTY](tty.html#tty_tty) per ulteriori informazioni.



## process.throwDeprecation<!-- YAML
added: v0.9.12
-->* {boolean}

La proprietà `process.throwDeprecation` indica se il `--throw-deprecation` flag è impostato sul processo Node.js corrente. See the documentation for the [`warning` event](#process_event_warning) and the [`emitWarning` method](#process_process_emitwarning_warning_type_code_ctor) for more information about this flag's behavior.



## process.title<!-- YAML
added: v0.1.104
-->* {string}

La proprietà `process.title` restituisce il titolo del processo corrente (cioè restituisce il valore corrente di `ps`). Assegnare un nuovo valore a `process.title` modifica il valore corrente di `ps`.

*Note*: When a new value is assigned, different platforms will impose different maximum length restrictions on the title. Usually such restrictions are quite limited. For instance, on Linux and macOS, `process.title` is limited to the size of the binary name plus the length of the command line arguments because setting the `process.title` overwrites the `argv` memory of the process. Node.js v0.8 allowed for longer process title strings by also overwriting the `environ` memory but that was potentially insecure and confusing in some (rather obscure) cases.



## process.traceDeprecation<!-- YAML
added: v0.8.0
-->* {boolean}

La proprietà `process.traceDeprecation` indica se il `--trace-deprecation` flag è impostato sul processo Node.js corrente. See the documentation for the [`warning` event](#process_event_warning) and the [`emitWarning` method](#process_process_emitwarning_warning_type_code_ctor) for more information about this flag's behavior.



## process.umask([mask])<!-- YAML
added: v0.1.19
-->* `mask` {number}

Il metodo `process.umask()` imposta o restituisce la mask di creazione della modalità file del processo Node.js. I child process ereditano la mask dal parent process. Invocato senza argomento, viene restituita la mask corrente, altrimenti la umask viene impostata sul valore dell'argomento e viene restituita la mask precedente.



```js
const newmask = 0o022;
const oldmask = process.umask(newmask);
console.log(
  `Changed umask from ${oldmask.toString(8)} to ${newmask.toString(8)}`
);
```





## process.uptime()<!-- YAML
added: v0.5.0
-->* Restituisce: {number}

Il metodo `process.uptime()` restituisce il numero di secondi in cui è in esecuzione il processo Node.js corrente.

*Note*: The return value includes fractions of a second. Use `Math.floor()` to get whole seconds.



## process.version<!-- YAML
added: v0.1.3
-->* {string}

La proprietà `process.version` restituisce la stringa di versione Node.js.



```js
console.log(`Version: ${process.version}`);
```




## process.versions<!-- YAML
added: v0.2.0
changes:
  - version: v4.2.0
    pr-url: https://github.com/nodejs/node/pull/3102
    description: The `icu` property is now supported.
-->* {Object}

La proprietà `process.versions` restituisce un object che elenca le stringhe di versione di Node.js e le sue dipendenze. `process.versions.modules` indica la corrente versione ABI, che viene aumentata ogni volta che viene modificata una C++ API. Node.js rifiuterà di caricare i moduli che sono stati compilati con una differente versione ABI del modulo.



```js
console.log(process.versions);
```


Genererà un object simile a:


```js
{ http_parser: '2.7.0',
  node: '8.9.0',
  v8: '6.3.292.48-node.6',
  uv: '1.18.0',
  zlib: '1.2.11',
  ares: '1.13.0',
  modules: '60',
  nghttp2: '1.29.0',
  napi: '2',
  openssl: '1.0.2n',
  icu: '60.1',
  unicode: '10.0',
  cldr: '32.0',
  tz: '2016b' }
```




## Exit Codes

Node.js uscirà normalmente con un codice di stato `0` quando non ci saranno più operazioni asincrone in sospeso. I seguenti codici di stato sono utilizzati in altri casi:

* `1` **Uncaught Fatal Exception** - Si è verificata un'eccezione non rilevata e non è stata gestita da un dominio o da un [`'uncaughtException'`][] event handler.

* `2` - Inutilizzato (riservato da Bash per uso improprio incorporato)

* `3` **Internal JavaScript Parse Error** - Il codice sorgente JavaScript interno al processo di bootstrap di Node.js ha causato un errore di analisi. Questo è estremamente raro e generalmente può accadere solo durante lo sviluppo di Node.js stesso.

* `4` **Internal JavaScript Evaluation Failure** - Il codice sorgente JavaScript interno nel processo di bootstrap di Node.js non è riuscito a restituire un valore di funzione quando è stato esaminato. Questo è estremamente raro e generalmente può accadere solo durante lo sviluppo di Node.js stesso.

* `5` **Fatal Error** - C'è stato un errore irreversibile fatale nel V8. Generalmente un messaggio verrà stampato su stderr con il prefisso `FATAL ERROR`.

* `6` **Non-function Internal Exception Handler** - C'è stata un'eccezione non rilevata, ma la funzione di internal fatal exception handler era in qualche modo impostata su una non funzione e non poteva essere chiamata.

* `7` **Internal Exception Handler Run-Time Failure** - C'è stata una eccezione non rilevata e la stessa funzione internal fatal exception handler ha lanciato un errore durante il tentativo di gestirla. This can happen, for example, if a [`'uncaughtException'`][] or `domain.on('error')` handler throws an error.

* `8` - Non utilizzato. Nelle versioni precedenti di Node.js, il codice di uscita 8 indicava a volte un'eccezione non rilevata.

* `9` - **Invalid Argument** - È stata specificata un'opzione sconosciuta oppure è stata fornita un'opzione che richiedeva un valore senza un valore.

* `10` **Internal JavaScript Run-Time Failure** - Il codice sorgente JavaScript interno al processo di bootstrap di Node.js ha lanciato un errore quando è stata chiamata la funzione bootstrap. Questo è estremamente raro e generalmente può accadere solo durante lo sviluppo di Node.js stesso.

* `12` **Invalid Debug Argument** - Sono state impostate le opzioni `--inspect` e/o `--inspect-brk`, ma il numero di porta scelto non era valido o non era disponibile.

* `>128` **Signal Exits** - Se Node.js riceve un segnale fatale come `SIGKILL` o `SIGHUP`, il suo codice di uscita sarà `128` più il valore del codice segnale. Questa è una pratica POSIX standard, poiché i codici di uscita sono definiti come interi a 7 bit e le uscite di segnale impostano il bit di ordine superiore e quindi contengono il valore del codice di segnale.
